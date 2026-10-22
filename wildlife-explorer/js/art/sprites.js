// Procedural sprite renderer. Every creature is drawn from anatomical parameters
// (skeleton -> silhouette -> pattern -> shading -> fur texture -> details) and
// cached as animation frames. No emoji or external images are used.
(function (WE) {
  const U = WE.U;
  const S = {};
  const patternCache = new Map();

  // ===================================================================
  // Layer helpers
  // ===================================================================
  // A layer is a scratch canvas in "sprite space": origin at ground centre,
  // x to the right (the way the animal faces), y down. We give each layer a
  // generous box so no limb gets clipped.
  function makeLayer(box, scale) {
    const c = U.canvas((box.w) * scale, (box.h) * scale);
    const ctx = c.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, box.ox * scale, box.oy * scale);
    return { c, ctx };
  }

  // Paint pattern / shading / fur onto everything already drawn in the layer.
  function finishSurface(layer, box, spec, opts) {
    const ctx = layer.ctx;
    const col = spec.colors;
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';

    if (spec.pattern && !opts.skipPattern) {
      // The coat pattern is identical every frame, so paint it once and reuse it.
      const sc = ctx.getTransform().a;
      const key = spec.id + '|' + sc + '|' + Math.round(box.w) + 'x' + Math.round(box.h);
      let pc = patternCache.get(key);
      if (!pc) {
        pc = U.canvas(box.w * sc, box.h * sc);
        const px = pc.getContext('2d');
        px.setTransform(sc, 0, 0, sc, box.ox * sc, box.oy * sc);
        drawPattern(px, spec, box);
        patternCache.set(key, pc);
      }
      ctx.drawImage(pc, -box.ox, -box.oy, box.w, box.h);
    }

    // Countershading: lighter belly / throat.
    if (col.belly && opts.bellyY !== undefined) {
      const g = ctx.createLinearGradient(0, opts.bellyY - opts.bellyH, 0, opts.bellyY + opts.bellyH * 0.4);
      g.addColorStop(0, U.rgba(col.belly, 0));
      g.addColorStop(0.65, U.rgba(col.belly, 0.85));
      g.addColorStop(1, U.rgba(col.belly, 0.95));
      ctx.fillStyle = g;
      ctx.fillRect(-box.ox, opts.bellyY - opts.bellyH, box.w, opts.bellyH * 2);
    }

    // Top light / bottom shadow for volume.
    const top = opts.top !== undefined ? opts.top : -box.oy;
    const bottom = opts.bottom !== undefined ? opts.bottom : 0;
    const g2 = ctx.createLinearGradient(0, top, 0, bottom);
    g2.addColorStop(0, 'rgba(255,248,230,0.28)');
    g2.addColorStop(0.35, 'rgba(255,255,255,0.0)');
    g2.addColorStop(0.75, 'rgba(0,0,0,0.12)');
    g2.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = g2;
    ctx.fillRect(-box.ox, -box.oy, box.w, box.h);

    if (opts.texture !== false) {
      const tex = spec.texture || 'fur';
      if (tex === 'fur') {
        U.furStrokes(ctx, -box.ox, -box.oy, box.w, box.h, {
          seed: U.hash(spec.id || 'x'), count: Math.floor(box.w * box.h / 12),
          len: spec.furLen || 3.2, angle: Math.PI * 0.9, spread: 0.7,
          dark: U.shade(col.base, -0.45), light: U.shade(col.base, 0.45), alpha: 0.35, width: 0.8,
        });
      } else if (tex === 'skin') {
        drawWrinkles(ctx, box, spec);
      } else if (tex === 'scales') {
        drawScales(ctx, box, spec);
      } else if (tex === 'feather') {
        U.furStrokes(ctx, -box.ox, -box.oy, box.w, box.h, {
          seed: U.hash(spec.id || 'x'), count: Math.floor(box.w * box.h / 14),
          len: 2.4, angle: Math.PI, spread: 0.4,
          dark: U.shade(col.base, -0.5), light: U.shade(col.base, 0.5), alpha: 0.25, width: 0.7,
        });
      } else if (tex === 'smooth') {
        // Wet, glossy skin: a soft specular streak.
        const g3 = ctx.createLinearGradient(0, top, 0, top + (bottom - top) * 0.4);
        g3.addColorStop(0, 'rgba(255,255,255,0.35)');
        g3.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g3;
        ctx.fillRect(-box.ox, top, box.w, (bottom - top) * 0.4);
      }
    }
    if (opts.darken) {
      ctx.fillStyle = `rgba(20,14,8,${opts.darken})`;
      ctx.fillRect(-box.ox, -box.oy, box.w, box.h);
    }
    ctx.restore();
  }

  function drawWrinkles(ctx, box, spec) {
    const r = U.rng(U.hash(spec.id + 'wr'));
    const dark = new Path2D(), light = new Path2D();
    const n = Math.floor(box.w * box.h / 70);
    for (let i = 0; i < n; i++) {
      const x = -box.ox + r() * box.w, y = -box.oy + r() * box.h;
      const l = 3 + r() * 7;
      const p = r() < 0.7 ? dark : light;
      p.moveTo(x, y);
      p.quadraticCurveTo(x + l * 0.5, y + (r() - 0.5) * 3, x + l, y + (r() - 0.5) * 2);
    }
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(30,25,22,0.30)'; ctx.stroke(dark);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke(light);
    ctx.restore();
  }

  function drawScales(ctx, box, spec) {
    const s = spec.scaleSize || 3;
    const path = new Path2D();
    for (let y = -box.oy; y < box.h - box.oy; y += s * 0.8) {
      const off = (Math.round(y / (s * 0.8)) % 2) * s * 0.5;
      for (let x = -box.ox; x < box.w - box.ox; x += s) {
        path.moveTo(x + off + Math.cos(0.15 * Math.PI) * s * 0.55, y + Math.sin(0.15 * Math.PI) * s * 0.55);
        path.arc(x + off, y, s * 0.55, 0.15 * Math.PI, 0.85 * Math.PI);
      }
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 0.6;
    ctx.stroke(path);
    ctx.restore();
  }

  // ===================================================================
  // Coat patterns
  // ===================================================================
  function drawPattern(ctx, spec, box) {
    const p = spec.pattern;
    const r = U.rng(U.hash(spec.id + 'pat'));
    const x0 = -box.ox, y0 = -box.oy, w = box.w, h = box.h;
    ctx.save();
    switch (p.type) {
      case 'spots': {
        ctx.fillStyle = p.color;
        const step = p.size * 2.6;
        for (let y = y0; y < y0 + h; y += step * 0.8) {
          for (let x = x0; x < x0 + w; x += step) {
            const jx = x + (r() - 0.5) * step * 0.8, jy = y + (r() - 0.5) * step * 0.6;
            const s = p.size * (0.6 + r() * 0.6);
            U.ellipse(ctx, jx, jy, s, s * (0.75 + r() * 0.3), r() * 3);
            ctx.globalAlpha = 0.85 + r() * 0.15;
            ctx.fill();
          }
        }
        break;
      }
      case 'rosettes': {
        const step = p.size * 3.1;
        for (let y = y0; y < y0 + h; y += step * 0.85) {
          for (let x = x0; x < x0 + w; x += step) {
            const cx = x + (r() - 0.5) * step * 0.5, cy = y + (r() - 0.5) * step * 0.4;
            const s = p.size * (0.8 + r() * 0.5);
            // Tawny centre slightly darker than the base coat.
            ctx.fillStyle = p.center || 'rgba(150,90,30,0.35)';
            U.ellipse(ctx, cx, cy, s * 0.8, s * 0.65, 0); ctx.fill();
            // Broken ring of 4-6 black blotches.
            ctx.fillStyle = p.color;
            const k = 4 + Math.floor(r() * 3);
            for (let i = 0; i < k; i++) {
              const a = (i / k) * U.TAU + r() * 0.5;
              U.ellipse(ctx, cx + Math.cos(a) * s, cy + Math.sin(a) * s * 0.8, s * 0.38, s * 0.24, a + Math.PI / 2);
              ctx.fill();
            }
            if (r() < 0.5) { U.ellipse(ctx, cx, cy, s * 0.18, s * 0.18, 0); ctx.fill(); }
          }
        }
        break;
      }
      case 'stripes': {
        // Zebra: bold vertical stripes on the body, horizontal bands on the legs.
        ctx.fillStyle = p.color;
        const step = p.size;
        const legY = p._legY !== undefined ? p._legY : y0 + h;
        ctx.save();
        ctx.beginPath(); ctx.rect(x0, y0, w, legY - y0); ctx.clip();
        for (let x = x0; x < x0 + w; x += step * 2) {
          const wob = r() * 3;
          ctx.beginPath();
          const pts = [];
          for (let y = y0; y <= legY + 6; y += 6) {
            const bend = p.bend ? Math.sin((y - y0) / 25 + x / 40) * 4 : 0;
            const slant = x < -40 ? (legY - y) * 0.35 : 0;  // rump stripes sweep back
            pts.push([x + bend + wob - slant, y]);
          }
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (const q of pts) ctx.lineTo(q[0], q[1]);
          for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + step * (0.75 + 0.35 * Math.sin(i * 0.4 + x)), pts[i][1]);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        for (let y = legY; y < y0 + h; y += step * 1.4) {
          ctx.fillRect(x0, y, w, step * 0.6);
        }
        break;
      }
      case 'patches': {
        // Giraffe: jagged polygon patches separated by pale lines.
        const step = p.size;
        const cells = [];
        for (let y = y0; y < y0 + h + step; y += step * 0.9) {
          for (let x = x0; x < x0 + w + step; x += step) {
            cells.push([x + (r() - 0.5) * step * 0.6 + ((y / step) % 2) * step * 0.5, y + (r() - 0.5) * step * 0.5]);
          }
        }
        ctx.fillStyle = p.line;
        ctx.fillRect(x0, y0, w, h);
        for (const c of cells) {
          ctx.fillStyle = U.shade(p.color, (r() - 0.5) * 0.15);
          ctx.beginPath();
          const k = 7;
          for (let i = 0; i < k; i++) {
            const a = (i / k) * U.TAU + r() * 0.3;
            const rr = step * (0.36 + r() * 0.12);
            const px = c[0] + Math.cos(a) * rr, py = c[1] + Math.sin(a) * rr * 0.9;
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'blotches': {
        ctx.fillStyle = p.color;
        const n = Math.floor((w * h) / (p.size * p.size * 6));
        for (let i = 0; i < n; i++) {
          const cx = x0 + r() * w, cy = y0 + r() * h;
          ctx.globalAlpha = p.alpha || 0.9;
          ctx.beginPath();
          const k = 6, s = p.size * (0.5 + r());
          const pts = [];
          for (let j = 0; j < k; j++) {
            const a = (j / k) * U.TAU;
            pts.push([cx + Math.cos(a) * s * (0.7 + r() * 0.5), cy + Math.sin(a) * s * (0.6 + r() * 0.4)]);
          }
          U.smoothPath(ctx, pts);
          ctx.fill();
        }
        break;
      }
      case 'barring': {
        // Owl / raptor feather barring: short dark chevrons.
        ctx.strokeStyle = p.color;
        ctx.lineCap = 'round';
        for (let y = y0; y < y0 + h; y += p.size * 1.6) {
          for (let x = x0; x < x0 + w; x += p.size * 2.2) {
            if (r() > (p.density || 0.7)) continue;
            const jx = x + (r() - 0.5) * p.size, jy = y + (r() - 0.5) * p.size * 0.6;
            ctx.lineWidth = p.size * (0.3 + r() * 0.25);
            ctx.globalAlpha = 0.7 + r() * 0.3;
            ctx.beginPath();
            ctx.moveTo(jx - p.size * 0.6, jy - p.size * 0.2);
            ctx.quadraticCurveTo(jx, jy + p.size * 0.25, jx + p.size * 0.6, jy - p.size * 0.2);
            ctx.stroke();
          }
        }
        break;
      }
      case 'speckle': {
        ctx.fillStyle = p.color;
        const n = Math.floor((w * h) / (p.size * p.size * 3));
        for (let i = 0; i < n; i++) {
          ctx.globalAlpha = 0.5 + r() * 0.5;
          U.ellipse(ctx, x0 + r() * w, y0 + r() * h, p.size * (0.3 + r() * 0.5), p.size * (0.3 + r() * 0.4), 0);
          ctx.fill();
        }
        break;
      }
    }
    ctx.restore();
  }

  // ===================================================================
  // QUADRUPED (cats, dogs, bears, hoofed animals, elephant, camel, ...)
  // ===================================================================
  function quadBox(q) {
    const extra = (q.neck ? q.neck.len : 0) + q.head.len;
    const w = q.len + extra * 1.9 + (q.tail ? q.tail.len : 0) + 80;
    const h = q.leg + q.depth + extra * 1.3 + 50 + (q.antlers ? 50 : 0);
    return { w, h, ox: w * 0.5 - extra * 0.25 + (q.tail ? q.tail.len * 0.25 : 0), oy: h - 14 };
  }

  // Compute skeleton landmarks for a pose.
  function quadSkeleton(q, phase, anim) {
    const sh = q.leg + q.depth * 0.5;               // body centre height
    const slope = q.slope || 0;                      // shoulder higher than hip
    const bob = anim.moving ? Math.abs(Math.sin(phase * U.TAU * 2)) * q.leg * 0.025 : Math.sin(phase * U.TAU) * 0.6;
    const body = {
      cx: 0, cy: -sh - bob,
      shoulder: [q.len * 0.32, -sh - bob - slope * 0.5 - q.depth * 0.18],
      hip: [-q.len * 0.32, -sh - bob + slope * 0.5 - q.depth * 0.12],
    };
    const n = q.neck || { len: 10, angle: 20, w: q.depth * 0.6 };
    const na = U.deg(n.angle + (anim.headDip || 0));
    const neckBase = [q.len * 0.42, body.shoulder[1] - q.depth * 0.05];
    const headBase = [neckBase[0] + Math.cos(na) * n.len, neckBase[1] - Math.sin(na) * n.len];
    return { sh, slope, bob, body, neckBase, headBase, na, n };
  }

  // Leg positions via 2-bone IK and a walk cycle.
  function quadLegs(q, sk, phase, anim) {
    const legs = [];
    const order = [ // [name, front?, near?, phaseOffset]
      ['bh', false, false, 0.5], ['bf', true, false, 0.75],
      ['nh', false, true, 0.0], ['nf', true, true, 0.25],
    ];
    const stride = anim.moving ? q.leg * (anim.run ? 0.55 : 0.32) : 0;
    const lift = anim.moving ? q.leg * (anim.run ? 0.28 : 0.16) : 0;
    for (const [name, front, near, off] of order) {
      const root = front ? sk.body.shoulder.slice() : sk.body.hip.slice();
      root[0] += near ? 0 : (front ? -q.len * 0.06 : q.len * 0.05);
      root[1] += front ? q.depth * 0.42 : q.depth * 0.32;
      const p = (phase + off) % 1;
      const ang = p * U.TAU;
      const fx = root[0] + Math.cos(ang) * stride * 0.5 + (front ? 2 : -1);
      const fy = -Math.max(0, Math.sin(ang)) * lift;
      const upper = (q.leg + (root[1] + q.leg + q.depth * 0.5)) * 0.0 + q.leg * (front ? 0.52 : 0.55);
      const lower = q.leg * (front ? 0.62 : 0.66);
      // Hind legs: hock points backwards (knee bends forward, then hock back).
      const joint = U.ik(root[0], root[1], fx, fy, upper, lower, front ? 1 : -1);
      legs.push({ name, front, near, root, joint, foot: [fx, fy], upper, lower });
    }
    return legs;
  }

  function drawLeg(ctx, q, leg, col) {
    const wTop = q.legW * (leg.front ? 1.25 : 1.6);
    const wMid = q.legW * (q.columnar ? 1.05 : 0.7);
    const wBot = q.legW * (q.columnar ? 1.1 : 0.48);
    const [rx, ry] = leg.root, [jx, jy] = leg.joint, [fx, fy] = leg.foot;
    ctx.fillStyle = col;
    // Haunch / shoulder mass blends the limb into the torso.
    const ang = Math.atan2(jy - ry, jx - rx);
    const mass = q.columnar ? 0.9 : 1;
    U.ellipse(ctx, U.lerp(rx, jx, 0.22), U.lerp(ry, jy, 0.22) - q.depth * 0.08,
      (leg.front ? q.depth * 0.26 : q.depth * 0.34) * mass, (leg.front ? q.legW * 1.0 : q.legW * 1.3) * mass, ang);
    ctx.fill();
    ctx.beginPath();
    U.taperPath(ctx, [[rx, ry - wTop * 0.35], [U.lerp(rx, jx, 0.5), U.lerp(ry, jy, 0.5)], [jx, jy]], wTop * 1.4, wMid * 1.1);
    ctx.fill();
    ctx.beginPath();
    U.taperPath(ctx, [[jx, jy], [U.lerp(jx, fx, 0.5), U.lerp(jy, fy, 0.5)], [fx, fy - wBot * 0.4]], wMid * 1.05, wBot);
    ctx.fill();
    // Foot.
    const fw = q.footW || wBot * 1.5;
    ctx.beginPath();
    if (q.feet === 'hoof') {
      ctx.moveTo(fx - fw * 0.45, fy - fw * 0.9);
      ctx.lineTo(fx + fw * 0.55, fy - fw * 0.8);
      ctx.lineTo(fx + fw * 0.8, fy);
      ctx.lineTo(fx - fw * 0.5, fy);
      ctx.closePath();
    } else if (q.feet === 'pad') {
      U.ellipse(ctx, fx + fw * 0.15, fy - fw * 0.35, fw * 0.6, fw * 0.4, 0);
    } else {
      U.ellipse(ctx, fx + fw * 0.25, fy - fw * 0.3, fw * 0.75, fw * 0.36, 0);
    }
    ctx.fill();
  }

  function bodyPath(ctx, q, sk) {
    const L = q.len, D = q.depth, b = sk.body;
    const cy = b.cy, slope = sk.slope;
    const topF = cy - D * 0.5 - slope * 0.5, topB = cy - D * 0.5 + slope * 0.5;
    const botF = cy + D * 0.45 - slope * 0.25, botB = cy + D * 0.4 + slope * 0.3;
    const arch = q.arch || 0;
    const tuck = q.tuck || 0; // waist tuck (cheetah, greyhound shape)
    const hump = q.hump || 0;
    const pts = [
      [L * 0.56, cy - slope * 0.25],                // chest front
      [L * 0.5, topF + D * 0.12],
      [L * 0.32, topF - D * 0.04],                   // withers
      [L * 0.08, U.lerp(topF, topB, 0.45) - arch],
      [-L * 0.08, U.lerp(topF, topB, 0.6) - arch * 0.8],
      [-L * 0.3, topB - D * 0.02],                   // croup
      [-L * 0.5, topB + D * 0.22],                   // rump
      [-L * 0.53, cy + D * 0.1 + slope * 0.4],
      [-L * 0.4, botB],                              // flank bottom
      [-L * 0.15, U.lerp(botB, botF, 0.4) - tuck],
      [L * 0.15, U.lerp(botB, botF, 0.7) - tuck * 0.3],
      [L * 0.4, botF],
      [L * 0.55, cy + D * 0.25 - slope * 0.25],
    ];
    if (q.belly) { pts[9][1] += q.belly; pts[10][1] += q.belly * 0.7; }
    ctx.beginPath();
    U.smoothPath(ctx, pts, true, 0.9);
  }

  function neckPath(ctx, q, sk) {
    const n = sk.n, w = n.w;
    const [bx, by] = sk.neckBase, [hx, hy] = sk.headBase;
    const nx = Math.cos(sk.na), ny = -Math.sin(sk.na);
    const px = -ny, py = nx; // perpendicular (points "down/forward")
    const wb = w * 0.75, wh = w * 0.42;
    const sag = n.curve || 0; // camels: neck dips down before rising to the head
    ctx.beginPath();
    ctx.moveTo(bx - px * wb - nx * w * 0.6, by - py * wb - ny * w * 0.4);
    ctx.quadraticCurveTo((bx + hx) / 2 - px * wh * 1.1, (by + hy) / 2 - py * wh * 1.1 + sag, hx - px * wh, hy - py * wh);
    ctx.lineTo(hx + px * wh, hy + py * wh);
    ctx.quadraticCurveTo((bx + hx) / 2 + px * wb * 0.9, (by + hy) / 2 + py * wb * 0.9 + sag, bx + px * wb * 1.3 + nx * w * 0.2, by + py * wb * 1.3);
    ctx.closePath();
  }

  // Head drawn in local coords: origin at head base (back of skull), facing right.
  function headGeom(q, sk) {
    const h = q.head;
    const ang = U.deg(h.tilt || 0) - (sk.na - U.deg(q.neck ? q.neck.angle : 20)) * 0.3;
    return { x: sk.headBase[0], y: sk.headBase[1], ang, h };
  }

  function headPath(ctx, h) {
    const L = h.len, H = h.h;
    const sl = h.snout || 0.45, sh = h.snoutH || 0.45;
    const stop = h.stop || 0.1;
    ctx.beginPath();
    const pts = [
      [-L * 0.08, -H * 0.15],
      [L * 0.1, -H * 0.5],
      [L * (0.95 - sl) * 0.6, -H * (0.55 + stop)],        // crown
      [L * (1 - sl), -H * (0.38 + stop * 0.5)],           // stop / brow
      [L * 0.98, -H * sh * 0.5 + H * 0.02],                // nose tip top
      [L * 1.02, H * 0.0 + H * sh * 0.22],                 // nose tip
      [L * 0.92, H * sh * 0.45],                           // chin/lip
      [L * (1 - sl) * 0.95, H * 0.36],
      [L * 0.25, H * 0.48],                                // jaw
      [-L * 0.05, H * 0.3],
    ];
    U.smoothPath(ctx, pts, true, 0.8);
  }

  function drawEar(ctx, h, col, inner, back) {
    const e = h.ears;
    if (!e) return;
    const L = h.len, H = h.h, s = e.size || 1;
    const ex = L * (e.x !== undefined ? e.x : 0.22), ey = -H * 0.45;
    ctx.save();
    ctx.translate(ex + (back ? -L * 0.06 : 0), ey);
    ctx.rotate(U.deg(e.tilt || -15) + (back ? -0.15 : 0));
    ctx.fillStyle = back ? U.shade(col, -0.25) : col;
    ctx.beginPath();
    if (e.type === 'pointed') {
      ctx.moveTo(-H * 0.22 * s, 0);
      ctx.quadraticCurveTo(-H * 0.12 * s, -H * 0.55 * s, H * 0.02, -H * 0.7 * s);
      ctx.quadraticCurveTo(H * 0.18 * s, -H * 0.3 * s, H * 0.2 * s, 0);
    } else if (e.type === 'round') {
      ctx.ellipse(0, -H * 0.12 * s, H * 0.2 * s, H * 0.22 * s, 0, Math.PI * 0.95, Math.PI * 2.05);
    } else if (e.type === 'big') { // fennec
      ctx.moveTo(-H * 0.3 * s, 0);
      ctx.quadraticCurveTo(-H * 0.45 * s, -H * 0.9 * s, -H * 0.05 * s, -H * 1.35 * s);
      ctx.quadraticCurveTo(H * 0.35 * s, -H * 0.8 * s, H * 0.3 * s, 0);
    } else if (e.type === 'leaf') { // ungulates
      ctx.moveTo(-H * 0.1 * s, 0);
      ctx.quadraticCurveTo(-H * 0.35 * s, -H * 0.35 * s, -H * 0.55 * s, -H * 0.62 * s);
      ctx.quadraticCurveTo(-H * 0.05 * s, -H * 0.55 * s, H * 0.12 * s, 0);
    } else if (e.type === 'tiny') {
      ctx.ellipse(0, -H * 0.05, H * 0.1 * s, H * 0.11 * s, 0, Math.PI, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    if (!back && inner && e.type !== 'tiny') {
      ctx.fillStyle = inner;
      ctx.globalAlpha = 0.8;
      ctx.scale(0.6, 0.72);
      ctx.translate(H * 0.02, -H * 0.02);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEye(ctx, x, y, r, iris, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    // Lid shape
    ctx.fillStyle = opts.rim || '#1d1410';
    U.ellipse(ctx, 0, 0, r * 1.35, r * (opts.round ? 1.3 : 0.95), opts.tilt || -0.15);
    ctx.fill();
    ctx.fillStyle = iris;
    U.ellipse(ctx, r * 0.05, 0, r * 1.0, r * (opts.round ? 1.0 : 0.78), 0);
    ctx.fill();
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.1);
    g.addColorStop(0, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = '#050505';
    if (opts.slit) { U.ellipse(ctx, r * 0.1, 0, r * 0.22, r * 0.72, 0); }
    else if (opts.hpupil) { U.ellipse(ctx, r * 0.1, 0, r * 0.62, r * 0.28, 0); }
    else { U.ellipse(ctx, r * 0.12, 0, r * 0.48, r * 0.48, 0); }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    U.ellipse(ctx, -r * 0.25, -r * 0.3, r * 0.26, r * 0.22, 0);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    U.ellipse(ctx, r * 0.4, r * 0.3, r * 0.1, r * 0.1, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawTail(ctx, q, sk, phase, anim, col) {
    const t = q.tail;
    if (!t) return;
    const base = [-q.len * 0.5, sk.body.cy - q.depth * 0.25 + sk.slope * 0.45];
    const sway = Math.sin(phase * U.TAU + 1) * (anim.moving ? 0.25 : 0.12);
    const droop = U.deg(t.droop !== undefined ? t.droop : 60) + sway;
    const curl = t.curl || 0.4;
    const pts = [];
    let x = base[0], y = base[1], a = Math.PI + (Math.PI / 2 - droop) * -1;
    a = Math.PI - (Math.PI / 2 - droop) ; // start pointing backwards-down
    a = Math.PI + droop * 0.0;
    const steps = 10;
    let dir = Math.PI - U.deg(t.lift !== undefined ? t.lift : 20);
    for (let i = 0; i <= steps; i++) {
      pts.push([x, y]);
      const k = i / steps;
      dir += (droop / steps) * (k < 0.6 ? 1.2 : -curl * 1.5) * -1 + sway * 0.05;
      x += Math.cos(dir) * t.len / steps;
      y -= Math.sin(dir) * t.len / steps;
    }
    ctx.fillStyle = col;
    const w0 = t.w || 6, w1 = t.type === 'bushy' ? w0 * 1.4 : t.type === 'tuft' ? w0 * 0.4 : w0 * 0.35;
    if (t.type === 'bushy') {
      // Bushy tail: fat in the middle.
      const mid = Math.floor(pts.length * 0.55);
      U.taperPath(ctx, pts.slice(0, mid + 1), w0, w0 * 2.1);
      ctx.fill();
      U.taperPath(ctx, pts.slice(mid), w0 * 2.1, w0 * 0.4);
      ctx.fill();
      if (t.tip) {
        ctx.fillStyle = t.tip;
        U.taperPath(ctx, pts.slice(steps - 2), w0 * 1.3, w0 * 0.2);
        ctx.fill();
      }
    } else {
      U.taperPath(ctx, pts, w0, w1);
      ctx.fill();
      if (t.type === 'tuft' || t.tip) {
        const e = pts[pts.length - 1], p = pts[pts.length - 3];
        ctx.fillStyle = t.tip || U.shade(col, -0.5);
        if (t.type === 'tuft') {
          U.ellipse(ctx, e[0], e[1], w0 * 1.1, w0 * 0.7, Math.atan2(e[1] - p[1], e[0] - p[0]));
          ctx.fill();
        } else {
          U.taperPath(ctx, pts.slice(steps - 3), w0 * 0.55, w0 * 0.2);
          ctx.fill();
        }
      }
    }
    if (t.rings) {
      ctx.strokeStyle = t.rings;
      for (let i = 6; i < pts.length; i += 1) {
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(pts[i][0], pts[i][1], w0 * 0.5, 0, U.TAU);
        ctx.stroke();
      }
    }
  }

  // Renders a full quadruped into a fresh canvas. Returns {canvas, ox, oy, scale}.
  S.renderQuadruped = function (q, phase, anim, scale) {
    const box = quadBox(q);
    const sk = quadSkeleton(q, phase, anim);
    const legs = quadLegs(q, sk, phase, anim);
    const col = q.colors;
    const hg = headGeom(q, sk);

    // ---- Far layer (far legs, far ear) ----
    const far = makeLayer(box, scale);
    far.ctx.fillStyle = col.base;
    for (const l of legs) if (!l.near) drawLeg(far.ctx, q, l, col.legs || col.base);
    finishSurface(far, box, q, { top: sk.body.cy - q.depth, bottom: 0, darken: 0.28, texture: q.texture });

    // ---- Main layer ----
    const main = makeLayer(box, scale);
    const m = main.ctx;
    drawTail(m, q, sk, phase, anim, col.tail || col.base);
    m.fillStyle = col.base;
    bodyPath(m, q, sk); m.fill();
    if (q.hump) {
      // Dromedary hump: a smooth dome rising out of the back line.
      const top = sk.body.cy - q.depth * 0.45;
      m.beginPath();
      m.moveTo(q.len * 0.3, top + 4);
      m.bezierCurveTo(q.len * 0.18, top - q.hump * 1.05, -q.len * 0.18, top - q.hump * 1.05, -q.len * 0.32, top + 6);
      m.closePath();
      m.fill();
    }
    neckPath(m, q, sk); m.fill();
    // Countershading only on the torso, so legs keep the coat colour.
    if (col.belly) {
      const by = sk.body.cy + q.depth * 0.42, bh = q.depth * 0.38;
      m.save();
      m.globalCompositeOperation = 'source-atop';
      const g = m.createLinearGradient(0, by - bh, 0, by + bh * 0.3);
      g.addColorStop(0, U.rgba(col.belly, 0));
      g.addColorStop(0.7, U.rgba(col.belly, 0.9));
      g.addColorStop(1, U.rgba(col.belly, 1));
      m.fillStyle = g;
      m.fillRect(-box.ox, by - bh, box.w, bh * 2.5);
      m.restore();
    }
    if (q.stripeSide) {
      // Dark flank band (gazelles) above a white belly.
      m.save();
      m.globalCompositeOperation = 'source-atop';
      m.fillStyle = '#2a1a10';
      m.beginPath();
      m.ellipse(0, sk.body.cy + q.depth * 0.18, q.len * 0.42, q.depth * 0.09, 0, 0, U.TAU);
      m.fill();
      m.restore();
    }
    for (const l of legs) if (l.near) drawLeg(m, q, l, col.legs || col.base);
    if (q.pattern) q.pattern._legY = sk.body.cy + q.depth * 0.38;
    if (q.mane && q.mane.type === 'lion') drawMane(m, q, sk, hg, phase);
    m.save();
    m.translate(hg.x, hg.y); m.rotate(hg.ang);
    m.fillStyle = col.head || col.base;
    headPath(m, q.head); m.fill();
    m.restore();

    finishSurface(main, box, q, {
      top: sk.body.cy - q.depth * 0.6 - (q.neck ? q.neck.len * 0.6 : 0), bottom: 0, texture: q.texture,
    });

    // ---- Detail pass (not clipped) ----
    const det = main.ctx;
    // Hooves / claws colour
    if (col.hoof) {
      det.fillStyle = col.hoof;
      for (const l of legs) {
        const fw = q.footW || q.legW * 0.72;
        const [fx, fy] = l.foot;
        det.globalAlpha = l.near ? 1 : 0.7;
        det.beginPath();
        if (q.feet === 'hoof') {
          det.moveTo(fx - fw * 0.45, fy - fw * 0.55); det.lineTo(fx + fw * 0.6, fy - fw * 0.5);
          det.lineTo(fx + fw * 0.8, fy); det.lineTo(fx - fw * 0.5, fy); det.closePath();
        } else {
          U.ellipse(det, fx + fw * 0.25, fy - fw * 0.2, fw * 0.7, fw * 0.22, 0);
        }
        det.fill();
      }
      det.globalAlpha = 1;
    }
    if (col.socks) {
      // Lower leg colour (e.g. black stockings of a fennec, white socks of a deer)
      det.save();
      det.globalCompositeOperation = 'source-atop';
      det.fillStyle = col.socks;
      for (const l of legs) if (l.near) {
        const [jx, jy] = l.joint;
        det.globalAlpha = 0.85;
        det.fillRect(l.foot[0] - q.legW * 1.2, U.lerp(jy, 0, 0.35), q.legW * 2.6, 40);
      }
      det.restore();
    }

    if (q.mane && q.mane.type !== 'lion') drawMane(det, q, sk, hg, phase);

    // Head details
    det.save();
    det.translate(hg.x, hg.y); det.rotate(hg.ang);
    const h = q.head;
    // Back ear (behind head) is faked by drawing slightly darker first.
    det.save();
    det.globalCompositeOperation = 'destination-over';
    drawEar(det, h, U.shade(col.head || col.base, -0.2), null, true);
    det.restore();
    drawEar(det, h, col.ear || col.head || col.base, col.earInner, false);
    if (h.markings) h.markings(det, h, col);
    if (q.ossicones) drawOssicones(det, h, col);
    if (q.horns) drawHorns(det, h, q.horns);
    if (q.antlers) drawAntlers(det, h, q.antlers);
    // Muzzle colour
    if (col.muzzle) {
      det.save();
      headPath(det, h);
      det.clip();
      det.fillStyle = col.muzzle;
      U.ellipse(det, h.len * 0.9, h.h * 0.08, h.len * (h.snout || 0.45) * 0.75, h.h * 0.45, 0);
      det.globalAlpha = 0.9;
      det.fill();
      det.restore();
    }
    // Eye
    const eyeX = h.len * (h.eyeX || (1 - (h.snout || 0.45)) * 0.95);
    const eyeY = -h.h * (h.eyeY || 0.18);
    drawEye(det, eyeX, eyeY, h.eyeR || h.h * 0.085, col.eye || '#6b4a1f', { slit: h.slitEye, hpupil: h.hPupil, round: h.roundEye });
    // Nose
    det.fillStyle = col.nose || '#2a1d18';
    if (h.noseType !== 'none') {
      U.ellipse(det, h.len * 0.985, -h.h * (h.snoutH || 0.45) * 0.08 + h.h * 0.02, h.h * 0.09 * (h.noseSize || 1), h.h * 0.07 * (h.noseSize || 1), 0.3);
      det.fill();
      det.fillStyle = 'rgba(255,255,255,0.35)';
      U.ellipse(det, h.len * 0.97, -h.h * 0.06, h.h * 0.03, h.h * 0.02, 0);
      det.fill();
    }
    // Mouth line
    det.strokeStyle = 'rgba(25,15,10,0.65)';
    det.lineWidth = 1;
    det.beginPath();
    det.moveTo(h.len * 0.98, h.h * (h.snoutH || 0.45) * 0.25);
    det.quadraticCurveTo(h.len * 0.88, h.h * (h.snoutH || 0.45) * 0.4, h.len * (1 - (h.snout || 0.45) * 0.8), h.h * (h.mouthY || 0.22));
    det.stroke();
    if (h.whiskers) {
      det.strokeStyle = 'rgba(255,255,255,0.55)';
      det.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) {
        det.beginPath();
        det.moveTo(h.len * 0.9, h.h * 0.08 + i * 1.5);
        det.quadraticCurveTo(h.len * 1.15, h.h * 0.05 + i * 3, h.len * 1.3, h.h * 0.1 + i * 5);
        det.stroke();
      }
    }
    det.restore();

    if (q.trunk) drawTrunk(det, q, hg, phase, anim, col);
    if (q.bigEars) drawElephantEar(det, q, hg, phase, col);
    if (q.tusks) drawTusk(det, q, hg);

    // Compose: far layer under main layer.
    const out = U.canvas(main.c.width, main.c.height);
    const o = out.getContext('2d');
    o.drawImage(far.c, 0, 0);
    o.drawImage(main.c, 0, 0);
    return { canvas: out, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  function drawMane(ctx, q, sk, hg, phase) {
    const mn = q.mane;
    const r = U.rng(U.hash(q.id + 'mane'));
    ctx.save();
    if (mn.type === 'lion') {
      // A rounded mane mass (radial gradient) with shaggy locks along its edge.
      // The head is drawn afterwards, so the face sits in front of the mane.
      const cx = hg.x - q.head.len * 0.12, cy = hg.y + q.head.h * 0.12;
      const R = q.head.h * (mn.size || 1.25);
      const rad = a => {
        const sa = Math.sin(a), ca = Math.cos(a);
        let k = 1 + Math.max(0, sa) * 0.55 + Math.max(0, -ca) * 0.2;
        return R * k;
      };
      const pts = [];
      const N = 36;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * U.TAU;
        const rr = rad(a) * (0.92 + r() * 0.12);
        pts.push([cx + Math.cos(a) * rr * 0.9, cy + Math.sin(a) * rr]);
      }
      const g = ctx.createRadialGradient(cx + R * 0.2, cy - R * 0.1, R * 0.2, cx, cy, R * 1.5);
      g.addColorStop(0, U.shade(mn.color, 0.15));
      g.addColorStop(0.55, mn.color);
      g.addColorStop(1, mn.dark);
      ctx.fillStyle = g;
      ctx.beginPath();
      U.smoothPath(ctx, pts, true, 0.9);
      ctx.fill();
      // Edge locks
      for (let i = 0; i < 110; i++) {
        const a = (i / 110) * U.TAU + r() * 0.08;
        const ca = Math.cos(a), sa = Math.sin(a);
        const rr = rad(a) * 0.88;
        const sx = cx + ca * rr * 0.9, sy = cy + sa * rr;
        const len = R * (0.14 + r() * 0.22) * (1 + Math.max(0, sa) * 0.5);
        const da = U.lerp(a, Math.PI * 0.6, 0.45) + (r() - 0.5) * 0.3; // locks sweep down/back
        const ex = sx + Math.cos(da) * len * 0.9, ey = sy + Math.sin(da) * len + len * 0.25;
        const mx = U.lerp(sx, ex, 0.5) + (r() - 0.5) * 6, my = U.lerp(sy, ey, 0.5) + (r() - 0.5) * 6;
        ctx.fillStyle = U.mix(mn.dark, mn.color, r() * 0.6);
        U.taperPath(ctx, U.bezierPts([sx, sy], [mx, my], [ex, ey], null, 5), R * 0.13, R * 0.015);
        ctx.fill();
      }
      // Inner flowing strands
      ctx.save();
      ctx.beginPath(); U.smoothPath(ctx, pts, true, 0.9); ctx.clip();
      ctx.lineCap = 'round';
      for (let i = 0; i < 160; i++) {
        const a = r() * U.TAU, d = r() * R * 1.1;
        const x = cx + Math.cos(a) * d * 0.9, y = cy + Math.sin(a) * d;
        const da = a + 0.4;
        const l = 6 + r() * 12;
        ctx.strokeStyle = r() < 0.55 ? U.rgba(mn.dark, 0.5) : U.rgba(U.shade(mn.color, 0.35), 0.45);
        ctx.lineWidth = 0.8 + r() * 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(da) * l * 0.6 + 2, y + Math.sin(da) * l * 0.6, x + Math.cos(da) * l, y + Math.sin(da) * l + l * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    } else if (mn.type === 'upright') {
      // Zebra / giraffe short upright mane along the top of the neck.
      const [bx, by] = sk.neckBase, [hx, hy] = sk.headBase;
      const nx = Math.cos(sk.na), ny = -Math.sin(sk.na);
      const px = ny, py = -nx;
      const w = sk.n.w * 0.42;
      const n = 22;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const x = U.lerp(bx - nx * 6, hx, t) + px * w * U.lerp(1.6, 1, t), y = U.lerp(by, hy, t) + py * w * U.lerp(1.6, 1, t);
        ctx.strokeStyle = i % 2 ? mn.color : (mn.alt || mn.color);
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - px * 3, y - py * 3);
        ctx.lineTo(x + px * mn.size, y + py * mn.size);
        ctx.stroke();
      }
    } else if (mn.type === 'ruff') {
      // Wolf neck ruff: thicker fur collar.
      const cx = sk.neckBase[0] + 4, cy = sk.neckBase[1] + 4;
      ctx.fillStyle = mn.color;
      for (let i = 0; i < 14; i++) {
        const a = Math.PI * 0.5 + (i / 14) * Math.PI * 1.2;
        const rr = sk.n.w * (0.9 + r() * 0.3);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - 0.15) * rr * 0.8, cy + Math.sin(a - 0.15) * rr * 0.8);
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        ctx.lineTo(cx + Math.cos(a + 0.15) * rr * 0.8, cy + Math.sin(a + 0.15) * rr * 0.8);
        ctx.closePath();
        ctx.globalAlpha = 0.55;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawOssicones(ctx, h, col) {
    for (const dx of [-3, 2]) {
      ctx.fillStyle = dx < 0 ? U.shade(col.base, -0.3) : col.base;
      ctx.beginPath();
      ctx.moveTo(h.len * 0.18 + dx, -h.h * 0.45);
      ctx.lineTo(h.len * 0.14 + dx, -h.h * 1.05);
      ctx.lineTo(h.len * 0.26 + dx, -h.h * 1.05);
      ctx.lineTo(h.len * 0.3 + dx, -h.h * 0.45);
      ctx.fill();
      ctx.fillStyle = '#2b1d14';
      U.ellipse(ctx, h.len * 0.2 + dx, -h.h * 1.08, h.h * 0.12, h.h * 0.1, 0);
      ctx.fill();
    }
  }

  function drawHorns(ctx, h, hn) {
    // Ringed, backward-curving horns (gazelle).
    ctx.save();
    ctx.translate(h.len * 0.3, -h.h * 0.5);
    for (const off of [-2, 0]) {
      const pts = U.bezierPts([off, 0], [off - hn.len * 0.15, -hn.len * 0.6], [off - hn.len * 0.45, -hn.len * 0.95], null, 10);
      ctx.fillStyle = off ? U.shade(hn.color, -0.35) : hn.color;
      U.taperPath(ctx, pts, hn.w, 1);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 0.8;
      for (let i = 1; i < 7; i++) {
        const p = pts[i];
        ctx.beginPath(); ctx.moveTo(p[0] - hn.w * 0.5, p[1]); ctx.lineTo(p[0] + hn.w * 0.5, p[1] + 1); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawAntlers(ctx, h, an) {
    ctx.save();
    ctx.translate(h.len * 0.25, -h.h * 0.5);
    ctx.strokeStyle = an.color;
    ctx.lineCap = 'round';
    for (const side of [0, 1]) {
      ctx.globalAlpha = side ? 1 : 0.6;
      const sx = side ? 0 : -4;
      // Main beam sweeps back then forward (white-tailed deer style).
      const beam = U.bezierPts([sx, 0], [sx - an.size * 0.5, -an.size * 0.7], [sx + an.size * 0.6, -an.size * 1.0], null, 12);
      ctx.lineWidth = 3.2;
      ctx.beginPath(); beam.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      ctx.lineWidth = 2.2;
      for (const k of [4, 7, 10]) {
        const p = beam[k];
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 2, p[1] - an.size * 0.38); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawTrunk(ctx, q, hg, phase, anim, col) {
    const h = q.head, t = q.trunk;
    ctx.save();
    ctx.translate(hg.x, hg.y); ctx.rotate(hg.ang);
    const sway = Math.sin(phase * U.TAU) * 0.18;
    const base = [h.len * 0.92, h.h * 0.05];
    const pts = [];
    let a = Math.PI * 0.42 + sway;
    let x = base[0], y = base[1];
    for (let i = 0; i <= 14; i++) {
      pts.push([x, y]);
      a += (i < 10 ? -0.01 : -0.16) - sway * 0.04;
      x += Math.cos(a) * t.len / 14;
      y += Math.sin(a) * t.len / 14;
    }
    ctx.fillStyle = col.head || col.base;
    U.taperPath(ctx, pts, h.h * 0.42, h.h * 0.16);
    ctx.fill();
    // Trunk rings
    ctx.strokeStyle = 'rgba(30,25,22,0.4)';
    ctx.lineWidth = 0.8;
    for (let i = 2; i < pts.length - 1; i++) {
      const p = pts[i], n = pts[i + 1];
      const ang = Math.atan2(n[1] - p[1], n[0] - p[0]) + Math.PI / 2;
      const w = U.lerp(h.h * 0.42, h.h * 0.16, i / 14) * 0.45;
      ctx.beginPath();
      ctx.moveTo(p[0] + Math.cos(ang) * w, p[1] + Math.sin(ang) * w);
      ctx.lineTo(p[0] - Math.cos(ang) * w * 0.3, p[1] - Math.sin(ang) * w * 0.3);
      ctx.stroke();
    }
    // Shading on trunk underside
    ctx.globalCompositeOperation = 'source-atop';
    ctx.restore();
  }

  function drawElephantEar(ctx, q, hg, phase, col) {
    const h = q.head;
    const flap = Math.sin(phase * U.TAU * 2) * 0.06;
    ctx.save();
    ctx.translate(hg.x + h.len * 0.1, hg.y - h.h * 0.25);
    ctx.rotate(hg.ang + flap);
    const W = h.h * 1.0, H = h.h * 1.5;
    ctx.beginPath();
    // African elephant ear shaped roughly like the African continent.
    U.smoothPath(ctx, [
      [0, -H * 0.15], [-W * 0.35, -H * 0.38], [-W * 0.85, -H * 0.3], [-W * 1.05, H * 0.05],
      [-W * 0.95, H * 0.45], [-W * 0.6, H * 0.85], [-W * 0.3, H * 0.75], [-W * 0.15, H * 0.4], [0, H * 0.25],
    ], true, 0.9);
    const g = ctx.createLinearGradient(-W, -H * 0.4, 0, H);
    g.addColorStop(0, U.shade(col.base, 0.08));
    g.addColorStop(1, U.shade(col.base, -0.25));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,25,22,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Veins
    ctx.strokeStyle = 'rgba(40,30,30,0.25)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-W * 0.1, H * 0.05 * i);
      ctx.quadraticCurveTo(-W * 0.5, -H * 0.1 + i * H * 0.12, -W * (0.8 - i * 0.05), H * (0.0 + i * 0.15));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTusk(ctx, q, hg) {
    const h = q.head;
    ctx.save();
    ctx.translate(hg.x, hg.y); ctx.rotate(hg.ang);
    const pts = U.bezierPts([h.len * 0.78, h.h * 0.32], [h.len * 1.05, h.h * 0.75], [h.len * 1.35, h.h * 0.45], null, 10);
    const g = ctx.createLinearGradient(h.len * 0.78, 0, h.len * 1.35, 0);
    g.addColorStop(0, '#d9cba6'); g.addColorStop(1, '#fffaf0');
    ctx.fillStyle = g;
    U.taperPath(ctx, pts, h.h * 0.16, h.h * 0.03);
    ctx.fill();
    ctx.restore();
  }

  // ===================================================================
  // BIRD (perched/standing and flying)
  // ===================================================================
  S.renderBird = function (b, phase, anim, scale) {
    const s = b.size;
    const box = { w: s * 5, h: s * 4.6, ox: s * 2.4, oy: s * 3.6 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx;
    const col = b.colors;
    const flying = anim.flying;
    const flap = Math.sin(phase * U.TAU * (flying ? 1 : 0));
    const lift = flying ? -s * 1.1 + flap * s * 0.12 : 0;
    const bodyA = flying ? -0.12 : U.deg(b.stance || -35); // body pitch
    const upright = b.upright; // penguin/owl
    const legLen = b.legLen !== undefined ? b.legLen : s * 0.5;
    const cy = -legLen - s * 0.48 + lift;
    const bw = s * (b.bodyW || 1.25), bh = s * (b.bodyH || 0.62);

    // Far wing when flying
    if (flying) drawWing(ctx, b, 0, cy, bodyA, flap, true);

    // Legs (when not flying)
    if (!flying && legLen > 0) {
      ctx.strokeStyle = col.legs || '#c9a227';
      ctx.lineCap = 'round';
      ctx.lineWidth = b.legW || s * 0.07;
      for (const dx of [-s * 0.12, s * 0.06]) {
        ctx.beginPath();
        ctx.moveTo(dx, cy + bh * 0.4);
        ctx.lineTo(dx + s * 0.04, -legLen * 0.45);
        ctx.lineTo(dx, 0);
        ctx.stroke();
        // toes / talons
        ctx.lineWidth = (b.legW || s * 0.07) * 0.8;
        ctx.beginPath(); ctx.moveTo(dx - s * 0.12, 0); ctx.lineTo(dx + s * 0.18, 0); ctx.stroke();
        if (b.feathered) {
          ctx.fillStyle = col.body;
          U.ellipse(ctx, dx + s * 0.02, -legLen * 0.5, s * 0.1, legLen * 0.5, 0); ctx.fill();
        }
      }
    }

    ctx.save();
    ctx.translate(0, cy);
    ctx.rotate(bodyA);
    // Tail
    ctx.fillStyle = col.tail || col.wing || col.body;
    const tl = s * (b.tailLen || 0.8);
    ctx.beginPath();
    ctx.moveTo(-bw * 0.7, -bh * 0.2);
    ctx.lineTo(-bw * 0.7 - tl, -bh * 0.05 - (flying ? 0 : s * 0.02));
    ctx.lineTo(-bw * 0.7 - tl * 1.02, bh * 0.25);
    ctx.lineTo(-bw * 0.6, bh * 0.3);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.fillStyle = col.body;
    ctx.beginPath();
    U.smoothPath(ctx, [
      [bw * 0.85, -bh * 0.35], [bw * 0.4, -bh * 0.95], [-bw * 0.35, -bh * 0.75], [-bw * 0.85, -bh * 0.1],
      [-bw * 0.55, bh * 0.55], [bw * 0.1, bh * 0.95], [bw * 0.75, bh * 0.45],
    ], true, 0.85);
    ctx.fill();
    ctx.restore();

    // Head
    const hr = s * (b.headR || 0.42);
    const neckA = bodyA - (upright ? 0 : 0.15);
    const hx = Math.cos(neckA) * bw * 0.85 + (upright ? -s * 0.1 : 0);
    const hy = cy + Math.sin(neckA) * bw * 0.85 - bh * 0.55 - (upright ? s * 0.1 : 0);
    ctx.fillStyle = col.head || col.body;
    U.ellipse(ctx, hx, hy, hr * (b.headW || 1.05), hr, 0);
    ctx.fill();
    // neck join
    U.ellipse(ctx, (hx + Math.cos(neckA) * bw * 0.5) / 2 + s * 0.1, (hy + cy) / 2, hr * 0.8, hr * 0.9, 0);
    ctx.fill();

    // Belly/breast colour
    if (col.breast) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = col.breast;
      U.ellipse(ctx, hx - s * 0.05, hy + hr * 1.3, hr * 1.0, hr * 1.4, 0.3);
      ctx.fill();
      ctx.restore();
    }
    if (col.throat) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = col.throat;
      U.ellipse(ctx, hx + hr * 0.2, hy + hr * 0.55, hr * 0.85, hr * 0.75, 0);
      ctx.fill();
      ctx.restore();
    }
    finishSurface(lay, box, b, { top: cy - s, bottom: cy + s * 0.6, texture: 'feather' });

    // Near wing
    drawWing(ctx, b, 0, cy, bodyA, flap, false);

    // Beak
    drawBeak(ctx, b, hx, hy, hr);
    // Eye
    if (b.facialDisk) {
      ctx.fillStyle = U.rgba(col.head || col.body, 0.9);
      U.ellipse(ctx, hx + hr * 0.25, hy, hr * 0.7, hr * 0.8, 0); ctx.fill();
    }
    if (col.eyeRing) {
      ctx.fillStyle = col.eyeRing;
      U.ellipse(ctx, hx + hr * 0.35, hy - hr * 0.15, hr * 0.33, hr * 0.33, 0); ctx.fill();
    }
    drawEye(ctx, hx + hr * (b.eyeX || 0.38), hy - hr * 0.15, hr * (b.eyeR || 0.16), col.eye || '#3a2412', { round: true, rim: '#111' });
    if (b.brow) {
      ctx.fillStyle = U.shade(col.head || col.body, -0.2);
      ctx.beginPath();
      ctx.moveTo(hx + hr * 0.1, hy - hr * 0.42);
      ctx.quadraticCurveTo(hx + hr * 0.5, hy - hr * 0.5, hx + hr * 0.75, hy - hr * 0.25);
      ctx.lineTo(hx + hr * 0.6, hy - hr * 0.3);
      ctx.quadraticCurveTo(hx + hr * 0.4, hy - hr * 0.38, hx + hr * 0.1, hy - hr * 0.3);
      ctx.fill();
    }
    if (b.crest) {
      ctx.fillStyle = col.crest || col.head;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(hx - hr * 0.2, hy - hr * 0.7);
        ctx.lineTo(hx - hr * (0.8 + i * 0.15), hy - hr * (1.2 + Math.sin(i) * 0.2));
        ctx.lineTo(hx - hr * 0.1, hy - hr * 0.4);
        ctx.fill();
      }
    }
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  function drawWing(ctx, b, x, cy, bodyA, flap, far) {
    const s = b.size, col = b.colors;
    ctx.save();
    ctx.translate(x + s * 0.15, cy - s * 0.15);
    if (b.flipper) {
      // Penguin flipper
      ctx.rotate(bodyA + 0.3 + (far ? 0 : 0));
      ctx.fillStyle = far ? U.shade(col.wing, -0.3) : col.wing;
      ctx.beginPath();
      ctx.ellipse(-s * 0.1, s * 0.35, s * 0.14, s * 0.55, 0.25, 0, U.TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    const span = s * (b.wingSpan || 1.9);
    if (b.flyingNow === false) {}
    const folded = !b._flyingPose;
    let ang;
    if (folded) {
      ctx.rotate(bodyA + Math.PI * 0.05);
      ctx.fillStyle = far ? U.shade(col.wing, -0.3) : col.wing;
      ctx.beginPath();
      U.smoothPath(ctx, [[s * 0.45, -s * 0.15], [-s * 0.2, -s * 0.28], [-s * 1.25, s * 0.02], [-s * 0.3, s * 0.3], [s * 0.4, s * 0.2]], true, 0.8);
      ctx.fill();
      // Primaries & coverts
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.1 - i * s * 0.15, -s * 0.15 + i * 0.5);
        ctx.lineTo(-s * 0.55 - i * s * 0.15, s * 0.12 + i * 0.6);
        ctx.stroke();
      }
      if (col.wingBar) {
        ctx.fillStyle = col.wingBar;
        U.ellipse(ctx, s * 0.05, -s * 0.08, s * 0.32, s * 0.12, -0.1); ctx.fill();
      }
      if (col.wingTip) {
        ctx.fillStyle = col.wingTip;
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.12); ctx.lineTo(-s * 1.25, s * 0.02); ctx.lineTo(-s * 0.75, s * 0.2); ctx.closePath(); ctx.fill();
      }
    } else {
      ang = flap * 0.9 - 0.2;
      ctx.scale(1, far ? 0.75 : 1);
      ctx.rotate(-Math.PI / 2 + ang * (far ? -0.6 : 1) - 0.1);
      ctx.fillStyle = far ? U.shade(col.wing, -0.35) : col.wing;
      ctx.beginPath();
      U.smoothPath(ctx, [
        [-s * 0.18, 0], [span * 0.35, -s * 0.18], [span * 0.8, -s * 0.12], [span, s * 0.08],
        [span * 0.9, s * 0.3], [span * 0.6, s * 0.38], [span * 0.25, s * 0.42], [-s * 0.1, s * 0.3],
      ], true, 0.7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 7; i++) {
        const t = 0.4 + i * 0.09;
        ctx.beginPath();
        ctx.moveTo(span * t, s * 0.05);
        ctx.lineTo(span * (t + 0.04), s * 0.36);
        ctx.stroke();
      }
      if (col.wingTip) {
        ctx.fillStyle = col.wingTip;
        ctx.beginPath();
        ctx.moveTo(span * 0.72, -s * 0.12); ctx.lineTo(span, s * 0.08); ctx.lineTo(span * 0.9, s * 0.3); ctx.lineTo(span * 0.7, s * 0.3);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawBeak(ctx, b, hx, hy, hr) {
    const col = b.colors;
    ctx.save();
    ctx.translate(hx + hr * 0.75, hy - hr * 0.05);
    const L = hr * (b.beakLen || 0.8), H = hr * (b.beakH || 0.45);
    if (b.beak === 'toucan') {
      const g = ctx.createLinearGradient(0, -H, L, H);
      g.addColorStop(0, '#f4c430'); g.addColorStop(0.6, '#f28c28'); g.addColorStop(1, '#e8601c');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-hr * 0.1, -H * 0.9);
      ctx.bezierCurveTo(L * 0.4, -H * 1.25, L * 0.9, -H * 0.6, L, H * 0.15);
      ctx.bezierCurveTo(L * 0.8, H * 0.2, L * 0.4, H * 0.55, -hr * 0.1, H * 0.7);
      ctx.closePath();
      ctx.fill();
      // black tip
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(L * 0.82, -H * 0.55); ctx.bezierCurveTo(L * 0.95, -H * 0.3, L * 1.02, 0, L, H * 0.15);
      ctx.lineTo(L * 0.8, H * 0.22); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(80,30,0,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-hr * 0.05, H * 0.15); ctx.quadraticCurveTo(L * 0.5, H * 0.05, L * 0.98, H * 0.12); ctx.stroke();
    } else if (b.beak === 'hook') {
      ctx.fillStyle = col.beak || '#e9b824';
      ctx.beginPath();
      ctx.moveTo(-hr * 0.15, -H * 0.6);
      ctx.quadraticCurveTo(L * 0.7, -H * 0.9, L, H * 0.1);
      ctx.quadraticCurveTo(L * 0.95, H * 0.7, L * 0.7, H * 0.55);
      ctx.quadraticCurveTo(L * 0.4, H * 0.5, -hr * 0.15, H * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-hr * 0.15, -H * 0.6, hr * 0.25, H * 1.1);
    } else {
      ctx.fillStyle = col.beak || '#333';
      ctx.beginPath();
      ctx.moveTo(-hr * 0.1, -H * 0.5);
      ctx.quadraticCurveTo(L * 0.6, -H * 0.4, L, 0);
      ctx.quadraticCurveTo(L * 0.6, H * 0.4, -hr * 0.1, H * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ===================================================================
  // FISH (reef fish, prey fish, sharks)
  // ===================================================================
  S.renderFish = function (f, phase, anim, scale) {
    const L = f.len, H = f.h;
    const box = { w: L * 1.9, h: H * 3.2, ox: L * 0.95, oy: H * 1.6 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx;
    const col = f.colors;
    const wag = Math.sin(phase * U.TAU) * (anim.moving ? 0.25 : 0.12);
    // body spine bend
    const bend = x => Math.sin(phase * U.TAU - x / L * 3) * wag * (0.5 - x / L) * H * 0.6;
    const top = x => {
      const t = (x + L * 0.5) / L; // 0 tail .. 1 nose
      return -H * 0.5 * Math.pow(Math.sin(Math.PI * U.clamp(t * (f.fatFront ? 0.9 : 1) + (f.fatFront ? 0.08 : 0), 0, 1)), f.shape || 0.75);
    };
    // Far pectoral fin
    // Caudal fin
    const tx = -L * 0.5 - 2, ty = bend(-L * 0.5);
    ctx.fillStyle = col.fins || col.body;
    ctx.beginPath();
    if (f.shark) {
      ctx.moveTo(tx + 4, ty - H * 0.12);
      ctx.quadraticCurveTo(tx - L * 0.12, ty - H * 0.6, tx - L * 0.2, ty - H * 0.95);
      ctx.quadraticCurveTo(tx - L * 0.1, ty - H * 0.2, tx - L * 0.12, ty + H * 0.5);
      ctx.quadraticCurveTo(tx - L * 0.05, ty + H * 0.2, tx + 4, ty + H * 0.1);
    } else {
      const tw = f.tailW || 0.5;
      ctx.moveTo(tx + 6, ty - H * 0.08);
      ctx.quadraticCurveTo(tx - L * 0.1, ty - H * tw * 1.2, tx - L * 0.22, ty - H * tw - wag * 10);
      ctx.quadraticCurveTo(tx - L * (f.forked ? 0.08 : 0.16), ty, tx - L * 0.22, ty + H * tw - wag * 10);
      ctx.quadraticCurveTo(tx - L * 0.1, ty + H * tw * 1.2, tx + 6, ty + H * 0.08);
    }
    ctx.closePath();
    ctx.fill();

    // Dorsal / anal fins
    ctx.fillStyle = col.fins || col.body;
    if (f.shark) {
      ctx.beginPath();
      ctx.moveTo(L * 0.02, top(0) + 2);
      ctx.quadraticCurveTo(-L * 0.02, top(0) - H * 0.55, -L * 0.1, top(0) - H * 0.7);
      ctx.quadraticCurveTo(-L * 0.1, top(-L * 0.1) - H * 0.2, -L * 0.15, top(-L * 0.15) + 2);
      ctx.fill();
    } else if (f.dorsal !== false) {
      ctx.beginPath();
      const d0 = f.dorsalStart !== undefined ? f.dorsalStart : 0.25, d1 = f.dorsalEnd !== undefined ? f.dorsalEnd : -0.35;
      ctx.moveTo(L * d0, top(L * d0) + 3);
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const x = U.lerp(L * d0, L * d1, i / steps);
        const hgt = H * (f.dorsalH || 0.28) * Math.sin(Math.PI * (0.15 + 0.85 * i / steps));
        ctx.lineTo(x, top(x) - hgt + bend(x));
      }
      ctx.lineTo(L * d1 - 4, top(L * d1) + 3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-L * 0.05, -top(-L * 0.05) - 3);
      ctx.quadraticCurveTo(-L * 0.2, -top(-L * 0.2) + H * 0.3, -L * 0.36, -top(-L * 0.36) - 2);
      ctx.fill();
    }

    // Body
    ctx.fillStyle = col.body;
    ctx.beginPath();
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const x = U.lerp(-L * 0.5, L * 0.5, i / N);
      const y = top(x) + bend(x);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const x = U.lerp(-L * 0.5, L * 0.5, i / N);
      const y = -top(x) * (f.belly || 1) + bend(x);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Bands (clownfish) / stripes
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    if (f.bands) {
      for (const bd of f.bands) {
        const x = L * bd;
        ctx.fillStyle = col.bandEdge || '#111';
        ctx.beginPath();
        ctx.moveTo(x - L * 0.06, -H); ctx.quadraticCurveTo(x + L * 0.03, 0, x - L * 0.06, H);
        ctx.lineTo(x + L * 0.06, H); ctx.quadraticCurveTo(x + L * 0.14, 0, x + L * 0.06, -H);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = col.band || '#fff';
        ctx.beginPath();
        ctx.moveTo(x - L * 0.04, -H); ctx.quadraticCurveTo(x + L * 0.05, 0, x - L * 0.04, H);
        ctx.lineTo(x + L * 0.04, H); ctx.quadraticCurveTo(x + L * 0.12, 0, x + L * 0.04, -H);
        ctx.closePath(); ctx.fill();
      }
    }
    if (col.back) {
      const g = ctx.createLinearGradient(0, -H * 0.5, 0, H * 0.5);
      g.addColorStop(0, col.back); g.addColorStop(0.5, U.rgba(col.back, 0.0)); g.addColorStop(0.55, U.rgba(col.belly || col.body, 0));
      g.addColorStop(1, col.belly || col.body);
      ctx.fillStyle = g;
      ctx.fillRect(-L, -H, L * 2, H * 2);
    }
    if (f.spotsColor) {
      const r = U.rng(U.hash(f.id + 'sp'));
      ctx.fillStyle = f.spotsColor;
      for (let i = 0; i < 40; i++) {
        U.ellipse(ctx, (r() - 0.5) * L, (r() - 0.6) * H * 0.7, 1.2 + r() * 1.5, 1 + r(), 0); ctx.fill();
      }
    }
    if (col.stripe) {
      ctx.fillStyle = col.stripe;
      ctx.fillRect(-L * 0.5, -H * 0.05, L, H * 0.08);
    }
    ctx.restore();
    finishSurface(lay, box, f, { top: -H * 0.5, bottom: H * 0.5, texture: f.shark ? 'smooth' : 'scales' });

    // Pectoral fin & gill
    ctx.fillStyle = U.shade(col.fins || col.body, -0.1);
    ctx.save();
    ctx.translate(L * 0.18, H * 0.12 + bend(L * 0.18));
    ctx.rotate(0.5 + Math.sin(phase * U.TAU * 2) * 0.25);
    ctx.beginPath();
    if (f.shark) { ctx.moveTo(0, 0); ctx.lineTo(-L * 0.16, H * 0.55); ctx.lineTo(-L * 0.04, H * 0.1); }
    else { U.ellipse(ctx, -L * 0.05, H * 0.05, L * 0.09, H * 0.12, 0); }
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    if (f.shark) {
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(L * (0.24 - i * 0.025), -H * 0.12); ctx.lineTo(L * (0.23 - i * 0.025), H * 0.15); ctx.stroke();
      }
    } else {
      ctx.beginPath(); ctx.arc(L * 0.26, 0, H * 0.32, -1, 1); ctx.stroke();
    }
    // Eye
    drawEye(ctx, L * (f.eyeX || 0.36), -H * (f.eyeY || 0.08), H * (f.eyeR || 0.1), col.eye || '#1a1a1a', { round: true, rim: col.eyeRim || '#222' });
    if (f.shark) {
      ctx.strokeStyle = 'rgba(40,40,40,0.6)';
      ctx.beginPath(); ctx.moveTo(L * 0.44, H * 0.18); ctx.quadraticCurveTo(L * 0.38, H * 0.24, L * 0.32, H * 0.2); ctx.stroke();
    }
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // CETACEAN (dolphin, orca) and PINNIPED (seal)
  // ===================================================================
  S.renderCetacean = function (d, phase, anim, scale) {
    const L = d.len, H = d.h;
    const box = { w: L * 1.7, h: H * 3.4, ox: L * 0.85, oy: H * 1.8 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = d.colors;
    const kick = Math.sin(phase * U.TAU) * (anim.moving ? 1 : 0.4);
    const bend = x => (x < 0 ? Math.pow(-x / (L * 0.5), 2) * kick * H * 0.35 : 0);
    const top = x => {
      const t = (x + L * 0.5) / L;
      return -H * 0.5 * Math.pow(Math.sin(Math.PI * U.clamp(t * 0.92 + 0.04, 0, 1)), 0.7);
    };
    // Fluke (seen side-on: a thin wedge that rotates with the kick)
    ctx.fillStyle = col.body;
    const fx = -L * 0.5, fy = bend(-L * 0.5);
    ctx.beginPath();
    ctx.moveTo(fx + 6, fy - 3);
    ctx.quadraticCurveTo(fx - L * 0.12, fy - H * 0.2 - kick * 6, fx - L * 0.18, fy - H * 0.05 - kick * 10);
    ctx.quadraticCurveTo(fx - L * 0.12, fy + 2, fx - L * 0.18, fy + H * 0.12 - kick * 6);
    ctx.quadraticCurveTo(fx - L * 0.1, fy + H * 0.2, fx + 6, fy + 3);
    ctx.fill();
    // Dorsal fin
    ctx.beginPath();
    const dx = d.dorsalX || 0;
    ctx.moveTo(L * dx + L * 0.08, top(L * dx) + 3);
    ctx.quadraticCurveTo(L * dx, top(L * dx) - H * (d.dorsalH || 0.55), L * dx - L * 0.1, top(L * dx) - H * (d.dorsalH || 0.55) * 1.05);
    ctx.quadraticCurveTo(L * dx - L * 0.05, top(L * dx) - H * 0.1, L * dx - L * 0.12, top(L * dx - L * 0.12) + 3);
    ctx.fill();
    // Body
    ctx.beginPath();
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const x = U.lerp(-L * 0.5, L * 0.5, i / N);
      i ? ctx.lineTo(x, top(x) + bend(x)) : ctx.moveTo(x, top(x) + bend(x));
    }
    if (d.beak) {
      ctx.quadraticCurveTo(L * 0.58, -H * 0.05, L * 0.62, H * 0.04);
      ctx.quadraticCurveTo(L * 0.56, H * 0.12, L * 0.48, H * 0.12);
    }
    for (let i = N; i >= 0; i--) {
      const x = U.lerp(-L * 0.5, L * 0.5, i / N);
      ctx.lineTo(x, -top(x) * 0.9 + bend(x));
    }
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    if (d.orca) {
      ctx.fillStyle = '#f4f6f8';
      // white belly sweep
      ctx.beginPath();
      ctx.moveTo(L * 0.45, H * 0.08);
      ctx.quadraticCurveTo(L * 0.1, H * 0.0, -L * 0.05, H * 0.25);
      ctx.quadraticCurveTo(-L * 0.22, H * 0.05, -L * 0.3, H * 0.15);
      ctx.lineTo(-L * 0.3, H); ctx.lineTo(L * 0.6, H); ctx.closePath(); ctx.fill();
      // eye patch
      U.ellipse(ctx, L * 0.3, -H * 0.18, L * 0.07, H * 0.08, -0.2); ctx.fill();
      // saddle patch
      ctx.fillStyle = 'rgba(200,205,215,0.7)';
      U.ellipse(ctx, -L * 0.1, -H * 0.42, L * 0.08, H * 0.08, 0); ctx.fill();
    } else {
      const g = ctx.createLinearGradient(0, -H * 0.5, 0, H * 0.5);
      g.addColorStop(0, col.back || col.body); g.addColorStop(0.5, col.body); g.addColorStop(0.75, col.belly); g.addColorStop(1, col.belly);
      ctx.fillStyle = g;
      ctx.fillRect(-L, -H, L * 2, H * 2);
    }
    ctx.restore();
    finishSurface(lay, box, d, { top: -H * 0.5, bottom: H * 0.5, texture: 'smooth' });
    // Flipper
    ctx.fillStyle = d.orca ? '#111' : U.shade(col.body, -0.15);
    ctx.save();
    ctx.translate(L * 0.22, H * 0.2);
    ctx.rotate(0.6 + kick * 0.1);
    ctx.beginPath(); ctx.ellipse(-L * 0.05, H * 0.1, L * 0.09, H * 0.13, 0.4, 0, U.TAU); ctx.fill();
    ctx.restore();
    // Eye & mouth
    drawEye(ctx, L * 0.36, -H * 0.04, H * 0.06, '#1c1c1c', { round: true });
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    const mx = d.beak ? L * 0.6 : L * 0.49;
    ctx.beginPath(); ctx.moveTo(mx, H * 0.05); ctx.quadraticCurveTo(mx - L * 0.08, H * 0.12, mx - L * 0.17, H * 0.06); ctx.stroke();
    // Blowhole
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    U.ellipse(ctx, L * 0.18, top(L * 0.18) + 2, 2, 1, 0); ctx.fill();
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  S.renderSeal = function (d, phase, anim, scale) {
    const L = d.len, H = d.h;
    const box = { w: L * 1.6, h: H * 2.8, ox: L * 0.8, oy: H * 2.2 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = d.colors;
    const hump = anim.moving ? Math.max(0, Math.sin(phase * U.TAU)) * H * 0.12 : Math.sin(phase * U.TAU) * 0.6;
    ctx.fillStyle = col.body;
    ctx.beginPath();
    U.smoothPath(ctx, [
      [L * 0.48, -H * 0.55 - hump * 0.5], [L * 0.3, -H * 0.75 - hump], [0, -H * 0.85 - hump], [-L * 0.3, -H * 0.6],
      [-L * 0.48, -H * 0.25], [-L * 0.62, -H * 0.12], [-L * 0.6, -H * 0.02], [-L * 0.35, 0], [L * 0.2, 0], [L * 0.45, -H * 0.15],
    ], true, 0.85);
    ctx.fill();
    // Head
    U.ellipse(ctx, L * 0.5, -H * 0.62 - hump * 0.4, H * 0.42, H * 0.36, 0.1); ctx.fill();
    U.ellipse(ctx, L * 0.7, -H * 0.55 - hump * 0.4, H * 0.24, H * 0.2, 0.1); ctx.fill();
    // Rear flippers
    ctx.beginPath();
    ctx.moveTo(-L * 0.58, -H * 0.12);
    ctx.lineTo(-L * 0.78, -H * 0.32);
    ctx.lineTo(-L * 0.8, -H * 0.02);
    ctx.closePath(); ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    if (d.saddle) {
      ctx.fillStyle = d.saddle;
      ctx.beginPath();
      // harp seal's dark "harp" saddle mark
      ctx.moveTo(L * 0.3, -H * 0.8);
      ctx.quadraticCurveTo(0, -H * 0.3, -L * 0.35, -H * 0.55);
      ctx.quadraticCurveTo(-L * 0.1, -H * 0.55, L * 0.1, -H * 0.85);
      ctx.fill();
      U.ellipse(ctx, L * 0.6, -H * 0.6, H * 0.4, H * 0.35, 0); ctx.fill();
    }
    if (col.belly) {
      const g = ctx.createLinearGradient(0, -H * 0.6, 0, 0);
      g.addColorStop(0, U.rgba(col.belly, 0)); g.addColorStop(1, col.belly);
      ctx.fillStyle = g; ctx.fillRect(-L, -H, L * 2, H);
    }
    if (d.spots) {
      const r = U.rng(9);
      ctx.fillStyle = 'rgba(60,60,70,0.45)';
      for (let i = 0; i < 30; i++) { U.ellipse(ctx, (r() - 0.5) * L, -r() * H * 0.8, 1 + r() * 2, 1 + r(), 0); ctx.fill(); }
    }
    ctx.restore();
    finishSurface(lay, box, d, { top: -H, bottom: 0, texture: 'fur' });
    // Fore flipper
    ctx.fillStyle = U.shade(col.body, -0.2);
    ctx.save();
    ctx.translate(L * 0.25, -H * 0.25);
    ctx.rotate(0.3 + (anim.moving ? Math.sin(phase * U.TAU) * 0.4 : 0));
    ctx.beginPath(); ctx.ellipse(0, H * 0.15, H * 0.12, H * 0.3, -0.2, 0, U.TAU); ctx.fill();
    ctx.restore();
    // Face
    drawEye(ctx, L * 0.6, -H * 0.72 - hump * 0.4, H * 0.1, '#050505', { round: true, rim: '#000' });
    ctx.fillStyle = '#1a1a1a';
    U.ellipse(ctx, L * 0.86, -H * 0.58 - hump * 0.4, H * 0.06, H * 0.05, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(L * 0.8, -H * 0.5 - hump * 0.4 + i); ctx.lineTo(L * 0.98, -H * 0.48 - hump * 0.4 + i * 3); ctx.stroke();
    }
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // SNAKE
  // ===================================================================
  S.renderSnake = function (sn, phase, anim, scale) {
    const L = sn.len, W = sn.w;
    const box = { w: L * 0.9, h: W * 9, ox: L * 0.45, oy: W * 5.5 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = sn.colors;
    const pts = [];
    const N = 40;
    const amp = W * (anim.moving ? 1.6 : 1.1);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = U.lerp(-L * 0.4, L * 0.38, t);
      const y = -W * 0.6 + Math.sin(t * Math.PI * 3 - phase * U.TAU) * amp * (0.35 + 0.65 * (1 - t)) * (t > 0.85 ? (1 - t) * 6 : 1);
      pts.push([x, y]);
    }
    // Head raised a little.
    const head = pts[N];
    ctx.fillStyle = col.body;
    U.taperPath(ctx, pts, W * 0.25, W * 1.0);
    ctx.fill();
    ctx.save();
    ctx.translate(head[0], head[1] - W * 0.1);
    ctx.beginPath();
    U.smoothPath(ctx, [[-W * 0.5, -W * 0.45], [W * 0.5, -W * 0.5], [W * 1.25, -W * 0.18], [W * 1.3, W * 0.15], [W * 0.5, W * 0.45], [-W * 0.5, W * 0.4]], true, 0.8);
    ctx.fill();
    ctx.restore();
    // Pattern along the spine
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    if (col.belly) {
      ctx.strokeStyle = col.belly;
      ctx.lineWidth = W * 0.3;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + W * 0.35 * (0.3 + 0.7 * i / N)) : ctx.moveTo(p[0], p[1] + W * 0.1)));
      ctx.stroke();
    }
    if (sn.spots) {
      for (let i = 2; i < N - 2; i += 2) {
        const p = pts[i];
        const w = W * (0.3 + 0.7 * i / N);
        ctx.fillStyle = col.spots;
        U.ellipse(ctx, p[0], p[1] - w * 0.1, w * 0.45, w * 0.35, 0); ctx.fill();
        if (sn.spots === 'ringed') { ctx.fillStyle = col.spotCenter || col.body; U.ellipse(ctx, p[0], p[1] - w * 0.1, w * 0.18, w * 0.13, 0); ctx.fill(); }
        if (i % 4 === 0) { ctx.fillStyle = col.spots; U.ellipse(ctx, p[0] + w * 0.6, p[1] + w * 0.32, w * 0.2, w * 0.15, 0); ctx.fill(); }
      }
    }
    if (sn.bands) {
      for (let i = 3; i < N; i += 3) {
        const p = pts[i];
        const w = W * (0.3 + 0.7 * i / N);
        ctx.fillStyle = col.spots;
        ctx.fillRect(p[0] - w * 0.18, p[1] - w, w * 0.36, w * 2);
      }
    }
    ctx.restore();
    finishSurface(lay, box, sn, { top: -W * 2, bottom: W, texture: 'scales' });
    // Eye, tongue, horns
    const hx = head[0] + W * 0.75, hy = head[1] - W * 0.3;
    drawEye(ctx, hx, hy, W * 0.14, col.eye || '#d8a23a', { slit: true, round: true, rim: '#2a2010' });
    if (sn.horns) {
      ctx.fillStyle = U.shade(col.body, -0.1);
      ctx.beginPath(); ctx.moveTo(hx - W * 0.1, hy - W * 0.12); ctx.lineTo(hx - W * 0.05, hy - W * 0.65); ctx.lineTo(hx + W * 0.12, hy - W * 0.15); ctx.fill();
    }
    if (Math.sin(phase * U.TAU * 2) > 0.3) {
      ctx.strokeStyle = '#b3203a'; ctx.lineWidth = 1.2;
      const tx = head[0] + W * 1.3, ty = head[1] + W * 0.05;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + W * 0.5, ty); ctx.lineTo(tx + W * 0.75, ty - W * 0.15);
      ctx.moveTo(tx + W * 0.5, ty); ctx.lineTo(tx + W * 0.75, ty + W * 0.15); ctx.stroke();
    }
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // FROG
  // ===================================================================
  S.renderFrog = function (fr, phase, anim, scale) {
    const s = fr.size;
    const box = { w: s * 4, h: s * 3.4, ox: s * 2, oy: s * 2.6 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = fr.colors;
    const hop = anim.moving ? Math.max(0, Math.sin(phase * U.TAU)) : 0;
    const lift = -hop * s * 0.9;
    const breathe = Math.sin(phase * U.TAU * 3) * s * 0.02;
    ctx.save();
    ctx.translate(0, lift);
    // Back leg (folded, or stretched during hop)
    ctx.fillStyle = col.legs || col.body;
    const ext = hop;
    ctx.beginPath();
    U.smoothPath(ctx, [[-s * 0.5, -s * 0.5], [-s * 0.95 - ext * s * 0.4, -s * 0.35 + ext * s * 0.3], [-s * 0.95 - ext * s * 0.6, -s * 0.05 + ext * s * 0.4],
      [-s * 0.2 - ext * s * 0.6, 0 + ext * s * 0.45], [s * 0.2 - ext * s * 0.5, -s * 0.05 + ext * s * 0.45], [-s * 0.1, -s * 0.2], [-s * 0.2, -s * 0.4]], true, 0.8);
    ctx.fill();
    // Body
    ctx.fillStyle = col.body;
    ctx.beginPath();
    U.smoothPath(ctx, [[s * 0.95, -s * 0.5], [s * 0.55, -s * 0.95 - breathe], [-s * 0.3, -s * 0.9], [-s * 0.8, -s * 0.5], [-s * 0.55, -s * 0.12], [s * 0.2, -s * 0.15], [s * 0.8, -s * 0.25]], true, 0.85);
    ctx.fill();
    // Front leg
    ctx.fillStyle = col.legs || col.body;
    ctx.beginPath();
    U.taperPath(ctx, [[s * 0.4, -s * 0.35], [s * 0.55, -s * 0.15], [s * 0.6 + ext * s * 0.2, 0]], s * 0.22, s * 0.12);
    ctx.fill();
    // Pattern
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    if (fr.pattern) drawPattern(ctx, fr, box);
    ctx.restore();
    finishSurface(lay, box, fr, { top: -s, bottom: 0, texture: 'smooth', skipPattern: true });
    // Toes pads
    ctx.fillStyle = col.legs || col.body;
    for (const tx of [s * 0.56, s * 0.66, s * 0.76]) { U.ellipse(ctx, tx + ext * s * 0.2, 0, s * 0.06, s * 0.05, 0); ctx.fill(); }
    // Eye (bulging)
    ctx.fillStyle = col.body;
    U.ellipse(ctx, s * 0.55, -s * 0.85, s * 0.2, s * 0.18, 0); ctx.fill();
    drawEye(ctx, s * 0.58, -s * 0.85, s * 0.13, col.eye || '#0a0a0a', { round: true, rim: '#000' });
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(s * 0.95, -s * 0.48); ctx.quadraticCurveTo(s * 0.7, -s * 0.42, s * 0.45, -s * 0.55); ctx.stroke();
    ctx.restore();
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // SEA TURTLE
  // ===================================================================
  S.renderTurtle = function (t, phase, anim, scale) {
    const s = t.size;
    const box = { w: s * 4, h: s * 3, ox: s * 2, oy: s * 1.5 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = t.colors;
    const stroke = Math.sin(phase * U.TAU);
    // Far flippers
    ctx.fillStyle = U.shade(col.skin, -0.3);
    ctx.save(); ctx.translate(s * 0.45, -s * 0.1); ctx.rotate(Math.PI + 0.25 - stroke * 0.5);
    ctx.beginPath(); ctx.ellipse(s * 0.6, 0, s * 0.75, s * 0.16, 0.15, 0, U.TAU); ctx.fill(); ctx.restore();
    // Head & neck
    ctx.fillStyle = col.skin;
    U.ellipse(ctx, s * 1.15, -s * 0.05, s * 0.32, s * 0.24, 0.1); ctx.fill();
    U.ellipse(ctx, s * 0.9, 0, s * 0.25, s * 0.2, 0); ctx.fill();
    // Rear flipper
    ctx.save(); ctx.translate(-s * 0.8, s * 0.15); ctx.rotate(0.4 + stroke * 0.2);
    ctx.beginPath(); ctx.ellipse(-s * 0.2, 0, s * 0.3, s * 0.12, 0, 0, U.TAU); ctx.fill(); ctx.restore();
    // Plastron (belly)
    ctx.fillStyle = col.plastron;
    U.ellipse(ctx, 0, s * 0.18, s * 0.95, s * 0.18, 0); ctx.fill();
    // Carapace
    ctx.fillStyle = col.shell;
    ctx.beginPath();
    U.smoothPath(ctx, [[s * 0.95, s * 0.08], [s * 0.7, -s * 0.45], [0, -s * 0.62], [-s * 0.7, -s * 0.45], [-s * 1.05, s * 0.02], [-s * 0.4, s * 0.2], [s * 0.4, s * 0.2]], true, 0.8);
    ctx.fill();
    ctx.save();
    ctx.clip();
    // Scutes
    const r = U.rng(4);
    for (let i = -2; i <= 2; i++) {
      for (let j = 0; j < 2; j++) {
        const cx = i * s * 0.38, cy = -s * 0.42 + j * s * 0.32;
        const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, s * 0.25);
        g.addColorStop(0, U.shade(col.shell, 0.25)); g.addColorStop(0.6, col.shell); g.addColorStop(1, U.shade(col.shell, -0.4));
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * U.TAU + 0.5;
          const px = cx + Math.cos(a) * s * 0.21, py = cy + Math.sin(a) * s * 0.17;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = U.shade(col.shell, 0.4); ctx.lineWidth = 1; ctx.stroke();
        // radiating streaks
        ctx.strokeStyle = 'rgba(40,20,5,0.35)';
        for (let k = 0; k < 6; k++) {
          ctx.beginPath(); ctx.moveTo(cx, cy); const a = r() * U.TAU; ctx.lineTo(cx + Math.cos(a) * s * 0.18, cy + Math.sin(a) * s * 0.14); ctx.stroke();
        }
      }
    }
    ctx.restore();
    finishSurface(lay, box, t, { top: -s * 0.6, bottom: s * 0.3, texture: false });
    // Near front flipper
    ctx.fillStyle = col.skin;
    ctx.save(); ctx.translate(s * 0.55, s * 0.05); ctx.rotate(Math.PI - 0.45 + stroke * 0.6);
    ctx.beginPath(); ctx.ellipse(s * 0.65, 0, s * 0.8, s * 0.17, 0.18, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(s * (0.2 + i * 0.18), 0, s * 0.06, 0, U.TAU); ctx.stroke(); }
    ctx.restore();
    // Head scales
    ctx.strokeStyle = 'rgba(40,30,10,0.55)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(s * (1.0 + i * 0.07), -s * 0.12, s * 0.07, 0, U.TAU); ctx.stroke(); }
    drawEye(ctx, s * 1.25, -s * 0.1, s * 0.06, '#2a1a0a', { round: true });
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.moveTo(s * 1.45, s * 0.02); ctx.lineTo(s * 1.25, s * 0.06); ctx.stroke();
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // OCTOPUS
  // ===================================================================
  S.renderOctopus = function (o, phase, anim, scale) {
    const s = o.size;
    const box = { w: s * 5, h: s * 4.4, ox: s * 2.5, oy: s * 2.2 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = o.colors;
    const pulse = Math.sin(phase * U.TAU);
    // Arms: trail behind (to the left) like a jetting octopus, curling.
    const armPts = [];
    for (let i = 0; i < 8; i++) {
      const pts = [];
      let x = s * 0.1, y = s * 0.25 + (i - 3.5) * s * 0.06;
      let a = Math.PI + (i - 3.5) * 0.22;
      for (let k = 0; k <= 16; k++) {
        pts.push([x, y]);
        a += Math.sin(phase * U.TAU + i * 0.9 + k * 0.4) * 0.12 + (k > 10 ? (i % 2 ? 0.18 : -0.18) : 0);
        x += Math.cos(a) * s * 0.14 * (1 - pulse * 0.1);
        y += Math.sin(a) * s * 0.14 + s * 0.015;
      }
      armPts.push(pts);
    }
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? U.shade(col.body, -0.25) : col.body;
      U.taperPath(ctx, armPts[i], s * 0.32, s * 0.03);
      ctx.fill();
    }
    // Mantle (head sac) behind eyes, angled up-back
    ctx.fillStyle = col.body;
    ctx.save();
    ctx.translate(s * 0.25, -s * 0.15);
    ctx.rotate(-0.5);
    ctx.beginPath();
    U.smoothPath(ctx, [[s * 0.4, s * 0.25], [s * 0.35, -s * 0.35], [-s * 0.2, -s * 0.75 - pulse * s * 0.05], [-s * 0.95, -s * 0.5], [-s * 1.05, 0], [-s * 0.6, s * 0.45], [0, s * 0.45]], true, 0.85);
    ctx.fill();
    ctx.restore();
    // Skin texture: papillae & mottling
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const r = U.rng(31);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = r() < 0.5 ? U.rgba(U.shade(col.body, -0.4), 0.5) : U.rgba(col.mottle || U.shade(col.body, 0.35), 0.5);
      U.ellipse(ctx, (r() - 0.6) * s * 3.5, (r() - 0.5) * s * 2.6, 1 + r() * s * 0.08, 1 + r() * s * 0.06, 0);
      ctx.fill();
    }
    ctx.restore();
    finishSurface(lay, box, o, { top: -s, bottom: s * 0.8, texture: 'smooth' });
    // Suckers on underside of near arms
    ctx.fillStyle = col.suckers || '#f1d6c8';
    for (const i of [0, 2, 4]) {
      const pts = armPts[i];
      for (let k = 2; k < 14; k += 2) {
        const w = U.lerp(s * 0.32, s * 0.03, k / 16) * 0.3;
        U.ellipse(ctx, pts[k][0], pts[k][1] + w * 1.2, w, w * 0.8, 0); ctx.fill();
      }
    }
    // Eye
    ctx.fillStyle = U.shade(col.body, 0.1);
    U.ellipse(ctx, s * 0.45, -s * 0.1, s * 0.2, s * 0.18, 0); ctx.fill();
    drawEye(ctx, s * 0.47, -s * 0.1, s * 0.12, '#d9b640', { hpupil: true, round: true, rim: U.shade(col.body, -0.4) });
    // Siphon
    ctx.fillStyle = U.shade(col.body, -0.15);
    U.ellipse(ctx, s * 0.0, s * 0.18, s * 0.14, s * 0.08, 0.4); ctx.fill();
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // SMALL CRITTERS (prey items): rodent, jerboa, insect, crab, scorpion
  // ===================================================================
  S.renderRodent = function (r0, phase, anim, scale) {
    const s = r0.size;
    const box = { w: s * 5.5, h: s * 4, ox: s * 2.5, oy: s * 3.2 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = r0.colors;
    const hop = r0.hopper && anim.moving ? Math.max(0, Math.sin(phase * U.TAU)) * s * 0.9 : 0;
    const scurry = !r0.hopper && anim.moving ? Math.sin(phase * U.TAU * 2) : 0;
    ctx.save();
    ctx.translate(0, -hop);
    ctx.fillStyle = col.body;
    // Tail
    if (r0.tailLen) {
      const pts = U.bezierPts([-s * 0.7, -s * 0.5], [-s * 1.5, -s * 0.3], [-s * (0.8 + r0.tailLen), -s * (0.2 + (r0.hopper ? 0.9 : 0.1))], null, 12);
      U.taperPath(ctx, pts, s * 0.12, s * 0.05);
      ctx.fill();
      if (r0.tailTuft) {
        const e = pts[pts.length - 1];
        ctx.fillStyle = r0.tailTuft;
        U.ellipse(ctx, e[0], e[1], s * 0.3, s * 0.14, -0.4); ctx.fill();
        ctx.fillStyle = '#fff';
        U.ellipse(ctx, e[0] - s * 0.15, e[1] - s * 0.05, s * 0.15, s * 0.1, -0.4); ctx.fill();
        ctx.fillStyle = col.body;
      }
    }
    // Hind leg
    if (r0.hopper) {
      ctx.beginPath();
      U.smoothPath(ctx, [[-s * 0.5, -s * 0.8], [-s * 0.1, -s * 0.5], [-s * 0.05, -s * 0.1], [s * 0.6, -s * 0.02], [s * 0.55, s * 0.04], [-s * 0.3, 0], [-s * 0.75, -s * 0.35]], true, 0.6);
      ctx.fill();
    }
    // Body
    ctx.beginPath();
    U.smoothPath(ctx, [[s * 0.75, -s * 0.55], [s * 0.3, -s * 1.0], [-s * 0.5, -s * 0.95], [-s * 0.9, -s * 0.5], [-s * 0.6, -s * 0.1], [s * 0.4, -s * 0.12]], true, 0.85);
    ctx.fill();
    // Head
    U.ellipse(ctx, s * 0.85, -s * 0.62, s * 0.42, s * 0.35, 0.15); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * 0.9, -s * 0.85); ctx.quadraticCurveTo(s * 1.4, -s * 0.6, s * 1.32, -s * 0.48); ctx.lineTo(s * 0.9, -s * 0.35); ctx.fill();
    // Ears
    const er = r0.earSize || 0.22;
    U.ellipse(ctx, s * 0.62, -s * (0.95 + er), s * er * 0.6, s * er * 1.1, -0.3); ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    if (col.belly) {
      const g = ctx.createLinearGradient(0, -s * 0.6, 0, 0);
      g.addColorStop(0, U.rgba(col.belly, 0)); g.addColorStop(0.5, col.belly); g.addColorStop(1, col.belly);
      ctx.fillStyle = g; ctx.fillRect(-s * 2, -s * 0.6, s * 4, s);
    }
    if (col.stripe) { ctx.fillStyle = col.stripe; ctx.fillRect(-s * 1.2, -s * 1.05, s * 2.2, s * 0.12); }
    ctx.restore();
    finishSurface(lay, box, r0, { top: -s * 1.2, bottom: 0, texture: 'fur' });
    // Front legs
    ctx.strokeStyle = U.shade(col.body, -0.2);
    ctx.lineWidth = s * 0.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.3); ctx.lineTo(s * 0.55 + scurry * s * 0.15, 0); ctx.stroke();
    if (!r0.hopper) { ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.3); ctx.lineTo(-s * 0.45 - scurry * s * 0.15, 0); ctx.stroke(); }
    ctx.fillStyle = col.earInner || '#e5a3a3';
    U.ellipse(ctx, s * 0.64, -s * (0.95 + er), s * er * 0.35, s * er * 0.8, -0.3); ctx.fill();
    drawEye(ctx, s * 0.98, -s * 0.72, s * 0.1, '#050505', { round: true, rim: '#000' });
    ctx.fillStyle = '#d88';
    U.ellipse(ctx, s * 1.32, -s * 0.5, s * 0.06, s * 0.05, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * 1.25, -s * 0.5); ctx.lineTo(s * 1.65, -s * 0.6 + i * s * 0.1); ctx.stroke(); }
    ctx.restore();
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  S.renderBug = function (b, phase, anim, scale) {
    const s = b.size;
    const box = { w: s * 5, h: s * 4, ox: s * 2.5, oy: s * 2.8 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx, col = b.colors;
    const wig = Math.sin(phase * U.TAU * 3);
    ctx.strokeStyle = U.shade(col.body, -0.3);
    ctx.lineWidth = Math.max(0.8, s * 0.07);
    ctx.lineCap = 'round';
    if (b.bugKind === 'scorpion') {
      // Legs
      for (let i = 0; i < 4; i++) {
        const x = -s * 0.3 + i * s * 0.3;
        ctx.beginPath(); ctx.moveTo(x, -s * 0.25); ctx.lineTo(x - s * 0.15 + wig * s * 0.05 * (i % 2 ? 1 : -1), -s * 0.5); ctx.lineTo(x - s * 0.3, 0); ctx.stroke();
      }
      ctx.fillStyle = col.body;
      // Body segments
      U.ellipse(ctx, 0, -s * 0.3, s * 0.7, s * 0.22, 0); ctx.fill();
      // Tail curling over the back
      const tail = [];
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI + i * 0.32 + wig * 0.04;
        tail.push([-s * 0.6 + Math.cos(a) * -s * 0.1 - i * s * 0.08 * Math.cos(i * 0.35), -s * 0.35 - Math.sin(i * 0.38) * s * 0.9]);
      }
      for (let i = 0; i < tail.length; i++) { U.ellipse(ctx, tail[i][0], tail[i][1], s * 0.13, s * 0.11, 0); ctx.fill(); }
      const tip = tail[tail.length - 1];
      ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.quadraticCurveTo(tip[0] + s * 0.35, tip[1] - s * 0.05, tip[0] + s * 0.3, tip[1] + s * 0.2); ctx.stroke();
      // Pincers
      for (const dy of [0, s * 0.08]) {
        ctx.beginPath(); ctx.moveTo(s * 0.6, -s * 0.3 + dy); ctx.lineTo(s * 0.95, -s * 0.45 + dy); ctx.stroke();
        U.ellipse(ctx, s * 1.1, -s * 0.45 + dy, s * 0.2, s * 0.1, -0.2); ctx.fill();
      }
    } else if (b.bugKind === 'crab') {
      ctx.strokeStyle = U.shade(col.body, -0.15);
      for (let i = 0; i < 4; i++) {
        for (const side of [-1, 1]) {
          const x = side * s * (0.3 + i * 0.12);
          ctx.beginPath(); ctx.moveTo(x * 0.6, -s * 0.3); ctx.lineTo(x + side * s * 0.25, -s * 0.5 + wig * 2 * side); ctx.lineTo(x + side * s * 0.4, 0); ctx.stroke();
        }
      }
      ctx.fillStyle = col.body;
      U.ellipse(ctx, 0, -s * 0.4, s * 0.65, s * 0.38, 0); ctx.fill();
      for (const side of [-1, 1]) {
        U.ellipse(ctx, side * s * 0.75, -s * 0.75, s * 0.25, s * 0.17, side * 0.5); ctx.fill();
      }
      ctx.fillStyle = '#111';
      for (const side of [-1, 1]) { U.ellipse(ctx, side * s * 0.15, -s * 0.85, s * 0.06, s * 0.06, 0); ctx.fill(); }
    } else {
      // Generic insect: ant / beetle / fly
      for (let i = 0; i < 3; i++) {
        const x = -s * 0.1 + i * s * 0.22;
        ctx.beginPath(); ctx.moveTo(x, -s * 0.25); ctx.lineTo(x + s * 0.15 + wig * s * 0.05 * (i % 2 ? 1 : -1), -s * 0.45); ctx.lineTo(x + s * 0.25, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, -s * 0.25); ctx.lineTo(x - s * 0.15 - wig * s * 0.05, -s * 0.4); ctx.lineTo(x - s * 0.28, 0); ctx.stroke();
      }
      ctx.fillStyle = col.body;
      if (b.bugKind === 'ant') {
        U.ellipse(ctx, -s * 0.55, -s * 0.32, s * 0.38, s * 0.26, 0); ctx.fill();
        U.ellipse(ctx, 0, -s * 0.32, s * 0.22, s * 0.15, 0); ctx.fill();
        U.ellipse(ctx, s * 0.42, -s * 0.36, s * 0.22, s * 0.2, 0); ctx.fill();
      } else {
        U.ellipse(ctx, -s * 0.1, -s * 0.35, s * 0.6, s * 0.35, 0); ctx.fill();
        U.ellipse(ctx, s * 0.55, -s * 0.33, s * 0.22, s * 0.2, 0); ctx.fill();
        if (b.bugKind === 'fly') {
          ctx.fillStyle = 'rgba(220,235,255,0.55)';
          ctx.save(); ctx.translate(0, -s * 0.6); ctx.rotate(-0.4 + wig * 0.6);
          U.ellipse(ctx, -s * 0.4, 0, s * 0.55, s * 0.2, 0); ctx.fill(); ctx.restore();
        }
      }
      ctx.beginPath(); ctx.moveTo(s * 0.6, -s * 0.45); ctx.quadraticCurveTo(s * 0.9, -s * 0.9, s * 1.05, -s * 0.8); ctx.stroke();
    }
    const g = ctx.createLinearGradient(0, -s, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = g; ctx.fillRect(-s * 2, -s * 2, s * 4, s * 2);
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // FOOD items for foraging games
  // ===================================================================
  S.renderFood = function (f, phase, anim, scale) {
    const s = f.size;
    const box = { w: s * 3, h: s * 3, ox: s * 1.5, oy: s * 2.2 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx;
    const sway = Math.sin(phase * U.TAU) * 0.08;
    const r = U.rng(U.hash(f.id));
    switch (f.foodKind) {
      case 'berries': {
        ctx.strokeStyle = '#4b3a20'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.2, -s * 0.8, 0, -s * 1.4); ctx.stroke();
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = '#3f7d34';
          ctx.save(); ctx.translate(0, -s * (0.5 + i * 0.35)); ctx.rotate((i % 2 ? 1 : -1) * 0.8 + sway);
          U.ellipse(ctx, s * 0.3, 0, s * 0.32, s * 0.13, 0); ctx.fill(); ctx.restore();
        }
        for (let i = 0; i < 9; i++) {
          const x = (r() - 0.5) * s * 0.9, y = -s * (0.4 + r() * 0.9);
          const g = ctx.createRadialGradient(x - 1, y - 1, 0.5, x, y, s * 0.16);
          g.addColorStop(0, f.color2 || '#9a7cf0'); g.addColorStop(1, f.color || '#3a2a7a');
          ctx.fillStyle = g; U.ellipse(ctx, x, y, s * 0.15, s * 0.15, 0); ctx.fill();
        }
        break;
      }
      case 'fruit': {
        ctx.fillStyle = '#2f6b2a';
        ctx.save(); ctx.rotate(sway); U.ellipse(ctx, s * 0.3, -s * 1.15, s * 0.35, s * 0.14, -0.4); ctx.fill(); ctx.restore();
        const g = ctx.createRadialGradient(-s * 0.2, -s * 0.8, 1, 0, -s * 0.55, s * 0.6);
        g.addColorStop(0, f.color2 || '#ffd27a'); g.addColorStop(1, f.color || '#d9581a');
        ctx.fillStyle = g; U.ellipse(ctx, 0, -s * 0.55, s * 0.5, s * 0.52, 0); ctx.fill();
        ctx.strokeStyle = '#4b3a20'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, -s * 1.05); ctx.lineTo(s * 0.05, -s * 1.25); ctx.stroke();
        break;
      }
      case 'leaves': {
        ctx.strokeStyle = '#5a4126'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.quadraticCurveTo(0, -s * 0.8, s, -s * 0.6); ctx.stroke();
        for (let i = 0; i < 14; i++) {
          const t = i / 13;
          const x = U.lerp(-s, s, t), y = U.lerp(-s * 0.3, -s * 0.6, t) - Math.sin(t * Math.PI) * s * 0.3;
          ctx.fillStyle = U.mix(f.color || '#6f9a3a', '#a7c45a', r());
          ctx.save(); ctx.translate(x, y); ctx.rotate((i % 2 ? -1 : 1) * 1.1 + sway);
          U.ellipse(ctx, s * 0.12, 0, s * 0.13, s * 0.06, 0); ctx.fill(); ctx.restore();
        }
        if (f.thorns) {
          ctx.strokeStyle = '#ece3c8'; ctx.lineWidth = 0.8;
          for (let i = 0; i < 6; i++) { const x = U.lerp(-s * 0.8, s * 0.8, i / 5); ctx.beginPath(); ctx.moveTo(x, -s * 0.55); ctx.lineTo(x + 2, -s * 0.8); ctx.stroke(); }
        }
        break;
      }
      case 'grass': case 'seagrass': {
        const blades = 9;
        for (let i = 0; i < blades; i++) {
          const x = (i - blades / 2) * s * 0.12;
          const h = s * (1.1 + r() * 0.7);
          const bend = (r() - 0.5) * s * 0.6 + sway * s * 3;
          ctx.fillStyle = U.mix(f.color || '#7aa63a', f.color2 || '#c9d77a', r() * 0.6);
          ctx.beginPath();
          ctx.moveTo(x - s * 0.05, 0);
          ctx.quadraticCurveTo(x + bend * 0.5, -h * 0.6, x + bend, -h);
          ctx.quadraticCurveTo(x + bend * 0.4, -h * 0.55, x + s * 0.06, 0);
          ctx.fill();
        }
        break;
      }
      case 'seeds': {
        for (let i = 0; i < 7; i++) {
          ctx.fillStyle = U.mix('#c79a5a', '#7a5228', r());
          U.ellipse(ctx, (r() - 0.5) * s, -s * 0.1 - r() * s * 0.2, s * 0.12, s * 0.07, r() * 3); ctx.fill();
        }
        break;
      }
      case 'acorn': {
        ctx.fillStyle = '#9c6a2f'; U.ellipse(ctx, 0, -s * 0.45, s * 0.32, s * 0.42, 0); ctx.fill();
        ctx.fillStyle = '#6b4a24'; U.ellipse(ctx, 0, -s * 0.8, s * 0.38, s * 0.2, 0); ctx.fill();
        ctx.strokeStyle = '#4b3418'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.08, -s * 1.15); ctx.stroke();
        break;
      }
      case 'plankton': {
        for (let i = 0; i < 12; i++) {
          const x = (r() - 0.5) * s * 1.6, y = -s * 0.6 + (r() - 0.5) * s * 1.2 + Math.sin(phase * U.TAU + i) * 2;
          const g = ctx.createRadialGradient(x, y, 0, x, y, s * 0.18);
          g.addColorStop(0, 'rgba(230,255,240,0.95)'); g.addColorStop(1, 'rgba(120,220,200,0)');
          ctx.fillStyle = g; U.ellipse(ctx, x, y, s * 0.18, s * 0.18, 0); ctx.fill();
        }
        break;
      }
      case 'dates': {
        ctx.strokeStyle = '#c48a2c'; ctx.lineWidth = 1.4;
        for (let i = 0; i < 6; i++) {
          const x = (i - 2.5) * s * 0.18;
          ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(x, -s * 0.5); ctx.stroke();
          ctx.fillStyle = U.mix('#7a3410', '#b0561c', r());
          U.ellipse(ctx, x, -s * 0.38, s * 0.1, s * 0.16, 0); ctx.fill();
        }
        break;
      }
    }
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  // ===================================================================
  // EXPLORER (player avatar) with outfits
  // ===================================================================
  S.renderExplorer = function (outfit, phase, anim, scale) {
    const box = { w: 120, h: 150, ox: 60, oy: 140 };
    const lay = makeLayer(box, scale);
    const ctx = lay.ctx;
    const o = S.OUTFITS[outfit] || S.OUTFITS.safari;
    const walk = anim.moving ? Math.sin(phase * U.TAU) : 0;
    const bob = anim.moving ? Math.abs(Math.cos(phase * U.TAU)) * 2.5 : Math.sin(phase * U.TAU) * 0.5;
    const swim = outfit === 'diver';
    ctx.save();
    if (swim) { ctx.translate(0, -40); ctx.rotate(-Math.PI / 2.4); ctx.translate(0, 40); }
    const hipY = -52 - bob;
    const legs = [[-1, walk], [1, -walk]];
    // Far leg + far arm first
    function leg(side, w, near) {
      const hx = side * 3, hy = hipY;
      const kx = hx + w * 9, ky = hipY + 24;
      const fx = hx + w * 15 - (w < 0 ? w * 6 : 0), fy = swim ? hipY + 50 : -Math.max(0, -w) * 6;
      ctx.strokeStyle = near ? o.pants : U.shade(o.pants, -0.25);
      ctx.lineCap = 'round'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy - 4); ctx.stroke();
      ctx.fillStyle = near ? o.boots : U.shade(o.boots, -0.3);
      if (swim) {
        ctx.beginPath(); ctx.moveTo(fx - 4, fy - 6); ctx.lineTo(fx + 18, fy + 4 + w * 4); ctx.lineTo(fx - 2, fy + 6); ctx.fill();
      } else {
        U.roundRect(ctx, fx - 5, fy - 9, 15, 9, 3); ctx.fill();
      }
    }
    function arm(side, w, near) {
      const sx = 2, sy = hipY - 30;
      const ex = sx - w * 10, ey = sy + 16;
      const hx = ex - w * 6 + 3, hy = ey + 14;
      ctx.strokeStyle = near ? o.shirt : U.shade(o.shirt, -0.25);
      ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = o.sleeveSkin ? (near ? o.skin : U.shade(o.skin, -0.2)) : (near ? o.shirt : U.shade(o.shirt, -0.25));
      ctx.lineWidth = 6.5;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = o.gloves || (near ? o.skin : U.shade(o.skin, -0.2));
      U.ellipse(ctx, hx, hy + 2, 4, 4.5, 0); ctx.fill();
    }
    leg(1, -walk, false);
    arm(1, -walk, false);
    // Backpack / tank
    ctx.fillStyle = o.pack;
    if (swim) { U.roundRect(ctx, -18, hipY - 40, 11, 36, 5); ctx.fill(); }
    else { U.roundRect(ctx, -17, hipY - 34, 12, 28, 4); ctx.fill(); ctx.fillStyle = U.shade(o.pack, -0.2); ctx.fillRect(-17, hipY - 18, 12, 4); }
    // Torso
    ctx.fillStyle = o.shirt;
    ctx.beginPath();
    U.smoothPath(ctx, [[-9, hipY + 2], [-10, hipY - 30], [-4, hipY - 36], [8, hipY - 34], [11, hipY - 20], [9, hipY + 2]], true, 0.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-9, hipY - 6, 19, 8);
    ctx.fillStyle = o.belt || '#4a3420'; ctx.fillRect(-9, hipY - 3, 19, 4);
    if (o.collar) { ctx.fillStyle = o.collar; ctx.beginPath(); ctx.moveTo(-3, hipY - 36); ctx.lineTo(6, hipY - 36); ctx.lineTo(2, hipY - 28); ctx.fill(); }
    // Binoculars strap
    if (!swim) {
      ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-6, hipY - 34); ctx.lineTo(7, hipY - 14); ctx.stroke();
      ctx.fillStyle = '#222'; U.roundRect(ctx, 4, hipY - 18, 7, 8, 2); ctx.fill();
    }
    leg(-1, walk, true);
    // Head
    const hx = 2, hy = hipY - 46;
    ctx.fillStyle = o.skin;
    U.ellipse(ctx, hx, hy, 8.5, 9.5, 0); ctx.fill();
    ctx.fillRect(hx - 3, hy + 6, 6, 6);
    if (o.hood) {
      ctx.fillStyle = o.hood;
      ctx.beginPath(); ctx.arc(hx - 1, hy, 12, Math.PI * 0.55, Math.PI * 2.25); ctx.lineTo(hx + 4, hy + 10); ctx.fill();
      ctx.fillStyle = o.fur || '#e8e2d6';
      ctx.beginPath(); ctx.arc(hx - 1, hy, 12, Math.PI * 1.55, Math.PI * 2.4); ctx.lineWidth = 4; ctx.strokeStyle = o.fur || '#e8e2d6'; ctx.stroke();
      ctx.fillStyle = o.skin; U.ellipse(ctx, hx + 2, hy + 1, 7, 8, 0); ctx.fill();
    } else {
      ctx.fillStyle = o.hair;
      ctx.beginPath(); ctx.arc(hx - 1, hy - 1, 9, Math.PI * 0.9, Math.PI * 1.9); ctx.fill();
      U.ellipse(ctx, hx - 7, hy + 1, 3, 6, 0); ctx.fill();
    }
    // face
    ctx.fillStyle = '#2a1a10';
    U.ellipse(ctx, hx + 5, hy - 1, 1.3, 1.6, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(80,40,30,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx + 4, hy + 5); ctx.quadraticCurveTo(hx + 6, hy + 6, hx + 7.5, hy + 4.5); ctx.stroke();
    ctx.fillStyle = U.shade(o.skin, -0.1); U.ellipse(ctx, hx + 8.5, hy + 1.5, 1.6, 2, 0); ctx.fill();
    if (swim) {
      ctx.fillStyle = 'rgba(140,210,240,0.55)'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      U.roundRect(ctx, hx - 1, hy - 6, 12, 9, 3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(hx - 12, hy - 2); ctx.quadraticCurveTo(hx - 14, hy - 16, hx - 4, hy - 12); ctx.stroke();
    }
    // Hat
    if (o.hat === 'safari') {
      ctx.fillStyle = U.shade(o.hatColor, -0.15);
      U.ellipse(ctx, hx, hy - 6, 15, 3.5, 0); ctx.fill();
      ctx.fillStyle = o.hatColor;
      ctx.beginPath(); ctx.ellipse(hx, hy - 8, 10, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a3c22'; ctx.fillRect(hx - 10, hy - 9, 20, 2.5);
    } else if (o.hat === 'beanie') {
      ctx.fillStyle = o.hatColor;
      ctx.beginPath(); ctx.ellipse(hx, hy - 4, 10, 9, 0, Math.PI, Math.PI * 2); ctx.fill();
    }
    arm(-1, walk, true);
    ctx.restore();
    finishSurface(lay, box, { id: 'explorer', colors: { base: o.shirt } }, { top: -140, bottom: 0, texture: false });
    return { canvas: lay.c, ox: box.ox * scale, oy: box.oy * scale, scale, box };
  };

  S.OUTFITS = {
    safari: { shirt: '#b89b6a', pants: '#7d6a48', boots: '#4a3322', skin: '#c68c5a', hair: '#3b2416', pack: '#6b5a3a', hat: 'safari', hatColor: '#d8c39a', collar: '#a88a58', sleeveSkin: true },
    forest: { shirt: '#4d6b3c', pants: '#5b4a35', boots: '#3a2a1c', skin: '#c68c5a', hair: '#3b2416', pack: '#8a5a2a', hat: 'safari', hatColor: '#7a6a48', collar: '#3d5630' },
    arctic: { shirt: '#c0392b', pants: '#2c3e50', boots: '#3d2b1f', skin: '#c68c5a', hair: '#3b2416', pack: '#34495e', hood: '#a93226', fur: '#efe9df', gloves: '#2c3e50' },
    diver: { shirt: '#1f2a36', pants: '#1f2a36', boots: '#f2c94c', skin: '#c68c5a', hair: '#3b2416', pack: '#c0c6cc', gloves: '#1f2a36', belt: '#f2c94c' },
    desert: { shirt: '#e3d3b0', pants: '#a58a5c', boots: '#6b4a2b', skin: '#c68c5a', hair: '#3b2416', pack: '#8d6e45', hat: 'safari', hatColor: '#f1e4c4', collar: '#cdbb94', sleeveSkin: true },
    jungle: { shirt: '#6e7f4a', pants: '#4d5a36', boots: '#3a2a1c', skin: '#c68c5a', hair: '#3b2416', pack: '#a0652e', hat: 'safari', hatColor: '#9a8a5a', collar: '#5b6a3c', sleeveSkin: true },
  };

  // ===================================================================
  // Dispatcher + frame cache
  // ===================================================================
  const RENDERERS = {
    quad: S.renderQuadruped, bird: S.renderBird, fish: S.renderFish, cetacean: S.renderCetacean,
    seal: S.renderSeal, snake: S.renderSnake, frog: S.renderFrog, turtle: S.renderTurtle,
    octopus: S.renderOctopus, rodent: S.renderRodent, bug: S.renderBug, food: S.renderFood,
  };

  const cache = new Map();
  S.FRAMES = 12;

  // spec: art spec object with .kind; mode: 'idle'|'walk'|'run'|'fly'; size: target height in px
  S.frame = function (spec, mode, frameIdx, quality) {
    const q = quality || 1;
    const key = spec.id + '|' + mode + '|' + frameIdx + '|' + q;
    let f = cache.get(key);
    if (f) return f;
    const anim = { moving: mode !== 'idle', run: mode === 'run', flying: mode === 'fly' };
    const phase = frameIdx / S.FRAMES;
    let res;
    if (spec.kind === 'bird') {
      spec._flyingPose = anim.flying;
      res = S.renderBird(spec, phase, anim, q);
    } else if (spec.kind === 'explorer') {
      res = S.renderExplorer(spec.outfit, phase, anim, q);
    } else {
      res = RENDERERS[spec.kind](spec, phase, anim, q);
    }
    // Trim transparent bounds to keep the cache small and drawing cheap.
    f = trim(res);
    cache.set(key, f);
    return f;
  };

  function trim(res) {
    const c = res.canvas;
    const ctx = c.getContext('2d');
    const { width: w, height: h } = c;
    const data = ctx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        if (data[(y * w + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return { canvas: c, ox: res.ox, oy: res.oy, w, h };
    x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(w - 1, x1 + 3); y1 = Math.min(h - 1, y1 + 3);
    const out = U.canvas(x1 - x0 + 1, y1 - y0 + 1);
    out.getContext('2d').drawImage(c, -x0, -y0);
    return { canvas: out, ox: res.ox - x0, oy: res.oy - y0, w: out.width, h: out.height, scale: res.scale };
  }

  // Draw a creature at (x, y) = ground contact point, `height` = desired on-screen height of
  // the art's natural size multiplied by `zoom`. dir: 1 faces right, -1 faces left.
  S.draw = function (ctx, spec, mode, t, x, y, zoom, dir, opts) {
    opts = opts || {};
    const fps = opts.fps || (mode === 'run' ? 18 : mode === 'idle' ? 5 : 11);
    const idx = Math.floor((t * fps + (opts.offset || 0))) % S.FRAMES;
    const quality = opts.quality || (zoom > 1.2 ? 2 : 1);
    const f = S.frame(spec, mode, (idx + S.FRAMES) % S.FRAMES, quality);
    const k = zoom / (f.scale || quality);
    ctx.save();
    ctx.translate(x, y);
    if (dir < 0) ctx.scale(-1, 1);
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    ctx.drawImage(f.canvas, -f.ox * k, -f.oy * k, f.w * k, f.h * k);
    ctx.restore();
    return f;
  };

  // Static portrait (idle frame 0) at a given quality, for journal & cards.
  S.portrait = function (spec, quality) {
    return S.frame(spec, spec.kind === 'bird' && spec.portraitFly ? 'fly' : 'idle', 0, quality || 2);
  };

  S.silhouetteOf = function (spec, quality) {
    const key = spec.id + '|sil|' + (quality || 2);
    let f = cache.get(key);
    if (f) return f;
    const p = S.portrait(spec, quality);
    f = Object.assign({}, p, { canvas: U.silhouette(p.canvas, '#1b2a26') });
    cache.set(key, f);
    return f;
  };

  // Ground shadow helper
  S.shadow = function (ctx, x, y, w, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, w);
    g.addColorStop(0, `rgba(0,0,0,${alpha || 0.3})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y); ctx.scale(1, 0.28); ctx.translate(-x, -y);
    ctx.beginPath(); ctx.arc(x, y, w, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  WE.Sprites = S;
})(window.WE);
