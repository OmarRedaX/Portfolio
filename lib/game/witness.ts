import type { Body, Connection, Input, Rect, Surface, Tuning } from "./model";
import { spawn, step } from "./physics";

export const maxSurfaces = 160;
export const maxWitnessFrames = 180;

export const clearOf = (a: Rect, b: Rect, margin = 0) =>
  a.x + a.width <= b.x - margin ||
  a.x >= b.x + b.width + margin ||
  a.y + a.height <= b.y - margin ||
  a.y >= b.y + b.height + margin;

export const bodyRect = (body: Body): Rect => ({
  x: body.x,
  y: body.y,
  width: body.width,
  height: body.height,
});

export function apex(tuning: Tuning): number {
  let vy = -tuning.jumpSpeed,
    height = 0,
    greatest = 0;
  for (let frame = 0; frame < maxWitnessFrames && vy < 0; frame++) {
    vy += tuning.gravity * tuning.step;
    height -= vy * tuning.step;
    greatest = Math.max(greatest, height);
  }
  return greatest;
}

type Mode = "jump-to" | "vertical" | "walk-to" | "jump-dodge" | "walk-off";

export function witness(
  from: Surface,
  to: Surface,
  surfaces: readonly Surface[],
  obstacles: readonly Rect[],
  tuning: Tuning,
  viewportWidth: number,
  clearance = 2,
): Connection | null {
  const shift = Math.sign(to.x + to.width / 2 - (from.x + from.width / 2));
  const modes: Mode[] =
    to.y < from.y
      ? ["jump-to", "vertical"]
      : shift
        ? ["walk-to", "jump-to", "jump-dodge"]
        : ["walk-off", "jump-dodge"];
  return prove(modes, from, to, surfaces, obstacles, tuning, viewportWidth, clearance);
}

// A drop onto a ledge beneath the takeoff centre, leaving by the viewport-edge
// side: the only departure that keeps clear of content beside a narrow lane.
export function walkOffWitness(
  from: Surface,
  to: Surface,
  surfaces: readonly Surface[],
  obstacles: readonly Rect[],
  tuning: Tuning,
  viewportWidth: number,
  clearance = 2,
): Connection | null {
  const center = from.x + from.width / 2;
  if (to.y <= from.y || center < to.x || center > to.x + to.width) return null;
  return prove(
    ["walk-off"],
    from,
    to,
    surfaces,
    obstacles,
    tuning,
    viewportWidth,
    clearance,
  );
}

function prove(
  modes: readonly Mode[],
  from: Surface,
  to: Surface,
  surfaces: readonly Surface[],
  obstacles: readonly Rect[],
  tuning: Tuning,
  viewportWidth: number,
  clearance: number,
): Connection | null {
  const shift = Math.sign(to.x + to.width / 2 - (from.x + from.width / 2)) as -1 | 0 | 1;
  const departure: -1 | 1 = from.x < viewportWidth / 2 ? -1 : 1;
  for (const mode of modes) {
    let body = spawn(from, tuning);
    const frames: Input[] = [];
    const corridor: Rect[] = [];
    let escaped = false;
    let returned = false;
    const center = body.x;
    const dodgeX = shift || 1;
    const upper = surfaces
      .filter(
        (s) =>
          s.id !== from.id &&
          s.y < from.y &&
          s.x < from.x + from.width &&
          s.x + s.width > from.x,
      )
      .sort((a, b) => b.y - a.y)[0];
    for (let frame = 0; frame < maxWitnessFrames; frame++) {
      let direction: -1 | 0 | 1 = 0;
      let jumpPressed = false;
      if (mode === "vertical") jumpPressed = frame === 0;
      if (mode === "jump-to") {
        jumpPressed = frame === 0;
        direction = shift && !returned ? shift : 0;
        const desired = shift > 0 ? to.x + 2 : to.x + to.width - tuning.bodyWidth - 2;
        if (shift && body.x * shift >= desired * shift) returned = true;
      }
      if (mode === "walk-to") direction = shift;
      if (mode === "walk-off") {
        direction = !escaped
          ? departure
          : body.y + body.height <= from.y + 2
            ? 0
            : (body.x - center) * departure > 1e-6
              ? (-departure as -1 | 1)
              : 0;
      }
      if (mode === "jump-dodge") {
        jumpPressed = frame === 0;
        const bottom = body.y + body.height;
        const safeToReturn =
          body.vy > 0 && bottom > from.y + 2 && (!upper || bottom > upper.y + 2);
        if (shift < 0) {
          direction = !safeToReturn
            ? body.x + body.width > from.x - 2 * tuning.bodyWidth - 4
              ? -1
              : 0
            : body.x < to.x + (to.width - body.width) / 2
              ? 1
              : 0;
        } else {
          direction = (
            !safeToReturn && body.x < from.x + from.width + 2
              ? dodgeX
              : body.x > center + 1e-6
                ? -dodgeX
                : 0
          ) as -1 | 0 | 1;
        }
      }
      const input: Input = { direction, jumpPressed };
      const next = step(body, input, surfaces, tuning).body;
      frames.push(input);
      corridor.push(bodyRect(next));
      if (!escaped && next.groundedOn === null) escaped = true;
      if (
        next.x < 0 ||
        next.x + next.width > viewportWidth ||
        obstacles.some((obstacle) => !clearOf(bodyRect(next), obstacle, clearance))
      )
        break;
      body = next;
      if (body.groundedOn === to.id)
        return { from: from.id, to: to.id, frames, corridor };
      if (body.groundedOn && body.groundedOn !== from.id) break;
      if (mode === "walk-off" && escaped && (body.x - center) * departure <= 1e-6) {
        // Keep the body centered after the one-way departure.
        for (let extra = 0; extra < maxWitnessFrames - frame - 1; extra++) {
          const still: Input = { direction: 0, jumpPressed: false };
          body = step(body, still, surfaces, tuning).body;
          frames.push(still);
          corridor.push(bodyRect(body));
          if (obstacles.some((obstacle) => !clearOf(bodyRect(body), obstacle, clearance)))
            break;
          if (body.groundedOn === to.id)
            return { from: from.id, to: to.id, frames, corridor };
          if (body.groundedOn) break;
        }
        break;
      }
    }
  }
  return null;
}

export function replay(
  connection: Connection,
  surfaces: readonly Surface[],
  tuning: Tuning,
): boolean {
  const from = surfaces.find((surface) => surface.id === connection.from);
  if (!from) return false;
  let body = spawn(from, tuning);
  for (const input of connection.frames) body = step(body, input, surfaces, tuning).body;
  return body.groundedOn === connection.to;
}

export type TimingWindow = {
  frames: number;
  best: Connection | null;
  outcomes: Array<string | null>;
};

type Press = { outcome: string | null; connection: Connection; clear: boolean };

// Presses are swept from the far edge of the takeoff (bounded by the walk
// budget) so the sweep covers departure x, not only press timing. The walk
// back from the spawn is recorded so every press replays from the spawn.
function sweepStart(
  from: Surface,
  direction: -1 | 1,
  surfaces: readonly Surface[],
  tuning: Tuning,
): { body: Body; frames: Input[]; corridor: Rect[] } {
  const run = 90 * tuning.speed * tuning.step;
  const x =
    direction > 0
      ? Math.max(from.x, from.x + from.width - run)
      : Math.min(from.x + from.width - tuning.bodyWidth, from.x - tuning.bodyWidth + run);
  let body = spawn(from, tuning);
  const frames: Input[] = [];
  const corridor: Rect[] = [];
  const back: Input = { direction: -direction as -1 | 1, jumpPressed: false };
  while ((body.x - x) * direction > tuning.speed * tuning.step) {
    body = step(body, back, surfaces, tuning).body;
    frames.push(back);
    corridor.push(bodyRect(body));
  }
  return { body, frames, corridor };
}

// The walk before a press is identical for every press, so it is simulated
// once; each press branches from the lead state at its frame.
type Lead = {
  direction: -1 | 1;
  frames: Input[];
  corridor: Rect[];
  offset: number;
  states: Array<{
    body: Body;
    clear: boolean;
    airborne: boolean;
    ended?: { outcome: string | null; at: number };
  }>;
};

function press(
  frame: number,
  lead: Lead,
  from: Surface,
  to: Surface,
  surfaces: readonly Surface[],
  obstacles: readonly Rect[],
  tuning: Tuning,
  viewportWidth: number,
  clearance: number,
): Press {
  const state = lead.states[frame];
  let { body, clear, airborne } = state;
  const frames = lead.frames.slice(0, lead.offset + (state.ended?.at ?? frame));
  const corridor = lead.corridor.slice(0, frames.length);
  const done = (outcome: string | null): Press => ({
    outcome,
    clear,
    connection: { from: from.id, to: to.id, frames, corridor },
  });
  if (state.ended) return done(state.ended.outcome);
  const lowest = Math.max(...surfaces.map((surface) => surface.y));
  const middle = to.x + to.width / 2;
  const half = Math.max(1, to.width / 2 - tuning.bodyWidth / 2);
  for (let i = frame; i < frame + maxWitnessFrames; i++) {
    const pressed = i === frame && body.groundedOn === from.id;
    const offset = body.x + body.width / 2 - middle;
    const steer: -1 | 0 | 1 =
      i <= frame ? lead.direction : offset < -half ? 1 : offset > half ? -1 : 0;
    const input: Input = { direction: steer, jumpPressed: pressed };
    body = step(body, input, surfaces, tuning).body;
    frames.push(input);
    corridor.push(bodyRect(body));
    if (obstacles.some((obstacle) => !clearOf(bodyRect(body), obstacle, clearance)))
      clear = false;
    if (body.x < 0 || body.x + body.width > viewportWidth || body.y > lowest)
      return done(null);
    if (body.groundedOn === null) airborne = true;
    else if (body.groundedOn !== from.id || airborne) return done(body.groundedOn);
  }
  return done(null);
}

export function timingWindow(
  from: Surface,
  to: Surface,
  surfaces: readonly Surface[],
  obstacles: readonly Rect[],
  tuning: Tuning,
  viewportWidth: number,
  clearance: number,
): TimingWindow {
  const direction: -1 | 1 = to.x + to.width / 2 < from.x + from.width / 2 ? -1 : 1;
  // One press never lifts the feet above the apex, so higher tops and
  // obstacles can never be touched; leaving them out only saves work.
  const ceiling = from.y - apex(tuning) - 1;
  surfaces = surfaces.filter((surface) => surface.y >= ceiling);
  obstacles = obstacles.filter(
    (rect) => rect.y + rect.height + clearance >= ceiling - tuning.bodyHeight,
  );
  const start = sweepStart(from, direction, surfaces, tuning);
  const walk: Input = { direction, jumpPressed: false };
  const lowest = Math.max(...surfaces.map((surface) => surface.y));
  const lead: Lead = {
    direction,
    frames: [...start.frames],
    corridor: [...start.corridor],
    offset: start.frames.length,
    states: [{ body: start.body, clear: true, airborne: false }],
  };
  let walker = lead.states[0];
  while (
    lead.states.length <= 90 &&
    walker.body.x < from.x + from.width &&
    walker.body.x + walker.body.width > from.x
  ) {
    const body = step(walker.body, walk, surfaces, tuning).body;
    const i = lead.states.length - 1;
    const clear =
      walker.clear &&
      obstacles.every((obstacle) => clearOf(bodyRect(body), obstacle, clearance));
    const escaped = body.x < 0 || body.x + body.width > viewportWidth || body.y > lowest;
    const landed =
      body.groundedOn !== null && (body.groundedOn !== from.id || walker.airborne);
    walker = {
      body,
      clear,
      airborne: walker.airborne || body.groundedOn === null,
      ended:
        walker.ended ??
        (escaped
          ? { outcome: null, at: i + 1 }
          : landed
            ? { outcome: body.groundedOn, at: i + 1 }
            : undefined),
    };
    lead.frames.push(walk);
    lead.corridor.push(bodyRect(body));
    lead.states.push(walker);
  }
  const last = lead.states.length - 1;
  const presses: Press[] = [];
  for (let frame = 0; frame <= last; frame++)
    presses.push(
      press(frame, lead, from, to, surfaces, obstacles, tuning, viewportWidth, clearance),
    );
  let run = { start: 0, length: 0 };
  for (let start = 0; start < presses.length;) {
    let end = start;
    while (end < presses.length && presses[end].outcome === to.id && presses[end].clear)
      end++;
    if (end - start > run.length) run = { start, length: end - start };
    start = Math.max(end, start + 1);
  }
  return {
    frames: run.length,
    best: run.length
      ? presses[run.start + Math.floor((run.length - 1) / 2)].connection
      : null,
    outcomes: presses.map((p) => p.outcome),
  };
}
