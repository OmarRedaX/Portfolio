import type { TechStackCategory } from "./types";

// Marketing-facing grouping (5 categories) for the homepage Tech Stack section.
// Site structure calls out "System Design & Architecture" as its own group deliberately —
// see implementation-plan.md §3. The CV's original 7-category grouping is preserved as-is
// in resume.ts, since the resume page must stay content-consistent with the CV.
export const techStack: TechStackCategory[] = [
  {
    name: "Frontend",
    items: [
      "TypeScript",
      "JavaScript (ES6+)",
      "React.js",
      "Next.js",
      "Redux",
      "Zustand",
      "TanStack Query",
      "Tailwind CSS",
    ],
  },
  {
    name: "Backend",
    items: [
      "TypeScript",
      "JavaScript (ES6+)",
      "Go",
      "Node.js",
      "Express.js",
      "NestJS",
      "Go (chi)",
      "REST APIs",
      "GraphQL",
      "Socket.IO",
      "JWT / OAuth 2.0",
      "RBAC",
    ],
  },
  {
    name: "Databases & Data",
    items: [
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Redis",
      "SQL",
      "Knex / Mongoose",
      "Schema Design",
      "Sharding",
      "Indexing & Query Tuning",
      "Transactions & Concurrency Control",
    ],
  },
  {
    name: "System Design & Architecture",
    items: [
      "Scalability (Horizontal & Vertical)",
      "High Availability",
      "Capacity Planning",
      "Load Balancing",
      "Partitioning & Sharding",
      "Replication",
      "Caching",
      "Rate Limiting",
      "CAP & Consistency Models",
      "Microservices",
      "Event-Driven (RabbitMQ, Pub/Sub, DLQ)",
      "Transactional Outbox",
      "Idempotency",
      "Clean Architecture",
      "DDD",
      "SOLID",
    ],
  },
  {
    name: "Cloud & Tooling",
    items: [
      "AWS (S3, EC2, RDS, ECS, ECR)",
      "Docker",
      "CI/CD (GitHub Actions)",
      "Nginx",
      "CDN",
      "Jest & Supertest",
      "Git",
    ],
  },
];
