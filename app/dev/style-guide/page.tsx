"use client";

import { useState } from "react";

// Internal-only style reference (Phase 2 deliverable) — proves the design tokens
// render correctly in both themes. The theme switch below is a throwaway dev
// toggle (no persistence, no system-preference detection, no anti-flash
// handling) so this page can be checked in both themes; Phase 4 builds the
// real theme toggle. Not linked from site navigation.
//
// This applies the "light" class to a wrapping <div> rather than <html> —
// CSS custom properties inherit to descendants from whichever ancestor holds
// the class, and only the root layout is allowed to render <html>/<body>.

const swatches = [
  { name: "background", var: "--background" },
  { name: "surface", var: "--surface" },
  { name: "border", var: "--border" },
  { name: "foreground", var: "--foreground" },
  { name: "foreground-muted", var: "--foreground-muted" },
  { name: "accent", var: "--accent" },
  { name: "accent-strong", var: "--accent-strong" },
];

const typeScale = [
  { label: "display", className: "font-display text-display" },
  { label: "h1", className: "font-display text-h1" },
  { label: "h2", className: "font-display text-h2" },
  { label: "h3", className: "font-display text-h3" },
  { label: "body-lg", className: "font-sans text-body-lg" },
  { label: "body", className: "font-sans text-body" },
  { label: "small", className: "font-sans text-small" },
  { label: "mono", className: "font-mono text-mono uppercase tracking-widest" },
];

export default function StyleGuidePage() {
  const [light, setLight] = useState(false);

  return (
    <div
      className={`min-h-screen bg-background text-foreground font-sans px-8 py-12 ${
        light ? "light" : ""
      }`}
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-16">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-h1">Style Guide</h1>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setLight((v) => !v)}
          >
            Switch to {light ? "dark" : "light"}
          </button>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-h2">Color</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {swatches.map((s) => (
              <div key={s.name} className="flex flex-col gap-2">
                <div
                  className="h-16 rounded-[var(--radius-md)] border"
                  style={{ background: `var(${s.var})`, borderColor: "var(--border)" }}
                />
                <p className="text-small text-foreground-muted">{s.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-h2">Type Scale</h2>
          <div className="flex flex-col gap-3">
            {typeScale.map((t) => (
              <div key={t.label} className="flex items-baseline gap-4">
                <span className="w-20 shrink-0 text-small text-foreground-muted">
                  {t.label}
                </span>
                <span className={t.className}>Full-Stack Engineer</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-h2">Spacing</h2>
          <p className="text-body text-foreground-muted">
            Uses Tailwind&apos;s default spacing scale (4px base unit) — no separate scale
            reinvented. One semantic token,{" "}
            <code className="font-mono">--space-section</code>, sets consistent vertical
            rhythm between major page sections.
          </p>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-display text-h2">Components</h2>

          <div className="flex flex-wrap gap-4">
            <button type="button" className="btn btn-primary">
              Primary button
            </button>
            <button type="button" className="btn btn-secondary">
              Secondary button
            </button>
          </div>

          <div className="card max-w-sm">
            <p className="font-display text-h3">Card title</p>
            <p className="text-body text-foreground-muted">
              Surface background, hairline border, subtle lift + accent border on hover.
            </p>
          </div>

          <nav className="flex gap-6">
            <a href="#" className="nav-link">
              Nav link
            </a>
            <a href="#" className="nav-link">
              Another link
            </a>
          </nav>

          <div className="flex flex-wrap gap-4">
            <span className="tag">React.js</span>
            <span className="tag">Event-Driven</span>
            <span className="tag">~625 RPS</span>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-h2">Motion</h2>
          <p className="text-body text-foreground-muted">
            Durations/easing: <code className="font-mono">--duration-fast</code> (150ms),{" "}
            <code className="font-mono">--duration-base</code> (250ms),{" "}
            <code className="font-mono">--duration-slow</code> (400ms), all on{" "}
            <code className="font-mono">--ease-standard</code>. Hover the card above to
            see the base duration/easing in effect. A global{" "}
            <code className="font-mono">prefers-reduced-motion: reduce</code> rule
            disables all transform/animation durations site-wide.
          </p>
        </section>
      </div>
    </div>
  );
}
