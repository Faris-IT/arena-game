// Utilitas bersama untuk semua mode: daftar mode, antrean spawn, komposisi wave.
(function (A) {
  A.Modes = {};
  A.ModeList = [];
  A.Util = {
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
