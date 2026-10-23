// Data musuh: variasi datang dari perilaku, bukan dari gambar.
window.Arena = window.Arena || {};
Arena.EnemyData = {
  chaser:  { sides: 0, r: 12, speed: 115, hp: 20, damage: 10, score: 10, color: '#ff3df2' },
  shooter: { sides: 4, r: 13, speed: 80,  hp: 25, damage: 8,  score: 20, color: '#ff9a3c',
             keep: 230, fireRate: 1.5, projSpeed: 240, projDamage: 8 },
  tank:    { sides: 6, r: 22, speed: 55,  hp: 90, damage: 18, score: 40, color: '#b36bff' },
  dasher:  { sides: 3, r: 12, speed: 95,  hp: 22, damage: 14, score: 25, color: '#ffd23c',
             dashSpeed: 560, windup: 0.6, dashTime: 0.35, cooldown: 1.8 }
};
