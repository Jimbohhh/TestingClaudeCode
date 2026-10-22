// Vector icons for creature powers and UI (drawn on canvas, no emoji).
(function (WE) {
  const U = WE.U;
  const I = {};
  const cache = {};

  // Each glyph is drawn in a 100x100 box, white strokes on transparent.
  const GLYPHS = {
    roar(c) { // open mouth + sound waves
      c.lineWidth = 7;
      c.beginPath(); c.arc(30, 50, 14, -0.9, 0.9); c.stroke();
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(30, 50, 28 + i * 14, -0.6, 0.6); c.stroke(); }
    },
    speed(c) {
      c.lineWidth = 7;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(14, 34 + i * 16); c.lineTo(44 - i * 6, 34 + i * 16); c.stroke(); }
      paw(c, 66, 52, 1.1);
    },
    shockwave(c) {
      c.lineWidth = 6;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(50, 66, 14 + i * 13, 6 + i * 5, 0, 0, U.TAU); c.stroke(); }
      c.beginPath(); c.moveTo(50, 20); c.lineTo(50, 52); c.moveTo(38, 40); c.lineTo(50, 54); c.lineTo(62, 40); c.stroke();
    },
    reach(c) {
      c.lineWidth = 7;
      c.beginPath(); c.moveTo(20, 80); c.quadraticCurveTo(30, 30, 72, 26); c.stroke();
      c.beginPath(); c.moveTo(58, 16); c.lineTo(76, 26); c.lineTo(62, 40); c.stroke();
      leaf(c, 80, 60);
    },
    pounce(c) {
      c.lineWidth = 6;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(28 + i * 16, 22); c.quadraticCurveTo(40 + i * 16, 50, 30 + i * 16, 80); c.stroke(); }
    },
    decoy(c) {
      c.lineWidth = 6;
      c.beginPath(); U.roundRect(c, 16, 22, 52, 38, 12); c.stroke();
      c.beginPath(); c.moveTo(28, 60); c.lineTo(22, 76); c.lineTo(42, 60); c.stroke();
      for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(70, 42, 12 + i * 10, -0.7, 0.7); c.stroke(); }
    },
    toxic(c) {
      c.lineWidth = 6;
      c.beginPath(); c.moveTo(50, 14); c.bezierCurveTo(70, 40, 76, 54, 76, 62); c.arc(50, 62, 26, 0, Math.PI); c.bezierCurveTo(24, 54, 30, 40, 50, 14); c.stroke();
      c.beginPath(); c.moveTo(38, 64); c.lineTo(46, 56); c.lineTo(54, 66); c.lineTo(62, 58); c.stroke();
    },
    hold(c) {
      c.lineWidth = 6;
      c.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.2) { const rr = 6 + a * 2.5; const x = 50 + Math.cos(a) * rr, y = 52 + Math.sin(a) * rr * 0.8; a ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    },
    sniff(c) {
      c.lineWidth = 6;
      c.beginPath(); c.ellipse(32, 56, 16, 12, 0, 0, U.TAU); c.stroke();
      c.fillStyle = '#fff'; U.ellipse(c, 26, 58, 3, 4, 0); c.fill(); U.ellipse(c, 38, 58, 3, 4, 0); c.fill();
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(56, 30 + i * 18); c.bezierCurveTo(64, 24 + i * 18, 72, 36 + i * 18, 84, 30 + i * 18); c.stroke(); }
    },
    camo(c) {
      c.lineWidth = 6;
      c.beginPath(); c.moveTo(12, 50); c.quadraticCurveTo(50, 16, 88, 50); c.quadraticCurveTo(50, 84, 12, 50); c.stroke();
      c.beginPath(); c.arc(50, 50, 11, 0, U.TAU); c.stroke();
      c.beginPath(); c.moveTo(20, 82); c.lineTo(82, 20); c.stroke();
    },
    silent(c) {
      c.lineWidth = 5;
      c.beginPath(); c.moveTo(24, 82); c.quadraticCurveTo(40, 40, 78, 16); c.stroke();
      c.beginPath(); c.moveTo(78, 16); c.quadraticCurveTo(80, 50, 40, 66); c.quadraticCurveTo(36, 40, 78, 16); c.stroke();
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(48 + i * 6, 54 - i * 8); c.lineTo(58 + i * 6, 58 - i * 8); c.stroke(); }
    },
    shield(c) {
      c.lineWidth = 7;
      c.beginPath(); c.moveTo(50, 14); c.lineTo(80, 26); c.quadraticCurveTo(80, 66, 50, 86); c.quadraticCurveTo(20, 66, 20, 26); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(36, 50); c.lineTo(46, 60); c.lineTo(64, 40); c.stroke();
    },
    safezone(c) {
      c.lineWidth = 5;
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.28;
        c.beginPath(); c.moveTo(50, 80); c.quadraticCurveTo(50 + Math.cos(a) * 20, 80 + Math.sin(a) * 30, 50 + Math.cos(a) * 40, 78 + Math.sin(a) * 56); c.stroke();
      }
    },
    invuln(c) {
      c.lineWidth = 5;
      c.beginPath(); c.ellipse(50, 54, 34, 26, 0, Math.PI, 0); c.closePath(); c.stroke();
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; const x = 50 + Math.cos(a) * 10, y = 42 + Math.sin(a) * 9; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(24, 46); c.lineTo(40, 44); c.moveTo(76, 46); c.lineTo(60, 44); c.stroke();
    },
    ink(c) {
      c.fillStyle = '#fff';
      for (const [x, y, r] of [[40, 50, 18], [60, 44, 16], [56, 62, 15], [34, 66, 11], [70, 60, 10]]) { U.ellipse(c, x, y, r, r, 0); c.fill(); }
    },
    reveal(c) {
      c.lineWidth = 6;
      c.fillStyle = '#fff'; U.ellipse(c, 24, 50, 7, 7, 0); c.fill();
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(24, 50, 20 + i * 18, -0.75, 0.75); c.stroke(); }
    },
    warn(c) {
      c.lineWidth = 6;
      c.beginPath(); c.moveTo(22, 82); c.quadraticCurveTo(10, 30, 36, 14); c.quadraticCurveTo(50, 40, 40, 82); c.stroke();
      c.beginPath(); c.moveTo(68, 22); c.lineTo(68, 56); c.stroke();
      c.fillStyle = '#fff'; U.ellipse(c, 68, 72, 5, 5, 0); c.fill();
    },
    recharge(c) {
      c.lineWidth = 6;
      c.beginPath(); c.moveTo(56, 12); c.lineTo(30, 54); c.lineTo(50, 54); c.lineTo(42, 88); c.lineTo(72, 42); c.lineTo(52, 42); c.closePath(); c.stroke();
    },
    burrow(c) {
      c.lineWidth = 6;
      c.beginPath(); c.moveTo(10, 60); c.quadraticCurveTo(30, 50, 50, 60); c.quadraticCurveTo(70, 70, 90, 60); c.stroke();
      c.fillStyle = '#fff'; U.ellipse(c, 38, 46, 7, 5, 0); c.fill(); U.ellipse(c, 62, 46, 7, 5, 0); c.fill();
    },
    leap(c) {
      c.lineWidth = 7;
      c.beginPath(); c.moveTo(14, 78); c.quadraticCurveTo(50, 0, 84, 70); c.stroke();
      c.beginPath(); c.moveTo(70, 62); c.lineTo(84, 72); c.lineTo(88, 54); c.stroke();
    },
    allies(c) { paw(c, 30, 64, 0.8); paw(c, 54, 40, 0.8); paw(c, 76, 66, 0.8); },
    dodge(c) {
      c.lineWidth = 7;
      c.beginPath(); c.moveTo(16, 80); c.lineTo(38, 52); c.lineTo(56, 70); c.lineTo(80, 26); c.stroke();
      c.beginPath(); c.moveTo(66, 26); c.lineTo(80, 24); c.lineTo(82, 40); c.stroke();
    },
    slowmo(c) {
      c.lineWidth = 6;
      c.beginPath(); c.moveTo(10, 50); c.quadraticCurveTo(50, 18, 90, 50); c.quadraticCurveTo(50, 82, 10, 50); c.stroke();
      c.fillStyle = '#fff'; U.ellipse(c, 50, 50, 13, 13, 0); c.fill();
    },
    heal(c) {
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(50, 84); c.bezierCurveTo(10, 56, 14, 18, 50, 34); c.bezierCurveTo(86, 18, 90, 56, 50, 84); c.fill();
    },
  };
  function paw(c, x, y, s) {
    c.fillStyle = '#fff';
    U.ellipse(c, x, y + 6 * s, 12 * s, 10 * s, 0); c.fill();
    for (const [dx, dy] of [[-12, -8], [-4, -15], [5, -15], [13, -8]]) { U.ellipse(c, x + dx * s, y + dy * s, 4.5 * s, 5.5 * s, 0); c.fill(); }
  }
  function leaf(c, x, y) {
    c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(x - 12, y + 10); c.quadraticCurveTo(x - 10, y - 12, x + 10, y - 12); c.quadraticCurveTo(x + 8, y + 10, x - 12, y + 10); c.fill();
  }

  // Round badge icon for a power.
  I.power = function (powerId, size) {
    const key = powerId + '|' + size;
    if (cache[key]) return cache[key];
    const p = WE.POWERS[powerId];
    const c = U.canvas(size, size);
    const x = c.getContext('2d');
    const r = size / 2;
    const g = x.createRadialGradient(r * 0.7, r * 0.6, r * 0.1, r, r, r);
    g.addColorStop(0, U.shade(p.color, 0.25)); g.addColorStop(1, U.shade(p.color, -0.45));
    x.fillStyle = g;
    U.ellipse(x, r, r, r - 1, r - 1, 0); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = Math.max(1.5, size * 0.04);
    U.ellipse(x, r, r, r - size * 0.05, r - size * 0.05, 0); x.stroke();
    x.save();
    x.translate(size * 0.18, size * 0.18);
    x.scale(size * 0.64 / 100, size * 0.64 / 100);
    x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
    x.shadowColor = 'rgba(0,0,0,0.45)'; x.shadowBlur = 4;
    (GLYPHS[p.kind] || GLYPHS.speed)(x);
    x.restore();
    cache[key] = c;
    return c;
  };

  I.powerDataURL = function (powerId, size) { return I.power(powerId, size).toDataURL(); };

  // Small UI icons (journal, map, sound...) drawn as white glyphs.
  const UI = {
    journal(c) { c.lineWidth = 7; U.roundRect(c, 20, 14, 60, 74, 8); c.stroke(); c.beginPath(); c.moveTo(34, 14); c.lineTo(34, 88); c.stroke(); c.beginPath(); c.moveTo(44, 36); c.lineTo(68, 36); c.moveTo(44, 52); c.lineTo(68, 52); c.stroke(); },
    map(c) { c.lineWidth = 6; c.beginPath(); c.moveTo(12, 24); c.lineTo(36, 14); c.lineTo(64, 24); c.lineTo(88, 14); c.lineTo(88, 76); c.lineTo(64, 86); c.lineTo(36, 76); c.lineTo(12, 86); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(36, 14); c.lineTo(36, 76); c.moveTo(64, 24); c.lineTo(64, 86); c.stroke(); },
    sound(c) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(16, 38); c.lineTo(34, 38); c.lineTo(54, 20); c.lineTo(54, 80); c.lineTo(34, 62); c.lineTo(16, 62); c.closePath(); c.fill(); c.lineWidth = 6; c.beginPath(); c.arc(56, 50, 16, -0.8, 0.8); c.stroke(); c.beginPath(); c.arc(56, 50, 30, -0.8, 0.8); c.stroke(); },
    mute(c) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(16, 38); c.lineTo(34, 38); c.lineTo(54, 20); c.lineTo(54, 80); c.lineTo(34, 62); c.lineTo(16, 62); c.closePath(); c.fill(); c.lineWidth = 6; c.beginPath(); c.moveTo(66, 38); c.lineTo(88, 62); c.moveTo(88, 38); c.lineTo(66, 62); c.stroke(); },
    camera(c) { c.lineWidth = 6; U.roundRect(c, 12, 30, 76, 52, 10); c.stroke(); c.beginPath(); c.arc(50, 56, 16, 0, U.TAU); c.stroke(); c.beginPath(); c.moveTo(34, 30); c.lineTo(40, 18); c.lineTo(60, 18); c.lineTo(66, 30); c.stroke(); },
    paw(c) { paw(c, 50, 56, 1.6); },
    close(c) { c.lineWidth = 9; c.beginPath(); c.moveTo(24, 24); c.lineTo(76, 76); c.moveTo(76, 24); c.lineTo(24, 76); c.stroke(); },
    back(c) { c.lineWidth = 9; c.beginPath(); c.moveTo(60, 18); c.lineTo(28, 50); c.lineTo(60, 82); c.stroke(); },
    star(c) { c.fillStyle = '#fff'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? 18 : 42; c.lineTo(50 + Math.cos(a) * rr, 52 + Math.sin(a) * rr); } c.closePath(); c.fill(); },
    heart(c) { GLYPHS.heal(c); },
    pause(c) { c.fillStyle = '#fff'; c.fillRect(26, 18, 16, 64); c.fillRect(58, 18, 16, 64); },
    sprint(c) { GLYPHS.speed(c); },
    stalk(c) { c.lineWidth = 6; c.beginPath(); c.moveTo(10, 50); c.quadraticCurveTo(50, 22, 90, 50); c.quadraticCurveTo(50, 78, 10, 50); c.stroke(); c.fillStyle = '#fff'; U.ellipse(c, 50, 50, 9, 9, 0); c.fill(); },
    globe(c) { c.lineWidth = 6; c.beginPath(); c.arc(50, 50, 36, 0, U.TAU); c.stroke(); c.beginPath(); c.ellipse(50, 50, 16, 36, 0, 0, U.TAU); c.stroke(); c.beginPath(); c.moveTo(14, 50); c.lineTo(86, 50); c.moveTo(20, 32); c.lineTo(80, 32); c.moveTo(20, 68); c.lineTo(80, 68); c.stroke(); },
    quiz(c) { c.lineWidth = 9; c.beginPath(); c.moveTo(32, 34); c.quadraticCurveTo(34, 14, 52, 14); c.quadraticCurveTo(72, 16, 70, 34); c.quadraticCurveTo(68, 46, 52, 52); c.lineTo(52, 64); c.stroke(); c.fillStyle = '#fff'; U.ellipse(c, 52, 82, 6, 6, 0); c.fill(); },
    play(c) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(30, 18); c.lineTo(82, 50); c.lineTo(30, 82); c.closePath(); c.fill(); },
  };
  I.ui = function (name, size, color) {
    const key = 'ui|' + name + '|' + size + '|' + (color || '');
    if (cache[key]) return cache[key];
    const c = U.canvas(size, size);
    const x = c.getContext('2d');
    x.scale(size / 100, size / 100);
    x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round';
    UI[name](x);
    if (color) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, size, size); }
    cache[key] = c;
    return c;
  };
  I.uiURL = (name, size, color) => I.ui(name, size, color).toDataURL();

  WE.Icons = I;
})(window.WE);
