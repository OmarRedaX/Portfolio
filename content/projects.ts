import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "quick-bite",
    name: "Quick Bite",
    tagline: "Food Ordering & Delivery Platform",
    period: "2025 – 2026",
    stack: [
      "Node.js",
      "TypeScript",
      "Go",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "RabbitMQ",
      "Socket.IO",
    ],
    description:
      "An independently designed food ordering and delivery platform built as a 3-service, " +
      "event-driven microservices architecture: a Core service (identity, catalog, " +
      "restaurant-level RBAC), an Order service (orders, payments, delivery), and a " +
      "Go-based Analytics service — each owning its own database and communicating through " +
      "internal HTTP APIs and asynchronous RabbitMQ events. Capacity-planned for roughly " +
      "54M requests a day (~625 RPS sustained).",
    highlights: [
      "Sharded the Order service's PostgreSQL by region behind a per-request connection router",
      "Redis read-through caching to remove repeated synchronous cross-service lookups",
      "Redis pub/sub adapter so the Socket.IO layer fans out across worker processes",
      "Transactional outbox publishing to RabbitMQ topic exchanges, with idempotency keys " +
        "and dead-letter-queue-backed consumers for exactly-once effects",
      "SELECT FOR UPDATE on balance and payout settlement so retries never double-pay",
      "Centralized JWT authentication with restaurant-level RBAC",
      "Real-time delivery tracking via Socket.IO with Redis geospatial agent matching",
      "Signed payment webhooks",
      "Composite and partial indexes justified against query plans",
    ],
    status:
      "In active development — containerization and end-to-end test coverage are being built out.",
    links: {
      core: "https://github.com/OmarRedaX/Quick-bite-Core-service",
      order: "https://github.com/OmarRedaX/Quick-bite-Order-service",
      analytics: "https://github.com/OmarRedaX/Quick-Bite-analytics-service",
      overview: "https://github.com/OmarRedaX/Quick-Bite",
      caseStudy: "/work/quick-bite",
    },
    featured: true,
    focus: "fullstack",
  },
  {
    slug: "social-media",
    name: "Social-Media",
    tagline: "Social Platform API",
    period: "2024",
    stack: ["Node.js", "GraphQL", "Socket.IO", "MongoDB"],
    description:
      "A social platform API exposing both REST and GraphQL, adopting GraphQL specifically " +
      "to eliminate over-fetching on high-traffic feed endpoints. Includes real-time " +
      "notifications over Socket.IO, JWT authentication, and role-based access control " +
      "across a modular service layer.",
    links: {
      repo: "https://github.com/OmarRedaX/Social-media",
    },
    featured: false,
    focus: "backend",
  },
  {
    slug: "fresh-cart",
    name: "Fresh-Cart",
    tagline: "E-Commerce SPA",
    period: "2024",
    stack: ["React.js", "Tailwind CSS", "REST API", "Vercel"],
    description:
      "A responsive e-commerce single-page app with JWT authentication, protected routes, " +
      "and client-side cart state with optimistic UI updates on add/remove. Integrated a " +
      "REST backend behind centralized error and loading states, with route-level code " +
      "splitting and lazy loading to cut initial bundle size and load time.",
    links: {
      repo: "https://github.com/OmarRedaX/e-commerce",
    },
    featured: false,
    focus: "frontend",
  },
];
