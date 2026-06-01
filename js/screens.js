
/**
 * screens.js
 * Pure render functions for every non-gameplay screen.
 */

/* ── Title ──────────────────────────────────────────────────────────────── */

function drawTitleScreen(ctx, frame, skinColor, hairColor, clothColor, menuIdx, touchMode, touchDetected) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  var pulse = 0.85 + Math.sin(frame * 0.04) * 0.15;
  ctx.save(); ctx.translate(CANVAS_W / 2, 50); ctx.scale(pulse, pulse);
  px(ctx, "JAMES'",      0, -28, 11, '#ffff00', 'center');
  px(ctx, 'NERF SQUAD',  0,  -4, 10, '#ff6600', 'center');
  ctx.restore();

  _drawTitlePlayer(ctx, CANVAS_W / 2 - 10, 92, skinColor, hairColor, clothColor, frame);

  var menuItems = [
    { label: 'PLAY GAME',  key: 'ENTER' },
    { label: 'CUSTOMISE',  key: 'C'     },
    { label: 'HELP',       key: 'H'     },
    { label: 'SETTINGS',   key: 'T'     },
  ];
  if (touchDetected === null) menuItems.push({ label: touchMode ? 'TOUCH: ON' : 'TOUCH: OFF', key: 'X' });

  var menuStartY  = 130;
  var menuItemH   = 22;
  for (var i = 0; i < menuItems.length; i++) {
    var item  = menuItems[i];
    var iy    = menuStartY + i * menuItemH;
    var sel   = menuIdx === i;
    var flash = sel && Math.floor(frame / 12) % 2 === 0;
    if (sel) { ctx.fillStyle = 'rgba(255,255,100,0.12)'; ctx.fillRect(CANVAS_W / 2 - 120, iy - 3, 240, 18); }
    if (sel) px(ctx, '>', CANVAS_W / 2 - 100, iy, 6, flash ? '#ffff00' : '#ff8800');
    px(ctx, item.label, CANVAS_W / 2, iy, 6, sel ? (flash ? '#ffff00' : '#fff') : UI_TEXT_DIM, 'center');
    px(ctx, '[' + item.key + ']', CANVAS_W / 2 + 102, iy + 1, 4, sel ? '#888' : '#555', 'left');
  }

  px(ctx, 'UP/DOWN NAV  ENTER SELECT', CANVAS_W / 2, CANVAS_H - 12, 4, '#555', 'center');
}

function _drawTitlePlayer(ctx, x, y, skinColor, hairColor, clothColor, frame) {
  var sc = 3;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = clothColor; ctx.fillRect(-4,  4, 10, 10);
  ctx.fillStyle = skinColor;  ctx.fillRect(-3, -4,  8,  8);
  ctx.fillStyle = hairColor;  ctx.fillRect(-3, -4,  8,  2);
  ctx.fillStyle = '#fff';     ctx.fillRect( 2, -2,  2,  2);
  ctx.fillStyle = '#111';     ctx.fillRect( 3, -1,  1,  1);
  ctx.fillStyle = '#ff8800';  ctx.fillRect( 6,  5 + Math.round(Math.sin(frame * 0.08)), 4, 2);
  ctx.restore();
}

/* ── Customise ──────────────────────────────────────────────────────────── */

function drawCustomiseScreen(ctx, skinColor, hairColor, clothColor, skinIdx, hairIdx, clothIdx, focusIdx, frame) {
  ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  px(ctx, 'CUSTOMISE', CANVAS_W / 2, 10, 8, '#ffff00', 'center');

  var ps = 5;
  ctx.save(); ctx.translate(CANVAS_W / 2, 68); ctx.scale(ps, ps);
  ctx.fillStyle = clothColor;                  ctx.fillRect(-5,  4, 10, 11);
  ctx.fillStyle = shadeColor(clothColor, -30); ctx.fillRect(-5, 13,  4,  6); ctx.fillRect(1, 13, 4, 6);
  ctx.fillStyle = skinColor;                   ctx.fillRect(-4, -5,  8,  9);
  ctx.fillStyle = hairColor;                   ctx.fillRect(-4, -5,  8,  2);
  ctx.fillStyle = '#fff';                      ctx.fillRect( 1, -3,  2,  2);
  ctx.fillStyle = '#111';                      ctx.fillRect( 2, -2,  1,  1);
  ctx.fillStyle = '#ff8800';                   ctx.fillRect( 5,  5,  3,  2);
  ctx.restore();

  var rowW = SKIN_COLORS.length * 24;
  var rowX = (CANVAS_W - rowW) / 2;

  function drawRow(label, colors, selectedIdx, rowY, focused) {
    px(ctx, label, CANVAS_W / 2, rowY - 12, 5, focused ? '#ffff44' : UI_TEXT_DIM, 'center');
    for (var ci = 0; ci < colors.length; ci++) {
      var col = colors[ci];
      var cx2 = rowX + ci * 24 + 9;
      var cy2 = rowY + 9;
      ctx.fillStyle = col; ctx.fillRect(cx2 - 9, cy2 - 9, 18, 18);
      if (ci === selectedIdx) {
        ctx.strokeStyle = focused ? '#ffff00' : '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(cx2 - 10, cy2 - 10, 20, 20);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(cx2 - 3, cy2 - 1, 3, 3); ctx.fillRect(cx2 - 1, cy2 + 1, 6, 3);
      }
    }
    if (focused) px(ctx, '< A  D >', CANVAS_W / 2, rowY + 22, 4, '#888', 'center');
  }

  drawRow('SKIN',     SKIN_COLORS,  skinIdx,  118, focusIdx === 0);
  drawRow('HAIR',     HAIR_COLORS,  hairIdx,  158, focusIdx === 1);
  drawRow('CLOTHING', CLOTH_COLORS, clothIdx, 198, focusIdx === 2);

  var backY   = 232;
  var backSel = focusIdx === 3;
  var backFlash = backSel && Math.floor(frame / 15) % 2 === 0;
  ctx.fillStyle = backSel ? 'rgba(255,255,100,0.15)' : 'rgba(0,0,0,0.3)';
  ctx.fillRect(CANVAS_W / 2 - 55, backY - 4, 110, 18);
  px(ctx, backSel ? '> BACK' : '  BACK', CANVAS_W / 2, backY, 6,
     backFlash ? '#ffff00' : (backSel ? '#fff' : '#777'), 'center');
  px(ctx, 'UP/DOWN ROW  LEFT/RIGHT COLOUR  ESC BACK', CANVAS_W / 2, CANVAS_H - 10, 4, '#555', 'center');
}

/* ── Level Select ───────────────────────────────────────────────────────── */

function drawLevelSelect(ctx, completedLevels, highScores, currentHover, frame) {
  ctx.fillStyle = '#111122'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  px(ctx, 'MISSION SELECT', CANVAS_W / 2, 10, 7, '#ffff00', 'center');

  var cols = 3, startX = 30, startY = 35, cellW = 130, cellH = 50;
  for (var i = 0; i < 9; i++) {
    var col = i % cols, row = Math.floor(i / cols);
    var bx = startX + col * cellW, by = startY + row * cellH;
    var unlocked = i === 0 || completedLevels.has(i - 1);
    var completed = completedLevels.has(i);
    var isBoss    = (i + 1) % 3 === 0;
    var hover     = currentHover === i;

    ctx.fillStyle   = hover ? (unlocked ? '#334488' : '#222') : (unlocked ? '#223366' : '#111');
    ctx.fillRect(bx, by, cellW - 8, cellH - 6);
    ctx.strokeStyle = isBoss ? '#ff4444' : (completed ? '#44ff44' : (unlocked ? '#4488ff' : '#444'));
    ctx.lineWidth   = hover ? 2 : 1;
    ctx.strokeRect(bx, by, cellW - 8, cellH - 6);

    px(ctx, 'LV ' + (i + 1), bx + 4, by + 4, 6, unlocked ? '#fff' : '#555');
    if (isBoss)      px(ctx, 'BOSS',  bx + 4, by + 14, 5, '#ff8a7a');
    if (completed)   {
      px(ctx, '***', bx + 4, by + 26, 6, '#ffff00');
      if (highScores[i]) px(ctx, 'HI:' + highScores[i], bx + 4, by + 35, 4, '#aaffaa');
    } else if (!unlocked) {
      px(ctx, 'LOCKED', bx + 4, by + 22, 5, '#666');
    }
    if (hover && unlocked && Math.floor(frame / 15) % 2) {
      ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, cellW - 10, cellH - 8);
    }
  }
  px(ctx, 'ARROWS  ENTER=START  ESC=BACK', CANVAS_W / 2, CANVAS_H - 12, 4, '#888', 'center');
}

/* ── Boss Intro ─────────────────────────────────────────────────────────── */

function drawBossIntro(ctx, bossName, bossSubtitle, timer) {
  var alpha = timer > 150 ? (180 - timer) / 30 : Math.min(1, timer / 30);
  ctx.fillStyle = 'rgba(0,0,0,' + (alpha * 0.85) + ')';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  var blink = Math.floor(timer / 8) % 2;
  if (alpha > 0.3) {
    px(ctx, '! WARNING !',  CANVAS_W / 2, CANVAS_H / 2 - 40, 8, blink ? '#ff0000' : '#ff8800', 'center');
    px(ctx, bossName,          CANVAS_W / 2, CANVAS_H / 2 - 10, 9, '#ffffff', 'center');
    px(ctx, bossSubtitle,      CANVAS_W / 2, CANVAS_H / 2 + 15, 5, '#ffaaaa', 'center');
    px(ctx, '! BOSS FIGHT !', CANVAS_W / 2, CANVAS_H / 2 + 35, 6, blink ? '#ffff00' : '#ff8800', 'center');
  }
}

/* ── Level Complete ─────────────────────────────────────────────────────── */

function drawLevelComplete(ctx, level, score, unlockMsg, frame) {
  ctx.fillStyle = 'rgba(0,0,20,0.85)'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (var i = 0; i < 12; i++) {
    var angle = (i / 12) * Math.PI * 2 + frame * 0.01;
    ctx.strokeStyle = 'hsla(' + (i * 30) + ',100%,60%,0.3)'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(CANVAS_W / 2, CANVAS_H / 2);
    ctx.lineTo(CANVAS_W / 2 + Math.cos(angle) * 300, CANVAS_H / 2 + Math.sin(angle) * 300); ctx.stroke();
  }
  px(ctx, 'MISSION COMPLETE!', CANVAS_W / 2, 40,  7, '#ffff00', 'center');
  px(ctx, "JAMES'!",           CANVAS_W / 2, 56, 10, '#ff8800', 'center');
  var stars   = score > 3000 ? 3 : score > 1500 ? 2 : 1;
  var starStr = '';
  for (var si = 0; si < 3; si++) starStr += si < stars ? '*' : 'o';
  px(ctx, starStr, CANVAS_W / 2, 85, 14, '#ffff00', 'center');
  px(ctx, 'SCORE: ' + score,       CANVAS_W / 2, 115, 6, '#fff',     'center');
  px(ctx, 'LEVEL ' + (level + 1) + ' CLEAR', CANVAS_W / 2, 132, 5, '#aaffaa', 'center');
  if (unlockMsg) px(ctx, unlockMsg, CANVAS_W / 2, 150, 5, Math.floor(frame / 20) % 2 ? '#ffff00' : '#ff8800', 'center');
  px(ctx, Math.floor(frame / 25) % 2 ? '> PRESS SPACE' : '  PRESS SPACE', CANVAS_W / 2, 200, 5, '#fff', 'center');
}

/* ── Game Over ──────────────────────────────────────────────────────────── */

function drawGameOver(ctx, score, frame, menuIdx) {
  ctx.fillStyle = 'rgba(0,0,0,0.92)'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (var i = 0; i < 8; i++) {
    var angle = (i / 8) * Math.PI * 2 + frame * 0.005;
    ctx.strokeStyle = 'rgba(180,0,0,0.12)'; ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(CANVAS_W / 2, CANVAS_H / 2);
    ctx.lineTo(CANVAS_W / 2 + Math.cos(angle) * 300, CANVAS_H / 2 + Math.sin(angle) * 300); ctx.stroke();
  }
  var shake = Math.floor(frame / 4) % 2 === 0 ? 1 : -1;
  px(ctx, 'GAME OVER', CANVAS_W / 2 + shake, 38, 12, '#ff7a5c', 'center');
  px(ctx, 'FINAL SCORE', CANVAS_W / 2, 72, 5, '#888', 'center');
  px(ctx, '' + score,    CANVAS_W / 2, 88, 10, '#ffff44', 'center');
  var stars = score > 3000 ? 3 : score > 1500 ? 2 : score > 500 ? 1 : 0;
  var starStr = '';
  for (var si = 0; si < 3; si++) starStr += si < stars ? '*' : 'o';
  px(ctx, starStr, CANVAS_W / 2, 110, 10, stars > 0 ? '#ffff00' : '#444', 'center');

  var items      = [{ label: 'RETRY MISSION', key: 'R' }, { label: 'MAIN MENU', key: 'ESC' }];
  var menuStartY = 145, menuItemH = 28;
  for (var mi = 0; mi < items.length; mi++) {
    var item  = items[mi];
    var iy    = menuStartY + mi * menuItemH;
    var sel   = menuIdx === mi;
    var flash = sel && Math.floor(frame / 12) % 2 === 0;
    ctx.fillStyle   = sel ? 'rgba(255,255,100,0.13)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(CANVAS_W / 2 - 110, iy - 4, 220, 20);
    if (sel) {
      ctx.strokeStyle = flash ? '#ffff00' : '#ff8800'; ctx.lineWidth = 1.5;
      ctx.strokeRect(CANVAS_W / 2 - 110, iy - 4, 220, 20);
    }
    if (sel) px(ctx, '>', CANVAS_W / 2 - 94, iy, 6, flash ? '#ffff00' : '#ff8800');
    px(ctx, item.label, CANVAS_W / 2, iy, 6, sel ? (flash ? '#ffff00' : '#fff') : UI_TEXT_DIM, 'center');
    px(ctx, '[' + item.key + ']', CANVAS_W / 2 + 96, iy + 1, 4, sel ? '#888' : '#444', 'left');
  }
  px(ctx, 'UP/DOWN NAV   ENTER SELECT', CANVAS_W / 2, CANVAS_H - 12, 4, '#555', 'center');
}

/* ── Settings ───────────────────────────────────────────────────────────── */

function drawSettings(ctx, keys, rebinding, altButtonLayout, selectedIdx, frame, difficulty) {
  ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  px(ctx, 'SETTINGS', CANVAS_W / 2, 10, 8, '#ffff00', 'center');

  var bindItems = [
    { label: 'MOVE LEFT',  key: 'left'   },
    { label: 'MOVE RIGHT', key: 'right'  },
    { label: 'JUMP',       key: 'jump'   },
    { label: 'SHOOT',      key: 'shoot'  },
    { label: 'SWITCH GUN', key: 'switch' },
    { label: 'PAUSE',      key: 'pause'  },
  ];

  for (var i = 0; i < bindItems.length; i++) {
    var item    = bindItems[i];
    var iy      = 40 + i * 22;
    var sel     = selectedIdx === i;
    var binding = rebinding === item.key;
    ctx.fillStyle = sel ? 'rgba(255,255,255,0.08)' : 'transparent';
    ctx.fillRect(20, iy - 2, CANVAS_W - 40, 18);
    px(ctx, item.label, 24, iy, 5, sel ? '#ffff44' : '#ccc');
    var keyStr = binding ? '[ PRESS KEY ]' : formatKey(keys[item.key] || '?');
    px(ctx, keyStr, CANVAS_W - 24, iy, 5, binding ? '#ff8800' : (sel ? '#88ff88' : UI_TEXT_DIM), 'right');
  }

  var lhY    = 40 + bindItems.length * 22 + 8;
  var lhSel  = selectedIdx === bindItems.length;
  var rowH   = 30;
  ctx.fillStyle = lhSel ? 'rgba(255,255,255,0.08)' : 'transparent';
  ctx.fillRect(20, lhY - 2, CANVAS_W - 40, rowH);
  px(ctx, 'ALT BUTTON LAYOUT', 24, lhY, 5, lhSel ? '#ffff44' : '#ccc');
  px(ctx, altButtonLayout ? 'ON' : 'OFF', CANVAS_W - 24, lhY, 5, altButtonLayout ? '#88ff88' : '#ff6666', 'right');
  px(ctx, altButtonLayout ? 'FIRE=LEFT  D-PAD=RIGHT' : 'D-PAD=LEFT  FIRE=RIGHT',
     CANVAS_W / 2, lhY + 14, 4, '#777', 'center', false);

  var spY   = lhY + rowH + 4;
  var spSel = selectedIdx === bindItems.length + 1;
  ctx.fillStyle = spSel ? 'rgba(255,255,255,0.08)' : 'transparent';
  ctx.fillRect(20, spY - 2, CANVAS_W - 40, rowH);
  px(ctx, 'SPEED', 24, spY, 5, spSel ? '#ffff44' : '#ccc');
  px(ctx, difficulty === 'easy' ? 'EASY' : 'HARD', CANVAS_W - 24, spY, 5,
     difficulty === 'easy' ? '#88ff88' : '#ff6666', 'right');
  px(ctx, difficulty === 'easy' ? 'EASY = HALF SPEED' : 'HARD = FULL SPEED',
     CANVAS_W / 2, spY + 14, 4, '#777', 'center', false);

  px(ctx, 'UP/DOWN=SELECT  ENTER=CHANGE  ESC=BACK', CANVAS_W / 2, CANVAS_H - 14, 4, '#555', 'center');
}

/* ── Pause Menu ─────────────────────────────────────────────────────────── */

function drawPauseMenu(ctx, frame, pauseMenuIdx, autoUsePowerups) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  var panW = 240, panH = 152;
  var panX = CANVAS_W / 2 - panW / 2, panY = CANVAS_H / 2 - panH / 2;
  ctx.fillStyle = '#0a0a2a'; roundRect(ctx, panX, panY, panW, panH, 8); ctx.fill();
  ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2; roundRect(ctx, panX, panY, panW, panH, 8); ctx.stroke();
  px(ctx, 'PAUSED', CANVAS_W / 2, panY + 12, 8, '#ffff00', 'center');

  // Item 0: RESUME, Item 1: AUTO POWERUPS toggle, Item 2: EXIT TO MENU
  var items = [
    { label: 'RESUME' },
    { label: 'AUTO POWERUPS: ' + (autoUsePowerups ? 'ON ' : 'OFF'), hint: 'ENTER' },
    { label: 'EXIT TO MENU' },
  ];
  for (var i = 0; i < items.length; i++) {
    var iy    = panY + 44 + i * 28;
    var sel   = pauseMenuIdx === i;
    var flash = sel && Math.floor(frame / 12) % 2 === 0;
    ctx.fillStyle = sel ? 'rgba(255,255,100,0.15)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(panX + 10, iy - 4, panW - 20, 20);
    if (sel) { ctx.strokeStyle = flash ? '#ffff00' : '#ff8800'; ctx.lineWidth = 1.5; ctx.strokeRect(panX + 10, iy - 4, panW - 20, 20); }
    if (sel) px(ctx, '>', panX + 18, iy, 6, flash ? '#ffff00' : '#ff8800');
    var col = sel ? (flash ? '#ffff00' : '#fff') : UI_TEXT_DIM;
    px(ctx, items[i].label, CANVAS_W / 2, iy, 6, col, 'center');
  }
  px(ctx, 'UP/DOWN=SELECT  ENTER=TOGGLE/CONFIRM  ESC=RESUME', CANVAS_W / 2, panY + panH - 14, 4, '#555', 'center');

  // Version number — decorative supplementary text; contrast ~4.5:1 is acceptable
  // for non-essential information per the brief (R-04).
  var ver = window._gameVersion ? 'v' + window._gameVersion : '';
  if (ver) px(ctx, ver, panX + panW - 6, panY + panH - 5, 4, '#888', 'right');
}

/* ── Inventory ──────────────────────────────────────────────────────────── */

function drawInventoryScreen(ctx, weaponKeys, inventory, currentBlaster, highlightIdx, frame, touchMode, reducedMotion) {

  // Compute unique inventory types with counts
  var typeCounts = {};
  for (var i = 0; i < inventory.length; i++) {
    typeCounts[inventory[i]] = (typeCounts[inventory[i]] || 0) + 1;
  }
  var invTypes = Object.keys(typeCounts);

  // Semi-transparent overlay (same style as pause screen)
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Title
  px(ctx, 'INVENTORY', CANVAS_W / 2, 12, 8, '#ffff44', 'center');
  px(ctx, 'SELECT WEAPON OR USE A POWERUP', CANVAS_W / 2, 26, 4, UI_TEXT_DIM, 'center');

  // --- WEAPONS SECTION ---
  px(ctx, 'WEAPONS', CANVAS_W / 2, 42, 5, '#ffffff', 'center');
  var cellSize    = 44;
  var weaponCols  = 2;
  var weaponStartX = CANVAS_W / 2 - weaponCols * cellSize / 2 - cellSize / 2;
  var weaponStartY = 50;

  for (var wi = 0; wi < weaponKeys.length; wi++) {
    var col = wi % weaponCols;
    var row = Math.floor(wi / weaponCols);
    var cx  = weaponStartX + col * (cellSize + 8) + cellSize / 2;
    var cy  = weaponStartY + row * (cellSize + 4);

    var isEquipped   = weaponKeys[wi] === currentBlaster;
    var isHighlighted = wi === highlightIdx;
    // Reduced-motion: static highlight; normal: pulsing glow
    var hlAlpha = isHighlighted ? (reducedMotion ? 0.28 : 0.18 + Math.sin(frame * 0.12) * 0.10) : 0.06;

    ctx.fillStyle = isHighlighted ? ('rgba(255,255,68,' + hlAlpha + ')') : 'rgba(255,255,255,0.08)';
    ctx.fillRect(cx - cellSize / 2, cy, cellSize, cellSize);

    if (isHighlighted) {
      ctx.strokeStyle = '#ffff44';
      ctx.lineWidth   = 2;
      ctx.strokeRect(cx - cellSize / 2, cy, cellSize, cellSize);
    }

    var blasterData = BLASTERS[weaponKeys[wi]];
    var wColor = blasterData.color || '#ffffff';
    px(ctx, blasterData.name ? blasterData.name.toUpperCase() : weaponKeys[wi].toUpperCase(), cx, cy + 13, 3, wColor, 'center');
    if (isEquipped) {
      px(ctx, 'EQUIPPED', cx, cy + 24, 3, '#44ff44', 'center');
    }
    var ammoStr = 'AMMO:' + blasterData.ammo;
    px(ctx, ammoStr, cx, cy + 35, 3, UI_TEXT_DIM, 'center');
  }

  // --- POWERUPS SECTION ---
  var powerupStartY = weaponStartY + Math.ceil(weaponKeys.length / weaponCols) * (cellSize + 4) + 16;
  px(ctx, 'STORED POWERUPS', CANVAS_W / 2, powerupStartY - 10, 5, '#ffffff', 'center');

  if (invTypes.length === 0) {
    px(ctx, 'No powerups stored.', CANVAS_W / 2, powerupStartY + 16, 5, UI_TEXT_DIM, 'center');
    px(ctx, 'Collect powerups in the level to fill your', CANVAS_W / 2, powerupStartY + 30, 3, UI_TEXT_DIM, 'center');
    px(ctx, 'inventory, then use them from here.', CANVAS_W / 2, powerupStartY + 40, 3, UI_TEXT_DIM, 'center');
  } else {
    var puCols   = 3;
    var puStartX = CANVAS_W / 2 - puCols * cellSize / 2 - cellSize / 2 + 22;
    for (var pi = 0; pi < invTypes.length; pi++) {
      var ptype = invTypes[pi];
      var pcol  = pi % puCols;
      var prow  = Math.floor(pi / puCols);
      var pcx   = puStartX + pcol * (cellSize + 4) + cellSize / 2;
      var pcy   = powerupStartY + prow * (cellSize + 4);

      var puIdx          = weaponKeys.length + pi;
      var isPuHighlighted = puIdx === highlightIdx;
      var puHlAlpha = isPuHighlighted ? (reducedMotion ? 0.28 : 0.18 + Math.sin(frame * 0.12) * 0.10) : 0.06;

      ctx.fillStyle = isPuHighlighted ? ('rgba(255,255,68,' + puHlAlpha + ')') : 'rgba(255,255,255,0.08)';
      ctx.fillRect(pcx - cellSize / 2, pcy, cellSize, cellSize);

      if (isPuHighlighted) {
        ctx.strokeStyle = '#ffff44';
        ctx.lineWidth   = 2;
        ctx.strokeRect(pcx - cellSize / 2, pcy, cellSize, cellSize);
      }

      var puData = POWERUPS[ptype] || { label: ptype, color: '#ffffff' };
      px(ctx, puData.label, pcx, pcy + 14, 4, puData.color, 'center');
      px(ctx, 'x' + typeCounts[ptype], pcx, pcy + 28, 5, '#ffff44', 'center');
    }
  }

  // Footer instructions
  var footerY = CANVAS_H - (touchMode ? 86 : 16);
  px(ctx, touchMode ? 'TAP TO SELECT   BACK = CANCEL' : 'ARROWS: NAVIGATE   ENTER: SELECT   ESC/SHIFT: CLOSE',
     CANVAS_W / 2, footerY, 3, UI_TEXT_DIM, 'center');

  // Touch nav strip
  if (touchMode) {
    drawMenuNavStrip(ctx, getMenuNavButtons('udlrselback'));
  }
}

/* ── Help ───────────────────────────────────────────────────────────────── */

function drawHelpScreen(ctx, page, frame) {
  ctx.fillStyle = '#05050f'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  var totalPages = 4;
  px(ctx, 'HELP  PAGE ' + (page + 1) + '/' + totalPages, CANVAS_W / 2, 8, 5, '#ffff00', 'center');
  ctx.fillStyle = 'rgba(255,255,100,0.2)'; ctx.fillRect(10, 22, CANVAS_W - 20, 1);

  if (page === 0) {
    px(ctx, 'CONTROLS', CANVAS_W / 2, 28, 6, '#ff8800', 'center');
    var controls = [
      ['MOVE',         'LEFT/RIGHT or A/D'],
      ['JUMP',         'UP or W'],
      ['SHOOT',        'SPACE'],
      ['INVENTORY',    'SHIFT (see page 4)'],
      ['PAUSE',        'ESC'],
    ];
    for (var ci = 0; ci < controls.length; ci++) {
      var y = 46 + ci * 18;
      px(ctx, controls[ci][0], 24, y, 5, '#aaffff');
      px(ctx, controls[ci][1], CANVAS_W - 24, y, 5, '#88ff88', 'right');
    }
    px(ctx, 'BLASTERS', CANVAS_W / 2, 140, 6, '#ff8800', 'center');
    var blasters = [
      { key: 'pistol',  col: '#ff8800' },
      { key: 'rifle',   col: '#79caff' },
      { key: 'mega',    col: '#ff8a7a' },
      { key: 'scatter', col: '#88ff44' },
    ];
    for (var bi = 0; bi < blasters.length; bi++) {
      var b = blasters[bi];
      var bdef = BLASTERS[b.key];
      var by2 = 155 + bi * 18;
      ctx.fillStyle = b.col; ctx.fillRect(12, by2 + 4, 8, 5);
      ctx.fillStyle = '#fff'; ctx.fillRect(20, by2 + 5, 3, 3);
      px(ctx, bdef.name.toUpperCase(), 24, by2, 4, b.col);
      px(ctx, 'DMG:' + bdef.damage + ' RATE:' + bdef.fireRate, CANVAS_W - 24, by2, 4, UI_TEXT_DIM, 'right');
    }

  } else if (page === 1) {
    px(ctx, 'ENEMIES', CANVAS_W / 2, 28, 6, '#ff8800', 'center');
    var enemyEntries = [
      { type: 'kid',    label: 'RIVAL KID', desc: '1HP  Fast shooter',   col: '#cc6633', topCol: '#ff9955' },
      { type: 'drone',  label: 'DRONE',     desc: '2HP  Flies overhead', col: '#777788', topCol: '#aaaacc' },
      { type: 'robot',  label: 'ROBOT',     desc: '4HP  Tough walker',   col: '#558866', topCol: '#88ddaa' },
      { type: 'minion', label: 'MINION',    desc: '2HP  Speedy minion',  col: '#9944bb', topCol: '#cc66ff' },
    ];
    for (var ei = 0; ei < enemyEntries.length; ei++) {
      var e = enemyEntries[ei];
      var ey = 45 + ei * 50;
      ctx.save(); ctx.translate(28, ey + 10); ctx.scale(2, 2);
      if (e.type === 'drone') {
        ctx.fillStyle = e.topCol; ctx.fillRect(0,0,16,6); ctx.fillStyle = e.col; ctx.fillRect(2,2,12,4);
        ctx.fillStyle = '#aaa'; ctx.fillRect(-4,-2,4,2); ctx.fillRect(16,-2,4,2); ctx.fillStyle='#f00'; ctx.fillRect(6,3,4,3);
      } else if (e.type === 'robot') {
        ctx.fillStyle = e.topCol; ctx.fillRect(2,0,12,7); ctx.fillStyle=e.col; ctx.fillRect(0,7,16,13);
        ctx.fillStyle = '#ff0'; ctx.fillRect(3,2,4,4); ctx.fillRect(9,2,4,4);
      } else if (e.type === 'minion') {
        ctx.fillStyle = e.col; ctx.fillRect(2,5,8,11); ctx.fillStyle=e.topCol; ctx.fillRect(2,0,8,8);
        ctx.fillStyle = '#222'; ctx.fillRect(4,2,3,3); ctx.fillRect(9,2,3,3);
      } else {
        ctx.fillStyle = e.topCol; ctx.fillRect(2,0,8,9); ctx.fillStyle=e.col; ctx.fillRect(2,9,8,9);
        ctx.fillStyle = '#f9e4b7'; ctx.fillRect(3,1,6,7); ctx.fillStyle='#222'; ctx.fillRect(5,3,2,2); ctx.fillRect(9,3,2,2);
      }
      ctx.restore();
      px(ctx, e.label, 74, ey + 4,  5, '#fff');
      px(ctx, e.desc,  74, ey + 18, 4, UI_TEXT_DIM);
      px(ctx, '+' + ENEMIES[e.type].score, CANVAS_W - 16, ey + 10, 4, '#ffff44', 'right');
    }
    px(ctx, 'BOSSES EVERY 3 LEVELS!', CANVAS_W / 2, 248, 4, Math.floor(frame / 20) % 2 ? '#ff8a7a' : '#ff8800', 'center');

  } else if (page === 2) {
    px(ctx, 'POWER-UPS', CANVAS_W / 2, 28, 6, '#ff8800', 'center');
    var puKeys = Object.keys(POWERUPS);
    for (var pui = 0; pui < puKeys.length; pui++) {
      var pkey = puKeys[pui];
      var def  = POWERUPS[pkey];
      var py2  = 48 + pui * 38;
      var bob  = Math.sin(frame * 0.1 + pui) * 2;
      ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = def.color;
      drawPowerUpIcon(ctx, pkey, 27, py2 + 13 + bob, 20);
      ctx.shadowBlur = 0; ctx.restore();
      px(ctx, def.label, 46, py2 + 4,  5, def.color);
      px(ctx, def.desc,  46, py2 + 18, 4, UI_TEXT_DIM);
      if (def.duration > 0) px(ctx, (def.duration / 60) + 's', CANVAS_W - 16, py2 + 10, 4, '#88ffff', 'right');
      else                   px(ctx, 'INSTANT',                  CANVAS_W - 16, py2 + 10, 4, '#88ff88', 'right');
    }

  } else if (page === 3) {
    px(ctx, 'INVENTORY', CANVAS_W / 2, 28, 6, '#ff8800', 'center');
    var ldLines = [
      { text: 'By default, powerups are stored when',     y: 52,  col: '#ffffff' },
      { text: 'collected (manual mode).',                  y: 66,  col: UI_TEXT_DIM },
      { text: 'Up to 20 powerups can be stored.',         y: 88,  col: '#aaffaa' },
      { text: 'Press Shift to open the Inventory screen.',y: 110, col: '#ffffff' },
      { text: 'The game pauses while the screen is open.',y: 124, col: UI_TEXT_DIM },
      { text: 'On the Inventory screen:',                 y: 146, col: '#ffff44' },
      { text: 'Choose a weapon to equip it.',             y: 160, col: UI_TEXT_DIM },
      { text: 'Choose a stored powerup to use it.',       y: 174, col: UI_TEXT_DIM },
      { text: 'Press Escape or Shift to close',           y: 196, col: '#ffffff' },
      { text: 'without using anything.',                  y: 210, col: UI_TEXT_DIM },
      { text: 'Pause menu: toggle Auto powerups ON/OFF.', y: 228, col: '#88ffff' },
      { text: 'On touch: tap a cell or tap Back.',        y: 242, col: UI_TEXT_DIM },
    ];
    for (var li = 0; li < ldLines.length; li++) {
      px(ctx, ldLines[li].text, CANVAS_W / 2, ldLines[li].y, 4, ldLines[li].col, 'center');
    }
  }

  ctx.fillStyle = 'rgba(255,255,100,0.2)'; ctx.fillRect(10, CANVAS_H - 26, CANVAS_W - 20, 1);
  px(ctx, 'A/LEFT=PREV   NEXT=D/RIGHT   ESC=BACK', CANVAS_W / 2, CANVAS_H - 18, 4, '#666', 'center');
  for (var di = 0; di < totalPages; di++) {
    ctx.fillStyle = di === page ? '#ffff00' : '#444';
    ctx.beginPath(); ctx.arc(CANVAS_W / 2 - (totalPages - 1) * 8 + di * 16, CANVAS_H - 4, 3, 0, Math.PI * 2); ctx.fill();
  }
}
