# Accessibility Regression Suite: James Nerf Squad

## Status

State: Active
Introduced: 2026-06-01

## Purpose

This document records every automated and manual check that makes up an accessibility regression pass for James Nerf Squad. Carol (or any team member) runs these checks before signing off a sprint. The document tells you what each check covers, how to run it, and what a clean result looks like. The target is WCAG (Web Content Accessibility Guidelines) 2.2 at AAA conformance, as set out in `docs/accessibility.md`. This document follows the plain-language and abbreviation-expansion rules from the team's global writing style guide (`docs/writing-style.md` in the AgentTeam wiki), specifically the Structure and rhythm section's grade-9 readability standard and the abbreviations rule.

## Automated tools

### HTMLHint 1.9.2

HTMLHint checks `index.html` for structural problems: missing required attributes, duplicate IDs, unclosed tags, and similar markup errors. These problems can affect how assistive technologies parse the page.

Run command:

```
npm run lint:html
```

This expands to `htmlhint index.html`. A clean pass exits with code 0 and prints no errors. Any finding is a blocker.

### ESLint 10.4.1

ESLint (a JavaScript linting tool) checks all files in `js/` against the rules in `eslint.config.js`. The rules enforce strict equality, block `eval` and related unsafe patterns, and warn on undefined or unused variables. Undefined globals and unsafe patterns can cause silent failures at runtime, including in the announcer and keyboard-navigation code paths.

Run command:

```
npm run lint:js
```

This expands to `eslint "js/*.js"`. A clean pass exits with code 0. Warnings are noted but do not block; errors block.

### Pa11y 9.1.1

Pa11y (an automated accessibility testing tool) loads `index.html` in a headless Chrome browser and runs WCAG 2.2 AAA checks against the served HTML. It tests the document structure, ARIA (Accessible Rich Internet Applications) attributes, and the live announcer region. It cannot test the canvas game content itself; that is covered in the manual checks below.

Pa11y is not installed in the main `package.json`. It runs in CI (Continuous Integration) via `.github/accessibility-tools/` and can be run locally from that folder.

Run command (local, after serving the site):

1. Start a local server: `python3 -m http.server 8080 --directory /Users/timdixon/Code/Github/James-Nerf-Squad`
2. Run Pa11y: `node_modules/.bin/pa11y --standard WCAG2AAA --config ../../pa11y.json http://localhost:8080/index.html` (from `.github/accessibility-tools/` after running `npm ci` there)

A clean pass exits with code 0 and reports no errors or warnings. Any finding that is not listed in `pa11y.json`'s `ignore` array is a blocker.

The `pa11y.json` file in the project root is the base configuration. In CI, a `pa11y.ci.json` is generated at run time with the system Chrome path added; do not commit that file.

### axe-core CLI 4.11.3

The axe-core (an accessibility rule engine) command-line interface loads `index.html` and runs WCAG 2.0 A, AA, AAA and WCAG 2.2 AA and AAA rules. It complements Pa11y by using a different rule engine, catching issues either tool might miss on its own.

axe-core is also installed in `.github/accessibility-tools/`. It runs in CI alongside Pa11y.

Run command (local, with the server running on port 8080):

```
node_modules/.bin/axe http://localhost:8080/index.html --tags wcag2a,wcag2aa,wcag2aaa,wcag22aa,wcag22aaa --chrome-options=no-sandbox
```

(Run from `.github/accessibility-tools/` after `npm ci`.)

A clean pass exits with code 0 and reports no violations. Any violation is a blocker.

## Manual checks

These checks run alongside the automated tools. No automated tool can substitute for them, because the game renders its play area on a `<canvas>` element that is outside the accessibility tree.

1. Keyboard-only navigation: starting from the browser address bar, press Tab to move through every interactive element on every screen (title menu, customise, level select, pause menu, inventory, settings, game over, help). Confirm that focus moves in a logical order, that every item receives visible focus, and that no focus trap exists that prevents Tab from reaching the next element.

2. Live-region spot-check: open browser DevTools (keyboard shortcut: F12 or Control-Shift-I) and select the Elements panel. Find `#game-announcer`. Play through a session and trigger each of the following events: game load, title screen display, level start, life lost, power-up collected, level complete, game over, boss intro, pause open, and pause resume. Confirm that `textContent` of `#game-announcer` updates with the correct message at each point, as listed in the acceptance criteria for R-01 in `docs/requirements.md`.

3. Reduced-motion gate: enable `prefers-reduced-motion: reduce` either in your operating system accessibility settings or in browser DevTools (under Rendering). Load the game and confirm three things: the game starts without being blocked; the scroll speed is visibly slower than the default; and no particle effects appear. Disable the setting and confirm particles and scroll speed return to normal without a page reload.

4. Colour contrast spot-check: open the game in a browser and confirm that readable text elements render legibly at adequate contrast: the HUD (Heads-Up Display) score and lives counter (white on black bar), the active blaster name (colour on black bar), the inactive title menu items (light grey on dark background), the boss health-bar name (light coral on dark background), and the game-over heading (light coral on dark background). If any text is hard to read against its background, flag it for a contrast measurement.

5. Font rendering: open the Network panel in browser DevTools before loading the page. Reload the page and filter the network requests by domain. Confirm that no request is made to `fonts.googleapis.com` or `fonts.gstatic.com`. Confirm that the Press Start 2P font loads from the local `fonts/` directory.

## How to run the full suite

Run the checks in this order.

1. Install the main project dependencies: `npm ci` (from the project root).
2. Install the accessibility tool dependencies: `npm ci` (from `.github/accessibility-tools/`).
3. Run the HTML linter: `npm run lint:html` (from the project root). Fix any errors before continuing.
4. Run the JavaScript linter: `npm run lint:js` (from the project root). Investigate any warnings; fix any errors before continuing.
5. Start a local HTTP server: `python3 -m http.server 8080 --directory /Users/timdixon/Code/Github/James-Nerf-Squad`
6. Run Pa11y: `node_modules/.bin/pa11y --standard WCAG2AAA --config ../../pa11y.json http://localhost:8080/index.html` (from `.github/accessibility-tools/`). Fix any findings not in the ignore list before continuing.
7. Run axe-core: `node_modules/.bin/axe http://localhost:8080/index.html --tags wcag2a,wcag2aa,wcag2aaa,wcag22aa,wcag22aaa --chrome-options=no-sandbox` (from `.github/accessibility-tools/`). Fix any violations before continuing.
8. Carry out manual check 1: keyboard-only navigation.
9. Carry out manual check 2: live-region spot-check.
10. Carry out manual check 3: reduced-motion gate.
11. Carry out manual check 4: colour contrast spot-check.
12. Carry out manual check 5: font rendering.
13. Record the results of every step. Note the date, the tool or check name, and the outcome (pass, fail, or finding noted for exception).

## Pass criteria for a sprint

Carol signs off a sprint as ready for merge when all of the following are true.

- HTMLHint exits 0 with no errors.
- ESLint exits 0 with no errors. Warnings are documented but do not block.
- Pa11y exits 0 with no findings outside the active ignore list in `pa11y.json`.
- axe-core exits 0 with no violations.
- All five manual checks pass.
- Every finding raised during the checks is either fixed or has a dated exception file in `docs/exceptions/`.
- All sprint-specific acceptance criteria in `docs/requirements.md` are ticked off.
- The Definition of Done in `docs/requirements.md` is met in full.

## Adding a new check

To add a new automated check, install the tool in `.github/accessibility-tools/package.json` (so Dependabot can track it), add an npm script to the root `package.json` if a local run command is needed, add a step to `.github/workflows/accessibility.yml`, and add a row to the "Automated tools" section of this document with the tool name and version, what it checks, and how to run it. To add a new manual check, add a numbered item to the "Manual checks" section and note any prerequisites, such as a specific browser setting or DevTools panel.

## Recording exceptions and deferred findings

Any finding that is not fixed in the current sprint must have a dated exception file in `docs/exceptions/`. The exception file records the finding, the tool or check that raised it, the reason it is deferred, an owner, and a target resolution date. See the team's global wiki for the exception file format. If a finding is deferred in Pa11y, its code must also be added to the `ignore` array in `pa11y.json`, with a matching note in `docs/accessibility.md`. The `docs/accessibility.md` page lists all currently active Pa11y ignore entries. Remove an entry from `pa11y.json` when the corresponding finding is fixed, and update `docs/accessibility.md` at the same time.
