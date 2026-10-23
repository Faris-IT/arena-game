(function (A) {
  const KEY = 'mufa-arena:v1';
  const num = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0);
  const DEFAULT_LOADOUT = ['dash', 'pulse'];
  const blank = () => ({ records: {}, stats: { games: 0, wins: 0, kills: 0, time: 0 }, flags: {}, progress: {}, loadout: null });

  // Data kosong atau rusak ditangani dengan aman: kembali ke data awal.
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && typeof d === 'object' && d.records && typeof d.records === 'object' && d.stats && typeof d.stats === 'object') {
        if (!d.flags || typeof d.flags !== 'object') d.flags = {};
        if (!d.progress || typeof d.progress !== 'object') d.progress = {};
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

  // r = { key, score, time, wave, kills, result }. Mengembalikan true jika skor rekor baru.
  function submitResult(mode, r) {
    const key = r.key || mode.id, d = load(), old = getRecord(key) || { score: 0, wave: 0, time: null };
    const rec = { score: old.score, wave: old.wave, time: old.time };
    const newRecord = r.score > old.score;
    if (newRecord) rec.score = Math.round(r.score);
    if (r.wave > rec.wave) rec.wave = r.wave;
    if (mode.timeRecord === 'max' && r.time > (rec.time || 0)) rec.time = r.time;
    if (mode.timeRecord === 'min' && r.result === 'win' && (rec.time == null || r.time < rec.time)) rec.time = r.time;
    d.records[key] = rec;
    d.stats.games = num(d.stats.games) + 1;
    d.stats.wins = num(d.stats.wins) + (r.result === 'win' ? 1 : 0);
    d.stats.kills = num(d.stats.kills) + r.kills;
    d.stats.time = num(d.stats.time) + r.time;
    save(d);
    return newRecord;
  }

  function getFlag(k) { return load().flags[k] === true; }
  function setFlag(k) { const d = load(); d.flags[k] = true; save(d); }

  // Jumlah level yang terbuka (minimal 1).
  function getUnlocked(id) { const n = load().progress[id]; return (typeof n === 'number' && isFinite(n) && n >= 1) ? Math.floor(n) : 1; }
  function unlock(id, n) { const d = load(); d.progress[id] = Math.max(getUnlocked(id), n); save(d); }

  // Loadout kemampuan (maksimal 2, unik, hanya id yang dikenal).
  function getLoadout() {
    const l = load().loadout, out = [];
    if (Array.isArray(l)) for (const id of l) if (A.AbilityOrder.indexOf(id) >= 0 && out.indexOf(id) < 0 && out.length < 2) out.push(id);
    return (Array.isArray(l)) ? out : DEFAULT_LOADOUT.slice();
  }
  function setLoadout(arr) { const d = load(); d.loadout = arr.slice(0, 2); save(d); }

  A.Storage = { getRecord, submitResult, getFlag, setFlag, getUnlocked, unlock, getLoadout, setLoadout };
})(window.Arena);
