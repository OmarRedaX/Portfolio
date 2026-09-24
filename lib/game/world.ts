import {
  sectionIds,
  type Body,
  type Connection,
  type GeometrySnapshot,
  type Rect,
  type SectionId,
  type Surface,
  type Tuning,
  type Validation,
  type World,
} from "./model";
import {
  applyCourse,
  blueprints,
  routeReachable,
  validateCourse,
  type AcceptedCourse,
  type CourseBlueprint,
} from "./courses";
import { spawn } from "./physics";
import { apex, bodyRect, clearOf, maxSurfaces, replay, witness } from "./witness";

const validationCache = new Map<string, Validation>();
const expanded = (r: Rect, x: number, y: number): Rect => ({
  x: r.x - x,
  y: r.y - y,
  width: r.width + 2 * x,
  height: r.height + 2 * y,
});

type Knot = {
  y: number;
  section: SectionId;
  id: string;
  checkpoint?: SectionId;
  actions?: string[];
};

function routeKnots(snapshot: GeometrySnapshot, tuning: Tuning): Knot[] | null {
  const named: Knot[] = [];
  for (const section of sectionIds) {
    const anchor = snapshot.sectionAnchors[section];
    if (!Number.isFinite(anchor.y) || anchor.width <= 0 || anchor.height <= 0)
      return null;
    const y =
      section === "hero" || section === "contact"
        ? anchor.y + anchor.height + tuning.bodyHeight + 8
        : anchor.y - 12;
    named.push({ y, section, id: `checkpoint-${section}`, checkpoint: section });
  }
  for (const row of snapshot.plannedActionRows.length
    ? snapshot.plannedActionRows
    : snapshot.actionRows) {
    if (row.section === "hero" || row.section === "contact") {
      const matching = named.find((knot) => knot.section === row.section);
      if (matching) matching.actions = [...(matching.actions ?? []), row.id];
    } else
      named.push({
        y: row.rect.y + row.rect.height + tuning.bodyHeight + 8,
        section: row.section,
        id: `action-${row.id}`,
        actions: [row.id],
      });
  }
  named.sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
  for (let i = named.length - 1; i > 0; i--) {
    if (named[i].y - named[i - 1].y >= tuning.bodyHeight + 8) continue;
    if (
      named[i].section !== named[i - 1].section ||
      named[i].checkpoint ||
      named[i - 1].checkpoint
    )
      return null;
    named[i - 1].actions = [...(named[i - 1].actions ?? []), ...(named[i].actions ?? [])];
    named[i - 1].y = Math.max(named[i - 1].y, named[i].y);
    named.splice(i, 1);
  }
  const spacing = Math.min(112, apex(tuning) - 24);
  if (spacing < 48) return null;
  const knots: Knot[] = [];
  for (let i = 0; i < named.length; i++) {
    if (i) {
      const prior = named[i - 1];
      const terraceY = Math.max(
        ...(prior.actions ?? []).map((id) => {
          const row = (
            snapshot.plannedActionRows.length
              ? snapshot.plannedActionRows
              : snapshot.actionRows
          ).find((candidate) => candidate.id === id);
          return row ? row.rect.y + row.rect.height + tuning.bodyHeight + 8 : -Infinity;
        }),
      );
      const bridged =
        snapshot.targets.length > 0 &&
        prior.actions &&
        prior.actions.length > 1 &&
        named[i].checkpoint &&
        named[i].y - terraceY <= apex(tuning) - 5;
      const count = bridged ? 1 : Math.ceil((named[i].y - prior.y) / spacing);
      for (let j = 1; j < count; j++)
        knots.push({
          y: prior.y + ((named[i].y - prior.y) * j) / count,
          section: prior.section,
          id: `helper-${i}-${j}`,
        });
    }
    knots.push(named[i]);
  }
  return knots.length <= maxSurfaces ? knots : null;
}

function safeLanes(
  snapshot: GeometrySnapshot,
  viewportWidth: number,
  tuning: Tuning,
): Array<{ x: number; width: number }> {
  const anchors = sectionIds.map((id) => snapshot.sectionAnchors[id]);
  const left = Math.min(...anchors.map((anchor) => anchor.x));
  // Content/action edges can extend beyond an anchor, including by a subpixel
  // after browser layout. Derive the gutter from every excluded right edge so
  // the strict witness clearance does not depend on those edges rounding alike.
  const right = Math.max(
    ...[
      ...anchors,
      ...snapshot.obstacles,
      ...snapshot.plannedActionRows.map((row) => row.rect),
    ].map((rect) => rect.x + rect.width),
  );
  const width = tuning.bodyWidth + 8;
  return [...new Set([64, 96, 48].map((gap) => left - Math.min(left, gap)).concat(right))]
    .map((x) => ({ x, width }))
    .concat({ x: right + 6, width: 16 }, { x: left - 22, width: 12 })
    .filter(
      (lane) =>
        lane.x >= 0 &&
        lane.x + lane.width <= viewportWidth &&
        lane.x + (lane.width - tuning.bodyWidth) / 2 >= 0 &&
        lane.x + (lane.width + tuning.bodyWidth) / 2 <= viewportWidth,
    );
}

function attempt(
  snapshot: GeometrySnapshot,
  tuning: Tuning,
  viewportWidth: number,
  version: number,
  knots: Knot[],
  lane: number,
  width: number,
): World | null {
  const surfaces: Surface[] = knots.map((knot) => ({
    id: knot.id,
    section: knot.section,
    x: lane,
    y: knot.y,
    width,
    checkpoint: !!knot.checkpoint,
  }));
  const branchPairs: Array<[Surface, Surface]> = [];
  const optionalPairs: Array<[Surface, Surface]> = [];
  const verticalBases: Surface[] = [];
  const actionLedges = Object.fromEntries(
    knots.flatMap((k) => (k.actions ?? []).map((action) => [action, k.id])),
  );
  const targetLedges: Record<string, string> = {};
  const terraces = new Map<string, Surface[]>();
  const rows = snapshot.plannedActionRows.length
    ? snapshot.plannedActionRows
    : snapshot.actionRows;
  for (const row of rows) {
    const rowTargets = snapshot.targets.filter(
      (target) =>
        target.enabled &&
        target.rect.x + target.rect.width / 2 >= row.rect.x &&
        target.rect.x + target.rect.width / 2 <= row.rect.x + row.rect.width &&
        target.rect.y + target.rect.height / 2 >= row.rect.y &&
        target.rect.y + target.rect.height / 2 <= row.rect.y + row.rect.height,
    );
    if (rowTargets.length) {
      const routeAction = knots.find((knot) => knot.actions?.includes(row.id));
      const routeSurface = surfaces.find((surface) => surface.id === routeAction?.id);
      if (!routeSurface) return null;
      const targetCenters = rowTargets.map(
        (target) => target.rect.x + target.rect.width / 2,
      );
      const sweepLeft = Math.min(lane, ...targetCenters) - tuning.bodyWidth;
      const sweepRight = Math.max(lane + width, ...targetCenters) + tuning.bodyWidth;
      let branchY = row.rect.y + row.rect.height + tuning.bodyHeight + 8;
      for (const candidate of rows) {
        if (
          candidate.section !== row.section ||
          candidate.rect.y < row.rect.y ||
          candidate.rect.y > branchY ||
          candidate.rect.x >= sweepRight ||
          candidate.rect.x + candidate.rect.width <= sweepLeft
        )
          continue;
        branchY = Math.max(
          branchY,
          candidate.rect.y + candidate.rect.height + tuning.bodyHeight + 8,
        );
      }
      const terraceKey = `${row.section}-${branchY.toFixed(2)}`;
      let branchSurfaces = terraces.get(terraceKey);
      if (!branchSurfaces) {
        let base = routeSurface;
        if (Math.abs(routeSurface.y - branchY) > 1) {
          base = {
            id: `branch-${row.id}-base`,
            section: row.section,
            x: lane,
            y: branchY,
            width,
            checkpoint: false,
          };
          if (surfaces.length >= maxSurfaces) return null;
          surfaces.push(base);
          verticalBases.push(base);
          branchPairs.push([routeSurface, base]);
        }
        const centers = snapshot.targets
          .filter(
            (target) =>
              target.enabled &&
              rows.some(
                (candidate) =>
                  candidate.section === row.section &&
                  candidate.rect.y >= row.rect.y &&
                  // Only share a terrace with rows that its avatar fully clears.
                  // A lower row's top can be above the terrace while its bottom
                  // still intersects the avatar standing on it.
                  candidate.rect.y + candidate.rect.height + tuning.bodyHeight + 8 <=
                    branchY &&
                  target.rect.x + target.rect.width / 2 >= candidate.rect.x &&
                  target.rect.x + target.rect.width / 2 <=
                    candidate.rect.x + candidate.rect.width &&
                  target.rect.y + target.rect.height / 2 >= candidate.rect.y &&
                  target.rect.y + target.rect.height / 2 <=
                    candidate.rect.y + candidate.rect.height,
              ),
          )
          .map((target) => target.rect.x + target.rect.width / 2);
        const leftGoal = Math.min(...centers) - tuning.bodyWidth / 2;
        const rightGoal = Math.max(...centers) + tuning.bodyWidth / 2;
        branchSurfaces = [base];
        for (const direction of [-1, 1] as const) {
          const near = direction < 0 ? lane - 4 : lane + width + 4;
          const distance = direction < 0 ? near - leftGoal : rightGoal - near;
          if (distance <= 0) continue;
          const count = Math.ceil(distance / 80);
          if (surfaces.length + count > maxSurfaces) return null;
          const segmentWidth = distance / count;
          let prior = base;
          for (let i = 0; i < count; i++) {
            const x =
              direction < 0 ? near - segmentWidth * (i + 1) : near + segmentWidth * i;
            const next: Surface = {
              id: `branch-${row.id}-${direction < 0 ? "left" : "right"}-${i}`,
              section: row.section,
              x,
              y: branchY,
              width: segmentWidth,
              checkpoint: false,
            };
            surfaces.push(next);
            branchSurfaces.push(next);
            branchPairs.push([prior, next]);
            prior = next;
          }
        }
        terraces.set(terraceKey, branchSurfaces);
        verticalBases.push(...branchSurfaces.slice(1));
      }
      for (const target of rowTargets) {
        const centerX = target.rect.x + target.rect.width / 2;
        const centerY = target.rect.y + target.rect.height / 2;
        const ledge = branchSurfaces
          .map((surface) => ({ surface, body: spawn(surface, tuning) }))
          .filter(
            ({ body }) =>
              Math.abs(body.x + body.width / 2 - centerX) <= tuning.reachX &&
              Math.abs(body.y + body.height / 2 - centerY) <= tuning.reachY,
          )
          .sort(
            (a, b) =>
              Math.abs(a.body.x + a.body.width / 2 - centerX) -
                Math.abs(b.body.x + b.body.width / 2 - centerX) ||
              a.surface.id.localeCompare(b.surface.id),
          )[0];
        if (!ledge) return null;
        targetLedges[target.id] = ledge.surface.id;
        actionLedges[row.id] = ledge.surface.id;
      }
      continue;
    }
    if (row.rect.x - (lane + width) <= tuning.reachX) continue;
    const branchY = row.rect.y + row.rect.height + tuning.bodyHeight + 8;
    const routeAction = knots.find((knot) => knot.actions?.includes(row.id));
    const routeSurface = surfaces.find((surface) => surface.id === routeAction?.id);
    const origin = surfaces
      .filter((surface) => surface.y >= branchY + 40)
      .sort((a, b) => a.y - b.y)[0];
    // A level route knot beside the first segment can make the descent to a
    // helper under it unwitnessable (the body lands on the knot). The level
    // link then carries the branch; the lower link is kept only when proven.
    const level =
      routeSurface && Math.abs(routeSurface.y - branchY) <= 1 ? routeSurface : null;
    if (!level && (!origin || origin.y - branchY > apex(tuning) - tuning.bodyHeight))
      return null;
    const startX = lane + width + 4;
    const total = row.rect.x - startX;
    const count = Math.ceil(total / 96);
    if (count < 1 || surfaces.length + count > maxSurfaces) return null;
    let prior = level ?? origin;
    for (let i = 0; i < count; i++) {
      const x = startX + (total * i) / count;
      const next: Surface = {
        id: `branch-${row.id}-${i}`,
        section: row.section,
        x,
        y: branchY,
        width: total / count,
        checkpoint: false,
      };
      surfaces.push(next);
      branchPairs.push([prior, next]);
      if (i === 0 && routeSurface && !level) branchPairs.push([routeSurface, next]);
      if (
        i === 0 &&
        level &&
        origin &&
        origin.y - branchY <= apex(tuning) - tuning.bodyHeight
      )
        optionalPairs.push([origin, next]);
      prior = next;
    }
    actionLedges[row.id] = prior.id;
  }
  const exclusions = [
    ...snapshot.obstacles,
    ...snapshot.plannedActionRows.map((row) => row.rect),
    ...sectionIds
      .filter((id) => id !== "hero" && id !== "contact")
      .map((id) => snapshot.sectionAnchors[id]),
  ];
  // Planned reveal geometry guides layout only. Prove and expose collisions
  // against settled registrations; each newly settled set requires validation.
  const registered = snapshot.surfaces.filter(
    (surface) =>
      surface.x >= 0 &&
      surface.x + surface.width <= viewportWidth &&
      surface.width > 0 &&
      Number.isFinite(surface.y) &&
      !surfaces.some((candidate) => candidate.id === surface.id) &&
      exclusions.every((obstacle) =>
        clearOf(bodyRect(spawn(surface, tuning)), obstacle, 2),
      ),
  );
  if (surfaces.length + registered.length > maxSurfaces) return null;
  surfaces.push(...registered);
  for (const surface of surfaces) {
    const body = spawn(surface, tuning);
    if (
      body.x < 0 ||
      body.x + body.width > viewportWidth ||
      exclusions.some((obstacle) => !clearOf(bodyRect(body), obstacle, 2))
    )
      return null;
  }
  const connections: Connection[] = [];
  for (let i = 0; i < knots.length; i++) {
    for (let j = i + 1; j < Math.min(knots.length, i + 4); j++) {
      if (surfaces[j].y - surfaces[i].y > apex(tuning) + 48) break;
      const forward = witness(
        surfaces[i],
        surfaces[j],
        surfaces,
        exclusions,
        tuning,
        viewportWidth,
      );
      if (!forward) continue;
      const backward = witness(
        surfaces[j],
        surfaces[i],
        surfaces,
        exclusions,
        tuning,
        viewportWidth,
      );
      if (backward) connections.push(forward, backward);
    }
  }
  for (const base of verticalBases) {
    for (const next of surfaces
      .slice(0, knots.length)
      .filter(
        (surface) => surface.y > base.y && surface.y - base.y <= apex(tuning) + 48,
      )) {
      const forward = witness(base, next, surfaces, exclusions, tuning, viewportWidth);
      if (!forward) continue;
      const backward = witness(next, base, surfaces, exclusions, tuning, viewportWidth);
      if (backward) {
        connections.push(forward, backward);
        break;
      }
    }
  }
  for (const [a, b] of branchPairs) {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ]) {
      const connection = witness(from, to, surfaces, exclusions, tuning, viewportWidth);
      if (!connection) return null;
      connections.push(connection);
    }
  }
  for (const [a, b] of optionalPairs) {
    const forward = witness(a, b, surfaces, exclusions, tuning, viewportWidth);
    const backward =
      forward && witness(b, a, surfaces, exclusions, tuning, viewportWidth);
    if (forward && backward) connections.push(forward, backward);
  }
  const visited = new Set([knots.find((k) => k.checkpoint === "hero")!.id]);
  const queue = [...visited];
  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of connections) {
      if (edge.from === current && !visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  if (
    knots.some((k) => (k.checkpoint || k.actions?.length) && !visited.has(k.id)) ||
    Object.values(actionLedges).some((id) => !visited.has(id)) ||
    snapshot.targets.some((target) => target.enabled && !targetLedges[target.id])
  )
    return null;
  const checkpoints = Object.fromEntries(
    knots.filter((k) => k.checkpoint).map((k) => [k.checkpoint, k.id]),
  ) as Record<SectionId, string>;
  const envelope = routeEnvelope(surfaces, connections, tuning);
  return {
    version,
    surfaces,
    connections,
    checkpoints,
    actionLedges,
    targetLedges,
    obstacles: exclusions,
    envelope,
    courses: [],
  };
}

export function routeEnvelope(
  surfaces: readonly Surface[],
  connections: readonly Connection[],
  tuning: Tuning,
): Rect[] {
  return [
    ...surfaces.map((surface) =>
      expanded(
        {
          x: surface.x,
          y: surface.y - tuning.bodyHeight,
          width: surface.width,
          height: tuning.bodyHeight,
        },
        tuning.reachX,
        tuning.bodyHeight,
      ),
    ),
    ...connections.flatMap((connection) =>
      connection.corridor.map((rect) =>
        expanded(rect, tuning.reachX / 2, tuning.bodyHeight),
      ),
    ),
  ];
}

// Courses are accepted in blueprint order against the world so far. The final
// world must replay every connection on its final surface set; failing that,
// courses are dropped in reverse acceptance order, down to the backbone.
export function integrateCourses(
  world: World,
  snapshot: GeometrySnapshot,
  tuning: Tuning,
  viewportWidth: number,
  laneX: number,
  courseBlueprints: readonly CourseBlueprint[] = blueprints,
): World {
  const accepted: AcceptedCourse[] = [];
  let current = world;
  for (const blueprint of courseBlueprints) {
    const result = validateCourse(blueprint, {
      world: current,
      snapshot,
      tuning,
      viewportWidth,
      laneX,
      acceptedCourseRects: accepted.flatMap((course) => course.corridor),
    });
    if (!result.ok) continue;
    accepted.push(result);
    current = applyCourse(current, result);
  }
  while (accepted.length) {
    const final = accepted.reduce(applyCourse, world);
    if (final.connections.every((c) => replay(c, final.surfaces, tuning))) {
      const complete = {
        ...final,
        envelope: routeEnvelope(final.surfaces, final.connections, tuning),
      };
      return routeReachable(complete) ? complete : world;
    }
    accepted.pop();
  }
  return world;
}

export function buildWorld(
  snapshot: GeometrySnapshot,
  tuning: Tuning,
  viewport: { width: number; usableHeight: number },
  version: number,
  options: { courses?: boolean; blueprints?: readonly CourseBlueprint[] } = {},
): Validation {
  const key = JSON.stringify([
    snapshot.sectionBounds,
    snapshot.sectionAnchors,
    snapshot.surfaces,
    snapshot.plannedSurfaces,
    snapshot.plannedActionRows,
    snapshot.actionRows,
    snapshot.targets,
    snapshot.plannedTargets,
    snapshot.obstacles,
    snapshot.keepouts,
    snapshot.revealsSettled,
    snapshot.headerBottom,
    tuning,
    viewport,
    version,
    options,
  ]);
  const cached = validationCache.get(key);
  if (cached) return cached;
  const remember = (result: Validation): Validation => {
    if (validationCache.size >= 8)
      validationCache.delete(validationCache.keys().next().value!);
    validationCache.set(key, result);
    return result;
  };
  const minUsableHeight = Math.ceil(apex(tuning) + tuning.bodyHeight + 48);
  if (viewport.width < 768 || viewport.usableHeight < minUsableHeight)
    return remember({ ok: false, reason: "viewport" });
  if (!snapshot.revealsSettled) return remember({ ok: false, reason: "layout" });
  const knots = routeKnots(snapshot, tuning);
  if (!knots) return remember({ ok: false, reason: "layout" });
  for (const lane of safeLanes(snapshot, viewport.width, tuning)) {
    const world = attempt(
      snapshot,
      tuning,
      viewport.width,
      version,
      knots,
      lane.x,
      lane.width,
    );
    if (!world) continue;
    const final =
      options.courses === false
        ? world
        : integrateCourses(
            world,
            snapshot,
            tuning,
            viewport.width,
            lane.x,
            options.blueprints,
          );
    return remember({ ok: true, world: final, minUsableHeight });
  }
  return remember({ ok: false, reason: "layout" });
}

// Whether this viewport can host the route once every reveal has settled.
// Reveal state is transient; missing room beside the content or too little
// usable height is not, so only the latter makes Game Mode unavailable.
export function viewportSupportsRoute(
  snapshot: GeometrySnapshot,
  tuning: Tuning,
  viewport: { width: number; usableHeight: number },
  version: number,
): boolean {
  return buildWorld(
    {
      ...snapshot,
      surfaces: snapshot.plannedSurfaces,
      actionRows: snapshot.plannedActionRows,
      targets: snapshot.plannedTargets,
      revealsSettled: true,
    },
    tuning,
    viewport,
    version,
  ).ok;
}

export function outsidePlayablePath(body: Body, world: World): boolean {
  if (world.envelope.some((rect) => !clearOf(bodyRect(body), rect))) return false;
  // A body falling toward a registered lower support remains on a recoverable descent.
  return !world.surfaces.some(
    (surface) =>
      surface.y >= body.y + body.height &&
      body.x + body.width > surface.x &&
      body.x < surface.x + surface.width,
  );
}
