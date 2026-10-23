(function (A) {
  const canvas = document.getElementById('arena');

  A.Game = {
    newGame(id, lvl) {
      const mode = A.Modes[id] || A.Modes.classic;
      const s = A.state = {
        player: A.Player.create(), enemies: [], projectiles: [], items: [], crystals: [], obstacles: [], hazards: [],
        mines: [], fields: [], fx: [], mode, level: lvl || 0, rules: {}, up: {}, slots: [], cd: [0, 0], cdMax: [1, 1],
        abilCount: 0, abilUses: {}, choice: null, score: 0, kills: 0, time: 0, result: null, wave: 0, combo: 0, newRecord: false
      };
      mode.start(s);
      s.slots = A.Abilities.slotsFor(s); // setelah start: misi bisa memaksa/melarang kemampuan
    },
    // Mulai mode/level; jika mode punya briefing (misi), tampilkan dulu.
    launch(id, lvl) {
      A.Game.newGame(id, lvl);
      const s = A.state;
      if (s.mode.brief) { s.choice = s.mode.brief(s); A.GameState.set('choose'); } else A.GameState.start();
    },
    // Jeda simulasi dan tampilkan pilihan (upgrade, briefing).
    choose(c) { A.state.choice = c; A.GameState.set('choose'); }
  };

  A.Game.newGame('classic'); // keadaan awal untuk latar menu
  A.Renderer.init(canvas);
  A.Input.init(canvas);
  A.UI.init();
  A.GameLoop.start();

  // Pengunjung baru langsung masuk tutorial.
  if (!A.Storage.getFlag('tutorialDone')) A.Game.launch('tutorial');
})(window.Arena);
