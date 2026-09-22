import test from "node:test";
import assert from "node:assert/strict";
import {
  observeGeometry,
  readGeometry,
  signalRevealGeometry,
  toDocumentRect,
} from "../../lib/game/geometry";

test("document rectangles retain their document position after scrolling", () => {
  const rect = toDocumentRect(
    { left: 24, top: 180, width: 120, height: 32 },
    { x: 16, y: 540 },
  );

  assert.deepEqual(rect, { x: 40, y: 720, width: 120, height: 32 });
});

test("moving supports remain planned while hidden and moving actions cannot activate", () => {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
  };
  const section = {
    dataset: { gameSection: "hero" },
    parentElement: null,
    classList: { contains: () => false },
    hasAttribute: () => false,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 768, height: 900 }),
    querySelector: () => null,
  };
  const reveal = {
    dataset: { gameRevealState: "moving" },
    parentElement: section,
    classList: { contains: () => false },
    hasAttribute: (name: string) => name === "data-game-reveal-state",
  };
  function item(
    dataset: Record<string, string>,
    parentElement: object,
    left: number,
    hidden = false,
  ) {
    return {
      dataset,
      parentElement,
      isConnected: true,
      classList: { contains: () => false },
      hasAttribute: (name: string) => name === "hidden" && hidden,
      getAttribute: () => null,
      getClientRects: () => [{}],
      getBoundingClientRect: () => ({ left, top: 100, width: 80, height: 40 }),
      closest: (selector: string) =>
        selector === "[data-game-section]"
          ? section
          : selector === "[data-game-reveal-state]"
            ? parentElement === reveal
              ? reveal
              : null
            : selector.includes("[hidden]")
              ? hidden
                ? {}
                : null
              : null,
      textContent: "Existing link",
    };
  }
  const movingSurface = item({ gameSurface: "moving-top" }, reveal, 32);
  const movingTarget = item({ gameTarget: "moving-action" }, reveal, 32);
  const hiddenTarget = item({ gameTarget: "hidden-action" }, section, 128, true);
  const root = {
    querySelectorAll: (selector: string) =>
      selector === "[data-game-section]"
        ? [section]
        : [movingSurface, movingTarget, hiddenTarget],
  } as unknown as HTMLElement;
  Object.assign(globalThis, {
    window: { scrollX: 0, scrollY: 0, innerHeight: 900 },
    document: { querySelector: () => null },
    getComputedStyle: () => ({
      display: "block",
      visibility: "visible",
      transform: "none",
    }),
  });
  try {
    const snapshot = readGeometry(root);
    assert.equal(snapshot.plannedSurfaces.length, 1);
    assert.equal(snapshot.surfaces.length, 0);
    assert.equal(snapshot.revealsSettled, false);
    assert.deepEqual(
      snapshot.targets.map((target) => target.enabled),
      [false, false],
    );
  } finally {
    Object.assign(globalThis, previous);
  }
});

test("reveal signals notify geometry only during an active game", () => {
  const previousDocument = globalThis.document;
  const dataset: Record<string, string> = {};
  const events: string[] = [];
  Object.assign(globalThis, {
    document: {
      documentElement: { dataset },
      dispatchEvent: (event: Event) => events.push(event.type),
    },
  });
  try {
    const host = {
      dataset: {} as Record<string, string>,
      querySelector: () => ({}),
    } as unknown as HTMLElement;
    signalRevealGeometry(host, "moving");
    assert.deepEqual(events, []);
    dataset.gameMode = "active";
    signalRevealGeometry(host, "settled");
    assert.deepEqual(events, ["portfolio:geometry-change"]);
    assert.equal(host.dataset.gameRevealState, "settled");
    signalRevealGeometry(host, "moving");
    assert.equal(host.dataset.gameRevealState, "settled", "a once-only reveal must not become moving again on viewport re-entry");
    assert.deepEqual(events, ["portfolio:geometry-change"]);
  } finally {
    Object.assign(globalThis, { document: previousDocument });
  }
});

test("geometry invalidation batches callbacks and removes observers on exit", () => {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    ResizeObserver: globalThis.ResizeObserver,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  const listeners = new Map<string, Set<EventListener>>();
  const add = (name: string, callback: EventListener) => {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name)!.add(callback);
  };
  const remove = (name: string, callback: EventListener) =>
    listeners.get(name)?.delete(callback);
  const resizeCallbacks: Array<() => void> = [];
  let disconnected = false;
  let scheduled: FrameRequestCallback | null = null;
  let cancelled = false;
  let dirtyCount = 0;
  class FakeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      resizeCallbacks.push(() => callback([], this as unknown as ResizeObserver));
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  }
  const fakeTarget = { addEventListener: add, removeEventListener: remove };
  Object.assign(globalThis, {
    window: { ...fakeTarget, visualViewport: fakeTarget },
    document: { ...fakeTarget, querySelector: () => null, fonts: fakeTarget },
    ResizeObserver: FakeResizeObserver,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      scheduled = callback;
      return 7;
    },
    cancelAnimationFrame: () => {
      cancelled = true;
    },
  });
  try {
    const root = { querySelectorAll: () => [{}, {}] } as unknown as HTMLElement;
    const dispose = observeGeometry(root, () => dirtyCount++);
    assert.equal(resizeCallbacks.length, 1);
    resizeCallbacks[0]();
    resizeCallbacks[0]();
    assert.ok(scheduled);
    (scheduled as FrameRequestCallback)(0);
    assert.equal(dirtyCount, 1);
    resizeCallbacks[0]();
    dispose();
    assert.equal(disconnected, true);
    assert.equal(cancelled, true);
    assert.ok([...listeners.values()].every((callbacks) => callbacks.size === 0));
  } finally {
    Object.assign(globalThis, previous);
  }
});
