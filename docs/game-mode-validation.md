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

The active-session browser cases for reveal-start pausing and observer teardown remain integration checks for Task 7, when a playable session is first mounted. Task 3's isolated tests verify that reveal events are emitted only for an active session and that geometry observers batch invalidation and dispose their listeners.

Task 3 follow-up (2026-09-16): At 1024 × 900, the rendered page contained six section registrations, eight surfaces, five action rows, 13 action targets, and eight content exclusions. The header bottom was 123.78px with `data-game-menu-open="false"`. The Quick Bite outer support measured document y=3350.09 after scrolling to Projects and stayed there when clicked/hovered; its inner `.card` measured y=3348.09 with a `translateY(-2px)` transform. The support's reveal state moved and settled as it entered view, while its unvisited state had been `pending`. An isolated `readGeometry` regression now verifies that a moving support is planned but inactive and that moving or hidden actions are disabled. The page kept its ordinary layout and controls. Active-session pause and observer teardown still require the Task 7 session UI to be mounted.
