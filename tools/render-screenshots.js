// Membuat cuplikan permainan TANPA browser: menjalankan game di Node, merekam perintah gambar renderer asli (Canvas 2D),
// lalu tools/rasterize.py (Pillow) mengubahnya menjadi PNG. Dipakai untuk gambar di README.
//   node tools/render-screenshots.js && python3 tools/rasterize.py
const fs = require('fs'), path = require('path');
const { boot } = require('../tests/harness');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

// ---- perekam Canvas 2D ----
function makeRecorder() {
  const rec = { ops: [] };
  let m = [1, 0, 0, 1, 0, 0]; const stack = [];
  let sub = [], cur = null;
  const st = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, dash: [], font: '12px sans-serif', textAlign: 'left' };
  const tf = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const mul = n => { const a = m; m = [a[0] * n[0] + a[2] * n[1], a[1] * n[0] + a[3] * n[1], a[0] * n[2] + a[2] * n[3], a[1] * n[2] + a[3] * n[3], a[0] * n[4] + a[2] * n[5] + a[4], a[1] * n[4] + a[3] * n[5] + a[5]]; };
  const newSub = (x, y) => { cur = [tf(x, y)]; sub.push({ pts: cur, closed: false }); };
  const style = v => (v && typeof v === 'object' ? { grad: v } : v);
  const emit = (t, extra) => rec.ops.push(Object.assign({ t, color: style(t === 'stroke' ? st.strokeStyle : st.fillStyle), alpha: st.globalAlpha, lw: st.lineWidth * Math.hypot(m[0], m[1]), dash: st.dash.slice() }, extra));
  const rectSub = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(p => tf(p[0], p[1]));
  const ctx = {
    save() { stack.push([m.slice(), Object.assign({}, st)]); }, restore() { const s = stack.pop(); if (s) { m = s[0]; Object.assign(st, s[1]); } },
    translate(x, y) { mul([1, 0, 0, 1, x, y]); }, rotate(a) { mul([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); }, scale(x, y) { mul([x, 0, 0, y, 0, 0]); },
    setTransform() {}, setLineDash(d) { st.dash = d || []; }, clearRect() {},
    beginPath() { sub = []; cur = null; }, closePath() { if (sub.length) sub[sub.length - 1].closed = true; },
    moveTo(x, y) { newSub(x, y); }, lineTo(x, y) { if (!cur) newSub(x, y); else cur.push(tf(x, y)); },
    rect(x, y, w, h) { sub.push({ pts: rectSub(x, y, w, h), closed: true }); cur = null; },
    arc(x, y, r, a0, a1) {
      const full = Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6, n = Math.max(14, Math.ceil(r * 0.9));
      const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push(tf(x + Math.cos(a) * r, y + Math.sin(a) * r)); }
      if (cur && !full) cur.push(...pts); else { cur = pts; sub.push({ pts: cur, closed: full }); }
    },
    fill(rule) { emit('fill', { sub: sub.map(s => s.pts), evenodd: rule === 'evenodd' }); },
    stroke() { emit('stroke', { sub: sub.map(s => ({ pts: s.pts, closed: s.closed })) }); },
    fillRect(x, y, w, h) {
      if (x === 0 && y === 0 && w === 960 && h === 600 && st.fillStyle === '#090c13') rec.ops = []; // awal frame
      const save = sub; sub = []; ctx.rect(x, y, w, h); ctx.fill(); sub = save;
    },
    strokeRect(x, y, w, h) { emit('stroke', { sub: [{ pts: rectSub(x, y, w, h), closed: true }] }); },
    fillText(text, x, y) { const p = tf(x, y); emit('text', { text, x: p[0], y: p[1], font: st.font, align: st.textAlign }); },
    createRadialGradient(x0, y0, r0, x1, y1, r1) { const g = { kind: 'radial', x0, y0, r0, x1, y1, r1, stops: [], addColorStop(o, c) { g.stops.push([o, c]); } }; return g; },
    createLinearGradient() { return { kind: 'linear', stops: [], addColorStop() {} }; }
  };
  for (const k of ['fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'font', 'textAlign']) Object.defineProperty(ctx, k, { get: () => st[k], set: v => { st[k] = v; } });
  Object.defineProperty(ctx, 'lineCap', { get: () => 'butt', set: () => {} });
  Object.defineProperty(ctx, 'lineJoin', { get: () => 'miter', set: () => {} });
  rec.ctx = ctx; return rec;
}

// ---- adegan ----
const scenes = [
  { file: 'boss-rush', mode: 'boss-rush', level: 6, until: s => s.boss && s.hazards.some(h => h.state === 'warn') && s.projectiles.length > 10 && s.time > 12, max: 60 },
  { file: 'shadow-run', mode: 'shadow-run', level: 1, until: s => s.time > 4.5, max: 20, route: [[200, 300], [330, 300]] },
  { file: 'zone-control', mode: 'zone-control', level: 2, until: s => s.time > 22, max: 40 },
  { file: 'hazard-lab', mode: 'hazard-lab', level: 4, until: s => s.hazards.filter(h => h.state === 'on').length >= 1 && s.time > 3, max: 30 },
  { file: 'closing-ring', mode: 'closing-ring', level: 0, until: s => s.ring.lvl >= 2 && !s.ring.shrinking && s.time > 45, max: 120 },
  { file: 'core-escort', mode: 'core-escort', level: 2, until: s => s.time > 26, max: 60 }
];

for (const sc of scenes) {
  const rec = makeRecorder(), H = boot({ ctx: rec.ctx }), A = H.A;
  let mv = { x: 0, y: 0 }, fire = false;
  A.Input.getMove = () => mv; Object.defineProperty(A.Input, 'firing', { get: () => fire, configurable: true });
  A.Storage.setFlag('tutorialDone'); A.Game.launch(sc.mode, sc.level);
  let s = A.state; const P = s.player; P.stats.health = P.stats.maxHealth = 1e9; if (!(s.mode.noShoot || s.rules.noShoot)) P.stats.attack = sc.mode === 'boss-rush' ? 5 : 45; // boss tidak boleh keburu kalah
  let f = 0, t = 0;
  while (f < sc.max * 62) {
    if (A.GameState.status !== 'playing') break;
    let n = null, bd = 1e9; for (const e of s.enemies) { const d = Math.hypot(e.x - P.x, e.y - P.y); if (!e.dead && d < bd) { bd = d; n = e; } }
    if (n) { const lead = bd / 560; A.Input.mouse = { x: n.x + n.vx * lead, y: n.y + n.vy * lead, seen: true }; fire = true; } else fire = false;
    t += 0.016; // gerak melingkar pelan agar adegan terlihat hidup
    mv = sc.route ? (Math.hypot(P.x - sc.route[1][0], P.y - sc.route[1][1]) > 8 ? { x: Math.sign(sc.route[1][0] - P.x), y: Math.sign(sc.route[1][1] - P.y) * 0.3 } : { x: 0, y: 0 }) : { x: Math.cos(t * 0.9) * 0.8, y: Math.sin(t * 0.9) * 0.8 };
    if (s.mode.id === 'shadow-run') s.detect = Math.min(s.detect, 38);
    if (s.mode.id === 'core-escort') s.core.hp = Math.max(s.core.hp, 70);
    H.frames(1); f++;
    if (sc.until(s)) break;
  }
  H.frames(1);
  fs.writeFileSync(path.join(OUT, sc.file + '.json'), JSON.stringify({ ops: rec.ops }));
  console.log(sc.file.padEnd(14), 'op', String(rec.ops.length).padStart(4), '| waktu', s.time.toFixed(1) + 's', '| status', A.GameState.status, '| musuh', s.enemies.length, '| proyektil', s.projectiles.length, '| error', H.errors.length);
}
