
/**
 * sound.js
 * All one-shot sound-effect synthesis via the Web Audio API.
 */

var _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _audioCtx = new AC();
  }
  return _audioCtx;
}

function resumeAudio() {
  var c = getAudioCtx();
  if (c && c.state === 'suspended') c.resume();
}

function env(gainNode, t, a, s, r, vol) {
  var g = gainNode.gain;
  g.setValueAtTime(0, t);
  g.linearRampToValueAtTime(vol, t + a);
  g.setValueAtTime(vol, t + a + s);
  g.linearRampToValueAtTime(0, t + a + s + r);
}

function playShoot(blaster) {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;

  if (blaster === 'rifle') {
    var osc = c.createOscillator(); var gain = c.createGain();
    var filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1400; filt.Q.value = 2;
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(700, t); osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);
    env(gain, t, 0.001, 0.015, 0.04, 0.45);
    osc.connect(filt); filt.connect(gain); gain.connect(c.destination); osc.start(t); osc.stop(t + 0.1);
  } else if (blaster === 'mega') {
    var osc = c.createOscillator(); var gain = c.createGain();
    var osc2 = c.createOscillator(); var gain2 = c.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(140, t); osc.frequency.exponentialRampToValueAtTime(55, t + 0.22);
    env(gain, t, 0.001, 0.12, 0.15, 0.65);
    osc2.type = 'sine'; osc2.frequency.setValueAtTime(70, t); osc2.frequency.exponentialRampToValueAtTime(30, t + 0.22);
    env(gain2, t, 0.001, 0.1, 0.12, 0.4);
    osc.connect(gain); gain.connect(c.destination); osc2.connect(gain2); gain2.connect(c.destination);
    osc.start(t); osc.stop(t + 0.4); osc2.start(t); osc2.stop(t + 0.4);
  } else if (blaster === 'scatter') {
    for (var i = 0; i < 3; i++) {
      (function(idx) {
        var osc = c.createOscillator(); var gain = c.createGain();
        var filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1600; filt.Q.value = 1.5;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900 - idx * 80, t + idx * 0.018);
        osc.frequency.exponentialRampToValueAtTime(300 - idx * 30, t + idx * 0.018 + 0.07);
        env(gain, t + idx * 0.018, 0.001, 0.01, 0.055, 0.38);
        osc.connect(filt); filt.connect(gain); gain.connect(c.destination);
        osc.start(t + idx * 0.018); osc.stop(t + idx * 0.018 + 0.12);
      })(i);
    }
  } else {
    var osc = c.createOscillator(); var gain = c.createGain();
    var filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 900; filt.Q.value = 1.2;
    osc.type = 'square'; osc.frequency.setValueAtTime(440, t); osc.frequency.exponentialRampToValueAtTime(160, t + 0.1);
    env(gain, t, 0.001, 0.03, 0.08, 0.38);
    osc.connect(filt); filt.connect(gain); gain.connect(c.destination); osc.start(t); osc.stop(t + 0.2);
  }
}

function playHit() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  var bufLen = Math.floor(c.sampleRate * 0.06);
  var buf = c.createBuffer(1, bufLen, c.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
  var src = c.createBufferSource(); src.buffer = buf;
  var filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 0.8;
  var gain = c.createGain(); gain.gain.setValueAtTime(0.55, t); gain.gain.linearRampToValueAtTime(0, t + 0.06);
  src.connect(filt); filt.connect(gain); gain.connect(c.destination); src.start(t);
}

function playExplosion() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  var boomLen = Math.floor(c.sampleRate * 0.35);
  var boomBuf = c.createBuffer(1, boomLen, c.sampleRate);
  var boomDat = boomBuf.getChannelData(0);
  for (var i = 0; i < boomLen; i++) boomDat[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / boomLen, 1.5);
  var boomSrc = c.createBufferSource(); boomSrc.buffer = boomBuf;
  var boomFilt = c.createBiquadFilter(); boomFilt.type = 'lowpass'; boomFilt.frequency.value = 320;
  var boomGain = c.createGain(); boomGain.gain.setValueAtTime(0.9, t); boomGain.gain.linearRampToValueAtTime(0, t + 0.35);
  boomSrc.connect(boomFilt); boomFilt.connect(boomGain); boomGain.connect(c.destination); boomSrc.start(t);
  var crackLen = Math.floor(c.sampleRate * 0.12);
  var crackBuf = c.createBuffer(1, crackLen, c.sampleRate);
  var crackDat = crackBuf.getChannelData(0);
  for (var j = 0; j < crackLen; j++) crackDat[j] = (Math.random() * 2 - 1) * (1 - j / crackLen);
  var crackSrc = c.createBufferSource(); crackSrc.buffer = crackBuf;
  var crackFilt = c.createBiquadFilter(); crackFilt.type = 'bandpass'; crackFilt.frequency.value = 1200; crackFilt.Q.value = 0.5;
  var crackGain = c.createGain(); crackGain.gain.setValueAtTime(0.6, t); crackGain.gain.linearRampToValueAtTime(0, t + 0.12);
  crackSrc.connect(crackFilt); crackFilt.connect(crackGain); crackGain.connect(c.destination); crackSrc.start(t);
  var osc = c.createOscillator(); var gain = c.createGain();
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  gain.gain.setValueAtTime(0.35, t); gain.gain.linearRampToValueAtTime(0, t + 0.3);
  osc.connect(gain); gain.connect(c.destination); osc.start(t); osc.stop(t + 0.32);
}

function playBossExplosion() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  for (var k = 0; k < 4; k++) {
    (function(ki) {
      var offset = ki * 0.12;
      var bufLen = Math.floor(c.sampleRate * 0.4);
      var buf = c.createBuffer(1, bufLen, c.sampleRate);
      var dat = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) dat[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.2);
      var src = c.createBufferSource(); src.buffer = buf;
      var filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 400 - ki * 60;
      var gain = c.createGain(); gain.gain.setValueAtTime(0.8 - ki * 0.1, t + offset); gain.gain.linearRampToValueAtTime(0, t + offset + 0.4);
      src.connect(filt); filt.connect(gain); gain.connect(c.destination); src.start(t + offset);
    })(k);
  }
  var osc = c.createOscillator(); var gain = c.createGain();
  osc.type = 'square'; osc.frequency.setValueAtTime(220, t); osc.frequency.exponentialRampToValueAtTime(30, t + 0.7);
  gain.gain.setValueAtTime(0.4, t); gain.gain.linearRampToValueAtTime(0, t + 0.7);
  osc.connect(gain); gain.connect(c.destination); osc.start(t); osc.stop(t + 0.75);
}

function playPlayerHurt() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  var osc = c.createOscillator(); var gain = c.createGain();
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, t); osc.frequency.linearRampToValueAtTime(100, t + 0.2);
  gain.gain.setValueAtTime(0.4, t); gain.gain.linearRampToValueAtTime(0, t + 0.22);
  osc.connect(gain); gain.connect(c.destination); osc.start(t); osc.stop(t + 0.25);
}

function playJump() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  var osc = c.createOscillator(); var gain = c.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(200, t); osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
  gain.gain.setValueAtTime(0.2, t); gain.gain.linearRampToValueAtTime(0, t + 0.15);
  osc.connect(gain); gain.connect(c.destination); osc.start(t); osc.stop(t + 0.18);
}

function playPowerUp() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  var freqs1 = [523, 659, 784, 988, 1319, 1568];
  freqs1.forEach(function(f, i) {
    var osc = c.createOscillator(); var gain = c.createGain();
    osc.type = 'triangle'; osc.frequency.value = f;
    var st = t + i * 0.055;
    gain.gain.setValueAtTime(0, st); gain.gain.linearRampToValueAtTime(0.28, st + 0.015);
    gain.gain.setValueAtTime(0.28, st + 0.06); gain.gain.linearRampToValueAtTime(0, st + 0.18);
    osc.connect(gain); gain.connect(c.destination); osc.start(st); osc.stop(st + 0.22);
  });
  var freqs2 = [1047, 1319, 1568, 2093];
  freqs2.forEach(function(f, i) {
    var osc = c.createOscillator(); var gain = c.createGain();
    osc.type = 'sine'; osc.frequency.value = f;
    var st = t + 0.12 + i * 0.07;
    gain.gain.setValueAtTime(0, st); gain.gain.linearRampToValueAtTime(0.18, st + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
    osc.connect(gain); gain.connect(c.destination); osc.start(st); osc.stop(st + 0.38);
  });
  var bass = c.createOscillator(); var bassGain = c.createGain();
  bass.type = 'sine'; bass.frequency.setValueAtTime(130, t); bass.frequency.exponentialRampToValueAtTime(65, t + 0.15);
  bassGain.gain.setValueAtTime(0.45, t); bassGain.gain.linearRampToValueAtTime(0, t + 0.2);
  bass.connect(bassGain); bassGain.connect(c.destination); bass.start(t); bass.stop(t + 0.22);
}

function playLevelComplete() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  [523, 659, 784, 659, 784, 1047].forEach(function(f, i) {
    var osc = c.createOscillator(); var gain = c.createGain();
    osc.type = 'square'; osc.frequency.value = f;
    var st = t + i * 0.11;
    gain.gain.setValueAtTime(0, st); gain.gain.linearRampToValueAtTime(0.25, st + 0.01);
    gain.gain.setValueAtTime(0.25, st + 0.08); gain.gain.linearRampToValueAtTime(0, st + 0.11);
    osc.connect(gain); gain.connect(c.destination); osc.start(st); osc.stop(st + 0.13);
  });
}

function playBossFanfare() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  var seq = [130, 130, 130, 196, 130, 196, 261];
  var dur = [0.1,  0.1, 0.1, 0.3, 0.1, 0.1, 0.5];
  var offset = 0;
  seq.forEach(function(f, i) {
    var osc = c.createOscillator(); var gain = c.createGain();
    osc.type = 'square'; osc.frequency.value = f;
    var st = t + offset;
    gain.gain.setValueAtTime(0.35, st); gain.gain.setValueAtTime(0.35, st + dur[i] * 0.9); gain.gain.linearRampToValueAtTime(0, st + dur[i]);
    osc.connect(gain); gain.connect(c.destination); osc.start(st); osc.stop(st + dur[i] + 0.01);
    offset += dur[i] + 0.02;
  });
}

function playGameOver() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  [330, 294, 261, 220].forEach(function(f, i) {
    var osc = c.createOscillator(); var gain = c.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = f;
    var st = t + i * 0.22;
    gain.gain.setValueAtTime(0.3, st); gain.gain.linearRampToValueAtTime(0, st + 0.25);
    osc.connect(gain); gain.connect(c.destination); osc.start(st); osc.stop(st + 0.27);
  });
}

function playMenuClick() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  var osc = c.createOscillator(); var gain = c.createGain();
  osc.type = 'square'; osc.frequency.setValueAtTime(880, t); osc.frequency.setValueAtTime(1100, t + 0.03);
  gain.gain.setValueAtTime(0.15, t); gain.gain.linearRampToValueAtTime(0, t + 0.07);
  osc.connect(gain); gain.connect(c.destination); osc.start(t); osc.stop(t + 0.08);
}

function playMenuConfirm() {
  var c = getAudioCtx(); if (!c) return;
  resumeAudio();
  var t = c.currentTime;
  [440, 554, 659].forEach(function(f, i) {
    var osc = c.createOscillator(); var gain = c.createGain();
    osc.type = 'square'; osc.frequency.value = f;
    var st = t + i * 0.06;
    gain.gain.setValueAtTime(0.18, st); gain.gain.linearRampToValueAtTime(0, st + 0.1);
    osc.connect(gain); gain.connect(c.destination); osc.start(st); osc.stop(st + 0.12);
  });
}
