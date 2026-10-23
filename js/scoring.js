(function (A) {
  function add(s, n) { s.score += Math.round(n); }
  // Combo hanya berlaku pada mode yang mengaktifkannya (mode.combo = true).
  function onKill(s, e) {
    s.kills++;
    let pts = e.d.score;
    if (s.mode.combo) { s.combo++; s.comboT = 2.2; pts *= 1 + 0.1 * Math.min(s.combo - 1, 10); }
    add(s, pts);
    const boss = !!e.d.boss;
    A.Particles.burst(e.x, e.y, e.d.color, boss ? 40 : 10, boss ? 260 : 150, boss ? 0.8 : 0.45);
    if (boss) { s.bossKills++; A.Particles.shakeBy(9); A.Achievements.event('boss', s); }
  }
  A.Scoring = { add, onKill };
})(window.Arena);
