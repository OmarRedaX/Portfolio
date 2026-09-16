# Game Mode rendered-layout validation

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
