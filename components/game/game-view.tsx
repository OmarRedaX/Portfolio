"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { gameMode } from "@/content/game-mode";
import { sectionIds, type Body, type Phase, type World } from "@/lib/game/model";
import { AvatarFigure } from "./avatar-figure";
import styles from "./game-mode.module.css";

const subscribeToMount = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export type GameViewHandle = {
  /** Call from the session's existing frame loop, after selection validation.
   * A returned target still needs the interaction adapter's next-frame acknowledgement. */
  paint: (now: number, target: HTMLElement | null) => HTMLElement | null;
  clearSelection: () => void;
};

export type GameViewProps = {
  bodyRef: RefObject<Body>;
  viewRef?: Ref<GameViewHandle>;
  world: World | null;
  activeCheckpoint: string | null;
  phase: Phase;
  canResume: boolean;
  selectedLabel: string | null;
  pauseMessage?: string;
  /** Supplied by session geometry; never measured in the animation loop. */
  headerBottom: number;
  documentWidth: number;
  documentHeight: number;
  /** Explicit approved helpers, excluding existing portfolio surfaces. */
  helperSurfaceIds: ReadonlySet<string>;
  onControlsHeight?: (height: number) => void;
  onResume: () => void;
  onExit: () => void;
};

export function GameView({
  bodyRef,
  viewRef,
  world,
  activeCheckpoint,
  phase,
  canResume,
  selectedLabel,
  pauseMessage,
  headerBottom,
  documentWidth,
  documentHeight,
  helperSurfaceIds,
  onControlsHeight,
  onResume,
  onExit,
}: GameViewProps) {
  const avatar = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const selected = useRef<HTMLElement | null>(null);
  const previousGround = useRef<string | null>(null);
  const landingUntil = useRef(0);
  const statusId = useId();
  const mounted = useSyncExternalStore(subscribeToMount, clientSnapshot, serverSnapshot);
  const initialized = phase !== "off" && phase !== "confirming";

  function clearSelection() {
    selected.current?.classList.remove(styles.selected);
    selected.current = null;
    if (hint.current) hint.current.style.visibility = "hidden";
  }

  useImperativeHandle(viewRef, () => ({
    clearSelection,
    paint(now, target) {
      const body = bodyRef.current;
      const node = avatar.current;
      if (!node || !initialized) {
        clearSelection();
        return null;
      }
      node.hidden = false;
      node.style.transform = `translate(${body.x}px, ${body.y}px)`;
      node.style.width = `${body.width}px`;
      node.style.height = `${body.height}px`;
      if (body.groundedOn && !previousGround.current) landingUntil.current = now + 100;
      previousGround.current = body.groundedOn;
      node.dataset.pose = !body.groundedOn
        ? body.vy < 0
          ? "rise"
          : "fall"
        : now < landingUntil.current
          ? "land"
          : body.vx === 0
            ? "idle"
            : Math.floor(now / 120) % 2
              ? "run-a"
              : "run-b";
      if (body.vx !== 0) node.dataset.facing = body.vx < 0 ? "left" : "right";
      const eligible =
        phase === "playing" &&
        body.groundedOn &&
        selectedLabel &&
        target?.isConnected &&
        target.getClientRects().length > 0 &&
        !target.closest('[inert], [hidden], [aria-disabled="true"], :disabled') &&
        getComputedStyle(target).visibility === "visible";
      if (!eligible) {
        clearSelection();
        return null;
      }
      if (selected.current !== target) {
        clearSelection();
        target.classList.add(styles.selected);
        selected.current = target;
      }
      if (hint.current) hint.current.style.visibility = "visible";
      return target;
    },
  }));

  useEffect(() => {
    clearSelection();
    return clearSelection;
  }, [phase, selectedLabel, world?.version]);

  useEffect(() => {
    const node = hud.current;
    if (!node || !onControlsHeight) return;
    const report = () => onControlsHeight(node.getBoundingClientRect().height);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [initialized, mounted, onControlsHeight]);

  if (!initialized || !mounted) return null;
  const checkpointSection = sectionIds.find(
    (id) => world?.checkpoints[id] === activeCheckpoint,
  );
  const status =
    phase === "paused"
      ? (pauseMessage ?? (canResume ? gameMode.paused : gameMode.unsafeLayout))
      : phase === "repositioning"
        ? gameMode.repositioning
        : gameMode.playing;

  return createPortal(
    <>
      {world && <div
        className={styles.world}
        aria-hidden="true"
        style={{ width: documentWidth, height: documentHeight }}
      >
        {world.surfaces
          .filter((surface) => helperSurfaceIds.has(surface.id))
          .map((surface) => (
            <div
              key={surface.id}
              className={styles.platform}
              style={{ left: surface.x, top: surface.y, width: surface.width }}
            />
          ))}
        {sectionIds.map((section) => {
          const surface = world.surfaces.find(
            (item) => item.id === world.checkpoints[section],
          );
          if (!surface) return null;
          const active = surface.id === activeCheckpoint;
          return (
            <svg
              key={section}
              className={styles.flag}
              data-active={active}
              style={{
                left: Math.max(0, Math.min(documentWidth - 18, surface.x)),
                top: surface.y - 24,
              }}
              width="18"
              height="24"
              viewBox="0 0 18 24"
            >
              <path d="M2 24V1" className={styles.pole} />
              <path
                d={active ? "M3 2H17V14H3Z" : "M3 2H17L12 8L17 14H3Z"}
                fill="currentColor"
              />
              {active && <path d="m6 8 3 3 5-6" className={styles.check} />}
            </svg>
          );
        })}
        <div ref={avatar} className={styles.avatar} hidden>
          <AvatarFigure />
        </div>
      </div>}
      <section
        ref={hud}
        data-game-controls
        className={styles.hud}
        aria-label={gameMode.entry}
        style={{
          top: Math.max(0, headerBottom),
          maxHeight: `calc(100dvh - ${Math.max(0, headerBottom)}px)`,
        }}
      >
        <div className={styles.controlRow}>
          <p className={styles.instructions}>{gameMode.controls.join(" · ")}</p>
          {phase === "paused" && (
            <button
              className="btn btn-secondary"
              type="button"
              disabled={!canResume}
              aria-describedby={statusId}
              onClick={onResume}
            >
              {gameMode.resume}
            </button>
          )}
          <button className="btn btn-secondary" type="button" onClick={onExit}>
            {gameMode.exitGame}
          </button>
        </div>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.status}
        >
          {status}
          {checkpointSection
            ? ` ${gameMode.checkpointAnnouncement(checkpointSection)}`
            : ""}
        </p>
        <span ref={hint} style={{ visibility: "hidden" }} className={styles.hint}>
          {selectedLabel ? gameMode.targetHint(selectedLabel) : ""}
        </span>
      </section>
    </>,
    document.body,
  );
}
