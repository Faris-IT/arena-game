(function (A) {
  const KEY = 'mufa-arena:v1';
  const num = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0);
  const DEFAULT_LOADOUT = ['dash', 'pulse'];
  const blank = () => ({ records: {}, stats: { games: 0, wins: 0, kills: 0, time: 0, bosses: 0, maxWave: 0, abil: {} },
    flags: {}, progress: {}, loadout: null, ach: {}, settings: {}, last: null });

  // Data kosong atau rusak ditangani dengan aman: kembali ke data awal.
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && typeof d === 'object' && d.records && typeof d.records === 'object' && d.stats && typeof d.stats === 'object') {
        for (const k of ['flags', 'progress', 'ach', 'settings']) if (!d[k] || typeof d[k] !== 'object') d[k] = {};
        if (!d.stats.abil || typeof d.stats.abil !== 'object') d.stats.abil = {};
        return d;
      }
    } catch (e) { /* abaikan */ }
    return blank();
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* penyimpanan penuh/diblokir */ } }

  // key = id mode, atau "id#nomorLevel" untuk mode berlevel.
  function getRecord(key) {
    const r = load().records[key];
    if (!r || typeof r !== 'object') return null;
    return { score: num(r.score), wave: num(r.wave), time: (typeof r.time === 'number' && isFinite(r.time) && r.time > 0) ? r.time : null };
  }

  // r = { key, score, time, wave, kills, result, bosses, abil }. Mengembalikan true jika skor rekor baru.
  function submitResult(mode, r) {
    const key = r.key || mode.id, d = load(), old = getRecord(key) || { score: 0, wave: 0, time: null };
    const rec = { score: old.score, wave: old.wave, time: old.time };
    const newRecord = r.score > old.score;
    if (newRecord) rec.score = Math.round(r.score);
    if (r.wave > rec.wave) rec.wave = r.wave;
    if (mode.timeRecord === 'max' && r.time > (rec.time || 0)) rec.time = r.time;
    if (mode.timeRecord === 'min' && r.result === 'win' && (rec.time == null || r.time < rec.time)) rec.time = r.time;
    d.records[key] = rec;
    const st = d.stats;
    st.games = num(st.games) + 1; st.wins = num(st.wins) + (r.result === 'win' ? 1 : 0);
    st.kills = num(st.kills) + r.kills; st.time = num(st.time) + r.time;
    st.bosses = num(st.bosses) + (r.bosses || 0); st.maxWave = Math.max(num(st.maxWave), r.wave || 0);
    for (const id in (r.abil || {})) if (A.AbilityOrder.indexOf(id) >= 0) st.abil[id] = num(st.abil[id]) + r.abil[id];
    save(d);
    return newRecord;
  }

  function getStats() {
    const d = load(), st = d.stats, abil = {};
    A.AbilityOrder.forEach(id => { abil[id] = num(st.abil[id]); });
    return { games: num(st.games), wins: num(st.wins), kills: num(st.kills), time: num(st.time), bosses: num(st.bosses), maxWave: num(st.maxWave), abil, ach: Object.keys(d.ach).length };
  }

  function getFlag(k) { return load().flags[k] === true; }
  function setFlag(k) { const d = load(); d.flags[k] = true; save(d); }

  function getAch() { const o = {}, a = load().ach; for (const k in a) if (a[k]) o[k] = true; return o; }
  function unlockAch(id) { const d = load(); d.ach[id] = true; save(d); }

  // Jumlah level yang terbuka (minimal 1).
  function getUnlocked(id) { const n = load().progress[id]; return (typeof n === 'number' && isFinite(n) && n >= 1) ? Math.floor(n) : 1; }
  function unlock(id, n) { const d = load(); d.progress[id] = Math.max(getUnlocked(id), n); save(d); }

  // Loadout kemampuan (maksimal 2, unik, hanya id yang dikenal).
  function getLoadout() {
    const l = load().loadout, out = [];
    if (Array.isArray(l)) for (const id of l) if (A.AbilityOrder.indexOf(id) >= 0 && out.indexOf(id) < 0 && out.length < 2) out.push(id);
    return Array.isArray(l) ? out : DEFAULT_LOADOUT.slice();
  }
  function setLoadout(arr) { const d = load(); d.loadout = arr.slice(0, 2); save(d); }

  // Pengaturan: nilai tak dikenal dikembalikan ke default.
  function getSettings() {
    const s = load().settings;
    return { reduceFx: s.reduceFx === true, showFps: s.showFps !== false, touchScale: [0.85, 1, 1.2].indexOf(s.touchScale) >= 0 ? s.touchScale : 1, swap: s.swap === true };
  }
  function setSetting(k, v) { const d = load(); d.settings[k] = v; save(d); }

  // Mode/level terakhir dimainkan (untuk tombol Lanjutkan).
  function setLast(id, level) { const d = load(); d.last = { id, level }; save(d); }
  function getLast() {
    const l = load().last;
    return (l && typeof l.id === 'string' && Number.isInteger(l.level) && l.level >= 0) ? { id: l.id, level: l.level } : null;
  }

  function resetAll() { try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ } }

  A.Storage = { getRecord, submitResult, getStats, getFlag, setFlag, getAch, unlockAch, getUnlocked, unlock,
    getLoadout, setLoadout, getSettings, setSetting, setLast, getLast, resetAll };
})(window.Arena);
