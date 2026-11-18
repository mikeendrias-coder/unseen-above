// Satellite batches between episodes, on a screen whose look drifts batch by batch from an
// engineer's back end to a kids' game show. Each batch is one turning puzzle: the first time, a
// short tutorial on an orbit ring (one axis), then the real one, a maze on a globe (two axes).
// Every target on a globe walks: a step along its path on its own clock, its next step marked
// faintly, and it turns round rather than walk into a bead. Each batch adds to that: one-way gates
// (batch 1), two beads and two targets walking as a convoy (batch 2), blurred patches and a quicker
// target (batch 3), and the cartoon Earth, where a girl in pink runs a long loop, hides under the
// blur and has to be cut off (batch 4, the hardest). Turn the surface; gravity rolls the bead.
// Every screen celebrates a solved puzzle its own way, and every win plays the laser's charge.
// Before the puzzles, a REQUEST form to stamp (sat/request.js), with a bulletin whose rules get
// weaker each batch. A puzzle that runs long (2 minutes, 45 s for the ring) offers N on the screen.
import { Music } from '../core/music.js';
import { reviewKeys } from '../core/review.js';
import { pixText, textWidth } from '../art/pixfont.js';
import { makeControls } from '../core/controls.js';
import { Sound } from '../core/sound.js';
import { overlay } from '../core/overlay.js';
import { pixelZoom } from '../core/display.js';
import { nextStep, goNext, prevChapter } from '../core/flow.js';
import { state } from '../core/state.js';
import { LOOKS } from '../art/palettes.js';
import { flat } from '../art/painter.js';
import { WinFx, winSound, WIN_SECONDS, drawDeathMap } from '../sat/wins.js';
import { buildBoard, stepOnce, walks, tInit, tCells, tTick, tPeek, planFrom } from '../sat/globe-logic.js';
import { TurnView } from '../sat/globe-view.js';
import { RequestForm } from '../sat/request.js';
import { ccText, ccWidth } from '../art/ccfont.js';
import LEVELS from '../data/globe-levels.json';

const BATCHES = { 1: ['ring', 'g1'], 2: ['g2'], 3: ['g3'], 4: ['g4'] };
// what each puzzle says: the lower third at its start, the goal on the screen, the page hint
const TEXT = {
  ring: { title: 'Turn the ring', goal: 'DOT TO THE LOCK', keys: 'A D OR DRAG', hint: 'A and D turn the ring until the dot drops into the lock.' },
  g1: { title: 'A moving target', goal: 'CATCH THE TARGET', keys: 'W A S D OR DRAG', hint: 'Roll the bead into the walking target. The dots show its next step. Arrows go one way.' },
  g2: { title: 'Two at once', goal: 'EACH BEAD TO ITS COLOR', keys: 'W A S D OR DRAG', hint: 'Each bead to its color. The two targets walk together.' },
  g3: { title: 'The blur', goal: 'CATCH THE TARGET', keys: 'W A S D OR DRAG', hint: 'Nobody may look into the blur. This target is quick.' },
  g4: { title: 'Cut her off', goal: 'CUT HER OFF', keys: 'W A S D OR DRAG', hint: 'She runs, and hides under the blur. Get ahead of her.' },
  show: { title: 'Find her', goal: 'CUT HER OFF', keys: '', hint: '' }
};
const ROLL = 0.075, BOUNCE = 0.3, TURN_SPEED = 1.9; // seconds per groove, per bounce; radians a second
const STEP_SLIDE = 0.3;                              // seconds a walking target takes to slide one cell
const STUCK = { ring: 45 }, STUCK_GLOBE = 120;      // seconds on one puzzle before the screen offers N
// where each screen puts that offer, and what it says: [x, y, w], label
const OFFER = { 1: [[8, 104, 124], 'SOLVE IT FOR ME'], 2: [[12, 92, 124], 'SOLVE IT FOR ME'], 3: [[14, 132, 124], 'SOLVE IT FOR ME'], 4: [[16, 150, 124], 'FREE WIN!'] };
const H = h => parseInt(h.slice(1), 16);
// time spent on each puzzle, kept across retries (a restart rebuilds the scene), so the offer
// still comes for someone who keeps pressing Backspace: 'batch:level' -> seconds
const stuckTime = new Map();
const hex2 = n => n.toString(16).toUpperCase().padStart(2, '0');
const wrapPi = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
const ease = u => u * u * (3 - 2 * u);

// Four looks for the same screen.
const SKINS = {
  1: { name: 'Back end', bg: '#020403', panel: '#020403', rule: '#0d2a14', text: '#3dff74', dim: '#1d7a3a', accent: '#c6ffd6' },
  2: { name: 'Ground station', bg: '#0a1018', panel: '#121a24', rule: '#2a3a4c', text: '#c8d6e5', dim: '#5f7f8a', accent: '#ffb347', dotDone: '#59d38a' },
  3: { name: 'Flat map', bg: '#e7e9ec', panel: '#dde1e7', rule: '#c9cfd8', text: '#2f3a4a', dim: '#7a8597', accent: '#3b6fd8' },
  4: { name: 'Game show', bg: '#1b0f3a', panel: '#2b1a5c', rule: '#4b3a96', text: '#ffffff', dim: '#b8a8ff', accent: '#ffd23f' }
};
const boards = new Map(); // boards keep a table per turn and cell; build each once
const boardFor = L => { if (!boards.has(L.id)) boards.set(L.id, buildBoard(L)); return boards.get(L.id); };

export class Satellite extends Phaser.Scene {
  constructor() { super('satellite'); }

  create(data) {
    data = data || {};
    // embedded: shown on a screen inside another scene (the kids' room), which sets this
    // camera's viewport every frame; it plays itself and reports when it is solved
    this.embedded = !!data.embed;
    this.batch = data.batch || 1;
    this.skinN = data.skin || this.batch;
    this.K = SKINS[this.skinN];
    this.ids = this.embedded ? ['show'] : BATCHES[this.batch] || BATCHES[1];
    this.score = data.score || 0; this.clock = 0; this.ended = false; this.final = false; this.solved = false;
    this.preview = !!data.preview; // screen previews (O) stay on the satellite
    const cam = this.cameras.main;
    cam.setZoom(pixelZoom()); cam.setBounds(0, 0, 320, 180); cam.centerOn(160, 90); cam.setRoundPixels(true);
    cam.setBackgroundColor(H(this.K.bg));
    this.bgG = this.add.graphics(); this.liveG = this.add.graphics(); this.fxG = this.add.graphics().setDepth(8);
    this.confetti = []; this.winFx = new WinFx(this); this.reveal = null;
    this.ctl = makeControls(this);
    if (!this.embedded) {
      this.input.on('pointerdown', p => {
        const q = this.world(p); if (this.form) return;
        if (this.offerAt(q.x, q.y)) { this.skipAhead(); return; }
        if (q.x > 150 && !this.solved && !this.ended) { this.drag = { x: q.x, y: q.y }; this.auto = null; }
      });
      this.input.on('pointermove', p => this.onMove(p));
      this.input.on('pointerup', () => { this.drag = null; });
    } else { cam.setViewport(0, 0, 1, 1); this.roundN = data.round || 1; }
    this.scale.on('rescale', this.onRescale, this);
    this.events.once('shutdown', () => this.scale.off('rescale', this.onRescale, this));
    // music per screen; the game show screen plays the same show tune the kids hear
    if (!this.embedded) {
      if (this.skinN === 4) { Music.stop(0.8); this.showBed = Sound.show(0.03); this.events.once('shutdown', () => this.showBed.stop(0.6)); }
      else Music.play('sat' + Math.min(3, this.skinN));
    }
    this.drawStatic();
    // the request comes first, once per visit (a retry or a screen preview inside the batch skips it)
    const withForm = !this.embedded && !data.formDone && !(data.at > 0);
    this.form = null; this.offerSkip = false; // the scene object is reused on a restart
    this.loadLevel(Math.min(data.at || 0, this.ids.length - 1), !!data.quiet || withForm);
    if (withForm) {
      this.form = new RequestForm(this, this.batch, this.skinN, this.K, () => this.formClosed());
      this.offerSkip = true; // the key bar lights N while the form is up (N skips it, story mode or not)
      this.drawBoard(); // paint once: a win under the form needs the view
    }
    if (this.embedded) this.autoSolve(data.autoDelay || 0, data.autoEvery || 0.2);
    if (!this.embedded) cam.fadeIn(500);
    if (!this.embedded) window.__game = { scene: this };
  }
  // the stamp is down (or skipped): the puzzle starts
  formClosed() {
    this.form = null; this.offerSkip = false;
    const T = TEXT[this.level.id] || TEXT.g1, i = this.levelIdx;
    overlay.hint(T.hint);
    if (!this.ended && !this.solved) overlay.card(i === 0 ? 'SATELLITE · BATCH ' + this.batch : 'NOW THE REAL ONE', T.title, 3400, 'lowerLeft');
  }
  onRescale() { if (!this.embedded) this.cameras.main.setZoom(pixelZoom()); }
  world(p) { return this.cameras.main.getWorldPoint(p.x, p.y); }

  loadLevel(i, quiet) {
    this.levelIdx = i;
    const L = this.level = LEVELS.find(l => l.id === this.ids[i]);
    const B = this.B = boardFor(L);
    if (this.view) this.view.destroy();
    this.view = new TurnView(this, B, this.skinN, 238, B.ring ? 92 : 90, 5);
    const a = B.angles(L.o0);
    this.yaw = a.yaw; this.pitch = B.ring ? 0 : a.pitch;
    // the targets: where each walks (ts), the cells they stand on now, their slides and trails
    this.walking = walks(L); this.ts = tInit(L); this.targets = tCells(L, this.ts);
    this.tClock = 0; this.tSteps = 0; this.slides = L.beads.map(() => null); this.trails = L.beads.map(() => []); this.faces = L.beads.map(() => 0);
    this.ph = { o: L.o0, beads: L.beads.map(b => b.start), caught: L.beads.map(() => 0) };
    this.anim = null; this.bounced = ''; this.idle = false; this.solved = false; this.drag = null;
    this.startDist = 0; this.startDist = this.beadDist();
    const T = TEXT[L.id] || TEXT.g1;
    if (!this.embedded) {
      overlay.hint(T.hint);
      if (!quiet) this.time.delayedCall(i === 0 ? 0 : 300, () => { if (this.levelIdx === i && !this.ended) overlay.card(i === 0 ? 'SATELLITE · BATCH ' + this.batch : 'NOW THE REAL ONE', T.title, 3400, 'lowerLeft'); });
    }
    this.drawStatic();
  }

  // ------------------------------------------------------------------ turning
  onMove(p) {
    if (!this.drag || !p.isDown || this.solved) return;
    const q = this.world(p), dx = q.x - this.drag.x, dy = q.y - this.drag.y, R = this.view.R;
    this.yaw += dx / R; if (!this.B.ring) this.pitch -= dy / R;
    this.drag = { x: q.x, y: q.y }; this.turned = true;
  }
  clampPitch() { const S = this.B.S; if (!this.B.ring) this.pitch = Math.max(S.pMin * S.step, Math.min(S.pMax * S.step, this.pitch)); }
  turnInput(dt) {
    const c = this.ctl; let moved = false;
    if (this.solved || this.ended) return;
    const dirX = (c.right() ? 1 : 0) - (c.left() ? 1 : 0), dirY = this.B.ring ? 0 : (c.up() ? 1 : 0) - (c.down() ? 1 : 0);
    if (dirX || dirY) { this.yaw += dirX * TURN_SPEED * dt; this.pitch += dirY * TURN_SPEED * dt; moved = true; this.auto = null; }
    if (this.drag) moved = true;
    this.clampPitch();
    // let go: the surface eases onto the nearest step, so what you see is what the bead feels
    if (!moved && !this.auto) {
      const st = this.B.S.step, k = Math.min(1, dt * 10);
      this.yaw += (Math.round(this.yaw / st) * st - this.yaw) * k;
      if (!this.B.ring) this.pitch += (Math.round(this.pitch / st) * st - this.pitch) * k;
    }
  }
  // the turn the physics walks toward (one step at a time)
  wanted() { return this.B.nearest(this.yaw, this.B.ring ? 0 : this.pitch); }
  stepToward(o, want) {
    const B = this.B, N = B.ring ? B.S.phiN : B.S.yawN, nP = B.nP;
    const yi = B.ring ? o : Math.floor(o / nP), wy = B.ring ? want : Math.floor(want / nP);
    if (yi !== wy) { const d = (wy - yi + N) % N; return B.turn(o, d <= N / 2 ? 0 : 1); }
    return B.turn(o, want % nP > o % nP ? 2 : 3);
  }

  // ------------------------------------------------------------------ the beads
  physics(dt) {
    const ph = this.ph, B = this.B;
    if (this.anim) { this.anim.t += dt / this.anim.dur; if (this.anim.t < 1) return; this.anim = null; }
    if (this.solved) return;
    const r = stepOnce(B, ph.o, ph.beads, this.targets, ph.caught);
    if (r.moved) {
      this.anim = { ev: r.ev.filter(e => e.to != null), t: 0, dur: ROLL }; this.idle = false; this.rolls = (this.rolls || 0) + 1;
      if (!this.embedded || this.clock > 0) Sound.tone(this.skinN === 4 ? 520 + (this.rolls % 5) * 60 : 300 + (this.rolls % 4) * 40, 0.03, this.skinN === 4 ? 'triangle' : 'square', 0.008);
      if (r.ev.some(e => e.to != null && ph.caught[e.k] && e.to === this.targets[e.k])) Sound.tone(1320, 0.12, 'triangle', 0.02);
      return;
    }
    const bounce = r.ev.find(e => e.bounce != null);
    if (bounce) {
      const key = ph.o + ':' + ph.beads[bounce.k];
      if (key !== this.bounced) { this.bounced = key; this.anim = { ev: [{ k: bounce.k, from: ph.beads[bounce.k], toward: bounce.bounce }], t: 0, dur: BOUNCE }; Sound.tone(180, 0.08, 'square', 0.015); return; }
    }
    if (ph.caught.every(v => v)) { this.win(); return; }
    const want = this.wanted();
    if (want !== ph.o) { ph.o = this.stepToward(ph.o, want); this.idle = false; this.physics(0); return; }
    this.idle = true;
  }
  // The targets walk on their own clock: a step every L.tick seconds. The clock only runs while
  // every bead is at rest, so the game moves in the same steps as the solver (globe-logic.js).
  walk(dt) {
    const L = this.level, ph = this.ph;
    this.slides.forEach((sl, k) => { if (sl) { sl.t += dt / STEP_SLIDE; if (sl.t >= 1) this.slides[k] = null; } });
    if (!this.walking || this.solved || this.anim) return;
    this.tClock += dt;
    if (this.tClock < L.tick) return;
    this.tClock -= L.tick;
    const before = this.targets.slice(), blockers = ph.beads.filter((b, k) => !ph.caught[k]);
    this.ts = tTick(L, this.ts, blockers, ph.caught); this.tSteps++;
    const now = tCells(L, this.ts);
    let stepped = false;
    L.beads.forEach((b, k) => {
      if (!b.path || ph.caught[k]) return;
      if (now[k] === before[k]) return; // a bead was in the way: it turned round
      this.targets[k] = now[k]; this.slides[k] = { from: before[k], to: now[k], t: 0 }; stepped = true;
      this.trails[k].unshift(before[k]); this.trails[k].length = Math.min(this.trails[k].length, 2);
    });
    if (!this.embedded || this.clock > 0) Sound.tone(stepped ? (this.skinN === 4 ? 880 : 440) : 220, 0.025, this.skinN === 4 ? 'triangle' : 'sine', 0.006);
  }
  // how far the beads still have to go along the grooves, for the progress bars
  beadDist() {
    let s = 0; this.ph.beads.forEach((b, k) => { if (this.ph.caught[k]) return; const d = this.B.dist(this.targets[k])[b]; s += d < 0 ? 12 : d; });
    this.startDist = Math.max(this.startDist || 1, s);
    return s;
  }
  // where to draw bead k right now
  beadPoint(k) {
    const v = this.view, a = this.anim, e = a && a.ev.find(x => x.k === k);
    if (e && e.toward != null) return v.between(e.from, e.toward, 0.4 * Math.sin(Math.PI * Math.min(1, a.t)));
    if (e) return v.between(e.from, e.to, ease(Math.min(1, a.t)));
    return v.cellPos(this.ph.beads[k]);
  }

  // Plays the puzzle by itself, along the solver's plan (the kids' room, and the tests). A plan is
  // turns (0 to 3) and waits for the targets' step (4). When a step comes that the plan did not
  // wait for, it plans again from where things stand.
  autoSolve(delay, every) {
    const ph = this.ph, plan = planFrom(this.B, this.level, { o: ph.o, beads: ph.beads, caught: ph.caught, ts: this.ts, u: 0 }) || [];
    this.auto = { plan, i: 0, t: -(delay || 0), every: every || 0.2, steps: this.tSteps };
    return plan.filter(m => m < 4).length;
  }
  autoStep(dt) {
    const a = this.auto; if (!a || this.solved) return;
    a.t += dt;
    if (this.tSteps !== a.steps) {
      const waited = a.goal == null && a.plan[a.i] === 4 && this.tSteps === a.steps + 1;
      a.steps = this.tSteps;
      if (waited) a.i++; else a.lost = true;
    }
    if (a.t < 0) return;
    if (a.goal == null) {
      if (!this.idle || this.anim) return;
      if (a.lost) { const keep = a.t; this.autoSolve(0, a.every); this.auto.t = keep; return; }
      if (a.i >= a.plan.length || a.plan[a.i] === 4) return; // wait for the step
      // a burst of turns must fit before the next step, or it waits for the step and plans again
      if (this.walking) { let n = 0; while (a.i + n < a.plan.length && a.plan[a.i + n] < 4) n++; if (a.plan[a.i + n] === 4 && this.level.tick - this.tClock < n * a.every + 0.15) return; }
      a.goal = this.B.turn(this.ph.o, a.plan[a.i]);
    }
    const g = this.B.angles(a.goal), rate = this.B.S.step / a.every * dt;
    const dy = wrapPi(g.yaw - this.yaw); this.yaw += Math.sign(dy) * Math.min(Math.abs(dy), rate);
    if (!this.B.ring) { const dp = g.pitch - this.pitch; this.pitch += Math.sign(dp) * Math.min(Math.abs(dp), rate); }
    if (Math.abs(wrapPi(g.yaw - this.yaw)) < 1e-6 && (this.B.ring || Math.abs(g.pitch - this.pitch) < 1e-6) && this.ph.o === a.goal) { a.goal = null; a.i++; }
  }

  // ------------------------------------------------------------------ review, restart, winning
  // N. On the form: outside story mode it skips the form; in story mode one N goes past the form
  // and solves the first puzzle too, as N always did here. Either way not during the form's lock.
  // Off the form: N solves the puzzle on the screen.
  skipAhead() {
    if (this.form) { if (!this.form.ready()) return; if (!state.immune) { this.form.dismiss(); return; } }
    if (!this.ended && !this.solved) this.win();
  }
  // B: the puzzle before this one in the batch (batch 1: the globe, then the ring), then the request
  // form, then the part before this batch. A puzzle already solved (its win, the death map, the end
  // card) goes back to its own start. Nothing is stamped or scored by going back.
  skipBack() {
    if (this.embedded) return;
    if (this.form) { prevChapter(this); return; }
    const at = this.solved || this.ended ? this.levelIdx : this.levelIdx - 1;
    this.scene.restart(at >= 0 ? { batch: this.batch, skin: this.skinN, quiet: true, preview: this.preview, at, formDone: true }
      : { batch: this.batch, skin: this.skinN, preview: this.preview, at: 0 });
  }
  // Backspace, or the pause menu: this puzzle again from its start
  canRestart() { return !this.embedded && !this.ended; }
  restartTake() { if (this.embedded) return false; this.scene.restart({ batch: this.batch, skin: this.skinN, quiet: true, preview: this.preview, at: this.levelIdx, formDone: !this.form }); return true; }
  // a long time on one puzzle: the show offers N (no story mode needed)
  watchStuck(dt) {
    if (this.ended || this.solved || this.preview) return;
    const key = this.batch + ':' + this.levelIdx;
    if (key !== this.stuckKey) { this.stuckKey = key; this.stuckT = stuckTime.get(key) || 0; this.offerSkip = false; }
    this.stuckT += dt; stuckTime.set(key, this.stuckT);
    if (!this.offerSkip && this.stuckT > (STUCK[this.level.id] || STUCK_GLOBE)) {
      this.offerSkip = true;
      if (!state.immune) { overlay.note('Stuck? N solves it', 6500); Sound.tone(660, 0.06, 'square', 0.015); this.time.delayedCall(110, () => Sound.tone(880, 0.08, 'square', 0.015)); }
    }
  }
  // the offer on the screen itself: a box with the N key, clickable
  offerRect() { return this.offerSkip && !this.form && !this.solved && !this.ended && !state.immune && !this.embedded ? OFFER[this.skinN][0] : null; }
  offerAt(x, y) { const r = this.offerRect(); return !!r && x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + 13; }
  drawOffer(g) {
    const r = this.offerRect(); if (!r) return;
    const K = this.K, [x, y, w] = r, label = OFFER[this.skinN][1], blink = Math.floor(this.clock * 2) % 2 === 0;
    g.fillStyle(H(K.accent), 1); g.fillRect(x, y, w, 13);
    g.fillStyle(H(blink ? K.bg : K.accent), 1); g.fillRect(x + 2, y + 1, 10, 11);
    g.fillStyle(H(blink ? K.accent : K.bg), 1); g.fillRect(x + 3, y + 2, 8, 8);
    ccText(g, 'N', x + 4, y + 2, H(blink ? K.bg : K.accent));
    ccText(g, label, x + 16 + Math.round((w - 18 - ccWidth(label)) / 2), y + 3, H(K.bg));
  }
  win() {
    if (this.solved || this.ended) { if (this.form) this.form.dismiss(); return; }
    this.solved = true; this.drag = null; this.auto = null; this.anim = null;
    if (this.form) this.form.dismiss(); // a test, or story-mode N: the form goes too
    if (!this.embedded) stuckTime.delete(this.batch + ':' + this.levelIdx);
    // N, or a test: the beads go home
    this.ph.beads = this.targets.slice(); this.ph.caught = this.ph.caught.map(() => 1);
    this.celebrate();
    if (this.embedded) { this.events.emit('solved'); return; }
    this.time.delayedCall(WIN_SECONDS[this.skinN] * 1000 + (this.B.ring ? 600 : 0), () => {
      if (this.levelIdx + 1 < this.ids.length) this.loadLevel(this.levelIdx + 1);
      else this.endBatch();
    });
  }
  // every screen's own win: a sound, a picture, the laser's charge
  celebrate() {
    Sound.charge(); // the same sound as the laser charging, on purpose
    this.score += 400;
    winSound(this, this.skinN);
    this.drawThings(); // place the girl where she stands now
    const b = this.view.bounds(), girl = this.skinN === 4 && this.girlAt ? this.girlAt : null;
    this.winFx.start(this.skinN, b, girl ? { girl } : null);
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
    overlay.hint(''); // the puzzle's hint is done with
    const next = this.batch + 1, step = 'batch' + this.batch;
    overlay.card('END OF BATCH ' + this.batch, 'Episode ' + next + ' is next', 3400);
    if (!this.preview && nextStep(this, step)) {
      // on to the next episode
      this.time.delayedCall(2600, () => this.cameras.main.fadeOut(700, 0, 0, 0));
      this.time.delayedCall(3500, () => goNext(this, step));
      return;
    }
    this.final = true;
    overlay.hint('That is the end of this build. O shows how this screen changes in later batches. Enter watches the opening again. Backspace replays this batch.');
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 20), c = this.ctl;
    this.clock += dt;
    if (this.embedded) { this.autoStep(dt); this.physics(dt); this.walk(dt); this.drawLive(); this.drawBoard(); this.winFx.update(dt, this.K); return; }
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    reviewKeys(this); // N: skipAhead() (the form, or the puzzle)
    if (c.nextScreen()) {
      const next = this.skinN % 4 + 1; overlay.note('Screen ' + next + ' · ' + SKINS[next].name, 1600);
      this.scene.restart({ batch: this.batch, skin: next, quiet: true, score: this.score, preview: true, at: this.levelIdx, formDone: !this.form });
      return;
    }
    if (c.restart() && (this.final ? (this.scene.restart({ batch: this.batch, skin: this.skinN, preview: this.preview, formDone: true }), true) : this.restartTake())) return;
    // the request on the desk: nothing turns until it is stamped
    if (this.form) { this.form.update(dt, c); c.endFrame(); return; }
    this.watchStuck(dt);
    if (this.final && c.advance()) { this.scene.start('intro', {}); return; }
    this.turnInput(dt);
    this.autoStep(dt);
    this.physics(dt);
    this.walk(dt);
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
    if (this.skinN === 1) {
      // corner marks around the puzzle, like a viewport on a terminal
      g.fillStyle(H(K.dim), 1); [[164, 14], [306, 14], [164, 164], [306, 164]].forEach(([x, y], i) => { g.fillRect(x - (i % 2 ? 6 : 0), y, 7, 1); g.fillRect(x, y - (i > 1 ? 6 : 0), 1, 7); });
    }
    if (this.skinN === 2) { [[6, 6, 150, 60], [6, 72, 150, 52], [6, 130, 150, 44], [162, 6, 152, 168]].forEach(([x, y, w, h]) => { g.fillStyle(H(K.panel), 1); g.fillRect(x, y, w, h); g.fillStyle(H(K.rule), 1); g.fillRect(x, y, w, 1); }); }
    if (this.skinN === 3) {
      g.fillStyle(H(K.panel), 1); g.fillRect(12, 60, 140, 90); for (let i = 0; i < 8; i++) { g.fillStyle(0xc9cfd8, 1); g.fillRect(16 + i * 17, 64 + (i % 3) * 20, 13, 34); }
      // the map's card for the puzzle, with a soft edge
      g.fillStyle(0xd3d8df, 1); g.fillRect(166, 12, 146, 160); g.fillStyle(H(K.panel), 1); g.fillRect(164, 10, 146, 160);
    }
    if (this.skinN === 4) { g.fillStyle(H(K.panel), 1); g.fillRect(4, 4, 312, 172); g.fillStyle(H(K.rule), 1); g.fillCircle(238, 90, 76); g.fillStyle(H(K.panel), 1); g.fillCircle(238, 90, 72); }
  }
  drawLive() {
    const g = this.liveG, K = this.K, t = this.clock; g.clear();
    const tx = (s, x, y, col, sc, a) => pixText(g, s, x, y, H(col || K.text), sc || 1, a == null ? 1 : a);
    const L = this.level, T = TEXT[L.id] || TEXT.g1, task = (this.levelIdx + 1) + '/' + this.ids.length;
    const left = this.beadDist(), prog = this.solved ? 1 : Math.max(0, Math.min(1, 1 - left / Math.max(1, this.startDist)));
    const walking = this.walking && !this.solved, stepU = walking ? Math.min(1, this.tClock / L.tick) : 0;
    if (this.skinN === 1) {
      tx((this.B.ring ? 'ORBIT' : 'GLOBE') + '.EXE  PID 4471', 8, 8);
      tx('TASK ' + task + '  ' + (this.B.ring ? 'RING ' : 'GRID ') + this.B.rows + 'x' + this.B.cols + (L.gates ? '  GATES ' + L.gates.length : ''), 8, 18, K.dim);
      // what to do sits high, so the batch card (lower left) only ever covers the hex dump
      const msg = this.solved ? '> LOCK ACQUIRED' : '> AWAITING LOCK';
      tx(msg, 8, 32, this.solved ? K.accent : K.text);
      if (Math.floor(t * 2) % 2 === 0) { g.fillStyle(H(K.text), 1); g.fillRect(8 + textWidth(msg) + 2, 32, 3, 5); }
      tx('GOAL: ' + T.goal, 8, 44); tx('KEYS: ' + T.keys, 8, 54, K.dim); tx('DIST ' + String(left).padStart(2, '0') + (walking ? '  TGT MOBILE ' + L.tick.toFixed(1) + 'S' : ''), 8, 64, K.dim);
      tx('CFG RES_LIMIT=0.4M', 8, 78, K.dim); tx('CFG PRIVACY=OUT_OF_SCOPE', 8, 86, K.dim); tx('REQ SRC=CONTRACT', 8, 94, K.dim);
      for (let r = 0; r < 7; r++) { let line = ''; for (let b = 0; b < 6; b++) line += hex2(((r * 37 + b * 11 + Math.floor(t * 3)) * 2654435761 >>> 24) & 255) + ' '; tx(hex2(r * 16 + 0x40) + ': ' + line, 8, 108 + r * 8, r === Math.floor(t * 2) % 7 ? K.text : K.dim); }
    } else if (this.skinN === 2) {
      tx('GROUND TRACK', 12, 10); for (let x = 0; x < 138; x++) { g.fillStyle(H(K.dotDone), 1); g.fillRect(12 + x, 40 + Math.round(16 * Math.sin(x / 22 + t * 0.3)), 1, 1); }
      const dx = (t * 20) % 138; g.fillStyle(H(K.accent), 1); g.fillRect(11 + dx, 39 + Math.round(16 * Math.sin(dx / 22 + t * 0.3)), 3, 3);
      tx('LINK', 12, 76); for (let i = 0; i < 24; i++) { const h = 4 + Math.round(18 * Math.abs(Math.sin(i * 1.7 + t * 2))); g.fillStyle(H(K.rule), 1); g.fillRect(12 + i * 6, 118 - h, 4, h); } tx('OK', 140, 76, K.dotDone);
      tx('REQUESTS ' + this.ph.caught.filter(v => v).length + '/' + this.ph.beads.length, 12, 134); tx('RF SENSING: NOT LICENSED', 12, 144, K.dim);
      const cmd = '> route --batch ' + this.batch + ' --beads ' + this.ph.beads.length; tx(cmd, 12, 160, K.accent);
      if (Math.floor(t * 2) % 2 === 0) { g.fillStyle(H(K.accent), 1); g.fillRect(12 + textWidth(cmd) + 2, 160, 3, 5); }
      tx('ROUTE', 168, 10); tx(T.goal, 168, 164, K.dim); if (walking) tx('CONTACTS MOVING', 202, 10, K.accent);
      // each bead's color, and whether it is home
      this.ph.beads.forEach((b, k) => { const c = H(this.view.P.beads[k]); g.fillStyle(c, 1); g.fillRect(290 + k * 10, 10, 5, 5); if (!this.ph.caught[k]) { g.fillStyle(H(K.panel), 1); g.fillRect(291 + k * 10, 11, 3, 3); } });
    } else if (this.skinN === 3) {
      tx('ROUTE', 14, 14, K.text, 2); tx(String(this.batch).padStart(2, '0'), 14, 30, K.accent, 3);
      g.fillStyle(0xffffff, 1); g.fillRect(84, 72, 46, 44); g.fillStyle(H(K.text), 1); g.fillRect(84, 72, 46, 1); g.fillRect(84, 115, 46, 1);
      g.fillStyle(0xf1e9d8, 1); g.fillCircle(107, 84, 4); g.fillRect(103, 89, 9, 12); g.fillStyle(0xa69c87, 1); g.fillRect(104, 101, 3, 8); g.fillRect(108, 101, 3, 8); g.fillStyle(0x2a1d16, 1); g.fillRect(103, 80, 9, 3);
      if (walking) { tx('ON THE MOVE', 14, 50, '#d94a4a'); g.fillStyle(H(K.rule), 1); g.fillRect(14, 58, 60, 2); g.fillStyle(0xd94a4a, 1); g.fillRect(14, 58, Math.round(60 * stepU), 2); }
      tx(T.goal, 14, 154); tx('PUBLIC FEED: OFF', 14, 164, K.dim);
      g.fillStyle(H(K.accent), 1); g.fillRect(170, 162, Math.round(134 * prog), 3); g.fillStyle(H(K.rule), 1); g.fillRect(170 + Math.round(134 * prog), 162, 134 - Math.round(134 * prog), 3);
    } else {
      for (let x = 8; x < 316; x += 8) { const on = (Math.floor(t * 6) + x / 8) % 2 === 0; g.fillStyle(on ? 0xffd23f : 0xff5fa2, 1); g.fillCircle(x, 4, 2); g.fillCircle(x, 175, 2); }
      for (let y = 12; y < 172; y += 8) { const on = (Math.floor(t * 6) + y / 8) % 2 === 1; g.fillStyle(on ? 0x3ee6c1 : 0xffd23f, 1); g.fillCircle(4, y, 2); g.fillCircle(315, y, 2); }
      g.fillStyle(0xff3b5c, 1); g.fillRect(14, 14, 44, 12); tx('LIVE', 20, 18, '#ffffff');
      g.fillStyle(0x0d0820, 1); g.fillRect(270, 14, 36, 12); tx('CH 07', 273, 18, K.accent);
      tx('SCORE', 16, 36, '#3ee6c1', 2); this.shown = (this.shown || 0) + Math.min(40, Math.max(0, this.score - (this.shown || 0))); tx(String(Math.round(this.shown)), 16, 50, K.accent, 3);
      for (let i = 0; i < 3; i++) { const on = i < this.batch - 1 + (this.solved ? 1 : 0); g.fillStyle(on ? 0xffd23f : 0x4b3a86, 1); g.fillRect(18 + i * 10, 74, 3, 7); g.fillRect(16 + i * 10, 76, 7, 3); }
      tx('ROUND ' + (this.roundN || this.batch), 16, 90, '#ff5fa2', 2);
      g.fillStyle(0x0d0820, 1); g.fillRect(16, 108, 112, 8); g.fillStyle(0x3ee6c1, 1); g.fillRect(16, 108, Math.round(112 * prog), 8);
      tx(this.solved ? 'NICE ONE!' : this.hidden0 ? 'WHERE IS SHE?' : 'CATCH HER!', 16, 126, '#ffffff');
      tx(T.keys, 16, 140, K.dim);
      // confetti
      this.confetti.forEach(p => { p.t += 1 / 60; p.vy += 40 / 60; p.x += p.vx / 60; p.y += p.vy / 60; g.fillStyle(H(p.c), 1); g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); });
      this.confetti = this.confetti.filter(p => p.y < 190);
    }
    this.drawOffer(g);
  }
  drawBoard() {
    this.view.paint(this.yaw, this.B.ring ? this.B.S.tilt : this.pitch, this.clock);
    this.drawThings();
  }
  drawThings() {
    const v = this.view, P = v.P, L = this.level, items = [], t = this.clock, ph = this.ph, B = this.B;
    (L.gates || []).forEach(([a, b]) => items.push({ kind: 'gate', p: v.between(a, b, 0.5), from: v.cellPos(a), to: v.cellPos(b) }));
    const hair = flat((LOOKS[state.look] || LOOKS.A).hair), blockers = ph.beads.filter((b, k) => !ph.caught[k]);
    const stepU = this.walking ? Math.min(1, this.tClock / L.tick) : 0;
    this.hidden0 = false;
    this.targets.forEach((c, k) => {
      const color = this.skinN === 4 && k === 0 ? P.target : L.beads.length > 1 ? P.beads[k] : P.target;
      const sl = this.slides[k], free = L.beads[k].path && !ph.caught[k] && !this.solved;
      let p = v.cellPos(c);
      if (sl) p = v.between(sl.from, sl.to, ease(Math.min(1, sl.t)));
      // under the blur a target cannot be seen (it shows again as it steps out)
      const hidden = free && B.blur[c] && (!sl || sl.t > 0.5 || B.blur[sl.from]);
      if (k === 0) this.hidden0 = hidden;
      if (free) {
        // the way it came (two dots), and a faint mark where it steps next
        this.trails[k].forEach((cell, j) => { if (!B.blur[cell] && (j === 0 || !sl)) items.push({ kind: 'trail', p: v.cellPos(cell), color }); });
        const nx = tPeek(L, this.ts, k, blockers, ph.caught);
        if (nx && !nx.blocked && !B.blur[nx.cell]) items.push({ kind: 'mark', p: v.cellPos(nx.cell), color, u: stepU });
      }
      if (hidden) return;
      const girl = this.skinN === 4 && k === 0;
      if (girl) {
        // she faces the way she runs on screen
        if (sl) { const a = v.project(v.cellPos(sl.from)), b = v.project(v.cellPos(sl.to)); if (b.x !== a.x) this.faces[k] = b.x > a.x ? 1 : -1; }
        if (!(this.solved && this.winFx.on)) items.push({ kind: 'girl', p, hair, tick: true, color: P.target, face: free ? this.faces[k] : 0 });
        items.push({ kind: 'target', p, color: P.target, tick: false });
      } else items.push({ kind: 'target', p, color, tick: true, lock: B.ring && ph.caught[k] });
    });
    ph.beads.forEach((b, k) => items.push({ kind: 'bead', p: this.beadPoint(k), color: P.beads[k], caught: ph.caught[k], tick: true }));
    v.drawThings(items, t);
    if (this.skinN === 4) { const q = v.project(v.cellPos(this.targets[0])); this.girlAt = { x: q.x, y: q.y }; }
  }
}
