// Speech bubbles and "press E" prompts drawn in the world with the 3x5 pixel font. Text types
// out letter by letter with a soft blip; each speaker has at most one bubble at a time.
// A bubble does not hang around: it closes a moment after it finishes, as soon as she walks
// away from whoever is talking, or when she presses E again after the last line.
import { pixText, textWidth } from '../art/pixfont.js';
import { Sound } from './sound.js';

const wrap = (text, max) => {
  const words = text.toUpperCase().split(' '), lines = []; let line = '';
  words.forEach(w => { if ((line + ' ' + w).trim().length > max) { if (line) lines.push(line); line = w; } else line = (line + ' ' + w).trim(); });
  if (line) lines.push(line);
  return lines;
};
const CPS = 40; // letters per second

export class Bubbles {
  constructor(scene, depth) {
    this.scene = scene; this.g = scene.add.graphics().setDepth(depth || 9); this.list = new Map(); this.prompt = null;
    this.player = null; // () => ({ x, y }) of the girl, set by the scene, for walking away
  }
  // key: who speaks; at: () => ({ x, y }) for the point the tail touches (follows a moving speaker)
  // opts: ink, edge, pitch, width, hold (ms after the text is out), leave (px from the speaker
  // before the bubble closes; 0 = never), src (the talker whose lines E steps through)
  say(key, text, at, opts) {
    opts = opts || {};
    const old = this.list.get(key); if (old && old.src && old.src !== opts.src) this.gone(old);
    const lines = wrap(text, opts.width || 26), total = lines.join('').length;
    this.list.set(key, { lines, at, t: 0, n: 0, total, out: 0, hold: opts.hold != null ? opts.hold : opts.ms != null ? opts.ms : Math.min(3200, 1100 + total * 30),
      ink: opts.ink || 0xffffff, edge: opts.edge || 0x7fe9ff, pitch: opts.pitch || 880, leave: opts.leave != null ? opts.leave : 72, src: opts.src || null });
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
  // a small key cap that bobs over something she can use
  showPrompt(x, y, label) { this.prompt = { x, y, label: label || 'E' }; }

  update(dt, clock) {
    const g = this.g; g.clear();
    const me = this.player ? this.player() : null;
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
      const w = Math.max(...b.lines.map(l => textWidth(l))) + 8, h = b.lines.length * 7 + 5;
      // keep the whole bubble on screen; the tail still points at the speaker
      const v = this.scene.cameras && this.scene.cameras.main ? this.scene.cameras.main.worldView : null;
      let x = Math.round(p.x - w / 2); const y = Math.round(p.y - 6 - h);
      if (v && v.width > 0) x = Math.max(Math.round(v.x) + 2, Math.min(Math.round(v.x + v.width) - w - 3, x));
      const px = Math.max(x + 3, Math.min(x + w - 3, Math.round(p.x))), dark = 0x0b0a12;
      g.fillStyle(dark, 0.94 * a); g.fillRect(x, y, w, h);
      g.fillStyle(b.edge, a); g.fillRect(x, y - 1, w, 1); g.fillRect(x, y + h, w, 1); g.fillRect(x - 1, y, 1, h); g.fillRect(x + w, y, 1, h);
      // the tail points down at the speaker
      g.fillStyle(dark, 0.94 * a); g.fillRect(px - 2, y + h, 4, 2); g.fillRect(px - 1, y + h + 2, 2, 2);
      g.fillStyle(b.edge, a); g.fillRect(px - 3, y + h, 1, 2); g.fillRect(px + 2, y + h, 1, 2); g.fillRect(px - 2, y + h + 2, 1, 2); g.fillRect(px + 1, y + h + 2, 1, 2); g.fillRect(px - 1, y + h + 4, 2, 1);
      let left = shown;
      b.lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length; if (part) pixText(g, part, x + 4, y + 3 + i * 7, b.ink, 1, a); });
      // more to say: a small arrow in the corner once the line is out
      if (b.src && shown >= b.total && !b.out) {
        const lines = typeof b.src.lines === 'function' ? b.src.lines() : b.src.lines;
        if (b.src.i < lines.length && Math.floor((clock || 0) * 3) % 2 === 0) { g.fillStyle(b.edge, 1); g.fillRect(x + w - 5, y + h - 4, 3, 1); g.fillRect(x + w - 4, y + h - 3, 1, 1); }
      }
    });
    if (this.prompt) {
      const p = this.prompt, bob = Math.round(Math.sin((clock || 0) * 5) * 1.5), x = Math.round(p.x - 4), y = Math.round(p.y - 10 + bob);
      g.fillStyle(0x0b0a12, 0.9); g.fillRect(x, y, 9, 9); g.fillStyle(0xffffff, 1); g.fillRect(x, y, 9, 1); g.fillRect(x, y + 8, 9, 1); g.fillRect(x, y, 1, 9); g.fillRect(x + 8, y, 1, 9);
      pixText(g, p.label, x + 3, y + 2, 0xffffff, 1, 1);
      this.prompt = null;
    }
  }
}
