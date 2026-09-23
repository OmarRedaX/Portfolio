import type { Body, GeometrySnapshot, SectionId, Surface, TargetBox, Tuning, World } from "./model";
import { spawn } from "./physics";
import { restoreSupport } from "./session";

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
  beforeClick?: (element: HTMLElement) => void,
): boolean {
  if (id !== visibleId || selectTarget(body, snapshot.targets, tuning) !== id)
    return false;

  const element = snapshot.elements.get(id);
  if (!element?.isConnected || element.getClientRects().length === 0) return false;

  beforeClick?.(element);
  element.click();
  return true;
}

export type Activation = { kind: "destination"; url: URL } | { kind: "page" | "native" };

export function classifyActivation(element: HTMLElement, current: URL): Activation {
  if (element.tagName !== "A") return { kind: "native" };
  const anchor = element as HTMLAnchorElement;
  if (anchor.hasAttribute("download") || (anchor.target && anchor.target.toLowerCase() !== "_self")) return { kind: "native" };
  let url: URL;
  try { url = new URL(anchor.href, current); }
  catch { return { kind: "native" }; }
  if (url.origin !== current.origin || !["http:", "https:"].includes(url.protocol)) return { kind: "native" };
  if (url.pathname !== current.pathname || url.search !== current.search || !url.hash) return { kind: "page" };
  return { kind: "destination", url };
}

export function destinationLanding(world: World, geometry: GeometrySnapshot, section: SectionId, tuning: Tuning): Surface | null {
  const bounds = geometry.sectionBounds[section];
  const safe = world.surfaces.filter((surface) => surface.section === section &&
    surface.x >= bounds.x && surface.x + surface.width <= bounds.x + bounds.width &&
    surface.y >= bounds.y + tuning.bodyHeight && surface.y <= bounds.y + bounds.height &&
    spawn(surface, tuning).x >= bounds.x &&
    restoreSupport(spawn(surface, tuning), [surface], [surface], world.obstacles, bounds.x + bounds.width));
  return safe.find((surface) => surface.id === world.checkpoints[section]) ??
    safe.find((surface) => !geometry.plannedSurfaces.some((base) => base.id === surface.id)) ?? null;
}

export function withDestinationCheckpoint(world: World, landing: Surface): World {
  return { ...world, surfaces: world.surfaces.map((surface) => surface.section === landing.section
    ? { ...surface, checkpoint: surface.id === landing.id } : surface),
    checkpoints: { ...world.checkpoints, [landing.section]: landing.id } };
}
