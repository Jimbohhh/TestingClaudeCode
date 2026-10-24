// Hunt & Survive minigames. Play as a discovered animal: predators stalk and
// catch prey; prey animals forage while avoiding predators. Creature powers
// change the rules for a few seconds.
(function (WE) {
  const U = WE.U, B = WE.BG, S = WE.Sprites, In = WE.Input;
  const AR = {};
  const WORLD = { w: 2200, h: 1500 };
  const BASE_SPEED = 240;
  const TIME = 80;

  // Prey behaviour: detection radius (px), flee speed (x base), body size, hidden in ground cover?
  const PREY = {
    gazelle: { detect: 300, speed: 1.15, size: 0.85 }, zebra: { detect: 260, speed: 1.0, size: 1.15 },
    capybara: { detect: 220, speed: 0.85, size: 0.9 }, ant: { detect: 70, speed: 0.45, size: 0.22, hidden: true },
    lemming: { detect: 150, speed: 0.75, size: 0.3, hidden: true }, harpseal: { detect: 230, speed: 0.7, size: 1.0 },
    crab: { detect: 120, speed: 0.6, size: 0.35, hidden: true }, reeffish: { detect: 210, speed: 1.0, size: 0.45 },
    beetle: { detect: 90, speed: 0.5, size: 0.26, hidden: true }, jerboa: { detect: 250, speed: 1.1, size: 0.35 },
    deer: { detect: 310, speed: 1.12, size: 1.0 }, hare: { detect: 270, speed: 1.1, size: 0.45 },
    trout: { detect: 170, speed: 0.9, size: 0.5 }, arcticcod: { detect: 170, speed: 0.85, size: 0.4 },
  };
  // Threat behaviour: chase speed (x base) and detection radius.
  const THREAT = {
    lion: { speed: 1.0, detect: 340, size: 1.15 }, hyena: { speed: 0.95, detect: 320, size: 1.0 },
    anaconda: { speed: 0.78, detect: 260, size: 1.1 }, jaguar: { speed: 0.97, detect: 320, size: 1.0 },
    harpy: { speed: 1.0, detect: 360, size: 1.0, fly: true }, snake: { speed: 0.72, detect: 230, size: 0.6 },
    grouper: { speed: 0.88, detect: 280, size: 0.9 }, tigershark: { speed: 0.95, detect: 340, size: 1.4 },
    moray: { speed: 0.82, detect: 260, size: 1.0 }, reefshark: { speed: 0.95, detect: 320, size: 1.2 },
    goldenwolf: { speed: 0.96, detect: 320, size: 0.9 }, falcon: { speed: 1.05, detect: 380, size: 0.8, fly: true },
    fennec: { speed: 0.95, detect: 300, size: 0.6 }, viper: { speed: 0.66, detect: 220, size: 0.6 },
    polarbear: { speed: 0.9, detect: 320, size: 1.3 }, orca: { speed: 1.0, detect: 360, size: 1.6 },
    wolf: { speed: 0.95, detect: 340, size: 1.0 }, dustdevil: { speed: 0.6, detect: 0, size: 1.0, hazard: true },
  };

  const STYLE_FOR = {
    savanna: 'savanna', rainforest: 'rainforest', reef: 'reef', desert: 'desert', arctic: 'arctic', forest: 'forest',
  };
  // Prehistoric behaviour stats live with the prehistoric data.
  Object.assign(PREY, WE.PREY_EXTRA || {});
  Object.assign(THREAT, WE.THREAT_EXTRA || {});
  const SWIM_KINDS = ['fish', 'cetacean', 'marine', 'ammonite', 'turtle'];
  const swims = art => SWIM_KINDS.includes(art.kind) || (art.kind === 'snake' && B.ARENA_STYLE[AR.styleId] && B.ARENA_STYLE[AR.styleId].water);

  AR.styleFor = function (a) {
    if (a.arenaStyle) return a.arenaStyle;
    const hab = WE.habitatById(a.habitat);
    if (hab.arena) return hab.arena;
    if (a.id === 'harpseal') return 'arcticwater';
    if (a.id === 'baldeagle') return 'lake';
    return STYLE_FOR[a.habitat];
  };

  AR.goalFor = function (a) {
    if (a.role === 'hunt') {
      const small = a.targets.some(t => PREY[t] && PREY[t].hidden);
      return { n: small ? 8 : 5, verb: 'Catch', what: a.targets.map(t => WE.creature(t).name).join(' or ') };
    }
    return { n: 8, verb: 'Collect', what: a.targets.map(t => WE.creature(t).name.toLowerCase()).join(' or ') };
  };

  const zoomCache = {};
  function zoomFor(c, sizeStat) {
    const key = c.id + '|' + sizeStat;
    if (zoomCache[key]) return zoomCache[key];
    const f = S.frame(c.art, 'idle', 0, 1);
    const target = c.food ? 48 : 34 + 52 * Math.pow(sizeStat, 0.7);
    // Long, low animals (mosasaurs, sauropods, snakes) are sized by length too.
    const ref = c.food ? f.h : Math.max(f.h, f.w * 0.42);
    return (zoomCache[key] = U.clamp(target / ref, 0.12, 2));
  }

  // ------------------------------------------------------------------
  AR.enter = function (cfg) {
    const a = cfg.animal;
    AR.a = a;
    AR.t = 0;
    AR.time = TIME;
    AR.over = false;
    AR.score = 0;
    AR.goal = AR.goalFor(a);
    AR.styleId = AR.styleFor(a);
    AR.ground = B.buildArena(AR.styleId, WORLD.w, WORLD.h, a.id + 'arena');
    AR.fx = [];
    AR.texts = [];
    AR.zones = [];      // safe zones, ink clouds
    AR.decoy = null;
    AR.allies = [];
    AR.timeScale = 1;
    const P = AR.player = {
      x: WORLD.w / 2, y: WORLD.h / 2, vx: 0, vy: 0, dir: 1, hearts: 3, stamina: 1, inv: 0,
      speed: BASE_SPEED * a.speedStat, size: a.sizeStat, zoom: zoomFor(a, a.sizeStat), fly: !!a.flyer, swim: !!a.swimmer,
      eff: {}, lift: 0, moving: false,
    };
    P.radius = 18 + 22 * P.size;
    AR.powers = cfg.loadout.map(id => ({ id, def: WE.POWERS[id], cd: 0 }));
    AR.prey = [];
    AR.food = [];
    AR.threats = [];
    const r = U.rng(a.id + Date.now());
    AR.rand = r;
    if (a.role === 'hunt') for (let i = 0; i < 8; i++) spawnPrey(r.pick(a.targets), true);
    else for (let i = 0; i < 11; i++) spawnFood(r.pick(a.targets));
    const nThreat = a.threats.length ? (a.role === 'survive' ? 3 : 2) : 0;
    for (let i = 0; i < nThreat; i++) spawnThreat(a.threats[i % a.threats.length]);
    AR.cam = { x: P.x, y: P.y };
    WE.UI.showArena(AR);
    WE.Audio.ambience(a.habitat);
  };
  AR.exit = function () { WE.UI.hideArena(); };

  function randomPoint(minDistFromPlayer) {
    const r = AR.rand;
    for (let i = 0; i < 30; i++) {
      const x = 120 + r() * (WORLD.w - 240), y = 120 + r() * (WORLD.h - 240);
      if (!AR.player || U.dist(x, y, AR.player.x, AR.player.y) > minDistFromPlayer) return { x, y };
    }
    return { x: 150, y: 150 };
  }
  function spawnPrey(type, initial) {
    const c = WE.creature(type);
    const st = PREY[type] || { detect: 220, speed: 1, size: 0.6 };
    const p = randomPoint(initial ? 380 : 650);
    AR.prey.push({ type, c, st, x: p.x, y: p.y, vx: 0, vy: 0, dir: 1, state: 'wander', t: Math.random() * 3, stam: 3.5, tired: 0,
      held: 0, frozen: 0, confused: 0, zoom: zoomFor(c, st.size), size: st.size, offset: Math.random() * 12, hx: p.x, hy: p.y });
  }
  function spawnFood(type) {
    const c = WE.creature(type);
    const p = randomPoint(300);
    AR.food.push({ type, c, x: p.x, y: p.y, zoom: zoomFor(c, 0.4), bob: Math.random() * 6 });
  }
  function spawnThreat(type) {
    const c = WE.creature(type);
    const st = THREAT[type] || { speed: 0.9, detect: 300, size: 1 };
    const p = randomPoint(700);
    AR.threats.push({ type, c, st, x: p.x, y: p.y, vx: 0, vy: 0, dir: 1, state: 'patrol', t: 0, wx: p.x, wy: p.y,
      stun: 0, flee: 0, rest: 0, chaseT: 0, zoom: c.art ? zoomFor(c, st.size) : 1, offset: Math.random() * 12, spin: 0 });
  }

  // ------------------------------------------------------------------
  function eff(name) { return AR.player.eff[name] > 0; }
  function inCover(x, y) { return AR.ground.covers.some(c => U.dist(x, y, c.x, c.y) < c.r * 0.85); }
  function addText(x, y, txt, col) { AR.texts.push({ x, y, txt, col: col || '#fff', t: 1.2 }); }
  function ring(x, y, col, maxR, dur) { AR.fx.push({ type: 'ring', x, y, col, r: 10, maxR, t: 0, dur: dur || 0.7 }); }
  function puff(x, y, col, n) {
    for (let i = 0; i < (n || 10); i++) {
      const a = Math.random() * U.TAU, s = 40 + Math.random() * 120;
      AR.fx.push({ type: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col: col || '#fff', t: 0, dur: 0.5 + Math.random() * 0.4, r: 3 + Math.random() * 4 });
    }
  }

  AR.usePower = function (i) {
    const pw = AR.powers[i];
    if (!pw || pw.cd > 0 || AR.over) return;
    const P = AR.player, d = pw.def;
    let ok = true;
    switch (d.kind) {
      case 'roar':
        ring(P.x, P.y, d.color, 420, 0.9); WE.Audio.play('roar');
        for (const p of AR.prey) if (U.dist(p.x, p.y, P.x, P.y) < 420) { p.frozen = d.dur; p.state = 'wander'; }
        for (const t of AR.threats) if (U.dist(t.x, t.y, P.x, P.y) < 460 && !t.st.hazard) { t.flee = d.dur + 1; t.state = 'flee'; }
        break;
      case 'speed': P.eff.speed = d.dur; break;
      case 'shockwave':
        ring(P.x, P.y, d.color, 340, 0.6); ring(P.x, P.y, '#fff', 260, 0.5);
        for (const t of AR.threats) {
          const dd = U.dist(t.x, t.y, P.x, P.y);
          if (dd < 340) { const a = U.angle(P.x, P.y, t.x, t.y); t.x += Math.cos(a) * 320; t.y += Math.sin(a) * 320; t.stun = 1.5; t.state = 'flee'; t.flee = 2; }
        }
        break;
      case 'reach': P.eff.reach = d.dur; break;
      case 'pounce': {
        let best = null, bd = d.range;
        for (const p of AR.prey) { const dd = U.dist(p.x, p.y, P.x, P.y); if (dd < bd) { bd = dd; best = p; } }
        if (best) { P.dash = { fx: P.x, fy: P.y, tx: best.x, ty: best.y, t: 0, dur: 0.28, target: best }; P.dir = best.x > P.x ? 1 : -1; }
        else { const a = Math.atan2(P.vy, P.vx || P.dir); P.dash = { fx: P.x, fy: P.y, tx: P.x + Math.cos(a) * 160, ty: P.y + Math.sin(a) * 160, t: 0, dur: 0.25 }; }
        P.eff.leapInv = 0.35;
        break;
      }
      case 'decoy': {
        const a = Math.atan2(P.vy || 0, P.vx || P.dir);
        AR.decoy = { x: U.clamp(P.x + Math.cos(a) * 180, 60, WORLD.w - 60), y: U.clamp(P.y + Math.sin(a) * 180, 60, WORLD.h - 60), t: d.dur };
        break;
      }
      case 'toxic': P.eff.toxic = d.dur; break;
      case 'hold':
        ring(P.x, P.y, d.color, d.radius, 0.6);
        for (const p of AR.prey) if (U.dist(p.x, p.y, P.x, P.y) < d.radius) p.held = d.dur;
        break;
      case 'sniff': P.eff.sniff = d.dur; break;
      case 'camo': P.eff.camo = d.dur; for (const t of AR.threats) if (t.state === 'chase') { t.state = 'patrol'; t.rest = 1; } break;
      case 'silent': P.eff.silent = d.dur; break;
      case 'shield': P.eff.shield = d.dur; break;
      case 'safezone': AR.zones.push({ type: 'safe', x: P.x, y: P.y, r: d.radius, t: d.dur }); break;
      case 'invuln': P.eff.invuln = d.dur; break;
      case 'ink': AR.zones.push({ type: 'ink', x: P.x, y: P.y, r: d.radius, t: d.dur, seed: Math.random() * 100 }); break;
      case 'reveal': P.eff.reveal = d.dur; ring(P.x, P.y, d.color, 600, 1.2); ring(P.x, P.y, d.color, 420, 1.0); break;
      case 'warn': P.eff.warn = d.dur; break;
      case 'recharge': P.eff.recharge = d.dur; P.stamina = 1; break;
      case 'burrow': P.eff.burrow = d.dur; P.eff.strike = 6; puff(P.x, P.y, '#d9b98a', 14); break;
      case 'leap': {
        const ax = In.axis();
        const a = ax.mag > 0.1 ? Math.atan2(ax.y, ax.x) : (P.dir > 0 ? 0 : Math.PI);
        P.dash = { fx: P.x, fy: P.y, tx: U.clamp(P.x + Math.cos(a) * 300, 40, WORLD.w - 40), ty: U.clamp(P.y + Math.sin(a) * 300, 40, WORLD.h - 40), t: 0, dur: d.dur, hop: true };
        P.eff.leapInv = d.dur + 0.1;
        break;
      }
      case 'allies':
        for (let k = 0; k < 2; k++) AR.allies.push({ x: P.x + (k ? 60 : -60), y: P.y + 40, dir: P.dir, t: d.dur, offset: k * 5 });
        WE.Audio.play('roar');
        break;
      case 'dodge': P.eff.dodge = d.dur; P.dodges = d.charges; break;
      case 'slowmo': P.eff.slowmo = d.dur; break;
      case 'heal':
        if (P.hearts >= 3) { ok = false; addText(P.x, P.y - 80, 'Already healthy!', '#fff'); }
        else { P.hearts++; addText(P.x, P.y - 80, '+1 heart', '#ff8aa0'); puff(P.x, P.y, '#ff8aa0', 12); }
        break;
    }
    if (!ok) return;
    pw.cd = d.cd;
    pw.flash = 0.4;
    if (d.kind !== 'roar' && d.kind !== 'allies') WE.Audio.play('power');
    addText(P.x, P.y - 90, d.name, d.color);
  };

  // ------------------------------------------------------------------
  AR.update = function (dt) {
    if (AR.over) { AR.overT -= dt; if (AR.overT <= 0 && !AR.shown) { AR.shown = true; WE.UI.arenaResults(AR.result); } return; }
    if (In.hit('back')) { WE.UI.arenaPause(); return; }
    AR.t += dt;
    AR.time -= dt;
    const P = AR.player;
    for (const k in P.eff) P.eff[k] = Math.max(0, P.eff[k] - dt);
    const slow = eff('slowmo') ? 0.4 : 1;
    const odt = dt * slow;   // time step for everyone else
    AR.timeScale = slow;

    // Powers
    for (let i = 0; i < AR.powers.length; i++) if (In.hit('power' + (i + 1))) AR.usePower(i);
    for (const pw of AR.powers) { pw.cd = Math.max(0, pw.cd - dt * (eff('recharge') && pw.def.kind !== 'recharge' ? 3 : 1)); pw.flash = Math.max(0, (pw.flash || 0) - dt); }

    // Movement
    const ax = In.axis();
    const stalk = In.down('stalk') || WE.UI.stalkToggle;
    let sprint = In.down('sprint') && !stalk && P.stamina > 0.02 && ax.mag > 0.1;
    let spd = P.speed * (stalk ? 0.5 : 1);
    if (sprint) { spd *= 1.55; P.stamina = Math.max(0, P.stamina - dt / 2.6); }
    else P.stamina = Math.min(1, P.stamina + dt / (eff('recharge') ? 0.8 : 4));
    if (eff('speed')) spd *= AR.powers.find(p => p.def.kind === 'speed').def.mult;
    if (eff('burrow')) { if (ax.mag > 0.1 && sprint) P.eff.burrow = 0; spd *= 0.25; }
    P.sprinting = sprint; P.stalking = stalk;
    if (P.dash) {
      P.dash.t += dt;
      const k = U.clamp(P.dash.t / P.dash.dur, 0, 1);
      P.x = U.lerp(P.dash.fx, P.dash.tx, U.easeOut(k));
      P.y = U.lerp(P.dash.fy, P.dash.ty, U.easeOut(k));
      P.lift = P.dash.hop ? Math.sin(k * Math.PI) * 70 : Math.sin(k * Math.PI) * 30;
      if (k >= 1) {
        if (P.dash.target && AR.prey.includes(P.dash.target)) catchPrey(P.dash.target);
        P.dash = null; P.lift = 0;
      }
    } else {
      const tvx = ax.x * spd, tvy = ax.y * spd;
      P.vx += (tvx - P.vx) * Math.min(1, dt * 10);
      P.vy += (tvy - P.vy) * Math.min(1, dt * 10);
      P.x = U.clamp(P.x + P.vx * dt, 30, WORLD.w - 30);
      P.y = U.clamp(P.y + P.vy * dt, 30, WORLD.h - 30);
      if (Math.abs(P.vx) > 8) P.dir = P.vx > 0 ? 1 : -1;
      P.lift = P.fly ? 26 + Math.sin(AR.t * 3) * 4 : 0;
    }
    P.moving = Math.hypot(P.vx, P.vy) > 20 || !!P.dash;
    P.inv = Math.max(0, P.inv - dt);
    P.covered = !P.fly && inCover(P.x, P.y);

    // Detection multiplier the player imposes on others.
    let preyMul = 1, threatMul = 1;
    if (stalk) { preyMul *= 0.45; threatMul *= 0.6; }
    if (P.covered) { preyMul *= 0.5; threatMul *= 0.4; }
    if (eff('silent')) preyMul *= 0.15;
    if (eff('camo')) { preyMul *= 0.3; threatMul = 0; }
    if (eff('burrow')) { preyMul = 0; threatMul = 0; }
    if (sprint || P.dash) preyMul *= 1.3;

    const reachMul = (eff('reach') ? 2.5 : 1) * (eff('burrow') || eff('strike') ? 2 : 1);
    updatePrey(odt, preyMul, reachMul);
    updateFood(reachMul);
    updateThreats(odt, threatMul);
    updateAllies(dt);
    for (const z of AR.zones) z.t -= dt;
    AR.zones = AR.zones.filter(z => z.t > 0);
    if (AR.decoy) { AR.decoy.t -= dt; if (AR.decoy.t <= 0) AR.decoy = null; }
    for (const f of AR.fx) { f.t += dt; if (f.type === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; } }
    AR.fx = AR.fx.filter(f => f.t < f.dur);
    for (const t of AR.texts) { t.t -= dt; t.y -= 40 * dt; }
    AR.texts = AR.texts.filter(t => t.t > 0);

    // Camera
    AR.cam.x += (P.x - AR.cam.x) * Math.min(1, dt * 6);
    AR.cam.y += (P.y - AR.cam.y) * Math.min(1, dt * 6);

    // End conditions
    if (AR.score >= AR.goal.n) finish(true);
    else if (P.hearts <= 0) finish(false, 'hurt');
    else if (AR.time <= 0) finish(false, 'time');
    WE.UI.updateArena(AR);
  };

  function catchPrey(p) {
    AR.prey.splice(AR.prey.indexOf(p), 1);
    AR.score++;
    if (AR.player.eff.strike) AR.player.eff.strike = 0;
    WE.Audio.play('catch');
    puff(p.x, p.y, '#ffe8a0', 14);
    addText(p.x, p.y - 50, `${AR.score}/${AR.goal.n}`, '#ffd27a');
    setTimeout(() => { if (!AR.over && AR.prey.length < 8) spawnPrey(AR.rand.pick(AR.a.targets)); }, 1500);
  }

  function updatePrey(dt, preyMul, reachMul) {
    const P = AR.player;
    for (const p of [...AR.prey]) {
      p.held = Math.max(0, p.held - dt); p.frozen = Math.max(0, p.frozen - dt);
      const inInk = AR.zones.some(z => z.type === 'ink' && U.dist(p.x, p.y, z.x, z.y) < z.r);
      const d = U.dist(p.x, p.y, P.x, P.y);
      // Catch check (players can't catch while hidden underground except via strike)
      const catchR = (P.radius + 20 * p.size + 14) * reachMul;
      if (d < catchR && P.lift < 40) { catchPrey(p); continue; }
      if (p.held > 0 || p.frozen > 0) { p.vx = p.vy = 0; p.moving = false; continue; }
      const detect = p.st.detect * preyMul;
      p.t -= dt;
      if (inInk) { p.state = 'wander'; }
      else if (d < detect && p.tired <= 0) { if (p.state !== 'flee') { p.state = 'flee'; p.stam = 3.5; } }
      let spd = 0, ang = 0;
      if (p.state === 'flee') {
        p.stam -= dt;
        ang = U.angle(P.x, P.y, p.x, p.y) + Math.sin(AR.t * 3 + p.offset) * 0.5;
        spd = BASE_SPEED * p.st.speed;
        if (p.stam <= 0) { p.state = 'wander'; p.tired = 1.8; }
        if (d > detect * 1.8) p.state = 'wander';
      } else {
        p.tired = Math.max(0, p.tired - dt);
        if (p.t <= 0) { p.t = 1.5 + Math.random() * 3; p.wa = Math.random() * U.TAU; p.wspd = Math.random() < 0.4 ? 0 : 35 + Math.random() * 30; }
        ang = p.wa || 0; spd = p.wspd || 0;
        if (p.tired > 0) spd *= 0.4;
        // Sand ambush lures curious prey closer
        if (eff('burrow') && d < 420) { ang = U.angle(p.x, p.y, P.x, P.y); spd = 45; }
        if (inInk) { ang = AR.t * 2 + p.offset; spd = 30; }
      }
      p.vx = Math.cos(ang) * spd; p.vy = Math.sin(ang) * spd;
      p.x += p.vx * dt; p.y += p.vy * dt;
      // bounce off edges
      if (p.x < 40 || p.x > WORLD.w - 40) { p.x = U.clamp(p.x, 40, WORLD.w - 40); p.wa = Math.PI - (p.wa || 0); }
      if (p.y < 40 || p.y > WORLD.h - 40) { p.y = U.clamp(p.y, 40, WORLD.h - 40); p.wa = -(p.wa || 0); }
      if (Math.abs(p.vx) > 5) p.dir = p.vx > 0 ? 1 : -1;
      p.moving = spd > 5;
      p.fast = spd > 100;
    }
  }

  function updateFood(reachMul) {
    const P = AR.player;
    for (const f of [...AR.food]) {
      if (U.dist(f.x, f.y, P.x, P.y) < (P.radius + 22) * reachMul) {
        AR.food.splice(AR.food.indexOf(f), 1);
        AR.score++;
        WE.Audio.play('collect');
        puff(f.x, f.y, '#c8f0a0', 10);
        addText(f.x, f.y - 40, `${AR.score}/${AR.goal.n}`, '#c8f0a0');
        setTimeout(() => { if (!AR.over) spawnFood(AR.rand.pick(AR.a.targets)); }, 800);
      }
    }
  }

  function updateThreats(dt, threatMul) {
    const P = AR.player;
    for (const t of AR.threats) {
      t.stun = Math.max(0, t.stun - dt); t.rest = Math.max(0, t.rest - dt); t.flee = Math.max(0, t.flee - dt);
      t.spin += dt * 8;
      if (t.stun > 0) { t.moving = false; continue; }
      const d = U.dist(t.x, t.y, P.x, P.y);
      const inInk = AR.zones.some(z => z.type === 'ink' && U.dist(t.x, t.y, z.x, z.y) < z.r);
      let tx, ty, spd;
      if (t.st.hazard) {
        // Dust devils drift on the wind and swerve unpredictably.
        if (t.t <= 0 || U.dist(t.x, t.y, t.wx, t.wy) < 30) { const p = randomPoint(0); t.wx = p.x; t.wy = p.y; t.t = 4; }
        t.t -= dt;
        tx = t.wx; ty = t.wy; spd = BASE_SPEED * t.st.speed;
      } else if (t.flee > 0) {
        const a = U.angle(P.x, P.y, t.x, t.y);
        tx = t.x + Math.cos(a) * 100; ty = t.y + Math.sin(a) * 100; spd = BASE_SPEED * 0.9;
      } else if (AR.decoy) {
        tx = AR.decoy.x; ty = AR.decoy.y; spd = BASE_SPEED * t.st.speed * 0.9; t.state = 'decoy';
      } else if (inInk) {
        tx = t.x + Math.cos(AR.t * 1.7 + t.offset) * 100; ty = t.y + Math.sin(AR.t * 1.3 + t.offset) * 100; spd = 50; t.state = 'patrol';
      } else {
        const sees = t.rest <= 0 && d < t.st.detect * threatMul;
        if (sees) { if (t.state !== 'chase') { t.state = 'chase'; t.chaseT = 0; if (!t.warned) { t.warned = true; } } }
        if (t.state === 'chase') {
          t.chaseT += dt;
          if (threatMul === 0 || d > t.st.detect * 1.6 || t.chaseT > 6) { t.state = 'patrol'; t.rest = 2; }
          tx = P.x; ty = P.y; spd = BASE_SPEED * t.st.speed * 0.92;
        } else {
          if (U.dist(t.x, t.y, t.wx, t.wy) < 30 || t.t <= 0) { const p = randomPoint(200); t.wx = p.x; t.wy = p.y; t.t = 6; }
          t.t -= dt;
          tx = t.wx; ty = t.wy; spd = 85;
        }
      }
      const a = U.angle(t.x, t.y, tx, ty);
      t.vx = Math.cos(a) * spd; t.vy = Math.sin(a) * spd;
      let nx = t.x + t.vx * dt, ny = t.y + t.vy * dt;
      // Safe zones (anemone) push threats out
      for (const z of AR.zones) if (z.type === 'safe') {
        const dz = U.dist(nx, ny, z.x, z.y);
        if (dz < z.r + 30) { const za = U.angle(z.x, z.y, nx, ny); nx = z.x + Math.cos(za) * (z.r + 30); ny = z.y + Math.sin(za) * (z.r + 30); }
      }
      t.x = U.clamp(nx, 30, WORLD.w - 30); t.y = U.clamp(ny, 30, WORLD.h - 30);
      if (Math.abs(t.vx) > 5) t.dir = t.vx > 0 ? 1 : -1;
      t.moving = spd > 5;
      t.fast = spd > 120;
      // Contact
      const hitR = AR.player.radius + 26 * t.st.size;
      const playerSafe = AR.zones.some(z => z.type === 'safe' && U.dist(P.x, P.y, z.x, z.y) < z.r);
      if (d < hitR && !playerSafe && t.rest <= 0) hitPlayer(t);
    }
  }

  function hitPlayer(t) {
    const P = AR.player;
    if (P.inv > 0 || eff('invuln') || eff('leapInv') || eff('burrow') || P.lift > 40) return;
    const a = U.angle(t.x, t.y, P.x, P.y);
    if (eff('toxic')) {
      t.stun = 2.5; t.rest = 3.5; t.x -= Math.cos(a) * 120; t.y -= Math.sin(a) * 120; t.state = 'patrol';
      addText(t.x, t.y - 60, 'Yuck! Toxic!', '#f2c418'); puff(t.x, t.y, '#f2c418', 10);
      return;
    }
    if (eff('dodge') && P.dodges > 0) {
      P.dodges--; P.inv = 0.8;
      P.x = U.clamp(P.x + Math.cos(a + Math.PI / 2) * 120, 30, WORLD.w - 30); P.y = U.clamp(P.y + Math.sin(a + Math.PI / 2) * 120, 30, WORLD.h - 30);
      addText(P.x, P.y - 70, 'Dodged!', '#fff'); t.rest = 1.5;
      return;
    }
    if (eff('shield')) { P.eff.shield = 0; P.inv = 1; t.rest = 2; addText(P.x, P.y - 70, 'Blocked!', '#cfe3ef'); ring(P.x, P.y, '#cfe3ef', 120, 0.4); return; }
    P.hearts--;
    P.inv = 1.6;
    P.vx = Math.cos(a) * 500; P.vy = Math.sin(a) * 500;
    t.rest = 2.5; t.state = 'patrol';
    WE.Audio.play('hurt');
    WE.Game.shake = 0.35;
    addText(P.x, P.y - 70, t.st.hazard ? 'Sandblasted!' : 'Ouch!', '#ff8a7a');
  }

  function updateAllies(dt) {
    for (const al of AR.allies) {
      al.t -= dt;
      let best = null, bd = Infinity;
      for (const p of AR.prey) { const d = U.dist(p.x, p.y, al.x, al.y); if (d < bd) { bd = d; best = p; } }
      if (best) {
        const a = U.angle(al.x, al.y, best.x, best.y);
        const spd = AR.player.speed * 1.08;
        al.x += Math.cos(a) * spd * dt; al.y += Math.sin(a) * spd * dt;
        al.dir = Math.cos(a) > 0 ? 1 : -1;
        if (bd < 40) catchPrey(best);
      }
    }
    AR.allies = AR.allies.filter(a => a.t > 0);
  }

  function finish(win, why) {
    AR.over = true;
    AR.overT = 1.2;
    const P = AR.player;
    let stars = 0;
    if (win) { stars = 1; if (P.hearts >= 2) stars++; if (AR.time >= TIME * 0.3) stars++; }
    const st = WE.State;
    const prev = st.data.stars[AR.a.id] || 0;
    if (stars > prev) st.data.stars[AR.a.id] = stars;
    st.data.xp += win ? 20 + stars * 10 : 5;
    st.save();
    AR.result = { win, why, stars, best: Math.max(prev, stars), animal: AR.a, score: AR.score, goal: AR.goal, timeLeft: Math.max(0, AR.time) };
    WE.Audio.play(win ? 'win' : 'lose');
  }

  // ------------------------------------------------------------------
  AR.render = function (ctx, W, H) {
    const P = AR.player;
    const vs = U.clamp(Math.min(W / 1050, H / 700), 0.48, 1.35);
    AR.viewScale = vs;
    const vw = W / vs, vh = H / vs;
    let cx = U.clamp(AR.cam.x - vw / 2, 0, Math.max(0, WORLD.w - vw));
    let cy = U.clamp(AR.cam.y - vh / 2, 0, Math.max(0, WORLD.h - vh));
    if (WE.Game.shake > 0) { cx += (Math.random() - 0.5) * 14; cy += (Math.random() - 0.5) * 14; }
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.scale(vs, vs);
    ctx.translate(-cx, -cy);
    ctx.drawImage(AR.ground.canvas, cx, cy, vw, vh, cx, cy, vw, vh);
    ctx.drawImage(AR.ground.coverCanvas, cx, cy, vw, vh, cx, cy, vw, vh);
    // World edge fade
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 30; ctx.strokeRect(0, 0, WORLD.w, WORLD.h);
    // Zones
    for (const z of AR.zones) {
      const a = Math.min(1, z.t);
      if (z.type === 'safe') {
        ctx.globalAlpha = a;
        ctx.strokeStyle = 'rgba(232,106,160,0.5)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, U.TAU); ctx.stroke(); ctx.setLineDash([]);
        B.prims.anemone(ctx, z.x, z.y + 30, 80, U.rng(3), '#e86aa0', AR.t);
        ctx.globalAlpha = 1;
      }
    }
    if (AR.decoy) drawDecoy(ctx, AR.decoy);

    // Y-sorted creatures
    const list = [];
    for (const f of AR.food) list.push({ y: f.y, draw: () => drawFood(ctx, f) });
    for (const p of AR.prey) list.push({ y: p.y, draw: () => drawPrey(ctx, p) });
    for (const t of AR.threats) list.push({ y: t.y, draw: () => drawThreat(ctx, t) });
    for (const al of AR.allies) list.push({ y: al.y, draw: () => drawCreature(ctx, AR.a.art, al.x, al.y, P.zoom * 0.9, al.dir, 'run', al.offset, 0, 0.9) });
    list.push({ y: P.y, draw: () => drawPlayer(ctx) });
    list.sort((a, b) => a.y - b.y);
    for (const e of list) e.draw();

    // Cover canopy over creatures for a "hidden in the grass" look
    ctx.globalAlpha = 0.45;
    ctx.drawImage(AR.ground.coverCanvas, cx, cy, vw, vh, cx, cy, vw, vh);
    ctx.globalAlpha = 1;
    for (const z of AR.zones) if (z.type === 'ink') drawInk(ctx, z);
    for (const f of AR.fx) drawFx(ctx, f);
    for (const t of AR.texts) {
      ctx.globalAlpha = Math.min(1, t.t * 2);
      ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(t.txt, t.x, t.y);
      ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (AR.styleId === 'reef' || AR.styleId === 'arcticwater' || AR.styleId === 'lake') drawWaterOverlay(ctx, W, H);
    drawArrows(ctx, W, H, cx, cy, vs);
    drawMinimap(ctx, W, H);
    if (eff('slowmo')) { ctx.fillStyle = 'rgba(240,200,60,0.08)'; ctx.fillRect(0, 0, W, H); }
    if (P.inv > 0 && P.hearts < 3 && P.inv > 1.2) { ctx.fillStyle = `rgba(200,30,20,${(P.inv - 1.2) * 0.5})`; ctx.fillRect(0, 0, W, H); }
  };

  function drawCreature(ctx, art, x, y, zoom, dir, mode, offset, lift, alpha) {
    S.shadow(ctx, x, y, 40 * zoom * 1.2 + 10, lift > 20 ? 0.18 : 0.3);
    S.draw(ctx, art, mode, AR.t * AR.timeScale, x, y - (lift || 0), zoom, dir, { offset, alpha, quality: zoom * AR.viewScale * WE.Game.dpr > 1.2 ? 2 : 1 });
  }

  function drawPlayer(ctx) {
    const P = AR.player;
    let alpha = 1;
    if (eff('camo')) alpha = 0.35;
    if (P.covered) alpha *= 0.85;
    if (P.inv > 0 && Math.floor(AR.t * 12) % 2 === 0) alpha *= 0.4;
    // Ground marker so the player is always easy to spot
    ctx.strokeStyle = 'rgba(255,138,61,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(P.x, P.y, P.radius + 6, (P.radius + 6) * 0.38, 0, 0, U.TAU); ctx.stroke();
    // Power auras
    const auras = [['toxic', '#f2c418'], ['invuln', '#c9b26a'], ['shield', '#cfe3ef'], ['reach', '#c8873a'], ['speed', '#f0c040'], ['dodge', '#a07048']];
    for (const [k, col] of auras) if (eff(k)) {
      ctx.strokeStyle = U.rgba(col, 0.75); ctx.lineWidth = 4;
      const rr = (k === 'reach' ? (P.radius + 34) * 2.5 : P.radius + 22) + Math.sin(AR.t * 6) * 3;
      ctx.beginPath(); ctx.ellipse(P.x, P.y - 10, rr, rr * (k === 'reach' ? 0.5 : 0.8), 0, 0, U.TAU); ctx.stroke();
    }
    if (eff('burrow')) {
      // Only eyes peek from the sand
      ctx.fillStyle = '#c9a26a'; U.ellipse(ctx, P.x, P.y, P.radius + 8, (P.radius + 8) * 0.45, 0); ctx.fill();
      ctx.fillStyle = '#1a1208'; U.ellipse(ctx, P.x - 6, P.y - 4, 3, 2.4, 0); ctx.fill(); U.ellipse(ctx, P.x + 6, P.y - 4, 3, 2.4, 0); ctx.fill();
      return;
    }
    let mode = P.fly ? 'fly' : P.moving ? (P.sprinting || eff('speed') || P.dash ? 'run' : 'walk') : 'idle';
    if (P.swim) mode = 'walk';
    drawCreature(ctx, AR.a.art, P.x, P.y, P.zoom, P.dir, mode, 0, P.lift, alpha);
    if (P.stalking && !P.fly) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '700 12px "Nunito Sans", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('sneaking', P.x, P.y + 24);
    }
  }

  function drawPrey(ctx, p) {
    const P = AR.player;
    let alpha = 1;
    if (p.st.hidden && !eff('reveal') && !eff('sniff')) {
      const d = U.dist(p.x, p.y, P.x, P.y);
      alpha = U.clamp(1 - (d - 140) / 160, 0.18, 1);
    }
    if (eff('reveal')) {
      ctx.strokeStyle = 'rgba(127,214,255,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y - 14, 26 + 20 * p.size, 0, U.TAU); ctx.stroke();
    }
    const fish = swims(p.c.art);
    const mode = p.moving ? (p.fast && !fish ? 'run' : 'walk') : (fish ? 'walk' : 'idle');
    drawCreature(ctx, p.c.art, p.x, p.y, p.zoom, p.dir, mode, p.offset, 0, alpha);
    if (p.state === 'flee' && alpha > 0.5) {
      ctx.fillStyle = '#fff'; ctx.font = '800 18px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', p.x, p.y - 30 - 60 * p.zoom);
    }
    if (p.held > 0 || p.frozen > 0) {
      ctx.strokeStyle = p.held > 0 ? 'rgba(107,127,58,0.9)' : 'rgba(217,164,65,0.9)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 30 + 20 * p.size, 12 + 8 * p.size, 0, 0, U.TAU); ctx.stroke();
    }
  }

  function drawFood(ctx, f) {
    const bob = Math.sin(AR.t * 2 + f.bob) * 3;
    const pulse = 0.5 + 0.5 * Math.sin(AR.t * 3 + f.bob);
    ctx.strokeStyle = `rgba(200,240,160,${0.45 + pulse * 0.4})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(f.x, f.y, 30 + pulse * 4, 11 + pulse * 1.5, 0, 0, U.TAU); ctx.stroke();
    S.draw(ctx, f.c.art, 'idle', AR.t, f.x, f.y + bob, f.zoom, 1, { quality: 2 });
  }

  function drawThreat(ctx, t) {
    if (t.st.hazard) { drawDustDevil(ctx, t); return; }
    const fly = t.st.fly;
    const fish = swims(t.c.art);
    let mode = fly ? 'fly' : t.moving ? (t.fast ? 'run' : 'walk') : 'idle';
    if (fish) mode = 'walk';
    if (eff('warn') || eff('reveal')) {
      ctx.strokeStyle = 'rgba(216,69,47,0.9)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(t.x, t.y, 40 + 30 * t.st.size, 14 + 10 * t.st.size, 0, 0, U.TAU); ctx.stroke();
    }
    drawCreature(ctx, t.c.art, t.x, t.y, t.zoom, t.dir, mode, t.offset, fly ? 40 : 0, 1);
    const topY = t.y - (fly ? 40 : 0) - 70 * t.zoom * 1.4 - 10;
    if (t.stun > 0) {
      for (let i = 0; i < 3; i++) {
        const a = t.spin + i * 2.1;
        ctx.fillStyle = '#f2c418'; U.ellipse(ctx, t.x + Math.cos(a) * 20, topY + Math.sin(a) * 6, 4, 4, 0); ctx.fill();
      }
    } else if (t.state === 'chase') {
      ctx.fillStyle = '#d8452f'; ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', t.x, topY);
    }
  }

  function drawDustDevil(ctx, t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    for (let i = 0; i < 14; i++) {
      const k = i / 14;
      const r = 10 + k * 46;
      const y = -k * 120;
      ctx.strokeStyle = `rgba(190,140,80,${0.55 - k * 0.3})`;
      ctx.lineWidth = 6 - k * 3;
      ctx.beginPath();
      ctx.ellipse(Math.sin(t.spin * 0.5 + k * 4) * 10 * k, y, r, r * 0.3, 0, t.spin + i, t.spin + i + 4.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDecoy(ctx, d) {
    const k = (AR.t * 2) % 1;
    ctx.strokeStyle = `rgba(242,140,40,${1 - k})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(d.x, d.y, 20 + k * 60, 0, U.TAU); ctx.stroke();
    ctx.drawImage(WE.Icons.power('decoy', 48), d.x - 24, d.y - 24);
  }

  function drawInk(ctx, z) {
    const r = U.rng(Math.floor(z.seed));
    ctx.globalAlpha = Math.min(0.85, z.t) * 0.85;
    for (let i = 0; i < 18; i++) {
      const a = r() * U.TAU, d = r() * z.r * 0.8;
      const g = ctx.createRadialGradient(z.x + Math.cos(a) * d, z.y + Math.sin(a) * d, 2, z.x + Math.cos(a) * d, z.y + Math.sin(a) * d, z.r * 0.5);
      g.addColorStop(0, 'rgba(25,18,30,0.9)'); g.addColorStop(1, 'rgba(25,18,30,0)');
      ctx.fillStyle = g;
      U.ellipse(ctx, z.x + Math.cos(a) * d, z.y + Math.sin(a) * d, z.r * 0.5, z.r * 0.5, 0); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFx(ctx, f) {
    const k = f.t / f.dur;
    if (f.type === 'ring') {
      ctx.strokeStyle = U.rgba(f.col, 1 - k); ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, U.lerp(f.r, f.maxR, U.easeOut(k)), U.lerp(f.r, f.maxR, U.easeOut(k)) * 0.6, 0, 0, U.TAU); ctx.stroke();
    } else {
      ctx.fillStyle = U.rgba(f.col, 1 - k);
      U.ellipse(ctx, f.x, f.y, f.r * (1 - k * 0.5), f.r * (1 - k * 0.5), 0); ctx.fill();
    }
  }

  function drawWaterOverlay(ctx, W, H) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const t = AR.t;
    for (let i = 0; i < 7; i++) {
      const x = ((i * 260 + t * 30) % (W + 300)) - 150;
      ctx.fillStyle = 'rgba(180,230,255,0.035)';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 260, H); ctx.lineTo(x + 140, H); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = AR.styleId === 'reef' ? 'rgba(20,110,150,0.16)' : 'rgba(10,40,70,0.15)';
    ctx.fillRect(0, 0, W, H);
  }

  // Edge arrows: Super Sniffer points to prey, Radar Ears to threats.
  function drawArrows(ctx, W, H, cx, cy, vs) {
    const P = AR.player;
    const items = [];
    if (eff('sniff')) {
      const sorted = [...AR.prey].sort((a, b) => U.dist(a.x, a.y, P.x, P.y) - U.dist(b.x, b.y, P.x, P.y)).slice(0, 3);
      for (const p of sorted) items.push([p, '#7fe0a0']);
    }
    if (eff('warn')) for (const t of AR.threats) items.push([t, '#ff6a50']);
    const px = (P.x - cx) * vs, py = (P.y - cy) * vs;
    for (const [e, col] of items) {
      const a = U.angle(P.x, P.y, e.x, e.y);
      const d = U.dist(P.x, P.y, e.x, e.y);
      const rr = Math.min(Math.min(W, H) * 0.4, 90 + d * vs * 0.25);
      const ax = px + Math.cos(a) * rr, ay = py + Math.sin(a) * rr;
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
      ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-4, 0); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  function drawMinimap(ctx, W, H) {
    const mw = Math.min(170, W * 0.22), mh = mw * WORLD.h / WORLD.w;
    const x0 = W - mw - Math.max(16, WE.Game.safeR), y0 = H - mh - (WE.Input.isTouch ? 120 : 110) - Math.max(0, WE.Game.safeB);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(14,28,22,0.7)';
    U.roundRect(ctx, x0 - 4, y0 - 4, mw + 8, mh + 8, 8); ctx.fill();
    ctx.drawImage(AR.ground.canvas, x0, y0, mw, mh);
    const k = mw / WORLD.w;
    const P = AR.player;
    const showPrey = eff('reveal') || eff('sniff');
    for (const p of AR.prey) if (showPrey || !p.st.hidden) { ctx.fillStyle = '#7fe0a0'; ctx.fillRect(x0 + p.x * k - 2, y0 + p.y * k - 2, 4, 4); }
    for (const f of AR.food) { ctx.fillStyle = '#c8f0a0'; ctx.fillRect(x0 + f.x * k - 2, y0 + f.y * k - 2, 4, 4); }
    for (const t of AR.threats) { ctx.fillStyle = '#ff6a50'; ctx.beginPath(); ctx.arc(x0 + t.x * k, y0 + t.y * k, 3.5, 0, U.TAU); ctx.fill(); }
    ctx.fillStyle = '#ff8a3d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x0 + P.x * k, y0 + P.y * k, 4.5, 0, U.TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  AR.warmList = function (a) {
    const list = [[a.art, 'idle'], [a.art, a.flyer ? 'fly' : 'walk'], [a.art, 'run']];
    for (const t of a.targets) { const c = WE.creature(t); list.push([c.art, 'idle']); if (!c.food) list.push([c.art, 'walk'], [c.art, 'run']); }
    for (const t of a.threats) { const c = WE.creature(t); if (c.art) list.push([c.art, 'idle'], [c.art, THREAT[t] && THREAT[t].fly ? 'fly' : 'walk'], [c.art, 'run']); }
    return list;
  };

  AR.WORLD = WORLD;
  AR.TIME = TIME;
  WE.Arena = AR;
})(window.WE);
