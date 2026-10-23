(function (A) {
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  let hud, overlay, modes, levels, loadout, choose, btn, btnRetry, btn2, btnTut, btnAbil, title, summary, tagline, badge, coachEl, abilEl;
  let coachKey = '', loadoutReturn = 'main';

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function icon(path) {
    const svg = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'ico'); svg.setAttribute('aria-hidden', 'true');
    p.setAttribute('d', path); svg.append(p); return svg;
  }
  function showOnly(name) {
    overlay.hidden = name !== 'overlay'; modes.hidden = name !== 'modes'; levels.hidden = name !== 'levels';
    loadout.hidden = name !== 'loadout'; choose.hidden = name !== 'choose';
  }

  // Kartu serbaya guna untuk mode, level, kemampuan, dan pilihan.
  function card(o) {
    const c = el('button', 'card' + (o.sel ? ' sel' : '')); c.type = 'button'; c.style.setProperty('--accent', o.color || '#22e4ff');
    const head = el('div', 'card-head');
    if (o.icon) head.append(icon(o.icon));
    head.append(el('strong', null, o.title));
    if (o.tag) head.append(el('span', 'tag ' + (o.tagClass || ''), o.tag));
    c.append(head);
    (o.lines || []).forEach(l => c.append(el('p', l[1], l[0])));
    if (o.disabled) c.disabled = true; else c.addEventListener('click', o.onClick);
    return c;
  }

  function recordText(m, key) {
    if (m.noRecord) return 'Tanpa rekor · bisa diulang';
    const r = A.Storage.getRecord(key);
    if (!r) return 'Belum ada rekor';
    const parts = [];
    if (r.score) parts.push('Skor ' + r.score);
    if (r.time != null) parts.push((m.timeRecord === 'max' ? 'Bertahan ' : 'Tercepat ') + A.Util.fmtTime(r.time));
    if (m.hasWaves && r.wave) parts.push('Wave ' + r.wave);
    return parts.length ? 'Rekor: ' + parts.join(' · ') : 'Belum ada rekor';
  }

  function loadoutLabel() { return 'Kemampuan: ' + (A.Storage.getLoadout().map(id => A.AbilityData[id].name).join(' · ') || 'kosong'); }

  function showModes() {
    const grid = $('mode-grid'); grid.textContent = '';
    $('btn-abil2').textContent = loadoutLabel();
    let group = null, wrap = null;
    A.ModeList.forEach(m => {
      const meta = A.Util.META[m.id] || { group: 'Mode', color: '#22e4ff', icon: '' };
      if (meta.group !== group) { group = meta.group; grid.append(el('h3', 'group', group)); wrap = el('div', 'cards'); grid.append(wrap); }
      const lvInfo = m.levels ? m.levels.length + ' level · terbuka ' + Math.min(m.levels.length, A.Storage.getUnlocked(m.id)) : recordText(m, m.id);
      wrap.append(card({ icon: meta.icon, color: meta.color, title: m.name, tag: m.difficulty, tagClass: m.difficulty.toLowerCase(),
        lines: [[m.objective, 'obj'], [m.rules, 'rules'], [lvInfo, 'rec']],
        onClick: () => { if (m.levels) showLevels(m); else A.Game.launch(m.id); } }));
    });
    showOnly('modes'); modes.scrollTop = 0;
  }

  function showLevels(m) {
    const grid = $('level-grid'), meta = A.Util.META[m.id], unlocked = A.Storage.getUnlocked(m.id);
    $('levels-title').textContent = m.name + ' · pilih level'; grid.textContent = '';
    m.levels.forEach((L, i) => {
      const locked = i >= unlocked;
      grid.append(card({ icon: meta.icon, color: meta.color, title: 'Level ' + (i + 1) + ' · ' + L.name,
        tag: locked ? 'Terkunci' : '', disabled: locked,
        lines: [[L.desc, 'obj'], [locked ? 'Selesaikan level sebelumnya untuk membuka.' : recordText(m, m.id + '#' + i), locked ? 'rules' : 'rec']],
        onClick: () => A.Game.launch(m.id, i) }));
    });
    showOnly('levels'); levels.scrollTop = 0;
  }

  function showLoadout(ret) {
    loadoutReturn = ret; const grid = $('loadout-grid'), sel = A.Storage.getLoadout(); grid.textContent = '';
    A.AbilityOrder.forEach(id => {
      const d = A.AbilityData[id], on = sel.indexOf(id) >= 0;
      grid.append(card({ icon: d.icon, color: d.color, title: d.name, tag: on ? 'Dipakai' : '', sel: on,
        lines: [[d.desc, 'obj'], ['Energi ' + d.cost + ' · Cooldown ' + d.cd + ' dtk', 'rec']],
        onClick: () => {
          const cur = A.Storage.getLoadout(), i = cur.indexOf(id);
          if (i >= 0) cur.splice(i, 1); else { if (cur.length >= 2) cur.shift(); cur.push(id); }
          A.Storage.setLoadout(cur); showLoadout(loadoutReturn);
        } }));
    });
    showOnly('loadout'); loadout.scrollTop = 0;
  }

  function showChoose() {
    const c = A.state.choice; if (!c) return;
    $('choose-title').textContent = c.title; $('choose-text').textContent = c.text || '';
    const grid = $('choose-opts'); grid.textContent = '';
    c.options.forEach(o => grid.append(card({ color: '#ffd23c', title: o.title, tag: o.tag,
      lines: [[o.desc || '', 'obj'], [o.note || '', 'rec']],
      onClick: () => { const g = A.state; g.choice = null; if (o.pick) o.pick(g); A.GameState.set('playing'); } })));
    showOnly('choose');
  }

  function onState(s) {
    document.body.dataset.status = s;
    hud.hidden = s === 'menu';
    if (s === 'choose') { showChoose(); return; }
    showOnly(s === 'playing' ? 'none' : 'overlay');
    summary.hidden = s !== 'gameover';
    btn2.hidden = s === 'menu'; btnTut.hidden = s !== 'menu'; btnAbil.hidden = s !== 'menu';
    tagline.hidden = s !== 'menu'; badge.hidden = s !== 'menu'; btnRetry.hidden = true;
    if (s === 'menu') { title.textContent = 'Mufa Arena'; btn.textContent = 'Pilih mode'; }
    if (s === 'paused') { title.textContent = 'Dijeda'; btn.textContent = 'Lanjutkan'; }
    if (s === 'gameover') {
      const g = A.state, m = g.mode, custom = m.endTitle ? m.endTitle(g, g.result) : null;
      title.textContent = custom || (g.result === 'win' ? 'Menang!' : 'Kalah');
      summary.textContent = m.endSummary ? m.endSummary(g)
        : m.name + (m.levels ? ' · Level ' + (g.level + 1) : '') + ' · Skor ' + g.score + ' · ' + g.kills + ' musuh · ' + A.Util.fmtTime(g.time) + (g.newRecord ? ' · Rekor baru!' : '');
      const hasNext = g.result === 'win' && m.levels && g.level + 1 < m.levels.length;
      btn.textContent = hasNext ? 'Level berikutnya' : (m.retryLabel || 'Coba lagi');
      btnRetry.hidden = !hasNext;
    }
    if (s !== 'playing') btn.focus();
  }

  A.UI = {
    init() {
      hud = $('hud'); overlay = $('overlay'); modes = $('modes'); levels = $('levels'); loadout = $('loadout'); choose = $('choose');
      btn = $('btn-main'); btnRetry = $('btn-retry'); btn2 = $('btn-menu'); btnTut = $('btn-tutorial'); btnAbil = $('btn-abil');
      title = overlay.querySelector('h1'); summary = $('summary'); tagline = $('tagline'); badge = $('badge'); coachEl = $('coach'); abilEl = $('abil');
      if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
        document.body.classList.add('touch'); $('touch').hidden = false;
      }
      btn.addEventListener('click', () => {
        btn.blur();
        const st = A.GameState.status, g = A.state;
        if (st === 'paused') A.GameState.resume();
        else if (st === 'gameover') {
          const next = g.result === 'win' && g.mode.levels && g.level + 1 < g.mode.levels.length;
          A.Game.launch(g.mode.id, next ? g.level + 1 : g.level);
        } else showModes();
      });
      btnRetry.addEventListener('click', () => { btnRetry.blur(); A.Game.launch(A.state.mode.id, A.state.level); });
      btnTut.addEventListener('click', () => { btnTut.blur(); A.Game.launch('tutorial'); });
      btn2.addEventListener('click', () => { btn2.blur(); A.GameState.toMenu(); });
      btnAbil.addEventListener('click', () => showLoadout('main'));
      $('btn-abil2').addEventListener('click', () => showLoadout('modes'));
      $('btn-loadout-back').addEventListener('click', () => { if (loadoutReturn === 'modes') showModes(); else showOnly('overlay'); });
      $('btn-back').addEventListener('click', () => showOnly('overlay'));
      $('btn-levels-back').addEventListener('click', showModes);
      $('btn-pause').addEventListener('click', () => A.GameState.pause());
      $('coach-skip').addEventListener('click', () => { A.Storage.setFlag('tutorialDone'); A.GameState.toMenu(); });
      Array.prototype.forEach.call(abilEl.children, (b, i) => b.addEventListener('pointerdown', e => { e.preventDefault(); A.Input.pushAbility(i); }));
      A.GameState.onChange(onState);
      onState(A.GameState.status);
    },
    updateHud(g, fps) {
      const p = g.player;
      $('hp-fill').style.width = (p.stats.health / p.stats.maxHealth * 100) + '%';
      $('en-fill').style.width = (p.stats.energy / p.stats.maxEnergy * 100) + '%';
      $('wave').textContent = (g.mode.levels ? 'L' + (g.level + 1) + ' · ' : '') + g.mode.hud(g);
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
    },
    // Tombol kemampuan: ikon, cooldown (konik), dan penanda energi kurang.
    updateAbilities(g) {
      const st = A.GameState.status, live = st === 'playing' || st === 'paused' || st === 'choose';
      abilEl.hidden = !live;
      if (!live) return;
      Array.prototype.forEach.call(abilEl.children, (b, i) => {
        const id = g.slots[i];
        b.hidden = !id;
        if (!id) return;
        const d = A.AbilityData[id];
        if (b.dataset.id !== id) {
          b.dataset.id = id; b.style.setProperty('--c', d.color); b.title = d.name + ' (' + d.cost + ' energi)';
          b.querySelector('path').setAttribute('d', d.icon); b.querySelector('.key').textContent = i === 0 ? 'Shift' : 'Q';
        }
        b.style.setProperty('--p', (g.cd[i] > 0 ? g.cd[i] / g.cdMax[i] * 100 : 0).toFixed(0) + '%');
        b.classList.toggle('low', g.player.stats.energy < d.cost);
      });
    }
  };
})(window.Arena);
