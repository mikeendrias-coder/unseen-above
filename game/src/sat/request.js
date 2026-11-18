// The request form (Nov 18, research/features_nov17.md items 3 and 4). Before each batch's
// puzzles, one REQUEST lands on the screen, drawn in that screen's look: five fields, one of
// them wrong or missing, and the day's bulletin across the top. The rules get weaker every
// batch (case number required, then optional, then no operator name, then all pre-approved).
// The player checks fields (click, or W and S) and stamps APPROVED (J) or DENIED (K). Either way
// the request goes through: a denial gets a red NOTED stamp on top and the puzzle starts anyway.
// OPERATOR always reads "(not required)"; checking it records the clue 'operator'.
// Enter or N skips the form. What she stamped is kept for the endings:
//   state.story.requests = { 1: 'approved' | 'denied' | 'skipped', ... }
//   state.story.denied   = how many batches she denied (0 to 4)
import { ccText, ccWidth } from '../art/ccfont.js';
import { pixText, textWidth } from '../art/pixfont.js';
import { ASH } from '../art/palettes.js';
import { Sound } from '../core/sound.js';
import { overlay } from '../core/overlay.js';
import { state } from '../core/state.js';
import REQ from '../data/requests.json';

const H = h => typeof h === 'number' ? h : parseInt(h.slice(1), 16);
const ROWS = [['case', 'CASE NO.'], ['area', 'AREA'], ['operator', 'OPERATOR'], ['purpose', 'PURPOSE'], ['signed', 'SIGNED']];
// the form's box on the 320 x 180 screen, and where things sit inside it
// (the bulletin sits under the TV's own note in the top corner, so a NOTED never hides it)
const X0 = 36, Y0 = 34, W = 248, FH = 142, ROW0 = 25, ROW_H = 16, VAL_X = 84, BUL_Y = 17;
const STATUS_Y = 107, BTN_Y = 122, BTN_H = 15;
// the two stamp buttons, [x, width] inside the form (the ticket keeps its stub clear)
const BTNS = skin => skin === 4 ? { approved: [10, 96], denied: [112, 96] } : { approved: [16, 104], denied: [132, 100] };
const LOCK = 0.5;                            // a moment before a stamp counts, so a held key from the last scene does nothing
const CLOSE = { approved: 1.5, denied: 2.3 }; // seconds from the stamp to the puzzle

// each screen's paper: fill, edge, ink, labels, ruled lines, the bulletin strip
const LOOK = {
  1: K => ({ fill: K.bg, edge: K.dim, ink: K.text, label: K.dim, rule: K.rule, bulFill: K.text, bulInk: K.bg, hi: K.accent }),
  2: K => ({ fill: K.panel, edge: K.rule, ink: K.text, label: K.dim, rule: K.rule, bulFill: K.accent, bulInk: K.bg, hi: K.accent }),
  3: K => ({ fill: '#ffffff', edge: K.text, ink: K.text, label: K.dim, rule: K.rule, bulFill: K.text, bulInk: '#ffffff', hi: K.accent }),
  4: K => ({ fill: K.panel, edge: K.accent, ink: K.text, label: K.dim, rule: K.rule, bulFill: '#ff5fa2', bulInk: '#ffffff', hi: K.accent })
};

// what the stamps say, kept for the endings
export function recordRequest(batch, kind) {
  const map = Object.assign({}, state.story.requests || {});
  if (kind === 'skipped' && map[batch]) return; // a skip never undoes a stamp
  map[batch] = kind;
  state.storySet('requests', map);
  state.storySet('denied', Object.values(map).filter(v => v === 'denied').length);
}

export class RequestForm {
  constructor(scene, batch, skin, K, onClose) {
    this.scene = scene; this.batch = batch; this.skin = skin; this.K = K; this.onClose = onClose;
    this.D = REQ.batches[batch] || REQ.batches[1];
    this.P = LOOK[skin](K);
    this.g = scene.add.graphics().setDepth(20);
    this.t = 0; this.cursor = -1; this.hover = -1; this.checked = {}; this.last = null;
    this.stamp = null; this.done = false; this.BTN = BTNS(skin);
    this.offPointer = [];
    const on = (ev, fn) => { scene.input.on(ev, fn); this.offPointer.push([ev, fn]); };
    on('pointermove', p => { const q = scene.world(p); this.hover = this.rowAt(q.x, q.y); });
    on('pointerdown', p => {
      if (this.done) return;
      const q = scene.world(p), r = this.rowAt(q.x, q.y);
      if (r >= 0) { this.cursor = r; this.check(r); return; }
      const b = this.buttonAt(q.x, q.y); if (b) this.stampIt(b);
    });
    // W and S (or the arrows) walk down the fields; a key event, so a quick tap is never lost
    const KC = Phaser.Input.Keyboard.KeyCodes, kb = scene.input.keyboard;
    const onKey = ev => {
      if (this.done || this.stamp || ev.repeat) return;
      const d = ev.keyCode === KC.W || ev.keyCode === KC.UP ? -1 : ev.keyCode === KC.S || ev.keyCode === KC.DOWN ? 1 : 0;
      if (!d) return;
      this.cursor = this.cursor < 0 ? (d > 0 ? 0 : ROWS.length - 1) : (this.cursor + d + ROWS.length) % ROWS.length;
      this.check(this.cursor);
    };
    kb.on('keydown', onKey); this.offKey = () => kb.off('keydown', onKey);
    overlay.hint('A request needs a stamp. Click a field, or W and S, to check it. J stamps APPROVED, K stamps DENIED. Enter skips.');
  }

  // ------------------------------------------------------------------ input
  rowAt(x, y) {
    if (x < X0 + 4 || x > X0 + W - 4) return -1;
    const i = Math.floor((y - (Y0 + ROW0 - 4)) / ROW_H);
    return i >= 0 && i < ROWS.length ? i : -1;
  }
  buttonAt(x, y) {
    if (y < Y0 + BTN_Y || y > Y0 + BTN_Y + BTN_H) return null;
    for (const [k, [bx, bw]] of Object.entries(this.BTN)) if (x >= X0 + bx && x <= X0 + bx + bw) return k;
    return null;
  }
  // look at one field: say what is on it, and note the operator line
  check(i) {
    const key = ROWS[i][0];
    this.last = key;
    if (!this.checked[key]) { this.checked[key] = true; Sound.tone(key === this.D.flaw ? 330 : 880, 0.04, 'square', 0.012); }
    if (key === 'operator' && state.clue('operator')) overlay.note('NOTED (' + state.clueCount() + ')', 1600);
  }
  note(key) {
    if (key === 'operator') return REQ.operator.note;
    return (this.D.notes && this.D.notes[key]) || 'OK';
  }
  stampIt(kind) {
    if (this.stamp || this.done || this.t < LOCK) return;
    this.stamp = { kind, t: 0, noted: false };
    recordRequest(this.batch, kind);
    Sound.noise(0.07, 0.09, 380); Sound.tone(70, 0.1, 'square', 0.03);
  }
  skip() {
    if (this.done) return;
    if (!this.stamp) recordRequest(this.batch, 'skipped');
    this.close();
  }
  close() {
    if (this.done) return;
    this.done = true; this.g.destroy();
    this.offPointer.forEach(([ev, fn]) => this.scene.input.off(ev, fn)); this.offKey();
    if (this.onClose) this.onClose(this.stamp ? this.stamp.kind : 'skipped');
  }

  // Call once a frame. Returns false once the form is gone.
  update(dt, c) {
    if (this.done) return false;
    this.t += dt;
    if (c.skipLine() || c.skipAhead()) { this.skip(); return false; }
    if (!this.stamp) {
      if (c.interact()) this.stampIt('approved');
      else if (c.throwP()) this.stampIt('denied');
    } else {
      const s = this.stamp; s.t += dt;
      if (s.kind === 'denied' && !s.noted && s.t > 0.6) { s.noted = true; Sound.noise(0.07, 0.1, 300); Sound.tone(60, 0.12, 'square', 0.035); }
      if (s.t > CLOSE[s.kind]) { this.close(); return false; }
    }
    this.draw();
    return true;
  }

  // ------------------------------------------------------------------ drawing
  draw() {
    const g = this.g, P = this.P, K = this.K, D = this.D;
    const tx = (s, x, y, col, o) => ccText(g, s, x, y, H(col), o);
    const box = (x, y, w, h, col) => { g.fillStyle(H(col), 1); g.fillRect(x, y, w, h); };
    const frame = (x, y, w, h, col, n) => { n = n || 1; box(x, y, w, n, col); box(x, y + h - n, w, n, col); box(x, y, n, h, col); box(x + w - n, y, n, h, col); };
    g.clear();
    box(0, 0, 320, 180, K.bg);
    // the bulletin, one line across the top
    box(8, BUL_Y, 304, 12, P.bulFill); tx(D.bulletin, 160 - Math.round(ccWidth(D.bulletin) / 2), BUL_Y + 2, P.bulInk);
    // the paper
    box(X0, Y0, W, FH, P.fill); frame(X0, Y0, W, FH, P.edge, this.skin === 4 ? 2 : 1);
    if (this.skin === 3) box(X0 + 2, Y0 + FH, W, 2, K.rule); // a sheet on a desk: a hard shadow, no blur
    if (this.skin === 4) for (let y = Y0 + 6; y < Y0 + FH - 4; y += 6) box(X0 + W - 30, y, 2, 3, K.bg); // a ticket's tear line
    tx(REQ.titles[this.skin] || REQ.titles[1], X0 + 8, Y0 + 7, P.ink);
    const form = REQ.forms[this.skin] || REQ.forms[1];
    pixText(g, form, X0 + W - 8 - textWidth(form) - (this.skin === 4 ? 26 : 0), Y0 + 8, H(P.label));
    box(X0 + 6, Y0 + 18, W - 12 - (this.skin === 4 ? 26 : 0), 1, P.rule);
    const right = X0 + W - (this.skin === 4 ? 40 : 14);
    ROWS.forEach(([key, label], i) => {
      const y = Y0 + ROW0 + i * ROW_H, on = i === this.cursor || i === this.hover;
      if (on && !this.stamp) tx('>', X0 + 3, y, P.hi);
      tx(label, X0 + 10, y, P.label);
      box(X0 + VAL_X - 2, y + 9, right - (X0 + VAL_X - 2) - 10, 1, on && !this.stamp ? P.hi : P.rule);
      const v = key === 'operator' ? REQ.operator.value : D.fields[key];
      if (v === '~') this.squiggle(X0 + VAL_X + 2, y + 4, P.ink);
      else if (v) tx(v, X0 + VAL_X, y, key === 'operator' ? P.label : P.ink);
      // the inspector's tick box
      const bx = right - 7; frame(bx, y, 7, 7, P.label);
      if (this.checked[key]) { box(bx + 2, y + 2, 3, 3, key === D.flaw ? P.hi : P.ink); }
    });
    // what the last checked field shows
    const status = this.last ? ROWS.find(r => r[0] === this.last)[1] + '  ' + this.note(this.last) : 'CHECK THE FIELDS. THEN STAMP.';
    tx(status, X0 + 10, Y0 + STATUS_Y, this.last && this.last === D.flaw ? P.hi : P.label);
    // the two stamps, with their keys
    if (!this.stamp) {
      [['approved', 'J', 'APPROVED'], ['denied', 'K', 'DENIED']].forEach(([k, key, word]) => {
        const [bx, bw] = this.BTN[k], x = X0 + bx, y = Y0 + BTN_Y;
        frame(x, y, bw, BTN_H, P.ink);
        this.keyCap(x + 3, y + 2, key, P);
        tx(word, x + 16, y + 4, P.ink);
      });
    } else {
      const s = this.stamp, after = REQ.after[s.kind];
      if (s.t > 0.35) tx(after, X0 + 10, Y0 + BTN_Y + 4, P.ink);
    }
    // the stamp itself, pressed over the fields
    if (this.stamp) {
      const s = this.stamp;
      if (s.kind === 'approved') this.stampMark('APPROVED', X0 + 112, Y0 + 52, ASH.red);
      else {
        this.stampMark('DENIED', X0 + 112, Y0 + 44, P.ink);
        if (s.noted) this.stampMark('NOTED', X0 + 128, Y0 + 72, ASH.red);
      }
    }
    // the game show ticket's stub says the round
    if (this.skin === 4) { const s = 'R' + this.batch; ccText(g, s, X0 + W - 15 - Math.round(ccWidth(s) / 2), Y0 + 70, H(K.accent)); }
  }
  stampMark(word, x, y, col) {
    const g = this.g, w = ccWidth(word, 2) + 10, h = 24;
    g.fillStyle(H(this.P.fill), 1); g.fillRect(x + 2, y + 2, w - 4, h - 4); // the ink covers what is under it
    g.fillStyle(H(col), 1);
    g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2); g.fillRect(x, y, 2, h); g.fillRect(x + w - 2, y, 2, h);
    ccText(g, word, x + 5, y + 5, H(col), { sx: 2, sy: 2 });
  }
  keyCap(x, y, ch, P) {
    const g = this.g;
    g.fillStyle(H(P.ink), 1); g.fillRect(x, y, 10, 11);
    g.fillStyle(H(P.fill), 1); g.fillRect(x + 1, y + 1, 8, 8);
    ccText(g, ch, x + 2, y + 1, H(P.ink));
  }
  // a signature nobody can read
  squiggle(x, y, col) {
    const g = this.g; g.fillStyle(H(col), 1);
    let py = y;
    for (let i = 0; i < 44; i++) {
      const ny = y + Math.round(2.4 * Math.sin(i * 0.55) + 1.4 * Math.sin(i * 1.7));
      const a = Math.min(py, ny), b = Math.max(py, ny);
      g.fillRect(x + i, a, 1, b - a + 1); py = ny;
    }
  }
}
