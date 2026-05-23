
/**
 * icons.js
 * Pixel-art icon renderers for each power-up type.
 */

function drawIconShield(ctx, cx, cy, size, color) {
  var s = size / 16; ctx.save(); ctx.translate(cx - size / 2, cy - size / 2);
  ctx.fillStyle = color;
  ctx.fillRect(3*s, 1*s, 10*s, 2*s); ctx.fillRect(1*s, 3*s, 14*s, 6*s);
  ctx.fillRect(2*s, 9*s, 12*s, 3*s); ctx.fillRect(4*s, 12*s, 8*s, 2*s); ctx.fillRect(6*s, 14*s, 4*s, 1*s);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(4*s, 2*s, 6*s, 1*s); ctx.fillRect(3*s, 3*s, 2*s, 4*s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(5*s, 5*s, 6*s, 1*s); ctx.fillRect(7*s, 4*s, 2*s, 7*s);
  ctx.restore();
}

function drawIconSpeed(ctx, cx, cy, size, color) {
  var s = size / 16; ctx.save(); ctx.translate(cx - size / 2, cy - size / 2);
  ctx.fillStyle = color;
  ctx.fillRect(9*s,1*s,4*s,1*s); ctx.fillRect(8*s,2*s,4*s,1*s); ctx.fillRect(7*s,3*s,4*s,1*s);
  ctx.fillRect(6*s,4*s,6*s,1*s); ctx.fillRect(5*s,5*s,7*s,1*s); ctx.fillRect(5*s,6*s,7*s,1*s);
  ctx.fillRect(4*s,7*s,8*s,1*s); ctx.fillRect(3*s,8*s,8*s,1*s); ctx.fillRect(4*s,9*s,5*s,1*s);
  ctx.fillRect(3*s,10*s,5*s,1*s); ctx.fillRect(2*s,11*s,5*s,1*s); ctx.fillRect(3*s,12*s,4*s,1*s);
  ctx.fillRect(4*s,13*s,3*s,1*s); ctx.fillRect(5*s,14*s,2*s,1*s);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(8*s,2*s,2*s,1*s); ctx.fillRect(6*s,5*s,2*s,1*s);
  ctx.restore();
}

function drawIconMegaDart(ctx, cx, cy, size, color) {
  var s = size / 16; ctx.save(); ctx.translate(cx - size / 2, cy - size / 2);
  ctx.fillStyle = color;
  ctx.fillRect(1*s,6*s,10*s,4*s); ctx.fillRect(11*s,5*s,1*s,6*s);
  ctx.fillRect(12*s,6*s,1*s,4*s); ctx.fillRect(13*s,7*s,2*s,2*s);
  ctx.fillStyle = shadeColor(color, -40);
  ctx.fillRect(1*s,4*s,3*s,2*s); ctx.fillRect(1*s,10*s,3*s,2*s);
  ctx.fillStyle = '#fff';
  ctx.fillRect(5*s,7*s,2*s,2*s); ctx.fillRect(9*s,7*s,1*s,2*s); ctx.fillRect(3*s,7*s,1*s,2*s);
  ctx.restore();
}

function drawIconSquad(ctx, cx, cy, size, color) {
  var s = size / 16; ctx.save(); ctx.translate(cx - size / 2, cy - size / 2);
  var persons = [{ ox: 2, col: '#44ff88' }, { ox: 6, col: '#ff8844' }, { ox: 10, col: '#88aaff' }];
  for (var pi = 0; pi < persons.length; pi++) {
    var p = persons[pi];
    ctx.fillStyle = '#f4c080'; ctx.fillRect((p.ox+1)*s, 1*s, 2*s, 2*s);
    ctx.fillStyle = p.col;    ctx.fillRect(p.ox*s, 3*s, 4*s, 4*s);
    ctx.fillStyle = '#444';   ctx.fillRect(p.ox*s, 7*s, 2*s, 3*s); ctx.fillRect((p.ox+2)*s, 7*s, 2*s, 3*s);
    ctx.fillStyle = '#aaa';   ctx.fillRect((p.ox+4)*s, 4*s, 2*s, 1*s);
  }
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(7*s,11*s,2*s,1*s); ctx.fillRect(6*s,12*s,4*s,1*s);
  ctx.fillRect(5*s,13*s,6*s,1*s); ctx.fillRect(6*s,14*s,4*s,1*s);
  ctx.restore();
}

function drawIconAmmo(ctx, cx, cy, size, color) {
  var s = size / 16; ctx.save(); ctx.translate(cx - size / 2, cy - size / 2);
  ctx.fillStyle = '#aa7733'; ctx.fillRect(1*s,4*s,14*s,10*s);
  ctx.fillStyle = '#885522'; ctx.fillRect(1*s,7*s,14*s,1*s); ctx.fillRect(7*s,4*s,1*s,10*s);
  ctx.fillStyle = '#664411';
  ctx.fillRect(2*s,4*s,1*s,1*s); ctx.fillRect(13*s,4*s,1*s,1*s);
  ctx.fillRect(2*s,13*s,1*s,1*s); ctx.fillRect(13*s,13*s,1*s,1*s);
  ctx.fillStyle = '#cc9944'; ctx.fillRect(0, 3*s, 16*s, 2*s);
  ctx.fillStyle = color;
  ctx.fillRect(3*s,1*s,2*s,3*s); ctx.fillRect(7*s,0,2*s,3*s); ctx.fillRect(11*s,1*s,2*s,3*s);
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(3*s,0,2*s,1*s); ctx.fillRect(11*s,0,2*s,1*s);
  ctx.restore();
}

function drawPowerUpIcon(ctx, type, cx, cy, size) {
  var colors = { shield: '#4488ff', speed: '#ffff00', megadart: '#ff4400', squad: '#44ff88', ammo: '#ff88ff' };
  var col = colors[type] || '#fff';
  if (type === 'shield')   drawIconShield(ctx, cx, cy, size, col);
  else if (type === 'speed')    drawIconSpeed(ctx, cx, cy, size, col);
  else if (type === 'megadart') drawIconMegaDart(ctx, cx, cy, size, col);
  else if (type === 'squad')    drawIconSquad(ctx, cx, cy, size, col);
  else if (type === 'ammo')     drawIconAmmo(ctx, cx, cy, size, col);
}

function drawPowerUp(ctx, pu, frame) {
  if (!pu.alive) return;
  var bob  = Math.sin(frame * 0.1 + pu.bobOffset) * 2;
  var size = 16;
  var colors = { shield: '#4488ff', speed: '#ffff00', megadart: '#ff4400', squad: '#44ff88', ammo: '#ff88ff' };
  var col  = colors[pu.type] || '#fff';
  ctx.save();
  ctx.translate(0, bob);
  ctx.shadowBlur  = 10;
  ctx.shadowColor = col;
  ctx.fillStyle   = 'rgba(0,0,0,0.6)';
  ctx.fillRect(pu.x - size / 2 - 1, pu.y - size / 2 - 1, size + 2, size + 2);
  ctx.shadowBlur = 0;
  drawPowerUpIcon(ctx, pu.type, pu.x, pu.y, size);
  ctx.restore();
}
