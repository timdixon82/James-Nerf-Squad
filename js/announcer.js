
/**
 * announcer.js
 * WCAG 1.3.1, 4.1.3 — visually hidden live-region announcer.
 *
 * announce(msg) writes a message to the #game-announcer aria-live element.
 * A brief clear-then-set sequence forces re-announcement even when the same
 * string is sent twice in a row (e.g. retrying the same level).
 */

function announce(msg) {
  var el = document.getElementById('game-announcer');
  if (!el) return;
  // Clear first so that a repeated message triggers a fresh announcement.
  el.textContent = '';
  requestAnimationFrame(function() { el.textContent = msg; });
}
