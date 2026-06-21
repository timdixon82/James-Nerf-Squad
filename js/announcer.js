
/**
 * announcer.js
 * WCAG 1.3.1, 4.1.3 — visually hidden live-region announcer.
 *
 * announce(msg) writes a message to the #game-announcer aria-live element.
 * A brief clear-then-set sequence forces re-announcement even when the same
 * string is sent twice in a row (e.g. retrying the same level).
 */

var _announceQueue = [];
var _announcing = false;

function _processQueue() {
  if (_announceQueue.length === 0) { _announcing = false; return; }
  _announcing = true;
  var msg = _announceQueue.shift();
  var el = document.getElementById('game-announcer');
  if (!el) { _processQueue(); return; }
  el.textContent = '';
  requestAnimationFrame(function() { el.textContent = msg; setTimeout(_processQueue, 500); });
}

function announce(msg) {
  _announceQueue.push(msg);
  if (!_announcing) _processQueue();
}
