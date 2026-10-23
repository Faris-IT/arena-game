// Enam kemampuan karakter. cost = energi, cd = cooldown (detik).
window.Arena = window.Arena || {};
Arena.AbilityOrder = ['dash', 'shield', 'pulse', 'mine', 'slow', 'heal'];
Arena.AbilityData = {
  dash:   { name: 'Dash',       cost: 20, cd: 3,  color: '#22e4ff', desc: 'Melesat cepat dan kebal sesaat untuk menghindari ancaman.', icon: 'M4 12h12 M12 6l6 6-6 6' },
  shield: { name: 'Shield',     cost: 30, cd: 10, color: '#7aa2ff', dur: 3, desc: 'Meniadakan semua damage selama 3 detik.', icon: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z' },
  pulse:  { name: 'Pulse',      cost: 35, cd: 6,  color: '#ff3df2', desc: 'Ledakan energi yang melukai dan mendorong musuh di sekitar.', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18' },
  mine:   { name: 'Mine',       cost: 25, cd: 8,  color: '#ff9a3c', desc: 'Pasang jebakan yang meledak saat musuh mendekat (maksimal 3).', icon: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M12 4v3 M12 17v3 M4 12h3 M17 12h3' },
  slow:   { name: 'Slow Field', cost: 30, cd: 12, color: '#6ff7ff', dur: 5, desc: 'Medan yang memperlambat musuh di dalamnya selama 5 detik.', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 3' },
  heal:   { name: 'Heal',       cost: 40, cd: 20, color: '#4dff9a', desc: 'Memulihkan 35 health.', icon: 'M12 5v14 M5 12h14' }
};
