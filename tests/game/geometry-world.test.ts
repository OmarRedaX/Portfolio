import test from "node:test";
import assert from "node:assert/strict";
import { readGeometry } from "../../lib/game/geometry";
import { sectionIds, type Tuning } from "../../lib/game/model";
import { spawn, step } from "../../lib/game/physics";
import { buildWorld } from "../../lib/game/world";

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

test("planned reveal surfaces cannot catch the live body before settled revalidation", () => {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
  };
  let scrollY = 0;
  const sections = sectionIds.map((id, i) => ({
    dataset: { gameSection: id },
    parentElement: null,
    classList: { contains: () => false },
    hasAttribute: () => false,
    getBoundingClientRect: () => ({
      left: 0,
      top: i * 760 - scrollY,
      width: 768,
      height: 760,
    }),
    querySelector: () => ({
      parentElement: null,
      classList: { contains: () => false },
      hasAttribute: () => false,
      getBoundingClientRect: () => ({
        left: 32,
        top: i * 760 + 80 - scrollY,
        width: 689,
        height: 58,
      }),
    }),
  }));
  const reveal = {
    dataset: { gameRevealState: "pending" },
    parentElement: sections[1],
    classList: { contains: () => false },
    hasAttribute: (name: string) => name === "data-game-reveal-state",
  };
  const surface = {
    dataset: { gameSurface: "revealed-card" },
    parentElement: reveal,
    isConnected: true,
    classList: { contains: () => false },
    hasAttribute: () => false,
    getClientRects: () => [{}],
    getBoundingClientRect: () => ({
      left: 300,
      top: 1000 - scrollY,
      width: 80,
      height: 40,
    }),
    closest: (selector: string) =>
      selector === "[data-game-section]"
        ? sections[1]
        : selector === "[data-game-reveal-state]"
          ? reveal
          : null,
  };
  const root = {
    querySelectorAll: (selector: string) =>
      selector === "[data-game-section]" ? sections : [surface],
  } as unknown as HTMLElement;
  Object.assign(globalThis, {
    window: {
      scrollX: 0,
      get scrollY() {
        return scrollY;
      },
      innerHeight: 900,
    },
    document: { querySelector: () => null },
    getComputedStyle: () => ({
      display: "block",
      visibility: "visible",
      transform: "none",
    }),
  });
  try {
    const pending = readGeometry(root);
    assert.equal(
      pending.revealsSettled,
      true,
      "offscreen planning must not block the neighborhood",
    );
    assert.equal(pending.plannedSurfaces.length, 1);
    assert.equal(pending.surfaces.length, 0);
    const viewport = { width: 768, usableHeight: 700 };
    const before = buildWorld(pending, tuning, viewport, 1);
    assert.ok(before.ok);
    const falling = {
      x: 320,
      y: 967,
      width: 24,
      height: 32,
      vx: 0,
      vy: 240,
      groundedOn: null,
    };
    const still = { direction: 0 as const, jumpPressed: false };
    assert.equal(
      step(falling, still, before.world.surfaces, tuning).landedOn,
      null,
      "pending DOM geometry must not support production physics",
    );

    // Observed live at 1024px: a pending reveal peeking into the viewport below
    // its whileInView threshold never starts, so it must not block validation.
    scrollY = 200;
    const peeking = readGeometry(root);
    assert.equal(peeking.revealsSettled, true, "a pending reveal is not moving geometry");
    assert.equal(peeking.surfaces.length, 0);
    const peekingWorld = buildWorld(peeking, tuning, viewport, 5);
    assert.ok(peekingWorld.ok);
    assert.equal(
      step(falling, still, peekingWorld.world.surfaces, tuning).landedOn,
      null,
      "pending geometry in view still must not support production physics",
    );
    scrollY = 0;

    reveal.dataset.gameRevealState = "moving";
    scrollY = 900;
    assert.deepEqual(buildWorld(readGeometry(root), tuning, viewport, 2), {
      ok: false,
      reason: "layout",
    });
    reveal.dataset.gameRevealState = "settled";
    scrollY = 0;
    const settled = readGeometry(root);
    assert.equal(settled.surfaces.length, 1);
    assert.equal(
      step(falling, still, before.world.surfaces, tuning).landedOn,
      null,
      "settlement alone must not mutate the previously validated world",
    );
    // Same version and planned positions: active membership must invalidate the cache.
    const after = buildWorld(settled, tuning, viewport, 1);
    assert.ok(after.ok);
    assert.equal(
      step(falling, still, after.world.surfaces, tuning).landedOn,
      "revealed-card",
    );
    for (const world of [before.world, after.world]) {
      for (const edge of world.connections) {
        let body = spawn(
          world.surfaces.find((candidate) => candidate.id === edge.from)!,
          tuning,
        );
        for (const input of edge.frames)
          body = step(body, input, world.surfaces, tuning).body;
        assert.equal(body.groundedOn, edge.to);
        assert.ok(
          world.connections.some(
            (reverse) => reverse.from === edge.to && reverse.to === edge.from,
          ),
        );
      }
    }
  } finally {
    Object.assign(globalThis, previous);
  }
});
