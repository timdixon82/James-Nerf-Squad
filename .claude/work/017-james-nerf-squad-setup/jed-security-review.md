# Security and Code-Review Backfill: James Nerf Squad

## Metadata

- Date: 2026-05-23
- Reviewer: Jed (security and code-review agent)
- Scope: Full project backfill. Files read: `index.html`, `css/style.css`, all fifteen `js/` modules.
- Status: Active, files in working tree, not yet committed.

---

## Part 1: Security Review

### Severity summary

| Severity | Count |
|----------|-------|
| High | 0 |
| Medium | 2 |
| Low / informational | 3 |

---

### Finding 1: Missing security response headers (Medium)

OWASP category: A05 Security Misconfiguration.

`index.html` carries no Content Security Policy (CSP), no `X-Content-Type-Options`, no `Referrer-Policy`, no `X-Frame-Options`, and no `Permissions-Policy`. GitHub Pages does not allow server-set headers, so these must appear as `<meta>` tags where the CSP meta element permits them, or be accepted as a standing exception.

The team's standing GitHub Pages security-header exception covers this posture. The exception must be linked from the project wiki at `docs/exceptions/`.

Recommended fix: Sean adds the CSP and Referrer-Policy `<meta>` tags in `index.html` as part of the setup branch. The remaining headers (Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Permissions-Policy) cannot be set via `<meta>` and must be recorded in the project wiki as a GitHub Pages exception, mirroring the standing exception at `docs/exceptions/github-pages-security-headers.md`.

A meaningful CSP for this project:

```
default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; object-src 'none'; base-uri 'self'
```

---

### Finding 2: Unpinned external font dependency (Medium)

OWASP category: A08 Software and Data Integrity Failures.

`css/style.css` line 7:

```css
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");
```

This loads a font from Google Fonts at runtime without a subresource integrity hash. If the Google CDN were compromised, a malicious stylesheet or font could be substituted. The game renders all text on a canvas so font substitution would affect visual fidelity rather than data exfiltration, but the supply-chain risk is real.

The practical options are: (a) self-host the font, which removes the external request and enables offline play; or (b) keep the Google Fonts import and accept the risk, documented as a project exception.

Option (a) is preferred. The Press Start 2P WOFF2 file is approximately 50 KB.

---

### Finding 3: Error handler exposes internal file paths (Low/Informational)

OWASP category: A05 Security Misconfiguration (information disclosure).

`index.html` lines 14 to 23 render JS errors, including `e.filename` and `e.lineno`, directly onto the canvas. On a production GitHub Pages deployment this reveals the file path structure to anyone who triggers a runtime error.

This is low severity because the project is open source and the file layout is already in the README. The handler should be removed or guarded to fire only when `window.location.protocol === 'file:'` or when a debug flag is set.

---

### Finding 4: DOM manipulation survey — clean

A survey of all fifteen modules found no use of innerHTML assignment, no use of the deprecated DOM write API, no eval, no Function constructor calls, and no setTimeout with a string argument. OWASP A03 Injection risk is negligible for a game with no user-supplied content rendered into the DOM.

---

### Finding 5: Persistence shim and save data

`utils.js` lines 96 to 101 expose a `persistence` shim that defers to `window.persistentStorage`. The shim silently no-ops when the API is absent. Save data contains key bindings, appearance colours, high scores, and completed-level flags. No personal data is stored. No UK GDPR concern arises.

---

### OWASP Top 10 mapping

| Category | Defence in place | Gap |
|----------|------------------|-----|
| A01 Broken Access Control | No server, no accounts. No applicable risk. | None. |
| A02 Cryptographic Failures | No personal or sensitive data. No applicable risk. | None. |
| A03 Injection | No DOM string interpolation, no eval, no dynamic script. | None. |
| A04 Insecure Design | Pure client-side game. No server attack surface. | None. |
| A05 Security Misconfiguration | No security headers; internal error disclosure on canvas. | CSP and Referrer-Policy meta tags needed. Error handler should be guarded. |
| A06 Vulnerable Components | One external CDN (Google Fonts). No npm deps. | Pin or self-host the font. |
| A07 Authentication Failures | No accounts. No applicable risk. | None. |
| A08 Software and Data Integrity | Unpinned Google Fonts import. | Self-host font or accept exception. |
| A09 Security Logging | No server, no logs. | None. |
| A10 SSRF | Pure client-side. No applicable risk. | None. |

---

### UK GDPR posture

The game has no accounts, no analytics, no contact forms, and no server. It stores no personal data. The only network request is the Google Fonts CSS import, which sends the user's IP address to Google's servers. This is a standard web-platform privacy consideration but is outside the scope of UK GDPR obligations on the project operator, provided no additional analytics or tracking are added.

Assessment: no UK GDPR obligations apply to the current codebase. If GoatCounter analytics are added (as planned in the setup branch), the privacy posture must be reviewed at that point.

---

## Part 2: Keys-Sticking Diagnosis

### Architecture summary

Input flows through a single IIFE module (`js/input.js`). The `held` map is keyed on `event.key` strings. `Game._bindEvents()` in `js/game.js` attaches `keydown` and `keyup` listeners to `window`.

### Root causes, ranked by likelihood

#### Root cause 1 (most likely): Focus loss leaves the held map populated

`js/game.js` lines 140 to 162 attach `keydown` and `keyup` listeners to `window`. There is no listener for `window` blur or `document` visibilitychange anywhere in the fifteen modules.

When a player holds a key and then alt-tabs, switches browser tabs, or clicks DevTools, the browser fires `keyup` only on the document that currently has focus. Because focus has left the game, the keyup is never received. The `held` map retains the entry as `true`, and the character continues moving when the window regains focus.

This is the most common cause of the "key sticking" symptom in canvas games.

Specific location: `js/game.js` `_bindEvents` method, lines 136 to 218. No blur or visibilitychange handler is present anywhere in any module.

Proposed fix: add inside `_bindEvents`, alongside the existing listeners:

```js
window.addEventListener('blur', function() {
  // Clear all held keys on focus loss. Without this, any key held at
  // the moment of blur never receives keyup and the character keeps
  // moving after the window regains focus.
  var h = Input.held;
  for (var k in h) h[k] = false;
  Input.state.left  = false;
  Input.state.right = false;
  Input.state.jump  = false;
  Input.state.shoot = false;
});

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    var h = Input.held;
    for (var k in h) h[k] = false;
    Input.state.left  = false;
    Input.state.right = false;
    Input.state.jump  = false;
    Input.state.shoot = false;
  }
});
```

Alternatively, expose a `clearAll()` method on the `Input` IIFE and call it from both handlers.

---

#### Root cause 2 (secondary): Shift key causes case mismatch in the held map

`js/input.js` line 9: the `held` map is keyed on `event.key` values verbatim.

When a player presses `a` and then Shift, the browser fires keydown for Shift. If the player releases `a` while Shift is still held, the keyup event fires with `e.key = 'A'` (capital), not `'a'`. The function at line 51 sets `held['A'] = false` but leaves `held['a'] = true`. Then `pollMovement` at line 36 evaluates:

```js
state.left = !!(held[bindings.left] || held['a'] || held['A']);
```

It sees `held['a']` as true and concludes the left key is still held, even though the player released it.

Proposed fix: in `onKeyUp` (`js/input.js` lines 51 to 57), add lowercase and uppercase clearing:

```js
function onKeyUp(key) {
  held[key] = false;
  // Clear both cases to handle Shift-modified keyup values.
  held[key.toLowerCase()] = false;
  held[key.toUpperCase()] = false;
  if (key === bindings.left  || key === 'a' || key === 'A') state.left  = false;
  if (key === bindings.right || key === 'd' || key === 'D') state.right = false;
  if (key === bindings.jump  || key === 'w' || key === 'W') state.jump  = false;
  if (key === bindings.shoot)                               state.shoot = false;
}
```

---

#### Root cause 3 (minor, not a factor): preventDefault on keydown

The brief mentioned `preventDefault` swallowing keyup as a candidate. `js/game.js` lines 150 to 153 call `e.preventDefault()` on keydown for game keys but do not call it on keyup. `preventDefault` on keydown does not suppress the paired keyup event. Root cause 3 is not contributing to the symptom.

---

#### Root cause 4 (touch, unlikely): touchend gap

`js/game.js` lines 171 to 188 process touchend by reading `e.touches` (remaining active touches) and comparing against button regions. If two fingers lift simultaneously, the loop sets `btn.pressed = false` for uncovered buttons and calls `Input.onTouchUp`. `touchcancel` is mapped to the same handler at line 211. This path is correct and is unlikely to cause sticking.

---

### Recommended action for Sean

Fix root cause 1 first. Add blur and visibilitychange listeners inside `_bindEvents` in `js/game.js`. Fix root cause 2 in the same commit by adding the case-clearing lines to `onKeyUp` in `js/input.js`.

The two files to change are:

- `/js/game.js`: add blur and visibilitychange listeners inside `_bindEvents`, after line 218.
- `/js/input.js`: update `onKeyUp` (lines 51 to 57) to clear both cases of the key in the `held` map, or add a `clearAll` method to the IIFE's return object.

---

## Open questions

Q67. The Google Fonts import sends the user's IP to Google on every page load. The brief plans to add self-hosted GoatCounter analytics. For a children's-adjacent game, should the team self-host the Press Start 2P font to eliminate the Google dependency entirely, or keep the Google Fonts import and document the privacy posture as acceptable?

Options:
- A: Self-host the font. Removes Google CDN dependency, improves offline play, gives a cleaner CSP. Recommended.
- B: Keep the Google Fonts import and document the posture in the project wiki.

Q68. The inline error handler in `index.html` renders JS errors including file paths onto the canvas on production. Should it be removed, or guarded to fire only on file:// origins?

Options:
- A: Remove the error handler entirely and rely on the browser console.
- B: Guard it so it fires only when `window.location.protocol === 'file:'`. Recommended.
- C: Keep it as-is (lowest effort, minor information disclosure on Pages).

---

## Wiki note

The standing GitHub Pages security-header exception at `docs/exceptions/github-pages-security-headers.md` in the global wiki applies to this project. A pointer should be added to the project wiki once it is scaffolded.
