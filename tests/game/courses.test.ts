import test from "node:test";
import assert from "node:assert/strict";
import {
  blueprints,
  compileCourse,
  edgeTier,
  findZone,
  tierOrder,
  validateCourse,
  type CourseBlueprint,
  type CourseContext,
  type CourseRejection,
  type LedgeSpec,
  type Zone,
} from "../../lib/game/courses";
import type {
  CourseId,
  CourseSummary,
  GeometrySnapshot,
  Surface,
  Tuning,
  World,
} from "../../lib/game/model";
import { replay } from "../../lib/game/witness";
import { buildWorld } from "../../lib/game/world";
import { bandFixture } from "./fixtures/band";
import { measuredHomepage } from "./fixtures/rendered-homepage";

const tuning: Tuning = {
  step: 1 / 120,
  speed: 240,
  gravity: 1100,
  jumpSpeed: 580,
  bodyWidth: 24,
  bodyHeight: 32,
  landingMargin: 2,
  reachX: 110,
  reachY: 150,
};

const surf = (id: string, x: number, width: number, y: number): Surface => ({
  id,
  section: "about",
  x,
  y,
  width,
  checkpoint: false,
});

const blueprintById = (id: CourseId): CourseBlueprint =>
  blueprints.find((blueprint) => blueprint.id === id)!;

test("edge tiers follow the floor table and reject frame-perfect jumps", () => {
  const a = surf("a", 0, 96, 500),
    b = surf("b", 140, 64, 460);
  assert.equal(edgeTier("walk", a, surf("c", 96, 96, 500)), "comfortable");
  assert.equal(edgeTier(30, a, b), "easy"); // gap 44, rise 40, width 64
  assert.equal(edgeTier(13, a, surf("n", 250, 40, 400)), "challenge");
  assert.equal(edgeTier(11, a, surf("n", 250, 40, 400)), null);
});

test("a landing on a narrow backbone lane is graded without its width", () => {
  const a = surf("a", 0, 96, 500),
    lane = surf("lane", 140, 12, 460);
  assert.equal(edgeTier(30, a, lane), null);
  assert.equal(edgeTier(30, a, lane, false), "easy");
});

test("band zone sits between section N content and section N+1 heading, lane-side first", () => {
  const zone = findZone(
    blueprintById("stepping-stones"),
    bandFixture(),
    1440,
    120,
    tuning,
  )!;
  // About's keep-outs end at 1780 (+12); the Tech Stack heading starts at 2036 (−12).
  // X runs from the lane at 120 to the content right edge at 1248.
  assert.deepEqual(zone.rect, { x: 120, y: 1792, width: 1128, height: 232 });
  assert.equal(zone.laneSide, "left");
  assert.equal(zone.contentLeft, 184);
});

test("the cool-down band is the one above Contact, ending at Contact's first content", () => {
  const zone = findZone(blueprintById("cool-down"), bandFixture(), 1440, 120, tuning)!;
  // Experience entries end at 5504 (+12); Contact's column starts at 5760 (−12).
  assert.deepEqual(zone.rect, { x: 120, y: 5516, width: 1128, height: 232 });
});

test("a right-lane zone never extends past the visible page width", () => {
  const snapshot = bandFixture();
  const zone = findZone(blueprintById("stepping-stones"), snapshot, 1440, 1400, tuning)!;
  assert.equal(zone.laneSide, "right");
  assert.equal(zone.rect.x, 184);
  assert.equal(zone.rect.x + zone.rect.width, snapshot.sectionBounds.about.width);
});

test("hero floor runs from the Hero action row down to the Hero bottom", () => {
  const zone = findZone(blueprintById("launch-pad"), bandFixture(), 1440, 120, tuning)!;
  assert.deepEqual(zone.rect, { x: 120, y: 725, width: 1128, height: 227 });
});

test("gutter zone requires two lanes and is null at 1024", () => {
  assert.equal(
    findZone(
      blueprintById("timeline-rungs"),
      measuredHomepage("1024-overlay").snapshot,
      1024,
      0,
      tuning,
    ),
    null,
  );
});

test("gutter zone spans viewport edge to content left, so 1280 has two lanes", () => {
  const { snapshot, width } = measuredHomepage("1280");
  const zone = findZone(blueprintById("timeline-rungs"), snapshot, width, 56, tuning)!;
  assert.equal(zone.rect.x, 0);
  assert.equal(zone.rect.width, snapshot.sectionAnchors.hero.x);
});

test("compilation mirrors for a right lane, snaps to 8px from content left, and is deterministic", () => {
  const bp = blueprintById("stepping-stones");
  const snapshot = bandFixture();
  const zoneLeft = findZone(bp, snapshot, 1440, 120, tuning)!;
  const zoneRight = findZone(bp, snapshot, 1440, 1256, tuning)!;
  assert.equal(zoneRight.laneSide, "right");
  const left = compileCourse(bp, zoneLeft, snapshot, tuning)!,
    right = compileCourse(bp, zoneRight, snapshot, tuning)!;
  for (const s of [...left, ...right]) assert.equal((s.x - zoneLeft.contentLeft) % 8, 0);
  assert.deepEqual(
    left.map((s) => s.width),
    right.map((s) => s.width),
  );
  assert.deepEqual(
    left.map((s) => s.y),
    right.map((s) => s.y),
  );
  assert.ok(left[0].x < left[2].x && right[0].x > right[2].x);
  assert.deepEqual(
    left.map((s) => s.id),
    bp.layout === "ledges" ? bp.ledges.map((l) => `course-stepping-stones-${l.id}`) : [],
  );
  assert.deepEqual(compileCourse(bp, zoneLeft, snapshot, tuning), left);
});

test("a zone too small for its blueprint rejects instead of squeezing", () => {
  const bp = blueprintById("stepping-stones");
  const snapshot = bandFixture();
  const zoneLeft = findZone(bp, snapshot, 1440, 120, tuning)!;
  assert.equal(
    compileCourse(
      bp,
      { ...zoneLeft, rect: { ...zoneLeft.rect, width: 200 } },
      snapshot,
      tuning,
    ),
    null,
  );
});

test("rungs align to Experience keep-out tops and alternate lanes", () => {
  const { snapshot, width } = measuredHomepage("1440");
  const bp = blueprintById("timeline-rungs");
  const zone = findZone(bp, snapshot, width, 120, tuning)!;
  const rungs = compileCourse(bp, zone, snapshot, tuning)!;
  const experience = snapshot.sectionBounds.experience;
  const tops = snapshot.keepouts
    .filter(
      (k) => k.y >= experience.y && k.y + k.height <= experience.y + experience.height,
    )
    .map((k) => k.y);
  for (const top of tops)
    assert.ok(
      rungs.some((r) => Math.abs(r.y - top) <= 4),
      `no rung at ${top}`,
    );
  const sorted = [...rungs].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    assert.notEqual(sorted[i].x, sorted[i - 1].x);
    assert.ok(sorted[i].y - sorted[i - 1].y <= 96);
  }
});

// A challenge course in the About→Tech Stack band of bandFixture(): a drop from
// the lane entry, a low run with widening gaps, a rest ledge, and a catch floor
// that returns to the Tech Stack checkpoint. Jumps stay low in the band so the
// body clears the About content above by the course clearance on every frame.
const testCourse: CourseBlueprint = {
  id: "grid-run",
  section: "about",
  zone: "band",
  tier: "challenge",
  layout: "ledges",
  ledges: [
    { id: "d1", x: 0, y: { top: 104 }, width: 48 },
    { id: "u1", x: 96, y: { bottom: 48 }, width: 64 },
    { id: "u2", x: 272, y: { bottom: 48 }, width: 48 },
    { id: "rest", x: 464, y: { bottom: 48 }, width: 112 },
    { id: "catch", x: 48, y: { bottom: 0 }, width: 560, catch: true },
  ],
};

type Fixture = {
  snapshot: GeometrySnapshot;
  world: World;
  blueprint: CourseBlueprint;
  zone: Zone;
};

function baseFixture(): Fixture {
  const snapshot = bandFixture();
  const built = buildWorld(snapshot, tuning, { width: 1440, usableHeight: 700 }, 1);
  assert.ok(built.ok);
  return {
    snapshot: bandFixture(),
    world: built.world,
    blueprint: testCourse,
    zone: findZone(testCourse, snapshot, 1440, 120, tuning)!,
  };
}

const contextOf = (f: Fixture): CourseContext => ({
  world: f.world,
  snapshot: f.snapshot,
  tuning,
  viewportWidth: 1440,
  laneX: 120,
  acceptedCourseRects: [],
});

function ledgesOf(blueprint: CourseBlueprint): readonly LedgeSpec[] {
  assert.equal(blueprint.layout, "ledges");
  return blueprint.layout === "ledges" ? blueprint.ledges : [];
}

const withLedges = (blueprint: CourseBlueprint, ledges: LedgeSpec[]): CourseBlueprint =>
  blueprint.layout === "ledges" ? { ...blueprint, ledges } : blueprint;

const withLedge = (blueprint: CourseBlueprint, id: string, patch: Partial<LedgeSpec>) =>
  withLedges(
    blueprint,
    ledgesOf(blueprint).map((ledge) =>
      ledge.id === id ? { ...ledge, ...patch } : ledge,
    ),
  );

const filler = (count: number): Surface[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `filler-${i}`,
    section: "contact" as const,
    x: 1400,
    y: 20000 + 40 * i,
    width: 8,
    checkpoint: false,
  }));

const challengeSummary = (id: CourseId): CourseSummary => ({
  id,
  section: "projects",
  tier: "challenge",
  entryId: "x",
  exitId: "y",
  surfaceIds: [],
  catchIds: [],
  edgeTiers: {},
});

const cases: Array<[string, CourseRejection, (f: Fixture) => void]> = [
  [
    "a band too short for the course",
    "zone",
    (f) => {
      f.snapshot.sectionAnchors["tech-stack"] = {
        ...f.snapshot.sectionAnchors["tech-stack"],
        y: f.zone.rect.y + 80,
      };
    },
  ],
  [
    "a ledge whose standing body meets an enabled link",
    "placement",
    (f) => {
      f.snapshot.plannedTargets.push({
        id: "stray-link",
        label: "Stray",
        order: 99,
        rect: { x: 400, y: f.zone.rect.y + 150, width: 40, height: 20 },
        enabled: true,
      });
    },
  ],
  [
    "a ledge narrower than its tier allows",
    "placement",
    (f) => {
      f.blueprint = withLedge(f.blueprint, "u2", { width: 32 });
    },
  ],
  [
    "a corridor crossing a registered card top",
    "isolation",
    (f) => {
      f.snapshot.plannedSurfaces.push({
        id: "card-top",
        section: "about",
        x: 400,
        y: f.zone.rect.y + 100,
        width: 300,
        checkpoint: false,
      });
    },
  ],
  [
    "an unreachable ledge",
    "witness",
    (f) => {
      f.blueprint = withLedge(f.blueprint, "rest", { x: 900 });
    },
  ],
  [
    "edges harder than the declared tier",
    "tier",
    (f) => {
      f.blueprint = withLedges(
        { ...f.blueprint, tier: "comfortable" },
        ledgesOf(f.blueprint).map((ledge) =>
          ledge.catch ? ledge : { ...ledge, width: Math.max(96, ledge.width) },
        ),
      );
    },
  ],
  [
    "two challenge edges without a rest ledge between them",
    "rhythm",
    (f) => {
      f.blueprint = withLedge(f.blueprint, "u2", { width: 40 });
    },
  ],
  [
    "a third challenge course",
    "rhythm",
    (f) => {
      f.world = {
        ...f.world,
        courses: [challengeSummary("grid-run"), challengeSummary("precision-ledges")],
      };
    },
  ],
  [
    "a catch floor with a hole under a challenge gap",
    "catch",
    (f) => {
      f.blueprint = withLedges(f.blueprint, [
        ...ledgesOf(f.blueprint).filter((ledge) => !ledge.catch),
        { id: "catch-far", x: 448, y: { bottom: 0 }, width: 200, catch: true },
        { id: "catch-near", x: 48, y: { bottom: 0 }, width: 304, catch: true },
      ]);
    },
  ],
  [
    "an action ledge reachable only through a replaced helper",
    "graph",
    (f) => {
      const stray: Surface = {
        id: "branch-stray",
        section: "about",
        x: 1300,
        y: 1918,
        width: 32,
        checkpoint: false,
      };
      f.world = {
        ...f.world,
        surfaces: [...f.world.surfaces, stray],
        connections: [
          ...f.world.connections,
          { from: "helper-2-8", to: stray.id, frames: [], corridor: [] },
          { from: stray.id, to: "helper-2-8", frames: [], corridor: [] },
        ],
        actionLedges: { ...f.world.actionLedges, "stray-actions": stray.id },
      };
    },
  ],
  [
    "a world with no room for the course surfaces",
    "budget",
    (f) => {
      f.world = { ...f.world, surfaces: [...f.world.surfaces, ...filler(150)] };
    },
  ],
];

for (const [name, reason, mutate] of cases)
  test(`course rejects (${reason}): ${name}`, () => {
    const f = baseFixture();
    mutate(f);
    assert.deepEqual(validateCourse(f.blueprint, contextOf(f)), { ok: false, reason });
  });

test("an accepted course replaces the spanned helpers with bidirectional, replayable witnesses within its tier", () => {
  const f = baseFixture();
  const started = performance.now();
  const r = validateCourse(f.blueprint, contextOf(f));
  const elapsed = performance.now() - started;
  assert.ok(r.ok);
  assert.equal(r.summary.entryId, "helper-2-7");
  assert.equal(r.summary.exitId, "checkpoint-tech-stack");
  assert.deepEqual(r.removedIds, ["helper-2-8"]);
  assert.deepEqual(r.summary.catchIds, ["course-grid-run-catch"]);
  assert.deepEqual(
    r.summary.surfaceIds,
    ledgesOf(testCourse).map((ledge) => `course-grid-run-${ledge.id}`),
  );
  const final = [
    ...f.world.surfaces.filter((s) => !r.removedIds.includes(s.id)),
    ...r.surfaces,
  ];
  for (const c of r.connections) {
    assert.ok(replay(c, final, tuning), `${c.from}>${c.to}`);
    assert.ok(r.connections.some((d) => d.from === c.to && d.to === c.from));
    assert.ok(r.summary.edgeTiers[`${c.from}>${c.to}`]);
  }
  for (const t of Object.values(r.summary.edgeTiers))
    assert.ok(tierOrder.indexOf(t) <= tierOrder.indexOf(r.summary.tier));
  assert.ok(Object.values(r.summary.edgeTiers).includes("challenge"));
  assert.ok(r.corridor.length > 0);
  assert.ok(elapsed < 50, `validateCourse took ${elapsed.toFixed(1)} ms`);
});
