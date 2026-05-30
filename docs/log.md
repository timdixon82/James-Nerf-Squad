# Project Wiki: Operations Log: James Nerf Squad

This log is chronological and append-only. It is never edited. Each entry starts with a heading in the form `## [YYYY-MM-DD] <operation> | <subject>`.

## [2026-05-23] ingest | Architecture and security backfill

Jacob produced the architecture review and nine ADRs (work folder 017). Jed produced the security review and OWASP mapping. Carol produced a baseline accessibility audit. The code existed in the working tree but was not yet committed to the repository.

## [2026-05-30] onboarding | Template alignment

Project onboarded onto the agent team template via `chore/template-onboarding`. Files added: CLAUDE.md, .editorconfig, VERSION (1.0.0), release-please-config.json, .release-please-manifest.json, package.json with HTMLHint and ESLint, eslint.config.js, .htmlhintrc, all six GitHub Actions workflows (accessibility, CI, CodeQL, deploy, release, security), .github/accessibility-tools/, .github/dependabot.yml, .github/pull_request_template.md, and this docs/ wiki skeleton. .gitignore replaced with the team template version. pa11y.json updated with documentation comment block. Nine ADRs transcribed from Jacob's backfill review into docs/decisions/. Security review transcribed from Jed's backfill review.
