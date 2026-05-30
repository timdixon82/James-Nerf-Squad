# Baseline WCAG 2.2 AAA Accessibility Audit: James' Nerf Squad

Audit date: 2026-05-23
Auditor: Carol (tester and release manager)
Method: Code inspection only. No live browser run. Repository clone at `/Users/timdixon/Library/Mobile Documents/com~apple~CloudDocs/Github/James-Nerf-Squad` is read-only.

## UI surfaces audited

- `index.html`: the single HTML file, which holds the canvas element and the script load order.
- `css/style.css`: all visual styling.
- `js/constants.js`: all hard-coded data, palettes, and default key bindings.
- `js/input.js`: centralised input manager, key bindings, touch integration.
- `js/main.js`: entry point, DOM readiness, game construction and start.
- `js/game.js`: the Game constructor, game loop, event wiring, screen routing, collision, power-up logic, and all drawing dispatch.
- `js/screens.js`: render functions for every non-gameplay screen (title, customise, level select, boss intro, level complete, game over, settings, pause, help).
- `js/hud.js`: in-game HUD (hearts, score, blaster, ammo, power-up icons) and boss health bar.
- `js/touch.js`: on-screen touch control strip, button layout, touch detection.
- `js/player.js`: Player constructor, physics, shooting, damage, rendering.
- `js/sound.js`: all sound effects via Web Audio API.
- `js/utils.js`: helper functions including the `px()` text renderer and persistence shim.
- `js/music.js`, `js/particles.js`, `js/icons.js`, `js/enemy.js`, `js/boss.js`: supporting modules reviewed for accessibility-relevant behaviour.
- `README.md`: reviewed for keyboard documentation.

Surface not auditable by code inspection alone: runtime colour contrast of canvas-drawn text against canvas backgrounds. Canvas colours use dynamic fill values and level-specific palettes. Contrast estimates below are derived from colour constants. Automated Pa11y and axe-core runs against a served instance are required to confirm contrast numerically.

## WCAG 2.2 Level A findings

### A-01: Canvas element has no accessible name, role, or fallback content (1.1.1 Non-text Content, 4.1.2 Name Role Value)

`<canvas id="gameCanvas"></canvas>` in `index.html` has no `role`, no `aria-label`, and no fallback content inside the element. Screen readers will encounter an unlabelled bitmap. The entire game — title screen, level select, customise screen, help, HUD, gameplay, pause menu, game over, settings — is drawn exclusively onto this canvas. Nothing reaches the accessibility tree.

Severity: Critical Fail. This is the most serious finding in the audit. See the game-specific section for full discussion.

### A-02: No keyboard hints in the HTML; all controls are canvas text only (2.1.1 Keyboard, 3.3.2 Labels or Instructions)

Keyboard controls are documented in the Help screen, which is canvas-rendered text in `drawHelpScreen()` in `screens.js`. The README documents controls in a Markdown table. There are no keyboard hints in the HTML itself and no visible, accessible instructions at the point where a keyboard user begins playing. A screen reader user cannot access the Help screen content because the canvas is inaccessible (see A-01). The only keyboard-accessible documentation is the README, which is not in the game interface.

Severity: Fail.

### A-03: Single-character keyboard shortcuts not configurable from outside the game (2.1.4 Character Key Shortcuts)

Default gameplay bindings include single-character keys: `p` for pause, `c` for customise, `h` for help, `t` for settings, `r` for retry, `x` for touch toggle. These are active at the top-level `keydown` handler in `game.js`. JAWS uses many single-letter keys for navigation (H for headings, T for tables, P for paragraphs, and so on). While the game's Settings screen allows key rebinding, that screen is itself inaccessible to a screen reader user (canvas-rendered). There is no way for a screen reader user to disable or remap these shortcuts before they conflict.

Severity: Fail.

### A-04: Audio plays without a stop control on the HTML surface (1.4.2 Audio Control)

Music starts automatically when the game loads, via `startMusic('title')` called from `game.start()`. The Web Audio API is used and the music runs continuously. There is no pause or stop control accessible outside the canvas. The Settings and Pause screens expose in-game controls, but those screens are canvas-rendered and inaccessible to a screen reader user. A keyboard-only user with no canvas access has no way to stop the music.

Severity: Fail.

### A-05: Focus management absent across all screen transitions (2.4.3 Focus Order, 4.1.3 Status Messages)

All screen transitions in `game.js` are state changes on `this.gs.screen`. No focus is moved and no `aria-live` region is updated. The DOM is static; only the canvas changes. A screen reader user receives no signal when the game moves between the title screen, level select, gameplay, pause, level complete, and game over states.

Severity: Fail.

### A-06: `user-scalable=no` prevents zoom on mobile (1.4.4 Resize Text)

`<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />` explicitly disables user zoom. This is a WCAG 2.2 Level AA failure (1.4.4) in its own right, and it is also a Level A concern because it eliminates any chance of enlarging the canvas or text on mobile without OS-level assistance.

Severity: Fail (Level AA primary; recorded here because the meta tag is in the HTML and sets a baseline constraint).

## WCAG 2.2 Level AA findings

### AA-01: `user-scalable=no` disables text resize and reflow (1.4.4 Resize Text, 1.4.10 Reflow)

As noted at A-06, the viewport meta tag prevents pinch-to-zoom on mobile. Combined with `overflow: hidden` on both `html` and `body` in `style.css`, and the canvas being positioned absolutely to fill the viewport, there is no reflow path to a 320 px column. The HTML document has a single element: the canvas. There is no text in the DOM to reflow.

Severity: Fail.

### AA-02: Contrast of canvas-rendered text — HUD score and level name (1.4.3 Contrast Minimum)

HUD text is rendered in `hud.js` over `rgba(0,0,0,0.65)` bars. Key colour pairs by inspection:

- Score text `#ffff44` on `rgba(0,0,0,0.65)` black bar over variable level backgrounds. Estimated effective background: `#000`. `#ffff44` on `#000000` is approximately 19 to 1. Passes AA and AAA.
- Level name `#aaffff` on `#000000` bar. Estimated contrast approximately 17 to 1. Passes.
- HUD blaster name uses `BLASTERS[blaster].color`: `#ff8800` (pistol), `#44bbff` (rifle), `#ff4444` (mega), `#88ff44` (scatter). On `#000000` bar: orange `#ff8800` is approximately 7.5 to 1 (passes AAA). Cyan `#44bbff` is approximately 5.5 to 1 (passes AA, fails AAA). Red `#ff4444` is approximately 4.7 to 1 (passes AA, marginal AAA fail). Green `#88ff44` is approximately 7.7 to 1 (passes AAA).
- Boss bar boss name `#ff4444` on `rgba(0,0,0,0.75)` dark overlay. Effective background approximately `#000`. Approximately 4.7 to 1. Passes AA, fails AAA (7:1 required).
- Title screen: `JAMES'` in `#ffff00` on `#050514` background (approximate). `#ffff00` on `#050514` is approximately 19 to 1. Passes.
- Title menu items: active `#ffff00` on dark background, passes. Inactive `#aaa` on `#050514`: approximately 5.4 to 1. Passes AA, fails AAA.
- Game-over screen: `GAME OVER` in `#ff2200` on `rgba(0,0,0,0.92)`. Effective background approximately `#000`. `#ff2200` on `#000`: approximately 4.6 to 1. Passes AA, marginal fail at AAA.

Automated tooling is required to confirm these estimates against rendered output. The headline finding at AA level is that several colour pairings pass AA but fail the AAA 7:1 threshold.

Severity: Partial Fail at AA; wider fail at AAA (see AAA-01).

### AA-03: No `lang` attribute on parts in a different language (3.1.2 Language of Parts)

`lang="en"` is correctly set on `<html>`. No mixed-language content observed. Pass.

### AA-04: Screen transitions not announced to assistive technology (4.1.3 Status Messages)

Covered under A-05. Screen state changes are canvas redraws with no DOM change, no `aria-live` update, and no focus shift. Fail.

### AA-05: Focus obscured — no focus visible on the canvas surface (2.4.7 Focus Visible, 2.4.11 Focus Not Obscured Minimum)

The canvas itself receives no focus during gameplay (the `keydown` listener is on `window`). There are no HTML interactive elements, so there is no focus ring to be obscured. However, this means the concept of a visible focus indicator is entirely absent for keyboard users during all game screens. Pass in the narrow technical sense (no element has focus, so no focus ring can be hidden), but fail in the substantive sense: keyboard users cannot see where they are in the UI at any time.

Severity: Fail (substantive).

## WCAG 2.2 Level AAA gaps

### AAA-01: Contrast Enhanced — multiple canvas colours fail 7:1 (1.4.6 Contrast Enhanced)

As noted in AA-02, the following colour pairs fail the AAA 7:1 threshold for normal text: rifle blaster colour `#44bbff` on black, mega blaster colour `#ff4444` on black, inactive title menu items `#aaa` on dark background, game-over header `#ff2200` on black, boss bar name `#ff4444` on black. The team standard in `docs/accessibility.md` (section "Contrast and Colour", criterion 1.4.6) requires 7:1 from the start of the colour palette. These colours must be revised upward.

### AAA-02: No reduced-motion support (2.3.3 Animation from Interactions)

The game runs a continuous 60-frames-per-second animation loop started in `game.start()` using `requestAnimationFrame`. All screens animate: the title screen has a pulsing title and an animated player character; level select has a flashing hover state; gameplay has scrolling backgrounds, particle effects, animated enemies and boss, and a scrolling parallax background. There is no `prefers-reduced-motion` check anywhere in the codebase — not in `css/style.css` and not in `game.js` or any module. Users who need reduced motion receive none.

Additionally, several levels (`scrollSpeed` up to 2.8 in Level 9, `FINAL ARENA`) have rapid horizontal scroll that may be vestibular-triggering at 60 fps.

Severity: Fail at AAA level.

### AAA-03: No keyboard-only game mode or screen-reader-friendly alternative (2.1.3 Keyboard No Exception)

The game is keyboard-operable in the narrow sense: movement is Arrow/WASD, jump is ArrowUp/W, shoot is Space, switch is Shift, pause is P or Escape. All bindings are configurable in Settings. However, a screen reader user cannot play the game meaningfully because:

1. All game state (lives, score, blaster, ammo, enemy positions, boss health, power-ups) is canvas-rendered with no accessible equivalent.
2. No events are announced: hits, power-ups, level complete, and game over are visual-only.
3. There is no audio-cue system to substitute for visual feedback (existing sound effects are present but not structured as accessibility cues).

Recommended posture: see the game-specific section below.

### AAA-04: No timing control during gameplay (2.2.3 No Timing)

The game is a real-time action game. Enemies shoot, scroll past the screen, and kill the player on contact in real time. There is no mechanism to slow or freeze time except the Pause function (P or Escape, which is keyboard-accessible). Pause is a genuine mitigation, but the real-time nature of combat cannot be fully addressed within the current game design. Record the residual gap as a documented exception with Tim's approval.

### AAA-05: Reading level of UI copy not measured (3.1.5 Reading Level)

UI text includes phrases such as "Overlord of the Foam", "King of the Skies", "The Ultimate Nemesis", and "MISSION SELECT". These appear informal and short. No formal readability measurement has been run. Given the copy style, this is likely to pass grade 9. Tad should confirm as part of the documentation pass.

### AAA-06: 1.3.6 Identify Purpose — canvas controls have no machine-readable purpose

As with Poop-Breakout, the canvas does not expose any ARIA roles or properties. No machine-readable purpose is available for any control. Record as a documented exception.

### AAA-07: 3.2.5 Change on Request — several screen transitions are automatic

Screen transitions to `bossintro` (fires when `startLevel()` is called), to `game` (fires when `bossIntroTimer` reaches 0), and to `levelcomplete` (fires after `lcTimer` exceeds 60 and a shoot/jump input is read) are not explicitly user-initiated in the WCAG 3.2.5 sense. The level-complete transition in particular has a 60-frame delay then fires on a game-state input, not a deliberate menu choice. Mitigation is the same as for Poop-Breakout: move focus and announce via live region when screens change.

### AAA-08: 3.3.5 Help — in-game help is inaccessible to screen reader users

The three-page Help screen (`drawHelpScreen()` in `screens.js`) contains controls documentation, enemy descriptions, and power-up descriptions. All of this is canvas-rendered and inaccessible to any screen reader or keyboard-only user who cannot see the canvas. The README has equivalent information in Markdown. An HTML accessible description block, even if visually hidden, would address this gap.

## Canvas-game-specific accessibility findings

### G-01: The entire game is invisible to screen readers

This is the central accessibility concern for James' Nerf Squad. Every screen — title, level select, customise, help, settings, gameplay, pause, level complete, and game over — is drawn exclusively on the canvas. The `<canvas id="gameCanvas">` element has no `aria-label`, no `role`, and no fallback content.

A screen reader user using VoiceOver or JAWS will encounter one element when they land on this page: an unlabelled image or nothing, depending on the screen reader's canvas handling. They cannot:

- Determine what the game is.
- Navigate to any menu item.
- Know the current game state, score, or lives.
- Know when a level completes or when game over occurs.
- Access the Help or Settings screens.

This is not a marginal gap. It makes the entire application invisible to a screen reader user.

Root cause: the game is architecturally identical to the Poop-Breakout canvas posture. All rendering is into a 2D canvas context. No DOM elements mirror game state. The canvas-game-specific posture applies here in full.

### G-02: Game state events are never announced

Life-lost, enemy-killed, power-up-collected, level-complete, and game-over events produce visual effects (particles, screen changes) and audio effects (synthesised Web Audio tones) but no accessible announcements. A screen reader user who somehow reached the game with a work-around would receive zero game-state feedback during play.

The audio effects in `sound.js` are functional cues (shoot, hit, explosion, level complete, game over) but they are not designed as structured accessibility cues. They are undocumented sounds without narration equivalents.

### G-03: HUD is canvas-only

Score, lives, blaster, ammo, and active power-ups are drawn by `drawHUD()` in `hud.js`. None of these reach the accessibility tree. At screen-transition points (level complete, game over) the canvas renders score and level information, but not in any accessible form.

### G-04: Continuous scrolling backgrounds at 60 fps — vestibular risk

All nine levels have a scrolling parallax background via `drawBgScenery()` in `utils.js`. Scroll speeds range from 1.2 (`SUBURBAN STREET`) to 2.8 (`FINAL ARENA`). At 60 fps there is no reduced-motion gate. Users susceptible to motion-triggered vestibular or seizure reactions receive no protection. This is the same class of finding as Poop-Breakout G-04 and G-05.

### G-05: Recommended accessible-alternative posture

Three approaches are available, in the same order as the Poop-Breakout recommendation:

**Option 1: Hidden live-region shadow announcer (recommended minimum)**

Add a visually hidden `<div aria-live="polite" aria-atomic="false" id="game-announcer" class="sr-only">` to `index.html`. Update its `textContent` at meaningful state changes. Key announcement points:

- Game load: "James' Nerf Squad. Press Enter or Space to start. Press H for help."
- Screen change to title: "Main menu. Use Up and Down to navigate. Press Enter to select."
- Level start: "Level [N]: [name]. [enemy count] enemies. Lives: 3."
- Life lost: "Hit. Lives remaining: [N]."
- Enemy defeated: score change announced on a throttled basis (not every hit).
- Power-up collected: "[Power-up name] collected."
- Level complete: "Mission complete. Score: [N]. Press Space to continue."
- Game over: "Game over. Final score: [N]. Use Up and Down to choose Retry or Main Menu."
- Boss intro: "Warning. Boss fight. [Boss name]: [subtitle]."

**Option 2: Audio cue system**

Supplement Option 1 with structured audio narration. The game already has Web Audio synthesis. Add a spoken-word layer (using the Web Speech API's `SpeechSynthesis` interface, which requires no audio files) to narrate the announcement points above. This gives real-time feedback during gameplay that a text live region cannot provide without being overwhelming.

**Option 3: Reduced-speed accessible game mode**

Implement an alternate difficulty where enemy spawn rate and scroll speed are set to zero or minimal, the game is turn-based or step-paused, and all state is narrated. This is architecturally significant and is a long-term aspiration, not a backfill item.

The team's current recommendation is Option 1 now, Option 2 as an immediate follow-on (the Web Speech API is free and already available in the browsers the game targets), Option 3 deferred pending Tim's direction.

## Theme validation

James' Nerf Squad has no theme system. There is no light/dark toggle, no `prefers-color-scheme` response in `style.css`, no forced-colours mode, and no high-contrast skin. The canvas background in `style.css` is `background: #000` on the body. All level colour palettes are hardcoded in `constants.js`.

Theme validation per `docs/accessibility.md` (the standing rule added on 2026-05-23): not applicable. No themes to test. The absence of a `prefers-color-scheme` response is itself a gap (the game renders identically in light and dark OS modes; in light OS mode the black body background is correct, so no contrast regression occurs from the OS theme switch), recorded as a note rather than a failure.

## Keys-sticking defect: focus-loss inspection

Tim has reported that keys appear to stick during gameplay. The root cause is confirmed by inspection of `js/input.js`.

The `Input` module maintains a `held` object, a boolean map of every key currently depressed. `onKeyDown()` sets `held[key] = true` and `onKeyUp()` sets `held[key] = false`.

**The `Input` module has no `blur` listener and no `visibilitychange` listener.**

When the browser window loses focus during gameplay (Alt-Tab, the browser being minimised, a notification appearing, the screen locking, or any OS-level interruption), the browser stops delivering `keyup` events to the page. The `held` map entries for every key that was down at the moment of focus loss remain `true` indefinitely. When the window regains focus, `pollMovement()` reads those stale `true` entries and reports movement that the user is no longer requesting. The player then moves or shoots as if the key is physically jammed.

This is a confirmed keyboard-only accessibility defect under WCAG 2.1.1 (Keyboard) and 2.1.3 (Keyboard No Exception). It is not merely a bug: it actively prevents a keyboard-only user from regaining control of the game after any focus interruption without pressing and releasing every affected key manually — which a user with a motor disability may be unable to do reliably.

The fix is one listener in `js/input.js`, added alongside the existing event set up in `game.js`:

```js
window.addEventListener('blur', function() {
  var held = Input.held;
  for (var k in held) held[k] = false;
  Input.state.left  = false;
  Input.state.right = false;
  Input.state.jump  = false;
  Input.state.shoot = false;
});
```

A `visibilitychange` listener clearing the same map when `document.visibilityState === 'hidden'` should also be added for mobile scenarios (phone call overlay, screen off).

Sean's diagnosis and fix should include both listeners.

## Pause function — keyboard access

The game has a fully implemented pause function. `p` (default) and `Escape` both trigger `_openPause()` from `game.js`. The pause menu renders in `drawPauseMenu()` with RESUME and EXIT TO MENU options, navigable with ArrowUp/ArrowDown and confirmed with Enter. `p` and `Escape` also resume from pause.

Finding: **pause is fully keyboard-accessible**. This is a positive finding relative to Poop-Breakout (where `GameState.PAUSED` was defined but never implemented). It substantially mitigates the 2.2.3 No Timing gap.

## Keyboard hints in HTML vs canvas

Keyboard controls are documented only in the canvas-rendered Help screen (`drawHelpScreen()`) and in the README. No keyboard hints appear in the HTML. There is no HTML text layer and no visually hidden text that would be readable by a screen reader at any point. This overlaps with A-02 and G-01: the entire interface, including its help content, is inaccessible to screen readers.

## Recommended deferred items

The following items require a live build and served instance to audit properly. They are deferred pending CI pipeline availability.

1. Precise colour contrast ratios for all canvas-drawn text — requires axe-core and Pa11y against a served instance. Note: the game uses Google Fonts loaded over HTTPS, so `file://` serving will not match `http://` serving for font rendering.
2. Reflow at 320 px viewport width — the `user-scalable=no` meta tag and `overflow: hidden` make this a fail by code inspection, but the extent of content loss requires browser confirmation.
3. Touch target sizes for the on-screen touch buttons — default layout has `w: 40, h: 42` for direction buttons (40 px wide, 42 px tall). At `pixelScale` of 1 (small screens) this maps to 40 CSS pixels wide, which is below the AAA 44 px target. At higher `pixelScale` values this passes. Requires device-level confirmation.
4. VoiceOver, JAWS, and NVDA screen reader passes — these require the live-region system (Option 1 from G-05) to be implemented first, since the current canvas-only surface produces nothing to verify.
5. Keyboard-only play session — requires a live build.
6. Automated HTML validation — not possible from code inspection alone.
7. Reading-level check on all UI copy — requires Tad's pass.
8. Web Audio API behaviour with system audio preferences — no mute control is accessible outside the canvas.

## Open questions for Tim (Q67 onwards)

### Q67: Accessible-alternative posture for the canvas game

The game is entirely canvas-rendered. Screen reader users receive no game state. The team recommends implementing a hidden live-region announcer (Option 1 above) as the minimum fix, and adding Web Speech API narration as Option 2. Which approach would you like the team to build?

A. Option 1 only — hidden live-region announcements for menus, score, lives, and game-state transitions.
B. Option 1 plus Option 2 — live-region announcements and Web Speech API narration during gameplay.
C. All three options — live-region, speech narration, and a reduced-speed accessible game mode.
D. Note the gap as a documented exception and defer all three options. (Carol's note: this would leave the entire application invisible to a screen reader user and is not consistent with the team's WCAG AAA target.)

Team recommendation: Option B. The Web Speech API is already available in the game's target browsers and requires no additional assets. Option A alone is insufficient during active gameplay.

### Q68: Reduced-motion gate

The game runs 60-frames-per-second continuous animation with no `prefers-reduced-motion` check. At minimum, should the canvas game loop pause or slow when `prefers-reduced-motion: reduce` is set by the OS?

A. Yes — pause the game loop and display a reduced-motion screen when the OS setting is active.
B. Yes — reduce scroll speed and disable particle effects when the OS setting is active, but do not pause.
C. Note the gap as a documented exception for a real-time action game and defer to a future work item.

Team recommendation: Option B. Option A would make the game unplayable for users with the OS setting on by default. Option B substantially reduces vestibular risk with limited development effort.

### Q69: Keys-sticking fix scope

The keys-sticking defect is caused by missing `blur` and `visibilitychange` listeners in `js/input.js`. Sean's fix clears the held map when the window loses focus. Should Sean also reset the held map on any `touchcancel` event (for mobile users who are interrupted by a phone call or notification)?

A. Yes — reset the held map on `blur`, `visibilitychange`, and `touchcancel`.
B. Yes — reset on `blur` and `visibilitychange` only; treat `touchcancel` separately.
C. Reset on `blur` only for now; address `visibilitychange` and `touchcancel` in a follow-on item.

Team recommendation: Option A. All three events represent the same class of "external interruption that prevents keyup delivery". Fixing all three in the same commit is low cost and avoids a follow-on gap.
