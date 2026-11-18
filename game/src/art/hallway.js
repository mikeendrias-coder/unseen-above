// The hallway behind the Moon city: backstage, where the show is made. Concrete, steel, cables,
// work lights on a grid. The crew's coats on a rail, a shelf of spare glasses, a continuity
// board, the monitors. Then a taped-off stage where the creator tests every trap in the game,
// in front of the backs of the set flats: the front of the house, seen from behind. The Moon's
// own colors, gone grey, because nobody up here pays to look at the back.
import { Painter, rng } from './painter.js';
import { M, channel, outline } from './moon.js';
import { pixText } from './pixfont.js';

export const TILE = 16, GROUND = 160;
const T = TILE, G = GROUND;

export const H = {
  wall: '#2e3036', wallHi: '#45474d', wallLo: '#1b1c21', panel: '#2e3036', floor: '#45474d', floorHi: '#6b6c70', floorLo: '#1b1c21',
  pipe: '#6b6c70', pipeHi: '#8f8d87', pipeLo: '#45474d', cable: '#0e0f12', tape: '#d6a03c', tapeLo: '#8a5f1c', work: '#f2d58c',
  steel: '#6b6c70', steelHi: '#8f8d87', steelLo: '#45474d', ply: '#54432a', plyHi: '#8a5f1c', plyLo: '#3a2f1f',
  crate: '#3a2f1f', crateHi: '#54432a', crateLo: '#261f15', screen: '#0e0f12', glow: '#f5ce77', red: '#e3412b', sand: '#8f8d87',
  coat: '#2e3036', coatHi: '#45474d', coatLo: '#1b1c21', skin: '#ebe6d8', skinLo: '#b8b2a3', hair: '#1b1c21', hairHi: '#45474d',
  band: '#0e0f12', blade: '#ebe6d8', bladeLo: '#b8b2a3', gold: '#d6a03c', lanyard: '#d6a03c', badge: '#ebe6d8', glasses: '#e3412b'
};

export const ARENA = { x0: 20 * T, x1: 40 * T };
export const LEVEL = {
  w: 50, h: 12,
  start: { x: 34, y: G - 14 },
  staffDoor: { x: 8, y: G - 36, w: 22, h: 36 },     // where she came in from the city
  door: { x: 46 * T, y: G - 36, w: 24, h: 36 },     // the playroom door, past the stage
  gate: { x: 20 * T - 6, w: 6 },                    // the stage door that drops behind her
  shutter: { x: 40 * T, w: 8 },                     // and the one that rolls up when it is over
  crates: [{ x: 23 * T + 6, y: G - 14, w: 18, h: 14 }, { x: 35 * T + 8, y: G - 14, w: 18, h: 14 }],
  desk: { x: 29 * T + 2, y: G - 19, w: 44, h: 4 },  // the console desk: a table she fits under
  lamp: { x: 30 * T + 4, y: 20, from: 40, to: 140, half: 7, range: 230, lock: 0.62 },
  lasers: { x0: 20 * T + 3, x1: 40 * T - 3, hi: G - 11, lo: G - 3 },
  flashCams: [{ x: 24 * T + 8, y: 21 }, { x: 36 * T + 2, y: 21 }],
  things: [
    { id: 'coats', x0: 4 * T, x1: 7 * T },
    { id: 'shelf', x0: 8 * T + 8, x1: 11 * T },
    { id: 'board', x0: 12 * T + 4, x1: 15 * T },
    { id: 'monitors', x0: 16 * T, x1: 18 * T + 8 }
  ]
};

export function buildMap() {
  const W = LEVEL.w, Hh = LEVEL.h, m = [];
  for (let y = 0; y < Hh; y++) m.push(new Array(W).fill(0));
  for (let x = 0; x < W; x++) { m[10][x] = 1; m[11][x] = 1; m[0][x] = 1; }
  for (let y = 0; y < 10; y++) { m[y][0] = 1; m[y][W - 1] = 1; }
  return { W, H: Hh, m };
}

function ptext(p, s, x, y, c) { pixText({ fillStyle: () => {}, fillRect: (a, b, w, h) => p.rect(a, b, w, h, c) }, s, x, y, c, 1, 1); }

// a work light on the grid: a lamp, a lit lens, and its light on the wall as a flat checker
function workLight(p, x) {
  p.poly([[x - 2, 22], [x + 3, 22], [x + 18, 70], [x - 17, 70]], 'd:' + H.wallHi + ':' + H.wall + ':checker');
  p.rect(x - 3, 16, 7, 4, H.steelLo); p.rect(x - 2, 20, 5, 2, H.work); p.rect(x - 1, 22, 3, 1, H.glow);
  p.mark('work', x, 21);
}

// The back of a set flat: plywood, braces, a sandbag, a stencil saying which room it is.
function flatBack(p, x, w, label) {
  p.rect(x, 34, w, G - 34, H.ply); p.rect(x, 34, w, 2, H.plyHi); p.rect(x + w - 2, 34, 2, G - 34, H.plyLo);
  for (let yy = 34; yy < G; yy += 32) p.rect(x, yy, w, 1, H.plyLo);
  for (let xx = x + 22; xx < x + w; xx += 44) p.rect(xx, 34, 3, G - 34, H.plyLo);
  // braces and their weights
  [x + 14, x + w - 22].forEach(bx => { p.line(bx, 80, bx + 14, G - 1, H.plyLo); p.line(bx + 1, 80, bx + 15, G - 1, H.plyLo); p.rect(bx + 10, G - 6, 12, 6, H.sand); p.rect(bx + 10, G - 6, 12, 1, H.plyHi); });
  p.rect(x + 8, 56, label.length * 4 + 3, 9, H.ply); ptext(p, label, x + 10, 58, H.plyLo);
}

export function paintLevel() {
  const W = LEVEL.w * T, p = new Painter(W, 180), r = rng(41);
  // the wall, panel seams, a dado of scuffed paint
  p.rect(0, 0, W, G, H.wall);
  for (let x = 40; x < W; x += 112) workLight(p, x);
  for (let x = 0; x < W; x += 32) { p.rect(x, 30, 1, G - 30, H.wallLo); }
  p.rect(0, 120, W, 1, H.wallHi); p.rect(0, 121, W, G - 121, H.panel);
  for (let i = 0; i < 60; i++) p.px(r() * W, 122 + r() * 36, H.wallLo);
  // the grid overhead: a truss, cables hanging in loops, pipes
  p.rect(0, 10, W, 2, H.steel); p.rect(0, 16, W, 2, H.steel); for (let x = 0; x < W; x += 8) p.line(x, 11, x + 4, 16, H.steelLo);
  p.rect(0, 26, W, 3, H.pipe); p.rect(0, 26, W, 1, H.pipeHi); p.rect(0, 31, W, 2, H.pipeLo);
  for (let x = 6; x < W; x += 37) { const sag = 6 + Math.floor(r() * 8); for (let i = 0; i < 24; i++) p.px(x + i, 18 + Math.round(Math.sin(i / 23 * Math.PI) * sag), H.cable); }
  // the floor: concrete, scuffs, gaffer tape
  p.rect(0, G, W, 20, H.floor); p.rect(0, G, W, 1, H.floorHi); for (let x = 0; x < W; x += 48) p.rect(x, G + 1, 1, 19, H.floorLo);
  for (let i = 0; i < 40; i++) p.rect(r() * W, G + 3 + r() * 14, 2 + r() * 4, 1, H.floorLo);
  // the door she came in by: steel, a small window, STAFF
  const SD = LEVEL.staffDoor;
  p.rect(SD.x - 2, SD.y - 2, SD.w + 4, SD.h + 2, H.steelLo); p.rect(SD.x, SD.y, SD.w, SD.h, H.steel); p.rect(SD.x + 6, SD.y + 6, 10, 8, M.wallHi); p.rect(SD.x + SD.w - 5, SD.y + 18, 3, 2, H.steelHi);
  ptext(p, 'STAFF', SD.x + 1, SD.y - 9, H.steelHi);
  // ---- the walk in: the crew's things
  // coats on a rail, SEASON 41 on the backs
  const cx = 4 * T + 4; p.rect(cx, 74, 40, 2, H.steelHi); p.rect(cx + 2, 76, 2, G - 76, H.steelLo); p.rect(cx + 36, 76, 2, G - 76, H.steelLo); p.rect(cx - 2, G - 2, 44, 2, H.steelLo);
  for (let i = 0; i < 5; i++) { const x = cx + 4 + i * 7; p.rect(x + 2, 76, 1, 3, H.steelHi); p.rect(x, 79, 6, 34, i === 2 ? H.coatHi : H.coat); p.rect(x, 79, 6, 1, H.coatHi); p.rect(x + 5, 79, 1, 34, H.coatLo); }
  ptext(p, '41', cx + 16, 92, H.tape);
  // a shelf of spare glasses, all the same
  const sx = 8 * T + 10; for (let j = 0; j < 4; j++) { const y = 70 + j * 18; p.rect(sx, y, 34, 2, H.steelHi); p.rect(sx, y + 2, 34, 1, H.steelLo); for (let i = 0; i < 5; i++) { const gx = sx + 2 + i * 7; p.rect(gx, y - 2, 2, 1, H.glasses); p.rect(gx + 3, y - 2, 2, 1, H.glasses); p.px(gx + 2, y - 2, H.band); } }
  p.rect(sx, 68, 1, 60, H.steelLo); p.rect(sx + 33, 68, 1, 60, H.steelLo);
  // the continuity board: rows of photos, the same rooms over and over
  const bx = 12 * T + 6; p.rect(bx, 64, 40, 40, H.crateLo); p.rect(bx + 1, 65, 38, 38, H.sand);
  ptext(p, 'CONTINUITY', bx + 1, 57, H.steelHi);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = bx + 3 + i * 9, y = 67 + j * 9; p.rect(x, y, 7, 7, H.badge); p.rect(x + 1, y + 1, 5, 4, j % 2 ? '#1b1c21' : '#2e3036'); if ((i + j) % 2 === 0) p.rect(x + 2, y + 4, 3, 1, H.badge); p.px(x + 3, y - 1, H.red); }
  // six feeds on a stand; one of them is this hallway
  const mx = 16 * T + 2;
  p.rect(mx + 18, 100, 4, G - 100, H.steelLo); p.rect(mx + 8, G - 3, 24, 3, H.steelLo);
  ['grounds', 'hall', 'bedroom', 'ridge', 'static', 'hallway'].forEach((k, i) => {
    const x = mx + (i % 3) * 14, y = 64 + Math.floor(i / 3) * 12;
    if (k === 'hallway') { p.rect(x - 1, y - 1, 14, 11, M.bezel); p.rect(x, y, 12, 9, H.wallLo); p.rect(x, y + 7, 12, 2, H.floor); p.rect(x + 3, y + 3, 1, 4, H.badge); p.rect(x + 8, y + 2, 2, 5, H.coat); p.mark('tile', x, y, { w: 12, h: 9, kind: k }); }
    else channel(p, x, y, 12, 9, k, 50 + i);
  });
  // ---- the stage: the backs of the set flats, braced and weighted
  flatBack(p, 20 * T, 7 * T, 'GALLERY  FRONT');
  flatBack(p, 27 * T + 6, 6 * T, 'GROUNDS  GATE');
  flatBack(p, 33 * T + 10, 6 * T + 6, 'BEDROOM  DOOR');
  // gaffer tape on the stage floor: its edges and her mark
  p.rect(20 * T, G + 2, 20 * T, 1, H.tape); p.rect(20 * T, G + 17, 20 * T, 1, H.tapeLo);
  [[25 * T, 'x'], [31 * T, 'x'], [37 * T, 'x']].forEach(([x]) => { p.line(x - 3, G + 6, x + 3, G + 12, H.tape); p.line(x + 3, G + 6, x - 3, G + 12, H.tape); });
  // ON AIR over the stage, lit live while the cameras roll (drawn by the scene)
  p.rect(30 * T - 14, 36, 36, 11, H.band); p.rect(30 * T - 13, 37, 34, 9, '#261f15'); p.mark('onair', 30 * T - 13, 37);
  // cable on the floor, coiled, and a ladder against a flat
  for (let i = 0; i < 3; i++) p.ellipse(27 * T, G - 2, 7 - i * 2, 2, H.cable);
  p.rect(38 * T, 72, 2, G - 72, H.steelLo); p.rect(38 * T + 10, 72, 2, G - 72, H.steelLo); for (let y = 78; y < G; y += 10) p.rect(38 * T, y, 12, 1, H.steelLo);
  // the crates she can hide behind
  LEVEL.crates.forEach(c => { p.rect(c.x, c.y, c.w, c.h, H.crate); p.rect(c.x, c.y, c.w, 1, H.crateHi); p.rect(c.x, c.y + c.h - 1, c.w, 1, H.crateLo); p.line(c.x + 1, c.y + 1, c.x + c.w - 2, c.y + c.h - 2, H.crateLo); p.rect(c.x + 1, c.y + 5, c.w - 2, 1, H.crateLo); ptext(p, '07', c.x + c.w - 9, c.y + 7, H.crateHi); });
  // the console desk: a table with legs, the satellite screen, a red button
  const D = LEVEL.desk;
  p.rect(D.x, D.y, D.w, D.h, H.steel); p.rect(D.x, D.y, D.w, 1, H.steelHi); p.rect(D.x + 2, D.y + D.h, 2, G - D.y - D.h, H.steelLo); p.rect(D.x + D.w - 4, D.y + D.h, 2, G - D.y - D.h, H.steelLo);
  p.rect(D.x + 6, D.y - 16, 22, 15, M.bezel); p.rect(D.x + 7, D.y - 15, 20, 13, '#1b1c21');
  for (let i = 0; i < 3; i++) p.rect(D.x + 9, D.y - 13 + i * 4, 10 + (i % 2) * 4, 1, '#f5ce77');
  p.rect(D.x + 22, D.y - 11, 3, 3, '#d6a03c'); p.mark('console', D.x + 17, D.y - 9);
  p.rect(D.x + 32, D.y - 3, 6, 3, H.steelLo); p.rect(D.x + 33, D.y - 4, 4, 2, H.red);
  // the rigs on the grid: a searchlight, two cameras, laser emitters on the walls
  const L = LEVEL.lamp; p.rect(L.x - 5, 14, 10, 4, H.steelLo); p.rect(L.x - 3, 18, 6, 4, H.steel);
  LEVEL.flashCams.forEach(c => { p.rect(c.x - 1, 14, 2, 4, H.steelLo); p.rect(c.x - 4, c.y - 3, 8, 5, H.band); p.rect(c.x - 2, c.y + 1, 4, 2, H.steelLo); });
  const Z = LEVEL.lasers; [[Z.x0 - 3, 1], [Z.x1 - 1, -1]].forEach(([x]) => { p.rect(x, Z.hi - 4, 4, Z.lo - Z.hi + 8, H.steelLo); p.rect(x + 1, Z.hi - 1, 2, 2, H.band); p.rect(x + 1, Z.lo - 1, 2, 2, H.band); });
  // past the stage: the corridor to the playroom, warmer, the Moon's own colors coming back
  p.rect(41 * T, 0, 9 * T, G, M.wallLo); p.rect(41 * T, 14, 9 * T, 2, M.trimLo);
  for (let x = 41 * T + 8; x < 49 * T; x += 48) { p.rect(x, 22, 32, 100, M.wall); p.rect(x + 1, 23, 30, 98, M.wallLo); }
  p.rect(41 * T, G, 9 * T, 20, M.floorLo); p.rect(41 * T, G, 9 * T, 1, M.floor);
  // the playroom door: round-topped, pink, a gold star
  const Dd = LEVEL.door, mid = Dd.x + Dd.w / 2;
  p.circle(mid, Dd.y + 8, Dd.w / 2 + 3, M.trim); p.rect(Dd.x - 3, Dd.y + 8, Dd.w + 6, Dd.h - 8, M.trim);
  p.circle(mid, Dd.y + 8, Dd.w / 2, M.pink); p.rect(Dd.x, Dd.y + 8, Dd.w, Dd.h - 8, M.pink); p.rect(mid, Dd.y - 3, 1, Dd.h + 3, '#8a5f1c');
  p.poly([[mid, Dd.y + 3], [mid + 3, Dd.y + 9], [mid + 9, Dd.y + 9], [mid + 4, Dd.y + 13], [mid + 6, Dd.y + 19], [mid, Dd.y + 15], [mid - 6, Dd.y + 19], [mid - 4, Dd.y + 13], [mid - 9, Dd.y + 9], [mid - 3, Dd.y + 9]], M.yellow);
  ptext(p, 'PLAYROOM', mid - 15, Dd.y - 16, M.trim);
  return p;
}

// ------------------------------------------------------------------ the creator
// Long crew coat, a headset with a red light (on air), a lanyard, tired posture. Painted per
// pose, facing right; the sword arm and the sword are drawn live so they can swing.
const HEAD = ['...hhhh..', '..hhhhhh.', '.bhhhhhhh', '.bhhffff.', 'rbhfffeF.', '.bhfffff.', '..hffmmm.', '...fff...'];
const TORSO = ['..cCCcc..', '.ccyCcccc', '.ccyccccc', '.ccwccccc', '.cccccccc', '.cccccccc', '.dccccccd', '.dccccccd', '.dccccccd', '.dcccccd.', '.ddcccdd.'];
const LEGS = {
  stand: ['..pp.pp..', '..pp.pp..', '..pp.pp..', '..pp.pp..', '.sss.sss.'],
  a: ['..pp..pp.', '.pp...pp.', '.pp....pp', 'pp.....pp', 'ss.....ss'],
  b: ['...ppp...', '...ppp...', '...pp.p..', '..pp..pp.', '.sss.sss.'],
  lunge: ['..pp...pp', '.pp.....p', 'pp......p', 'p.......p', 'ss.....ss'],
  crouch: ['.pp..pp..', 'pp...pp..', 'ss...ss..'],
  kneel: ['ppppp.pp.', 'sss...pp.', '......ss.']
};
const MAP = { h: H.hair, F: H.hairHi, f: H.skin, e: H.band, b: H.band, r: H.red, m: H.steelHi, c: H.coat, C: H.coatHi, d: H.coatLo, y: H.lanyard, w: H.badge, p: H.coatLo, s: H.cable };
function rows(p, list, ox, oy) { list.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') p.px(ox + i, oy + j, MAP[r[i]]); }); }

// pose -> { head [x, y], torso [x, y], legs, shoulder [x, y] } in a 14 x 26 frame, feet at y 25
export const POSES = {
  stand: { head: [2, 1], torso: [2, 9], legs: 'stand', sh: [8, 11] },
  a: { head: [2, 1], torso: [2, 9], legs: 'a', sh: [8, 11] },
  b: { head: [2, 2], torso: [2, 10], legs: 'b', sh: [8, 12] },
  lean: { head: [5, 3], torso: [4, 10], legs: 'lunge', sh: [10, 12] },
  crouch: { head: [2, 6], torso: [2, 13], legs: 'crouch', sh: [8, 15] },
  back: { head: [0, 2], torso: [1, 10], legs: 'stand', sh: [7, 12] },
  kneel: { head: [3, 9], torso: [2, 15], legs: 'kneel', sh: [8, 17] }
};
export function paintCreator(pose) {
  // a pixel of room on each side and on top for the outline; the feet stay on the bottom row
  const P = POSES[pose], p = new Painter(16, 27), legs = LEGS[P.legs];
  rows(p, legs, P.torso[0] + 1, 27 - legs.length);
  rows(p, TORSO, P.torso[0] + 1, P.torso[1] + 1);
  rows(p, HEAD, P.head[0] + 1, P.head[1] + 1);
  outline(p, '#0e0f12');
  return p;
}
export const CREATOR_H = 25;

// A light layer for the stage: one small canvas over the view, redrawn each frame with hard
// pixels only. Light is a checker of one color over what is behind it, never a soft glow.
export class PixLayer {
  constructor(scene, key, depth) {
    this.c = document.createElement('canvas'); this.c.width = 322; this.c.height = 182;
    this.x = this.c.getContext('2d'); this.pats = new Map(); this.ox = 0;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.tex = scene.textures.addCanvas(key, this.c);
    this.img = scene.add.image(0, 0, key).setOrigin(0).setDepth(depth);
  }
  // kind: 'solid', 'checker' (half the pixels) or 'q25' (a quarter)
  ink(color, kind) {
    if (!kind || kind === 'solid') return color;
    const k = color + kind; if (this.pats.has(k)) return this.pats.get(k);
    const t = document.createElement('canvas'); t.width = 2; t.height = 2; const x = t.getContext('2d'); x.fillStyle = color;
    x.fillRect(0, 0, 1, 1); if (kind === 'checker') x.fillRect(1, 1, 1, 1);
    const pat = this.x.createPattern(t, 'repeat'); this.pats.set(k, pat); return pat;
  }
  begin(ox) { this.ox = Math.round(ox) - 1; this.x.clearRect(0, 0, 322, 182); this.drew = false; }
  rect(x, y, w, h, color, kind) { this.x.fillStyle = this.ink(color, kind); this.x.fillRect(Math.round(x) - this.ox, Math.round(y) + 1, Math.round(w), Math.round(h)); this.drew = true; }
  poly(pts, color, kind) {
    this.x.fillStyle = this.ink(color, kind); const P = pts.map(q => [q.x - this.ox, q.y + 1]);
    let y0 = Infinity, y1 = -Infinity; P.forEach(q => { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(181, Math.ceil(y1)); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > yc) !== (yj > yc)) xs.push(xi + (yc - yi) * (xj - xi) / (yj - yi)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) this.x.fillRect(a, y, b - a, 1); }
    }
    this.drew = true;
  }
  // the dark: solid, with hard round holes where there is light and a checker ring at their edge
  dark(color, holes) {
    if (!this.img_) this.img_ = this.x.createImageData(322, 182);
    const d = this.img_.data, rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)), H = holes.map(h => ({ x: h.x - this.ox, y: h.y + 1, r: h.r }));
    for (let y = 0; y < 182; y++) for (let x = 0; x < 322; x++) {
      let m = 99; for (const h of H) { const v = Math.hypot(x - h.x, y - h.y) - h.r; if (v < m) m = v; }
      const i = (y * 322 + x) * 4, on = m >= 3 || (m >= 0 && (x + y) % 2 === 0);
      d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = on ? 255 : 0;
    }
    this.x.putImageData(this.img_, 0, 0); this.drew = true;
  }
  end() { if (this.drew) this.tex.refresh(); this.img.setVisible(this.drew).setPosition(this.ox, -1); }
}
