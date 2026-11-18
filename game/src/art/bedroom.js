// Episode 4, the bedroom: the dark heart of the house. The lights are off; the cameras only see
// when they flash. A clock that strikes covers her noise. His bag waits under the fallen stairs,
// and pulling it free brings the floor down behind her. At the end of the blood, the bedroom.
import { Painter, rng, flat } from './painter.js';
import { lyingFigure } from './sprites.js';

export const TILE = 16, GROUND = 160;
const T = TILE, G = GROUND;
export const BX = 88 * T; // the bedroom's left wall

// the trail is old blood: near black on the boards (red is kept for what watches her)
export function bloodOf(P) { return P.crack; }

export const LEVEL = {
  w: 108, h: 12,
  start: { x: 2 * T, y: G - 14 },
  door: { x: 85 * T + 4, y: G - 34, w: 22, h: 34 },          // the bedroom doors
  sideDoor: { x: 12 * T + 4, y: G - 28, w: 14, h: 28 },       // the wardrobe, optional
  // flash cameras: they see only at the flash. Two clicks warn first (lead seconds).
  // kind ceiling turns between 35 and 145 degrees; kind wall between 150 and 200.
  cameras: [
    { id: 'landing camera', kind: 'ceiling', x: 9 * T + 8, y: 18, aim: 96, half: 17, range: 175, period: 2.6, phase: 1.6 },
    { id: 'hall camera', kind: 'ceiling', x: 18 * T + 8, y: 18, aim: 98, half: 15, range: 175, period: 2.3, phase: 1.0 },
    { id: 'arch camera', kind: 'wall', x: 33 * T - 4, y: 116, aim: 170, half: 9, range: 240, period: 2.8, phase: 0.4 },
    { id: 'clock room camera', kind: 'ceiling', x: 41 * T, y: 18, aim: 90, half: 25, range: 175, period: 2.8, phase: 2.4 },
    { id: 'billiard camera', kind: 'ceiling', x: 49 * T, y: 18, aim: 90, half: 25, range: 175, period: 2.7, phase: 2.9 }
  ],
  lead: 0.5,
  caught: 0.5, // seconds from a flash that catches her to the strike
  hear: 230,   // how far a camera hears a noise
  // floors that give her away when she runs on them
  noisy: [{ x0: 300, x1: 470, kind: 'boards' }, { x0: 37 * T, x1: 53 * T, kind: 'glass' }],
  // a music box on the end of the dining table: J winds it, and for 3 s nobody hears her
  musicBox: { x: 286, y: 132, mask: 3.0 },
  // three family photos hung low in the hall under a picture lamp; a tall window with the Moon in it
  photos: { x: 298, y: 104, w: 20, h: 26, gap: 4, span: 68 },
  hallWindow: { x: 396, y: 40, w: 28, h: 52 },
  // a form pinned on the wall before the fallen stairs
  request: { x: 856, y: 108 },
  // the clock: three strokes every six seconds; while it strikes nobody hears her
  clock: { x: 35 * T + 8, y: 92, period: 6.0, strokes: [0, 0.6, 1.2], mask: 1.9 },
  // low and high furniture: under a table a ceiling camera cannot see her; behind a chest a wall
  // camera cannot. Solid, so she can stand on them too.
  props: [
    { id: 'piano', x: 6 * T, y: 128, w: 50, h: 9 },
    { id: 'dining table', x: 15 * T, y: 132, w: 56, h: 5 },
    { id: 'chest', x: 332, y: 146, w: 18, h: 14 },
    { id: 'armchair', x: 368, y: 148, w: 14, h: 12 },
    { id: 'long table', x: 628, y: 132, w: 64, h: 5 },
    { id: 'billiard table', x: 756, y: 134, w: 64, h: 7 }
  ],
  bag: { x: 59 * T, wall: { id: 'fallen stairs', x: 976, y: 56, w: 24, h: 104 }, low: { id: 'rubble', x: 972, y: 150, w: 34, h: 10 } },
  // the floor gives way behind her once the bag is out
  collapse: { from: 54 * T, stop: 79 * T, fromTile: 54, lastTile: 78 },
  // the show's tape marks (checkpoints), where she stands on the floor: under the dining table,
  // under the long table, by his bag
  marks: [15 * T + 20, 628 + 22, 59 * T - 4],
  // gold left out, [x, the surface's y]: the piano, the dining table, the long table's silver,
  // the billiard table, on the lip of the last gap in the run (right where to jump from), on top
  // of the heap
  gold: [[121, 128], [252, 132], [676, 132], [800, 134], [77 * T - 4, GROUND], [83 * T + 8, 80]],
  // the run: a gap to jump, a slab to crouch under, a last gap (the bag is heavy: one jump only,
  // so two tiles, the same as the first; it was four tiles and a double jump before Nov 18; three
  // tiles left a 0.3 s take-off window with Space held, too tight for a class on a projector),
  // then the ceiling hanging down to a hand above the floor and a heap past it: climb the gap
  // between them by jumping from wall to wall
  run: {
    gaps: [{ t0: 66, t1: 67, at: 66 * T - 70 }, { t0: 77, t1: 78, at: 77 * T - 74 }],
    slab: { x: 1128, w: 34, top: 96, bottom: 150, at: 1128 - 84, warn: 0.5 },
    hang: { tx: 80, top: 1, bottom: 8 },  // the ceiling, down to y 144: she walks under it
    heap: { tx: 83, top: 5, bottom: 9 },  // a heap of it, 80 px tall: too high to jump
    sill: { tx: 84, top: 8, bottom: 9 }   // a step down to the doors
  },
  // the bedroom, all inside one screen
  bed: { x0: BX + 150, x1: BX + 262 },
  brother: { x: BX + 126, kneel: BX + 106 },
  voidDoor: { x: BX + 284, y: G - 36, w: 22, h: 36 },
  rec: { x: BX + 22, y: 24 },
  window: { x: BX + 124, y: 46, w: 52, h: 64 }
};

export function buildMap() {
  const W = LEVEL.w, H = LEVEL.h, m = [];
  for (let y = 0; y < H; y++) m.push(new Array(W).fill(0));
  const solid = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y] && x >= 0 && x < W) m[y][x] = 1; };
  solid(0, 10, W - 1, 11);   // floor
  solid(0, 0, W - 1, 0);     // ceiling
  solid(0, 0, 0, 9);         // the door she came in by
  solid(33, 1, 33, 6);       // the arch between the hall and the clock room
  solid(87, 0, 87, 9);       // the wall between the house and the bedroom
  solid(W - 1, 0, W - 1, 9); // the bedroom's far wall
  const R = LEVEL.run;
  [R.hang, R.heap, R.sill].forEach(c => solid(c.tx, c.top, c.tx, c.bottom)); // the climb before the doors
  return { W, H, m };
}

// the blood: drops from the door she came in by to where he sits, thicker toward the end
export function trail() {
  const r = rng(404), out = [];
  let x = 18;
  const end = LEVEL.brother.x + 14;
  while (x < end) {
    const k = x / end, skip = x > LEVEL.bag.wall.x - 4 && x < LEVEL.bag.wall.x + 28; // he climbed over the stairs
    if (!(x > 87 * T - 6 && x < BX + 4) && !skip) {
      out.push({ x: Math.round(x), y: G, w: 1 + (r() < 0.3 + k * 0.4 ? 1 : 0) });
      if (r() < 0.12 + k * 0.3) out.push({ x: Math.round(x + 2 + r() * 3), y: G, w: 1 });
      if (k > 0.85 && r() < 0.3) out.push({ x: Math.round(x - 3), y: G, w: 4 }); // smears
    }
    x += 5 + r() * (14 - k * 9);
  }
  return out;
}

// He sits on the floor against the foot of the bed, facing left. One leg ends at the knee in a
// dark wrap. Nothing gory: the wrap and a stain under it say it.
export function paintBrother(P, dead, inhale) {
  // a row and a column spare at the top and left for his outline; his feet stay on the bottom row
  const p = new Painter(26, 23), x = 1, y = 23, sk = P.kid, sh = P.kidLo, b = inhale ? 1 : 0; // b: his chest up a pixel
  // the long leg, out along the floor, and its boot
  p.rect(x + 2, y - 3, 13, 3, P.sibLo); p.rect(x, y - 6, 2, 6, P.device); p.px(x + 1, y - 7, P.device);
  // the other thigh, raised, ending in the wrap
  p.rect(x + 8, y - 7, 8, 3, P.sibLo); p.rect(x + 6, y - 7, 2, 3, P.colLo); p.px(x + 6, y - 5, P.fabricLo); p.px(x + 7, y - 4, P.fabricLo);
  // the jacket, his back against the bed
  p.rect(x + 15, y - 14 - b, 7, 11 + b, P.sib); p.rect(x + 20, y - 13 - b, 1, 9, P.sibHi); p.rect(x + 15, y - 4, 7, 1, P.sibLo);
  // an arm across his stomach, a hand pressed to it
  p.rect(x + 13, y - 10 - b, 4, 2, P.sib); p.rect(x + 11, y - 10 - b, 2, 2, sk);
  if (!dead) {
    // head back against the mattress, eyes on the door she came in by
    p.rect(x + 16, y - 20 - b, 5, 6, sk); p.rect(x + 16, y - 21 - b, 6, 2, P.hair); p.rect(x + 20, y - 20 - b, 2, 5, P.hair);
    p.px(x + 17, y - 18 - b, P.hair); p.px(x + 16, y - 16 - b, sh);
  } else {
    // dropped forward
    p.rect(x + 13, y - 17, 5, 5, sk); p.rect(x + 13, y - 18, 6, 2, P.hair); p.rect(x + 17, y - 17, 2, 4, P.hair); p.px(x + 13, y - 14, sh);
  }
  outline(p, P.crack);
  return p;
}
// a 1 px outline round everything painted (ART_DIRECTION 2: characters read against the dark)
function outline(p, c) {
  const d = p.ctx.getImageData(0, 0, p.w, p.h).data, on = (i, j) => i >= 0 && j >= 0 && i < p.w && j < p.h && d[(j * p.w + i) * 4 + 3] > 0;
  for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) p.px(i, j, c);
}

// ------------------------------------------------------------------ painting
function crack(p, c, x, y, len, seed) { const r = rng(seed); let cx = x, cy = y; for (let i = 0; i < len; i++) { p.px(cx, cy, c); cy += 1; cx += r() < 0.5 ? -1 : 1; if (r() < 0.15) p.px(cx + 1, cy, c); } }
function stain(p, P, x, y, w, h, r) { for (let i = 0; i < w * h / 26; i++) p.rect(x + r() * w, y + r() * h, 2 + r() * 5, 1 + r() * 2, r() < 0.8 ? P.wallLine : P.crack); }
function camMount(p, P, c) {
  if (c.kind === 'ceiling') { p.rect(c.x - 1, 16, 3, c.y - 18, P.device); p.rect(c.x - 4, 16, 9, 2, P.device); }
  else { p.rect(c.x - 2, c.y - 6, 6, 3, P.device); p.rect(c.x + 1, c.y - 4, 3, 4, P.device); }
}
function portraitTurned(p, P, x, y, w, h) {
  // a portrait hung facing the wall: only the back of the canvas and its wire
  p.rect(x - 2, y - 2, w + 4, h + 4, P.goldLo); p.rect(x, y, w, h, P.wood); p.rect(x + 2, y + 2, w - 4, h - 4, P.woodHi);
  p.rect(x + w / 2 - 1, y - 8, 1, 6, P.device); p.line(x + 3, y + 3, x + w / 2, y - 6, P.device); p.line(x + w - 3, y + 3, x + w / 2, y - 6, P.device);
  p.rect(x + 3, y + h / 2, w - 6, 1, P.wood);
}
function windowArch(p, P, x, y, w, h) {
  // a tall window with a round top: frame, then glass, the arch's center on the top edge
  const cx = x + w / 2, r = w / 2;
  p.circle(cx, y, r + 3, P.goldLo); p.rect(x - 3, y, w + 6, h + 3, P.goldLo);
  p.circle(cx, y, r + 2, P.wood); p.rect(x - 2, y, w + 4, h + 2, P.wood);
  p.circle(cx, y, r, P.skyTop); p.rect(x, y, w, h, P.skyMid); p.rect(x, y, w, Math.round(h * 0.35), P.skyTop);
}

export function paintLevel(P) {
  const W = LEVEL.w * T, p = new Painter(W, 180), r = rng(88), blood = bloodOf(P);
  // walls: worn, the paper coming away in long strips; the ceiling sagging
  p.rect(0, 0, W, G, P.wallLo);
  for (let x = 0; x < W; x += 24) { p.rect(x, 22, 10, 112, P.wallLine); if (r() < 0.6) p.rect(x + 10, 22 + r() * 40, 4, 30 + r() * 60, P.wall); }
  for (let i = 0; i < 34; i++) stain(p, P, r() * W, 24 + r() * 100, 10 + r() * 30, 6 + r() * 26, r);
  for (let i = 0; i < 30; i++) crack(p, P.crack, r() * W, 22 + r() * 30, 30 + r() * 70, 100 + i);
  p.rect(0, 16, W, 6, P.wall); p.rect(0, 16, W, 1, P.goldLo); p.rect(0, 21, W, 1, P.wallLine);
  for (let x = 0; x < W; x += 8) if (r() < 0.7) p.rect(x, 18, 3, 2, P.goldLo);
  p.rect(0, 134, W, 26, P.wall); p.rect(0, 134, W, 1, P.goldLo); for (let x = 6; x < W; x += 30) { p.rect(x, 139, 22, 16, P.wallLine); p.rect(x + 1, 140, 20, 1, P.wallLo); }
  p.rect(0, 0, W, 16, P.void); for (let x = 0; x < W; x += 32) { p.rect(x, 9, 32, 7, P.wood); p.rect(x + 30, 0, 2, 16, P.wood); p.rect(x, 9, 32, 1, P.woodHi); }
  // floor: old parquet, boards missing here and there
  for (let x = 0; x < W; x += 16) for (let y = G; y < 180; y += 4) { p.rect(x, y, 16, 4, (x / 16 + y / 4) % 3 ? P.wood : P.woodHi); p.px(x + ((y * 7) % 16), y + 1, P.crack); }
  p.rect(0, G, W, 1, P.woodHi);
  for (let i = 0; i < 40; i++) p.rect(r() * W, G + 2 + Math.floor(r() * 4) * 4, 6 + r() * 10, 3, P.crack);

  // ---- the landing: the door she came in by, a piano under a sheet, a portrait turned around
  p.rect(0, 112, 18, 48, P.goldLo); p.rect(0, 116, 15, 44, P.wood); p.rect(3, 120, 8, 14, P.woodHi); p.rect(3, 140, 8, 14, P.woodHi); p.px(12, 138, P.gold);
  const pi = LEVEL.props[0];
  p.rect(pi.x, pi.y, pi.w, pi.h, P.void); p.rect(pi.x, pi.y, pi.w, 1, P.goldLo); p.rect(pi.x + pi.w - 14, pi.y - 14, 14, 14, P.void); p.line(pi.x + pi.w - 14, pi.y - 14, pi.x + pi.w - 30, pi.y, P.device);
  [pi.x + 3, pi.x + pi.w - 6].forEach(x => { p.rect(x, pi.y + pi.h, 3, G - pi.y - pi.h, P.void); p.px(x + 1, G - 1, P.goldLo); });
  for (let i = 0; i < 9; i++) p.rect(pi.x + 4 + i * 4, pi.y + pi.h, 3, 2, i % 2 ? P.colHi : P.col); // a few keys showing
  // a dust sheet half off it
  p.poly([[pi.x - 2, pi.y - 1], [pi.x + 22, pi.y - 2], [pi.x + 24, pi.y + 1], [pi.x + 2, pi.y + 2]], P.dust);
  p.poly([[pi.x - 2, pi.y], [pi.x + 3, pi.y], [pi.x + 5, pi.y + 20], [pi.x + 1, pi.y + 24], [pi.x - 3, pi.y + 21]], P.dust);
  for (let i = 0; i < 4; i++) p.px(pi.x + 2 + i * 5, pi.y + 1, P.colLo);
  portraitTurned(p, P, 3 * T, 52, 30, 38);
  // ---- the hall: a long table laid for nobody, a chest, an armchair on its side
  const dt = LEVEL.props[1];
  p.rect(dt.x - 2, dt.y, dt.w + 4, dt.h, P.wood); p.rect(dt.x - 2, dt.y, dt.w + 4, 1, P.woodHi); p.rect(dt.x, dt.y + dt.h, dt.w, 2, P.fabricLo);
  [dt.x + 2, dt.x + dt.w - 5].forEach(x => p.rect(x, dt.y + dt.h, 3, G - dt.y - dt.h, P.wood));
  for (let i = 0; i < 5; i++) { p.rect(dt.x + 6 + i * 11, dt.y - 2, 5, 2, P.colHi); p.px(dt.x + 8 + i * 11, dt.y - 3, P.col); } // plates
  p.rect(dt.x + 26, dt.y - 14, 2, 12, P.gold); p.rect(dt.x + 21, dt.y - 14, 12, 2, P.gold); [21, 26, 31].forEach(o => p.rect(dt.x + o, dt.y - 19, 2, 5, P.colHi)); // a candelabra, cold
  [dt.x - 12, dt.x + dt.w + 6].forEach(x => { p.rect(x, 134, 3, 26, P.wood); p.rect(x, 146, 9, 3, P.fabric); p.rect(x + 7, 146, 2, 14, P.wood); }); // chairs
  const ch = LEVEL.props[2]; p.rect(ch.x, ch.y, ch.w, ch.h, P.wood); p.rect(ch.x, ch.y, ch.w, 2, P.woodHi); p.rect(ch.x, ch.y + 6, ch.w, 1, P.goldLo); p.px(ch.x + 9, ch.y + 8, P.gold);
  const ar = LEVEL.props[3]; p.rect(ar.x, ar.y + 2, ar.w, ar.h - 2, P.fabric); p.rect(ar.x + ar.w - 4, ar.y, 4, ar.h, P.fabricLo); p.rect(ar.x, ar.y + ar.h - 2, ar.w, 2, P.wood);
  // the creaky boards: pale splinters, boards sprung up at the ends
  const nb = LEVEL.noisy[0];
  for (let x = nb.x0; x < nb.x1; x += 8) { p.rect(x, G, 7, 1, P.colLo); if (r() < 0.5) p.px(x + 3, G - 1, P.colLo); p.px(x + 7, G, P.crack); }
  // the wardrobe door
  const sd = LEVEL.sideDoor;
  p.rect(sd.x - 2, sd.y - 2, sd.w + 4, sd.h + 2, P.wallLine); p.rect(sd.x, sd.y, sd.w, sd.h, P.wood); p.rect(sd.x + 2, sd.y + 3, sd.w - 4, 9, P.woodHi); p.rect(sd.x + 2, sd.y + 15, sd.w - 4, 9, P.woodHi); p.px(sd.x + sd.w - 3, sd.y + 14, P.gold);
  p.rect(sd.x + 2, sd.y - 7, sd.w - 4, 4, P.colLo); p.rect(sd.x + 3, sd.y - 6, sd.w - 6, 2, P.device);
  portraitTurned(p, P, 22 * T, 56, 26, 34); portraitTurned(p, P, 28 * T, 50, 32, 42);
  // the arch into the clock room
  p.rect(33 * T - 2, 16, 20, 98, P.wall); p.rect(33 * T - 2, 110, 20, 3, P.goldLo); p.rect(33 * T, 20, 1, 90, P.wallLine);
  // ---- the clock room: a long table, a billiard table, glass all over the floor, the clock
  const C = LEVEL.clock;
  p.rect(C.x - 9, 54, 18, 106, P.wood); p.rect(C.x - 10, 52, 20, 4, P.goldLo); p.rect(C.x - 7, 58, 14, 98, P.woodHi);
  p.circle(C.x, 76, 7, P.goldLo); p.circle(C.x, 76, 6, P.colHi); p.px(C.x, 71, P.device); p.px(C.x, 81, P.device); p.px(C.x - 5, 76, P.device); p.px(C.x + 5, 76, P.device);
  p.rect(C.x - 5, 88, 10, 50, P.void); p.rect(C.x - 4, 89, 8, 48, P.wallLo); p.rect(C.x - 7, 140, 14, 20, P.wood);
  for (let y = 60; y < 156; y += 9) p.px(C.x - 8, y, P.goldLo);
  const lt = LEVEL.props[4];
  p.rect(lt.x - 2, lt.y, lt.w + 4, lt.h, P.wood); p.rect(lt.x - 2, lt.y, lt.w + 4, 1, P.woodHi); [lt.x + 2, lt.x + lt.w - 5, lt.x + lt.w / 2].forEach(x => p.rect(x, lt.y + lt.h, 3, G - lt.y - lt.h, P.wood));
  for (let i = 0; i < 6; i++) p.rect(lt.x + 4 + i * 10, lt.y - 3, 4, 3, i % 2 ? P.glassLit : P.col); // glasses still set out
  const bt = LEVEL.props[5];
  p.rect(bt.x - 3, bt.y, bt.w + 6, bt.h, P.wood); p.rect(bt.x, bt.y, bt.w, 2, P.hedgeHi); p.rect(bt.x - 3, bt.y, 3, 2, P.goldLo); p.rect(bt.x + bt.w, bt.y, 3, 2, P.goldLo);
  [bt.x + 1, bt.x + bt.w - 6].forEach(x => { p.rect(x, bt.y + bt.h, 5, G - bt.y - bt.h, P.wood); p.rect(x, G - 3, 5, 3, P.goldLo); });
  p.circle(bt.x + 20, bt.y - 2, 1, P.colHi); p.circle(bt.x + 40, bt.y - 2, 1, P.hazard);
  const ng = LEVEL.noisy[1];
  for (let x = ng.x0; x < ng.x1; x += 2) { if (r() < 0.45) p.px(x, G - (r() < 0.3 ? 1 : 0), r() < 0.5 ? P.glassLit : P.glint); }
  p.rect(43 * T, 30, 3 * T, 30, P.wallLine); for (let i = 0; i < 8; i++) p.line(43 * T + 24, 44, 43 * T + r() * 48, 30 + r() * 30, P.crack); // a mirror, smashed
  // ---- the fallen stairs, and the alcove under them where the bag is
  p.poly([[56 * T, 16], [60 * T, 16], [63 * T + 8, 92], [61 * T, 92]], P.wood);
  for (let i = 0; i < 9; i++) { const sx = 56 * T + i * 13, sy = 16 + i * 9; p.rect(sx + 6, sy, 14, 2, P.woodHi); p.rect(sx + 18, sy, 2, 8, P.crack); }
  p.poly([[57 * T, 16], [58 * T, 16], [59 * T + 4, 140], [58 * T + 10, 140]], P.wood); // a fallen stringer, leaning
  p.rect(57 * T, 120, 50, 4, P.woodHi); p.rect(57 * T, 124, 50, 1, P.crack); // the beam over the bag
  const wall = LEVEL.bag.wall;
  p.poly([[wall.x - 4, G], [wall.x, wall.y + 8], [wall.x + 10, wall.y], [wall.x + wall.w + 2, wall.y + 14], [wall.x + wall.w + 6, G]], P.rubble);
  for (let i = 0; i < 40; i++) p.rect(wall.x - 2 + r() * (wall.w + 6), wall.y + 4 + r() * (wall.h - 6), 3 + r() * 5, 2 + r() * 3, r() < 0.4 ? P.rubbleHi : r() < 0.5 ? P.wood : P.crack);
  // ---- the last corridor: bare, the floor sound until the bag comes out
  for (let x = 64 * T; x < 84 * T; x += 40) { p.rect(x, 40, 12, 80, P.wallLine); }
  crack(p, P.crack, 70 * T, 24, 110, 7);
  // the ceiling come down: a hanging mass of joists and plaster, and the heap under it
  const RN = LEVEL.run, slabOf = (c, lit) => { const x = c.tx * T, y0 = c.top * T, y1 = (c.bottom + 1) * T; p.rect(x - 1, y0, T + 2, y1 - y0, P.crack); p.rect(x, y0, T, y1 - y0, P.rubble); for (let y = y0 + 3; y < y1; y += 7) { p.rect(x + 1, y, T - 2, 1, P.crack); p.rect(x + 2 + (y % 5), y + 2, 4, 2, P.rubbleHi); } if (lit) p.rect(x, y0, T, 1, P.rubbleHi); };
  slabOf(RN.hang, false); slabOf(RN.heap, true); slabOf(RN.sill, true);
  for (let i = 0; i < 5; i++) p.rect(RN.hang.tx * T - 2 + i * 4, (RN.hang.bottom + 1) * T, 2, 2 + (i % 2) * 2, P.wood); // splinters hanging off it
  p.rect(RN.hang.tx * T + 4, 30, 1, 60, P.wood); p.rect(RN.hang.tx * T + 10, 50, 1, 40, P.wood);
  // the threshold before the bedroom: stone, it does not fall
  p.rect(84 * T, G, 3 * T, 20, P.colLo); p.rect(84 * T, G, 3 * T, 1, P.col); for (let x = 84 * T; x < 87 * T; x += 12) p.rect(x, G + 1, 1, 19, P.crack);
  // the bedroom doors: tall, gilded, a line of cold light under them
  const D = LEVEL.door;
  p.rect(D.x - 5, D.y - 8, D.w + 10, D.h + 8, P.goldLo); p.rect(D.x - 3, D.y - 6, D.w + 6, 4, P.gold);
  p.rect(D.x, D.y, D.w, D.h, P.wood); p.rect(D.x + D.w / 2, D.y, 1, D.h, P.crack);
  p.rect(D.x + 2, D.y + 3, 7, 12, P.woodHi); p.rect(D.x + D.w - 9, D.y + 3, 7, 12, P.woodHi); p.rect(D.x + 2, D.y + 18, 7, 12, P.woodHi); p.rect(D.x + D.w - 9, D.y + 18, 7, 12, P.woodHi);
  p.px(D.x + D.w / 2 - 2, D.y + 17, P.gold); p.px(D.x + D.w / 2 + 2, D.y + 17, P.gold);
  p.rect(D.x + 1, G - 1, D.w - 2, 1, P.voidEdge);
  // the wall between
  p.rect(87 * T, 0, T, G, P.void); p.rect(87 * T, 0, 1, G, P.wallLine); p.rect(88 * T - 1, 0, 1, G, P.wallLine);

  // ---- the bedroom
  const B = BX;
  p.rect(B, 16, 19 * T, G - 16, P.fabricLo);
  for (let x = B; x < B + 19 * T; x += 12) for (let y = 26; y < 132; y += 14) { p.px(x + 6, y, P.fabric); p.rect(x + 5, y + 1, 3, 1, P.fabric); p.px(x + 6, y + 2, P.fabric); }
  for (let i = 0; i < 14; i++) stain(p, P, B + r() * 300, 30 + r() * 90, 12 + r() * 30, 8 + r() * 20, r);
  p.rect(B, 16, 19 * T, 6, P.wood); p.rect(B, 21, 19 * T, 1, P.goldLo);
  p.rect(B, 132, 19 * T, 28, P.wood); p.rect(B, 132, 19 * T, 1, P.goldLo);
  // a rug, a nightstand with a lamp that is off
  p.rect(B + 40, G, 220, 3, P.fabric); p.rect(B + 40, G + 3, 220, 1, P.goldLo);
  // the window and the Moon in it, with its one lit window
  const Wn = LEVEL.window; windowArch(p, P, Wn.x, Wn.y, Wn.w, Wn.h);
  for (let i = 0; i < 9; i++) p.px(Wn.x + 3 + r() * (Wn.w - 6), Wn.y - 14 + r() * (Wn.h + 6), P.star);
  const mx = Wn.x + 36, my = Wn.y + 2;
  p.circle(mx, my, 9, P.moon); p.rect(mx - 5, my - 5, 3, 3, P.moonShade); p.px(mx + 3, my + 4, P.moonShade); p.rect(mx - 4, my + 3, 2, 2, P.moonShade);
  p.px(mx + 2, my - 3, P.win); p.mark('moonWindow', mx + 2, my - 3); // its one lit window
  p.rect(Wn.x + Wn.w / 2, Wn.y - Wn.w / 2, 1, Wn.h + Wn.w / 2, P.wood); p.rect(Wn.x, Wn.y + Math.round(Wn.h * 0.45), Wn.w, 1, P.wood); p.rect(Wn.x, Wn.y, Wn.w, 1, P.wood);
  p.line(Wn.x + 6, Wn.y + 40, Wn.x + 16, Wn.y + 52, P.glassLit); // a crack in one pane
  // drapes, torn
  p.poly([[Wn.x - 14, 22], [Wn.x - 2, 22], [Wn.x - 4, 132], [Wn.x - 18, 128]], P.fabric); p.poly([[Wn.x + Wn.w + 2, 22], [Wn.x + Wn.w + 14, 22], [Wn.x + Wn.w + 18, 96], [Wn.x + Wn.w + 4, 104]], P.fabric);
  // the bed: a canopy, posts, a long mattress, the sheets pulled down
  const bd = LEVEL.bed;
  p.rect(bd.x0, 36, bd.x1 - bd.x0, 6, P.fabric); p.rect(bd.x0, 41, bd.x1 - bd.x0, 1, P.goldLo);
  [bd.x0, bd.x1 - 4].forEach(x => { p.rect(x, 36, 4, G - 36, P.wood); p.rect(x + 1, 36, 1, G - 36, P.woodHi); p.rect(x - 1, 34, 6, 3, P.gold); });
  p.rect(bd.x1 - 6, 96, 6, 64, P.wood); p.rect(bd.x1 - 8, 92, 10, 6, P.goldLo); // the headboard, on the right
  p.rect(bd.x0 + 4, 128, bd.x1 - bd.x0 - 10, 12, P.colHi); p.rect(bd.x0 + 4, 138, bd.x1 - bd.x0 - 10, 2, P.col);
  p.rect(bd.x0 + 4, 140, bd.x1 - bd.x0 - 10, 12, P.fabric); p.rect(bd.x0 + 4, 140, bd.x1 - bd.x0 - 10, 1, P.goldLo);
  p.rect(bd.x1 - 28, 122, 18, 7, P.colHi); p.rect(bd.x1 - 27, 128, 16, 1, P.col); // a pillow
  p.rect(bd.x0 - 2, 144, 8, 16, P.wood); p.rect(bd.x0 - 2, 144, 8, 2, P.goldLo); // the foot board he leans on
  // where he lies, and the stain around him
  const bro = LEVEL.brother;
  p.ellipse(bro.x + 12, G, 14, 1, blood); p.ellipse(bro.x + 8, G - 1, 6, 1, blood);
  // the nightstand by the door, the lamp dark
  p.rect(B + 34, 140, 18, 20, P.wood); p.rect(B + 34, 140, 18, 2, P.woodHi); p.rect(B + 41, 128, 4, 12, P.goldLo); p.poly([[B + 36, 128], [B + 50, 128], [B + 47, 120], [B + 39, 120]], P.col);
  // the door she came in by, from inside
  p.rect(B + 2, G - 34, 20, 34, P.wood); p.rect(B + 2, G - 34, 20, 1, P.goldLo); p.rect(B + 12, G - 34, 1, 34, P.crack);
  // the door at the far end: half a closet door, half a bathroom door, one frame
  const V = LEVEL.voidDoor;
  p.rect(V.x - 3, V.y - 4, V.w + 6, V.h + 4, P.goldLo);
  p.rect(V.x, V.y, V.w / 2, V.h, P.wood); for (let y = V.y + 3; y < V.y + V.h - 3; y += 3) p.rect(V.x + 2, y, V.w / 2 - 4, 1, P.woodHi); p.px(V.x + V.w / 2 - 2, V.y + 18, P.gold);
  p.rect(V.x + V.w / 2, V.y, V.w / 2, V.h, P.colHi); p.rect(V.x + V.w / 2 + 2, V.y + 4, V.w / 2 - 4, 12, P.glassLit); p.rect(V.x + V.w / 2 + 2, V.y + 18, 2, 2, P.colLo);
  p.rect(V.x + V.w / 2, V.y, 1, V.h, P.void);
  p.rect(107 * T, 0, T, G, P.void); p.rect(107 * T, 0, 1, G, P.wood);
  // the camera in the corner
  p.rect(LEVEL.rec.x - 4, 22, 9, 2, P.device); p.rect(LEVEL.rec.x - 1, 22, 2, 3, P.device);

  // ---- the music box on the end of the dining table, lid shut
  const MB = LEVEL.musicBox;
  p.rect(MB.x - 1, MB.y - 7, 10, 7, P.crack); p.rect(MB.x, MB.y - 6, 8, 6, P.goldLo); p.rect(MB.x, MB.y - 6, 8, 1, P.gold); p.px(MB.x + 8, MB.y - 3, P.goldHi);
  // ---- three family photos, hung low under a brass picture lamp: a different rich family in
  // each, and at the back of every one the same boy in grey, a head taller each time
  const PH = LEVEL.photos;
  p.rect(PH.x + 4, PH.y - 8, PH.span - 8, 2, P.goldLo); p.rect(PH.x + 4, PH.y - 8, PH.span - 8, 1, P.gold); // the lamp's bar
  p.rect(PH.x + PH.span / 2 - 1, PH.y - 11, 2, 3, P.goldLo); for (let x = PH.x + 6; x < PH.x + PH.span - 6; x += 4) p.px(x, PH.y - 6, P.lamp);
  const families = [
    [[2, 9, P.gold, 1], [7, 11, P.colHi, 0], [12, 6, P.gold, 0]],          // two parents and a girl
    [[2, 10, P.colHi, 1], [6, 6, P.goldHi, 0], [11, 10, P.gold, 1]],       // a child between them
    [[1, 11, P.gold, 0], [6, 10, P.goldHi, 1], [11, 7, P.colHi, 0], [15, 5, P.gold, 0]] // four
  ];
  families.forEach((fam, i) => {
    const x = PH.x + i * (PH.w + PH.gap), y = PH.y, w = PH.w, h = PH.h;
    p.rect(x - 2, y - 2, w + 4, h + 4, P.crack); p.rect(x - 1, y - 1, w + 2, h + 2, P.goldLo); p.rect(x - 1, y - 1, w + 2, 1, P.gold);
    p.rect(x, y, w, h, P.wallHi); p.rect(x, y + h - 7, w, 7, P.wall); p.rect(x, y + h - 7, w, 1, P.wallLo); // a sepia room, a floor
    // him, at the back on the right, grey, older (taller) in each
    const bh = 7 + i * 3, bx = x + w - 5, by = y + h - 9;
    p.rect(bx - 1, by - bh - 1, 5, bh + 2, P.crack); p.rect(bx, by - bh + 3, 3, bh - 3, P.sib); p.rect(bx, by - bh, 3, 3, P.kidLo); p.px(bx + 1, by - bh, P.hair);
    // the family in front of him: heads in bone, clothes in gold
    fam.forEach(([dx, fh, c, hat]) => {
      const fx = x + dx, fy = y + h - 3;
      p.rect(fx - 1, fy - fh - 1, 5, fh + 1, P.crack); p.rect(fx, fy - fh + 3, 3, fh - 3, c); p.rect(fx, fy - fh, 3, 3, P.kid);
      if (hat) p.rect(fx - 1, fy - fh - 1, 5, 1, P.crack);
    });
  });
  // ---- a tall window with the Moon in it, and its one lit window
  const HW = LEVEL.hallWindow;
  p.rect(HW.x - 3, HW.y - 3, HW.w + 6, HW.h + 6, P.crack); p.rect(HW.x - 2, HW.y - 2, HW.w + 4, HW.h + 4, P.goldLo); p.rect(HW.x, HW.y, HW.w, HW.h, P.skyTop);
  p.rect(HW.x, HW.y + 30, HW.w, 1, P.wood); p.rect(HW.x + HW.w / 2, HW.y + 30, 1, HW.h - 30, P.wood); // the panes: one big one up top
  [[HW.x + 3, HW.y + 4], [HW.x + 24, HW.y + 26], [HW.x + 5, HW.y + 40], [HW.x + 21, HW.y + 45]].forEach(([x, y]) => p.px(x, y, P.star));
  const hx = HW.x + 14, hy = HW.y + 15;
  p.circle(hx, hy, 10, P.crack); p.circle(hx, hy, 9, P.moon);
  p.rect(hx - 6, hy - 4, 3, 3, P.moonShade); p.rect(hx - 3, hy + 4, 4, 2, P.moonShade); p.px(hx + 5, hy + 5, P.moonShade);
  // its one lit window: a dark frame on the white, two warm pixels inside
  p.rect(hx + 1, hy - 4, 5, 5, P.crack); p.rect(hx + 2, hy - 3, 3, 3, P.win); p.px(hx + 3, hy - 3, P.goldHi);
  p.mark('hallMoonWindow', hx + 3, hy - 2);
  // ---- the form on the wall: REQUEST, a red stamp, a blank line to sign
  const RQ = LEVEL.request;
  p.rect(RQ.x - 1, RQ.y - 1, 14, 18, P.crack); p.rect(RQ.x, RQ.y, 12, 16, P.colHi); p.rect(RQ.x, RQ.y, 12, 3, P.colLo);
  for (let i = 0; i < 4; i++) p.rect(RQ.x + 2, RQ.y + 5 + i * 2, 8 - (i % 2) * 3, 1, P.device);
  p.rect(RQ.x + 7, RQ.y + 11, 4, 3, P.hazard); p.rect(RQ.x + 2, RQ.y + 14, 5, 1, P.device); p.px(RQ.x + 5, RQ.y - 2, P.device);

  // old remains where the cameras look, from seasons before hers
  [[11 * T, 3], [24 * T + 4, 2], [46 * T, 3]].forEach(([x, s]) => lyingFigure(p, P, x, G, s));
  // camera mounts are painted; the cameras themselves are live
  LEVEL.cameras.forEach(c => camMount(p, P, c));
  // the blood trail, painted dark; it is drawn again, faintly, over the dark
  trail().forEach(d => p.rect(d.x, d.y, d.w, 1, blood));
  return p;
}

// The wardrobe off the hall (a side room): one long rail of her jacket across the whole room,
// photos, a mirror with a light. She comes in by a doorway on the right; its light is the room's.
export function paintWardrobe(P) {
  const p = new Painter(320, 180), r = rng(12);
  p.rect(0, 0, 320, 180, P.wallLo);
  p.rect(0, 0, 320, 18, P.void); p.rect(0, 18, 320, 2, P.wood);
  for (let x = 0; x < 320; x += 20) p.rect(x, 20, 1, 140, P.wallLine);
  p.rect(0, G, 320, 20, P.wood); p.rect(0, G, 320, 1, P.woodHi); for (let x = 0; x < 320; x += 16) p.rect(x, G + 2, 1, 18, P.crack);
  // the doorway on the right, open, the hall's light in it, and that light across the floor
  const dx = 286;
  p.rect(dx - 2, G - 32, 20, 32, P.crack); p.rect(dx - 1, G - 31, 18, 31, P.wood); p.rect(dx, G - 30, 16, 30, P.wallHi);
  p.rect(dx, G - 30, 16, 1, P.wall); p.rect(dx + 15, G - 30, 1, 30, P.wall);
  p.poly([[dx - 1, G + 1], [dx + 16, G + 1], [dx + 10, 180], [dx - 60, 180]], P.woodHi);
  p.poly([[dx - 2, G - 30], [dx - 2, G], [dx - 30, G], [dx - 26, G - 22]], P.wall);
  // one rail across the whole room, wall to wall, and her jacket on every hanger
  p.rect(4, 34, 312, 2, P.colLo); p.rect(4, 34, 312, 1, P.col);
  [4, 314].forEach(x => p.rect(x, 20, 2, 16, P.device));
  for (let i = 0; i < 25; i++) {
    const x = 9 + i * 11;
    if (x > 244 && x < 262) continue; // the bulb and its cord hang here
    p.rect(x + 3, 36, 1, 3, P.colLo); p.poly([[x, 39], [x + 8, 39], [x + 9, 66], [x - 1, 66]], P.kid); p.rect(x + 3, 39, 2, 25, P.kidLo); p.px(x + 1, 50, P.kidLo);
    p.rect(x, 66, 9, 1, P.kidLo); p.rect(x + 7, 43, 2, 3, P.colHi); // a tag
    p.rect(x - 1, 39, 1, 27, P.crack); // the next one overlaps it
  }
  // shoes in a row under the rail, worn down the same way
  for (let i = 0; i < 6; i++) { const x = 76 + i * 7; p.rect(x, G - 3, 5, 3, P.kidLo); p.px(x, G - 1, P.crack); }
  // a board of photos, all of her
  p.rect(116, 82, 52, 46, P.woodHi); p.rect(118, 84, 48, 42, P.wood);
  for (let i = 0; i < 6; i++) { const x = 121 + (i % 3) * 15, y = 87 + Math.floor(i / 3) * 19; p.rect(x, y, 12, 15, P.colHi); p.rect(x + 1, y + 1, 10, 9, P.skyLow); p.rect(x + 5, y + 3, 2, 2, P.kid); p.rect(x + 4, y + 5, 4, 5, P.kid); p.rect(x + 1, y + 11, 10, 1, P.hazard); p.px(x + 6, y, P.led); }
  // a mirror ringed with bulbs, half of them dead, a red light behind the glass
  p.rect(186, 82, 46, 50, P.goldLo); p.rect(190, 86, 38, 42, P.glass); p.line(192, 124, 204, 92, P.glassLit);
  for (let i = 0; i < 6; i++) { p.circle(188 + i * 8, 80, 2, i % 2 ? P.lamp : P.device); }
  p.mark('rec', 221, 92);
  p.rect(182, 134, 54, 4, P.wood); p.rect(182, 134, 54, 1, P.woodHi); p.rect(186, 138, 4, 22, P.wood); p.rect(228, 138, 4, 22, P.wood);
  p.rect(194, 129, 6, 5, P.colHi); p.rect(204, 130, 3, 4, P.fabric); p.rect(214, 129, 8, 5, P.col);
  // one bulb on a cord over the rail (Room.js draws it lit, and turns it off)
  p.rect(250, 18, 1, 10, P.device); p.mark('bulb', 250, 30); p.mark('cord', 256, 28);
  r();
  return p;
}
