# Game Mode Traversal Courses + Entry Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Do not start execution merely because this plan exists. It needs explicit user approval.**

**Goal:**
- Add six deterministic, per-section traversal courses to Game Mode. They are validated by the same production physics witnesses as today's route and fall back per course to today's backbone.
- Give the Hero **Game Mode** button a professional "step into play" engaged state.

**Architecture:**
- `buildWorld` still builds today's backbone first.
- A new pure `lib/game/courses.ts` compiles authored blueprints against measured content-free zones. It validates placement, isolation, bidirectional witnesses, timing-window difficulty, catch coverage and graph reachability. Accepted courses replace backbone helper spans.
- A final replay of every connection against the final surface set guards the result.
- Witness simulation moves to `lib/game/witness.ts` so the backbone and courses share one proof path.
- The hover is scoped CSS on the existing entry button, plus a shared avatar SVG component.

**Tech Stack:** Next.js 16.3.2, React 19.2.8, TypeScript (strict), Tailwind CSS 4, CSS modules, Node built-in test runner via `npm run test:game`. No new dependencies.

**Spec:** [game-mode-traversal-design.md](./game-mode-traversal-design.md), which builds on [game-mode-design.md](./game-mode-design.md). Read both before any task.

**Status:** Plan only. No production files changed. Execution approved 2026-09-24. Baseline commit `0ad28af` on `codex/game-mode`. `AGENTS.md` is tracked; keep it in sync with CLAUDE.md.

## Global Constraints

- Tuning is fixed: `step 1/120, speed 240, gravity 1100, jumpSpeed 580, body 24×32, landingMargin 2, reachX 110, reachY 150`. No physics or tuning change.
- "Courses only add to a world that is already valid. They can never make a viewport unsupported or fail a world that validates today."
- "Every course edge … is witnessed in **both** directions with production `step()` against the **final** full surface set."
- One checkpoint per section. Course ledges are never checkpoints. No lives, score, penalties, game over, or drop-through control. No per-session randomness.
- Course keep-out visual clearance: 12 px (provisional). Backbone exclusions and clearance (2 px) are unchanged.
- Tier floors (provisional; frames at 1/120 s):

| Tier | Min window | Min ledge | Max gap | Max rise |
|---|---|---|---|---|
| comfortable | 36 or walk/drop | 96 | 48 | 48 |
| easy | 24 | 64 | 96 | 80 |
| medium | 18 | 48 | 128 | 96 |
| challenge | 12 | 40 | 176 | 112 |

- Rhythm: at most 2 challenge courses, at most 3 challenge edges per course, and a rest ledge of at least 96 px between consecutive challenge edges.
- Course surfaces total at most 60. The witness cap stays 180 frames.
- The 24 px avatar, the no-content-overlap rule, and the "Larger window required" decision stay as they are.
- Tokens only for colors and durations. No new copy (`content/game-mode.ts` is unchanged).
- The entry hover is a scoped exception to the "buttons/links use color/underline transitions only" rule. Record it in both CLAUDE.md and AGENTS.md.
- Strict TypeScript, no `any`, kebab-case new files, named exports. No comments explaining *what*.
- Local commits per task only. No push, merge, or deployment.

Commands (run from the repo root):
- `npm run test:game`: compiles with `tsconfig.game-tests.json` and runs `node --test`. Baseline: 86 passing.
- `npx tsc --noEmit --incremental false`
- `npm run lint`
- `npm run build`. If the sandbox fails with `spawn EPERM`, retry elevated, as done previously.
- `git diff --check`

## Review Focus

1. **Resize or font load while standing on a course ledge.** The course can flip active↔inactive. The avatar must pause and restore on the same ledge, or recover to the checkpoint. It must never float or fall silently. Test: Task 7 Step 7.
2. **Same-page navigation (View Work / Contact) into a section whose band has a course.** Destination landing must choose the checkpoint or a backbone helper, never a narrow challenge ledge. Test: Task 7 Step 8.
3. **Reveal pending under a course.** Card keep-outs are still at reveal offsets or have a hover lift. Course validity must not change between planned and settled geometry. Test: Task 2 Step 3 (normalization) and Task 7 Step 6 (planned vs settled parity).
4. **Viewports at the tier edge (1024 overlay, 768 classic).** Courses that don't fit are rejected cleanly and availability is identical. Test: Task 7 Step 5 parity over every fixture.
5. **Entry button rapid hover and focus while a session is active, or while ineligible.** No engaged state while `aria-disabled="true"`, and no layout shift ever. Test: Task 1 Step 6 (browser rect equality plus disabled check).

---

## File map

| Path | Action | Responsibility |
|---|---|---|
| `components/game/avatar-figure.tsx` | Create | The avatar SVG `<g>` drawing, shared by the game view and the entry peek |
| `components/game/game-entry.tsx` | Modify | Add the label wrapper and avatar peek inside the trigger |
| `components/game/game-mode.module.css` | Modify | Trigger engaged/pressed/reduced-motion/forced-colors states; drafted-ledge tier styles |
| `components/game/game-view.tsx` | Modify | Use `AvatarFigure`; render ledges by tier |
| `lib/game/model.ts` | Modify | `Tier`, `CourseId`, `CourseSummary`, `World.courses`, `GeometrySnapshot.keepouts` |
| `lib/game/geometry.ts` | Modify | Read and observe `data-game-keepout` |
| `lib/game/witness.ts` | Create | `apex`, `witness`, `timingWindow`, `replay`, `clearOf` (moved from world.ts, plus the sweep) |
| `lib/game/courses.ts` | Create | Tier rules, zones, blueprints, `compileCourse`, `validateCourse` |
| `lib/game/world.ts` | Modify | Use witness.ts; `routeEnvelope`; `integrateCourses`; final replay; cache key |
| `lib/game/interaction.ts` | Modify | `destinationLanding` excludes course surfaces |
| `components/sections/{TechStack,ProjectCard,About,Experience,Contact}.tsx` | Modify | Add `data-game-keepout` attributes only |
| `tests/game/{witness,courses}.test.ts` | Create | Pure tests |
| `tests/game/{world,geometry,geometry-world,interaction}.test.ts` | Modify | Keep-outs in fixtures; integration, parity, and landing tests |
| `tests/game/fixtures/rendered-homepage.ts` | Create | Measured snapshots at 1440×900, 1280×800, 1024×900 (overlay) and 768×900 (classic) |
| `docs/game-mode-validation.md` | Modify | Survey, per-viewport active courses, browser evidence |
| `CLAUDE.md`, `AGENTS.md` | Modify | One-line scoped animation exception (kept in sync) |

Unchanged: `physics.ts`, `session.ts`, `scroll.ts`, `game-session.tsx` (unless a failing test proves otherwise), `content/*`, `Hero.tsx`.

---

## Part B: GM-T2 entry hover (independent; ship first)

### Task 1: Shared avatar figure + "step into play" trigger state

**Files:**
- Create: `components/game/avatar-figure.tsx`
- Modify: `components/game/game-view.tsx:200-214`, `components/game/game-entry.tsx:128-148`, `components/game/game-mode.module.css`, `CLAUDE.md` (Animation Rules), `AGENTS.md` (same line)

**Interfaces:**
- Produces: `AvatarFigure({ className }: { className?: string }): React.JSX.Element`. Renders `<svg viewBox="0 0 24 32">` containing the existing `<g className={styles.figure}>` paths verbatim.

- [ ] **Step 1: Extract the avatar SVG.** Create `avatar-figure.tsx` holding the exact paths from `game-view.tsx:201-213`, and replace that block with `<AvatarFigure />`:

```tsx
import styles from "./game-mode.module.css";

export function AvatarFigure({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 32" width="100%" height="100%" className={className} aria-hidden="true" focusable="false">
      <g className={styles.figure}>
        <path className={styles.legs} d="M8 22 7 30M16 22 17 30" />
        <path className={styles.hoodie} d="M5 13Q1 17 3 23L6 22 7 25H17L18 22 21 23Q23 17 19 13L17 11H7Z" />
        <path className={styles.hoodie} d="M5 10V8a7 7 0 0 1 14 0v2l-3 5H8Z" />
        <rect x="7" y="5" width="10" height="8" rx="3" className={styles.face} />
        <path className={styles.eyes} d="M10 8v2m4-2v2" />
        <path className={styles.seam} d="m9 16 3 2 3-2m-5 5h4" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Run `npx tsc --noEmit --incremental false && npm run lint`.** Expected: pass. The in-game avatar markup is unchanged. `.avatar[data-facing] svg` and the pose selectors still match, because the svg and `g` structure is identical.

- [ ] **Step 3: Update the trigger markup** in `game-entry.tsx`. The label spans move into a wrapper, and a decorative peek is added. The accessible name stays "Game Mode":

```tsx
<span className={styles.triggerLabel}>
  <span className={styles.available}>{gameMode.entry}</span>
  <span className={styles.keyboardRequired}>{gameMode.keyboardRequired}</span>
</span>
<span className={styles.peek} aria-hidden="true"><AvatarFigure /></span>
```

- [ ] **Step 4: Add the CSS.** Chrome moves to `::before` so only a decorative layer skews. The `<button>` box and its focus outline never transform.

```css
.trigger {
  position: relative;
  isolation: isolate;
  border-color: transparent;
}
.trigger::before,
.trigger::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  pointer-events: none;
  transition:
    transform var(--duration-base) var(--ease-standard),
    opacity var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard);
}
.trigger::before {
  z-index: -1;
  border: 1px solid var(--border);
  background: var(--background);
}
.trigger::after { /* the ledge under the face */
  z-index: -2;
  inset: auto 0 -4px 4px;
  height: 4px;
  top: auto;
  border-radius: var(--radius-sm);
  background: var(--accent);
  opacity: 0;
  transform: translateY(-4px);
}
.triggerLabel {
  display: inline-block;
  transition: transform var(--duration-base) var(--ease-standard);
}
.peek {
  position: absolute;
  right: 0.75rem;
  bottom: 100%;
  width: 12px;
  height: 16px;
  opacity: 0;
  transform: translateY(8px);
  clip-path: inset(0 0 -2px 0);
  transition:
    transform var(--duration-base) var(--ease-standard) 80ms,
    opacity var(--duration-fast) var(--ease-standard) 80ms;
}

.trigger[aria-disabled="true"]:hover { border-color: transparent; color: var(--foreground); }
.trigger:not([aria-disabled="true"]):focus-visible { color: var(--accent); }
@media (hover: hover) and (pointer: fine) {
  .trigger:not([aria-disabled="true"]):hover::before { transform: translateY(-2px) skewX(-8deg); border-color: var(--accent); }
  .trigger:not([aria-disabled="true"]):hover::after { opacity: 1; transform: skewX(-8deg); }
  .trigger:not([aria-disabled="true"]):hover .triggerLabel { transform: translateY(-2px); }
  .trigger:not([aria-disabled="true"]):hover .peek { opacity: 1; transform: translateY(-2px); }
}
.trigger:not([aria-disabled="true"]):focus-visible::before { transform: translateY(-2px) skewX(-8deg); border-color: var(--accent); }
.trigger:not([aria-disabled="true"]):focus-visible::after { opacity: 1; transform: skewX(-8deg); }
.trigger:not([aria-disabled="true"]):focus-visible .triggerLabel { transform: translateY(-2px); }
.trigger:not([aria-disabled="true"]):focus-visible .peek { opacity: 1; transform: translateY(-2px); }

.trigger:not([aria-disabled="true"]):active::before { transform: skewX(-8deg); transition-duration: var(--duration-fast); }
.trigger:not([aria-disabled="true"]):active::after { height: 2px; bottom: -2px; }
.trigger:not([aria-disabled="true"]):active .triggerLabel { transform: none; }

@media (prefers-reduced-motion: reduce) {
  .trigger::before,
  .trigger::after,
  .trigger .triggerLabel,
  .trigger .peek { transform: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .trigger::after, .peek { display: none; }
  .trigger::before { border-color: ButtonText; background: ButtonFace; }
}
```

Text color on hover already comes from the existing `.btn-secondary:hover` rule. The button's own border is transparent, so the visible border is `::before`'s. The `:hover` transform selectors must stay inside the `(hover: hover)` query so a touch tap never leaves a sticky engaged state.

- [ ] **Step 5: Record the exception.** In both CLAUDE.md and AGENTS.md, under "Animation Rules", append one sentence:
> "Exception (Game Mode traversal spec, 2026-09-24): the Hero Game Mode trigger alone uses a decorative skew/lift + avatar peek on hover/focus; reduced motion shows a static state."

Keep the two files in sync, and don't touch the Next.js agent-rules block.

- [ ] **Step 6: Verify in a real browser.** Use headless Chrome over CDP (see memory "game-mode-browser-testing"). Start `npm run dev` on `localhost:3000` and check at 1440×900 in both themes:
  - `getBoundingClientRect()` of the trigger and of `[data-game-action-row="hero-actions"]` is identical before hover, during hover, and after 400 ms.
  - Engaged hover shows `::before` with a computed transform that isn't `none`, and the peek's opacity is 1.
  - With `Emulation.setEmulatedMedia` `prefers-reduced-motion: reduce`, the `::before` computed transform is `none` and the peek's opacity is 1 once engaged.
  - With `forced-colors: active` emulated, the peek is `display: none`.
  - Keyboard: Tab to the button. The focus-visible engaged state shows, the outline is unskewed, and Enter opens the dialog.
  - After Continue, while the session is active, hovering the trigger shows no engaged state.
  - Pointer resting on the button's top-left edge for 2 s gives no flicker: no `mouseleave` on the button, recorded via a `mouseover`/`mouseout` counter.
  - Save screenshots, plus a short recording (screencast frames), to `.superpowers/sdd/game-mode-traversal/`.

- [ ] **Step 7: Run all checks and commit.** Run `npm run test:game` (86 pass), then tsc, lint, and build.

```bash
git add components/game/avatar-figure.tsx components/game/game-entry.tsx components/game/game-view.tsx components/game/game-mode.module.css CLAUDE.md
git commit -m "feat(game): give the Game Mode trigger a step-into-play engaged state"
```

Also stage `AGENTS.md` (tracked; its Animation Rules line must match CLAUDE.md).

---

## Part A: GM-T1 traversal courses

### Task 2: Course-only keep-out registrations

**Files:**
- Modify: `lib/game/model.ts` (`GeometrySnapshot.keepouts: Rect[]`), `lib/game/geometry.ts:10-12,80-160,169-176`
- Modify: `components/sections/TechStack.tsx`, `components/sections/ProjectCard.tsx`, `components/sections/About.tsx`, `components/sections/Experience.tsx`, `components/sections/Contact.tsx`
- Test: `tests/game/geometry.test.ts`, and the fixture builders in `tests/game/world.test.ts`, `tests/game/geometry-world.test.ts`, `tests/game/fixtures/rendered-projects.ts` (add `keepouts: []`)

**Interfaces:**
- Produces: `GeometrySnapshot.keepouts: Rect[]`. These are transform-normalized, visible keep-out rects, measured regardless of reveal state (planned position). The backbone never reads them.

- [ ] **Step 1: Add the field** to `GeometrySnapshot` and `keepouts: []` to every test fixture builder. Run `npm run test:game`. Expected: 86 pass (a type-only change).
- [ ] **Step 2: Write the failing test.** A pending reveal wrapper with `translateY(8px)` around a `data-game-keepout` card produces a keep-out at the un-translated y. Also, `readGeometry` never adds keep-outs to `obstacles`. Mirror the existing stub-DOM style in `geometry.test.ts` ("moving supports remain planned…").

```ts
test("keep-outs are planned, normalized, and separate from backbone obstacles", () => {
  // stub: section hero > reveal[data-game-reveal-state=pending, transform matrix(1,0,0,1,0,8)] > div[data-game-keepout] at top 300
  const snapshot = readGeometry(root);
  assert.deepEqual(snapshot.keepouts, [{ x: 0, y: 292, width: 300, height: 120 }]);
  assert.equal(snapshot.obstacles.length, 0);
});
```

- [ ] **Step 3: Run it.** `npm run test:game`. Expected: FAIL (`keepouts` is empty).
- [ ] **Step 4: Implement.** Add `[data-game-keepout]` to `registeredSelector` and to the `observeGeometry` selector. In the registration loop, when `element.dataset.gameKeepout !== undefined && visible(element)` (ignore settled/moving), push `rect`.
- [ ] **Step 5: Add the attributes** (no visual change):
  - `TechStack.tsx`: `data-game-keepout` on the `.card` div.
  - `ProjectCard.tsx`: on the card root element. The measure already un-lifts `.card`.
  - `About.tsx`: on the Education/Languages `Reveal` inner wrapper (wrap its two children in `<div data-game-keepout className="contents">` only if the Reveal can't take the attribute; prefer passing it through if `Reveal` forwards props).
  - `Experience.tsx`: on each `StaggerItem`'s inner obstacle div (also a keep-out).
  - `Contact.tsx`: on the left `Reveal` column and on the form wrapper.

  Check `Reveal`/`StaggerItem` prop forwarding before choosing the element.
- [ ] **Step 6: Run the tests** (the new test passes; 87 in total), then tsc and lint. Load `localhost:3000` at 1440 and confirm the homepage is visually unchanged: compare screenshots.
- [ ] **Step 7: Commit.** `feat(game): register course-only keep-out regions`

### Task 3: Measured zone survey, fixtures, and decision gate

**Files:**
- Create: `tests/game/fixtures/rendered-homepage.ts`, and the gitignored capture script `.superpowers/sdd/game-mode-traversal/capture-geometry.mjs`
- Modify: `docs/game-mode-validation.md` (new section "Traversal zone survey (2026-09-xx)")

**Interfaces:**
- Produces: `export function measuredHomepage(viewport: "1440" | "1280" | "1024-overlay" | "768-classic"): { snapshot: GeometrySnapshot; width: number; usableHeight: number }`. The data is JSON captured from the real page, with `elements: new Map()`.

- [ ] **Step 1: Add a temporary capture hook (NEVER commit it)** at the end of `GameEntry`'s first `useEffect`:

```ts
Object.assign(window, { __gameSnapshot: () => readGeometry(document.getElementById("main-content") ?? document.body) });
```

- [ ] **Step 2: Write the capture script.** It uses Node's built-in `WebSocket` against Chrome launched with `--headless=new --remote-debugging-port=9333 --user-data-dir=<scratch>`. For each configuration it does the following:
  - Set metrics.
  - Navigate to `http://localhost:3000/`.
  - Scroll to the bottom in 400 px steps with a 300 ms wait each, then back to the top, so every reveal settles.
  - Evaluate `JSON.stringify({ ...__gameSnapshot(), elements: [] , innerWidth, clientWidth: document.documentElement.clientWidth })`.

  The four configurations: 1440×900, 1280×800, 1024×900 launched with `--hide-scrollbars`, and 768×900 without it. Emit them as TS fixture literals.

- [ ] **Step 3: Measure the zones for each configuration** and record them in the validation doc:
  - bands between each pair of consecutive sections (top = lowest keep-out/obstacle/row bottom of section N; bottom = section N+1 anchor top);
  - the Hero floor;
  - the left and right gutter widths over Experience;
  - the backbone lane x from the current `buildWorld` result.
- [ ] **Step 4: Remove the hook.** `git diff components/game/game-entry.tsx` must be empty.
- [ ] **Step 5: Decision gate.** Compare the measurements with spec §3.3:
  - At 1440 and 1280, every planned zone must exist: band height ≥ 150 px, a gutter over Experience ≥ 104 px wide, and a Hero floor ≥ 96 px tall.
  - If a planned zone is missing at 1440 or 1280, **stop and report** the measurement to the user with a proposed per-section change. Don't improvise a different course.
- [ ] **Step 6: Add a sanity test** that each fixture still builds its backbone:

```ts
for (const v of ["1440", "1280", "1024-overlay", "768-classic"] as const) {
  test(`measured ${v} fixture keeps today's backbone`, () => {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    assert.ok(buildWorld(snapshot, tuning, { width, usableHeight }, 1).ok);
  });
}
```

  Run it: expected PASS. If 768-classic or 1024-overlay fails, record that honestly and use `viewportSupportsRoute` expectations instead. Don't edit the fixture.
- [ ] **Step 7: Commit** the fixture, test, and doc. `test(game): capture measured homepage zones for traversal courses`

### Task 4: `witness.ts`: shared proof path + timing-window sweep

**Files:**
- Create: `lib/game/witness.ts`, `tests/game/witness.test.ts`
- Modify: `lib/game/world.ts:16-157` (move `maxWitnessFrames`, `clear`, `bodyRect`, `apex`, `witness` out; import them back)

**Interfaces:**
- Produces:

```ts
export const maxWitnessFrames = 180;
export const maxSurfaces = 160; // moved from world.ts so courses.ts can read it without importing world.ts (no cycle); Task 7 raises it
export function clearOf(a: Rect, b: Rect, margin?: number): boolean;
export function bodyRect(body: Body): Rect;
export function apex(tuning: Tuning): number;
export function witness(from: Surface, to: Surface, surfaces: readonly Surface[], obstacles: readonly Rect[], tuning: Tuning, viewportWidth: number, clearance?: number): Connection | null; // clearance default 2 = today
export function replay(connection: Connection, surfaces: readonly Surface[], tuning: Tuning): boolean; // lands on connection.to
export type TimingWindow = { frames: number; best: Connection | null; outcomes: Array<string | null> };
export function timingWindow(from: Surface, to: Surface, surfaces: readonly Surface[], obstacles: readonly Rect[], tuning: Tuning, viewportWidth: number, clearance: number): TimingWindow;
```

- [ ] **Step 1: Pure move.** Move `maxSurfaces`, `maxWitnessFrames`, `clear` (renamed `clearOf`), `bodyRect`, `apex`, and `witness` verbatim, update `world.ts` to import them, add `clearance` (default `2`) where `witness` currently hard-codes `2`, and export them. Run `npm run test:game`. Expected: 87 or more pass, unchanged. This proves a behavior-neutral refactor.
- [ ] **Step 2: Write the failing tests** for `timingWindow` and `replay`:

```ts
const flat = (id: string, x: number, width: number, y = 500): Surface => ({ id, section: "about", x, y, width, checkpoint: false });

test("a short level gap has a wide window, a long gap a narrow one, and an impossible gap none", () => {
  const a = flat("a", 100, 96);
  const near = timingWindow(a, flat("b", 244, 96), [a, flat("b", 244, 96)], [], tuning, 1440, 12);
  const far = timingWindow(a, flat("c", 196 + 170, 48), [a, flat("c", 366, 48)], [], tuning, 1440, 12);
  const none = timingWindow(a, flat("d", 196 + 300, 96), [a, flat("d", 496, 96)], [], tuning, 1440, 12);
  assert.ok(near.frames >= 24);
  assert.ok(far.frames > 0 && far.frames < near.frames);
  assert.equal(none.frames, 0);
  assert.equal(none.best, null);
});

test("the returned witness is the centre of the longest window and replays", () => {
  const a = flat("a", 100, 96), b = flat("b", 244, 96);
  const w = timingWindow(a, b, [a, b], [], tuning, 1440, 12);
  assert.ok(w.best && replay(w.best, [a, b], tuning));
});

test("failing presses report where the body landed, including a catch floor", () => {
  const a = flat("a", 100, 96), b = flat("b", 366, 48), floor = flat("floor", 60, 500, 620);
  const w = timingWindow(a, b, [a, b, floor], [], tuning, 1440, 12);
  assert.ok(w.outcomes.some((o) => o === "floor"));
  assert.ok(w.outcomes.every((o) => o === "b" || o === "floor" || o === "a"));
});

test("a success that crosses a keep-out does not count", () => {
  const a = flat("a", 100, 96), b = flat("b", 244, 96);
  const w = timingWindow(a, b, [a, b], [{ x: 190, y: 380, width: 60, height: 60 }], tuning, 1440, 12);
  assert.equal(w.frames, 0);
});
```

- [ ] **Step 3: Run them.** Expected: FAIL (not defined).
- [ ] **Step 4: Implement `timingWindow`:**
  - Start from `spawn(from)`. The direction is the sign from `from`'s center to `to`'s center (1 if equal).
  - Walk toward `to`. Let `P` be the first frame at which the body no longer overlaps `from`, capped at 90.
  - For each press frame `p` in `0..P`:
    - hold the direction;
    - press jump at `p` (only if still grounded on `from`; otherwise the variant is a walk-off);
    - after the press, stop steering once the body's center is within `to`'s span shrunk by half a body width;
    - simulate at most `maxWitnessFrames` frames.
  - Record `outcomes[p]` as the first surface landed on other than `from`, or `from` if the jump returned to it, or `null` on escape, leaving the viewport, or budget.
  - A press succeeds when `outcomes[p] === to.id` and no frame intersects an obstacle expanded by `clearance`.
  - `frames` is the longest contiguous run of successes. `best` is the recorded `Connection` for the middle press of that run.
- [ ] **Step 5: Run the tests.** Expected: PASS, and existing tests unchanged.
- [ ] **Step 6: Commit.** `refactor(game): share witness simulation and add timing-window sweep`

### Task 5: `courses.ts`: tier rules, zones, blueprints, compilation

**Files:**
- Create: `lib/game/courses.ts`, `tests/game/courses.test.ts`, `tests/game/fixtures/band.ts`. The last one holds `bandFixture()`: a synthetic six-section 1440 px snapshot with explicit keep-outs and a 256 px band between About and Tech Stack. Tasks 6–7 reuse it, and Task 7 extends it as `bandWorldFixture()`.
- Modify: `lib/game/model.ts`

**Interfaces:**
- Produces (in `model.ts`):

```ts
export type Tier = "comfortable" | "easy" | "medium" | "challenge";
export type CourseId = "launch-pad" | "stepping-stones" | "grid-run" | "precision-ledges" | "timeline-rungs" | "cool-down";
export type CourseSummary = { id: CourseId; section: SectionId; tier: Tier; entryId: string; exitId: string; surfaceIds: string[]; catchIds: string[]; edgeTiers: Record<string, Tier> }; // key `${from}>${to}`
// World gains: courses: CourseSummary[]
```

- Produces (in `courses.ts`):

```ts
export const tierOrder: readonly Tier[] = ["comfortable", "easy", "medium", "challenge"];
export const tierRules: Record<Tier, { minWindow: number; minWidth: number; maxGap: number; maxRise: number }> = {
  comfortable: { minWindow: 36, minWidth: 96, maxGap: 48, maxRise: 48 },
  easy: { minWindow: 24, minWidth: 64, maxGap: 96, maxRise: 80 },
  medium: { minWindow: 18, minWidth: 48, maxGap: 128, maxRise: 96 },
  challenge: { minWindow: 12, minWidth: 40, maxGap: 176, maxRise: 112 },
};
export const courseClearance = 12;
export type ZoneKind = "band" | "hero-floor" | "gutter";
export type Zone = { kind: ZoneKind; section: SectionId; rect: Rect; laneSide: "left" | "right"; contentLeft: number };
export type LedgeSpec = { id: string; x: number; y: { top: number } | { bottom: number }; width: number; catch?: boolean };
export type CourseBlueprint =
  | { id: CourseId; section: SectionId; zone: ZoneKind; tier: Tier; layout: "ledges"; ledges: readonly LedgeSpec[] }
  | { id: CourseId; section: SectionId; zone: "gutter"; tier: Tier; layout: "rungs"; laneWidth: number; maxRise: number };
export const blueprints: readonly CourseBlueprint[]; // fixed order = acceptance order (spec §3.3 rows 1-6)
export function findZone(blueprint: CourseBlueprint, snapshot: GeometrySnapshot, viewportWidth: number, laneX: number, tuning: Tuning): Zone | null;
export function compileCourse(blueprint: CourseBlueprint, zone: Zone, snapshot: GeometrySnapshot, tuning: Tuning): Surface[] | null;
export function edgeTier(window: number | "walk", from: Surface, to: Surface): Tier | null; // easiest tier whose rules the edge meets; null = too hard for any
```

- [ ] **Step 1: Add the model types** and `courses: []` to `attempt()`'s returned world. Run the tests: they pass.
- [ ] **Step 2: Write the failing tests:**

```ts
test("edge tiers follow the floor table and reject frame-perfect jumps", () => {
  const a = surf("a", 0, 96, 500), b = surf("b", 140, 64, 460);
  assert.equal(edgeTier("walk", a, surf("c", 96, 96, 500)), "comfortable");
  assert.equal(edgeTier(30, a, b), "easy");       // gap 44, rise 40, width 64
  assert.equal(edgeTier(13, a, surf("n", 250, 40, 400)), "challenge");
  assert.equal(edgeTier(11, a, surf("n", 250, 40, 400)), null);
});

test("band zone sits between section N content and section N+1 heading, lane-side first", () => {
  const zone = findZone(blueprintById("stepping-stones"), bandFixture(), 1440, 120, tuning)!;
  assert.deepEqual(zone.rect, { x: 120, y: 1812, width: 1128, height: 212 }); // numbers from bandFixture()
  assert.equal(zone.laneSide, "left");
});

test("gutter zone requires two lanes and is null at 1024", () => {
  assert.equal(findZone(blueprintById("timeline-rungs"), measuredHomepage("1024-overlay").snapshot, 1024, 0, tuning), null);
});

test("compilation mirrors for a right lane, snaps to 8px from content left, and is deterministic", () => {
  const left = compileCourse(bp, zoneLeft, snapshot, tuning)!, right = compileCourse(bp, zoneRight, snapshot, tuning)!;
  for (const s of left) assert.equal((s.x - zoneLeft.contentLeft) % 8, 0);
  assert.deepEqual(left.map((s) => s.width), right.map((s) => s.width));
  assert.deepEqual(compileCourse(bp, zoneLeft, snapshot, tuning), left);
});

test("a zone too small for its blueprint rejects instead of squeezing", () => {
  assert.equal(compileCourse(bp, { ...zoneLeft, rect: { ...zoneLeft.rect, width: 200 } }, snapshot, tuning), null);
});

test("rungs align to Experience keep-out tops and alternate lanes", () => {
  const { snapshot, width } = measuredHomepage("1440");
  const bp = blueprintById("timeline-rungs");
  const zone = findZone(bp, snapshot, width, 120, tuning)!;
  const rungs = compileCourse(bp, zone, snapshot, tuning)!;
  const experience = snapshot.sectionBounds.experience;
  const tops = snapshot.keepouts
    .filter((k) => k.y >= experience.y && k.y + k.height <= experience.y + experience.height)
    .map((k) => k.y);
  for (const top of tops) assert.ok(rungs.some((r) => Math.abs(r.y - top) <= 4), `no rung at ${top}`);
  const sorted = [...rungs].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    assert.notEqual(sorted[i].x, sorted[i - 1].x);
    assert.ok(sorted[i].y - sorted[i - 1].y <= 96);
  }
});
```

Define `surf`, `bandFixture`, and `blueprintById` in the test file. `bandFixture` is a two-section synthetic snapshot with explicit keep-outs, and its expected numbers are written in the test.
- [ ] **Step 3: Run them.** Expected: FAIL.
- [ ] **Step 4: Implement:**
  - **`findZone`:**
    - Band: `top` = max bottom over keep-outs, obstacles, and planned action rows in section N, plus `courseClearance`. `bottom` = the anchor y of section N+1 minus `courseClearance`. X runs from the lane (its lane-side edge) to the far content edge.
    - Hero floor: the Hero action row bottom plus clearance, down to the Hero section bottom.
    - Gutter: from the viewport edge (use `snapshot` content-left and `viewportWidth`) to content-left minus clearance, over the Experience keep-outs' y-extent. It's valid only if its width is at least `2 * laneWidth + 8`.
    - Return `null` otherwise.
  - **`compileCourse`:**
    - Resolve each `LedgeSpec` to absolute coordinates: mirror x when `laneSide === "right"`, snap x to `contentLeft + 8k`, and resolve y from the zone's top or bottom.
    - Reject if any ledge falls outside the zone or is narrower than the course tier's `minWidth` (catch ledges excepted).
    - Surface ids are `course-${blueprint.id}-${spec.id}`.
    - For the rungs layout: alternate two lanes, put one rung at each Experience keep-out top, and insert evenly spaced intermediate rungs so that no rise exceeds `maxRise`.
  - **`edgeTier`:** gap is the horizontal clear distance, rise is `max(0, from.y − to.y)`, width is `to.width`. Return the first tier in `tierOrder` whose rules all hold (`walk` counts as `window = Infinity`).
  - **Initial blueprints** (spec §3.3; offsets in px, tuned in Task 8):

```ts
export const blueprints: readonly CourseBlueprint[] = [
  { id: "launch-pad", section: "hero", zone: "hero-floor", tier: "comfortable", layout: "ledges", ledges: [
    { id: "step-1", x: 64, y: { top: 40 }, width: 128 }, { id: "step-2", x: 224, y: { top: 80 }, width: 128 },
    { id: "hop", x: 384, y: { top: 80 }, width: 112 } ] },
  { id: "stepping-stones", section: "about", zone: "band", tier: "easy", layout: "ledges", ledges: [
    { id: "u1", x: 72, y: { top: 48 }, width: 96 }, { id: "u2", x: 232, y: { top: 64 }, width: 80 },
    { id: "u3", x: 392, y: { top: 48 }, width: 96 }, { id: "l1", x: 312, y: { bottom: 56 }, width: 96 },
    { id: "l2", x: 152, y: { bottom: 40 }, width: 96 } ] },
  { id: "grid-run", section: "tech-stack", zone: "band", tier: "challenge", layout: "ledges", ledges: [
    { id: "u1", x: 72, y: { top: 56 }, width: 96 }, { id: "u2", x: 240, y: { top: 56 }, width: 64 },
    { id: "u3", x: 424, y: { top: 40 }, width: 48 }, { id: "rest", x: 624, y: { top: 48 }, width: 112 },
    { id: "catch", x: 48, y: { bottom: 48 }, width: 720, catch: true } ] },
  { id: "precision-ledges", section: "projects", zone: "band", tier: "challenge", layout: "ledges", ledges: [
    { id: "u1", x: 72, y: { top: 64 }, width: 96 }, { id: "p1", x: 272, y: { top: 64 }, width: 48 },
    { id: "rest", x: 432, y: { top: 72 }, width: 104 }, { id: "p2", x: 648, y: { top: 40 }, width: 40 },
    { id: "catch", x: 48, y: { bottom: 48 }, width: 704, catch: true } ] },
  { id: "timeline-rungs", section: "experience", zone: "gutter", tier: "medium", layout: "rungs", laneWidth: 48, maxRise: 96 },
  { id: "cool-down", section: "contact", zone: "band", tier: "comfortable", layout: "ledges", ledges: [
    { id: "landing", x: 64, y: { top: 64 }, width: 192 }, { id: "hop", x: 96, y: { bottom: 40 }, width: 128 } ] },
];
```

- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit.** `feat(game): add course blueprints, zones, and tier rules`

### Task 6: `validateCourse`: every feasibility check with a named rejection

**Files:**
- Modify: `lib/game/courses.ts`, `tests/game/courses.test.ts`

**Interfaces:**
- Consumes: `witness`, `timingWindow`, `replay`, `clearOf` (Task 4); `compileCourse`, `edgeTier`, `tierRules` (Task 5).
- Produces:

```ts
export type CourseRejection = "zone" | "placement" | "isolation" | "witness" | "tier" | "rhythm" | "catch" | "graph" | "budget";
export type CourseContext = { world: World; snapshot: GeometrySnapshot; tuning: Tuning; viewportWidth: number; laneX: number; acceptedCourseRects: Rect[] };
export type CourseResult =
  | { ok: true; summary: CourseSummary; surfaces: Surface[]; connections: Connection[]; removedIds: string[]; corridor: Rect[] }
  | { ok: false; reason: CourseRejection };
export function validateCourse(blueprint: CourseBlueprint, context: CourseContext): CourseResult;
```

- [ ] **Step 1: Write one failing test per rejection reason, plus a success case.** Build each case from `bandFixture()` with one targeted mutation:

```ts
const cases: Array<[CourseRejection, (f: Fixture) => void]> = [
  ["zone", (f) => { f.snapshot.sectionAnchors["tech-stack"].y = f.bandTop + 80; }],        // band too short
  ["placement", (f) => { f.snapshot.keepouts.push({ x: 300, y: f.bandTop + 20, width: 200, height: 40 }); }],
  ["isolation", (f) => { f.snapshot.surfaces.push({ id: "card-top", section: "about", x: 400, y: f.bandTop + 100, width: 300, checkpoint: false }); }],
  ["witness", (f) => { f.blueprint = withLedge(f.blueprint, "u3", { x: 900 }); }],            // unreachable
  ["tier", (f) => { f.blueprint = { ...f.blueprint, tier: "comfortable" }; }],                 // easy gaps > comfortable
  ["rhythm", (f) => { f.blueprint = withoutLedge(f.blueprint, "rest"); }],                    // consecutive challenge edges
  ["catch", (f) => { f.blueprint = withoutLedge(f.blueprint, "catch"); }],                    // misses escape
  ["graph", (f) => { f.blueprint = withLedge(f.blueprint, "island", { x: 1000, y: { top: 8 }, width: 64 }); }],
  ["budget", (f) => { f.world = { ...f.world, surfaces: [...f.world.surfaces, ...filler(150)] }; }],
];
for (const [reason, mutate] of cases) test(`course rejects: ${reason}`, () => { const f = baseFixture(); mutate(f); assert.deepEqual(validateCourse(f.blueprint, f.context), { ok: false, reason }); });

test("an accepted course has bidirectional, replayable witnesses and tiers within its tier", () => {
  const r = validateCourse(baseFixture().blueprint, baseFixture().context);
  assert.ok(r.ok);
  for (const c of r.connections) {
    assert.ok(replay(c, [...baseFixture().context.world.surfaces, ...r.surfaces], tuning));
    assert.ok(r.connections.some((d) => d.from === c.to && d.to === c.from));
  }
  for (const t of Object.values(r.summary.edgeTiers)) assert.ok(tierOrder.indexOf(t) <= tierOrder.indexOf(r.summary.tier));
});
```

- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement the checks in spec §3.6 order.** Return on the first failure.
  1. **zone:** `findZone`, then `compileCourse`. Either returning null → `"zone"`.
  2. **placement:** every compiled surface's `spawn` body clears keep-outs, obstacles, planned action rows, enabled target rects, and section anchors by `courseClearance`, and lies inside the zone and the viewport. Fail → `"placement"`.
  3. **isolation:**
     - Entry = the last world surface with `x === laneX` and `y <= zone.rect.y + 8`. Exit = the first such surface with `y >= zone.rect.y + zone.rect.height - 8`.
     - `removedIds` = world surfaces strictly between entry.y and exit.y at `x === laneX`. Every one must start with `helper-`.
     - Every course corridor rect (expanded by `bodyWidth`) must not intersect any `snapshot.plannedSurfaces` top line, any non-removed world surface other than entry and exit, or `acceptedCourseRects`.
     - Fail → `"isolation"`.
  4. **witness:** ordered chain `entry → ledges (spec order, non-catch) → exit`, plus every catch ledge ↔ its nearest chain ledge. For each adjacent pair in both directions:
     - first try `witness(...)` with clearance 12 (walk and walk-off modes → `"walk"`);
     - otherwise use `timingWindow(...)`.
     - Any direction with no witness → `"witness"`.
     - All proofs use the full surface set: `world.surfaces − removedIds + course surfaces`.
  5. **tier:** `edgeTier` per direction must be non-null and ≤ the course tier. Fail → `"tier"`.
  6. **rhythm:** challenge edges ≤ 3; two consecutive challenge edges must share a ledge ≥ 96 px wide. Fail → `"rhythm"`.
  7. **catch:** for each medium or challenge edge, every non-success `outcomes[p]` must be a non-null surface id in the course, the backbone, or `from`. From that surface, `from` must be reachable in at most 2 witnessed course edges of tier ≤ easy. Fail → `"catch"`.
  8. **graph:** every course surface is reachable from entry, and entry is reachable from it, over the course's connections. Fail → `"graph"`.
  9. **budget:** course surfaces ≤ 12 per course and total world surfaces ≤ `maxSurfaces`. Fail → `"budget"`. Run this check *first* in code (it's cheap), but keep the reported reason name.

  `corridor` = all accepted connection corridors. `summary.edgeTiers` keys are `${from}>${to}`.
- [ ] **Step 4: Run the tests.** Expected: PASS. Add a timing assertion: `validateCourse` on `baseFixture()` finishes within 50 ms (`performance.now()`). Record the actual time in the commit body.
- [ ] **Step 5: Commit.** `feat(game): validate traversal courses with named rejections`

### Task 7: World integration, final replay, availability parity, landing exclusion

**Files:**
- Modify: `lib/game/world.ts` (`attempt` tail, `buildWorld` cache key, envelope), `lib/game/interaction.ts:74-83`
- Test: `tests/game/world.test.ts`, `tests/game/interaction.test.ts`, `tests/game/session.test.ts`

**Interfaces:**
- Consumes: `validateCourse`, `blueprints` (Tasks 5–6); `replay` (Task 4).
- Produces:

```ts
export function routeEnvelope(surfaces: readonly Surface[], connections: readonly Connection[], tuning: Tuning): Rect[]; // extracted from attempt()
export function integrateCourses(world: World, snapshot: GeometrySnapshot, tuning: Tuning, viewportWidth: number, laneX: number): World;
```

`World.courses` is populated. `maxSurfaces` becomes the measured backbone maximum + 60: use the largest backbone surface count across the measured fixtures from Task 3, rounded up to a multiple of 10, and record it.

- [ ] **Step 1: Write the failing tests** in `world.test.ts`:

```ts
test("a synthetic band world activates its course and removes only the spanned helpers", () => {
  const f = bandWorldFixture(); // bandFixture() from courses.test.ts, extended to six sections; export it from tests/game/fixtures/band.ts
  const r = buildWorld(f.snapshot, tuning, { width: 1440, usableHeight: 700 }, 1);
  assert.ok(r.ok);
  assert.ok(r.world.courses.some((c) => c.id === "stepping-stones"));
  const summary = r.world.courses.find((c) => c.id === "stepping-stones")!;
  const lane = r.world.surfaces.find((s) => s.id === summary.entryId)!.x;
  const entryY = r.world.surfaces.find((s) => s.id === summary.entryId)!.y;
  const exitY = r.world.surfaces.find((s) => s.id === summary.exitId)!.y;
  assert.ok(!r.world.surfaces.some((s) => s.x === lane && s.y > entryY && s.y < exitY && s.id.startsWith("helper-")));
});

test("every connection of every measured world replays on the final surface set and is bidirectional", () => {
  for (const v of ["1440", "1280", "1024-overlay", "768-classic"] as const) {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    const r = buildWorld(snapshot, tuning, { width, usableHeight }, 1);
    if (!r.ok) continue;
    for (const c of r.world.connections) {
      assert.ok(replay(c, r.world.surfaces, tuning), `${v} ${c.from}>${c.to}`);
      assert.ok(r.world.connections.some((d) => d.from === c.to && d.to === c.from));
    }
  }
});

test("hero reaches every checkpoint, action ledge and course surface, and each returns to hero", () => {
  const { snapshot, width, usableHeight } = measuredHomepage("1440");
  const r = buildWorld(snapshot, tuning, { width, usableHeight }, 1);
  assert.ok(r.ok);
  const reach = (start: string, edges: Array<[string, string]>) => {
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const at = queue.shift()!;
      for (const [a, b] of edges) if (a === at && !seen.has(b)) { seen.add(b); queue.push(b); }
    }
    return seen;
  };
  const edges = r.world.connections.map((c) => [c.from, c.to] as [string, string]);
  const forward = reach(r.world.checkpoints.hero, edges);
  const backward = reach(r.world.checkpoints.hero, edges.map(([a, b]) => [b, a]));
  const required = [
    ...Object.values(r.world.checkpoints),
    ...Object.values(r.world.actionLedges),
    ...r.world.courses.flatMap((c) => c.surfaceIds),
  ];
  for (const id of required) assert.ok(forward.has(id) && backward.has(id), id);
});

test("courses never change availability", () => {
  for (const v of ["1440", "1280", "1024-overlay", "768-classic"] as const) {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    assert.equal(viewportSupportsRoute(snapshot, tuning, { width, usableHeight }, 1), viewportSupportsRouteWithoutCourses(snapshot, width, usableHeight));
  }
});

test("course worlds are deterministic", () => {
  const { snapshot, width, usableHeight } = measuredHomepage("1440");
  const a = buildWorld(snapshot, tuning, { width, usableHeight }, 11);
  const b = buildWorld(structuredClone({ ...snapshot, elements: undefined }) as unknown as GeometrySnapshot, tuning, { width, usableHeight }, 12);
  assert.ok(a.ok && b.ok);
  assert.deepEqual({ ...a.world, version: 0 }, { ...b.world, version: 0 });
});

test("no course ledge is a checkpoint and checkpoint ids are unchanged", () => {
  const { snapshot, width, usableHeight } = measuredHomepage("1440");
  const withCourses = buildWorld(snapshot, tuning, { width, usableHeight }, 1);
  const backbone = buildWorld(snapshot, tuning, { width, usableHeight }, 1, { courses: false });
  assert.ok(withCourses.ok && backbone.ok);
  assert.deepEqual(withCourses.world.checkpoints, backbone.world.checkpoints);
  const courseIds = new Set(withCourses.world.courses.flatMap((c) => c.surfaceIds));
  assert.ok(withCourses.world.surfaces.every((s) => !(courseIds.has(s.id) && s.checkpoint)));
});
```

(The deterministic test clones the snapshot. `elements` is a `Map` of DOM nodes and is empty in fixtures; restore it as `new Map()` after cloning if TypeScript requires it.)

`viewportSupportsRouteWithoutCourses` is a test helper. It calls `buildWorld` with an exported test seam `buildWorld(..., { courses: false })`: add an optional fifth parameter `options: { courses?: boolean } = {}`, include it in the cache key, and default it to `true`.

- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement `integrateCourses`:**
  - For each blueprint in order, call `validateCourse` against the current world. On success:
    - remove `removedIds` and every connection touching them;
    - add the course surfaces and connections;
    - push `corridor` into `acceptedCourseRects`;
    - append the summary.
  - Then **final replay:** every connection must pass `replay` on the final surface set. While any fails, remove the last accepted course (restore its removed helpers and connections from the backbone world) and replay again.
  - Recompute `envelope` via `routeEnvelope`, and re-run today's reachability check (every checkpoint, action ledge, and target ledge visited from Hero). If it fails, return the backbone world unchanged.
  - Call it at the end of a successful `attempt()`, only when `options.courses !== false`.
  - Add `snapshot.keepouts` and `options` to the cache key.
- [ ] **Step 4: Run the tests.** The Task 7 tests pass, and all earlier tests stay green, including the measured 768/1024/1440 route tests and "Contact arrival before Projects has revealed".
- [ ] **Step 5: Parity over reveal states.** Add a test: for the 1440 fixture, a snapshot with every `surfaces`/`targets`/`actionRows` reverted to "pending" (use `plannedTargets` with `enabled: false`, and empty `surfaces`) yields the same `courses` ids as the settled one, or the build fails as `"layout"` exactly as today. Run it: PASS.
- [ ] **Step 6: Planned vs settled parity.** Assert that `integrateCourses` output is identical when `snapshot.surfaces` equals `plannedSurfaces` and when it is empty (isolation makes courses independent of DOM surfaces). Run it: PASS.
- [ ] **Step 7: Regression for Review Focus 1** in `session.test.ts`: body grounded on `course-grid-run-u2` in world A; world B = the same snapshot without that course. Expect `restoreSupport(body, A.surfaces, B.surfaces, B.obstacles, width)` to be `null`, so the session falls back to `spawn(checkpoint)`. Also cover the existing session path that stages at the checkpoint while paused (use the existing `transition` events: `PAUSE layout` → `VALIDATED true` → still `paused`, with no auto-resume).
- [ ] **Step 8: Review Focus 2.** In `destinationLanding`, exclude any surface id in `world.courses.flatMap((c) => c.surfaceIds)`. Test in `interaction.test.ts`: a world whose only in-section non-checkpoint helper is a course ledge, and whose checkpoint is invalid, returns `null`. Run the tests: PASS.
- [ ] **Step 9: Run the full suite,** then tsc and lint. Commit: `feat(game): integrate validated traversal courses into the route`

### Task 8: Tune the six blueprints against measured fixtures

**Files:**
- Modify: `lib/game/courses.ts` (`blueprints` numbers only), `tests/game/courses.test.ts`, `docs/game-mode-validation.md`

- [ ] **Step 1: Write a per-viewport expectation test** (it fails until the tuning is done):

```ts
test("measured 1440 and 1280 worlds activate all six courses", () => {
  for (const v of ["1440", "1280"] as const) {
    const { snapshot, width, usableHeight } = measuredHomepage(v);
    const r = buildWorld(snapshot, tuning, { width, usableHeight }, 1);
    assert.ok(r.ok);
    assert.deepEqual(r.world.courses.map((c) => c.id), ["launch-pad", "stepping-stones", "grid-run", "precision-ledges", "timeline-rungs", "cool-down"]);
    for (const c of r.world.courses.filter((c) => c.tier === "challenge"))
      assert.ok(Object.values(c.edgeTiers).includes("challenge"), `${v} ${c.id} is not actually challenging`);
  }
});
```

At 1440 and 1280, all six courses are active, with computed tiers equal to their declared tier for at least one edge in each challenge course. That guarantees challenge courses are actually challenging, not only permitted to be. At 1024-overlay and 768-classic, write the actually measured list after tuning.
- [ ] **Step 2: Iterate.** For any course rejected at 1440 or 1280, print its `reason` via a temporary test log and adjust only that blueprint's offsets and widths, staying within the tier table. Never loosen tier rules, clearance, or isolation to make a course pass. If a course cannot pass within its tier at 1440 or 1280, **stop and report** the rejection reason and the measured zone to the user.
- [ ] **Step 3: Check the difficulty mix.** Log each edge's `timingWindow.frames` for the challenge courses. Each challenge course needs 1–3 edges in `[12, 24)` frames and a rest ledge between them. Record the per-edge windows in the validation doc.
- [ ] **Step 4: Run the full suite.** It passes. Commit: `feat(game): tune traversal course blueprints to measured layouts`

### Task 9: Drafted-ledge presentation by tier

**Files:**
- Modify: `components/game/game-view.tsx:163-171`, `components/game/game-mode.module.css:.platform`

**Interfaces:**
- Consumes: `World.courses[].surfaceIds`, `catchIds`, `tier`.

- [ ] **Step 1: Pick the style per ledge.** Compute `ledgeKind(surface.id): "base" | "challenge" | "catch"` from `world.courses` (a `useMemo` keyed on `world`). Render `<div className={styles.platform} data-kind={kind} …/>`.
- [ ] **Step 2: Add the CSS:**

```css
.platform {
  position: absolute;
  height: 2px;
  background: var(--accent);
}
.platform::before,
.platform::after { /* end ticks, below the line only */
  content: "";
  position: absolute;
  top: 2px;
  width: 1px;
  height: 6px;
  background: currentColor;
  color: var(--accent);
}
.platform::before { left: 0; }
.platform::after { right: 0; }
.platform[data-kind="challenge"] {
  background: var(--accent-strong);
}
.platform[data-kind="challenge"]::before {
  width: 100%;
  height: 5px;
  background: repeating-linear-gradient(135deg, var(--accent-strong) 0 1px, transparent 1px 5px);
}
.platform[data-kind="catch"] {
  background: repeating-linear-gradient(90deg, var(--foreground-muted) 0 8px, transparent 8px 14px);
}
```

- [ ] **Step 3: Check contrast.** In the browser, for both themes, compute the contrast of `--accent`, `--accent-strong`, and `--foreground-muted` against `--background` and assert ≥ 3:1. Record the values. If any fails, choose a different existing token. Never add a new color.
- [ ] **Step 4: Screenshot review.** Take screenshots of each active course at 1440 in both themes. Check that no ledge, tick, or standing avatar overlaps readable text, links, buttons, or form fields. Store them in `.superpowers/sdd/game-mode-traversal/`.
- [ ] **Step 5: Run tsc, lint, and the tests. Commit:** `feat(game): draw course ledges as blueprint drafted ledges`

### Task 10: Real-browser acceptance and validation record

**Files:**
- Modify: `docs/game-mode-validation.md`, and only the files implicated by a demonstrated failure (each fix gets a regression test).

- [ ] **Step 1: Run the full command set.** `npm run test:game`, `npx tsc --noEmit --incremental false`, `npm run lint`, `npm run build`, `git diff --check`. Record the exact counts.
- [ ] **Step 2: Browser matrix.** Use headless Chrome via CDP with trusted `Input.dispatchKeyEvent` down/repeat/up, following the method in the validation doc. Record the *observed* result for each case; never a predicted one:

| Case | Evidence |
|---|---|
| Forward Hero→Contact at 1440 and 1024-overlay | Every active course traversed; six checkpoints reached in order; exactly one green flag |
| Reverse Contact→Hero at 1440 | Every active course climbed back; no dead end |
| 1280×800 forward | All six courses active and traversed |
| 768-classic | Game Mode available exactly as before; active course list matches Task 8 |
| Missed challenge jumps | Each challenge edge deliberately under- and over-shot: lands on the catch floor, no teleport, back to the challenge start in ≤ 2 easy edges |
| Deliberate escape | Walking out past a band's catch floor → checkpoint recovery, input cleared |
| Held input | Held Space over a challenge ledge = one jump; held arrows move 240 px/s |
| Resize on a course ledge | 1440→1100 while standing on a ledge: pause, safe restore or checkpoint staging, no auto-resume, Resume works |
| Reveal/hover | Hovering the cards above a band doesn't invalidate; reveal starts pause as before |
| Navigation | View Work / Contact destination landings on checkpoints; Case Study cleanup; external links pause on blur |
| Themes | Ledges and avatar readable in dark and light; contrast values recorded |
| Entry hover | Task 1 Step 6 checks repeated on the final build |

- [ ] **Step 3: Record everything** in `docs/game-mode-validation.md`: final blueprint values, per-viewport active courses, per-edge windows, `maxSurfaces`, build timings, the screenshots list, and every unverified case, stated honestly.
- [ ] **Step 4: Commit.** `docs(game): record traversal course validation`. Don't push.

---

## Existing validation to re-run (regression surface)

| Existing check | Why it could break | Where re-run |
|---|---|---|
| `tests/game/world.test.ts`: measured 768/1024/1440 routes, "Contact arrival before Projects has revealed", narrow gutters, subpixel edge, action-row terraces | `witness` move, `attempt` tail, cache key, `maxSurfaces` | Tasks 4, 7 (every run) |
| `viewportSupportsRoute` tests (unsupported 32 px-gutter 768; transient reveal never unsupported) | `buildWorld` options and courses | Task 7 parity test |
| `tests/game/geometry.test.ts`, `geometry-world.test.ts` (planned vs settled, pending cards non-collidable) | New registration selector | Task 2 |
| `tests/game/interaction.test.ts`: destination landing/fallback | Landing exclusion | Task 7 |
| `tests/game/session.test.ts`: `restoreSupport`, no auto-resume | Surfaces disappearing | Task 7 |
| Browser: full journeys, escape recovery, held input, manual browsing pause, reveal pause, resize pause, "Larger window required" at 768/1023 overlay, production chunk loading only after Continue | Everything | Task 10 |

## Spec coverage

| Spec section | Tasks |
|---|---|
| §3.1 approach, fallback | 7 |
| §3.2 zones, keep-outs | 2, 3, 5 |
| §3.3 per-section plan | 5, 8 |
| §3.4 measured difficulty, rhythm | 4, 5, 6, 8 |
| §3.5 catch, recovery, landing exclusion | 6, 7, 10 |
| §3.6 feasibility checks 1–9 | 6 (1–6), 7 (7–9) |
| §3.7 visual integration, contrast | 9 |
| §3.8 acceptance | 7, 8, 10 |
| §4 entry hover | 1 |
| §6 amendments (docs) | 1 (CLAUDE/AGENTS), design doc already records the rest |

## Review gate

This plan is complete for review. Blueprint numbers and tier floors are provisional starting points. Tasks 3 and 8 contain explicit stop-and-report gates if the measured layout can't host the planned courses without loosening a rule. No code, tests, builds, or browser checks were run while planning.
