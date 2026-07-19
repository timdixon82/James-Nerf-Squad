import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript } from './load-script.js';

describe('Input.onKeyUp — case-variant clear (Defect 2 regression)', () => {
  let Input;

  beforeEach(() => {
    Input = loadScript('js/input.js').Input;
  });

  it('clears the lower-case held entry when the keyup reports the upper-case variant (Shift-release)', () => {
    // Simulate holding 'a' to move left.
    Input.onKeyDown('a', false);
    expect(Input.held['a']).toBe(true);

    // While Shift is held, the browser can report the keyup with the
    // upper-case variant of the key that was actually released.
    Input.onKeyUp('A');

    expect(Input.held['a']).toBe(false);
    expect(Input.held['A']).toBe(false);

    Input.pollMovement(true);
    expect(Input.state.left).toBe(false);
  });

  it('clears the upper-case held entry when the keyup reports the lower-case variant', () => {
    Input.onKeyDown('D', false);
    expect(Input.held['D']).toBe(true);

    Input.onKeyUp('d');

    expect(Input.held['D']).toBe(false);
    expect(Input.held['d']).toBe(false);

    Input.pollMovement(true);
    expect(Input.state.right).toBe(false);
  });
});

describe('Input focus-loss handlers — one-shot flags', () => {
  let sandbox;
  let Input;

  beforeEach(() => {
    sandbox = loadScript('js/input.js');
    Input = sandbox.Input;
  });

  it('clears one-shot flags on window blur so they cannot fire spuriously after refocus', () => {
    Input.onKeyDown('ArrowUp', false);
    expect(Input.state.jumpPressed).toBe(true);

    sandbox.__fireListeners('window', 'blur');

    expect(Input.state.jumpPressed).toBe(false);
  });

  it('clears one-shot flags when the document becomes hidden', () => {
    Input.onKeyDown(' ', false);
    expect(Input.state.shootPressed).toBe(true);

    sandbox.document.visibilityState = 'hidden';
    sandbox.__fireListeners('document', 'visibilitychange');

    expect(Input.state.shootPressed).toBe(false);
  });

  it('clears one-shot flags on touchcancel', () => {
    Input.onTouchDown('jump');
    expect(Input.state.jumpPressed).toBe(true);

    sandbox.__fireListeners('window', 'touchcancel');

    expect(Input.state.jumpPressed).toBe(false);
  });
});
