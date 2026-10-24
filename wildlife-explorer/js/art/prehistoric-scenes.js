// Prehistoric scenery. Plants are ones that existed in each era: ferns,
// horsetails, cycads, ginkgos, tree ferns, conifers (like monkey-puzzle trees),
// seed ferns, and in the Cretaceous the first flowering plants and palms.
// No grass, no fruit trees, no berry bushes.
(function (WE) {
  const U = WE.U, B = WE.BG;
  const { layer, ridge, wrap } = B._p;
  const P = B.prims;
  const T = B.TILE;

  // ---------------- Flora primitives ----------------
  function treeFern(ctx, x, gy, h, r, col) {
    const c = col || '#3f7a36';
    ctx.save(); ctx.translate(x, gy);
    const lean = (r() - 0.5) * h * 0.15;
    ctx.fillStyle = '#3a2a1c';
    U.taperPath(ctx, U.bezierPts([0, 0], [lean * 0.4, -h * 0.5], [lean, -h], null, 8), h * 0.07, h * 0.05); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let i = 1; i < 12; i++) { const y = -h * i / 12, xx = lean * i / 12; ctx.beginPath(); ctx.moveTo(xx - h * 0.03, y); ctx.lineTo(xx + h * 0.03, y + 3); ctx.stroke(); }
    const top = [lean, -h];
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + (i - 5.5) * 0.48 + (r() - 0.5) * 0.15;
      const len = h * (0.42 + r() * 0.12);
      const pts = U.bezierPts(top, [top[0] + Math.cos(a) * len * 0.6, top[1] + Math.sin(a) * len * 0.5 - len * 0.15], [top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len * 0.3 + len * 0.45], null, 12);
      ctx.strokeStyle = U.shade(c, -0.25); ctx.lineWidth = 2;
      ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      for (let k = 1; k < pts.length; k++) {
        const p = pts[k], q = pts[k - 1];
        const an = Math.atan2(p[1] - q[1], p[0] - q[0]);
        const l = h * 0.06 * (1 - k / pts.length * 0.6);
        ctx.fillStyle = U.shade(c, (r() - 0.5) * 0.2);
        for (const sg of [-1, 1]) { U.ellipse(ctx, p[0] + Math.cos(an + sg * 1.3) * l * 0.6, p[1] + Math.sin(an + sg * 1.3) * l * 0.6, l, l * 0.3, an + sg * 1.3); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  function cycad(ctx, x, gy, h, r, col) {
    const c = col || '#3f6a2a';
    ctx.save(); ctx.translate(x, gy);
    const tw = h * 0.22, th = h * 0.45;
    const g = ctx.createLinearGradient(-tw, 0, tw, 0);
    g.addColorStop(0, '#4a3a24'); g.addColorStop(0.5, '#7a6038'); g.addColorStop(1, '#3a2a18');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-tw, 0); ctx.quadraticCurveTo(-tw * 1.1, -th * 0.6, -tw * 0.7, -th); ctx.lineTo(tw * 0.7, -th); ctx.quadraticCurveTo(tw * 1.1, -th * 0.6, tw, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,10,0.4)'; ctx.lineWidth = 1;
    for (let yy = 4; yy < th; yy += 7) for (let xx = -tw; xx < tw; xx += 8) { ctx.beginPath(); ctx.moveTo(xx, -yy); ctx.lineTo(xx + 4, -yy - 4); ctx.lineTo(xx + 8, -yy); ctx.stroke(); }
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i - 6.5) * 0.24;
      const len = h * (0.5 + r() * 0.15);
      const sx = 0, sy = -th;
      const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len * 0.7 + len * 0.2 * Math.abs(Math.cos(a));
      ctx.strokeStyle = U.shade(c, -0.2); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + ex) / 2, sy + Math.sin(a) * len * 0.6, ex, ey); ctx.stroke();
      ctx.strokeStyle = U.shade(c, (r() - 0.5) * 0.2); ctx.lineWidth = 1.2;
      for (let k = 2; k < 12; k++) {
        const t = k / 12, px = U.lerp(sx, ex, t), py = U.lerp(sy, ey, t) + Math.sin(t * Math.PI) * Math.sin(a) * len * 0.15;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a + 1.1) * h * 0.06, py + Math.sin(a + 1.1) * h * 0.06);
        ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a - 1.1) * h * 0.06, py + Math.sin(a - 1.1) * h * 0.06); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function araucaria(ctx, x, gy, h, r, col) {
    // Monkey-puzzle style conifer: tall bare trunk with an umbrella of branch tufts at the top.
    const c = col || '#2f5030';
    ctx.save(); ctx.translate(x, gy);
    const w = h * 0.022;
    const g = ctx.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, '#3a2c1e'); g.addColorStop(0.5, '#6a5038'); g.addColorStop(1, '#2e2216');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-w * 1.6, 0); ctx.lineTo(-w * 0.6, -h); ctx.lineTo(w * 0.6, -h); ctx.lineTo(w * 1.6, 0); ctx.fill();
    const crownTop = -h, crownBot = -h * (0.62 + r() * 0.1);
    for (let tier = 0; tier < 6; tier++) {
      const y = U.lerp(crownBot, crownTop, tier / 5);
      const spread = h * (0.24 - tier * 0.03) * (0.8 + r() * 0.4);
      for (const sd of [-1, 1]) {
        const ex = sd * spread, ey = y - spread * 0.15;
        ctx.strokeStyle = '#3a2c1e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(ex * 0.5, y - 4, ex, ey); ctx.stroke();
        ctx.fillStyle = U.shade(c, (r() - 0.5) * 0.2 + tier * 0.03);
        U.ellipse(ctx, ex * 0.75, ey - 4, spread * 0.38, h * 0.035, sd * 0.15); ctx.fill();
      }
    }
    ctx.fillStyle = U.shade(c, 0.08); U.ellipse(ctx, 0, crownTop - 6, h * 0.05, h * 0.04, 0); ctx.fill();
    ctx.restore();
  }

  function ginkgoTree(ctx, x, gy, h, r, palette) {
    ctx.save(); ctx.translate(x, gy);
    ctx.fillStyle = '#4a3a2a';
    U.taperPath(ctx, [[0, 0], [r() * 6 - 3, -h * 0.5], [r() * 8 - 4, -h * 0.85]], h * 0.06, h * 0.025); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const y = -h * (0.35 + i * 0.09), sd = i % 2 ? 1 : -1;
      ctx.lineWidth = 2; ctx.strokeStyle = '#4a3a2a';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(sd * h * (0.18 - i * 0.015), y - h * 0.08); ctx.stroke();
    }
    for (let i = 0; i < 70; i++) {
      const a = r() * U.TAU, d = Math.sqrt(r());
      const px = Math.cos(a) * h * 0.22 * d, py = -h * 0.62 + Math.sin(a) * h * 0.3 * d;
      ctx.fillStyle = palette[Math.floor(r() * palette.length)];
      ctx.save(); ctx.translate(px, py); ctx.rotate(r() * U.TAU);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-h * 0.025, h * 0.035); ctx.quadraticCurveTo(0, h * 0.05, h * 0.025, h * 0.035); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function horsetails(ctx, x, gy, h, r) {
    for (let i = 0; i < 9; i++) {
      const bx = x + (r() - 0.5) * h * 0.4, bh = h * (0.6 + r() * 0.5), lean = (r() - 0.5) * h * 0.15;
      ctx.strokeStyle = U.mix('#4f7a32', '#7a9a4a', r()); ctx.lineWidth = Math.max(1.5, h * 0.025);
      ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(bx + lean, gy - bh); ctx.stroke();
      ctx.lineWidth = 1;
      for (let k = 1; k < 8; k++) {
        const t = k / 8, px = bx + lean * t, py = gy - bh * t;
        ctx.strokeStyle = '#2f4a22'; ctx.beginPath(); ctx.moveTo(px - 2, py); ctx.lineTo(px + 2, py); ctx.stroke();
        ctx.strokeStyle = '#6f9a42';
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - h * 0.06, py + h * 0.04); ctx.moveTo(px, py); ctx.lineTo(px + h * 0.06, py + h * 0.04); ctx.stroke();
      }
      ctx.fillStyle = '#8a6a3a'; U.ellipse(ctx, bx + lean, gy - bh - 3, 2.5, 5, 0); ctx.fill();
    }
  }

  function seedFernShrub(ctx, x, gy, h, r) {
    // Dicroidium-style forked fronds
    const fork = (sx, sy, a, len, depth) => {
      const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len;
      ctx.strokeStyle = '#5a5a2a'; ctx.lineWidth = Math.max(1, depth);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      for (let k = 1; k < 5; k++) { const t = k / 5; ctx.fillStyle = U.mix('#6a8a32', '#9aa848', r()); U.ellipse(ctx, U.lerp(sx, ex, t), U.lerp(sy, ey, t), len * 0.12, len * 0.05, a + 1.2); ctx.fill(); U.ellipse(ctx, U.lerp(sx, ex, t), U.lerp(sy, ey, t), len * 0.12, len * 0.05, a - 1.2); ctx.fill(); }
      if (depth > 0) { fork(ex, ey, a - 0.5, len * 0.72, depth - 1); fork(ex, ey, a + 0.5, len * 0.72, depth - 1); }
    };
    for (let i = 0; i < 4; i++) fork(x + (r() - 0.5) * h * 0.2, gy, -Math.PI / 2 + (i - 1.5) * 0.4, h * 0.4, 3);
  }

  function palmetto(ctx, x, gy, h, r) {
    ctx.save(); ctx.translate(x, gy);
    ctx.fillStyle = '#5a4a32';
    U.taperPath(ctx, [[0, 0], [2, -h * 0.4], [0, -h * 0.65]], h * 0.08, h * 0.06); ctx.fill();
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.45, len = h * 0.42;
      const cx = Math.cos(a) * len, cy = -h * 0.65 + Math.sin(a) * len * 0.6;
      ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -h * 0.65); ctx.lineTo(cx, cy); ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const fa = a - 0.9 + i * 0.22;
        ctx.strokeStyle = i % 2 ? '#5a8a32' : '#4a7a2a'; ctx.lineWidth = h * 0.02;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(fa) * h * 0.18, cy + Math.sin(fa) * h * 0.18); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function volcano(ctx, x, base, h, w, t) {
    ctx.save();
    const g = ctx.createLinearGradient(0, base - h, 0, base);
    g.addColorStop(0, '#6a5a58'); g.addColorStop(1, '#8a7a74');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - w, base); ctx.quadraticCurveTo(x - w * 0.3, base - h * 0.6, x - w * 0.12, base - h); ctx.lineTo(x + w * 0.12, base - h); ctx.quadraticCurveTo(x + w * 0.3, base - h * 0.6, x + w, base); ctx.fill();
    ctx.fillStyle = 'rgba(200,80,30,0.5)';
    ctx.beginPath(); ctx.moveTo(x - w * 0.1, base - h); ctx.lineTo(x - w * 0.05, base - h * 0.75); ctx.lineTo(x + w * 0.02, base - h); ctx.fill();
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(110,100,100,${0.45 - i * 0.04})`;
      U.ellipse(ctx, x + i * w * 0.08 + Math.sin(i) * 8, base - h - 20 - i * h * 0.12, w * (0.12 + i * 0.03), w * (0.08 + i * 0.02), 0); ctx.fill();
    }
    ctx.restore();
  }

  function banded(ctx, base, amp, period, seed, bands) {
    // Layered badlands / sandstone cliffs
    const nz = U.periodicNoise(seed, period);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, ctx.canvas.height);
    for (let x = 0; x <= T; x += 4) {
      const v = nz((x / T) * period), v2 = nz((x / T) * period * 4 + 50);
      // eroded mesas: flat-ish tops with gullies cut into them
      const y = base - amp * (0.35 + 0.65 * Math.min(1, v * 1.4)) + Math.pow(v2, 3) * amp * 0.55;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(T, ctx.canvas.height); ctx.closePath();
    ctx.clip();
    const top = base - amp * 1.2;
    const bh = (ctx.canvas.height - top) / bands.length;
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, top + i * bh, T, bh + 1); });
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = 0; x < T; x += 14) ctx.fillRect(x, top, 3, ctx.canvas.height);
    ctx.restore();
  }

  function sauropodHerd(ctx, y, r, n, col) {
    // tiny distant silhouettes of long-necked dinosaurs
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const x = r() * T, s = 0.6 + r() * 0.5;
      wrap(px => {
        ctx.beginPath();
        ctx.ellipse(px, y - 14 * s, 18 * s, 9 * s, 0, 0, U.TAU); ctx.fill();
        ctx.lineWidth = 4 * s; ctx.strokeStyle = col; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px + 14 * s, y - 18 * s); ctx.quadraticCurveTo(px + 26 * s, y - 40 * s, px + 30 * s, y - 52 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 16 * s, y - 14 * s); ctx.quadraticCurveTo(px - 34 * s, y - 10 * s, px - 44 * s, y - 2 * s); ctx.stroke();
        for (const dx of [-10, -4, 6, 12]) { ctx.lineWidth = 3.5 * s; ctx.beginPath(); ctx.moveTo(px + dx * s, y - 8 * s); ctx.lineTo(px + dx * s, y); ctx.stroke(); }
      }, x, 60);
    }
  }

  function groundBase(x, c1, c2, seed) {
    const gg = x.createLinearGradient(0, 0, 0, 170);
    gg.addColorStop(0, c1); gg.addColorStop(1, c2);
    x.fillStyle = gg; x.fillRect(0, 24, T, 150);
    ridge(x, T, 34, 12, 8, seed, c1);
  }
  function litter(x, r, n, cols) {
    for (let i = 0; i < n; i++) { x.fillStyle = cols[Math.floor(r() * cols.length)]; x.globalAlpha = 0.5 + r() * 0.5; U.ellipse(x, r() * T, 30 + r() * 140, 2 + r() * 3, 1.2 + r() * 1.5, r() * 3); x.fill(); }
    x.globalAlpha = 1;
  }

  // ---------------- Era scene builders ----------------
  const BL = B.builders, FG = B.fgBuilders;

  BL.hellcreek = function (r) {
    const L = [];
    let l = layer(340), x = l.ctx;
    ridge(x, T, 280, 70, 6, 301, '#a4ae8a', true);
    for (let i = 0; i < 120; i++) { const cx = r() * T; wrap(px => P.conifer(x, px, 285 - r() * 20, 40 + r() * 40, r, '#7f8f6a'), cx, 30); }
    L.push({ canvas: l.c, factor: 0.08, y: 250 });
    l = layer(620); x = l.ctx;
    for (let i = 0; i < 18; i++) { const cx = r() * T; wrap(px => P.conifer(x, px, 600, 360 + r() * 200, r, '#4a6a3a'), cx, 140); }
    for (let i = 0; i < 10; i++) { const cx = r() * T; wrap(px => palmetto(x, px, 600, 140 + r() * 60, r), cx, 80); }
    L.push({ canvas: l.c, factor: 0.3, y: 20 });
    l = layer(600); x = l.ctx;
    for (let i = 0; i < 7; i++) { const cx = r() * T; wrap(px => P.deciduous(x, px, 560, 280 + r() * 120, r, ['#4f7a32', '#5f8a3a', '#3f6a2a', '#f4e8ec', '#4f7a32']), cx, 160); }
    for (let i = 0; i < 9; i++) { const cx = r() * T; wrap(px => treeFern(x, px, 565, 200 + r() * 90, r), cx, 120); }
    for (let i = 0; i < 6; i++) { const cx = r() * T; wrap(px => cycad(x, px, 565, 90 + r() * 40, r), cx, 60); }
    L.push({ canvas: l.c, factor: 0.55, y: 50 });
    l = layer(170); x = l.ctx;
    groundBase(x, '#4f4a2c', '#2f2a18', 311);
    litter(x, r, 1100, ['#6a5a2a', '#4a5a2a', '#8a7a4a']);
    for (let i = 0; i < 40; i++) { const fx = r() * T; wrap(px => P.fern(x, px, 40 + r() * 30, 34 + r() * 30, r, '#4a8a3a'), fx, 60); }
    for (let i = 0; i < 12; i++) { const fx = r() * T; wrap(px => horsetails(x, px, 50 + r() * 30, 40 + r() * 30, r), fx, 40); }
    for (let i = 0; i < 8; i++) { const cx = r() * T; wrap(px => P.rock(x, px, 60 + r() * 60, 40 + r() * 40, 14 + r() * 12, r, '#6a6a5a'), cx, 50); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };
  FG.hellcreek = (x, r) => { for (let i = 0; i < 20; i++) { const px = r() * T; wrap(p => P.fern(x, p, 165, 70 + r() * 50, r, '#3f7a32'), px, 80); } };

  BL.morrison = function (r) {
    const L = [];
    let l = layer(360), x = l.ctx;
    ridge(x, T, 300, 140, 6, 321, '#9aa4c0', true);
    L.push({ canvas: l.c, factor: 0.05, y: 230 });
    l = layer(260), x = l.ctx;
    ridge(x, T, 200, 40, 8, 322, '#a8a882');
    sauropodHerd(x, 205, r, 6, 'rgba(90,90,80,0.55)');
    for (let i = 0; i < 26; i++) { const cx = r() * T; wrap(px => araucaria(x, px, 205, 80 + r() * 50, r, '#6f7f5a'), cx, 40); }
    L.push({ canvas: l.c, factor: 0.14, y: 340 });
    l = layer(600), x = l.ctx;
    for (let i = 0; i < 11; i++) { const cx = r() * T; wrap(px => araucaria(x, px, 560, 320 + r() * 160, r), cx, 140); }
    for (let i = 0; i < 6; i++) { const cx = r() * T; wrap(px => ginkgoTree(x, px, 560, 220 + r() * 80, r, ['#5a8a3a', '#6a9a42', '#4a7a32']), cx, 120); }
    for (let i = 0; i < 8; i++) { const cx = r() * T; wrap(px => treeFern(x, px, 565, 160 + r() * 80, r), cx, 100); }
    L.push({ canvas: l.c, factor: 0.48, y: 50 });
    l = layer(170), x = l.ctx;
    groundBase(x, '#9a8a5a', '#6a5a38', 331);
    litter(x, r, 500, ['#7a6a3a', '#8a7a4a', '#5a6a32']);
    for (let i = 0; i < 26; i++) { const fx = r() * T; wrap(px => P.fern(x, px, 45 + r() * 30, 26 + r() * 24, r, '#6a8a3a'), fx, 50); }
    for (let i = 0; i < 16; i++) { const fx = r() * T; wrap(px => horsetails(x, px, 55 + r() * 30, 34 + r() * 26, r), fx, 40); }
    for (let i = 0; i < 6; i++) { const fx = r() * T; wrap(px => cycad(x, px, 60 + r() * 30, 60 + r() * 30, r), fx, 50); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };
  FG.morrison = (x, r) => { for (let i = 0; i < 16; i++) { const px = r() * T; wrap(p => horsetails(x, p, 168, 80 + r() * 50, r), px, 60); } };

  BL.gobi = function (r) {
    const L = [];
    let l = layer(320), x = l.ctx;
    ridge(x, T, 260, 90, 5, 341, '#e0b090');
    L.push({ canvas: l.c, factor: 0.05, y: 250 });
    l = layer(320), x = l.ctx;
    banded(x, 230, 120, 5, 342, ['#d8743a', '#c8643a', '#e08a4a', '#b8582e', '#d07040']);
    L.push({ canvas: l.c, factor: 0.18, y: 290 });
    l = layer(300), x = l.ctx;
    const nz = U.periodicNoise(343, 3);
    x.beginPath(); x.moveTo(0, 300);
    for (let px = 0; px <= T; px += 6) x.lineTo(px, 190 - nz((px / T) * 3) * 110);
    x.lineTo(T, 300); x.closePath(); x.fillStyle = '#e09a5a'; x.fill();
    for (let i = 0; i < 10; i++) { const cx = r() * T; wrap(px => araucaria(x, px, 230 + r() * 30, 60 + r() * 30, r, '#5a6a3a'), cx, 40); }
    L.push({ canvas: l.c, factor: 0.42, y: 330 });
    l = layer(170), x = l.ctx;
    groundBase(x, '#e0985a', '#b8703a', 351);
    x.strokeStyle = 'rgba(150,70,30,0.25)';
    for (let i = 0; i < 500; i++) { const rx = r() * T, ry = 30 + r() * 140; x.beginPath(); x.moveTo(rx, ry); x.quadraticCurveTo(rx + 15, ry - 2, rx + 30, ry); x.stroke(); }
    for (let i = 0; i < 12; i++) { const cx = r() * T; wrap(px => P.rock(x, px, 60 + r() * 60, 40 + r() * 50, 16 + r() * 18, r, '#a8582e'), cx, 60); }
    for (let i = 0; i < 8; i++) { const cx = r() * T; wrap(px => seedFernShrub(x, px, 60 + r() * 60, 30 + r() * 20, r), cx, 30); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };
  FG.gobi = (x, r) => { for (let i = 0; i < 9; i++) { const px = r() * T; wrap(p => P.rock(x, p, 160, 120 + r() * 80, 30 + r() * 40, r, '#8a4422'), px, 120); } };

  BL.yixian = function (r) {
    const L = [];
    let l = layer(400), x = l.ctx;
    ridge(x, T, 340, 160, 6, 361, '#8a9aa8', true);
    for (let i = 0; i < 3; i++) volcano(x, 400 + i * 800 + r() * 200, 360, 200 + r() * 80, 220, 0);
    L.push({ canvas: l.c, factor: 0.05, y: 160 });
    l = layer(300), x = l.ctx;
    x.fillStyle = '#7a98a8'; x.fillRect(0, 200, T, 100);
    for (let i = 0; i < 120; i++) { const cx = r() * T; wrap(px => P.conifer(x, px, 205, 40 + r() * 50, r, '#4f6a5a'), cx, 30); }
    x.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 70; i++) x.fillRect(r() * T, 215 + r() * 80, 20 + r() * 50, 1.5);
    L.push({ canvas: l.c, factor: 0.15, y: 330 });
    l = layer(600), x = l.ctx;
    for (let i = 0; i < 10; i++) { const cx = r() * T; wrap(px => ginkgoTree(x, px, 560, 240 + r() * 120, r, ['#e8c43a', '#d8b030', '#9ab83a', '#c8b03a']), cx, 120); }
    for (let i = 0; i < 9; i++) { const cx = r() * T; wrap(px => P.conifer(x, px, 560, 300 + r() * 160, r, '#2f4a36'), cx, 120); }
    L.push({ canvas: l.c, factor: 0.45, y: 50 });
    l = layer(170), x = l.ctx;
    groundBase(x, '#5a5a3a', '#3a3a24', 371);
    litter(x, r, 900, ['#e8c43a', '#9ab83a', '#7a6a3a']);
    for (let i = 0; i < 30; i++) { const fx = r() * T; wrap(px => P.fern(x, px, 40 + r() * 30, 30 + r() * 24, r, '#5a8a3a'), fx, 50); }
    for (let i = 0; i < 12; i++) { const fx = r() * T; wrap(px => horsetails(x, px, 50 + r() * 30, 36 + r() * 26, r), fx, 40); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };
  FG.yixian = (x, r) => { for (let i = 0; i < 18; i++) { const px = r() * T; wrap(p => P.fern(x, p, 165, 60 + r() * 50, r, '#4a7a32'), px, 80); } };

  BL.kemkem = function (r) {
    const L = [];
    let l = layer(260), x = l.ctx;
    ridge(x, T, 200, 30, 6, 381, '#b8b090');
    L.push({ canvas: l.c, factor: 0.05, y: 320 });
    l = layer(300), x = l.ctx;
    const wg = x.createLinearGradient(0, 120, 0, 300);
    wg.addColorStop(0, '#7a8a78'); wg.addColorStop(1, '#5a6a5a');
    x.fillStyle = wg; x.fillRect(0, 120, T, 180);
    x.fillStyle = 'rgba(255,255,240,0.18)';
    for (let i = 0; i < 120; i++) x.fillRect(r() * T, 130 + r() * 160, 20 + r() * 60, 1.5);
    for (let i = 0; i < 40; i++) { const cx = r() * T; wrap(px => P.conifer(x, px, 125, 40 + r() * 40, r, '#6a7a5a'), cx, 30); }
    L.push({ canvas: l.c, factor: 0.15, y: 380 });
    l = layer(600), x = l.ctx;
    for (let i = 0; i < 12; i++) { const cx = r() * T; wrap(px => treeFern(x, px, 565, 200 + r() * 120, r, '#4a7a32'), cx, 140); }
    for (let i = 0; i < 7; i++) { const cx = r() * T; wrap(px => P.conifer(x, px, 560, 300 + r() * 150, r, '#3f5a32'), cx, 120); }
    L.push({ canvas: l.c, factor: 0.48, y: 50 });
    l = layer(170), x = l.ctx;
    groundBase(x, '#6a5a3a', '#4a3a24', 391);
    for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(90,110,100,0.45)'; U.ellipse(x, r() * T, 70 + r() * 90, 50 + r() * 70, 8 + r() * 6, 0); x.fill(); }
    for (let i = 0; i < 18; i++) { const fx = r() * T; wrap(px => horsetails(x, px, 50 + r() * 40, 40 + r() * 30, r), fx, 40); }
    for (let i = 0; i < 20; i++) { const fx = r() * T; wrap(px => P.fern(x, px, 40 + r() * 30, 30 + r() * 20, r, '#5a7a32'), fx, 40); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };
  FG.kemkem = (x, r) => { for (let i = 0; i < 14; i++) { const px = r() * T; wrap(p => horsetails(x, p, 168, 90 + r() * 50, r), px, 60); } };

  BL.seaway = function (r) {
    const L = [];
    let l = layer(400), x = l.ctx;
    ridge(x, T, 280, 70, 8, 401, 'rgba(40,100,130,0.55)', true);
    ridge(x, T, 330, 50, 10, 402, 'rgba(30,85,115,0.7)', true);
    L.push({ canvas: l.c, factor: 0.1, y: 320 });
    l = layer(360), x = l.ctx;
    ridge(x, T, 270, 40, 10, 403, '#4a8a98');
    const crinoid = (cx, gy, h, col) => {
      x.strokeStyle = col; x.lineWidth = 2;
      x.beginPath(); x.moveTo(cx, gy); x.quadraticCurveTo(cx + h * 0.1, gy - h * 0.5, cx, gy - h); x.stroke();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k - 4.5) * 0.3; x.beginPath(); x.moveTo(cx, gy - h); x.quadraticCurveTo(cx + Math.cos(a) * h * 0.2, gy - h + Math.sin(a) * h * 0.2, cx + Math.cos(a) * h * 0.25, gy - h + Math.sin(a) * h * 0.1 + h * 0.15); x.stroke(); }
    };
    for (let i = 0; i < 30; i++) { const cx = r() * T; wrap(px => crinoid(px, 270, 60 + r() * 60, '#6aa0a8'), cx, 40); }
    L.push({ canvas: l.c, factor: 0.35, y: 330 });
    l = layer(240), x = l.ctx;
    const gg = x.createLinearGradient(0, 0, 0, 240);
    gg.addColorStop(0, '#d8d4c0'); gg.addColorStop(1, '#a8a490');
    x.fillStyle = gg; x.fillRect(0, 70, T, 170);
    ridge(x, T, 80, 18, 8, 404, '#d8d4c0');
    // giant Inoceramus clams, ammonite shells, sponges, crinoids
    for (let i = 0; i < 18; i++) { const cx = r() * T; wrap(px => { x.fillStyle = '#b8b098'; U.ellipse(x, px, 110 + r() * 40, 40 + r() * 30, 12, 0); x.fill(); x.strokeStyle = 'rgba(90,80,60,0.5)'; for (let k = 1; k < 6; k++) { x.beginPath(); x.ellipse(px, 112, 8 * k, 2.5 * k, 0, Math.PI, 0); x.stroke(); } }, cx, 60); }
    for (let i = 0; i < 16; i++) { const cx = r() * T; wrap(px => { const y = 110 + r() * 80, s = 8 + r() * 10; x.fillStyle = '#c8a878'; U.ellipse(x, px, y, s, s, 0); x.fill(); x.strokeStyle = '#8a6a48'; x.beginPath(); for (let t = 0; t < 14; t += 0.2) { const rr = s * Math.exp(-t * 0.16); t ? x.lineTo(px + Math.cos(t) * rr, y + Math.sin(t) * rr) : x.moveTo(px + Math.cos(t) * rr, y + Math.sin(t) * rr); } x.stroke(); }, cx, 30); }
    for (let i = 0; i < 14; i++) { const cx = r() * T; wrap(px => { x.fillStyle = r() < 0.5 ? '#c89a5a' : '#a8865a'; const h = 30 + r() * 40; U.roundRect(x, px - 10, 95 - h, 20, h + 8, 8); x.fill(); x.fillStyle = 'rgba(0,0,0,0.25)'; U.ellipse(x, px, 95 - h + 4, 7, 3, 0); x.fill(); }, cx, 30); }
    for (let i = 0; i < 24; i++) { const cx = r() * T; wrap(px => crinoid(px, 100 + r() * 30, 70 + r() * 70, r() < 0.5 ? '#c86a8a' : '#d8a060'), cx, 40); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 90 });
    return L;
  };
  FG.seaway = (x, r) => {
    for (let i = 0; i < 12; i++) { const px = r() * T; wrap(p => { x.strokeStyle = 'rgba(40,30,50,0.8)'; x.lineWidth = 3; const h = 120 + r() * 80; x.beginPath(); x.moveTo(p, 170); x.quadraticCurveTo(p + 15, 170 - h * 0.5, p, 170 - h); x.stroke(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k - 4.5) * 0.3; x.beginPath(); x.moveTo(p, 170 - h); x.quadraticCurveTo(p + Math.cos(a) * 30, 170 - h + Math.sin(a) * 30, p + Math.cos(a) * 40, 170 - h + 25); x.stroke(); } }, px, 60); }
  };

  BL.solnhofen = function (r) {
    const L = [];
    let l = layer(300), x = l.ctx;
    x.fillStyle = '#6ab0c0'; x.fillRect(0, 180, T, 120);
    for (let i = 0; i < 8; i++) { const cx = r() * T; wrap(px => { x.fillStyle = '#c8bc90'; U.ellipse(x, px, 185, 90 + r() * 80, 14, 0); x.fill(); for (let k = 0; k < 6; k++) P.conifer(x, px + (r() - 0.5) * 120, 182, 18 + r() * 14, r, '#5a7a4a'); }, cx, 160); }
    x.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 80; i++) x.fillRect(r() * T, 200 + r() * 90, 20 + r() * 40, 1.5);
    L.push({ canvas: l.c, factor: 0.1, y: 290 });
    l = layer(320), x = l.ctx;
    x.fillStyle = '#7ac0c8'; x.fillRect(0, 170, T, 150);
    for (let i = 0; i < 6; i++) { const cx = r() * T; wrap(px => { x.fillStyle = '#d8ccA0'.toLowerCase(); U.ellipse(x, px, 190, 200 + r() * 140, 30, 0); x.fill(); for (let k = 0; k < 5; k++) cycad(x, px + (r() - 0.5) * 240, 182, 40 + r() * 30, r, '#5a7a3a'); for (let k = 0; k < 3; k++) P.conifer(x, px + (r() - 0.5) * 200, 180, 60 + r() * 40, r, '#4a6a3a'); }, cx, 260); }
    L.push({ canvas: l.c, factor: 0.32, y: 320 });
    l = layer(170), x = l.ctx;
    groundBase(x, '#e4dcbc', '#c0b490', 411);
    for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(110,180,190,0.55)'; U.ellipse(x, r() * T, 70 + r() * 90, 50 + r() * 80, 8 + r() * 6, 0); x.fill(); }
    x.strokeStyle = 'rgba(140,120,80,0.25)';
    for (let i = 0; i < 160; i++) { const rx = r() * T, ry = 40 + r() * 120; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx + 30 + r() * 30, ry + (r() - 0.5) * 4); x.stroke(); }
    for (let i = 0; i < 10; i++) { const fx = r() * T; wrap(px => cycad(x, px, 50 + r() * 30, 40 + r() * 30, r), fx, 50); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };
  FG.solnhofen = (x, r) => { for (let i = 0; i < 10; i++) { const px = r() * T; wrap(p => cycad(x, p, 170, 90 + r() * 40, r, '#4a6a2a'), px, 80); } };

  BL.ischigualasto = function (r) {
    const L = [];
    let l = layer(400), x = l.ctx;
    ridge(x, T, 340, 120, 6, 421, '#a09088', true);
    for (let i = 0; i < 3; i++) volcano(x, 300 + i * 800 + r() * 200, 350, 180 + r() * 100, 200, 0);
    L.push({ canvas: l.c, factor: 0.05, y: 170 });
    l = layer(340), x = l.ctx;
    banded(x, 250, 150, 6, 422, ['#c8c0b4', '#a8988a', '#d8cec0', '#9a6a5a', '#c8b8a8', '#8a6a5a']);
    L.push({ canvas: l.c, factor: 0.2, y: 280 });
    l = layer(520), x = l.ctx;
    for (let i = 0; i < 9; i++) { const cx = r() * T; wrap(px => araucaria(x, px, 500, 240 + r() * 120, r, '#4a5a32'), cx, 120); }
    for (let i = 0; i < 14; i++) { const cx = r() * T; wrap(px => seedFernShrub(x, px, 505, 120 + r() * 60, r), cx, 80); }
    L.push({ canvas: l.c, factor: 0.48, y: 110 });
    l = layer(170), x = l.ctx;
    groundBase(x, '#a8968a', '#7a6a60', 431);
    for (let i = 0; i < 300; i++) { x.fillStyle = r() < 0.5 ? 'rgba(150,90,80,0.3)' : 'rgba(230,220,210,0.3)'; U.ellipse(x, r() * T, 30 + r() * 140, 6 + r() * 20, 2 + r() * 4, 0); x.fill(); }
    for (let i = 0; i < 12; i++) { const cx = r() * T; wrap(px => P.rock(x, px, 60 + r() * 60, 40 + r() * 50, 16 + r() * 16, r, '#8a7a72'), cx, 60); }
    for (let i = 0; i < 12; i++) { const fx = r() * T; wrap(px => seedFernShrub(x, px, 50 + r() * 50, 40 + r() * 20, r), fx, 40); }
    for (let i = 0; i < 8; i++) { const fx = r() * T; wrap(px => horsetails(x, px, 60 + r() * 40, 36 + r() * 20, r), fx, 40); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };
  FG.ischigualasto = (x, r) => { for (let i = 0; i < 12; i++) { const px = r() * T; wrap(p => seedFernShrub(x, p, 168, 110 + r() * 50, r), px, 70); } };

  Object.assign(B.SKIES, {
    hellcreek: ['#c8c48a', '#e2dcb4', '#ece4c8'],
    morrison: ['#78acd6', '#c4dcea', '#f0e2c4'],
    gobi: ['#7ab0dc', '#e0e0d0', '#f8d4a0'],
    yixian: ['#8aa8bc', '#c8d8e0', '#e4e8e0'],
    kemkem: ['#c0b488', '#e4d8b4', '#f0e6cc'],
    seaway: ['#0c3650', '#1a6684', '#3896ac'],
    solnhofen: ['#86bee0', '#d4eaf0', '#f4eccc'],
    ischigualasto: ['#a89a92', '#d0c4b4', '#e6dac6'],
  });
  Object.assign(B.LOOK, {
    hellcreek: 'rainforest', morrison: 'savanna', gobi: 'desert', yixian: 'forest',
    kemkem: 'rainforest', seaway: 'reef', solnhofen: 'desert', ischigualasto: 'savanna',
  });
  B.LEAF_COLORS = { yixian: ['#e8c43a', '#d8b030', '#9ab83a'] };

  // Volcanic ash drifting through the Triassic sky
  B.extraAtmo.ischigualasto = function (ctx, w, h, t, camX) {
    const r = U.rng(321);
    ctx.fillStyle = 'rgba(90,80,80,0.35)';
    for (let i = 0; i < 70; i++) {
      const px = ((r() * w * 2 - camX * 0.7 - t * 12) % w + w) % w;
      const py = (r() * h + t * (8 + r() * 10)) % h;
      U.ellipse(ctx, px, py, 1 + r() * 1.5, 1 + r() * 1.5, 0); ctx.fill();
    }
    ctx.fillStyle = 'rgba(150,120,100,0.08)'; ctx.fillRect(0, 0, w, h);
  };
  // Pteranodons fly near the surface of the seaway: show the sunlit surface line
  B.extraAtmo.seaway = function (ctx, w, h, t, camX) {
    const k = h / B.SCENE_H;
    ctx.save();
    ctx.strokeStyle = 'rgba(220,245,255,0.35)'; ctx.lineWidth = 3 * k;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 10) { const y = 60 * k + Math.sin(x * 0.02 + t * 1.5 - camX * 0.01) * 6 * k; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.restore();
  };
  // Pollen and insects in the humid Cretaceous forest
  B.extraAtmo.hellcreek = function (ctx, w, h, t, camX) {
    const r = U.rng(77);
    for (let i = 0; i < 40; i++) {
      const px = ((r() * w * 2 - camX * 0.5 + Math.sin(t + i) * 20) % w + w) % w;
      const py = (r() * h * 0.8 + Math.cos(t * 0.7 + i) * 10);
      ctx.fillStyle = `rgba(255,250,200,${0.25 + 0.25 * Math.sin(t * 2 + i)})`;
      U.ellipse(ctx, px, py, 1.5, 1.5, 0); ctx.fill();
    }
  };

  // Top-down arena looks for the eras
  Object.assign(B.ARENA_STYLE, {
    hellcreek: { base: ['#4a5a2c', '#3a4622'], cover: '#3f7a36', coverName: 'ferns', look: 'rainforest', leaves: ['#5a6a2a', '#6a5a2a', '#3a5a22'] },
    morrison: { base: ['#9a8a5a', '#7a6a42'], cover: '#6a8a2a', coverName: 'horsetails', look: 'forest', leaves: ['#7a6a3a', '#5a6a32', '#8a7a4a'] },
    gobi: { base: ['#e0985a', '#c4783e'], cover: '#9a5a34', coverName: 'rocks', look: 'desert' },
    yixian: { base: ['#5a5a3a', '#44442a'], cover: '#4a7a32', coverName: 'ferns', look: 'forest', leaves: ['#e8c43a', '#9ab83a', '#7a6a3a'] },
    kemkem: { base: ['#6a5a3a', '#4e4028'], cover: '#4a7a32', coverName: 'horsetails', look: 'rainforest', leaves: ['#6a5a3a', '#5a6a3a', '#7a6a4a'] },
    kemkemriver: { base: ['#5a6a52', '#45553f'], cover: '#4a7a32', coverName: 'horsetails', look: 'rainforest', leaves: ['#4a5a4a', '#5a6a5a', '#6a6a4a'] },
    riverwater: { base: ['#4a6a5a', '#3a5a4a'], cover: '#6a8a5a', coverName: 'weed beds', look: 'lake', water: true },
    seawater: { base: ['#b8c8b8', '#8aaab0'], cover: '#c86a8a', coverName: 'sea lilies', look: 'seafloor', water: true },
    seasurface: { base: ['#2a6a90', '#1d5274'], cover: '#e8f2fa', coverName: 'foam', look: 'lake', water: true },
    lagoon: { base: ['#5ab0b8', '#3a8a98'], cover: '#d8cca0', coverName: 'sandbars', look: 'lake', water: true },
    solnhofen: { base: ['#e0d8b8', '#c4b896'], cover: '#5a7a3a', coverName: 'cycads', look: 'desert' },
    ischigualasto: { base: ['#b0a090', '#8a7868'], cover: '#7a6a5a', coverName: 'rocks', look: 'desert' },
  });

  B.prims.treeFern = treeFern; B.prims.cycad = cycad; B.prims.araucaria = araucaria; B.prims.horsetails = horsetails; B.prims.seedFernShrub = seedFernShrub;
})(window.WE);
