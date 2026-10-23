(function (A) {
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  let hud, overlay, modes, btn, btn2, btnTut, title, summary, tagline, badge;
  let coachEl, coachKey = '';

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function icon(path) {
    const svg = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'ico'); svg.setAttribute('aria-hidden', 'true');
    p.setAttribute('d', path); svg.append(p); return svg;
  }

  function recordText(m) {
    if (m.noRecord) return 'Tanpa rekor · bisa diulang';
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
    let group = null, wrap = null;
    A.ModeList.forEach(m => {
      const meta = A.Util.META[m.id] || { group: 'Mode', color: '#22e4ff', icon: '' };
      if (meta.group !== group) { group = meta.group; grid.append(el('h3', 'group', group)); wrap = el('div', 'cards'); grid.append(wrap); }
      const card = el('button', 'card'); card.type = 'button'; card.style.setProperty('--accent', meta.color);
      const head = el('div', 'card-head');
      head.append(icon(meta.icon), el('strong', null, m.name), el('span', 'tag ' + m.difficulty.toLowerCase(), m.difficulty));
      card.append(head, el('p', 'obj', m.objective), el('p', 'rules', m.rules), el('p', 'rec', recordText(m)));
      card.addEventListener('click', () => { modes.hidden = true; A.Game.newGame(m.id); A.GameState.start(); });
      wrap.append(card);
    });
  }

  function showModes() { buildCards(); overlay.hidden = true; modes.hidden = false; $('modes').scrollTop = 0; }

  function onState(s) {
    document.body.dataset.status = s;
    hud.hidden = s === 'menu';
    overlay.hidden = s === 'playing';
    modes.hidden = true;
    summary.hidden = s !== 'gameover';
    btn2.hidden = s === 'menu';
    btnTut.hidden = s !== 'menu';
    tagline.hidden = s !== 'menu';
    badge.hidden = s !== 'menu';
    if (s === 'menu') { title.textContent = 'Mufa Arena'; btn.textContent = 'Pilih mode'; }
    if (s === 'paused') { title.textContent = 'Dijeda'; btn.textContent = 'Lanjutkan'; }
    if (s === 'gameover') {
      const g = A.state, m = g.mode, custom = m.endTitle ? m.endTitle(g, g.result) : null;
      title.textContent = custom || (g.result === 'win' ? 'Menang!' : 'Kalah');
      summary.textContent = m.endSummary ? m.endSummary(g)
        : m.name + ' · Skor ' + g.score + ' · ' + g.kills + ' musuh · ' + A.Util.fmtTime(g.time) + (g.newRecord ? ' · Rekor baru!' : '');
      btn.textContent = m.retryLabel || 'Coba lagi';
    }
    if (s !== 'playing') btn.focus();
  }

  A.UI = {
    init() {
      hud = $('hud'); overlay = $('overlay'); modes = $('modes'); btn = $('btn-main'); btn2 = $('btn-menu'); btnTut = $('btn-tutorial');
      title = overlay.querySelector('h1'); summary = $('summary'); tagline = $('tagline'); badge = $('badge'); coachEl = $('coach');
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
      btnTut.addEventListener('click', () => { btnTut.blur(); A.Game.newGame('tutorial'); A.GameState.start(); });
      btn2.addEventListener('click', () => { btn2.blur(); A.GameState.toMenu(); });
      $('btn-back').addEventListener('click', () => { modes.hidden = true; overlay.hidden = false; });
      $('btn-pause').addEventListener('click', () => A.GameState.pause());
      $('coach-skip').addEventListener('click', () => { A.Storage.setFlag('tutorialDone'); A.GameState.toMenu(); });
      A.GameState.onChange(onState);
      onState(A.GameState.status);
    },
    updateHud(g, fps) {
      const p = g.player;
      $('hp-fill').style.width = (p.stats.health / p.stats.maxHealth * 100) + '%';
      $('en-fill').style.width = (p.stats.energy / p.stats.maxEnergy * 100) + '%';
      $('wave').textContent = g.mode.hud(g);
      $('score').textContent = g.mode.noRecord ? '' : g.score;
      if (fps != null) $('fps').textContent = fps;
    },
    // Panel petunjuk (Tutorial): muncul hanya jika mode menyediakan coach().
    updateCoach(g) {
      const st = A.GameState.status, c = (g.mode.coach && (st === 'playing' || st === 'paused')) ? g.mode.coach(g) : null;
      coachEl.hidden = !c;
      if (!c) return;
      const key = c.n + '|' + c.title + '|' + c.text;
      if (key !== coachKey) {
        coachKey = key;
        $('coach-step').textContent = 'Langkah ' + c.n + '/' + c.total;
        $('coach-title').textContent = c.title; $('coach-text').textContent = c.text;
      }
      $('coach-bar').style.width = (c.p * 100) + '%';
    }
  };
})(window.Arena);
