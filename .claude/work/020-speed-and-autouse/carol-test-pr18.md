# Test Report: PR #18 — feat/020-speed-and-autouse

- Tester: Carol
- Date: 2026-06-01
- Branch: feat/020-speed-and-autouse
- PR: https://github.com/timdixon82/James-Nerf-Squad/pull/18

## Summary verdict

Pass. All 20 checks pass. No rework items. The branch is clear for the merge gate.

## Functional checks

### Check 1: R-01 Shift removed from pause handler

File: `js/game.js`, lines 327-332.

The `case 'pause'` block handles ArrowUp, ArrowDown, Enter/Space (to call `_activatePauseItem`), and Escape/k.pause/p. There is no branch on `key === k.switch` or `key === 'Shift'` in the pause case. No path calls `_toggleAutoUsePowerups` from a Shift key event.

Result: PASS

### Check 2: R-01 hint label on AUTO POWERUPS item

File: `js/screens.js`, line 284.

The items array in `drawPauseMenu` reads:
`{ label: 'AUTO POWERUPS: ' + (autoUsePowerups ? 'ON ' : 'OFF'), hint: 'ENTER' }`

The hint value is `'ENTER'`, not `'SHIFT'`.

Result: PASS

### Check 3: R-01 footer text

File: `js/screens.js`, line 298.

Footer string: `'UP/DOWN=SELECT  ENTER=TOGGLE/CONFIRM  ESC=RESUME'`

No mention of Shift. The string is consistent with the pattern used on the Settings and title screens elsewhere in the codebase.

Result: PASS

### Check 4: R-02 gs initialisation and absent from ls

File: `js/game.js`.

Constructor, line 25: `autoUsePowerups: false` is present in the `this.gs` literal.

`startLevel()` (lines 638-661) builds the `this.ls` literal. A grep for `ls.autoUsePowerups` in game.js returns zero hits in `startLevel` or anywhere in the `this.ls` literal. The field is absent from level state.

Result: PASS

### Check 5: R-02 save and load

File: `js/game.js`.

Save payload, line 78: `autoUsePowerups: this.gs.autoUsePowerups`

Load handler, line 102: `self.gs.autoUsePowerups = data.autoUsePowerups === true;`

The `=== true` strict equality guard restores `false` for any save that lacks the field or stores a non-boolean truthy value.

Result: PASS

### Check 6: R-02 toggle writes to gs and calls save

File: `js/game.js`, lines 534-541.

`_toggleAutoUsePowerups` reads and writes `this.gs.autoUsePowerups` (line 535) and calls `this.save()` (line 536). No reference to `this.ls.autoUsePowerups` in this function.

Result: PASS

### Check 7: R-03 gs literal and save/load

File: `js/game.js`.

Constructor, line 26: `difficulty: 'hard'`

Save payload, line 79: `difficulty: this.gs.difficulty`

Load handler, line 103: `self.gs.difficulty = (data.difficulty === 'easy') ? 'easy' : 'hard';`

Any value that is not exactly `'easy'` — including a missing field from an old save — resolves to `'hard'`.

Result: PASS

### Check 8: R-03 SPEED row in Settings screen

File: `js/screens.js`, lines 258-266.

`drawSettings` accepts `difficulty` as the seventh parameter. The SPEED row is drawn at `spY = lhY + rowH + 4`, which places it after ALT BUTTON LAYOUT. `spSel` is set when `selectedIdx === bindItems.length + 1`, which equals index 7 (6 bind items + 1). The value rendered is `'EASY'` or `'HARD'` based on the passed difficulty value.

Result: PASS

### Check 9: R-03 Settings handler

File: `js/game.js`, lines 303-325.

`var items = 8` sets the wrap point. The ArrowDown/ArrowUp branches wrap modulo 8. At index 7, Enter executes:
- Toggles `this.gs.difficulty`
- Calls `this.save()`
- Calls `playMenuConfirm()`
- Builds `diffMsg` ("Easy mode." or "Hard mode.")
- Calls `announce(diffMsg)`
- Calls `Speech.narrate(diffMsg, 'normal')`

Result: PASS

### Check 10: R-03 speedMult applied to scroll

File: `js/game.js`, line 740 and 747.

`var speedMult = this.gs.difficulty === 'easy' ? 0.5 : 1;` is declared after the early return guard at line 738. Line 747: `var sp = (this.reducedMotion ? REDUCED_SCROLL_SPEED : cfg.scrollSpeed) * speedMult;` applies the multiplier.

Result: PASS

### Check 11: R-03 speedMult applied to enemy horizontal movement

File: `js/enemy.js`, lines 25-66.

Function signature: `function updateEnemy(e, player, darts, platforms, groundY, particles, camX, speedMult)`. Guard at line 27: `speedMult = speedMult || 1;`.

Flying branch, line 33: `e.x += e.vx * speedMult;`
Ground branch, line 41: `e.x += e.vx * speedMult;`

Both horizontal movement sites apply the multiplier. The gravity-driven vertical step (`e.y += e.vy;`) is correctly not multiplied.

Result: PASS

### Check 12: R-03 speedMult applied to enemy projectile

File: `js/enemy.js`, line 76.

`var spd = 3.5 * speedMult;` The projectile velocity components (`vx`, `vy`) are derived from `spd`, so the multiplier is applied.

Result: PASS

### Check 13: R-03 speedMult applied to boss movement

File: `js/boss.js`, lines 33-71.

Function signature: `function updateBoss(boss, player, darts, platforms, groundY, particles, camX, speedMult)`. Guard at line 35: `speedMult = speedMult || 1;`.

Line 42: `var speed = (0.6 + boss.phase * 0.3) * speedMult;`

Both the flying boss step (`boss.x += boss.vx * speed;`) and the ground boss step (`boss.x += boss.vx * speed;`) multiply by `speed`, which already incorporates `speedMult`. The multiplier covers all boss phases.

Result: PASS

### Check 14: R-03 speedMult applied to all four boss projectile spawn literals

File: `js/boss.js`, lines 80-107.

- Type 1 spread fan (lines 83-85): `Math.cos(rad) * 4 * speedMult`, `Math.sin(rad) * 4 * speedMult`
- Type 2 radial burst (lines 91-93): `Math.cos(angle) * 3.5 * speedMult`, `Math.sin(angle) * 3.5 * speedMult`
- Type 3 aimed shot (lines 96-98): `(dx / dist) * 5 * speedMult`, `(dy / dist) * 5 * speedMult`
- Type 3 side shots (lines 101-104): `Math.cos(srad) * 4.5 * speedMult`, `Math.sin(srad) * 4.5 * speedMult`

All four projectile spawn sites include `speedMult`.

Result: PASS

### Check 15: R-03 dart movement loop untouched

File: `js/game.js`, lines 778-792.

The shared dart integration loop at line 781: `d.x += d.vx; d.y += d.vy;` No `speedMult` is applied here. Player darts and squad-member darts use the base velocity baked in at spawn time, as specified.

Result: PASS

### Check 16: R-03 constants.js untouched

A `git diff main -- js/constants.js` on the feature branch returns no output. No changes were made to `js/constants.js`.

Result: PASS

## Accessibility checks

### Check 17: announce called with correct difficulty strings

File: `js/game.js`, lines 316-317.

`var diffMsg = this.gs.difficulty === 'easy' ? 'Easy mode.' : 'Hard mode.';` followed by `announce(diffMsg);`. The strings match the brief requirement exactly.

Result: PASS

### Check 18: narrate called with the same string

File: `js/game.js`, line 318.

`Speech.narrate(diffMsg, 'normal');` uses the same `diffMsg` variable, so the narrated string is identical to the announced string.

Result: PASS

### Check 19: AUTO POWERUPS keyboard navigation in pause menu

File: `js/game.js`, lines 327-332, and `js/screens.js`, lines 282-286.

The pause menu contains three items (RESUME at index 0, AUTO POWERUPS at index 1, EXIT TO MENU at index 2). ArrowUp and ArrowDown navigate the `pauseMenuIdx`, wrapping modulo 3. Pressing Enter or Space calls `_activatePauseItem`, and at index 1 that calls `_toggleAutoUsePowerups`. No Shift dependency exists at any point in this path.

Result: PASS

## CI check

### Check 20: npm run lint

Command: `npm run lint` from `/Users/timdixon/Code/Github/James-Nerf-Squad`.

Exit code: 0 (success via ESLint non-zero threshold on errors only).

Output: `0 errors, 98 warnings`. All 98 warnings are pre-existing no-unused-vars findings in utils.js and other files not changed by this branch. No new errors or warnings were introduced by R-01, R-02, or R-03.

Note from Sean's build report: Sean also ran Pa11y (WCAG 2.2 AAA automated) and axe-core. Pa11y reported no issues. axe-core reported one pre-existing `meta-viewport` violation that predates this branch. That finding is logged as a TASK below for exception-record treatment.

Result: PASS

## Rework items

None. All 20 checks pass.

## Definition of done cross-check

- R-01: Pause menu AUTO POWERUPS hint changed from SHIFT to ENTER. Confirmed (Check 2).
- R-02: Auto-use setting survives level transitions and browser refresh. Toggling calls save(). Confirmed (Checks 4, 5, 6).
- R-03: Settings screen shows SPEED: EASY / SPEED: HARD, toggleable with Enter, announced on change. Confirmed (Checks 8, 9, 17, 18).
- R-03: Easy mode runs at visibly half speed (scroll, enemies, boss movement and projectiles). Confirmed by code inspection (Checks 10-14).
- R-03: Hard mode is identical to the current game — no regression. `speedMult = 1` when difficulty is `'hard'` and `'hard'` is the default. No existing constants were changed. Confirmed (Checks 7, 10-14, 16).
- R-03: Difficulty choice persists across sessions. Confirmed (Check 7).
- Carol functional and accessibility passes complete. All 19 code-inspection checks pass.
- Lint clean. 0 errors (Check 20).

All definition-of-done items are met. Branch is ready for the merge gate.
