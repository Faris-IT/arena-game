(function (A) {
  const U = A.Util, C = A.CONFIG, TAU = Math.PI * 2;
  const LEVELS = [420, 330, 250, 185, 135, 95], STEP = 20, ANIM = 4, TICK = 0.5, TICK_DMG = 4;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function planNext(r) { // lingkaran berikutnya selalu berada di dalam lingkaran sekarang
    const nr = LEVELS[r.lvl + 1], a = Math.random() * TAU, off = (r.r - nr) * 0.7 * Math.random();
    r.next = { x: clamp(r.x + Math.cos(a) * off, 60, C.width - 60), y: clamp(r.y + Math.sin(a) * off, 60, C.height - 60), r: nr };
  }

  U.register({
    id: 'closing-ring', name: 'Closing Ring', difficulty: 'Sulit', timeRecord: 'min',
    objective: 'Bertahan di zona aman yang menyempit lalu selesaikan gelombang terakhir.',
    rules: 'Zona aman menyempit tiap 20 detik. Di luar zona kamu menerima damage berkala. Musuh terus menyerang.',
    start(s) {
      s.ring = { x: C.width / 2, y: C.height / 2, r: LEVELS[0], lvl: 0, shrinking: false, from: null, k: 0, next: null };
      planNext(s.ring);
      s.nextT = STEP; s.final = false; s.dmgT = 0.25; s.healT = 28;
      s.pending = U.composition(2, 0.9); s.spawnCd = 1;
    },
    hud(s) {
      const r = s.ring;
      if (s.final) return 'Gelombang terakhir · ' + (s.enemies.length + s.pending.length) + ' musuh';
      return 'Zona ' + (r.lvl + 1) + '/' + LEVELS.length + ' · ' + (r.shrinking ? 'Menyempit!' : Math.ceil(s.nextT) + 's');
    },
    drawBelow(ctx, s) {
      const r = s.ring;
      ctx.fillStyle = 'rgba(255,61,242,.16)';
      ctx.beginPath(); ctx.rect(0, 0, C.width, C.height); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.fill('evenodd');
      ctx.strokeStyle = '#22e4ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
      if (r.next) {
        ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.arc(r.next.x, r.next.y, r.next.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
    },
    update(s, dt) {
      const r = s.ring, p = s.player;
      U.tick(s, dt);
      if (r.shrinking) { // animasi penyempitan
        r.k = Math.min(1, r.k + dt / ANIM);
        const e = r.k * r.k * (3 - 2 * r.k);
        r.x = r.from.x + (r.target.x - r.from.x) * e; r.y = r.from.y + (r.target.y - r.from.y) * e; r.r = r.from.r + (r.target.r - r.from.r) * e;
        if (r.k >= 1) {
          r.shrinking = false; A.Scoring.add(s, 100);
          if (r.lvl < LEVELS.length - 1) { planNext(r); s.nextT = STEP; }
          else { r.next = null; s.final = true; s.pending = s.pending.concat(U.composition(9, 1.1)); }
        }
      } else if (!s.final) {
        s.nextT -= dt;
        if (s.nextT <= 0) {
          r.from = { x: r.x, y: r.y, r: r.r }; r.target = r.next; r.lvl++; r.k = 0; r.shrinking = true;
          s.pending = s.pending.concat(U.composition(2 + r.lvl, 0.9)); // gelombang baru tiap penyempitan
        }
      }
      // Damage berkala di luar zona aman (tidak memakai jeda kebal)
      if (Math.hypot(p.x - r.x, p.y - r.y) > r.r) {
        s.dmgT -= dt;
        if (s.dmgT <= 0) { p.stats.health = Math.max(0, p.stats.health - TICK_DMG); s.dmgT = TICK; }
      } else s.dmgT = 0.25;

      s.healT -= dt;
      if (s.healT <= 0) {
        s.healT = 28;
        if (!s.items.length) { const a = Math.random() * TAU, d = r.r * 0.6 * Math.random(); A.Items.spawnHeal(s, 25, 12, r.x + Math.cos(a) * d, r.y + Math.sin(a) * d); }
      }
      if (s.final && !r.shrinking && !s.pending.length && !s.enemies.length) { A.Scoring.add(s, p.stats.health * 2); return 'win'; }
      return null;
    }
  });
})(window.Arena);
