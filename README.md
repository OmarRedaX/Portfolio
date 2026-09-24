# Portfolio

The personal portfolio of **Omar Reda**, Full-Stack Engineer. It is built around a
frontend → backend → full-stack progression, with the independently built **Quick Bite**
microservices platform as the flagship case study. It is a static, content-driven site:
there is no CMS, no database and no authentication.

## Contents

- [What's on the site](#whats-on-the-site)
- [Game Mode](#game-mode)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Content](#content)
- [Design system](#design-system)
- [Testing](#testing)
- [Accessibility, SEO and performance](#accessibility-seo-and-performance)
- [Project status](#project-status)
- [Further documentation](#further-documentation)

## What's on the site

| Route | What it is |
|---|---|
| `/` | The homepage: Hero, About, Tech Stack, Projects, Experience and Contact |
| `/work/quick-bite` | The Quick Bite case study: MDX narrative, architecture and event-flow diagrams, metric callouts and a scroll-progress indicator |
| `/resume` | The resume page, built from the same data as the homepage, with a link to the PDF |
| `/api/contact` | The route handler behind the contact form (Zod-validated, sent with Resend) |
| `/dev/style-guide` | Internal design-token reference in both themes (`noindex`, not linked from navigation) |
| `/sitemap.xml`, `/robots.txt` | Generated with `app/sitemap.ts` and `app/robots.ts` |

Other features:

- **Themes.** Dark is the default, and there is a light theme. The choice is saved, and
  an inline script applies it before the first paint, so there is no flash.
- **Motion.** A one-time hero stagger, scroll-in reveals, card hover lift, and a scroll
  progress bar on the case study. `prefers-reduced-motion: reduce` turns off all
  transform-based motion.
- **Contact.** Email, LinkedIn, GitHub and a contact form with real loading, success and
  error states. There is intentionally no phone number anywhere on the site.
- **Generated images.** The favicon, Apple icon and OpenGraph/Twitter cards are generated
  in code, with no photo. The site's identity is typographic.
- **404.** A custom not-found page.

A note on Quick Bite's figures: the traffic numbers (~54M requests/day, ~625 RPS) are a
**capacity-planned design target**, not measured production traffic. The copy keeps that
framing.

## Game Mode

Game Mode is an opt-in way to explore the homepage: a small avatar walks and jumps down
the page from Hero to Contact, and you can open the page's links from inside the game.

- **Start it** with the **Game Mode** button in the Hero, then confirm in the dialog. The
  game code loads only after you confirm. Nothing about the page changes while it's off.
- **Controls:** `←` `→` move · `Space` jump · `Enter` activates the highlighted link
  (View Work, Contact, project links, Case Study…).
- **Checkpoints.** There is one flag per section, and exactly one is active at a time.
  Falling out of the route returns you to the active checkpoint. Overshooting a jump on a
  course returns you to the ledge you jumped from.
- **Pausing.** Scrolling, resizing, content reveals, switching tabs and using page controls
  all pause the game. It never resumes by itself: press **Resume Game**.
- **Traversal courses.** Hand-authored courses sit in measured, content-free zones
  between sections. They come in comfortable, easy, medium and challenge tiers. Every
  jump's difficulty is measured, and a missed challenge jump lands on a catch floor. A
  course that doesn't fit the current layout is dropped, and that part of the route stays
  as the basic route.
- **Where it's available.** Game Mode needs a keyboard and a large enough window. On
  small screens the button shows **Larger window required**. On touch-only devices it
  shows **Keyboard required**.

How it works: the route is built from the page's measured layout with deterministic
physics (fixed 1/120 s step). Every connection, including every course edge, is proven
in both directions with the same physics the game runs. The logic lives in `lib/game/`,
and the React session and view live in `components/game/`.

Currently active courses:

| Viewport | Active courses |
|---|---|
| 1440 and 1280 wide | Stepping stones (easy), Grid run (challenge), Precision ledges (challenge) |
| 1024 and 768 wide | None; the basic route is used |

The other three planned courses (Launch pad, Timeline rungs, Cool-down) don't fit the
current layout under the design's rules. The exact measured reasons are recorded in
[`docs/game-mode-validation.md`](./docs/game-mode-validation.md).

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) with React 19 and TypeScript (strict)
- Tailwind CSS 4
- Framer Motion for animation
- MDX (`@next/mdx`) for the case study
- React Hook Form + Zod for the contact form
- [Resend](https://resend.com) for contact-form email
- `next/font` (Fraunces, Archivo, IBM Plex Mono), self-hosted with no font CDN
- ESLint (`eslint-config-next`) + Prettier

## Getting started

Requirements: Node.js 20.9 or later (required by Next.js 16), and npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

### Environment variables

Create `.env.local` in the project root. It is git-ignored.

| Variable | Required for | Notes |
|---|---|---|
| `RESEND_API_KEY` | Contact form | Resend API key. Without it the site builds and runs, but form submissions fail. |
| `CONTACT_TO_EMAIL` | Contact form | The inbox that receives contact messages. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Overrides the canonical site URL used in metadata, the sitemap and OG images. On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` is used automatically. |

Contact email is currently sent from Resend's shared `onboarding@resend.dev` address,
because no custom domain is verified yet. Replies go to the visitor.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier write / check (Markdown is intentionally excluded) |
| `npm run test:game` | Compile and run the Game Mode test suite (Node's built-in test runner) |

## Project structure

```
app/                 Next.js App Router
  page.tsx           Homepage
  layout.tsx         Root layout, fonts, theme bootstrap
  work/quick-bite/   Case study page
  resume/            Resume page
  api/contact/       Contact-form route handler
  dev/style-guide/   Internal design-token reference (noindex)
  sitemap.ts, robots.ts, not-found.tsx
  icon.tsx, apple-icon.tsx, opengraph-image.tsx, twitter-image.tsx
components/
  layout/            Header, Footer, ThemeToggle, StatusTicker, Container
  sections/          Hero, About, TechStack, Projects, ProjectCard, Experience, Contact, ContactForm
  case-study/        Architecture/event-flow diagrams, MetricStat, ScrollProgress
  motion/            Reveal, StaggerReveal
  game/              Game Mode entry, session, view, avatar and styles
  ui/                Shared primitives (SectionHeading)
content/             All on-site copy as typed data (+ case-studies/quick-bite.mdx)
lib/
  game/              Game Mode engine: physics, geometry, route/world, witnesses, courses, session, scroll, interaction
  site.ts, metadata.ts, og-card.tsx, email.ts, send-contact-email.ts, schemas/
tests/game/          Game Mode tests and measured-layout fixtures
docs/                Game Mode browser validation record
```

## Content

All copy lives in `content/` as typed data (`types.ts`, one module per section, and an
`index.ts` barrel). Components never hard-code copy. Every fact comes from Omar's CV
(`OMAR_REDA_TAWFIK_ABOUELFADL_Full_Stack_Engineer.docx`, read-only source material).
`resume.ts` reuses the projects, experience and about data, so the resume page and the
homepage stay in sync.

The homepage presents three projects: **Quick Bite** (flagship, with the case study),
**Social-Media** and **Fresh-Cart**. It also shows two Route internships, one in
front-end and one in back-end web development.

## Design system

The look is "ink on paper": a warm off-black/off-white palette with one restrained
cyanotype-blue accent. The type is Fraunces (display), Archivo (body) and IBM Plex Mono
(technical labels). The blueprint-style accents are kept to about 20% of the visual
language and used for metrics, tech labels and architecture only.

Every color, radius, spacing and motion value is a token in `app/globals.css`. Every
background/foreground pair is contrast-checked at 5.3:1 or better. You can browse the
tokens in both themes at `/dev/style-guide`.

## Testing

```bash
npm run test:game
```

This runs the Game Mode suite (145 tests) with Node's built-in test runner. It covers:

- physics and the session state machine
- geometry registration
- route building on real measured homepage layouts (1440, 1280, 1024 and 768 wide)
- every course validation rule, each with at least one failing case
- timing-window sweeps
- recovery, and scroll ownership

Real-browser acceptance (headless Chrome with trusted keyboard input) is documented in
[`docs/game-mode-validation.md`](./docs/game-mode-validation.md). That covers full forward
and reverse journeys, missed jumps, resize, reveal, navigation, themes and forced colors.

## Accessibility, SEO and performance

- The site is fully keyboard-navigable, with visible focus states, 44 px touch targets,
  and contrast checked in both themes.
- Game Mode keeps everything readable and clickable. Game ledges and the avatar never
  overlap text or controls. It respects reduced motion, and its ledges stay visible in
  forced-colors (High Contrast) mode.
- Each route has its own metadata. The OG/Twitter cards are generated, and the sitemap and
  robots file are generated too.
- `next/font` and `next/image` are used throughout. The target is Lighthouse ≥ 95 in every
  category.

## Project status

Phases 1–11 of the roadmap are complete: content, design system, scaffold, layout and
navigation, homepage sections, the Quick Bite case study, the resume, animation,
SEO/performance, accessibility QA and final polish. Game Mode and its traversal courses
are built on the `codex/game-mode` branch.

**Phase 12, deployment to Vercel, has not started yet.**

## Further documentation

| File | What it covers |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md) | Working conventions, design tokens, rules for contributors and coding agents |
| [`implementation-plan.md`](./implementation-plan.md) | Full roadmap, locked decisions and phase acceptance criteria |
| [`game-mode-design.md`](./game-mode-design.md) | Game Mode base design |
| [`game-mode-traversal-design.md`](./game-mode-traversal-design.md) | Traversal courses and entry hover design |
| [`docs/game-mode-validation.md`](./docs/game-mode-validation.md) | Browser validation record, measurements and known gaps |
