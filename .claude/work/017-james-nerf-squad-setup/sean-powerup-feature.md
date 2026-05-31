# Sean: Powerup accumulation and loadout selection screen

## Commit

`b479b29` on branch `feat/powerup-accumulation-and-loadout-screen`

## Pull request

PR 5: https://github.com/timdixon82/James-Nerf-Squad/pull/5

## What was built

All four steps from Jacob ADRs 010 and 011 land in a single commit across four files.

### Step 1: Input.clearAllInput and Game._setScreen

`js/input.js`: added `clearAllInput()` which zeros all held maps, all movement state booleans, and all one-shot flags. Exposed on the `Input` object alongside `clearOneShots`.

`js/game.js`: added `Game.prototype._setScreen(name)` which sets `this.gs.screen` and immediately calls `Input.clearAllInput()`. Replaced every bare `this.gs.screen = '...'` assignment in the file (14 call sites) with `this._setScreen(...)`. The one remaining direct assignment at line 705 is the body of `_setScreen` itself.

The constant `var SCREEN_LOADOUT = 'select-loadout'` was added at the top of game.js. All references to the loadout screen value use this constant.

### Step 2: Inventory storage and HUD indicator

`js/game.js` `startLevel()`: added `inventory: []` to the `this.ls` object literal. The array resets with the level.

Pickup loop: removed the call to `_applyPowerUp`. Replaced with: push to `ls.inventory` if under 20, announce "stored / Press Switch to open loadout", else announce "Inventory full". Particle burst still fires. The `playPowerUp()` sound still fires.

`js/hud.js`: `drawHUD` gains a new `inventoryCount` parameter between `levelName` and `touchMode`. When `inventoryCount > 0` a `STORED:N` label is drawn in green to the right of the active-effect icons. Both `_drawGame` and `_drawPause` call sites in game.js were updated; the new `_drawLoadout` call site was added with the same argument.

### Step 3: Loadout screen

`js/game.js` new methods:
- `_loadoutIndexOfEquipped`: finds the grid index of the currently equipped blaster.
- `_loadoutOpenAnnouncement`: builds the opening announcement string.
- `_openLoadout`: sets `loadoutIdx`, calls `_setScreen(SCREEN_LOADOUT)`, plays a menu click, announces, and narrates.
- `_closeLoadout(reason)`: calls `_setScreen('game')`, plays a menu click, announces and narrates the reason string.
- `_loadoutInventoryTypes`: returns deduplicated powerup type strings from `ls.inventory`.
- `_announceLoadoutFocus(weapons, invTypes)`: announces the focused cell on every navigation step.
- `_confirmLoadoutSelection(weapons, invTypes)`: equips a weapon (sets `player.blaster`) or splices and applies a powerup.
- `_tapLoadout(x, y)`: hit-tests the menu nav strip first, then weapon cells, then powerup cells. Tapping a cell calls `_confirmLoadoutSelection`.
- `_drawLoadout`: draws the scene behind the overlay, the HUD, the boss bar if present, and calls `drawLoadoutScreen`.

Switch key handler in `_updateGameplay` changed from `player.cycleBlaster()` to `this._openLoadout(); return;`.

`SCREEN_LOADOUT` case added to `_dispatchTap`, `_handleMenuKey`, and the `draw` switch.

`js/screens.js`: `drawLoadoutScreen(ctx, blasters, inventory, currentBlaster, highlightIdx, frame, touchMode, reducedMotion)` added before the help screen. Draws a semi-transparent overlay, a weapons grid (2 columns), and a powerup grid (3 columns). Reduced-motion flag controls whether the highlight pulses or is static. Touch nav strip uses `udlrselback` buttons.

### Step 4: Touch cell hit-testing

Implemented in `_tapLoadout`. The cell coordinate maths replicate the grid layout from `drawLoadoutScreen`.

### Help screen

`drawHelpScreen` expanded from 3 to 4 pages. Page 4 documents the loadout screen in plain English. Page 1 (controls) updated to show `LOADOUT` in place of `SWITCH GUN` with a cross-reference to page 4. `_prevHelp` and `_nextHelp` in game.js updated to wrap at 4.

## Architecture conformance

- `SCREEN_LOADOUT` constant used everywhere; never the literal string. This guards against the silent mismatch with `'select'` (the level-select screen name).
- `_setScreen` replaces all bare screen writes; `clearAllInput` fires on every transition. The switchPressed one-shot is cleared before execution returns from `_updateGameplay`, so it cannot re-fire on the loadout screen.
- Inventory is on `ls`, not on `Player` or `gs`. It resets with the level.
- `announce()` and `Speech.narrate()` fire on every arrow-key navigation step, not only on open and close.

## Gaps for Carol

1. Functional: collect several powerups, open loadout, equip each unlocked weapon and confirm the HUD blaster name and colour update.
2. Functional: store 20 powerups and attempt to collect a 21st. Confirm "Inventory full" is announced and the powerup disappears from the world.
3. Functional: use a stored powerup of each type from the loadout (shield, speed, megadart, squad, ammo refill) and confirm the effect applies to the player.
4. Functional: confirm that using a powerup from the loadout removes exactly one instance of that type from the inventory count displayed on the HUD.
5. Touch: verify tap-to-select on weapon cells and powerup cells; verify the Back button in the nav strip closes the screen.
6. Screen reader (VoiceOver and JAWS): open loadout with arrow keys, navigate all cells, confirm each cell is announced with name and equipped/count status; confirm the open and close announcement fires.
7. Help page 4: verify the loadout description text is legible at the default canvas scale.
8. Reduced-motion: confirm the loadout grid uses a static highlight when prefers-reduced-motion is enabled.
