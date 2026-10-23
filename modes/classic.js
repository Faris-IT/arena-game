(function (A) {
  const U = A.Util, TOTAL = 10;
  U.register({
    id: 'classic', name: 'Arena Classic', difficulty: 'Sedang', timeRecord: 'min', hasWaves: true,
    objective: 'Kalahkan semua musuh dalam 10 wave.',
    rules: 'Item penyembuh muncul setelah wave selesai. Kalah jika health habis.',
    start(s) { s.wave = 0; s.waveTimer = 1.2; s.pending = []; s.spawnCd = 0; s.cleared = true; },
    hud(s) { return 'Wave ' + Math.max(1, s.wave) + '/' + TOTAL; },
    update(s, dt) {
      if (s.pending.length) { U.tick(s, dt); return null; }
      if (s.enemies.length) return null;
      if (!s.cleared) {
        s.cleared = true; A.Scoring.add(s, 50 * s.wave);
        if (s.wave >= TOTAL) { A.Scoring.add(s, s.player.stats.health * 2); return 'win'; }
        A.Items.spawnHeal(s, 25, 14); s.waveTimer = 2; return null;
      }
      s.waveTimer -= dt;
      if (s.waveTimer <= 0) { s.wave++; s.pending = U.composition(s.wave, 1); s.cleared = false; s.spawnCd = 0; }
      return null;
    }
  });
})(window.Arena);
