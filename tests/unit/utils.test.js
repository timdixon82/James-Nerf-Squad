import { describe, it, expect } from 'vitest';
import { loadScript } from './load-script.js';

const sandbox = loadScript('js/utils.js');
const {
  clamp,
  lerp,
  rectOverlap,
  checkPlatformCollision,
  shadeColor,
  formatKey,
  rndInt,
  choice,
} = sandbox;

describe('clamp', () => {
  it('returns the value unchanged when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the lower bound', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to the upper bound', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('returns the start value at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns the end value at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns the midpoint at t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe('rectOverlap', () => {
  it('returns true for two overlapping rectangles', () => {
    expect(rectOverlap(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
  });

  it('returns false for two rectangles that do not touch', () => {
    expect(rectOverlap(0, 0, 10, 10, 100, 100, 10, 10)).toBe(false);
  });

  it('returns false for rectangles that only share an edge', () => {
    // Second rect starts exactly where the first ends on the x axis.
    expect(rectOverlap(0, 0, 10, 10, 10, 0, 10, 10)).toBe(false);
  });
});

describe('checkPlatformCollision', () => {
  it('lands the entity on top of a platform it is falling onto', () => {
    const platform = { x: 0, y: 100, w: 50, h: 10 };
    const entity = { x: 0, y: 90, w: 10, h: 10, vy: 5, onGround: false };
    const hit = checkPlatformCollision(entity, [platform]);
    expect(hit).toBe(true);
    expect(entity.onGround).toBe(true);
    expect(entity.vy).toBe(0);
    expect(entity.y).toBe(platform.y - entity.h);
  });

  it('does not collide when the entity is moving upward', () => {
    const platform = { x: 0, y: 100, w: 50, h: 10 };
    const entity = { x: 0, y: 90, w: 10, h: 10, vy: -5, onGround: false };
    const hit = checkPlatformCollision(entity, [platform]);
    expect(hit).toBe(false);
    expect(entity.onGround).toBe(false);
  });

  it('does not collide when the entity is horizontally clear of the platform', () => {
    const platform = { x: 0, y: 100, w: 50, h: 10 };
    const entity = { x: 200, y: 90, w: 10, h: 10, vy: 5, onGround: false };
    const hit = checkPlatformCollision(entity, [platform]);
    expect(hit).toBe(false);
  });
});

describe('shadeColor', () => {
  it('lightens a hex colour by the given amount', () => {
    expect(shadeColor('#000000', 50)).toBe('#323232');
  });

  it('clamps channel values at 255 when lightening white', () => {
    expect(shadeColor('#ffffff', 50)).toBe('#ffffff');
  });

  it('clamps channel values at 0 when darkening black', () => {
    expect(shadeColor('#000000', -50)).toBe('#000000');
  });
});

describe('formatKey', () => {
  it('maps a known special key to its display label', () => {
    expect(formatKey('ArrowLeft')).toBe('LEFT');
    expect(formatKey(' ')).toBe('SPACE');
  });

  it('uppercases an unmapped key', () => {
    expect(formatKey('a')).toBe('A');
  });
});

describe('rndInt', () => {
  it('always returns an integer within the inclusive range', () => {
    for (let i = 0; i < 200; i++) {
      const value = rndInt(3, 7);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
    }
  });
});

describe('choice', () => {
  it('always returns an element from the given array', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(choice(arr));
    }
  });
});
