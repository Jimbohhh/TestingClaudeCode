// Synthesised sound effects and habitat ambience (Web Audio, no audio files).
(function (WE) {
  const A = { ctx: null, master: null, ambient: null, enabled: true, ambId: null };

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = A.enabled ? 0.6 : 0;
    A.master.connect(A.ctx.destination);
    A.noiseBuf = A.ctx.createBuffer(1, A.ctx.sampleRate * 2, A.ctx.sampleRate);
    const d = A.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  };

  A.setEnabled = function (on) {
    A.enabled = on;
    if (A.master) A.master.gain.setTargetAtTime(on ? 0.6 : 0, A.ctx.currentTime, 0.05);
  };

  function tone(freq, dur, type, vol, when, glideTo) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + (when || 0);
    const o = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, filterType, freq, when, freqTo) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + (when || 0);
    const s = A.ctx.createBufferSource();
    s.buffer = A.noiseBuf;
    const f = A.ctx.createBiquadFilter();
    f.type = filterType || 'lowpass';
    f.frequency.setValueAtTime(freq || 1000, t);
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(A.master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  A.sfx = {
    click() { tone(660, 0.06, 'triangle', 0.12); },
    open() { tone(440, 0.08, 'triangle', 0.12); tone(660, 0.1, 'triangle', 0.12, 0.06); },
    close() { tone(660, 0.08, 'triangle', 0.1); tone(440, 0.1, 'triangle', 0.1, 0.06); },
    shutter() { noise(0.05, 0.4, 'highpass', 2500); noise(0.08, 0.3, 'bandpass', 1200, 0.06); },
    focus() { tone(1200, 0.03, 'sine', 0.04); },
    discover() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.16, i * 0.09)); tone(1318, 0.6, 'sine', 0.1, 0.4); },
    unlock() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, 'square', 0.06, i * 0.07)); },
    catch() { tone(880, 0.12, 'triangle', 0.18); tone(1320, 0.18, 'triangle', 0.14, 0.05); },
    collect() { tone(988, 0.1, 'sine', 0.15); tone(1480, 0.12, 'sine', 0.1, 0.05); },
    hurt() { tone(180, 0.3, 'sawtooth', 0.18, 0, 70); noise(0.2, 0.2, 'lowpass', 600); },
    power() { noise(0.4, 0.25, 'bandpass', 400, 0, 3000); tone(300, 0.3, 'sine', 0.12, 0, 900); },
    roar() { tone(110, 0.9, 'sawtooth', 0.2, 0, 70); noise(0.9, 0.25, 'lowpass', 500, 0, 200); },
    win() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.3, 'triangle', 0.15, i * 0.12)); },
    lose() { [440, 392, 349, 262].forEach((f, i) => tone(f, 0.35, 'triangle', 0.13, i * 0.16)); },
    warp() { noise(1.2, 0.2, 'bandpass', 300, 0, 4000); tone(200, 1.2, 'sine', 0.1, 0, 1600); },
    step() { noise(0.05, 0.05, 'lowpass', 400); },
    alert() { tone(900, 0.08, 'square', 0.06); tone(700, 0.1, 'square', 0.06, 0.09); },
    right() { tone(784, 0.15, 'triangle', 0.15); tone(1175, 0.25, 'triangle', 0.15, 0.1); },
    wrong() { tone(220, 0.25, 'square', 0.08); },
  };
  A.play = function (name) { if (A.ctx && A.enabled && A.sfx[name]) A.sfx[name](); };

  // ---- Ambience: a looping filtered-noise bed plus occasional calls ----
  const AMB = {
    savanna: { bed: ['bandpass', 500, 0.05], calls: 'birds', insects: true },
    rainforest: { bed: ['bandpass', 3000, 0.04], calls: 'jungle', insects: true },
    reef: { bed: ['lowpass', 300, 0.12], calls: 'bubbles' },
    desert: { bed: ['bandpass', 700, 0.07], calls: null },
    arctic: { bed: ['bandpass', 450, 0.09], calls: null },
    forest: { bed: ['bandpass', 900, 0.04], calls: 'birds' },
  };
  A.ambience = function (habId) {
    if (!A.ctx) return;
    A.stopAmbience();
    const cfg = AMB[habId];
    if (!cfg) return;
    const s = A.ctx.createBufferSource();
    s.buffer = A.noiseBuf; s.loop = true;
    const f = A.ctx.createBiquadFilter();
    f.type = cfg.bed[0]; f.frequency.value = cfg.bed[1]; f.Q.value = 0.6;
    const g = A.ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(cfg.bed[2], A.ctx.currentTime + 1.5);
    // Slow swell like wind gusts / waves
    const lfo = A.ctx.createOscillator(); lfo.frequency.value = 0.12;
    const lg = A.ctx.createGain(); lg.gain.value = cfg.bed[2] * 0.6;
    lfo.connect(lg); lg.connect(g.gain);
    s.connect(f); f.connect(g); g.connect(A.master);
    s.start(); lfo.start();
    A.ambient = { s, lfo, g };
    A.ambId = habId;
    A.ambTimer = setInterval(() => {
      if (!A.enabled || document.hidden) return;
      const r = Math.random();
      if (cfg.calls === 'birds' && r < 0.5) {
        const base = 2000 + Math.random() * 1500;
        for (let i = 0; i < 3 + Math.random() * 3; i++) tone(base + Math.random() * 400, 0.08, 'sine', 0.035, i * 0.11, base * 1.3);
      } else if (cfg.calls === 'jungle' && r < 0.6) {
        if (Math.random() < 0.5) tone(900 + Math.random() * 500, 0.3, 'sine', 0.035, 0, 500);
        else for (let i = 0; i < 4; i++) tone(1600 + i * 120, 0.06, 'triangle', 0.03, i * 0.07);
      } else if (cfg.calls === 'bubbles' && r < 0.8) {
        for (let i = 0; i < 3; i++) tone(300 + Math.random() * 500, 0.08, 'sine', 0.05, i * 0.1, 900 + Math.random() * 500);
      }
      if (cfg.insects && Math.random() < 0.3) for (let i = 0; i < 6; i++) tone(4200, 0.03, 'square', 0.006, i * 0.05);
    }, 2200);
  };
  A.stopAmbience = function () {
    if (A.ambient) {
      try { A.ambient.s.stop(); A.ambient.lfo.stop(); } catch (e) { /* already stopped */ }
      A.ambient = null;
    }
    clearInterval(A.ambTimer);
  };

  WE.Audio = A;
})(window.WE);
