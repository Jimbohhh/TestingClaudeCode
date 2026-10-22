// Keyboard, pointer and on-screen joystick input.
(function (WE) {
  const In = {
    keys: new Set(),
    edges: new Set(),
    held: {},            // virtual held buttons (touch): sprint, stalk...
    taps: new Set(),     // virtual one-shot buttons
    pointer: { x: 0, y: 0, down: false, moved: false, active: false },
    joy: { x: 0, y: 0, active: false },
    isTouch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
  };

  const BIND = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    sprint: ['Space'], stalk: ['ShiftLeft', 'ShiftRight'],
    observe: ['KeyE', 'Enter'], journal: ['KeyJ', 'Tab'], map: ['KeyM'], back: ['Escape'],
    power1: ['Digit1', 'KeyQ'], power2: ['Digit2', 'KeyR'], power3: ['Digit3', 'KeyF'],
  };

  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    if (!In.keys.has(e.code)) In.edges.add(e.code);
    In.keys.add(e.code);
    In.lastKeyboard = performance.now();
  });
  window.addEventListener('keyup', e => In.keys.delete(e.code));
  window.addEventListener('blur', () => { In.keys.clear(); In.held = {}; });

  In.down = name => BIND[name].some(k => In.keys.has(k)) || !!In.held[name];
  // One-shot: true once per key press (or virtual tap).
  In.hit = function (name) {
    if (In.taps.has(name)) { In.taps.delete(name); return true; }
    for (const k of BIND[name]) if (In.edges.has(k)) { In.edges.delete(k); return true; }
    return false;
  };
  In.endFrame = function () { In.edges.clear(); In.taps.clear(); };
  In.tap = name => In.taps.add(name);

  In.axis = function () {
    let x = (In.down('right') ? 1 : 0) - (In.down('left') ? 1 : 0);
    let y = (In.down('down') ? 1 : 0) - (In.down('up') ? 1 : 0);
    if (In.joy.active) { x = In.joy.x; y = In.joy.y; }
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return { x, y, mag: Math.min(1, m) };
  };

  In.attachCanvas = function (canvas) {
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      In.pointer.x = e.clientX - r.left; In.pointer.y = e.clientY - r.top;
    };
    canvas.addEventListener('pointerdown', e => { pos(e); In.pointer.down = true; In.pointer.active = true; In.pointer.justDown = true; });
    window.addEventListener('pointermove', e => { pos(e); In.pointer.active = true; });
    window.addEventListener('pointerup', () => { In.pointer.down = false; });
  };

  // On-screen joystick element; returns the DOM node.
  In.makeJoystick = function () {
    const el = WE.U.el('div', { class: 'joy', 'aria-hidden': 'true' }, [WE.U.el('div', { class: 'knob' })]);
    const knob = el.firstChild;
    let id = null;
    const move = e => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      In.joy.x = Math.abs(dx) < 0.12 ? 0 : dx; In.joy.y = Math.abs(dy) < 0.12 ? 0 : dy;
      knob.style.transform = `translate(${dx * r.width * 0.32}px, ${dy * r.height * 0.32}px)`;
    };
    el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); In.joy.active = true; move(e); });
    el.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
    const end = e => { if (e.pointerId !== id) return; id = null; In.joy.active = false; In.joy.x = In.joy.y = 0; knob.style.transform = ''; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    return el;
  };

  // Bind a DOM button to a virtual held action.
  In.holdButton = function (el, name) {
    const on = e => { e.preventDefault(); In.held[name] = true; el.classList.add('on'); };
    const off = () => { In.held[name] = false; el.classList.remove('on'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
  };

  WE.Input = In;
})(window.WE);
