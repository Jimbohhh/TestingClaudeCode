/*
 * Page logic: routing between views, the build catalog, build detail pages,
 * free printable plans, and Stripe Payment Link checkout buttons.
 */
(function () {
  const SITE = window.SITE, BUILDS = window.BUILDS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => new Intl.NumberFormat(undefined, { style: "currency", currency: SITE.currency || "USD", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };

  // ---------- site-wide text ----------
  $$("[data-site-name]").forEach((el) => (el.textContent = SITE.name));
  $$("[data-site-tagline]").forEach((el) => (el.textContent = SITE.tagline));
  $$("[data-contact]").forEach((a) => { a.href = "mailto:" + SITE.contactEmail; a.textContent = SITE.contactEmail; });
  $("#year").textContent = new Date().getFullYear();
  document.title = SITE.name;

  // ---------- cards ----------
  const thumbs = new Map();
  const thumbQueue = [];
  let thumbBusy = false;
  function queueThumb(build, img) {
    if (thumbs.has(build.id)) { img.src = thumbs.get(build.id); return; }
    thumbQueue.push([build, img]);
    if (!thumbBusy) drainThumbs();
  }
  async function drainThumbs() {
    thumbBusy = true;
    while (thumbQueue.length) {
      const [build, img] = thumbQueue.shift();
      if (!thumbs.has(build.id)) thumbs.set(build.id, await window.Viewer.thumbnail(build, 480, 360));
      img.src = thumbs.get(build.id);
    }
    thumbBusy = false;
  }

  function card(b) {
    const el = document.createElement("a");
    el.className = "card";
    el.href = "#/build/" + b.id;
    el.innerHTML = `
      <div class="thumb">${window.Viewer.hasGL ? `<img alt="" width="480" height="360">` : ""}
        ${b.example ? `<span class="tag example">Example</span>` : ""}
        <span class="tag level ${esc(b.difficulty.toLowerCase())}">${esc(b.difficulty)}</span></div>
      <div class="card-body">
        <h3>${esc(b.name)}</h3>
        <p>${esc(b.tagline)}</p>
        <div class="card-meta"><span>${b.stats.printHours} h · ${b.stats.parts} part${b.stats.parts > 1 ? "s" : ""}</span><span class="price">Files ${money(b.price)}</span></div>
      </div>`;
    const img = $("img", el);
    if (img) queueThumb(b, img);
    return el;
  }

  // ---------- catalog ----------
  const levels = ["Beginner", "Intermediate", "Advanced"];
  const cats = [...new Set(BUILDS.map((b) => b.category))];
  const filter = { q: "", level: "", cat: "" };
  function chips(host, list, key) {
    host.innerHTML = ["All", ...list].map((v) => `<button type="button" class="chip" data-v="${esc(v === "All" ? "" : v)}" aria-pressed="${v === "All"}">${esc(v)}</button>`).join("");
    host.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      filter[key] = b.dataset.v;
      $$(".chip", host).forEach((c) => c.setAttribute("aria-pressed", c === b));
      renderCatalog();
    });
  }
  chips($("#levelChips"), levels.filter((l) => BUILDS.some((b) => b.difficulty === l)), "level");
  chips($("#catChips"), cats, "cat");
  $("#q").addEventListener("input", (e) => { filter.q = e.target.value.trim().toLowerCase(); renderCatalog(); });

  function renderCatalog() {
    const list = BUILDS.filter((b) =>
      (!filter.level || b.difficulty === filter.level) &&
      (!filter.cat || b.category === filter.cat) &&
      (!filter.q || [b.name, b.tagline, b.description, b.category, ...b.learn].join(" ").toLowerCase().includes(filter.q))
    );
    const host = $("#catalog");
    host.replaceChildren(...list.map(card));
    $("#count").textContent = list.length === BUILDS.length ? `${list.length} builds` : `${list.length} of ${BUILDS.length} builds`;
    if (!list.length) host.innerHTML = `<p class="empty">No builds match. Try clearing a filter.</p>`;
  }

  function renderBundle() {
    const b = SITE.bundle, host = $("#bundle");
    if (!b) return;
    const full = BUILDS.reduce((s, x) => s + x.price, 0);
    host.hidden = false;
    host.innerHTML = `<div><p class="kicker">Bundle</p><h2>${esc(b.name)}</h2>
      <p>All ${BUILDS.length} builds' print files for <b>${money(b.price)}</b>${full > b.price ? ` instead of ${money(full)}` : ""}. New builds added to the bundle are yours too.</p></div>
      ${buyButton(b.stripeLink, `Get the bundle · ${money(b.price)}`)}`;
  }

  function buyButton(link, label) {
    return link
      ? `<a class="btn buy" href="${esc(link)}" rel="noopener">${esc(label)}</a>`
      : `<button type="button" class="btn buy" data-not-ready>${esc(label)}</button>`;
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-not-ready]")) $("#notReady").showModal();
  });

  // ---------- detail ----------
  let viewer = null;
  function renderDetail(b) {
    if (!viewer) {
      viewer = window.Viewer.createViewer($("#viewer"));
      const slice = $("#slice"), out = $("#sliceOut");
      slice.addEventListener("input", () => { out.textContent = slice.value + "%"; viewer.setSlice(slice.value / 100); });
      const play = $("#playBtn");
      const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { play.setAttribute("aria-pressed", "false"); play.textContent = "Play motion"; }
      play.addEventListener("click", () => {
        const on = play.getAttribute("aria-pressed") !== "true";
        play.setAttribute("aria-pressed", on);
        play.textContent = on ? "Pause motion" : "Play motion";
        viewer.setAnimate(on);
      });
      const ex = $("#explodeBtn");
      ex.addEventListener("click", () => {
        const on = ex.getAttribute("aria-pressed") !== "true";
        ex.setAttribute("aria-pressed", on);
        ex.textContent = on ? "Put it together" : "Explode parts";
        viewer.setExplode(on);
      });
      $("#resetBtn").addEventListener("click", () => viewer.reset());
    }
    $("#slice").value = 100; $("#sliceOut").textContent = "100%";
    viewer.setSlice(1);
    viewer.setExplode(false);
    $("#explodeBtn").setAttribute("aria-pressed", "false");
    $("#explodeBtn").textContent = "Explode parts";
    viewer.reset();
    viewer.show(b);

    const s = b.stats;
    $("#detailInfo").innerHTML = `
      ${b.example ? `<p class="example-note">Example build. Replace it in <code>js/builds.js</code>.</p>` : ""}
      <p class="kicker">${esc(b.category)}</p>
      <h1>${esc(b.name)}</h1>
      <p class="lead">${esc(b.description)}</p>
      <dl class="stats">
        <div><dt>Level</dt><dd>${esc(b.difficulty)}</dd></div>
        <div><dt>Print time</dt><dd>${s.printHours} h</dd></div>
        <div><dt>Filament</dt><dd>${s.filamentGrams} g ${esc(s.material)}</dd></div>
        <div><dt>Parts</dt><dd>${s.parts}</dd></div>
      </dl>
      <div class="learn-box"><h3>What you'll learn</h3><ul>${b.learn.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>
      <div class="buy-box">
        <div class="tier free">
          <h3>Free plans</h3>
          <p>Parts list, printer settings and step-by-step instructions.</p>
          <a class="btn ghost" href="#plans" data-scroll-plans>Read the plans</a>
          ${b.plansPdf ? `<a class="btn ghost" href="${esc(b.plansPdf)}" download>Download PDF</a>` : `<button type="button" class="btn ghost" data-print>Print or save as PDF</button>`}
        </div>
        <div class="tier paid">
          <h3>Print files <span class="price">${money(b.price)}</span></h3>
          <p>STL files for all ${s.parts} part${s.parts > 1 ? "s" : ""}, a 3MF project with settings, and a personal-use license.</p>
          ${buyButton(b.stripeLink, `Buy files · ${money(b.price)}`)}
          <p class="muted small">Secure checkout with Stripe. Your download link appears right after you pay.</p>
        </div>
      </div>`;

    const done = store.get("progress:" + b.id, {});
    const cost = (s.filamentGrams / 1000) * 20 + 0.12 * s.printHours * 0.16;
    $("#plans").innerHTML = `
      <div class="plans-head">
        <div><p class="kicker">Free plans</p><h2>How to build ${esc(b.name)}</h2></div>
        <button type="button" class="btn ghost small" data-print>Print or save as PDF</button>
      </div>
      <div class="plans-grid">
        <div>
          <h3>Printer settings</h3>
          <table class="settings">${Object.entries(b.settings).map(([k, v]) => `<tr><th>${esc(labelFor(k))}</th><td>${esc(v)}</td></tr>`).join("")}</table>
          <p class="muted small">Materials cost about <b>${money(Math.round(cost * 100) / 100)}</b> to print yourself. <a href="#/learn">See how that's worked out →</a></p>
          <h3>Parts list</h3>
          <ul class="checklist">${b.bom.map((p, i) => `<li><label><input type="checkbox" data-k="bom${i}" ${done["bom" + i] ? "checked" : ""}><span><b>${p.qty}×</b> ${esc(p.item)}</span></label></li>`).join("")}</ul>
        </div>
        <div>
          <h3>Steps <span class="muted small" id="stepCount"></span></h3>
          <ol class="steps">${b.steps.map((st, i) => `
            <li class="${done["step" + i] ? "done" : ""}">
              <label><input type="checkbox" data-k="step${i}" ${done["step" + i] ? "checked" : ""}><span class="sr">Mark step ${i + 1} done</span></label>
              <div><h4>${esc(st.title)}</h4><p>${esc(st.text)}</p></div>
            </li>`).join("")}</ol>
          ${b.tips ? `<p class="tip"><b>Tip:</b> ${esc(b.tips)}</p>` : ""}
        </div>
      </div>`;
    const updateCount = () => {
      const n = $$(".steps input:checked", $("#plans")).length;
      $("#stepCount").textContent = `${n} of ${b.steps.length} done`;
    };
    updateCount();
    $("#plans").onchange = (e) => {
      const k = e.target.dataset.k;
      if (!k) return;
      done[k] = e.target.checked;
      store.set("progress:" + b.id, done);
      e.target.closest("li").classList.toggle("done", e.target.checked && k.startsWith("step"));
      updateCount();
    };
    document.title = `${b.name} · ${SITE.name}`;
  }
  const LABELS = { nozzle: "Nozzle", layer: "Layer height", infill: "Infill", walls: "Walls", supports: "Supports", plate: "Bed" };
  const labelFor = (k) => LABELS[k] || k[0].toUpperCase() + k.slice(1);

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-print]")) window.print();
    if (e.target.closest("[data-scroll-plans]")) { e.preventDefault(); $("#plans").scrollIntoView({ behavior: "smooth" }); }
  });

  // ---------- router ----------
  let redrawLessons = null, heroViewer = null;
  function route() {
    const [, view = "", id] = (location.hash || "#/").split("/");
    let name = view || "home";
    let build = null;
    if (name === "build") {
      build = BUILDS.find((b) => b.id === id);
      if (!build) name = "builds";
    }
    if (!["home", "builds", "build", "learn", "faq"].includes(name)) name = "home";
    $$("[data-view]").forEach((s) => (s.hidden = s.dataset.view !== name));
    $$(".site-head nav a").forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === "#/" + (name === "build" ? "builds" : name)));
    document.title = SITE.name;

    if (name === "home") {
      if (!heroViewer && BUILDS.length) { heroViewer = window.Viewer.createViewer($("#heroViewer")); heroViewer.show(BUILDS[0]); }
      if (!$("#featured").children.length) $("#featured").replaceChildren(...BUILDS.slice(0, 3).map(card));
    }
    if (name === "builds") { renderCatalog(); renderBundle(); }
    if (name === "build") renderDetail(build);
    if (name === "learn") requestAnimationFrame(() => {
      if (redrawLessons) redrawLessons(); else redrawLessons = window.Learn.mount($("[data-view=learn]"));
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
