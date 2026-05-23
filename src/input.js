/**
 * input.js
 * Keyboard input manager.
 * Supports: A/D or Left/Right (move), Space/Up (jump),
 *           F/Enter (shoot), R (restart), Escape (pause/resume).
 */

const keys = new Set();

let _onShoot   = null;
let _onRestart = null;
let _onPause   = null;

export function initInput({ onShoot, onRestart, onPause }) {
  _onShoot   = onShoot;
  _onRestart = onRestart;
  _onPause   = onPause;

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup',   handleKeyUp);
}

export function destroyInput() {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup',   handleKeyUp);
}

function handleKeyDown(e) {
  // Prevent default scroll behaviour for game keys.
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) {
    e.preventDefault();
  }

  keys.add(e.code);

  switch (e.code) {
    case 'KeyF':
    case 'Enter':
      _onShoot?.();
      break;
    case 'KeyR':
      _onRestart?.();
      break;
    case 'Escape':
      _onPause?.();
      break;
  }
}

function handleKeyUp(e) {
  keys.delete(e.code);
}

export function isLeft()  { return keys.has('ArrowLeft')  || keys.has('KeyA'); }
export function isRight() { return keys.has('ArrowRight') || keys.has('KeyD'); }
export function isJump()  { return keys.has('ArrowUp')    || keys.has('Space'); }
