(function (A) {
  const U = A.Util, TAU = Math.PI * 2;
  const PATH = [{ x: 70, y: 300 }, { x: 290, y: 180 }, { x: 500, y: 420 }, { x: 720, y: 200 }, { x: 895, y: 300 }];
  const NEAR = 120, SPEED = 40, CORE_HP = 100;
  let total = 0;
  for (let i = 1; i < PATH.length; i++) total += Math.hypot(PATH[i].x - PATH[i - 1].x, PATH[i].y - PATH[i - 1].y);

  U.register({
    id: 'core-escort', name: 'Core Escort', difficulty: 'Sulit', timeRecord: 'min',
    objective: 'Antar inti energi ke titik keluar.',
    rules: 'Inti hanya bergerak saat kamu berada dekat dengannya. Musuh juga menyerang inti. Inti hancur berarti kalah.',
    start(s) {
      s.core = { x: PATH[0].x, y: PATH[0].y, r: 16, hp: CORE_HP, maxHp: CORE_HP, flash: 0, wp: 1, moving: false };
      s.player.x = 120; s.player.y = 300; s.travel = 0; s.spawnT = 2.5; s.healT = 25;
    },
    hud(s) { return 'Inti ' + Math.max(0, Math.round(s.core.hp)) + '% · Jarak ' + Math.round(s.travel / total * 100) + '%'; },
    endTitle(s, result) { return result === 'lose' && s.core.hp <= 0 ? 'Inti hancur' : null; },
    drawBelow(ctx, s) {
      ctx.strokeStyle = 'rgba(255,210,60,.25)'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
      ctx.beginPath(); PATH.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); ctx.setLineDash([]);
      const e = PATH[PATH.length - 1];
      ctx.fillStyle = 'rgba(77,255,154,.14)'; ctx.strokeStyle = '#4dff9a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(e.x, e.y, 28, 0, TAU); ctx.fill(); ctx.stroke();
      const c = s.core;
      ctx.strokeStyle = c.moving ? 'rgba(255,210,60,.55)' : 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, NEAR, 0, TAU); ctx.stroke();
    },
    drawAbove(ctx, s) {
      const c = s.core; if (c.hp <= 0) return;
      ctx.fillStyle = c.flash > 0 ? '#fff' : '#ffd23c';
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1405'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 0.45, 0, TAU); ctx.fill();
      const w = 40; ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(c.x - w / 2, c.y - c.r - 12, w, 5);
      ctx.fillStyle = c.hp > 35 ? '#4dff9a' : '#ff5d5d'; ctx.fillRect(c.x - w / 2, c.y - c.r - 12, w * Math.max(0, c.hp / c.maxHp), 5);
    },
    update(s, dt) {
      const c = s.core, p = s.player;
      if (c.flash > 0) c.flash -= dt;
      if (c.hp <= 0) return 'lose';
      c.moving = Math.hypot(p.x - c.x, p.y - c.y) < NEAR;
      if (c.moving) {
        const w = PATH[c.wp], dx = w.x - c.x, dy = w.y - c.y, l = Math.hypot(dx, dy), step = SPEED * dt;
        if (l <= step) {
          c.x = w.x; c.y = w.y; s.travel += l; A.Scoring.add(s, 100);
          if (c.wp >= PATH.length - 1) { A.Scoring.add(s, 500 + c.hp * 5); return 'win'; }
          c.wp++;
        } else { c.x += dx / l * step; c.y += dy / l * step; s.travel += step; }
      }
      const pr = s.travel / total;
      s.spawnT -= dt;
      if (s.spawnT <= 0 && s.enemies.length < 12) {
        const r = Math.random();
        A.Enemies.spawnAtEdge(s.enemies, pr > 0.6 && r < 0.1 ? 'tank' : pr > 0.45 && r < 0.28 ? 'dasher' : pr > 0.2 && r < 0.5 ? 'shooter' : 'chaser', s.player);
        if (Math.random() < 0.55) s.enemies[s.enemies.length - 1].tgt = c; // sebagian musuh mengincar inti
        s.spawnT = Math.max(1.0, 2.6 - pr * 1.4);
      }
      s.healT -= dt;
      if (s.healT <= 0) { s.healT = 25; if (!s.items.length) A.Items.spawnHeal(s, 25, 12); }
      return null;
    }
  });
})(window.Arena);
