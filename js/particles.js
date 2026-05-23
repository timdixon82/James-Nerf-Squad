
/**
 * particles.js
 * Simple particle system.
 */

function spawnParticles(arr, x, y, color, count, speed, text) {
  if (speed === undefined) speed = 2;
  for (var i = 0; i < count; i++) {
    var angle = (i / count) * Math.PI * 2;
    arr.push({
      x: x, y: y,
      vx: Math.cos(angle) * rnd(0.5, speed),
      vy: Math.sin(angle) * rnd(0.5, speed),
      life: 30, maxLife: 30,
      color: color, r: rndInt(2, 4),
      text: i === 0 ? text : undefined,
    });
  }
}

function updateParticles(arr) {
  for (var i = arr.length - 1; i >= 0; i--) {
    var p = arr[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.08;
    p.life--;
    if (p.life <= 0) arr.splice(i, 1);
  }
}

function drawParticles(ctx, arr) {
  for (var i = 0; i < arr.length; i++) {
    var p = arr[i];
    ctx.globalAlpha = p.life / p.maxLife;
    if (p.text) {
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    }
  }
  ctx.globalAlpha = 1;
}
