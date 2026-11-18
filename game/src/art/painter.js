// Pixel painter: draws pixel-exact shapes into a canvas with palette inks.
import { ASH } from './palettes.js';
// An ink is '#rrggbb' or a two-color dither 'd:<cell color>:<base color>:<checker|q25|q12|rows>'.
// Every fill is whole-pixel fillRect calls, so nothing is anti-aliased.
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

export class Painter {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.canvas = document.createElement('canvas'); this.canvas.width = w; this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.patterns = new Map();
    this.marks = []; // points of interest recorded while painting (glints, lamps) for animation later
  }
  paint(c) {
    if (c == null) return null;
    if (!c.startsWith('d:')) return c;
    if (this.patterns.has(c)) return this.patterns.get(c);
    const [, a, b, type] = c.split(':');
    const size = type === 'q12' ? 4 : 2, t = document.createElement('canvas'); t.width = size; t.height = size;
    const x = t.getContext('2d'); x.fillStyle = b; x.fillRect(0, 0, size, size); x.fillStyle = a;
    const cells = type === 'checker' ? [[0, 0], [1, 1]] : type === 'q25' ? [[0, 0]] : type === 'q12' ? [[0, 0], [2, 2]] : [[0, 0], [1, 0]];
    cells.forEach(([cx, cy]) => x.fillRect(cx, cy, 1, 1));
    const p = this.ctx.createPattern(t, 'repeat'); this.patterns.set(c, p); return p;
  }
  rect(x, y, w, h, c) {
    const p = this.paint(c); if (p == null) return;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = p; this.ctx.fillRect(x, y, w, h);
  }
  px(x, y, c) { this.rect(x, y, 1, 1, c); }
  circle(cx, cy, r, c) { for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); this.rect(cx - hw, cy + dy, 2 * hw + 1, 1, c); } }
  ellipse(cx, cy, rx, ry, c) { for (let dy = -ry; dy <= ry; dy++) { const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) + 0.35); this.rect(cx - hw, cy + dy, 2 * hw + 1, 1, c); } }
  spans(pts, fn) {
    let y0 = Infinity, y1 = -Infinity; pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > yc) !== (yj > yc)) xs.push(xi + (yc - yi) * (xj - xi) / (yj - yi)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) fn(a, y, b - a); }
    }
  }
  poly(pts, c) { this.spans(pts, (x, y, w) => this.rect(x, y, w, 1, c)); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // Light and shade, hard-edged (Nov 17 final pass: no alpha haze anywhere). Each pixel under the
  // shape is mixed toward the light by a and snapped to the nearest palette color; where the mix
  // is too small to reach a new color, the next color is laid as a 1-in-4 or checker dither. So a
  // lamp gives flat steps of lighter tone, and every color stays in the palette.
  shade(spans, c, a) {
    if (!(a > 0)) return;
    const L = rgbOf(flat(c)), rows = []; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    spans((x, y, w) => { x = Math.max(0, Math.round(x)); const xe = Math.min(this.w, Math.round(x + w)); y = Math.round(y); if (xe <= x || y < 0 || y >= this.h) return; rows.push([x, y, xe]); x0 = Math.min(x0, x); x1 = Math.max(x1, xe); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); });
    if (!rows.length) return;
    const W = x1 - x0, img = this.ctx.getImageData(x0, y0, W, y1 - y0), d = img.data, seen = new Set();
    rows.forEach(([xa, y, xb]) => {
      if (seen.has(y * 4096 + xa)) return; seen.add(y * 4096 + xa); // overlapping spans light once
      for (let x = xa; x < xb; x++) {
        const i = ((y - y0) * W + (x - x0)) * 4; if (d[i + 3] === 0) continue;
        const o = [d[i], d[i + 1], d[i + 2]]; if (!inPal(o)) continue;
        const t = o.map((v, k) => v + (L[k] - v) * a);
        let n = nearest(t);
        if (same(n, o)) {
          const u = nearest(t, o); if (!u) continue;
          const du = u.map((v, k) => v - o[k]), len = du.reduce((s2, v) => s2 + v * v, 0), f = len ? du.reduce((s2, v, k) => s2 + v * (t[k] - o[k]), 0) / len : 0;
          const on = f >= 0.375 ? (x + y) % 2 === 0 : f >= 0.125 ? (x % 2 === 0 && y % 2 === 0) : false;
          if (!on) continue; n = u;
        }
        d[i] = n[0]; d[i + 1] = n[1]; d[i + 2] = n[2];
      }
    });
    this.ctx.putImageData(img, x0, y0);
  }
  glowRect(x, y, w, h, c, a) { this.shade(fn => { for (let j = 0; j < Math.round(h); j++) fn(x, y + j, w); }, c, a); }
  glowCircle(cx, cy, r, c, a) { this.shade(fn => { for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); fn(cx - hw, cy + dy, 2 * hw + 1); } }, c, a); }
  glowPoly(pts, c, a) { this.shade(fn => this.spans(pts, fn), c, a); }
  // a lamp: three hard rings of light, the brightest at the middle
  softGlow(cx, cy, r, c, a) { this.glowCircle(cx, cy, r, c, a * 0.45); this.glowCircle(cx, cy, Math.round(r * 0.66), c, a * 0.6); this.glowCircle(cx, cy, Math.round(r * 0.36), c, a); }
  mark(kind, x, y, extra) { this.marks.push(Object.assign({ kind, x, y }, extra || {})); }
  // Register the canvas as a Phaser texture (nearest-neighbor filtering comes from pixelArt mode).
  toTexture(scene, key) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    return scene.textures.addCanvas(key, this.canvas);
  }
}

// A 1-bit-safe helper: the flat tone a dither ink averages to, for code that needs one color.
export function flat(c) {
  if (!c || !c.startsWith('d:')) return c;
  const [, a, b, type] = c.split(':'), t = type === 'q25' ? 0.25 : type === 'q12' ? 0.125 : 0.5;
  const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + A.map((v, i) => Math.round(v * t + B[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
}
export const hexNum = c => parseInt(flat(c).slice(1), 16);

// The palette light and shade snap to: Ash and Gold and black. Red (the watchers) and amber (the
// lock box) are never made by light, and pixels in them are left as they are.
const rgbOf = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const KEEP = ['red', 'redHi', 'amber'];
const PAL = [...new Set(Object.entries(ASH).filter(([k]) => !KEEP.includes(k)).map(([, v]) => v).concat(['#000000']))].map(rgbOf);
const inPal = c => PAL.some(p => same(p, c));
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
// the palette color nearest t (skipping `not`), by weighted distance
function nearest(t, not) {
  let best = null, bd = Infinity;
  for (const p of PAL) { if (not && same(p, not)) continue; const dr = p[0] - t[0], dg = p[1] - t[1], db = p[2] - t[2], dd = 3 * dr * dr + 4 * dg * dg + 2 * db * db; if (dd < bd) { bd = dd; best = p; } }
  return best;
}
