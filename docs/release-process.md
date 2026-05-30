# Release process: James Nerf Squad

This document records the release process for James Nerf Squad.

## Branching model

`main` is the production branch and deploys automatically to GitHub Pages on every push. Feature work happens on short-lived branches (for example `feat/`, `fix/`, `chore/`). No long-lived development branches.

## Pull-request flow

1. Open a pull request from a feature branch to `main`.
2. CI checks pass: HTML lint (HTMLHint), JavaScript lint (ESLint), accessibility (Pa11y and axe-core at WCAG 2.2 AAA), security (Semgrep, Trivy, dependency review), and CodeQL.
3. Carol signs off functional, accessibility, and visual testing.
4. Sonja reviews for architecture and security conformance.
5. Tim gives express approval to merge.
6. Sonja merges.

## Merge gate

All of the following must hold before Sonja merges:

- All required CI checks pass.
- Carol has signed off.
- The architecture-and-security conformance check has passed.
- Tim has given express approval at the time of merge.

## Release steps

release-please automates changelog and version management. On every push to `main`, the release workflow creates or updates a release pull request with an updated `CHANGELOG.md` and `VERSION` bump. When Tim approves and Sonja merges that release pull request, GitHub releases a tagged version.

Deployment to GitHub Pages is automatic: the deploy workflow fires on every push to `main` and assembles the unbundled static site into `_site/` for upload.
