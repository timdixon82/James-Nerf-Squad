
/**
 * boss.js
 * Boss creation, update, and rendering.
 */

function createBoss(levelIdx, groundY) {
  var type = Math.max(1, Math.min(3, Math.floor(levelIdx / 3) + 1));
  // The first boss level (index 2) is stationary so new players can learn boss
  // patterns before movement is added at later boss levels (indices 5 and 8).
  var stationary = (levelIdx === 2);
  // Place a stationary boss on the right side of the starting viewport.
  var startX = stationary ? CANVAS_W * 0.75 : CANVAS_W * 0.6;
  return {
    x: startX, y: groundY - 60,
    vx: 0.75, vy: 0,
    hp: 20 + type * 10, maxHp: 20 + type * 10,
    phase:       0,
    attackTimer: 80,
    hurtTimer:   0,
    alive:       true,
    w: type === 2 ? 50 : 40,
    h: type === 2 ? 50 : 60,
    dir:      -1,
    stomping: false,
    stompTimer: 0,
    type: type,
    anim: 0,
    stationary: stationary,
  };
}

function updateBoss(boss, player, darts, platforms, groundY, particles, camX) {
  if (!boss.alive) return;
  boss.anim++;
  boss.hurtTimer = Math.max(0, boss.hurtTimer - 1);
  boss.phase = boss.hp < boss.maxHp * 0.33 ? 2
             : boss.hp < boss.maxHp * 0.66 ? 1 : 0;
  // Base speed halved from original 1.2 so the boss feels more manageable.
  // Phase bonuses halved proportionally (was +0.6 per phase, now +0.3).
  var speed = 0.6 + boss.phase * 0.3;

  // Anchor the boss roaming zone to the camera so it follows the player across the scrolling world.
  var zoneLeft  = camX + 40;
  var zoneRight = camX + CANVAS_W - 40;

  if (boss.type === 2) {
    boss.y  = groundY - boss.h - 60 + Math.sin(boss.anim * 0.04) * 20;
    if (!boss.stationary) {
      boss.x += boss.vx * speed;
      if (boss.x < zoneLeft || boss.x > zoneRight) {
        boss.vx *= -1;
        // Clamp so the boss cannot drift permanently out of the visible zone.
        boss.x = Math.max(zoneLeft, Math.min(zoneRight, boss.x));
      }
    }
  } else {
    boss.vy = clamp(boss.vy + GRAVITY, -15, 12);
    if (!boss.stationary) {
      boss.x += boss.vx * speed;
    }
    boss.y += boss.vy;
    boss.stomping = false;
    if (boss.y + boss.h >= groundY) { boss.y = groundY - boss.h; boss.vy = 0; }
    if (!boss.stationary && (boss.x < zoneLeft || boss.x > zoneRight)) {
      boss.vx *= -1;
      boss.dir = boss.vx > 0 ? 1 : -1;
      boss.x = Math.max(zoneLeft, Math.min(zoneRight, boss.x));
    }
  }

  boss.attackTimer--;
  if (boss.attackTimer <= 0) {
    boss.attackTimer = Math.max(30, 80 - boss.phase * 20);
    var dx   = player.x - boss.x;
    var dy   = (player.y + player.h / 2) - (boss.y + boss.h / 2);
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (boss.type === 1) {
      for (var a = -2; a <= 2; a++) {
        var rad = Math.atan2(dy, dx) + a * 0.2;
        darts.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2,
          vx: Math.cos(rad) * 4, vy: Math.sin(rad) * 4,
          w: DART_W, h: DART_H, damage: 1, fromPlayer: false, mega: false, color: '#ff2200', alive: true });
      }
    } else if (boss.type === 2) {
      var count = 3 + boss.phase;
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2;
        darts.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2,
          vx: Math.cos(angle) * 3.5, vy: Math.sin(angle) * 3.5,
          w: 6, h: 6, damage: 1, fromPlayer: false, mega: false, color: '#00ffff', alive: true });
      }
    } else {
      darts.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2,
        vx: (dx / dist) * 5, vy: (dy / dist) * 5,
        w: DART_W, h: DART_H, damage: 1, fromPlayer: false, mega: false, color: '#ff00ff', alive: true });
      if (boss.phase > 0) {
        for (var s = -1; s <= 1; s += 2) {
          var srad = Math.atan2(dy, dx) + s * 0.3;
          darts.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2,
            vx: Math.cos(srad) * 4.5, vy: Math.sin(srad) * 4.5,
            w: DART_W, h: DART_H, damage: 1, fromPlayer: false, mega: false, color: '#ff66ff', alive: true });
        }
      }
    }
    spawnParticles(particles, boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffff00', 3, 2);
  }
}

function drawBoss(ctx, boss) {
  if (!boss.alive) return;
  var x = boss.x, y = boss.y, w = boss.w, h = boss.h;
  var hp = boss.hp, maxHp = boss.maxHp, phase = boss.phase;
  var hurtTimer = boss.hurtTimer, type = boss.type, anim = boss.anim, dir = boss.dir;
  var flash = hurtTimer > 0 && Math.floor(hurtTimer / 3) % 2 === 0;
  ctx.save();
  if (flash) ctx.globalAlpha = 0.4;

  if (type === 1) {
    ctx.fillStyle = phase > 1 ? '#cc0000' : phase > 0 ? '#cc4400' : '#884400';
    ctx.fillRect(x + 2, y + 18, w - 4, h - 18);
    ctx.fillStyle = '#ffbb44'; ctx.fillRect(x + 4, y, w - 8, 20);
    ctx.fillStyle = '#000';    ctx.fillRect(x + 8, y + 5, 5, 5); ctx.fillRect(x + w - 13, y + 5, 5, 5);
    ctx.fillStyle = '#ff4400'; ctx.fillRect(x + 10, y + 13, w - 20, 3);
    ctx.fillStyle = '#222';    ctx.fillRect(x + 6, y - 8, w - 12, 10); ctx.fillRect(x + 2, y - 2, w - 4, 3);
    ctx.fillStyle = '#885500'; ctx.fillRect(x - 5, y + 22, 8, 5); ctx.fillRect(x + w - 3, y + 22, 8, 5);
  } else if (type === 2) {
    ctx.fillStyle = phase > 1 ? '#003388' : phase > 0 ? '#0055bb' : '#0077dd';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#00aaff'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    var eyeW = 8, eyeH = 10;
    ctx.fillStyle = '#ff0000'; ctx.fillRect(x + w / 2 - eyeW / 2, y + h / 2 - eyeH / 2, eyeW, eyeH);
    ctx.fillStyle = '#aaa';    ctx.fillRect(x + w / 2 - 1, y - 10, 2, 10); ctx.fillRect(x + w / 2 - 4, y - 10, 8, 2);
    var rot = anim * 0.3;
    ctx.save(); ctx.translate(x - 8, y + h / 2); ctx.rotate(rot);
    ctx.fillStyle = '#aaa'; ctx.fillRect(-8, -1, 16, 2); ctx.restore();
    ctx.save(); ctx.translate(x + w + 8, y + h / 2); ctx.rotate(-rot);
    ctx.fillStyle = '#aaa'; ctx.fillRect(-8, -1, 16, 2); ctx.restore();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2;
    ctx.strokeRect(x + w / 2 - eyeW / 2 - 1, y + h / 2 - eyeH / 2 - 1, eyeW + 2, eyeH + 2);
  } else {
    ctx.fillStyle = phase > 1 ? '#880088' : phase > 0 ? '#aa00aa' : '#660066';
    ctx.fillRect(x + 2, y + 9, w - 4, h - 9);
    ctx.fillStyle = '#ddaa00'; ctx.fillRect(x + 2, y, w - 4, 10);
    ctx.fillStyle = '#331100'; ctx.fillRect(x + 2, y, w - 4, 3);
    ctx.fillStyle = '#fff';    ctx.fillRect(x + w - 8, y + 3, 3, 3);
    ctx.fillStyle = '#111';    ctx.fillRect(x + w - 7, y + 4, 2, 2);
    ctx.fillStyle = '#ff00ff'; ctx.fillRect(x + (dir === 1 ? w - 2 : -8), y + 11, 10, 4);
    ctx.fillStyle = '#440044';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y); ctx.lineTo(x - 4, y + h * 0.6); ctx.lineTo(x + w + 4, y + h * 0.6);
    ctx.closePath(); ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
