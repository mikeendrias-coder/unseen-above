// Episode 4: the bedroom. The heart of the house, with the lights off. The cameras here only see
// when they flash, and they click twice first. Noise turns them: old boards creak, glass
// crunches, unless the big clock is striking. His bag is under the fallen stairs; pulling it
// free brings the floor down behind her. At the end of the blood, the bedroom: him, and a door
// that does not match itself.
import { Music } from '../core/music.js';
import { hexNum, flat } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText, textWidth } from '../art/pixfont.js';
import { ccText, ccWidth, ccBox } from '../art/ccfont.js';
import { TILE, GROUND, BX, LEVEL, buildMap, paintLevel, paintBrother, bloodOf, trail } from '../art/bedroom.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { display } from '../core/display.js';
import { SideEpisode, inPoly, K } from '../core/side.js';
import { goNext } from '../core/flow.js';
import { BEDROOM, NOTICE, lineSeconds } from '../data/dialogue.js';
import { Glasses } from '../core/glasses.js';
import { reviewKeys } from '../core/review.js';

const ARC = { ceiling: [35, 145], wall: [150, 200] };
const glassesOn = t => (Math.sin(t * 2.3) + Math.sin(t * 5.7 + 1) * 0.6 + Math.sin(t * 13.1) * 0.3) > -0.35;

export class Bedroom extends SideEpisode {
  constructor() { super('bedroom'); }

  create(data) {
    this.initSide('ep4', LEVEL, buildMap());
    const P = this.P, LW = LEVEL.w * TILE;
    makeSprites(this, P);
    const lvl = paintLevel(P); lvl.toTexture(this, 'bd_level'); this.marks = lvl.marks;
    paintBrother(P, false).toTexture(this, 'bro_sit'); paintBrother(P, false, true).toTexture(this, 'bro_in'); paintBrother(P, true).toTexture(this, 'bro_dead');
    this.bloodCol = hexNum(bloodOf(P)); this.trail = trail();
    this.pixelCamera(LW, P.void);
    this.add.image(0, 0, 'bd_level').setOrigin(0).setDepth(0);
    this.worldG = this.add.graphics().setDepth(0.5);
    this.propG = this.add.graphics().setDepth(1.5);
    this.camG = this.add.graphics().setDepth(3);
    this.bro = this.add.image(LEVEL.brother.x, GROUND, 'bro_sit').setOrigin(0, 1).setDepth(3.2);
    this.commonLayers();
    this.eyeG = this.add.graphics().setDepth(4.5);
    // the dark: a canvas the size of the view, holes cut where there is light
    this.darkCanvas = document.createElement('canvas'); this.darkCanvas.width = 322; this.darkCanvas.height = 182;
    if (this.textures.exists('bd_dark')) this.textures.remove('bd_dark');
    this.darkTex = this.textures.addCanvas('bd_dark', this.darkCanvas);
    this.darkImg = this.add.image(0, 0, 'bd_dark').setOrigin(0).setDepth(6.4);
    this.flashG = this.add.graphics().setDepth(6.42).setBlendMode(Phaser.BlendModes.MULTIPLY); // red light: everything it touches goes red
    this.lightG = this.add.graphics().setDepth(6.5).setBlendMode(Phaser.BlendModes.ADD);
    this.overG = this.add.graphics().setDepth(6.6);
    this.hudG = this.addParallax(this.add.graphics().setDepth(20), 0);
    this.debris = this.add.particles(0, 0, 'dot2', { speedX: { min: -20, max: 20 }, speedY: { min: -10, max: 30 }, gravityY: 420, lifespan: { min: 500, max: 1100 }, tint: [hexNum(P.wood), hexNum(P.rubble), hexNum(P.woodHi)], emitting: false }).setDepth(6.45);
    this.dust = this.add.particles(0, 0, 'dot', { speedY: { min: -14, max: -4 }, speedX: { min: -8, max: 8 }, lifespan: 1400, alpha: { start: 0.6, end: 0 }, tint: [hexNum(flat(P.dust)), hexNum(P.shaft)], emitting: false }).setDepth(6.45);
    this.motes = this.add.particles(0, 0, 'dot', { speedX: { min: -16, max: -4 }, speedY: { min: -6, max: 6 }, lifespan: 2200, alpha: { start: 0.9, end: 0 }, tint: [hexNum(P.voidEdge), 0xffffff], blendMode: 'ADD', emitting: false }).setDepth(6.7);

    // the cameras, each on its own beat
    this.cams = LEVEL.cameras.map(c => { const cm = Object.assign({}, c, { angle: c.aim, cone: null, lock: 0, caught: false, flash: 0, snap: null, clicks: 0, warn: false }); this.resync(cm, 0.6 - 0.9); return cm; });
    this.noises = []; this.rings = []; this.struck = new Set(); this.lastTick = -1;
    this.props = LEVEL.props.map(r => Object.assign({}, r));
    this.wallProp = Object.assign({}, LEVEL.bag.wall); this.props.push(this.wallProp);
    this.lowProp = Object.assign({ falls: true }, LEVEL.bag.low);
    this.stepProp = Object.assign({ falls: true }, LEVEL.run.step); this.props.push(this.stepProp);
    const S = LEVEL.run.slab; this.slabProp = { id: 'the ceiling', x: S.x, y: S.top, w: S.w, h: S.bottom - S.top, falls: true };
    this.bag = { have: false, hold: 0 };
    this.collapse = null; this.runNote = 0; this.glitchT = 0;
    this.run = { gaps: LEVEL.run.gaps.map(g => Object.assign({}, g, { state: 'whole', t: 0 })), slab: { state: 'up', t: 0, y: 16 } };
    this.mode = 'house'; this.fading = false;
    this.gl = new Glasses({ has: true, on: true, cracked: true });
    this.skipPoints = [12 * TILE + 20, 20 * TILE, 34 * TILE + 8, 56 * TILE + 8];
    const SD = LEVEL.sideDoor, bx = LEVEL.bag.x;
    this.bagThing = { x0: bx - 12, x1: bx + 14, y0: 140, y1: GROUND, label: 'E', use: () => {} };
    this.things.push({ x0: SD.x, x1: SD.x + SD.w, y0: SD.y, y1: GROUND, label: 'E', door: true, use: () => this.enterRoom('wardrobe') }, this.bagThing);
    // things to look at in the dark (not once the floor starts to go)
    const N = NOTICE.bedroom, look = (x0, x1, py, lines, y0) => this.addLook({ x0, x1, y0: y0 != null ? y0 : 112, py, lines });
    look(94, 148, 126, N.piano); look(238, 298, 130, N.table); look(556, 580, 50, N.clock, 100); look(626, 694, 130, N.silver); look(754, 822, 132, N.billiards);
    this.drawBodies();
    this.spawn(); this.kid.face = 1;
    this.view = { x: 0 }; this.updateView(1);
    const fromCut = !!(data && data.fromCut);
    this.cameras.main.fadeIn(fromCut ? 1200 : 400);
    this.beds = { hum: Sound.hum(0.012), wind: Sound.wind(0.02), breath: Sound.breath(0.0001) };
    Music.play('dark', { fadeIn: 2.5 });
    this.events.once('shutdown', () => { Object.values(this.beds).forEach(b => b.stop(0.4)); overlay.clearCaption(); });
    this.onWake = () => { this.updateView(1); this.beds.hum.set(0.012, 0.5); this.beds.wind.set(0.02, 0.5); };
    this.takeNote({ fromCut }, 4, 'The Bedroom');
    this.time.delayedCall(fromCut ? 4300 : 500, () => { if (this.mode === 'house' && !this.dead) this.itemPanel('dark'); });
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
        this.moveKid(dt); this.updateThings();
        if (k.onGround && !wasGround && vy > 150) this.step(true);
        this.footsteps(dt); this.updateBag(dt);
        if (c.glasses()) this.gl.toggle();
        if (k.y + k.h > 176) { if (state.immune) this.rescue(); else this.die({ id: 'the fall', direct: true, footY: GROUND }); }
      } else if (this.dead && this.girl.visible) this.settle(dt);
      this.gl.update(dt);
      this.updateClock(dt); this.updateCams(dt); this.updateCollapse(dt); this.updateRun(dt);
    } else this.updateBedroom(dt);
    this.updateView(dt);
    this.updateAmbience();
    this.draw(dt);
    this.hint();
    c.endFrame();
  }

  lookable() { return this.mode === 'house' && !this.bag.have; }
  // review: N moves her section by section; at the stairs it pulls the bag; after the bag, the
  // doors; in the bedroom it moves the scene on
  skipAhead() {
    if (this.mode === 'house') {
      if (this.leaving || this.dead) return;
      if (!this.bag.have) { const x = this.skipPoints.find(p => p > this.kid.x + 12); if (x != null) return this.placeAt(x); this.placeAt(LEVEL.bag.x - 6); return this.pullBag(); }
      return this.placeAt(85 * TILE + 6);
    }
    if (this.mode === 'bedroom') { this.kid.x = LEVEL.brother.kneel; return; }
    if (this.mode === 'talk') { this.talkI = BEDROOM.length - 1; return this.nextLine(); }
    if (this.mode === 'dying') { this.dyingT = Math.max(this.dyingT, 5.5); return; }
    if (this.mode === 'after') this.openVoid();
  }

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
    cm.flash = 1; cm.clicks = 0;
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
    if (!f) { if (landing) Sound.noise(0.05, 0.02, 600); return; }
    if (f.kind === 'boards') { Sound.tone(150 + Math.random() * 40, 0.16, 'sawtooth', 0.018, 90); Sound.noise(0.08, 0.03, 900); }
    else { Sound.noise(0.09, 0.07, 7000); Sound.tone(3600 + Math.random() * 900, 0.04, 'triangle', 0.01); }
    this.noiseAt(cx, k.y + k.h);
  }

  // ------------------------------------------------------------------ the clock
  updateClock() {
    const C = LEVEL.clock, cyc = Math.floor(this.clock / C.period), u = this.clock - cyc * C.period;
    C.strokes.forEach((s, i) => { const id = cyc * 10 + i; if (u >= s && !this.struck.has(id)) { this.struck.add(id); this.strike(); } });
    const tk = Math.floor(this.clock * 2), d = Math.abs(C.x - this.kid.x);
    if (tk !== this.lastTick) { this.lastTick = tk; if (d < 420) Sound.tone(tk % 2 ? 1900 : 1500, 0.02, 'square', 0.007 * (1 - d / 420)); }
  }
  masked() { const C = LEVEL.clock; return this.clock % C.period < C.mask; }
  strike() { const d = Math.abs(LEVEL.clock.x - this.kid.x); Sound.bell(0.075 * Math.max(0.2, 1 - d / 700)); this.rings.push({ t: 0 }); }

  // ------------------------------------------------------------------ his bag
  updateBag(dt) {
    const B = this.bag;
    if (B.have) return;
    if (this.nearThing === this.bagThing && this.ctl.useHeld()) {
      B.hold += dt / 1.2;
      if (Math.random() < dt * 5) Sound.noise(0.07, 0.02, 900);
      if (B.hold >= 1) this.pullBag();
    } else B.hold = Math.max(0, B.hold - dt * 2);
  }
  pullBag() {
    const B = this.bag; B.have = true; B.hold = 0; this.bagThing.off = true;
    Sound.tone(150, 0.2, 'triangle', 0.04, 90); Sound.noise(0.3, 0.06, 700);
    this.say('His bag. Still heavy.');
    this.time.delayedCall(800, () => this.bringDown());
  }
  bringDown() {
    if (this.dead || this.collapse) return;
    // the beam shifts, the stairs slump, and the floor behind her starts to go
    this.props = this.props.filter(r => r !== this.wallProp); this.props.push(this.lowProp);
    this.cameras.main.shake(450, 0.012); Sound.noise(0.9, 0.22, 1500); Sound.tone(70, 1.2, 'sawtooth', 0.05, 40);
    for (let i = 0; i < 24; i++) this.debris.emitParticleAt(LEVEL.bag.wall.x + Math.random() * 30, 100 + Math.random() * 50, 1);
    this.collapse = { x: LEVEL.collapse.from, t: 0, done: false };
    this.beds.rumble = Sound.rumble(0.26); this.runNote = 1.6; overlay.sfx('[THE FLOOR GIVES WAY]', 2000);
    Music.play('run', { fade: 0.2, fadeIn: 0.15 });
  }

  // ------------------------------------------------------------------ the floor going
  updateCollapse(dt) {
    const C = this.collapse; if (!C || C.done) return;
    C.t += dt;
    const sp = C.t < 0.8 ? 46 : 58 + Math.min(10, (C.t - 0.8) * 2);
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
    if (Math.abs(tx * TILE - this.kid.x) < 200) { Sound.noise(0.18, 0.05, 900); this.cameras.main.shake(90, 0.004); }
  }
  updateRun(dt) {
    if (!this.collapse || this.dead) return;
    const k = this.kid, R = this.run, m = this.map.m;
    R.gaps.forEach(g => {
      if (g.state === 'whole' && k.x + k.w > g.at) { g.state = 'crack'; g.t = 0; Sound.noise(0.3, 0.1, 2500); Sound.tone(240, 0.35, 'sawtooth', 0.02, 110); }
      else if (g.state === 'crack') {
        g.t += dt;
        if (g.t >= 0.42) { g.state = 'open'; for (let tx = g.t0; tx <= g.t1; tx++) { m[10][tx] = 0; m[11][tx] = 0; m[0][tx] = 0; this.chunk(tx); } Sound.noise(0.5, 0.15, 1200); this.cameras.main.shake(160, 0.007); }
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
        Sound.noise(0.6, 0.2, 1500); this.cameras.main.shake(220, 0.012);
        for (let i = 0; i < 14; i++) this.debris.emitParticleAt(L.x + Math.random() * L.w, L.bottom, 1);
        const r = this.slabProp;
        if (!window.__noDeath && k.x < r.x + r.w && k.x + k.w > r.x && k.y < r.y + r.h && k.y + k.h > r.y) this.die({ id: 'the ceiling', direct: true });
      }
    }
  }

  // ------------------------------------------------------------------ the bedroom
  enterDoor() {
    if (this.leaving || this.mode !== 'house' || this.dead) return;
    this.leaving = true;
    Sound.tone(220, 0.3, 'triangle', 0.03, 180); Sound.noise(0.4, 0.05, 900);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => {
      this.mode = 'bedroom'; this.leaving = false;
      const k = this.kid; k.x = BX + 26; k.y = GROUND - K.hStand; k.h = K.hStand; k.crouch = false; k.vx = 0; k.vy = 0; k.face = 1;
      this.cams.forEach(cm => { cm.caught = false; cm.lock = 0; });
      if (this.beds.rumble) this.beds.rumble.set(0.0001, 0.4);
      this.beds.breath.set(0.08, 1.5);
      Music.play('bedroom', { fade: 1, fadeIn: 4 });
      this.updateView(0);
      this.cameras.main.fadeIn(1100);
      overlay.hint('');
    });
  }
  updateBedroom(dt) {
    const k = this.kid, c = this.ctl;
    if (this.mode === 'bedroom' || this.mode === 'after') { this.moveKid(dt); this.updateThings(); }
    // reaching him in the air, she lands first, then kneels: nobody freezes mid jump
    if (this.mode === 'bedroom' && k.x + k.w / 2 >= LEVEL.brother.kneel) this.mode = 'arrive';
    if (this.mode === 'arrive') { this.settle(dt); if (k.onGround) this.startTalk(); }
    if (this.mode === 'talk') { this.talkT -= dt; if (c.advance() || this.talkT <= 0) this.nextLine(); }
    if (this.mode === 'dying') {
      this.dyingT += dt;
      if (this.dyingT > 3.4 && !this.broDead) { this.broDead = true; this.bro.setTexture('bro_dead'); Sound.tone(98, 1.8, 'sine', 0.02); }
      if (this.dyingT > 5.6) {
        this.mode = 'after';
        const V = LEVEL.voidDoor; this.voidThing = { x0: V.x - 4, x1: V.x + V.w + 4, y0: V.y, y1: GROUND, label: 'E', use: () => this.openVoid() };
        this.things = [this.voidThing];
      }
    }
    if (this.mode === 'void') this.updateVoid(dt);
  }
  startTalk() {
    const k = this.kid;
    this.mode = 'talk'; k.vx = 0; k.face = 1;
    k.x = LEVEL.brother.kneel - k.w / 2; if (!k.crouch) { k.y += K.hStand - K.hCrouch; k.h = K.hCrouch; k.crouch = true; }
    this.talkI = -1; this.nextLine();
  }
  nextLine() {
    this.talkI++;
    if (this.talkI >= BEDROOM.length) return this.endTalk();
    const l = BEDROOM[this.talkI];
    this.talkT = lineSeconds(l.text) + (l.who ? 0.4 : 0.8);
    overlay.caption(l.who, l.text);
    if (/COUGH/.test(l.text)) { this.coughT = 1.3; Sound.noise(0.2, 0.05, 1100); this.time.delayedCall(380, () => Sound.noise(0.25, 0.06, 900)); }
  }
  endTalk() {
    overlay.clearCaption();
    this.mode = 'dying'; this.dyingT = 0; Music.stop(5);
    this.beds.breath.slow(1.7); this.beds.breath.set(0.0001, 3.2);
  }
  openVoid() {
    if (this.mode !== 'after') return;
    this.mode = 'void'; this.voidT = 0; this.voidThing.off = true;
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
    if (this.voidT > 2.4) this.girl.setAlpha(Math.max(0, 1 - (this.voidT - 2.4) / 0.9));
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

  say(text) {
    this.bubbles.say('sis', text, () => ({ x: this.kid.x + this.kid.w / 2, y: this.kid.y - 2 }), { ink: 0xffffff, pitch: 760 });
  }

  // ------------------------------------------------------------------ drawing
  draw(dt) {
    const P = this.P, t = this.clock, red = hexNum(P.hazard), vx = Math.round(this.view.x);
    this.drawGirl();
    this.drawWorld(); this.drawProps(); this.drawCams();
    // her bag on her back, and a glint off the cracked glasses
    const eg = this.eyeG; eg.clear();
    if (this.girl.visible && !this.dead) {
      const k = this.kid, cx = Math.round(k.x + k.w / 2), top = Math.round(k.y + k.h) - (k.crouch ? 9 : 14);
      if (this.bag.have) { const bx = k.face > 0 ? cx - 5 : cx + 2; eg.fillStyle(hexNum(P.sibLo), this.girl.alpha); eg.fillRect(bx, top + 5, 3, 5); eg.fillStyle(hexNum(P.sib), this.girl.alpha); eg.fillRect(bx, top + 5, 3, 1); }
      if (Math.floor(t * 3) % 4 === 0) { eg.fillStyle(hexNum(P.overlay), 0.8 * this.girl.alpha); eg.fillRect(cx + (k.face < 0 ? -3 : 1), top + (k.crouch ? 1 : 2), 2, 1); }
    }
    // the dark and what lights it
    const lights = this.lights = [];
    const k = this.kid;
    if (!this.dead && this.girl.visible) lights.push({ x: k.x + k.w / 2, y: k.y + 6, r: 34, soft: 0.8, a: 0.72 * this.girl.alpha });
    const lg = this.lightG, fg = this.flashG; lg.clear(); fg.clear();
    if (this.mode === 'house') {
      this.cams.forEach(cm => {
        lights.push({ x: cm.x, y: cm.y, r: 8, soft: 0.8, a: cm.warn ? 0.6 : 0.3 });
        if (cm.flash > 0 && cm.cone) {
          const f = cm.flash * cm.flash, r = cm.angle * Math.PI / 180;
          lights.push({ poly: cm.cone, a: 0.9 * f });
          lights.push({ x: cm.x + Math.cos(r) * cm.range * 0.55, y: cm.y + Math.sin(r) * cm.range * 0.55, r: cm.range * 0.6, soft: 0.9, a: 0.4 * f });
          fg.fillStyle(0xff4a4a, 0.85 * f); fg.fillPoints(cm.cone, true);
          lg.fillStyle(red, 0.08 * f); lg.fillPoints(cm.cone, true);
        }
      });
      const C = LEVEL.clock, striking = this.masked();
      lights.push({ x: C.x, y: 76, r: striking ? 30 : 18, soft: 0.8, a: striking ? 0.7 : 0.45 });
      lg.fillStyle(hexNum(P.lamp), striking ? 0.12 : 0.05); lg.fillCircle(C.x, 76, striking ? 12 : 8);
      if (this.collapse) {
        const x0 = LEVEL.collapse.from, x1 = this.collapse.x;
        for (let x = x0 + 20; x < x1; x += 44) lights.push({ x, y: 96, r: 72, soft: 0.6, a: 0.82 });
        if (x1 - x0 > 8) { lg.fillStyle(hexNum(P.shaft), 0.06); lg.fillPoints([{ x: x0, y: 0 }, { x: x1, y: 0 }, { x: x1 + 30, y: GROUND }, { x: x0 + 10, y: GROUND }], true); }
      }
      // where the ceiling came down with the floor or the slab, moonlight
      const holes = this.run.gaps.filter(q => q.state === 'open').map(q => ({ x: q.t0 * TILE, w: (q.t1 - q.t0 + 1) * TILE }));
      if (this.run.slab.state === 'down' || this.run.slab.state === 'fall') holes.push({ x: LEVEL.run.slab.x, w: LEVEL.run.slab.w });
      holes.forEach(h => { lights.push({ x: h.x + h.w / 2, y: 110, r: 58, soft: 0.6, a: 0.8 }); lg.fillStyle(hexNum(P.shaft), 0.07); lg.fillPoints([{ x: h.x, y: 0 }, { x: h.x + h.w, y: 0 }, { x: h.x + h.w + 10, y: GROUND }, { x: h.x - 4, y: GROUND }], true); });
      // the line of cold light under the bedroom doors
      const D = LEVEL.door; lights.push({ x: D.x + D.w / 2, y: GROUND - 2, r: 14, soft: 0.8, a: 0.35 + 0.1 * Math.sin(t * 2) });
    } else {
      const Wn = LEVEL.window, V = LEVEL.voidDoor, pulse = 0.5 + 0.5 * Math.sin(t * 1.7);
      lights.push({ x: Wn.x + Wn.w / 2, y: Wn.y + Wn.h / 2, r: 52, soft: 0.6, a: 0.6 });
      lights.push({ poly: [{ x: Wn.x, y: Wn.y + Wn.h }, { x: Wn.x + Wn.w, y: Wn.y + Wn.h }, { x: Wn.x + 20, y: GROUND + 2 }, { x: Wn.x - 70, y: GROUND + 2 }], a: 0.5 });
      lg.fillStyle(hexNum(P.shaft), 0.05); lg.fillPoints([{ x: Wn.x, y: Wn.y + Wn.h }, { x: Wn.x + Wn.w, y: Wn.y + Wn.h }, { x: Wn.x + 20, y: GROUND }, { x: Wn.x - 70, y: GROUND }], true);
      const open = this.mode === 'void' ? Math.min(1, this.voidT / 0.8) : 0;
      lights.push({ x: V.x + V.w / 2, y: V.y + V.h / 2, r: 22 + pulse * 6 + open * 40, soft: 0.7, a: 0.4 + open * 0.5 });
      lg.fillStyle(hexNum(P.voidEdge), 0.12 + 0.1 * pulse + open * 0.3); lg.fillRect(V.x - 2, V.y - 2, V.w + 4, 2); lg.fillRect(V.x - 2, V.y, 2, V.h); lg.fillRect(V.x + V.w, V.y, 2, V.h); lg.fillRect(V.x, GROUND - 1, V.w, 1);
      lights.push({ x: LEVEL.rec.x, y: LEVEL.rec.y, r: 7, soft: 0.8, a: 0.5 });
    }
    this.drawDark(vx, this.mode === 'house' ? 0.91 : 0.84);
    this.drawOver(dt);
    this.drawLocks(this.cams, LEVEL.caught);
    this.drawThings();
    this.drawHud(dt);
  }

  drawDark(vx, alpha) {
    const ctx = this.darkCanvas.getContext('2d'), n = hexNum(this.P.void);
    ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, 322, 182);
    ctx.fillStyle = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`; ctx.fillRect(0, 0, 322, 182);
    ctx.globalCompositeOperation = 'destination-out';
    this.lights.forEach(l => {
      if (l.poly) {
        ctx.fillStyle = `rgba(0,0,0,${l.a})`; ctx.beginPath();
        l.poly.forEach((p, i) => { const x = p.x - vx + 1, y = p.y + 1; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.closePath(); ctx.fill(); return;
      }
      const x = l.x - vx + 1, y = l.y + 1; if (x < -l.r || x > 322 + l.r) return;
      const g = ctx.createRadialGradient(x, y, l.r * (1 - (l.soft || 0.5)), x, y, l.r);
      g.addColorStop(0, `rgba(0,0,0,${l.a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, l.r, 0, Math.PI * 2); ctx.fill();
    });
    this.darkTex.refresh();
    this.darkImg.setPosition(vx - 1, -1);
  }

  // the floor that is gone, gaps that open, the sky where the ceiling was
  drawWorld() {
    const g = this.worldG, P = this.P, C = this.collapse; g.clear();
    if (C) {
      const x0 = LEVEL.collapse.from, w = C.x - x0;
      if (w > 0) {
        g.fillStyle(hexNum(P.void), 1); g.fillRect(x0, GROUND, w, 20);
        g.fillStyle(hexNum(P.skyTop), 1); g.fillRect(x0, 0, w, 16); g.fillStyle(hexNum(P.skyMid), 1); g.fillRect(x0, 9, w, 7);
        for (let x = x0 + 5; x < C.x; x += 23) { g.fillStyle(hexNum(P.star), 1); g.fillRect(x, 3 + (x * 7) % 9, 1, 1); }
        for (let i = 0; i < 5; i++) { g.fillStyle(hexNum(P.wood), 1); g.fillRect(Math.round(C.x) - 2 - i * 3, GROUND + 1 + (i % 2) * 2, 2, 3 + i); }
      }
    }
    const sky = (x, w) => { g.fillStyle(hexNum(P.skyTop), 1); g.fillRect(x, 0, w, 16); g.fillStyle(hexNum(P.skyMid), 1); g.fillRect(x, 9, w, 7); g.fillStyle(hexNum(P.star), 1); g.fillRect(x + 5, 4, 1, 1); g.fillRect(x + w - 7, 7, 1, 1); };
    this.run.gaps.forEach(gp => {
      const x = gp.t0 * TILE, w = (gp.t1 - gp.t0 + 1) * TILE;
      if (gp.state === 'open') { g.fillStyle(hexNum(P.void), 1); g.fillRect(x, GROUND, w, 20); sky(x, w); g.fillStyle(hexNum(P.wood), 1); g.fillRect(x - 1, GROUND, 2, 6); g.fillRect(x + w - 1, GROUND, 2, 5); }
    });
    if (this.run.slab.state === 'down' || this.run.slab.state === 'fall') sky(LEVEL.run.slab.x, LEVEL.run.slab.w);
  }

  drawProps() {
    const g = this.propG, P = this.P; g.clear();
    // the bag, under the beam, until she pulls it
    if (!this.bag.have) {
      const bx = LEVEL.bag.x - 5, shake = this.bag.hold > 0 ? Math.round(Math.sin(this.clock * 50)) : 0;
      g.fillStyle(hexNum(P.sibLo), 1); g.fillRect(bx + shake, GROUND - 8, 12, 8); g.fillStyle(hexNum(P.sib), 1); g.fillRect(bx + 1 + shake, GROUND - 8, 10, 2); g.fillStyle(hexNum(P.colLo), 1); g.fillRect(bx + 4 + shake, GROUND - 5, 4, 1);
      g.fillStyle(hexNum(P.device), 1); g.fillRect(bx + 10, GROUND - 11, 1, 4); // the strap, caught
    }
    // the stairs after they slump: a low heap to climb over
    if (this.props.includes(this.lowProp)) { const r = this.lowProp; g.fillStyle(hexNum(P.rubble), 1); g.fillRect(r.x, r.y, r.w, r.h); g.fillStyle(hexNum(P.rubbleHi), 1); g.fillRect(r.x + 2, r.y, r.w - 6, 2); g.fillStyle(hexNum(P.wood), 1); g.fillRect(r.x + 6, r.y + 3, 14, 2); }
    if (this.props.includes(this.stepProp)) { const r = this.stepProp; g.fillStyle(hexNum(P.rubble), 1); g.fillRect(r.x, r.y, r.w, r.h); g.fillStyle(hexNum(P.rubbleHi), 1); g.fillRect(r.x, r.y, r.w, 2); g.fillStyle(hexNum(P.crack), 1); g.fillRect(r.x + 8, r.y + 4, 1, 8); }
    // the slab of ceiling that comes down
    const S = this.run.slab, L = LEVEL.run.slab;
    if (S.state !== 'down' || this.props.includes(this.slabProp)) {
      const y = S.state === 'down' ? L.top : S.state === 'fall' ? S.y : 16 + (S.state === 'warn' ? Math.round(Math.sin(S.t * 70)) : 0), h = S.state === 'up' || S.state === 'warn' ? 6 : L.bottom - L.top;
      g.fillStyle(hexNum(P.wallLo), 1); g.fillRect(L.x, y, L.w, h); g.fillStyle(hexNum(P.wood), 1); g.fillRect(L.x, y + h - 3, L.w, 3); g.fillStyle(hexNum(P.crack), 1); g.fillRect(L.x + 10, y, 1, h);
    }
  }

  drawCams() {
    const g = this.camG, P = this.P, t = this.clock; g.clear();
    this.cams.forEach(cm => {
      const r = cm.angle * Math.PI / 180, lx = Math.round(cm.x + Math.cos(r) * 3), ly = Math.round(cm.y + Math.sin(r) * 3);
      g.fillStyle(hexNum(P.device), 1); g.fillRect(cm.x - 3, cm.y - 2, 7, 5);
      g.fillStyle(hexNum(P.glass), 1); g.fillRect(lx - 1, ly - 1, 3, 3);
      g.fillStyle(0xffffff, 0.3 + cm.flash * 0.7); g.fillRect(lx, ly - 1, 1, 1);
    });
    // the clock's pendulum and hands
    const C = LEVEL.clock, sw = Math.sin(t * Math.PI) * 3;
    g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(Math.round(C.x + sw * 0.3), 92, 1, 30); g.fillStyle(hexNum(P.gold), 1); g.fillRect(Math.round(C.x + sw) - 2, 122, 5, 5);
    const hr = t / 60 * Math.PI * 2, mn = t / 6 * Math.PI * 2;
    g.lineStyle(1, hexNum(P.device), 1); g.lineBetween(C.x, 76, C.x + Math.sin(hr) * 3, 76 - Math.cos(hr) * 3); g.lineBetween(C.x, 76, C.x + Math.sin(mn) * 5, 76 - Math.cos(mn) * 5);
    // the bedroom's own camera, and the door when it opens
    if (this.mode === 'void') {
      const V = LEVEL.voidDoor, u = Math.min(1, this.voidT / 0.8), half = V.w / 2, w = Math.max(1, Math.round(half * (1 - u * 0.85)));
      g.fillStyle(hexNum(P.void), 1); g.fillRect(V.x, V.y, V.w, V.h);
      g.fillStyle(hexNum(P.wood), 1); g.fillRect(V.x, V.y, w, V.h); g.fillStyle(hexNum(P.woodHi), 1); g.fillRect(V.x, V.y, 1, V.h);
      g.fillStyle(hexNum(P.colHi), 1); g.fillRect(V.x + V.w - w, V.y, w, V.h);
    }
  }

  // what sits over the dark: the glasses' view, LEDs, the blood, noise, the clock's strokes
  drawOver(dt) {
    const g = this.overG, P = this.P, t = this.clock, red = hexNum(P.hazard), vx = this.view.x; g.clear();
    // the blood, faint in the dark, a little brighter just ahead of her
    const kx = this.kid.x;
    this.trail.forEach(d => {
      if (d.x < vx - 4 || d.x > vx + 324) return;
      if (this.collapse && d.x > LEVEL.collapse.from && d.x < this.collapse.x) return;
      const gp = this.run.gaps.find(q => q.state === 'open' && d.x >= q.t0 * TILE && d.x < (q.t1 + 1) * TILE); if (gp) return;
      const ahead = d.x > kx && d.x < kx + 110 ? 0.16 : 0;
      g.fillStyle(red, 0.13 + ahead); g.fillRect(d.x, d.y, d.w, 1);
    });
    if (this.mode === 'house') {
      // the cones exist only in the glasses; off, she has the LEDs and the two clicks
      const on = this.gl.showing && glassesOn(t);
      this.cams.forEach(cm => {
        if (!cm.cone) return;
        const o = cm.cone[0], a = cm.cone[1], b = cm.cone[cm.cone.length - 1];
        if (cm.warn && !cm.caught && this.gl.showing) {
          const blink = Math.floor(t * 16) % 2 === 0;
          g.fillStyle(red, blink ? 0.12 : 0.05); g.fillPoints(cm.cone, true);
          g.lineStyle(1, red, blink ? 0.85 : 0.4); g.lineBetween(o.x, o.y, a.x, a.y); g.lineBetween(o.x, o.y, b.x, b.y);
        } else if (on) {
          g.fillStyle(hexNum(P.overlay), 0.045); g.fillPoints(cm.cone, true);
          g.lineStyle(1, hexNum(P.overlay), 0.22); g.lineBetween(o.x, o.y, a.x, a.y); g.lineBetween(o.x, o.y, b.x, b.y);
          if (Math.floor(t * 9) % 5 === 0) { g.lineStyle(1, red, 0.15); g.lineBetween(o.x + 1, o.y, a.x + 1, a.y); }
        }
        const led = cm.warn ? Math.floor(t * 16) % 2 === 0 : Math.floor(t * 1.5) % 2 === 0;
        if (led || cm.caught) { g.fillStyle(red, 1); g.fillRect(cm.x - 2, cm.y - 1, 1, 1); }
        if (cm.flash > 0.6) { g.fillStyle(0xffffff, cm.flash); g.fillCircle(cm.x, cm.y + 1, 3); }
      });
      // noise rings: white when heard, gold when the clock covers it
      this.noises.forEach(n => n.t += dt); this.noises = this.noises.filter(n => n.t < 0.6);
      this.noises.forEach(n => { const u = n.t / 0.6; g.lineStyle(1, n.masked ? hexNum(P.gold) : 0xffffff, (n.masked ? 0.35 : 0.7) * (1 - u)); g.strokeCircle(n.x, n.y - 3, 3 + u * (n.masked ? 14 : 30)); });
      const C = LEVEL.clock;
      this.rings.forEach(r => r.t += dt); this.rings = this.rings.filter(r => r.t < 1.2);
      this.rings.forEach(r => { const u = r.t / 1.2; g.lineStyle(1, hexNum(P.gold), 0.28 * (1 - u)); g.strokeCircle(C.x, 76, 8 + u * 56); if (u > 0.15) g.strokeCircle(C.x, 76, 8 + (u - 0.15) * 56); });
      // the moment a flash catches her: a white frame, like a viewfinder
      if (this.photo && this.photo.t < 0.5) {
        const ph = this.photo; ph.t += dt; const s = 10 + ph.t * 10, a = 1 - ph.t / 0.5;
        g.lineStyle(1, 0xffffff, a); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { g.lineBetween(ph.x + sx * s, ph.y + sy * s, ph.x + sx * (s - 4), ph.y + sy * s); g.lineBetween(ph.x + sx * s, ph.y + sy * s, ph.x + sx * s, ph.y + sy * (s - 4)); });
      }
      // floor about to open: a glowing crack across it
      this.run.gaps.forEach(gp => {
        if (gp.state !== 'crack') return;
        const x = gp.t0 * TILE, w = (gp.t1 - gp.t0 + 1) * TILE, a = 0.55 + 0.45 * Math.sin(gp.t * 60);
        g.fillStyle(hexNum(P.lamp), a); for (let i = 0; i < w; i += 3) g.fillRect(x + i, GROUND + ((i * 5) % 3), 2, 1); g.fillRect(x, GROUND, 1, 5); g.fillRect(x + w - 1, GROUND, 1, 5);
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
    if (!t && this.kid && this.atDoor() && this.doorReady()) this.bubbles.showPrompt(d.x + d.w / 2, d.y, 'E');
    if (t && !t.noPrompt) { const px = t.px != null ? t.px : (t.x0 + t.x1) / 2; if (!this.bubbles.near(px, 44)) this.bubbles.showPrompt(px, t.py != null ? t.py : t.y0 - 2, t.label); }
    if (t === this.bagThing && this.bag.hold > 0) {
      const g = this.fxG, x = LEVEL.bag.x + 1, y = GROUND - 26;
      g.lineStyle(2, 0xffffff, 0.9); g.beginPath(); g.arc(x, y, 5, -Math.PI / 2, -Math.PI / 2 + this.bag.hold * Math.PI * 2); g.strokePath();
    }
    this.bubbles.update(this.game.loop.delta / 1000, this.clock);
  }

  // the cracked glasses, fixed to the screen
  drawHud(dt) {
    const g = this.hudG, P = this.P, col = hexNum(P.overlay); g.clear();
    if (this.fading) return;
    this.glitchT += dt;
    const dim = this.mode === 'house' ? 1 : 0.4, a = (this.glitchT < 2 ? (Math.random() < 0.5 ? 0.9 : 0.1) : 0.45) * dim, m = 5, s = 8;
    if (this.runNote > 0) {
      this.runNote -= dt;
      // the glasses flash one word at her, in the caption face, in their own color
      if (Math.floor(this.runNote * 6) % 2 === 0) { const w = ccWidth('RUN'); ccBox(g, 160 - w / 2 - 4, 26, w + 8, 11, 0x000000, 0.85); ccText(g, 'RUN', 160 - w / 2, 28, col); }
    }
    if (this.mode === 'house') this.gl.drawMeter(g, 18, 166, col);
    if (!this.gl.on && this.mode === 'house') return;
    if (this.mode === 'house') this.gl.drawStatic(g, col);
    g.fillStyle(col, a);
    [[320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy]) => { g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    [[4, 4], [9, 7], [13, 6], [19, 11], [24, 12], [31, 18], [35, 17], [42, 23]].forEach(([x, y], i, arr) => { if (i) { const [px, py] = arr[i - 1]; g.lineStyle(1, 0xffffff, 0.45 * dim); g.lineBetween(px, py, x, y); } });
    g.lineStyle(1, 0xffffff, 0.35 * dim); g.lineBetween(13, 6, 15, 1); g.lineBetween(24, 12, 22, 19);
    if (Math.floor(this.clock * 3) % 5) pixText(g, this.glitchT < 3 && Math.random() < 0.3 ? 'V1EW' : 'VIEW', 44, m + 3, col, 1, a);
    if (overlay.free(320 - m - 23, 180 - m - 9, 25, 8)) pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, a);
  }

  hint() {
    if (this.mode !== 'house' || this.leaving) return overlay.hint('');
    const k = this.kid, x = (k.x + k.w / 2) / TILE;
    if (this.collapse && !this.collapse.done) return overlay.hint('Run. Jump where the floor opens. Crouch under what comes down.');
    if (this.bag.have) return overlay.hint('The doors at the end of the hall. Up or E.');
    if (x < 12) return overlay.hint('Follow the blood. These cameras only see when they flash, and they click twice first.');
    if (x < 20) return overlay.hint('Under a table, a ceiling camera cannot see you.');
    if (x < 34) return overlay.hint('Old boards creak when you run: crouch across them. Behind the chest, the camera on the arch cannot see you.');
    if (x < 55) return overlay.hint('Glass on the floor: running is loud. While the clock strikes, nobody hears you.');
    return overlay.hint('His bag, under the fallen stairs. Hold E to pull it free.');
  }
}
