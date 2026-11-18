// Episode 1, the grounds: level layout (collision, hazards, props) and the painted art.
// Rebuilt Nov 17 (final pass) as a tall level, two and a half screens high, climbed in seven
// short sections with one new idea each (docs/ART_DIRECTION.md, research/design_pass_nov17.md):
//   A outside the wall: walk, jump, look      B the garden: a sweeping lamp, hedges, double jump
//   C the hedge wall: wall jumps              D the fountain terrace: a drone, cover under the bowl
//   E the lawn terrace: push the crate, ride in its shadow, climb it
//   F the loggia: the window cleaners' cradle (a moving platform) under a drone
//   G the balcony: the scan chases her over foam slabs that crumble, two lamps cross, the door
// Art: flat palette colors, hard edges, dithered light, 1 px outlines on what she can touch.
import { Painter, rng } from './painter.js';

export const TILE = 16, VIEW_W = 320, VIEW_H = 180;
const T = TILE;
export const ROWS = { lawn: 25, terrace: 17, loggia: 12, balcony: 5 };
export const GROUND = ROWS.lawn * T;          // the lawn and the ash outside, y 400
export const TERRACE = ROWS.terrace * T;      // y 272
export const LOGGIA = ROWS.loggia * T;        // y 192
export const BALCONY = ROWS.balcony * T;      // y 80
export const LEVEL = {
  w: 100, h: 26,
  gateX: 15 * T,
  start: { x: 3 * T, y: GROUND - 14 },
  door: { x: 96 * T, y: BALCONY - 32, w: 20, h: 32 },
  // the groundskeeper's door in the base of the orangery (optional side room)
  shedDoor: { x: 18 * T + 4, y: GROUND - 26, w: 14, h: 26 },
  crowbar: { x: 17 * T + 10, y: GROUND },
  mailbox: { x: 10 * T + 6, y: GROUND },
  intercom: { x: 14 * T - 2, y: GROUND - 30 },
  // the burnt car outside the wall is solid; she can climb it
  // the gold urns at the terrace edge are solid too (11 x 12, she can stand on them); none past
  // the crate, so nothing stops it on its way to the loggia
  props: [{ id: 'car', x: 92, y: GROUND - 9, w: 34, h: 9 }, { id: 'car roof', x: 98, y: GROUND - 15, w: 20, h: 6 },
    ...[40, 54].map(t => ({ id: 'urn', x: t * T + 3, y: ROWS.terrace * T - 12, w: 11, h: 12 }))],
  crate: { x: 57 * T, y: TERRACE - 22, w: 22, h: 22 },
  // furniture with physics (core/props.js piece), y the floor under it: a garden bench between
  // the hedges (heavy; it throws a shadow the garden lamp cannot see through), and a terrace
  // table and chair between the fountain and the statue (crouch under the table: the drone
  // looks straight down and the top stops its light). A cup on the table.
  furniture: [
    { kind: 'bench', id: 'garden bench', x: 27 * T + 6, y: GROUND, tone: 'wood' },
    { kind: 'table', id: 'terrace table', x: 49 * T + 4, y: TERRACE, w: 20, tone: 'bone', loose: [{ kind: 'cup', dx: 5 }] },
    { kind: 'chair', id: 'terrace chair', x: 50 * T + 12, y: TERRACE, back: 1, tone: 'bone' }
  ],
  cradle: { x: 72 * T, w: 32, top: BALCONY, bottom: LOGGIA, speed: 30, pause: 1.0, roof: 24 },
  slabs: [{ x: 79 * T, y: BALCONY, w: 32 }, { x: 85 * T, y: BALCONY, w: 32 }],
  fountain: { x0: 41 * T, x1: 49 * T, bowl: 14 },
  // at the balcony the satellite scans the house: a wall of light follows her to the door
  scan: { trigger: 76 * T, below: BALCONY + 20, behind: 140, speed: 50 },
  // searchlights: base point, sweep between angles (degrees, y down), period in seconds, phase 0..1
  lights: [
    { id: 'garden lamp', x: 34 * T + 8, y: 296, a0: 116, a1: 164, period: 4.2, phase: 0.0, half: 6, range: 340 },
    { id: 'terrace lamp', x: 67 * T, y: 110, a0: 122, a1: 150, period: 3.8, phase: 0.3, half: 7, range: 260 },
    { id: 'west balcony lamp', x: 80 * T, y: 14, a0: 62, a1: 118, period: 2.8, phase: 0.1, half: 8, range: 120 },
    { id: 'east balcony lamp', x: 92 * T, y: 14, a0: 62, a1: 118, period: 2.8, phase: 0.6, half: 8, range: 120 }
  ],
  // patrol drones with a light straight down
  drones: [
    { id: 'fountain drone', x0: 39 * T, x1: 55 * T, y: 168, speed: 30, half: 11, range: 130 },
    { id: 'loggia drone', x0: 62 * T, x1: 73 * T, y: 30, speed: 34, half: 10, range: 240 }  // ends over the cradle: the balcony is the lamps' and the scan's
  ],
  // where N puts her in story mode: the start of each section, out of the light (E: flush with
  // the crate, in its shadow, wherever it now stands; F: in the cradle, under its roof; the last:
  // at the door itself, past the east lamp, where W goes in; one more N goes through it)
  // the show's tape marks (checkpoints), [x where she stands, the floor's y]: inside the gate, the
  // foot of the hedge wall, the top of the hedge wall (clear of the fountain drone's turn and below
  // the garden lamp), flush with the crate (in its shadow), the balcony before the scan. Each one
  // is safe to stand on for as long as the presenter talks (tested 20 s). None on the loggia: the
  // terrace lamp and the drone between them reach every spot of it, so a death there goes back to
  // the crate (a push, a climb and the run: about 15 s). None at the door: it is one step on.
  marks: [[16 * T, GROUND], [36 * T, GROUND], [35 * T + 4, TERRACE], [57 * T - 8, TERRACE], [75 * T, BALCONY]],
  // gold left out on the path, [x, the floor's y]: the car roof, the hedge tops, the terrace's
  // edge under the fountain drone's turn, the fountain's bowl under the drone, the terrace in the lamp's sweep, the loggia under the
  // drone, the first foam slab, the balcony
  gold: [[108, GROUND - 15], [21 * T, 22 * T], [26 * T, 22 * T], [38 * T + 6, TERRACE], [44 * T + 8, 14 * T], [60 * T, TERRACE], [69 * T, LOGGIA], [80 * T, BALCONY], [89 * T, BALCONY]],
  skip: [[16, ROWS.lawn], [36, ROWS.lawn], [39, ROWS.terrace], [56, ROWS.terrace, 'crate'], [65, ROWS.loggia, 'cradle'], [75, ROWS.balcony], [96.25, ROWS.balcony]]
};

// Materials: a ash ground, g lawn, h hedge, s pale stone, w house base, b balcony slab,
// n the end pier past the door (painted on its own, after the tiles).
export function buildMap() {
  const W = LEVEL.w, H = LEVEL.h, m = [], mat = [];
  for (let y = 0; y < H; y++) { m.push(new Array(W).fill(0)); mat.push(new Array(W).fill('.')); }
  const solid = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y] && x >= 0 && x < W) { m[y][x] = 1; mat[y][x] = c; } };
  const R = ROWS;
  solid(0, R.lawn, 14, H - 1, 'a'); solid(15, R.lawn, 37, H - 1, 'g');
  solid(20, 22, 21, 24, 'h'); solid(25, 22, 26, 24, 'h'); solid(30, 23, 30, 24, 'h');   // B: hedges
  solid(35, R.terrace, 35, 23, 'h');                                                     // C: hedge wall, a gap at its root
  solid(38, R.terrace, W - 1, H - 1, 's');                                               // the terrace
  solid(41, 16, 41, 16, 'f'); solid(48, 16, 48, 16, 'f'); solid(43, 14, 46, 14, 'f');    // D: fountain rims, upper bowl
  solid(52, 15, 52, 16, 'f');                                                            // the statue's plinth
  solid(64, R.loggia, 71, 16, 's');                                                      // E/F: the loggia
  solid(74, 11, W - 1, 16, 'w');                                                         // the house's base
  solid(74, R.balcony, 78, R.balcony, 'b'); solid(81, R.balcony, 84, R.balcony, 'b'); solid(87, R.balcony, W - 1, R.balcony, 'b'); // G
  solid(98, 0, W - 1, R.balcony - 1, 'n');                                               // the portico's end pier: no running past the door
  return { W, H, m, mat };
}

// ------------------------------------------------------------------ painting helpers
// light as dithered rows: every other pixel row of the shape, nothing between (no alpha haze)
export function ditherPoly(p, pts, c, odd) { p.spans(pts, (x, y, w) => { if ((y & 1) === (odd ? 1 : 0)) p.rect(x, y, w, 1, c); }); }
// the same as a 50% checker: for light painted once into a level texture
export function checkerPoly(p, pts, c) { p.spans(pts, (x, y, w) => { for (let xx = x + ((x + y) & 1); xx < x + w; xx += 2) p.px(xx, y, c); }); }
export function ditherRect(p, x, y, w, h, c) { for (let yy = y; yy < y + h; yy++) for (let xx = x + ((yy + x) & 1); xx < x + w; xx += 2) p.px(xx, yy, c); }
function glint(p, P, x, y) { p.px(x, y, P.glint); p.px(x - 1, y, P.goldHi); p.px(x + 1, y, P.goldHi); p.px(x, y - 1, P.goldHi); p.px(x, y + 1, P.goldHi); p.mark('glint', x, y); }
function column(p, P, x, top, bottom, w) {
  p.rect(x, top, w, bottom - top, P.col); p.rect(x + 1, top, 1, bottom - top, P.colHi); p.rect(x + w - 1, top, 1, bottom - top, P.colLo);
  for (let i = 3; i < w - 2; i += 3) p.rect(x + i, top + 2, 1, bottom - top - 4, P.colLo);
  p.rect(x - 1, bottom - 3, w + 2, 3, P.colHi); p.rect(x - 1, bottom - 1, w + 2, 1, P.colLo);
  p.rect(x - 2, top - 3, w + 4, 3, P.gold); p.rect(x - 1, top - 1, w + 2, 1, P.goldLo);
}
function statue(p, P, cx, base) {
  // a gold figure: arm raised, holding a star
  p.rect(cx - 3, base - 15, 7, 1, '#0e0f12'); p.rect(cx - 3, base - 14, 6, 10, P.gold); p.rect(cx - 2, base - 19, 4, 5, P.gold); p.rect(cx + 2, base - 23, 1, 9, P.gold);
  p.rect(cx - 4, base - 4, 9, 4, P.goldLo); p.rect(cx - 2, base - 13, 1, 8, P.goldHi); p.rect(cx - 1, base - 18, 1, 2, P.goldHi);
  glint(p, P, cx + 2, base - 24);
}
function lampPost(p, P, x, top, bottom) {
  p.rect(x - 1, top + 5, 3, bottom - top - 5, P.goldLo); p.rect(x, top + 5, 1, bottom - top - 5, P.gold);
  p.rect(x - 3, bottom - 4, 7, 4, P.goldLo); p.rect(x - 3, bottom - 4, 7, 1, P.gold);
  p.rect(x - 4, top - 1, 9, 7, '#0e0f12'); p.rect(x - 3, top, 7, 5, P.device); p.rect(x - 2, top + 1, 5, 3, P.lamp);
}
function window(p, P, x, y, w, h, lit, arch) {
  p.rect(x - 1, y - 1, w + 2, h + 2, P.goldLo);
  p.rect(x, y, w, h, lit ? P.win : P.winLo);
  if (arch) { p.rect(x + 1, y - 3, w - 2, 2, P.goldLo); p.rect(x + 2, y - 2, w - 4, 2, lit ? P.win : P.winLo); }
  p.rect(x + Math.floor(w / 2), y, 1, h, P.goldLo); p.rect(x, y + Math.floor(h / 3), w, 1, P.goldLo);
  if (lit) { p.rect(x + 1, y + 1, 1, Math.floor(h / 3) - 1, P.winHi); }
}

// One hedge tile, drawn by hand: '#' a lit leaf, 'o' the shadow under a clump, '.' the hedge.
const HEDGE = [
  '.##.....',
  '####..#.',
  '.oo..###',
  '.....#oo',
  '..##..o.',
  '.####...',
  '#.oo..##',
  'o.....oo'
];
// a few ground marks per screen, placed by tile, not scattered: a crack, a pebble, a tuft of ash
const MARKS = { 3: 'crack', 7: 'pebble', 12: 'tuft', 18: 'crack', 23: 'pebble', 29: 'tuft', 34: 'crack' };
// Solid tiles, painted by material: a light top edge where she can stand, a dark face, and an
// ash0 outline on every edge that meets open air.
function paintTiles(p, P, map) {
  const O = '#0e0f12', open = (x, y) => y >= 0 && y < map.H && x >= 0 && x < map.W && !map.m[y][x];
  for (let ty = 0; ty < map.H; ty++) for (let tx = 0; tx < map.W; tx++) {
    if (!map.m[ty][tx]) continue;
    const c = map.mat[ty][tx], x = tx * T, y = ty * T, up = open(tx, ty - 1), dn = open(tx, ty + 1), lf = open(tx - 1, ty), rt = open(tx + 1, ty);
    if (c === 'a') {
      p.rect(x, y, T, T, P.ground);
      if (up) {
        p.rect(x, y, T, 2, P.groundTop);
        const mk = MARKS[tx % 36];
        if (mk === 'crack') { p.px(x + 5, y + 2, O); p.px(x + 6, y + 3, O); p.px(x + 6, y + 4, O); p.px(x + 7, y + 5, O); p.px(x + 9, y + 3, O); p.px(x + 8, y + 4, O); }
        else if (mk === 'pebble') { p.rect(x + 9, y - 1, 3, 1, P.rubbleHi); p.rect(x + 8, y, 5, 1, P.rubble); }
        else if (mk === 'tuft') { p.px(x + 4, y - 1, P.dust); p.px(x + 6, y - 2, P.dust); p.px(x + 6, y - 1, P.dust); p.px(x + 8, y - 1, P.dust); }
      }
    }
    else if (c === 'g') {
      p.rect(x, y, T, T, P.hedge);
      // the lawn's edge and a gravel path with a joint every other tile (no scattered specks)
      if (up) { p.rect(x, y, T, 1, P.hedgeHi); for (let i = 0; i < T; i += 3) p.px(x + i + (tx & 1), y - 1, P.hedgeHi); p.rect(x, y + 5, T, 5, P.path); p.rect(x, y + 5, T, 1, P.pathHi); if (tx & 1) p.rect(x + 11, y + 6, 1, 4, P.groundTop); }
    } else if (c === 'h') {
      // clipped hedge: an 8 x 8 tile of leaf clumps (bronze on bronzeLo, a dark pixel under each)
      p.rect(x, y, T, T, P.hedge);
      for (let yy = 0; yy < T; yy++) for (let xx = 0; xx < T; xx++) { const ch = HEDGE[(yy & 7)][(xx + (ty & 1) * 4) & 7]; if (ch === '#') p.px(x + xx, y + yy, P.hedgeHi); else if (ch === 'o') p.px(x + xx, y + yy, O); }
      if (up) { p.rect(x, y, T, 1, P.hedgeHi); for (let i = 1; i < T; i += 4) p.px(x + i + (tx & 1), y - 1, P.hedgeHi); }
      if (lf) p.rect(x, y, 1, T, O); if (rt) p.rect(x + T - 1, y, 1, T, O); if (dn) { p.rect(x, y + T - 1, T, 1, O); }
    } else if (c === 'f') {
      p.rect(x, y, T, T, P.col); p.rect(x, y + T - 4, T, 4, P.colLo); p.rect(x, y + 4, T, 1, P.colHi);
      if (up) { p.rect(x, y, T, 2, P.gold); p.rect(x, y, T, 1, P.goldHi); }
      if (lf) p.rect(x, y, 1, T, O); if (rt) p.rect(x + T - 1, y, 1, T, O); if (dn) p.rect(x, y + T - 1, T, 1, O);
    } else if (c === 's' || c === 'w' || c === 'b') {
      const base = c === 'w' ? P.wall : P.colLo, hi = c === 'w' ? P.wallHi : P.col, joint = c === 'w' ? P.wallLo : P.rubble;
      p.rect(x, y, T, T, base);
      // block courses: 8 px tall, joints staggered
      for (let yy = 0; yy < T; yy += 8) { p.rect(x, y + yy, T, 1, joint); p.rect(x + (((ty * 2 + yy / 8) & 1) ? 0 : 8), y + yy, 1, 8, joint); p.rect(x + 1, y + yy + 1, T - 2, 1, hi); }
      if (up) { p.rect(x, y, T, 2, c === 'w' ? P.wallHi : P.colHi); p.rect(x, y, T, 1, c === 'b' ? P.gold : P.colHi); }
      if (lf) p.rect(x, y, 1, T, O); if (rt) p.rect(x + T - 1, y, 1, T, O); if (dn) p.rect(x, y + T - 1, T, 1, O);
    }
  }
}

// ------------------------------------------------------------------ sky and far layers
export function paintSky(P, w) {
  const p = new Painter(w, VIEW_H);
  p.rect(0, 0, w, VIEW_H, P.skyTop);
  const r = rng(7); for (let i = 0; i < w / 6; i++) p.px(r() * w, r() * 120, r() < 0.12 ? P.glint : P.star);
  return p;
}
export function paintMoon(P) {
  const p = new Painter(32, 32);
  p.circle(16, 16, 12, '#0e0f12'); p.circle(16, 16, 11, P.moon); p.circle(19, 13, 2, P.moonShade); p.circle(12, 19, 1, P.moonShade); p.circle(20, 20, 1, P.moonShade);
  p.px(13, 21, P.lamp); p.px(14, 21, P.goldHi); // one lit window on the Moon
  return p;
}
// The dead city outside the walls: broken towers, a few fires. Its ground line is at y 220.
export const CITY_H = 240, CITY_GROUND = 220;
export function paintCity(P, w) {
  const p = new Painter(w, CITY_H), r = rng(41), G = CITY_GROUND;
  let x = 0;
  while (x < w) {
    const bw = 10 + Math.floor(r() * 26), bh = 30 + Math.floor(r() * 80), top = G - bh;
    p.rect(x, top, bw, G - top, P.hill);
    for (let i = 0; i < bw; i += 2) if (r() < 0.45) p.rect(x + i, top, 2, 2 + Math.floor(r() * 8), P.skyTop);
    if (r() < 0.4) p.line(x + bw - 2, top, x + bw + 4, top - 8 - r() * 8, P.hill);
    if (r() < 0.4) { const fx = x + 2 + Math.floor(r() * (bw - 4)), fy = top + 6 + Math.floor(r() * Math.max(4, bh - 20)); p.rect(fx, fy, 2, 2, P.lamp); p.mark('fire', fx, fy); }
    x += bw + Math.floor(r() * 6);
  }
  p.rect(0, G, w, CITY_H - G, P.hill);
  return p;
}

// ------------------------------------------------------------------ the level
export function paintLevel(P, map) {
  const W = LEVEL.w * T, H = LEVEL.h * T, p = new Painter(W, H), G = GROUND, TR = TERRACE, O = '#0e0f12';

  // ---------------- B: the orangery behind the garden (glass, gold frames, warm panes) ----------------
  const ox0 = 16 * T, ox1 = 34 * T, oTop = 296;
  p.rect(ox0, oTop, ox1 - ox0, G - oTop, P.glass);
  const rg = rng(91);
  for (let y = oTop + 6; y < G - 12; y += 16) for (let x = ox0 + 4; x < ox1 - 10; x += 14) { const v = rg(); p.rect(x, y, 12, 14, v < 0.32 ? P.glassLit : P.glass); if (v < 0.32) p.rect(x, y, 12, 1, P.goldHi); }
  for (let x = ox0; x <= ox1; x += 14) p.rect(x, oTop, 2, G - oTop, P.goldLo);
  p.poly([[ox0 - 4, oTop], [(ox0 + ox1) / 2, oTop - 30], [ox1 + 4, oTop]], P.glass);
  for (let i = 0; i < 9; i++) { const x = ox0 + 12 + i * 30; p.line(x, oTop - 1, (ox0 + ox1) / 2, oTop - 29, P.goldLo); }
  p.rect(ox0 - 4, oTop - 2, ox1 - ox0 + 8, 3, P.gold); p.line(ox0 - 4, oTop - 1, (ox0 + ox1) / 2, oTop - 31, P.gold); p.line(ox1 + 4, oTop - 1, (ox0 + ox1) / 2, oTop - 31, P.gold);
  glint(p, P, (ox0 + ox1) / 2, oTop - 33);
  const SD = LEVEL.shedDoor;
  p.rect(SD.x - 2, SD.y - 2, SD.w + 4, SD.h + 2, P.goldLo); p.rect(SD.x, SD.y, SD.w, SD.h, P.wallLo); p.rect(SD.x + 1, SD.y + 1, SD.w - 2, SD.h - 1, P.wall);
  p.rect(SD.x + 2, SD.y + 4, SD.w - 4, 3, P.colLo); p.rect(SD.x + SD.w - 4, SD.y + 13, 2, 2, P.gold);

  // ---------------- D: a screen wall behind the fountain terrace: arches, lit, columns in front ----------------
  const dx0 = 38 * T, dx1 = 56 * T, dTop = 184;
  p.rect(dx0, dTop, dx1 - dx0, TR - dTop, P.wall); p.rect(dx0, dTop, dx1 - dx0, 2, P.wallHi);
  for (let x = dx0 + 10; x < dx1 - 20; x += 32) { window(p, P, x + 4, dTop + 22, 14, 34, true, true); }
  p.rect(dx0 - 2, dTop - 8, dx1 - dx0 + 4, 8, P.colHi); p.rect(dx0 - 2, dTop - 8, dx1 - dx0 + 4, 1, P.gold); p.rect(dx0 - 2, dTop - 1, dx1 - dx0 + 4, 1, P.goldLo);
  for (let x = dx0; x < dx1; x += 5) p.rect(x, dTop - 14, 2, 6, P.col); p.rect(dx0 - 2, dTop - 15, dx1 - dx0 + 4, 1, P.colHi);
  for (let x = dx0 + 2; x < dx1; x += 32) column(p, P, x, dTop + 4, TR, 8);

  // ---------------- E to G: the main house, bronze, three tall storeys, a dome and a temple front ----------------
  const hx0 = 56 * T, hx1 = W, roof = 34;
  p.rect(hx0, roof, hx1 - hx0, TR - roof, P.wall);
  for (let x = hx0; x < hx1; x += 32) { p.rect(x + 13, roof + 6, 6, TR - roof - 6, P.wallHi); p.rect(x + 15, roof + 6, 1, TR - roof - 6, P.wallLine); }
  // storey bands
  [roof + 4, 104, 178].forEach(y => { p.rect(hx0, y, hx1 - hx0, 3, P.colHi); p.rect(hx0, y + 3, hx1 - hx0, 1, P.goldLo); });
  // tall windows, a lit room here and there
  const rw = rng(23);
  for (let x = hx0 + 22; x < hx1 - 10; x += 32) { window(p, P, x, 48, 12, 44, rw() < 0.6, true); window(p, P, x, 120, 12, 44, rw() < 0.5, true); window(p, P, x, 196, 12, 56, rw() < 0.4, true); }
  // roofline: balustrade and gold statues
  p.rect(hx0, roof - 4, hx1 - hx0, 4, P.colHi); for (let x = hx0 + 2; x < hx1; x += 5) p.rect(x, roof - 10, 2, 6, P.col); p.rect(hx0, roof - 11, hx1 - hx0, 1, P.colHi);
  for (let x = hx0 + 12; x < 84 * T; x += 48) statue(p, P, x, roof - 11);
  // the dome over the middle
  const dc = 66 * T, dy = roof - 11;
  p.rect(dc - 34, dy - 10, 68, 10, P.wallHi); for (let i = 0; i < 7; i++) p.rect(dc - 29 + i * 9, dy - 8, 3, 6, P.win);
  p.circle(dc, dy - 10, 27, O); p.circle(dc, dy - 10, 26, P.gold); p.rect(dc - 28, dy - 10, 56, 30, P.wallHi); p.rect(dc - 36, dy - 12, 72, 3, P.gold);
  [-18, -9, 0, 9, 18].forEach(o => { const top = Math.round(dy - 10 - Math.sqrt(Math.max(0, 676 - o * o))); p.rect(dc + o, top + 2, 1, dy - 14 - top, P.goldLo); });
  p.rect(dc - 12, dy - 30, 3, 6, P.goldHi);
  // the temple front over the door: columns, a pediment, a gold sun
  const tx0 = 86 * T, tx1 = W, tc = 96 * T + 10;
  p.rect(tx0 - 6, 0, tx1 - tx0 + 6, BALCONY, P.wall);
  p.poly([[tx0 - 8, 22], [tc, 0], [tx1 + 40, 22]], P.gold); p.poly([[tx0 - 2, 21], [tc, 3], [tx1 + 34, 21]], P.colHi);
  p.rect(tx0 - 8, 22, tx1 - tx0 + 8, 6, P.colHi); p.rect(tx0 - 8, 22, tx1 - tx0 + 8, 1, P.gold); p.rect(tx0 - 8, 27, tx1 - tx0 + 8, 1, P.goldLo);
  p.circle(tc, 14, 5, P.gold); p.circle(tc, 14, 3, P.goldHi); glint(p, P, tc, 14);
  [88, 91, 94].forEach(t => column(p, P, t * T, 31, BALCONY, 8));
  // the door itself, lit from inside
  const D = LEVEL.door;
  p.rect(D.x - 4, D.y - 6, D.w + 8, D.h + 6, P.goldLo); p.rect(D.x - 3, D.y - 5, D.w + 6, 1, P.gold);
  p.rect(D.x, D.y, D.w, D.h, P.winHi); p.rect(D.x + D.w / 2, D.y, 1, D.h, P.goldLo);
  p.rect(D.x + 3, D.y + 4, 5, 10, P.win); p.rect(D.x + D.w - 8, D.y + 4, 5, 10, P.win);
  for (let x = 74 * T; x < W; x += 6) { if (Math.floor(x / T) >= 79 && Math.floor(x / T) <= 80) continue; if (Math.floor(x / T) >= 85 && Math.floor(x / T) <= 86) continue; p.rect(x + 1, BALCONY - 10, 3, 9, P.col); p.px(x + 2, BALCONY - 10, P.colHi); }
  p.rect(74 * T, BALCONY - 12, 5 * T, 2, P.colHi); p.rect(81 * T, BALCONY - 12, 4 * T, 2, P.colHi); p.rect(87 * T, BALCONY - 12, 13 * T, 2, P.colHi);
  // cradle rails on the house face
  p.rect(72 * T + 1, 0, 1, TR, P.device); p.rect(74 * T - 2, 0, 1, TR, P.device);
  p.rect(72 * T - 4, 0, 40, 4, P.device); p.rect(72 * T + 14, 4, 4, 3, P.device);

  // ---------------- A: outside the wall: a dead tree, the burnt car, rubble, the mailbox ----------------
  p.rect(30, G - 40, 3, 40, P.wood); p.line(31, G - 28, 18, G - 44, P.wood); p.line(32, G - 32, 46, G - 52, P.wood); p.line(31, G - 36, 36, G - 58, P.wood);
  p.rect(91, G - 10, 36, 10, O); p.rect(92, G - 9, 34, 7, P.rubble); p.rect(97, G - 16, 22, 7, O); p.rect(98, G - 15, 20, 6, P.rubble);
  p.rect(101, G - 13, 6, 3, P.crack); p.rect(109, G - 13, 6, 3, P.crack); p.rect(92, G - 9, 34, 1, P.rubbleHi);
  p.circle(99, G - 2, 3, P.crack); p.circle(119, G - 2, 3, P.crack);
  for (let i = 0; i < 5; i++) p.rect(140 + i * 9, G - 3 - (i % 3) * 2, 6, 3 + (i % 3) * 2, P.rubbleHi);
  const MB = LEVEL.mailbox;
  p.rect(MB.x - 1, G - 18, 3, 18, P.device); p.rect(MB.x - 5, G - 25, 11, 8, O); p.rect(MB.x - 4, G - 24, 9, 6, P.rubbleHi); p.rect(MB.x - 4, G - 24, 9, 1, P.dust); p.rect(MB.x + 4, G - 28, 1, 5, P.dust);
  // ---------------- the gilded fence and the open gate, with the intercom on its pier ----------------
  const fx0 = 14 * T, fx1 = 16 * T;
  for (let x = fx0 + 6; x <= fx1 + 6; x += 6) { p.rect(x, G - 46, 2, 46, P.goldLo); p.rect(x, G - 46, 1, 46, P.gold); p.poly([[x - 1, G - 46], [x + 1, G - 52], [x + 3, G - 46]], P.gold); }
  p.rect(fx0 + 4, G - 40, fx1 - fx0 + 4, 2, P.gold); p.rect(fx0 + 4, G - 12, fx1 - fx0 + 4, 2, P.gold);
  p.rect(fx0 - 4, G - 58, 9, 58, O); p.rect(fx0 - 3, G - 58, 7, 58, P.col); p.rect(fx0 - 2, G - 58, 1, 58, P.colHi); p.rect(fx0 - 5, G - 61, 11, 3, P.gold); p.circle(fx0, G - 64, 3, P.gold); glint(p, P, fx0, G - 65);
  const IC = LEVEL.intercom; p.rect(IC.x - 2, IC.y - 1, 6, 9, O); p.rect(IC.x - 1, IC.y, 4, 7, P.device); p.px(IC.x, IC.y + 1, P.colHi); p.px(IC.x + 1, IC.y + 1, P.colHi); p.rect(IC.x, IC.y + 4, 2, 1, P.lamp);
  // the gate leaf hangs open toward the house
  p.poly([[fx1 + 10, G - 44], [fx1 + 26, G - 36], [fx1 + 26, G - 4], [fx1 + 10, G]], P.goldLo);
  for (let i = 0; i < 4; i++) p.line(fx1 + 12 + i * 4, G - 42 + i * 2, fx1 + 12 + i * 4, G - 2, P.gold);

  // ---------------- C: under the hedge wall, the stems it stands on ----------------
  [35 * T + 3, 35 * T + 11].forEach(x => p.rect(x, 24 * T, 2, T, P.wood));
  // B: the garden lamp on its tall post
  lampPost(p, P, 34 * T + 8, 292, G);

  // ---------------- the solid world ----------------
  paintTiles(p, P, map);
  // the portico's end pier just past the door: pale stone, a recessed panel, gold top and foot
  const nx = 98 * T, ny = 28;
  p.rect(nx, ny, W - nx, BALCONY - ny, P.col); p.rect(nx, ny, 1, BALCONY - ny, O); p.rect(nx + 1, ny, 1, BALCONY - ny, P.colHi);
  p.rect(nx + 6, ny + 6, W - nx - 10, BALCONY - ny - 14, P.colLo); p.rect(nx + 7, ny + 7, W - nx - 12, BALCONY - ny - 16, P.col); p.rect(nx + 7, ny + 7, 1, BALCONY - ny - 16, P.colHi);
  p.rect(nx - 1, ny, W - nx + 1, 2, P.gold); p.rect(nx, BALCONY - 3, W - nx, 3, P.colLo); p.rect(nx, BALCONY - 1, W - nx, 1, P.goldLo);
  // the loggia: an arcade with dark arches, gold keystones
  const lx0 = 64 * T, lx1 = 72 * T;
  for (let x = lx0 + 10; x < lx1 - 16; x += 38) { p.rect(x, LOGGIA + 22, 24, TR - LOGGIA - 22, O); p.circle(x + 12, LOGGIA + 22, 12, O); p.rect(x + 11, LOGGIA + 8, 3, 4, P.gold); }
  // the house base under the balcony: rusticated, with deep windows; then the balcony's railing
  for (let x = 75 * T; x < W - 10; x += 40) { p.rect(x + 8, 11 * T + 24, 14, 40, O); p.rect(x + 9, 11 * T + 25, 12, 1, P.goldLo); }
  // the terrace wall: basement grilles, a gold band under its coping
  p.rect(38 * T, TR + 2, (LEVEL.w - 38) * T, 1, P.goldLo);
  for (let x = 40 * T; x < LEVEL.w * T - 20; x += 72) { p.rect(x - 1, TR + 40, 22, 14, O); p.rect(x, TR + 41, 20, 12, P.wallLo); for (let i = 2; i < 20; i += 4) p.rect(x + i, TR + 41, 1, 12, P.device); p.rect(x, TR + 41, 20, 1, P.lamp); }
  // fairy lights along the hedge tops
  for (let tx = 15; tx < 36; tx++) for (let ty = 17; ty < 25; ty++) if (map.mat[ty][tx] === 'h' && !map.m[ty - 1][tx]) for (let i = 2; i < T; i += 5) { p.px(tx * T + i, ty * T + 4 + (i % 3), P.lamp); p.mark('fairy', tx * T + i, ty * T + 4 + (i % 3)); }
  // D: the fountain: water, the bowl's stem, the bowl's gold lip
  const F = LEVEL.fountain;
  p.rect(F.x0 + T, TR - 5, F.x1 - F.x0 - 2 * T, 5, P.glass); p.rect(F.x0 + T, TR - 5, F.x1 - F.x0 - 2 * T, 1, P.glassLit);
  p.rect(44 * T + 12, 15 * T, 8, TR - 5 - 15 * T, P.colLo); p.rect(44 * T + 13, 15 * T, 1, TR - 5 - 15 * T, P.colHi); p.rect(44 * T + 19, 15 * T, 1, TR - 5 - 15 * T, O);
  p.rect(43 * T, 15 * T, 4 * T, 1, P.gold); p.rect(43 * T + 2, 14 * T - 2, 4 * T - 4, 2, P.glassLit);
  p.mark('fountain', 45 * T, 14 * T - 2);
  // the statue on its plinth (the plaque says 07)
  statue(p, P, 52 * T + 8, 15 * T); p.rect(52 * T + 4, 15 * T + 6, 8, 5, P.goldLo); p.rect(52 * T + 5, 15 * T + 7, 2, 3, O); p.rect(52 * T + 9, 15 * T + 7, 2, 3, O); p.px(52 * T + 10, 15 * T + 8, P.goldLo);
  // E: the terrace lamp on its bracket; G: the balcony lamps hang from the cornice
  [[LEVEL.lights[1].x, LEVEL.lights[1].y], [LEVEL.lights[2].x, LEVEL.lights[2].y], [LEVEL.lights[3].x, LEVEL.lights[3].y]].forEach(([x, y]) => { p.rect(x - 5, y - 5, 11, 9, O); p.rect(x - 4, y - 4, 9, 7, P.device); p.rect(x - 3, y - 2, 7, 3, P.lamp); p.rect(x, y - 14, 1, 9, P.device); });
  // terrace edge urns, wealth for its own sake
  LEVEL.props.filter(r => r.id === 'urn').forEach(r => { const x = r.x + 5; p.rect(x - 5, TR - 12, 11, 12, O); p.rect(x - 4, TR - 11, 9, 4, P.gold); p.rect(x - 2, TR - 7, 5, 6, P.goldLo); p.rect(x - 3, TR - 2, 7, 2, P.gold); p.px(x - 2, TR - 10, P.goldHi); });
  return p;
}
