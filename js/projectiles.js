(function (A) {
  const C = A.CONFIG;

  function spawn(list, o) {
    if (list.length >= C.combat.maxProjectiles) return; // batas jumlah proyektil
    list.push({ x: o.x, y: o.y, vx: o.vx, vy: o.vy, r: o.r, damage: o.damage, life: o.life, from: o.from, color: o.color, dead: false });
  }

  function update(s, dt) {
    const list = s.projectiles;
    for (const b of list) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < C.wall || b.x > C.width - C.wall || b.y < C.wall || b.y > C.height - C.wall) { b.dead = true; continue; }
      if (b.from === 'player') {
        for (const e of s.enemies) {
          if (e.dead || !A.Collision.circleHit(b, e)) continue;
          e.hp -= b.damage; e.flash = 0.08; b.dead = true;
          if (e.hp <= 0) { e.dead = true; s.kills++; s.score += e.d.score; }
          break; // satu proyektil hanya mengenai satu musuh
        }
      } else if (A.Collision.circleHit(b, s.player)) {
        if (A.Player.damage(s.player, b.damage)) b.dead = true;
      }
    }
    let n = 0;
    for (const b of list) if (!b.dead) list[n++] = b;
    list.length = n;
  }

  A.Projectiles = { spawn, update };
})(window.Arena);
