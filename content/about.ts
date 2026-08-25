import type { AboutContent } from "./types";

export const about: AboutContent = {
  narrative: [
    "I started as a front-end engineer, shipping 10+ React and Next.js applications during " +
      "a front-end internship at Route — building type-safe UIs, JWT-authenticated flows, and " +
      "component-driven architecture, with an eye on bundle size and client-state performance.",
    "That work pulled me toward the systems underneath it. In a follow-on back-end internship " +
      "at Route, I moved to designing and delivering the RESTful APIs those front ends called — " +
      "authentication, rate limiting, background jobs, real-time features with Socket.IO — and " +
      "started reasoning about services instead of screens.",
    "Quick Bite is where that progression converged: an independently designed 3-service, " +
      "event-driven microservices platform — sharded PostgreSQL, RabbitMQ, Redis — " +
      "capacity-planned for roughly 54M requests a day. I'm comfortable owning a feature end " +
      "to end, from UI to database schema to how it behaves under concurrency and failure.",
  ],
  education: {
    degree: "BSc in Computer Science",
    institution: "Nile University",
    location: "Cairo, Egypt",
    period: "01/2020 – 02/2025",
  },
  languages: [
    { name: "Arabic", level: "Native" },
    { name: "English", level: "Fluent, professional working proficiency" },
    { name: "German", level: "B1" },
  ],
};
