// 12 achievement, dicek dari kejadian gameplay nyata (kill boss, skor, waktu, kristal), bukan saat layar hasil dibuka.
(function (A) {
  const LIST = [
    { id: 'first-victory',     name: 'First Victory',     desc: 'Menang di satu permainan (di luar tutorial).', icon: 'M5 4h14v6a7 7 0 0 1-14 0z M12 17v4 M8 21h8' },
    { id: 'wave-breaker',      name: 'Wave Breaker',      desc: 'Menyelesaikan 10 wave Arena Classic.', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7v10 M7 12h10' },
    { id: 'speed-demon',       name: 'Speed Demon',       desc: 'Mencapai skor 1500 di Time Attack.', icon: 'M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M12 8v4.5l3 2' },
    { id: 'survivor',          name: 'Survivor',          desc: 'Bertahan 5 menit di Endless Survival.', icon: 'M5 12c0-4 5-4 7 0s7 4 7 0-5-4-7 0-7 4-7 0' },
    { id: 'zone-master',       name: 'Zone Master',       desc: 'Menyelesaikan semua level Zone Control.', icon: 'M4 4h16v16H4z M9 9h6v6H9z' },
    { id: 'crystal-collector', name: 'Crystal Collector', desc: 'Mengumpulkan seluruh 20 kristal dalam satu permainan.', icon: 'M12 3l7 8-7 10-7-10z M5 11h14' },
    { id: 'boss-slayer',       name: 'Boss Slayer',       desc: 'Mengalahkan boss pertamamu.', icon: 'M3 18l2-10 5 5 2-7 2 7 5-5 2 10z' },
    { id: 'shadow-agent',      name: 'Shadow Agent',      desc: 'Menyelesaikan semua level Shadow Run.', icon: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5' },
    { id: 'last-circle',       name: 'Last Circle',       desc: 'Menang di Closing Ring.', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8' },
    { id: 'build-expert',      name: 'Build Expert',      desc: 'Menyelesaikan Build & Survive.', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3' },
    { id: 'hazard-specialist', name: 'Hazard Specialist', desc: 'Menyelesaikan 10 level Hazard Lab.', icon: 'M12 3l10 18H2z M12 10v5 M12 18v.5' },
    { id: 'arena-legend',      name: 'Arena Legend',      desc: 'Menyelesaikan seluruh misi Tactical Trials.', icon: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z' }
  ];
  let have = null;
  const owned = () => have || (have = new Set(Object.keys(A.Storage.getAch())));
  const allWon = (id, n) => { for (let i = 0; i < n; i++) { const r = A.Storage.getRecord(id + '#' + i); if (!r || r.time == null) return false; } return true; };

  function unlock(id, s) {
    if (owned().has(id)) return;
    have.add(id); A.Storage.unlockAch(id);
    const a = LIST.find(x => x.id === id);
    if (s && s.newAch) s.newAch.push(a.name);
    if (A.UI && A.UI.toast) A.UI.toast('Pencapaian: ' + a.name);
  }

  A.Achievements = {
    list: LIST,
    reload() { have = null; },
    has(id) { return owned().has(id); },
    count() { return owned().size; },
    // Dicek tiap langkah simulasi (murah: hanya perbandingan angka).
    tick(s) {
      const m = s.mode.id;
      if (m === 'time-attack' && s.score >= 1500) unlock('speed-demon', s);
      else if (m === 'survival' && s.time >= 300) unlock('survivor', s);
      else if (m === 'crystal-hunt' && s.collected >= 20) unlock('crystal-collector', s);
    },
    event(type, s) { if (type === 'boss') unlock('boss-slayer', s); },
    // Dipanggil sekali saat permainan berakhir, setelah rekor disimpan.
    onEnd(s, result) {
      const m = s.mode;
      if (m.noRecord || result !== 'win') return;
      unlock('first-victory', s);
      if (m.id === 'classic') unlock('wave-breaker', s);
      else if (m.id === 'closing-ring') unlock('last-circle', s);
      else if (m.id === 'build-survive') unlock('build-expert', s);
      else if (m.id === 'zone-control' && allWon(m.id, m.levels.length)) unlock('zone-master', s);
      else if (m.id === 'shadow-run' && allWon(m.id, m.levels.length)) unlock('shadow-agent', s);
      else if (m.id === 'hazard-lab' && allWon(m.id, m.levels.length)) unlock('hazard-specialist', s);
      else if (m.id === 'tactical-trials' && allWon(m.id, m.levels.length)) unlock('arena-legend', s);
    }
  };
})(window.Arena);
