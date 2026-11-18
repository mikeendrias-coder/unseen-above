// Episode 2: the gallery. Inside the front door: a two storey hall that wears out the deeper she
// goes. Glasses in a sideboard drawer show what the cameras see (a chatty cleaning robot asks her
// not to touch the drawer). Rebuilt Nov 17 (final pass): the broken stair under a sweeping camera,
// two chandeliers to ride over the atrium, a floor polisher, boards that give way, the broken
// camera that looks at the Moon, a chandelier that drops, and the house's own laser at the end.
// The house hurts her (falls, the polisher, the chandelier); what watches her kills her.
import { Music } from '../core/music.js';
import { hexNum, Painter } from '../art/painter.js';
import { makeSprites, girlFrame } from '../art/sprites.js';
import { ASH } from '../art/palettes.js';
import { pixText } from '../art/pixfont.js';
import { TILE, GROUND, MEZZ, LEVEL, buildMap, paintLevel, camAngle, laserAt, beamHits } from '../art/gallery.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode, K } from '../core/side.js';
import { Props, Marks, Gold, hardCone, pushClear } from '../core/props.js';
import { goNext, prevChapter } from '../core/flow.js';
import { NOTICE, bodyLines } from '../data/dialogue.js';
import { Glasses } from '../core/glasses.js';
import { fx } from '../core/fx.js';

const T = TILE, C = k => hexNum(ASH[k]), SKIP_SAFE = 2;
const rgb = c => { const n = hexNum(c); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// The cleaning robot: cheerful, polite, no idea (the same model as the one on the Moon).
const ROBOT_BEFORE = ['Welcome home! Please wipe your feet.', "You're not on the guest list. Nobody ever is.", "I've cleaned this floor 41,207 times.", "Please don't touch the drawer.", "What drawer? I didn't say drawer.", "Careful of the cameras. They're shy."];
const ROBOT_AFTER = ['Oh, those look good on you.', 'The last girl wore them too.', 'Please put them back after. Nobody does.', "Don't worry. I'll clean up after you. I always do."];
const ROBOT_TIDY = 'I tidied up for the next take.';
const ROBOT_SAW = 'I saw that.';
const ROBOT_CHAIR = 'Hey! I just put that chair back.';

export class Gallery extends SideEpisode {
  constructor() { super('gallery'); }

  create(data) {
    this.map0 = buildMap();
    this.initSide('ep2', LEVEL, this.map0);
    const P = this.P, LW = LEVEL.w * T, LH = LEVEL.h * T;
    makeSprites(this, P);
    this.makeProps(P);
    const lvl = paintLevel(P, this.map0, false); lvl.toTexture(this, 'gl_level'); this.marks = lvl.marks;
    paintLevel(P, this.map0, true).toTexture(this, 'gl_dark');
    this.pixelCamera(LW, P.wallLo);
    this.cameras.main.setBounds(0, 0, LW, LH);
    this.levelImg = this.add.image(0, 0, 'gl_level').setOrigin(0).setDepth(0);
    this.hallG = this.add.graphics().setDepth(0.5);
    this.robotSprite = this.add.image(0, GROUND, 'robot_a').setOrigin(0.5, 1).setDepth(3);
    this.polisherSprite = this.add.image(0, MEZZ, 'polisher_a').setOrigin(0.5, 1).setDepth(3);
    this.propG = this.add.graphics().setDepth(1.5);
    this.glassesSprite = this.add.image(0, 0, 'glasses').setOrigin(0.5, 1).setDepth(4.6).setVisible(false);
    this.camG = this.add.graphics().setDepth(3);
    this.coneG = this.add.graphics().setDepth(3.8);
    this.commonLayers();
    this.eyeG = this.add.graphics().setDepth(4.5);
    this.laserG = this.add.graphics().setDepth(6);
    this.hudG = this.addParallax(this.add.graphics().setDepth(20), 0);

    // a few square motes in the moonlight; sparks from the broken camera
    const H = LEVEL.hole;
    this.add.particles(0, 0, 'dot', { x: { min: H.x0, max: H.x1 + 16 }, y: { min: 20, max: MEZZ - 8 }, speedY: { min: 2, max: 6 }, speedX: { min: -1, max: 2 }, lifespan: 4000, frequency: 260, tint: [C('ash5'), C('boneLo')] }).setDepth(5);
    this.sparks = this.add.particles(0, 0, 'dot', { speed: { min: 18, max: 55 }, angle: { min: 20, max: 160 }, gravityY: 260, lifespan: { min: 300, max: 600 }, tint: [C('lit'), C('bone')], emitting: false }).setDepth(6);

    this.glasses = false; this.hudT = 0; this.zapT = 2; this.lightsOff = false;
    this.gl = new Glasses({ has: false });
    this.skipPoints = LEVEL.skip.map(([x]) => x * T);
    this.robot = { x: LEVEL.robot.x0 + 40, dir: 1 }; this.robotSrc = null;
    this.polisher = { x: LEVEL.polisher.x0, dir: 1 };
    this.drawer = { open: 0, opening: false, fly: -1 };
    this.drop = { phase: 'hang', t: 0, y: LEVEL.dropper.hang, sway: 0 };
    this.props = LEVEL.props.map(r => Object.assign({}, r));
    this.robotProp = { id: 'robot', x: 0, y: GROUND - 6, w: 10, h: 6 }; this.props.push(this.robotProp);
    this.dyn = new Props(this, { depth: 3.6 });
    this.swings = LEVEL.swings.map((s, i) => this.dyn.swing(Object.assign({ id: 'chandelier ' + (i + 1), draw: (g, p) => this.drawSwing(g, p) }, s)));
    this.boards = LEVEL.boards.map(b => this.dyn.crumble({ id: 'boards', x: b.x, y: b.y, w: b.w, h: 6, delay: 0.38, back: 0, draw: (g, p) => this.drawBoards(g, p) }));
    // the furniture: pushed, knocked over, climbed (core/props.js). Knock the hall chair over
    // and the robot, if it is near, complains (once a visit).
    this.furniture = LEVEL.furniture.map(f => {
      const p = this.dyn.piece(Object.assign({}, f));
      (f.loose || []).forEach(l => this.dyn.item(Object.assign({}, l, { x: p.x + l.dx, y: p.y })));
      return p;
    });
    const chair = this.furniture.find(p => p.id === 'hall chair');
    if (chair) chair.onTip = (p, pose) => { if (pose === 'down' && !this.chairSaid && Math.abs(this.robot.x - p.x) < 260) { this.chairSaid = true; this.time.delayedCall(400, () => this.robotSay(ROBOT_CHAIR)); } };
    this.cams = LEVEL.cameras.map(c => Object.assign({}, c, { lock: 0, cone: null, angle: 0 }));
    this.laser = { awake: false, t: 0, phase: '', n: -2, st: null, fired: false };
    // the laser's order is new every take, and its rhythm a little different: no learning it by heart
    const order = []; for (let i = 0; i < 10; i++) { let s = Math.random() < 0.5 ? 'low' : 'high'; if (i >= 2 && order[i - 1] === s && order[i - 2] === s) s = s === 'low' ? 'high' : 'low'; order.push(s); }
    this.laserDef = Object.assign({}, LEVEL.laser, { order, idle: LEVEL.laser.idle * (0.8 + Math.random() * 0.4), first: LEVEL.laser.first * (0.7 + Math.random() * 0.6) });
    this.addThings();
    // the show's tape marks (checkpoints): a retry from one keeps the glasses if she had them
    this.markG = this.add.graphics().setDepth(1.4);
    this.tape = new Marks(this, LEVEL.marks.map(([x, y]) => ({ x, y })), { carry: () => ({ glasses: this.glasses }) });
    this.gold = new Gold(this, LEVEL.gold.map(([x, y]) => ({ x, y })));
    this.drawBodies();
    this.spawn();
    if (this.tape.from) {
      this.safeT = 1; // a beat to get her bearings before a camera can lock on
      if (this.tape.from.glasses) { const D = this.drawer; D.open = 1; D.opening = true; D.fly = 1; this.cabinetThing.off = true; this.glasses = true; this.gl.has = true; this.gl.on = true; }
    }
    this.followGirl();
    const fromCut = !!(data && data.fromCut);
    this.cameras.main.fadeIn(fromCut ? 900 : 350);
    this.beds = { lounge: Sound.lounge(0.04), wind: Sound.wind(0.0001), hum: Sound.hum(0.0001) };
    Music.play('housedeep', { level: 0.0001 });
    this.events.once('shutdown', () => Object.values(this.beds).forEach(b => b.stop(0.4)));
    this.takeNote({ fromCut }, 2, 'The Gallery');
    // on a later take the robot has tidied her old bodies into a row; it says so, once
    if (this.tidied && !state.heard('ep2:tidy')) this.time.delayedCall(1600, () => this.robotSay(ROBOT_TIDY, 'ep2:tidy'));
    window.__game = { scene: this, state };
  }

  makeProps(P) {
    const add = (key, w, h, draw) => { const p = new Painter(w, h); draw(p); p.toTexture(this, key); };
    const O = ASH.ash0;
    const robot = (key, led, step) => add(key, 14, 9, p => {
      p.rect(4, 0, 6, 1, O); p.rect(2, 1, 10, 1, O); p.rect(1, 2, 12, 3, O); p.rect(0, 5, 14, 3, O);
      p.rect(5, 1, 4, 1, P.robot); p.rect(3, 2, 8, 1, P.robot); p.rect(2, 3, 10, 2, P.robot); p.px(8, 3, led);
      p.rect(1, 5, 12, 1, P.device); p.rect(2, 6, 10, 1, P.device); p.px(step ? 4 : 3, 7, ASH.ash1); p.px(step ? 9 : 10, 7, ASH.ash1); p.rect(1, 8, 12, 1, O);
    });
    robot('robot_a', P.robotLed, 0); robot('robot_b', P.robot, 1); robot('robot_c', P.goldHi, 0);
    // the floor polisher: a squat drum on a spinning pad
    const pol = (key, f) => add(key, 16, 9, p => {
      p.rect(3, 0, 10, 6, O); p.rect(4, 1, 8, 4, P.device); p.rect(4, 1, 8, 1, P.col); p.px(10, 2, P.gold);
      p.rect(0, 6, 16, 3, O); p.rect(1, 6, 14, 2, P.colLo); for (let i = f; i < 14; i += 3) p.px(1 + i, 7, P.colHi);
    });
    pol('polisher_a', 0); pol('polisher_b', 1);
    add('glasses', 9, 3, p => { p.rect(0, 0, 4, 2, P.overlay); p.rect(5, 0, 4, 2, P.overlay); p.px(4, 0, P.device); p.px(1, 0, ASH.bone); p.px(6, 0, ASH.bone); p.rect(0, 2, 9, 1, P.device); });
  }

  // ------------------------------------------------------------------ things to use and look at
  addThings() {
    const N = NOTICE.gallery, G = GROUND, M = MEZZ, CB = LEVEL.cabinet, SD = LEVEL.staffDoor, LS = LEVEL.lightSwitch, PT = LEVEL.portrait;
    const once = (key, lines) => state.heard('look:ep2:' + key) ? lines.slice(-1) : lines;
    // heard once a line of it is out (ui/typer.js), not when it is asked for
    const look = (key, x0, x1, y0, y1, py, lines, more) => { const t = this.addLook(Object.assign({ x0, x1, y0, y1, py, lines: once(key, lines) }, more)); t.src.key = 'look:ep2:' + key; return t; };
    this.cabinetThing = { x0: CB.x0, x1: CB.x1, y0: G - 16, y1: G, label: 'J', use: () => this.openDrawer() };
    this.robotThing = { x0: 0, x1: 0, y0: G - 10, y1: G, label: 'J', use: () => this.robotTalk() };
    this.switchThing = { x0: LS.x - 9, x1: LS.x + 9, y0: G - 30, y1: G, px: LS.x, py: LS.y - 4, label: 'J', use: () => this.flipLights() };
    this.things.push(this.cabinetThing, this.robotThing, this.switchThing, { x0: SD.x, x1: SD.x + SD.w, y0: SD.y, y1: G, label: 'J', door: true, use: () => this.enterRoom('staff') });
    look('man', PT.x - 6, PT.x + PT.w + 6, G - 20, G, PT.y + 2, N.man);
    look('desk', 24 * T - 4, 26 * T + 4, 16 * T - 8, 18 * T, 16 * T - 10, N.desk);
    look('sheets', 39 * T, 46 * T, G - 20, G, G - 14, N.sheets);
    look('chandelier', 34 * T, 37 * T, M - 20, M, M - 40, N.chandelier);
    look('missing', 55 * T + 8, 57 * T + 8, M - 20, M, 76, N.missing);
    look('polisher', 54 * T, 56 * T, M - 20, M, M - 12, N.polisher);
    look('camera', 64 * T + 8, 67 * T + 8, M - 20, M, 150, N.camera, { clue: 'cameraMoon' });
    // the laser port, once it has fired at her: the sound it made
    this.emitterLook = look('emitter', 76 * T + 4, 78 * T - 4, G - 40, G, G - 34, N.emitter, { clue: 'laserTone' });
    this.things = this.things.filter(t => t !== this.emitterLook); // put out once the laser has fired
  }

  // ------------------------------------------------------------------ bodies: the robot tidies them
  // Her bodies from takes before the last lie in a neat row on the atrium floor, along its far
  // wall (out of the way of the hall's drawer, switch and doors); the newest stays where she
  // fell. Each one can still be looked at. The row holds seven; older ones are gone.
  drawBodies() {
    this.bodyLayer.removeAll(true);
    this.things = this.things.filter(t => !t.body);
    const last = this.ep.take - 1, older = this.ep.bodies.filter(b => b.take < last).slice(-7);
    let row = 0;
    this.tidied = false;
    this.ep.bodies.filter(b => b.take >= last || older.includes(b)).forEach(b0 => {
      const old = b0.take < last, b = old ? { x: LEVEL.pit.x1 - 12 - (row++) * 18, y: GROUND, take: b0.take, cause: b0.cause } : b0;
      if (old) this.tidied = true;
      const age = Math.max(0, Math.min(3, this.ep.take - 1 - b0.take));
      this.bodyLayer.add(this.add.image(b.x, b.y, 'body' + age).setOrigin(0.5, 1));
      const src = { lines: bodyLines(b0, age) };
      this.things.push({ x0: b.x - 7, x1: b.x + 7, y0: b.y - 8, y1: b.y + 2, label: 'J', look: true, body: true, src, use: () => this.bubbles.look('item', src, () => ({ x: b.x, y: b.y - 6 })) });
    });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl, k = this.kid;
    this.clock += dt; this.safeT = Math.max(0, (this.safeT || 0) - dt);
    if (this.commonKeys()) { c.endFrame(); return; }
    if (this.done) { c.endFrame(); return; }
    if (!this.dead && !this.leaving) {
      // over the atrium, dust sheets break a fall: it hurts, but never more than 2
      const P0 = LEVEL.pit, inPit = k.x + k.w > P0.x0 && k.x < P0.x1, wasAir = !k.onGround;
      this.noFallDamage = inPit;
      if (!k.onGround) this.pitPeak = Math.min(this.pitPeak == null ? k.y : this.pitPeak, k.y);
      this.dyn.step(dt, () => this.moveKid(dt));
      if (this.dyn.riding) this.pitPeak = null;
      if (k.onGround) { if (inPit && wasAir && this.pitPeak != null) { const d = k.y - this.pitPeak; if (d >= K.fall1) this.hurt(d >= K.fall2 ? 2 : 1, 'fall'); } this.pitPeak = null; }
      this.updateThings(); this.tape.update(dt); if (c.glasses()) this.gl.toggle();
    } else { this.dyn.update(dt); if (this.dead && this.girl.visible) this.settle(dt); }
    this.gl.update(dt); this.gold.update(dt);
    this.updateDrawer(dt);
    this.updateDropper(dt);
    this.updateCameras(dt);
    this.updateLaser(dt);
    this.updateRobot(dt);
    this.updatePolisher(dt);
    this.updateAmbience(dt);
    this.draw();
    this.hint();
    c.endFrame();
  }

  // ------------------------------------------------------------------ the drawer and the glasses
  openDrawer() {
    if (this.drawer.opening) return;
    this.drawer.opening = true; this.cabinetThing.off = true;
    Sound.noise(0.25, 0.05, 1200); Sound.tone(220, 0.12, 'triangle', 0.02, 180);
    // on a later take: the glasses are back in the drawer, as if she never took them
    // (said once: the drawer opens every take, its lines do not)
    if (this.ep.take > 1 && !state.heard('look:ep2:drawer2')) {
      const src = { lines: NOTICE.gallery.drawer2, key: 'look:ep2:drawer2' };
      this.time.delayedCall(350, () => { if (state.clue('drawer')) overlay.note('CLUE NOTED (' + state.clueCount() + ')', 1600); this.bubbles.look('item', src, () => ({ x: LEVEL.cabinet.drawer.x + 8, y: GROUND - 16 })); });
    }
    const R = this.robot; if (Math.abs(R.x - this.kid.x) < 200 && !state.heard('ep2:sawthat')) this.time.delayedCall(500, () => this.robotSay(ROBOT_SAW, 'ep2:sawthat'));
  }
  updateDrawer(dt) {
    const D = this.drawer;
    if (!D.opening) return;
    if (D.open < 1) { D.open = Math.min(1, D.open + dt / 0.3); if (D.open >= 1) { D.fly = 0; Sound.tone(880, 0.08, 'sine', 0.02); } return; }
    if (D.fly >= 0 && D.fly < 1) {
      D.fly = Math.min(1, D.fly + dt / 0.45);
      const C0 = LEVEL.cabinet.drawer, k = this.kid, sx = C0.x + C0.w / 2, sy = C0.y, ex = k.x + k.w / 2, ey = k.y + 3, u = D.fly;
      this.glassesSprite.setVisible(u < 1).setPosition(Math.round(sx + (ex - sx) * u), Math.round(sy + (ey - sy) * u - Math.sin(u * Math.PI) * 18));
      if (u >= 1) this.putOnGlasses();
    }
  }
  putOnGlasses() {
    this.glasses = true; this.hudT = 0; this.gl.has = true; this.gl.on = true;
    this.time.delayedCall(450, () => this.itemPanel('glasses'));
    const [r, g, b] = rgb(this.P.overlay); fx.flash(this.cameras.main, 220, r, g, b);
    Sound.tone(660, 0.09, 'sine', 0.03, null, 0.3); this.time.delayedCall(110, () => Sound.tone(990, 0.16, 'sine', 0.03, null, 0.3));
  }
  // the light switch: the gold goes dark, the red stays on
  flipLights() {
    this.lightsOff = !this.lightsOff;
    this.levelImg.setTexture(this.lightsOff ? 'gl_dark' : 'gl_level');
    Sound.tone(this.lightsOff ? 300 : 420, 0.04, 'square', 0.02); Sound.noise(0.05, 0.03, 3000);
    if (this.lightsOff && !state.heard('look:ep2:switch')) { // said the first time only, never on a retry
      const src = { lines: NOTICE.gallery.lightswitch, key: 'look:ep2:switch' };
      this.bubbles.look('item', src, () => ({ x: LEVEL.lightSwitch.x, y: LEVEL.lightSwitch.y - 6 }));
    }
  }

  // ------------------------------------------------------------------ the chandelier that drops
  updateDropper(dt) {
    const D = this.drop, X = LEVEL.dropper, k = this.kid, kc = k.x + k.w / 2, M = MEZZ;
    if (D.phase === 'hang') {
      D.sway = Math.sin(this.clock * 1.3) * 0.6;
      if (!this.dead && !this.leaving && kc > X.x - 26 && kc < X.x + 8 && k.y + k.h > M - 24 && k.y + k.h <= M + 2) {
        D.phase = 'warn'; D.t = 0;
        Sound.tone(95, 0.45, 'sawtooth', 0.04, 70); Sound.noise(0.4, 0.06, 900);
        fx.shake(this.cameras.main, 120, 0.003);
        this.sparks.explode(6, X.x, 18);
      }
    } else if (D.phase === 'warn') {
      D.t += dt; D.sway = Math.floor(D.t * 30) % 2 ? 1 : -1;
      if (D.t >= X.warn) { D.phase = 'fall'; D.t = 0; D.v = 0; Sound.tone(400, 0.3, 'square', 0.02, 120); }
    } else if (D.phase === 'fall') {
      D.v += 1600 * dt; D.y += D.v * dt; D.sway = 0;
      if (D.y >= M - 6) {
        D.y = M - 6; D.phase = 'down';
        fx.shake(this.cameras.main, 260, 0.014); Sound.noise(0.6, 0.18, 3000); Sound.tone(1800, 0.25, 'triangle', 0.025, 2600);
        this.burst.explode(10, X.x, M - 4);
        // the wreck is solid where it is drawn (28 x 7), so she can stand on it or bump into it
        const wreck = { id: 'fallen chandelier', x: X.x - 14, y: M - 7, w: 28, h: 7 };
        this.props.push(wreck);
        // gold the wreck lands on sits on top of it now, where she can still reach it
        this.gold.list.forEach((m, i) => { if (!this.gold.taken.has(i) && m.x >= wreck.x && m.x < wreck.x + wreck.w && m.y > wreck.y) m.y = wreck.y; });
        const hit = k.x + k.w > X.x - X.footprint && k.x < X.x + X.footprint && k.y + k.h > M - 30 && k.y < M;
        if (hit && !this.dead) {
          this.hurt(2, 'chandelier'); // the house: HP (hurt() decides what story mode and tests do)
          // it throws her clear of the wreck, hurt or not, so she is never left inside it (Nov 18:
          // in story mode she stood stuck inside the fallen chandelier)
          if (!this.dead) pushClear(this, wreck, kc < X.x ? -1 : 1);
        }
      }
    }
  }

  // ------------------------------------------------------------------ cameras
  updateCameras(dt) {
    const v = this.cameras.main.worldView;
    this.cams.forEach(cm => {
      cm.angle = camAngle(cm, this.clock);
      if (Math.abs(cm.x - v.centerX) > 480) { cm.cone = null; cm.lock = 0; return; }
      cm.cone = this.cone(cm.x, cm.y, cm.angle, cm.half, cm.range);
      if (this.safeT > 0) cm.lock = 0; else this.watch(cm, dt, LEVEL.camLock);
    });
    // the broken camera sparks now and then
    this.zapT -= dt;
    if (this.zapT <= 0) { this.zapT = 2.5 + Math.random() * 3; const cm = this.cams[1]; this.sparks.explode(5, cm.x - 2, cm.y + 2); if (Math.abs(this.kid.x - cm.x) < 260) Sound.noise(0.08, 0.04, 5000); }
  }

  // ------------------------------------------------------------------ the laser
  updateLaser(dt) {
    const L = this.laserDef, k = this.kid, z = this.laser;
    if (!z.awake) {
      if (!this.dead && k.x + k.w > L.x0 - 12 && k.y + k.h > GROUND - 40) { z.awake = true; z.t = 0; Sound.tone(70, 0.9, 'sawtooth', 0.05, 140); this.beds.hum.set(0.05, 1.2); fx.shake(this.cameras.main, 160, 0.004); }
      return;
    }
    z.t = window.__laserT != null ? window.__laserT : z.t + dt; // tests can hold the laser at a moment
    const st = laserAt(L, z.t); z.st = st;
    if (st.phase !== z.phase || st.n !== z.n) {
      if (st.phase === 'tell') { Sound.tone(1320, 0.05, 'square', 0.014); this.time.delayedCall(130, () => Sound.tone(st.shot === 'low' ? 990 : 1760, 0.06, 'square', 0.014)); }
      if (st.phase === 'charge') Sound.charge();
      if (st.phase === 'fire') { Sound.tone(1500, 0.35, 'sawtooth', 0.03, 1200); Sound.noise(0.3, 0.05, 7000); if (!z.fired) { z.fired = true; this.things.push(this.emitterLook); } }
      z.phase = st.phase; z.n = st.n;
    }
    if (st.phase === 'fire' && !this.dead && !this.leaving && !window.__noDeath && !(this.safeT > 0) && k.x + k.w > L.x0 && k.x < L.x1) {
      const y = L.shots[st.shot].find(yy => beamHits(k.y, k.y + k.h, yy));
      if (y != null) this.die({ x: L.x1 - 2, y, id: L.id, direct: true }); // the house's own laser, not the satellite
    }
  }

  // Near the sideboard with no glasses yet, J always opens the drawer (Nov 18, before class: the
  // robot, the light switch or a gold thing nearby could take the key instead). Her reach is a
  // little wider than the sideboard, so standing at its edge counts.
  pinThing() {
    if (this.glasses || this.drawer.opening || this.cabinetThing.off) return null;
    const CB = LEVEL.cabinet, k = this.kid, cx = k.x + k.w / 2;
    if (this.dead || cx < CB.x0 - 10 || cx > CB.x1 + 10 || k.y + k.h < GROUND - 30) return null;
    return this.cabinetThing;
  }

  // ------------------------------------------------------------------ the robots
  updateRobot(dt) {
    const R = this.robot, B = LEVEL.robot, k = this.kid, talking = this.bubbles.busy('robot');
    const near = !this.dead && Math.abs(R.x - (k.x + k.w / 2)) < 22 && k.y + k.h > GROUND - 24;
    // it never parks in front of the sideboard (its beat ends 40 px short, LEVEL.robot.x1):
    // put past that, it rolls back, even while she stands close or it talks
    if (R.x > B.x1) { R.dir = -1; R.x = Math.max(B.x1, R.x - B.speed * 1.5 * dt); }
    else if (!near && !talking) {
      const nx = R.x + R.dir * B.speed * dt;
      // it will not drive into her; it waits, then turns around
      if (Math.abs(nx - (k.x + k.w / 2)) < 10 && k.y + k.h > GROUND - 8) R.dir = -R.dir; else R.x = nx;
      if (R.x > B.x1) { R.x = B.x1; R.dir = -1; } if (R.x < B.x0) { R.x = B.x0; R.dir = 1; }
    }
    this.robotProp.x = Math.round(R.x) - 5;
    this.robotThing.x0 = R.x - 8; this.robotThing.x1 = R.x + 8;
    const tex = near || talking ? 'robot_c' : Math.floor(this.clock * 4) % 2 ? 'robot_a' : 'robot_b';
    this.robotSprite.setTexture(tex).setPosition(Math.round(R.x), GROUND).setFlipX(R.dir < 0);
  }
  // the polisher does not stop for anyone: touching it knocks her down (1 HP)
  updatePolisher(dt) {
    const Q = this.polisher, B = LEVEL.polisher, k = this.kid;
    Q.x += Q.dir * B.speed * dt; if (Q.x > B.x1) { Q.x = B.x1; Q.dir = -1; } if (Q.x < B.x0) { Q.x = B.x0; Q.dir = 1; }
    if (!this.dead && !this.leaving && k.inv <= 0 && k.x + k.w > Q.x - 7 && k.x < Q.x + 7 && k.y + k.h > MEZZ - 8 && k.y < MEZZ) {
      this.hurt(1, 'polisher');
      // the shove comes with the hurt: in story mode (nothing hurts her) it rolls past her
      if (!this.dead && k.inv > 0) { const s = k.x + k.w / 2 < Q.x ? -1 : 1; k.vx = s * 130; k.vy = -140; k.onGround = false; }
    }
    this.polisherSprite.setTexture(Math.floor(this.clock * 12) % 2 ? 'polisher_a' : 'polisher_b').setPosition(Math.round(Q.x), MEZZ);
  }
  robotStyle() { return { ink: 0xebe6d8, pitch: 1180, leave: 64 }; }
  // once: a key, heard once the line is out (a line cut short is said again next take)
  robotSay(text, once) { this.bubbles.say('robot', text, () => ({ x: this.robot.x, y: GROUND - 9 }), Object.assign(this.robotStyle(), { leave: 200, once })); }
  // On a retry the robot picks up at the first line she has not heard yet (all heard: its last).
  robotTalk() {
    const unheard = (list, tag) => { const i = list.findIndex((l, n) => !state.heard('ep2:robot:' + tag + n)); return i < 0 ? list.length - 1 : i; };
    // each line is heard once it is out (ui/typer.js): walking off mid line leaves it unheard
    if (!this.robotSrc) this.robotSrc = { lines: () => this.glasses || this.drawer.opening ? ROBOT_AFTER : ROBOT_BEFORE, i: unheard(ROBOT_BEFORE, 'b'), loop: true, from: 1, key: i => 'ep2:robot:' + (this.robotSrc.after ? 'a' : 'b') + i };
    const after2 = this.glasses || this.drawer.opening, src = this.robotSrc;
    if (after2 && !src.after) { src.after = true; src.i = unheard(ROBOT_AFTER, 'a'); src.from = 0; }
    this.bubbles.press('robot', src, () => ({ x: this.robot.x, y: GROUND - 9 }), this.robotStyle());
  }

  // ------------------------------------------------------------------ the door, story mode
  enterDoor() {
    if (this.leaving) return;
    this.leaving = true; state.finish(this.epId);
    const cam = this.cameras.main, D = LEVEL.door;
    cam.stopFollow(); cam.pan(D.x + D.w / 2, D.y + D.h / 2, 900, 'Sine.easeInOut');
    Sound.chime(); this.beds.lounge.set(0.0001, 1); this.beds.hum.set(0.0001, 1.4);
    this.time.delayedCall(900, () => cam.fadeOut(900, 0, 0, 0));
    this.time.delayedCall(1900, () => {
      this.done = true;
      overlay.card('END OF EPISODE 2', 'Take ' + this.ep.take, 3400); overlay.bug('CH 07', 1400);
      overlay.hint('');
    });
    this.time.delayedCall(5600, () => goNext(this, 'ep2'));
  }
  // N never leaves her without the glasses: the first press opens the drawer for her (as J would)
  // before it moves her. The last point is the door itself; one more N goes through it.
  skipAhead() {
    const k = this.kid; if (!k || this.dead || this.leaving) return;
    if (!this.glasses) this.giveGlasses();
    const at = LEVEL.skip.find(([x]) => x * T > k.x + 12);
    if (!at) { if (k.x > 84 * T && k.y + k.h > GROUND - 4) this.enterDoor(); return; }
    this.skipTo(at);
  }
  // B: the skip point behind her (N's spots, N's safe beat); at the first one, back to batch 1.
  // The glasses stay as they are: the drawer is behind the first point.
  skipBack() {
    const k = this.kid; if (!k || this.dead || this.leaving) return;
    const at = LEVEL.skip.slice().reverse().find(([x]) => x * T < k.x - 12);
    if (!at) { prevChapter(this); return; }
    this.skipTo(at);
  }
  skipTo(at) {
    const k = this.kid;
    k.x = Math.round(at[0] * T); k.h = 14; k.crouch = false; k.y = at[1] * T - 14; k.vx = 0; k.vy = 0; k.peakY = k.y; this.dyn.riding = null; this.pitPeak = null;
    // a beat to get her bearings: nothing locks on and nothing hurts her (she blinks) for 2 s
    this.safeT = SKIP_SAFE; k.inv = Math.max(k.inv, SKIP_SAFE);
  }
  giveGlasses() {
    const D = this.drawer; if (this.glasses || D.fly >= 0) return;
    D.open = 1; D.opening = true; D.fly = 1; this.cabinetThing.off = true; this.glassesSprite.setVisible(false);
    this.putOnGlasses();
  }
  // the door counts from its left post to the end wall, so a run that slides past it still gets in
  atDoor() { const k = this.kid, d = LEVEL.door; return k.x + k.w > d.x + 2 && k.x < d.x + d.w + 12 && Math.abs(k.y + k.h - (d.y + d.h)) < 4; }
  rescue() { this.skipAhead(); }
  drawGirl() {
    super.drawGirl();
    const k = this.kid; if (!k || !this.girl.visible) return;
    const f = this.dyn && this.dyn.riding ? { tex: 'girl_jump' } : girlFrame(k, this.clock);
    this.girl.setTexture(f.tex); if (f.flip != null) this.girl.setFlipX(f.flip);
  }

  // ------------------------------------------------------------------ ambience
  updateAmbience() {
    const x = this.kid.x, H = LEVEL.hole, clamp = v => Math.max(0, Math.min(1, v));
    if (this.leaving) return;
    this.beds.lounge.set(0.045 * clamp(1 - (x - 30 * T) / (22 * T)) + 0.0001, 0.5);
    const deep = clamp((x - 34 * T) / (20 * T)); if (Math.abs(deep - (this.deepLv || 0)) > 0.04) { this.deepLv = deep; Music.level(0.0001 + deep, 0.8); }
    const hc = (H.x0 + H.x1) / 2; this.beds.wind.set(0.09 * clamp(1 - Math.abs(x - hc) / 280) + 0.0001, 0.5);
  }

  // ------------------------------------------------------------------ drawing
  draw() {
    const P = this.P, t = this.clock, v = this.cameras.main.worldView;
    this.drawGirl();
    // the hall's two chandeliers and the hard pools of light under them (the switch turns them off)
    const hg = this.hallG; hg.clear();
    LEVEL.hallLamps.forEach(L => {
      const x = L.x, y = L.y;
      hg.fillStyle(C('goldLo'), 1); hg.fillRect(x, 16, 1, y - 18);
      hg.fillStyle(C('ash0'), 1); hg.fillRect(x - 12, y - 2, 25, 5);
      hg.fillStyle(C(this.lightsOff ? 'bronzeHi' : 'gold'), 1); hg.fillRect(x - 11, y - 1, 23, 3);
      for (let i = -9; i <= 9; i += 3) { hg.fillStyle(C(this.lightsOff ? 'ash4' : 'lit'), 1); hg.fillRect(x + i, y - 5, 1, 3); hg.fillStyle(C(this.lightsOff ? 'ash3' : 'goldHi'), 1); hg.fillRect(x + i, y + 3 + (Math.abs(i) % 2), 1, 1); }
    });
    // camera bodies: housing, a lens that turns, a red light that stays on
    const cg = this.camG; cg.clear();
    this.cams.forEach(cm => {
      const r = cm.angle * Math.PI / 180, lx = Math.round(cm.x + Math.cos(r) * 3), ly = Math.round(cm.y + Math.sin(r) * 3);
      cg.fillStyle(C('ash0'), 1); cg.fillRect(cm.x - 4, cm.y - 3, 9, 7);
      cg.fillStyle(hexNum(P.device), 1); cg.fillRect(cm.x - 3, cm.y - 2, 7, 5);
      cg.fillStyle(hexNum(P.glass), 1); cg.fillRect(lx - 1, ly - 1, 3, 3);
      cg.fillStyle(hexNum(P.glassLit), 1); cg.fillRect(lx, ly - 1, 1, 1);
      if (cm.lock > 0 || Math.floor(t * 2) % 2 === 0) { cg.fillStyle(C('red'), 1); cg.fillRect(cm.x - 2, cm.y - 1, 1, 1); }
    });
    // the man in gold: two red eyes that follow her
    const PT = LEVEL.portrait, ex = Math.round(PT.x + PT.w / 2), ey = Math.round(PT.y + PT.h * 0.36), look = Math.sign(Math.round((this.kid.x - ex) / 40));
    const eg = this.eyeG; eg.clear();
    eg.fillStyle(C('red'), 1); eg.fillRect(ex - 2 + look, ey, 1, 1); eg.fillRect(ex + 1 + look, ey, 1, 1);
    // what the cameras see, once she has the glasses: hard red light
    const g = this.coneG; g.clear();
    if (this.gl.showing) this.cams.forEach(cm => cm.cone && hardCone(g, cm.cone, C('red'), v));
    this.drawLocks(this.cams, LEVEL.camLock);
    this.drawLaser();
    // her glasses
    if (this.gl.on && !this.dead && this.girl.visible) {
      const k = this.kid, left = Math.round(k.x + k.w / 2) - 5, y = Math.round(k.y + 3);
      eg.fillStyle(hexNum(P.overlay), 1); eg.fillRect(left + (this.girl.flipX ? 2 : 5), y, 3, 1);
    }
    const mg = this.markG; mg.clear(); this.tape.draw(mg); this.gold.draw(mg);
    this.dyn.draw();
    this.drawProps();
    this.drawHud();
    this.drawThings();
  }
  drawSwing(g, p) {
    const px = (x, y, w, h, c) => { g.fillStyle(C(c), 1); g.fillRect(Math.round(x), Math.round(y), w, h); };
    const n = Math.max(2, Math.round(p.len / 3));
    for (let i = 0; i <= n; i++) { const u = i / n; px(p.ax + (p.ex - p.ax) * u, p.ay + (p.ey - p.ay) * u, 1, 1, i % 2 ? 'goldLo' : 'gold'); }
    const x = Math.round(p.ex), y = Math.round(p.ey);
    px(x - 12, y - 1, 25, 5, 'ash0'); px(x - 11, y, 23, 3, 'gold'); px(x - 11, y, 23, 1, 'goldHi');
    for (let i = -9; i <= 9; i += 3) { px(x + i, y - 4, 1, 3, this.lightsOff ? 'ash4' : 'lit'); px(x + i, y + 3 + (Math.abs(i) % 2), 1, 1, 'goldHi'); }
  }
  drawBoards(g, p) {
    if (p.state === 'gone') return;
    const r = p.r, sx = p.state === 'shake' ? (Math.floor(p.t * 30) % 2 ? 1 : -1) : 0, y = Math.round(r.y + (p.dy || 0));
    g.fillStyle(C('ash0'), 1); g.fillRect(r.x + sx - 1, y - 1, r.w + 2, r.h + 2);
    g.fillStyle(C('bronze'), 1); g.fillRect(r.x + sx, y, r.w, r.h);
    g.fillStyle(C('bronzeHi'), 1); g.fillRect(r.x + sx, y, r.w, 1);
    g.fillStyle(C('bronzeLo'), 1); for (let x = r.x + 7; x < r.x + r.w; x += 8) g.fillRect(x + sx, y + 1, 1, r.h - 1);
  }

  // the drawer, the chandelier that drops, the fallen one
  drawProps() {
    const g = this.propG, P = this.P, D = this.drawer, C0 = LEVEL.cabinet.drawer, M = MEZZ; g.clear();
    if (D.open > 0) {
      const o = Math.round(D.open * 3);
      g.fillStyle(hexNum(P.crack), 1); g.fillRect(C0.x - 1, C0.y - 1, C0.w + 2, 2 + o);
      g.fillStyle(hexNum(P.woodHi), 1); g.fillRect(C0.x - 1, C0.y + o, C0.w + 2, C0.h); g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(C0.x - 1, C0.y + o + C0.h - 1, C0.w + 2, 1);
      g.fillStyle(hexNum(P.gold), 1); g.fillRect(C0.x + Math.floor(C0.w / 2) - 1, C0.y + o + 2, 2, 1);
      if (D.fly < 0) { g.fillStyle(hexNum(P.overlay), 1); g.fillRect(C0.x + 4, C0.y + o - 1, 3, 1); g.fillRect(C0.x + 9, C0.y + o - 1, 3, 1); }
    }
    const X = LEVEL.dropper, R = this.drop, x = Math.round(X.x + R.sway), y = Math.round(R.y);
    if (R.phase !== 'down') {
      g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(x, 16, 1, Math.max(0, y - 18));
      if (R.phase === 'fall') g.fillRect(X.x, 16, 1, 6); // the snapped chain end
      g.fillStyle(C('ash0'), 1); g.fillRect(x - 12, y - 2, 25, 5);
      g.fillStyle(hexNum(P.gold), 1); g.fillRect(x - 11, y - 1, 23, 3); g.fillStyle(hexNum(P.goldHi), 1); g.fillRect(x - 11, y - 1, 23, 1);
      for (let i = -9; i <= 9; i += 3) { g.fillStyle(C('goldHi'), 1); g.fillRect(x + i, y + 3 + (Math.abs(i) % 2), 1, 1); g.fillStyle(C(R.phase === 'hang' ? 'ash4' : 'red'), 1); g.fillRect(x + i, y - 5, 1, 3); }
    } else {
      g.fillStyle(C('ash0'), 1); g.fillRect(X.x - 14, M - 7, 28, 7);
      g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(X.x - 13, M - 4, 26, 4); g.fillStyle(hexNum(P.gold), 1); g.fillRect(X.x - 11, M - 6, 20, 2);
      for (let i = -12; i <= 12; i += 2) { g.fillStyle(C(i % 4 ? 'goldHi' : 'bone'), 1); g.fillRect(X.x + i, M - 2 - (Math.abs(i * 7) % 3), 1, 1); }
      g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(X.x, 16, 1, 6);
    }
    // a warning over her head while it creaks
    if (R.phase === 'warn' && !this.dead) { const k = this.kid; this.bubbles.showPrompt(k.x + k.w / 2, k.y - 2, '!'); }
  }

  // the house's laser: hard lines, red; the tell blinks the ports at the shot's height
  drawLaser() {
    const L = this.laserDef, z = this.laser, g = this.laserG; g.clear();
    const all = [...new Set([].concat(...Object.values(L.shots)))], hz = C('red');
    if (z.awake) all.forEach(y => { g.fillStyle(hz, 1); g.fillRect(L.x1 - 3, y - 1, 2, 2); g.fillRect(L.x0, y - 1, 2, 2); });
    if (!z.awake || !z.st) return;
    const st = z.st, ys = L.shots[st.shot], w = L.x1 - L.x0;
    if (st.phase === 'tell' && Math.floor(st.f * 10) % 2 === 0) ys.forEach(y => { g.fillStyle(hz, 1); g.fillRect(L.x1 - 4, y - 1, 3, 3); g.fillRect(L.x0, y - 1, 3, 3); for (let x = L.x1 - 16; x < L.x1 - 4; x += 3) g.fillRect(x, y, 1, 1); });
    if (st.phase === 'tell' && this.gl.showing) {
      const off = Math.floor(this.clock * 40) % 6;
      ys.forEach(y => { g.fillStyle(hz, 1); for (let x = L.x0 + off; x < L.x1; x += 6) g.fillRect(x, y, 2, 1); });
    } else if (st.phase === 'charge') {
      ys.forEach(y => { g.fillStyle(hz, 1); for (let x = L.x0 + (Math.floor(this.clock * 30) & 1); x < L.x1; x += 2) g.fillRect(x, y, 1, 1); g.fillRect(L.x1 - 4, y - 2, 4, 4); });
    } else if (st.phase === 'fire') {
      ys.forEach(y => { g.fillStyle(hz, 1); g.fillRect(L.x0, y - 1, w, 3); g.fillStyle(C('redHi'), 1); g.fillRect(L.x0, y, w, 1); });
    }
  }

  // The glasses' own overlay, fixed to the screen: corner marks that boot up, a channel tag.
  drawHud() {
    const g = this.hudG; g.clear();
    if (!this.glasses || this.done) return;
    const P = this.P, col = hexNum(P.overlay);
    this.gl.drawMeter(g, 18, 166, col);
    if (!this.gl.on) { this.hudT = 0; return; }
    this.gl.drawStatic(g, col);
    if (!this.gl.showing) return;
    this.hudT += 1 / 60;
    if (this.dead) return; // no see-through HUD while the strike plays: it just goes
    const a = 1, s = 8, m = 5;
    if (this.hudT < 0.3 && Math.floor(this.hudT * 20) % 2) return;
    g.fillStyle(col, a);
    [[m, m, 1, 1], [320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy]) => { g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    if (this.hudT > 0.4 && overlay.free(320 - m - 23, 180 - m - 9, 25, 8)) pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, a);
    if (this.hudT < 1.2 && Math.floor(this.hudT * 8) % 2 === 0) pixText(g, 'VIEW', m + 3, m + 3, col, 1, a);
  }

  // the hint line: what a friend standing next to you would say
  hint() {
    if (this.leaving || this.done) return;
    const k = this.kid, x = k.x / T;
    if (this.atDoor()) return overlay.hint('Press W to go through.');
    if (x > 73) return overlay.hint('Jump the low beam. Crouch under the two high ones.');
    if (!this.glasses && x < 20) return overlay.hint('A and D to walk, Space to jump. J to use things or talk.');
    if (!this.glasses) return overlay.hint("Something in here is watching you. You just can't see it.");
    if (x < 20) return overlay.hint('Press L to put the glasses on or off. They show what sees you.');
    if (x < 37 && k.y > MEZZ + 8) return overlay.hint('A camera sweeps the stairs. Wait under the desk till it passes.');
    if (x < 54) return overlay.hint('Jump onto a chandelier. Press Space to let go.');
    return overlay.hint('The boards give way under you. That camera keeps looking up.');
  }
}
