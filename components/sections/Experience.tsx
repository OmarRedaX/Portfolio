import { experience } from "@/content";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerReveal";

export function Experience() {
  return (
    <section
      id="experience"
      className="border-t py-[var(--space-section)]"
      style={{ borderColor: "var(--border)" }}
    >
      <Container className="flex flex-col gap-10">
        <Reveal>
          <SectionHeading eyebrow="Route" title="Experience" id="experience-heading" />
        </Reveal>

        <StaggerContainer staggerDelay={0.12} className="flex flex-col gap-10">
          {experience.map((entry) => (
            <StaggerItem
              key={`${entry.company}-${entry.period}`}
              className="flex flex-col gap-3 border-l-2 pl-6"
              style={{ borderColor: "var(--border)" }}
              y={10}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-h3">{entry.role}</h3>
                <span className="tag">{entry.period}</span>
              </div>
              <p className="text-body text-foreground-muted">
                {entry.company} · {entry.location}
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-body text-foreground-muted">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </section>
  );
}
