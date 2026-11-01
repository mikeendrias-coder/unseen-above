// Pixel painter: draws pixel-exact shapes into a canvas with palette inks.
// An ink is '#rrggbb' or a two-color dither 'd:<cell color>:<base color>:<checker|q25|q12|rows>'.
// Every fill is whole-pixel fillRect calls, so nothing is anti-aliased.
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

export class Painter {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.canvas = document.createElement('canvas'); this.canvas.width = w; this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');
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
  // Translucent fills for light, shadow and haze.
  glowRect(x, y, w, h, c, a) { this.ctx.globalAlpha = a; this.rect(x, y, w, h, c); this.ctx.globalAlpha = 1; }
  glowCircle(cx, cy, r, c, a) { this.ctx.globalAlpha = a; this.circle(cx, cy, r, c); this.ctx.globalAlpha = 1; }
  glowPoly(pts, c, a) { this.ctx.globalAlpha = a; this.poly(pts, c); this.ctx.globalAlpha = 1; }
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
