// Tutorial interaktif 8 langkah, termasuk penjelasan energi dan semua kemampuan. Tidak bisa kalah dan tidak mencatat rekor.
(function (A) {
  const U = A.Util;
  const touch = () => document.body.classList.contains('touch');
  const STEPS = [
    { title: 'Bergerak',
      d: 'Gunakan WASD atau tombol panah untuk bergerak. Jelajahi arena sebentar.',
      t: 'Gunakan joystick kiri untuk bergerak. Jelajahi arena sebentar.',
      prog: s => Math.min(1, s.tut.moved / 400), done: s => s.tut.moved >= 400 },
    { title: 'Bidik dan tembak',
      d: 'Arahkan bidikan dengan mouse, klik atau tekan Space untuk menembak. Tembakan juga otomatis jika musuh searah bidikan. Hancurkan 3 target.',
      t: 'Joystick kanan membidik sekaligus menembak. Hancurkan 3 target.',
      enter(s) { [[700, 170], [745, 300], [700, 430]].forEach(p => A.Enemies.spawn(s.enemies, 'dummy', p[0], p[1])); },
      prog: s => Math.min(1, s.kills / 3), done: s => s.kills >= 3 },
    { title: 'Hindari dan kalahkan',
      d: 'Sentuhan musuh dan proyektil mengurangi health (bar hijau di kiri atas). Terus bergerak, hindari tembakan, lalu kalahkan Chaser dan Shooter.',
      t: 'Sentuhan musuh dan proyektil mengurangi health (bar hijau). Terus bergerak, hindari tembakan, lalu kalahkan Chaser dan Shooter.',
      enter(s) { A.Enemies.spawnAtEdge(s.enemies, 'chaser', s.player); A.Enemies.spawnAtEdge(s.enemies, 'shooter', s.player); },
      prog: s => 1 - s.enemies.length / 2, done: s => s.enemies.length === 0 },
    { title: 'Ambil item penyembuh',
      d: 'Sentuh item hijau untuk memulihkan health. Di mode asli item punya batas waktu, jadi cepat ambil.',
      t: 'Sentuh item hijau untuk memulihkan health. Di mode asli item punya batas waktu, jadi cepat ambil.',
      enter(s) { s.player.stats.health = Math.min(s.player.stats.health, 40); A.Items.spawnHeal(s, 60, 9999); },
      prog: s => (s.items.length === 0 ? 1 : 0), done: s => s.items.length === 0 },
    { title: 'Energi dan Dash',
      d: 'Bar biru di bawah health adalah energi. Tiap kemampuan memakai energi dan punya cooldown (lihat tombolnya di bawah arena). Tekan Shift untuk Dash: melesat cepat dan kebal sesaat. Coba sekarang.',
      t: 'Bar biru di bawah health adalah energi. Tiap kemampuan memakai energi dan punya cooldown (lihat tombolnya di bawah arena). Ketuk tombol Dash: melesat cepat dan kebal sesaat.',
      prog: s => ((s.abilUses.dash || 0) >= 1 ? 1 : 0), done: s => (s.abilUses.dash || 0) >= 1 },
    { title: 'Serang dengan Pulse',
      d: 'Pulse (tombol Q) meledak di sekitarmu: melukai dan mendorong musuh yang dekat. Biarkan musuh mendekat lalu tekan Q.',
      t: 'Pulse meledak di sekitarmu: melukai dan mendorong musuh yang dekat. Biarkan musuh mendekat lalu ketuk tombol Pulse.',
      enter(s) { [[700, 150], [740, 300], [700, 450]].forEach(p => A.Enemies.spawn(s.enemies, 'chaser', p[0], p[1])); },
      tick(s) { // pastikan ada musuh selama Pulse belum dicoba
        if ((s.abilUses.pulse || 0) < 1 && s.enemies.length === 0) { A.Enemies.spawnAtEdge(s.enemies, 'chaser', s.player); A.Enemies.spawnAtEdge(s.enemies, 'chaser', s.player); }
      },
      prog: s => ((s.abilUses.pulse || 0) >= 1 ? 0.6 : 0) + (s.enemies.length === 0 ? 0.4 : 0),
      done: s => (s.abilUses.pulse || 0) >= 1 && s.enemies.length === 0 },
    { title: 'Kenali semua kemampuan', info: true,
      d: 'Dash: melesat dan kebal sesaat. Shield: kebal 3 detik. Pulse: ledakan di sekitar. Mine: ranjau jebakan. Slow Field: memperlambat musuh. Heal: pulihkan 35 health. Pilih 2 kemampuan lewat menu Kemampuan; beberapa mode membatasinya.',
      t: 'Dash: melesat dan kebal sesaat. Shield: kebal 3 detik. Pulse: ledakan di sekitar. Mine: ranjau jebakan. Slow Field: memperlambat musuh. Heal: pulihkan 35 health. Pilih 2 kemampuan lewat menu Kemampuan; beberapa mode membatasinya.',
      prog: s => (s.tut.next ? 1 : 0), done: s => !!s.tut.next },
    { title: 'Jeda permainan',
      d: 'Tekan Esc atau P untuk menjeda, lalu pilih Lanjutkan.',
      t: 'Tekan tombol II di kanan atas untuk menjeda, lalu pilih Lanjutkan.',
      prog: s => (A.GameState.pauseCount > s.tut.pauseBase ? 1 : 0), done: s => A.GameState.pauseCount > s.tut.pauseBase }
  ];

  function enter(s) { const st = STEPS[s.tut.i]; if (st && st.enter) st.enter(s); }

  U.register({
    id: 'tutorial', name: 'Tutorial', difficulty: 'Mudah', noRecord: true, noDeath: true, retryLabel: 'Ulangi tutorial', forcedAbilities: ['dash', 'pulse'],
    objective: 'Pelajari gerak, tembak, item, dan semua kemampuan dalam 8 langkah singkat.',
    rules: 'Tanpa risiko kalah. Bisa diulang kapan saja.',
    start(s) {
      s.tut = { i: 0, moved: 0, lx: s.player.x, ly: s.player.y, pauseBase: A.GameState.pauseCount, endT: 0, next: false };
      enter(s);
    },
    hud() { return 'Tutorial'; },
    coach(s) {
      const t = s.tut, n = STEPS.length;
      if (t.i >= n) return { n, total: n, title: 'Tutorial selesai!', text: 'Kamu siap bermain. Sebentar lagi kamu diarahkan ke menu.', p: 1 };
      const st = STEPS[t.i];
      return { n: t.i + 1, total: n, title: st.title, text: touch() ? st.t : st.d, p: st.prog(s), info: !!st.info };
    },
    endTitle() { return 'Tutorial selesai!'; },
    endSummary() { return 'Kamu sudah siap. Pilih mode di menu utama.'; },
    onEnd(s, result) { if (result === 'win') A.Storage.setFlag('tutorialDone'); },
    update(s, dt) {
      const t = s.tut, p = s.player;
      t.moved += Math.hypot(p.x - t.lx, p.y - t.ly); t.lx = p.x; t.ly = p.y;
      if (t.i >= STEPS.length) { t.endT += dt; return t.endT > 2.5 ? 'win' : null; }
      const st = STEPS[t.i];
      if (st.tick) st.tick(s);
      if (st.done(s)) { t.i++; if (t.i < STEPS.length) enter(s); }
      return null;
    }
  });
})(window.Arena);
