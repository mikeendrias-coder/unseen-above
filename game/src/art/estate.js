// Episode 1, the grounds: level layout (collision and hazards) and the painted art for it.
// The facade runs behind the whole walk, and its styles clash on purpose: a glass wing,
// a baroque dome wing, a colonnade, then the temple front with the door.
import { Painter, rng } from './painter.js';

export const TILE = 16, VIEW_W = 320, VIEW_H = 180, GROUND = 160;
export const LEVEL = {
  w: 112, h: 12,
  gateX: 15 * TILE,
  door: { x: 106 * TILE - 2, y: 112 - 32, w: 20, h: 32 },
  // a service door in the glass wing, to the groundskeeper's room (optional)
  shedDoor: { x: 19 * TILE + 4, y: GROUND - 26, w: 14, h: 26 },
  // his crowbar, dropped just inside the gate
  crowbar: { x: 17 * TILE + 14, y: GROUND },
  // the burnt car outside the wall is solid; she can climb it
  props: [{ id: 'car', x: 120, y: GROUND - 9, w: 34, h: 9 }, { id: 'car roof', x: 126, y: GROUND - 15, w: 20, h: 6 }],
  // at the stairs the grounds are scanned: a wall of light follows her to the door
  scan: { trigger: 96 * TILE, behind: 150, speed: 58 },
  start: { x: 3 * TILE, y: GROUND - 14 },
  // searchlights: base point, sweep between angles (degrees, y down), period in seconds, phase 0..1
  lights: [
    { id: 'garden lamp', x: 37 * TILE + 8, y: 122, a0: 157, a1: 174, period: 4.2, phase: 0.0, half: 6, range: 230 },
    { id: 'west wall lamp', x: 63 * TILE + 8, y: 90, a0: 58, a1: 122, period: 5.0, phase: 0.25, half: 7, range: 200 },
    { id: 'east wall lamp', x: 75 * TILE + 8, y: 90, a0: 70, a1: 135, period: 4.4, phase: 0.7, half: 7, range: 200 },
    { id: 'stair lamp', x: 95 * TILE, y: 58, a0: 25, a1: 72, period: 3.6, phase: 0.1, half: 6, range: 190 },
    { id: 'temple lamp', x: 110 * TILE + 8, y: 58, a0: 104, a1: 150, period: 3.6, phase: 0.6, half: 6, range: 190 }
  ],
  // patrol drones with a downward spotlight
  drones: [
    { id: 'fountain drone', x0: 40 * TILE, x1: 56 * TILE, y: 74, speed: 26, half: 11, range: 120 },
    { id: 'pergola drone', x0: 78 * TILE, x1: 93 * TILE, y: 86, speed: 38, half: 10, range: 110 }
  ]
};

export function buildMap() {
  const W = LEVEL.w, H = LEVEL.h, m = [];
  for (let y = 0; y < H; y++) m.push(new Array(W).fill(0));
  const solid = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y] && x >= 0 && x < W) m[y][x] = 1; };
  solid(0, 10, W - 1, 11);                       // ground
  solid(21, 8, 22, 9); solid(27, 8, 27, 9); solid(32, 8, 33, 9); // hedges (2 tiles: a jump clears them)
  solid(43, 9, 43, 9); solid(51, 9, 51, 9); solid(45, 7, 49, 7); // fountain rim and upper bowl
  solid(60, 8, 60, 9); solid(66, 8, 66, 9); solid(72, 8, 72, 9); // statue plinths
  solid(81, 6, 83, 6); solid(88, 6, 90, 6);      // pergola tops
  solid(96, 9, 96, 9); solid(97, 8, 97, 9); solid(98, 7, 110, 9); // stairs and landing
  solid(111, 0, 111, 9);                         // end wall
  solid(-1, 0, 0, 9);                            // world edge
  return { W, H, m };
}

// ------------------------------------------------------------------ small parts
function glint(p, P, x, y) { p.px(x, y, P.glint); p.px(x - 1, y, P.goldHi); p.px(x + 1, y, P.goldHi); p.px(x, y - 1, P.goldHi); p.px(x, y + 1, P.goldHi); p.mark('glint', x, y); }
function column(p, P, x, top, bottom, w) {
  p.rect(x, top, w, bottom - top, P.col); p.rect(x + 1, top, 1, bottom - top, P.colHi);
  for (let i = 3; i < w - 1; i += 3) p.rect(x + i, top, 1, bottom - top, P.colLo);
  p.rect(x - 1, bottom - 3, w + 2, 3, P.colHi);
  p.rect(x - 2, top - 3, w + 4, 3, P.gold); p.rect(x - 1, top - 1, w + 2, 1, P.goldLo);
}
function chandelierInWindow(p, P, cx, cy) { p.rect(cx, cy - 6, 1, 4, P.goldLo); p.ellipse(cx, cy, 4, 1, P.gold); for (let i = -3; i <= 3; i += 3) p.px(cx + i, cy + 2, P.glint); p.mark('glint', cx, cy + 2); }
function statue(p, P, cx, base) {
  // a gold figure on a plinth top: arm raised, holding a star
  p.rect(cx - 2, base - 14, 5, 10, P.gold); p.rect(cx - 1, base - 18, 3, 4, P.gold); p.rect(cx + 2, base - 22, 1, 9, P.gold);
  p.rect(cx - 3, base - 4, 7, 4, P.goldLo); p.px(cx + 2, base - 23, P.glint); p.rect(cx - 1, base - 13, 1, 8, P.goldHi);
  glint(p, P, cx + 2, base - 24);
}
function hedgeBlock(p, P, x, y, w, h, seed) {
  // clipped topiary in a gold planter, strung with fairy lights
  const planter = 6, body = h - planter;
  p.rect(x - 1, y + body, w + 2, planter, P.goldLo); p.rect(x - 1, y + body, w + 2, 1, P.gold); p.rect(x + 1, y + body + 2, w - 2, 1, P.gold);
  const cx = x + w / 2, rx = Math.floor(w / 2);
  p.rect(x, y + rx, w, body - rx, P.hedge); p.ellipse(cx - 0.5, y + rx, rx, rx, P.hedge);
  p.ellipse(cx - 2, y + rx - 2, Math.max(2, rx - 4), Math.max(2, rx - 5), P.hedgeHi);
  const r = rng(seed); for (let i = 0; i < w * body / 14; i++) { const px = x + 1 + r() * (w - 2), py = y + 3 + r() * (body - 4); p.px(px, py, r() < 0.6 ? P.hedgeHi : P.hedge); }
  for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5, px = Math.round(x + 2 + t * (w - 4)), py = Math.round(y + rx + Math.sin(t * Math.PI) * 3 + (i % 2) * 2); p.px(px, py, P.lamp); p.mark('fairy', px, py); }
}
function lampPost(p, P, x, top, bottom) { p.rect(x - 1, top + 4, 3, bottom - top - 4, P.goldLo); p.rect(x, top + 4, 1, bottom - top - 4, P.gold); p.rect(x - 3, bottom - 3, 7, 3, P.goldLo); p.rect(x - 3, top, 7, 5, P.device); p.rect(x - 2, top + 1, 5, 3, P.lamp); }

// ------------------------------------------------------------------ sky and far layers
export function paintSky(P, w) {
  const p = new Painter(w, VIEW_H);
  p.rect(0, 0, w, VIEW_H, P.skyTop);
  p.rect(0, 52, w, 60, P.skyMid); p.rect(0, 112, w, VIEW_H - 112, P.skyLow);
  const band = (y, a, b) => { if (a.startsWith('d:') || b.startsWith('d:')) return; p.rect(0, y - 2, w, 2, 'd:' + b + ':' + a + ':checker'); };
  band(52, P.skyTop, P.skyMid); band(112, P.skyMid, P.skyLow);
  const r = rng(7); for (let i = 0; i < w / 5; i++) p.px(r() * w, r() * 100, r() < 0.15 ? P.glint : P.star);
  return p;
}
export function paintMoon(P) {
  const p = new Painter(32, 32);
  p.circle(16, 16, 11, P.moon); p.circle(19, 13, 2, P.moonShade); p.circle(12, 19, 1, P.moonShade); p.circle(20, 20, 1, P.moonShade);
  p.px(13, 21, P.lamp); p.px(14, 21, P.goldHi); // one lit window on the Moon
  return p;
}
// The dead city outside the walls: broken towers, a few fires.
export function paintCity(P, w) {
  const p = new Painter(w, VIEW_H), r = rng(41);
  let x = 0;
  while (x < w) {
    const bw = 10 + Math.floor(r() * 26), bh = 30 + Math.floor(r() * 70), top = 150 - bh;
    p.rect(x, top, bw, 150 - top, P.hill);
    // broken tops: notches and leaning girders
    for (let i = 0; i < bw; i += 2) if (r() < 0.45) p.rect(x + i, top, 2, 2 + Math.floor(r() * 8), P.skyLow.startsWith('d:') ? P.skyMid : P.skyLow);
    if (r() < 0.4) p.line(x + bw - 2, top, x + bw + 4, top - 8 - r() * 8, P.hill);
    // a few burning windows high in the wrecks
    if (r() < 0.4) { const fx = x + 2 + Math.floor(r() * (bw - 4)), fy = top + 6 + Math.floor(r() * Math.max(4, bh - 20)); p.rect(fx, fy, 2, 2, P.lamp); p.mark('fire', fx + 1, fy + 1); }
    x += bw + Math.floor(r() * 6);
  }
  p.rect(0, 150, w, VIEW_H - 150, P.hill);
  return p;
}

// ------------------------------------------------------------------ the level
export function paintLevel(P) {
  const W = LEVEL.w * TILE, p = new Painter(W, VIEW_H);
  const G = GROUND;

  // ---------------- outside the walls: ash and rubble ----------------
  p.rect(0, G, 15 * TILE, VIEW_H - G, P.rubble); p.rect(0, G, 15 * TILE, 1, P.rubbleHi);
  const r0 = rng(3); for (let i = 0; i < 70; i++) p.px(r0() * 15 * TILE, G + 2 + r0() * 16, r0() < 0.5 ? P.dust : P.rubbleHi);
  // a dead tree and a burnt car
  p.rect(40, G - 34, 3, 34, P.wood); p.line(41, G - 24, 30, G - 38, P.wood); p.line(42, G - 28, 54, G - 44, P.wood); p.line(41, G - 32, 46, G - 50, P.wood);
  p.rect(120, G - 9, 34, 7, P.rubble); p.rect(126, G - 15, 20, 6, P.rubble); p.rect(129, G - 13, 6, 3, P.crack); p.rect(137, G - 13, 6, 3, P.crack);
  p.circle(127, G - 2, 3, P.crack); p.circle(147, G - 2, 3, P.crack);
  for (let i = 0; i < 5; i++) p.rect(170 + i * 9, G - 3 - (i % 3) * 2, 6, 3 + (i % 3) * 2, P.rubbleHi);

  // ---------------- the gilded fence and the open gate ----------------
  const fx0 = 14 * TILE, fx1 = 17 * TILE;
  for (let x = fx0; x <= fx1; x += 6) { p.rect(x, G - 46, 2, 46, P.goldLo); p.rect(x, G - 46, 1, 46, P.gold); p.poly([[x - 1, G - 46], [x + 1, G - 52], [x + 3, G - 46]], P.gold); }
  p.rect(fx0, G - 40, fx1 - fx0 + 2, 2, P.gold); p.rect(fx0, G - 12, fx1 - fx0 + 2, 2, P.gold);
  p.rect(fx0 - 4, G - 58, 8, 58, P.col); p.rect(fx0 - 5, G - 60, 10, 3, P.gold); p.circle(fx0, G - 63, 3, P.gold); glint(p, P, fx0, G - 64);
  // the gate leaf hangs open, swung back toward the house
  p.poly([[fx1 + 4, G - 44], [fx1 + 20, G - 36], [fx1 + 20, G - 4], [fx1 + 4, G]], P.goldLo);
  for (let i = 0; i < 4; i++) p.line(fx1 + 6 + i * 4, G - 42 + i * 2, fx1 + 6 + i * 4, G - 2, P.gold);

  // ---------------- the facade behind the walk ----------------
  const roof = 36;
  // glass wing, tiles 17 to 38
  const gx0 = 17 * TILE + 8, gx1 = 39 * TILE;
  p.rect(gx0, roof + 10, gx1 - gx0, G - roof - 10, P.glass);
  const rg = rng(91);
  for (let y = roof + 12; y < G - 14; y += 14) for (let x = gx0 + 2; x < gx1 - 10; x += 12) { const v = rg(); p.rect(x, y, 10, 12, v < 0.3 ? P.glassLit : v < 0.42 ? P.win : P.glass); if (v < 0.12) p.mark('pane', x + 5, y + 6); }
  for (let x = gx0; x <= gx1; x += 12) p.rect(x, roof + 10, 2, G - roof - 10, P.goldLo);
  p.rect(gx0, roof + 8, gx1 - gx0, 3, P.gold); for (let x = gx0 + 4; x < gx1; x += 8) p.rect(x, roof + 2, 1, 6, P.gold); p.rect(gx0, roof + 2, gx1 - gx0, 1, P.gold);
  // LED strip along the glass wing
  for (let x = gx0; x < gx1; x += 3) p.px(x, roof + 12, P.glassLit);
  // a service door in the base of the glass wing, with a small plaque
  const SD = LEVEL.shedDoor;
  p.rect(SD.x - 2, SD.y - 2, SD.w + 4, SD.h + 2, P.goldLo); p.rect(SD.x, SD.y, SD.w, SD.h, P.wallLo); p.rect(SD.x + 1, SD.y + 1, SD.w - 2, SD.h - 1, P.wall);
  p.rect(SD.x + 2, SD.y + 4, SD.w - 4, 3, P.colLo); p.rect(SD.x + SD.w - 4, SD.y + 13, 2, 2, P.gold); p.glowRect(SD.x - 3, GROUND - 2, SD.w + 6, 2, P.lamp, 0.12);

  // baroque wing, tiles 39 to 77, with a dome over its middle
  const bx0 = 39 * TILE, bx1 = 77 * TILE;
  p.rect(bx0, roof + 18, bx1 - bx0, G - roof - 18, P.wall); p.rect(bx0, roof + 18, bx1 - bx0, 2, P.wallHi);
  for (let x = bx0 + 6; x < bx1; x += 26) {
    p.rect(x, 74, 14, 34, P.goldLo); p.circle(x + 7, 74, 7, P.goldLo); p.rect(x + 2, 76, 10, 30, P.win); p.circle(x + 7, 75, 5, P.win);
    p.rect(x + 6, 70, 2, 36, P.goldLo); p.rect(x + 2, 88, 10, 1, P.goldLo); chandelierInWindow(p, P, x + 7, 84);
    p.glowRect(x - 2, 108, 18, 4, P.lamp, 0.12);
  }
  for (let x = bx0; x < bx1; x += 26) { p.rect(x, roof + 20, 4, G - roof - 20, P.wallHi); p.rect(x + 1, roof + 20, 1, G - roof - 20, P.wallLine); }
  // balustrade with statues on the roofline
  p.rect(bx0, roof + 14, bx1 - bx0, 4, P.colHi); for (let x = bx0 + 2; x < bx1; x += 5) p.rect(x, roof + 10, 2, 4, P.col); p.rect(bx0, roof + 9, bx1 - bx0, 1, P.colHi);
  for (let x = bx0 + 10; x < bx1; x += 52) statue(p, P, x, roof + 9);
  // the dome
  const dc = 58 * TILE, dy = roof + 6;
  p.rect(dc - 36, dy - 10, 72, 16, P.wallHi); for (let i = 0; i < 7; i++) p.rect(dc - 30 + i * 10, dy - 7, 4, 9, P.win);
  p.rect(dc - 38, dy - 12, 76, 2, P.gold);
  p.circle(dc, dy - 12, 30, P.gold); p.rect(dc - 31, dy - 12, 62, 31, P.wallHi); p.rect(dc - 38, dy - 12, 76, 2, P.gold);
  [-20, -10, 0, 10, 20].forEach(o => { const top = Math.round(dy - 12 - Math.sqrt(Math.max(0, 900 - o * o))); p.rect(dc + o, top + 2, 1, dy - 14 - top, P.goldLo); });
  p.rect(dc - 13, dy - 36, 4, 3, P.goldHi); p.rect(dc - 15, dy - 33, 3, 6, P.goldHi);
  p.rect(dc - 4, dy - 54, 9, 12, P.gold); p.rect(dc - 2, dy - 52, 5, 7, P.win); p.circle(dc, dy - 57, 3, P.goldHi); p.rect(dc, dy - 66, 1, 7, P.gold); glint(p, P, dc, dy - 66);
  // colonnade, tiles 77 to 94
  const cx0 = 77 * TILE, cx1 = 94 * TILE;
  p.rect(cx0, 64, cx1 - cx0, G - 64, P.wallLo); p.rect(cx0, 58, cx1 - cx0, 6, P.colHi); p.rect(cx0, 57, cx1 - cx0, 1, P.gold);
  for (let x = cx0 + 6; x < cx1 - 6; x += 22) { column(p, P, x, 64, G, 8); p.rect(x + 12, 90, 4, 6, P.lamp); p.glowCircle(x + 14, 93, 8, P.lamp, 0.12); }
  // temple front, tiles 94 to 111
  const tx0 = 94 * TILE, tx1 = 111 * TILE + 8, tc = (tx0 + tx1) / 2;
  p.rect(tx0, 40, tx1 - tx0, 72, P.wall); p.rect(tx0, 40, tx1 - tx0, 2, P.wallHi);
  for (let i = 0; i < 6; i++) column(p, P, tx0 + 10 + i * 46, 44, 112, 12);
  p.rect(tx0 - 6, 30, tx1 - tx0 + 12, 10, P.colHi); p.rect(tx0 - 6, 30, tx1 - tx0 + 12, 1, P.gold); p.rect(tx0 - 6, 39, tx1 - tx0 + 12, 1, P.gold);
  for (let x = tx0 - 4; x < tx1 + 4; x += 6) p.rect(x, 34, 2, 2, P.gold);
  p.poly([[tx0 - 10, 30], [tc, 2], [tx1 + 10, 30]], P.gold); p.poly([[tx0 - 4, 29], [tc, 6], [tx1 + 4, 29]], P.colHi);
  p.circle(tc, 20, 6, P.gold); p.circle(tc, 20, 4, P.goldHi); glint(p, P, tc, 20);
  // the door itself, lit from inside, with a warm wash on the landing
  const D = LEVEL.door;
  p.rect(D.x - 4, D.y - 8, D.w + 8, D.h + 8, P.goldLo); p.circle(D.x + D.w / 2, D.y - 1, D.w / 2 + 4, P.goldLo);
  p.rect(D.x, D.y, D.w, D.h, P.winHi); p.circle(D.x + D.w / 2, D.y, D.w / 2, P.winHi); p.rect(D.x + D.w / 2, D.y - 4, 1, D.h + 4, P.goldLo);
  p.glowRect(D.x - 20, 112, D.w + 40, 6, P.lamp, 0.2);
  // lit windows either side of the door
  [D.x - 52, D.x + 44].forEach(x => { p.rect(x, 62, 14, 26, P.goldLo); p.rect(x + 2, 64, 10, 22, P.win); chandelierInWindow(p, P, x + 7, 72); });

  // uplights wash the facade from the ground, warm on stone, cold on glass
  for (let x = gx0 + 18; x < gx1 - 10; x += 48) p.glowPoly([[x - 3, G], [x + 3, G], [x + 14, roof + 12], [x - 14, roof + 12]], P.glassLit, 0.07);
  for (let x = bx0; x < bx1; x += 26) p.glowPoly([[x - 1, G], [x + 5, G], [x + 13, roof + 20], [x - 9, roof + 20]], P.lamp, 0.08);
  for (let i = 0; i < 6; i++) { const x = tx0 + 16 + i * 46; p.glowPoly([[x - 3, 112], [x + 3, 112], [x + 12, 44], [x - 12, 44]], P.lamp, 0.09); }
  for (let x = cx0 + 10; x < cx1 - 6; x += 22) p.glowPoly([[x - 2, G], [x + 2, G], [x + 8, 64], [x - 8, 64]], P.lamp, 0.07);
  // ---------------- the grounds ----------------
  // lawn, gravel path, edging
  p.rect(15 * TILE, G, W - 15 * TILE, VIEW_H - G, P.ground); p.rect(15 * TILE, G, W - 15 * TILE, 2, P.groundTop);
  for (let x = 15 * TILE; x < W; x += 4) p.px(x + 1, G + 1, P.hedgeHi);
  for (let x = bx0 + 6; x < bx1; x += 26) p.glowRect(x - 3, G + 1, 20, 4, P.lamp, 0.1);
  for (let x = gx0 + 2; x < gx1 - 10; x += 24) p.glowRect(x, G + 1, 14, 3, P.glassLit, 0.08);
  p.rect(15 * TILE, G + 5, W - 15 * TILE, 5, P.path); p.rect(15 * TILE, G + 5, W - 15 * TILE, 1, P.pathHi);
  // hedges (solid in the map)
  hedgeBlock(p, P, 21 * TILE, 8 * TILE, 32, 32, 11); hedgeBlock(p, P, 27 * TILE - 2, 8 * TILE - 6, 20, 38, 12); hedgeBlock(p, P, 32 * TILE, 8 * TILE, 32, 32, 13);
  // garden lamp post (searchlight 1)
  lampPost(p, P, 37 * TILE + 8, 120, G);
  // fountain: rim, water, floating upper bowl on a thin stem
  const f0 = 43 * TILE, f1 = 52 * TILE;
  p.rect(f0, 144, 16, 16, P.colLo); p.rect(f1 - 16, 144, 16, 16, P.colLo); p.rect(f0, 144, 16, 2, P.colHi); p.rect(f1 - 16, 144, 16, 2, P.colHi);
  p.rect(f0 + 16, 150, f1 - f0 - 32, 10, P.glass); p.rect(f0 + 16, 150, f1 - f0 - 32, 1, P.glassLit);
  p.rect(47 * TILE + 6, 128, 4, 22, P.colLo); p.rect(47 * TILE + 7, 128, 1, 22, P.colHi);
  p.rect(45 * TILE, 112, 5 * TILE, 8, P.col); p.rect(45 * TILE, 112, 5 * TILE, 2, P.colHi); p.rect(45 * TILE + 2, 120, 5 * TILE - 4, 8, P.colLo); p.rect(45 * TILE + 6, 127, 5 * TILE - 12, 1, P.gold);
  p.rect(45 * TILE + 3, 110, 5 * TILE - 6, 2, P.glassLit);
  p.mark('fountain', 47 * TILE + 8, 110);
  // statue plinths with gold figures
  [60, 66, 72].forEach((t, i) => { const x = t * TILE; p.rect(x, 128, 16, 32, P.colLo); p.rect(x - 1, 126, 18, 3, P.colHi); p.rect(x + 2, 132, 1, 26, P.col); statue(p, P, x + 8, 126); if (i === 1) p.mark('statue', x + 8, 104); });
  // wall searchlights (2 and 3) mounted on the facade
  [63, 75].forEach(t => { const x = t * TILE + 8; p.rect(x - 4, 84, 9, 6, P.device); p.rect(x - 2, 90, 5, 3, P.device); p.rect(x - 3, 85, 7, 3, P.lamp); });
  // pergolas (solid tops) on gold posts
  [[81, 83], [88, 90]].forEach(([a, b]) => { const x0 = a * TILE, x1 = (b + 1) * TILE; p.rect(x0 - 2, 96, x1 - x0 + 4, 4, P.wood); p.rect(x0 - 2, 99, x1 - x0 + 4, 1, P.goldLo); for (let x = x0; x < x1; x += 4) p.rect(x, 100, 2, 10, P.wood); p.rect(x0 - 2, 109, x1 - x0 + 4, 3, P.wood); p.rect(x0 - 2, 109, x1 - x0 + 4, 1, P.woodHi); [x0 + 2, x1 - 4].forEach(px => p.rect(px, 112, 2, G - 112, P.goldLo)); for (let x = x0; x < x1; x += 5) { p.px(x + 2, 112, P.lamp); p.mark('fairy', x + 2, 112); } });
  // reflecting pool in the foreground under the colonnade
  const px0 = 78 * TILE, px1 = 94 * TILE;
  p.rect(px0, 168, px1 - px0, 10, P.colLo); p.rect(px0 + 2, 170, px1 - px0 - 4, 7, P.glass); p.rect(px0, 168, px1 - px0, 1, P.colHi);
  for (let x = px0 + 8; x < px1 - 8; x += 22) { p.rect(x, 171, 6, 1, P.colLo); p.rect(x + 1, 173, 4, 1, P.colLo); }
  p.rect(px0 + 40, 175, 80, 1, P.gold);
  // grand stairs with a red carpet, and the landing
  for (let i = 0; i < 3; i++) { const x = (96 + i) * TILE, top = G - (i + 1) * 16; p.rect(x, top, (111 - 96 - i) * TILE, 16, i % 2 ? P.col : P.colLo); p.rect(x, top, (111 - 96 - i) * TILE, 2, P.colHi); }
  p.rect(98 * TILE, 112, 13 * TILE, 4, P.colHi);
  p.rect(101 * TILE + 4, 112, 2 * TILE, 48, P.fabric); p.rect(101 * TILE + 4, 112, 2, 48, P.fabricLo);
  // stair searchlights (4 and 5) on gold brackets high on the temple
  [[95 * TILE, 58], [110 * TILE + 8, 58]].forEach(([x, y]) => { p.rect(x - 4, y - 4, 9, 7, P.device); p.rect(x - 3, y - 3, 7, 4, P.lamp); p.rect(x - 1, y + 3, 3, 8, P.goldLo); });
  return p;
}
