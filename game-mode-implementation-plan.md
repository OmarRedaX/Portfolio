# Portfolio Game Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task after explicit implementation approval. Steps use checkbox (`- [ ]`) syntax for tracking. Do not start execution merely because this plan exists.

**Goal:** Add the approved keyboard-only, document-space Game Mode to the existing portfolio without duplicating its content or navigation.

**Architecture:** A small homepage client entry lazily loads a session after confirmation. An isolated simulation uses stable document-space surfaces, deterministic helper connections, and route-derived recovery; ordinary page scrolling follows the avatar. The existing server-rendered homepage remains the source of content and actions.

**Tech Stack:** Existing Next.js 16.3.2, React 19.2.8, TypeScript, Tailwind CSS 4, CSS/SVG, browser APIs, and existing Framer Motion integration. No gameplay dependency. Use existing TypeScript plus Node's built-in test runner for pure logic, and real browser verification for DOM behavior.

**Spec:** [Approved Game Mode design](./game-mode-design.md). Read both documents before execution.

**Status:** Plan only; awaiting explicit implementation approval. No production files, dependencies, tests, routes, or assets have been created. Only the design and this plan are saved in this task's outputs folder.

## Global constraints

- “Minimum width: 768 CSS pixels.”
- “Minimum usable height is a measured result of rendered layout, header/controls clearance, safe spawn, and jump validation, not an arbitrary constant.”
- “Game Mode does not use `prefers-reduced-motion` to alter the approved experience.”
- “No pause reason auto-resumes.”
- “The green flag always identifies the actual recovery destination.”
- “Purely visual hover transforms do not move collision surfaces; use stable/base surfaces for those effects.”
- “Every target maps to one existing action.”
- Left/Right move, Space jumps, Enter intentionally activates the already visible selection once per press. Native focused controls retain their behavior.
- No physics, game controls, game scrolling, or game animations before Continue.
- One checkpoint per Hero, About, Tech Stack, Projects, Experience, Contact. One green active flag with a non-color mark; red means inactive, not danger.
- Deterministic one-way platforms and bidirectional connections; no engine, random generation, touch controls, combat, scores, or ending flow.
- Pause before replacing affected world geometry; preserve footing or safely recover. Layout becoming valid does not auto-resume.
- Distinguish physical path departure (recover) from leaving the homepage URL route (cleanup).
- Keep the existing portfolio architecture, content, routes, visual tokens, and normal mobile experience. No unrelated refactoring or deployment.
- Follow repository AGENTS.md, strict TypeScript, and kebab-case for new filenames. Never stage the pre-existing untracked AGENTS.md incidentally.
- No push or deployment is authorized by plan approval. Use reviewable local checkpoints during approved execution.

## Repository baseline and evidence

Repository root for every path below: `E:\Full Stack Projects\Portfoliio`. Paths in file/task tables are repository-relative. This planning pass rechecked package.json, tsconfig.json, the file inventory, and Git status: AGENTS.md was already untracked. No test suite or test script exists. Package-lock.json exists.

Execution requires a writable project checkout. This planning task can read the existing E: checkout but its current writable roots are under Documents/Codex; choose an authorized writable project environment at execution time. Do not attempt changes to the source checkout through a tool workaround.

Installed Next.js references checked: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`, `03-api-reference/02-components/link.md`, and `03-api-reference/04-functions/use-pathname.md`. Re-read applicable local docs at execution time. In particular, put `ssr: false` dynamic loading in a Client Component, not a Server Component. Keep real links responsible for navigation.

Testing choice: AGENTS.md prefers Jest when a runner is needed. Here, pure deterministic modules can be compiled with the installed TypeScript and tested with Node's built-in runner, so no new runner dependency is needed. Do not introduce Jest, a DOM simulator, or a browser automation package just for this plan. Browser tests must run in a real browser through available tools; they are necessary because simulated DOMs cannot validate layout, focus, native navigation, or scrolling.

## File and responsibility map

### New production files

| Path | Responsibility and justification |
|---|---|
| `content/game-mode.ts` | All game UI copy; follows the project's content convention |
| `components/game/game-entry.tsx` | Hero button, accessible confirmation dialog, eligibility messaging, lazy session mounting |
| `components/game/game-session.tsx` | Session orchestration, effects, pause reasons, scroll transitions, focus ownership, cleanup |
| `components/game/game-view.tsx` | Avatar SVG/poses, flags, helper platforms, controls, named hint; presentation only |
| `components/game/game-mode.module.css` | Scoped layout and animation; avoids blanket site reduced-motion rules changing gameplay visuals |
| `lib/game/model.ts` | Shared types and small tuning record |
| `lib/game/physics.ts` | Pure fixed-step movement and one-way landing |
| `lib/game/world.ts` | Pure deterministic route construction, reachability witnesses, and route envelope |
| `lib/game/geometry.ts` | DOM registration discovery, stable document measurements, layout invalidation |
| `lib/game/session.ts` | Pure lifecycle transitions, typed effects, stale-operation protection |
| `lib/game/interaction.ts` | Pure selection plus a small browser activation adapter |
| `lib/game/scroll.ts` | Follow band, scroll ownership, settlement, interruption and cancellation |

No separate keyboard framework, checkpoint service, camera service, level editor, or per-section game components. Keep basic input listeners in game-session.tsx. Split only if implementation reveals a concrete responsibility problem.

### Existing production files likely to change

| Path | Narrow change |
|---|---|
| `components/sections/Hero.tsx` | Insert client entry beside existing CTAs; add hero checkpoint/obstacle anchors and target attributes |
| `components/sections/About.tsx` | About checkpoint anchor and exclusion bounds |
| `components/sections/TechStack.tsx` | Tech Stack checkpoint; explicitly selected stable surface wrappers |
| `components/sections/Projects.tsx` | Projects checkpoint and stable card/support wrappers |
| `components/sections/ProjectCard.tsx` | Register each existing link separately; associate surfaces/ledges without duplicating metadata |
| `components/sections/Experience.tsx` | Experience checkpoint anchor and exclusion bounds |
| `components/sections/Contact.tsx` | Contact checkpoint and existing email/social link registrations; form excluded from physical obstruction |
| `components/layout/Header.tsx` | Stable header identity and menu-open marker; existing links/menu handlers unchanged |
| `components/motion/Reveal.tsx` | Reveal start/settle signaling for registered descendants while a game session exists |
| `components/motion/StaggerReveal.tsx` | Same for stagger items; preserve normal animation behavior |

`app/page.tsx`, `app/layout.tsx`, `components/layout/Footer.tsx`, route pages, ContactForm, and existing content metadata need no planned edits. The game session portals to the body from Hero and unmounts with it. Footer actions duplicate available Contact destinations and are outside the required MVP path. Header links remain ordinary UI, not physical targets; Game Mode can activate same-page actions via the hero CTAs.

### Tests, configuration, and execution evidence

- New `tests/game/{physics,world,session,interaction,scroll}.test.ts`.
- New `tsconfig.game-tests.json`; narrow changes to package.json, tsconfig.json and .gitignore for compilation and ignored test output. No package install or lockfile change expected.
- New `docs/game-mode-validation.md` during approved execution: measured viewport/platform findings, browser cases, tuning rationale, unresolved failures, and final evidence. This is a measured result, not an alternative design spec.

## Shared contracts

Define these in model.ts before consumers. Additional internal fields may be added without changing the approved product behavior.

```ts
export const sectionIds = ['hero', 'about', 'tech-stack', 'projects', 'experience', 'contact'] as const;
export type SectionId = typeof sectionIds[number];
export type Rect = { x: number; y: number; width: number; height: number };
export type Surface = { id: string; section: SectionId; x: number; y: number; width: number; checkpoint: boolean };
export type Body = Rect & { vx: number; vy: number; groundedOn: string | null };
export type Input = { direction: -1 | 0 | 1; jumpPressed: boolean };
export type Tuning = { step: number; speed: number; gravity: number; jumpSpeed: number; bodyWidth: number; bodyHeight: number; landingMargin: number; reachX: number; reachY: number };
export type StepResult = { body: Body; landedOn: string | null };
export type TargetBox = { id: string; label: string; order: number; rect: Rect; enabled: boolean };
export type Connection = { from: string; to: string; frames: Input[]; corridor: Rect[] };
export type World = { version: number; surfaces: Surface[]; connections: Connection[]; checkpoints: Record<SectionId, string>; obstacles: Rect[] };
export type Validation = { ok: true; world: World; minUsableHeight: number } | { ok: false; reason: 'viewport' | 'layout' };
export type PauseReason = 'browsing' | 'focus' | 'native-control' | 'menu' | 'layout';
export type ScrollOwner = 'follow' | 'destination' | 'resume' | 'recovery' | 'spawn';
```

All world values use CSS pixels; y grows downward; Body.y is its top; Surface.y is its top landing line. Target distance uses center-to-center horizontal distance after a two-dimensional reach test. Grounded bodies keep their feet at surface.y while support and horizontal overlap remain valid. Connection frames are validation witnesses, not controls that play the game automatically.

## Task 1 — establish physics and a dependency-free test loop

**Files:** Create model.ts, physics.ts, tests/game/physics.test.ts and tsconfig.game-tests.json. Modify package.json, tsconfig.json and .gitignore. Paths are from the tables above.

**Interfaces:** `step(body: Body, input: Input, surfaces: readonly Surface[], tuning: Tuning): StepResult`; `spawn(surface: Surface, tuning: Tuning): Body`. Both are pure; no DOM or clock reads.

- [ ] Recheck Git state and local guidance; preserve unrelated changes. Read both approved documents. Establish an isolated checkout only at execution time if needed.
- [ ] Add the compile/test command and configuration below. Exclude `.game-tests` from the app tsconfig so emitted files do not enter the Next build. Ignore `.game-tests/` in Git.

```json
{
  "compilerOptions": { "target": "ES2020", "module": "CommonJS", "moduleResolution": "node", "strict": true, "esModuleInterop": true, "skipLibCheck": true, "types": ["node"], "lib": ["ES2020", "DOM"], "rootDir": ".", "outDir": ".game-tests", "noEmitOnError": true },
  "include": ["lib/game/**/*.ts", "tests/game/**/*.ts"]
}
```

Package script: `"test:game": "tsc -p tsconfig.game-tests.json && node --test .game-tests/tests/game/*.test.js"`. Keep test imports relative. Verify the installed Node accepts the emitted test glob; if necessary pass the five emitted test paths explicitly rather than adding a runner.

- [ ] Write the concrete crossing regression first; run `npm run test:game` and confirm it fails because the module does not exist.

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { step } from '../../lib/game/physics';
import type { Body, Surface, Tuning } from '../../lib/game/model';
const tuning: Tuning = { step: 1 / 120, speed: 240, gravity: 1400, jumpSpeed: 560, bodyWidth: 24, bodyHeight: 32, landingMargin: 4, reachX: 32, reachY: 40 };
const floor: Surface = { id: 'hero', section: 'hero', x: 0, y: 100, width: 120, checkpoint: true };
test('descending feet crossing lands exactly on the top', () => {
  const body: Body = { x: 20, y: 67, width: 24, height: 32, vx: 0, vy: 240, groundedOn: null };
  const result = step(body, { direction: 0, jumpPressed: false }, [floor], tuning);
  assert.equal(result.body.y + result.body.height, 100);
  assert.equal(result.body.vy, 0);
  assert.equal(result.landedOn, 'hero');
});
test('side contact below the top does not snap', () => {
  const body: Body = { x: -25, y: 90, width: 24, height: 32, vx: 0, vy: 20, groundedOn: null };
  assert.equal(step(body, { direction: 1, jumpPressed: false }, [floor], tuning).landedOn, null);
});
```

- [ ] Implement horizontal motion and semi-implicit gravity at a fixed step. For each descending crossing, calculate crossing fraction and horizontal overlap at that time; choose the first crossed top, stable surface order for ties. Keep supported bodies stable and process jump only from grounded state. Walking clear of support resumes gravity. No wall/ceiling collision.

```ts
const fraction = (surface.y - previousBottom) / (nextBottom - previousBottom);
const crossingX = previousX + (nextX - previousX) * fraction;
const overlaps = crossingX < surface.x + surface.width && crossingX + body.width > surface.x;
// Accept only descending, previousBottom <= surface.y, nextBottom >= surface.y,
// fraction in [0, 1], and overlaps. Snap feet, clear vy, set groundedOn.
```

- [ ] Add fixtures for upward pass-through, two tops crossed in one step, exact edge overlap, grounded stillness, jumping once, and walking off. Feed the same fixed-step input sequence through 30/60/144Hz frame accumulation and compare final positions within one fixed step. Cap accumulated wall time after stalls; focus loss pauses rather than simulating a long catch-up fall.
- [ ] Run `npm run test:game`, `npx tsc --noEmit --incremental false`, and `npm run lint`. Record the tuning values above as provisional starting values, not validated gameplay settings. Review and commit only this task's files.

**Acceptance:** top crossings work without side snapping, tests execute without added dependencies, and simulation accepts the same input format later used by route validation.

## Task 2 — lifecycle state machine and cancellation

**Files:** Create lib/game/session.ts and tests/game/session.test.ts; extend model.ts only for shared lifecycle types.

**Interfaces:** `createSession(): SessionState`; `transition(state: SessionState, event: SessionEvent): { state: SessionState; effects: SessionEffect[] }`.

```ts
export type Phase = 'off' | 'confirming' | 'playing' | 'paused' | 'repositioning';
export type SessionState = { phase: Phase; reasons: PauseReason[]; checkpoint: string | null; operation: number; layoutValid: boolean; reposition: ScrollOwner | null };
export type SessionEvent =
  | { type: 'OPEN' } | { type: 'CONTINUE' } | { type: 'EXIT' }
  | { type: 'PAUSE'; reason: PauseReason } | { type: 'CLEAR_REASON'; reason: PauseReason }
  | { type: 'VALIDATED'; valid: boolean }
  | { type: 'RESUME' }
  | { type: 'REPOSITION'; owner: ScrollOwner }
  | { type: 'SETTLED'; operation: number }
  | { type: 'CHECKPOINT'; id: string };
export type SessionEffect = 'clear-input' | 'clear-velocity' | 'validate' | 'reposition' | 'dispose';
```

- [ ] Write this regression and run the test script to demonstrate failure:

```ts
test('clearing focus pause never resumes', () => {
  const playing = { ...createSession(), phase: 'playing' as const, layoutValid: true, checkpoint: 'hero' };
  const paused = transition(playing, { type: 'PAUSE', reason: 'focus' }).state;
  const cleared = transition(paused, { type: 'CLEAR_REASON', reason: 'focus' }).state;
  assert.equal(cleared.phase, 'paused');
  assert.equal(transition(cleared, { type: 'RESUME' }).state.phase, 'repositioning');
});
```

- [ ] Implement exhaustive event switching. OPEN only opens confirmation. CONTINUE requests validation and spawn repositioning. PAUSE invalidates the current operation token, clears input, and preserves checkpoint. CLEAR_REASON never changes phase to playing. RESUME requires zero blocking reasons and valid layout. EXIT invalidates tokens and emits disposal.
- [ ] SETTLED can play only when its operation equals the current token, phase is repositioning, reasons are empty, and layout is valid. A navigation/recovery completion arriving after focus loss cannot auto-resume. Validate and settling callbacks must also be cancellable when unmounted.
- [ ] Test stale settlement after pause/Exit, repeated pauses, layout invalidation, safe validation with no auto-resume, recovery versus exit, and checkpoint retention. Run tests and commit reviewed files.

**Acceptance:** all resume and cleanup rules are explicit rather than scattered useEffect behavior.

## Task 3 — registration and rendered geometry survey

**Files:** Create geometry.ts and docs/game-mode-validation.md. Modify the eight listed section files, Header.tsx, Reveal.tsx and StaggerReveal.tsx. No actions or URL data are added. Hero.tsx entry insertion happens in Task 7.

**Interfaces:** `readGeometry(root: HTMLElement): GeometrySnapshot`; `observeGeometry(root: HTMLElement, onDirty: () => void): () => void`. GeometrySnapshot contains `surfaces: Surface[]`, `targets: TargetBox[]`, `elements: Map<string, HTMLElement>`, `sectionBounds: Record<SectionId, Rect>`, `obstacles: Rect[]`, `headerBottom: number`, and `revealsSettled: boolean`. Add the type in model.ts; DOM references stay in this snapshot, never World.

- [ ] Start the existing dev server only during approved execution; inspect actual rendering in a real browser at 768, 1024, and 1440px widths. Measure header, control-strip allowance, hero CTAs, section anchors, card top/action rows, content clear space, and responsive reflow. Record viewport dimensions and measurements in validation.md.
- [ ] Add explicit data registrations with stable IDs derived from existing project slugs/link keys. Link destinations and existing handlers remain untouched.

```tsx
// Section anchor on existing section/container:
data-game-section="about"
// Stable surface host (untransformed parent wrapper, not the hover-lifted card):
data-game-surface="project-quick-bite-top"
// Existing ProjectCard Link/a, using its existing key and visible label:
data-game-target={`${project.slug}-${key}`}
// Non-overlap region around actual prose/CTA/form content:
data-game-obstacle="content"
```

- [ ] Treat the checkpoint marker as an anchor for placing a deliberate helper surface; do not place a checkpoint on arbitrary text. Group action-row geometry as a potential interaction ledge. Do not register form fields, Submit, theme controls, hidden mobile nav, or every element matching `.card`.
- [ ] Measure document rectangles with `rect.left + scrollX`, `rect.top + scrollY`. For hover-lifted cards use an untransformed outer host; check that wrapper insertion preserves grid stretch, padding, height, and hover appearance.
- [ ] Use reveal animation callbacks to mark relevant hosts as moving/settled and dispatch one named `portfolio:geometry-change` event only while `document.documentElement.dataset.gameMode === 'active'`. Mark start before a registered moving surface is consumed; mark completion at final geometry. Offscreen unrevealed elements can provide planned layout anchors, but cannot become active collision/interaction surfaces before settlement and validation. Do not reveal every section early or disable normal reveal animations. `revealsSettled` concerns the current playable neighborhood, not every offscreen reveal on the page; otherwise initial spawn could wait forever. Build the full planned route from stable layout hosts, then validate each newly active neighborhood before allowing play there.
- [ ] observeGeometry attaches active-session ResizeObservers to section/registered hosts and header, listens for reveal signals, resize/visualViewport resize and font loading completion, and batches invalidation. Pure hover transform changes create no route invalidation. Header gets a stable `data-game-header` and an open-state marker for its existing menu; no replacement scroll-lock behavior.
- [ ] Verify document rectangles across scrolling, stable hover support, reveal-start pause, reveal-settle notification, hidden element rejection, and observer teardown in browser. Save actual measurements and screenshots/references in validation.md. Commit after confirming normal homepage appearance is unchanged.

**Acceptance:** reliable layout anchors and action identities exist without rebuilding content or adding a giant generic DOM scanner.

## Task 4 — deterministic route builder and measured viewport safety

**Files:** Create world.ts and tests/game/world.test.ts. Modify model.ts and validation.md; geometry.ts only if survey exposes missing required anchor data.

**Interfaces:** `buildWorld(snapshot: GeometrySnapshot, tuning: Tuning, viewport: { width: number; usableHeight: number }, version: number): Validation`; `outsidePlayablePath(body: Body, world: World): boolean`.

- [ ] Write a synthetic two-section fixture with a wide gap and an obstacle; assert that buildWorld either produces witnessed connections in both directions or returns layout failure. Never pass an unproven connection.

```ts
// For every connection in a successful build:
const start = world.surfaces.find(s => s.id === connection.from)!;
let body = spawn(start, tuning);
for (const input of connection.frames) body = step(body, input, world.surfaces, tuning).body;
assert.equal(body.groundedOn, connection.to);
assert.ok(world.connections.some(edge => edge.from === connection.to && edge.to === connection.from));
```

- [ ] Place six checkpoint helper surfaces in measured clear areas near their section anchors; Hero is near its CTAs. Use avatar clearance, platform width, and readable-content exclusion rectangles. Select real surfaces only when their stable geometry contributes to this route.
- [ ] Build connections in fixed section/DOM order. Use a fixed list of candidate ledge slots in clear gutters and section gaps, with spacing bounded by actual jump reach; no random seeds. First test direct jumps, then insert deterministic intermediate helper slots. Enumerate bounded departure positions and direction/jump sequences, simulate using step(), and retain successful witnesses with safety margins. Validate jumps against the complete surface set, since intervening tops can intercept a descent. Recheck after helper insertion.
- [ ] Record the supported template choices from the rendered survey, not hard-coded page coordinates. Candidate positions derive from section bounds and content clear space. Impose a finite candidate/step budget; if exhausted return layout failure rather than building a search engine or freezing the UI. Memoize results by meaningful geometry/tuning version.
- [ ] Include reachability to every registered action ledge and return to the section checkpoint. Check witness body rectangles against readability exclusion regions where the game would obstruct existing content. Reject helpers that overlay CTAs or form fields.
- [ ] Derive a route envelope from support strips, witnessed trajectory corridors expanded by avatar clearance, and valid descent corridors to lower registered surfaces. Recovery requires leaving this envelope with no valid lower landing corridor. Do not use a global Y cutoff or offscreen status as death. Bound sideways escapes using the envelope, not solid walls.
- [ ] Compute usable-height requirement from avatar height, simulated jump apex, platform/head clearance, and measured control/header occupancy. Sweep height downward in the real browser until the route/spawn conditions fail; refine the boundary and test immediately above/below it. Record the measurement and reason in validation.md; runtime still validates the current layout rather than trusting a desktop constant.
- [ ] Test deterministic repeat builds, both directions, unsupported width, insufficient measured height, tall card, narrow gutters, unrelated lower platforms, valid natural falls, genuine escapes, and full-world interception. Retune provisional movement values only with updated route witnesses and browser measurements. Run tests and commit.

**Acceptance:** one predictable route with real simulated witnesses, six safe checkpoints, measured eligibility, and conservative route-derived recovery. If 768px cannot be made safe, record failure and revise helper placement within scope; do not silently raise the approved minimum width.

## Task 5 — target selection and existing-element activation

**Files:** Create interaction.ts and tests/game/interaction.test.ts; use existing target registrations from Task 3.

**Interfaces:** `selectTarget(body: Body, targets: readonly TargetBox[], tuning: Tuning): string | null`; `activateSelected(id: string, visibleId: string | null, body: Body, snapshot: GeometrySnapshot, tuning: Tuning): boolean`.

- [ ] Write and run failing tests for ungrounded rejection and stable horizontal ties:

```ts
test('airborne avatar never selects an action', () => {
  assert.equal(selectTarget({ x: 0, y: 0, width: 24, height: 32, vx: 0, vy: 1, groundedOn: null }, [], tuning), null);
});
// Fixture: two enabled targets at equal center distance and vertical reach,
// reverse their array order but retain order values 0 and 1: id with order 0 wins.
```

- [ ] Filter to connected, rendered, enabled targets whose rectangles are within both horizontal and vertical reach. Among candidates sort horizontal center distance then order. A document-order integer from readGeometry provides the final tie-breaker. Do not use rounding changes or array discovery order that varies frame to frame.
- [ ] Keep a separate presented selection id acknowledged after the highlight and hint have been committed and a rendering frame has passed. Enter can only activate that presented id if it still equals selectTarget on fresh geometry. While the presented view lags, Enter does nothing; it never activates the new unshown target.

```ts
if (id !== visibleId || selectTarget(body, snapshot.targets, tuning) !== id) return false;
const element = snapshot.elements.get(id);
if (!element?.isConnected || element.getClientRects().length === 0) return false;
element.click(); // synchronous inside the trusted keydown handler, not the next physics frame
return true;
```

- [ ] Use `event.repeat`/held-key tracking to enforce one Enter per physical press. Preserve user activation for `_blank` links; do not move .click() into a timer, await validation, or manually open a copied URL. Classify the real href only for lifecycle preparation. Native handlers retain control of whether navigation occurs.
- [ ] Test exact reach boundaries, stable ties, moving out of reach, stale/disconnected selection and no activation during pause/repositioning. In browser verify Quick Bite Case Study, Core Service, GitHub, and Gmail compose behave like their existing links. Do not submit the contact form during verification.
- [ ] Run logic tests and commit reviewed files.

**Acceptance:** named, visibly selected grounded targets are the only actions Enter can invoke.

## Task 6 — normal page following and cancellable scroll ownership

**Files:** Create scroll.ts and tests/game/scroll.test.ts.

**Interfaces:** `followDelta(body: Body, scrollY: number, band: { top: number; bottom: number }): number`; `createScrollCoordinator(onManual: () => void): { follow(delta: number): void; reposition(owner: Exclude<ScrollOwner, 'follow'>, destinationY: number, signal: AbortSignal): Promise<boolean>; observeNavigation(signal: AbortSignal): Promise<boolean>; dispose(): void }`.

- [ ] Test followDelta returns zero inside the viewing band and the smallest correcting delta outside it. Calculate the band from actual header/control height plus a fraction of remaining viewport height; clamp document scrolling to valid bounds. At document ends accept the nearest achievable view that keeps the avatar visible rather than waiting forever for an impossible band.

```ts
const avatarTop = body.y - scrollY;
const avatarBottom = avatarTop + body.height;
return avatarTop < band.top ? avatarTop - band.top
  : avatarBottom > band.bottom ? avatarBottom - band.bottom : 0;
```

- [ ] Follow using small immediate window.scrollBy adjustments; do not queue smooth animations every frame. Track expected scroll offset and ownership for follow operations.
- [ ] For spawn/recovery/resume, use a cancellable ordinary page reposition and wait for actual settlement: prefer scrollend plus stable offset confirmation, with a bounded stable-frame fallback where scrollend is unavailable. A timeout reports failure to the session and pauses; it never assumes successful completion.
- [ ] observeNavigation waits on existing fragment navigation, target presence, layout/reveal settlement and scroll stability; do not issue a competing scrollTo for the original link. Install observation before activating the link. Already-current hashes with no scroll must settle correctly.
- [ ] Capture manual wheel/touchpad input, relevant browsing keys outside game ownership, pointer browsing interactions, and unexpected scroll changes without preventing normal browsing. Scrollbar drag and accessibility/browser-originated scrolling can appear as unowned movement: pause conservatively. Ignore known owned offsets, but manual input always cancels current ownership. A single scroll event cannot prove intent.
- [ ] During a programmatically triggered link activation, tag only that synchronous activation so the generic native-control click observer does not misclassify it as manual browsing. Subsequent actual user input still wins.
- [ ] Test delayed owned scroll, manual interruption before settlement, stale callbacks after disposal, no-scroll same-hash navigation, and document-bottom clamps with controlled clocks/adapters. Verify wheel, trackpad, scrollbar and PageDown in a real browser.
- [ ] Run tests and commit.

**Acceptance:** auto-follow never fights browsing, and interrupted scroll operations cannot auto-resume a paused session.

## Task 7 — entry confirmation and eligibility UI

**Files:** Create content/game-mode.ts, game-entry.tsx, game-mode.module.css and a game-session.tsx shell exposing the defined props. Modify Hero.tsx only to mount GameEntry beside existing CTAs. The shell provides a cancellable preparation state without physics until Task 9 integrates gameplay; keep it compiling rather than importing a missing module. No game-session effects start before confirmation.

**Interfaces:** `GameEntry(): React.JSX.Element`; future session props `GameSession({ onExit, trigger }: { onExit: () => void; trigger: HTMLButtonElement }): React.JSX.Element`.

- [ ] Put approved modal copy, labels, instructions, pause reasons, unavailable messages and target-hint formatting into content/game-mode.ts. Keep exact Continue/Exit/Resume Game/Exit Game Mode labels.
- [ ] Add a small native `<dialog>` using showModal(), an accessible title/description, initial focus on Exit, Escape dismissal, and explicit focus restoration. Opening the dialog must not scroll the page or preload/start simulation effects. Restore native dialog side effects on cancel.

```tsx
const GameSession = dynamic(() => import('./game-session').then(m => m.GameSession), { ssr: false });
// Render only after Continue, not while the confirmation is open.
{confirmed && trigger.current && <GameSession trigger={trigger.current} onExit={exit} />}
```

- [ ] Keep the hero Server Component. Loading and session failures show a concise message and preserve normal browsing. Continue may validate before play; do not show a moving avatar until validation and spawn succeed.
- [ ] Use CSS size/capability hints for the quiet unavailable state while Off; do not mount session input/resize/animation listeners just to show the button. Recheck actual viewport at activation. Width failure takes display precedence over keyboard messaging. `any-pointer: fine` is a practical eligibility hint; do not equate touch capability with no keyboard. An actual keyboard focus/activation is positive evidence of practical keyboard input, including attached keyboards. Capability guesses never alter normal portfolio controls.
- [ ] Do not branch Game Mode on reduced-motion media queries. Game avatar pose/flag timing will use session-driven attributes/styles; if a CSS animation property is used, explicitly scope normal animation timing in this module so the existing global reduced-motion blanket cannot silently change it. No changes to existing site-wide reduced-motion rules.
- [ ] Browser-check dialog Tab/Shift+Tab containment, Escape, Continue, Exit, zoom, button wrapping at 768px, touch-oriented unavailable state and keyboard-equipped hybrid device behavior. Verify Off and cancelled entry leave zero game listeners/animation work. Commit after normal hero layout passes.

**Acceptance:** consent and safety eligibility precede every session, with no broad homepage client conversion.

## Task 8 — avatar, checkpoints and game UI presentation

**Files:** Create game-view.tsx; extend game-mode.module.css and content/game-mode.ts. No external asset files or image-generation dependency.

**Interfaces:** `GameView({ bodyRef, world, activeCheckpoint, phase, canResume, selectedLabel, onResume, onExit }: GameViewProps)`. Define GameViewProps in that file using the approved shared types; bodyRef is a React ref to Body, phase is Phase, callbacks return void, world is World, selectedLabel is string or null. Session owns a separate DOM ref for imperative position updates, passed through a view ref prop if needed; do not use React state for every simulation frame.

- [ ] Build a small inline SVG developer silhouette with hoodie, eyes, legs and fixed viewBox. Derive fills/strokes from existing theme variables. Idle stays still; run alternates two poses; vy determines rising/falling; landing briefly compresses visuals only.
- [ ] Portal one pointer-transparent absolute document layer to body. Verify it creates no document overflow/extra scroll area and is outside hero clipping. Interactive HUD uses a separate fixed layer below the measured header with pointer events enabled. Dialog and skip-link layering must remain usable.
- [ ] Render only approved helper surfaces and six flags. Red/green use new narrowly scoped checkpoint color tokens if the existing blue/neutral palette lacks them; contrast-test both themes. Red is never an error role. Active flag adds a distinct check/shape. Existing palette still supplies avatar and ordinary game chrome.
- [ ] Show exactly one highlight on the existing selected action without changing its box geometry. Position the named hint so it does not cover the target or essential content. Remove highlight on pause, airborne state, stale target, or exit.
- [ ] Display controls and Exit throughout initialized sessions; Resume is present while paused and disabled with an explanatory status until eligible. Announce start/pause/checkpoint changes via one polite status region; keep duplicate flag/helper/character visuals aria-hidden.
- [ ] Verify game rendering under both OS motion preferences produces the same approved animation set, while the portfolio's own preference handling remains unchanged. Test theme toggle, contrast, small-scale avatar readability, non-color checkpoint distinction, pointer pass-through, and no content obstruction.
- [ ] Run lint/types and commit reviewed presentation.

**Acceptance:** game presentation fits the portfolio, contains no extra game systems, and does not affect collision dimensions or native link hit areas.

## Task 9 — integrate gameplay, input and safe revalidation

**Files:** Complete the game-session.tsx shell from Task 7. Modify session.ts, geometry.ts, scroll.ts and game-view.tsx only for integration corrections; expand existing tests with discovered regressions.

**Interfaces:** consumes the exact contracts from Tasks 1–8; produces GameSession from Task 7. Session has one current World, Body, active checkpoint, presented target id, input state, and cancellable operation token. Avoid a second source of gameplay state in React.

- [ ] On confirmed mount, mark the active session, read/observe geometry, build the world, set Hero checkpoint, create body with spawn(), and reposition. If invalid, display paused/unavailable status and no physics. Preserve explicit Continue intent only until an interruption occurs.
- [ ] Install one animation loop only while Playing. Use fixed-step accumulation, consume jump requests once, update selection, write avatar transforms, and request follow scrolling. Pause cancels the gameplay loop; bounded reposition/validation work has its own abortable lifetime, not a hidden running physics loop.
- [ ] Keyboard handling is bubble-phase and respects defaultPrevented. The gameplay focus host may accept keys without role=application. Native controls and editable ancestry—including composed-path editable ancestors—are excluded. PreventDefault on owned arrows/Space/Enter only. Suppress Enter and Space repeat requests; holding Space must not cause an automatic new jump after landing. Focusin to ordinary controls pauses; the dedicated gameplay host is exempt.
- [ ] Continue/Resume transfer focus to the gameplay host with preventScroll after modal/HUD action completes. Exit restores trigger or a connected main-content fallback with preventScroll. Do not immediately pause merely because the initiating button had focus before ownership transfer.
- [ ] Blur/visibility loss, manual browse, native-control focus and menu opening dispatch PAUSE and clear input. Clearing those conditions never auto-resumes. Resume works only after blockers clear and world validation succeeds.
- [ ] On geometry invalidation, pause before replacement. Build a new version; keep Body on its old support if still safe at the corresponding base surface. Otherwise stage recovery at the active checkpoint after it validates. Preserve green checkpoint identity. Stay Paused until explicit Resume because this was a layout pause, even when recovery placement is ready.
- [ ] Natural outsidePlayablePath() failure uses Repositioning with recovery, clearing velocities/input and respawning at the active checkpoint. Valid falling/downward travel never pauses or recovers. Landing on any checkpoint changes the sole active flag; Contact has no ending logic.
- [ ] Dispose symmetrically: cancel rAF, abort reposition/validation, disconnect observers, remove listeners/highlight/data marker/portal, clear refs and pending input. Guard async completions with operation tokens and mounted status. Exit during dynamic load must also prevent a late session mount.
- [ ] Browser-check one complete forward and reverse journey, ordinary missed jumps, genuine recovery, layout change underfoot, focus loss during recovery, typing, menu interaction, interrupted Resume and repeated mount/unmount. Run pure tests, lint, types; commit.

**Acceptance:** the integrated session obeys the approved lifecycle and never takes control of normal browsing when paused/off.

## Task 10 — navigation integration and landing fallback

**Files:** Modify game-session.tsx and interaction.ts; update session/interaction tests and validation.md. No route page or href changes.

- [ ] Before synchronous activation, inspect the actual registered anchor's resolved URL and target: same-origin same-path hash is a destination transition; another path is page navigation; external/new-tab keeps existing behavior. This classification does not perform navigation. Establish scroll ownership before calling .click().
- [ ] Same-page actions enter Repositioning, clear input, pause physics/follow, invoke the real element and observe its navigation. After settlement, use the destination's explicit checkpoint landing; build a validated helper fallback within the destination only if necessary. Never choose the globally nearest surface.
- [ ] If the same-page handler cancels or causes no destination arrival, timeout into a visible paused status rather than teleporting based on a guessed URL. If the destination exists but no safe fallback is possible, exit gracefully as approved. User interruption always overrides settlement.
- [ ] Activate the checkpoint on completed safe destination landing. Resume only for the current uninterrupted Repositioning operation. A native same-page click during browsing follows normal browsing and stays paused.
- [ ] Homepage session unmount cleans up on actual route navigation. Also observe usePathname in the session as a defensive guard, without wrapping the shared app layout in game state. If navigation is cancelled and the homepage stays mounted, do not pretend departure occurred.
- [ ] External anchors remain synchronous user-activated .click() calls with original target/rel. Do not force focus loss or resume when browser focus stays in the portfolio; actual blur/visibilitychange determines focus pause. Verify a blocked popup does not freeze a navigation transition.
- [ ] Test View Work and Contact from gameplay, repeat current hash, Case Study route departure, Resume route departure, browser Back (game remains Off), existing repo/social new-tab behavior, focus return and explicit Resume. Do not send email or submit contact forms. Commit after passing checks.

**Acceptance:** game interactions use the same destinations and behaviors as the existing portfolio, with explicit safe landing and cleanup distinctions.

## Task 11 — final verification and handoff

**Files:** Update docs/game-mode-validation.md; modify only files implicated by demonstrated failures, with corresponding regression tests. No optional polish expansion.

- [ ] Run `npm run test:game`, `npx tsc --noEmit --incremental false`, `npm run lint`, and `npm run build`. Do not invoke formatter write commands on unrelated files. If baseline formatting issues exist, document them separately and check new/edited files only.
- [ ] Complete this browser matrix and record observed results, not predicted passes:

| Case | Required evidence |
|---|---|
| Off, cancelled modal | No game rAF/listeners; unchanged content, navigation and scroll |
| 767px vs 768px | Quiet size message below boundary; validated gameplay above when height permits |
| Height boundary | Measured minimum, test just below/at/above, correct usable-area calculation |
| 768/1024/1440 widths, zoom | Forward/reverse route, safe spawn, six checkpoints, no obstruction |
| Dark/light themes | Readable avatar, platforms, hints, flags and control focus |
| OS reduced motion on/off | Same Game Mode experience after modal; existing site CSS unaffected |
| Keyboard and editable controls | Owned Space does not scroll; native Enter/Space/arrows preserved elsewhere |
| Manual scroll mechanisms | Wheel, trackpad, scrollbar, PageDown pause; owned scrolling does not |
| Interrupted repositioning | Blur/scroll/resize/Exit wins; no stale automatic resume |
| Geometry | Hover leaves base collision stable; reveal/resize pauses and safely validates |
| Physics and checkpoints | No side snap, valid lower landings, true escape recovery, one green flag |
| Target activation | Exact visible selection, grounded reach, ties, no held-Enter repeat |
| Navigation | Existing hashes/routes/new tabs, destination landing, Back stays Off |
| Exit and route unmount | Complete cleanup, current scroll preserved, focus restored without jump |
| Touch-only/mobile browsing | No virtual controls, no added gesture interception or layout degradation |

- [ ] Review build output and browser performance: session chunk loads only after confirmation; no portfolio-wide render per physics tick; no forced full-document geometry read per frame; cap validator work; no retained listeners/DOM nodes across repeated exits. Compare normal homepage behavior before/after rather than inventing performance numbers.
- [ ] Review scope and spec coverage. Record final movement values, measured height criteria, deterministic placement rules, route witnesses, known browser limitations, and actual commands/results in validation.md. No failed safety condition may be labelled complete.
- [ ] Review final diff, preserve unrelated work, and create a local reviewed commit if allowed by the execution environment. Do not push, merge, or deploy. Present implementation results and any remaining limitations to the user.

## Spec-to-task coverage

| Approved design area | Implementation tasks |
|---|---|
| Existing portfolio/source of truth | 3, 5, 7, 10 |
| Consent, eligibility and exit | 2, 4, 7, 9, 11 |
| Document world and separate registrations | 1, 3, 4 |
| Stable geometry and safe revalidation | 3, 4, 9 |
| One-way physics and route-derived recovery | 1, 4, 9 |
| Six checkpoints, flags and open journey | 4, 8, 9 |
| Keyboard ownership and visible target activation | 5, 7, 9 |
| Scrolling, pause, explicit Resume and navigation | 2, 6, 9, 10 |
| Avatar, theme consistency and accessibility | 7, 8, 11 |
| Verification and performance | Each task's acceptance plus 11 |
| Deferred scope | Global constraints and final scope review |

## Review gate

This plan is complete for review. Height, clear-space placement and final physics tuning are explicitly measured execution tasks, not claimed results. No gameplay tests, browser validation, implementation commits, or builds have been run during planning.

After the user approves implementation, execute tasks in order with the executing-plans workflow. If rendered validation shows that the approved route cannot be made safe without changing scope or interaction behavior, report the concrete layout evidence and seek a targeted design decision. Do not silently add dependencies, weaken bidirectional validation, or ship unsafe eligibility.

Stop here for explicit implementation approval.
