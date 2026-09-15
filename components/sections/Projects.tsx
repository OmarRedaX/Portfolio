import { projects } from "@/content";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerReveal";
import { ProjectCard } from "./ProjectCard";

export function Projects() {
  const featured = projects.find((project) => project.featured);
  const secondary = projects.filter((project) => !project.featured);

  return (
    <section
      id="projects"
      data-game-section="projects"
      className="border-t py-[var(--space-section)]"
      style={{ borderColor: "var(--border)" }}
    >
      <Container className="flex flex-col gap-10">
        <Reveal>
          <div data-game-checkpoint>
            <SectionHeading
              eyebrow="Work"
              title="Featured Projects"
              id="projects-heading"
            />
          </div>
        </Reveal>

        <div className="flex flex-col gap-8">
          {featured && (
            <Reveal>
              <div data-game-surface={`project-${featured.slug}-top`}>
                <ProjectCard project={featured} size="large" />
              </div>
            </Reveal>
          )}
          <StaggerContainer className="grid gap-8 sm:grid-cols-2">
            {secondary.map((project) => (
              <StaggerItem key={project.slug} className="h-full">
                <div data-game-surface={`project-${project.slug}-top`} className="h-full">
                  <ProjectCard project={project} size="small" />
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </Container>
    </section>
  );
}
