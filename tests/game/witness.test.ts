import test from "node:test";
import assert from "node:assert/strict";
import { replay, timingWindow } from "../../lib/game/witness";
import type { Surface, Tuning } from "../../lib/game/model";

const tuning: Tuning = {
  step: 1 / 120,
  speed: 240,
  gravity: 1100,
  jumpSpeed: 580,
  bodyWidth: 24,
  bodyHeight: 32,
  landingMargin: 2,
  reachX: 110,
  reachY: 150,
};

const flat = (id: string, x: number, width: number, y = 500): Surface => ({
  id,
  section: "about",
  x,
  y,
  width,
  checkpoint: false,
});

test("a short level gap has a wide window, a long gap a narrow one, and an impossible gap none", () => {
  const a = flat("a", 100, 96);
  const near = timingWindow(
    a,
    flat("b", 244, 96),
    [a, flat("b", 244, 96)],
    [],
    tuning,
    1440,
    12,
  );
  const far = timingWindow(
    a,
    flat("c", 196 + 244, 48),
    [a, flat("c", 440, 48)],
    [],
    tuning,
    1440,
    12,
  );
  const none = timingWindow(
    a,
    flat("d", 196 + 300, 96),
    [a, flat("d", 496, 96)],
    [],
    tuning,
    1440,
    12,
  );
  assert.ok(near.frames >= 24);
  assert.ok(far.frames > 0 && far.frames < near.frames);
  assert.equal(none.frames, 0);
  assert.equal(none.best, null);
});

test("the returned witness is the centre of the longest window and replays", () => {
  const a = flat("a", 100, 96),
    b = flat("b", 244, 96);
  const w = timingWindow(a, b, [a, b], [], tuning, 1440, 12);
  assert.ok(w.best && replay(w.best, [a, b], tuning));
});

test("failing presses report where the body landed, including a catch floor", () => {
  const a = flat("a", 100, 96),
    b = flat("b", 366, 48),
    floor = flat("floor", 60, 500, 620);
  const w = timingWindow(a, b, [a, b, floor], [], tuning, 1440, 12);
  assert.ok(w.outcomes.some((o) => o === "floor"));
  assert.ok(w.outcomes.every((o) => o === "b" || o === "floor" || o === "a"));
});

test("a success that crosses a keep-out does not count", () => {
  const a = flat("a", 100, 96),
    b = flat("b", 244, 96);
  const w = timingWindow(
    a,
    b,
    [a, b],
    [{ x: 190, y: 380, width: 60, height: 60 }],
    tuning,
    1440,
    12,
  );
  assert.equal(w.frames, 0);
});
