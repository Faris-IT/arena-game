(function (A) {
  const C = A.CONFIG, P = C.player, B = C.combat.bullet;

  function create() {
    return {
      x: C.width / 2, y: C.height / 2, vx: 0, vy: 0, r: P.radius, aim: 0, trail: [],
      fireCd: 0, invuln: 0, shieldT: 0, dash: null, hitCount: 0,
      // modifier dari upgrade (Build & Survive)
      mods: { dmg: 1, rate: 1, spd: 1, range: 1, multi: 0, guard: 1, regen: 0, energy: 1 },
      stats: { health: P.health, maxHealth: P.health, speed: P.speed, attack: P.attack,
               fireRate: P.fireRate, energy: P.energy, maxEnergy: P.energy, shield: 0 }
    };
  }

  // Mengembalikan true jika damage benar-benar diterima (tidak dihitung dua kali saat kebal atau ber-shield).
  function damage(p, amount) {
    if (p.invuln > 0 || p.shieldT > 0) return false;
    p.stats.health = Math.max(0, p.stats.health - amount * p.mods.guard);
    p.invuln = C.combat.invuln;
    p.hitCount++;
    return true;
  }

  // Tembak otomatis: ada musuh di dalam jangkauan dan searah bidikan.
  function hasTarget(p, enemies) {
    const range = B.range * p.mods.range;
    for (const e of enemies) {
      const dx = e.x - p.x, dy = e.y - p.y;
      if (e.dead || dx * dx + dy * dy > range * range) continue;
      const d = Math.atan2(dy, dx) - p.aim;
      if (Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) < B.cone) return true;
    }
    return false;
  }

  function update(p, dt, s) {
    const m = A.Input.getMove(), spd = p.stats.speed * p.mods.spd * (s.mode.speedMul || 1);
    if (p.dash) { // Dash: kecepatan tetap singkat
      p.vx = p.dash.vx; p.vy = p.dash.vy; p.dash.t -= dt;
      if (p.dash.t <= 0) p.dash = null;
    } else { // Percepatan halus yang tidak bergantung frame rate
      const k = 1 - Math.exp(-P.accel * dt);
      p.vx += (m.x * spd - p.vx) * k;
      p.vy += (m.y * spd - p.vy) * k;
    }
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

    if (p.mods.regen > 0 && !(s.mode.noHeal || s.rules.noHeal)) p.stats.health = Math.min(p.stats.maxHealth, p.stats.health + p.mods.regen * dt);

    // Serangan dengan cooldown
    p.fireCd -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    const noShoot = s.mode.noShoot || s.rules.noShoot;
    if (p.fireCd <= 0 && !noShoot && (A.Input.firing || st.active || hasTarget(p, s.enemies))) {
      const n = 1 + p.mods.multi, life = B.life * p.mods.range;
      for (let i = 0; i < n; i++) {
        const a = p.aim + (i - (n - 1) / 2) * 0.22;
        A.Projectiles.spawn(s.projectiles, {
          x: p.x + Math.cos(a) * p.r, y: p.y + Math.sin(a) * p.r,
          vx: Math.cos(a) * B.speed, vy: Math.sin(a) * B.speed,
          r: B.radius, damage: p.stats.attack * p.mods.dmg, life, from: 'player', color: C.colors.bullet
        });
      }
      p.fireCd = p.stats.fireRate * p.mods.rate;
    }

    // Jejak visual (dibatasi 8 titik)
    if (Math.hypot(p.vx, p.vy) > 40) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 8) p.trail.shift(); }
    else if (p.trail.length) p.trail.shift();
  }

  A.Player = { create, update, damage };
})(window.Arena);
