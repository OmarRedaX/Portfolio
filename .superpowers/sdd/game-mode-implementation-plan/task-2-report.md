# Task 2 evidence report — lifecycle state machine and cancellation

## Delivered scope

- Added shared lifecycle types to `lib/game/model.ts`: `Phase`, `SessionState`, `SessionEvent`, and `SessionEffect`.
- Added the pure `createSession()` and exhaustive `transition()` reducer in `lib/game/session.ts`.
- Added `tests/game/session.test.ts` with regression and lifecycle coverage.

## Lifecycle evidence

The reducer keeps all asynchronous work as named effects. A caller starts validation or repositioning only after receiving `validate` or `reposition`, and uses `state.operation` as the cancellation token for its reposition completion.

- `OPEN` changes only `off` to `confirming`.
- `CONTINUE` starts spawn repositioning, clears motion/input, and requests validation; it never starts play itself.
- `PAUSE` preserves the checkpoint, deduplicates the blocking reason, increments the operation token, clears input/velocity, and clears the active reposition owner.
- `CLEAR_REASON` only removes a blocker. It never changes phase.
- `RESUME` starts a fresh `resume` reposition only while paused with no blockers and a valid layout.
- `VALIDATED` updates layout state without entering play. Invalid layout pauses with a layout blocker; a later valid result clears that blocker but remains paused until explicit `RESUME`.
- `SETTLED` enters play only for the current operation during uninterrupted repositioning with no blockers and a valid layout.
- `EXIT` invalidates the operation token and emits input, velocity, and disposal effects.

The integration layer must abort validation/reposition work on unmount and dispatch `SETTLED` only for the current `operation`; the reducer rejects stale settlement after any pause or exit. `VALIDATED` after `off` is also ignored.

## Test-first evidence

1. Added the required focus-clear regression before `lib/game/session.ts` existed.
2. Ran `npm run test:game`; TypeScript failed as expected with `TS2307: Cannot find module '../../lib/game/session'`.
3. Implemented the reducer and expanded coverage for spawn validation, stale settlement after focus pause and exit, repeated pause deduplication/token invalidation, invalid/valid layout without automatic resume, resume guards, recovery versus exit, and checkpoint retention.

## Verification

| Command | Result |
| --- | --- |
| `npm run test:game` | Pass: 18 tests (9 physics, 9 lifecycle). Initial sandbox execution compiled but Node could not spawn test workers (`EPERM`); the identical local command passed when rerun with the approved elevation. |
| `npx tsc --noEmit --incremental false` | Pass |
| `npm run lint` | Pass |
| `npx prettier --check lib/game/session.ts tests/game/session.test.ts` | Pass. `model.ts` retains its pre-existing repository style so this task does not rewrite unrelated model declarations. |
| `git diff --check` | Pass |

## Scope and concerns

Only the Task 2 lifecycle files and this report were changed. Existing untracked `AGENTS.md`, `game-mode-design.md`, and `game-mode-implementation-plan.md` remain untouched. No browser work, push, deployment, or unrelated formatting was performed.
