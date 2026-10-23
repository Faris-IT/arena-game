(function (A) {
  const U = A.Util, TAU = Math.PI * 2;
  const T = (x, y, w, h, per, on, ph) => ({ k: 'tile', x, y, w, h, dmg: 15, warn: 0.7, cyc: { period: per, on, phase: ph || 0 } });
  const Z = (x1, y1, x2, y2, per, on, ph, osc) => ({ k: 'beam', x1, y1, x2, y2, w: 16, dmg: 20, warn: 0.7, cyc: { period: per, on, phase: ph || 0 }, osc });
  const W = (x, y, w, h) => [x, y, w, h];
  const ZZ = [W(200, 0, 24, 440), W(380, 160, 24, 440), W(560, 0, 24, 440), W(740, 160, 24, 440)];
  const ZT = [T(190, 440, 44, 160, 3, 1.3, 0), T(370, 0, 44, 160, 3, 1.3, 1.5), T(550, 440, 44, 160, 3, 1.3, 0), T(730, 0, 44, 160, 3, 1.3, 1.5)];
  const EXIT = { x: 905, y: 300, r: 26 };

  // 10 level: lantai aktif, laser, sakelar dan pintu. Pola selalu diberi peringatan sebelum berbahaya.
  const LV = [
    { name: 'Lantai aktif', limit: 60, haz: [T(300, 0, 70, 600, 3.2, 1.4, 0), T(600, 0, 70, 600, 3.2, 1.4, 1.6)] },
    { name: 'Garis laser', limit: 70, haz: [Z(300, 0, 300, 600, 3, 1, 0), Z(480, 0, 480, 600, 3, 1, 1), Z(660, 0, 660, 600, 3, 1, 2)] },
    { name: 'Gelombang lantai', limit: 70, haz: [250, 380, 510, 640, 770].map((x, i) => T(x, 0, 60, 600, 4, 1.3, i * 0.8)) },
    { name: 'Sakelar pertama', limit: 90, obst: [W(480, 0, 24, 260), W(480, 340, 24, 260)], doors: [W(480, 260, 24, 80)], sw: [{ x: 300, y: 100, door: 0 }],
      haz: [T(0, 170, 480, 40, 2.6, 1.2, 0), Z(700, 0, 700, 600, 3, 1, 0.5)] },
    { name: 'Laser bergoyang', limit: 80, haz: [Z(0, 200, 960, 200, 3, 1.2, 0, { ax: 'y', amp: 110, spd: 1.1 }), Z(0, 400, 960, 400, 3, 1.2, 1.5, { ax: 'y', amp: 110, spd: 1.1 }), T(740, 0, 70, 600, 3, 1.2, 0)] },
    { name: 'Lorong zigzag', limit: 90, obst: ZZ, haz: ZT },
    { name: 'Dua sakelar', limit: 100, obst: [W(320, 0, 24, 250), W(320, 350, 24, 250), W(640, 0, 24, 250), W(640, 350, 24, 250)],
      doors: [W(320, 250, 24, 100), W(640, 250, 24, 100)], sw: [{ x: 150, y: 100, door: 0 }, { x: 480, y: 520, door: 1 }],
      haz: [Z(430, 0, 430, 600, 3, 1, 0), T(140, 380, 160, 50, 2.8, 1.2, 0)] },
    { name: 'Medan campuran', limit: 90, haz: [Z(0, 200, 960, 200, 3, 1.2, 0, { ax: 'y', amp: 100, spd: 1 }), Z(0, 400, 960, 400, 3, 1.2, 1.5, { ax: 'y', amp: 100, spd: 1 }),
      T(330, 0, 60, 600, 2.8, 1.2, 0), T(600, 0, 60, 600, 2.8, 1.2, 1.4)] },
    { name: 'Brankas', limit: 110, obst: [W(480, 0, 24, 270), W(480, 330, 24, 270)], doors: [W(480, 270, 24, 60)], sw: [{ x: 300, y: 90, door: 0 }],
      haz: [Z(300, 0, 300, 300, 3, 1, 0, { ax: 'x', amp: 70, spd: 1.2 }), T(780, 0, 60, 600, 3, 1.3, 0), T(130, 420, 200, 50, 2.6, 1.1, 0.8)] },
    { name: 'Uji akhir', limit: 130, obst: [W(200, 0, 24, 440), W(380, 160, 24, 440), W(560, 0, 24, 440), W(740, 0, 24, 270), W(740, 330, 24, 270)],
      doors: [W(740, 270, 24, 60)], sw: [{ x: 470, y: 500, door: 0 }],
      haz: [T(190, 440, 44, 160, 3, 1.3, 0), T(370, 0, 44, 160, 3, 1.3, 1.5), T(550, 440, 44, 160, 3, 1.3, 0),
            Z(650, 0, 650, 600, 3, 1, 0.5, { ax: 'x', amp: 50, spd: 1 }), T(840, 0, 60, 600, 3, 1.3, 1)] }
  ];

  U.register({
    id: 'hazard-lab', name: 'Hazard Lab', difficulty: 'Sedang', timeRecord: 'min', noShoot: true, levels: LV,
    allowedAbilities: ['dash', 'shield', 'heal'],
    objective: 'Capai pintu keluar di 10 level penuh jebakan.',
    rules: 'Lantai aktif bergantian, laser dengan tanda peringatan, serta sakelar yang membuka pintu. Pelajari polanya lalu rencanakan gerakan. Tidak ada senjata.',
    start(s) {
      const L = LV[s.level]; s.L = L; s.timeLeft = L.limit; s.player.x = 50; s.player.y = 300;
      s.obstacles = (L.obst || []).map(o => ({ x: o[0], y: o[1], w: o[2], h: o[3] }));
      s.doors = (L.doors || []).map(o => { const d = { x: o[0], y: o[1], w: o[2], h: o[3], door: true }; s.obstacles.push(d); return d; });
      s.switches = (L.sw || []).map(w => ({ x: w.x, y: w.y, r: 16, door: w.door, on: false }));
      s.hazards = [];
      for (const h of L.haz) A.Hazards.add(s, JSON.parse(JSON.stringify(h)));
    },
    hud(s) { return U.fmtTime(s.timeLeft) + (s.switches.length ? ' · Sakelar ' + s.switches.filter(w => w.on).length + '/' + s.switches.length : ''); },
    endTitle(s, result) { return result === 'lose' && s.timeLeft <= 0 ? 'Waktu habis' : null; },
    drawBelow(ctx, s) {
      ctx.fillStyle = 'rgba(77,255,154,.14)'; ctx.strokeStyle = '#4dff9a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(EXIT.x, EXIT.y, EXIT.r, 0, TAU); ctx.fill(); ctx.stroke();
      for (const w of s.switches) {
        ctx.fillStyle = w.on ? 'rgba(77,255,154,.5)' : 'rgba(255,61,242,.35)'; ctx.strokeStyle = w.on ? '#4dff9a' : '#ff3df2'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, TAU); ctx.fill(); ctx.stroke();
      }
    },
    update(s, dt) {
      s.timeLeft -= dt;
      const p = s.player;
      for (const w of s.switches) {
        if (w.on || Math.hypot(p.x - w.x, p.y - w.y) > w.r + p.r) continue;
        w.on = true; A.Scoring.add(s, 50);
        const i = s.obstacles.indexOf(s.doors[w.door]); if (i >= 0) s.obstacles.splice(i, 1); // pintu terbuka
      }
      if (Math.hypot(p.x - EXIT.x, p.y - EXIT.y) < EXIT.r + p.r) { A.Scoring.add(s, 300 + s.timeLeft * 5 + p.stats.health * 2); return 'win'; }
      if (s.timeLeft <= 0) { s.timeLeft = 0; return 'lose'; }
      return null;
    }
  });
})(window.Arena);
