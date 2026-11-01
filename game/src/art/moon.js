// Episode 5, the Moon: the watchers' home, a small city under a dome. Bright, soft and clean, in
// its own colors (the five looks are her world's; the Moon looks the same whichever one was
// picked). Earth hangs in the black over the dome. A plaza with a gold fountain, the door she
// came out of on a plinth behind ropes, lounges behind glass where adults watch walls of Earth
// channels, a tram, a vote board, a screen showing her live, and at the far end, where the
// city stops being pretty, a staff door. The kids' playroom is reached from backstage.
// Then the last shot: an old TV in a dark room on Earth, showing the Moon.
import { Painter, rng } from './painter.js';
import { pixText, textWidth } from './pixfont.js';

export const TILE = 16, GROUND = 160;
const T = TILE, G = GROUND;
export const CW = 112;          // the city, in tiles
export const KX = (CW + 1) * T; // the playroom's left wall

// the Moon's own palette, from the look board's Moon frames
export const M = {
  space: '#04050b', star: '#c9cce0', earth: '#2c4f8a', earthLand: '#3f6b4c', earthCloud: '#c9d6f0', earthShade: '#121f3a', fire: '#ff9a4a',
  lunar: '#8b8d98', lunarHi: '#b4b6c1', lunarLo: '#5b5d68',
  wall: '#e8e5f1', wallHi: '#fbfaff', wallLo: '#c8c3d9', trim: '#d6b25a', trimHi: '#ffe6a1', trimLo: '#987832',
  floor: '#cbc6dc', floorHi: '#dfdbee', floorLo: '#a7a1bd', room: '#b9b2cf', roomLo: '#9f97b9',
  screen: '#0a0e1c', bezel: '#2a2f45', screenGlow: '#9fd0ff',
  sofa: '#7a5da6', sofaHi: '#9a7ec6', sofaLo: '#513c72',
  adult: '#272233', adultHi: '#5a5274', glassHi: '#ffffff',
  rich: '#ffd3e6', richLo: '#c497b0', richHair: '#e6c068', richHair2: '#8a5a3b',
  pink: '#ff5fa2', yellow: '#ffd23f', mint: '#3ee6c1', blue: '#5b8cff', purple: '#2b1a5c',
  rug: '#f2c6d8', rugLo: '#d8a1b9', white: '#ffffff', warm: '#fff4d6', robot: '#f4f2fb', robotLo: '#c8c3d9', robotLed: '#3ee6c1',
  wood: '#3d3a52', red: '#ff3b3b',
  // the city: towers in the haze, the dome's ribs, the service end
  haze: '#1a1c33', hazeHi: '#2a2d4d', far: '#232646', farHi: '#34385f', mid: '#b7b1cf', midHi: '#d4cfe6', midLo: '#958eb2',
  rib: '#8f9cc8', service: '#9a95ad', serviceLo: '#77728a', coat: '#3a3d55', coatHi: '#555a7c'
};

export const LEVEL = {
  w: CW + 21, h: 12,
  start: { x: 50, y: G - 14 },
  arrive: { x: 24, y: G - 36, w: 22, h: 36 },                   // the door she comes out of, on a plinth
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
  npcs: [
    { kind: 'a', x0: 13 * T, x1: 27 * T, speed: 9 },
    { kind: 'b', x0: 22 * T, x1: 31 * T, speed: 7 },
    { kind: 'w', x0: 47 * T, x1: 66 * T, speed: 16 },
    { kind: 'a', x0: 78 * T, x1: 86 * T, speed: 8 },
    { kind: 'c', x0: 102 * T, x1: 104 * T, speed: 0 }
  ],
  // the playroom
  screen: { x: KX + 96, y: 22, w: 176, h: 96 },
  couch: { x: KX + 132, y: 128, w: 112, h: 32 },
  kids: [{ x: KX + 160, bun: true }, { x: KX + 214, bun: false }],
  stand: KX + 92 // where she stops, inside the doorway
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
  if (kind === 'estate' || kind === 'grounds') { p.rect(x, y, w, h, '#0f1735'); p.poly([[x + 6, y + 11], [x + w / 2, y + 4], [x + w - 6, y + 11]], '#e2b146'); for (let i = 0; i < 4; i++) p.rect(x + 8 + i * ((w - 16) / 3.4), y + 11, 2, h - 15, '#cfc8b6'); p.rect(x + 4, y + h - 3, w - 8, 2, '#cfc8b6'); if (kind === 'grounds') { p.rect(x + 5, y + h - 8, 2, 5, '#f1e9d8'); p.px(x + 5, y + h - 9, '#2a1d16'); } }
  else if (kind === 'street') { p.rect(x, y, w, h, '#1c1f27'); for (let i = 0; i < 5; i++) { const bh = 6 + Math.floor(r() * (h - 8)); p.rect(x + 2 + i * (w / 5), y + h - bh, w / 5 - 2, bh, r() < 0.5 ? '#3a3f4c' : '#2c303b'); } p.px(x + w * 0.6, y + h - 4, '#ff4d4d'); }
  else if (kind === 'field') { p.rect(x, y, w, mid - y, '#3a3842'); p.rect(x, mid, w, y + h - mid, '#4a4740'); for (let i = 0; i < 9; i++) p.px(x + r() * w, mid + 1 + r() * (y + h - mid - 2), '#6a665c'); p.rect(x + w * 0.4, mid - 4, 2, 4, '#f1e9d8'); }
  else if (kind === 'hall') { p.rect(x, y, w, h, '#0d1226'); p.rect(x, y + h - 5, w, 5, '#1a2045'); p.rect(x + w * 0.3, y + h - 11, 2, 6, '#f1e9d8'); p.rect(x + w * 0.5, y + h - 8, w * 0.5, 1, '#ff3b3b'); }
  else if (kind === 'sat') { p.rect(x, y, w, h, '#2c3328'); for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 5; gx++) if (r() < 0.75) p.rect(x + 2 + gx * (w / 5), y + 2 + gy * (h / 3), w / 5 - 3, h / 3 - 3, r() < 0.5 ? '#6b7562' : '#8a937e'); p.rect(x + w * 0.6 - 4, y + h * 0.45, 9, 1, '#ffb000'); p.rect(x + w * 0.6, y + h * 0.45 - 4, 1, 9, '#ffb000'); }
  else if (kind === 'beach') { p.rect(x, y, w, h * 0.45, '#9fd3f0'); p.rect(x, y + h * 0.45, w, h * 0.25, '#2f7fc0'); p.rect(x, y + h * 0.7, w, h * 0.3, '#e8d39c'); p.px(x + w * 0.7, y + h * 0.78, '#ff5fa2'); }
  else if (kind === 'crowd') { p.rect(x, y, w, h, '#2a2533'); for (let j = 0; j < 3; j++) for (let i = 0; i < 9; i++) p.rect(x + 1 + i * (w / 9) + (j % 2) * 2, y + 5 + j * 5, 2, 2, ['#f1d2b0', '#c48a5c', '#8a5a3b', '#5a3a26'][(i + j) % 4]); }
  else if (kind === 'ridge') { p.rect(x, y, w, h, '#0b0d16'); p.poly([[x, y + h], [x + w * 0.3, y + h * 0.55], [x + w * 0.7, y + h * 0.7], [x + w, y + h * 0.5], [x + w, y + h]], '#1a1c26'); p.rect(x + w * 0.35, y + h * 0.5, 1, 3, '#f1e9d8'); p.rect(x + w * 0.38, y + h * 0.48, 1, 4, '#3f6f8f'); p.px(x + w * 0.8, y + 3, '#ece8d6'); }
  else if (kind === 'bedroom') { p.rect(x, y, w, h, '#2a0f1c'); p.rect(x + 4, y + h - 9, w * 0.5, 5, '#e3ded0'); p.rect(x + w * 0.62, y + 4, 6, h - 6, '#000000'); p.rect(x + w * 0.62 - 1, y + 3, 8, 1, '#8a5cff'); p.rect(x + 7, y + h - 5, 4, 2, '#3f6f8f'); }
  else { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (r() < 0.4) p.px(x + xx, y + yy, r() < 0.5 ? '#5d6274' : '#a3a8bb'); }
  p.glowRect(x, y, w, h, M.screenGlow, 0.08);
  p.mark('tile', x, y, { w, h, kind });
}

// people on a sofa, from behind, in the light of the screens
function adult(p, x, y, style) {
  p.ellipse(x, y + 10, 8, 6, M.adult); p.circle(x, y, 4, M.adult);
  if (style === 1) p.circle(x, y - 5, 2, M.adult);
  if (style === 2) { p.rect(x - 5, y - 2, 2, 8, M.adult); p.rect(x + 4, y - 2, 2, 8, M.adult); }
  if (style === 3) p.rect(x - 4, y - 5, 9, 2, M.adult);
  p.rect(x - 2, y - 4, 5, 1, M.adultHi); p.rect(x - 7, y + 5, 3, 1, M.adultHi); p.rect(x + 5, y + 5, 3, 1, M.adultHi);
}

function paintRoomBehindGlass(p, R, i) {
  const x0 = R.x0, x1 = R.x1, w = x1 - x0, top = 26, bottom = 140;
  p.rect(x0, top, w, bottom - top, M.room); p.rect(x0, bottom - 14, w, 14, M.roomLo);
  // the wall of channels
  const cols = R.tiles.length > 6 ? 4 : 3, tw = 30, th = 20, gap = 6, gw = cols * tw + (cols - 1) * gap, gx = x0 + Math.round((w - gw) / 2);
  R.tiles.forEach((k, j) => channel(p, gx + (j % cols) * (tw + gap), top + 8 + Math.floor(j / cols) * (th + 6), tw, th, k, 31 + i * 17 + j));
  p.glowRect(gx - 6, top + 4, gw + 12, 58, M.screenGlow, 0.05);
  // a lamp, a side table with a drink
  p.rect(x0 + 8, 96, 3, 30, M.trimLo); p.circle(x0 + 9, 94, 4, M.warm); p.softGlow(x0 + 9, 94, 16, M.warm, 0.25);
  p.rect(x1 - 18, 112, 10, 3, M.trim); p.rect(x1 - 14, 115, 2, 11, M.trimLo); p.rect(x1 - 15, 107, 3, 5, M.white); p.px(x1 - 14, 108, M.pink);
  // the sofa from behind, heads lit by the screens
  const sx = x0 + 22, sw = w - 44, n = R.seats;
  for (let s = 0; s < n; s++) adult(p, Math.round(sx + 10 + s * (sw - 20) / Math.max(1, n - 1)), 100, (s + i) % 4);
  p.rect(sx, 110, sw, 14, M.sofa); p.rect(sx, 110, sw, 2, M.sofaHi); p.rect(sx - 4, 108, 6, 18, M.sofaLo); p.rect(sx + sw - 2, 108, 6, 18, M.sofaLo); p.rect(sx, 124, sw, 4, M.sofaLo);
  p.mark('room', x0, top, { w, i });
  // the glass: gold mullions, reflections
  p.rect(x0 - 3, top - 3, w + 6, 3, M.trim); p.rect(x0 - 3, bottom, w + 6, 4, M.trim); p.rect(x0 - 3, bottom + 4, w + 6, 1, M.trimLo);
  for (let x = x0 - 3; x <= x1; x += Math.round(w / 3)) { p.rect(x, top - 3, 3, bottom - top + 7, M.trim); p.rect(x + 1, top - 3, 1, bottom - top + 7, M.trimHi); }
  p.glowPoly([[x0 + 20, top], [x0 + 34, top], [x0 + 10, bottom], [x0 - 4, bottom]], M.glassHi, 0.14); p.glowPoly([[x0 + w * 0.6, top], [x0 + w * 0.6 + 8, top], [x0 + w * 0.6 - 16, bottom], [x0 + w * 0.6 - 24, bottom]], M.glassHi, 0.08);
}

// a door that does not match itself: the twin of the one in the bedroom, never used
function oddDoor(p, D, clean) {
  p.rect(D.x - 3, D.y - 4, D.w + 6, D.h + 4, M.trim);
  p.rect(D.x, D.y, D.w / 2, D.h, '#5a3d2a'); for (let y = D.y + 3; y < D.y + D.h - 3; y += 3) p.rect(D.x + 2, y, D.w / 2 - 4, 1, '#7a5638'); p.px(D.x + D.w / 2 - 2, D.y + 18, M.trim);
  p.rect(D.x + D.w / 2, D.y, D.w / 2, D.h, M.wallHi); p.rect(D.x + D.w / 2 + 2, D.y + 4, D.w / 2 - 4, 12, '#bfe3f4'); p.rect(D.x + D.w / 2 + 2, D.y + 18, 2, 2, M.wallLo);
  p.rect(D.x + D.w / 2, D.y, 1, D.h, M.adult);
  if (clean) { p.rect(D.x + D.w / 2 - 5, D.y - 10, 10, 6, M.trimLo); ptext(p, '07', D.x + D.w / 2 - 3, D.y - 9, M.trimHi); }
}

// ------------------------------------------------------------------ the sky and the skyline
// Behind everything, fixed: black, stars, Earth over the dome, the dome's ribs catching light.
export function paintSky() {
  const p = new Painter(320, 180), r = rng(9);
  p.rect(0, 0, 320, 180, M.space);
  for (let y = 0; y < 180; y += 2) p.glowRect(0, y, 320, 2, '#1b2148', y / 180 * 0.5);
  for (let i = 0; i < 120; i++) p.px(r() * 320, r() * 140, i % 11 ? M.star : M.white);
  // Earth, mostly in shadow, small fires on the dark side
  const ex = 76, ey = 44, er = 26;
  p.circle(ex, ey, er + 2, '#0c1428');
  earthDisc(p, ex, ey, er, true);
  for (let dy = -er; dy <= er; dy++) { const hw = Math.floor(Math.sqrt(er * er - dy * dy) + 0.35), sw = Math.round(hw * 1.2); p.rect(ex + hw - Math.min(2 * hw + 1, sw), ey + dy, Math.min(2 * hw + 1, sw), 1, M.earthShade); }
  const rf = rng(4); for (let i = 0; i < 14; i++) { const a = rf() * Math.PI * 2, d = rf() * er * 0.9; const x = ex + Math.cos(a) * d, y = ey + Math.sin(a) * d; if (x > ex - er * 0.2) p.px(x, y, i % 3 ? M.fire : '#ffd08a'); }
  p.softGlow(ex, ey, er + 10, '#3a5ea8', 0.1);
  // the dome: ribs that arc over the city, a long highlight
  for (let i = 0; i < 7; i++) { const x0 = -40 + i * 66; for (let x = 0; x < 120; x++) p.glowRect(x0 + x, 6 + Math.round(Math.pow(x / 120 - 0.5, 2) * 40 + i * 2), 1, 1, M.rib, 0.55); }
  p.glowPoly([[200, 0], [214, 0], [150, 180], [136, 180]], '#ffffff', 0.03);
  return p;
}
// far towers in the haze, slow: thin, lit windows, the CH 07 mast with its red light
export function paintFar(width) {
  const p = new Painter(width, 180), r = rng(31);
  for (let x = 0; x < width;) {
    const w = 12 + Math.floor(r() * 18), top = 40 + Math.floor(r() * 60);
    p.rect(x, top, w, 180 - top, r() < 0.5 ? M.far : M.haze); p.rect(x, top, w, 1, M.farHi);
    for (let y = top + 4; y < 150; y += 5) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (r() < 0.32) p.px(xx, y, [M.warm, M.screenGlow, M.pink][Math.floor(r() * 3)]);
    if (r() < 0.25) { p.rect(x + Math.floor(w / 2), top - 10, 1, 10, M.farHi); p.mark('beacon', x + Math.floor(w / 2), top - 11); }
    x += w + Math.floor(r() * 10);
  }
  const mx = Math.round(width * 0.62); p.rect(mx - 3, 20, 7, 160, M.far); p.rect(mx - 1, 6, 3, 14, M.farHi); p.rect(mx - 8, 30, 17, 9, M.farHi); ptext(p, '07', mx - 3, 32, M.pink); p.mark('beacon', mx, 5);
  p.glowRect(0, 140, width, 40, M.hazeHi, 0.6);
  return p;
}
// the middle distance: lighter buildings with balconies, the tram's rail, billboards
export function paintMid(width) {
  const p = new Painter(width, 180), r = rng(57);
  for (let x = 0; x < width;) {
    const w = 30 + Math.floor(r() * 40), top = 62 + Math.floor(r() * 46);
    p.rect(x, top, w, 180 - top, M.midLo); p.rect(x, top, w, 2, M.mid); p.rect(x + w - 2, top, 2, 180 - top, M.floorLo);
    for (let y = top + 6; y < 160; y += 9) { p.rect(x + 3, y, w - 6, 1, M.mid); for (let xx = x + 5; xx < x + w - 5; xx += 6) p.rect(xx, y + 2, 3, 4, r() < 0.3 ? '#e9dcc4' : M.roomLo); }
    if (r() < 0.4) { const bw = Math.min(w - 8, 30); p.rect(x + 4, top - 18, bw, 14, M.bezel); p.rect(x + 5, top - 17, bw - 2, 12, [M.pink, M.purple, M.blue][Math.floor(r() * 3)]); ptext(p, ['CH 07', 'VOTE', 'LIVE', 'ROUND 2'][Math.floor(r() * 4)], x + 7, top - 13, M.white); }
    x += w + 4 + Math.floor(r() * 14);
  }
  // the tram's rail on pylons
  p.rect(0, 70, width, 3, M.wallLo); p.rect(0, 70, width, 1, M.wallHi);
  for (let x = 20; x < width; x += 90) { p.rect(x, 73, 4, 107, M.midLo); p.rect(x - 2, 73, 8, 2, M.wallLo); }
  // haze: the middle distance sits back behind the street
  p.glowRect(0, 0, width, 180, '#262a4d', 0.28); p.glowRect(0, 120, width, 60, '#e8e5f1', 0.14);
  return p;
}

// ------------------------------------------------------------------ the street
function lamp(p, x) {
  p.rect(x, G - 46, 2, 46, M.trimLo); p.rect(x - 1, G - 4, 4, 4, M.trimLo); p.rect(x - 3, G - 50, 8, 4, M.trim); p.circle(x + 1, G - 53, 3, M.warm);
  p.softGlow(x + 1, G - 53, 14, M.warm, 0.35); p.mark('lamp', x + 1, G - 53);
}
function bench(p, x) { p.rect(x, G - 10, 30, 3, M.trim); p.rect(x + 2, G - 7, 2, 7, M.trimLo); p.rect(x + 26, G - 7, 2, 7, M.trimLo); p.rect(x, G - 13, 30, 3, M.sofa); }
function planter(p, x, r) { p.rect(x, G - 12, 12, 12, M.trim); p.rect(x + 1, G - 12, 10, 2, M.trimHi); for (let i = 0; i < 8; i++) p.ellipse(x + 6 + Math.round((r() - 0.5) * 12), G - 18 - Math.round(r() * 14), 3, 2, i % 2 ? '#5aa67a' : '#3f8a5f'); }
// the fountain, the twin of the one on the grounds: gold tiers, water that never stops
function fountain(p, x) {
  p.rect(x - 34, G - 12, 68, 12, M.trim); p.rect(x - 34, G - 12, 68, 2, M.trimHi); p.rect(x - 30, G - 10, 60, 6, '#8fd0f0');
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
}
// the door she came out of, on a plinth behind ropes, a plaque in front
function exhibitDoor(p, A) {
  p.rect(A.x - 10, G - 4, A.w + 20, 4, M.trim); p.rect(A.x - 10, G - 4, A.w + 20, 1, M.trimHi);
  oddDoor(p, Object.assign({}, A, { y: A.y - 4 }), true);
  [A.x - 16, A.x + A.w + 14].forEach(x => { p.rect(x, G - 14, 2, 14, M.trimLo); p.circle(x + 1, G - 15, 1, M.trim); });
  for (let i = 0; i <= 10; i++) p.px(A.x - 15 + i * 2, G - 13 + Math.round(Math.sin(i / 10 * Math.PI) * 3), '#c23f78');
  for (let i = 0; i <= 10; i++) p.px(A.x + A.w + 15 - i * 2, G - 13 + Math.round(Math.sin(i / 10 * Math.PI) * 3), '#c23f78');
}
// where the city stops being pretty: plain walls, a loading bay, pipes, the staff door
function serviceEnd(p, x0, x1, D, r) {
  p.rect(x0, 40, x1 - x0, G - 40, M.service); p.rect(x0, 40, x1 - x0, 2, M.serviceLo);
  for (let x = x0; x < x1; x += 24) p.rect(x, 42, 1, G - 42, M.serviceLo);
  p.rect(x0, 56, x1 - x0, 3, M.serviceLo); p.rect(x0, 62, x1 - x0, 2, M.serviceLo);
  p.rect(x0 + 18, G - 44, 44, 44, M.serviceLo); for (let y = G - 42; y < G; y += 4) p.rect(x0 + 19, y, 42, 1, M.service);
  ptext(p, 'LOADING', x0 + 26, G - 52, M.serviceLo);
  for (let i = 0; i < 3; i++) { const cx = x0 + 74 + i * 14; p.rect(cx, G - 12, 12, 12, '#6b5236'); p.rect(cx, G - 12, 12, 1, '#8d6d48'); }
  p.rect(D.x - 3, D.y - 3, D.w + 6, D.h + 3, M.serviceLo); p.rect(D.x, D.y, D.w, D.h, '#6f6a83'); p.rect(D.x + 5, D.y + 6, 12, 8, M.wallHi); p.rect(D.x + D.w - 5, D.y + 18, 3, 2, '#9a95ad');
  p.rect(D.x - 4, D.y - 14, D.w + 8, 9, M.red); ptext(p, 'STAFF', D.x + 1, D.y - 12, M.white);
  p.rect(x1 - 24, 46, 6, 70, M.serviceLo); p.mark('steam', x1 - 21, 46);
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
  // the boulevard: the vote board on two posts, the live screen on a frame
  const V = LEVEL.vote;
  p.rect(V.x + 10, V.y + V.h, 3, G - V.y - V.h, M.trimLo); p.rect(V.x + V.w - 13, V.y + V.h, 3, G - V.y - V.h, M.trimLo);
  p.rect(V.x - 2, V.y - 2, V.w + 4, V.h + 4, M.bezel); p.rect(V.x, V.y, V.w, V.h, M.purple);
  const mid = s => V.x + Math.round((V.w - textWidth(s)) / 2);
  ptext(p, "TONIGHT'S LOOK", mid("TONIGHT'S LOOK"), V.y + 5, M.yellow);
  ptext(p, look.toUpperCase(), mid(look), V.y + 17, M.white);
  p.rect(V.x + 8, V.y + 28, V.w - 16, 4, M.bezel); p.rect(V.x + 8, V.y + 28, Math.round((V.w - 16) * 0.62), 4, M.pink);
  ptext(p, 'THANKS FOR VOTING', mid('THANKS FOR VOTING'), V.y + 37, M.mint);
  p.mark('vote', V.x, V.y);
  const LV = LEVEL.live; p.rect(LV.x + LV.w / 2 - 2, LV.y + LV.h, 4, G - LV.y - LV.h, M.trimLo); p.rect(LV.x - 3, LV.y - 3, LV.w + 6, LV.h + 6, M.bezel); p.rect(LV.x, LV.y, LV.w, LV.h, '#0d1226');
  planter(p, 84 * T, r); bench(p, 92 * T);
  // the service end and the staff door
  serviceEnd(p, 96 * T, CW * T, LEVEL.door, r);
  // the wall at the end of the city, and the playroom beyond it
  p.rect(CW * T, 0, T, G, M.wallLo); p.rect(CW * T, 0, 1, G, M.trim);
  paintPlayroom(p);
  p.rect((LEVEL.w - 1) * T, 0, T, G, M.wallLo);
  return p;
}

function paintPlayroom(p) {
  const X = KX, r = rng(23);
  p.rect(X, 0, 20 * T, G, M.wall); p.rect(X, 0, 20 * T, 10, M.wallHi); p.rect(X, 10, 20 * T, 2, M.trim);
  for (let i = 0; i < 22; i++) { const sx = X + 10 + r() * 290, sy = 16 + r() * 104, c = [M.yellow, M.pink, M.mint, M.blue][i % 4]; if (sx > LEVEL.screen.x - 6 && sx < LEVEL.screen.x + LEVEL.screen.w + 6 && sy < LEVEL.screen.y + LEVEL.screen.h + 6) continue; p.rect(sx, sy + 1, 3, 1, c); p.rect(sx + 1, sy, 1, 3, c); }
  p.rect(X, G, 20 * T, 20, M.floor); p.rect(X, G, 20 * T, 1, M.floorLo); p.rect(X, 0, 20 * T, 1, M.wallHi);
  p.ellipse(X + 190, G + 6, 110, 10, M.rug); for (let x = X + 96; x < X + 286; x += 12) p.rect(x, G + 5, 6, 2, M.rugLo);
  // the big screen's frame; what it shows is live
  const S = LEVEL.screen; p.rect(S.x - 4, S.y - 4, S.w + 8, S.h + 8, M.bezel); p.rect(S.x, S.y, S.w, S.h, M.purple);
  // a porthole with Earth, the doorway she came in by, toys, a rocket lamp
  porthole(p, X + 52, 54, 18);
  p.rect(X + 8, G - 40, 26, 40, M.wood); p.rect(X + 6, G - 42, 30, 2, M.trim); p.rect(X + 6, G - 42, 2, 42, M.trim); p.rect(X + 34, G - 42, 2, 42, M.trim);
  p.rect(X + 60, G - 8, 8, 8, M.yellow); p.rect(X + 68, G - 6, 6, 6, M.blue); p.rect(X + 63, G - 12, 6, 4, M.pink);
  p.poly([[X + 296, G], [X + 302, G - 22], [X + 308, G]], M.white); p.rect(X + 300, G - 6, 4, 6, M.pink); p.px(X + 302, G - 14, M.blue); p.softGlow(X + 302, G - 24, 10, M.warm, 0.3);
  // trophies on a shelf: gold cups, one shaped like a satellite
  p.rect(X + 250, 70, 50, 3, M.trim);
  [[X + 256, 'cup'], [X + 270, 'sat'], [X + 286, 'cup']].forEach(([x, k]) => {
    if (k === 'cup') { p.rect(x, 62, 6, 5, M.trim); p.rect(x + 2, 67, 2, 3, M.trimLo); p.px(x + 1, 63, M.trimHi); }
    else { p.rect(x + 2, 62, 4, 4, M.trim); p.rect(x - 2, 63, 4, 2, M.blue); p.rect(x + 6, 63, 4, 2, M.blue); p.rect(x + 3, 66, 2, 4, M.trimLo); }
  });
  // the couch the kids sit on, from behind
  const C = LEVEL.couch;
  p.rect(C.x, C.y, C.w, C.h - 8, M.pink); p.rect(C.x, C.y, C.w, 2, '#ff8fc0'); p.rect(C.x - 6, C.y - 4, 8, C.h - 4, '#d94a88'); p.rect(C.x + C.w - 2, C.y - 4, 8, C.h - 4, '#d94a88');
  p.rect(C.x, C.y + C.h - 8, C.w, 8, '#c23f78'); p.rect(C.x + 4, G - 2, 4, 2, M.trimLo); p.rect(C.x + C.w - 8, G - 2, 4, 2, M.trimLo);
}

// The two kids, painted per pose. Facing the screen (their backs to us), or turned to look at her.
export function paintKid(bun, pose) {
  const p = new Painter(18, 22), hair = bun ? M.richHair : M.richHair2;
  if (pose === 'back') {
    p.ellipse(9, 16, 7, 5, M.rich); p.circle(9, 8, 5, hair); if (bun) p.circle(9, 2, 3, hair);
    p.rect(3, 13, 2, 4, M.richLo); p.rect(13, 13, 2, 4, M.richLo);
  } else if (pose === 'cheer') {
    p.ellipse(9, 16, 7, 5, M.rich); p.circle(9, 9, 5, hair); if (bun) p.circle(9, 3, 3, hair);
    p.rect(1, 4, 2, 9, M.rich); p.rect(15, 4, 2, 9, M.rich); p.rect(1, 3, 2, 2, M.rich); p.rect(15, 3, 2, 2, M.rich);
  } else {
    // turned toward the doorway on the left: a face in profile
    p.ellipse(9, 16, 7, 5, M.rich); p.circle(9, 8, 5, hair); if (bun) p.circle(10, 2, 3, hair);
    p.rect(4, 6, 5, 6, M.rich); p.px(5, 8, M.adult); p.px(4, 10, M.richLo);
  }
  return p;
}

// a cleaning robot, the same model as the one in the gallery, polished
export function paintRobot(led, step) {
  const p = new Painter(12, 7);
  p.rect(4, 0, 4, 1, M.robot); p.rect(2, 1, 8, 1, M.robot); p.rect(1, 2, 10, 2, M.robot); p.px(7, 2, led);
  p.rect(0, 4, 12, 1, M.robotLo); p.rect(1, 5, 10, 1, M.robotLo); p.px(step ? 3 : 2, 6, M.adult); p.px(step ? 8 : 9, 6, M.adult);
  return p;
}

// The last shot: an old TV in a dark room on Earth. On the screen, the Moon.
export function paintLastRoom() {
  const p = new Painter(320, 180);
  p.rect(0, 0, 320, 180, '#07060c'); p.rect(0, 150, 320, 30, '#0d0b14');
  p.line(160, 20, 138, 2, '#3a3442'); p.line(160, 20, 184, 4, '#3a3442'); // rabbit ears
  p.rect(58, 20, 204, 126, '#2d2836'); p.rect(60, 22, 200, 2, '#463f52');
  p.rect(70, 32, 150, 104, '#141119');
  p.rect(228, 40, 22, 40, '#221e29'); for (let y = 42; y < 78; y += 3) p.rect(230, y, 18, 1, '#141119');
  p.circle(239, 94, 5, '#463f52'); p.circle(239, 94, 2, '#141119'); p.circle(239, 112, 5, '#463f52'); p.circle(239, 112, 2, '#141119');
  p.rect(96, 146, 128, 4, '#1b1722'); p.rect(84, 150, 152, 3, '#120f18');
  p.rect(0, 164, 320, 16, '#030205'); p.ellipse(160, 166, 140, 5, '#030205');
  return p;
}
// what the old TV shows: the Moon, with the lit dome on its edge
export const TVSCREEN = { x: 72, y: 34, w: 146, h: 100, moon: { x: 140, y: 88, r: 36 }, dome: { x: 164, y: 58 } };
// what the old TV shows, in two layers so the blast can take the Moon apart: the sky, and the Moon
export function paintTvMoon() {
  const S = TVSCREEN, sky = new Painter(S.w, S.h), moon = new Painter(S.w, S.h), ox = -S.x, oy = -S.y, rs = rng(5);
  sky.rect(0, 0, S.w, S.h, M.space);
  for (let i = 0; i < 70; i++) sky.px(rs() * S.w, rs() * S.h, i % 9 ? M.star : M.white);
  ptext(sky, 'CH 07', 120, 4, M.yellow);
  const m = S.moon, x = m.x + ox, y = m.y + oy;
  moon.circle(x, y, m.r, M.lunar); moon.circle(x - 6, y - 6, m.r - 9, M.lunarHi);
  [[124, 76, 6], [150, 100, 8], [128, 104, 4], [156, 74, 3], [114, 92, 3], [146, 82, 2], [120, 100, 2]].forEach(([cx, cy, r]) => { moon.circle(cx + ox, cy + oy, r, M.lunarLo); moon.circle(cx + ox - 1, cy + oy - 1, Math.max(1, r - 2), M.lunar); });
  const d = S.dome; moon.rect(d.x + ox - 4, d.y + oy, 8, 4, M.trim); moon.rect(d.x + ox - 2, d.y + oy - 2, 4, 2, M.trimHi); moon.px(d.x + ox, d.y + oy + 1, M.warm);
  return { sky, moon };
}

// People out tonight, 12 x 24, facing right, two steps. a: a woman in a long pink coat with a
// glass; b: a man in a white suit; w: a waiter with a tray; c: a crew member on a break, in the
// same coat as the creator, a cup in hand.
const NPC = {
  a: { hair: M.richHair, skin: M.rich, top: '#f2a7c8', topLo: '#d9789f', leg: '#d9789f', shoe: M.adult, long: true },
  b: { hair: M.richHair2, skin: M.rich, top: M.wallHi, topLo: M.wallLo, leg: M.wallLo, shoe: M.adult, tie: M.trim },
  w: { hair: M.adult, skin: '#e0bf9f', top: M.wallHi, topLo: M.adult, leg: M.adult, shoe: '#121016', vest: M.adult },
  c: { hair: '#5a4d4a', skin: '#e0bf9f', top: M.coat, topLo: '#262838', leg: '#262838', shoe: '#121016', long: true }
};
export function paintNpc(kind, step) {
  const c = NPC[kind], p = new Painter(12, 24);
  // head
  p.rect(4, 1, 5, 2, c.hair); p.rect(3, 2, 6, 3, c.hair); p.rect(5, 3, 4, 4, c.skin); p.px(8, 4, M.adult);
  if (kind === 'a') { p.circle(5, 1, 2, c.hair); }
  p.rect(5, 7, 3, 1, c.skin);
  // body
  p.rect(3, 8, 7, c.long ? 11 : 8, c.top); p.rect(9, 8, 1, c.long ? 11 : 8, c.topLo);
  if (c.vest) { p.rect(4, 9, 5, 6, c.vest); p.rect(6, 9, 1, 6, M.wallHi); }
  if (c.tie) p.rect(6, 9, 1, 4, c.tie);
  // legs, two steps
  const ly = c.long ? 19 : 16, lh = 24 - ly - 1;
  if (step) { p.rect(3, ly, 2, lh, c.leg); p.rect(7, ly, 2, lh, c.leg); p.rect(2, 23, 3, 1, c.shoe); p.rect(7, 23, 3, 1, c.shoe); }
  else { p.rect(5, ly, 2, lh, c.leg); p.rect(5, 23, 4, 1, c.shoe); }
  // what they carry
  if (kind === 'a') { p.rect(10, 9, 1, 4, c.top); p.rect(10, 6, 2, 3, M.white); p.px(10, 7, M.pink); }
  if (kind === 'w') { p.rect(9, 10, 3, 1, M.trim); p.rect(10, 7, 1, 3, M.white); p.rect(8, 11, 2, 2, c.top); }
  if (kind === 'c') { p.rect(9, 11, 2, 3, M.white); p.px(10, 10, '#c8c3d9'); }
  return p;
}
