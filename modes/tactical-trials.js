(function (A) {
  const U = A.Util;
  U.register({
    id: 'tactical-trials', name: 'Tactical Trials', difficulty: 'Sulit', timeRecord: 'min',
    levels: A.Trials.map(t => ({ name: t.name, desc: t.desc })),
    objective: 'Selesaikan 8 misi dengan batasan khusus.',
    rules: 'Setiap misi punya aturan berbeda yang ditampilkan sebelum mulai: target tertentu, tanpa kemampuan, menyelamatkan objek, atau health minim.',
    start(s) { s.M = A.Trials[s.level]; s.failMsg = null; s.M.start(s); },
    brief(s) {
      const M = A.Trials[s.level];
      return { title: 'Misi ' + (s.level + 1) + ': ' + M.name, text: M.desc, options: [{ title: 'Mulai misi', tag: 'Siap', desc: 'Aturan di atas berlaku selama misi.' }] };
    },
    hud(s) { return s.M.hud(s); },
    endTitle(s, result) { return result === 'lose' ? s.failMsg : null; },
    drawBelow(ctx, s) { if (s.M.drawBelow) s.M.drawBelow(ctx, s); },
    update(s, dt) { return s.M.update(s, dt); }
  });
})(window.Arena);
