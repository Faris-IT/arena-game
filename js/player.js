(function (A) {
  const C = A.CONFIG, P = C.player;

  function create() {
    return {
      x: C.width / 2, y: C.height / 2, vx: 0, vy: 0, r: P.radius, aim: 0, trail: [],
      stats: { health: P.health, maxHealth: P.health, speed: P.speed, attack: P.attack,
               fireRate: P.fireRate, energy: P.energy, maxEnergy: P.energy, shield: 0 }
    };
  }

  function update(p, dt) {
    const m = A.Input.getMove();
    // Percepatan halus yang tidak bergantung frame rate
    const k = 1 - Math.exp(-P.accel * dt);
    p.vx += (m.x * p.stats.speed - p.vx) * k;
    p.vy += (m.y * p.stats.speed - p.vy) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;

    const hit = A.Collision.clampToArena(p);
    if (hit.x) p.vx = 0;
    if (hit.y) p.vy = 0;

    // Arah bidik: joystick bidik > mouse > arah gerak (sentuh)
    const s = A.Input.stickAim, mo = A.Input.mouse;
    if (s.active) p.aim = Math.atan2(s.y, s.x);
    else if (mo.seen) p.aim = Math.atan2(mo.y - p.y, mo.x - p.x);
    else if (m.x || m.y) p.aim = Math.atan2(m.y, m.x);

    // Jejak visual (dibatasi 8 titik)
    if (Math.hypot(p.vx, p.vy) > 40) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 8) p.trail.shift(); }
    else if (p.trail.length) p.trail.shift();
  }

  A.Player = { create, update };
})(window.Arena);
