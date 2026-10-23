// Partikel ringan dan goyang layar. Dibatasi 220 partikel; opsi "Kurangi efek" memangkasnya.
(function (A) {
  const MAX = 220;
  let ps = [];
  const reduce = () => !!(A.Settings && A.Settings.reduceFx);
  const P = {
    shake: 0,
    burst(x, y, color, n, speed, life) {
      if (reduce()) n = Math.ceil(n * 0.3);
      for (let i = 0; i < n && ps.length < MAX; i++) {
        const a = Math.random() * 6.2832, v = speed * (0.3 + Math.random() * 0.7), l = life * (0.6 + Math.random() * 0.4);
        ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: l, max: l, c: color, r: 1.5 + Math.random() * 2 });
      }
    },
    shakeBy(v) { if (!reduce()) P.shake = Math.max(P.shake, v); },
    update(dt) {
      let n = 0;
      for (const p of ps) {
        p.life -= dt; if (p.life <= 0) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92;
        ps[n++] = p;
      }
      ps.length = n;
      P.shake = Math.max(0, P.shake - dt * 30);
    },
    draw(ctx) {
      for (const p of ps) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
      ctx.globalAlpha = 1;
    },
    clear() { ps = []; P.shake = 0; }
  };
  A.Particles = P;
})(window.Arena);
