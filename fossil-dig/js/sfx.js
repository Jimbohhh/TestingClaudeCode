// Synthesised sound effects (Web Audio). No audio files.
window.FD = window.FD || {};
(function (FD) {
  const A = { muted: false };
  let ac = null, master = null, noiseBuf = null;
  try { A.muted = localStorage.getItem('fossil-finders-muted') === '1'; } catch (e) { /* storage blocked */ }

  function ctx() {
    if (ac) return ac;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ac = new C();
    master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  A.unlock = () => { const c = ctx(); if (c && c.state === 'suspended') c.resume(); };
  A.setMuted = m => { A.muted = m; try { localStorage.setItem('fossil-finders-muted', m ? '1' : '0'); } catch (e) { /* ignore */ } };

  function noise(dur, freq, q, vol, type, delay) {
    const c = ctx(); if (!c || A.muted) return;
    const t = c.currentTime + (delay || 0);
    const src = c.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = 0.7 + Math.random() * 0.6;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  function tone(freq, dur, vol, type, delay, slide) {
    const c = ctx(); if (!c || A.muted) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  A.pick = hard => { noise(0.09, 2600, 3, 0.5); tone(hard ? 1900 : 1300, 0.07, 0.12, 'triangle'); noise(0.18, 600, 1, 0.25, 'lowpass', 0.02); };
  A.clink = () => { tone(2400, 0.12, 0.12, 'triangle'); tone(3300, 0.08, 0.06, 'sine', 0.01); };
  A.scrape = () => noise(0.14, 900 + Math.random() * 400, 1.2, 0.18);
  A.brush = () => noise(0.16, 4200 + Math.random() * 1500, 0.8, 0.07, 'highpass');
  A.crack = () => { noise(0.12, 1800, 6, 0.6); noise(0.2, 400, 2, 0.4, 'bandpass', 0.03); tone(180, 0.15, 0.15, 'sawtooth', 0, 90); };
  A.expose = () => { tone(660, 0.12, 0.1, 'sine'); tone(990, 0.18, 0.08, 'sine', 0.08); };
  A.jacket = () => { noise(0.25, 300, 0.8, 0.35, 'lowpass'); tone(220, 0.2, 0.1, 'sine', 0.05, 330); };
  A.collect = () => { [880, 1175, 1480].forEach((f, i) => tone(f, 0.18, 0.08, 'sine', i * 0.07)); };
  A.snap = () => { tone(520, 0.08, 0.14, 'square', 0, 780); noise(0.06, 3000, 4, 0.2); };
  A.miss = () => tone(240, 0.16, 0.08, 'triangle', 0, 180);
  A.cast = () => { noise(0.4, 500, 0.6, 0.18, 'lowpass'); tone(392, 0.3, 0.06, 'sine', 0.1); };
  A.reveal = () => { [392, 494, 587, 784].forEach((f, i) => { tone(f, 0.5, 0.09, 'triangle', i * 0.12); tone(f / 2, 0.6, 0.05, 'sine', i * 0.12); }); };
  A.wrong = () => { tone(300, 0.2, 0.08, 'triangle'); tone(220, 0.25, 0.08, 'triangle', 0.12); };
  A.click = () => tone(1400, 0.04, 0.05, 'square');

  FD.Sfx = A;
})(window.FD);
