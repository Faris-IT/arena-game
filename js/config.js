window.Arena = window.Arena || {};
Arena.CONFIG = {
  width: 960,          // ukuran logis arena
  height: 600,
  wall: 6,             // tebal dinding
  maxDt: 0.05,         // batas delta time (detik) agar tidak melompat saat lag
  player: { radius: 14, speed: 260, accel: 14, health: 100, energy: 100, attack: 10, fireRate: 0.28 },
  combat: {
    invuln: 0.6,        // jeda kebal setelah terkena damage (mencegah damage ganda)
    maxProjectiles: 150,
    bullet: { speed: 560, radius: 4, life: 0.9, range: 420, cone: 0.35 } // cone = toleransi sudut tembak otomatis (rad)
  },
  colors: { bg: '#090c13', grid: 'rgba(34,228,255,.06)', wall: '#22e4ff', player: '#22e4ff', aim: '#ff3df2', bullet: '#9ff5ff' }
};
