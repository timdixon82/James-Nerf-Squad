
/**
 * input.js
 * Centralised input manager.
 */

var Input = (function () {

  var held      = {};
  var touchHeld = {};          // mirrors touch-button held state for pollMovement
  var state = {
    left:  false,
    right: false,
    jump:  false,
    shoot: false,
    jumpPressed:   false,
    shootPressed:  false,
    switchPressed: false,
  };

  var bindings = {
    left:   'ArrowLeft',
    right:  'ArrowRight',
    jump:   'ArrowUp',
    shoot:  ' ',
    switch: 'Shift',
    pause:  'p',
  };

  function setBindings(b) {
    bindings = {};
    for (var k in b) bindings[k] = b[k];
  }

  function pollMovement(inGame) {
    if (!inGame) return;
    // Include touchHeld so touch presses survive across frames alongside keyboard held state.
    state.left  = !!(held[bindings.left]  || held['a'] || held['A'] || touchHeld['left']);
    state.right = !!(held[bindings.right] || held['d'] || held['D'] || touchHeld['right']);
    state.jump  = !!(held[bindings.jump]  || held['w'] || held['W'] || touchHeld['jump']);
    state.shoot = !!(held[bindings.shoot] || touchHeld['shoot']);
  }

  function onKeyDown(key, isRepeat) {
    held[key] = true;
    if (!isRepeat) {
      if (key === bindings.jump  || key === 'w' || key === 'W' || key === 'ArrowUp')    state.jumpPressed   = true;
      if (key === bindings.shoot)                                                         state.shootPressed  = true;
      if (key === bindings.switch)                                                        state.switchPressed = true;
    }
  }

  function onKeyUp(key) {
    held[key] = false;
    held[key.toLowerCase()] = false;
    held[key.toUpperCase()] = false;
    if (key === bindings.left  || key === 'a' || key === 'A') state.left  = false;
    if (key === bindings.right || key === 'd' || key === 'D') state.right = false;
    if (key === bindings.jump  || key === 'w' || key === 'W') state.jump  = false;
    if (key === bindings.shoot)                                state.shoot = false;
  }

  function clearOneShots() {
    state.jumpPressed   = false;
    state.shootPressed  = false;
    state.switchPressed = false;
  }

  function clearAllInput() {
    var h = held;
    for (var k in h) h[k] = false;
    state.left  = false;
    state.right = false;
    state.jump  = false;
    state.shoot = false;
    state.switchPressed = false;
    // clear any other one-shots
    for (var s in state) {
      if (typeof state[s] === 'boolean') state[s] = false;
    }
    var th = touchHeld;
    for (var t in th) th[t] = false;
  }

  function onTouchDown(id) {
    // Write into touchHeld so pollMovement can OR it with keyboard held state each frame.
    if (id === 'left')   { touchHeld['left']  = true; state.left  = true; }
    if (id === 'right')  { touchHeld['right'] = true; state.right = true; }
    if (id === 'jump')   { touchHeld['jump']  = true; state.jump  = true; state.jumpPressed  = true; }
    if (id === 'shoot')  { touchHeld['shoot'] = true; state.shoot = true; state.shootPressed = true; }
    if (id === 'switch') state.switchPressed = true;
  }

  function onTouchUp(id) {
    if (id === 'left')  { touchHeld['left']  = false; state.left  = false; }
    if (id === 'right') { touchHeld['right'] = false; state.right = false; }
    if (id === 'jump')  { touchHeld['jump']  = false; state.jump  = false; }
    if (id === 'shoot') { touchHeld['shoot'] = false; state.shoot = false; }
  }

  // WCAG 2.1.1 / 2.1.3 — Keys-sticking fix.
  // When the window loses focus, keyup events stop firing and the held map
  // retains stale true values, causing the player to move as if keys are
  // physically stuck.  Three listeners clear both held maps and reset the
  // movement state whenever focus leaves the page.

  window.addEventListener('blur', function() {
    var k;
    for (k in held) held[k] = false;
    for (k in touchHeld) touchHeld[k] = false;
    state.left = false; state.right = false;
    state.jump = false; state.shoot = false;
    clearOneShots();
  });

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      var k;
      for (k in held) held[k] = false;
      for (k in touchHeld) touchHeld[k] = false;
      state.left = false; state.right = false;
      state.jump = false; state.shoot = false;
      clearOneShots();
    }
  });

  // touchcancel fires when a touch is interrupted by a system event
  // (phone call, notification pull-down, etc.).
  window.addEventListener('touchcancel', function() {
    var k;
    for (k in touchHeld) touchHeld[k] = false;
    state.left = false; state.right = false;
    state.jump = false; state.shoot = false;
    clearOneShots();
  });

  return {
    held: held,
    state: state,
    setBindings: setBindings,
    pollMovement: pollMovement,
    onKeyDown: onKeyDown,
    onKeyUp: onKeyUp,
    onTouchDown: onTouchDown,
    onTouchUp: onTouchUp,
    clearOneShots: clearOneShots,
    clearAllInput: clearAllInput,
  };
})();
