import type { ResumeContent } from "./types";
import { hero } from "./hero";
import { about } from "./about";
import { contact } from "./contact";
import { projects } from "./projects";
import { experience } from "./experience";

// The resume page/PDF (Phase 7) must be content-consistent with the source CV, so this
// mirrors the CV's own 7-category skills grouping and its exact summary paragraph — distinct
// from tech-stack.ts's 5-category marketing grouping and about.ts's rewritten site narrative.
// Projects and experience are reused as-is from their single source of truth.
export const resume: ResumeContent = {
  name: hero.name,
  title: hero.title,
  contact,
  summary:
    "Full-Stack Engineer with a BSc in Computer Science, working across React.js/Next.js " +
    "front ends and Node.js, TypeScript, and Go back ends. Shipped 10+ React.js and Next.js " +
    "applications and delivered REST and GraphQL services across two engineering " +
    "internships, then independently designed and built a 3-service, event-driven " +
    "microservices platform on sharded PostgreSQL, RabbitMQ, and Redis.",
  skills: [
    { name: "Languages", items: ["TypeScript", "JavaScript (ES6+)", "Go", "SQL"] },
    {
      name: "Front-End",
      items: [
        "React.js",
        "Next.js",
        "Redux",
        "Zustand",
        "TanStack Query",
        "Tailwind CSS",
      ],
    },
    {
      name: "Back-End",
      items: [
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
      name: "Databases",
      items: [
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Redis",
        "Knex / Mongoose",
        "Schema Design",
        "Sharding",
        "Indexing & Query Tuning",
        "Transactions & Concurrency Control",
      ],
    },
    {
      name: "System Design",
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
      ],
    },
    {
      name: "Architecture",
      items: [
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
  ],
  projects,
  experience,
  education: about.education,
  languages: about.languages,
  pdfUrl: "https://drive.google.com/file/d/11b437GAD6xQJnASAAgkOZGYHGiT8Ck94/view?usp=sharing",
};
