// Mode uji Tahap 2: 3 wave singkat agar satu pertarungan bisa dimainkan sampai selesai.
// Akan digantikan Arena Classic penuh di Tahap 3.
(function (A) {
  const WAVES = [
    ['chaser', 'chaser', 'chaser', 'chaser'],
    ['chaser', 'chaser', 'chaser', 'shooter', 'shooter'],
    ['chaser', 'chaser', 'shooter', 'shooter', 'dasher', 'dasher', 'tank']
  ];

  A.Modes = A.Modes || {};
  A.Modes.prototype = {
    name: 'Latihan tempur',
    totalWaves: WAVES.length,
    start(s) { s.wave = 0; s.waveTimer = 1; s.pending = []; s.spawnCd = 0; },
    // Mengembalikan 'win' jika semua wave selesai.
    update(s, dt) {
      if (s.pending.length) {
        s.spawnCd -= dt;
        if (s.spawnCd <= 0) { A.Enemies.spawnAtEdge(s.enemies, s.pending.pop(), s.player); s.spawnCd = 0.35; }
      } else if (s.enemies.length === 0) {
        if (s.wave >= WAVES.length) return 'win';
        s.waveTimer -= dt;
        if (s.waveTimer <= 0) { s.pending = WAVES[s.wave].slice(); s.wave++; s.waveTimer = 1.5; s.spawnCd = 0; }
      }
      return null;
    }
  };
})(window.Arena);
