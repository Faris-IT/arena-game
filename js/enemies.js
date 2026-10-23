(function (A) {
  const C = A.CONFIG, D = A.EnemyData;

  function spawn(list, type, x, y, guardR) {
    const d = D[type];
    list.push({ type, d, x, y, vx: 0, vy: 0, r: d.r, hp: d.hp, maxHp: d.hp, flash: 0, dead: false,
      state: 'move', st: 0, dx: 1, dy: 0, aim: 0, age: 0, slide: 0, sx: 0, sy: 0,
      guardR: guardR || 0, aggro: false, tgt: null, coreCd: 0, side: Math.random() < 0.5 ? 1 : -1,
      cool: type === 'shooter' ? 0.5 + Math.random() : 1 + Math.random() });
  }

  // Muncul di tepi arena, jauh dari pemain.
  function spawnAtEdge(list, type, player) {
    let x = 0, y = 0;
    for (let i = 0; i < 6; i++) {
      const side = Math.floor(Math.random() * 4), m = 30;
      if (side === 0) { x = Math.random() * C.width; y = m; }
      else if (side === 1) { x = Math.random() * C.width; y = C.height - m; }
      else if (side === 2) { x = m; y = Math.random() * C.height; }
      else { x = C.width - m; y = Math.random() * C.height; }
      if (Math.hypot(x - player.x, y - player.y) > 220) break;
    }
    spawn(list, type, x, y);
  }

  function update(s, dt) {
    const list = s.enemies, p = s.player;
    for (const e of list) {
      if (e.dead) continue;
      const tg = (e.tgt && e.tgt.hp > 0) ? e.tgt : p; // sebagian musuh menyerang inti (Core Escort)
      const d = e.d, dx = tg.x - e.x, dy = tg.y - e.y, dist = Math.hypot(dx, dy) || 1, nx = dx / dist, ny = dy / dist;
      if (e.flash > 0) e.flash -= dt;
      if (e.coreCd > 0) e.coreCd -= dt;
      e.aim = Math.atan2(ny, nx);
      if (d.life) { e.age += dt; if (e.age > d.life) { e.dead = true; continue; } } // menghilang tanpa dihitung kill
      if (e.guardR && !e.aggro) { // penjaga diam sampai pemain mendekat
        if (Math.hypot(p.x - e.x, p.y - e.y) < e.guardR) e.aggro = true; else { e.vx = e.vy = 0; continue; }
      }

      if (e.type === 'shooter') {
        let mx = 0, my = 0;
        if (dist > d.keep + 30) { mx = nx; my = ny; }
        else if (dist < d.keep - 30) { mx = -nx; my = -ny; }
        else { mx = -ny * e.side * 0.5; my = nx * e.side * 0.5; }
        e.vx = mx * d.speed; e.vy = my * d.speed;
        e.cool -= dt;
        if (e.cool <= 0 && dist < 520) {
          A.Projectiles.spawn(s.projectiles, { x: e.x, y: e.y, vx: nx * d.projSpeed, vy: ny * d.projSpeed,
            r: 5, damage: d.projDamage, life: 3, from: 'enemy', color: d.color });
          e.cool = d.fireRate;
        }
      } else if (e.type === 'dasher') {
        if (e.state === 'move') {
          e.vx = nx * d.speed; e.vy = ny * d.speed; e.cool -= dt;
          if (e.cool <= 0 && dist < 360) { e.state = 'windup'; e.st = d.windup; e.dx = nx; e.dy = ny; } // kunci arah
        } else if (e.state === 'windup') {
          e.vx = e.vy = 0; e.st -= dt;
          if (e.st <= 0) { e.state = 'dash'; e.st = d.dashTime; }
        } else {
          e.vx = e.dx * d.dashSpeed; e.vy = e.dy * d.dashSpeed; e.st -= dt;
          if (e.st <= 0) { e.state = 'move'; e.cool = d.cooldown; }
        }
      } else if (e.type === 'target') { // kabur, condong ke tengah arena agar tidak terjebak di sudut
        let mx = -nx - ny * 0.5 * e.side + (C.width / 2 - e.x) / C.width * 1.4;
        let my = -ny + nx * 0.5 * e.side + (C.height / 2 - e.y) / C.height * 1.4;
        const l = Math.hypot(mx, my) || 1;
        const sp = d.speed * (dist < 220 ? 1 : 0.5);
        e.vx = mx / l * sp; e.vy = my / l * sp;
      } else if (d.ai) { // boss: perilaku khusus
        d.ai(e, s, dt, nx, ny, dist);
      } else { // chaser, tank
        e.vx = nx * d.speed; e.vy = ny * d.speed;
      }

      if (e.slide > 0 && e.type !== 'dasher') { e.slide -= dt; e.vx = e.sx * d.speed; e.vy = e.sy * d.speed; }
      const sm = A.Abilities.slowMul(s, e); // Slow Field
      e.x += e.vx * dt * sm; e.y += e.vy * dt * sm;
      A.Collision.clampToArena(e);
      const h = A.Collision.pushOut(e, s.obstacles);
      if (h) { e.slide = 0.35; e.sx = -h.y * e.side; e.sy = h.x * e.side; } // menyusuri penghalang
    }
    // Pemisahan antarmusuh agar tidak menumpuk
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy) || 0.01, min = a.r + b.r;
        if (dd < min) { const push = (min - dd) / 2 / dd; a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push; }
      }
    }
  }

  // Damage sentuhan; jeda kebal pemain mencegah damage ganda.
  function contact(s) {
    const core = s.core;
    for (const e of s.enemies) {
      if (e.dead || e.d.damage <= 0) continue;
      if (A.Collision.circleHit(e, s.player)) A.Player.damage(s.player, e.d.damage);
      if (core && core.hp > 0 && e.coreCd <= 0 && A.Collision.circleHit(e, core)) { core.hp -= e.d.damage; core.flash = 0.15; e.coreCd = 0.8; }
    }
  }

  function removeDead(s) {
    let n = 0;
    for (const e of s.enemies) if (!e.dead) s.enemies[n++] = e;
    s.enemies.length = n;
  }

  A.Enemies = { spawn, spawnAtEdge, update, contact, removeDead };
})(window.Arena);
