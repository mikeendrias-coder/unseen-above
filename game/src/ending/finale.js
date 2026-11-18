// The end of every ending (Nov 18, after Michael's playtest: "nothing to skip or is happening, no
// ending screen, what is this supposed to be"). Three parts, all on the old TV in a dark room on
// Earth (art/moon.js paintLastRoom):
//   beat   the ending's final beat on channel 7, 15 to 25 seconds (ending/beats.js). Enter, J,
//          Space, N or a click skips it. A and D, or a click on the set's knobs, change the
//          channel even now; at the beat's climax the show takes the set back to channel 7.
//   card   the ending screen, a paper form: the ending's name, its one line, ENDINGS FOUND n/5
//          (found ones by name, the rest ----), and four buttons: TV AGAIN, CHAPTERS, ABOUT (how
//          the game argues, ui/about.js), TITLE. Under the form, the paper's credit (#endcredit).
//   tv     the TV again: the ending's feed loops on channel 7, and five more channels (other
//          places on Earth the show watches; ending/channels.js). Enter goes back to the form.
// The scene (Moon.js) owns the TV's canvas and texture and two screen-space Graphics: room (over
// the room and the set) and card.
import { Sound } from '../core/sound.js';
import { overlay } from '../core/overlay.js';
import { state } from '../core/state.js';
import { ENDINGS, endingOf } from '../data/endings.js';
import { ccText, ccWidth, ccWrap } from '../art/ccfont.js';
import { drawBeat, BEATS, BEAT_CC, OWN_NAME, vestRoom, LB } from './beats.js';
import { CHANNELS, drawChannel, drawOsd, drawStatic } from './channels.js';
import { TVSCREEN } from '../art/moon.js';
import { openAbout } from '../ui/about.js';

// the set's two knobs (paintLastRoom): the top one turns the channel up, the bottom one down
export const KNOBS = [{ x: 239, y: 94, d: 1 }, { x: 239, y: 112, d: -1 }];
export const CARD_BUTTONS = [{ id: 'tv', text: 'TV AGAIN' }, { id: 'chapters', text: 'CHAPTERS' }, { id: 'about', text: 'ABOUT' }, { id: 'title', text: 'TITLE' }];
// the paper's credit under the form (template.html #endcredit), only while the form is up
// (and body.paper-up, so Bright leaves the paper form as it is)
const credit = on => { const c = document.getElementById('endcredit'); if (c && c.hidden === !!on) c.hidden = !on; document.body.classList.toggle('paper-up', !!on); };
const INK = 0x0e0f12, PAPER = 0xebe6d8, RULE = 0xb8b2a3, DIM = 0x6b6c70, RED = 0xe3412b;

// Off to the title screen, or to its Chapters list. main.js gives window.__unseen.toGuide; a
// build without it reloads to the title instead (the presenter's resume record cleared first).
export function leave(to) {
  const u = window.__unseen;
  setTimeout(() => {
    if (u && u.toGuide) {
      u.toGuide();
      if (to === 'chapters') { const b = document.getElementById('opt-chapters'); if (b) b.click(); }
      return;
    }
    try { state.clearResume(); } catch (e) { /* nothing kept */ }
    location.href = location.pathname + location.search;
  }, 0);
}

const onPicture = (x, y) => x >= TVSCREEN.x && x < TVSCREEN.x + TVSCREEN.w && y >= TVSCREEN.y && y < TVSCREEN.y + TVSCREEN.h;

export class Finale {
  // o: { kind, id, ctx (the TV's 2D context), tex, room, card (Graphics), flash (the scene's black
  // rectangle), bite, pieces, hiss }
  constructor(scene, o) {
    Object.assign(this, o);
    this.scene = scene; this.beat = BEATS[o.kind] || BEATS.moon;
    this.phase = 'beat'; this.t = 0; this.ch = 0; this.chT = 0; this.flipT = 0; this.osdT = 0; this.knob = [0, 0];
    this.fired = {}; this.pick = 0; this.cardT = 0; this.tvT = 0; this.rows = null; this.forced = false; this.step = -1; this.amb = -1; this.ccT = 0;
    this.beds = {};
    window.__finale = this;
  }
  get channel() { return CHANNELS[this.ch]; }
  get cardUp() { return this.phase === 'card'; }

  // ------------------------------------------------------------------ input
  flip(d, forced) {
    const n = CHANNELS.length;
    this.ch = forced ? 0 : (this.ch + d + n) % n;
    this.chT = 0; this.flipT = 0.18; this.osdT = 1.8; this.amb = -1;
    if (d) this.knob[d > 0 ? 0 : 1]++;
    Sound.click(0.03); Sound.noise(0.16, 0.04, 7000);
    if (this.ch !== 0) overlay.clearCaption();
  }
  // a click on the picture (x, y in the 320 x 180 picture)
  click(x, y) {
    const k = KNOBS.find(q => Math.hypot(x - q.x, y - q.y) <= 10);
    // during the beat only a click on the picture itself skips; a miss on the set's side panel
    // (round the knobs, the speaker) does nothing, so trying the knobs never loses the beat
    if (this.phase === 'beat') { if (k) this.flip(k.d); else if (onPicture(x, y)) this.toCard(); return; }
    if (this.phase === 'tv') { if (k) this.flip(k.d); else if (this.backBox && x >= this.backBox.x && x < this.backBox.x + this.backBox.w && y >= this.backBox.y && y < this.backBox.y + this.backBox.h) this.toCard(); return; }
    if (this.phase === 'card' && this.cardT > 0.35) { const i = this.rowAt(x, y); if (i >= 0) { this.pick = i; this.press(); } }
  }
  hover(x, y) { if (this.phase === 'card') { const i = this.rowAt(x, y); if (i >= 0) this.pick = i; } }
  rowAt(x, y) { const r = this.rows; if (!r) return -1; return r.findIndex(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h); }
  skip() { if (this.phase === 'beat') this.toCard(); }

  // ------------------------------------------------------------------ the parts
  toCard() {
    this.stopBeds();
    if (this.phase === 'beat') { this.scene.bugOff = true; }
    this.phase = 'card'; this.cardT = 0; this.stamped = false;
    overlay.clearCaption();
    if (this.hiss) this.hiss.set(0.0001, 0.4);
    this.flash.setAlpha(0);
    Sound.stamp(0.8);
  }
  toTv() {
    this.phase = 'tv'; this.tvT = 0; this.ch = 0; this.chT = 0; this.osdT = 1.8; this.flipT = 0.18; this.step = -1;
    this.card.clear(); this.rows = null;
    if (this.hiss) this.hiss.set(0.015, 0.6);
    Sound.click(0.03); Sound.noise(0.16, 0.04, 7000);
  }
  press() {
    const b = CARD_BUTTONS[this.pick]; if (!b) return;
    Sound.tone(880, 0.06, 'square', 0.015);
    if (b.id === 'tv') this.toTv();
    else if (b.id === 'about') openAbout();
    else { this.leaving = true; credit(false); leave(b.id); }
  }

  update(dt, c) {
    if (this.leaving) return;
    if (this.phase === 'beat') {
      this.t += dt;
      if (c.leftP()) this.flip(-1); else if (c.rightP()) this.flip(1);
      if (c.advance()) { this.toCard(); return this.draw(dt); }
      // at the climax the show takes the set back to channel 7, once: only a viewer still away then
      // is pulled back; any flip after the climax stays where it lands
      if (!this.forced && this.t >= this.beat.climax) { this.forced = true; if (this.ch !== 0) this.flip(0, true); }
      this.cues(this.t);
      if (this.t >= this.beat.end) this.toCard();
      // black, then the TV, in two steps (whole-object fades only)
      if (this.phase === 'beat') this.flash.setAlpha(this.t < 0.9 ? 1 : this.t < 1.8 ? 0.5 : 0);
    } else if (this.phase === 'card') {
      this.cardT += dt;
      const n = CARD_BUTTONS.length;
      if (c.leftP() || c.up && this.upTap(c)) { this.pick = (this.pick + n - 1) % n; Sound.tone(660, 0.04, 'square', 0.012); }
      if (c.rightP() || c.downP()) { this.pick = (this.pick + 1) % n; Sound.tone(660, 0.04, 'square', 0.012); }
      if (this.cardT > 0.35 && c.advance()) this.press();
      if (this.cardT > 0.4 && !this.stamped) { this.stamped = true; Sound.stamp(1); }
    } else if (this.phase === 'tv') {
      this.tvT += dt;
      if (c.leftP()) this.flip(-1); else if (c.rightP()) this.flip(1);
      if (c.advance()) this.toCard();
    }
    this.chT += dt; this.flipT -= dt; this.osdT -= dt;
    this.ambient();
    this.draw(dt);
  }
  upTap(c) { const up = c.up(), tap = up && !this.upWas; this.upWas = up; return tap; }

  // ------------------------------------------------------------------ sound
  cue(key, at, fn, any) { if (this.t >= at && !this.fired[key]) { this.fired[key] = true; if (any || this.ch === 0) fn(); } }
  later(s, fn) { this.scene.time.delayedCall(s * 1000, () => { if (this.phase === 'beat') fn(); }); }
  stopBeds() { Object.values(this.beds).forEach(b => b && b.stop && b.stop(0.3)); this.beds = {}; }
  cues(t) {
    const k = this.kind, caps = BEAT_CC[k] || [];
    caps.forEach(([at, text], i) => this.cue('cc' + i, at, () => { overlay.caption(null, text, { instant: true }); this.ccT = t + 2.6; }));
    if (this.ccT && t > this.ccT) { this.ccT = 0; overlay.clearCaption(); }
    if (k === 'moon') {
      this.cue('boom', 2.4, () => { Sound.tone(48, 2.4, 'sine', 0.1, 28); Sound.noise(1.8, 0.12, 380); });
      [6.4, 9.1, 11.6, 13.9].forEach((at, i) => this.cue('fall' + i, at, () => Sound.tone(1700, 0.9, 'sine', 0.01, 260)));
      this.cue('up', 7.2, () => Sound.noise(0.16, 0.05, 800), true);
      this.cue('cheer', 8.4, () => { [0, 0.3, 0.65, 1.0, 1.5, 2.1].forEach(d => this.later(d, () => Sound.noise(0.45, 0.05, 1500))); Sound.tone(420, 0.5, 'triangle', 0.02, 760); this.later(0.6, () => Sound.tone(520, 0.5, 'triangle', 0.02, 980)); }, true);
      this.cue('hug', 12.6, () => Sound.tone(392, 0.6, 'sine', 0.015, null, 0.4), true);
      this.cue('drop', 15.2, () => { Sound.noise(0.3, 0.06, 6000); if (this.hiss) this.hiss.set(0.05, 1.2); });
      this.cue('bug', 16, () => Sound.click(0.03));
      this.cue('card', 18.2, () => { if (this.hiss) this.hiss.set(0.008, 0.3); Sound.tone(1000, 2.5, 'sine', 0.008); }, true);
      // they dance to nothing in front of the card: claps and whoops on the beat
      if (t >= 17.6 && t < this.beat.end) { const s = Math.floor((t - 17.6) / 0.25); if (s !== this.step) { this.step = s; if (s % 2 === 0) Sound.noise(0.05, 0.04, 2500); if (s % 4 === 1) Sound.tone(500 + (s % 8) * 40, 0.18, 'triangle', 0.015, 820); } }
    } else if (k === 'rerun') {
      this.cue('bed', 0.9, () => { this.beds.show = Sound.show(0.02); });
      if (t > 1 && t < 13.4) { const s = Math.floor(t * (2 + t * 0.4)); if (s !== this.step) { this.step = s; if (this.ch === 0) Sound.tone(160 + t * 26, 0.05, 'sawtooth', 0.005); } }
      this.cue('chew', 13.4, () => { if (this.beds.show) { this.beds.show.stop(0.1); this.beds.show = null; } Sound.tone(320, 1.8, 'sawtooth', 0.02, 50); Sound.noise(1.2, 0.03, 2000); });
      this.cue('off', 15.5, () => { Sound.noise(0.1, 0.08, 900); Sound.tone(130, 0.25, 'sine', 0.05, 40); if (this.hiss) this.hiss.set(0.0001, 0.3); });
    } else if (k === 'ridge') {
      this.cue('take', 1.2, () => Sound.clack());
      for (let i = 0; i < 7; i++) this.cue('hop' + i, 3.5 + i * 0.85, () => Sound.tone(880 + i * 60, 0.05, 'square', 0.012));
      this.cue('jingle', 9.5, () => [523, 659, 784, 1047].forEach((f, i) => this.later(i * 0.14, () => Sound.tone(f, 0.16, 'square', 0.025, null, 0.3))));
      this.cue('light', 10, () => { Sound.tone(110, 0.3, 'triangle', 0.04); Sound.noise(0.2, 0.05, 1500); });
      this.cue('found', 12.2, () => Sound.tone(1320, 0.12, 'square', 0.02));
      this.cue('charge', 12.6, () => Sound.charge());
      this.cue('cut', 14.2, () => { Sound.noise(0.1, 0.05, 6000); if (this.hiss) this.hiss.set(0.006, 0.2); });
    } else if (k === 'playroom') {
      [3.2, 3.9].forEach((at, i) => this.cue('sob' + i, at, () => Sound.tone(640, 0.35, 'triangle', 0.014, 420)));
      if (t >= 4.6 && t < 16.3) this.music(t - 4.6);
      this.cue('scratch', 16.3, () => { Sound.noise(0.25, 0.08, 3000); Sound.tone(900, 0.28, 'sawtooth', 0.03, 110); });
      // the show's camera comes down on its boom (a motor), turns (a servo), locks on (three beeps)
      this.cue('down', LB.DOWN, () => { Sound.tone(140, 0.5, 'sawtooth', 0.012, 220); Sound.noise(0.4, 0.02, 900); });
      this.cue('turn', LB.TURN, () => Sound.tone(420, 0.6, 'square', 0.008, 260));
      this.cue('pov', LB.POV, () => Sound.noise(0.06, 0.05, 6000));
      [0.3, 0.55, 0.8].forEach((d, i) => this.cue('lock' + i, LB.POV + d, () => Sound.tone(1200 + i * 200, 0.05, 'square', 0.015)));
      this.cue('red', LB.RED, () => Sound.tone(62, 0.9, 'sawtooth', 0.04));
      this.cue('c1', LB.C1, () => { Sound.click(0.04); Sound.tone(2600, 0.03, 'square', 0.02); });
      this.cue('c2', LB.C2, () => { Sound.click(0.04); Sound.tone(2600, 0.03, 'square', 0.02); });
      this.cue('black', LB.BLACK, () => { Sound.noise(0.08, 0.05, 6000); if (this.hiss) this.hiss.set(0.0001, 0.2); });
    } else if (k === 'couch') {
      this.cue('bed', 1.2, () => { this.beds.show = Sound.show(0.018); });
      this.cue('bug', 5, () => { Sound.click(0.02); this.scene.bugOff = true; }, true);
      this.cue('lean', 6.5, () => Sound.tone(300, 0.25, 'sine', 0.01));
      this.cue('lean2', 9, () => Sound.tone(280, 0.25, 'sine', 0.01));
      if (t > 10.5 && t < 22) { const s = Math.floor((t - 10.5) / 1.6); if (s !== this.step) { this.step = s; if (this.ch === 0) Sound.tone(s % 2 ? 120 : 95, 0.7, 'sine', 0.02, s % 2 ? 90 : 70); } }
      this.cue('turn', 15, () => Sound.noise(0.2, 0.02, 1000));
      this.cue('shh', 16.2, () => Sound.noise(0.7, 0.03, 5000));
      this.cue('back', 19.5, () => Sound.noise(0.2, 0.02, 1000));
    }
  }
  // the kids' own show music, for the dance: a kick, a hat and a dumb happy bass line (16ths, 120 bpm)
  music(mt) {
    const s = Math.floor(mt / 0.125); if (s === this.step) return; this.step = s;
    if (this.ch !== 0) return;
    const i = s % 16, bar = Math.floor(s / 16) % 4;
    if (i % 4 === 0) Sound.tone(92, 0.14, 'sine', 0.06, 46);
    if (i % 4 === 2) Sound.noise(0.03, 0.03, 8000);
    if (i === 4 || i === 12) Sound.noise(0.08, 0.05, 2200);
    const roots = [48, 53, 55, 48], line = [0, null, 12, null, 7, null, 12, 7, 0, null, 12, null, 10, 9, 7, null];
    if (line[i] != null) Sound.tone(440 * Math.pow(2, (roots[bar] + line[i] - 69 + 12) / 12), 0.1, 'square', 0.012);
    if (i === 0 && bar % 2 === 1) Sound.tone(700, 0.4, 'triangle', 0.012, 480); // a sob, on the one
  }
  // what the other channels sound like, quietly, while they are on
  ambient() {
    if (this.phase === 'card') return;
    const own = this.ch === 0;
    if (own) { if (this.phase === 'tv' && this.kind === 'playroom') this.music(this.chT); return; }
    const ch = this.channel, t = this.chT;
    const tick = (every) => { const s = Math.floor(t / every); if (s === this.amb) return false; this.amb = s; return true; };
    if (ch.sound === 'drone' && tick(0.45)) Sound.tone(170, 0.4, 'sawtooth', 0.004);
    if (ch.sound === 'steps' && tick(0.55) && (t % 6) < 3.3) { Sound.tone(70, 0.12, 'sine', 0.04); Sound.noise(0.06, 0.03, 500); }
    if (ch.sound === 'crowd' && tick(0.5)) Sound.noise(0.45, 0.012, 1100);
    if (ch.sound === 'beep' && tick(2)) Sound.tone(1000, 0.5, 'sine', 0.01);
  }

  // ------------------------------------------------------------------ drawing
  draw() {
    const x = this.ctx;
    credit(this.phase === 'card' && !this.leaving);
    if (this.phase !== 'card') {
      const own = this.ch === 0;
      if (this.flipT > 0) drawStatic(x);
      else if (own) drawBeat(x, this.kind, this.phase === 'beat' ? this.t : this.tvT, { bite: this.bite, pieces: this.pieces }, this.phase === 'tv');
      else drawChannel(x, this.channel, this.chT, this.osdT > 0);
      // the set's number and name for a moment after a flip, in the corner the channel's own mark
      // sits in, over it (so the number never shows twice)
      if (this.osdT > 0 && this.flipT <= 0) drawOsd(x, this.channel.n, own ? OWN_NAME[this.kind] : this.channel.name, this.channel.corner);
      this.tex.refresh();
    }
    this.drawRoom();
    this.drawCard();
  }
  // over the room: the people on Earth (THE VEST), the knobs' notches, the TV-again BACK tag
  drawRoom() {
    const g = this.room; g.clear(); this.backBox = null;
    if (this.phase === 'card') return;
    if (this.kind === 'moon' && this.ch === 0 && this.phase === 'beat') vestRoom(g, this.t, false);
    else if (this.kind === 'moon') vestRoom(g, this.t, true);
    // a notch on each knob that turns with every click
    KNOBS.forEach((k, i) => { const a = this.knob[i] * Math.PI / 3 - Math.PI / 2; g.fillStyle(0xb8b2a3, 1); g.fillRect(Math.round(k.x + Math.cos(a) * 3), Math.round(k.y + Math.sin(a) * 3), 1, 1); });
    if (this.phase === 'tv') {
      // a paper tag on the floor: ENTER BACK
      const s = 'BACK', w = ccWidth('ENTER') + ccWidth(s) + 16, bx = 8, by = 160;
      g.fillStyle(PAPER, 1); g.fillRect(bx, by, w, 13); g.fillStyle(INK, 1); g.fillRect(bx + 2, by + 2, ccWidth('ENTER') + 4, 9);
      ccText(g, 'ENTER', bx + 4, by + 3, PAPER); ccText(g, s, bx + ccWidth('ENTER') + 10, by + 3, INK);
      this.backBox = { x: bx, y: by, w, h: 13 };
    }
  }
  // The ending screen: a form from the show, filled in
  drawCard() {
    const g = this.card; g.clear();
    if (this.phase !== 'card') return;
    // a little up from the middle, so the credit fits under it
    const e = endingOf(this.id), W = 228, H = 156, X = 46, Y = 5;
    g.fillStyle(INK, 1); g.fillRect(-20, -20, 360, 220);
    g.fillStyle(0x2e3036, 1); g.fillRect(X + 3, Y + 3, W, H);
    g.fillStyle(PAPER, 1); g.fillRect(X, Y, W, H);
    g.fillStyle(INK, 1); g.fillRect(X, Y, W, 1); g.fillRect(X, Y + H - 1, W, 1); g.fillRect(X, Y, 1, H); g.fillRect(X + W - 1, Y, 1, H);
    const rule = y => { g.fillStyle(RULE, 1); g.fillRect(X + 5, y, W - 10, 1); };
    ccText(g, 'CH 07', X + 6, Y + 5, DIM); const hd = 'END OF BROADCAST'; ccText(g, hd, X + W - 6 - ccWidth(hd), Y + 5, DIM);
    g.fillStyle(INK, 1); g.fillRect(X + 5, Y + 15, W - 10, 1);
    ccText(g, 'ENDING', X + 6, Y + 19, DIM);
    ccText(g, e.title, X + 6, Y + 29, INK, { sx: 2, sy: 2 });
    // the show's stamp, a moment after the form comes up
    if (this.cardT > 0.4) { const s = 'AIRED', sw = ccWidth(s) + 8, sx = X + W - 8 - sw, sy = Y + 30; g.fillStyle(RED, 1); g.fillRect(sx, sy, sw, 2); g.fillRect(sx, sy + 12, sw, 2); g.fillRect(sx, sy, 2, 14); g.fillRect(sx + sw - 2, sy, 2, 14); ccText(g, s, sx + 4, sy + 4, RED); }
    const lines = ccWrap(e.epitaph, 33).slice(0, 2);
    lines.forEach((l, i) => ccText(g, l, X + 6, Y + 50 + i * 10, INK));
    rule(Y + 70);
    const found = ENDINGS.filter(q => state.story.endings[q.id]).length;
    ccText(g, 'ENDINGS FOUND', X + 6, Y + 75, DIM); ccText(g, found + '/' + ENDINGS.length, X + 6 + ccWidth('ENDINGS FOUND') + 6, Y + 75, INK);
    ENDINGS.forEach((q, i) => {
      const seen = !!state.story.endings[q.id], here = q.id === this.id, col = i < 3 ? 0 : 1, row = i < 3 ? i : i - 3;
      const rx = X + 6 + col * 104, ry = Y + 86 + row * 10;
      ccText(g, here ? '>' : ' ', rx, ry, INK);
      ccText(g, seen ? q.title : '----', rx + 8, ry, seen ? INK : DIM);
    });
    rule(Y + 118);
    // the four buttons, each as wide as its word plus an equal share of the row, the picked one inverted
    const by = Y + 124, bh = 15, gap = 4, n = CARD_BUTTONS.length, ws = CARD_BUTTONS.map(b => ccWidth(b.text));
    const extra = Math.floor((W - 12 - gap * (n - 1) - ws.reduce((a, b) => a + b, 0)) / n);
    let bx = X + 6; this.rows = ws.map(w => { const r = { x: bx, y: by, w: w + extra, h: bh }; bx += w + extra + gap; return r; });
    CARD_BUTTONS.forEach((b, i) => {
      const r = this.rows[i], on = i === this.pick;
      g.fillStyle(INK, 1); g.fillRect(r.x, r.y, r.w, r.h);
      if (!on) { g.fillStyle(PAPER, 1); g.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); }
      ccText(g, b.text, Math.round(r.x + r.w / 2 - ccWidth(b.text) / 2), r.y + 4, on ? PAPER : INK);
    });
    const help = 'A D PICK   J OR ENTER PRESSES';
    ccText(g, help, Math.round(X + W / 2 - ccWidth(help) / 2), Y + 143, DIM);
  }
  hint() {
    if (this.phase === 'beat') return 'Enter skips. A and D change the channel.';
    if (this.phase === 'tv') return 'A and D change the channel. Enter goes back.';
    return '';
  }
  destroy() { credit(false); this.stopBeds(); this.room.clear(); this.card.clear(); if (window.__finale === this) window.__finale = null; }
}
