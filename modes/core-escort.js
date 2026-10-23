(function (A) {
  const U = A.Util, C = A.CONFIG, TAU = Math.PI * 2;
  const LV = [
    { name: 'Jalan lurus', desc: 'Jalur lurus, inti tangguh, musuh sedikit.', path: [[70, 300], [895, 300]], hp: 150, speed: 46, spawn: 0.7, near: 130, obst: [] },
    { name: 'Zig-zag', desc: 'Aturan standar.', path: [[70, 300], [290, 180], [500, 420], [720, 200], [895, 300]], hp: 100, speed: 40, spawn: 1, near: 120, obst: [] },
    { name: 'Lorong', desc: 'Jalur berbelok dengan tembok perlindungan.', path: [[70, 300], [330, 300], [330, 130], [630, 130], [630, 430], [895, 430]], hp: 100, speed: 40, spawn: 1.2, near: 120,
      obst: [[480, 250, 24, 120], [160, 420, 120, 24], [760, 120, 24, 160]] },
    { name: 'Konvoi berat', desc: 'Jalur panjang dan musuh jauh lebih banyak.', path: [[70, 120], [400, 120], [400, 480], [700, 480], [700, 150], [895, 150]], hp: 100, speed: 38, spawn: 1.5, near: 115,
      obst: [[200, 300, 24, 160], [550, 250, 24, 150]] },
    { name: 'Pengawalan terakhir', desc: 'Inti rapuh dan lambat, serangan beruntun.', path: [[70, 300], [240, 500], [480, 100], [720, 500], [895, 300]], hp: 80, speed: 34, spawn: 1.8, near: 110,
      obst: [[470, 280, 24, 80]] }
  ];

  U.register({
    id: 'core-escort', name: 'Core Escort', difficulty: 'Sulit', timeRecord: 'min', levels: LV,
    objective: 'Antar inti energi ke titik keluar.',
    rules: '5 level dengan jalur, ketahanan inti, dan jumlah musuh berbeda. Inti hanya bergerak saat kamu dekat. Inti hancur berarti kalah.',
    start(s) {
      const L = LV[s.level]; s.L = L;
      s.pathPts = L.path.map(p => ({ x: p[0], y: p[1] }));
      let t = 0; for (let i = 1; i < s.pathPts.length; i++) t += Math.hypot(s.pathPts[i].x - s.pathPts[i - 1].x, s.pathPts[i].y - s.pathPts[i - 1].y);
      s.total = t;
      s.obstacles = L.obst.map(o => ({ x: o[0], y: o[1], w: o[2], h: o[3] }));
      const p0 = s.pathPts[0];
      s.core = { x: p0.x, y: p0.y, r: 16, hp: L.hp, maxHp: L.hp, flash: 0, wp: 1, moving: false };
      s.player.x = Math.min(C.width - 40, p0.x + 50); s.player.y = p0.y;
      s.travel = 0; s.spawnT = 2.5; s.healT = 25;
    },
    hud(s) { return 'Inti ' + Math.max(0, Math.round(s.core.hp / s.core.maxHp * 100)) + '% · Jarak ' + Math.round(s.travel / s.total * 100) + '%'; },
    endTitle(s, result) { return result === 'lose' && s.core.hp <= 0 ? 'Inti hancur' : null; },
    drawBelow(ctx, s) {
      const P = s.pathPts;
      ctx.strokeStyle = 'rgba(255,210,60,.25)'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
      ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); ctx.setLineDash([]);
      const e = P[P.length - 1];
      ctx.fillStyle = 'rgba(77,255,154,.14)'; ctx.strokeStyle = '#4dff9a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(e.x, e.y, 28, 0, TAU); ctx.fill(); ctx.stroke();
      const c = s.core;
      ctx.strokeStyle = c.moving ? 'rgba(255,210,60,.55)' : 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, s.L.near, 0, TAU); ctx.stroke();
    },
    drawAbove(ctx, s) {
      const c = s.core; if (c.hp <= 0) return;
      ctx.fillStyle = c.flash > 0 ? '#fff' : '#ffd23c';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1405'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 0.45, 0, TAU); ctx.fill();
      const w = 40; ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(c.x - w / 2, c.y - c.r - 12, w, 5);
      ctx.fillStyle = c.hp / c.maxHp > 0.35 ? '#4dff9a' : '#ff5d5d'; ctx.fillRect(c.x - w / 2, c.y - c.r - 12, w * Math.max(0, c.hp / c.maxHp), 5);
    },
    update(s, dt) {
      const c = s.core, p = s.player, L = s.L, P = s.pathPts;
      if (c.flash > 0) c.flash -= dt;
      if (c.hp <= 0) return 'lose';
      c.moving = Math.hypot(p.x - c.x, p.y - c.y) < L.near;
      if (c.moving) {
        const w = P[c.wp], dx = w.x - c.x, dy = w.y - c.y, l = Math.hypot(dx, dy), step = L.speed * dt;
        if (l <= step) {
          c.x = w.x; c.y = w.y; s.travel += l; A.Scoring.add(s, 100);
          if (c.wp >= P.length - 1) { A.Scoring.add(s, 500 + c.hp * 5); return 'win'; }
          c.wp++;
        } else { c.x += dx / l * step; c.y += dy / l * step; s.travel += step; }
      }
      const pr = s.travel / s.total;
      s.spawnT -= dt;
      if (s.spawnT <= 0 && s.enemies.length < Math.round(10 * L.spawn) + 2) {
        const r = Math.random();
        A.Enemies.spawnAtEdge(s.enemies, pr > 0.6 && r < 0.1 ? 'tank' : pr > 0.45 && r < 0.28 ? 'dasher' : pr > 0.2 && r < 0.5 ? 'shooter' : 'chaser', s.player);
        if (Math.random() < 0.55) s.enemies[s.enemies.length - 1].tgt = c; // sebagian musuh mengincar inti
        s.spawnT = Math.max(0.9, (2.6 - pr * 1.4) / L.spawn);
      }
      s.healT -= dt;
      if (s.healT <= 0) { s.healT = 25; if (!s.items.length) A.Items.spawnHeal(s, 25, 12); }
      return null;
    }
  });
})(window.Arena);
