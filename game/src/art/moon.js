// Episode 5, the Moon: the watchers' home. Bright, soft and clean, in its own colors (the five
// looks are her world's; the Moon looks the same whichever one was picked). A corridor of glass
// rooms where adults watch walls of Earth channels, a robot, a vote screen, and at the end the
// kids' playroom. Then the last shot: an old TV in a dark room on Earth, showing the Moon.
import { Painter, rng } from './painter.js';
import { pixText, textWidth } from './pixfont.js';

export const TILE = 16, GROUND = 160;
const T = TILE, G = GROUND;
export const KX = 84 * T; // the playroom's left wall

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
  wood: '#3d3a52', red: '#ff3b3b'
};

export const LEVEL = {
  w: 104, h: 12,
  start: { x: 44, y: G - 14 },
  arrive: { x: 24, y: G - 36, w: 22, h: 36 },                   // the door she comes out of
  door: { x: 80 * T + 4, y: G - 36, w: 24, h: 36 },              // the playroom door
  // rooms behind glass, people on sofas watching walls of Earth channels
  rooms: [
    { x0: 6 * T, x1: 18 * T, seats: 4, tiles: ['estate', 'street', 'field', 'hall', 'sat', 'beach', 'crowd', 'static'] },
    { x0: 27 * T, x1: 39 * T, seats: 5, tiles: ['bedroom', 'ridge', 'estate', 'crowd', 'field', 'static', 'street', 'beach'] },
    { x0: 48 * T, x1: 58 * T, seats: 2, tiles: ['grounds', 'static', 'hall', 'ridge', 'sat', 'field'] }
  ],
  portholes: [{ x: 22 * T + 8, y: 62, r: 16 }, { x: 44 * T, y: 62, r: 16 }, { x: 70 * T, y: 62, r: 16 }],
  vote: { x: 60 * T + 4, y: 52, w: 92, h: 46 },
  robot: { x0: 40 * T, x1: 47 * T, speed: 14 },
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
  solid(0, 0, 0, 9); solid(83, 0, 83, 9); solid(W - 1, 0, W - 1, 9);
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

export function paintLevel(P, look) {
  const W = LEVEL.w * T, p = new Painter(W, 180), r = rng(77);
  // the corridor: ceiling lights, a gold rail, soft panels, a rug that runs its length
  p.rect(0, 0, W, G, M.wall);
  p.rect(0, 0, W, 14, M.wallHi); for (let x = 24; x < W; x += 64) { p.rect(x, 12, 22, 2, M.warm); p.glowPoly([[x, 14], [x + 22, 14], [x + 34, 40], [x - 12, 40]], M.warm, 0.12); p.mark('light', x + 11, 13); }
  p.rect(0, 14, W, 2, M.trim); p.rect(0, 16, W, 1, M.trimLo);
  for (let x = 0; x < W; x += 48) { p.rect(x + 6, 22, 36, 112, M.wallHi); p.rect(x + 7, 23, 34, 110, M.wall); p.rect(x + 41, 23, 1, 110, M.wallLo); }
  p.rect(0, 140, W, 20, M.wallHi); p.rect(0, 140, W, 1, M.trim); p.rect(0, 159, W, 1, M.trimLo);
  p.rect(0, G, W, 20, M.floor); p.rect(0, G, W, 1, M.floorHi); for (let x = 0; x < W; x += 40) p.rect(x, G + 1, 1, 19, M.floorLo);
  p.rect(16, G + 5, 82 * T - 32, 8, M.rug); p.rect(16, G + 5, 82 * T - 32, 1, M.rugLo); p.rect(16, G + 12, 82 * T - 32, 1, M.rugLo);
  for (let x = 24; x < 82 * T - 24; x += 12) p.rect(x, G + 8, 6, 2, M.rugLo);
  // where she comes out
  oddDoor(p, LEVEL.arrive, true);
  // the rooms behind glass
  LEVEL.rooms.forEach((R, i) => paintRoomBehindGlass(p, R, i));
  LEVEL.portholes.forEach(h => porthole(p, h.x, h.y, h.r));
  // the vote screen: tonight's look, picked from home
  const V = LEVEL.vote;
  p.rect(V.x - 2, V.y - 2, V.w + 4, V.h + 4, M.bezel); p.rect(V.x, V.y, V.w, V.h, M.purple);
  const mid = s => V.x + Math.round((V.w - textWidth(s)) / 2);
  ptext(p, "TONIGHT'S LOOK", mid("TONIGHT'S LOOK"), V.y + 5, M.yellow);
  ptext(p, look.toUpperCase(), mid(look), V.y + 17, M.white);
  p.rect(V.x + 8, V.y + 28, V.w - 16, 4, M.bezel); p.rect(V.x + 8, V.y + 28, Math.round((V.w - 16) * 0.62), 4, M.pink);
  ptext(p, 'THANKS FOR VOTING', mid('THANKS FOR VOTING'), V.y + 37, M.mint);
  p.mark('vote', V.x, V.y);
  // a plant, a bench nobody sits on
  [[20 * T, 'plant'], [43 * T, 'bench'], [60 * T, 'plant'], [67 * T + 8, 'bench']].forEach(([x, k]) => {
    if (k === 'plant') { p.rect(x, G - 12, 10, 12, M.trim); p.rect(x + 1, G - 12, 8, 2, M.trimHi); for (let i = 0; i < 7; i++) p.ellipse(x + 5 + Math.round((r() - 0.5) * 10), G - 18 - Math.round(r() * 14), 3, 2, i % 2 ? '#5aa67a' : '#3f8a5f'); }
    else { p.rect(x, G - 10, 30, 3, M.trim); p.rect(x + 2, G - 7, 2, 7, M.trimLo); p.rect(x + 26, G - 7, 2, 7, M.trimLo); p.rect(x, G - 13, 30, 3, M.sofa); }
  });
  // the playroom door: round-topped, a gold star
  const D = LEVEL.door;
  p.circle(D.x + D.w / 2, D.y + 8, D.w / 2 + 3, M.trim); p.rect(D.x - 3, D.y + 8, D.w + 6, D.h - 8, M.trim);
  p.circle(D.x + D.w / 2, D.y + 8, D.w / 2, M.pink); p.rect(D.x, D.y + 8, D.w, D.h - 8, M.pink);
  p.rect(D.x + D.w / 2, D.y - 3, 1, D.h + 3, '#d94a88');
  p.poly([[D.x + D.w / 2, D.y + 3], [D.x + D.w / 2 + 3, D.y + 9], [D.x + D.w / 2 + 9, D.y + 9], [D.x + D.w / 2 + 4, D.y + 13], [D.x + D.w / 2 + 6, D.y + 19], [D.x + D.w / 2, D.y + 15], [D.x + D.w / 2 - 6, D.y + 19], [D.x + D.w / 2 - 4, D.y + 13], [D.x + D.w / 2 - 9, D.y + 9], [D.x + D.w / 2 - 3, D.y + 9]], M.yellow);
  ptext(p, 'PLAYROOM', D.x + D.w / 2 - 15, D.y - 16, M.trimLo);
  p.px(D.x + D.w - 5, D.y + 22, M.trimHi);
  // the wall between, and the playroom
  p.rect(83 * T, 0, T, G, M.wallLo); p.rect(83 * T, 0, 1, G, M.trim);
  paintPlayroom(p);
  p.rect((LEVEL.w - 1) * T, 0, T, G, M.wallLo);
  return p;
}

function paintPlayroom(p) {
  const X = KX, r = rng(23);
  p.rect(X, 0, 20 * T, G, M.wall); p.rect(X, 0, 20 * T, 10, M.wallHi); p.rect(X, 10, 20 * T, 2, M.trim);
  for (let i = 0; i < 22; i++) { const sx = X + 10 + r() * 290, sy = 16 + r() * 104, c = [M.yellow, M.pink, M.mint, M.blue][i % 4]; if (sx > LEVEL.screen.x - 6 && sx < LEVEL.screen.x + LEVEL.screen.w + 6 && sy < LEVEL.screen.y + LEVEL.screen.h + 6) continue; p.rect(sx, sy + 1, 3, 1, c); p.rect(sx + 1, sy, 1, 3, c); }
  p.rect(X, G, 20 * T, 20, M.floor); p.rect(X, G, 20 * T, 1, M.floorLo);
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
