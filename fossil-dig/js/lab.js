// The lab: put the jacketed bones back together on a skeleton outline, cast any missing
// bones in plaster, mount the skeleton, then see the living animal it came from.
window.FD = window.FD || {};
(function (FD, WE) {
  const U = WE.U;
  const W = 960, H = 600, FRAME_H = 440;
  const SLOT_W = 92, SLOT_H = 70;

  function plasterCast(src) {
    const sil = U.silhouette(src, '#ece7da');
    const x = sil.getContext('2d');
    x.save(); x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, sil.width * 0.3, sil.height);
    g.addColorStop(0, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(120,110,90,0.3)');
    x.fillStyle = g; x.fillRect(0, 0, sil.width, sil.height);
    x.restore();
    return U.outlined(sil, '#9a9282', 1.2).canvas;
  }

  FD.Lab = {};
  FD.Lab.create = function (dig, opts) {
    opts = opts || {};
    const { bounds, kLab, kr } = dig;
    const bw = bounds.x1 - bounds.x0, bh = bounds.y1 - bounds.y0;
    const sl = kLab / kr;
    const lx = (W - bw * kLab) / 2, ly = (FRAME_H - bh * kLab) / 2 + 6;
    const st = {
      dig, creature: dig.creature, sl, lx, ly, t: 0, phase: 'assemble', drag: null, pointer: { x: 0, y: 0 },
      onEvent: opts.onEvent || (() => {}), anim: [], align: dig.built.align,
      origin: { x: lx - bounds.x0 * kLab, y: ly - bounds.y0 * kLab },
    };
    st.pieces = dig.pieces.map((p, i) => {
      const orig = dig.rend.pieces[i];
      return {
        id: p.id, name: p.name, sci: p.sci, canvas: p.canvas, w: p.w, h: p.h, damage: p.damage,
        found: p.state === 'jacketed', placed: false, cast: false, tries: 0, orig,
        tx: lx + p.ax * sl, ty: ly + p.ay * sl, x: 0, y: 0, slot: -1,
      };
    });
    // Ghost outline of the whole skeleton
    const ghost = U.canvas(W, FRAME_H), gx = ghost.getContext('2d');
    for (const p of st.pieces) {
      const sil = U.silhouette(p.orig.canvas, '#ffffff');
      gx.drawImage(sil, p.tx - p.w * sl / 2, p.ty - p.h * sl / 2, p.w * sl, p.h * sl);
    }
    const ghostO = U.canvas(W, FRAME_H), go = ghostO.getContext('2d');
    go.globalAlpha = 0.16; go.drawImage(ghost, 0, 0);
    st.ghost = ghostO;
    layoutTray(st);
    return st;
  };

  function layoutTray(st) {
    let k = 0;
    for (const p of st.pieces) {
      if (!p.found || p.placed) { p.slot = -1; continue; }
      p.slot = k;
      const col = k % 10, row = Math.floor(k / 10);
      p.sx = 22 + col * SLOT_W + SLOT_W / 2; p.sy = FRAME_H + 14 + row * (SLOT_H + 6) + SLOT_H / 2;
      const lw = p.w * st.sl, lh = p.h * st.sl;
      p.ts = Math.min(1, (SLOT_W - 10) / lw, (SLOT_H - 10) / lh) * st.sl;
      k++;
    }
  }
  const remaining = st => st.pieces.filter(p => p.found && !p.placed).length;
  const missing = st => st.pieces.filter(p => !p.found && !p.placed);
  FD.Lab.remaining = remaining;
  FD.Lab.missing = st => missing(st).length;

  function placePiece(st, p, from) {
    p.placed = true;
    st.anim.push({ p, fx: from.x, fy: from.y, fs: from.s, t0: st.t, dur: 0.25 });
    layoutTray(st);
    checkDone(st);
  }
  function checkDone(st) {
    if (st.pieces.every(p => p.placed)) st.onEvent('assembled');
  }

  FD.Lab.castMissing = function (st) {
    const m = missing(st);
    m.forEach((p, i) => {
      p.canvas = plasterCast(p.orig.canvas); p.w = p.canvas.width; p.h = p.canvas.height; p.cast = true;
      setTimeout(() => { p.placed = true; st.anim.push({ p, fade: true, t0: st.t, dur: 0.5 }); FD.Sfx.cast(); if (i === m.length - 1) checkDone(st); }, i * 180);
    });
    return m.length;
  };

  FD.Lab.mount = function (st) { st.phase = 'mounted'; st.mountT = st.t; };
  FD.Lab.reveal = function (st) { st.phase = 'reveal'; st.revealT = st.t; st.view = 'life'; FD.Sfx.reveal(); };
  FD.Lab.setView = function (st, v) { st.view = v; st.viewT = st.t; };

  // ---------------- input ----------------
  FD.Lab.pointerDown = function (st, x, y) {
    st.pointer = { x, y };
    if (st.phase !== 'assemble') return;
    for (const p of st.pieces) {
      if (p.slot < 0) continue;
      if (Math.abs(x - p.sx) < SLOT_W / 2 && Math.abs(y - p.sy) < SLOT_H / 2) {
        st.drag = { p, x, y }; FD.Sfx.click();
        st.onEvent('pick', p);
        return;
      }
    }
  };
  FD.Lab.pointerMove = function (st, x, y) { st.pointer = { x, y }; if (st.drag) { st.drag.x = x; st.drag.y = y; } };
  FD.Lab.pointerUp = function (st) {
    const d = st.drag; if (!d) return;
    st.drag = null;
    const p = d.p;
    const snap = Math.max(34, Math.min(p.w, p.h) * st.sl * 0.45);
    if (Math.hypot(d.x - p.tx, d.y - p.ty) < snap) {
      FD.Sfx.snap();
      st.onEvent('placed', p);
      placePiece(st, p, { x: d.x, y: d.y, s: st.sl });
    } else if (d.y < FRAME_H) {
      p.tries++; FD.Sfx.miss(); st.onEvent('wrong', p);
    }
  };

  // ---------------- drawing ----------------
  function drawPiece(ctx, p, x, y, s, alpha) {
    ctx.save(); if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(p.canvas, x - p.w * s / 2, y - p.h * s / 2, p.w * s, p.h * s);
    ctx.restore();
  }
  function museumBackdrop(ctx, st, k) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a2420'); g.addColorStop(0.72, '#3a302a'); g.addColorStop(0.72, '#4a3c30'); g.addColorStop(1, '#2a221c');
    ctx.globalAlpha = k; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Floor boards
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let i = -10; i < 30; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 60 - 300, H * 0.72); ctx.lineTo(W / 2 + (i - 15) * 140, H); ctx.stroke(); }
    // Spotlight
    const sp = ctx.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.45, W * 0.55);
    sp.addColorStop(0, 'rgba(255,236,190,0.28)'); sp.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  function plinth(ctx, st, k) {
    const gy = st.align ? st.origin.y + 4 : FRAME_H - 10;
    const x0 = st.lx - 30, x1 = W - st.lx + 30;
    ctx.globalAlpha = k;
    ctx.fillStyle = '#1e1a16'; ctx.fillRect(x0, gy, x1 - x0, 26);
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x0, gy, x1 - x0, 4);
    // Label plaque
    ctx.fillStyle = '#c8a46e'; U.roundRect(ctx, W / 2 - 70, gy + 6, 140, 14, 2); ctx.fill();
    ctx.fillStyle = '#2b2118'; ctx.font = '700 9px "Courier Prime", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(st.phase === 'reveal' ? st.creature.name.toUpperCase() : 'SPECIMEN ' + (FD.DIGS.findIndex(d => d.id === st.creature.id) + 1), W / 2, gy + 13);
    ctx.globalAlpha = 1;
  }
  function armature(ctx, st, k) {
    if (!st.align) return;
    const by = st.origin.y + 4;
    ctx.globalAlpha = k;
    ctx.strokeStyle = '#3a3e42'; ctx.lineCap = 'round';
    for (const id of ['hips', 'ribs', 'neck']) {
      const p = st.pieces.find(q => q.id === id); if (!p) continue;
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.tx, p.ty - (id === 'ribs' ? p.h * st.sl * 0.25 : 0)); ctx.lineTo(p.tx + (id === 'neck' ? -10 : 0), by); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = '#6a6e72'; ctx.beginPath(); ctx.moveTo(p.tx - 1, p.ty); ctx.lineTo(p.tx - 1 + (id === 'neck' ? -10 : 0), by); ctx.stroke();
      ctx.strokeStyle = '#3a3e42';
    }
    ctx.globalAlpha = 1;
  }
  function slab(ctx, st, k) {
    if (st.align) return;
    const style = st.dig.style;
    const x0 = st.lx - 40, y0 = st.ly - 30, x1 = W - st.lx + 40, y1 = FRAME_H - 14;
    ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; U.roundRect(ctx, x0 + 6, y0 + 8, x1 - x0, y1 - y0, 6); ctx.fill();
    ctx.fillStyle = style.matrix; U.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, 6); ctx.fill();
    ctx.drawImage(st.dig.tex.matrix, 0, 0, 400, 260, x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8);
    ctx.globalAlpha = 1;
  }

  function lifeSpec(st) {
    const a = st.creature, spec = a.art;
    if (!spec.id) spec.id = a.id;
    return spec;
  }
  function drawLife(ctx, st, alpha) {
    const spec = lifeSpec(st), S = WE.Sprites;
    if (st.align) {
      S.draw(ctx, spec, 'idle', st.t, st.origin.x, st.origin.y, st.dig.kLab, 1, { quality: 2, alpha, fps: 4 });
    } else {
      const mode = spec.kind === 'ptero' ? 'fly' : spec.kind === 'marine' ? 'walk' : 'idle';
      const f = S.frame(spec, mode, 0, 2);
      const zoom = Math.min(560 / f.w, 300 / f.h) * (f.scale || 2);
      const gy = W / 2;
      S.draw(ctx, spec, mode, st.t, gy - (f.w / 2 - f.ox) * zoom / (f.scale || 2), FRAME_H / 2 + (f.oy - f.h / 2) * zoom / (f.scale || 2), zoom, 1, { quality: 2, alpha, fps: 6 });
    }
  }

  FD.Lab.render = function (ctx, st) {
    // Lab bench / museum
    const mk = st.phase === 'assemble' ? 0 : U.clamp((st.t - st.mountT) / 1.2, 0, 1);
    if (mk < 1) {
      const g = ctx.createLinearGradient(0, 0, 0, FRAME_H);
      g.addColorStop(0, '#2e3b38'); g.addColorStop(1, '#22302c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, FRAME_H);
      // Pegboard dots
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let y = 14; y < FRAME_H; y += 22) for (let x = 14; x < W; x += 22) { ctx.beginPath(); ctx.arc(x, y, 2, 0, U.TAU); ctx.fill(); }
      // Tray (sand box)
      const tg = ctx.createLinearGradient(0, FRAME_H, 0, H);
      tg.addColorStop(0, '#8a6a46'); tg.addColorStop(1, '#6a5034');
      ctx.fillStyle = tg; ctx.fillRect(0, FRAME_H, W, H - FRAME_H);
      ctx.fillStyle = '#4a3622'; ctx.fillRect(0, FRAME_H, W, 6);
    }
    if (mk > 0) museumBackdrop(ctx, st, mk);
    slab(ctx, st, Math.max(mk, st.align ? 0 : 1));
    if (mk > 0) { plinth(ctx, st, mk); armature(ctx, st, mk); }
    if (st.phase === 'assemble') ctx.drawImage(st.ghost, 0, 0);
    // Highlight target after a wrong try
    if (st.drag && st.drag.p.tries > 0) {
      const p = st.drag.p, pulse = 0.35 + Math.sin(st.t * 6) * 0.15;
      const sil = p._glow || (p._glow = U.silhouette(p.orig.canvas, '#ffd36b'));
      ctx.globalAlpha = pulse; ctx.drawImage(sil, p.tx - p.w * st.sl / 2, p.ty - p.h * st.sl / 2, p.w * st.sl, p.h * st.sl); ctx.globalAlpha = 1;
    }
    // Placed bones
    let lifeA = 0;
    if (st.phase === 'reveal') {
      const k = U.clamp((st.t - (st.viewT || st.revealT)) / 1.2, 0, 1);
      lifeA = st.view === 'life' ? k : 1 - k;
      if (st.viewT === undefined && st.view === 'life') lifeA = k;
    }
    for (const p of st.pieces) {
      if (!p.placed) continue;
      const an = st.anim.find(a => a.p === p);
      if (an) {
        const k = U.easeOut(U.clamp((st.t - an.t0) / an.dur, 0, 1));
        if (an.fade) drawPiece(ctx, p, p.tx, p.ty, st.sl, k * (1 - lifeA * 0.85));
        else drawPiece(ctx, p, U.lerp(an.fx, p.tx, k), U.lerp(an.fy, p.ty, k), st.sl, 1 - lifeA * 0.85);
      } else drawPiece(ctx, p, p.tx, p.ty, st.sl, 1 - lifeA * 0.85);
    }
    st.anim = st.anim.filter(a => st.t - a.t0 < a.dur + 0.05);
    if (lifeA > 0) drawLife(ctx, st, lifeA);
    // Tray
    if (st.phase === 'assemble') {
      for (const p of st.pieces) {
        if (p.slot < 0 || (st.drag && st.drag.p === p)) continue;
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, p.sx - SLOT_W / 2 + 4, p.sy - SLOT_H / 2 + 2, SLOT_W - 8, SLOT_H - 4, 8); ctx.fill();
        drawPiece(ctx, p, p.sx, p.sy, p.ts);
      }
      if (st.drag) {
        const p = st.drag.p;
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8;
        drawPiece(ctx, p, st.drag.x, st.drag.y, st.sl); ctx.restore();
        ctx.font = '600 13px Rubik, sans-serif'; ctx.textAlign = 'center';
        const label = p.name, tw = ctx.measureText(label).width + 16;
        const ly = st.drag.y - p.h * st.sl / 2 - 18;
        ctx.fillStyle = 'rgba(20,14,8,0.8)'; U.roundRect(ctx, st.drag.x - tw / 2, ly - 11, tw, 22, 11); ctx.fill();
        ctx.fillStyle = '#f2efe6'; ctx.textBaseline = 'middle'; ctx.fillText(label, st.drag.x, ly);
      }
    }
  };
  FD.Lab.update = function (st, dt) { st.t += dt; };

  // Static render of a finished exhibit (for the museum), as skeleton or life.
  FD.Lab.exhibit = function (creature, view, w, h, saved) {
    const built = FD.Skel.build(creature);
    const bounds = FD.Skel.bounds(built);
    const bw = bounds.x1 - bounds.x0, bh = bounds.y1 - bounds.y0;
    const k = Math.min((w - 20) / bw, (h - 20) / bh);
    const c = U.canvas(w, h), x = c.getContext('2d');
    const ox = (w - bw * k) / 2, oy = (h - bh * k) / 2;
    if (view === 'life') {
      const spec = creature.art; if (!spec.id) spec.id = creature.id;
      if (built.align) WE.Sprites.draw(x, spec, 'idle', 0, ox - bounds.x0 * k, oy - bounds.y0 * k, k, 1, { quality: 2 });
      else {
        const mode = spec.kind === 'ptero' ? 'fly' : 'idle';
        const f = WE.Sprites.frame(spec, mode, 0, 2), z = Math.min((w - 20) / f.w, (h - 20) / f.h) * (f.scale || 2);
        WE.Sprites.draw(x, spec, mode, 0, w / 2 - (f.w / 2 - f.ox) * z / (f.scale || 2), h / 2 + (f.oy - f.h / 2) * z / (f.scale || 2), z, 1, { quality: 2 });
      }
      return c;
    }
    const style = { bone: '#e6dcc4', edge: '#5a4630', impression: '#8a7458' };
    const r = FD.Skel.render(creature, built, k, style);
    const castSet = new Set((saved && saved.cast) || []);
    for (const p of r.pieces) {
      const cv = castSet.has(p.id) ? plasterCast(p.canvas) : p.canvas;
      x.drawImage(cv, ox + p.ax - cv.width / 2, oy + p.ay - cv.height / 2);
    }
    return c;
  };
})(window.FD, window.WE);
