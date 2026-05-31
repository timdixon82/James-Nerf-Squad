# Brief: 018-jns-accessibility-sprint

## Summary

Implement the accessibility and housekeeping items identified during the work-folder-017 backfill and answered by Tim on 2026-05-31. The sprint covers six areas: a hidden ARIA live region with Web Speech API narration, a prefers-reduced-motion gate, an MIT licence file, a version number on the pause screen, self-hosting the Google Font, and fixing five canvas colour pairs that fail WCAG AAA 7:1 contrast.

- Status: done
- Branch: feat/018-accessibility-sprint
- Priority: 1
- Blockers: None

## Requirements

Derived from Q-JNS1 through Q-JNS5 (answered 2026-05-31) and Carol's baseline audit in work folder 017.

### R-01: ARIA live region and Web Speech API narration (Q-JNS1B)

Add a visually hidden `<div aria-live="polite" aria-atomic="false" id="game-announcer" class="sr-only">` to `index.html`. Update its `textContent` at these game events:

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

In addition, mirror each announcement through the Web Speech API (`window.speechSynthesis.speak()`) when the API is available. Speech must be cancelled before a new utterance begins to avoid queuing. Wrap all speechSynthesis calls in a try/catch so they degrade gracefully where the API is absent or blocked by browser policy.

The announcer should be a new module `js/announcer.js` to keep game.js from growing further.

### R-02: prefers-reduced-motion gate (Q-JNS2B)

In `game.js` (or `main.js`), read `window.matchMedia('(prefers-reduced-motion: reduce)').matches` at startup and respond to the `change` event.

When reduced motion is active:
- Set each level's `scrollSpeed` to 0.3 (a minimum crawl, not zero, so the game remains playable).
- Set `particlesEnabled = false` in a new flag read by the particle system; `js/particles.js` emits no particles when the flag is false.

When reduced motion is not active, use the original values from `constants.js`.

### R-03: MIT licence (Q-JNS3A)

Add a `LICENSE` file at the repository root with the standard MIT licence text, copyright "Tim Dixon", year 2026.

### R-04: Version number on pause screen (Q-JNS4B)

Read the version from `VERSION` at runtime (via a `fetch('VERSION')` call on load, stored in a module-level variable). Display it as small text in the bottom-right corner of the pause screen, rendered by `drawPauseMenu()` in `screens.js`. Format: "v[version]". Colour: `#888` (mid-grey; contrast approximately 4.5:1 on the dark overlay — acceptable for decorative supplementary text; this is the same treatment used in other Tim Dixon projects).

### R-05: Self-host Google Font (Q-JNS5A)

The current `css/style.css` imports a font from Google Fonts over HTTPS. Steps:

1. Identify the exact font family and weights used.
2. Download the WOFF2 file(s) and commit them to `fonts/`.
3. Replace the Google Fonts `@import` in `style.css` with a local `@font-face` declaration pointing to `fonts/`.
4. Remove the `https://fonts.googleapis.com` and `https://fonts.gstatic.com` entries from the Content Security Policy meta tag in `index.html`.
5. Verify the font still renders correctly.

### R-06: Colour contrast AAA fixes

The following canvas-drawn colour pairs fail WCAG 1.4.6 Contrast Enhanced (7:1). Adjust each to meet or exceed 7:1 against the effective background (black `#000000`):

- Rifle blaster label: `#44bbff` → target ≥ 7:1 on black (approximately `#55ccff` or lighter)
- Mega blaster label: `#ff4444` → target ≥ 7:1 on black (approximately `#ff6666` or lighter)
- Inactive title menu items: `#aaa` → target ≥ 7:1 on `#050514` background (approximately `#c0c0c0` or lighter)
- Game-over header: `#ff2200` → target ≥ 7:1 on black (approximately `#ff6644` or lighter)
- Boss health-bar name: `#ff4444` → same as mega blaster fix above (same constant)

Jacob to verify the chosen replacements against the canvas backgrounds. Sean to apply the confirmed colours in `constants.js` and any hardcoded values in `screens.js`, `hud.js`, and `boss.js`.

## Routing plan

1. Sonja opens work folder and records brief (complete).
2. Jacob reviews the accessibility architecture: the announcer module interface, how game.js calls it, and the prefers-reduced-motion integration point. Also confirms replacement colour values for R-06. Writes `jacob-accessibility-architecture.md` to this folder.
3. Tad updates `docs/requirements.md` with R-01 through R-06. Writes `tad-requirements-update.md` to this folder.
4. Jacob and Tad run in parallel (steps 2 and 3).
5. Sean builds on branch `feat/018-accessibility-sprint`, implementing all six requirements in the order: R-03 (trivial), R-05 (font), R-04 (version), R-06 (colours), R-02 (reduced-motion), R-01 (announcer — most complex, last).
6. Carol tests: functional pass (all game flows, pause screen version, font rendering), accessibility pass (live region output, speechSynthesis firing, reduced-motion gate, colour contrast pa11y run against served instance), visual pass.
7. Sonja runs the merge gate and presents to Tim.

## Out of scope

- Reduced-speed accessible game mode (Q-JNS1 option C — deferred).
- New game content: levels, enemies, bosses, power-ups.
- Build tooling or TypeScript migration.
- Server-side components.
- VoiceOver and JAWS manual screen-reader passes (suspended per the team's current accessibility gate; live-region output will be verified by code inspection and Carol's automated pass).
- Touch target size verification (deferred to a future Carol pass with a physical device).

## Risk and rollback

- Risk: `speechSynthesis` on macOS with VoiceOver active can conflict; the try/catch and graceful degradation in R-01 mitigates this. Tim uses VoiceOver; Sean must test the degradation path.
- Risk: Colour changes alter the game's visual appearance. Jacob confirms the new values look right in context before Sean commits them.
- Risk: Self-hosted font differs slightly in rendering from the Google-hosted version. Carol's visual pass checks for regression.
- Rollback: all work on branch `feat/018-accessibility-sprint`. Sean pushes; Sonja merges only on Tim's express approval. Reverting the merge commit restores the pre-sprint state.

## Definition of done

- [ ] `js/announcer.js` added; all ten announcement points wired in `game.js`.
- [ ] Web Speech API narration fires on each announcement; degrades gracefully when unavailable.
- [ ] `prefers-reduced-motion` gate in place; scroll speed and particles respond correctly.
- [ ] `LICENSE` file (MIT, Tim Dixon, 2026) committed at repository root.
- [ ] Version number displayed on the pause screen, read from `VERSION` file.
- [ ] Google Font self-hosted in `fonts/`; Google Fonts URLs removed from CSS and CSP.
- [ ] Five colour pairs in `constants.js` and related files updated to meet 7:1 AAA.
- [ ] `docs/requirements.md` updated to reflect R-01 through R-06.
- [ ] Carol's functional, accessibility, and visual passes complete and signed off.
- [ ] All CI checks pass on the branch.
- [ ] Pull request open; Sonja merges on Tim's approval.

## Approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than the main branch
- [x] Open a pull request
- [x] Comment on a pull request or an issue
- [x] Create an issue

## Not pre-approved

- Merging to the main branch. This always needs Tim's express approval at the time.
- Publishing to a blog or a social media account.

## Never allowed

The hard deny-list from `CLAUDE.md`.
