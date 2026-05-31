# Carol Re-check Report: PR 4 Announcement Additions

**Branch:** fix/button-labels-and-boss-powerups
**Commit under review:** 28a0e56 (fix(a11y): announce power-up collection and level-select transition)
**Date:** 2026-05-24
**Scope:** Narrow re-check of the two announcement additions only. Button labels and boss powerup logic remain signed off from the prior pass.

## Check 1: Power-up collection announcement (was blocking)

Pass. In `_updateGameplay()`, after `_applyPowerUp()` is called on line 830, the label is read from `POWERUPS[pu.type].label` with a fallback to `pu.type` on line 831. `announce()` is called on line 832 with `label + ' collected.'`, and `Speech.narrate()` is called on line 833 with the same string and a priority of `'normal'`. Placement is correct: the effect is applied first, then the collection is announced.

## Check 2: Level-select transition announcement (was optional, now included)

Pass. In `_activateTitleItem()`, when `idx === 0` triggers the transition to screen `'select'`, `announce()` is called with `'Mission Select. Use Arrow Up and Down to choose a level, then press Enter.'` and `Speech.narrate()` is called with `'Mission Select.'` at `'normal'` priority. Both calls follow the same pattern used elsewhere in the file (for example, the pause and resume announcements at lines 485 to 492 and the title screen announcement at lines 466 to 467).

## Overall verdict

**Pass.** Both additions are correct. PR 4 is ready to merge.
