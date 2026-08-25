import { hero, contact } from "@/content";

// Deliberately not sourced from a claim anywhere in the CV — this is the one
// status flag on the site that isn't a historical fact, so it's kept here as
// a single literal to flip by hand rather than modeled in content/.
const AVAILABILITY = "Open to opportunities";

const items = [
  AVAILABILITY,
  hero.title,
  contact.location,
  "Event-driven architecture",
  "Next.js · Node.js · Go",
  "Quick Bite — capacity-planned for scale",
];

function TickerGroup() {
  return (
    <div className="ticker-group">
      {items.map((item) => (
        <span key={item} className="ticker-item font-mono text-mono uppercase tracking-widest text-foreground-muted">
          {item}
        </span>
      ))}
    </div>
  );
}

export function StatusTicker() {
  return (
    <div className="ticker border-b" style={{ borderColor: "var(--border)" }}>
      <span className="sr-only">
        {AVAILABILITY}. {hero.title}, based in {contact.location}.
      </span>
      <div className="ticker-track" aria-hidden="true">
        <TickerGroup />
        <TickerGroup />
      </div>
    </div>
  );
}
