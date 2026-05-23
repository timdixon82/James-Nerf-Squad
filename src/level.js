/**
 * level.js
 * Hand-authored level data for James-Nerf-Squad v0.1.
 *
 * Level 1: "The Yard" — outdoor setting, leads into the boss room.
 * Level 2 (boss room): "Commander's Den" — pacing boss fight.
 *
 * Coordinate system: x increases right, y increases DOWN.
 * Ground y-top is set by GROUND_TOP constant used in world.js.
 */

export const GROUND_TOP = 480; // y coordinate of ground surface

/**
 * Each platform: { x, y, w, h }
 * x/y are the top-left corner in world (scrolling) space.
 */
export const LEVEL_1_PLATFORMS = [
  // Starting area — low ledges for tutorial feel
  { x: 280,  y: 380, w: 120, h: 18 },
  { x: 480,  y: 320, w: 120, h: 18 },
  { x: 660,  y: 260, w: 100, h: 18 },
  // Mid-section step sequence
  { x: 880,  y: 360, w: 100, h: 18 },
  { x: 1040, y: 300, w: 120, h: 18 },
  { x: 1220, y: 230, w: 100, h: 18 },
  { x: 1400, y: 310, w: 140, h: 18 },
  // Late section — enemies guarding the door
  { x: 1620, y: 380, w: 100, h: 18 },
  { x: 1800, y: 290, w: 120, h: 18 },
];

/**
 * Enemies in level 1.
 * type: 'patrol' moves left-right between patrolMin/patrolMax.
 * type: 'stationary' stays still.
 * maxHits: how many darts to defeat.
 */
export const LEVEL_1_ENEMIES = [
  { x: 620,  y: GROUND_TOP - 36, w: 28, h: 36, type: 'stationary', maxHits: 1 },
  { x: 950,  y: GROUND_TOP - 36, w: 28, h: 36, type: 'patrol', patrolMin: 880,  patrolMax: 1060, speed: 1.2, maxHits: 1 },
  { x: 1180, y: GROUND_TOP - 36, w: 28, h: 36, type: 'stationary', maxHits: 1 },
  { x: 1450, y: GROUND_TOP - 36, w: 28, h: 36, type: 'patrol', patrolMin: 1400, patrolMax: 1580, speed: 1.4, maxHits: 1 },
  { x: 1700, y: GROUND_TOP - 36, w: 28, h: 36, type: 'stationary', maxHits: 1 },
];

/** Trigger x-position (world space) that switches to the boss room. */
export const LEVEL_1_WIDTH   = 2200;
export const BOSS_TRIGGER_X  = 2050;

/**
 * Boss definition.
 * The boss occupies the "boss room" which begins at BOSS_ROOM_ORIGIN.
 */
export const BOSS = {
  x      : 2400,
  y      : GROUND_TOP - 80,
  w      : 72,
  h      : 80,
  maxHits: 5,
  speed  : 2.4,
  patrolMin: 2200,
  patrolMax: 2600,
  // After 2 hits the boss starts jumping every BOSS_JUMP_INTERVAL ms.
  jumpThreshold : 2,
  jumpForce     : -14,
  jumpInterval  : 2200,
};

/** Total world width including boss room. */
export const WORLD_WIDTH = 2800;

/** Spawn point for James at level start (world space). */
export const SPAWN_X = 80;
export const SPAWN_Y = GROUND_TOP - 42; // placed on ground
