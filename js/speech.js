
/**
 * speech.js
 * WCAG 1.3.1 — Web Speech API narration layer.
 *
 * narrate(msg, priority)
 *   msg      — the string to speak.
 *   priority — 'high' cancels the current utterance immediately;
 *              'normal' queues after the current one.
 *
 * Falls back silently to the live-region announcer if the browser does not
 * support speechSynthesis.
 *
 * R-02 note: narration is NOT muted when reduced-motion is active.  The game is
 * now playable under reduced motion (degrade-and-play, sprint 018), so a
 * reduced-motion user still needs all announcements.  setReducedMotion() remains
 * callable from game.js (it cancels any queued utterance on toggle) but no longer
 * suppresses subsequent narrate() calls.
 */

var Speech = (function () {
  var supported = typeof window !== 'undefined' && !!window.speechSynthesis;

  // Simple queue: multiple utterances can be queued at a time.
  var pending = [];

  function _speak(msg) {
    if (!supported) return;
    var utt = new SpeechSynthesisUtterance(msg);
    utt.rate  = 1.0;
    utt.pitch = 1.0;
    utt.onend = function() {
      if (pending.length > 0) {
        var next = pending.shift();
        _speak(next);
      }
    };
    try {
      window.speechSynthesis.speak(utt);
    } catch (e) {
      // speech API unavailable or blocked — degrade silently
    }
  }

  function narrate(msg, priority) {
    if (!supported) return;

    if (priority === 'high') {
      pending = null;
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // speech API unavailable or blocked
      }
      _speak(msg);
    } else {
      // 'normal': if something is currently speaking, queue this message.
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        pending = msg;
      } else {
        _speak(msg);
      }
    }
  }

  // Called by game.js when the prefers-reduced-motion preference changes.
  // Cancels any queued utterance so mid-transition chatter is cleared, but
  // does not permanently suppress narration — reduced-motion users need all
  // announcements now that the game is playable under reduced motion.
  function setReducedMotion(value) {
    if (value && supported) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // speech API unavailable or blocked
      }
      pending = null;
    }
  }

  return {
    narrate: narrate,
    setReducedMotion: setReducedMotion,
  };
})();
