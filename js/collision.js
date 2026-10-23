(function (A) {
  const C = A.CONFIG;
  function clampToArena(e) {
    const min = C.wall + e.r, hit = { x: false, y: false };
    const maxX = C.width - min, maxY = C.height - min;
    if (e.x < min) { e.x = min; hit.x = true; } else if (e.x > maxX) { e.x = maxX; hit.x = true; }
    if (e.y < min) { e.y = min; hit.y = true; } else if (e.y > maxY) { e.y = maxY; hit.y = true; }
    return hit;
  }
  function circleHit(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r;
    return dx * dx + dy * dy < r * r;
  }
  // Mendorong lingkaran keluar dari penghalang padat. Mengembalikan normal tabrakan terakhir atau null.
  function pushOut(e, rects) {
    let hit = null;
    for (const o of rects) {
      const cx = Math.max(o.x, Math.min(e.x, o.x + o.w)), cy = Math.max(o.y, Math.min(e.y, o.y + o.h));
      const dx = e.x - cx, dy = e.y - cy, d2 = dx * dx + dy * dy;
      if (d2 >= e.r * e.r) continue;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2); hit = { x: dx / d, y: dy / d };
        e.x = cx + hit.x * e.r; e.y = cy + hit.y * e.r;
      } else { // pusat berada di dalam penghalang
        const l = e.x - o.x, r = o.x + o.w - e.x, t = e.y - o.y, b = o.y + o.h - e.y, m = Math.min(l, r, t, b);
        if (m === l) { e.x = o.x - e.r; hit = { x: -1, y: 0 }; }
        else if (m === r) { e.x = o.x + o.w + e.r; hit = { x: 1, y: 0 }; }
        else if (m === t) { e.y = o.y - e.r; hit = { x: 0, y: -1 }; }
        else { e.y = o.y + o.h + e.r; hit = { x: 0, y: 1 }; }
      }
    }
    return hit;
  }
  function inRects(x, y, r, rects) {
    for (const o of rects) if (x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r) return true;
    return false;
  }
  // Apakah garis pandang antara dua titik terhalang penghalang padat?
  function segBlocked(x1, y1, x2, y2, rects) {
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(d / 8));
    for (let i = 1; i < n; i++) if (inRects(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n, 0, rects)) return true;
    return false;
  }
  A.Collision = { clampToArena, circleHit, pushOut, inRects, segBlocked };
})(window.Arena);
