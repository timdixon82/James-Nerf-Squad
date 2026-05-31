# Test Pass Report: PR 3
## James' Nerf Squad — feat(a11y): keys-sticking fix, reduced-motion screen, live-region announcer, speech narration

Tester: Carol (tester and release manager)
Date: 2026-05-24
Branch: `feat/accessibility-and-motion`
Commit: `7881c10`
Scope: Code inspection of all six changed files. No CI exists on this repository; this test pass is the merge gate.
Prior reports: baseline audit (`carol-baseline-audit.md`), PR 2 test pass (`carol-test-pass-pr2.md`).

---

## Summary verdict

**Sign off with conditions.**

All four feature items are correctly implemented. The two confirmed baseline defects that this PR targets (keys-sticking under WCAG 2.1.1 and 2.1.3, and reduced-motion gap AAA-02 and G-04) are fixed. The live-region announcer and speech narration cover the required announcement points. One gap exists: power-up collection is not announced. This falls short of the baseline specification at G-05 Option 1, which lists "Power-up collected: [Power-up name] collected" as a required announcement point. The gap is a condition of sign-off and must be addressed before the merge gate clears.

No regressions are introduced.

---

## 1. Functional tests

### Fix 1: Keys-sticking (baseline finding, WCAG 2.1.1 and 2.1.3)

**Requirement.** The baseline audit (Keys-sticking section) confirmed that `js/input.js` had no `blur` listener, no `visibilitychange` listener, and no `touchcancel` listener. When the browser window lost focus, `keyup` events stopped arriving and the `held` map retained stale `true` values, causing the player to move as if keys were physically stuck. Tim's Q69A answer specified all three listeners.

**Code inspection result: fixed correctly.**

Three listeners are added at `input.js` lines 89 to 114, inside the IIFE that defines `Input`.

- `window.addEventListener('blur', ...)` at line 89: iterates both `held` and `touchHeld` with a `for...in` loop, sets every entry to `false`, then explicitly sets `state.left`, `state.right`, `state.jump`, and `state.shoot` to `false`.
- `document.addEventListener('visibilitychange', ...)` at line 97: fires only when `document.visibilityState === 'hidden'`, applies the same four-field clear to `held`, `touchHeld`, and `state`.
- `window.addEventListener('touchcancel', ...)` at line 109: clears `touchHeld` and the four movement state fields. Note: `held` (keyboard) is not cleared by `touchcancel`, which is correct because a `touchcancel` event signals a touch interruption, not a keyboard focus loss. Keyboard keys may still be physically held.

The listeners are registered as part of module initialisation, before the module is returned. They attach to the correct targets (`window` for `blur` and `touchcancel`, `document` for `visibilitychange`). The visibilitychange listener correctly guards on `hidden` and does not clear state when the page becomes visible.

One detail: `touchcancel` is also handled on the canvas element in `game.js` at line 211 (`this.canvas.addEventListener('touchcancel', onTouchUp, { passive: false })`). That handler calls `Input.onTouchUp()` for each currently pressed touch button. The new `Input` module `touchcancel` listener handles the global case (any system-level touch cancel, even for touches not on the canvas). Both handlers complement each other; there is no conflict.

**Verdict: pass. WCAG 2.1.1 and 2.1.3 defect resolved.**

### Fix 2: Reduced-motion screen (baseline findings AAA-02 and G-04)

**Requirement.** The baseline found no `prefers-reduced-motion` check anywhere in the codebase. The game ran a 60 fps animation loop unconditionally. Tim answered Q68A: pause the game loop and display a reduced-motion screen when the OS setting is active.

**Code inspection result: fixed correctly.**

`game.js` `Game.prototype.start` (lines 616 to 672) now:

1. Reads `window.matchMedia('(prefers-reduced-motion: reduce)')` at line 623. Guards with `window.matchMedia &&` so environments that do not support the API are handled silently.
2. If `reducedMotion` is `true` at load time, calls `Speech.setReducedMotion(true)` to suppress narration, calls `this._drawReducedMotionOnce()` to draw the static screen, calls `announce(...)` to write the message to the live region, registers a `change` listener to handle live OS setting changes, and returns without starting `requestAnimationFrame`.
3. If `reducedMotion` is `false` at load time, registers the same `change` listener for live transitions and starts the game loop normally.

The `change` listener correctly handles both directions:
- If reduced motion becomes active while the game is running: cancels the animation frame, draws the static screen, and announces the message.
- If reduced motion is turned off while the static screen is showing: announces the game start message, narrates it, starts music, and starts the animation loop.

`Game.prototype._drawReducedMotionOnce` (line 674) calls `this.resize()` before drawing the reduced-motion screen, which is correct: it ensures the canvas is sized before the first paint.

`screens.js` `drawReducedMotionScreen` (line 292) renders a static dark background with the game title in `#ffff00` on `#050514` (approximately 19:1, passes AAA), followed by five lines of instruction text. The primary message ("Reduced motion mode is active on this device.") is in `#ffffff` on `#050514` (approximately 20:1, passes AAA). The secondary lines are in `#aaaaaa` on `#050514`: estimated contrast approximately 5.4:1, which passes AA but falls short of the AAA 7:1 threshold (1.4.6 Contrast Enhanced). However, this is a static informational screen shown only when reduced motion is active. The content is fully mirrored by the `announce()` call in `game.js`, so a screen reader user receives the full message regardless. The canvas-rendered text contrast gap is a carry-forward from baseline AAA-01; it is not a regression introduced by PR 3.

**Verdict: pass. WCAG 2.3.3 gap substantially resolved. The game loop does not start when reduced motion is active.**

### Fix 3: Live-region announcer

**Requirement.** Baseline G-05 Option 1 required a visually hidden `aria-live="polite"` div and an `announce(msg)` helper. Baseline specified the following announcement points: game load / title screen, level start, life lost, level complete, game over, boss intro, pause opened, pause resumed. Power-up collected was also listed as a required announcement point in G-05 Option 1.

**Code inspection result: mostly correct, one gap.**

`index.html` line 13 adds:
```html
<div id="game-announcer" aria-live="polite" aria-atomic="false"
     style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;padding:0;margin:-1px">
</div>
```

This is the standard visually hidden pattern. `aria-live="polite"` is correct (announcements wait for the current screen reader utterance to finish before speaking). `aria-atomic="false"` is correct (the announcer replaces text in a single region; atomicity is not needed). The inline style is correct for visual hiding: `clip` and `overflow:hidden` prevent any visual rendering while keeping the element in the accessibility tree.

`js/announcer.js` defines `announce(msg)`: clears `textContent` to empty, then sets it inside a `requestAnimationFrame` callback. The clear-then-set pattern forces re-announcement when the same string is sent twice (for example, retrying the same level). This is correct.

**Script load order.** `announcer.js` and `speech.js` are loaded at lines 43 to 44 of `index.html`, after `game.js` (line 42) and before `main.js` (line 45). `game.js` calls `announce()` and `Speech.narrate()` only inside methods that are invoked during or after `game.start()`, which is called from `main.js`. At the point those calls execute, both `announcer.js` and `speech.js` are already loaded. The load order is correct.

**Announcement coverage check:**

| Announcement point (baseline G-05 spec) | Covered | Location |
|---|---|---|
| Title screen (game load) | Yes | `game.start()` line 667; also line 642 when reduced motion is turned off live |
| Title screen (returning from another screen) | Yes | `_goTitle()` line 466 |
| Level start (non-boss) | Yes | `startLevel()` line 569 |
| Boss intro / level start (boss) | Yes | `startLevel()` line 565 |
| Life lost (dart hit) | Yes | `_updateGameplay()` line 799 |
| Life lost (enemy contact) | Yes | `_updateGameplay()` line 811 |
| Life lost (boss contact) | Yes | `_updateGameplay()` line 819 |
| Level complete | Yes | `_updateGameplay()` line 843 |
| Game over | Yes | `_endGameOver()` line 867 |
| Pause opened | Yes | `_openPause()` line 485 |
| Pause resumed | Yes | `_resumeGame()` line 491 |
| Power-up collected | **No** | `_updateGameplay()` lines 824-833 — `_applyPowerUp()` is called but no `announce()` or `Speech.narrate()` follows |

**Gap: power-up collection is not announced.** The baseline specification at G-05 Option 1 lists "Power-up collected: [Power-up name] collected" as a required announcement point. `POWERUPS[pu.type]` has a `label` property available (used in `drawHelpScreen()`), which means the friendly name is accessible. The fix is two lines after line 830:

```js
var label = POWERUPS[pu.type] ? POWERUPS[pu.type].label : pu.type;
announce(label + ' collected.');
Speech.narrate(label + ' collected.', 'normal');
```

This is a straightforward addition. It is a condition of sign-off.

**Additional observation: level-select screen has no announcement.** `_activateTitleItem()` at line 497 transitions to `screen = 'select'` but calls neither `announce()` nor `Speech.narrate()`. This means a screen reader user navigating from the title to the level select screen receives no cue that the screen has changed. This is a gap not listed in the baseline G-05 spec but is relevant to WCAG 4.1.3 (Status Messages) and AAA-07 (automatic screen transitions). It is a condition of sign-off unless Sonja agrees to defer it as a follow-on item.

**Verdict: mostly pass. One required announcement point (power-up collected) is missing. One additional gap (level-select transition not announced) is noted.**

### Fix 4: Web Speech API narration

**Requirement.** Baseline G-05 Option 2 (implemented per Q67C as confirmed by the task brief) required `Speech.narrate(msg, priority)` to mirror all `announce()` call sites. Priority `'high'` cancels the current utterance; `'normal'` queues.

**Code inspection result: correctly implemented with one gap mirroring the live-region gap.**

`js/speech.js` defines a self-contained IIFE `Speech` with:

- `supported` checked at initialisation via `typeof window !== 'undefined' && !!window.speechSynthesis`. Falls back silently if unsupported.
- `reducedMotionActive` flag, set via `setReducedMotion(value)`. When `true`, `narrate()` returns immediately and cancels any in-progress speech. This is correct: narrating a static screen while the game loop is not running is not useful, and the `announce()` call writes to the live region regardless.
- `narrate(msg, priority)`: `'high'` calls `window.speechSynthesis.cancel()` then `_speak(msg)`; `'normal'` checks `speaking || pending` and queues at most one pending utterance.
- `_speak(msg)` creates a `SpeechSynthesisUtterance`, sets `rate` and `pitch` to 1.0, attaches an `onend` handler that drains the single-item queue. Calls `window.speechSynthesis.speak(utt)`.

The single-item queue behaviour is appropriate for a fast-paced action game: only the most recent queued message is retained, preventing a backlog of stale announcements.

All `announce()` call sites have a corresponding `Speech.narrate()` call immediately after them. Priority assignments are correct:

- Title screen and level start: `'normal'` (not time-critical, can queue).
- Boss intro: `'high'` (interrupts current speech, since a boss fight is a high-priority event).
- Game paused and resumed: `'high'` (player may be urgently pausing during combat).
- Life lost: `'normal'` (queued; pairing with the hit sound cue is sufficient).
- Level complete: `'normal'`.
- Game over: `'high'` (interrupts any in-progress speech).

The power-up collection gap in the live-region announcer is mirrored here: no `Speech.narrate()` call at the power-up collection site. The fix described under Fix 3 above covers both.

**Verdict: pass, subject to the same power-up collection gap as Fix 3.**

---

## 2. Accessibility tests

### 2.1 Baseline defects addressed by PR 3

| ID | Finding | Status after PR 3 |
|---|---|---|
| WCAG 2.1.1 / 2.1.3 Keys-sticking | blur/visibilitychange/touchcancel listeners absent | Fixed |
| AAA-02 | No reduced-motion support | Fixed: game loop does not start when reduced motion active |
| G-04 | Continuous scrolling at 60 fps, vestibular risk | Fixed: static screen shown instead |
| A-05 | No focus management on screen transitions | Partially addressed: announce() and Speech.narrate() now fire on key transitions (title, level start, pause, resume, game over, level complete, boss intro). Screen reader users receive audio cues. Focus in the DOM is not moved (no DOM interactive elements exist to receive focus), but the live region provides equivalent notification. Remaining gap for the level-select transition is noted above. |
| AA-04 | Screen transitions not announced to assistive technology | Partially addressed. Same scope as A-05 above. |
| AAA-07 | Automatic screen transitions | Partially addressed. Level complete and game over transitions are now announced. Boss intro timer is announced at entry. The level-select transition remains unannounced. |
| G-01 | Entire game invisible to screen readers | Substantially improved. Game state transitions are now announced via live region and speech. Full screen reader operability is not possible (canvas is still the render surface), but a screen reader user now receives audio feedback at the key game-state moments. |
| G-02 | Game state events not announced | Substantially improved. Life-lost, level-complete, and game-over events are announced. Power-up collection is not announced (gap noted above). |

### 2.2 New accessibility regressions introduced by PR 3

None found. The six changed files were inspected for:

- New interactive elements without accessible names: none added.
- New ARIA attributes used incorrectly: `aria-live="polite"` and `aria-atomic="false"` on the announcer div are correct.
- New keyboard traps: none introduced.
- New `aria-hidden` usage: none.
- Focus management changes: none. The same absence of DOM focus management persists from the baseline; PR 3 does not worsen it.
- Changes to colour constants or contrast values: none. All colour values unchanged except the static reduced-motion screen text (gap noted above as a carry-forward from AAA-01, not a new regression).
- Changes to animation or motion: PR 3 gates animation behind the `reducedMotion` flag, which is a strict improvement.

**Verdict: no new accessibility regressions.**

### 2.3 Pre-existing accessibility findings: status after PR 3

| ID | Finding | Status after PR 3 |
|---|---|---|
| A-01 | Canvas no accessible name | Fixed in PR 2, unchanged |
| A-02 | No keyboard hints in HTML | Open, unchanged |
| A-03 | Single-character shortcuts not configurable outside game | Open, unchanged |
| A-04 | Audio plays without accessible stop control | Open, unchanged |
| A-05 | No focus management on screen transitions | Partially addressed (live-region and speech now fire; DOM focus unchanged) |
| A-06 | user-scalable=no | Open, unchanged |
| AA-01 | user-scalable=no, no reflow | Open, unchanged |
| AA-02 | Canvas text contrast below AAA 7:1 at several points | Open, unchanged |
| AA-04 | Screen transitions not announced | Partially addressed (same as A-05) |
| AA-05 | No visible focus indicator | Open, unchanged |
| AAA-01 | Contrast enhanced gaps | Open, unchanged; reduced-motion screen secondary text carries same gap |
| AAA-02 | No reduced-motion support | Fixed by PR 3 |
| AAA-03 | No keyboard-only game mode | Partially addressed (live-region and speech provide feedback during play) |
| AAA-04 | No timing control during gameplay | Open, unchanged (pause remains the mitigation) |
| AAA-06 | Canvas controls no machine-readable purpose | Open, unchanged |
| AAA-07 | Automatic screen transitions | Partially addressed; level-select transition still unannounced |
| AAA-08 | Help screen inaccessible to screen readers | Open, unchanged |
| G-01 | Entire game invisible to screen readers | Substantially improved; canvas remains the render surface |
| G-02 | Game state events not announced | Substantially improved; power-up collection gap remains |
| G-03 | HUD is canvas-only | Open, unchanged (HUD state narrated at key events) |
| G-04 | Continuous scrolling at 60 fps, vestibular risk | Fixed by PR 3 |
| G-05 power-up | Power-up collection not announced | **New gap, open; must be fixed before merge** |
| Level-select screen | Level-select transition not announced | **New gap noted; condition of sign-off** |
| Deferred-3 | Touch button width below 44 px on left/right/jump | Open, carry-forward |

---

## 3. Visual checks

**Reduced-motion screen.** `drawReducedMotionScreen()` draws a dark `#050514` background, the game title in `#ffff00` (passes AAA contrast), and five lines of instruction copy in `#ffffff` and `#aaaaaa`. The copy is clear and accurate. The instruction to turn off reduced motion in "system accessibility settings" correctly avoids naming a specific OS; this is appropriate since the game targets both macOS and Windows.

**Live-region div.** The element is positioned absolutely with 1 px by 1 px dimensions, `overflow:hidden`, `clip:rect(0 0 0 0)`, `white-space:nowrap`, and `margin:-1px`. This is the correct standard visually hidden pattern. It does not affect the game canvas layout.

**No visual changes to game screens.** The six changed files do not alter any canvas drawing beyond the new reduced-motion screen. All existing visual styles, colours, and layout are unchanged.

**Brand check.** James' Nerf Squad has no Tim Dixon brand assets requiring checks per `docs/brand.md`. This is a standalone game.

**Citation check.** This PR is a developer accessibility fix from Sean, not a Tad copy draft or a Simon design draft. No citation to `docs/writing-style.md` or `docs/brand.md` is required.

---

## 4. Screen reader testing

Full manual VoiceOver and JAWS passes remain deferred. This is the first PR that creates a live-region surface, so a manual pass is now possible against a served instance. The evidence gate in `docs/patterns/screen-reader-evidence.md` is not yet cleared. This is recorded as an open non-blocking item; it must be cleared before a formal release.

By code inspection, the expected VoiceOver and JAWS behaviour at key moments is:

- Game load (non-reduced-motion): after the canvas renders, the live region fires "James' Nerf Squad. Press Enter or Space to start." Both VoiceOver and JAWS should read this from the `aria-live="polite"` region within one to three seconds of page load. Web Speech narration runs concurrently.
- Level start: "Level 1: [name]. Lives: 3." spoken by the live region and by narration.
- Life lost: "Hit. Lives remaining: [N]." spoken by both.
- Pause: "Game paused." spoken at `'high'` priority (cancels current speech).
- Game over: "Game over. Final score: [N]." spoken at `'high'` priority.

The `aria-atomic="false"` setting on the announcer div means screen readers announce only the changed portion, which in this case is always the full `textContent` because the clear-then-set pattern replaces the whole content. This is correct behaviour.

---

## 5. Conditions of sign-off

### Condition 1 (required before merge): Power-up collection not announced

The power-up collection block in `_updateGameplay()` (lines 824 to 833) calls `_applyPowerUp()` but does not call `announce()` or `Speech.narrate()`. The baseline G-05 Option 1 specification lists this as a required announcement point. `POWERUPS[pu.type].label` is available and gives the friendly name.

Required addition (two lines after line 830):
```js
var label = POWERUPS[pu.type] ? POWERUPS[pu.type].label : pu.type;
announce(label + ' collected.');
Speech.narrate(label + ' collected.', 'normal');
```

This must be added and the fix returned to Carol for re-check before the merge gate clears.

### Condition 2 (required before merge or deferred with Sonja's explicit decision): Level-select transition not announced

`_activateTitleItem()` transitions to `screen = 'select'` without calling `announce()` or `Speech.narrate()`. A screen reader user pressing Enter on "PLAY GAME" receives no audio cue that the level-select screen has loaded. The fix is two lines:

```js
announce('Mission select. Use arrow keys to choose a level. Press Enter to start.');
Speech.narrate('Mission select. Use arrow keys to choose a level. Press Enter to start.', 'normal');
```

Sonja may approve deferring this to a follow-on item if the power-up fix alone is merged first. It is not as high-priority as the power-up collection gap because reaching the level-select screen from the title is a deliberate user action (pressing Enter), so the user knows a transition occurred. The power-up collection gap is higher priority because it happens during active gameplay with no other audio cue.

---

## 6. Positive findings

- The reduced-motion implementation is robust. It handles the live OS setting change in both directions, correctly cancels the animation frame, and draws the static screen cleanly.
- The Speech module's single-item queue is a sensible design for a fast-paced game. It prevents stale announcement buildup.
- The `reducedMotionActive` guard in `Speech.narrate()` is correct: it cancels in-flight speech and suppresses narration during the static screen, where the live region already carries the message.
- The `touchcancel` handling is correct and appropriately scoped to `touchHeld` only (keyboard state is not affected by a touch cancel).
- The `announce()` clear-then-set pattern is a well-known screen reader idiom and is correctly implemented.
- Priority assignments on `Speech.narrate()` are consistent and appropriate.

---

## 7. Release checklist (PR 3 scope)

### Required checks

| Item | Status | Notes |
|---|---|---|
| Continuous integration (CI) | Not applicable | No CI exists on this repository. Carol's test pass is the merge gate. |
| Accessibility gate | Conditional pass | Keys-sticking fixed. Reduced-motion gate fixed. Live-region and speech narration confirmed. Power-up collection gap must be addressed before gate clears. |
| Security check | Not in scope of this PR | PR 3 adds no new endpoints, external calls, or security-relevant code paths. No new APIs beyond `window.matchMedia` and `window.speechSynthesis`, both standard browser APIs. |

### Functional testing

| Item | Status |
|---|---|
| Keys-sticking fix (blur, visibilitychange, touchcancel) | Pass |
| Reduced-motion screen renders on prefers-reduced-motion: reduce | Pass |
| Reduced-motion live change listener (both directions) | Pass |
| Live-region announcer: title screen | Pass |
| Live-region announcer: level start (non-boss) | Pass |
| Live-region announcer: boss intro | Pass |
| Live-region announcer: life lost (dart, enemy, boss contact) | Pass |
| Live-region announcer: level complete | Pass |
| Live-region announcer: game over | Pass |
| Live-region announcer: pause opened | Pass |
| Live-region announcer: pause resumed | Pass |
| Live-region announcer: power-up collected | **Fail — not implemented** |
| Live-region announcer: level-select transition | Fail — not implemented (condition 2) |
| Speech narration: mirrors all announce() call sites | Pass (with same power-up gap) |
| Regression check: no new functional defects | Pass (code inspection) |

### Accessibility testing

| Item | Status |
|---|---|
| WCAG 2.1.1 / 2.1.3 keys-sticking | Pass |
| WCAG 2.3.3 reduced-motion gate | Pass |
| WCAG 4.1.3 live-region announcements | Conditional pass (power-up gap) |
| No new ARIA regressions | Pass |
| No new keyboard accessibility regressions | Pass |
| Screen reader manual pass (VoiceOver, JAWS, NVDA) | Deferred — requires live served instance |
| Automated Pa11y and axe-core | Deferred — requires live served instance |

### Visual testing

| Item | Status |
|---|---|
| Reduced-motion screen renders correctly | Pass |
| Live-region div does not affect canvas layout | Pass |
| No visual regressions to existing screens | Pass |
| Brand artifact check | Not applicable |

### Architecture and security conformance

| Item | Status |
|---|---|
| Architecture conformance | Not re-run for PR 3. PR 3 does not change architecture; the live-region and speech modules are thin utility wrappers. Jacob's review covers the base codebase. |
| Security conformance | Not re-run for PR 3. No new security surface introduced. |

### Version and changelog

| Item | Status |
|---|---|
| VERSION file | Not present on this repository. Not required for this PR. |
| Changelog | No CHANGELOG.md. Not a blocker for PR 3 merge. |

### GitHub Actions log

| Item | Status |
|---|---|
| GitHub Actions log | No CI workflows exist on this repository. Not applicable. |

### Blocking items

1. **Power-up collection not announced (Condition 1).** Sean must add `announce()` and `Speech.narrate()` calls at the power-up collection site in `_updateGameplay()`. The fix is two or three lines. Work returns to Carol for re-check.

### Non-blocking follow-on items (must not be forgotten)

1. **Level-select transition not announced (Condition 2).** Add `announce()` and `Speech.narrate()` in `_activateTitleItem()` when `idx === 0`. Sonja decides whether to include in this PR or defer.

2. **Screen reader evidence gate.** `docs/patterns/screen-reader-evidence.md` requires a manual VoiceOver and JAWS pass on file before any formal release. PR 3 is the first PR that creates a testable live-region surface. A manual pass against a served instance is now required and should be scheduled for the next session.

3. **Q67C scope note.** Q67C (Options 1 and 2 implemented, Option 3 deferred) is correctly reflected in this PR. Option 3 (reduced-speed accessible game mode) remains deferred pending Jacob's architecture design.

4. **Reduced-motion secondary text contrast.** The `#aaaaaa` lines on `#050514` in `drawReducedMotionScreen()` are approximately 5.4:1, below the AAA 7:1 threshold. The text is fully covered by the `announce()` call, so screen reader users are not affected. This is a carry-forward from baseline AAA-01, not a PR 3 regression.

5. **Touch target width (left/right/jump at 40 px).** Carried forward from baseline deferred item 3 and PR 2 test pass. Not introduced or worsened by PR 3.

6. **Contrast pairs below AAA 7:1.** Carried forward from baseline AA-02 and AAA-01.

7. **Remaining open baseline gaps.** A-02 through A-06, AAA-03 through AAA-08, G-03 remain open per the baseline. PR 3 improves G-01, G-02, and G-04 substantially but does not close them entirely.

---

## 8. Handoff note

PR 3 is conditionally ready to merge. All four stated features are correctly implemented. The keys-sticking and reduced-motion defects are fixed. The live-region announcer and speech narration cover eleven of the twelve required announcement points.

The merge gate is blocked by one item: power-up collection is not announced (Condition 1). Sean must add the two-line fix to `_updateGameplay()` and return the corrected branch to Carol for re-check. The re-check is narrow: Carol will confirm the two lines are present and correct, and will update the verdict to a full sign-off.

Sonja should decide whether to include the level-select announcement fix (Condition 2) in the same corrected commit or defer it to a follow-on item.
