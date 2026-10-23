(function (A) {
  const $ = id => document.getElementById(id);
  let hud, overlay, modes, btn, btn2, title, summary, tagline;

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function recordText(m) {
    const r = A.Storage.getRecord(m.id);
    if (!r) return 'Belum ada rekor';
    const parts = [];
    if (r.score) parts.push('Skor ' + r.score);
    if (r.time != null) parts.push((m.timeRecord === 'max' ? 'Bertahan ' : 'Tercepat ') + A.Util.fmtTime(r.time));
    if (m.hasWaves && r.wave) parts.push('Wave ' + r.wave);
    return parts.length ? 'Rekor: ' + parts.join(' · ') : 'Belum ada rekor';
  }

  function buildCards() {
    const grid = $('mode-grid'); grid.textContent = '';
    A.ModeList.forEach(m => {
      const card = el('button', 'card'); card.type = 'button';
      const head = el('div', 'card-head'); head.append(el('strong', null, m.name), el('span', 'tag ' + m.difficulty.toLowerCase(), m.difficulty));
      card.append(head, el('p', null, m.objective), el('p', 'rules', m.rules), el('p', 'rec', recordText(m)));
      card.addEventListener('click', () => { modes.hidden = true; A.Game.newGame(m.id); A.GameState.start(); });
      grid.append(card);
    });
  }

  function showModes() { buildCards(); overlay.hidden = true; modes.hidden = false; }

  function onState(s) {
    hud.hidden = s === 'menu';
    overlay.hidden = s === 'playing';
    modes.hidden = true;
    summary.hidden = s !== 'gameover';
    btn2.hidden = s === 'menu';
    btn2.textContent = 'Menu utama';
    tagline.hidden = s !== 'menu';
    if (s === 'menu') { title.textContent = 'Mufa Arena'; btn.textContent = 'Pilih mode'; }
    if (s === 'paused') { title.textContent = 'Dijeda'; btn.textContent = 'Lanjutkan'; }
    if (s === 'gameover') {
      const g = A.state, custom = g.mode.endTitle ? g.mode.endTitle(g, g.result) : null;
      title.textContent = custom || (g.result === 'win' ? 'Menang!' : 'Kalah');
      summary.textContent = g.mode.name + ' · Skor ' + g.score + ' · ' + g.kills + ' musuh · ' + A.Util.fmtTime(g.time) + (g.newRecord ? ' · Rekor baru!' : '');
      btn.textContent = 'Coba lagi';
    }
    if (s !== 'playing') btn.focus();
  }

  A.UI = {
    init() {
      hud = $('hud'); overlay = $('overlay'); modes = $('modes'); btn = $('btn-main'); btn2 = $('btn-menu');
      title = overlay.querySelector('h1'); summary = $('summary'); tagline = $('tagline');
      if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
        document.body.classList.add('touch'); $('touch').hidden = false;
      }
      btn.addEventListener('click', () => {
        btn.blur();
        const st = A.GameState.status;
        if (st === 'paused') A.GameState.resume();
        else if (st === 'gameover') { A.Game.newGame(A.state.mode.id); A.GameState.start(); }
        else showModes();
      });
      btn2.addEventListener('click', () => { btn2.blur(); A.GameState.toMenu(); });
      $('btn-back').addEventListener('click', () => { modes.hidden = true; overlay.hidden = false; });
      $('btn-pause').addEventListener('click', () => A.GameState.pause());
      A.GameState.onChange(onState);
      onState(A.GameState.status);
    },
    updateHud(g, fps) {
      const p = g.player;
      $('hp-fill').style.width = (p.stats.health / p.stats.maxHealth * 100) + '%';
      $('en-fill').style.width = (p.stats.energy / p.stats.maxEnergy * 100) + '%';
      $('wave').textContent = g.mode.hud(g);
      $('score').textContent = g.score;
      if (fps != null) $('fps').textContent = fps;
    }
  };
})(window.Arena);
