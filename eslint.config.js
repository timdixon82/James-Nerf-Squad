// ESLint flat config (ESLint 9+).
// James Nerf Squad delivers its JavaScript as plain var-scoped ES5-style
// script files loaded in dependency order via <script src> tags in index.html.
// There is no bundler and no transpiler. All module-level names are on window.
//
// See docs/decisions/002-module-load-order.md for the script-tag load order
// this project uses, and docs/decisions/001-static-frontend-github-pages.md
// for the no-build posture.

import globals from 'globals';

// Names declared at the top level of each .js file (var at script scope
// becomes a window property; cross-file references appear as undeclared
// without this list). Update when a new module is added.
const gameGlobals = {
  // constants.js
  CANVAS_W: 'readonly',
  CANVAS_H: 'readonly',
  TILE: 'readonly',
  TOUCH_HUD_H: 'readonly',
  GRAVITY: 'readonly',
  PLAYER_W: 'readonly',
  PLAYER_H: 'readonly',
  PLAYER_SPEED: 'readonly',
  PLAYER_JUMP: 'readonly',
  PLAYER_MAX_LIVES: 'readonly',
  PLAYER_INVINCIBLE_FRAMES: 'readonly',
  DART_SPEED: 'readonly',
  DART_W: 'readonly',
  DART_H: 'readonly',
  BLASTERS: 'readonly',
  ENEMIES: 'readonly',
  POWERUPS: 'readonly',
  LEVELS: 'readonly',
  TOTAL_LEVELS: 'readonly',
  SKIN_COLORS: 'readonly',
  HAIR_COLORS: 'readonly',
  CLOTH_COLORS: 'readonly',
  DEFAULT_KEYS: 'readonly',
  THEMES: 'readonly',
  // utils.js
  rectOverlap: 'readonly',
  clamp: 'readonly',
  lerp: 'readonly',
  rnd: 'readonly',
  rndInt: 'readonly',
  choice: 'readonly',
  shadeColor: 'readonly',
  px: 'readonly',
  roundRect: 'readonly',
  drawStarfield: 'readonly',
  makeStars: 'readonly',
  drawBgScenery: 'readonly',
  formatKey: 'readonly',
  persistence: 'readonly',
  // input.js
  Input: 'readonly',
  // sound.js (_audioCtx is accessed cross-file by music.js)
  _audioCtx: 'readonly',
  getAudioCtx: 'readonly',
  resumeAudio: 'readonly',
  playShoot: 'readonly',
  playHit: 'readonly',
  playExplosion: 'readonly',
  playBossExplosion: 'readonly',
  playPlayerHurt: 'readonly',
  playJump: 'readonly',
  playPowerUp: 'readonly',
  playLevelComplete: 'readonly',
  playBossFanfare: 'readonly',
  playGameOver: 'readonly',
  playMenuClick: 'readonly',
  playMenuConfirm: 'readonly',
  // music.js
  startMusic: 'readonly',
  stopMusic: 'readonly',
  // particles.js
  spawnParticles: 'readonly',
  updateParticles: 'readonly',
  drawParticles: 'readonly',
  // icons.js
  drawIconShield: 'readonly',
  drawIconSpeed: 'readonly',
  drawIconMegaDart: 'readonly',
  drawIconSquad: 'readonly',
  drawIconAmmo: 'readonly',
  drawPowerUpIcon: 'readonly',
  drawPowerUp: 'readonly',
  // player.js
  Player: 'readonly',
  // enemy.js
  createEnemy: 'readonly',
  updateEnemy: 'readonly',
  drawEnemy: 'readonly',
  updateSquadMember: 'readonly',
  drawSquadMember: 'readonly',
  // boss.js
  createBoss: 'readonly',
  updateBoss: 'readonly',
  drawBoss: 'readonly',
  // hud.js
  drawHeart: 'readonly',
  drawHUD: 'readonly',
  drawBossBar: 'readonly',
  // screens.js
  drawTitleScreen: 'readonly',
  drawCustomiseScreen: 'readonly',
  drawLevelSelect: 'readonly',
  drawBossIntro: 'readonly',
  drawLevelComplete: 'readonly',
  drawGameOver: 'readonly',
  drawSettings: 'readonly',
  drawPauseMenu: 'readonly',
  drawReducedMotionScreen: 'readonly',
  drawInventoryScreen: 'readonly',
  drawHelpScreen: 'readonly',
  // touch.js
  getMenuNavButtons: 'readonly',
  drawMenuNavStrip: 'readonly',
  hitTestMenuNav: 'readonly',
  getTouchButtons: 'readonly',
  drawTouchButtons: 'readonly',
  drawGameOverTouchButtons: 'readonly',
  drawPauseTouchButtons: 'readonly',
  detectTouchDevice: 'readonly',
  // announcer.js
  announce: 'readonly',
  // speech.js
  Speech: 'readonly',
  // game.js
  SCREEN_INVENTORY: 'readonly',
  Game: 'readonly',
};

export default [
  {
    ignores: [
      'eslint.config.js',
      'node_modules/**',
    ],
  },
  {
    files: ['js/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...gameGlobals,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'warn',
      'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
];
