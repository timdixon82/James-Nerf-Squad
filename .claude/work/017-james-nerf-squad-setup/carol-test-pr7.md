# Test Report: PR 7 — Pause Fix, Auto-Use Powerup Toggle, Inventory Rename

Tester: Carol
Date: 2026-05-24
PR branch: feat/inventory-autopowerup-pause-fix
Commit under test: bcd764d
Base: origin/main
Work folder: 017-james-nerf-squad-setup
Files changed: js/game.js, js/screens.js, js/touch.js

## Verdict

Conditional pass. All three functional areas pass. One accessibility gap is confirmed as a pre-existing issue, not a regression. One minor accessibility observation is raised for follow-on: the pause menu navigation (arrow keys) does not announce the newly focused item to screen reader users. This was already absent for the prior two-item pause menu; PR 7 adds a third item without addressing or worsening it. The gap is noted below and flagged as a follow-on item.

No blockers to merge.

---

## Check 1: Pause fix (screen guard on _updateGameplay)

### Evidence

game.js line 737 (PR 7 state):

```
if (screen === 'game' && this.ls) this._updateGameplay();
```

The comment immediately above (lines 734 to 736) names the excluded screens explicitly:

```
// Gameplay logic only runs when the active-play screen is shown.
// 'pause', SCREEN_INVENTORY, and all menu screens are intentionally
// excluded so enemies, timers, and powerup spawns freeze during those screens.
```

SCREEN_INVENTORY is defined at game.js line 8 as the string 'select-inventory'.

### Verification against each screen name

- screen === 'pause': condition is false. _updateGameplay does not run. Pass.
- screen === 'select-inventory' (SCREEN_INVENTORY): condition is false. _updateGameplay does not run. Pass.
- screen === 'title', 'select', 'settings', 'customise', 'help', 'bossintro', 'levelcomplete', 'gameover': all false. Pass.

The bossintro branch (lines 730 to 733) decrements bossIntroTimer and may transition to 'game', but it is a separate path that does not call _updateGameplay. Pass.

### Verdict: Pass.

---

## Check 2: Auto-use powerup toggle

### FT-01: autoUsePowerups initialised false in startLevel

game.js line 637, inside the this.ls object literal:

```
autoUsePowerups: false,
```

startLevel is the only place this.ls is created. The default is false (manual mode). Pass.

### FT-02: Pause menu renders 3 items in correct order

screens.js lines 272 to 276:

```
var items = [
  { label: 'RESUME' },
  { label: 'AUTO POWERUPS: ' + (autoUsePowerups ? 'ON ' : 'OFF'), hint: 'SHIFT' },
  { label: 'EXIT TO MENU' },
];
```

Order: RESUME (index 0), AUTO POWERUPS toggle (index 1), EXIT TO MENU (index 2). Matches specification. Pass.

### FT-03: Pause menu navigation wraps over 3 items

game.js lines 316 to 317:

```
if (key === 'ArrowUp' || key === 'w' || key === 'W') { this.pauseMenuIdx = (this.pauseMenuIdx - 1 + 3) % 3; ... }
else if (key === 'ArrowDown' || key === 's' || key === 'S') { this.pauseMenuIdx = (this.pauseMenuIdx + 1) % 3; ... }
```

Modulus is 3. Navigation wraps correctly across all three items. Pass.

### FT-04: Toggle key is k.switch (Shift)

constants.js line 79: `switch: 'Shift'`

game.js line 319: `else if (key === k.switch) this._toggleAutoUsePowerups();`

The toggle fires on Shift. Pass.

_activatePauseItem (game.js lines 540 to 544) also handles index 1 as the toggle path, so Enter on the AUTO POWERUPS item calls _toggleAutoUsePowerups(). Pass.

### FT-05: Pickup logic branches on ls.autoUsePowerups

game.js lines 879 to 897:

```
if (ls.autoUsePowerups) {
  this._applyPowerUp(pu.type, player, ls);
  var autoMsg = 'Auto-used: ' + label + '.';
  announce(autoMsg);
  Speech.narrate(autoMsg, 'normal');
} else if (ls.inventory.length < 20) {
  ls.inventory.push(pu.type);
  ...
} else {
  announce('Inventory full. Use a powerup to make room.');
  ...
}
```

When autoUsePowerups is true the powerup is applied immediately, bypassing inventory. When false the prior store-or-full logic runs unchanged. Pass.

### FT-06: Auto-use announcement format

The announcement is: 'Auto-used: ' + label + '.'

For label 'SHIELD' this produces 'Auto-used: SHIELD.' Matches the required format "Auto-used: [label]." Pass.

Both announce() and Speech.narrate() receive the same string. Pass.

### Verdict: Pass.

---

## Check 3: Inventory rename (no remaining old names)

Grep for all old identifiers across the full project directory returned zero hits:

- loadoutIdx: zero hits.
- SCREEN_LOADOUT: zero hits.
- select-loadout: zero hits.
- drawLoadoutScreen: zero hits.
- _openLoadout: zero hits.
- _closeLoadout: zero hits.
- _tapLoadout: zero hits.
- 'LOADOUT' (string literal): zero hits.

Case-insensitive grep for 'loadout' across the whole project also returned zero hits.

User-facing text in help screens (screens.js) uses "Inventory" consistently:

- Help page 1 (controls list): 'INVENTORY' as the action label (screens.js line 434).
- Help page 3 title: 'INVENTORY' (screens.js line 509).
- Help page 3 body: "Press Shift to open the Inventory screen." (line 514); "On the Inventory screen:" (line 516). No Loadout mentions.
- Inventory screen title: px(ctx, 'INVENTORY', ...) at screens.js line 332.
- Inventory open announcement in game.js: 'Inventory screen.' (line 967).

### Verdict: Pass.

---

## Accessibility notes

### A-01: Missing main landmark (pre-existing gap, confirmed)

index.html has no `<main>` element. The body contains a `<canvas>` and a visually hidden `<div>` for the announcer. No `<main>` or `<nav>` landmark is present. This is a pre-existing gap that Sean flagged and that was noted in earlier test reports. PR 7 does not add or remove any HTML structure. This is not a regression from this PR.

The canvas carries `role="img"` and `aria-label="James' Nerf Squad game area"`, which is correct for a canvas-based game.

The announcer `<div>` carries `aria-live="polite"` and `aria-atomic="false"`, which is correct.

The missing landmark should be tracked as a follow-on item for Sean (add `<main>` wrapper or `role="main"` on an appropriate element). It is not a blocker for this PR.

### A-02: Pause menu focus navigation lacks per-item announce (pre-existing gap, not a regression)

When the player moves between RESUME, AUTO POWERUPS, and EXIT TO MENU using arrow keys, no announce() or Speech.narrate() call fires to name the newly focused item. The prior two-item pause menu (on main branch) had the same gap. PR 7 adds a third item without introducing or widening this problem.

The gap means a screen reader user pressing arrow keys in the pause menu hears only the click sound, not the item label. This is a WCAG 2.4.3 / 1.3.1 concern for a future PR.

For the AUTO POWERUPS item specifically: the item label rendered on canvas reads 'AUTO POWERUPS: ON' or 'AUTO POWERUPS: OFF', which is visually clear. The _toggleAutoUsePowerups function announces the new state ('Auto powerups on.' or 'Auto powerups off.') via announce() and Speech.narrate() when activated, so the result of toggling is announced. The gap is only in navigation focus, not in the toggle action itself.

Flagging as a follow-on item. Not a blocker for this PR.

### A-03: Inventory screen title updated correctly

drawInventoryScreen (screens.js line 332) renders the title as 'INVENTORY' not 'LOADOUT'. The open announcement (game.js line 967) says 'Inventory screen.' Both are correct.

### A-04: hint property defined but not rendered in pause menu

The items array entry for AUTO POWERUPS carries `hint: 'SHIFT'` (screens.js line 274) but the draw loop does not render this hint to canvas — only items[i].label is drawn. The footer line ('SHIFT=TOGGLE AUTO') communicates the shortcut at a document level. The hint property appears to be a placeholder for a future per-item shortcut display. This has no functional or accessibility effect; the footer provides the information. Noted as a minor observation only.

---

## Open items for follow-on (not blockers)

1. Add `<main>` landmark to index.html (Sean).
2. Add per-item focus announcements to pause menu navigation (Sean).
3. Review 'BACKUP!' label in POWERUPS constant — exclamation mark mid-sentence in announcements (Tad). First noted in carol-test-pr6.md NB-01.

---

## Token and tool-call record

Tool calls: 18 Read and Bash calls.
Estimated input tokens: approximately 38,000.
Estimated output tokens: approximately 2,200.
