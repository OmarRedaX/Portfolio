# CLAUDE.md

Operational guide for working in this repository. This file distills the rules that matter
day-to-day; `implementation-plan.md` is the full source of scope, phase acceptance criteria,
and rationale — consult it for anything this file doesn't cover.

## Project Overview

Personal portfolio site for **Omar Reda** (Full-Stack Engineer). Positioning: a
frontend → backend → full-stack progression, with the independently-built **Quick Bite**
microservices platform as the flagship proof point (case-study page). No CMS/DB/auth — this
is a static, content-driven site.

**Status:** Phases 1–11 are complete — content, design tokens, the full app (layout/nav,
homepage sections, Quick Bite case study, resume page, animation pass, SEO/metadata,
accessibility/responsive QA, final polish) are all built and pushed. Phase 12 (Deployment to
Vercel) has not started. Full roadmap and acceptance criteria: `implementation-plan.md`.

## Source of Truth & Precedence

1. `implementation-plan.md` — locked decisions, phase scope, acceptance criteria. Highest
   authority for any scope question.
2. This `CLAUDE.md` — conventions distilled from the plan for daily implementation work.
3. `content/*` — typed content data and the Quick Bite MDX. The **only** source of on-site
   copy. Never invent content; if a needed fact isn't here, flag it rather than fabricate it.
4. `OMAR_REDA_TAWFIK_ABOUELFADL_Full_Stack_Engineer.docx` — the real CV. Origin of every fact
   in `content/`. Treat as read-only source material, not something to edit.
5. `.claude/settings.json` — enabled plugins (`ui-ux-pro-max`, `taste-skill`, `github`) for
   design and PR work in later phases.

No other hand-authored CLAUDE.md or design guide exists in this repo (the Next.js
agent-rules block appended at the bottom of this file is auto-managed by `next dev` itself — see
the note at the end of this file, leave it in place; never write its begin/end HTML-comment
markers elsewhere in this file, since `next dev` treats the first begin marker it finds as the
block start and overwrites everything after it). `AGENTS.md` carries the same guidance for
Codex; keep the two in sync. `README.md` is intentionally minimal and links back here rather than
duplicating it.

## Tech Stack (locked — implementation-plan.md §2)

Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui primitives (heavily reskinned, not
used as visual defaults), Framer Motion (must respect `prefers-reduced-motion`), MDX for the
case study, React Hook Form + Zod, Resend (or equivalent) via a single route handler for the
contact form, `next/font` (self-hosted, no font CDN), native `app/sitemap.ts` + `app/robots.ts`.

**Explicitly excluded:** CMS, database, authentication, admin dashboard. Content lives in
typed local files (`content/`), not a backend.

## Architecture & Folder Structure

- `app/` — Next.js App Router. `page.tsx`/`layout.tsx` render the real homepage/shell; `/work/quick-bite`
  (case study), `/resume`, `app/sitemap.ts`, `app/robots.ts`, `app/api/contact` (contact-form route
  handler), `app/not-found.tsx` (404), and the generated `icon.tsx`/`apple-icon.tsx`/`opengraph-image.tsx`/
  `twitter-image.tsx` icons are all built.
  `app/dev/style-guide` is the internal, `noindex`'d design-token reference from Phase 2 —
  never link it from site navigation.
- `components/` — reusable UI: `layout/` (Header, Footer, ThemeToggle, StatusTicker, Container),
  `sections/` (Hero, About, TechStack, Projects, Experience, Contact, ContactForm), `case-study/`
  (architecture/event-flow diagrams, MetricStat, ScrollProgress), `motion/` (Reveal, StaggerReveal), `ui/`.
- `content/` — typed data + MDX (Phase 1 output, see below)
- `lib/` — utilities: `site.ts` (site URL/name), `metadata.ts` (per-route Metadata builder),
  `email.ts`, `send-contact-email.ts` (Resend), `schemas/contact.ts` (Zod), `og-card.tsx`
  (shared OG/Twitter/favicon visual).

## Content Layer (`content/`) — Phase 1 deliverable, present now

- `types.ts` — shared interfaces for every content shape.
- `hero.ts`, `about.ts`, `tech-stack.ts`, `projects.ts`, `experience.ts`, `contact.ts`,
  `resume.ts` — typed data modules.
- `index.ts` — barrel export for `@/content` imports once the app exists.
- `case-studies/quick-bite.mdx` — the case-study narrative (Overview → Core → Order →
  Analytics → Architecture → Engineering Decisions → Scaling → Correctness → Results).

Rules for this layer:
- Every fact traces back to the CV docx or the positioning draft in `implementation-plan.md`
  §1. No placeholder text, lorem ipsum, or invented metrics/experience/screenshots.
- `resume.ts` **reuses** `projects.ts` / `experience.ts` / `about.ts` data instead of
  duplicating it, so the resume page + PDF (Phase 7) and the homepage sections (Phase 5) stay
  in sync from one source, per the plan's "content-consistent" requirement.
- The CV's phone number is intentionally omitted everywhere on the site (locked decision —
  email + contact form + LinkedIn/GitHub only, no phone).
- Quick Bite's traffic figures (~54M requests/day, ~625 RPS) are a **capacity-planned design
  target**, not measured production traffic — copy must preserve that framing, never imply
  live production load.

## Coding Conventions

- TypeScript everywhere, strict types, no `any`. Content modules export named `const`s, never
  default exports.
- Functional React components only.
- Naming: PascalCase for components/types, camelCase for variables/functions, kebab-case for
  all multi-word file names (routes, components, content modules — e.g. `tech-stack.ts`).
- No comments explaining *what* code does — only *why*, and only when genuinely non-obvious.

## Design Direction & Tokens (Phase 2 — implemented in `app/globals.css`)

- 80% Premium/Editorial-Minimal base, 20% Technical/Blueprint accents — accents are for
  metrics, tech labels, and architecture framing **only**, never decorative.
- Palette: warm off-black/off-white ("ink on paper," not a cold near-black) plus one
  restrained accent — a desaturated cyanotype blue standing in for blueprint/drafting ink.
  Deliberately not the generic "near-black + neon accent" dev-portfolio look. All bg/fg pairs
  are contrast-checked ≥5.3:1. Dark is the default theme (`:root`); add class `light` to an
  ancestor element to opt into the light theme (Phase 4 wires up the real toggle with
  persistence + anti-flash handling — don't rebuild the palette to do that).
- Type: **Fraunces** (display serif, restrained use — H1–H3, hero name) + **Archivo** (body
  sans) + **IBM Plex Mono** (technical accent — tags, metric callouts, labels only). Loaded
  via `next/font/google` in `app/layout.tsx` (self-hosted, no font CDN). Type scale is
  `text-display/h1/h2/h3/body-lg/body/small/mono`, each bundling a paired line-height.
- Radii: `--radius-sm` (2px, tags — sharp/drafting-precise) / `--radius-md` (4px, buttons) /
  `--radius-lg` (8px, cards — slightly softer, editorial warmth).
- Motion tokens: `--duration-fast/base/slow` (150/250/400ms) on `--ease-standard` (a calm
  ease-out-quint, no bounce/elastic). A global `prefers-reduced-motion: reduce` rule already
  neutralizes all transition/animation durations — Phase 8 builds real animations on top of
  this, it does not need to add the reduced-motion handling itself.
- Spacing: Tailwind's default 4px-base scale is the project's spacing scale (not reinvented);
  `--space-section` is the one semantic addition, for consistent rhythm between major sections.
- Component-spec CSS classes (not React components yet): `.btn` + `.btn-primary` /
  `.btn-secondary`, `.card`, `.nav-link`, `.tag` (mono, uppercase, bracket-wrapped via
  `::before`/`::after` — content data stays plain text, brackets are presentational only).
  Phase 4/5 apply these class names on real components rather than restyling from scratch.
- No photo anywhere — typographic/monogram/abstract identity only.
- These tokens are the only source of color/spacing/type/motion from here on — no hardcoded
  values outside the token set. See `/dev/style-guide` for a live, both-themes reference.

## Animation Rules (Phase 8 — reference now so nothing built earlier conflicts with it)

One-time fade/slide-up stagger on hero text on load; scroll-in fade/translate (8–16px,
200–350ms), never repeating; project cards get a subtle lift + accent-border shift on hover,
no heavy shadow; tech-stack labels get a light stagger-in on scroll, no looping/idle
animation; buttons/links use color/underline transitions only, no bounce/elastic easing;
the case-study page gets a functional scroll-progress indicator; forms use real functional
states (focus rings, loading/success/error). `prefers-reduced-motion: reduce` must disable
all transform-based motion site-wide.

Exception (Game Mode traversal spec, 2026-09-24): the Hero Game Mode trigger alone uses a
decorative skew/lift + avatar peek on hover/focus; reduced motion shows a static state.

## Accessibility & Responsive (Phase 10)

Fully keyboard-navigable, no keyboard traps, all interactive elements reachable and labeled.
No color-contrast failures in either theme. Full mobile/tablet/desktop breakpoint QA with
correctly sized touch targets.

## Performance & SEO (Phase 9)

`next/image` and `next/font` everywhere; per-route Metadata API; generated OG/Twitter card
(no photo dependency); `sitemap.ts` / `robots.ts`; target Lighthouse ≥95 on Performance, SEO,
Best Practices, and Accessibility.

## Testing

No test suite exists yet — nothing built so far needs one (typed content, tokens, and a
placeholder scaffold page). Once Phase 5+ adds real logic (e.g. the contact-form route
handler): Jest & Supertest are the established tools (per the CV) — prefer them over
introducing a new runner.

## Don't-Do Rules

- Don't invent content, metrics, screenshots, URLs, employers, or achievements — everything
  must trace back to the CV docx or explicit user instruction.
- Don't add a CMS, database, authentication, or admin dashboard.
- Don't use a stock photo or a personal photo — identity stays typographic/abstract.
- Don't let Technical/Blueprint accents exceed ~20% of the visual language or become
  decorative.
- Don't publish a phone number anywhere on the site.
- Don't build final UI, navigation, hero, animations, or final responsive layouts ahead of
  their phase — see Roadmap below for the current phase boundary.
- Don't hardcode copy inside components once components exist — pull from `content/`.
- Don't imply Quick Bite's request/RPS figures are live production traffic — they are a
  capacity-planning target.

## Git Conventions

Repo is on branch `main`; `origin` points to `https://github.com/OmarRedaX/Portfolio.git` and
is pushed and up to date through Phase 11. Any further push still needs explicit confirmation
each time (visible action on a real external account), not just an already-approved plan.
Descriptive, conventional commit messages; never force-push or skip hooks without an explicit
request.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint-config-next` + `eslint-config-prettier`)
- `npm run format` / `npm run format:check` — Prettier (markdown is intentionally excluded —
  `implementation-plan.md` in particular should not be reformatted)

## Roadmap (full detail in `implementation-plan.md`)

1. Content & Copy — **done**
2. Design System (tokens) — **done** — `app/globals.css`, `/dev/style-guide`
3. Project Scaffold (Next.js app, repo init/push) — **done**
4. Core Layout & Navigation — **done** — `components/layout/`
5. Section Implementation (homepage) — **done** — `components/sections/`
6. Quick Bite Case Study page — **done** — `app/work/quick-bite/`, `components/case-study/`
7. Resume Page + PDF — **done** — `app/resume/`
8. Animation & Interaction Pass — **done** — `components/motion/`, scroll-progress, reduced-motion
9. SEO & Performance — **done** — per-route metadata, generated OG/Twitter/favicon images, sitemap/robots
10. Accessibility & Responsive QA — **done** — contrast audit, 44px touch targets, keyboard/breakpoint QA
11. Final Polish — **done** — `app/not-found.tsx`, generated favicon, verified production build
12. Deployment — not started (next up)

Work strictly in phase order unless the user explicitly says otherwise.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
