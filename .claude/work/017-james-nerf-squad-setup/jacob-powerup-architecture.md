# Architecture Decision Record: Powerup Accumulation and Selection Screen

Author: Jacob, architect.
Date: 2026-05-24.
Repository: timdixon82/James-Nerf-Squad, work folder 017.
Status: Proposed. Feeds Sean's development pass and Carol's test pass. Two features in scope, one ADR per feature plus answers to Tad's five open questions.

## Bottom line

Store the inventory on the level state object (`this.ls.inventory`), not on the `Player`. Make the selection screen a new `screen` value, `'select-loadout'`, with its own draw and tap handlers. Both fit cleanly into the existing patterns of the game. All four weapons and a reasonable powerup inventory fit on the canvas without scrolling at `pixelScale = 1`, but only because the touch-target rule is satisfied in CSS pixels (so the canvas-pixel cell can be 22 px tall when scaled). One unobvious risk: the existing input layer keeps a `switchPressed` one-shot that fires the moment the screen opens, so the new screen must consume it on open or the press will leak through and cycle weapons silently as well as opening the screen.

## Contents

1. Answers to Tad's open questions (OQ-01 to OQ-05).
2. ADR 010: Powerup inventory on the level state.
3. ADR 011: Selection screen as a new screen state.
4. Implementation path for Sean: files, order, watch-outs.
5. Risks not covered by an ADR.

---

## 1. Answers to Tad's open questions

### OQ-01: Inventory location

**Decision: store the inventory on `this.ls`, not on the `Player`.**

The four active powerup states (`hasShield`, `speedBoost`, `megaDartReady`, `squadActive`) live on `Player` because they describe a thing the player character is doing or carrying mid-fight: a shield around the sprite, a speed multiplier read by `getSpeed()`, a damage modifier read by `shoot()`, a squad counter that ticks down in `update()`. They are properties of the entity's running state, and the rendering code at `player.js:174-180` reads `hasShield` directly to draw the shield aura. Putting them on `Player` is correct for those four.

The inventory is a different shape. It is not a property of the player entity, it is a per-level resource the level holds for the player to spend. Two pieces of evidence:

- The requirement (F1-08) says the inventory is per-level and is reset each `startLevel()`. The level-reset path already exists: `this.ls` is rebuilt from scratch in `startLevel()` (game.js:589 to 611). Putting the inventory there means the per-level reset comes for free.
- The `Player` constructor at `player.js:7-39` is run inside `startLevel()` (game.js:531), so a `this.inventory = []` on the player would also reset per level. That works, but it conflates "the character's running state" with "a queue of pending pickups". The `Player` class has been kept tight and short; adding inventory to it pushes it toward being a god object.

Sean adds one line in `startLevel()`:

```javascript
this.ls = {
  player:       player,
  inventory:    [],          // new: per-level powerup queue
  enemies:      [],
  // ... rest unchanged
};
```

The pickup loop at `game.js:824-833` reads and writes `ls.inventory` directly. The selection screen reads it via `this.ls.inventory`. No new field on `Player`. The pause-screen HUD call at `game.js:961-963` passes `this.ls.inventory` alongside the existing arguments.

This also makes the inventory naturally absent on screens where `this.ls` is null (title, customise, settings, help, level select). No defensive checks needed in the drawing path.

### OQ-02: Selection screen state name

**Decision: `'select-loadout'`.**

`'select-weapon'` is workable but misleading: the screen also selects powerups to use. `'select'` is taken by the level-select screen. `'weaponselect'` lacks the hyphen the rest of the screen names use and reads worse.

`'select-loadout'` is unambiguous, distinct from `'select'`, follows the existing word-style (lowercase, hyphenated), and describes both halves of the screen. It is also clearly orthogonal to a future "loadout customisation" screen if Tim ever asks for one, because the verb "select" is what this screen does.

Add the new value everywhere `screen` is switched on:

- `_dispatchTap` switch (game.js:221-241) — new `case 'select-loadout': this._tapLoadout(x, y); break;`.
- `_handleMenuKey` switch (game.js:246-335) — new `case 'select-loadout': { ... } break;` block.
- `draw` switch (game.js:897-908) — new `case 'select-loadout': this._drawLoadout(); break;`.
- `update` (game.js:679-691) — guard `_updateGameplay` so it does not run when the screen is `'select-loadout'` (the existing guard already does this implicitly because it only runs when `screen === 'game'`, so no edit is strictly needed; but Sean should confirm).
- `_bindEvents` keydown gate (game.js:154) — the current code only calls `Input.onKeyDown` when `screen === 'game'`. The selection screen needs key input too. The fix is to also accept input when `screen === 'select-loadout'`, or simpler, route navigation keys through `_handleMenuKey` (which runs unconditionally on game.js:157) and not through the gameplay input layer at all. See OQ-03 and the implementation path.

### OQ-03: Selection screen relationship to the pause screen

**Decision: standalone state, no shared helper today; but Sean adds a single `_setScreen(name)` helper that wraps the assignment, so any future pause/loadout consolidation has one place to live.**

A shared `_pauseGameplay()` helper would be a real improvement if the game had more than two paused states. It has two. The cost of the helper now is more than the benefit it provides this week. The cost of *not* having a `_setScreen` helper is real: today, every screen transition is a raw `this.gs.screen = '...'` write. The keys-sticking diagnosis (in the architecture review) already wants a `_setScreen` that clears input on every transition. That helper lands now, even if its body is two lines, and both the selection screen and the pause screen route through it. That gives a future consolidation a single seam.

```javascript
Game.prototype._setScreen = function(name) {
  this.gs.screen = name;
  Input.clearAllInput();   // existing call from the keys-sticking fix
};
```

Open / close calls become:

```javascript
Game.prototype._openLoadout = function() {
  this._setScreen('select-loadout');
  this.loadoutIdx = this._loadoutIndexOfEquipped();
  playMenuClick();
  announce(this._loadoutOpenAnnouncement());
  Speech.narrate(this._loadoutOpenAnnouncement(), 'normal');
};
Game.prototype._closeLoadout = function(reason) {
  this._setScreen('game');
  playMenuClick();
  announce(reason);
  Speech.narrate(reason, 'high');
};
```

Same shape as `_openPause` / `_resumeGame`. No shared body, but the same skeleton.

The update loop already does the right thing: it only calls `_updateGameplay` when `screen === 'game'` (game.js:689). The selection screen does not need to do anything to pause gameplay; setting the screen value is enough. The pause screen relies on exactly the same property today. No further infrastructure is needed.

### OQ-04: `drawHUD()` signature change

**Decision: add a ninth positional argument, `inventoryCount`. Do not refactor to pass a player object today.**

The existing signature is eight arguments. Adding a ninth is ugly but localised: two call sites (`_drawGame`, `_drawPause`), one function declaration, no new file. The full refactor (pass `player`, pull fields out inside `drawHUD`) is the better long-term shape but it touches a function that already works and that Carol is about to test for screen-reader behaviour. Changing the signature now risks an off-by-one bug in a function under test.

Sean adds the ninth argument and writes a brief comment above the call site noting that a future refactor should fold the player-state arguments into a single object.

```javascript
function drawHUD(ctx, lives, score, blaster, ammo,
                hasShield, speedBoost, megaDartReady, squadActive,
                inventoryCount, level, levelName, touchMode) {
  // ...
}
```

Wait. That is ten arguments because `inventoryCount` slides in before `level`. The call site already has `this.gs.levelIdx` and `cfg.bgName` after the four powerup-state arguments. The cleanest placement is to put `inventoryCount` at the *end*, before `touchMode`, where the call site reads "now this and the touch mode". That keeps the powerup-state cluster intact and reads naturally:

```javascript
function drawHUD(ctx, lives, score, blaster, ammo,
                hasShield, speedBoost, megaDartReady, squadActive,
                level, levelName, inventoryCount, touchMode) {
  // ... existing body ...
  // New: draw count in the bottom HUD strip, to the right of the active-effect icons.
  px(ctx, 'STORED: ' + inventoryCount, CANVAS_W / 2 + 70, barY + 11, 4, '#aaffaa', 'left');
}
```

The two call sites become:

```javascript
drawHUD(this.ctx, player.lives, player.score, player.blaster, player.ammo,
        player.hasShield, player.speedBoost, player.megaDartReady, player.squadActive,
        this.gs.levelIdx, cfg.bgName, this.ls.inventory.length, tm);
```

This is fine for this feature. When a future feature adds an eleventh value, Sean refactors to a single `player`-and-`level` object.

Tad's note about "passing the player object directly" would also work, but it expands the change scope and asks Carol to retest a path she has already tested. Defer.

### OQ-05: Touch target layout at small pixel scales

**Decision: all weapons (up to four) and an inventory of up to ten distinct entries fit in the canvas at `pixelScale = 1` without scrolling, *provided* we count the touch-target rule in CSS pixels and not canvas pixels. A scrollable fallback is not required for the baseline cap. Above the cap (eleven or more rows), we use a scrollable list.**

The math, in detail.

**Canvas pixels.** At `pixelScale = 1`, the canvas is 480 by 270 CSS pixels. With the touch HUD active, the usable canvas height is `CANVAS_H - TOUCH_HUD_H = 270 - 72 = 198` CSS pixels (Tad's number).

**The touch-target rule (WCAG 2.5.5 AAA, 44 by 44 CSS pixels).** A tap target's *CSS-pixel* size is what WCAG measures. The canvas is drawn at `pixelScale * dpr`, and CSS sizing scales canvas pixels to CSS pixels at `pixelScale` to 1. So a row that is 22 canvas pixels tall renders as 22 CSS pixels at `pixelScale = 1`, which fails AAA. To meet AAA, the row needs to be at least 44 CSS pixels tall. Two routes:

- **Route A (canvas-pixel row of 44).** A row 44 canvas pixels tall. At `pixelScale = 1`, that is 44 CSS pixels. Conformant. The screen has `198 / 44 = 4.5` rows of vertical room. Four weapons fill the screen and there is no room for powerups.
- **Route B (canvas-pixel row of 22, but at minimum `pixelScale = 2`).** A row 22 canvas pixels tall. At `pixelScale = 1`, that is 22 CSS pixels. **Fails AAA at `pixelScale = 1`.** At `pixelScale = 2`, the row is 44 CSS pixels and conforms.

Neither route is satisfactory. Route A fails the requirement (four rows leaves zero room for powerups). Route B fails the requirement at the minimum pixel scale.

**The correct solution: a two-column layout.** The screen does not need one item per row. The screen needs weapons in a column and powerups in another column (or weapons across the top in two columns, powerups across the bottom in two columns). The vertical room is 198 CSS pixels. With 44 CSS-pixel-tall rows, we have 4 rows. The horizontal room is 480 CSS pixels at `pixelScale = 1`, which is wide enough for two columns of 44-pixel-wide targets with comfortable padding.

A two-column grid layout:

- **Weapons section.** Two columns of two rows. Up to four weapons. Each cell 44 by 44 CSS pixels. Header above: "WEAPONS" (one canvas line, 8 pixels). Total height: 8 + 44 + 44 + 4 padding = 100 CSS pixels.
- **Powerups section.** Two columns. Header "POWERUPS" (8 pixels). At `pixelScale = 1`, the remaining height is `198 - 100 - 8 - 4 = 86` CSS pixels, which is one row of 44-pixel-tall cells with 42 pixels left over. That is room for two powerup cells (two columns, one row).

Two cells is not enough. With five distinct powerup types and the requirement that duplicates are stored (F1-03), the inventory could realistically reach eight to ten entries during a long level.

**Final layout decision.** The inventory section uses a **grouped, count-suffixed display**, not a one-cell-per-instance list. Each distinct powerup type gets one cell. The cell shows the powerup icon, its name, and a count badge ("Shield x3" if the player holds three shields). The five powerup types fit in two rows of three columns (with one empty cell in the second row) at `pixelScale = 1`. Layout:

- Header strip: 20 CSS pixels (existing top HUD bar).
- Weapons section: header (10) + 2 rows x 44 = 98 CSS pixels.
- Powerups section: header (10) + 2 rows x 44 = 98 CSS pixels.
- Footer strip: helper text, 8 CSS pixels.
- Touch HUD: 72 CSS pixels (already excluded from the 198 usable).

Total: 20 + 98 + 98 + 8 = 224, which exceeds 198 by 26. We get there by:

- Dropping the section headers from the layout box and putting them in the cell label instead ("WEAPON: Rapid Rifle" inside the cell). Saves 20.
- Shrinking the footer to 4 CSS pixels (just a thin separator). Saves 4.
- Reusing the existing top HUD strip as the screen's header band (the player still wants to see their lives and score while choosing). Saves 0 height but adds context.

Revised total: 20 + 88 + 88 + 4 = 200. Two pixels over. Acceptable in canvas drawing terms; the top HUD strip overlaps the weapons section by two pixels, which the existing HUD already does in places.

**At `pixelScale = 2`, the layout has room to breathe and Simon can add more padding.** The decision uses the worst case (`pixelScale = 1`) as the constraint.

**Inventory cap.** The non-functional requirement N1-01 sets the cap at 20 items. The grouped display means 20 items in five types still fits in five cells (one per type). The cap is fine as written. The cell label shows "Shield x20" if the player has stockpiled twenty shields. The screen does not need scrolling.

**Scrollable fallback (if Tim later adds a sixth powerup type or a fifth weapon).** If the team adds new powerup types or weapons later, the grid is fixed at three columns and grows downward; a sixth powerup wraps to a third row. If a third row does not fit, the powerups section becomes scrollable: ArrowDown past the last visible row scrolls the viewport, and the touch surface gets up/down arrows to scroll. We do not need that today.

**The 44 CSS-pixel rule, restated for Sean.** When the cell is drawn at canvas pixel size `N`, its CSS size at `pixelScale = 1` is also `N`. At `pixelScale = 2` it is `2N`. The cell must be at least `44 / pixelScale` canvas pixels tall and wide. At the minimum supported scale (`pixelScale = 1`), that is 44 canvas pixels. Sean sizes cells at 44 canvas pixels and the rule is met at every scale.

---

## 2. ADR 010: Powerup inventory stored on level state, drained per level

**Status.** Proposed.

**Context.** A new gameplay feature stores pickups instead of applying them immediately. The state must be per-level (F1-08), must coexist with the four existing active-effect states on `Player`, must support duplicates (F1-03), and must not bloat the save file (N2-01).

**Decision.** The inventory is a plain JavaScript array of powerup type strings, stored at `this.ls.inventory` and reset by `startLevel()`. It is read by the pickup loop (game.js:824-833), by the HUD render (hud.js, drawHUD), and by the selection screen draw and confirm handlers. It is not stored on the `Player` constructor, not added to the `nerfSquadSave` payload, and not persisted across sessions.

**Alternatives considered.**

- *Put it on `Player`.* Rejected. The four existing active-effect states belong on `Player` because they affect the player entity's per-frame update and draw. The inventory is a holding queue, not a property of the running character.
- *Put it on `gs` (the top-level game state).* Rejected. `gs` holds session-wide state (completed levels, high scores, key bindings). An inventory that resets per level does not belong there.
- *A separate top-level field on `Game`.* Rejected. `Game` already has too many ad-hoc fields (`pauseMenuIdx`, `customiseFocus`, `helpPage`). Adding another for level-scoped data hides the per-level lifetime; `this.ls` makes it visible.

**Consequences.**

- The inventory clears for free when `startLevel()` runs. No new reset path.
- The HUD draw call needs the inventory length passed in (see OQ-04).
- The pickup loop pushes onto `this.ls.inventory`. The selection screen pops by type. Both are simple array operations.
- The save payload is unchanged. N2-01 holds.

**Implementation pointer.** `startLevel()` at game.js:589. Pickup loop at game.js:824-833 changes its body from calling `_applyPowerUp` to pushing the type onto `ls.inventory`, then calling `announce` and `Speech.narrate` with the storage message.

---

## 3. ADR 011: Selection screen as a new screen value `'select-loadout'`

**Status.** Proposed.

**Context.** The `switch` key currently cycles weapons silently during gameplay (game.js:709). The new feature replaces that with a pause-style modal screen that lets the player pick a weapon to equip or a powerup to use. The screen must pause gameplay (F2-01), follow the existing announcement pattern (F2-04 through F2-07, A-04 through A-06), and meet WCAG 2.2 AAA touch and contrast bars.

**Decision.** Introduce a new value for `this.gs.screen`: `'select-loadout'`. The value distinguishes the screen in the switch statements at `_dispatchTap`, `_handleMenuKey`, and `draw`. The screen has its own draw function (`_drawLoadout`), its own tap handler (`_tapLoadout`), and its own key handler (a new case in `_handleMenuKey`). A new `_openLoadout` method routes through a new `_setScreen` helper that clears input. A new `_closeLoadout(reason)` method does the same in reverse.

**Alternatives considered.**

- *Extend the existing `'pause'` state with a sub-mode.* Rejected. The pause screen has its own menu (resume / quit). Adding a third sub-mode would entangle two unrelated screens; F2-10 requires the selection screen to be inaccessible from the pause screen.
- *Render the selection screen as an overlay during `'game'` without changing `screen`.* Rejected. The update loop reads `screen === 'game'` to decide whether to advance gameplay (game.js:689). An overlay-only approach would need a second flag (`this.gs.modalOpen`) checked in the same place. A new screen value is the cleaner shape and matches every other modal in the codebase.
- *Use the value `'select-weapon'`.* Rejected on grounds that the screen also chooses powerups. See OQ-02.

**Consequences.**

- The switch statements at game.js:221 (`_dispatchTap`), game.js:246 (`_handleMenuKey`), and game.js:897 (`draw`) each gain a case. The update loop at game.js:679 is unchanged because it already gates gameplay on `screen === 'game'`.
- The `_setScreen` helper is added now and is also used by the keys-sticking fix proposed in the architecture review. The two pieces of work consolidate. No regression risk to existing transitions because `_setScreen` does nothing more than the existing assignment plus a `clearAllInput` call.
- A new file is not needed; the new draw function lives in `screens.js` alongside the other screen drawers, and the new tap and key handlers live in `game.js` alongside the existing ones.
- The Help screen (`screens.js`, `drawHelpScreen`) must be updated to document the new screen and the new behaviour of the `switch` key. This is in scope for the feature PR (Definition of Done, 7.4).

**Implementation pointer.** New methods on `Game.prototype`: `_openLoadout`, `_closeLoadout`, `_tapLoadout`, `_loadoutIndexOfEquipped`, `_loadoutOpenAnnouncement`, `_drawLoadout`. New top-level function in `screens.js`: `drawLoadoutScreen(ctx, weapons, inventory, currentBlaster, highlightIdx, frame, touchMode)`. New case in `_handleMenuKey` for `'select-loadout'`. The `switch` key handling at game.js:709 changes from `player.cycleBlaster()` to `this._openLoadout()`.

---

## 4. Implementation path for Sean

Order of work, smallest viable PR per step, all checks pass before the next step starts.

### Step 1: Add the `_setScreen` helper and the input-clear path

Adds `Game.prototype._setScreen(name)` and `Input.clearAllInput()`. Routes all existing screen transitions through `_setScreen`. No behaviour change. This step is also the keys-sticking fix described in the architecture review; doing it now means the two features land on a clean input layer.

Files:

- `js/input.js` — add `clearAllInput()` that empties `held`, sets every `state.*` boolean to false, calls `clearOneShots`.
- `js/game.js` — add `Game.prototype._setScreen = function(name) { this.gs.screen = name; Input.clearAllInput(); };`. Replace every `this.gs.screen = '...'` with `this._setScreen('...')`. Grep for `this.gs.screen =` and there are ten or so call sites. None of them should set the screen and *not* clear input; the existing behaviour silently leaked input between screens.

Validation: every existing screen transition still works, and Tim's reported keys-sticking bug is gone after Alt-Tab.

### Step 2: Inventory storage and pickup behaviour change (Feature 1)

Files:

- `js/game.js` — in `startLevel`, add `inventory: []` to the `this.ls` literal at game.js:589. In the pickup loop at game.js:824-833, replace the call to `_applyPowerUp(pu.type, player, ls)` with `ls.inventory.push(pu.type)` plus the announce / narrate calls (F1-05). If `ls.inventory.length >= 20`, do not push; announce "Inventory full. Use a powerup to make room." instead (N1-01).
- `js/hud.js` — extend `drawHUD` to accept `inventoryCount` between `levelName` and `touchMode`. Draw "STORED: N" in the lower HUD strip. Tim's screen reader gets the count via the live region (A-07), not the canvas text, so the canvas text is decoration; the live region update fires from the pickup path in game.js, not from `drawHUD`.
- `js/game.js` — in the two `drawHUD` call sites (`_drawGame`, `_drawPause`), pass `this.ls.inventory.length`.

Validation: pick up a powerup, see "STORED: 1" on the HUD, hear the announcement, confirm `_applyPowerUp` was not called.

### Step 3: Selection screen state and handlers (Feature 2)

Files:

- `js/game.js` — add `_openLoadout`, `_closeLoadout`, `_tapLoadout`, `_loadoutIndexOfEquipped`, `_loadoutOpenAnnouncement`. Add the new case to `_dispatchTap`, `_handleMenuKey`, and `draw`. Change game.js:709 (`if (inp.switchPressed) player.cycleBlaster();`) to `if (inp.switchPressed) this._openLoadout();`. **Watch-out: clear `Input.state.switchPressed` inside `_openLoadout` after consumption.** The one-shot is set on keydown; if the screen reads it on open and the next frame the player presses Enter (which Enter is *not* the switch key, but Escape closes the screen and the switch key reopens it), an unconsumed `switchPressed` from the open moment will fire on the *closing* frame's read and reopen the screen. The `_setScreen` helper handles this because it calls `Input.clearAllInput`.
- `js/game.js` — add an additional input gate. The existing keydown listener at game.js:154 only forwards to `Input.onKeyDown` when `screen === 'game'`. The selection screen reads its keys through `_handleMenuKey` (which runs unconditionally at game.js:157), so this gate does not need to change for menu navigation. But the `switch` key is read through `inp.switchPressed` from the gameplay-input layer; it is only set during `'game'`. After the screen opens, the `switch` key needs to close the screen. Route the close on `switch` through `_handleMenuKey` so it works regardless of the gameplay-input gate.
- `js/screens.js` — add `drawLoadoutScreen(ctx, weapons, inventory, currentBlaster, highlightIdx, frame, touchMode)`. Layout per OQ-05: weapons grid (two columns by two rows, top half), powerups grid (three columns by two rows, bottom half), each cell 44 by 44 canvas pixels. Highlight indicator at 7:1 contrast (A-11). Show "EQUIPPED" tag on the current blaster cell. Show count badges on powerup cells. Render the empty-powerups message "No powerups stored." when the inventory length is zero (F2-09).
- `js/screens.js` — update `drawHelpScreen` to document the new selection screen and the change to the switch key.

Validation: pressing `switch` during gameplay opens the screen, pauses everything, plays the announcement, places the highlight on the equipped weapon, and closes on Escape with "Selection cancelled. Game resumed." Tapping a powerup uses it and resumes gameplay.

### Step 4: Touch handling on the selection screen

The selection screen needs touch buttons. The existing pattern uses `getMenuNavButtons('udselback')` (up, down, select, back) for similar modal screens. Use the same pattern for keyboard parity.

Files:

- `js/game.js` — in `_tapLoadout`, hit-test the menu nav strip first (`hitTestMenuNav`), then hit-test the individual cells. Cells are at 44-pixel grid positions Simon will lock in design.
- `js/screens.js` — call `drawMenuNavStrip` at the bottom of the loadout draw function when `touchMode` is true (matches the existing pattern across other modal draws).

Validation: on a touch device, the screen is fully reachable by tapping cells or by using the nav strip.

### Watch-outs (read before coding)

1. **`Input.state.switchPressed` is a one-shot and must be cleared on screen open.** If not cleared, the same press that opened the screen will also trigger anything else that reads `switchPressed` on the next frame. The `_setScreen` helper handles this if you route through it.

2. **The keydown listener gate at game.js:154 only fires `Input.onKeyDown` during `'game'`.** That means the selection screen does *not* see continuous keys like Shift-held; it only sees discrete keydown events through `_handleMenuKey`. Good for menu navigation. Confirm that the `switch` key, when bound to a non-default key like `Tab`, still works to close the screen — the menu key handler reads `e.key`, so it sees the literal key string, not the binding name. The close path needs to check `key === this.gs.keys.switch` to be binding-aware.

3. **The pause screen reuses `_drawScene` and `drawHUD` to keep the world visible behind the pause panel** (game.js:956-967). The selection screen should do the same so the player sees what they are about to switch to. Reuse the same pattern; do not redraw the world differently.

4. **The HUD signature change ripples to two call sites.** Grep `drawHUD(` and update both. Do not miss `_drawPause`.

5. **`announce()` and `Speech.narrate()` must run on every navigation press**, not only on open and close (A-05). That is a lot of calls. The narrate path has a queue with priorities; A-05 says "normal" priority for navigation. The announce path has no queue; the live region just gets the latest text. Both calls cost effectively nothing.

6. **Reduced motion (A-12).** The `this.reducedMotion` flag is checked at game start to decide whether to run the loop at all (game.js:626). If reduced motion is on and the game is running anyway (Tim turned it on mid-session, edge case), the selection screen must not animate the highlight. Use a static highlight when `this.reducedMotion` is true. The existing draw code does not check this flag inside the per-screen draws; this is a small gap the selection screen should fill.

7. **The `'select'` and `'select-loadout'` strings differ by a hyphen and a word.** Easy to typo into a bug that opens the level-select screen during gameplay. Define a constant `SCREEN_LOADOUT = 'select-loadout'` at the top of game.js and reference it everywhere. (The codebase does not use this pattern today, but the cost is small and the safety is real for two near-identical strings.)

---

## 5. Risks not covered by an ADR

### 5.1 Save-state impact (answering Tad's check on N1-03)

Save-state is **unchanged**. The inventory is per-level and lives on `this.ls`. The `Game.prototype.save` function at game.js:67-79 reads from `this.gs`, never from `this.ls`. As long as the inventory is on `this.ls` (per ADR 010), the save path is invariant. No extension to `nerfSquadSave` is needed and N1-03 / N2-01 hold.

Confirmation: existing saves load with no migration. The `load` function at game.js:81 reads only the keys that `save` writes. A save written before this feature still loads cleanly; a save written after this feature has no inventory key because the save does not include one.

### 5.2 The `'select'` versus `'select-loadout'` ambiguity in pattern matching

Some code patterns in `screens.js` test screen-related state with substring matches (none currently in the code I checked, but a future contributor could write `if (screen.startsWith('select'))` thinking it covers both). The mitigation is the constant defined above and a project-coding-standards note that screen values are compared with `===`, never with `startsWith`.

### 5.3 The pickup announcement queue

Five powerups can be picked up in rapid succession during a boss fight. Each picks calls `announce()` and `Speech.narrate('...', 'normal')`. The speech synthesis layer queues at normal priority; five queued utterances at "normal" will play sequentially over several seconds. That is the existing behaviour pattern (see how hit announcements queue), and it is fine. But Carol should listen for the queue building up behind a flurry of pickups; if it backlogs noticeably, the team adjusts to speak only "Shield stored, plus 4 more" when more than two are picked in a one-second window. Treat this as a Carol observation, not a Sean implementation task.

### 5.4 The ammo powerup edge case

The ammo powerup applied immediately today (F1-07) refills every blaster. From the inventory, the same logic runs unchanged, but the screen has to draw it sensibly: an "Ammo x3" cell looks misleading if using one of them refills every blaster to full. There is no functional bug — F1-07 says behaviour is unchanged — but a player who stockpiles five ammo powerups and uses one will see "Ammo x4" remain. Tad's requirements say the per-instance count is correct; Carol's testing will tell Tim whether players find it confusing. Architecture-side, the model is clean.

### 5.5 The Help screen must be updated in the same PR

Definition of Done 7.4 already calls this out. The current help screen (`drawHelpScreen` in `screens.js`) has three pages. The new selection screen and the new switch key behaviour need a fourth page, or text added to an existing page. Sean adds this in the same PR. Tad writes the copy in Tim's voice.

### 5.6 No new ADRs required for the existing input layer

The keys-sticking fix is already an open ADR (it predates this work). The `_setScreen` helper this work adds is the same mechanism the keys-sticking fix needs, and the two pieces of work converge. No new ADR is opened by this work specifically.

---

## Handoff envelope

- **To Sonja.** Two ADRs (010, 011) and answers to OQ-01 through OQ-05. Ready to dispatch Sean once Simon has confirmed the visual layout at `pixelScale = 1` (cell sizes, contrast pairs, highlight indicator). No new questions to Tim from this review.
- **To Sean.** Implementation path in section 4. Four steps, each smaller than the last; start with the `_setScreen` helper (which also fixes the keys-sticking bug). Watch-outs at the end of section 4 are the load-bearing ones; the `switchPressed` clear and the HUD signature ripple are the two I expect to bite.
- **To Carol.** New test surfaces: pickup-as-store behaviour, the selection screen open / navigate / close paths, the HUD count update, the live-region pattern on every navigation press, the touch grid at `pixelScale = 1` and `pixelScale = 2`, the empty-inventory case (F2-09), the inventory cap (N1-01), the reduced-motion case (A-12). Save-state is unchanged so the existing save-load test still passes.
- **To Jed.** No new security surface. No new persisted data. No new network calls. No new third-party code. Nothing for the security review beyond the existing baseline.

### Files Sean will touch

- `/Users/timdixon/Code/AgentTeam/Inputs/James-Nerf-Squad/js/game.js` (the bulk of the change).
- `/Users/timdixon/Code/AgentTeam/Inputs/James-Nerf-Squad/js/input.js` (one new function).
- `/Users/timdixon/Code/AgentTeam/Inputs/James-Nerf-Squad/js/hud.js` (one new argument, one new line of text).
- `/Users/timdixon/Code/AgentTeam/Inputs/James-Nerf-Squad/js/screens.js` (new `drawLoadoutScreen`, update `drawHelpScreen`).

No new files. No new dependencies. No build step changes.
