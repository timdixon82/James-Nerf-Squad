# Requirements: Powerup Accumulation System and Weapon-and-Powerup Selection Screen

Status: Draft
Author: Tad
Date: 2026-05-24
Work folder: `.claude/work/017-james-nerf-squad-setup/`
Feeds into: Jacob (architecture review), Sean (development)

## Bottom line

Tim has asked for two new gameplay features: a powerup inventory that stores pickups instead of applying them immediately, and a selection screen that pauses the game and lets the player choose which weapon to equip or which stored powerup to use. These requirements cover what each feature must do, accessibility constraints, performance constraints, open questions for Jacob, and the definition of done.

## Contents

1. Background and current behaviour
2. Feature 1: Powerup accumulation system
3. Feature 2: Weapon and powerup selection screen
4. Accessibility requirements (both features)
5. Non-functional requirements (both features)
6. Open questions for Jacob
7. Definition of done

---

## 1. Background and current behaviour

### 1.1 Current powerup behaviour

Five powerup types are defined in `js/constants.js` under `POWERUPS`: shield, speed, megadart, squad, and ammo. Powerups appear in the world either on a timer (every 400 frames, at a random position near the camera) or when an enemy is defeated (a 25 per cent chance). When the player character walks over a powerup, `_applyPowerUp()` in `js/game.js` applies the effect immediately and the powerup is gone. There is no storage or inventory.

The four active powerup states are held on the `Player` object: `hasShield` (boolean), `speedBoost` (frame countdown), `megaDartReady` (boolean), and `squadActive` (frame countdown). `js/hud.js` reads these four values and draws icons for any that are currently active.

### 1.2 Current weapon-switch behaviour

The player can hold multiple blasters. Unlocked blasters are stored in `player.unlockedBlasters` (an array). The binding for the switch action is the `switch` key, defaulting to Shift. When the player presses it, `player.cycleBlaster()` moves to the next blaster in the array in a simple round-robin. There is no selection screen.

The `switch` key is polled in `_updateGameplay()` via `inp.switchPressed`. The switch action does not pause gameplay.

### 1.3 Live-region announcer and Speech layer

PR 3 introduced a `announce()` function that writes to a visually hidden `aria-live` region (`#game-announcer`), and a `Speech.narrate()` function that speaks text via the Web Speech API (SpeechSynthesis). Both are used throughout `js/game.js` for menus, level starts, hits, game over, and pause. The new features must use both functions in the same way.

---

## 2. Feature 1: Powerup accumulation system

### 2.1 Summary

Instead of applying a powerup immediately when the player picks it up, the game stores it in a per-level inventory. The player can hold multiple powerups at once. The player chooses when to use a stored powerup via the selection screen (Feature 2). Pickup still triggers a sound and an announcement. Application is deferred until the player selects it.

### 2.2 Functional requirements

**F1-01.** When the player character touches a powerup in the world, the game stores the powerup type in the player's inventory rather than applying its effect. The powerup is removed from the world.

**F1-02.** The inventory holds a list of stored powerup types. There is no fixed cap on the number of stored powerups, but see non-functional requirement N1-01 for a practical guideline.

**F1-03.** The same powerup type may appear in the inventory more than once. For example, if the player picks up two shield powerups without using either, both are stored.

**F1-04.** When the player selects a powerup to use from the selection screen, the game removes one instance of that type from the inventory and applies its effect using the existing `_applyPowerUp()` logic unchanged.

**F1-05.** When a powerup is picked up, the game calls `announce()` with the text "[Powerup name] stored. You now hold [N] powerup(s)." It also calls `Speech.narrate()` with the same text at the `'normal'` priority level.

**F1-06.** When a powerup is used, the game calls `announce()` with the text "[Powerup name] used." and calls `Speech.narrate()` with the same text at the `'high'` priority level.

**F1-07.** The player's ammo powerup behaviour is unchanged: when an ammo powerup is used from the inventory, all blasters are refilled to their default ammo values, the same as the current immediate-apply behaviour.

**F1-08.** The inventory is per-level. When `startLevel()` initialises the level state (`this.ls`), the player's inventory is empty. Powerups do not carry over between levels.

**F1-09.** The HUD must show a count of stored powerups at all times during gameplay. If the inventory is empty, it shows zero. The exact position and visual treatment are for Simon and Jacob to decide; the requirement is that the count is always visible and is also written to the `aria-live` region whenever it changes.

**F1-10.** The `drawHUD()` function in `js/hud.js` currently takes four individual powerup-state arguments (`hasShield`, `speedBoost`, `megaDartReady`, `squadActive`). These four arguments remain and continue to reflect the currently active effects (not the stored inventory). The inventory is passed separately. Jacob will confirm the exact signature change.

### 2.3 Scope boundary

The following are out of scope for this feature and must not be implemented in the same pull request (PR):

- Any UI for browsing the inventory outside the selection screen.
- Powerup icons in the selection screen: these belong to Feature 2.
- Changes to how powerups spawn or their drop rates.

---

## 3. Feature 2: Weapon and powerup selection screen

### 3.1 Summary

The `switch` key (default Shift) currently cycles through weapons silently during live gameplay. This feature replaces that behaviour with a pause-style selection screen. The screen shows all unlocked weapons and all stored powerups. Gameplay pauses while the screen is open. The player uses keyboard or touch to move the highlight, then confirms a selection. On confirm, either the selected weapon becomes the active blaster, or the selected powerup is used from the inventory and gameplay resumes.

### 3.2 Functional requirements

**F2-01.** Pressing the `switch` key during gameplay (`screen === 'game'`) opens the selection screen and pauses the game loop. Gameplay does not advance while the screen is open. This is a full pause (no enemy movement, no scroll, no timers), not a visual freeze only.

**F2-02.** The selection screen shows two sections: "WEAPONS" and "POWERUPS". The weapons section lists every blaster the player has unlocked in the current level. The powerups section lists every powerup type the player currently holds in inventory, with a count per type if more than one is stored.

**F2-03.** The currently equipped weapon is visually marked in the weapons section (for example, with a highlight or a checkmark drawn in canvas text). The mark must also be conveyed as text for the live-region announcer (see accessibility requirements).

**F2-04.** Navigation within the selection screen uses ArrowUp and ArrowDown to move the highlight between items. The two sections (weapons and powerups) are traversed in a single linear sequence: all weapons first (in unlock order), then all powerups (in pickup order or alphabetical order; Jacob and Simon to decide). The highlight wraps from the last item back to the first.

**F2-05.** Pressing Enter or Space on a highlighted weapon equips that weapon as the active blaster, closes the selection screen, and resumes gameplay. The previously equipped weapon's ammo and state are unchanged.

**F2-06.** Pressing Enter or Space on a highlighted powerup uses that powerup (removes it from inventory, applies effect), closes the selection screen, and resumes gameplay.

**F2-07.** Pressing Escape or the `switch` key a second time closes the selection screen and resumes gameplay without making any change.

**F2-08.** On touch devices, the selection screen shows touch-friendly tap targets for each item. Each tap target must meet the WCAG 2.2 AAA minimum of 44 by 44 CSS pixels. Tapping an item equips the weapon or uses the powerup, closes the screen, and resumes gameplay.

**F2-09.** If the powerups section is empty (the player holds no stored powerups), the powerups section is still shown but displays the text "No powerups stored." This ensures the player knows the feature exists even when the inventory is empty.

**F2-10.** The selection screen must not be openable from any screen other than `'game'`. In particular, it must not be openable from the pause screen or any menu.

**F2-11.** The selection screen is a new game screen state. It is distinct from the existing `'pause'` screen state. The game state property `this.gs.screen` takes a new value (for example `'select-weapon'`) while the screen is open. Jacob will confirm the exact state name to avoid conflicts with the existing `'select'` level-select screen.

**F2-12.** When the selection screen opens, the highlight is placed on the currently equipped weapon.

**F2-13.** When the player has no stored powerups and the highlight is on the last weapon, pressing ArrowDown keeps the highlight on the last weapon (no wrap into an empty powerups section). When the powerups section has items, ArrowDown from the last weapon moves to the first powerup.

### 3.3 Scope boundary

The following are out of scope:

- Changing what weapons unlock or when.
- Allowing the player to drop or discard a powerup without using it.
- A visual inventory screen accessible from the pause menu or the title screen.
- Any change to the existing `'pause'` screen behaviour.

---

## 4. Accessibility requirements

These apply to both features. They supplement, and do not replace, the accessibility requirements in the baseline audit at `.claude/work/017-james-nerf-squad-setup/carol-baseline-audit.md`.

### 4.1 Keyboard operability (WCAG 2.1.1, 2.1.3)

**A-01.** Every action in both features must be achievable by keyboard alone. No action must require a mouse, trackpad, or touch gesture as the only route to completion.

**A-02.** The selection screen must be fully keyboard-operable using the keys listed in functional requirements F2-04 through F2-07. No new keys are introduced without being added to the Settings key-rebinding list and the Help screen. Jacob and Sean to confirm whether `switch`, Enter, Space, Escape, ArrowUp, and ArrowDown are sufficient or whether any additional bindings are needed.

**A-03.** The `switch` key must remain rebindable via the Settings screen. The Settings screen currently lists six rebindable keys (left, right, jump, shoot, switch, pause). The `switch` key already appears in this list. No change to that list is needed for this feature, but Sean must verify the rebinding path still works after the `switch` key changes its gameplay behaviour.

### 4.2 Live-region and speech announcements (WCAG 4.1.3)

**A-04.** When the selection screen opens, the game must call `announce()` with a message that names the screen and the currently highlighted item. Example: "Weapon and powerup selection. Weapons: Starter Pistol (equipped), Rapid Rifle. Powerups: Shield, Speed. Currently on: Starter Pistol (equipped). Use Up and Down to navigate. Press Enter or Space to select. Press Escape to close."

**A-05.** Each time the highlight moves, the game must call `announce()` with the name of the newly highlighted item and its type. Example: "Rapid Rifle. Weapon." or "Shield. Powerup." The call must also include "(equipped)" if the item is the currently active weapon. The `Speech.narrate()` function must be called with the same text at `'normal'` priority so the speech layer reads the item name without delay.

**A-06.** When the selection screen closes after a selection, the game must call `announce()` and `Speech.narrate()` to confirm the action. For a weapon: "Rapid Rifle equipped." For a powerup: "Shield used." For a close without selection: "Selection cancelled. Game resumed."

**A-07.** The HUD powerup count (F1-09) must write to the `aria-live` region whenever the count changes. The text should be brief: "Powerups stored: [N]."

### 4.3 Touch operability (WCAG 2.5.3, 2.5.5)

**A-08.** On touch devices, each selectable item in the selection screen must have a touch target of at least 44 by 44 CSS pixels. This applies at all `pixelScale` values. Simon will confirm the layout in the design pass.

**A-09.** The touch-mode menu navigation strip (existing pattern) must also appear on the selection screen, providing Up, Down, Select, and Back touch buttons. This matches the pattern used on the customise screen and level-select screen.

### 4.4 Contrast (WCAG 1.4.6 Contrast Enhanced)

**A-10.** All text drawn on the selection screen must meet the WCAG 2.2 AAA contrast threshold of 7 to 1 against its background. The baseline audit (AA-02, AAA-01) identifies several existing colour pairs that fail AAA. No new colour pair may be introduced that fails AAA. Simon will verify the palette choices in the design pass.

**A-11.** The highlight indicator on the currently selected item must have a contrast ratio of at least 7 to 1 against the non-highlighted items and against the background. A low-contrast highlight would mean the selection state is not perceivable.

### 4.5 Reduced motion (WCAG 2.3.3)

**A-12.** The selection screen and any animation associated with opening or closing it must respect the `this.reducedMotion` flag already in `js/game.js`. If `reducedMotion` is true, the screen must render statically with no fade, slide, or other transition animation.

---

## 5. Non-functional requirements

### 5.1 Performance

**N1-01.** The powerup inventory is a plain JavaScript array of strings (powerup type names). It must not grow beyond 20 items during normal gameplay. If the inventory reaches 20 items, the game stops storing new pickups until the player uses one. The player must be informed of this via `announce()`: "Inventory full. Use a powerup to make room." This cap exists to bound memory and to prevent the array from affecting save-state size meaningfully.

**N1-02.** The selection screen must not cause a frame-rate drop. It pauses the game loop (no `_updateGameplay()` call while the screen is open), so the only rendering cost is the selection screen itself. The screen must be drawn in a single canvas pass with no expensive operations (no shadow blur loops, no per-frame particle updates). Carol will verify this in the testing pass by profiling the frame time while the screen is open.

**N1-03.** The inventory array must not be included in the existing save-state (`nerfSquadSave` in localStorage) because inventories are per-level and do not persist across sessions. The `Game.prototype.save()` function must not be extended to include inventory data. Jacob to confirm this is consistent with the game's save-state design.

### 5.2 Save-state size

**N2-01.** The features must not increase the `nerfSquadSave` payload size. No new persistent data is introduced by either feature. The per-level inventory is transient state only.

### 5.3 Browser compatibility

**N3-01.** Both features must work in the same browsers the game currently targets. The features use no browser APIs beyond what the game already uses. No new dependencies are introduced.

---

## 6. Open questions for Jacob

These questions require architectural decisions before Sean can build either feature. They are batched here for Sonja to put to Jacob.

**OQ-01: Inventory location on the game state model.**
The player's four active powerup states (`hasShield`, `speedBoost`, `megaDartReady`, `squadActive`) currently live on the `Player` object (`js/player.js`). Should the inventory array also live on the `Player` object, or on the level state object (`this.ls`) in `js/game.js`? Argument for `Player`: it is the logical owner of what the player holds. Argument for `this.ls`: `startLevel()` already resets `this.ls`, which gives a clean per-level reset without touching the `Player` constructor. Jacob to decide and document in a decision record.

**OQ-02: Selection screen state name.**
Functional requirement F2-11 proposes the new screen state name `'select-weapon'`. The existing state name `'select'` refers to the level-select screen. Confirm whether `'select-weapon'` is acceptable, or whether Jacob prefers `'weaponselect'` or another name to avoid any ambiguity in `switch` statements across `game.js`, `_handleMenuKey`, `_dispatchTap`, and `draw()`.

**OQ-03: Selection screen relationship to the pause screen.**
The selection screen pauses gameplay while open (F2-01). The existing pause screen (`'pause'`) also pauses gameplay. Should the selection screen share any infrastructure with the pause screen (for example, a shared `_pauseGameplay()` helper that freezes game-loop updates), or should it be a standalone state that simply does not call `_updateGameplay()`? Jacob to decide. A shared helper would reduce the risk of a future regression where one pause path is changed and the other is not.

**OQ-04: `drawHUD()` signature change.**
Functional requirement F1-10 notes that `drawHUD()` will need to accept inventory data to render the powerup count. The current call site in `_drawGame()` and `_drawPause()` passes eight individual arguments. Should the signature be extended with a ninth argument (inventory array or count), or should the call be refactored to pass a player object directly? Jacob to advise. A player-object approach would be a larger refactor but would make `drawHUD()` more maintainable for future additions.

**OQ-05: Touch target layout for the selection screen at small pixel scales.**
Functional requirement A-08 requires 44 by 44 CSS pixel touch targets. At `pixelScale = 1` (the minimum), the canvas CSS width is 480 px and the canvas CSS height is 270 px. With the touch control strip at the bottom (72 px), the usable canvas area for the selection screen is 480 by 198 CSS pixels. At `pixelScale = 2`, the usable area is 960 by 396 CSS pixels. Can the selection screen fit all weapons (up to four) and up to ten distinct powerup types (five types, each possibly appearing twice) within the 198 px height at `pixelScale = 1`, while meeting the 44 px touch target rule? Simon and Jacob to confirm the layout is feasible before Sean builds it, or to recommend a scrollable list if it is not.

---

## 7. Definition of done

A pull request for either feature is ready to merge when all of the following are true.

### 7.1 Functional

- [ ] All functional requirements for the feature (F1-01 through F1-10 for Feature 1, F2-01 through F2-13 for Feature 2) are implemented and verifiable by playing the game.
- [ ] The feature does not break any existing gameplay path: title screen, level select, customise, help, settings, boss intro, gameplay, pause, level complete, game over.
- [ ] The existing `_applyPowerUp()` logic is unchanged (no refactor of effect application is needed for this work).
- [ ] The save-state format is unchanged and existing saves load without error.

### 7.2 Accessibility

- [ ] All live-region announcements (A-04 through A-07) are confirmed working with VoiceOver on macOS and JAWS on Windows by Carol's manual screen-reader pass.
- [ ] The selection screen is fully operable by keyboard alone.
- [ ] Touch targets on the selection screen meet 44 by 44 CSS pixels at `pixelScale = 1`.
- [ ] All new canvas-rendered text passes the 7 to 1 contrast check.
- [ ] The `this.reducedMotion` flag suppresses any animation on the selection screen.

### 7.3 Performance

- [ ] The inventory array does not exceed 20 items (cap logic is in place and announced).
- [ ] No frame-rate drop is observable when the selection screen is open (Carol to profile).
- [ ] No new persistent data is written to `nerfSquadSave`.

### 7.4 Code quality

- [ ] Jacob has reviewed the pull request for architectural conformance.
- [ ] Carol has completed the full test and accessibility pass per `docs/patterns/screen-reader-evidence.md`.
- [ ] The Help screen in `js/screens.js` is updated to document the new selection screen and the change to the `switch` key binding.

---

## Appendix A: Current state summary (for Sean's reference)

This section summarises what the code already does, so Sean can see exactly where new code must be added.

**Powerup pickup location:** `_updateGameplay()` in `js/game.js`, lines 805 to 814. The loop checks `rectOverlap` between the player bounding box and each live powerup. On overlap, it calls `playPowerUp()`, `_applyPowerUp()`, and `spawnParticles()`. Feature 1 changes this so that instead of calling `_applyPowerUp()` immediately, the powerup type is pushed into the inventory, and `announce()` is called with the storage message.

**Powerup application location:** `_applyPowerUp()` in `js/game.js`, lines 852 to 871. This function is unchanged by Feature 1. Feature 2 calls it from the selection screen confirm handler.

**Switch key handling location:** `_updateGameplay()` in `js/game.js`, line 693: `if (inp.switchPressed) player.cycleBlaster();`. Feature 2 replaces this with an `openSelectionScreen()` call (or equivalent).

**HUD drawing location:** `drawHUD()` in `js/hud.js`, lines 16 to 48. This function draws hearts, score, level name, blaster name, ammo, active powerup icons, and the shoot hint. Feature 1 adds a powerup count display here.

**Existing pause pattern:** `_openPause()` sets `this.gs.screen = 'pause'`, calls `announce('Game paused.')`, and calls `Speech.narrate('Game paused.', 'high')`. The selection screen should follow the same pattern.

**Existing announcement pattern:** Every screen transition calls both `announce()` (live region) and `Speech.narrate()` with matching text. Feature 2 must do the same on open, on navigation, on confirm, and on close.
