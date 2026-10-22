// Shared helpers: math, seeded randomness, color, and canvas utilities.
window.WE = window.WE || {};

(function (WE) {
  const U = {};

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, v) => (v - a) / (b - a);
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
  U.easeOut = t => 1 - Math.pow(1 - t, 3);
  U.easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  U.TAU = Math.PI * 2;
  U.deg = d => (d * Math.PI) / 180;

  // Mulberry32 seeded PRNG so procedural art is identical every load.
  U.rng = function (seed) {
    let a = typeof seed === 'string' ? U.hash(seed) : seed >>> 0;
    const r = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (lo, hi) => lo + r() * (hi - lo);
    r.int = (lo, hi) => Math.floor(lo + r() * (hi - lo + 1));
    r.pick = arr => arr[Math.floor(r() * arr.length)];
    r.sign = () => (r() < 0.5 ? -1 : 1);
    return r;
  };

  U.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  // Smooth 1D value noise, handy for terrain silhouettes.
  U.noise1 = function (seed) {
    const r = U.rng(seed);
    const vals = [];
    for (let i = 0; i < 256; i++) vals.push(r());
    return function (x) {
      const i = Math.floor(x), f = x - i;
      const a = vals[((i % 256) + 256) % 256], b = vals[(((i + 1) % 256) + 256) % 256];
      const s = f * f * (3 - 2 * f);
      return a + (b - a) * s;
    };
  };

  // Periodic fractal noise: wraps every `period` units so layers tile seamlessly.
  U.periodicNoise = function (seed, period) {
    const r = U.rng(seed);
    const vals = [];
    for (let i = 0; i < period; i++) vals.push(r());
    return function (x) {
      const i = Math.floor(x), f = x - i;
      const a = vals[((i % period) + period) % period], b = vals[(((i + 1) % period) + period) % period];
      const s = f * f * (3 - 2 * f);
      return a + (b - a) * s;
    };
  };

  // ---- Color helpers --------------------------------------------------
  U.hexToRgb = function (hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgbToHex = (r, g, b) =>
    '#' + [r, g, b].map(v => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  U.mix = function (c1, c2, t) {
    const a = U.hexToRgb(c1), b = U.hexToRgb(c2);
    return U.rgbToHex(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t));
  };
  U.shade = (c, amt) => (amt >= 0 ? U.mix(c, '#ffffff', amt) : U.mix(c, '#000000', -amt));
  U.rgba = function (hex, a) {
    const c = U.hexToRgb(hex);
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  };

  // ---- Canvas helpers -------------------------------------------------
  U.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };

  U.ellipse = function (ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, U.TAU);
  };

  // Smooth closed curve through points (Catmull-Rom -> Bezier).
  U.smoothPath = function (ctx, pts, closed = true, tension = 0.5) {
    const n = pts.length;
    if (n < 2) return;
    ctx.moveTo(pts[0][0], pts[0][1]);
    const get = i => (closed ? pts[(i + n) % n] : pts[U.clamp(i, 0, n - 1)]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const t = tension / 3;
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t,
        p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t,
        p2[0], p2[1]
      );
    }
    if (closed) ctx.closePath();
  };

  // Tapered stroke along a polyline (used for tails, trunks, tentacles, vines).
  U.taperPath = function (ctx, pts, w0, w1) {
    const n = pts.length;
    if (n < 2) return;
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
      const w = U.lerp(w0, w1, i / (n - 1)) / 2;
      left.push([p[0] + Math.cos(ang) * w, p[1] + Math.sin(ang) * w]);
      right.push([p[0] - Math.cos(ang) * w, p[1] - Math.sin(ang) * w]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < n; i++) {
      const p = left[i - 1], q = left[i];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.lineTo(left[n - 1][0], left[n - 1][1]);
    const tip = pts[n - 1];
    ctx.quadraticCurveTo(tip[0] + (tip[0] - pts[n - 2][0]) * 0.3, tip[1] + (tip[1] - pts[n - 2][1]) * 0.3, right[n - 1][0], right[n - 1][1]);
    for (let i = n - 2; i >= 0; i--) {
      const p = right[i + 1], q = right[i];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.lineTo(right[0][0], right[0][1]);
    ctx.closePath();
  };

  // Points along a quadratic/cubic bezier, for building taper paths.
  U.bezierPts = function (p0, p1, p2, p3, steps) {
    const out = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, u = 1 - t;
      if (p3) {
        out.push([
          u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ]);
      } else {
        out.push([
          u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
          u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
        ]);
      }
    }
    return out;
  };

  // Two-bone inverse kinematics: returns the joint position between a root and an end point.
  U.ik = function (ax, ay, bx, by, l1, l2, bendDir) {
    let d = Math.hypot(bx - ax, by - ay);
    d = U.clamp(d, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
    const a = Math.atan2(by - ay, bx - ax);
    const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
    const ang = a + Math.acos(U.clamp(cosA, -1, 1)) * bendDir;
    return [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1];
  };

  // Return a tinted silhouette copy of a canvas (used for outlines & undiscovered entries).
  U.silhouette = function (src, color) {
    const c = U.canvas(src.width, src.height);
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  };

  // Draw a canvas with a thin outline around its opaque pixels.
  U.outlined = function (src, color, px) {
    const pad = Math.ceil(px) + 1;
    const c = U.canvas(src.width + pad * 2, src.height + pad * 2);
    const x = c.getContext('2d');
    const sil = U.silhouette(src, color);
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * U.TAU;
      x.drawImage(sil, pad + Math.cos(a) * px, pad + Math.sin(a) * px);
    }
    x.drawImage(src, pad, pad);
    return { canvas: c, pad };
  };

  // Fur/feather texture: many short strokes following a direction, clipped by the caller.
  U.furStrokes = function (ctx, x0, y0, w, h, opts) {
    // Strokes are batched into a few paths (2 colours x 3 opacity levels) for speed.
    const r = U.rng(opts.seed || 1);
    const n = opts.count || Math.floor((w * h) / 30);
    const len = opts.len || 4;
    const paths = [[], []].map(() => [new Path2D(), new Path2D(), new Path2D()]);
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * w, y = y0 + r() * h;
      const a = (opts.angle || 0) + (r() - 0.5) * (opts.spread || 0.6);
      const l = len * (0.5 + r());
      const p = paths[r() < 0.5 ? 0 : 1][Math.floor(r() * 3)];
      p.moveTo(x, y);
      p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    }
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = opts.width || 1;
    const base = opts.alpha || 0.25;
    for (let c = 0; c < 2; c++) {
      ctx.strokeStyle = c ? opts.light : opts.dark;
      for (let k = 0; k < 3; k++) { ctx.globalAlpha = base * (0.55 + k * 0.22); ctx.stroke(paths[c][k]); }
    }
    ctx.restore();
  };

  U.roundRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  U.el = function (tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) continue;
        if (k === 'class') e.className = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) for (const c of children) if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return e;
  };

  WE.U = U;
})(window.WE);
