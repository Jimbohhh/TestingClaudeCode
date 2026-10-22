// DOM overlays: title screen, explore HUD, toasts, modals, minigame HUD.
(function (WE) {
  const U = WE.U, el = U.el, I = WE.Icons, S = WE.Sprites;
  const UI = { stalkToggle: false };
  let root;
  const imgCache = {};

  UI.portraitURL = function (spec, sil) {
    const key = spec.id + (sil ? '|sil' : '');
    if (!imgCache[key]) imgCache[key] = (sil ? S.silhouetteOf(spec, 2) : S.portrait(spec, 2)).canvas.toDataURL();
    return imgCache[key];
  };
  const icon = (name, size, col) => el('img', { src: I.uiURL(name, size || 64, col), alt: '' });
  const powerImg = (pid, size) => el('img', { src: I.powerDataURL(pid, size || 96), alt: '' });

  UI.init = function (r) {
    root = r;
    UI.toastBox = el('div', { class: 'toasts', 'aria-live': 'polite' });
    root.appendChild(UI.toastBox);
  };

  function clear(sel) { root.querySelectorAll(sel).forEach(n => n.remove()); }

  // ---------------- Title ----------------
  UI.title = function () {
    clear('.title-screen');
    const st = WE.State;
    const found = st.foundCount();
    const card = el('div', { class: 'title-card' }, [
      el('div', { class: 'logo' }, [
        el('div', { class: 'eyebrow', text: 'Field Expedition Log' }),
        el('h1', { html: 'Wild<span>Dex</span>' }),
      ]),
      el('p', { text: 'You are a wildlife explorer. Travel to six real habitats around the world, photograph animals to fill your WildDex, and unlock their creature powers for hunt and survival challenges.' }),
      el('div', { class: 'title-actions' }, [
        el('button', { class: 'btn', id: 'btn-start', onclick: () => { WE.Audio.init(); WE.Audio.play('open'); WE.Game.begin(); } }, [found ? 'Continue expedition' : 'Start exploring']),
        found ? el('button', { class: 'btn ghost', id: 'btn-dex-title', onclick: () => { WE.Audio.init(); WE.Journal.open('animals'); } }, ['Open WildDex']) : null,
      ]),
      el('div', { class: 'title-foot', text: found ? `${st.rank()} · ${found} of 24 animals discovered` : 'Move: arrow keys / WASD or the on-screen stick · Sneak: Shift · Observe: E' }),
    ]);
    root.appendChild(el('section', { class: 'title-screen' }, [card]));
  };
  UI.hideTitle = () => clear('.title-screen');

  // ---------------- Explore HUD ----------------
  UI.showHUD = function (hab) {
    UI.hideHUD();
    const found = WE.ANIMALS.filter(a => a.habitat === hab.id);
    const meter = el('div', { class: 'meter', 'aria-label': 'Animals discovered here' }, found.map(a => el('i', { class: WE.State.isFound(a.id) ? 'on' : '' })));
    const btn = (name, label, fn, id) => el('button', { class: 'icon-btn', 'aria-label': label, id, onclick: () => { WE.Audio.play('click'); fn(); } }, [icon(name, 64), el('span', { class: 'lbl', text: label })]);
    const snd = btn(WE.State.data.sound ? 'sound' : 'mute', 'Sound', () => {
      WE.State.data.sound = !WE.State.data.sound; WE.State.save(); WE.Audio.setEnabled(WE.State.data.sound);
      snd.querySelector('img').src = I.uiURL(WE.State.data.sound ? 'sound' : 'mute', 64);
    }, 'btn-sound');
    const hud = el('div', { class: 'hud-top hud' }, [
      el('div', { class: 'place-chip' }, [
        el('div', { class: 'eyebrow', text: hab.region }),
        el('div', { class: 'name', text: hab.name }),
        meter,
      ]),
      el('div', { class: 'hud-btns' }, [
        btn('journal', 'WildDex', () => WE.Journal.open('animals'), 'btn-dex'),
        btn('globe', 'Map', () => WE.Journal.open('map'), 'btn-map'),
        btn('paw', 'Challenges', () => UI.challenges(), 'btn-challenges'),
        snd,
      ]),
    ]);
    const prompt = el('div', { class: 'prompt hud', hidden: '' }, [
      el('span', { class: 'txt' }),
      el('button', { class: 'btn', id: 'btn-observe', onclick: () => WE.Input.tap('observe') }, [icon('camera', 48, '#2a1406'), 'Observe']),
    ]);
    const hint = el('div', { class: 'hint-bar hud', html: WE.Input.isTouch ? '' : '<kbd>←</kbd><kbd>→</kbd> move · <kbd>Shift</kbd> sneak · <kbd>Space</kbd> run · <kbd>E</kbd> observe · <kbd>J</kbd> WildDex · <kbd>M</kbd> map' });
    root.appendChild(hud); root.appendChild(prompt); root.appendChild(hint);
    UI.promptEl = prompt;
    if (WE.Input.isTouch) UI.touchControls('explore');
  };
  UI.hideHUD = function () { clear('.hud'); UI.promptEl = null; clear('.touch'); };
  UI.refreshHUD = function () { if (WE.Game.mode === 'explore') UI.showHUD(WE.Explore.hab); };

  UI.setPrompt = function (ent) {
    const p = UI.promptEl;
    if (!p) return;
    if (!ent) { if (!p.hidden) p.hidden = true; return; }
    const known = WE.State.isFound(ent.a.id);
    const txt = known ? `${ent.a.name} nearby` : 'Unknown animal nearby!';
    if (p.hidden) p.hidden = false;
    const t = p.querySelector('.txt');
    if (t.textContent !== txt) t.textContent = txt;
  };

  UI.touchControls = function (mode) {
    clear('.touch');
    const In = WE.Input;
    const joy = In.makeJoystick();
    joy.classList.add('touch');
    root.appendChild(joy);
    if (mode === 'explore') {
      const sneak = el('button', { class: 'mbtn', 'aria-label': 'Sneak' }, [icon('stalk', 48), 'SNEAK']);
      const run = el('button', { class: 'mbtn', 'aria-label': 'Run' }, [icon('sprint', 48), 'RUN']);
      In.holdButton(sneak, 'stalk'); In.holdButton(run, 'sprint');
      root.appendChild(el('div', { class: 'move-btns touch power-bar', style: 'bottom: calc(90px + env(safe-area-inset-bottom, 0px))' }, [sneak, run]));
    }
  };

  // ---------------- Toasts ----------------
  UI.toast = function (html, ms) {
    const t = el('div', { class: 'toast', html });
    UI.toastBox.appendChild(t);
    while (UI.toastBox.children.length > 3) UI.toastBox.firstChild.remove();
    setTimeout(() => t.remove(), ms || 4200);
  };

  // ---------------- Modal ----------------
  UI.modal = function (children, opts) {
    opts = opts || {};
    const wrap = el('div', { class: 'modal-wrap', role: 'dialog', 'aria-modal': 'true' });
    const box = el('div', { class: 'modal' }, children);
    wrap.appendChild(box);
    root.appendChild(wrap);
    WE.Game.pushOverlay();
    const close = () => { if (!wrap.isConnected) return; wrap.remove(); WE.Game.popOverlay(); if (opts.onClose) opts.onClose(); };
    if (opts.dismissable !== false) wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    const keyClose = e => { if (e.key === 'Escape' && opts.dismissable !== false) { close(); window.removeEventListener('keydown', keyClose); } };
    window.addEventListener('keydown', keyClose);
    const first = box.querySelector('button');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
    return close;
  };

  // ---------------- Discovery ----------------
  UI.discovery = function (a, photo, res) {
    const p = WE.POWERS[a.power];
    const kids = [];
    if (res.isNew) {
      kids.push(el('div', { class: 'eyebrow', text: `New discovery · WildDex #${String(a.num).padStart(3, '0')}` }));
      kids.push(el('h2', { text: a.name }));
      kids.push(el('div', { class: 'sci', text: a.sci }));
    } else {
      kids.push(el('div', { class: 'eyebrow', text: 'Another sighting' }));
      kids.push(el('h2', { text: a.name }));
    }
    kids.push(photo ? el('img', { class: 'discover-photo', src: photo, alt: `Your photo of a ${a.name}` }) : el('div', { class: 'discover-art' }, [el('img', { src: UI.portraitURL(a.art), alt: a.name })]));
    kids.push(el('p', { text: res.isNew ? a.facts[0] : a.facts[Math.floor(Math.random() * a.facts.length)] }));
    if (res.isNew) {
      kids.push(el('div', { class: 'power-card' }, [powerImg(a.power), el('div', {}, [
        el('div', { class: 'pn', text: `Creature power unlocked: ${p.name}` }),
        el('div', { class: 'pd', text: p.desc }),
        el('div', { class: 'pb', text: p.bio }),
      ])]));
    }
    const close = UI.modal([...kids, el('div', { class: 'row' }, [
      el('button', { class: 'btn secondary', onclick: () => close() }, ['Keep exploring']),
      el('button', { class: 'btn', onclick: () => { close(); WE.Journal.open('animals', a.id); } }, ['Open WildDex entry']),
    ])], {
      onClose: () => {
        if (res.unlockedHabitat) {
          WE.Audio.play('unlock');
          UI.toast(`<b>New habitat unlocked: ${res.unlockedHabitat.name}!</b><br>Open the Map to travel there.`, 6000);
        }
        if (WE.State.foundCount() === 24) UI.toast('<b>WildDex complete!</b> You are a Master Naturalist.', 7000);
      },
    });
    WE.Audio.play(res.isNew ? 'discover' : 'right');
  };

  // ---------------- Quiz ----------------
  UI.quiz = function (a, after) {
    const q = a.quiz;
    const fb = el('p', { text: '' });
    const opts = q.a.map((txt, i) => el('button', {
      class: 'quiz-opt', onclick: () => {
        if (opts.answered) return;
        opts.answered = true;
        opts.forEach((b, j) => { if (j === q.correct) b.classList.add('right'); });
        if (i === q.correct) {
          WE.Audio.play('right');
          const first = !WE.State.data.quiz[a.id];
          WE.State.data.quiz[a.id] = true;
          if (first) WE.State.data.xp += 25;
          WE.State.save();
          fb.textContent = first ? 'Correct! You earned an Expert star for this entry.' : 'Correct!';
        } else {
          WE.Audio.play('wrong');
          opts[i].classList.add('wrong');
          fb.textContent = 'Not quite. Read the entry again and try another time.';
        }
        done.hidden = false;
      },
    }, [txt]));
    const done = el('button', { class: 'btn', hidden: '', onclick: () => { close(); if (after) after(); } }, ['Done']);
    const close = UI.modal([
      el('div', { class: 'eyebrow', text: `Field quiz · ${a.name}` }),
      el('h2', { text: q.q }),
      el('div', { class: 'quiz-opts' }, opts),
      fb,
      el('div', { class: 'row' }, [done]),
    ], { onClose: after });
  };

  // ---------------- Challenges ----------------
  UI.challenges = function () {
    const hab = WE.Explore.hab;
    const list = WE.ANIMALS.filter(a => a.habitat === hab.id);
    const rows = list.map(a => {
      const found = WE.State.isFound(a.id);
      const stars = WE.State.data.stars[a.id] || 0;
      return el('button', {
        class: 'quiz-opt', disabled: found ? null : '', style: 'display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;' + (found ? '' : 'opacity:.55'),
        onclick: () => { if (!found) return; close(); UI.arenaSetup(a); },
      }, [
        el('img', { src: UI.portraitURL(a.art, !found), alt: '', style: 'max-width:64px;max-height:52px' }),
        el('div', {}, [
          el('div', { style: 'font-family:var(--font-display);font-size:18px', text: found ? a.name : 'Undiscovered' }),
          el('div', { style: 'font-size:13px;font-weight:600;color:var(--ink-soft)', text: found ? (a.role === 'hunt' ? 'Hunt challenge' : 'Survival challenge') : 'Photograph it first to play' }),
        ]),
        el('div', { style: 'display:flex;gap:2px' }, [0, 1, 2].map(i => el('img', { src: I.uiURL('star', 40, i < stars ? '#f0b429' : '#bdb59a'), alt: '', style: 'width:20px;height:20px' }))),
      ]);
    });
    const close = UI.modal([
      el('div', { class: 'eyebrow', text: `${hab.name} · Creature challenges` }),
      el('h2', { text: 'Play as an animal' }),
      el('p', { text: 'Predators stalk and catch prey. Prey animals find food while staying away from predators. Your creature powers help both ways.' }),
      el('div', { class: 'quiz-opts' }, rows),
      el('div', { class: 'row' }, [el('button', { class: 'btn secondary', onclick: () => close() }, ['Close'])]),
    ]);
  };

  const TIPS = {
    hunt: 'Real predators sneak up before they chase. Hold Shift (Sneak) and hide in cover so prey don\'t spot you, then sprint with Space when you\'re close. Prey get tired after a long run!',
    survive: 'Keep moving and watch for the red "!" — that means a predator has spotted you. Run (Space) to escape, hide in cover, and use your powers.',
  };

  UI.arenaSetup = function (a) {
    const goal = WE.Arena.goalFor(a);
    const own = a.power;
    const others = WE.State.unlockedPowers().filter(p => p !== own);
    let picks = (WE.State.data.loadout || []).filter(p => others.includes(p)).slice(0, 2);
    if (picks.length < 2) for (const p of others) { if (picks.length >= 2) break; if (!picks.includes(p)) picks.push(p); }
    const slots = el('div', { class: 'loadout' });
    const desc = el('div', { class: 'tip' });
    const describe = pid => { const p = WE.POWERS[pid]; desc.innerHTML = `<b>${p.name}</b>: ${p.desc}`; };
    const render = () => {
      slots.innerHTML = '';
      const ownBtn = el('button', { class: 'load-slot', 'aria-pressed': 'true', title: WE.POWERS[own].name, onclick: () => describe(own) }, [powerImg(own, 116), el('span', { class: 'fixed', text: 'OWN' })]);
      slots.appendChild(ownBtn);
      for (const pid of others) {
        const on = picks.includes(pid);
        slots.appendChild(el('button', {
          class: 'load-slot', 'aria-pressed': on ? 'true' : 'false', title: WE.POWERS[pid].name,
          onclick: () => {
            describe(pid);
            if (on) picks = picks.filter(x => x !== pid);
            else { picks.push(pid); if (picks.length > 2) picks.shift(); }
            WE.Audio.play('click');
            render();
          },
        }, [powerImg(pid, 116)]));
      }
    };
    render(); describe(own);
    const close = UI.modal([
      el('div', { class: 'eyebrow', text: a.role === 'hunt' ? 'Hunt challenge' : 'Survival challenge' }),
      el('div', { class: 'setup-grid' }, [
        el('img', { src: UI.portraitURL(a.art), alt: a.name }),
        el('div', {}, [
          el('h2', { text: `Play as ${a.name}` }),
          el('div', { class: 'goal', text: `${goal.verb} ${goal.n} × ${goal.what} in ${WE.Arena.TIME} seconds` }),
          a.threats.length ? el('div', { style: 'font-size:14px;color:var(--ink-soft);font-weight:600', text: `Watch out for: ${a.threats.map(t => WE.creature(t).name).join(', ')}` }) : null,
        ]),
      ]),
      el('div', { class: 'tip', text: TIPS[a.role] }),
      el('div', {}, [
        el('div', { style: 'font-weight:800;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:6px', text: others.length ? 'Creature powers (pick 2 extra)' : 'Creature power' }),
        slots,
      ]),
      desc,
      el('div', { class: 'row' }, [
        el('button', { class: 'btn secondary', onclick: () => close() }, ['Cancel']),
        el('button', { class: 'btn', id: 'btn-play', onclick: () => { WE.State.data.loadout = picks; WE.State.save(); close(); WE.Game.startArena(a, [own, ...picks]); } }, [icon('play', 48, '#2a1406'), 'Start']),
      ]),
    ]);
  };

  // ---------------- Arena HUD ----------------
  UI.showArena = function (AR) {
    UI.hideHUD();
    UI.toastBox.innerHTML = '';
    clear('.arena-ui');
    const goal = AR.goal;
    UI.arenaEls = {};
    const E = UI.arenaEls;
    E.count = el('div', { class: 'count', text: `0 / ${goal.n}` });
    E.timer = el('div', { class: 'timer', text: '80' });
    E.hearts = el('div', { class: 'hearts' });
    E.stam = el('i');
    const top = el('div', { class: 'arena-top arena-ui' }, [
      el('div', { class: 'arena-card' }, [el('div', { class: 'goal-t', text: `${goal.verb}: ${goal.what}` }), E.count]),
      el('div', { class: 'arena-card', style: 'justify-items:end' }, [
        E.timer, E.hearts,
        el('div', { class: 'stamina', title: 'Stamina' }, [E.stam]),
        el('button', { class: 'icon-btn', 'aria-label': 'Pause', style: 'width:38px;height:38px;border-radius:12px', onclick: () => UI.arenaPause() }, [icon('pause', 48)]),
      ]),
    ]);
    root.appendChild(top);
    E.pbtns = AR.powers.map((pw, i) => {
      const cd = el('div', { class: 'cd' });
      const b = el('button', { class: 'pbtn', 'aria-label': pw.def.name, onclick: () => WE.Arena.usePower(i) }, [
        powerImg(pw.id, 132), cd, el('span', { class: 'k', text: String(i + 1) }), el('span', { class: 'nm', text: pw.def.name }),
      ]);
      b._cd = cd;
      return b;
    });
    const bar = el('div', { class: 'power-bar arena-ui' });
    if (WE.Input.isTouch) {
      const sneak = el('button', { class: 'mbtn', 'aria-label': 'Sneak' }, [icon('stalk', 48), 'SNEAK']);
      const run = el('button', { class: 'mbtn', 'aria-label': 'Sprint' }, [icon('sprint', 48), 'SPRINT']);
      WE.Input.holdButton(run, 'sprint');
      sneak.addEventListener('click', () => { UI.stalkToggle = !UI.stalkToggle; sneak.classList.toggle('on', UI.stalkToggle); });
      bar.appendChild(el('div', { class: 'move-btns' }, [sneak, run]));
    }
    E.pbtns.forEach(b => bar.appendChild(b));
    root.appendChild(bar);
    if (WE.Input.isTouch) { const j = WE.Input.makeJoystick(); j.classList.add('arena-ui'); root.appendChild(j); }
    UI.stalkToggle = false;
    UI.toast(`<b>${goal.verb} ${goal.n}!</b> ${WE.Input.isTouch ? 'Use the stick to move. SNEAK to creep, SPRINT to chase.' : 'Move with WASD/arrows · Shift sneak · Space sprint · 1-3 powers'}`, 5000);
  };
  UI.updateArena = function (AR) {
    const E = UI.arenaEls;
    if (!E) return;
    const c = `${AR.score} / ${AR.goal.n}`;
    if (E.count.textContent !== c) E.count.textContent = c;
    const tm = Math.ceil(Math.max(0, AR.time)) + 's';
    if (E.timer.textContent !== tm) { E.timer.textContent = tm; E.timer.style.color = AR.time < 10 ? 'var(--signal)' : ''; }
    if (E.heartsN !== AR.player.hearts) {
      E.heartsN = AR.player.hearts;
      E.hearts.innerHTML = '';
      for (let i = 0; i < 3; i++) E.hearts.appendChild(el('img', { src: I.uiURL('heart', 44, i < AR.player.hearts ? '#ff5a6a' : 'rgba(255,255,255,0.25)'), alt: '' }));
    }
    E.stam.style.width = Math.round(AR.player.stamina * 100) + '%';
    AR.powers.forEach((pw, i) => {
      const b = E.pbtns[i];
      const frac = pw.cd / pw.def.cd;
      b._cd.style.background = frac > 0 ? `conic-gradient(rgba(0,0,0,0.62) ${frac * 360}deg, transparent 0)` : 'none';
      const active = AR.player.eff[pw.def.kind] > 0 || (pw.flash || 0) > 0;
      b.classList.toggle('active', !!active);
    });
  };
  UI.hideArena = function () { clear('.arena-ui'); UI.arenaEls = null; };

  UI.arenaPause = function () {
    const close = UI.modal([
      el('div', { class: 'eyebrow', text: 'Paused' }),
      el('h2', { text: 'Take a breather' }),
      el('div', { class: 'tip', text: TIPS[WE.Arena.a.role] }),
      el('div', { class: 'row' }, [
        el('button', { class: 'btn secondary', onclick: () => { close(); WE.Game.endArena(); } }, ['Quit challenge']),
        el('button', { class: 'btn', onclick: () => close() }, ['Resume']),
      ]),
    ]);
  };

  UI.arenaResults = function (res) {
    const a = res.animal;
    const title = res.win ? (res.stars === 3 ? 'Perfect run!' : 'Challenge complete!') : res.why === 'time' ? 'Out of time' : 'You were caught!';
    const fact = a.facts[Math.floor(Math.random() * a.facts.length)];
    const close = UI.modal([
      el('div', { class: 'eyebrow', text: `${a.name} · ${a.role === 'hunt' ? 'Hunt' : 'Survival'} challenge` }),
      el('div', { class: 'results-big', text: title }),
      el('div', { class: 'stars' }, [0, 1, 2].map(i => el('img', { src: I.uiURL('star', 96, i < res.stars ? '#f0b429' : '#c8c0a4'), alt: i < res.stars ? 'star earned' : 'star not earned' }))),
      el('p', { style: 'text-align:center', text: `${res.goal.verb === 'Catch' ? 'Caught' : 'Collected'} ${res.score} of ${res.goal.n}. ${res.win ? 'Stars: finish fast and keep your hearts.' : a.role === 'hunt' ? 'Tip: sneak closer before you sprint.' : 'Tip: run from predators and hide in cover.'}` }),
      el('div', { class: 'tip', html: `<b>Real-life fact:</b> ${fact}` }),
      el('div', { class: 'row' }, [
        el('button', { class: 'btn secondary', onclick: () => { close(); WE.Game.endArena(); } }, ['Back to exploring']),
        el('button', { class: 'btn', onclick: () => { close(); WE.Game.startArena(a, WE.Arena.powers.map(p => p.id)); } }, ['Play again']),
      ]),
    ], { dismissable: false });
  };

  // ---------------- Observe overlay ----------------
  UI.showObserve = function (name) {
    UI.hideHUD();
    clear('.observe-ui');
    root.appendChild(el('div', { class: 'observe-ui' }, [
      el('div', { class: 'obs-top' }, [el('div', { class: 'obs-label', text: `Field camera · ${name}` })]),
      el('button', { class: 'btn secondary obs-cancel', onclick: () => WE.Game.cancelObserve(WE.Observe.ent, false) }, ['Cancel']),
    ]));
    if (WE.Input.isTouch) UI.toast('Drag your finger to keep the circle on the animal.', 3500);
    else UI.toast('Move the mouse (or arrow keys) to keep the circle on the animal.', 3500);
  };
  UI.hideObserve = () => clear('.observe-ui');

  // Small loading note shown during travel
  UI.warpLabel = function (txt) {
    clear('.warp-label');
    if (!txt) return;
    root.appendChild(el('div', { class: 'warp-label toasts', style: 'top:auto;bottom:calc(40px + env(safe-area-inset-bottom,0px))' }, [el('div', { class: 'toast', html: txt })]));
  };

  WE.UI = UI;
})(window.WE);
