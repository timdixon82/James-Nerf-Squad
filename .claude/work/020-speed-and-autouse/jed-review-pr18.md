# Security and Code Review: PR 18 (feat/020-speed-and-autouse)

## Status

- State: Complete
- Author: Jed (security agent)
- Date: 2026-06-01
- Branch: feat/020-speed-and-autouse
- Files reviewed: js/game.js, js/enemy.js, js/boss.js, js/screens.js

---

## Review areas

### 1. R-02 save/load guard for `autoUsePowerups`

**Result: PASS**

Save (`js/game.js` line 78): writes `this.gs.autoUsePowerups` directly from game state. Because `this.gs.autoUsePowerups` is initialised as the boolean `false` in the constructor (line 25) and the only write sites are the constructor literal and `_toggleAutoUsePowerups()` (line 535, which writes `!this.gs.autoUsePowerups`), the field can only ever hold a boolean at save time. No coercion risk.

Load (`js/game.js` line 102): `data.autoUsePowerups === true`. This is a strict equality check against the boolean literal `true`. Any non-boolean value in a corrupted or old save, including the string `"true"`, a number, or `undefined`, evaluates to `false`. This is exactly the guard the brief requires. Old saves that have no `autoUsePowerups` field return `undefined`, which correctly defaults to `false`.

### 2. R-03 save/load guard for `difficulty`

**Result: PASS**

Save (`js/game.js` line 79): writes `this.gs.difficulty` directly. Game state initialises this as the string `'hard'` (line 26), and the only write site outside save/load is the settings toggle at line 314, which assigns the result of a ternary whose both branches are string literals `'hard'` and `'easy'`. The value in the save payload is always one of those two strings.

Load (`js/game.js` line 103): `(data.difficulty === 'easy') ? 'easy' : 'hard'`. This is a strict allowlist pattern. Any value that is not exactly the string `'easy'` resolves to `'hard'`. Old saves with no `difficulty` field return `undefined`, which resolves to `'hard'` (the safe, unchanged-game default). A corrupted save with an unexpected string also resolves to `'hard'`. This is the correct guard pattern.

### 3. `speedMult` application sites

**Result: PASS**

`speedMult` is computed once per frame at `js/game.js` line 740, immediately before the gameplay update body. It is applied at five families of site:

- Scroll speed: `js/game.js` line 747. Applied to `sp`, not to `ls.scrollOffset` directly. Clean.
- Enemy horizontal step: `js/enemy.js` lines 33 and 41. Applied at `e.x += e.vx * speedMult`. The edge-turn lines (64 and 65) reset `e.vx` from `def.speed` without the multiplier, which is the correct approach per Jacob's review: `e.vx` remains the canonical direction-and-base-speed value; the multiplier scales the step, not the stored velocity.
- Enemy projectile speed: `js/enemy.js` line 76. Applied to the local `spd` literal before the dart is pushed. The dart's `vx` and `vy` are baked in at spawn; no further scaling occurs.
- Boss movement speed: `js/boss.js` line 42. Applied to the `speed` local. Both movement step sites (lines 51 and 61) multiply by this same local, so both branches are covered by one edit.
- Boss projectile speed: `js/boss.js` lines 84, 92, 97, 103. Applied in-place to each of the four speed literals at spawn.

The shared dart integration loop at `js/game.js` line 781 (`d.x += d.vx; d.y += d.vy;`) has no `speedMult` applied. This is correct. Player and squad darts are not scaled. Player `shoot()` is called at line 743 without `speedMult`, and `updateSquadMember` is called at line 774 without `speedMult`. No speed multiplication reaches player or friendly fire. The brief's exclusions are observed.

### 4. `save()` call frequency

**Result: PASS**

`save()` is called only on user interaction events, never in the game loop. In the changes introduced by this PR, `save()` is called:

- In `_toggleAutoUsePowerups()` (line 536): triggered by the user selecting item 1 in the pause menu (key handler at line 330, via `_activatePauseItem`).
- In the settings ENTER handler for index 7 (line 315): triggered by the user pressing Enter while the SPEED row is selected.

Neither call site is inside `_updateGameplay()` or the `update()` frame loop. The `levelComplete` save at line 903 and the various menu-navigation saves were pre-existing and are not changed by this PR. No per-frame localStorage writes are introduced.

### 5. General OWASP scan of changed files

**Result: PASS — no new dangerous patterns introduced**

Checked across all four changed files:

- `eval()`: not present in any changed file.
- `innerHTML`: not present in any changed file. All UI rendering goes through the canvas 2D context (`ctx.fillRect`, `ctx.fillText` via the `px()` helper). No DOM string injection path exists.
- `document.write`: not present.
- `fetch()`: not present. Network calls are not introduced by this PR.
- Unguarded `localStorage` writes: `save()` calls `persistence.setItem('nerfSquadSave', JSON.stringify(data))`. The `data` object is constructed entirely from `this.gs` fields, which are initialised from a fixed set of JavaScript primitives and arrays. The new fields (`autoUsePowerups` and `difficulty`) are a boolean and a two-value string respectively, both validated on load. No user-controlled string is serialised without a controlled source.
- XSS surface: none. The game renders to a canvas element. The only new string rendered to canvas is the `diffMsg` announcement and the `difficulty`-derived strings `'EASY'`, `'HARD'`, `'EASY = HALF SPEED'`, `'HARD = FULL SPEED'`. All of these are hard-coded string literals, not derived from user input. The `announce()` and `Speech.narrate()` calls receive these same literals.

OWASP Top 10 mapping for this PR:

| OWASP category | Finding |
|---|---|
| A03 Injection | No new injection surface. Canvas rendering only. No DOM or SQL. |
| A04 Insecure Design | No design-level weakness introduced. |
| A05 Security Misconfiguration | No new configuration. |
| A06 Vulnerable and Outdated Components | Not in scope for this diff. |
| A07 Identification and Authentication Failures | Not applicable. No auth path. |
| A08 Software and Data Integrity Failures | Save/load deserialization guarded correctly (see areas 1 and 2). |
| A09 Security Logging and Monitoring Failures | No sensitive data logged. |
| A10 Server-Side Request Forgery | Not applicable. No network calls. |

UK GDPR note: no personal data is collected or stored by this PR. The save payload contains game preferences and scores only. No change to data handling is required.

### 6. R-01 key-handler removal

**Result: PASS**

The Shift branch in the pause-screen handler has been fully removed. Before this PR, the pause handler contained `else if (key === k.switch) this._toggleAutoUsePowerups();` (the removed line visible in the diff at `js/game.js` around line 328). This line is gone. The pause `case` block now handles only ArrowUp, ArrowDown, Enter or Space (to activate the selected item), and Escape or pause key (to resume). There is no dead code at this site.

The `Shift` string at `js/game.js` line 159 is in the global `preventDefault` array for standard browser scroll suppression. This is unrelated to the pause menu and is not dead code.

The `Shift` references remaining in `js/screens.js` lines 504 and 509 are in the help-screen text (the Inventory help page), which correctly describes the Shift key as the way to open and close the Inventory screen. This is a separate function from the auto-powerups toggle and is accurate. These are not artefacts of the R-01 change.

The hint text for the AUTO POWERUPS item in the pause menu now reads `'ENTER'` (line 284), and the pause menu footer now reads `'UP/DOWN=SELECT  ENTER=TOGGLE/CONFIRM  ESC=RESUME'` (line 298). Both are consistent with the removal of the Shift shortcut.

---

## Summary

All six review areas pass. No security findings. No dead code. No per-frame save calls. Save/load guards are correct and match the brief's requirements. The `speedMult` multiplier is applied only at enemy and boss spawn and move sites; the shared dart loop and all player paths are unaffected. No new injection, deserialization, or data-exposure risks are introduced.

**Signed off: Jed, 2026-06-01.**
