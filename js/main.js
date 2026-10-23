(function (A) {
  const canvas = document.getElementById('arena');

  A.Game = {
    newGame(id) {
      const mode = A.Modes[id] || A.Modes.classic;
      A.state = { player: A.Player.create(), enemies: [], projectiles: [], items: [], crystals: [], obstacles: [],
                  mode, score: 0, kills: 0, time: 0, result: null, wave: 0, combo: 0, newRecord: false };
      mode.start(A.state);
    }
  };

  A.Game.newGame('classic'); // keadaan awal untuk latar menu
  A.Renderer.init(canvas);
  A.Input.init(canvas);
  A.UI.init();
  A.GameLoop.start();
})(window.Arena);
