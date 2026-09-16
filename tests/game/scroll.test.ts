import test from "node:test";
import assert from "node:assert/strict";
import { createScrollCoordinator, followDelta } from "../../lib/game/scroll";
import type { Body } from "../../lib/game/model";

type Listener = (event: Event) => void;

class FakeEvents {
  private readonly listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, event: Record<string, unknown> = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ type, ...event } as Event);
    }
  }
}

class FakeBrowser extends FakeEvents {
  scrollY = 0;
  innerHeight = 800;
  onscrollend: null = null;
  location = { hash: "" };
  target: Element | null = null;
  readonly scrollByCalls: number[] = [];
  readonly scrollToCalls: number[] = [];
  private readonly frames = new Map<number, FrameRequestCallback>();
  private readonly timers = new Map<number, () => void>();
  private nextHandle = 1;
  readonly document = Object.assign(new FakeEvents(), {
    documentElement: { scrollHeight: 2_000, clientHeight: 800 },
    body: { scrollHeight: 2_000 },
    querySelector: () => this.target,
  });

  scrollBy(_left: number, top: number) {
    this.scrollByCalls.push(top);
    this.scrollY = Math.max(0, Math.min(1_200, this.scrollY + top));
    this.emit("scroll");
  }

  scrollTo(_left: number, top: number) {
    this.scrollToCalls.push(top);
  }

  requestAnimationFrame(callback: FrameRequestCallback) {
    const handle = this.nextHandle++;
    this.frames.set(handle, callback);
    return handle;
  }

  cancelAnimationFrame(handle: number) {
    this.frames.delete(handle);
  }

  setTimeout(callback: () => void) {
    const handle = this.nextHandle++;
    this.timers.set(handle, callback);
    return handle;
  }

  clearTimeout(handle: number) {
    this.timers.delete(handle);
  }

  frame() {
    const callbacks = [...this.frames.values()];
    this.frames.clear();
    callbacks.forEach((callback) => callback(0));
  }

  fireTimers() {
    const callbacks = [...this.timers.values()];
    this.timers.clear();
    callbacks.forEach((callback) => callback());
  }

  setScrollY(scrollY: number) {
    this.scrollY = scrollY;
    this.emit("scroll");
  }
}

function coordinator(browser: FakeBrowser, onManual = () => {}) {
  return createScrollCoordinator(onManual, {
    window: browser,
    document: browser.document,
    requestAnimationFrame: browser.requestAnimationFrame.bind(browser),
    cancelAnimationFrame: browser.cancelAnimationFrame.bind(browser),
    setTimeout: browser.setTimeout.bind(browser),
    clearTimeout: browser.clearTimeout.bind(browser),
  });
}

const body: Body = {
  x: 0,
  y: 500,
  width: 24,
  height: 32,
  vx: 0,
  vy: 0,
  groundedOn: null,
};

test("followDelta leaves an avatar inside the viewing band in place", () => {
  assert.equal(followDelta(body, 400, { top: 80, bottom: 180 }), 0);
});

test("followDelta returns the smallest correction above or below the viewing band", () => {
  assert.equal(followDelta({ ...body, y: 450 }, 400, { top: 80, bottom: 180 }), -30);
  assert.equal(followDelta({ ...body, y: 560 }, 400, { top: 80, bottom: 180 }), 12);
});

test("follow clamps a bottom-edge correction and uses an immediate scroll adjustment", () => {
  const browser = new FakeBrowser();
  browser.scrollY = 1_180;
  const scroll = coordinator(browser);

  scroll.follow(80);

  assert.deepEqual(browser.scrollByCalls, [20]);
});

test("reposition waits for delayed owned scrolling to settle after scrollend", async () => {
  const browser = new FakeBrowser();
  const scroll = coordinator(browser);
  const result = scroll.reposition("spawn", 500, new AbortController().signal);

  assert.deepEqual(browser.scrollToCalls, [500]);
  browser.setScrollY(500);
  browser.emit("scrollend");
  browser.frame();
  browser.frame();

  assert.equal(await result, true);
});

test("manual wheel input cancels an owned reposition before it can settle", async () => {
  const browser = new FakeBrowser();
  let manualPauses = 0;
  const scroll = coordinator(browser, () => manualPauses++);
  const result = scroll.reposition("resume", 500, new AbortController().signal);

  browser.emit("wheel");
  browser.setScrollY(500);
  browser.emit("scrollend");
  browser.frame();
  browser.frame();

  assert.equal(manualPauses, 1);
  assert.equal(await result, false);
});

test("wheel, scrollbar movement, and PageDown pause ordinary browsing", () => {
  const browser = new FakeBrowser();
  let manualPauses = 0;
  coordinator(browser, () => manualPauses++);

  browser.emit("wheel");
  browser.setScrollY(120);
  browser.frame();
  browser.document.emit("keydown", { key: "PageDown", defaultPrevented: false });

  assert.equal(manualPauses, 1);
});

test("only trusted native-control clicks count as manual browsing", () => {
  const browser = new FakeBrowser();
  let manualPauses = 0;
  coordinator(browser, () => manualPauses++);

  browser.document.emit("click", { isTrusted: false });
  browser.document.emit("click", { isTrusted: true });

  assert.equal(manualPauses, 1);
});

test("dispose resolves pending work as failed and ignores stale scroll callbacks", async () => {
  const browser = new FakeBrowser();
  let manualPauses = 0;
  const scroll = coordinator(browser, () => manualPauses++);
  const result = scroll.reposition("recovery", 500, new AbortController().signal);

  scroll.dispose();
  browser.setScrollY(500);
  browser.emit("scrollend");
  browser.frame();
  browser.frame();

  assert.equal(await Promise.race([result, Promise.resolve("pending")]), false);
  assert.equal(manualPauses, 0);
});

test("navigation observes an already-current hash without issuing a competing scroll", async () => {
  const browser = new FakeBrowser();
  browser.location.hash = "#about";
  browser.target = {} as Element;
  const scroll = coordinator(browser);
  const result = scroll.observeNavigation(new AbortController().signal);

  browser.frame();
  browser.frame();
  browser.frame();

  assert.deepEqual(browser.scrollToCalls, []);
  assert.equal(await result, true);
});

test("reposition falls back to stable frames when scrollend is unavailable", async () => {
  const browser = new FakeBrowser();
  delete (browser as Partial<FakeBrowser>).onscrollend;
  const scroll = coordinator(browser);
  const result = scroll.reposition("recovery", 500, new AbortController().signal);

  browser.setScrollY(500);
  browser.frame();
  browser.frame();

  assert.equal(await result, true);
});

test("an aborted reposition reports failure instead of settling later", async () => {
  const browser = new FakeBrowser();
  const controller = new AbortController();
  const scroll = coordinator(browser);
  const result = scroll.reposition("resume", 500, controller.signal);

  controller.abort();
  browser.setScrollY(500);
  browser.emit("scrollend");
  browser.frame();
  browser.frame();

  assert.equal(await result, false);
});

test("a settlement timeout reports failure rather than assuming the requested offset arrived", async () => {
  const browser = new FakeBrowser();
  const scroll = coordinator(browser);
  const result = scroll.reposition("spawn", 500, new AbortController().signal);

  browser.fireTimers();

  assert.equal(await result, false);
});
