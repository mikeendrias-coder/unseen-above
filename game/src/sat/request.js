// The request form (Nov 18, research/features_nov17.md items 3 and 4). Before each batch's
// puzzles, one REQUEST lands on the screen, drawn in that screen's look: five fields, one of
// them wrong under that day's bulletin. The bulletins get weaker every batch (case number
// required; then optional but signed; then no operator name, official use only; then everything
// pre-approved), so batch 4's flaw is no longer wrong at all.
// The player checks fields (click, or W and S) and stamps APPROVED (J) or DENIED (K). Either way
// the request goes through: a denial gets a red NOTED stamp on top and the puzzle starts anyway.
// OPERATOR always reads "(not required)". Looking past it is a deliberate act: a click on it, or
// L while the cursor is on it ("ask who"). That records the clue 'operator'; walking over it does not.
// Nothing counts for the first LOCK_MS of wall time (the screen is still fading in, and a key
// mashed at the end of the last scene must not stamp). The stamps appear when it ends. Enter, the
// key people mash through end cards, waits longer (SKIP_LOCK_MS) before it skips.
// Enter skips the form (N too: see Satellite.skipAhead). What she stamped is kept for the endings:
//   state.story.requests = { 1: 'approved' | 'denied' | 'skipped', ... }
//   state.story.denied   = how many batches she denied (0 to 4)
import { ccText, ccWidth } from '../art/ccfont.js';
import { ASH } from '../art/palettes.js';
import { Sound } from '../core/sound.js';
import { overlay } from '../core/overlay.js';
import { state } from '../core/state.js';
import REQ from '../data/requests.json';

const H = h => typeof h === 'number' ? h : parseInt(h.slice(1), 16);
const ROWS = [['case', 'CASE NO.'], ['area', 'AREA'], ['operator', 'OPERATOR'], ['purpose', 'PURPOSE'], ['signed', 'SIGNED']];
const OP = 2; // the OPERATOR row
// the form's box on the 320 x 180 screen, and where things sit inside it
// (the bulletin sits under the TV's own note in the top corner, so a NOTED never hides it)
const X0 = 36, Y0 = 34, W = 248, FH = 142, ROW0 = 25, ROW_H = 16, VAL_X = 84, BUL_Y = 17;
const STATUS_Y = 107, BTN_Y = 122, BTN_H = 15;
// the two stamp buttons, [x, width] inside the form (the ticket keeps its stub clear)
const BTNS = skin => skin === 4 ? { approved: [10, 96], denied: [112, 96] } : { approved: [16, 104], denied: [132, 100] };
export const LOCK_MS = 500;                     // wall time before a stamp (or N) counts: the fade-in
const SKIP_LOCK_MS = 1200;                      // and before Enter skips the form
const AUTO = { approved: 2.6, denied: 4.4 };    // seconds from the stamp to the puzzle, untouched
const GO_ON = { approved: 1.0, denied: 1.6 };   // after this, J, K, Space or Enter goes on at once

// each screen's paper: fill, edge, ink, labels, ruled lines, the bulletin strip, the cursor (sel)
// and the mark on the field that is wrong (flag). Batch 1's terminal flags in amber: its own
// accent is a pale green that reads as the same color as the ink.
const LOOK = {
  1: K => ({ fill: K.bg, edge: K.dim, ink: K.text, label: '#2a9e4c', rule: K.rule, bulFill: K.text, bulInk: K.bg, sel: K.accent, flag: '#ffb000' }),
  2: K => ({ fill: K.panel, edge: K.rule, ink: K.text, label: '#8099a6', rule: K.rule, bulFill: K.accent, bulInk: K.bg, sel: K.accent, flag: K.accent }),
  3: K => ({ fill: '#ffffff', edge: K.text, ink: K.text, label: '#5b6678', rule: K.rule, bulFill: K.text, bulInk: '#ffffff', sel: K.accent, flag: K.accent }),
  4: K => ({ fill: K.panel, edge: K.accent, ink: K.text, label: K.dim, rule: K.rule, bulFill: '#ff5fa2', bulInk: K.bg, sel: K.accent, flag: K.accent })
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
    this.t = 0; this.born = performance.now(); this.cursor = -1; this.hover = -1; this.checked = {}; this.last = null;
    this.stamp = null; this.done = false; this.BTN = BTNS(skin); this.shown = false;
    this.offPointer = [];
    const on = (ev, fn) => { scene.input.on(ev, fn); this.offPointer.push([ev, fn]); };
    on('pointermove', p => { const q = scene.world(p); this.hover = this.rowAt(q.x, q.y); });
    on('pointerdown', p => {
      if (this.done) return;
      const q = scene.world(p), r = this.rowAt(q.x, q.y);
      if (r >= 0) { if (!this.stamp) { this.cursor = r; this.check(r); if (r === OP) this.ask(); } return; }
      const b = this.buttonAt(q.x, q.y); if (b) this.stampIt(b);
    });
    // W and S (or the arrows) walk down the fields; L asks who the operator is.
    // Key events, so a quick tap is never lost.
    const KC = Phaser.Input.Keyboard.KeyCodes, kb = scene.input.keyboard;
    const onKey = ev => {
      if (this.done || this.stamp || ev.repeat) return;
      if (ev.keyCode === KC.L) { if (this.cursor === OP) this.ask(); return; }
      const d = ev.keyCode === KC.W || ev.keyCode === KC.UP ? -1 : ev.keyCode === KC.S || ev.keyCode === KC.DOWN ? 1 : 0;
      if (!d) return;
      this.cursor = this.cursor < 0 ? (d > 0 ? 0 : ROWS.length - 1) : (this.cursor + d + ROWS.length) % ROWS.length;
      this.check(this.cursor);
    };
    kb.on('keydown', onKey); this.offKey = () => kb.off('keydown', onKey);
    overlay.hint('Check the fields, then stamp. Enter skips.');
  }

  // the stamps (and skipping) wait out the fade-in, in wall time so a slow frame cannot stretch it
  ready() { return performance.now() - this.born >= LOCK_MS; }

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
  // look at one field: say what is on it (the operator line needs a closer look: ask())
  check(i) {
    const key = ROWS[i][0];
    this.last = key;
    if (key === 'operator') return;
    if (!this.checked[key]) { this.checked[key] = true; Sound.tone(key === this.D.flaw ? 330 : 880, 0.04, 'square', 0.012); }
  }
  // who is the operator? nobody: the clue
  ask() {
    this.last = 'operator';
    if (this.checked.operator) return;
    this.checked.operator = true; Sound.tone(330, 0.05, 'square', 0.012);
    if (state.clue('operator')) overlay.note('NOTED (' + state.clueCount() + ')', 1600);
  }
  note(key) {
    if (key === 'operator') return this.checked.operator ? (this.D.operator || REQ.operator.note) : null;
    return (this.D.notes && this.D.notes[key]) || 'OK';
  }
  stampIt(kind) {
    if (this.stamp || this.done || !this.ready()) return;
    this.stamp = { kind, t: 0, noted: false };
    recordRequest(this.batch, kind);
    Sound.noise(0.07, 0.09, 380); Sound.tone(70, 0.1, 'square', 0.03);
  }
  // Enter (or N): past the form. During the lock the press is dropped, so a key mashed at the end
  // of the last scene cannot skip it. Returns whether the form went.
  skip() {
    if (this.done) return true;
    if (performance.now() - this.born < SKIP_LOCK_MS) return false;
    if (!this.stamp) recordRequest(this.batch, 'skipped');
    this.close();
    return true;
  }
  // for a test, or the story-mode N that solves the puzzle: the form goes now
  dismiss() {
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
    if (!this.shown && this.ready()) { this.shown = true; Sound.tone(520, 0.03, 'square', 0.01); }
    if (c.skipLine() && this.skip()) return false;
    if (!this.stamp) {
      if (c.interact()) this.stampIt('approved');
      else if (c.throwP()) this.stampIt('denied');
    } else {
      const s = this.stamp; s.t += dt;
      if (s.kind === 'denied' && !s.noted && s.t > 0.6) { s.noted = true; Sound.noise(0.07, 0.1, 300); Sound.tone(60, 0.12, 'square', 0.035); }
      const go = c.interact() | c.throwP() | c.jumpPressed(); // all three read, so none is left over
      if (s.t > AUTO[s.kind] || (go && s.t > GO_ON[s.kind])) { this.close(); return false; }
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
    // whose desk this is (top left; the TV's own note keeps the top right)
    tx('SATELLITE OPERATOR · BATCH ' + this.batch, 8, 4, P.label);
    // the bulletin, one line across the top
    box(8, BUL_Y, 304, 12, P.bulFill); tx(D.bulletin, 160 - Math.round(ccWidth(D.bulletin) / 2), BUL_Y + 2, P.bulInk);
    // the paper
    box(X0, Y0, W, FH, P.fill); frame(X0, Y0, W, FH, P.edge, this.skin === 4 ? 2 : 1);
    if (this.skin === 3) box(X0 + 2, Y0 + FH, W, 2, K.rule); // a sheet on a desk: a hard shadow, no blur
    if (this.skin === 4) for (let y = Y0 + 6; y < Y0 + FH - 4; y += 6) box(X0 + W - 30, y, 2, 3, K.bg); // a ticket's tear line
    tx(REQ.titles[this.skin] || REQ.titles[1], X0 + 8, Y0 + 7, P.ink);
    const form = REQ.forms[this.skin] || REQ.forms[1];
    tx(form, X0 + W - 8 - ccWidth(form) - (this.skin === 4 ? 26 : 0), Y0 + 7, P.label);
    box(X0 + 6, Y0 + 18, W - 12 - (this.skin === 4 ? 26 : 0), 1, P.rule);
    const right = X0 + W - (this.skin === 4 ? 40 : 14);
    ROWS.forEach(([key, label], i) => {
      const y = Y0 + ROW0 + i * ROW_H, on = i === this.cursor || i === this.hover;
      const flagged = this.checked[key] && key === D.flaw;
      if (on && !this.stamp) tx('>', X0 + 3, y, P.sel);
      tx(label, X0 + 10, y, flagged ? P.flag : P.label);
      box(X0 + VAL_X - 2, y + 9, right - (X0 + VAL_X - 2) - 10, 1, on && !this.stamp ? P.sel : P.rule);
      const v = key === 'operator' ? REQ.operator.value : D.fields[key];
      if (v === '~') this.squiggle(X0 + VAL_X + 2, y + 4, P.ink);
      else if (v) tx(v, X0 + VAL_X, y, key === 'operator' ? P.label : P.ink);
      // the inspector's tick box; the wrong field gets a filled box and a mark beside it
      const bx = right - 7;
      if (flagged) { box(bx, y, 7, 7, P.flag); tx('!', bx - 7, y, P.flag); }
      else { frame(bx, y, 7, 7, P.label); if (this.checked[key]) box(bx + 2, y + 2, 3, 3, P.ink); }
    });
    // what the last checked field shows; before any, how to check one
    const sy = Y0 + STATUS_Y;
    if (this.stamp) {
      if (this.stamp.t > 0.35) tx(REQ.after[this.stamp.kind], X0 + 10, sy, P.ink);
    } else if (!this.last) {
      if (this.ready() && !this.stamp) this.keyLine([{ cap: 'W' }, { cap: 'S' }, ' OR CLICK: CHECK A FIELD'], X0 + 10, sy, P.label);
    } else if (this.last === 'operator' && !this.checked.operator) {
      this.keyLine(['OPERATOR  NOT NAMED.  ', { cap: 'L' }, ' ASK WHO'], X0 + 10, sy, P.label);
    } else {
      tx(ROWS.find(r => r[0] === this.last)[1] + '  ' + this.note(this.last), X0 + 10, sy, this.last === D.flaw ? P.flag : P.label);
    }
    // the two stamps, with their keys (they come once the lock is over)
    if (!this.stamp) {
      if (this.ready()) {
        [['approved', 'J', 'APPROVED'], ['denied', 'K', 'DENIED']].forEach(([k, key, word]) => {
          const [bx, bw] = this.BTN[k], x = X0 + bx, y = Y0 + BTN_Y;
          frame(x, y, bw, BTN_H, P.ink);
          this.keyCap(x + 3, y + 2, key, P);
          tx(word, x + 16, y + 4, P.ink);
        });
      }
    } else if (this.stamp.t > GO_ON[this.stamp.kind]) this.keyLine([{ cap: 'J' }, ' GO ON'], X0 + 16, Y0 + BTN_Y + 4, P.label);
    // the stamp itself, pressed over the fields: the watchers' red, both of them
    if (this.stamp) {
      const s = this.stamp;
      if (s.kind === 'approved') this.stampMark('APPROVED', X0 + 112, Y0 + 52, ASH.red);
      else {
        this.stampMark('DENIED', X0 + 112, Y0 + 44, ASH.red);
        if (s.noted) this.stampMark('NOTED', X0 + 128, Y0 + 74, ASH.red);
      }
    }
    // the game show ticket's stub says the round
    if (this.skin === 4) { const s = 'R' + this.batch; ccText(g, s, X0 + W - 15 - Math.round(ccWidth(s) / 2), Y0 + 70, H(K.accent)); }
  }
  // one line of words and key caps: parts are strings or { cap }
  keyLine(parts, x, y, col) {
    parts.forEach(p => {
      if (typeof p === 'string') { ccText(this.g, p, x, y, H(col)); x += ccWidth(p) + 1; }
      else { this.keyCap(x, y - 2, p.cap, this.P); x += 12; }
    });
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
