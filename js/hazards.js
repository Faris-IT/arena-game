// Bahaya arena: beam (garis), blast (area), tile (lantai). Dipakai Boss Rush dan Hazard Lab.
// Bahaya selalu menampilkan peringatan sebelum aktif. Satu kali (warn+dur) atau siklus (cyc).
(function (A) {
  const TAU = Math.PI * 2;

  function add(s, h) { h.t = 0; h.ox = 0; h.oy = 0; h.state = 'idle'; s.hazards.push(h); return h; }

  function segDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
  }

  function stateOf(h) {
    if (h.cyc) {
      const c = (((h.t + h.cyc.phase) % h.cyc.period) + h.cyc.period) % h.cyc.period;
      if (c < h.cyc.on) return 'on';
      return c >= h.cyc.period - h.warn ? 'warn' : 'idle';
    }
    if (h.t < h.warn) return 'warn';
    return h.t < h.warn + h.dur ? 'on' : 'dead';
  }

  function hits(h, p) {
    const R = p.r * 0.7;
    if (h.k === 'beam') return segDist(p.x, p.y, h.x1 + h.ox, h.y1 + h.oy, h.x2 + h.ox, h.y2 + h.oy) < h.w / 2 + R;
    if (h.k === 'blast') return Math.hypot(p.x - h.x, p.y - h.y) < h.r + R * 0.5;
    return p.x > h.x - R && p.x < h.x + h.w + R && p.y > h.y - R && p.y < h.y + h.h + R;
  }

  function update(s, dt) {
    for (const h of s.hazards) {
      h.t += dt;
      if (h.osc) { const o = Math.sin(h.t * h.osc.spd) * h.osc.amp; h.ox = h.osc.ax === 'x' ? o : 0; h.oy = h.osc.ax === 'y' ? o : 0; }
      h.state = stateOf(h);
      if (h.state === 'on' && hits(h, s.player)) A.Player.damage(s.player, h.dmg);
    }
    let n = 0;
    for (const h of s.hazards) if (h.state !== 'dead') s.hazards[n++] = h;
    s.hazards.length = n;
  }

  function draw(ctx, s) {
    const fl = 0.55 + 0.45 * Math.sin(performance.now() / 70);
    for (const h of s.hazards) {
      if (h.k === 'beam') {
        const x1 = h.x1 + h.ox, y1 = h.y1 + h.oy, x2 = h.x2 + h.ox, y2 = h.y2 + h.oy;
        if (h.state === 'on') { ctx.strokeStyle = 'rgba(255,70,90,.95)'; ctx.lineWidth = h.w; }
        else if (h.state === 'warn') { ctx.strokeStyle = 'rgba(255,70,90,' + (0.35 + 0.35 * fl) + ')'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); }
        else if (h.cyc) { ctx.strokeStyle = 'rgba(255,70,90,.14)'; ctx.lineWidth = 2; }
        else continue;
        ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
      } else if (h.k === 'blast') {
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU);
        if (h.state === 'on') { ctx.fillStyle = 'rgba(255,70,90,.6)'; ctx.fill(); }
        else { ctx.fillStyle = 'rgba(255,70,90,' + (0.05 + 0.2 * Math.min(1, h.t / h.warn)) + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(255,70,90,.7)'; ctx.lineWidth = 2; ctx.stroke(); }
      } else {
        if (h.state === 'on') { ctx.fillStyle = 'rgba(255,70,90,.55)'; ctx.fillRect(h.x, h.y, h.w, h.h); }
        else if (h.state === 'warn') { ctx.fillStyle = 'rgba(255,154,60,' + (0.15 + 0.25 * fl) + ')'; ctx.fillRect(h.x, h.y, h.w, h.h); }
        else { ctx.strokeStyle = 'rgba(255,154,60,.22)'; ctx.lineWidth = 1; ctx.strokeRect(h.x, h.y, h.w, h.h); }
      }
    }
  }

  A.Hazards = { add, update, draw };
})(window.Arena);
