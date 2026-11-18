// Episode 2, the gallery: level layout and painted art. Rebuilt Nov 17 (final pass) as a two
// storey hall, climbed and crossed in five short sections with one new idea each:
//   A the entrance hall: the robot, the drawer with the glasses, the staff door, the light switch
//   B the broken grand stair: a ceiling camera sweeps it; the desk on the landing is cover
//   C the atrium: ride two swinging chandeliers over the drop (dust sheets break a fall, a little)
//   D the worn gallery: a floor polisher that bumps, boards that give way, the broken camera that
//     keeps looking up at the Moon, a chandelier that drops
//   E the laser hall: the house's own laser, low or high; the door at the end
// Art: flat palette colors, hard edges, dithered light, 1 px outlines on what she can touch.
import { Painter, rng } from './painter.js';
import { checkerPoly } from './estate.js';

export const TILE = 16;
const T = TILE;
export const ROWS = { floor: 21, mezz: 13 };
export const GROUND = ROWS.floor * T;   // the ground floor, y 336
export const MEZZ = ROWS.mezz * T;      // the upper floor, y 208
export const LEVEL = {
  w: 90, h: 22,
  start: { x: 2 * T, y: GROUND - 14 },
  door: { x: 87 * T + 2, y: GROUND - 32, w: 20, h: 32 },
  // a sideboard with two drawers; the glasses are in the left one, and only J finds them
  cabinet: { x0: 14 * T, x1: 17 * T, top: 20 * T, drawer: { x: 14 * T + 5, y: GROUND - 13, w: 17, h: 5 } },
  staffDoor: { x: 8 * T + 2, y: GROUND - 28, w: 14, h: 28 },
  lightSwitch: { x: 11 * T + 8, y: GROUND - 26 },
  portrait: { x: 2 * T + 4, y: GROUND - 60, w: 28, h: 36 },  // the man in gold, eyes that follow
  hallLamps: [{ x: 6 * T + 8, y: 196 }, { x: 17 * T + 8, y: 196 }],  // the chandeliers the switch turns off
  robot: { x0: 3 * T, x1: 13 * T, speed: 16 },
  // C: two chandeliers she rides over the atrium (anchor, chain length, swing)
  swings: [{ x: 41 * T, y: 16, len: 165, amp: 30, period: 3.0, phase: 0 }, { x: 50 * T + 6, y: 16, len: 165, amp: 30, period: 3.0, phase: 0.5 }],
  pit: { x0: 37 * T, x1: 54 * T },
  // D: a floor polisher on the upper floor, boards that give way, a chandelier that drops
  polisher: { x0: 56 * T + 6, x1: 59 * T + 6, speed: 26 },  // clear of the top of the atrium wall (N lands there)
  boards: [{ x: 60 * T, y: MEZZ, w: 32 }, { x: 62 * T, y: MEZZ, w: 32 }],
  dropper: { x: 69 * T + 8, hang: 150, warn: 0.45, footprint: 14 },
  // solid things off the grid: none. The dust sheets on the atrium floor are soft cloth heaped
  // against the back of the pit (drawn dark, behind her): she walks through them, no ledge
  props: [],
  sheets: { x: 37 * T + 3, w: 130 },
  // furniture with physics (core/props.js piece), y the floor under it: a side table with a gold
  // vase and a hall chair between the sideboard and the stair (clear of the tape mark at 19 T;
  // the chair has room to go over toward the stair),
  // and, down in the atrium, an armchair and a table under dust sheets (things to climb out on)
  furniture: [
    { kind: 'table', id: 'hall table', x: 17 * T + 2, y: ROWS.floor * T, w: 16, tone: 'wood', loose: [{ kind: 'vase', dx: 6 }] },
    { kind: 'chair', id: 'hall chair', x: 18 * T + 4, y: ROWS.floor * T, back: -1, tone: 'gold' },
    { kind: 'chair', id: 'sheeted chair', x: 39 * T + 8, y: ROWS.floor * T, back: -1, tone: 'wood', cloth: 'boneLo' },
    { kind: 'table', id: 'sheeted table', x: 41 * T + 4, y: ROWS.floor * T, w: 26, tone: 'wood', cloth: 'boneLo', loose: [{ kind: 'candle', dx: 11 }] }
  ],
  camLock: 0.55, // cameras take a little longer than lamps to lock on
  cameras: [
    // sweep: a smooth pan between two angles (degrees, y down), over the broken stair
    { id: 'stair camera', kind: 'sweep', x: 26 * T + 8, y: 20, a0: 58, a1: 122, period: 5.0, phase: 0.75, half: 13, range: 280 },
    // step: a broken servo that jumps between aims and holds each one. Between sweeps it turns
    // up to the hole in the roof and stares at the Moon.
    { id: 'broken camera', kind: 'step', x: 66 * T + 8, y: 150, half: 12, range: 160,
      steps: [[245, 2.0], [170, 0.8], [150, 0.8], [130, 1.0], [150, 0.7], [170, 0.7]] }
  ],
  // The laser: shots are sets of beam heights. "low" must be jumped, "high" must be crouched under.
  laser: {
    id: 'laser', x0: 77 * T, x1: 89 * T,
    shots: { low: [GROUND - 4], high: [GROUND - 32, GROUND - 11] },
    order: ['low', 'high', 'low', 'low', 'high', 'low', 'high', 'high'],
    first: 1.2, idle: 0.9, tell: 0.7, charge: 0.5, fire: 0.4
  },
  hole: { x0: 58 * T, x1: 63 * T },
  // the show's tape marks (checkpoints), [x where she stands, the floor's y]: the foot of the
  // stair, under the desk on the landing, past the atrium, past the boards and the broken camera,
  // before the laser hall
  marks: [[19 * T, ROWS.floor * T], [24 * T, 18 * T], [54 * T, ROWS.mezz * T], [67 * T, ROWS.mezz * T], [75 * T, 18 * T]],
  // gold left out on the path, [x, the floor's y], always on a floor: the sideboard, the landing
  // desk (in the stair camera's sweep), the lip she jumps for the first chandelier from, the pit
  // floor by the far wall, the dust sheets, by the polisher, on the boards that give way, under the
  // chandelier that drops, in the laser hall
  gold: [[15 * T + 8, 20 * T], [25 * T, 16 * T], [36 * T + 8, MEZZ], [53 * T, GROUND], [46 * T, ROWS.floor * T], [57 * T, ROWS.mezz * T], [61 * T, ROWS.mezz * T], [69 * T + 8, ROWS.mezz * T], [82 * T, ROWS.floor * T]],
  // where N puts her in story mode: just short of each section's hazard
  // (B: under the desk on the landing; D: on the far wall's top, then past the broken camera;
  // the last: at the door itself, where W goes in; one more N goes through it)
  skip: [[19, ROWS.floor], [24, 18], [54, ROWS.mezz], [67, ROWS.mezz], [75, 18], [87.25, ROWS.floor]]
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

// Materials: m marble floor, c ceiling, w wall mass, x stair stone, d desk, b sideboard,
// k upper floor (boards over joists), e the laser hall's end wall.
export function buildMap() {
  const W = LEVEL.w, H = LEVEL.h, m = [], mat = [];
  for (let y = 0; y < H; y++) { m.push(new Array(W).fill(0)); mat.push(new Array(W).fill('.')); }
  const solid = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y] && x >= 0 && x < W) { m[y][x] = 1; mat[y][x] = c; } };
  const clear = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { m[y][x] = 0; mat[y][x] = '.'; } };
  const F = ROWS.floor, M = ROWS.mezz;
  solid(0, F, W - 1, H - 1, 'm');                 // the ground floor
  solid(0, 0, W - 1, 0, 'c'); clear(58, 0, 62, 0); // the ceiling, and the hole in the roof
  solid(0, 1, 0, F - 1, 'w');                     // the front door behind her
  solid(14, 20, 16, 20, 'b');                     // A: the sideboard
  // B: the broken grand stair: three steps, a landing with a desk on it, two hanging steps, a gap
  solid(20, 20, 20, 20, 'x'); solid(21, 19, 21, 20, 'x'); solid(22, 18, 27, 20, 'x');
  solid(24, 16, 25, 16, 'd');
  solid(28, 16, 29, 16, 'x'); solid(30, 14, 31, 14, 'x');
  solid(33, M, 36, M, 'k');                       // the near upper floor, open under it
  solid(54, 14, 54, F - 1, 'w');                  // C: the atrium's far wall
  // D: the far upper floor is thick: a wall mass with a pocket under the boards that give way
  solid(54, M, 72, F - 1, 'w'); clear(60, M, 63, 15); for (let x = 54; x <= 72; x++) mat[M][x] = m[M][x] ? 'k' : '.';
  // the broken stair down into the laser hall
  solid(73, 16, 74, F - 1, 'x'); solid(75, 18, 76, F - 1, 'x');
  solid(89, 1, 89, F - 1, 'e');                   // E: the end wall with the laser ports
  return { W, H, m, mat };
}

function glint(p, P, x, y) { p.px(x, y, P.glint); p.px(x - 1, y, P.goldHi); p.px(x + 1, y, P.goldHi); p.px(x, y - 1, P.goldHi); p.px(x, y + 1, P.goldHi); p.mark('glint', x, y); }
// The sitters, drawn by hand: each is 3 tones on its own ground with a 1 px ash0 outline, and a
// frame gets one by its place in the hang list (never at random), so no two neighbors match.
//   man: a man in profile   lady: a woman with a tall hairdo   dog: the family dog, sitting
//   house: a landscape with this house in it (and the Moon)   empty: an empty frame, only a nail
//   gold: the man in gold, front on (his eyes are drawn live, they follow her)
const SITTERS = ['man', 'lady', 'house', 'dog', 'lady', 'man', 'empty'];
function parts(p, list) { const O = '#0e0f12'; list.forEach(([x, y, w, h]) => p.rect(x - 1, y - 1, w + 2, h + 2, O)); list.forEach(([x, y, w, h, c]) => p.rect(x, y, w, h, c)); }
function portrait(p, P, x, y, w, h, kind, worn, flip) {
  const O = '#0e0f12', R = Math.round, cx = R(x + w / 2), hy = R(y + h * 0.36), hr = Math.max(3, R(w * 0.16));
  p.rect(x - 3, y - 3, w + 6, h + 6, O); p.rect(x - 2, y - 2, w + 4, h + 4, P.goldLo); p.rect(x - 1, y - 1, w + 2, 1, P.gold); p.rect(x - 1, y - 1, 1, h + 2, P.gold);
  const head = (hx, c) => { p.circle(hx, hy, hr + 1, O); p.circle(hx, hy, hr, c); };
  // a disc of pixels inside the head where test(dx, dy) holds (hair that keeps to the head's edge)
  const within = (hx, c, test) => { for (let dy = -hr; dy <= hr; dy++) for (let dx = -hr; dx <= hr; dx++) if (dx * dx + dy * dy <= hr * hr + hr && test(dx, dy)) p.px(hx + dx, hy + dy, c); };
  if (kind === 'man') {
    // profile: a black coat lit on one side, a white shirt front, dark hair over the top and back
    const d = flip ? -1 : 1, sy = R(y + h * 0.58), sx = R(x + w * 0.16), sw = R(w * 0.68);
    p.rect(x, y, w, h, P.glass);
    parts(p, [[sx + 2, sy, sw - 4, 2, P.hair], [sx, sy + 2, sw, y + h - sy - 2, P.hair]]);
    p.rect(d > 0 ? sx + sw - 2 : sx + 1, sy + 3, 1, y + h - sy - 3, P.rubble);
    p.rect(cx - 1 + d, sy, 3, 3, P.colHi); p.px(cx + d, sy + 3, P.colHi); p.px(cx + d, sy + 1, P.goldLo);
    head(cx, P.kidLo);
    within(cx, P.hair, (dx, dy) => dy < -hr / 2 || (dx * d < 0 && dy < 2));
    p.px(cx - d, hy + 1, P.colLo);                                   // the ear
    p.px(cx + d * (hr - 1), hy - 1, O);                              // the eye
    p.px(cx + d * (hr + 1), hy, P.kidLo); p.px(cx + d * (hr + 2), hy, O); // the nose
    p.rect(cx - 1, hy + hr, 3, Math.max(1, sy - hy - hr), P.kidLo);
  } else if (kind === 'lady') {
    // a woman with her hair piled high, pearls, a gold gown
    p.rect(x, y, w, h, P.wallLine);
    const top = Math.max(y + hr + 1, R(y + h * 0.06) + hr), bx = R(x + w * 0.3), bw = R(w * 0.4), sy = R(y + h * 0.66), kx = R(x + w * 0.2), kw = R(w * 0.6);
    p.circle(cx, top, hr + 1, O); p.rect(cx - hr - 1, top, hr * 2 + 3, hy - top, O);
    parts(p, [[bx, sy - 2, bw, 3, P.gold], [kx, sy + 1, kw, y + h - sy - 1, P.gold]]);
    p.rect(kx, sy + 1, 2, y + h - sy - 1, P.goldLo); p.rect(bx, sy - 2, bw, 1, P.goldHi);
    p.circle(cx, top, hr, P.rubbleHi); p.rect(cx - hr, top, hr * 2 + 1, hy - top, P.rubbleHi); p.rect(cx + hr - 1, top, 2, hy - top, P.rubble);
    head(cx, P.kidLo); within(cx, P.rubbleHi, (dx, dy) => dy < -hr / 2);
    p.px(cx - 1, hy, O); p.px(cx + 2, hy, O);
    p.rect(cx - 1, hy + hr, 3, Math.max(1, sy - 2 - hy - hr), P.kidLo);
    for (let i = -2; i <= 2; i += 2) p.px(cx + i, sy - 3, P.colHi);
  } else if (kind === 'dog') {
    // the family dog, sitting, facing left: a grey coat, a pale chest and legs, a dark ear,
    // a gold collar
    p.rect(x, y, w, h, P.glass);
    const hx = R(x + w * 0.62), hyy = R(y + h * 0.78), rr = Math.max(3, R(w * 0.2));
    const chest = [R(x + w * 0.28), R(y + h * 0.42), Math.max(4, R(w * 0.24)), y + h - 1 - R(y + h * 0.42)];
    const headR = [R(x + w * 0.24), R(y + h * 0.22), Math.max(5, R(w * 0.28)), Math.max(4, R(h * 0.2))];
    const snout = [R(x + w * 0.1), R(y + h * 0.3), Math.max(3, R(w * 0.16)), Math.max(2, R(h * 0.08))];
    p.circle(hx, hyy, rr + 1, O);
    parts(p, [[...chest, P.colLo], [...headR, P.colLo], [...snout, P.col]]);
    p.circle(hx, hyy, rr, P.colLo); p.rect(hx - rr, hyy, rr * 2 + 1, y + h - 1 - hyy, P.colLo);
    p.rect(chest[0], chest[1] + 2, 2, chest[3] - 2, P.col); p.rect(chest[0] + 3, R(y + h * 0.7), 2, y + h - 1 - R(y + h * 0.7), P.col);
    p.rect(headR[0] + headR[2] - 3, headR[1], 3, Math.max(4, R(h * 0.2)) + 2, P.rubble);
    p.px(headR[0] + 2, headR[1] + 2, O); p.px(snout[0], snout[1], O);
    p.rect(chest[0], chest[1], chest[2], 1, P.gold);
  } else if (kind === 'house') {
    // the house at night on its hill, a lit window or two, the Moon up in the corner
    const gy = R(y + h * 0.62);
    p.rect(x, y, w, h, P.skyTop); p.rect(x, gy, w, y + h - gy, P.rubble); p.rect(x, gy, w, 1, P.rubbleHi);
    const hw = Math.max(8, R(w * 0.5)), hx = cx - R(hw / 2), hh = Math.max(4, R(h * 0.18));
    parts(p, [[hx, gy - hh, hw, hh, P.wood]]);
    p.circle(cx, gy - hh, Math.max(2, R(hw / 5)), P.gold); p.rect(hx, gy - hh, hw, 1, P.woodHi);
    for (let i = hx + 2; i < hx + hw - 1; i += 3) p.px(i, gy - 2, (i & 1) ? P.lit : P.wallLo);
    p.px(x + w - 4, y + 3, P.moon); p.px(x + w - 5, y + 3, P.moon); p.px(x + w - 4, y + 4, P.moonShade);
  } else if (kind === 'empty') {
    // nobody: the wall shows through, and the nail it hung from
    p.rect(x, y, w, h, P.wallLo); p.px(cx, y + 4, P.colLo); p.px(cx, y + 5, O);
  } else {
    // the man in gold, front on: a gold coat with buttons, a white collar
    p.rect(x, y, w, h, P.wallLine);
    parts(p, [[R(x + w * 0.18), R(y + h * 0.58), R(w * 0.64), h - R(h * 0.58), P.gold]]);
    p.rect(R(x + w * 0.18), R(y + h * 0.58), 2, h - R(h * 0.58), P.goldLo);
    p.rect(cx - 2, R(y + h * 0.58), 5, 2, P.colHi); for (let i = 0; i < 3; i++) p.px(cx, R(y + h * 0.68) + i * 3, P.goldHi);
    head(cx, P.kidLo); p.rect(cx - hr, hy - hr, hr * 2 + 1, 2, P.hair);
  }
  // a worn one has a tear across the canvas, top right to the middle
  if (worn) for (let i = 0; i < Math.min(w, h) / 2; i++) p.px(x + w - 3 - i, y + 2 + i + (i >> 2), O);
  glint(p, P, x - 1, y - 1);
}
function sconceAt(p, P, x, y, lit) { p.rect(x - 1, y, 3, 6, P.goldLo); p.rect(x - 3, y - 4, 7, 4, '#0e0f12'); p.rect(x - 2, y - 3, 5, 3, lit ? P.lamp : P.device); if (lit) { p.px(x, y - 4, P.goldHi); p.mark('sconce', x, y - 2); checkerPoly(p, [[x - 3, y + 6], [x + 4, y + 6], [x + 8, y + 22], [x - 7, y + 22]], P.wallHi); } else p.px(x, y - 4, P.crack); }
function crack(p, c, x, y, len, seed, dir) { const r = rng(seed); let cx = x, cy = y; for (let i = 0; i < len; i++) { p.px(cx, cy, c); cy += 1; cx += (r() < 0.5 ? -1 : 1) * (r() < 0.6 ? 1 : 0) + (dir || 0) * (r() < 0.3 ? 1 : 0); if (r() < 0.12) p.px(cx + 1, cy, c); } }

// Solid tiles by material, with a light top edge where she stands and an ash0 outline on open sides.
function paintTiles(p, P, map) {
  const O = '#0e0f12', open = (x, y) => y >= 0 && y < map.H && x >= 0 && x < map.W && !map.m[y][x];
  for (let ty = 0; ty < map.H; ty++) for (let tx = 0; tx < map.W; tx++) {
    if (!map.m[ty][tx]) continue;
    const c = map.mat[ty][tx], x = tx * T, y = ty * T, up = open(tx, ty - 1), dn = open(tx, ty + 1), lf = open(tx - 1, ty), rt = open(tx + 1, ty);
    if (c === 'm') { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) p.rect(x + i * 8, y + j * 8, 8, 8, ((tx * 2 + i + j) & 1) ? P.floor : P.floorHi); if (up) { p.rect(x, y, T, 1, P.colHi); p.rect(x, y + 1, T, 1, P.floorLo); } continue; }
    if (c === 'c') { p.rect(x, y, T, T, P.wallLo); p.rect(x + 2, y + 3, 12, 9, P.wallLine); p.px(x + 8, y + 7, P.goldLo); if (dn) p.rect(x, y + T - 2, T, 2, P.goldLo); continue; }
    if (c === 'e') { p.rect(x, y, T, T, P.device); p.rect(x, y, 1, T, O); p.rect(x + 3, y, 1, T, P.rubble); continue; }
    if (c === 'w') { p.rect(x, y, T, T, P.wallLo); for (let yy = 0; yy < T; yy += 8) { p.rect(x, y + yy, T, 1, P.wallLine); p.rect(x + ((ty * 2 + yy / 8) & 1 ? 0 : 8), y + yy, 1, 8, P.wallLine); } }
    else if (c === 'k') { p.rect(x, y, T, T, P.wood); p.rect(x, y + 4, T, 1, P.wallLo); for (let i = 3; i < T; i += 6) p.rect(x + i, y + 5, 1, T - 5, P.wallLo); if (up) { p.rect(x, y, T, 2, P.woodHi); p.rect(x, y, T, 1, P.gold); } }
    else if (c === 'x') {
      // marble steps and plinths, like the balustrades: a pale face lit from the left, a recessed
      // panel every two tiles, a bone top edge over a gold moulding, a gold base line on the floor
      const lf2 = !map.m[ty][tx - 1] || map.mat[ty][tx - 1] !== 'x', dn2 = map.mat[ty + 1] && map.mat[ty + 1][tx] !== 'x';
      p.rect(x, y, T, T, P.col);
      if (lf2) p.rect(x + 1, y, 1, T, P.colHi);
      if (!(tx & 1) && !lf2) p.rect(x, y, 1, T, P.colLo);
      if (!(ty & 1) && !up) p.rect(x, y, T, 1, P.colLo);
      if (up) { p.rect(x, y, T, 1, P.colHi); p.rect(x, y + 1, T, 1, P.col); p.rect(x, y + 2, T, 1, P.goldLo); p.rect(x, y + 3, T, 1, P.colLo); }
      if (dn2) { p.rect(x, y + T - 3, T, 2, P.colLo); p.rect(x, y + T - 1, T, 1, P.goldLo); }
    }
    else if (c === 'd') { p.rect(x, y, T, 6, P.wood); if (up) { p.rect(x, y, T, 1, P.woodHi); } p.rect(x, y + 6, T, 1, P.goldLo); }
    else if (c === 'b') { p.rect(x, y, T, T, P.wood); if (up) { p.rect(x, y, T, 2, P.woodHi); p.rect(x, y, T, 1, P.goldHi); } p.rect(x, y + T - 2, T, 1, P.goldLo); }
    if (lf) p.rect(x, y, 1, c === 'd' ? 7 : T, O); if (rt) p.rect(x + T - 1, y, 1, c === 'd' ? 7 : T, O); if (dn && c !== 'd') p.rect(x, y + T - 1, T, 1, O); if (c === 'd' && dn) p.rect(x, y + 7, T, 1, O);
  }
}

export function paintLevel(P, map, dark) {
  const W = LEVEL.w * T, H = LEVEL.h * T, G = GROUND, M = MEZZ, p = new Painter(W, H), r = rng(77), O = '#0e0f12';
  const wall = dark ? P.wallLo : P.wall, wallHi = dark ? P.wallLine : P.wallHi;
  const sconce = (p0, P0, x, y, lit) => sconceAt(p0, P0, x, y, lit && !dark);
  // walls, pilasters, a cornice under the ceiling, a dado rail, wainscot
  p.rect(0, 0, W, H, wall);
  for (let x = 0; x < 88 * T; x += 48) { p.rect(x + 21, 22, 6, G - 40, wallHi); p.rect(x + 23, 22, 1, G - 40, P.wallLine); p.rect(x + 20, 22, 8, 2, P.goldLo); p.rect(x + 20, G - 20, 8, 2, P.goldLo); }
  p.rect(0, 16, W, 6, P.colHi); p.rect(0, 16, W, 1, P.gold); p.rect(0, 21, W, 1, P.goldLo); for (let x = 2; x < 89 * T; x += 6) p.rect(x, 18, 2, 2, P.gold);
  p.rect(0, G - 22, W, 22, P.wallLo); p.rect(0, G - 22, W, 1, P.goldLo); for (let x = 8; x < 89 * T - 20; x += 32) { p.rect(x, G - 18, 20, 14, P.wallLine); p.rect(x + 1, G - 17, 18, 1, wallHi); }
  // upper floor wainscot and rail
  p.rect(28 * T, M - 18, 45 * T, 18, P.wallLo); p.rect(28 * T, M - 18, 45 * T, 1, P.goldLo);
  // ---- A, the entrance hall: two storeys of portraits hung salon style, high up the walls
  const hang = [[3, 40, 26, 34, 1], [6, 36, 22, 28, 2], [9, 46, 30, 40, 3], [12, 40, 24, 30, 4], [16, 38, 28, 36, 5], [5, 112, 26, 34, 6], [10, 108, 34, 44, 7], [15, 112, 26, 34, 8], [18, 60, 20, 26, 9]];
  let n = 0; const sitter = () => SITTERS[n++ % SITTERS.length];
  hang.forEach(([tx, y, w, h]) => portrait(p, P, tx * T, y, w, h, sitter(), false, n & 1));
  const PT = LEVEL.portrait; portrait(p, P, PT.x, PT.y, PT.w, PT.h, 'gold', false);
  [[5, 238, 22, 28], [10, 230, 26, 34], [13, 244, 18, 22], [17, 236, 24, 30], [8, 176, 30, 40], [14, 170, 22, 28]].forEach(([tx, y, w, h]) => portrait(p, P, tx * T + 4, y, w, h, sitter(), false, n & 1));
  sconce(p, P, 4 * T + 8, 286, true); sconce(p, P, 12 * T + 8, 286, true); sconce(p, P, 18 * T + 8, 286, true);
  // the front door she came in by
  p.rect(T, G - 48, 18, 48, P.goldLo); p.rect(T, G - 44, 15, 44, P.wood); p.rect(T + 3, G - 40, 8, 14, P.woodHi); p.rect(T + 3, G - 20, 8, 14, P.woodHi); p.px(T + 12, G - 22, P.gold);
  // the staff door, plain on purpose
  const SD = LEVEL.staffDoor;
  p.rect(SD.x - 2, SD.y - 2, SD.w + 4, SD.h + 2, O); p.rect(SD.x - 1, SD.y - 1, SD.w + 2, SD.h + 1, P.wallLine); p.rect(SD.x, SD.y, SD.w, SD.h, P.wallLo);
  p.rect(SD.x + SD.w - 4, SD.y + 14, 2, 2, P.goldLo); p.rect(SD.x + 2, SD.y + 4, SD.w - 4, 4, P.colLo); p.rect(SD.x + 3, SD.y + 5, SD.w - 6, 2, P.device);
  // the light switch: a brass plate
  const LS = LEVEL.lightSwitch; p.rect(LS.x - 3, LS.y - 4, 7, 9, O); p.rect(LS.x - 2, LS.y - 3, 5, 7, P.goldLo); p.rect(LS.x - 1, LS.y - 2, 3, 5, P.gold);
  // the sideboard's top things: a vase, a small framed photo
  const CB = LEVEL.cabinet, cx = CB.x0;
  p.rect(cx + 34, G - 26, 6, 10, P.col); p.rect(cx + 35, G - 28, 4, 2, P.colHi); p.rect(cx + 33, G - 32, 2, 4, P.fabric); p.rect(cx + 38, G - 33, 2, 5, P.fabric);
  p.rect(cx + 8, G - 23, 9, 7, P.goldLo); p.rect(cx + 9, G - 22, 7, 5, P.skyLow); p.px(cx + 12, G - 20, P.kidLo);
  // ---- B, the broken stair: banister posts, a lamp on the desk
  for (let i = 0; i < 3; i++) { const x = (20 + i) * T + 6; p.rect(x, G - (i + 1) * T - 18, 2, 18, P.goldLo); }
  p.rect(20 * T + 6, G - 3 * T - 18, 3 * T, 2, P.gold);
  p.rect(24 * T + 4, 16 * T - 8, 6, 8, P.glassLit); p.rect(24 * T + 7, 16 * T - 11, 1, 3, P.goldLo);
  portrait(p, P, 22 * T, 70, 30, 40, sitter(), false, n & 1); portrait(p, P, 27 * T, 110, 24, 30, sitter(), false, n & 1);
  sconce(p, P, 30 * T, 150, true); sconce(p, P, 20 * T, 260, true);
  // ---- C, the atrium: tall, the upper floor's railings at both edges, dust sheets heaped below
  const rail = (x0, x1) => { for (let x = x0; x < x1; x += 5) p.rect(x, M - 12, 2, 12, P.col); p.rect(x0, M - 13, x1 - x0, 2, P.colHi); };
  rail(33 * T, 37 * T - 2); rail(54 * T + 2, 60 * T); rail(64 * T, 73 * T);
  portrait(p, P, 40 * T, 46, 40, 52, 'house', false); portrait(p, P, 46 * T, 60, 30, 38, 'lady', false); portrait(p, P, 51 * T - 4, 44, 26, 34, 'man', true, 1);
  // the dust sheets: soft lumps of cloth heaped at the back of the pit floor (LEVEL.sheets), dark
  // so they read as behind her, rounded tops, a fold or two; not solid. The far end stays bare for
  // the robot's row of bodies
  const SH = LEVEL.sheets;
  for (let x = SH.x, i = 0; x < SH.x + SH.w - 6; i++) {
    const w = Math.min(14 + (i * 7) % 11, SH.x + SH.w - x), h = 4 + (i * 5) % 5;
    // a mound of cloth: each row from the floor up a little narrower, the top row lighter
    for (let j = 0; j < h; j++) {
      const ins = Math.round((j / h) * (j / h) * w * 0.35), y = G - 1 - j, top = j === h - 1;
      p.rect(x + ins, y, w - ins * 2, 1, O);
      if (w - ins * 2 > 2) p.rect(x + ins + 1, y, w - ins * 2 - 2, 1, top ? P.rubble : P.ground);
    }
    p.rect(x + 3 + (i % 4), G - h + 2, 1, h - 2, P.crack); if (w > 16) p.rect(x + w - 6, G - h + 3, 1, h - 3, P.crack);
    x += w - 4;
  }
  // ---- D, the worn upper gallery: stains and cracks, a missing portrait, the hole in the roof
  // pale marks where paintings used to hang: an outline in the wall's light tone, a nail
  [[54 * T + 10, 34, 24, 30], [64 * T + 2, 44, 32, 40], [66 * T + 12, 104, 20, 26], [71 * T - 2, 30, 22, 28], [55 * T + 4, 140, 18, 22]].forEach(([x, y, w, h]) => {
    p.rect(x, y, w, 1, wallHi); p.rect(x, y + h - 1, w, 1, wallHi); p.rect(x, y, 1, h, wallHi); p.rect(x + w - 1, y, 1, h, wallHi);
    p.px(x + (w >> 1), y - 3, P.colLo); p.px(x + (w >> 1), y - 2, O);
  });
  for (let i = 0; i < 10; i++) crack(p, P.crack, 55 * T + i * 26 + r() * 10, 23 + r() * 20, 40 + r() * 70, 9 + i, i % 2 ? 1 : -1);
  p.rect(56 * T, 80, 28, 36, wallHi); p.rect(56 * T + 2, 82, 24, 32, wall); p.px(56 * T + 14, 78, P.goldLo);
  portrait(p, P, 69 * T, 76, 26, 34, 'dog', true);
  const hx0 = LEVEL.hole.x0, hx1 = LEVEL.hole.x1;
  p.rect(hx0, 0, hx1 - hx0, 16, P.skyMid); p.px(hx0 + 12, 4, P.star); p.px(hx0 + 50, 8, P.star); p.px(hx0 + 33, 3, P.star); p.px(hx0 + 70, 6, P.star);
  p.circle(hx0 + 46, 7, 6, O); p.circle(hx0 + 46, 7, 5, P.moon); p.rect(hx0 + 43, 4, 2, 2, P.moonShade); p.px(hx0 + 48, 9, P.moonShade); p.px(hx0 + 47, 6, P.win); // the Moon, and a lit window on it
  for (let x = hx0 - 4; x < hx1 + 4; x += 7) p.rect(x, 12 + (x % 3), 4 + (x % 2), 3, P.wood);
  checkerPoly(p, [[hx0 + 10, 16], [hx1 - 12, 16], [hx1 + 10, M], [hx0 + 14, M]], P.wallHi);
  sconce(p, P, 57 * T, 120, false); sconce(p, P, 70 * T, 120, false);
  // the pocket under the boards: joists and dust
  p.rect(60 * T, M + 2, 64, 30, O); for (let x = 60 * T + 4; x < 64 * T; x += 12) p.rect(x, M + 2, 3, 30, P.wood);
  // ---- E, the laser hall: the same bronze hall to the end, a tall mirror and the last portraits
  // hung high (the beams run low), two lit sconces, ports in the end wall
  const mx = 1282, my = 196, mw = 28, mh = 88;
  p.rect(mx - 3, my - 3, mw + 6, mh + 6, O); p.rect(mx - 2, my - 2, mw + 4, mh + 4, P.goldLo); p.rect(mx - 1, my - 1, mw + 2, 1, P.gold); p.rect(mx - 1, my - 1, 1, mh + 2, P.gold);
  p.rect(mx, my, mw, mh, P.glass); p.rect(mx, my + mh - 20, mw, 20, P.wallLo); p.rect(mx, my + mh - 20, mw, 1, P.goldLo);
  p.line(mx + 4, my + 26, mx + 16, my + 6, P.rubble); p.line(mx + 9, my + 30, mx + 22, my + 9, P.rubble); p.line(mx + 3, my + 16, mx + 10, my + 4, P.colLo);
  glint(p, P, mx - 1, my - 1);
  portrait(p, P, 1236, 212, 24, 30, 'house', false); portrait(p, P, 1331, 206, 26, 34, 'empty', false);
  sconce(p, P, 1272, 200, true); sconce(p, P, 1368, 200, true);
  const D = LEVEL.door;
  p.rect(D.x - 4, D.y - 6, D.w + 8, D.h + 6, P.goldLo); p.rect(D.x, D.y, D.w, D.h, P.wood); p.rect(D.x + D.w / 2, D.y, 1, D.h, P.woodHi);
  p.rect(D.x + 3, D.y + 4, 6, 10, P.woodHi); p.rect(D.x + D.w - 9, D.y + 4, 6, 10, P.woodHi); p.px(D.x + D.w / 2 - 2, D.y + 18, P.gold); p.px(D.x + D.w / 2 + 2, D.y + 18, P.gold);
  crack(p, P.crack, D.x + 4, D.y + 16, 12, 41, 1);

  // ---- the solid world, then what sits on it
  paintTiles(p, P, map);
  // the sideboard front: two drawers, gold pulls
  [[cx + 5, 17], [cx + 26, 17]].forEach(([dx, dw]) => { p.rect(dx, G - 13, dw, 5, P.woodHi); p.rect(dx, G - 9, dw, 1, P.goldLo); p.rect(dx + Math.floor(dw / 2) - 1, G - 11, 2, 1, P.gold); });
  [cx + 1, cx + 45].forEach(x => p.rect(x, G - 2, 2, 2, P.gold));
  // desk legs on the landing
  [24 * T + 1, 26 * T - 3].forEach(x => p.rect(x, 16 * T + 7, 2, 9, P.wood));
  // the laser ports
  const beams = [...new Set([].concat(...Object.values(LEVEL.laser.shots)))];
  beams.forEach(y => { p.rect(89 * T - 3, y - 3, 4, 6, P.device); p.rect(89 * T - 2, y - 1, 2, 2, P.crack); p.rect(LEVEL.laser.x0 - 1, y - 2, 3, 4, P.device); });
  // camera mounts are painted; the cameras themselves are live
  const c0 = LEVEL.cameras[0], c1 = LEVEL.cameras[1];
  p.rect(c0.x - 1, 16, 3, c0.y - 18, P.device); p.rect(c0.x - 4, 16, 9, 2, P.device);
  p.rect(c1.x + 3, c1.y - 2, 6, 3, P.device); p.rect(c1.x + 8, c1.y - 6, 3, 10, P.device);
  return p;
}
