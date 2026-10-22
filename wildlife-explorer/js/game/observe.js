// Field camera minigame: keep the animal in focus long enough to snap a photo.
(function (WE) {
  const U = WE.U, B = WE.BG, S = WE.Sprites, In = WE.Input;
  const O = {};
  const TIME_LIMIT = 25;

  O.enter = function (ent) {
    const E = WE.Explore;
    O.ent = ent;
    O.a = ent.a;
    O.t = 0;
    O.focus = 0;
    O.done = false;
    O.flash = 0;
    O.known = WE.State.isFound(ent.a.id);
    O.need = O.known ? 1.0 : 1.4 + ent.a.wary * 1.6;
    O.pos = { x: 0.5, y: 0.55 };
    O.tgt = { x: 0.5, y: 0.55 };
    O.pause = 0.8;
    O.reticle = { x: WE.Game.W * 0.5, y: WE.Game.H * 0.5 };
    O.dir = ent.dir;
    O.scene = U.canvas(10, 10);
    O.lastFocusBeep = 0;
    O.hab = E.hab;
    O.camX = ent.x;
    WE.UI.showObserve(O.known ? O.a.name : 'Unknown animal');
  };

  O.exit = function () { WE.UI.hideObserve(); };

  // Region of the screen the animal can roam (keeps it inside the viewfinder).
  function frameRect(W, H) {
    const m = Math.min(W, H) * 0.12;
    return { x: m, y: m + 20, w: W - m * 2, h: H - m * 2 - 40 };
  }

  O.update = function (dt) {
    const W = WE.Game.W, H = WE.Game.H;
    O.t += dt;
    if (O.done) {
      O.flash = Math.max(0, O.flash - dt * 2);
      O.doneT -= dt;
      if (O.doneT <= 0) WE.Game.finishObserve(O.a, O.photo, O.ent);
      return;
    }
    if (In.hit('back')) { WE.Game.cancelObserve(O.ent, false); return; }
    // Animal movement: dart to a point, pause, repeat. Warier animals move more.
    const wary = O.a.wary;
    if (O.pause > 0) {
      O.pause -= dt;
      if (O.pause <= 0) {
        O.tgt = { x: 0.15 + Math.random() * 0.7, y: 0.3 + Math.random() * 0.45 };
        O.dir = O.tgt.x > O.pos.x ? 1 : -1;
      }
    } else {
      const spd = (0.08 + wary * 0.22) * (O.known ? 0.7 : 1);
      const dx = O.tgt.x - O.pos.x, dy = O.tgt.y - O.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.01) O.pause = 0.6 + Math.random() * (1.8 - wary);
      else { O.pos.x += dx / d * Math.min(d, spd * dt); O.pos.y += dy / d * Math.min(d, spd * dt); }
    }
    // Reticle follows the pointer, or moves with keys / joystick.
    const ax = In.axis();
    if (ax.mag > 0.05) {
      O.reticle.x = U.clamp(O.reticle.x + ax.x * 520 * dt, 0, W);
      O.reticle.y = U.clamp(O.reticle.y + ax.y * 520 * dt, 0, H);
      O.usingKeys = true;
    } else if (In.pointer.active && !O.usingKeys) {
      O.reticle.x += (In.pointer.x - O.reticle.x) * Math.min(1, dt * 14);
      O.reticle.y += (In.pointer.y - O.reticle.y) * Math.min(1, dt * 14);
    }
    if (In.pointer.justDown) { O.usingKeys = false; In.pointer.justDown = false; }

    const c = O.animalCenter(W, H);
    const inFocus = U.dist(O.reticle.x, O.reticle.y, c.x, c.y) < c.r;
    O.inFocus = inFocus;
    if (inFocus) {
      O.focus += dt / O.need;
      O.lastFocusBeep -= dt;
      if (O.lastFocusBeep <= 0) { WE.Audio.play('focus'); O.lastFocusBeep = 0.25; }
    } else O.focus = Math.max(0, O.focus - dt * 0.35);
    if (O.focus >= 1) snap(W, H);
    else if (O.t > TIME_LIMIT) WE.Game.cancelObserve(O.ent, true);
  };

  O.zoomFor = function (H) {
    const f = S.frame(O.a.art, 'idle', 0, 1);
    // Fill about 38% of the viewfinder height.
    return U.clamp((H * 0.38) / f.h, 0.4, 5);
  };
  O.animalCenter = function (W, H) {
    const fr = frameRect(W, H);
    const z = O.zoomFor(H);
    const f = S.frame(O.a.art, 'idle', 0, 1);
    const grounded = !O.a.flyer && !(O.a.swimmer && O.hab.underwater);
    const gx = fr.x + O.pos.x * fr.w;
    const gy = grounded ? H * 0.86 + (O.pos.y - 0.5) * H * 0.08 : fr.y + O.pos.y * fr.h + f.oy * z * 0.5;
    return { gx, gy, x: gx, y: gy - f.oy * z * 0.5, r: Math.max(52, Math.min(f.w, f.h) * z * 0.45), z, grounded };
  };

  function snap(W, H) {
    O.done = true;
    O.doneT = 0.9;
    O.flash = 1;
    WE.Audio.play('shutter');
    // Crop a photo around the animal from the clean scene layer.
    const c = O.animalCenter(W, H);
    const pw = 360, ph = 240;
    const sw = Math.min(O.scene.width, c.r * 4.2 * WE.Game.dpr), sh = sw * ph / pw;
    const sx = U.clamp(c.x * WE.Game.dpr - sw / 2, 0, O.scene.width - sw);
    const sy = U.clamp(c.y * WE.Game.dpr - sh / 2, 0, O.scene.height - sh);
    const pc = U.canvas(pw, ph);
    pc.getContext('2d').drawImage(O.scene, sx, sy, sw, sh, 0, 0, pw, ph);
    try { O.photo = pc.toDataURL('image/jpeg', 0.72); } catch (e) { O.photo = null; }
  }

  O.render = function (ctx, W, H) {
    const dpr = WE.Game.dpr;
    if (O.scene.width !== Math.round(W * dpr) || O.scene.height !== Math.round(H * dpr)) {
      O.scene.width = Math.round(W * dpr); O.scene.height = Math.round(H * dpr);
    }
    const sc = O.scene.getContext('2d');
    sc.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Zoomed, softly blurred habitat behind the animal (shallow depth of field).
    const zoomBg = 1.7;
    const k = H / B.SCENE_H * zoomBg;
    const layers = B.layers(O.hab.id);
    sc.save();
    B.drawSky(sc, O.hab.id, W, H, O.t, O.camX);
    sc.translate(0, -H * (zoomBg - 1) * 0.81);
    if ('filter' in sc) sc.filter = 'blur(3px)';
    B.drawLayers(sc, layers.back, O.camX - W / k / 2, k, W);
    sc.filter = 'none';
    sc.restore();
    const c = O.animalCenter(W, H);
    const moving = O.pause <= 0;
    let mode = moving ? (O.a.flyer ? 'fly' : 'walk') : 'idle';
    if (O.a.swimmer) mode = 'walk';
    if (c.grounded) S.shadow(sc, c.gx, c.gy, 70 * c.z * 0.6, 0.35);
    S.draw(sc, O.a.art, mode, O.t, c.gx, c.gy, c.z, O.dir, { quality: Math.min(3, Math.ceil(c.z * dpr)) });
    B.drawAtmosphere(sc, O.hab.id, W, H, O.t, O.camX);
    ctx.drawImage(O.scene, 0, 0, W, H);
    drawViewfinder(ctx, W, H, c);
  };

  function drawViewfinder(ctx, W, H, c) {
    // Vignette
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const fr = frameRect(W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
    const L = 34;
    const corners = [[fr.x, fr.y, 1, 1], [fr.x + fr.w, fr.y, -1, 1], [fr.x, fr.y + fr.h, 1, -1], [fr.x + fr.w, fr.y + fr.h, -1, -1]];
    for (const [x, y, sx, sy] of corners) { ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke(); }
    // Rule-of-thirds guides
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(fr.x + fr.w * i / 3, fr.y); ctx.lineTo(fr.x + fr.w * i / 3, fr.y + fr.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fr.x, fr.y + fr.h * i / 3); ctx.lineTo(fr.x + fr.w, fr.y + fr.h * i / 3); ctx.stroke();
    }
    // Camera readouts
    ctx.font = '500 13px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(`ISO 400   1/1000   f/5.6`, fr.x + 8, fr.y + fr.h + 24);
    const left = Math.max(0, TIME_LIMIT - O.t);
    ctx.textAlign = 'right';
    ctx.fillStyle = left < 6 ? '#ff8a3d' : 'rgba(255,255,255,0.85)';
    ctx.fillText(`${left.toFixed(1)} s`, fr.x + fr.w - 8, fr.y + fr.h + 24);
    // Focus bar
    const bw = Math.min(320, fr.w * 0.6), bx = W / 2 - bw / 2, by = fr.y + fr.h + 14;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; U.roundRect(ctx, bx, by, bw, 12, 6); ctx.fill();
    ctx.fillStyle = O.inFocus ? '#7fe0a0' : '#ff8a3d'; U.roundRect(ctx, bx, by, bw * U.clamp(O.focus, 0, 1), 12, 6); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.font = '700 15px "Baloo 2", sans-serif';
    ctx.fillText(O.done ? 'Got it!' : O.inFocus ? 'Hold steady…' : 'Keep the animal inside the circle', W / 2, by - 8);
    // Reticle
    const rx = O.reticle.x, ry = O.reticle.y, rr = c.r;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.strokeStyle = O.inFocus ? '#7fe0a0' : 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, U.TAU); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = O.inFocus ? '#7fe0a0' : '#ff8a3d';
    ctx.beginPath(); ctx.arc(0, 0, rr + 6, -Math.PI / 2, -Math.PI / 2 + U.TAU * U.clamp(O.focus, 0, 1)); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(rr * 0.35, 0); ctx.lineTo(rr * 0.6, 0); ctx.stroke(); }
    ctx.restore();
    if (O.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${O.flash})`; ctx.fillRect(0, 0, W, H); }
  }

  WE.Observe = O;
})(window.WE);
