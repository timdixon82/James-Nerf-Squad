# Jed Security Review: PR-16 feat/018-accessibility-sprint

Reviewer: Jed (security agent)
Date: 2026-06-01
Branch: feat/018-accessibility-sprint
PR: #16

## Verdict summary

| Area | Verdict | Notes |
|---|---|---|
| 1. Narration un-muting (speech.js) | Pass | Removal is correct and complete |
| 2. Speech API error handling | Finding — needs fix | No try/catch around speechSynthesis calls |
| 3. Fetch call for VERSION (main.js) | Pass | No injection risk; failure handled |
| 4. Self-hosted font (fonts/) | Pass | Files are legitimate WOFF2; no CSP regression |
| 5. Colour contrast changes | Pass | No security or privacy concern |
| 6. OWASP Top 10 scan of changed files | Pass with one advisory | See section 6 |

Overall: one finding requires a fix before merge. All others are clean.

## 1. Web Speech API narration un-muting

Jacob flagged that `speech.js` previously suppressed all narration when reduced motion was active (`if (reducedMotionActive) return` at the old line 42). That guard has been removed in this PR.

Review result:

- The removal is correct and complete. The `narrate()` function no longer checks a reduced-motion flag. Reduced-motion users now receive all audio announcements, which is the right outcome now that the game is fully playable under reduced motion.
- `setReducedMotion()` still calls `window.speechSynthesis.cancel()` and clears `pending` when the value passed is truthy. That is the right behaviour: clearing mid-transition chatter on toggle without silencing future narration.
- The `supported` gate (`!!window.speechSynthesis`) remains in place on both `narrate()` and `setReducedMotion()`, so calling either in a browser that lacks the API is a safe no-op.
- Verdict: Pass.

## 2. Speech API error handling

Finding — severity: Medium — OWASP A05 Security Misconfiguration (missing graceful-degradation wrapper).

The brief requires: "Wrap all speechSynthesis calls in a try/catch so they degrade gracefully where the API is absent or blocked by browser policy."

The current implementation relies solely on the `supported` boolean check at module initialisation. That check is performed once with `typeof window !== 'undefined' && !!window.speechSynthesis`. It does not catch runtime errors that the Speech API can throw after initialisation, for example:

- `window.speechSynthesis.speak()` throws a `NotAllowedError` (DOMException) in Chrome when called before a user gesture has been received.
- `window.speechSynthesis.cancel()` can throw in some WebKit builds when the utterance queue is in a transitional state.

Affected code in `js/speech.js`:

- `_speak()` — calls `window.speechSynthesis.speak(utt)` at line 39 with no surrounding try/catch.
- `narrate()` — calls `window.speechSynthesis.cancel()` at line 47 and `_speak()` at lines 48 and 54 with no surrounding try/catch.
- `setReducedMotion()` — calls `window.speechSynthesis.cancel()` at line 65 with no surrounding try/catch.

The `utt.onend` callback at line 34 also calls `_speak(next)` without a guard.

These calls will throw uncaught DOMExceptions in production browsers when the user has not interacted with the page before the first narration fires (the initial "James' Nerf Squad. Press Enter or Space to start." call in `game.js` line 686). The page-load announcement is the specific path where a NotAllowedError is most likely, because `game.js` calls `Speech.narrate()` immediately inside `start()`, which runs before any user input.

Recommended fix: wrap the body of `_speak()` in try/catch, and wrap `cancel()` calls in try/catch. Example for `_speak()`:

```javascript
function _speak(msg) {
  if (!supported) return;
  try {
    var utt = new SpeechSynthesisUtterance(msg);
    utt.rate  = 1.0;
    utt.pitch = 1.0;
    utt.onend = function() {
      if (pending) {
        var next = pending;
        pending = null;
        _speak(next);
      }
    };
    window.speechSynthesis.speak(utt);
  } catch (e) { /* Speech API unavailable or blocked — fail silently */ }
}
```

The `cancel()` calls in `narrate()` and `setReducedMotion()` should also be individually wrapped or extracted into a safe helper.

Note: this is a brief requirement (R-01: "Wrap all speechSynthesis calls in a try/catch") that was not implemented by Sean. It is not a theoretical risk. The game-load path triggers narration before any user gesture is possible, which is the exact scenario where Chrome throws NotAllowedError.

## 3. Fetch call for VERSION (main.js)

The fetch is in `js/main.js`:

```javascript
window._gameVersion = '';
fetch('VERSION')
  .then(function(r) { return r.text(); })
  .then(function(v) { window._gameVersion = v.trim(); })
  .catch(function() { /* version display is non-critical; fail silently */ });
```

The version string is consumed in `js/screens.js` line 292:

```javascript
var ver = window._gameVersion ? 'v' + window._gameVersion : '';
if (ver) px(ctx, ver, panX + panW - 6, panY + panH - 5, 4, '#888', 'right');
```

`px()` calls `ctx.fillText()` in `js/utils.js` line 35. Canvas `fillText()` renders the string as literal text pixels. It does not parse HTML, execute script, or interpret markup. There is no XSS vector here. Even a maliciously crafted `VERSION` file containing `<script>alert(1)</script>` would be painted on the canvas as visible characters and would have no effect on the DOM.

Network failure is caught by the `.catch()` handler. A 404 will resolve with response text of the 404 page body, which `v.trim()` will assign. The version string would then be whatever the server returns. Because that string is only ever passed to `fillText()`, there is no injection consequence. The worst outcome is a garbled version display. Acceptable risk.

`window._gameVersion` as a storage mechanism: the global property is set once on page load and read only at render time. It is not written to any storage, sent to any endpoint, or evaluated. No concern.

Verdict: Pass.

## 4. Self-hosted font

File type verification (using the `file` command on the three representative files):

- `PressStart2P-latin.woff2`: Web Open Font Format (Version 2), TrueType, length 4704, version 1.0
- `PressStart2P-greek.woff2`: Web Open Font Format (Version 2), TrueType, length 2408, version 1.0
- `PressStart2P-cyrillic.woff2`: Web Open Font Format (Version 2), TrueType, length 2656, version 1.0

All five files are confirmed legitimate WOFF2 binary files at sizes consistent with subset font files for an icon-style typeface (2.4 KB to 4.7 KB). No executable content.

CSP regression check: `index.html` on the feature branch contains no `<meta http-equiv="Content-Security-Policy">` tag. This is consistent with Jacob's observation in the architecture review (section 1, point 5) that there was never a CSP meta tag in this project. The brief's step 4 ("remove the CSP entries") had nothing to remove. No CSP was accidentally added or left incomplete. Confirmed.

Verdict: Pass.

## 5. Colour contrast changes

The colour changes are: hex value substitutions in `js/constants.js`, `js/screens.js`, and `js/hud.js`. All values are string literals passed to `ctx.fillStyle` or to the `px()` helper's colour parameter. None are evaluated, interpolated into HTML, or sent to any external endpoint. There is no security or privacy concern in colour constant changes.

Verdict: Pass.

## 6. General OWASP Top 10 scan of changed files

Files reviewed: `js/constants.js`, `js/particles.js`, `js/game.js`, `js/screens.js`, `js/speech.js`, `js/announcer.js`, `js/hud.js`, `js/main.js`, `css/style.css`, `index.html`.

Checks performed:

- `eval()`: not present in any changed file.
- `innerHTML` assignment: not present in any changed file. `announcer.js` uses `el.textContent = msg`, which is safe — `textContent` does not parse HTML and cannot introduce XSS.
- `new fetch()` without error handling: one instance in `main.js`, reviewed in section 3 above. Failure is caught. No new fetch calls elsewhere.
- `localStorage` or `sessionStorage` write without sanitisation: the `persistence.setItem` call in `game.js` is pre-existing, not introduced by this PR. The changed files do not introduce new storage writes.
- Script injection via `src=`: `index.html` changes only reorder existing `<script src="...">` tags. No new external script sources. No `integrity` attributes were added (subresource integrity was not present before and is not a requirement of this sprint).
- `document.write`: not present.
- Prototype pollution: no `Object.assign` or similar with untrusted input in changed code.

Advisory (low, not a blocker): the inline error handler in `index.html` (the `window.addEventListener('error', ...)` block at lines 16-23) renders `e.message` and `e.filename` via `ctx.fillText()`. These values come from the browser's error event and are not attacker-controlled in any realistic threat model for a client-side game. Canvas `fillText()` is not an injection sink. This is pre-existing code untouched by the PR and noted only for completeness.

Verdict: Pass with advisory noted above.

## OWASP Top 10 mapping for this PR

| OWASP category | Applicable? | Defence in place |
|---|---|---|
| A01 Broken Access Control | No — client-side game, no access control surface | Not applicable |
| A02 Cryptographic Failures | No — no cryptography in changed code | Not applicable |
| A03 Injection | Partial — fetch result rendered via fillText | fillText is not an HTML sink; no injection possible |
| A04 Insecure Design | Partial — Speech API calls without try/catch | Finding in section 2; fix required |
| A05 Security Misconfiguration | Partial — no CSP in place | No CSP existed before and none was removed; noted but out of scope for this sprint |
| A06 Vulnerable Components | No — font files are static binary assets | Files verified as legitimate WOFF2 |
| A07 Auth Failures | No | Not applicable |
| A08 Software Integrity | Partial — self-hosted font from Google Fonts | Files are correct type and size; no executable content |
| A09 Logging Failures | No | Not applicable |
| A10 SSRF | No — fetch target is a static relative path | No host is attacker-controlled |

## UK GDPR

This PR introduces no personal data processing. The `fetch('VERSION')` call is a same-origin request for a static file. The Speech API voices content that is generated by the game, not provided by the user. No new data collection, no new data transmission to third parties (the Google Fonts import was removed, reducing external data exposure). No UK GDPR concerns arise from this PR.

## Sign-off

One finding requires a fix before merge:

- Finding 2 (Speech API try/catch): wrap `_speak()` and the `cancel()` calls in `speech.js` in try/catch blocks as required by the brief (R-01). This is a missing graceful-degradation requirement, not a theoretical risk. The page-load narration path will throw in Chrome before user interaction.

All other areas reviewed in sections 1, 3, 4, 5, and 6 are clean.

When Finding 2 is fixed, this PR is cleared for Carol's test pass.

Jed, 2026-06-01
