import type { CourseBlueprint } from "../../../lib/game/courses";
import type { GeometrySnapshot, Rect, SectionId } from "../../../lib/game/model";

const box = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
});

// A synthetic 1440 px homepage (clientWidth 1425, content 184–1248) with round
// numbers. About's last keep-out ends at 1780 and the Tech Stack heading starts
// at 2036, a 256 px band; every other section follows the measured 1440 layout.
export function bandFixture(): GeometrySnapshot {
  const sectionBounds: Record<SectionId, Rect> = {
    hero: box(0, 124, 1425, 828),
    about: box(0, 952, 1425, 956),
    "tech-stack": box(0, 1908, 1425, 1300),
    projects: box(0, 3208, 1425, 1632),
    experience: box(0, 4840, 1425, 792),
    contact: box(0, 5632, 1425, 732),
  };
  const heroActions = box(184, 645, 1064, 68);
  const contactActions = box(184, 5856, 458, 130);
  const sectionAnchors: Record<SectionId, Rect> = {
    hero: heroActions,
    about: box(184, 1080, 1064, 72),
    "tech-stack": box(184, 2036, 1064, 72),
    projects: box(184, 3336, 1064, 72),
    experience: box(184, 4968, 1064, 72),
    contact: contactActions,
  };
  const experienceEntries = [box(210, 5080, 1038, 192), box(210, 5312, 1038, 192)];
  const contactForm = box(690, 5760, 558, 474);
  const actionRows = [
    { id: "hero-actions", section: "hero" as const, rect: heroActions },
    {
      id: "project-quick-bite-actions",
      section: "projects" as const,
      rect: box(224, 4140, 976, 58),
    },
    { id: "contact-actions", section: "contact" as const, rect: contactActions },
  ];
  return {
    surfaces: [],
    plannedSurfaces: [],
    targets: [],
    plannedTargets: [],
    elements: new Map(),
    sectionBounds,
    sectionAnchors,
    obstacles: [
      box(184, 360, 210, 18),
      box(184, 403, 896, 91),
      box(184, 517, 672, 29),
      box(184, 570, 672, 51),
      box(184, 1192, 768, 364),
      ...experienceEntries,
      contactForm,
    ],
    keepouts: [
      box(184, 1596, 1064, 184),
      box(184, 2148, 516, 222),
      box(732, 2148, 516, 222),
      box(184, 2394, 516, 222),
      box(184, 2640, 1064, 222),
      box(184, 2886, 516, 192),
      box(184, 3448, 1064, 792),
      box(184, 4272, 512, 438),
      box(736, 4272, 512, 438),
      ...experienceEntries,
      box(184, 5760, 458, 226),
      contactForm,
    ],
    actionRows,
    plannedActionRows: actionRows,
    headerBottom: 124,
    revealsSettled: true,
  };
}

// A challenge course in the About→Tech Stack band of bandFixture(): a drop from
// the lane entry, a low run with widening gaps, a rest ledge, and a catch floor
// that returns to the Tech Stack checkpoint. Jumps stay low in the band so the
// body clears the About content above by the course clearance on every frame.
export const bandCourse: CourseBlueprint = {
  id: "grid-run",
  section: "about",
  zone: "band",
  tier: "challenge",
  layout: "ledges",
  ledges: [
    { id: "d1", x: 0, y: { top: 104 }, width: 48 },
    { id: "u1", x: 96, y: { bottom: 48 }, width: 64 },
    { id: "u2", x: 272, y: { bottom: 48 }, width: 48 },
    { id: "rest", x: 464, y: { bottom: 48 }, width: 112 },
    { id: "catch", x: 48, y: { bottom: 0 }, width: 560, catch: true },
  ],
};
