(function (A) {
  const U = A.Util;
  U.register({
    id: 'survival', name: 'Endless Survival', difficulty: 'Sulit', timeRecord: 'max', hasWaves: true,
    objective: 'Bertahan selama mungkin. Tidak ada akhir.',
    rules: 'Ancaman naik setiap 30 detik. Item penyembuh langka dan tidak selalu muncul.',
    start(s) { s.threat = 1; s.wave = 0; s.pending = []; s.spawnCd = 0; s.waveT = 2; s.healT = 40; },
    hud(s) { return 'Ancaman ' + s.threat + ' · ' + A.Util.fmtTime(s.time); },
    endTitle() { return 'Bertahan'; },
    update(s, dt) {
      s.threat = 1 + Math.floor(s.time / 30);
      if (s.pending.length) U.tick(s, dt);
      s.waveT -= dt;
      if (!s.pending.length && (s.waveT <= 0 || (s.enemies.length <= 1 && s.waveT <= 11))) {
        s.wave++; s.pending = U.composition(s.threat + 1, 1); s.spawnCd = 0; s.waveT = 14;
        A.Scoring.add(s, 20 * s.wave);
      }
      s.healT -= dt;
      if (s.healT <= 0) { s.healT = 40; if (Math.random() < 0.6 && !s.items.length) A.Items.spawnHeal(s, 25, 10); }
      return null;
    }
  });
})(window.Arena);
