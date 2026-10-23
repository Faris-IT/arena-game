(function (A) {
  const U = A.Util, TAU = Math.PI * 2;
  // Tiap level mengubah tata letak, ukuran zona, waktu tangkap/tahan, waktu, dan tekanan musuh.
  const LV = [
    { name: 'Pemanasan', desc: 'Zona besar dan musuh sedikit.', r: 70, cap: 3, grace: 18, hold: 12, limit: 150, spawn: 0.6,
      zones: [[200, 150], [760, 150], [480, 450]], obst: [] },
    { name: 'Tiga titik', desc: 'Aturan standar.', r: 62, cap: 4, grace: 15, hold: 20, limit: 180, spawn: 1,
      zones: [[210, 150], [750, 150], [480, 455]], obst: [] },
    { name: 'Terhalang', desc: 'Tembok membelah arena.', r: 60, cap: 4, grace: 15, hold: 20, limit: 180, spawn: 1,
      zones: [[170, 120], [790, 120], [480, 480]], obst: [[300, 200, 24, 200], [636, 200, 24, 200], [420, 60, 120, 24]] },
    { name: 'Zona sempit', desc: 'Zona kecil, zona cepat kembali netral.', r: 48, cap: 4, grace: 12, hold: 25, limit: 200, spawn: 1.2,
      zones: [[130, 300], [830, 300], [480, 110]], obst: [[300, 100, 24, 150], [636, 350, 24, 150], [420, 420, 120, 24]] },
    { name: 'Penguasa arena', desc: 'Zona kecil, tahan lama, musuh agresif.', r: 44, cap: 5, grace: 10, hold: 30, limit: 220, spawn: 1.5,
      zones: [[150, 130], [810, 130], [480, 480]], obst: [[250, 250, 140, 24], [570, 250, 140, 24], [466, 330, 24, 100]] }
  ];

  U.register({
    id: 'zone-control', name: 'Zone Control', difficulty: 'Sedang', timeRecord: 'min', levels: LV,
    objective: 'Kuasai 3 zona lalu pertahankan kendali total.',
    rules: '5 level dengan tata letak, ukuran zona, waktu tahan, dan tekanan musuh berbeda. Musuh di dalam zona menghentikan proses.',
    start(s) {
      const L = LV[s.level]; s.L = L; s.timeLeft = L.limit; s.hold = 0; s.owned = 0; s.spawnT = 2; s.healT = 35;
      s.obstacles = L.obst.map(o => ({ x: o[0], y: o[1], w: o[2], h: o[3] }));
      s.zones = L.zones.map(z => ({ x: z[0], y: z[1], r: L.r, p: 0, owned: false, away: 0, contested: false, inside: false }));
    },
    hud(s) { return 'Zona ' + s.owned + '/3' + (s.owned === 3 ? ' · Tahan ' + Math.ceil(s.L.hold - s.hold) + 's' : '') + ' · ' + U.fmtTime(s.timeLeft); },
    endTitle(s, result) { return result === 'lose' && s.timeLeft <= 0 ? 'Waktu habis' : null; },
    drawBelow(ctx, s) {
      for (const z of s.zones) {
        const col = z.owned ? '77,255,154' : z.contested ? '255,154,60' : '34,228,255';
        ctx.fillStyle = 'rgba(' + col + ',' + (z.owned ? 0.16 : 0.08) + ')';
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(' + col + ',.35)'; ctx.lineWidth = 2; ctx.stroke();
        const frac = z.owned ? 1 - z.away / s.L.grace : z.p;
        if (frac > 0) {
          ctx.strokeStyle = z.owned && z.away > s.L.grace * 0.66 ? '#ff9a3c' : 'rgb(' + col + ')'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 7, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke();
        }
      }
    },
    update(s, dt) {
      const L = s.L;
      s.timeLeft -= dt;
      let owned = 0;
      for (const z of s.zones) {
        z.inside = Math.hypot(s.player.x - z.x, s.player.y - z.y) < z.r;
        z.contested = s.enemies.some(e => e.d.damage > 0 && Math.hypot(e.x - z.x, e.y - z.y) < z.r);
        if (z.owned) {
          if (z.inside) z.away = 0;
          else { z.away += dt; if (z.away >= L.grace) { z.owned = false; z.p = 0; z.away = 0; } }
        } else if (z.inside) {
          if (!z.contested) { z.p = Math.min(1, z.p + dt / L.cap); if (z.p >= 1) { z.owned = true; z.away = 0; A.Scoring.add(s, 150); } }
        } else z.p = Math.max(0, z.p - dt / 10);
        if (z.owned) owned++;
      }
      s.owned = owned;
      if (owned === 3) { s.hold += dt; if (s.hold >= L.hold) { A.Scoring.add(s, s.timeLeft * 3); return 'win'; } } else s.hold = 0;
      if (s.timeLeft <= 0) { s.timeLeft = 0; return 'lose'; }

      const el = L.limit - s.timeLeft;
      s.spawnT -= dt;
      if (s.spawnT <= 0 && s.enemies.length < Math.round(10 * L.spawn) + 2) {
        const r = Math.random();
        A.Enemies.spawnAtEdge(s.enemies, el > 90 && r < 0.12 ? 'tank' : el > 60 && r < 0.28 ? 'dasher' : el > 25 && r < 0.5 ? 'shooter' : 'chaser', s.player);
        s.spawnT = Math.max(0.9, (2.4 - el / L.limit * 1.3) / L.spawn);
      }
      s.healT -= dt;
      if (s.healT <= 0) { s.healT = 35; if (!s.items.length) A.Items.spawnHeal(s, 25, 12); }
      return null;
    }
  });
})(window.Arena);
