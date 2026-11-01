// Episode 2: the gallery. Inside the front door, a pristine hall that wears out the deeper she
// goes. Glasses in a sideboard drawer show what the cameras see (a chatty cleaning robot asks her
// not to touch the drawer). A sweeping camera covers the corridor, a chandelier drops, a broken
// camera keeps turning to look at the Moon, and a laser wakes up in the last hall.
import { Music } from '../core/music.js';
import { hexNum, flat, Painter } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { TILE, GROUND, LEVEL, buildMap, paintLevel, camAngle, laserAt, beamHits } from '../art/gallery.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode } from '../core/side.js';
import { goNext } from '../core/flow.js';
import { NOTICE } from '../data/dialogue.js';
import { Glasses } from '../core/glasses.js';

const rgb = c => { const n = hexNum(c); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

export class Gallery extends SideEpisode {
  constructor() { super('gallery'); }

  create(data) {
    this.initSide('ep2', LEVEL, buildMap());
    const P = this.P, LW = LEVEL.w * TILE;
    makeSprites(this, P);
    this.makeProps(P);
    const lvl = paintLevel(P); lvl.toTexture(this, 'gl_level'); this.marks = lvl.marks;
    this.pixelCamera(LW, P.wallLo);
    this.add.image(0, 0, 'gl_level').setOrigin(0).setDepth(0);
    this.glowG = this.add.graphics().setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    this.robotSprite = this.add.image(0, GROUND, 'robot_a').setOrigin(0.5, 1).setDepth(3);
    this.propG = this.add.graphics().setDepth(1.5);
    this.glassesSprite = this.add.image(0, 0, 'glasses').setOrigin(0.5, 1).setDepth(4.6).setVisible(false);
    this.camG = this.add.graphics().setDepth(3);
    this.commonLayers();
    this.eyeG = this.add.graphics().setDepth(4.5);
    this.laserG = this.add.graphics().setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    this.hudG = this.addParallax(this.add.graphics().setDepth(20), 0);

    // particles: glints on gold and glass, dust in the moonlight, sparks from the broken camera
    this.sparkle = this.add.particles(0, 0, 'sparkle', { lifespan: 520, scale: { start: 0.2, end: 1, ease: 'Sine.easeOut' }, alpha: { start: 1, end: 0 }, emitting: false, blendMode: 'ADD' }).setDepth(6);
    const H = LEVEL.hole;
    this.add.particles(0, 0, 'dot', { x: { min: H.x0 - 4, max: H.x1 + 24 }, y: { min: 18, max: 150 }, speedY: { min: 1, max: 5 }, speedX: { min: -2, max: 3 }, lifespan: 6000, frequency: 90, alpha: { values: [0, 0.55, 0.5, 0], interpolation: 'linear' }, tint: [hexNum(P.shaft), hexNum(flat(P.dust))], blendMode: 'ADD' }).setDepth(5);
    this.sparks = this.add.particles(0, 0, 'dot', { speed: { min: 18, max: 55 }, angle: { min: 20, max: 160 }, gravityY: 260, lifespan: { min: 300, max: 700 }, tint: [hexNum(P.lamp), 0xffffff], emitting: false, blendMode: 'ADD' }).setDepth(6);

    this.glasses = false; this.hudT = 0; this.sparkT = 0; this.zapT = 2;
    this.gl = new Glasses({ has: false });
    this.skipPoints = [10 * TILE, 27 * TILE, 45 * TILE, 64 * TILE, 84 * TILE];
    this.robot = { x: LEVEL.robot.x0 + 40, dir: 1, line: 0, talkT: 0 };
    this.drawer = { open: 0, opening: false, fly: -1 };
    this.drop = { phase: 'hang', t: 0, y: LEVEL.dropper.hang, sway: 0 };
    this.props = LEVEL.props.map(r => Object.assign({}, r));
    this.robotProp = { id: 'robot', x: 0, y: GROUND - 6, w: 10, h: 6 }; this.props.push(this.robotProp);
    const CB = LEVEL.cabinet, SD = LEVEL.staffDoor;
    this.cabinetThing = { x0: CB.x0, x1: CB.x1, y0: CB.top, y1: GROUND, use: () => this.openDrawer() };
    this.robotThing = { x0: 0, x1: 0, y0: GROUND - 8, y1: GROUND, use: () => this.robotTalk() };
    this.things.push(this.cabinetThing, this.robotThing, { x0: SD.x, x1: SD.x + SD.w, y0: SD.y, y1: GROUND, label: 'E', use: () => this.enterRoom('staff') });
    // things to look at: the hall's portraits, then the worn middle
    const N = NOTICE.gallery, T = TILE, look = (x0, x1, py, lines, y0) => this.addLook({ x0, x1, y0: y0 != null ? y0 : 110, py, lines });
    look(50, 80, 106, N.man); look(164, 200, 108, N.family); look(290, 322, 106, N.boy); look(398, 428, 106, N.cake);
    look(482, 524, 128, N.desk); look(604, 628, 134, N.bust);
    look(732, 760, 104, N.missing); look(766, 790, 124, N.column); look(804, 834, GROUND - 36, N.fallen);
    look(866, 894, 151, N.chandelier, 140); look(936, 954, 150, N.robot, 140); look(990, 1012, 50, N.camera, 100);
    this.cams = LEVEL.cameras.map(c => Object.assign({}, c, { lock: 0, cone: null, angle: 0 }));
    this.laser = { awake: false, t: 0, phase: '', n: -2, st: null };
    // the laser's order is new every take, and its rhythm a little different: no learning it by heart
    const order = []; for (let i = 0; i < 10; i++) { let s = Math.random() < 0.5 ? 'low' : 'high'; if (i >= 2 && order[i - 1] === s && order[i - 2] === s) s = s === 'low' ? 'high' : 'low'; order.push(s); }
    this.laserDef = Object.assign({}, LEVEL.laser, { order, idle: LEVEL.laser.idle * (0.8 + Math.random() * 0.4), first: LEVEL.laser.first * (0.7 + Math.random() * 0.6) });
    this.drawBodies();
    this.spawn();
    this.followGirl();
    const fromCut = !!(data && data.fromCut);
    this.cameras.main.fadeIn(fromCut ? 900 : 350);
    this.beds = { lounge: Sound.lounge(0.04), wind: Sound.wind(0.0001), hum: Sound.hum(0.0001) };
    Music.play('housedeep', { level: 0.0001 });
    this.events.once('shutdown', () => Object.values(this.beds).forEach(b => b.stop(0.4)));
    this.takeNote({ fromCut }, 2, 'The Gallery');
    window.__game = { scene: this, state };
  }

  makeProps(P) {
    const add = (key, w, h, draw) => { const p = new Painter(w, h); draw(p); p.toTexture(this, key); };
    const robot = (key, led, step) => add(key, 12, 7, p => {
      p.rect(4, 0, 4, 1, P.robot); p.rect(2, 1, 8, 1, P.robot); p.rect(1, 2, 10, 2, P.robot); p.px(7, 2, led);
      p.rect(0, 4, 12, 1, P.device); p.rect(1, 5, 10, 1, P.device); p.px(step ? 3 : 2, 6, P.crack); p.px(step ? 8 : 9, 6, P.crack);
    });
    robot('robot_a', P.robotLed, 0); robot('robot_b', P.robot, 1); robot('robot_c', P.overlay, 0);
    add('glasses', 9, 3, p => { p.rect(0, 0, 4, 2, P.overlay); p.rect(5, 0, 4, 2, P.overlay); p.px(4, 0, P.device); p.px(1, 0, '#ffffff'); p.px(6, 0, '#ffffff'); p.rect(0, 2, 9, 1, P.device); });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (this.commonKeys()) { c.endFrame(); return; }
    if (this.done) { c.endFrame(); return; }
    if (!this.dead && !this.leaving) { this.moveKid(dt); this.updateThings(); if (c.glasses()) this.gl.toggle(); }
    else if (this.dead && this.girl.visible) this.settle(dt);
    this.gl.update(dt);
    this.updateDrawer(dt);
    this.updateDropper(dt);
    this.updateCameras(dt);
    this.updateLaser(dt);
    this.updateRobot(dt);
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
    const R = this.robot; if (Math.abs(R.x - this.kid.x) < 200) this.time.delayedCall(500, () => this.robotSay('I saw that.'));
  }
  updateDrawer(dt) {
    const D = this.drawer;
    if (!D.opening) return;
    if (D.open < 1) { D.open = Math.min(1, D.open + dt / 0.3); if (D.open >= 1) { D.fly = 0; Sound.tone(880, 0.08, 'sine', 0.02); } return; }
    if (D.fly >= 0 && D.fly < 1) {
      D.fly = Math.min(1, D.fly + dt / 0.45);
      const C = LEVEL.cabinet.drawer, k = this.kid, sx = C.x + C.w / 2, sy = C.y, ex = k.x + k.w / 2, ey = k.y + 3, u = D.fly;
      this.glassesSprite.setVisible(u < 1).setPosition(Math.round(sx + (ex - sx) * u), Math.round(sy + (ey - sy) * u - Math.sin(u * Math.PI) * 18));
      if (u >= 1) this.putOnGlasses();
    }
  }
  putOnGlasses() {
    this.glasses = true; this.hudT = 0; this.gl.has = true; this.gl.on = true;
    this.time.delayedCall(450, () => this.itemPanel('glasses'));
    const [r, g, b] = rgb(this.P.overlay); this.cameras.main.flash(220, r, g, b);
    Sound.tone(660, 0.09, 'sine', 0.03, null, 0.3); this.time.delayedCall(110, () => Sound.tone(990, 0.16, 'sine', 0.03, null, 0.3));
  }

  // ------------------------------------------------------------------ the chandelier that drops
  updateDropper(dt) {
    const D = this.drop, X = LEVEL.dropper, k = this.kid, kc = k.x + k.w / 2;
    if (D.phase === 'hang') {
      D.sway = Math.sin(this.clock * 1.3) * 0.6;
      if (!this.dead && !this.leaving && kc > X.x - 26 && kc < X.x + 8 && k.y + k.h > GROUND - 24) {
        D.phase = 'warn'; D.t = 0;
        Sound.tone(95, 0.45, 'sawtooth', 0.04, 70); Sound.noise(0.4, 0.06, 900);
        this.cameras.main.shake(120, 0.003);
        this.sparks.explode(6, X.x, 18);
      }
    } else if (D.phase === 'warn') {
      D.t += dt; D.sway = Math.sin(D.t * 40) * 2;
      if (Math.floor(D.t * 20) % 3 === 0) this.sparks.emitParticleAt(X.x + (Math.random() - 0.5) * 6, 20, 1);
      if (D.t >= X.warn) { D.phase = 'fall'; D.t = 0; D.v = 0; Sound.tone(400, 0.3, 'square', 0.02, 120); }
    } else if (D.phase === 'fall') {
      D.v += 1600 * dt; D.y += D.v * dt; D.sway *= 0.9;
      if (D.y >= GROUND - 6) {
        D.y = GROUND - 6; D.phase = 'down';
        this.cameras.main.shake(260, 0.014); Sound.noise(0.6, 0.18, 3000); Sound.tone(1800, 0.25, 'triangle', 0.025, 2600);
        for (let i = 0; i < 14; i++) this.sparkle.emitParticleAt(X.x + (Math.random() - 0.5) * 30, GROUND - 4 - Math.random() * 8, 1);
        this.burst.explode(10, X.x, GROUND - 4);
        this.props.push({ id: 'fallen chandelier', x: X.x - 13, y: GROUND - 7, w: 26, h: 7 });
        const hit = !window.__noDeath && k.x + k.w > X.x - X.footprint && k.x < X.x + X.footprint && k.y + k.h > GROUND - 30;
        if (hit && !this.dead) this.die({ x: X.x, y: GROUND - 10, id: 'chandelier', direct: true });
      }
    }
  }

  // ------------------------------------------------------------------ cameras
  updateCameras(dt) {
    this.cams.forEach(cm => {
      cm.angle = camAngle(cm, this.clock);
      cm.cone = this.cone(cm.x, cm.y, cm.angle, cm.half, cm.range);
      this.watch(cm, dt, LEVEL.camLock);
    });
    // the broken camera sparks now and then
    this.zapT -= dt;
    if (this.zapT <= 0) { this.zapT = 2.5 + Math.random() * 3; const cm = this.cams[1]; this.sparks.explode(5, cm.x - 2, cm.y + 2); if (Math.abs(this.kid.x - cm.x) < 260) Sound.noise(0.08, 0.04, 5000); }
  }

  // ------------------------------------------------------------------ the laser
  updateLaser(dt) {
    const L = this.laserDef, k = this.kid, z = this.laser;
    if (!z.awake) {
      if (!this.dead && k.x + k.w > L.x0 - 12) { z.awake = true; z.t = 0; Sound.tone(70, 0.9, 'sawtooth', 0.05, 140); this.beds.hum.set(0.05, 1.2); this.cameras.main.shake(160, 0.004); }
      return;
    }
    z.t = window.__laserT != null ? window.__laserT : z.t + dt; // tests can hold the laser at a moment
    const st = laserAt(L, z.t); z.st = st;
    if (st.phase !== z.phase || st.n !== z.n) {
      if (st.phase === 'tell') { Sound.tone(1320, 0.05, 'square', 0.014); this.time.delayedCall(130, () => Sound.tone(st.shot === 'low' ? 990 : 1760, 0.06, 'square', 0.014)); }
      if (st.phase === 'charge') Sound.charge();
      if (st.phase === 'fire') { Sound.tone(1500, 0.35, 'sawtooth', 0.03, 1200); Sound.noise(0.3, 0.05, 7000); }
      z.phase = st.phase; z.n = st.n;
    }
    if (st.phase === 'fire' && !this.dead && !this.leaving && !window.__noDeath && k.x + k.w > L.x0 && k.x < L.x1) {
      const y = L.shots[st.shot].find(yy => beamHits(k.y, k.y + k.h, yy));
      if (y != null) this.die({ x: L.x1 - 2, y, id: L.id, direct: true }); // the house's own laser, not the satellite
    }
  }

  // ------------------------------------------------------------------ the cleaning robot
  updateRobot(dt) {
    const R = this.robot, B = LEVEL.robot, k = this.kid, talking = this.bubbles.busy('robot');
    const near = !this.dead && Math.abs(R.x - (k.x + k.w / 2)) < 22 && k.y + k.h > GROUND - 24;
    if (!near && !talking) {
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
  robotStyle() {
    // machines speak in caption cyan, in every look
    return { ink: 0x4ae8ff, pitch: 1180, leave: 64 };
  }
  robotSay(text) { this.bubbles.say('robot', text, () => ({ x: this.robot.x, y: GROUND - 8 }), Object.assign(this.robotStyle(), { leave: 200 })); }
  robotTalk() {
    const before = ['Welcome home. Please wipe your feet.', 'You are not on the guest list. That is fine. Nobody is.', 'I have cleaned this floor 41,207 times. It was clean every time.', 'Please do not touch the drawer.', 'I did not say anything about a drawer.', 'Mind the cameras. They are very shy.'];
    const after = ['Those suit you.', 'The last one wore them too.', 'Please return them when you are done. Nobody does.', 'I will tidy up after you. I always do.'];
    if (!this.robotSrc) this.robotSrc = { lines: () => this.glasses || this.drawer.opening ? after : before, i: 0, loop: true, from: 1 };
    const after2 = this.glasses || this.drawer.opening;
    if (after2 && !this.robotSrc.after) { this.robotSrc.after = true; this.robotSrc.i = 0; this.robotSrc.from = 0; }
    this.bubbles.press('robot', this.robotSrc, () => ({ x: this.robot.x, y: GROUND - 8 }), this.robotStyle());
  }

  // ------------------------------------------------------------------ the door
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

  // ------------------------------------------------------------------ ambience
  updateAmbience(dt) {
    const x = this.kid.x, H = LEVEL.hole, clamp = v => Math.max(0, Math.min(1, v));
    // the house music thins out as the rooms wear; wind comes in through the roof
    if (!this.leaving) {
      this.beds.lounge.set(0.045 * clamp(1 - (x - 30 * TILE) / (22 * TILE)) + 0.0001, 0.5);
      // deeper in, the house's own music thins out and something lower takes over
      const deep = clamp((x - 34 * TILE) / (20 * TILE)); if (Math.abs(deep - (this.deepLv || 0)) > 0.04) { this.deepLv = deep; Music.level(0.0001 + deep, 0.8); }
      const hc = (H.x0 + H.x1) / 2; this.beds.wind.set(0.09 * clamp(1 - Math.abs(x - hc) / 280) + 0.0001, 0.5);
    }
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = 0.14;
      const v = this.cameras.main.worldView, vis = this.marks.filter(m => m.kind === 'glint' && m.x > v.x && m.x < v.x + v.width);
      if (vis.length) { const m = vis[Math.floor(Math.random() * vis.length)]; this.sparkle.emitParticleAt(m.x, m.y, 1); }
    }
  }

  // ------------------------------------------------------------------ drawing
  draw() {
    const P = this.P, t = this.clock;
    this.drawGirl();
    // sconces flicker, more as the house wears
    const gg = this.glowG; gg.clear();
    this.marks.forEach((m, i) => {
      if (m.kind !== 'sconce') return;
      const worn = m.x > 40 * TILE, fl = worn ? (Math.sin(t * 23 + i) > 0.6 ? 0.2 : 1) * (0.7 + 0.3 * Math.sin(t * 9 + i)) : 0.85 + 0.15 * Math.sin(t * 5 + i * 2);
      gg.fillStyle(hexNum(P.lamp), 0.05 * fl); gg.fillCircle(m.x, m.y, 12); gg.fillStyle(hexNum(P.lamp), 0.12 * fl); gg.fillCircle(m.x, m.y, 5);
    });
    // camera bodies: housing, a lens that turns, a red light
    const cg = this.camG; cg.clear();
    this.cams.forEach(cm => {
      const r = cm.angle * Math.PI / 180, lx = Math.round(cm.x + Math.cos(r) * 3), ly = Math.round(cm.y + Math.sin(r) * 3);
      cg.fillStyle(hexNum(P.device), 1); cg.fillRect(cm.x - 3, cm.y - 2, 7, 5);
      cg.fillStyle(hexNum(P.wallLine), 1); cg.fillRect(cm.x - 3, cm.y + 2, 7, 1);
      cg.fillStyle(hexNum(P.glass), 1); cg.fillRect(lx - 1, ly - 1, 3, 3);
      cg.fillStyle(hexNum(P.glassLit), 1); cg.fillRect(lx, ly - 1, 1, 1);
      const on = cm.lock > 0 || Math.floor(t * 2) % 2 === 0;
      if (on) { cg.fillStyle(hexNum(P.led), 1); cg.fillRect(cm.x - 2, cm.y - 1, 1, 1); }
    });
    // what the cameras see, once she has the glasses
    const bg = this.beamG; bg.clear();
    if (this.gl.showing) this.cams.forEach(cm => this.drawView(bg, cm));
    this.drawLocks(this.cams, LEVEL.camLock);
    this.drawLaser();
    // her glasses
    const eg = this.eyeG; eg.clear();
    if (this.gl.on && !this.dead && this.girl.visible) {
      const k = this.kid, left = Math.round(k.x + k.w / 2) - 4, top = Math.round(k.y + k.h) - (k.crouch ? 9 : 14), row = k.crouch ? 1 : 2;
      eg.fillStyle(hexNum(P.overlay), 1); eg.fillRect(left + (k.face < 0 ? 1 : 4), top + row, 3, 1);
    }
    this.drawProps();
    this.drawHud();
    this.drawThings();
  }

  // the drawer, the chandelier that drops, the fallen one
  drawProps() {
    const g = this.propG, P = this.P, D = this.drawer, C = LEVEL.cabinet.drawer; g.clear();
    if (D.open > 0) {
      const o = Math.round(D.open * 3);
      g.fillStyle(hexNum(P.crack), 1); g.fillRect(C.x - 1, C.y - 1, C.w + 2, 2 + o);
      g.fillStyle(hexNum(P.woodHi), 1); g.fillRect(C.x - 1, C.y + o, C.w + 2, C.h); g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(C.x - 1, C.y + o + C.h - 1, C.w + 2, 1);
      g.fillStyle(hexNum(P.gold), 1); g.fillRect(C.x + Math.floor(C.w / 2) - 1, C.y + o + 2, 2, 1);
      if (D.fly < 0) { g.fillStyle(hexNum(P.overlay), 1); g.fillRect(C.x + 4, C.y + o - 1, 3, 1); g.fillRect(C.x + 9, C.y + o - 1, 3, 1); }
    }
    const X = LEVEL.dropper, R = this.drop, x = Math.round(X.x + R.sway), y = Math.round(R.y);
    if (R.phase !== 'down') {
      g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(x, 16, 1, Math.max(0, y - 18));
      if (R.phase === 'fall') { g.fillRect(X.x, 16, 1, 6); } // the snapped chain end
      g.fillStyle(hexNum(P.gold), 1); g.fillRect(x - 10, y - 1, 21, 3); g.fillStyle(hexNum(P.goldHi), 1); g.fillRect(x - 12, y - 2, 25, 1);
      for (let i = -9; i <= 9; i += 3) { g.fillStyle(hexNum(P.glint), 1); g.fillRect(x + i, y + 3 + (Math.abs(i) % 6 ? 1 : 0), 1, 1); g.fillStyle(hexNum(P.glassLit), 1); g.fillRect(x + i, y + 5, 1, 1); }
      for (let i = -8; i <= 8; i += 4) { g.fillStyle(hexNum(R.phase === 'hang' ? P.lamp : P.hazard), 1); g.fillRect(x + i, y - 5, 1, 3); }
    } else {
      g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(X.x - 13, GROUND - 4, 26, 4); g.fillStyle(hexNum(P.gold), 1); g.fillRect(X.x - 11, GROUND - 6, 20, 2);
      for (let i = -12; i <= 12; i += 2) { g.fillStyle(hexNum(i % 4 ? P.glassLit : P.glint), 1); g.fillRect(X.x + i, GROUND - 2 - (Math.abs(i * 7) % 3), 1, 1); }
      g.fillStyle(hexNum(P.goldLo), 1); g.fillRect(X.x, 16, 1, 6);
    }
    // a warning over her head while it creaks
    if (R.phase === 'warn' && !this.dead) { const k = this.kid; this.bubbles.showPrompt(k.x + k.w / 2, k.y - 2, '!'); }
  }

  // A view cone as the glasses show it: a faint fill, hard edges, a scan line moving out.
  drawView(g, cm) {
    const P = this.P, lockMix = Math.min(1, cm.lock / LEVEL.camLock), col = hexNum(lockMix > 0 ? P.hazard : P.overlay), pts = cm.cone, o = pts[0];
    g.fillStyle(col, 0.05 + lockMix * 0.16); g.fillPoints(pts, true);
    g.lineStyle(1, col, 0.32 + lockMix * 0.5); g.lineBetween(o.x, o.y, pts[1].x, pts[1].y); g.lineBetween(o.x, o.y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    const d = (this.clock * 90) % cm.range;
    g.fillStyle(col, 0.5);
    for (let j = 1; j < pts.length; j++) { const dx = pts[j].x - o.x, dy = pts[j].y - o.y, len = Math.hypot(dx, dy); if (d < len) g.fillRect(Math.round(o.x + dx / len * d), Math.round(o.y + dy / len * d), 1, 1); }
  }

  drawLaser() {
    const P = this.P, L = this.laserDef, z = this.laser, g = this.laserG, t = this.clock; g.clear();
    const all = [...new Set([].concat(...Object.values(L.shots)))], hz = hexNum(P.hazard);
    all.forEach(y => { g.fillStyle(hz, z.awake ? 0.6 : 0.15); g.fillRect(L.x1 - 3, y - 1, 2, 2); g.fillRect(L.x0, y - 1, 2, 2); });
    if (!z.awake || !z.st) return;
    const st = z.st, ys = L.shots[st.shot], w = L.x1 - L.x0;
    if (st.phase === 'tell' && this.gl.showing) {
      const on = Math.floor(st.f * 10) % 2 === 0, off = Math.floor(t * 40) % 6;
      ys.forEach(y => { g.fillStyle(hexNum(P.overlay), on ? 0.7 : 0.35); for (let x = L.x0 + off; x < L.x1; x += 6) g.fillRect(x, y, 3, 1); });
    } else if (st.phase === 'charge') {
      const a = 0.06 + 0.3 * (st.f - L.tell) / L.charge;
      ys.forEach(y => { g.fillStyle(hz, a); g.fillRect(L.x0, y - 1, w, 2); g.fillStyle(hz, 0.9); g.fillRect(L.x1 - 4, y - 2, 4, 4); });
    } else if (st.phase === 'fire') {
      const fl = 0.8 + 0.2 * Math.sin(t * 90);
      ys.forEach(y => { g.fillStyle(hz, 0.28 * fl); g.fillRect(L.x0, y - 3, w, 6); g.fillStyle(hz, 0.7); g.fillRect(L.x0, y - 1, w, 2); g.fillStyle(hexNum(P.hazardCore), 1); g.fillRect(L.x0, y, w, 1); });
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
    const a = Math.min(0.55, this.hudT * 1.5) * (this.dead ? 0.3 : 1), s = 8, m = 5;
    g.fillStyle(col, a);
    [[m, m, 1, 1], [320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy]) => { g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    if (this.hudT > 0.4 && overlay.free(320 - m - 23, 180 - m - 9, 25, 8)) pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, a);
    if (this.hudT < 1.2 && Math.floor(this.hudT * 8) % 2 === 0) pixText(g, 'VIEW', m + 3, m + 3, col, 1, a);
  }

  hint() {
    const x = this.kid.x / TILE;
    if (this.leaving || this.done) return;
    if (!this.glasses && x < 26) return overlay.hint('Arrows or A/D move. Space jumps. Down crouches. E uses things and talks to things.');
    if (!this.glasses) return overlay.hint('Something in this corridor is watching you. You cannot see it yet.');
    if (x < 26) return overlay.hint('The glasses show what the cameras see, in short looks: G puts them on and takes them off. A camera takes a moment to lock on.');
    if (x < 45) return overlay.hint('A camera sweeps the corridor. Stand under the desk while it looks your way.');
    if (x < 63) return overlay.hint('A broken camera. It keeps turning to the hole in the roof. Move while it looks away.');
    return overlay.hint('The laser shows its aim first. One low line: jump it. Two lines: crouch under them. Then Up or E at the door.');
  }
}
