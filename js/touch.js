
/**
 * touch.js
 * On-screen touch controls for mobile / tablet play.
 */

/* ── Menu nav strip ──────────────────────────────────────────────────────── */

/**
 * Returns a layout array for the menu navigation strip shown on all
 * non-gameplay screens when touch mode is active.
 *
 * Each entry has: id (string), label (string), x, y, w, h.
 *
 * The buttons map to keyboard equivalents that _handleMenuKey already handles:
 *   menu-up     → ArrowUp
 *   menu-down   → ArrowDown
 *   menu-left   → ArrowLeft
 *   menu-right  → ArrowRight
 *   menu-select → Enter
 *   menu-back   → Escape
 *
 * Pass a subset string to tailor the strip per screen.  Valid subsets:
 *   'udselback'  – UP DOWN SELECT BACK  (title, settings, pause)
 *   'udlrselback'– UP DOWN LEFT RIGHT SELECT BACK  (customise, level-select)
 *   'lrback'     – LEFT(PREV) RIGHT(NEXT) BACK  (help)
 *   'selback'    – SELECT BACK  (boss intro, level complete)
 */
function getMenuNavButtons(subset) {
  var stripTop = CANVAS_H - TOUCH_HUD_H;
  var btnH     = 44;                             // 44 px minimum touch target (WCAG 2.5.5)
  var btnY     = stripTop + Math.floor((TOUCH_HUD_H - btnH) / 2);
  var bw       = CANVAS_W;

  if (subset === 'udselback') {
    // Four equal-width buttons across the strip.
    var uw = Math.floor((bw - 10) / 4) - 3;
    return [
      { id: 'menu-up',     label: '↑',    x: 5,                    y: btnY, w: uw, h: btnH },
      { id: 'menu-down',   label: '↓',    x: 5 + (uw + 3),         y: btnY, w: uw, h: btnH },
      { id: 'menu-select', label: 'OK',   x: 5 + (uw + 3) * 2,     y: btnY, w: uw, h: btnH },
      { id: 'menu-back',   label: '✕',    x: 5 + (uw + 3) * 3,     y: btnY, w: uw, h: btnH },
    ];
  }

  if (subset === 'udlrselback') {
    // Six equal-width buttons.
    var sw = Math.floor((bw - 10) / 6) - 2;
    return [
      { id: 'menu-up',     label: '↑',    x: 5,                    y: btnY, w: sw, h: btnH },
      { id: 'menu-down',   label: '↓',    x: 5 + (sw + 2),         y: btnY, w: sw, h: btnH },
      { id: 'menu-left',   label: '←',    x: 5 + (sw + 2) * 2,     y: btnY, w: sw, h: btnH },
      { id: 'menu-right',  label: '→',    x: 5 + (sw + 2) * 3,     y: btnY, w: sw, h: btnH },
      { id: 'menu-select', label: 'OK',   x: 5 + (sw + 2) * 4,     y: btnY, w: sw, h: btnH },
      { id: 'menu-back',   label: '✕',    x: 5 + (sw + 2) * 5,     y: btnY, w: sw, h: btnH },
    ];
  }

  if (subset === 'lrback') {
    // Three buttons: PREV, NEXT, BACK.
    var lw = Math.floor((bw - 10) / 3) - 3;
    return [
      { id: 'menu-left',  label: 'PREV', x: 5,                  y: btnY, w: lw, h: btnH },
      { id: 'menu-right', label: 'NEXT', x: 5 + (lw + 3),       y: btnY, w: lw, h: btnH },
      { id: 'menu-back',  label: '✕',   x: 5 + (lw + 3) * 2,   y: btnY, w: lw, h: btnH },
    ];
  }

  // Default: 'selback' – two wide buttons (boss intro, level complete).
  var hw = Math.floor((bw - 10) / 2) - 3;
  return [
    { id: 'menu-select', label: 'CONTINUE', x: 5,             y: btnY, w: hw, h: btnH },
    { id: 'menu-back',   label: '✕',        x: 5 + hw + 3,    y: btnY, w: hw, h: btnH },
  ];
}

/**
 * Draw the menu navigation strip.
 * buttons: array returned by getMenuNavButtons().
 */
function drawMenuNavStrip(ctx, buttons) {
  var stripTop = CANVAS_H - TOUCH_HUD_H;
  ctx.fillStyle   = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, stripTop, CANVAS_W, TOUCH_HUD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, stripTop); ctx.lineTo(CANVAS_W, stripTop); ctx.stroke();

  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    ctx.fillStyle   = 'rgba(40,40,80,0.80)';
    ctx.strokeStyle = 'rgba(255,255,255,0.50)';
    ctx.lineWidth   = 1.5;
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8); ctx.fill(); ctx.stroke();
    var fontSize = btn.label.length > 4 ? 7 : 8;
    ctx.font         = fontSize + 'px "Press Start 2P", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#fff';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
}

/**
 * Hit-test a tap (x, y) against a menu nav strip button array.
 * Returns the button id string if hit, otherwise null.
 */
function hitTestMenuNav(x, y, buttons) {
  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      return btn.id;
    }
  }
  return null;
}

/* ── Gameplay touch button strip ─────────────────────────────────────────── */

function getTouchButtons(altLayout) {
  var bw      = CANVAS_W;
  var stripTop = CANVAS_H - TOUCH_HUD_H;
  var btnH    = 44;                              // raised to 44 px minimum
  var btnY    = stripTop + Math.floor((TOUCH_HUD_H - btnH) / 2);

  if (altLayout) {
    return [
      { id: 'shoot',  x: 10,        y: btnY, w: 52, h: btnH, label: '●', pressed: false },
      { id: 'switch', x: 70,        y: btnY, w: 40, h: btnH, label: '⇄', pressed: false },
      { id: 'left',   x: bw - 138,  y: btnY, w: 40, h: btnH, label: '←', pressed: false },
      { id: 'right',  x: bw - 92,   y: btnY, w: 40, h: btnH, label: '→', pressed: false },
      { id: 'jump',   x: bw - 46,   y: btnY, w: 40, h: btnH, label: '↑', pressed: false },
    ];
  }
  return [
    { id: 'left',   x: 10,      y: btnY, w: 40, h: btnH, label: '←', pressed: false },
    { id: 'right',  x: 56,      y: btnY, w: 40, h: btnH, label: '→', pressed: false },
    { id: 'jump',   x: 102,     y: btnY, w: 40, h: btnH, label: '↑', pressed: false },
    { id: 'shoot',  x: bw - 62, y: btnY, w: 52, h: btnH, label: '●', pressed: false },
    { id: 'switch', x: bw - 120,y: btnY, w: 50, h: btnH, label: '⇄', pressed: false },
  ];
}

function drawTouchButtons(ctx, buttons) {
  ctx.fillStyle   = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, CANVAS_H - TOUCH_HUD_H, CANVAS_W, TOUCH_HUD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, CANVAS_H - TOUCH_HUD_H); ctx.lineTo(CANVAS_W, CANVAS_H - TOUCH_HUD_H); ctx.stroke();

  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    ctx.fillStyle   = btn.pressed ? 'rgba(255,255,255,0.42)' : 'rgba(40,40,80,0.75)';
    ctx.strokeStyle = btn.pressed ? 'rgba(255,255,100,0.9)'  : 'rgba(255,255,255,0.45)';
    ctx.lineWidth   = btn.pressed ? 2.5 : 1.5;
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 10); ctx.fill(); ctx.stroke();
    ctx.font         = (btn.w > 44 ? 10 : 9) + 'px "Press Start 2P", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#fff';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
}

function drawGameOverTouchButtons(ctx, menuIdx) {
  var bw = CANVAS_W, stripTop = CANVAS_H - TOUCH_HUD_H;
  var btnH = 44, btnY = stripTop + Math.floor((TOUCH_HUD_H - btnH) / 2);
  var buttons = [
    { label: 'RETRY', x: 10,          w: bw / 2 - 16, selected: menuIdx === 0 },
    { label: 'MENU',  x: bw / 2 + 6,  w: bw / 2 - 16, selected: menuIdx === 1 },
  ];
  _drawMenuTouchStrip(ctx, buttons, stripTop, btnY, btnH, 9);
}

function drawPauseTouchButtons(ctx, pauseMenuIdx) {
  var bw = CANVAS_W, stripTop = CANVAS_H - TOUCH_HUD_H;
  var btnH = 44, btnY = stripTop + Math.floor((TOUCH_HUD_H - btnH) / 2);
  var buttons = [
    { label: 'RESUME', x: 10,         w: bw / 2 - 16, selected: pauseMenuIdx === 0 },
    { label: 'EXIT',   x: bw / 2 + 6, w: bw / 2 - 16, selected: pauseMenuIdx === 1 },
  ];
  _drawMenuTouchStrip(ctx, buttons, stripTop, btnY, btnH, 8);
}

function _drawMenuTouchStrip(ctx, buttons, stripTop, btnY, btnH, fontSize) {  /* btnH is always 44 px now */
  ctx.fillStyle   = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, stripTop, CANVAS_W, TOUCH_HUD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, stripTop); ctx.lineTo(CANVAS_W, stripTop); ctx.stroke();

  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    ctx.fillStyle   = btn.selected ? 'rgba(255,255,100,0.3)' : 'rgba(40,40,80,0.75)';
    ctx.strokeStyle = btn.selected ? 'rgba(255,255,100,0.9)' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth   = btn.selected ? 2 : 1.5;
    roundRect(ctx, btn.x, btnY, btn.w, btnH, 10); ctx.fill(); ctx.stroke();
    ctx.font         = fontSize + 'px "Press Start 2P", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = btn.selected ? '#ffff00' : '#aaa';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btnY + btnH / 2);
  }
}

function detectTouchDevice() {
  if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) return true;
  if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches)  return false;
  return null;
}
