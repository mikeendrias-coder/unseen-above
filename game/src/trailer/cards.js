// What the trailer draws over the game: its title cards, subtitles and end cards, on its own
// 320 x 180 canvas in the game's one pixel face (art/ccfont.js) and the Ash and Gold palette.
// Flat colors, hard edges, things pop on and off (docs/ART_DIRECTION.md): black cards with bone
// words, paper slips with ruled lines and red stamps for the show's own paperwork.
import { ccText, ccWidth, ccWrap, ccBox, ccCaptionBlock } from '../art/ccfont.js';
import { ASH } from '../art/palettes.js';

export const W = 320, H = 180;
const INK = ASH.ash0, PAPER = ASH.bone, PAPER_LO = ASH.boneLo, RULE = ASH.ash5;

// the largest whole scale (up to max) at which a line fits the width
export function fitScale(s, maxW, max) { for (let k = max || 4; k > 1; k--) if (ccWidth(s, k) <= maxW) return k; return 1; }
function centered(ctx, s, y, k, color) { const w = ccWidth(s, k); ccText(ctx, s, Math.round(160 - w / 2), y, color, { sx: k, sy: k }); return w; }

// a red rubber stamp: a 1 px frame and the word, a few pixels knocked out where the ink missed
export function stamp(ctx, text, x, y, k, fill) {
  k = k || 1;
  const w = ccWidth(text, k) + 8 * k, h = 7 * k + 6 * k;
  if (fill) ccBox(ctx, x, y, w, h, fill);
  ctx.fillStyle = ASH.red;
  for (let i = 0; i < k; i++) { ctx.fillRect(x + i, y + i, w - 2 * i, 1); ctx.fillRect(x + i, y + h - 1 - i, w - 2 * i, 1); ctx.fillRect(x + i, y + i, 1, h - 2 * i); ctx.fillRect(x + w - 1 - i, y + i, 1, h - 2 * i); }
  ccText(ctx, text, x + 4 * k, y + 3 * k, ASH.red, { sx: k, sy: k });
  ctx.fillStyle = fill || PAPER;
  for (let i = 3; i < w - 2; i += 7) ctx.fillRect(x + i, y + ((i * 5) % 3 === 0 ? 0 : h - 1), 2, 1);
  return { w, h };
}
// paper: a bone sheet with an ink edge and a hard shadow
function paper(ctx, x, y, w, h) { ccBox(ctx, x + 3, y + 3, w, h, ASH.ash2); ccBox(ctx, x - 1, y - 1, w + 2, h + 2, INK); ccBox(ctx, x, y, w, h, PAPER); }

// ---------------------------------------------------------------- the cards
// Words on black: one to three short lines, each as large as it fits (a whole scale).
function words(ctx, c, t) {
  ccBox(ctx, 0, 0, W, H, '#000000');
  const lines = c.lines, ks = lines.map(l => fitScale(l, 296, c.max || 3)), k = Math.min(...ks);
  const lh = 7 * k + 5 * k, top = Math.round(90 - (lines.length * lh - 5 * k) / 2);
  lines.forEach((l, i) => {
    // a line can wait its turn (c.at: seconds after the card shows)
    if (c.at && c.at[i] != null && t < c.at[i]) return;
    centered(ctx, l, top + i * lh, k, c.red && c.red[i] ? ASH.red : PAPER);
  });
}

// The title: UNSEEN ABOVE in bone, four times the face, and the show's satellite crossing the
// black over it: three red pixels, the same as over the ridge in the opening.
function title(ctx, c, t) {
  ccBox(ctx, 0, 0, W, H, '#000000');
  const sx = Math.round(-30 + t * 34) % 380, sy = 46;
  ctx.fillStyle = ASH.red; [-2, 0, 2].forEach(d => ctx.fillRect(sx + d, sy, 1, 1));
  centered(ctx, 'UNSEEN ABOVE', 70, 4, PAPER);
  if (t > (c.subAt || 0.9)) {
    const s = 'A GAME IN FIVE EPISODES', w = ccWidth(s);
    ccBox(ctx, 160 - w / 2 - 4, 110, w + 8, 11, ASH.ash2);
    ccText(ctx, s, Math.round(160 - w / 2), 112, PAPER_LO);
  }
}

// The tagline on a paper slip, its second line stamped in red.
function tagline(ctx, c, t) {
  ccBox(ctx, 0, 0, W, H, '#000000');
  const x = 34, y = 44, w = 252, h = 92;
  paper(ctx, x, y, w, h);
  ccText(ctx, 'NOTICE', x + 8, y + 7, ASH.ash4);
  ccText(ctx, 'CH 07', x + w - 8 - ccWidth('CH 07'), y + 7, ASH.ash4);
  ccBox(ctx, x + 6, y + 18, w - 12, 1, INK);
  const a = c.lines[0], b = c.lines[1];
  const k = Math.min(fitScale(a, w - 24, 2), fitScale(b, w - 24, 2));
  ccText(ctx, a, Math.round(160 - ccWidth(a, k) / 2), y + 30, INK, { sx: k, sy: k });
  ccBox(ctx, x + 6, y + 30 + 7 * k + 5, w - 12, 1, RULE);
  if (t > (c.stampAt || 1.2)) {
    const sw = ccWidth(b, k) + 8 * k;
    stamp(ctx, b, Math.round(160 - sw / 2), y + 56, k, PAPER);
  }
}

// The last card: the show's own request form, filled in for the game. Its fields come on one by
// one, then APPROVED is stamped across it.
const FORM_ROWS = [
  { label: 'TITLE', vals: ['UNSEEN ABOVE'], big: true },
  { label: 'COMPANION TO', vals: ['Unseen Above: Space Law and the', 'Power to See and Not Be Seen'] },
  { label: 'BY', vals: ['Michael Endrias'] },
  { label: 'OPERATOR', vals: ['(not required)'], dim: true },
  { label: 'PLAY AT', vals: ['mikeendrias-coder.github.io/unseen-above'], below: true }
];
function form(ctx, c, t) {
  ccBox(ctx, 0, 0, W, H, '#000000');
  const x = 14, y = 12, w = 292, h = 154, VX = x + 92;
  paper(ctx, x, y, w, h);
  ccText(ctx, 'REQUEST TO WATCH', x + 8, y + 7, INK);
  ccText(ctx, 'FORM 7A', x + w - 8 - ccWidth('FORM 7A'), y + 7, ASH.ash4);
  ccBox(ctx, x + 6, y + 18, w - 12, 1, INK);
  let yy = y + 24;
  const step = c.step || 0.45;
  FORM_ROWS.forEach((r, i) => {
    const show = t > 0.3 + i * step;
    ccText(ctx, r.label, x + 8, yy + 2, ASH.ash4);
    const vy = r.below ? yy + 13 : yy + 2;
    if (show) r.vals.forEach((v, j) => ccText(ctx, v, r.below ? x + 8 : VX, vy + j * 11, r.dim ? ASH.ash4 : INK, r.big ? { sx: 2, sy: 2 } : null));
    yy += (r.big || r.below || r.vals.length > 1 ? 22 : 11) + 6;
    if (i < FORM_ROWS.length - 1) ccBox(ctx, x + 6, yy - 4, w - 12, 1, PAPER_LO);
  });
  const at = c.stampAt || 3.2;
  if (t > at) stamp(ctx, 'APPROVED', x + w - 110, y + 92, 2);
  if (t > at + 0.9) ccText(ctx, 'FILED.', x + w - 8 - ccWidth('FILED.'), y + h - 12, ASH.ash4);
}

// a subtitle, in the game's caption look: one black box per line, bone on black, at the foot of
// the picture (the trailer shows the picture without the game's caption strip)
function sub(ctx, s) {
  const text = (s.who ? s.who + ': ' : '') + s.text, lines = ccWrap(text, 51);
  ccCaptionBlock(ctx, lines, 160, 174, { row: 11, top: 2, italic: !!s.italic });
}

// ---------------------------------------------------------------- the layer
// A lower third in the game's own look: a red stamp over a paper label (ui/cg.js chyron).
function chyron(ctx, c) {
  const titleS = (c.title || '').toUpperCase(), TAG_H = 13, TITLE_H = 20;
  const tagW = ccWidth(c.tag) + 8, titleW = titleS ? ccWidth(titleS, 2) + 12 : 0, full = Math.max(tagW, titleW);
  const h = TAG_H + (titleS ? TITLE_H + 2 : 0), y = 152 - h, x = c.left ? 12 : 308 - full;
  stamp(ctx, c.tag, c.left ? x : 308 - tagW, y, 1, INK);
  if (titleS) {
    const ly = y + TAG_H + 2, lx = c.left ? x : 308 - titleW;
    ccBox(ctx, lx - 1, ly - 1, titleW + 2, TITLE_H + 2, INK); ccBox(ctx, lx, ly, titleW, TITLE_H, PAPER); ccBox(ctx, lx + 2, ly + 2, titleW - 4, 1, PAPER_LO);
    ccText(ctx, titleS, lx + 6, ly + 4, INK, { sx: 2, sy: 2 });
  }
}

export const DRAW = { words, title, tagline, form };
export function drawLayer(ctx, L, now) {
  ctx.clearRect(0, 0, W, H);
  if (L.dim > 0) { ctx.globalAlpha = Math.min(1, L.dim); ccBox(ctx, 0, 0, W, H, '#000000'); ctx.globalAlpha = 1; }
  if (L.card) DRAW[L.card.kind](ctx, L.card, now - L.card.t0);
  if (L.chyron && !L.card) chyron(ctx, L.chyron);
  if (L.sub && !L.card) sub(ctx, L.sub);
}
