# Brief: 020-speed-and-autouse

## Summary

Two small features. First: fix the auto-use powerups toggle — the hint label is wrong (says SHIFT, should say ENTER) and the setting resets on every level start and is not saved between sessions. Second: add a game-speed option to the Settings screen with two values — Easy (50% of all speed parameters) and Hard (current speed, unchanged). Both the speed choice and the auto-use setting persist to localStorage.

- Status: active
- Branch: feat/020-speed-and-autouse
- Priority: 1
- Blockers: None

## Requirements

### R-01: Fix auto-use powerups hint label

In `js/screens.js`, the pause menu item for AUTO POWERUPS shows `hint: 'SHIFT'`. The actual activate key is Enter (or Space). Change the hint to `'ENTER'`.

### R-02: Persist auto-use powerups across level starts and sessions

Currently `autoUsePowerups` is a property on `this.ls` (level state), recreated as `false` at the start of every level. It is not included in the `nerfSquadSave` localStorage entry.

Changes needed:
- Move `autoUsePowerups` from level state (`this.ls`) to game state (`this.gs`), so it survives across level starts.
- Default: `false` (auto-use off, matching the current default).
- Add `autoUsePowerups` to the save payload in the `save()` function.
- Restore it in the `load()` function.
- Update all read sites that currently reference `this.ls.autoUsePowerups` to read from `this.gs.autoUsePowerups` instead.
- Update `_toggleAutoUsePowerups()` to write to `this.gs.autoUsePowerups` and call `this.save()` after toggling.

### R-03: Easy / Hard game speed in Settings

Add a two-value speed setting to the Settings screen. The two values are Easy and Hard.

- Hard = current speed (all existing speed parameters unchanged; this is the default so existing saves are unaffected).
- Easy = 50% of all speed-related parameters applied at runtime via a multiplier. The multiplier must not mutate the `LEVELS` data in `constants.js` (pure data, must stay unchanged). Apply the multiplier at every read site.

Speed parameters to multiply by 0.5 in Easy mode (Jacob to confirm the full list from the source):
- Level `scrollSpeed` (already has one read site confirmed by Jacob in sprint 018: `game.js` around line 735).
- Enemy movement speed (horizontal velocity / step per frame).
- Enemy projectile speed (if projectiles have a speed parameter).
- Boss movement speed and projectile speed.

Parameters explicitly not multiplied:
- Player movement speed (this would make controls feel unresponsive).
- Jump physics (gravity, jump velocity).
- Fire rate / cooldown (these affect blaster ammo economy, not speed feel).

The setting:
- Stored in `this.gs.difficulty` with values `'hard'` (default) and `'easy'`.
- Added to the save payload and restored on load.
- Displayed in the Settings screen as a cycling option: "SPEED: EASY" / "SPEED: HARD", toggled with Enter.
- Announced via the announcer on change: "Easy mode." or "Hard mode."

Jacob to review the exact enemy and boss speed parameter names and read sites before Sean builds.

## Routing plan

1. Sonja opens this work folder (complete).
2. Jacob and Tad dispatched in parallel.
   - Jacob: architecture review. Identify every read site for scroll speed, enemy speed, boss speed, and enemy projectile speed. Confirm which parameters should carry the multiplier. Confirm the right home for `autoUsePowerups` (gs vs ls). Write `jacob-architecture-review.md`.
   - Tad: update `docs/requirements.md` with R-01, R-02, R-03. Write `tad-requirements-update.md`.
3. Sean builds on `feat/020-speed-and-autouse` using Jacob's confirmed parameter list. One commit per requirement.
4. Carol tests: functional pass (auto-use persists across levels and sessions, Easy speed is visibly half-speed, Hard is unchanged, settings persist), accessibility pass (new settings items announced, keyboard-navigable).
5. Sonja runs merge gate and presents to Tim.

## Out of scope

- A third difficulty level (Normal, Impossible, etc.).
- Changing player movement speed, jump physics, or fire rate.
- Enemy AI behaviour changes (attack patterns, spawn count, spawn rate).
- New game content.
- Visual indicators of the current difficulty other than the Settings screen label.

## Risk and rollback

- Risk: Easy mode at 50% may feel too slow on later levels with fast bosses. This is a tuning risk, not a technical one — if Tim reports it feels wrong after testing, the multiplier can be adjusted without a re-architecture.
- Risk: moving `autoUsePowerups` from `ls` to `gs` requires updating all read sites; missing one would cause a runtime error. Jacob identifies all read sites before Sean builds.
- Risk: a multiplier applied at many enemy read sites could miss one, causing inconsistent behaviour. Jacob's review maps every site.
- Rollback: all work on `feat/020-speed-and-autouse`. Sonja merges only on Tim's express approval.

## Definition of done

- [ ] R-01: Pause menu AUTO POWERUPS hint changed from SHIFT to ENTER.
- [ ] R-02: Auto-use setting survives level transitions and browser refresh. Toggling it calls save().
- [ ] R-03: Settings screen shows SPEED: EASY / SPEED: HARD, toggleable with Enter, announced on change.
- [ ] R-03: Easy mode runs at visibly half speed (scroll, enemies, boss movement and projectiles).
- [ ] R-03: Hard mode is identical to the current game — no regression.
- [ ] R-03: Difficulty choice persists across sessions.
- [ ] Carol functional and accessibility passes complete.
- [ ] Lint clean.

## Approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than the main branch
- [x] Open a pull request
- [x] Comment on a pull request or an issue
- [x] Create an issue

## Not pre-approved

- Merging to the main branch. Always needs Tim's express approval.
