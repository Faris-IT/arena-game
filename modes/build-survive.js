(function (A) {
  const U = A.Util, TOTAL = 12, SLOTS = 5, MAXLV = 3;
  U.register({
    id: 'build-survive', name: 'Build & Survive', difficulty: 'Sedang', timeRecord: 'min', hasWaves: true,
    objective: 'Selesaikan 12 wave sambil membangun kombinasi upgrade.',
    rules: 'Tiap wave selesai kamu memilih 1 dari 3 upgrade. Hanya ada 5 slot, jadi pilih dengan cermat. Setiap upgrade bisa naik sampai level 3.',
    start(s) { s.up = {}; s.wave = 0; s.waveTimer = 1.2; s.pending = []; s.spawnCd = 0; s.cleared = true; },
    hud(s) { return 'Wave ' + Math.max(1, s.wave) + '/' + TOTAL + ' · Slot ' + Object.keys(s.up).length + '/' + SLOTS; },
    update(s, dt) {
      if (s.pending.length) { U.tick(s, dt); return null; }
      if (s.enemies.length) return null;
      if (!s.cleared) {
        s.cleared = true; A.Scoring.add(s, 60 * s.wave);
        if (s.wave >= TOTAL) { A.Scoring.add(s, s.player.stats.health * 2); return 'win'; }
        A.Items.spawnHeal(s, 25, 14); s.waveTimer = 2;
        const options = A.Upgrades.offer(s, { slots: SLOTS, maxLv: MAXLV });
        if (options.length) A.Game.choose({ title: 'Pilih upgrade', text: 'Wave ' + s.wave + ' selesai. Pilih satu upgrade.', options });
        return null;
      }
      s.waveTimer -= dt;
      if (s.waveTimer <= 0) { s.wave++; s.pending = U.composition(s.wave, 0.9); s.cleared = false; s.spawnCd = 0; }
      return null;
    }
  });
})(window.Arena);
