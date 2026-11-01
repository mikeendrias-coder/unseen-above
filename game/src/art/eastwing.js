// Episode 3, the east wing, from above: where she lands after the fall, a corridor of motion
// sensors, a study with a patrol robot and a camera, and a ballroom under a chandelier full of
// eyes. Built as a character map so the rooms are easy to change.
import { Painter, rng } from './painter.js';

export const T = 16, W = 45, H = 30;
// '#' wall  '.' floor  ',' debris (noisy)  'o' hole  'P' pillar  'K' bookshelf  'T' desk
// 'R' rubble  'm' marble  'r' rug  'D' the exit door  'W' a side door (optional)  'b' an old body  'p' loose pebbles
export function buildMap() {
  const m = Array.from({ length: H }, () => new Array(W).fill('#'));
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y][x] = c; };
  const put = (list, c) => list.forEach(([x, y]) => { m[y][x] = c; });
  // A: the landing, under the hole she fell through
  fill(1, 19, 11, 28, '.');
  put([[2, 19], [3, 19], [11, 28], [10, 28], [1, 28]], 'R');
  put([[5, 23], [7, 23], [6, 25], [4, 25], [8, 26], [5, 26], [7, 27]], ',');
  put([[2, 27], [10, 20]], 'b'); put([[9, 21]], 'p');
  // B: the sensor corridor, east then north
  fill(12, 21, 26, 23, '.'); fill(24, 12, 26, 20, '.');
  put([[14, 22], [19, 21], [21, 23], [25, 18], [24, 14], [16, 23]], ',');
  put([[20, 22]], 'b');
  // C: the study: two long shelves, a short one, a desk, a rug
  fill(15, 2, 27, 11, '.');
  fill(18, 5, 23, 7, 'r');
  fill(17, 4, 21, 4, 'K'); fill(17, 8, 21, 8, 'K'); fill(23, 6, 24, 6, 'K');
  fill(25, 3, 26, 3, 'T');
  put([[16, 10], [20, 10], [22, 2], [26, 9], [19, 6]], ',');
  put([[16, 3]], 'b');
  // the way from the study to the ballroom
  fill(28, 6, 30, 7, '.');
  // D: the ballroom, four pillars, holes in the old floor
  fill(31, 2, 43, 12, 'm');
  put([[33, 4], [41, 4], [33, 10], [41, 10]], 'P');
  put([[31, 12], [43, 2], [42, 12]], 'o');
  put([[35, 11], [39, 3], [32, 7], [42, 8]], ',');
  put([[38, 11]], 'b');
  m[1][37] = 'D';
  m[18][4] = 'W'; // a workshop off the landing, optional
  return m;
}

export const LEVEL = {
  start: [6, 24],
  exit: [37, 1],
  moon: [{ x: 6 * T + 8, y: 24 * T + 8, r: 46 }, { x: 25 * T, y: 16 * T, r: 20 }],
  // motion sensors sit in the walls: they pulse, and anything moving in range trips them
  sensors: [{ x: 17, y: 20, r: 3.3, period: 1.7, window: 0.45, phase: 0 }, { x: 27, y: 15, r: 3.3, period: 1.5, window: 0.4, phase: 0.6 }],
  // a camera on the study's north wall, sweeping
  camera: { x: 19.5, y: 1.9, base: 90, sweep: 48, period: 5.5, half: 18, range: 8.5 },
  // the patrol robot's loop around the shelves; it goes to look at noises
  robot: { path: [[16, 6], [16, 10], [26, 10], [26, 5], [22, 5]], speed: 2.6, hear: 7, half: 34, range: 4.2 },
  // the chandelier: eyes that turn, chains on three pillars
  chandelier: { x: 37.5, y: 7.5, range: 6.5, half: 13, speeds: [36, 48, 62, 76], eyes: [2, 3, 4, 5], chains: [[33, 4], [41, 4], [41, 10]] }
};

const SOLID = new Set(['#', 'o', 'P', 'K', 'T', 'R', 'D', 'W']), OPAQUE = new Set(['#', 'P', 'K', 'D', 'W']);
export const isSolid = c => SOLID.has(c);
export const isOpaque = c => OPAQUE.has(c);

// ------------------------------------------------------------------ painting
function parquet(p, P, x, y, r) {
  p.rect(x, y, 16, 16, P.wood);
  for (let j = 0; j < 4; j++) { p.rect(x, y + j * 4, 16, 1, P.woodHi); p.rect(x + ((j * 5 + x / 2) % 12) + 2, y + j * 4 + 1, 1, 3, P.crack); }
  if (r() < 0.22) p.rect(x + Math.floor(r() * 8), y + Math.floor(r() * 3) * 4, 6 + Math.floor(r() * 5), 4, P.crack); // a missing board
  if (r() < 0.5) p.px(x + r() * 16, y + r() * 16, P.dust);
}
function marble(p, P, x, y, r) {
  p.rect(x, y, 16, 16, (x / 16 + y / 16) % 2 ? P.floor : P.floorHi);
  if (r() < 0.3) { let cx = x + r() * 16, cy = y; for (let i = 0; i < 16; i++) { p.px(cx, cy + i, P.crack); cx += r() < 0.5 ? -1 : 1; } }
}
function debris(p, P, x, y, r) { for (let i = 0; i < 9; i++) p.rect(x + r() * 14, y + r() * 14, 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2), r() < 0.5 ? P.rubble : P.rubbleHi); if (r() < 0.6) p.px(x + 2 + r() * 12, y + 2 + r() * 12, P.glint); }
function oldBody(p, P, x, y, r, seed) {
  // older remains in clothes that are not hers; some still wear the glasses
  const cloth = [P.fabric, P.wood, P.sibLo][seed % 3];
  p.rect(x + 2, y + 6, 12, 5, P.dust); p.rect(x + 3, y + 7, 7, 3, cloth); p.circle(x + 12, y + 8, 2, P.bone); p.rect(x + 1, y + 9, 3, 1, P.bone); p.rect(x + 1, y + 7, 2, 1, P.bone);
  if (seed % 2 === 0) { p.px(x + 12, y + 7, P.overlay); p.px(x + 13, y + 7, P.overlay); }
}

export function paintMap(P, m) {
  const p = new Painter(W * T, H * T), r = rng(31);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = m[y][x], px = x * T, py = y * T, below = y + 1 < H ? m[y + 1][x] : '#';
    if (c === '#' || c === 'D' || c === 'W') {
      p.rect(px, py, T, T, P.void); p.rect(px, py, T, T, P.wallLo);
      if (below !== '#' && below !== 'D' && below !== 'W') { p.rect(px, py + 8, T, 8, P.wall); p.rect(px, py + 8, T, 1, P.goldLo); for (let i = 2; i < 16; i += 5) p.rect(px + i, py + 10, 1, 5, P.wallLine); }
      else if (r() < 0.3) p.px(px + r() * 16, py + r() * 16, P.wallLine);
      continue;
    }
    if (c === 'm' || (c === 'P' || c === 'o') && x > 30) marble(p, P, px, py, r); else parquet(p, P, px, py, r);
    if (c === 'r') { p.rect(px, py, T, T, P.fabric); p.rect(px, py + 7, T, 2, P.fabricLo); if (r() < 0.3) p.rect(px + r() * 10, py + r() * 10, 5, 4, P.wood); }
    if (c === ',') debris(p, P, px, py, r);
    if (c === 'b') oldBody(p, P, px, py, r, x + y);
    if (c === 'p') { for (let i = 0; i < 7; i++) p.rect(px + 4 + r() * 8, py + 6 + r() * 6, 2, 2, i % 2 ? P.rubbleHi : P.col); }
    if (c === 'o') { p.rect(px + 1, py + 1, 14, 14, P.void); for (let i = 0; i < 8; i++) p.rect(px + r() * 13, py + (i % 2 ? 0 : 13), 3, 2, P.rubble); }
    if (c === 'R') { p.ellipse(px + 8, py + 10, 7, 5, P.rubble); for (let i = 0; i < 6; i++) p.rect(px + 2 + r() * 11, py + 4 + r() * 9, 3, 2, r() < 0.5 ? P.rubbleHi : P.crack); }
    if (c === 'K') { p.rect(px, py + 2, T, 12, P.wood); p.rect(px, py + 2, T, 1, P.woodHi); for (let i = 1; i < 15; i += 2) p.rect(px + i, py + 4, 1, 8, [P.fabric, P.glass, P.gold, P.fabricLo, P.col][(i + x) % 5]); p.rect(px, py + 13, T, 1, P.crack); }
    if (c === 'T') { p.rect(px, py + 3, T, 10, P.wood); p.rect(px, py + 3, T, 1, P.woodHi); p.rect(px + 3, py + 5, 6, 4, P.colHi); p.rect(px + 4, py + 6, 4, 1, P.device); }
    if (c === 'P') { p.circle(px + 8, py + 9, 7, P.colLo); p.circle(px + 8, py + 8, 6, P.col); p.circle(px + 7, py + 7, 3, P.colHi); p.ellipse(px + 8, py + 15, 6, 1, P.void); }
  }
  // the workshop door off the landing: plain, a strip of light under it
  p.rect(4 * T + 3, 18 * T + 6, 10, 10, P.wood); p.rect(4 * T + 3, 18 * T + 6, 10, 1, P.woodHi); p.px(4 * T + 11, 18 * T + 11, P.gold); p.glowRect(4 * T + 3, 18 * T + 15, 10, 1, P.lamp, 0.5);
  // the door out of the ballroom
  const [ex, ey] = LEVEL.exit; p.rect(ex * T + 2, ey * T + 4, 12, 12, P.wood); p.rect(ex * T + 2, ey * T + 4, 12, 1, P.woodHi); p.rect(ex * T + 7, ey * T + 4, 1, 12, P.goldLo); p.px(ex * T + 10, ey * T + 11, P.gold);
  return p;
}
