# Brief: 017-james-nerf-squad-setup

## Summary

Adopt the `timdixon82/James-Nerf-Squad` repository. **Status: active.** The repository was empty when this work folder opened in the morning; by mid-afternoon Tim had added roughly 2,700 lines of game code across a single `index.html`, a `css/style.css`, fifteen JavaScript modules in `js/`, and an expanded `README.md`. The files are in the working tree but not yet committed.

The game is a side-scrolling pixel-art action game built in vanilla HTML, CSS, and JavaScript with no build tools. Canvas-based render. Input is keyboard-driven with touch support. Modular code: `constants.js`, `utils.js`, `input.js`, `sound.js`, `music.js`, `particles.js`, `icons.js`, `player.js`, `enemy.js`, `boss.js`, `hud.js`, `screens.js`, `touch.js`, `game.js`, `main.js`.

Tim has reported a behavioural bug: **keys appear to be sticking**. Sean investigates after the backfill identifies the architecture; the likely places are `js/input.js` (held-map update, keydown/keyup pair, modifier-key handling, focus loss) and `js/touch.js` (touch buttons write into the same input state).

- Status: done
- Branch: none
- Priority: 7
- Blockers: None

## Requirements

No formal requirements existed when the work folder opened. Tad reverse-engineers requirements from the README and source during the backfill.

## Routing plan

1. Sonja opens this work folder and confirms the repository state (completed).
2. **Four-agent backfill** in parallel: Tad (business analysis), Jacob (architecture), Jed (security and code review), Carol (baseline WCAG 2.2 AAA audit). Each writes to this work folder. **Keys-sticking bug** noted to every agent so they can corroborate from their own angle (Jacob: input state machine; Jed: key-event handling correctness; Carol: keyboard-only operability).
3. Sonja consolidates findings and puts any open questions to Tim.
4. Sean creates `chore/project-setup` from `main`, commits the game code as a feature commit, then applies the team's standard setup-build items (VERSION, expanded README review, CSP and Referrer-Policy meta tags, self-hosted GoatCounter at the team default `timdixon82.goatcounter.com`, pinned linter manifest, five workflow files, release-please configuration, .gitignore). **Sean also diagnoses and fixes the keys-sticking bug** as part of the same branch.
5. Carol tests (functional pass, accessibility pass including the canvas-game posture, theme validation per the new standing rule if a theme exists, release checklist).
6. Sonja runs the architecture-and-security conformance check and the merge gate, and presents to Tim. Sean opens the pull request; Sonja merges only on Tim's express approval.

## Out of scope

- Game-design changes (level changes, mechanic changes, balance changes, art changes). The setup adopts what is there.
- Migration to a build tool. Vanilla JS, no build, is the project's deliberate posture per the README.
- Multiplayer or networking.
- Adding new assets (audio files, sprite sheets).

## Risk and rollback

Risk: the keys-sticking fix introduces a regression in input handling (lost keypresses or extra keypresses).

Rollback: every change goes on `chore/project-setup`. Sonja merges only on Tim's express approval. If a regression appears after merge, revert the merge commit; main is otherwise untouched.

## Definition of done

- [ ] Four-agent backfill complete and recorded in this work folder.
- [ ] Project wiki scaffolded under `docs/` with the team's standard layout.
- [ ] Standing GitHub Pages security-header exception pointer in place.
- [ ] VERSION file, expanded README, CSP meta tag, self-hosted GoatCounter using the team default site.
- [ ] Pinned linter manifest with all three linters exit 0.
- [ ] Five workflow files passing `actionlint`.
- [ ] The keys-sticking bug is reproduced, diagnosed, fixed, and the fix verified.
- [ ] Canvas-game accessibility posture recorded in `docs/accessibility.md` and `todo.md`, in the same shape as Poop-Breakout (Q61 et seq).
- [ ] Carol's test pass and release checklist complete.
- [ ] Pull request opened and the merge gate passes.

## Approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than the main branch
- [x] Open a pull request
- [ ] Comment on a pull request or an issue
- [ ] Create an issue

## Not pre-approved

- Merging to the main branch. This always needs Tim's express approval at the time.
- Publishing to a blog or a social media account.

## Never allowed

The hard deny-list from `CLAUDE.md`.
