"""Membuat docs/social-preview.png (1280x640) untuk README dan 'Social preview' GitHub. Memakai Pillow."""
import os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

HERE = os.path.dirname(__file__); DOCS = os.path.join(HERE, '..', 'docs')
W, H = 1280, 640
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
CY, MG, OR, GR = (34, 228, 255), (255, 61, 242), (255, 154, 60), (77, 255, 154)

bg = Image.new('RGB', (W, H), (9, 12, 19)); d = ImageDraw.Draw(bg)
for x in range(0, W, 40): d.line([(x, 0), (x, H)], fill=(14, 24, 34))
for y in range(0, H, 40): d.line([(0, y), (W, y)], fill=(14, 24, 34))

# cahaya latar
glow = Image.new('RGB', (W, H), (0, 0, 0)); g = ImageDraw.Draw(glow)
g.ellipse([-200, -260, 560, 400], fill=(8, 60, 80)); g.ellipse([760, 200, 1500, 900], fill=(70, 12, 70))
bg = ImageChops.add(bg, glow.filter(ImageFilter.GaussianBlur(120)))

# bentuk geometris melayang (musuh/proyektil)
random.seed(7); d = ImageDraw.Draw(bg, 'RGBA')
import math
def poly(cx, cy, r, n, rot, col, w=3):
    p = [(cx + math.cos(rot + i * 2 * math.pi / n) * r, cy + math.sin(rot + i * 2 * math.pi / n) * r) for i in range(n)]
    d.line(p + [p[0]], fill=col + (140,), width=w)
for i in range(22):
    poly(random.randint(0, W), random.randint(0, H), random.randint(10, 34), random.choice([3, 4, 5, 6, 8]), random.random() * 6, random.choice([CY, MG, OR, GR]))

# cuplikan permainan di kanan
shot = Image.open(os.path.join(DOCS, 'screenshots', 'boss-rush.png')).convert('RGB').resize((520, 325), Image.LANCZOS)
frame = Image.new('RGB', (532, 337), CY); frame.paste(shot, (6, 6))
glow2 = Image.new('RGB', (W, H), (0, 0, 0)); glow2.paste(Image.new('RGB', (590, 400), (0, 90, 120)), (690, 140))
bg = ImageChops.add(bg, glow2.filter(ImageFilter.GaussianBlur(40)))
bg.paste(frame, (720, 170)); d = ImageDraw.Draw(bg, 'RGBA')

# judul bergradien
def grad_text(xy, text, font, c0, c1):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).text(xy, text, font=font, fill=255)
    box = m.getbbox(); gr = Image.new('RGB', (W, H))
    gd = ImageDraw.Draw(gr)
    for x in range(box[0], box[2] + 1):
        t = (x - box[0]) / max(1, box[2] - box[0]); gd.line([(x, 0), (x, H)], fill=tuple(int(c0[i] + (c1[i] - c0[i]) * t) for i in range(3)))
    bg.paste(gr, (0, 0), m)
grad_text((70, 125), 'MUFA', ImageFont.truetype(BOLD, 135), CY, (120, 160, 255))
grad_text((70, 255), 'ARENA', ImageFont.truetype(BOLD, 135), (170, 120, 255), MG)
d = ImageDraw.Draw(bg, 'RGBA')
d.text((74, 440), 'Enter the Arena. Adapt. Survive.', font=ImageFont.truetype(REG, 30), fill=(200, 215, 235))
x = 74
for t, c in [('12 mode', CY), ('8 boss', MG), ('6 kemampuan', OR), ('0 library', GR)]:
    f = ImageFont.truetype(BOLD, 20); w = d.textlength(t, font=f) + 30
    d.rounded_rectangle([x, 505, x + w, 548], radius=21, outline=c + (255,), width=2, fill=c + (30,))
    d.text((x + 15, 516), t, font=f, fill=c); x += w + 12
d.text((74, 585), 'HTML5 Canvas  ·  JavaScript murni  ·  desktop dan HP', font=ImageFont.truetype(REG, 20), fill=(138, 151, 171))
bg.save(os.path.join(DOCS, 'social-preview.png'), optimize=True); print('-> docs/social-preview.png')
