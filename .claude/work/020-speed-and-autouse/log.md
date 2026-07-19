# Work Log: 020-speed-and-autouse

This log is chronological and append-only.

## [2026-06-01] open | Work folder created

Tim answered Q-JNS10A (fix auto-use hint and persist) and Q-JNS11B (Easy = 50% speed, Hard = current). Brief drafted covering three requirements: R-01 hint label fix, R-02 auto-use persistence, R-03 Easy/Hard game speed in Settings. Dispatching Jacob and Tad in parallel.
- [2026-06-01 09:56:22] subagent completed

## [2026-06-01] return | Tad requirements update complete

Tad updated `docs/requirements.md`: added sprint 020 requirements section (R-01 through R-03 with acceptance criteria), appended sprint 020 items to Definition of Done. Change record at `tad-requirements-update.md`. Waiting on Jacob before dispatching Sean.
- [2026-06-01 09:58:43] subagent completed

## [2026-06-01] return | Jacob architecture review complete

All parameters mapped. R-02: four code sites in game.js — _toggleAutoUsePowerups (524-527), level-state default to remove (637), pickup read (853), pause-menu draw (1134). R-03: scroll (game.js 735), enemy movement (enemy.js 32/40 via speedMult arg to updateEnemy), enemy projectile (enemy.js 75 inline literal), boss movement (boss.js 41 local var), boss projectile (boss.js 83/91/96/102-103). Dart loop at game.js 769 covers player/squad/enemy darts — multiply at spawn only, never in the loop. Settings: drawSettings at screens.js 223-259, ALT BUTTON LAYOUT (index 6) is the pattern; add SPEED as index 7, bump items count at game.js 298 from 7 to 8. R-01 note: pause menu has both a per-item hint (screens.js 274, says SHIFT) and a footer (screens.js 288, says SHIFT=TOGGLE AUTO). Shift IS a direct shortcut (game.js 319). Q-JNS12 raised for Tim before Sean touches R-01.
- [2026-06-01 10:03:07] subagent completed
- [2026-06-01 10:06:18] subagent completed

## [2026-06-01] return | Sean R-02 and R-03 complete

PR #18 open: https://github.com/timdixon82/James-Nerf-Squad/pull/18. R-02: autoUsePowerups moved to gs, wired into save/load, toggle calls save(). R-03: difficulty field on gs, SPEED row in Settings at index 7, speedMult (0.5 easy/1 hard) computed per frame in _updateGameplay and applied at scroll, enemy movement, enemy projectile, boss movement, all four boss projectile spawns. Dart loop untouched. constants.js untouched. Lint clean. R-01 still blocked on Q-JNS12. Awaiting Tim's answer.
- [2026-06-01 10:09:40] subagent completed
- [2026-06-01 11:31:35] subagent completed

## [2026-06-01] return | Sean R-01 complete — branch complete

R-01 committed (abc8899). Shift shortcut removed from pause menu (game.js line 331). Hint changed to ENTER (screens.js line 284). Footer updated to 'UP/DOWN=SELECT  ENTER=TOGGLE/CONFIRM  ESC=RESUME', removing all Shift mentions (screens.js line 298). PR #18 updated. All three requirements built. Dispatching Jed and Carol in parallel.
- [2026-06-01 11:34:23] subagent completed

## [2026-06-01] return | Jed security review complete — all clean

All six areas pass. Save/load guards verified (boolean strict equality for autoUsePowerups, allowlist for difficulty). speedMult confirmed at five spawn/move sites only — dart loop untouched, player and squad fire unaffected. save() called on user interaction only, not per frame. No eval/innerHTML/fetch. R-01 Shift removal complete and clean. Signed off. Awaiting Carol.
- [2026-06-01 11:35:23] subagent completed

## [2026-06-01] gate | Merge gate passed — presenting to Tim

Carol: 20/20 checks pass, no rework. Jed: signed off. CI: 0 errors. Jacob: architecture endorsed. All three requirements verified. Pre-existing meta-viewport axe-core violation noted as a follow-up (not introduced by this branch). Awaiting Tim's approval to merge PR #18.
- [2026-06-21 19:07:42] subagent completed
- [2026-06-21 19:07:47] subagent completed
- [2026-06-21 19:07:57] subagent completed
- [2026-06-21 19:08:00] subagent completed
- [2026-06-21 19:08:00] subagent completed
- [2026-06-21 19:08:01] subagent completed
- [2026-06-21 19:08:02] subagent completed
- [2026-06-21 19:08:14] subagent completed
- [2026-06-21 19:08:19] subagent completed
- [2026-06-21 19:08:29] subagent completed
- [2026-06-21 19:08:32] subagent completed
- [2026-06-21 19:08:32] subagent completed
- [2026-06-21 19:08:33] subagent completed
- [2026-06-21 19:08:34] subagent completed
- [2026-06-21 19:08:34] subagent completed
- [2026-06-21 19:08:43] subagent completed
- [2026-06-21 19:08:45] subagent completed
- [2026-06-21 19:08:45] subagent completed
- [2026-06-21 19:08:47] subagent completed
- [2026-06-21 19:08:54] subagent completed
- [2026-06-21 19:08:54] subagent completed
- [2026-06-21 19:09:05] subagent completed
- [2026-06-21 19:09:27] subagent completed
- [2026-06-21 19:09:32] subagent completed
- [2026-06-21 19:09:59] subagent completed
- [2026-06-21 19:10:31] subagent completed
- [2026-06-21 19:11:03] subagent completed
- [2026-06-21 19:11:35] subagent completed
- [2026-06-21 19:11:50] subagent completed
- [2026-06-21 19:27:07] subagent completed
- [2026-06-21 20:10:02] subagent completed
- [2026-06-21 20:21:19] subagent completed
- [2026-06-22 15:48:26] subagent completed
- [2026-07-18 20:18:55] subagent completed
- [2026-07-18 20:19:31] subagent completed
- [2026-07-18 20:20:03] subagent completed
- [2026-07-18 20:20:35] subagent completed
- [2026-07-19 08:16:21] subagent completed
- [2026-07-19 08:16:53] subagent completed
- [2026-07-19 08:17:26] subagent completed
