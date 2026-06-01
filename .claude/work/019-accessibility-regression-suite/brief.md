# Brief: 019-accessibility-regression-suite

## Summary

Create `docs/patterns/accessibility-regression-suite.md` for James Nerf Squad. The file was flagged as missing by Sean during sprint 018 and confirmed by Carol. Carol needs it to run automated regression checks in future sprints.

- Status: active
- Branch: chore/019-accessibility-regression-suite
- Priority: 2
- Blockers: None

## Requirements

Write a pattern document that records:
- Which automated tools are configured for this project and how to run each one.
- What a passing result looks like for each tool.
- The manual checks that must accompany each automated pass (keyboard-only navigation, reduced-motion gate, live-region spot-check).
- How to add a new check to the suite.
- How to record a deferred finding as an exception in `docs/exceptions/`.

The document must follow the team's wiki pattern format: Status block, Purpose, Tools, How to run, Pass criteria, Adding a check, Recording exceptions.

## Out of scope

- Changes to the CI pipeline.
- New automated tooling not already installed.
- Screen-reader evidence files (suspended per team accessibility gate).

## Risk and rollback

Documentation only. No code changes. Rollback: revert the commit.

## Definition of done

- [ ] `docs/patterns/accessibility-regression-suite.md` written and committed to main.
- [ ] Carol confirms the document is accurate and complete for this project.

## Approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than the main branch
- [x] Open a pull request
- [x] Comment on a pull request or an issue
- [x] Create an issue

## Not pre-approved

- Merging to the main branch. Always needs Tim's express approval.
