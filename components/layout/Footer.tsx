import { Mail } from "lucide-react";
import { contact } from "@/content";
import { gmailComposeUrl } from "@/lib/email";
import { Container } from "./Container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t" style={{ borderColor: "var(--border)" }}>
      <Container className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-display text-h3">Omar Reda</p>
          <p className="text-small text-foreground-muted">{contact.location}</p>
        </div>

        <div className="flex items-center gap-6">
          <a
            href={gmailComposeUrl(contact.email)}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link inline-flex items-center gap-2"
          >
            <Mail size={18} aria-hidden />
            Email
          </a>
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            LinkedIn
          </a>
          <a
            href={contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            GitHub
          </a>
        </div>
      </Container>

      <Container className="pb-8">
        <p className="text-small text-foreground-muted">© {year} Omar Reda.</p>
      </Container>
    </footer>
  );
}
