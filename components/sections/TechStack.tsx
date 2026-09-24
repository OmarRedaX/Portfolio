import { techStack } from "@/content";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerReveal";

export function TechStack() {
  return (
    <section
      id="tech-stack"
      data-game-section="tech-stack"
      className="border-t py-[var(--space-section)]"
      style={{ borderColor: "var(--border)" }}
    >
      <Container className="flex flex-col gap-10">
        <Reveal>
          <div data-game-checkpoint>
            <SectionHeading eyebrow="Stack" title="Tech Stack" id="tech-stack-heading" />
          </div>
        </Reveal>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2">
          {techStack.map((category) => {
            const isSystemDesign = category.name === "System Design & Architecture";
            return (
              <StaggerItem
                key={category.name}
                className={isSystemDesign ? "sm:col-span-2" : ""}
              >
                <div
                  data-game-surface={`stack-${category.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")}-top`}
                  data-game-keepout
                  className="card h-full"
                >
                  <h3 className="font-display text-h3 mb-4">{category.name}</h3>
                  <div className="flex flex-wrap gap-3">
                    {category.items.map((item) => (
                      <span key={item} className="tag">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </Container>
    </section>
  );
}
