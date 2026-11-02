// The show's character generator: every line the viewer reads over the picture, drawn on the
// same 320 x 180 grid as the game in the caption face, on its own canvas over the game canvas.
// Four voices, each from television:
//   captions     what is said and heard, white on black, one box per line (closed captions)
//   lower thirds the episode and the take, a red tag over a black title (the show's titles)
//   text pages   how to play, a numbered page with a colored band (teletext)
//   the set      the viewer's own TV: sound and picture changes in green (on-screen display)
// HTML elements beside it carry the same words for screen readers; this canvas is only pixels.
import { ccText, ccWidth, ccWrap, ccBox, ccRich, ccCaptionBlock, plain, ADV } from '../art/ccfont.js';

const W = 320, H = 180;
// a broadcast palette that never changes with her world's look
export const TV = { black: '#000000', white: '#ffffff', yellow: '#ffe94a', cyan: '#4ae8ff', red: '#ff4d5e', green: '#62ff8c', magenta: '#ff70e4', grey: '#a5a3b2', salmon: '#ff8a7a' };

const S = { caption: null, desc: null, capRect: null, cards: [], osd: [], bug: null, rec: null, immune: false, page: null, menu: null };
let cv = null, ctx = null, running = false;
const now = () => performance.now() / 1000;
const ease = u => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);

function ensure() {
  if (ctx) return true;
  cv = document.getElementById('cg'); if (!cv) return false;
  ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  return true;
}
function kick() { if (!ensure() || running) return; running = true; requestAnimationFrame(frame); }
const busy = () => !!(S.caption || S.desc || S.cards.length || S.osd.length || S.bug || S.rec || S.immune || S.page || S.menu);

function frame() {
  const t = now();
  if (S.caption && S.caption.until && t > S.caption.until) S.caption = null;
  S.cards = S.cards.filter(c => !(c.outAt && t > c.outAt + 0.2));
  S.osd = S.osd.filter(o => t < o.until);
  if (S.bug && t > S.bug.until) S.bug = null;
  if (S.rec && t > S.rec.until) S.rec = null;
  ctx.clearRect(0, 0, W, H);
  if (!busy()) { running = false; return; }
  if (!S.menu) { drawCards(t); drawCaption(t); }
  drawPage(t); drawMenu(t); drawTop(t); // the set's own messages sit over the picture; pages and the menu cover them
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ captions
// Captions live in the strip under everyone's feet (the floor is y 160 to 180 in every side
// view), so they never cover a character: one line in the middle of the strip, two filling it,
// a third only for a long line. What she looks at (narration) takes the strip over while it is
// up, and the scene holds its own lines until it is gone.
const CAP_COLS = 46, CAP_ROW = 10;
function drawCaption(t) {
  S.capRect = null;
  if (S.page) return; // a text page replaces the captions while it is up
  const d = S.desc, c = S.caption;
  const lines = d ? d.lines : c ? c.lines : null; if (!lines) return;
  const n = lines.length, bottom = n === 1 ? 175 : 180;
  const r = ccCaptionBlock(ctx, lines, 160, bottom, { italic: d ? true : c.italic, row: CAP_ROW, top: 1, shown: d ? d.shown : undefined, alpha: d ? d.alpha : 1, ink: d ? d.ink : undefined });
  const x0 = Math.min(...r.boxes.map(b => b.x)), x1 = Math.max(...r.boxes.map(b => b.x + b.w));
  S.capRect = { x0, y0: r.top, x1, y1: bottom };
  // more to say: a small arrow after the last line once it is out
  if (d && d.more && Math.floor(t * 3) % 2 === 0) { const b = r.boxes[n - 1]; ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x + b.w + 2, bottom - 6, 3, 1); ctx.fillRect(b.x + b.w + 3, bottom - 5, 1, 1); }
}

// ------------------------------------------------------------------ lower thirds and title cards
// A red tag over a black title in double height. At the start of something it sits lower right,
// clear of her (she comes in from the left); at an end it sits in the middle as one card.
// It wipes on from its edge and off the same way.
function chyron(c, t) {
  const TAG = 11, TITLE = 21, title = c.title.toUpperCase();
  let tagW = ccWidth(c.tag) + 8, titleW = title ? ccWidth(title) + 10 : 0;
  const center = c.place !== 'lower' && c.place !== 'lowerLeft', left = c.place === 'lowerLeft';
  if (center && title) tagW = titleW = Math.max(tagW, titleW);
  const y = center ? Math.round(90 - (TAG + (title ? TITLE : 0)) / 2) : 152 - (title ? TITLE : 0) - TAG;
  const inT = t - c.t0, outU = (t - c.outAt) / 0.16;
  const grow = (delay, dur) => ease((inT - delay) / dur) * (1 - ease(outU));
  const box = (w, full, h, yy, color, alpha, text, sy) => {
    if (w <= 0) return;
    const x = center ? Math.round(160 - full / 2) : left ? 12 : 308 - full, vx = center || left ? x : 308 - w;
    ccBox(ctx, vx, yy, w, h, color, alpha);
    ctx.save(); ctx.beginPath(); ctx.rect(vx, yy, w, h); ctx.clip();
    const tw = ccWidth(text, 1), tx = center ? Math.round(160 - tw / 2) : x + (sy ? 5 : 4);
    ccText(ctx, text, tx, yy + (sy ? 3 : 2), TV.white, { sy: sy || 1 });
    ctx.restore();
  };
  box(Math.round(tagW * grow(0, 0.16)), tagW, TAG, y, TV.red, 1, c.tag);
  if (title) box(Math.round(titleW * grow(0.07, 0.2)), titleW, TITLE, y + TAG, TV.black, 0.9, title, 2);
}
function drawCards(t) { S.cards.forEach(c => chyron(c, t)); }

// ------------------------------------------------------------------ the top of the screen
function drawTop(t) {
  if (S.page || S.menu) return; // a teletext page has the screen: the set's messages wait
  let y = 9;
  // review mode, top right, out of the way of anything the game draws at the top center
  if (S.immune) { const s = 'STORY MODE · N SKIPS AHEAD', w = ccWidth(s); ccBox(ctx, 314 - w - 4, 2, w + 8, 11, TV.black, 0.85); ccText(ctx, s, 314 - w, 4, TV.salmon); y = 20; }
  if (S.bug) { const w = ccWidth(S.bug.text); ccText(ctx, S.bug.text, 311 - w, y + 1, TV.black, { alpha: 0.6 }); ccText(ctx, S.bug.text, 310 - w, y, TV.white, { alpha: 0.75 }); y += 11; }
  // the set's on-screen display: green, with a hard shadow, like an old TV
  S.osd.forEach(o => { const s = o.text.toUpperCase(), w = ccWidth(s); ccText(ctx, s, 311 - w, y + 1, TV.black, { alpha: 0.85 }); ccText(ctx, s, 310 - w, y, TV.green); y += 11; });
  if (S.rec) { if (Math.floor(t * 2) % 2 === 0) ccText(ctx, '●', 10, 9, TV.red); ccText(ctx, 'REC', 17, 9, TV.white); }
}

// ------------------------------------------------------------------ text pages
// A teletext page in mix mode: 40 columns, a header with the page number and the time, a band
// with the title in double height, the text, and a flashing prompt at the foot.
const COLS = 40, ROW = 10, PX = 40;
function pageRows(p) {
  const rows = [{ kind: 'head' }, { kind: 'gap' }, { kind: 'band' }, { kind: 'band2' }, { kind: 'gap' }];
  p.lines.forEach((l, i) => { if (i) rows.push({ kind: 'gap' }); ccWrap(l, COLS - 2).forEach(s => rows.push({ kind: 'text', s })); });
  rows.push({ kind: 'gap' }, { kind: 'foot' });
  return rows;
}
function drawPage(t) {
  const p = S.page; if (!p) return;
  const rows = p.rows || (p.rows = pageRows(p)), n = rows.length, y0 = Math.round((H - n * ROW) / 2), age = t - p.t0;
  const out = p.closeAt ? Math.min(1, (t - p.closeAt) / 0.12) : 0;
  if (out >= 1) { S.page = null; return; }
  ccBox(ctx, PX - 4, y0 - 4, COLS * ADV + 7, n * ROW + 7, TV.black, 0.9 * (1 - out));
  const searching = age < 0.32;
  rows.forEach((r, i) => {
    const y = y0 + i * ROW, shown = i === 0 || (!searching && age > 0.32 + i * 0.028);
    if (!shown || out > 0.5) return;
    if (r.kind === 'head') {
      ccText(ctx, 'P' + p.num, PX, y + 1, TV.white);
      ccText(ctx, 'CH 07 TEXT', PX + 5 * ADV, y + 1, TV.yellow);
      const rolling = searching ? p.num - 7 + Math.floor(age / 0.32 * 7) : p.num;
      ccText(ctx, String(rolling), PX + 16 * ADV, y + 1, searching ? TV.green : TV.white);
      const d = new Date(), z = v => String(v).padStart(2, '0'), clock = z(d.getHours()) + ':' + z(d.getMinutes()) + '/' + z(d.getSeconds());
      ccText(ctx, clock, PX + (COLS - clock.length) * ADV, y + 1, TV.yellow);
    } else if (r.kind === 'band') {
      ccBox(ctx, PX, y, COLS * ADV - 1, ROW * 2, p.band, 1);
      ccText(ctx, p.title.toUpperCase(), PX + ADV, y + 3, TV.black, { sy: 2 });
    } else if (r.kind === 'text') {
      ccRich(ctx, r.s, PX + ADV, y + 1, TV.white, TV.yellow);
    } else if (r.kind === 'foot') {
      const s = 'ANY KEY TO GO ON'; ccText(ctx, s, PX + ADV, y + 1, TV.green);
      if (Math.floor(age * 2.2) % 2 === 0) ccText(ctx, '█', PX + ADV + (s.length + 1) * ADV, y + 1, TV.green);
    }
  });
}

// ------------------------------------------------------------------ the pause menu
// Page 100: the show waits while she changes things. rows: [{ label, value, adjust, help }],
// at: the row picked. The band says where she is; the line under the rows says what a row does.
function drawMenu(t) {
  const m = S.menu; if (!m || S.page) return;
  const rows = m.rows, n = rows.length, h = (3 + n + 2) * ROW + 4, y0 = Math.round((H - h) / 2);
  ccBox(ctx, PX - 4, y0 - 4, COLS * ADV + 7, h + 7, TV.black, 0.92);
  let y = y0;
  ccText(ctx, 'P100', PX, y + 1, TV.white); ccText(ctx, 'CH 07 TEXT', PX + 5 * ADV, y + 1, TV.yellow);
  const d = new Date(), z = v => String(v).padStart(2, '0'), clock = z(d.getHours()) + ':' + z(d.getMinutes()) + '/' + z(d.getSeconds());
  ccText(ctx, clock, PX + (COLS - clock.length) * ADV, y + 1, TV.yellow);
  y += ROW;
  ccBox(ctx, PX, y, COLS * ADV - 1, ROW * 2, TV.cyan, 1);
  ccText(ctx, 'PAUSED', PX + ADV, y + 3, TV.black, { sy: 2 });
  if (m.where) ccText(ctx, m.where, PX + (COLS - 1 - m.where.length) * ADV, y + 7, TV.black);
  y += ROW * 2 + 2;
  m.hit = [];
  rows.forEach((r, i) => {
    const sel = i === m.at;
    if (sel) ccBox(ctx, PX, y, COLS * ADV - 1, ROW, TV.yellow, 1);
    ccText(ctx, (sel ? '▶ ' : '  ') + r.label, PX + ADV, y + 1, sel ? TV.black : TV.white);
    if (r.value != null) { const v = sel && r.adjust ? '< ' + r.value + ' >' : r.value; ccText(ctx, v, PX + (COLS - 1 - v.length) * ADV, y + 1, sel ? TV.black : TV.cyan); }
    m.hit.push({ y0: y, y1: y + ROW, i });
    y += ROW;
  });
  y += 2;
  const r = rows[m.at];
  if (r && r.help) ccText(ctx, r.help, PX + ADV, y + ROW / 2 + 1, TV.green);
  if (Math.floor(t * 2.2) % 2 === 0 && r && r.help) ccText(ctx, '█', PX + ADV + (r.help.length + 1) * ADV, y + ROW / 2 + 1, TV.green);
}

// ------------------------------------------------------------------ the API
export const cg = {
  caption(speaker, text, opts) {
    opts = opts || {};
    const full = (speaker ? speaker + ': ' : '') + text;
    S.caption = { lines: ccWrap(full, CAP_COLS), italic: !!opts.italic, until: opts.ms ? now() + opts.ms / 1000 : 0 };
    kick();
  },
  clearCaption() { S.caption = null; },
  // narration from a look with E, set every frame while it is up (null clears it)
  describe(d) { S.desc = d && d.lines && d.lines.length ? d : null; if (S.desc) kick(); },
  get describing() { return !!S.desc; },
  // where the caption strip is in use right now (pixel grid), or null
  get captionRect() { return S.capRect; },
  card(tag, title, ms, place) {
    const t = now();
    S.cards.forEach(c => { if (!c.outAt || c.outAt > t) c.outAt = t; });
    const c = { tag: String(tag).toUpperCase(), title: title || '', place: place || 'center', t0: t, outAt: t + (ms || 3200) / 1000 };
    S.cards.push(c); kick();
  },
  // one message at a time, the newest replaces the last, as on a TV
  osd(text, ms) { S.osd = [{ text, until: now() + (ms || 1800) / 1000 }]; kick(); },
  bug(text, ms) { S.bug = { text, until: now() + (ms || 900) / 1000 }; kick(); },
  rec(ms) { S.rec = { until: now() + (ms || 2400) / 1000 }; kick(); },
  immune(on) { S.immune = !!on; kick(); },
  page(spec) { S.page = Object.assign({ t0: now(), closeAt: 0, band: TV.cyan, num: 701 }, spec); kick(); },
  closePage() { if (S.page && !S.page.closeAt) S.page.closeAt = now(); },
  get pageUp() { return !!S.page && !S.page.closeAt; },
  menu(spec) { S.menu = spec; kick(); },
  get menuUp() { return !!S.menu; },
  closeMenu() { S.menu = null; },
  // the row of the menu at this point of the pixel grid, or -1
  menuHit(x, y) { const m = S.menu; if (!m || !m.hit || S.page || x < PX || x > PX + COLS * ADV) return -1; const h = m.hit.find(r => y >= r.y0 && y < r.y1); return h ? h.i : -1; },
  clearAll() { S.caption = null; S.desc = null; S.cards = []; S.osd = []; S.bug = null; S.rec = null; S.page = null; S.menu = null; }
};
