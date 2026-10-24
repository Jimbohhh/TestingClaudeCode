// Fossil Finders: screens, HUD, save data and the main loop.
(function (FD, WE) {
  const U = WE.U, el = U.el;
  const W = 960, H = 600;
  const SAVE_KEY = 'fossil-finders-v1';
  const $ = id => document.getElementById(id);

  // ---------------- save ----------------
  const G = FD.Game = { mode: 'title', save: { unlocked: 1, exhibits: {}, cabinet: {}, tutorialDone: false } };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.exhibits) Object.assign(G.save, s); } catch (e) { /* storage blocked or empty */ }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) { /* ignore */ } };

  // ---------------- icons (inline SVG) ----------------
  const ICON = {
    pick: '<svg viewBox="0 0 48 48"><path d="M8 18c9-8 23-9 33-4-9-1-18 1-25 7z" fill="#a8aeb4" stroke="#2b2118" stroke-width="2" stroke-linejoin="round"/><rect x="20" y="13" width="7" height="8" rx="1" fill="#5a6066" stroke="#2b2118" stroke-width="2"/><path d="M23 21l-6 22" stroke="#2b2118" stroke-width="7" stroke-linecap="round"/><path d="M23 21l-6 22" stroke="#9a6a3a" stroke-width="3.5" stroke-linecap="round"/></svg>',
    trowel: '<svg viewBox="0 0 48 48"><path d="M30 4L14 22l8 3 3 8L44 16c-2-7-7-11-14-12z" fill="#c4cad0" stroke="#2b2118" stroke-width="2" stroke-linejoin="round"/><path d="M19 27l-9 9" stroke="#2b2118" stroke-width="3"/><path d="M11 35l-6 6" stroke="#2b2118" stroke-width="8" stroke-linecap="round"/><path d="M11 35l-6 6" stroke="#b5562e" stroke-width="4.5" stroke-linecap="round"/></svg>',
    brush: '<svg viewBox="0 0 48 48"><path d="M30 18l-12 12c-3 3-9 4-12 10 7-1 11-4 15-8l12-12z" fill="#e2c88e" stroke="#2b2118" stroke-width="2" stroke-linejoin="round"/><path d="M29 15l5 5 3-3-5-5z" fill="#9aa0a6" stroke="#2b2118" stroke-width="2"/><path d="M33 13l9-9" stroke="#2b2118" stroke-width="7" stroke-linecap="round"/><path d="M33 13l9-9" stroke="#c0392b" stroke-width="3.5" stroke-linecap="round"/></svg>',
    hint: '<svg viewBox="0 0 48 48"><circle cx="21" cy="21" r="12" fill="none" stroke="currentColor" stroke-width="4"/><path d="M30 30l10 10" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>',
    back: '<svg viewBox="0 0 48 48"><path d="M28 10L14 24l14 14" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sound: '<svg viewBox="0 0 48 48"><path d="M8 18h8l10-8v28l-10-8H8z" fill="currentColor"/><path d="M32 16c4 4 4 12 0 16M37 11c7 7 7 19 0 26" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 48 48"><path d="M8 18h8l10-8v28l-10-8H8z" fill="currentColor"/><path d="M32 18l12 12M44 18L32 30" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .6-5.4 4.7 1.7 7.2L12 17.7 5.7 21.5l1.7-7.2L2 9.6 9 9z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
  };
  const icon = (name, cls) => { const s = el('span', { class: 'ico ' + (cls || '') }); s.innerHTML = ICON[name]; return s; };
  const stars = (n, of) => { const s = el('span', { class: 'stars' }); for (let i = 0; i < (of || 3); i++) s.appendChild(icon('star', i < n ? 'on' : 'off')); return s; };

  // ---------------- stage canvas ----------------
  const canvas = $('stage'), ctx = canvas.getContext('2d');
  let dpr = 1, cssScale = 1;
  function fit() {
    const wrap = $('stage-wrap');
    const pad = 20, hint = wrap.querySelector('.rotate-hint');
    const hintH = hint && getComputedStyle(hint).display !== 'none' ? hint.offsetHeight + 10 : 0;
    cssScale = Math.max(0.1, Math.min((wrap.clientWidth - pad) / W, (wrap.clientHeight - pad - hintH) / H));
    const cw = Math.floor(W * cssScale), ch = Math.floor(H * cssScale);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  }
  window.addEventListener('resize', fit);
  const toLogical = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };

  // ---------------- toasts ----------------
  function toast(text, kind) {
    const t = el('div', { class: 'toast ' + (kind || '') }, [text]);
    $('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2800);
    setTimeout(() => t.remove(), 3300);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  }

  // ---------------- screens ----------------
  function show(id) {
    for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
    $('hud-dig').hidden = id !== 'play-dig';
    $('hud-lab').hidden = id !== 'play-lab';
    $('toolbar').hidden = id !== 'play-dig';
    $('stage-wrap').classList.toggle('dim', id === 'screen-title');
    if (id === 'play-dig' || id === 'play-lab' || id === 'screen-title') { $('stage-wrap').hidden = false; requestAnimationFrame(fit); }
    else $('stage-wrap').hidden = true;
  }
  function modal(content, opts) {
    closeModal();
    const box = el('div', { class: 'modal-box ' + ((opts && opts.cls) || '') }, content);
    const m = el('div', { class: 'modal', id: 'modal' }, [box]);
    if (!(opts && opts.sticky)) m.addEventListener('pointerdown', e => { if (e.target === m) closeModal(); });
    document.getElementById('app').appendChild(m);
    return box;
  }
  function closeModal() { const m = $('modal'); if (m) m.remove(); }
  const btn = (label, cls, onClick, attrs) => { const b = el('button', Object.assign({ class: 'btn ' + (cls || ''), type: 'button' }, attrs || {}), Array.isArray(label) ? label : [label]); b.addEventListener('click', e => { FD.Sfx.unlock(); FD.Sfx.click(); onClick(e); }); return b; };

  // ---------------- title ----------------
  let titleScene = null;
  function buildTitleScene() {
    const dig = FD.DIGS.find(d => d.id === 'trex');
    const st = FD.Dig.create(dig, { attempt: 7 });
    // Clear a window of rock and dirt around the skull and back, as if mid-dig.
    const GW = W / 6;
    const holes = st.pieces.filter(p => ['skull', 'jaw', 'ribs', 'femur', 'neck'].includes(p.id));
    for (const p of holes) for (const c of p.cells) {
      const gx = c % GW, gy = Math.floor(c / GW);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const i = (gy + dy) * GW + gx + dx; if (i < 0 || i >= st.rock.length) continue;
        st.rock[i] = 0; st.dirt[i] = Math.max(0, Math.min(st.dirt[i], (Math.abs(dx) + Math.abs(dy)) * 0.15 - 0.1)); st.dust[i] = p.id === 'femur' ? 0.5 : 0;
      }
    }
    st.dirty = true; st.dl.rock = st.dl.dirt = st.dl.dust = true; st.tool = 'brush';
    titleScene = st;
  }
  function titleScreen() {
    G.mode = 'title';
    show('screen-title');
    const started = Object.keys(G.save.exhibits).length > 0 || G.save.unlocked > 1;
    const box = $('title-actions'); box.innerHTML = '';
    box.appendChild(btn(started ? 'Continue expedition' : 'Start digging', 'primary big', () => mapScreen()));
    box.appendChild(btn('Museum', 'ghost big', () => museumScreen()));
  }

  // ---------------- expedition map ----------------
  let mapCache = null;
  function sepiaMap(w, h) {
    if (mapCache && mapCache.width === w) return mapCache;
    const src = WE.WorldMap.render(w, h);
    const c = U.canvas(w, h), x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'color'; x.fillStyle = '#b89060'; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = '#e8d2a8'; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
    mapCache = c; return c;
  }
  function mapScreen() {
    G.mode = 'map';
    show('screen-map');
    const root = $('map-body'); root.innerHTML = '';
    const done = Object.keys(G.save.exhibits).length;
    $('map-count').textContent = done + ' / ' + FD.DIGS.length + ' skeletons in the museum';
    // World map with numbered survey flags
    const mw = 1000, mh = 500;
    const mapC = U.canvas(mw, mh), mx = mapC.getContext('2d');
    mx.drawImage(sepiaMap(mw, mh), 0, 0);
    const placed = [];
    FD.DIGS.forEach((d, i) => {
      let [px, py] = WE.WorldMap.project(d.lon, d.lat, mw, mh);
      for (const q of placed) if (Math.hypot(q[0] - px, q[1] - py) < 16) { px += 15; }
      placed.push([px, py]);
      const unlocked = i < G.save.unlocked, finished = !!G.save.exhibits[d.id];
      mx.strokeStyle = '#2b2118'; mx.lineWidth = 2; mx.beginPath(); mx.moveTo(px, py); mx.lineTo(px, py - 22); mx.stroke();
      mx.fillStyle = finished ? '#3a8a5a' : unlocked ? '#f06a2c' : '#8a7a66';
      mx.beginPath(); mx.moveTo(px, py - 22); mx.lineTo(px + 16, py - 17); mx.lineTo(px, py - 12); mx.fill();
      mx.fillStyle = '#fff'; mx.font = '700 9px Rubik, sans-serif'; mx.textAlign = 'center'; mx.fillText(String(i + 1), px + 6, py - 14);
    });
    mapC.className = 'world-map';
    root.appendChild(el('div', { class: 'map-frame' }, [mapC]));
    const grid = el('div', { class: 'dig-grid' });
    FD.DIGS.forEach((d, i) => {
      const unlocked = i < G.save.unlocked, ex = G.save.exhibits[d.id];
      const a = FD.creature(d.id);
      const card = el('button', { class: 'dig-card' + (unlocked ? '' : ' locked') + (ex ? ' done' : ''), type: 'button', disabled: unlocked ? null : 'disabled' }, [
        el('div', { class: 'dig-num' }, ['Dig ' + (i + 1)]),
        el('div', { class: 'dig-name' }, [ex ? a.name : unlocked ? 'Mystery fossil' : 'Locked']),
        el('div', { class: 'dig-site' }, [d.site]),
        el('div', { class: 'dig-meta' }, [d.region]),
        el('div', { class: 'dig-age' }, [d.mya + ' million years · ' + d.period]),
        ex ? stars(ex.stars) : unlocked ? el('div', { class: 'dig-go' }, [d.tutorial && !ex ? 'Training dig' : 'Ready to dig']) : icon('lock', 'lockico'),
      ]);
      if (unlocked) card.addEventListener('click', () => { FD.Sfx.unlock(); FD.Sfx.click(); briefing(d, i); });
      grid.appendChild(card);
    });
    root.appendChild(grid);
  }
  function briefing(d, i) {
    const rock = FD.rockFor(d), ex = G.save.exhibits[d.id];
    modal([
      el('div', { class: 'eyebrow' }, ['Dig ' + (i + 1) + ' · Field briefing']),
      el('h2', {}, [d.site]),
      el('p', { class: 'meta' }, [d.region + ' · ' + d.mya + ' million years ago (' + d.period + ')']),
      el('div', { class: 'note' }, [el('b', {}, [rock.name + '. ']), rock.note]),
      el('p', {}, [el('b', {}, ['Clue: ']), ex ? FD.creature(d.id).name + '. ' + d.clue : d.clue]),
      el('ul', { class: 'steps' }, [
        el('li', {}, [icon('pick'), el('span', {}, [el('b', {}, ['Rock pick']), ' breaks hard rock. Too rough near bone!'])]),
        el('li', {}, [icon('trowel'), el('span', {}, [el('b', {}, ['Trowel']), ' scrapes away loose dirt.'])]),
        el('li', {}, [icon('brush'), el('span', {}, [el('b', {}, ['Brush']), ' sweeps dust safely off bones.'])]),
      ]),
      el('div', { class: 'row' }, [btn('Back', 'ghost', closeModal), btn(ex ? 'Dig again' : 'Start dig', 'primary', () => { closeModal(); startDig(d, i); })]),
    ]);
  }

  // ---------------- dig ----------------
  let digSt = null, labSt = null, tipTimer = 0, tipIdx = 0, tutStep = 0;
  function startDig(d, i) {
    G.mode = 'loading'; closeModal();
    $('loading').hidden = false;
    setTimeout(() => {
      digSt = FD.Dig.create(d, { attempt: (G.save.exhibits[d.id] ? Date.now() % 1000 : 0), onEvent: digEvent });
      digSt.index = i;
      $('loading').hidden = true;
      G.mode = 'dig';
      show('play-dig');
      $('dig-title').textContent = 'Dig ' + (i + 1) + ' · ' + d.site;
      $('dig-sub').textContent = (G.save.exhibits[d.id] ? FD.creature(d.id).name : 'Mystery fossil') + ' · ' + d.mya + ' million years old';
      setTool('trowel');
      tutStep = d.tutorial && !G.save.tutorialDone ? 1 : 0;
      setTip(tutStep ? tutorialText() : FD.TIPS[tipIdx++ % FD.TIPS.length]);
      if (tutStep) setTool('pick');
      updateDigHud();
    }, 30);
  }
  function tutorialText() {
    return ['',
      'Training dig: hard grey rock covers the site. Choose the rock pick and tap or drag on the rock.',
      'Now switch to the trowel and scrape away the loose brown dirt. Bone chips on the surface are a clue.',
      'Fossil showing! Use the brush to sweep off the last dust. The brush never damages bone.',
      'Tap "Jacket it!" to wrap the fossil in plaster so it can travel to the lab safely.',
      'Great work! Uncover and jacket every piece, then press Finish dig.'][tutStep];
  }
  function advanceTut(to) { if (tutStep && to > tutStep) { tutStep = to; setTip(tutorialText()); highlightTool(); } }
  function setTip(text) { $('dig-tip').textContent = text; tipTimer = 0; }
  function highlightTool() {
    const want = tutStep === 1 ? 'pick' : tutStep === 2 ? 'trowel' : tutStep === 3 ? 'brush' : null;
    for (const b of document.querySelectorAll('.tool')) b.classList.toggle('coach', b.dataset.tool === want);
  }
  function setTool(t) {
    if (!digSt) return;
    FD.Dig.setTool(digSt, t);
    for (const b of document.querySelectorAll('.tool')) b.classList.toggle('on', b.dataset.tool === t);
    if (tutStep === 1 && t === 'pick') highlightTool();
  }
  function digEvent(type, data) {
    if (type === 'message') toast(data.text, data.kind);
    if (type === 'exposed') { toast(data.name + ' uncovered!', 'good'); advanceTut(4); }
    if (type === 'jacketed') { toast(data.name + ' jacketed (' + data.sci + ')', 'good'); advanceTut(5); updateDigHud(); }
    if (type === 'bonus') {
      const b = FD.Skel.BONUS[data.id];
      G.save.cabinet[data.id] = (G.save.cabinet[data.id] || 0) + 1; persist();
      toast('Bonus find: ' + b.name + '!', 'gold');
      modal([el('div', { class: 'eyebrow' }, ['Bonus find']), el('h2', {}, [b.name]), bonusThumb(data.id, 120), el('p', {}, [b.fact]), el('p', { class: 'meta' }, ['Added to your curiosity cabinet in the museum.']), el('div', { class: 'row' }, [btn('Keep digging', 'primary', closeModal)])], { cls: 'small' });
    }
    updateDigHud();
  }
  function bonusThumb(id, size) {
    const r = FD.Skel.renderBonus(id, size / (FD.Skel.BONUS[id].size * 1.4), { bone: '#cbb894', edge: '#4a3826', impression: '#8a7458' });
    const c = U.canvas(size, size); c.getContext('2d').drawImage(r.canvas, (size - r.w) / 2, (size - r.h) / 2);
    c.className = 'bonus-thumb'; return c;
  }
  let lastHud = '';
  function updateDigHud() {
    if (!digSt) return;
    const s = FD.Dig.stats(digSt);
    const key = [s.jacketed, s.exposed, Math.round(s.condition * 100), s.bonus].join('|');
    if (key === lastHud) return; lastHud = key;
    $('st-bones').textContent = s.jacketed + ' / ' + s.total;
    $('st-cond').textContent = Math.round(s.condition * 100) + '%';
    $('st-cond').parentElement.classList.toggle('bad', s.condition < 0.8);
    $('st-finds').textContent = String(s.bonus);
    $('st-bar').style.width = (s.jacketed / s.total * 100) + '%';
    const need = Math.ceil(s.total * 0.6);
    const fin = $('btn-finish');
    fin.disabled = s.jacketed < need;
    fin.textContent = s.jacketed >= s.total ? 'To the lab!' : s.jacketed >= need ? 'Finish dig' : 'Finish dig (' + (need - s.jacketed) + ' more)';
    fin.classList.toggle('pulse', s.jacketed >= s.total);
    if (s.jacketed >= s.total && !digSt.allDone) { digSt.allDone = true; toast('Every bone is jacketed! Take them to the lab.', 'good'); if (tutStep) { G.save.tutorialDone = true; persist(); } }
  }
  function finishDig() {
    const s = FD.Dig.stats(digSt);
    if (s.jacketed < s.total) {
      modal([el('h2', {}, ['Leave the rest behind?']), el('p', {}, [(s.total - s.jacketed) + ' bones are still in the ground. In the lab you can make plaster casts of missing bones, but you will earn fewer stars.']),
        el('div', { class: 'row' }, [btn('Keep digging', 'ghost', closeModal), btn('Go to the lab', 'primary', () => { closeModal(); startLab(); })])], { cls: 'small' });
    } else startLab();
  }
  function digTick(dt) {
    const p = digSt.pointer;
    FD.Dig.update(digSt, dt);
    tipTimer += dt;
    if (!tutStep && tipTimer > 14) setTip(FD.TIPS[tipIdx++ % FD.TIPS.length]);
    if (tutStep === 1 || tutStep === 2) {
      // Advance the coach when the player has cleared rock / dirt near bones
      const s = digSt;
      let rockLeft = 0, dirtLeftOnBone = 0, n = 0;
      for (const piece of s.pieces) for (const c of piece.cells) { rockLeft += s.rock[c] > 0.05 ? 1 : 0; dirtLeftOnBone += s.dirt[c] > 0.05 ? 1 : 0; n++; }
      if (tutStep === 1 && rockLeft / n < 0.25) advanceTut(2);
      if (tutStep === 2 && dirtLeftOnBone / n < 0.4) advanceTut(3);
    }
    if (p.down) updateDigHud();
  }

  // ---------------- lab ----------------
  function startLab() {
    labSt = FD.Lab.create(digSt, { onEvent: labEvent });
    G.mode = 'lab';
    show('play-lab');
    const d = digSt.dig;
    $('lab-title').textContent = 'Lab · ' + (G.save.exhibits[d.id] ? digSt.creature.name : 'Mystery fossil');
    labStep('assemble');
    toast(FD.LAB_TIPS[0], 'info');
  }
  function labStep(step) {
    const act = $('lab-actions'); act.innerHTML = '';
    const left = FD.Lab.remaining(labSt), miss = FD.Lab.missing(labSt);
    if (step === 'assemble') {
      $('lab-tip').textContent = left ? 'Drag each bone from the tray onto the matching place in the outline.' : miss ? 'All the bones you found are in place. Make plaster casts of the missing ones.' : 'Done!';
      if (miss && !left) act.appendChild(btn('Cast ' + miss + ' missing bone' + (miss > 1 ? 's' : ''), 'primary', () => { FD.Lab.castMissing(labSt); act.innerHTML = ''; $('lab-tip').textContent = FD.LAB_TIPS[1]; }));
      else if (miss) act.appendChild(el('span', { class: 'lab-note' }, [miss + ' bone' + (miss > 1 ? 's' : '') + ' missing (left in the ground)']));
    } else if (step === 'mount') {
      $('lab-tip').textContent = 'The skeleton is complete! ' + (labSt.align ? 'Mount it on a steel frame for the museum.' : 'Put the slab on display for the museum.');
      act.appendChild(btn(labSt.align ? 'Mount the skeleton' : 'Put it on display', 'primary pulse', () => { FD.Lab.mount(labSt); act.innerHTML = ''; $('lab-tip').textContent = FD.LAB_TIPS[2]; const mine = labSt; setTimeout(() => { if (G.mode === 'lab' && labSt === mine) identify(); }, 1500); }));
    }
  }
  function labEvent(type, p) {
    if (type === 'placed') { toast(p.name + ' in place', 'good'); if (FD.Lab.remaining(labSt) > 1 || FD.Lab.missing(labSt)) setTimeout(() => labSt.phase === 'assemble' && !labSt.pieces.every(q => q.placed) && labStep('assemble'), 0); }
    if (type === 'wrong') toast(p.tries > 1 ? 'Look for the glowing spot.' : 'Not quite. Try another spot. Think about where a ' + p.name.toLowerCase() + ' goes.', 'warn');
    if (type === 'assembled') { FD.Sfx.expose(); labStep('mount'); }
  }
  function identify() {
    const d = digSt.dig, a = digSt.creature;
    const opts = [{ name: a.name, ok: true }, ...d.decoys.map(x => ({ name: FD.decoyName(x), ok: false }))];
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    const box = modal([
      el('div', { class: 'eyebrow' }, ['Identify your fossil']),
      el('h2', {}, ['What did you dig up?']),
      el('p', {}, ['Look closely at the skeleton. ', el('b', {}, ['Clue: ']), d.clue]),
      el('div', { class: 'choices' }, opts.map(o => btn(o.name, 'choice', () => {
        labSt.identified = o.ok;
        if (o.ok) FD.Sfx.collect(); else FD.Sfx.wrong();
        for (const b of box.querySelectorAll('.choice')) { b.disabled = true; if (b.textContent === a.name) b.classList.add('right'); }
        if (!o.ok) box.querySelectorAll('.choice').forEach(b => { if (b.textContent === o.name) b.classList.add('wrong'); });
        box.appendChild(el('p', { class: o.ok ? 'good' : 'bad' }, [o.ok ? 'Correct! Bonus star.' : 'Not this time. It is ' + a.name + '.']));
        box.appendChild(el('div', { class: 'row' }, [btn('Bring it to life', 'primary', () => { closeModal(); reveal(); })]));
      }))),
    ], { sticky: true, cls: 'small' });
  }
  function reveal() {
    FD.Lab.reveal(labSt);
    const d = digSt.dig, a = digSt.creature;
    const s = FD.Dig.stats(digSt);
    const found = s.jacketed / s.total;
    const st = (found >= 0.9 ? 1 : 0) + (s.condition >= 0.85 ? 1 : 0) + (labSt.identified ? 1 : 0);
    const prev = G.save.exhibits[d.id];
    G.save.exhibits[d.id] = {
      stars: Math.max(st, prev ? prev.stars : 0), found: s.jacketed, total: s.total, condition: Math.round(s.condition * 100),
      cast: labSt.pieces.filter(p => p.cast).map(p => p.id),
    };
    const idx = FD.DIGS.indexOf(d);
    const newUnlock = idx + 2 > G.save.unlocked && idx + 1 < FD.DIGS.length;
    G.save.unlocked = Math.max(G.save.unlocked, Math.min(FD.DIGS.length, idx + 2));
    persist();
    exhibitCache.clear();
    $('lab-title').textContent = 'Museum · ' + a.name;
    $('lab-tip').textContent = 'This is what ' + a.name + ' may have looked like in life. Scientists work out its shape from bones, muscle scars and living relatives.';
    const act = $('lab-actions'); act.innerHTML = '';
    const tog = el('div', { class: 'seg' });
    const setV = v => { FD.Lab.setView(labSt, v); for (const b of tog.children) b.classList.toggle('on', b.dataset.v === v); };
    tog.appendChild(btn('Skeleton', '', () => setV('bones'), { 'data-v': 'bones' }));
    tog.appendChild(btn('Living animal', 'on', () => setV('life'), { 'data-v': 'life' }));
    act.appendChild(tog);
    act.appendChild(btn('Field report', 'primary', () => report(a, d, s, st, newUnlock)));
    const mine = labSt;
    setTimeout(() => { if (G.mode === 'lab' && labSt === mine) report(a, d, s, st, newUnlock); }, 2200);
  }
  function factBlock(a, d) {
    return [
      el('div', { class: 'facts-grid' }, [
        el('div', {}, [el('span', {}, ['Group']), a.cls]),
        el('div', {}, [el('span', {}, ['Lived']), a.lived || (d.mya + ' million years ago')]),
        el('div', {}, [el('span', {}, ['Length']), a.length]),
        el('div', {}, [el('span', {}, ['Weight']), a.weight]),
        el('div', {}, [el('span', {}, ['Diet']), a.diet]),
        el('div', {}, [el('span', {}, ['Found at']), d.site + ', ' + d.region]),
      ]),
      el('p', { class: 'blurb' }, [a.blurb]),
      el('ul', { class: 'facts' }, a.facts.map(f => el('li', {}, [f]))),
    ];
  }
  function report(a, d, s, st, newUnlock) {
    if ($('modal')) return;
    const next = FD.DIGS[FD.DIGS.indexOf(d) + 1];
    modal([
      el('div', { class: 'eyebrow' }, ['Field report · Dig ' + (FD.DIGS.indexOf(d) + 1)]),
      el('h2', {}, [a.name]),
      el('p', { class: 'sci' }, [a.sci]),
      el('div', { class: 'score' }, [
        stars(st),
        el('ul', {}, [
          el('li', { class: s.jacketed / s.total >= 0.9 ? 'ok' : '' }, [(a.id === 'ammonite' ? 'Fossil pieces' : 'Bones') + ' recovered: ' + s.jacketed + ' of ' + s.total]),
          el('li', { class: s.condition >= 0.85 ? 'ok' : '' }, ['Bone condition: ' + Math.round(s.condition * 100) + '%']),
          el('li', { class: labSt.identified ? 'ok' : '' }, [labSt.identified ? 'Identified correctly' : 'Not identified']),
        ]),
      ]),
      ...factBlock(a, d),
      newUnlock && next ? el('p', { class: 'unlock' }, ['New dig unlocked: ' + next.site + ', ' + next.region]) : null,
      d.finale ? el('p', { class: 'unlock' }, ['You dug up the king of Hell Creek! Your museum is complete. Try digging again for 3 stars everywhere.']) : null,
      el('div', { class: 'row' }, [btn('Look at it', 'ghost', closeModal), btn('Museum', 'ghost', () => { closeModal(); museumScreen(); }), btn('Expedition map', 'primary', () => { closeModal(); mapScreen(); })]),
    ], { cls: 'report' });
  }

  // ---------------- museum ----------------
  const exhibitCache = new Map();
  function exhibitCanvas(a, view, w, h) {
    const key = a.id + view + w;
    if (!exhibitCache.has(key)) exhibitCache.set(key, FD.Lab.exhibit(a, view, w, h, G.save.exhibits[a.id]));
    const src = exhibitCache.get(key);
    const c = U.canvas(w, h); c.getContext('2d').drawImage(src, 0, 0); return c;
  }
  function museumScreen() {
    G.mode = 'museum';
    show('screen-museum');
    const root = $('museum-body'); root.innerHTML = '';
    const total = Object.values(G.save.exhibits).reduce((n, e) => n + e.stars, 0);
    $('museum-count').textContent = Object.keys(G.save.exhibits).length + ' / ' + FD.DIGS.length + ' exhibits · ' + total + ' / ' + FD.DIGS.length * 3 + ' stars';
    const grid = el('div', { class: 'exhibit-grid' });
    FD.DIGS.forEach((d, i) => {
      const ex = G.save.exhibits[d.id], a = FD.creature(d.id);
      const card = el('button', { class: 'exhibit' + (ex ? '' : ' empty'), type: 'button', disabled: ex ? null : 'disabled' }, [
        ex ? exhibitCanvas(a, 'bones', 260, 150) : el('div', { class: 'empty-plinth' }, ['?']),
        el('div', { class: 'ex-name' }, [ex ? a.name : 'Empty plinth']),
        ex ? stars(ex.stars) : el('div', { class: 'ex-meta' }, ['Dig ' + (i + 1)]),
      ]);
      if (ex) card.addEventListener('click', () => { FD.Sfx.unlock(); FD.Sfx.click(); exhibitDetail(a, d); });
      grid.appendChild(card);
    });
    root.appendChild(grid);
    root.appendChild(el('h3', { class: 'section' }, ['Curiosity cabinet']));
    const cab = el('div', { class: 'cabinet' });
    for (const id of Object.keys(FD.Skel.BONUS)) {
      const n = G.save.cabinet[id] || 0, b = FD.Skel.BONUS[id];
      const item = el('button', { class: 'cab-item' + (n ? '' : ' empty'), type: 'button', disabled: n ? null : 'disabled' }, [
        n ? bonusThumb(id, 76) : el('div', { class: 'empty-plinth small' }, ['?']),
        el('div', { class: 'ex-name' }, [n ? b.name : 'Not found yet']),
        n > 1 ? el('div', { class: 'ex-meta' }, ['x' + n]) : null,
      ]);
      if (n) item.addEventListener('click', () => modal([el('h2', {}, [b.name]), bonusThumb(id, 140), el('p', {}, [b.fact]), el('div', { class: 'row' }, [btn('Close', 'primary', closeModal)])], { cls: 'small' }));
      cab.appendChild(item);
    }
    root.appendChild(cab);
  }
  function exhibitDetail(a, d) {
    const ex = G.save.exhibits[a.id];
    const wrap = el('div', { class: 'exhibit-view' });
    const setV = v => { wrap.innerHTML = ''; wrap.appendChild(exhibitCanvas(a, v, 640, 340)); for (const b of tog.children) b.classList.toggle('on', b.dataset.v === v); };
    const tog = el('div', { class: 'seg' }, [btn('Skeleton', 'on', () => setV('bones'), { 'data-v': 'bones' }), btn('Living animal', '', () => setV('life'), { 'data-v': 'life' })]);
    modal([
      el('div', { class: 'eyebrow' }, ['Exhibit · Dig ' + (FD.DIGS.indexOf(d) + 1)]),
      el('h2', {}, [a.name]), el('p', { class: 'sci' }, [a.sci]),
      wrap, tog,
      el('p', { class: 'meta' }, [ex.found + ' of ' + ex.total + ' bones are real fossil' + (ex.cast.length ? ', ' + ex.cast.length + ' are plaster casts' : '') + '. Condition ' + ex.condition + '%.']),
      ...factBlock(a, d),
      el('div', { class: 'row' }, [btn('Close', 'primary', closeModal)]),
    ], { cls: 'report' });
    setV('bones');
  }

  // ---------------- input ----------------
  canvas.addEventListener('pointerdown', e => {
    FD.Sfx.unlock();
    const p = toLogical(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer already released */ }
    if (G.mode === 'dig') FD.Dig.pointerDown(digSt, p.x, p.y);
    if (G.mode === 'lab') FD.Lab.pointerDown(labSt, p.x, p.y);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    const p = toLogical(e);
    if (G.mode === 'dig') FD.Dig.pointerMove(digSt, p.x, p.y, e.pointerType === 'mouse' || digSt.pointer.down);
    if (G.mode === 'lab') FD.Lab.pointerMove(labSt, p.x, p.y);
  });
  const up = () => { if (G.mode === 'dig') { FD.Dig.pointerUp(digSt); if (!matchMedia('(pointer: fine)').matches) digSt.pointer.inside = false; } if (G.mode === 'lab') FD.Lab.pointerUp(labSt); };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (G.mode === 'dig' && !digSt.pointer.down) digSt.pointer.inside = false; });
  window.addEventListener('keydown', e => {
    if (G.mode !== 'dig' || $('modal')) return;
    const k = e.key.toLowerCase();
    if (k === '1' || k === 'p') setTool('pick');
    if (k === '2' || k === 't') setTool('trowel');
    if (k === '3' || k === 'b') setTool('brush');
  });

  // ---------------- HUD wiring ----------------
  for (const b of document.querySelectorAll('.tool')) {
    b.insertBefore(icon(b.dataset.tool), b.firstChild);
    b.addEventListener('click', () => { FD.Sfx.unlock(); FD.Sfx.click(); setTool(b.dataset.tool); });
  }
  $('btn-finish').addEventListener('click', () => { FD.Sfx.click(); finishDig(); });
  $('btn-hint').insertBefore(icon('hint'), $('btn-hint').firstChild);
  $('btn-hint').addEventListener('click', () => {
    const h = FD.Dig.hint(digSt); if (!h) return;
    FD.Sfx.click();
    digSt.hintMark = { x: h.x, y: h.y, t: digSt.t };
    const col = 'ABCDEFGHIJKL'[Math.floor(h.x / 80)], row = Math.floor(h.y / 75) + 1;
    toast('Field notes: try grid square ' + col + row + '.', 'info');
  });
  for (const id of ['dig-back', 'lab-back', 'map-back', 'museum-back']) {
    $(id).insertBefore(icon('back'), $(id).firstChild);
  }
  $('dig-back').addEventListener('click', () => modal([el('h2', {}, ['Leave this dig?']), el('p', {}, ['Your progress at this site will be lost.']), el('div', { class: 'row' }, [btn('Stay', 'ghost', closeModal), btn('Leave', 'primary', () => { closeModal(); digSt = null; mapScreen(); })])], { cls: 'small' }));
  $('lab-back').addEventListener('click', () => { if (labSt && labSt.phase === 'reveal') { mapScreen(); return; } modal([el('h2', {}, ['Leave the lab?']), el('p', {}, ['The skeleton is not finished yet. Your bones will be lost.']), el('div', { class: 'row' }, [btn('Stay', 'ghost', closeModal), btn('Leave', 'primary', () => { closeModal(); mapScreen(); })])], { cls: 'small' }); });
  $('map-back').addEventListener('click', () => { FD.Sfx.click(); titleScreen(); });
  $('museum-back').addEventListener('click', () => { FD.Sfx.click(); G.mode === 'museum' && titleScreen(); });
  $('btn-museum-map').addEventListener('click', () => { FD.Sfx.click(); museumScreen(); });
  const snd = $('btn-sound');
  const setSnd = () => { snd.innerHTML = ''; snd.appendChild(icon(FD.Sfx.muted ? 'mute' : 'sound')); snd.setAttribute('aria-label', FD.Sfx.muted ? 'Sound off' : 'Sound on'); };
  snd.addEventListener('click', () => { FD.Sfx.setMuted(!FD.Sfx.muted); setSnd(); FD.Sfx.unlock(); FD.Sfx.click(); });
  setSnd();

  // ---------------- loop ----------------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!$('stage-wrap').hidden) {
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      if (G.mode === 'dig' && digSt) {
        digTick(dt);
        FD.Dig.render(digSt, ctx);
        if (digSt.hintMark && digSt.t - digSt.hintMark.t < 3) {
          const k = (digSt.t - digSt.hintMark.t) % 1;
          ctx.strokeStyle = 'rgba(240,106,44,' + (1 - k) + ')'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(digSt.hintMark.x, digSt.hintMark.y, 10 + k * 40, 0, U.TAU); ctx.stroke();
        }
      } else if (G.mode === 'lab' && labSt) {
        FD.Lab.update(labSt, dt);
        FD.Lab.render(ctx, labSt);
      } else if (G.mode === 'title' && titleScene) {
        titleScene.t += dt;
        FD.Dig.render(titleScene, ctx);
      }
    }
    requestAnimationFrame(frame);
  }

  // ---------------- boot ----------------
  function boot() {
    buildTitleScene();
    $('loading').hidden = true;
    titleScreen();
    fit();
    requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(boot, 0)); else setTimeout(boot, 0);
  FD._debug = { get dig() { return digSt; }, get lab() { return labSt; }, startDig, startLab, mapScreen, museumScreen, G };
})(window.FD, window.WE);
