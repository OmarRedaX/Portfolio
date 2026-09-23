import {
  sectionIds,
  type GeometrySnapshot,
  type Rect,
  type SectionId,
  type Surface,
  type TargetBox,
} from "./model";

const geometryEvent = "portfolio:geometry-change";
const registeredSelector =
  "[data-game-section], [data-game-checkpoint], [data-game-surface], [data-game-action-row], [data-game-target], [data-game-obstacle]";

export function toDocumentRect(
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  scroll: { x: number; y: number },
): Rect {
  return {
    x: rect.left + scroll.x,
    y: rect.top + scroll.y,
    width: rect.width,
    height: rect.height,
  };
}

function measure(element: HTMLElement): Rect {
  const rect = toDocumentRect(element.getBoundingClientRect(), {
    x: window.scrollX,
    y: window.scrollY,
  });
  // Reveal parents and lifted cards are visual transforms. The route needs their
  // final layout position, even while an offscreen reveal is still pending.
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (!node.hasAttribute("data-game-reveal-state") && !node.classList.contains("card"))
      continue;
    const transform = getComputedStyle(node).transform;
    if (transform === "none") continue;
    const matrix = new DOMMatrixReadOnly(transform);
    rect.x -= matrix.m41;
    rect.y -= matrix.m42;
  }
  return rect;
}

function visible(element: HTMLElement): boolean {
  if (
    !element.isConnected ||
    element.getClientRects().length === 0 ||
    element.closest('[hidden], [inert], [aria-hidden="true"]')
  )
    return false;
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse"
    )
      return false;
  }
  return true;
}

function sectionOf(element: HTMLElement): SectionId | null {
  const section =
    element.closest<HTMLElement>("[data-game-section]")?.dataset.gameSection;
  return sectionIds.find((id) => id === section) ?? null;
}

function emptyBounds(): Record<SectionId, Rect> {
  return Object.fromEntries(
    sectionIds.map((id) => [id, { x: 0, y: 0, width: 0, height: 0 }]),
  ) as Record<SectionId, Rect>;
}

export function readGeometry(root: HTMLElement): GeometrySnapshot {
  const sectionBounds = emptyBounds();
  const elements = new Map<string, HTMLElement>();
  const surfaces: Surface[] = [];
  const targets: TargetBox[] = [];
  const obstacles: Rect[] = [];
  let revealsSettled = true;
  const sectionAnchors = emptyBounds();
  const plannedSurfaces: Surface[] = [];
  const actionRows: GeometrySnapshot["actionRows"] = [];
  const plannedActionRows: GeometrySnapshot["plannedActionRows"] = [];
  const sections = root.querySelectorAll<HTMLElement>("[data-game-section]");
  sections.forEach((element) => {
    const id = sectionIds.find((candidate) => candidate === element.dataset.gameSection);
    if (id) {
      sectionBounds[id] = measure(element);
      sectionAnchors[id] = measure(
        element.querySelector<HTMLElement>("[data-game-checkpoint]") ?? element,
      );
    }
  });

  root.querySelectorAll<HTMLElement>(registeredSelector).forEach((element) => {
    const section = sectionOf(element);
    if (!section) return;
    const rect = measure(element);
    const isVisible = visible(element) && rect.width > 0 && rect.height > 0;
    const reveal = element.closest<HTMLElement>("[data-game-reveal-state]");
    const revealState = reveal?.dataset.gameRevealState;
    const settled = revealState === undefined || revealState === "settled";
    // A pending reveal peeking in below its whileInView threshold may never
    // start, and pending geometry is already inactive. Only motion is unsafe,
    // including a staggered parent whose items still wait on their delay.
    let moving = false;
    for (let node: HTMLElement | null = reveal; node; node = node.parentElement)
      if (node.dataset?.gameRevealState === "moving") moving = true;
    if (
      moving &&
      rect.y - window.scrollY < window.innerHeight &&
      rect.y + rect.height - window.scrollY > 0
    )
      revealsSettled = false;
    if (element.dataset.gameSurface && isVisible) {
      const id = element.dataset.gameSurface;
      if (!elements.has(id)) {
        const surface = {
          id,
          section,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          checkpoint: false,
        };
        plannedSurfaces.push(surface);
        if (isVisible && settled) surfaces.push(surface);
        elements.set(id, element);
      }
    }
    if (element.dataset.gameActionRow && isVisible) {
      const row = { id: element.dataset.gameActionRow, section, rect };
      plannedActionRows.push(row);
      if (isVisible && settled) actionRows.push(row);
    }
    if (element.dataset.gameTarget) {
      const id = element.dataset.gameTarget;
      if (!elements.has(id)) elements.set(id, element);
      targets.push({
        id,
        label: element.textContent?.trim() ?? "",
        order: targets.length,
        rect,
        enabled:
          isVisible &&
          settled &&
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-disabled") !== "true",
      });
    }
    if (element.dataset.gameObstacle && isVisible) obstacles.push(rect);
  });

  const header = document.querySelector<HTMLElement>("[data-game-header]");
  return {
    surfaces,
    plannedSurfaces,
    targets,
    elements,
    sectionBounds,
    sectionAnchors,
    obstacles,
    actionRows,
    plannedActionRows,
    headerBottom: header?.getBoundingClientRect().bottom ?? 0,
    revealsSettled,
  };
}

export function observeGeometry(root: HTMLElement, onDirty: () => void): () => void {
  let frame = 0;
  const dirty = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onDirty();
    });
  };
  const observer = new ResizeObserver(dirty);
  root
    .querySelectorAll<HTMLElement>(
      "[data-game-section], [data-game-checkpoint], [data-game-surface], [data-game-action-row], [data-game-target], [data-game-obstacle]",
    )
    .forEach((element) => observer.observe(element));
  const header = document.querySelector<HTMLElement>("[data-game-header]");
  if (header) observer.observe(header);
  const viewport = window.visualViewport;
  window.addEventListener("resize", dirty);
  viewport?.addEventListener("resize", dirty);
  document.addEventListener(geometryEvent, dirty);
  document.fonts?.addEventListener("loadingdone", dirty);
  return () => {
    observer.disconnect();
    window.removeEventListener("resize", dirty);
    viewport?.removeEventListener("resize", dirty);
    document.removeEventListener(geometryEvent, dirty);
    document.fonts?.removeEventListener("loadingdone", dirty);
    if (frame) cancelAnimationFrame(frame);
  };
}

export function signalRevealGeometry(
  host: HTMLElement,
  state: "moving" | "settled",
): void {
  if (!host.querySelector(registeredSelector)) return;
  // Portfolio reveals run once. Viewport re-entry can notify again without a
  // second animation/completion; do not latch an already finished reveal moving.
  if (state === "moving" && host.dataset.gameRevealState === "settled") return;
  host.dataset.gameRevealState = state;
  if (document.documentElement.dataset.gameMode === "active") {
    document.dispatchEvent(new Event(geometryEvent));
  }
}
