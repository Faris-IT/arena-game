(function (A) {
  const U = A.Util, C = A.CONFIG;
  const shoot = (s, e, a, sp, dmg, col) => A.Projectiles.spawn(s.projectiles, { x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 6, damage: dmg, life: 4, from: 'enemy', color: col });
  function fan(s, e, n, spread, sp, dmg, col) {
    const a = Math.atan2(s.player.y - e.y, s.player.x - e.x);
    for (let i = 0; i < n; i++) shoot(s, e, a + (i - (n - 1) / 2) * spread, sp, dmg, col);
  }
  function keep(e, nx, ny, dist, want, sp) { // jaga jarak dari pemain sambil menyamping
    let mx, my;
    if (dist > want + 40) { mx = nx; my = ny; } else if (dist < want - 40) { mx = -nx; my = -ny; } else { mx = -ny * e.side * 0.6; my = nx * e.side * 0.6; }
    e.vx = mx * sp; e.vy = my * sp;
  }
  function beam(s, e, warn, dur, w, dmg) {
    const a = Math.atan2(s.player.y - e.y, s.player.x - e.x);
    A.Hazards.add(s, { k: 'beam', x1: e.x, y1: e.y, x2: e.x + Math.cos(a) * 1300, y2: e.y + Math.sin(a) * 1300, w, dmg, warn, dur });
  }
  const blast = (s, x, y, r, warn, dmg) => A.Hazards.add(s, { k: 'blast', x, y, r, dmg, warn, dur: 0.25 });
  const tm = e => e.tm || (e.tm = { a: 1.5, b: 2, c: 3 });

  // Lima boss, masing-masing dengan pola berbeda (peringatan selalu tampil sebelum serangan besar).
  Object.assign(A.EnemyData, {
    boss1: { sides: 8, r: 30, speed: 75, hp: 260, damage: 18, score: 500, color: '#ff3d6e', boss: true, name: 'Spreader',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp; keep(e, nx, ny, dist, 260, e.d.speed);
        t.a -= dt; if (t.a <= 0) { fan(s, e, f < 0.5 ? 7 : 5, 0.26, 230, 8, '#ff3d6e'); t.a = f < 0.5 ? 1.4 : 1.9; } } },
    boss2: { sides: 4, r: 28, speed: 90, hp: 340, damage: 18, score: 600, color: '#ffd23c', boss: true, name: 'Lancer',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp; keep(e, nx, ny, dist, 300, e.d.speed);
        t.a -= dt; if (t.a <= 0) { beam(s, e, 0.9, 0.35, 30, 22); t.a = f < 0.5 ? 2.4 : 3.2; }
        t.b -= dt; if (t.b <= 0) { fan(s, e, 1, 0, 260, 8, '#ffd23c'); t.b = 1.3; } } },
    boss3: { sides: 5, r: 30, speed: 60, hp: 300, damage: 18, score: 700, color: '#4dff9a', boss: true, name: 'Summoner',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e); keep(e, nx, ny, dist, 320, e.d.speed);
        t.a -= dt; if (t.a <= 0) { if (s.enemies.length < 8) { A.Enemies.spawn(s.enemies, 'chaser', e.x - 30, e.y); A.Enemies.spawn(s.enemies, 'chaser', e.x + 30, e.y); } t.a = 5; }
        t.b -= dt; if (t.b <= 0) { fan(s, e, 3, 0.3, 240, 8, '#4dff9a'); t.b = 2.2; } } },
    boss4: { sides: 6, r: 32, speed: 85, hp: 380, damage: 18, score: 800, color: '#ff9a3c', boss: true, name: 'Bomber',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp, p = s.player; keep(e, nx, ny, dist, 200, e.d.speed);
        t.a -= dt; if (t.a <= 0) { blast(s, p.x, p.y, 85, 0.9, 24); blast(s, p.x + p.vx * 0.5, p.y + p.vy * 0.5, 85, 0.9, 24); t.a = f < 0.5 ? 1.8 : 2.4; } } },
    boss5: { sides: 7, r: 36, speed: 80, hp: 600, damage: 22, score: 1500, color: '#b36bff', boss: true, name: 'Overlord',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp, p = s.player, k = f < 0.3 ? 0.65 : 1; keep(e, nx, ny, dist, 280, e.d.speed);
        t.a -= dt; if (t.a <= 0) { fan(s, e, 7, 0.24, 240, 8, '#b36bff'); t.a = 2 * k; }
        t.b -= dt; if (t.b <= 0) { beam(s, e, 0.9, 0.35, 28, 22); t.b = 3.4 * k; }
        if (f < 0.6) { t.c -= dt; if (t.c <= 0) { blast(s, p.x, p.y, 85, 0.9, 24); if (s.enemies.length < 7) A.Enemies.spawn(s.enemies, 'chaser', e.x, e.y + 30); t.c = 3 * k; } } } }
  });

  U.register({
    id: 'boss-rush', name: 'Boss Rush', difficulty: 'Sulit', timeRecord: 'min',
    objective: 'Kalahkan 5 boss berturut-turut.',
    rules: 'Tiap boss punya pola berbeda: tembakan menyebar, serangan garis, pemanggilan musuh, dan serangan area. Ada pemulihan terbatas di antara boss.',
    start(s) { s.bi = 0; s.phase = 'rest'; s.restT = 2.5; s.boss = null; },
    hud(s) { return 'Boss ' + Math.min(5, s.bi + 1) + '/5' + (s.boss && !s.boss.dead ? ' · ' + s.boss.d.name : ''); },
    endTitle() { return null; },
    drawAbove(ctx, s) {
      const b = s.boss; if (!b || b.dead) return;
      const w = 300, x = C.width / 2 - w / 2, y = 34;
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x, y, w, 10);
      ctx.fillStyle = b.d.color; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.maxHp), 10);
      ctx.fillStyle = '#e6edf7'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.d.name.toUpperCase(), C.width / 2, y - 6);
    },
    update(s, dt) {
      if (s.phase === 'rest') {
        s.restT -= dt;
        if (s.restT <= 0) { A.Enemies.spawn(s.enemies, 'boss' + (s.bi + 1), C.width / 2, 110); s.boss = s.enemies[s.enemies.length - 1]; s.phase = 'fight'; }
        return null;
      }
      if (s.boss.dead) {
        for (const e of s.enemies) e.dead = true; // minion lenyap bersama boss
        s.hazards.length = 0; s.projectiles.length = 0;
        s.bi++;
        if (s.bi >= 5) { A.Scoring.add(s, 1000 + s.player.stats.health * 3); return 'win'; }
        const st = s.player.stats; st.health = Math.min(st.maxHealth, st.health + 30); // pemulihan terbatas
        A.Items.spawnHeal(s, 20, 12);
        s.phase = 'rest'; s.restT = 4;
      }
      return null;
    }
  });
})(window.Arena);
