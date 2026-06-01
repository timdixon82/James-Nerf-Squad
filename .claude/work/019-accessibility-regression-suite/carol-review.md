# Carol review: accessibility-regression-suite.md

Reviewer: Carol
Date: 2026-06-01
Document reviewed: `docs/patterns/accessibility-regression-suite.md`
Verdict: Conditional pass

## Summary

The document is accurate in its structural claims, tool versions, npm commands, and manual check procedures. Three corrections are required before commit. None of the three is a factual error about the project's code; all are precision issues or missing details that would mislead someone running the checks.

## Findings

### Finding 1 — Missing writing-style.md citation (rework flag, blocks commit)

Tad's draft contains no citation to `docs/writing-style.md` naming the line or section applied. This is a required citation check per Carol's identity, and its absence is a rework flag. The document cannot be committed until Tad adds the citation.

Action: route to Sonja for re-dispatch to Tad. Tad must add a citation to the relevant rule in `docs/writing-style.md` (for example, the abbreviation-expansion rule, the plain-language standard, or the heading-order rule) to the document, naming the section applied.

### Finding 2 — Pa11y local run command uses absolute machine path (blocks usability)

Section "Pa11y 9.1.1" and the numbered run order in "How to run the full suite" both contain the instruction:

```
node_modules/.bin/pa11y --standard WCAG2AAA --config /Users/timdixon/Code/Github/James-Nerf-Squad/pa11y.json http://localhost:8080/index.html
```

The `--config` value is an absolute path tied to Tim's local machine. Anyone running the suite on another machine or in CI will get a file-not-found error. The correct local instruction is to use a path relative to the working directory, which is `.github/accessibility-tools/`, meaning two levels up to the project root:

```
node_modules/.bin/pa11y --standard WCAG2AAA --config ../../pa11y.json http://localhost:8080/index.html
```

Alternatively, the instruction can note that the runner must substitute their own absolute path to the project root. The CI workflow uses `pa11y.ci.json`, not `pa11y.json`, but for local runs `pa11y.json` is correct. The issue is the hardcoded absolute path, not the config file choice.

Action: replace the absolute path in both occurrences (section "Pa11y 9.1.1", step 6 of "How to run the full suite") with the relative path `../../pa11y.json`, and add a note that the command is run from `.github/accessibility-tools/`.

### Finding 3 — Colour-contrast spot-check lists incorrect pre-sprint colour values (factual inaccuracy)

Manual check 4 states: "If any text appears in the pre-sprint colours (rifle label `#44bbff`, mega label `#ff4444`, inactive menu item `#aaa`, game-over header `#ff2200`), the check fails."

Cross-checking the current codebase shows:

- Rifle colour in `constants.js` line 35: `#79caff` (this is the current value after sprint 018; `#44bbff` is not present in any JS file, so the document's claim that `#44bbff` was the pre-sprint rifle colour may be correct, but the value `#44bbff` never appears in the codebase for me to verify. This part cannot be independently confirmed from the code.)
- Mega blaster colour in `constants.js` line 36: `#ff8a7a`. The mega label colour listed in the document is `#ff4444`. `#ff4444` does still appear in the codebase in `hud.js` (heart drawing, boss health bar), `player.js` (hurt particles), and `screens.js` (level-select boss stroke). Its use is decorative or structural, not as the mega-label text colour. The document's implication that `#ff4444` appearing anywhere signals a failure is incorrect; `#ff4444` legitimately remains in the game for non-text uses.
- Inactive menu item: `UI_TEXT_DIM` is defined in `constants.js` line 75 as `#c9c9d2` (the updated value). The pre-sprint value `#aaa` (`#aaaaaa`) also legitimately remains in the codebase in `icons.js` line 52, `boss.js` lines 134, 137, 139, `enemy.js` lines 97, 176, and `touch.js` line 200, all as decorative sprite-pixel colours.
- Game-over header: `screens.js` line 193 renders "GAME OVER" in `#ff7a5c`, not `#ff2200`. `#ff2200` appears in `boss.js` line 84 as a dart colour from the boss, which is unrelated to the game-over header text.

The check as written would produce false failures: a tester seeing `#ff4444` in the source or DevTools for hearts or particles, or `#aaa` for sprite pixels, or `#ff2200` for a boss dart, would wrongly conclude the palette update is incomplete.

The spot-check instruction should describe what the tester actually sees on screen, not the colour codes of values that were replaced. The correct instruction is to visually examine the listed elements and confirm each reads legibly against its background at the expected contrast ratio, then note what the updated colours look like. Alternatively, if the intent is to catch regression to the old values specifically in the UI text locations, the instruction must constrain the check to those specific elements (menu label text, game-over heading text) and not imply that any occurrence of those hex values is a failure.

Action: rewrite manual check 4 to describe a visual confirmation of the updated palette at the specific UI text locations, without listing hex codes that legitimately remain in other uses, or to constrain any hex-code check precisely to the element and attribute being tested.

## Items confirmed accurate

The following were cross-checked against the project files and are correct.

- HTMLHint version 1.9.2: confirmed in `package.json` line 16.
- ESLint version 10.4.1: confirmed in `package.json` line 13.
- `npm run lint:html` expands to `htmlhint index.html`: confirmed in `package.json` line 8.
- `npm run lint:js` expands to `eslint "js/*.js"`: confirmed in `package.json` line 9.
- Pa11y 9.1.1: confirmed in `.github/accessibility-tools/package.json` line 7.
- axe-core CLI 4.11.3 (package name `@axe-core/cli`): confirmed in `.github/accessibility-tools/package.json` line 6.
- Pa11y and axe-core are not in the main `package.json`; they are in `.github/accessibility-tools/`.
- The axe-core run command tags (`wcag2a,wcag2aa,wcag2aaa,wcag22aa,wcag22aaa`) and `--chrome-options=no-sandbox` flag match the CI workflow at `.github/workflows/accessibility.yml` lines 103-105.
- Pa11y `--standard WCAG2AAA` flag matches the CI workflow line 98.
- `pa11y.json` at the project root is the base config; `pa11y.ci.json` is generated at CI time and must not be committed: confirmed in `pa11y.json` comments and the CI workflow.
- The `pa11y.json` `ignore` array is currently empty: confirmed in `pa11y.json` line 16.
- `#game-announcer` exists in `index.html` line 13 as an `aria-live="polite"` `aria-atomic="false"` element.
- The ten events listed for the live-region spot-check (game load, title screen display, level start, life lost, power-up collected, level complete, game over, boss intro, pause open, pause resume) correspond to actual `announce()` calls in `game.js`.
- The reduced-motion gate reads `window.matchMedia('(prefers-reduced-motion: reduce)')` in `game.js` lines 663-664, caps scroll speed at `REDUCED_SCROLL_SPEED` (line 735), and clears particles (line 679).
- The font directory is `fonts/` and contains only local WOFF2 files (PressStart2P). No request to `fonts.googleapis.com` or `fonts.gstatic.com` is made by `index.html`.
- Heading structure: one H1 (`# Accessibility Regression Suite: James Nerf Squad`), then H2s in sequence (`## Status`, `## Purpose`, `## Automated tools`, `## Manual checks`, `## How to run the full suite`, `## Pass criteria for a sprint`, `## Adding a new check`, `## Recording exceptions and deferred findings`), then H3s only inside `## Automated tools`. No skipped levels.
- Abbreviations expanded on first use: ARIA (Accessible Rich Internet Applications), WCAG (Web Content Accessibility Guidelines), CI (Continuous Integration), HUD (Heads-Up Display) — all expanded at first use in their respective sections.
- The document correctly notes that the game canvas content cannot be tested by automated tools and is covered by the manual checks.

## Verdict

Conditional pass.

The document requires three corrections before commit:

1. Tad must add a citation to `docs/writing-style.md` naming the rule applied. This is a rework flag routed through Sonja.
2. The Pa11y local run `--config` path must be changed from the absolute machine path to `../../pa11y.json` (relative to `.github/accessibility-tools/`).
3. Manual check 4 must be rewritten to avoid listing hex codes that legitimately remain in non-text uses, replacing them with a description of the visual elements the tester should inspect.

Findings 2 and 3 can be addressed by Tad in the same rework pass as Finding 1.

## Re-check 2026-06-01

Reviewer: Carol
Scope: targeted re-check of three corrections made by Tad in response to the original review above.

### Finding 1 re-check — Citation to writing standards

Result: Fail.

The Purpose section (line 10 of the document) now reads:

"This document follows the plain-language and abbreviation standards in [the project coding standards](../coding-standards.md); the full writing style guide is defined in the global wiki."

The link to `../coding-standards.md` resolves correctly: `docs/coding-standards.md` exists in the project. The reference to "the global wiki" is accurate as a pointer. However, the citation does not name `docs/writing-style.md` by path, nor does it name a specific section of that file. The original finding required "a citation to `docs/writing-style.md` naming the line or section Tad applied." The current sentence does not meet that requirement. It cites the project coding standards and mentions the global wiki in general terms, but a reader cannot confirm which rule from `docs/writing-style.md` was applied, because neither the file nor a section within it is named.

The citation must name the file (the global wiki's `docs/writing-style.md`) and the specific section applied — for example, "Plain language, at roughly Flesch-Kincaid grade 9 or below" from the Structure and rhythm section, or the abbreviation-expansion rule from the same file, or whichever section Tad drew on. The current wording does not satisfy the gate.

Action: return to Sonja for re-dispatch to Tad. Tad must revise the citation to name `docs/writing-style.md` (the global wiki writing style file) and identify the specific section or rule applied.

### Finding 2 re-check — Pa11y absolute path

Result: Pass.

Both locations now use the relative path `--config ../../pa11y.json`.

- Section "Pa11y 9.1.1", run command (step 2 of the local run instructions): `node_modules/.bin/pa11y --standard WCAG2AAA --config ../../pa11y.json http://localhost:8080/index.html` — confirmed correct.
- Step 6 of "How to run the full suite": same command with `--config ../../pa11y.json` — confirmed correct.

No hardcoded absolute path remains in either location for the Pa11y `--config` flag.

### Finding 3 re-check — Manual check 4 rewrite

Result: Pass.

Manual check 4 now reads: "Colour contrast spot-check: open the game in a browser and confirm that readable text elements render legibly at adequate contrast: the HUD (Heads-Up Display) score and lives counter (white on black bar), the active blaster name (colour on black bar), the inactive title menu items (light grey on dark background), the boss health-bar name (light coral on dark background), and the game-over heading (light coral on dark background). If any text is hard to read against its background, flag it for a contrast measurement."

The check names the five visual elements required (HUD score/lives counter, active blaster name, inactive title menu items, boss health-bar name, game-over heading) and describes their visual appearance in plain language. No hex codes appear. The instruction is now a visual confirmation, not a colour-code audit, which resolves the false-failure risk identified in the original finding.

### Overall re-check verdict

Fail.

Two of the three corrections pass. Finding 1 remains open. The document cannot be committed until Tad adds a citation that names `docs/writing-style.md` (the global wiki writing style file, at `/Users/timdixon/Code/AgentTeam/docs/writing-style.md`) and identifies the specific section applied.

This is a second rework flag for Finding 1, routed through Sonja to Tad.

## Final check 2026-06-01

Reviewer: Carol
Scope: Finding 1 only — citation to `docs/writing-style.md` in the Purpose section.

Result: Pass.

The Purpose section (line 10 of the document) now reads: "This document follows the plain-language and abbreviation-expansion rules from the team's global writing style guide (`docs/writing-style.md` in the AgentTeam wiki), specifically the Structure and rhythm section's grade-9 readability standard and the abbreviations rule." This names `docs/writing-style.md` explicitly by path and identifies two specific items within it: the Structure and rhythm section's grade-9 readability standard, and the abbreviations rule. Both required elements are present. Finding 1 is cleared. The document is cleared for commit.
