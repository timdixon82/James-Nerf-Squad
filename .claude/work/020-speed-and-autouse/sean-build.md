# Build Report: Sean — Sprint 020 R-02 and R-03

- Date: 2026-06-01
- Branch: feat/020-speed-and-autouse
- PR: https://github.com/timdixon82/James-Nerf-Squad/pull/18
- Commits: 2 (one per requirement, as specified)

## R-01 status

Built. Tim confirmed: Shift = switch blaster (gameplay only). Shift must not toggle AUTO POWERUPS from the pause menu.

## R-01 build

- Date: 2026-06-01
- Commit: abc8899

### Lines changed

**`js/game.js` — line 331 (pause case key handler)**

Removed:
```
else if (key === k.switch)                          this._toggleAutoUsePowerups();
```

The `case 'pause'` block now has no Shift branch. AUTO POWERUPS is only toggled via `_activatePauseItem` (Enter or Space on item index 1).

**`js/screens.js` — line 284 (drawPauseMenu items array)**

Changed:
```
{ label: 'AUTO POWERUPS: ' + (autoUsePowerups ? 'ON ' : 'OFF'), hint: 'SHIFT' },
```
To:
```
{ label: 'AUTO POWERUPS: ' + (autoUsePowerups ? 'ON ' : 'OFF'), hint: 'ENTER' },
```

Note: the `hint` property is carried on the data but is not rendered in the current draw loop (the loop only reads `items[i].label`). The footer is the authoritative rendered key guidance.

**`js/screens.js` — line 298 (drawPauseMenu footer)**

Changed:
```
px(ctx, 'UP/DOWN  ENTER SELECT  SHIFT=TOGGLE AUTO', CANVAS_W / 2, panY + panH - 14, 4, '#555', 'center');
```
To:
```
px(ctx, 'UP/DOWN=SELECT  ENTER=TOGGLE/CONFIRM  ESC=RESUME', CANVAS_W / 2, panY + panH - 14, 4, '#555', 'center');
```

The new footer is consistent with the Settings and pause screen patterns used elsewhere in the codebase, and makes no mention of Shift.

## R-02: Persist auto-use powerups across levels and sessions

### What changed

File: `js/game.js`

1. Added `autoUsePowerups: false` to the `this.gs` literal (constructor, after `altButtonLayout`).
2. Added `autoUsePowerups: this.gs.autoUsePowerups` to the `save()` payload.
3. Added `self.gs.autoUsePowerups = data.autoUsePowerups === true;` to the `load()` handler. The `=== true` guard ensures old saves without this field restore to `false`.
4. Replaced `_toggleAutoUsePowerups()`: removed the `if (!this.ls) return;` guard and the `this.ls.autoUsePowerups` read/write; now reads and writes `this.gs.autoUsePowerups`. Added `this.save()` after the toggle.
5. Removed `autoUsePowerups: false` from the `this.ls` literal in `startLevel()`.
6. Updated the pickup read site in `_updateGameplay()` from `ls.autoUsePowerups` to `this.gs.autoUsePowerups`.
7. Updated the pause-menu draw call from `this.ls ? this.ls.autoUsePowerups : false` to `this.gs.autoUsePowerups`.

### Deviations from Jacob's spec

None. All four sites from Jacob's table were updated. The `_toggleAutoUsePowerups` guard was removed as Jacob noted was correct (game state always exists).

### Commit

`fix: persist auto-use powerups across levels and sessions (R-02)` — commit 5d5b96c

## R-03: Easy/Hard game speed in Settings

### What changed

**`js/game.js`**

1. Added `difficulty: 'hard'` to the `this.gs` literal.
2. Added `difficulty: this.gs.difficulty` to `save()`.
3. Added `self.gs.difficulty = (data.difficulty === 'easy') ? 'easy' : 'hard';` to `load()`. Any value that is not exactly `'easy'` resolves to `'hard'`.
4. Changed `var items = 7` to `var items = 8` in the `case 'settings'` handler.
5. Added `else if (this.settingsIdx === 7)` branch: toggles `this.gs.difficulty`, calls `this.save()` and `playMenuConfirm()`, announces "Easy mode." or "Hard mode." via `announce()` and `Speech.narrate()`.
6. Updated `_drawSettings` wrapper call to pass `this.gs.difficulty` as the seventh argument.
7. Added `var speedMult = this.gs.difficulty === 'easy' ? 0.5 : 1;` at the start of `_updateGameplay()`, after the `bossIntroTimer` early return guard.
8. Applied `speedMult` to scroll speed: `(this.reducedMotion ? REDUCED_SCROLL_SPEED : cfg.scrollSpeed) * speedMult`.
9. Passed `speedMult` as the new last argument to `updateEnemy()` and `updateBoss()` at their call sites.

**`js/enemy.js`**

1. Updated `updateEnemy` signature to `function updateEnemy(e, player, darts, platforms, groundY, particles, camX, speedMult)`.
2. Added `speedMult = speedMult || 1;` guard at the top.
3. Changed `e.x += e.vx;` to `e.x += e.vx * speedMult;` in both the flying branch (line 32) and the ground branch (line 40).
4. Changed `var spd = 3.5;` to `var spd = 3.5 * speedMult;` at the enemy projectile spawn site.

**`js/boss.js`**

1. Updated `updateBoss` signature to `function updateBoss(boss, player, darts, platforms, groundY, particles, camX, speedMult)`.
2. Added `speedMult = speedMult || 1;` guard at the top.
3. Changed `var speed = 0.6 + boss.phase * 0.3;` to `var speed = (0.6 + boss.phase * 0.3) * speedMult;`. This covers both the flying boss step and the ground boss step, since both multiply by `speed`.
4. Applied `speedMult` to all four boss projectile spawn literals:
   - Type 1 spread fan (line 83): `Math.cos(rad) * 4 * speedMult`, `Math.sin(rad) * 4 * speedMult`
   - Type 2 radial burst (line 91): `Math.cos(angle) * 3.5 * speedMult`, `Math.sin(angle) * 3.5 * speedMult`
   - Type 3 aimed shot (line 96): `(dx / dist) * 5 * speedMult`, `(dy / dist) * 5 * speedMult`
   - Type 3 side shots (lines 102-103): `Math.cos(srad) * 4.5 * speedMult`, `Math.sin(srad) * 4.5 * speedMult`

**`js/screens.js`**

1. Updated `drawSettings` signature to accept `difficulty` as the seventh parameter.
2. Added SPEED row below ALT BUTTON LAYOUT at `spY = lhY + rowH + 4`, following the exact same draw pattern (background highlight, label, value, sub-line).
   - Value is `'EASY'` or `'HARD'`.
   - Value colour: `#88ff88` for EASY, `#ff6666` for HARD (same convention as the ALT BUTTON LAYOUT ON/OFF colours).
   - Sub-line: `'EASY = HALF SPEED'` or `'HARD = FULL SPEED'`.

### Sites not multiplied (confirmed)

- The shared dart integration loop at `js/game.js` line 769 (`d.x += d.vx; d.y += d.vy;`) was not touched.
- `player.shoot()` and `player.update()` were not passed `speedMult`.
- `updateSquadMember()` was not passed `speedMult`.
- `js/constants.js` was not modified.

### Deviations from Jacob's spec

None. All sites from Jacob's parameter map were updated. The `speedMult || 1` defaults in `updateEnemy` and `updateBoss` were added as defensive guards, which Jacob's spec noted as a safety measure.

### Commit

`feat: Easy/Hard game speed in Settings (R-03)` — commit 66b3cd4

## Accessibility regression suite

Run on 2026-06-01 on branch build.

| Check | Tool | Result |
|---|---|---|
| HTML structure | HTMLHint 1.9.2 | Pass — no errors |
| JavaScript lint | ESLint 10.4.1 | Pass — 0 errors, 98 warnings (all pre-existing) |
| WCAG2AAA automated | Pa11y 9.1.1 | Pass — no issues found |
| WCAG automated | axe-core 4.11.4 | 1 pre-existing violation: `meta-viewport` |
| Keyboard navigation | Manual | Deferred to Carol |
| Live-region spot-check | Manual | Deferred to Carol |
| Reduced-motion gate | Manual | Deferred to Carol |
| Colour contrast | Manual | Deferred to Carol |
| Font rendering | Manual | Deferred to Carol |

The `meta-viewport` axe-core finding is pre-existing. It was present on main before this branch was cut and is not related to R-02 or R-03. Carol should determine whether to raise an exception record.

## Files changed

- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/game.js` — R-02 and R-03 changes
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/enemy.js` — R-03: speedMult in updateEnemy
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/boss.js` — R-03: speedMult in updateBoss
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/screens.js` — R-03: SPEED row in drawSettings
