(function (A) {
  const canvas = document.getElementById('arena');

  A.Game = {
    newGame() {
      A.state = { player: A.Player.create(), enemies: [], projectiles: [], mode: A.Modes.prototype,
                  score: 0, kills: 0, time: 0, result: null, wave: 0 };
      A.state.mode.start(A.state);
    }
  };

  A.Game.newGame();
  A.Renderer.init(canvas);
  A.Input.init(canvas);
  A.UI.init();
  A.GameLoop.start();
})(window.Arena);
