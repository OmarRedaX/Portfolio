import { techStack } from "@/content";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerReveal";

export function TechStack() {
  return (
    <section
      id="tech-stack"
      className="border-t py-[var(--space-section)]"
      style={{ borderColor: "var(--border)" }}
    >
      <Container className="flex flex-col gap-10">
        <Reveal>
          <SectionHeading eyebrow="Stack" title="Tech Stack" id="tech-stack-heading" />
        </Reveal>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2">
          {techStack.map((category) => {
            const isSystemDesign = category.name === "System Design & Architecture";
            return (
              <StaggerItem
                key={category.name}
                className={`card ${isSystemDesign ? "sm:col-span-2" : ""}`}
              >
                <h3 className="font-display text-h3 mb-4">{category.name}</h3>
                <div className="flex flex-wrap gap-3">
                  {category.items.map((item) => (
                    <span key={item} className="tag">
                      {item}
                    </span>
                  ))}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </Container>
    </section>
  );
}
