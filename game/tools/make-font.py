# Builds fonts/ch07-caption.ttf from src/art/ccglyphs.json: the caption face as a web font, so
# the page around the game (the start screen, the keys) uses the same letters as the game.
# One font pixel is 100 units; 10 pixels to the em, so at font-size 20px a pixel is 2 CSS px.
# Run: python3 tools/make-font.py
import json, os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'src', 'art', 'ccglyphs.json')
OUT = os.path.join(HERE, '..', 'fonts', 'ch07-caption.ttf')
d = json.load(open(SRC, encoding='utf-8'))
U, ADV, CAP = 100, d['advance'], d['cap']

names = {}
def gname(ch):
    if ch == ' ': return 'space'
    return 'uni%04X' % ord(ch)

def rects(rows):
    # merge ink into rectangles: horizontal runs, then stack identical runs down the rows
    runs = []
    for j, r in enumerate(rows):
        i = 0
        while i < len(r):
            if r[i] == '#':
                n = 1
                while i + n < len(r) and r[i + n] == '#': n += 1
                runs.append([j, i, n, 1]); i += n
            else: i += 1
    merged = []
    for run in runs:
        for m in merged:
            if m[1] == run[1] and m[2] == run[2] and m[0] + m[3] == run[0]: m[3] += 1; break
        else: merged.append(run)
    return merged

glyphs = {'.notdef': None}
cmap = {}
order = ['.notdef']
for ch, rows in d['glyphs'].items():
    n = gname(ch); order.append(n); cmap[ord(ch)] = n; glyphs[n] = rows
for alias, target in d['map'].items():
    if target in d['glyphs']: cmap[ord(alias)] = gname(target)

fb = FontBuilder(unitsPerEm=10 * U, isTTF=True)
fb.setupGlyphOrder(order)
fb.setupCharacterMap(cmap)
pens = {}
for n in order:
    pen = TTGlyphPen(None)
    rows = glyphs[n]
    if rows is None:  # .notdef: a hollow box
        x0, x1, y0, y1 = 0, 5 * U, 0, CAP * U
        for (a, b, c, e) in [(x0, y0, x1, y0 + U), (x0, y1 - U, x1, y1), (x0, y0, x0 + U, y1), (x1 - U, y0, x1, y1)]:
            pen.moveTo((a, b)); pen.lineTo((a, e)); pen.lineTo((c, e)); pen.lineTo((c, b)); pen.closePath()
    else:
        for (j, i, w, h) in rects(rows):
            top = (CAP - j) * U; bottom = top - h * U; left = i * U; right = (i + w) * U
            # clockwise outer contour for TrueType
            pen.moveTo((left, bottom)); pen.lineTo((left, top)); pen.lineTo((right, top)); pen.lineTo((right, bottom)); pen.closePath()
    pens[n] = pen.glyph()
fb.setupGlyf(pens)
# the left side bearing must be where each glyph's ink starts: with 0 for all, some renderers slide
# narrow glyphs (i, l, !, .) to the left edge of the cell and the text reads "Begi n" (Nov 18)
def lsb(n):
    rows = glyphs[n]
    if not rows: return 0
    cols = [i for r in rows for i, c in enumerate(r) if c == '#']
    return min(cols) * U if cols else 0
fb.setupHorizontalMetrics({n: (ADV * U, lsb(n)) for n in order})
asc, desc = (CAP + 2) * U, -3 * U   # a pixel of air above the caps, room for descenders below
fb.setupHorizontalHeader(ascent=asc, descent=desc)
fb.setupNameTable({'familyName': 'CH07 Caption', 'styleName': 'Regular', 'uniqueFontIdentifier': 'CH07Caption-Regular', 'fullName': 'CH07 Caption', 'psName': 'CH07Caption-Regular', 'version': 'Version 1.0'})
fb.setupOS2(sTypoAscender=asc, sTypoDescender=desc, sTypoLineGap=0, usWinAscent=asc, usWinDescent=-desc, sxHeight=5 * U, sCapHeight=CAP * U, achVendID='CH07', fsType=0)
fb.setupPost(isFixedPitch=1)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
fb.save(OUT)
print('wrote', OUT, os.path.getsize(OUT), 'bytes,', len(order) - 1, 'glyphs')
