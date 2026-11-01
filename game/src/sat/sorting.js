// Batch 2: the sorting shift on the ground station screen. Pings slide down a lane and wait at a
// junction; Left, Down or Right (or a click) sends the front one to a bin. The shape decides the
// bin, and the rule card says which. Pings sent to TASK leave a red tick on the ground track.
import { pixText, textWidth } from '../art/pixfont.js';
import { Sound } from '../core/sound.js';

const H = h => parseInt(h.slice(1), 16);
const AREA = { x: 166, y: 10, w: 144, h: 160 };
const LANE = { x: 238, top: 46, junction: 116 };
const BIN_X = { left: 190, down: 238, right: 286 }, BIN_Y = 146;
const SHAPES = ['square', 'circle', 'triangle'];
const CODES = ['N4', 'K7', 'R2', 'T9', 'B5', 'M1', 'Q8', 'D3', 'H6', 'S0'];

// three rounds: two bins, then three, then the rule card flips halfway
export const ROUNDS = [
  { bins: { left: 'MAP', right: 'IGNORE' }, rule: { square: 'MAP', circle: 'IGNORE' }, shapes: ['square', 'circle'], quota: 8, gap: [1.7, 1.15], speed: 30 },
  { bins: { left: 'MAP', down: 'TASK', right: 'IGNORE' }, rule: { square: 'MAP', triangle: 'TASK', circle: 'IGNORE' }, shapes: SHAPES, quota: 10, gap: [1.45, 0.95], speed: 34 },
  { bins: { left: 'MAP', down: 'TASK', right: 'IGNORE' }, rule: { square: 'MAP', triangle: 'TASK', circle: 'IGNORE' }, shapes: SHAPES, quota: 12, gap: [1.25, 0.8], speed: 38,
    flipAt: 5, flip: { square: 'MAP', circle: 'TASK', triangle: 'IGNORE' } }
];

export class Sorter {
  constructor(scene) { this.scene = scene; this.g = scene.add.graphics().setDepth(5); this.ticks = []; this.start(0); }

  start(i) {
    const R = ROUNDS[i];
    this.round = i; this.R = R; this.rule = Object.assign({}, R.rule);
    this.queue = []; this.flying = []; this.sorted = 0; this.errors = 0; this.spawnT = 0.6; this.flipT = -1; this.failT = -1; this.doneT = -1; this.seq = 0;
    this.scene.levelIdx = i; this.scene.solved = false;
  }
  binFor(shape) { const name = this.rule[shape]; return Object.keys(this.R.bins).find(k => this.R.bins[k] === name); }

  // a key or a click sends the front ping
  send(dir) {
    if (this.doneT >= 0 || this.failT >= 0 || !this.R.bins[dir]) return;
    const front = this.queue[0]; if (!front || front.y < LANE.junction - 0.5) return;
    this.queue.shift();
    const right = this.binFor(front.shape) === dir;
    this.flying.push({ p: front, dir, t: 0, right });
    if (right) {
      this.sorted++; Sound.tone(660 + this.sorted * 40, 0.05, 'square', 0.015);
      if (this.R.bins[dir] === 'TASK') { this.ticks.push(this.scene.clock); Sound.tone(1500, 0.04, 'sine', 0.012); }
      if (this.R.flipAt && this.sorted === this.R.flipAt) { this.rule = Object.assign({}, this.R.flip); this.flipT = 0; Sound.tone(300, 0.2, 'sawtooth', 0.02, 600); }
      if (this.sorted >= this.R.quota) this.complete();
    } else {
      this.errors++; Sound.tone(150, 0.14, 'square', 0.022);
      if (this.errors > 2) { this.failT = 0; Sound.tone(110, 0.4, 'sawtooth', 0.025, 70); }
    }
  }
  complete() { if (this.doneT >= 0) return; this.doneT = 0; this.scene.solved = true; this.scene.roundWon(); }
  // tests and previews: finish the round now
  finishRound() { this.sorted = this.R.quota; this.queue = []; this.complete(); }

  update(dt, ctl) {
    if (ctl) { if (ctl.leftP()) this.send('left'); if (ctl.rightP()) this.send('right'); if (ctl.downP()) this.send('down'); }
    if (this.failT >= 0) { this.failT += dt; if (this.failT > 1.6) this.start(this.round); return; }
    if (this.flipT >= 0) this.flipT += dt;
    if (this.doneT >= 0) { this.doneT += dt; }
    else {
      // spawn, speeding up as the quota fills
      const prog = this.sorted / this.R.quota, gap = this.R.gap[0] + (this.R.gap[1] - this.R.gap[0]) * prog;
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = gap;
        const shape = this.R.shapes[(this.seq * 7 + Math.floor(Math.random() * 3)) % this.R.shapes.length];
        this.queue.push({ shape, code: CODES[(this.seq * 3) % CODES.length], hue: this.seq % 3, y: LANE.top - 12 });
        this.seq++;
        if (this.queue.length > 6) { this.failT = 0; this.failWhy = 'QUEUE FULL'; Sound.tone(110, 0.4, 'sawtooth', 0.025, 70); }
      }
    }
    // the lane: each ping slides down until it meets the junction or the one ahead
    this.queue.forEach((q, i) => { const stop = i === 0 ? LANE.junction : this.queue[i - 1].y - 14; q.y = Math.min(stop, q.y + this.R.speed * dt); });
    this.flying.forEach(f => f.t += dt); this.flying = this.flying.filter(f => f.t < 0.5);
  }

  shape(g, kind, x, y, s, col) {
    g.fillStyle(col, 1);
    if (kind === 'square') g.fillRect(x - s, y - s, 2 * s, 2 * s);
    else if (kind === 'circle') g.fillCircle(x, y, s + 0.5);
    else g.fillTriangle(x - s - 1, y + s, x + s + 1, y + s, x, y - s - 1);
  }
  draw(K, t) {
    const g = this.g; g.clear();
    const tx = (s, x, y, col, sc, a) => pixText(g, s, Math.round(x), Math.round(y), col, sc || 1, a == null ? 1 : a);
    const ink = H(K.text), dim = H(K.dim), acc = H(K.accent), panel = H(K.cell), rule = H(K.rule), hues = [H(K.dot), H(K.path), H(K.accent)];
    // the rule card, flipping when the rule changes
    const flip = this.flipT >= 0 && this.flipT < 0.5 ? Math.abs(Math.cos(this.flipT * Math.PI * 2)) : 1;
    const cw = Math.round(136 * flip), cx = AREA.x + 4 + (136 - cw) / 2;
    g.fillStyle(panel, 1); g.fillRect(cx, AREA.y + 2, cw, 28); g.fillStyle(this.flipT >= 0 && this.flipT < 1.2 && Math.floor(this.flipT * 8) % 2 ? 0xff5a4a : rule, 1); g.fillRect(cx, AREA.y + 2, cw, 1);
    if (flip > 0.6) {
      tx(this.flipT >= 0 && this.flipT < 1.6 ? 'RULE CHANGED' : 'RULE CARD', AREA.x + 8, AREA.y + 5, this.flipT >= 0 && this.flipT < 1.6 ? 0xff5a4a : dim);
      Object.keys(this.rule).forEach((sh, i) => { const x = AREA.x + 10 + i * 46, y = AREA.y + 20; this.shape(g, sh, x, y, 3, ink); tx('> ' + this.rule[sh], x + 6, y - 2, ink); });
    }
    // the lane and the junction
    g.fillStyle(panel, 1); g.fillRect(LANE.x - 11, LANE.top - 6, 22, LANE.junction - LANE.top + 14);
    for (let y = LANE.top - 6 + ((t * this.R.speed) % 8); y < LANE.junction + 6; y += 8) { g.fillStyle(rule, 1); g.fillRect(LANE.x - 11, Math.round(y), 22, 1); }
    g.fillStyle(acc, 1); g.fillRect(LANE.x - 13, LANE.junction + 8, 26, 1);
    // the pings
    const pings = this.queue.map(q => ({ q, x: LANE.x, y: q.y })).concat(this.flying.map(f => { const u = Math.min(1, f.t / 0.18); return { q: f.p, x: LANE.x + (BIN_X[f.dir] - LANE.x) * u, y: f.p.y + (BIN_Y - 6 - f.p.y) * u, gone: f.t > 0.18 }; }));
    pings.forEach(({ q, x, y, gone }) => { if (gone) return; g.fillStyle(H(K.bg), 1); g.fillRect(x - 9, y - 6, 18, 12); g.fillStyle(hues[q.hue], 1); g.fillRect(x - 9, y - 6, 18, 1); this.shape(g, q.shape, x - 4, y, 3, ink); tx(q.code, x + 1, y - 2, dim); });
    // the bins, with their keys
    Object.keys(BIN_X).forEach(dir => {
      const name = this.R.bins[dir]; if (!name) return;
      const x = BIN_X[dir], hit = this.flying.find(f => f.dir === dir && f.t > 0.18 && f.t < 0.5);
      g.fillStyle(hit ? (hit.right ? H(K.dotDone) : 0xff5a4a) : panel, 1); g.fillRect(x - 21, BIN_Y - 4, 42, 22);
      g.fillStyle(name === 'TASK' ? 0xff5a4a : rule, 1); g.fillRect(x - 21, BIN_Y - 4, 42, 1);
      tx(name, x - textWidth(name) / 2, BIN_Y + 2, name === 'TASK' ? 0xff8a7a : ink);
      tx(dir === 'left' ? '<' : dir === 'right' ? '>' : 'V', x - 1, BIN_Y + 10, dim);
    });
    // the count, the errors, a failed round
    tx('SORTED ' + this.sorted + '/' + this.R.quota, AREA.x + 6, AREA.y + AREA.h - 4, ink);
    tx('ERR ' + this.errors + '/2', AREA.x + AREA.w - 30, AREA.y + AREA.h - 4, this.errors ? 0xff5a4a : dim);
    if (this.failT >= 0) {
      g.fillStyle(H(K.bg), 0.85); g.fillRect(AREA.x, 70, AREA.w, 30);
      const msg = this.failWhy || 'TOO MANY ERRORS'; tx(msg, AREA.x + AREA.w / 2 - textWidth(msg) / 2, 76, 0xff5a4a); tx('ROUND AGAIN', AREA.x + AREA.w / 2 - textWidth('ROUND AGAIN') / 2, 88, ink);
    }
    if (this.failT < 0 && this.failWhy) this.failWhy = null;
  }
  // a pointer click on a bin sends the front ping there
  click(x, y) { Object.keys(BIN_X).forEach(dir => { if (this.R.bins[dir] && Math.abs(x - BIN_X[dir]) < 22 && y > BIN_Y - 8 && y < BIN_Y + 20) this.send(dir); }); }
}
export const SORT_AREA = AREA;
