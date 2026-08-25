import type { Metadata } from "next";
import { resume } from "@/content";
import { Container } from "@/components/layout/Container";
import { buildMetadata } from "@/lib/metadata";
import { gmailComposeUrl } from "@/lib/email";

export const metadata: Metadata = buildMetadata({
  title: "Resume",
  description: resume.summary,
  path: "/resume",
  ogType: "profile",
});

export default function ResumePage() {
  return (
    <article className="py-[var(--space-section)]">
      <Container className="flex max-w-3xl flex-col gap-12">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-h1">{resume.name}</h1>
              <p className="text-body-lg text-foreground-muted">{resume.title}</p>
            </div>
            <a
              href={resume.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              View Resume
            </a>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-body">
            <a
              href={gmailComposeUrl(resume.contact.email)}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link w-fit"
            >
              {resume.contact.email}
            </a>
            <a
              href={resume.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link w-fit"
            >
              LinkedIn
            </a>
            <a
              href={resume.contact.github}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link w-fit"
            >
              GitHub
            </a>
            <span className="text-foreground-muted">{resume.contact.location}</span>
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="tag w-fit">Summary</h2>
          <p className="text-body-lg text-foreground-muted">{resume.summary}</p>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="tag w-fit">Skills</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {resume.skills.map((category) => (
              <div key={category.name} className="flex flex-col gap-2">
                <h3 className="font-display text-h3">{category.name}</h3>
                <p className="text-body text-foreground-muted">{category.items.join(", ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <h2 className="tag w-fit">Experience</h2>
          {resume.experience.map((entry) => (
            <div
              key={`${entry.company}-${entry.period}`}
              className="flex flex-col gap-2 border-l-2 pl-6"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-h3">{entry.role}</h3>
                <span className="text-small text-foreground-muted">{entry.period}</span>
              </div>
              <p className="text-body text-foreground-muted">
                {entry.company} · {entry.location}
              </p>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-foreground-muted">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-8">
          <h2 className="tag w-fit">Projects</h2>
          {resume.projects.map((project) => (
            <div key={project.slug} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-h3">{project.name}</h3>
                <span className="text-small text-foreground-muted">{project.period}</span>
              </div>
              <p className="text-body text-foreground-muted">{project.tagline}</p>
              <p className="text-body text-foreground-muted">{project.description}</p>
              <p className="text-small text-foreground-muted">{project.stack.join(", ")}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 border-t pt-8 sm:flex-row sm:gap-16" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-1">
            <span className="tag w-fit">Education</span>
            <p className="text-body">{resume.education.degree}</p>
            <p className="text-small text-foreground-muted">
              {resume.education.institution} · {resume.education.location} ·{" "}
              {resume.education.period}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="tag w-fit">Languages</span>
            <p className="text-body">
              {resume.languages.map((language) => `${language.name} (${language.level})`).join(" · ")}
            </p>
          </div>
        </section>
      </Container>
    </article>
  );
}
