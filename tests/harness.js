// DOM tiruan + pemuat skrip: menjalankan index.html di Node tanpa browser dan tanpa dependensi.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

class Elem {
  constructor(id, hidden) {
    this.id = id; this.hidden = !!hidden; this._text = ''; this.children = []; this.style = { setProperty() {}, width: '' };
    this.dataset = {}; this._cls = new Set(); this.L = {}; this.attrs = {}; this.scrollTop = 0; this.disabled = false; this._q = {}; this.title = ''; this.className = '';
    const self = this;
    this.classList = { add: c => self._cls.add(c), remove: c => self._cls.delete(c), contains: c => self._cls.has(c),
      toggle: (c, f) => { (f === undefined ? !self._cls.has(c) : f) ? self._cls.add(c) : self._cls.delete(c); } };
  }
  get textContent() { return this._text; }
  set textContent(v) { this._text = v; if (v === '') this.children = []; }
  append(...n) { this.children.push(...n); }
  appendChild(n) { this.children.push(n); return n; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(t, f) { (this.L[t] = this.L[t] || []).push(f); }
  fire(t, e) { (this.L[t] || []).forEach(f => f(e || { preventDefault() {}, pointerId: 1, clientX: 0, clientY: 0 })); }
  click() { if (!this.disabled) this.fire('click'); }
  querySelector(s) { return this._q[s] || (this._q[s] = new Elem(s, false)); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: this.id === 'dock' ? (this._cls.has('empty') ? 0 : 90) : 600 }; }
  focus() {} blur() {} setPointerCapture() {}
  get width() { return this._w || 960; } set width(v) { this._w = v; }
  get height() { return this._h || 600; } set height(v) { this._h = v; }
}

function boot(opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const els = {}; let m; const re = /<(\w+)([^>]*?)id="([^"]+)"([^>]*)>/g;
  while ((m = re.exec(html))) els[m[3]] = new Elem(m[3], /\bhidden\b/.test(m[2] + m[4]));
  els.dock._cls.add('empty');
  els.abil.children = [new Elem('b0', true), new Elem('b1', true)];
  els.dock.children = [els.toast, els.coach, els.abil];
  const ctx = opts.ctx || new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (typeof t[k] !== 'undefined' ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  els.arena.getContext = () => ctx;
  const store = {}, body = new Elem('body', false), root = new Elem('html', false), dockBox = { v: 0 };
  const backs = Array.from(html.matchAll(/class="ghost back-menu"/g)).map((_, i) => new Elem('back' + i, false));
  Object.assign(global, {
    window: global, innerWidth: opts.w || 1280, innerHeight: opts.h || 720, devicePixelRatio: 1,
    addEventListener: () => {}, matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ getPropertyValue: () => String(dockBox.v) }),
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
    document: { body, documentElement: Object.assign(root, { style: { setProperty: (k, v) => { if (k === '--dock') dockBox.v = parseFloat(v); } } }),
      getElementById: id => { if (!els[id]) throw new Error('getElementById tidak ada: ' + id); return els[id]; },
      createElement: t => new Elem(t, false), createElementNS: (n, t) => new Elem(t, false),
      querySelectorAll: s => (s === '.back-menu' ? backs : []), addEventListener() {}, hidden: false }
  });
  let raf = null; global.requestAnimationFrame = cb => { raf = cb; };
  const errors = [];
  const srcs = [...html.matchAll(/<script src="([^"]+)">/g)].map(x => x[1]);
  for (const s of srcs) { try { (0, eval)(fs.readFileSync(path.join(ROOT, s), 'utf8')); } catch (e) { errors.push(s + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); } }
  let T = 0;
  const frames = n => { for (let i = 0; i < n; i++) { T += 16; const cb = raf; raf = null; try { if (cb) cb(T); } catch (e) { errors.push(e.stack.split('\n').slice(0, 4).join(' | ')); } } };
  return { A: global.Arena, els, frames, body, store, errors, srcs, html, dockBox, jump: ms => { T += ms; } };
}
module.exports = { boot, ROOT };
