(function (A) {
  const C = A.CONFIG, COL = C.colors;
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

  function drawArena() {
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, C.width, C.height);
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 40; x < C.width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, C.height); }
    for (let y = 40; y < C.height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(C.width, y); }
    ctx.stroke();
    ctx.strokeStyle = COL.wall; ctx.lineWidth = C.wall;
    ctx.strokeRect(C.wall / 2, C.wall / 2, C.width - C.wall, C.height - C.wall);
  }

  function drawPlayer(p) {
    p.trail.forEach((t, i) => {
      ctx.globalAlpha = (i + 1) / p.trail.length * 0.25;
      ctx.fillStyle = COL.player;
      ctx.beginPath(); ctx.arc(t.x, t.y, p.r * (0.5 + i / 16), 0, 6.2832); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = COL.player;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
    // Penunjuk arah bidik
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.aim);
    ctx.fillStyle = COL.aim;
    ctx.beginPath(); ctx.moveTo(p.r + 12, 0); ctx.lineTo(p.r + 2, -6); ctx.lineTo(p.r + 2, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  A.Renderer = {
    init(cv) { canvas = cv; ctx = cv.getContext('2d'); resize(); addEventListener('resize', resize); },
    draw(state) { drawArena(); drawPlayer(state.player); }
  };
})(window.Arena);
