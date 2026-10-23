(function (A) {
  const C = A.CONFIG;
  let last = 0, frames = 0, acc = 0;

  function step(dt) {
    const s = A.state;
    s.time += dt;
    A.Player.update(s.player, dt, s);
    A.Abilities.update(s, dt);
    A.Enemies.update(s, dt);
    A.Enemies.contact(s);
    A.Projectiles.update(s, dt);
    A.Items.update(s, dt);
    A.Hazards.update(s, dt);
    A.Enemies.removeDead(s);
    A.Particles.update(dt);
    if (s.mode.noDeath && s.player.stats.health < 1) s.player.stats.health = 1; // mis. Tutorial
    const result = s.player.stats.health <= 0 ? 'lose' : s.mode.update(s, dt);
    A.Achievements.tick(s); // achievement dicek dari kejadian gameplay nyata
    if (result && A.GameState.status === 'playing') {
      s.result = result;
      s.newRecord = s.mode.noRecord ? false
        : A.Storage.submitResult(s.mode, { key: s.mode.levels ? s.mode.id + '#' + s.level : s.mode.id,
            score: s.score, time: s.time, wave: s.wave || 0, kills: s.kills, result, bosses: s.bossKills, abil: s.abilUses });
      if (result === 'win' && s.mode.levels) A.Storage.unlock(s.mode.id, s.level + 2); // buka level berikutnya
      A.Achievements.onEnd(s, result);
      if (s.mode.onEnd) s.mode.onEnd(s, result);
      A.GameState.set('gameover');
    }
  }

  function frame(t) {
    requestAnimationFrame(frame);
    // dt dibatasi agar tab yang baru aktif tidak menyebabkan lompatan
    const dt = Math.min((t - last) / 1000, C.maxDt); last = t;
    if (A.GameState.status === 'playing') step(dt);
    A.Renderer.draw(A.state);
    frames++; acc += dt;
    if (acc >= 0.5) { A.UI.updateHud(A.state, Math.round(frames / acc)); frames = 0; acc = 0; }
    else A.UI.updateHud(A.state);
    A.UI.updateCoach(A.state);
    A.UI.updateAbilities(A.state);
  }

  A.GameLoop = {
    start() {
      last = performance.now();
      A.GameState.onChange(() => { last = performance.now(); }); // reset waktu saat pause/resume/pilihan
      document.addEventListener('visibilitychange', () => { if (document.hidden) A.GameState.pause(); });
      requestAnimationFrame(frame);
    }
  };
})(window.Arena);
