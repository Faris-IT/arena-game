(function (A) {
  const KEY = 'mufa-arena:v1';
  const num = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0);
  const blank = () => ({ records: {}, stats: { games: 0, wins: 0, kills: 0, time: 0 } });

  // Data kosong atau rusak ditangani dengan aman: kembali ke data awal.
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && typeof d === 'object' && d.records && typeof d.records === 'object' && d.stats && typeof d.stats === 'object') return d;
    } catch (e) { /* abaikan */ }
    return blank();
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* penyimpanan penuh/diblokir */ } }

  function getRecord(id) {
    const r = load().records[id];
    if (!r || typeof r !== 'object') return null;
    return { score: num(r.score), wave: num(r.wave), time: (typeof r.time === 'number' && isFinite(r.time) && r.time > 0) ? r.time : null };
  }

  // r = { score, time, wave, kills, result }. Mengembalikan true jika skor rekor baru.
  function submitResult(mode, r) {
    const d = load(), old = getRecord(mode.id) || { score: 0, wave: 0, time: null };
    const rec = { score: old.score, wave: old.wave, time: old.time };
    const newRecord = r.score > old.score;
    if (newRecord) rec.score = Math.round(r.score);
    if (r.wave > rec.wave) rec.wave = r.wave;
    if (mode.timeRecord === 'max' && r.time > (rec.time || 0)) rec.time = r.time;
    if (mode.timeRecord === 'min' && r.result === 'win' && (rec.time == null || r.time < rec.time)) rec.time = r.time;
    d.records[mode.id] = rec;
    d.stats.games = num(d.stats.games) + 1;
    d.stats.wins = num(d.stats.wins) + (r.result === 'win' ? 1 : 0);
    d.stats.kills = num(d.stats.kills) + r.kills;
    d.stats.time = num(d.stats.time) + r.time;
    save(d);
    return newRecord;
  }

  A.Storage = { getRecord, submitResult };
})(window.Arena);
