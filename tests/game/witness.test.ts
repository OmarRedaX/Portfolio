import test from "node:test";
import assert from "node:assert/strict";
import { replay, timingWindow, walkOffWitness, witness } from "../../lib/game/witness";
import type { Surface, Tuning } from "../../lib/game/model";
import { spawn, step } from "../../lib/game/physics";

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

test("the sweep starts at the far edge, so a short hop from a 96 px ledge is comfortable", () => {
  const a = flat("a", 100, 96),
    b = flat("b", 244, 96);
  assert.ok(timingWindow(a, b, [a, b], [], tuning, 1440, 12).frames >= 36);
});

test("a rise onto a narrow ledge above the takeoff is steered onto from every departure x", () => {
  const low = flat("low", 100, 48, 500),
    lane = flat("lane", 100, 32, 410);
  assert.ok(timingWindow(low, lane, [low, lane], [], tuning, 1440, 12).frames >= 18);
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

test("a drop onto a ledge under the takeoff centre walks off the open side and steers back", () => {
  const lane = flat("lane", 100, 32, 400),
    low = flat("low", 100, 48, 500);
  const content = [{ x: 164, y: 200, width: 300, height: 180 }];
  assert.equal(witness(lane, low, [lane, low], content, tuning, 1440, 12), null);
  const drop = walkOffWitness(lane, low, [lane, low], content, tuning, 1440, 12);
  assert.ok(drop && replay(drop, [lane, low], tuning));
  assert.ok(drop.frames.every((input) => !input.jumpPressed));
});

test("a swept witness replays frame for frame from the takeoff spawn along its corridor", () => {
  const a = flat("a", 100, 160),
    b = flat("b", 330, 64, 470);
  const w = timingWindow(a, b, [a, b], [], tuning, 1440, 12);
  assert.ok(w.best);
  let body = spawn(a, tuning);
  w.best.frames.forEach((input, i) => {
    body = step(body, input, [a, b], tuning).body;
    assert.deepEqual(
      { x: body.x, y: body.y },
      { x: w.best!.corridor[i].x, y: w.best!.corridor[i].y },
      `frame ${i}`,
    );
  });
  assert.equal(body.groundedOn, "b");
});
