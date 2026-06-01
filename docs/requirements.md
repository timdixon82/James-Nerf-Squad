# Requirements: James Nerf Squad

This document records the requirements for James Nerf Squad. Initial backfill by the agent team on 2026-05-23 (work folder 017). Sprint 018 requirements added by Tad on 2026-05-31 (work folder 018). Sprint 020 requirements added by Tad on 2026-06-01 (work folder 020).

## Background

James Nerf Squad is a side-scrolling pixel-art action game built for James. It runs entirely in the browser with no server, no accounts, and no build step. The player fights through nine levels, collecting power-ups and defeating enemies and bosses.

## User stories

1. As James, I want to run and shoot through side-scrolling levels so I can defeat enemies and reach the end.
2. As James, I want to collect power-ups (shield, speed boost, mega dart, squad member, ammo) during play so I can survive harder levels.
3. As James, I want to customise my character's skin, hair, and clothing colours so the game feels personal.
4. As James, I want to see my high scores per level so I can try to beat them.
5. As James, I want to play on a touchscreen as well as a keyboard so I can use any device.
6. As Tim (parent), I want the game to respect reduced-motion preferences so James can play comfortably.
7. As a screen-reader user, I want the game to announce key events through a live region and speech synthesis so I can follow what is happening without seeing the canvas.

## Functional requirements

1. Nine playable levels, each with a defined theme, enemy mix, platform layout, scroll speed, and boss flag.
2. Player controls: move left/right, jump, shoot. All controls rebindable via the Settings screen.
3. Power-up system: five power-up types (shield, speed boost, mega dart, squad member, ammo). Power-ups may be auto-used or manually applied from the Inventory screen.
4. Persistence of key bindings, appearance choices, high scores per level, and completed-level flags.
5. A pause menu with Resume, Auto-use Power-ups toggle, and Exit to Menu options.
6. An Inventory screen showing collected power-ups and the active blaster.
7. On-screen touch controls for mobile play.
8. Boss encounters on designated levels, with a health bar and a named boss.

## Non-functional requirements

### Accessibility

WCAG 2.2 AAA (Web Content Accessibility Guidelines 2.2 at AAA conformance) is the target. The canvas rendering model requires a parallel accessibility approach: an off-screen live region mirroring key game events, and keyboard-only menu navigation. Documented in `docs/accessibility.md`.

### Security

OWASP Top 10 mitigations applied. No paid third-party CI tokens. All scanning uses free, self-contained tooling. Refer to `docs/coding-standards.md` and the team's global `coding-standards.md`.

### Performance

Smooth animation at the browser's native refresh rate via `requestAnimationFrame`. No specific frame-rate target is recorded.

### Data protection

No personal data is collected or processed. See `docs/privacy.md`.

## Out of scope

- Server-side components or accounts.
- Multiplayer.
- Audio asset files (audio is synthesised by Web Audio API).
- A build or bundling step.
- Reduced-speed accessible game mode (deferred from sprint 018).

## Sprint 018 requirements

These requirements were derived from Q-JNS1 through Q-JNS5 (answered 2026-05-31) and Carol's baseline audit in work folder 017. Each has an acceptance checklist that can be tested as true or false.

### R-01: ARIA live region and Web Speech API narration

Add a visually hidden announcer element to `index.html` and wire it to ten game events. Mirror each announcement through the Web Speech API (Web Speech Application Programming Interface) where available.

#### Acceptance criteria

- [ ] `index.html` contains `<div aria-live="polite" aria-atomic="false" id="game-announcer" class="sr-only">`.
- [ ] The announcer module lives in `js/announcer.js`, not inline in `game.js`.
- [ ] `textContent` of the live region updates at each of the following ten points:
  - Game load: "James' Nerf Squad. Press Enter or Space to start. Press H for help."
  - Title screen: "Main menu. Use Up and Down to navigate. Press Enter to select."
  - Level start: "Level [N]: [name]. [enemy count] enemies. Lives: 3."
  - Life lost: "Hit. Lives remaining: [N]."
  - Power-up collected: "[Power-up name] collected."
  - Level complete: "Mission complete. Score: [N]. Press Space to continue."
  - Game over: "Game over. Final score: [N]. Use Up and Down to choose Retry or Main Menu."
  - Boss intro: "Warning. Boss fight. [Boss name]."
  - Pause open: "Game paused. Use Up and Down to navigate. Press Enter to select."
  - Pause resume: "Game resumed."
- [ ] Each announcement is also spoken via `window.speechSynthesis.speak()` when the API is available.
- [ ] Any queued speech is cancelled before a new utterance begins.
- [ ] All `speechSynthesis` calls are wrapped in a try/catch block.
- [ ] When `speechSynthesis` is absent or blocked, the game runs without errors (graceful degradation).

### R-02: prefers-reduced-motion gate

Read the `prefers-reduced-motion` media query at startup and respond to changes. Reduce scroll speed and disable particles when the user's operating system requests reduced motion.

#### Acceptance criteria

- [ ] `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is read at startup in `game.js` or `main.js`.
- [ ] A `change` event listener keeps the flag current during a session.
- [ ] When reduced motion is active, every level's `scrollSpeed` is set to 0.3.
- [ ] When reduced motion is active, a `particlesEnabled` flag is set to `false`.
- [ ] `js/particles.js` reads `particlesEnabled` and emits no particles when the flag is false.
- [ ] When reduced motion is not active, the original values from `constants.js` are used.
- [ ] Toggling the OS reduced-motion setting mid-session takes effect without a page reload.

### R-03: MIT licence

Add a `LICENSE` file at the repository root containing the standard MIT licence text.

#### Acceptance criteria

- [ ] A file named `LICENSE` exists at the repository root.
- [ ] The licence text is the standard MIT licence.
- [ ] The copyright line reads "Copyright 2026 Tim Dixon".
- [ ] No other licence files exist at the root.

### R-04: Version number on pause screen

Display the project version as small text in the bottom-right corner of the pause screen. Read the version from the `VERSION` file at runtime.

#### Acceptance criteria

- [ ] The game fetches `VERSION` on load using `fetch('VERSION')` and stores the result in a module-level variable.
- [ ] `drawPauseMenu()` in `screens.js` renders the version string in the bottom-right corner of the pause overlay.
- [ ] The version is formatted as "v[version]", for example "v1.1.0".
- [ ] The text colour is `#888` (mid-grey).
- [ ] If the fetch fails, the game continues without error and the version area is left blank.

### R-05: Self-host Google Font

Download the font files used by the game and serve them from the repository. Remove all references to Google Fonts from the CSS and the Content Security Policy (CSP) in `index.html`.

#### Acceptance criteria

- [ ] The exact font family and all weights in use are identified.
- [ ] WOFF2 (Web Open Font Format 2) file(s) for those weights are committed to `fonts/`.
- [ ] `css/style.css` no longer contains a Google Fonts `@import` or `@import url(...)` pointing to `fonts.googleapis.com`.
- [ ] `css/style.css` contains a local `@font-face` declaration pointing to `fonts/`.
- [ ] `index.html` no longer lists `https://fonts.googleapis.com` or `https://fonts.gstatic.com` in its CSP meta tag.
- [ ] The font renders correctly in a visual check after the change.

### R-06: Colour contrast AAA fixes

Adjust five canvas-drawn colour pairs so each meets WCAG 1.4.6 Contrast Enhanced (minimum 7:1 against its background).

#### Acceptance criteria

- [ ] Rifle blaster label colour is updated from `#44bbff` to a value that achieves at least 7:1 against black (`#000000`).
- [ ] Mega blaster label colour is updated from `#ff4444` to a value that achieves at least 7:1 against black.
- [ ] Inactive title menu item colour is updated from `#aaa` to a value that achieves at least 7:1 against `#050514`.
- [ ] Game-over header colour is updated from `#ff2200` to a value that achieves at least 7:1 against black.
- [ ] Boss health-bar name colour is updated to match the fixed mega blaster value (same constant).
- [ ] Jacob has verified the chosen replacement values against the canvas backgrounds before Sean applies them.
- [ ] All changes are applied in `constants.js` and any hardcoded values in `screens.js`, `hud.js`, and `boss.js`.
- [ ] A Pa11y (accessibility checking tool) run against the served instance shows no contrast failures for the affected elements.

## Sprint 020 requirements

These requirements come from work folder 020 (feat/020-speed-and-autouse). Each has an acceptance checklist that can be tested as true or false.

### R-01 (020): Fix auto-use powerups hint label

In `js/screens.js`, the pause menu item for AUTO POWERUPS shows the hint label `'SHIFT'`. The key that activates the toggle is Enter (or Space), not Shift. Change the hint to `'ENTER'`.

#### Acceptance criteria

- [ ] In `js/screens.js`, the pause menu AUTO POWERUPS item has `hint: 'ENTER'` (not `'SHIFT'`).
- [ ] No other pause menu item's hint label is changed.

### R-02 (020): Persist auto-use powerups across level starts and sessions

`autoUsePowerups` is currently a property on level state (`this.ls`), so it resets to `false` at every level start and is not saved to localStorage. Move it to game state (`this.gs`) and add it to the save and load cycle.

#### Acceptance criteria

- [ ] `autoUsePowerups` is no longer initialised on `this.ls`; it is initialised on `this.gs` with a default of `false`.
- [ ] All read sites that previously referenced `this.ls.autoUsePowerups` now reference `this.gs.autoUsePowerups`.
- [ ] `_toggleAutoUsePowerups()` writes to `this.gs.autoUsePowerups` and calls `this.save()` after each toggle.
- [ ] The `save()` function includes `autoUsePowerups` in the `nerfSquadSave` localStorage payload.
- [ ] The `load()` function reads `autoUsePowerups` from localStorage and restores it to `this.gs`.
- [ ] The auto-use setting survives a level transition within the same session.
- [ ] The auto-use setting survives a browser refresh (the value is read back from localStorage on load).

### R-03 (020): Easy/Hard game speed in Settings

Add a two-value speed setting to the Settings screen. Hard is the current speed and is the default, so existing saves are unaffected. Easy applies a 0.5 multiplier to specific speed parameters at runtime.

The multiplier must be applied at each read site; it must not mutate the data in `constants.js`.

Speed parameters multiplied by 0.5 in Easy mode:

- Level `scrollSpeed`.
- Enemy movement speed (horizontal velocity or step per frame).
- Enemy projectile speed.
- Boss movement speed.
- Boss projectile speed.

Parameters that are not multiplied:

- Player movement speed.
- Jump physics (gravity, jump velocity).
- Fire rate and cooldown.

#### Acceptance criteria

- [ ] `this.gs.difficulty` is initialised with the value `'hard'`.
- [ ] The `save()` function includes `difficulty` in the localStorage payload.
- [ ] The `load()` function reads `difficulty` from localStorage and restores it to `this.gs`.
- [ ] The Settings screen shows a cycling option labelled "SPEED: EASY" or "SPEED: HARD", toggleable with Enter.
- [ ] Toggling the setting announces "Easy mode." or "Hard mode." via the announcer.
- [ ] In Easy mode, `scrollSpeed`, enemy movement speed, enemy projectile speed, boss movement speed, and boss projectile speed are each multiplied by 0.5 at the read site.
- [ ] In Hard mode, all speed parameters are identical to the current unmodified values (no regression).
- [ ] The multiplier is applied at each read site; the `LEVELS` data in `constants.js` is not mutated.
- [ ] The difficulty choice persists across browser refresh (read back from localStorage on load).

## Definition of done

### Original (work folder 017)

- All nine levels playable start to finish.
- Keys-sticking bug resolved (blur and visibilitychange handlers in place; Shift-key case normalisation applied).
- Persistence defaults to `localStorage` (no silent save-drop on GitHub Pages).
- Accessibility live region and keyboard-only menus implemented.
- All CI checks pass (lint, accessibility, security, CodeQL).
- Carol has signed off functional, accessibility, and visual testing.

### Sprint 018 additions

- [ ] `js/announcer.js` added; all ten announcement points wired in `game.js`.
- [ ] Web Speech API narration fires on each announcement; degrades gracefully when unavailable.
- [ ] `prefers-reduced-motion` gate in place; scroll speed and particles respond correctly.
- [ ] `LICENSE` file (MIT, Tim Dixon, 2026) committed at repository root.
- [ ] Version number displayed on the pause screen, read from `VERSION` file.
- [ ] Google Font self-hosted in `fonts/`; Google Fonts URLs removed from CSS and CSP.
- [ ] Five colour pairs in `constants.js` and related files updated to meet 7:1 AAA.
- [ ] Carol's functional, accessibility, and visual passes complete and signed off.
- [ ] All CI checks pass on the branch.
- [ ] Pull request open; Sonja merges on Tim's approval.

### Sprint 020 additions

- [ ] Pause menu AUTO POWERUPS hint changed from SHIFT to ENTER.
- [ ] Auto-use setting survives level transitions and browser refresh. Toggling calls `save()`.
- [ ] Settings screen shows SPEED: EASY / SPEED: HARD, toggleable with Enter, announced on change.
- [ ] Easy mode runs at visibly half speed (scroll, enemy movement, enemy projectiles, boss movement and projectiles).
- [ ] Hard mode is identical to the current game (no regression).
- [ ] Difficulty choice persists across sessions.
- [ ] `constants.js` LEVELS data is not mutated by the multiplier.
- [ ] Carol's functional and accessibility passes complete and signed off.
- [ ] All CI checks pass on the branch.
- [ ] Pull request open; Sonja merges on Tim's approval.
