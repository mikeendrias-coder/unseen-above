// Words in the world. Two kinds, both in the caption face:
//   speech     someone talking (a robot, a person, her): a caption placed over the speaker,
//              each line on its own black box, a notch pointing down at them
//   narration  what she notices when she looks at something with E: an italic caption at the
//              foot of the screen, the way captions carry narration, never over the picture
// Text paints on letter by letter with a soft blip; each key has at most one line up at a time.
// A line does not hang around: it closes a moment after it finishes, as soon as she walks away,
// or when she presses E again after the last line.
// Speech is laid out every frame so it never covers her, another character, or other speech:
// a bubble that would rises above what is in the way, on a thin stem down to its speaker.
import { ccText, ccWidth, ccWrap, CAPTION } from '../art/ccfont.js';
import { overlay } from './overlay.js';
import { Sound } from './sound.js';

const CPS = 40; // letters per second
const BOX = 0x000000, A = CAPTION.alpha, R = CAPTION.row, PAD = 4;
const lineList = src => typeof src.lines === 'function' ? src.lines() : src.lines;
const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

export class Bubbles {
  constructor(scene, depth) {
    this.scene = scene; this.g = scene.add.graphics().setDepth(depth || 9); this.list = new Map(); this.prompt = null;
    this.player = null; // () => ({ x, y }) of the girl (x center, y top), for walking away
    this.bodies = null; // () => [{ x0, y0, x1, y1 }] characters speech must keep clear of; her by default
    this.order = 0;
    const off = () => overlay.describe(null);
    scene.events.once('shutdown', off); scene.events.on('sleep', off);
  }
  // key: who speaks; at: () => ({ x, y }) for the point the notch touches (follows a moving speaker)
  // opts: ink, pitch, width (letters a line), hold (ms after the text is out), leave (px from the
  // speaker before it closes; 0 = never), src (the talker whose lines E steps through), italic,
  // narrate (show it as narration at the foot of the screen)
  say(key, text, at, opts) {
    opts = opts || {};
    const old = this.list.get(key); if (old && old.src && old.src !== opts.src) this.gone(old);
    const narrate = !!opts.narrate;
    // narration has one place on screen: a new look replaces the last
    if (narrate) this.list.forEach((b, k) => { if (k !== key && b.narrate && !b.out) b.out = 0.01; });
    const lines = ccWrap(text, opts.width || (narrate ? 46 : 24)), total = lines.join('').length;
    this.list.set(key, { lines, at, t: 0, n: 0, total, out: 0, hold: opts.hold != null ? opts.hold : opts.ms != null ? opts.ms : Math.min(3600, 1300 + total * 32),
      ink: opts.ink || 0xebe6d8, pitch: opts.pitch || 880, leave: opts.leave != null ? opts.leave : 72, src: opts.src || null, italic: !!opts.italic || narrate, narrate, order: ++this.order, cut: overlay.cuts });
  }
  // E on something that talks. The first press shows its next line. Pressing again while the
  // line types finishes it; once it is out, the next line; after the last line, it closes.
  // src: { lines: [..] or () => [..], i: next line, loop: keep the place between visits, from: where a loop restarts }
  press(key, src, at, opts) {
    const lines = lineList(src), b = this.list.get(key);
    if (src.i == null) src.i = 0;
    if (b && b.src === src && !b.out) {
      if (b.n < b.total) { b.t = b.total / CPS + 0.01; b.n = b.total; return 'finished'; }
      if (src.i >= lines.length) { this.close(key); return 'closed'; }
    } else if (src.i >= lines.length) src.i = src.loop ? (src.from || 0) : 0;
    this.say(key, lines[src.i], at, Object.assign({}, opts, { src }));
    src.i++;
    return 'line';
  }
  // E on a thing: narration, stepped through the same way
  look(key, src, at, opts) { return this.press(key, src, at, Object.assign({ pitch: 520, leave: 80 }, opts, { narrate: true })); }
  close(key) { const b = this.list.get(key); if (b && !b.out) b.out = 0.14; }
  clear(key) { const b = this.list.get(key); if (b) { this.gone(b); this.list.delete(key); } }
  busy(key) { const b = this.list.get(key); return !!b && !b.out; }
  // is someone talking over this spot (so a key prompt there would sit under the words)
  near(x, r) { for (const b of this.list.values()) if (!b.out && !b.narrate && Math.abs(b.at().x - x) < r) return true; return false; }
  // a talker that is not a loop starts over next time; a loop keeps its place, wrapping at the end
  gone(b) {
    if (!b.src) return;
    const n = lineList(b.src).length;
    if (!b.src.loop) b.src.i = 0; else if (b.src.i >= n) b.src.i = b.src.from || 0;
  }
  // a key over something she can use: a black cap with the letter, bobbing
  showPrompt(x, y, label, ink) { this.prompt = { x, y, label: label || 'E', ink }; }

  update(dt, clock) {
    const g = this.g; g.clear();
    const me = this.player ? this.player() : null;
    const v = this.scene.cameras && this.scene.cameras.main ? this.scene.cameras.main.worldView : null;
    let note = null;
    const speech = [];
    this.list.forEach((b, key) => {
      b.t += dt;
      const p = b.at();
      // walked away: close quickly. A sound worth a caption cuts narration short.
      if (!b.out && b.leave && me && Math.abs(me.x - p.x) > b.leave) b.out = 0.14;
      if (!b.out && b.narrate && b.cut !== overlay.cuts) b.out = 0.01;
      if (b.out) { b.out -= dt; if (b.out <= 0) { this.gone(b); this.list.delete(key); return; } }
      const shown = Math.min(b.total, Math.floor(b.t * CPS));
      if (shown > b.n) { if (shown % 3 === 0) Sound.tone(b.pitch + (shown % 7) * 30, 0.03, 'square', 0.008); b.n = shown; }
      if (!b.out && b.t * 1000 > b.total / CPS * 1000 + b.hold) b.out = 0.2;
      const a = b.out ? Math.max(0, b.out / 0.2) : 1;
      const more = !!(b.src && shown >= b.total && !b.out && b.src.i < lineList(b.src).length);
      if (b.narrate) { if (!note || b.order > note.order) note = { order: b.order, lines: b.lines, shown, alpha: a, more, ink: b.ink }; }
      else speech.push({ b, p, shown, a, more });
    });
    overlay.describe(note);

    // speech: the newest first gets its place; the rest keep clear of it, of her and of others
    const placed = [], bodies = this.bodies ? this.bodies() : me ? [{ x0: me.x - 4, x1: me.x + 4, y0: me.y, y1: me.y + 14 }] : [];
    speech.sort((s, t) => (t.b.src ? 1 : 0) - (s.b.src ? 1 : 0) || t.b.order - s.b.order);
    speech.forEach(({ b, p, shown, a, more }) => {
      // The block paints on like a caption: a line's box grows with its letters, and each new
      // line rolls in at the bottom, pushing the earlier ones up.
      const padR = b.src ? PAD + 5 : PAD, full = b.lines.map(l => ccWidth(l) + PAD + padR), wMax = Math.max(...full);
      let cx = Math.round(p.x);
      if (v && v.width > 0) cx = Math.max(Math.round(v.x) + 2 + Math.ceil(wMax / 2), Math.min(Math.round(v.x + v.width) - 2 - Math.ceil(wMax / 2), cx));
      let left = shown; const vis = [];
      b.lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length; if (part) vis.push({ part, i, w: Math.min(full[i], ccWidth(part) + PAD + padR) }); });
      if (!vis.length) vis.push({ part: '', i: 0, w: PAD * 2 });
      // its place: over the speaker, lifted clear of anyone and anything already placed
      const h = b.lines.length * R, anchor = Math.round(p.y - 4);
      const own = o => p.x >= o.x0 - 2 && p.x <= o.x1 + 2 && p.y <= o.y0 + 5 && p.y >= o.y0 - 14;
      const block = bottom => ({ x0: cx - wMax / 2 - 1, x1: cx + wMax / 2 + 1, y0: bottom - h - 1, y1: bottom + 3 });
      let bottom = anchor;
      for (let tries = 0; tries < 8; tries++) {
        const r = block(bottom), clash = placed.concat(bodies.filter(o => !own(o))).filter(o => hit(r, o));
        if (!clash.length) break;
        bottom = Math.min(...clash.map(o => o.y0)) - 4;
      }
      if (v && bottom - h < v.y + 2) bottom = Math.max(anchor, Math.round(v.y) + 2 + h); // never off the top
      placed.push(block(bottom));
      const top = bottom - vis.length * R;
      vis.forEach((s, k) => {
        const y = top + k * R, x = Math.round(cx - full[s.i] / 2);
        g.fillStyle(BOX, A * a); g.fillRect(x, y, s.w, R);
        if (s.part) ccText(g, s.part, x + PAD, y + CAPTION.top, b.ink, { alpha: a, italic: b.italic });
        s.x = x;
      });
      // the notch, and a thin stem down to the speaker when it had to rise
      const last = vis[vis.length - 1], nx = Math.max(last.x + 3, Math.min(last.x + last.w - 4, Math.round(p.x)));
      g.fillStyle(BOX, A * a); g.fillRect(nx - 2, bottom, 5, 1); g.fillRect(nx - 1, bottom + 1, 3, 1);
      if (anchor - bottom > 2) g.fillRect(Math.round(p.x), bottom + 2, 1, anchor - bottom + 1); else g.fillRect(nx, bottom + 2, 1, 1);
      // more to say: a small arrow at the end of the last line once it is out
      if (more && Math.floor((clock || 0) * 3) % 2 === 0) { const ax = last.x + last.w - 6, ay = bottom - 5; g.fillStyle(b.ink, 1); g.fillRect(ax - 1, ay, 3, 1); g.fillRect(ax, ay + 1, 1, 1); }
    });
    if (this.prompt) {
      // the key sits over the thing; if she is standing there, over her head instead
      const p = this.prompt, bob = Math.round(Math.sin((clock || 0) * 5) * 1.5), x = Math.round(p.x - 5);
      let y = Math.round(p.y - 14 + bob);
      const her = bodies[0];
      if (her && x < her.x1 + 1 && x + 11 > her.x0 - 1 && y < her.y1 && y + 13 > her.y0 - 1) y = Math.round(her.y0 - 15 + bob);
      g.fillStyle(BOX, A); g.fillRect(x, y, 11, 11); g.fillRect(x + 4, y + 11, 3, 1); g.fillRect(x + 5, y + 12, 1, 1);
      ccText(g, p.label, x + 3, y + 2, p.ink || (p.label === '!' ? 0xd6a03c : 0xebe6d8));
      this.prompt = null;
    }
  }
}
