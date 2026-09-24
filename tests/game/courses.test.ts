import test from "node:test";
import assert from "node:assert/strict";
import {
  blueprints,
  compileCourse,
  edgeTier,
  findZone,
  type CourseBlueprint,
} from "../../lib/game/courses";
import type { CourseId, Surface, Tuning } from "../../lib/game/model";
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
