# CLAUDE.md

Operational guide for working in this repository. This file distills the rules that matter
day-to-day; `implementation-plan.md` is the full source of scope, phase acceptance criteria,
and rationale — consult it for anything this file doesn't cover.

## Project Overview

Personal portfolio site for **Omar Reda** (Full-Stack Engineer). Positioning: a
frontend → backend → full-stack progression, with the independently-built **Quick Bite**
microservices platform as the flagship proof point (case-study page). No CMS/DB/auth — this
is a static, content-driven site.

**Status:** Phase 1 (Content & Copy Finalization) is complete. Phases 2–12 have not started.
Full roadmap and acceptance criteria: `implementation-plan.md`.

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

No other CLAUDE.md, README, or design guide exists in this repo. When Phase 3 scaffolds the
Next.js app, any new README should link back here rather than duplicate or override it.

## Tech Stack (locked — implementation-plan.md §2)

Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui primitives (heavily reskinned, not
used as visual defaults), Framer Motion (must respect `prefers-reduced-motion`), MDX for the
case study, React Hook Form + Zod, Resend (or equivalent) via a single route handler for the
contact form, `next/font` (self-hosted, no font CDN), native `app/sitemap.ts` + `app/robots.ts`.

**Explicitly excluded:** CMS, database, authentication, admin dashboard. Content lives in
typed local files (`content/`), not a backend.

## Architecture & Folder Structure (planned — Phase 3 stands this up)

- `app/` — routes: `/` (hero, about, tech-stack, projects, experience, contact as sections),
  `/work/quick-bite` (case study), `/resume`, `app/sitemap.ts`, `app/robots.ts`
- `components/` — reusable UI, reskinned shadcn primitives
- `content/` — typed data + MDX (**exists now** — Phase 1 output, see below)
- `lib/` — utilities (e.g. contact-form email sending)

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

## Coding Conventions (apply once Phase 3+ introduces code)

- TypeScript everywhere, strict types, no `any`. Content modules export named `const`s, never
  default exports.
- Functional React components only.
- Naming: PascalCase for components/types, camelCase for variables/functions, kebab-case for
  all multi-word file names (routes, components, content modules — e.g. `tech-stack.ts`).
- No comments explaining *what* code does — only *why*, and only when genuinely non-obvious.

## Design Direction (locked)

- 80% Premium/Editorial-Minimal base, 20% Technical/Blueprint accents — accents are for
  metrics, tech labels, and architecture framing **only**, never decorative.
- Dark default, light toggle. Off-black/off-white + one accent color, dark/light token pairs.
  One mono/technical face for technical labels; an editorial type scale otherwise.
- No photo anywhere — typographic/monogram/abstract identity only.
- Once Phase 2 lands design tokens, they are the only source of color/spacing/type — no
  hardcoded values outside the token set.

## Animation Rules (Phase 8 — reference now so nothing built earlier conflicts with it)

One-time fade/slide-up stagger on hero text on load; scroll-in fade/translate (8–16px,
200–350ms), never repeating; project cards get a subtle lift + accent-border shift on hover,
no heavy shadow; tech-stack labels get a light stagger-in on scroll, no looping/idle
animation; buttons/links use color/underline transitions only, no bounce/elastic easing;
the case-study page gets a functional scroll-progress indicator; forms use real functional
states (focus rings, loading/success/error). `prefers-reduced-motion: reduce` must disable
all transform-based motion site-wide.

## Accessibility & Responsive (Phase 10)

Fully keyboard-navigable, no keyboard traps, all interactive elements reachable and labeled.
No color-contrast failures in either theme. Full mobile/tablet/desktop breakpoint QA with
correctly sized touch targets.

## Performance & SEO (Phase 9)

`next/image` and `next/font` everywhere; per-route Metadata API; generated OG/Twitter card
(no photo dependency); `sitemap.ts` / `robots.ts`; target Lighthouse ≥95 on Performance, SEO,
Best Practices, and Accessibility.

## Testing

No test suite exists yet — Phase 1 produced content only, nothing executable. Once Phase 3+
introduces code: Jest & Supertest are the established tools (per the CV) for anything that
needs tests, e.g. the contact-form route handler — prefer them over introducing a new runner.

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

This directory is not yet a git repository — Phase 3 runs `git init`, the first commit, and
connects to `https://github.com/OmarRedaX/Portfolio.git`. Once initialized: descriptive,
conventional commit messages; never force-push or skip hooks without an explicit request.

## Commands

Not available yet — Phase 3 scaffolds the Next.js app and adds `npm run dev` / `npm run lint`
/ `npm run build`. Until then there is no build/lint/test pipeline; Phase 1 is validated by
content review only (see implementation report for this phase).

## Roadmap (full detail in `implementation-plan.md`)

1. Content & Copy — **done**
2. Design System (tokens)
3. Project Scaffold (Next.js app, repo init/push)
4. Core Layout & Navigation
5. Section Implementation (homepage)
6. Quick Bite Case Study page
7. Resume Page + PDF
8. Animation & Interaction Pass
9. SEO & Performance
10. Accessibility & Responsive QA
11. Final Polish
12. Deployment

Work strictly in phase order unless the user explicitly says otherwise.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
