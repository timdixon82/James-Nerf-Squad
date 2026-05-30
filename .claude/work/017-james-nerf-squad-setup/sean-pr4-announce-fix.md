# Sean PR 4 Announce Fix — Completion Summary

Branch: `fix/button-labels-and-boss-powerups`
Commit: `28a0e56`
File changed: `js/game.js` (4 insertions, 1 deletion)

## Fix 1 — Power-up collection (BLOCKING)

Lines changed: 831-833 (three new lines after line 830).

Inside `_updateGameplay()`, in the power-up collision block at the
`this._applyPowerUp()` call site, the following lines were inserted
immediately after `_applyPowerUp` and before `spawnParticles`:

```js
var label = POWERUPS[pu.type] ? POWERUPS[pu.type].label : pu.type;
announce(label + ' collected.');
Speech.narrate(label + ' collected.', 'normal');
```

The `label` variable reads the `label` field from the matching
`POWERUPS` entry in `constants.js` (for example `'Shield'`,
`'Speed Boost'`, `'Ammo Pack'`). If the type is not in `POWERUPS` the
raw type string is used as a fallback.

## Fix 2 — Level-select transition (OPTIONAL, approved)

Line changed: 497 (existing single-line branch extended).

Inside `_activateTitleItem()`, on the `idx === 0` branch that sets
`this.gs.screen = 'select'`, the following two calls were appended to
the same branch block:

```js
announce('Mission Select. Use Arrow Up and Down to choose a level, then press Enter.');
Speech.narrate('Mission Select.', 'normal');
```

The style matches the existing `announce`/`Speech.narrate` pairs at
`_goTitle` (line 466-467) and `_openPause` (line 485-486).

## Accessibility regression suite

The project is a static front-end stack. The full automated suite
(Pa11y, axe-core, ESLint a11y rules) requires a browser environment
that is not available in this shell session. That gap is noted here for
Carol to cover in her test pass on PR 4. The changes are pure additions
of `announce()` and `Speech.narrate()` calls; no markup, no ARIA
attributes, and no existing logic was altered.
