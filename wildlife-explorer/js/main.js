// Game loop and mode switching: title -> explore <-> observe / arena, travel (warp).
(function (WE) {
  const U = WE.U, In = WE.Input, B = WE.BG;
  const G = { mode: 'title', overlays: 0, t: 0, shake: 0, dpr: 1, W: 0, H: 0, safeR: 0, safeB: 0 };

  G.init = function () {
    G.canvas = document.getElementById('game');
    G.ctx = G.canvas.getContext('2d');
    WE.State.load();
    WE.Audio.enabled = WE.State.data.sound;
    WE.UI.init(document.getElementById('ui'));
    In.attachCanvas(G.canvas);
    window.addEventListener('resize', G.resize);
    G.resize();
    // Title screen: the current habitat scrolls by behind the logo.
    WE.Explore.enter(WE.State.data.habitat);
    WE.UI.title();
    G.last = performance.now();
    requestAnimationFrame(G.loop);
    document.addEventListener('pointerdown', () => WE.Audio.init(), { once: true });
    document.addEventListener('keydown', () => WE.Audio.init(), { once: true });
  };

  G.resize = function () {
    G.dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = G.canvas.getBoundingClientRect();
    G.W = r.width; G.H = r.height;
    G.canvas.width = Math.round(G.W * G.dpr);
    G.canvas.height = Math.round(G.H * G.dpr);
    const cs = getComputedStyle(document.documentElement);
    G.safeR = parseFloat(cs.getPropertyValue('--safe-r')) || 0;
    G.safeB = parseFloat(cs.getPropertyValue('--safe-b')) || 0;
  };

  G.pushOverlay = () => { G.overlays++; };
  G.popOverlay = () => { G.overlays = Math.max(0, G.overlays - 1); G.last = performance.now(); };
  G.paused = () => G.overlays > 0;

  G.loop = function (now) {
    const dt = Math.min(0.05, (now - G.last) / 1000);
    G.last = now;
    G.t += dt;
    G.shake = Math.max(0, G.shake - dt);
    const ctx = G.ctx;
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    try {
      if (!G.paused()) G.update(dt);
      G.render(ctx);
    } catch (e) {
      console.error(e);
    }
    In.endFrame();
    requestAnimationFrame(G.loop);
  };

  G.update = function (dt) {
    switch (G.mode) {
      case 'title': {
        const E = WE.Explore;
        E.t += dt;
        E.camX = (E.camX + dt * 40) % (E.WORLD_W - E.viewW());
        for (const e of E.entities) e.drawY = e.y;
        break;
      }
      case 'explore':
        if (In.hit('journal')) { WE.Journal.open('animals'); return; }
        if (In.hit('map')) { WE.Journal.open('map'); return; }
        WE.Explore.update(dt);
        break;
      case 'observe': WE.Observe.update(dt); break;
      case 'arena': WE.Arena.update(dt); break;
      case 'warp': G.updateWarp(dt); break;
    }
  };

  G.render = function (ctx) {
    const W = G.W, H = G.H;
    switch (G.mode) {
      case 'title': case 'explore': WE.Explore.render(ctx, W, H); break;
      case 'observe': WE.Observe.render(ctx, W, H); break;
      case 'arena': WE.Arena.render(ctx, W, H); break;
      case 'warp': G.renderWarp(ctx, W, H); break;
    }
  };

  // ---------------- Mode changes ----------------
  G.worldOf = habId => WE.habitatById(habId).world;
  G.currentWorld = () => G.worldOf(G.mode === 'explore' || G.mode === 'title' ? WE.Explore.hab.id : WE.State.data.habitat);

  // Start (or continue) an expedition in today's world or in prehistoric times.
  G.begin = function (world) {
    WE.UI.hideTitle();
    WE.Audio.setEnabled(WE.State.data.sound);
    const st = WE.State.data;
    world = world || G.worldOf(st.habitat);
    const target = world === 'prehistoric' ? st.lastEra : st.lastModern;
    if (G.worldOf(st.habitat) !== world || G.worldOf(WE.Explore.hab.id) !== world) G.travel(target);
    else G.startExplore(target);
    if (WE.Input.isTouch && G.H > G.W * 1.2) setTimeout(() => G.mode === 'explore' && WE.UI.toast('Tip: turn your device sideways for a wider view.', 5000), 8000);
    const introKey = world === 'prehistoric' ? 'seenIntroPre' : 'seenIntro';
    if (!st[introKey]) {
      st[introKey] = true; WE.State.save();
      const msg = world === 'prehistoric'
        ? '<b>Welcome to Hell Creek, 66 million years ago!</b> Look for the <b>?</b> bubbles, sneak close and press Observe to photograph prehistoric creatures.'
        : '<b>Welcome to the Serengeti!</b> Walk around and look for the <b>?</b> bubbles. Get close and press Observe to photograph an animal.';
      const show = () => { if (G.mode === 'explore') WE.UI.toast(msg, 8000); else setTimeout(show, 500); };
      setTimeout(show, 900);
    }
  };

  G.startExplore = function (habId, fromArena) {
    G.mode = 'explore';
    if (!fromArena || WE.Explore.hab.id !== habId) WE.Explore.enter(habId);
    const st = WE.State.data;
    st.habitat = habId;
    if (G.worldOf(habId) === 'prehistoric') st.lastEra = habId; else st.lastModern = habId;
    WE.State.save();
    WE.UI.showHUD(WE.Explore.hab);
    WE.Audio.ambience(habId);
  };

  G.startObserve = function (ent) {
    G.mode = 'observe';
    WE.Observe.enter(ent);
  };
  G.finishObserve = function (a, photo, ent) {
    WE.Observe.exit();
    const res = WE.State.discover(a.id, photo);
    G.mode = 'explore';
    WE.UI.showHUD(WE.Explore.hab);
    WE.UI.discovery(a, photo, res);
  };
  G.cancelObserve = function (ent, timedOut) {
    WE.Observe.exit();
    G.mode = 'explore';
    WE.UI.showHUD(WE.Explore.hab);
    if (timedOut) {
      WE.Explore.scare(ent);
      WE.UI.toast('<b>It slipped away!</b> Follow it and try again. Keep the circle on the animal until the bar fills.');
    }
  };

  G.startArena = function (a, loadout) {
    WE.UI.hideHUD();
    WE.UI.warpLabel(`Getting ready to play as the <b>${a.name}</b>…`);
    // Pre-render this challenge's animation frames before it starts.
    G.prewarm(WE.Arena.warmList(a), () => {
      WE.UI.warpLabel(null);
      G.mode = 'arena';
      WE.Arena.enter({ animal: a, loadout });
    });
  };
  G.endArena = function () {
    WE.Arena.exit();
    G.startExplore(WE.State.data.habitat, true);
  };

  // Render sprite frames in small slices so the page stays responsive.
  G.prewarm = function (list, done) {
    const jobs = [];
    for (const [art, mode] of list) for (let i = 0; i < WE.Sprites.FRAMES; i++) jobs.push([art, mode, i]);
    let k = 0;
    const step = () => {
      const t0 = performance.now();
      while (k < jobs.length && performance.now() - t0 < 12) { const [a, m, i] = jobs[k++]; WE.Sprites.frame(a, m, i, 1); }
      if (k < jobs.length) setTimeout(step, 0); else done();
    };
    step();
  };

  // ---------------- Travel (WildDex warp across the world map) ----------------
  G.travel = function (habId) {
    const from = WE.habitatById(G.mode === 'explore' || G.mode === 'title' ? WE.Explore.hab.id : WE.State.data.habitat);
    const to = WE.habitatById(habId);
    WE.UI.hideHUD(); WE.UI.hideTitle();
    WE.UI.toastBox.innerHTML = '';
    WE.Audio.stopAmbience();
    WE.Audio.play('warp');
    // Journeys into (or out of, or between) prehistoric times go through the time tunnel.
    const time = from.world === 'prehistoric' || to.world === 'prehistoric';
    G.warp = { from, to, t: 0, dur: from.id === to.id ? 1.2 : time ? 3.8 : 3.2, ready: false, time };
    G.mode = 'warp';
    WE.UI.warpLabel(time
      ? `Time-travelling to <b>${to.name}</b> · ${to.world === 'prehistoric' ? to.mya + ' million years ago' : 'today'}`
      : `Travelling to <b>${to.name}</b> · ${to.region}`);
    G.prewarm(WE.Explore.warmList(habId), () => { B.layers(habId); G.warp.ready = true; });
  };
  G.updateWarp = function (dt) {
    const w = G.warp;
    w.t += dt;
    if (w.t >= w.dur && w.ready) {
      WE.UI.warpLabel(null);
      G.startExplore(w.to.id);
      const st = WE.State;
      const when = w.to.world === 'prehistoric' ? ` · ${w.to.mya} million years ago (${w.to.period})` : '';
      WE.UI.toast(`<b>${w.to.name}${when}</b><br>${w.to.blurb}`, 7000);
      if (st.foundCount(w.to.id) === 0) setTimeout(() => G.mode === 'explore' && WE.UI.toast(w.to.facts[1], 6000), 1500);
    }
  };
  G.renderWarp = function (ctx, W, H) {
    if (G.warp.time) { G.renderTimeWarp(ctx, W, H); return; }
    G.renderMapWarp(ctx, W, H);
  };

  // Time tunnel: rings rush past while a counter runs through the millions of years.
  G.renderTimeWarp = function (ctx, W, H) {
    const w = G.warp;
    const k = U.clamp(w.t / w.dur, 0, 1);
    const e = U.easeInOut(U.clamp(k / 0.85, 0, 1));
    const fromM = w.from.world === 'prehistoric' ? w.from.mya : 0;
    const toM = w.to.world === 'prehistoric' ? w.to.mya : 0;
    const cur = U.lerp(fromM, toM, e);
    const period = cur < 0.5 ? null : (WE.PERIODS.find(p => cur <= p.from && cur >= p.to) || { name: 'Age of mammals', color: '#8a6aa0' });
    const col = period ? period.color : '#3a8a8a';
    const cx = W / 2, cy = H * 0.44, maxR = Math.hypot(W, H) * 0.6;
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    bg.addColorStop(0, '#fff6dc'); bg.addColorStop(0.08, U.shade(col, 0.2)); bg.addColorStop(0.5, U.shade(col, -0.55)); bg.addColorStop(1, '#0a1410');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const t = w.t;
    for (let i = 0; i < 26; i++) {
      const d = ((i / 26) + t * 0.55) % 1;
      const r = Math.pow(d, 2.2) * maxR;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(t * 0.6 + i * 0.4);
      ctx.strokeStyle = U.rgba(i % 3 ? '#fff2c8' : U.shade(col, 0.4), d * 0.55);
      ctx.lineWidth = 1 + d * 7;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.82, 0, 0, U.TAU * 0.86); ctx.stroke();
      ctx.restore();
    }
    const rr = U.rng(17);
    for (let i = 0; i < 70; i++) {
      const a = rr() * U.TAU, d = ((rr() + t * (0.4 + rr() * 0.6)) % 1);
      const r0 = Math.pow(d, 2) * maxR, r1 = r0 + 10 + d * 40;
      ctx.strokeStyle = `rgba(255,250,230,${d * 0.7})`; ctx.lineWidth = 1 + d * 2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
    }
    // Counter
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12;
    const big = Math.min(96, W * 0.12);
    ctx.font = `800 ${big}px "Baloo 2", sans-serif`;
    ctx.fillText(cur < 0.5 ? 'Today' : `${Math.round(cur)}`, cx, cy + big * 0.3);
    ctx.font = `700 ${Math.round(big * 0.28)}px "Nunito Sans", sans-serif`;
    ctx.fillText(cur < 0.5 ? 'the present day' : 'million years ago', cx, cy + big * 0.75);
    if (period) { ctx.font = `600 ${Math.round(big * 0.24)}px "IBM Plex Mono", monospace`; ctx.fillText(period.name.toUpperCase() + ' PERIOD', cx, cy - big * 0.75); }
    ctx.shadowBlur = 0;
    // Timeline: 252 million years ago (left) to today (right)
    const tw = Math.min(W - 40, 760), tx = cx - tw / 2, ty = H - 120, th = 14;
    const X = m => tx + (1 - m / 252) * tw;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; U.roundRect(ctx, tx - 10, ty - 34, tw + 20, 74, 12); ctx.fill();
    for (const p of [...WE.PERIODS, { name: 'Age of mammals', from: 66, to: 0, color: '#8a6aa0' }]) {
      ctx.fillStyle = p.color; ctx.fillRect(X(p.from), ty, X(p.to) - X(p.from), th);
      ctx.fillStyle = '#f3efdf'; ctx.font = '700 12px "Nunito Sans", sans-serif';
      ctx.fillText(p.name, (X(p.from) + X(p.to)) / 2, ty - 10);
    }
    ctx.fillStyle = '#ff8a3d';
    ctx.beginPath(); ctx.moveTo(X(cur), ty + th + 2); ctx.lineTo(X(cur) - 8, ty + th + 16); ctx.lineTo(X(cur) + 8, ty + th + 16); ctx.closePath(); ctx.fill();
    ctx.fillRect(X(cur) - 1.5, ty - 4, 3, th + 8);
    if (k > 0.85) { ctx.fillStyle = `rgba(255,255,255,${(k - 0.85) / 0.15})`; ctx.fillRect(0, 0, W, H); }
  };

  G.renderMapWarp = function (ctx, W, H) {
    const w = G.warp;
    const k = U.clamp(w.t / w.dur, 0, 1);
    const mw = Math.max(W, H * 2) * 1.0, mh = mw / 2.15;
    const map = WE.WorldMap.render(Math.round(mw), Math.round(mh));
    const [ax, ay] = WE.WorldMap.project(w.from.lon, w.from.lat, mw, mh);
    const [bx, by] = WE.WorldMap.project(w.to.lon, w.to.lat, mw, mh);
    // Camera: zoom out from the start, travel, zoom in on the destination.
    const e = U.easeInOut(k);
    // Scale never lets the map edge show; the camera is clamped to the map.
    const sc = Math.max((2.4 - Math.sin(k * Math.PI) * 1.5) * (W / mw) * 1.6, W / mw, H / mh);
    const zoom = sc / ((W / mw) * 1.6);
    const cx = U.clamp(U.lerp(ax, bx, e), W / (2 * sc), mw - W / (2 * sc));
    const cy = U.clamp(U.lerp(ay, by, e), H / (2 * sc), mh - H / (2 * sc));
    ctx.fillStyle = '#12261e'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(sc, sc);
    ctx.translate(-cx, -cy);
    ctx.drawImage(map, 0, 0);
    // Flight arc
    const mx = (ax + bx) / 2, my = Math.min(ay, by) - Math.abs(bx - ax) * 0.25 - 30;
    const pts = U.bezierPts([ax, ay], [mx, my], [bx, by], null, 60);
    const n = Math.floor(pts.length * Math.min(1, e * 1.05));
    ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 3 / zoom; ctx.setLineDash([8 / zoom, 6 / zoom]);
    ctx.beginPath(); pts.slice(0, n + 1).forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.setLineDash([]);
    const head = pts[Math.min(pts.length - 1, n)];
    const g = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 22 / zoom);
    g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(1, 'rgba(255,138,61,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(head[0], head[1], 22 / zoom, 0, U.TAU); ctx.fill();
    for (const [hx, hy, h] of [[ax, ay, w.from], [bx, by, w.to]]) {
      ctx.fillStyle = h.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 / zoom;
      ctx.beginPath(); ctx.arc(hx, hy, 7 / zoom, 0, U.TAU); ctx.fill(); ctx.stroke();
      ctx.font = `700 ${15 / zoom}px "Baloo 2", sans-serif`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.lineWidth = 4 / zoom; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(h.name, hx, hy - 14 / zoom); ctx.fillText(h.name, hx, hy - 14 / zoom);
    }
    ctx.restore();
    // Device scan lines & fade
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    if (k > 0.85) { ctx.fillStyle = `rgba(255,255,255,${(k - 0.85) / 0.15})`; ctx.fillRect(0, 0, W, H); }
  };

  window.addEventListener('load', G.init);
  WE.Game = G;
})(window.WE);
