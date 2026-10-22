// Painted, procedurally generated habitat scenery: side-view parallax layers for
// exploration, and top-down ground for the hunt/survive minigames.
(function (WE) {
  const U = WE.U;
  const B = {};
  B.SCENE_H = 720;
  B.GROUND = 610;           // walking line in exploration scenes
  B.TILE = 2400;            // parallax tile width (seamless)

  // ===================================================================
  // Vegetation & scenery primitives (side view)
  // ===================================================================
  function acacia(ctx, x, gy, h, r, opt) {
    opt = opt || {};
    const trunk = opt.trunk || '#4a3826', leaf = opt.leaf || '#5d7a2e';
    const w = h * (1.1 + r() * 0.5);
    ctx.save();
    ctx.translate(x, gy);
    // Trunk splits into a V of branches
    ctx.fillStyle = trunk;
    const forks = [[-0.35, -0.75], [0.05, -0.85], [0.4, -0.7]];
    ctx.beginPath(); U.taperPath(ctx, [[0, 0], [w * 0.02, -h * 0.25], [-w * 0.02, -h * 0.45]], h * 0.06, h * 0.035); ctx.fill();
    for (const f of forks) {
      ctx.beginPath();
      U.taperPath(ctx, U.bezierPts([-w * 0.02, -h * 0.45], [w * f[0] * 0.4, -h * 0.6], [w * f[0], h * f[1]], null, 6), h * 0.035, h * 0.012);
      ctx.fill();
    }
    // Flat-topped canopy: overlapping flattened clumps, darker below
    const top = -h * 0.92;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 14; i++) {
        const t = i / 13;
        const cx = U.lerp(-w * 0.55, w * 0.55, t) + (r() - 0.5) * w * 0.08;
        const cy = top + (pass ? -h * 0.03 : h * 0.06) + Math.abs(t - 0.5) * h * 0.1 + (r() - 0.5) * h * 0.04;
        const rx = w * (0.1 + r() * 0.08), ry = h * (0.05 + r() * 0.035);
        ctx.fillStyle = pass ? U.shade(leaf, 0.08 + r() * 0.1) : U.shade(leaf, -0.3);
        U.ellipse(ctx, cx, cy, rx, ry, 0); ctx.fill();
      }
    }
    // Leaf speckle highlights
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = U.rgba(U.shade(leaf, 0.35), 0.6);
      U.ellipse(ctx, (r() - 0.5) * w * 1.1, top - h * 0.05 + r() * h * 0.06, 2 + r() * 2, 1 + r(), 0); ctx.fill();
    }
    ctx.restore();
  }

  function conifer(ctx, x, gy, h, r, color) {
    const c = color || '#2f4a32';
    const w = h * (0.28 + r() * 0.08);
    ctx.save();
    ctx.translate(x, gy);
    ctx.fillStyle = '#3d2a1c';
    ctx.fillRect(-h * 0.015, -h * 0.2, h * 0.03, h * 0.2);
    const tiers = 9;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers;
      const ty = -h * 0.12 - t * h * 0.86;
      const tw = w * (1 - t * 0.88);
      ctx.fillStyle = U.shade(c, (i % 2 ? -0.1 : 0.04) + t * 0.12);
      ctx.beginPath();
      ctx.moveTo(-tw, ty + h * 0.03);
      // jagged lower edge
      for (let k = 0; k <= 6; k++) {
        const kx = U.lerp(-tw, tw, k / 6);
        ctx.lineTo(kx, ty + h * 0.03 + (k % 2 ? -h * 0.012 : h * 0.01) + r() * 2);
      }
      ctx.lineTo(0, ty - h * 0.14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function deciduous(ctx, x, gy, h, r, palette, trunkCol) {
    ctx.save();
    ctx.translate(x, gy);
    const tw = h * 0.05;
    ctx.fillStyle = trunkCol || '#4a3626';
    ctx.beginPath(); U.taperPath(ctx, [[0, 0], [r() * 6 - 3, -h * 0.35], [r() * 10 - 5, -h * 0.6]], tw * 2, tw * 0.8); ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      U.taperPath(ctx, U.bezierPts([0, -h * 0.45], [(i - 1) * h * 0.12, -h * 0.6], [(i - 1) * h * 0.25, -h * 0.75], null, 5), tw * 0.9, tw * 0.3);
      ctx.fill();
    }
    const cw = h * 0.36, cyc = -h * 0.72;
    for (let i = 0; i < 46; i++) {
      const a = r() * U.TAU, d = Math.sqrt(r());
      const px = Math.cos(a) * cw * d, py = cyc + Math.sin(a) * cw * 0.75 * d;
      const col = palette[Math.floor(r() * palette.length)];
      const shade = (py - cyc) / cw * -0.25;
      ctx.fillStyle = U.shade(col, shade + (r() - 0.5) * 0.1);
      U.ellipse(ctx, px, py, h * (0.06 + r() * 0.05), h * (0.05 + r() * 0.04), 0); ctx.fill();
    }
    ctx.restore();
  }

  function birch(ctx, x, gy, h, r, palette) {
    ctx.save();
    ctx.translate(x, gy);
    const w = h * 0.03;
    ctx.fillStyle = '#eeeae0';
    ctx.beginPath(); U.taperPath(ctx, [[0, 0], [r() * 6 - 3, -h * 0.5], [r() * 8 - 4, -h * 0.95]], w * 2, w); ctx.fill();
    ctx.fillStyle = '#2a2622';
    for (let i = 0; i < 14; i++) { ctx.fillRect(-w * 0.9 + r() * w, -r() * h * 0.9, w * (0.4 + r()), 2); }
    for (let i = 0; i < 30; i++) {
      const px = (r() - 0.5) * h * 0.4, py = -h * (0.55 + r() * 0.42);
      ctx.fillStyle = palette[Math.floor(r() * palette.length)];
      U.ellipse(ctx, px, py, h * 0.04, h * 0.03, 0); ctx.fill();
    }
    ctx.restore();
  }

  function rainTree(ctx, x, gy, h, r, col) {
    // Emergent rainforest tree: buttress roots, tall trunk, crown above the view.
    ctx.save();
    ctx.translate(x, gy);
    const w = h * 0.045;
    const g = ctx.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, U.shade(col, -0.35)); g.addColorStop(0.5, col); g.addColorStop(1, U.shade(col, -0.45));
    ctx.fillStyle = g;
    ctx.fillRect(-w, -h, w * 2, h);
    // buttresses
    ctx.fillStyle = U.shade(col, -0.15);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * w * 0.6, -h * 0.25);
      ctx.quadraticCurveTo(s * w * 1.2, -h * 0.05, s * w * 4, 0);
      ctx.lineTo(s * w * 0.6, 0);
      ctx.fill();
    }
    // moss / bark streaks
    ctx.strokeStyle = 'rgba(70,110,50,0.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const yy = -r() * h; ctx.beginPath(); ctx.moveTo(-w, yy); ctx.lineTo(-w + r() * w * 2, yy - 20); ctx.stroke(); }
    ctx.restore();
  }

  function vine(ctx, x, top, len, r, col) {
    ctx.strokeStyle = col || '#3d5a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, top);
    let px = x, py = top;
    for (let i = 0; i < 10; i++) {
      const nx = x + Math.sin(i * 0.9 + r() * 2) * 10, ny = top + (i + 1) * len / 10;
      ctx.quadraticCurveTo(px + 6, (py + ny) / 2, nx, ny);
      px = nx; py = ny;
      if (i % 2) {
        ctx.save(); ctx.fillStyle = U.shade(col || '#3d5a2a', 0.2);
        U.ellipse(ctx, nx + 5, ny, 6, 3, 0.5); ctx.fill(); ctx.restore();
      }
    }
    ctx.stroke();
  }

  function fern(ctx, x, gy, s, r, col) {
    ctx.save();
    ctx.translate(x, gy);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.32 + (r() - 0.5) * 0.1;
      const len = s * (0.7 + r() * 0.4);
      const pts = U.bezierPts([0, 0], [Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.6], [Math.cos(a) * len, Math.sin(a) * len * 0.7 + len * 0.15], null, 10);
      ctx.strokeStyle = U.shade(col, -0.2); ctx.lineWidth = 1.5;
      ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      for (let k = 1; k < pts.length; k++) {
        const p = pts[k], q = pts[k - 1];
        const ang = Math.atan2(p[1] - q[1], p[0] - q[0]);
        const l = s * 0.16 * (1 - k / pts.length);
        ctx.fillStyle = U.shade(col, (r() - 0.5) * 0.15);
        for (const sgn of [-1, 1]) {
          U.ellipse(ctx, p[0] + Math.cos(ang + sgn * 1.2) * l * 0.6, p[1] + Math.sin(ang + sgn * 1.2) * l * 0.6, l * 0.6, l * 0.22, ang + sgn * 1.2); ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function bigLeaf(ctx, x, y, s, ang, col) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
    g.addColorStop(0, U.shade(col, 0.15)); g.addColorStop(1, U.shade(col, -0.25));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 0.3, -s * 0.35, s * 0.8, -s * 0.3, s, 0);
    ctx.bezierCurveTo(s * 0.8, s * 0.3, s * 0.3, s * 0.35, 0, 0);
    ctx.fill();
    ctx.strokeStyle = U.rgba(U.shade(col, 0.4), 0.6); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.95, 0); ctx.stroke();
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(s * i / 6, 0); ctx.lineTo(s * i / 6 + s * 0.08, -s * 0.18); ctx.moveTo(s * i / 6, 0); ctx.lineTo(s * i / 6 + s * 0.08, s * 0.18); ctx.stroke();
    }
    ctx.restore();
  }

  function grassTuft(ctx, x, gy, h, r, c1, c2) {
    const n = 6 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const bx = x + (r() - 0.5) * h * 0.5;
      const bh = h * (0.5 + r() * 0.6);
      const lean = (r() - 0.5) * h * 0.5;
      ctx.fillStyle = U.mix(c1, c2, r());
      ctx.beginPath();
      ctx.moveTo(bx - 1.5, gy);
      ctx.quadraticCurveTo(bx + lean * 0.4, gy - bh * 0.6, bx + lean, gy - bh);
      ctx.quadraticCurveTo(bx + lean * 0.3, gy - bh * 0.5, bx + 1.5, gy);
      ctx.fill();
    }
  }

  function rock(ctx, x, gy, w, h, r, col) {
    ctx.save();
    const pts = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([x - w / 2 + t * w, gy - Math.sin(t * Math.PI) * h * (0.75 + r() * 0.35)]);
    }
    ctx.beginPath();
    ctx.moveTo(x - w / 2, gy);
    U.smoothPath(ctx, pts, false, 0.6);
    ctx.lineTo(x + w / 2, gy);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - w / 2, gy - h, x + w / 3, gy);
    g.addColorStop(0, U.shade(col, 0.25)); g.addColorStop(1, U.shade(col, -0.35));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  function termiteMound(ctx, x, gy, h, r) {
    ctx.save();
    const w = h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x - w, gy);
    ctx.quadraticCurveTo(x - w * 0.6, gy - h * 0.5, x - w * 0.15, gy - h);
    ctx.quadraticCurveTo(x, gy - h * 1.08, x + w * 0.12, gy - h * 0.9);
    ctx.quadraticCurveTo(x + w * 0.5, gy - h * 0.4, x + w, gy);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, '#b0703a'); g.addColorStop(0.6, '#8a5228'); g.addColorStop(1, '#5e3418');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  function datePalm(ctx, x, gy, h, r) {
    ctx.save();
    ctx.translate(x, gy);
    const lean = (r() - 0.5) * h * 0.3;
    const pts = U.bezierPts([0, 0], [lean * 0.3, -h * 0.5], [lean, -h], null, 12);
    ctx.fillStyle = '#7a5a36';
    U.taperPath(ctx, pts, h * 0.06, h * 0.04); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 1;
    for (let i = 1; i < pts.length; i++) { ctx.beginPath(); ctx.moveTo(pts[i][0] - h * 0.025, pts[i][1]); ctx.lineTo(pts[i][0] + h * 0.025, pts[i][1] + 3); ctx.stroke(); }
    const top = pts[pts.length - 1];
    for (let i = 0; i < 13; i++) {
      const a = -Math.PI / 2 + (i - 6) * 0.42 + (r() - 0.5) * 0.1;
      const len = h * (0.35 + r() * 0.12);
      const fp = U.bezierPts(top, [top[0] + Math.cos(a) * len * 0.6, top[1] + Math.sin(a) * len * 0.6 - len * 0.1], [top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len * 0.5 + len * 0.35], null, 10);
      ctx.strokeStyle = '#4f6a2a'; ctx.lineWidth = 2;
      ctx.beginPath(); fp.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      ctx.strokeStyle = i % 2 ? '#5f7d32' : '#6f8d3a'; ctx.lineWidth = 1.2;
      for (let k = 2; k < fp.length; k++) {
        const p = fp[k];
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a + 1.3) * 9, p[1] + Math.sin(a + 1.3) * 9 + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a - 1.3) * 9, p[1] + Math.sin(a - 1.3) * 9 + 4); ctx.stroke();
      }
    }
    ctx.fillStyle = '#9a4a1a';
    for (let i = 0; i < 8; i++) { U.ellipse(ctx, top[0] + (r() - 0.5) * 16, top[1] + 8 + r() * 10, 3, 4, 0); ctx.fill(); }
    ctx.restore();
  }

  // ---- Coral reef pieces ----
  function branchCoral(ctx, x, gy, h, r, col) {
    ctx.strokeStyle = col; ctx.lineCap = 'round';
    const branch = (bx, by, a, len, w, depth) => {
      const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      if (depth > 0) {
        branch(ex, ey, a - 0.35 - r() * 0.3, len * 0.72, w * 0.75, depth - 1);
        branch(ex, ey, a + 0.35 + r() * 0.3, len * 0.72, w * 0.75, depth - 1);
      } else {
        ctx.fillStyle = U.shade(col, 0.3); U.ellipse(ctx, ex, ey, w * 0.7, w * 0.7, 0); ctx.fill();
      }
    };
    branch(x, gy, -Math.PI / 2 + (r() - 0.5) * 0.3, h * 0.35, h * 0.08, 4);
  }

  function brainCoral(ctx, x, gy, w, r, col) {
    ctx.save();
    const h = w * 0.6;
    ctx.beginPath(); ctx.ellipse(x, gy, w / 2, h, 0, Math.PI, 0); ctx.closePath();
    const g = ctx.createRadialGradient(x - w * 0.15, gy - h * 0.6, 2, x, gy - h * 0.3, w * 0.6);
    g.addColorStop(0, U.shade(col, 0.3)); g.addColorStop(1, U.shade(col, -0.3));
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = U.rgba(U.shade(col, -0.45), 0.7); ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      let px = x - w / 2, py = gy - h * (i / 9) * 1.1;
      ctx.moveTo(px, py);
      for (let k = 0; k < 12; k++) { px += w / 12; ctx.lineTo(px, py + Math.sin(k * 1.7 + i) * 4); }
      ctx.stroke();
    }
    ctx.restore();
  }

  function seaFan(ctx, x, gy, h, r, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.globalAlpha = 0.9;
    const rec = (bx, by, a, len, depth) => {
      const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
      ctx.lineWidth = 0.8 + depth * 0.5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      if (depth > 0) { rec(ex, ey, a - 0.4, len * 0.78, depth - 1); rec(ex, ey, a + 0.4, len * 0.78, depth - 1); }
    };
    rec(x, gy, -Math.PI / 2, h * 0.25, 6);
    ctx.restore();
  }

  function anemone(ctx, x, gy, s, r, col, t) {
    ctx.save();
    ctx.fillStyle = U.shade(col, -0.3);
    U.ellipse(ctx, x, gy - s * 0.15, s * 0.45, s * 0.2, 0); ctx.fill();
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (i - 13) * 0.11;
      const len = s * (0.6 + r() * 0.3);
      const sway = Math.sin((t || 0) * 2 + i * 0.5) * 0.15;
      const ex = x + Math.cos(a + sway) * len, ey = gy - s * 0.2 + Math.sin(a + sway) * len;
      ctx.strokeStyle = U.shade(col, (r() - 0.5) * 0.2); ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + (i - 13) * s * 0.025, gy - s * 0.2);
      ctx.quadraticCurveTo((x + ex) / 2 + sway * 20, (gy + ey) / 2, ex, ey); ctx.stroke();
      ctx.fillStyle = U.shade(col, 0.4); U.ellipse(ctx, ex, ey, s * 0.04, s * 0.04, 0); ctx.fill();
    }
    ctx.restore();
  }

  // ---- Ice ----
  function iceBlock(ctx, x, gy, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, gy);
    ctx.lineTo(x - w * 0.4, gy - h * (0.6 + r() * 0.3));
    ctx.lineTo(x - w * 0.05, gy - h);
    ctx.lineTo(x + w * 0.3, gy - h * (0.7 + r() * 0.2));
    ctx.lineTo(x + w / 2, gy);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - w / 2, gy - h, x + w / 2, gy);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#d8ecf6'); g.addColorStop(1, '#8cb9d6');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(120,170,200,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // ===================================================================
  // Layer builders: each returns [{canvas, factor, y}] (far -> near)
  // ===================================================================
  function layer(h) {
    const c = U.canvas(B.TILE, h);
    return { c, ctx: c.getContext('2d') };
  }
  // Silhouette ridge: periodic noise so tiles join seamlessly.
  function ridge(ctx, w, base, amp, period, seed, col, octaves) {
    const nz = U.periodicNoise(seed, period);
    const nz2 = U.periodicNoise(seed + 7, period * 3);
    ctx.beginPath();
    ctx.moveTo(0, ctx.canvas.height);
    for (let x = 0; x <= w; x += 4) {
      const t = (x / w) * period;
      let y = base - nz(t) * amp;
      if (octaves) y -= (nz2(t * 3) - 0.5) * amp * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, ctx.canvas.height);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }
  // Repeat a drawing at x and x±TILE so items crossing the seam wrap.
  function wrap(fn, x, margin) {
    fn(x);
    if (x < margin) fn(x + B.TILE);
    if (x > B.TILE - margin) fn(x - B.TILE);
  }

  const builders = {};

  builders.savanna = function (r) {
    const L = [];
    // Kilimanjaro-esque distant mountain + hills
    let l = layer(420);
    let x = l.ctx;
    ridge(x, B.TILE, 380, 60, 6, 11, '#b9b6c8');
    // snow-capped volcano
    x.fillStyle = '#a7a3ba';
    x.beginPath(); x.moveTo(900, 420); x.quadraticCurveTo(1150, 250, 1260, 170); x.lineTo(1420, 165); x.quadraticCurveTo(1560, 260, 1820, 420); x.fill();
    x.fillStyle = '#f2f0f5';
    x.beginPath(); x.moveTo(1235, 188); x.lineTo(1262, 170); x.lineTo(1420, 165); x.lineTo(1448, 185);
    for (let i = 0; i < 8; i++) x.lineTo(1448 - i * 27, 192 + (i % 2) * 14);
    x.fill();
    L.push({ canvas: l.c, factor: 0.04, y: 160 });

    l = layer(300); x = l.ctx;
    ridge(x, B.TILE, 250, 80, 8, 21, '#9fa27a', true);
    for (let i = 0; i < 26; i++) { const ax = r() * B.TILE; wrap(px => acacia(x, px, 250 - r() * 20, 26 + r() * 14, r, { trunk: '#6f7a58', leaf: '#7f8a5e' }), ax, 60); }
    L.push({ canvas: l.c, factor: 0.12, y: 330 });

    l = layer(260); x = l.ctx;
    const g = x.createLinearGradient(0, 120, 0, 260);
    g.addColorStop(0, '#c7a55a'); g.addColorStop(1, '#b08d45');
    ridge(x, B.TILE, 170, 30, 6, 31, g);
    for (let i = 0; i < 9; i++) { const ax = r() * B.TILE; wrap(px => acacia(x, px, 175 + r() * 20, 90 + r() * 50, r), ax, 160); }
    L.push({ canvas: l.c, factor: 0.35, y: 400 });

    // Ground plane
    l = layer(170); x = l.ctx;
    const gg = x.createLinearGradient(0, 0, 0, 170);
    gg.addColorStop(0, '#c9a55a'); gg.addColorStop(0.4, '#b89448'); gg.addColorStop(1, '#8d6c32');
    x.fillStyle = gg; x.fillRect(0, 20, B.TILE, 150);
    ridge(x, B.TILE, 30, 10, 12, 41, '#c9a55a');
    for (let i = 0; i < 900; i++) grassTuft(x, r() * B.TILE, 20 + r() * 150, 10 + r() * 18, r, '#a8873e', '#e2c27a');
    for (let i = 0; i < 4; i++) { const ax = r() * B.TILE; wrap(px => termiteMound(x, px, 70 + r() * 30, 60 + r() * 40, r), ax, 60); }
    for (let i = 0; i < 10; i++) { const ax = r() * B.TILE; wrap(px => rock(x, px, 80 + r() * 60, 30 + r() * 30, 14 + r() * 12, r, '#8a7a66'), ax, 60); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };

  builders.rainforest = function (r) {
    const L = [];
    let l = layer(720), x = l.ctx;
    // distant misty canopy walls
    for (let k = 0; k < 3; k++) {
      const col = ['#8fb59a', '#6f9c7c', '#507f5e'][k];
      for (let i = 0; i < 40; i++) {
        const cx = r() * B.TILE, cy = 200 + k * 70 + r() * 60, rad = 50 + r() * 60;
        wrap(px => { x.fillStyle = col; U.ellipse(x, px, cy, rad, rad * 0.8, 0); x.fill(); }, cx, 120);
      }
      x.fillStyle = col; x.fillRect(0, 250 + k * 70, B.TILE, 720);
    }
    L.push({ canvas: l.c, factor: 0.08, y: 0 });

    l = layer(720); x = l.ctx;
    for (let i = 0; i < 18; i++) { const tx = r() * B.TILE; wrap(px => rainTree(x, px, 640, 640, r, '#4f5a44'), tx, 80); }
    for (let i = 0; i < 50; i++) {
      const cx = r() * B.TILE, cy = r() * 140, rad = 70 + r() * 80;
      wrap(px => { x.fillStyle = U.mix('#2f5e38', '#3f7346', r()); U.ellipse(x, px, cy, rad, rad * 0.6, 0); x.fill(); }, cx, 160);
    }
    for (let i = 0; i < 16; i++) { const vx = r() * B.TILE; wrap(px => vine(x, px, 60, 200 + r() * 300, r, '#2f4a28'), vx, 20); }
    L.push({ canvas: l.c, factor: 0.25, y: 0 });

    l = layer(720); x = l.ctx;
    for (let i = 0; i < 7; i++) { const tx = r() * B.TILE; wrap(px => rainTree(x, px, 650, 680, r, '#5c4a36'), tx, 120); }
    for (let i = 0; i < 26; i++) { const vx = r() * B.TILE; wrap(px => vine(x, px, 0, 250 + r() * 300, r, '#2f5226'), vx, 20); }
    for (let i = 0; i < 40; i++) { const fx = r() * B.TILE; wrap(px => fern(x, px, 650, 60 + r() * 50, r, '#3f6e36'), fx, 80); }
    L.push({ canvas: l.c, factor: 0.5, y: 0 });

    l = layer(180); x = l.ctx;
    const gg = x.createLinearGradient(0, 0, 0, 180);
    gg.addColorStop(0, '#4a3a24'); gg.addColorStop(1, '#2a2014');
    x.fillStyle = gg; x.fillRect(0, 26, B.TILE, 160);
    ridge(x, B.TILE, 36, 12, 10, 52, '#4a3a24');
    // leaf litter
    for (let i = 0; i < 1600; i++) {
      x.fillStyle = U.mix('#6a4a24', '#a8743a', r());
      U.ellipse(x, r() * B.TILE, 28 + r() * 150, 3 + r() * 4, 1.5 + r() * 2, r() * 3); x.fill();
    }
    for (let i = 0; i < 40; i++) { const fx = r() * B.TILE; wrap(px => fern(x, px, 40 + r() * 20, 40 + r() * 30, r, '#3f7a3a'), fx, 60); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };

  builders.reef = function (r) {
    const L = [];
    let l = layer(400), x = l.ctx;
    ridge(x, B.TILE, 260, 90, 8, 61, 'rgba(40,110,150,0.55)', true);
    ridge(x, B.TILE, 320, 70, 10, 62, 'rgba(30,95,135,0.7)', true);
    L.push({ canvas: l.c, factor: 0.1, y: 320 });

    l = layer(360); x = l.ctx;
    ridge(x, B.TILE, 260, 60, 10, 71, '#3f8aa0');
    for (let i = 0; i < 28; i++) { const cx = r() * B.TILE; wrap(px => branchCoral(x, px, 250 + r() * 30, 70 + r() * 50, r, U.mix('#5aa0a8', '#7ab8b0', r())), cx, 60); }
    for (let i = 0; i < 18; i++) { const cx = r() * B.TILE; wrap(px => brainCoral(x, px, 265, 40 + r() * 30, r, '#6aa6a0'), cx, 40); }
    L.push({ canvas: l.c, factor: 0.35, y: 330 });

    l = layer(240); x = l.ctx;
    const gg = x.createLinearGradient(0, 0, 0, 240);
    gg.addColorStop(0, '#d9c99a'); gg.addColorStop(1, '#a8966a');
    x.fillStyle = gg; x.fillRect(0, 70, B.TILE, 170);
    ridge(x, B.TILE, 80, 20, 8, 81, '#d9c99a');
    for (let i = 0; i < 500; i++) { x.fillStyle = U.rgba('#ffffff', 0.15 + r() * 0.2); U.ellipse(x, r() * B.TILE, 80 + r() * 160, 1 + r() * 2, 1, 0); x.fill(); }
    const coralCols = ['#e86a5a', '#f2a24a', '#c95ab0', '#7a5ad0', '#e8d24a', '#4ac0a0', '#ff7aa8'];
    for (let i = 0; i < 30; i++) { const cx = r() * B.TILE; wrap(px => branchCoral(x, px, 90 + r() * 20, 80 + r() * 70, r, r.pick(coralCols)), cx, 70); }
    for (let i = 0; i < 20; i++) { const cx = r() * B.TILE; wrap(px => brainCoral(x, px, 100 + r() * 15, 50 + r() * 40, r, r.pick(coralCols)), cx, 50); }
    for (let i = 0; i < 16; i++) { const cx = r() * B.TILE; wrap(px => seaFan(x, px, 95 + r() * 10, 140 + r() * 60, r, r.pick(['#c03a6a', '#e05a3a', '#8a3ac0'])), cx, 70); }
    for (let i = 0; i < 18; i++) { const cx = r() * B.TILE; wrap(px => grassTuft(x, px, 110 + r() * 60, 40 + r() * 30, r, '#3f7a3a', '#8ac06a'), cx, 30); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 90 });
    return L;
  };

  builders.desert = function (r) {
    const L = [];
    let l = layer(300), x = l.ctx;
    ridge(x, B.TILE, 230, 90, 5, 91, '#e9c9a0');
    L.push({ canvas: l.c, factor: 0.05, y: 260 });

    const dune = (ctx, base, amp, period, seed, light, dark) => {
      const nz = U.periodicNoise(seed, period);
      const pts = [];
      for (let px = 0; px <= B.TILE; px += 6) pts.push([px, base - nz((px / B.TILE) * period) * amp]);
      ctx.beginPath(); ctx.moveTo(0, ctx.canvas.height);
      pts.forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.lineTo(B.TILE, ctx.canvas.height); ctx.closePath();
      ctx.fillStyle = light; ctx.fill();
      // shadowed lee slopes: darker where the ridge descends steeply to the right
      ctx.save(); ctx.clip();
      for (let i = 1; i < pts.length; i++) {
        const slope = (pts[i][1] - pts[i - 1][1]) / 6;
        if (slope <= 0) continue;
        const a = Math.min(0.5, slope * 1.4);
        const gsh = ctx.createLinearGradient(0, pts[i][1], 0, pts[i][1] + 140);
        gsh.addColorStop(0, U.rgba(dark, a)); gsh.addColorStop(1, U.rgba(dark, 0));
        ctx.fillStyle = gsh;
        ctx.fillRect(pts[i - 1][0], pts[i][1] - 1, 6, 150);
      }
      // ripples
      ctx.strokeStyle = U.rgba(dark, 0.25); ctx.lineWidth = 1;
      for (let i = 0; i < 160; i++) {
        const rx = r() * B.TILE, ry = base - amp * 0.2 + r() * 120;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + 20, ry - 3, rx + 40, ry); ctx.stroke();
      }
      ctx.restore();
    };
    l = layer(320); x = l.ctx;
    dune(x, 220, 120, 4, 101, '#e6b877', '#b77b3a');
    L.push({ canvas: l.c, factor: 0.15, y: 300 });

    l = layer(320); x = l.ctx;
    dune(x, 200, 110, 3, 111, '#ebb36a', '#a8662a');
    for (let i = 0; i < 3; i++) { const px0 = r() * B.TILE; wrap(px => { datePalm(x, px, 190, 150 + r() * 40, r); datePalm(x, px + 60, 195, 120, r); }, px0, 200); }
    L.push({ canvas: l.c, factor: 0.4, y: 330 });

    l = layer(170); x = l.ctx;
    const gg = x.createLinearGradient(0, 0, 0, 170);
    gg.addColorStop(0, '#e8b46c'); gg.addColorStop(1, '#c48a44');
    x.fillStyle = gg; x.fillRect(0, 24, B.TILE, 150);
    ridge(x, B.TILE, 34, 14, 6, 121, '#e8b46c');
    x.strokeStyle = 'rgba(150,90,40,0.25)';
    for (let i = 0; i < 500; i++) { const rx = r() * B.TILE, ry = 30 + r() * 140; x.beginPath(); x.moveTo(rx, ry); x.quadraticCurveTo(rx + 15, ry - 2, rx + 30, ry); x.stroke(); }
    for (let i = 0; i < 14; i++) { const cx = r() * B.TILE; wrap(px => rock(x, px, 60 + r() * 60, 30 + r() * 40, 14 + r() * 16, r, '#9a6a44'), cx, 60); }
    for (let i = 0; i < 12; i++) { const cx = r() * B.TILE; wrap(px => grassTuft(x, px, 60 + r() * 80, 18 + r() * 10, r, '#8a8a4a', '#c9b878'), cx, 30); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };

  builders.arctic = function (r) {
    const L = [];
    let l = layer(360), x = l.ctx;
    ridge(x, B.TILE, 300, 160, 7, 131, '#9db4cf', true);
    // snow caps
    x.save(); x.globalCompositeOperation = 'source-atop';
    const sg = x.createLinearGradient(0, 120, 0, 300); sg.addColorStop(0, '#f4f8fc'); sg.addColorStop(0.5, 'rgba(240,246,252,0.4)'); sg.addColorStop(1, 'rgba(240,246,252,0)');
    x.fillStyle = sg; x.fillRect(0, 0, B.TILE, 360); x.restore();
    L.push({ canvas: l.c, factor: 0.05, y: 230 });

    l = layer(260); x = l.ctx;
    x.fillStyle = '#5f86a8'; x.fillRect(0, 180, B.TILE, 80); // open water band
    for (let i = 0; i < 9; i++) { const ix = r() * B.TILE; wrap(px => iceBlock(x, px, 190, 120 + r() * 160, 90 + r() * 90, r), ix, 160); }
    L.push({ canvas: l.c, factor: 0.18, y: 380 });

    l = layer(240); x = l.ctx;
    const g2 = x.createLinearGradient(0, 100, 0, 240); g2.addColorStop(0, '#e6f0f8'); g2.addColorStop(1, '#c4d8e8');
    ridge(x, B.TILE, 170, 40, 8, 141, g2);
    for (let i = 0; i < 30; i++) { const ix = r() * B.TILE; wrap(px => iceBlock(x, px, 175 + r() * 20, 40 + r() * 60, 30 + r() * 40, r), ix, 60); }
    L.push({ canvas: l.c, factor: 0.42, y: 430 });

    l = layer(170); x = l.ctx;
    const gg = x.createLinearGradient(0, 0, 0, 170); gg.addColorStop(0, '#f4f8fc'); gg.addColorStop(1, '#b9d0e2');
    x.fillStyle = gg; x.fillRect(0, 22, B.TILE, 150);
    ridge(x, B.TILE, 30, 12, 8, 151, '#f4f8fc');
    x.strokeStyle = 'rgba(120,160,190,0.35)'; x.lineWidth = 1.2;
    for (let i = 0; i < 60; i++) { const cx = r() * B.TILE, cy = 40 + r() * 120; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + 20 + r() * 40, cy + (r() - 0.5) * 10); x.lineTo(cx + 50 + r() * 50, cy + (r() - 0.5) * 16); x.stroke(); }
    for (let i = 0; i < 10; i++) { const cx = r() * B.TILE; wrap(px => rock(x, px, 50 + r() * 40, 30 + r() * 40, 10 + r() * 14, r, '#6b7280'), cx, 50); }
    // snow on rocks
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };

  builders.forest = function (r) {
    const L = [];
    const autumn = ['#c0392b', '#e67e22', '#f1c40f', '#d35400', '#a84a2a', '#e8a33a', '#7a8a2a'];
    let l = layer(360), x = l.ctx;
    ridge(x, B.TILE, 280, 120, 6, 161, '#8a9ab0', true);
    L.push({ canvas: l.c, factor: 0.05, y: 220 });

    l = layer(300), x = l.ctx;
    // lake + far shore of conifers
    x.fillStyle = '#6f8fa8'; x.fillRect(0, 200, B.TILE, 100);
    for (let i = 0; i < 160; i++) { const cx = r() * B.TILE; wrap(px => conifer(x, px, 205, 50 + r() * 50, r, '#3f5a4a'), cx, 30); }
    x.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 80; i++) x.fillRect(r() * B.TILE, 215 + r() * 80, 20 + r() * 50, 1.5);
    L.push({ canvas: l.c, factor: 0.15, y: 330 });

    l = layer(560), x = l.ctx;
    for (let i = 0; i < 22; i++) {
      const cx = r() * B.TILE;
      const kind = r();
      wrap(px => {
        if (kind < 0.4) conifer(x, px, 520, 300 + r() * 180, r, '#2f4a36');
        else if (kind < 0.65) birch(x, px, 520, 260 + r() * 120, r, ['#f1c40f', '#e8b030', '#d8a020']);
        else deciduous(x, px, 520, 260 + r() * 140, r, autumn);
      }, cx, 160);
    }
    L.push({ canvas: l.c, factor: 0.45, y: 100 });

    l = layer(170), x = l.ctx;
    const gg = x.createLinearGradient(0, 0, 0, 170); gg.addColorStop(0, '#6a5a36'); gg.addColorStop(1, '#3f3420');
    x.fillStyle = gg; x.fillRect(0, 24, B.TILE, 150);
    ridge(x, B.TILE, 34, 12, 8, 171, '#6a5a36');
    for (let i = 0; i < 1500; i++) {
      x.fillStyle = r.pick(autumn);
      x.globalAlpha = 0.6 + r() * 0.4;
      U.ellipse(x, r() * B.TILE, 30 + r() * 140, 2.5 + r() * 3, 1.5 + r() * 1.5, r() * 3); x.fill();
    }
    x.globalAlpha = 1;
    for (let i = 0; i < 30; i++) { const fx = r() * B.TILE; wrap(px => fern(x, px, 40 + r() * 30, 30 + r() * 26, r, '#7a8a3a'), fx, 50); }
    for (let i = 0; i < 8; i++) { const cx = r() * B.TILE; wrap(px => rock(x, px, 60 + r() * 50, 40 + r() * 40, 16 + r() * 12, r, '#7a7a74'), cx, 50); }
    L.push({ canvas: l.c, factor: 1.0, y: B.GROUND - 40 });
    return L;
  };

  // Foreground layers (drawn in front of animals)
  const fgBuilders = {
    savanna: (x, r) => { for (let i = 0; i < 140; i++) grassTuft(x, r() * B.TILE, 150, 40 + r() * 50, r, '#9a7a34', '#e6c67a'); },
    rainforest: (x, r) => { for (let i = 0; i < 18; i++) { const px = r() * B.TILE; wrap(p => bigLeaf(x, p, 168, 60 + r() * 50, -Math.PI / 2 + (r() - 0.5) * 2.2, U.mix('#2f6a32', '#4f8f3a', r())), px, 160); } },
    reef: (x, r) => { for (let i = 0; i < 12; i++) { const px = r() * B.TILE; wrap(p => seaFan(x, p, 160, 200 + r() * 100, r, 'rgba(60,20,70,0.8)'), px, 100); } },
    desert: (x, r) => { for (let i = 0; i < 10; i++) { const px = r() * B.TILE; wrap(p => rock(x, p, 160, 120 + r() * 80, 30 + r() * 40, r, '#7a4a2a'), px, 120); } },
    arctic: (x, r) => { for (let i = 0; i < 12; i++) { const px = r() * B.TILE; wrap(p => { x.fillStyle = '#f8fbff'; U.ellipse(x, p, 160, 120 + r() * 120, 30 + r() * 20, 0); x.fill(); }, px, 260); } },
    forest: (x, r) => { for (let i = 0; i < 24; i++) { const px = r() * B.TILE; wrap(p => fern(x, p, 160, 70 + r() * 50, r, '#5a6a2a'), px, 80); } },
  };

  const layerCache = {};
  B.layers = function (habId) {
    if (layerCache[habId]) return layerCache[habId];
    const r = U.rng('scene-' + habId);
    const L = builders[habId](r);
    const fg = layer(170);
    fgBuilders[habId](fg.ctx, U.rng('fg-' + habId));
    const res = { back: L, front: { canvas: fg.c, factor: 1.35, y: B.SCENE_H - 165 } };
    layerCache[habId] = res;
    return res;
  };

  // ===================================================================
  // Sky & dynamic atmosphere (drawn every frame)
  // ===================================================================
  B.SKIES = {
    savanna: ['#f6c27a', '#f3d9a2', '#d8e2e6'],
    rainforest: ['#9cc8b0', '#c7e0c8', '#e2efd8'],
    reef: ['#0e4a6e', '#1d7aa0', '#3fb0c8'],
    desert: ['#7fb5e0', '#cfe4ef', '#f6e2bd'],
    arctic: ['#1c2a4a', '#4a6a9a', '#c9d8ea'],
    forest: ['#6a9ac8', '#b8d2e6', '#f0d8b8'],
  };

  B.drawSky = function (ctx, habId, w, h, t, camX) {
    const s = B.SKIES[habId];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (habId === 'reef') {
      g.addColorStop(0, s[2]); g.addColorStop(0.5, s[1]); g.addColorStop(1, s[0]);
    } else {
      g.addColorStop(0, s[0]); g.addColorStop(0.6, s[1]); g.addColorStop(1, s[2]);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const k = h / B.SCENE_H;
    if (habId === 'savanna' || habId === 'desert') {
      const sx = w * 0.72 - camX * 0.01, sy = h * (habId === 'savanna' ? 0.33 : 0.16);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 160 * k);
      sg.addColorStop(0, 'rgba(255,250,225,1)'); sg.addColorStop(0.15, 'rgba(255,236,170,0.9)'); sg.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = sg; ctx.fillRect(sx - 160 * k, sy - 160 * k, 320 * k, 320 * k);
    }
    if (habId === 'arctic') {
      // Aurora borealis: curtains of light made of many vertical rays
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 2; b++) {
        const yb = h * (0.26 + b * 0.09);
        const c = b === 1 ? '150,90,230' : '70,255,170';
        for (let x = 0; x <= w; x += 5) {
          const y = yb + Math.sin(x * 0.005 + t * 0.35 + b * 2 - camX * 0.0004) * 40 * k + Math.sin(x * 0.019 + t * 0.8) * 10 * k;
          const len = (90 + 60 * Math.sin(x * 0.011 + t * 0.6 + b)) * k;
          const a = (0.10 + 0.08 * Math.sin(x * 0.03 + t * 1.3 + b * 3)) * (b ? 0.6 : 1);
          const ag = ctx.createLinearGradient(0, y - len, 0, y + 8 * k);
          ag.addColorStop(0, `rgba(${c},0)`); ag.addColorStop(0.8, `rgba(${c},${a})`); ag.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = ag;
          ctx.fillRect(x, y - len, 5, len + 8 * k);
        }
      }
      ctx.restore();
      // stars
      const r = U.rng(5);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 90; i++) { ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.7 + i)); ctx.fillRect(r() * w, r() * h * 0.4, 1.5, 1.5); }
      ctx.globalAlpha = 1;
    }
    if (habId !== 'reef' && habId !== 'rainforest' && habId !== 'arctic') {
      // Drifting clouds
      const r = U.rng(habId + 'cl');
      for (let i = 0; i < 6; i++) {
        const cx = ((r() * w * 2 - camX * 0.02 + t * 6 * (0.5 + r())) % (w + 400)) - 200;
        const cy = h * (0.08 + r() * 0.2);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let j = 0; j < 5; j++) { U.ellipse(ctx, cx + j * 30 * k, cy + Math.sin(j) * 8 * k, 50 * k, 18 * k, 0); ctx.fill(); }
      }
    }
  };

  // Light shafts, caustics, snow, heat shimmer — drawn over the scene.
  B.drawAtmosphere = function (ctx, habId, w, h, t, camX) {
    const k = h / B.SCENE_H;
    if (habId === 'reef' || habId === 'rainforest') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const x0 = ((i * 330 - camX * 0.2) % (w + 600) + w + 600) % (w + 600) - 300;
        const sway = Math.sin(t * 0.3 + i) * 40 * k;
        const g = ctx.createLinearGradient(x0, 0, x0 + 200 * k, h);
        const a = habId === 'reef' ? 0.09 : 0.07;
        g.addColorStop(0, `rgba(255,255,230,${a + 0.03 * Math.sin(t + i)})`); g.addColorStop(1, 'rgba(255,255,230,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x0 + sway, 0); ctx.lineTo(x0 + 70 * k + sway, 0); ctx.lineTo(x0 + 320 * k, h); ctx.lineTo(x0 + 140 * k, h);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    if (habId === 'reef') {
      // floating particles & bubbles
      const r = U.rng(77);
      for (let i = 0; i < 60; i++) {
        const px = ((r() * w * 1.5 - camX * 0.6) % w + w) % w;
        const py = (r() * h - t * (10 + r() * 20)) % h;
        ctx.fillStyle = 'rgba(220,245,255,0.35)';
        U.ellipse(ctx, px, (py + h) % h, 1 + r() * 2.5, 1 + r() * 2.5, 0); ctx.fill();
      }
      // depth tint
      ctx.fillStyle = 'rgba(10,60,110,0.12)'; ctx.fillRect(0, 0, w, h);
    }
    if (habId === 'arctic') {
      const r = U.rng(88);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 120; i++) {
        const sp = 20 + r() * 40;
        const px = ((r() * w * 2 + Math.sin(t + i) * 20 - camX * 0.8 - t * 15) % w + w) % w;
        const py = ((r() * h + t * sp) % h);
        U.ellipse(ctx, px, py, 1 + r() * 1.8, 1 + r() * 1.8, 0); ctx.fill();
      }
    }
    if (habId === 'rainforest') {
      ctx.fillStyle = 'rgba(200,230,210,0.08)';
      ctx.fillRect(0, h * 0.55, w, h * 0.45);
    }
    if (habId === 'forest') {
      // falling autumn leaves
      const r = U.rng(99);
      const cols = ['#e67e22', '#c0392b', '#f1c40f'];
      for (let i = 0; i < 18; i++) {
        const px = ((r() * w * 2 - camX * 0.9 + Math.sin(t * 0.8 + i) * 40) % w + w) % w;
        const py = (r() * h + t * (25 + r() * 20)) % h;
        ctx.save(); ctx.translate(px, py); ctx.rotate(t * 2 + i);
        ctx.fillStyle = cols[i % 3]; U.ellipse(ctx, 0, 0, 5 * k, 2.5 * k, 0); ctx.fill(); ctx.restore();
      }
    }
  };

  // Draw parallax back layers.
  B.drawLayers = function (ctx, layers, camX, scale, screenW) {
    for (const L of layers) {
      const tileW = B.TILE * scale;
      let off = -((camX * L.factor * scale) % tileW);
      if (off > 0) off -= tileW;
      const y = L.y * scale, h = L.canvas.height * scale;
      for (let x = off; x < screenW; x += tileW) ctx.drawImage(L.canvas, x, y, tileW, h);
    }
  };

  // ===================================================================
  // TOP-DOWN arena ground for minigames
  // ===================================================================
  const ARENA_STYLE = {
    savanna: { base: ['#c4a057', '#b08c45'], cover: '#9a7a2e', coverName: 'tall grass', decor: 'acacia' },
    rainforest: { base: ['#3d4a26', '#2f3a1c'], cover: '#2f6a32', coverName: 'ferns', decor: 'trunks' },
    reef: { base: ['#cfd3b0', '#9fbfb4'], cover: '#e06a8a', coverName: 'coral', decor: 'coral', water: true },
    desert: { base: ['#e6b46e', '#d39a52'], cover: '#9a6a44', coverName: 'rocks', decor: 'rocks' },
    arctic: { base: ['#eef4fa', '#d6e4f0'], cover: '#ffffff', coverName: 'snow drifts', decor: 'ice' },
    forest: { base: ['#5a4a2c', '#4a3c22'], cover: '#5a7a2a', coverName: 'ferns', decor: 'trees' },
    arcticwater: { base: ['#2a5a80', '#1d4a6c'], cover: '#e8f2fa', coverName: 'ice floes', decor: 'floes', water: true },
    lake: { base: ['#3f6f8a', '#2f5a74'], cover: '#6a8a3a', coverName: 'lily pads', decor: 'shore', water: true },
  };
  B.ARENA_STYLE = ARENA_STYLE;

  // Returns { canvas, covers:[{x,y,r}], style }
  B.buildArena = function (styleId, W, H, seed) {
    const st = ARENA_STYLE[styleId];
    const r = U.rng(seed || styleId + 'arena');
    const c = U.canvas(W, H);
    const x = c.getContext('2d');
    const g = x.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, st.base[0]); g.addColorStop(1, st.base[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // mottled noise
    for (let i = 0; i < W * H / 900; i++) {
      x.fillStyle = U.rgba(r() < 0.5 ? U.shade(st.base[0], 0.12) : U.shade(st.base[1], -0.12), 0.25);
      U.ellipse(x, r() * W, r() * H, 10 + r() * 40, 6 + r() * 25, r() * 3); x.fill();
    }
    // texture details
    if (styleId === 'savanna') {
      for (let i = 0; i < W * H / 300; i++) { x.strokeStyle = U.rgba(r() < 0.5 ? '#e2c27a' : '#8a6a2a', 0.5); x.lineWidth = 1; const px = r() * W, py = r() * H; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 6, py - 4 - r() * 4); x.stroke(); }
    } else if (styleId === 'rainforest' || styleId === 'forest') {
      const cols = styleId === 'forest' ? ['#c0392b', '#e67e22', '#f1c40f', '#8a5a2a'] : ['#6a4a24', '#8a6a34', '#4a5a2a'];
      for (let i = 0; i < W * H / 120; i++) { x.fillStyle = U.rgba(r.pick(cols), 0.6); U.ellipse(x, r() * W, r() * H, 3 + r() * 3, 1.5 + r() * 2, r() * 3); x.fill(); }
    } else if (styleId === 'desert') {
      x.strokeStyle = 'rgba(150,90,40,0.25)';
      for (let yy = 0; yy < H; yy += 14) { x.beginPath(); for (let xx = 0; xx <= W; xx += 20) x.lineTo(xx, yy + Math.sin(xx * 0.02 + yy * 0.1) * 5); x.stroke(); }
    } else if (styleId === 'arctic') {
      x.strokeStyle = 'rgba(140,180,210,0.35)';
      for (let i = 0; i < 200; i++) { const px = r() * W, py = r() * H; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 30, py + 5, px + 60 + r() * 40, py - 4); x.stroke(); }
    } else if (styleId === 'reef') {
      for (let i = 0; i < W * H / 400; i++) { x.fillStyle = 'rgba(255,255,255,0.25)'; U.ellipse(x, r() * W, r() * H, 1 + r() * 2, 1 + r(), 0); x.fill(); }
    } else if (styleId === 'arcticwater' || styleId === 'lake') {
      x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 2;
      for (let i = 0; i < 300; i++) { const px = r() * W, py = r() * H; x.beginPath(); x.arc(px, py, 10 + r() * 30, 0.2, 1.2); x.stroke(); }
    }
    // Cover zones (hiding spots)
    const covers = [];
    const nCov = Math.floor(W * H / 160000);
    for (let i = 0; i < nCov; i++) {
      const cx = 100 + r() * (W - 200), cy = 100 + r() * (H - 200), rad = 60 + r() * 50;
      covers.push({ x: cx, y: cy, r: rad });
    }
    // Decorations (non-blocking), drawn beneath cover
    const decor = [];
    const nDec = Math.floor(W * H / 90000);
    for (let i = 0; i < nDec; i++) decor.push({ x: r() * W, y: r() * H, s: 0.7 + r() * 0.8, k: r() });
    for (const d of decor) drawDecorTop(x, styleId, d, r);
    // Cover lives on its own layer so it can also be drawn over hidden animals.
    const cc = U.canvas(W, H);
    const cx2 = cc.getContext('2d');
    for (const cv of covers) drawCoverTop(cx2, styleId, st, cv, r);
    return { canvas: c, coverCanvas: cc, covers, style: st, styleId };
  };

  function drawDecorTop(x, styleId, d, r) {
    const s = d.s;
    x.save();
    x.translate(d.x, d.y);
    if (styleId === 'savanna') {
      if (d.k < 0.35) {
        // acacia from above: shadow + canopy disc
        x.fillStyle = 'rgba(0,0,0,0.2)'; U.ellipse(x, 30 * s, 22 * s, 70 * s, 45 * s, 0); x.fill();
        for (let i = 0; i < 16; i++) { x.fillStyle = U.mix('#4f6a26', '#7a9a3a', r()); U.ellipse(x, (r() - 0.5) * 90 * s, (r() - 0.5) * 60 * s, 22 * s, 16 * s, 0); x.fill(); }
      } else if (d.k < 0.6) { x.fillStyle = '#8a7a66'; U.ellipse(x, 0, 0, 20 * s, 14 * s, 0.3); x.fill(); x.fillStyle = 'rgba(255,255,255,0.2)'; U.ellipse(x, -5 * s, -4 * s, 10 * s, 6 * s, 0.3); x.fill(); }
      else { x.fillStyle = '#9a5a2a'; U.ellipse(x, 0, 0, 18 * s, 14 * s, 0); x.fill(); x.fillStyle = '#b8743a'; U.ellipse(x, -3, -3, 9 * s, 7 * s, 0); x.fill(); }
    } else if (styleId === 'rainforest' || styleId === 'forest') {
      if (d.k < 0.4) {
        x.fillStyle = 'rgba(0,0,0,0.25)'; U.ellipse(x, 14 * s, 10 * s, 36 * s, 30 * s, 0); x.fill();
        x.fillStyle = styleId === 'forest' ? '#5a4632' : '#4a3a28';
        for (let i = 0; i < 5; i++) { x.save(); x.rotate(i * 1.25); x.fillRect(0, -4 * s, 34 * s, 8 * s); x.restore(); }
        x.fillStyle = styleId === 'forest' ? '#6a5440' : '#5c4a36'; U.ellipse(x, 0, 0, 20 * s, 20 * s, 0); x.fill();
        x.strokeStyle = 'rgba(0,0,0,0.3)'; for (let k = 6; k < 20; k += 4) { x.beginPath(); x.arc(0, 0, k * s, 0, U.TAU); x.stroke(); }
      } else if (d.k < 0.6) {
        x.fillStyle = '#6a6a64'; U.ellipse(x, 0, 0, 18 * s, 13 * s, 0.4); x.fill();
        x.fillStyle = 'rgba(80,140,60,0.6)'; U.ellipse(x, -4, -4, 10 * s, 6 * s, 0.4); x.fill();
      } else {
        x.fillStyle = 'rgba(80,120,150,0.5)'; U.ellipse(x, 0, 0, 40 * s, 22 * s, d.k * 3); x.fill();
      }
    } else if (styleId === 'reef') {
      const cols = ['#e86a5a', '#f2a24a', '#c95ab0', '#7a5ad0', '#e8d24a', '#4ac0a0'];
      if (d.k < 0.5) { brainTop(x, s, r.pick(cols), r); }
      else { x.fillStyle = 'rgba(60,120,60,0.6)'; for (let i = 0; i < 18; i++) { x.save(); x.rotate(r() * U.TAU); x.fillRect(0, -1, 14 * s + r() * 10, 2); x.restore(); } }
    } else if (styleId === 'desert') {
      if (d.k < 0.5) { x.fillStyle = 'rgba(0,0,0,0.15)'; U.ellipse(x, 8 * s, 6 * s, 26 * s, 16 * s, 0); x.fill(); x.fillStyle = '#9a6a44'; U.ellipse(x, 0, 0, 24 * s, 16 * s, d.k * 4); x.fill(); x.fillStyle = 'rgba(255,230,190,0.3)'; U.ellipse(x, -6, -5, 10 * s, 6 * s, 0); x.fill(); }
      else { x.strokeStyle = '#8a7a4a'; x.lineWidth = 1.5; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(0, 0); const a = r() * U.TAU; x.lineTo(Math.cos(a) * 16 * s, Math.sin(a) * 16 * s); x.stroke(); } }
    } else if (styleId === 'arctic') {
      if (d.k < 0.4) { x.fillStyle = '#6b7280'; U.ellipse(x, 0, 0, 20 * s, 14 * s, 0.3); x.fill(); x.fillStyle = '#ffffff'; U.ellipse(x, -3, -5, 16 * s, 8 * s, 0.3); x.fill(); }
      else { x.fillStyle = 'rgba(160,200,230,0.5)'; U.ellipse(x, 0, 0, 45 * s, 25 * s, d.k * 3); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.moveTo(-30 * s, -5); x.lineTo(20 * s, 6); x.stroke(); }
    } else if (styleId === 'arcticwater') {
      x.fillStyle = 'rgba(255,255,255,0.08)'; U.ellipse(x, 0, 0, 30 * s, 12 * s, 0); x.fill();
    } else if (styleId === 'lake') {
      x.fillStyle = '#4f7a3a'; U.ellipse(x, 0, 0, 14 * s, 12 * s, 0); x.fill();
      x.strokeStyle = '#3a5a2a'; x.beginPath(); x.moveTo(0, 0); x.lineTo(14 * s, 0); x.stroke();
    }
    x.restore();
  }

  function brainTop(x, s, col, r) {
    const g = x.createRadialGradient(-5, -5, 2, 0, 0, 30 * s);
    g.addColorStop(0, U.shade(col, 0.3)); g.addColorStop(1, U.shade(col, -0.3));
    x.fillStyle = g; U.ellipse(x, 0, 0, 28 * s, 24 * s, 0); x.fill();
    x.strokeStyle = U.rgba(U.shade(col, -0.5), 0.6); x.lineWidth = 1.2;
    for (let k = 5; k < 26; k += 5) { x.beginPath(); for (let a = 0; a <= U.TAU + 0.1; a += 0.3) { const rr = k * s + Math.sin(a * 5 + k) * 2; a ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.86) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.86); } x.stroke(); }
  }

  function drawCoverTop(x, styleId, st, cv, r) {
    x.save();
    x.translate(cv.x, cv.y);
    x.fillStyle = 'rgba(0,0,0,0.15)'; U.ellipse(x, 6, 8, cv.r, cv.r * 0.8, 0); x.fill();
    if (styleId === 'savanna') {
      for (let i = 0; i < 260; i++) {
        const a = r() * U.TAU, d = Math.sqrt(r()) * cv.r;
        const px = Math.cos(a) * d, py = Math.sin(a) * d * 0.8;
        x.strokeStyle = U.mix('#8a6a24', '#e6c67a', r()); x.lineWidth = 2;
        x.beginPath(); x.moveTo(px, py + 6); x.lineTo(px + (r() - 0.5) * 8, py - 10 - r() * 8); x.stroke();
      }
    } else if (styleId === 'rainforest' || styleId === 'forest' || styleId === 'lake') {
      const col = styleId === 'forest' ? '#6a8a2a' : styleId === 'lake' ? '#5a8a3a' : '#2f7a36';
      for (let i = 0; i < 14; i++) {
        const a = r() * U.TAU, d = Math.sqrt(r()) * cv.r * 0.7;
        x.save(); x.translate(Math.cos(a) * d, Math.sin(a) * d * 0.8);
        for (let k = 0; k < 6; k++) {
          x.rotate(U.TAU / 6 + r() * 0.2);
          x.fillStyle = U.shade(col, (r() - 0.5) * 0.25);
          U.ellipse(x, cv.r * 0.25, 0, cv.r * 0.25, cv.r * 0.07, 0); x.fill();
        }
        x.restore();
      }
    } else if (styleId === 'reef') {
      const cols = ['#e86a5a', '#f2a24a', '#c95ab0', '#7a5ad0', '#4ac0a0', '#ff7aa8'];
      for (let i = 0; i < 9; i++) {
        const a = r() * U.TAU, d = Math.sqrt(r()) * cv.r * 0.75;
        x.save(); x.translate(Math.cos(a) * d, Math.sin(a) * d * 0.8);
        if (i % 2) brainTop(x, 0.6 + r() * 0.5, r.pick(cols), r);
        else {
          const col = r.pick(cols);
          x.strokeStyle = col; x.lineCap = 'round';
          for (let k = 0; k < 7; k++) { const aa = r() * U.TAU; x.lineWidth = 5; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(aa) * 24, Math.sin(aa) * 24); x.stroke(); x.fillStyle = U.shade(col, 0.3); U.ellipse(x, Math.cos(aa) * 24, Math.sin(aa) * 24, 3.5, 3.5, 0); x.fill(); }
        }
        x.restore();
      }
    } else if (styleId === 'desert') {
      for (let i = 0; i < 5; i++) {
        const a = r() * U.TAU, d = Math.sqrt(r()) * cv.r * 0.6;
        const rx = 22 + r() * 26;
        x.fillStyle = U.mix('#7a4a2a', '#b07a4a', r());
        U.ellipse(x, Math.cos(a) * d, Math.sin(a) * d, rx, rx * 0.75, r() * 3); x.fill();
        x.fillStyle = 'rgba(255,220,170,0.25)'; U.ellipse(x, Math.cos(a) * d - 6, Math.sin(a) * d - 6, rx * 0.5, rx * 0.3, 0); x.fill();
      }
    } else if (styleId === 'arctic') {
      const g = x.createRadialGradient(-cv.r * 0.3, -cv.r * 0.3, 5, 0, 0, cv.r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfe0ee');
      x.fillStyle = g; U.ellipse(x, 0, 0, cv.r, cv.r * 0.75, 0.2); x.fill();
      x.strokeStyle = 'rgba(150,190,220,0.5)'; x.beginPath(); x.arc(0, 0, cv.r * 0.6, 0.3, 2); x.stroke();
    } else if (styleId === 'arcticwater') {
      x.fillStyle = '#f2f8fc';
      x.beginPath();
      const pts = [];
      for (let i = 0; i < 9; i++) { const a = i / 9 * U.TAU; pts.push([Math.cos(a) * cv.r * (0.8 + r() * 0.3), Math.sin(a) * cv.r * 0.7 * (0.8 + r() * 0.3)]); }
      U.smoothPath(x, pts, true, 0.4); x.fill();
      x.strokeStyle = '#a8cce4'; x.lineWidth = 3; x.stroke();
    }
    x.restore();
  }

  B.prims = { acacia, conifer, deciduous, birch, fern, rock, grassTuft, anemone, brainCoral, branchCoral, datePalm, iceBlock, bigLeaf };
  WE.BG = B;
})(window.WE);
