(function (A) {
  const U = A.Util, C = A.CONFIG, TAU = Math.PI * 2, MAXD = 100;
  const WALLS = [[220, 0, 24, 240], [220, 360, 24, 240], [440, 150, 24, 300], [660, 0, 24, 220], [660, 380, 24, 220]];
  const H = (x, y, r) => ({ x, y, r });
  const P = (x1, y1, x2, y2, speed) => ({ pts: [{ x: x1, y: y1 }, { x: x2, y: y2 }], speed });
  const S = (x, y, base) => ({ sweep: true, x, y, base });
  // Tiap level: tata letak, jumlah penjaga, jangkauan pandang, dan batas waktu berbeda.
  const LV = [
    { name: 'Latihan senyap', desc: 'Dua penjaga lambat dan banyak semak.', limit: 150, sight: 220, range: 200, fov: 0.9,
      obst: [[400, 150, 24, 300]], hide: [H(250, 150, 45), H(250, 450, 45), H(600, 300, 45)], guards: [P(330, 80, 330, 520, 45), P(700, 100, 700, 500, 45)] },
    { name: 'Patroli standar', desc: 'Aturan standar dengan satu penjaga berputar.', limit: 150, sight: 200, range: 230, fov: 1.0,
      obst: WALLS, hide: [H(335, 160, 40), H(335, 450, 40), H(555, 300, 40), H(780, 150, 40), H(780, 450, 40)],
      guards: [P(330, 70, 330, 530, 60), P(560, 50, 560, 550, 70), P(735, 300, 870, 300, 55), S(800, 110, Math.PI / 2)] },
    { name: 'Dua lorong', desc: 'Celah sempit dijaga patroli.', limit: 150, sight: 200, range: 230, fov: 1.0,
      obst: [[300, 0, 24, 260], [300, 340, 24, 260], [600, 0, 24, 200], [600, 400, 24, 200]],
      hide: [H(180, 150, 40), H(180, 450, 40), H(450, 300, 45), H(780, 150, 40), H(780, 450, 40)],
      guards: [P(450, 60, 450, 540, 70), P(750, 300, 870, 300, 55), P(330, 300, 570, 300, 60), S(780, 80, Math.PI / 2)] },
    { name: 'Menara pengawas', desc: 'Tiga penjaga berputar dan dua patroli.', limit: 140, sight: 190, range: 240, fov: 1.0,
      obst: [[300, 250, 24, 100], [500, 150, 24, 100], [500, 350, 24, 100], [700, 250, 24, 100]],
      hide: [H(200, 120, 40), H(200, 480, 40), H(400, 300, 45), H(600, 150, 40), H(600, 450, 40), H(820, 300, 40)],
      guards: [S(330, 100, Math.PI / 2), S(600, 500, -Math.PI / 2), S(850, 200, Math.PI), P(450, 50, 450, 550, 80), P(700, 100, 700, 500, 65)] },
    { name: 'Senyap total', desc: 'Pandangan sempit, enam penjaga, waktu singkat.', limit: 130, sight: 160, range: 240, fov: 1.05,
      obst: WALLS, hide: [H(335, 160, 36), H(335, 450, 36), H(555, 300, 36), H(780, 300, 36)],
      guards: [P(330, 70, 330, 530, 75), P(560, 50, 560, 550, 85), P(735, 300, 870, 300, 65), P(735, 120, 870, 120, 70), S(800, 110, Math.PI / 2), S(800, 490, -Math.PI / 2)] }
  ];
  const DOOR = { x: 905, y: 300, r: 26 };
  const angDiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };

  function ray(g, a, range, rects) { // sinar pandang berhenti di penghalang
    let d = 0;
    while (d < range) { d += 6; if (A.Collision.inRects(g.x + Math.cos(a) * d, g.y + Math.sin(a) * d, 0, rects)) break; }
    return d;
  }

  U.register({
    id: 'shadow-run', name: 'Shadow Run', difficulty: 'Sulit', timeRecord: 'min', noShoot: true, speedMul: 0.55, levels: LV,
    allowedAbilities: ['dash', 'shield'],
    objective: 'Capai pintu keluar tanpa terdeteksi penuh.',
    rules: '5 level dengan penjaga dan tata letak berbeda. Bergerak lebih pelan, pandangan terbatas, tidak bisa menembak. Sembunyi di semak dan hindari kerucut pandang.',
    start(s) {
      const L = LV[s.level]; s.L = L; s.timeLeft = L.limit; s.detect = 0; s.hidden = false; s.player.x = 50; s.player.y = 300;
      s.obstacles = L.obst.map(o => ({ x: o[0], y: o[1], w: o[2], h: o[3] }));
      s.guards = L.guards.map(g => g.sweep
        ? { x: g.x, y: g.y, r: 13, sweep: true, base: g.base, face: g.base, range: L.range, fov: L.fov, touchCd: 0 }
        : { x: g.pts[0].x, y: g.pts[0].y, r: 13, pts: g.pts, i: 1, speed: g.speed, pause: 0, face: Math.PI / 2, range: L.range, fov: L.fov, touchCd: 0 });
    },
    hud(s) { return 'Deteksi ' + Math.round(s.detect) + '% · ' + U.fmtTime(s.timeLeft); },
    endTitle(s, result) { return result === 'lose' ? (s.detect >= MAXD ? 'Terdeteksi' : s.timeLeft <= 0 ? 'Waktu habis' : null) : null; },
    drawBelow(ctx, s) {
      ctx.fillStyle = 'rgba(77,255,154,.14)'; ctx.strokeStyle = '#4dff9a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(DOOR.x, DOOR.y, DOOR.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(40,120,70,.35)'; ctx.strokeStyle = 'rgba(77,255,154,.4)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      for (const h of s.L.hide) { ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.setLineDash([]);
      for (const g of s.guards) {
        ctx.fillStyle = 'rgba(255,70,70,.18)';
        ctx.beginPath(); ctx.moveTo(g.x, g.y);
        for (let k = 0; k <= 14; k++) { const a = g.face - g.fov / 2 + g.fov * k / 14, d = ray(g, a, g.range, s.obstacles); ctx.lineTo(g.x + Math.cos(a) * d, g.y + Math.sin(a) * d); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a0808'; ctx.beginPath(); ctx.arc(g.x + Math.cos(g.face) * 5, g.y + Math.sin(g.face) * 5, 4, 0, TAU); ctx.fill();
      }
    },
    drawAbove(ctx, s) {
      const p = s.player, sight = s.L.sight, g = ctx.createRadialGradient(p.x, p.y, sight * 0.5, p.x, p.y, sight);
      g.addColorStop(0, 'rgba(5,7,12,0)'); g.addColorStop(1, 'rgba(5,7,12,0.95)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, C.width, C.height);
      const w = 220, x = C.width / 2 - w / 2, y = 14, f = Math.min(1, s.detect / MAXD);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, w, 8);
      ctx.fillStyle = 'hsl(' + Math.round(120 - f * 120) + ',90%,55%)'; ctx.fillRect(x, y, w * f, 8);
      ctx.fillStyle = '#8a97ab'; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DETEKSI', C.width / 2, y + 22);
      if (s.hidden) { ctx.fillStyle = '#4dff9a'; ctx.fillText('Tersembunyi', p.x, p.y - 26); }
    },
    update(s, dt) {
      s.timeLeft -= dt;
      const p = s.player;
      s.hidden = s.L.hide.some(h => Math.hypot(p.x - h.x, p.y - h.y) < h.r);
      let seen = false;
      for (const g of s.guards) {
        if (g.sweep) { g.t = (g.t || 0) + dt; g.face = g.base + Math.sin(g.t * 0.8) * 1.1; }
        else if (g.pause > 0) { g.pause -= dt; g.face += angDiff(Math.atan2(g.pts[g.i].y - g.y, g.pts[g.i].x - g.x), g.face) * Math.min(1, dt * 6); }
        else {
          const t = g.pts[g.i], dx = t.x - g.x, dy = t.y - g.y, l = Math.hypot(dx, dy), st = g.speed * dt;
          g.face += angDiff(Math.atan2(dy, dx), g.face) * Math.min(1, dt * 8);
          if (l <= st) { g.x = t.x; g.y = t.y; g.i = (g.i + 1) % g.pts.length; g.pause = 0.9; } else { g.x += dx / l * st; g.y += dy / l * st; }
        }
        if (g.touchCd > 0) g.touchCd -= dt;
        const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy);
        if (d < g.r + p.r + 4 && g.touchCd <= 0 && p.shieldT <= 0) { s.detect += 35; g.touchCd = 1.5; } // menyentuh penjaga
        if (s.hidden || d > g.range) continue;
        if (Math.abs(angDiff(Math.atan2(dy, dx), g.face)) < g.fov / 2 && !A.Collision.segBlocked(g.x, g.y, p.x, p.y, s.obstacles)) {
          seen = true; s.detect += dt * (26 + 54 * (1 - d / g.range));
        }
      }
      if (!seen) s.detect = Math.max(0, s.detect - dt * 5);
      if (s.detect >= MAXD) { s.detect = MAXD; return 'lose'; }
      if (Math.hypot(p.x - DOOR.x, p.y - DOOR.y) < DOOR.r + p.r) { A.Scoring.add(s, 500 + s.timeLeft * 3 + (MAXD - s.detect) * 3); return 'win'; }
      if (s.timeLeft <= 0) { s.timeLeft = 0; return 'lose'; }
      return null;
    }
  });
})(window.Arena);
