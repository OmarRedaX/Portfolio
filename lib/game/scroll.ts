import type { Body, ScrollOwner } from "./model";

type Listener = (event: Event) => void;
type EventSource = {
  addEventListener(type: string, listener: Listener, options?: AddEventListenerOptions): void;
  removeEventListener(type: string, listener: Listener, options?: EventListenerOptions): void;
};

export type ScrollEnvironment = {
  window: EventSource & {
    scrollY: number;
    innerHeight: number;
    scrollBy(left: number, top: number): void;
    scrollTo(left: number, top: number): void;
    location?: { hash: string };
  };
  document: EventSource & {
    documentElement: { scrollHeight: number; clientHeight: number };
    body?: { scrollHeight: number };
    querySelector?(selectors: string): Element | null;
  };
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
  setTimeout(callback: () => void, ms: number): number;
  clearTimeout(handle: number): void;
};

export type ScrollCoordinator = {
  follow(delta: number): void;
  reposition(
    owner: Exclude<ScrollOwner, "follow">,
    destinationY: number,
    signal: AbortSignal,
  ): Promise<boolean>;
  observeNavigation(signal: AbortSignal, arrived?: () => boolean): Promise<boolean>;
  dispose(): void;
};

export function followDelta(
  body: Body,
  scrollY: number,
  band: { top: number; bottom: number },
): number {
  const avatarTop = body.y - scrollY;
  const avatarBottom = avatarTop + body.height;
  return avatarTop < band.top
    ? avatarTop - band.top
    : avatarBottom > band.bottom
      ? avatarBottom - band.bottom
      : 0;
}

export function createScrollCoordinator(
  onManual: () => void,
  environment: ScrollEnvironment = browserEnvironment(),
): ScrollCoordinator {
  let disposed = false;
  let expectedY: number | null = null;
  let owner: ScrollOwner | null = null;
  let ownerStartY = 0;
  let active: ActiveScroll | null = null;
  let follow: FollowOwnership | null = null;
  let unownedFrame = 0;
  let manualNotified = false;

  const onScroll = () => {
    const scrollY = environment.window.scrollY;
    if (owner === "follow" && follow) {
      if (Math.abs(scrollY - follow.expectedY) < 1) {
        cancelFollow();
        return;
      }
      if (isOwnedOffset(scrollY, follow.startY, follow.expectedY)) {
        follow.lastY = scrollY;
        follow.stableFrames = 0;
      }
      scheduleFollowCheck();
      return;
    }
    if (owner !== null && active && isOwnedOffset(scrollY, ownerStartY, expectedY)) {
      active.lastY = scrollY;
      active.stableFrames = 0;
      return;
    }
    if (active?.kind === "navigation") {
      active.lastY = scrollY;
      active.stableFrames = 0;
      return;
    }
    if (expectedY !== null && Math.abs(scrollY - expectedY) < 1) {
      expectedY = null;
      owner = null;
      return;
    }
    scheduleUnownedScrollCheck(scrollY);
  };
  const onScrollEnd = () => {
    if (active && active.targetY !== null && Math.abs(environment.window.scrollY - active.targetY) < 1) {
      active.sawScrollEnd = true;
    }
  };
  const onNavigationChange = () => {
    if (active?.kind === "navigation") active.stableFrames = 0;
  };
  const onManualInput = () => notifyManual();
  const fromControls = (event: Event) => event.composedPath?.().some((node) =>
    node && typeof node === "object" && "closest" in node &&
    (node as Element).closest("[data-game-controls]"),
  );
  const onPointer = (event: Event) => {
    if (!fromControls(event)) notifyManual();
  };
  const onKeyDown = (event: Event) => {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.defaultPrevented && browsingKeys.has(keyEvent.key)) notifyManual();
  };
  const onNativeControlClick = (event: Event) => {
    if (event.isTrusted && !fromControls(event)) notifyManual();
  };
  environment.window.addEventListener("scroll", onScroll);
  environment.window.addEventListener("scrollend", onScrollEnd);
  environment.window.addEventListener("wheel", onManualInput);
  environment.window.addEventListener("touchmove", onManualInput);
  environment.window.addEventListener("pointerdown", onPointer);
  environment.document.addEventListener("keydown", onKeyDown);
  environment.document.addEventListener("click", onNativeControlClick);
  environment.window.addEventListener("hashchange", onNavigationChange);
  environment.document.addEventListener("portfolio:geometry-change", onNavigationChange);

  return {
    follow(delta) {
      if (disposed || delta === 0) return;
      manualNotified = false;
      const currentY = environment.window.scrollY;
      const destinationY = clampScroll(environment, currentY + delta);
      const adjustment = destinationY - currentY;
      if (adjustment === 0) return;

      const ongoing = owner === "follow" ? follow : null;
      if (ongoing) {
        ongoing.expectedY = destinationY;
      } else {
        owner = "follow";
        ownerStartY = currentY;
      }
      expectedY = destinationY;
      environment.window.scrollBy(0, adjustment);
      if (owner === "follow") {
        follow ??= {
          startY: currentY,
          expectedY: destinationY,
          lastY: environment.window.scrollY,
          stableFrames: 0,
          frames: 0,
          animationFrame: null,
        };
        scheduleFollowCheck();
      }
    },
    reposition(nextOwner, destinationY, signal) {
      if (disposed || signal.aborted) return Promise.resolve(false);
      cancelActive(false);
      cancelFollow();
      manualNotified = false;

      const currentY = environment.window.scrollY;
      const targetY = clampScroll(environment, destinationY);
      owner = nextOwner;
      ownerStartY = currentY;
      expectedY = targetY;
      environment.window.scrollTo(0, targetY);
      return waitForSettlement(targetY, signal, "reposition");
    },
    observeNavigation(signal, arrived = () => true) {
      if (disposed || signal.aborted) return Promise.resolve(false);
      cancelActive(false);
      cancelFollow();
      manualNotified = false;
      owner = "destination";
      expectedY = null;
      return waitForSettlement(null, signal, "navigation", arrived);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelActive(false);
      cancelFollow();
      environment.window.removeEventListener("scroll", onScroll);
      environment.window.removeEventListener("scrollend", onScrollEnd);
      environment.window.removeEventListener("wheel", onManualInput);
      environment.window.removeEventListener("touchmove", onManualInput);
      environment.window.removeEventListener("pointerdown", onPointer);
      environment.document.removeEventListener("keydown", onKeyDown);
      environment.document.removeEventListener("click", onNativeControlClick);
      environment.window.removeEventListener("hashchange", onNavigationChange);
      environment.document.removeEventListener("portfolio:geometry-change", onNavigationChange);
      environment.cancelAnimationFrame(unownedFrame);
    },
  };

  function waitForSettlement(
    targetY: number | null,
    signal: AbortSignal,
    kind: "reposition" | "navigation",
    arrived: () => boolean = () => true,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const needsScrollEnd =
        kind === "reposition" &&
        targetY !== null &&
        targetY !== environment.window.scrollY &&
        "onscrollend" in environment.window;
      const operation: ActiveScroll = {
        resolve,
        targetY,
        kind,
        needsScrollEnd,
        sawScrollEnd: !needsScrollEnd,
        lastY: environment.window.scrollY,
        stableFrames: 0,
        animationFrame: 0,
        timeout: 0,
        abort: () => finish(operation, false),
        signal,
      };
      active = operation;
      signal.addEventListener("abort", operation.abort, { once: true });
      operation.timeout = environment.setTimeout(() => finish(operation, false), 1_500);

      const check = () => {
        if (active !== operation || disposed) return;
        const scrollY = environment.window.scrollY;
        operation.stableFrames =
          Math.abs(scrollY - operation.lastY) < 1 ? operation.stableFrames + 1 : 0;
        operation.lastY = scrollY;
        const reachedTarget = targetY === null || Math.abs(scrollY - targetY) < 1;
        if (
          reachedTarget &&
          arrived() &&
          navigationIsSettled(kind) &&
          operation.sawScrollEnd &&
          operation.stableFrames >= 2
        ) {
          finish(operation, true);
          return;
        }
        operation.animationFrame = environment.requestAnimationFrame(check);
      };
      operation.animationFrame = environment.requestAnimationFrame(check);
    });
  }

  function cancelActive(value: boolean) {
    if (active) finish(active, value);
  }

  function finish(operation: ActiveScroll, settled: boolean) {
    if (active !== operation) return;
    environment.cancelAnimationFrame(operation.animationFrame);
    environment.clearTimeout(operation.timeout);
    operation.signal?.removeEventListener("abort", operation.abort);
    active = null;
    expectedY = null;
    owner = null;
    operation.resolve(settled);
  }

  function notifyManual() {
    if (disposed) return;
    cancelActive(false);
    cancelFollow();
    expectedY = null;
    owner = null;
    if (manualNotified) return;
    manualNotified = true;
    onManual();
  }

  function scheduleUnownedScrollCheck(scrollY: number) {
    environment.cancelAnimationFrame(unownedFrame);
    unownedFrame = environment.requestAnimationFrame(() => {
      unownedFrame = 0;
      if (!disposed && expectedY === null && Math.abs(environment.window.scrollY - scrollY) < 1) {
        notifyManual();
      }
    });
  }

  function scheduleFollowCheck() {
    const ownership = follow;
    if (!ownership) return;
    if (ownership.animationFrame !== null) return;
    ownership.animationFrame = environment.requestAnimationFrame(() => {
      ownership.animationFrame = null;
      if (disposed || follow !== ownership || owner !== "follow") return;
      const scrollY = environment.window.scrollY;
      if (Math.abs(scrollY - ownership.expectedY) < 1) {
        cancelFollow();
        return;
      }
      ownership.stableFrames =
        Math.abs(scrollY - ownership.lastY) < 1 ? ownership.stableFrames + 1 : 0;
      ownership.lastY = scrollY;
      ownership.frames++;
      const validProgress = isOwnedOffset(scrollY, ownership.startY, ownership.expectedY);
      if ((!validProgress && ownership.stableFrames >= 1) || ownership.frames >= 8) {
        cancelFollow();
        notifyManual();
        return;
      }
      scheduleFollowCheck();
    });
  }

  function cancelFollow() {
    if (!follow) return;
    if (follow.animationFrame !== null) environment.cancelAnimationFrame(follow.animationFrame);
    follow = null;
    if (owner === "follow") {
      expectedY = null;
      owner = null;
    }
  }

  function navigationIsSettled(kind: ActiveScroll["kind"]): boolean {
    if (kind !== "navigation") return true;
    const hash = environment.window.location?.hash ?? "";
    if (!hash) return true;
    try {
      const target = environment.document.querySelector?.(hash);
      if (!target) return false;
      const reveal = target.closest<HTMLElement>("[data-game-reveal-state]");
      if (reveal?.dataset.gameRevealState !== undefined && reveal.dataset.gameRevealState !== "settled")
        return false;
      return !Array.from(target.querySelectorAll("[data-game-reveal-state]:not([data-game-reveal-state='settled'])"))
        .some((element) => {
          const rect = element.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < environment.window.innerHeight;
        });
    } catch {
      return false;
    }
  }
}

const browsingKeys = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

type ActiveScroll = {
  resolve: (settled: boolean) => void;
  targetY: number | null;
  kind: "reposition" | "navigation";
  needsScrollEnd: boolean;
  sawScrollEnd: boolean;
  lastY: number;
  stableFrames: number;
  animationFrame: number;
  timeout: number;
  abort: () => void;
  signal?: AbortSignal;
};

type FollowOwnership = {
  startY: number;
  expectedY: number;
  lastY: number;
  stableFrames: number;
  frames: number;
  animationFrame: number | null;
};

function isOwnedOffset(scrollY: number, startY: number, expectedY: number | null): boolean {
  if (expectedY === null) return false;
  return expectedY >= startY
    ? scrollY >= startY - 1 && scrollY <= expectedY + 1
    : scrollY <= startY + 1 && scrollY >= expectedY - 1;
}

function clampScroll(environment: ScrollEnvironment, destinationY: number): number {
  const documentHeight = Math.max(
    environment.document.documentElement.scrollHeight,
    environment.document.body?.scrollHeight ?? 0,
  );
  const maxScrollY = Math.max(0, documentHeight - environment.window.innerHeight);
  return Math.max(0, Math.min(maxScrollY, destinationY));
}

function browserEnvironment(): ScrollEnvironment {
  return {
    window,
    document,
    requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
    cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle),
    setTimeout: (callback, ms) => window.setTimeout(callback, ms),
    clearTimeout: (handle) => window.clearTimeout(handle),
  };
}
