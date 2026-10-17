/*
 * 3D viewer: draws each build's model, lets people spin it, and has an
 * "explode" view, a wind-up animation, and a print-progress slider that
 * slices the model to show how it grows layer by layer.
 *
 * Builds with { stl: "models/file.stl" } load a real STL. Builds with
 * { type: "owl" | "planetary" | "cable" | "planter" | "stand" } use the
 * simple stand-in models below.
 */
(function () {
  const PAL = {
    marigold: 0xffb627, cinnamon: 0xc1793f, grass: 0x4f9d45, sky: 0x3fa7d6,
    cherry: 0xe63946, bone: 0xece4d6, ink: 0x2b2420, white: 0xfafafa,
    teal: 0x2a9d8f, plum: 0x7b5ea7, slate: 0x5c6b7a, clay: 0xd9825b,
  };

  const hasGL = (() => {
    try {
      const c = document.createElement("canvas");
      return !!(window.THREE && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  })();

  // ---------- geometry helpers ----------
  function gearPath(path, teeth, rTip, rRoot, inward) {
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const pts = inward
        ? [[rTip, 0.05], [rRoot, 0.3], [rRoot, 0.7], [rTip, 0.95]]
        : [[rRoot, 0.05], [rTip, 0.3], [rTip, 0.7], [rRoot, 0.95]];
      pts.forEach(([r, f], k) => {
        const x = Math.cos(a + f * step) * r, y = Math.sin(a + f * step) * r;
        if (i === 0 && k === 0) path.moveTo(x, y); else path.lineTo(x, y);
      });
    }
    path.closePath();
    return path;
  }

  function gearGeo(teeth, r, thick, hole) {
    const s = gearPath(new THREE.Shape(), teeth, r, r - 0.32, false);
    if (hole) { const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h); }
    return new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 12 });
  }

  // ---------- model builders ----------
  // Each returns a THREE.Group of "parts". A part may set userData.explode
  // (a Vector3 offset for the exploded view) and userData.spin (a function of time).
  const MODELS = {
    owl(mat) {
      const g = new THREE.Group();
      const part = (mesh, ex) => { mesh.userData.explode = ex || new THREE.Vector3(); g.add(mesh); return mesh; };
      const base = part(new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 6), mat("bone")));
      base.position.y = 0.3;
      const board = part(new THREE.Mesh(new THREE.BoxGeometry(8, 9, 0.5), mat("bone")), new THREE.Vector3(0, 0, -2));
      board.position.set(0, 5.1, -1.6);

      const big = part(new THREE.Mesh(gearGeo(28, 2.5, 0.5, 0.2), mat("cinnamon")), new THREE.Vector3(-1.5, 0, 2));
      big.position.set(-0.8, 3.2, -1.3);
      const little = part(new THREE.Mesh(gearGeo(14, 1.3, 0.5, 0.2), mat("marigold")), new THREE.Vector3(1.5, 0, 2.5));
      little.position.set(2.75, 3.2, -1.3);
      big.userData.spin = (t) => { big.rotation.z = -t * 0.5; };
      little.userData.spin = (t) => { little.rotation.z = t + 0.11; };

      const crank = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2, 0.35), mat("cherry"));
      arm.position.set(0, 1, 0);
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16), mat("cherry"));
      knob.rotation.x = Math.PI / 2; knob.position.set(0, 2, 0.6);
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 12), mat("cherry"));
      axle.rotation.x = Math.PI / 2; axle.position.z = -0.4;
      crank.add(arm, knob, axle);
      crank.position.set(2.75, 3.2, -0.3);
      part(crank, new THREE.Vector3(2.5, 0, 4));
      crank.userData.spin = (t) => { crank.rotation.z = t + 0.11; };

      const body = new THREE.Group();
      const torso = new THREE.Mesh(new THREE.SphereGeometry(1.9, 28, 20), mat("cinnamon"));
      torso.scale.set(1, 1.1, 0.8);
      const belly = new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 16), mat("bone"));
      belly.scale.set(1, 1.1, 0.5); belly.position.set(0, -0.4, 1.05);
      body.add(torso, belly);
      [-1, 1].forEach((s) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 14), mat("white"));
        eye.position.set(s * 0.72, 0.55, 1.25); eye.scale.z = 0.5;
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat("ink"));
        pupil.position.set(s * 0.68, 0.55, 1.5);
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1, 4), mat("cinnamon"));
        tuft.position.set(s * 1.1, 2.1, 0); tuft.rotation.z = -s * 0.4;
        body.add(eye, pupil, tuft);
      });
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), mat("marigold"));
      beak.rotation.x = Math.PI; beak.position.set(0, 0, 1.55);
      body.add(beak);
      body.position.set(0, 7.6, -0.9);
      part(body, new THREE.Vector3(0, 2.5, 1));

      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.bezierCurveTo(1.5, 1.4, 3.8, 1.4, 5, 0.4);
      wingShape.bezierCurveTo(3.6, -0.2, 3.4, -0.9, 3.9, -1.6);
      wingShape.bezierCurveTo(2.4, -1.4, 1, -1, 0, -0.6);
      const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.3, bevelEnabled: false, curveSegments: 16 });
      [-1, 1].forEach((s) => {
        const pivot = new THREE.Group();
        const w = new THREE.Mesh(wingGeo, mat("grass"));
        w.scale.x = s;
        pivot.add(w);
        pivot.position.set(s * 1.5, 7.4, -0.8);
        part(pivot, new THREE.Vector3(s * 2.5, 0.5, 0.5));
        pivot.userData.spin = (t) => { pivot.rotation.z = s * (Math.sin(t) * 0.45 - 0.05); };
      });
      return g;
    },

    planetary(mat) {
      const g = new THREE.Group();
      const ring = gearPath(new THREE.Path(), 30, 3.95, 4.3, true);
      const ringShape = new THREE.Shape();
      ringShape.absarc(0, 0, 5.2, 0, Math.PI * 2, false);
      ringShape.holes.push(ring);
      const ringMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape, { depth: 1.6, bevelEnabled: false, curveSegments: 40 }), mat("plum"));
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.userData.explode = new THREE.Vector3(0, -1.5, 0);
      g.add(ringMesh);

      const sun = new THREE.Group();
      const sunGear = new THREE.Mesh(gearGeo(12, 1.55, 1.6, 0), mat("marigold"));
      sunGear.rotation.x = -Math.PI / 2;
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 6), mat("marigold"));
      knob.position.y = 2.2;
      sun.add(sunGear, knob);
      sun.userData.explode = new THREE.Vector3(0, 4, 0);
      sun.userData.spin = (t) => { sun.rotation.y = t * 1.3; };
      g.add(sun);

      for (let i = 0; i < 3; i++) {
        const holder = new THREE.Group();
        const planet = new THREE.Mesh(gearGeo(9, 1.25, 1.6, 0.3), mat("teal"));
        planet.rotation.x = -Math.PI / 2;
        holder.add(planet);
        const a0 = (i * Math.PI * 2) / 3;
        const place = (t) => {
          const a = a0 + t * 0.3;
          holder.position.set(Math.cos(a) * 2.7, 0, -Math.sin(a) * 2.7);
          holder.rotation.y = -t * 1.0;
        };
        place(0);
        holder.userData.explode = new THREE.Vector3(Math.cos(a0) * 2, 2, -Math.sin(a0) * 2);
        holder.userData.spin = place;
        g.add(holder);
      }
      return g;
    },

    cable(mat) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(11, 1.4, 3.6), mat("slate"));
      base.position.y = 0.7;
      g.add(base);
      for (let i = 0; i < 6; i++) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2, 3.6), mat("sky"));
        f.position.set(-5.05 + i * 2.02, 2.4, 0);
        f.userData.explode = new THREE.Vector3(0, 1.5, 0);
        g.add(f);
      }
      for (let i = 0; i < 5; i++) {
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 20), mat("marigold"));
        coin.position.set(-4 + i * 2, 0.7, 0);
        coin.userData.explode = new THREE.Vector3(0, 0, 3);
        g.add(coin);
      }
      [[-1, 0.9], [-0.6, 0.6], [0, 1.1], [0.5, 0.7], [1, 1.0]].forEach(([dx, h], i) => {
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3 + h, 12), mat(i % 2 ? "ink" : "white"));
        cable.rotation.x = Math.PI / 2;
        cable.position.set(-4.04 + i * 2.02, 1.8, -0.5 + dx * 0.2);
        cable.userData.explode = new THREE.Vector3(0, 3, 0);
        g.add(cable);
      });
      return g;
    },

    planter(mat) {
      const g = new THREE.Group();
      const lathe = (pts, color, segs) =>
        new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs || 48), mat(color, { side: THREE.DoubleSide }));
      const tank = lathe([[0, 0], [3.4, 0], [3.8, 3.4], [3.6, 3.4], [3.2, 0.3], [0, 0.3]], "clay");
      g.add(tank);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.05, 1.6, 40), mat("sky", { transparent: true, opacity: 0.55 }));
      water.position.y = 1.1;
      g.add(water);
      const cup = lathe([[0, 2.2], [2.2, 2.2], [3.9, 7.5], [3.7, 7.5], [2, 2.5], [0, 2.5]], "teal");
      cup.userData.explode = new THREE.Vector3(0, 4, 0);
      g.add(cup);
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 2.2, 4.2, 40), mat("cinnamon"));
      soil.position.y = 4.7;
      soil.userData.explode = new THREE.Vector3(0, 4, 0);
      g.add(soil);
      const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.4, 8), mat("white"));
      wick.position.y = 2.2;
      wick.userData.explode = new THREE.Vector3(0, 2, 0);
      g.add(wick);
      const plant = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 10), mat("grass"));
        const a = (i / 5) * Math.PI * 2;
        leaf.scale.set(1, 0.35, 0.5);
        leaf.position.set(Math.cos(a) * 0.9, 7.6 + (i % 2) * 0.4, Math.sin(a) * 0.9);
        leaf.rotation.y = -a;
        plant.add(leaf);
      }
      plant.userData.explode = new THREE.Vector3(0, 4, 0);
      plant.userData.spin = (t) => { plant.rotation.y = Math.sin(t * 0.6) * 0.2; };
      g.add(plant);
      return g;
    },

    stand(mat) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 8), mat("cherry"));
      base.position.set(0, 0.25, 0);
      g.add(base);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 0.5), mat("cherry"));
      lip.position.set(0, 0.8, 3.2);
      g.add(lip);
      for (let n = 0; n < 3; n++) {
        const notch = new THREE.Mesh(new THREE.BoxGeometry(7, 0.25, 0.3), mat("ink"));
        notch.position.set(0, 0.55, -2.6 + n * 0.9);
        g.add(notch);
      }
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7, 16), mat("marigold"));
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(0, 0.55, 2.7);
      g.add(hinge);
      const back = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.BoxGeometry(7, 7.5, 0.5), mat("cherry"));
      plate.position.y = 3.75;
      back.add(plate);
      back.position.set(0, 0.55, 2.7);
      back.rotation.x = -0.42;
      back.userData.spin = (t) => { back.rotation.x = -0.42 - (Math.sin(t * 0.7) * 0.5 + 0.5) * 0.25; };
      back.userData.explode = new THREE.Vector3(0, 1.5, 1.5);
      g.add(back);
      const phone = new THREE.Mesh(new THREE.BoxGeometry(4.2, 8, 0.45), mat("ink"));
      phone.position.set(0, 4.2, 2.3);
      phone.rotation.x = -0.42;
      phone.userData.explode = new THREE.Vector3(0, 2, 3);
      g.add(phone);
      return g;
    },
  };

  // ---------- scene ----------
  function makeScene() {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7f72, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75);
    sun.position.set(10, 20, 14);
    scene.add(sun);
    const back = new THREE.DirectionalLight(0xffffff, 0.25);
    back.position.set(-12, 8, -10);
    scene.add(back);
    return scene;
  }

  function makeMat(clip) {
    const cache = {};
    return (name, extra) => {
      const key = name + JSON.stringify(extra || {});
      if (!cache[key]) {
        cache[key] = new THREE.MeshStandardMaterial(Object.assign({
          color: new THREE.Color(PAL[name] != null ? PAL[name] : name).convertSRGBToLinear(),
          roughness: 0.55, metalness: 0.02, clippingPlanes: clip ? [clip] : [],
        }, extra || {}));
      }
      return cache[key];
    };
  }

  const stlCache = {};
  function loadSTL(url) {
    if (!stlCache[url]) {
      stlCache[url] = new Promise((resolve, reject) => {
        if (!THREE.STLLoader) return reject(new Error("STL loader missing"));
        new THREE.STLLoader().load(url, (geo) => {
          geo.computeVertexNormals();
          geo.computeBoundingBox();
          const b = geo.boundingBox, size = new THREE.Vector3();
          b.getSize(size);
          // STLs are usually Z-up; stand them on the bed (Y-up).
          geo.rotateX(-Math.PI / 2);
          geo.computeBoundingBox();
          const c = new THREE.Vector3();
          geo.boundingBox.getCenter(c);
          geo.translate(-c.x, -geo.boundingBox.min.y, -c.z);
          const s = 11 / Math.max(size.x, size.y, size.z);
          geo.scale(s, s, s);
          resolve(geo);
        }, undefined, reject);
      });
    }
    return stlCache[url];
  }

  async function buildModel(build, mat) {
    const m = build.model || {};
    if (m.stl) {
      try {
        const geo = await loadSTL(m.stl);
        const g = new THREE.Group();
        g.add(new THREE.Mesh(geo, mat(m.color || "sky")));
        return g;
      } catch (e) {
        console.warn("Could not load", m.stl, e);
      }
    }
    const fn = MODELS[m.type] || MODELS.cable;
    return fn(mat);
  }

  function frameCamera(camera, box, theta, phi, zoom) {
    const size = new THREE.Vector3(), center = new THREE.Vector3();
    box.getSize(size); box.getCenter(center);
    const r = Math.max(size.x, size.y, size.z) * 1.9 * zoom * Math.max(1, 1.2 / camera.aspect);
    camera.position.set(
      center.x + r * Math.sin(phi) * Math.sin(theta),
      center.y + r * Math.cos(phi),
      center.z + r * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(center);
  }

  // ---------- interactive viewer ----------
  function createViewer(host) {
    if (!hasGL) {
      host.innerHTML = '<p class="viewer-fallback">The 3D view needs WebGL, which this browser has turned off. Everything else on the page still works.</p>';
      return { show() {}, setSlice() {}, setAnimate() {}, setExplode() {}, reset() {}, dispose() {} };
    }
    const canvas = document.createElement("canvas");
    canvas.className = "viewer-canvas";
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "3D model. Drag to spin, scroll or pinch to zoom.");
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.localClippingEnabled = true;
    const scene = makeScene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
    const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
    const mat = makeMat(clip);

    // the print bed + a glowing "nozzle layer" that tracks the slice
    const bed = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 14), new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.8 }));
    bed.position.y = -0.16;
    scene.add(bed);
    const grid = new THREE.GridHelper(18, 18, 0x6c7178, 0x50555c);
    grid.position.y = 0.0;
    scene.add(grid);
    const layer = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshBasicMaterial({ color: 0xffb627, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
    layer.rotation.x = -Math.PI / 2;
    layer.visible = false;
    scene.add(layer);

    let group = null, box = null, token = 0;
    let theta = 0.75, phi = 1.05, zoom = 1, animate = true, explode = 0, explodeTarget = 0, slice = 1, userMoved = false;
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) animate = false;

    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host); else window.addEventListener("resize", resize);

    let drag = null, pinch = null;
    const pointers = new Map();
    canvas.addEventListener("pointerdown", (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      userMoved = true;
      if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY };
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; drag = null; }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        zoom = clampZoom(pinch.z * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)));
      } else if (drag) {
        theta -= (e.clientX - drag.x) * 0.008;
        phi = Math.min(1.5, Math.max(0.15, phi - (e.clientY - drag.y) * 0.006));
        drag = { x: e.clientX, y: e.clientY };
      }
    });
    const up = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) drag = null; };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); zoom = clampZoom(zoom * (e.deltaY > 0 ? 1.08 : 0.93)); }, { passive: false });
    canvas.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: () => (theta += 0.15), ArrowRight: () => (theta -= 0.15), ArrowUp: () => (phi = Math.max(0.15, phi - 0.1)), ArrowDown: () => (phi = Math.min(1.5, phi + 0.1)), "+": () => (zoom = clampZoom(zoom * 0.9)), "-": () => (zoom = clampZoom(zoom * 1.1)) }[e.key];
      if (k) { e.preventDefault(); userMoved = true; k(); }
    });
    function clampZoom(z) { return Math.min(2.2, Math.max(0.45, z)); }

    function applySlice() {
      if (!box) return;
      const h = box.min.y + (box.max.y - box.min.y) * slice;
      clip.constant = slice >= 0.999 ? 1000 : h;
      layer.visible = slice < 0.999;
      layer.position.y = h;
    }

    let raf = 0, t = 0, last = performance.now();
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (animate) t += dt * 2.2;
      if (!userMoved && !reduce) theta += dt * 0.15;
      explode += (explodeTarget - explode) * Math.min(1, dt * 6);
      if (group) {
        group.children.forEach((p) => {
          if (p.userData.spin) p.userData.spin(t);
          const base = p.userData.base;
          if (base) p.position.copy(base).addScaledVector(p.userData.explode || new THREE.Vector3(), explode);
        });
        frameCamera(camera, box, theta, phi, zoom);
      }
      renderer.render(scene, camera);
    }

    return {
      async show(build) {
        const my = ++token;
        const g = await buildModel(build, mat);
        if (my !== token) return;
        if (group) scene.remove(group);
        group = g;
        group.children.forEach((p) => { p.userData.base = p.position.clone(); });
        scene.add(group);
        group.children.forEach((p) => p.userData.spin && p.userData.spin(0));
        // measured once, so the camera doesn't jump as parts move
        box = new THREE.Box3().setFromObject(group);
        applySlice();
        resize();
        if (!raf) raf = requestAnimationFrame(frame);
      },
      setSlice(f) { slice = f; applySlice(); },
      setAnimate(on) { animate = on; },
      setExplode(on) { explodeTarget = on ? 1 : 0; },
      reset() { theta = 0.75; phi = 1.05; zoom = 1; userMoved = false; },
      dispose() { cancelAnimationFrame(raf); raf = 0; if (ro) ro.disconnect(); renderer.dispose(); },
    };
  }

  // ---------- thumbnails (one shared offscreen renderer) ----------
  let thumbR = null, thumbScene = null, thumbCam = null, thumbMat = null;
  async function thumbnail(build, w, h) {
    if (!hasGL) return "";
    if (!thumbR) {
      thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      thumbR.outputEncoding = THREE.sRGBEncoding;
      thumbScene = makeScene();
      thumbCam = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
      thumbMat = makeMat(null);
    }
    thumbR.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    thumbR.setSize(w, h, false);
    thumbCam.aspect = w / h;
    thumbCam.updateProjectionMatrix();
    const g = await buildModel(build, thumbMat);
    g.children.forEach((p) => p.userData.spin && p.userData.spin(0.8));
    thumbScene.add(g);
    frameCamera(thumbCam, new THREE.Box3().setFromObject(g), 0.7, 1.08, 0.82);
    thumbR.render(thumbScene, thumbCam);
    const url = thumbR.domElement.toDataURL("image/png");
    thumbScene.remove(g);
    return url;
  }

  window.Viewer = { createViewer, thumbnail, hasGL };
})();
