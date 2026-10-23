(function (A) {
  const C = A.CONFIG, COL = C.colors, TAU = Math.PI * 2;
  let canvas, ctx;

  function resize() {
    const s = Math.min(innerWidth / C.width, innerHeight / C.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = C.width * s + 'px';
    canvas.style.height = C.height * s + 'px';
    canvas.width = Math.round(C.width * s * dpr);
    canvas.height = Math.round(C.height * s * dpr);
    ctx.setTransform(canvas.width / C.width, 0, 0, canvas.height / C.height, 0, 0);
  }

  function polygon(x, y, r, sides, rot) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = rot + i * TAU / sides;
      i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }

  function drawArena() {
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, C.width, C.height);
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 40; x < C.width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, C.height); }
    for (let y = 40; y < C.height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(C.width, y); }
    ctx.stroke();
    ctx.strokeStyle = COL.wall; ctx.lineWidth = C.wall;
    ctx.strokeRect(C.wall / 2, C.wall / 2, C.width - C.wall, C.height - C.wall);
  }

  function drawEnemy(e) {
    // Indikator serangan Dasher muncul sebelum damage terjadi
    if (e.state === 'windup') {
      ctx.strokeStyle = 'rgba(255,210,60,' + (0.25 + 0.5 * (1 - e.st / e.d.windup)) + ')';
      ctx.lineWidth = e.r * 1.4;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.dx * 320, e.y + e.dy * 320); ctx.stroke();
    }
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.d.color;
    if (e.d.sides === 0) { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); }
    else polygon(e.x, e.y, e.r * (e.d.sides === 4 ? 1.25 : 1.1), e.d.sides, e.type === 'dasher' ? e.aim : Math.PI / 4);
    ctx.fill();
    if (e.hp < e.maxHp) { // bar health kecil
      const w = e.r * 2;
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 3);
      ctx.fillStyle = '#4dff9a'; ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * Math.max(0, e.hp / e.maxHp), 3);
    }
  }

  function drawPlayer(p) {
    p.trail.forEach((t, i) => {
      ctx.globalAlpha = (i + 1) / p.trail.length * 0.25;
      ctx.fillStyle = COL.player;
      ctx.beginPath(); ctx.arc(t.x, t.y, p.r * (0.5 + i / 16), 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = (p.invuln > 0 && Math.floor(p.invuln * 20) % 2) ? 0.35 : 1; // berkedip saat kebal
    ctx.fillStyle = COL.player;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.aim);
    ctx.fillStyle = COL.aim;
    ctx.beginPath(); ctx.moveTo(p.r + 12, 0); ctx.lineTo(p.r + 2, -6); ctx.lineTo(p.r + 2, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  A.Renderer = {
    init(cv) { canvas = cv; ctx = cv.getContext('2d'); resize(); addEventListener('resize', resize); },
    draw(s) {
      drawArena();
      s.enemies.forEach(drawEnemy);
      for (const b of s.projectiles) { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); }
      drawPlayer(s.player);
    }
  };
})(window.Arena);
