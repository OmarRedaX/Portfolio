import {
  sectionIds,
  type CourseId,
  type GeometrySnapshot,
  type Rect,
  type SectionId,
  type Surface,
  type Tier,
  type Tuning,
} from "./model";

export const tierOrder: readonly Tier[] = ["comfortable", "easy", "medium", "challenge"];
export const tierRules: Record<
  Tier,
  { minWindow: number; minWidth: number; maxGap: number; maxRise: number }
> = {
  comfortable: { minWindow: 36, minWidth: 96, maxGap: 48, maxRise: 48 },
  easy: { minWindow: 24, minWidth: 64, maxGap: 96, maxRise: 80 },
  medium: { minWindow: 18, minWidth: 48, maxGap: 128, maxRise: 96 },
  challenge: { minWindow: 12, minWidth: 40, maxGap: 176, maxRise: 112 },
};
export const courseClearance = 12;

export type ZoneKind = "band" | "hero-floor" | "gutter";
export type Zone = {
  kind: ZoneKind;
  section: SectionId;
  rect: Rect;
  laneSide: "left" | "right";
  contentLeft: number;
};
export type LedgeSpec = {
  id: string;
  x: number;
  y: { top: number } | { bottom: number };
  width: number;
  catch?: boolean;
};
export type CourseBlueprint =
  | {
      id: CourseId;
      section: SectionId;
      zone: ZoneKind;
      tier: Tier;
      layout: "ledges";
      ledges: readonly LedgeSpec[];
    }
  | {
      id: CourseId;
      section: SectionId;
      zone: "gutter";
      tier: Tier;
      layout: "rungs";
      laneWidth: number;
      maxRise: number;
    };

export const blueprints: readonly CourseBlueprint[] = [
  {
    id: "launch-pad",
    section: "hero",
    zone: "hero-floor",
    tier: "comfortable",
    layout: "ledges",
    ledges: [
      { id: "step-1", x: 64, y: { top: 40 }, width: 128 },
      { id: "step-2", x: 224, y: { top: 80 }, width: 128 },
      { id: "hop", x: 384, y: { top: 80 }, width: 112 },
    ],
  },
  {
    id: "stepping-stones",
    section: "about",
    zone: "band",
    tier: "easy",
    layout: "ledges",
    ledges: [
      { id: "u1", x: 72, y: { top: 48 }, width: 96 },
      { id: "u2", x: 232, y: { top: 64 }, width: 80 },
      { id: "u3", x: 392, y: { top: 48 }, width: 96 },
      { id: "l1", x: 312, y: { bottom: 56 }, width: 96 },
      { id: "l2", x: 152, y: { bottom: 40 }, width: 96 },
    ],
  },
  {
    id: "grid-run",
    section: "tech-stack",
    zone: "band",
    tier: "challenge",
    layout: "ledges",
    ledges: [
      { id: "u1", x: 72, y: { top: 56 }, width: 96 },
      { id: "u2", x: 240, y: { top: 56 }, width: 64 },
      { id: "u3", x: 424, y: { top: 40 }, width: 48 },
      { id: "rest", x: 624, y: { top: 48 }, width: 112 },
      { id: "catch", x: 48, y: { bottom: 48 }, width: 720, catch: true },
    ],
  },
  {
    id: "precision-ledges",
    section: "projects",
    zone: "band",
    tier: "challenge",
    layout: "ledges",
    ledges: [
      { id: "u1", x: 72, y: { top: 64 }, width: 96 },
      { id: "p1", x: 272, y: { top: 64 }, width: 48 },
      { id: "rest", x: 432, y: { top: 72 }, width: 104 },
      { id: "p2", x: 648, y: { top: 40 }, width: 40 },
      { id: "catch", x: 48, y: { bottom: 48 }, width: 704, catch: true },
    ],
  },
  {
    id: "timeline-rungs",
    section: "experience",
    zone: "gutter",
    tier: "medium",
    layout: "rungs",
    laneWidth: 48,
    maxRise: 96,
  },
  {
    id: "cool-down",
    section: "contact",
    zone: "band",
    tier: "comfortable",
    layout: "ledges",
    ledges: [
      { id: "landing", x: 64, y: { top: 64 }, width: 192 },
      { id: "hop", x: 96, y: { bottom: 40 }, width: 128 },
    ],
  },
];

const bottomOf = (rect: Rect) => rect.y + rect.height;
const within = (rect: Rect, bounds: Rect) =>
  rect.y >= bounds.y && rect.y < bottomOf(bounds);

function actionRows(snapshot: GeometrySnapshot) {
  return snapshot.plannedActionRows.length
    ? snapshot.plannedActionRows
    : snapshot.actionRows;
}

function contentOf(snapshot: GeometrySnapshot, section: SectionId): Rect[] {
  const bounds = snapshot.sectionBounds[section];
  return [
    snapshot.sectionAnchors[section],
    ...[...snapshot.keepouts, ...snapshot.obstacles].filter((rect) =>
      within(rect, bounds),
    ),
    ...actionRows(snapshot)
      .filter((row) => row.section === section)
      .map((row) => row.rect),
  ];
}

function contentEdges(snapshot: GeometrySnapshot): { left: number; right: number } {
  const anchors = sectionIds.map((id) => snapshot.sectionAnchors[id]);
  return {
    left: Math.min(...anchors.map((anchor) => anchor.x)),
    right: Math.max(
      ...[
        ...anchors,
        ...snapshot.obstacles,
        ...snapshot.keepouts,
        ...actionRows(snapshot).map((row) => row.rect),
      ].map((rect) => rect.x + rect.width),
    ),
  };
}

export function findZone(
  blueprint: CourseBlueprint,
  snapshot: GeometrySnapshot,
  viewportWidth: number,
  laneX: number,
  tuning: Tuning,
): Zone | null {
  const content = contentEdges(snapshot);
  const laneWidth = tuning.bodyWidth + 8;
  const laneSide = laneX + laneWidth / 2 < viewportWidth / 2 ? "left" : "right";
  const zone = (x: number, right: number, y: number, bottom: number): Zone | null =>
    right > x && bottom > y
      ? {
          kind: blueprint.zone,
          section: blueprint.section,
          rect: { x, y, width: right - x, height: bottom - y },
          laneSide,
          contentLeft: content.left,
        }
      : null;
  const page = snapshot.sectionBounds[blueprint.section];
  const visibleRight = Math.min(viewportWidth, page.x + page.width);
  const [x, right] =
    laneSide === "left"
      ? [laneX, content.right]
      : [content.left, Math.min(visibleRight, laneX + laneWidth)];
  const lowest = (section: SectionId) =>
    Math.max(...contentOf(snapshot, section).map(bottomOf)) + courseClearance;

  if (blueprint.zone === "hero-floor")
    return zone(x, right, lowest("hero"), bottomOf(snapshot.sectionBounds.hero));

  if (blueprint.zone === "band") {
    const index = sectionIds.indexOf(blueprint.section);
    // The last section has no band below it, so its course lives in the band above.
    const upper = index === sectionIds.length - 1 ? index - 1 : index;
    const lower = sectionIds[upper + 1];
    if (upper < 0 || !lower) return null;
    const highest =
      Math.min(...contentOf(snapshot, lower).map((rect) => rect.y)) - courseClearance;
    return zone(x, right, lowest(sectionIds[upper]), highest);
  }

  if (blueprint.layout !== "rungs") return null;
  const keepouts = snapshot.keepouts.filter((rect) => within(rect, page));
  if (!keepouts.length) return null;
  const [gutterX, gutterRight] =
    laneSide === "left" ? [0, content.left] : [content.right, visibleRight];
  if (gutterRight - gutterX < 2 * blueprint.laneWidth + 8) return null;
  return zone(
    gutterX,
    gutterRight,
    Math.min(...keepouts.map((rect) => rect.y)) - tuning.bodyHeight,
    Math.max(...keepouts.map(bottomOf)),
  );
}

export function compileCourse(
  blueprint: CourseBlueprint,
  zone: Zone,
  snapshot: GeometrySnapshot,
  tuning: Tuning,
): Surface[] | null {
  const { rect, contentLeft } = zone;
  const snap = (x: number, round: (value: number) => number) =>
    contentLeft + 8 * round((x - contentLeft) / 8);
  const surface = (id: string, x: number, y: number, width: number): Surface => ({
    id: `course-${blueprint.id}-${id}`,
    section: blueprint.section,
    x,
    y,
    width,
    checkpoint: false,
  });
  let surfaces: Surface[];
  if (blueprint.layout === "ledges") {
    surfaces = blueprint.ledges.map((spec) => {
      const x =
        zone.laneSide === "left"
          ? rect.x + spec.x
          : rect.x + rect.width - spec.x - spec.width;
      const y =
        "top" in spec.y ? rect.y + spec.y.top : rect.y + rect.height - spec.y.bottom;
      return surface(spec.id, snap(x, Math.round), y, spec.width);
    });
  } else {
    const bounds = snapshot.sectionBounds[blueprint.section];
    const tops = snapshot.keepouts
      .filter((keepout) => within(keepout, bounds))
      .map((keepout) => keepout.y);
    const anchors = [...new Set([...tops, rect.y + rect.height])].sort((a, b) => a - b);
    const heights = [anchors[0]];
    for (let i = 1; i < anchors.length; i++) {
      const count = Math.ceil((anchors[i] - anchors[i - 1]) / blueprint.maxRise);
      for (let j = 1; j <= count; j++)
        heights.push(anchors[i - 1] + ((anchors[i] - anchors[i - 1]) * j) / count);
    }
    const lanes =
      zone.laneSide === "left"
        ? [
            snap(rect.x + rect.width - blueprint.laneWidth, Math.floor),
            snap(rect.x + rect.width - 2 * blueprint.laneWidth - 8, Math.floor),
          ]
        : [snap(rect.x, Math.ceil), snap(rect.x + blueprint.laneWidth + 8, Math.ceil)];
    surfaces = heights.map((y, i) =>
      surface(`r${i + 1}`, lanes[i % 2], y, blueprint.laneWidth),
    );
  }
  const epsilon = 1e-6;
  const inside = surfaces.every(
    (s) =>
      s.x >= rect.x - epsilon &&
      s.x + s.width <= rect.x + rect.width + epsilon &&
      s.y - tuning.bodyHeight >= rect.y - epsilon &&
      s.y <= rect.y + rect.height + epsilon,
  );
  return inside ? surfaces : null;
}

export function edgeTier(
  window: number | "walk",
  from: Surface,
  to: Surface,
): Tier | null {
  const frames = window === "walk" ? Infinity : window;
  const gap = Math.max(0, to.x - (from.x + from.width), from.x - (to.x + to.width));
  const rise = Math.max(0, from.y - to.y);
  return (
    tierOrder.find((tier) => {
      const rules = tierRules[tier];
      return (
        frames >= rules.minWindow &&
        to.width >= rules.minWidth &&
        gap <= rules.maxGap &&
        rise <= rules.maxRise
      );
    }) ?? null
  );
}
