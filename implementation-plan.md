# Omar Reda — Full-Stack Engineer Portfolio
## Implementation Plan

Status: **Awaiting approval — no implementation has started.**

---

## 0. Locked Decisions (from discovery)

| Area | Decision |
|---|---|
| Positioning | Full-Stack Engineer — frontend→backend→full-stack progression as the narrative spine |
| Framework | Next.js (App Router) + TypeScript |
| Design direction | 80% Premium/Editorial-Minimal base, 20% Technical/Blueprint accents (metrics, tech labels, architecture framing only) |
| Theme | Dark default, light toggle |
| Photo | None — typography/monogram/abstract motif in Hero/About |
| CV | Real HTML resume page + polished PDF download, content-consistent |
| Flagship project | Quick Bite — one case-study page: Overview → Core → Order → Analytics → Architecture → Engineering Decisions → Scaling → Correctness → Results |
| Contact | Email (redaomar1999@gmail.com) + contact form. No phone number published. |
| Domain | Vercel subdomain now, custom domain later without rearchitecting |
| Languages | German (B1) shown compactly in About/Resume metadata only — not a positioning angle |
| Repo | Push to `https://github.com/OmarRedaX/Portfolio.git` |

---

## 1. Positioning (proposed — confirm/edit in Phase 2)

- **Primary title:** Full-Stack Engineer
- **Secondary line:** Scalable systems, event-driven architecture, and modern web engineering
- **One-line value prop:** "I build full-stack products end to end — React/Next.js interfaces backed by event-driven microservices architecture designed for scale and correctness."
- **Summary (draft, rewritten from CV, not copy-pasted):** Full-Stack Engineer with a BSc in Computer Science. Started in frontend engineering, moved into backend systems, and have since independently designed a 3-service event-driven microservices platform — sharded PostgreSQL, RabbitMQ, Redis — capacity-planned for ~54M requests/day. Comfortable owning a feature from UI to database schema to failure-mode handling under concurrency.

This intentionally leads with full-stack breadth, then lets the Quick Bite depth prove the "not just another React portfolio" claim — content proves seniority, design just stays out of the way, per your explicit instruction.

---

## 2. Tech Stack

**Framework decision — Next.js (App Router) over plain React/Vite SPA:**

| Criterion | React (Vite SPA) | Next.js |
|---|---|---|
| SEO | Poor by default, needs bolt-ons | Native SSR/SSG + Metadata API |
| Recruiter first-paint | Blank screen → CSR flash | Fast SSR, content visible immediately |
| Resume as real HTML page | Extra SSR setup required | Native |
| OG/Twitter cards | Manual | Native per-route metadata |
| Routing | Needs react-router | File-based, built in |
| Image optimization | Manual | `next/image` built in |
| Case-study long-form content | Needs MDX plugin wiring | Native MDX support |
| Deployment | Any static host | First-class Vercel (matches your existing Fresh-Cart choice, and your target domain plan) |
| You already know it | 10+ Next.js apps on your CV | Same |

No strong reason favors plain React for this project. **Recommendation: Next.js.**

**Supporting stack (each justified, nothing added for its own sake):**
- **TypeScript** — matches your actual skill set; typed content models for project/resume data.
- **Tailwind CSS** — fast to keep the 80/20 design ratio disciplined (utility-first makes it easy to *not* accidentally add gradients/shadows).
- **shadcn/ui primitives** (via the installed `ui-ux-pro-max` skill) — accessible base for form/dialog components only, heavily reskinned to the editorial-minimal direction rather than used as visual defaults.
- **Framer Motion** — the restrained animation layer; has first-class `prefers-reduced-motion` support.
- **MDX** — for the Quick Bite case study specifically, so architecture callouts/metric annotations can be real components, not just prose.
- **React Hook Form + Zod** — contact form validation, type-safe.
- **Resend** (or equivalent transactional email API) via a single Next.js route handler for the contact form — no database needed, avoids over-engineering.
- **next/font** — self-hosted fonts, no external font-CDN calls (performance + no third-party requests).
- **Native `app/sitemap.ts` + `app/robots.ts`** — no extra dependency needed.

**Explicitly not adding:** CMS, database, authentication, admin dashboard — none are justified for a static personal portfolio; content lives in typed local files/MDX.

---

## 3. Site Structure

**Included:**
1. **Hero** — name, title, tagline, value prop, CTAs (View Work / Resume / Contact), typographic/abstract visual identity.
2. **About / Engineering Profile** — the frontend→backend→full-stack narrative; Education + Languages folded in as a compact metadata block (not a standalone section).
3. **Tech Stack** — grouped: Frontend / Backend / Databases & Data / **System Design & Architecture** (called out visually — this is the differentiator) / Cloud & Tooling.
4. **Featured Projects** — Quick Bite (flagship, larger card → case study), Social-Media (secondary, backend/API-focused), e-commerce (secondary, frontend-focused — balances the other two).
5. **Quick Bite Case Study** (dedicated page) — Overview → Core → Order → Analytics → Architecture → Engineering Decisions → Scaling → Correctness → Results, plus an honest "in active development" note on containerization/testing.
6. **Experience** — Route: Frontend Intern → Backend Intern shown as one timeline reinforcing the progression story.
7. **Resume** (dedicated page) — HTML resume matching the downloadable PDF 1:1 in content.
8. **Contact** — email + form + LinkedIn/GitHub. No phone.

**Excluded (deliberately):** standalone Education section (thin on its own), Certifications (none exist), testimonials, company-logo wall (would read as inflated for internship-level companies), blog (not requested — avoids scope creep).

**Added beyond your list:** a matching-design-language 404 page (cheap, closes an easy consistency gap).

---

## 4. Animation Strategy

- **Page load:** one-time fade/slide-up stagger on hero text only.
- **Scroll-in:** sections fade/translate-up (8–16px, 200–350ms) on first entry into view, never repeating.
- **Project cards:** subtle lift + accent-color border shift on hover, no heavy shadow (keeps the 80% base intact).
- **Tech stack labels:** light stagger-in on scroll, no looping/idle animation.
- **Case-study page:** a functional scroll-progress indicator (technical accent, earns its place on long-form content only).
- **Buttons/links:** color/underline transitions only, no bounce/elastic easing — stays calm and editorial.
- **Forms:** real functional states — focus rings, submit loading/success/error.
- **Reduced motion:** global `prefers-reduced-motion` handling — transforms disabled, opacity-only or no transition fallback.

---

## 5. Visual Assets

| Asset | Plan |
|---|---|
| Photo | None — typographic/monogram identity, built in code |
| Favicon | Generated monogram |
| OG image | Generated typographic card (name + title), no photo dependency |
| Quick Bite architecture diagrams | Custom-built SVGs in the blueprint-accent style, sourced from the real architecture facts already pulled from the repo/README — not screenshots of the repo's ERD files |
| Project screenshots | None exist (no live demos). Quick Bite and Social-Media are API/backend projects with little UI to show — presented via architecture + metrics instead. e-commerce (Fresh-Cart) screenshots are a nice-to-have; site ships correctly without them — flag as an optional follow-up asset, not a blocker |
| Icons | `lucide-react` (lightweight, matches technical-minimal direction) |

---

## Phase 1 — Content & Copy Finalization
**Objective:** Lock all real text content before any UI is built.
**Tasks:** Finalize Hero/About copy from the draft above; write Quick Bite case-study narrative from the real architecture facts gathered; write Social-Media and e-commerce project descriptions; finalize Experience bullets; compile resume content (HTML + PDF source, identical).
**Deliverables:** `content/` typed data files (hero, about, projects, experience, resume) + Quick Bite MDX draft.
**Dependencies:** None.
**Acceptance criteria:** You review and approve all copy — no placeholder text remains.
**Exit condition:** Written sign-off before Phase 2.

## Phase 2 — Design System
**Objective:** Establish the 80/20 visual language as reusable tokens, not ad hoc styling.
**Tasks:** Define color tokens (off-black/off-white + one accent, dark/light pairs), type scale (editorial hierarchy + one mono accent face for technical labels), spacing scale, component specs (buttons, cards, nav, tags/labels), motion tokens (durations/easings, reduced-motion variants).
**Deliverables:** `design-tokens` (CSS variables/Tailwind config), a small internal style reference page.
**Dependencies:** Phase 1 content shapes what components are needed.
**Acceptance criteria:** Tokens render correctly in both themes; no hardcoded colors/spacing outside the token set.

## Phase 3 — Project Scaffold
**Objective:** Stand up the Next.js app correctly from the start.
**Tasks:** `create-next-app` (TypeScript, App Router, Tailwind), ESLint/Prettier config, folder structure (`app/`, `components/`, `content/`, `lib/`), git init + first commit, connect to `github.com/OmarRedaX/Portfolio.git`.
**Deliverables:** Running local dev server, clean repo history.
**Dependencies:** None — can run parallel to Phase 1/2.
**Acceptance criteria:** `npm run dev` works, lint passes, repo pushed with initial commit.

## Phase 4 — Core Layout & Navigation
**Objective:** Global shell: nav, footer, theme toggle, layout primitives.
**Tasks:** Header/nav (responsive, keyboard-navigable), footer (contact links), dark/light theme toggle with persisted preference, base page layout/container system.
**Deliverables:** Working shell across all routes.
**Acceptance criteria:** Keyboard-only navigation works; theme toggle has no flash-of-wrong-theme on load.

## Phase 5 — Section Implementation
**Objective:** Build Hero, About, Tech Stack, Featured Projects, Experience, Contact.
**Tasks:** Implement each section per the design tokens and locked copy; contact form wired to a Next.js route handler + email API; form validation via Zod/RHF.
**Deliverables:** Fully built homepage.
**Dependencies:** Phases 1–4 complete.
**Acceptance criteria:** All content real (no lorem ipsum); contact form actually sends a test email successfully.

## Phase 6 — Quick Bite Case Study Page
**Objective:** Build the flagship deep-dive page.
**Tasks:** MDX-driven page with the locked section order; build the 2–3 custom architecture SVG diagrams from real repo facts; metric callouts (54M req/day, ~625 RPS) in the mono/technical accent style; links to all four Quick Bite repos; the honest "in active development" status note.
**Dependencies:** Phase 1 case-study content, Phase 2 tokens.
**Acceptance criteria:** Page reads as one coherent narrative, not four disconnected sections; diagrams are legible at mobile width.

## Phase 7 — Resume Page + PDF
**Objective:** Ship the HTML resume page and matching PDF.
**Tasks:** Build resume as real semantic HTML (not an image/embed); generate a polished PDF from the same content source (single source of truth) for the download button.
**Acceptance criteria:** HTML and PDF content match exactly; PDF is print-quality, not a screenshot.

## Phase 8 — Animation & Interaction Pass
**Objective:** Apply the animation strategy site-wide.
**Tasks:** Scroll-in transitions, hover states, CTA interactions, case-study scroll progress indicator, reduced-motion fallback verified across all animated elements.
**Acceptance criteria:** `prefers-reduced-motion: reduce` removes all transform-based motion site-wide; no animation blocks readability or causes layout shift.

## Phase 9 — SEO & Performance
**Objective:** Make the site fast and crawlable.
**Tasks:** Metadata API per route, OG/Twitter card image, `sitemap.ts`/`robots.ts`, `next/font` self-hosting, `next/image` everywhere, code-splitting check, Lighthouse pass.
**Acceptance criteria:** Lighthouse ≥95 Performance/SEO/Best Practices/Accessibility on key pages; all routes have correct metadata.

## Phase 10 — Accessibility & Responsive QA
**Objective:** Verify real usability, not just visual completeness.
**Tasks:** Full keyboard-navigation pass, screen-reader spot check, color-contrast audit (both themes), mobile/tablet/desktop breakpoint QA, touch-target sizing.
**Acceptance criteria:** No contrast failures, no keyboard traps, all interactive elements reachable and labeled.

## Phase 11 — Final Polish
**Objective:** Close remaining gaps before launch.
**Tasks:** 404 page, favicon/OG image finalization, empty/error states (e.g. contact-form failure), cross-browser check, content proofread pass.
**Acceptance criteria:** No console errors/warnings; no placeholder or TBD content remains without your explicit sign-off to leave it.

## Phase 12 — Deployment
**Objective:** Ship it.
**Tasks:** Deploy to Vercel under a temporary subdomain, verify production build matches local, set up for later custom-domain attachment without rearchitecting, final smoke test in production.
**Acceptance criteria:** Production site live, matches approved design/content, all links (repos, LinkedIn, resume) verified working in production.

---

## Not started

Per your instructions, no code, components, or pages have been written. This plan is for your review and approval before Phase 1 begins.
