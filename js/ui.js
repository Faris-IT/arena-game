(function (A) {
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const SCREENS = ['overlay', 'modes', 'levels', 'loadout', 'ach', 'stats', 'settings', 'choose'];
  let hud, dock, coachEl, abilEl, toastEl, btn, btnRetry, btn2, btnCont, menuGrid, title, summary, tagline, badge;
  let coachKey = '', loadoutReturn = 'main', dockH = 0, dockSig = '', toastTimer = 0, resetArmed = 0;

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function icon(path) {
    const svg = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'ico'); svg.setAttribute('aria-hidden', 'true');
    p.setAttribute('d', path); svg.append(p); return svg;
  }
  function showOnly(name) { SCREENS.forEach(n => { $(n).hidden = n !== name; }); }
  function fmtLong(t) {
    t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
    return h ? h + ' j ' + m + ' m' : m + ' m ' + s + ' d';
  }

  // ---------- dock (di luar canvas) ----------
  function layout() {
    const vis = Array.prototype.some.call(dock.children, c => !c.hidden);
    dock.classList.toggle('empty', !vis);
    const h = vis ? Math.ceil(dock.getBoundingClientRect().height) : 0;
    if (h !== dockH) { dockH = h; document.documentElement.style.setProperty('--dock', h + 'px'); A.Renderer.resize(); }
  }
  function toast(text) {
    toastEl.textContent = text; toastEl.hidden = false; layout();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; layout(); }, 3500);
  }

  function applySettings() {
    const S = A.Settings;
    document.body.classList.toggle('nofps', !S.showFps);
    document.body.classList.toggle('swap', S.swap);
    document.documentElement.style.setProperty('--tscale', S.touchScale);
  }

  // ---------- kartu serbaguna ----------
  function card(o) {
    const c = el(o.static ? 'div' : 'button', 'card' + (o.sel ? ' sel' : '') + (o.static ? ' static' : ''));
    if (!o.static) c.type = 'button';
    c.style.setProperty('--accent', o.color || '#22e4ff');
    const head = el('div', 'card-head');
    if (o.icon) head.append(icon(o.icon));
    head.append(el('strong', null, o.title));
    if (o.tag) head.append(el('span', 'tag ' + (o.tagClass || ''), o.tag));
    c.append(head);
    (o.lines || []).forEach(l => c.append(el('p', l[1], l[0])));
    if (!o.static) { if (o.disabled) c.disabled = true; else c.addEventListener('click', o.onClick); }
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
  const loadoutLabel = () => 'Kemampuan: ' + (A.Storage.getLoadout().map(id => A.AbilityData[id].name).join(' · ') || 'kosong');

  // ---------- layar ----------
  function showModes() {
    const grid = $('mode-grid'); grid.textContent = '';
    $('btn-abil2').textContent = loadoutLabel();
    let group = null, wrap = null;
    A.ModeList.forEach(m => {
      const meta = A.Util.META[m.id] || { group: 'Mode', color: '#22e4ff', icon: '' };
      if (meta.group !== group) { group = meta.group; grid.append(el('h3', 'group', group)); wrap = el('div', 'cards'); grid.append(wrap); }
      const info = m.levels ? m.levels.length + ' level · terbuka ' + Math.min(m.levels.length, A.Storage.getUnlocked(m.id)) : recordText(m, m.id);
      wrap.append(card({ icon: meta.icon, color: meta.color, title: m.name, tag: m.difficulty, tagClass: m.difficulty.toLowerCase(),
        lines: [[m.objective, 'obj'], [m.rules, 'rules'], [info, 'rec']],
        onClick: () => { if (m.levels) showLevels(m); else A.Game.launch(m.id); } }));
    });
    showOnly('modes'); $('modes').scrollTop = 0;
  }

  function showLevels(m) {
    const grid = $('level-grid'), meta = A.Util.META[m.id], unlocked = A.Storage.getUnlocked(m.id);
    $('levels-title').textContent = m.name + ' · pilih level'; grid.textContent = '';
    m.levels.forEach((L, i) => {
      const locked = i >= unlocked;
      grid.append(card({ icon: meta.icon, color: meta.color, title: 'Level ' + (i + 1) + ' · ' + L.name, tag: locked ? 'Terkunci' : '', disabled: locked,
        lines: [[L.desc, 'obj'], [locked ? 'Selesaikan level sebelumnya untuk membuka.' : recordText(m, m.id + '#' + i), locked ? 'rules' : 'rec']],
        onClick: () => A.Game.launch(m.id, i) }));
    });
    showOnly('levels'); $('levels').scrollTop = 0;
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
    showOnly('loadout'); $('loadout').scrollTop = 0;
  }

  function showAch() {
    const grid = $('ach-grid'); grid.textContent = '';
    $('ach-title').textContent = 'Pencapaian · ' + A.Achievements.count() + '/' + A.Achievements.list.length;
    A.Achievements.list.forEach(a => {
      const on = A.Achievements.has(a.id);
      grid.append(card({ static: true, icon: a.icon, color: on ? '#ffd23c' : '#5a6577', title: a.name, tag: on ? 'Terbuka' : 'Terkunci', sel: on, lines: [[a.desc, 'obj']] }));
    });
    showOnly('ach'); $('ach').scrollTop = 0;
  }

  function showStats() {
    const st = A.Storage.getStats(), tiles = $('stats-tiles'), rows = $('stats-modes'); tiles.textContent = ''; rows.textContent = '';
    let fav = '-', favN = 0;
    A.AbilityOrder.forEach(id => { if (st.abil[id] > favN) { favN = st.abil[id]; fav = A.AbilityData[id].name + ' (' + favN + 'x)'; } });
    [['Total permainan', st.games], ['Kemenangan', st.wins], ['Musuh dikalahkan', st.kills], ['Total waktu bertahan', fmtLong(st.time)],
     ['Wave tertinggi', st.maxWave], ['Boss dikalahkan', st.bosses], ['Kemampuan favorit', fav],
     ['Pencapaian', st.ach + '/' + A.Achievements.list.length]].forEach(t => {
      const d = el('div', 'tile'); d.append(el('span', null, t[0]), el('strong', null, String(t[1]))); tiles.append(d);
    });
    A.ModeList.forEach(m => {
      if (m.noRecord) return;
      let best = 0, done = 0;
      if (m.levels) m.levels.forEach((L, i) => { const r = A.Storage.getRecord(m.id + '#' + i); if (r) { best = Math.max(best, r.score); if (r.time != null) done++; } });
      else { const r = A.Storage.getRecord(m.id); if (r) best = r.score; }
      const row = el('div', 'row'); row.append(el('span', null, m.name),
        el('span', 'val', (best ? 'Skor ' + best : 'Belum dimainkan') + (m.levels ? ' · ' + done + '/' + m.levels.length + ' level selesai' : '')));
      rows.append(row);
    });
    showOnly('stats'); $('stats').scrollTop = 0;
  }

  function showSettings(msg) {
    const rows = $('settings-rows'), S = A.Settings; rows.textContent = '';
    const add = (label, val, onClick, danger) => {
      const r = el('div', 'row' + (danger ? ' danger' : '')), b = el('button', 'ghost', val); b.type = 'button'; b.addEventListener('click', onClick);
      r.append(el('span', null, label), b); rows.append(r);
    };
    const set = (k, v) => { A.Storage.setSetting(k, v); A.Settings = A.Storage.getSettings(); applySettings(); showSettings(); };
    add('Kurangi partikel dan efek layar', S.reduceFx ? 'Aktif' : 'Mati', () => set('reduceFx', !S.reduceFx));
    add('Tampilkan FPS', S.showFps ? 'Aktif' : 'Mati', () => set('showFps', !S.showFps));
    const sizes = [0.85, 1, 1.2], names = ['Kecil', 'Sedang', 'Besar'];
    add('Ukuran kontrol sentuh', names[sizes.indexOf(S.touchScale)], () => set('touchScale', sizes[(sizes.indexOf(S.touchScale) + 1) % 3]));
    add('Posisi joystick (kidal: tukar)', S.swap ? 'Tertukar' : 'Normal', () => set('swap', !S.swap));
    add('Reset semua data', resetArmed > Date.now() ? 'Yakin? Klik lagi' : 'Reset', () => {
      if (resetArmed > Date.now()) {
        A.Storage.resetAll(); A.Achievements.reload(); A.Settings = A.Storage.getSettings(); applySettings(); resetArmed = 0; showSettings('Semua data dihapus.');
      } else { resetArmed = Date.now() + 4000; showSettings(); setTimeout(() => { if (!$('settings').hidden) showSettings(); }, 4100); }
    }, true);
    if (msg) rows.append(el('p', 'note', msg));
    showOnly('settings'); $('settings').scrollTop = 0;
  }

  function showChoose() {
    const c = A.state.choice; if (!c) return;
    $('choose-title').textContent = c.title; $('choose-text').textContent = c.text || '';
    const grid = $('choose-opts'); grid.textContent = '';
    c.options.forEach(o => grid.append(card({ color: '#ffd23c', title: o.title, tag: o.tag, lines: [[o.desc || '', 'obj'], [o.note || '', 'rec']],
      onClick: () => { const g = A.state; g.choice = null; if (o.pick) o.pick(g); A.GameState.set('playing'); } })));
    showOnly('choose');
  }

  // Target tombol Lanjutkan: mode/level terakhir; jika level itu sudah dimenangkan dan berikutnya terbuka, lanjut ke berikutnya.
  function continueTarget() {
    const l = A.Storage.getLast(), m = l && A.Modes[l.id];
    if (!m) return null;
    let lvl = 0;
    if (m.levels) {
      lvl = Math.min(l.level, m.levels.length - 1);
      const r = A.Storage.getRecord(m.id + '#' + lvl);
      if (r && r.time != null && lvl + 1 < m.levels.length && lvl + 1 < A.Storage.getUnlocked(m.id)) lvl++;
    }
    return { m, lvl };
  }

  function onState(s) {
    document.body.dataset.status = s;
    hud.hidden = s === 'menu';
    if (s === 'choose') { showChoose(); return; }
    showOnly(s === 'playing' ? 'none' : 'overlay');
    const menu = s === 'menu', over = s === 'gameover';
    summary.hidden = !over; btn2.hidden = menu; menuGrid.hidden = !menu;
    tagline.hidden = !menu; badge.hidden = !menu; btnRetry.hidden = true;
    const ct = menu ? continueTarget() : null;
    btnCont.hidden = !ct;
    if (ct) btnCont.textContent = 'Lanjutkan: ' + ct.m.name + (ct.m.levels ? ' · Level ' + (ct.lvl + 1) : '');
    if (menu) { title.textContent = 'Mufa Arena'; btn.textContent = 'Pilih mode'; }
    if (s === 'paused') { title.textContent = 'Dijeda'; btn.textContent = 'Lanjutkan'; }
    if (over) {
      const g = A.state, m = g.mode, custom = m.endTitle ? m.endTitle(g, g.result) : null;
      title.textContent = custom || (g.result === 'win' ? 'Menang!' : 'Kalah');
      summary.textContent = m.endSummary ? m.endSummary(g)
        : m.name + (m.levels ? ' · Level ' + (g.level + 1) : '') + ' · Skor ' + g.score + ' · ' + g.kills + ' musuh · ' + A.Util.fmtTime(g.time)
          + (g.newRecord ? ' · Rekor baru!' : '') + (g.newAch.length ? ' · Pencapaian: ' + g.newAch.join(', ') : '');
      const hasNext = g.result === 'win' && m.levels && g.level + 1 < m.levels.length;
      btn.textContent = hasNext ? 'Level berikutnya' : (m.retryLabel || 'Coba lagi');
      btnRetry.hidden = !hasNext;
    }
    if (s !== 'playing') btn.focus();
  }

  A.UI = {
    toast,
    init() {
      hud = $('hud'); dock = $('dock'); coachEl = $('coach'); abilEl = $('abil'); toastEl = $('toast');
      btn = $('btn-main'); btnRetry = $('btn-retry'); btn2 = $('btn-menu'); btnCont = $('btn-continue'); menuGrid = $('menu-grid');
      title = $('overlay').querySelector('h1'); summary = $('summary'); tagline = $('tagline'); badge = $('badge');
      if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) { document.body.classList.add('touch'); $('touch').hidden = false; }
      applySettings();
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
      btnCont.addEventListener('click', () => { const t = continueTarget(); if (t) A.Game.launch(t.m.id, t.lvl); });
      $('btn-tutorial').addEventListener('click', () => { $('btn-tutorial').blur(); A.Game.launch('tutorial'); });
      btn2.addEventListener('click', () => { btn2.blur(); A.GameState.toMenu(); });
      $('btn-abil').addEventListener('click', () => showLoadout('main'));
      $('btn-ach').addEventListener('click', showAch);
      $('btn-stats').addEventListener('click', showStats);
      $('btn-settings').addEventListener('click', () => showSettings());
      $('btn-abil2').addEventListener('click', () => showLoadout('modes'));
      $('btn-loadout-back').addEventListener('click', () => { if (loadoutReturn === 'modes') showModes(); else showOnly('overlay'); });
      Array.prototype.forEach.call(document.querySelectorAll('.back-menu'), b => b.addEventListener('click', () => showOnly('overlay')));
      $('btn-back').addEventListener('click', () => showOnly('overlay'));
      $('btn-levels-back').addEventListener('click', showModes);
      $('btn-pause').addEventListener('click', () => A.GameState.pause());
      $('coach-skip').addEventListener('click', () => { A.Storage.setFlag('tutorialDone'); A.GameState.toMenu(); });
      $('coach-next').addEventListener('click', () => { if (A.state.tut) A.state.tut.next = true; });
      Array.prototype.forEach.call(abilEl.children, (b, i) => b.addEventListener('pointerdown', e => { e.preventDefault(); A.Input.pushAbility(i); }));
      addEventListener('resize', layout);
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
    // Panel tutorial berada di dock (di luar canvas).
    updateCoach(g) {
      const st = A.GameState.status, c = (g.mode.coach && (st === 'playing' || st === 'paused')) ? g.mode.coach(g) : null;
      const wasHidden = coachEl.hidden;
      coachEl.hidden = !c;
      if (!c) { if (!wasHidden) layout(); return; }
      const key = c.n + '|' + c.title + '|' + c.text;
      if (key !== coachKey) {
        coachKey = key;
        $('coach-step').textContent = 'Langkah ' + c.n + '/' + c.total;
        $('coach-title').textContent = c.title; $('coach-text').textContent = c.text;
        $('coach-next').hidden = !c.info;
        layout();
      } else if (wasHidden) layout();
      $('coach-bar').style.width = (c.p * 100) + '%';
    },
    // Tombol kemampuan berada di dock: ikon, nama, cooldown, dan penanda energi kurang.
    updateAbilities(g) {
      const st = A.GameState.status, live = st === 'playing' || st === 'paused' || st === 'choose';
      const sig = (live ? 1 : 0) + '|' + g.slots.join(',');
      if (sig !== dockSig) {
        dockSig = sig; abilEl.hidden = !live || !g.slots.length;
        Array.prototype.forEach.call(abilEl.children, (b, i) => {
          const id = live ? g.slots[i] : null; b.hidden = !id; b.dataset.id = '';
          if (!id) return;
          const d = A.AbilityData[id];
          b.dataset.id = id; b.style.setProperty('--c', d.color); b.title = d.desc + ' (' + d.cost + ' energi)';
          b.querySelector('path').setAttribute('d', d.icon); b.querySelector('.nm').textContent = d.name; b.querySelector('.key').textContent = i === 0 ? 'Shift' : 'Q';
        });
        layout();
      }
      if (abilEl.hidden) return;
      Array.prototype.forEach.call(abilEl.children, (b, i) => {
        const id = g.slots[i]; if (!id) return;
        b.style.setProperty('--p', (g.cd[i] > 0 ? g.cd[i] / g.cdMax[i] * 100 : 0).toFixed(0) + '%');
        b.classList.toggle('low', g.player.stats.energy < A.AbilityData[id].cost);
      });
    }
  };
})(window.Arena);
