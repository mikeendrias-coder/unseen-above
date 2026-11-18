// Episode 5, the Moon: the watchers' home, a small city under a dome, in the locked Ash and Gold
// palette (wealth in gold and bone, the dead world grey, watchers red). Earth hangs in the black
// over the dome. A plaza with a gold fountain, the door she came out of on a plinth behind ropes,
// lounges behind glass where adults watch walls of Earth channels, a tram, a screen showing her
// live, and at the far end, where the city stops being pretty, a staff door. The kids' playroom
// is reached from backstage. Then the last shot of every ending: an old TV in a dark room on
// Earth. Nov 17 pass: no glows, washes or haze; people are big flat pixel figures with a 1 px
// outline (docs/ART_DIRECTION.md sections 2 and 4).
import { Painter, rng } from './painter.js';
import { pixText, textWidth } from './pixfont.js';
import { ccText, ccWidth } from './ccfont.js';

export const TILE = 16, GROUND = 160;
const T = TILE, G = GROUND;
export const CW = 112;          // the city, in tiles
export const KX = (CW + 1) * T; // the playroom's left wall

// the Moon's own palette, from the look board's Moon frames
export const M = {
  space: '#0e0f12', star: '#8f8d87', earth: '#45474d', earthLand: '#6b6c70', earthCloud: '#b8b2a3', earthShade: '#1b1c21', fire: '#f5ce77',
  lunar: '#6b6c70', lunarHi: '#8f8d87', lunarLo: '#45474d',
  wall: '#ebe6d8', wallHi: '#ebe6d8', wallLo: '#b8b2a3', trim: '#d6a03c', trimHi: '#f2d58c', trimLo: '#8a5f1c',
  floor: '#b8b2a3', floorHi: '#ebe6d8', floorLo: '#8f8d87', room: '#b8b2a3', roomLo: '#8f8d87',
  screen: '#0e0f12', bezel: '#3a2f1f', screenGlow: '#f5ce77',
  sofa: '#3a2f1f', sofaHi: '#54432a', sofaLo: '#261f15',
  adult: '#1b1c21', adultHi: '#45474d', glassHi: '#ebe6d8',
  rich: '#ebe6d8', richLo: '#b8b2a3', richHair: '#d6a03c', richHair2: '#54432a',
  pink: '#d6a03c', yellow: '#f2d58c', mint: '#f5ce77', blue: '#b8b2a3', purple: '#261f15',
  rug: '#f5ce77', rugLo: '#d6a03c', white: '#ebe6d8', warm: '#f2d58c', robot: '#ebe6d8', robotLo: '#b8b2a3', robotLed: '#d6a03c',
  wood: '#3a2f1f', red: '#e3412b',
  // the city: towers in the haze, the dome's ribs, the service end
  haze: '#1b1c21', hazeHi: '#2e3036', far: '#1b1c21', farHi: '#2e3036', mid: '#6b6c70', midHi: '#8f8d87', midLo: '#45474d',
  rib: '#8a5f1c', service: '#6b6c70', serviceLo: '#45474d', coat: '#2e3036', coatHi: '#45474d'
};

export const LEVEL = {
  w: CW + 21, h: 12,
  start: { x: 50, y: G - 14 },
  arrive: { x: 24, y: G - 40, w: 22, h: 36 },                   // the door she comes out of, on a plinth 4 px high
  door: { x: 100 * T, y: G - 36, w: 22, h: 36 },                 // STAFF ONLY: backstage
  fountain: { x: 19 * T },
  viewer: { x: 10 * T + 8 },                                     // a coin viewer pointed at Earth
  // lounges behind glass, people on sofas watching walls of Earth channels
  rooms: [
    { x0: 34 * T, x1: 46 * T, seats: 4, tiles: ['estate', 'street', 'field', 'hall', 'sat', 'beach', 'crowd', 'static'] },
    { x0: 51 * T, x1: 63 * T, seats: 5, tiles: ['bedroom', 'ridge', 'estate', 'crowd', 'field', 'static', 'street', 'beach'] },
    { x0: 67 * T, x1: 77 * T, seats: 2, tiles: ['grounds', 'static', 'hall', 'ridge', 'sat', 'field'] }
  ],
  buildings: [{ x0: 32 * T, x1: 48 * T, top: 6 }, { x0: 49 * T + 8, x1: 64 * T + 8, top: 14 }, { x0: 65 * T + 8, x1: 79 * T, top: 9 }],
  portholes: [],
  vote: { x: 80 * T + 4, y: 52, w: 92, h: 46 },
  live: { x: 86 * T + 4, y: 26, w: 70, h: 42 },                 // a screen showing her, live
  robot: { x0: 88 * T, x1: 97 * T, speed: 14 },
  // people out tonight: the rich stroll and film her; the staff work
  // (each walks a stretch clear of the benches, planters and the fountain, which are solid)
  npcs: [
    { kind: 'a', x0: 21 * T + 8, x1: 26 * T + 4, speed: 9 },
    { kind: 'b', x0: 31 * T + 6, x1: 33 * T + 12, speed: 7 },
    { kind: 'w', x0: 47 * T, x1: 66 * T, speed: 16 },
    { kind: 'a', x0: 78 * T, x1: 83 * T + 6, speed: 8 },
    { kind: 'c', x0: 102 * T, x1: 104 * T, speed: 0 }
  ],
  // street furniture she bumps into and can stand on
  benches: [6 * T, 27 * T, 92 * T],
  planters: [14 * T, 30 * T, 84 * T],
  crates: [96 * T + 88, 96 * T + 102],
  lost: { x: 96 * T + 128, y: G - 40, w: 30 },                    // lost and found: a tray of her glasses
  // the playroom
  screen: { x: KX + 96, y: 22, w: 176, h: 96 },
  couch: { x: KX + 132, y: 128, w: 112, h: 32 },
  kids: [{ x: KX + 160, bun: true }, { x: KX + 214, bun: false }],
  stand: KX + 92, // where she stops, inside the doorway
  camera: { x: KX + 82, y: G - 30 } // the kids' camera on its stand, aimed out of the porthole at Earth
};

export function buildMap() {
  const W = LEVEL.w, H = LEVEL.h, m = [];
  for (let y = 0; y < H; y++) m.push(new Array(W).fill(0));
  const solid = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y] && x >= 0 && x < W) m[y][x] = 1; };
  solid(0, 10, W - 1, 11); solid(0, 0, W - 1, 0);
  solid(0, 0, 0, 9); solid(CW, 0, CW, 9); solid(W - 1, 0, W - 1, 9);
  return { W, H, m };
}

// text painted into a Painter through the game's own pixel font
function ptext(p, s, x, y, c) { pixText({ fillStyle: () => {}, fillRect: (a, b, w, h) => p.rect(a, b, w, h, c) }, s, x, y, c, 1, 1); }

// A 1 px outline around whatever is painted (characters, so they read against any wall).
export function outline(p, color, noBottom) {
  const { w, h } = p, d = p.ctx.getImageData(0, 0, w, h).data, on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  const out = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || (!noBottom && on(x, y + 1)))) out.push([x, y]);
  out.forEach(([x, y]) => p.px(x, y, color || '#0e0f12'));
}

export function earthDisc(p, x, y, r, fires) {
  p.circle(x, y, r, M.earth);
  p.ellipse(x - Math.round(r * 0.3), y - Math.round(r * 0.2), Math.max(1, Math.round(r * 0.35)), Math.max(1, Math.round(r * 0.25)), M.earthLand);
  p.ellipse(x + Math.round(r * 0.2), y + Math.round(r * 0.35), Math.max(1, Math.round(r * 0.25)), Math.max(1, Math.round(r * 0.18)), M.earthLand);
  p.rect(x - Math.round(r * 0.6), y + Math.round(r * 0.05), Math.round(r * 0.8), 1, M.earthCloud);
  for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35), sw = Math.round(hw * 0.5); p.rect(x + hw - sw, y + dy, sw + 1, 1, M.earthShade); }
  if (fires) { const r2 = rng(x + y); for (let i = 0; i < Math.max(2, r); i++) p.px(x + Math.round((r2() - 0.2) * r), y + Math.round((r2() - 0.5) * r * 1.4), M.fire); }
}
function porthole(p, x, y, r) {
  p.circle(x, y, r + 3, M.trim); p.circle(x, y, r + 1, M.trimLo); p.circle(x, y, r, M.space);
  const rs = rng(x * 7 + y); for (let i = 0; i < r; i++) { const a = rs() * Math.PI * 2, d = rs() * (r - 2); p.px(x + Math.cos(a) * d, y + Math.sin(a) * d - 2, M.star); }
  earthDisc(p, x + Math.round(r * 0.25), y - Math.round(r * 0.3), Math.max(3, Math.round(r * 0.36)), true);
  for (let dy = Math.round(r * 0.45); dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); p.rect(x - hw, y + dy, 2 * hw + 1, 1, dy < r * 0.6 ? M.lunarHi : M.lunar); }
  p.rect(x - r, y - 1, 2, 3, M.trimHi); p.rect(x + r - 1, y - 1, 2, 3, M.trimHi);
}

// one Earth channel, painted small; these are what the people up here watch
export function channel(p, x, y, w, h, kind, seed) {
  const r = rng(seed), mid = y + Math.round(h * 0.62);
  p.rect(x - 1, y - 1, w + 2, h + 2, M.bezel); p.rect(x, y, w, h, M.screen);
  if (kind === 'estate' || kind === 'grounds') { p.rect(x, y, w, h, '#1b1c21'); p.poly([[x + 6, y + 11], [x + w / 2, y + 4], [x + w - 6, y + 11]], '#d6a03c'); for (let i = 0; i < 4; i++) p.rect(x + 8 + i * ((w - 16) / 3.4), y + 11, 2, h - 15, '#b8b2a3'); p.rect(x + 4, y + h - 3, w - 8, 2, '#b8b2a3'); if (kind === 'grounds') { p.rect(x + 5, y + h - 8, 2, 5, '#ebe6d8'); p.px(x + 5, y + h - 9, '#261f15'); } }
  else if (kind === 'street') { p.rect(x, y, w, h, '#1b1c21'); for (let i = 0; i < 5; i++) { const bh = 6 + Math.floor(r() * (h - 8)); p.rect(x + 2 + i * (w / 5), y + h - bh, w / 5 - 2, bh, r() < 0.5 ? '#45474d' : '#2e3036'); } p.px(x + w * 0.6, y + h - 4, '#e3412b'); }
  else if (kind === 'field') { p.rect(x, y, w, mid - y, '#2e3036'); p.rect(x, mid, w, y + h - mid, '#45474d'); for (let i = 0; i < 9; i++) p.px(x + r() * w, mid + 1 + r() * (y + h - mid - 2), '#6b6c70'); p.rect(x + w * 0.4, mid - 4, 2, 4, '#ebe6d8'); }
  else if (kind === 'hall') { p.rect(x, y, w, h, '#1b1c21'); p.rect(x, y + h - 5, w, 5, '#1b1c21'); p.rect(x + w * 0.3, y + h - 11, 2, 6, '#ebe6d8'); p.rect(x + w * 0.5, y + h - 8, w * 0.5, 1, '#e3412b'); }
  else if (kind === 'sat') { p.rect(x, y, w, h, '#3a2f1f'); for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 5; gx++) if (r() < 0.75) p.rect(x + 2 + gx * (w / 5), y + 2 + gy * (h / 3), w / 5 - 3, h / 3 - 3, r() < 0.5 ? '#6b6c70' : '#8f8d87'); p.rect(x + w * 0.6 - 4, y + h * 0.45, 9, 1, '#d6a03c'); p.rect(x + w * 0.6, y + h * 0.45 - 4, 1, 9, '#d6a03c'); }
  else if (kind === 'beach') { p.rect(x, y, w, h * 0.45, '#ebe6d8'); p.rect(x, y + h * 0.45, w, h * 0.25, '#6b6c70'); p.rect(x, y + h * 0.7, w, h * 0.3, '#f2d58c'); p.px(x + w * 0.7, y + h * 0.78, '#d6a03c'); }
  else if (kind === 'crowd') { p.rect(x, y, w, h, '#2e3036'); for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) p.rect(x + 1 + i * (w / 9) + (j % 2) * 2, y + 5 + j * 5, 2, 2, ['#ebe6d8', '#d6a03c', '#8a5f1c', '#54432a'][(i + j) % 4]); }
  else if (kind === 'ridge') { p.rect(x, y, w, h, '#0e0f12'); p.poly([[x, y + h], [x + w * 0.3, y + h * 0.55], [x + w * 0.7, y + h * 0.7], [x + w, y + h * 0.5], [x + w, y + h]], '#1b1c21'); p.rect(x + w * 0.35, y + h * 0.5, 1, 3, '#ebe6d8'); p.rect(x + w * 0.38, y + h * 0.48, 1, 4, '#6b6c70'); p.px(x + w * 0.8, y + 3, '#ebe6d8'); }
  else if (kind === 'bedroom') { p.rect(x, y, w, h, '#1b1c21'); p.rect(x + 4, y + h - 9, w * 0.5, 5, '#ebe6d8'); p.rect(x + w * 0.62, y + 4, 6, h - 6, '#000000'); p.rect(x + w * 0.62 - 1, y + 3, 8, 1, '#6b6c70'); p.rect(x + 7, y + h - 5, 4, 2, '#6b6c70'); }
  else { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (r() < 0.4) p.px(x + xx, y + yy, r() < 0.5 ? '#6b6c70' : '#b8b2a3'); }
  p.mark('tile', x, y, { w, h, kind });
}

// people on a sofa, from behind, the tops of their heads lit by the screens
function adult(p, x, y, style) {
  p.rect(x - 7, y + 5, 15, 10, M.adult); p.rect(x - 6, y + 4, 13, 1, M.adult);           // shoulders
  p.rect(x - 3, y - 4, 7, 9, M.adult); p.rect(x - 4, y - 3, 9, 7, M.adult);              // head
  if (style === 1) p.rect(x - 2, y - 7, 5, 3, M.adult);                                  // a bun
  if (style === 2) { p.rect(x - 5, y - 2, 2, 9, M.adult); p.rect(x + 4, y - 2, 2, 9, M.adult); } // long hair
  if (style === 3) p.rect(x - 5, y - 6, 11, 2, M.adult);                                 // a hat
  p.rect(x - 2, style === 1 ? y - 7 : y - 4, 5, 1, M.adultHi); p.rect(x - 6, y + 4, 3, 1, M.adultHi); p.rect(x + 4, y + 4, 3, 1, M.adultHi);
}

function paintRoomBehindGlass(p, R, i) {
  const x0 = R.x0, x1 = R.x1, w = x1 - x0, top = 26, bottom = 140;
  p.rect(x0, top, w, bottom - top, M.room); p.rect(x0, bottom - 14, w, 14, M.roomLo);
  // the wall of channels
  const cols = R.tiles.length > 6 ? 4 : 3, tw = 30, th = 20, gap = 6, gw = cols * tw + (cols - 1) * gap, gx = x0 + Math.round((w - gw) / 2);
  R.tiles.forEach((k, j) => channel(p, gx + (j % cols) * (tw + gap), top + 8 + Math.floor(j / cols) * (th + 6), tw, th, k, 31 + i * 17 + j));
  // a lamp, a side table with a drink
  p.rect(x0 + 8, 96, 3, 30, M.trimLo); p.rect(x0 + 5, 88, 9, 6, M.trim); p.rect(x0 + 6, 94, 7, 1, M.warm);
  p.rect(x1 - 18, 112, 10, 3, M.trim); p.rect(x1 - 14, 115, 2, 11, M.trimLo); p.rect(x1 - 15, 107, 3, 5, M.white); p.px(x1 - 14, 108, M.pink);
  // the sofa from behind, heads lit by the screens
  const sx = x0 + 22, sw = w - 44, n = R.seats;
  for (let s = 0; s < n; s++) adult(p, Math.round(sx + 10 + s * (sw - 20) / Math.max(1, n - 1)), 100, (s + i) % 4);
  p.rect(sx, 110, sw, 14, M.sofa); p.rect(sx, 110, sw, 2, M.sofaHi); p.rect(sx - 4, 108, 6, 18, M.sofaLo); p.rect(sx + sw - 2, 108, 6, 18, M.sofaLo); p.rect(sx, 124, sw, 4, M.sofaLo);
  p.mark('room', x0, top, { w, i });
  // the glass: gold mullions, reflections
  p.rect(x0 - 3, top - 3, w + 6, 3, M.trim); p.rect(x0 - 3, bottom, w + 6, 4, M.trim); p.rect(x0 - 3, bottom + 4, w + 6, 1, M.trimLo);
  for (let x = x0 - 3; x <= x1; x += Math.round(w / 3)) { p.rect(x, top - 3, 3, bottom - top + 7, M.trim); p.rect(x + 1, top - 3, 1, bottom - top + 7, M.trimHi); }
  // the glass: two thin reflections, hard lines
  [x0 + 14, x0 + 18, x0 + Math.round(w * 0.55)].forEach((rx, i) => { for (let y = top + 3; y < top + (i === 1 ? 9 : 14); y++) p.px(rx - Math.round((y - top) * 0.5), y, M.glassHi); });
}

// a door that does not match itself: the twin of the one in the bedroom, never used
function oddDoor(p, D, clean) {
  p.rect(D.x - 3, D.y - 4, D.w + 6, D.h + 4, M.trim);
  p.rect(D.x, D.y, D.w / 2, D.h, '#54432a'); for (let y = D.y + 3; y < D.y + D.h - 3; y += 3) p.rect(D.x + 2, y, D.w / 2 - 4, 1, '#54432a'); p.px(D.x + D.w / 2 - 2, D.y + 18, M.trim);
  p.rect(D.x + D.w / 2, D.y, D.w / 2, D.h, M.wallHi); p.rect(D.x + D.w / 2 + 2, D.y + 4, D.w / 2 - 4, 12, '#ebe6d8'); p.rect(D.x + D.w / 2 + 2, D.y + 18, 2, 2, M.wallLo);
  p.rect(D.x + D.w / 2, D.y, 1, D.h, M.adult);
  if (clean) { p.rect(D.x + D.w / 2 - 5, D.y - 10, 10, 6, M.trimLo); ptext(p, '07', D.x + D.w / 2 - 3, D.y - 9, M.trimHi); }
}

// ------------------------------------------------------------------ the sky and the skyline
// Behind everything, fixed: black, stars, Earth over the dome, the dome's ribs catching light.
export function paintSky() {
  const p = new Painter(320, 180), r = rng(9);
  p.rect(0, 0, 320, 180, M.space);
  p.rect(0, 120, 320, 60, 'd:#1b1c21:#0e0f12:q25'); p.rect(0, 150, 320, 30, 'd:#1b1c21:#0e0f12:checker');
  for (let i = 0; i < 120; i++) p.px(r() * 320, r() * 140, i % 11 ? M.star : M.white);
  // Earth, mostly in shadow, small fires on the dark side
  const ex = 76, ey = 44, er = 26;
  p.circle(ex, ey, er + 2, '#1b1c21');
  earthDisc(p, ex, ey, er, true);
  for (let dy = -er; dy <= er; dy++) { const hw = Math.floor(Math.sqrt(er * er - dy * dy) + 0.35), sw = Math.round(hw * 1.2); p.rect(ex + hw - Math.min(2 * hw + 1, sw), ey + dy, Math.min(2 * hw + 1, sw), 1, M.earthShade); }
  const rf = rng(4); for (let i = 0; i < 14; i++) { const a = rf() * Math.PI * 2, d = rf() * er * 0.9; const x = ex + Math.cos(a) * d, y = ey + Math.sin(a) * d; if (x > ex - er * 0.2) p.px(x, y, i % 3 ? M.fire : '#f2d58c'); }
  // the dome: ribs that arc over the city, one pixel wide
  for (let i = 0; i < 7; i++) { const x0 = -40 + i * 66; for (let x = 0; x < 120; x += 2) p.px(x0 + x, 6 + Math.round(Math.pow(x / 120 - 0.5, 2) * 40 + i * 2), '#3a2f1f'); }
  return p;
}
// far towers in the haze, slow: thin, lit windows, the CH 07 mast with its red light
export function paintFar(width) {
  const p = new Painter(width, 180), r = rng(31);
  for (let x = 0; x < width;) {
    const w = 12 + Math.floor(r() * 18), top = 40 + Math.floor(r() * 60);
    p.rect(x, top, w, 180 - top, r() < 0.5 ? M.far : M.haze); p.rect(x, top, w, 1, M.farHi);
    for (let y = top + 4; y < 150; y += 5) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (r() < 0.22) p.px(xx, y, r() < 0.5 ? '#8a5f1c' : '#54432a');
    if (r() < 0.25) { p.rect(x + Math.floor(w / 2), top - 10, 1, 10, M.farHi); p.mark('beacon', x + Math.floor(w / 2), top - 11); }
    x += w + Math.floor(r() * 10);
  }
  const mx = Math.round(width * 0.62); p.rect(mx - 3, 20, 7, 160, M.far); p.rect(mx - 1, 6, 3, 14, M.farHi); p.rect(mx - 8, 30, 17, 9, M.farHi); ptext(p, '07', mx - 3, 32, M.pink); p.mark('beacon', mx, 5);
  return p;
}
// the middle distance: lighter buildings with balconies, the tram's rail, billboards
export function paintMid(width) {
  const p = new Painter(width, 180), r = rng(57);
  for (let x = 0; x < width;) {
    const w = 30 + Math.floor(r() * 40), top = 62 + Math.floor(r() * 46);
    p.rect(x, top, w, 180 - top, M.midLo); p.rect(x, top, w, 2, M.mid); p.rect(x + w - 2, top, 2, 180 - top, M.floorLo);
    for (let y = top + 6; y < 160; y += 9) { p.rect(x + 3, y, w - 6, 1, M.mid); for (let xx = x + 5; xx < x + w - 5; xx += 6) p.rect(xx, y + 2, 3, 4, r() < 0.3 ? '#d6a03c' : '#2e3036'); }
    if (r() < 0.4) { const bw = Math.min(w - 8, 30); p.rect(x + 4, top - 18, bw, 14, M.bezel); p.rect(x + 5, top - 17, bw - 2, 12, '#0e0f12'); ptext(p, ['CH 07', 'ON AIR', 'LIVE', 'ROUND 2'][Math.floor(r() * 4)], x + 7, top - 13, M.trim); }
    x += w + 4 + Math.floor(r() * 14);
  }
  // the tram's rail on pylons
  p.rect(0, 70, width, 3, M.midLo); p.rect(0, 70, width, 1, M.mid);
  for (let x = 20; x < width; x += 90) { p.rect(x, 73, 4, 107, M.midLo); p.rect(x - 2, 73, 8, 2, M.wallLo); }
  return p;
}

// ------------------------------------------------------------------ the street
function lamp(p, x) {
  p.rect(x, G - 46, 2, 46, M.trimLo); p.rect(x - 1, G - 4, 4, 4, M.trimLo); p.rect(x - 3, G - 50, 8, 4, M.trim); p.rect(x - 2, G - 56, 6, 6, M.warm); p.rect(x - 1, G - 57, 4, 1, M.warm); p.rect(x - 2, G - 51, 6, 1, M.trimHi);
  p.mark('lamp', x + 1, G - 53);
}
function bench(p, x) { p.rect(x, G - 10, 30, 3, M.trim); p.rect(x + 2, G - 7, 2, 7, M.trimLo); p.rect(x + 26, G - 7, 2, 7, M.trimLo); p.rect(x, G - 13, 30, 3, M.sofa); }
function planter(p, x, r) { p.rect(x, G - 12, 12, 12, M.trim); p.rect(x + 1, G - 12, 10, 2, M.trimHi); for (let i = 0; i < 8; i++) p.ellipse(x + 6 + Math.round((r() - 0.5) * 12), G - 18 - Math.round(r() * 14), 3, 2, i % 2 ? '#6b6c70' : '#8f8d87'); }
// the fountain, the twin of the one on the grounds: gold tiers, water that never stops
function fountain(p, x) {
  p.rect(x - 34, G - 12, 68, 12, M.trim); p.rect(x - 34, G - 12, 68, 2, M.trimHi); p.rect(x - 30, G - 10, 60, 6, '#b8b2a3');
  p.rect(x - 3, G - 44, 6, 34, M.trimLo); p.rect(x - 16, G - 30, 32, 4, M.trim); p.rect(x - 16, G - 30, 32, 1, M.trimHi);
  p.rect(x - 9, G - 44, 18, 3, M.trim); p.circle(x, G - 48, 3, M.trimHi);
  p.mark('fountain', x, G - 48);
}
// a coin viewer on a post, aimed up at Earth
function viewer(p, x) { p.rect(x, G - 26, 3, 26, M.trimLo); p.rect(x - 4, G - 34, 11, 7, M.trim); p.rect(x + 7, G - 33, 3, 3, M.bezel); p.rect(x - 6, G - 32, 3, 3, M.bezel); p.rect(x - 2, G - 2, 7, 2, M.trimLo); }
// a building: two floors of windows over a lounge behind glass
function building(p, B, r) {
  const w = B.x1 - B.x0;
  p.rect(B.x0, B.top, w, G - B.top, M.wallHi); p.rect(B.x0, B.top, w, 3, M.trim); p.rect(B.x0, B.top + 3, w, 1, M.trimLo); p.rect(B.x1 - 3, B.top, 3, G - B.top, M.wallLo);
  for (let y = B.top + 6; y < 22; y += 8) for (let x = B.x0 + 6; x < B.x1 - 8; x += 10) { p.rect(x, y, 6, 6, M.trimLo); p.rect(x + 1, y + 1, 4, 4, r() < 0.5 ? M.warm : M.screenGlow); }
  // a bronze plinth under the glass, so people on the street read against it
  p.rect(B.x0, 144, w, G - 144, '#3a2f1f'); p.rect(B.x0, 144, w, 1, '#54432a'); for (let x = B.x0 + 8; x < B.x1 - 4; x += 16) p.rect(x, 148, 1, G - 150, '#261f15');
}
// the door she came out of, on a plinth behind ropes, a plaque in front
function exhibitDoor(p, A) {
  p.rect(A.x - 10, G - 4, A.w + 20, 4, M.trim); p.rect(A.x - 10, G - 4, A.w + 20, 1, M.trimHi);
  oddDoor(p, A, true);
  [A.x - 16, A.x + A.w + 14].forEach(x => { p.rect(x, G - 14, 2, 14, M.trimLo); p.circle(x + 1, G - 15, 1, M.trim); });
  for (let i = 0; i <= 10; i++) p.px(A.x - 15 + i * 2, G - 13 + Math.round(Math.sin(i / 10 * Math.PI) * 3), '#d6a03c');
  for (let i = 0; i <= 10; i++) p.px(A.x + A.w + 15 - i * 2, G - 13 + Math.round(Math.sin(i / 10 * Math.PI) * 3), '#d6a03c');
}
// where the city stops being pretty: plain walls, a loading bay, pipes, the staff door
function serviceEnd(p, x0, x1, D, r) {
  p.rect(x0, 40, x1 - x0, G - 40, M.service); p.rect(x0, 40, x1 - x0, 2, M.serviceLo);
  for (let x = x0; x < x1; x += 24) p.rect(x, 42, 1, G - 42, M.serviceLo);
  p.rect(x0, 56, x1 - x0, 3, M.serviceLo); p.rect(x0, 62, x1 - x0, 2, M.serviceLo);
  p.rect(x0 + 18, G - 44, 44, 44, M.serviceLo); for (let y = G - 42; y < G; y += 4) p.rect(x0 + 19, y, 42, 1, M.service);
  ptext(p, 'LOADING', x0 + 26, G - 52, M.serviceLo);
  for (let i = 0; i < 3; i++) { const cx = x0 + 74 + i * 14; p.rect(cx, G - 12, 12, 12, '#54432a'); p.rect(cx, G - 12, 12, 1, '#8a5f1c'); }
  p.rect(D.x - 3, D.y - 3, D.w + 6, D.h + 3, M.serviceLo); p.rect(D.x, D.y, D.w, D.h, '#8f8d87'); p.rect(D.x + 5, D.y + 6, 12, 8, M.wallHi); p.rect(D.x + D.w - 5, D.y + 18, 3, 2, '#8f8d87');
  p.rect(D.x - 4, D.y - 14, D.w + 8, 9, M.red); ptext(p, 'STAFF', D.x + 1, D.y - 12, M.white);
  p.rect(x1 - 24, 46, 6, 70, M.serviceLo); p.mark('steam', x1 - 21, 46);
  // lost and found: a hatch with a tray of glasses, all the same as hers
  const L = LEVEL.lost; p.rect(L.x - 7, L.y - 12, L.w + 14, 9, M.serviceLo); ptext(p, 'LOST+FOUND', L.x - 5, L.y - 10, '#b8b2a3');
  p.rect(L.x - 2, L.y - 2, L.w + 4, 22, M.serviceLo); p.rect(L.x, L.y, L.w, 18, '#2e3036'); p.rect(L.x - 3, L.y + 18, L.w + 6, 3, '#45474d'); p.rect(L.x - 3, L.y + 18, L.w + 6, 1, M.service);
  for (let i = 0; i < 4; i++) { const gx = L.x + 2 + i * 7; p.rect(gx, L.y + 16, 2, 1, M.red); p.rect(gx + 3, L.y + 16, 2, 1, M.red); p.px(gx + 2, L.y + 16, '#0e0f12'); }
}

export function paintLevel(P, look) {
  const W = LEVEL.w * T, p = new Painter(W, 180), r = rng(77);
  // the promenade: pale paving, a gold inlay, the edge of the walk
  p.rect(0, G, CW * T, 20, M.floor); p.rect(0, G, CW * T, 1, M.floorHi); for (let x = 0; x < CW * T; x += 24) p.rect(x, G + 1, 1, 19, M.floorLo);
  p.rect(0, G + 9, CW * T, 1, M.trim);
  // the plaza: the door she came out of, the viewer, the fountain, benches
  exhibitDoor(p, LEVEL.arrive);
  viewer(p, LEVEL.viewer.x);
  fountain(p, LEVEL.fountain.x);
  bench(p, 6 * T); bench(p, 27 * T); planter(p, 14 * T, r); planter(p, 30 * T, r);
  [4, 16, 31].forEach(tx => lamp(p, tx * T + 6));
  // three buildings, each with a lounge behind glass
  LEVEL.buildings.forEach(B => building(p, B, r));
  LEVEL.rooms.forEach((R, i) => paintRoomBehindGlass(p, R, i));
  [48, 64, 79].forEach(tx => lamp(p, tx * T + 4));
  // the boulevard: the live screen on a frame
  const LV = LEVEL.live; p.rect(LV.x + LV.w / 2 - 2, LV.y + LV.h, 4, G - LV.y - LV.h, M.trimLo); p.rect(LV.x - 3, LV.y - 3, LV.w + 6, LV.h + 6, M.bezel); p.rect(LV.x, LV.y, LV.w, LV.h, '#1b1c21');
  planter(p, 84 * T, r); bench(p, 92 * T);
  // the service end and the staff door
  serviceEnd(p, 96 * T, CW * T, LEVEL.door, r);
  // the wall at the end of the city, and the playroom beyond it
  p.rect(CW * T, 0, T, G, M.wallLo); p.rect(CW * T, 0, 1, G, M.trim);
  paintPlayroom(p);
  p.rect((LEVEL.w - 1) * T, 0, T, G, '#261f15');
  return p;
}

// the playroom, at X (the Moon level paints it at KX; the kids' room shot paints it at 0)
export function paintPlayroom(p, at) {
  const X = at == null ? KX : at, o = X - KX, r = rng(23);
  // a rich child's room at night: bronze walls, gold trim, the screen the only big light
  p.rect(X, 0, 20 * T, G, '#3a2f1f'); p.rect(X, 0, 20 * T, 10, '#261f15'); p.rect(X, 10, 20 * T, 2, M.trim); p.rect(X, 12, 20 * T, 1, M.trimLo);
  // wallpaper: small gold stars in rows, the same star over and over
  for (let y = 22; y < 126; y += 14) for (let x = X + 8 + ((y / 14) % 2) * 7; x < X + 20 * T - 6; x += 14) {
    const S = LEVEL.screen; if (x > S.x + o - 8 && x < S.x + o + S.w + 8 && y < S.y + S.h + 8) continue;
    p.px(x, y - 1, '#54432a'); p.rect(x - 1, y, 3, 1, '#54432a'); p.px(x, y + 1, '#54432a');
  }
  p.rect(X, 126, 20 * T, 2, M.trimLo); p.rect(X, 128, 20 * T, G - 128, '#261f15'); // a dado, a dark skirting
  p.rect(X, G, 20 * T, 20, '#54432a'); p.rect(X, G, 20 * T, 1, M.trim); for (let x = X; x < X + 20 * T; x += 24) p.rect(x, G + 1, 1, 19, '#3a2f1f');
  for (let x = X + 96; x < X + 286; x += 8) p.rect(x, G + 4, 4, 2, M.rugLo); p.rect(X + 92, G + 3, 196, 1, M.rug); p.rect(X + 92, G + 6, 196, 1, M.rug);
  // the big screen's frame; what it shows is live
  const S = Object.assign({}, LEVEL.screen, { x: LEVEL.screen.x + o }); p.rect(S.x - 5, S.y - 5, S.w + 10, S.h + 10, '#0e0f12'); p.rect(S.x - 4, S.y - 4, S.w + 8, S.h + 8, M.bezel); p.rect(S.x - 4, S.y - 4, S.w + 8, 1, '#54432a'); p.rect(S.x, S.y, S.w, S.h, '#0e0f12');
  p.rect(S.x + S.w / 2 - 12, S.y + S.h + 4, 24, 3, M.bezel); ptext(p, 'CH 07', S.x + S.w / 2 - 9, S.y + S.h + 9, M.trimLo);
  // a porthole with Earth, the doorway she came in by, blocks, a rocket lamp
  porthole(p, X + 52, 54, 18);
  p.rect(X + 8, G - 40, 26, 40, '#0e0f12'); p.rect(X + 6, G - 42, 30, 2, M.trim); p.rect(X + 6, G - 42, 2, 42, M.trim); p.rect(X + 34, G - 42, 2, 42, M.trim);
  [[X + 60, G - 8, 8, 8, M.yellow], [X + 68, G - 6, 6, 6, M.blue], [X + 63, G - 12, 6, 4, M.pink]].forEach(([x, y, w, h, c]) => { p.rect(x, y, w, h, c); p.rect(x, y, w, 1, '#ebe6d8'); p.rect(x + w - 1, y + 1, 1, h - 1, '#8a5f1c'); });
  p.poly([[X + 296, G], [X + 302, G - 22], [X + 308, G]], M.white); p.rect(X + 300, G - 6, 4, 6, M.pink); p.px(X + 302, G - 14, '#0e0f12'); p.rect(X + 301, G - 24, 3, 2, M.warm);
  // trophies on a shelf: gold cups, one shaped like a satellite
  p.rect(X + 250, 70, 50, 3, M.trim); p.rect(X + 250, 73, 50, 1, M.trimLo);
  [[X + 256, 'cup'], [X + 270, 'sat'], [X + 286, 'cup']].forEach(([x, k]) => {
    if (k === 'cup') { p.rect(x, 62, 6, 5, M.trim); p.rect(x + 2, 67, 2, 3, M.trimLo); p.px(x + 1, 63, M.trimHi); }
    else { p.rect(x + 2, 62, 4, 4, M.trim); p.rect(x - 2, 63, 4, 2, '#b8b2a3'); p.rect(x + 6, 63, 4, 2, '#b8b2a3'); p.rect(x + 3, 66, 2, 4, M.trimLo); }
  });
  // the couch the kids sit on, from behind: gold, buttoned, a lot of it
  const C = Object.assign({}, LEVEL.couch, { x: LEVEL.couch.x + o });
  p.rect(C.x - 1, C.y - 1, C.w + 2, C.h - 6, '#0e0f12');
  p.rect(C.x, C.y, C.w, C.h - 8, M.trim); p.rect(C.x, C.y, C.w, 2, M.trimHi); p.rect(C.x, C.y + C.h - 10, C.w, 2, M.trimLo);
  for (let x = C.x + 10; x < C.x + C.w - 4; x += 14) { p.px(x, C.y + 8, M.trimLo); p.px(x + 7, C.y + 15, M.trimLo); }
  p.rect(C.x - 7, C.y - 5, 9, C.h - 3, '#0e0f12'); p.rect(C.x - 6, C.y - 4, 7, C.h - 4, '#8a5f1c'); p.rect(C.x - 6, C.y - 4, 7, 1, M.trim);
  p.rect(C.x + C.w - 2, C.y - 5, 9, C.h - 3, '#0e0f12'); p.rect(C.x + C.w - 1, C.y - 4, 7, C.h - 4, '#8a5f1c'); p.rect(C.x + C.w - 1, C.y - 4, 7, 1, M.trim);
  p.rect(C.x, C.y + C.h - 8, C.w, 8, '#8a5f1c'); p.rect(C.x + 4, G - 2, 4, 2, '#3a2f1f'); p.rect(C.x + C.w - 8, G - 2, 4, 2, '#3a2f1f');
}

// ------------------------------------------------------------------ people
// Big flat figures (Jump King scale): 20 to 24 px, a few colors each, 1 px dark outline, a face
// of one or two pixels. Drawn facing right; the scene flips them.
// Frames: idle0, idle1 (a breath: the top half sinks a pixel), walk0, walk1, film (a phone up).
const NPC = {
  // a woman in a long gold coat, a big gold-blonde bun, a glass
  a: { skin: '#b8b2a3', hair: '#f2d58c', hairLo: '#d6a03c', top: '#d6a03c', topLo: '#8a5f1c', leg: '#8a5f1c', shoe: '#261f15', long: true, bun: true },
  // a man in a bone suit, a gold tie, hair slicked flat
  b: { skin: '#8f8d87', hair: '#1b1c21', hairLo: '#1b1c21', top: '#ebe6d8', topLo: '#b8b2a3', leg: '#b8b2a3', shoe: '#1b1c21', tie: '#d6a03c' },
  // a waiter: black vest over a bone shirt, a gold tray
  w: { skin: '#b8b2a3', hair: '#2e3036', hairLo: '#2e3036', top: '#ebe6d8', topLo: '#b8b2a3', leg: '#1b1c21', shoe: '#0e0f12', vest: '#1b1c21' },
  // crew on a break: the creator's coat, a lanyard, a paper cup
  c: { skin: '#8f8d87', hair: '#45474d', hairLo: '#2e3036', top: '#2e3036', topLo: '#1b1c21', leg: '#1b1c21', shoe: '#0e0f12', long: true, lanyard: '#d6a03c' }
};
export const NPC_FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'film'];
export function paintNpc(kind, frame) {
  const c = NPC[kind], p = new Painter(18, 27), sink = frame === 'idle1' ? 1 : 0, ox = 3, top = 2 + sink;
  // legs and shoes (feet on the bottom row)
  const ly = c.long ? 20 : 18, lh = 26 - ly;
  if (frame === 'walk1') { p.rect(ox + 1, ly, 3, lh, c.leg); p.rect(ox + 7, ly, 3, lh, c.leg); p.rect(ox, 25, 4, 1, c.shoe); p.rect(ox + 7, 25, 4, 1, c.shoe); }
  else if (frame === 'walk0') { p.rect(ox + 3, ly, 3, lh, c.leg); p.rect(ox + 6, ly, 2, lh - 1, c.topLo); p.rect(ox + 3, 25, 5, 1, c.shoe); }
  else { p.rect(ox + 2, ly, 3, lh, c.leg); p.rect(ox + 6, ly, 3, lh, c.leg); p.rect(ox + 2, 25, 3, 1, c.shoe); p.rect(ox + 6, 25, 4, 1, c.shoe); }
  // body: a fat block, shaded on the back side
  const by = top + 8, bh = (c.long ? 20 : 18) - by + (c.long ? 0 : 0);
  p.rect(ox, by, 11, bh, c.top); p.rect(ox, by, 2, bh, c.topLo); p.rect(ox + 1, by - 1, 9, 1, c.top);
  if (c.long) { p.rect(ox - 1, ly - 3, 13, 3, c.top); p.rect(ox - 1, ly - 3, 2, 3, c.topLo); }
  if (c.vest) { p.rect(ox + 2, by + 1, 8, bh - 2, c.vest); p.rect(ox + 6, by + 1, 1, 4, c.top); }
  if (c.tie) { p.rect(ox + 7, by, 2, 6, c.tie); p.px(ox + 7, by + 6, c.tie); }
  if (c.lanyard) { p.px(ox + 6, by, c.lanyard); p.px(ox + 7, by + 1, c.lanyard); p.px(ox + 8, by + 2, c.lanyard); p.rect(ox + 8, by + 3, 2, 3, '#ebe6d8'); }
  // head: hair, a face with one eye
  const hx = ox + 2, hy = top;
  p.rect(hx, hy + 1, 8, 6, c.skin); p.rect(hx + 1, hy, 6, 1, c.hair); p.rect(hx, hy + 1, 4, 3, c.hair); p.rect(hx, hy + 1, 8, 1, c.hair);
  p.rect(hx + 3, hy + 7, 4, 1, c.skin); // neck
  p.px(hx + 6, hy + 3, '#0e0f12');
  if (c.bun) { p.rect(hx - 1, hy - 2, 5, 4, c.hair); p.rect(hx - 1, hy + 1, 1, 2, c.hairLo); }
  if (kind === 'b') p.rect(hx + 7, hy + 5, 1, 1, '#45474d');
  // the arm in front, and what they hold
  const ax = ox + 7, ay = by + 1;
  if (frame === 'film') {
    // the phone held up at arm's length, its screen toward her
    p.rect(ax, ay, 3, 2, c.top); p.rect(ax + 2, ay - 3, 2, 4, c.top); p.rect(ax + 3, ay - 6, 3, 5, '#0e0f12'); p.px(ax + 4, ay - 5, '#f5ce77');
  } else {
    p.rect(ax, ay, 3, 7, c.top); p.rect(ax, ay + 7, 3, 2, c.skin);
    if (kind === 'a') { p.rect(ax + 3, ay + 3, 2, 4, '#ebe6d8'); p.px(ax + 3, ay + 4, '#d6a03c'); }
    if (kind === 'w') { p.rect(ax + 1, ay + 4, 6, 1, '#d6a03c'); p.rect(ax + 4, ay + 1, 2, 3, '#ebe6d8'); }
    if (kind === 'c') { p.rect(ax + 2, ay + 5, 3, 4, '#ebe6d8'); }
  }
  outline(p, '#0e0f12', true);
  return p;
}

// The two kids, about her size, rich: bone pajamas, gold hair, seen mostly from behind on their
// couch. Painted 18 x 20, the bottom row at the couch. A child's build so they read from across
// the room: a round head with ears, a short neck, shoulders wider than the head, arms marked off
// the back. The big one wears a bun; the little one (two pixels shorter) a paper crown.
// Poses: back, back1 (a breath: head and shoulders sink a pixel), cheer, cheer1 (arms up),
// turned (looking round over the left shoulder at her), squint (an arm up against a light).
export const KID_POSES = ['back', 'back1', 'cheer', 'cheer1', 'turned', 'squint'];
export function paintKid(bun, pose) {
  const p = new Painter(18, 20), ink = '#0e0f12';
  const hair = bun ? '#f2d58c' : '#d6a03c', hairLo = bun ? '#d6a03c' : '#8a5f1c';
  const cloth = '#ebe6d8', clothLo = '#b8b2a3', skin = '#b8b2a3', skinLo = '#8f8d87';
  const s = (pose === 'back1' || pose === 'cheer1' ? 1 : 0) + (bun ? 0 : 2), hy = 3 + s, by = hy + 9;
  const face = pose === 'turned' || pose === 'squint', cheer = pose === 'cheer' || pose === 'cheer1';
  // the body: sloped shoulders, then the back, the arms marked off by a fold
  p.rect(6, by, 6, 1, cloth); p.rect(4, by + 1, 10, 1, cloth); p.rect(3, by + 2, 12, 20 - by - 2, cloth);
  p.rect(5, by + 3, 1, 20 - by - 3, clothLo); p.rect(12, by + 3, 1, 20 - by - 3, clothLo);
  p.rect(7, by, 4, 1, clothLo); // the back of the collar
  if (face) { p.rect(3, by + 2, 2, 20 - by - 2, clothLo); } // turning: the near shoulder in shade
  // the neck, and the head: round, all hair from behind, the nape darker
  p.rect(7, hy + 8, 4, 1, skinLo);
  p.rect(6, hy, 6, 1, hair); p.rect(5, hy + 1, 8, 6, hair); p.rect(6, hy + 7, 6, 1, hairLo);
  p.rect(5, hy + 5, 1, 2, hairLo); p.rect(12, hy + 5, 1, 2, hairLo);
  // ears: what makes the back of a head a head
  if (!face) { p.rect(4, hy + 3, 1, 2, skin); p.px(4, hy + 4, skinLo); }
  p.rect(13, hy + 3, 1, 2, skin); p.px(13, hy + 4, skinLo);
  if (bun) { p.rect(7, hy - 4, 4, 3, hair); p.px(7, hy - 2, hairLo); p.rect(8, hy - 1, 2, 1, '#8a5f1c'); } // a top knot, tied
  else { p.rect(5, hy - 2, 8, 2, cloth); p.rect(5, hy - 1, 8, 1, clothLo); p.px(5, hy - 3, cloth); p.px(8, hy - 3, cloth); p.px(9, hy - 3, cloth); p.px(12, hy - 3, cloth); p.px(9, hy - 2, '#d6a03c'); } // a paper crown
  if (face) {
    // three quarters toward her: a fringe, one eye, a nose that breaks the outline, a mouth
    p.rect(4, hy + 3, 4, 4, skin); p.rect(5, hy + 7, 2, 1, skin); p.rect(4, hy + 2, 5, 1, hair); p.px(4, hy + 3, hair);
    p.px(5, hy + 4, ink); p.px(3, hy + 5, skin); p.px(4, hy + 6, skinLo); p.rect(7, hy + 4, 1, 3, skinLo); p.rect(8, hy + 4, 1, 2, skin);
  }
  if (pose === 'squint') { p.rect(2, hy + 2, 6, 2, cloth); p.rect(2, hy + 4, 2, by - hy - 2, cloth); p.rect(1, hy + 2, 2, 2, skin); p.px(5, hy + 4, ink); }
  if (cheer) {
    // both arms up, hands open
    p.rect(2, by - 2, 2, 4, cloth); p.rect(1, hy - 1, 2, by - hy - 1, cloth); p.rect(1, hy - 3, 2, 2, skin);
    p.rect(14, by - 2, 2, 4, cloth); p.rect(15, hy - 1, 2, by - hy - 1, cloth); p.rect(15, hy - 3, 2, 2, skin);
  }
  outline(p, ink, true);
  return p;
}
// Her, from behind, sitting on the couch, built the same way as the kids: head, ears, shoulders.
// Painted per look from the girl's own colors.
export function paintSister(P) {
  const p = new Painter(14, 16), hy = 1, by = hy + 8;
  p.rect(5, by, 4, 1, P.kid); p.rect(3, by + 1, 8, 1, P.kid); p.rect(2, by + 2, 10, 16 - by - 2, P.kid);
  p.rect(4, by + 3, 1, 16 - by - 3, P.kidLo); p.rect(9, by + 3, 1, 16 - by - 3, P.kidLo);
  p.rect(6, hy + 7, 2, 1, P.bone);
  p.rect(5, hy, 4, 1, P.hair); p.rect(4, hy + 1, 6, 6, P.hair); p.rect(5, hy + 7, 4, 1, P.hair);
  p.px(3, hy + 3, P.bone); p.px(10, hy + 3, P.bone);
  outline(p, '#0e0f12', true);
  return p;
}

// ------------------------------------------------------------------ the kids' game
// The game the kids play on their giant screen, the same in their room (Kids.js) and when she
// walks in (Moon.js): a 7 x 7 board where a gold path draws itself from target to target, and in
// the corner the feed from Earth, a small girl on the grounds at night. g is a Phaser Graphics.
const hx = c => parseInt(c.slice(1), 16);
export const BOARD = { cols: 7, rows: 7, cs: 9,
  path: [[0, 6], [1, 6], [2, 6], [2, 5], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [5, 2], [6, 2], [6, 1], [6, 0]],
  targets: [[0, 6], [4, 4], [6, 0]] };
// u: how many cells of the path are drawn (0 to path.length)
export function drawBoard(g, bx, by, u) {
  const B = BOARD, cs = B.cs;
  g.fillStyle(hx('#2e3036'), 1);
  for (let j = 0; j < B.rows; j++) for (let i = 0; i < B.cols; i++) g.fillRect(bx + i * cs + 1, by + j * cs + 1, cs - 2, cs - 2);
  g.fillStyle(hx(M.trim), 1);
  for (let i = 0; i < Math.min(B.path.length, Math.floor(u)); i++) { const [px, py] = B.path[i]; g.fillRect(bx + px * cs + 2, by + py * cs + 2, cs - 4, cs - 4); }
  B.targets.forEach(([px, py], i) => { const reached = Math.floor(u) > B.path.findIndex(q => q[0] === px && q[1] === py); g.fillStyle(hx(reached ? M.yellow : '#8f8d87'), 1); g.fillRect(bx + px * cs + 2, by + py * cs + 2, cs - 4, cs - 4); });
}
// the feed in the corner: the grounds at night, the gate, a girl at gx (screen x); returns her x
export function drawFeedBox(g, fx, fy, fw, fh, gx) {
  g.fillStyle(hx('#1b1c21'), 1); g.fillRect(fx, fy, fw, fh);
  g.fillStyle(hx('#2e3036'), 1); g.fillRect(fx, fy + fh - 8, fw, 8);
  g.fillStyle(hx('#d6a03c'), 1); g.fillRect(fx + 30, fy + 12, 40, 3);
  g.fillStyle(hx('#b8b2a3'), 1); for (let i = 0; i < 5; i++) g.fillRect(fx + 32 + i * 8, fy + 15, 2, fh - 23);
  g.fillStyle(hx('#ebe6d8'), 1); g.fillRect(Math.round(gx), fy + fh - 13, 2, 5); g.fillStyle(hx('#261f15'), 1); g.fillRect(Math.round(gx), fy + fh - 14, 2, 1);
}
// Earth on a screen, the same as the one in the porthole: grey seas, lighter land, a band of
// cloud, the night side, small fires
export function drawEarth(g, x, y, r, t) {
  const hwAt = dy => Math.abs(dy) > r ? -1 : Math.floor(Math.sqrt(r * r - dy * dy) + 0.35);
  // a shape on the globe, cut to its edge; shapes are in units of r/30 so any size works
  const k = r / 30, drift = Math.floor(t * 1.5) % 10 - 5;
  const shape = (rects, col) => { g.fillStyle(hx(col), 1); rects.forEach(([a, b, w, h]) => { for (let j = 0; j < Math.max(1, Math.round(h * k)); j++) { const dy = Math.round(b * k) + j, hw = hwAt(dy); if (hw < 0) continue; const x0 = Math.max(-hw, Math.round(a * k) + drift), x1 = Math.min(hw, Math.round((a + w) * k) + drift - 1); if (x1 >= x0) g.fillRect(x + x0, y + dy, x1 - x0 + 1, 1); } }); };
  g.fillStyle(hx(M.earth), 1); for (let dy = -r; dy <= r; dy++) { const hw = hwAt(dy); g.fillRect(x - hw, y + dy, hw * 2 + 1, 1); }
  // two continents, ragged, narrowing to the south
  shape([[-24, -16, 10, 4], [-26, -12, 16, 5], [-22, -7, 11, 6], [-18, -1, 6, 6], [-16, 5, 4, 5], [-15, 10, 2, 3]], M.earthLand);
  shape([[2, -20, 12, 4], [-1, -16, 18, 6], [3, -10, 10, 5], [5, -5, 7, 9], [7, 4, 5, 6], [8, 10, 3, 3]], M.earthLand);
  // ice at both poles, and cloud
  g.fillStyle(hx(M.earthCloud), 1); for (let dy = -r; dy <= -r + Math.max(1, Math.round(2 * k)); dy++) { const hw = hwAt(dy); g.fillRect(x - hw, y + dy, hw * 2 + 1, 1); }
  for (let dy = r - Math.max(1, Math.round(k)); dy <= r; dy++) { const hw = hwAt(dy); g.fillRect(x - hw, y + dy, hw * 2 + 1, 1); }
  shape([[-28, 2, 14, 1], [-8, -24, 12, 1], [-12, 15, 22, 1], [4, 18, 9, 1]], M.earthCloud);
  // the night side, and its fires
  g.fillStyle(hx(M.earthShade), 1); for (let dy = -r; dy <= r; dy++) { const hw = hwAt(dy), sw = Math.round(hw * 0.5); g.fillRect(x + hw - sw, y + dy, sw + 1, 1); }
  g.fillStyle(hx(M.fire), 1); [[0.55, -0.3], [0.7, 0.2], [0.6, 0.5], [0.8, -0.1], [0.65, -0.55]].forEach(([a, b], i) => { if (Math.floor(t * 2 + i) % 3) g.fillRect(x + Math.round(a * r), y + Math.round(b * r), 1, 1); });
}

// a cleaning robot, the same model as the one in the gallery, polished
export function paintRobot(led, step) {
  const p = new Painter(14, 9);
  p.rect(5, 1, 4, 1, M.robot); p.rect(3, 2, 8, 1, M.robot); p.rect(2, 3, 10, 2, M.robot); p.px(8, 3, led);
  p.rect(1, 5, 12, 1, M.robotLo); p.rect(2, 6, 10, 1, M.robotLo); p.px(step ? 4 : 3, 7, M.adult); p.px(step ? 9 : 10, 7, M.adult);
  outline(p, '#0e0f12', true);
  return p;
}

// ------------------------------------------------------------------ the house, on the show's feeds
// Episode 1's house, small: a bronze body with gold pilasters, a white temple front (columns,
// a pediment with the gold sun), a white balustrade with gold finials, lit gold windows. Drawn
// the same way on every feed (the kids' room, the playroom's rerun, the old TV, batch 4) so the
// reveal points back at the place the class just saw. Unit design 64 x 39 px; u scales it by a
// whole number. rect(x, y, w, h, color) is the target: a Painter, a Phaser Graphics or a 2D
// canvas, through feedRect below. x0 is its left edge, g the ground it stands on.
export const FEED_HOUSE = { w: 64, h: 39 };
export function feedHouse(rect, x0, g, u = 1) {
  const r = (x, y, w, h, c) => rect(x0 + x * u, g + y * u, w * u, h * u, c);
  const bronze = '#3a2f1f', bronzeHi = '#54432a', bronzeLo = '#261f15', gold = '#d6a03c', goldHi = '#f2d58c', goldLo = '#8a5f1c', bone = '#ebe6d8', boneLo = '#b8b2a3', lit = '#f5ce77', ink = '#0e0f12';
  // the roof: a white balustrade, gold finials at the corners
  r(-1, -35, 66, 1, bone); for (let i = 1; i < 64; i += 3) r(i, -34, 1, 3, boneLo); r(-1, -31, 66, 1, bone);
  r(0, -38, 1, 3, gold); r(63, -38, 1, 3, gold); r(0, -39, 1, 1, goldHi); r(63, -39, 1, 1, goldHi);
  // the bronze body, a storey band
  r(0, -30, 64, 30, bronze); r(0, -30, 64, 1, bronzeHi); r(0, -16, 64, 1, boneLo); r(0, -15, 64, 1, goldLo);
  // gold pilasters on the wings, windows between them, some lit
  [0, 9, 18, 44, 53, 62].forEach(px => { r(px, -30, 2, 30, gold); r(px + 1, -30, 1, 30, goldLo); });
  [3, 12, 47, 56].forEach((wx, i) => [-27, -12].forEach((wy, j) => { const on = (i + j) % 3 !== 1; r(wx - 1, wy - 1, 5, 10, goldLo); r(wx, wy, 3, 8, on ? lit : ink); if (on) r(wx, wy, 1, 3, goldHi); }));
  // the temple front: a dark porch, four white columns, the lit door
  r(20, -26, 24, 26, bronzeLo); r(30, -12, 4, 12, goldHi); r(31, -11, 2, 11, lit);
  [22, 26, 36, 40].forEach(cx => { r(cx, -26, 2, 26, bone); r(cx + 1, -26, 1, 26, boneLo); r(cx - 1, -1, 4, 1, bone); });
  r(20, -28, 24, 2, bone); r(20, -28, 24, 1, gold);
  // the pediment: white inside a gold edge, the gold sun in the middle
  for (let k = 0; k < 9; k++) { const half = 13 - Math.round((k + 1) * 13 / 10), y = -29 - k; r(32 - half - 1, y, 2 * half + 2, 1, gold); if (half > 0) r(32 - half, y, 2 * half, 1, bone); }
  r(31, -33, 3, 2, gold); r(32, -34, 1, 1, gold); r(32, -33, 1, 1, goldHi);
}
// a white gate post with a gold cap and finial, the pair at the gate in episode 1
export function feedGatePost(rect, x, g, u = 1) {
  const r = (a, b, w, h, c) => rect(x + a * u, g + b * u, w * u, h * u, c);
  r(-2, -17, 5, 17, '#0e0f12'); r(-1, -16, 3, 16, '#ebe6d8'); r(1, -16, 1, 16, '#b8b2a3');
  r(-2, -18, 5, 2, '#d6a03c'); r(-1, -20, 3, 2, '#d6a03c'); r(0, -21, 1, 1, '#f2d58c');
}
// rect targets: a Painter (p.rect), a Phaser Graphics, or a 2D canvas context
export function feedRect(t) {
  if (t && typeof t.rect === 'function' && t.ctx) return (x, y, w, h, c) => t.rect(x, y, w, h, c);
  if (t && typeof t.fillStyle === 'function') return (x, y, w, h, c) => { t.fillStyle(parseInt(c.slice(1), 16), 1); t.fillRect(x, y, w, h); };
  return (x, y, w, h, c) => { t.fillStyle = c; t.fillRect(x, y, w, h); };
}

// ------------------------------------------------------------------ the last shot
// An old TV in a dark room on Earth. Every ending ends here; what the TV shows changes.
export function paintLastRoom() {
  const p = new Painter(320, 180);
  p.rect(0, 0, 320, 180, '#000000'); p.rect(0, 150, 320, 30, '#0e0f12');
  p.line(160, 20, 138, 2, '#2e3036'); p.line(160, 20, 184, 4, '#2e3036'); // rabbit ears
  p.rect(58, 20, 204, 126, '#2e3036'); p.rect(60, 22, 200, 2, '#45474d'); p.rect(58, 144, 204, 2, '#1b1c21');
  p.rect(70, 32, 150, 104, '#0e0f12');
  p.rect(228, 40, 22, 40, '#1b1c21'); for (let y = 42; y < 78; y += 3) p.rect(230, y, 18, 1, '#0e0f12');
  p.circle(239, 94, 5, '#45474d'); p.circle(239, 94, 2, '#0e0f12'); p.circle(239, 112, 5, '#45474d'); p.circle(239, 112, 2, '#0e0f12');
  p.rect(96, 146, 128, 4, '#1b1c21'); p.rect(84, 150, 152, 3, '#0e0f12');
  // the screen's light on the floor: a flat checker, nothing soft
  p.poly([[84, 153], [236, 153], [300, 180], [20, 180]], 'd:#1b1c21:#0e0f12:checker');
  return p;
}
export const TVSCREEN = { x: 72, y: 34, w: 146, h: 100, moon: { x: 140, y: 88, r: 36 }, dome: { x: 164, y: 58 } };

// What the old TV shows, drawn every frame with whole-pixel rects into the TV's own canvas.
// kind: moon (the vest; blast from 0 to 1 and beyond), rerun, ridge, playroom, couch.
// o: { t, blast, bug (the CH 07 mark; false once it goes dark), bite, pieces }
const TVW = TVSCREEN.w, TVH = TVSCREEN.h;
const stars = (() => { const r = rng(5); return Array.from({ length: 70 }, (_, i) => [Math.floor(r() * TVW), Math.floor(r() * TVH), i % 9 ? '#8f8d87' : '#ebe6d8']); })();
const glyphRect = x => (a, b, w, h) => x.fillRect(a, b, w, h);
export function tvText(x, s, px, py, c) { x.fillStyle = c; pixText({ fillStyle: () => {}, fillRect: glyphRect(x) }, s, px, py, c, 1, 1); }
function disc(x, cx, cy, r, c) { x.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); x.fillRect(cx - hw, cy + dy, 2 * hw + 1, 1); } }
function figureBack(x, cx, by, hair, body, small) { x.fillStyle = '#0e0f12'; x.fillRect(cx - 5, by - (small ? 14 : 16), 11, small ? 14 : 16); x.fillStyle = body; x.fillRect(cx - 4, by - 7, 9, 7); x.fillStyle = hair; x.fillRect(cx - 3, by - (small ? 13 : 15), 7, small ? 6 : 8); }
export function drawTv(x, kind, o) {
  const t = o.t || 0;
  x.fillStyle = '#0e0f12'; x.fillRect(0, 0, TVW, TVH);
  if (kind === 'moon') {
    stars.forEach(([sx, sy, c]) => { x.fillStyle = c; x.fillRect(sx, sy, 1, 1); });
    const m = { x: TVSCREEN.moon.x - TVSCREEN.x, y: TVSCREEN.moon.y - TVSCREEN.y, r: TVSCREEN.moon.r }, d = { x: TVSCREEN.dome.x - TVSCREEN.x, y: TVSCREEN.dome.y - TVSCREEN.y };
    const blast = o.blast || 0, grow = Math.min(1, blast / 1.3), R = 34 * (1 - Math.pow(1 - grow, 3)), cool = Math.min(1, Math.max(0, (blast - 2) / 10));
    const craters = [[124, 76, 6], [150, 100, 8], [128, 104, 4], [156, 74, 3], [114, 92, 3], [146, 82, 2], [120, 100, 2]].map(([a, b, r]) => [a - TVSCREEN.x, b - TVSCREEN.y, r]);
    const bite = o.bite || [];
    for (let py = m.y - m.r; py <= m.y + m.r; py++) for (let px = m.x - m.r; px <= m.x + m.r; px++) {
      const dm = Math.hypot(px - m.x, py - m.y); if (dm > m.r + 0.3) continue;
      let col = Math.hypot(px - (m.x - 6), py - (m.y - 6)) < m.r - 9 ? '#8f8d87' : '#6b6c70';
      for (const [cx, cy, r] of craters) { const dc = Math.hypot(px - cx, py - cy); if (dc < r) col = dc < r - 1.5 ? '#6b6c70' : '#45474d'; }
      if (R > 0.5) {
        const a = Math.atan2(py - d.y, px - d.x), i = Math.floor(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * bite.length) % Math.max(1, bite.length), rr = R * (bite.length ? (i % 2 ? bite[i] : 1) : 1), dd = Math.hypot(px - d.x, py - d.y);
        if (dd < rr) continue; // the bite: nothing, the stars behind
        if (dd < rr + 2) col = cool < 0.3 ? '#f5ce77' : cool < 0.6 ? '#d6a03c' : cool < 0.9 ? '#8a5f1c' : '#45474d';
      }
      x.fillStyle = col; x.fillRect(px, py, 1, 1);
    }
    if (blast <= 0) { x.fillStyle = '#d6a03c'; x.fillRect(d.x - 4, d.y, 8, 3); x.fillStyle = '#f2d58c'; x.fillRect(d.x - 2, d.y - 2, 4, 2); }
    if (blast > 0) {
      // the flash: a hard white disc that shrinks away, then pieces drifting out of the bite
      if (blast < 0.12) { x.fillStyle = '#ebe6d8'; x.fillRect(0, 0, TVW, TVH); }
      else if (blast < 1.2) disc(x, d.x, d.y, Math.round(10 + 30 * (1 - blast / 1.2)), blast < 0.6 ? '#ebe6d8' : '#f5ce77');
      const life = blast - 0.4;
      if (life > 0) (o.pieces || []).forEach(pc => { const dist = R * 0.6 + life * pc.v, px = Math.round(d.x + Math.cos(pc.a) * dist), py = Math.round(d.y + Math.sin(pc.a) * dist * 0.9); x.fillStyle = pc.hot && life < 6 ? '#d6a03c' : '#8f8d87'; x.fillRect(px, py, pc.s, pc.s); });
      // cracks across what is left, one pixel at a time
      if (blast > 1.4) {
        const u = Math.min(1, (blast - 1.4) / 3); x.fillStyle = cool < 0.5 ? '#d6a03c' : '#2e3036';
        [[[-20, 18], [-26, 30], [-38, 44]], [[-26, 6], [-40, 12], [-54, 24]], [[-8, 26], [-6, 40], [-20, 52]]].forEach(line => {
          for (let i = 1; i < line.length; i++) { const v = Math.max(0, Math.min(1, u * line.length - i + 1)); const [ax, ay] = line[i - 1], [bx, by] = line[i], n = Math.ceil(Math.hypot(bx - ax, by - ay) * v);
            for (let k = 0; k <= n; k++) { const q = k / Math.max(1, Math.hypot(bx - ax, by - ay)); x.fillRect(Math.round(d.x + ax + (bx - ax) * q), Math.round(d.y + ay + (by - ay) * q), 1, 1); } }
        });
      }
    }
  } else if (kind === 'rerun' || kind === 'ridge') {
    // Earth at night: a ridge, or the grounds of the house with its gold gate
    x.fillStyle = '#1b1c21'; x.fillRect(0, 0, TVW, TVH);
    stars.slice(0, 30).forEach(([sx, sy]) => { if (sy < 50) { x.fillStyle = '#45474d'; x.fillRect(sx, sy, 1, 1); } });
    if (kind === 'ridge') {
      x.fillStyle = '#2e3036'; for (let px = 0; px < TVW; px++) { const h = 62 + Math.round(Math.sin(px / 19) * 6 + Math.sin(px / 7) * 2); x.fillRect(px, h, 1, TVH - h); }
      x.fillStyle = '#ebe6d8'; x.fillRect(118, 18, 3, 3); // the Moon, small, far off
      // a new girl on the ridge, looking at the house lights below
      const gx = 52; x.fillStyle = '#0e0f12'; x.fillRect(gx - 1, 50, 5, 12); x.fillStyle = '#8f8d87'; x.fillRect(gx, 53, 3, 8); x.fillStyle = '#1b1c21'; x.fillRect(gx, 51, 3, 3);
      x.fillStyle = '#d6a03c'; [[96, 84], [104, 86], [110, 83]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
      // the lower third: TAKE 1
      if (t > 1.2) { x.fillStyle = '#e3412b'; x.fillRect(6, 80, 34, 9); tvText(x, 'TAKE 1', 9, 82, '#ebe6d8'); }
    } else {
      x.fillStyle = '#2e3036'; x.fillRect(0, 70, TVW, 30); x.fillStyle = '#45474d'; x.fillRect(0, 70, TVW, 1);
      const fr = feedRect(x); feedHouse(fr, 42, 70);
      x.fillStyle = '#261f15'; x.fillRect(0, 62, 30, 8); x.fillRect(120, 62, 26, 8);
      feedGatePost(fr, 34, 70); feedGatePost(fr, 114, 70);
      // the same girl walking up to the gate, again; it loops
      const gx = 10 + Math.floor((t * 9) % 60); x.fillStyle = '#0e0f12'; x.fillRect(gx - 1, 61, 5, 10); x.fillStyle = '#8f8d87'; x.fillRect(gx, 63, 3, 7); x.fillStyle = '#1b1c21'; x.fillRect(gx, 62, 3, 2);
      if (Math.floor(t * 1.5) % 2 === 0) { x.fillStyle = '#e3412b'; x.fillRect(6, 6, 40, 11); tvText(x, 'RERUN', 11, 8, '#ebe6d8'); }
    }
  } else if (kind === 'playroom') {
    // the playroom, seen from its own camera: gold wall, the couch, two kids squinting at us
    x.fillStyle = '#3a2f1f'; x.fillRect(0, 0, TVW, TVH);
    x.fillStyle = '#54432a'; for (let yy = 8; yy < 60; yy += 12) for (let xx = 6 + (yy % 24 ? 6 : 0); xx < TVW; xx += 12) x.fillRect(xx, yy, 2, 2);
    x.fillStyle = '#0e0f12'; x.fillRect(23, 59, 100, 30); x.fillStyle = '#d6a03c'; x.fillRect(24, 60, 98, 28); x.fillStyle = '#8a5f1c'; x.fillRect(24, 80, 98, 8);
    [[56, true], [90, false]].forEach(([cx, bun], i) => {
      const sh = Math.floor(t * 3 + i) % 2;
      x.fillStyle = '#0e0f12'; x.fillRect(cx - 9, 37, 19, 34);
      x.fillStyle = '#ebe6d8'; x.fillRect(cx - 8, 54, 17, 16);
      x.fillStyle = bun ? '#f2d58c' : '#d6a03c'; x.fillRect(cx - 7, 38, 15, 6); if (bun) x.fillRect(cx - 3, 34, 7, 4); else { x.fillStyle = '#d6a03c'; x.fillRect(cx - 7, 34, 15, 3); }
      x.fillStyle = '#b8b2a3'; x.fillRect(cx - 6, 44, 13, 9);
      // eyes screwed shut, a hand up against the light
      x.fillStyle = '#0e0f12'; x.fillRect(cx - 4, 47, 3, 1); x.fillRect(cx + 2, 47, 3, 1); x.fillRect(cx - 1, 50 + sh, 3, 1);
      x.fillStyle = '#b8b2a3'; x.fillRect(cx + (i ? -10 : 6), 42 - sh, 5, 4);
    });
    tvText(x, 'LIVE', 8, 6, '#e3412b');
  } else if (kind === 'couch') {
    // three small figures on a couch from behind, watching a screen that shows Earth
    x.fillStyle = '#1b1c21'; x.fillRect(0, 0, TVW, TVH);
    x.fillStyle = '#0e0f12'; x.fillRect(42, 10, 62, 36); x.fillStyle = '#2e3036'; x.fillRect(44, 12, 58, 32);
    disc(x, 73, 28, 11, '#45474d'); x.fillStyle = '#6b6c70'; x.fillRect(66, 22, 6, 4); x.fillRect(74, 30, 5, 3); x.fillStyle = '#d6a03c'; [[70, 32], [78, 24], [68, 28]].forEach(([a, b]) => { if (Math.floor(t * 2 + a) % 3) x.fillRect(a, b, 1, 1); });
    x.fillStyle = '#d6a03c'; x.fillRect(28, 66, 90, 18); x.fillStyle = '#8a5f1c'; x.fillRect(28, 78, 90, 6); x.fillRect(24, 62, 6, 22); x.fillRect(116, 62, 6, 22);
    figureBack(x, 54, 68, '#f2d58c', '#ebe6d8', true); figureBack(x, 73, 68, '#1b1c21', '#8f8d87', false); figureBack(x, 92, 68, '#d6a03c', '#ebe6d8', true);
  }
  // the channel mark, in the caption face (the 3x5 H reads as an A at this size)
  if (o.bug !== false) ccText(x, 'CH 07', TVW - 4 - ccWidth('CH 07'), 4, '#d6a03c');
}
