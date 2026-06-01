# Architecture Review: 020 Speed and Auto-Use

## Status

- State: Active
- Author: Jacob (architect)
- Date: 2026-06-01
- Work folder: 020-speed-and-autouse
- Scope: R-02 (move auto-use to game state) and R-03 (Easy or Hard speed multiplier), plus save and load and Settings-screen integration.

This review maps every read and write site Sean must touch. All line numbers are from the source as it stands today. File paths are absolute.

## Summary for Sean

Two changes, both low-risk and well-contained:

1. R-02 is a clean move of one field from level state to game state, plus two save and load lines. Four code sites touch it. Game state is created before level state, so the default is safe.
2. R-03 needs the 0.5 multiplier applied at five families of sites. The scroll-speed site is a single line. Enemy and boss speed sites are best handled by passing a `speedMult` argument into `updateEnemy` and `updateBoss`, because each function reads its speed source in several places. Enemy and boss projectile speeds are set at spawn and must be multiplied there, never in the shared dart update loop.

The one trap to avoid: the dart movement loop at `js/game.js` line 769 (`d.x += d.vx; d.y += d.vy;`) is shared by player darts, squad darts, and enemy and boss darts. Do not apply the multiplier there. It would slow player and squad shots, which are explicitly excluded. Apply the multiplier to `vx` and `vy` at the enemy and boss spawn sites only.

## R-02: Move `autoUsePowerups` from `this.ls` to `this.gs`

### Initialisation order is safe

`this.gs` is created in the `Game` constructor at `js/game.js` line 17, and `this.ls = null` is set at line 34. Game state exists before level state, and before any level starts. Adding `autoUsePowerups: false` to the `this.gs` object literal at line 17 to 30 gives a safe default that is present from construction. There is no window in which a read of `this.gs.autoUsePowerups` could hit `undefined`.

### All four code sites

| # | Site | File and line | Current | Change to |
|---|------|---------------|---------|-----------|
| 1 | Toggle write (two reads, one write) | `js/game.js` lines 524 to 527, in `_toggleAutoUsePowerups()` | `this.ls.autoUsePowerups` | `this.gs.autoUsePowerups` |
| 2 | Default in level state literal | `js/game.js` line 637, in `startLevel()` | `autoUsePowerups: false,` | Remove this line. The field now lives in `this.gs`. |
| 3 | Pickup branch read | `js/game.js` line 853, in the update loop | `if (ls.autoUsePowerups)` | `if (this.gs.autoUsePowerups)` |
| 4 | Pause-menu draw read | `js/game.js` line 1134 | `this.ls ? this.ls.autoUsePowerups : false` | `this.gs.autoUsePowerups` |

Notes:

- Site 1, `_toggleAutoUsePowerups()` at lines 523 to 530, currently guards with `if (!this.ls) return;` at line 524. Once the field is on game state, that guard is no longer needed for safety, but it does keep the toggle inert outside a level (the pause menu is the only entry point, so this is moot). Sean should change the guard to read game state, or drop it; either is correct. After the write, add `this.save();` per the brief, so the new value persists immediately.
- Site 3 reads `ls.autoUsePowerups` through the local `ls` alias bound earlier in the update function (`var ... = this.ls;` block around line 718 onward). Sean must change it to `this.gs.autoUsePowerups`, not `gs.autoUsePowerups`, unless he also binds a local `gs` alias. Check whether a local `gs` is in scope at that point; the surrounding code uses `this.gs.frame` directly (for example line 748), so `this.gs.autoUsePowerups` is the consistent form.
- Site 4 can drop the `this.ls ?` ternary entirely, because game state always exists. `this.gs.autoUsePowerups` is always defined.

No other reads or writes of `autoUsePowerups` exist in the runtime code. The remaining matches are in `js/screens.js` (the `drawPauseMenu` parameter name, unchanged) and in work-folder documents.

## R-03: Game speed multiplier — full parameter map

The multiplier is `0.5` in Easy, `1.0` in Hard. Hard must be byte-for-byte the current behaviour, so the cleanest expression is a single helper that returns the multiplier from `this.gs.difficulty`, for example `var speedMult = this.gs.difficulty === 'easy' ? 0.5 : 1;` computed once per frame in the update function, then threaded to the sites below. Do not mutate the `LEVELS` or `ENEMIES` data in `js/constants.js`; both are pure data tables and the brief and Decision history require them to stay unchanged.

### 1. Scroll speed — confirmed, one read site

- File and line: `js/game.js` line 735, in the main update function.
- Source: `cfg.scrollSpeed`, read from the per-level `LEVELS` row in `js/constants.js`.
- Current line: `var sp = this.reducedMotion ? REDUCED_SCROLL_SPEED : cfg.scrollSpeed;` then line 736 `ls.scrollOffset += sp * 0.5;`.
- Confirmation of no other read site: I grepped the whole `js/` tree for `scrollSpeed`. Apart from the nine data rows in `js/constants.js` (lines 59 to 67), line 735 is the only runtime consumer. The parallax background draw does not read `scrollSpeed`. `drawBgScenery(ctx, cfg, scrollOffset, ...)` is called at `js/game.js` line 1179 and is passed the already-accumulated `ls.scrollOffset` (line 1173), not the per-frame speed. So applying the multiplier at line 735 or 736 automatically carries through to the parallax, with no second edit needed.
- Recommended approach: apply at the existing single site. Multiply `sp` by `speedMult`, for example `var sp = (this.reducedMotion ? REDUCED_SCROLL_SPEED : cfg.scrollSpeed) * speedMult;`. This composes cleanly with the existing reduced-motion accessor from sprint 018 and keeps both behaviours independent.

### 2. Enemy movement speed — multiple sites inside `updateEnemy`, pass an argument

- File: `js/enemy.js`.
- Source of truth: `def.speed`, read from the `ENEMIES` table in `js/constants.js` (lines 42 to 45: kid 1.0, drone 1.4, robot 0.6, minion 1.2). Per-enemy horizontal velocity `e.vx` is seeded from `def.speed` at creation, then read and re-set in several places during update.

Sites that govern how fast an enemy moves per frame:

| Site | File and line | Function | What it does |
|------|---------------|----------|--------------|
| Initial velocity | `js/enemy.js` line 12 | `createEnemy()` | `vx: choice([-1, 1]) * def.speed` |
| Flying horizontal step | `js/enemy.js` line 32 | `updateEnemy()` | `e.x += e.vx` (flying branch) |
| Ground horizontal step | `js/enemy.js` line 40 | `updateEnemy()` | `e.x += e.vx` (ground branch) |
| Edge turn, left | `js/enemy.js` line 63 | `updateEnemy()` | `e.vx = Math.abs(def.speed)` |
| Edge turn, right | `js/enemy.js` line 64 | `updateEnemy()` | `e.vx = -Math.abs(def.speed)` |

Vertical movement for ground enemies is driven by `GRAVITY` (line 39), which is jump or fall physics and is explicitly excluded from the multiplier. The flying bob at line 33 (`Math.sin(e.bobPhase) * 12`) is a fixed-amplitude hover, not travel speed; leave it unchanged. The bob phase advance at line 31 (`e.bobPhase += 0.05`) is a cosmetic animation rate, not travel; leave it unchanged.

Because `e.vx` is both seeded and re-derived from `def.speed` at the edge-turn lines (63 and 64), you cannot simply scale `e.vx` once at creation — the edge-turn lines would reset it to full speed. There are two clean options:

- Option A, recommended: add a `speedMult` parameter to `updateEnemy` and multiply the horizontal step at the two `e.x += e.vx` sites (lines 32 and 40), for example `e.x += e.vx * speedMult`. This scales travel without touching the sign-and-magnitude logic at the edge-turn lines, and leaves `e.vx` as the canonical direction-and-base-speed value. This is the smallest, clearest change and keeps `vx` semantics intact. The caller is `js/game.js` line 758; pass `speedMult` as a new last argument.
- Option B: scale `def.speed` at every site that reads it (lines 12, 63, 64) and scale `e.vx` at the step sites. This touches more lines and risks drift. Not recommended.

Use Option A. The caller change is one line at `js/game.js` line 758.

### 3. Enemy projectile speed — one spawn site, multiply at spawn

- File and line: `js/enemy.js` lines 75 to 81, in `updateEnemy()`, inside the `def.shootRate > 0` block.
- Source: a local literal `var spd = 3.5;` at line 75, then the dart is pushed with `vx: (dx / dist) * spd, vy: (dy / dist) * spd` at line 78.
- Is it a constant, a property, or inline? Inline literal, computed per shot.
- Clean single read site? Yes. One literal at line 75 controls both components.
- Recommended approach: multiply `spd` by the same `speedMult` argument added in section 2, for example `var spd = 3.5 * speedMult;`. Because the velocity is baked into the dart's `vx` and `vy` at spawn, and the shared dart loop at `js/game.js` line 769 simply integrates `vx` and `vy`, scaling `spd` here is the only change needed for enemy projectiles. Do not touch line 769.

The `shootTimer` and `def.shootRate` (lines 67 to 70) control fire rate, which the brief excludes. Leave them unchanged.

### 4. Boss movement speed — phase-derived, pass an argument

- File: `js/boss.js`, function `updateBoss()`.
- Source: computed inline at line 41, `var speed = 0.6 + boss.phase * 0.3;`. There is no boss `speed` field in `js/constants.js`; the value is derived per frame from `boss.phase`. The base velocity `boss.vx` is set to `0.75` at creation (`createBoss`, line 16), and the per-frame travel is `boss.x += boss.vx * speed`.

Sites that govern boss travel per frame:

| Site | File and line | Phase context | What it does |
|------|---------------|---------------|--------------|
| Flying boss step (type 2) | `js/boss.js` line 50 | non-stationary | `boss.x += boss.vx * speed` |
| Ground boss step (types 1 and 3) | `js/boss.js` line 60 | non-stationary | `boss.x += boss.vx * speed` |

The `speed` local at line 41 already folds in the phase bonus (`0.6 + boss.phase * 0.3`), so multiplying `speed` by `speedMult` scales every phase consistently. The vertical hover for the flying boss at line 48 (`Math.sin(boss.anim * 0.04) * 20`) is fixed-amplitude bobbing, not travel; leave it. `boss.vy` is gravity-driven (line 58) and excluded. The `boss.anim` advance (line 35) and `attackTimer` (lines 72 to 74) are animation and fire-rate, both excluded.

- Recommended approach: add a `speedMult` parameter to `updateBoss` and apply it to the `speed` local, for example `var speed = (0.6 + boss.phase * 0.3) * speedMult;` at line 41. This single edit covers both movement sites (lines 50 and 60) because both multiply by the same `speed`. The caller is `js/game.js` line 760; pass `speedMult` as a new last argument.

### 5. Boss projectile speed — three spawn literals in `updateBoss`, multiply each at spawn

Boss projectiles are spawned in the attack block at `js/boss.js` lines 72 to 108, with speed literals that vary by boss type and sub-attack:

| Site | File and line | Boss type | Speed literal |
|------|---------------|-----------|---------------|
| Spread fan | `js/boss.js` line 83 | type 1 | `Math.cos(rad) * 4`, `Math.sin(rad) * 4` |
| Radial burst | `js/boss.js` line 91 | type 2 | `Math.cos(angle) * 3.5`, `Math.sin(angle) * 3.5` |
| Aimed shot | `js/boss.js` line 96 | type 3 | `(dx / dist) * 5`, `(dy / dist) * 5` |
| Side shots | `js/boss.js` lines 102 to 103 | type 3, phase greater than 0 | `Math.cos(srad) * 4.5`, `Math.sin(srad) * 4.5` |

- Are these constants, properties, or inline? Inline literals at each push site (`4`, `3.5`, `5`, `4.5`).
- Clean single read site? No. Four distinct speed literals across three attack patterns. There is no shared variable; each is written directly into the dart's `vx` and `vy`.
- Recommended approach: multiply each literal by the `speedMult` argument at the push site, for example `vx: Math.cos(rad) * 4 * speedMult`. Reuse the same `speedMult` parameter added for boss movement in section 4, so one new argument covers both boss movement and boss projectiles. Apply to all four literal pairs (lines 83, 91, 96, and 102 to 103). As with enemy darts, do not scale the shared dart loop at `js/game.js` line 769; scale at spawn only.

To reduce the chance of missing one, Sean could hoist a single `var pSpeed = baseLiteral * speedMult;` per attack branch, but the four literals differ, so the safest pattern is to multiply each in place and have Carol confirm all four in test.

### What must NOT be multiplied — confirmed exclusions

- Player movement, jump, and fire rate. The player update is `player.update(...)` at `js/game.js` line 732 and `player.shoot(...)` at line 731; do not pass `speedMult` into either.
- Squad-member movement and shots. `updateSquadMember` (`js/enemy.js` lines 123 to 170) moves allies toward the player and fires `DART_SPEED` darts at line 166. These are friendly, not enemy speed; leave `updateSquadMember` and its call at `js/game.js` line 762 unchanged.
- The shared dart integration loop at `js/game.js` line 769. This moves all darts, friendly and hostile. Multiplying here would slow player and squad shots and break the exclusion. Leave it.
- `GRAVITY`, animation phase advances (`bobPhase`, `boss.anim`), fire-rate timers (`shootRate`, `shootTimer`, `attackTimer`), and the flying hover amplitudes. All excluded by the brief or are non-speed.

### Recommended threading pattern

Compute the multiplier once per frame at the top of the main update function in `js/game.js` (the function that begins binding `var ... = this.ls;` around line 718):

`var speedMult = this.gs.difficulty === 'easy' ? 0.5 : 1;`

Then:

- Line 735: fold `speedMult` into the scroll-speed accessor.
- Line 758: pass `speedMult` as the new last argument to `updateEnemy`. Inside `updateEnemy`, apply it at the two `e.x += e.vx` step sites (lines 32 and 40) and at the projectile `spd` literal (line 75).
- Line 760: pass `speedMult` as the new last argument to `updateBoss`. Inside `updateBoss`, apply it to the `speed` local (line 41) and to the four projectile literals (lines 83, 91, 96, 102 to 103).

This keeps the difficulty source (game state) in one place, threads a single scalar to each module, and leaves the `LEVELS` and `ENEMIES` data tables untouched.

## Save and load integration

### Add `difficulty` to the game-state object literal

In the `this.gs` literal at `js/game.js` lines 17 to 30, add `difficulty: 'hard',` alongside `autoUsePowerups: false,`. Default `'hard'` matches the brief: Hard is the unchanged current game, so existing players see no behaviour change.

### `save()` — add both fields

In `Game.prototype.save` at `js/game.js` lines 70 to 82, add two entries to the `data` payload object (lines 71 to 80):

- `autoUsePowerups: this.gs.autoUsePowerups,`
- `difficulty: this.gs.difficulty,`

### `load()` — restore both with guards for old saves

In `Game.prototype.load` at `js/game.js` lines 84 to 111, inside the `try` block, add:

- `self.gs.autoUsePowerups = data.autoUsePowerups || false;`
- `self.gs.difficulty = (data.difficulty === 'easy') ? 'easy' : 'hard';`

The `difficulty` guard is deliberate: old saves predate this change and have no `difficulty` field, so `data.difficulty` is `undefined`. The expression above resolves any value that is not exactly `'easy'` to `'hard'`, which is the safe default and matches the unchanged game. This is more robust than `data.difficulty || 'hard'` because it also rejects a corrupted or unexpected value. The whole block is already wrapped in `try { ... } catch(e) {}` (line 109) so a malformed save falls back to the constructor defaults.

## Settings-screen integration

### Existing structure

`drawSettings()` is at `js/screens.js` lines 223 to 259. It draws, in order:

1. Six key-binding rows from the `bindItems` array (lines 227 to 246), laid out at `iy = 40 + i * 22` (line 238). These are selectable indices 0 to 5.
2. One toggle row, ALT BUTTON LAYOUT, at index 6 (`selectedIdx === bindItems.length`, line 249), drawn lower at `lhY = 40 + bindItems.length * 22 + 8` (line 248) with a taller `rowH = 30` and a two-line sub-label (lines 250 to 256). This is the existing cycling-option pattern: a label on the left, an ON or OFF value on the right in green or red, and a descriptive sub-line beneath.
3. A footer hint, `UP/DOWN=SELECT  ENTER=CHANGE  ESC=BACK` (line 258).

The input side is in `js/game.js` lines 297 to 313, `case 'settings'`. Navigation wraps over a fixed count `var items = 7;` (line 298). ENTER on index 6 toggles `this.gs.altButtonLayout`, rebuilds touch buttons, and calls `this.save()` (lines 303 to 306). ENTER on indices 0 to 5 enters key-rebind mode (lines 307 to 310). ESC saves and returns to the title (line 299).

### Where to insert the SPEED row

Add SPEED as a new toggle row at index 7, directly below ALT BUTTON LAYOUT, following the exact same pattern as the ALT BUTTON LAYOUT row. Concretely:

1. In `drawSettings()`, the function signature must gain the current difficulty so it can render the value. Add a `difficulty` parameter (or pass the whole game-state value). Draw a new row at `lhY + rowH` (just below the ALT BUTTON LAYOUT block), with:
   - Left label `SPEED`.
   - Right value `EASY` or `HARD`. Match the existing colour convention: use the green value colour for the non-default and the red for the other, or pick a consistent pair; Simon should confirm the exact colours against the WCAG 2.2 AAA contrast bar before merge. Per the brief, the displayed strings are `SPEED: EASY` and `SPEED: HARD`, or label `SPEED` with value `EASY` or `HARD`; either reading is fine, but match the ALT BUTTON LAYOUT row, which uses a separate label and value, so use label `SPEED` and value `EASY` or `HARD`.
   - Optionally a sub-line such as `EASY = HALF SPEED` to mirror the ALT BUTTON LAYOUT sub-label, for screen-reader and sighted clarity.
2. The `_drawSettings` wrapper at `js/game.js` lines 1091 to 1092 must pass the new argument: add `this.gs.difficulty` to the `drawSettings(...)` call.
3. In the `case 'settings'` input handler at `js/game.js` line 298, change `var items = 7;` to `var items = 8;` so navigation reaches the new row.
4. Add an ENTER branch for the new index 7, mirroring lines 303 to 306:
   - Toggle `this.gs.difficulty` between `'easy'` and `'hard'`, for example `this.gs.difficulty = this.gs.difficulty === 'easy' ? 'hard' : 'easy';`.
   - Call `this.save()` and `playMenuConfirm()` as the ALT BUTTON LAYOUT branch does.
   - Announce the change per the brief: `announce(this.gs.difficulty === 'easy' ? 'Easy mode.' : 'Hard mode.');` and a matching `Speech.narrate(...)`, following the pattern already used in `_toggleAutoUsePowerups` (`js/game.js` lines 528 to 529) and elsewhere.

This keeps the new control identical in behaviour to the existing ALT BUTTON LAYOUT toggle: same draw style, same ENTER-to-cycle interaction, same save-on-change, with the announcer wired in for accessibility.

## Note on R-01 hint label (not blocking, for Sean and Tad)

The brief's R-01 changes the pause-menu hint from `SHIFT` to `ENTER` at `js/screens.js` line 274. Be aware that in the pause menu, the dedicated toggle key is actually `k.switch` (default `Shift`), wired at `js/game.js` line 319, and the footer hint at `js/screens.js` line 288 also says `SHIFT=TOGGLE AUTO`. ENTER works too, but only because ENTER activates whichever pause item is selected (`_activatePauseItem`, `js/game.js` line 318), and item index 1 is the auto-powerups toggle. So both keys toggle auto-use, by two different mechanisms. If the intent of R-01 is to point the user at ENTER, the footer hint at line 288 should change to match the per-item hint at line 274, or the change will be inconsistent. This is a copy and UX consistency point for Sonja to confirm with Tim through the normal question channel if needed; it does not affect the architecture.

## Risk assessment

- R-02 move: low risk. Four sites, all listed. Game state precedes level state, so the default is always present. The only runtime-error risk the brief names (a missed read site) is eliminated by the table above.
- R-03 multiplier: low to medium risk. The risk is a missed spawn-site literal for boss projectiles (four of them) or applying the multiplier in the shared dart loop by mistake. The map above lists every site and flags the shared loop explicitly. Carol should test all three boss types and confirm enemy darts, boss darts, enemy movement, boss movement, and scroll are all visibly halved in Easy, and that player and squad shots are unchanged in both modes.
- Data integrity: no mutation of `LEVELS` or `ENEMIES`. The multiplier is applied at read and spawn sites only, satisfying the pure-data constraint.

## Files Sean will edit

- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/game.js` — game-state literal, save, load, scroll-speed site, `updateEnemy` and `updateBoss` call sites, settings input handler, `_drawSettings` wrapper, the four auto-use sites, and `_toggleAutoUsePowerups`.
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/enemy.js` — `updateEnemy` signature and the enemy movement and projectile sites.
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/boss.js` — `updateBoss` signature, the boss movement site, and the four projectile literals.
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/screens.js` — `drawSettings` new SPEED row, and the R-01 hint label at line 274 (and footer at line 288 if confirmed).
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/constants.js` — no changes. Pure data, must stay unchanged.
