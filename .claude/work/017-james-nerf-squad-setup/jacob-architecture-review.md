# James-Nerf-Squad Architecture Review and Decision Records

Author: Jacob, architect.
Date: 2026-05-23.
Repository: timdixon82/James-Nerf-Squad, branch main (only an empty "Initial commit" `9d6eb02`; the game code is in the working tree, uncommitted).
Status: backfill review of an adopted project. The code exists locally; this review records the architecture as built so the setup branch has a baseline to conform to.

## Purpose of this document

The team adopted James-Nerf-Squad on 2026-05-23 as work folder 017. Tad runs the requirements backfill, Jed the security review, and Carol the baseline accessibility audit in parallel. This is the architecture backfill: it describes the project as built, judges each significant choice, and proposes Architecture Decision Records (ADRs) for the project wiki. It also returns an architectural verdict on Tim's keys-sticking bug.

## Architecture summary

James-Nerf-Squad is a single-page, side-scrolling pixel-art action game running entirely in the browser. No build tools. The page (`index.html`) loads fifteen plain JavaScript files in strict dependency order via `<script src>` tags, then `main.js` boots a `Game` instance that owns the `<canvas>`, the `requestAnimationFrame` loop, and all mutable state. Rendering is software 2D canvas drawing. All audio is synthesised on the fly with Web Audio oscillators; there are no audio assets. Persistence is a host-injected `window.persistentStorage` shim (no `localStorage` fallback today).

Module roles:

- `constants.js`: numeric constants, blaster and enemy tables, the `LEVELS` array (nine level definitions, each a plain object), default key bindings, colour palettes.
- `utils.js`: maths helpers, key-label formatter, the persistence shim.
- `input.js`: input manager. A `held` map updated by keydown and keyup, a `state` object with "just pressed" one-shot flags, a `bindings` map, a touch entry point that writes into the same `state`.
- `sound.js`, `music.js`: Web Audio synthesis. `AudioContext` lazily created.
- `particles.js`, `icons.js`: visual effects and pixel-art icon rendering.
- `player.js`, `enemy.js`, `boss.js`: entity update and draw helpers.
- `hud.js`, `screens.js`: heads-up display and full-screen menu drawing.
- `touch.js`: on-screen touch-button geometry and rendering (the button-list factory plus drawers).
- `game.js`: the `Game` class. Owns the game state object `gs`, binds keyboard, touch and resize events, dispatches taps, runs the loop, persists.
- `main.js`: entry point. Sizes the canvas, constructs the game, loads, starts.

There is no shared global beyond the implicit ones declared with `var` at file scope; the code relies on the script-tag load order in `index.html` to put each `var` on `window` before the next file runs.

## Strengths

The separation of concerns is sensible for the size: input, audio, rendering, entities, screens and persistence each live in their own file. The game-state object `gs` is one place, which is the right shape for a 2D arcade game at this scale. No third-party game framework: roughly 2,700 lines of hand-written code, no build step, zero runtime supply-chain surface.

The input layer's split between a continuous `held` map, a derived per-frame movement summary (`pollMovement`), and one-shot "just pressed" flags is the right shape for a game loop. One-shots are cleared each frame by `clearOneShots`, which is the standard pattern.

Touch buttons and keyboard funnel into the same `state`. Two input modalities reaching one decision surface is correct.

Web Audio synthesis (oscillators with envelopes) avoids any audio assets, keeps the deploy small, and sidesteps any audio licensing question. The `AudioContext` is created lazily, which is necessary for browsers that block audio before user gesture.

Level definitions are plain JavaScript objects in `constants.js`, one row per level. That is human-editable, diffable, and adequate for nine levels. Save data is keyed (`nerfSquadSave`) and namespaced.

A tiny inline error catcher in `index.html` draws "black screen" failures to the canvas so a launch error is visible without devtools. Pragmatic for an adopted project.

## Risks and concerns

### Keys-sticking diagnosis (Tim's reported bug)

Verdict: confirmed architectural defect. There are at least three independent paths that can leave a key in the "held" state after the user has released it.

1. **No window blur or visibility-change handler.** `game.js` binds `keydown` and `keyup` to `window`, but binds nothing to `blur` or `visibilitychange`. If the user Alt-Tabs (Windows), uses Command-Tab (macOS), switches tabs, or opens an OS-level overlay between keydown and keyup, the keyup never fires. `held[key]` stays `true` forever, `pollMovement` keeps reading it, and the player keeps moving. This is the dominant cause of the symptom Tim reports.

2. **Modifier-suppressed keyup on macOS for the Shift binding.** `switch` is bound to `Shift`. If the user holds Shift and a modifier-suppressed key combination fires (for example Command-Shift-3 to screenshot on macOS, or any system shortcut that grabs focus), the browser can deliver keydown without the matching keyup. The Meta key on macOS is the canonical case: holding Meta (Command) and tapping any other key suppresses that other key's keyup in some browsers. With Shift used as a gameplay binding this is a likely real-world trigger.

3. **Held-map and one-shot flags never cleared on screen transition.** The `keydown` listener at `game.js:154` only calls `Input.onKeyDown` when `gs.screen === 'game'`, but `keyup` at `game.js:160` calls `Input.onKeyUp` unconditionally. The reverse asymmetry also bites: a key pressed in the menu and released in the game leaves `held[key]` undefined on the down side and then explicitly `false` on the up side. A key pressed in the game and released after a `screen` change that itself ate focus may never see its keyup. Neither path clears the whole input state on pause, level transition, or game-over.

4. **Touch leakage.** `onTouchUp` in `game.js` is driven by re-scanning `e.touches` (the still-active touches) and pressing each button "not under any active touch" up. If a touch is lifted off the canvas entirely (a swipe off-screen), `touchcancel` covers it. But `touchend` is documented to omit the lifted touch from `e.touches` while including it in `e.changedTouches`, and the current code only consults `e.touches`, so the logic is correct in the common case. The risk is the inverse: a tap-handling path at `_dispatchTap` calls `Input.onTouchDown(btn.id)` and sets `btn.pressed = true` (line 233) but there is no paired call to flip it off, because a "click" event does not have a release moment for touch hardware. A canvas tap on a button via `click` (synthesised from a touchend on a desktop in a touch-emulated DevTools session, or on certain hybrid devices) will set `btn.pressed = true` and `state.shoot = true` (or `.jump`), and nothing in the codebase will set it back. This is a secondary path but it is genuinely there.

5. **Pause key not bound in `bindings`-and-respected path.** `bindings.pause = 'p'` exists but `keydown` does not stop processing input on pause. Less a sticking cause than an adjacent fragility.

**Proposed fix-class (Sean implements).** Three changes, no logic change to the game itself:

- a. Add a `window.addEventListener('blur', clearAllInput)` and `document.addEventListener('visibilitychange', clearAllInput)` handler. `clearAllInput` empties the `held` map, sets every `state.*` boolean to `false`, and calls `clearOneShots`. This alone fixes the dominant symptom.
- b. Make the `keydown` and `keyup` paths symmetric: route both through the input manager unconditionally, and let the input manager (not the game) decide whether to set the one-shot. Or, simpler, always call `onKeyDown` and `onKeyUp` and only gate the gameplay reads in `pollMovement`.
- c. On any screen transition (`gs.screen = '...'`), call `clearAllInput`. A single helper in `Game.prototype._setScreen` would be the right shape.

For the touch click path, the cleanest fix is to remove the `Input.onTouchDown(btn.id)` call from the `click` handler at `game.js:233`: touchstart already covers it for touch hardware, and a mouse click on the touch-button strip is not a use case the game needs to support. Alternatively, also call `Input.onTouchUp(btn.id)` in the same handler and reset `btn.pressed` after the one-shot has been consumed.

### Other risks

The persistence shim has no `localStorage` fallback. `utils.js:96-101` only persists if `window.persistentStorage` exists; in any browser without a host shell, every save is silently dropped on the floor. Saves work in a hosting container; saves do not work on GitHub Pages. The Poop-Breakout pattern (default to a `localStorage`-backed adapter, allow `window.persistentStorage` to override) is the right shape and should be adopted here as well.

The whole game is drawn into a `<canvas>` with no fallback content, no ARIA role, no live region for score, lives or level, and no `prefers-reduced-motion` respect. The HUD scrolls, the boss bar pulses, particles spray on every hit. WCAG 2.2 at AAA is the team baseline; a canvas-driven game with no text alternative does not meet Success Criterion 1.1.1 (Non-text Content) even at AA, nor 2.3.3 / 2.2.2 for the motion. Carol owns the detailed audit; this belongs in the architecture record because the rendering choice is what makes the gap structural rather than cosmetic. The Poop-Breakout posture (an off-screen live region mirroring score, lives, level and key events, a keyboard-only menu path, an exception recorded for the canvas-as-decorative position) applies here unchanged.

No Content Security Policy meta tag on `index.html`. The inline `<script>` block at line 12 requires `'unsafe-inline'` under the team baseline; either move that error catcher into a small external file or accept the inline-script exception in writing.

The fifteen-file `<script src>` chain is fragile: any reorder breaks the build, the order is enforced only by the comment "Load modules in strict dependency order" in HTML, and there is no test that the order remains valid. ES modules (`<script type="module">`) would express the dependencies in the language. The README states "no build tools" deliberately; ES modules require no build, so this is available without contradicting the project's posture.

The `Game` constructor and `_bindEvents` between them mix concerns: state ownership, event wiring, input dispatch, tap routing and screen transitions are all in one file (`game.js` is roughly 800 lines). Acceptable at this size; a future refactor would split screen routing from the game core.

## Proposed Architecture Decision Records

The following are proposed for the project wiki at `docs/decisions/` when Tad scaffolds it.

### ADR 001: Static front-end on GitHub Pages, no build step

Accepted. The project is the team's static stack in its plainest form: HTML, CSS, and JavaScript served as-is. No bundler, no transpiler, no TypeScript. Deployment is GitHub Pages. Alternatives considered: Vite plus TypeScript (rejected for this project — Tim states the no-build posture is deliberate; the codebase is small enough to live without typing), a bundler with hot reload (rejected — no benefit at this scale). Consequences: standing standard 3 of `docs/decisions/006-adopted-static-project-standards.md` applies in full (GitHub Pages security-header exception, meta-tag CSP).

### ADR 002: Module load order via `<script src>` tags, not ES modules

Accepted as built, with an open question. Each `.js` file declares its symbols with `var` at file scope, and `index.html` orders the fifteen `<script src>` tags so each dependency is parsed before its dependants. Alternatives considered: ES modules with `<script type="module">` and explicit `import`/`export` (would express the order in the language and is available with no build step), IIFE plus a single global namespace (rejected — the current `var` pattern is effectively the same with less ceremony). Consequences: a future contributor reordering `<script>` tags can silently break the game; there is no automated check. Open question Q67 asks whether to migrate to ES modules in the setup branch.

### ADR 003: HTML5 Canvas 2D for all rendering

Accepted with an accessibility caveat. The game world, the heads-up display, the menus, and the on-screen touch buttons are all drawn into a single `<canvas>`. There is no DOM overlay. Alternatives considered: DOM overlays for menus (rejected by the project; the menus are part of the pixel-art aesthetic), WebGL (rejected — out of scale for this game). Consequences: in-game content is not in the accessibility tree. The accessibility approach (a parallel live region, a keyboard-driven menu flow) follows the Poop-Breakout pattern.

### ADR 004: Single `Game` class owning state, loop, input and dispatch

Accepted. `Game.prototype` holds the `requestAnimationFrame` loop, the `gs` state object, the keyboard, touch, click, and resize event bindings, and the screen-router (`_dispatchTap`, `_handleMenuKey`). Alternatives considered: split screen routing into its own module (worth doing if `game.js` grows further; not blocking today), a finite-state-machine library (over-engineered). Consequences: anyone changing input or screen transitions edits one file; the file is long.

### ADR 005: Input state machine with held map, one-shot flags, and a per-frame derived movement summary

Accepted, with a defect fix required. `Input` exposes `held` (the raw map), `state` (the per-frame summary including `left`, `right`, `jump`, `shoot` continuous booleans and `jumpPressed`, `shootPressed`, `switchPressed` one-shots), and lifecycle calls `pollMovement`, `clearOneShots`. Alternatives considered: an event-stream approach with no held map (rejected — a real-time game needs continuous state), per-key event subscribers (rejected — adds plumbing for no benefit). Consequences: the input layer must be hardened against focus loss, modifier-suppressed keyups, and screen transitions, per the keys-sticking diagnosis above.

### ADR 006: Keyboard and touch unified into a single input state

Accepted. `Input.onKeyDown`, `Input.onKeyUp`, `Input.onTouchDown`, `Input.onTouchUp` all write to the same `state` object, and `pollMovement` reads it without caring about source. Alternatives considered: separate touch and keyboard surfaces consumed at different layers (rejected — duplication and divergence risk). Consequences: a defect in either path appears as a "stuck" or "missing" input identically; debugging must distinguish.

### ADR 007: Audio synthesised at runtime with Web Audio (no audio assets)

Accepted. All sound effects and music are generated on demand by `OscillatorNode` graphs in `sound.js` and `music.js`, against a lazily created `AudioContext`. Alternatives considered: pre-recorded audio files (rejected — adds asset weight and a licensing surface; the chiptune aesthetic is appropriate to the pixel-art style), an audio library such as Howler.js (rejected — adds a runtime dependency for behaviour that fits in two files). Consequences: zero audio assets, but the audio code must respect a user gesture before the `AudioContext` runs, which it does.

### ADR 008: Persistence via host-injectable `window.persistentStorage` shim, defaulting to `localStorage`

Proposed (not yet built). Today the shim in `utils.js` returns no-op promises when `window.persistentStorage` is absent, which silently drops saves on the floor in a plain-browser deploy. The decision is to align with the Poop-Breakout pattern: default to `localStorage` wrapped in `Promise.resolve`, allow `window.persistentStorage` to override. Alternatives considered: leave as-is (rejected — broken on GitHub Pages), require IndexedDB (overkill). Consequences: high-scores and customisations persist on GitHub Pages, and a future host shell can still inject its own backend.

### ADR 009: Level definitions as plain JavaScript objects in `constants.js`

Accepted. Each level is a row in the `LEVELS` array with background colours, ground colour, enemy types, enemy count, platform count, scroll speed, and boss flags. Nine levels today. Alternatives considered: JSON files loaded at runtime (rejected — adds a fetch step and a CORS edge case for `file://` testing), procedural generation as Poop-Breakout uses (not appropriate — the levels have hand-tuned themes). Consequences: a new level is a code edit; diffs are clean; no migration is needed across versions.

## Cross-cutting candidates for the global wiki

Sonja decides what is promoted. My candidates, all worth promoting because canvas games will recur:

- **Canvas game accessibility pattern.** Same as Poop-Breakout: an off-screen live region mirroring score, lives, level and key events; a keyboard-only menu flow; a recorded exception for the canvas-as-decorative position. A second case (this one) makes the pattern ready for `docs/patterns/` in the global wiki.
- **Input-state-machine pattern for browser games.** The held-map plus one-shot-flags plus per-frame derived summary shape, with mandatory `blur`/`visibilitychange` clearing, is reusable across any keyboard-driven browser game. Worth a global pattern page.
- **Web Audio synthesis pattern for chiptune game audio.** Lazy `AudioContext`, oscillator graphs with envelopes, no audio assets. Recurs in any retro-styled game and is worth recording once.
- **Persistence adapter for browser games.** Already a Poop-Breakout candidate; this is the second case, which justifies promotion.

## Open questions for Tim

Numbers continue the engagement-wide sequence; Q67 is the next free number.

- **Q67. ES modules instead of the `<script src>` chain.** The fifteen-file load order is fragile. ES modules (`<script type="module">` and `import`/`export`) express the dependencies in the language with no build step. Option A: migrate to ES modules in the setup branch. Option B: keep the `<script src>` chain and add a CI lint that forbids reordering without review. Option C: keep as-is. Recommended: option A.

- **Q68. Persistence backend.** The current shim silently drops saves on GitHub Pages. Option A: default the shim to `localStorage` and keep the `window.persistentStorage` override (Poop-Breakout pattern). Option B: leave as-is and accept that saves do not persist in a plain-browser deploy. Recommended: option A.

- **Q69. Canvas-game accessibility approach.** Same shape as Q60 on Poop-Breakout. Option A: add an off-screen live region mirroring score, lives, level and key events; add a keyboard-only menu flow; record an exception for the canvas content itself ("the visual game is decorative; the live region is the conformant representation"). Option B: defer to a later phase and record an exception for the whole game today. Option C: rebuild with a DOM-and-ARIA representation. Recommended: option A.

- **Q70. Reduced-motion respect.** Screen scroll, particles, boss-bar pulse, hit-flash, and shake all run unconditionally. Option A: respect `prefers-reduced-motion: reduce` and disable the non-essential effects (the particles, the pulse, the shake) while keeping the scrolling (which is gameplay). Option B: leave as-is and record an exception. Recommended: option A.

- **Q71. Inline error catcher in `index.html`.** The script block at line 12 requires `'unsafe-inline'` under the team CSP. Option A: move it to `js/error-catcher.js` and drop `'unsafe-inline'`. Option B: keep it inline and add `'unsafe-inline'` to the CSP. Recommended: option A.

- **Q72. Promote canvas-game accessibility, input-state-machine, Web Audio synthesis and persistence-adapter patterns to the global wiki now.** Each has two worked cases (Poop-Breakout and James-Nerf-Squad). Option A: promote all four to `docs/patterns/` in the global wiki as part of this engagement. Option B: keep project-specific. Recommended: option A.

- **Q73. Level definition format.** Levels are inline objects in `constants.js`. Option A: leave as-is. Option B: extract to a JSON file fetched at startup. Recommended: option A.
