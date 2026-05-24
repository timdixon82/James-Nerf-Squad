
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
 * support speechSynthesis.  Does not narrate when reduced-motion mode is active
 * (reducedMotionActive flag set by game.js on initialisation).
 */

var Speech = (function () {
  var supported = typeof window !== 'undefined' && !!window.speechSynthesis;

  // Set to true by game.js when the reduced-motion screen is shown.
  var reducedMotionActive = false;

  // Simple queue: at most one pending utterance at a time.
  var pending = null;

  function _speak(msg) {
    if (!supported) return;
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
  }

  function narrate(msg, priority) {
    if (!supported) return;
    if (reducedMotionActive) return;

    if (priority === 'high') {
      pending = null;
      window.speechSynthesis.cancel();
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

  function setReducedMotion(value) {
    reducedMotionActive = !!value;
    if (reducedMotionActive && supported) {
      window.speechSynthesis.cancel();
      pending = null;
    }
  }

  return {
    narrate: narrate,
    setReducedMotion: setReducedMotion,
  };
})();
