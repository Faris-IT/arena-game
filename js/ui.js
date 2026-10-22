(function (A) {
  const $ = id => document.getElementById(id);
  let hud, overlay, btn, title;

  function onState(s) {
    hud.hidden = s === 'menu';
    overlay.hidden = s === 'playing';
    if (s === 'paused') { title.textContent = 'Dijeda'; btn.textContent = 'Lanjutkan'; }
  }

  A.UI = {
    init() {
      hud = $('hud'); overlay = $('overlay'); btn = $('btn-main'); title = overlay.querySelector('h1');
      if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
        document.body.classList.add('touch'); $('touch').hidden = false;
      }
      btn.addEventListener('click', () => (A.GameState.status === 'paused' ? A.GameState.resume() : A.GameState.start()));
      $('btn-pause').addEventListener('click', () => A.GameState.pause());
      A.GameState.onChange(onState);
    },
    updateHud(p, fps) {
      $('hp-fill').style.width = (p.stats.health / p.stats.maxHealth * 100) + '%';
      $('en-fill').style.width = (p.stats.energy / p.stats.maxEnergy * 100) + '%';
      if (fps != null) $('fps').textContent = fps;
    }
  };
})(window.Arena);
