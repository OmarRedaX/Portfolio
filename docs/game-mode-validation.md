# Game Mode rendered-layout validation

## Traversal courses: final tuning pass and local overshoot recovery (2026-09-25, Claude Code)

The user made two decisions after Task 10: keep the current spec and make one final tuning pass for the three inactive courses, and fix overshoot teleports.

### Final tuning pass: no further course can pass

The pass was a search, not a hand retune, run on the measured 1440 and 1280 fixtures with the production `validateCourse` rules: witnesses, timing windows, tiers, 12 px clearance and isolation.

- **Necessary condition, every ledge position.** A course's first ledge must link to the lane entry in both directions, and its last ledge to the lane exit, at the course's tier. For each of launch-pad, cool-down and timeline-rungs, every ledge x on the 8 px content grid was tried at every y in 2 px steps, with three widths from the tier minimum up.
- **Timeline rungs.** More than 1,300 variants: rung width 48/56/64, max rise 48–96, column gap 8–64, inset 12–40, first rung in the inner or outer column, an optional lead-in rung, and both gutter-zone definitions (the implemented keep-out span and the spec's section span).

Nothing validated. The blueprints are unchanged, and the active set is still **stepping-stones, grid-run and precision-ledges at 1440 and 1280, and none at 1024-overlay or 768-classic**. AC1 ("all six at 1440/1280") is not met. The exact reasons, measured on the fixtures:

| Course | 1440 | 1280 |
|---|---|---|
| **launch-pad** (comfortable, max rise 48) | A jump's body rises 182.5 px above its takeoff line (apex 150.5 + body 32). Clearing the Hero action row (bottom 713.02) by 12 px means every climb must take off at y ≥ 907.52. The lane entry `helper-1-1` is at 857.60, so the climb back to it is ≥ 49.92 px. A 1.92 px step up can't be walked, because the physics have no step-up. 0 ledge positions link to either end. | The Hero floor ends at 850.78, but the minimum takeoff is 697.97 + 12 + 182.5 = 892.47, so no jump fits at all. 0 positions at either end. |
| **cool-down** (comfortable) | Exit end: the exit lane ledge `helper-8-8` (5735.9) is ≥ 63.6 px below any ledge line the band allows (zone bottom 5672.3). Entry end: the minimum takeoff under the Experience keep-outs is 5621.8, which is 99.5 px below the entry `helper-8-6` (5522.3). 0 positions at either end. | Same geometry, shifted by 100 px: 0 positions. |
| **timeline-rungs** (medium) | Rung-to-rung edges can be made to prove: a 48 px column gap turns every drop into a plain walk-off. The entry link can't. With the implemented keep-out span, the spec-aligned first rung (the first timeline entry top, 5005) sits 90 px *above* the lane entry `helper-8-2` (5095), under `helper-8-1` (4988.2) and the Experience checkpoint. In every variant the descent back to the entry either lands on the second rung or climbs onto those ledges, so there's no bidirectional witness. With the spec's section span, the entry becomes the Experience checkpoint. That is precision-ledges' exit, so the two courses' corridors meet at that shared ledge, which §3.6.2 isolation forbids. | No zone: the gutter is 104.5 px, but two 48 px medium rungs, an 8 px gap and 12 px clearance need 116. |

The keep-out-span gutter zone stays as implemented. Switching to the section span doesn't make the course pass, so the change would buy nothing.

### Final whole-branch review (d52a498..HEAD)

One important issue, fixed: **ledges were invisible under forced colors**. Game ledges are painted with `background`, and forced colors replaced it with Canvas. Headless Chrome with `forced-colors: active` measured every ledge's background as `rgb(0, 0, 0)` on an `rgb(0, 0, 0)` page, so Game Mode couldn't be played in Windows High Contrast. The base design had the same defect, and Task 9 had deferred it. A `@media (forced-colors: active)` rule now keeps the ledges (`forced-color-adjust: none`) and draws them in `CanvasText`. Measured again: base, challenge and catch ledges are `rgb(255, 255, 255)` on black, and the dashed catch pattern is kept. Without forced colors the values are unchanged (#6fa8c7, #8fc0da, #a99e8d). Screenshots: `t10-forced-{active,none}-hero.png`.

Minor, not changed:
- The first `buildWorld` at 1440/1280 takes ~360–390 ms on the main thread. It runs only while play is already paused for a layout change.
- A redundant `.trigger[aria-disabled="true"]:hover` border rule, from Task 1.
- A second `visible()` call in the keep-out branch of `readGeometry`, from Task 2.

### Local recovery for course overshoots

Spec §3.5 now includes: when `outsidePlayablePath` fires after a **jump that took off from a course ledge** (catch floors included), the body returns to that ledge at its takeoff x instead of the checkpoint. **Walking** off anything, and jumps from backbone surfaces, keep checkpoint recovery. `takeoffOf(before, after)` records a takeoff only when a grounded body starts rising, and landing clears it. `courseRecovery(world, takeoff, tuning)` returns the restored body, or `null` to fall back to the checkpoint. `game-session.tsx` tracks the takeoff each physics step and clears it whenever the body is placed by validation or navigation. No physics or tuning changed.

Geometry alone couldn't fix this. The worst case, holding ← through the reverse climb from precision u1 onto the 12 px lane ledge, lands in the gutter, where the zone rules allow no course ledge. A simulation sweep also found that overshoots from a course's lane entry/exit ledges never escape, so a rule scoped to course ledges covers every case.

**Tests (RED, then GREEN).** Four new world tests:

- The precision u1 lane-climb overshoot escapes and is restored on u1 at its takeoff x, inside the playable path (1440 and 1280).
- Walking right off the grid-run catch floor escapes with no takeoff and keeps checkpoint recovery. A backbone takeoff, or a takeoff when no course is active, also returns `null`.
- `takeoffOf` records jumps only: not walk-offs, and not airborne bodies.
- A sweep over every active course edge at 1440/1280 (three takeoff x values × held arrow 0–192 frames) checks that every escape recovers onto its takeoff ledge.

With `courseRecovery` forced to `null`, the first and last tests fail. `npm run test:game`: 145 passed, 0 failed. `tsc`, `eslint` (repo sources), `npm run build` and `git diff --check`: all clean.

**Browser (headless Chrome, trusted input, temporary read-only hook, since removed):**

| Case | Result |
|---|---|
| Precision u1, ← held 140 frames through the lane climb | **Local.** `repositioning` → `playing` on `course-precision-ledges-u1` at the takeoff x (194.5). Restaged 213 px; before the fix this was 1,449 px to the Projects checkpoint. The Projects checkpoint stayed active. |
| Precision rest, → held 132 frames past the catch floor's end | **Local.** Restored on `course-precision-ledges-rest` at 612.5 (the takeoff). |
| Walking right off the grid-run catch floor | **Checkpoint, unchanged.** Respawned on the Tech Stack checkpoint. Auto-repeats of the still-held key were ignored (x stayed 124.5), and a fresh press moved again. |
| Missed challenge jumps (under/over) | Unchanged. Every variant that can reach the catch floor landed on it in `playing`, then got back in one easy or comfortable edge. |
| Journeys, 1440 and 1280, forward and reverse | **Pass.** Six checkpoints in order with one flag each, and all three active courses traversed in both directions. Forward legs had 10 and 9 reveal pauses, each resumed explicitly. The reverse legs had none. |

## Traversal courses: real-browser acceptance (2026-09-24, Claude Code)

This is Task 10 of the traversal plan, run at commit 49ebbad. No product code changed.

**Commands.** `npm run test:game`: 141 passed, 0 failed (4.3 s). `npx tsc --noEmit --incremental false`: exit 0. `npm run lint`: exit 0. `npm run build`: exit 0 in 24 s (compile 7.2 s, TypeScript 5.9 s, 13 static pages in 1.6 s). `git diff --check`: clean.

**Method.** Headless Chrome was driven over CDP with trusted `Input.dispatchKeyEvent` key-down, auto-repeat and key-up events, and trusted mouse events. The entry-hover checks and chunk counts ran on the production build (`next start`). The gameplay cases ran on the shared `next dev` server with a temporary read-only `window.__gameDebug` hook in `game-session.tsx`, which has since been removed. The hook exposed the world, body and session state.

A throwaway closed-loop driver made the journeys. It planned each edge from the standing avatar with the compiled production `step()`. Because velocity is instantaneous, the approach run doesn't matter. The driver only accepted a plan that still succeeded with ±6 px takeoff error and 2–4 frames of input latency. It then walked to the takeoff, pressed Space as a trusted key, and steered with the witness rule. Every reveal pause was resumed with a trusted click on **Resume Game**.

On this machine, headless Chrome reports `prefers-reduced-motion: reduce` by default. Motion cases therefore emulate `no-preference`.

**Active courses** are the same live and in the fixtures, and match the Task 8 table.

| Configuration | Active | `buildWorld` (first call, measured fixture) |
|---|---|---|
| 1440 (classic scrollbar) | stepping-stones, grid-run, precision-ledges | 387 ms, 97 surfaces |
| 1280×800 | stepping-stones, grid-run, precision-ledges | 363 ms, 97 surfaces |
| 1100 (after a live resize) | grid-run | not measured |
| 1024 overlay | none | 48 ms, 80 surfaces |
| 768 classic | none | 63 ms, 94 surfaces |

`maxSurfaces` is 160. The blueprints and per-edge windows are unchanged from the Task 8 section below: stepping-stones u1/u2/u3/l1, grid-run u1/u2/rest/catch(600), precision-ledges u1/p1/rest/p2/catch(680), with launch-pad, timeline-rungs and cool-down as recorded there. Tier floors are also unchanged: comfortable 36/96/48/48, easy 24/64/96/80, medium 18/48/128/96, challenge 12/40/176/112 (window frames / min width / max gap / max rise).

**Browser matrix (observed):**

| Case | Result |
|---|---|
| Forward Hero→Contact, 1440 | **Pass.** 85 edges. Checkpoints were reached in order: About, Tech Stack, Projects, Experience, Contact. Exactly one active flag at each. All three active courses were traversed along their full entry→exit chains. There were 10 reveal pauses, each resumed explicitly. |
| Forward, 1024 overlay | **Pass.** 67 edges, six checkpoints in order, one flag each. No course is active, as in Task 8. |
| Reverse Contact→Hero, 1440 | **Pass.** 62 edges. Checkpoints in reverse order, one flag each. All three courses were climbed back along their reversed chains. No dead ends and no pauses. |
| 1280×800 forward | **Partial.** Six checkpoints in order, one flag each, and all *three* active courses traversed. A reveal pause fired just before a precision-ledges takeoff; footing on `course-precision-ledges-u1` survived revalidation and the jump then landed. **"All six courses active" is not met.** AC1 is still open (see Task 8). |
| 768 classic | **Pass.** Game Mode is available and plays: forward journey complete, six checkpoints, one flag each. No active courses, matching Task 8. |
| Missed challenge jumps, 1440 | **Pass for the four row-to-rest edges (grid-run and precision-ledges, u2/p1 → rest and back).** Each under- and over-shot landed on the course's catch floor. The phase stayed `playing` and the largest movement between polls was 13.2 px (no teleport). The avatar was then driven back to the course's u1 ledge (an approach-side chain ledge) in one easy (grid-run) or comfortable (precision) edge. A forward overshoot of u2→rest or p1→rest is physically impossible: the longest jump still lands on the rest ledge. **Gap: see "Hold-through overshoots" below.** |
| Deliberate escape | **Pass.** Walking right off the grid-run catch floor left the course. The avatar was respawned on the active Tech Stack checkpoint and stayed in `playing`. While the key was still held, further auto-repeat events didn't move it (x stayed 124.5). A fresh press moved it again. |
| Held input | **Pass.** 2.5 s of held Space with auto-repeat on grid-run u2 (a challenge ledge) gave one jump, landing back on u2 with scrollY unchanged. Held → measured 239.1 px/s. |
| Resize on a course ledge | **Pass.** Standing on stepping-stones u2 at 1440, the window was resized to 1100. Play paused as **Game Mode paused.** The ledge no longer exists at 1100 (only grid-run is active there), so the avatar was restaged on the About checkpoint. Still paused 4 s later (no auto-resume). **Resume Game** was enabled and returned to `playing`, and ← then moved the avatar. |
| Reveal/hover | **Pass.** A pointer sweep across the Tech Stack cards above grid-run, and across the project cards (hover lift) above precision-ledges, left the world version unchanged. Play continued on the course ledge. Reveal starts still pause as before; every journey above shows them. |
| Navigation | **Pass.** View Work (hint "Press Enter · View Work") went to `#projects` and landed on the Projects checkpoint with one flag. Hero Contact went to `#contact` and landed on the Contact checkpoint with one flag. Quick Bite Case Study went to `/work/quick-bite` and removed the game DOM and the `data-game-mode` marker. Core Service (`target="_blank"`) opened a real GitHub tab and the portfolio paused as **Paused while the page is out of focus.** After that tab closed it showed **Game Mode paused.**, with no auto-resume. |
| Themes | **Pass.** The live world rendered 66 base, 7 challenge and 2 catch ledges. Contrast against the page background, dark / light: base `--accent` 7.53 / 6.63, challenge `--accent-strong` 9.97 / 10.39, catch `--foreground-muted` 7.40 / 5.39. The avatar's hoodie uses `--accent` (same values) and its face and legs `--foreground` (16.74 / 16.29). |
| Entry hover (production build) | **Pass in both themes.** The trigger and `hero-actions` rects were identical before hover, during hover and after 400 ms. When engaged, the `::before` transform was `matrix(1, 0, -0.1405, 1, 0, -2)` and peek opacity was 1. With reduced motion the transform was `none` and peek opacity 1. With forced colors the peek was `display: none`. Resting on the top-left edge for 2 s gave 0 `mouseover`/`mouseout` and `:hover` held throughout. Tabbing showed the engaged state with focus-visible, an unskewed 2 px solid outline, and a button transform of `none`; Enter opened the dialog. During a session the trigger is `aria-disabled` and hover isn't engaged (`none`, peek 0). |

**Regression surface also re-run.** Production chunks: 10 before consent, 10 with the dialog open, 11 after Continue. With overlay scrollbars at 768 and 1023, Continue ended at **Larger window required**, with no HUD, the marker cleared, and focus on the trigger. At 1440, a wheel event and PageDown each paused without auto-resume, and Resume returned to play.

**Hold-through overshoots (resolved 2026-09-25 by local recovery; see the section above).** The §3.5 catch check in `validateCourse` covers the timing sweep's failing presses, and those always steer onto the target after the press. A player who instead keeps holding the arrow past the target can leave the course. This was measured exhaustively in simulation with production `step()` (takeoff x in 2 px steps × hold 0–200 frames), with identical results at 1440 and 1280:

- `precision-ledges` u1 → lane ledge `helper-7-1`. This is the challenge-tier running rise climbed on the way back up. Holding ← carries the body past the 12 px lane ledge into the gutter (4,396 of 5,656 variants). Live, this triggered checkpoint recovery to the Projects checkpoint, a 1,449 px jump. Undershoots land back on u1.
- Medium edges. Precision p1→u1 escapes or drops to the Experience checkpoint. rest→p2 and catch→p2 escape past the catch floor's right end. Grid-run u2→u1 can drop to the Projects checkpoint.

Every recovery worked, and there was no soft-lock. But acceptance criterion 4 ("no teleport") doesn't hold for these inputs. Fixing it means changing the §3.5 rule (validate hold-through variants) and/or the blueprint geometry: a catch floor can't extend into the lane or gutter. That would probably drop precision-ledges, so it is left for the user alongside AC1.

**Not verified here.** The *launch-pad*, *timeline-rungs* and *cool-down* courses are inactive at every width, so they were never played. A hold-through overshoot was driven live only for precision u1 → lane; the other listed edges come from simulation.

**Screenshots** (git-ignored, `.superpowers/sdd/game-mode-traversal-implementation-plan/t10/`):
- `t10-entry-{dark,light}-{rest,hover,reduced-hover,forced-hover,focus,dialog,active-hover}.png`
- `t10-journey-{1440,1280,1024-overlay,768-classic}-forward.png` and `t10-journey-1440-reverse.png`
- `t10-theme-{dark,light}-grid-run.png`, `t10-nav-view-work-landing.png`, `t10-nav-contact-landing.png`, `t10-resize-1100-paused.png`

## Drafted-ledge presentation (2026-09-24, Claude Code)

Traversal plan Task 9. Game ledges are drawn as a 2px line with 1×6px end ticks below it. Challenge-course ledges use `--accent-strong` with a 135° hatch below the line; catch floors use a dashed `--foreground-muted` line; every other ledge, backbone included, uses `--accent`. Headless Chrome drove the shared `next dev` server at 1440×900. It started Game Mode through the trigger and the dialog in each theme, then read the tokens with `getComputedStyle`:

| Token vs `--background` | Dark (`#0e0c0a`) | Light (`#f5f1e8`) |
|---|---|---|
| `--accent` | #6fa8c7, 7.53:1 | #245a78, 6.63:1 |
| `--accent-strong` | #8fc0da, 9.97:1 | #123c52, 10.39:1 |
| `--foreground-muted` | #a99e8d, 7.40:1 | #6b6152, 5.39:1 |

All are ≥ 3:1, so no token was substituted. In both themes, the live world rendered all 13 course ledges (stepping-stones, grid-run and precision-ledges) at the model's positions. It had 80 base, 7 challenge and 2 catch platforms. For each course ledge, the ledge-and-tick box (the line plus 8px) and the standing-body box (32px above the line) were tested against every visible readable element in `main`: links, buttons, form fields, and text-bearing p/h/li/span/dt/dd/time/label. None overlapped. Screenshots of each active course in both themes are in `.superpowers/sdd/game-mode-traversal/` (`t9-<course>-1440-<theme>.png`). The lowest line of each course sits 12px above the next section's kicker label; the ticks hang 6px into that gap.

## Traversal course tuning (2026-09-24, Claude Code)

Traversal plan Task 8, run against the measured fixtures with `buildWorld`. At first no blueprint validated anywhere. The stop gate triggered, and the user chose to change code under the unchanged rules (12px clearance, tier table, rhythm and catch rules, and every acceptance criterion). Four changes were made:

- **Entry.** A course now enters from the first lane surface whose standing body is inside the zone. The old entry's body sat above the zone top, 4px from content left, so every edge touching it failed the 12px clearance.
- **Button ledges bound zones.** Backbone action knots and terraces (`action-*`, `branch-*`) count as content when zones are measured. The Hero and Fresh Cart terraces had been lying across the top of their zones.
- **Rung inset.** The inner rung column now ends 12px before content left, and a gutter needs `2 × laneWidth + 8 + 12` px.
- **Lane-side origin.** Zones and blueprint x offsets start at the lane's content side (`lane.x + lane.width` for a left lane, `lane.x` for a right lane), not at `lane.x`. A snapshot taken before reveals settle builds its backbone on a 32px lane at 120.5 (at 1440) instead of the 12px lane at 162.5. Without this change, the pending-reveal world activated different courses from the settled one.

**Active courses** (settled and pending-reveal snapshots agree at every width):

| Configuration | Active |
|---|---|
| 1440 | stepping-stones, grid-run, precision-ledges |
| 1280 | stepping-stones, grid-run, precision-ledges |
| 1024-overlay | none |
| 768-classic | none |

Availability is unchanged at every width. `buildWorld` with courses takes 294–445ms at 1440/1280 in the probe (97 surfaces).

**The binding measured constraint is jump headroom.** A jump's apex is 150.5px, so the body top rises 182.5px above its takeoff line. It must clear the content above by 12px, which the zone top already includes. It must also not cross the backbone lane ledge above the entry. So away from the lane, a jump can only take off from the bottom ~50px of a 233px band. Every active course is therefore a low run in that strip, with its catch floor or return row at the zone bottom.

**Still rejected at 1440/1280 (AC1 not met; rules and target unchanged, pending a user decision):**

- **launch-pad** (comfortable, Hero floor). At 1440 the zone is y 765–950.8 (185.8px), and the entry is helper-1-1 at 857.6. A jump needs to take off at y ≥ 725 + 182.5 = 907.5 to clear the Hero action row. To avoid crossing the Hero terrace line (y 753) it needs 935.5. So the climb back to the entry is ≥ 78px, over the comfortable limit of 48. At 1280 the zone is y 710–850.8 (140.8px). Every jump needs a takeoff ≥ 698 + 182.5 = 880.5 below the terrace, but the floor ends at 850.8. So no jump fits: every sweep lands on the Hero terrace or checkpoint-hero.
- **cool-down** (comfortable, Experience→Contact band 5439.3–5672.3). The entry, helper-8-6 at 5522.3, is 83px below the zone top. A jump's lowest free takeoff is 5621.8, so the return climb is ≥ 99.6px. The best witnessed climb is 110px, which is challenge tier.
- **timeline-rungs** (medium). At 1440 (gutter 0–184.5), the first rung sits at the first timeline entry top (5005), above the only valid entry (helper-8-2 at 5095). The inset inner rung column (120.5–168.5) shares its x range with the backbone lane, so rung r1 sits 16.8px under helper-8-1. The rungs also stand side by side, 8px apart, so drops between them overshoot (2-frame windows). At 1280 the gutter is 104.5px, less than the 116px two rungs need, so there is no zone.
- **1024/768.** The bands are 181.8px and 130.6px, both shorter than the 182.5px one jump needs, so no band course validates. Launch-pad is also rejected there (witness), but that wasn't diagnosed separately. There is no gutter zone.

**Per-edge timing windows** (frames at 1/120s, final surface set, identical at 1440 and 1280; "walk" = walk or drop):

| Course | Edge | Tier | Window |
|---|---|---|---|
| stepping-stones | entry→u1 / u1→entry | easy | walk / 38 |
| | u1↔u2, u2↔u3 | easy | 38, 38 / 38, 46 |
| | u3↔l1, l1↔exit | comfortable | walk, 91 / walk |
| grid-run | entry→u1 / u1→entry | easy | walk / 30 |
| | u1→u2 / u2→u1 | medium | 30 / **22** |
| | u2→rest / rest→u2 | challenge | **22** / 54 |
| | rest↔catch, catch↔exit, catch→u1 | comfortable–easy | walk, 91, walk, 91 |
| precision-ledges | entry→u1 / u1→entry (110.6px running rise) | challenge | walk / 46 |
| | u1→p1 / p1→u1 | medium | 46 / **22** |
| | p1→rest / rest→p1 | challenge | **22** / 50 |
| | rest→p2 / p2→rest | medium | 50 / **22** |
| | p2↔catch, catch↔exit, catch↔u1 | comfortable–medium | walk, 65, walk, 91 |

Both challenge courses have 1–3 edges in [12, 24) frames: grid-run has 2 and precision-ledges has 3. Their challenge edges are separated by a rest ledge of at least 96px (grid-run's rest, precision's u1 and rest), and a single catch floor spans each run. None of the blueprints align ledge edges to the Tech Stack card grid. The column edges (700.5/724.5 at 1440) are not on the 8px lattice from content left, which the snapping allows.

## Traversal zone survey (2026-09-24, Claude Code)

Traversal plan Task 3. Headless Chrome over CDP against the local `next dev` homepage. For each configuration, the page was scrolled to the bottom in 400px steps with a 300ms wait per step, then scrolled back to the top. `readGeometry(main)` was then read through a temporary `window.__gameSnapshot` hook, which was removed afterwards. Every capture reported `revealsSettled: true`, 8/8 surfaces, 13 targets, 8 obstacles and 13 keep-outs. The HUD height came from a started session: 111.59375px at every width, with the header bottom at 123.78125px. So `usableHeight` = visual height − 123.78 − 111.59. The snapshots are committed as `tests/game/fixtures/rendered-homepage.ts` (`measuredHomepage`).

| Configuration | innerWidth / clientWidth | usableHeight | Content left–right |
|---|---|---|---|
| 1440×900 | 1440 / 1425 | 664.63 | 184.5–1240.5 |
| 1280×800 | 1280 / 1265 | 564.63 | 104.5–1160.5 |
| 1024×900 `--hide-scrollbars` | 1024 / 1024 | 664.63 | 48–976 |
| 768×900 classic scrollbar | 768 / 753 | 664.63 | 32–721 |

**Today's backbone** (`buildWorld`, unchanged, before any course):

| Configuration | Lane x / width | Surfaces | Helpers | Connections |
|---|---|---|---|---|
| 1440 | 162.5 / 12 (left) | 85 | 42 | 152 |
| 1280 | 82.5 / 12 (left) | 85 | 42 | 152 |
| 1024-overlay | 26 / 12 (left) | 80 | 41 | 142 |
| 768-classic | 727 / 16 (right) | 94 | 44 | 170 |

The largest backbone surface count is 94 (768-classic). Task 7 uses it for `maxSurfaces`.

**Zones.** These are raw measurements, before the 12px course clearance. A band's top is the lowest bottom of any keep-out, obstacle or planned action row in section N. Its bottom is the top of section N+1's anchor. The Hero floor runs from the bottom of the Hero action row to the bottom of the Hero section. Gutters are measured over the Experience keep-outs. On the left, a gutter runs from 0 to Experience content left. On the right, it runs from Experience content right to `clientWidth`.

| Zone | 1440 | 1280 | 1024-overlay | 768-classic |
|---|---|---|---|---|
| Hero floor (713.02→950.78 at 1440) | 237.77 | 192.81 | 250.88 | 258.94 |
| Hero→About band | 365.77 | 320.81 | 353.27 | 335.73 |
| About→Tech Stack band | 257.00 | 257.00 | 205.78 | 154.59 |
| Tech Stack→Projects band | 257.00 | 257.00 | 205.78 | 154.59 |
| Projects→Experience band | 257.00 | 257.00 | 205.78 | 154.59 |
| Experience→Contact band | 352.58 | 352.58 | 295.28 | 236.38 |
| Experience gutter, left / right | 184.5 / 184.5 | 104.5 / 104.5 | 48 / 48 | 32 / 32 |
| Experience keep-out y-span | 5005→5427.31 | 4905→5327.31 | 4912.09→5334.41 | 5197.58→5671.08 |

Band y-ranges at 1440: About→Tech 1708.91→1965.91; Tech→Projects 3007.05→3264.05; Projects→Experience 4636.42→4893.42; Experience→Contact 5427.31→5779.89. The Experience keep-out tops, which the timeline rungs align to, are at 5005 and 5236.16 at 1440 and at 4905 and 5136.16 at 1280.

**Decision gate (spec §3.3): passed at 1440 and 1280.** Every planned zone exists:
- Bands are 257–366px tall (the gate requires at least 150).
- Hero floors are 237.77 and 192.81px tall (at least 96).
- Experience gutters are 184.5 and 104.5px wide (at least 104).

**Risk carried to Tasks 5 and 8.** The 1280 gutter passes with only 0.5px to spare. Spec §3.2 measures the gutter from the viewport edge to content left, which gives 104.5. The plan's Task 5 `findZone` also subtracts the 12px course clearance, which gives 92.5. That is below its own `2 × laneWidth + 8` = 104 rule, so as written Timeline rungs would be rejected at 1280. That contradicts Task 8's "all six courses at 1280". This has to be resolved before or in Task 5. Loosening a rule to pass is not an option.

At 1024-overlay and 768-classic the gutters are 48 and 32px, so Timeline rungs will fall back to the backbone there, as planned. The 768-classic bands are 154.59px (130.59 after clearance), so they are tight for two-row courses.

**Sanity:** each of the four measured fixtures still builds today's backbone. The `measured <v> fixture keeps today's backbone` tests all pass, with 91 game tests in total.

## Browser zoom, touch-only devices, and blocked pop-ups (2026-09-24, Claude Code)

Headless Chrome over CDP with trusted input, dev server, classic scrollbars unless stated. Page zoom was emulated as Chromium applies it: CSS viewport = 1280×900 ÷ zoom and `devicePixelRatio` = zoom (`Emulation.setDeviceMetricsOverride`). Pinch-zoom used `Emulation.setPageScaleFactor`. A read-only `window.__gameWorld` hook located ledges and was removed afterwards.

| Case | Observed |
|---|---|
| Zoom 67 / 90 / 110 / 125% (CSS width 1910 / 1422 / 1164 / 1024) | Started. At each level the avatar walked off the Hero lane, landed on the next helper, and jumped back to Hero. No horizontal overflow. |
| Zoom 150% (853 CSS px) | Continue ended the session with **Larger window required**. At this zoom the classic scrollbar is only ~10 CSS px, so the 32px gutter plus that strip cannot host the route (same rule as the overlay-scrollbar case). |
| Zoom 175 / 200% (731 / 640 CSS px) | Below 768: trigger hidden, **Larger window required** hint shown, no dialog, no overflow. |
| Zoom change mid-session | 100→125%: paused with Resume enabled, footing preserved; after Resume, movement worked. 125→150%: **Larger window required.** with Resume disabled. Back to 100%: Resume enabled, avatar restaged at the Hero checkpoint (its old terrace no longer exists), no auto-resume. |
| Pinch-zoom 2× mid-session | Visual viewport 450px tall leaves less than the 231px usable-height minimum: **Larger window required.**, Resume disabled. Returning to 1× re-enabled Resume; explicit Resume played. |
| Phone 390×844, touch + coarse pointer | Trigger hidden, **Larger window required** hint, no overflow, no game DOM or marker. A raw touch drag scrolled the page natively (scrollY 0→335). |
| Touch-only tablet 1024×768 (`pointer`/`any-pointer: coarse`, `hover: none`) | Trigger reads **Keyboard required**. Tapping it showed **Keyboard required** with no dialog. A touch drag scrolled natively (0→509). |
| Hybrid tablet with keyboard | Keyboard Enter on the trigger counted as keyboard evidence: the dialog opened and Game Mode started. A touch drag during play scrolled natively (0→518) and paused as browsing. |
| Listeners (DevTools `getEventListeners`) | Off: window/document touch/wheel/pointer listeners are identical to the non-game page (React/Next's own); no game listeners. During a session the game adds window `touchmove` and `wheel` listeners, both **passive**, so they cannot cancel scrolling. |
| Blocked pop-up | `--block-new-web-contents` did not stop a keypress-initiated `target="_blank"` link in headless Chrome (the tab opened; the portfolio paused on focus loss, as in the allowed case). Blocking was therefore emulated with a capture-phase listener cancelling `target="_blank"` clicks, as a blocking extension or policy would. Enter on the presented **GitHub** selection was blocked (no new page, URL unchanged), and the session stayed **playing** with no pause, no transition, and no freeze. Real input kept moving the avatar, and a second Enter activated (and was blocked) again. |

Tool notes: `Input.synthesizeScrollGesture` does not scroll in this headless build, so raw `Input.dispatchTouchEvent` drags were used; they were first validated on `/resume`. Game Mode's `prefers-reduced-motion` handling was not re-run here.

## Live-concern diagnosis and browser acceptance (2026-09-23, Claude Code)

The previous wave left the settled 1024px safe-layout rejection and the no-progress Resume attempts without isolated root causes, and could not hold keys. This wave drove headless Chrome over the DevTools protocol (Node's built-in WebSocket, no dependency): trusted `Input.dispatchKeyEvent` key-down/auto-repeat/key-up, mouse clicks/wheel, and page-context reads. Two instances were used: one without classic scrollbars (DPR 1 via `Emulation.setDeviceMetricsOverride`), and one launched with `--force-device-scale-factor=1.25`, which renders classic 16px scrollbars and real fractional scroll offsets. Game state was read through a temporary `window.__gameWorld`/`__gameDebug` hook in `game-session.tsx`, removed before commit; gameplay was driven only by trusted input.

### Root causes fixed (each with RED→GREEN evidence)

| Observed concern | Root cause | Fix and evidence |
|---|---|---|
| Resume showed **Returning to a safe platform…** then **Paused** with no movement (1024px, scrollY=349.6) | `waitForSettlement` required `scrollend` whenever `targetY !== scrollY`. A sub-pixel correction (avatar 0.24px below the band → target 349.84 at DPR 1.25) snaps back to the same device pixel, so neither `scroll` nor `scrollend` fires and the 1.5s timeout paused. Live probe: `scrollTo(0, 349.84)` from 349.6 stays at 349.6. | Require `scrollend` only for moves of ≥1px; stable frames still gate settlement. New scroll regression failed (`false`) before, passes after. Live at DPR 1.25: a +0.117px correction at scrollY=62.4 resumed straight to **Game Mode started**. |
| Resume disabled with **Paused until a safe layout is available** while nothing moved and the last validation succeeded | `onResize` pauses with the `layout` reason; the follow-up `validate()` found an unchanged geometry key and returned early without `VALIDATED`, so `layout` was never cleared. Any resize that ends at identical geometry (restore, DevTools, visualViewport, viewport overrides) latched it. Live: `reasons=[layout]`, `layoutValid=true`, further resizes no-op. | An unchanged key now confirms the standing world (clears only `layout`; never resumes). Live RED (stuck) → GREEN: after a no-op resize, **Game Mode paused**, Resume enabled, no auto-resume. Also verified on the production build. |
| Resume disabled at Projects after View Work/descent, zero *moving* reveals | `readGeometry` treated any in-view non-settled reveal as unsettled. The lower project cards overlapped the viewport by ~65–73px, under `whileInView`'s `amount: 0.2`, so they stayed `pending` indefinitely and validation could never pass without manual scrolling. `navigationIsSettled` had the same rule. | Only visible `moving` reveals (including a moving stagger parent whose items still wait on their delay) block the neighborhood/arrival. Pending geometry was already non-collidable and disabled; a reveal that starts later still emits `moving` and invalidates. Two regressions (geometry→world→physics and navigation) failed before, pass after. Live: Case Study activation then succeeded. |
| Hero **Contact** action at 1024px exited Game Mode or left a disabled Resume | Jump navigation reaches Contact before Projects has revealed, so project rows have disabled links and take the far-row branch path. The contact form beside the actions rules out the right gutter; in the left gutter the far-row branch paired its first segment with the helper *below* the row's route knot, but the knot sits level beside the segment, so the descent landed on the knot and the witness failed. | When a level knot exists it carries the branch; the lower link is kept only when both directions are witnessed (optional pair, still bidirectional). The 1440px route, which relies on the lower link, is unchanged. New measured-1024 regression failed before, passes after; the dumped live snapshot now validates. Live: **Game Mode started. Active checkpoint: Contact.** (dev and production). |

### Browser acceptance now observed

| Case | Result |
|---|---|
| Held movement / jump | 500ms ArrowLeft moved 122px (240px/s). One Space press rose and landed. |
| Held Space / Space scroll | 2.5s of Space with auto-repeat produced exactly one jump and no re-jump after landing; scrollY stayed 0. |
| Held Enter | Ten auto-repeat Enter events on the presented **View Work** selection caused exactly one click. |
| Forward + reverse journeys | Complete Hero→Contact and Contact→Hero at **768 (classic scrollbar, DPR 1.25), 1024 (no scrollbar), and 1440 (classic scrollbar, DPR 1.25)**, with exactly one green flag at every checkpoint. Also Contact→Hero at 1024 after jump navigation, through never-revealed sections. Reveal pauses always required explicit Resume; an airborne reveal pause restaged at the active checkpoint per the approved rule. |
| Genuine escape recovery | Walking off the outer lane edge (to x=-92, falling) respawned at the active Hero checkpoint and returned to play; held input was cleared. |
| Interruption during recovery | Blur fired the moment the phase became `repositioning`: **Paused while the page is out of focus**, staged at the checkpoint, no auto-resume; explicit Resume after focus worked. Exit during recovery: phase off, marker/avatar/HUD removed, focus on the Game Mode trigger. (Blur/Exit were page-dispatched at the exact phase; recovery itself was trusted input.) |
| Target activation / navigation | View Work → `/#projects`, Projects landing. Hero Contact → `/#contact`, Contact landing. Quick Bite Case Study → `/work/quick-bite` with complete cleanup; Back → `/#projects` with Game Mode off. GitHub opened a real new tab keeping `target="_blank"`/`rel="noopener noreferrer"`; the portfolio paused on focus loss; after closing that tab, Resume was enabled but nothing resumed until clicked. |
| Manual browsing | Wheel, PageDown, and ArrowDown each paused without auto-resume; explicit Resume worked. |
| Editable control / theme | Typing into Name kept native caret keys (ArrowLeft/Space edited text) and paused as native-control; the theme toggle paused and switched theme. No form was submitted. |
| Reduced motion off | With `prefers-reduced-motion: no-preference` emulated, the session started and showed `run-a`/`rise` poses, identical to the reduced-motion runs. |
| Production build | Session chunk count 12 before consent and with the dialog open, 13 after Continue. |

### 768–1023px without classic scrollbars: decided unsupported (2026-09-24)

With overlay scrollbars (macOS default; headless without scrollbars), every probed width from 768 to 1023 fails closed at spawn: **Paused until a safe layout is available**, Resume disabled. The same widths all start with classic scrollbars. Cause: `Container` uses `sm:px-8`, so gutters are exactly 32px until `lg`. A walk-off descent needs the 24px avatar, spawned centered on its helper with 2px content clearance, to step fully off the helper. That needs roughly 48px of lateral room, which puts the body past x=0 or x=innerWidth. Inward jump-dodges land on the Hero action terrace. The previously verified 768px route works only because a classic scrollbar keeps `innerWidth` at 768 while content ends at 753, leaving a 15px fall strip. Fixing this changes approved behavior (avatar size/tuning, spawn/placement rules, or eligibility messaging), so it went to the user for a decision.

**Decision (user, 2026-09-24):** keep the 24px avatar and the no-content-overlap rule; do not redesign routes for a smaller body. Enable Game Mode only where the existing route is fully valid, and otherwise show the existing **Larger window required** state.

**Implementation.** `readGeometry` now also returns `plannedTargets` (links as they will be once reveals settle), mirroring `plannedSurfaces`/`plannedActionRows`. `viewportSupportsRoute()` runs the unchanged `buildWorld` against that fully settled layout. When a live validation fails, the session asks it whether the failure is permanent (insufficient side room or usable height) or transient (reveal state). No new constants or geometry rules were added. Permanent failure before any world exists ends the session with a `viewport` reason: the entry shows **Larger window required**, restores focus to the Game Mode button, and does not reopen the dialog until the viewport size changes. Permanent failure mid-session stays Paused with **Larger window required.** and Resume disabled; widening re-enables Resume without auto-resuming. Transient failures keep the existing safe-layout pause.

**Evidence.** Two new world tests (a 32px-gutter 768px layout and too little height are unsupported while the classic-scrollbar layout is supported; a moving, unrevealed 1024px layout is never unsupported) failed before the export existed and pass now. Live, headless without scrollbars: at 768 and 1023, Continue ended the session with no HUD, avatar, or marker, status **Larger window required**, and focus on the trigger; a second press opened no dialog. 1024 played. Narrowing a playing 1024 session to 900 paused with **Larger window required.**, Resume disabled; widening back gave **Game Mode paused.** with Resume enabled. After exiting, a narrow start was unavailable and the dialog opened again once widened. With classic scrollbars, 768 and 900 still started and 768 descended to the next helper.

Other remaining note: The avatar can move laterally with its platform when revalidation moves the route between gutter lanes (footing is preserved on the same logical support while paused).

Commands (after the viewport-support change): `npm run test:game` **86 passed / 0 failed**; `npx tsc --noEmit --incremental false` exit 0; `npm run lint` exit 0; `npm run build` exit 0 (13 pages); `git diff --check` clean.

## Final whole-branch fix wave (2026-09-23) — DONE_WITH_CONCERNS

The two final-review code defects are corrected. DOM-backed collision surfaces now come only from settled `snapshot.surfaces`; planned positions still inform layout, and active membership participates in the validation cache key. Every accepted connection is proved against the same collision set used by live physics. A newly settled registration becomes collidable only in a newly validated world. Support restoration now uses positive horizontal overlap, matching production one-way physics for the existing 12/16px helpers, while checking the entire body against obstacles and viewport bounds. Destination landing retains section/body clearance.

Observed RED→GREEN coverage crosses `readGeometry` → `buildWorld` → production `step`: the pending-card regression originally landed on `revealed-card` instead of returning null; it now passes, including moving-neighborhood rejection, unchanged old-world behavior after settlement, cache invalidation, newly active landing, and bidirectional witness replay. Four unchanged/moved 12/16px support cases and a narrow destination checkpoint originally returned null/undefined and now pass. Existing rendered/interception fixtures explicitly mark settled surfaces, retaining full-world interception coverage.

Required final commands: `npm run test:game` **81 passed / 0 failed**; `npx tsc --noEmit --incremental false` and `npm run lint` both exited 0. `npm run build` compiled in the sandbox but its worker launch failed with `spawn EPERM`; the permitted elevated retry exited 0 and generated all 13 pages. The first full suite run exposed one stale fixture (`a registered intervening top participates in full-world collision validation`) that registered the card only as planned; its settled membership and the measured 768/1024 fixtures were corrected before the final 81/81 run.

### Additional observed browser evidence

This wave used Codex in-app Chromium through `cua_repl` on the existing dev server `http://localhost:3000`, with temporary 1024×900 and 1440×900 viewport overrides. DOM observations read rendered avatar transforms, poses, helper positions, flags, and status text; no hidden game state, injected keyboard events, test route, or gameplay mutation was used. The previously completed 768px entry and 1440px Projects wheel checks were not repeated.

| Core case | Actual observation and limit |
|---|---|
| Jump / Space scrolling | At 1024px, a real `pressKey(null, 'space')` changed the avatar from idle at `(964.8,707.05)` to rising at `(964.8,688.481)`, with `scrollY=0` and Playing/Hero unchanged. A later observation showed it grounded again at y=707.05. This verifies one jump and no native Space scroll for that press, not held-Space suppression. |
| Movement / natural lower landing | One brief Right press produced no movement; 20 presses moved x=964.8→978.8, and 24 more moved to 988.8. Further right input produced falling at `(992.8,718.738)`. Steering left landed at `(968.8,807.5)` on the next helper top y=839.5, `scrollY=45.6`, still Playing/Hero. The avatar did not recover to the Hero top y=739.05. Subsequent multi-second sequences traversed numerous helpers, with ordinary following and repeated idle/fall observations. These were successive presses, not a held key. |
| Forward checkpoint progress | The 1024px physical journey reached About at `(968.8,1008.4)`, `scrollY=246.4`; the six flags changed from `[true,false,false,false,false,false]` to `[false,true,false,false,false,false]`, and the status named About. Reveal pauses required explicit Resume. At a grounded reveal pause, footing remained `(972.8,1112.09)` after settlement rather than returning to About's checkpoint y=1008.4. Later movement reached y=2047.17 while About remained active, so Tech Stack was skipped during the timing-sensitive descent. No full six-checkpoint forward or reverse journey is claimed at any width. |
| Resume interruption | At About, two ordinary Resume attempts briefly showed **Returning to a safe platform…** and then **Game Mode paused**, with the same avatar `(972.8,1112.09)` and scrollY=349.6. On the next attempt, the Returning status was observed before wheel input. Wheel changed scrollY to 574.4 and status to Paused/About. A later read still showed Paused at the same avatar/scroll, with only About active; no stale automatic resume occurred. A subsequent explicit Resume reached Playing. This is an observed interruption case, not an explanation of the earlier failed Resume attempts. |
| Escape attempts / recovery limitation | At 1024px, successive Right presses moved a falling avatar from x=992.8/y=1010 through x=1086.8/y=3217.57, but a layout pause intervened at scrollY=2455.2 with About active. A later snapshot had zero visible unsettled reveal wrappers and disabled Resume with the safe-layout status; a Resume click timed out because the button was disabled. At 1440px, successive Left presses from Hero `(124.4,720.15)` produced falling down to `(52.4,1883.17)`, then another reveal/layout pause. Settlement staged Hero `(124.4,720.15)` while remaining Paused. Neither sequence is accepted as genuine escape recovery: layout invalidation interrupted both. Interruption during recovery therefore remains unverified. |
| Cleanup | Exit removed the avatar, HUD, and active document marker. The viewport override was reset and the temporary tab closed. |

### Tool limits and remaining acceptance concerns

- The exposed browser APIs provide `pressKey(element, key)` and locator `press(value, {timeoutMs})`, without documented key-down/key-up, hold duration, or repeat-event control. Brief presses inconsistently span physics frames (one Right press yielded 0px, 20 yielded 14px). Held Space/Enter suppression cannot be claimed from successive presses. No unsupported transport or synthetic-event workaround was used. A requested visible tab also returned **IAB visibility is not supported in a subagent thread**; the supported hidden tab did work.
- Complete forward/reverse six-checkpoint journeys at 768/1024/1440, reliable sustained held input, genuine escape recovery, and interruption during recovery remain open. The 1024px settled-layout rejection at scrollY=2455.2 and the two no-progress Resume attempts at 349.6 are additional observed concerns; their causes were not established or patched in this final two-defect wave.
- All unrelated earlier gaps remain visible below: live route height versus the physics lower bound, zoom, OS reduced-motion off, touch-only behavior, broader target/new-tab coverage, and other incomplete matrix cases. Automated route witnesses do not replace these browser observations.

## Task 11 final verification (2026-09-22) — DONE_WITH_CONCERNS

### Commands

| Command | Result |
|---|---|
| `npm run test:game` | Fix round 1: passed, 75/75 tests (including both new regressions). |
| `npx tsc --noEmit --incremental false` | Passed, exit 0. |
| `npm run lint` | Passed, exit 0. |
| `npm run build` | First sandboxed run compiled, then failed to spawn a Next.js worker (`EPERM`). The local elevated retry passed; Next.js generated all 13 pages. |

### Browser observations

Used Codex in-app Chromium with temporary viewport overrides, first against the Next.js dev server at `localhost:3000`, then against the production build at `localhost:3001`. Measurements below are browser CSS pixels. They are live DOM/computed-style observations; no test-only route was added.

Fix round 1 (2026-09-22/23) revisited only the two reported route failures on the dev homepage at `localhost:3000`. Post-fix evidence is identified below; other matrix entries retain their original verification scope.

| Matrix case | Observed result |
|---|---|
| Off, cancelled modal | At 768 × 900, cancelling the named dialog kept the hash empty, returned focus to Game Mode, and preserved the already-scrolled `scrollY=215.2` during dismissal. A separate 1440px modal run found the main copy and all 13 main links unchanged across the open/close cycle. No HUD, world, or avatar mounted and the active-session marker was absent. The browser API cannot enumerate document listeners or pending rAF callbacks. In the production page the session chunk was absent before consent and after opening the dialog; it appeared only after Continue. |
| 767px vs 768px | Original 767 × 900 observation: trigger hidden, **Larger window required** visible, no game UI or horizontal overflow. Fix round 1 at 768 × 900: Continue produced **Game Mode started. Active checkpoint: Hero.**, six flags and exactly one active flag. Measured `innerWidth=768`, `clientWidth=753`, `scrollY=215.2`, header bottom 84px, HUD 111px, usable height 705px. Width eligibility was already correct; the rejected route came from a subpixel exclusion edge extending beyond the anchor-derived gutter. The gutter now uses all exclusion edges while retaining strict clearance. |
| Height boundary | Physics tuning is `step=1/120s`, `speed=240px/s`, `gravity=1100px/s²`, `jumpSpeed=580px/s`, `body=24×32px`, `landingMargin=2px`, and reach `110×150px`. The same fixed-step apex calculation is 150.5px; `ceil(150.5 + 32 + 48)` gives a 231px minimum usable gameplay height, matching the unit boundary test. On the live 1024px route, header bottom was 84px and HUD height 111px. Viewport override 597 produced visual height 597.6 and usable height 402.6; Resume stayed disabled. Override 598 produced visual height 598.4 and usable 403.4; Resume enabled. Override 599 produced visual height 599.2 and usable 404.2; Resume remained enabled. The browser override rounds innerHeight, so the edge evidence is the measured visualViewport calculation. The live route needed about 403.4px usable height, far above the formula's 231px lower bound; geometry route availability therefore remains a separate unresolved constraint. At 1024 × 900 usable height was 705px and the route validated. |
| 768/1024/1440 widths, zoom | Fix round 1: 768 × 900 successfully initialized Hero as recorded above. Original 1024 × 900 and 1440 × 900 checks exposed six flags, exactly one green Hero checkpoint, and enabled Resume. The original 768-to-1024 resize paused and required explicit Resume. Zoom and complete checkpoint traversal were not added to this fix round. |
| Dark/light themes | Production dark-theme screenshot showed the avatar and helper ledge below the Hero CTA row, controls beneath the sticky header, and portfolio copy unobscured. In light theme, computed inactive/active flag colors were `rgb(160, 44, 53)` / `rgb(23, 105, 59)` and hoodie fill was `rgb(36, 90, 120)`. Theme control remained native and paused the session. |
| OS reduced motion | Browser `matchMedia('(prefers-reduced-motion: reduce)')` was `true`. After confirmation and explicit Resume, status was Game Mode started and avatar `animationName` was `none`; poses are direct session attributes. The available browser API did not provide an OS reduced-motion override, so the off run is unverified. Existing portfolio reduced-motion CSS was not changed. |
| Keyboard and editable controls | Keyboard Enter opened the modal at 768 and later activated the already visible **View Work** selection at 1440. Held Enter repeat, Space scrolling/jump, sustained arrow travel, and editable-control typing were not re-established in this pass. Prior Task 9 browser evidence covers native Name-field typing and menu ownership. |
| Manual scroll | Fix round 1 at 1440 × 900: gameplay Enter on the visible View Work selection reached Projects at `scrollY=2916.8`. Wheel browsing moved to `3816.8`; after zero visible unsettled reveals remained, status was **Game Mode paused. Active checkpoint: Projects.**, Resume was enabled, and Projects was the sole active flag among six. No automatic resume occurred. Explicit Resume returned to `2916.8`, removed Resume, and showed **Game Mode started. Active checkpoint: Projects.** Scrollbar, trackpad, and PageDown were not separately exercised here. |
| Interrupted repositioning | Resize from 768 to 1024 interrupted the unsafe layout and required explicit Resume after validation. Interruption during a controlled scroll, blur, and Exit during repositioning were not repeated in this pass; unit coverage and Task 9/10 observations remain documented below. |
| Geometry | Original Quick Bite hover evidence: collision wrapper stayed outside the hovered inner card, whose transform was `matrix(1, 0, 0, 1, 0, -2)`. Fix round 1 isolated both route rejections and retained fail-closed validation: the narrow gutter derives from excluded content edges, and shared action terraces include only rows that the avatar fully clears. The targeted 768 entry and settled 1440 Projects wheel cases now validate. |
| Physics and checkpoints | Exactly one of six flags was active at spawn and after the Projects landing. No sustained real-browser traversal was reliable enough to verify side rejection, ordinary lower landings, escape recovery, or the complete forward/reverse checkpoint journey. The 75 unit/integration tests now include both fix-round regressions alongside deterministic two-way witness validation, collisions, and recovery; they are not a browser-journey substitute. |
| Target activation | Production gameplay showed **Press Enter · View Work** as the selected target. Enter navigated to `/#projects`, reached the destination, and resumed with Projects green (`scrollY=2916.8`). No held-key repeat was observed. Repository/social new-tab focus-return and popup-blocking cases were not repeated. |
| Navigation | Game Mode entered `/#projects` through the selected existing View Work link. Clicking the existing Case Study link navigated to `/work/quick-bite`, removed the HUD/avatar and active session; Back returned to `/#projects` with Game Mode off. Contact, Resume route, and new-tab destinations were not repeated in this pass. |
| Exit and unmount | Exit after manual browsing removed the HUD/avatar and returned focus to Game Mode while preserving `scrollY=1150.4`. Case Study unmount removed game UI; Back stayed off at the existing destination scroll. No form was submitted and no email was sent. |
| Touch/mobile | At 390 × 844, Game Mode UI was absent, the wider-window hint was visible, and horizontal overflow was false. This browser did not emulate a touch-only device, so touch gesture interception is not claimed tested. |

### Routes, performance, and scope

The repeatable placement rules in `lib/game/world.ts` are content-derived: section headings anchor About/Tech Stack/Projects/Experience; Hero and Contact use a point below their registered anchor; other action rows receive a terrace below their measured row. Intermediate vertical knots are evenly spaced no farther than `min(112px, apex−24px)`. Candidate helper lanes are tried in stable order from the left/right content gutters and narrow side strips, then filtered so the 24px body remains inside the viewport. Action terraces extend in bounded segments toward existing targets. Every required edge and branch must pass the production fixed-step simulation in both directions; validation fails closed. The builder caps the world at 160 surfaces and each jump witness at 180 frames. No per-session random placement is used.

The live route witness was Hero → Projects at 1440 × 900: the visibly selected existing View Work link received Enter, URL became `/#projects`, scroll settled at 2916.8, and checkpoint index 3 (Projects) was the sole green flag. Fix round 1 also verified actual 768px Hero initialization and the 1440px wheel-pause/explicit-Resume sequence. Pure route tests replay accepted connections through production physics; they do not substitute for the still-unverified complete browser journey.

The original production page's `document.scripts` contained no production session chunk (`1nj_44r52fgxq.js`) before consent or while the dialog was open; the chunk appeared after Continue. Source review found no portfolio-wide React state update in the physics tick: the session holds body state in refs and paints the view imperatively. Geometry reads are observer/event scheduled rather than full-document reads each frame. Exit/unmount removed temporary game DOM in repeated browser flows. No timing benchmark was available, so no numeric performance claim is made. Fix round 1 changes only the route builder, its regression coverage, and validation records. No dependency was added. `AGENTS.md` remained unmodified and unstaged.

### Remaining concerns

- The live homepage's measured safe route threshold (~403.4px usable in the 1024px scrolled fixture) is materially above the computed 231px physics minimum. This boundary is recorded as observed route availability, not a replacement tuning constant.
- Complete six-checkpoint movement, jump/escape recovery, held-key suppression under sustained input, interruption during owned navigation/repositioning, OS reduced-motion off, touch-only behavior, zoom, and target/new-tab breadth remain incomplete.

Fix round 1 resolved the two reported route failures with observed RED→GREEN regressions in `tests/game/world.test.ts`, using the captured settled Projects geometry in `tests/game/fixtures/rendered-projects.ts`. At 768px, the anchor's right edge was 720.7999878px while excluded Experience content ended at 720.8000145px; deriving the lane from the latter preserves the required 2px clearance. At 1440px, Social-Media's terrace at y=4588.6001 included a Fresh-Cart row extending to y=4600.4001, so the avatar overlapped it. Terrace sharing now checks the complete row bottom plus body clearance. No safety margin, physics rule, or bidirectional witness requirement was relaxed. No push, merge, deployment, dependency addition, or optional polish was performed. The remaining acceptance gaps above stay open.

## Task 10 navigation integration (2026-09-22) — implemented; remaining browser cases noted

Added classification of the actual registered anchor's resolved URL, target, and download behavior. Eligible same-page game actions acquire destination scroll ownership before the synchronous real `.click()`, clear input/velocity, and wait for the actual URL and destination scroll alignment. No arrival times out into Paused. Native browsing clicks remain paused; external actions retain their existing target/rel and rely on real focus events. Actual pathname departure has a defensive cleanup guard in addition to homepage unmount cleanup.

After arrival, the session revalidates geometry and uses the destination checkpoint, or an obstacle-clear, already route-validated helper within that section. Fallback promotion demotes the old section checkpoint and preserves the active mapping on revalidation. Invalid placement exits gracefully. Abort signals and operation tokens prevent interrupted navigation from resuming.

Browser testing found and corrected two integration defects. Projects navigation waited for all descendant reveals, including offscreen cards that could never settle; settlement now checks only visible descendants (covered by a regression). Same-page router rerenders could replace the entry's `onExit` callback and restart the session at Hero; the callback is now stable with `useCallback`. The live reproduction subsequently retained Projects as the active checkpoint.

Verified in Codex Chromium at 1280 × 720 on localhost:3000:

- Gameplay Enter with a previously visible View Work selection changed the URL to `/#projects`, reached the destination, then resumed with **Active checkpoint: Projects** and scrollY=2764.
- Repeating the already-current Projects hash from Hero, when the existing Next link caused no destination scroll, timed out to **Paused**, retaining Hero. It did not fabricate arrival or teleport.
- Native View Work and Contact browsing clicks kept gameplay paused and retained the checkpoint.
- Case Study and Resume navigation removed the HUD and active-session document marker. Browser Back returned with Game Mode off.
- Contact links retained `target="_blank"` and `rel="noopener noreferrer"`. No email was sent and no form was submitted.

Automated verification: 73/73 game tests passed, full ESLint and TypeScript checks passed, and the production build generated all 13 pages. Tests cover pre-click ownership, ineligible activation, actual URL/target classification, destination-only safe fallback and checkpoint promotion, no-arrival timeout, interruption, and offscreen reveal settlement.

Remaining browser acceptance: gameplay Enter on Contact, Case Study/Resume and repository/social targets after traversing their ledges; actual new-tab focus return and explicit Resume; popup blocking; and interruption during destination scrolling. Brief automation key presses did move the avatar and selected Resume, but did not reliably reproduce sustained movement/jumps to every target. These cases are not claimed as browser-passed. Task 9's separately listed traversal gaps remain open. Changes are local and uncommitted: the session, entry, view, styles, and content were pre-existing untracked Task 7–9 dependencies, so this pass did not bundle them into a Task 10 commit. No push or deployment was performed.

## Task 9 integration review (2026-09-22) — traversal acceptance pending

The working tree already contained the integrated `game-session.tsx`, fixed-step loop, input ownership, checkpoint/recovery orchestration, geometry revalidation, and cancellable scroll operations. This supersedes the Task 7 shell description below. Task 9 was not verified complete when this review began.

Corrected four integration issues: the default scroll adapter now calls native animation methods on `window` (unbound methods threw `Illegal invocation` during React development cleanup); focusing HUD controls pauses just like other native controls; geometry validation keys include header height without treating ordinary sticky-header scrolling as layout changes; and once-only reveal signals cannot change a settled reveal back to moving on viewport re-entry. The latter caused a reproducible permanent unsafe-layout pause after browsing away and re-entering. Its regression failed before the correction and passed afterward. A default-browser-adapter regression also covers animation scheduling and teardown.

Live Codex Chromium checks on localhost:3001 observed successful Continue/spawn and explicit Resume at 1440 × 900, a Space-triggered rising pose, focus-loss pause, native Name-field typing while paused (test text removed; no form submission), repeated Exit/re-entry, and browsing to Contact followed by Resume. Revalidation can interrupt the return when newly visible reveals start; it remains paused and requires explicit Resume as designed. At 767 × 900, Resume became disabled with the safe-layout explanation. Opening/closing the native menu preserved the pause. At 768 × 900, Resume became enabled without automatically playing. Exit removed the HUD, avatar, and active-session marker and restored trigger focus. No game dependency or test-only route was added.

Final automated checks: `npm run test:game` passed 65/65; `npm run lint`, `npx tsc --noEmit --incremental false`, and `npm run build` passed. The initial sandboxed test command failed to spawn Node workers (`EPERM`); the authorized rerun passed. The production build generated all 13 pages.

Still required before Task 9 is fully accepted: an integrated forward/reverse six-checkpoint journey, sustained/held movement and Space-repeat checks, natural missed jumps versus genuine escape recovery, focus loss during recovery, layout replacement underfoot, and interrupted Resume with sustained input. The available browser API's brief key presses did not reliably span simulation frames for horizontal movement, so pure bidirectional route witnesses are not claimed as a full browser journey. Task 10 destination landing/navigation remains deliberately separate. Changes remain local and uncommitted because the session and its Task 7/8 dependencies were already untracked; no preceding work was bundled into a new commit.

## Task 8 presentation implementation (2026-09-16)

Added `game-view.tsx` with a clipped, pointer-transparent document portal, six checkpoint flags, a fixed HUD below the supplied measured header bottom, one polite status region, and a small theme-token SVG developer avatar. Session-driven `paint(now, target)` updates position and discrete idle/run/rise/fall/landing poses without a presentation animation loop or per-frame React state. The session must call it after safe spawn and on each gameplay frame; acknowledge the returned selection only after a subsequent rendering frame. Pass null to clear selection, and supply only a freshly validated target. Phase/label/world changes and unmount also clear the outline. `helperSurfaceIds` explicitly separates validated helpers from existing portfolio surfaces. Body bounds remain independent of visual poses.

Integration contract for Task 9: supply document dimensions measured without the overlay, live header bottom, validated helper IDs, checkpoint surface ID, pause explanation, and resume eligibility. Consume `onControlsHeight` when validating available space. The observer is disposed on unmount. Reserve the hint row even when hidden so target selection does not change the HUD's height. Keep header changes and wrapped HUD sizes in geometry invalidation. Mount only after validation; no moving avatar is rendered until the session paints it.

Real Chromium verification used a temporary presentation-only route, removed afterward. Both dark and light screenshots showed the hoodie/eyes, one green rectangular checked flag, five red notched flags, and blue helper lines. At 768 × 468, the layout viewport was 753px wide and had no horizontal overflow; HUD top was 124px, height 111.59375px, bottom 235.59375px. With the existing 231px usable-height requirement this fixture needs a total height of at least 466.59375px (467 whole CSS pixels). This is a measured fixture calculation, not yet a live homepage boundary acceptance test. HUD height stayed 111.59375px through hint appearance and pause. Pause removed the outline and hint, displayed disabled Resume with the safe-layout explanation, and preserved Exit. The world computed pointer-events:none. Exit removed the world/HUD; document scrollHeight stayed 1130px before/after. Native fixture controls remained clickable through the world layer.

The first server-rendered fixture exposed a portal hydration mismatch; the view now uses a hydration-safe external-store mounted snapshot. Reload after that correction showed no development error badge. No existing portfolio reduced-motion CSS was changed; game poses use direct attributes rather than CSS animation durations. Both OS-motion-preference browser runs, full pose timing, real homepage content-clearance checks, and the live viewport sweep immediately above/below the boundary remain integration acceptance work. The fixture is not evidence that the six-section gameplay route is browser-accepted.

Validation: all 61 existing game logic tests passed. Final full ESLint and TypeScript checks passed after the browser corrections. Computed checkpoint contrast against the page background: inactive/active 9.19:1 and 10.37:1 in dark, 6.41:1 and 5.97:1 in light; the active check uses the page-background color against the flag fill. Changes remain uncommitted because the Task 7 CSS/content dependencies were already untracked; a standalone Task 8 commit would either omit required dependencies or include preceding uncommitted work.

## Task 7 entry implementation — browser acceptance pending

The Hero remains a Server Component and mounts a small client entry beside its existing CTAs. The entry uses a named native dialog with the approved warning, Exit first, Escape dismissal, and focus restoration with `preventScroll`. CSS supplies the Off-state width/capability hints; activation rechecks the 768px media query and accepts keyboard focus/activation as positive keyboard evidence. Width messaging takes precedence. No reduced-motion rule was added or changed.

Continue alone imports the session module. A cancellation token discards late imports after Exit or unmount; loading and render failures retain an Exit action. The Task 7 shell explicitly reports that play is not ready and starts no physics, geometry observers, gameplay input listeners, scrolling, or animation loop. Safe layout validation and playable integration remain Task 9 work.

The existing 61 game logic tests, full ESLint, and TypeScript checks pass. The production build passed after allowing network access for the existing Google Fonts; the first sandboxed attempt could not fetch those fonts. Code review corrected trigger focus restoration (the trigger stays focusable with guarded `aria-disabled`), aligned activation width with CSS rather than scrollbar-reduced `clientWidth`, and guarded delayed loading/error focus transfers so they preserve focus on ordinary page controls. Final lint and TypeScript checks passed after the focus correction.

Real-browser verification could not run: automatic approval review denied the local preview, first citing a usage limit and then the unresolved earlier restriction when the user resumed. No alternate browser transport was used. Tab/Shift+Tab containment, Escape/Continue/Exit, scroll preservation, 768px wrapping, zoom, touch-only/hybrid keyboard behavior, both themes, failure/cancellation behavior, and Off/cancel runtime cleanup remain unverified in a browser. Task 7 must not be treated as fully browser-accepted on the strength of static checks alone.

Date: 2026-09-15. Browser: Codex in-app Chromium, local Next.js dev server on port 3001. Measurements are CSS pixels from `getBoundingClientRect()` plus `scrollY` for document positions. Browser screenshots of the 768px Hero and 1440px Quick Bite card were inspected during this session; no image assets were added to the repository.

## Task 3 geometry survey

All three runs used a 900px viewport height. The sticky header measured 84.6px high, with its bottom at about 124px before scrolling because the 39px status ticker sits above it. An estimated 56px control-strip allowance leaves about 720px of gameplay viewing space at this height; Task 4 must replace that estimate with the finished control UI and simulated jump clearance. The browser scrollbar reduces the available content width by about 15px at 768px.

| Viewport width | Hero CTA row (document y, width) | Section tops: Hero / About / Stack / Projects / Experience / Contact | Quick Bite card top | Contact layout |
| --- | --- | --- | --- | --- |
| 768 | 624, 689 | 124 / 951 / 1771 / 3291 / 5022 / 5748 | about 3478 | Actions at x=32, y=5919, w=689; form below at x=32, y=6097, w=689 |
| 1024 | 632, 913 | 124 / 951 / 1780 / 3141 / 4733 / 5467 | about 3362 | Actions at x=48, y=5672, w=393; form beside at x=489, y=5582, w=472 |
| 1440 | 645, 1056 | 124 / 951 / 1837 / 3135 / 4764 / 5555 | about 3388 | Actions at x=185, y=5792, w=458; form beside at x=691, y=5696, w=550 |

The 768px Hero action row contains three separate buttons on one line: View Work x=32–154, Resume x=170–280, and Contact x=296–403. The Quick Bite action row wraps to 99px high at 768px, then fits in about 58px at 1024px and 1440px. The secondary project cards form two columns at all surveyed supported widths, with a narrow 32px gutter at 768px. Tech Stack cards also form two columns, but the System Design card spans both; the card tops and section heights change with text wrapping. These differences rule out fixed document coordinates for route helpers.

The Hero checkpoint marker is the CTA row, which anchors a **separate** helper landing platform; the row itself is not a collision surface. Hero text is measured as individual exclusion rectangles, leaving clear space beside shorter lines. About, Tech Stack, Projects, and Experience markers sit at their existing section headings. Contact's marker is its existing action row. The form is registered only as an exclusion rectangle. Project links and contact links keep their original href, target, and handlers.

## Browser behavior and geometry rules

Clicking View Work at 1440px scrolled to `/#projects` (`scrollY=3135`) and completed the Quick Bite reveal. Its outer support remained at document y=3375.625 while the inner `.card` was visually lifted 2px on hover. After clicking inside the card, browser scrolling changed to `scrollY=3319`; the outer support still measured y=3375.625. The project screenshot showed the ordinary card border, typography, spacing, and action row. The 768px Hero screenshot showed normal header/navigation, headline, and three CTAs with no Game Mode UI yet.

Reveal wrappers provide `pending`, `moving`, and `settled` states. A newly viewed Quick Bite support was observed as `settled`; offscreen Stack and secondary project supports remained `pending`. Geometry reads include planned positions for these offscreen supports but expose only settled supports as active collision surfaces. Pending/moving targets remain disabled. The current visible neighborhood controls `revealsSettled`, so distant pending sections cannot prevent Hero spawn forever. Reveal and card translate offsets are removed from measured base geometry; resize, font, viewport, and reveal events invalidate the snapshot only during an observed game session. Pure card hover leaves the outer support stable.

Task 4 must validate the helper route, exact control height, minimum usable viewport height, and content clearance with real movement witnesses. The measurements above are layout evidence, not proof that every 768px connection is safe.

## Task 4 route validation

The deterministic builder was validated against the recorded 768, 1024, and 1440px layouts. The 768px fixture includes all six section anchors, eight registered card surfaces, five action rows, 13 individual links, and all eight content exclusions. Every accepted connection is replayed through the production `step()` physics in both directions; registered card tops participate in that full-world collision simulation, so an intervening top can intercept and reject a witness.

The measured route uses a fixed 1/120s step, 240px/s horizontal speed, 1100px/s² gravity, and 580px/s jump speed. The jump was raised from the provisional value only far enough to retain a clearance margin between the lower project action terrace and Experience at 768px. Helpers are generated from the measured gutters and action-row geometry. The narrow responsive fall lanes are 12–16px support strips whose centered 24px avatar remains inside the viewport and can leave outward without crossing readable content. Action terraces extend only as far as needed to put each registered link inside the 110px horizontal and 150px vertical interaction reach. Social-Media and Fresh-Cart share a lower terrace because their wrapped rows are only 26px apart at 768px.

The computed minimum **usable** gameplay height is 231px: simulated jump apex plus the 32px avatar and 48px of platform/head clearance. Runtime eligibility must subtract the measured sticky header and the eventual Task 8 control strip from the visual viewport before passing `usableHeight`; a 900px browser leaves about 720px in the current survey. Automated boundary coverage accepts exactly 231px and rejects 230px. A final browser sweep immediately above and below the full viewport boundary remains part of Task 8, once the actual control strip exists.

Recovery uses the union of support strips and expanded witnessed trajectory corridors. Falling outside that envelope remains playable only when the avatar horizontally overlaps a registered lower landing surface; unrelated lower platforms no longer suppress recovery. Validation is cached by the meaningful geometry, target, obstacle, tuning, viewport, and version data and fails closed when the finite surface/witness budget cannot prove all checkpoints and enabled actions.

The active-session browser cases for reveal-start pausing and observer teardown remain integration checks for Task 7, when a playable session is first mounted. Task 3's isolated tests verify that reveal events are emitted only for an active session and that geometry observers batch invalidation and dispose their listeners.

Task 3 follow-up (2026-09-16): At 1024 × 900, the rendered page contained six section registrations, eight surfaces, five action rows, 13 action targets, and eight content exclusions. The header bottom was 123.78px with `data-game-menu-open="false"`. The Quick Bite outer support measured document y=3350.09 after scrolling to Projects and stayed there when clicked/hovered; its inner `.card` measured y=3348.09 with a `translateY(-2px)` transform. The support's reveal state moved and settled as it entered view, while its unvisited state had been `pending`. An isolated `readGeometry` regression now verifies that a moving support is planned but inactive and that moving or hidden actions are disabled. The page kept its ordinary layout and controls. Active-session pause and observer teardown still require the Task 7 session UI to be mounted.
