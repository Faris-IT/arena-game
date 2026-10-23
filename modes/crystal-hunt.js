(function (A) {
  const U = A.Util, C = A.CONFIG, TOTAL = 20, LIMIT = 120;
  const OBST = [
    { x: 200, y: 130, w: 110, h: 24 }, { x: 650, y: 130, w: 110, h: 24 },
    { x: 430, y: 190, w: 100, h: 24 }, { x: 430, y: 386, w: 100, h: 24 },
    { x: 200, y: 446, w: 110, h: 24 }, { x: 650, y: 446, w: 110, h: 24 },
    { x: 110, y: 260, w: 24, h: 90 },  { x: 826, y: 260, w: 24, h: 90 }
  ];
  const free = (x, y, s) => x > 40 && x < C.width - 40 && y > 40 && y < C.height - 40 && !A.Collision.inRects(x, y, 20, s.obstacles);
  const far = (x, y, s, d) => Math.hypot(x - s.player.x, y - s.player.y) > 130 && s.crystals.every(c => Math.hypot(x - c.x, y - c.y) > d);

  function place(s, i) {
    for (let t = 0; t < 60; t++) {
      let x, y;
      if (i < 7) { // sebagian kristal berada di balik rintangan
        const o = OBST[Math.floor(Math.random() * OBST.length)], horiz = o.w >= o.h, sg = Math.random() < 0.5 ? -1 : 1;
        x = o.x + o.w / 2 + (horiz ? (Math.random() - 0.5) * o.w : sg * (o.w / 2 + 28));
        y = o.y + o.h / 2 + (horiz ? sg * (o.h / 2 + 28) : (Math.random() - 0.5) * o.h);
      } else { x = 50 + Math.random() * (C.width - 100); y = 50 + Math.random() * (C.height - 100); }
      if (free(x, y, s) && far(x, y, s, 55)) return { x, y };
    }
    return { x: 60 + (i % 5) * 180, y: 80 + Math.floor(i / 5) * 140 }; // cadangan
  }

  U.register({
    id: 'crystal-hunt', name: 'Crystal Hunt', difficulty: 'Mudah', timeRecord: 'min',
    objective: 'Kumpulkan 20 kristal dalam 120 detik.',
    rules: 'Ada rintangan padat. Beberapa kristal dijaga musuh yang baru bergerak saat kamu mendekat.',
    start(s) {
      s.timeLeft = LIMIT; s.collected = 0; s.reinT = 8;
      s.obstacles = OBST.map(o => ({ x: o.x, y: o.y, w: o.w, h: o.h }));
      s.crystals = [];
      for (let i = 0; i < TOTAL; i++) { const c = place(s, i); s.crystals.push({ x: c.x, y: c.y, r: 9 }); }
      for (let i = 0; i < 5; i++) { // penjaga di dekat kristal
        const c = s.crystals[i], a = Math.random() * 6.28;
        const gx = Math.min(C.width - 40, Math.max(40, c.x + Math.cos(a) * 45)), gy = Math.min(C.height - 40, Math.max(40, c.y + Math.sin(a) * 45));
        if (A.Collision.inRects(gx, gy, 14, s.obstacles)) continue;
        A.Enemies.spawn(s.enemies, i % 2 ? 'shooter' : 'chaser', gx, gy, 150);
      }
    },
    hud(s) { return 'Kristal ' + s.collected + '/' + TOTAL + ' · ' + U.fmtTime(s.timeLeft); },
    endTitle(s, result) { return result === 'lose' && s.timeLeft <= 0 ? 'Waktu habis' : null; },
    update(s, dt) {
      s.timeLeft -= dt;
      for (const c of s.crystals) {
        if (c.taken || !A.Collision.circleHit(c, s.player)) continue;
        c.taken = true; s.collected++; A.Scoring.add(s, 100);
      }
      if (s.collected >= TOTAL) { A.Scoring.add(s, s.timeLeft * 5); return 'win'; }
      if (s.timeLeft <= 0) { s.timeLeft = 0; return 'lose'; }
      s.reinT -= dt;
      if (s.reinT <= 0) { s.reinT = 8; if (s.enemies.length < 10) A.Enemies.spawnAtEdge(s.enemies, 'chaser', s.player); }
      return null;
    }
  });
})(window.Arena);
