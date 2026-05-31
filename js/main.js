
/**
 * main.js
 * Entry point. Creates the Game instance, loads saved data, and starts.
 */

// Fetch the version string once at startup and store it globally so
// screens.js can render it on the pause screen without coupling to main.js.
window._gameVersion = '';
fetch('VERSION')
  .then(function(r) { return r.text(); })
  .then(function(v) { window._gameVersion = v.trim(); })
  .catch(function() { /* version display is non-critical; fail silently */ });

function main() {
  var canvas = document.getElementById('gameCanvas');
  if (!canvas) { console.error('Canvas element not found'); return; }

  // Set initial canvas size before Game constructor runs
  canvas.width  = 480;
  canvas.height = 270;

  var game = new Game(canvas);
  game.load().then(function() {
    game.start();
  }).catch(function(err) {
    console.error('Load error:', err);
    game.start(); // start anyway
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
