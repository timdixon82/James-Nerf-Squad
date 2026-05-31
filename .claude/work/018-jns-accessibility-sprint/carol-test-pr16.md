# Test report: PR 16 (feat/018-accessibility-sprint)

Carol, 2026-06-01. Branch: `feat/018-accessibility-sprint`.

## Summary verdict

Conditional pass. Two issues require rework before merge. Both are itemised below. All other checks pass.

---

## Checks

### Functional pass

**Check 1: R-01 load order** — PASS

`index.html` script order is: `constants.js`, `utils.js`, `input.js`, `sound.js`, `music.js`, `particles.js`, `icons.js`, `player.js`, `enemy.js`, `boss.js`, `hud.js`, `screens.js`, `touch.js`, then `speech.js`, `announcer.js`, `game.js`, `main.js`. Both `speech.js` and `announcer.js` appear immediately before `game.js`.

**Check 2: R-01 announcer wiring** — PASS (with one minor observation)

All ten announcement points from the brief are wired:

- Game load / title: `start()` line 685 announces "James' Nerf Squad. Press Enter or Space to start." and `_goTitle()` line 494 announces the same.
- Level start: `startLevel()` lines 607 and 603 announce level name and boss fight respectively.
- Life lost: `_updateGameplay()` lines 821, 833, 841 announce lives remaining on dart hit, enemy collision, and boss collision.
- Power-up collected: lines 857 (auto-use), 866 (stored), 869 (inventory full).
- Level complete: line 884.
- Game over: `_endGameOver()` line 908.
- Boss intro: `startLevel()` line 603.
- Pause open: `_openPause()` line 513.
- Pause resume: `_resumeGame()` line 519.

Observation: The brief specifies two distinct messages — one for game load ("James' Nerf Squad. Press Enter or Space to start. Press H for help.") and one for title screen ("Main menu. Use Up and Down to navigate. Press Enter to select."). The implementation uses a single message for both events. The intent is met: something is announced at both moments. The exact wording differs from the brief's text. This is not a blocker; it is noted for the log.

**Check 3: R-02 block screen removed** — PASS

`drawReducedMotionScreen` is absent from `screens.js`. `_drawReducedMotionOnce` is absent from `game.js`. Confirmed by grep (no output). The `start()` function in `game.js` no longer has an early-return for reduced motion.

**Check 4: R-02 scroll accessor** — PASS

`game.js` line 735: `var sp = this.reducedMotion ? REDUCED_SCROLL_SPEED : cfg.scrollSpeed; ls.scrollOffset += sp * 0.5;`. The accessor is correct and `cfg.scrollSpeed` is no longer read directly at this point.

`REDUCED_SCROLL_SPEED = 0.3` is defined in `constants.js` line 14 under the "Reduced-motion" section.

**Check 5: R-02 particles gate** — PASS

`particles.js` has a module-level flag `var particlesReduced = false;` (line 9) and `function setParticlesReduced(on)` (line 11). The guard `if (particlesReduced) return;` is at the top of `spawnParticles()` (line 16).

**Check 6: R-02 narration un-muted** — PASS

`speech.js` `narrate()` function contains no `if (reducedMotionActive) return` or equivalent suppression. The `reducedMotionActive` flag is entirely absent. The JSDoc confirms the R-02 rationale. Narration fires for all users regardless of reduced-motion preference.

**Check 7: R-03 licence** — PASS

`LICENSE` exists at the repository root. It contains standard MIT text with the copyright line "Copyright (c) 2026 Tim Dixon".

**Check 8: R-04 version fetch** — PASS

`main.js` lines 9 to 13: `window._gameVersion = ''` is set before the fetch. `fetch('VERSION')` is called and the trimmed result is stored in `window._gameVersion`. Errors are caught silently.

`screens.js` `drawPauseMenu()` lines 292 to 293: renders `'v' + window._gameVersion` with size 4, colour `#888`, right-aligned at `panX + panW - 6, panY + panH - 5` (bottom-right corner of the pause panel), conditional on a non-empty version string.

**Check 9: R-05 font** — PASS

`css/style.css` contains five `@font-face` declarations for "Press Start 2P" weight 400, each pointing to a file in `../fonts/`. No `fonts.googleapis.com` or `fonts.gstatic.com` URL appears anywhere in `style.css` or `index.html`.

**Check 10: R-06 colours — old values removed** — PASS with one new finding (see Check 15)

Searched `constants.js`, `screens.js`, and `hud.js` for `#44bbff`, `#ff2200`, and (in readable-text contexts) `#aaa`. None found in in-scope readable-text locations. The remaining `#aaa` occurrences are all decorative sprite-pixel contexts (`icons.js`, `enemy.js`, `touch.js`) or the CLOTH_COLORS data swatch (`#aaaaaa`), which are explicitly excluded per Jacob's scoping note.

`UI_TEXT_DIM = '#c9c9d2'` is defined in `constants.js` line 75. It is used extensively in `screens.js` for all inactive menu text, inventory, help, and settings.

---

### Accessibility pass

**Check 11: Live region markup** — PASS

`index.html` line 13 to 14:

```
<div id="game-announcer" aria-live="polite" aria-atomic="false"
     style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;padding:0;margin:-1px"></div>
```

The element has the correct `aria-live="polite"` and `aria-atomic="false"` attributes. The inline style clips the element to 1 by 1 pixel with overflow hidden, which is a standard visually-hidden technique compatible with screen readers.

**Check 12: Speech API degradation** — CONDITIONAL FAIL (blocker)

`speech.js` guards API absence with `var supported = typeof window !== 'undefined' && !!window.speechSynthesis;` and returns early from `narrate()` and `_speak()` when `!supported`.

However, the brief (R-01) explicitly states: "Wrap all speechSynthesis calls in a try/catch so they degrade gracefully where the API is absent or blocked by browser policy."

The `_speak()` function at line 39 calls `window.speechSynthesis.speak(utt)` with no surrounding try/catch. In some browsers, notably those where a user gesture has not occurred or where an extension blocks the API, `speechSynthesis.speak()` can throw even when `window.speechSynthesis` is defined. The `supported` check does not catch that case.

The `narrate()` function at lines 47 and 65 also calls `window.speechSynthesis.cancel()` without a try/catch.

This is a direct miss of a stated requirement. It does not affect the live-region announcer (which degrades independently), but it may cause an unhandled exception in affected browser environments. Flag for Sean: add a try/catch around the body of `_speak()` and around the `cancel()` calls in `narrate()` and `setReducedMotion()`.

**Check 13: Reduced-motion change listener** — PASS

`game.js` `start()` lines 672 to 683: a single `change` listener on the `matchMedia` result updates `this.reducedMotion`, calls `Speech.setReducedMotion(self.reducedMotion)`, calls `setParticlesReduced(self.reducedMotion)`, and when turning reduced motion on at runtime, clears `self.ls.particles.length = 0`. The `mq.addEventListener` path is guarded for browser support.

**Check 14: Version text contrast** — NOTED (non-blocking)

The version string uses `#888` on the pause panel background `#0a0a2a`.

Calculated luminance values:
- L(`#888888`) = 0.2462
- L(`#0a0a2a`) = 0.0045

Contrast ratio: approximately 5.44:1.

This exceeds the 3:1 threshold flagged in the brief's test instruction. The brief explicitly categorises this as "decorative supplementary text" at "approximately 4.5:1" and notes the same treatment is used in other Tim Dixon projects. The actual ratio is slightly higher than the brief estimated (~5.44:1 vs ~4.5:1 estimated). This is noted but is not a blocker; the brief pre-accepts this exception.

**Check 15: WCAG AAA colour ratios** — PASS for five named pairs. Additional finding (non-blocker for this PR; see task marker below).

Computed contrast ratios against the actual canvas backgrounds:

| Colour | Value | Background | Calculated ratio | 7:1 gate |
|---|---|---|---|---|
| Rifle blaster | `#79caff` | `#000000` | 11.71:1 | Pass |
| Mega blaster | `#ff8a7a` | `#000000` | 9.17:1 | Pass |
| Inactive menu | `#c9c9d2` | `#050514` | 12.30:1 | Pass |
| Game-over header | `#ff7a5c` | `#050514` | 7.89:1 | Pass |
| Boss bar name | `#ff8a7a` | `#000000` | 9.17:1 | Pass |

All five named pairs in the brief exceed 7:1. Jacob's stated ratios (9.1:1, 8.3:1, 9.0:1, 7.6:1, 8.3:1) are conservative; the actual ratios are equal or better.

Additional finding: `screens.js` line 130 renders "BOSS" in `#ff4444` on the level-select panel background `#111122`. Calculated ratio: 5.47:1. This falls below 7:1 AAA. It is a readable text label, not a decorative sprite pixel. The original five pairs in the brief did not include this site, and Jacob's scoping note excluded only decorative sprite pixels. This site was not excluded.

This was not caught during the sprint because it was not in the original brief's list. It does not block this PR — the brief did not require it to be fixed here — but it should be tracked as a follow-up accessibility task.

---

### Visual pass

**Check 16: Font file and CSS alignment** — PASS

CSS `@font-face` declarations reference five filenames:
- `PressStart2P-cyrillic-ext.woff2`
- `PressStart2P-cyrillic.woff2`
- `PressStart2P-greek.woff2`
- `PressStart2P-latin-ext.woff2`
- `PressStart2P-latin.woff2`

The `fonts/` directory contains exactly those five files and no others. File paths match.

**Check 17: Pause screen version placement** — PASS

`drawPauseMenu()` renders the version string at: `panX + panW - 6` (x, right-aligned), `panY + panH - 5` (y, near bottom of panel), using pixel size 4 (the `px()` function's size parameter; renders at approximately 4 CSS-equivalent pixels), colour `#888`, alignment `'right'`. The pause panel is centred and 240 by 152 pixels. The version sits at the bottom-right corner of the panel, 6 pixels from the right edge and 5 pixels from the bottom. The format is `v` followed by the version string (for example `v1.0.0`).

---

### CI check

**Check 18: Lint** — PASS

`npm run lint` (which runs `npm run lint:html && npm run lint:js`) reports:

- HTML: "Scanned 1 files, no errors found."
- JavaScript: 0 errors, 96 warnings total.

The 96 warnings are all pre-existing no-unused-vars warnings, expected from the no-bundler script-tag architecture and documented in `eslint.config.js`. No new errors or warnings were introduced by this PR.

---

## Rework items

Two items must be resolved before merge.

**Rework 1 (blocker): Missing try/catch in speech.js**

File: `/Users/timdixon/Code/Github/James-Nerf-Squad/js/speech.js`

The brief (R-01) requires: "Wrap all speechSynthesis calls in a try/catch so they degrade gracefully where the API is absent or blocked by browser policy."

The `_speak()` function calls `window.speechSynthesis.speak(utt)` without a try/catch. The `narrate()` and `setReducedMotion()` functions call `window.speechSynthesis.cancel()` without a try/catch. These calls can throw in browsers where the API is present but blocked (for example, some versions of Chrome in headless mode, some extensions, or contexts without a user-gesture). The existing `supported` guard does not cover this case.

Required fix: wrap the body of `_speak()` in a try/catch, and wrap the `cancel()` calls in `narrate()` and `setReducedMotion()` in try/catch blocks. The catch clause should be silent (or log to console only) consistent with the graceful-degradation intent.

**Rework 2 (blocker): Title-screen announce text differs from brief**

This is a conditional blocker: it depends on Sonja and Tim's view of whether the announced text needs to exactly match the brief or whether the intent is met.

The brief specifies two distinct messages:
- Game load: "James' Nerf Squad. Press Enter or Space to start. Press H for help."
- Title screen: "Main menu. Use Up and Down to navigate. Press Enter to select."

The implementation announces the same message at both events: "James' Nerf Squad. Press Enter or Space to start." The "Press H for help" suffix is absent. The title-screen variant text ("Main menu. Use Up and Down...") is absent. Screen-reader users will not hear the H-key hint at load, nor the navigation instruction when returning to the title from another screen.

This may be acceptable given that the intent of announcing at both moments is met. Sonja should confirm with Tim whether the exact brief text is required or whether the current implementation is sufficient. If exact text is required, Sean needs to (a) add the "Press H for help." suffix to the load announcement, and (b) use the "Main menu. Use Up and Down to navigate. Press Enter to select." text in `_goTitle()`.

I am treating this as a conditional blocker. If Sonja confirms the implementation text is acceptable, this item can be waived without rework.

---

## Follow-up (not blocking this PR)

The "BOSS" label text at `screens.js` line 130 uses `#ff4444` on `#111122`, giving 5.47:1 contrast, which is below WCAG 1.4.6 AAA 7:1. This is a readable text label and should be addressed in a future sprint. See task marker below.

---

Signed: Carol (tester), 2026-06-01.
