(function (A) {
  const C = A.CONFIG;
  function spawnHeal(s, value, life, px, py) {
    if (s.items.length >= 3) return;
    let x = px, y = py;
    if (px == null) for (let i = 0; i < 12; i++) {
      x = 60 + Math.random() * (C.width - 120); y = 60 + Math.random() * (C.height - 120);
      if (!A.Collision.inRects(x, y, 20, s.obstacles)) break;
    }
    s.items.push({ x, y, r: 10, type: 'heal', value, life, max: life });
  }
  function update(s, dt) {
    const p = s.player;
    for (const it of s.items) {
      it.life -= dt;
      if (A.Collision.circleHit(it, p)) { p.stats.health = Math.min(p.stats.maxHealth, p.stats.health + it.value); it.life = 0; }
    }
    let n = 0;
    for (const it of s.items) if (it.life > 0) s.items[n++] = it;
    s.items.length = n;
  }
  A.Items = { spawnHeal, update };
})(window.Arena);
