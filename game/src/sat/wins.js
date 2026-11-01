// What a solved board looks and sounds like, one way per screen. The laser shows a little more
// on each: the back end only logs a discharge window, the ground station opens a beam window,
// the flat map marks a delivery, and the game show draws a cartoon zap from a smiling satellite.
// Every win also plays Sound.charge(), the laser's charging sound (a clue on purpose).
import { pixText, textWidth } from '../art/pixfont.js';
import { Sound } from '../core/sound.js';
import { SatelliteStrike } from '../art/strike.js';
import { Painter, flat } from '../art/painter.js';
import { LOOKS } from '../art/palettes.js';
import { state } from '../core/state.js';

const H = h => parseInt(h.slice(1), 16);
export const WIN_SECONDS = { 1: 2.1, 2: 2.1, 3: 1.9, 4: 3.2 };

// the cartoon colors the strike borrows on the game show screen
const TOON = { hazard: '#ff5fa2', hazardCore: '#ffffff', device: '#2b1a5c', glassLit: '#ffd23f', glass: '#5b8cff', colHi: '#ffffff', void: '#1b0f3a', lamp: '#ffd23f' };

export function winSound(scene, skin) {
  const later = (s, fn) => scene.time.delayedCall(s * 1000, fn);
  if (skin === 1) [0.25, 0.45, 0.65, 0.85].forEach((d, i) => later(d, () => Sound.tone(i === 3 ? 1760 : 1200, 0.05, 'square', 0.02)));
  if (skin === 2) { later(0.2, () => { Sound.noise(0.6, 0.05, 2600); Sound.tone(240, 0.7, 'sine', 0.025, 1500); }); later(0.95, () => Sound.tone(1100, 0.12, 'square', 0.015)); }
  if (skin === 3) later(0.3, () => { Sound.tone(1318, 0.16, 'sine', 0.03); later(0.12, () => Sound.tone(1760, 0.32, 'sine', 0.03)); });
  if (skin === 4) [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => later(i * 0.085, () => Sound.tone(f, 0.2, i % 2 ? 'triangle' : 'square', 0.024, null, 0.3)));
}

// The game show's Earth: a cartoon globe the kids would recognize (the Americas, Africa and
// Europe, Greenland, a few clouds), shaded like a ball, with a thick white outline. Shapes are
// in unit coordinates on the disc, so the globe draws cleanly at any size.
const LAND = [
  [[-0.78, -0.5], [-0.55, -0.72], [-0.2, -0.74], [-0.02, -0.56], [-0.12, -0.42], [-0.18, -0.24], [-0.32, -0.12], [-0.42, -0.02], [-0.5, -0.18], [-0.7, -0.26]], // North America
  [[-0.42, -0.04], [-0.3, -0.06], [-0.22, 0.12], [-0.3, 0.16]],                                                   // Central America
  [[-0.3, 0.12], [-0.06, 0.16], [0.08, 0.34], [-0.02, 0.56], [-0.16, 0.86], [-0.28, 0.74], [-0.36, 0.42]],          // South America
  [[-0.22, -0.9], [0.06, -0.92], [0.08, -0.76], [-0.14, -0.72]],                                                   // Greenland
  [[0.4, -0.46], [0.66, -0.56], [0.78, -0.34], [0.52, -0.24], [0.42, -0.3]],                                       // Europe
  [[0.34, -0.14], [0.68, -0.2], [0.88, 0.04], [0.74, 0.42], [0.54, 0.66], [0.46, 0.34], [0.3, 0.14]]               // Africa
];
const CLOUDS = [[-0.66, -0.12, 0.3], [0.12, -0.38, 0.26], [0.2, 0.62, 0.34], [-0.86, 0.3, 0.18]]; // [u, v, half width]
const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
function globeTexture(scene, r) {
  const key = 'win_globe_' + r;
  if (scene.textures.exists(key)) return key;
  const d = 2 * r + 5, c = r + 2, p = new Painter(d, d), land = (u, v) => LAND.some(L => inPoly(L, u, v));
  for (let y = -r - 2; y <= r + 2; y++) for (let x = -r - 2; x <= r + 2; x++) {
    const dist = Math.hypot(x, y); if (dist > r + 2.35) continue;
    if (dist > r + 0.35) { p.px(c + x, c + y, '#ffffff'); continue; } // the outline, round all the way
    const u = x / r, v = y / r, isLand = land(u, v);
    // light from the upper left: a bright cap, a shaded rim on the lower right
    const lit = Math.hypot(u + 0.42, v + 0.42), shade = dist > r - 2.2 && u + v > 0.25;
    let col = isLand ? '#3ee6a0' : '#4f7fff';
    if (isLand && !(land((x + 1) / r, v) && land((x - 1) / r, v) && land(u, (y + 1) / r) && land(u, (y - 1) / r))) col = '#21b77e';
    else if (!isLand && lit < 0.42) col = '#7fa4ff';
    if (shade) col = isLand ? '#1f9e6e' : '#3a5fd6';
    if (!isLand && lit < 0.18) col = '#b8ccff';
    p.px(c + x, c + y, col);
  }
  CLOUDS.forEach(([u, v, hw]) => { for (let x = Math.round((u - hw) * r); x <= Math.round((u + hw) * r); x++) { const y = Math.round(v * r + Math.sin(x * 0.7) * 0.6); if (Math.hypot(x, y) < r - 1.5) p.px(c + x, c + y, '#ffffff'); } });
  p.toTexture(scene, key);
  return key;
}

export class WinFx {
  constructor(scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(20);
    this.top = scene.add.graphics().setDepth(22);
    this.zap = new SatelliteStrike(scene, { depth: 21, sound: false });
    this.globe = scene.add.image(0, 0, '__WHITE').setOrigin(0).setDepth(20.5).setVisible(false);
    this.on = null;
  }
  start(skin, board, extra) {
    this.on = { skin, board, t: 0, extra: extra || {} };
    if (skin === 4) {
      const b = board, ex = b.x + b.w * 0.74, ey = b.y + b.h * 0.78;
      const r = Math.round(b.w * 0.13);
      this.on.earth = { x: Math.round(ex), y: Math.round(ey), r };
      this.on.zapAt = 1.0; this.on.zapped = false; this.on.hitAt = null;
      this.globe.setTexture(globeTexture(this.scene, r)).setPosition(Math.round(ex) - r - 2, Math.round(ey) - r - 2).setVisible(true);
      const P = LOOKS[state.look] || LOOKS.A; this.on.girl = { hair: flat(P.hair), body: flat(P.kid) };
    }
  }
  update(dt, K) {
    const g = this.g, top = this.top; g.clear(); top.clear();
    this.zap.update(dt);
    const o = this.on; if (!o) { this.globe.setVisible(false); return; }
    o.t += dt;
    const t = o.t, b = o.board, tx = (s, x, y, col, sc, a) => pixText(top, s, Math.round(x), Math.round(y), col, sc || 1, a == null ? 1 : a);
    if (t > WIN_SECONDS[o.skin] + 0.6) { this.on = null; this.globe.setVisible(false); return; }
    if (o.skin === 1) {
      // the back end: a green flash, a scan line over the board, and the log types out
      const f = Math.max(0, 1 - t / 0.5); g.fillStyle(H(K.accent), 0.22 * f); g.fillRect(b.x, b.y, b.w, b.h);
      const sy = b.y + ((t * 220) % b.h); g.fillStyle(H(K.text), 0.6); g.fillRect(b.x, sy, b.w, 1);
      const log = ['> ROUTE ACCEPTED', '> TASK QUEUED', '> TARGET WINDOW OK', '> DISCHARGE 0.4 S'];
      top.fillStyle(H(K.bg), 0.92); top.fillRect(b.x + 6, b.y + b.h - 44, 104, 38); top.fillStyle(H(K.dim), 1); top.fillRect(b.x + 6, b.y + b.h - 44, 104, 1);
      log.forEach((l, i) => { const at = 0.25 + i * 0.2; if (t > at) tx(l.slice(0, Math.floor((t - at) * 40)), b.x + 10, b.y + b.h - 40 + i * 8, H(i === 3 ? K.accent : K.text)); });
    } else if (o.skin === 2) {
      // the ground station: an uplink pulse, then the beam window opens
      const c = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      for (let i = 0; i < 3; i++) { const r = ((t * 70) + i * 22) % 70; g.lineStyle(1, H(K.accent), Math.max(0, 0.7 - r / 100)); g.strokeCircle(c.x, c.y, r); }
      const w = 120, h = 22, x = c.x - w / 2, y = b.y + 8;
      top.fillStyle(H(K.panel), 0.95); top.fillRect(x, y, w, h); top.fillStyle(H(K.accent), 1); top.fillRect(x, y, w, 1); top.fillRect(x, y + h - 1, w, 1);
      tx('UPLINK OK', x + 6, y + 4, H(K.text));
      if (t > 0.8) tx('BEAM WINDOW OPEN', x + 6, y + 12, Math.floor(t * 6) % 2 ? H(K.accent) : 0xff5a4a);
    } else if (o.skin === 3) {
      // the flat map: a delivery toast slides up, like any app
      const u = Math.min(1, t / 0.25), w = 92, h = 18, x = b.x + b.w / 2 - w / 2, y = b.y + b.h - 6 - h * u;
      top.fillStyle(0xffffff, 1); top.fillRect(x, y, w, h); top.fillRect(x - 1, y + 1, w + 2, h - 2);
      top.fillStyle(H(K.accent), 1); top.fillCircle(x + 9, y + 9, 5); top.fillStyle(0xffffff, 1); top.fillRect(x + 6, y + 9, 2, 1); top.fillRect(x + 8, y + 10, 1, 1); top.fillRect(x + 9, y + 8, 1, 2); top.fillRect(x + 10, y + 7, 1, 1); top.fillRect(x + 11, y + 6, 1, 1);
      tx('DELIVERED', x + 18, y + 4, H(K.text)); tx('ON TIME', x + 18, y + 11, H(K.dim));
    } else if (o.skin === 4) {
      // the game show: a cartoon Earth, a smiling satellite, a zap that bounces in, a ZAP!
      const e = o.earth, fx = e.x, fy = e.y - e.r - 2; // her feet, on top of the world
      // her, small, waving at the sky, until the zap reaches her; a target blinks on her first
      if (!o.hitAt) {
        const G = o.girl, wave = Math.floor(t * 5) % 2;
        top.fillStyle(H(G.hair), 1); top.fillRect(fx - 2, fy - 11, 5, 3); top.fillRect(fx - 3, fy - 10, 1, 4);
        top.fillStyle(0xf1c9a5, 1); top.fillRect(fx - 1, fy - 8, 3, 2);
        top.fillStyle(H(G.body), 1); top.fillRect(fx - 2, fy - 6, 5, 4); top.fillRect(wave ? fx + 3 : fx + 3, wave ? fy - 9 : fy - 7, 1, 3);
        top.fillStyle(0x1b0f3a, 1); top.fillRect(fx - 2, fy - 2, 2, 2); top.fillRect(fx + 1, fy - 2, 2, 2);
        if ((t * 4) % 1 < 0.72 && t < o.zapAt + 0.4) { // the target: on most of the time, so nobody misses it
          const x0 = fx - 6, y0 = fy - 15, x1 = fx + 6, y1 = fy + 2; top.fillStyle(0xff5fa2, 1);
          [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => { top.fillRect(Math.min(x, x + sx * 3), y, 4, 1); top.fillRect(x, Math.min(y, y + sy * 3), 1, 4); });
        }
      } else if (t < o.hitAt + 0.35) {
        // a cartoon poof where she stood
        const u = (t - o.hitAt) / 0.35, rr = 3 + u * 8; top.fillStyle(0xffffff, 1 - u);
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; top.fillRect(Math.round(fx + Math.cos(a) * rr) - 1, Math.round(fy - 6 + Math.sin(a) * rr) - 1, 3, 3); }
      }
      const sx = b.x + b.w * 0.2, sy = b.y + 8, bob = Math.sin(t * 8) * 1.5;
      if (!o.zapped && t > o.zapAt) {
        o.zapped = true;
        this.zap.fire({ view: { x: b.x, y: b.y, width: b.w, height: b.h }, tx: fx, ty: fy - 5, P: TOON, from: sx, onImpact: () => { o.hitAt = o.t; Sound.tone(1600, 0.2, 'sawtooth', 0.025, 400); Sound.noise(0.3, 0.06, 6000); } });
      }
      // the smiling satellite with big panels
      top.fillStyle(0x2b1a5c, 1); top.fillRect(sx - 15, sy - 4 + bob, 31, 9);
      top.fillStyle(0xffd23f, 1); top.fillRect(sx - 14, sy - 3 + bob, 9, 7); top.fillRect(sx + 6, sy - 3 + bob, 9, 7);
      top.fillStyle(0xffffff, 1); top.fillRect(sx - 4, sy - 4 + bob, 9, 9);
      top.fillStyle(0x1b0f3a, 1); top.fillRect(sx - 2, sy - 2 + bob, 1, 2); top.fillRect(sx + 2, sy - 2 + bob, 1, 2); top.fillRect(sx - 2, sy + 2 + bob, 5, 1); top.fillRect(sx - 3, sy + 1 + bob, 1, 1); top.fillRect(sx + 3, sy + 1 + bob, 1, 1);
      if (o.hitAt) {
        const u = t - o.hitAt, s = Math.min(1, u / 0.15), word = 'ZAP!', w = textWidth(word, 3);
        const wx = fx - w / 2 - 6, wy = fy - 34 - 4 * s, pa = Math.max(0, 1 - u / 1.4), px = fx - 8, py = fy - 18 - u * 6, pw = textWidth('+400');
        tx(word, wx + 2, wy + 2, 0x1b0f3a, 3); tx(word, wx, wy, Math.floor(t * 10) % 2 ? 0xffd23f : 0xff5fa2, 3);
        top.fillStyle(0x1b0f3a, 0.85 * pa); top.fillRect(Math.round(px) - 2, Math.round(py) - 2, pw + 4, 9);
        tx('+400', px, py, 0xffffff, 1, pa);
      }
    }
  }
}

// The batch 3 reveal on the flat map: the estate from above, and a pin on every spot where she
// died, labeled with the take. Drawn over the screen for a few seconds before the batch ends.
export function drawDeathMap(g, K, t, bodies, tx) {
  const x0 = 14, y0 = 14, w = 292, h = 152, u = Math.min(1, t / 0.6);
  g.fillStyle(H(K.bg), 0.96 * u); g.fillRect(0, 0, 320, 180);
  if (u < 1) return;
  g.fillStyle(0xdfe4ea, 1); g.fillRect(x0, y0, w, h);
  // the grounds from above: lawn, paths, the hedges, the fountain, the house
  g.fillStyle(0xcfe0c9, 1); g.fillRect(x0 + 4, y0 + 20, w - 8, h - 30);
  g.fillStyle(0xbfc6cf, 1); g.fillRect(x0 + 4, y0 + h * 0.6, w - 8, 8);
  g.fillStyle(0x9fb39a, 1); [[0.2, 0.42], [0.25, 0.42], [0.29, 0.42]].forEach(([fx, fy]) => g.fillRect(x0 + w * fx, y0 + h * fy, 10, 10));
  g.fillStyle(0xaed3ef, 1); g.fillCircle(x0 + w * 0.43, y0 + h * 0.5, 9);
  g.fillStyle(0x8a93a3, 1); g.fillRect(x0 + w * 0.15, y0 + 20, w * 0.8, 18); g.fillRect(x0 + w * 0.86, y0 + 20, 22, h * 0.5);
  tx('THE ESTATE', x0 + 6, y0 + 6, H(K.text)); tx('PINS: ' + bodies.length, x0 + w - 50, y0 + 6, H(K.accent));
  // a pin for every body, dropped one by one, labeled with its take
  bodies.forEach((bd, i) => {
    const at = 0.8 + i * 0.12; if (t < at) return;
    const s = Math.min(1, (t - at) / 0.15), px = x0 + 6 + (bd.x / bd.span) * (w - 12), py = y0 + h * 0.55 + ((i * 37) % 30) - 15 - (1 - s) * 10;
    g.fillStyle(0xd94a4a, 1); g.fillCircle(px, py - 6, 3); g.fillTriangle(px - 3, py - 5, px + 3, py - 5, px, py); g.fillStyle(0xffffff, 1); g.fillRect(px - 1, py - 7, 2, 2);
    // the label sits right of its pin, or left of it near the map's right edge, so it never runs off the map
    const label = 'TAKE ' + bd.take, lw = textWidth(label), lx = px + 4 + lw > x0 + w - 6 ? px - 4 - lw : px + 4;
    if (s >= 1 && (i < 6 || i === bodies.length - 1)) tx(label, lx, py - 9, H(K.text));
  });
  if (!bodies.length) tx('NO PINS YET', x0 + w / 2 - 22, y0 + h / 2, H(K.dim));
}
