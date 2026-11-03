# Brief: 022-dependency-alerts

## Summary

Clear the one open Dependabot alert: minimatch (medium, development scope, GHSA-g3hv-75wg-m249, denial of service). The fix is only available in minimatch 11.0.1 or later. ESLint 10.x and glob 13 (used by htmlhint) depend on minimatch 10.x, so no update inside existing ranges can reach the fix. A targeted `npm update minimatch` only reached 10.2.6, which is still vulnerable. An `overrides` entry (`minimatch` set to `^11.0.1`) is therefore the last resort, and is used here. Development tools only; nothing ships to players.

Preamble fields:

- Status: `active`
- Branch: `fix/dependency-alerts`
- Priority: 2
- Blockers: None

## Out of scope

- Feature changes, other work folders, and workflows.
- The separate npm audit finding for glob (moderate, via htmlhint). It is not a Dependabot alert and its fix needs a breaking downgrade of htmlhint.

## Risk and rollback

Risk is low: minimatch is used only by lint tooling. Lint, tests and a clean `npm ci` pass with minimatch 11. Rollback: revert the pull request. Remove the override when ESLint and htmlhint depend on minimatch 11 themselves.

## Definition of done

- The minimatch alert closes after merge.
- `npm ci`, lint and tests pass.
- Pull request opened against main by Sean; merged only by Sonja with Tim's approval.
