
/**
 * constants.js
 * All hard-coded game constants. No logic lives here – pure data.
 */

/* ── Canvas / viewport ──────────────────────────────────────────────────── */
var CANVAS_W          = 480;
var CANVAS_H          = 270;
var TILE              = 16;
var TOUCH_HUD_H       = 72;

/* ── Physics ────────────────────────────────────────────────────────────── */
var GRAVITY           = 0.45;

/* ── Player ─────────────────────────────────────────────────────────────── */
var PLAYER_W                = 14;
var PLAYER_H                = 20;
var PLAYER_SPEED            = 2.8;
var PLAYER_JUMP             = -9;
var PLAYER_MAX_LIVES        = 3;
var PLAYER_INVINCIBLE_FRAMES = 90;

/* ── Darts ──────────────────────────────────────────────────────────────── */
var DART_SPEED  = 7;
var DART_W      = 8;
var DART_H      = 3;

/* ── Blasters ───────────────────────────────────────────────────────────── */
var BLASTERS = {
  pistol:  { name: 'Starter Pistol', fireRate: 18, damage: 1, ammo: 99, dartCount: 1, spread: 0,  unlockLevel: 1, color: '#ff8800' },
  rifle:   { name: 'Rapid Rifle',    fireRate:  7, damage: 1, ammo: 40, dartCount: 1, spread: 0,  unlockLevel: 2, color: '#79caff' },
  mega:    { name: 'Mega Blaster',   fireRate: 40, damage: 3, ammo: 15, dartCount: 1, spread: 0,  unlockLevel: 5, color: '#ff8a7a' },
  scatter: { name: 'Scatter Shot',   fireRate: 22, damage: 1, ammo: 24, dartCount: 3, spread: 12, unlockLevel: 8, color: '#88ff44' },
};

/* ── Enemies ────────────────────────────────────────────────────────────── */
var ENEMIES = {
  kid:    { w: 12, h: 18, hp: 1, speed: 1.0, score: 100, color: '#cc6633', topColor: '#ff9955', flying: false, shootRate: 90  },
  drone:  { w: 16, h: 10, hp: 2, speed: 1.4, score: 150, color: '#777788', topColor: '#aaaacc', flying: true,  shootRate: 120 },
  robot:  { w: 16, h: 20, hp: 4, speed: 0.6, score: 200, color: '#558866', topColor: '#88ddaa', flying: false, shootRate: 60  },
  minion: { w: 12, h: 16, hp: 2, speed: 1.2, score: 120, color: '#9944bb', topColor: '#cc66ff', flying: false, shootRate: 80  },
};

/* ── Power-ups ──────────────────────────────────────────────────────────── */
var POWERUPS = {
  shield:   { color: '#4488ff', label: 'SHIELD',    duration: 0,   desc: 'Blocks one hit'      },
  speed:    { color: '#ffff00', label: 'SPEED',     duration: 600, desc: 'Move faster for 10s' },
  megadart: { color: '#ff4400', label: 'MEGA DART', duration: 0,   desc: 'Next shot is lethal' },
  squad:    { color: '#44ff88', label: 'BACKUP!',   duration: 900, desc: 'Squad joins for 15s' },
  ammo:     { color: '#ff88ff', label: 'AMMO',      duration: 0,   desc: 'Refills all ammo'    },
};

/* ── Levels ─────────────────────────────────────────────────────────────── */
var LEVELS = [
  { bg: ['#87ceeb','#c8e6c9','#a5d6a7'], groundColor: '#4caf50',   enemyTypes: ['kid'],                          enemyCount:  6, bossLevel: false, bossName: '',                  bossSubtitle: '',                    platformCount: 4, scrollSpeed: 1.2, bgName: 'SUBURBAN STREET' },
  { bg: ['#87ceeb','#b0bec5','#90a4ae'], groundColor: '#607d8b',   enemyTypes: ['kid','drone'],                  enemyCount:  8, bossLevel: false, bossName: '',                  bossSubtitle: '',                    platformCount: 5, scrollSpeed: 1.4, bgName: 'URBAN PARK'      },
  { bg: ['#263238','#37474f','#455a64'], groundColor: '#37474f',   enemyTypes: ['kid','drone','robot'],           enemyCount: 10, bossLevel: true,  bossName: 'THE DART BARON',    bossSubtitle: 'Overlord of the Foam',platformCount: 3, scrollSpeed: 1.6, bgName: 'WAREHOUSE'       },
  { bg: ['#ff7043','#ef9a9a','#ffccbc'], groundColor: '#bf360c',   enemyTypes: ['drone','robot'],                enemyCount: 10, bossLevel: false, bossName: '',                  bossSubtitle: '',                    platformCount: 6, scrollSpeed: 1.8, bgName: 'ROOFTOP'         },
  { bg: ['#1a237e','#283593','#303f9f'], groundColor: '#1a237e',   enemyTypes: ['kid','robot','minion'],          enemyCount: 12, bossLevel: false, bossName: '',                  bossSubtitle: '',                    platformCount: 5, scrollSpeed: 2.0, bgName: 'NIGHT DISTRICT'  },
  { bg: ['#1b1b2f','#162447','#1f4068'], groundColor: '#162447',   enemyTypes: ['drone','robot','minion'],        enemyCount: 14, bossLevel: true,  bossName: 'DRONE COMMANDER',   bossSubtitle: 'King of the Skies',   platformCount: 4, scrollSpeed: 2.2, bgName: 'FACTORY'         },
  { bg: ['#004d40','#00695c','#00796b'], groundColor: '#1b5e20',   enemyTypes: ['kid','drone','robot','minion'],  enemyCount: 14, bossLevel: false, bossName: '',                  bossSubtitle: '',                    platformCount: 7, scrollSpeed: 2.3, bgName: 'JUNGLE BASE'     },
  { bg: ['#880e4f','#ad1457','#c2185b'], groundColor: '#880e4f',   enemyTypes: ['robot','minion'],               enemyCount: 16, bossLevel: false, bossName: '',                  bossSubtitle: '',                    platformCount: 6, scrollSpeed: 2.5, bgName: 'SECRET LAB'      },
  { bg: ['#212121','#424242','#616161'], groundColor: '#212121',   enemyTypes: ['kid','drone','robot','minion'],  enemyCount: 18, bossLevel: true,  bossName: 'RIVAL SQUAD LEADER',bossSubtitle: 'The Ultimate Nemesis',platformCount: 5, scrollSpeed: 2.8, bgName: 'FINAL ARENA'     },
];
var TOTAL_LEVELS = LEVELS.length;

/* ── Accessibility colours ──────────────────────────────────────────────── */
// UI_TEXT_DIM: dim text colour that meets WCAG 1.4.6 AAA 7:1 on #050514.
// Replaces '#aaa' / '#aaaaaa' at readable-text sites (menu labels, stat lines,
// help descriptions). Decorative sprite-pixel uses of #aaa are left unchanged.
var UI_TEXT_DIM = '#c9c9d2';

/* ── Appearance palettes ────────────────────────────────────────────────── */
var SKIN_COLORS  = ['#f4a460','#e8bf9a','#c68642','#8d5524','#fad6a5','#d2956b'];
var HAIR_COLORS  = ['#4a2c0a','#1a1a1a','#8b6914','#d4aa70','#ff4444','#6644aa'];
var CLOTH_COLORS = ['#2255cc','#cc2222','#228844','#aa6600','#882288','#224466','#cc6600','#aaaaaa'];

/* ── Default keyboard bindings ──────────────────────────────────────────── */
var DEFAULT_KEYS = {
  left:   'ArrowLeft',
  right:  'ArrowRight',
  jump:   'ArrowUp',
  shoot:  ' ',
  switch: 'Shift',
  pause:  'p',
};
