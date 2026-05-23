/**
 * renderer.js
 * Canvas drawing routines for James-Nerf-Squad v0.1.
 * All drawing is pure Canvas 2D — no DOM manipulation.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, FLASH_BLINK_MS } from './constants.js';
import { GROUND_TOP } from './level.js';

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

export function drawBackground(ctx) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

export function drawGround(ctx) {
  // Ground fills from the ground line to the bottom of the canvas.
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, GROUND_TOP, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_TOP);
  // Subtle highlight on the top edge.
  ctx.fillStyle = COLORS.platformTop;
  ctx.fillRect(0, GROUND_TOP, CANVAS_WIDTH, 3);
}

// ---------------------------------------------------------------------------
// Platforms
// ---------------------------------------------------------------------------

export function drawPlatforms(ctx, platforms, camX) {
  for (const p of platforms) {
    const sx = p.x - camX;
    if (sx + p.w < 0 || sx > CANVAS_WIDTH) continue;
    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(sx, p.y, p.w, p.h);
    // Highlight top edge in sky-blue
    ctx.fillStyle = COLORS.platformTop;
    ctx.fillRect(sx, p.y, p.w, 3);
  }
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export function drawPlayer(ctx, player, camX, now) {
  const sx = player.x - camX;
  const sy = player.y;

  // Determine if we are mid-flash (blink on/off)
  const flashing  = now < player.flashUntil;
  const blinkOn   = flashing && Math.floor((player.flashUntil - now) / FLASH_BLINK_MS) % 2 === 0;
  const bodyColor = blinkOn ? COLORS.flashColor : COLORS.player;

  // Body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(sx, sy, player.w, player.h);

  // Face (eyes + mouth) — always white
  const faceX = player.facingRight ? sx + player.w - 14 : sx + 4;

  // Eyes
  ctx.fillStyle = COLORS.playerFace;
  ctx.fillRect(faceX,     sy + 8,  4, 4);
  ctx.fillRect(faceX + 6, sy + 8,  4, 4);

  // Mouth (smile)
  ctx.fillRect(faceX,     sy + 18, 10, 3);
  ctx.fillRect(faceX,     sy + 21, 2,  3);
  ctx.fillRect(faceX + 8, sy + 21, 2,  3);
}

// ---------------------------------------------------------------------------
// Companion
// ---------------------------------------------------------------------------

export function drawCompanion(ctx, companion, camX) {
  const sx = companion.x - camX;
  if (sx + companion.w < 0 || sx > CANVAS_WIDTH) return;

  ctx.fillStyle = COLORS.companion;
  ctx.fillRect(sx, companion.y, companion.w, companion.h);

  // Simple face — facing right (companion follows behind)
  ctx.fillStyle = COLORS.playerFace;
  ctx.fillRect(sx + companion.w - 10, companion.y + 6,  3, 3);
  ctx.fillRect(sx + companion.w - 5,  companion.y + 6,  3, 3);
  ctx.fillRect(sx + companion.w - 10, companion.y + 14, 7, 2);
}

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------

export function drawEnemies(ctx, enemies, camX) {
  for (const e of enemies) {
    if (!e.alive) continue;
    const sx = e.x - camX;
    if (sx + e.w < 0 || sx > CANVAS_WIDTH) continue;

    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(sx, e.y, e.w, e.h);

    // Angry eyes
    ctx.fillStyle = COLORS.playerFace;
    ctx.fillRect(sx + 4,  e.y + 6, 4, 4);
    ctx.fillRect(sx + 14, e.y + 6, 4, 4);
    // Frown
    ctx.fillRect(sx + 4,  e.y + 22, 10, 2);
    ctx.fillRect(sx + 4,  e.y + 20, 2,  2);
    ctx.fillRect(sx + 12, e.y + 20, 2,  2);
  }
}

// ---------------------------------------------------------------------------
// Boss
// ---------------------------------------------------------------------------

export function drawBoss(ctx, boss, camX) {
  if (!boss.alive) return;
  const sx = boss.x - camX;
  if (sx + boss.w < 0 || sx > CANVAS_WIDTH) return;

  // Phase colour: turns darker/redder after each hit
  const shade = Math.max(0, 139 - boss.hits * 20);
  ctx.fillStyle = `rgb(${shade + 60},${Math.max(0, 20 - boss.hits * 4)},${Math.max(0, 20 - boss.hits * 4)})`;
  ctx.fillRect(sx, boss.y, boss.w, boss.h);

  // Menacing eyes
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(sx + 10, boss.y + 12, 8, 8);
  ctx.fillRect(sx + 28, boss.y + 12, 8, 8);

  // Scowl
  ctx.fillStyle = '#000';
  ctx.fillRect(sx + 10, boss.y + 38, 28, 4);
  ctx.fillRect(sx + 10, boss.y + 34, 4,  4);
  ctx.fillRect(sx + 34, boss.y + 34, 4,  4);
}

// ---------------------------------------------------------------------------
// Darts
// ---------------------------------------------------------------------------

export function drawDarts(ctx, darts, camX) {
  ctx.fillStyle = COLORS.dart;
  for (const d of darts) {
    const sx = d.x - camX;
    if (sx + d.w < 0 || sx > CANVAS_WIDTH) continue;
    ctx.fillRect(sx, d.y, d.w, d.h);
    // Tip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, d.y + 1, 3, d.h - 2);
    ctx.fillStyle = COLORS.dart;
  }
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

export function drawHUD(ctx, state) {
  const { levelName, bossRoom, boss, player, now } = state;

  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textBaseline = 'top';

  // Level name
  ctx.fillStyle = COLORS.hudMuted;
  ctx.fillText(levelName, 16, 12);

  // Boss hits remaining (only in boss room)
  if (bossRoom && boss.alive) {
    const bossHitsLeft = boss.maxHits - boss.hits;
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`Boss HP: ${bossHitsLeft}/${boss.maxHits}`, CANVAS_WIDTH - 150, 12);
  }

  // Flash indicator
  if (now < player.flashUntil) {
    ctx.fillStyle = COLORS.flashColor;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('HIT!', CANVAS_WIDTH / 2 - 20, 12);
  }

  // Double-jump indicator (subtle)
  if (!player.onGround && player.hasDoubleJumped) {
    ctx.fillStyle = COLORS.hudMuted;
    ctx.font = '13px sans-serif';
    ctx.fillText('double jump used', 16, 36);
  }

  // Controls reminder — bottom strip
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font      = '12px sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Move: A/D or Arrows  |  Jump: Space/Up  |  Shoot: F or Enter  |  Pause: Esc', 16, CANVAS_HEIGHT - 8);
}

// ---------------------------------------------------------------------------
// Pause overlay
// ---------------------------------------------------------------------------

export function drawPauseOverlay(ctx) {
  ctx.fillStyle = COLORS.panelBg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.hud;
  ctx.font      = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  ctx.font = '20px sans-serif';
  ctx.fillStyle = COLORS.hudMuted;
  ctx.fillText('Press Escape or use the Resume button to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 16);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

// ---------------------------------------------------------------------------
// Win screen
// ---------------------------------------------------------------------------

export function drawWinScreen(ctx) {
  ctx.fillStyle = COLORS.panelBg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.player; // orange
  ctx.font      = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('You won!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.font = '24px sans-serif';
  ctx.fillStyle = COLORS.hud;
  ctx.fillText('James and the squad defeated the Commander.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 16);

  ctx.font = '18px sans-serif';
  ctx.fillStyle = COLORS.hudMuted;
  ctx.fillText('Press R to play again, or use the Restart button below.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 52);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}
