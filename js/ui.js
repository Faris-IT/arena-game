(function (A) {
  const $ = id => document.getElementById(id);
  let hud, overlay, btn, title, summary;

  function fmt(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; }

  function onState(s) {
    hud.hidden = s === 'menu';
    overlay.hidden = s === 'playing';
    summary.hidden = s !== 'gameover';
    if (s === 'paused') { title.textContent = 'Dijeda'; btn.textContent = 'Lanjutkan'; }
    if (s === 'gameover') {
      const g = A.state;
      title.textContent = g.result === 'win' ? 'Menang!' : 'Kalah';
      summary.textContent = 'Skor ' + g.score + ' · ' + g.kills + ' musuh · ' + fmt(g.time);
      btn.textContent = 'Coba lagi';
    }
    if (s !== 'playing') btn.focus();
  }

  A.UI = {
    init() {
      hud = $('hud'); overlay = $('overlay'); btn = $('btn-main'); title = overlay.querySelector('h1'); summary = $('summary');
      if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
        document.body.classList.add('touch'); $('touch').hidden = false;
      }
      btn.addEventListener('click', () => {
        btn.blur();
        if (A.GameState.status === 'paused') A.GameState.resume();
        else { A.Game.newGame(); A.GameState.start(); }
      });
      $('btn-pause').addEventListener('click', () => A.GameState.pause());
      A.GameState.onChange(onState);
    },
    updateHud(g, fps) {
      const p = g.player;
      $('hp-fill').style.width = (p.stats.health / p.stats.maxHealth * 100) + '%';
      $('en-fill').style.width = (p.stats.energy / p.stats.maxEnergy * 100) + '%';
      $('wave').textContent = 'Wave ' + Math.max(1, g.wave) + '/' + g.mode.totalWaves;
      $('score').textContent = g.score;
      if (fps != null) $('fps').textContent = fps;
    }
  };
})(window.Arena);
