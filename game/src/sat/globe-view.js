// Draws the turning puzzles in 2D. The surface (globe or ring) is painted pixel by pixel into a
// small canvas each frame: every pixel of the disc is turned back onto the body to find its
// latitude and longitude, so only the front half is ever drawn and every edge stays on the
// pixel grid. Beads, targets and gates are points on the body, turned, projected, dropped when
// they face away, and drawn back to front with whole-pixel rectangles.
import { RING, apply, applyT, rotM } from './globe-logic.js';
import { LAND, inPoly } from './wins.js';

const H = h => parseInt(h.slice(1), 16);
// ImageData wants 0xAABBGGRR on little-endian machines
const px32 = h => { const v = H(h); return (0xff000000 | ((v & 0xff) << 16) | (v & 0xff00) | (v >> 16)) >>> 0; };

// Each screen's colors for the puzzle. surf: lit, mid, shade. floor: the groove's bottom;
// edgeD and edgeL: its shadowed and lit walls. beads: one color per bead. back: the grooves of the
// ring's far side, seen faintly through the middle, so the maze reads as one loop.
export const PAL = {
  1: { surf: ['#1d5a2c', '#154a23', '#0e3519'], grid: '#1a4f27', floor: '#020403', edgeD: '#020403', edgeL: '#3dff74', outline: '#1d7a3a', blur: ['#0d2a14', '#14401f', '#1d7a3a'], beads: ['#c6ffd6', '#ffb347'], beadLo: '#1d7a3a', target: '#ff4d4d', gate: '#c6ffd6', inner: '#04100a', back: '#0e3519', rim: '#1d7a3a' },
  2: { surf: ['#34485e', '#2a3a4c', '#1e2a37'], floor: '#0a1018', edgeD: '#05080c', edgeL: '#7f9fb0', outline: '#5f7f8a', blur: ['#2a3a4c', '#3c5066', '#5f7f8a'], beads: ['#ffb347', '#59d38a'], beadLo: '#0a1018', target: '#ff5a4a', gate: '#c8d6e5', inner: '#121a24', back: '#2a3a4c', rim: '#5f7f8a' },
  3: { surf: ['#ffffff', '#f3f4f6', '#e2e5ea'], floor: '#aeb7c4', edgeD: '#7a8597', edgeL: '#d5dae1', outline: '#2f3a4a', blur: ['#9aa4b3', '#b7bfcb', '#7a8597'], beads: ['#3b6fd8', '#ff9f1c'], beadLo: '#1b3a80', target: '#d94a4a', gate: '#2f3a4a', inner: '#cfd5de', back: '#aeb7c4', rim: '#2f3a4a' },
  4: { surf: ['#7fa4ff', '#4f7fff', '#3a5fd6'], land: ['#3ee6a0', '#21b77e', '#1f9e6e'], ice: '#eef3ff', floor: '#1b0f3a', edgeD: '#1b0f3a', edgeL: '#ffd23f', outline: '#ffffff', blur: ['#b8a8ff', '#ff5fa2', '#4b3a96'], beads: ['#ffffff', '#3ee6c1'], beadLo: '#1b0f3a', target: '#ff5fa2', gate: '#ffffff', inner: '#2b1a5c', back: '#4b3a96', rim: '#ffd23f', thick: true }
};

// The far side of the cartoon Earth (the near side is the picture in wins.js): Asia, India,
// the islands, Australia. Unit coordinates on the disc, as seen from behind.
const LAND_BACK = [
  [[-0.86, -0.42], [-0.6, -0.7], [-0.1, -0.82], [0.42, -0.74], [0.7, -0.5], [0.62, -0.3], [0.44, -0.18], [0.3, -0.02], [0.06, -0.08], [-0.2, -0.04], [-0.46, -0.16], [-0.72, -0.2]], // Asia
  [[-0.2, -0.06], [0.02, -0.06], [-0.08, 0.22]],                                                   // India
  [[0.2, 0.02], [0.4, 0.06], [0.46, 0.18], [0.24, 0.16]],                                           // the islands
  [[0.66, -0.36], [0.76, -0.4], [0.74, -0.22], [0.66, -0.24]],                                       // Japan
  [[0.14, 0.4], [0.44, 0.34], [0.6, 0.46], [0.52, 0.66], [0.24, 0.66], [0.1, 0.54]]                // Australia
];
let landTable = null;
function land(lat, lon) { // lat, lon in radians; lon in [0, 2pi)
  if (!landTable) {
    landTable = new Uint8Array(180 * 360);
    for (let a = 0; a < 180; a++) for (let o = 0; o < 360; o++) {
      const la = (89.5 - a) * Math.PI / 180, lo = (o + 0.5) * Math.PI / 180;
      const cl = Math.cos(la), front = Math.cos(lo) > 0;
      const u = front ? cl * Math.sin(lo) : cl * Math.sin(lo - Math.PI), v = -Math.sin(la);
      let k = (front ? LAND : LAND_BACK).some(P => inPoly(P, u, v)) ? 1 : 0;
      if (Math.abs(la) > 68 * Math.PI / 180) k = 2; // ice at the poles
      landTable[a * 360 + o] = k;
    }
  }
  const a = Math.min(179, Math.max(0, Math.floor(89.5 - lat * 180 / Math.PI + 0.5))), o = Math.floor(lon * 180 / Math.PI) % 360;
  return landTable[a * 360 + o];
}

let serial = 0;
const LIGHT = (() => { const v = [-0.45, -0.55, 0.7], l = Math.hypot(...v); return v.map(x => x / l); })();

export class TurnView {
  // B: the board (globe-logic buildBoard); cx, cy: the center on the 320 x 180 screen
  constructor(scene, B, skin, cx, cy, depth) {
    this.scene = scene; this.B = B; this.skin = skin; this.P = PAL[skin]; this.cx = cx; this.cy = cy;
    if (B.ring) { this.R = RING.R; this.w = 2 * RING.R + 5; this.h = 2 * Math.ceil(0.5736 * RING.R + 0.8192 * RING.hw) + 7; }
    else { this.R = 62; this.w = this.h = 2 * this.R + 7; }
    this.ox = Math.floor(this.w / 2); this.oy = Math.floor(this.h / 2); // the center pixel
    this.canvas = document.createElement('canvas'); this.canvas.width = this.w; this.canvas.height = this.h;
    this.ctx = this.canvas.getContext('2d');
    this.img = this.ctx.createImageData(this.w, this.h); this.buf = new Uint32Array(this.img.data.buffer);
    this.mask = new Uint8Array(this.w * this.h); this.cellOf = new Int16Array(this.w * this.h);
    this.key = 'sat_turn_' + (++serial);
    this.tex = scene.textures.addCanvas(this.key, this.canvas);
    this.image = scene.add.image(cx - this.ox, cy - this.oy, this.key).setOrigin(0).setDepth(depth || 5);
    this.g = scene.add.graphics().setDepth((depth || 5) + 0.5);
    scene.events.once('shutdown', () => { this.image.destroy(); this.g.destroy(); if (scene.textures.exists(this.key)) scene.textures.remove(this.key); });
    const c = this.P; this.col = {}; Object.keys(c).forEach(k => { if (typeof c[k] === 'string') this.col[k] = px32(c[k]); else if (Array.isArray(c[k])) this.col[k] = c[k].map(px32); });
    // open grooves out of each cell: east and south (west and north are the neighbors')
    const n = B.n, cols = B.cols; this.openE = new Uint8Array(n); this.openS = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), c2 = i % cols; this.openE[i] = B.isOpen(i, r * cols + (c2 + 1) % cols) ? 1 : 0; if (r + 1 < B.rows) this.openS[i] = B.isOpen(i, i + cols) ? 1 : 0; }
  }
  setVisible(v) { this.image.setVisible(v); this.g.setVisible(v); }
  destroy() { this.image.destroy(); this.g.destroy(); }
  bounds() { return { x: this.cx - this.ox, y: this.cy - this.oy, w: this.w, h: this.h }; }

  // is the groove pattern open at cell-local offsets (du, dv) in the same units as hw
  groove(i, du, dv, hw) {
    const B = this.B, cols = B.cols, r = Math.floor(i / cols), c = i % cols;
    const ax = Math.abs(du), ay = Math.abs(dv);
    if (ax < hw && ay < hw) return true;
    if (ay < hw) { if (du > 0 && this.openE[i]) return true; if (du < 0 && this.openE[r * cols + (c + cols - 1) % cols]) return true; }
    if (ax < hw) { if (dv > 0 && this.openS[i]) return true; if (dv < 0 && r > 0 && this.openS[i - cols]) return true; }
    return false;
  }

  // ------------------------------------------------------------------ the surface
  // mask: 0 nothing, 1 surface, 2 groove, 3 blurred, 4 outline, 5 inner face (ring), 6 band edge
  paint(yaw, pitch, t) {
    const m = rotM(yaw, pitch); this.m = m;
    if (this.B.ring) this.paintRing(m); else this.paintGlobe(m, t);
    this.edges(t);
    this.ctx.putImageData(this.img, 0, 0);
    if (this.tex.refresh) this.tex.refresh();
  }
  paintGlobe(m, t) {
    const { w, h, ox, oy, R, mask, buf, col, P } = this, B = this.B, S = B.S, rows = S.rows, cols = S.cols;
    // the groove's half width: narrower on a finer grid, so the walls still read
    const hw = 0.072 * Math.min(1, Math.sqrt(Math.min(S.rowH / (24 * Math.PI / 180), S.colW / (30 * Math.PI / 180))));
    const outR = (R + (P.thick ? 2.2 : 1.2)) / R, out2 = outR * outR, earth = this.skin === 4;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = j * w + i, dx = (i - ox) / R, dy = (j - oy) / R, d2 = dx * dx + dy * dy;
      this.cellOf[k] = -1;
      if (d2 > 1) { if (d2 <= out2) { mask[k] = 4; buf[k] = col.outline; } else { mask[k] = 0; buf[k] = 0; } continue; }
      const z = Math.sqrt(1 - d2), b = applyT(m, dx, dy, z);
      const lat = Math.asin(Math.max(-1, Math.min(1, -b[1]))); let lon = Math.atan2(b[0], b[2]); if (lon < 0) lon += 2 * Math.PI;
      const lit = dx * LIGHT[0] + dy * LIGHT[1] + z * LIGHT[2], tone = lit > 0.78 ? 0 : lit > 0.3 ? 1 : 2;
      let base = col.surf[tone];
      if (earth) { const L = land(lat, lon); if (L === 1) base = col.land[tone]; else if (L === 2) base = col.ice; }
      const fr = (S.latN - lat) / S.rowH, r = Math.floor(fr);
      if (r < 0 || r >= rows) { mask[k] = 1; buf[k] = base; continue; }
      const fc = lon / S.colW, c = Math.floor(fc) % cols, cell = r * cols + c;
      if (B.blur[cell]) { mask[k] = 3; this.cellOf[k] = cell; continue; }
      const du = (fc - Math.floor(fc) - 0.5) * S.colW * Math.cos(lat), dv = (fr - r - 0.5) * S.rowH;
      if (this.groove(cell, du, dv, hw)) { mask[k] = 2; buf[k] = col.floor; }
      else {
        mask[k] = 1; buf[k] = base;
        // the back-end screen shows its grid lines on the bare surface
        if (this.skin === 1 && (Math.abs(du) > S.colW * Math.cos(lat) * 0.5 - 0.012 || Math.abs(dv) > S.rowH * 0.5 - 0.012)) buf[k] = col.grid;
      }
    }
  }
  paintRing(m) {
    const { w, h, ox, oy, mask, buf, col } = this, S = RING, R = S.R, hwB = S.hw, B = this.B, rows = S.rows, cols = S.cols;
    const st = Math.sin(S.tilt), ct = Math.cos(S.tilt), colW = 2 * Math.PI / cols, rowH = 2 * hwB / rows, hw = 4;
    const phi = Math.atan2(m[2], m[0]); // the turn about the ring's axis
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = j * w + i, x = i - ox, y = j - oy, s = x / R;
      mask[k] = 0; buf[k] = 0; this.cellOf[k] = -1;
      if (Math.abs(s) > 1) continue;
      const cf = Math.sqrt(1 - s * s);
      // the front of the band: its outer face
      const hf = (y + R * cf * st) / ct;
      if (Math.abs(hf) <= hwB + 0.5) {
        let th = Math.atan2(s, cf) - phi; th = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const nl = s * LIGHT[0] + (-cf * st) * LIGHT[1] + cf * ct * LIGHT[2], tone = nl > 0.75 ? 0 : nl > 0.35 ? 1 : 2;
        if (Math.abs(hf) > hwB - 1) { mask[k] = 6; buf[k] = col.rim; continue; }
        const fr = (hf + hwB) / rowH, r = Math.min(rows - 1, Math.floor(fr)), fc = th / colW, c = Math.floor(fc) % cols, cell = r * cols + c;
        const du = (fc - Math.floor(fc) - 0.5) * colW * R, dv = (fr - r - 0.5) * rowH;
        if (this.groove(cell, du, dv, hw)) { mask[k] = 2; buf[k] = col.floor; }
        else { mask[k] = 1; buf[k] = col.surf[tone]; }
        continue;
      }
      // the back of the band: the inside of the ring shows through the middle, with the far
      // side's grooves drawn faintly, so a dot that goes round the back stays in the maze
      const hb = (y - R * cf * st) / ct;
      if (Math.abs(hb) <= hwB + 0.5) {
        mask[k] = 5;
        if (Math.abs(hb) > hwB - 1) { buf[k] = col.rim; continue; }
        let th = Math.atan2(s, -cf) - phi; th = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const fr = (hb + hwB) / rowH, r = Math.min(rows - 1, Math.floor(fr)), fc = th / colW, c = Math.floor(fc) % cols, cell = r * cols + c;
        const du = (fc - Math.floor(fc) - 0.5) * colW * R, dv = (fr - r - 0.5) * rowH;
        buf[k] = this.groove(cell, du, dv, hw) ? col.back : col.inner;
      }
    }
  }
  // carved look: a groove's upper-left wall in shadow, its lower-right wall lit; the blur is a
  // coarse mosaic that shimmers
  edges(t) {
    const { w, h, mask, buf, col } = this, tick = Math.floor(t * 5);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = j * w + i, mk = mask[k];
      if (mk === 3) { const bx = Math.floor((i + 64) / 4), by = Math.floor((j + 64) / 4), hsh = ((bx * 73856093) ^ (by * 19349663) ^ (tick * 83492791)) >>> 0; buf[k] = col.blur[hsh % 3]; continue; }
      if (mk !== 2) continue;
      const up = j > 0 ? mask[k - w] : 0, lf = i > 0 ? mask[k - 1] : 0, dn = j + 1 < h ? mask[k + w] : 0, rt = i + 1 < w ? mask[k + 1] : 0;
      if (up === 1 || lf === 1) buf[k] = col.edgeD;
      else if (dn === 1 || rt === 1) buf[k] = col.edgeL;
    }
  }

  // ------------------------------------------------------------------ points on the body
  // a body point to the screen: { x, y, z } with z > 0 facing us
  project(p) {
    const v = apply(this.m, p[0], p[1], p[2]), s = this.B.ring ? 1 : this.R;
    return { x: Math.floor(this.cx + 0.5 + v[0] * s), y: Math.floor(this.cy + 0.5 + v[1] * s), z: this.B.ring ? v[2] / RING.R : v[2], vx: v[0] * s, vy: v[1] * s };
  }
  cellPos(i) { const p = this.B.pos; return [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]]; }
  // between two cells, u from 0 to 1, along the surface
  between(a, b, u) {
    const A = this.cellPos(a), Bp = this.cellPos(b);
    const v = [A[0] + (Bp[0] - A[0]) * u, A[1] + (Bp[1] - A[1]) * u, A[2] + (Bp[2] - A[2]) * u];
    if (this.B.ring) { const r = Math.hypot(v[0], v[2]); return [v[0] * RING.R / r, v[1], v[2] * RING.R / r]; }
    const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l];
  }
  // Is a projected point in front and not hidden behind the front band (ring)
  seen(q) { return q.z > 0.04; }

  // things on the surface, drawn back to front. items: { p (body point), kind, ... }
  drawThings(items, t) {
    const g = this.g; g.clear();
    const list = items.map(it => Object.assign({ q: this.project(it.p) }, it)).sort((a, b) => a.q.z - b.q.z);
    list.forEach(it => {
      const q = it.q;
      if (!this.seen(q)) {
        // on the ring's far side, where the band shows through the middle: drawn small, in place
        if (this.onBack(q)) { if (it.kind === 'bead') this.beadBack(q.x, q.y, it.color); else if (it.kind === 'target') this.targetBack(q.x, q.y, it.color, it.lock); return; }
        if (it.tick) this.rimTick(q, it.color, t); return;
      }
      if (it.kind === 'bead') this.bead(q.x, q.y, it.color, it.caught);
      else if (it.kind === 'target') this.target(q.x, q.y, it.color, t, it.lock);
      else if (it.kind === 'gate') this.gate(it, q);
      else if (it.kind === 'girl') this.girl(q.x, q.y, t, it.hair, it.face);
      else if (it.kind === 'mark') this.mark(q.x, q.y, it.color, it.u);
      else if (it.kind === 'trail') this.rect(q.x, q.y, 1, 1, H(it.color));
    });
  }
  // is a projected point on the ring's far band, not hidden by the near one
  onBack(q) {
    if (!this.B.ring) return false;
    const i = q.x - (this.cx - this.ox), j = q.y - (this.cy - this.oy);
    return i >= 0 && j >= 0 && i < this.w && j < this.h && this.mask[j * this.w + i] === 5;
  }
  beadBack(x, y, color) {
    this.rect(x - 2, y - 1, 5, 3, H(this.P.beadLo)); this.rect(x - 1, y - 2, 3, 5, H(this.P.beadLo));
    this.rect(x - 1, y - 1, 3, 3, H(color));
  }
  targetBack(x, y, color, lock) {
    const c = H(lock ? '#ffb01f' : color);
    this.rect(x - 2, y - 2, 5, 1, c); this.rect(x - 2, y + 2, 5, 1, c); this.rect(x - 2, y - 2, 1, 5, c); this.rect(x + 2, y - 2, 1, 5, c);
    this.rect(x, y, 1, 1, c);
  }
  rect(x, y, w, h, c, a) { this.g.fillStyle(c, a == null ? 1 : a); this.g.fillRect(Math.round(x), Math.round(y), w, h); }
  // something behind the ball: a blinking mark on the outline, where it would come round
  rimTick(q, color, t) {
    if (Math.floor(t * 3) % 2) return;
    const a = Math.atan2(q.vy, q.vx), rx = this.B.ring ? RING.R + 3 : this.R + 4, ry = this.B.ring ? this.oy + 1 : this.R + 4;
    this.rect(Math.floor(this.cx + 0.5 + Math.cos(a) * rx) - 1, Math.floor(this.cy + 0.5 + Math.sin(a) * ry) - 1, 3, 3, H(color));
  }
  bead(x, y, color, caught) {
    const lo = H(this.P.beadLo), c = H(color);
    this.rect(x - 2, y - 3, 5, 7, lo); this.rect(x - 3, y - 2, 7, 5, lo);
    this.rect(x - 1, y - 2, 3, 5, c); this.rect(x - 2, y - 1, 5, 3, c);
    this.rect(x - 1, y - 1, 1, 1, 0xffffff);
    if (caught) { this.rect(x - 1, y + 4, 3, 1, c, 0.6); }
  }
  target(x, y, color, t, lock) {
    const c = H(color), pulse = Math.floor(t * 4) % 2;
    // a ring with a dot, like a pin on a map, and lock-on corners that pulse
    this.rect(x - 2, y - 4, 5, 1, c); this.rect(x - 2, y + 4, 5, 1, c); this.rect(x - 4, y - 2, 1, 5, c); this.rect(x + 4, y - 2, 1, 5, c);
    this.rect(x - 3, y - 3, 1, 1, c); this.rect(x + 3, y - 3, 1, 1, c); this.rect(x - 3, y + 3, 1, 1, c); this.rect(x + 3, y + 3, 1, 1, c);
    this.rect(x, y, 1, 1, c);
    const r = 6 + pulse;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { this.rect(sx < 0 ? x - r : x + r - 1, y + sy * r - (sy < 0 ? 0 : 1), 2, 1, c, 0.8); this.rect(x + sx * r - (sx < 0 ? 0 : 1), sy < 0 ? y - r : y + r - 1, 1, 2, c, 0.8); });
    if (lock) { const a = H('#ffb01f'); this.rect(x - 8, y - 8, 17, 1, a); this.rect(x - 8, y + 8, 17, 1, a); this.rect(x - 8, y - 8, 1, 17, a); this.rect(x + 8, y - 8, 1, 17, a); }
  }
  // a one-way gate: an arrow in the groove, pointing the way a bead may pass
  gate(it, q) {
    const a = this.project(it.from), b = this.project(it.to), dx = b.vx - a.vx, dy = b.vy - a.vy, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    const c = H(this.P.gate), lo = H(this.P.beadLo), g = this.g;
    const pt = (f, s) => [q.x + 0.5 + ux * f - uy * s, q.y + 0.5 + uy * f + ux * s];
    const tri = (o, col) => { const [x1, y1] = pt(3 + o, 0), [x2, y2] = pt(-2 - o, 3 + o), [x3, y3] = pt(-2 - o, -3 - o); g.fillStyle(col, 1); g.fillTriangle(Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2), Math.round(x3), Math.round(y3)); };
    tri(1, lo); tri(0, c);
  }
  // where a walking target steps next: a dashed box that closes up as the step comes (u: 0 to 1)
  mark(x, y, color, u) {
    const c = H(color);
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([dx, dy]) => this.rect(x + dx, y + dy, 1, 1, c));
    if (u > 0.4) { this.rect(x - 1, y - 3, 3, 1, c); this.rect(x - 1, y + 3, 3, 1, c); this.rect(x - 3, y - 1, 1, 3, c); this.rect(x + 3, y - 1, 1, 3, c); }
    if (u > 0.75) this.rect(x, y, 1, 1, c);
  }
  // the game show's target: a girl in pink, standing on the world, waving (or running: face +1 or
  // -1 on screen)
  girl(x, y, t, hair, face) {
    const wave = Math.floor(t * (face ? 8 : 5)) % 2, pink = 0xff8fc8, hi = H(hair || '#2a1d16');
    if (face) {
      // running: hair streams behind, legs apart and together
      const b = face > 0 ? -1 : 1;
      this.rect(x - 2, y - 12, 5, 3, hi); this.rect(x - 2 + b * 3, y - 11, 2, 2, hi);
      this.rect(x - 1, y - 9, 3, 2, 0xf1c9a5);
      this.rect(x - 2, y - 7, 5, 3, pink); this.rect(x - 3, y - 4, 7, 2, pink);
      this.rect(x + face * 3, y - 7, 1, 2, 0xf1c9a5);
      if (wave) { this.rect(x - 2, y - 2, 1, 2, 0x1b0f3a); this.rect(x + 2, y - 2, 1, 2, 0x1b0f3a); }
      else { this.rect(x, y - 2, 1, 2, 0x1b0f3a); this.rect(x + face, y - 2, 1, 1, 0x1b0f3a); }
      return;
    }
    this.rect(x - 2, y - 12, 5, 3, hi); this.rect(x - 3, y - 11, 1, 4, hi);
    this.rect(x - 1, y - 9, 3, 2, 0xf1c9a5);
    this.rect(x - 2, y - 7, 5, 3, pink); this.rect(x - 3, y - 4, 7, 2, pink);
    this.rect(x + 3, wave ? y - 10 : y - 8, 1, 3, 0xf1c9a5);
    this.rect(x - 2, y - 2, 1, 2, 0x1b0f3a); this.rect(x + 2, y - 2, 1, 2, 0x1b0f3a);
  }
}
