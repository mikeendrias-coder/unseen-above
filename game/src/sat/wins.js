// What a solved board looks and sounds like, one way per screen. The laser shows a little more
// on each: the back end only logs a discharge window, the ground station opens a beam window,
// the flat map marks a delivery, and the game show draws a cartoon zap from a smiling satellite.
// Every win also plays Sound.charge(), the laser's charging sound (a clue on purpose).
import { pixText, textWidth } from '../art/pixfont.js';
import { Sound } from '../core/sound.js';
import { SatelliteStrike } from '../art/strike.js';

const H = h => parseInt(h.slice(1), 16);
export const WIN_SECONDS = { 1: 2.1, 2: 2.1, 3: 1.9, 4: 2.6 };

// the cartoon colors the strike borrows on the game show screen
const TOON = { hazard: '#ff5fa2', hazardCore: '#ffffff', device: '#2b1a5c', glassLit: '#ffd23f', glass: '#5b8cff', colHi: '#ffffff', void: '#1b0f3a', lamp: '#ffd23f' };

export function winSound(scene, skin) {
  const later = (s, fn) => scene.time.delayedCall(s * 1000, fn);
  if (skin === 1) [0.25, 0.45, 0.65, 0.85].forEach((d, i) => later(d, () => Sound.tone(i === 3 ? 1760 : 1200, 0.05, 'square', 0.02)));
  if (skin === 2) { later(0.2, () => { Sound.noise(0.6, 0.05, 2600); Sound.tone(240, 0.7, 'sine', 0.025, 1500); }); later(0.95, () => Sound.tone(1100, 0.12, 'square', 0.015)); }
  if (skin === 3) later(0.3, () => { Sound.tone(1318, 0.16, 'sine', 0.03); later(0.12, () => Sound.tone(1760, 0.32, 'sine', 0.03)); });
  if (skin === 4) [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => later(i * 0.085, () => Sound.tone(f, 0.2, i % 2 ? 'triangle' : 'square', 0.024, null, 0.3)));
}

export class WinFx {
  constructor(scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(20);
    this.top = scene.add.graphics().setDepth(22);
    this.zap = new SatelliteStrike(scene, { depth: 21, sound: false });
    this.on = null;
  }
  start(skin, board, extra) {
    this.on = { skin, board, t: 0, extra: extra || {} };
    if (skin === 4) {
      const b = board, ex = b.x + b.w * 0.74, ey = b.y + b.h * 0.78;
      this.on.earth = { x: ex, y: ey, r: Math.round(b.w * 0.13) };
      this.on.zapAt = 0.35; this.on.zapped = false;
    }
  }
  update(dt, K) {
    const g = this.g, top = this.top; g.clear(); top.clear();
    this.zap.update(dt);
    const o = this.on; if (!o) return;
    o.t += dt;
    const t = o.t, b = o.board, tx = (s, x, y, col, sc, a) => pixText(top, s, Math.round(x), Math.round(y), col, sc || 1, a == null ? 1 : a);
    if (t > WIN_SECONDS[o.skin] + 0.6) { this.on = null; return; }
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
      const e = o.earth;
      g.fillStyle(0x5b8cff, 1); g.fillCircle(e.x, e.y, e.r); g.fillStyle(0x3ee6c1, 1); g.fillCircle(e.x - e.r * 0.35, e.y - e.r * 0.2, e.r * 0.4); g.fillCircle(e.x + e.r * 0.4, e.y + e.r * 0.3, e.r * 0.3);
      g.lineStyle(2, 0xffffff, 1); g.strokeCircle(e.x, e.y, e.r);
      const fx = e.x, fy = e.y - e.r - 3;
      if (!o.zapped || t < o.zapAt + 0.6) { g.fillStyle(0xffffff, 1); g.fillRect(fx - 1, fy - 5, 3, 5); g.fillRect(fx - 1, fy - 7, 3, 2); }
      const sx = b.x + b.w * 0.2, sy = b.y + 8, bob = Math.sin(t * 8) * 1.5;
      if (!o.zapped && t > o.zapAt) {
        o.zapped = true;
        this.zap.fire({ view: { x: b.x, y: b.y, width: b.w, height: b.h }, tx: fx, ty: fy - 3, P: TOON, from: sx, onImpact: () => { Sound.tone(1600, 0.2, 'sawtooth', 0.025, 400); Sound.noise(0.3, 0.06, 6000); } });
      }
      // the smiling satellite with big panels
      top.fillStyle(0x2b1a5c, 1); top.fillRect(sx - 15, sy - 4 + bob, 31, 9);
      top.fillStyle(0xffd23f, 1); top.fillRect(sx - 14, sy - 3 + bob, 9, 7); top.fillRect(sx + 6, sy - 3 + bob, 9, 7);
      top.fillStyle(0xffffff, 1); top.fillRect(sx - 4, sy - 4 + bob, 9, 9);
      top.fillStyle(0x1b0f3a, 1); top.fillRect(sx - 2, sy - 2 + bob, 1, 2); top.fillRect(sx + 2, sy - 2 + bob, 1, 2); top.fillRect(sx - 2, sy + 2 + bob, 5, 1); top.fillRect(sx - 3, sy + 1 + bob, 1, 1); top.fillRect(sx + 3, sy + 1 + bob, 1, 1);
      if (t > o.zapAt + 0.4) {
        const s = Math.min(1, (t - o.zapAt - 0.4) / 0.15), word = 'ZAP!', w = textWidth(word, 3);
        tx(word, fx - w / 2 - 6, fy - 30 - 4 * s, Math.floor(t * 10) % 2 ? 0xffd23f : 0xff5fa2, 3);
        tx('+400', fx - 6, fy - 12 - t * 4, 0xffffff, 1, Math.max(0, 1 - (t - o.zapAt - 0.4) / 1.4));
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
    if (s >= 1 && (i < 6 || i === bodies.length - 1)) tx('TAKE ' + bd.take, px + 4, py - 9, H(K.text));
  });
  if (!bodies.length) tx('NO PINS YET', x0 + w / 2 - 22, y0 + h / 2, H(K.dim));
}
