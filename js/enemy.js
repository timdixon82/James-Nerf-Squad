
/**
 * enemy.js
 * Enemy creation, update, and rendering.
 */

function createEnemy(type, x, groundY) {
  var def = ENEMIES[type];
  return {
    x: x,
    y: def.flying ? groundY - 80 - rnd(0, 40) : groundY - def.h,
    vx: choice([-1, 1]) * def.speed,
    vy: 0,
    type: type, hp: def.hp, maxHp: def.hp,
    w: def.w, h: def.h,
    alive: true, onGround: false,
    shootTimer: rndInt(30, def.shootRate),
    hurtTimer:  0,
    dir:        choice([-1, 1]),
    bobPhase:   rnd(0, Math.PI * 2),
    score:      def.score,
  };
}

function updateEnemy(e, player, darts, platforms, groundY, particles, camX, speedMult) {
  if (!e.alive) return;
  speedMult = speedMult || 1;
  var def = ENEMIES[e.type];
  e.hurtTimer = Math.max(0, e.hurtTimer - 1);

  if (def.flying) {
    e.bobPhase += 0.05;
    e.x += e.vx * speedMult;
    e.y  = (groundY - 80) + Math.sin(e.bobPhase) * 12;
    if (e.x < camX + 20 || e.x > camX + CANVAS_W - 20) {
      e.vx *= -1;
      e.dir  = e.vx > 0 ? 1 : -1;
    }
  } else {
    e.vy = clamp(e.vy + GRAVITY, -15, 12);
    e.x += e.vx * speedMult;
    e.y += e.vy;
    e.onGround = false;

    if (e.y + e.h >= groundY) {
      e.y        = groundY - e.h;
      e.vy       = 0;
      e.onGround = true;
    }

    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (e.vy < 0) continue;
      if (e.x + e.w <= p.x || e.x >= p.x + p.w) continue;
      var prevBottom = e.y + e.h - e.vy;
      var currBottom = e.y + e.h;
      if (prevBottom <= p.y + 2 && currBottom >= p.y - 2) {
        e.y        = p.y - e.h;
        e.vy       = 0;
        e.onGround = true;
      }
    }

    if (e.x < camX + 10)            { e.vx =  Math.abs(def.speed); e.dir =  1; }
    if (e.x > camX + CANVAS_W - 10) { e.vx = -Math.abs(def.speed); e.dir = -1; }
  }

  if (def.shootRate > 0) {
    e.shootTimer--;
    if (e.shootTimer <= 0) {
      e.shootTimer = def.shootRate + rndInt(-20, 20);
      var dx   = player.x - e.x;
      var dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 220 && dist > 0) {
        var spd = 3.5 * speedMult;
        darts.push({
          x: e.x + e.w / 2, y: e.y + e.h / 2,
          vx: (dx / dist) * spd, vy: (dy / dist) * spd,
          w: DART_W, h: DART_H, damage: 1,
          fromPlayer: false, mega: false, color: '#ff6600', alive: true,
        });
      }
    }
  }
}

function drawEnemy(ctx, e) {
  if (!e.alive) return;
  var def   = ENEMIES[e.type];
  var flash = e.hurtTimer > 0 && Math.floor(e.hurtTimer / 3) % 2 === 0;
  ctx.save();
  if (flash) ctx.globalAlpha = 0.5;

  if (e.type === 'drone') {
    ctx.fillStyle = def.topColor; ctx.fillRect(e.x, e.y, e.w, e.h * 0.6);
    ctx.fillStyle = def.color;   ctx.fillRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
    ctx.fillStyle = '#aaa';      ctx.fillRect(e.x - 4, e.y - 2, 4, 2); ctx.fillRect(e.x + e.w, e.y - 2, 4, 2);
    ctx.fillStyle = '#f00';      ctx.fillRect(e.x + e.w / 2 - 2, e.y + 3, 4, 3);
  } else if (e.type === 'robot') {
    ctx.fillStyle = def.topColor; ctx.fillRect(e.x + 2, e.y, e.w - 4, 7);
    ctx.fillStyle = def.color;   ctx.fillRect(e.x, e.y + 7, e.w, e.h - 7);
    ctx.fillStyle = '#ff0';      ctx.fillRect(e.x + 3, e.y + 2, 4, 4); ctx.fillRect(e.x + e.w - 7, e.y + 2, 4, 4);
    ctx.fillStyle = '#888';      ctx.fillRect(e.dir === 1 ? e.x + e.w : e.x - 4, e.y + 10, 4, 3);
  } else if (e.type === 'minion') {
    ctx.fillStyle = def.color;    ctx.fillRect(e.x + 2, e.y + 5, e.w - 4, e.h - 5);
    ctx.fillStyle = def.topColor; ctx.fillRect(e.x + 2, e.y, e.w - 4, 8);
    ctx.fillStyle = '#222';       ctx.fillRect(e.x + 4, e.y + 2, 3, 3); ctx.fillRect(e.x + e.w - 7, e.y + 2, 3, 3);
  } else {
    ctx.fillStyle = def.topColor; ctx.fillRect(e.x + 2, e.y, e.w - 4, 9);
    ctx.fillStyle = def.color;    ctx.fillRect(e.x + 2, e.y + 9, e.w - 4, e.h - 9);
    ctx.fillStyle = '#f9e4b7';    ctx.fillRect(e.x + 3, e.y + 1, e.w - 6, 7);
    ctx.fillStyle = '#222';       ctx.fillRect(e.x + 5, e.y + 3, 2, 2); ctx.fillRect(e.x + e.w - 7, e.y + 3, 2, 2);
    ctx.fillStyle = '#555';       ctx.fillRect(e.dir === 1 ? e.x + e.w : e.x - 5, e.y + 10, 5, 2);
  }

  if (e.maxHp > 1) {
    ctx.fillStyle = '#333'; ctx.fillRect(e.x, e.y - 5, e.w, 3);
    ctx.fillStyle = '#0f0'; ctx.fillRect(e.x, e.y - 5, e.w * (e.hp / e.maxHp), 3);
  }
  ctx.restore();
}

function updateSquadMember(sq, player, enemies, boss, darts, platforms, groundY) {
  sq.life--;
  var targetX = player.x + (player.facing * -30) + Math.floor(Math.random() * 10 - 5);
  var dx      = targetX - sq.x;
  sq.vx  = clamp(dx * 0.04, -2.5, 2.5);
  sq.dir = sq.vx > 0 ? 1 : -1;
  sq.vy  = clamp(sq.vy + GRAVITY, -15, 12);
  sq.x  += sq.vx;
  sq.y  += sq.vy;
  sq.onGround = false;

  if (sq.y + 18 >= groundY) { sq.y = groundY - 18; sq.vy = 0; sq.onGround = true; }

  for (var i = 0; i < platforms.length; i++) {
    var p = platforms[i];
    if (sq.vy < 0) continue;
    if (sq.x + 12 <= p.x || sq.x >= p.x + p.w) continue;
    var prevBottom = sq.y + 18 - sq.vy;
    var currBottom = sq.y + 18;
    if (prevBottom <= p.y + 2 && currBottom >= p.y - 2) {
      sq.y = p.y - 18; sq.vy = 0; sq.onGround = true;
    }
  }

  sq.shootTimer--;
  if (sq.shootTimer <= 0) {
    sq.shootTimer = 30;
    var nearestDist = 200;
    var target      = null;
    for (var ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      if (!e.alive) continue;
      var d = Math.abs(e.x - sq.x);
      if (d < nearestDist) { nearestDist = d; target = { x: e.x + e.w / 2, y: e.y + e.h / 2 }; }
    }
    if (boss && boss.alive) {
      var bd = Math.abs(boss.x - sq.x);
      if (bd < nearestDist) target = { x: boss.x + boss.w / 2, y: boss.y + boss.h / 2 };
    }
    if (target) {
      var tdx  = target.x - (sq.x + 6);
      var tdy  = target.y - (sq.y + 9);
      var dist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
      darts.push({ x: sq.x + 6, y: sq.y + 9, vx: (tdx / dist) * DART_SPEED, vy: (tdy / dist) * DART_SPEED,
        w: DART_W, h: DART_H, damage: 1, fromPlayer: true, mega: false, color: sq.color, alive: true });
    }
  }
}

function drawSquadMember(ctx, sq) {
  ctx.globalAlpha = Math.min(1, sq.life / 30);
  ctx.fillStyle   = sq.color;  ctx.fillRect(sq.x + 2, sq.y + 8, 8, 10);
  ctx.fillStyle   = '#f4c080'; ctx.fillRect(sq.x + 2, sq.y, 8, 8);
  ctx.fillStyle   = '#aaa';    ctx.fillRect(sq.dir === 1 ? sq.x + 10 : sq.x - 3, sq.y + 11, 4, 2);
  ctx.globalAlpha = 1;
}
