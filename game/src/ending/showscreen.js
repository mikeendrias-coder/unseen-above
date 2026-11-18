// The kids' game, as it shows on the giant screen in their playroom (Kids.js and the playroom in
// Moon.js). It is the same game the player plays in batch 4: the turning Earth with a maze cut in
// it, two beads, and the girl in pink as the target, in the game show's colors (sat/globe-view.js
// PAL[4], sat/wins.js LAND). Drawn pixel by pixel into its own small canvas, so nothing spills
// past the glass. Nov 18, after Michael: "change the game they are looking at in the final scene
// to reflect the game."
import { PAL } from '../sat/globe-view.js';
import { LAND, inPoly } from '../sat/wins.js';
import { ccText, ccWidth } from '../art/ccfont.js';

const G4 = PAL[4];
// the screen's own colors: the game show's panel, rule and lights (scenes/Satellite.js skin 4)
const SHOW = { bg: '#1b0f3a', panel: '#2b1a5c', rule: '#4b3a96', text: '#ffffff', dim: '#b8a8ff', yellow: '#ffd23f', pink: G4.target, mint: G4.beads[1], amber: '#ffb01f' };
export const SHOW_COLORS = SHOW;

// The far side of the cartoon Earth, as globe-view.js has it (unit disc, seen from behind)
const LAND_BACK = [
  [[-0.86, -0.42], [-0.6, -0.7], [-0.1, -0.82], [0.42, -0.74], [0.7, -0.5], [0.62, -0.3], [0.44, -0.18], [0.3, -0.02], [0.06, -0.08], [-0.2, -0.04], [-0.46, -0.16], [-0.72, -0.2]],
  [[-0.2, -0.06], [0.02, -0.06], [-0.08, 0.22]],
  [[0.2, 0.02], [0.4, 0.06], [0.46, 0.18], [0.24, 0.16]],
  [[0.14, 0.4], [0.44, 0.34], [0.6, 0.46], [0.52, 0.66], [0.24, 0.66], [0.1, 0.54]]
];
let landT = null;
function landAt(lat, lon) {
  if (!landT) {
    landT = new Uint8Array(90 * 180);
    for (let a = 0; a < 90; a++) for (let o = 0; o < 180; o++) {
      const la = (89 - a * 2) * Math.PI / 180, lo = (o * 2 + 1) * Math.PI / 180, cl = Math.cos(la), front = Math.cos(lo) > 0;
      const u = front ? cl * Math.sin(lo) : cl * Math.sin(lo - Math.PI), v = -Math.sin(la);
      let k = (front ? LAND : LAND_BACK).some(P => inPoly(P, u, v)) ? 1 : 0;
      if (Math.abs(la) > 68 * Math.PI / 180) k = 2;
      landT[a * 180 + o] = k;
    }
  }
  const a = Math.min(89, Math.max(0, Math.floor((89 - lat * 180 / Math.PI) / 2 + 0.5)));
  let o = Math.floor(lon * 90 / Math.PI) % 180; if (o < 0) o += 180;
  return landT[a * 180 + o];
}

// the maze cut in the globe: 6 rows by 12 columns between 60 N and 60 S, links fixed
const ROWS = 6, COLS = 12, LATN = 60 * Math.PI / 180, ROWH = 20 * Math.PI / 180, COLW = 30 * Math.PI / 180;
const hash = i => { let h = (i * 2654435761) >>> 0; h ^= h >>> 15; return h; };
const openE = Array.from({ length: ROWS * COLS }, (_, i) => hash(i + 3) % 3 !== 0 || Math.floor(i / COLS) === 2);
const openS = Array.from({ length: ROWS * COLS }, (_, i) => Math.floor(i / COLS) < ROWS - 1 && hash(i * 7 + 11) % 5 < 2);
function groove(cell, du, dv, hw) {
  const r = Math.floor(cell / COLS), c = cell % COLS, ax = Math.abs(du), ay = Math.abs(dv);
  if (ax < hw && ay < hw) return true;
  if (ay < hw) { if (du > 0 && openE[cell]) return true; if (du < 0 && openE[r * COLS + (c + COLS - 1) % COLS]) return true; }
  if (ax < hw) { if (dv > 0 && openS[cell]) return true; if (dv < 0 && r > 0 && openS[cell - COLS]) return true; }
  return false;
}
const GIRL_ROW = 2, GIRL_LAT = LATN - (GIRL_ROW + 0.5) * ROWH;

// turn a body point (lat, lon) to the screen: yaw about the up axis, then a tilt toward us
function project(lat, lon, yaw, pitch) {
  const cl = Math.cos(lat), x = cl * Math.sin(lon), y = -Math.sin(lat), z = cl * Math.cos(lon);
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw), z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  return { x: x1, y: y2, z: z2 };
}

// Paint the turning globe into a 2D context: c center, r radius. Returns its projector.
export function paintGlobe(ctx, cx, cy, r, yaw, pitch) {
  const hw = 0.075, L = [-0.45, -0.55, 0.7], ln = Math.hypot(...L), LI = L.map(v => v / ln);
  const W = 2 * r + 5, mask = new Uint8Array(W * W), col = new Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, dx = (i - r - 2) / r, dy = (j - r - 2) / r, d2 = dx * dx + dy * dy;
    if (d2 > 1) { if (d2 <= Math.pow((r + 1.3) / r, 2)) { mask[k] = 4; col[k] = '#ffffff'; } continue; }
    const z = Math.sqrt(1 - d2);
    // undo the tilt, then the yaw
    const y = dy * Math.cos(pitch) + z * Math.sin(pitch), z1 = -dy * Math.sin(pitch) + z * Math.cos(pitch);
    const bx = dx * Math.cos(yaw) - z1 * Math.sin(yaw), bz = dx * Math.sin(yaw) + z1 * Math.cos(yaw);
    const lat = Math.asin(Math.max(-1, Math.min(1, -y))); let lon = Math.atan2(bx, bz); if (lon < 0) lon += 2 * Math.PI;
    const lit = dx * LI[0] + dy * LI[1] + z * LI[2], tone = lit > 0.78 ? 0 : lit > 0.3 ? 1 : 2;
    const ld = landAt(lat, lon);
    let base = ld === 1 ? G4.land[tone] : ld === 2 ? G4.ice : G4.surf[tone];
    const fr = (LATN - lat) / ROWH, rr = Math.floor(fr);
    mask[k] = 1; col[k] = base;
    if (rr < 0 || rr >= ROWS) continue;
    const fc = lon / COLW, c = Math.floor(fc) % COLS, cell = rr * COLS + c;
    const du = (fc - Math.floor(fc) - 0.5) * COLW * Math.cos(lat), dv = (fr - rr - 0.5) * ROWH;
    if (groove(cell, du, dv, hw)) { mask[k] = 2; col[k] = G4.floor; }
  }
  // carved: a groove's upper-left wall dark, its lower-right wall lit
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i; if (mask[k] !== 2) continue;
    if ((j + 1 < W && mask[k + W] === 1) || (i + 1 < W && mask[k + 1] === 1)) col[k] = G4.edgeL;
  }
  // runs of one color, one rect each
  const x0 = cx - r - 2, y0 = cy - r - 2;
  for (let j = 0; j < W; j++) {
    let i = 0;
    while (i < W) {
      const k = j * W + i; if (!mask[k]) { i++; continue; }
      let e = i + 1; while (e < W && mask[j * W + e] && col[j * W + e] === col[k]) e++;
      ctx.fillStyle = col[k]; ctx.fillRect(x0 + i, y0 + j, e - i, 1); i = e;
    }
  }
  return (lat, lon) => { const q = project(lat, lon, yaw, pitch); return { x: Math.round(cx + q.x * r), y: Math.round(cy + q.y * r), z: q.z }; };
}

// the girl in pink, standing (or running) on the world: the same figure as globe-view.js
export function drawShowGirl(ctx, x, y, t, face) {
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h); };
  const wave = Math.floor(t * (face ? 8 : 5)) % 2, pink = '#ff8fc8', skin = '#f1c9a5', hair = '#0e0f12', ink = '#1b0f3a';
  if (face) {
    const b = face > 0 ? -1 : 1;
    R(x - 2, y - 12, 5, 3, hair); R(x - 2 + b * 3, y - 11, 2, 2, hair);
    R(x - 1, y - 9, 3, 2, skin); R(x - 2, y - 7, 5, 3, pink); R(x - 3, y - 4, 7, 2, pink); R(x + face * 3, y - 7, 1, 2, skin);
    if (wave) { R(x - 2, y - 2, 1, 2, ink); R(x + 2, y - 2, 1, 2, ink); } else { R(x, y - 2, 1, 2, ink); R(x + face, y - 2, 1, 1, ink); }
    return;
  }
  R(x - 2, y - 12, 5, 3, hair); R(x - 3, y - 11, 1, 4, hair); R(x - 1, y - 9, 3, 2, skin);
  R(x - 2, y - 7, 5, 3, pink); R(x - 3, y - 4, 7, 2, pink); R(x + 3, wave ? y - 10 : y - 8, 1, 3, skin);
  R(x - 2, y - 2, 1, 2, ink); R(x + 2, y - 2, 1, 2, ink);
}
function bead(ctx, x, y, c) {
  const R = (a, b, w, h, k) => { ctx.fillStyle = k; ctx.fillRect(a, b, w, h); };
  R(x - 2, y - 3, 5, 7, G4.beadLo); R(x - 3, y - 2, 7, 5, G4.beadLo); R(x - 1, y - 2, 3, 5, c); R(x - 2, y - 1, 5, 3, c); R(x - 1, y - 1, 1, 1, '#ffffff');
}
// the smiling satellite the zap comes from (the game show's own, wins.js)
function smileSat(ctx, x, y) {
  const R = (a, b, w, h, k) => { ctx.fillStyle = k; ctx.fillRect(a, b, w, h); };
  R(x - 9, y - 2, 6, 4, SHOW.yellow); R(x + 4, y - 2, 6, 4, SHOW.yellow);
  R(x - 3, y - 4, 7, 8, '#ffffff'); R(x - 1, y - 2, 1, 1, ink0); R(x + 2, y - 2, 1, 1, ink0); R(x - 1, y + 1, 4, 1, ink0); R(x, y - 6, 1, 2, '#ffffff');
}
const ink0 = '#1b0f3a';

// The whole screen. o: { t, score, round, lock (0 to 1, the box closing on her; null for none),
// zap (seconds since the zap, or null), top (a line across the top, or null), r2 (her lock: the
// controller is in her hands now) }
export function drawShow(ctx, w, h, o) {
  const t = o.t || 0, R = (a, b, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(a, b, ww, hh); };
  R(0, 0, w, h, SHOW.bg); R(3, 3, w - 6, h - 6, SHOW.panel);
  // the bulbs round the edge: yellow and pink, chasing after a win
  const chase = o.zap != null && o.zap < 2.5 ? Math.floor(t * 12) : Math.floor(t * 2);
  let n = 0;
  const bulb = (x, y) => { R(x, y, 2, 2, (n + chase) % 2 ? SHOW.yellow : SHOW.pink); n++; };
  for (let x = 4; x < w - 4; x += 6) { bulb(x, 0); bulb(x, h - 2); }
  for (let y = 6; y < h - 4; y += 6) { bulb(0, y); bulb(w - 2, y); }
  // left: LIVE, the score, the round
  R(7, 7, 27, 10, SHOW.pink); ccText(ctx, 'LIVE', 9, 9, '#ffffff');
  ccText(ctx, 'SCORE', 7, 22, SHOW.mint);
  ccText(ctx, String(o.score || 0), 7, 31, SHOW.yellow, { sx: 2, sy: 2 });
  ccText(ctx, 'ROUND ' + (o.round || 1), 7, 52, SHOW.pink);
  // the clock bar, running down while she is out there
  const bar = o.zap != null ? 0 : 1 - ((t * 0.08) % 1);
  R(7, 64, 54, 4, SHOW.rule); R(7, 64, Math.round(54 * bar), 4, SHOW.mint);
  ccText(ctx, o.zap != null ? 'NICE ONE!' : 'FIND HER!', 7, 74, '#ffffff');
  // right: the turning Earth, its orbit, the girl walking a groove, two beads behind her
  const cx = 128, cy = 50, r = 30;
  for (let a = 0; a < 96; a++) { const q = a / 96 * Math.PI * 2; R(Math.round(cx + Math.cos(q) * (r + 6)), Math.round(cy + Math.sin(q) * (r + 6)), 1, 1, SHOW.rule); }
  const girlLon = t * 0.35, yaw = -girlLon + 0.12 + Math.sin(t * 0.7) * 0.1, pitch = -0.3;
  const at = paintGlobe(ctx, cx, cy, r, yaw, pitch);
  const lock = o.lock, zap = o.zap;
  const close = lock == null ? 0 : Math.max(0, Math.min(1, lock));
  const g = at(GIRL_LAT, girlLon);
  [[0.9 - close * 0.55, G4.beads[0]], [1.3 - close * 0.8, G4.beads[1]]].forEach(([back, c]) => { const q = at(GIRL_LAT, girlLon - back); if (q.z > 0.05) bead(ctx, q.x, q.y, c); });
  const hit = zap != null && zap > 0.45;
  if (hit && zap < 1.6) { // where she stood: a puff of pink squares
    [[-4, -6], [3, -9], [-1, -12], [5, -4], [-6, -2]].forEach(([dx, dy], i) => R(g.x + dx + Math.round(Math.sign(dx) * zap * 4), g.y + dy - Math.round(zap * 6), 2, 2, i % 2 ? '#ff8fc8' : '#ffffff'));
  }
  // the lock: amber corners closing on her, then holding and blinking
  if (lock != null && zap == null && g.z > 0.05 && (close < 1 || Math.floor(t * 8) % 2)) {
    const s = Math.round(12 - close * 5), x0 = g.x - s, y0 = g.y - 5 - s, e = 2 * s;
    const box = (d, c) => { R(x0 - d, y0 - d, e + 1 + 2 * d, 1, c); R(x0 - d, y0 + e + d, e + 1 + 2 * d, 1, c); R(x0 - d, y0 - d, 1, e + 1 + 2 * d, c); R(x0 + e + d, y0 - d, 1, e + 1 + 2 * d, c); };
    box(1, ink0); box(-1, ink0); box(0, SHOW.amber);
  }
  if (g.z > 0.05 && !hit) drawShowGirl(ctx, g.x, g.y + 1, t, 1);
  // the zap: the smiling satellite, a pink zigzag down to her, ZAP!, +400
  if (zap != null && zap < 3) {
    const sx = cx - 22, sy = 10; smileSat(ctx, sx, sy);
    if (zap < 0.6) {
      const n2 = 6; for (let i = 0; i < n2; i++) {
        const a = i / n2, b = (i + 1) / n2, ax = sx + (g.x - sx) * a + (i % 2 ? 3 : -3), ay = sy + (g.y - 6 - sy) * a, bx = sx + (g.x - sx) * b + (i % 2 ? -3 : 3), by = sy + (g.y - 6 - sy) * b;
        const steps = Math.ceil(Math.hypot(bx - ax, by - ay)); for (let k = 0; k <= steps; k++) { const u = k / Math.max(1, steps); R(Math.round(ax + (bx - ax) * u), Math.round(ay + (by - ay) * u), 2, 2, k % 3 ? SHOW.pink : '#ffffff'); }
      }
    }
    if (zap > 0.3) {
      if (Math.floor(t * 6) % 2 || zap > 1.2) { ccText(ctx, 'ZAP!', Math.min(w - 52, g.x + 4) + 1, Math.max(14, g.y - 26) + 1, ink0, { sx: 2, sy: 2 }); ccText(ctx, 'ZAP!', Math.min(w - 52, g.x + 4), Math.max(14, g.y - 26), SHOW.yellow, { sx: 2, sy: 2 }); }
      const pw = ccWidth('+400') + 4; R(Math.min(w - pw - 4, g.x + 6), Math.max(30, g.y - 8), pw, 9, ink0); ccText(ctx, '+400', Math.min(w - pw - 4, g.x + 6) + 2, Math.max(30, g.y - 8) + 1, '#ffffff');
    }
  }
  // the channel, top right, on a dark box
  R(w - 38, 5, 33, 11, ink0); ccText(ctx, 'CH 07', w - 36, 7, SHOW.yellow);
  // a line across the top (ROUND 2 READY?), on a dark band between LIVE and the channel
  if (o.top) { const tw = ccWidth(o.top) + 8, tx = Math.round(w / 2 - tw / 2); R(tx + 6, 5, tw, 11, ink0); ccText(ctx, o.top, tx + 10, 7, SHOW.yellow); }
  // her turn: PLAYER 2 under the score
  if (o.r2) { R(6, 84, ccWidth('PLAYER 2') + 4, 10, SHOW.amber); ccText(ctx, 'PLAYER 2', 8, 85, ink0); }
  // the first frame of a win: white
  if (zap != null && zap < 0.08) R(0, 0, w, h, '#ffffff');
}

// The same game, small: for a screen seen across a room inside another picture (the couch in THE
// COUCH, the playroom wall in LOOK BACK). The game show's panel and bulbs, LIVE, the score, the
// turning Earth with its maze and the girl in pink walking it, two beads behind her, the amber
// box on her now and then. x0, y0, w, h: where, in ctx; o: { t, score, lock (force the box on) }.
export function drawShowMini(ctx, x0, y0, w, h, o) {
  const t = o.t || 0, R = (a, b, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(x0 + a, y0 + b, ww, hh); };
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  R(0, 0, w, h, SHOW.bg); R(2, 2, w - 4, h - 4, SHOW.panel);
  let n = 0; const chase = Math.floor(t * 3);
  const bulb = (x, y) => { R(x, y, 1, 1, (n + chase) % 2 ? SHOW.yellow : SHOW.pink); n++; };
  for (let x = 2; x < w - 2; x += 4) { bulb(x, 0); bulb(x, h - 1); }
  for (let y = 3; y < h - 2; y += 4) { bulb(0, y); bulb(w - 1, y); }
  R(4, 4, 25, 9, SHOW.pink); ccText(ctx, 'LIVE', x0 + 5, y0 + 5, '#ffffff');
  ccText(ctx, 'SCORE', x0 + 4, y0 + 16, SHOW.mint);
  ccText(ctx, String(o.score != null ? o.score : 2400 + Math.floor(t / 2.5) * 400), x0 + 4, y0 + 25, SHOW.yellow);
  const r = Math.max(9, Math.min(Math.floor(h / 2) - 4, Math.floor((w - 40) / 2) - 2)), cx = x0 + w - r - 6, cy = y0 + Math.floor(h / 2) + 1;
  const girlLon = t * 0.35, at = paintGlobe(ctx, cx, cy, r, -girlLon + 0.12 + Math.sin(t * 0.7) * 0.1, -0.3);
  const g = at(GIRL_LAT, girlLon);
  [[0.9, G4.beads[0]], [1.3, G4.beads[1]]].forEach(([back, c]) => { const q = at(GIRL_LAT, girlLon - back); if (q.z > 0.05) bead(ctx, q.x, q.y, c); });
  if (g.z > 0.05) {
    if (o.lock || Math.floor(t / 1.5) % 3 === 2) { const s = 8; ctx.strokeStyle = SHOW.amber; ctx.lineWidth = 1; if (Math.floor(t * 8) % 2) ctx.strokeRect(g.x - s + 0.5, g.y - 6 - s + 0.5, 2 * s, 2 * s); }
    drawShowGirl(ctx, g.x, g.y + 1, t, 1);
  }
  ctx.restore();
}

// One screen in a Phaser scene: its own canvas, an image at (x, y) in the world.
let serial = 0;
export class ShowScreen {
  constructor(scene, x, y, w, h, depth) {
    this.w = w; this.h = h;
    this.canvas = document.createElement('canvas'); this.canvas.width = w; this.canvas.height = h; this.ctx = this.canvas.getContext('2d');
    this.key = 'show_screen_' + (++serial);
    this.tex = scene.textures.addCanvas(this.key, this.canvas);
    this.img = scene.add.image(x, y, this.key).setOrigin(0).setDepth(depth == null ? 1 : depth);
    scene.events.once('shutdown', () => { if (scene.textures.exists(this.key)) scene.textures.remove(this.key); });
  }
  setVisible(v) { this.img.setVisible(v); return this; }
  get visible() { return this.img.visible; }
  draw(o) { drawShow(this.ctx, this.w, this.h, o); if (this.tex.refresh) this.tex.refresh(); }
}
