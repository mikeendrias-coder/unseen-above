// Episode 1: the grounds. Side view, from the ash outside the gate to the front door.
// Searchlights and drones are both the spectacle and the surveillance. A death restarts the
// episode, and the body stays where it fell, older on every take.
import { LOOKS } from '../art/palettes.js';
import { hexNum, flat, rng } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { TILE, VIEW_W, VIEW_H, GROUND, LEVEL, buildMap, paintSky, paintMoon, paintCity, paintLevel } from '../art/estate.js';
import { makeControls } from '../core/controls.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { display, pixelZoom } from '../core/display.js';

const EP = 'ep1';
const K = { w: 8, hStand: 14, hCrouch: 9, run: 72, crouchRun: 34, accG: 900, accA: 585, jumpV: 236, g: 690, maxFall: 260, coyote: 0.1, buffer: 0.1, hold: 0.2 };
const LOCK = 0.42; // seconds inside a light before the strike
const inPoly = (pts, x, y) => { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };

// Drone show figures, as point lists in a 64 x 30 box.
function outline(pts, n) {
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l]); total += l; }
  const out = []; for (let k = 0; k < n; k++) { let d = (k / n) * total; for (const [a, b, l] of segs) { if (d <= l) { out.push([a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]); break; } d -= l; } }
  return out;
}
const N_DRONES = 84;
const FIGURES = {
  diamond: () => outline([[14, 8], [22, 0], [42, 0], [50, 8], [32, 30], [14, 8], [50, 8], [42, 0], [36, 8], [32, 0], [28, 8], [22, 0]], N_DRONES),
  crown: () => outline([[10, 28], [10, 6], [20, 18], [32, 0], [44, 18], [54, 6], [54, 28], [10, 28]], N_DRONES),
  ring: () => Array.from({ length: N_DRONES }, (_, i) => { const a = i / N_DRONES * Math.PI * 2; return [32 + Math.cos(a) * 15, 15 + Math.sin(a) * 15]; }),
  tv: () => outline([[22, -6], [30, 4], [38, -6], [30, 4], [14, 4], [50, 4], [50, 30], [14, 30], [14, 4], [20, 10], [27, 10], [27, 24], [20, 24], [20, 10], [33, 10], [42, 10], [36, 24]], N_DRONES)
};
const SHOW = [['diamond', 7], ['crown', 7], ['ring', 4], ['diamond', 6], ['tv', 1.1], ['crown', 6]];

export class Grounds extends Phaser.Scene {
  constructor() { super('grounds'); }

  create(data) {
    this.P = LOOKS[state.look];
    const P = this.P;
    this.ep = state.episode(EP);
    makeSprites(this, P);
    // painted layers
    const LW = LEVEL.w * TILE;
    paintSky(P, VIEW_W).toTexture(this, 'g_sky');
    paintMoon(P).toTexture(this, 'g_moon');
    const city = paintCity(P, Math.ceil(LW * 0.15) + VIEW_W); city.toTexture(this, 'g_city');
    const lvl = paintLevel(P); lvl.toTexture(this, 'g_level');
    this.marks = lvl.marks; this.cityMarks = city.marks;
    this.map = buildMap();

    const cam = this.cameras.main;
    cam.setZoom(pixelZoom()); cam.setBounds(0, 0, LW, VIEW_H); cam.setRoundPixels(true); cam.setBackgroundColor(hexNum(P.skyTop));
    // Parallax layers: with a zoomed camera, scroll factors below 1 need an offset (see place()).
    this.par = [];
    this.par.push({ o: this.add.image(0, 0, 'g_sky').setOrigin(0).setDepth(-10), f: 0, x: 0, y: 0 });
    this.par.push({ o: this.add.image(250, 22, 'g_moon').setDepth(-9), f: 0.02, x: 250, y: 22 });
    this.skyFx = this.add.graphics().setDepth(-8).setBlendMode(Phaser.BlendModes.ADD); this.par.push({ o: this.skyFx, f: 0.3, x: 0, y: 0 });
    this.showG = this.add.graphics().setDepth(-7); this.par.push({ o: this.showG, f: 0.25, x: 0, y: 0 });
    this.fireworksG = this.add.graphics().setDepth(-7); this.par.push({ o: this.fireworksG, f: 0.2, x: 0, y: 0 });
    this.par.push({ o: this.add.image(0, 0, 'g_city').setOrigin(0).setDepth(-6), f: 0.15, x: 0, y: 0 });
    this.cityFx = this.add.graphics().setDepth(-6).setBlendMode(Phaser.BlendModes.ADD); this.par.push({ o: this.cityFx, f: 0.15, x: 0, y: 0 });
    this.place();
    this.add.image(0, 0, 'g_level').setOrigin(0).setDepth(0);
    this.twinkleG = this.add.graphics().setDepth(1);
    this.bodyLayer = this.add.layer().setDepth(2);
    this.droneSprites = LEVEL.drones.map(() => this.add.sprite(0, 0, 'drone_a').setDepth(3));
    this.girl = this.add.image(0, 0, 'girl_stand').setOrigin(0.5, 1).setDepth(4);
    this.beamG = this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
    this.fxG = this.add.graphics().setDepth(7);
    this.strikeG = this.add.graphics().setDepth(8).setBlendMode(Phaser.BlendModes.ADD);

    // particles: fountain spray, ash outside the wall, sparkles on gold, the death burst
    const fountain = this.marks.find(m => m.kind === 'fountain');
    this.add.particles(fountain.x, fountain.y, 'dot', { speedY: { min: -46, max: -26 }, speedX: { min: -14, max: 14 }, gravityY: 90, lifespan: 900, frequency: 45, alpha: { start: 0.9, end: 0 }, tint: [hexNum(P.glassLit), 0xffffff] }).setDepth(1);
    this.add.particles(0, -6, 'dot', { x: { min: 0, max: LEVEL.gateX + 20 }, speedY: { min: 7, max: 16 }, speedX: { min: 2, max: 9 }, lifespan: 15000, frequency: 70, alpha: { start: 0.8, end: 0.2 }, tint: [hexNum(flat(P.dust)), hexNum(flat(P.rubbleHi))], deathZone: { type: 'onLeave', source: new Phaser.Geom.Rectangle(-20, -20, LEVEL.gateX + 60, VIEW_H + 40) } }).setDepth(6);
    this.sparkle = this.add.particles(0, 0, 'sparkle', { lifespan: 520, scale: { start: 0.2, end: 1, ease: 'Sine.easeOut' }, alpha: { start: 1, end: 0 }, emitting: false, blendMode: 'ADD' }).setDepth(6);
    this.burst = this.add.particles(0, 0, 'dot2', { speed: { min: 25, max: 95 }, lifespan: { min: 260, max: 560 }, scale: { start: 1, end: 0 }, tint: [0xffffff, hexNum(P.lamp), hexNum(P.hazard)], emitting: false }).setDepth(8);

    // drone show and fireworks state
    this.show = { idx: 0, t: 0, drones: Array.from({ length: N_DRONES }, (_, i) => ({ x: 335 + (i % 12) * 3, y: 60, tx: 0, ty: 0, hue: i % 5 })) };
    this.setFigure(SHOW[0][0]);
    this.fireworks = []; this.nextFirework = 3;

    this.ctl = makeControls(this);
    this.clock = 0; this.strike = null; this.culprit = null; this.wasInside = undefined; this.sparkT = 0;
    this.lights = LEVEL.lights.map(l => Object.assign({}, l, { lock: 0, cone: null }));
    this.drones = LEVEL.drones.map(d => Object.assign({}, d, { x: d.x0 + (d.x1 - d.x0) * 0.3, dir: 1, lock: 0, cone: null }));
    this.drawBodies();
    this.spawn(data && data.fromIntro);

    cam.startFollow(this.girl, true, 0.15, 0.15, -18, 0);
    cam.fadeIn(data && data.fromIntro ? 900 : 350);
    this.beds = { wind: Sound.wind(0.14), lounge: Sound.lounge(0.0001) };
    this.events.once('shutdown', () => { this.beds.wind.stop(0.4); this.beds.lounge.stop(0.4); });
    this.scale.on('rescale', this.onRescale, this);
    this.events.once('shutdown', () => this.scale.off('rescale', this.onRescale, this));

    if (data && data.fromIntro) { this.time.delayedCall(700, () => { overlay.card('EPISODE 1', 'The Grounds', 3600); overlay.bug('CH 07', 900); }); }
    else if (this.ep.take > 1) overlay.note('TAKE ' + this.ep.take, 1600);
    window.__game = { scene: this, state };
  }

  onRescale() { this.cameras.main.setZoom(pixelZoom()); this.place(); }
  // A camera zoomed by S around its center shifts layers whose scroll factor f is below 1.
  // Offsetting each by 160(S-1)(1-f), 90(S-1)(1-f) puts them back where they belong.
  place() {
    const S = display.S;
    this.par.forEach(e => e.o.setScrollFactor(e.f).setPosition(e.x + 160 * (S - 1) * (1 - e.f), e.y + 90 * (S - 1) * (1 - e.f)));
  }

  setFigure(name) {
    const pts = FIGURES[name]();
    const order = pts.map((p, i) => i).sort(() => Math.random() - 0.5);
    this.show.drones.forEach((d, i) => { const p = pts[order[i]]; d.tx = 303 + p[0]; d.ty = 4 + p[1]; });
    this.show.name = name;
  }

  drawBodies() {
    this.bodyLayer.removeAll(true);
    this.ep.bodies.forEach(b => {
      const age = Math.max(0, Math.min(3, this.ep.take - 1 - b.take));
      this.bodyLayer.add(this.add.image(b.x, b.y, 'body' + age).setOrigin(0.5, 1));
    });
  }

  spawn(fromIntro) {
    this.kid = { x: LEVEL.start.x, y: LEVEL.start.y, w: K.w, h: K.hStand, vx: 0, vy: 0, onGround: true, crouch: false, coyote: 0, buffer: 0, holdT: 0, face: 1, walkT: 0 };
    if (fromIntro) this.kid.x = 1 * TILE;
    this.dead = false; this.leaving = false; this.done = false;
    this.lights.forEach(l => { l.lock = 0; }); this.drones.forEach(d => { d.lock = 0; });
    this.girl.setVisible(true);
  }

  // ------------------------------------------------------------------ collision
  solidTile(tx, ty) { if (tx < 0 || tx >= this.map.W || ty >= this.map.H) return true; if (ty < 0) return false; return this.map.m[ty][tx] === 1; }
  solidPx(px, py) { return this.solidTile(Math.floor(px / TILE), Math.floor(py / TILE)); }
  boxHits(x, y, w, h) {
    const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.001) / TILE), y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solidTile(tx, ty)) return true;
    return false;
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (c.look()) { const L = state.nextLook(); overlay.note('Look ' + L + ' · ' + LOOKS[L].name, 1800); this.scene.restart({}); return; }
    if (c.restart() && !this.leaving && !this.done) { this.restartTake(); c.endFrame(); return; }
    if (this.done) { if (c.advance()) this.scene.start('intro', {}); c.endFrame(); return; }
    if (!this.dead && !this.leaving) this.moveKid(dt);
    this.updateLights(dt);
    this.updateDrones(dt);
    this.updateAmbience(dt);
    this.draw(dt);
    this.hint();
    c.endFrame();
  }

  moveKid(dt) {
    const k = this.kid, c = this.ctl;
    const dir = (c.right() ? 1 : 0) - (c.left() ? 1 : 0);
    if (c.down() && k.onGround && !k.crouch) { k.y += K.hStand - K.hCrouch; k.h = K.hCrouch; k.crouch = true; }
    else if (!c.down() && k.crouch && !this.boxHits(k.x, k.y - (K.hStand - K.hCrouch), k.w, K.hStand)) { k.y -= K.hStand - K.hCrouch; k.h = K.hStand; k.crouch = false; }
    const top = k.crouch ? K.crouchRun : K.run, target = dir * top, acc = k.onGround ? K.accG : K.accA;
    if (k.vx < target) k.vx = Math.min(target, k.vx + acc * dt); else if (k.vx > target) k.vx = Math.max(target, k.vx - acc * dt);
    if (dir) k.face = dir;
    if (c.jumpPressed() && !this.atDoor()) k.buffer = K.buffer; else k.buffer = Math.max(0, k.buffer - dt);
    k.coyote = k.onGround ? K.coyote : Math.max(0, k.coyote - dt);
    if (k.buffer > 0 && k.coyote > 0 && !k.crouch) { k.vy = -K.jumpV; k.buffer = 0; k.coyote = 0; k.holdT = K.hold; k.onGround = false; Sound.tone(480, 0.07, 'square', 0.02, 720); }
    if (k.holdT > 0) { k.holdT -= dt; if (!c.jumpHeld()) { if (k.vy < 0) k.vy *= 0.5; k.holdT = 0; } }
    const apex = Math.abs(k.vy) < 40 && c.jumpHeld();
    k.vy = Math.min(K.maxFall, k.vy + K.g * (apex ? 0.5 : 1) * dt);
    let nx = k.x + k.vx * dt;
    if (this.boxHits(nx, k.y, k.w, k.h)) { nx = k.vx > 0 ? Math.floor((nx + k.w) / TILE) * TILE - k.w : (Math.floor(nx / TILE) + 1) * TILE; k.vx = 0; }
    k.x = nx;
    let ny = k.y + k.vy * dt; k.onGround = false;
    if (this.boxHits(k.x, ny, k.w, k.h)) {
      if (k.vy > 0) { ny = Math.floor((ny + k.h) / TILE) * TILE - k.h; k.onGround = true; k.vy = 0; }
      else { let nudged = false; for (const s of [1, -1, 2, -2, 3, -3, 4, -4]) if (!this.boxHits(k.x + s, ny, k.w, k.h)) { k.x += s; nudged = true; break; } if (!nudged) { ny = (Math.floor(ny / TILE) + 1) * TILE; k.vy = 0; } }
    }
    k.y = ny;
    k.walkT = k.onGround && Math.abs(k.vx) > 8 ? k.walkT + dt : 0;
    if ((c.interact() || c.up()) && this.atDoor()) this.enterDoor();
  }
  atDoor() { const k = this.kid, d = LEVEL.door; return k.x + k.w > d.x + 2 && k.x < d.x + d.w - 2 && Math.abs(k.y + k.h - (d.y + d.h)) < 4; }
  probes() { const k = this.kid, cx = k.x + k.w / 2; return [{ x: cx, y: k.y + 2 }, { x: cx, y: k.y + k.h / 2 }, { x: cx, y: k.y + k.h - 2 }, { x: k.x + 1, y: k.y + k.h / 2 }, { x: k.x + k.w - 1, y: k.y + k.h / 2 }]; }

  // ------------------------------------------------------------------ lights and drones
  cone(x, y, angle, half, range) {
    const pts = [{ x, y }];
    for (let a = angle - half; a <= angle + half + 0.001; a += 1) {
      const r = a * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r);
      let d = 0; while (d < range) { d += 2; if (this.solidPx(x + dx * d, y + dy * d)) { d -= 1; break; } }
      pts.push({ x: x + dx * Math.min(d, range), y: y + dy * Math.min(d, range) });
    }
    return pts;
  }
  watch(src, dt) {
    if (this.dead || this.leaving) { src.lock = Math.max(0, src.lock - dt * 3); return; }
    const seen = this.probes().some(p => inPoly(src.cone, p.x, p.y));
    if (seen && !window.__noDeath) {
      if (src.lock === 0) Sound.tone(1250, 0.06, 'square', 0.025);
      src.lock += dt;
      if (Math.floor(src.lock * 12) !== Math.floor((src.lock - dt) * 12)) Sound.tone(900 + src.lock * 1400, 0.04, 'square', 0.015);
      if (src.lock >= LOCK) this.die(src);
    } else src.lock = Math.max(0, src.lock - dt * 2);
  }
  updateLights(dt) {
    this.lights.forEach(l => {
      const s = (Math.sin((this.clock / l.period + l.phase) * Math.PI * 2) + 1) / 2;
      l.angle = l.a0 + (l.a1 - l.a0) * s;
      l.cone = this.cone(l.x, l.y, l.angle, l.half, l.range);
      this.watch(l, dt);
    });
  }
  updateDrones(dt) {
    this.drones.forEach((d, i) => {
      if (d.lock === 0) { d.x += d.dir * d.speed * dt; if (d.x > d.x1) { d.x = d.x1; d.dir = -1; } if (d.x < d.x0) { d.x = d.x0; d.dir = 1; } }
      const bob = Math.sin(this.clock * 3 + i) * 1.5;
      d.cy = d.y + bob;
      d.cone = this.cone(d.x, d.cy + 4, 90, d.half, d.range);
      this.watch(d, dt);
      this.droneSprites[i].setPosition(Math.round(d.x), Math.round(d.cy)).setTexture(Math.floor(this.clock * 20) % 2 ? 'drone_a' : 'drone_b');
    });
  }

  // ------------------------------------------------------------------ death and the door
  die(src) {
    if (this.dead) return;
    this.dead = true;
    const k = this.kid, x = k.x + k.w / 2, y = k.y + k.h / 2;
    this.culprit = { x: src.x, y: src.cy || src.y, tx: x, ty: y, until: this.clock + 0.5 };
    this.strike = { x, y, until: this.clock + 0.18 };
    this.girl.setVisible(false);
    this.burst.explode(16, x, y);
    this.cameras.main.shake(200, 0.012); this.cameras.main.flash(110, 70, 18, 18);
    Sound.tone(1400, 0.12, 'sawtooth', 0.04, 300); Sound.noise(0.4, 0.16);
    state.addBody(EP, x, k.onGround ? k.y + k.h : GROUND, src.id);
    this.time.delayedCall(650, () => this.cameras.main.fadeOut(260, 0, 0, 0));
    this.time.delayedCall(940, () => this.scene.restart({}));
  }
  restartTake() { this.dead = true; state.episode(EP).take++; this.cameras.main.fadeOut(200, 0, 0, 0); this.time.delayedCall(210, () => this.scene.restart({})); }
  enterDoor() {
    if (this.leaving) return;
    this.leaving = true; state.finish(EP);
    const cam = this.cameras.main, D = LEVEL.door;
    cam.stopFollow(); cam.pan(D.x + D.w / 2, D.y + D.h / 2, 900, 'Sine.easeInOut');
    Sound.chime(); this.beds.lounge.set(0.0001, 1.2);
    this.time.delayedCall(900, () => cam.fadeOut(900, 0, 0, 0));
    this.time.delayedCall(1900, () => {
      this.done = true;
      overlay.card('END OF EPISODE 1', 'Take ' + this.ep.take, 5200); overlay.bug('CH 07', 1400);
      overlay.hint('Episode 2 is next to build. Press Enter to watch the opening again, or R to replay this episode.');
    });
  }

  // ------------------------------------------------------------------ ambience: the spectacle
  updateAmbience(dt) {
    // sound: wind outside the wall, the lounge inside
    const inside = this.kid.x > LEVEL.gateX + 10;
    if (inside !== this.wasInside) { this.wasInside = inside; this.beds.wind.set(inside ? 0.03 : 0.14, 1.5); this.beds.lounge.set(inside && !this.leaving ? 0.05 : 0.0001, 2); }
    // drone show
    const S = this.show; S.t += dt;
    if (S.t > SHOW[S.idx][1]) { S.t = 0; S.idx = (S.idx + 1) % SHOW.length; this.setFigure(SHOW[S.idx][0]); }
    S.drones.forEach(d => { d.x += (d.tx - d.x) * Math.min(1, dt * 2.2); d.y += (d.ty - d.y) * Math.min(1, dt * 2.2); });
    // fireworks now and then
    this.nextFirework -= dt;
    if (this.nextFirework <= 0) {
      this.nextFirework = 5 + Math.random() * 6;
      const x = 120 + Math.random() * 500, y = 10 + Math.random() * 30;
      this.fireworks.push({ x, y: 120, ty: y, t: 0, phase: 'rise', parts: [] });
    }
    this.fireworks.forEach(f => {
      f.t += dt;
      if (f.phase === 'rise') { f.y -= 140 * dt; if (f.y <= f.ty) { f.phase = 'burst'; f.t = 0; const n = 26, col = [this.P.goldHi, this.P.glint, this.P.glassLit][Math.floor(Math.random() * 3)]; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, v = 26 + Math.random() * 14; f.parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, col }); } if (this.kid.x > LEVEL.gateX) Sound.noise(0.25, 0.03, 900); } }
      else f.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.vx *= 0.985; });
    });
    this.fireworks = this.fireworks.filter(f => f.phase === 'rise' || f.t < 1.6);
    // sparkles on gold within view
    this.sparkT = (this.sparkT || 0) - dt;
    if (this.sparkT <= 0) {
      this.sparkT = 0.09;
      const v = this.cameras.main.worldView, vis = this.marks.filter(m => m.kind === 'glint' && m.x > v.x && m.x < v.x + v.width);
      if (vis.length) { const m = vis[Math.floor(Math.random() * vis.length)]; this.sparkle.emitParticleAt(m.x, m.y, 1); }
    }
  }

  draw() {
    const P = this.P, k = this.kid, t = this.clock;
    // the girl
    const tex = k.crouch ? 'girl_crouch' : !k.onGround ? 'girl_jump' : (k.walkT > 0 && Math.floor(k.walkT * 9) % 2) ? 'girl_pass' : 'girl_stand';
    this.girl.setTexture(tex).setPosition(Math.round(k.x + k.w / 2), Math.round(k.y + k.h)).setFlipX(k.face < 0);

    // sky searchlights behind the roof (parallax space)
    const sf = this.skyFx; sf.clear();
    [[120, 0.21, 0], [250, 0.17, 1.7], [390, 0.23, 3.1], [520, 0.19, 4.4], [650, 0.2, 2.2], [780, 0.16, 5.3]].forEach(([x, sp, ph], i) => {
      const a = -90 + Math.sin(t * sp * 2 + ph) * 28, r = a * Math.PI / 180, len = 280, w = 6;
      const ex = x + Math.cos(r) * len, ey = 50 + Math.sin(r) * len, nx = -Math.sin(r) * w, ny = Math.cos(r) * w;
      const col = hexNum(i % 2 ? P.shaft : P.lamp);
      sf.fillStyle(col, 0.05); sf.fillTriangle(x, 50, ex + nx * 3, ey + ny * 3, ex - nx * 3, ey - ny * 3);
      sf.fillStyle(col, 0.07); sf.fillTriangle(x, 50, ex + nx * 1.6, ey + ny * 1.6, ex - nx * 1.6, ey - ny * 1.6);
      sf.fillStyle(col, 0.1); sf.fillTriangle(x, 50, ex + nx * 0.6, ey + ny * 0.6, ex - nx * 0.6, ey - ny * 0.6);
    });
    // the drone show
    const sg = this.showG; sg.clear();
    const palette = [P.glint, P.goldHi, P.gold, P.glassLit, P.lamp].map(hexNum);
    this.show.drones.forEach((d, i) => {
      const tw = (Math.sin(t * 6 + i * 1.7) + 1) / 2;
      const x = Math.round(d.x), y = Math.round(d.y);
      sg.fillStyle(palette[d.hue], 0.12 + tw * 0.1); sg.fillRect(x - 1, y - 1, 3, 3);
      sg.fillStyle(palette[d.hue], 0.6 + tw * 0.4); sg.fillRect(x, y, 1, 1);
    });
    // fireworks
    const fg = this.fireworksG; fg.clear();
    this.fireworks.forEach(f => {
      if (f.phase === 'rise') { fg.fillStyle(0xffffff, 0.8); fg.fillRect(Math.round(f.x), Math.round(f.y), 1, 2); }
      else { const a = Math.max(0, 1 - f.t / 1.6); f.parts.forEach(p => { fg.fillStyle(hexNum(p.col), a); fg.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }); }
    });
    // fires in the dead city
    const cf = this.cityFx; cf.clear();
    this.cityMarks.forEach((m, i) => { const fl = 0.5 + 0.5 * Math.sin(t * 9 + i * 3.1) * Math.sin(t * 4.3 + i); cf.fillStyle(hexNum(P.hazard), 0.08 + fl * 0.1); cf.fillCircle(m.x, m.y, 2 + fl * 1.5); cf.fillStyle(hexNum(P.lamp), 0.3 + fl * 0.4); cf.fillRect(m.x - 1, m.y - 1, 2, 2); });
    // fairy lights twinkle
    const tg = this.twinkleG; tg.clear();
    this.marks.forEach((m, i) => { if (m.kind === 'fairy' && Math.sin(t * 3 + i * 2.3) > 0.2) { tg.fillStyle(hexNum(P.glint), 0.9); tg.fillRect(m.x, m.y, 1, 1); } });

    // hazard beams: soft layered cones, red when they lock on
    const bg = this.beamG; bg.clear();
    const drawCone = (src, base) => {
      const lockMix = Math.min(1, src.lock / LOCK), col = lockMix > 0 ? hexNum(P.hazard) : hexNum(P.shaft);
      bg.fillStyle(col, base + lockMix * 0.12); bg.fillPoints(src.cone, true);
      const inner = [src.cone[0]].concat(src.cone.slice(1).filter((_, j, arr) => j > arr.length * 0.25 && j < arr.length * 0.75));
      if (inner.length > 2) { bg.fillStyle(col, base * 0.8); bg.fillPoints(inner, true); }
    };
    this.lights.forEach(l => drawCone(l, 0.11));
    this.drones.forEach(d => drawCone(d, 0.13));

    // culprit line and the strike
    const fx = this.fxG; fx.clear();
    [...this.lights, ...this.drones].forEach(s => {
      if (s.lock > 0 && !this.dead) {
        const b = this.probes()[1], r = 9 - (s.lock / LOCK) * 7;
        fx.lineStyle(1, hexNum(P.hazard), 1); fx.strokeRect(Math.round(b.x - 4 - r), Math.round(b.y - 4 - r), Math.round(8 + 2 * r), Math.round(8 + 2 * r));
      }
    });
    if (this.culprit && this.clock < this.culprit.until) { const c = this.culprit; fx.lineStyle(1, hexNum(P.hazard), Math.floor(t * 12) % 2 ? 1 : 0.4); fx.lineBetween(c.x, c.y, c.tx, c.ty); fx.strokeRect(c.x - 5, c.y - 5, 10, 10); }
    const sg2 = this.strikeG; sg2.clear();
    if (this.strike && this.clock < this.strike.until) {
      const v = this.cameras.main.worldView, s = this.strike, fromLeft = (s.x - v.x) > v.width / 2, x0 = fromLeft ? v.x - 2 : v.x + v.width + 2;
      sg2.lineStyle(6, hexNum(P.hazard), 0.35); sg2.lineBetween(x0, s.y, s.x, s.y); sg2.lineStyle(2, hexNum(P.hazardCore), 1); sg2.lineBetween(x0, s.y, s.x, s.y);
    }
  }

  hint() {
    const x = this.kid.x / TILE;
    if (this.leaving || this.done) return;
    if (x < 14) return overlay.hint('Arrows or A/D move. Space jumps. Down crouches. L switches the look. R restarts the episode.');
    if (x < 39) return overlay.hint('A lamp sweeps the garden. Hedges block its light: wait in their shadow, move when it swings away.');
    if (x < 56) return overlay.hint('A drone patrols the fountain. Its light cannot reach under the upper bowl.');
    if (x < 77) return overlay.hint('Two lamps on the wall. The statue plinths cast shadows.');
    if (x < 95) return overlay.hint('A faster drone. The pergolas are cover.');
    return overlay.hint('Two lamps cross over the stairs. Find the gap, then press Up or E at the door.');
  }
}
