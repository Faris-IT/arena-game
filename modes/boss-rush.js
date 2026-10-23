(function (A) {
  const U = A.Util, C = A.CONFIG;
  const LV = A.Bosses.info.map(b => ({ name: b.name, desc: b.desc }));
  U.register({
    id: 'boss-rush', name: 'Boss Rush', difficulty: 'Sulit', timeRecord: 'min', levels: LV,
    objective: 'Kalahkan satu boss di setiap level.',
    rules: '8 level, masing-masing satu boss dengan pola berbeda. Serangan besar selalu diberi peringatan. Item penyembuh muncul sesekali.',
    start(s) { s.restT = 2.5; s.boss = null; s.healT = 30; },
    hud(s) { return s.boss ? s.boss.d.name : 'Bersiap...'; },
    endTitle() { return null; },
    drawAbove(ctx, s) { if (s.boss && !s.boss.dead) A.Bosses.drawBar(ctx, s.boss); },
    update(s, dt) {
      if (!s.boss) {
        s.restT -= dt;
        if (s.restT <= 0) { A.Enemies.spawn(s.enemies, A.Bosses.ids[s.level], C.width / 2, 110); s.boss = s.enemies[s.enemies.length - 1]; }
        return null;
      }
      if (s.boss.dead) { A.Scoring.add(s, 1000 + 200 * s.level + s.player.stats.health * 3); return 'win'; }
      s.healT -= dt;
      if (s.healT <= 0) { s.healT = 30; if (!s.items.length) A.Items.spawnHeal(s, 20, 12); }
      return null;
    }
  });
})(window.Arena);
