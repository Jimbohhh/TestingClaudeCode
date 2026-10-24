// Builds fossil bone pieces from the creature anatomy used by the WildDex art engine.
// Every piece has a draw(ctx) in skeleton space (creature facing right, feet at y=0),
// optional holes(ctx) (eye sockets, windows in the skull), and is rendered to its own
// textured canvas so it can be buried, dug up, cracked, carried and mounted.
window.FD = window.FD || {};
(function (FD, WE) {
  const U = WE.U;
  const K = {};
  const deg = U.deg;

  // Bird-hipped dinosaurs (ornithischians) have a pubis that points backwards.
  const BIRD_HIPPED = ['triceratops', 'edmontosaurus', 'stegosaurus', 'ankylosaurus', 'pachycephalosaurus', 'protoceratops', 'psittacosaurus', 'pinacosaurus', 'thescelosaurus', 'dryosaurus'];

  // ---------------- bone primitives ----------------
  function longBone(ctx, a, b, w, knob) {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = knob || 1;
    ctx.save();
    ctx.translate(a[0], a[1]); ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(w * 0.4, -w * 0.45);
    ctx.quadraticCurveTo(len / 2, -w * 0.28, len - w * 0.4, -w * 0.45);
    ctx.lineTo(len - w * 0.4, w * 0.45);
    ctx.quadraticCurveTo(len / 2, w * 0.28, w * 0.4, w * 0.45);
    ctx.closePath(); ctx.fill();
    U.ellipse(ctx, w * 0.25, 0, w * 0.6 * k, w * 0.55 * k, 0); ctx.fill();
    U.ellipse(ctx, len - w * 0.25, 0, w * 0.6 * k, w * 0.5 * k, 0); ctx.fill();
    ctx.restore();
  }
  function vertebra(ctx, x, y, ang, s, spine, chevron, lean) {
    lean = lean === undefined ? s * 0.15 : lean;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    U.roundRect(ctx, -s * 0.42, -s * 0.32, s * 0.84, s * 0.64, s * 0.2); ctx.fill();
    if (spine > 0) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, -s * 0.25);
      ctx.lineTo(-s * 0.16 - lean, -s * 0.3 - spine);
      ctx.lineTo(s * 0.12 - lean, -s * 0.3 - spine);
      ctx.lineTo(s * 0.26, -s * 0.25);
      ctx.closePath(); ctx.fill();
    }
    if (chevron > 0) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, s * 0.25);
      ctx.lineTo(-s * 0.06 - lean, s * 0.3 + chevron);
      ctx.lineTo(s * 0.08 - lean, s * 0.3 + chevron);
      ctx.lineTo(s * 0.16, s * 0.25);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function rib(ctx, top, bottom, w, bow) {
    const mid = [(top[0] + bottom[0]) / 2 + bow, (top[1] + bottom[1]) / 2];
    U.taperPath(ctx, U.bezierPts(top, mid, bottom, null, 8), w, w * 0.35);
    ctx.fill();
  }
  function claw(ctx, x, y, ang, len, curl) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.18);
    ctx.quadraticCurveTo(len * 0.7, -len * 0.25 - curl * len, len, len * 0.15 + curl * len * 0.4);
    ctx.quadraticCurveTo(len * 0.55, len * 0.05, 0, len * 0.18);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function toothRow(ctx, pts, len, up) {
    for (const p of pts) {
      ctx.beginPath();
      ctx.moveTo(p[0] - len * 0.22, p[1]);
      ctx.lineTo(p[0] + len * 0.05, p[1] + (up ? -len : len));
      ctx.lineTo(p[0] + len * 0.22, p[1]);
      ctx.closePath(); ctx.fill();
    }
  }
  // Sample n points (with tangents) along a polyline, from first to last point.
  function along(pts, n, t0, t1) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = U.dist(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); segs.push(l); total += l; }
    const out = [];
    for (let k = 0; k < n; k++) {
      const t = U.lerp(t0 || 0, t1 === undefined ? 1 : t1, n === 1 ? 0.5 : k / (n - 1));
      let d = t * total, i = 0;
      while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
      const f = segs[i] ? d / segs[i] : 0;
      const a = pts[i], b = pts[i + 1];
      out.push({ x: U.lerp(a[0], b[0], f), y: U.lerp(a[1], b[1], f), ang: Math.atan2(b[1] - a[1], b[0] - a[0]), t });
    }
    return out;
  }
  const interpY = (line, x) => {
    const pts = [...line].sort((p, q) => p[0] - q[0]);
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return U.lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
    return pts[pts.length - 1][1];
  };

  // ---------------- DINOSAURS & other archosaurs ----------------
  function dinoPieces(a) {
    const spec = a.art;
    const D = WE.Sprites._dino;
    const anim = { moving: false };
    const sk = D.dinoSkeleton(spec, 0, anim);
    const T = D.torsoPts(spec, sk);
    const tp = D.tailPts(spec, sk, 0, anim);
    const nk = D.neckPts(spec, sk);
    const legs = sk.biped ? D.bipedLegs(spec, sk, 0, anim) : D.quadLegs(spec, sk, 0, anim);
    const h = spec.head, H = h.h, HL = h.len;
    const hp = D.headPts(h);
    const ht = { x: nk.end[0], y: nk.end[1], a: deg(h.tilt || 0) };
    const L = sk.L, DD = sk.D;
    const ornith = BIRD_HIPPED.includes(a.id);
    const vs = Math.max(2.4, DD * 0.16);
    const P = [];
    const inHead = fn => ctx => { ctx.save(); ctx.translate(ht.x, ht.y); ctx.rotate(ht.a); fn(ctx); ctx.restore(); };
    const sh = h.snoutH !== undefined ? h.snoutH : 0.45;
    const mouthY = (h.mouthY !== undefined ? h.mouthY : 0.12) * H;
    const gape = h.gape || 0.42;
    const mouth = U.bezierPts([HL * 1.0, mouthY * (sh + 0.2)], [HL * 0.7, mouthY], [HL * gape, mouthY * 1.4], null, 8);
    const isTheropod = !ornith && sk.biped;

    // Skull (with frill, horn cores, crests and dome as bone)
    P.push({
      id: 'skull', name: 'Skull', sci: 'cranium', big: true,
      draw: inHead(ctx => {
        if (h.frill) {
          const R = H * h.frill.size, cx = HL * 0.15, cy = -H * 0.35;
          ctx.beginPath(); ctx.moveTo(HL * 0.35, -H * 0.1);
          for (let i = 0; i <= 18; i++) { const an = deg(195) + (i / 18) * deg(h.frill.sweep || 150); ctx.lineTo(cx + Math.cos(an) * R * 0.95, cy + Math.sin(an) * R * (i % 2 ? 1.05 : 1)); }
          ctx.lineTo(HL * 0.3, H * 0.25); ctx.closePath(); ctx.fill();
        }
        ctx.beginPath();
        hp.top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.lineTo(HL * 1.01, (hp.top[hp.top.length - 1][1] + mouth[0][1]) / 2);
        mouth.forEach(p => ctx.lineTo(p[0], p[1]));
        ctx.lineTo(0, H * 0.28);
        ctx.closePath(); ctx.fill();
        if (h.dome) { U.ellipse(ctx, HL * 0.3, -H * 0.5, HL * 0.3, H * 0.45, 0); ctx.fill(); }
        if (h.horns) {
          const horn = (x, y, an, len, w) => { ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x + Math.cos(an) * len * 0.5 - w * 0.3, y + Math.sin(an) * len * 0.5, x + Math.cos(an + 0.2) * len, y + Math.sin(an + 0.2) * len); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill(); };
          if (h.horns.brow) horn(HL * 0.36, -H * 0.42, -deg(68), h.horns.brow * 0.85, H * 0.09);
          if (h.horns.nose) horn(HL * 0.78, -H * 0.25, -deg(85), h.horns.nose * 0.85, H * 0.08);
          if (h.horns.cheek) horn(HL * 0.2, H * 0.22, deg(130), h.horns.cheek * 0.8, H * 0.07);
        }
        if (h.crest && h.crest.type !== 'comb') {
          ctx.beginPath();
          if (h.crest.type === 'tall') { ctx.moveTo(HL * 0.3, -H * 0.45); ctx.quadraticCurveTo(HL * 0.35, -H * (0.6 + h.crest.size), HL * 0.62, -H * (0.55 + h.crest.size * 0.9)); ctx.quadraticCurveTo(HL * 0.85, -H * (0.4 + h.crest.size * 0.4), HL * 0.88, -H * 0.3); }
          else if (h.crest.type === 'nasal') { ctx.moveTo(HL * 0.62, -H * 0.38); ctx.quadraticCurveTo(HL * 0.7, -H * (0.45 + h.crest.size), HL * 0.8, -H * 0.32); }
          else { ctx.moveTo(HL * 0.4, -H * 0.45); ctx.lineTo(HL * 0.45, -H * (0.5 + h.crest.size)); ctx.lineTo(HL * 0.55, -H * 0.43); }
          ctx.closePath(); ctx.fill();
        }
        if (h.teeth) toothRow(ctx, along(mouth, h.teethN || 8, 0.05, 0.8).map(p => [p.x, p.y]), h.teeth * 0.9, false);
      }),
      holes: inHead(ctx => {
        const ex = HL * (h.eyeX || 0.3), ey = -H * (h.eyeY || 0.18);
        U.ellipse(ctx, ex, ey, H * 0.13, H * 0.15, 0); ctx.fill();                                   // eye socket (orbit)
        U.ellipse(ctx, HL * (h.nostrilX || 0.88), -H * sh * 0.3, H * 0.06, H * 0.045, -0.3); ctx.fill();  // nostril
        if (!ornith && HL > H * 1.3) { U.ellipse(ctx, HL * 0.56, -H * 0.06, HL * 0.12, H * 0.13, 0); ctx.fill(); } // antorbital window
        if (isTheropod) { U.ellipse(ctx, ex - HL * 0.15, ey + H * 0.15, HL * 0.05, H * 0.14, 0.2); ctx.fill(); }   // temporal window
        if (h.frill && a.id === 'protoceratops') { U.ellipse(ctx, -HL * 0.1, -H * 0.85, H * 0.18, H * 0.24, 0.5); ctx.fill(); }
      }),
    });
    // Lower jaw
    P.push({
      id: 'jaw', name: 'Lower jaw', sci: 'mandible',
      draw: inHead(ctx => {
        ctx.beginPath();
        mouth.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 1) : ctx.moveTo(p[0], p[1] + 1)));
        ctx.lineTo(HL * 0.08, H * 0.22);
        const bot = hp.bot.slice().reverse();
        bot.forEach(p => { if (p[0] > HL * 0.08) ctx.lineTo(p[0], p[1]); });
        ctx.closePath(); ctx.fill();
        if (h.teeth) toothRow(ctx, along(mouth, Math.max(3, (h.teethN || 8) - 2), 0.1, 0.75).map(p => [p.x, p.y + 2]), h.teeth * 0.7, true);
      }),
      holes: isTheropod ? inHead(ctx => { U.ellipse(ctx, HL * 0.5, mouthY * 2, HL * 0.07, H * 0.05, 0); ctx.fill(); }) : null,
    });
    // Neck
    const nN = spec.neck.len > 150 ? 15 : spec.neck.len > 45 ? 10 : 6;
    const nv = along(nk.pts, nN, 0.05, 0.95);
    P.push({
      id: 'neck', name: 'Neck vertebrae', sci: 'cervical vertebrae',
      draw: ctx => { for (const v of nv) { const s = U.lerp(spec.neck.w * 0.5, Math.max(vs * 0.7, spec.neck.w * 0.35), v.t); vertebra(ctx, v.x, v.y, v.ang, s, s * 0.35, 0); } },
    });
    // Back (dorsal) vertebrae, following the back line, with tall spines for a sail
    const backLine = T.top.map(p => [p[0], p[1] + DD * 0.2]).filter(p => p[0] >= -0.2 * L);
    const dv = along(backLine, 12, 0.06, 0.92);
    const sailH = x => { if (!spec.sail) return 0; const u = U.clamp((x + 0.15 * L) / (1.15 * L), 0, 1); return Math.pow(Math.sin(Math.PI * u), spec.sail.shape || 0.9) * spec.sail.h; };
    P.push({
      id: 'back', name: spec.sail ? 'Back vertebrae with sail spines' : 'Back vertebrae', sci: 'dorsal vertebrae', big: !!spec.sail,
      draw: ctx => { for (const v of dv) vertebra(ctx, v.x, v.y, v.ang, vs * 1.1, (spec.sail ? sailH(v.x) + DD * 0.2 : vs * (spec.plates ? 0.6 : 0.9)), 0, 0); },
    });
    // Ribs
    P.push({
      id: 'ribs', name: 'Ribs', sci: 'dorsal ribs', big: true,
      draw: ctx => {
        for (const v of dv) {
          if (v.x < 0.05 * L || v.x > 0.98 * L) continue;
          const by = interpY(T.bot, v.x - DD * 0.1) - DD * 0.06;
          rib(ctx, [v.x, v.y + vs * 0.3], [v.x - DD * 0.12, by], vs * 0.42, DD * 0.12);
        }
        if (isTheropod) for (let i = 0; i < 6; i++) { const x = U.lerp(0.15 * L, 0.75 * L, i / 5), y = interpY(T.bot, x) - DD * 0.05; U.taperPath(ctx, [[x - DD * 0.1, y - 2], [x + DD * 0.1, y + 2]], vs * 0.25, vs * 0.15); ctx.fill(); }
      },
    });
    // Hips
    const hipJ = [0.04 * L, sk.hY + 0.08 * DD];
    P.push({
      id: 'hips', name: 'Hip bones', sci: ornith ? 'pelvis (bird-hipped)' : 'pelvis (lizard-hipped)',
      draw: ctx => {
        ctx.beginPath(); ctx.ellipse(0.03 * L, sk.hY - 0.12 * DD, 0.3 * L, 0.2 * DD, 0, 0, U.TAU); ctx.fill();
        longBone(ctx, [hipJ[0] - vs * 0.2, hipJ[1]], [-0.22 * L, sk.hY + 0.5 * DD], vs * 0.75);   // ischium
        if (ornith) {
          longBone(ctx, [hipJ[0], hipJ[1] + vs * 0.3], [-0.2 * L, sk.hY + 0.58 * DD], vs * 0.45);  // backward pubis
          longBone(ctx, [hipJ[0] + vs * 0.4, hipJ[1]], [0.22 * L, sk.hY + 0.2 * DD], vs * 0.5);    // prepubis
        } else {
          longBone(ctx, [hipJ[0] + vs * 0.3, hipJ[1]], [0.22 * L, sk.hY + 0.62 * DD], vs * 0.8);  // forward pubis
          if (isTheropod) { U.ellipse(ctx, 0.22 * L, sk.hY + 0.66 * DD, vs * 1.6, vs * 0.6, 0); ctx.fill(); } // pubic boot
        }
      },
      holes: ctx => { U.ellipse(ctx, hipJ[0], hipJ[1], vs * 0.55, vs * 0.55, 0); ctx.fill(); },
    });
    // Tail
    // One vertebra per step along the tail, sized so neighbours just touch.
    const tailN = 22;
    const tailAll = along(tp, tailN, 0, 1).map(v => Object.assign(v, { ang: v.ang + Math.PI }));
    const step = spec.tail.len / (tailN - 1);
    const tailV = (from, to) => tailAll.filter(v => v.t >= from && v.t < to);
    const tailSize = t => Math.max(1.6, Math.min(U.lerp(spec.tail.w * 0.34, (spec.tail.tip || 3) * 0.5, t), step / 0.92));
    const split = 0.42;
    P.push({
      id: 'tail1', name: 'Tail vertebrae (base)', sci: 'caudal vertebrae',
      draw: ctx => { for (const v of tailV(0, split)) { const s = tailSize(v.t); vertebra(ctx, v.x, v.y, v.ang, s, s * 0.6 * (1 - v.t), s * 0.7 * (1 - v.t)); } },
    });
    P.push({
      id: 'tail2', name: spec.tail.club ? 'Tail with club' : 'Tail vertebrae (end)', sci: 'caudal vertebrae',
      draw: ctx => {
        for (const v of tailV(split, 1.01)) { const s = tailSize(v.t); vertebra(ctx, v.x, v.y, v.ang, s, s * 0.3 * (1 - v.t), s * 0.4 * (1 - v.t)); }
        if (spec.tail.club) { const e = tp[tp.length - 1]; U.ellipse(ctx, e[0], e[1], spec.tail.club, spec.tail.club * 0.7, 0); ctx.fill(); }
      },
    });
    if (spec.tail.spikes) {
      const n = tp.length - 1, e = tp[n], p = tp[n - 2];
      const an0 = Math.atan2(e[1] - p[1], e[0] - p[0]);
      P.push({
        id: 'spikes', name: 'Tail spikes (thagomizer)', sci: 'dermal spikes',
        draw: ctx => {
          for (let i = 0; i < 4; i++) {
            const q = tp[n - 1 - (i % 2) * 2];
            const sa = an0 + (i < 2 ? -1 : 1) * (Math.PI / 2 + 0.6) * (i % 2 ? 1 : 0.85) * -1;
            const sl = spec.tail.spikes;
            ctx.beginPath(); ctx.moveTo(q[0] - 3, q[1]); ctx.lineTo(q[0] + Math.cos(sa) * sl, q[1] + Math.sin(sa) * sl); ctx.lineTo(q[0] + 3, q[1]); ctx.closePath(); ctx.fill();
          }
        },
      });
    }
    if (spec.plates) {
      const spots = [];
      for (let i = T.top.length - 1; i >= 0; i--) spots.push(T.top[i]);
      for (let i = 1; i < 8; i++) spots.push(tp[i]);
      const n = spec.plates.count || 14;
      const plates = [];
      for (let k = 0; k < n; k += 2) {
        const u = k / (n - 1), f = u * (spots.length - 1), i = Math.floor(f), r = f - i;
        const pa = spots[i], pb = spots[Math.min(spots.length - 1, i + 1)];
        plates.push({ x: U.lerp(pa[0], pb[0], r), y: U.lerp(pa[1], pb[1], r) + 4, s: spec.plates.h * (0.35 + 0.65 * Math.sin(Math.PI * Math.pow(u, 0.85))) });
      }
      const drawPlates = list => ctx => { for (const pl of list) { ctx.beginPath(); ctx.moveTo(pl.x - pl.s * 0.4, pl.y); ctx.quadraticCurveTo(pl.x - pl.s * 0.5, pl.y - pl.s * 0.7, pl.x + pl.s * 0.05, pl.y - pl.s); ctx.quadraticCurveTo(pl.x + pl.s * 0.5, pl.y - pl.s * 0.6, pl.x + pl.s * 0.4, pl.y); ctx.closePath(); ctx.fill(); } };
      const half = Math.ceil(plates.length / 2);
      P.push({ id: 'plates1', name: 'Back plates (front)', sci: 'dermal plates', draw: drawPlates(plates.slice(0, half)) });
      P.push({ id: 'plates2', name: 'Back plates (back)', sci: 'dermal plates', draw: drawPlates(plates.slice(half)) });
    }
    if (spec.scutes && a.id !== 'diplodocus') {
      P.push({ id: 'scutes', name: 'Bony back scutes', sci: 'osteoderms', draw: ctx => { for (const v of dv) { U.ellipse(ctx, v.x, v.y - vs * 1.2, vs * 0.5, vs * 0.35, 0); ctx.fill(); } } });
    }
    // Shoulder blade
    P.push({
      id: 'scapula', name: 'Shoulder blade', sci: 'scapula & coracoid',
      draw: ctx => { longBone(ctx, [0.7 * L, sk.sY - 0.4 * DD], [0.96 * L, sk.sY + 0.18 * DD], vs * 1.1, 0.8); U.ellipse(ctx, 0.98 * L, sk.sY + 0.25 * DD, vs * 0.9, vs * 0.7, 0); ctx.fill(); },
    });
    // Limbs
    const lw = spec.legW;
    const drawBipedLeg = (lg, upper, lower) => ctx => {
      if (upper) longBone(ctx, lg.root, lg.knee, lw * 0.85);
      if (lower) {
        longBone(ctx, lg.knee, lg.ankle, lw * 0.55);
        longBone(ctx, [lg.knee[0] - lw * 0.3, lg.knee[1] + lw * 0.2], [lg.ankle[0] - lw * 0.25, lg.ankle[1]], lw * 0.25); // fibula
        for (let m = 0; m < 3; m++) longBone(ctx, [lg.ankle[0] + (m - 1) * lw * 0.18, lg.ankle[1]], [lg.toe[0] + (m - 1) * lw * 0.12, lg.toe[1] - lw * 0.2], lw * 0.28);
        for (let tI = 0; tI < 3; tI++) {
          const an = -0.06 + (tI - 1) * 0.12, len = lg.foot * (0.65 + (tI === 1 ? 0.2 : 0));
          const ex = lg.toe[0] + Math.cos(an) * len, ey = lg.toe[1] + Math.sin(an) * len * 0.3 - lw * 0.1;
          for (let ph = 0; ph < 3; ph++) longBone(ctx, [U.lerp(lg.toe[0], ex, ph / 3), U.lerp(lg.toe[1] - lw * 0.2, ey, ph / 3)], [U.lerp(lg.toe[0], ex, (ph + 1) / 3), U.lerp(lg.toe[1] - lw * 0.2, ey, (ph + 1) / 3)], lw * 0.2);
          claw(ctx, ex, ey, an, lw * 0.5, 0.2);
        }
        if (spec.sickle) claw(ctx, lg.toe[0] + lg.foot * 0.05, lg.toe[1] - lw * 0.4, -1.1, lg.foot * 0.6, 0.5);
      }
    };
    const drawQuadLeg = (lg, upper, lower) => ctx => {
      const w = lw * (lg.front ? (spec.frontLegW || 0.9) : 1);
      if (upper) longBone(ctx, lg.root, lg.joint, w * 0.8);
      if (lower) {
        longBone(ctx, lg.joint, [lg.foot[0], lg.foot[1] - w * 0.35], w * 0.55);
        longBone(ctx, [lg.joint[0] + w * 0.25, lg.joint[1]], [lg.foot[0] + w * 0.2, lg.foot[1] - w * 0.35], w * 0.25);
        for (let tI = 0; tI < 4; tI++) longBone(ctx, [lg.foot[0] - w * 0.1, lg.foot[1] - w * 0.35], [lg.foot[0] + w * (0.5 + tI * 0.1), lg.foot[1] - tI * 0.8], w * 0.18);
      }
    };
    if (sk.biped) {
      const near = legs.find(l => l.near), far = legs.find(l => !l.near);
      P.push({ id: 'femur', name: 'Thigh bone', sci: 'femur', big: true, draw: drawBipedLeg(near, true, false) });
      P.push({ id: 'shin', name: 'Shin & foot', sci: 'tibia, fibula, metatarsals & toes', draw: drawBipedLeg(near, false, true) });
      P.push({ id: 'leg2', name: 'Other back leg', sci: 'femur, tibia & foot', draw: drawBipedLeg(far, true, true) });
      if (spec.arms) {
        const ar = spec.arms;
        const sx = 0.88 * L, sy = sk.sY + 0.2 * DD, a1 = deg(70), a2 = deg(ar.fold !== undefined ? ar.fold : 10);
        const ex = sx + Math.cos(a1) * ar.len * 0.5, ey = sy + Math.sin(a1) * ar.len * 0.5;
        const hx = ex + Math.cos(a2) * ar.len * 0.5, hy = ey + Math.sin(a2) * ar.len * 0.5;
        P.push({
          id: 'arm', name: ar.len < DD * 0.5 ? 'Little arm & claws' : 'Arm & hand claws', sci: 'humerus, radius, ulna & claws',
          draw: ctx => {
            longBone(ctx, [sx, sy], [ex, ey], ar.w * 0.9);
            longBone(ctx, [ex, ey], [hx, hy], ar.w * 0.6);
            const nF = ar.fingers || 3;
            for (let f = 0; f < nF; f++) claw(ctx, hx, hy, a2 + (f - (nF - 1) / 2) * 0.35, ar.claw || ar.w * 1.4, 0.35);
          },
        });
      }
    } else {
      const nh = legs.find(l => l.near && !l.front), nf = legs.find(l => l.near && l.front);
      const fh = legs.find(l => !l.near && !l.front), ff = legs.find(l => !l.near && l.front);
      P.push({ id: 'femur', name: 'Thigh bone', sci: 'femur', big: true, draw: drawQuadLeg(nh, true, false) });
      P.push({ id: 'shin', name: 'Lower back leg & foot', sci: 'tibia, fibula & foot', draw: drawQuadLeg(nh, false, true) });
      P.push({ id: 'arm', name: 'Front leg', sci: 'humerus, radius, ulna & hand', draw: drawQuadLeg(nf, true, true) });
      P.push({ id: 'leg2', name: 'Other back leg', sci: 'femur, tibia & foot', draw: drawQuadLeg(fh, true, true) });
      P.push({ id: 'arm2', name: 'Other front leg', sci: 'humerus, radius, ulna & hand', draw: drawQuadLeg(ff, true, true) });
    }
    // Feather impressions (Solnhofen and Yixian preserve feathers as imprints in the rock)
    if (spec.arms && spec.arms.wing && (a.id === 'archaeopteryx')) {
      const ar = spec.arms;
      P.push({
        id: 'feathers', name: 'Feather impressions', sci: 'imprints of wing & tail feathers', impression: true,
        draw: ctx => {
          const sx = 0.88 * L, sy = sk.sY + 0.2 * DD;
          for (let i = 0; i < 9; i++) {
            const t = i / 8, px = sx + Math.cos(deg(60)) * ar.len * t, py = sy + Math.sin(deg(60)) * ar.len * t * 0.7;
            const len = ar.wing * (0.45 + t * 0.6), an = deg(115 - t * 40);
            U.taperPath(ctx, [[px, py], [px + Math.cos(an) * len, py + Math.sin(an) * len]], len * 0.2, len * 0.05); ctx.fill();
          }
          for (let i = 3; i < tp.length; i++) {
            const p = tp[i], q = tp[i - 1], an = Math.atan2(p[1] - q[1], p[0] - q[0]), len = spec.tailFeathers * (0.35 + i / tp.length * 0.8);
            for (const s of [-1, 1]) { U.taperPath(ctx, [[p[0], p[1]], [p[0] + Math.cos(an + s * 0.32) * len, p[1] + Math.sin(an + s * 0.32) * len]], len * 0.28, len * 0.12); ctx.fill(); }
          }
        },
      });
    }
    return { pieces: P, align: true };
  }

  // ---------------- PTEROSAURS (preserved flattened, wings spread) ----------------
  function pteroPieces(a) {
    const p = a.art, s = p.size, span = p.span * s, hl = p.headLen * s;
    const P = [];
    const bw = s * 0.13;
    P.push({
      id: 'skull', name: 'Skull & beak', sci: 'cranium', big: true,
      draw: ctx => {
        ctx.beginPath(); ctx.moveTo(s * 0.55, -s * 0.16); ctx.quadraticCurveTo(s * 0.55 + hl * 0.5, -s * 0.12, s * 0.55 + hl, 0); ctx.lineTo(s * 0.55, s * 0.12); ctx.closePath(); ctx.fill();
        if (p.crest) { ctx.beginPath(); ctx.moveTo(s * 0.6, -s * 0.1); ctx.quadraticCurveTo(s * 0.4, -s * 0.5, s * 0.55 - hl * p.crest * 0.45, -s * 0.85); ctx.quadraticCurveTo(s * 0.45, -s * 0.3, s * 0.85, -s * 0.12); ctx.closePath(); ctx.fill(); }
        if (p.teeth) toothRow(ctx, Array.from({ length: 8 }, (_, i) => [s * 0.7 + i * hl * 0.09, s * 0.02]), s * 0.08, false);
      },
      holes: ctx => { U.ellipse(ctx, s * 0.68, -s * 0.06, s * 0.06, s * 0.05, 0); ctx.fill(); U.ellipse(ctx, s * 0.55 + hl * 0.35, -s * 0.03, hl * 0.12, s * 0.035, 0); ctx.fill(); },
    });
    P.push({ id: 'neck', name: 'Neck vertebrae', sci: 'cervical vertebrae', draw: ctx => { for (let i = 0; i < 7; i++) vertebra(ctx, s * (0.12 + i * 0.065), 0, 0, s * 0.1, 0, 0); } });
    P.push({
      id: 'body', name: 'Backbone & ribs', sci: 'dorsal vertebrae & ribs',
      draw: ctx => { for (let i = 0; i < 9; i++) { const x = -s * 0.5 + i * s * 0.08; vertebra(ctx, x, 0, 0, s * 0.1, 0, 0); if (i > 1 && i < 8) { rib(ctx, [x, -s * 0.04], [x - s * 0.08, -s * 0.28], s * 0.03, -s * 0.03); rib(ctx, [x, s * 0.04], [x - s * 0.08, s * 0.28], s * 0.03, -s * 0.03); } } },
    });
    const wing = side => ctx => {
      const S0 = [s * 0.12, side * s * 0.12];
      const E = [S0[0] - span * 0.06, S0[1] + side * span * 0.11];
      const W = [E[0] + span * 0.05, E[1] + side * span * 0.13];
      const tip = [W[0] - span * 0.2, W[1] + side * span * 0.2];
      longBone(ctx, S0, E, bw * 1.6);
      longBone(ctx, E, W, bw * 1.2); longBone(ctx, [E[0] + bw, E[1]], [W[0] + bw, W[1]], bw * 0.6);
      for (let k = 0; k < 4; k++) longBone(ctx, [U.lerp(W[0], tip[0], k / 4), U.lerp(W[1], tip[1], k / 4)], [U.lerp(W[0], tip[0], (k + 1) / 4), U.lerp(W[1], tip[1], (k + 1) / 4)], bw * (1.1 - k * 0.2));
      for (let f = 0; f < 3; f++) claw(ctx, W[0], W[1], (side > 0 ? 0.3 : -0.3) + f * 0.3 * side, bw * 2, 0.3);
    };
    P.push({ id: 'wing1', name: 'Wing bones (left)', sci: 'humerus, forearm & wing finger', big: true, draw: wing(-1) });
    P.push({ id: 'wing2', name: 'Wing bones (right)', sci: 'humerus, forearm & wing finger', big: true, draw: wing(1) });
    P.push({
      id: 'legs', name: 'Hips & back legs', sci: 'pelvis, femur, tibia & feet',
      draw: ctx => {
        U.ellipse(ctx, -s * 0.6, 0, s * 0.14, s * 0.1, 0); ctx.fill();
        for (const side of [-1, 1]) { longBone(ctx, [-s * 0.6, side * s * 0.06], [-s * 0.95, side * s * 0.3], bw * 1.1); longBone(ctx, [-s * 0.95, side * s * 0.3], [-s * 1.35, side * s * 0.42], bw * 0.8); for (let f = 0; f < 4; f++) longBone(ctx, [-s * 1.35, side * s * 0.42], [-s * 1.5, side * s * (0.36 + f * 0.05)], bw * 0.35); }
        if (p.tail) for (let i = 0; i < 12; i++) vertebra(ctx, -s * 0.75 - i * s * p.tail * 0.075, 0, 0, s * 0.05, 0, 0);
      },
    });
    return { pieces: P, align: false };
  }

  // ---------------- MARINE REPTILES ----------------
  function marinePieces(a) {
    const m = a.art, L = m.len, H = m.h, plesio = m.form === 'plesio';
    const P = [];
    const vs = H * 0.22;
    const hl = m.headLen;
    const paddle = (x, y, len, ang, hyper) => ctx => {
      const bx = x + Math.cos(ang) * len * 0.25, by = y + Math.sin(ang) * len * 0.25;
      longBone(ctx, [x, y], [bx, by], vs * 1.2);
      for (let d = 0; d < 4; d++) {
        const da = ang + (d - 1.5) * 0.12;
        for (let k = 0; k < hyper; k++) {
          const r0 = len * (0.28 + k * 0.72 / hyper), r1 = len * (0.28 + (k + 0.8) * 0.72 / hyper);
          longBone(ctx, [x + Math.cos(da) * r0, y + Math.sin(da) * r0], [x + Math.cos(da) * r1, y + Math.sin(da) * r1], vs * 0.55 * (1 - k / hyper * 0.6));
        }
      }
    };
    const skullDraw = ctx => {
      const x0 = L * 0.45 + (plesio ? 0 : 0), y0 = -H * 0.05;
      ctx.beginPath(); ctx.moveTo(x0, y0 - H * (plesio ? 0.12 : 0.28)); ctx.quadraticCurveTo(x0 + hl * 0.6, y0 - H * (plesio ? 0.12 : 0.22), x0 + hl, y0); ctx.lineTo(x0 + hl * 0.95, y0 + H * 0.05); ctx.lineTo(x0, y0 + H * 0.08); ctx.closePath(); ctx.fill();
      toothRow(ctx, Array.from({ length: plesio ? 8 : 12 }, (_, i) => [x0 + hl * (0.2 + i * 0.07), y0 + H * 0.05]), H * (plesio ? 0.14 : 0.12), false);
    };
    const skullHoles = ctx => { const x0 = L * 0.45, y0 = -H * 0.05; U.ellipse(ctx, x0 + hl * 0.25, y0 - H * 0.07, H * 0.06, H * 0.05, 0); ctx.fill(); U.ellipse(ctx, x0 + hl * 0.55, y0 - H * 0.08, H * 0.04, H * 0.025, 0); ctx.fill(); };
    if (plesio) {
      const neckL = m.neck || L * 0.8;
      const npts = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14; npts.push([L * 0.45 + t * neckL * 0.95, -H * 0.05 - Math.sin(t * Math.PI * 0.5) * neckL * 0.25]); }
      const end = npts[14];
      P.push({ id: 'skull', name: 'Skull with needle teeth', sci: 'cranium', draw: ctx => { ctx.save(); ctx.translate(end[0] - L * 0.45, end[1] + H * 0.05); skullDraw(ctx); ctx.restore(); }, holes: ctx => { ctx.save(); ctx.translate(end[0] - L * 0.45, end[1] + H * 0.05); skullHoles(ctx); ctx.restore(); } });
      const nv = along(npts, 34, 0, 1);
      P.push({ id: 'neck1', name: 'Neck vertebrae (front half)', sci: 'cervical vertebrae', draw: ctx => { for (const v of nv.slice(17)) vertebra(ctx, v.x, v.y, v.ang, vs * 0.85, vs * 0.25, 0); } });
      P.push({ id: 'neck2', name: 'Neck vertebrae (back half)', sci: 'cervical vertebrae', draw: ctx => { for (const v of nv.slice(0, 17)) vertebra(ctx, v.x, v.y, v.ang, vs, vs * 0.3, 0); } });
    } else {
      P.push({ id: 'skull', name: 'Skull', sci: 'cranium', big: true, draw: skullDraw, holes: skullHoles });
      P.push({ id: 'jaw', name: 'Lower jaw', sci: 'mandible', draw: ctx => { const x0 = L * 0.45, y0 = -H * 0.05; ctx.beginPath(); ctx.moveTo(x0 + hl * 0.95, y0 + H * 0.12); ctx.lineTo(x0 - hl * 0.05, y0 + H * 0.12); ctx.lineTo(x0, y0 + H * 0.3); ctx.quadraticCurveTo(x0 + hl * 0.5, y0 + H * 0.26, x0 + hl * 0.95, y0 + H * 0.16); ctx.closePath(); ctx.fill(); toothRow(ctx, Array.from({ length: 10 }, (_, i) => [x0 + hl * (0.2 + i * 0.07), y0 + H * 0.12]), H * 0.1, true); } });
    }
    const spine = [];
    for (let i = 0; i <= 20; i++) { const x = U.lerp(L * 0.45, -L * 0.5, i / 20); spine.push([x, 0]); }
    const dv = along(spine, 16, 0, 1).map(v => Object.assign(v, { ang: 0 }));
    P.push({ id: 'back', name: 'Back vertebrae', sci: 'dorsal vertebrae', draw: ctx => { for (const v of dv) vertebra(ctx, v.x, v.y, 0, vs * 1.1, vs * 0.4, 0); } });
    P.push({
      id: 'ribs', name: plesio ? 'Ribs & belly ribs' : 'Ribs', sci: plesio ? 'ribs & gastralia' : 'ribs', big: true,
      draw: ctx => {
        for (const v of dv.slice(2, 14)) rib(ctx, [v.x, v.y + vs * 0.3], [v.x - H * 0.1, H * 0.42], vs * 0.4, H * 0.1);
        if (plesio) for (let i = 0; i < 8; i++) { const x = U.lerp(L * 0.3, -L * 0.3, i / 7); U.taperPath(ctx, [[x - H * 0.15, H * 0.46], [x + H * 0.15, H * 0.5]], vs * 0.3, vs * 0.2); ctx.fill(); }
      },
    });
    if (plesio) {
      P.push({ id: 'girdles', name: 'Shoulder & hip plates', sci: 'pectoral & pelvic girdles', draw: ctx => { U.ellipse(ctx, L * 0.3, H * 0.35, L * 0.12, H * 0.2, 0.2); ctx.fill(); U.ellipse(ctx, -L * 0.3, H * 0.35, L * 0.1, H * 0.18, -0.2); ctx.fill(); } });
      const tailPts = Array.from({ length: 10 }, (_, i) => [-L * 0.5 - i * L * 0.035, i * 1.5]);
      P.push({ id: 'tail1', name: 'Tail vertebrae', sci: 'caudal vertebrae', draw: ctx => { tailPts.forEach((p, i) => vertebra(ctx, p[0], p[1], 0, vs * (0.9 - i * 0.06), vs * 0.2, vs * 0.2)); } });
    } else {
      const tl = L * 0.7;
      const tpts = Array.from({ length: 16 }, (_, i) => { const t = i / 15; return [-L * 0.5 - t * tl, t > 0.75 ? (t - 0.75) * tl * 0.5 : 0]; });
      const tv = along(tpts, 26, 0, 1);
      P.push({ id: 'tail1', name: 'Tail vertebrae (front)', sci: 'caudal vertebrae', draw: ctx => { for (const v of tv.slice(0, 13)) vertebra(ctx, v.x, v.y, v.ang + Math.PI, vs * (1 - v.t * 0.5), vs * 0.5, vs * 0.5); } });
      P.push({ id: 'tail2', name: 'Tail with fin bend', sci: 'caudal vertebrae (tail bend)', draw: ctx => { for (const v of tv.slice(13)) vertebra(ctx, v.x, v.y, v.ang + Math.PI, vs * (1 - v.t * 0.6), vs * 0.4 * (1 - v.t), vs * 0.8 * (1 - v.t)); } });
    }
    const fl = plesio ? H * 1.6 : H * 0.8, hyper = plesio ? 8 : 5;
    P.push({ id: 'flipper1', name: plesio ? 'Front flipper' : 'Front paddle', sci: 'humerus & finger bones', draw: paddle(L * 0.28, H * 0.3, fl, deg(125), hyper) });
    P.push({ id: 'flipper2', name: plesio ? 'Other front flipper' : 'Other front paddle', sci: 'humerus & finger bones', draw: paddle(L * 0.2, H * 0.3, fl * 0.95, deg(150), hyper) });
    P.push({ id: 'flipper3', name: plesio ? 'Back flipper' : 'Back paddle', sci: 'femur & toe bones', draw: paddle(-L * 0.28, H * 0.3, fl * 0.9, deg(130), hyper) });
    P.push({ id: 'flipper4', name: plesio ? 'Other back flipper' : 'Other back paddle', sci: 'femur & toe bones', draw: paddle(-L * 0.36, H * 0.3, fl * 0.85, deg(155), hyper) });
    return { pieces: P, align: false };
  }

  // ---------------- AMMONITE ----------------
  function ammonitePieces(a) {
    const s = 100;
    const spiral = (t0, t1, ctx) => {
      ctx.beginPath();
      for (let t = t0; t <= t1; t += 0.05) { const r = s * Math.exp(-t * 0.16); const x = Math.cos(t) * r, y = Math.sin(t) * r; t === t0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      for (let t = t1; t >= t0; t -= 0.05) { const r = s * Math.exp(-t * 0.16) * 0.62; ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r); }
      ctx.closePath(); ctx.fill();
    };
    const sutures = (t0, t1) => ctx => {
      ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (let t = t0 + 0.15; t < t1; t += 0.22) {
        const r0 = s * Math.exp(-t * 0.16), r1 = r0 * 0.64;
        ctx.beginPath();
        for (let k = 0; k <= 10; k++) {
          const rr = U.lerp(r0 * 0.98, r1 * 1.02, k / 10), wig = Math.sin(k * 2.2) * 0.05;
          const x = Math.cos(t + wig) * rr, y = Math.sin(t + wig) * rr;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    };
    return {
      pieces: [
        { id: 'whorls', name: 'Inner coiled shell', sci: 'phragmocone', big: true, draw: ctx => { spiral(2.2, 14, ctx); U.ellipse(ctx, 0, 0, s * 0.12, s * 0.12, 0); ctx.fill(); }, holes: sutures(2.2, 14) },
        { id: 'bodychamber', name: 'Body chamber', sci: 'outer living chamber', draw: ctx => spiral(0, 2.25, ctx), holes: sutures(0.2, 0.8) },
        { id: 'aptychus', name: 'Jaw plates', sci: 'aptychus', draw: ctx => { ctx.save(); ctx.translate(s * 1.25, s * 0.15); for (const sd of [-1, 1]) { U.ellipse(ctx, sd * s * 0.11, 0, s * 0.1, s * 0.16, sd * 0.2); ctx.fill(); } ctx.restore(); } },
      ],
      align: false,
    };
  }

  // ---------------- Bonus finds ----------------
  K.BONUS = {
    sharktooth: { name: 'Shark tooth', fact: 'Sharks\' skeletons are made of cartilage, which rarely fossilises, so most fossil sharks are known only from their teeth.', size: 26,
      draw: (ctx, s) => { ctx.beginPath(); ctx.moveTo(-s * 0.45, s * 0.35); ctx.quadraticCurveTo(-s * 0.2, -s * 0.2, 0, -s * 0.7); ctx.quadraticCurveTo(s * 0.2, -s * 0.2, s * 0.45, s * 0.35); ctx.quadraticCurveTo(0, s * 0.55, -s * 0.45, s * 0.35); ctx.fill(); } },
    leaf: { name: 'Fossil leaf', fact: 'Leaves can leave a perfect print in fine mud. They tell us what plants grew there and what the climate was like.', size: 40, impression: true,
      draw: (ctx, s) => { ctx.beginPath(); ctx.moveTo(0, s * 0.6); ctx.quadraticCurveTo(-s * 0.45, 0, 0, -s * 0.6); ctx.quadraticCurveTo(s * 0.45, 0, 0, s * 0.6); ctx.fill(); },
      holes: (ctx, s) => { ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, s * 0.6); ctx.lineTo(0, -s * 0.55); for (let i = 1; i < 6; i++) { const y = s * 0.5 - i * s * 0.18; ctx.moveTo(0, y); ctx.lineTo(-s * 0.22, y - s * 0.12); ctx.moveTo(0, y); ctx.lineTo(s * 0.22, y - s * 0.12); } ctx.stroke(); } },
    wood: { name: 'Petrified wood', fact: 'In petrified wood, minerals slowly replaced the wood, copying even its growth rings in stone.', size: 46,
      draw: (ctx, s) => { U.roundRect(ctx, -s * 0.6, -s * 0.22, s * 1.2, s * 0.44, s * 0.15); ctx.fill(); },
      holes: (ctx, s) => { ctx.lineWidth = 1; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(s * 0.55, 0, s * 0.04 * i, s * 0.06 * i, 0, 0, U.TAU); ctx.stroke(); } for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.55, -s * 0.15 + i * s * 0.1); ctx.lineTo(s * 0.4, -s * 0.15 + i * s * 0.1); ctx.stroke(); } } },
    eggshell: { name: 'Dinosaur eggshell', fact: 'Dinosaur eggshell has tiny pores so the baby inside could breathe, just like birds\' eggs today.', size: 34,
      draw: (ctx, s) => { for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate((i - 1.5) * s * 0.3, (i % 2) * s * 0.2); ctx.rotate(i); ctx.beginPath(); ctx.arc(0, s * 0.3, s * 0.3, -2.4, -0.7); ctx.lineTo(s * 0.15, -s * 0.05); ctx.fill(); ctx.restore(); } } },
    coprolite: { name: 'Coprolite (fossil poop!)', fact: 'Coprolites are fossilised droppings. They show scientists exactly what ancient animals ate.', size: 36,
      draw: (ctx, s) => { for (let i = 0; i < 4; i++) { U.ellipse(ctx, -s * 0.36 + i * s * 0.24, Math.sin(i) * s * 0.05, s * 0.18, s * 0.15, 0); ctx.fill(); } } },
    fishfossil: { name: 'Fossil fish', fact: 'Whole fossil fish are common in fine lake and lagoon mud, where nothing disturbed them after they sank.', size: 46, impression: true,
      draw: (ctx, s) => { ctx.beginPath(); ctx.ellipse(0, 0, s * 0.45, s * 0.14, 0, 0, U.TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(-s * 0.62, -s * 0.16); ctx.lineTo(-s * 0.62, s * 0.16); ctx.fill(); },
      holes: (ctx, s) => { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(s * 0.35, 0); for (let i = 0; i < 9; i++) { const x = -s * 0.32 + i * s * 0.08; ctx.moveTo(x, -s * 0.11); ctx.lineTo(x + 2, s * 0.11); } ctx.stroke(); U.ellipse(ctx, s * 0.32, -s * 0.03, 2, 2, 0); ctx.fill(); } },
    croctooth: { name: 'Crocodile tooth', fact: 'Crocodiles lived alongside the dinosaurs, and their cone-shaped teeth are common fossils.', size: 22,
      draw: (ctx, s) => { ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.5); ctx.quadraticCurveTo(-s * 0.25, -s * 0.2, 0, -s * 0.6); ctx.quadraticCurveTo(s * 0.25, -s * 0.2, s * 0.25, s * 0.5); ctx.closePath(); ctx.fill(); } },
    dragonfly: { name: 'Dragonfly imprint', fact: 'Solnhofen\'s fine limestone even preserved the delicate wing veins of insects.', size: 48, impression: true,
      draw: (ctx, s) => { ctx.fillRect(-s * 0.05, -s * 0.5, s * 0.1, s); for (const sd of [-1, 1]) for (const y of [-0.3, -0.1]) { U.ellipse(ctx, sd * s * 0.3, s * y, s * 0.3, s * 0.07, 0); ctx.fill(); } } },
  };

  K.build = function (a) {
    const kind = a.art.kind;
    if (kind === 'dino') return dinoPieces(a);
    if (kind === 'ptero') return pteroPieces(a);
    if (kind === 'marine') return marinePieces(a);
    if (kind === 'ammonite') return ammonitePieces(a);
    throw new Error('No skeleton builder for ' + kind);
  };

  // ---------------- Rendering pieces to textured canvases ----------------
  function trimCanvas(c, pad) {
    const ctx = c.getContext('2d');
    const { width: w, height: h } = c;
    const data = ctx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const out = U.canvas(x1 - x0 + 1, y1 - y0 + 1);
    out.getContext('2d').drawImage(c, -x0, -y0);
    return { canvas: out, x: x0, y: y0 };
  }

  // Colour a black silhouette as fossil bone: shading, mineral speckles, and an edge.
  K.colorize = function (c, style, seed, impression) {
    const x = c.getContext('2d');
    const w = c.width, h = c.height;
    x.save();
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = impression ? style.impression : style.bone;
    x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, w * 0.3, h);
    g.addColorStop(0, 'rgba(255,248,230,0.28)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = U.rng(seed);
    const n = Math.min(4000, w * h / 40);
    for (let i = 0; i < n; i++) {
      x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,240,210,0.16)';
      x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 1.5);
    }
    x.restore();
    const o = U.outlined(c, impression ? 'rgba(40,30,20,0.25)' : style.edge, impression ? 0.6 : 1.3);
    return o;
  };

  // Render all pieces at scale k. Returns pieces with canvas + articulated position.
  K.render = function (a, built, k, style) {
    const out = [];
    const bounds = K.bounds(built);
    const W = Math.ceil((bounds.x1 - bounds.x0) * k) + 40, H = Math.ceil((bounds.y1 - bounds.y0) * k) + 40;
    built.pieces.forEach((p, i) => {
      const c = U.canvas(W, H);
      const ctx = c.getContext('2d');
      ctx.setTransform(k, 0, 0, k, (-bounds.x0) * k + 20, (-bounds.y0) * k + 20);
      ctx.fillStyle = '#000'; ctx.strokeStyle = '#000';
      p.draw(ctx);
      if (p.holes) { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; ctx.strokeStyle = '#000'; p.holes(ctx); ctx.globalCompositeOperation = 'source-over'; }
      const t = trimCanvas(c, 2);
      if (!t) return;
      const o = K.colorize(t.canvas, style, U.hash(a.id + p.id), p.impression);
      out.push(Object.assign({}, p, {
        canvas: o.canvas, w: o.canvas.width, h: o.canvas.height,
        // articulated centre in the bounds-local pixel space
        ax: t.x - o.pad + o.canvas.width / 2 - 20, ay: t.y - o.pad + o.canvas.height / 2 - 20,
        index: i,
      }));
    });
    return { pieces: out, width: W - 40, height: H - 40, bounds };
  };

  K.bounds = function (built) {
    if (built._bounds) return built._bounds;
    // Render each piece at a small scale to find the overall extent.
    const s = 0.25;
    const W = 1400, H = 800;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of built.pieces) {
      const c = U.canvas(W, H);
      const ctx = c.getContext('2d');
      ctx.setTransform(s, 0, 0, s, W / 2, H * 0.75);
      p.draw(ctx);
      const t = trimCanvas(c, 0);
      if (!t) continue;
      x0 = Math.min(x0, (t.x - W / 2) / s); y0 = Math.min(y0, (t.y - H * 0.75) / s);
      x1 = Math.max(x1, (t.x + t.canvas.width - W / 2) / s); y1 = Math.max(y1, (t.y + t.canvas.height - H * 0.75) / s);
    }
    built._bounds = { x0, y0, x1, y1 };
    return built._bounds;
  };

  K.renderBonus = function (id, k, style) {
    const b = K.BONUS[id];
    const s = b.size;
    const c = U.canvas(s * 2.4 * k + 10, s * 2.4 * k + 10);
    const ctx = c.getContext('2d');
    ctx.setTransform(k, 0, 0, k, c.width / 2, c.height / 2);
    ctx.fillStyle = '#000'; ctx.strokeStyle = '#000';
    b.draw(ctx, s);
    if (b.holes) { ctx.globalCompositeOperation = 'destination-out'; b.holes(ctx, s); ctx.globalCompositeOperation = 'source-over'; }
    const t = trimCanvas(c, 2);
    const bonusStyle = Object.assign({}, style, id === 'sharktooth' ? { bone: '#3a3430' } : id === 'wood' ? { bone: '#8a6a4a' } : id === 'eggshell' ? { bone: '#d8cbb0' } : id === 'coprolite' ? { bone: '#6a5a44' } : {});
    const o = K.colorize(t.canvas, bonusStyle, U.hash(id), b.impression);
    return { canvas: o.canvas, w: o.canvas.width, h: o.canvas.height };
  };

  FD.Skel = K;
})(window.FD, window.WE);
