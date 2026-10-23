(function (A) {
  function add(s, n) { s.score += Math.round(n); }
  // Combo hanya berlaku pada mode yang mengaktifkannya (mode.combo = true).
  function onKill(s, e) {
    s.kills++;
    let pts = e.d.score;
    if (s.mode.combo) { s.combo++; s.comboT = 2.2; pts *= 1 + 0.1 * Math.min(s.combo - 1, 10); }
    add(s, pts);
  }
  A.Scoring = { add, onKill };
})(window.Arena);
