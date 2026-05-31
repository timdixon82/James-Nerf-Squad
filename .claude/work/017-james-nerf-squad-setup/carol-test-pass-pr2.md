# Test Pass Report and Release Checklist: PR 2
## James' Nerf Squad — fix: touch buttons, shelf overlap, and gameplay dynamics

Tester: Carol (tester and release manager)
Date: 2026-05-24
Branch: `feat/touch-and-layout-fixes`
Scope: Code inspection of the six changed files. No CI exists on this repository; this test pass is the merge gate.
Baseline: `/Users/timdixon/Code/AgentTeam/.claude/work/017-james-nerf-squad-setup/carol-baseline-audit.md`

---

## Summary verdict

**Sign off with conditions.**

PR 2 correctly fixes all three bugs it sets out to fix. It introduces two genuine accessibility improvements (canvas label, 44 px touch targets). It introduces no new accessibility regressions. One pre-existing keyboard defect (keys-sticking, WCAG 2.1.1 and 2.1.3) remains open and is not blocked by this PR but must be tracked. The conditions for sign-off are documented in the release checklist below.

---

## 1. Functional tests

### Fix 1: Touch left and right buttons had no effect

**Baseline finding.** `pollMovement()` overwrote `state.left` and `state.right` on every frame by reading only `Input.held`. Touch buttons wrote to `state` on `onTouchDown()` but `pollMovement()` immediately overwrote those values before the next frame saw them.

**Code inspection result: fixed correctly.**

`js/input.js` now declares a separate `touchHeld` map at line 10. `pollMovement()` at lines 38 to 41 uses a logical OR: `!!(held[bindings.left] || held['a'] || held['A'] || touchHeld['left'])` and the equivalent for right, jump, and shoot. `onTouchDown()` at lines 68 to 73 writes to both `touchHeld` and `state`. `onTouchUp()` at lines 76 to 81 clears both. The touch-held state therefore survives `pollMovement()` on every frame for as long as the finger is held down.

One detail noted: `onTouchMove()` in `game.js` (lines 190 to 208) correctly calls `Input.onTouchDown()` when a finger enters a button and `Input.onTouchUp()` when it leaves, which means dragging a finger from one button to another is handled correctly. This path was not changed by PR 2 but interacts correctly with the new `touchHeld` map.

**Verdict: pass.**

### Fix 2: Platforms stacking at one height

**Baseline finding.** Platform `y` coordinates were drawn from a single narrow random window (35 to 90 px above ground, approximately). With up to 21 platforms per level and only a 55 px window, most platforms appeared at nearly the same height, creating a flat shelf rather than varied terrain.

**Code inspection result: fixed correctly.**

`js/game.js` `startLevel()` at lines 529 to 543 now defines three named tiers:

- Tier 0 (low): 35 to 65 px above ground.
- Tier 1 (mid): 70 to 100 px above ground.
- Tier 2 (high): 110 to 145 px above ground.

Platforms are assigned in round-robin order via `tiers[i % tiers.length]`. For a 21-platform level (for example Level 4, `platformCount: 7`, total 21), seven platforms land in each tier. The tiers are non-overlapping with a 5 px gap between them, so no two consecutive tiers can produce platforms at the same height. The spread is now 110 px across three bands rather than 55 px in one band.

**Verdict: pass.**

### Fix 3: Boss confined to first 440 pixels of the world

**Baseline finding.** `updateBoss()` in `boss.js` clamped boss movement to `zoneLeft = 40` and `zoneRight = CANVAS_W - 40` (that is, 40 to 440). Boss position `boss.x` is in world-space coordinates, not screen coordinates, so as the player scrolled right, the boss became invisible behind the left edge of the viewport. The boss effectively stopped chasing the player after the player moved beyond the first screen.

**Code inspection result: fixed correctly.**

`js/boss.js` `updateBoss()` now accepts `camX` as a new seventh parameter (line 27 signature). The zone is now `zoneLeft = camX + 40` and `zoneRight = camX + CANVAS_W - 40` (lines 36 to 37). The zone tracks the camera position so the boss always roams within the visible screen area. The clamp `Math.max(zoneLeft, Math.min(zoneRight, boss.x))` at lines 45 and 56 prevents the boss from drifting permanently out of the zone if the camera moves while the boss is at an edge.

The call site in `game.js` at line 638 now passes `ls.camX` as the seventh argument: `updateBoss(boss, player, darts, platforms, ls.groundY, particles, ls.camX)`. This matches the updated function signature.

**Verdict: pass.**

---

## 2. Accessibility tests

### 2.1 Accessibility improvements introduced by PR 2

#### Canvas label (baseline finding A-01)

`index.html` line 11 now reads:

```html
<canvas id="gameCanvas" role="img" aria-label="James' Nerf Squad game area"></canvas>
```

This directly addresses baseline finding A-01 (canvas element had no accessible name, role, or fallback content). A screen reader will now announce the element as an image labelled "James' Nerf Squad game area" rather than as an anonymous or unlabelled region.

Assessment: this is the correct minimum fix for A-01. `role="img"` is the correct role for a canvas element that presents a non-interactive visual. `aria-label` provides the accessible name. The label text is concise and descriptive.

Note: this fix satisfies WCAG 1.1.1 and 4.1.2 at the element level. It does not give a screen reader user access to game state, menus, or any gameplay information. That larger gap remains open as documented in the baseline (G-01 through G-05) and in the README's new Accessibility and Known Accessibility Gap sections. The README documents the gap and three roadmap options accurately.

**Verdict: pass for A-01 scope.**

#### Touch target height (baseline deferred item 3)

`js/touch.js` now sets `btnH = 44` in `getTouchButtons()` at line 122 (gameplay buttons), in `getMenuNavButtons()` at line 31 (menu nav strip), in `drawGameOverTouchButtons()` at line 165, and in `drawPauseTouchButtons()` at line 176. `_drawMenuTouchStrip()` at line 183 comments "btnH is always 44 px now".

The prior value for gameplay buttons was 42 px, which fell short of the WCAG 2.5.5 minimum of 44 px. All touch targets across every screen are now 44 px tall.

Width values: left, right, and jump gameplay buttons are 40 px wide. `switch` is 50 px wide. `shoot` is 52 px wide. The 44 px minimum applies to both height and width under WCAG 2.5.5. The left, right, and jump buttons at 40 px wide fall short of the 44 px minimum on the width axis at a `pixelScale` of 1.

This is a pre-existing gap not introduced by PR 2. PR 2 improves height to 44 px and does not worsen width. The width shortfall for the three narrowest buttons is a carry-forward item noted in the baseline's deferred item 3. It is not a regression introduced by PR 2.

**Verdict: improvement confirmed on height axis; width shortfall carried forward from baseline, not a regression.**

#### Menu nav strip (new feature)

`js/touch.js` `getMenuNavButtons()` provides four subsets ('udselback', 'udlrselback', 'lrback', 'selback') covering all non-gameplay screens. All buttons are 44 px tall. The strip is drawn at the bottom of the canvas in the `TOUCH_HUD_H` zone (72 px), centred vertically within it. Button labels are short ('UP', 'DOWN', 'OK', 'BACK', 'PREV', 'NEXT', 'CONTINUE'). Font size is 7 or 8 px of Press Start 2P, which renders at the game's pixel scale.

`hitTestMenuNav()` uses inclusive bounds checking (>= and <=), which is correct.

`_menuNavKey()` in `game.js` maps nav strip IDs to the key strings that `_handleMenuKey()` already handles. The mapping is complete: all six nav strip button IDs have a corresponding key string.

Each tap handler that uses the nav strip checks it first before any coordinate-based logic, so the strip takes priority over screen-region taps. This is the correct ordering.

**Verdict: menu nav strip functions correctly. No accessibility regressions introduced.**

### 2.2 New accessibility regressions introduced by PR 2

None found. The six changed files were inspected for:

- New interactive elements without accessible names: none added (all new interactivity is canvas-drawn).
- New ARIA attributes used incorrectly: no new ARIA attributes added beyond the correct `role="img"` and `aria-label` on the canvas.
- New keyboard traps: none introduced. The menu nav strip routes to `_handleMenuKey()` which already handles Escape correctly.
- New `aria-hidden` usage that hides content from screen readers: none.
- New `tabindex` usage: none.
- Focus management changes: none. This PR does not change focus management. That gap remains open from the baseline (A-05).
- Changes to colour constants or contrast values: none. All colour values unchanged.
- Changes to font sizes: none. Font rendering unchanged.
- Changes to animation or motion: none introduced by PR 2.

**Verdict: no new accessibility regressions.**

### 2.3 Pre-existing accessibility findings: status after PR 2

| ID | Finding | Status after PR 2 |
|----|---------|-------------------|
| A-01 | Canvas no accessible name | Fixed by PR 2 |
| A-02 | No keyboard hints in HTML | Open, unchanged |
| A-03 | Single-character shortcuts not configurable outside game | Open, unchanged |
| A-04 | Audio plays without accessible stop control | Open, unchanged |
| A-05 | No focus management on screen transitions | Open, unchanged |
| A-06 | user-scalable=no | Open, unchanged |
| AA-01 | user-scalable=no, no reflow | Open, unchanged |
| AA-02 | Canvas text contrast below AAA 7:1 at several points | Open, unchanged |
| AA-04 | Screen transitions not announced | Open, unchanged |
| AA-05 | No visible focus indicator | Open, unchanged |
| AAA-01 | Contrast enhanced gaps | Open, unchanged |
| AAA-02 | No reduced-motion support | Open, unchanged |
| AAA-03 | No keyboard-only game mode | Open, unchanged |
| AAA-04 | No timing control during gameplay | Open, unchanged |
| AAA-06 | Canvas controls no machine-readable purpose | Open, unchanged |
| AAA-07 | Automatic screen transitions | Open, unchanged |
| AAA-08 | Help screen inaccessible to screen readers | Open, unchanged |
| G-01 | Entire game invisible to screen readers | Open; canvas label is the minimum fix; game state still not accessible |
| G-02 | Game state events not announced | Open, unchanged |
| G-03 | HUD is canvas-only | Open, unchanged |
| G-04 | Continuous scrolling at 60 fps, vestibular risk | Open, unchanged |
| Keys-sticking | No blur/visibilitychange listeners in input.js | **Open, not fixed in PR 2** |
| Deferred-3 | Touch button width below 44 px on left/right/jump | Open, carry-forward |

---

## 3. Visual checks

Visual checks are code-inspection-based. No live browser run was conducted.

**Canvas label text.** "James' Nerf Squad game area" is grammatically correct and matches the game's name. It does not over-promise (it says "game area", not "interactive game").

**Menu nav strip rendering.** `drawMenuNavStrip()` draws a semi-transparent dark background, a separator line at the top of the strip, and rounded-rectangle buttons with white text. Button labels use Press Start 2P at 7 to 8 px, centred. This is visually consistent with the existing gameplay touch strip style.

**Platform tier rendering.** The three-tier layout distributes platforms across three y-ranges. No rendering changes were made; platforms are drawn by existing code. The visual result will be more varied terrain, which is the intended improvement.

**Boss rendering.** `drawBoss()` is unchanged by PR 2. The boss boundary change affects position, not appearance.

**Brand check.** James' Nerf Squad has no Tim Dixon brand assets that need checking per `docs/brand.md`. This is a standalone game, not a Tim Dixon branded artifact.

**Citation check.** This PR is a developer fix from Sean, not a draft produced by Tad or Simon. No citation to `docs/writing-style.md` or `docs/brand.md` is required.

---

## 4. Screen reader testing

Automated Pa11y and axe-core runs are not possible without a live served instance. VoiceOver, JAWS, and NVDA manual passes are not possible without the live-region system (baseline G-05, Option 1) being implemented first, since the current canvas surface produces nothing for a screen reader to navigate.

The canvas label fix (`role="img"`, `aria-label`) can be confirmed by code inspection: VoiceOver will read "James' Nerf Squad game area, image" when focus reaches the canvas. JAWS will announce the same. This is the correct and expected behaviour for a canvas element with these attributes.

Full screen reader passes remain deferred, as recorded in the baseline, pending implementation of the live-region announcer system.

---

## 5. Keys-sticking defect: status

The keys-sticking defect identified in the baseline is **not fixed in PR 2**. PR 2 fixes touch buttons not working, which is a separate issue.

The defect: `js/input.js` has no `blur` listener and no `visibilitychange` listener. When the browser window loses focus, the `held` map retains stale `true` values for any keys that were down at the moment of focus loss. On focus return, `pollMovement()` reads those stale values and the player moves as if the key is still held.

This is a confirmed accessibility defect under WCAG 2.1.1 and 2.1.3. It is not a blocker for PR 2 (PR 2 does not change this code path and does not worsen the defect). It must be fixed before the main branch can be considered fully operational for keyboard-only users.

**Required follow-on work:** Sean must add `blur`, `visibilitychange`, and optionally `touchcancel` listeners that clear `Input.held` and reset movement state, as specified in the baseline audit (the fix code is at baseline page, keys-sticking section). This work should be a separate PR.

---

## 6. Release checklist

This checklist is for PR 2 (`feat/touch-and-layout-fixes`) only, scoped to merging this PR to `main`.

### Required checks

| Item | Status | Notes |
|------|--------|-------|
| Continuous integration (CI) | Not applicable | No CI exists on this repository. Carol's test pass is the merge gate per the brief. |
| Accessibility gate | Conditional pass | Canvas label fix confirmed. Touch targets at 44 px confirmed. Remaining baseline gaps are open pre-existing items, not regressions introduced by PR 2. |
| Security check | Not in scope of this PR | Jed's security review is in the work folder (`jed-security-review.md`); that review was against the initial codebase, not PR 2. PR 2 does not add new endpoints, external calls, or security-relevant code paths. |

### Functional testing

| Item | Status |
|------|--------|
| Fix 1: touch left/right buttons | Pass |
| Fix 2: platform tier distribution | Pass |
| Fix 3: boss camera-relative boundary | Pass |
| Regression check: no new functional defects introduced | Pass (code inspection) |

### Accessibility testing

| Item | Status |
|------|--------|
| Canvas label (A-01) | Pass |
| Touch target height 44 px (WCAG 2.5.5) | Pass for height axis |
| Touch target width 44 px (left/right/jump at 40 px) | Carry-forward gap, not a PR 2 regression |
| No new ARIA regressions | Pass |
| No new keyboard accessibility regressions | Pass |
| Screen reader manual pass (VoiceOver, JAWS, NVDA) | Deferred — requires live-region system first |
| Automated Pa11y and axe-core | Deferred — requires live served instance |

### Visual testing

| Item | Status |
|------|--------|
| Canvas label text grammatically correct | Pass |
| Menu nav strip visually consistent with existing style | Pass (code inspection) |
| Platform tier layout correct | Pass |
| Boss position logic correct | Pass |
| Brand artifact check | Not applicable |

### Architecture and security conformance

| Item | Status |
|------|--------|
| Architecture conformance check | Not re-run for PR 2. PR 2 does not change architecture. Jacob's review (`jacob-architecture-review.md`) covers the initial codebase. |
| Security conformance check | Not re-run for PR 2. Jed's review (`jed-security-review.md`) covers the initial codebase. PR 2 does not introduce new security surface. |

### Version and changelog

| Item | Status |
|------|--------|
| VERSION file | Not present on this repository. Not required for PR 2 (this is a fix PR, not a formal release). |
| Changelog | No CHANGELOG.md on this repository. Not a blocker for PR 2 merge. |

### GitHub Actions log

| Item | Status |
|------|--------|
| GitHub Actions log | No CI workflows exist on this repository. Not applicable for PR 2. |

### Open blocking items for this PR

None. PR 2 may be merged.

### Open non-blocking follow-on items (must not be forgotten)

1. **Keys-sticking fix (P1 priority).** Sean adds `blur` and `visibilitychange` listeners to `js/input.js`. This is an accessibility defect under WCAG 2.1.1 and 2.1.3. Q69 from the baseline (scope of the fix: blur only, blur plus visibilitychange, or all three including touchcancel) is still unanswered. Tim's answer is needed before Sean can build the fix.

2. **Q67: accessible-alternative posture.** Tim has not answered which live-region option to implement. Until Tim answers, the entire game remains inaccessible to screen readers beyond the canvas label. This is the largest remaining gap.

3. **Q68: reduced-motion gate.** Tim has not answered whether to add a `prefers-reduced-motion` check. The game runs 60 fps continuous animation with no motion gate.

4. **Touch target width (left/right/jump at 40 px).** These three buttons are below the WCAG 2.5.5 44 px minimum on the width axis at `pixelScale` 1. Carried forward from baseline deferred item 3.

5. **Contrast pairs below AAA 7:1.** Several canvas colour pairs pass AA but fail AAA. Carried forward from baseline AA-02 and AAA-01. A live Pa11y or axe-core run is needed to confirm exact values.

6. **Screen reader evidence gate.** `docs/patterns/screen-reader-evidence.md` requires a manual VoiceOver and JAWS pass on file before release. This cannot be completed until the live-region system (Q67) is implemented. The screen reader evidence gate is not cleared. A full release (beyond merging this fix PR) is not possible until this gate is cleared.

---

## 7. Handoff note

PR 2 is ready to merge. The three bug fixes are correct by code inspection. No new accessibility regressions are introduced. The canvas label improvement is confirmed.

The following items must be communicated to Tim before the work folder can be closed:

- Q67, Q68, Q69 remain open from the baseline.
- The screen reader evidence gate is not cleared and blocks a full release.
- The keys-sticking defect is a P1 accessibility issue requiring a separate PR.

Sonja should route Q67, Q68, and Q69 to Tim as part of the next question batch if they have not already been sent.
