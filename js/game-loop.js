(function (A) {
  const C = A.CONFIG;
  let last = 0, frames = 0, acc = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    // dt dibatasi agar tab yang baru aktif tidak menyebabkan lompatan
    const dt = Math.min((t - last) / 1000, C.maxDt); last = t;
    const st = A.state;
    if (A.GameState.status === 'playing') A.Player.update(st.player, dt);
    A.Renderer.draw(st);
    frames++; acc += dt;
    if (acc >= 0.5) { A.UI.updateHud(st.player, Math.round(frames / acc)); frames = 0; acc = 0; }
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
