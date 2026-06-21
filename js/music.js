
/**
 * music.js
 * Chiptune background music engine.
 */

var _musicNodes    = [];
var _musicInterval = null;
var _currentTheme  = null;

var THEMES = {
  action: {
    bpm: 160,
    melody: [523,659,784,659,523,392,440,523,523,659,784,1047,784,659,784,523],
    bass:   [130,130,165,165,130,130, 98, 98,130,130,165, 196,165,130,165,130],
  },
  boss: {
    bpm: 140,
    melody: [196,196,220,196,175,175,196,  0,196,196,220,261,247,220,196,175],
    bass:   [ 98, 98,110, 98, 87, 87, 98,  0, 98, 98,110,130,123,110, 98, 87],
  },
  title: {
    bpm: 120,
    melody: [523,659,784,523,659,784,1047,784,659,523,392,440,523,392,330,392],
    bass:   [130,165,196,130,165,196, 261,196,165,130, 98,110,130, 98, 82, 98],
  },
};

function startMusic(theme) {
  if (_currentTheme === theme) return;
  stopMusic();
  _currentTheme = theme;
  var c = getAudioCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  var def = THEMES[theme];
  if (!def) return;
  var beatLen = 60 / def.bpm;
  var step = 0;

  function playStep() {
    var ct   = c.currentTime;
    var note = def.melody[step % def.melody.length];
    var bass = def.bass[step   % def.bass.length];

    if (note > 0) {
      var osc = c.createOscillator(); var gain = c.createGain();
      osc.type = 'square'; osc.frequency.value = note;
      gain.gain.setValueAtTime(0.08, ct);
      gain.gain.setValueAtTime(0.08, ct + beatLen * 0.7);
      gain.gain.linearRampToValueAtTime(0, ct + beatLen * 0.9);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(ct); osc.stop(ct + beatLen);
      _musicNodes.push(osc, gain);
    }
    if (bass > 0) {
      var osc2 = c.createOscillator(); var gain2 = c.createGain();
      osc2.type = 'triangle'; osc2.frequency.value = bass;
      gain2.gain.setValueAtTime(0.07, ct);
      gain2.gain.setValueAtTime(0.07, ct + beatLen * 0.8);
      gain2.gain.linearRampToValueAtTime(0, ct + beatLen);
      osc2.connect(gain2); gain2.connect(c.destination);
      osc2.start(ct); osc2.stop(ct + beatLen + 0.01);
      _musicNodes.push(osc2, gain2);
    }
    step++;
    if (_musicNodes.length > 80) _musicNodes.splice(0, 40);
  }

  playStep();
  _musicInterval = window.setInterval(playStep, beatLen * 1000);
}

function stopMusic() {
  if (_musicInterval !== null) { clearInterval(_musicInterval); _musicInterval = null; }
  _currentTheme = null;
  var c = getAudioCtx();
  if (c) {
    for (var i = 0; i < _musicNodes.length; i++) {
      try { if (_musicNodes[i].stop) _musicNodes[i].stop(); _musicNodes[i].disconnect(); } catch(e) {}
    }
  }
  _musicNodes = [];
}
