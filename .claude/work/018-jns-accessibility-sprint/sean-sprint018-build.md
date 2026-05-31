# Build report: sprint 018 (partial)

Sean, 2026-05-31. Branch: `feat/018-accessibility-sprint`.

## Items built

### R-03: MIT licence

Files changed:

- `/Users/timdixon/Code/Github/James-Nerf-Squad/LICENSE` (created)

Standard MIT text. Copyright line: `Copyright (c) 2026 Tim Dixon`. No other licence files exist at the root.

Commit: `chore: add MIT licence`

### R-05: Self-host Google Font

Files changed:

- `/Users/timdixon/Code/Github/James-Nerf-Squad/fonts/PressStart2P-latin.woff2` (created)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/fonts/PressStart2P-latin-ext.woff2` (created)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/fonts/PressStart2P-cyrillic.woff2` (created)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/fonts/PressStart2P-cyrillic-ext.woff2` (created)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/fonts/PressStart2P-greek.woff2` (created)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/css/style.css` (modified)

Font family confirmed from `css/style.css`: `Press Start 2P`, weight 400. All five WOFF2 subsets (latin, latin-ext, cyrillic, cyrillic-ext, greek) downloaded from Google Fonts (SIL Open Font Licence 1.1) and committed. The `@import url(https://fonts.googleapis.com/...)` in `style.css` was replaced with five local `@font-face` declarations.

Deviation from brief: no CSP meta tag exists in `index.html` (Jacob confirmed this in his architecture review), so there were no CSP entries to remove.

Commit: `chore: self-host Google Font, remove external font CSP entries`

### R-04: Version number on pause screen

Files changed:

- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/main.js` (modified)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/screens.js` (modified)

A `fetch('VERSION')` call was added at the top of `main.js`, before the `main()` function. The trimmed version string is stored in `window._gameVersion`, initialised to `''` before the fetch resolves so there is no undefined flash. Errors are caught silently.

In `screens.js`, `drawPauseMenu()` now renders `v${window._gameVersion}` as size-4 pixel text, colour `#888`, right-aligned inside the bottom edge of the pause panel, when the version string is non-empty. This matches the brief's format specification.

Commit: `feat: display version number on pause screen`

### R-01: Fix script load order for announcer.js and speech.js

Files changed:

- `/Users/timdixon/Code/Github/James-Nerf-Squad/index.html` (modified)

Moved `<script src="js/speech.js"></script>` and `<script src="js/announcer.js"></script>` from after `game.js` to immediately before it. New order: `speech.js`, `announcer.js`, `game.js`, `main.js`. This matches Jacob's confirmed target order.

No code changes to `announcer.js` or `speech.js` were necessary. Jacob's review confirmed the existing two-layer design (`announce()` and `Speech.narrate()`) is sound. The load order was the only gap.

Commit: `fix: load announcer.js and speech.js before game.js`

### R-06: Colour contrast AAA fixes

Files changed:

- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/constants.js` (modified)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/screens.js` (modified)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/hud.js` (modified)
- `/Users/timdixon/Code/Github/James-Nerf-Squad/eslint.config.js` (modified)

Applied Jacob's confirmed replacement values:

| Role | Old | New | Ratio | Location |
|---|---|---|---|---|
| Rifle blaster label | `#44bbff` | `#79caff` | 9.1:1 on black | `constants.js` BLASTERS.rifle.color; `screens.js` help blasters array |
| Mega blaster label | `#ff4444` | `#ff8a7a` | 8.3:1 on black | `constants.js` BLASTERS.mega.color; `screens.js` help blasters array |
| Boss health-bar name | `#ff4444` | `#ff8a7a` | 8.3:1 on black | `hud.js` L65 |
| Inactive menu items | `#aaa` | `#c9c9d2` (UI_TEXT_DIM) | 9.0:1 on `#050514` | `screens.js` — title menu, game-over menu, pause menu, settings, help, inventory |
| Game-over header | `#ff2200` | `#ff7a5c` | 7.6:1 on `#050514` | `screens.js` drawGameOver() |
| BOSSES caption (flashing) | `#ff4444` | `#ff8a7a` | 8.3:1 | `screens.js` drawHelpScreen() page 1 |

Decorative sprite pixels left unchanged per Jacob's scoping note: drone rotor `fillRect` at screens.js L478, boss dart fill at boss.js L84, health-bar fills at hud.js L8/L68, player OW! particle at player.js L135, HAIR_COLORS swatch at constants.js L70.

A named constant `UI_TEXT_DIM = '#c9c9d2'` was added to `constants.js` as Jacob recommended, and registered in `eslint.config.js` as a global so it resolves across all script files without lint errors.

Deviation from brief: additional readable-text `#aaa` / `#aaaaaa` / `#888888` / `#666666` sites in the inventory screen empty-state messages, inventory footer, and help page 3 instructions were also updated to `UI_TEXT_DIM` or equivalent. Jacob's architecture review explicitly recommended auditing all `#aaa` text uses, not only the five named in the brief.

Commit: `fix(a11y): raise five canvas colour pairs to WCAG AAA 7:1 contrast`

### R-02: prefers-reduced-motion gate (degrade-and-play)

Tim answered Q-JNS6A on 2026-05-31: keep the game playable under reduced motion; retire the block-the-game notice.

Files changed:

- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/constants.js` — added `REDUCED_SCROLL_SPEED = 0.3` in the new "Reduced-motion" section, before Physics constants.
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/particles.js` — added module-level flag `particlesReduced` and exported `setParticlesReduced(on)`. Added an early-return guard at the top of `spawnParticles`. The live particles array is not cleared here; that is done at the call site in game.js when toggling on at runtime.
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/game.js` — reworked `Game.prototype.start`:
  - Removed the early-return block that showed the static notice and skipped the game loop.
  - Removed the two separate `change` listeners (one for the reduced branch, one for normal). Replaced with a single `change` listener that updates `this.reducedMotion`, calls `Speech.setReducedMotion`, calls `setParticlesReduced`, and (when turning reduced motion ON at runtime) clears `this.ls.particles.length` to stop existing bursts immediately.
  - Added `Speech.setReducedMotion(this.reducedMotion)` and `setParticlesReduced(this.reducedMotion)` immediately after setting `this.reducedMotion` at init, so the flags are correct from frame one.
  - Replaced `ls.scrollOffset += cfg.scrollSpeed * 0.5` (formerly line 762) with `var sp = this.reducedMotion ? REDUCED_SCROLL_SPEED : cfg.scrollSpeed; ls.scrollOffset += sp * 0.5`. The LEVELS array is not mutated.
  - Removed `Game.prototype._drawReducedMotionOnce` (now dead).
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/screens.js` — deleted `drawReducedMotionScreen` and its section comment (formerly lines 296-319). Confirmed no remaining callers.
- `/Users/timdixon/Code/Github/James-Nerf-Squad/js/speech.js` — removed the `if (reducedMotionActive) return;` guard from `narrate()`. Removed the `reducedMotionActive` flag. `setReducedMotion(value)` now cancels any queued utterance on toggle (clearing the queue is still useful on preference change) but no longer permanently suppresses narration. Updated the module JSDoc comment to explain the R-02 rationale.

Deviations from Jacob's spec:

- None. The implementation follows Jacob's section 2 exactly.

Confirmation — `cfg.scrollSpeed` read sites:

- Grepped `js/` for `cfg.scrollSpeed` and `scrollSpeed`. Constants.js defines the values (nine data rows, no logic). The only runtime consumer is game.js, now replaced with the reduced-motion accessor. Exactly one read site confirmed.

Dead code removal:

- `drawReducedMotionScreen` in `screens.js`: deleted. Zero remaining callers confirmed by grep.
- `_drawReducedMotionOnce` in `game.js`: deleted. Zero remaining callers confirmed by grep.

Commit: `feat(a11y): degrade-and-play reduced-motion gate (R-02)`

## Accessibility regression suite

The file `docs/patterns/accessibility-regression-suite.md` does not exist for this project. The check could not be run. This gap is noted in the pull request body so Carol can cover it in her test pass.

## Lint

Zero errors after changes. 92 warnings total (all pre-existing, none introduced by this PR). The warnings are an expected artefact of the no-bundler script-tag architecture, as documented in `eslint.config.js`.

## Pull request

https://github.com/timdixon82/James-Nerf-Squad/pull/16

## Speech API try/catch fix

Flagged by Jed in security review. R-01 required all `speechSynthesis` calls to be wrapped in try/catch; this was missed in the initial build.

Three lines in `/Users/timdixon/Code/Github/James-Nerf-Squad/js/speech.js` were changed:

- Line 39 (was): `window.speechSynthesis.speak(utt)` — wrapped in try/catch inside `_speak()`. Chrome throws `NotAllowedError` (DOMException) when speech is attempted before a user gesture; the catch degrades silently.
- Line 47 (was): `window.speechSynthesis.cancel()` — wrapped in try/catch inside `narrate()` (the `'high'` priority branch).
- Line 65 (was): `window.speechSynthesis.cancel()` — wrapped in try/catch inside `setReducedMotion()`.

Each site is wrapped individually so errors are scoped to the call that caused them. No console.error is emitted; a comment names the failure mode.

Commit: `fix: wrap speechSynthesis calls in try/catch for graceful degradation`
