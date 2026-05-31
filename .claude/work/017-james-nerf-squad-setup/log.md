# Work Log: 017-james-nerf-squad-setup

This log is chronological and append-only.

## [2026-05-23] open | Work folder created

Sonja opened work folder `017-james-nerf-squad-setup` and recorded the brief at `brief.md`. The repository clone has been placed at `Github/` per the team convention. Next: backfill or register-and-park dispatch.

## [2026-05-23] reopen | Tim added the game code; work folder unparked

Tim reported that James-Nerf-Squad has had files added. Verified: the working tree now carries `index.html` (canvas-based entry), `css/style.css` (40 lines), and `js/` with fifteen modules totalling roughly 2,700 lines. The README has been expanded to 7.5 KB describing the project, module map, controls, and gameplay. The files are not yet committed to the repository (only the original "Initial commit" `9d6eb02` is on `main`).

Tim also reported a behavioural bug: **keys appear to be sticking**. Likely candidates: `js/input.js` (the held-map; keydown/keyup pair correctness; modifier-key handling; focus-loss between keydown and keyup), and `js/touch.js` (touch buttons writing into the same input state without clearing). Sean diagnoses during the setup build, after the backfill identifies the architecture.

`brief.md` updated to reflect the active state, the four-agent backfill plan, and the keys-sticking bug as a definition-of-done item.

## [2026-05-23] dispatch | Four-agent backfill on the substantive code

Sonja dispatched Tad, Jacob, Jed, and Carol in parallel in the background. Each reads the working tree (the code is not yet committed; the backfill is read-only on files so commit state is fine for review). Each writes to this work folder.

## [2026-05-24] return | Carol test of PR7 — conditional pass

All three functional areas pass. No blockers to merge.
- Pause fix: guard confirmed at game.js line 737 — `if (screen === 'game' && this.ls)`. No logic change needed; comment added by Sean.
- Auto-use toggle: `autoUsePowerups: false` in `this.ls`. Pause menu renders 3 items (RESUME / AUTO POWERUPS / EXIT TO MENU). Toggle key: Shift. Pickup branch correct. Announcement: "Auto-used: [label]."
- Inventory rename: zero hits for all old identifiers. All help text says "Inventory".
- Pre-existing gaps (not regressions): missing `<main>` landmark in index.html; no per-item focus announcement on pause menu items.
Report: carol-test-pr7.md

Presenting to Tim for merge approval.

## [2026-05-24] merge | PR7 merged to main

Tim approved (Q119A) with correction: "Auto-used:" → "Auto Use:". Sonja applied fix at f00c652 directly on the branch before merge. PR7 merged via squash, merge commit c961c67.
