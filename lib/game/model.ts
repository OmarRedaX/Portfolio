export const sectionIds = [
  "hero",
  "about",
  "tech-stack",
  "projects",
  "experience",
  "contact",
] as const;
export type SectionId = (typeof sectionIds)[number];
export type Rect = { x: number; y: number; width: number; height: number };
export type Surface = {
  id: string;
  section: SectionId;
  x: number;
  y: number;
  width: number;
  checkpoint: boolean;
};
export type Body = Rect & { vx: number; vy: number; groundedOn: string | null };
export type Input = { direction: -1 | 0 | 1; jumpPressed: boolean };
export type Tuning = {
  step: number;
  speed: number;
  gravity: number;
  jumpSpeed: number;
  bodyWidth: number;
  bodyHeight: number;
  landingMargin: number;
  reachX: number;
  reachY: number;
};
export type StepResult = { body: Body; landedOn: string | null };
export type TargetBox = {
  id: string;
  label: string;
  order: number;
  rect: Rect;
  enabled: boolean;
};
export type ActionRow = { id: string; section: SectionId; rect: Rect };
export type GeometrySnapshot = {
  surfaces: Surface[];
  plannedSurfaces: Surface[];
  targets: TargetBox[];
  elements: Map<string, HTMLElement>;
  sectionBounds: Record<SectionId, Rect>;
  sectionAnchors: Record<SectionId, Rect>;
  obstacles: Rect[];
  actionRows: ActionRow[];
  plannedActionRows: ActionRow[];
  headerBottom: number;
  revealsSettled: boolean;
};
export type Connection = { from: string; to: string; frames: Input[]; corridor: Rect[] };
export type World = {
  version: number;
  surfaces: Surface[];
  connections: Connection[];
  checkpoints: Record<SectionId, string>;
  obstacles: Rect[];
};
export type Validation =
  | { ok: true; world: World; minUsableHeight: number }
  | { ok: false; reason: "viewport" | "layout" };
export type PauseReason = "browsing" | "focus" | "native-control" | "menu" | "layout";
export type ScrollOwner = "follow" | "destination" | "resume" | "recovery" | "spawn";
export type Phase = "off" | "confirming" | "playing" | "paused" | "repositioning";
export type SessionState = {
  phase: Phase;
  reasons: PauseReason[];
  checkpoint: string | null;
  operation: number;
  layoutValid: boolean;
  reposition: ScrollOwner | null;
};
export type SessionEvent =
  | { type: "OPEN" }
  | { type: "CONTINUE" }
  | { type: "EXIT" }
  | { type: "PAUSE"; reason: PauseReason }
  | { type: "CLEAR_REASON"; reason: PauseReason }
  | { type: "VALIDATED"; valid: boolean }
  | { type: "RESUME" }
  | { type: "REPOSITION"; owner: ScrollOwner }
  | { type: "SETTLED"; operation: number }
  | { type: "CHECKPOINT"; id: string };
export type SessionEffect =
  "clear-input" | "clear-velocity" | "validate" | "reposition" | "dispose";
