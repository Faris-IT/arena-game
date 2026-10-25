"""Mengubah rekaman perintah gambar (docs/screenshots/*.json) menjadi PNG memakai Pillow. Lihat render-screenshots.js."""
import json, re, sys, glob, os
from PIL import Image, ImageDraw, ImageChops, ImageFont

SS = 2                      # supersampling untuk tepi halus
W, H = 960 * SS, 600 * SS
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def parse(c):
    c = c.strip()
    if c.startswith('#'):
        h = c[1:]; h = ''.join(x * 2 for x in h) if len(h) == 3 else h
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0)
    m = re.match(r'rgba?\(([^)]+)\)', c)
    if m:
        p = [float(x) for x in m.group(1).split(',')]
        return (int(p[0]), int(p[1]), int(p[2]), p[3] if len(p) > 3 else 1.0)
    m = re.match(r'hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)', c)
    if m:
        import colorsys
        h, s, l = float(m.group(1)) / 360, float(m.group(2)) / 100, float(m.group(3)) / 100
        r, g, b = colorsys.hls_to_rgb(h, l, s); return (int(r * 255), int(g * 255), int(b * 255), 1.0)
    return (255, 255, 255, 1.0)

def pts(p): return [(x * SS, y * SS) for x, y in p]

def composite(img, layer): return Image.alpha_composite(img, layer)

def fill_mask(subs, evenodd):
    mask = Image.new('L', (W, H), 0)
    for s in subs:
        if len(s) < 3: continue
        m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(pts(s), fill=255)
        mask = ImageChops.difference(mask, m) if evenodd else ImageChops.lighter(mask, m)
    return mask

def paint_mask(img, mask, rgb, a):
    layer = Image.new('RGBA', (W, H), rgb + (0,)); alpha = mask.point(lambda v: int(v * a)); layer.putalpha(alpha)
    return composite(img, layer)

def radial(img, g, a):
    r0, r1 = g['r0'] * SS, g['r1'] * SS; cx, cy = g['x1'] * SS, g['y1'] * SS
    stops = sorted(g['stops'], key=lambda s: s[0]); cols = [(o, parse(c)) for o, c in stops]
    def at(t):
        t = max(0, min(1, t))
        for i in range(len(cols) - 1):
            (o0, c0), (o1, c1) = cols[i], cols[i + 1]
            if t <= o1:
                k = 0 if o1 == o0 else (t - o0) / (o1 - o0)
                return tuple(int(c0[j] + (c1[j] - c0[j]) * k) for j in range(3)) + (int((c0[3] + (c1[3] - c0[3]) * k) * 255 * a),)
        c = cols[-1][1]; return c[:3] + (int(c[3] * 255 * a),)
    layer = Image.new('RGBA', (W, H), at(1.0)); d = ImageDraw.Draw(layer); n = 80
    for i in range(n + 1):                      # lingkaran dari luar ke dalam, menimpa warna
        t = 1 - i / n; r = r0 + (r1 - r0) * t
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=at(t))
    return composite(img, layer)

def dashed(d, p, lw, fill, dash):
    seg = [x * SS for x in dash] or [1e9]; i = 0; on = True; left = seg[0]
    for (x0, y0), (x1, y1) in zip(p, p[1:]):
        L = ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5
        if L == 0: continue
        pos = 0
        while pos < L:
            step = min(left, L - pos); a = pos / L; b = (pos + step) / L
            if on: d.line([(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a), (x0 + (x1 - x0) * b, y0 + (y1 - y0) * b)], fill=fill, width=max(1, int(lw)))
            pos += step; left -= step
            if left <= 1e-6: i += 1; on = not on; left = seg[i % len(seg)]

def render(path):
    data = json.load(open(path)); img = Image.new('RGBA', (W, H), (9, 12, 19, 255))
    for op in data['ops']:
        col = op['color']; a = op['alpha']
        if op['t'] == 'fill':
            if isinstance(col, dict):
                img = radial(img, col['grad'], a) if col['grad'].get('kind') == 'radial' else img; continue
            r, g, b, ca = parse(col); img = paint_mask(img, fill_mask(op['sub'], op['evenodd']), (r, g, b), ca * a)
        elif op['t'] == 'stroke':
            r, g, b, ca = parse(col); lw = max(1, op['lw'] * SS)
            layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer); fill = (r, g, b, int(255 * ca * a))
            for s in op['sub']:
                p = pts(s['pts'])
                if s['closed'] and len(p) > 1: p = p + [p[0]]
                if len(p) < 2: continue
                if op['dash']: dashed(d, p, lw, fill, op['dash'])
                else:
                    d.line(p, fill=fill, width=int(lw), joint='curve')
                    if lw > 3:
                        for x, y in (p[0], p[-1]): d.ellipse([x - lw / 2, y - lw / 2, x + lw / 2, y + lw / 2], fill=fill)
            img = composite(img, layer)
        elif op['t'] == 'text':
            r, g, b, ca = parse(col); size = int(float(re.match(r'(\d+)', op['font']).group(1)) * SS)
            layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer); f = ImageFont.truetype(FONT, size)
            tw = d.textlength(op['text'], font=f); x = op['x'] * SS - (tw / 2 if op['align'] == 'center' else 0)
            d.text((x, op['y'] * SS), op['text'], font=f, fill=(r, g, b, int(255 * ca * a)), anchor='ls'); img = composite(img, layer)
    return img.convert('RGB').resize((960, 600), Image.LANCZOS)

if __name__ == '__main__':
    here = os.path.join(os.path.dirname(__file__), '..', 'docs', 'screenshots')
    for p in sorted(glob.glob(os.path.join(here, '*.json'))):
        out = p[:-5] + '.png'; render(p).save(out, optimize=True); os.remove(p); print('->', os.path.relpath(out))
