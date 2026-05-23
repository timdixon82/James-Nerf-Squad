/**
 * game.js
 * Main game loop for James-Nerf-Squad v0.1.
 * Orchestrates input, entities, physics, collision, and rendering.
 */

import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
} from './constants.js';
import {
  GROUND_TOP, LEVEL_1_PLATFORMS, LEVEL_1_ENEMIES,
  BOSS_TRIGGER_X, WORLD_WIDTH, SPAWN_X, SPAWN_Y,
} from './level.js';
import {
  initInput, destroyInput,
} from './input.js';
import {
  createPlayer, updatePlayer, shootDart, hitPlayer,
  createCompanion, updateCompanion,
  createEnemies, updateEnemies,
  createBoss, updateBoss,
  overlaps,
} from './entities.js';
import {
  drawBackground, drawGround, drawPlatforms,
  drawPlayer, drawCompanion, drawEnemies, drawBoss, drawDarts,
  drawHUD, drawPauseOverlay, drawWinScreen,
} from './renderer.js';

// ---------------------------------------------------------------------------
// Game states
// ---------------------------------------------------------------------------
const STATE_PLAYING = 'playing';
const STATE_PAUSED  = 'paused';
const STATE_WON     = 'won';

// ---------------------------------------------------------------------------
// Module-level game vars (reset on restart)
// ---------------------------------------------------------------------------
let canvas, ctx;
let ariaLive;
let pauseDialog, resumeBtn, restartBtnPause, restartBtnWin;
let rafId = null;

let state;
let player, companion, enemies, boss;
let platforms;
let camX;         // camera left edge in world space
let bossRoom;     // true when in boss-fight section
let reducedMotion;

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initGame(canvasEl, ariaEl, pauseDlg, resumeButton, restartPause, restartWin) {
  canvas          = canvasEl;
  ctx             = canvas.getContext('2d');
  ariaLive        = ariaEl;
  pauseDialog     = pauseDlg;
  resumeBtn       = resumeButton;
  restartBtnPause = restartPause;
  restartBtnWin   = restartWin;

  // Detect prefers-reduced-motion
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
    reducedMotion = e.matches;
  });

  resumeBtn.addEventListener('click', () => handlePause());
  restartBtnPause.addEventListener('click', () => restartGame());
  restartBtnWin.addEventListener('click',   () => restartGame());

  initInput({
    onShoot  : () => { if (state === STATE_PLAYING) shootDart(player, performance.now()); },
    onRestart: () => { if (state === STATE_WON || state === STATE_PAUSED) restartGame(); },
    onPause  : () => handlePause(),
  });

  startNewGame();
  rafId = requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Game lifecycle
// ---------------------------------------------------------------------------

function startNewGame() {
  state     = STATE_PLAYING;
  platforms = LEVEL_1_PLATFORMS;
  bossRoom  = false;
  camX      = 0;

  player    = createPlayer(SPAWN_X, SPAWN_Y);
  companion = createCompanion(SPAWN_X + (-56), SPAWN_Y);
  enemies   = createEnemies(LEVEL_1_ENEMIES);
  boss      = createBoss();

  hidePauseDialog();
  hideWinElements();
  announceAria('Game started. James is ready. Move with A and D, jump with Space, shoot with F.');
}

function restartGame() {
  if (rafId) cancelAnimationFrame(rafId);
  startNewGame();
  rafId = requestAnimationFrame(loop);
}

function handlePause() {
  if (state === STATE_PLAYING) {
    state = STATE_PAUSED;
    showPauseDialog();
    announceAria('Game paused. Press Escape or Resume to continue.');
  } else if (state === STATE_PAUSED) {
    state = STATE_PLAYING;
    hidePauseDialog();
    announceAria('Game resumed.');
    requestAnimationFrame(loop);
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

function loop(now) {
  if (state === STATE_PAUSED) return; // pause: stop rAF, resume in handlePause
  if (state === STATE_WON)    {
    render(now);
    return; // keep drawing win screen, no tick
  }

  tick(now);
  render(now);
  rafId = requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Update (tick)
// ---------------------------------------------------------------------------

function tick(now) {
  // Player update
  updatePlayer(player, platforms, now, reducedMotion);

  // Companion follows
  updateCompanion(companion, player, platforms);

  // Enemies
  updateEnemies(enemies, platforms);

  // Boss (only once triggered)
  if (bossRoom) {
    updateBoss(boss, player, platforms, now);
  }

  // Camera: follow player, clamp to world bounds
  const targetCamX = player.x + player.w / 2 - CANVAS_WIDTH / 2;
  const maxCamX    = WORLD_WIDTH - CANVAS_WIDTH;
  camX = Math.max(0, Math.min(targetCamX, maxCamX));

  // If reduced motion, limit camera scroll speed
  if (reducedMotion) {
    // Snap camera but cap movement per frame to 4px
    const prevCam = camX;
    const diff    = targetCamX - prevCam;
    camX = prevCam + Math.sign(diff) * Math.min(Math.abs(diff), 4);
    camX = Math.max(0, Math.min(camX, maxCamX));
  }

  // Check boss room trigger
  if (!bossRoom && player.x > BOSS_TRIGGER_X) {
    bossRoom = true;
    announceAria('Boss room entered. The Commander is here. Boss has 5 hit points.');
  }

  // Dart vs enemy collision
  for (const dart of player.darts) {
    for (const e of enemies) {
      if (!e.alive) continue;
      if (overlaps(dart, e)) {
        e.hits++;
        dart.x = -999; // despawn dart
        if (e.hits >= e.maxHits) {
          e.alive = false;
          announceAria('Enemy defeated.');
        }
      }
    }

    // Dart vs boss
    if (bossRoom && boss.alive && overlaps(dart, boss)) {
      boss.hits++;
      dart.x = -999;
      const hitsLeft = boss.maxHits - boss.hits;
      if (boss.hits >= boss.maxHits) {
        boss.alive = false;
        triggerWin();
      } else {
        announceAria(`Boss hit. ${hitsLeft} hit point${hitsLeft !== 1 ? 's' : ''} remaining.`);
      }
    }
  }

  // Player vs enemy collision
  for (const e of enemies) {
    if (!e.alive) continue;
    if (overlaps(player, e)) {
      hitPlayer(player, now);
      if (now < player.invincibleUntil + 1) {
        announceAria('James was hit. He is flashing red briefly.');
      }
    }
  }

  // Player vs boss collision
  if (bossRoom && boss.alive && overlaps(player, boss)) {
    hitPlayer(player, now);
  }

  // Despawn darts that were flagged above
  player.darts = player.darts.filter(d => d.x > -900);
}

// ---------------------------------------------------------------------------
// Win
// ---------------------------------------------------------------------------

function triggerWin() {
  state = STATE_WON;
  showWinElements();
  announceAria('You won! James and the squad defeated the Commander. Press R or the Restart button to play again.');
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function render(now) {
  drawBackground(ctx);
  drawGround(ctx);
  drawPlatforms(ctx, platforms, camX);
  drawEnemies(ctx, enemies, camX);

  if (bossRoom) {
    drawBoss(ctx, boss, camX);
  }

  drawCompanion(ctx, companion, camX);
  drawPlayer(ctx, player, camX, now);
  drawDarts(ctx, player.darts, camX);

  drawHUD(ctx, {
    levelName: bossRoom ? "Commander's Den" : 'The Yard',
    bossRoom,
    boss,
    player,
    now,
  });

  if (state === STATE_PAUSED) drawPauseOverlay(ctx);
  if (state === STATE_WON)    drawWinScreen(ctx);
}

// ---------------------------------------------------------------------------
// Accessibility helpers
// ---------------------------------------------------------------------------

function announceAria(msg) {
  if (!ariaLive) return;
  // Toggle text to force re-announcement even if same string.
  ariaLive.textContent = '';
  requestAnimationFrame(() => { ariaLive.textContent = msg; });
}

// ---------------------------------------------------------------------------
// Dialog visibility helpers
// ---------------------------------------------------------------------------

function showPauseDialog() {
  pauseDialog.removeAttribute('hidden');
  pauseDialog.setAttribute('open', '');
  resumeBtn.focus();
}

function hidePauseDialog() {
  pauseDialog.setAttribute('hidden', '');
  pauseDialog.removeAttribute('open');
}

function showWinElements() {
  restartBtnWin.removeAttribute('hidden');
  restartBtnWin.focus();
}

function hideWinElements() {
  restartBtnWin.setAttribute('hidden', '');
}
