// Satellite batches between episodes, on a screen whose look drifts batch by batch from an
// engineer's back end to a kids' game show: routing (batch 1), a sorting shift (batch 2), routing
// with a reveal at the end (batch 3), a game show finale (batch 4). Every screen celebrates a
// solved board its own way, and every win plays the laser's charging sound.
import Z from '../core/zip-logic.js';
import LEVELS from '../data/routing-levels.json';
import { pixText, textWidth } from '../art/pixfont.js';
import { makeControls } from '../core/controls.js';
import { Sound } from '../core/sound.js';
import { overlay } from '../core/overlay.js';
import { pixelZoom } from '../core/display.js';
import { nextStep, goNext } from '../core/flow.js';
import { state } from '../core/state.js';
import { Sorter, ROUNDS } from '../sat/sorting.js';
import { WinFx, winSound, WIN_SECONDS, drawDeathMap } from '../sat/wins.js';

const BATCHES = { 1: ['basic', 'walls', 'orbit'], 2: ['sort1', 'sort2', 'sort3'], 3: ['b2a', 'b2b', 'b2c'], 4: ['rotate', 'moving', 'orbit'] };
const MODE = { 2: 'sort' };
// a pentatonic ladder: each step of the line plays the next note up
const LADDER = [0, 2, 4, 7, 9].map(n => n); const ladder = i => 440 * Math.pow(2, (LADDER[i % 5] + 12 * Math.floor(i / 5)) / 12);
const H = h => parseInt(h.slice(1), 16);
const hex2 = n => n.toString(16).toUpperCase().padStart(2, '0');

// Four looks for the same screen. Board styles: outline, panel, flat, show.
const SKINS = {
  1: { name: 'Back end', bg: '#020403', panel: '#020403', rule: '#0d2a14', cell: '#0a1a0e', cellLine: '#14401f', wall: '#5dff8a', path: '#3dff74', pathW: 2, dot: '#0f3d1c', dotDone: '#3dff74', dotText: '#3dff74', dotTextDone: '#020403', text: '#3dff74', dim: '#1d7a3a', accent: '#c6ffd6', board: 'outline' },
  2: { name: 'Ground station', bg: '#0a1018', panel: '#121a24', rule: '#2a3a4c', cell: '#18232f', cellLine: '#18232f', wall: '#c8d6e5', path: '#59d38a', pathW: 3, dot: '#c8d6e5', dotDone: '#59d38a', dotText: '#121a24', dotTextDone: '#121a24', text: '#c8d6e5', dim: '#5f7f8a', accent: '#ffb347', board: 'panel' },
  3: { name: 'Flat map', bg: '#e7e9ec', panel: '#dde1e7', rule: '#c9cfd8', cell: '#cfd5de', cellLine: '#cfd5de', wall: '#2f3a4a', path: '#3b6fd8', pathW: 7, dot: '#2f3a4a', dotDone: '#3b6fd8', dotText: '#ffffff', dotTextDone: '#ffffff', text: '#2f3a4a', dim: '#7a8597', accent: '#3b6fd8', board: 'flat' },
  4: { name: 'Game show', bg: '#1b0f3a', panel: '#2b1a5c', rule: '#4b3a96', cell: '#3a2878', cellLine: '#4b3a96', wall: '#ffd23f', path: '#ff5fa2', pathW: 9, dot: '#5b8cff', dotDone: '#ffd23f', dotText: '#ffffff', dotTextDone: '#1b0f3a', text: '#ffffff', dim: '#b8a8ff', accent: '#ffd23f', board: 'show' }
};

export class Satellite extends Phaser.Scene {
  constructor() { super('satellite'); }

  create(data) {
    data = data || {};
    // embedded: shown on a screen inside another scene, which sets this camera's viewport and
    // zoom every frame; it plays itself along the stored solution and reports when it is solved
    this.embedded = !!data.embed;
    this.batch = data.batch || 1;
    this.skinN = data.skin || this.batch;
    this.K = SKINS[this.skinN];
    this.ids = data.ids || BATCHES[this.batch] || BATCHES[1];
    this.mode = !this.embedded && MODE[this.batch] === 'sort' ? 'sort' : 'route';
    this.levelIdx = 0; this.score = data.score || 0; this.clock = 0; this.ended = false; this.final = false;
    this.preview = !!data.preview; // screen previews (K) stay on the satellite
    const cam = this.cameras.main;
    cam.setZoom(pixelZoom()); cam.setBounds(0, 0, 320, 180); cam.centerOn(160, 90); cam.setRoundPixels(true);
    cam.setBackgroundColor(H(this.K.bg));
    this.bgG = this.add.graphics(); this.liveG = this.add.graphics(); this.boardG = this.add.graphics();
    this.pathG = this.add.graphics(); this.dotsG = this.add.graphics(); this.fxG = this.add.graphics();
    this.confetti = []; this.winFx = new WinFx(this); this.reveal = null;
    this.ctl = makeControls(this);
    if (!this.embedded) {
      this.input.on('pointerdown', p => { if (this.mode === 'sort') { const q = this.world(p); this.sorter.click(q.x, q.y); } else this.onDown(p); });
      this.input.on('pointermove', p => this.onMove(p));
      this.input.on('pointerup', () => { this.drawing = false; this.lastPt = null; });
    } else { cam.setViewport(0, 0, 1, 1); this.auto = { i: 0, t: -(data.autoDelay || 0), every: data.autoEvery || 0.2 }; this.roundN = data.round || 1; }
    this.scale.on('rescale', this.onRescale, this);
    this.events.once('shutdown', () => this.scale.off('rescale', this.onRescale, this));
    if (this.mode === 'sort') {
      // the sorting shift stands in for a level list; the HUD reads its progress
      this.level = { w: 6, h: 6, id: 'sort' }; this.board = { n: 1 }; this.path = []; this.checkpoints = []; this.cs = 22; this.bx = 170; this.by = 24;
      this.sorter = new Sorter(this); this.drawStatic();
      overlay.hint('Sort the pings. Left, Down or Right sends the front one to that bin (or click a bin). The rule card says which bin takes which shape.');
    } else this.loadLevel(0);
    if (!this.embedded) cam.fadeIn(500);
    if (!data.quiet && !this.embedded) { overlay.card('SATELLITE', 'Batch ' + this.batch, 2600); }
    if (!this.embedded) window.__game = { scene: this };
  }
  onRescale() { if (!this.embedded) this.cameras.main.setZoom(pixelZoom()); }
  autoStep(dt) {
    const a = this.auto, sol = this.level.solution; if (!a || this.solved || !sol) return;
    a.t += dt;
    while (a.t >= a.every && a.i < sol.length && !this.solved) { a.t -= a.every; if (a.i === 0) this.path = [sol[0]]; else this.tryStep(sol[a.i]); a.i++; }
  }

  loadLevel(i) {
    this.levelIdx = i;
    this.level = LEVELS.find(l => l.id === this.ids[i]);
    const L = this.level;
    this.board = Z.gridBoard(L.w, L.h, { wrapX: L.wrapX, walls: L.walls });
    this.checkpoints = L.checkpoints.slice();
    this.path = []; this.solved = false; this.badIdx = -1; this.drawing = false;
    this.cs = L.w === 5 ? 26 : 22;
    const size = this.cs * L.w;
    this.bx = Math.round(236 - size / 2); this.by = Math.round(90 - size / 2);
    this.drawStatic();
    if (!this.embedded) overlay.hint(L.wrapX ? 'The left and right edges connect: drag off one side and the line comes back on the other. Drag back to undo.' : 'Draw one line from 1 through every square, passing the numbers in order. Drag back to undo.');
  }

  // ------------------------------------------------------------------ input (pointer in world space)
  world(p) { return this.cameras.main.getWorldPoint(p.x, p.y); }
  cellAt(x, y, wrap) {
    const L = this.level; let gx = Math.floor((x - this.bx) / this.cs); const gy = Math.floor((y - this.by) / this.cs);
    if (gy < 0 || gy >= L.h) return -1;
    if (gx < 0 || gx >= L.w) { if (wrap && L.wrapX && (gx === -1 || gx === L.w)) gx = (gx + L.w) % L.w; else return -1; }
    return gy * L.w + gx;
  }
  inside(x, y) { const L = this.level; return x >= this.bx && y >= this.by && x < this.bx + L.w * this.cs && y < this.by + L.h * this.cs; }
  order() { const m = new Map(); this.checkpoints.forEach((c, i) => m.set(c, i)); return m; }
  nextIdx() { const o = this.order(); let n = 0; this.path.forEach(c => { if (o.has(c)) n = Math.max(n, o.get(c) + 1); }); return n; }
  onDown(p) {
    if (this.solved || this.ended) return;
    const q = this.world(p), c = this.cellAt(q.x, q.y, false);
    if (c < 0) return;
    const idx = this.path.indexOf(c);
    if (idx >= 0) { this.path.length = idx + 1; this.drawing = true; }
    else if (c === this.checkpoints[0]) { this.path = [c]; this.drawing = true; Sound.tone(660, 0.04, 'square', 0.015); }
    else { this.flashBad(0); return; }
    this.lastPt = q;
  }
  onMove(p) {
    if (!this.drawing || !p.isDown || this.solved) return;
    const q = this.world(p);
    if (!this.inside(q.x, q.y) && !this.level.wrapX) { this.lastPt = null; return; }
    const from = this.lastPt || q, dist = Math.hypot(q.x - from.x, q.y - from.y), n = Math.max(1, Math.ceil(dist / (this.cs / 4)));
    for (let k = 1; k <= n; k++) { const c = this.cellAt(from.x + (q.x - from.x) * k / n, from.y + (q.y - from.y) * k / n, true); if (c >= 0) this.tryStep(c); if (this.solved) break; }
    this.lastPt = this.inside(q.x, q.y) ? q : null;
  }
  tryStep(c) {
    const path = this.path, head = path[path.length - 1];
    if (c === head || head === undefined) return;
    if (path.length >= 2 && c === path[path.length - 2]) { path.pop(); return; }
    const at = path.indexOf(c); if (at >= 0) { path.length = at + 1; return; }
    if (!this.board.adj[head].includes(c)) return;
    const o = this.order(), last = this.checkpoints[this.checkpoints.length - 1];
    if (o.has(c) && o.get(c) !== this.nextIdx()) { this.flashBad(o.get(c)); return; }
    if (c === last && path.length !== this.board.n - 1) { this.flashBad(this.checkpoints.length - 1); return; }
    path.push(c);
    Sound.tone(o.has(c) ? ladder(path.length) * 2 : ladder(path.length), 0.035, this.skinN === 4 ? 'triangle' : 'square', o.has(c) ? 0.016 : 0.011);
    if (o.has(c)) this.cpPop = { c, t: 0 };
    if (path.length === this.board.n) this.win();
  }
  flashBad(i) { this.badIdx = i; Sound.tone(160, 0.12, 'square', 0.02); this.time.delayedCall(260, () => { this.badIdx = -1; }); }

  win() {
    if (this.mode === 'sort') { this.sorter.finishRound(); return; }
    this.solved = true; this.drawing = false;
    this.celebrate();
    if (this.embedded) { this.events.emit('solved'); return; }
    this.time.delayedCall(WIN_SECONDS[this.skinN] * 1000, () => {
      if (this.levelIdx + 1 < this.ids.length) this.loadLevel(this.levelIdx + 1);
      else this.endBatch();
    });
  }
  // the sorter finished a round
  roundWon() {
    this.celebrate();
    this.time.delayedCall(WIN_SECONDS[this.skinN] * 1000, () => {
      if (this.sorter.round + 1 < ROUNDS.length) this.sorter.start(this.sorter.round + 1);
      else this.endBatch();
    });
  }
  // every screen's own win: a sound, a picture, the laser's charge
  celebrate() {
    Sound.charge(); // the same sound as the laser charging, on purpose
    this.score += 400;
    winSound(this, this.skinN);
    const bd = this.mode === 'sort' ? { x: 166, y: 10, w: 144, h: 160 } : { x: this.bx, y: this.by, w: this.cs * this.level.w, h: this.cs * this.level.h };
    this.winFx.start(this.skinN, bd);
    if (this.skinN === 4) { for (let i = 0; i < 70; i++) this.confetti.push({ x: 236 + (Math.random() - 0.5) * 120, y: 10, vx: (Math.random() - 0.5) * 60, vy: Math.random() * 30, c: ['#ff5fa2', '#ffd23f', '#3ee6c1', '#5b8cff'][i % 4], t: 0 }); }
  }
  endBatch() {
    // batch 3 ends on the estate from above, a pin wherever she died
    if (this.batch === 3 && !this.reveal && !this.embedded) {
      this.ended = true;
      const bodies = [['ep1', 112], ['ep2', 88]].flatMap(([id, tiles]) => state.episode(id).bodies.map(b => Object.assign({}, b, { span: tiles * 16 * 1 })));
      // place both episodes along one strip: the grounds first, then the house
      bodies.forEach(b => { if (b.span === 88 * 16) { b.x = 112 * 16 + b.x; } b.span = 200 * 16; });
      this.reveal = { t: 0, bodies };
      Sound.tone(1318, 0.16, 'sine', 0.03); this.time.delayedCall(140, () => Sound.tone(1760, 0.3, 'sine', 0.03));
      this.time.delayedCall(5200, () => { this.reveal.fade = true; this.endBatch(); });
      return;
    }
    this.ended = true;
    const next = this.batch + 1, step = 'batch' + this.batch;
    overlay.card('END OF BATCH ' + this.batch, 'Episode ' + next + ' is next', 3400);
    if (!this.preview && nextStep(this, step)) {
      // on to the next episode
      this.time.delayedCall(2600, () => this.cameras.main.fadeOut(700, 0, 0, 0));
      this.time.delayedCall(3500, () => goNext(this, step));
      return;
    }
    this.final = true;
    overlay.hint('That is the end of this build. K shows how this screen changes in later batches. Enter watches the opening again. R replays this batch.');
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 20), c = this.ctl;
    this.clock += dt;
    if (this.embedded) { this.autoStep(dt); this.drawLive(); this.drawBoard(); this.winFx.update(dt, this.K); return; }
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (c.nextScreen()) {
      const next = this.skinN % 4 + 1; overlay.note('Screen ' + next + ' · ' + SKINS[next].name, 1600);
      this.scene.restart({ batch: this.batch, skin: next, quiet: true, score: this.score, preview: true });
      return;
    }
    if (c.restart()) { this.scene.restart({ batch: this.batch, skin: this.skinN, quiet: true, preview: this.preview }); return; }
    if (this.final && c.advance()) { this.scene.start('intro', {}); return; }
    if (this.mode === 'sort') { this.sorter.update(dt, this.ended ? null : c); this.path = { length: this.sorter.sorted }; this.board = { n: this.sorter.R.quota }; }
    this.drawLive();
    this.drawBoard();
    this.winFx.update(dt, this.K);
    if (this.reveal) { this.reveal.t += dt; const g = this.winFx.top; drawDeathMap(g, this.K, this.reveal.t, this.reveal.bodies, (s, x, y, col, sc) => pixText(g, s, Math.round(x), Math.round(y), col, sc || 1, 1)); }
    c.endFrame();
  }

  // ------------------------------------------------------------------ drawing
  drawStatic() {
    const g = this.bgG, K = this.K; g.clear();
    g.fillStyle(H(K.bg), 1); g.fillRect(0, 0, 320, 180);
    if (this.skinN === 2) { [[6, 6, 150, 60], [6, 72, 150, 52], [6, 130, 150, 44], [162, 6, 152, 168]].forEach(([x, y, w, h]) => { g.fillStyle(H(K.panel), 1); g.fillRect(x, y, w, h); g.fillStyle(H(K.rule), 1); g.fillRect(x, y, w, 1); }); }
    if (this.skinN === 3) { g.fillStyle(H(K.panel), 1); g.fillRect(12, 60, 140, 90); for (let i = 0; i < 8; i++) { g.fillStyle(0xc9cfd8, 1); g.fillRect(16 + i * 17, 64 + (i % 3) * 20, 13, 34); } }
    if (this.skinN === 4) { g.fillStyle(H(K.panel), 1); g.fillRect(4, 4, 312, 172); }
    const L = this.level, cs = this.cs, bg = this.boardG; bg.clear();
  }
  drawLive() {
    const g = this.liveG, K = this.K, t = this.clock; g.clear();
    const tx = (s, x, y, col, sc, a) => pixText(g, s, x, y, H(col || K.text), sc || 1, a == null ? 1 : a);
    const L = this.level, task = (this.levelIdx + 1) + '/' + this.ids.length;
    if (this.skinN === 1) {
      tx('ROUTE.EXE  PID 4471', 8, 8); tx('TASK ' + task + '  GRID ' + L.w + 'x' + L.h + (L.wrapX ? '  WRAP' : ''), 8, 18, K.dim);
      tx('CFG RES_LIMIT=0.4M', 8, 34, K.dim); tx('CFG PRIVACY=OUT_OF_SCOPE', 8, 42, K.dim); tx('REQ SRC=CONTRACT', 8, 50, K.dim);
      for (let r = 0; r < 9; r++) { let line = ''; for (let b = 0; b < 6; b++) line += hex2(((r * 37 + b * 11 + Math.floor(t * 3)) * 2654435761 >>> 24) & 255) + ' '; tx(hex2(r * 16 + 0x40) + ': ' + line, 8, 66 + r * 8, r === Math.floor(t * 2) % 9 ? K.text : K.dim); }
      tx(this.solved ? '> ROUTE ACCEPTED' : '> AWAITING ROUTE', 8, 148, this.solved ? K.accent : K.text);
      if (Math.floor(t * 2) % 2 === 0) { g.fillStyle(H(K.text), 1); g.fillRect(this.solved ? 74 : 74, 148, 3, 5); }
      tx('PATH ' + this.path.length + '/' + this.board.n, 8, 160, K.dim);
    } else if (this.skinN === 2) {
      tx('GROUND TRACK', 12, 10); for (let x = 0; x < 138; x++) { g.fillStyle(H(K.dotDone), 1); g.fillRect(12 + x, 40 + Math.round(16 * Math.sin(x / 22 + t * 0.3)), 1, 1); }
      const dx = (t * 20) % 138; g.fillStyle(H(K.accent), 1); g.fillRect(11 + dx, 39 + Math.round(16 * Math.sin(dx / 22 + t * 0.3)), 3, 3);
      tx('LINK', 12, 76); for (let i = 0; i < 24; i++) { const h = 4 + Math.round(18 * Math.abs(Math.sin(i * 1.7 + t * 2))); g.fillStyle(H(K.rule), 1); g.fillRect(12 + i * 6, 118 - h, 4, h); } tx('OK', 140, 76, K.dotDone);
      tx('QUEUE ' + (this.mode === 'sort' ? this.sorter.queue.length : this.ids.length - this.levelIdx), 12, 134); tx('RF SENSING: NOT LICENSED', 12, 144, K.dim);
      const cmd = this.mode === 'sort' ? '> sort --batch ' + this.batch + ' --round ' + (this.levelIdx + 1) : '> route --batch ' + this.batch + ' --task ' + (this.levelIdx + 1); tx(cmd, 12, 160, K.accent);
      // pings sent to TASK leave red ticks on the ground track
      if (this.mode === 'sort') this.sorter.ticks.forEach((tk, i) => { const x = (i * 23 + 9) % 138; g.fillStyle(0xff5a4a, Math.max(0.35, 1 - (t - tk) / 4)); g.fillRect(12 + x, 40 + Math.round(16 * Math.sin(x / 22 + t * 0.3)) - 3, 1, 7); });
      if (Math.floor(t * 2) % 2 === 0) { g.fillStyle(H(K.accent), 1); g.fillRect(12 + textWidth(cmd) + 2, 160, 3, 5); }
      if (this.mode !== 'sort') tx('ROUTE', 168, 10);
    } else if (this.skinN === 3) {
      tx('ROUTE', 14, 14, K.text, 2); tx(String(this.levelIdx + 1).padStart(2, '0'), 14, 30, K.accent, 3);
      g.fillStyle(0xffffff, 1); g.fillRect(84, 72, 46, 44); g.fillStyle(H(K.text), 1); g.fillRect(84, 72, 46, 1); g.fillRect(84, 115, 46, 1);
      g.fillStyle(0xf1e9d8, 1); g.fillCircle(107, 84, 4); g.fillRect(103, 89, 9, 12); g.fillStyle(0xa69c87, 1); g.fillRect(104, 101, 3, 8); g.fillRect(108, 101, 3, 8); g.fillStyle(0x2a1d16, 1); g.fillRect(103, 80, 9, 3);
      tx('PUBLIC FEED: OFF', 14, 160);
    } else {
      for (let x = 8; x < 316; x += 8) { const on = (Math.floor(t * 6) + x / 8) % 2 === 0; g.fillStyle(on ? 0xffd23f : 0xff5fa2, 1); g.fillCircle(x, 4, 2); g.fillCircle(x, 175, 2); }
      for (let y = 12; y < 172; y += 8) { const on = (Math.floor(t * 6) + y / 8) % 2 === 1; g.fillStyle(on ? 0x3ee6c1 : 0xffd23f, 1); g.fillCircle(4, y, 2); g.fillCircle(315, y, 2); }
      g.fillStyle(0xff3b5c, 1); g.fillRect(14, 14, 44, 12); tx('LIVE', 20, 18, '#ffffff');
      g.fillStyle(0x0d0820, 1); g.fillRect(270, 14, 36, 12); tx('CH 07', 273, 18, K.accent);
      tx('SCORE', 16, 36, '#3ee6c1', 2); this.shown = (this.shown || 0) + Math.min(40, Math.max(0, this.score - (this.shown || 0))); tx(String(Math.round(this.shown)), 16, 50, K.accent, 3);
      for (let i = 0; i < 3; i++) { const on = i < this.levelIdx + (this.solved ? 1 : 0); g.fillStyle(on ? 0xffd23f : 0x4b3a86, 1); g.fillRect(18 + i * 10, 74, 3, 7); g.fillRect(16 + i * 10, 76, 7, 3); }
      tx('ROUND ' + (this.roundN || this.levelIdx + 1), 16, 90, '#ff5fa2', 2);
      g.fillStyle(0x0d0820, 1); g.fillRect(16, 108, 112, 8); g.fillStyle(0x3ee6c1, 1); g.fillRect(16, 108, Math.round(112 * this.path.length / this.board.n), 8);
      tx(this.solved ? 'NICE ONE!' : 'KEEP GOING', 16, 126, '#ffffff');
      // confetti
      this.confetti.forEach(p => { p.t += 1 / 60; p.vy += 40 / 60; p.x += p.vx / 60; p.y += p.vy / 60; g.fillStyle(H(p.c), 1); g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); });
      this.confetti = this.confetti.filter(p => p.y < 190);
    }
  }
  center(c) { const L = this.level; return { x: this.bx + (c % L.w) * this.cs + this.cs / 2, y: this.by + Math.floor(c / L.w) * this.cs + this.cs / 2 }; }
  drawBoard() {
    const K = this.K, L = this.level, cs = this.cs, g = this.boardG, pg = this.pathG, dg = this.dotsG, fx = this.fxG, t = this.clock;
    g.clear(); pg.clear(); dg.clear(); fx.clear();
    if (this.mode === 'sort') { this.sorter.draw(K, t); return; }
    // a ring pops out of a checkpoint when the line reaches it
    if (this.cpPop) { this.cpPop.t += 1 / 60; const p = this.center(this.cpPop.c), u = this.cpPop.t / 0.35; if (u < 1) { fx.lineStyle(2, H(K.accent), 1 - u); fx.strokeCircle(p.x, p.y, 6 + u * 12); } else this.cpPop = null; }
    // cells
    for (let c = 0; c < this.board.n; c++) {
      const x = this.bx + (c % L.w) * cs, y = this.by + Math.floor(c / L.w) * cs;
      if (K.board === 'outline') { g.lineStyle(1, H(K.cellLine), 1); g.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1); }
      else if (K.board === 'panel') { g.fillStyle(H(K.cell), 1); g.fillRect(x + 1, y + 1, cs - 2, cs - 2); }
      else if (K.board === 'flat') { g.fillStyle(H(K.cell), 1); g.fillRect(x + 1, y + 1, cs - 2, cs - 2); }
      else { g.fillStyle(H(K.cell), 1); g.fillRect(x + 1, y + 1, cs - 2, cs - 2); g.fillStyle(H(K.cellLine), 1); g.fillRect(x + 1, y + 1, cs - 2, 2); }
    }
    if (L.wrapX) for (let y = 0; y < L.h; y++) { const yy = this.by + y * cs + cs / 2; g.fillStyle(H(K.dim), 1); g.fillTriangle(this.bx - 3, yy - 3, this.bx - 3, yy + 3, this.bx - 6, yy); g.fillTriangle(this.bx + L.w * cs + 2, yy - 3, this.bx + L.w * cs + 2, yy + 3, this.bx + L.w * cs + 5, yy); }
    g.fillStyle(H(K.wall), 1);
    L.walls.forEach(([a, b]) => {
      const ax = a % L.w, ay = Math.floor(a / L.w), bx = b % L.w, by = Math.floor(b / L.w);
      if (ay === by && Math.abs(ax - bx) === L.w - 1) { g.fillRect(this.bx - 1, this.by + ay * cs + 2, 2, cs - 4); g.fillRect(this.bx + L.w * cs - 1, this.by + ay * cs + 2, 2, cs - 4); }
      else if (ax !== bx) g.fillRect(this.bx + Math.max(ax, bx) * cs - 1, this.by + ay * cs + 2, 2, cs - 4);
      else g.fillRect(this.bx + ax * cs + 2, this.by + Math.max(ay, by) * cs - 1, cs - 4, 2);
    });
    // the line
    const col = H(this.solved ? K.dotDone : K.path), w = K.pathW;
    for (let i = 1; i < this.path.length; i++) {
      const a = this.center(this.path[i - 1]), b = this.center(this.path[i]);
      const wrapEdge = Math.floor(this.path[i - 1] / L.w) === Math.floor(this.path[i] / L.w) && Math.abs((this.path[i - 1] % L.w) - (this.path[i] % L.w)) === L.w - 1;
      const seg = (x0, y0, x1, y1) => { pg.fillStyle(col, 1); pg.fillRect(Math.round(Math.min(x0, x1) - w / 2), Math.round(Math.min(y0, y1) - w / 2), Math.round(Math.abs(x1 - x0) + w), Math.round(Math.abs(y1 - y0) + w)); };
      if (wrapEdge) { const right = a.x > b.x; seg(a.x, a.y, right ? this.bx + L.w * cs + 3 : this.bx - 3, a.y); seg(right ? this.bx - 3 : this.bx + L.w * cs + 3, b.y, b.x, b.y); }
      else seg(a.x, a.y, b.x, b.y);
    }
    if (this.path.length === 1) { const a = this.center(this.path[0]); pg.fillStyle(col, 1); pg.fillRect(Math.round(a.x - w / 2), Math.round(a.y - w / 2), w, w); }
    // checkpoints: hex on the back end, plain numbers after
    const reached = this.nextIdx();
    this.checkpoints.forEach((c, i) => {
      const p = this.center(c), done = i < reached, bad = this.badIdx === i;
      const label = this.skinN === 1 ? '0x' + hex2(i + 1) : String(i + 1);
      const lw = textWidth(label), r = this.skinN === 1 ? 0 : 7;
      if (this.skinN === 1) { dg.fillStyle(H(bad ? '#ff4d4d' : done ? K.dotDone : K.dot), 1); dg.fillRect(Math.round(p.x - lw / 2 - 2), Math.round(p.y - 4), lw + 4, 9); }
      else { dg.fillStyle(H(bad ? '#ff4d4d' : done ? K.dotDone : K.dot), 1); dg.fillCircle(Math.round(p.x), Math.round(p.y), r); }
      pixText(dg, label, Math.round(p.x - lw / 2), Math.round(p.y - 2), H(done ? K.dotTextDone : K.dotText));
    });
    // the end of the line pulses
    if (this.path.length && !this.solved) {
      const p = this.center(this.path[this.path.length - 1]), a = 0.4 + 0.4 * Math.sin(t * 6);
      fx.lineStyle(1, H(this.skinN === 2 ? K.accent : K.accent), a); fx.strokeRect(Math.round(p.x - cs / 2) + 1.5, Math.round(p.y - cs / 2) + 1.5, cs - 3, cs - 3);
    }
  }
}
