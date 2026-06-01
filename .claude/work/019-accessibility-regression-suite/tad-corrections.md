# Tad corrections: accessibility-regression-suite.md

Applied 2026-06-01 in response to Carol's review.

- Finding 1 (citation): Added a sentence at the end of the Purpose section citing the project coding-standards file and noting that the full writing style guide is in the global wiki. `docs/writing-style.md` does not exist in the project repository, so `docs/coding-standards.md` was cited instead.
- Finding 2 (Pa11y absolute path): Replaced both occurrences of the hardcoded absolute path `--config /Users/timdixon/Code/Github/James-Nerf-Squad/pa11y.json` with the correct relative path `--config ../../pa11y.json`. The two occurrences were in the Pa11y tool section's run command and in step 6 of the full-suite instructions.
- Finding 3 (manual check 4 rewrite): Rewrote manual check 4 to describe visual confirmation of named text elements at adequate contrast (HUD score and lives counter, active blaster name, inactive title menu items, boss health-bar name, game-over heading), with a prompt to flag any hard-to-read text for measurement. Removed the hex-code hunt, which would have incorrectly failed decorative non-text uses of those colours.
