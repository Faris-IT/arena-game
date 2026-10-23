(function (A) {
  const C = A.CONFIG;
  const KEYS = { KeyW:[0,-1], ArrowUp:[0,-1], KeyS:[0,1], ArrowDown:[0,1], KeyA:[-1,0], ArrowLeft:[-1,0], KeyD:[1,0], ArrowRight:[1,0] };
  const down = new Set();
  const stickMove = { x: 0, y: 0, active: false };
  const stickAim = { x: 0, y: 0, active: false };
  const mouse = { x: C.width / 2, y: C.height / 2, seen: false };
  let canvas = null, space = false, mouseDown = false;

  addEventListener('keydown', e => {
    if (KEYS[e.code]) { down.add(e.code); e.preventDefault(); }
    if (e.code === 'Space') { space = true; e.preventDefault(); }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) A.GameState.togglePause();
  });
  addEventListener('keyup', e => { down.delete(e.code); if (e.code === 'Space') space = false; });
addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0 && e.target === canvas) mouseDown = true; });
addEventListener('pointerup', () => { mouseDown = false; });
  addEventListener('blur', () => { down.clear(); space = false; mouseDown = false; A.GameState.pause(); });

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !canvas) return;
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width * C.width;
    mouse.y = (e.clientY - r.top) / r.height * C.height;
    mouse.seen = true;
  });

  function makeStick(el, out) {
    const knob = el.querySelector('.knob');
    let id = null, cx = 0, cy = 0, R = 1;
    function move(e) {
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy), m = Math.min(d, R * 0.6);
      if (d > 0) { dx /= d; dy /= d; }
      knob.style.transform = 'translate(' + dx * m + 'px,' + dy * m + 'px)';
      const f = m / (R * 0.6);
      out.active = f > 0.15;
      out.x = out.active ? dx * f : 0; out.y = out.active ? dy * f : 0;
    }
    function end(e) {
      if (e.pointerId !== id) return;
      id = null; knob.style.transform = ''; out.x = out.y = 0; out.active = false;
    }
    el.addEventListener('pointerdown', e => {
      id = e.pointerId; el.setPointerCapture(id);
      const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width / 2;
      move(e);
    });
    el.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  A.Input = {
    mouse, stickAim,
    get firing() { return space || mouseDown; },
    init(cv) {
      canvas = cv;
      makeStick(document.getElementById('stick-move'), stickMove);
      makeStick(document.getElementById('stick-aim'), stickAim);
    },
    // Vektor gerak (panjang maks 1): keyboard digabung dengan joystick.
    getMove() {
      let x = 0, y = 0;
      down.forEach(k => { x += KEYS[k][0]; y += KEYS[k][1]; });
      if (x || y) { const l = Math.hypot(x, y); return { x: x / l, y: y / l }; }
      return { x: stickMove.x, y: stickMove.y };
    }
  };
})(window.Arena);
