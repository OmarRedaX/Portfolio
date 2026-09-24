import { about } from "@/content";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";

export function About() {
  return (
    <section id="about" data-game-section="about" className="py-[var(--space-section)]">
      <Container className="flex flex-col gap-10">
        <Reveal>
          <div data-game-checkpoint>
            <SectionHeading
              eyebrow="About"
              title="Engineering Profile"
              id="about-heading"
            />
          </div>
        </Reveal>

        <Reveal delay={0.05} className="flex max-w-3xl flex-col gap-6">
          <div data-game-obstacle="content" className="flex flex-col gap-6">
            {about.narrative.map((paragraph, index) => (
              <p key={index} className="text-body-lg text-foreground-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            data-game-keepout
            className="flex flex-col gap-6 border-t pt-8 sm:flex-row sm:gap-16"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex flex-col gap-2">
              <span className="tag w-fit">Education</span>
              <p className="text-body">{about.education.degree}</p>
              <p className="text-small text-foreground-muted">
                {about.education.institution} · {about.education.location} ·{" "}
                {about.education.period}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="tag w-fit">Languages</span>
              <p className="text-body">
                {about.languages
                  .map((language) => `${language.name} (${language.level})`)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
