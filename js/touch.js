
/**
 * touch.js
 * On-screen touch controls for mobile / tablet play.
 */

function getTouchButtons(altLayout) {
  var bw      = CANVAS_W;
  var stripTop = CANVAS_H - TOUCH_HUD_H;
  var btnH    = 42;
  var btnY    = stripTop + (TOUCH_HUD_H - btnH) / 2;

  if (altLayout) {
    return [
      { id: 'shoot',  x: 10,        y: btnY, w: 52, h: btnH, label: 'FIRE', pressed: false },
      { id: 'switch', x: 70,        y: btnY, w: 40, h: btnH, label: 'SW',   pressed: false },
      { id: 'left',   x: bw - 138,  y: btnY, w: 40, h: btnH, label: '<',    pressed: false },
      { id: 'right',  x: bw - 92,   y: btnY, w: 40, h: btnH, label: '>',    pressed: false },
      { id: 'jump',   x: bw - 46,   y: btnY, w: 40, h: btnH, label: '^',    pressed: false },
    ];
  }
  return [
    { id: 'left',   x: 10,      y: btnY, w: 40, h: btnH, label: '<',    pressed: false },
    { id: 'right',  x: 56,      y: btnY, w: 40, h: btnH, label: '>',    pressed: false },
    { id: 'jump',   x: 102,     y: btnY, w: 40, h: btnH, label: '^',    pressed: false },
    { id: 'shoot',  x: bw - 62, y: btnY, w: 52, h: btnH, label: 'FIRE', pressed: false },
    { id: 'switch', x: bw - 120,y: btnY, w: 50, h: btnH, label: 'SW',   pressed: false },
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
  var btnH = 42, btnY = stripTop + (TOUCH_HUD_H - btnH) / 2;
  var buttons = [
    { label: 'RETRY', x: 10,          w: bw / 2 - 16, selected: menuIdx === 0 },
    { label: 'MENU',  x: bw / 2 + 6,  w: bw / 2 - 16, selected: menuIdx === 1 },
  ];
  _drawMenuTouchStrip(ctx, buttons, stripTop, btnY, btnH, 9);
}

function drawPauseTouchButtons(ctx, pauseMenuIdx) {
  var bw = CANVAS_W, stripTop = CANVAS_H - TOUCH_HUD_H;
  var btnH = 42, btnY = stripTop + (TOUCH_HUD_H - btnH) / 2;
  var buttons = [
    { label: 'RESUME', x: 10,         w: bw / 2 - 16, selected: pauseMenuIdx === 0 },
    { label: 'EXIT',   x: bw / 2 + 6, w: bw / 2 - 16, selected: pauseMenuIdx === 1 },
  ];
  _drawMenuTouchStrip(ctx, buttons, stripTop, btnY, btnH, 8);
}

function _drawMenuTouchStrip(ctx, buttons, stripTop, btnY, btnH, fontSize) {
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
