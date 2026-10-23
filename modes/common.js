// Utilitas bersama untuk semua mode: daftar mode, antrean spawn, komposisi wave.
(function (A) {
  A.Modes = {};
  A.ModeList = [];
  // Metadata tampilan kartu mode: grup, warna aksen, ikon SVG (viewBox 24).
  const META = {
    'tutorial':     { group: 'Pelatihan',     color: '#8a97ab', icon: 'M12 3L22 8 12 13 2 8Z M6 10.5V16C6 18.5 18 18.5 18 16V10.5 M22 8V14' },
    'classic':      { group: 'Mode dasar',    color: '#22e4ff', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7v10 M7 12h10' },
    'time-attack':  { group: 'Mode dasar',    color: '#ff9a3c', icon: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16 M12 8v4.5l3 2 M9 2h6' },
    'survival':     { group: 'Mode dasar',    color: '#ff3df2', icon: 'M5 12c0-4 5-4 7 0s7 4 7 0-5-4-7 0-7 4-7 0' },
    'crystal-hunt': { group: 'Mode dasar',    color: '#6ff7ff', icon: 'M12 3l7 8-7 10-7-10z M5 11h14' },
    'zone-control': { group: 'Mode objektif', color: '#4dff9a', icon: 'M4 4h16v16H4z M9 9h6v6H9z' },
    'core-escort':  { group: 'Mode objektif', color: '#ffd23c', icon: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z M12 9v6 M9 12h6' },
    'shadow-run':   { group: 'Mode objektif', color: '#b36bff', icon: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5' },
    'closing-ring': { group: 'Mode objektif', color: '#ff5d5d', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8' }
  };
  A.Util = {
    META,
    fmtTime(t) { t = Math.max(0, Math.ceil(t)); const m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; },
    register(mode) { A.Modes[mode.id] = mode; A.ModeList.push(mode); },
    // Komposisi wave: jenis musuh baru muncul bertahap seiring nomor wave.
    composition(w, k) {
      const n = Math.min(26, Math.round(3 + w * 1.6 * (k || 1))), out = [];
      for (let i = 0; i < n; i++) {
        const r = Math.random();
        out.push(w >= 7 && r < 0.12 ? 'tank' : w >= 5 && r < 0.30 ? 'dasher' : w >= 3 && r < 0.55 ? 'shooter' : 'chaser');
      }
      return out;
    },
    // Memunculkan musuh dari antrean s.pending satu per satu.
    tick(s, dt) {
      if (!s.pending.length) return;
      s.spawnCd -= dt;
      if (s.spawnCd <= 0) { A.Enemies.spawnAtEdge(s.enemies, s.pending.pop(), s.player); s.spawnCd = 0.35; }
    }
  };
})(window.Arena);
