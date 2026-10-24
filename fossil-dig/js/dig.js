// The excavation: a quarry grid of rock, dirt and dust over buried bones.
// Rock pick breaks hard rock, trowel scrapes dirt, brush sweeps dust. Exposed bones
// are wrapped in plaster jackets and carried to the lab.
window.FD = window.FD || {};
(function (FD, WE) {
  const U = WE.U;
  const W = 960, H = 600, CELL = 6, GW = W / CELL, GH = H / CELL;
  const CLEAR = 0.12;
  const TOOLS = {
    pick:   { name: 'Rock pick', every: 0.2, radius: 20 },
    trowel: { name: 'Trowel', every: 0.05, radius: 16 },
    brush:  { name: 'Brush', every: 0.04, radius: 22 },
  };

  // Smooth value noise in [0,1].
  function vnoise(seed, scale) {
    const r = U.rng(seed);
    const nx = Math.ceil(W / scale) + 2, ny = Math.ceil(H / scale) + 2;
    const g = new Float32Array(nx * ny).map(() => r());
    const sm = t => t * t * (3 - 2 * t);
    return (x, y) => {
      const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = sm(fx - ix), ty = sm(fy - iy);
      const v = (i, j) => g[(iy + j) * nx + ix + i];
      return U.lerp(U.lerp(v(0, 0), v(1, 0), tx), U.lerp(v(0, 1), v(1, 1), tx), ty);
    };
  }

  // ---------------- textures ----------------
  function matrixTexture(style, seed, rockId) {
    const c = U.canvas(W, H), x = c.getContext('2d'), r = U.rng(seed);
    x.fillStyle = style.matrix; x.fillRect(0, 0, W, H);
    const n = vnoise(seed + 1, 60);
    // Sedimentary bedding: wavy horizontal layers
    for (let y = 0; y < H; y += 4 + r() * 10) {
      x.fillStyle = r() < 0.5 ? U.rgba('#000000', 0.03 + r() * 0.05) : U.rgba('#ffffff', 0.03 + r() * 0.05);
      x.beginPath(); x.moveTo(0, y);
      for (let px = 0; px <= W; px += 40) x.lineTo(px, y + (n(px, y) - 0.5) * 18);
      const th = 2 + r() * 8;
      for (let px = W; px >= 0; px -= 40) x.lineTo(px, y + th + (n(px, y + th) - 0.5) * 18);
      x.fill();
    }
    const specks = rockId === 'chalk' ? '#ffffff' : rockId === 'gobi' ? '#f0c090' : U.shade(style.matrix, 0.3);
    for (let i = 0; i < 9000; i++) {
      x.fillStyle = r() < 0.55 ? U.rgba('#000000', 0.12) : U.rgba(specks, 0.25);
      x.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r());
    }
    return c;
  }
  function rockTexture(style, seed) {
    const c = U.canvas(W, H), x = c.getContext('2d'), r = U.rng(seed);
    x.fillStyle = style.rock; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const cx = r() * W, cy = r() * H, rad = 14 + r() * 40, k = 5 + Math.floor(r() * 3);
      const pts = [];
      for (let j = 0; j < k; j++) { const a = (j / k) * U.TAU + r() * 0.5; pts.push([cx + Math.cos(a) * rad * (0.6 + r() * 0.4), cy + Math.sin(a) * rad * (0.6 + r() * 0.4)]); }
      x.fillStyle = U.shade(style.rock, (r() - 0.5) * 0.24);
      x.beginPath(); pts.forEach((p, j) => (j ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fill();
      x.strokeStyle = U.rgba('#ffffff', 0.12); x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(pts[k - 1][0], pts[k - 1][1]); x.lineTo(pts[0][0], pts[0][1]); x.lineTo(pts[1][0], pts[1][1]); x.stroke();
      x.strokeStyle = U.rgba('#000000', 0.18);
      x.beginPath(); x.moveTo(pts[2][0], pts[2][1]); x.lineTo(pts[3][0], pts[3][1]); x.stroke();
    }
    x.strokeStyle = U.rgba('#000000', 0.25); x.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      let px = r() * W, py = r() * H; x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 6; j++) { px += (r() - 0.5) * 40; py += (r() - 0.5) * 40; x.lineTo(px, py); }
      x.stroke();
    }
    for (let i = 0; i < 6000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)'; x.fillRect(r() * W, r() * H, 1.5, 1.5); }
    return c;
  }
  function dirtTexture(style, seed, chips) {
    const c = U.canvas(W, H), x = c.getContext('2d'), r = U.rng(seed);
    x.fillStyle = style.dirt; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 7000; i++) {
      x.fillStyle = U.shade(style.dirt, (r() - 0.5) * 0.35);
      U.ellipse(x, r() * W, r() * H, 1 + r() * 3.5, 1 + r() * 2.5, r() * 3); x.fill();
    }
    for (let i = 0; i < 160; i++) {
      const px = r() * W, py = r() * H, s = 2.5 + r() * 5;
      x.fillStyle = U.shade(style.rock, (r() - 0.5) * 0.3); U.ellipse(x, px, py, s, s * 0.75, r() * 3); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.25)'; U.ellipse(x, px - s * 0.3, py - s * 0.3, s * 0.35, s * 0.25, 0); x.fill();
    }
    // Weathered-out bone chips: a clue that a skeleton lies below.
    for (const ch of chips) {
      for (let i = 0; i < 7; i++) {
        const px = ch[0] + (r() - 0.5) * 70, py = ch[1] + (r() - 0.5) * 50, s = 2.5 + r() * 4;
        x.fillStyle = style.bone; x.beginPath();
        x.moveTo(px - s, py); x.lineTo(px - s * 0.2, py - s * 0.8); x.lineTo(px + s, py - s * 0.2); x.lineTo(px + s * 0.4, py + s * 0.7); x.closePath(); x.fill();
        x.strokeStyle = U.rgba(style.edge, 0.7); x.lineWidth = 0.8; x.stroke();
      }
    }
    return c;
  }
  function dustTexture(style, seed) {
    const c = U.canvas(W, H), x = c.getContext('2d'), r = U.rng(seed);
    x.fillStyle = style.dust; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 12000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.14)'; x.fillRect(r() * W, r() * H, 1, 1); }
    return c;
  }

  // ---------------- piece placement ----------------
  // Cells a piece covers at a given position/rotation.
  function pieceCells(p, cx, cy, rot, sc) {
    const m = U.canvas(GW, GH), x = m.getContext('2d');
    x.translate(cx / CELL, cy / CELL); x.rotate(rot); x.scale(sc / CELL, sc / CELL);
    x.drawImage(p.canvas, -p.w / 2, -p.h / 2);
    const d = x.getImageData(0, 0, GW, GH).data, out = [];
    for (let i = 0; i < GW * GH; i++) if (d[i * 4 + 3] > 70) out.push(i);
    return out;
  }
  function rotatedBox(w, h, rot) {
    const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot));
    return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
  }

  FD.Dig = {};
  FD.Dig.W = W; FD.Dig.H = H; FD.Dig.TOOLS = TOOLS;

  FD.Dig.create = function (dig, opts) {
    opts = opts || {};
    const creature = FD.creature(dig.id);
    const style = FD.rockFor(dig);
    const seed = U.hash(dig.id + ':' + (opts.attempt || 0));
    const r = U.rng(seed);
    const built = FD.Skel.build(creature);
    const bounds = FD.Skel.bounds(built);
    const bw = bounds.x1 - bounds.x0, bh = bounds.y1 - bounds.y0;
    const kDig = Math.min(740 / bw, 410 / bh, 4);
    const kLab = Math.min(860 / bw, 380 / bh, 4.5);
    const kr = Math.max(kDig, kLab);
    const rend = FD.Skel.render(creature, built, kr, style);
    const sc = kDig / kr;
    const ox = (W - bw * kDig) / 2, oy = (H - bh * kDig) / 2 - 10;

    const st = {
      dig, creature, style, built, bounds, kDig, kLab, kr, sc, rend,
      tool: 'trowel', pointer: { x: W / 2, y: H / 2, down: false, inside: false }, toolTimer: 0,
      particles: [], t: 0, msgs: {}, dirty: true, fossilDirty: true, strikes: 0, cracks: 0,
      onEvent: opts.onEvent || (() => {}),
    };

    // Place pieces near their articulated spots, jittered and partly scattered,
    // trying to keep them from piling on top of each other.
    const occ = new Uint8Array(GW * GH);
    const order = rend.pieces.map((p, i) => i).sort((a, b) => rend.pieces[b].w * rend.pieces[b].h - rend.pieces[a].w * rend.pieces[a].h);
    st.pieces = rend.pieces.map(p => {
      const canvas = U.canvas(p.w, p.h); canvas.getContext('2d').drawImage(p.canvas, 0, 0);
      return Object.assign({}, p, { canvas, state: 'buried', damage: 0, exposed: 0 });
    });
    for (const i of order) {
      const p = st.pieces[i];
      const hx = ox + p.ax * sc, hy = oy + p.ay * sc;
      let best = null;
      const small = p.w * p.h * sc * sc < 9000;
      for (let k = 0; k < 22; k++) {
        const far = r() < 0.22;
        const spread = far ? 140 : 46;
        const rot = (r() - 0.5) * (small ? 1.6 : 0.6);
        const bb = rotatedBox(p.w * sc, p.h * sc, rot);
        const cx = U.clamp(hx + (r() - 0.5) * 2 * spread, bb.hw + 24, W - bb.hw - 24);
        const cy = U.clamp(hy + (r() - 0.5) * 2 * spread * 0.7, bb.hh + 24, H - bb.hh - 30);
        const cells = pieceCells(p, cx, cy, rot, sc);
        let ov = 0; for (const c of cells) ov += occ[c];
        const score = ov / Math.max(1, cells.length) + (k === 0 ? 0 : 0.02);
        if (!best || score < best.score) best = { score, cx, cy, rot, cells };
        if (score < 0.03) break;
      }
      p.x = best.cx; p.y = best.cy; p.rot = best.rot; p.cells = best.cells;
      for (const c of p.cells) occ[c] = 1;
    }
    // Which piece is on top in each cell (for damage)
    st.boneAt = new Int16Array(GW * GH).fill(-1);
    st.pieces.forEach((p, i) => { for (const c of p.cells) st.boneAt[c] = i; });

    // Bonus finds in empty ground
    st.bonus = [];
    for (const id of dig.bonus || []) {
      const b = FD.Skel.renderBonus(id, 1, style);
      for (let k = 0; k < 40; k++) {
        const cx = 60 + r() * (W - 120), cy = 60 + r() * (H - 120), rot = r() * U.TAU;
        const fake = { canvas: b.canvas, w: b.w, h: b.h };
        const cells = pieceCells(fake, cx, cy, rot, 1);
        if (cells.every(c => !occ[c]) && cells.length) { for (const c of cells) occ[c] = 2; st.bonus.push({ id, canvas: b.canvas, w: b.w, h: b.h, x: cx, y: cy, rot, cells, state: 'buried', exposed: 0 }); break; }
      }
    }

    // Cover layers
    const N = GW * GH;
    st.rock = new Float32Array(N); st.dirt = new Float32Array(N); st.dust = new Float32Array(N); st.jit = new Float32Array(N);
    const nr = vnoise(seed + 7, 130), nr2 = vnoise(seed + 8, 45), nd = vnoise(seed + 9, 80), nj = vnoise(seed + 10, 14);
    const rockAmt = dig.tutorial ? 0.35 : 0.55 + Math.min(0.25, FD.DIGS.indexOf(dig) * 0.02);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const i = gy * GW + gx, px = gx * CELL, py = gy * CELL;
      const n = nr(px, py) * 0.75 + nr2(px, py) * 0.25;
      st.rock[i] = U.clamp((n - (1 - rockAmt)) * 4, 0, 1.4);
      st.dirt[i] = 0.75 + nd(px, py) * 0.5;
      st.dust[i] = 1;
      st.jit[i] = nj(px, py) - 0.5;
    }
    // A few bones have weathered partly out: a clue where to start.
    const chips = [];
    const clueN = dig.tutorial ? 1 : 2;
    const sorted = st.pieces.slice().sort((a, b) => b.cells.length - a.cells.length);
    for (let k = 0; k < clueN && k < sorted.length; k++) {
      const p = sorted[k * 2] || sorted[k];
      const c = p.cells[Math.floor(r() * p.cells.length)];
      const cx = c % GW, cy = Math.floor(c / GW);
      chips.push([cx * CELL, cy * CELL]);
      for (let dy = -3; dy <= 3; dy++) for (let dx = -4; dx <= 4; dx++) {
        const gx = cx + dx, gy = cy + dy; if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) continue;
        const d = Math.hypot(dx / 4, dy / 3); if (d > 1) continue;
        const i = gy * GW + gx; st.rock[i] = 0; st.dirt[i] = Math.min(st.dirt[i], 0.15 + d * 0.5); st.dust[i] = Math.min(st.dust[i], 0.5 + d * 0.5);
      }
    }
    st.chips = chips;
    st.tex = {
      matrix: matrixTexture(style, seed + 1, dig.rock), rock: rockTexture(style, seed + 2),
      dirt: dirtTexture(style, seed + 3, chips), dust: dustTexture(style, seed + 4),
    };
    st.masks = { rock: U.canvas(GW, GH), dirt: U.canvas(GW, GH), dust: U.canvas(GW, GH) };
    st.shadowMasks = { rock: U.canvas(GW, GH), dirt: U.canvas(GW, GH), dust: U.canvas(GW, GH) };
    st.dl = { rock: true, dirt: true, dust: true };
    st.layers = { rock: U.canvas(W, H), dirt: U.canvas(W, H), dust: U.canvas(W, H) };
    st.fossil = U.canvas(W, H);
    st.comp = U.canvas(W, H);
    st.imprints = [];

    // Scale bar: metres per pixel from the creature's length.
    const metres = FD.lengthMetres(creature) || (dig.id === 'ammonite' ? 0.5 : null);
    const across = creature.art.kind === 'ptero' ? bh : bw;
    st.pxPerM = metres ? (across * kDig) / metres : null;
    return st;
  };

  // ---------------- drawing ----------------
  function rebuildFossil(st) {
    const x = st.fossil.getContext('2d');
    x.drawImage(st.tex.matrix, 0, 0);
    for (const im of st.imprints) {
      x.save(); x.translate(im.x, im.y); x.rotate(im.rot); x.scale(im.sc, im.sc);
      x.globalAlpha = 0.5; x.drawImage(im.sil, -im.w / 2, -im.h / 2); x.restore();
    }
    for (const b of st.bonus) if (b.state !== 'collected') {
      x.save(); x.translate(b.x, b.y); x.rotate(b.rot); x.drawImage(b.canvas, -b.w / 2, -b.h / 2); x.restore();
    }
    for (const p of st.pieces) if (p.state !== 'jacketed' && p.state !== 'jacketing') {
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.scale(st.sc, st.sc);
      x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = 4; x.shadowOffsetY = 2;
      x.drawImage(p.canvas, -p.w / 2, -p.h / 2); x.restore();
    }
    st.fossilDirty = false;
  }
  function updateMask(st, name) {
    const m = st.masks[name], x = m.getContext('2d');
    const img = x.createImageData(GW, GH), d = img.data, a = st[name], j = st.jit;
    for (let i = 0; i < a.length; i++) {
      const v = U.clamp((a[i] + j[i] * 0.3 - 0.12) * 4, 0, 1);
      d[i * 4 + 3] = v * 255;
    }
    x.putImageData(img, 0, 0);
    // Shadow = the same mask in dark brown, drawn offset under the layer.
    const sm = st.shadowMasks[name], sx = sm.getContext('2d');
    sx.globalCompositeOperation = 'copy'; sx.drawImage(m, 0, 0);
    sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#140a00'; sx.fillRect(0, 0, GW, GH);
    const L = st.layers[name], lx = L.getContext('2d');
    lx.globalCompositeOperation = 'copy';
    lx.drawImage(st.tex[name], 0, 0);
    lx.globalCompositeOperation = 'destination-in';
    lx.imageSmoothingEnabled = true;
    lx.drawImage(m, 0, 0, W, H);
    lx.globalCompositeOperation = 'source-over';
  }
  function rebuild(st) {
    if (st.fossilDirty) rebuildFossil(st);
    for (const n of ['dust', 'dirt', 'rock']) if (st.dl[n]) { updateMask(st, n); st.dl[n] = false; }
    const x = st.comp.getContext('2d');
    x.drawImage(st.fossil, 0, 0);
    const sh = { dust: 2, dirt: 4, rock: 7 };
    for (const n of ['dust', 'dirt', 'rock']) {
      x.globalAlpha = n === 'dust' ? 0.25 : 0.4;
      x.drawImage(st.shadowMasks[n], -sh[n] * 0.4, sh[n] * 0.6, W + sh[n], H + sh[n]);
      x.globalAlpha = n === 'dust' ? 0.93 : 1;
      x.drawImage(st.layers[n], 0, 0);
    }
    x.globalAlpha = 1;
    st.dirty = false;
  }

  function drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(250,245,230,0.55)'; ctx.lineWidth = 1.2;
    ctx.setLineDash([]);
    for (let i = 1; i < 12; i++) { const x = i * 80; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 2, H / 2, x, H); ctx.stroke(); }
    for (let j = 1; j < 8; j++) { const y = j * 75; ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + 3, W, y); ctx.stroke(); }
    ctx.font = '600 11px "Courier Prime", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const x = i * 80 + 40;
      ctx.fillStyle = 'rgba(30,20,10,0.6)'; U.roundRect(ctx, x - 9, 3, 18, 15, 3); ctx.fill();
      ctx.fillStyle = '#f2efe6'; ctx.fillText('ABCDEFGHIJKL'[i], x, 11);
    }
    for (let j = 0; j < 8; j++) {
      const y = j * 75 + 37;
      ctx.fillStyle = 'rgba(30,20,10,0.6)'; U.roundRect(ctx, 3, y - 8, 16, 16, 3); ctx.fill();
      ctx.fillStyle = '#f2efe6'; ctx.fillText(String(j + 1), 11, y);
    }
    // Survey flags at the stakes
    for (const [fx, fy] of [[0, 0], [W, 0], [0, H], [W, H]]) {
      const sx = U.clamp(fx, 8, W - 8), sy = U.clamp(fy, 8, H - 8);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(sx - 2, sy - 2, 5, 5);
    }
    ctx.restore();
  }
  function drawScaleBar(ctx, st) {
    if (!st.pxPerM) return;
    const nice = [0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10];
    let m = nice[0];
    for (const v of nice) if (v * st.pxPerM <= 170) m = v;
    const len = m * st.pxPerM, x = W - len - 22, y = H - 22;
    ctx.save();
    ctx.fillStyle = 'rgba(30,20,10,0.65)'; U.roundRect(ctx, x - 8, y - 20, len + 16, 30, 4); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#f2efe6' : '#1a120a'; ctx.fillRect(x + (len / 4) * i, y, len / 4, 5); }
    ctx.strokeStyle = '#f2efe6'; ctx.lineWidth = 1; ctx.strokeRect(x, y, len, 5);
    ctx.fillStyle = '#f2efe6'; ctx.font = '600 11px "Courier Prime", monospace'; ctx.textAlign = 'center';
    ctx.fillText(m >= 1 ? m + ' m' : Math.round(m * 100) + ' cm', x + len / 2, y - 7);
    ctx.restore();
  }
  function drawTool(ctx, tool, x, y, t, active) {
    ctx.save(); ctx.translate(x, y);
    const swing = active ? Math.sin(t * 30) * 0.25 : 0;
    if (tool === 'pick') {
      ctx.rotate(-0.6 + swing);
      ctx.fillStyle = '#7a5230'; U.roundRect(ctx, -3, -4, 6, 54, 3); ctx.fill();
      ctx.fillStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(-26, -2); ctx.quadraticCurveTo(0, -12, 22, -6); ctx.lineTo(22, 0); ctx.quadraticCurveTo(0, -4, -26, -2); ctx.fill();
      ctx.fillStyle = '#5a6066'; ctx.fillRect(-5, -9, 10, 10);
    } else if (tool === 'trowel') {
      ctx.rotate(-0.7 + swing * 0.5);
      ctx.fillStyle = '#b8bec4'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -26); ctx.quadraticCurveTo(0, -34, 10, -26); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7a8086'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#6a6e72'; ctx.fillRect(-1.5, -34, 3, -8);
      ctx.fillStyle = '#a0522d'; U.roundRect(ctx, -4, -62, 8, 22, 3); ctx.fill();
    } else {
      ctx.rotate(-0.5 + swing * 0.6);
      ctx.fillStyle = '#d8c090'; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.lineTo(7, -14); ctx.lineTo(-7, -14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8a7040'; ctx.lineWidth = 0.8; for (let i = -7; i <= 7; i += 2.5) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i * 0.8, -12); ctx.stroke(); }
      ctx.fillStyle = '#9aa0a6'; ctx.fillRect(-7, -20, 14, 6);
      ctx.fillStyle = '#c0392b'; U.roundRect(ctx, -4, -52, 8, 33, 3); ctx.fill();
    }
    ctx.restore();
  }
  function bubbleRect(b) { return { x: b.x - 52, y: b.y - 50, w: 104, h: 28 }; }

  FD.Dig.render = function (st, ctx) {
    if (st.dirty || st.fossilDirty) rebuild(st);
    ctx.drawImage(st.comp, 0, 0);
    // Plaster going on
    for (const p of st.pieces) if (p.state === 'jacketing') {
      const k = U.clamp((st.t - p.jt) / 1.0, 0, 1);
      ctx.save(); ctx.translate(p.x, p.y - k * k * 30); ctx.rotate(p.rot); ctx.scale(st.sc, st.sc);
      ctx.globalAlpha = 1 - Math.max(0, k - 0.8) * 5;
      ctx.drawImage(p.canvas, -p.w / 2, -p.h / 2);
      ctx.globalAlpha *= Math.min(1, k * 1.6);
      ctx.drawImage(p.jacket.canvas, -p.jacket.canvas.width / 2, -p.jacket.canvas.height / 2);
      ctx.restore();
    }
    // Pit edge shading
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,10,0,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawGrid(ctx);
    drawScaleBar(ctx, st);
    // Particles
    for (const q of st.particles) {
      ctx.globalAlpha = U.clamp(q.life / q.max, 0, 1) * (q.alpha || 1);
      ctx.fillStyle = q.color;
      if (q.puff) { U.ellipse(ctx, q.x, q.y, q.size * (2 - q.life / q.max), q.size * (2 - q.life / q.max), 0); ctx.fill(); }
      else ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    }
    ctx.globalAlpha = 1;
    // Bubbles over exposed bones
    const bub = (b, label, color) => {
      const R = bubbleRect(b), pulse = 1 + Math.sin(st.t * 5) * 0.04;
      ctx.save(); ctx.translate(b.x, R.y + R.h / 2); ctx.scale(pulse, pulse); ctx.translate(-b.x, -(R.y + R.h / 2));
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, R.x + 2, R.y + 3, R.w, R.h, 14); ctx.fill();
      ctx.fillStyle = color; U.roundRect(ctx, R.x, R.y, R.w, R.h, 14); ctx.fill();
      ctx.beginPath(); ctx.moveTo(b.x - 7, R.y + R.h); ctx.lineTo(b.x, R.y + R.h + 9); ctx.lineTo(b.x + 7, R.y + R.h); ctx.fill();
      ctx.fillStyle = '#1a120a'; ctx.font = '700 14px Rubik, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, b.x, R.y + R.h / 2 + 1);
      ctx.restore();
    };
    for (const p of st.pieces) if (p.state === 'exposed') bub(p, 'Jacket it!', '#f2efe6');
    for (const b of st.bonus) if (b.state === 'exposed') bub(b, 'Collect', '#ffd36b');
    // Tool cursor
    if (st.pointer.inside) {
      const tr = TOOLS[st.tool].radius;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(st.pointer.x, st.pointer.y, tr, 0, U.TAU); ctx.stroke(); ctx.setLineDash([]);
      drawTool(ctx, st.tool, st.pointer.x, st.pointer.y, st.t, st.pointer.down);
    }
  };

  // ---------------- tools ----------------
  function emit(st, n, x, y, color, opts) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * U.TAU, sp = (opts.speed || 120) * (0.4 + Math.random());
      const life = (opts.life || 0.5) * (0.6 + Math.random() * 0.6);
      st.particles.push({ x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 80), life, max: life, color, size: (opts.size || 3) * (0.6 + Math.random() * 0.8), grav: opts.grav === undefined ? 400 : opts.grav, puff: opts.puff, alpha: opts.alpha });
    }
  }
  function crackPiece(st, p, x, y) {
    p.crackN = (p.crackN || 0) + 1;
    if (p.crackN > 7) return;
    // Draw a crack into the piece canvas at the hit point (in piece-local pixels).
    const dx = x - p.x, dy = y - p.y, c = Math.cos(-p.rot), s = Math.sin(-p.rot);
    const lx = (dx * c - dy * s) / st.sc + p.w / 2, ly = (dx * s + dy * c) / st.sc + p.h / 2;
    const ctx = p.canvas.getContext('2d');
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = 'rgba(25,15,8,0.85)'; ctx.lineWidth = Math.max(1.2, 1.6 / st.sc); ctx.lineCap = 'round';
    const len = 16 / st.sc;
    for (let b = 0; b < 3; b++) {
      let px = lx, py = ly, a = Math.random() * U.TAU;
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let k = 0; k < 4; k++) { a += (Math.random() - 0.5) * 1.2; px += Math.cos(a) * len / 4; py += Math.sin(a) * len / 4; ctx.lineTo(px, py); }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; U.ellipse(ctx, lx, ly, 4 / st.sc, 3 / st.sc, 0); ctx.fill();
    ctx.restore();
    st.fossilDirty = true;
  }
  function msg(st, key, text, kind) {
    const now = st.t;
    if (st.msgs[key] && now - st.msgs[key] < 4) return;
    st.msgs[key] = now;
    st.onEvent('message', { text, kind: kind || 'warn' });
  }

  function apply(st, x, y) {
    const tool = st.tool, R = TOOLS[tool].radius;
    const gx0 = Math.max(0, Math.floor((x - R) / CELL)), gx1 = Math.min(GW - 1, Math.floor((x + R) / CELL));
    const gy0 = Math.max(0, Math.floor((y - R) / CELL)), gy1 = Math.min(GH - 1, Math.floor((y + R) / CELL));
    const ci = U.clamp(Math.floor(y / CELL), 0, GH - 1) * GW + U.clamp(Math.floor(x / CELL), 0, GW - 1);
    let removed = 0, hitRock = false;
    const damaged = new Set();
    if (tool === 'trowel' && st.rock[ci] > 0.25) {
      FD.Sfx.clink(); emit(st, 3, x, y, '#ffffff', { size: 2, life: 0.25, speed: 140 });
      msg(st, 'hard', 'Too hard for the trowel. Use the rock pick on rock.');
      return;
    }
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      const d = Math.hypot(gx * CELL + CELL / 2 - x, gy * CELL + CELL / 2 - y);
      if (d > R) continue;
      const f = 1 - d / R, i = gy * GW + gx;
      const bone = st.boneAt[i];
      if (tool === 'pick') {
        let e = 0.6 * f * (0.8 + Math.random() * 0.4);
        if (st.rock[i] > 0) { hitRock = true; const t = Math.min(st.rock[i], e); st.rock[i] -= t; e -= t; removed += t; }
        if (e > 0) {
          const t = Math.min(st.dirt[i], e * 0.8); st.dirt[i] -= t; e -= t; removed += t;
          if (e > 0.05) { st.dust[i] = Math.max(0, st.dust[i] - e); }
          // The pick hit bone with little left to protect it
          if (bone >= 0 && f > 0.45 && st.rock[i] + st.dirt[i] < 0.2) damaged.add(bone);
        }
      } else if (tool === 'trowel') {
        if (st.rock[i] > 0.05) continue;
        const t = Math.min(st.dirt[i], 0.13 * f); st.dirt[i] -= t; removed += t;
        if (st.dirt[i] <= 0) { const u = Math.min(st.dust[i], 0.04 * f); st.dust[i] -= u; removed += u; }
        if (bone >= 0 && st.dirt[i] <= 0 && st.dust[i] < 0.15 && f > 0.4) damaged.add(bone);
      } else {
        if (st.rock[i] > 0.05) continue;
        if (st.dirt[i] > 0) { const t = Math.min(st.dirt[i], 0.035 * f); st.dirt[i] -= t; removed += t; }
        else { const t = Math.min(st.dust[i], 0.1 * f); st.dust[i] -= t; removed += t; }
      }
    }
    if (tool === 'pick') {
      st.strikes++;
      FD.Sfx.pick(hitRock);
      if (hitRock) emit(st, 10, x, y, st.style.rock, { size: 4, speed: 160, up: 120 });
      emit(st, 5, x, y, st.style.dirt, { size: 3, speed: 100 });
      for (const bi of damaged) {
        const p = st.pieces[bi];
        if (p.state !== 'buried' && p.state !== 'exposed') continue;
        p.damage = Math.min(1, p.damage + 0.08); st.cracks++;
        crackPiece(st, p, x, y); FD.Sfx.crack();
        emit(st, 6, x, y, st.style.bone, { size: 3, speed: 90 });
        msg(st, 'crack', 'Crack! The pick is too rough this close to bone. Switch to the brush.', 'bad');
      }
    } else if (tool === 'trowel') {
      if (removed > 0.02) { if (Math.random() < 0.5) FD.Sfx.scrape(); emit(st, 2, x, y, st.style.dirt, { size: 3, speed: 70, life: 0.4 }); }
      for (const bi of damaged) {
        const p = st.pieces[bi];
        if (p.state !== 'buried' && p.state !== 'exposed') continue;
        p.damage = Math.min(1, p.damage + 0.004);
        if (Math.random() < 0.05) { crackPiece(st, p, x, y); st.cracks++; }
        msg(st, 'scratch', 'Careful, the trowel is scratching the bone. Use the brush.', 'bad');
      }
    } else if (removed > 0.01) {
      if (Math.random() < 0.4) FD.Sfx.brush();
      emit(st, 2, x, y, st.style.dust, { size: 6, speed: 40, up: 20, grav: -10, life: 0.8, puff: true, alpha: 0.5 });
    }
    if (removed > 0 || damaged.size) {
      st.dirty = true; st.dl.dirt = st.dl.dust = true; if (tool === 'pick') st.dl.rock = true;
      checkExposure(st);
    }
  }

  function exposedFrac(st, cells) {
    let n = 0;
    for (const c of cells) if (st.rock[c] + st.dirt[c] + st.dust[c] < CLEAR) n++;
    return n / Math.max(1, cells.length);
  }
  function checkExposure(st) {
    for (const p of st.pieces) if (p.state === 'buried') {
      p.exposed = exposedFrac(st, p.cells);
      if (p.exposed >= 0.85) { p.state = 'exposed'; FD.Sfx.expose(); st.onEvent('exposed', p); }
    }
    for (const b of st.bonus) if (b.state === 'buried') {
      b.exposed = exposedFrac(st, b.cells);
      if (b.exposed >= 0.75) { b.state = 'exposed'; FD.Sfx.expose(); }
    }
  }

  function jacket(st, p) {
    p.state = 'jacketing'; p.jt = st.t;
    const sil = U.silhouette(p.canvas, '#f2efe6');
    const o = U.outlined(sil, '#e6e0d0', 5);
    const jx = o.canvas.getContext('2d');
    jx.save(); jx.globalCompositeOperation = 'source-atop';
    jx.strokeStyle = 'rgba(160,140,110,0.5)'; jx.lineWidth = 3;
    for (let i = -o.canvas.height; i < o.canvas.width; i += 14) { jx.beginPath(); jx.moveTo(i, 0); jx.lineTo(i + o.canvas.height * 0.6, o.canvas.height); jx.stroke(); }
    const g = jx.createLinearGradient(0, 0, 0, o.canvas.height); g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    jx.fillStyle = g; jx.fillRect(0, 0, o.canvas.width, o.canvas.height);
    jx.restore();
    p.jacket = o;
    st.imprints.push({ sil: U.silhouette(p.canvas, U.shade(st.style.matrix, -0.3)), x: p.x, y: p.y, rot: p.rot, sc: st.sc, w: p.w, h: p.h });
    st.fossilDirty = true;
    FD.Sfx.jacket();
  }

  FD.Dig.pointerDown = function (st, x, y) {
    st.pointer.x = x; st.pointer.y = y; st.pointer.inside = true;
    for (const p of st.pieces) if (p.state === 'exposed') {
      const R = bubbleRect(p);
      if (x >= R.x - 6 && x <= R.x + R.w + 6 && y >= R.y - 6 && y <= R.y + R.h + 14) { jacket(st, p); return; }
    }
    for (const b of st.bonus) if (b.state === 'exposed') {
      const R = bubbleRect(b);
      if (x >= R.x - 6 && x <= R.x + R.w + 6 && y >= R.y - 6 && y <= R.y + R.h + 14) {
        b.state = 'collected'; st.fossilDirty = true; FD.Sfx.collect();
        emit(st, 14, b.x, b.y, '#ffd36b', { size: 3, speed: 150, grav: 0, life: 0.6 });
        st.onEvent('bonus', b); return;
      }
    }
    st.pointer.down = true; st.toolTimer = 0;
    apply(st, x, y);
  };
  FD.Dig.pointerMove = function (st, x, y, inside) { st.pointer.x = x; st.pointer.y = y; st.pointer.inside = inside !== false; };
  FD.Dig.pointerUp = function (st) { st.pointer.down = false; };
  FD.Dig.setTool = function (st, t) { st.tool = t; };

  FD.Dig.update = function (st, dt) {
    st.t += dt;
    if (st.pointer.down) {
      st.toolTimer += dt;
      const every = TOOLS[st.tool].every;
      if (st.toolTimer >= every) { st.toolTimer -= every; apply(st, st.pointer.x, st.pointer.y); }
    }
    for (const p of st.pieces) if (p.state === 'jacketing' && st.t - p.jt > 1.2) { p.state = 'jacketed'; st.onEvent('jacketed', p); }
    for (const q of st.particles) { q.life -= dt; q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; }
    st.particles = st.particles.filter(q => q.life > 0);
  };

  FD.Dig.stats = function (st) {
    const total = st.pieces.length;
    const jacketed = st.pieces.filter(p => p.state === 'jacketed').length;
    const exposed = st.pieces.filter(p => p.state === 'exposed' || p.state === 'jacketing').length;
    let cleared = 0;
    for (let i = 0; i < st.rock.length; i++) if (st.rock[i] + st.dirt[i] + st.dust[i] < CLEAR) cleared++;
    const dmg = st.pieces.reduce((s, p) => s + p.damage, 0) / total;
    return { total, jacketed, exposed, cleared: cleared / st.rock.length, condition: 1 - dmg, bonus: st.bonus.filter(b => b.state === 'collected').length };
  };
  // Clear everything around a random buried bone a little (used by the "Hint" button).
  FD.Dig.hint = function (st) {
    const left = st.pieces.filter(p => p.state === 'buried');
    if (!left.length) return null;
    const p = left.sort((a, b) => b.exposed - a.exposed)[0];
    const c = p.cells[Math.floor(p.cells.length / 2)];
    return { x: (c % GW) * CELL + CELL / 2, y: Math.floor(c / GW) * CELL + CELL / 2, piece: p };
  };
})(window.FD, window.WE);
