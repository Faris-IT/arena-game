(function (A) {
  const U = A.Util, C = A.CONFIG, TAU = Math.PI * 2;
  const LIMIT = 150, MAXD = 100, SIGHT = 200;
  const OBST = [
    { x: 220, y: 40, w: 24, h: 200 }, { x: 220, y: 360, w: 24, h: 200 },
    { x: 440, y: 150, w: 24, h: 300 },
    { x: 660, y: 40, w: 24, h: 180 }, { x: 660, y: 380, w: 24, h: 180 }
  ];
  const HIDE = [{ x: 335, y: 160, r: 40 }, { x: 335, y: 450, r: 40 }, { x: 555, y: 300, r: 40 }, { x: 780, y: 150, r: 40 }, { x: 780, y: 450, r: 40 }];
  const DOOR = { x: 905, y: 300, r: 26 };
  const GUARDS = [
    { pts: [{ x: 330, y: 70 }, { x: 330, y: 530 }], speed: 60 },
    { pts: [{ x: 560, y: 50 }, { x: 560, y: 550 }], speed: 70 },
    { pts: [{ x: 735, y: 300 }, { x: 870, y: 300 }], speed: 55 },
    { sweep: true, x: 800, y: 110, base: Math.PI / 2 }
  ];
  const angDiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };

  // Sinar pandang berhenti di penghalang (untuk menggambar kerucut pandang).
  function ray(g, a, range, rects) {
    let d = 0;
    while (d < range) { d += 6; if (A.Collision.inRects(g.x + Math.cos(a) * d, g.y + Math.sin(a) * d, 0, rects)) break; }
    return d;
  }

  U.register({
    id: 'shadow-run', name: 'Shadow Run', difficulty: 'Sulit', timeRecord: 'min', noShoot: true, speedMul: 0.55,
    objective: 'Capai pintu keluar tanpa terdeteksi penuh.',
    rules: 'Bergerak lebih pelan, jangkauan pandang terbatas, dan tidak bisa menembak. Hindari kerucut pandang penjaga, sembunyi di semak, jangan menyentuh penjaga. Batas waktu 150 detik.',
    start(s) {
      s.timeLeft = LIMIT; s.detect = 0; s.hidden = false; s.player.x = 50; s.player.y = 300;
      s.obstacles = OBST.map(o => ({ x: o.x, y: o.y, w: o.w, h: o.h }));
      s.guards = GUARDS.map(g => g.sweep
        ? { x: g.x, y: g.y, r: 13, sweep: true, base: g.base, face: g.base, range: 230, fov: 1.0, touchCd: 0 }
        : { x: g.pts[0].x, y: g.pts[0].y, r: 13, pts: g.pts, i: 1, speed: g.speed, pause: 0, face: Math.PI / 2, range: 230, fov: 1.0, touchCd: 0 });
    },
    hud(s) { return 'Deteksi ' + Math.round(s.detect) + '% · ' + U.fmtTime(s.timeLeft); },
    endTitle(s, result) { return result === 'lose' ? (s.detect >= MAXD ? 'Terdeteksi' : s.timeLeft <= 0 ? 'Waktu habis' : null) : null; },
    drawBelow(ctx, s) {
      ctx.fillStyle = 'rgba(77,255,154,.14)'; ctx.strokeStyle = '#4dff9a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(DOOR.x, DOOR.y, DOOR.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(40,120,70,.35)'; ctx.strokeStyle = 'rgba(77,255,154,.4)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      for (const h of HIDE) { ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill(); ctx.stroke(); }
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
      const p = s.player, g = ctx.createRadialGradient(p.x, p.y, SIGHT * 0.5, p.x, p.y, SIGHT);
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
      s.hidden = HIDE.some(h => Math.hypot(p.x - h.x, p.y - h.y) < h.r);
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
        if (d < g.r + p.r + 4 && g.touchCd <= 0) { s.detect += 35; g.touchCd = 1.5; } // menyentuh penjaga
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
