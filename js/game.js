
/**
 * game.js
 * The Game class: owns all state, coordinates the game loop, dispatches
 * input, and calls the render and logic modules.
 */

function Game(canvas) {
  this.canvas = canvas;
  this.ctx    = canvas.getContext('2d');

  var detected = detectTouchDevice();
  var touchOn  = detected === null ? false : detected;

  this.gs = {
    screen:          'title',
    frame:           0,
    levelIdx:        0,
    completedLevels: new Set(),
    highScores:      new Array(TOTAL_LEVELS).fill(0),
    keys:            {},
    altButtonLayout: false,
    skinColor:       SKIN_COLORS[0],
    hairColor:       HAIR_COLORS[0],
    clothColor:      CLOTH_COLORS[0],
    touchMode:       touchOn,
    touchDetected:   detected,
  };
  // Copy default keys
  for (var k in DEFAULT_KEYS) this.gs.keys[k] = DEFAULT_KEYS[k];

  this.ls = null;

  this.titleMenuIdx    = 0;
  this.settingsIdx     = 0;
  this.rebinding       = null;
  this.selectHover     = 0;
  this.gameOverMenuIdx = 0;
  this.pauseMenuIdx    = 0;
  this.customiseFocus  = 0;
  this.skinIdx         = 0;
  this.hairIdx         = 0;
  this.clothIdx        = 0;
  this.helpPage        = 0;

  this.raf        = 0;
  this.pixelScale = 1;
  this.dpr        = 1;
  this.stars      = makeStars(80, CANVAS_W, CANVAS_H);

  this.touchButtons = getTouchButtons(false);

  this.resize();
  this._bindEvents();
}

Object.defineProperty(Game.prototype, 'viewH', {
  get: function() { return this.gs.touchMode ? CANVAS_H - TOUCH_HUD_H : CANVAS_H; }
});
Object.defineProperty(Game.prototype, 'groundY', {
  get: function() { return this.viewH - 24; }
});
Object.defineProperty(Game.prototype, 'titleMenuCount', {
  get: function() { return this.gs.touchDetected === null ? 5 : 4; }
});

Game.prototype.save = function() {
  var data = {
    completed:       Array.from(this.gs.completedLevels),
    highScores:      this.gs.highScores,
    keys:            this.gs.keys,
    altButtonLayout: this.gs.altButtonLayout,
    skinColor:       this.gs.skinColor,
    hairColor:       this.gs.hairColor,
    clothColor:      this.gs.clothColor,
    touchMode:       this.gs.touchMode,
  };
  return persistence.setItem('nerfSquadSave', JSON.stringify(data));
};

Game.prototype.load = function() {
  var self = this;
  return persistence.getItem('nerfSquadSave').then(function(raw) {
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      self.gs.completedLevels = new Set(data.completed || []);
      self.gs.highScores      = data.highScores || new Array(TOTAL_LEVELS).fill(0);
      if (data.keys) {
        for (var k in DEFAULT_KEYS) {
          self.gs.keys[k] = data.keys[k] !== undefined ? data.keys[k] : DEFAULT_KEYS[k];
        }
      }
      self.gs.altButtonLayout = data.altButtonLayout || false;
      self.gs.skinColor       = data.skinColor  || SKIN_COLORS[0];
      self.gs.hairColor       = data.hairColor  || HAIR_COLORS[0];
      self.gs.clothColor      = data.clothColor || CLOTH_COLORS[0];
      if (self.gs.touchDetected === null && data.touchMode !== undefined) {
        self.gs.touchMode = data.touchMode;
      }
      self.skinIdx  = Math.max(0, SKIN_COLORS.indexOf(self.gs.skinColor));
      self.hairIdx  = Math.max(0, HAIR_COLORS.indexOf(self.gs.hairColor));
      self.clothIdx = Math.max(0, CLOTH_COLORS.indexOf(self.gs.clothColor));
      self.touchButtons = getTouchButtons(self.gs.altButtonLayout);
      Input.setBindings(self.gs.keys);
    } catch(e) { /* corrupted save */ }
  });
};

Game.prototype.resize = function() {
  var vw = window.innerWidth, vh = window.innerHeight;
  var intScaleX = Math.max(1, Math.floor(vw / CANVAS_W));
  var intScaleY = Math.max(1, Math.floor(vh / CANVAS_H));
  this.pixelScale = Math.min(intScaleX, intScaleY);
  this.dpr        = Math.max(1, window.devicePixelRatio || 1);
  var cssW        = CANVAS_W * this.pixelScale;
  var cssH        = CANVAS_H * this.pixelScale;
  this.canvas.width  = cssW * this.dpr;
  this.canvas.height = cssH * this.dpr;
  this.canvas.style.width  = cssW + 'px';
  this.canvas.style.height = cssH + 'px';
  this.canvas.style.left   = ((vw - cssW) / 2) + 'px';
  this.canvas.style.top    = ((vh - cssH) / 2) + 'px';
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.scale(this.pixelScale * this.dpr, this.pixelScale * this.dpr);
};

Game.prototype.clientToGame = function(clientX, clientY) {
  var rect = this.canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / this.pixelScale,
    y: (clientY - rect.top)  / this.pixelScale,
  };
};

Game.prototype._bindEvents = function() {
  var self = this;
  window.addEventListener('resize', function() { self.resize(); });

  window.addEventListener('keydown', function(e) {
    if (self.rebinding) {
      if (e.key === 'Escape') { self.rebinding = null; e.preventDefault(); return; }
      self.gs.keys[self.rebinding] = e.key;
      Input.setBindings(self.gs.keys);
      self.rebinding = null;
      self.save();
      e.preventDefault();
      return;
    }
    var gameKeys = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift', 'Escape', 'Enter'];
    for (var gi = 0; gi < gameKeys.length; gi++) {
      if (e.key === gameKeys[gi]) { e.preventDefault(); break; }
    }
    if (self.gs.screen === 'game') {
      Input.onKeyDown(e.key, e.repeat);
    }
    self._handleMenuKey(e.key, e.repeat);
  });

  window.addEventListener('keyup', function(e) {
    Input.onKeyUp(e.key);
  });

  var onTouchDown = function(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var pos = self.clientToGame(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
      self._dispatchTap(pos.x, pos.y, true);
    }
  };
  var onTouchUp = function(e) {
    e.preventDefault();
    var activePos = [];
    for (var i = 0; i < e.touches.length; i++) {
      activePos.push(self.clientToGame(e.touches[i].clientX, e.touches[i].clientY));
    }
    for (var bi = 0; bi < self.touchButtons.length; bi++) {
      var btn = self.touchButtons[bi];
      var was = btn.pressed;
      btn.pressed = false;
      for (var pi = 0; pi < activePos.length; pi++) {
        var p = activePos[pi];
        if (p.x >= btn.x && p.x <= btn.x + btn.w && p.y >= btn.y && p.y <= btn.y + btn.h) {
          btn.pressed = true; break;
        }
      }
      if (was && !btn.pressed) Input.onTouchUp(btn.id);
    }
  };
  var onTouchMove = function(e) {
    e.preventDefault();
    var activePos = [];
    for (var i = 0; i < e.touches.length; i++) {
      activePos.push(self.clientToGame(e.touches[i].clientX, e.touches[i].clientY));
    }
    for (var bi = 0; bi < self.touchButtons.length; bi++) {
      var btn = self.touchButtons[bi];
      var now = false;
      for (var pi = 0; pi < activePos.length; pi++) {
        var p = activePos[pi];
        if (p.x >= btn.x && p.x <= btn.x + btn.w && p.y >= btn.y && p.y <= btn.y + btn.h) {
          now = true; break;
        }
      }
      if (now && !btn.pressed)  { btn.pressed = true;  Input.onTouchDown(btn.id); }
      if (!now && btn.pressed)  { btn.pressed = false; Input.onTouchUp(btn.id);   }
    }
  };
  this.canvas.addEventListener('touchstart',  onTouchDown, { passive: false });
  this.canvas.addEventListener('touchend',    onTouchUp,   { passive: false });
  this.canvas.addEventListener('touchcancel', onTouchUp,   { passive: false });
  this.canvas.addEventListener('touchmove',   onTouchMove, { passive: false });

  this.canvas.addEventListener('click', function(e) {
    var pos = self.clientToGame(e.clientX, e.clientY);
    self._dispatchTap(pos.x, pos.y, false);
  });
};

Game.prototype._dispatchTap = function(x, y, isTouch) {
  switch (this.gs.screen) {
    case 'title':        this._tapTitle(x, y);        break;
    case 'customise':    this._tapCustomise(x, y);    break;
    case 'gameover':     this._tapGameOver(x, y);     break;
    case 'help':         this._tapHelp(x, y);         break;
    case 'select':       this._tapSelect(x, y);       break;
    case 'pause':        this._tapPause(x, y);        break;
    case 'settings':     this._tapSettings(x, y);     break;
    case 'bossintro':    this._tapBossIntro(x, y);    break;
    case 'levelcomplete':this._tapLevelComplete(x, y);break;
    case 'game':
      if (isTouch) {
        for (var i = 0; i < this.touchButtons.length; i++) {
          var btn = this.touchButtons[i];
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            if (!btn.pressed) { btn.pressed = true; Input.onTouchDown(btn.id); }
          }
        }
      }
      break;
  }
};

Game.prototype._handleMenuKey = function(key, isRepeat) {
  var k = this.gs.keys;
  switch (this.gs.screen) {

    case 'title':
      if (key === 'ArrowUp'   || key === 'w' || key === 'W') { this.titleMenuIdx = (this.titleMenuIdx - 1 + this.titleMenuCount) % this.titleMenuCount; playMenuClick(); }
      else if (key === 'ArrowDown' || key === 's' || key === 'S') { this.titleMenuIdx = (this.titleMenuIdx + 1) % this.titleMenuCount; playMenuClick(); }
      else if (key === 'Enter' || key === ' ') this._activateTitleItem(this.titleMenuIdx);
      else if (key === 'c' || key === 'C') this._goCustomise();
      else if (key === 'h' || key === 'H') this._goHelp();
      else if (key === 't' || key === 'T') this._goSettings();
      else if ((key === 'x' || key === 'X') && this.gs.touchDetected === null) { this.gs.touchMode = !this.gs.touchMode; this.save(); playMenuClick(); }
      break;

    case 'customise': {
      var maxF = 3;
      if (key === 'ArrowUp'   || key === 'w' || key === 'W') { this.customiseFocus = (this.customiseFocus - 1 + maxF + 1) % (maxF + 1); playMenuClick(); }
      if (key === 'ArrowDown' || key === 's' || key === 'S') { this.customiseFocus = (this.customiseFocus + 1) % (maxF + 1); playMenuClick(); }
      if (this.customiseFocus === 0) {
        if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { this.skinIdx = (this.skinIdx - 1 + SKIN_COLORS.length) % SKIN_COLORS.length; this.gs.skinColor = SKIN_COLORS[this.skinIdx]; playMenuClick(); }
        if (key === 'ArrowRight' || key === 'd' || key === 'D') { this.skinIdx = (this.skinIdx + 1) % SKIN_COLORS.length; this.gs.skinColor = SKIN_COLORS[this.skinIdx]; playMenuClick(); }
      }
      if (this.customiseFocus === 1) {
        if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { this.hairIdx = (this.hairIdx - 1 + HAIR_COLORS.length) % HAIR_COLORS.length; this.gs.hairColor = HAIR_COLORS[this.hairIdx]; playMenuClick(); }
        if (key === 'ArrowRight' || key === 'd' || key === 'D') { this.hairIdx = (this.hairIdx + 1) % HAIR_COLORS.length; this.gs.hairColor = HAIR_COLORS[this.hairIdx]; playMenuClick(); }
      }
      if (this.customiseFocus === 2) {
        if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { this.clothIdx = (this.clothIdx - 1 + CLOTH_COLORS.length) % CLOTH_COLORS.length; this.gs.clothColor = CLOTH_COLORS[this.clothIdx]; playMenuClick(); }
        if (key === 'ArrowRight' || key === 'd' || key === 'D') { this.clothIdx = (this.clothIdx + 1) % CLOTH_COLORS.length; this.gs.clothColor = CLOTH_COLORS[this.clothIdx]; playMenuClick(); }
      }
      if (key === 'Enter' || key === 'Escape') { this.gs.screen = 'title'; this.save(); playMenuClick(); }
      break;
    }

    case 'help':
      if (key === 'Escape')                              this._goTitle();
      else if (key === 'ArrowLeft'  || key === 'a' || key === 'A') this._prevHelp();
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') this._nextHelp();
      break;

    case 'select':
      if (key === 'Escape')                               { this._goTitle(); }
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') { this.selectHover = Math.min(TOTAL_LEVELS - 1, this.selectHover + 1); playMenuClick(); }
      else if (key === 'ArrowLeft'  || key === 'a' || key === 'A') { this.selectHover = Math.max(0, this.selectHover - 1); playMenuClick(); }
      else if (key === 'ArrowDown'  || key === 's' || key === 'S') { this.selectHover = Math.min(TOTAL_LEVELS - 1, this.selectHover + 3); playMenuClick(); }
      else if (key === 'ArrowUp'    || key === 'w' || key === 'W') { this.selectHover = Math.max(0, this.selectHover - 3); playMenuClick(); }
      else if (key === 'Enter' || key === ' ')           this.startLevel(this.selectHover);
      break;

    case 'settings': {
      var items = 7;
      if (key === 'Escape')                               { this.gs.screen = 'title'; this.save(); }
      else if (key === 'ArrowDown' || key === 's' || key === 'S') { this.settingsIdx = (this.settingsIdx + 1) % items; playMenuClick(); }
      else if (key === 'ArrowUp'   || key === 'w' || key === 'W') { this.settingsIdx = (this.settingsIdx - 1 + items) % items; playMenuClick(); }
      else if (key === 'Enter') {
        if (this.settingsIdx === 6) {
          this.gs.altButtonLayout = !this.gs.altButtonLayout;
          this.touchButtons = getTouchButtons(this.gs.altButtonLayout);
          this.save(); playMenuConfirm();
        } else {
          var bindKeys = ['left', 'right', 'jump', 'shoot', 'switch', 'pause'];
          this.rebinding = bindKeys[this.settingsIdx];
        }
      }
      break;
    }

    case 'pause':
      if (key === 'ArrowUp'   || key === 'w' || key === 'W') { this.pauseMenuIdx = (this.pauseMenuIdx - 1 + 2) % 2; playMenuClick(); }
      else if (key === 'ArrowDown' || key === 's' || key === 'S') { this.pauseMenuIdx = (this.pauseMenuIdx + 1) % 2; playMenuClick(); }
      else if (key === 'Enter' || key === ' ')            this._activatePauseItem(this.pauseMenuIdx);
      else if (key === 'Escape' || key === k.pause || key === 'p') this._resumeGame();
      break;

    case 'gameover':
      if (key === 'ArrowUp'   || key === 'w' || key === 'W') { this.gameOverMenuIdx = (this.gameOverMenuIdx - 1 + 2) % 2; playMenuClick(); }
      else if (key === 'ArrowDown' || key === 's' || key === 'S') { this.gameOverMenuIdx = (this.gameOverMenuIdx + 1) % 2; playMenuClick(); }
      else if (key === 'Enter' || key === ' ')            this._activateGameOverItem(this.gameOverMenuIdx);
      else if (key === 'r' || key === 'R')                this.startLevel(this.gs.levelIdx);
      else if (key === 'Escape')                          { this._goTitle(); }
      break;

    case 'levelcomplete':
      if (key === ' ' || key === 'Enter') this._nextLevel();
      break;

    case 'game':
      if (!isRepeat && (key === 'Escape' || key === k.pause || key === 'p')) {
        this._openPause();
      }
      break;
  }
};

/**
 * Translate a menu nav strip button id to the key string that
 * _handleMenuKey understands.  Returns null if id is not a menu nav id.
 */
Game.prototype._menuNavKey = function(btnId) {
  if (btnId === 'menu-up')     return 'ArrowUp';
  if (btnId === 'menu-down')   return 'ArrowDown';
  if (btnId === 'menu-left')   return 'ArrowLeft';
  if (btnId === 'menu-right')  return 'ArrowRight';
  if (btnId === 'menu-select') return 'Enter';
  if (btnId === 'menu-back')   return 'Escape';
  return null;
};

Game.prototype._tapTitle = function(x, y) {
  // Check menu nav strip first so it intercepts taps in the strip zone.
  if (this.gs.touchMode) {
    var navId = hitTestMenuNav(x, y, getMenuNavButtons('udselback'));
    if (navId) { this._handleMenuKey(this._menuNavKey(navId), false); return; }
  }
  var menuStartY = 130, menuItemH = 22;
  for (var i = 0; i < this.titleMenuCount; i++) {
    var iy = menuStartY + i * menuItemH;
    if (y >= iy - 4 && y <= iy + 14) { this.titleMenuIdx = i; this._activateTitleItem(i); return; }
  }
};
Game.prototype._tapCustomise = function(x, y) {
  // Check menu nav strip first.
  if (this.gs.touchMode) {
    var navId = hitTestMenuNav(x, y, getMenuNavButtons('udlrselback'));
    if (navId) { this._handleMenuKey(this._menuNavKey(navId), false); return; }
  }
  var rowW = SKIN_COLORS.length * 24, rowX = (CANVAS_W - rowW) / 2;
  var self = this;
  SKIN_COLORS.forEach(function(c, i) {
    var bx = rowX + i * 24;
    if (x >= bx && x <= bx + 18 && y >= 118 && y <= 136) { self.skinIdx = i; self.gs.skinColor = SKIN_COLORS[i]; self.customiseFocus = 0; playMenuClick(); }
  });
  HAIR_COLORS.forEach(function(c, i) {
    var bx = rowX + i * 24;
    if (x >= bx && x <= bx + 18 && y >= 158 && y <= 176) { self.hairIdx = i; self.gs.hairColor = HAIR_COLORS[i]; self.customiseFocus = 1; playMenuClick(); }
  });
  CLOTH_COLORS.forEach(function(c, i) {
    var bx = rowX + i * 24;
    if (x >= bx && x <= bx + 18 && y >= 198 && y <= 216) { self.clothIdx = i; self.gs.clothColor = CLOTH_COLORS[i]; self.customiseFocus = 2; playMenuClick(); }
  });
  if (y >= 228 && y <= 248 && x >= CANVAS_W / 2 - 55 && x <= CANVAS_W / 2 + 55) { this.gs.screen = 'title'; this.save(); playMenuClick(); }
};
Game.prototype._tapGameOver = function(x, y) {
  var menuStartY = 145, menuItemH = 28;
  for (var i = 0; i < 2; i++) {
    var iy = menuStartY + i * menuItemH;
    if (y >= iy - 4 && y <= iy + 16) { this.gameOverMenuIdx = i; this._activateGameOverItem(i); return; }
  }
  var stripTop = CANVAS_H - TOUCH_HUD_H, btnH = 44, btnY2 = stripTop + (TOUCH_HUD_H - btnH) / 2;
  var bw = CANVAS_W;
  if (y >= btnY2 && y <= btnY2 + btnH) {
    if (x >= 10       && x <= bw / 2 - 6) { this._activateGameOverItem(0); return; }
    if (x >= bw / 2 + 6)                  { this._activateGameOverItem(1); return; }
  }
};
Game.prototype._tapHelp = function(x, y) {
  if (this.gs.touchMode) {
    var navId = hitTestMenuNav(x, y, getMenuNavButtons('lrback'));
    if (navId) { this._handleMenuKey(this._menuNavKey(navId), false); return; }
  }
  x < CANVAS_W / 2 ? this._prevHelp() : this._nextHelp();
};
Game.prototype._tapSelect = function(x, y) {
  if (this.gs.touchMode) {
    var navId = hitTestMenuNav(x, y, getMenuNavButtons('udlrselback'));
    if (navId) { this._handleMenuKey(this._menuNavKey(navId), false); return; }
  }
  var cols = 3, cellW = 130, cellH = 50, startX = 30, startY = 35;
  for (var i = 0; i < TOTAL_LEVELS; i++) {
    var col = i % cols, row = Math.floor(i / cols);
    var bx = startX + col * cellW, by = startY + row * cellH;
    if (x >= bx && x <= bx + cellW - 8 && y >= by && y <= by + cellH - 6) { this.startLevel(i); return; }
  }
};
Game.prototype._tapSettings = function(x, y) {
  // Do not intercept touch during key rebinding — the user must press a physical key.
  if (this.rebinding) return;
  if (this.gs.touchMode) {
    var navId = hitTestMenuNav(x, y, getMenuNavButtons('udselback'));
    if (navId) { this._handleMenuKey(this._menuNavKey(navId), false); return; }
  }
  // No additional coordinate-based tap targets in settings; keyboard navigation is sufficient.
};
Game.prototype._tapBossIntro = function(x, y) {
  if (this.gs.touchMode) {
    var navId = hitTestMenuNav(x, y, getMenuNavButtons('selback'));
    if (navId) { this._handleMenuKey(this._menuNavKey(navId), false); return; }
  }
  // Boss intro also accepts a tap anywhere to advance (same as pressing Enter/Space).
  // Route to _handleMenuKey with 'Enter' which is handled generically nowhere in boss intro,
  // but the timer already auto-advances; no explicit action needed here.
};
Game.prototype._tapLevelComplete = function(x, y) {
  if (this.gs.touchMode) {
    var navId = hitTestMenuNav(x, y, getMenuNavButtons('selback'));
    if (navId) {
      // 'menu-select' maps to Enter which triggers _nextLevel; 'menu-back' maps to Escape
      // which has no binding on levelcomplete — ignore back silently on that screen.
      this._handleMenuKey(this._menuNavKey(navId), false); return;
    }
  }
  // Also allow a tap anywhere else on the screen to continue (mirrors spacebar).
  this._handleMenuKey(' ', false);
};
Game.prototype._tapPause = function(x, y) {
  var stripTop = CANVAS_H - TOUCH_HUD_H, btnH = 44, btnY2 = stripTop + (TOUCH_HUD_H - btnH) / 2;
  var bw = CANVAS_W;
  if (y >= btnY2 && y <= btnY2 + btnH) {
    if (x >= 10       && x <= bw / 2 - 6) { this._activatePauseItem(0); return; }
    if (x >= bw / 2 + 6)                  { this._activatePauseItem(1); return; }
  }
  var panW = 220, panH = 120, panX = CANVAS_W / 2 - panW / 2, panY = CANVAS_H / 2 - panH / 2;
  for (var i = 0; i < 2; i++) {
    var iy = panY + 44 + i * 28;
    if (x >= panX + 10 && x <= panX + panW - 10 && y >= iy - 4 && y <= iy + 16) { this._activatePauseItem(i); return; }
  }
};

Game.prototype._goTitle    = function() { this.gs.screen = 'title'; startMusic('title'); playMenuClick(); };
Game.prototype._goSettings = function() { this.gs.screen = 'settings'; this.settingsIdx = 0; playMenuClick(); };
Game.prototype._goHelp     = function() { this.gs.screen = 'help'; this.helpPage = 0; playMenuClick(); };
Game.prototype._goCustomise = function() {
  this.gs.screen    = 'customise';
  this.customiseFocus = 0;
  this.skinIdx  = Math.max(0, SKIN_COLORS.indexOf(this.gs.skinColor));
  this.hairIdx  = Math.max(0, HAIR_COLORS.indexOf(this.gs.hairColor));
  this.clothIdx = Math.max(0, CLOTH_COLORS.indexOf(this.gs.clothColor));
  playMenuClick();
};
Game.prototype._prevHelp  = function() { this.helpPage = (this.helpPage - 1 + 3) % 3; playMenuClick(); };
Game.prototype._nextHelp  = function() { this.helpPage = (this.helpPage + 1) % 3;     playMenuClick(); };
Game.prototype._openPause = function() { this.gs.screen = 'pause'; this.pauseMenuIdx = 0; playMenuClick(); };
Game.prototype._resumeGame= function() { this.gs.screen = 'game'; playMenuClick(); };

Game.prototype._activateTitleItem = function(idx) {
  playMenuConfirm();
  if (idx === 0)      { this.gs.screen = 'select'; this.selectHover = 0; startMusic('title'); }
  else if (idx === 1) { this._goCustomise(); }
  else if (idx === 2) { this._goHelp();      }
  else if (idx === 3) { this._goSettings();  }
  else if (idx === 4 && this.gs.touchDetected === null) { this.gs.touchMode = !this.gs.touchMode; this.save(); }
};
Game.prototype._activatePauseItem = function(idx) {
  playMenuConfirm();
  if (idx === 0) this._resumeGame();
  else           { this.gs.screen = 'title'; startMusic('title'); this.ls = null; }
};
Game.prototype._activateGameOverItem = function(idx) {
  playMenuConfirm();
  if (idx === 0) this.startLevel(this.gs.levelIdx);
  else           { this.gs.screen = 'title'; startMusic('title'); }
};
Game.prototype._nextLevel = function() {
  var next = this.gs.levelIdx + 1;
  if (next >= TOTAL_LEVELS) { this.gs.screen = 'title'; startMusic('title'); }
  else this.startLevel(next);
};

Game.prototype.startLevel = function(idx) {
  var unlocked = idx === 0 || this.gs.completedLevels.has(idx - 1);
  if (!unlocked) return;

  this.gs.levelIdx     = idx;
  this.gameOverMenuIdx = 0;
  this.pauseMenuIdx    = 0;

  var cfg    = LEVELS[idx];
  var gY     = this.groundY;
  var worldW = CANVAS_W * 4;

  var player           = new Player(40, gY - 22);
  player.skinColor     = this.gs.skinColor;
  player.hairColor     = this.gs.hairColor;
  player.clothColor    = this.gs.clothColor;
  var unlockedBlasters = ['pistol'];
  var bKeys = ['rifle', 'mega', 'scatter'];
  for (var bi = 0; bi < bKeys.length; bi++) {
    if (BLASTERS[bKeys[bi]].unlockLevel <= idx + 1) unlockedBlasters.push(bKeys[bi]);
  }
  player.unlockedBlasters = unlockedBlasters;

  var platforms = [];
  var totalPlats = cfg.platformCount * 3;
  // Spread platforms across three height tiers to prevent shelf stacking.
  // Tier 0: low (35–65 px above ground), tier 1: mid (70–100 px), tier 2: high (110–145 px).
  var tiers = [
    { lo: 35,  hi: 65  },
    { lo: 70,  hi: 100 },
    { lo: 110, hi: 145 },
  ];
  for (var i = 0; i < totalPlats; i++) {
    var tier = tiers[i % tiers.length];
    platforms.push({
      x: rndInt(50, worldW - 80),
      y: gY - rndInt(tier.lo, tier.hi),
      w: rndInt(40, 100),
      h: TILE,
      color: cfg.groundColor,
    });
  }

  if (cfg.bossLevel) { playBossFanfare(); startMusic('boss'); }
  else               { startMusic('action'); }

  this.ls = {
    player:       player,
    enemies:      [],
    darts:        [],
    platforms:    platforms,
    powerUps:     [],
    boss:         cfg.bossLevel ? createBoss(idx, gY) : null,
    squadMembers: [],
    particles:    [],
    camX:         0,
    worldW:       worldW,
    groundY:      gY,
    scrollOffset: 0,
    bgStars:      makeStars(50, CANVAS_W, CANVAS_H),
    bossIntroTimer: cfg.bossLevel ? 180 : 0,
    bossDefeated:   false,
    levelComplete:  false,
    lcTimer:        0,
    unlockMsg:      '',
    enemySpawnTimer: 60,
    enemySpawnCount: 0,
    maxEnemies:      cfg.enemyCount,
  };

  this.gs.screen = cfg.bossLevel ? 'bossintro' : 'game';
};

Game.prototype.start = function() {
  startMusic('title');
  var self = this;
  var loop = function() { self.update(); self.draw(); self.raf = requestAnimationFrame(loop); };
  this.raf = requestAnimationFrame(loop);
};

Game.prototype.update = function() {
  this.gs.frame++;
  var screen = this.gs.screen;

  Input.pollMovement(screen === 'game');

  if (screen === 'bossintro' && this.ls) {
    this.ls.bossIntroTimer--;
    if (this.ls.bossIntroTimer <= 0) this.gs.screen = 'game';
  }
  if (screen === 'game' && this.ls) this._updateGameplay();

  Input.clearOneShots();
};

Game.prototype._updateGameplay = function() {
  var ls  = this.ls;
  var cfg = LEVELS[this.gs.levelIdx];
  var inp = Input.state;
  var player      = ls.player;
  var platforms   = ls.platforms;
  var darts       = ls.darts;
  var enemies     = ls.enemies;
  var particles   = ls.particles;
  var boss        = ls.boss;
  var squadMembers= ls.squadMembers;
  var powerUps    = ls.powerUps;

  if (ls.bossIntroTimer > 0) return;

  if (inp.switchPressed) player.cycleBlaster();
  if (inp.shoot || inp.shootPressed) player.shoot(darts);
  player.update(inp, platforms, ls.groundY);

  ls.camX = Math.max(0, Math.min(ls.worldW - CANVAS_W, player.x - CANVAS_W * 0.35));
  ls.scrollOffset += cfg.scrollSpeed * 0.5;

  ls.enemySpawnTimer--;
  if (ls.enemySpawnTimer <= 0 && ls.enemySpawnCount < ls.maxEnemies) {
    ls.enemySpawnTimer = rndInt(60, 120);
    enemies.push(createEnemy(choice(cfg.enemyTypes), ls.camX + CANVAS_W + rndInt(20, 80), ls.groundY));
    ls.enemySpawnCount++;
  }

  if (this.gs.frame % 400 === 0) {
    var types = ['shield', 'speed', 'megadart', 'squad', 'ammo'];
    powerUps.push({
      x: ls.camX + rndInt(40, CANVAS_W - 40),
      y: ls.groundY - rndInt(30, 90),
      type: choice(types), alive: true, bobOffset: rnd(0, Math.PI * 2),
    });
  }

  for (var ei = 0; ei < enemies.length; ei++) {
    if (enemies[ei].alive) updateEnemy(enemies[ei], player, darts, platforms, ls.groundY, particles, ls.camX);
  }
  if (boss && boss.alive) updateBoss(boss, player, darts, platforms, ls.groundY, particles, ls.camX);
  for (var si = squadMembers.length - 1; si >= 0; si--) {
    updateSquadMember(squadMembers[si], player, enemies, boss, darts, platforms, ls.groundY);
    if (squadMembers[si].life <= 0) squadMembers.splice(si, 1);
  }

  for (var di = darts.length - 1; di >= 0; di--) {
    var d = darts[di];
    if (!d.alive) { darts.splice(di, 1); continue; }
    d.x += d.vx; d.y += d.vy;
    if (d.x < ls.camX - 20 || d.x > ls.camX + CANVAS_W + 20 || d.y < -20 || d.y > CANVAS_H + 20 || d.y + d.h > ls.groundY) {
      darts.splice(di, 1); continue;
    }
    var hitPlatform = false;
    for (var pi = 0; pi < platforms.length; pi++) {
      if (rectOverlap(d.x, d.y, d.w, d.h, platforms[pi].x, platforms[pi].y, platforms[pi].w, platforms[pi].h)) {
        hitPlatform = true; break;
      }
    }
    if (hitPlatform) { darts.splice(di, 1); }
  }

  for (var dci = darts.length - 1; dci >= 0; dci--) {
    var dc = darts[dci]; if (!dc.alive) continue;

    if (dc.fromPlayer) {
      for (var eci = 0; eci < enemies.length; eci++) {
        var en = enemies[eci];
        if (!en.alive) continue;
        if (rectOverlap(dc.x, dc.y, dc.w, dc.h, en.x, en.y, en.w, en.h)) {
          en.hp -= dc.damage; en.hurtTimer = 12; playHit();
          spawnParticles(particles, en.x + en.w / 2, en.y + en.h / 2, '#ffff00', 5, 2, 'HIT!');
          if (en.hp <= 0) {
            en.alive = false; player.score += en.score; playExplosion();
            spawnParticles(particles, en.x + en.w / 2, en.y + en.h / 2, '#ff8800', 12, 4, 'POW!');
            if (Math.random() < 0.25) {
              powerUps.push({ x: en.x + en.w / 2, y: en.y, type: choice(['shield','speed','megadart','squad','ammo']), alive: true, bobOffset: 0 });
            }
          }
          if (!dc.mega) { darts.splice(dci, 1); break; }
        }
      }
      if (boss && boss.alive && darts[dci]) {
        var d2 = darts[dci];
        if (d2 && rectOverlap(d2.x, d2.y, d2.w, d2.h, boss.x, boss.y, boss.w, boss.h)) {
          boss.hp -= d2.damage; boss.hurtTimer = 12; playHit();
          spawnParticles(particles, boss.x + boss.w / 2, boss.y + boss.h / 2, '#ff0000', 8, 3, 'BOOM!');
          if (boss.hp <= 0) {
            boss.alive = false; boss.hp = 0; ls.bossDefeated = true;
            player.score += 1000 + this.gs.levelIdx * 200;
            playBossExplosion();
            spawnParticles(particles, boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffff00', 25, 5, 'KO!');
          }
          if (!d2.mega) darts.splice(dci, 1);
        }
      }
    } else {
      if (rectOverlap(dc.x, dc.y, dc.w, dc.h, player.x, player.y, player.w, player.h)) {
        player.hurt(particles);
        darts.splice(dci, 1);
        if (player.lives <= 0) { this._endGameOver(); return; }
      }
    }
  }

  for (var eni = 0; eni < enemies.length; eni++) {
    var ene = enemies[eni];
    if (!ene.alive) continue;
    if (rectOverlap(player.x, player.y, player.w, player.h, ene.x, ene.y, ene.w, ene.h)) {
      player.hurt(particles);
      if (player.lives <= 0) { this._endGameOver(); return; }
    }
  }
  if (boss && boss.alive) {
    if (rectOverlap(player.x, player.y, player.w, player.h, boss.x, boss.y, boss.w, boss.h)) {
      player.hurt(particles);
      if (player.lives <= 0) { this._endGameOver(); return; }
    }
  }

  for (var pui = 0; pui < powerUps.length; pui++) {
    var pu = powerUps[pui];
    if (!pu.alive) continue;
    if (rectOverlap(player.x - 8, player.y - 8, player.w + 16, player.h + 16, pu.x - 6, pu.y - 6, 24, 24)) {
      pu.alive = false;
      playPowerUp();
      this._applyPowerUp(pu.type, player, ls);
      spawnParticles(particles, pu.x, pu.y, POWERUPS[pu.type] ? POWERUPS[pu.type].color : '#fff', 8, 2);
    }
  }

  updateParticles(particles);

  var allDead  = ls.enemySpawnCount >= ls.maxEnemies && enemies.every(function(e) { return !e.alive; });
  var bossOk   = !cfg.bossLevel || ls.bossDefeated;
  if (!ls.levelComplete && allDead && bossOk) {
    ls.levelComplete = true; ls.lcTimer = 0;
    playLevelComplete();
    this.gs.completedLevels.add(this.gs.levelIdx);
    var prev = this.gs.highScores[this.gs.levelIdx] || 0;
    if (player.score > prev) this.gs.highScores[this.gs.levelIdx] = player.score;
    var nextIdx      = this.gs.levelIdx + 1;
    var nextBlasters = ['rifle', 'mega', 'scatter'].filter(function(b) { return BLASTERS[b].unlockLevel === nextIdx + 1; });
    if (nextBlasters.length) ls.unlockMsg = 'UNLOCKED: ' + BLASTERS[nextBlasters[0]].name.toUpperCase() + '!';
    this.save();
  }
  if (ls.levelComplete) {
    ls.lcTimer++;
    if (ls.lcTimer > 60 && (inp.shoot || inp.shootPressed || inp.jumpPressed)) {
      this.gs.screen = 'levelcomplete';
      Input.clearOneShots();
    }
  }
};

Game.prototype._endGameOver = function() { this.gs.screen = 'gameover'; this.gameOverMenuIdx = 0; playGameOver(); stopMusic(); };

Game.prototype._applyPowerUp = function(type, player, ls) {
  var colors = ['#44ff88', '#ff8844', '#88aaff', '#ffff44'];
  if (type === 'shield')        { player.hasShield    = true; }
  else if (type === 'speed')    { player.speedBoost   = 600;  }
  else if (type === 'megadart') { player.megaDartReady = true; }
  else if (type === 'squad') {
    player.squadActive = 900;
    for (var i = 0; i < 2; i++) {
      ls.squadMembers.push({
        x: player.x - 20 - i * 15, y: player.y,
        vx: 0, vy: 0, onGround: false,
        shootTimer: 20 + i * 10, life: 900,
        dir: 1, color: choice(colors),
      });
    }
  } else if (type === 'ammo') {
    var bkeys = ['pistol', 'rifle', 'mega', 'scatter'];
    for (var bi = 0; bi < bkeys.length; bi++) { player.ammo[bkeys[bi]] = BLASTERS[bkeys[bi]].ammo; }
  }
};

/* ── Rendering ────────────────────────────────────────────────────────────── */

Game.prototype.draw = function() {
  var ctx = this.ctx;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  switch (this.gs.screen) {
    case 'title':         this._drawTitle();          break;
    case 'select':        this._drawSelect();         break;
    case 'settings':      this._drawSettings();       break;
    case 'customise':     this._drawCustomise();      break;
    case 'help':          this._drawHelp();           break;
    case 'bossintro':     this._drawBossIntro();      break;
    case 'game':          this._drawGame();           break;
    case 'pause':         this._drawPause();          break;
    case 'levelcomplete': this._drawLevelComplete();  break;
    case 'gameover':      this._drawGameOver();       break;
  }
};

Game.prototype._drawTitle = function() {
  this.ctx.fillStyle = '#050514'; this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawStarfield(this.ctx, this.stars);
  drawTitleScreen(this.ctx, this.gs.frame, this.gs.skinColor, this.gs.hairColor, this.gs.clothColor,
                  this.titleMenuIdx, this.gs.touchMode, this.gs.touchDetected);
  if (this.gs.touchMode) drawMenuNavStrip(this.ctx, getMenuNavButtons('udselback'));
};
Game.prototype._drawSelect = function() {
  drawLevelSelect(this.ctx, this.gs.completedLevels, this.gs.highScores, this.selectHover, this.gs.frame);
  if (this.gs.touchMode) drawMenuNavStrip(this.ctx, getMenuNavButtons('udlrselback'));
};
Game.prototype._drawSettings = function() {
  drawSettings(this.ctx, this.gs.keys, this.rebinding, this.gs.altButtonLayout, this.settingsIdx, this.gs.frame);
  if (this.gs.touchMode) drawMenuNavStrip(this.ctx, getMenuNavButtons('udselback'));
};
Game.prototype._drawCustomise = function() {
  this.ctx.fillStyle = '#050514'; this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawStarfield(this.ctx, this.stars);
  drawCustomiseScreen(this.ctx, this.gs.skinColor, this.gs.hairColor, this.gs.clothColor,
                      this.skinIdx, this.hairIdx, this.clothIdx, this.customiseFocus, this.gs.frame);
  if (this.gs.touchMode) drawMenuNavStrip(this.ctx, getMenuNavButtons('udlrselback'));
};
Game.prototype._drawHelp = function() {
  drawHelpScreen(this.ctx, this.helpPage, this.gs.frame);
  if (this.gs.touchMode) drawMenuNavStrip(this.ctx, getMenuNavButtons('lrback'));
};
Game.prototype._drawBossIntro = function() {
  if (this.ls) {
    this._drawScene();
    var cfg = LEVELS[this.gs.levelIdx];
    drawBossIntro(this.ctx, cfg.bossName, cfg.bossSubtitle, this.ls.bossIntroTimer);
    if (this.gs.touchMode) drawMenuNavStrip(this.ctx, getMenuNavButtons('selback'));
  }
};
Game.prototype._drawGame = function() {
  this._drawScene();
  if (!this.ls) return;
  var player = this.ls.player, boss = this.ls.boss;
  var cfg = LEVELS[this.gs.levelIdx], tm = this.gs.touchMode;
  drawHUD(this.ctx, player.lives, player.score, player.blaster, player.ammo,
          player.hasShield, player.speedBoost, player.megaDartReady, player.squadActive,
          this.gs.levelIdx, cfg.bgName, tm);
  if (boss && boss.alive) drawBossBar(this.ctx, cfg.bossName, boss.hp, boss.maxHp);
  if (tm) drawTouchButtons(this.ctx, this.touchButtons);
};
Game.prototype._drawPause = function() {
  this._drawScene();
  if (!this.ls) return;
  var player = this.ls.player, boss = this.ls.boss;
  var cfg = LEVELS[this.gs.levelIdx], tm = this.gs.touchMode;
  drawHUD(this.ctx, player.lives, player.score, player.blaster, player.ammo,
          player.hasShield, player.speedBoost, player.megaDartReady, player.squadActive,
          this.gs.levelIdx, cfg.bgName, tm);
  if (boss && boss.alive) drawBossBar(this.ctx, cfg.bossName, boss.hp, boss.maxHp);
  drawPauseMenu(this.ctx, this.gs.frame, this.pauseMenuIdx);
  if (tm) drawPauseTouchButtons(this.ctx, this.pauseMenuIdx);
};
Game.prototype._drawLevelComplete = function() {
  this._drawScene();
  drawLevelComplete(this.ctx, this.gs.levelIdx, this.ls.player.score, this.ls.unlockMsg, this.ls.lcTimer);
  if (this.gs.touchMode) drawMenuNavStrip(this.ctx, getMenuNavButtons('selback'));
};
Game.prototype._drawGameOver = function() {
  if (this.ls) this._drawScene();
  else { this.ctx.fillStyle = '#050514'; this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); drawStarfield(this.ctx, this.stars); }
  drawGameOver(this.ctx, this.ls ? this.ls.player.score : 0, this.gs.frame, this.gameOverMenuIdx);
  if (this.gs.touchMode) drawGameOverTouchButtons(this.ctx, this.gameOverMenuIdx);
};

Game.prototype._drawScene = function() {
  var ctx = this.ctx; var ls = this.ls; if (!ls) return;
  var camX        = ls.camX;
  var groundY     = ls.groundY;
  var platforms   = ls.platforms;
  var enemies     = ls.enemies;
  var darts       = ls.darts;
  var powerUps    = ls.powerUps;
  var boss        = ls.boss;
  var squadMembers= ls.squadMembers;
  var particles   = ls.particles;
  var scrollOffset= ls.scrollOffset;
  var cfg   = LEVELS[this.gs.levelIdx];
  var viewH = this.viewH;

  ctx.fillStyle = cfg.bg[0]; ctx.fillRect(0, 0, CANVAS_W, viewH);
  if (/^#[01234]/.test(cfg.bg[0])) drawStarfield(ctx, ls.bgStars);
  drawBgScenery(ctx, cfg, scrollOffset, groundY, viewH);

  ctx.save();
  ctx.translate(-camX, 0);

  ctx.fillStyle = cfg.groundColor; ctx.fillRect(0, groundY, ls.worldW, viewH - groundY);
  ctx.fillStyle = shadeColor(cfg.groundColor, -20); ctx.fillRect(0, groundY, ls.worldW, 4);

  for (var pi = 0; pi < platforms.length; pi++) {
    var p = platforms[pi];
    ctx.fillStyle = p.color;                  ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = shadeColor(p.color,  20); ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillStyle = shadeColor(p.color, -30); ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
  }

  for (var pui = 0; pui < powerUps.length; pui++) {
    if (powerUps[pui].alive) drawPowerUp(ctx, powerUps[pui], this.gs.frame);
  }
  for (var eni = 0; eni < enemies.length; eni++) drawEnemy(ctx, enemies[eni]);
  for (var sqi = 0; sqi < squadMembers.length; sqi++) drawSquadMember(ctx, squadMembers[sqi]);
  if (boss) drawBoss(ctx, boss);

  for (var di = 0; di < darts.length; di++) {
    var d = darts[di];
    ctx.fillStyle = d.fromPlayer ? d.color : '#ff6600';
    ctx.save();
    ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
    ctx.rotate(Math.atan2(d.vy, d.vx));
    ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
    ctx.fillStyle = '#fff'; ctx.fillRect(d.w / 2 - 2, -1, 2, 2);
    ctx.restore();
  }

  ls.player.draw(ctx);
  drawParticles(ctx, particles);
  ctx.restore();
};
