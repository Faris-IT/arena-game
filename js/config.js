window.Arena = window.Arena || {};
Arena.CONFIG = {
  width: 960,          // ukuran logis arena
  height: 600,
  wall: 6,             // tebal dinding
  maxDt: 0.05,         // batas delta time (detik) agar tidak melompat saat lag
  player: { radius: 14, speed: 260, accel: 14, health: 100, energy: 100, attack: 10, fireRate: 0.3 },
  colors: { bg: '#090c13', grid: 'rgba(34,228,255,.06)', wall: '#22e4ff', player: '#22e4ff', aim: '#ff3df2' }
};
