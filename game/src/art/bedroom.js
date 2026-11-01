// Episode 4, the bedroom: the dark heart of the house. The lights are off; the cameras only see
// when they flash. A clock that strikes covers her noise. His bag waits under the fallen stairs,
// and pulling it free brings the floor down behind her. At the end of the blood, the bedroom.
import { Painter, rng, flat } from './painter.js';
import { lyingFigure } from './sprites.js';

export const TILE = 16, GROUND = 160;
const T = TILE, G = GROUND;
export const BX = 88 * T; // the bedroom's left wall

// a dark red for the trail, made from each look's own hazard red
export function bloodOf(P) {
  const h = flat(P.hazard), mix = (i, t) => Math.round(parseInt(h.slice(i, i + 2), 16) * t);
  return '#' + [1, 3, 5].map(i => mix(i, 0.46).toString(16).padStart(2, '0')).join('');
}

export const LEVEL = {
  w: 108, h: 12,
  start: { x: 2 * T, y: G - 14 },
  door: { x: 85 * T + 4, y: G - 34, w: 22, h: 34 },          // the bedroom doors
  sideDoor: { x: 12 * T + 4, y: G - 28, w: 14, h: 28 },       // the wardrobe, optional
  // flash cameras: they see only at the flash. Two clicks warn first (lead seconds).
  // kind ceiling turns between 35 and 145 degrees; kind wall between 150 and 200.
  cameras: [
    { id: 'landing camera', kind: 'ceiling', x: 9 * T + 8, y: 18, aim: 96, half: 17, range: 175, period: 2.8, phase: 1.6 },
    { id: 'hall camera', kind: 'ceiling', x: 18 * T + 8, y: 18, aim: 98, half: 15, range: 175, period: 2.4, phase: 1.0 },
    { id: 'arch camera', kind: 'wall', x: 33 * T - 4, y: 116, aim: 170, half: 9, range: 240, period: 3.0, phase: 0.4 },
    { id: 'clock room camera', kind: 'ceiling', x: 41 * T, y: 18, aim: 90, half: 25, range: 175, period: 3.0, phase: 2.4 },
    { id: 'billiard camera', kind: 'ceiling', x: 49 * T, y: 18, aim: 90, half: 25, range: 175, period: 3.0, phase: 2.9 }
  ],
  lead: 0.5,
  caught: 0.5, // seconds from a flash that catches her to the strike
  hear: 230,   // how far a camera hears a noise
  // floors that give her away when she runs on them
  noisy: [{ x0: 296, x1: 331, kind: 'boards' }, { x0: 37 * T, x1: 53 * T, kind: 'glass' }],
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
  bag: { x: 59 * T, wall: { id: 'fallen stairs', x: 976, y: 92, w: 24, h: 68 }, low: { id: 'rubble', x: 972, y: 150, w: 34, h: 10 } },
  // the floor gives way behind her once the bag is out
  collapse: { from: 54 * T, stop: 83 * T, fromTile: 54, lastTile: 82 },
  // things that happen ahead of her during the run
  run: {
    gaps: [{ t0: 67, t1: 68, at: 67 * T - 76 }, { t0: 79, t1: 80, at: 79 * T - 80 }],
    slab: { x: 1132, w: 34, top: 96, bottom: 150, at: 1132 - 84, warn: 0.5 },
    step: { id: 'step', x: 76 * T, y: 146, w: 46, h: 14 }
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
      out.push({ x: Math.round(x), y: G - 1, w: 1 + (r() < 0.3 + k * 0.4 ? 1 : 0) });
      if (r() < 0.12 + k * 0.3) out.push({ x: Math.round(x + 2 + r() * 3), y: G - 1, w: 1 });
      if (k > 0.85 && r() < 0.3) out.push({ x: Math.round(x - 3), y: G - 1, w: 4 }); // smears
    }
    x += 5 + r() * (14 - k * 9);
  }
  return out;
}

// He sits on the floor against the foot of the bed, facing left. One leg ends at the knee in a
// dark wrap. Nothing gory: the wrap and a stain under it say it.
export function paintBrother(P, dead) {
  const p = new Painter(26, 22), x = 1, y = 22, sk = P.kid, sh = P.kidLo;
  // the long leg, out along the floor, and its boot
  p.rect(x + 2, y - 3, 13, 3, P.sibLo); p.rect(x, y - 6, 2, 6, P.device); p.px(x + 1, y - 7, P.device);
  // the other thigh, raised, ending in the wrap
  p.rect(x + 8, y - 7, 8, 3, P.sibLo); p.rect(x + 6, y - 7, 2, 3, P.colLo); p.px(x + 6, y - 5, P.fabricLo); p.px(x + 7, y - 4, P.fabricLo);
  // the jacket, his back against the bed
  p.rect(x + 15, y - 14, 7, 11, P.sib); p.rect(x + 20, y - 13, 1, 9, P.sibHi); p.rect(x + 15, y - 4, 7, 1, P.sibLo);
  // an arm across his stomach, a hand pressed to it
  p.rect(x + 13, y - 10, 4, 2, P.sib); p.rect(x + 11, y - 10, 2, 2, sk);
  if (!dead) {
    // head back against the mattress, eyes on the door she came in by
    p.rect(x + 16, y - 20, 5, 6, sk); p.rect(x + 16, y - 21, 6, 2, P.hair); p.rect(x + 20, y - 20, 2, 5, P.hair);
    p.px(x + 17, y - 18, P.hair); p.px(x + 16, y - 16, sh);
  } else {
    // dropped forward
    p.rect(x + 13, y - 17, 5, 5, sk); p.rect(x + 13, y - 18, 6, 2, P.hair); p.rect(x + 17, y - 17, 2, 4, P.hair); p.px(x + 13, y - 14, sh);
  }
  return p;
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
  crack(p, P.crack, 70 * T, 24, 110, 7); crack(p, P.crack, 80 * T, 30, 100, 9);
  // the threshold before the bedroom: stone, it does not fall
  p.rect(84 * T, G, 3 * T, 20, P.colLo); p.rect(84 * T, G, 3 * T, 1, P.col); for (let x = 84 * T; x < 87 * T; x += 12) p.rect(x, G + 1, 1, 19, P.crack);
  // the bedroom doors: tall, gilded, a line of cold light under them
  const D = LEVEL.door;
  p.rect(D.x - 5, D.y - 8, D.w + 10, D.h + 8, P.goldLo); p.rect(D.x - 3, D.y - 6, D.w + 6, 4, P.gold);
  p.rect(D.x, D.y, D.w, D.h, P.wood); p.rect(D.x + D.w / 2, D.y, 1, D.h, P.crack);
  p.rect(D.x + 2, D.y + 3, 7, 12, P.woodHi); p.rect(D.x + D.w - 9, D.y + 3, 7, 12, P.woodHi); p.rect(D.x + 2, D.y + 18, 7, 12, P.woodHi); p.rect(D.x + D.w - 9, D.y + 18, 7, 12, P.woodHi);
  p.px(D.x + D.w / 2 - 2, D.y + 17, P.gold); p.px(D.x + D.w / 2 + 2, D.y + 17, P.gold);
  p.glowRect(D.x, G - 1, D.w, 1, P.voidEdge, 0.7);
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

  // old remains where the cameras look, from seasons before hers
  [[11 * T, 3], [24 * T + 4, 2], [46 * T, 3]].forEach(([x, s]) => lyingFigure(p, P, x, G, s));
  // camera mounts are painted; the cameras themselves are live
  LEVEL.cameras.forEach(c => camMount(p, P, c));
  // the blood trail, painted dark; it is drawn again, faintly, over the dark
  trail().forEach(d => p.rect(d.x, d.y, d.w, 1, blood));
  return p;
}

// The wardrobe off the hall (a side room): rails of her jacket, photos, a mirror with a light.
export function paintWardrobe(P) {
  const p = new Painter(320, 180), r = rng(12);
  p.rect(0, 0, 320, 180, P.wallLo);
  p.rect(0, 0, 320, 18, P.void); p.rect(0, 18, 320, 2, P.wood);
  for (let x = 0; x < 320; x += 20) p.rect(x, 20, 1, 140, P.wallLine);
  p.rect(0, G, 320, 20, P.wood); p.rect(0, G, 320, 1, P.woodHi); for (let x = 0; x < 320; x += 16) p.rect(x, G + 2, 1, 18, P.crack);
  p.rect(18, G - 30, 16, 30, P.wall); p.rect(19, G - 29, 14, 29, P.wallHi); p.px(30, G - 15, P.gold); p.glowRect(14, G - 2, 24, 2, P.lamp, 0.15);
  // a rail of jackets, all hers
  p.rect(56, 56, 118, 2, P.colLo); p.rect(56, 56, 2, 104, P.device); p.rect(172, 56, 2, 104, P.device);
  for (let i = 0; i < 9; i++) {
    const x = 62 + i * 12;
    p.rect(x + 3, 58, 1, 3, P.colLo); p.poly([[x, 62], [x + 8, 62], [x + 9, 92], [x - 1, 92]], P.kid); p.rect(x + 3, 62, 2, 28, P.kidLo); p.px(x + 1, 74, P.kidLo);
    p.rect(x, 92, 9, 1, P.kidLo); p.rect(x + 7, 66, 2, 3, P.colHi); // a tag
  }
  // shoes under the rail, worn down the same way
  for (let i = 0; i < 8; i++) { const x = 62 + i * 13; p.rect(x, G - 3, 6, 3, P.kidLo); p.px(x, G - 1, P.crack); }
  // a board of photos, all of her
  p.rect(186, 40, 56, 48, P.woodHi); p.rect(188, 42, 52, 44, P.wood);
  for (let i = 0; i < 6; i++) { const x = 192 + (i % 3) * 16, y = 46 + Math.floor(i / 3) * 20; p.rect(x, y, 12, 15, P.colHi); p.rect(x + 1, y + 1, 10, 9, P.skyLow); p.rect(x + 5, y + 3, 2, 2, P.kid); p.rect(x + 4, y + 5, 4, 5, P.kid); p.rect(x + 1, y + 11, 10, 1, P.hazard); p.px(x + 6, y, P.led); }
  // a mirror ringed with bulbs, half of them dead, a red light behind the glass
  p.rect(252, 46, 46, 62, P.goldLo); p.rect(256, 50, 38, 54, P.glass); p.line(258, 98, 270, 60, P.glassLit);
  for (let i = 0; i < 6; i++) { p.circle(254 + i * 8, 44, 2, i % 2 ? P.lamp : P.device); p.circle(254 + i * 8, 110, 2, i % 3 ? P.device : P.lamp); }
  p.mark('rec', 287, 56);
  p.rect(248, 112, 54, 4, P.wood); p.rect(248, 112, 54, 1, P.woodHi); p.rect(252, 116, 4, 44, P.wood); p.rect(294, 116, 4, 44, P.wood);
  p.rect(260, 106, 6, 6, P.colHi); p.rect(270, 108, 3, 4, P.fabric); p.rect(280, 107, 8, 5, P.col);
  // one bulb
  p.rect(150, 20, 1, 10, P.device); p.circle(150, 32, 3, P.lamp); p.glowPoly([[146, 34], [154, 34], [220, G], [80, G]], P.lamp, 0.06);
  r();
  return p;
}
