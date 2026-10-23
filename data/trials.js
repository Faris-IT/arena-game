// Misi Tactical Trials. Aturan setiap misi ditampilkan sebelum mulai (lihat brief di mode).
window.Arena = window.Arena || {};
(function (A) {
  const spawnN = (s, type, n) => { for (let i = 0; i < n; i++) A.Enemies.spawnAtEdge(s.enemies, type, s.player); };
  const setWaves = (s, total, off, k) => { s.pending = []; s.spawnCd = 0; s.mw = { total, cur: 0, off, k, timer: 1 }; };
  function waves(s, dt) { // true jika semua wave selesai
    const w = s.mw;
    if (s.pending.length) { A.Util.tick(s, dt); return false; }
    if (s.enemies.length) return false;
    if (w.cur >= w.total) return true;
    w.timer -= dt;
    if (w.timer <= 0) { w.cur++; s.pending = A.Util.composition(w.cur + w.off, w.k); s.spawnCd = 0; w.timer = 1.5; }
    return false;
  }
  const clock = (s, dt) => { s.timeLeft -= dt; if (s.timeLeft <= 0) { s.timeLeft = 0; s.failMsg = 'Waktu habis'; return true; } return false; };
  const wv = s => 'Wave ' + Math.max(1, s.mw.cur) + '/' + s.mw.total;

  A.Trials = [
    { name: 'Pemburu Shooter', desc: 'Kalahkan 3 Shooter yang bersembunyi di antara Chaser. Chaser lain boleh diabaikan.',
      start(s) { spawnN(s, 'shooter', 3); s.pending = ['chaser', 'chaser', 'chaser', 'chaser']; s.spawnCd = 1; },
      hud: s => 'Shooter tersisa ' + s.enemies.filter(e => e.type === 'shooter').length,
      update(s, dt) { A.Util.tick(s, dt); return s.enemies.every(e => e.type !== 'shooter') ? 'win' : null; } },
    { name: 'Tanpa kemampuan', desc: 'Selesaikan 2 wave tanpa memakai kemampuan sama sekali. Memakai satu saja berarti gagal.',
      start(s) { setWaves(s, 2, 2, 1); },
      hud: s => wv(s),
      update(s, dt) { if (s.abilCount > 0) { s.failMsg = 'Melanggar aturan'; return 'lose'; } return waves(s, dt) ? 'win' : null; } },
    { name: 'Selamatkan korban', desc: 'Sentuh 3 korban untuk menyelamatkan mereka dalam 100 detik. Setiap korban dijaga musuh yang bergerak saat kamu mendekat.',
      start(s) {
        s.timeLeft = 100;
        s.captives = [{ x: 200, y: 150, r: 14, done: false }, { x: 760, y: 450, r: 14, done: false }, { x: 300, y: 490, r: 14, done: false }];
        for (const c of s.captives) { A.Enemies.spawn(s.enemies, 'chaser', c.x + 45, c.y, 150); A.Enemies.spawn(s.enemies, 'chaser', c.x - 45, c.y, 150); }
      },
      hud: s => 'Korban ' + s.captives.filter(c => c.done).length + '/3 · ' + A.Util.fmtTime(s.timeLeft),
      drawBelow(ctx, s) { for (const c of s.captives) if (!c.done) { ctx.strokeStyle = '#6ff7ff'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(111,247,255,.18)'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 4, 0, 6.2832); ctx.fill(); ctx.stroke(); } },
      update(s, dt) {
        if (clock(s, dt)) return 'lose';
        for (const c of s.captives) if (!c.done && Math.hypot(s.player.x - c.x, s.player.y - c.y) < c.r + s.player.r) { c.done = true; A.Scoring.add(s, 200); }
        return s.captives.every(c => c.done) ? 'win' : null;
      } },
    { name: 'Health tipis', desc: 'Mulai dengan health 35 tanpa item penyembuh. Selesaikan 2 wave.',
      start(s) { s.rules.noHeal = true; s.player.stats.health = 35; setWaves(s, 2, 2, 1); },
      hud: s => wv(s), update(s, dt) { return waves(s, dt) ? 'win' : null; } },
    { name: 'Tanpa tembakan', desc: 'Senjata dimatikan. Kalahkan 6 Chaser hanya dengan Pulse dan Mine dalam 90 detik.',
      start(s) { s.rules.noShoot = true; s.rules.forced = ['pulse', 'mine']; s.timeLeft = 90; s.pending = ['chaser', 'chaser', 'chaser', 'chaser', 'chaser', 'chaser']; s.spawnCd = 1; },
      hud: s => 'Musuh ' + (s.enemies.length + s.pending.length) + ' · ' + A.Util.fmtTime(s.timeLeft),
      update(s, dt) { if (clock(s, dt)) return 'lose'; A.Util.tick(s, dt); return (!s.pending.length && !s.enemies.length) ? 'win' : null; } },
    { name: 'Kejar waktu', desc: 'Selesaikan 3 wave dalam 75 detik.',
      start(s) { s.timeLeft = 75; setWaves(s, 3, 2, 1); },
      hud: s => wv(s) + ' · ' + A.Util.fmtTime(s.timeLeft),
      update(s, dt) { if (clock(s, dt)) return 'lose'; return waves(s, dt) ? 'win' : null; } },
    { name: 'Tanpa disentuh', desc: 'Selesaikan 2 wave tanpa terkena damage sekali pun.',
      start(s) { setWaves(s, 2, 3, 1); },
      hud: s => wv(s),
      update(s, dt) { if (s.player.hitCount > 0) { s.failMsg = 'Terkena serangan'; return 'lose'; } return waves(s, dt) ? 'win' : null; } },
    { name: 'Ujian akhir', desc: 'Mulai dengan health 60 tanpa item penyembuh. Selesaikan 3 wave berat dalam 150 detik.',
      start(s) { s.rules.noHeal = true; s.player.stats.health = 60; s.timeLeft = 150; setWaves(s, 3, 3, 1.2); },
      hud: s => wv(s) + ' · ' + A.Util.fmtTime(s.timeLeft),
      update(s, dt) { if (clock(s, dt)) return 'lose'; return waves(s, dt) ? 'win' : null; } }
  ];
})(window.Arena);
