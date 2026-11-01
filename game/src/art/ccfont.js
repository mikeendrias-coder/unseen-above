// The caption face: one pixel font for every line the viewer reads over the picture (captions,
// speech, how-to-play pages, episode titles, the TV's own messages). 5 x 7 capitals, lowercase
// with descenders, on a 6 px advance, in the spirit of a closed-caption decoder. It draws into
// a 2D canvas or a Phaser Graphics object, always on whole pixels. The glyphs live in
// ccglyphs.json, which also builds the web font the page uses (tools/make-font.py).
import DATA from './ccglyphs.json';

export const ADV = DATA.advance, CAP = DATA.cap, DESC = DATA.descent;

// each glyph as runs of ink per row: [row, x, length]
const RUNS = {};
for (const [ch, rows] of Object.entries(DATA.glyphs)) {
  const runs = [];
  rows.forEach((r, j) => { let i = 0; while (i < r.length) { if (r[i] === '#') { let n = 1; while (r[i + n] === '#') n++; runs.push([j, i, n]); i += n; } else i++; } });
  RUNS[ch] = runs;
}
const glyph = ch => RUNS[ch] || RUNS[DATA.map[ch]] || RUNS[ch.toUpperCase()] || RUNS['?'];

export const ccWidth = (s, sx = 1) => { const n = [...String(s)].length; return n ? (n * ADV - 1) * sx : 0; };

// colors may be numbers (0xffffff) or CSS strings
const css = c => typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c;
const num = c => typeof c === 'number' ? c : parseInt(String(c).replace('#', ''), 16);
const isGraphics = t => typeof t.fillStyle === 'function';

// Draw a string with its top-left at (x, y). opts: alpha, sx, sy (whole-number scales),
// italic (top rows lean right, as captions mark voices from off screen), clip (max width in px).
export function ccText(t, s, x, y, color, opts) {
  opts = opts || {};
  const sx = opts.sx || 1, sy = opts.sy || 1, a = opts.alpha == null ? 1 : opts.alpha, it = !!opts.italic, max = opts.clip == null ? Infinity : opts.clip;
  if (a <= 0) return x;
  const gfx = isGraphics(t);
  if (gfx) t.fillStyle(num(color), a); else { t.globalAlpha = a; t.fillStyle = css(color); }
  let cx = Math.round(x); const y0 = Math.round(y), left = cx;
  for (const ch of String(s)) {
    if (cx - left >= max) break;
    for (const [j, i, n] of glyph(ch)) {
      const lean = it ? (j <= 2 ? 1 : j >= 7 ? -1 : 0) : 0;
      let px = cx + (i + lean) * sx, w = n * sx;
      if (px - left + w > max) w = max - (px - left); if (w <= 0) continue;
      t.fillRect(px, y0 + j * sy, w, sy);
    }
    cx += ADV * sx;
  }
  if (!gfx) t.globalAlpha = 1;
  return cx;
}

// Rich text for how-to-play pages: {G} draws G in the accent color.
export function ccRich(t, s, x, y, color, accent, opts) {
  let cx = x; const parts = String(s).split(/(\{[^}]*\})/);
  parts.forEach(p => { if (!p) return; const hot = p[0] === '{'; const str = hot ? p.slice(1, -1) : p; ccText(t, str, cx, y, hot ? accent : color, opts); cx += [...str].length * ADV * ((opts && opts.sx) || 1); });
  return cx;
}
export const plain = s => String(s).replace(/[{}]/g, '');

// Word wrap to at most `cols` characters a line (markup braces do not count).
export function ccWrap(text, cols) {
  const out = []; let line = '';
  String(text).split(/\s+/).filter(Boolean).forEach(w => {
    const next = line ? line + ' ' + w : w;
    if (plain(next).length > cols && line) { out.push(line); line = w; } else line = next;
  });
  if (line) out.push(line);
  return out;
}

// A filled box, for captions and labels: solid, square, no outline.
export function ccBox(t, x, y, w, h, color, alpha) {
  if (isGraphics(t)) { t.fillStyle(num(color), alpha == null ? 1 : alpha); t.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  else { t.globalAlpha = alpha == null ? 1 : alpha; t.fillStyle = css(color); t.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); t.globalAlpha = 1; }
}

// The caption look, shared by the TV captions and the speech over people's heads: each line on
// its own black box, one box per line, so the block steps in and out like real closed captions.
export const CAPTION = { padX: 4, row: 11, top: 2, ink: 0xffffff, box: 0x000000, alpha: 0.9 };
export function ccCaptionBlock(t, lines, cx, bottom, opts) {
  opts = opts || {};
  const R = opts.row || CAPTION.row, TOP = opts.top == null ? CAPTION.top : opts.top, padX = opts.padX == null ? CAPTION.padX : opts.padX, a = opts.alpha == null ? 1 : opts.alpha;
  const top = Math.round(bottom - lines.length * R), boxes = [];
  lines.forEach((l, i) => {
    const w = ccWidth(plain(l)), x = Math.round(cx - w / 2), y = top + i * R;
    boxes.push({ x: x - padX, y, w: w + padX * 2, h: R });
  });
  boxes.forEach(b => ccBox(t, b.x, b.y, b.w, b.h, opts.box == null ? CAPTION.box : opts.box, CAPTION.alpha * a));
  lines.forEach((l, i) => {
    const b = boxes[i], shown = opts.shown == null ? Infinity : opts.shown - lines.slice(0, i).reduce((n, q) => n + plain(q).length, 0);
    if (shown <= 0) return;
    const str = shown === Infinity ? l : plain(l).slice(0, shown);
    if (opts.accent && shown === Infinity) ccRich(t, str, b.x + padX, b.y + TOP, opts.ink || CAPTION.ink, opts.accent, { alpha: a, italic: opts.italic });
    else ccText(t, plain(str), b.x + padX, b.y + TOP, opts.ink || CAPTION.ink, { alpha: a, italic: opts.italic });
  });
  return { top, boxes };
}
