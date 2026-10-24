// Exploration: walk (or swim) through a side-scrolling habitat and find animals.
(function (WE) {
  const U = WE.U, B = WE.BG, S = WE.Sprites, In = WE.Input;
  const WORLD_W = 4800;
  const OBSERVE_DIST = 240;

  const E = { entities: [], player: null, camX: 0, t: 0, hab: null, startleTip: false, scale: 1 };

  function naturalHeight(art) { return S.frame(art, 'idle', 0, 1).h; }
  // On-screen heights for prehistoric background animals.
  const AMBIENT_H = { thescelosaurus: 100, dryosaurus: 110, zalambdalestes: 22, eomaia: 18, dragonfly: 26, ammonite: 44, smallfish: 30 };

  function makeEntity(a, art, x, opts) {
    const nh = naturalHeight(art);
    const minH = opts.minH || 46;
    const zoom = Math.max(opts.zoom, minH / nh);
    return Object.assign({
      a, art, x, homeX: x, y: B.GROUND + 10, baseY: B.GROUND + 10, dir: Math.random() < 0.5 ? 1 : -1,
      state: 'idle', timer: 1 + Math.random() * 3, tx: x, ty: null, zoom, alert: 0, offset: Math.random() * 12,
      dex: !!opts.dex, layer: opts.layer || 'ground', perch: null, flee: 0, gone: 0,
    }, opts.extra || {});
  }

  E.enter = function (habId) {
    const hab = WE.habitatById(habId);
    E.hab = hab;
    E.layers = B.layers(habId);
    E.t = 0;
    E.under = !!hab.underwater;
    E.outfit = { kind: 'explorer', id: 'explorer-' + hab.outfit, outfit: hab.outfit };
    E.player = { x: 260, y: E.under ? 420 : B.GROUND + 30, dir: 1, moving: false, mode: 'idle', stepT: 0 };
    E.camX = 0;
    E.entities = [];
    E.decor = [];
    const r = U.rng('spawn-' + habId);
    const dex = WE.ANIMALS.filter(a => a.habitat === habId);
    const gap = (WORLD_W - 1500) / Math.max(1, dex.length - 1);
    dex.forEach((a, i) => {
      const x = 850 + i * gap + r.range(-gap * 0.2, gap * 0.2);
      // Prehistoric creatures give an on-screen height (1 m is about 85 px next to the explorer).
      const zoom = a.heightPx ? a.heightPx / naturalHeight(a.art) : a.worldScale;
      const ent = makeEntity(a, a.art, x, { zoom, dex: true, layer: a.layer, minH: 52 });
      placeEntity(ent, r);
      E.entities.push(ent);
    });
    // Background wildlife for atmosphere (not discoverable)
    for (const id of hab.ambient) {
      const ex = WE.EXTRAS[id];
      const n = id === 'reeffish' ? 14 : id === 'gazelle' ? 5 : id === 'zebra' ? 3 : id === 'ammonite' ? 6 : id === 'smallfish' ? 8 : 2;
      const cx = r.range(1400, WORLD_W - 600);
      for (let k = 0; k < n; k++) {
        const zoom = AMBIENT_H[id] ? AMBIENT_H[id] / naturalHeight(ex.art) : id === 'reeffish' ? 0.55 : 0.8;
        const ent = makeEntity(ex, ex.art, cx + r.range(-260, 260), { zoom, layer: E.under ? 'water' : 'ground', minH: 20 });
        ent.ambient = true;
        ent.baseY = ent.y = E.under ? r.range(200, 360) : B.GROUND + r.range(-8, 4);
        if (id === 'reeffish') { ent.school = true; ent.dir = 1; }
        E.entities.push(ent);
      }
    }
  };

  // Decide where an animal lives in the scene (ground, perch, water column).
  function placeEntity(ent, r) {
    const a = ent.a;
    if (a.layer === 'sky') {
      // Soaring over the scene (Pteranodon over the seaway)
      ent.layer = 'sky';
      ent.baseY = ent.y = 150;
    } else if (E.under) {
      ent.layer = 'water';
      const depth = { clownfish: B.GROUND - 30, octopus: B.GROUND + 20, dolphin: 260, tylosaurus: 300, elasmosaurus: 360, xiphactinus: 430, archelon: 470 };
      if (a.id === 'clownfish') E.decor.push({ type: 'anemone', x: ent.homeX, y: B.GROUND + 40 });
      ent.baseY = depth[a.id] || 380;
      ent.y = ent.baseY;
    } else if (a.layer === 'water') {
      if (a.swimmer && E.hab.id !== 'arctic') {
        // A river pool on land (Kem Kem): the fish swims inside it
        E.decor.push({ type: 'pool', x: ent.homeX, y: B.GROUND + 34 });
        ent.layer = 'pool';
        ent.baseY = ent.y = B.GROUND + 26;
      } else ent.baseY = ent.y = B.GROUND + r.range(0, 22);
    } else if (a.layer === 'tree' || a.layer === 'cliff') {
      if (E.hab.id === 'arctic' || a.layer === 'cliff') {
        ent.perch = { type: 'rock', x: ent.homeX, y: B.GROUND + 6 };
        ent.baseY = ent.y = B.GROUND - 18;
      } else {
        const py = r.range(330, 400);
        ent.perch = { type: 'branch', x: ent.homeX, y: py };
        ent.baseY = ent.y = py;
      }
      E.decor.push(Object.assign({}, ent.perch));
    } else {
      ent.baseY = ent.y = B.GROUND + r.range(0, 22);
    }
  }

  E.viewW = () => WE.Game.W / E.scale;

  E.update = function (dt) {
    E.t += dt;
    const p = E.player;
    const ax = In.axis();
    const stalking = In.down('stalk');
    const sprinting = In.down('sprint') && !stalking;
    const speed = stalking ? 120 : sprinting ? 430 : 260;
    p.moving = ax.mag > 0.1;
    p.sprinting = sprinting && p.moving;
    p.stalking = stalking;
    if (p.moving) {
      p.x += ax.x * speed * dt;
      if (Math.abs(ax.x) > 0.1) p.dir = ax.x > 0 ? 1 : -1;
      if (E.under) p.y = U.clamp(p.y + ax.y * speed * dt, 180, B.GROUND + 40);
      p.stepT += dt * (sprinting ? 2 : 1);
      if (p.stepT > 0.33 && !E.under) { p.stepT = 0; WE.Audio.play('step'); }
    }
    p.x = U.clamp(p.x, 60, WORLD_W - 60);
    const vw = E.viewW();
    const target = U.clamp(p.x - vw * 0.42, 0, WORLD_W - vw);
    E.camX += (target - E.camX) * Math.min(1, dt * 5);

    let nearest = null, nd = Infinity;
    for (const e of E.entities) {
      updateEntity(e, dt, p);
      if (!e.dex || e.gone > 0) continue;
      const d = E.under ? U.dist(e.x, e.y, p.x, p.y) : Math.abs(e.x - p.x);
      if (d < nd) { nd = d; nearest = e; }
    }
    E.target = nearest && nd < OBSERVE_DIST ? nearest : null;
    WE.UI.setPrompt(E.target);
    if (E.target && In.hit('observe')) WE.Game.startObserve(E.target);
  };

  function updateEntity(e, dt, p) {
    if (e.gone > 0) {
      e.gone -= dt;
      if (e.gone <= 0) { e.x = e.homeX; e.state = 'idle'; e.alert = 0; }
      return;
    }
    const dx = e.x - p.x;
    const dist = E.under ? U.dist(e.x, e.y, p.x, p.y) : Math.abs(dx);
    // Startle: running close to wary animals makes them flee.
    if (e.dex && dist < 420) {
      const noise = p.sprinting ? 1.6 : p.moving && !p.stalking ? 0.25 : -0.6;
      e.alert = U.clamp(e.alert + noise * dt * (0.4 + e.a.wary), 0, 1.2);
      if (e.alert >= 1 && e.state !== 'flee') {
        e.state = 'flee'; e.flee = 2.2; e.dir = dx >= 0 ? 1 : -1;
        WE.Audio.play('alert');
        if (!E.startleTip) { E.startleTip = true; WE.UI.toast('<b>Too loud!</b> Running startles animals. Hold <kbd>Shift</kbd> (or Sneak) to tiptoe closer.'); }
      }
    } else e.alert = Math.max(0, e.alert - dt * 0.3);

    if (e.state === 'flee' && e.layer === 'pool') { e.state = 'idle'; e.gone = 5; e.alert = 0; return; }   // dives out of sight
    if (e.state === 'flee') {
      e.flee -= dt;
      e.x += e.dir * 380 * dt;
      if (e.layer === 'tree' || e.layer === 'water' || e.layer === 'cliff' || e.layer === 'sky') e.y = e.baseY - Math.sin((2.2 - e.flee) * 2) * 60;
      if (e.flee <= 0) { e.gone = 6; e.alert = 0; e.homeX = U.clamp(e.homeX + e.dir * 500, 500, WORLD_W - 300); }
      return;
    }
    e.timer -= dt;
    const range = e.layer === 'tree' || e.layer === 'cliff' ? 0 : e.layer === 'pool' ? 90 : e.layer === 'sky' ? 420 : e.ambient ? 300 : 220;
    if (e.timer <= 0) {
      if (e.state === 'idle' && range > 0) {
        e.state = 'walk';
        e.tx = U.clamp(e.homeX + (Math.random() * 2 - 1) * range, 80, WORLD_W - 80);
        e.ty = e.layer === 'water' || e.layer === 'sky' ? e.baseY + (Math.random() * 2 - 1) * 70 : null;
        e.timer = 6;
      } else {
        e.state = 'idle';
        e.timer = 2 + Math.random() * 4;
      }
    }
    if (e.state === 'walk') {
      const spd = (e.layer === 'water' ? 70 : 55) * (e.a.speedStat || 1);
      const d = e.tx - e.x;
      if (Math.abs(d) < 4) { e.state = 'idle'; e.timer = 2 + Math.random() * 3; }
      else { e.dir = d > 0 ? 1 : -1; e.x += Math.sign(d) * Math.min(Math.abs(d), spd * dt); }
      if (e.ty !== null) e.y += (e.ty - e.y) * dt * 0.8;
    }
    if (e.layer === 'water' || e.layer === 'sky' || e.layer === 'pool') e.drawY = e.y + Math.sin(E.t * 1.3 + e.offset) * (e.layer === 'pool' ? 3 : 6);
    else e.drawY = e.y;
  }

  // ---- Rendering ----
  E.render = function (ctx, W, H) {
    // Fit by height, but keep a wide enough view on tall portrait screens
    // (extra sky fills the space above the scene).
    E.scale = Math.min(H / B.SCENE_H, W / 480);
    const k = E.scale;
    E.yOff = H - B.SCENE_H * k;
    B.drawSky(ctx, E.hab.id, W, H, E.t, E.camX);
    ctx.save();
    ctx.translate(0, E.yOff);
    B.drawLayers(ctx, E.layers.back, E.camX, k, W);
    ctx.save();
    ctx.scale(k, k);
    ctx.translate(-E.camX, 0);
    const vw = W / k;
    for (const d of E.decor) drawDecor(ctx, d);
    const list = E.entities.filter(e => e.gone <= 0 && e.x > E.camX - 300 && e.x < E.camX + vw + 300);
    list.push({ isPlayer: true, drawY: E.player.y, x: E.player.x });
    list.sort((a, b) => (a.drawY || a.y) - (b.drawY || b.y));
    const q = k * WE.Game.dpr > 1.3 ? 2 : 1;
    for (const e of list) {
      if (e.isPlayer) {
        const p = E.player;
        if (!E.under) S.shadow(ctx, p.x, p.y, 26, 0.3);
        S.draw(ctx, E.outfit, p.moving ? 'walk' : 'idle', E.t * (p.sprinting ? 1.6 : p.stalking ? 0.6 : 1), p.x, p.y, 1.35, p.dir, { quality: q });
        continue;
      }
      const y = e.drawY !== undefined ? e.drawY : e.y;
      const flying = e.a.flyer && (e.state === 'flee');
      if (!E.under && !e.perch && e.layer !== 'sky' && e.layer !== 'pool') S.shadow(ctx, e.x, e.y, 40 * e.zoom * (e.a.sizeStat || 0.7), 0.28);
      let mode = e.state === 'flee' ? (flying ? 'fly' : 'run') : e.state === 'walk' ? 'walk' : 'idle';
      if (e.layer === 'sky') mode = 'fly';
      if (e.layer === 'pool') mode = 'walk';
      if (e.layer === 'water' && E.under) mode = e.state === 'idle' ? 'walk' : mode;
      S.draw(ctx, e.art, mode, E.t, e.x, y, e.zoom, e.dir, { offset: e.offset, quality: q });
      if (e.perch && e.perch.type === 'branch') drawBranchFront(ctx, e.perch);
      if (e.layer === 'pool') { ctx.fillStyle = 'rgba(80,120,110,0.5)'; U.ellipse(ctx, e.homeX, B.GROUND + 40, 190, 16, 0); ctx.fill(); }
    }
    ctx.restore();
    B.drawLayers(ctx, [E.layers.front], E.camX, k, W);
    ctx.restore();
    B.drawAtmosphere(ctx, E.hab.id, W, H, E.t, E.camX);
    drawMarkers(ctx, W, H, k);
  };

  function drawDecor(ctx, d) {
    if (d.type === 'pool') {
      const g = ctx.createLinearGradient(0, d.y - 20, 0, d.y + 20);
      g.addColorStop(0, '#6a8a80'); g.addColorStop(1, '#3a5a52');
      ctx.fillStyle = g; U.ellipse(ctx, d.x, d.y, 200, 26, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,240,0.35)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(d.x - 60 + i * 40, d.y - 4 + i * 3, 24, 3, 0, 0, Math.PI); ctx.stroke(); }
      return;
    }
    if (d.type === 'anemone') B.prims.anemone(ctx, d.x, d.y, 70, U.rng(3), '#e86aa0', E.t);
    else if (d.type === 'rock') B.prims.rock(ctx, d.x, d.y, 90, 40, U.rng(5), E.hab.id === 'arctic' ? '#7a8290' : '#8a7a66');
    else if (d.type === 'branch') {
      const col = E.hab.id === 'forest' ? '#4a3626' : '#4a3a28';
      ctx.fillStyle = col;
      ctx.beginPath();
      U.taperPath(ctx, U.bezierPts([d.x - 160, d.y + 20], [d.x - 40, d.y + 4], [d.x + 120, d.y + 8], null, 8), 14, 6);
      ctx.fill();
      const leaf = E.hab.id === 'forest' ? ['#e67e22', '#c0392b', '#f1c40f'] : ['#3f7a3a', '#2f6a32', '#5a9a3a'];
      const r = U.rng(Math.floor(d.x));
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = leaf[i % 3];
        U.ellipse(ctx, d.x - 150 + r() * 70, d.y + 10 + (r() - 0.6) * 50, 12, 6, r() * 3); ctx.fill();
      }
    }
  }
  function drawBranchFront(ctx, p) {
    // A couple of leaves in front of the perched bird so it sits "in" the tree.
    const leaf = E.hab.id === 'forest' ? '#d35400' : '#3f7a3a';
    ctx.fillStyle = leaf;
    U.ellipse(ctx, p.x + 30, p.y + 10, 14, 6, 0.4); ctx.fill();
    U.ellipse(ctx, p.x - 26, p.y + 12, 12, 5, -0.3); ctx.fill();
  }

  // "?" bubbles over undiscovered animals and edge arrows pointing to them.
  function drawMarkers(ctx, W, H, k) {
    if (WE.Game.mode !== 'explore') return;
    const State = WE.State;
    for (const e of E.entities) {
      if (!e.dex || e.gone > 0) continue;
      const found = State.isFound(e.a.id);
      const sx = (e.x - E.camX) * k;
      const f = S.frame(e.art, 'idle', 0, 1);
      const topY = E.yOff + ((e.drawY !== undefined ? e.drawY : e.y) - f.oy * e.zoom - 18) * k;
      const onScreen = sx > -20 && sx < W + 20;
      if (onScreen) {
        if (!found) bubble(ctx, sx, topY + Math.sin(E.t * 3 + e.offset) * 4, '?', E.target === e);
        else if (E.target === e) tag(ctx, sx, topY, e.a.name);
        if (e.alert > 0.15 && e.state !== 'flee') alertMeter(ctx, sx, topY - 30, e.alert);
      } else if (!found) {
        const left = sx < 0;
        const ax = left ? 28 : W - 28, ay = E.yOff + B.SCENE_H * k * 0.4;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.fillStyle = 'rgba(14,28,22,0.75)';
        U.ellipse(ctx, 0, 0, 20, 20, 0); ctx.fill();
        ctx.fillStyle = '#ff8a3d';
        ctx.beginPath();
        if (left) { ctx.moveTo(-10, 0); ctx.lineTo(4, -9); ctx.lineTo(4, 9); }
        else { ctx.moveTo(10, 0); ctx.lineTo(-4, -9); ctx.lineTo(-4, 9); }
        ctx.fill();
        ctx.restore();
      }
    }
  }
  function bubble(ctx, x, y, txt, hot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = hot ? '#ff8a3d' : 'rgba(243,239,223,0.92)';
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 22); ctx.lineTo(5, 12); ctx.fill();
    ctx.fillStyle = '#1c2a23';
    ctx.font = '800 20px "Baloo 2", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, 0, 2);
    ctx.restore();
  }
  function tag(ctx, x, y, txt) {
    ctx.save();
    ctx.font = '700 15px "Baloo 2", sans-serif';
    const w = ctx.measureText(txt).width + 18;
    ctx.fillStyle = 'rgba(14,28,22,0.8)';
    U.roundRect(ctx, x - w / 2, y - 14, w, 26, 8); ctx.fill();
    ctx.fillStyle = '#f3efdf'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y);
    ctx.restore();
  }
  function alertMeter(ctx, x, y, v) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    U.roundRect(ctx, x - 22, y - 4, 44, 8, 4); ctx.fill();
    ctx.fillStyle = v > 0.7 ? '#d8452f' : '#f2c418';
    U.roundRect(ctx, x - 22, y - 4, 44 * Math.min(1, v), 8, 4); ctx.fill();
    ctx.restore();
  }

  // Send an animal off after a failed observation.
  E.scare = function (ent) {
    ent.state = 'flee'; ent.flee = 1.6; ent.dir = ent.x > E.player.x ? 1 : -1;
  };

  // Frames this habitat will need (used to pre-render during travel).
  E.warmList = function (habId) {
    const hab = WE.habitatById(habId);
    const list = [];
    for (const a of WE.ANIMALS.filter(x => x.habitat === habId)) {
      list.push([a.art, 'idle'], [a.art, 'walk'], [a.art, a.flyer ? 'fly' : 'run']);
    }
    for (const id of hab.ambient) list.push([WE.EXTRAS[id].art, 'idle'], [WE.EXTRAS[id].art, 'walk']);
    const out = { kind: 'explorer', id: 'explorer-' + hab.outfit, outfit: hab.outfit };
    list.push([out, 'idle'], [out, 'walk']);
    return list;
  };

  E.WORLD_W = WORLD_W;
  WE.Explore = E;
})(window.WE);
