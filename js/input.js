
/**
 * input.js
 * Centralised input manager.
 */

var Input = (function () {

  var held  = {};
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
    state.left  = !!(held[bindings.left]  || held['a'] || held['A']);
    state.right = !!(held[bindings.right] || held['d'] || held['D']);
    state.jump  = !!(held[bindings.jump]  || held['w'] || held['W']);
    state.shoot = !!(held[bindings.shoot]);
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

  function onTouchDown(id) {
    if (id === 'left')   state.left   = true;
    if (id === 'right')  state.right  = true;
    if (id === 'jump')   { state.jump = true;  state.jumpPressed  = true; }
    if (id === 'shoot')  { state.shoot = true; state.shootPressed = true; }
    if (id === 'switch') state.switchPressed = true;
  }

  function onTouchUp(id) {
    if (id === 'left')  state.left  = false;
    if (id === 'right') state.right = false;
    if (id === 'jump')  state.jump  = false;
    if (id === 'shoot') state.shoot = false;
  }

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
  };
})();
