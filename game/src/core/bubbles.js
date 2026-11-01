// Speech in the world, drawn as captions placed by whoever is talking: each line on its own
// black box, white (or the speaker's color) caption face, a small notch pointing at them. The
// same look as the TV captions at the bottom of the screen, only placed over a head, the way
// captioners place lines near the speaker. Text paints on letter by letter with a soft blip;
// each speaker has at most one line up at a time.
// A line does not hang around: it closes a moment after it finishes, as soon as she walks away
// from whoever is talking, or when she presses E again after the last line.
import { ccText, ccWidth, ccWrap, ccBox, CAPTION } from '../art/ccfont.js';
import { Sound } from './sound.js';

const CPS = 40; // letters per second
const BOX = 0x000000, A = CAPTION.alpha, R = CAPTION.row, PAD = 4;

export class Bubbles {
  constructor(scene, depth) {
    this.scene = scene; this.g = scene.add.graphics().setDepth(depth || 9); this.list = new Map(); this.prompt = null;
    this.player = null; // () => ({ x, y }) of the girl, set by the scene, for walking away
  }
  // key: who speaks; at: () => ({ x, y }) for the point the notch touches (follows a moving speaker)
  // opts: ink, pitch, width (letters a line), hold (ms after the text is out), leave (px from the
  // speaker before it closes; 0 = never), src (the talker whose lines E steps through), italic
  say(key, text, at, opts) {
    opts = opts || {};
    const old = this.list.get(key); if (old && old.src && old.src !== opts.src) this.gone(old);
    const lines = ccWrap(text, opts.width || 24), total = lines.join('').length;
    this.list.set(key, { lines, at, t: 0, n: 0, total, out: 0, hold: opts.hold != null ? opts.hold : opts.ms != null ? opts.ms : Math.min(3200, 1100 + total * 30),
      ink: opts.ink || 0xffffff, pitch: opts.pitch || 880, leave: opts.leave != null ? opts.leave : 72, src: opts.src || null, italic: !!opts.italic });
  }
  // E on something that talks. The first press shows its next line. Pressing again while the
  // line types finishes it; once it is out, the next line; after the last line, it closes.
  // src: { lines: [..] or () => [..], i: next line, loop: keep the place between visits, from: where a loop restarts }
  press(key, src, at, opts) {
    const lines = typeof src.lines === 'function' ? src.lines() : src.lines, b = this.list.get(key);
    if (src.i == null) src.i = 0;
    if (b && b.src === src && !b.out) {
      if (b.n < b.total) { b.t = b.total / CPS + 0.01; b.n = b.total; return 'finished'; }
      if (src.i >= lines.length) { this.close(key); return 'closed'; }
    } else if (src.i >= lines.length) src.i = src.loop ? (src.from || 0) : 0;
    this.say(key, lines[src.i], at, Object.assign({}, opts, { src }));
    src.i++;
    return 'line';
  }
  close(key) { const b = this.list.get(key); if (b && !b.out) b.out = 0.14; }
  clear(key) { const b = this.list.get(key); if (b) { this.gone(b); this.list.delete(key); } }
  busy(key) { const b = this.list.get(key); return !!b && !b.out; }
  // a talker that is not a loop starts over next time; a loop keeps its place, wrapping at the end
  gone(b) {
    if (!b.src) return;
    const n = (typeof b.src.lines === 'function' ? b.src.lines() : b.src.lines).length;
    if (!b.src.loop) b.src.i = 0; else if (b.src.i >= n) b.src.i = b.src.from || 0;
  }
  // a key over something she can use: a black cap with the letter, bobbing
  showPrompt(x, y, label, ink) { this.prompt = { x, y, label: label || 'E', ink }; }

  update(dt, clock) {
    const g = this.g; g.clear();
    const me = this.player ? this.player() : null;
    const v = this.scene.cameras && this.scene.cameras.main ? this.scene.cameras.main.worldView : null;
    this.list.forEach((b, key) => {
      b.t += dt;
      const p = b.at();
      // walked away: close quickly
      if (!b.out && b.leave && me && Math.abs(me.x - p.x) > b.leave) b.out = 0.14;
      if (b.out) { b.out -= dt; if (b.out <= 0) { this.gone(b); this.list.delete(key); return; } }
      const shown = Math.min(b.total, Math.floor(b.t * CPS));
      if (shown > b.n) { if (shown % 3 === 0) Sound.tone(b.pitch + (shown % 7) * 30, 0.03, 'square', 0.008); b.n = shown; }
      if (!b.out && b.t * 1000 > b.total / CPS * 1000 + b.hold) b.out = 0.2;
      const a = b.out ? Math.max(0, b.out / 0.2) : 1;
      // The block paints on like a caption: a line's box grows with its letters, and each new
      // line rolls in at the bottom, pushing the earlier ones up. Centered over the speaker on
      // the full width it will have, and kept on screen.
      const padR = b.src ? PAD + 5 : PAD, full = b.lines.map(l => ccWidth(l) + PAD + padR), wMax = Math.max(...full);
      let cx = Math.round(p.x);
      if (v && v.width > 0) cx = Math.max(Math.round(v.x) + 2 + Math.ceil(wMax / 2), Math.min(Math.round(v.x + v.width) - 2 - Math.ceil(wMax / 2), cx));
      let left = shown; const vis = [];
      b.lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length; if (part) vis.push({ part, x: Math.round(cx - full[i] / 2), w: Math.min(full[i], ccWidth(part) + PAD + padR) }); });
      if (!vis.length) vis.push({ part: '', x: Math.round(cx - PAD), w: PAD * 2 });
      const bottom = Math.round(p.y - 4), top = bottom - vis.length * R;
      vis.forEach((s, i) => {
        const y = top + i * R;
        g.fillStyle(BOX, A * a); g.fillRect(s.x, y, s.w, R);
        if (s.part) ccText(g, s.part, s.x + PAD, y + CAPTION.top, b.ink, { alpha: a, italic: b.italic });
      });
      // the notch: points down at the speaker, under the last line
      const last = vis[vis.length - 1], lw = last.w, lx = last.x, nx = Math.max(lx + 3, Math.min(lx + lw - 4, Math.round(p.x)));
      g.fillStyle(BOX, A * a); g.fillRect(nx - 2, bottom, 5, 1); g.fillRect(nx - 1, bottom + 1, 3, 1); g.fillRect(nx, bottom + 2, 1, 1);
      // more to say: a small arrow at the end of the last line once it is out
      if (b.src && shown >= b.total && !b.out) {
        const lines = typeof b.src.lines === 'function' ? b.src.lines() : b.src.lines;
        if (b.src.i < lines.length && Math.floor((clock || 0) * 3) % 2 === 0) { const ax = lx + lw - 6, ay = bottom - 5; g.fillStyle(b.ink, 1); g.fillRect(ax - 1, ay, 3, 1); g.fillRect(ax, ay + 1, 1, 1); }
      }
    });
    if (this.prompt) {
      const p = this.prompt, bob = Math.round(Math.sin((clock || 0) * 5) * 1.5), x = Math.round(p.x - 5), y = Math.round(p.y - 14 + bob);
      g.fillStyle(BOX, A); g.fillRect(x, y, 11, 11); g.fillRect(x + 4, y + 11, 3, 1); g.fillRect(x + 5, y + 12, 1, 1);
      ccText(g, p.label, x + 3, y + 2, p.ink || (p.label === '!' ? 0xffe94a : 0xffffff));
      this.prompt = null;
    }
  }
}
