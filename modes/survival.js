(function (A) {
  const U = A.Util, C = A.CONFIG, NB = A.Bosses.ids.length;
  const OPT = { slots: Infinity, maxLv: 5 }; // build tanpa batas slot

  U.register({
    id: 'survival', name: 'Endless Survival', difficulty: 'Sulit', timeRecord: 'max', hasWaves: true,
    objective: 'Bertahan selama mungkin. Tidak ada akhir.',
    rules: 'Ancaman naik tiap 30 detik. Boss muncul setiap 5 wave dan makin kuat. Upgrade tanpa batas slot (maksimal level 5) muncul tiap 3 wave dan setelah boss kalah.',
    start(s) { s.threat = 1; s.wave = 0; s.pending = []; s.spawnCd = 0; s.waveT = 2; s.healT = 40; s.up = {}; s.boss = null; s.bossN = 0; },
    hud(s) {
      return 'Ancaman ' + s.threat + ' · Wave ' + s.wave + (s.boss ? ' · ' + s.boss.d.name : '') + ' · ' + U.fmtTime(s.time);
    },
    endTitle() { return 'Bertahan'; },
    drawAbove(ctx, s) { if (s.boss && !s.boss.dead) A.Bosses.drawBar(ctx, s.boss); },
    update(s, dt) {
      s.threat = 1 + Math.floor(s.time / 30);
      if (s.pending.length) U.tick(s, dt);
      if (s.boss) {
        if (!s.boss.dead) { s.healT -= dt; if (s.healT <= 0) { s.healT = 40; if (!s.items.length) A.Items.spawnHeal(s, 25, 10); } return null; }
        // Boss kalah: bersihkan sisa musuh, beri hadiah dan pilihan upgrade
        s.boss = null; for (const e of s.enemies) e.dead = true;
        s.hazards.length = 0; s.pending = [];
        A.Scoring.add(s, 500 * s.bossN);
        const st = s.player.stats; st.health = Math.min(st.maxHealth, st.health + 30);
        s.waveT = 4;
        const options = A.Upgrades.offer(s, OPT);
        if (options.length) A.Game.choose({ title: 'Boss kalah! Pilih upgrade', text: 'Build tanpa batas slot: setiap upgrade bisa naik sampai level 5.', options });
        return null;
      }
      s.waveT -= dt;
      if (!s.pending.length && (s.waveT <= 0 || (s.enemies.length <= 1 && s.waveT <= 11))) {
        s.wave++; s.waveT = 14; A.Scoring.add(s, 20 * s.wave);
        if (s.wave % 5 === 0) { // gelombang boss: boss makin kuat setiap putaran
          s.bossN = s.wave / 5;
          A.Enemies.spawn(s.enemies, A.Bosses.ids[(s.bossN - 1) % NB], C.width / 2, 110);
          const b = s.enemies[s.enemies.length - 1];
          b.hp = b.maxHp = Math.round(b.hp * (1 + 0.35 * Math.floor((s.bossN - 1) / NB)));
          s.boss = b; s.healT = 25;
        } else {
          if (s.wave % 3 === 0) {
            const options = A.Upgrades.offer(s, OPT);
            if (options.length) A.Game.choose({ title: 'Pilih upgrade', text: 'Wave ' + s.wave + ' dimulai. Build tanpa batas slot.', options });
          }
          s.pending = U.composition(s.threat + 1, 1); s.spawnCd = 0;
        }
      }
      s.healT -= dt;
      if (s.healT <= 0) { s.healT = 40; if (Math.random() < 0.6 && !s.items.length) A.Items.spawnHeal(s, 25, 10); }
      return null;
    }
  });
})(window.Arena);
