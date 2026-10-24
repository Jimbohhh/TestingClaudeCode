// Prehistoric sprite renderers: dinosaurs (bipeds and quadrupeds), pterosaurs,
// marine reptiles, ammonites, plus prehistoric plants. Built on the same
// layer -> pattern -> shading -> texture pipeline as sprites.js.
(function (WE) {
  const U = WE.U, S = WE.Sprites;
  const { makeLayer, finishSurface, drawEye } = S._h;
  const smooth = t => t * t * (3 - 2 * t);

  // ===================================================================
  // DINOSAUR (and other archosaurs / early reptiles)
  // ===================================================================
  function dinoBox(d) {
    const nk = d.neck || { len: 10, angle: 10, w: d.depth * 0.6 };
    const up = Math.max(d.hip, d.shoulder || d.hip) + d.depth + Math.sin(U.deg(Math.max(0, nk.angle))) * nk.len + d.head.h * 2.4
      + (d.sail ? d.sail.h : 0) + (d.plates ? d.plates.h : 0) + (d.head.crest ? d.head.h * 1.2 : 0) + 40;
    const back = d.tail.len + d.len * 0.35 + 50;
    const front = d.len * 1.15 + Math.cos(U.deg(nk.angle)) * nk.len + d.head.len * 1.5 + (d.head.horns ? d.head.len * 0.6 : 0) + 50;
    return { w: back + front, h: up + 20, ox: back, oy: up };
  }

  function dinoSkeleton(d, phase, anim) {
    const biped = d.plan === 'biped';
    const moving = anim.moving;
    const bob = moving ? Math.abs(Math.sin(phase * U.TAU * 2)) * d.hip * (biped ? 0.035 : 0.018) : Math.sin(phase * U.TAU) * 0.8;
    const hY = -d.hip - bob;
    const sY = biped ? hY + d.depth * 0.05 : -(d.shoulder || d.hip) - bob;
    return { biped, bob, hY, sY, L: d.len, D: d.depth };
  }

  function torsoPts(d, sk) {
    const { L, D, hY, sY } = sk;
    const mid = (hY + sY) / 2;
    const arch = d.arch || 0, belly = d.belly || 0;
    const chest = sk.biped ? 0.6 : 0.45;
    return {
      top: [[-0.32 * L, hY - 0.3 * D], [0, hY - 0.5 * D - arch * 0.4], [0.5 * L, mid - 0.5 * D - arch], [0.9 * L, sY - 0.42 * D - arch * 0.3], [1.1 * L, sY - 0.2 * D]],
      bot: [[1.12 * L, sY + 0.1 * D], [0.9 * L, sY + chest * D], [0.5 * L, mid + 0.55 * D + belly], [0.05 * L, hY + 0.42 * D], [-0.32 * L, hY + 0.1 * D]],
    };
  }
  function torsoPath(ctx, d, sk) {
    const t = torsoPts(d, sk);
    ctx.beginPath();
    U.smoothPath(ctx, [...t.top, ...t.bot], true, 0.85);
  }

  function tailPts(d, sk, phase, anim) {
    const t = d.tail, L = sk.L, D = sk.D;
    const pts = [];
    let x = -0.22 * L, y = sk.hY - 0.08 * D;
    let a = Math.PI + U.deg(t.lift || 0);
    const n = 14;
    const sway = anim.moving ? 0.05 : 0.025;
    for (let i = 0; i <= n; i++) {
      pts.push([x, y]);
      a -= U.deg(t.droop || 10) / n;
      a += Math.sin(phase * U.TAU - i * 0.45) * sway * (i / n);
      x += Math.cos(a) * t.len / n;
      y += Math.sin(a) * t.len / n;
    }
    return pts;
  }

  function neckPts(d, sk) {
    const nk = d.neck || { len: 10, angle: 10, w: d.depth * 0.6 };
    const base = [1.0 * sk.L, sk.sY - 0.12 * sk.D];
    const a = -U.deg(nk.angle);
    const end = [base[0] + Math.cos(a) * nk.len, base[1] + Math.sin(a) * nk.len];
    const c = nk.curve || 0;
    const mid = [(base[0] + end[0]) / 2 - Math.sin(a) * c, (base[1] + end[1]) / 2 + Math.cos(a) * c];
    return { pts: U.bezierPts(base, mid, end, null, 10), end, nk };
  }

  // Head outline in local coords (origin = back of skull, +x = snout).
  function headPts(h) {
    const L = h.len, H = h.h;
    const ss = h.snoutStart !== undefined ? h.snoutStart : 0.45;
    const sh = h.snoutH !== undefined ? h.snoutH : 0.45;   // snout tip height as fraction of H
    const jaw = h.jaw !== undefined ? h.jaw : 1;
    const top = [], bot = [];
    const N = 10;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const k = smooth(U.clamp((t - ss) / (1 - ss), 0, 1));
      let ty = U.lerp(-0.5 * H, -sh * 0.5 * H, k) - (h.dome || 0) * H * Math.exp(-Math.pow((t - 0.3) / 0.16, 2)) - (h.nasalBump || 0) * H * Math.exp(-Math.pow((t - 0.42) / 0.12, 2));
      let by = U.lerp(0.45 * H * jaw, sh * 0.5 * H, k);
      if (t < 0.12) { const r = t / 0.12; ty = U.lerp(-0.3 * H, ty, smooth(r)); by = U.lerp(0.3 * H * jaw, by, smooth(r)); }
      top.push([t * L, ty]); bot.push([t * L, by]);
    }
    return { top, bot, all: [...top, [L * 1.01, (top[N][1] + bot[N][1]) / 2], ...bot.reverse()] };
  }

  function headTransform(d, sk, nkEnd) {
    return { x: nkEnd[0], y: nkEnd[1], a: U.deg(d.head.tilt || 0) };
  }

  // Legs ---------------------------------------------------------------
  function bipedLegs(d, sk, phase, anim) {
    const hip = d.hip;
    const thigh = hip * 0.5, shin = hip * 0.5, meta = hip * (d.meta || 0.3), foot = hip * 0.2;
    const stride = anim.moving ? hip * (anim.run ? 0.95 : 0.55) : 0;
    const lift = anim.moving ? hip * (anim.run ? 0.22 : 0.12) : 0;
    const legs = [];
    for (const [near, off] of [[false, 0.5], [true, 0]]) {
      const root = [0.04 * sk.L + (near ? 0 : -6), sk.hY + 0.08 * sk.D];
      const ang = ((phase + off) % 1) * U.TAU;
      const fx = root[0] + Math.cos(ang) * stride * 0.5 + hip * 0.06;
      const fy = -Math.max(0, Math.sin(ang)) * lift;
      const ankle = [fx - foot * 0.2, fy - meta * 0.94];
      const knee = U.ik(root[0], root[1], ankle[0], ankle[1], thigh, shin, -1);
      legs.push({ near, root, knee, ankle, toe: [fx, fy], foot, biped: true });
    }
    return legs;
  }
  function quadLegs(d, sk, phase, anim) {
    const legs = [];
    const order = [['bh', false, false, 0.5], ['bf', true, false, 0.75], ['nh', false, true, 0.0], ['nf', true, true, 0.25]];
    for (const [, front, near, off] of order) {
      const hgt = front ? (d.shoulder || d.hip) : d.hip;
      const root = front ? [0.95 * sk.L, sk.sY + 0.12 * sk.D] : [0.04 * sk.L, sk.hY + 0.1 * sk.D];
      if (!near) root[0] += front ? -8 : 8;
      const stride = anim.moving ? hgt * (anim.run ? 0.6 : 0.36) : 0;
      const lift = anim.moving ? hgt * 0.14 : 0;
      const ang = ((phase + off) % 1) * U.TAU;
      const fx = root[0] + Math.cos(ang) * stride * 0.5;
      const fy = -Math.max(0, Math.sin(ang)) * lift;
      const up = (root[1] < 0 ? -root[1] : hgt) * 0.53, lo = (root[1] < 0 ? -root[1] : hgt) * 0.55;
      const joint = U.ik(root[0], root[1], fx, fy, up, lo, front ? 1 : -1);
      legs.push({ near, front, root, joint, foot: [fx, fy], hgt });
    }
    return legs;
  }

  function drawBipedLeg(ctx, d, lg, col) {
    const w = d.legW;
    const [rx, ry] = lg.root, [kx, ky] = lg.knee, [ax, ay] = lg.ankle, [tx, ty] = lg.toe;
    ctx.fillStyle = col;
    // Big thigh muscle
    U.ellipse(ctx, U.lerp(rx, kx, 0.4), U.lerp(ry, ky, 0.4), w * 1.5, U.dist(rx, ry, kx, ky) * 0.62, Math.atan2(ky - ry, kx - rx) - Math.PI / 2);
    ctx.fill();
    U.taperPath(ctx, [[kx, ky], [U.lerp(kx, ax, 0.5), U.lerp(ky, ay, 0.5)], [ax, ay]], w * 1.2, w * 0.7); ctx.fill();
    U.taperPath(ctx, [[ax, ay], [U.lerp(ax, tx, 0.5), U.lerp(ay, ty, 0.5)], [tx, ty - w * 0.25]], w * 0.72, w * 0.5); ctx.fill();
    // three forward toes
    const fl = lg.foot;
    for (let i = 0; i < 3; i++) {
      const a = -0.06 + (i - 1) * 0.12;
      U.taperPath(ctx, [[tx - fl * 0.15, ty - w * 0.2], [tx + Math.cos(a) * fl * (0.65 + (i === 1 ? 0.2 : 0)), ty + Math.sin(a) * fl * 0.3 - w * 0.08]], w * 0.42, w * 0.18);
      ctx.fill();
    }
    if (d.sickle) {
      // Raised killing claw on the second toe (dromaeosaurs)
      ctx.fillStyle = d.colors.claw || '#2a2420';
      ctx.beginPath();
      ctx.moveTo(tx + fl * 0.05, ty - w * 0.35);
      ctx.quadraticCurveTo(tx + fl * 0.45, ty - fl * 0.55, tx + fl * 0.32, ty - fl * 0.05);
      ctx.quadraticCurveTo(tx + fl * 0.3, ty - fl * 0.3, tx + fl * 0.02, ty - w * 0.15);
      ctx.fill();
      ctx.fillStyle = col;
    }
  }

  function drawQuadLeg(ctx, d, lg, col) {
    const col2 = d.columnar;
    const w = d.legW * (lg.front ? (d.frontLegW || 0.9) : 1);
    const [rx, ry] = lg.root, [jx, jy] = lg.joint, [fx, fy] = lg.foot;
    ctx.fillStyle = col;
    U.ellipse(ctx, U.lerp(rx, jx, 0.3), U.lerp(ry, jy, 0.3), w * (lg.front ? 1.2 : 1.55), U.dist(rx, ry, jx, jy) * 0.55, Math.atan2(jy - ry, jx - rx) - Math.PI / 2);
    ctx.fill();
    U.taperPath(ctx, [[jx, jy], [U.lerp(jx, fx, 0.5), U.lerp(jy, fy, 0.5)], [fx, fy - w * 0.3]], w * (col2 ? 1.1 : 0.95), w * (col2 ? 1.05 : 0.65)); ctx.fill();
    // Foot: broad pad (sauropods, stegosaurs, ceratopsians) or splayed toes
    if (col2) {
      U.ellipse(ctx, fx + w * 0.2, fy - w * 0.28, w * 0.95, w * 0.38, 0); ctx.fill();
      ctx.fillStyle = d.colors.claw || '#3a3028';
      for (let i = 0; i < 3; i++) { U.ellipse(ctx, fx + w * (0.55 + i * 0.12), fy - w * 0.12 - i * 1.5, w * 0.16, w * 0.12, 0); ctx.fill(); }
    } else {
      for (let i = 0; i < 3; i++) {
        U.taperPath(ctx, [[fx - w * 0.1, fy - w * 0.25], [fx + w * (0.75 + i * 0.12), fy - i * 0.8]], w * 0.4, w * 0.15); ctx.fill();
      }
    }
  }

  function drawArm(ctx, d, sk, phase, anim, near, col) {
    const ar = d.arms;
    if (!ar) return;
    const sw = anim.moving ? Math.sin(phase * U.TAU + (near ? 0 : Math.PI)) * 0.2 : Math.sin(phase * U.TAU) * 0.05;
    const sx = 0.88 * sk.L + (near ? 0 : -5), sy = sk.sY + 0.2 * sk.D;
    const a1 = U.deg(70) + sw, a2 = U.deg(ar.fold !== undefined ? ar.fold : 10) + sw * 0.5;
    const ex = sx + Math.cos(a1) * ar.len * 0.5, ey = sy + Math.sin(a1) * ar.len * 0.5;
    const hx = ex + Math.cos(a2) * ar.len * 0.5, hy = ey + Math.sin(a2) * ar.len * 0.5;
    if (ar.wing && near) drawArmWing(ctx, d, sx, sy, ex, ey, hx, hy, ar);
    ctx.fillStyle = col;
    U.taperPath(ctx, [[sx, sy], [ex, ey]], ar.w * 1.3, ar.w); ctx.fill();
    U.taperPath(ctx, [[ex, ey], [hx, hy]], ar.w, ar.w * 0.7); ctx.fill();
    ctx.fillStyle = d.colors.claw || '#2a2420';
    const n = ar.fingers || 3;
    for (let i = 0; i < n; i++) {
      const a = a2 + (i - (n - 1) / 2) * 0.35;
      const cl = ar.claw || ar.w * 1.2;
      ctx.beginPath();
      ctx.moveTo(hx, hy - ar.w * 0.3);
      ctx.quadraticCurveTo(hx + Math.cos(a) * cl, hy + Math.sin(a) * cl - cl * 0.2, hx + Math.cos(a + 0.5) * cl * 1.1, hy + Math.sin(a + 0.5) * cl * 1.1);
      ctx.lineTo(hx + 1, hy + ar.w * 0.3);
      ctx.fill();
    }
  }

  function drawArmWing(ctx, d, sx, sy, ex, ey, hx, hy, ar) {
    // Pennaceous feathers trailing from the arm (raptors, Archaeopteryx)
    const col = d.colors.wing || d.colors.base;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const px = t < 0.5 ? U.lerp(sx, ex, t * 2) : U.lerp(ex, hx, (t - 0.5) * 2);
      const py = t < 0.5 ? U.lerp(sy, ey, t * 2) : U.lerp(ey, hy, (t - 0.5) * 2);
      const len = ar.wing * (0.45 + t * 0.6);
      const a = U.deg(115 - t * 40);
      ctx.fillStyle = i % 2 ? U.shade(col, -0.12) : col;
      ctx.beginPath();
      U.taperPath(ctx, [[px, py], [px + Math.cos(a) * len * 0.5, py + Math.sin(a) * len * 0.5], [px + Math.cos(a) * len, py + Math.sin(a) * len]], len * 0.22, len * 0.06);
      ctx.fill();
    }
    if (d.colors.wingBar) {
      ctx.strokeStyle = d.colors.wingBar; ctx.lineWidth = ar.w * 0.8;
      ctx.beginPath(); ctx.moveTo(ex, ey + ar.wing * 0.3); ctx.lineTo(hx, hy + ar.wing * 0.45); ctx.stroke();
    }
  }

  // Body features ------------------------------------------------------
  function drawSail(ctx, d, sk) {
    const t = torsoPts(d, sk).top;
    const h = d.sail.h;
    const col = d.colors.accent || d.colors.base;
    const x0 = -0.15 * sk.L, x1 = 1.0 * sk.L;
    const topAt = x => {
      // interpolate torso top line
      for (let i = 0; i < t.length - 1; i++) if (x >= t[i][0] && x <= t[i + 1][0]) return U.lerp(t[i][1], t[i + 1][1], (x - t[i][0]) / (t[i + 1][0] - t[i][0]));
      return t[0][1];
    };
    const prof = u => Math.pow(Math.sin(Math.PI * u), d.sail.shape || 0.9) * h;
    ctx.beginPath();
    const N = 24;
    for (let i = 0; i <= N; i++) { const u = i / N, x = U.lerp(x0, x1, u); const y = topAt(x) - prof(u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    for (let i = N; i >= 0; i--) { const u = i / N, x = U.lerp(x0, x1, u); ctx.lineTo(x, topAt(x) + 6); }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, topAt(sk.L * 0.4) - h, 0, topAt(sk.L * 0.4));
    g.addColorStop(0, U.shade(col, 0.15)); g.addColorStop(1, U.shade(col, -0.25));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = U.rgba(U.shade(col, -0.45), 0.6); ctx.lineWidth = 1.4;
    for (let i = 1; i < N; i++) { const u = i / N, x = U.lerp(x0, x1, u); ctx.beginPath(); ctx.moveTo(x, topAt(x)); ctx.lineTo(x - 2, topAt(x) - prof(u) + 2); ctx.stroke(); }
  }

  function drawPlates(ctx, d, sk, tailP, far) {
    const p = d.plates, col = d.colors.accent || d.colors.base;
    const t = torsoPts(d, sk).top;
    // positions along neck -> back -> tail with sizes peaking over the hips
    const spots = [];
    for (let i = t.length - 1; i >= 0; i--) spots.push(t[i]);
    for (let i = 1; i < 8; i++) spots.push(tailP[i]);
    const n = p.count || 14;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1);
      const f = u * (spots.length - 1);
      const i = Math.floor(f), r = f - i;
      const a = spots[i], b = spots[Math.min(spots.length - 1, i + 1)];
      const x = U.lerp(a[0], b[0], r) + (far ? 9 : 0), y = U.lerp(a[1], b[1], r) + 4;
      const size = p.h * (0.35 + 0.65 * Math.sin(Math.PI * Math.pow(u, 0.85)));
      if ((k % 2 === 0) === !!far) continue;
      ctx.fillStyle = far ? U.shade(col, -0.3) : col;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.4, y);
      ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.7, x + size * 0.05, y - size);
      ctx.quadraticCurveTo(x + size * 0.5, y - size * 0.6, x + size * 0.4, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + size * 0.02, y - size * 0.85); ctx.stroke();
      if (d.colors.plateEdge) { ctx.strokeStyle = d.colors.plateEdge; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - size * 0.42, y - size * 0.45); ctx.quadraticCurveTo(x - size * 0.3, y - size * 0.85, x + size * 0.05, y - size); ctx.quadraticCurveTo(x + size * 0.35, y - size * 0.75, x + size * 0.42, y - size * 0.45); ctx.stroke(); }
    }
  }

  function drawTailTip(ctx, d, tp) {
    const t = d.tail, n = tp.length - 1;
    const e = tp[n], p = tp[n - 2];
    const a = Math.atan2(e[1] - p[1], e[0] - p[0]);
    if (t.spikes) {
      ctx.fillStyle = d.colors.horn || '#d8ccb0';
      for (let i = 0; i < 4; i++) {
        const q = tp[n - 1 - (i % 2) * 2];
        const sa = a + (i < 2 ? -1 : 1) * (Math.PI / 2 + 0.6) * (i % 2 ? 1 : 0.85) * -1;
        const sl = t.spikes;
        ctx.beginPath();
        ctx.moveTo(q[0] - 3, q[1]); ctx.lineTo(q[0] + Math.cos(sa) * sl, q[1] + Math.sin(sa) * sl); ctx.lineTo(q[0] + 3, q[1]);
        ctx.closePath(); ctx.fill();
      }
    }
    if (t.club) {
      ctx.fillStyle = U.shade(d.colors.base, -0.15);
      U.ellipse(ctx, e[0], e[1], t.club, t.club * 0.7, a); ctx.fill();
      ctx.fillStyle = U.shade(d.colors.base, 0.1);
      U.ellipse(ctx, e[0] + Math.cos(a) * 3, e[1] - t.club * 0.2, t.club * 0.5, t.club * 0.3, a); ctx.fill();
    }
    if (t.vane) {
      ctx.fillStyle = d.colors.accent || '#a03020';
      ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(t.vane * 0.5, -t.vane * 0.55); ctx.lineTo(t.vane, 0); ctx.lineTo(t.vane * 0.5, t.vane * 0.55); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  function drawTailFeathers(ctx, d, tp) {
    const f = d.tailFeathers;
    const col = d.colors.wing || d.colors.base;
    for (let i = 3; i < tp.length; i++) {
      const p = tp[i], q = tp[Math.max(0, i - 1)];
      const a = Math.atan2(p[1] - q[1], p[0] - q[0]);
      const len = f * (0.35 + (i / tp.length) * 0.8);
      for (const s of [-1, 1]) {
        const fa = a + s * 0.32;
        ctx.fillStyle = s > 0 ? U.shade(col, -0.18) : col;
        ctx.beginPath();
        U.taperPath(ctx, [[p[0], p[1]], [p[0] + Math.cos(fa) * len * 0.55, p[1] + Math.sin(fa) * len * 0.55], [p[0] + Math.cos(fa) * len, p[1] + Math.sin(fa) * len]], len * 0.32, len * 0.16);
        ctx.fill();
      }
    }
  }

  function drawFluff(ctx, d, sk, tp, np) {
    // Downy filaments sticking out of the silhouette (feathered dinosaurs)
    const r = U.rng(U.hash(d.id + 'fluff'));
    const t = torsoPts(d, sk);
    const pts = [];
    const add = (a, b, n, side) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push([U.lerp(a[0], b[0], u), U.lerp(a[1], b[1], u), side]); } };
    for (let i = 0; i < t.top.length - 1; i++) add(t.top[i], t.top[i + 1], 6, -1);
    for (let i = 0; i < t.bot.length - 1; i++) add(t.bot[i], t.bot[i + 1], 6, 1);
    for (let i = 0; i < tp.length - 1; i++) { const w = U.lerp(d.tail.w, 3, i / tp.length) / 2; add([tp[i][0], tp[i][1] - w], [tp[i + 1][0], tp[i + 1][1] - w], 2, -1); add([tp[i][0], tp[i][1] + w], [tp[i + 1][0], tp[i + 1][1] + w], 2, 1); }
    for (let i = 0; i < np.length - 1; i++) { add([np[i][0] - 4, np[i][1] - d.neck.w * 0.4], [np[i + 1][0] - 4, np[i + 1][1] - d.neck.w * 0.4], 2, -1); }
    const len = d.fluff;
    for (const [x, y, side] of pts) {
      // filaments lean backwards along the body, like ruffled down
      const a = Math.PI * 0.5 * side + (side < 0 ? -0.9 : 0.9) * -1 + Math.PI * 0.35 * (side < 0 ? -1 : 1) + (r() - 0.5) * 0.6;
      const l = len * (0.45 + r() * 0.45);
      const ex = x + Math.cos(a) * l - l * 0.35, ey = y + Math.sin(a) * l * 0.8;
      ctx.beginPath();
      U.taperPath(ctx, [[x + 2, y - side * 3], [U.lerp(x, ex, 0.5), U.lerp(y, ey, 0.5) - side * 1], [ex, ey]], len * 0.75, 1.2);
      ctx.fill();
    }
  }

  function drawArmor(ctx, d, sk, tp) {
    const t = torsoPts(d, sk).top;
    const col = d.colors.armor || U.shade(d.colors.base, -0.2);
    const r = U.rng(U.hash(d.id + 'arm'));
    ctx.save();
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < t.length - 1; i++) {
        for (let k = 0; k < 4; k++) {
          const u = k / 4;
          const x = U.lerp(t[i][0], t[i + 1][0], u), y = U.lerp(t[i][1], t[i + 1][1], u) + 6 + row * sk.D * 0.17;
          const s = sk.D * (0.09 - row * 0.015) * (0.8 + r() * 0.4);
          ctx.fillStyle = col; U.ellipse(ctx, x, y, s * 1.2, s * 0.8, 0); ctx.fill();
          ctx.fillStyle = 'rgba(255,240,210,0.35)'; U.ellipse(ctx, x - s * 0.3, y - s * 0.3, s * 0.5, s * 0.3, 0); ctx.fill();
        }
      }
    }
    // side spikes along the flank
    if (d.armor.spikes) {
      ctx.fillStyle = d.colors.horn || '#cfc2a0';
      const b = torsoPts(d, sk).bot;
      for (let i = 1; i < 4; i++) {
        const x = U.lerp(b[i][0], b[i + 1][0], 0.5), y = U.lerp(b[i][1], b[i + 1][1], 0.5) - sk.D * 0.35;
        ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 2, y + d.armor.spikes); ctx.lineTo(x + 6, y); ctx.fill();
      }
    }
    // tail osteoderms
    for (let i = 1; i < tp.length - 2; i += 2) {
      const w = U.lerp(d.tail.w, 4, i / tp.length) / 2;
      ctx.fillStyle = col; U.ellipse(ctx, tp[i][0], tp[i][1] - w * 0.6, w * 0.5, w * 0.35, 0); ctx.fill();
    }
    ctx.restore();
  }

  function drawScutes(ctx, d, sk, tp) {
    // a ridge of small bony bumps along the back (crocodile-line archosaurs, Ceratosaurus)
    const t = torsoPts(d, sk).top;
    ctx.fillStyle = U.shade(d.colors.base, -0.25);
    for (let i = 0; i < t.length - 1; i++) for (let k = 0; k < 4; k++) {
      const u = k / 4, x = U.lerp(t[i][0], t[i + 1][0], u), y = U.lerp(t[i][1], t[i + 1][1], u);
      ctx.beginPath(); ctx.moveTo(x - 4, y + 3); ctx.lineTo(x, y - d.scutes); ctx.lineTo(x + 4, y + 3); ctx.fill();
    }
    for (let i = 1; i < tp.length - 3; i++) {
      const w = U.lerp(d.tail.w, 3, i / tp.length) / 2;
      ctx.beginPath(); ctx.moveTo(tp[i][0] - 3, tp[i][1] - w + 2); ctx.lineTo(tp[i][0], tp[i][1] - w - d.scutes * 0.8); ctx.lineTo(tp[i][0] + 3, tp[i][1] - w + 2); ctx.fill();
    }
  }

  // Head features -------------------------------------------------------
  function drawFrill(ctx, h, col) {
    const f = h.frill, L = h.len, H = h.h;
    ctx.save();
    ctx.fillStyle = col.frill || U.shade(col.base, -0.1);
    ctx.beginPath();
    const cx = L * 0.15, cy = -H * 0.35;
    const R = H * f.size;
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const a = U.deg(195) + (i / 18) * U.deg(f.sweep || 150);
      const rr = R * (1 + (i % 2 ? 0.06 : 0));
      pts.push([cx + Math.cos(a) * rr * 0.95, cy + Math.sin(a) * rr]);
    }
    ctx.moveTo(L * 0.35, -H * 0.1);
    pts.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(L * 0.3, H * 0.25);
    ctx.closePath();
    ctx.fill();
    // epoccipitals (little bony points around the edge)
    if (f.points) {
      ctx.fillStyle = U.shade(col.frill || col.base, -0.3);
      for (let i = 1; i < pts.length; i += 2) { U.ellipse(ctx, pts[i][0], pts[i][1], 3.5, 3.5, 0); ctx.fill(); }
    }
    if (f.fenestra) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      U.ellipse(ctx, cx - R * 0.35, cy - R * 0.35, R * 0.22, R * 0.3, 0.5); ctx.fill();
    }
    if (col.frillSpots) {
      ctx.fillStyle = col.frillSpots;
      U.ellipse(ctx, cx - R * 0.45, cy - R * 0.5, R * 0.16, R * 0.16, 0); ctx.fill();
      U.ellipse(ctx, cx - R * 0.15, cy - R * 0.75, R * 0.12, R * 0.12, 0); ctx.fill();
    }
    ctx.restore();
  }

  function drawHornsD(ctx, h, col) {
    const hn = h.horns, L = h.len, H = h.h;
    const horn = (x, y, a, len, w, far) => {
      const pts = U.bezierPts([x, y], [x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5 - len * 0.08], [x + Math.cos(a + 0.25) * len, y + Math.sin(a + 0.25) * len], null, 8);
      const g = ctx.createLinearGradient(x, y, pts[8][0], pts[8][1]);
      g.addColorStop(0, far ? U.shade(col.horn || '#d8ccb0', -0.35) : (col.horn || '#d8ccb0')); g.addColorStop(1, '#3a3026');
      ctx.fillStyle = g;
      U.taperPath(ctx, pts, w, 1); ctx.fill();
    };
    if (hn.brow) { horn(L * 0.33, -H * 0.42, -U.deg(70), hn.brow, H * 0.16, true); horn(L * 0.37, -H * 0.45, -U.deg(65), hn.brow, H * 0.18); }
    if (hn.nose) horn(L * 0.78, -H * 0.25, -U.deg(85), hn.nose, H * 0.15);
    if (hn.small) { horn(L * 0.42, -H * 0.42, -U.deg(95), hn.small, H * 0.12); }
    if (hn.cheek) horn(L * 0.2, H * 0.25, U.deg(130), hn.cheek, H * 0.14);
  }

  function drawCrest(ctx, h, col) {
    const c = h.crest, L = h.len, H = h.h;
    ctx.fillStyle = col.crest || col.accent || U.shade(col.base, 0.1);
    ctx.beginPath();
    if (c.type === 'comb') {
      ctx.moveTo(L * 0.15, -H * 0.45);
      ctx.quadraticCurveTo(L * 0.3, -H * (0.5 + c.size), L * 0.5, -H * 0.48);
      ctx.closePath();
    } else if (c.type === 'tall') {
      // Oviraptorid crest rising from the snout
      ctx.moveTo(L * 0.3, -H * 0.45);
      ctx.quadraticCurveTo(L * 0.35, -H * (0.6 + c.size), L * 0.62, -H * (0.55 + c.size * 0.9));
      ctx.quadraticCurveTo(L * 0.85, -H * (0.4 + c.size * 0.4), L * 0.88, -H * 0.3);
      ctx.closePath();
    } else if (c.type === 'nasal') {
      // Ceratosaurus blade-like nose horn + low brow ridges
      ctx.moveTo(L * 0.62, -H * 0.38);
      ctx.quadraticCurveTo(L * 0.7, -H * (0.45 + c.size), L * 0.8, -H * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(L * 0.25, -H * 0.48); ctx.lineTo(L * 0.32, -H * (0.6 + c.size * 0.3)); ctx.lineTo(L * 0.4, -H * 0.48);
    } else if (c.type === 'brow') {
      // Allosaurus' small horns in front of the eyes
      ctx.moveTo(L * 0.4, -H * 0.45); ctx.lineTo(L * 0.45, -H * (0.5 + c.size)); ctx.lineTo(L * 0.55, -H * 0.43);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(L * 0.6, -H * 0.38); ctx.quadraticCurveTo(L * 0.75, -H * (0.42 + c.size * 0.4), L * 0.85, -H * 0.3);
    } else if (c.type === 'pteranodon') {
      ctx.moveTo(L * 0.05, -H * 0.3);
      ctx.lineTo(-L * c.size, -H * 0.9);
      ctx.lineTo(L * 0.25, -H * 0.45);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawDome(ctx, h, col) {
    const L = h.len, H = h.h;
    const g = ctx.createRadialGradient(L * 0.25, -H * 0.85, 2, L * 0.3, -H * 0.6, H * 0.6);
    g.addColorStop(0, U.shade(col.dome || col.base, 0.3)); g.addColorStop(1, U.shade(col.dome || col.base, -0.2));
    ctx.fillStyle = g;
    U.ellipse(ctx, L * 0.3, -H * 0.5, L * 0.3, H * 0.45, 0); ctx.fill();
    ctx.fillStyle = U.shade(col.base, -0.3);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + i * 0.22;
      U.ellipse(ctx, L * 0.3 + Math.cos(a) * L * 0.31, -H * 0.5 + Math.sin(a) * H * 0.42 + H * 0.12, 3, 3, 0); ctx.fill();
    }
    for (let i = 0; i < 4; i++) { U.ellipse(ctx, L * (0.7 + i * 0.07), -H * (0.28 - i * 0.02), 2.4, 2.4, 0); ctx.fill(); }
  }

  function drawHeadDetails(ctx, d, h, col) {
    const L = h.len, H = h.h;
    const hp = headPts(h);
    const sh = h.snoutH !== undefined ? h.snoutH : 0.45;
    const mouthY = h.mouthY !== undefined ? h.mouthY * H : H * 0.12;
    // Mouth line
    ctx.strokeStyle = 'rgba(30,18,10,0.7)'; ctx.lineWidth = Math.max(1, H * 0.04);
    ctx.beginPath(); ctx.moveTo(L * 0.99, mouthY * (sh + 0.2)); ctx.quadraticCurveTo(L * 0.7, mouthY, L * (h.gape || 0.42), mouthY * 1.4); ctx.stroke();
    // Teeth
    if (h.teeth) {
      ctx.fillStyle = col.teeth || '#f4ecd8';
      const n = h.teethN || 9;
      const tl = h.teeth;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const x = U.lerp(L * 0.95, L * (h.gape || 0.42) + 6, u);
        const y = U.lerp(mouthY * (sh + 0.2), mouthY * 1.3, u * u);
        const len = tl * (0.6 + 0.4 * Math.sin(Math.PI * (0.3 + u * 0.7)));
        ctx.beginPath(); ctx.moveTo(x - tl * 0.25, y - 1); ctx.lineTo(x + (h.teethFwd ? tl * 0.2 : 0), y + len); ctx.lineTo(x + tl * 0.25, y - 1); ctx.fill();
      }
    }
    // Beak
    if (h.beak) {
      ctx.fillStyle = col.beak || '#3a332a';
      ctx.beginPath();
      const bx = L * (1 - h.beak);
      const topEnd = hp.top[hp.top.length - 1], botEnd = hp.bot[0];
      ctx.moveTo(bx, -H * sh * 0.55 - 1);
      if (h.hook) {
        ctx.quadraticCurveTo(L * 1.02, topEnd[1] - 2, L * 1.04, topEnd[1] + H * 0.35);
        ctx.quadraticCurveTo(L * 0.96, mouthY * 0.8, bx, mouthY * 0.9);
      } else if (h.duck) {
        ctx.quadraticCurveTo(L * 1.06, topEnd[1], L * 1.06, (topEnd[1] + botEnd[1]) / 2);
        ctx.quadraticCurveTo(L * 1.04, botEnd[1] + 2, bx, botEnd[1] + 1);
      } else {
        ctx.lineTo(L * 1.02, (topEnd[1] + botEnd[1]) / 2);
        ctx.lineTo(bx, mouthY * 0.9);
      }
      ctx.closePath();
      ctx.fill();
      if (h.lowerBeak) { ctx.beginPath(); ctx.moveTo(bx, mouthY); ctx.lineTo(L * 0.95, mouthY * 1.1); ctx.lineTo(bx, botEnd[1]); ctx.fill(); }
    }
    // Nostril
    ctx.fillStyle = 'rgba(20,10,5,0.7)';
    U.ellipse(ctx, L * (h.nostrilX || 0.88), -H * sh * 0.35, H * 0.05, H * 0.03, -0.3); ctx.fill();
    // Brow ridge + eye
    const ex = L * (h.eyeX || 0.3), ey = -H * (h.eyeY || 0.18);
    if (h.browRidge !== false) {
      ctx.fillStyle = U.shade(col.head || col.base, -0.25);
      U.ellipse(ctx, ex + 1, ey - H * 0.09, H * 0.14, H * 0.05, -0.1); ctx.fill();
    }
    drawEye(ctx, ex, ey, h.eyeR || H * 0.07, col.eye || '#c9a032', { slit: !!h.slitEye, round: true, rim: '#1a120a' });
    if (h.mask) {
      ctx.fillStyle = U.rgba(h.mask, 0.85);
      ctx.beginPath(); ctx.ellipse(ex, ey, H * 0.2, H * 0.11, -0.1, 0, U.TAU); ctx.fill();
      drawEye(ctx, ex, ey, h.eyeR || H * 0.07, col.eye || '#c9a032', { round: true, rim: '#111' });
    }
  }

  S.renderDino = function (d, phase, anim, scale) {
    const box = dinoBox(d);
    const sk = dinoSkeleton(d, phase, anim);
    const col = d.colors;
    const legs = sk.biped ? bipedLegs(d, sk, phase, anim) : quadLegs(d, sk, phase, anim);
    const tp = tailPts(d, sk, phase, anim);
    const nk = neckPts(d, sk);
    const ht = headTransform(d, sk, nk.end);
    const legCol = col.legs || col.base;

    // ---- far layer ----
    const far = makeLayer(box, scale);
    const fc = far.ctx;
    for (const lg of legs) if (!lg.near) (sk.biped ? drawBipedLeg : drawQuadLeg)(fc, d, lg, legCol);
    if (sk.biped) drawArm(fc, d, sk, phase, anim, false, legCol);
    if (d.plates) drawPlates(fc, d, sk, tp, true);
    finishSurface(far, box, d, { top: sk.hY - d.depth, bottom: 0, darken: 0.3, texture: d.texture || 'scales' });

    // ---- main layer ----
    const main = makeLayer(box, scale);
    const m = main.ctx;
    if (d.sail) drawSail(m, d, sk);
    if (d.plates) drawPlates(m, d, sk, tp, false);
    if (d.fluff) { m.fillStyle = col.base; drawFluff(m, d, sk, tp, nk.pts); }
    if (d.tailFeathers) drawTailFeathers(m, d, tp);
    m.fillStyle = col.tail || col.base;
    U.taperPath(m, tp, d.tail.w, d.tail.tip || 3); m.fill();
    m.fillStyle = col.base;
    torsoPath(m, d, sk); m.fill();
    U.taperPath(m, nk.pts, nk.nk.w, Math.max(d.head.h * 0.75, nk.nk.w * 0.5)); m.fill();
    // countershading on torso, neck and tail
    if (col.belly) {
      m.save();
      m.globalCompositeOperation = 'source-atop';
      const by = sk.hY + d.depth * 0.45, bh = d.depth * 0.5;
      const g = m.createLinearGradient(0, by - bh, 0, by + bh * 0.2);
      g.addColorStop(0, U.rgba(col.belly, 0)); g.addColorStop(0.75, U.rgba(col.belly, 0.9)); g.addColorStop(1, U.rgba(col.belly, 1));
      m.fillStyle = g; m.fillRect(-box.ox, by - bh, box.w, bh * 2.2);
      m.restore();
    }
    for (const lg of legs) if (lg.near) (sk.biped ? drawBipedLeg : drawQuadLeg)(m, d, lg, legCol);
    // head (frill behind it)
    m.save();
    m.translate(ht.x, ht.y); m.rotate(ht.a);
    if (d.head.frill) drawFrill(m, d.head, col);
    m.fillStyle = col.head || col.base;
    const hp = headPts(d.head);
    m.beginPath(); U.smoothPath(m, hp.all, true, 0.7); m.fill();
    if (d.head.dome) drawDome(m, d.head, col);
    m.restore();
    if (sk.biped) drawArm(m, d, sk, phase, anim, true, legCol);
    finishSurface(main, box, d, { top: sk.hY - d.depth - (d.neck ? d.neck.len * 0.5 : 0), bottom: 0, texture: d.texture || 'scales' });

    // ---- detail pass ----
    if (d.armor) drawArmor(m, d, sk, tp);
    if (d.scutes) drawScutes(m, d, sk, tp);
    drawTailTip(m, d, tp);
    if (d.tailRings) {
      m.strokeStyle = d.tailRings; m.lineCap = 'round';
      for (let i = 3; i < tp.length - 1; i += 2) {
        const w = U.lerp(d.tail.w, d.tail.tip || 3, i / (tp.length - 1)) / 2;
        const a = Math.atan2(tp[i + 1][1] - tp[i][1], tp[i + 1][0] - tp[i][0]) + Math.PI / 2;
        m.lineWidth = Math.max(2, w * 0.7);
        m.beginPath(); m.moveTo(tp[i][0] + Math.cos(a) * w, tp[i][1] + Math.sin(a) * w); m.lineTo(tp[i][0] - Math.cos(a) * w, tp[i][1] - Math.sin(a) * w); m.stroke();
      }
    }
    if (d.quills) {
      m.strokeStyle = U.shade(col.base, -0.3); m.lineWidth = 1.2;
      for (let i = 2; i < 9; i++) { const p = tp[i], w = U.lerp(d.tail.w, 3, i / tp.length) / 2; m.beginPath(); m.moveTo(p[0], p[1] - w); m.lineTo(p[0] - 2, p[1] - w - d.quills); m.stroke(); }
    }
    m.save();
    m.translate(ht.x, ht.y); m.rotate(ht.a);
    if (d.head.crest) drawCrest(m, d.head, col);
    if (d.head.horns) drawHornsD(m, d.head, col);
    drawHeadDetails(m, d, d.head, col);
    m.restore();

    const out = U.canvas(main.c.width, main.c.height);
    const o = out.getContext('2d');
    o.drawImage(far.c, 0, 0);
    o.drawImage(main.c, 0, 0);
    return { canvas: out, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // PTEROSAUR
  // ===================================================================
  S.renderPterosaur = function (p, phase, anim, scale) {
    const s = p.size, span = p.span * s;
    const box = { w: span * 1.25 + s * 4, h: span * 1.25 + s * 3, ox: span * 0.6 + s * 1.5, oy: span * 0.8 + s * 2 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = p.colors;
    const flying = anim.flying;
    const flap = Math.sin(phase * U.TAU);
    const by = flying ? -s * 2.2 + flap * s * 0.15 : -s * 1.15;
    const bodyA = flying ? 0 : -0.45;
    const membrane = col.membrane || U.shade(col.base, -0.15);

    const wing = (far) => {
      ctx.save();
      ctx.translate(s * 0.25, by - s * 0.15);
      if (flying) {
        const ang = -Math.PI / 2 + (flap * 0.95 - 0.15) * (far ? -0.55 : 1) - 0.05;
        ctx.scale(1, far ? 0.8 : 1);
        ctx.rotate(ang);
        const g = ctx.createLinearGradient(0, 0, span * 0.5, 0);
        g.addColorStop(0, U.rgba(far ? U.shade(membrane, -0.3) : membrane, 0.95)); g.addColorStop(1, U.rgba(far ? U.shade(membrane, -0.3) : membrane, 0.8));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.12);
        ctx.lineTo(span * 0.18, -s * 0.2);                 // elbow
        ctx.lineTo(span * 0.28, -s * 0.12);                // wrist
        ctx.quadraticCurveTo(span * 0.42, -s * 0.06, span * 0.55, s * 0.12);   // wing-finger tip
        ctx.quadraticCurveTo(span * 0.3, s * 0.3, span * 0.12, s * 0.55);     // trailing edge
        ctx.quadraticCurveTo(span * 0.05, s * 0.55, -s * 0.2, s * 0.4);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = far ? U.shade(col.base, -0.45) : U.shade(col.base, -0.2); ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -s * 0.12); ctx.lineTo(span * 0.18, -s * 0.2); ctx.lineTo(span * 0.28, -s * 0.12); ctx.quadraticCurveTo(span * 0.42, -s * 0.06, span * 0.55, s * 0.12); ctx.stroke();
        // actinofibrils
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
        for (let i = 1; i < 8; i++) { const t = i / 8; ctx.beginPath(); ctx.moveTo(span * (0.05 + t * 0.45), -s * 0.1); ctx.lineTo(span * (0.02 + t * 0.32), s * 0.4); ctx.stroke(); }
      } else {
        // folded wing: forelimb used as a front leg, wing finger folded back
        const step = anim.moving ? Math.sin(phase * U.TAU + (far ? Math.PI : 0)) * 0.25 : 0;
        ctx.rotate(U.deg(70) + step);
        ctx.fillStyle = far ? U.shade(membrane, -0.3) : membrane;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 1.2, s * 0.15); ctx.lineTo(s * 0.6, -s * 0.5); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = far ? U.shade(col.base, -0.45) : U.shade(col.base, -0.15); ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.7, s * 0.1); ctx.lineTo(s * 1.35, 0); ctx.stroke();
        ctx.lineWidth = s * 0.07;
        ctx.beginPath(); ctx.moveTo(s * 1.35, 0); ctx.lineTo(s * 0.5, -s * 0.55); ctx.stroke();
      }
      ctx.restore();
    };
    if (flying) wing(true); else wing(true);

    // hind legs
    ctx.strokeStyle = U.shade(col.base, -0.2); ctx.lineCap = 'round'; ctx.lineWidth = s * 0.1;
    if (flying) {
      ctx.beginPath(); ctx.moveTo(-s * 0.4, by + s * 0.1); ctx.lineTo(-s * 0.95, by + s * 0.3); ctx.stroke();
    } else {
      const step = anim.moving ? Math.sin(phase * U.TAU) * s * 0.2 : 0;
      ctx.beginPath(); ctx.moveTo(-s * 0.35, by + s * 0.15); ctx.lineTo(-s * 0.3 + step, -s * 0.45); ctx.lineTo(-s * 0.2 + step, 0); ctx.stroke();
    }
    ctx.save();
    ctx.translate(0, by); ctx.rotate(bodyA);
    // tail
    if (p.tail) {
      ctx.strokeStyle = col.base; ctx.lineWidth = s * 0.08;
      const tl = p.tail * s;
      ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.quadraticCurveTo(-s * 0.4 - tl * 0.5, s * 0.1, -s * 0.4 - tl, -s * 0.05); ctx.stroke();
      if (p.vane) { ctx.fillStyle = col.accent || '#a03a2a'; ctx.save(); ctx.translate(-s * 0.4 - tl, -s * 0.05); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.2, -s * 0.18); ctx.lineTo(-s * 0.4, 0); ctx.lineTo(-s * 0.2, s * 0.18); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    // body
    ctx.fillStyle = col.base;
    U.ellipse(ctx, 0, 0, s * 0.55, s * 0.28, 0); ctx.fill();
    // neck + head
    const na = flying ? -0.35 : -0.9;
    const nx = s * 0.45 + Math.cos(na) * s * (p.neck || 0.6), ny = Math.sin(na) * s * (p.neck || 0.6);
    U.taperPath(ctx, [[s * 0.35, -s * 0.05], [nx, ny]], s * 0.25, s * 0.16); ctx.fill();
    ctx.restore();
    finishSurface(lay, box, p, { top: by - s, bottom: by + s * 0.5, texture: p.fuzz ? 'fur' : 'smooth' });
    // head (detail, after shading so it stays crisp)
    ctx.save();
    ctx.translate(0, by); ctx.rotate(bodyA);
    ctx.translate(nx, ny);
    ctx.rotate(flying ? 0.15 : 0.75);
    const hl = s * p.headLen, hh = s * 0.22;
    if (p.crest) {
      ctx.fillStyle = col.accent || col.base;
      ctx.beginPath(); ctx.moveTo(hl * 0.05, -hh * 0.2); ctx.quadraticCurveTo(-hl * p.crest * 0.3, -hh * 1.4, -hl * p.crest * 0.55, -hh * 1.9); ctx.quadraticCurveTo(-hl * p.crest * 0.15, -hh * 0.9, hl * 0.35, -hh * 0.45); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = col.head || col.base;
    ctx.beginPath();
    ctx.moveTo(-hh * 0.4, -hh * 0.4);
    ctx.quadraticCurveTo(hl * 0.3, -hh * 0.7, hl, -hh * 0.05);
    ctx.lineTo(hl, hh * 0.05);
    ctx.quadraticCurveTo(hl * 0.3, hh * 0.6, -hh * 0.4, hh * 0.45);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hl * 0.98, 0); ctx.lineTo(hl * 0.25, hh * 0.15); ctx.stroke();
    if (p.teeth) {
      ctx.fillStyle = '#f4ecd8';
      for (let i = 0; i < 7; i++) { const x = hl * (0.35 + i * 0.09); ctx.beginPath(); ctx.moveTo(x, hh * 0.1); ctx.lineTo(x + 3, hh * 0.45); ctx.lineTo(x + 2, hh * 0.08); ctx.fill(); }
    }
    drawEye(ctx, hl * 0.12, -hh * 0.15, hh * 0.22, col.eye || '#d4a02a', { round: true, rim: '#1a120a' });
    ctx.restore();
    if (flying || !flying) wing(false);
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // MARINE REPTILES (plesiosaurs, mosasaurs)
  // ===================================================================
  S.renderMarine = function (mr, phase, anim, scale) {
    const L = mr.len, H = mr.h;
    const plesio = mr.form === 'plesio';
    const neckL = plesio ? mr.neck || L * 0.8 : 0;
    const tailL = plesio ? L * 0.35 : L * 0.7;
    const box = { w: L + neckL + tailL + mr.headLen * 2 + 80, h: H * 3.5 + (plesio ? neckL * 0.5 : 0), ox: L * 0.5 + tailL + 40, oy: H * 1.8 + (plesio ? neckL * 0.5 : 0) };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = mr.colors;
    const stroke = Math.sin(phase * U.TAU);
    const flipper = (x, y, len, w, a, far) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = far ? U.shade(col.base, -0.35) : U.shade(col.base, -0.1);
      ctx.beginPath(); ctx.moveTo(0, -w * 0.5); ctx.quadraticCurveTo(len * 0.6, -w * 0.6, len, 0); ctx.quadraticCurveTo(len * 0.5, w * 0.5, 0, w * 0.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    const fl = plesio ? H * 1.3 : H * 0.6;
    // far flippers
    flipper(L * 0.25, H * 0.1, fl, H * 0.3, Math.PI * 0.75 - stroke * 0.5, true);
    flipper(-L * 0.3, H * 0.1, fl * 0.85, H * 0.28, Math.PI * 0.8 - stroke * 0.45, true);
    // tail
    const tpts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      tpts.push([-L * 0.45 - t * tailL, Math.sin(phase * U.TAU - t * 2.5) * (plesio ? 3 : H * 0.18) * t]);
    }
    ctx.fillStyle = col.base;
    U.taperPath(ctx, tpts, H * 0.7, plesio ? 2 : H * 0.12); ctx.fill();
    if (!plesio) {
      // mosasaur's downturned crescent tail fluke
      const e = tpts[12], q = tpts[9];
      ctx.beginPath();
      ctx.moveTo(q[0], q[1] - H * 0.05);
      ctx.quadraticCurveTo(e[0] - H * 0.2, e[1] - H * 0.2, e[0] - H * 0.35, e[1] - H * 0.25);
      ctx.quadraticCurveTo(e[0] - H * 0.1, e[1] + H * 0.1, e[0] - H * 0.4, e[1] + H * 0.7);
      ctx.quadraticCurveTo(e[0] + H * 0.4, e[1] + H * 0.25, q[0] + H * 0.2, q[1] + H * 0.12);
      ctx.fill();
    }
    // body
    ctx.beginPath();
    U.smoothPath(ctx, [[L * 0.55, -H * 0.1], [L * 0.2, -H * 0.5], [-L * 0.3, -H * 0.45], [-L * 0.55, -H * 0.15], [-L * 0.55, H * 0.2], [-L * 0.2, H * 0.48], [L * 0.3, H * 0.4]], true, 0.85);
    ctx.fill();
    // neck & head
    let hx, hy, ha;
    if (plesio) {
      const npts = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        npts.push([L * 0.45 + t * neckL * 0.95, -H * 0.05 - Math.sin(t * Math.PI * 0.5) * neckL * 0.25 + Math.sin(phase * U.TAU + t * 3) * 4 * t]);
      }
      U.taperPath(ctx, npts, H * 0.6, H * 0.22); ctx.fill();
      [hx, hy] = npts[14]; ha = 0.08;
    } else {
      hx = L * 0.5; hy = -H * 0.05; ha = 0.04;
    }
    const hl = mr.headLen, hh = plesio ? H * 0.28 : H * 0.62;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(ha);
    ctx.beginPath();
    ctx.moveTo(-hh * 0.3, -hh * 0.45);
    ctx.quadraticCurveTo(hl * 0.4, -hh * 0.65, hl, -hh * 0.05);
    ctx.lineTo(hl * 0.98, hh * 0.12);
    ctx.quadraticCurveTo(hl * 0.4, hh * 0.55, -hh * 0.3, hh * 0.45);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // countershading
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createLinearGradient(0, -H * 0.5, 0, H * 0.5);
    g.addColorStop(0, col.back || U.shade(col.base, -0.25)); g.addColorStop(0.5, U.rgba(col.base, 0)); g.addColorStop(0.7, U.rgba(col.belly || '#e8e4d8', 0.7)); g.addColorStop(1, col.belly || '#e8e4d8');
    ctx.fillStyle = g; ctx.fillRect(-box.ox, -H, box.w, H * 2);
    ctx.restore();
    finishSurface(lay, box, mr, { top: -H * 0.6, bottom: H * 0.6, texture: 'scales' });
    // near flippers
    flipper(L * 0.28, H * 0.25, fl, H * 0.32, Math.PI * 0.62 + stroke * 0.55, false);
    flipper(-L * 0.28, H * 0.25, fl * 0.85, H * 0.3, Math.PI * 0.7 + stroke * 0.5, false);
    // face
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(ha);
    ctx.strokeStyle = 'rgba(20,10,5,0.6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(hl * 0.98, hh * 0.05); ctx.lineTo(hl * 0.1, hh * 0.15); ctx.stroke();
    ctx.fillStyle = '#f4ecd8';
    const nT = plesio ? 6 : 10;
    for (let i = 0; i < nT; i++) { const x = hl * (0.25 + i * 0.7 / nT); ctx.beginPath(); ctx.moveTo(x, hh * 0.06); ctx.lineTo(x + 2, hh * (plesio ? 0.35 : 0.25)); ctx.lineTo(x + 4, hh * 0.08); ctx.fill(); }
    drawEye(ctx, hl * 0.25, -hh * 0.18, Math.max(2.5, hh * 0.13), col.eye || '#d9b040', { round: true, rim: '#111' });
    ctx.restore();
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // AMMONITE
  // ===================================================================
  S.renderAmmonite = function (a, phase, anim, scale) {
    const s = a.size;
    const box = { w: s * 4, h: s * 3, ox: s * 2, oy: s * 1.5 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = a.colors;
    const pulse = Math.sin(phase * U.TAU);
    // tentacles out of the shell opening (pointing forward/down)
    ctx.strokeStyle = col.body || '#c97a5a'; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      ctx.lineWidth = s * 0.07;
      const a0 = 0.1 + i * 0.12 + pulse * 0.05;
      ctx.beginPath(); ctx.moveTo(s * 0.7, s * 0.35);
      ctx.quadraticCurveTo(s * 1.1, s * 0.4 + i * 2, s * (1.2 + Math.cos(a0) * 0.4), s * (0.5 + Math.sin(a0) * 0.5) + Math.sin(phase * U.TAU + i) * 2);
      ctx.stroke();
    }
    // coiled shell
    const g = ctx.createRadialGradient(-s * 0.2, -s * 0.2, s * 0.1, 0, 0, s);
    g.addColorStop(0, U.shade(col.shell, 0.35)); g.addColorStop(1, U.shade(col.shell, -0.3));
    ctx.fillStyle = g;
    U.ellipse(ctx, 0, 0, s * 0.95, s * 0.95, 0); ctx.fill();
    ctx.strokeStyle = U.rgba(U.shade(col.shell, -0.5), 0.6); ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 6; t += 0.1) { const r = s * 0.95 * Math.exp(-t * 0.16); const x = Math.cos(t) * r, y = Math.sin(t) * r; t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    // ribs
    for (let i = 0; i < 28; i++) {
      const t = i * 0.35, r = s * 0.95 * Math.exp(-t * 0.16), r2 = r * 0.82;
      ctx.beginPath(); ctx.moveTo(Math.cos(t) * r, Math.sin(t) * r); ctx.lineTo(Math.cos(t) * r2, Math.sin(t) * r2); ctx.stroke();
    }
    if (col.bands) { ctx.strokeStyle = col.bands; ctx.lineWidth = s * 0.12; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(0, 0, s * 0.9, i * 1.2, i * 1.2 + 0.3); ctx.stroke(); } }
    drawEye(ctx, s * 0.78, s * 0.2, s * 0.09, '#1a1a1a', { round: true });
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // Extra small critters (lizard, dragonfly) & prehistoric plants as food
  // ===================================================================
  const baseBug = S.renderBug;
  S.renderBug = function (b, phase, anim, scale) {
    if (b.bugKind === 'lizard') {
      const s = b.size;
      const box = { w: s * 6, h: s * 2.5, ox: s * 3, oy: s * 1.8 };
      const lay = makeLayer(box, scale);
      const ctx = lay.ctx, col = b.colors;
      const w = Math.sin(phase * U.TAU * 2);
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([U.lerp(-s * 2.6, s * 1.4, t), -s * 0.3 + Math.sin(t * 5 - phase * U.TAU * 2) * s * 0.15 * (1 - t)]); }
      ctx.strokeStyle = U.shade(col.body, -0.2); ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
      for (const [x, sd] of [[s * 0.6, 1], [-s * 0.5, -1]]) {
        ctx.beginPath(); ctx.moveTo(x, -s * 0.3); ctx.lineTo(x + w * sd * s * 0.3, -s * 0.05); ctx.lineTo(x + s * 0.3 + w * sd * s * 0.3, 0); ctx.stroke();
      }
      ctx.fillStyle = col.body;
      U.taperPath(ctx, pts, s * 0.08, s * 0.5); ctx.fill();
      U.ellipse(ctx, s * 1.45, -s * 0.32, s * 0.35, s * 0.24, 0); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = U.shade(col.body, 0.25); ctx.fillRect(-s * 3, -s * 0.2, s * 6, s); ctx.restore();
      drawEye(ctx, s * 1.55, -s * 0.38, s * 0.08, '#1a1a1a', { round: true });
      return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
    }
    if (b.bugKind === 'dragonfly') {
      const s = b.size;
      const box = { w: s * 5, h: s * 4, ox: s * 2.5, oy: s * 2.4 };
      const lay = makeLayer(box, scale);
      const ctx = lay.ctx, col = b.colors;
      const f = Math.sin(phase * U.TAU * 4);
      ctx.fillStyle = 'rgba(210,235,255,0.55)';
      for (const [x, k] of [[s * 0.2, 1], [-s * 0.15, 0.9]]) {
        ctx.save(); ctx.translate(x, -s * 1.1); ctx.rotate(-Math.PI / 2 + f * 0.5);
        U.ellipse(ctx, s * 0.8 * k, 0, s * 0.85 * k, s * 0.16, 0); ctx.fill(); ctx.restore();
      }
      ctx.strokeStyle = col.body; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 1.0); ctx.lineTo(-s * 1.8, -s * 1.05); ctx.stroke();
      ctx.fillStyle = col.body; U.ellipse(ctx, s * 0.55, -s * 1.0, s * 0.2, s * 0.18, 0); ctx.fill();
      ctx.fillStyle = '#1a3a4a'; U.ellipse(ctx, s * 0.68, -s * 1.03, s * 0.12, s * 0.12, 0); ctx.fill();
      return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
    }
    return baseBug(b, phase, anim, scale);
  };

  // Prehistoric plants (no grass, no fruit trees, no berries: those came later!)
  const baseFood = S.renderFood;
  S.renderFood = function (f, phase, anim, scale) {
    const s = f.size;
    const kinds = ['fern', 'cycad', 'horsetail', 'ginkgo', 'araucaria', 'magnolia', 'seedfern', 'palmetto', 'jelly', 'shrimp'];
    if (!kinds.includes(f.foodKind)) return baseFood(f, phase, anim, scale);
    const box = { w: s * 3.4, h: s * 3.4, ox: s * 1.7, oy: s * 2.6 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx;
    const sway = Math.sin(phase * U.TAU) * 0.08;
    const r = U.rng(U.hash(f.id));
    switch (f.foodKind) {
      case 'fern': {
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i - 2.5) * 0.4 + sway;
          const len = s * (1.1 + r() * 0.5);
          const pts = U.bezierPts([0, 0], [Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.6], [Math.cos(a) * len, Math.sin(a) * len * 0.75 + len * 0.15], null, 8);
          ctx.strokeStyle = '#3f6a2a'; ctx.lineWidth = 1.4;
          ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
          for (let k = 1; k < pts.length; k++) {
            ctx.fillStyle = k % 2 ? '#5a9a3a' : '#4a8a32';
            const p = pts[k], l = s * 0.22 * (1 - k / pts.length);
            U.ellipse(ctx, p[0] - l * 0.5, p[1], l, l * 0.35, 0.6); ctx.fill();
            U.ellipse(ctx, p[0] + l * 0.5, p[1], l, l * 0.35, -0.6); ctx.fill();
          }
        }
        // unfurling fiddlehead
        ctx.strokeStyle = '#7aaa4a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.1, -s * 0.9); ctx.arc(s * 0.22, -s * 0.9, s * 0.12, Math.PI, Math.PI * 2.6); ctx.stroke();
        break;
      }
      case 'cycad': {
        ctx.fillStyle = '#6a5034'; U.ellipse(ctx, 0, -s * 0.25, s * 0.35, s * 0.3, 0); ctx.fill();
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI / 2 + (i - 4) * 0.36 + sway;
          const len = s * 1.3;
          ctx.strokeStyle = '#2f5a2a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.quadraticCurveTo(Math.cos(a) * len * 0.6, -s * 0.4 + Math.sin(a) * len * 0.7, Math.cos(a) * len, -s * 0.2 + Math.sin(a) * len * 0.6); ctx.stroke();
          ctx.strokeStyle = '#4a7a32'; ctx.lineWidth = 1;
          for (let k = 2; k < 10; k++) {
            const t = k / 10, x = Math.cos(a) * len * t, y = -s * 0.4 + Math.sin(a) * len * 0.65 * t;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + 1.2) * s * 0.18, y + Math.sin(a + 1.2) * s * 0.18); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - 1.2) * s * 0.18, y + Math.sin(a - 1.2) * s * 0.18); ctx.stroke();
          }
        }
        // seed cone
        const g = ctx.createLinearGradient(0, -s, 0, -s * 0.4);
        g.addColorStop(0, '#e0a040'); g.addColorStop(1, '#a8601c');
        ctx.fillStyle = g; U.ellipse(ctx, 0, -s * 0.65, s * 0.22, s * 0.32, 0); ctx.fill();
        ctx.strokeStyle = 'rgba(90,40,10,0.5)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * (0.85 - i * 0.12)); ctx.lineTo(s * 0.2, -s * (0.78 - i * 0.12)); ctx.stroke(); }
        break;
      }
      case 'horsetail': {
        for (let i = 0; i < 6; i++) {
          const x = (i - 2.5) * s * 0.18 + (r() - 0.5) * 4, h = s * (1.2 + r() * 0.8);
          ctx.strokeStyle = '#5f8a3a'; ctx.lineWidth = s * 0.08;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + sway * 20, -h); ctx.stroke();
          ctx.strokeStyle = '#2f4a22'; ctx.lineWidth = 1;
          for (let k = 1; k < 8; k++) { const y = -h * k / 8, xx = x + sway * 20 * k / 8; ctx.beginPath(); ctx.moveTo(xx - s * 0.06, y); ctx.lineTo(xx + s * 0.06, y); ctx.stroke(); ctx.strokeStyle = '#6f9a42'; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx - s * 0.18, y + s * 0.12); ctx.moveTo(xx, y); ctx.lineTo(xx + s * 0.18, y + s * 0.12); ctx.stroke(); ctx.strokeStyle = '#2f4a22'; }
          ctx.fillStyle = '#8a6a3a'; U.ellipse(ctx, x + sway * 20, -h - s * 0.08, s * 0.07, s * 0.14, 0); ctx.fill();
        }
        break;
      }
      case 'ginkgo': {
        ctx.strokeStyle = '#5a4126'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.quadraticCurveTo(0, -s * 0.8, s, -s * 0.5); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const t = i / 7, x = U.lerp(-s, s, t), y = U.lerp(-s * 0.3, -s * 0.5, t) - Math.sin(t * Math.PI) * s * 0.3;
          ctx.save(); ctx.translate(x, y); ctx.rotate((i % 2 ? -1 : 1) * 0.6 + sway + Math.PI);
          ctx.fillStyle = r() < 0.5 ? '#e8c43a' : '#9ab83a';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.22, s * 0.32); ctx.quadraticCurveTo(0, s * 0.42, s * 0.22, s * 0.32); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#e0b860';
        for (let i = 0; i < 3; i++) { U.ellipse(ctx, -s * 0.3 + i * s * 0.3, -s * 0.2, s * 0.12, s * 0.12, 0); ctx.fill(); }
        break;
      }
      case 'araucaria': {
        ctx.strokeStyle = '#4a3a22'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-s, -s * 0.2); ctx.quadraticCurveTo(0, -s * 0.6, s, -s * 0.4); ctx.stroke();
        for (let i = 0; i < 40; i++) {
          const t = r(), x = U.lerp(-s, s, t), y = -s * 0.2 - Math.sin(t * Math.PI) * s * 0.35 - t * s * 0.15;
          ctx.fillStyle = r() < 0.5 ? '#2f5a2a' : '#3f6a32';
          ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 3); ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'magnolia': {
        // one of the first flowering plants
        ctx.fillStyle = '#3f6a2a';
        U.ellipse(ctx, -s * 0.5, -s * 0.3, s * 0.5, s * 0.18, 0.4); ctx.fill();
        U.ellipse(ctx, s * 0.5, -s * 0.35, s * 0.5, s * 0.18, -0.4); ctx.fill();
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.42;
          ctx.save(); ctx.translate(0, -s * 0.55); ctx.rotate(a + Math.PI / 2 + sway);
          const g = ctx.createLinearGradient(0, 0, 0, -s * 0.8);
          g.addColorStop(0, '#f7d7e4'); g.addColorStop(1, '#ffffff');
          ctx.fillStyle = g; U.ellipse(ctx, 0, -s * 0.4, s * 0.2, s * 0.42, 0); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#e8c040'; U.ellipse(ctx, 0, -s * 0.6, s * 0.12, s * 0.16, 0); ctx.fill();
        break;
      }
      case 'seedfern': {
        // Dicroidium: forked fronds of an extinct seed fern
        const fork = (x, y, a, len, depth) => {
          const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
          ctx.strokeStyle = '#5a6a2a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
          for (let k = 1; k < 5; k++) { const t = k / 5; ctx.fillStyle = '#7a9a3a'; U.ellipse(ctx, U.lerp(x, ex, t), U.lerp(y, ey, t), s * 0.09, s * 0.05, a + 1.2); ctx.fill(); U.ellipse(ctx, U.lerp(x, ex, t), U.lerp(y, ey, t), s * 0.09, s * 0.05, a - 1.2); ctx.fill(); }
          if (depth) { fork(ex, ey, a - 0.45, len * 0.7, depth - 1); fork(ex, ey, a + 0.45, len * 0.7, depth - 1); }
        };
        fork(0, 0, -Math.PI / 2 + sway, s * 0.6, 2);
        break;
      }
      case 'palmetto': {
        ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = 1.6;
        for (let k = 0; k < 2; k++) {
          const cx = (k ? 0.35 : -0.3) * s, cy = -s * (0.7 + k * 0.2);
          ctx.beginPath(); ctx.moveTo(cx * 0.3, 0); ctx.lineTo(cx, cy); ctx.stroke();
          for (let i = 0; i < 11; i++) {
            const a = Math.PI + 0.2 + i * 0.27 + sway;
            ctx.strokeStyle = i % 2 ? '#5a8a32' : '#4a7a2a'; ctx.lineWidth = s * 0.1;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * s * 0.65, cy + Math.sin(a) * s * 0.55); ctx.stroke();
          }
        }
        break;
      }
      case 'jelly': {
        const p = 0.85 + Math.sin(phase * U.TAU) * 0.12;
        ctx.strokeStyle = 'rgba(220,180,255,0.6)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) { const x = (i - 2.5) * s * 0.14; ctx.beginPath(); ctx.moveTo(x, -s * 0.6); ctx.quadraticCurveTo(x + Math.sin(phase * U.TAU + i) * 5, -s * 0.2, x, s * 0.2); ctx.stroke(); }
        const g = ctx.createRadialGradient(0, -s * 0.9, 1, 0, -s * 0.8, s * 0.6);
        g.addColorStop(0, 'rgba(255,230,255,0.9)'); g.addColorStop(1, 'rgba(190,140,240,0.45)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -s * 0.65, s * 0.55 * p, s * 0.42 / p, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        break;
      }
      case 'shrimp': {
        for (let i = 0; i < 4; i++) {
          const x = (r() - 0.5) * s * 1.6, y = -s * 0.5 + (r() - 0.5) * s;
          ctx.save(); ctx.translate(x, y + Math.sin(phase * U.TAU + i) * 2);
          ctx.strokeStyle = '#e88a6a'; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(0, 0, s * 0.18, Math.PI * 0.9, Math.PI * 2.2); ctx.stroke();
          ctx.restore();
        }
        break;
      }
    }
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // Fish extras: sawfish rostrum, long snout, fangs, lobed fins
  const baseFish = S.renderFish;
  S.renderFish = function (f, phase, anim, scale) {
    const res = baseFish(f, phase, anim, scale);
    if (!f.saw && !f.rostrum && !f.fangs && !f.lobed) return res;
    const L = f.len, H = f.h;
    const ext = (f.saw || f.rostrum || 0) * L;
    const c = U.canvas(res.canvas.width + ext * scale, res.canvas.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(res.canvas, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, res.box.ox * scale, res.box.oy * scale);
    if (ext) {
      ctx.fillStyle = f.colors.fins || f.colors.body;
      ctx.beginPath(); ctx.moveTo(L * 0.46, -H * 0.06); ctx.lineTo(L * 0.5 + ext, -H * 0.02); ctx.lineTo(L * 0.5 + ext, H * 0.02); ctx.lineTo(L * 0.46, H * 0.08); ctx.closePath(); ctx.fill();
      if (f.saw) {
        ctx.fillStyle = '#eee4cc';
        for (let i = 1; i < 12; i++) { const x = L * 0.5 + ext * i / 12; ctx.beginPath(); ctx.moveTo(x - 2, -H * 0.02); ctx.lineTo(x + 2, -H * 0.12); ctx.lineTo(x + 1, -H * 0.02); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 2, H * 0.02); ctx.lineTo(x + 2, H * 0.12); ctx.lineTo(x + 1, H * 0.02); ctx.fill(); }
      }
    }
    if (f.fangs) {
      ctx.fillStyle = '#f4ecd8';
      ctx.beginPath(); ctx.moveTo(L * 0.42, H * 0.08); ctx.lineTo(L * 0.44, H * 0.3); ctx.lineTo(L * 0.46, H * 0.08); ctx.fill();
    }
    if (f.lobed) {
      ctx.fillStyle = U.shade(f.colors.fins || f.colors.body, -0.1);
      for (const [x, y] of [[L * 0.1, H * 0.42], [-L * 0.18, H * 0.42], [-L * 0.15, -H * 0.45]]) { U.ellipse(ctx, x, y, L * 0.07, H * 0.12, y > 0 ? 0.6 : -0.6); ctx.fill(); }
    }
    return { canvas: c, ox: res.ox, oy: res.oy, scale: res.scale, box: res.box };
  };

  // Skeleton geometry, shared with the Fossil Finders dig game (it builds bones from it).
  S._dino = { dinoBox, dinoSkeleton, torsoPts, tailPts, neckPts, headPts, bipedLegs, quadLegs };

  Object.assign(S.RENDERERS, { dino: S.renderDino, ptero: S.renderPterosaur, marine: S.renderMarine, ammonite: S.renderAmmonite, bug: S.renderBug, food: S.renderFood, fish: S.renderFish });
})(window.WE);
