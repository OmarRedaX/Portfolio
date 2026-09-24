# Game Mode — traversal courses and entry hover (ticket + design)

Date: 2026-09-24
Status: Approved by the user on 2026-09-24 (hard sections on the main path; both exceptions approved; the CTA exception is strictly scoped to this one button).
Existing project: `E:\Full Stack Projects\Portfoliio`, branch `codex/game-mode` (baseline `1f4030b`)
Builds on: [Approved Game Mode design](./game-mode-design.md) (the "base design") and [its implementation plan](./game-mode-implementation-plan.md). Every rule in the base design still applies unless §6 of this document explicitly amends it.

## 1. Ticket

**GM-T1 — Traversal courses.** Add deterministic platforming "courses" in selected places on the homepage, so Game Mode plays like a platformer rather than a walk down one side margin. Most of it stays comfortable. There are a few easy jumps and exactly two noticeably harder sections. There are no lives or game over, recovery is clear, and content, links, and responsive layout are fully preserved.

**GM-T2 — Game Mode entry hover.** Give the Hero **Game Mode** button a deliberate, professional "entering a game" engaged state for hover and keyboard focus. It must work with reduced motion and remain accessible.

The two tickets are independent. GM-T2 is small and can ship first.

## 2. Current state (source inspection, 2026-09-24)

- `lib/game/world.ts#buildWorld` builds one **backbone** route: named knots (six checkpoints, action rows) on a single gutter lane, evenly spaced helper knots (≤ `min(112, apex − 24)` px apart), and action-row terraces that reach existing links. Every edge is proved in both directions with the production `step()` against the full collision set. Failure fails closed. `viewportSupportsRoute` gates availability on the same builder.
- Tuning is fixed: body 24×32, speed 240 px/s, gravity 1100, jump 580 → simulated apex ≈150.5 px, flight to the same level ≈1.05 s (≈250 px of horizontal reach). Physics is one-way, with no drop-through.
- Registered DOM surfaces (Tech Stack card tops, project card wrappers) are collidable only once settled. They are not part of the required route.
- `data-game-obstacle` covers Hero copy, About narrative, Experience entries, and the Contact form. Tech Stack and project cards are **not** obstacles, and adding them would break the existing project terraces.
- Section spacing: `--space-section: clamp(4rem, 10vw, 8rem)` top and bottom. The band between two sections is therefore ≈154 px at 768 px, ≈205 px at 1024 px, and ≈256 px at ≥1280 px, spanning the full content width with no readable content. These are the largest free areas on the page. The values are estimates from CSS; Task A1 measures them.
- Support decision (2026-09-24): keep the 24 px avatar and the no-overlap rule. Viewports that can't host the route show **Larger window required**. This work must not reverse that decision or reduce where Game Mode is available.
- Entry button: `components/game/game-entry.tsx`, `btn btn-secondary` plus `styles.trigger`. It sits inside the Hero action row, which is also the Hero checkpoint anchor and the `hero-actions` action row. Today its hover changes border and text color only.

## 3. GM-T1 design — traversal courses

### 3.1 Approach (chosen)

The course is an **authored blueprint compiled against measured zones, validated with the existing witness machinery, with per-course fallback to the backbone.**

- A *course* is a small, authored, per-section blueprint of helper ledges. Positions are relative to a measured free *zone* and snapped to the content grid. Nothing is a hard-coded page coordinate.
- The backbone is built exactly as today first. Courses are then added one at a time in fixed order. An accepted course runs from an *entry* surface (the last remaining lane surface above its zone) to an *exit* surface (the first remaining lane surface below it) and **replaces** the backbone `helper-*` surfaces between them, so the course is on the route, not a bypass.
- A course that fails any check at the current viewport is dropped, and that span keeps today's backbone. Courses can only add to a world that is already valid. They can never make a viewport unsupported or fail a world that validates today.

Rejected alternatives:

- **Procedural generator** that fills any free space to hit a difficulty target. It's less intentional, harder to review, looks generic, and makes difficulty drift with viewport.
- **DOM-only platforms** (make card tops and divider lines the route). That couples required paths to reveal state, the bug class fixed in `ff0e24e`. It also puts the avatar on cards over readable text and gives little control over gaps and difficulty.

### 3.2 Zones: where courses may live

A zone is a measured, content-free rectangle. Courses never leave their zones.

| Zone kind | Definition (all measured, transform-normalized) |
|---|---|
| **Band** | Between two consecutive sections. Top: the lowest keep-out bottom of section N plus clearance. Bottom: section N+1's heading anchor minus clearance. X: from the backbone lane to the far content edge. |
| **Hero floor** | Inside Hero, below the Hero action row and above the Hero bottom border. X: from content left to the right content edge. Hero text, CTAs, and the entry button are keep-outs. The decorative BlueprintGrid/CodeMotif are not. |
| **Gutter column** | Between the viewport edge (or classic scrollbar edge) and content left, over a section's vertical span. Only usable when it is at least two avatar lanes wide (≈ ≥ 104 px; measured). |

**Keep-outs.** Everything a course must clear by a *visual clearance* of 12 px (provisional) for the whole body on every simulated frame:

- existing obstacles, action rows, targets, and section heading anchors;
- a new, course-only `data-game-keepout` registration on readable or interactive blocks that aren't obstacles today: Tech Stack cards, project cards (whole card boxes), the About education/languages row, the Contact column, and the Contact form.

Keep-outs do **not** feed the backbone's exclusions, so today's terraces and route are unchanged. Keep-outs use the same transform-normalized measurement as other registrations. Card hover lift and reveal offsets never move them.

### 3.3 Per-section plan

Each section gets a treatment chosen for its layout rather than one repeated pattern.

| # | Section → zone | Course | Pattern and intent | Tier |
|---|---|---|---|---|
| 1 | Hero → hero floor, then Hero→About band | **Launch pad** | The spawn terrace widens into two broad descending steps away from the CTAs, then one short hop. A walk-off drops into the band and continues to the About checkpoint. Teaches walk, jump, and drop. No gap > 48 px. | comfortable |
| 2 | About → About→Tech band | **Stepping stones** | A switchback: an upper row of 3–4 medium ledges (64–96 px) runs away from the lane, drops at the far end, and a lower row returns to the Tech Stack checkpoint. Gaps ≤ 96 px. | easy |
| 3 | Tech Stack → Tech→Projects band | **Grid run** (challenge 1) | Upper-row ledge edges align with the two-column card grid above. Gaps widen along the row (easy → challenge) and end on a wide rest ledge. The lower return row doubles as the catch floor under the whole run. | challenge |
| 4 | Projects → Projects→Experience band | **Precision ledges** (challenge 2) | Narrow ledges (40–48 px), one running-jump rise, and a rest ledge between challenge jumps. The catch floor spans the full challenge row. Stays clear of the project action terraces above. | challenge |
| 5 | Experience → gutter column beside the timeline | **Timeline rungs** | A zig-zag between two gutter lanes, with rung heights aligned to the top of each timeline entry (visually echoing the `border-l` rail). Replaces the backbone ladder over Experience. Needs a ≥ 2-lane gutter (≈ ≥ 1280 px wide), otherwise backbone. | medium |
| 6 | Experience→Contact band | **Cool-down** | One wide landing and one easy hop down to the Contact checkpoint. Nothing near the Contact links or form. Contact itself gets no new surfaces. | comfortable |

Balance: 2 comfortable, 1 easy, 1 medium, 2 challenge. The backbone, checkpoints, action terraces, and Contact stay as they are, so most traversal remains comfortable.

The pattern parameters live in the blueprint as **pixel offsets**: x is measured from the zone's lane-side edge (mirrored when the lane is on the right), and y from the zone's top or bottom. Widths are also in pixels. A zone too small for its blueprint rejects the course, so gaps never stretch with viewport width and difficulty stays constant. Final values are **tuned against measured fixtures** (plan Task 8), in the same way the base design treats exact placements as measured outputs.

### 3.4 Difficulty is measured, not declared

Each blueprint declares an *intended* tier. The validator *computes* each edge's difficulty and rejects the course if any edge is harder than its tier allows.

- **Timing window:** for every jump edge in each direction, sweep the jump-press frame (and departure x) around the witness and count the contiguous successful frames at the fixed 1/120 s step. Walk and walk-off edges count as comfortable.
- Provisional floors (tuned in play, with any change recorded in the validation doc):

| Tier | Min timing window | Min landing ledge width | Max gap / rise |
|---|---|---|---|
| comfortable | ≥ 36 frames (300 ms) or walk/drop | ≥ 96 px | gap ≤ 48 px, rise ≤ 48 px |
| easy | ≥ 24 frames (200 ms) | ≥ 64 px | gap ≤ 96 px, rise ≤ 80 px |
| medium | ≥ 18 frames (150 ms) | ≥ 48 px | gap ≤ 128 px, rise ≤ 96 px |
| challenge | ≥ 12 frames (100 ms), never frame-perfect | ≥ 40 px | gap ≤ 176 px, rise ≤ 112 px |

- **Rhythm:** no two challenge edges in a row without a rest ledge (≥ 96 px) between them, at most 3 challenge edges per challenge course, and at most 2 challenge courses in the world.

### 3.5 Falling and recovery

- **Missed jumps are caught.** For challenge (and medium) edges, every *failing* variant from the timing sweep must land on a course or backbone surface. From that landing, the start of the challenge must be reachable in at most 2 comfortable or easy edges. An ordinary miss never triggers a checkpoint teleport.
- **Deliberately leaving the course** (walking out of the zone past the catch floor) is unchanged: `outsidePlayablePath` → recovery to the active checkpoint. Course corridors and catch landings are added to the envelope.
- There are no lives, health, score, penalties, or game over. Checkpoints stay one per section, so course ledges are never checkpoints. The green-flag rule is unchanged.
- Same-page destination fallback (`destinationLanding`) never chooses a course ledge. It stays with checkpoints and backbone helpers.

### 3.6 Route feasibility: how every new surface is validated

Every course surface and edge must pass all of the checks below in the same `buildWorld` call that produces the live world. A failure drops only that course.

1. **Placement:** inside the course's zone and the viewport. The standing body clears keep-outs (12 px), obstacles, action rows, targets, and heading anchors. Width meets its tier. Edges snap to the content grid (content edges, grid column edges, or 8 px steps from content left).
2. **Isolation:** the replaced span contains only backbone `helper-*` surfaces, never a checkpoint, action knot, or branch/terrace surface. The course's expanded corridors don't intersect any registered DOM surface's landing line, any action terrace, backbone surfaces outside the replaced span, or another course. This makes course validity independent of reveal state.
3. **Bidirectional witnesses:** every course edge, plus entry↔course and course↔exit edges, is witnessed in **both** directions with production `step()` against the **final** full surface set (backbone + all accepted courses + settled DOM surfaces). This is the base design's rule, kept as it is.
4. **Timing windows and tiers** per §3.4, in both directions.
5. **Catch coverage** per §3.5.
6. **Graph:** every course surface is reachable from Hero, and Hero is reachable from it (forward plus reverse search over witnessed edges). There are no dead-end ledges. All six checkpoints, action ledges, and target ledges stay reachable.
7. **Final re-verification:** after all courses are accepted, *every* world connection (backbone included) is replayed against the final surface set. If anything fails, courses are removed in reverse acceptance order until the world passes. That end state is always today's backbone.
8. **Determinism and budget:** the same snapshot gives a deep-equal world. The course surface total is ≤ 60, and `maxSurfaces` is raised only by the measured requirement. The sweep work is bounded (fixed frame offsets, witness cap of 180 frames). Build time is recorded for the measured fixtures.
9. **Availability parity:** for every measured fixture, `viewportSupportsRoute` gives the same result with and without courses.

### 3.7 Visual integration

All game ledges become blueprint "drafted ledges": a 2 px line with small end ticks drawn *below* the line, so the ticks never read as collision. The backbone restyles to match.

| Kind | Style |
|---|---|
| Backbone, comfortable, easy, medium | `--accent` line with end ticks |
| Challenge | `--accent-strong` line with short hatching below (a section-cut motif) |
| Catch floor | dashed `--foreground-muted` line (a "safety line") |

- The styling uses tokens only, matches the existing blueprint vocabulary, and renders only in the aria-hidden, `pointer-events: none` world layer. It never intercepts clicks, and it exists only during Game Mode.
- Ledges may overlap the decorative Hero background but never readable text.
- Non-text contrast is ≥ 3:1 against the page background in both themes.

### 3.8 Acceptance criteria (GM-T1)

1. At **1440×900** and **1280×800**, all six courses validate and are active. At **1024×900** (overlay scrollbars) and **768×900** (classic scrollbar), the courses that fit are active. Which ones is a measured, recorded result, and Game Mode availability is identical to today at every width.
2. All §3.6 checks hold. Unit tests cover each check and at least one failing case per check.
3. The complete forward (Hero → Contact) and reverse journeys are played through every active course at 1440 and 1024 in a real browser with trusted, held key input. Every checkpoint is reached and there is exactly one green flag.
4. Deliberately missing each challenge jump lands on the catch floor with no teleport. Walking out of a course triggers normal checkpoint recovery.
5. No course ledge, standing avatar, or witness corridor overlaps readable text, links, buttons, or form fields in either theme. This is checked visually with screenshots of each course.
6. Hover, reveal, resize, and font load behave as today: pause before geometry changes, preserve safe footing or recover, never auto-resume. A resize that switches a course between active and inactive while the avatar stands on it pauses and restores safely.
7. Existing tests, the measured 768/1024/1440 route tests, `tsc`, `lint`, and `build` all pass. Existing target activation and same-page navigation still work.
8. No physics or tuning change, no new dependency, no per-session randomness, no drop-through, and no new copy beyond what's listed here.

## 4. GM-T2 design — "step into play" entry hover

### 4.1 Concept (chosen): the button becomes a platform

On engagement, the button reads as a game platform that the Game Mode character steps onto. It ties directly to the actual game and doesn't rely on generic "tilt" or retro tropes.

| State | Visual |
|---|---|
| Rest | Unchanged `btn btn-secondary`. |
| Engaged (`:hover` with a fine pointer, and `:focus-visible`) | 1) The face layer skews to about `skewX(-8deg)` and lifts 2 px, while the label is counter-skewed so the text stays upright and crisp. 2) A 4 px `--accent` "ledge" appears under the face, offset down and right to give depth, like the platform the avatar stands on. 3) The border and text switch to the existing secondary-hover accent. 4) The Game Mode avatar (the shared SVG, about 12×16) rises from behind the face's top edge near its right end and lands with the game's landing compression. It plays once, in about 250 ms after an 80 ms delay. |
| Pressed (`:active`) | The face drops back 2 px and the ledge compresses to 2 px, like a jump pad (`--duration-fast`). |
| Leaving | Everything reverses over `--duration-fast`. Nothing idles or loops. |
| Session active (`aria-disabled="true"`) | No engaged state. |

Durations and easing use the existing `--duration-base`/`--duration-fast` and `--ease-standard`, with no bounce or elastic curves.

Rejected alternatives:

- **3D cartridge tilt** (perspective `rotateX/Y` plus layered depth shadow): generic "tilt card", with a weaker link to the game.
- **Pixel/retro** (stepped corners, keycaps): conflicts with the base design's "no retro/cartoon visual system" rule and reads as childish.

### 4.2 Constraints and edge cases

- **Stable hit area:** transforms apply only to inner, aria-hidden visual layers. The `<button>` box, its focus ring, and the Hero action row's measured geometry (the Hero checkpoint anchor) never move, so there's no hover flicker at the edges and no layout shift.
- **Reduced motion:** no skew, lift, or avatar travel. The engaged state is only the color change, the static ledge, and the avatar in its final position, appearing without transition. This applies to the portfolio's CTA; Game Mode's own "no reduced-motion change" rule covers gameplay only.
- **Touch and no-hover devices:** hover styling sits under `@media (hover: hover) and (pointer: fine)`. Keyboard `:focus-visible` gets the same engaged state.
- **Forced colors:** the ledge and avatar are hidden, and system button colors apply.
- The accessible name ("Game Mode"), `aria-haspopup`, and eligibility states (Keyboard required, Larger window required) are unchanged. There's no new copy.
- The avatar peek (≈16 px above the face) stays within the row's existing 40 px of clearance under the value-prop paragraph and isn't clipped by the Hero's `overflow-hidden`.
- The entry stays in the eager bundle without pulling in the session chunk. The shared avatar SVG is a tiny presentational component.
- This is a **deliberate, scoped exception** to CLAUDE.md/AGENTS.md "buttons/links use color/underline transitions only". It's recorded in both files for this one trigger.

### 4.3 Acceptance criteria (GM-T2)

1. Hover and keyboard focus both show the engaged state. Pressing shows the pressed state. Leaving reverses cleanly, with no flicker when the pointer rests on the button edge.
2. Under `prefers-reduced-motion: reduce` there's no transform motion, and the static engaged state is shown.
3. Keyboard focus ring, accessible name, dialog opening, and eligibility messages are unchanged. There's no layout shift of the Hero row (identical measured rects before and after hover).
4. It looks right in both themes and in forced-colors mode, and doesn't trigger on touch-only devices.
5. It looks intentional and professional in review screenshots and a short recording, using tokens only.

## 5. Architecture placement

| Concern | Home | Notes |
|---|---|---|
| Course blueprints, zones, compilation, course validation | **new** `lib/game/courses.ts` | Pure, with no DOM access. Keeps `world.ts` (680 lines) from growing further. |
| Witness simulation, apex, timing-window sweep | **new** `lib/game/witness.ts` | Extracted from `world.ts` so the backbone and courses share one proof path. Targeted improvement, no behavior change. |
| Integrating courses into the world | `lib/game/world.ts` | Entry/exit selection, span replacement, acceptance order, final re-verification, `World.courses`, cache key. |
| Keep-out registration | `lib/game/geometry.ts` + section components | `data-game-keepout`, measured like other registrations. |
| Types | `lib/game/model.ts` | `Tier`, `CourseSummary`, `World.courses`, `GeometrySnapshot.keepouts`. |
| Ledge presentation | `components/game/game-view.tsx`, `game-mode.module.css` | Style per tier. |
| Entry hover | `components/game/game-entry.tsx`, `game-mode.module.css`, **new** `components/game/avatar-figure.tsx` | The avatar SVG is shared with `game-view.tsx`. |
| Physics, session lifecycle, scroll, input | unchanged | These may change only if a failing test proves it necessary. |

## 6. Amendments to the base design (need approval)

1. §5 "helper platforms only where needed" → intentional traversal courses are allowed in measured content-free zones, under all of §3.6.
2. §12 "per-session path variation" stays deferred. Courses are deterministic.
3. CLAUDE.md/AGENTS.md animation rule → a scoped exception for the Game Mode trigger (§4.2).

The base design's bidirectional-witness rule, one-way physics, no drop-through, one checkpoint per section, the 24 px avatar, and the viewport-support decision are all **kept unchanged**.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Courses intercept backbone or terrace witnesses | Isolation check, plus final full re-verification with reverse-order removal |
| Reveal-state coupling (the `ff0e24e` bug class) | Helpers only; corridors disjoint from DOM surfaces; normalized keep-outs |
| Lost availability at some width | Courses only add to a valid world; parity test on all fixtures |
| Difficulty drifts with viewport | Gap/rise caps in px, computed timing floors, and a tier-mismatch rejection |
| Frame-perfect or unfair jumps | ≥ 12-frame floor; catch coverage; rest ledges |
| Avatar on a ledge that disappears after a resize | Existing pause + `restoreSupport`/checkpoint recovery; new regression test |
| Longer journeys feel tedious | Fixed pixel lengths per blueprint; comfortable courses short; same-page CTAs still jump sections |
| Visual clutter, or the accent exceeding its ~20% share | Game-only layer, drafted-ledge style, ≤ 60 course surfaces, screenshot review |
| Build cost of timing sweeps | Bounded offsets; existing validation cache; timing recorded |
| Trigger hover flicker, text blur, CLS | Inner-layer transforms, counter-skewed label, rect-equality check |
