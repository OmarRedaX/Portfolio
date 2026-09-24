import type { Body, Input, StepResult, Surface, Tuning } from './model';

export function spawn(surface: Surface, tuning: Tuning): Body {
  return {
    x: surface.x + (surface.width - tuning.bodyWidth) / 2,
    y: surface.y - tuning.bodyHeight,
    width: tuning.bodyWidth,
    height: tuning.bodyHeight,
    vx: 0,
    vy: 0,
    groundedOn: surface.id,
  };
}

export function step(body: Body, input: Input, surfaces: readonly Surface[], tuning: Tuning): StepResult {
  const vx = input.direction * tuning.speed;
  const nextX = body.x + vx * tuning.step;
  const support = surfaces.find((surface) => surface.id === body.groundedOn);
  const supported = support !== undefined &&
    nextX < support.x + support.width && nextX + body.width > support.x;

  if (supported && !input.jumpPressed) {
    return { body: { ...body, x: nextX, y: support.y - body.height, vx, vy: 0 }, landedOn: null };
  }

  const jumped = supported && input.jumpPressed;
  const startingVy = jumped ? -tuning.jumpSpeed : body.vy;
  const vy = startingVy + tuning.gravity * tuning.step;
  const nextY = body.y + vy * tuning.step;
  const previousBottom = body.y + body.height;
  const nextBottom = nextY + body.height;
  let landing: Surface | null = null;
  let landingFraction = Infinity;

  if (vy >= 0 && nextBottom > previousBottom) {
    for (const surface of surfaces) {
      // Once horizontal movement has left the current support, its top is
      // behind the body. Do not treat the starting contact as a new landing.
      if (surface.id === body.groundedOn) continue;
      if (previousBottom > surface.y || nextBottom < surface.y) continue;
      const fraction = (surface.y - previousBottom) / (nextBottom - previousBottom);
      if (fraction < 0 || fraction > 1) continue;
      const crossingX = body.x + (nextX - body.x) * fraction;
      if (crossingX >= surface.x + surface.width || crossingX + body.width <= surface.x) continue;
      if (fraction < landingFraction) {
        landing = surface;
        landingFraction = fraction;
      }
    }
  }

  if (landing) {
    return { body: { ...body, x: nextX, y: landing.y - body.height, vx, vy: 0, groundedOn: landing.id }, landedOn: landing.id };
  }

  return { body: { ...body, x: nextX, y: nextY, vx, vy, groundedOn: null }, landedOn: null };
}
