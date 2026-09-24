import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Project, ProjectLinks } from "@/content";

const linkLabels: Record<keyof ProjectLinks, string> = {
  repo: "Repository",
  caseStudy: "Case Study",
  core: "Core Service",
  order: "Order Service",
  analytics: "Analytics Service",
  overview: "Overview",
};

export function ProjectCard({
  project,
  size,
}: {
  project: Project;
  size: "large" | "small";
}) {
  const linkEntries = Object.entries(project.links) as [keyof ProjectLinks, string][];

  return (
    <article
      data-game-keepout
      className={`card flex h-full flex-col gap-5 ${size === "large" ? "lg:p-10" : ""}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          className={size === "large" ? "font-display text-h2" : "font-display text-h3"}
        >
          {project.name}
        </h3>
        <span className="text-small text-foreground-muted">{project.period}</span>
      </div>

      <p className="text-body-lg text-foreground-muted">{project.tagline}</p>
      <p className="text-body text-foreground-muted">{project.description}</p>

      {project.highlights && size === "large" && (
        <ul className="flex list-disc flex-col gap-2 pl-5 text-body text-foreground-muted">
          {project.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}

      {project.status && (
        <p className="text-small italic text-foreground-muted">{project.status}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <span key={tech} className="tag">
            {tech}
          </span>
        ))}
      </div>

      <div
        data-game-action-row={`project-${project.slug}-actions`}
        className="flex flex-wrap gap-4 pt-2"
      >
        {linkEntries.map(([key, href]) =>
          key === "caseStudy" ? (
            <Link
              key={key}
              data-game-target={`${project.slug}-${key}`}
              href={href}
              className="btn btn-primary"
            >
              {linkLabels[key]}
            </Link>
          ) : (
            <a
              key={key}
              data-game-target={`${project.slug}-${key}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link inline-flex items-center gap-1"
            >
              {linkLabels[key]}
              <ExternalLink size={14} aria-hidden />
            </a>
          ),
        )}
      </div>
    </article>
  );
}
