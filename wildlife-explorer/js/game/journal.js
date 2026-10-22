// The WildDex: a handheld field journal with animal entries, the world map
// (travel between habitats) and the creature-power collection.
(function (WE) {
  const U = WE.U, el = U.el, I = WE.Icons, S = WE.Sprites, B = WE.BG;
  const J = { open: null, tab: 'animals', filter: 'all' };
  let wrap = null, body = null, stageRAF = 0;

  J.open = function (tab, entryId) {
    if (wrap) J.close(true);
    WE.Audio.play('open');
    J.tab = tab || 'animals';
    const st = WE.State;
    const tabs = [['animals', 'Animals'], ['map', 'World map'], ['powers', 'Powers']];
    const tabBtns = tabs.map(([id, label]) => el('button', {
      class: 'dex-tab', role: 'tab', 'aria-selected': id === J.tab ? 'true' : 'false', id: 'tab-' + id,
      onclick: () => { WE.Audio.play('click'); J.tab = id; tabBtns.forEach(b => b.setAttribute('aria-selected', b.id === 'tab-' + id ? 'true' : 'false')); render(); },
    }, [label]));
    body = el('div', { class: 'dex-body' });
    const dex = el('div', { class: 'dex', role: 'dialog', 'aria-label': 'WildDex' }, [
      el('div', { class: 'dex-head' }, [
        el('div', { class: 'dex-led' }),
        el('div', { class: 'dex-title', html: `WildDex <small>${st.foundCount()}/24 FOUND · ${st.unlockedPowers().length} POWERS · ${st.rank().toUpperCase()}</small>` }),
        el('div', { class: 'dex-tabs', role: 'tablist' }, tabBtns),
        el('button', { class: 'dex-close', 'aria-label': 'Close WildDex', id: 'dex-close', onclick: () => J.close() }, [el('img', { src: I.uiURL('close', 48), alt: '' })]),
      ]),
      el('div', { class: 'dex-screen' }, [body]),
    ]);
    wrap = el('div', { class: 'dex-wrap' }, [dex]);
    wrap.addEventListener('click', e => { if (e.target === wrap) J.close(); });
    document.getElementById('ui').appendChild(wrap);
    WE.Game.pushOverlay();
    J.keys = e => { if ((e.key === 'Escape' || e.code === 'KeyJ') && !document.querySelector('.modal-wrap')) J.close(); };
    window.addEventListener('keydown', J.keys);
    J.entry = entryId || null;
    render();
  };

  J.close = function (silent) {
    if (!wrap) return;
    cancelAnimationFrame(stageRAF);
    wrap.remove(); wrap = null;
    window.removeEventListener('keydown', J.keys);
    WE.Game.popOverlay();
    if (!silent) WE.Audio.play('close');
  };
  J.isOpen = () => !!wrap;

  function render() {
    cancelAnimationFrame(stageRAF);
    body.innerHTML = '';
    body.scrollTop = 0;
    if (J.tab === 'animals') J.entry ? renderEntry(J.entry) : renderGrid();
    else if (J.tab === 'map') renderMap();
    else renderPowers();
  }

  // ---------------- Grid ----------------
  function renderGrid() {
    const st = WE.State;
    const pills = [['all', 'All habitats', '#1c2a23'], ...WE.HABITATS.map(h => [h.id, h.name, h.color])];
    body.appendChild(el('div', { class: 'hab-filter' }, pills.map(([id, label, col]) => el('button', {
      class: 'hab-pill', 'aria-pressed': J.filter === id ? 'true' : 'false',
      onclick: () => { J.filter = id; render(); },
    }, [el('i', { style: `background:${col}` }), label]))));
    for (const h of WE.HABITATS) {
      if (J.filter !== 'all' && J.filter !== h.id) continue;
      const list = WE.ANIMALS.filter(a => a.habitat === h.id);
      const group = el('div', { class: 'hab-group' }, [
        el('h3', {}, [h.name, el('small', { text: `${h.region} · ${st.foundCount(h.id)}/${list.length} found${st.isUnlocked(h.id) ? '' : ' · locked'}` })]),
        el('div', { class: 'dex-grid' }, list.map(a => card(a))),
      ]);
      body.appendChild(group);
    }
  }

  function card(a) {
    const found = WE.State.isFound(a.id);
    return el('button', {
      class: 'dex-card' + (found ? '' : ' locked'), 'aria-label': found ? a.name : `Undiscovered animal number ${a.num}`,
      onclick: () => { WE.Audio.play('click'); J.entry = a.id; render(); },
    }, [
      el('div', { class: 'art' }, [el('img', { src: WE.UI.portraitURL(a.art, !found), alt: '' })]),
      el('div', { class: 'num', text: '#' + String(a.num).padStart(3, '0') }),
      el('div', { class: 'nm', text: found ? a.name : '???' }),
      found ? el('img', { class: 'badge', src: I.powerDataURL(a.power, 52), alt: '' }) : null,
    ]);
  }

  // ---------------- Entry ----------------
  function renderEntry(id) {
    const a = WE.animalById(id);
    const st = WE.State;
    const found = st.isFound(id);
    const hab = WE.habitatById(a.habitat);
    body.appendChild(el('button', { class: 'back-link', onclick: () => { J.entry = null; render(); } }, [el('img', { src: I.uiURL('back', 32, '#4d5d52'), alt: '' }), 'All animals']));

    const stageWrap = el('div', { class: 'entry-stage' });
    const cv = el('canvas');
    stageWrap.appendChild(cv);
    const hero = el('div', { class: 'entry-hero' }, [stageWrap]);
    const photo = st.data.photos[id];
    let showPhoto = false;
    if (found && photo) {
      const tg = el('div', { class: 'stage-toggle' });
      const live = el('button', { 'aria-pressed': 'true' }, ['Live view']);
      const ph = el('button', { 'aria-pressed': 'false' }, ['Your field photo']);
      live.onclick = () => { showPhoto = false; live.setAttribute('aria-pressed', 'true'); ph.setAttribute('aria-pressed', 'false'); };
      ph.onclick = () => { showPhoto = true; live.setAttribute('aria-pressed', 'false'); ph.setAttribute('aria-pressed', 'true'); };
      tg.append(live, ph);
      hero.appendChild(tg);
    }
    const photoImg = photo ? Object.assign(new Image(), { src: photo }) : null;

    const info = el('div', { class: 'entry-info' });
    info.appendChild(el('div', { class: 'entry-num', text: `#${String(a.num).padStart(3, '0')} · ${hab.name}` }));
    if (!found) {
      info.appendChild(el('h2', { text: 'Undiscovered' }));
      info.appendChild(el('div', { class: 'locked-note', html: `Somewhere in the <b>${hab.name}</b> (${hab.region}) lives a ${a.cls.toLowerCase()} that is a ${a.diet.toLowerCase().split(' (')[0]}. Find it and photograph it with your field camera to unlock this entry and its creature power.` }));
      const req = st.unlockRequirement(hab.id);
      const acts = el('div', { class: 'entry-actions' });
      if (st.isUnlocked(hab.id)) acts.appendChild(el('button', { class: 'btn', onclick: () => travel(hab.id) }, [el('img', { src: I.uiURL('globe', 48, '#2a1406'), alt: '' }), `Travel to ${hab.name}`]));
      else if (req) acts.appendChild(el('div', { class: 'locked-note', text: `Locked: discover ${req.need} animals in the ${req.prev.name} first (${req.have}/${req.need}).` }));
      info.appendChild(acts);
    } else {
      const status = WE.STATUS[a.status];
      info.append(
        el('h2', { text: a.name }),
        el('div', { class: 'sci', text: a.sci }),
        el('p', { class: 'entry-blurb', text: a.blurb }),
        el('dl', { class: 'stats' }, [
          stat('Class', a.cls), stat('Diet', a.diet), stat('Size', a.length), stat('Weight', a.weight),
          stat('Lifespan', a.lifespan), stat('Top speed', a.speed), stat('Range', a.range),
          el('div', {}, [el('dt', { text: 'Conservation status' }), el('dd', {}, [statusScale(a.status), el('div', { style: 'font-size:13px;margin-top:3px', text: a.statusNote || status.label })])]),
        ]),
        el('div', {}, [el('div', { class: 'chain' }, [el('span', { class: 'lab', text: 'Fun facts' })]), el('ul', { class: 'facts' }, a.facts.map(f => el('li', { text: f })))]),
        foodChain(a),
        el('div', { class: 'power-card' }, [el('img', { src: I.powerDataURL(a.power, 128), alt: '' }), el('div', {}, [
          el('div', { class: 'pn', text: WE.POWERS[a.power].name }),
          el('div', { class: 'pd', text: WE.POWERS[a.power].desc }),
          el('div', { class: 'pb', text: 'Real biology: ' + WE.POWERS[a.power].bio }),
        ])]),
        el('div', { class: 'entry-actions' }, [
          el('button', { class: 'btn', onclick: () => { J.close(true); WE.UI.arenaSetup(a); } }, [el('img', { src: I.uiURL('paw', 48, '#2a1406'), alt: '' }), a.role === 'hunt' ? `Hunt as ${a.name.split(' ').pop()}` : `Survive as ${a.name.split(' ').pop()}`]),
          el('button', { class: 'btn teal', onclick: () => WE.UI.quiz(a, () => { if (wrap) render(); }) }, [el('img', { src: I.uiURL('quiz', 48), alt: '' }), st.data.quiz[id] ? 'Retake quiz' : 'Field quiz']),
          el('button', { class: 'btn secondary', onclick: () => travel(hab.id) }, [el('img', { src: I.uiURL('globe', 48, '#1c2a23'), alt: '' }), 'Travel to habitat']),
        ]),
        st.data.quiz[id] || st.data.stars[id] ? el('div', { style: 'font-size:13px;font-weight:700;color:var(--ink-soft)', text: [st.data.quiz[id] ? 'Expert star earned' : '', st.data.stars[id] ? `Best challenge: ${st.data.stars[id]} of 3 stars` : '', `Sightings: ${st.data.discovered[id].sightings}`].filter(Boolean).join(' · ') }) : null,
      );
    }
    body.appendChild(el('div', { class: 'entry' }, [hero, info]));

    // Animated live stage: the animal in its habitat.
    const ctx = cv.getContext('2d');
    const layers = B.layers(a.habitat);
    let last = performance.now(), t = 0, x = 0, dir = 1, walking = false, wT = 2;
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.max(10, Math.round(r.width)), H = Math.max(10, Math.round(r.height));
      if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (showPhoto && photoImg && photoImg.complete) {
        ctx.drawImage(photoImg, 0, 0, W, H);
      } else {
        wT -= dt;
        if (wT <= 0) { walking = !walking; wT = walking ? 2 + Math.random() * 2 : 2 + Math.random() * 3; if (walking) dir = x > 30 ? -1 : x < -30 ? 1 : (Math.random() < 0.5 ? -1 : 1); }
        if (walking && found) x += dir * 26 * dt;
        const k = H / B.SCENE_H * 1.25;
        ctx.save();
        B.drawSky(ctx, a.habitat, W, H, t, 0);
        ctx.translate(0, -H * 0.25 * 0.85);
        B.drawLayers(ctx, layers.back, 600 + t * 4, k, W);
        ctx.restore();
        const f = S.frame(a.art, 'idle', 0, 1);
        const z = Math.min((H * 0.6) / f.h, (W * 0.62) / f.w);
        const gy = a.swimmer && WE.habitatById(a.habitat).underwater ? H * 0.5 + f.oy * z * 0.5 : H * 0.86;
        const gx = W / 2 + x;
        if (!a.swimmer && !(a.flyer && false)) S.shadow(ctx, gx, gy, f.w * z * 0.35, 0.35);
        if (found) {
          const mode = walking ? (a.flyer ? 'fly' : 'walk') : (a.swimmer ? 'walk' : 'idle');
          S.draw(ctx, a.art, mode, t, gx, gy, z, dir, { quality: Math.min(3, Math.ceil(z * dpr)) });
        } else {
          const sil = S.silhouetteOf(a.art, 2);
          const kk = z / 2;
          ctx.globalAlpha = 0.85;
          ctx.drawImage(sil.canvas, gx - sil.ox * kk, gy - sil.oy * kk, sil.w * kk, sil.h * kk);
          ctx.globalAlpha = 1;
          ctx.fillStyle = 'rgba(243,239,223,0.95)';
          ctx.font = '800 64px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('?', W / 2, H * 0.45);
        }
        B.drawAtmosphere(ctx, a.habitat, W, H, t, 0);
      }
      if (wrap && cv.isConnected) stageRAF = requestAnimationFrame(loop);
    };
    stageRAF = requestAnimationFrame(loop);
  }

  function stat(k, v) { return el('div', {}, [el('dt', { text: k }), el('dd', { text: v })]); }
  function statusScale(code) {
    const order = ['LC', 'NT', 'VU', 'EN', 'CR'];
    return el('div', { class: 'status-scale', 'aria-label': WE.STATUS[code].label }, order.map(c => el('span', {
      class: c === code ? 'on' : '', style: c === code ? `background:${WE.STATUS[c].color}` : '', text: c,
    })));
  }
  function foodChain(a) {
    const chip = id => {
      const c = WE.creature(id);
      const dex = WE.animalById(id);
      if (dex && WE.State.isFound(id)) return el('button', { class: 'chip', onclick: () => { J.entry = id; render(); } }, [dex.name]);
      return el('span', { class: 'chip', text: dex ? '???' : c.name });
    };
    const eats = (a.eats.length ? a.eats : a.targets).map(chip);
    const by = a.eatenBy.map(chip);
    return el('div', { style: 'display:grid;gap:6px' }, [
      el('div', { class: 'chain' }, [el('span', { class: 'lab', text: 'Eats' }), ...eats]),
      el('div', { class: 'chain' }, [el('span', { class: 'lab', text: 'Predators' }), ...(by.length ? by : [el('span', { class: 'chip', text: a.statusNote ? 'None in the wild' : 'Few or none as an adult' })])]),
    ]);
  }

  function travel(habId) {
    J.close(true);
    WE.Game.travel(habId);
  }

  // ---------------- Map ----------------
  function renderMap() {
    const st = WE.State;
    const frame = el('div', { class: 'map-frame' });
    const cv = el('canvas');
    const pins = el('div', { class: 'map-pins' });
    frame.append(cv, pins);
    const here = WE.Game.mode === 'explore' ? WE.Explore.hab.id : st.data.habitat;
    body.appendChild(el('div', { class: 'map-tab' }, [
      el('p', { style: 'margin:0;line-height:1.5', text: 'Tap a habitat pin to travel there with your WildDex. Discover 2 animals in a habitat to unlock the next one.' }),
      frame,
      el('div', { class: 'map-list' }, WE.HABITATS.map(h => habCard(h, here))),
    ]));
    const draw = () => {
      const w = Math.round(frame.getBoundingClientRect().width) || 800;
      const h = Math.round(w / 2.15);
      const m = WE.WorldMap.render(w, h);
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(m, 0, 0);
      pins.innerHTML = '';
      for (const hb of WE.HABITATS) {
        const [x, y] = WE.WorldMap.project(hb.lon, hb.lat, w, h);
        const unlocked = st.isUnlocked(hb.id);
        pins.appendChild(el('button', {
          class: 'map-pin' + (unlocked ? '' : ' locked') + (hb.id === here ? ' here' : ''),
          style: `left:${(x / w) * 100}%;top:${(y / h) * 100}%`,
          'aria-label': `${hb.name}${unlocked ? '' : ' (locked)'}`,
          onclick: () => unlocked ? (hb.id === here && WE.Game.mode === 'explore' ? J.close() : travel(hb.id)) : WE.UI.toast(`<b>${hb.name} is locked.</b> Discover 2 animals in the ${WE.habitatById(hb.unlockAfter).name} first.`),
        }, [el('div', { class: 'pin', style: `background:${hb.color}` }), el('div', { class: 'tag', text: hb.name })]));
      }
    };
    requestAnimationFrame(draw);
  }

  function habCard(h, here) {
    const st = WE.State;
    const unlocked = st.isUnlocked(h.id);
    const req = st.unlockRequirement(h.id);
    return el('div', { class: 'hab-card' }, [
      el('h4', {}, [el('i', { style: `background:${h.color}` }), h.name]),
      el('p', { text: `${h.region} · ${h.biome}` }),
      el('p', { text: h.blurb }),
      el('p', { html: `<i>${h.facts[0]}</i>` }),
      el('div', { class: 'row' }, [
        el('span', { text: `${st.foundCount(h.id)}/4 animals` }),
        unlocked
          ? el('button', { class: 'btn', style: 'padding:6px 14px;font-size:15px', onclick: () => (h.id === here && WE.Game.mode === 'explore' ? J.close() : travel(h.id)) }, [h.id === here && WE.Game.mode === 'explore' ? 'You are here' : 'Travel'])
          : el('span', { style: 'color:var(--ink-soft)', text: `Locked · ${req.have}/${req.need} in ${req.prev.name}` }),
      ]),
    ]);
  }

  // ---------------- Powers ----------------
  function renderPowers() {
    const st = WE.State;
    body.appendChild(el('p', { style: 'margin:0 0 12px;line-height:1.5', text: 'Every animal you discover unlocks a creature power based on its real abilities. Use them in Hunt and Survival challenges.' }));
    body.appendChild(el('div', { class: 'powers-grid' }, Object.keys(WE.POWERS).map(pid => {
      const p = WE.POWERS[pid];
      const has = st.hasPower(pid);
      const from = WE.animalById(p.from);
      return el('div', { class: 'power-tile' + (has ? '' : ' locked') }, [
        el('img', { src: I.powerDataURL(pid, 104), alt: '' }),
        el('div', {}, [
          el('div', { class: 'pn', text: has ? p.name : 'Locked power' }),
          el('div', { class: 'pd', text: has ? `${p.desc} (from the ${from.name})` : `Discover an animal in the ${WE.habitatById(from.habitat).name} to unlock.` }),
        ]),
      ]);
    })));
  }

  WE.Journal = J;
})(window.WE);
