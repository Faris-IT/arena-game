// Delapan boss. Perilaku dijalankan lewat ai() yang dipanggil enemies.js. Serangan besar selalu diberi peringatan.
window.Arena = window.Arena || {};
(function (A) {
  const TAU = Math.PI * 2;
  const aim = (s, e) => Math.atan2(s.player.y - e.y, s.player.x - e.x);
  const shoot = (s, e, a, sp, dmg, col) => A.Projectiles.spawn(s.projectiles, { x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 6, damage: dmg, life: 4, from: 'enemy', color: col });
  function fan(s, e, n, spread, sp, dmg, col) { const a = aim(s, e); for (let i = 0; i < n; i++) shoot(s, e, a + (i - (n - 1) / 2) * spread, sp, dmg, col); }
  function keep(e, nx, ny, dist, want, sp) { // jaga jarak sambil bergerak menyamping
    let mx, my;
    if (dist > want + 40) { mx = nx; my = ny; } else if (dist < want - 40) { mx = -nx; my = -ny; } else { mx = -ny * e.side * 0.6; my = nx * e.side * 0.6; }
    e.vx = mx * sp; e.vy = my * sp;
  }
  function beam(s, e, warn, dur, w, dmg) {
    const a = aim(s, e);
    A.Hazards.add(s, { k: 'beam', x1: e.x, y1: e.y, x2: e.x + Math.cos(a) * 1300, y2: e.y + Math.sin(a) * 1300, w, dmg, warn, dur });
  }
  const blast = (s, x, y, r, warn, dmg) => A.Hazards.add(s, { k: 'blast', x, y, r, dmg, warn, dur: 0.25 });
  const tm = e => e.tm || (e.tm = { a: 1.5, b: 2, c: 3 });
  const minions = (s, e, n) => { if (s.enemies.length < 8) for (let i = 0; i < n; i++) A.Enemies.spawn(s.enemies, 'chaser', e.x + (i ? 30 : -30), e.y); };

  const defs = {
    boss1: { sides: 8, r: 30, speed: 75, hp: 260, damage: 18, score: 500, color: '#ff3d6e', boss: true, name: 'Spreader',
      desc: 'Tembakan menyebar yang makin lebar saat health berkurang.',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp; keep(e, nx, ny, dist, 260, e.d.speed);
        t.a -= dt; if (t.a <= 0) { fan(s, e, f < 0.5 ? 7 : 5, 0.26, 230, 8, e.d.color); t.a = f < 0.5 ? 1.4 : 1.9; } } },
    boss2: { sides: 4, r: 28, speed: 90, hp: 340, damage: 18, score: 600, color: '#ffd23c', boss: true, name: 'Lancer',
      desc: 'Serangan garis lurus dengan tanda peringatan.',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp; keep(e, nx, ny, dist, 300, e.d.speed);
        t.a -= dt; if (t.a <= 0) { beam(s, e, 0.9, 0.35, 30, 22); t.a = f < 0.5 ? 2.4 : 3.2; }
        t.b -= dt; if (t.b <= 0) { fan(s, e, 1, 0, 260, 8, e.d.color); t.b = 1.3; } } },
    boss3: { sides: 5, r: 30, speed: 60, hp: 300, damage: 18, score: 700, color: '#4dff9a', boss: true, name: 'Summoner',
      desc: 'Memanggil Chaser dan menembak tiga arah.',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e); keep(e, nx, ny, dist, 320, e.d.speed);
        t.a -= dt; if (t.a <= 0) { minions(s, e, 2); t.a = 5; }
        t.b -= dt; if (t.b <= 0) { fan(s, e, 3, 0.3, 240, 8, e.d.color); t.b = 2.2; } } },
    boss4: { sides: 6, r: 32, speed: 85, hp: 380, damage: 18, score: 800, color: '#ff9a3c', boss: true, name: 'Bomber',
      desc: 'Ledakan area di posisimu dan arah gerakmu.',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp, p = s.player; keep(e, nx, ny, dist, 200, e.d.speed);
        t.a -= dt; if (t.a <= 0) { blast(s, p.x, p.y, 85, 0.9, 24); blast(s, p.x + p.vx * 0.5, p.y + p.vy * 0.5, 85, 0.9, 24); t.a = f < 0.5 ? 1.8 : 2.4; } } },
    boss5: { sides: 3, r: 28, speed: 70, hp: 420, damage: 22, score: 900, color: '#ff5d5d', boss: true, name: 'Striker', windup: 0.8,
      desc: 'Menerjang setelah memberi tanda arah, lalu menembak menyebar.',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp;
        if (e.state === 'windup') { e.vx = e.vy = 0; e.st -= dt; if (e.st <= 0) { e.state = 'dash'; e.st = 0.5; } return; }
        if (e.state === 'dash') { e.vx = e.dx * 640; e.vy = e.dy * 640; e.st -= dt;
          if (e.st <= 0) { e.state = 'move'; fan(s, e, f < 0.5 ? 9 : 6, 0.3, 250, 8, e.d.color); t.a = f < 0.5 ? 2 : 2.8; } return; }
        keep(e, nx, ny, dist, 250, e.d.speed);
        t.a -= dt; if (t.a <= 0) { e.state = 'windup'; e.st = 0.8; e.dx = nx; e.dy = ny; } } },
    boss6: { sides: 12, r: 30, speed: 50, hp: 520, damage: 18, score: 1100, color: '#6ff7ff', boss: true, name: 'Vortex',
      desc: 'Peluru spiral lalu ledakan melingkar di sekitarmu.',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp, p = s.player; keep(e, nx, ny, dist, 300, e.d.speed);
        t.c += dt; const cyc = t.c % 6;
        if (cyc < 4) { t.a -= dt; t.blasted = false;
          if (t.a <= 0) { t.ang = (t.ang || 0) + 0.55; shoot(s, e, t.ang, 210, 7, e.d.color); if (f < 0.5) shoot(s, e, t.ang + Math.PI, 210, 7, e.d.color); t.a = 0.11; } }
        else if (!t.blasted) { t.blasted = true; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + (t.ang || 0); blast(s, p.x + Math.cos(a) * 110, p.y + Math.sin(a) * 110, 80, 1.0, 22); } } } },
    boss7: { sides: 7, r: 36, speed: 80, hp: 600, damage: 22, score: 1500, color: '#b36bff', boss: true, name: 'Overlord',
      desc: 'Gabungan tembakan menyebar, garis, ledakan, dan pemanggilan.',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp, p = s.player, k = f < 0.3 ? 0.65 : 1; keep(e, nx, ny, dist, 280, e.d.speed);
        t.a -= dt; if (t.a <= 0) { fan(s, e, 7, 0.24, 240, 8, e.d.color); t.a = 2 * k; }
        t.b -= dt; if (t.b <= 0) { beam(s, e, 0.9, 0.35, 28, 22); t.b = 3.4 * k; }
        if (f < 0.6) { t.c -= dt; if (t.c <= 0) { blast(s, p.x, p.y, 85, 0.9, 24); minions(s, e, 1); t.c = 3 * k; } } } },
    boss8: { sides: 9, r: 40, speed: 70, hp: 900, damage: 24, score: 3000, color: '#ff3df2', boss: true, name: 'Overmind',
      desc: 'Boss terakhir dengan tiga fase dan cincin peluru.',
      ai(e, s, dt, nx, ny, dist) { const t = tm(e), f = e.hp / e.maxHp, p = s.player, k = f < 0.3 ? 0.6 : f < 0.6 ? 0.8 : 1; keep(e, nx, ny, dist, 270, e.d.speed);
        t.a -= dt; if (t.a <= 0) { fan(s, e, 9, 0.22, 250, 8, e.d.color); t.a = 2.2 * k; }
        t.b -= dt; if (t.b <= 0) { beam(s, e, 0.9, 0.35, 30, 24); t.b = 3.2 * k; }
        t.c -= dt; if (t.c <= 0) { blast(s, p.x, p.y, 85, 0.9, 24); blast(s, p.x + p.vx * 0.5, p.y + p.vy * 0.5, 85, 0.9, 24); if (f < 0.6) minions(s, e, 2); t.c = 3.4 * k; }
        if (f < 0.3) { t.d = (t.d || 0) - dt; if (t.d <= 0) { const o = Math.random() * TAU; for (let i = 0; i < 12; i++) shoot(s, e, o + i * TAU / 12, 200, 7, '#ffffff'); t.d = 2.5; } } } }
  };
  Object.assign(A.EnemyData, defs);
  const ids = Object.keys(defs);
  A.Bosses = {
    ids, info: ids.map(id => ({ name: defs[id].name, desc: defs[id].desc })),
    drawBar(ctx, b) { // bar health boss di bagian atas arena
      const w = 300, x = A.CONFIG.width / 2 - w / 2, y = 34;
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x, y, w, 10);
      ctx.fillStyle = b.d.color; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.maxHp), 10);
      ctx.fillStyle = '#e6edf7'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.d.name.toUpperCase(), A.CONFIG.width / 2, y - 6);
    }
  };
})(window.Arena);
