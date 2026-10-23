(function (A) {
  const U = A.Util, LIMIT = 90;
  U.register({
    id: 'time-attack', name: 'Time Attack', difficulty: 'Sedang', timeRecord: null, combo: true,
    objective: 'Raih skor setinggi mungkin dalam 90 detik.',
    rules: 'Target emas bernilai besar tetapi kabur. Combo tanpa jeda memberi bonus. Waktu tidak bertambah.',
    start(s) { s.timeLeft = LIMIT; s.spawnT = 0.5; s.targetT = 3; s.combo = 0; s.comboT = 0; },
    hud(s) { return U.fmtTime(s.timeLeft) + (s.combo > 1 ? ' · Combo x' + s.combo : ''); },
    update(s, dt) {
      s.timeLeft -= dt;
      if (s.timeLeft <= 0) { s.timeLeft = 0; return 'win'; } // timer habis: skor dihitung
      if (s.comboT > 0) { s.comboT -= dt; if (s.comboT <= 0) s.combo = 0; }
      const el = LIMIT - s.timeLeft;
      s.spawnT -= dt;
      if (s.spawnT <= 0 && s.enemies.length < 16) {
        const r = Math.random();
        const t = el > 60 && r < 0.08 ? 'tank' : el > 40 && r < 0.22 ? 'dasher' : el > 20 && r < 0.42 ? 'shooter' : 'chaser';
        A.Enemies.spawnAtEdge(s.enemies, t, s.player);
        s.spawnT = Math.max(0.5, 1.3 - el / LIMIT * 0.8);
      }
      s.targetT -= dt;
      if (s.targetT <= 0) {
        if (s.enemies.filter(e => e.type === 'target').length < 2) A.Enemies.spawnAtEdge(s.enemies, 'target', s.player);
        s.targetT = 5;
      }
      return null;
    }
  });
})(window.Arena);
