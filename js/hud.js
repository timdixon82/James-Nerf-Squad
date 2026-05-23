
/**
 * hud.js
 * In-game heads-up display and boss health bar.
 */

function drawHeart(ctx, x, y, size) {
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(x + 1, y,       size - 2, size - 4);
  ctx.fillRect(x,     y + 1,   size,     size - 5);
  ctx.fillRect(x + 1, y + size - 4, size - 2, 2);
  ctx.fillRect(x + 2, y + size - 2, size - 4, 2);
  ctx.fillRect(x + 3, y + size - 1, size - 6, 1);
}

function drawHUD(ctx, lives, score, blaster, ammo, hasShield, speedBoost, megaDartReady, squadActive, level, levelName, touchMode) {
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, CANVAS_W, 20);

  for (var i = 0; i < lives; i++) drawHeart(ctx, 4 + i * 14, 5, 10);
  px(ctx, '' + score, CANVAS_W / 2, 5, 6, '#ffff44', 'center');
  px(ctx, 'LV' + (level + 1) + ' ' + levelName, CANVAS_W - 4, 5, 5, '#aaffff', 'right');

  var viewH = touchMode ? CANVAS_H - TOUCH_HUD_H : CANVAS_H;
  var barY  = viewH - 18;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, barY, CANVAS_W, 18);

  var bDef    = BLASTERS[blaster];
  var ammoVal = ammo[blaster] !== undefined ? ammo[blaster] : 0;
  var ammoStr = blaster === 'pistol' ? 'INF' : '' + ammoVal;
  px(ctx, bDef.name.toUpperCase(), 4, barY + 4, 4, bDef.color);
  px(ctx, 'AMMO: ' + ammoStr, 4, barY + 11, 4, '#fff');

  var activePUs = [];
  if (hasShield)       activePUs.push('shield');
  if (speedBoost > 0)  activePUs.push('speed');
  if (megaDartReady)   activePUs.push('megadart');
  if (squadActive > 0) activePUs.push('squad');
  for (var pi = 0; pi < activePUs.length; pi++) {
    drawPowerUpIcon(ctx, activePUs[pi], CANVAS_W / 2 - 20 + pi * 22, barY + 9, 14);
  }

  px(ctx, touchMode ? 'TAP' : 'SPACE=SHOOT', CANVAS_W - 4, barY + 11, 4, '#888', 'right');
  ctx.restore();
}

function drawBossBar(ctx, bossName, hp, maxHp) {
  var barW = CANVAS_W - 60;
  var barX = 30;
  var barY = 22;

  ctx.save();
  ctx.fillStyle   = 'rgba(0,0,0,0.75)';
  ctx.fillRect(barX - 6, barY - 1, barW + 12, 22);
  ctx.strokeStyle = 'rgba(255,50,50,0.6)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(barX - 6, barY - 1, barW + 12, 22);

  px(ctx, '! ' + bossName, CANVAS_W / 2, barY + 1, 4, '#ff4444', 'center');

  var pct      = clamp(hp / maxHp, 0, 1);
  var barColor = pct > 0.6 ? '#ff4444' : pct > 0.3 ? '#ff8800' : '#ff0000';
  ctx.fillStyle = '#1a0000'; ctx.fillRect(barX, barY + 12, barW, 6);
  ctx.fillStyle = barColor;  ctx.fillRect(barX, barY + 12, barW * pct, 6);

  ctx.shadowBlur  = 6;
  ctx.shadowColor = barColor;
  ctx.fillStyle   = barColor;
  ctx.fillRect(barX, barY + 12, barW * pct, 2);
  ctx.shadowBlur  = 0;

  ctx.strokeStyle = 'rgba(255,80,80,0.8)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(barX, barY + 12, barW, 6);
  ctx.restore();
}
