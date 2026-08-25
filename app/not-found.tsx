import Link from "next/link";
import { Container } from "@/components/layout/Container";

// Matches the site's design language (Roadmap Phase 11) rather than falling back to Next.js's
// unstyled default — no metadata export needed, Next always serves this at a 404 status.
export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-73px)] items-center border-b" style={{ borderColor: "var(--border)" }}>
      <Container className="flex flex-col gap-6 py-24">
        <span className="tag w-fit">404</span>
        <h1 className="font-display text-h1 max-w-2xl">This page doesn&apos;t exist.</h1>
        <p className="text-body-lg max-w-xl text-foreground-muted">
          The page you&apos;re looking for was moved, renamed, or never existed. Head back to the
          homepage, or check out the Quick Bite case study.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
          <Link href="/work/quick-bite" className="btn btn-secondary">
            Quick Bite Case Study
          </Link>
        </div>
      </Container>
    </section>
  );
}
