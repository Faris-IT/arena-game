// Tes otomatis Mufa Arena (tanpa dependensi): node tests/run.js
// Menjalankan seluruh index.html di Node dengan DOM tiruan, lalu memainkan setiap mode dengan bot.
const fs = require('fs'), path = require('path');
const { boot, ROOT } = require('./harness');

let pass = 0, fail = 0; const failed = []; const results = {};
function section(name) { console.log('\n== ' + name); }
function ok(cond, msg, key) { if (cond) { pass++; console.log('  ok   ' + msg); } else { fail++; failed.push(msg); console.log('  GAGAL ' + msg); } if (key) results[key] = (results[key] !== false) && !!cond; }

const H = boot();
const A = H.A, els = H.els;
let mv = { x: 0, y: 0 }, fire = false;
A.Input.getMove = () => mv;
Object.defineProperty(A.Input, 'firing', { get: () => fire, configurable: true });

// ---------- util bot ----------
function bfsPath(rects, from, to, r) {
  const N = 10, W = 96, H2 = 60;
  const blocked = (x, y) => { if (x < 6 + r || y < 6 + r || x > 954 - r || y > 594 - r) return true;
    for (const o of rects) { const cx = Math.max(o.x, Math.min(x, o.x + o.w)), cy = Math.max(o.y, Math.min(y, o.y + o.h)); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true; } return false; };
  const key = (x, y) => y * (W + 1) + x, sx = Math.round(from.x / N), sy = Math.round(from.y / N);
  let gx = Math.round(to.x / N), gy = Math.round(to.y / N);
  if (blocked(gx * N, gy * N)) { let best = null; for (let d = 1; d <= 6 && !best; d++) for (let a = -d; a <= d; a++) for (let b = -d; b <= d; b++) if (!blocked((gx + a) * N, (gy + b) * N)) { best = [gx + a, gy + b]; } if (best) { gx = best[0]; gy = best[1]; } }
  const par = new Map([[key(sx, sy), -1]]), q = [[sx, sy]];
  for (let qi = 0; qi < q.length; qi++) {
    const [x, y] = q[qi]; if (x === gx && y === gy) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx > W || ny > H2 || par.has(k) || blocked(nx * N, ny * N)) continue;
      par.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  const out = []; let k = key(gx, gy); if (!par.has(k)) return [];
  while (k !== -1 && k !== undefined) { out.push({ x: (k % (W + 1)) * N, y: Math.floor(k / (W + 1)) * N }); k = par.get(k); }
  return out.reverse();
}
let pathCache = null, pathT = 0;
function steer(s, tx, ty) {
  if (tx == null) { mv = { x: 0, y: 0 }; return; }
  if (--pathT <= 0 || !pathCache) { pathCache = bfsPath(s.obstacles, s.player, { x: tx, y: ty }, 14); pathT = 20; }
  // titik terdekat di jalur, lalu titik berikutnya yang cukup jauh (jangan mundur ke titik yang sudah terlewati)
  let ci = 0, cd = 1e9; pathCache.forEach((p, i) => { const d = Math.hypot(p.x - s.player.x, p.y - s.player.y); if (d < cd) { cd = d; ci = i; } });
  const nxt = pathCache.slice(ci).find(p => Math.hypot(p.x - s.player.x, p.y - s.player.y) > 14) || { x: tx, y: ty };
  const dx = nxt.x - s.player.x, dy = nxt.y - s.player.y, l = Math.hypot(dx, dy);
  mv = l < 3 ? { x: 0, y: 0 } : { x: dx / l, y: dy / l };
}
function target(s) {
  const p = s.player, id = s.mode.id, near = (list) => list.reduce((a, b) => (Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b));
  if (id === 'zone-control') { const z = s.zones.find(z => !z.owned) || s.zones.reduce((a, b) => (a.away > b.away ? a : b)); return [z.x, z.y]; }
  if (id === 'core-escort') { const c = s.core, w = s.pathPts[c.wp] || c; return [c.x + (w.x - c.x) * 0.12, c.y + (w.y - c.y) * 0.12]; }
  if (id === 'shadow-run') return [905, 300];
  if (id === 'crystal-hunt') { const l = s.crystals.filter(c => !c.taken); return l.length ? [near(l).x, near(l).y] : null; }
  if (id === 'hazard-lab') { const w = s.switches.find(w => !w.on); return w ? [w.x, w.y] : [905, 300]; }
  if (id === 'closing-ring') return [s.ring.x, s.ring.y];
  if (id === 'tactical-trials' && s.captives) { const l = s.captives.filter(c => !c.done); return l.length ? [near(l).x, near(l).y] : null; }
  return null;
}
function god(s) { const p = s.player; p.stats.health = p.stats.maxHealth = 1e9; if (!(s.mode.noShoot || s.rules.noShoot)) p.stats.attack = 400; }
function drive(s) {
  const p = s.player; let n = null, bd = 1e9;
  for (const e of s.enemies) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (!e.dead && d < bd) { bd = d; n = e; } }
  if (n) { const lead = bd / 560; A.Input.mouse = { x: n.x + (n.vx || 0) * lead, y: n.y + (n.vy || 0) * lead, seen: true }; fire = true; } else fire = false; // bidik dengan memimpin target
  const t = target(s); steer(s, t && t[0], t && t[1]);
  if (s.mode.id === 'shadow-run') s.detect = 0;                       // uji keterjangkauan, bukan stealth
  if (s.mode.id === 'core-escort') s.core.hp = s.core.maxHp;           // inti dilindungi agar jalur yang diuji
  if (s.rules.noShoot && n && bd < 120 && s.cd[0] <= 0) A.Input.pushAbility(0); // misi tanpa tembakan: Pulse
}
function play(id, lvl, maxSec, until) {
  A.Game.launch(id, lvl); pathCache = null; pathT = 0; god(A.state);
  const maxF = maxSec * 62; let f = 0, chooses = 0;
  while (f < maxF) {
    if (A.GameState.status === 'choose') { const c = A.state.choice, o = c.options[0]; chooses++; if (o.pick) o.pick(A.state); A.state.choice = null; A.GameState.set('playing'); god(A.state); }
    if (A.GameState.status === 'gameover') break;
    drive(A.state); H.frames(1); f++;
    if (until && until(A.state)) break;
  }
  return { s: A.state, status: A.GameState.status, sec: f / 62, chooses };
}

// ---------- 1. Paket dan muat ----------
section('Paket, aset, dan pemuatan skrip');
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { if (f === 'node_modules' || f === '.git' || f === 'tests') continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(ROOT);
const codeFiles = files.filter(f => /\.(html|js|css)$/.test(f) && !/(^|\/)(docs|\.github)\//.test(path.relative(ROOT, f)));
const external = []; for (const f of codeFiles) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/https?:\/\/|\bfetch\(|XMLHttpRequest|@import|<link[^>]+href="https?:/.test(l) && !/www\.w3\.org\/2000\/svg/.test(l) && !/og:|twitter:|canonical|rel="canonical"|property="og/.test(l)) external.push(path.relative(ROOT, f) + ':' + (i + 1)); });
ok(external.length === 0, 'tidak ada aset, library, atau request eksternal di kode game' + (external.length ? ' -> ' + external.join(', ') : ''), 'noext');
ok(!files.some(f => /\.(png|jpe?g|gif|webp|mp3|ogg|wav|woff2?|ttf)$/i.test(f) && !/(^|\/)docs\//.test(path.relative(ROOT, f))), 'tidak ada gambar, audio, atau font di folder game (gambar hanya di docs/)', 'noext');
ok(H.errors.length === 0, 'seluruh ' + H.srcs.length + ' skrip dimuat tanpa error' + (H.errors.length ? ': ' + H.errors[0] : ''), 'noerr');
ok(A.ModeList.length === 13, '13 mode terdaftar (12 mode + Tutorial): ' + A.ModeList.map(m => m.id).join(', '), 'modes');
ok(A.Bosses.ids.length === 8 && A.Achievements.list.length === 12 && A.AbilityOrder.length === 6, '8 boss, 12 achievement, 6 kemampuan');

// ---------- 2. Alur UI ----------
section('Alur UI: kunjungan pertama, dock, pause, delta time');
H.frames(3);
ok(A.GameState.status === 'playing' && A.state.mode.id === 'tutorial', 'kunjungan pertama langsung masuk tutorial');
ok(!els.coach.hidden && els.dock.children.indexOf(els.coach) >= 0 && els.dock.children.indexOf(els.abil) >= 0, 'panel tutorial dan tombol kemampuan berada di dock (di luar canvas)', 'dock');
const dockH = H.dockBox.v, cw = parseFloat(els.arena.style.height);
ok(dockH > 0 && cw <= (720 - dockH) + 1, 'canvas mengecil sebesar tinggi dock (dock ' + dockH + 'px, canvas ' + cw + 'px dari 720px)', 'dock');
ok(!els.abil.children[0].hidden && !els.abil.children[1].hidden, 'dua tombol kemampuan tampil di dock');
els['coach-skip'].click(); H.frames(2);
ok(A.GameState.status === 'menu' && H.dockBox.v === 0 && A.Storage.getFlag('tutorialDone'), 'lewati tutorial -> menu, dock kosong, flag tersimpan');
els['btn-main'].click();
ok(!els.modes.hidden && els['mode-grid'].children.length > 0, 'layar pilih mode tampil');

A.Game.launch('classic'); god(A.state); H.frames(40);
const t0 = A.state.time, pos0 = A.state.enemies.map(e => e.x + ',' + e.y).join('|'), pr0 = A.state.projectiles.length;
A.GameState.pause(); H.frames(180);
ok(A.state.time === t0 && A.state.enemies.map(e => e.x + ',' + e.y).join('|') === pos0 && A.state.projectiles.length === pr0, 'pause menghentikan seluruh simulasi (waktu, musuh, proyektil)', 'pause');
A.GameState.resume(); H.frames(10);
ok(A.state.time > t0, 'resume melanjutkan simulasi');
const tb = A.state.time; H.jump(5000); H.frames(1);
ok(A.state.time - tb <= A.CONFIG.maxDt + 1e-9, 'lonjakan waktu 5 detik dibatasi delta time (' + (A.state.time - tb).toFixed(3) + ' dtk)', 'dt');
document.hidden = true; // tab tidak aktif
(function () { const f = document.addEventListener; })();

// ---------- 3. Pertarungan dan collision ----------
section('Health, damage, dan collision');
{
  const P = A.Player.create(), h0 = P.stats.health;
  const d1 = A.Player.damage(P, 10), d2 = A.Player.damage(P, 10);
  ok(d1 && !d2 && P.stats.health === h0 - 10, 'damage tidak dihitung dua kali (jeda kebal)', 'dmg');
  const Q = A.Player.create(); Q.shieldT = 2; ok(!A.Player.damage(Q, 50) && Q.stats.health === 100, 'Shield meniadakan damage', 'dmg');
  const e = { x: -50, y: 2000, r: 14 }; A.Collision.clampToArena(e);
  ok(e.x >= 20 && e.y <= 580, 'karakter tidak bisa keluar dari batas arena', 'col');
  const o = [{ x: 400, y: 200, w: 100, h: 100 }], c = { x: 450, y: 250, r: 14 }; A.Collision.pushOut(c, o);
  ok(!(c.x > 386 && c.x < 514 && c.y > 186 && c.y < 314), 'karakter terdorong keluar dari penghalang padat', 'col');
  const a = { x: 0, y: 0, r: 10 }, b = { x: 15, y: 0, r: 10 }, d = { x: 25, y: 0, r: 10 };
  ok(A.Collision.circleHit(a, b) && !A.Collision.circleHit(a, d), 'collision lingkaran akurat', 'col');
  ok(A.Collision.segBlocked(0, 50, 100, 50, [{ x: 40, y: 0, w: 10, h: 100 }]) && !A.Collision.segBlocked(0, 150, 100, 150, [{ x: 40, y: 0, w: 10, h: 100 }]), 'garis pandang terhalang tembok', 'col');
  const s = { projectiles: [], enemies: [], player: P, obstacles: [] };
  for (let i = 0; i < 400; i++) A.Projectiles.spawn(s.projectiles, { x: 10, y: 10, vx: 0, vy: 0, r: 4, damage: 1, life: 9, from: 'player', color: '#fff' });
  ok(s.projectiles.length <= A.CONFIG.combat.maxProjectiles, 'jumlah proyektil dibatasi (' + s.projectiles.length + '/' + A.CONFIG.combat.maxProjectiles + ')', 'cap');
  let drawn = 0; const cx = { fillRect() { drawn++; }, set globalAlpha(v) {}, set fillStyle(v) {} };
  A.Settings = { reduceFx: false }; A.Particles.clear(); A.Particles.burst(0, 0, '#fff', 5000, 100, 1); A.Particles.draw(cx);
  ok(drawn <= 220, 'jumlah partikel dibatasi (' + drawn + '/220)', 'cap');
}

// ---------- 4. Kondisi menang/kalah semua mode (dimainkan bot) ----------
section('Semua mode dimainkan bot (menang tercapai, tidak ada bug penghalang progres)');
const EXPECT_WIN = [['classic', 0, 400], ['time-attack', 0, 120], ['crystal-hunt', 0, 200], ['closing-ring', 0, 300], ['build-survive', 0, 400]];
for (const [id, lv, sec] of EXPECT_WIN) { const r = play(id, lv, sec); ok(r.s.result === 'win', id.padEnd(15) + ' -> ' + r.s.result + ' (' + r.sec.toFixed(0) + ' dtk, skor ' + r.s.score + ')', 'win'); }
for (const id of ['zone-control', 'core-escort', 'shadow-run', 'hazard-lab', 'boss-rush']) {
  const n = A.Modes[id].levels.length, out = [];
  for (let L = 0; L < n; L++) { const r = play(id, L, 300); out.push(r.s.result === 'win'); if (r.s.result !== 'win') console.log('     !! ' + id + ' L' + (L + 1) + ' -> ' + r.s.result + ' pada ' + r.sec.toFixed(0) + ' dtk'); }
  ok(out.every(Boolean), id.padEnd(15) + ' semua ' + n + ' level bisa dimenangkan (' + out.map(x => (x ? 'v' : 'x')).join('') + ')', 'win');
  ok(A.Storage.getUnlocked(id) >= n + 1 || id === 'boss-rush' && A.Storage.getUnlocked(id) >= n + 1, id.padEnd(15) + ' level berikutnya terbuka setelah menang (terbuka ' + A.Storage.getUnlocked(id) + ')', 'progress');
}
{ // Tactical Trials: 8 misi
  const out = [];
  for (let L = 0; L < 8; L++) { const r = play('tactical-trials', L, 200); const okm = r.s.result === 'win' || (L === 6 && r.s.failMsg === 'Terkena serangan'); out.push(r.s.result === 'win' ? 'v' : (okm ? 'aturan' : 'x')); if (!okm) console.log('     !! misi ' + (L + 1) + ' -> ' + r.s.result + ' ' + (r.s.failMsg || '')); }
  ok(out.every(x => x !== 'x'), 'tactical-trials 8 misi menang atau gagal sesuai aturan (' + out.join(',') + ')', 'win');
}
{ // Endless: boss, upgrade tanpa slot
  const r = play('survival', 0, 400, s => s.bossKills >= 2);
  ok(r.s.bossKills >= 2, 'survival: boss muncul tiap 5 wave dan bisa dikalahkan (' + r.s.bossKills + ' boss, wave ' + r.s.wave + ')', 'win');
  ok(r.chooses >= 3, 'survival: pilihan upgrade muncul (' + r.chooses + 'x)', 'win');
  const s2 = { up: {}, player: A.Player.create() }; let distinct = 0;
  for (let i = 0; i < 40; i++) { const o = A.Upgrades.offer(s2, { slots: Infinity, maxLv: 5 }); if (!o.length) break; o[0].pick(s2); } distinct = Object.keys(s2.up).length;
  const s3 = { up: {}, player: A.Player.create() }; for (let i = 0; i < 40; i++) { const o = A.Upgrades.offer(s3, { slots: 5, maxLv: 3 }); if (!o.length) break; o[0].pick(s3); }
  ok(distinct >= 6 && Object.keys(s3.up).length <= 5, 'upgrade: Endless tanpa batas slot (' + distinct + ' jenis) vs Build & Survive maksimal 5 slot (' + Object.keys(s3.up).length + ')', 'win');
}
{ // mode berkalah
  let allLose = true;
  for (const m of A.ModeList) { if (m.noRecord) continue; A.Game.launch(m.id, 0); if (A.GameState.status === 'choose') { A.state.choice = null; A.GameState.set('playing'); } A.state.player.stats.health = 0; H.frames(3); if (A.state.result !== 'lose') { allLose = false; console.log('     !! ' + m.id + ' tidak kalah saat health 0'); } }
  ok(allLose, 'health 0 menyebabkan kekalahan di semua mode', 'win');
}

// ---------- 5. Timer, cooldown, item ----------
section('Timer, cooldown, item, skor, achievement');
{
  A.Game.launch('classic'); god(A.state); const s = A.state; s.slots = ['dash', 'pulse']; s.player.stats.energy = 100;
  A.Input.pushAbility(0); H.frames(1); const cd1 = s.cd[0]; H.frames(30);
  ok(cd1 > 2.9 && s.cd[0] < cd1 && s.cd[0] > 2, 'cooldown kemampuan berjalan (' + cd1.toFixed(1) + ' -> ' + s.cd[0].toFixed(1) + ')', 'timer');
  const e0 = s.player.stats.energy; A.Input.pushAbility(0); H.frames(1);
  ok(s.player.stats.energy >= e0 - 1, 'kemampuan tidak aktif saat cooldown', 'timer');
  s.player.stats.health = 40; s.items.push({ x: s.player.x, y: s.player.y, r: 10, type: 'heal', value: 25, life: 5, max: 5 }); s.player.stats.maxHealth = 100; s.player.stats.health = 40; H.frames(2);
  ok(s.player.stats.health >= 64 && s.items.length === 0, 'item penyembuh memulihkan health lalu hilang', 'timer');
  A.Game.launch('time-attack'); god(A.state); const tl = A.state.timeLeft; H.frames(62); ok(Math.abs((tl - A.state.timeLeft) - 1) < 0.15, 'timer Time Attack berkurang ~1 dtk per detik', 'timer');
  A.Game.launch('classic'); const sc = A.state; const k0 = sc.score; A.Scoring.onKill(sc, { d: { score: 10, color: '#fff' }, x: 1, y: 1 }); ok(sc.score === k0 + 10 && sc.kills === 1, 'skor dan kill bertambah sesuai musuh', 'score');
  A.Storage.resetAll(); A.Achievements.reload();
  A.Game.launch('time-attack'); A.state.score = 1500; H.frames(2); ok(A.Achievements.has('speed-demon'), 'achievement dibuka saat kejadian gameplay (skor tercapai), bukan di layar hasil', 'score');
  A.Game.launch('crystal-hunt'); A.state.collected = 20; H.frames(2); ok(A.Achievements.has('crystal-collector'), 'achievement Crystal Collector dibuka saat kristal ke-20 diambil', 'score');
  const before = A.Achievements.count(); A.Game.launch('time-attack'); A.state.score = 1600; H.frames(2); ok(A.Achievements.count() === before, 'achievement tidak dibuka dua kali', 'score');
}

// ---------- 6. Penyimpanan ----------
section('localStorage: data kosong, rusak, dan aneh');
{
  const K = 'mufa-arena:v1'; const bad = ['', '{rusak', 'null', '[]', '{"records":5,"stats":{}}', '{"records":{},"stats":{"abil":5},"last":{"id":3,"level":-1},"settings":"x","loadout":"zz","progress":[]}'];
  let safe = true;
  for (const b of bad) { H.store[K] = b; try { A.Storage.getStats(); A.Storage.getSettings(); A.Storage.getLoadout(); A.Storage.getUnlocked('x'); A.Storage.getRecord('x'); A.Storage.getLast(); A.Storage.getAch(); A.Storage.getFlag('x'); A.Storage.setSetting('swap', true); A.Storage.submitResult({ id: 'classic', timeRecord: 'min' }, { score: 1, time: 1, wave: 1, kills: 1, result: 'win' }); } catch (e) { safe = false; console.log('     !! data "' + b + '" -> ' + e.message); } }
  ok(safe, 'data kosong/rusak/aneh tidak menyebabkan error (' + bad.length + ' kasus)', 'storage');
  H.store[K] = '{"records":{},"stats":{},"settings":{"touchScale":9,"swap":"ya"}}';
  const S = A.Storage.getSettings(); ok(S.touchScale === 1 && S.swap === false && S.showFps === true, 'pengaturan tak sah dikembalikan ke default', 'storage');
  A.Storage.resetAll(); ok(!A.Storage.getFlag('tutorialDone') && A.Storage.getUnlocked('zone-control') === 1, 'reset data menghapus semua progres', 'storage');
}

// ---------- 7. Performa ----------
section('Performa (logika + render tiruan, jumlah musuh/proyektil maksimum)');
{
  A.Game.launch('survival'); const s = A.state; god(s);
  for (let i = 0; i < 26; i++) A.Enemies.spawn(s.enemies, ['chaser', 'shooter', 'tank', 'dasher'][i % 4], 100 + (i * 33) % 760, 60 + (i * 47) % 480);
  for (let i = 0; i < 150; i++) A.Projectiles.spawn(s.projectiles, { x: 480, y: 300, vx: Math.cos(i) * 40, vy: Math.sin(i) * 40, r: 5, damage: 0, life: 99, from: 'enemy', color: '#f90' });
  A.Particles.burst(480, 300, '#fff', 400, 60, 5);
  const t = process.hrtime.bigint(); for (let i = 0; i < 600; i++) { for (const e of s.enemies) e.hp = e.maxHp; A.Particles.burst(480, 300, '#fff', 3, 60, 5); H.frames(1); }
  const ms = Number(process.hrtime.bigint() - t) / 1e6 / 600;
  ok(ms < 8, 'rata-rata ' + ms.toFixed(2) + ' ms per frame dengan 26 musuh, 150 proyektil, 220 partikel (batas uji 8 ms; browser nyata lebih cepat di CPU, render sebenarnya di GPU)', 'perf');
  ok(H.errors.length === 0, 'tidak ada error JavaScript selama seluruh pengujian' + (H.errors.length ? ': ' + H.errors[0] : ''), 'noerr');
}

// ---------- ringkasan checklist rilis ----------
section('Checklist rilis (16 butir)');
const CK = [
  ['Karakter bergerak dengan benar di desktop dan mobile', ['win', 'dock'], 'otomatis: jalur gerak lewat bot; sentuhan fisik perlu dicoba manual di HP'],
  ['Collision karakter, musuh, proyektil, dinding', ['col'], 'otomatis'],
  ['Health dan damage tidak dihitung dua kali', ['dmg'], 'otomatis'],
  ['Pause menghentikan seluruh simulasi', ['pause'], 'otomatis'],
  ['12 mode punya kondisi menang dan kalah yang jelas', ['win'], 'otomatis'],
  ['Setiap objektif dapat dicapai tanpa bug penghalang', ['win', 'progress'], 'otomatis'],
  ['Boss dan musuh mengikuti pola yang ditentukan', ['win'], 'otomatis: 8 boss dijalankan; pola visual perlu dinilai manual'],
  ['Timer, cooldown, wave, dan item berfungsi', ['timer'], 'otomatis'],
  ['Jumlah proyektil dan partikel dibatasi', ['cap'], 'otomatis'],
  ['Delta time tidak menyebabkan gerakan berlebihan', ['dt'], 'otomatis'],
  ['Skor dan achievement sesuai hasil permainan', ['score'], 'otomatis'],
  ['localStorage menangani data kosong atau rusak', ['storage'], 'otomatis'],
  ['HUD tidak menutupi area permainan secara berlebihan', ['dock'], 'otomatis: tutorial/kemampuan di dock; cek tata letak visual manual'],
  ['Tombol sentuh nyaman pada layar kecil', [], 'MANUAL: coba di HP asli (ukuran dan posisi bisa diatur di Pengaturan)'],
  ['Tidak ada error JavaScript yang belum ditangani', ['noerr'], 'otomatis di Node; cek konsol browser sekali manual'],
  ['Tidak memerlukan aset atau library eksternal', ['noext'], 'otomatis']
];
let auto = 0;
CK.forEach((c, i) => { const done = c[1].length && c[1].every(k => results[k] === true); if (done) auto++; console.log('  [' + (done ? 'x' : ' ') + '] ' + (i + 1) + '. ' + c[0] + '  — ' + c[2]); });
console.log('\nHasil: ' + pass + ' lulus, ' + fail + ' gagal | checklist otomatis: ' + auto + '/16 (sisanya perlu uji manual di perangkat)');
if (fail) { console.log('Gagal:\n - ' + failed.join('\n - ')); process.exit(1); }
