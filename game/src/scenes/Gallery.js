// Episode 2: the gallery. Inside the front door, a pristine hall that wears out the deeper she
// goes. Glasses on a bench show what the cameras see. A sweeping camera covers the corridor, a
// broken one keeps turning to look at the Moon, and a laser wakes up in the last hall.
import { hexNum, flat, Painter } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { TILE, GROUND, LEVEL, buildMap, paintLevel, camAngle, laserAt, beamHits } from '../art/gallery.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode } from '../core/side.js';

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
    this.glassesSprite = this.add.image(LEVEL.glasses.x, LEVEL.glasses.y, 'glasses').setOrigin(0.5, 1).setDepth(3);
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
    this.robot = { x: LEVEL.robot.x0 + 40, dir: 1 };
    this.cams = LEVEL.cameras.map(c => Object.assign({}, c, { lock: 0, cone: null, angle: 0 }));
    this.laser = { awake: false, t: 0, phase: '', n: -2, st: null };
    this.drawBodies();
    this.spawn();
    this.followGirl();
    const fromCut = !!(data && data.fromCut);
    this.cameras.main.fadeIn(fromCut ? 900 : 350);
    this.beds = { lounge: Sound.lounge(0.04), wind: Sound.wind(0.0001), hum: Sound.hum(0.0001) };
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
    if (!this.dead && !this.leaving) { this.moveKid(dt); this.checkGlasses(); }
    this.updateCameras(dt);
    this.updateLaser(dt);
    this.updateRobot(dt);
    this.updateAmbience(dt);
    this.draw();
    this.hint();
    c.endFrame();
  }

  // ------------------------------------------------------------------ the glasses
  checkGlasses() {
    const k = this.kid, G = LEVEL.glasses;
    if (this.glasses || Math.abs(k.x + k.w / 2 - G.x) > 9 || k.y + k.h < LEVEL.bench.top - 40) return;
    this.glasses = true; this.hudT = 0;
    this.glassesSprite.setVisible(false);
    const [r, g, b] = rgb(this.P.overlay); this.cameras.main.flash(220, r, g, b);
    Sound.tone(660, 0.09, 'sine', 0.03, null, 0.3); this.time.delayedCall(110, () => Sound.tone(990, 0.16, 'sine', 0.03, null, 0.3));
    overlay.note('Glasses on', 1600);
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
    const L = LEVEL.laser, k = this.kid, z = this.laser;
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
      if (y != null) this.die({ x: L.x1 - 2, y, id: L.id });
    }
  }

  // ------------------------------------------------------------------ the cleaning robot
  updateRobot(dt) {
    const R = this.robot, B = LEVEL.robot, k = this.kid, near = !this.dead && Math.abs(R.x - (k.x + k.w / 2)) < 20 && k.y + k.h > GROUND - 20;
    if (!near) { R.x += R.dir * B.speed * dt; if (R.x > B.x1) { R.x = B.x1; R.dir = -1; } if (R.x < B.x0) { R.x = B.x0; R.dir = 1; } }
    const tex = near ? 'robot_c' : Math.floor(this.clock * 4) % 2 ? 'robot_a' : 'robot_b';
    this.robotSprite.setTexture(tex).setPosition(Math.round(R.x), GROUND).setFlipX(R.dir < 0);
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
    this.time.delayedCall(5600, () => this.scene.start('satellite', { batch: 2 }));
  }

  // ------------------------------------------------------------------ ambience
  updateAmbience(dt) {
    const x = this.kid.x, H = LEVEL.hole, clamp = v => Math.max(0, Math.min(1, v));
    // the house music thins out as the rooms wear; wind comes in through the roof
    if (!this.leaving) {
      this.beds.lounge.set(0.045 * clamp(1 - (x - 30 * TILE) / (22 * TILE)) + 0.0001, 0.5);
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
    if (this.glasses) this.cams.forEach(cm => this.drawView(bg, cm));
    this.drawLocks(this.cams, LEVEL.camLock);
    this.drawLaser();
    // her glasses
    const eg = this.eyeG; eg.clear();
    if (this.glasses && !this.dead && this.girl.visible) {
      const k = this.kid, left = Math.round(k.x + k.w / 2) - 4, top = Math.round(k.y + k.h) - (k.crouch ? 9 : 14), row = k.crouch ? 1 : 2;
      eg.fillStyle(hexNum(P.overlay), 1); eg.fillRect(left + (k.face < 0 ? 1 : 4), top + row, 3, 1);
    }
    this.drawHud();
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
    const P = this.P, L = LEVEL.laser, z = this.laser, g = this.laserG, t = this.clock; g.clear();
    const all = [...new Set([].concat(...Object.values(L.shots)))], hz = hexNum(P.hazard);
    all.forEach(y => { g.fillStyle(hz, z.awake ? 0.6 : 0.15); g.fillRect(L.x1 - 3, y - 1, 2, 2); g.fillRect(L.x0, y - 1, 2, 2); });
    if (!z.awake || !z.st) return;
    const st = z.st, ys = L.shots[st.shot], w = L.x1 - L.x0;
    if (st.phase === 'tell' && this.glasses) {
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
    this.hudT += 1 / 60;
    const P = this.P, col = hexNum(P.overlay), a = Math.min(0.55, this.hudT * 1.5) * (this.dead ? 0.3 : 1), s = 8, m = 5;
    g.fillStyle(col, a);
    [[m, m, 1, 1], [320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy]) => { g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    if (this.hudT > 0.4) pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, a);
    if (this.hudT < 1.2 && Math.floor(this.hudT * 8) % 2 === 0) pixText(g, 'VIEW', m + 3, m + 3, col, 1, a);
  }

  hint() {
    const x = this.kid.x / TILE;
    if (this.leaving || this.done) return;
    if (!this.glasses) return overlay.hint('Arrows or A/D move. Space jumps. Down crouches. There are glasses on the bench: jump up and take them.');
    if (x < 26) return overlay.hint('The glasses show what the cameras see. A camera takes a moment to lock on.');
    if (x < 45) return overlay.hint('A camera sweeps the corridor. Stand under the desk while it looks your way.');
    if (x < 63) return overlay.hint('A broken camera. It keeps turning to the hole in the roof. Move while it looks away.');
    return overlay.hint('The laser shows its aim first. One low line: jump it. Two lines: crouch under them. Then Up or E at the door.');
  }
}
