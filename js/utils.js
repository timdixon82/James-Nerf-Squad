/**
 * utils.js
 * Pure helper functions used across the codebase.
 */

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t)    { return a + (b - a) * t; }
function rnd(min, max)    { return Math.random() * (max - min) + min; }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
function choice(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }

function checkPlatformCollision(entity, platforms) {
  for (var i = 0; i < platforms.length; i++) {
    var p = platforms[i];
    if (entity.vy < 0) continue;
    if (entity.x + entity.w <= p.x || entity.x >= p.x + p.w) continue;
    var prevBottom = entity.y + entity.h - entity.vy;
    var currBottom = entity.y + entity.h;
    if (prevBottom <= p.y + 2 && currBottom >= p.y - 2) {
      entity.y        = p.y - entity.h;
      entity.vy       = 0;
      entity.onGround = true;
      return true;
    }
  }
  return false;
}

function shadeColor(hex, amount) {
  try {
    var num = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (num >> 16)          + amount));
    var g = Math.max(0, Math.min(255, ((num >> 8) & 0xff)  + amount));
    var b = Math.max(0, Math.min(255, (num & 0xff)          + amount));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  } catch (e) { return hex; }
}

function px(ctx, text, x, y, size, color, align, shadow) {
  if (align  === undefined) align  = 'left';
  if (shadow === undefined) shadow = true;
  ctx.font = size + 'px "Press Start 2P", monospace';
  ctx.textAlign    = align;
  ctx.textBaseline = 'top';
  if (shadow) { ctx.fillStyle = '#000'; ctx.fillText(text, x + 1, y + 1); }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);     ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);     ctx.quadraticCurveTo(x,     y + h, x, y + h - r);
  ctx.lineTo(x, y + r);         ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
}

function drawStarfield(ctx, stars) {
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    ctx.fillStyle = 'rgba(255,255,255,' + s.b + ')';
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
}

function makeStars(count, w, h) {
  var arr = [];
  for (var i = 0; i < count; i++) {
    arr.push({ x: Math.random() * w, y: Math.random() * h, r: rndInt(1, 2), b: rnd(0.3, 1) });
  }
  return arr;
}

function drawBgScenery(ctx, cfg, offset, groundY, viewH) {
  var col1 = cfg.bg[1];
  var col2 = cfg.bg[2];
  for (var i = 0; i < 8; i++) {
    var bx = ((i * 120 - (offset * 0.4) % 960) + 960) % 960 - 60;
    var bh = 40 + (i % 3) * 20;
    ctx.fillStyle = col1;
    ctx.fillRect(bx, groundY - bh, 80, bh);
  }
  for (var j = 0; j < 5; j++) {
    var bx2 = ((j * 180 - (offset * 0.25) % 900) + 900) % 900 - 80;
    var bh2 = 60 + (j % 4) * 15;
    ctx.fillStyle = col2;
    ctx.fillRect(bx2, groundY - bh2, 100, bh2);
    ctx.fillStyle = 'rgba(255,255,180,0.25)';
    for (var wy = groundY - bh2 + 8; wy < groundY - 10; wy += 14) {
      for (var wx = bx2 + 8; wx < bx2 + 90; wx += 16) ctx.fillRect(wx, wy, 8, 8);
    }
  }
}

function formatKey(key) {
  var map = {
    ' ': 'SPACE', 'Shift': 'SHIFT',
    'ArrowLeft': 'LEFT', 'ArrowRight': 'RIGHT',
    'ArrowUp': 'UP', 'ArrowDown': 'DOWN',
    'Control': 'CTRL', 'Enter': 'ENTER', 'Escape': 'ESC',
  };
  return map[key] !== undefined ? map[key] : key.toUpperCase();
}

/* ── Persistence shim ───────────────────────────────────────────────────── */
var persistence = {
  setItem:    function(key, value) { return window.persistentStorage ? window.persistentStorage.setItem(key, value) : Promise.resolve(); },
  getItem:    function(key)        { return window.persistentStorage ? window.persistentStorage.getItem(key)        : Promise.resolve(null); },
  removeItem: function(key)        { return window.persistentStorage ? window.persistentStorage.removeItem(key)     : Promise.resolve(); },
  clear:      function()           { return window.persistentStorage ? window.persistentStorage.clear()             : Promise.resolve(); },
};
