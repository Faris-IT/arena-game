(function (A) {
  const UP = [
    { id: 'dmg',    name: 'Peluru kuat',     cat: 'Damage',     desc: '+25% damage tembakan per level' },
    { id: 'rate',   name: 'Tembak cepat',    cat: 'Damage',     desc: '-15% jeda tembak per level' },
    { id: 'multi',  name: 'Tembak ganda',    cat: 'Damage',     desc: '+1 peluru menyebar per level' },
    { id: 'spd',    name: 'Langkah ringan',  cat: 'Kecepatan',  desc: '+12% kecepatan gerak per level' },
    { id: 'energy', name: 'Reaktor energi',  cat: 'Kecepatan',  desc: '+50% regenerasi energi per level' },
    { id: 'range',  name: 'Jangkauan jauh',  cat: 'Jangkauan',  desc: '+20% jarak peluru dan jangkauan tembak otomatis per level' },
    { id: 'hp',     name: 'Armor tebal',     cat: 'Pertahanan', desc: '+25 health maksimum dan pulih 25 per level' },
    { id: 'guard',  name: 'Lapis pelindung', cat: 'Pertahanan', desc: '-15% damage yang diterima per level' },
    { id: 'regen',  name: 'Nanobot',         cat: 'Pertahanan', desc: 'Memulihkan 1,5 health per detik per level' }
  ];

  function recalc(s) {
    const lv = id => s.up[id] || 0, m = s.player.mods;
    m.dmg = 1 + 0.25 * lv('dmg'); m.rate = Math.pow(0.85, lv('rate')); m.multi = lv('multi');
    m.spd = 1 + 0.12 * lv('spd'); m.energy = 1 + 0.5 * lv('energy'); m.range = 1 + 0.2 * lv('range');
    m.guard = Math.pow(0.85, lv('guard')); m.regen = 1.5 * lv('regen');
  }

  // Tiga pilihan acak: upgrade yang dimiliki (jika belum maksimal) atau baru (jika slot masih ada).
  // opt.slots = Infinity berarti build tanpa batas slot (Endless Survival).
  function offer(s, opt) {
    const slots = opt.slots, maxLv = opt.maxLv, used = Object.keys(s.up).length;
    const pool = UP.filter(u => { const l = s.up[u.id] || 0; return l > 0 ? l < maxLv : used < slots; });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return pool.slice(0, 3).map(u => {
      const l = s.up[u.id] || 0;
      return { title: u.name, tag: u.cat, desc: u.desc,
        note: l ? 'Level ' + l + ' → ' + (l + 1) : (slots === Infinity ? 'Baru' : 'Baru · slot ' + (used + 1) + '/' + slots),
        pick(st) {
          st.up[u.id] = (st.up[u.id] || 0) + 1;
          if (u.id === 'hp') { const q = st.player.stats; q.maxHealth += 25; q.health = Math.min(q.maxHealth, q.health + 25); }
          recalc(st);
        } };
    });
  }

  A.Upgrades = { UP, recalc, offer };
})(window.Arena);
