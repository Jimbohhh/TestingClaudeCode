/*
 * The "Learn" lab: small hands-on lessons about how 3D printing works.
 * Each lesson draws on a <canvas> and reacts to sliders and buttons.
 */
(function () {
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  // ---------- 1. layer height ----------
  function layerLesson(el) {
    const canvas = el.querySelector("canvas"), slider = el.querySelector("input");
    const out = el.querySelector("[data-out]");
    function draw() {
      const lh = parseFloat(slider.value);
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      const partMM = 8, scale = (h - 24) / partMM, cx = w / 2, R = Math.min(w * 0.42, partMM * scale);
      const n = Math.round(partMM / lh);
      // the ideal curve
      ctx.strokeStyle = css("--muted");
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, h - 12, R, Math.PI, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      // the printed layers
      const lpx = R / n;
      for (let i = 0; i < n; i++) {
        const y = i * lpx;
        const ratio = Math.min(1, (y + lpx / 2) / R);
        const half = R * Math.sqrt(1 - ratio * ratio);
        ctx.fillStyle = i % 2 ? css("--accent") : css("--accent-2");
        ctx.fillRect(cx - half, h - 12 - y - lpx, half * 2, Math.max(1, lpx - (lpx > 4 ? 1 : 0)));
      }
      const time = 0.2 / lh;
      out.innerHTML =
        `<b>${lh.toFixed(2)} mm</b> layers &middot; <b>${n}</b> layers for an 8 mm dome &middot; about <b>${time.toFixed(1)}×</b> the time of 0.2 mm. ` +
        (lh <= 0.12 ? "Very smooth, but slow. Save it for faces and figures." : lh <= 0.22 ? "The everyday sweet spot." : "Fast and strong, but you'll see clear steps on curves.");
    }
    slider.addEventListener("input", draw);
    return draw;
  }

  // ---------- 2. infill ----------
  function infillLesson(el) {
    const canvas = el.querySelector("canvas"), density = el.querySelector("input[type=range]");
    const out = el.querySelector("[data-out]");
    let pattern = "grid";
    el.querySelectorAll("[data-pattern]").forEach((b) =>
      b.addEventListener("click", () => {
        pattern = b.dataset.pattern;
        el.querySelectorAll("[data-pattern]").forEach((x) => x.setAttribute("aria-pressed", x === b));
        draw();
      })
    );
    function draw() {
      const pct = parseInt(density.value, 10);
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      const s = Math.min(w, h) - 20, x0 = (w - s) / 2, y0 = (h - s) / 2, wall = 9;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 + wall, y0 + wall, s - 2 * wall, s - 2 * wall);
      ctx.clip();
      ctx.strokeStyle = css("--accent");
      ctx.lineWidth = 2;
      if (pct > 0) {
        const gap = Math.max(5, 260 / pct);
        ctx.beginPath();
        if (pattern === "lines" || pattern === "grid" || pattern === "triangles") {
          const angles = pattern === "lines" ? [45] : pattern === "grid" ? [45, -45] : [0, 60, -60];
          angles.forEach((deg) => {
            const a = (deg * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
            for (let k = -s * 1.5; k < s * 1.5; k += gap * (angles.length / 1.5)) {
              const px = x0 + s / 2 - dy * k, py = y0 + s / 2 + dx * k;
              ctx.moveTo(px - dx * s * 1.5, py - dy * s * 1.5);
              ctx.lineTo(px + dx * s * 1.5, py + dy * s * 1.5);
            }
          });
        } else if (pattern === "honeycomb") {
          const r = gap * 0.75, hx = r * Math.sqrt(3);
          for (let row = -1; row * r * 1.5 < s + r; row++) {
            for (let col = -1; col * hx < s + hx; col++) {
              const cx = x0 + col * hx + (row % 2 ? hx / 2 : 0), cy = y0 + row * r * 1.5;
              for (let i = 0; i <= 6; i++) {
                const a = Math.PI / 6 + (i * Math.PI) / 3;
                const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
              }
            }
          }
        } else {
          // gyroid-like waves
          for (let k = 0; k < s + gap; k += gap) {
            for (let x = 0; x <= s; x += 3) {
              const y = k + Math.sin((x / gap) * Math.PI) * gap * 0.35;
              if (x === 0) ctx.moveTo(x0 + x, y0 + y); else ctx.lineTo(x0 + x, y0 + y);
            }
          }
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = css("--ink");
      ctx.lineWidth = wall;
      ctx.strokeRect(x0 + wall / 2, y0 + wall / 2, s - wall, s - wall);
      const notes = {
        lines: "Fastest, but only strong in one direction.",
        grid: "Quick and good for most parts.",
        triangles: "Stiff in every direction along the layer.",
        honeycomb: "Strong and pretty, but slower.",
        gyroid: "Strong every way and great for flexible prints.",
      };
      const material = Math.round(30 + pct * 0.7);
      out.innerHTML = `<b>${pct}%</b> ${pattern} &middot; uses about <b>${material}%</b> of the plastic a solid part would. ${notes[pattern]}` +
        (pct < 10 ? " Below 10%, tops can sag." : pct > 50 ? " Above 50% you mostly add weight, not much strength. Add walls instead." : "");
    }
    density.addEventListener("input", draw);
    return draw;
  }

  // ---------- 3. overhangs ----------
  function overhangLesson(el) {
    const canvas = el.querySelector("canvas"), slider = el.querySelector("input[type=range]");
    const sup = el.querySelector("input[type=checkbox]"), out = el.querySelector("[data-out]");
    function draw() {
      const deg = parseInt(slider.value, 10);
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      const layers = 22, lh = (h - 30) / layers, lw = 70, shift = Math.tan((deg * Math.PI) / 180) * lh;
      const ok = deg <= 45, warn = deg > 45 && deg <= 60;
      ctx.fillStyle = css("--muted");
      ctx.fillRect(10, h - 14, w - 20, 4);
      const x0 = w * 0.22;
      for (let i = 0; i < layers; i++) {
        const x = x0 + i * shift, y = h - 14 - (i + 1) * lh;
        const over = Math.min(shift, lw);
        let sag = 0;
        if (!ok && !sup.checked) sag = Math.min(lh * 0.9, ((deg - 45) / 35) * lh * (i / layers) * 1.3);
        ctx.fillStyle = sup.checked || ok ? css("--accent-2") : warn ? css("--warn") : css("--bad");
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + lw, y + sag);
        ctx.lineTo(x + lw, y + lh - 1 + sag);
        ctx.lineTo(x, y + lh - 1);
        ctx.fill();
        if (sup.checked && deg > 45) {
          ctx.fillStyle = css("--muted");
          for (let sx = x + lw - over; sx < x + lw; sx += 6) ctx.fillRect(sx, y + lh, 2, h - 14 - (y + lh));
        }
      }
      out.innerHTML =
        `<b>${deg}°</b> from straight up. ` +
        (ok ? "Safe. Each layer sits mostly on the one below." :
         warn ? (sup.checked ? "Supports hold it up. You'll snip them off after." : "Risky. Edges may droop or curl. Try supports, or rotate the part.") :
         sup.checked ? "Supports carry it. Expect some cleanup where they touch." : "Too steep. The plastic is printing on thin air and will sag.");
    }
    slider.addEventListener("input", draw);
    sup.addEventListener("change", draw);
    return draw;
  }

  // ---------- 4. cost calculator ----------
  function costLesson(el) {
    const f = (n) => parseFloat(el.querySelector(`[name=${n}]`).value) || 0;
    const out = el.querySelector("[data-out]");
    function calc() {
      const plastic = (f("grams") / 1000) * f("spool");
      const power = (f("watts") / 1000) * f("hours") * f("kwh");
      const total = plastic + power;
      out.innerHTML =
        `Plastic <b>$${plastic.toFixed(2)}</b> + electricity <b>$${power.toFixed(2)}</b> = <b class="big">$${total.toFixed(2)}</b> to print it yourself.`;
    }
    el.querySelectorAll("input").forEach((i) => i.addEventListener("input", calc));
    return calc;
  }

  // ---------- 5. materials ----------
  const MATERIALS = {
    PLA: { ease: 5, strength: 3, heat: 1, flex: 1, nozzle: "190–220 °C", bed: "50–60 °C", note: "The easiest start. Made from plants. Softens in a hot car." },
    PETG: { ease: 4, strength: 4, heat: 3, flex: 3, nozzle: "230–250 °C", bed: "70–85 °C", note: "Tough and slightly bendy. Great for useful parts and planters." },
    TPU: { ease: 2, strength: 3, heat: 3, flex: 5, nozzle: "220–240 °C", bed: "40–60 °C", note: "Rubbery. Phone cases, tires, and hinges that never break. Print slowly." },
    ABS: { ease: 2, strength: 4, heat: 4, flex: 2, nozzle: "240–260 °C", bed: "95–110 °C", note: "LEGO bricks are ABS. Needs an enclosure and good airflow because of fumes." },
    ASA: { ease: 2, strength: 4, heat: 4, flex: 2, nozzle: "240–260 °C", bed: "90–110 °C", note: "Like ABS, but it holds up to sunlight. The pick for outdoor parts." },
  };
  function materialLesson(el) {
    const panel = el.querySelector("[data-out]");
    const btns = el.querySelectorAll("[data-mat]");
    function pick(name) {
      const m = MATERIALS[name];
      btns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.mat === name));
      const bar = (label, v) => `<div class="mbar"><span>${label}</span><div class="mtrack"><i style="width:${v * 20}%"></i></div></div>`;
      panel.innerHTML = `<h4>${name}</h4>${bar("Easy to print", m.ease)}${bar("Strength", m.strength)}${bar("Heat resistance", m.heat)}${bar("Flexibility", m.flex)}
        <p class="small"><b>Nozzle</b> ${m.nozzle} &middot; <b>Bed</b> ${m.bed}</p><p>${m.note}</p>`;
    }
    btns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.mat)));
    return () => pick(el.querySelector('[aria-pressed="true"]')?.dataset.mat || "PLA");
  }

  // ---------- 6. quiz ----------
  const QUIZ = [
    { q: "Which layer height gives the smoothest curves?", a: ["0.32 mm", "0.12 mm", "It doesn't matter"], c: 1, why: "Thinner layers make smaller steps, so curves look smoother. They take longer to print." },
    { q: "A part has a 70° overhang. What should you do?", a: ["Print it as is", "Add supports or rotate the part", "Use more infill"], c: 1, why: "Past about 45°, layers hang in the air. Supports or a new orientation fix that." },
    { q: "You want a plant pot that lives outside in the sun. Best material?", a: ["PLA", "ASA", "TPU"], c: 1, why: "ASA resists UV and heat. PLA softens and gets brittle in the sun." },
    { q: "Your gears are stuck together. The likely fix?", a: ["Bigger clearance between parts", "Hotter nozzle", "100% infill"], c: 0, why: "Moving parts need a small gap (often 0.2–0.4 mm) so they don't fuse together." },
    { q: "Where is a printed part weakest?", a: ["Along each layer line", "Between layers", "In the infill"], c: 1, why: "Layers bond to each other less strongly than plastic within a layer. Orient parts so the load runs along the layers." },
  ];
  function quizLesson(el) {
    const box = el.querySelector("[data-quiz]");
    let score = 0, answered = 0;
    box.innerHTML = QUIZ.map((item, i) => `
      <fieldset class="q">
        <legend>${i + 1}. ${item.q}</legend>
        ${item.a.map((opt, j) => `<button type="button" class="opt" data-q="${i}" data-a="${j}">${opt}</button>`).join("")}
        <p class="why" hidden></p>
      </fieldset>`).join("") + `<p class="score" aria-live="polite"></p>`;
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".opt");
      if (!b) return;
      const fs = b.closest("fieldset");
      if (fs.dataset.done) return;
      fs.dataset.done = "1";
      const item = QUIZ[b.dataset.q], right = +b.dataset.a === item.c;
      if (right) score++;
      answered++;
      fs.querySelectorAll(".opt").forEach((o) => {
        o.disabled = true;
        if (+o.dataset.a === item.c) o.classList.add("right");
      });
      if (!right) b.classList.add("wrong");
      const why = fs.querySelector(".why");
      why.hidden = false;
      why.textContent = (right ? "Yes! " : "Not quite. ") + item.why;
      if (answered === QUIZ.length) {
        box.querySelector(".score").innerHTML = `You got <b>${score} of ${QUIZ.length}</b>. ${score === QUIZ.length ? "You're ready to print." : "Try the lessons above, then give it another go."} <button type="button" class="btn small ghost" data-retry>Try again</button>`;
      }
    });
    box.addEventListener("click", (e) => { if (e.target.matches("[data-retry]")) quizLesson(el); });
    return () => {};
  }

  function mount(root) {
    const redraws = [];
    const map = { layer: layerLesson, infill: infillLesson, overhang: overhangLesson, cost: costLesson, material: materialLesson, quiz: quizLesson };
    root.querySelectorAll("[data-lesson]").forEach((el) => {
      const fn = map[el.dataset.lesson];
      if (fn) redraws.push(fn(el));
    });
    const all = () => redraws.forEach((r) => r());
    all();
    window.addEventListener("resize", all);
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", all);
    return all;
  }

  window.Learn = { mount };
})();
