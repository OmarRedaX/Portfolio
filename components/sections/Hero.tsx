import Link from "next/link";
import { hero } from "@/content";
import { Container } from "@/components/layout/Container";

// Decorative, aria-hidden — the "20% Technical/Blueprint" accent layer standing
// in for the deliberately-omitted photo (design tokens: typographic/abstract
// identity only). Restrained to near-invisible opacity so it reads as texture,
// not decoration.
function BlueprintGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

// Decorative technical texture standing in for a hero image — illustrates Quick Bite's real
// architecture facts (event-driven, RabbitMQ, transactional outbox — see projects.ts) in
// pseudo-code form rather than claiming to be an actual excerpt. Faint and hidden below `lg`
// so it never competes with or overlaps the headline on narrower viewports.
const CODE_MOTIF = `const platform = defineService({
  name: "quick-bite",
  pattern: "event-driven",
  broker: "rabbitmq",
  db: { engine: "postgres", sharded: true },
});

platform.on("order.placed", async (event) => {
  await outbox.publish(event);
});`;

function CodeMotif() {
  return (
    <pre
      aria-hidden
      className="pointer-events-none absolute right-0 top-1/2 hidden w-[26rem] -translate-y-1/2 whitespace-pre-wrap font-mono text-mono opacity-[0.09] lg:block"
    >
      {CODE_MOTIF}
    </pre>
  );
}

// One-time load stagger (Animation Strategy, implementation-plan.md §4) via plain CSS
// (see .hero-in in globals.css) rather than Framer Motion — this section stays a server
// component so the hero name (the page's LCP element) paints on its own schedule instead of
// waiting on client JS hydration.
export function Hero() {
  return (
    <section
      className="relative flex min-h-[calc(100vh-73px)] items-center overflow-hidden border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <BlueprintGrid />
      <CodeMotif />
      <Container className="relative flex flex-col gap-6 py-24">
        <span className="tag hero-in w-fit" style={{ animationDelay: "0.05s" }}>
          {hero.title}
        </span>
        <h1
          className="hero-in font-display text-display max-w-4xl"
          style={{ animationDelay: "0.17s" }}
        >
          {hero.name}
        </h1>
        <p
          className="hero-in text-body-lg max-w-2xl text-foreground-muted"
          style={{ animationDelay: "0.29s" }}
        >
          {hero.tagline}
        </p>
        <p
          className="hero-in text-body max-w-2xl text-foreground-muted"
          style={{ animationDelay: "0.41s" }}
        >
          {hero.valueProp}
        </p>
        <div className="hero-in flex flex-wrap gap-4 pt-4" style={{ animationDelay: "0.53s" }}>
          {hero.ctas.map((cta, index) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={index === 0 ? "btn btn-primary" : "btn btn-secondary"}
            >
              {cta.label}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
