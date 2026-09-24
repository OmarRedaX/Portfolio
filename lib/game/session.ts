import type { Body, Rect, Surface, PauseReason, SessionEffect, SessionEvent, SessionState } from "./model";

export function ownsGameKey(defaultPrevented: boolean, path: readonly unknown[], host: unknown): boolean {
  return !defaultPrevented && path.includes(host) && !path.some((node) => {
    if (node === host || !node || typeof node !== "object" || !("matches" in node)) return false;
    return (node as Element).matches('a, button, input, textarea, select, summary, [role="button"], [contenteditable]:not([contenteditable="false"])');
  });
}

export function restoreSupport(body: Body, previous: readonly Surface[], next: readonly Surface[], obstacles: readonly Rect[], viewportWidth: number): Body | null {
  const old = previous.find((surface) => surface.id === body.groundedOn);
  const support = next.find((surface) => surface.id === body.groundedOn);
  if (!old || !support) return null;
  const x = support.x + body.x - old.x;
  const candidate = { ...body, x, y: support.y - body.height, vx: 0, vy: 0 };
  // One-way physics supports any positive horizontal overlap, including a
  // centered body wider than its helper. Clearance still applies to the body.
  if (x >= support.x + support.width || x + body.width <= support.x) return null;
  if (x < 0 || x + body.width > viewportWidth) return null;
  if (obstacles.some((rect) => candidate.x < rect.x + rect.width && candidate.x + candidate.width > rect.x && candidate.y < rect.y + rect.height && candidate.y + candidate.height > rect.y)) return null;
  return candidate;
}

const resetEffects: SessionEffect[] = ["clear-input", "clear-velocity"];

export function createSession(): SessionState {
  return {
    phase: "off",
    reasons: [],
    checkpoint: null,
    operation: 0,
    layoutValid: false,
    reposition: null,
  };
}

export function transition(
  state: SessionState,
  event: SessionEvent,
): { state: SessionState; effects: SessionEffect[] } {
  switch (event.type) {
    case "OPEN":
      return state.phase === "off"
        ? result({ ...state, phase: "confirming" })
        : result(state);

    case "CONTINUE":
      return state.phase === "confirming"
        ? result(beginReposition(state, "spawn"), [
            "clear-input",
            "clear-velocity",
            "validate",
            "reposition",
          ])
        : result(state);

    case "EXIT":
      return result(
        {
          ...createSession(),
          operation: state.operation + 1,
        },
        [...resetEffects, "dispose"],
      );

    case "PAUSE":
      return state.phase === "off" ? result(state) : pause(state, event.reason);

    case "CLEAR_REASON":
      return result({
        ...state,
        reasons: state.reasons.filter((reason) => reason !== event.reason),
      });

    case "VALIDATED":
      if (state.phase === "off") return result(state);
      if (event.valid) {
        return result({
          ...state,
          layoutValid: true,
          reasons: state.reasons.filter((reason) => reason !== "layout"),
        });
      }
      return pause({ ...state, layoutValid: false }, "layout");

    case "RESUME":
      return state.phase === "paused" && state.reasons.length === 0 && state.layoutValid
        ? result(beginReposition(state, "resume"), [...resetEffects, "reposition"])
        : result(state);

    case "REPOSITION":
      return state.phase === "playing"
        ? result(beginReposition(state, event.owner), [...resetEffects, "reposition"])
        : result(state);

    case "SETTLED":
      return event.operation === state.operation &&
        state.phase === "repositioning" &&
        state.reasons.length === 0 &&
        state.layoutValid
        ? result({ ...state, phase: "playing", reposition: null })
        : result(state);

    case "CHECKPOINT":
      return state.phase === "off"
        ? result(state)
        : result({ ...state, checkpoint: event.id });

    default:
      return exhaustive(event);
  }
}

function beginReposition(
  state: SessionState,
  owner: SessionState["reposition"],
): SessionState {
  return {
    ...state,
    phase: "repositioning",
    operation: state.operation + 1,
    reposition: owner,
  };
}

function pause(
  state: SessionState,
  reason: PauseReason,
): { state: SessionState; effects: SessionEffect[] } {
  return result(
    {
      ...state,
      phase: "paused",
      reasons: state.reasons.includes(reason)
        ? state.reasons
        : [...state.reasons, reason],
      operation: state.operation + 1,
      reposition: null,
    },
    resetEffects,
  );
}

function result(
  state: SessionState,
  effects: SessionEffect[] = [],
): { state: SessionState; effects: SessionEffect[] } {
  return { state, effects };
}

function exhaustive(event: never): never {
  throw new Error(`Unhandled session event: ${JSON.stringify(event)}`);
}
