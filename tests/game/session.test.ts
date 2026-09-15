import test from "node:test";
import assert from "node:assert/strict";
import { createSession, transition } from "../../lib/game/session";

test("clearing focus pause never resumes", () => {
  const playing = {
    ...createSession(),
    phase: "playing" as const,
    layoutValid: true,
    checkpoint: "hero",
  };
  const paused = transition(playing, { type: "PAUSE", reason: "focus" }).state;
  const cleared = transition(paused, { type: "CLEAR_REASON", reason: "focus" }).state;
  assert.equal(cleared.phase, "paused");
  assert.equal(transition(cleared, { type: "RESUME" }).state.phase, "repositioning");
});

test("continue validates and starts a spawn reposition without playing", () => {
  const confirming = transition(createSession(), { type: "OPEN" }).state;
  const result = transition(confirming, { type: "CONTINUE" });
  assert.equal(result.state.phase, "repositioning");
  assert.equal(result.state.reposition, "spawn");
  assert.equal(result.state.operation, 1);
  assert.deepEqual(result.effects, [
    "clear-input",
    "clear-velocity",
    "validate",
    "reposition",
  ]);
  assert.equal(
    transition(result.state, { type: "SETTLED", operation: 1 }).state.phase,
    "repositioning",
  );
});

test("stale settlement after a focus pause cannot resume play", () => {
  const repositioning = {
    ...createSession(),
    phase: "repositioning" as const,
    operation: 4,
    layoutValid: true,
    checkpoint: "about",
  };
  const paused = transition(repositioning, { type: "PAUSE", reason: "focus" });
  assert.equal(paused.state.operation, 5);
  assert.equal(paused.state.checkpoint, "about");
  assert.deepEqual(paused.effects, ["clear-input", "clear-velocity"]);
  assert.equal(
    transition(paused.state, { type: "SETTLED", operation: 4 }).state.phase,
    "paused",
  );
});

test("exit invalidates settlement work and disposes the session", () => {
  const repositioning = {
    ...createSession(),
    phase: "repositioning" as const,
    operation: 7,
    layoutValid: true,
    checkpoint: "projects",
  };
  const exited = transition(repositioning, { type: "EXIT" });
  assert.equal(exited.state.phase, "off");
  assert.equal(exited.state.operation, 8);
  assert.equal(exited.state.checkpoint, null);
  assert.deepEqual(exited.effects, ["clear-input", "clear-velocity", "dispose"]);
  assert.equal(
    transition(exited.state, { type: "SETTLED", operation: 7 }).state.phase,
    "off",
  );
});

test("repeated pauses retain unique blockers and invalidate each operation", () => {
  const playing = {
    ...createSession(),
    phase: "playing" as const,
    operation: 2,
    layoutValid: true,
    checkpoint: "hero",
  };
  const first = transition(playing, { type: "PAUSE", reason: "focus" }).state;
  const second = transition(first, { type: "PAUSE", reason: "focus" }).state;
  assert.deepEqual(second.reasons, ["focus"]);
  assert.equal(second.operation, 4);
  assert.equal(second.checkpoint, "hero");
});

test("invalid layout pauses and a later valid result never resumes automatically", () => {
  const playing = {
    ...createSession(),
    phase: "playing" as const,
    operation: 3,
    layoutValid: true,
  };
  const invalid = transition(playing, { type: "VALIDATED", valid: false });
  assert.equal(invalid.state.phase, "paused");
  assert.equal(invalid.state.layoutValid, false);
  assert.deepEqual(invalid.state.reasons, ["layout"]);
  const valid = transition(invalid.state, { type: "VALIDATED", valid: true });
  assert.equal(valid.state.phase, "paused");
  assert.deepEqual(valid.state.reasons, []);
  assert.equal(valid.state.layoutValid, true);
});

test("resume requires a valid layout and no blockers", () => {
  const paused = {
    ...createSession(),
    phase: "paused" as const,
    reasons: [],
    layoutValid: false,
    operation: 1,
  };
  assert.equal(transition(paused, { type: "RESUME" }).state.phase, "paused");
  const ready = { ...paused, layoutValid: true };
  const resumed = transition(ready, { type: "RESUME" });
  assert.equal(resumed.state.phase, "repositioning");
  assert.equal(resumed.state.reposition, "resume");
  assert.deepEqual(resumed.effects, ["clear-input", "clear-velocity", "reposition"]);
});

test("recovery can settle only while uninterrupted, while exit does not recover", () => {
  const playing = {
    ...createSession(),
    phase: "playing" as const,
    operation: 10,
    layoutValid: true,
    checkpoint: "tech-stack",
  };
  const recovery = transition(playing, { type: "REPOSITION", owner: "recovery" });
  assert.equal(recovery.state.phase, "repositioning");
  assert.equal(recovery.state.reposition, "recovery");
  const settled = transition(recovery.state, {
    type: "SETTLED",
    operation: recovery.state.operation,
  }).state;
  assert.equal(settled.phase, "playing");
  const exited = transition(recovery.state, { type: "EXIT" }).state;
  assert.equal(exited.phase, "off");
});

test("checkpoint updates survive pauses and repositioning", () => {
  const playing = { ...createSession(), phase: "playing" as const, layoutValid: true };
  const checkpointed = transition(playing, {
    type: "CHECKPOINT",
    id: "experience",
  }).state;
  const paused = transition(checkpointed, { type: "PAUSE", reason: "browsing" }).state;
  assert.equal(paused.checkpoint, "experience");
  const cleared = transition(paused, { type: "CLEAR_REASON", reason: "browsing" }).state;
  assert.equal(transition(cleared, { type: "RESUME" }).state.checkpoint, "experience");
});
