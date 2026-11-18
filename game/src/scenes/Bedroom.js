// Episode 4: the bedroom. The heart of the house, with the lights off: the only light that moves
// is red. The cameras here only see when they flash, and they click twice first. Noise turns
// them: old boards creak, glass crunches, unless the big clock is striking or the music box is
// playing. His bag is under the fallen stairs; pulling it free brings the floor down behind her,
// and the run to the doors is real platforming. At the end of the blood, the bedroom: him, and a
// door that does not match itself. Stay with him long enough and the show cuts to a break.
import { Music } from '../core/music.js';
import { hexNum, flat, Painter } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { ccText, ccWidth } from '../art/ccfont.js';
import { TILE, GROUND, BX, LEVEL, buildMap, paintLevel, paintBrother, trail } from '../art/bedroom.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { typer } from '../ui/typer.js';
import { display } from '../core/display.js';
import { SideEpisode, inPoly, K } from '../core/side.js';
import { goNext } from '../core/flow.js';
import { BEDROOM, NOTICE, lineSeconds } from '../data/dialogue.js';
import { Glasses } from '../core/glasses.js';
import { reviewKeys, presenting } from '../core/review.js';
import { fx } from '../core/fx.js';
import { darkFill, hardHoles, checker, pxCircle } from '../core/topdown.js';
import { Marks, Gold, pushClear } from '../core/props.js';
import { ASH } from '../art/palettes.js';

const ARC = { ceiling: [35, 145], wall: [150, 200] };
const STAY = 15; // seconds holding on to him before the show cuts away
const glassesOn = t => (Math.sin(t * 2.3) + Math.sin(t * 5.7 + 1) * 0.6 + Math.sin(t * 13.1) * 0.3) > -0.35;
const spans = (pts, fn) => Painter.prototype.spans.call(null, pts.map(p => [p.x, p.y]), fn);
// red patterns for the dark canvas: a flash paints what it touches in red pixels
const redPats = new WeakMap();
function redPattern(ctx, dense, parity) {
  let pr = redPats.get(ctx);
  if (!pr) {
    const mk = (n, cells) => { const t = document.createElement('canvas'); t.width = n; t.height = n; const x = t.getContext('2d'); x.fillStyle = '#e3412b'; cells.forEach(([a, b]) => x.fillRect(a, b, 1, 1)); return ctx.createPattern(t, 'repeat'); };
    pr = { dense: mk(2, [[0, 0], [1, 1]]), sparse: mk(4, [[0, 0], [2, 2]]) }; redPats.set(ctx, pr);
  }
  const p = dense ? pr.dense : pr.sparse;
  if (p.setTransform) p.setTransform(new DOMMatrix([1, 0, 0, 1, ((parity % 2) + 2) % 2, 0]));
  return p;
}
// a pixel line on a Graphics, solid or dotted
function pxLine(g, x0, y0, x1, y1, color, dot) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); g.fillStyle(color, 1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (let n = 0; n < 600; n++) { if (!dot || n % dot === 0) g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

export class Bedroom extends SideEpisode {
  constructor() { super('bedroom'); }

  create(data) {
    data = data || {};
    this.initSide('ep4', LEVEL, buildMap());
    const P = this.P, LW = LEVEL.w * TILE;
    makeSprites(this, P);
    const lvl = paintLevel(P); lvl.toTexture(this, 'bd_level'); this.marks = lvl.marks;
    paintBrother(P, false).toTexture(this, 'bro_sit'); paintBrother(P, false, true).toTexture(this, 'bro_in'); paintBrother(P, true).toTexture(this, 'bro_dead');
    this.trail = trail();
    this.pixelCamera(LW, P.void);
    this.add.image(0, 0, 'bd_level').setOrigin(0).setDepth(0);
    this.worldG = this.add.graphics().setDepth(0.5);
    this.propG = this.add.graphics().setDepth(1.5);
    this.camG = this.add.graphics().setDepth(3);
    this.bro = this.add.image(LEVEL.brother.x, GROUND, 'bro_sit').setOrigin(0, 1).setDepth(3.2);
    this.commonLayers();
    this.eyeG = this.add.graphics().setDepth(4.5);
    // the dark: a canvas the size of the view; holes cut where there is light, red where a flash is
    this.darkCanvas = document.createElement('canvas'); this.darkCanvas.width = 322; this.darkCanvas.height = 182;
    if (this.textures.exists('bd_dark')) this.textures.remove('bd_dark');
    this.darkTex = this.textures.addCanvas('bd_dark', this.darkCanvas);
    this.darkImg = this.add.image(0, 0, 'bd_dark').setOrigin(0).setDepth(6.4);
    this.overG = this.add.graphics().setDepth(6.6);
    this.hudG = this.addParallax(this.add.graphics().setDepth(20), 0);
    this.debris = this.add.particles(0, 0, 'dot2', { speedX: { min: -20, max: 20 }, speedY: { min: -10, max: 30 }, gravityY: 420, lifespan: { min: 500, max: 1100 }, tint: [hexNum(P.wood), hexNum(P.rubble), hexNum(P.woodHi)], emitting: false }).setDepth(6.45);
    this.dust = this.add.particles(0, 0, 'dot', { speedY: { min: -14, max: -4 }, speedX: { min: -8, max: 8 }, lifespan: 1200, tint: [hexNum(flat(P.dust)), hexNum(P.rubble)], emitting: false }).setDepth(6.45);
    this.motes = this.add.particles(0, 0, 'dot', { speedX: { min: -16, max: -4 }, speedY: { min: -6, max: 6 }, lifespan: 1600, tint: [hexNum(P.voidEdge), hexNum(P.colLo)], emitting: false }).setDepth(6.7);

    // the cameras, each on its own beat
    this.cams = LEVEL.cameras.map(c => { const cm = Object.assign({}, c, { angle: c.aim, cone: null, lock: 0, caught: false, flash: 0, snap: null, clicks: 0, warn: false }); this.resync(cm, 0.6 - 0.9); return cm; });
    this.noises = []; this.rings = []; this.struck = new Set(); this.lastTick = -1;
    this.props = LEVEL.props.map(r => Object.assign({}, r));
    this.wallProp = Object.assign({}, LEVEL.bag.wall); this.props.push(this.wallProp);
    this.lowProp = Object.assign({ falls: true }, LEVEL.bag.low);
    const S = LEVEL.run.slab; this.slabProp = { id: 'the ceiling', x: S.x, y: S.top, w: S.w, h: S.bottom - S.top, falls: true };
    this.bag = { have: false, hold: 0, note: 0, read: false };
    this.collapse = null; this.runNote = 0; this.glitchT = 0;
    this.run = { gaps: LEVEL.run.gaps.map(g => Object.assign({}, g, { state: 'whole', t: 0 })), slab: { state: 'up', t: 0, y: 16 } };
    this.mode = 'house'; this.fading = false; this.stay = 0;
    // the scene object is reused on a restart: every one-shot flag starts over here
    this.broDead = false; this.carded = false; this.went = false; this.breakCard = false; this.breakDone = false; this.rerun = false; this.photo = null; this.coughT = 0;
    this.box = { t: 0 }; // the music box: seconds left playing
    this.gl = new Glasses({ has: true, on: true, cracked: true });
    this.skipPoints = [12 * TILE + 20, 20 * TILE, 34 * TILE + 8, 56 * TILE + 8];
    const SD = LEVEL.sideDoor, bx = LEVEL.bag.x, MB = LEVEL.musicBox;
    this.bagThing = { x0: bx - 12, x1: bx + 14, y0: 140, y1: GROUND, label: 'J', use: () => {} };
    this.boxThing = { x0: MB.x - 10, x1: MB.x + 14, y0: 118, y1: GROUND, px: MB.x + 4, py: MB.y - 8, label: 'J', use: () => this.windBox() };
    this.things.push({ x0: SD.x, x1: SD.x + SD.w, y0: SD.y, y1: GROUND, label: 'J', door: true, use: () => this.enterRoom('wardrobe') }, this.bagThing, this.boxThing);
    // things to look at in the dark (not once the floor starts to go)
    const N = NOTICE.bedroom, look = (x0, x1, py, lines, y0, clue) => this.addLook({ x0, x1, y0: y0 != null ? y0 : 112, py, lines, clue });
    look(94, 148, 126, N.piano); look(238, 280, 130, N.table); look(556, 580, 50, N.clock, 100); look(626, 694, 130, N.silver); look(754, 822, 132, N.billiards);
    const PH = LEVEL.photos, HW = LEVEL.hallWindow, RQ = LEVEL.request;
    look(PH.x - 2, PH.x + PH.span + 2, PH.y - 4, N.photos, 96);
    look(HW.x - 4, HW.x + HW.w + 4, HW.y + HW.h + 2, N.window, 100);
    look(RQ.x - 8, RQ.x + 20, RQ.y - 2, N.request, 96, 'request4');
    // the show's tape marks (checkpoints): under the dining table, under the long table, by the
    // bag. A death in the run goes back to the bag, and the floor is whole again.
    this.tape = new Marks(this, LEVEL.marks.map(x => ({ x, y: GROUND })));
    this.gold = new Gold(this, LEVEL.gold.map(([x, y]) => ({ x, y })));
    this.drawBodies();
    this.spawn(); this.kid.face = 1;
    this.view = { x: 0 }; this.updateView(1);
    const fromCut = !!data.fromCut;
    this.cameras.main.fadeIn(fromCut ? 1200 : 400);
    this.beds = { hum: Sound.hum(0.012), wind: Sound.wind(0.02), breath: Sound.breath(0.0001) };
    Music.play('dark', { fadeIn: 2.5 });
    this.events.once('shutdown', () => { Object.values(this.beds).forEach(b => b.stop(0.4)); overlay.clearCaption(); });
    this.onWake = () => { this.updateView(1); this.beds.hum.set(0.012, 0.5); this.beds.wind.set(0.02, 0.5); };
    // back from the break: the same scene, from the kneel, with nothing left to say
    if (data.rerun) { this.rerun = true; this.bag.have = true; this.goInside(true); }
    else {
      this.takeNote({ fromCut }, 4, 'The Bedroom');
      this.time.delayedCall(fromCut ? 4300 : 500, () => { if (this.mode === 'house' && !this.dead) this.itemPanel('dark'); });
    }
    window.__game = { scene: this, state };
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (this.mode === 'house') { if (this.commonKeys()) { c.endFrame(); return; } }
    else { c.restart(); c.look(); reviewKeys(this); if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000); }
    if (this.mode === 'house') {
      if (!this.dead && !this.leaving) {
        const k = this.kid, wasGround = k.onGround, vy = k.vy;
        this.moveKid(dt); this.updateThings(); this.tape.update(dt); this.gold.update(dt);
        if (k.onGround && !wasGround && vy > 150) this.step(true);
        this.footsteps(dt); this.updateBag(dt);
        if (c.glasses()) this.gl.toggle();
        if (k.y + k.h > 176) { if (window.__noDeath) this.rescue(); else this.die({ id: 'the fall', direct: true, footY: GROUND }); }
      } else if (this.dead && this.girl.visible) this.settle(dt);
      this.gl.update(dt);
      this.updateClock(dt); this.updateBox(dt); this.updateCams(dt); this.updateCollapse(dt); this.updateRun(dt);
    } else this.updateBedroom(dt);
    this.updateView(dt);
    this.updateAmbience();
    this.draw(dt);
    this.hint();
    c.endFrame();
  }

  lookable() { return this.mode === 'house' && !this.bag.have; }
  // The heavy bag (research/features_nov17.md item 12): carrying his bag out, she has no double
  // jump and half her steering in the air. Every jump in the run is a committed one.
  heavy() { return this.mode === 'house' && this.bag.have; }
  moveKid(dt) {
    const heavy = this.heavy(); this.noDoubleJump = heavy;
    if (!heavy) return super.moveKid(dt);
    const air = K.accA; K.accA = air / 2;
    try { super.moveKid(dt); } finally { K.accA = air; }
  }
  // review: N moves her section by section; at the stairs it pulls the bag; after the bag, the
  // doors; in the bedroom it moves the scene on
  canRestart() { return this.mode === 'house' && super.canRestart(); }
  skipAhead() {
    if (this.mode === 'house') {
      if (this.leaving || this.dead) return;
      if (!this.bag.have) { const x = this.skipPoints.find(p => p > this.kid.x + 12); if (x != null) return this.placeAt(x); this.placeAt(LEVEL.bag.x - 6); return this.pullBag(); }
      // at the doors already: the next N carries her in
      if (this.atDoor() && this.kid.onGround) return this.enterDoor();
      return this.placeAt(85 * TILE + 6);
    }
    if (this.mode === 'bedroom') { this.kid.x = LEVEL.brother.kneel; return; }
    // presenting: N never cuts his scene short (a stray press in class would lose it)
    if ((this.mode === 'talk' || this.mode === 'dying') && presenting()) return;
    if (this.mode === 'talk') { this.talkI = BEDROOM.length - 1; return this.nextLine(); }
    if (this.mode === 'dying') { this.dyingT = Math.max(this.dyingT, 5.5); return; }
    if (this.mode === 'after') this.openVoid();
  }
  // the climb before the doors: the floor is solid there, so her own respawn spot finder must not
  // pick the top of the heap
  placeAt(x) { super.placeAt(x); const k = this.kid; if (k.y + k.h < GROUND - 1 && x > 79 * TILE && x < 85 * TILE) { k.x = 85 * TILE + 6; k.y = GROUND - k.h; } }

  // ------------------------------------------------------------------ the view
  // Followed by hand so the dark layer and the world move together, frame for frame.
  updateView(dt) {
    const S = display.S, cam = this.cameras.main;
    if (this.mode === 'house') {
      const k = this.kid, want = Math.max(0, Math.min(87 * TILE + TILE - 320, k.x + k.w / 2 + 18 - 160));
      if (!this.dead) this.view.x += (want - this.view.x) * Math.min(1, dt * 9);
    } else this.view.x = BX;
    const vx = Math.round(this.view.x);
    cam.scrollX = vx - 160 * (S - 1); cam.scrollY = -90 * (S - 1);
  }
  onRescale() { super.onRescale(); this.updateView(0); }

  // ------------------------------------------------------------------ the cameras
  // the next flash on this camera's own beat, at least `gap` seconds away
  resync(cm, gap) { const t = this.clock + (gap == null ? 0.9 : gap); cm.next = cm.phase + Math.ceil((t - cm.phase) / cm.period) * cm.period; }
  updateCams(dt) {
    const k = this.kid, t = this.clock;
    this.cams.forEach(cm => {
      const s = cm.snap;
      if (s) { s.t += dt; if (s.t >= s.end) { cm.snap = null; this.resync(cm); } }
      const want = cm.snap ? cm.snap.aim : cm.aim;
      cm.angle += (want - cm.angle) * Math.min(1, dt * (cm.snap ? 16 : 2.5));
      const near = Math.abs(cm.x - k.x) < 380;
      cm.cone = near || cm.flash > 0 ? this.cone(cm.x, cm.y, cm.angle, cm.half, cm.range) : null;
      const until = cm.snap ? (cm.snap.fired ? Infinity : cm.snap.fireAt - cm.snap.t) : cm.next - t;
      cm.warn = until <= LEVEL.lead;
      if (until <= LEVEL.lead && cm.clicks === 0) { cm.clicks = 1; this.camSound(cm, 'click'); }
      if (until <= LEVEL.lead / 2 && cm.clicks === 1) { cm.clicks = 2; this.camSound(cm, 'click'); }
      if (until <= 0) this.fire(cm);
      cm.flash = Math.max(0, cm.flash - dt / 0.5);
      if (cm.caught && !this.dead) { cm.lock = Math.min(LEVEL.caught, cm.lock + dt); if (cm.lock >= LEVEL.caught) this.die(cm); }
    });
  }
  fire(cm) {
    cm.flash = 1; cm.clicks = 0; cm.lit = fx.allowFlash() ? 1 : 0.15; // three flashes a second at most
    if (cm.snap) cm.snap.fired = true; else cm.next += cm.period;
    this.camSound(cm, 'shutter');
    if (!cm.cone) cm.cone = this.cone(cm.x, cm.y, cm.angle, cm.half, cm.range);
    if (this.mode === 'house' && !this.dead && !this.leaving && !window.__noDeath && this.probes().some(p => inPoly(cm.cone, p.x, p.y))) {
      cm.caught = true; cm.lock = 0.0001; Sound.charge();
      const k = this.kid; this.photo = { x: k.x + k.w / 2, y: k.y + k.h / 2, t: 0 };
    }
  }
  camSound(cm, kind) {
    const d = Math.abs(cm.x - this.kid.x), v = Math.max(0, 1 - d / 420);
    if (v <= 0) return;
    if (kind === 'click') Sound.click(0.016 * v); else Sound.shutter(0.07 * v);
  }
  // a noise turns every camera in earshot toward it; it flashes a moment later
  noiseAt(x, y) {
    if (this.masked()) { this.noises.push({ x, y, t: 0, masked: true }); return; }
    this.noises.push({ x, y, t: 0, masked: false });
    this.cams.forEach(cm => {
      if (cm.snap || cm.caught || Math.abs(cm.x - x) > LEVEL.hear) return;
      let a = Math.atan2(y - 6 - cm.y, x - cm.x) * 180 / Math.PI; if (a < 0) a += 360;
      const [lo, hi] = ARC[cm.kind]; a = Math.max(lo, Math.min(hi, a));
      cm.snap = { aim: a, t: 0, fireAt: 0.62, end: 1.6, fired: false }; cm.clicks = 0;
    });
  }

  // ------------------------------------------------------------------ her feet
  footsteps(dt) {
    const k = this.kid;
    if (k.onGround && Math.abs(k.vx) > 50 && !k.crouch) { this.stepT = (this.stepT || 0) - dt; if (this.stepT <= 0) { this.stepT = 0.26; this.step(false); } }
    else this.stepT = 0.04;
  }
  step(landing) {
    const k = this.kid, cx = k.x + k.w / 2, f = LEVEL.noisy.find(n => cx >= n.x0 && cx < n.x1);
    if (landing && this.heavy()) Sound.tone(70, 0.14, 'triangle', 0.035, 45); // the bag lands with her
    if (!f || k.y + k.h < GROUND - 1) { if (landing) Sound.noise(0.05, 0.02, 600); return; } // on furniture, the floor is not under her
    if (f.kind === 'boards') { Sound.tone(150 + Math.random() * 40, 0.16, 'sawtooth', 0.018, 90); Sound.noise(0.08, 0.03, 900); }
    else { Sound.noise(0.09, 0.07, 7000); Sound.tone(3600 + Math.random() * 900, 0.04, 'triangle', 0.01); }
    this.noiseAt(cx, k.y + k.h);
  }

  // ------------------------------------------------------------------ the clock and the music box
  updateClock() {
    const C = LEVEL.clock, cyc = Math.floor(this.clock / C.period), u = this.clock - cyc * C.period;
    C.strokes.forEach((s, i) => { const id = cyc * 10 + i; if (u >= s && !this.struck.has(id)) { this.struck.add(id); this.strike(); } });
    const tk = Math.floor(this.clock * 2), d = Math.abs(C.x - this.kid.x);
    if (tk !== this.lastTick) { this.lastTick = tk; if (d < 420) Sound.tone(tk % 2 ? 1900 : 1500, 0.02, 'square', 0.007 * (1 - d / 420)); }
  }
  masked() { const C = LEVEL.clock; return this.clock % C.period < C.mask || this.box.t > 0; }
  strike() { const d = Math.abs(LEVEL.clock.x - this.kid.x); Sound.bell(0.075 * Math.max(0.2, 1 - d / 700)); this.rings.push({ t: 0 }); }
  windBox() {
    if (this.box.t > 0 || this.bag.have) return;
    this.box.t = LEVEL.musicBox.mask; this.box.note = 0;
    Sound.tone(900, 0.05, 'square', 0.01); // the key turns
    overlay.sfx('[A MUSIC BOX PLAYS]', 1800, 'bd:musicbox'); // once ever (heard when shown)
  }
  updateBox(dt) {
    const B = this.box; if (B.t <= 0) return;
    const before = B.t; B.t = Math.max(0, B.t - dt);
    // a small tune of its own, a note every 0.25 s, fainter the further she is from it
    const tune = [784, 659, 587, 659, 523, 587, 659, 784, 880, 784, 659, 523];
    const n = Math.floor((LEVEL.musicBox.mask - B.t) / 0.25), d = Math.abs(LEVEL.musicBox.x - this.kid.x);
    if (n !== B.note && n < tune.length) { B.note = n; Sound.tone(tune[n], 0.22, 'triangle', 0.02 * Math.max(0.25, 1 - d / 400)); }
    if (before > 0 && B.t === 0) Sound.tone(392, 0.12, 'triangle', 0.01);
  }

  // ------------------------------------------------------------------ his bag
  // Hold J: at the end of the pull the bag comes free. Keep holding (the full pull) and she finds
  // his note in it. The floor goes when she lets go, or when the note is read.
  updateBag(dt) {
    const B = this.bag;
    if (B.have) {
      if (this.collapse || B.letGo) return;
      if (B.read) {
        // the floor waits for his line: it goes once the note has been read out (or put away),
        // so the collapse's caption never cuts it off
        B.wait += dt;
        if (B.wait > 0.4 && (!this.bubbles.busy('item') || B.wait > 7)) this.bringDown();
        return;
      }
      if (this.ctl.useHeld()) {
        B.note += dt / 1.1;
        if (B.note >= 1) { B.read = true; B.wait = 0; this.readNote(); }
      } else { B.letGo = true; this.time.delayedCall(250, () => this.bringDown()); }
      return;
    }
    if (this.nearThing === this.bagThing && this.ctl.useHeld()) {
      B.hold += dt / 1.2;
      if (Math.random() < dt * 5) Sound.noise(0.07, 0.02, 900);
      if (B.hold >= 1) this.pullBag(true);
    } else B.hold = Math.max(0, B.hold - dt * 2);
  }
  pullBag(held) {
    const B = this.bag; B.have = true; B.hold = 0; this.bagThing.off = true;
    Sound.tone(150, 0.2, 'triangle', 0.04, 90); Sound.noise(0.3, 0.06, 700);
    this.say('His bag. Still heavy.', 'bd:bag'); // said once, not on every take (heard once it is out)
    fx.shake(this.cameras.main, 160, 0.004); Sound.tone(70, 0.6, 'sawtooth', 0.03, 50); // the beam above shifts
    if (!held) { B.letGo = true; this.time.delayedCall(800, () => this.bringDown()); }
  }
  readNote() {
    if (state.clue('bagNote')) overlay.note('CLUE NOTED (' + state.clueCount() + ')', 1600);
    this.bubbles.look('item', { lines: NOTICE.bedroom.bagNote }, () => ({ x: LEVEL.bag.x + 2, y: GROUND - 14 }));
    Sound.tone(520, 0.3, 'sine', 0.015);
  }
  bringDown() {
    if (this.dead || this.collapse || this.mode !== 'house') return;
    // the beam shifts, the stairs slump, and the floor behind her starts to go
    this.props = this.props.filter(r => r !== this.wallProp); this.props.push(this.lowProp);
    fx.shake(this.cameras.main, 450, 0.012); Sound.noise(0.9, 0.22, 1500); Sound.tone(70, 1.2, 'sawtooth', 0.05, 40);
    for (let i = 0; i < 24; i++) this.debris.emitParticleAt(LEVEL.bag.wall.x + Math.random() * 30, 100 + Math.random() * 50, 1);
    this.collapse = { x: LEVEL.collapse.from, t: 0, done: false };
    this.beds.rumble = Sound.rumble(0.26); this.runNote = 1.6; overlay.sfx('[THE FLOOR GIVES WAY]', 2000);
    Music.play('run', { fade: 0.2, fadeIn: 0.15 });
  }

  // ------------------------------------------------------------------ the floor going
  updateCollapse(dt) {
    const C = this.collapse; if (!C || C.done) return;
    C.t += dt;
    const sp = C.t < 0.8 ? 44 : 52 + Math.min(8, (C.t - 0.8) * 1.5);
    C.x = Math.min(LEVEL.collapse.stop, C.x + sp * dt);
    const m = this.map.m;
    for (let tx = LEVEL.collapse.fromTile; tx <= LEVEL.collapse.lastTile; tx++) {
      if (tx * TILE + 8 <= C.x && m[10][tx]) { m[10][tx] = 0; m[11][tx] = 0; m[0][tx] = 0; this.chunk(tx); }
    }
    this.props = this.props.filter(r => !(r.falls && r.x + r.w <= C.x));
    this.bodyLayer.list.forEach(b => { if (b.x > LEVEL.collapse.from && b.x < C.x) b.setVisible(false); });
    if (Math.random() < dt * 24) this.dust.emitParticleAt(C.x - Math.random() * 10, GROUND - Math.random() * 4, 1);
    if (C.x >= LEVEL.collapse.stop) { C.done = true; if (this.beds.rumble) this.beds.rumble.set(0.0001, 1.5); Sound.noise(0.6, 0.08, 800); Music.play('dark', { fade: 2.5, fadeIn: 3 }); }
  }
  chunk(tx) {
    for (let i = 0; i < 6; i++) this.debris.emitParticleAt(tx * TILE + Math.random() * 16, GROUND + Math.random() * 3, 1);
    for (let i = 0; i < 3; i++) this.debris.emitParticleAt(tx * TILE + Math.random() * 16, 14, 1);
    if (Math.abs(tx * TILE - this.kid.x) < 200) { Sound.noise(0.18, 0.05, 900); fx.shake(this.cameras.main, 90, 0.004); }
  }
  updateRun(dt) {
    if (!this.collapse || this.dead) return;
    const k = this.kid, R = this.run, m = this.map.m;
    R.gaps.forEach(g => {
      if (g.state === 'whole' && k.x + k.w > g.at) { g.state = 'crack'; g.t = 0; Sound.noise(0.3, 0.1, 2500); Sound.tone(240, 0.35, 'sawtooth', 0.02, 110); }
      else if (g.state === 'crack') {
        g.t += dt;
        if (g.t >= 0.42) { g.state = 'open'; for (let tx = g.t0; tx <= g.t1; tx++) { m[10][tx] = 0; m[11][tx] = 0; m[0][tx] = 0; this.chunk(tx); } Sound.noise(0.5, 0.15, 1200); fx.shake(this.cameras.main, 160, 0.007); }
      }
    });
    const S = R.slab, L = LEVEL.run.slab;
    if (S.state === 'up' && k.x + k.w > L.at) { S.state = 'warn'; S.t = 0; Sound.tone(110, 0.5, 'sawtooth', 0.03, 80); Sound.noise(0.4, 0.05, 1200); }
    else if (S.state === 'warn') {
      S.t += dt; if (Math.random() < dt * 30) this.dust.emitParticleAt(L.x + Math.random() * L.w, 18, 1);
      if (S.t >= L.warn) { S.state = 'fall'; S.t = 0; }
    } else if (S.state === 'fall') {
      S.t += dt; S.y = 16 + Math.min(1, S.t / 0.16) * (L.top - 16);
      if (S.t >= 0.16) {
        S.state = 'down'; S.y = L.top; this.props.push(this.slabProp);
        Sound.noise(0.6, 0.2, 1500); fx.shake(this.cameras.main, 220, 0.012);
        for (let i = 0; i < 14; i++) this.debris.emitParticleAt(L.x + Math.random() * L.w, L.bottom, 1);
        const r = this.slabProp;
        // the house falling on her costs HP, like the chandelier in the gallery (what watches her
        // takes lives); she is thrown back out from under it, hurt or not, never left inside it
        if (!this.dead && k.x < r.x + r.w && k.x + k.w > r.x && k.y < r.y + r.h && k.y + k.h > r.y) {
          this.hurt(2, 'the ceiling');
          if (!this.dead) pushClear(this, r, k.x + k.w / 2 < r.x + r.w / 2 ? -1 : 1);
        }
      }
    }
  }

  // ------------------------------------------------------------------ the bedroom
  enterDoor() {
    if (this.leaving || this.mode !== 'house' || this.dead) return;
    this.leaving = true;
    Sound.tone(220, 0.3, 'triangle', 0.03, 180); Sound.noise(0.4, 0.05, 900);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => this.goInside(false));
  }
  goInside(rerun) {
    this.mode = 'bedroom'; this.leaving = false;
    const k = this.kid; k.x = rerun ? LEVEL.brother.kneel - k.w / 2 : BX + 26; k.y = GROUND - K.hStand; k.h = K.hStand; k.crouch = false; k.vx = 0; k.vy = 0; k.face = 1; k.onGround = true;
    this.cams.forEach(cm => { cm.caught = false; cm.lock = 0; });
    if (this.beds.rumble) this.beds.rumble.set(0.0001, 0.4);
    this.beds.breath.set(0.08, 1.5);
    Music.play('bedroom', { fade: 1, fadeIn: 4 });
    this.updateView(0);
    // inside, the room is drawn flat in the dark (drawNight); she, he and her bag stand over it
    this.girl.setDepth(6.5); this.bro.setDepth(6.45); this.eyeG.setDepth(6.55);
    this.cameras.main.fadeIn(rerun ? 600 : 1100);
    overlay.hint('');
  }
  updateBedroom(dt) {
    const k = this.kid, c = this.ctl;
    if (this.mode === 'bedroom' || this.mode === 'after') { this.moveKid(dt); this.updateThings(); }
    // reaching him in the air, she lands first, then kneels: nobody freezes mid jump
    if (this.mode === 'bedroom' && k.x + k.w / 2 >= LEVEL.brother.kneel) this.mode = 'arrive';
    if (this.mode === 'arrive') { this.settle(dt); if (k.onGround) this.startTalk(); }
    // the talk: J, Enter, Space or a click finish a line, then move on (ui/typer.js takes the keys);
    // left alone, each line moves on by itself after its old time
    if (this.mode === 'talk' && !typer.waiting()) { this.talkT -= dt; if (this.talkT <= 0) this.nextLine(); }
    if (this.mode === 'dying') {
      this.dyingT += dt;
      if (this.dyingT > 3.4 && !this.broDead) { this.broDead = true; this.bro.setTexture('bro_dead'); Sound.tone(98, 1.8, 'sine', 0.02); }
      if (this.dyingT > 5.6) {
        this.mode = 'after';
        const V = LEVEL.voidDoor, B = LEVEL.brother;
        this.voidThing = { x0: V.x - 4, x1: V.x + V.w + 4, y0: V.y, y1: GROUND, label: 'W', door: true, use: () => this.openVoid() }; // a door: W, like every door
        this.broThing = { x0: B.x - 14, x1: B.x + 20, y0: 130, y1: GROUND, px: B.x + 14, py: GROUND - 24, label: 'J', use: () => this.holdOn() };
        this.things = [this.voidThing, this.broThing];
      }
    }
    if (this.mode === 'after') this.updateStay(dt);
    if (this.mode === 'void') this.updateVoid(dt);
    if (this.mode === 'break') this.updateBreak(dt);
  }
  startTalk() {
    const k = this.kid;
    this.mode = 'talk'; k.vx = 0; k.face = 1;
    k.x = LEVEL.brother.kneel - k.w / 2; if (!k.crouch) { k.y += K.hStand - K.hCrouch; k.h = K.hCrouch; k.crouch = true; }
    this.talkI = -1; this.nextLine();
  }
  nextLine() {
    this.talkI++;
    // after the break the scene runs again with nothing said: he just goes
    if (this.rerun) this.talkI = BEDROOM.length;
    if (this.talkI >= BEDROOM.length) return this.endTalk();
    const l = BEDROOM[this.talkI], i = this.talkI;
    this.talkT = typer.total(l.text, lineSeconds(l.text) + (l.who ? 0.4 : 0.8));
    overlay.caption(l.who, l.text, { block: true, scene: this, onAdvance: () => { if (this.mode === 'talk' && this.talkI === i) this.nextLine(); } });
    if (/COUGH/.test(l.text)) { this.coughT = 1.3; Sound.noise(0.2, 0.05, 1100); this.time.delayedCall(380, () => Sound.noise(0.25, 0.06, 900)); }
  }
  endTalk() {
    overlay.clearCaption();
    this.mode = 'dying'; this.dyingT = 0; Music.stop(5);
    this.beds.breath.slow(1.7); this.beds.breath.set(0.0001, 3.2);
  }
  // holding on to him: a tap says so once; held, the red lights close in, and at 15 s the show
  // cuts to a break (a false ending), then runs the scene again from the kneel
  holdOn() {
    // said once: heard once it is out, so a tap that cuts it short says it again next time
    if (!this.holdSrc) this.holdSrc = { lines: NOTICE.bedroom.hold, key: 'bd:holdon' };
    if (!state.heard('bd:holdon')) this.bubbles.look('item', this.holdSrc, () => ({ x: LEVEL.brother.x + 12, y: GROUND - 22 }));
  }
  updateStay(dt) {
    const held = this.nearThing === this.broThing && this.ctl.useHeld();
    this.stay = held ? this.stay + dt : Math.max(0, this.stay - dt * 3);
    if (held && Math.floor(this.stay) !== Math.floor(this.stay - dt)) Sound.tone(110 - Math.floor(this.stay) * 3, 0.25, 'sine', 0.012 + this.stay * 0.002);
    if (this.stay >= STAY) this.rightBack();
  }
  rightBack() {
    this.mode = 'break'; this.breakT = 0; this.stay = STAY;
    state.sawEnding('rightBack');
    this.beds.breath.set(0.0001, 0.2); Music.stop(0.2);
    Sound.tone(1000, 0.9, 'sine', 0.03); // the tone of a show going to a break
  }
  updateBreak(dt) {
    this.breakT += dt;
    if (this.breakT > 0.5 && !this.breakCard) { this.breakCard = true; this.cameras.main.fadeOut(10, 0, 0, 0); overlay.card('CH 07', "WE'LL BE RIGHT BACK.", 3000); }
    if (this.breakT > 4.0 && !this.breakDone) { this.breakDone = true; this.scene.restart({ rerun: true }); }
  }
  openVoid() {
    if (this.mode !== 'after') return;
    this.mode = 'void'; this.voidT = 0; this.voidThing.off = true; this.stay = 0;
    Sound.swell(4.5, 0.07); Sound.tone(55, 3.2, 'sine', 0.06, 38);
    state.finish(this.epId);
  }
  updateVoid(dt) {
    this.voidT += dt;
    const k = this.kid, V = LEVEL.voidDoor, target = V.x + V.w / 2 - k.w / 2;
    if (this.voidT < 1.2) { for (let i = 0; i < 2; i++) if (Math.random() < dt * 40) this.motes.emitParticleAt(V.x + 2 + Math.random() * (V.w - 4), V.y + 4 + Math.random() * (V.h - 6), 1); }
    if (this.voidT > 1.1 && this.voidT < 2.9) {
      if (k.crouch) { k.y -= K.hStand - K.hCrouch; k.h = K.hStand; k.crouch = false; }
      const d = target - k.x; k.x += Math.sign(d) * Math.min(Math.abs(d), 26 * dt); k.face = d < 0 ? -1 : 1; k.walkT = Math.abs(d) > 0.5 ? k.walkT + dt : 0;
    }
    if (this.voidT > 2.4) this.girl.setVisible(Math.floor(this.voidT * 8) % 2 === 0 && this.voidT < 3.3); // she blinks out, no fade
    if (this.voidT > 3.0 && !this.fading) { this.fading = true; this.cameras.main.fadeOut(1500, 0, 0, 0); this.beds.hum.set(0.0001, 1.2); this.beds.wind.set(0.0001, 1.2); }
    if (this.voidT > 4.7 && !this.carded) { this.carded = true; overlay.card('END OF EPISODE 4', 'Take ' + this.ep.take, 3400); overlay.bug('CH 07', 1400); }
    if (this.voidT > 8.4 && !this.went) { this.went = true; goNext(this, 'ep4'); }
  }

  // ------------------------------------------------------------------ sound beds
  updateAmbience() {
    if (this.mode !== 'house' || this.dead) return;
    const near = Math.max(0, 1 - (LEVEL.brother.x - this.kid.x) / 1300);
    this.beds.breath.set(0.0001 + 0.06 * near * near, 0.4);
  }

  // once: a key; said until it has been shown in full once
  say(text, once) {
    this.bubbles.say('sis', text, () => ({ x: this.kid.x + this.kid.w / 2, y: this.kid.y - 2 }), { ink: 0xebe6d8, pitch: 760, once });
  }

  // ------------------------------------------------------------------ drawing
  draw(dt) {
    const P = this.P, t = this.clock, vx = Math.round(this.view.x);
    this.drawGirl();
    if (this.mode === 'void' && this.voidT > 2.4) this.girl.setVisible(Math.floor(this.voidT * 8) % 2 === 0 && this.voidT < 3.3);
    this.drawWorld(); this.drawProps(); this.drawCams();
    // her bag on her back, and a glint off the cracked glasses
    const eg = this.eyeG; eg.clear();
    if (this.girl.visible && !this.dead) {
      const k = this.kid, cx = Math.round(k.x + k.w / 2), top = Math.round(k.y + k.h) - (k.crouch ? 9 : 14);
      if (this.bag.have) { const bx = k.face > 0 ? cx - 5 : cx + 2; eg.fillStyle(hexNum(P.crack), 1); eg.fillRect(bx - 1, top + 4, 5, 7); eg.fillStyle(hexNum(P.sibLo), 1); eg.fillRect(bx, top + 5, 3, 5); eg.fillStyle(hexNum(P.sib), 1); eg.fillRect(bx, top + 5, 3, 1); }
      if (Math.floor(t * 3) % 4 === 0) { eg.fillStyle(hexNum(P.overlay), 1); eg.fillRect(cx + (k.face < 0 ? -3 : 1), top + (k.crouch ? 1 : 2), 2, 1); }
    }
    // the light: hard holes in solid dark (a lit middle, a checker rim; a weak light is only the
    // checker), flat shapes for windows and broken ceilings, and red where a flash lands
    const lights = this.lights = [], reds = [];
    const k = this.kid, quad = (x0, x1, y0, x2, x3, y1) => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x3, y: y1 }, { x: x2, y: y1 }];
    if (this.mode === 'house' && !this.dead && this.girl.visible) lights.push({ x: k.x + k.w / 2, y: k.y + 6, r: presenting() ? 45 : 30 });
    if (this.mode === 'house') {
      this.cams.forEach(cm => {
        lights.push({ x: cm.x, y: cm.y, r: 6, a: cm.warn ? 1 : 0.5 });
        if (cm.flash > 0 && cm.cone) {
          const fl = cm.flash * fx.level * (cm.lit == null ? 1 : cm.lit); // reduced flashing: a dimmer flash
          if (fl > 0.25) { lights.push({ poly: cm.cone }); reds.push({ poly: cm.cone, dense: fl > 0.6 }); }
        }
      });
      const C = LEVEL.clock, striking = this.clock % C.period < C.mask;
      lights.push({ x: C.x, y: 76, r: striking ? 26 : 14 });
      if (this.box.t > 0) lights.push({ x: LEVEL.musicBox.x + 4, y: LEVEL.musicBox.y - 6, r: 12 });
      // the picture lamp over the family photos: a flat wedge down the wall
      const PH = LEVEL.photos; lights.push({ poly: quad(PH.x - 2, PH.x + PH.span + 2, PH.y - 7, PH.x - 8, PH.x + PH.span + 8, PH.y + 30) });
      // the hall window: the window itself, lit, and a checker of moonlight on the floor
      const HW = LEVEL.hallWindow;
      lights.push({ poly: quad(HW.x - 3, HW.x + HW.w + 3, HW.y - 3, HW.x - 3, HW.x + HW.w + 3, HW.y + HW.h + 3) });
      lights.push({ poly: quad(HW.x, HW.x + HW.w, HW.y + HW.h, HW.x + 10, HW.x + HW.w + 26, GROUND), dither: true });
      if (this.collapse) {
        // the ceiling goes with the floor: night sky over the gone part, a checker of it below
        const x0 = LEVEL.collapse.from, x1 = this.collapse.x;
        if (x1 - x0 > 8) lights.push({ poly: quad(x0, x1, 0, x0 + 10, x1 + 30, GROUND), dither: true });
      }
      // where the ceiling came down with the floor or the slab: a flat shaft of moonlight
      const holes = this.run.gaps.filter(q => q.state === 'open').map(q => ({ x: q.t0 * TILE, w: (q.t1 - q.t0 + 1) * TILE }));
      if (this.run.slab.state === 'down' || this.run.slab.state === 'fall') holes.push({ x: LEVEL.run.slab.x, w: LEVEL.run.slab.w });
      holes.forEach(h => lights.push({ poly: quad(h.x, h.x + h.w, 0, h.x - 4, h.x + h.w + 10, GROUND) }));
      // light through the broken ceiling over the climb, so the walls she jumps between show
      if (this.collapse) { const x0 = (LEVEL.run.hang.tx + 1) * TILE, x1 = LEVEL.run.heap.tx * TILE; lights.push({ poly: quad(x0 - 6, x1 + 6, 0, x0 - 12, x1 + 12, GROUND) }); }
      // the line of cold light under the bedroom doors
      const D = LEVEL.door; lights.push({ x: D.x + D.w / 2, y: GROUND - 2, r: 14, a: Math.floor(t * 1.5) % 3 ? 0.5 : 1 });
    }
    this.drawDark(vx, reds);
    this.drawOver(dt);
    // tape marks and gold show only in her own light
    if (this.mode === 'house') { const kc = this.kid.x + this.kid.w / 2, ky = this.kid.y + 6, near = (x, y) => Math.abs(x - kc) < 26 && Math.abs(y - ky) < 28; this.tape.draw(this.overG, near); this.gold.draw(this.overG, near); }
    this.drawLocks(this.cams, LEVEL.caught);
    this.drawThings();
    this.drawHud(dt);
  }

  drawDark(vx, reds) {
    const ctx = this.darkCanvas.getContext('2d');
    darkFill(ctx);
    const toC = p => ({ x: p.x - vx + 1, y: p.y + 1 });
    if (this.mode !== 'house') { ctx.clearRect(0, 0, 322, 182); ctx.drawImage(this.nightRoom(), 0, 0); this.darkTex.refresh(); this.darkImg.setPosition(vx - 1, -1); return; }
    this.houseEdges(ctx, vx);
    hardHoles(ctx, this.lights.filter(l => !l.poly).map(l => Object.assign(toC(l), { r: l.r, a: l.a })), vx);
    // shapes of light (a flash's cone, a window, moonlight through a hole): row by row, lit or checker
    ctx.globalCompositeOperation = 'destination-out';
    this.lights.filter(l => l.poly).forEach(l => {
      ctx.fillStyle = l.dither ? checker(ctx, vx) : '#000';
      spans(l.poly.map(toC), (x, y, w) => ctx.fillRect(x, y, w, 1));
    });
    ctx.globalCompositeOperation = 'source-over';
    // the flash itself: everything in the cone, her too, picked out in red pixels
    (reds || []).forEach(r => { ctx.fillStyle = redPattern(ctx, r.dense, vx); spans(r.poly.map(toC), (x, y, w) => ctx.fillRect(x, y, w, 1)); });
    this.darkTex.refresh();
    this.darkImg.setPosition(vx - 1, -1);
  }

  // The house in the dark: the shape of the rooms in one or two greys outside her light, so a
  // projector still shows where the floor, the furniture and the walls are. Presenting, the
  // dark itself is ash1, not black.
  houseEdges(ctx, vx) {
    const m = this.map.m, x0 = Math.floor(vx / TILE), put = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x - vx + 1), Math.round(y + 1), Math.round(w), Math.round(h)); };
    if (presenting()) put(vx - 1, -1, 322, 182, ASH.ash1);
    // the floor line and the ceiling line, where they are still there
    for (let tx = x0; tx <= x0 + 21 && tx < LEVEL.w; tx++) {
      if (m[10][tx]) put(tx * TILE, GROUND, TILE, 1, ASH.ash3);
      if (m[0][tx]) put(tx * TILE, 16, TILE, 1, ASH.ash2);
      // walls and fallen ceiling inside the house: a light top, darker sides
      for (let ty = 1; ty <= 9; ty++) {
        if (!m[ty][tx]) continue;
        const x = tx * TILE, y = ty * TILE;
        if (!m[ty - 1][tx]) put(x, y, TILE, 1, ASH.ash3);
        if (tx > 0 && !m[ty][tx - 1]) put(x, y, 1, TILE, ASH.ash2);
        if (tx < LEVEL.w - 1 && !m[ty][tx + 1]) put(x + TILE - 1, y, 1, TILE, ASH.ash2);
        if (!m[ty + 1][tx]) put(x, y + TILE - 1, TILE, 1, ASH.ash2);
      }
    }
    // furniture and rubble: a light top edge; the tall ones get their sides too
    this.props.forEach(r => {
      if (r.x + r.w < vx - 2 || r.x > vx + 322) return;
      put(r.x, r.y, r.w, 1, ASH.ash3);
      if (r.h > 12) { put(r.x, r.y, 1, r.h, ASH.ash2); put(r.x + r.w - 1, r.y, 1, r.h, ASH.ash2); }
    });
    // doors, the clock and the hall window: an outline
    const box = (x, y, w, h, c) => { put(x, y, w, 1, c); put(x, y + h - 1, w, 1, c); put(x, y, 1, h, c); put(x + w - 1, y, 1, h, c); };
    const D = LEVEL.door, SD = LEVEL.sideDoor, C = LEVEL.clock, HW = LEVEL.hallWindow;
    box(D.x - 5, D.y - 8, D.w + 10, D.h + 8, ASH.ash3); box(SD.x - 2, SD.y - 2, SD.w + 4, SD.h + 2, ASH.ash2);
    box(C.x - 10, 52, 20, GROUND - 52, ASH.ash2); box(HW.x - 3, HW.y - 3, HW.w + 6, HW.h + 6, ASH.ash2);
  }

  // The bedroom at night, drawn flat on the dark layer (no circles of light, no dither): grey
  // walls, a solid shaft of moonlight from the window onto the floor where he sits, the bed in
  // greys with dark outlines, the window and the mismatched door shown as they are. Built once.
  nightRoom() {
    if (this.nightC) return this.nightC;
    const c = this.nightC = document.createElement('canvas'); c.width = 322; c.height = 182;
    const ctx = c.getContext('2d'), put = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x - BX + 1), Math.round(y + 1), Math.round(w), Math.round(h)); };
    const out = (x, y, w, h, col, edge) => { put(x - 1, y - 1, w + 2, h + 2, ASH.ash0); put(x, y, w, h, col); if (edge) put(x, y, w, 1, edge); };
    const poly = (pts, col) => { ctx.fillStyle = col; spans(pts.map(([x, y]) => ({ x: x - BX + 1, y: y + 1 })), (x, y, w) => ctx.fillRect(x, y, w, 1)); };
    const Wn = LEVEL.window, bd = LEVEL.bed, V = LEVEL.voidDoor, B = BX, bro = LEVEL.brother;
    // the room: walls, the dark ceiling, the cornice, the wainscot, the floor
    put(B, 0, 320, 180, ASH.ash1);
    put(B, 0, 320, 16, ASH.ash0); for (let x = B; x < B + 320; x += 32) { put(x, 9, 30, 7, ASH.ash1); put(x, 9, 30, 1, ASH.ash2); }
    put(B, 16, 320, 6, ASH.ash2); put(B, 16, 320, 1, ASH.ash3); put(B, 21, 320, 1, ASH.ash0);
    put(B, 132, 320, 1, ASH.ash2);
    put(B, GROUND, 320, 20, ASH.ash1);
    // moonlight: one flat shaft down the wall and across the floor
    const wl = Wn.x - 6, wr = Wn.x + Wn.w + 2, sl = Wn.x - 56, sr = Wn.x + 30;
    poly([[wl, Wn.y + Wn.h], [wr, Wn.y + Wn.h], [sr, GROUND], [sl, GROUND]], ASH.ash2);
    poly([[sl, GROUND], [sr, GROUND], [sr - 14, 180], [sl - 24, 180]], ASH.ash3);
    put(B, GROUND, 320, 1, ASH.ash3); put(sl, GROUND, sr - sl, 1, ASH.ash4);
    // the window shows as it is (cut out before the bed, which stands in front of it)
    ctx.globalCompositeOperation = 'destination-out';
    const r = Wn.w / 2 + 3, cx = Wn.x + Wn.w / 2;
    for (let dy = -r; dy <= 0; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); put(cx - hw, Wn.y + dy, 2 * hw + 1, 1, '#000'); }
    put(Wn.x - 3, Wn.y, Wn.w + 6, Wn.h + 3, '#000');
    ctx.globalCompositeOperation = 'source-over';
    // torn drapes either side of the window, dark
    poly([[Wn.x - 14, 22], [Wn.x - 2, 22], [Wn.x - 4, 132], [Wn.x - 18, 128]], ASH.ash0);
    poly([[Wn.x + Wn.w + 2, 22], [Wn.x + Wn.w + 14, 22], [Wn.x + Wn.w + 18, 96], [Wn.x + Wn.w + 4, 104]], ASH.ash0);
    // the bed: canopy, posts, headboard, the sheets, a pillow, the foot board he leans on
    out(bd.x0, 36, bd.x1 - bd.x0, 6, ASH.ash3, ASH.ash4);
    [bd.x0, bd.x1 - 4].forEach(x => { out(x, 42, 4, GROUND - 42, ASH.ash3); put(x + 1, 42, 1, GROUND - 42, ASH.ash4); });
    out(bd.x1 - 6, 96, 6, GROUND - 96, ASH.ash3, ASH.ash4);
    out(bd.x0 + 4, 128, bd.x1 - bd.x0 - 10, 12, ASH.ash4, ASH.ash5);
    out(bd.x0 + 4, 140, bd.x1 - bd.x0 - 10, 12, ASH.ash3, ASH.ash4);
    out(bd.x1 - 28, 122, 18, 6, ASH.ash5, ASH.boneLo);
    out(bd.x0 - 2, 144, 8, 16, ASH.ash3, ASH.ash4);
    // the nightstand and its dark lamp; the door she came in by
    out(B + 34, 140, 18, 20, ASH.ash2, ASH.ash3); put(B + 41, 128, 4, 12, ASH.ash2);
    poly([[B + 36, 128], [B + 50, 128], [B + 47, 120], [B + 39, 120]], ASH.ash3);
    out(B + 2, GROUND - 34, 20, 34, ASH.ash2, ASH.ash3); put(B + 12, GROUND - 34, 1, 34, ASH.ash1);
    // the camera in the corner (its LED is drawn over this)
    put(LEVEL.rec.x - 4, 22, 9, 2, ASH.ash3); put(LEVEL.rec.x - 1, 22, 2, 3, ASH.ash3);
    // where he bled
    put(bro.x - 2, GROUND, 28, 1, ASH.ash0); put(bro.x + 2, GROUND + 1, 18, 1, ASH.ash0);
    // the door at the far end shows as it is, with a bone edge
    ctx.globalCompositeOperation = 'destination-out';
    put(V.x - 3, V.y - 4, V.w + 6, V.h + 4, '#000');
    ctx.globalCompositeOperation = 'source-over';
    const bone = ASH.bone; put(V.x - 4, V.y - 5, V.w + 8, 1, bone); put(V.x - 4, V.y - 5, 1, V.h + 5, bone); put(V.x + V.w + 3, V.y - 5, 1, V.h + 5, bone);
    return c;
  }

  // the floor that is gone, gaps that open, the sky where the ceiling was
  drawWorld() {
    const g = this.worldG, P = this.P, C = this.collapse; g.clear();
    if (C) {
      const x0 = LEVEL.collapse.from, w = C.x - x0;
      if (w > 0) {
        g.fillStyle(hexNum(P.void), 1); g.fillRect(x0, GROUND, w, 20);
        g.fillStyle(hexNum(P.skyTop), 1); g.fillRect(x0, 0, w, 16);
        for (let x = x0 + 5; x < C.x; x += 23) { g.fillStyle(hexNum(P.star), 1); g.fillRect(x, 3 + (x * 7) % 9, 1, 1); }
        for (let i = 0; i < 5; i++) { g.fillStyle(hexNum(P.wood), 1); g.fillRect(Math.round(C.x) - 2 - i * 3, GROUND + 1 + (i % 2) * 2, 2, 3 + i); }
      }
    }
    const sky = (x, w) => { g.fillStyle(hexNum(P.skyTop), 1); g.fillRect(x, 0, w, 16); g.fillStyle(hexNum(P.star), 1); g.fillRect(x + 5, 4, 1, 1); g.fillRect(x + w - 7, 7, 1, 1); };
    this.run.gaps.forEach(gp => {
      const x = gp.t0 * TILE, w = (gp.t1 - gp.t0 + 1) * TILE;
      if (gp.state === 'open') { g.fillStyle(hexNum(P.void), 1); g.fillRect(x, GROUND, w, 20); sky(x, w); g.fillStyle(hexNum(P.wood), 1); g.fillRect(x - 1, GROUND, 2, 6); g.fillRect(x + w - 1, GROUND, 2, 5); }
    });
    if (this.run.slab.state === 'down' || this.run.slab.state === 'fall') sky(LEVEL.run.slab.x, LEVEL.run.slab.w);
  }

  drawProps() {
    const g = this.propG, P = this.P, ash0 = hexNum(P.crack); g.clear();
    // the bag, under the beam, until she pulls it
    if (!this.bag.have) {
      const bx = LEVEL.bag.x - 5, shake = this.bag.hold > 0 ? (Math.floor(this.clock * 30) % 2) : 0;
      g.fillStyle(ash0, 1); g.fillRect(bx - 1 + shake, GROUND - 9, 14, 9);
      g.fillStyle(hexNum(P.sibLo), 1); g.fillRect(bx + shake, GROUND - 8, 12, 8); g.fillStyle(hexNum(P.sib), 1); g.fillRect(bx + 1 + shake, GROUND - 8, 10, 2); g.fillStyle(hexNum(P.colLo), 1); g.fillRect(bx + 4 + shake, GROUND - 5, 4, 1);
      g.fillStyle(hexNum(P.device), 1); g.fillRect(bx + 10, GROUND - 11, 1, 4); // the strap, caught
    }
    // the stairs after they slump: a low heap to climb over
    if (this.props.includes(this.lowProp)) { const r = this.lowProp; g.fillStyle(ash0, 1); g.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 1); g.fillStyle(hexNum(P.rubble), 1); g.fillRect(r.x, r.y, r.w, r.h); g.fillStyle(hexNum(P.rubbleHi), 1); g.fillRect(r.x + 2, r.y, r.w - 6, 1); g.fillStyle(hexNum(P.wood), 1); g.fillRect(r.x + 6, r.y + 3, 14, 2); }
    // the slab of ceiling that comes down
    const S = this.run.slab, L = LEVEL.run.slab;
    if (S.state !== 'down' || this.props.includes(this.slabProp)) {
      const y = Math.round(S.state === 'down' ? L.top : S.state === 'fall' ? S.y : 16 + (S.state === 'warn' ? Math.floor(S.t * 30) % 2 : 0)), h = S.state === 'up' || S.state === 'warn' ? 6 : L.bottom - L.top;
      g.fillStyle(ash0, 1); g.fillRect(L.x - 1, y, L.w + 2, h + 1);
      g.fillStyle(hexNum(P.wallLo), 1); g.fillRect(L.x, y, L.w, h); g.fillStyle(hexNum(P.wood), 1); g.fillRect(L.x, y + h - 3, L.w, 3); g.fillStyle(ash0, 1); g.fillRect(L.x + 10, y, 1, h);
    }
    // the music box: lid up while it plays, the little drum turning
    const MB = LEVEL.musicBox;
    if (this.box.t > 0) {
      g.fillStyle(ash0, 1); g.fillRect(MB.x - 1, MB.y - 13, 10, 7); g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(MB.x, MB.y - 12, 8, 6); g.fillStyle(hexNum(P.goldHi), 1); g.fillRect(MB.x + 2, MB.y - 5, 4, 1);
      const f = Math.floor(this.clock * 4) % 2; g.fillStyle(hexNum(P.gold), 1); g.fillRect(MB.x + 2 + f * 2, MB.y - 4, 1, 1);
      // notes rising, square, two frames
      g.fillStyle(hexNum(P.gold), 1); for (let i = 0; i < 2; i++) { const u = ((this.clock * 0.9 + i * 0.5) % 1); g.fillRect(MB.x + 3 + i * 4 + (f ? 1 : 0), Math.round(MB.y - 16 - u * 14), 2, 2); }
    }
  }

  drawCams() {
    const g = this.camG, P = this.P, t = this.clock; g.clear();
    this.cams.forEach(cm => {
      const r = cm.angle * Math.PI / 180, lx = Math.round(cm.x + Math.cos(r) * 3), ly = Math.round(cm.y + Math.sin(r) * 3);
      g.fillStyle(hexNum(P.crack), 1); g.fillRect(cm.x - 4, cm.y - 3, 9, 7);
      g.fillStyle(hexNum(P.device), 1); g.fillRect(cm.x - 3, cm.y - 2, 7, 5);
      g.fillStyle(hexNum(P.glass), 1); g.fillRect(lx - 1, ly - 1, 3, 3);
      g.fillStyle(cm.flash > 0.3 ? 0xebe6d8 : hexNum(P.rubbleHi), 1); g.fillRect(lx, ly - 1, 1, 1);
    });
    // the clock's pendulum and hands
    const C = LEVEL.clock, sw = Math.round(Math.sin(t * Math.PI) * 3);
    g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(Math.round(C.x + sw * 0.3), 92, 1, 30); g.fillStyle(hexNum(P.gold), 1); g.fillRect(Math.round(C.x + sw) - 2, 122, 5, 5);
    const hr = t / 60 * Math.PI * 2, mn = t / 6 * Math.PI * 2;
    pxLine(g, C.x, 76, C.x + Math.sin(hr) * 3, 76 - Math.cos(hr) * 3, hexNum(P.device)); pxLine(g, C.x, 76, C.x + Math.sin(mn) * 5, 76 - Math.cos(mn) * 5, hexNum(P.device));
    // the door when it opens
    if (this.mode === 'void') {
      const V = LEVEL.voidDoor, u = Math.min(1, this.voidT / 0.8), half = V.w / 2, w = Math.max(1, Math.round(half * (1 - Math.floor(u * 4) / 4 * 0.85)));
      g.fillStyle(hexNum(P.void), 1); g.fillRect(V.x, V.y, V.w, V.h);
      g.fillStyle(hexNum(P.wood), 1); g.fillRect(V.x, V.y, w, V.h); g.fillStyle(hexNum(P.woodHi), 1); g.fillRect(V.x, V.y, 1, V.h);
      g.fillStyle(hexNum(P.colHi), 1); g.fillRect(V.x + V.w - w, V.y, w, V.h);
    }
  }

  // what sits over the dark: the glasses' view, LEDs, the trail, noise, the clock's strokes
  drawOver(dt) {
    const g = this.overG, P = this.P, t = this.clock, red = hexNum(P.hazard), vx = this.view.x, bone = 0xebe6d8; g.clear();
    // the trail: the drops just ahead of her catch what light there is
    const kx = this.kid.x;
    g.fillStyle(hexNum(P.goldLo), 1);
    this.trail.forEach(d => {
      if (d.x < kx || d.x > kx + 110 || d.x < vx - 4 || d.x > vx + 324) return;
      if (this.collapse && d.x > LEVEL.collapse.from && d.x < this.collapse.x) return;
      if (this.run.gaps.some(q => q.state === 'open' && d.x >= q.t0 * TILE && d.x < (q.t1 + 1) * TILE)) return;
      g.fillRect(d.x, d.y, d.w, 1);
    });
    if (this.mode === 'house') {
      // the cones exist only in the glasses: two dotted edges; when it is about to flash, solid
      // edges and a blinking grid of dots inside. Off, she has the LEDs and the two clicks.
      const on = this.gl.showing && glassesOn(t);
      this.cams.forEach(cm => {
        if (!cm.cone) return;
        const o = cm.cone[0], a = cm.cone[1], b = cm.cone[cm.cone.length - 1];
        if (cm.warn && !cm.caught && this.gl.showing) {
          pxLine(g, o.x, o.y, a.x, a.y, red); pxLine(g, o.x, o.y, b.x, b.y, red);
          if (Math.floor(t * 16) % 2 === 0) { g.fillStyle(red, 1); spans(cm.cone, (x, y, w) => { if (y % 6) return; for (let i = x + ((y / 6) % 2 ? 3 : 0); i < x + w; i += 6) g.fillRect(i, y, 1, 1); }); }
        } else if (on) { pxLine(g, o.x, o.y, a.x, a.y, red, 3); pxLine(g, o.x, o.y, b.x, b.y, red, 3); }
        const led = cm.warn ? Math.floor(t * 16) % 2 === 0 : Math.floor(t * 1.5) % 2 === 0;
        if (led || cm.caught) { g.fillStyle(red, 1); g.fillRect(cm.x - 2, cm.y - 1, 1, 1); }
        if (cm.flash > 0.6) { g.fillStyle(bone, 1); g.fillRect(cm.x - 1, cm.y, 3, 3); }
      });
      // noise rings: white when heard, gold (and small) when the clock or the music box covers it
      this.noises.forEach(n => n.t += dt); this.noises = this.noises.filter(n => n.t < 0.6);
      this.noises.forEach(n => { const u = n.t / 0.6; pxCircle(g, n.x, n.y - 3, Math.round((3 + u * (n.masked ? 14 : 30)) / 3) * 3, n.masked ? hexNum(P.gold) : bone, 3); });
      const C = LEVEL.clock;
      this.rings.forEach(r => r.t += dt); this.rings = this.rings.filter(r => r.t < 1.2);
      this.rings.forEach(r => { const u = r.t / 1.2; pxCircle(g, C.x, 76, Math.round((8 + u * 56) / 4) * 4, hexNum(P.goldLo), 4); });
      // the moment a flash catches her: a white frame, like a viewfinder
      if (this.photo && this.photo.t < 0.5) {
        const ph = this.photo; ph.t += dt; const s = Math.round(10 + ph.t * 10), x = Math.round(ph.x), y = Math.round(ph.y);
        g.fillStyle(bone, 1); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { g.fillRect(sx < 0 ? x - s : x + s - 3, y + sy * s, 4, 1); g.fillRect(x + sx * s, sy < 0 ? y - s : y + s - 3, 1, 4); });
      }
      // floor about to open: a crack across it that blinks
      this.run.gaps.forEach(gp => {
        if (gp.state !== 'crack') return;
        const x = gp.t0 * TILE, w = (gp.t1 - gp.t0 + 1) * TILE;
        if (Math.floor(gp.t * 20) % 2 === 0) { g.fillStyle(hexNum(P.lamp), 1); for (let i = 0; i < w; i += 3) g.fillRect(x + i, GROUND + ((i * 5) % 3), 2, 1); g.fillRect(x, GROUND, 1, 5); g.fillRect(x + w - 1, GROUND, 1, 5); }
      });
      // a warning over her head while the slab creaks
      if (this.run.slab.state === 'warn' && !this.dead) this.bubbles.showPrompt(LEVEL.run.slab.x + LEVEL.run.slab.w / 2, 30, '!');
    } else {
      if (this.mode === 'bedroom' && !this.broDead) this.bro.setTexture((this.clock % 2.3) < 0.97 ? 'bro_in' : 'bro_sit');
      const R = LEVEL.rec, blink = this.mode === 'void' ? Math.floor(t * 10) % 2 === 0 : true;
      if (blink) { g.fillStyle(red, 1); g.fillRect(R.x + 2, R.y, 1, 1); }
      if (this.mode === 'talk' || this.mode === 'dying') {
        if (!this.broDead) { const pace = this.mode === 'dying' ? 3.6 : 2.3, inhale = (this.clock % pace) < pace * 0.42 && !(this.mode === 'dying' && this.dyingT > 2.6); this.bro.setTexture(inhale ? 'bro_in' : 'bro_sit'); }
        if (this.coughT > 0) { this.coughT -= dt; this.bro.setX(LEVEL.brother.x + (Math.floor(t * 30) % 2)); } else this.bro.setX(LEVEL.brother.x);
      }
      if (this.mode === 'after' || this.mode === 'void') { const V = LEVEL.voidDoor; if (Math.random() < 0.08) this.motes.emitParticleAt(V.x + Math.random() * V.w, V.y + Math.random() * V.h, 1); }
    }
  }

  doorReady() { return this.mode === 'house' && !this.dead && !this.leaving; }
  drawThings() {
    const t = this.nearThing, d = this.level.door;
    if (!t && this.kid && this.atDoor() && this.doorReady()) this.bubbles.showPrompt(d.x + d.w / 2, d.y, 'J');
    if (t && !t.noPrompt && this.mode !== 'break') { const px = t.px != null ? t.px : (t.x0 + t.x1) / 2; if (!this.bubbles.near(px, 44)) this.bubbles.showPrompt(px, t.py != null ? t.py : t.y0 - 2, t.label); }
    // a hold bar under the key while she pulls the bag, then while she reads what is in it
    const bar = (x, y, u) => { const g = this.fxG; x = Math.round(x - 7); g.fillStyle(hexNum(this.P.crack), 1); g.fillRect(x - 1, y - 1, 16, 4); g.fillStyle(hexNum(this.P.device), 1); g.fillRect(x, y, 14, 2); g.fillStyle(0xebe6d8, 1); g.fillRect(x, y, Math.round(14 * Math.min(1, u)), 2); };
    if (t === this.bagThing && this.bag.hold > 0) bar(LEVEL.bag.x + 1, GROUND - 30, this.bag.hold);
    if (this.bag.have && !this.collapse && !this.bag.letGo && this.bag.note > 0) bar(LEVEL.bag.x + 1, GROUND - 30, this.bag.note);
    this.bubbles.update(this.game.loop.delta / 1000, this.clock);
  }

  // the cracked glasses, fixed to the screen; and the red closing in while she stays with him
  drawHud(dt) {
    const g = this.hudG, P = this.P, col = hexNum(P.overlay); g.clear();
    if (this.stay > 0.6 || this.mode === 'break') {
      // red bars from the edges inward, every other row, in steps of four pixels
      const u = this.mode === 'break' ? 1 : Math.min(1, (this.stay - 0.6) / (STAY - 0.6)), d = Math.round(u * 92 / 4) * 4;
      g.fillStyle(col, 1);
      if (this.mode === 'break' && this.breakT > 0.15) g.fillRect(0, 0, 320, 180);
      else for (let y = 0; y < 180; y += 2) { if (y < d || y >= 180 - d) g.fillRect(0, y, 320, 1); else if (d > 0) { g.fillRect(0, y, d * 1.6, 1); g.fillRect(320 - d * 1.6, y, d * 1.6, 1); } }
      if (this.mode === 'break') return;
    }
    if (this.fading) return;
    this.glitchT += dt;
    const show = this.glitchT >= 2 || Math.floor(this.glitchT * 8) % 3 !== 0, m = 5, s = 8, dim = this.mode !== 'house';
    if (this.runNote > 0) {
      this.runNote -= dt;
      // the glasses flash one word at her, in the caption face, in their own color
      if (Math.floor(this.runNote * 6) % 2 === 0) { const w = ccWidth('RUN'); g.fillStyle(0x000000, 1); g.fillRect(160 - w / 2 - 4, 26, w + 8, 11); ccText(g, 'RUN', 160 - w / 2, 28, col); }
    }
    if (this.mode === 'house') this.gl.drawMeter(g, 18, 166, col);
    if (!this.gl.on && this.mode === 'house') return;
    if (this.mode === 'house') this.gl.drawStatic(g, col);
    if (dim) return; // in the bedroom the glasses sit low; only the red light in the corner
    if (show) {
      g.fillStyle(col, 1);
      [[320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy]) => { g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    }
    [[4, 4], [9, 7], [13, 6], [19, 11], [24, 12], [31, 18], [35, 17], [42, 23]].forEach(([x, y], i, arr) => { if (i) pxLine(g, arr[i - 1][0], arr[i - 1][1], x, y, 0xb8b2a3); });
    pxLine(g, 13, 6, 15, 1, 0x6b6c70); pxLine(g, 24, 12, 22, 19, 0x6b6c70);
    if (Math.floor(this.clock * 3) % 5) pixText(g, this.glitchT < 3 && Math.floor(this.glitchT * 10) % 4 === 0 ? 'V1EW' : 'VIEW', 44, m + 3, col, 1, 1);
    if (show && overlay.free(320 - m - 23, 180 - m - 9, 25, 8)) pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, 1);
  }

  hint() {
    // inside: one line for what to do; none while he talks or goes
    if (this.mode === 'bedroom') return overlay.hint('Go to him.');
    if (this.mode === 'after') return overlay.hint(this.rerun ? 'The door. W opens it.' : 'Hold J to stay with him. Or W at the door.');
    if (this.mode !== 'house' || this.leaving) return overlay.hint('');
    const k = this.kid, x = (k.x + k.w / 2) / TILE;
    if (this.collapse && !this.collapse.done && x < 79) return overlay.hint('Run. With the bag, one jump: hold Space at the edge. Crouch under the slab.');
    if (this.collapse && x >= 78) return overlay.hint('Jump from wall to wall to climb. Then the doors.');
    if (this.bag.have) return overlay.hint(this.collapse ? 'Go. The doors are at the end of the hall.' : 'Keep holding J. Something else is in the bag.');
    if (x < 12) return overlay.hint('Cameras click twice, then flash. Hide when they click.');
    if (x < 19) return overlay.hint('Under a table, a ceiling camera cannot see you.');
    if (x < 34) return overlay.hint('Boards creak. Crouch, or wind the music box with J.');
    if (x < 55) return overlay.hint('Glass is loud. Nobody hears you while the clock strikes.');
    return overlay.hint('His bag. Hold J to pull it free.');
  }
}
