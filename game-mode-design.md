# Portfolio Game Mode — consolidated MVP design

Date: 2026-09-15  
Status: Approved by the user for implementation planning. Implementation still requires separate approval.  
Existing project: `E:\Full Stack Projects\Portfoliio`

## 1. Purpose and scope

Add an optional, lightweight platforming experience over the existing homepage. The portfolio remains visible and usable; the avatar physically travels between its sections. Reuse existing content, design tokens, links, handlers, and navigation. Do not duplicate the portfolio or introduce destinations or product actions.

The MVP is keyboard-only, deterministic, and open-ended. It needs no general-purpose game engine or additional gameplay dependency. Touch controls and per-session platform variation are deferred.

This document records the agreed design, not an implementation plan. Exact file changes and implementation sequencing will be proposed only after this review. The portfolio repository remains unchanged.

## 2. Existing project context

Source inspection established:

- Next.js 16.3.2 App Router, React 19.2.8, TypeScript, Tailwind CSS 4.
- Framer Motion for reveal/stagger motion; CSS hero entrances and ticker animation; Lucide icons; MDX; React Hook Form, Zod, and Resend for contact functionality.
- Homepage order: Hero, About, Tech Stack, Projects, Experience, Contact. Separate public content routes: `/work/quick-bite` and `/resume`.
- Shared shell: status ticker, sticky header, main content, footer. Desktop navigation begins at the existing `md` breakpoint. Mobile menu opening locks body scrolling and Escape closes it.
- Navigation uses Next.js links and fragment destinations. Header scrollspy uses IntersectionObserver. Project cards contain distinct links rather than one whole-card action.
- Shared containers, button/card/link CSS classes, warm light/dark palettes, restrained blue accents, and Fraunces/Archivo/IBM Plex Mono typography define the visual system.
- Content is local and typed. Most portfolio content is server-rendered; interactive components use local React state. There is no existing global game state or game library.

Relevant integration areas are the homepage, Hero, shared layout/Header, section components, ProjectCard, motion wrappers, and global styles. Existing documentation has some stale implementation-status statements; actual source determines current behavior. Rendered-layout verification remains necessary.

## 3. Entry, availability, and exit

### Entry

Place Game Mode beside the existing hero CTAs, not in the sticky header. Opening it displays a small accessible modal using existing typography, colors, and button styling:

> **Start Game Mode?**  
> Game Mode includes character movement, jumping and falling, automatic page scrolling, and visual animations. Would you like to continue?

Actions: **Continue** and **Exit**. Exit and Escape dismiss the modal and restore focus to its trigger. Focus stays within the modal while open.

No game physics, gameplay input ownership, game scrolling, or game animation begins before Continue. Continue initiates eligibility and route validation before safe spawn. Failure to establish a safe layout must not start gameplay.

Game Mode does not use `prefers-reduced-motion` to alter the approved experience. The confirmation precedes full gameplay for everyone. Existing portfolio motion behavior outside Game Mode is unchanged.

### Eligibility

- Minimum width: 768 CSS pixels.
- Minimum usable height is a measured result of rendered layout, header/controls clearance, safe spawn, and jump validation, not an arbitrary constant.
- At unsupported sizes, preserve normal browsing and show a quiet **Larger window required** state.
- On clearly touch-only devices without practical keyboard input, use a quiet **Keyboard required** state; no virtual controls or separate mobile physics.
- Capability detection is heuristic: touch capability alone must not exclude touchscreen laptops, and width alone does not establish keyboard availability.
- Resizing or zooming into an unsafe viewport immediately pauses play and clears held input while preserving the active checkpoint. Restored size requires route validation and explicit Resume.

### Exit

Exit Game Mode is available throughout the session, including paused and repositioning states. Exit removes temporary game visuals, listeners, observers, animation loops, and session/input state. Preserve the current scroll position and restore focus without scrolling back to Hero. Navigating away from the homepage performs full cleanup; returning does not reactivate the game.

## 4. World architecture and responsibilities

Use a small client-side game layer over the existing server-rendered homepage. Keep character and platform positions in document coordinates. Render outside clipping containers such as the hero; the sticky header and gameplay controls are UI outside the physical world.

Keep responsibilities focused:

- **Session controller:** lifecycle, pause reasons, transitions, cleanup.
- **Input handling:** direction, jump requests, and interaction requests; no generic input framework.
- **Simulation:** movement, gravity, deterministic one-way collision, and route-based recovery detection.
- **World geometry:** registrations, base surface measurements, deterministic helper connections, and validation.
- **Interaction selection:** grounded proximity, visible selection, and activation of the registered existing element.
- **View following:** ordinary page scroll adjustments and explicit ownership of game-controlled repositioning.
- **Presentation:** avatar, flags, helper platforms, hints, entry modal, and controls.

These are responsibilities, not a requirement for one file or component per item. Keep per-frame simulation independent of portfolio-wide React rerenders. Do not implement a custom camera engine.

Physical surfaces, interaction targets, and checkpoints are separate registrations. A surface may support the avatar without having an action; each target maps to exactly one existing link/action; each checkpoint identifies a deliberate safe landing surface.

## 5. Platforms, geometry, and route validation

Use selected real surfaces and helper platforms only where needed. Do not turn every DOM element into a platform. Keep section checkpoints and interaction ledges anchored to content. Use deterministic helper connections with no shuffling between sessions or during ordinary play.

Validate every required connection in both directions using the same movement and jump rules as gameplay. A descent alone does not prove a return path exists. Include clearance and action-row reachability, and avoid obstructing text or interactive elements.

### Stable geometry

- Purely visual hover transforms do not move collision surfaces; use stable/base surfaces for those effects.
- Real layout, reveal, font, and responsive positioning changes require geometry updates and route validation.
- Do not assume ResizeObserver detects transforms or that one startup measurement remains valid.
- Pause before changing geometry that affects playable positioning. Preserve safe footing where valid; otherwise reposition through the checkpoint/recovery flow.
- Do not silently remove or move the surface supporting the avatar.
- Cache validated geometry; avoid continuously remeasuring the entire page or reacting to decorative hover motion.
- If a safe route cannot be produced, stay paused, preserve the checkpoint, and allow normal browsing and Exit. Successful revalidation never automatically resumes a Paused session.

Exact platform placements and minimum usable height are measured validation outputs. Determine them during the planned layout-validation work. They are not unresolved product choices to fill with arbitrary coordinates.

## 6. Physics and recovery boundaries

All DOM-backed and helper platforms use identical one-way collision behavior:

- Land only when descending and crossing the platform top from above with horizontal overlap.
- Pass upward through platforms from below.
- Sides and undersides are not walls or ceilings; side contact never snaps the avatar onto a surface.
- Walking off an edge causes natural falling.
- Use a fixed avatar collision box independent of visual animation.

Keep simulation deterministic and frame-rate tolerant. Do not add slopes, full rectangular collision, intentional moving-platform mechanics, drop-through controls, combat, or advanced platformer systems.

Recovery boundaries derive from the validated playable route rather than a single global Y threshold. Intentional descent and falling toward valid lower platforms remain gameplay. Recovery occurs only after genuinely leaving the approved playable path.

## 7. Checkpoints and journey

Create one deliberate checkpoint for each of Hero, About, Tech Stack, Projects, Experience, and Contact. Helper platforms are not automatically checkpoints.

After Continue and successful validation, spawn on a dedicated helper platform near the hero CTA area, without covering text or actions. Activate it as the initial checkpoint and connect it to the route toward About.

Each checkpoint has a small flag:

- Inactive: red, meaning inactive only—not error or danger.
- Active: green plus a distinct active-state mark/shape.
- Exactly one checkpoint is green during the initialized game session.
- Safe landing activates a checkpoint automatically and resets the previous one to inactive, including when travelling backward.
- The green flag always identifies the actual recovery destination.

Optional polish is limited to a subtle activation wave/pop. No particles, sound, or elaborate effects.

Recovery sequence: pause physics; clear both velocity components and held input; restore to the active checkpoint; return the view; resume when stable, unless interrupted by a pause condition. If the checkpoint's current geometry is invalid, remain paused until safe placement is validated.

Contact is the last route section, not an ending. Continue exploring, use existing Contact actions, travel backward, or exit. No lives, health, damage, score, penalties, death screen, victory screen, celebration flow, or automatic completion exit.

## 8. Controls and intentional interaction

| Input | During gameplay ownership |
|---|---|
| Left / Right Arrow | Move |
| Space | Jump; suppress native page scrolling |
| Enter | Activate the already visibly selected eligible target once per press |

Do not hijack these keys in inputs, textareas, editable regions, or ordinary focused interactive controls. Suspend gameplay ownership for native control interaction. Preserve existing contextual Escape/menu behavior; Escape is not a global game shortcut. Clear held input on pause, focus loss, recovery, and relevant transitions.

Interaction requires grounding and defined reach of a registered target. Every target maps to one existing action. Choose the nearest qualifying target by horizontal distance, with registered order/DOM order as a stable tie-breaker. Only the selected element is highlighted, with a specific hint such as **Press Enter · Case Study**, **Press Enter · Core Service**, or **Press Enter · GitHub**.

Moving naturally updates selection. Enter cannot select and activate an unseen target in the same press: the exact target must already be visibly selected, and eligibility is rechecked at activation time. Cancel if it is no longer eligible. No automatic touch activation, selection menus, cycling keys, or duplicated route logic.

Activate the registered real link/handler, preserving native navigation and external-link behavior. Add helper ledges near existing action rows only where required for reachability. Do not invent whole-card actions or make contact-form submission a proximity-triggered shortcut.

## 9. Lifecycle, scrolling, and navigation

| State | Responsibility |
|---|---|
| Off | Normal portfolio; no active game listeners or animation work |
| Entry confirmation | Accessible modal; no gameplay yet |
| Playing | Physics, selection, and page-following |
| Paused | Clear held input; stop physics/following; normal browsing remains usable |
| Repositioning | Temporary non-interactive simulation state for safe spawn, navigation, recovery, or explicit Resume; Exit remains usable |

Keep pause reasons explicit internally: browsing, focus loss, native-control/menu interaction, and unsafe layout. No pause reason auto-resumes. Clearing the final reason enables Resume only after safety validation.

Repositioning can complete into Playing as already authorized by Continue, an intentional same-page action, recovery, or explicit Resume. Any intervening pause condition overrides that transition and requires explicit Resume.

### Following and manual browsing

Use normal page scrolling when the character approaches the upper or lower gameplay viewing boundary. Account for the sticky header and control strip. Avoid repeated overlapping smooth-scroll animations.

Manual wheel/trackpad scrolling, scrollbar use, or clearly user-initiated browsing pauses gameplay, preserves the avatar's world position, and clears held input. Show Resume Game while paused. Resume returns the view to the character before resuming once it is inside the gameplay viewing band and geometry is valid.

Explicitly distinguish scroll ownership: automatic following, same-page game interaction, controlled repositioning, and manual browsing. A scroll event alone does not identify intent. User browsing input interrupts game-controlled scrolling and enters Paused.

### Existing destinations

- **Same-page:** suspend physics and following; activate the existing link/handler; allow its navigation/scroll behavior to finish; place the avatar on the destination's registered safe landing surface; resume when stable. Safe checkpoint landing updates the active checkpoint.
- **Missing explicit landing:** use a validated helper landing within the destination section. If safe placement remains impossible, exit gracefully rather than guessing the nearest platform.
- **Different page route:** full cleanup. Returning home requires fresh activation and confirmation.
- **External links:** preserve existing behavior exactly, including new tabs. Focus loss pauses and clears input. Returning focus always requires explicit Resume.

Leaving the physical playable route means recovery; leaving the homepage URL route means cleanup. These are distinct conditions.

## 10. Visual presentation and accessibility

Use a small developer avatar: simple human silhouette, subtle hoodie detail, two eyes/minimal face, and existing theme tokens. No laptop, accessories, detailed illustration, or retro/cartoon visual system.

Animation set: still idle; two-pose run; distinct rising/falling poses; brief restrained landing compression. Visual animation never changes the collision box.

Below the sticky header, outside the physical world, show compact controls: **← → Move**, **Space Jump**, **Enter Interact**, **Exit Game Mode**, and **Resume Game** while paused. Fit this UI within the validated usable viewport.

Preserve readable content, native links, focus indicators, and normal mobile browsing. Use accessible modal naming and focus management, textual interaction hints, and non-color checkpoint identification. Announce meaningful game state changes to assistive technology, not frame-by-frame movement. Temporary game visuals must not create a redundant navigation tree.

## 11. Verification and acceptance

- **Physics:** descending crossings, upward pass-through, side rejection, walking off edges, natural lower landings, fixed collision bounds, and behavior across frame rates.
- **Routes:** real movement rules validate forward/backward connections, safe spawn, checkpoint placement, action ledges, and route-derived recovery boundaries.
- **Geometry:** hover stability, reveal/layout changes, font reflow, resizing, zoom, loss of supported size, safe footing preservation, and explicit Resume after validation.
- **Targets:** grounded reach, deterministic tie-breaking, one highlight, visible-before-activation rule, stale target cancellation, held-Enter suppression, hidden/disconnected target rejection, and actual existing navigation behavior.
- **Lifecycle:** modal cancellation, focus/menu/form ownership, manual versus controlled scrolling, interruptions during repositioning, explicit Resume, route cleanup, Exit scroll preservation, and no work left active after exit.
- **Browser/layout:** both themes; supported widths and verified minimum height; header/control clearance; readable unobstructed content; normal mobile experience; keyboard and screen-reader behavior.
- **Performance:** no unnecessary homepage-wide rerenders or continuous whole-document measurement; no dormant game loop/listeners; preserve normal portfolio loading behavior. Run applicable existing project checks during implementation, not as a substitute for gameplay/browser validation.

## 12. Deferred polish and next gate

Deferred: bounded per-session path variation, touch controls, custom detailed assets, sound, particles, and elaborate animation. Touch input may later feed the same small movement/request state without redesigning physics, but no hypothetical input framework is required now.

After the user reviews and approves this consolidated document, use the Superpowers writing-plans workflow to produce a detailed, proportional implementation plan. It must identify existing files likely to change, justified new files, measured-layout work, implementation order, and verification. After presenting that plan, stop for explicit approval before code changes.
