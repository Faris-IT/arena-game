(function (A) {
  const U = A.Util, TAU = Math.PI * 2;
  const ZR = 62, CAP = 4, GRACE = 15, HOLD = 20, LIMIT = 180;
  const POS = [{ x: 210, y: 150 }, { x: 750, y: 150 }, { x: 480, y: 455 }];

  U.register({
    id: 'zone-control', name: 'Zone Control', difficulty: 'Sedang', timeRecord: 'min',
    objective: 'Kuasai 3 zona lalu pertahankan kendali total selama 20 detik.',
    rules: 'Berdiri di zona 4 detik untuk menguasainya. Musuh di dalam zona menghentikan proses. Zona ditinggalkan 15 detik kembali netral. Batas waktu 180 detik.',
    start(s) {
      s.timeLeft = LIMIT; s.hold = 0; s.owned = 0; s.spawnT = 2; s.healT = 35;
      s.zones = POS.map(z => ({ x: z.x, y: z.y, r: ZR, p: 0, owned: false, away: 0, contested: false, inside: false }));
    },
    hud(s) {
      return 'Zona ' + s.owned + '/3' + (s.owned === 3 ? ' · Tahan ' + Math.ceil(HOLD - s.hold) + 's' : '') + ' · ' + U.fmtTime(s.timeLeft);
    },
    endTitle(s, result) { return result === 'lose' && s.timeLeft <= 0 ? 'Waktu habis' : null; },
    drawBelow(ctx, s) {
      for (const z of s.zones) {
        const col = z.owned ? '77,255,154' : z.contested ? '255,154,60' : '34,228,255';
        ctx.fillStyle = 'rgba(' + col + ',' + (z.owned ? 0.16 : 0.08) + ')';
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(' + col + ',.35)'; ctx.lineWidth = 2; ctx.stroke();
        const frac = z.owned ? 1 - z.away / GRACE : z.p;
        if (frac > 0) {
          ctx.strokeStyle = z.owned && z.away > 10 ? '#ff9a3c' : 'rgb(' + col + ')'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 7, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke();
        }
      }
    },
    update(s, dt) {
      s.timeLeft -= dt;
      let owned = 0;
      for (const z of s.zones) {
        z.inside = Math.hypot(s.player.x - z.x, s.player.y - z.y) < z.r;
        z.contested = s.enemies.some(e => e.d.damage > 0 && Math.hypot(e.x - z.x, e.y - z.y) < z.r);
        if (z.owned) {
          if (z.inside) z.away = 0;
          else { z.away += dt; if (z.away >= GRACE) { z.owned = false; z.p = 0; z.away = 0; } }
        } else if (z.inside) {
          if (!z.contested) { z.p = Math.min(1, z.p + dt / CAP); if (z.p >= 1) { z.owned = true; z.away = 0; A.Scoring.add(s, 150); } }
        } else z.p = Math.max(0, z.p - dt / 10);
        if (z.owned) owned++;
      }
      s.owned = owned;
      if (owned === 3) { s.hold += dt; if (s.hold >= HOLD) { A.Scoring.add(s, s.timeLeft * 3); return 'win'; } } else s.hold = 0;
      if (s.timeLeft <= 0) { s.timeLeft = 0; return 'lose'; }

      const el = LIMIT - s.timeLeft;
      s.spawnT -= dt;
      if (s.spawnT <= 0 && s.enemies.length < 12) {
        const r = Math.random();
        A.Enemies.spawnAtEdge(s.enemies, el > 90 && r < 0.12 ? 'tank' : el > 60 && r < 0.28 ? 'dasher' : el > 25 && r < 0.5 ? 'shooter' : 'chaser', s.player);
        s.spawnT = Math.max(1.1, 2.4 - el / LIMIT * 1.3);
      }
      s.healT -= dt;
      if (s.healT <= 0) { s.healT = 35; if (!s.items.length) A.Items.spawnHeal(s, 25, 12); }
      return null;
    }
  });
})(window.Arena);
