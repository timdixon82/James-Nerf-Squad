# Test Pass: PR 5 — Powerup Accumulation and Loadout Screen

Tester: Carol
Date: 2026-05-24
PR: https://github.com/timdixon82/James-Nerf-Squad/pull/5
Branch: feat/powerup-accumulation-and-loadout-screen
Commit: b479b29
Work folder: 017-james-nerf-squad-setup

## Verdict

Rework required.

Two blocking defects found: a touch hit-box mismatch that causes weapon cell taps to miss on all touch devices, and locked weapons appearing as selectable choices in the loadout. Both are functional and accessibility failures. Five non-blocking items are recorded for follow-on.

---

## Scope

This test covers the four files changed in commit b479b29:

- js/input.js: clearAllInput function.
- js/game.js: _setScreen helper, inventory storage, loadout screen methods, screen constant.
- js/hud.js: inventoryCount parameter and STORED label.
- js/screens.js: drawLoadoutScreen, drawHelpScreen page 4.

Requirements source: tad-powerup-system-requirements.md (F1-01 through F2-13, A-01 through A-12, N1-01 through N3-01) and jacob-powerup-architecture.md (ADR 010, ADR 011).

---

## Functional Tests

### FT-01: clearAllInput and _setScreen (ADR 011 Step 1)

Pass. Input.clearAllInput() zeros held, touchHeld, and all state booleans (lines 67-81 of input.js). Exposed on the Input object (line 143). Game.prototype._setScreen sets gs.screen and calls Input.clearAllInput immediately (lines 704-707 of game.js). All 14 former bare screen assignments now route through _setScreen. The SCREEN_LOADOUT constant is defined at line 8 and used in all three switch statements.

### FT-02: Inventory initialisation and per-level reset (F1-08, ADR 010)

Pass. inventory: [] is added to the this.ls literal in startLevel() at line 613. startLevel() rebuilds this.ls from scratch on every call, so the inventory resets per level at no extra cost.

### FT-03: Powerup pickup stores rather than applies (F1-01, F1-02, F1-03)

Pass. The pickup loop (lines 854-871) no longer calls _applyPowerUp on contact. Instead it checks ls.inventory.length < 20 and pushes the type string, or announces "Inventory full" if the cap is reached. Duplicates are stored correctly because the array is unrestricted within the cap. The world powerup is marked alive=false regardless.

### FT-04: Inventory cap at 20 and announcement (N1-01, F1-05)

Pass. The cap check is on line 861. When at or above 20, the code announces "Inventory full. Use a powerup to make room." and calls Speech.narrate('Inventory full.', 'normal'). No push occurs. The 21st powerup disappears from the world but is not stored.

### FT-05: Pickup announcement text (F1-05)

Deviation noted, non-blocking. Requirement F1-05 specifies the announce text as "[Powerup name] stored. You now hold [N] powerup(s)." The code announces "[label] stored. Press Switch to open loadout." (line 863). The count is absent; instead the text gives a usage hint. The deviation is informative and unlikely to confuse the player, but it diverges from the signed-off requirement. Flagged as non-blocking for Tim to decide.

### FT-06: Loadout screen opens from game only (F2-10, ADR 011)

Pass. _openLoadout is only reachable from _updateGameplay, which is only called when gs.screen === 'game' (line 719). The loadout cannot be opened from any other screen.

### FT-07: switchPressed one-shot clear on open (ADR 011 Watch-out 1)

Pass. _openLoadout calls _setScreen(SCREEN_LOADOUT) at line 950. _setScreen calls Input.clearAllInput, which sets switchPressed to false (line 76 of input.js covers all booleans in state). The comment on line 950 confirms this is intentional. The one-shot cannot leak through.

### FT-08: Loadout opens with highlight on equipped weapon (F2-12)

Pass. _openLoadout sets loadoutIdx = this._loadoutIndexOfEquipped() before calling _setScreen (line 949). _loadoutIndexOfEquipped iterates Object.keys(BLASTERS) and returns the index of the matching blaster (lines 932-938).

### FT-09: Loadout shows ALL weapons including locked ones (F2-02)

FAIL — Blocking (B-02).

Requirement F2-02 states the weapons section lists every blaster the player has unlocked in the current level. The loadout screen receives BLASTERS (the full global constant) rather than player.unlockedBlasters. Both drawLoadoutScreen (line 1143) and the _handleMenuKey switch block (line 335) and _tapLoadout (line 1011) all operate on Object.keys(BLASTERS), which returns all four weapons regardless of unlock state.

On Level 1, only the pistol is unlocked. The loadout shows pistol, rifle, mega, and scatter. Selecting an unlocked weapon calls _confirmLoadoutSelection which sets player.blaster to the chosen key without checking player.unlockedBlasters. This allows the player to equip a weapon they have not unlocked and have no ammo for (because ammo initialisation in startLevel only fills unlocked blasters).

Rework needed: pass player.unlockedBlasters to the draw and tap methods, or filter BLASTERS against unlockedBlasters before computing the weapon list.

### FT-10: Navigation wrap in loadout (F2-04, F2-13)

Pass with note. Navigation wraps at totalCells = weapons.length + invTypes.length (lines 337-345). When the inventory is empty, totalCells equals weapons.length and the Down arrow wraps from the last weapon back to the first — consistent with F2-13 which says the wrap should not enter an empty powerups section. When powerups are present, Down from the last weapon enters the first powerup, which is correct. Note: because of B-02, the weapon list is currently all 4 weapons; after the B-02 fix the wrap logic will still be correct.

### FT-11: Equip a weapon from loadout (F2-05)

Pass (excluding the locked-weapon issue covered by B-02). _confirmLoadoutSelection sets player.blaster = weapons[i] for weapon cells (line 993) and calls _closeLoadout with "[name] equipped. Game resumed." (line 995). This will update the HUD blaster name and colour on the next draw frame.

### FT-12: Use a powerup from loadout (F2-06, F1-04)

Pass. _confirmLoadoutSelection for powerup cells splices exactly one instance from ls.inventory using indexOf (lines 998-1001) then calls _applyPowerUp(type, player, ls) (line 1001). _applyPowerUp is unchanged from its pre-PR form. The splice removes one instance even if the same type appears multiple times, satisfying the per-instance removal requirement.

### FT-13: Close without selection (F2-07)

Pass. The Escape key and the switch key (k.switch, binding-aware) both call _closeLoadout('Selection cancelled. Game resumed.') at line 339. The Back touch button maps to Escape via _menuNavKey and also triggers the same close.

### FT-14: Empty powerups section text (F2-09)

Pass. When invTypes.length === 0, drawLoadoutScreen renders "No powerups stored." followed by two guidance lines (lines 371-374).

### FT-15: Save state unchanged (N1-03, N2-01)

Pass. The inventory is on this.ls. Game.prototype.save reads only from this.gs. No inventory key is written to localStorage.

### FT-16: Help screen page 4 (Definition of Done 7.4)

Pass. _prevHelp and _nextHelp wrap at 4 (line 503-504). drawHelpScreen tests page === 3 and renders loadout documentation (lines 503-521 of screens.js). Page 4 covers: storage behaviour, 20-item cap, Shift to open, weapon equip, powerup use, Escape to close, touch tap instruction. The controls page (page 0) shows LOADOUT with a cross-reference to page 4.

---

## Touch Tests

### TT-01: Weapon cell tap hit-box mismatch

FAIL — Blocking (B-01).

drawLoadoutScreen uses weaponStartY = 50 (screens.js line 335). _tapLoadout uses weaponStartY = 68 (game.js line 1025). The tap handler's Y coordinate for every weapon cell row is 18 canvas pixels below the drawn cell position. At pixelScale = 1, this means the top 18 CSS pixels (41%) of each weapon cell does not register a tap. A player tapping the upper portion of a weapon cell — including the cell label text — will get no response. Only the bottom 59% of the drawn cell registers.

The powerupStartY in the tap handler inherits the same weaponStartY = 68 base, so powerup cells are also displaced relative to drawn positions by the same 18-pixel delta.

Rework needed: align weaponStartY in _tapLoadout to match drawLoadoutScreen (change 68 to 50), or extract the constant to a shared location.

### TT-02: Touch nav strip Back button closes loadout

Pass. _tapLoadout calls hitTestMenuNav first (line 1015). The 'menu-back' button maps to 'Escape' via _menuNavKey, which _handleMenuKey routes to _closeLoadout. drawLoadoutScreen calls drawMenuNavStrip with 'udlrselback' when touchMode is true (lines 410-412 of screens.js).

### TT-03: Touch nav strip navigation calls _announceLoadoutFocus

Pass. The nav strip up/down/left/right buttons map to ArrowUp/ArrowDown/ArrowLeft/ArrowRight via _menuNavKey. The SCREEN_LOADOUT case in _handleMenuKey fires _announceLoadoutFocus on every arrow key (lines 341-347).

---

## Accessibility Tests

### AT-01: Keyboard operability (WCAG 2.1.1, 2.1.3) — A-01, A-02

Pass. Every loadout action is reachable by keyboard: open (Shift), navigate (Arrow keys), select (Enter), close (Escape or Shift). The switch key checks k.switch (binding-aware) for close, so custom bindings work correctly.

### AT-02: Live region on open (A-04)

Partial pass, non-blocking deviation. A-04 requires the open announcement to name the screen and the currently highlighted item. _loadoutOpenAnnouncement returns "Loadout screen. 4 weapons. N powerup(s) stored. Use arrow keys to navigate, Enter to select, Escape to close." This gives aggregate counts but does not name the specific highlighted item (e.g. "Currently on: Starter Pistol (equipped)"). The player must press an arrow key to hear the item name. Flagged as non-blocking; the announcement is informative but does not fully meet A-04.

### AT-03: Live region on navigation (A-05)

Pass. _announceLoadoutFocus is called on every ArrowRight, ArrowDown, ArrowLeft, ArrowUp press in the loadout (lines 343, 347). For weapons it announces "[name]" or "[name] (equipped)". For powerups it announces "[label], [N] stored." Speech.narrate is called alongside announce on each step.

### AT-04: Live region on close (A-06)

Pass. _closeLoadout announces and narrates the reason string at 'high' priority for weapon equip, powerup use, and cancel paths (lines 995, 1003, 1005, 959-960).

### AT-05: HUD powerup count (F1-09, A-07)

Partial pass, non-blocking deviation. A-07 requires the HUD powerup count to be written to the aria-live region whenever it changes. The HUD STORED label is drawn on the canvas (hud.js line 47) and reads correctly to sighted users. However, the pickup announce at line 863 says "[label] stored. Press Switch to open loadout." — it does not say "Powerups stored: N" as A-07 specifies. The count change is announced indirectly (the player can infer +1 per pickup) but the exact count is not included in the live region text on each pickup. Non-blocking for the same reason as FT-05: the text is informative, but it diverges from the requirement.

### AT-06: Contrast on loadout screen (A-10, WCAG 1.4.6 AAA)

Two failures found:

- '#888888' (subtitle text "SELECT WEAPON OR USE A POWERUP", line 328; empty-powerups primary message "No powerups stored.", line 372): 5.57:1 against the near-black blended background. Fails the 7:1 AAA threshold. Passes AA (4.5:1) only.
- '#666666' (empty-powerups guidance lines, lines 373-374): 3.47:1 against the near-black blended background. Fails both AA and AAA.
- '#ff4444' (mega blaster name, drawn via BLASTERS.mega.color): 5.68:1 against near-black. Fails AAA.
- '#4488ff' (shield powerup label, drawn via POWERUPS.shield.color): 5.21:1 against near-black. Fails AAA.
- '#ff4400' (megadart powerup label, drawn via POWERUPS.megadart.color): 5.58:1 against near-black. Fails AAA.
- 'AMO:' label (line 363, '#aaaaaa'): 8.46:1. Passes.
- Highlight '#ffff44': 18.19:1. Passes.
- EQUIPPED '#44ff44': 14.27:1. Passes.
- Count 'x[N]' '#ffff44': 18.19:1. Passes.

The five failing colours are all pre-existing values inherited from constants.js (blaster and powerup colour definitions). They were not introduced by this PR but they are newly displayed as accessible text in the loadout screen. Carol flags these for Simon to review.

### AT-07: Contrast on highlight border (A-11)

Pass. The highlight border is '#ffff44' (yellow) drawn with strokeRect against cells whose background is rgba(255,255,68, ~0.28) over near-black, yielding approximately #141414. Yellow against that gives 9.18:1. Passes AAA.

### AT-08: Touch target size at pixelScale = 1 (A-08, WCAG 2.5.5 AAA)

Fail (covered by B-01). The cells are drawn at 44 canvas pixels = 44 CSS pixels at pixelScale = 1, which meets the 44 by 44 requirement. However, the hit-box offset means that despite the drawn cell meeting the size requirement, the tap-registering region is shifted 18px down within the cell. The effective tap area is the bottom 26 CSS pixels of each cell. This does not meet the 44 CSS pixel tap target requirement because the registerable region is smaller and misaligned with the visual target.

### AT-09: Reduced motion (A-12, WCAG 2.3.3)

Pass. drawLoadoutScreen receives reducedMotion as its final parameter (passed from _drawLoadout at line 1145, which reads this.reducedMotion). When reducedMotion is true, the highlight alpha is fixed at 0.28 rather than the 0.18 + sin(frame) pulsing formula (lines 346, 387). Static highlight renders correctly.

### AT-10: Assertive/polite live region usage (S-08)

Pass. All loadout announce calls use announce() (polite live region) and Speech.narrate at normal or high priority. No assertive live region is used. The open/close/navigation paths are correctly polite.

### AT-11: Screen reader open announcement not announcing the initial focus item

Non-blocking deviation (also covered under AT-02). The open announcement does not name the initially focused weapon. A screen reader user who opens the loadout and does not press any key will hear the aggregate announcement but not the specific item that is highlighted. They must press an arrow key to hear "Starter Pistol (equipped)". This is inconsistent with the pattern on other screens (level select announces the hover item on open). Flagged as non-blocking.

---

## Visual Checks

### VC-01: Loadout overlay and layout

Pass by code inspection. The semi-transparent overlay (rgba(0,0,0,0.82)) renders over the game scene, consistent with the pause screen pattern. The scene behind the overlay remains visible (drawScene is called before the overlay). The weapons grid (2 columns) and powerups grid (3 columns) are drawn at the specified positions.

### VC-02: Help page 4 legibility

Pass by code inspection. Page 4 text is drawn at px size 4 (approximately 4 canvas pixels tall). At pixelScale = 1, this is 4 CSS pixels tall. The pixel font (px function) renders at small but readable sizes at the game's native scale. The line content is factual and concise.

### VC-03: STORED label on HUD

Pass. The 'STORED:N' label is drawn in '#aaffaa' (green) at barY + 11 when inventoryCount > 0 (hud.js lines 46-48). It is absent when the inventory is empty, which is correct and avoids visual clutter.

### VC-04: 'AMO:' typo in loadout cell

Non-blocking. Line 363 of screens.js draws 'AMO:' + blasterData.ammo. The intended text is 'AMMO:' or 'AMMO'. The word 'AMO' is not standard English and will read as gibberish to a screen reader if the canvas label were ever part of the accessible tree (it is not — canvas content is inaccessible). The visual label for sighted users reads incorrectly. Flagged as a minor visual defect.

---

## Accessibility Regression Suite Checks

The project is on the static front-end stack. Relevant entries:

S-07 (Emoji in live regions): No emoji found in any announce() or Speech.narrate() call added by this PR. Pass.

S-08 (Assertive live region for non-urgent feedback): No assertive region added by this PR. All loadout announcements use the polite live region. Pass.

S-10 (Focus indicator contrast): Not applicable to canvas-game screens. No HTML focus indicators added by this PR.

S-12 (Modals missing role, focus management): The loadout is a canvas overlay, not an HTML modal. The existing canvas-game accessibility posture (noted in carol-baseline-audit.md) applies. No HTML modal attributes are needed for this screen.

---

## Blocking Items (must be fixed before merge)

### B-01: Weapon and powerup cell tap hit-boxes are offset 18 canvas pixels from drawn cells

Location: game.js _tapLoadout, line 1025 (weaponStartY = 68) vs screens.js drawLoadoutScreen line 335 (weaponStartY = 50).

Impact: the top 41% of every weapon cell in the loadout does not register a tap. On a touch device this makes weapon selection unreliable. At pixelScale = 2 the drawn cell is 88 CSS pixels tall but the tap-miss zone grows to 36 CSS pixels. Powerup cells are displaced by the same amount because powerupStartY derives from weaponStartY.

Fix required: change line 1025 of game.js from `var weaponStartY = 68;` to `var weaponStartY = 50;`, matching screens.js.

Test to confirm: at pixelScale = 1 in a browser, tap the label text area in the top half of each weapon cell and confirm it registers a selection.

### B-02: Loadout shows and allows equipping locked weapons

Location: game.js lines 335 (_handleMenuKey), 1011 (_tapLoadout), 1143 (_drawLoadout); screens.js line 313 (drawLoadoutScreen receives BLASTERS).

Impact: on Level 1, the loadout displays rifle, mega, and scatter alongside pistol. The player can select and equip a locked weapon. _confirmLoadoutSelection does not check player.unlockedBlasters before setting player.blaster (line 993). The player can fire a weapon they have not unlocked and whose ammo was not initialised (ammo defaults to 0 for weapons not in unlockedBlasters).

Fix required: filter the weapon list against player.unlockedBlasters before passing it to the draw function, the tap handler, and the keyboard handler. One approach: in _openLoadout (and _tapLoadout and the SCREEN_LOADOUT case in _handleMenuKey), compute `var weapons = this.ls.player.unlockedBlasters` instead of `Object.keys(BLASTERS)`. Pass the filtered list through to drawLoadoutScreen.

Test to confirm: start Level 1, open loadout, confirm only the pistol appears. Start Level 2, open loadout, confirm pistol and rifle appear. Start Level 5, confirm pistol, rifle, and mega appear.

---

## Non-blocking Items (follow-on)

### NB-01: Pickup announce text diverges from F1-05

The pickup announcement says "[label] stored. Press Switch to open loadout." Requirement F1-05 specifies "[Powerup name] stored. You now hold [N] powerup(s)." The count is absent. This is informative but diverges from the signed-off requirement. Tim to confirm whether the actual text is preferred.

### NB-02: Open announcement does not name the highlighted item (A-04)

The open announcement gives aggregate counts but not the specific focused item. A screen reader user must press an arrow key to hear the focused weapon name. Recommended: append the focused item name to the open announcement text in _loadoutOpenAnnouncement.

### NB-03: Contrast failures on inherited blaster and powerup colours

Five colours fail the WCAG 2.2 AAA 7:1 threshold when used as text on the near-black loadout background:

- '#888888' (subtitle and empty-state message): 5.57:1, passes AA only.
- '#666666' (empty-state guidance): 3.47:1, fails AA and AAA.
- '#ff4444' (mega blaster): 5.68:1, passes AA only.
- '#4488ff' (shield powerup): 5.21:1, passes AA only.
- '#ff4400' (megadart powerup): 5.58:1, passes AA only.

These colours come from constants.js and are used for in-game rendering on varying backgrounds where they may pass. The loadout screen's near-black background exposes the failures. Simon to adjust the loadout-specific text colours, or update the constant values if the in-game uses also fail AAA.

### NB-04: 'AMO:' typo in loadout cell

Line 363 of screens.js: `px(ctx, 'AMO:' + blasterData.ammo, ...)`. Should read 'AMMO:'. Minor visual defect.

### NB-05: Manual VoiceOver and JAWS pass not yet completed

This test pass is code inspection only (canvas-based game, no build tooling, no live server in this environment). The screen-reader evidence gate required by CLAUDE.md (docs/patterns/screen-reader-evidence.md) has not been satisfied. Carol's past passes on this repository established the pattern. Before this PR merges, the live VoiceOver pass (macOS) and JAWS pass (Windows) must be run to confirm:
- The announce() live region fires on loadout open, navigation, and close.
- Speech.narrate() speech reads the loadout text without unexpected interruptions.
- The aria-live region in index.html continues to function correctly.

---

## Token and tool-call record

Tool calls: approximately 30 Read and Bash calls.
Estimated input tokens: approximately 45,000.
Estimated output tokens: approximately 4,000.
