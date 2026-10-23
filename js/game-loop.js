(function (A) {
  const C = A.CONFIG;
  let last = 0, frames = 0, acc = 0;

  function step(dt) {
    const s = A.state;
    s.time += dt;
    A.Player.update(s.player, dt, s);
    A.Enemies.update(s, dt);
    A.Enemies.contact(s);
    A.Projectiles.update(s, dt);
    A.Items.update(s, dt);
    A.Enemies.removeDead(s);
    const result = s.player.stats.health <= 0 ? 'lose' : s.mode.update(s, dt);
    if (result) {
      s.result = result;
      s.newRecord = A.Storage.submitResult(s.mode, { score: s.score, time: s.time, wave: s.wave || 0, kills: s.kills, result });
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
  }

  A.GameLoop = {
    start() {
      last = performance.now();
      A.GameState.onChange(() => { last = performance.now(); }); // reset waktu saat pause/resume
      document.addEventListener('visibilitychange', () => { if (document.hidden) A.GameState.pause(); });
      requestAnimationFrame(frame);
    }
  };
})(window.Arena);
