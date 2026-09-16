import type { Body, GeometrySnapshot, TargetBox, Tuning } from "./model";

function center(rect: { x: number; y: number; width: number; height: number }) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

export function selectTarget(
  body: Body,
  targets: readonly TargetBox[],
  tuning: Tuning,
): string | null {
  if (body.groundedOn === null) return null;

  const bodyCenter = center(body);
  const candidate = targets
    .filter((target) => {
      if (!target.enabled) return false;
      const targetCenter = center(target.rect);
      return (
        Math.abs(targetCenter.x - bodyCenter.x) <= tuning.reachX &&
        Math.abs(targetCenter.y - bodyCenter.y) <= tuning.reachY
      );
    })
    .map((target) => ({
      target,
      horizontalDistance: Math.abs(center(target.rect).x - bodyCenter.x),
    }))
    .sort(
      (a, b) =>
        a.horizontalDistance - b.horizontalDistance || a.target.order - b.target.order,
    )[0];

  return candidate?.target.id ?? null;
}

export function activateSelected(
  id: string,
  visibleId: string | null,
  body: Body,
  snapshot: GeometrySnapshot,
  tuning: Tuning,
): boolean {
  if (id !== visibleId || selectTarget(body, snapshot.targets, tuning) !== id)
    return false;

  const element = snapshot.elements.get(id);
  if (!element?.isConnected || element.getClientRects().length === 0) return false;

  element.click();
  return true;
}
