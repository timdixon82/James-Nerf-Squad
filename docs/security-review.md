# Security Review: James Nerf Squad

Reviewer: Jed (penetration tester and code reviewer)
Date: 2026-05-23
Branch reviewed: working tree (code not yet committed at time of review)
Scope: full project backfill. Files read: `index.html`, `css/style.css`, all fifteen `js/` modules.

## Severity summary

| Severity | Count |
|---|---|
| High | 0 |
| Medium | 2 |
| Low or informational | 3 |

## Finding 1: Missing security response headers (Medium)

OWASP category: A05 Security Misconfiguration.

`index.html` carries no Content Security Policy (CSP), no `X-Content-Type-Options`, no `Referrer-Policy`, no `X-Frame-Options`, and no `Permissions-Policy`. GitHub Pages does not allow server-set headers, so these must appear as `<meta>` tags where the CSP meta element permits them, or be accepted as a standing exception.

The team's standing GitHub Pages security-header exception covers the headers that cannot be set via `<meta>`. The CSP and Referrer-Policy `<meta>` tags should be added to `index.html`.

Recommended CSP for this project:

```
default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; object-src 'none'; base-uri 'self'
```

Status: open. Sean to add CSP and Referrer-Policy meta tags in the next feature branch. Remaining headers recorded as a GitHub Pages exception in `docs/exceptions/`.

## Finding 2: Unpinned external font dependency (Medium)

OWASP category: A08 Software and Data Integrity Failures.

`css/style.css` line 7 loads the Press Start 2P font from Google Fonts at runtime without a Subresource Integrity hash. If the Google CDN were compromised, a malicious stylesheet or font could be substituted. The game renders text on a canvas, so font substitution affects visual fidelity rather than data exfiltration, but the supply-chain risk is present.

The preferred fix is to self-host the font (approximately 50 KB WOFF2). This also removes the Google CDN dependency, improves offline play, and simplifies the CSP. See open question from Jed's review and `docs/privacy.md`.

Status: open (Q from Jed's review: self-host or document as an exception).

## Finding 3: Error handler exposes internal file paths (Low or informational)

OWASP category: A05 Security Misconfiguration (information disclosure).

`index.html` lines 14 to 23 render JavaScript errors, including `e.filename` and `e.lineno`, directly onto the canvas. On a production GitHub Pages deployment this reveals the file path structure to anyone who triggers a runtime error.

Severity is low because the project is open source and the file layout is already in the README. The recommended fix is to guard the handler so it fires only when `window.location.protocol === 'file:'`, or to remove it and rely on the browser console.

See open question Q68 from Jed's review.

Status: open.

## Finding 4: DOM manipulation survey (informational, clean)

A survey of all fifteen modules found no use of `innerHTML` assignment, no use of deprecated DOM write APIs, no `eval`, no `Function` constructor calls, and no `setTimeout` with a string argument. OWASP A03 Injection risk is negligible for a game with no user-supplied content rendered into the DOM.

## Finding 5: Persistence shim and save data (informational)

`utils.js` lines 96 to 101 expose the `persistence` shim. Save data contains key bindings, appearance colours, high scores, and completed-level flags. No personal data is stored. No UK GDPR concern arises.

## OWASP Top 10 mapping

| Category | Defence in place | Gap |
|---|---|---|
| A01 Broken Access Control | No server, no accounts. No applicable risk. | None. |
| A02 Cryptographic Failures | No personal or sensitive data. No applicable risk. | None. |
| A03 Injection | No DOM string interpolation, no eval, no dynamic script. | None. |
| A04 Insecure Design | Pure client-side game. No server attack surface. | None. |
| A05 Security Misconfiguration | No security headers; internal error disclosure on canvas. | CSP and Referrer-Policy meta tags needed (Finding 1). Error handler should be guarded (Finding 3). |
| A06 Vulnerable Components | One external CDN (Google Fonts). No npm runtime deps. | Pin or self-host the font (Finding 2). |
| A07 Authentication Failures | No accounts. No applicable risk. | None. |
| A08 Software and Data Integrity | Unpinned Google Fonts import. | Self-host font or accept exception (Finding 2). |
| A09 Security Logging | No server, no logs. | None. |
| A10 SSRF | Pure client-side. No applicable risk. | None. |

## UK GDPR posture

The game has no accounts, no analytics, no contact forms, and no server. It stores no personal data. The only network request is the Google Fonts CSS import, which sends the user's IP address to Google's servers. No UK GDPR obligations apply to the current codebase. If GoatCounter analytics are added, the privacy posture must be reviewed at that point.

## Review metadata

Reviewer: Jed
Date: 2026-05-23
Files reviewed: index.html, css/style.css, js/announcer.js, js/boss.js, js/constants.js, js/enemy.js, js/game.js, js/hud.js, js/icons.js, js/input.js, js/main.js, js/music.js, js/particles.js, js/player.js, js/screens.js, js/sound.js, js/speech.js, js/touch.js, js/utils.js
Automated scanners: Semgrep and Trivy not run at time of backfill review (no workflow existed). Now covered by `security.yml`.
