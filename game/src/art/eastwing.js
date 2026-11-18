// Episode 3, the east wing, from above (rebuilt Nov 18 after Michael's playtest: "make it cooler
// like the other levels, add dead ends"). A real floor plan for a decayed wing of the mansion:
//   the landing under the hole she fell through (a heap of pebbles where a wall came down, a
//   workshop door, a calendar), a sensor corridor with a radio and a dead-end alcove, the portrait
//   gallery the house guards with lasers, the library where a robot patrols between the shelves
//   (the dumbwaiter comes out at its far end), the study under a camera (a desk, a fireplace,
//   armchairs to hide behind) and the ballroom with the chandelier, a piano alcove and the way out.
// Built as a character map so the rooms are easy to change; floors and wallpaper go by room.
import { Painter, rng } from './painter.js';
import { ASH } from './palettes.js';

export const T = 16, W = 53, H = 37;

// '#' wall  '.' floor  ',' debris (noisy)  'o' hole  'P' pillar  'K' bookshelf  'T' desk or table
// 'R' rubble  'b' an old body  'p' the heap of pebbles (2 x 2)  'Q' the radio  'V' a bust on a plinth
// 'A' an armchair (high back: it hides her)  'G' the piano (2 x 2)
// In the walls: 'D' the exit door  'W' the workshop door  'H' the dumbwaiter hatch  'X' where it
// comes out  'C' the calendar  'L' a laser port  'f' a portrait  's' a sconce  'w' a window
// 'F' the fireplace
export const ROOMS = [
  { id: 'landing', x0: 2, y0: 26, x1: 12, y1: 35, floor: 'boards', paper: 'peel' },
  { id: 'corridor', x0: 13, y0: 30, x1: 35, y1: 32, floor: 'runner', paper: 'stripe' },
  { id: 'alcove', x0: 32, y0: 33, x1: 34, y1: 35, floor: 'boards', paper: 'stripe' },
  { id: 'gallery', x0: 31, y0: 13, x1: 35, y1: 29, floor: 'marble', paper: 'panel' },
  { id: 'library', x0: 14, y0: 4, x1: 29, y1: 14, floor: 'parquet', paper: 'panel' },
  { id: 'study', x0: 31, y0: 4, x1: 37, y1: 11, floor: 'parquet', paper: 'damask' },
  { id: 'ballroom', x0: 38, y0: 2, x1: 51, y1: 17, floor: 'marble', paper: 'gilt' }
];
export const roomAt = (x, y) => ROOMS.find(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) || null;

export function buildMap() {
  const m = Array.from({ length: H }, () => new Array(W).fill('#'));
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y][x] = c; };
  const put = (list, c) => list.forEach(([x, y]) => { m[y][x] = c; });
  // the landing, under the hole she fell through
  fill(2, 26, 12, 35, '.');
  put([[2, 26], [2, 35], [12, 35], [6, 35], [3, 31]], 'R');
  put([[5, 28], [9, 33], [4, 33], [10, 30], [7, 34], [6, 27]], ',');
  put([[11, 26], [12, 26], [11, 27], [12, 27]], 'p');
  put([[3, 34], [11, 33]], 'b');
  m[25][4] = 'W'; m[25][6] = 'f'; m[25][8] = 'C'; m[25][11] = 'w';
  // the sensor corridor, east, with a dead-end alcove off its far end
  fill(13, 30, 35, 32, '.');
  fill(32, 33, 34, 35, '.');
  m[32][14] = 'Q';
  put([[21, 32]], 'b'); put([[34, 35]], 'b'); put([[33, 35]], 'R');
  put([[16, 30], [26, 32], [30, 30], [20, 30]], ',');
  put([[15, 29], [23, 29]], 's'); put([[33, 29]], '.');
  // the portrait gallery, north: lasers across it, busts between them
  fill(31, 13, 35, 29, '.');
  [25, 21, 17].forEach(y => { m[y][30] = 'L'; m[y][36] = 'L'; });
  put([[31, 23], [35, 19], [31, 15]], 'V');
  m[12][34] = 'H'; // the dumbwaiter hatch at the top of the gallery
  // the library: two rows of shelves either side of a middle walk, a reading table
  fill(14, 4, 29, 14, '.');
  fill(15, 7, 19, 7, 'K'); fill(23, 7, 27, 7, 'K'); fill(15, 11, 19, 11, 'K'); fill(23, 11, 27, 11, 'K');
  put([[16, 9], [17, 9]], 'T');
  m[13][30] = '.'; m[14][30] = '.'; // from the gallery
  m[3][15] = 'X';  // where the dumbwaiter comes out
  m[3][19] = 'w'; m[3][25] = 'w';
  put([[14, 14]], 'b');
  put([[21, 5], [25, 13], [14, 6]], ',');
  // the study: a desk, a fireplace, two armchairs, under a camera
  fill(31, 4, 37, 11, '.');
  m[5][30] = '.'; m[6][30] = '.'; // from the library
  put([[35, 5], [36, 5]], 'T');
  put([[33, 8], [36, 9]], 'A');
  m[3][32] = 'F'; m[3][36] = 'f';
  put([[31, 11], [37, 10]], ',');
  // the ballroom: four pillars, holes in the old floor, a piano alcove, the door out
  m[7][38] = '.'; m[8][38] = '.'; m[7][39] = '.'; m[8][39] = '.';
  fill(40, 2, 51, 15, '.');
  put([[42, 4], [49, 4], [42, 13], [49, 13]], 'P');
  put([[51, 8], [40, 11], [45, 2], [41, 15]], 'o');
  put([[43, 10], [48, 6], [41, 7], [47, 14]], ',');
  put([[50, 11]], 'b');
  fill(44, 16, 47, 17, '.'); put([[45, 16], [46, 16], [45, 17], [46, 17]], 'G');
  m[1][46] = 'D';
  m[1][42] = 'w'; m[1][50] = 'w'; m[1][44] = 'f'; m[1][48] = 'f';
  return m;
}

export const LEVEL = {
  start: [7, 30],
  // the show's tape marks (checkpoints), tiles: the corridor's mouth, the foot of the gallery, the
  // dumbwaiter hatch at its top, the way into the ballroom
  marks: [[13, 31], [33, 28], [33, 14], [39, 8]],
  // gold left out, tiles: dead ends and risky lines
  gold: [[3, 27], [18, 31], [32, 35], [35, 23], [29, 9], [37, 4], [44, 7], [47, 17]],
  exit: [46, 1],
  workshop: [4, 25],
  radio: [14, 32],
  pile: { tx: 11, ty: 27, tiles: [[11, 26], [12, 26], [11, 27], [12, 27]] },
  // light that falls in: the hole she came through, windows, sconces, the fire
  lights: [
    { x: 7 * T + 8, y: 30 * T, r: 50, a: 0.9 },
    { x: 11 * T + 8, y: 27 * T, r: 20, a: 0.6 },
    { x: 15 * T + 8, y: 30 * T + 6, r: 20, a: 0.8 }, { x: 23 * T + 8, y: 30 * T + 6, r: 20, a: 0.8 },
    { x: 19 * T + 8, y: 5 * T, r: 22, a: 0.6 }, { x: 25 * T + 8, y: 5 * T, r: 22, a: 0.6 },
    { x: 16 * T + 16, y: 9 * T + 6, r: 18, a: 0.8 },
    { x: 32 * T + 8, y: 4 * T + 8, r: 28, a: 0.8 },
    { x: 33 * T + 8, y: 34 * T, r: 16, a: 0.6 },
    { x: 46 * T, y: 17 * T, r: 22, a: 0.6 }
  ],
  // motion sensors sit in the walls: they pulse, and anything moving or making a noise in range
  // trips them
  sensors: [{ x: 18, y: 29, r: 3.3, period: 1.7, window: 0.45, phase: 0 }, { x: 24, y: 33, r: 3.0, period: 1.6, window: 0.4, phase: 0.35 }, { x: 28, y: 29, r: 3.2, period: 1.5, window: 0.4, phase: 0.6 }],
  // the house's lasers across the gallery: dark, then the ports blink (tell), then the beam (on).
  // Each one fires 0.8 s after the one below it, so the beams climb the hall.
  lasers: { x0: 31, x1: 35, period: 2.4, tell: 0.55, on: 0.85, rows: [{ y: 25, phase: 0 }, { y: 21, phase: 0.8 }, { y: 17, phase: 1.6 }] },
  // the dumbwaiter: a pebble dropped in at the hatch clatters out at the library's far end
  dumbwaiter: { hatch: [34, 12], stand: [34, 13], out: [15, 4] },
  // a camera on the study's north wall, sweeping
  camera: { x: 34.5, y: 3.9, base: 90, sweep: 52, period: 5.5, half: 18, range: 8.5 },
  // the patrol robot's loop around the library's east shelves; it goes to look at noises
  robot: { path: [[28, 5], [28, 13], [22, 13], [22, 5]], speed: 2.9, hear: 8, half: 34, range: 4.2 },
  // the chandelier: eyes that turn, chains on three pillars
  chandelier: { x: 46, y: 9, range: 6.5, half: 13, speeds: [36, 48, 62, 76], eyes: [2, 3, 4, 5], chains: [[42, 4], [49, 4], [49, 13]] }
};

const WALLS = new Set(['#', 'D', 'W', 'H', 'X', 'C', 'L', 'f', 's', 'w', 'F']);
const SOLID = new Set([...WALLS, 'o', 'P', 'K', 'T', 'R', 'Q', 'p', 'V', 'A', 'G']);
const OPAQUE = new Set([...WALLS, 'P', 'K', 'A']);
export const isSolid = c => SOLID.has(c);
export const isOpaque = c => OPAQUE.has(c);
export const isWall = c => WALLS.has(c);

// ------------------------------------------------------------------ painting
// floors, by room
function boards(p, P, x, y, r) {
  p.rect(x, y, 16, 16, P.wood);
  for (let j = 0; j < 4; j++) { p.rect(x, y + j * 4, 16, 1, P.wallLo); if (r() < 0.5) p.rect(x + 2 + Math.floor(r() * 10), y + j * 4 + 1, 4, 1, P.woodHi); }
  if (r() < 0.3) p.rect(x + Math.floor(r() * 8), y + Math.floor(r() * 4) * 4 + 1, 6 + Math.floor(r() * 5), 3, P.crack); // a missing board
  for (let i = 0; i < 3; i++) if (r() < 0.6) p.px(x + r() * 16, y + r() * 16, P.dust);
}
function parquet(p, P, x, y, r) {
  // parquet in 8 px blocks, the grain turning block to block; a lost block here and there
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const bx = x + i * 8, by = y + j * 8, flip = (i + j) % 2;
    p.rect(bx, by, 8, 8, P.wood); p.rect(bx, by, 8, 1, P.wallLo); p.rect(bx, by, 1, 8, P.wallLo);
    flip ? p.rect(bx + 4, by + 1, 1, 7, P.wallLo) : p.rect(bx + 1, by + 4, 7, 1, P.wallLo);
    flip ? p.rect(bx + 2, by + 2, 1, 4, P.woodHi) : p.rect(bx + 2, by + 2, 4, 1, P.woodHi);
  }
  if (r() < 0.12) { const bx = x + Math.floor(r() * 2) * 8, by = y + Math.floor(r() * 2) * 8; p.rect(bx + 1, by + 1, 7, 7, P.crack); }
  if (r() < 0.4) p.px(x + r() * 16, y + r() * 16, P.dust);
}
function marble(p, P, x, y, r) {
  p.rect(x, y, 16, 16, (x / 16 + y / 16) % 2 ? P.floor : P.floorHi);
  p.rect(x, y, 16, 1, P.crack); p.rect(x, y, 1, 16, P.crack);
  if (r() < 0.3) { let cx = x + 2 + r() * 12, cy = y + 1; for (let i = 0; i < 14; i++) { p.px(cx, cy + i, P.crack); cx += r() < 0.5 ? -1 : 1; } }
  if (r() < 0.3) p.px(x + r() * 16, y + r() * 16, P.dust);
}
function runner(p, P, x, y, r, row) {
  boards(p, P, x, y, r);
  // a long carpet down the corridor's middle row, gold edged, worn through in places
  if (row === 1) { p.rect(x, y + 1, 16, 14, P.fabric); p.rect(x, y + 1, 16, 1, P.gold); p.rect(x, y + 14, 16, 1, P.gold); p.rect(x, y + 4, 16, 1, P.fabricLo); p.rect(x, y + 11, 16, 1, P.fabricLo); if (r() < 0.3) p.rect(x + r() * 10, y + 5, 5, 6, P.wood); }
}
function debris(p, P, x, y, r) { for (let i = 0; i < 10; i++) p.rect(x + 1 + r() * 13, y + 1 + r() * 13, 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2), r() < 0.5 ? P.rubble : P.rubbleHi); p.px(x + 2 + r() * 12, y + 2 + r() * 12, P.glint); p.px(x + 2 + r() * 12, y + 2 + r() * 12, P.colHi); }
function oldBody(p, P, x, y, r, seed) {
  // older remains in clothes that are not hers; some still wear the glasses
  const cloth = [P.fabric, P.wood, P.sibLo][seed % 3];
  p.rect(x + 1, y + 6, 14, 6, P.crack); p.rect(x + 2, y + 7, 12, 4, P.dust); p.rect(x + 3, y + 7, 7, 3, cloth);
  p.circle(x + 12, y + 8, 2, P.bone); p.rect(x + 1, y + 9, 3, 1, P.bone); p.rect(x + 1, y + 7, 2, 1, P.bone);
  if (seed % 2 === 0) { p.px(x + 12, y + 7, P.overlay); p.px(x + 13, y + 7, P.overlay); }
}

// the wall's face (a wall tile with floor below it shows its lower 10 px), with what hangs on it
function face(p, P, px, py, paper, c, r, x) {
  const top = py + 6;
  p.rect(px, top, T, 10, P.wall);
  if (paper === 'stripe') for (let i = 1; i < 16; i += 4) p.rect(px + i, top + 2, 2, 6, P.wallLo);
  if (paper === 'panel') { p.rect(px + 1, top + 3, 6, 5, P.wallLo); p.rect(px + 9, top + 3, 6, 5, P.wallLo); p.rect(px + 1, top + 3, 6, 1, P.wallHi); p.rect(px + 9, top + 3, 6, 1, P.wallHi); }
  if (paper === 'damask') for (let i = 2; i < 16; i += 5) { p.px(px + i, top + 3, P.goldLo); p.px(px + i + 2, top + 6, P.goldLo); }
  if (paper === 'gilt') { p.rect(px + 7, top + 1, 2, 8, P.goldLo); p.px(px + 7, top + 1, P.gold); }
  if (paper === 'peel') { if (r() < 0.6) p.rect(px + Math.floor(r() * 10), top + 2 + Math.floor(r() * 4), 3 + Math.floor(r() * 4), 2 + Math.floor(r() * 2), P.rubble); for (let i = 1; i < 16; i += 4) p.px(px + i, top + 4, P.wallLo); }
  p.rect(px, top, T, 1, P.goldLo); p.rect(px, top + 8, T, 1, P.wallLo); p.rect(px, top + 9, T, 1, P.crack);
  if (c === 'f') {
    // a portrait in a gold frame: an ash figure, the same face every time
    p.rect(px + 3, py - 1, 10, 13, P.crack); p.rect(px + 4, py, 8, 11, P.gold); p.rect(px + 5, py + 1, 6, 9, P.wallLo);
    p.circle(px + 8, py + 4, 2, P.colLo); p.rect(px + 6, py + 7, 5, 3, P.crack); p.px(px + 4, py, P.goldHi);
  }
  if (c === 's') { p.rect(px + 7, top + 2, 2, 5, P.goldLo); p.rect(px + 6, top + 1, 4, 2, P.gold); p.rect(px + 7, top - 1, 2, 2, P.lamp); }
  if (c === 'w') {
    // a tall window, the Moon's light coming in: panes, a cross bar, a bronze sill
    p.rect(px + 2, py - 2, 12, 15, P.crack); p.rect(px + 3, py - 1, 10, 13, P.glass); p.rect(px + 3, py - 1, 4, 13, P.colLo); p.rect(px + 9, py + 3, 4, 3, P.colLo);
    p.rect(px + 7, py - 1, 2, 13, P.wallLo); p.rect(px + 3, py + 5, 10, 1, P.wallLo); p.rect(px + 1, py + 12, 14, 2, P.wallHi);
  }
  if (c === 'F') {
    // the fireplace: a bone mantel, a black mouth, logs, a fire that is still going
    p.rect(px + 1, py + 2, 14, 14, P.crack); p.rect(px + 2, py + 3, 12, 2, P.colHi); p.rect(px + 2, py + 5, 2, 11, P.col); p.rect(px + 12, py + 5, 2, 11, P.col);
    p.rect(px + 4, py + 5, 8, 11, P.void); p.rect(px + 5, py + 13, 6, 2, P.wood); p.rect(px + 6, py + 10, 4, 3, P.gold); p.rect(px + 7, py + 8, 2, 2, P.lamp); p.px(px + 5, py + 12, P.goldHi);
  }
  if (c === 'C') {
    // a calendar: a page of boxes, every one with the same mark
    p.rect(px + 3, py + 2, 10, 12, P.crack); p.rect(px + 4, py + 3, 8, 10, P.colHi); p.rect(px + 4, py + 3, 8, 2, P.colLo);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) p.px(px + 4 + i * 2, py + 6 + j * 2, P.device);
  }
  if (c === 'H' || c === 'X') {
    // a small hatch with a brass pull; the one in the library hangs open
    p.rect(px + 3, top, 10, 9, P.crack); p.rect(px + 4, top + 1, 8, 7, c === 'X' ? P.void : P.wood);
    if (c === 'H') { p.rect(px + 4, top + 1, 8, 1, P.woodHi); p.rect(px + 7, top + 5, 2, 1, P.gold); } else p.rect(px + 4, top + 7, 8, 1, P.wallHi);
  }
  if (c === 'W') {
    // the workshop door: plain, a strip of light under it
    p.rect(px + 2, py + 1, 12, 15, P.crack); p.rect(px + 3, py + 2, 10, 14, P.wood); p.rect(px + 3, py + 2, 10, 1, P.woodHi); p.rect(px + 4, py + 4, 8, 4, P.wallLo); p.rect(px + 4, py + 9, 8, 5, P.wallLo); p.px(px + 11, py + 10, P.gold); p.rect(px + 4, py + 15, 8, 1, P.lamp);
  }
  if (c === 'D') {
    // the door out of the ballroom: double, gold edged, shut until the chandelier is down
    p.rect(px + 1, py, 14, 16, P.crack); p.rect(px + 2, py + 1, 12, 15, P.wood); p.rect(px + 2, py + 1, 12, 1, P.gold); p.rect(px + 7, py + 1, 2, 15, P.goldLo);
    p.rect(px + 3, py + 3, 3, 10, P.wallLo); p.rect(px + 10, py + 3, 3, 10, P.wallLo); p.px(px + 6, py + 9, P.gold); p.px(px + 9, py + 9, P.gold);
  }
}

// the heap of pebbles where a wall came down: a mound of many small stones, lit from the top left
function heap(p, P, x0, y0) {
  const r = rng(77), cx = x0 + 16, cy = y0 + 18;
  p.ellipse(cx, cy + 3, 15, 9, P.crack);
  p.ellipse(cx, cy + 1, 14, 8, P.rubble);
  const tones = [P.rubble, P.rubbleHi, P.dust, P.colLo, P.col, P.colHi];
  for (let layer = 0; layer < 5; layer++) {
    const rx = 13 - layer * 2.4, ry = 7 - layer * 1.2, lift = layer * 2.2;
    for (let i = 0; i < 26 - layer * 3; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const sx = Math.round(cx + Math.cos(a) * rx * d), sy = Math.round(cy + Math.sin(a) * ry * d - lift);
      const lit = Math.max(0, Math.min(5, layer + (Math.cos(a) < 0 && Math.sin(a) < 0 ? 1 : 0) + Math.floor(r() * 2)));
      const w = r() < 0.35 ? 1 : 2, h = r() < 0.6 ? 1 : 2;
      p.rect(sx, sy + h, w, 1, P.crack); p.rect(sx, sy, w, h, tones[lit]);
    }
  }
  // a few loose ones rolled off the heap
  [[-15, 6], [-13, 9], [14, 8], [-6, 11], [9, 11]].forEach(([dx, dy]) => { p.rect(cx + dx, cy + dy + 1, 2, 1, P.crack); p.rect(cx + dx, cy + dy, 2, 1, P.col); });
}
function piano(p, P, x0, y0) {
  // a grand piano from above, its lid shut under ash: black body, a curve, the keys in bone
  p.rect(x0 + 1, y0 + 2, 30, 24, P.crack);
  p.rect(x0 + 2, y0 + 3, 28, 22, P.glass); p.ellipse(x0 + 22, y0 + 19, 9, 7, P.crack); p.ellipse(x0 + 22, y0 + 18, 8, 6, P.glass);
  p.rect(x0 + 2, y0 + 3, 28, 1, P.device); p.rect(x0 + 4, y0 + 6, 18, 1, P.device);
  p.rect(x0 + 2, y0 + 25, 22, 4, P.crack); p.rect(x0 + 3, y0 + 25, 20, 3, P.colHi);
  for (let i = 4; i < 23; i += 3) p.rect(x0 + i, y0 + 25, 1, 2, P.crack);
  for (let i = 0; i < 9; i++) p.px(x0 + 6 + i * 2.5, y0 + 10 + (i % 3) * 4, P.dust);
  p.rect(x0 + 10, y0 + 29, 6, 3, P.crack); p.rect(x0 + 11, y0 + 29, 4, 2, P.wood); // the stool
}

export function paintMap(P, m) {
  const p = new Painter(W * T, H * T), r = rng(31);
  // floors first, everywhere that is not wall (under furniture too)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = m[y][x], px = x * T, py = y * T;
    if (WALLS.has(c)) continue;
    const rm = roomAt(x, y), fl = rm ? rm.floor : 'parquet';
    if (fl === 'marble') marble(p, P, px, py, r);
    else if (fl === 'runner') runner(p, P, px, py, r, y - rm.y0);
    else if (fl === 'boards') boards(p, P, px, py, r);
    else parquet(p, P, px, py, r);
  }
  // the study's rug and the ballroom's dance floor inlay
  p.rect(32 * T + 4, 6 * T + 4, 5 * T - 8, 5 * T - 4, P.fabric); p.rect(32 * T + 6, 6 * T + 6, 5 * T - 12, 5 * T - 8, P.fabricLo); p.rect(32 * T + 8, 6 * T + 8, 5 * T - 16, 5 * T - 12, P.fabric);
  for (let i = 0; i < 6; i++) p.px(32 * T + 10 + i * 12, 6 * T + 5, P.gold);
  p.rect(43 * T + 8, 6 * T + 8, 5 * T, 1, P.goldLo); p.rect(43 * T + 8, 11 * T + 8, 5 * T, 1, P.goldLo); p.rect(43 * T + 8, 6 * T + 8, 1, 5 * T, P.goldLo); p.rect(48 * T + 8, 6 * T + 8, 1, 5 * T, P.goldLo);
  // walls: a dark top with a lit edge where it meets a room; a face where a room lies below it
  const wallAt = (x, y) => x < 0 || y < 0 || x >= W || y >= H || WALLS.has(m[y][x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = m[y][x], px = x * T, py = y * T;
    if (!WALLS.has(c)) continue;
    const below = !wallAt(x, y + 1), rm = below ? roomAt(x, y + 1) : null;
    // deep inside the walls: nothing to draw, it stays black
    let edge = false; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (!wallAt(x + i, y + j)) edge = true;
    if (!edge) { p.rect(px, py, T, T, P.crack); continue; }
    p.rect(px, py, T, below ? 6 : T, P.wallLo);
    if (r() < 0.25) p.px(px + r() * 16, py + r() * (below ? 5 : 16), P.wall);
    // the cap's lit edge on each side that meets a room, and a gold trim inside the gallery
    if (!wallAt(x - 1, y)) { p.rect(px, py, 1, below ? 6 : T, P.wall); if (roomAt(x - 1, y) && roomAt(x - 1, y).id === 'gallery') p.rect(px + 1, py, 1, T, P.goldLo); }
    if (!wallAt(x + 1, y)) { p.rect(px + T - 1, py, 1, below ? 6 : T, P.wall); if (roomAt(x + 1, y) && roomAt(x + 1, y).id === 'gallery') p.rect(px + T - 2, py, 1, T, P.goldLo); }
    if (!wallAt(x, y - 1)) p.rect(px, py, T, 1, P.wall);
    if (below) face(p, P, px, py, rm ? rm.paper : 'stripe', c, r, x);
    if (c === 'L') {
      // a laser port in the gallery's wall: a grey box with its dark lens toward the hall
      const right = !wallAt(x - 1, y), lx = right ? px : px + T - 6;
      p.rect(lx, py + 4, 6, 9, P.crack); p.rect(lx + 1, py + 5, 4, 7, P.device); p.rect(right ? lx : lx + 4, py + 7, 2, 3, P.void);
    }
  }
  // what stands on the floors
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = m[y][x], px = x * T, py = y * T;
    if (c === ',') debris(p, P, px, py, r);
    if (c === 'b') oldBody(p, P, px, py, r, x + y);
    if (c === 'o') { p.rect(px + 1, py + 1, 14, 14, P.void); p.rect(px + 1, py + 1, 14, 2, P.crack); for (let i = 0; i < 7; i++) p.rect(px + r() * 13, py + (i % 2 ? 0 : 13), 3, 2, P.rubble); }
    if (c === 'R') { p.ellipse(px + 8, py + 11, 7, 4, P.crack); p.ellipse(px + 8, py + 9, 7, 5, P.rubble); for (let i = 0; i < 7; i++) p.rect(px + 2 + r() * 11, py + 4 + r() * 8, 3, 2, r() < 0.5 ? P.rubbleHi : P.crack); p.rect(px + 4, py + 6, 6, 1, P.wood); }
    if (c === 'K') {
      // a bookshelf from above: the top board, the spines along its front
      p.rect(px, py, T, 15, P.crack); p.rect(px, py + 1, T, 7, P.wood); p.rect(px, py + 1, T, 1, P.woodHi);
      for (let i = 1; i < 15; i += 2) p.rect(px + i, py + 8, 1, 6, [P.fabric, P.col, P.gold, P.fabricLo, P.colLo, P.wallLo][(i + x * 3) % 6]);
      if ((x + y) % 4 === 0) p.rect(px + 5, py + 8, 4, 6, P.void); // a gap where books are missing
    }
    if (c === 'T') {
      const left = m[y][x - 1] !== 'T', right = m[y][x + 1] !== 'T';
      p.rect(px + (left ? 1 : 0), py + 3, T - (left ? 1 : 0) - (right ? 1 : 0), 11, P.crack); p.rect(px + (left ? 2 : 0), py + 4, T - (left ? 2 : 0) - (right ? 2 : 0), 8, P.wood); p.rect(px + (left ? 2 : 0), py + 4, T - (left ? 2 : 0) - (right ? 2 : 0), 1, P.woodHi);
      if (left) { p.rect(px + 4, py + 6, 7, 5, P.colHi); p.rect(px + 5, py + 7, 5, 1, P.device); p.rect(px + 5, py + 9, 3, 1, P.overlay); } // papers (the map, its red line)
      else { p.rect(px + 7, py + 3, 3, 3, P.gold); p.rect(px + 8, py + 6, 1, 4, P.goldLo); p.px(px + 8, py + 4, P.lamp); } // a lamp
    }
    if (c === 'P') { p.circle(px + 8, py + 10, 8, P.crack); p.circle(px + 8, py + 9, 7, P.colLo); p.circle(px + 8, py + 8, 6, P.col); p.circle(px + 7, py + 7, 3, P.colHi); p.rect(px + 3, py + 8, 10, 1, P.goldLo); }
    if (c === 'V') {
      // a bust of the owner on a bone plinth, gilded
      p.rect(px + 2, py + 4, 12, 12, P.crack); p.rect(px + 3, py + 5, 10, 10, P.col); p.rect(px + 3, py + 5, 10, 1, P.colHi);
      p.rect(px + 5, py + 6, 6, 4, P.goldLo); p.circle(px + 8, py + 5, 3, P.gold); p.px(px + 7, py + 3, P.goldHi);
    }
    if (c === 'A') {
      // an armchair from above: a tall back to the north, arms, a seat
      p.rect(px + 1, py + 1, 14, 15, P.crack); p.rect(px + 2, py + 2, 12, 5, P.fabric); p.rect(px + 2, py + 2, 12, 1, P.gold);
      p.rect(px + 2, py + 7, 3, 8, P.wood); p.rect(px + 11, py + 7, 3, 8, P.wood); p.rect(px + 5, py + 7, 6, 7, P.fabricLo);
    }
    if (c === 'Q') {
      // a transistor radio, its aerial up: bone case, a grille, one red light
      p.rect(px + 2, py + 6, 12, 8, P.crack); p.rect(px + 3, py + 7, 10, 6, P.colHi); p.rect(px + 3, py + 12, 10, 1, P.colLo);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) p.px(px + 4 + i * 2, py + 8 + j * 2, P.device);
      p.rect(px + 11, py + 8, 1, 2, P.goldLo); p.line(px + 12, py + 6, px + 15, py + 1, P.colLo); p.px(px + 12, py + 11, P.overlay);
    }
  }
  heap(p, P, LEVEL.pile.tiles[0][0] * T, LEVEL.pile.tiles[0][1] * T);
  piano(p, P, 45 * T, 16 * T);
  return p;
}

// The wing at night: the same picture in greys, every color stepped down the palette (no alpha,
// no blend), so the floor plan reads in the dark and only the light is warm (the look's rule:
// warm light is wealth).
const NIGHT = {
  [ASH.ash0]: '#000000', [ASH.ash1]: ASH.ash0, [ASH.ash2]: ASH.ash1, [ASH.ash3]: ASH.ash1, [ASH.ash4]: ASH.ash2, [ASH.ash5]: ASH.ash2,
  [ASH.bone]: ASH.ash3, [ASH.boneLo]: ASH.ash2, [ASH.bronzeLo]: ASH.ash0, [ASH.bronze]: ASH.ash1, [ASH.bronzeHi]: ASH.ash2,
  [ASH.goldLo]: ASH.ash1, [ASH.gold]: ASH.ash2, [ASH.goldHi]: ASH.ash3, [ASH.lit]: ASH.ash3, [ASH.red]: ASH.red, [ASH.redHi]: ASH.red
};
export function nightCanvas(src) {
  const w = src.width, h = src.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, w, h), d = img.data, map = new Map();
  const key = (r, g, b) => (r << 16) | (g << 8) | b, num = hex => parseInt(hex.slice(1), 16);
  Object.entries(NIGHT).forEach(([a, b]) => map.set(num(a), num(b)));
  for (let i = 0; i < d.length; i += 4) {
    const k = key(d[i], d[i + 1], d[i + 2]), v = map.has(k) ? map.get(k) : 0;
    d[i] = v >> 16; d[i + 1] = (v >> 8) & 255; d[i + 2] = v & 255; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
