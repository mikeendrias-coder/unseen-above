// Speech bubbles and "press E" prompts drawn in the world with the 3x5 pixel font. Text types
// out letter by letter with a soft blip; each speaker has at most one bubble at a time.
import { pixText, textWidth } from '../art/pixfont.js';
import { Sound } from './sound.js';

const wrap = (text, max) => {
  const words = text.toUpperCase().split(' '), lines = []; let line = '';
  words.forEach(w => { if ((line + ' ' + w).trim().length > max) { if (line) lines.push(line); line = w; } else line = (line + ' ' + w).trim(); });
  if (line) lines.push(line);
  return lines;
};

export class Bubbles {
  constructor(scene, depth) {
    this.scene = scene; this.g = scene.add.graphics().setDepth(depth || 9); this.list = new Map(); this.prompt = null;
  }
  // key: who speaks; at: () => ({ x, y }) for the point the tail touches (follows a moving speaker)
  say(key, text, at, opts) {
    opts = opts || {};
    const lines = wrap(text, opts.width || 26);
    this.list.set(key, { lines, at, t: 0, n: 0, ms: opts.ms || 1400 + text.length * 55, ink: opts.ink || 0xffffff, edge: opts.edge || 0x7fe9ff, pitch: opts.pitch || 880, total: lines.join('').length });
  }
  clear(key) { this.list.delete(key); }
  busy(key) { return this.list.has(key); }
  // a small key cap that bobs over something she can use
  showPrompt(x, y, label) { this.prompt = { x, y, label: label || 'E' }; }

  update(dt, clock) {
    const g = this.g; g.clear();
    this.list.forEach((b, key) => {
      b.t += dt;
      const shown = Math.min(b.total, Math.floor(b.t * 38));
      if (shown > b.n) { if (shown % 3 === 0) Sound.tone(b.pitch + (shown % 7) * 30, 0.03, 'square', 0.008); b.n = shown; }
      if (b.t * 1000 > b.ms + b.total * 26) { this.list.delete(key); return; }
      const p = b.at(), w = Math.max(...b.lines.map(l => textWidth(l))) + 8, h = b.lines.length * 7 + 5;
      const x = Math.round(p.x - w / 2), y = Math.round(p.y - 6 - h);
      const px = Math.round(p.x), dark = 0x0b0a12;
      g.fillStyle(dark, 0.94); g.fillRect(x, y, w, h);
      g.fillStyle(b.edge, 1); g.fillRect(x, y - 1, w, 1); g.fillRect(x, y + h, w, 1); g.fillRect(x - 1, y, 1, h); g.fillRect(x + w, y, 1, h);
      // the tail points down at the speaker
      g.fillStyle(dark, 0.94); g.fillRect(px - 2, y + h, 4, 2); g.fillRect(px - 1, y + h + 2, 2, 2);
      g.fillStyle(b.edge, 1); g.fillRect(px - 3, y + h, 1, 2); g.fillRect(px + 2, y + h, 1, 2); g.fillRect(px - 2, y + h + 2, 1, 2); g.fillRect(px + 1, y + h + 2, 1, 2); g.fillRect(px - 1, y + h + 4, 2, 1);
      let left = shown;
      b.lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length; if (part) pixText(g, part, x + 4, y + 3 + i * 7, b.ink, 1, 1); });
    });
    if (this.prompt) {
      const p = this.prompt, bob = Math.round(Math.sin((clock || 0) * 5) * 1.5), x = Math.round(p.x - 4), y = Math.round(p.y - 10 + bob);
      g.fillStyle(0x0b0a12, 0.9); g.fillRect(x, y, 9, 9); g.fillStyle(0xffffff, 1); g.fillRect(x, y, 9, 1); g.fillRect(x, y + 8, 9, 1); g.fillRect(x, y, 1, 9); g.fillRect(x + 8, y, 1, 9);
      pixText(g, p.label, x + 3, y + 2, 0xffffff, 1, 1);
      this.prompt = null;
    }
  }
}
