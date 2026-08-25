import type { Metadata } from "next";
import { projects } from "@/content";
import { Container } from "@/components/layout/Container";
import { MetricStat } from "@/components/case-study/MetricStat";
import { ScrollProgress } from "@/components/case-study/ScrollProgress";
import { buildMetadata } from "@/lib/metadata";
import QuickBiteBody from "@/content/case-studies/quick-bite.mdx";

const project = projects.find((p) => p.slug === "quick-bite")!;

export const metadata: Metadata = buildMetadata({
  title: `${project.name} — Case Study`,
  description: project.tagline,
  path: "/work/quick-bite",
  ogType: "article",
});

const repoLinks: { key: "overview" | "core" | "order" | "analytics"; label: string }[] = [
  { key: "overview", label: "Overview Repo" },
  { key: "core", label: "Core Service" },
  { key: "order", label: "Order Service" },
  { key: "analytics", label: "Analytics Service" },
];

export default function QuickBiteCaseStudyPage() {
  return (
    <article>
      <ScrollProgress />
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <Container className="flex flex-col gap-8 py-[var(--space-section)]">
          <span className="tag w-fit">Case Study</span>
          <h1 className="font-display text-display max-w-3xl">{project.name}</h1>
          <p className="text-body-lg max-w-2xl text-foreground-muted">{project.tagline}</p>

          <div className="flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <span key={tech} className="tag">
                {tech}
              </span>
            ))}
          </div>

          {project.metrics && (
            <div className="flex flex-wrap gap-12">
              {project.metrics.map((metric) => (
                <MetricStat key={metric.label} {...metric} />
              ))}
            </div>
          )}

          {project.status && (
            <p
              className="max-w-2xl border-l-2 pl-4 text-small italic text-foreground-muted"
              style={{ borderColor: "var(--border)" }}
            >
              {project.status}
            </p>
          )}

          <div className="flex flex-wrap gap-4 pt-2">
            {repoLinks.map(({ key, label }) => {
              const href = project.links[key];
              if (!href) return null;
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  {label}
                </a>
              );
            })}
          </div>
        </Container>
      </header>

      <div className="py-[var(--space-section)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 sm:px-8">
          <QuickBiteBody />
        </div>
      </div>
    </article>
  );
}
