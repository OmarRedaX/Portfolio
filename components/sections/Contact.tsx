import { contact } from "@/content";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { gmailComposeUrl } from "@/lib/email";
import { ContactForm } from "./ContactForm";

export function Contact() {
  return (
    <section
      id="contact"
      data-game-section="contact"
      className="border-t py-[var(--space-section)]"
      style={{ borderColor: "var(--border)" }}
    >
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <div data-game-keepout className="flex flex-col gap-6">
            <SectionHeading eyebrow="Contact" title="Contact" id="contact-heading" />
            <div
              data-game-checkpoint
              data-game-action-row="contact-actions"
              className="flex flex-col gap-2 text-body-lg"
            >
              <a
                href={gmailComposeUrl(contact.email)}
                data-game-target="contact-email"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link w-fit"
              >
                {contact.email}
              </a>
              <a
                href={contact.linkedin}
                data-game-target="contact-linkedin"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link w-fit"
              >
                LinkedIn
              </a>
              <a
                href={contact.github}
                data-game-target="contact-github"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link w-fit"
              >
                GitHub
              </a>
              <span className="text-foreground-muted">{contact.location}</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div data-game-obstacle="content" data-game-keepout>
            <ContactForm />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
