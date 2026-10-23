(function (A) {
  const listeners = [];
  const GS = {
    status: 'menu', // 'menu' | 'playing' | 'paused' | 'gameover'
    onChange(fn) { listeners.push(fn); },
    set(s) { if (GS.status === s) return; GS.status = s; listeners.forEach(fn => fn(s)); },
    start() { GS.set('playing'); },
    pause() { if (GS.status === 'playing') GS.set('paused'); },
    resume() { if (GS.status === 'paused') GS.set('playing'); },
    toMenu() { GS.set('menu'); },
    togglePause() { if (GS.status === 'playing') GS.pause(); else if (GS.status === 'paused') GS.resume(); }
  };
  A.GameState = GS;
})(window.Arena);
