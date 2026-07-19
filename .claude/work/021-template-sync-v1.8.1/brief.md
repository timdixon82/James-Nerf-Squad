# Brief: 021-template-sync-v1.8.1

## Summary

Pull request #36, `chore/sync-template-v1.8.1`, brings this project onto agent-team template v1.8.1. It has since fallen out of sync with `main` and now conflicts in six GitHub Actions workflow files. This work resolves those conflicts so the sync can merge cleanly, while keeping this project's own workflow customisations.

Preamble fields:

- Status: `done`
- Branch: `main` (merged, commit `e5d1287`)
- Mockup mode: (not applicable, no user interface change)
- Priority: 1
- Blockers: None

## Requirements

No new product requirement. The requirement is mechanical: reconcile the template's incoming changes with this project's own changes to the same files, keeping both sets of intent. The conflicting files, from a merge-tree preview taken 2026-07-18:

- `.github/workflows/accessibility.yml` — template side adds an `axe-core` render-settle-delay comment block and a "Check the CI archetype" step (browser-extension detection, mirroring `ci.yml`). Project side (`main`) has its own accessibility.yml changes since the last sync.
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/lint.yml`
- `.github/workflows/security.yml`

Non-conflicting parts of the sync merge cleanly already, including:
- `.claude/agents/sonja.md` — adds a "Local clone paths for dispatches" section (global CORE change, already decided at team-root level).
- `.claude/template-version` — bumps 1.6.3 to 1.8.1.
- `.github/accessibility-tools/package.json` and `package-lock.json` — bumps `adm-zip` from 0.5.17 to 0.6.0 with an explicit override. This is expected to close the open Dependabot alert #4 (adm-zip, high severity, 4GB memory allocation via crafted ZIP), which is on this session's list to handle next. Confirm this after resolving conflicts.

## Routing plan

Sean resolves the six workflow-file conflicts on the existing branch `chore/sync-template-v1.8.1`, preserving both the template's incoming behaviour and this project's own recent changes to each file. Because the change touches CI, CodeQL, and security workflows, Jacob (architecture) and Jed (security) review the resolved files in parallel before Carol tests. Carol then runs functional and accessibility checks in parallel and confirms the adm-zip Dependabot alert is closed by the version bump. Sonja reviews and brings the pull request to Tim for the merge decision.

## Out of scope

- Any change to workflow logic beyond what is needed to reconcile the two sides of each conflict. No new CI steps are to be invented in this work.
- Resolving Dependabot alert #4 itself as a separate fix — this work only confirms whether the sync's existing adm-zip bump already closes it. If it does not, that becomes separate follow-up work.
- The other two items still queued this session: Dependabot PR #35 (eslint bump) and the failed Dependabot update job in `/.github/accessibility-tools`. Both are handled after this work folder, not inside it.
- Any change to `.claude/agents/sonja.md` beyond accepting the incoming merge — that section was already agreed at team-root level.

## Risk and rollback

Risk: a mis-resolved workflow conflict could silently drop one side's logic (for example, losing the project's own CodeQL or security scanning step, or losing the template's browser-extension detection), weakening CI or security coverage without an obvious failure.

Rollback: the branch is not merged until Tim approves. If a resolution is wrong, Sean corrects it on the same branch and pushes again; if already merged, revert the merge commit on `main`.

## Definition of done

- [ ] All six conflicting workflow files resolved with both sides' intent preserved (verified line by line against the pre-conflict `main` and template versions).
- [ ] Branch `chore/sync-template-v1.8.1` pushed with conflicts resolved and mergeable with `main`.
- [ ] Jacob confirms no architectural regression in the resolved CI/CD workflows.
- [ ] Jed confirms no security regression in the resolved CodeQL and security workflows.
- [ ] Carol's functional and accessibility checks pass on the branch.
- [ ] Confirmed whether the adm-zip version bump in this sync closes Dependabot alert #4.
- [ ] All required CI checks (CI, Security, Accessibility, Lint) pass on pull request #36.

## Approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than the main branch
- [x] Open a pull request
- [x] Comment on a pull request or an issue
- [x] Create an issue

## Not pre-approved

- Merging to the main branch. This always needs Tim's express approval at the time.
- Publishing to a blog or a social media account.

## Never allowed

The hard deny-list from `CLAUDE.md`: force-push, branch deletion, history rewrite, repository deletion, repository visibility change, branch-protection edits, collaborator changes, release deletion, and disabling secret or code scanning.
