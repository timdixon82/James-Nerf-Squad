
/**
 * player.js
 * Player class: physics, shooting, damage, rendering.
 */

function Player(startX, startY) {
  this.x = startX;
  this.y = startY;
  this.vx = 0;
  this.vy = 0;
  this.onGround = false;
  this.facing   = 1;

  this.lives = PLAYER_MAX_LIVES;
  this.score = 0;

  this.blaster           = 'pistol';
  this.unlockedBlasters  = ['pistol'];
  this.ammo              = { pistol: 99, rifle: 40, mega: 15, scatter: 24 };
  this.fireCooldown      = 0;
  this.invincible        = 0;

  this.hasShield      = false;
  this.speedBoost     = 0;
  this.megaDartReady  = false;
  this.squadActive    = 0;

  this.animFrame  = 0;
  this.animTimer  = 0;
  this.running    = false;

  this.skinColor  = SKIN_COLORS[0];
  this.hairColor  = HAIR_COLORS[0];
  this.clothColor = CLOTH_COLORS[0];

  this.w = PLAYER_W;
  this.h = PLAYER_H;
}

Player.prototype.getSpeed = function() {
  return PLAYER_SPEED * (this.speedBoost > 0 ? 1.7 : 1);
};

Player.prototype.update = function(inputState, platforms, groundY) {
  this.vx      = 0;
  this.running = false;
  if (inputState.left)  { this.vx = -this.getSpeed(); this.facing = -1; this.running = true; }
  if (inputState.right) { this.vx =  this.getSpeed(); this.facing =  1; this.running = true; }

  if (inputState.jumpPressed && this.onGround) {
    this.vy       = PLAYER_JUMP;
    this.onGround = false;
    playJump();
  }

  this.vy = clamp(this.vy + GRAVITY, -15, 12);
  this.x  = clamp(this.x + this.vx, 0, CANVAS_W * 4 - this.w);

  this.y       += this.vy;
  this.onGround = false;

  if (this.y + this.h >= groundY) {
    this.y        = groundY - this.h;
    this.vy       = 0;
    this.onGround = true;
  }

  for (var i = 0; i < platforms.length; i++) {
    var p = platforms[i];
    if (this.vy < 0) continue;
    var prevBottom = this.y + this.h - this.vy;
    var currBottom = this.y + this.h;
    if (this.x + this.w <= p.x || this.x >= p.x + p.w) continue;
    if (prevBottom <= p.y + 2 && currBottom >= p.y - 2) {
      this.y        = p.y - this.h;
      this.vy       = 0;
      this.onGround = true;
    }
  }

  if (this.invincible   > 0) this.invincible--;
  if (this.fireCooldown > 0) this.fireCooldown--;
  if (this.speedBoost   > 0) this.speedBoost--;
  if (this.squadActive  > 0) this.squadActive--;

  this.animTimer++;
  if (this.animTimer > 6) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
};

Player.prototype.shoot = function(darts) {
  var def = BLASTERS[this.blaster];
  if (this.fireCooldown > 0) return;
  var currentAmmo = this.ammo[this.blaster] !== undefined ? this.ammo[this.blaster] : 0;
  if (currentAmmo <= 0) return;

  this.fireCooldown = def.fireRate;
  if (this.blaster !== 'pistol') this.ammo[this.blaster] = currentAmmo - 1;

  var angles = [];
  if (def.dartCount === 1) {
    angles = [0];
  } else {
    for (var ai = 0; ai < def.dartCount; ai++) {
      angles.push((ai - Math.floor(def.dartCount / 2)) * def.spread);
    }
  }

  for (var i = 0; i < angles.length; i++) {
    var rad = angles[i] * (Math.PI / 180);
    darts.push({
      x:    this.x + (this.facing === 1 ? this.w : 0),
      y:    this.y + this.h / 2 - DART_H / 2,
      vx:   DART_SPEED * this.facing * Math.cos(rad),
      vy:   DART_SPEED * Math.sin(rad),
      w:    this.megaDartReady ? DART_W * 2 : DART_W,
      h:    this.megaDartReady ? DART_H * 2 : DART_H,
      damage:     this.megaDartReady ? 99 : def.damage,
      fromPlayer: true,
      mega:       this.megaDartReady,
      color:      def.color,
      alive:      true,
    });
  }
  if (this.megaDartReady) this.megaDartReady = false;
  playShoot(this.blaster);
};

Player.prototype.hurt = function(particles) {
  if (this.invincible > 0) return false;
  if (this.hasShield)      { this.hasShield = false; return false; }
  this.lives--;
  this.invincible = PLAYER_INVINCIBLE_FRAMES;
  playPlayerHurt();
  spawnParticles(particles, this.x + this.w / 2, this.y + this.h / 2, '#ff4444', 10, 3, 'OW!');
  return true;
};

Player.prototype.cycleBlaster = function() {
  var idx    = this.unlockedBlasters.indexOf(this.blaster);
  this.blaster = this.unlockedBlasters[(idx + 1) % this.unlockedBlasters.length];
};

Player.prototype.draw = function(ctx) {
  var x = this.x, y = this.y, w = this.w, h = this.h;
  var facing = this.facing, invincible = this.invincible;
  var animFrame = this.animFrame, running = this.running;
  var hasShield = this.hasShield;
  var skinColor = this.skinColor, hairColor = this.hairColor, clothColor = this.clothColor;

  if (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) return;

  ctx.save();
  if (facing === -1) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.fillStyle = clothColor; ctx.fillRect(x + 2, y + 9, w - 4, h - 9);
  ctx.fillStyle = shadeColor(clothColor, -30);
  if (running && animFrame % 2 === 0) {
    ctx.fillRect(x + 2,     y + h - 6, 4, 6);
    ctx.fillRect(x + w - 8, y + h - 8, 4, 8);
  } else {
    ctx.fillRect(x + 2,     y + h - 7, 4, 7);
    ctx.fillRect(x + w - 6, y + h - 7, 4, 7);
  }
  ctx.fillStyle = skinColor; ctx.fillRect(x + 2, y, w - 4, 10);
  ctx.fillStyle = hairColor; ctx.fillRect(x + 2, y, w - 4, 3);
  ctx.fillStyle = '#fff'; ctx.fillRect(x + w - 7, y + 3, 3, 3);
  ctx.fillStyle = '#111'; ctx.fillRect(x + w - 6, y + 4, 2, 2);
  ctx.fillStyle = BLASTERS[this.blaster].color;
  ctx.fillRect(x + w - 2, y + 11, 5, 3);
  if (hasShield) {
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};
