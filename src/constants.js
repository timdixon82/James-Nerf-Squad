/**
 * constants.js
 * Shared constants for James-Nerf-Squad v0.1.
 * Brand palette: navy #061528, white #ffffff, sky-blue #63D2FF, orange #FF7C00.
 */

export const CANVAS_WIDTH  = 960;
export const CANVAS_HEIGHT = 540;

export const GRAVITY        = 0.55;
export const MAX_FALL_SPEED = 18;

export const PLAYER_WIDTH   = 28;
export const PLAYER_HEIGHT  = 42;
export const PLAYER_SPEED   = 3.8;
export const JUMP_FORCE     = -13.5;
export const DOUBLE_JUMP_FORCE = -11;

export const DART_SPEED     = 9;
export const DART_WIDTH     = 14;
export const DART_HEIGHT    = 5;
export const DART_COOLDOWN  = 300; // ms

export const COMPANION_OFFSET_X = -56;
export const COMPANION_OFFSET_Y = 0;

export const COLORS = {
  background : '#061528',
  ground     : '#0d2040',
  platform   : '#1a3050',
  platformTop: '#63D2FF',
  player     : '#FF7C00',
  playerFace : '#ffffff',
  companion  : '#63D2FF',
  enemy      : '#c0392b',
  boss       : '#8B0000',
  dart       : '#FF7C00',
  hud        : '#ffffff',
  hudMuted   : '#63D2FF',
  panelBg    : 'rgba(6,21,40,0.88)',
  flashColor : '#ff0000',
};

export const FLASH_DURATION = 800; // ms
export const FLASH_BLINK_MS = 100; // blink interval during flash
