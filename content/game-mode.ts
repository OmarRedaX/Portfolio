import type { PauseReason, SectionId } from "@/lib/game/model";

const sectionLabels: Record<SectionId, string> = {
  hero: "Hero",
  about: "About",
  "tech-stack": "Tech Stack",
  projects: "Projects",
  experience: "Experience",
  contact: "Contact",
};

export const gameMode = {
  entry: "Game Mode",
  title: "Start Game Mode?",
  description:
    "Game Mode includes character movement, jumping and falling, automatic page scrolling, and visual animations. Would you like to continue?",
  continue: "Continue",
  exit: "Exit",
  exitGame: "Exit Game Mode",
  resume: "Resume Game",
  largerWindow: "Larger window required",
  keyboardRequired: "Keyboard required",
  loading: "Preparing Game Mode…",
  preparation: "Game Mode is not ready to play yet. You can continue browsing or exit.",
  failed: "Game Mode could not load. You can continue browsing and try again.",
  unsafeLayout: "Game Mode needs a safe layout before play can start.",
  controls: ["← → Move", "Space Jump", "Enter Interact"],
  playing: "Game Mode started.",
  paused: "Game Mode paused.",
  repositioning: "Returning to a safe platform…",
  checkpointActive: "Active checkpoint",
  checkpointInactive: "Inactive checkpoint",
  checkpointAnnouncement: (section: SectionId) =>
    `Active checkpoint: ${sectionLabels[section]}.`,
  pauseReasons: {
    browsing: "Paused while you browse.",
    focus: "Paused while the page is out of focus.",
    "native-control": "Paused while you use page controls.",
    menu: "Paused while the navigation menu is open.",
    layout: "Paused until a safe layout is available.",
  } satisfies Record<PauseReason, string>,
  targetHint: (label: string) => `Press Enter · ${label}`,
} as const;
