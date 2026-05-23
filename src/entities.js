/**
 * entities.js
 * Player, companion, enemy, boss, and dart constructors.
 */

import {
  GRAVITY, MAX_FALL_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, JUMP_FORCE, DOUBLE_JUMP_FORCE,
  DART_SPEED, DART_WIDTH, DART_HEIGHT, DART_COOLDOWN,
  COMPANION_OFFSET_X, COMPANION_OFFSET_Y,
  FLASH_DURATION,
} from './constants.js';
import { GROUND_TOP, BOSS } from './level.js';
import { isLeft, isRight, isJump } from './input.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Axis-aligned bounding box overlap test. */
export function overlaps(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

/** Resolve collision: push entity out of rect vertically or horizontally. */
function resolveAABB(entity, rect) {
  if (!overlaps(entity, rect)) return;

  const overlapLeft  = (entity.x + entity.w) - rect.x;
  const overlapRight = (rect.x  + rect.w)  - entity.x;
  const overlapTop   = (entity.y + entity.h) - rect.y;
  const overlapBot   = (rect.y  + rect.h)  - entity.y;

  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBot);

  if (minOverlap === overlapTop && entity.vy >= 0) {
    // Landing on top
    entity.y  = rect.y - entity.h;
    entity.vy = 0;
    entity.onGround = true;
  } else if (minOverlap === overlapBot && entity.vy < 0) {
    entity.y  = rect.y + rect.h;
    entity.vy = 0;
  } else if (minOverlap === overlapLeft) {
    entity.x  = rect.x - entity.w;
    entity.vx = 0;
  } else {
    entity.x  = rect.x + rect.w;
    entity.vx = 0;
  }
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export function createPlayer(x, y) {
  return {
    x, y,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    facingRight : true,
    onGround    : false,
    canDoubleJump : false,
    hasDoubleJumped : false,
    jumpHeld    : false,
    flashUntil  : 0,      // timestamp (ms) while flashing red after hit
    lastDartTime: 0,      // timestamp (ms) of last dart fired
    darts       : [],     // active dart objects
    invincibleUntil: 0,   // brief invincibility after flash ends
  };
}

export function updatePlayer(player, platforms, now, reducedMotion) {
  // Movement
  if (isLeft())  { player.vx = -PLAYER_SPEED; player.facingRight = false; }
  else if (isRight()) { player.vx = PLAYER_SPEED; player.facingRight = true; }
  else            { player.vx = 0; }

  // Jump
  const jumpDown = isJump();
  if (jumpDown && !player.jumpHeld) {
    if (player.onGround) {
      player.vy = JUMP_FORCE;
      player.hasDoubleJumped = false;
    } else if (!player.hasDoubleJumped) {
      player.vy = DOUBLE_JUMP_FORCE;
      player.hasDoubleJumped = true;
    }
  }
  player.jumpHeld = jumpDown;

  // Gravity (reduced if reduced-motion)
  const gravityScale = reducedMotion ? 0.55 : 1;
  player.vy = Math.min(player.vy + GRAVITY * gravityScale, MAX_FALL_SPEED);

  player.x += player.vx;
  player.y += player.vy;

  // Clamp to left edge of world
  if (player.x < 0) player.x = 0;

  // Ground collision
  player.onGround = false;
  if (player.y + player.h >= GROUND_TOP) {
    player.y  = GROUND_TOP - player.h;
    player.vy = 0;
    player.onGround = true;
    player.hasDoubleJumped = false;
  }

  // Platform collisions
  for (const plat of platforms) {
    resolveAABB(player, plat);
    if (player.onGround) player.hasDoubleJumped = false;
  }

  // Update darts
  player.darts = player.darts.filter(d => {
    d.x += d.vx;
    d.y += d.vy;
    // Despawn if off world
    return d.x > -100 && d.x < 9999 && d.y > 0 && d.y < GROUND_TOP + 20;
  });
}

export function shootDart(player, now) {
  if (now - player.lastDartTime < DART_COOLDOWN) return;
  player.lastDartTime = now;
  const dx  = player.facingRight ? DART_SPEED : -DART_SPEED;
  const dartX = player.facingRight
    ? player.x + player.w
    : player.x - DART_WIDTH;
  player.darts.push({
    x  : dartX,
    y  : player.y + player.h / 2 - DART_HEIGHT / 2,
    w  : DART_WIDTH,
    h  : DART_HEIGHT,
    vx : dx,
    vy : 0,
  });
}

export function hitPlayer(player, now) {
  if (now < player.invincibleUntil) return; // already invincible
  player.flashUntil      = now + FLASH_DURATION;
  player.invincibleUntil = now + FLASH_DURATION + 400;
}

// ---------------------------------------------------------------------------
// Companion
// ---------------------------------------------------------------------------

export function createCompanion(x, y) {
  return {
    x, y,
    w: 22,
    h: 36,
    vy: 0,
    onGround: false,
  };
}

export function updateCompanion(companion, player, platforms) {
  // Follow player at fixed offset
  const targetX = player.x + COMPANION_OFFSET_X;
  companion.x   = targetX;

  // Apply gravity
  companion.vy = Math.min(companion.vy + GRAVITY, MAX_FALL_SPEED);
  companion.y += companion.vy;

  // Ground
  companion.onGround = false;
  if (companion.y + companion.h >= GROUND_TOP) {
    companion.y  = GROUND_TOP - companion.h;
    companion.vy = 0;
    companion.onGround = true;
  }

  // Platform collisions
  for (const plat of platforms) {
    resolveAABB(companion, plat);
  }
}

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------

export function createEnemies(defs) {
  return defs.map(def => ({
    ...def,
    vx       : def.speed ?? 0,
    vy       : 0,
    hits     : 0,
    alive    : true,
    dir      : 1,
  }));
}

export function updateEnemies(enemies, platforms) {
  for (const e of enemies) {
    if (!e.alive) continue;

    if (e.type === 'patrol') {
      e.x += e.vx * e.dir;
      if (e.x <= e.patrolMin) { e.x = e.patrolMin; e.dir = 1; }
      if (e.x + e.w >= e.patrolMax) { e.x = e.patrolMax - e.w; e.dir = -1; }
    }

    // Gravity
    e.vy = Math.min(e.vy + GRAVITY, MAX_FALL_SPEED);
    e.y += e.vy;

    if (e.y + e.h >= GROUND_TOP) {
      e.y  = GROUND_TOP - e.h;
      e.vy = 0;
    }

    for (const plat of platforms) {
      resolveAABB(e, plat);
    }
  }
}

// ---------------------------------------------------------------------------
// Boss
// ---------------------------------------------------------------------------

export function createBoss() {
  return {
    ...BOSS,
    hits      : 0,
    alive     : true,
    dir       : -1,
    vy        : 0,
    onGround  : false,
    lastJump  : 0,
    jumpQueued: false,
  };
}

export function updateBoss(boss, player, platforms, now) {
  if (!boss.alive) return;

  // Horizontal patrol
  boss.x += boss.speed * boss.dir;
  if (boss.x <= boss.patrolMin)  { boss.x = boss.patrolMin;          boss.dir = 1;  }
  if (boss.x + boss.w >= boss.patrolMax) { boss.x = boss.patrolMax - boss.w; boss.dir = -1; }

  // Jump when phase 2
  if (boss.hits >= boss.jumpThreshold) {
    if (boss.onGround && now - boss.lastJump > boss.jumpInterval) {
      boss.vy       = boss.jumpForce;
      boss.lastJump = now;
      boss.onGround = false;
    }
  }

  // Gravity
  boss.vy = Math.min(boss.vy + GRAVITY, MAX_FALL_SPEED);
  boss.y += boss.vy;

  boss.onGround = false;
  if (boss.y + boss.h >= GROUND_TOP) {
    boss.y  = GROUND_TOP - boss.h;
    boss.vy = 0;
    boss.onGround = true;
  }
}
