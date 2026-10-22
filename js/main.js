(function (A) {
  const canvas = document.getElementById('arena');
  A.state = { player: A.Player.create() };
  A.Renderer.init(canvas);
  A.Input.init(canvas);
  A.UI.init();
  A.GameLoop.start();
})(window.Arena);
