(function (A) {
  const C = A.CONFIG;
  // Menjaga lingkaran tetap di dalam arena. Mengembalikan sisi yang disentuh.
  function clampToArena(e) {
    const min = C.wall + e.r, hit = { x: false, y: false };
    const maxX = C.width - min, maxY = C.height - min;
    if (e.x < min) { e.x = min; hit.x = true; } else if (e.x > maxX) { e.x = maxX; hit.x = true; }
    if (e.y < min) { e.y = min; hit.y = true; } else if (e.y > maxY) { e.y = maxY; hit.y = true; }
    return hit;
  }
  A.Collision = { clampToArena };
})(window.Arena);
