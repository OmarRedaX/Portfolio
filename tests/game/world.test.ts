import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWorld,
  integrateCourses,
  outsidePlayablePath,
  routeEnvelope,
  viewportSupportsRoute,
} from "../../lib/game/world";
import { replay } from "../../lib/game/witness";
import { bandCourse, bandFixture } from "./fixtures/band";
import { spawn, step } from "../../lib/game/physics";
import { createSession, transition } from "../../lib/game/session";
import { settledProjects } from "./fixtures/rendered-projects";
import { measuredHomepage } from "./fixtures/rendered-homepage";
import {
  sectionIds,
  type GeometrySnapshot,
  type Rect,
  type Tuning,
  type World,
} from "../../lib/game/model";

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
const box = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
});

function fixture(gap = 760): GeometrySnapshot {
  const sectionBounds = Object.fromEntries(
    sectionIds.map((id, i) => [id, box(0, i * gap, 753, gap)]),
  ) as GeometrySnapshot["sectionBounds"];
  const sectionAnchors = Object.fromEntries(
    sectionIds.map((id, i) => [id, box(32, i * gap + 80, 689, 58)]),
  ) as GeometrySnapshot["sectionAnchors"];
  return {
    surfaces: [],
    plannedSurfaces: [],
    targets: [],
    plannedTargets: [],
    elements: new Map(),
    sectionBounds,
    sectionAnchors,
    obstacles: [],
    keepouts: [],
    actionRows: [],
    plannedActionRows: [],
    headerBottom: 84,
    revealsSettled: true,
  };
}

test("wide two-section route has simulated witnesses in both directions or fails closed", () => {
  const snapshot = fixture(1000);
  snapshot.obstacles.push(box(0, 450, 753, 90));
  const result = buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 1);
  if (!result.ok) {
    assert.equal(result.reason, "layout");
    return;
  }
  for (const connection of result.world.connections) {
    const start = result.world.surfaces.find(
      (surface) => surface.id === connection.from,
    )!;
    let body = spawn(start, tuning);
    for (const input of connection.frames)
      body = step(body, input, result.world.surfaces, tuning).body;
    assert.equal(body.groundedOn, connection.to);
    assert.ok(
      result.world.connections.some(
        (edge) => edge.from === connection.to && edge.to === connection.from,
      ),
    );
  }
});

test("clear layout produces six checkpoints and repeatable, bidirectional witnesses", () => {
  const snapshot = fixture();
  const a = buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 4);
  const b = buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 4);
  assert.ok(a.ok && b.ok);
  assert.deepEqual(a, b);
  assert.equal(Object.keys(a.world.checkpoints).length, 6);
  for (const connection of a.world.connections) {
    const start = a.world.surfaces.find((surface) => surface.id === connection.from)!;
    let body = spawn(start, tuning);
    for (const input of connection.frames)
      body = step(body, input, a.world.surfaces, tuning).body;
    assert.equal(body.groundedOn, connection.to);
    assert.ok(
      a.world.connections.some(
        (edge) => edge.from === connection.to && edge.to === connection.from,
      ),
    );
  }
});

test("unsupported width and insufficient usable height reject the route", () => {
  assert.deepEqual(buildWorld(fixture(), tuning, { width: 767, usableHeight: 700 }, 1), {
    ok: false,
    reason: "viewport",
  });
  assert.deepEqual(buildWorld(fixture(), tuning, { width: 768, usableHeight: 120 }, 1), {
    ok: false,
    reason: "viewport",
  });
});

test("blocked narrow gutters fail rather than placing helpers over readable content", () => {
  const snapshot = fixture();
  snapshot.obstacles.push(box(0, 0, 753, 4500));
  assert.deepEqual(buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 1), {
    ok: false,
    reason: "layout",
  });
});

test("768px route clears content whose subpixel right edge exceeds its anchor", () => {
  const snapshot = fixture();
  // Chromium measured anchor right=720.7999878 and content right=720.8000145.
  // Preserve that tiny difference in a minimal six-checkpoint layout.
  snapshot.obstacles.push(box(32, 0, 689.00003, 4500));
  const result = buildWorld(snapshot, tuning, { width: 768, usableHeight: 705 }, 1);
  assert.ok(result.ok, "a clear right gutter must produce a validated route");
  assert.equal(Object.keys(result.world.checkpoints).length, 6);
  for (const connection of result.world.connections) {
    let body = spawn(
      result.world.surfaces.find((s) => s.id === connection.from)!,
      tuning,
    );
    for (const input of connection.frames) {
      body = step(body, input, result.world.surfaces, tuning).body;
      assert.ok(body.x >= 721.00003 + 2, "witness must retain content clearance");
    }
    assert.equal(body.groundedOn, connection.to);
  }
});

test("settled Projects action rows revalidate after browsing without auto-resuming", () => {
  const snapshot = settledProjects();
  const viewport = { width: 1440, usableHeight: 705 };
  // Wheel browsing reveals the two lower cards after arrival at Projects.
  const before = {
    ...snapshot,
    targets: snapshot.targets.map((target) => ({
      ...target,
      enabled:
        target.enabled && !["social-media-repo", "fresh-cart-repo"].includes(target.id),
    })),
  };
  assert.ok(buildWorld(before, tuning, viewport, 1).ok);
  const state = {
    ...createSession(),
    phase: "playing" as const,
    checkpoint: "checkpoint-projects",
    layoutValid: true,
  };
  const paused = transition(state, { type: "PAUSE", reason: "browsing" }).state;
  const moving = buildWorld({ ...snapshot, revealsSettled: false }, tuning, viewport, 2);
  assert.deepEqual(moving, { ok: false, reason: "layout" });
  const blocked = transition(paused, { type: "VALIDATED", valid: false }).state;
  const settled = buildWorld(snapshot, tuning, viewport, 3);
  assert.ok(settled.ok, "settled neighboring action rows must have a safe route");
  assert.ok(settled.world.surfaces.some((surface) => surface.id === blocked.checkpoint));
  const validated = transition(blocked, { type: "VALIDATED", valid: true }).state;
  assert.equal(validated.phase, "paused");
  assert.equal(validated.checkpoint, "checkpoint-projects");
  assert.equal(validated.layoutValid, true);
  assert.ok(!validated.reasons.includes("layout"));
  const ready = transition(validated, { type: "CLEAR_REASON", reason: "browsing" }).state;
  assert.equal(transition(ready, { type: "RESUME" }).state.phase, "repositioning");
  for (const connection of settled.world.connections) {
    let body = spawn(
      settled.world.surfaces.find((surface) => surface.id === connection.from)!,
      tuning,
    );
    for (const input of connection.frames)
      body = step(body, input, settled.world.surfaces, tuning).body;
    assert.equal(body.groundedOn, connection.to);
  }
});

test("route recovery permits an ordinary fall toward lower ledges but detects sideways escape", () => {
  const result = buildWorld(fixture(), tuning, { width: 768, usableHeight: 700 }, 1);
  assert.ok(result.ok);
  const ledge = result.world.surfaces[2];
  const falling = {
    ...spawn(ledge, tuning),
    x: ledge.x + 40,
    y: ledge.y + 18,
    groundedOn: null,
    vy: 200,
  };
  assert.equal(outsidePlayablePath(falling, result.world), false);
  assert.equal(outsidePlayablePath({ ...falling, x: 300 }, result.world), true);
});

test("measured 768px homepage has a playable checkpoint and action route", () => {
  const snapshot = fixture();
  const anchorY = [624.25, 1039.58, 1860.3, 3380.48, 5111.8, 5919.45];
  const anchorH = [67.59, 57.78, 57.78, 57.78, 57.78, 129.58];
  for (let i = 0; i < sectionIds.length; i++)
    snapshot.sectionAnchors[sectionIds[i]] = box(32, anchorY[i], 689, anchorH[i]);
  snapshot.obstacles = [
    box(32, 381.7, 209, 18),
    box(32, 423.9, 689, 48),
    box(32, 496.3, 672, 29),
    box(32, 549.1, 672, 51),
    box(32, 1137.4, 689, 394),
    box(58, 5207.6, 663, 191),
    box(58, 5438.7, 663, 242),
    box(32, 6097, 689, 474),
  ];
  const rows: Array<[string, number, number, number, number]> = [
    ["hero-actions", 32, 624.25, 689, 67.59],
    ["project-quick-bite-actions", 65, 4252.53, 623, 99.19],
    ["project-social-media-actions", 65, 4860.42, 262.5, 33.59],
    ["project-fresh-cart-actions", 425.5, 4886.61, 262.5, 33.59],
    ["contact-actions", 32, 5919.45, 689, 129.58],
  ];
  snapshot.plannedActionRows = rows.map(([id, x, y, w, h]) => ({
    id,
    section: id.startsWith("hero")
      ? "hero"
      : id.startsWith("contact")
        ? "contact"
        : "projects",
    rect: box(x, y, w, h),
  }));
  const links: Array<[string, number, number, number, number]> = [
    ["hero-projects", 32, 640.3, 122.4, 51.6],
    ["hero-resume", 170.4, 640.3, 109.9, 51.6],
    ["hero-contact", 296.3, 640.3, 106.3, 51.6],
    ["quick-bite-core", 65, 4260.5, 109.6, 25.6],
    ["quick-bite-order", 190.6, 4260.5, 115.5, 25.6],
    ["quick-bite-analytics", 322.2, 4260.5, 140.1, 25.6],
    ["quick-bite-overview", 478.2, 4260.5, 84.7, 25.6],
    ["quick-bite-caseStudy", 65, 4302.1, 130.3, 49.6],
    ["social-media-repo", 65, 4868.4, 95.5, 25.6],
    ["fresh-cart-repo", 425.5, 4894.6, 95.5, 25.6],
    ["contact-email", 32, 5919.5, 194.8, 25.6],
    ["contact-linkedin", 32, 5953, 60, 25.6],
    ["contact-github", 32, 5986.6, 50.9, 25.6],
  ];
  snapshot.targets = links.map(([id, x, y, w, h], order) => ({
    id,
    label: id,
    order,
    rect: box(x, y, w, h),
    enabled: true,
  }));
  const registered: Array<[string, "tech-stack" | "projects", number, number, number]> = [
    ["stack-frontend-top", "tech-stack", 32, 1954.1, 332.5],
    ["stack-backend-top", "tech-stack", 388.5, 1954.1, 332.5],
    ["stack-databases-data-top", "tech-stack", 32, 2290.6, 332.5],
    ["stack-system-design-architecture-top", "tech-stack", 32, 2645.3, 689],
    ["stack-cloud-tooling-top", "tech-stack", 32, 2951.6, 332.5],
    ["project-quick-bite-top", "projects", 32, 3478.3, 689],
    ["project-social-media-top", "projects", 32, 4412.7, 328.5],
    ["project-fresh-cart-top", "projects", 392.5, 4412.7, 328.5],
  ];
  snapshot.plannedSurfaces = registered.map(([id, section, x, y, width]) => ({
    id,
    section,
    x,
    y,
    width,
    checkpoint: false,
  }));
  snapshot.surfaces = [...snapshot.plannedSurfaces];
  const result = buildWorld(snapshot, tuning, { width: 768, usableHeight: 720 }, 1);
  assert.ok(result.ok, JSON.stringify(result));
  assert.equal(Object.keys(result.world.actionLedges).length, 5);
  const fresh = result.world.surfaces.find(
    (surface) => surface.id === result.world.actionLedges["project-fresh-cart-actions"],
  );
  assert.ok(fresh);
  assert.ok(fresh.x + fresh.width >= 425.5 - tuning.reachX);
  for (const connection of result.world.connections) {
    const start = result.world.surfaces.find(
      (surface) => surface.id === connection.from,
    )!;
    let body = spawn(start, tuning);
    for (const input of connection.frames)
      body = step(body, input, result.world.surfaces, tuning).body;
    assert.equal(body.groundedOn, connection.to);
    assert.ok(
      connection.corridor.every((rect) => rect.x >= 0 && rect.x + rect.width <= 768),
    );
  }
});

test("measured 1440px homepage retains a witnessed route", () => {
  const snapshot = fixture();
  const y = [645.42, 1090.78, 1977.91, 3276.05, 4905.42, 5791.89];
  const h = [67.59, 71.58, 71.58, 71.58, 71.58, 129.58];
  for (let i = 0; i < sectionIds.length; i++)
    snapshot.sectionAnchors[sectionIds[i]] = box(
      184.5,
      y[i],
      i === 5 ? 458.17 : 1056,
      h[i],
    );
  snapshot.obstacles = [
    box(184.5, 360.53, 209, 18),
    box(184.5, 402.72, 896, 91),
    box(184.5, 517.44, 672, 29),
    box(184.5, 570.23, 672, 51),
    box(184.5, 1202.36, 768, 365),
    box(210.5, 5015, 1030, 191),
    box(210.5, 5246.16, 1030, 191),
    box(690.67, 5696.31, 549.83, 474),
  ];
  snapshot.plannedActionRows = [
    { id: "hero-actions", section: "hero", rect: box(184.5, 645.42, 1056, 67.59) },
    {
      id: "project-quick-bite-actions",
      section: "projects",
      rect: box(225.5, 4080.31, 974, 57.59),
    },
    {
      id: "project-social-media-actions",
      section: "projects",
      rect: box(217.5, 4526.05, 446, 33.59),
    },
    {
      id: "project-fresh-cart-actions",
      section: "projects",
      rect: box(761.5, 4577.83, 446, 33.59),
    },
    {
      id: "contact-actions",
      section: "contact",
      rect: box(184.5, 5791.89, 458.17, 129.58),
    },
  ];
  const result = buildWorld(snapshot, tuning, { width: 1440, usableHeight: 720 }, 2);
  assert.ok(result.ok, JSON.stringify(result));
  assert.equal(Object.keys(result.world.actionLedges).length, 5);
});

function measured1024(): GeometrySnapshot {
  const snapshot = fixture();
  const y = [632.31, 1065.17, 1895, 3256.59, 4848.78, 5671.88];
  const h = [67.59, 65.5, 65.5, 65.5, 65.5, 129.58];
  for (let i = 0; i < sectionIds.length; i++)
    snapshot.sectionAnchors[sectionIds[i]] = box(48, y[i], i === 5 ? 393.17 : 913, h[i]);
  snapshot.obstacles = [
    box(48, 373.64, 209, 18),
    box(48, 415.83, 896, 65),
    box(48, 504.33, 672, 29),
    box(48, 557.13, 672, 51),
    box(48, 1170.67, 768, 365),
    box(74, 4952.28, 887, 191),
    box(74, 5183.44, 887, 191),
    box(489.17, 5582.38, 471.83, 474),
  ];
  snapshot.plannedActionRows = [
    { id: "hero-actions", section: "hero", rect: box(48, 632.31, 913, 67.59) },
    {
      id: "project-quick-bite-actions",
      section: "projects",
      rect: box(89, 4074.89, 831, 57.59),
    },
    {
      id: "project-social-media-actions",
      section: "projects",
      rect: box(81, 4572.41, 374.5, 33.59),
    },
    {
      id: "project-fresh-cart-actions",
      section: "projects",
      rect: box(553.5, 4572.41, 374.5, 33.59),
    },
    { id: "contact-actions", section: "contact", rect: box(48, 5671.88, 393.17, 129.58) },
  ];
  const links: Array<[string, number, number, number, number]> = [
    ["hero-projects", 48, 648.3, 122.4, 51.6],
    ["hero-resume", 186.4, 648.3, 109.9, 51.6],
    ["hero-contact", 312.3, 648.3, 106.3, 51.6],
    ["quick-bite-core", 89, 4082.9, 109.6, 49.6],
    ["quick-bite-order", 214.6, 4082.9, 115.5, 49.6],
    ["quick-bite-analytics", 346.2, 4082.9, 140.1, 49.6],
    ["quick-bite-overview", 502.2, 4082.9, 84.7, 49.6],
    ["quick-bite-caseStudy", 602.9, 4082.9, 130.3, 49.6],
    ["social-media-repo", 81, 4580.4, 95.5, 25.6],
    ["fresh-cart-repo", 553.5, 4580.4, 95.5, 25.6],
    ["contact-email", 48, 5671.9, 194.8, 25.6],
    ["contact-linkedin", 48, 5705.5, 60, 25.6],
    ["contact-github", 48, 5739.1, 50.9, 25.6],
  ];
  snapshot.targets = links.map(([id, x, y, w, h], order) => ({
    id,
    label: id,
    order,
    rect: box(x, y, w, h),
    enabled: true,
  }));
  const supports: Array<[string, "tech-stack" | "projects", number, number, number]> = [
    ["stack-frontend-top", "tech-stack", 48, 1996.5, 444.5],
    ["stack-backend-top", "tech-stack", 516.5, 1996.5, 444.5],
    ["stack-databases-data-top", "tech-stack", 48, 2272.6, 444.5],
    ["stack-system-design-architecture-top", "tech-stack", 48, 2548.8, 913],
    ["stack-cloud-tooling-top", "tech-stack", 48, 2824.9, 444.5],
    ["project-quick-bite-top", "projects", 48, 3362.1, 913],
    ["project-social-media-top", "projects", 48, 4201.5, 440.5],
    ["project-fresh-cart-top", "projects", 520.5, 4201.5, 440.5],
  ];
  snapshot.plannedSurfaces = supports.map(([id, section, x, y, width]) => ({
    id,
    section,
    x,
    y,
    width,
    checkpoint: false,
  }));
  snapshot.surfaces = [...snapshot.plannedSurfaces];
  snapshot.plannedTargets = snapshot.targets.map((target) => ({
    ...target,
    enabled: true,
  }));
  return snapshot;
}

test("measured 1024px homepage retains a witnessed route", () => {
  const snapshot = measured1024();
  const result = buildWorld(snapshot, tuning, { width: 1024, usableHeight: 720 }, 3);
  assert.ok(result.ok, JSON.stringify(result));
  assert.equal(Object.keys(result.world.actionLedges).length, 5);
});

test("a Contact arrival before Projects has revealed keeps a witnessed 1024px route", () => {
  // Observed live: Hero's Contact action scrolls past Projects without
  // revealing it. Its rows keep planned ledges while their links stay disabled,
  // and the contact form beside the actions rules out the right gutter.
  const snapshot = measured1024();
  snapshot.surfaces = [];
  snapshot.targets = snapshot.targets.map((target) => ({
    ...target,
    enabled: target.id.startsWith("hero") || target.id.startsWith("contact"),
  }));
  const result = buildWorld(snapshot, tuning, { width: 1024, usableHeight: 705 }, 4);
  assert.ok(result.ok, JSON.stringify(result));
  assert.ok(
    result.world.surfaces.some(
      (surface) => surface.id === result.world.checkpoints.contact,
    ),
  );
  for (const connection of result.world.connections) {
    let body = spawn(
      result.world.surfaces.find((surface) => surface.id === connection.from)!,
      tuning,
    );
    for (const input of connection.frames)
      body = step(body, input, result.world.surfaces, tuning).body;
    assert.equal(body.groundedOn, connection.to);
    assert.ok(
      result.world.connections.some(
        (reverse) => reverse.from === connection.to && reverse.to === connection.from,
      ),
    );
  }
});

test("a viewport without permanent side room for the route is unsupported", () => {
  // Measured without a classic scrollbar at 768px: content spans 32–736, so
  // neither 32px gutter lets the 24px body step off a helper inside the viewport.
  const overlay = fixture();
  for (const id of sectionIds)
    overlay.sectionAnchors[id] = { ...overlay.sectionAnchors[id], width: 704 };
  const viewport = { width: 768, usableHeight: 705 };
  assert.deepEqual(buildWorld(overlay, tuning, viewport, 1), {
    ok: false,
    reason: "layout",
  });
  assert.equal(viewportSupportsRoute(overlay, tuning, viewport, 1), false);
  // A classic scrollbar ends content at 721 while innerWidth stays 768.
  assert.equal(viewportSupportsRoute(fixture(), tuning, viewport, 1), true);
  assert.equal(
    viewportSupportsRoute(fixture(), tuning, { width: 768, usableHeight: 120 }, 1),
    false,
  );
});

test("transient reveal state never makes a supported viewport unsupported", () => {
  const snapshot = measured1024();
  const revealing = {
    ...snapshot,
    surfaces: [],
    actionRows: [],
    targets: snapshot.targets.map((target) => ({ ...target, enabled: false })),
    revealsSettled: false,
  };
  const viewport = { width: 1024, usableHeight: 705 };
  assert.deepEqual(buildWorld(revealing, tuning, viewport, 6), {
    ok: false,
    reason: "layout",
  });
  assert.equal(viewportSupportsRoute(revealing, tuning, viewport, 6), true);
});

test("both ends of a wide action row have reachable registered links", () => {
  const snapshot = fixture();
  const row = box(65, 2800, 623, 80);
  snapshot.plannedActionRows = [{ id: "wide-actions", section: "projects", rect: row }];
  snapshot.targets = [
    {
      id: "near-link",
      label: "Near",
      order: 0,
      rect: box(65, 2820, 90, 30),
      enabled: true,
    },
    {
      id: "far-link",
      label: "Far",
      order: 1,
      rect: box(590, 2820, 98, 30),
      enabled: true,
    },
  ];
  const result = buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 8);
  assert.ok(result.ok);
  for (const target of snapshot.targets) {
    const ledge = result.world.surfaces.find(
      (surface) => surface.id === result.world.targetLedges[target.id],
    );
    assert.ok(ledge, target.id);
    const body = spawn(ledge, tuning);
    assert.ok(
      Math.abs(body.x + body.width / 2 - target.rect.x - target.rect.width / 2) <=
        tuning.reachX,
    );
    assert.ok(
      Math.abs(body.y + body.height / 2 - target.rect.y - target.rect.height / 2) <=
        tuning.reachY,
    );
    assert.ok(result.world.connections.some((edge) => edge.to === ledge.id));
    assert.ok(result.world.connections.some((edge) => edge.from === ledge.id));
  }
});

test("a lower platform outside horizontal overlap cannot prevent recovery", () => {
  const result = buildWorld(fixture(), tuning, { width: 768, usableHeight: 700 }, 9);
  assert.ok(result.ok);
  const body = {
    ...spawn(result.world.surfaces[0], tuning),
    x: 220,
    y: result.world.surfaces[0].y + 400,
    vy: 200,
    groundedOn: null,
  };
  result.world.surfaces.push({
    id: "unrelated-lower",
    section: "contact",
    x: 300,
    y: body.y + body.height + 100,
    width: 32,
    checkpoint: false,
  });
  assert.equal(outsidePlayablePath(body, result.world), true);
  assert.equal(outsidePlayablePath({ ...body, x: 305 }, result.world), false);
});

test("a registered intervening top participates in full-world collision validation", () => {
  const snapshot = fixture();
  snapshot.plannedSurfaces.push({
    id: "intervening-card",
    section: "projects",
    x: 0,
    y: 2550,
    width: 32,
    checkpoint: false,
  });
  snapshot.surfaces = [...snapshot.plannedSurfaces];
  const result = buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 10);
  if (!result.ok) {
    assert.equal(result.reason, "layout");
    return;
  }
  assert.ok(result.world.surfaces.some((surface) => surface.id === "intervening-card"));
  for (const connection of result.world.connections) {
    const start = result.world.surfaces.find(
      (surface) => surface.id === connection.from,
    )!;
    let body = spawn(start, tuning);
    for (const input of connection.frames)
      body = step(body, input, result.world.surfaces, tuning).body;
    assert.equal(body.groundedOn, connection.to);
  }
});

test("a repeated geometry version reuses its validation but a changed exclusion invalidates it", () => {
  const snapshot = fixture();
  const a = buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 11);
  const b = buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 11);
  assert.strictEqual(a, b);
  snapshot.obstacles.push(box(0, 0, 753, 4500));
  assert.deepEqual(buildWorld(snapshot, tuning, { width: 768, usableHeight: 700 }, 11), {
    ok: false,
    reason: "layout",
  });
});

test("minimum usable height accepts its exact boundary and rejects one pixel below", () => {
  const tall = buildWorld(fixture(), tuning, { width: 768, usableHeight: 700 }, 12);
  assert.ok(tall.ok);
  assert.ok(
    buildWorld(fixture(), tuning, { width: 768, usableHeight: tall.minUsableHeight }, 12)
      .ok,
  );
  assert.deepEqual(
    buildWorld(
      fixture(),
      tuning,
      { width: 768, usableHeight: tall.minUsableHeight - 1 },
      12,
    ),
    { ok: false, reason: "viewport" },
  );
});

for (const v of ["1440", "1280", "1024-overlay", "768-classic"] as const) {
  test(`measured ${v} fixture keeps today's backbone`, () => {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    assert.ok(buildWorld(snapshot, tuning, { width, usableHeight }, 1).ok);
  });
}

const band = { width: 1440, usableHeight: 700 };
const measuredViewports = ["1440", "1280", "1024-overlay", "768-classic"] as const;

// The band world with its synthetic course, alongside every measured homepage
// (whose own courses are tuned in a later task).
function worlds(): Array<{ name: string; world: World }> {
  const built = buildWorld(bandFixture(), tuning, band, 1, { blueprints: [bandCourse] });
  assert.ok(built.ok);
  const all = [{ name: "band", world: built.world }];
  for (const v of measuredViewports) {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    const r = buildWorld(snapshot, tuning, { width, usableHeight }, 1);
    if (r.ok) all.push({ name: v, world: r.world });
  }
  return all;
}

const reach = (start: string, edges: Array<[string, string]>) => {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const at = queue.shift()!;
    for (const [a, b] of edges)
      if (a === at && !seen.has(b)) {
        seen.add(b);
        queue.push(b);
      }
  }
  return seen;
};

test("a synthetic band world activates its course and removes only the spanned helpers", () => {
  const r = buildWorld(bandFixture(), tuning, band, 1, { blueprints: [bandCourse] });
  assert.ok(r.ok);
  const summary = r.world.courses.find((c) => c.id === "grid-run")!;
  assert.ok(summary);
  const entry = r.world.surfaces.find((s) => s.id === summary.entryId)!;
  const exit = r.world.surfaces.find((s) => s.id === summary.exitId)!;
  assert.ok(
    !r.world.surfaces.some(
      (s) =>
        s.x === entry.x && s.y > entry.y && s.y < exit.y && s.id.startsWith("helper-"),
    ),
  );
  const backbone = buildWorld(bandFixture(), tuning, band, 1, { courses: false });
  assert.ok(backbone.ok);
  const removed = backbone.world.surfaces
    .filter((s) => !r.world.surfaces.some((t) => t.id === s.id))
    .map((s) => s.id);
  assert.deepEqual(removed, ["helper-2-8"]);
  assert.ok(summary.surfaceIds.every((id) => r.world.surfaces.some((s) => s.id === id)));
  assert.ok(
    !r.world.connections.some((c) => c.from === "helper-2-8" || c.to === "helper-2-8"),
  );
});

test("every connection of every world replays on the final surface set and is bidirectional", () => {
  for (const { name, world } of worlds())
    for (const c of world.connections) {
      assert.ok(replay(c, world.surfaces, tuning), `${name} ${c.from}>${c.to}`);
      assert.ok(world.connections.some((d) => d.from === c.to && d.to === c.from));
    }
});

test("hero reaches every checkpoint, action ledge and course surface, and each returns to hero", () => {
  for (const { name, world } of worlds()) {
    const edges = world.connections.map((c) => [c.from, c.to] as [string, string]);
    const forward = reach(world.checkpoints.hero, edges);
    const backward = reach(
      world.checkpoints.hero,
      edges.map(([a, b]) => [b, a]),
    );
    const required = [
      ...Object.values(world.checkpoints),
      ...Object.values(world.actionLedges),
      ...world.courses.flatMap((c) => c.surfaceIds),
    ];
    for (const id of required)
      assert.ok(forward.has(id) && backward.has(id), `${name} ${id}`);
  }
});

test("course corridors and landings are part of the recovery envelope", () => {
  const r = buildWorld(bandFixture(), tuning, band, 1, { blueprints: [bandCourse] });
  assert.ok(r.ok);
  assert.deepEqual(
    r.world.envelope,
    routeEnvelope(r.world.surfaces, r.world.connections, tuning),
  );
  const floor = r.world.surfaces.find((s) => s.id === "course-grid-run-catch")!;
  assert.equal(outsidePlayablePath(spawn(floor, tuning), r.world), false);
});

const supportsWithoutCourses = (
  snapshot: GeometrySnapshot,
  width: number,
  usableHeight: number,
) =>
  buildWorld(
    {
      ...snapshot,
      surfaces: snapshot.plannedSurfaces,
      actionRows: snapshot.plannedActionRows,
      targets: snapshot.plannedTargets,
      revealsSettled: true,
    },
    tuning,
    { width, usableHeight },
    1,
    { courses: false },
  ).ok;

test("courses never change availability", () => {
  for (const v of measuredViewports) {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    assert.equal(
      viewportSupportsRoute(snapshot, tuning, { width, usableHeight }, 1),
      supportsWithoutCourses(snapshot, width, usableHeight),
      v,
    );
  }
  assert.ok(buildWorld(bandFixture(), tuning, band, 1, { blueprints: [bandCourse] }).ok);
  assert.ok(supportsWithoutCourses(bandFixture(), band.width, band.usableHeight));
});

test("course worlds are deterministic", () => {
  const a = buildWorld(bandFixture(), tuning, band, 11, { blueprints: [bandCourse] });
  const clone = structuredClone({ ...bandFixture(), elements: undefined });
  const b = buildWorld({ ...clone, elements: new Map() }, tuning, band, 12, {
    blueprints: [bandCourse],
  });
  assert.ok(a.ok && b.ok);
  assert.ok(a.world.courses.length > 0);
  assert.deepEqual({ ...a.world, version: 0 }, { ...b.world, version: 0 });
});

test("no course ledge is a checkpoint and checkpoint ids are unchanged", () => {
  const withCourses = buildWorld(bandFixture(), tuning, band, 1, {
    blueprints: [bandCourse],
  });
  const backbone = buildWorld(bandFixture(), tuning, band, 1, { courses: false });
  assert.ok(withCourses.ok && backbone.ok);
  assert.deepEqual(withCourses.world.checkpoints, backbone.world.checkpoints);
  const courseIds = new Set(withCourses.world.courses.flatMap((c) => c.surfaceIds));
  assert.ok(
    withCourses.world.surfaces.every((s) => !(courseIds.has(s.id) && s.checkpoint)),
  );
});

test("a final replay failure removes courses in reverse order down to the backbone", () => {
  const backbone = buildWorld(bandFixture(), tuning, band, 1, { courses: false });
  assert.ok(backbone.ok);
  const broken: World = {
    ...backbone.world,
    connections: backbone.world.connections.map((c, i) =>
      i === 0 ? { ...c, frames: [] } : c,
    ),
  };
  const integrated = integrateCourses(broken, bandFixture(), tuning, 1440, 120, [
    bandCourse,
  ]);
  assert.deepEqual(integrated.courses, []);
  assert.strictEqual(integrated, broken);
});

test("a changed keep-out invalidates a cached course validation", () => {
  const snapshot = bandFixture();
  const a = buildWorld(snapshot, tuning, band, 13, { blueprints: [bandCourse] });
  assert.ok(a.ok && a.world.courses.length === 1);
  snapshot.keepouts.push({ x: 400, y: 1940, width: 40, height: 20 });
  const b = buildWorld(snapshot, tuning, band, 13, { blueprints: [bandCourse] });
  assert.ok(b.ok);
  assert.deepEqual(b.world.courses, []);
});

test("pending reveals give the same courses as settled geometry or fail as layout", () => {
  const settled = bandFixture();
  settled.surfaces = [...settled.plannedSurfaces];
  const pending: GeometrySnapshot = {
    ...bandFixture(),
    surfaces: [],
    targets: bandFixture().plannedTargets.map((t) => ({ ...t, enabled: false })),
  };
  const a = buildWorld(settled, tuning, band, 1, { blueprints: [bandCourse] });
  const b = buildWorld(pending, tuning, band, 1, { blueprints: [bandCourse] });
  assert.ok(a.ok);
  if (b.ok)
    assert.deepEqual(
      b.world.courses.map((c) => c.id),
      a.world.courses.map((c) => c.id),
    );
  else assert.deepEqual(b, { ok: false, reason: "layout" });
  for (const v of measuredViewports) {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    const live = buildWorld(snapshot, tuning, { width, usableHeight }, 1);
    const early = buildWorld(
      {
        ...snapshot,
        surfaces: [],
        targets: snapshot.plannedTargets.map((t) => ({ ...t, enabled: false })),
      },
      tuning,
      { width, usableHeight },
      1,
    );
    if (live.ok && early.ok)
      assert.deepEqual(
        early.world.courses.map((c) => c.id),
        live.world.courses.map((c) => c.id),
        v,
      );
  }
});

test("course integration is identical with settled DOM surfaces and with none", () => {
  const backbone = buildWorld(bandFixture(), tuning, band, 1, { courses: false });
  assert.ok(backbone.ok);
  const withSurfaces = bandFixture();
  withSurfaces.surfaces = [...withSurfaces.plannedSurfaces];
  const a = integrateCourses(backbone.world, withSurfaces, tuning, 1440, 120, [
    bandCourse,
  ]);
  const b = integrateCourses(
    backbone.world,
    { ...bandFixture(), surfaces: [] },
    tuning,
    1440,
    120,
    [bandCourse],
  );
  assert.ok(a.courses.length > 0);
  assert.deepEqual(a, b);
});
