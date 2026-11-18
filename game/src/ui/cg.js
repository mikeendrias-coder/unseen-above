// The show's character generator: every line the viewer reads over the picture, drawn on the
// same 320 x 180 grid as the game in the caption face, on its own canvas over the game canvas.
// Final pass (Nov 17): the show is a bureaucracy (Papers, Please). Everything it hands the viewer
// is paperwork: how-to pages are NOTICE slips on bone paper with ash ink and key caps, the pause
// menu is a form, titles are a paper label under a red stamp. Red only ever means the watchers.
// Flat colors from the one palette, no alpha haze, no slides: things pop on and off.
//   captions     what is said and heard, bone on black, in the strip under the picture
//   strip ends   her HP at the left end, the lives left at the right end
//   titles       a red stamp (EPISODE 1, TAKE 4) over a paper label
//   notices      how to play: a numbered slip, three short lines, a red stamp
//   the form     the pause menu, form 100
//   the set      the viewer's TV: sound and settings, gold with a hard shadow
// HTML elements beside it carry the same words for screen readers; this canvas is only pixels.
import { ccText, ccWidth, ccWrap, ccBox, ccCaptionBlock, plain, ADV } from '../art/ccfont.js';
import { ASH } from '../art/palettes.js';
import { STRIP } from '../core/display.js';
import { typer, Line, rowsShown, voice } from './typer.js';

const W = 320, H = 180;
// The old teletext role names, kept because scenes use them, now in Ash and Gold.
export const TV = { black: ASH.ash0, white: ASH.bone, yellow: ASH.gold, cyan: ASH.goldHi, red: ASH.red, green: ASH.lit, magenta: ASH.boneLo, grey: ASH.ash5, salmon: ASH.redHi };
// paper and ink
const PAPER = ASH.bone, PAPER_LO = ASH.boneLo, INK = ASH.ash0, INK_LO = ASH.ash3, RULE = ASH.ash5;

const S = { hp: null, lives: null, caption: null, desc: null, capRect: null, cards: [], osd: [], bug: null, rec: null, immune: false, page: null, menu: null, flash: null };
let cv = null, ctx = null, running = false;
const now = () => performance.now() / 1000;
const pats = new Map();

function ensure() {
  if (ctx) return true;
  cv = document.getElementById('cg'); if (!cv) return false;
  cv.height = H + STRIP; // the picture, then the caption strip under it
  ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  return true;
}
function kick() { if (!ensure() || running) return; running = true; requestAnimationFrame(frame); }
const busy = () => !!(S.hp || S.lives || S.caption || S.desc || S.cards.length || S.osd.length || S.bug || S.rec || S.immune || S.page || S.menu || S.flash);

// a two-color-free dither: one palette color on every other pixel (checker) or one in four (q25)
function pattern(color, kind) {
  const key = color + kind; if (pats.has(key)) return pats.get(key);
  const t = document.createElement('canvas'); t.width = 2; t.height = 2; const x = t.getContext('2d'); x.fillStyle = color;
  if (kind === 'q25') x.fillRect(0, 0, 1, 1); else { x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1); }
  const p = ctx.createPattern(t, 'repeat'); pats.set(key, p); return p;
}
function dim(x, y, w, h) { ctx.fillStyle = pattern(INK, 'checker'); ctx.fillRect(x, y, w, h); }

let lastT = 0;
const held = () => !!(window.__paused || S.menu || (S.page && !S.page.closeAt));
function frame() {
  const t = now();
  // the strip caption types on real time; the pause menu and a notice stop its clock
  const ms = lastT ? Math.min(100, (t - lastT) * 1000) : 0; lastT = t;
  if (S.caption && !held() && !S.desc) S.caption.line.step(ms, typer.fast(S.caption.line));
  if (S.caption && (S.caption.line.dead || (S.caption.until && t > S.caption.until && S.caption.line.shown))) S.caption = null;
  S.cards = S.cards.filter(c => t < c.outAt);
  S.osd = S.osd.filter(o => t < o.until);
  if (S.bug && t > S.bug.until) S.bug = null;
  if (S.rec && t > S.rec.until) S.rec = null;
  if (S.flash && t > S.flash.until) S.flash = null;
  if (S.page && S.page.closeAt) S.page = null;
  ctx.clearRect(0, 0, W, H + STRIP);
  if (!busy()) { running = false; lastT = 0; return; }
  drawFlash();
  if (!S.menu) { drawCards(t); drawCaption(t); drawStrip(); }
  drawPage(t); drawMenu(t); drawTop(t);
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ a flash (core/fx.js)
// Flat: one palette color on a checker over the picture, held a moment, then gone.
function drawFlash() { const f = S.flash; if (!f) return; ctx.fillStyle = pattern(f.color, f.kind); ctx.fillRect(0, 0, W, H); }

// ------------------------------------------------------------------ the strip under the picture
// Captions in the middle (40 columns), her HP at the left end, the lives left at the right end.
const CAP_COLS = 40, CAP_ROW = 10;
function drawStrip() {
  const top = H + 5, pipY = H + 15;
  if (S.hp) {
    ccText(ctx, 'HP', 6, top, INK_LO);
    for (let i = 0; i < S.hp.max; i++) { const x = 6 + i * 8; if (i < S.hp.n) ccBox(ctx, x, pipY, 6, 6, PAPER); else { ccBox(ctx, x, pipY, 6, 6, INK_LO); ccBox(ctx, x + 1, pipY + 1, 4, 4, INK); } }
  }
  if (S.lives) {
    const n = S.lives.max, x0 = 316 - (n * 6 - 2);
    ccText(ctx, 'LIVES', 316 - ccWidth('LIVES'), top, S.lives.n <= 1 ? ASH.red : INK_LO);
    for (let i = 0; i < n; i++) { const x = x0 + i * 6; if (i < S.lives.n) ccBox(ctx, x, pipY, 4, 6, PAPER); else { ccBox(ctx, x, pipY, 4, 6, INK_LO); ccBox(ctx, x + 1, pipY + 1, 2, 4, INK); } }
  }
}
function drawCaption(t) {
  S.capRect = null;
  if (S.page) return; // a notice replaces the captions while it is up
  const d = S.desc, c = S.caption;
  const lines = d ? d.lines : c ? c.lines : null; if (!lines) return;
  const n = Math.min(3, lines.length), bottom = H + STRIP - Math.floor((STRIP - n * CAP_ROW) / 2);
  // the letters typed so far (the speaker's name shows whole from the start)
  const shown = d ? d.shown : rowsShown(c.lines, c.line.n);
  const r = ccCaptionBlock(ctx, lines, 160, bottom, { italic: d ? true : c.italic, row: CAP_ROW, top: 1, shown, alpha: d ? d.alpha : 1, ink: d ? d.ink : undefined });
  const x0 = Math.min(...r.boxes.map(b => b.x)), x1 = Math.max(...r.boxes.map(b => b.x + b.w));
  S.capRect = { x0, y0: r.top, x1, y1: bottom };
  // the line is out and a press moves it on: a small blinking arrow after the last line
  if (d ? d.more : c.line.arrow()) { const b = r.boxes[n - 1], ax = b.x + b.w + 2, ay = bottom - 7; ctx.fillStyle = PAPER; ctx.fillRect(ax, ay, 5, 1); ctx.fillRect(ax + 1, ay + 1, 3, 1); ctx.fillRect(ax + 2, ay + 2, 1, 1); }
}

// ------------------------------------------------------------------ stamps, key caps, paper
// A red rubber stamp: a 1 px frame and caps, with a few pixels knocked out where the ink missed.
function stamp(text, x, y, opts) {
  opts = opts || {};
  const sy = opts.sy || 1, w = ccWidth(text) + 8, h = 7 * sy + 6;
  if (opts.fill) ccBox(ctx, x, y, w, h, opts.fill);
  ctx.fillStyle = ASH.red;
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  ccText(ctx, text, x + 4, y + 3, ASH.red, { sy });
  if (opts.worn !== false) { ctx.fillStyle = opts.fill || PAPER; for (let i = 3; i < w - 2; i += 7) ctx.fillRect(x + i, y + ((i * 5) % 3 === 0 ? 0 : h - 1), 2, 1); }
  return { w, h };
}
// A key cap, as on a keyboard: a light face, a dark rim, a deeper bottom edge, the letter on it.
const CAP_H = 11;
const capW = s => ccWidth(s) + 6;
function keyCap(s, x, y) {
  const w = capW(s);
  ccBox(ctx, x, y, w, CAP_H, INK); ccBox(ctx, x + 1, y + 1, w - 2, CAP_H - 3, PAPER_LO); ccBox(ctx, x + 1, y + CAP_H - 2, w - 2, 1, INK_LO);
  ccText(ctx, s, x + 3, y + 1, INK);
  return w;
}
// width in px of a line that may hold {keys}
const richW = s => String(s).split(/(\{[^}]*\})/).reduce((n, p) => n + (!p ? 0 : p[0] === '{' ? capW(p.slice(1, -1)) + 1 : p.length * ADV), 0);
function richLine(s, x, y, color) {
  let cx = x;
  String(s).split(/(\{[^}]*\})/).forEach(p => {
    if (!p) return;
    if (p[0] === '{') { cx += keyCap(p.slice(1, -1), cx, y - 2) + 1; return; }
    ccText(ctx, p, cx, y, color); cx += p.length * ADV;
  });
}
// wrap by pixel width, counting a key cap as its width
function wrapPx(text, maxW) {
  const out = []; let line = '';
  String(text).split(/\s+/).filter(Boolean).forEach(w => { const next = line ? line + ' ' + w : w; if (richW(next) > maxW && line) { out.push(line); line = w; } else line = next; });
  if (line) out.push(line);
  return out;
}
// paper: a bone sheet with an ink edge and a ruled line inside the top
function paper(x, y, w, h) { ccBox(ctx, x - 1, y - 1, w + 2, h + 2, INK); ccBox(ctx, x, y, w, h, PAPER); }
function rule(x, y, w, color) { ccBox(ctx, x, y, w, 1, color || RULE); }

// ------------------------------------------------------------------ titles
// A red stamp over a paper label in double height. At the start of something it sits lower
// right, clear of her (she comes in from the left); an end sits in the middle. They pop on and off.
function chyron(c) {
  const title = c.title.toUpperCase(), TAG_H = 13, TITLE_H = 20;
  const center = c.place !== 'lower' && c.place !== 'lowerLeft', left = c.place === 'lowerLeft';
  const tagW = ccWidth(c.tag) + 8, titleW = title ? ccWidth(title, 2) + 12 : 0, full = Math.max(tagW, titleW);
  const h = TAG_H + (title ? TITLE_H + 2 : 0);
  const y = center ? Math.round(90 - h / 2) : 152 - h;
  const x = center ? Math.round(160 - full / 2) : left ? 12 : 308 - full;
  const tx = center ? Math.round(160 - tagW / 2) : left ? x : 308 - tagW;
  stamp(c.tag, tx, y, { fill: INK });
  if (title) {
    const ly = y + TAG_H + 2, lx = center ? Math.round(160 - titleW / 2) : left ? x : 308 - titleW;
    paper(lx, ly, titleW, TITLE_H); rule(lx + 2, ly + 2, titleW - 4, PAPER_LO);
    ccText(ctx, title, lx + 6, ly + 4, INK, { sx: 2, sy: 2 });
  }
}
function drawCards() { S.cards.forEach(c => chyron(c)); }

// ------------------------------------------------------------------ the top of the screen
function drawTop(t) {
  if (S.page || S.menu) return; // paperwork has the screen: the set's messages wait
  let y = 4;
  // immunity, top right, on paper so it reads at a glance (the class walkthrough)
  if (S.immune) { const s = 'IMMUNE · N SKIPS', w = ccWidth(s) + 8; paper(314 - w, 3, w, 11); ccText(ctx, s, 318 - w, 5, INK); y = 19; }
  if (S.bug) { const w = ccWidth(S.bug.text); ccText(ctx, S.bug.text, 311 - w, y + 1, INK); ccText(ctx, S.bug.text, 310 - w, y, INK_LO); y += 11; }
  // the set's own notes: paper tags like the immunity one, ink on bone, so they read over any
  // scenery (the immunity tag already says IMMUNITY ON, so that note is not repeated)
  S.osd.forEach(o => { const s = o.text.toUpperCase(); if (S.immune && s === 'IMMUNITY ON') return; const w = ccWidth(s) + 8; paper(314 - w, y - 1, w, 11); ccText(ctx, s, 318 - w, y + 1, INK); y += 14; });
  if (S.rec) { if (Math.floor(t * 2) % 2 === 0) ccText(ctx, '●', 10, 9, ASH.red); ccText(ctx, 'REC', 17, 9, PAPER); }
}

// ------------------------------------------------------------------ notices
// A slip: NOTICE and its number, the title in double height, up to three short lines with keys
// as key caps, and the show's red stamp. The picture behind is dimmed by a dither, not a haze.
const PAD = 8, LINE = 13;
function pageLayout(p) {
  const minW = 200, maxW = 268;
  let w = Math.max(minW, ccWidth(p.title.toUpperCase(), 2) + PAD * 2, ...p.lines.map(l => richW(l) + PAD * 2));
  w = Math.min(maxW, w);
  const lines = []; p.lines.forEach(l => wrapPx(l, w - PAD * 2).forEach(s => lines.push(s)));
  const h = 12 + 4 + 18 + 4 + lines.length * LINE + 6 + 12;
  return { w, h, lines };
}
function drawPage(t) {
  const p = S.page; if (!p) return;
  const L = p.layout || (p.layout = pageLayout(p)), x = Math.round(160 - L.w / 2), y = Math.max(4, Math.round((H - L.h) / 2));
  dim(0, 0, W, H);
  paper(x, y, L.w, L.h);
  let yy = y + 3;
  ccText(ctx, 'NOTICE', x + PAD, yy, INK_LO);
  const no = 'No. ' + p.num; ccText(ctx, no, x + L.w - PAD - ccWidth(no), yy, INK_LO);
  yy += 10; rule(x + 4, yy, L.w - 8, INK); yy += 4;
  ccText(ctx, p.title.toUpperCase(), x + PAD, yy, INK, { sy: 2 });
  yy += 18; rule(x + 4, yy, L.w - 8, RULE); yy += 6;
  L.lines.forEach(s => { richLine(s, x + PAD, yy, INK); yy += LINE; });
  yy += 2; rule(x + 4, yy, L.w - 8, PAPER_LO);
  const age = t - p.t0;
  ccText(ctx, 'ANY KEY', x + PAD, yy + 3, INK_LO);
  // the stamp lands a beat after the slip
  if (age > 0.3) { const s = p.stamp || 'CH 07', sw = ccWidth(s) + 8; stamp(s, x + L.w - PAD - sw + 2, yy - 6, { fill: PAPER }); }
}

// ------------------------------------------------------------------ the pause menu
// Form 100: the show waits while she changes things. rows: [{ label, value, adjust, help }],
// at: the row picked. Each row is a ruled field; the picked one is inked in.
const FX = 52, FW = 216, FROW = 10;
function menuGeom(m) {
  const n = m.rows.length, h = 12 + 4 + 18 + 4 + n * FROW + 4 + 12;
  return { x: FX, y: Math.max(2, Math.round((H - h) / 2)), w: FW, h, rowsY: Math.max(2, Math.round((H - h) / 2)) + 12 + 4 + 18 + 4 };
}
function boxes(n, x, y, on) { for (let i = 0; i < 5; i++) { const bx = x + i * 6; if (i < n) ccBox(ctx, bx, y, 4, 5, on); else { ccBox(ctx, bx, y, 4, 5, on); ccBox(ctx, bx + 1, y + 1, 2, 3, on === PAPER ? INK : PAPER); } } }
function drawMenu(t) {
  const m = S.menu; if (!m || S.page) return;
  const g = menuGeom(m), x = g.x, w = g.w;
  dim(0, 0, W, H);
  paper(x, g.y, w, g.h);
  let y = g.y + 3;
  ccText(ctx, 'FORM 100', x + 6, y, INK_LO);
  if (m.where) ccText(ctx, m.where, x + w - 6 - ccWidth(m.where), y, INK_LO);
  y += 10; rule(x + 4, y, w - 8, INK); y += 4;
  ccText(ctx, 'PAUSED', x + 6, y, INK, { sy: 2 });
  stamp('ON HOLD', x + w - ccWidth('ON HOLD') - 14, y + 1, { fill: PAPER });
  y += 18; rule(x + 4, y, w - 8, RULE); y += 4;
  m.hit = []; m.hx0 = x; m.hx1 = x + w;
  m.rows.forEach((r, i) => {
    const sel = i === m.at, ink = sel ? PAPER : INK;
    if (sel) ccBox(ctx, x + 3, y, w - 6, FROW, INK);
    else rule(x + 6, y + FROW - 1, w - 12, PAPER_LO);
    ccText(ctx, (sel ? '▶ ' : '  ') + r.label, x + 6, y + 1, ink);
    if (r.value != null) {
      const v = String(r.value);
      if (/^[█·]+$/.test(v)) { const n = (v.match(/█/g) || []).length; boxes(n, x + w - 8 - 28, y + 2, ink); if (sel && r.adjust) { ccText(ctx, '<', x + w - 8 - 38, y + 1, ink); ccText(ctx, '>', x + w - 8, y + 1, ink); } }
      else { const s = sel && r.adjust ? '< ' + v + ' >' : v; ccText(ctx, s, x + w - 8 - ccWidth(s) + (sel && r.adjust ? 6 : 0), y + 1, sel ? PAPER : r.value === 'ON' ? INK : INK_LO); }
    }
    m.hit.push({ y0: y, y1: y + FROW, i });
    y += FROW;
  });
  y += 4;
  const r = m.rows[m.at];
  if (r && r.help) ccText(ctx, r.help, x + 6, y + 1, INK_LO, { italic: true });
}

// ------------------------------------------------------------------ the API
export const cg = {
  // A caption types out (ui/typer.js). opts: italic, ms (gone that long after it starts, once it
  // is out), and for the typer: block, noSkip, onAdvance, onShown, key, scene, instant, locked.
  // Returns the Line.
  caption(speaker, text, opts) {
    opts = opts || {};
    const name = speaker ? speaker + ': ' : '', lines = ccWrap(name + text, CAP_COLS), seq = lines.join(' ');
    const line = new Line(seq, Object.assign({ pitch: voice(speaker), start: name.trim().length }, opts));
    line.own(opts.scene || (window.__game && window.__game.scene));
    S.caption = { lines, line, italic: !!opts.italic, until: opts.ms ? now() + opts.ms / 1000 : 0 };
    kick();
    return line;
  },
  clearCaption() { S.caption = null; },
  // the strip caption's line (ui/typer.js), or null
  get line() { return S.caption ? S.caption.line : null; },
  // narration from a look with J, set every frame while it is up (null clears it)
  describe(d) { S.desc = d && d.lines && d.lines.length ? d : null; if (S.desc) kick(); },
  get describing() { return !!S.desc; },
  // where the caption strip is in use right now (pixel grid), or null
  get captionRect() { return S.capRect; },
  card(tag, title, ms, place) {
    const t = now();
    S.cards = [{ tag: String(tag).toUpperCase(), title: title || '', place: place || 'center', t0: t, outAt: t + (ms || 3200) / 1000 }];
    kick();
  },
  // one message at a time, the newest replaces the last, as on a TV
  osd(text, ms) { S.osd = [{ text, until: now() + (ms || 1800) / 1000 }]; kick(); },
  bug(text, ms) { S.bug = { text, until: now() + (ms || 900) / 1000 }; kick(); },
  rec(ms) { S.rec = { until: now() + (ms || 2400) / 1000 }; kick(); },
  immune(on) { S.immune = !!on; kick(); },
  // a flash: a palette color as a dither over the picture for ms (kind 'checker' or 'q25')
  flash(color, ms, kind) { S.flash = { color, kind: kind || 'checker', until: now() + (ms || 80) / 1000 }; kick(); },
  // a notice: { num, title, lines, stamp } (lines may mark keys as {L})
  page(spec) { S.page = Object.assign({ t0: now(), closeAt: 0, num: 701 }, spec); delete S.page.layout; kick(); },
  closePage() { if (S.page && !S.page.closeAt) S.page.closeAt = now(); },
  get pageUp() { return !!S.page && !S.page.closeAt; },
  menu(spec) { S.menu = spec; kick(); },
  get menuUp() { return !!S.menu; },
  closeMenu() { S.menu = null; },
  // the row of the menu at this point of the pixel grid, or -1
  menuHit(x, y) { const m = S.menu; if (!m || !m.hit || S.page || x < m.hx0 || x > m.hx1) return -1; const h = m.hit.find(r => y >= r.y0 && y < r.y1); return h ? h.i : -1; },
  // where row i of the menu is (for tests): { x, y } at its middle, on the pixel grid
  menuRow(i) { const m = S.menu; if (!m) return null; const g = menuGeom(m); return { x: g.x + g.w / 2, y: g.rowsY + i * FROW + FROW / 2 }; },
  // her HP in the strip (n of max), or null to hide it
  hp(n, max) { S.hp = n == null ? null : { n, max }; kick(); },
  // lives left in the strip (n of max), or null to hide them
  lives(n, max) { S.lives = n == null ? null : { n, max }; kick(); },
  clearAll() { S.hp = null; S.lives = null; S.caption = null; S.desc = null; S.cards = []; S.osd = []; S.bug = null; S.rec = null; S.page = null; S.menu = null; S.flash = null; }
};
// where the typer finds the lines a press acts on, and the pixel grid under a click
typer.hook({
  strip: () => (S.caption && !S.desc ? S.caption.line : null),
  narration: () => (S.desc && S.desc.line) || null,
  blocked: held,
  grid: ev => { if (!ensure()) return null; const r = cv.getBoundingClientRect(); return r.width ? { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * (H + STRIP) } : null; }
});
