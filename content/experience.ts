import type { ExperienceEntry } from "./types";

// Ordered oldest → newest to reinforce the frontend → backend narrative spine
// (implementation-plan.md §3.6).
export const experience: ExperienceEntry[] = [
  {
    role: "Front-End Web Development Intern",
    company: "Route",
    location: "Cairo, Egypt",
    period: "03/2024 – 09/2024",
    bullets: [
      "Built 10+ React.js and Next.js applications in TypeScript, implementing JWT " +
        "authentication flows, protected routing, component-driven architecture, and " +
        "type-safe API integration.",
      "Cut bundle size via lazy loading and code splitting, and managed client state with " +
        "Redux and Zustand alongside TanStack Query for server-state caching.",
    ],
  },
  {
    role: "Back-End Web Development Intern",
    company: "Route",
    location: "Cairo, Egypt",
    period: "10/2024 – 04/2025",
    bullets: [
      "Designed and delivered RESTful APIs across 3 projects — JWT and OAuth 2.0 " +
        "authentication, rate limiting, transactional email, and PDF/QR generation — " +
        "serving 100+ users.",
      "Built real-time features with Socket.IO, automated recurring background jobs with " +
        "CRON, containerized services with Docker and Nginx, and maintained test coverage " +
        "with Jest and Supertest.",
    ],
  },
];
