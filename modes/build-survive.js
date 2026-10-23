(function (A) {
  const U = A.Util, TOTAL = 12, SLOTS = 5, MAXLV = 3;
  const UP = [
    { id: 'dmg',    name: 'Peluru kuat',      cat: 'Damage',     desc: '+25% damage tembakan per level' },
    { id: 'rate',   name: 'Tembak cepat',     cat: 'Damage',     desc: '-15% jeda tembak per level' },
    { id: 'multi',  name: 'Tembak ganda',     cat: 'Damage',     desc: '+1 peluru menyebar per level' },
    { id: 'spd',    name: 'Langkah ringan',   cat: 'Kecepatan',  desc: '+12% kecepatan gerak per level' },
    { id: 'energy', name: 'Reaktor energi',   cat: 'Kecepatan',  desc: '+50% regenerasi energi per level' },
    { id: 'range',  name: 'Jangkauan jauh',   cat: 'Jangkauan',  desc: '+20% jarak peluru dan jangkauan tembak otomatis per level' },
    { id: 'hp',     name: 'Armor tebal',      cat: 'Pertahanan', desc: '+25 health maksimum dan pulih 25 per level' },
    { id: 'guard',  name: 'Lapis pelindung',  cat: 'Pertahanan', desc: '-15% damage yang diterima per level' },
    { id: 'regen',  name: 'Nanobot',          cat: 'Pertahanan', desc: 'Memulihkan 1,5 health per detik per level' }
  ];

  function recalc(s) {
    const lv = id => s.up[id] || 0, m = s.player.mods;
    m.dmg = 1 + 0.25 * lv('dmg'); m.rate = Math.pow(0.85, lv('rate')); m.multi = lv('multi');
    m.spd = 1 + 0.12 * lv('spd'); m.energy = 1 + 0.5 * lv('energy'); m.range = 1 + 0.2 * lv('range');
    m.guard = Math.pow(0.85, lv('guard')); m.regen = 1.5 * lv('regen');
  }

  // Tiga pilihan acak: upgrade yang sudah dimiliki (jika belum maksimal) atau baru (jika slot masih ada).
  function offer(s) {
    const used = Object.keys(s.up).length;
    const pool = UP.filter(u => { const l = s.up[u.id] || 0; return l > 0 ? l < MAXLV : used < SLOTS; });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return pool.slice(0, 3).map(u => {
      const l = s.up[u.id] || 0;
      return { title: u.name, tag: u.cat, desc: u.desc, note: l ? 'Level ' + l + ' → ' + (l + 1) : 'Baru · slot ' + (used + 1) + '/' + SLOTS,
        pick(st) {
          st.up[u.id] = (st.up[u.id] || 0) + 1;
          if (u.id === 'hp') { const q = st.player.stats; q.maxHealth += 25; q.health = Math.min(q.maxHealth, q.health + 25); }
          recalc(st);
        } };
    });
  }

  U.register({
    id: 'build-survive', name: 'Build & Survive', difficulty: 'Sedang', timeRecord: 'min', hasWaves: true,
    objective: 'Selesaikan 12 wave sambil membangun kombinasi upgrade.',
    rules: 'Tiap wave selesai kamu memilih 1 dari 3 upgrade. Hanya ada 5 slot, jadi pilih dengan cermat. Setiap upgrade bisa naik sampai level 3.',
    start(s) { s.up = {}; s.wave = 0; s.waveTimer = 1.2; s.pending = []; s.spawnCd = 0; s.cleared = true; },
    hud(s) { return 'Wave ' + Math.max(1, s.wave) + '/' + TOTAL + ' · Slot ' + Object.keys(s.up).length + '/' + SLOTS; },
    update(s, dt) {
      if (s.pending.length) { U.tick(s, dt); return null; }
      if (s.enemies.length) return null;
      if (!s.cleared) {
        s.cleared = true; A.Scoring.add(s, 60 * s.wave);
        if (s.wave >= TOTAL) { A.Scoring.add(s, s.player.stats.health * 2); return 'win'; }
        A.Items.spawnHeal(s, 25, 14); s.waveTimer = 2;
        const options = offer(s);
        if (options.length) A.Game.choose({ title: 'Pilih upgrade', text: 'Wave ' + s.wave + ' selesai. Pilih satu upgrade.', options });
        return null;
      }
      s.waveTimer -= dt;
      if (s.waveTimer <= 0) { s.wave++; s.pending = U.composition(s.wave, 0.9); s.cleared = false; s.spawnCd = 0; }
      return null;
    }
  });
})(window.Arena);
