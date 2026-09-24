import {
  sectionIds,
  type Connection,
  type CourseId,
  type CourseSummary,
  type GeometrySnapshot,
  type Rect,
  type SectionId,
  type Surface,
  type Tier,
  type Tuning,
  type World,
} from "./model";
import { clearOf, maxSurfaces, timingWindow, walkOffWitness, witness } from "./witness";

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
      { id: "u1", x: 20, y: { bottom: 32 }, width: 80 },
      { id: "u2", x: 164, y: { bottom: 32 }, width: 80 },
      { id: "u3", x: 308, y: { bottom: 32 }, width: 96 },
      { id: "l1", x: 4, y: { bottom: 0 }, width: 400 },
    ],
  },
  {
    id: "grid-run",
    section: "tech-stack",
    zone: "band",
    tier: "challenge",
    layout: "ledges",
    ledges: [
      { id: "u1", x: 84, y: { bottom: 32 }, width: 64 },
      { id: "u2", x: 260, y: { bottom: 32 }, width: 48 },
      { id: "rest", x: 452, y: { bottom: 32 }, width: 112 },
      { id: "catch", x: 4, y: { bottom: 0 }, width: 600, catch: true },
    ],
  },
  {
    id: "precision-ledges",
    section: "projects",
    zone: "band",
    tier: "challenge",
    layout: "ledges",
    ledges: [
      { id: "u1", x: 20, y: { bottom: 48 }, width: 96 },
      { id: "p1", x: 236, y: { bottom: 48 }, width: 48 },
      { id: "rest", x: 428, y: { bottom: 48 }, width: 104 },
      { id: "p2", x: 634, y: { bottom: 48 }, width: 48 },
      { id: "catch", x: 4, y: { bottom: 0 }, width: 680, catch: true },
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

function contentOf(
  snapshot: GeometrySnapshot,
  section: SectionId,
  ledges: readonly Rect[],
): Rect[] {
  const bounds = snapshot.sectionBounds[section];
  return [
    snapshot.sectionAnchors[section],
    ...[...snapshot.keepouts, ...snapshot.obstacles, ...ledges].filter((rect) =>
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
  lane: { x: number; width: number },
  tuning: Tuning,
  buttonLedges: readonly Surface[] = [],
): Zone | null {
  const content = contentEdges(snapshot);
  const ledges = buttonLedges.map((s) => ({
    x: s.x,
    y: s.y - tuning.bodyHeight,
    width: s.width,
    height: tuning.bodyHeight,
  }));
  const laneSide = lane.x + lane.width / 2 < viewportWidth / 2 ? "left" : "right";
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
  // Offsets start at the lane's content side, so a wider or narrower lane
  // moves the course with it instead of changing its geometry.
  const [x, right] =
    laneSide === "left" ? [lane.x + lane.width, content.right] : [content.left, lane.x];
  const lowest = (section: SectionId) =>
    Math.max(...contentOf(snapshot, section, ledges).map(bottomOf)) + courseClearance;

  if (blueprint.zone === "hero-floor")
    return zone(x, right, lowest("hero"), bottomOf(snapshot.sectionBounds.hero));

  if (blueprint.zone === "band") {
    const index = sectionIds.indexOf(blueprint.section);
    // The last section has no band below it, so its course lives in the band above.
    const upper = index === sectionIds.length - 1 ? index - 1 : index;
    const lower = sectionIds[upper + 1];
    if (upper < 0 || !lower) return null;
    const highest =
      Math.min(...contentOf(snapshot, lower, ledges).map((rect) => rect.y)) -
      courseClearance;
    return zone(x, right, lowest(sectionIds[upper]), highest);
  }

  if (blueprint.layout !== "rungs") return null;
  const keepouts = snapshot.keepouts.filter((rect) => within(rect, page));
  if (!keepouts.length) return null;
  const [gutterX, gutterRight] =
    laneSide === "left" ? [0, content.left] : [content.right, visibleRight];
  if (gutterRight - gutterX < 2 * blueprint.laneWidth + 8 + courseClearance) return null;
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
            snap(rect.x + rect.width - courseClearance - blueprint.laneWidth, Math.floor),
            snap(
              rect.x + rect.width - courseClearance - 2 * blueprint.laneWidth - 8,
              Math.floor,
            ),
          ]
        : [
            snap(rect.x + courseClearance, Math.ceil),
            snap(rect.x + courseClearance + blueprint.laneWidth + 8, Math.ceil),
          ];
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

// gradeWidth is false for a landing on a backbone surface: its width belongs to
// the already-validated lane, not to the course's difficulty.
export function edgeTier(
  window: number | "walk",
  from: Surface,
  to: Surface,
  gradeWidth = true,
): Tier | null {
  const frames = window === "walk" ? Infinity : window;
  const gap = Math.max(0, to.x - (from.x + from.width), from.x - (to.x + to.width));
  const rise = Math.max(0, from.y - to.y);
  return (
    tierOrder.find((tier) => {
      const rules = tierRules[tier];
      return (
        frames >= rules.minWindow &&
        (!gradeWidth || to.width >= rules.minWidth) &&
        gap <= rules.maxGap &&
        rise <= rules.maxRise
      );
    }) ?? null
  );
}

export type CourseRejection =
  | "zone"
  | "placement"
  | "isolation"
  | "witness"
  | "tier"
  | "rhythm"
  | "catch"
  | "graph"
  | "budget";
export type CourseContext = {
  world: World;
  snapshot: GeometrySnapshot;
  tuning: Tuning;
  viewportWidth: number;
  laneX: number;
  acceptedCourseRects: Rect[];
};
export type CourseResult =
  | {
      ok: true;
      summary: CourseSummary;
      surfaces: Surface[];
      connections: Connection[];
      removedIds: string[];
      corridor: Rect[];
    }
  | { ok: false; reason: CourseRejection };

const maxCourseSurfaces = 12;
const restWidth = 96;
const maxChallengeCourses = 2;
const maxChallengeEdges = 3;

type Edge = {
  connection: Connection;
  outcomes: Array<string | null>;
  tier: Tier | null;
};

const harder = (a: Tier, b: Tier) =>
  tierOrder.indexOf(a) >= tierOrder.indexOf(b) ? a : b;
const line = (s: Surface): Rect => ({ x: s.x, y: s.y, width: s.width, height: 0 });

function reachable(
  start: string,
  connections: readonly Connection[],
  reverse = false,
): Set<string> {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const at = queue.shift()!;
    for (const c of connections) {
      const [a, b] = reverse ? [c.to, c.from] : [c.from, c.to];
      if (a === at && !seen.has(b)) {
        seen.add(b);
        queue.push(b);
      }
    }
  }
  return seen;
}

export function validateCourse(
  blueprint: CourseBlueprint,
  context: CourseContext,
): CourseResult {
  const { world, snapshot, tuning, viewportWidth, laneX } = context;
  const reject = (reason: CourseRejection): CourseResult => ({ ok: false, reason });

  const zone = findZone(
    blueprint,
    snapshot,
    viewportWidth,
    { x: laneX, width: world.surfaces.find((s) => s.x === laneX)?.width ?? 0 },
    tuning,
    world.surfaces.filter(isButtonLedge),
  );
  const compiled = zone && compileCourse(blueprint, zone, snapshot, tuning);
  if (!zone || !compiled) return reject("zone");

  const span = courseSpan(world, zone, laneX, tuning);
  const entry = span?.entry;
  const exit = span?.exit;
  const removed = span?.removed ?? [];
  const removedIds = removed.map((s) => s.id);

  if (
    compiled.length > maxCourseSurfaces ||
    world.surfaces.length - removed.length + compiled.length > maxSurfaces
  )
    return reject("budget");

  const rules = tierRules[blueprint.tier];
  const catchIds =
    blueprint.layout === "ledges"
      ? blueprint.ledges
          .filter((spec) => spec.catch)
          .map((spec) => `course-${blueprint.id}-${spec.id}`)
      : [];
  const keepouts = [
    ...snapshot.keepouts,
    ...snapshot.obstacles,
    ...actionRows(snapshot).map((row) => row.rect),
    ...[...snapshot.targets, ...snapshot.plannedTargets]
      .filter((target) => target.enabled)
      .map((target) => target.rect),
    ...sectionIds.map((id) => snapshot.sectionAnchors[id]),
  ];
  const misplaced = compiled.some(
    (s) =>
      s.x < 0 ||
      s.x + s.width > viewportWidth ||
      (!catchIds.includes(s.id) && s.width < rules.minWidth) ||
      keepouts.some(
        (rect) =>
          !clearOf(
            {
              x: s.x,
              y: s.y - tuning.bodyHeight,
              width: s.width,
              height: tuning.bodyHeight,
            },
            rect,
            courseClearance,
          ),
      ),
  );
  if (misplaced) return reject("placement");

  const otherEnds = new Set(world.courses.flatMap((c) => [c.entryId, c.exitId]));
  if (
    !entry ||
    !exit ||
    removed.some((s) => !s.id.startsWith("helper-") || otherEnds.has(s.id))
  )
    return reject("isolation");

  const surfaces = [
    ...world.surfaces.filter((s) => !removedIds.includes(s.id)),
    ...compiled,
  ];
  const courseIds = new Set(compiled.map((s) => s.id));
  const prove = (from: Surface, to: Surface): Edge | null => {
    const walked = witness(
      from,
      to,
      surfaces,
      keepouts,
      tuning,
      viewportWidth,
      courseClearance,
    );
    const walk =
      walked && !walked.frames.some((input) => input.jumpPressed)
        ? walked
        : walkOffWitness(
            from,
            to,
            surfaces,
            keepouts,
            tuning,
            viewportWidth,
            courseClearance,
          );
    const gradeWidth = courseIds.has(to.id);
    if (walk)
      return {
        connection: walk,
        outcomes: [],
        tier: edgeTier("walk", from, to, gradeWidth),
      };
    const sweep = timingWindow(
      from,
      to,
      surfaces,
      keepouts,
      tuning,
      viewportWidth,
      courseClearance,
    );
    return sweep.best
      ? {
          connection: sweep.best,
          outcomes: sweep.outcomes,
          tier: edgeTier(sweep.frames, from, to, gradeWidth),
        }
      : null;
  };

  const chain = [entry, ...compiled, exit];
  const pairs: Array<{ index: number; forward: Edge; backward: Edge }> = [];
  for (let i = 0; i + 1 < chain.length; i++) {
    const forward = prove(chain[i], chain[i + 1]);
    const backward = forward && prove(chain[i + 1], chain[i]);
    if (!forward || !backward) return reject("witness");
    pairs.push({ index: i, forward, backward });
  }
  // A catch floor also links to its nearest non-adjacent ledge when that link
  // is proved both ways within the course tier; it shortens recovery.
  const links: Edge[] = [];
  for (const id of catchIds) {
    const at = chain.findIndex((s) => s.id === id);
    const floor = chain[at];
    const nearest = chain
      .map((s, index) => ({ s, index }))
      .filter(
        ({ s, index }) =>
          courseIds.has(s.id) && !catchIds.includes(s.id) && Math.abs(index - at) > 1,
      )
      .map(({ s }) => ({
        s,
        distance: Math.hypot(
          Math.max(
            0,
            floor.x - (s.x + s.width / 2),
            s.x + s.width / 2 - (floor.x + floor.width),
          ),
          s.y - floor.y,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.s;
    const up = nearest && prove(floor, nearest);
    const down = up && nearest && prove(nearest, floor);
    if (
      up?.tier &&
      down?.tier &&
      tierOrder.indexOf(harder(up.tier, down.tier)) <= tierOrder.indexOf(blueprint.tier)
    )
      links.push(up, down);
  }
  const edges = [...pairs.flatMap((p) => [p.forward, p.backward]), ...links];
  const connections = edges.map((edge) => edge.connection);

  const guarded = [...snapshot.plannedSurfaces.map(line), ...context.acceptedCourseRects];
  const backbone = world.surfaces
    .filter((s) => !removedIds.includes(s.id) && s.id !== entry.id && s.id !== exit.id)
    .map(line);
  const crosses = connections.some((c) =>
    c.corridor.some(
      (rect) =>
        guarded.some(
          (other) =>
            !clearOf(
              {
                x: rect.x - tuning.bodyWidth,
                y: rect.y - tuning.bodyWidth,
                width: rect.width + 2 * tuning.bodyWidth,
                height: rect.height + 2 * tuning.bodyWidth,
              },
              other,
            ),
        ) || backbone.some((other) => !clearOf(rect, other)),
    ),
  );
  if (crosses) return reject("isolation");

  if (
    edges.some(
      (edge) =>
        !edge.tier || tierOrder.indexOf(edge.tier) > tierOrder.indexOf(blueprint.tier),
    )
  )
    return reject("tier");

  const pairTier = pairs.map((p) => harder(p.forward.tier!, p.backward.tier!));
  const challenging = pairTier.filter((tier) => tier === "challenge").length;
  const crowded = pairTier.some(
    (tier, i) =>
      i > 0 &&
      tier === "challenge" &&
      pairTier[i - 1] === "challenge" &&
      chain[i].width < restWidth,
  );
  const challengeCourses = world.courses.filter((c) => c.tier === "challenge").length;
  if (
    challenging > maxChallengeEdges ||
    crowded ||
    (blueprint.tier === "challenge" && challengeCourses >= maxChallengeCourses)
  )
    return reject("rhythm");

  // A missed medium or challenge jump must land somewhere from which the
  // approach to that jump is at most two comfortable or easy edges away.
  const gentle = edges
    .filter((edge) => edge.tier === "comfortable" || edge.tier === "easy")
    .map((edge) => edge.connection);
  const within = (start: string, goals: Set<string>) => {
    let frontier = new Set([start]);
    const seen = new Set([start]);
    for (let depth = 0; depth <= 2; depth++) {
      if ([...frontier].some((id) => goals.has(id))) return true;
      const next = new Set<string>();
      for (const c of gentle)
        if (frontier.has(c.from) && !seen.has(c.to)) {
          seen.add(c.to);
          next.add(c.to);
        }
      frontier = next;
    }
    return false;
  };
  const uncaught = pairs.some(({ index, forward, backward }) =>
    [
      { edge: forward, approach: chain.slice(0, index + 1) },
      { edge: backward, approach: chain.slice(index + 1) },
    ].some(
      ({ edge, approach }) =>
        (edge.tier === "medium" || edge.tier === "challenge") &&
        edge.outcomes.some(
          (outcome) =>
            outcome !== edge.connection.to &&
            (outcome === null || !within(outcome, new Set(approach.map((s) => s.id)))),
        ),
    ),
  );
  if (uncaught) return reject("catch");

  const accepted: AcceptedCourse = {
    ok: true,
    summary: {
      id: blueprint.id,
      section: blueprint.section,
      tier: blueprint.tier,
      entryId: entry.id,
      exitId: exit.id,
      surfaceIds: compiled.map((s) => s.id),
      catchIds,
      edgeTiers: Object.fromEntries(
        edges.map((edge) => [
          `${edge.connection.from}>${edge.connection.to}`,
          edge.tier!,
        ]),
      ),
    },
    surfaces: compiled,
    connections,
    removedIds,
    corridor: connections.flatMap((c) => c.corridor),
  };
  const candidate = applyCourse(world, accepted);
  const hero = world.checkpoints.hero;
  const backward = reachable(hero, candidate.connections, true);
  if (!routeReachable(candidate) || compiled.some((s) => !backward.has(s.id)))
    return reject("graph");
  return accepted;
}

export type AcceptedCourse = Extract<CourseResult, { ok: true }>;

export const isButtonLedge = (surface: Surface) =>
  surface.id.startsWith("action-") || surface.id.startsWith("branch-");

// The entry is the first lane surface whose standing body is inside the zone,
// so the course clearance already holds against the content above it; the
// exit's line is at the zone bottom.
export function courseSpan(
  world: World,
  zone: Zone,
  laneX: number,
  tuning: Tuning,
): { entry: Surface; exit: Surface; removed: Surface[] } | null {
  const lane = world.surfaces
    .filter((surface) => surface.x === laneX)
    .sort((a, b) => a.y - b.y);
  const entry = lane.find(
    (s) => s.y - tuning.bodyHeight >= zone.rect.y && s.y <= bottomOf(zone.rect),
  );
  const exit = entry && lane.find((s) => s.y > entry.y && s.y >= bottomOf(zone.rect) - 8);
  if (!entry || !exit) return null;
  return { entry, exit, removed: lane.filter((s) => s.y > entry.y && s.y < exit.y) };
}

// Every checkpoint, action ledge, target ledge and course surface is reached
// from the Hero checkpoint.
export function routeReachable(world: World): boolean {
  const forward = reachable(world.checkpoints.hero, world.connections);
  return [
    ...Object.values(world.checkpoints),
    ...Object.values(world.actionLedges),
    ...Object.values(world.targetLedges),
    ...world.courses.flatMap((course) => course.surfaceIds),
  ].every((id) => forward.has(id));
}

// Replaces the course's helper span (and any lane link that jumps it) with the
// course surfaces and their witnessed connections.
export function applyCourse(world: World, course: AcceptedCourse): World {
  const entry = world.surfaces.find((s) => s.id === course.summary.entryId)!;
  const exit = world.surfaces.find((s) => s.id === course.summary.exitId)!;
  const lane = world.surfaces.filter((s) => s.x === entry.x);
  const removed = new Set(course.removedIds);
  return {
    ...world,
    surfaces: [...world.surfaces.filter((s) => !removed.has(s.id)), ...course.surfaces],
    connections: [
      ...world.connections.filter(
        (c) =>
          !removed.has(c.from) &&
          !removed.has(c.to) &&
          !crossesSpan(c, lane, entry, exit),
      ),
      ...course.connections,
    ],
    courses: [...world.courses, course.summary],
  };
}

// A lane-to-lane backbone link that jumps the replaced span would bypass the
// course, so it is replaced along with the helpers.
function crossesSpan(
  connection: Connection,
  lane: readonly Surface[],
  entry: Surface,
  exit: Surface,
): boolean {
  const from = lane.find((s) => s.id === connection.from);
  const to = lane.find((s) => s.id === connection.to);
  if (!from || !to) return false;
  const [upper, lower] = from.y < to.y ? [from, to] : [to, from];
  return upper.y <= entry.y && lower.y >= exit.y;
}
