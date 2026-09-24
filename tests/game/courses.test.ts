import test from "node:test";
import assert from "node:assert/strict";
import {
  blueprints,
  compileCourse,
  courseSpan,
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
import { bandCourse, bandFixture } from "./fixtures/band";
import { measuredHomepage, type MeasuredViewport } from "./fixtures/rendered-homepage";

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

const lane = (x: number, width = 32) => ({ x, width });

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
    lane(120),
    tuning,
  )!;
  // About's keep-outs end at 1740 (+12); the Tech Stack heading starts at 2036 (−12).
  // X runs from the lane's content side (120 + 32) to the content right edge at 1248.
  assert.deepEqual(zone.rect, { x: 152, y: 1752, width: 1096, height: 272 });
  assert.equal(zone.laneSide, "left");
  assert.equal(zone.contentLeft, 184);
});

test("the cool-down band is the one above Contact, ending at Contact's first content", () => {
  const zone = findZone(
    blueprintById("cool-down"),
    bandFixture(),
    1440,
    lane(120),
    tuning,
  )!;
  // Experience entries end at 5504 (+12); Contact's column starts at 5760 (−12).
  assert.deepEqual(zone.rect, { x: 152, y: 5516, width: 1096, height: 232 });
});

test("a right-lane zone ends at the lane's content side", () => {
  const snapshot = bandFixture();
  const zone = findZone(
    blueprintById("stepping-stones"),
    snapshot,
    1440,
    lane(1300),
    tuning,
  )!;
  assert.equal(zone.laneSide, "right");
  assert.equal(zone.rect.x, 184);
  assert.equal(zone.rect.x + zone.rect.width, 1300);
});

test("course offsets start at the lane's content side, whatever the lane's width", () => {
  const bp = blueprintById("stepping-stones");
  const snapshot = bandFixture();
  const compile = (x: number, width: number) =>
    compileCourse(
      bp,
      findZone(bp, snapshot, 1440, lane(x, width), tuning)!,
      snapshot,
      tuning,
    );
  assert.deepEqual(compile(120, 32), compile(140, 12));
});

test("hero floor runs from the Hero action row down to the Hero bottom", () => {
  const zone = findZone(
    blueprintById("launch-pad"),
    bandFixture(),
    1440,
    lane(120),
    tuning,
  )!;
  assert.deepEqual(zone.rect, { x: 152, y: 725, width: 1096, height: 227 });
});

test("gutter zone requires two lanes and is null at 1024", () => {
  assert.equal(
    findZone(
      blueprintById("timeline-rungs"),
      measuredHomepage("1024-overlay").snapshot,
      1024,
      lane(0),
      tuning,
    ),
    null,
  );
});

test("gutter zone spans viewport edge to content left and needs room for the clearance", () => {
  const wide = measuredHomepage("1440");
  const zone = findZone(
    blueprintById("timeline-rungs"),
    wide.snapshot,
    wide.width,
    lane(56),
    tuning,
  )!;
  assert.equal(zone.rect.x, 0);
  assert.equal(zone.rect.width, wide.snapshot.sectionAnchors.hero.x);
  // 1280's 104.5 px gutter is narrower than two 48 px rungs, their gap and the clearance.
  const narrow = measuredHomepage("1280");
  assert.ok(narrow.snapshot.sectionAnchors.hero.x < 2 * 48 + 8 + 12);
  assert.equal(
    findZone(
      blueprintById("timeline-rungs"),
      narrow.snapshot,
      narrow.width,
      lane(56),
      tuning,
    ),
    null,
  );
});

test("compilation mirrors for a right lane, snaps to 8px from content left, and is deterministic", () => {
  const bp = blueprintById("stepping-stones");
  const snapshot = bandFixture();
  const zoneLeft = findZone(bp, snapshot, 1440, lane(120), tuning)!;
  const zoneRight = findZone(bp, snapshot, 1440, lane(1256), tuning)!;
  assert.equal(zoneRight.laneSide, "right");
  const left = compileCourse(bp, zoneLeft, snapshot, tuning)!,
    right = compileCourse(bp, zoneRight, snapshot, tuning)!;
  for (const s of [...left, ...right])
    assert.equal(Math.abs((s.x - zoneLeft.contentLeft) % 8), 0);
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
  const zoneLeft = findZone(bp, snapshot, 1440, lane(120), tuning)!;
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
  const zone = findZone(bp, snapshot, width, lane(120), tuning)!;
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

const measuredBackbone = (viewport: "1440" | "1280") => {
  const { snapshot, width, usableHeight } = measuredHomepage(viewport);
  const built = buildWorld(snapshot, tuning, { width, usableHeight }, 1, {
    courses: false,
  });
  assert.ok(built.ok);
  const { x, width: laneWidth } = built.world.surfaces.find(
    (s) => s.id === "helper-1-1",
  )!;
  return { snapshot, width, world: built.world, laneX: x, lane: lane(x, laneWidth) };
};

test("backbone button ledges bound a zone like content does", () => {
  const { snapshot, width, world, lane: backboneLane } = measuredBackbone("1440");
  const ledges = world.surfaces.filter(
    (s) => s.id.startsWith("action-") || s.id.startsWith("branch-"),
  );
  const top = (id: CourseId) =>
    findZone(blueprintById(id), snapshot, width, backboneLane, tuning, ledges)!.rect.y;
  const terrace = (prefix: string) =>
    Math.max(...ledges.filter((s) => s.id.startsWith(prefix)).map((s) => s.y));
  assert.equal(top("launch-pad"), terrace("branch-hero-actions") + 12);
  assert.equal(
    top("precision-ledges"),
    terrace("branch-project-fresh-cart-actions") + 12,
  );
});

test("a course enters from the first lane surface whose standing body is inside its zone", () => {
  const { snapshot, width, world, laneX, lane: backboneLane } = measuredBackbone("1440");
  const zone = findZone(
    blueprintById("stepping-stones"),
    snapshot,
    width,
    backboneLane,
    tuning,
  )!;
  const span = courseSpan(world, zone, laneX, tuning)!;
  assert.equal(span.entry.id, "helper-2-7");
  assert.ok(span.entry.y - tuning.bodyHeight >= zone.rect.y);
  assert.ok(
    world.surfaces.some(
      (s) =>
        s.x === laneX && s.y < span.entry.y && s.y - tuning.bodyHeight >= zone.rect.y,
    ) === false,
  );
});

test("rungs keep the course clearance from the content edge", () => {
  const { snapshot, width, lane: backboneLane } = measuredBackbone("1440");
  const bp = blueprintById("timeline-rungs");
  const zone = findZone(bp, snapshot, width, backboneLane, tuning)!;
  const rungs = compileCourse(bp, zone, snapshot, tuning)!;
  for (const rung of rungs)
    assert.ok(rung.x + rung.width <= zone.contentLeft - 12, rung.id);
});

type Fixture = {
  snapshot: GeometrySnapshot;
  world: World;
  blueprint: CourseBlueprint;
  zone: Zone;
};

function baseFixture(): Fixture {
  const snapshot = bandFixture();
  const built = buildWorld(snapshot, tuning, { width: 1440, usableHeight: 700 }, 1, {
    courses: false,
  });
  assert.ok(built.ok);
  return {
    snapshot: bandFixture(),
    world: built.world,
    blueprint: bandCourse,
    zone: findZone(bandCourse, snapshot, 1440, lane(120), tuning)!,
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
        rect: { x: 460, y: f.zone.rect.y + 200, width: 40, height: 20 },
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
    "a catch floor too far below the run to climb back gently",
    "catch",
    (f) => {
      f.blueprint = withLedges(
        f.blueprint,
        ledgesOf(f.blueprint).map((ledge) =>
          ledge.catch || ledge.id === "d1" ? ledge : { ...ledge, y: { bottom: 88 } },
        ),
      );
    },
  ],
  [
    "an action ledge reachable only through a replaced helper",
    "graph",
    (f) => {
      const stray: Surface = {
        id: "stray-ledge",
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
    ledgesOf(bandCourse).map((ledge) => `course-grid-run-${ledge.id}`),
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

// Launch pad and cool-down cannot return to their entry within the comfortable
// rise, timeline rungs cannot share the gutter with the backbone lane, and the
// 1024/768 bands are shorter than one jump's headroom (docs/game-mode-validation.md).
test("measured worlds activate the courses that fit, with challenge courses actually challenging", () => {
  const expected: Record<MeasuredViewport, CourseId[]> = {
    "1440": ["stepping-stones", "grid-run", "precision-ledges"],
    "1280": ["stepping-stones", "grid-run", "precision-ledges"],
    "1024-overlay": [],
    "768-classic": [],
  };
  for (const v of Object.keys(expected) as MeasuredViewport[]) {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    const r = buildWorld(snapshot, tuning, { width, usableHeight }, 1);
    assert.ok(r.ok, v);
    assert.deepEqual(
      r.world.courses.map((c) => c.id),
      expected[v],
      v,
    );
    for (const c of r.world.courses.filter((c) => c.tier === "challenge"))
      assert.ok(
        Object.values(c.edgeTiers).includes("challenge"),
        `${v} ${c.id} is not actually challenging`,
      );
  }
});
