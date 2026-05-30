# Code Review and Penetration Test: James Nerf Squad

Reviewer: Jed (penetration tester and code reviewer)
Date: 2026-05-23
Branch reviewed: working tree (code not yet committed at time of review)
Scope: OWASP Top 10 mapping, front-end security practice, keys-sticking input diagnosis

## Scope and method

Manual review of all project files: `index.html`, `css/style.css`, and fifteen JavaScript modules in `js/`. No automated scanners were run at review time (no workflow existed). The security workflow added during template onboarding (2026-05-30) now covers Semgrep, Trivy, and dependency review on every pull request.

## Confirmed absences (no finding)

- No external scripts, stylesheets, or fonts loaded without Subresource Integrity — except the Google Fonts import in `css/style.css` (see Finding 2 in `security-review.md`).
- No use of `eval`, `Function` constructor, `outerHTML`, or `insertAdjacentHTML`.
- No hard-coded secrets, API keys, tokens, or passwords.
- No mixed content (HTTP resources on an HTTPS page).
- No unvalidated URL parameters or Web Storage reads.
- No external links missing `rel="noopener noreferrer"`.
- No `innerHTML` assignment in any of the fifteen modules.

## Findings summary

See `security-review.md` for the full findings. In brief:

- Finding 1 (Medium): no CSP or security header meta tags in `index.html`.
- Finding 2 (Medium): unpinned Google Fonts import in `css/style.css`.
- Finding 3 (Low): error handler on canvas reveals file paths in production.
- Findings 4 and 5: informational, no action required.

## Keys-sticking input review

The review included a detailed diagnosis of the keys-sticking bug reported by Tim. Root causes and recommended fixes are summarised here; the canonical record is in Jacob's architecture review (work folder 017, `jacob-architecture-review.md`) and in ADR 005.

### Root cause 1 (most likely): focus-loss leaves the held map populated

`js/game.js` has no listener for `window` blur or `document` visibilitychange. When a player holds a key and alt-tabs or switches browser tabs, the `keyup` event is never received. The `held` map in `Input` retains the entry as `true`, and the character keeps moving after the window regains focus.

Fix: add `window.addEventListener('blur', clearAllInput)` and `document.addEventListener('visibilitychange', clearAllInput)` inside `_bindEvents` in `js/game.js`.

### Root cause 2 (secondary): Shift key causes case mismatch in the held map

`js/input.js` keys the `held` map on `event.key` verbatim. When `Shift` is held and a movement key is released, `event.key` is the uppercase letter. The `held` map entry for the lowercase letter is never cleared. `pollMovement` sees `held['a']` as `true` and concludes the left key is still held.

Fix: in `onKeyUp` in `js/input.js`, clear both `held[key.toLowerCase()]` and `held[key.toUpperCase()]` alongside `held[key]`.

### Root cause 3: `preventDefault` on keydown

`preventDefault` on keydown does not suppress the paired `keyup`. This is not a contributing cause of the keys-sticking symptom.

## Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 2 |
| Low | 1 |
| Informational | 2 |

Overall security posture: good for a static client-side game. No injection risks, no credential exposure, no server attack surface. Two medium findings require follow-up (CSP meta tags, self-host font). Keys-sticking bug is a UX defect with a clear fix.
