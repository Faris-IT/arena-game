(function (A) {
  const C = A.CONFIG, P = C.player, B = C.combat.bullet;

  function create() {
    return {
      x: C.width / 2, y: C.height / 2, vx: 0, vy: 0, r: P.radius, aim: 0, trail: [],
      fireCd: 0, invuln: 0,
      stats: { health: P.health, maxHealth: P.health, speed: P.speed, attack: P.attack,
               fireRate: P.fireRate, energy: P.energy, maxEnergy: P.energy, shield: 0 }
    };
  }

  // Mengembalikan true jika damage benar-benar diterima (tidak dihitung dua kali saat kebal).
  function damage(p, amount) {
    if (p.invuln > 0) return false;
    p.stats.health = Math.max(0, p.stats.health - amount);
    p.invuln = C.combat.invuln;
    return true;
  }

  // Tembak otomatis: ada musuh di dalam jangkauan dan searah bidikan.
  function hasTarget(p, enemies) {
    for (const e of enemies) {
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx * dx + dy * dy > B.range * B.range) continue;
      const d = Math.atan2(dy, dx) - p.aim;
      if (Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) < B.cone) return true;
    }
    return false;
  }

  function update(p, dt, s) {
    const m = A.Input.getMove();
    // Percepatan halus yang tidak bergantung frame rate
    const k = 1 - Math.exp(-P.accel * dt);
    p.vx += (m.x * p.stats.speed - p.vx) * k;
    p.vy += (m.y * p.stats.speed - p.vy) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;

    const hit = A.Collision.clampToArena(p);
    if (hit.x) p.vx = 0;
    if (hit.y) p.vy = 0;
    const ob = A.Collision.pushOut(p, s.obstacles);
    if (ob) { const vn = p.vx * ob.x + p.vy * ob.y; if (vn < 0) { p.vx -= vn * ob.x; p.vy -= vn * ob.y; } }

    // Arah bidik: joystick bidik > mouse > arah gerak (sentuh)
    const st = A.Input.stickAim, mo = A.Input.mouse;
    if (st.active) p.aim = Math.atan2(st.y, st.x);
    else if (mo.seen) p.aim = Math.atan2(mo.y - p.y, mo.x - p.x);
    else if (m.x || m.y) p.aim = Math.atan2(m.y, m.x);

    // Serangan dengan cooldown
    p.fireCd -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.fireCd <= 0 && (A.Input.firing || st.active || hasTarget(p, s.enemies))) {
      A.Projectiles.spawn(s.projectiles, {
        x: p.x + Math.cos(p.aim) * p.r, y: p.y + Math.sin(p.aim) * p.r,
        vx: Math.cos(p.aim) * B.speed, vy: Math.sin(p.aim) * B.speed,
        r: B.radius, damage: p.stats.attack, life: B.life, from: 'player', color: C.colors.bullet
      });
      p.fireCd = p.stats.fireRate;
    }

    // Jejak visual (dibatasi 8 titik)
    if (Math.hypot(p.vx, p.vy) > 40) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 8) p.trail.shift(); }
    else if (p.trail.length) p.trail.shift();
  }

  A.Player = { create, update, damage };
})(window.Arena);
