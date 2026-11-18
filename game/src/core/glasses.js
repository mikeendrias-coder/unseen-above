// The glasses: L puts them on and takes them off. On, they show what the cameras see, but not
// cleanly: the picture blinks out, static crawls over everything, and they run hot. The longer
// they stay on, the worse it gets, until they cut out and need a few seconds to cool. Cracked
// (after the fall in episode 3) they fail sooner and blink more. So they are worth wearing in
// short looks, not all the time.
import { Sound } from './sound.js';
import { pixText } from '../art/pixfont.js';
import { hexNum } from '../art/painter.js';
import { overlay } from './overlay.js';
import { fx } from './fx.js';

export class Glasses {
  constructor(opts) {
    opts = opts || {};
    this.has = !!opts.has; this.on = !!opts.on; this.cracked = !!opts.cracked;
    this.heat = 0; this.out = 0; this.over = 0; this.t = 0; this.flash = 0;
  }
  toggle() {
    if (!this.has) return false;
    if (this.over > 0) { Sound.tone(160, 0.08, 'square', 0.02); this.flash = 0.4; return false; }
    this.on = !this.on; this.flash = 0.25;
    if (this.on) { Sound.tone(660, 0.06, 'sine', 0.025); setTimeout(() => Sound.tone(990, 0.08, 'sine', 0.02), 60); Sound.noise(0.12, 0.03, 7000); }
    else Sound.tone(420, 0.08, 'sine', 0.02, 260);
    return true;
  }
  update(dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const full = this.cracked ? 7 : 10;
    const was = this.heat;
    if (this.on) this.heat = Math.min(1, this.heat + dt / full); else this.heat = Math.max(0, this.heat - dt / 3.5);
    // a beep at each step toward cutting out, higher each time
    if (this.on) [0.75, 0.85, 0.93].forEach((h, i) => { if (was < h && this.heat >= h) Sound.tone(700 + i * 220, 0.06, 'square', 0.016); });
    if (this.over > 0) this.over = Math.max(0, this.over - dt);
    if (this.on && this.heat >= 1) { this.on = false; this.over = 3; this.flash = 0.6; Sound.noise(0.4, 0.08, 6000); Sound.tone(220, 0.3, 'sawtooth', 0.02, 90); }
    // the picture blinks out now and then, more as they heat up, more when cracked
    if (this.out > 0) this.out = Math.max(0, this.out - dt);
    else if (this.on && Math.random() < dt * (0.35 + this.heat * 2.6 + (this.cracked ? 0.9 : 0))) {
      this.out = 0.05 + Math.random() * (0.08 + this.heat * 0.3 + (this.cracked ? 0.12 : 0));
      if (Math.random() < 0.5) Sound.noise(0.05, 0.012, 8000);
    }
  }
  // can she see through them this frame
  get showing() { return this.on && this.out <= 0; }
  get level() { return this.on ? 0.06 + this.heat * 0.5 + (this.out > 0 ? 0.35 : 0) + (this.cracked ? 0.08 : 0) : 0; }

  // static over the whole view while they are on, in screen space: single solid pixels, torn
  // rows laid every other pixel, and when the picture blinks out, every third row goes dark.
  // Flat palette colors only, nothing faded (Nov 17 final pass).
  drawStatic(g, col) {
    const lv = this.level; if (lv <= 0) return;
    const n = Math.round(20 + lv * 220);
    for (let i = 0; i < n; i++) { g.fillStyle(Math.random() < 0.5 ? 0xebe6d8 : col, 1); g.fillRect(Math.floor(Math.random() * 320), Math.floor(Math.random() * 180), 1, 1); }
    const tears = Math.floor(lv * 4 + Math.random() * 1.5);
    g.fillStyle(col, 1);
    for (let i = 0; i < tears; i++) { const y = Math.floor(Math.random() * 180), x0 = Math.floor(Math.random() * 2); for (let x = x0; x < 320; x += 2) g.fillRect(x, y, 1, 1); }
    if (this.out > 0) { g.fillStyle(0x0e0f12, 1); for (let y = 0; y < 180; y += fx.reduced ? 6 : 3) g.fillRect(0, y, 320, 1); }
    // running hot: a red edge blinks around the view before they cut out
    if (this.on && this.heat > 0.72 && Math.floor(this.t * (fx.reduced ? 2 : 5)) % 2 === 0) { g.fillStyle(0xe3412b, 1); g.fillRect(0, 0, 320, 2); g.fillRect(0, 178, 320, 2); g.fillRect(0, 2, 2, 176); g.fillRect(318, 2, 2, 176); }
  }
  // a small readout in the corner: the key, on or off, and how hot they are
  drawMeter(g, x, y, col) {
    if (!this.has || !overlay.free(x - 3, y - 3, 56, 12)) return; // a caption over it: it steps aside
    const hot = hexNum('#e3412b'), label = this.over > 0 ? 'HOT' : this.on ? 'ON' : 'OFF';
    g.fillStyle(0x0e0f12, 1); g.fillRect(x - 2, y - 2, 52, 9);
    pixText(g, 'L', x, y, 0xebe6d8, 1, 1);
    if (!(this.over > 0 && Math.floor(this.t * 6) % 2)) pixText(g, label, x + 6, y, this.over > 0 ? hot : this.on ? col : 0x8f8d87, 1, 1);
    const bx = x + 22, w = 24;
    g.fillStyle(0x45474d, 1); g.fillRect(bx, y + 1, w, 3);
    g.fillStyle(this.heat > 0.7 ? hot : col, 1); g.fillRect(bx, y + 1, Math.round(w * this.heat), 3);
    if (this.flash > 0) { g.fillStyle(0xebe6d8, 1); g.fillRect(x - 3, y - 3, 54, 1); g.fillRect(x - 3, y + 7, 54, 1); g.fillRect(x - 3, y - 3, 1, 11); g.fillRect(x + 50, y - 3, 1, 11); }
  }
}
