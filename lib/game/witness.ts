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

export function witness(
  from: Surface,
  to: Surface,
  surfaces: readonly Surface[],
  obstacles: readonly Rect[],
  tuning: Tuning,
  viewportWidth: number,
  clearance = 2,
): Connection | null {
  const rising = to.y < from.y;
  const shift = Math.sign(to.x + to.width / 2 - (from.x + from.width / 2)) as -1 | 0 | 1;
  const modes = rising
    ? ["jump-to", "vertical"]
    : shift
      ? ["walk-to", "jump-to", "jump-dodge"]
      : ["walk-off", "jump-dodge"];
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

function press(
  frame: number,
  direction: -1 | 1,
  from: Surface,
  to: Surface,
  surfaces: readonly Surface[],
  obstacles: readonly Rect[],
  tuning: Tuning,
  viewportWidth: number,
  clearance: number,
): Press {
  let body = spawn(from, tuning);
  const frames: Input[] = [];
  const corridor: Rect[] = [];
  const lowest = Math.max(...surfaces.map((surface) => surface.y));
  const settle = {
    left: to.x + tuning.bodyWidth / 2,
    right: to.x + to.width - tuning.bodyWidth / 2,
  };
  let airborne = false;
  let steering = true;
  let clear = true;
  const done = (outcome: string | null): Press => ({
    outcome,
    clear,
    connection: { from: from.id, to: to.id, frames, corridor },
  });
  for (let i = 0; i < frame + maxWitnessFrames; i++) {
    const pressed = i === frame && body.groundedOn === from.id;
    if (i > frame) {
      const center = body.x + body.width / 2;
      if (center >= settle.left && center <= settle.right) steering = false;
    }
    const input: Input = { direction: steering ? direction : 0, jumpPressed: pressed };
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
  let walker = spawn(from, tuning);
  let last = 0;
  while (
    last < 90 &&
    walker.x < from.x + from.width &&
    walker.x + walker.width > from.x
  ) {
    walker = step(walker, { direction, jumpPressed: false }, surfaces, tuning).body;
    last++;
  }
  const presses: Press[] = [];
  for (let frame = 0; frame <= last; frame++)
    presses.push(
      press(
        frame,
        direction,
        from,
        to,
        surfaces,
        obstacles,
        tuning,
        viewportWidth,
        clearance,
      ),
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
