"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gameMode } from "@/content/game-mode";
import { observeGeometry, readGeometry } from "@/lib/game/geometry";
import { activateSelected, classifyActivation, destinationLanding, selectTarget, withDestinationCheckpoint } from "@/lib/game/interaction";
import { sectionIds } from "@/lib/game/model";
import type { Body, GeometrySnapshot, SessionEvent, SessionState, Tuning, World } from "@/lib/game/model";
import { spawn, step } from "@/lib/game/physics";
import { createScrollCoordinator, followDelta } from "@/lib/game/scroll";
import { createSession, ownsGameKey, restoreSupport, transition } from "@/lib/game/session";
import { buildWorld, outsidePlayablePath } from "@/lib/game/world";
import { GameView, type GameViewHandle } from "./game-view";

export type GameSessionProps = { onExit: () => void; trigger: HTMLButtonElement };

// The same measured tuning used by the route witnesses in world.test.ts.
const tuning: Tuning = {
  step: 1 / 120, speed: 240, gravity: 1100, jumpSpeed: 580,
  bodyWidth: 24, bodyHeight: 32, landingMargin: 2, reachX: 110, reachY: 150,
};
const emptyBody: Body = { x: 0, y: 0, width: 24, height: 32, vx: 0, vy: 0, groundedOn: null };
type Presentation = {
  state: SessionState; world: World | null; label: string | null;
  headerBottom: number; width: number; height: number; helpers: ReadonlySet<string>;
};
type Controller = { resume(): void; exit(): void; depart(): void; controlsChanged(): void };

export function GameSession({ onExit, trigger }: GameSessionProps): React.JSX.Element {
  const pathname = usePathname();
  const initialPath = useRef(pathname);
  const host = useRef<HTMLDivElement>(null);
  const body = useRef<Body>({ ...emptyBody });
  const view = useRef<GameViewHandle>(null);
  const controlsHeight = useRef(0);
  const controller = useRef<Controller | null>(null);
  const [presentation, setPresentation] = useState<Presentation>({
    state: { ...createSession(), phase: "repositioning" }, world: null, label: null,
    headerBottom: 0, width: 0, height: 0, helpers: new Set(),
  });
  const onControlsHeight = useCallback((height: number) => {
    if (Math.abs(controlsHeight.current - height) < 0.5) return;
    controlsHeight.current = height;
    controller.current?.controlsChanged();
  }, []);
  useEffect(() => {
    if (pathname !== initialPath.current) controller.current?.depart();
  }, [pathname]);

  useEffect(() => {
    const focusHost = host.current!;
    const root = document.getElementById("main-content") ?? document.body;
    const header = document.querySelector<HTMLElement>("[data-game-header]");
    let alive = true;
    let state = transition(transition(createSession(), { type: "OPEN" }).state, { type: "CONTINUE" }).state;
    let world: World | null = null;
    let geometry: GeometrySnapshot | null = null;
    let geometryKey = "";
    let version = 0;
    let frame = 0;
    let validationFrame = 0;
    let paintFrame = 0;
    let lastTime = 0;
    let accumulator = 0;
    let jumpPressed = false;
    let label: string | null = null;
    let selected: string | null = null;
    let painted: string | null = null;
    let presented: string | null = null;
    let headerBottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
    let width = document.documentElement.clientWidth;
    let height = Math.max(innerHeight, document.body.getBoundingClientRect().bottom + scrollY);
    let helpers: ReadonlySet<string> = new Set();
    let operation: AbortController | null = null;
    let destination: HTMLElement | null = null;
    const held = new Set<string>();
    const previousMarker = document.documentElement.dataset.gameMode;
    document.documentElement.dataset.gameMode = "active";

    function publish() {
      if (alive) setPresentation({ state, world, label, headerBottom, width, height, helpers });
    }
    function clearSelection() {
      selected = painted = presented = null;
      label = null;
      view.current?.clearSelection();
    }
    function send(event: SessionEvent) {
      const result = transition(state, event);
      state = result.state;
      if (result.effects.includes("clear-input")) {
        held.clear(); jumpPressed = false; accumulator = 0; lastTime = 0;
      }
      if (result.effects.includes("clear-velocity")) body.current = { ...body.current, vx: 0, vy: 0 };
      if (state.phase !== "playing") {
        cancelAnimationFrame(frame); frame = 0;
        clearSelection();
      }
      if (event.type === "PAUSE" || event.type === "EXIT" || (event.type === "VALIDATED" && !event.valid)) {
        operation?.abort(); operation = null;
      }
      publish();
    }
    function pause(reason: "browsing" | "focus" | "native-control" | "menu" | "layout") {
      if (!alive) return;
      send({ type: "PAUSE", reason });
      // Browsing is an interruption, not a persistent condition. It still latches Paused.
      if (reason === "browsing") send({ type: "CLEAR_REASON", reason });
    }
    function band() {
      const top = headerBottom + controlsHeight.current;
      const available = (window.visualViewport?.height ?? innerHeight) - top;
      return { top: top + available * 0.15, bottom: top + available * 0.85 };
    }
    function paintStill() {
      cancelAnimationFrame(paintFrame);
      paintFrame = requestAnimationFrame((now) => {
        paintFrame = 0;
        if (alive && world) view.current?.paint(now, null);
      });
    }
    function startLoop() {
      if (!alive || state.phase !== "playing" || frame) return;
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
    function tick(now: number) {
      frame = 0;
      if (!alive || state.phase !== "playing" || !world || !geometry) return;
      accumulator += lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
      lastTime = now;
      while (accumulator >= tuning.step) {
        const direction = (Number(held.has("ArrowRight")) - Number(held.has("ArrowLeft"))) as -1 | 0 | 1;
        const result = step(body.current, { direction, jumpPressed }, world.surfaces, tuning);
        jumpPressed = false;
        body.current = result.body;
        accumulator -= tuning.step;
        if (result.landedOn && world.surfaces.some((surface) => surface.id === result.landedOn && surface.checkpoint) && state.checkpoint !== result.landedOn)
          send({ type: "CHECKPOINT", id: result.landedOn });
        if (outsidePlayablePath(body.current, world)) {
          const checkpoint = world.surfaces.find((surface) => surface.id === state.checkpoint);
          if (!checkpoint) { send({ type: "VALIDATED", valid: false }); return; }
          send({ type: "REPOSITION", owner: "recovery" });
          body.current = spawn(checkpoint, tuning);
          paintStill();
          void reposition();
          return;
        }
      }
      const next = selectTarget(body.current, geometry.targets, tuning);
      if (next !== selected) {
        selected = next; painted = presented = null;
        label = geometry.targets.find((target) => target.id === next)?.label ?? null;
        view.current?.clearSelection();
        publish();
      }
      const target = selected ? geometry.elements.get(selected) ?? null : null;
      const visible = view.current?.paint(now, target);
      // A selection must survive a browser paint before Enter can use it.
      presented = visible && painted === selected ? selected : null;
      painted = visible ? selected : null;
      scroll.follow(followDelta(body.current, scrollY, band()));
      if (state.phase === "playing") frame = requestAnimationFrame(tick);
    }
    async function reposition() {
      if (!world || state.phase !== "repositioning" || !state.reposition || state.reposition === "follow") return;
      operation?.abort();
      const abort = new AbortController();
      operation = abort;
      const token = state.operation;
      const targetY = scrollY + followDelta(body.current, scrollY, band());
      const settled = await scroll.reposition(state.reposition, targetY, abort.signal);
      if (!alive || abort.signal.aborted || token !== state.operation) return;
      operation = null;
      if (!settled) { pause("browsing"); return; }
      send({ type: "SETTLED", operation: token });
      startLoop();
    }
    function snapshotKey(snapshot: GeometrySnapshot) {
      // Header position changes normally when the ticker scrolls offscreen; its
      // height is observed separately. Element references never enter the key.
      return JSON.stringify({ ...snapshot, elements: undefined, headerBottom: undefined,
        headerHeight: header?.getBoundingClientRect().height ?? 0,
        viewport: [innerWidth, window.visualViewport?.height ?? innerHeight, controlsHeight.current] });
    }
    function validate(force = false) {
      if (!alive || controlsHeight.current === 0) return false;
      const next = readGeometry(root);
      const key = snapshotKey(next);
      if (!force && key === geometryKey) return state.layoutValid;
      const oldWorld = world;
      if (oldWorld && !force) pause("layout");
      headerBottom = Math.max(0, next.headerBottom);
      const result = buildWorld(next, tuning, {
        width: innerWidth,
        usableHeight: (window.visualViewport?.height ?? innerHeight) - headerBottom - controlsHeight.current,
      }, ++version);
      geometryKey = key;
      geometry = next;
      if (!result.ok) { send({ type: "VALIDATED", valid: false }); return false; }
      world = result.world;
      const checkpoint = state.checkpoint ?? world.checkpoints.hero;
      const landing = world.surfaces.find((surface) => surface.id === checkpoint);
      if (!landing) { send({ type: "VALIDATED", valid: false }); return false; }
      if (!landing.checkpoint) world = withDestinationCheckpoint(world, landing);
      if (!oldWorld) body.current = spawn(landing, tuning);
      else if (key !== previousWorldKey) body.current = restoreSupport(body.current, oldWorld.surfaces, world.surfaces, world.obstacles) ?? spawn(landing, tuning);
      previousWorldKey = key;
      width = document.documentElement.clientWidth;
      // Body's in-flow border box excludes the absolute game portal.
      height = Math.max(innerHeight, document.body.getBoundingClientRect().bottom + scrollY);
      helpers = new Set(world.surfaces.filter((surface) => !next.plannedSurfaces.some((base) => base.id === surface.id)).map((surface) => surface.id));
      send({ type: "CHECKPOINT", id: checkpoint });
      send({ type: "VALIDATED", valid: true });
      paintStill();
      return true;
    }
    let previousWorldKey = "";
    function scheduleValidation() {
      if (validationFrame || !alive) return;
      validationFrame = requestAnimationFrame(() => {
        validationFrame = 0;
        // Reveal notifications belong to the navigation already in progress.
        if (state.phase === "repositioning" && state.reposition === "destination") return;
        const valid = validate();
        if (valid && state.phase === "repositioning") void reposition();
      });
    }
    function onKeyDown(event: KeyboardEvent) {
      if (state.phase !== "playing" || !ownsGameKey(event.defaultPrevented, event.composedPath(), focusHost)) return;
      if (!["ArrowLeft", "ArrowRight", "Space", "Enter"].includes(event.code)) return;
      event.preventDefault();
      if (event.repeat || held.has(event.code)) return;
      held.add(event.code);
      if (event.code === "Space") jumpPressed = true;
      if (event.code !== "Enter" || !presented || !geometry) return;
      const id = presented;
      const fresh = readGeometry(root);
      if (snapshotKey(fresh) !== geometryKey) { pause("layout"); scheduleValidation(); return; }
      activateSelected(id, id, body.current, fresh, tuning, (element) => {
        const activation = classifyActivation(element, new URL(location.href));
        if (activation.kind === "destination") void navigateDestination(activation.url);
      });
    }
    async function navigateDestination(url: URL) {
      send({ type: "REPOSITION", owner: "destination" });
      operation?.abort();
      const abort = new AbortController();
      operation = abort;
      const token = state.operation;
      try { destination = document.getElementById(decodeURIComponent(url.hash.slice(1))); }
      catch { destination = null; }
      const target = destination;
      // The observer acquires ownership synchronously, before the real click.
      const settled = await scroll.observeNavigation(abort.signal, () => {
        if (!target?.isConnected || location.pathname !== url.pathname || location.search !== url.search || location.hash !== url.hash) return false;
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const expected = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight,
          target.getBoundingClientRect().top + scrollY - margin - padding));
        return Math.abs(scrollY - expected) < 3;
      });
      if (!alive || abort.signal.aborted || token !== state.operation) return;
      destination = null;
      operation = null;
      if (!settled) { pause("browsing"); return; }
      const sectionName = target?.closest<HTMLElement>("[data-game-section]")?.dataset.gameSection;
      const section = sectionIds.find((id) => id === sectionName);
      if (!section || !validate(true) || !world || !geometry) {
        controller.current?.exit(); return;
      }
      // buildWorld already validates helper connections and clearance. A fallback
      // may only promote a validated landing inside this destination section.
      const landing = destinationLanding(world, geometry, section, tuning);
      if (!landing) { controller.current?.exit(); return; }
      if (!landing.checkpoint) {
        world = withDestinationCheckpoint(world, landing);
      }
      body.current = spawn(landing, tuning);
      send({ type: "CHECKPOINT", id: landing.id });
      focusHost.focus({ preventScroll: true });
      paintStill();
      void reposition();
    }
    function onKeyUp(event: KeyboardEvent) { held.delete(event.code); }
    function onFocusIn(event: FocusEvent) {
      const path = event.composedPath();
      if (state.phase === "repositioning" && state.reposition === "destination" && event.target === destination) return;
      if (path.includes(focusHost)) {
        send({ type: "CLEAR_REASON", reason: "native-control" });
        return;
      }
      pause("native-control");
    }
    function onFocus() {
      if (document.hidden || !document.hasFocus()) pause("focus");
      else send({ type: "CLEAR_REASON", reason: "focus" });
    }
    function onBlur() { pause("focus"); }
    function onMenu() {
      if (header?.dataset.gameMenuOpen === "true") pause("menu");
      else send({ type: "CLEAR_REASON", reason: "menu" });
    }
    function onScroll() {
      const bottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
      if (Math.abs(bottom - headerBottom) < 0.5) return;
      headerBottom = bottom;
      publish();
    }
    // Install bubble ownership before the coordinator's browsing-key listener.
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    const scroll = createScrollCoordinator(() => pause("browsing"));
    document.addEventListener("focusin", onFocusIn);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("scroll", onScroll);
    const onResize = () => pause("layout");
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    const stopGeometry = observeGeometry(root, scheduleValidation);
    const menuObserver = new MutationObserver(onMenu);
    if (header) menuObserver.observe(header, { attributes: true, attributeFilter: ["data-game-menu-open"] });

    function dispose() {
      if (!alive) return;
      alive = false;
      operation?.abort();
      cancelAnimationFrame(frame); cancelAnimationFrame(validationFrame); cancelAnimationFrame(paintFrame);
      stopGeometry(); menuObserver.disconnect(); scroll.dispose();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      clearSelection(); held.clear(); jumpPressed = false;
      body.current = { ...emptyBody };
      if (previousMarker === undefined) delete document.documentElement.dataset.gameMode;
      else document.documentElement.dataset.gameMode = previousMarker;
      controller.current = null;
    }
    controller.current = {
      depart() { dispose(); onExit(); },
      controlsChanged() { scheduleValidation(); },
      resume() {
        if (!alive || state.phase !== "paused" || document.hidden || !document.hasFocus() || header?.dataset.gameMenuOpen === "true") return;
        focusHost.focus({ preventScroll: true });
        send({ type: "CLEAR_REASON", reason: "native-control" });
        send({ type: "CLEAR_REASON", reason: "browsing" });
        send({ type: "CLEAR_REASON", reason: "focus" });
        if (!validate(true)) return;
        send({ type: "RESUME" });
        void reposition();
      },
      exit() {
        send({ type: "EXIT" });
        dispose();
        onExit();
        const fallback = trigger.isConnected ? trigger : document.getElementById("main-content");
        fallback?.focus({ preventScroll: true });
      },
    };
    // The import may finish after the user moved focus to an ordinary control.
    if (document.activeElement === document.body || document.activeElement === trigger) focusHost.focus({ preventScroll: true });
    else if (document.activeElement !== focusHost) pause("native-control");
    onFocus(); onMenu();
    publish(); scheduleValidation();
    return dispose;
  }, [onExit, trigger]);

  const { state } = presentation;
  const blocker = state.reasons.find((reason) => reason === "layout" || reason === "menu" || reason === "focus");
  return <>
    <div ref={host} tabIndex={-1} className="sr-only" aria-label={gameMode.entry} />
    <GameView bodyRef={body} viewRef={view} world={presentation.world}
      activeCheckpoint={state.checkpoint} phase={state.phase}
      canResume={state.layoutValid && !blocker} selectedLabel={presentation.label}
      pauseMessage={blocker ? gameMode.pauseReasons[blocker] : gameMode.paused}
      headerBottom={presentation.headerBottom} documentWidth={presentation.width}
      documentHeight={presentation.height} helperSurfaceIds={presentation.helpers}
      onControlsHeight={onControlsHeight}
      onResume={() => controller.current?.resume()} onExit={() => controller.current?.exit()} />
  </>;
}
