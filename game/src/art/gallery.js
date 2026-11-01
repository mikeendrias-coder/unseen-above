// Episode 2, the gallery: inside the front door, from a pristine hall into the worn middle.
// Glasses wait in a drawer; a ceiling camera sweeps the corridor; a broken camera twitches over
// the worn rooms under a hole in the roof; a laser wakes up in the last hall before the next door.
import { Painter, rng } from './painter.js';

export const TILE = 16, GROUND = 160;
export const LEVEL = {
  w: 88, h: 12,
  start: { x: 2 * TILE, y: GROUND - 14 },
  door: { x: 85 * TILE - 2, y: GROUND - 32, w: 20, h: 32 },
  // a sideboard with two drawers; the glasses are in the left one, and only E finds them
  cabinet: { x0: 14 * TILE, x1: 17 * TILE, top: 9 * TILE, drawer: { x: 14 * TILE + 5, y: 147, w: 17, h: 5 } },
  staffDoor: { x: 8 * TILE + 2, y: GROUND - 28, w: 14, h: 28 },
  // a chandelier in the corridor that drops when she passes under it
  dropper: { x: 43 * TILE, hang: 52, warn: 0.45, footprint: 14 },
  // low debris she bumps into, jumps over and can hide behind (x, y, w, h)
  props: [
    { id: 'drums', x: 46 * TILE, y: 152, w: 18, h: 8 },
    { id: 'old chandelier', x: 55 * TILE - 13, y: 153, w: 26, h: 7 },
    { id: 'dead robot', x: 59 * TILE - 6, y: 151, w: 13, h: 9 }
  ],
  robot: { x0: 3 * TILE, x1: 13 * TILE, speed: 16 },
  camLock: 0.55, // cameras take a little longer than lamps to lock on
  cameras: [
    // sweep: a smooth pan between two angles (degrees, y down)
    { id: 'corridor camera', kind: 'sweep', x: 31 * TILE + 8, y: 19, a0: 62, a1: 118, period: 5.0, phase: 0.75, half: 14, range: 200 },
    // step: a broken servo that jumps between aims and holds each one. Between sweeps it turns
    // up to the hole in the roof and stares at the Moon.
    { id: 'broken camera', kind: 'step', x: 62 * TILE + 8, y: 36, half: 12, range: 220,
      steps: [[205, 2.0], [150, 0.8], [130, 0.8], [110, 1.0], [130, 0.7], [150, 0.7]] }
  ],
  // The laser: shots are sets of beam heights. "low" must be jumped, "high" must be crouched under.
  laser: {
    id: 'laser', x0: 65 * TILE, x1: 87 * TILE,
    shots: { low: [156], high: [128, 149] },
    order: ['low', 'high', 'low', 'low', 'high', 'low', 'high', 'high'],
    first: 1.2, idle: 0.9, tell: 0.7, charge: 0.5, fire: 0.4
  },
  hole: { x0: 56 * TILE, x1: 61 * TILE }
};

// Where a camera points t seconds into the take. The broken one snaps to each aim, then holds.
export function camAngle(c, t) {
  if (c.kind === 'sweep') { const s = (Math.sin((t / c.period + c.phase) * Math.PI * 2) + 1) / 2; return c.a0 + (c.a1 - c.a0) * s; }
  const cyc = c.steps.reduce((a, s) => a + s[1], 0); let u = ((t % cyc) + cyc) % cyc, i = 0;
  while (u >= c.steps[i][1]) { u -= c.steps[i][1]; i++; }
  const prev = c.steps[(i + c.steps.length - 1) % c.steps.length][0], cur = c.steps[i][0], snap = 0.1;
  return u < snap ? prev + (cur - prev) * (u / snap) : cur;
}
// The laser u seconds after it wakes: the shot in play and its phase.
export function laserAt(L, u) {
  if (u < L.first) return { phase: 'idle', shot: L.order[0], n: -1, f: u };
  const cyc = L.tell + L.charge + L.fire + L.idle, v = u - L.first, n = Math.floor(v / cyc), f = v - n * cyc;
  const phase = f < L.tell ? 'tell' : f < L.tell + L.charge ? 'charge' : f < L.tell + L.charge + L.fire ? 'fire' : 'idle';
  return { phase, shot: L.order[n % L.order.length], n, f };
}
// Does a box touch a beam at height y? Beams are 2 px tall.
export const beamHits = (top, bottom, y) => top < y + 1 && bottom > y - 1;

export function buildMap() {
  const W = LEVEL.w, H = LEVEL.h, m = [];
  for (let y = 0; y < H; y++) m.push(new Array(W).fill(0));
  const solid = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y] && x >= 0 && x < W) m[y][x] = 1; };
  solid(0, 10, W - 1, 11);            // floor
  solid(0, 0, W - 1, 0);              // ceiling
  for (let x = 56; x <= 60; x++) m[0][x] = 0; // the hole in the roof
  solid(0, 0, 0, 9);                  // the front door behind her
  solid(14, 9, 16, 9);                // sideboard
  solid(30, 8, 32, 8);                // desk top (room to stand under it)
  solid(38, 9, 38, 9);                // cabinet
  solid(48, 8, 48, 9);                // snapped column
  solid(53, 9, 53, 9); solid(61, 9, 62, 9); // rubble
  solid(87, 0, 87, 9);                // end wall with the laser ports
  return { W, H, m };
}

function glint(p, P, x, y) { p.px(x, y, P.glint); p.px(x - 1, y, P.goldHi); p.px(x + 1, y, P.goldHi); p.px(x, y - 1, P.goldHi); p.px(x, y + 1, P.goldHi); p.mark('glint', x, y); }
function portrait(p, P, x, y, w, h, seed) {
  p.rect(x - 2, y - 2, w + 4, h + 4, P.goldLo); p.rect(x - 1, y - 1, w + 2, h + 2, P.gold); p.rect(x, y, w, h, P.wallLo);
  const r = rng(seed);
  p.rect(x + 1, y + 1, w - 2, Math.round(h * 0.55), r() < 0.5 ? P.glass : P.skyLow);
  p.circle(Math.round(x + w / 2), Math.round(y + h * 0.4), Math.max(2, Math.round(w * 0.16)), P.kidLo);
  p.rect(Math.round(x + w * 0.22), Math.round(y + h * 0.58), Math.round(w * 0.56), Math.round(h * 0.42) - 1, r() < 0.5 ? P.fabric : P.wood);
  p.rect(Math.round(x + w / 2) - 1, Math.round(y + h * 0.6), 2, 4, P.goldHi); // a medal, a brooch
  glint(p, P, x - 1, y - 1);
}
function chandelier(p, P, x, y) {
  p.rect(x, 16, 1, y - 18, P.goldLo); p.ellipse(x, y, 11, 2, P.gold); p.rect(x - 13, y - 1, 27, 1, P.goldHi);
  for (let i = -10; i <= 10; i += 2) { p.px(x + i, y + 3 + (Math.abs(i) % 4 === 0 ? 1 : 0), P.glint); p.px(x + i, y + 5, P.glassLit); }
  for (let i = -8; i <= 8; i += 4) p.rect(x + i, y - 5, 1, 4, P.lamp);
  p.softGlow(x, y + 2, 30, P.lamp, 0.16); p.mark('glint', x, y + 4); p.mark('glint', x - 8, y + 5); p.mark('glint', x + 8, y + 5);
}
function sconce(p, P, x, y, lit) { p.rect(x - 1, y, 3, 6, P.goldLo); p.rect(x - 2, y - 3, 5, 3, lit ? P.lamp : P.device); if (lit) { p.softGlow(x, y - 2, 16, P.lamp, 0.14); p.mark('sconce', x, y - 2); } else p.px(x, y - 4, P.crack); }
function crack(p, c, x, y, len, seed, dir) { const r = rng(seed); let cx = x, cy = y; for (let i = 0; i < len; i++) { p.px(cx, cy, c); cy += 1; cx += (r() < 0.5 ? -1 : 1) * (r() < 0.6 ? 1 : 0) + (dir || 0) * (r() < 0.3 ? 1 : 0); if (r() < 0.12) p.px(cx + 1, cy, c); } }
function rubble(p, P, x, y, w, seed) {
  const r = rng(seed);
  p.poly([[x - 2, y], [x + 2, y - 12], [x + w * 0.5, y - 16], [x + w - 2, y - 11], [x + w + 2, y]], P.rubble);
  for (let i = 0; i < w * 1.2; i++) { const px = x + r() * w, h = 1 + Math.floor(r() * 4), ww = 2 + Math.floor(r() * 5), py = y - 2 - r() * 13; p.rect(px, py, ww, h, r() < 0.4 ? P.rubbleHi : P.crack); }
  for (let i = 0; i < 4; i++) p.rect(x + r() * w, y - 1 - r() * 3, 6, 2, P.col);
}
function camMount(p, P, x, y, wall) {
  if (wall) { p.rect(x + 3, y - 2, 6, 3, P.device); p.rect(x + 8, y - 6, 3, 10, P.device); }
  else { p.rect(x - 1, 16, 3, y - 18, P.device); p.rect(x - 4, 16, 9, 2, P.device); }
}

export function paintLevel(P) {
  const W = LEVEL.w * TILE, G = GROUND, p = new Painter(W, 180);
  const r = rng(77);
  // wall, pilasters, cornice, wainscot
  p.rect(0, 0, W, G, P.wall);
  for (let x = 0; x < 64 * TILE; x += 32) { p.rect(x + 13, 22, 6, 114, P.wallHi); p.rect(x + 15, 22, 1, 114, P.wallLine); p.rect(x + 12, 22, 8, 2, P.goldLo); p.rect(x + 12, 134, 8, 2, P.goldLo); }
  p.rect(0, 16, W, 6, P.colHi); p.rect(0, 16, W, 1, P.gold); p.rect(0, 21, W, 1, P.goldLo);
  for (let x = 2; x < 64 * TILE; x += 6) p.rect(x, 18, 2, 2, P.gold);
  p.rect(0, 136, W, 24, P.wallLo); p.rect(0, 136, W, 1, P.goldLo); for (let x = 8; x < 64 * TILE; x += 32) { p.rect(x, 140, 20, 16, P.wallLine); p.rect(x + 1, 141, 18, 1, P.wallHi); }
  // ceiling coffers
  p.rect(0, 0, W, 16, P.wallLo); for (let x = 0; x < W; x += 16) { p.rect(x + 2, 3, 12, 9, P.wallLine); p.px(x + 8, 7, P.goldLo); }
  // floor: marble checker, a runner that wears out toward the back
  for (let x = 0; x < W; x += 16) for (let y = G; y < 180; y += 10) p.rect(x, y, 16, 10, ((x / 16 + (y - G) / 10) % 2) ? P.floor : P.floorHi);
  p.rect(0, G, W, 1, P.colHi);
  p.rect(16, 166, 46 * TILE, 6, P.fabric); p.rect(16, 166, 46 * TILE, 1, P.goldLo); p.rect(16, 171, 46 * TILE, 1, P.goldLo);
  // the runner goes on, torn: scraps with their gold edges, the floor showing through
  for (let x = 47 * TILE; x < 55 * TILE; x += 10 + Math.floor(r() * 10)) { const w = 6 + Math.floor(r() * 12); p.rect(x, 166, w, 6, P.fabric); p.rect(x, 166, w, 1, P.goldLo); if (r() < 0.6) p.rect(x, 171, w, 1, P.goldLo); p.px(x + w, 167 + Math.floor(r() * 4), P.fabric); }

  // the front door she came in by, seen from inside
  p.rect(0, 112, 18, 48, P.goldLo); p.rect(0, 116, 15, 44, P.wood); p.rect(3, 120, 8, 14, P.woodHi); p.rect(3, 140, 8, 14, P.woodHi); p.px(12, 138, P.gold);
  p.glowRect(0, 158, 22, 2, P.lamp, 0.12);
  // ---- the pristine hall: chandeliers, portraits, a staff door, the sideboard with the drawer
  chandelier(p, P, 7 * TILE, 50); chandelier(p, P, 22 * TILE, 50);
  portrait(p, P, 3 * TILE + 4, 58, 26, 34, 1); portrait(p, P, 10 * TILE + 6, 50, 32, 44, 2); portrait(p, P, 18 * TILE + 6, 58, 26, 34, 3); portrait(p, P, 25 * TILE, 58, 26, 34, 6);
  const SD = LEVEL.staffDoor;
  p.rect(SD.x - 2, SD.y - 2, SD.w + 4, SD.h + 2, P.wallLine); p.rect(SD.x, SD.y, SD.w, SD.h, P.wallLo); p.rect(SD.x + 1, SD.y + 1, SD.w - 2, SD.h - 1, P.wall);
  p.rect(SD.x + SD.w - 4, SD.y + 14, 2, 2, P.goldLo); p.rect(SD.x + 2, SD.y + 4, SD.w - 4, 4, P.colLo); p.rect(SD.x + 3, SD.y + 5, SD.w - 6, 2, P.device);
  const CB = LEVEL.cabinet, cx = CB.x0;
  p.rect(cx - 1, 144, 50, 3, P.woodHi); p.rect(cx - 1, 144, 50, 1, P.goldHi);
  p.rect(cx, 147, 48, 10, P.wood); p.rect(cx, 157, 48, 1, P.goldLo);
  [[cx + 5, 17], [cx + 26, 17]].forEach(([dx, dw]) => { p.rect(dx, 147, dw, 5, P.woodHi); p.rect(dx, 151, dw, 1, P.goldLo); p.rect(dx + Math.floor(dw / 2) - 1, 149, 2, 1, P.gold); });
  p.rect(cx + 2, 153, 44, 3, P.wood); p.rect(cx + 3, 154, 42, 1, P.goldLo);
  [cx + 1, cx + 45].forEach(x => { p.rect(x, 158, 2, 2, P.gold); });
  p.rect(cx + 34, 134, 6, 10, P.col); p.rect(cx + 35, 132, 4, 2, P.colHi); p.rect(cx + 33, 128, 2, 4, P.fabric); p.rect(cx + 38, 127, 2, 5, P.fabric); // a vase of flowers
  p.rect(cx + 8, 137, 9, 7, P.goldLo); p.rect(cx + 9, 138, 7, 5, P.skyLow); p.px(cx + 12, 140, P.kidLo); // a small framed photo
  // ---- the corridor: sconces, a desk you can stand under, a cabinet
  sconce(p, P, 28 * TILE, 72, true); sconce(p, P, 36 * TILE, 72, true); sconce(p, P, 44 * TILE, 72, true);
  portrait(p, P, 33 * TILE, 58, 24, 32, 4); portrait(p, P, 40 * TILE, 58, 24, 32, 5);
  p.rect(30 * TILE, 128, 48, 5, P.wood); p.rect(30 * TILE, 128, 48, 1, P.woodHi); p.rect(30 * TILE + 2, 133, 44, 4, P.wood); p.rect(30 * TILE + 2, 137, 44, 1, P.goldLo);
  [30 * TILE + 2, 33 * TILE - 4].forEach(x => p.rect(x, 138, 2, 22, P.wood));
  p.rect(31 * TILE + 4, 121, 7, 7, P.glassLit); p.rect(31 * TILE + 7, 117, 1, 4, P.goldLo); p.softGlow(31 * TILE + 7, 124, 10, P.lamp, 0.12);
  p.rect(38 * TILE, 144, 16, 16, P.wood); p.rect(38 * TILE, 144, 16, 1, P.woodHi); p.rect(38 * TILE + 2, 147, 12, 1, P.goldLo); p.rect(38 * TILE + 5, 136, 6, 8, P.col); p.rect(38 * TILE + 6, 134, 4, 2, P.colHi);
  // ---- the worn middle: stains, cracks, a missing portrait, a fallen one, a snapped column
  for (let i = 0; i < 34; i++) { const x = 44 * TILE + r() * 20 * TILE, y = 24 + r() * 108, k = Math.min(1, Math.max(0, (x - 44 * TILE) / (14 * TILE))); if (r() < 0.25 + k * 0.75) p.rect(x, y, 4 + r() * 18, 3 + r() * 14, r() < 0.5 ? P.wallLo : P.wallLine); }
  for (let i = 0; i < 12; i++) crack(p, P.crack, 45 * TILE + i * 30 + r() * 10, 23 + r() * 20, 40 + r() * 70, 9 + i, i % 2 ? 1 : -1);
  p.rect(46 * TILE, 56, 28, 36, P.wallHi); p.rect(46 * TILE + 2, 58, 24, 32, P.wall); p.px(46 * TILE + 14, 54, P.goldLo); // where a portrait hung
  p.poly([[50 * TILE + 4, G], [50 * TILE + 12, G - 34], [51 * TILE + 18, G - 30], [51 * TILE + 12, G]], P.goldLo);
  p.poly([[50 * TILE + 7, G - 1], [50 * TILE + 14, G - 31], [51 * TILE + 15, G - 28], [51 * TILE + 9, G - 1]], P.wallLo);
  for (let i = 0; i < 5; i++) p.px(50 * TILE + 14 + i * 3, G - 20 + i * 2, P.crack);
  // snapped column: a stub you can climb, its drums on the floor
  p.rect(48 * TILE, 128, 16, 32, P.col); p.rect(48 * TILE + 2, 128, 1, 32, P.colHi); for (let i = 4; i < 15; i += 3) p.rect(48 * TILE + i, 128, 1, 32, P.colLo);
  for (let i = 0; i < 16; i += 2) p.rect(48 * TILE + i, 125 + (i * 7 % 4), 2, 4 - (i * 7 % 4), P.col);
  p.ellipse(46 * TILE + 8, 156, 9, 4, P.col); p.ellipse(46 * TILE + 8, 154, 7, 2, P.colHi);
  // a fallen chandelier and a cleaning robot that stopped
  p.ellipse(55 * TILE, 157, 12, 3, P.goldLo); p.rect(55 * TILE - 7, 153, 4, 3, P.gold); for (let i = 0; i < 16; i++) p.px(55 * TILE - 18 + r() * 36, 158 - r() * 3, r() < 0.5 ? P.glassLit : P.glint);
  p.mark('glint', 55 * TILE - 4, 156);
  p.ellipse(59 * TILE, 155, 6, 4, P.robot); p.rect(59 * TILE - 6, 155, 13, 5, P.device); p.px(59 * TILE - 2, 153, P.crack); p.px(59 * TILE + 3, 154, P.dust);
  // rubble you can climb
  rubble(p, P, 53 * TILE, G, 16, 3); rubble(p, P, 61 * TILE, G, 32, 5);
  // the hole in the roof: sky, broken lath, moonlight
  const hx0 = LEVEL.hole.x0, hx1 = LEVEL.hole.x1;
  p.rect(hx0, 0, hx1 - hx0, 16, P.skyMid); p.rect(hx0, 0, hx1 - hx0, 5, P.skyTop); p.px(hx0 + 12, 4, P.star); p.px(hx0 + 50, 8, P.star); p.px(hx0 + 33, 3, P.star); p.px(hx0 + 70, 6, P.star);
  p.circle(hx0 + 46, 6, 5, P.moon); p.rect(hx0 + 43, 3, 2, 2, P.moonShade); p.px(hx0 + 48, 8, P.moonShade); p.px(hx0 + 47, 5, P.win); // the Moon, and a lit window on it
  for (let x = hx0 - 4; x < hx1 + 4; x += 7) p.rect(x, 12 + (x % 3), 4 + (x % 2), 3, P.wood);
  p.rect(hx0 - 2, 14, 3, 6, P.wood); p.rect(hx1 - 1, 13, 3, 8, P.wood);
  p.glowPoly([[hx0, 16], [hx1, 16], [hx1 + 34, G], [hx0 - 4, G]], P.shaft, 0.12);
  p.glowPoly([[hx0 + 14, 16], [hx1 - 18, 16], [hx1 + 6, G], [hx0 + 18, G]], P.shaft, 0.1);
  p.glowRect(hx0 - 4, G, hx1 - hx0 + 38, 3, P.shaft, 0.14);
  sconce(p, P, 52 * TILE, 72, false); sconce(p, P, 60 * TILE, 72, false);
  // ---- the arch into the laser hall, then the hall: cold, bare, ports in the end wall
  p.rect(64 * TILE, 22, 23 * TILE, 114, P.wallLo);
  for (let x = 66 * TILE; x < 87 * TILE; x += 48) { p.rect(x + 20, 30, 8, 96, P.wallLine); }
  p.rect(64 * TILE, 16, 2 * TILE, 10, P.colLo); p.rect(64 * TILE, 26, 6, 134, P.colLo); p.rect(66 * TILE - 6, 26, 6, 134, P.colLo);
  p.rect(64 * TILE + 1, 26, 1, 134, P.col); p.rect(66 * TILE - 5, 26, 1, 134, P.col);
  for (let x = 67 * TILE; x < 86 * TILE; x += 64) { p.rect(x, 16, 26, 3, P.device); p.rect(x + 2, 19, 22, 1, P.glassLit); p.glowPoly([[x + 2, 20], [x + 24, 20], [x + 32, G], [x - 6, G]], P.glassLit, 0.035); }
  p.rect(87 * TILE, 0, 16, G, P.device); p.rect(87 * TILE, 0, 1, G, P.wallLine);
  const beams = [...new Set([].concat(...Object.values(LEVEL.laser.shots)))];
  beams.forEach(y => { p.rect(87 * TILE - 3, y - 3, 4, 6, P.device); p.rect(87 * TILE - 2, y - 1, 2, 2, P.crack); p.rect(LEVEL.laser.x0 - 1, y - 2, 3, 4, P.device); });
  // the next door: heavy, a little worn
  const D = LEVEL.door;
  p.rect(D.x - 4, D.y - 6, D.w + 8, D.h + 6, P.goldLo); p.rect(D.x, D.y, D.w, D.h, P.wood); p.rect(D.x + D.w / 2, D.y, 1, D.h, P.woodHi);
  p.rect(D.x + 3, D.y + 4, 6, 10, P.woodHi); p.rect(D.x + D.w - 9, D.y + 4, 6, 10, P.woodHi); p.px(D.x + D.w / 2 - 2, D.y + 18, P.gold); p.px(D.x + D.w / 2 + 2, D.y + 18, P.gold);
  crack(p, P.crack, D.x + 4, D.y + 16, 12, 41, 1);
  p.glowRect(D.x - 6, G - 2, D.w + 12, 3, P.lamp, 0.1);
  // camera mounts are painted; the cameras themselves are live
  camMount(p, P, LEVEL.cameras[0].x, LEVEL.cameras[0].y, false);
  camMount(p, P, LEVEL.cameras[1].x, LEVEL.cameras[1].y, true);
  return p;
}
