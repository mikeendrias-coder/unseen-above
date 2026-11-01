// Shared side-view episode machinery: the girl's controller, tile collision, lights that lock
// on, the strike, bodies that stay, takes. Episodes extend SideEpisode and add their own world.
import { makeControls } from './controls.js';
import { Sound } from './sound.js';
import { state } from './state.js';
import { overlay } from './overlay.js';
import { display, pixelZoom } from './display.js';
import { LOOKS } from '../art/palettes.js';
import { hexNum } from '../art/painter.js';
import { SatelliteStrike } from '../art/strike.js';
import { Bubbles } from './bubbles.js';
import { reviewKeys, syncImmunity } from './review.js';
import { itemPanel } from './panels.js';
import { bodyLines } from '../data/dialogue.js';

export const TILE = 16;
export const K = { w: 8, hStand: 14, hCrouch: 9, run: 72, crouchRun: 34, accG: 900, accA: 585, jumpV: 236, g: 690, maxFall: 260, coyote: 0.1, buffer: 0.1, hold: 0.2 };
export const LOCK = 0.42; // seconds inside a light before the strike
export const inPoly = (pts, x, y) => { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };

export class SideEpisode extends Phaser.Scene {
  // id: save key; level: { w, h, start, door }; map: { W, H, m }
  initSide(id, level, map) {
    this.P = LOOKS[state.look];
    this.epId = id; this.ep = state.episode(id);
    this.level = level; this.map = map;
    this.ctl = makeControls(this);
    this.clock = 0; this.culprit = null; this.dead = false; this.leaving = false; this.done = false;
    this.par = [];
    this.props = [];  // solid rectangles off the tile grid: low debris, furniture, a robot
    this.things = []; // things she can use with E
    this.scale.on('rescale', this.onRescale, this);
    this.events.once('shutdown', () => this.scale.off('rescale', this.onRescale, this));
    syncImmunity();
  }
  itemPanel(kind) { return itemPanel(this, kind); }
  // Review: with immunity on, N moves her to the next of this.skipPoints (x positions).
  skipAhead() {
    const k = this.kid, pts = this.skipPoints || []; if (!k || this.dead || this.leaving) return;
    const x = pts.find(p => p > k.x + 12); if (x == null) return;
    this.placeAt(x);
  }
  // put her standing on the floor at x (the first floor found going down)
  placeAt(x) {
    const k = this.kid, tx = Math.floor((x + k.w / 2) / TILE);
    let y = 160;
    for (let ty = 1; ty < this.map.H; ty++) if (this.solidTile(tx, ty) && !this.solidTile(tx, ty - 1)) { y = ty * TILE; break; }
    k.x = x; k.h = K.hStand; k.crouch = false; k.y = y - k.h; k.vx = 0; k.vy = 0;
  }
  // the nearest x to this one where she fits standing where she is (clear of props and people)
  clearX(x) { const k = this.kid; for (let d = 0; d < 80; d++) for (const s of [1, -1]) if (!this.boxHits(x + s * d, k.y, k.w, k.h)) return x + s * d; return x; }
  // immune and falling out of the world: back onto the nearest floor
  rescue() {
    const k = this.kid;
    for (let d = 0; d < 400; d += 4) for (const s of [1, -1]) {
      const x = k.x + s * d, tx = Math.floor((x + k.w / 2) / TILE);
      if (tx > 0 && tx < this.map.W - 1 && this.solidTile(tx, 10) && !this.solidTile(tx, 9)) { this.placeAt(x); return; }
    }
  }
  pixelCamera(worldW, bg) {
    const cam = this.cameras.main;
    cam.setZoom(pixelZoom()); cam.setBounds(0, 0, worldW, 180); cam.setRoundPixels(true); cam.setBackgroundColor(hexNum(bg));
    return cam;
  }
  onRescale() { this.cameras.main.setZoom(pixelZoom()); this.place(); }
  // A camera zoomed by S around its center shifts layers whose scroll factor f is below 1.
  // Offsetting each by 160(S-1)(1-f), 90(S-1)(1-f) puts them back where they belong.
  place() { const S = display.S; this.par.forEach(e => e.o.setScrollFactor(e.f).setPosition(e.x + 160 * (S - 1) * (1 - e.f), e.y + 90 * (S - 1) * (1 - e.f))); }
  addParallax(o, f, x, y) { this.par.push({ o, f, x: x || 0, y: y || 0 }); this.place(); return o; }

  // girl, bodies and death effects, at fixed depths
  commonLayers() {
    const P = this.P;
    this.bodyLayer = this.add.layer().setDepth(2);
    this.shadowG = this.add.graphics().setDepth(3.9);
    this.girl = this.add.image(0, 0, 'girl_stand').setOrigin(0.5, 1).setDepth(4);
    this.puffs = this.add.particles(0, 0, 'dot', { speedX: { min: -22, max: 22 }, speedY: { min: -14, max: -3 }, gravityY: 30, lifespan: { min: 260, max: 520 }, alpha: { start: 0.7, end: 0 }, tint: [hexNum(P.dust), hexNum(P.colLo)], emitting: false }).setDepth(4.2);
    this.beamG = this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
    this.fxG = this.add.graphics().setDepth(7);
    this.strikeFx = new SatelliteStrike(this, { depth: 8 });
    this.bubbles = new Bubbles(this, 9);
    this.bubbles.player = () => this.kid ? { x: this.kid.x + this.kid.w / 2, y: this.kid.y } : null;
    this.burst = this.add.particles(0, 0, 'dot2', { speed: { min: 25, max: 95 }, lifespan: { min: 260, max: 560 }, scale: { start: 1, end: 0 }, tint: [0xffffff, hexNum(P.lamp), hexNum(P.hazard)], emitting: false }).setDepth(8);
  }
  // her bodies from earlier takes; each one can be looked at with E
  drawBodies() {
    this.bodyLayer.removeAll(true);
    this.things = this.things.filter(t => !t.body);
    this.ep.bodies.forEach(b => {
      const age = Math.max(0, Math.min(3, this.ep.take - 1 - b.take));
      this.bodyLayer.add(this.add.image(b.x, b.y, 'body' + age).setOrigin(0.5, 1));
      const src = { lines: bodyLines(b, age) };
      this.things.push({ x0: b.x - 7, x1: b.x + 7, y0: b.y - 8, y1: b.y + 2, label: 'E', look: true, body: true, src, use: () => this.bubbles.look('item', src, () => ({ x: b.x, y: b.y - 6 })) });
    });
  }
  // Things she looks at with E: what she notices, as narration at the foot of the screen.
  // spec: { x0, x1, y0, y1 (the reach, in world px), lines, px, py (where the E key shows) }
  addLook(spec) {
    const src = { lines: spec.lines }, th = Object.assign({ y1: 180, label: 'E', look: true }, spec);
    th.use = () => this.bubbles.look('item', src, () => ({ x: th.px != null ? th.px : (th.x0 + th.x1) / 2, y: th.py != null ? th.py : th.y0 }));
    delete th.lines; th.src = src; this.things.push(th); return th;
  }
  // whether looks are on offer right now (a scene turns them off while it needs her attention)
  lookable() { return true; }
  spawn(x) {
    const s = this.level.start;
    this.kid = { x: x != null ? x : s.x, y: s.y, w: K.w, h: K.hStand, vx: 0, vy: 0, onGround: true, crouch: false, coyote: 0, buffer: 0, holdT: 0, face: 1, walkT: 0 };
    this.dead = false; this.leaving = false; this.done = false;
    this.girl.setVisible(true);
  }
  followGirl() { this.cameras.main.startFollow(this.girl, true, 0.15, 0.15, -18, 0); }

  // ------------------------------------------------------------------ collision
  solidTile(tx, ty) { if (tx < 0 || tx >= this.map.W || ty >= this.map.H) return true; if (ty < 0) return false; return this.map.m[ty][tx] === 1; }
  solidPx(px, py) { return this.solidTile(Math.floor(px / TILE), Math.floor(py / TILE)) || this.props.some(r => r.solid !== false && px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h); }
  boxHits(x, y, w, h) {
    const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.001) / TILE), y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solidTile(tx, ty)) return true;
    return this.props.some(r => r.solid !== false && x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y);
  }
  // Things she can use: { x0, x1, y0, y1, use(), label? }. The nearest one shows an E prompt.
  updateThings() {
    const k = this.kid; this.nearThing = null;
    if (this.dead || this.leaving || this.done) return;
    const cx = k.x + k.w / 2, looks = this.lookable();
    const near = this.things.filter(t => !t.off && (looks || !t.look) && k.x + k.w > t.x0 - 6 && k.x < t.x1 + 6 && k.y < t.y1 && k.y + k.h > t.y0 - 10);
    // things to use come before things to look at; then the nearest
    this.nearThing = near.sort((a, b) => (a.look ? 1 : 0) - (b.look ? 1 : 0) || Math.abs(cx - (a.x0 + a.x1) / 2) - Math.abs(cx - (b.x0 + b.x1) / 2))[0] || null;
    if (this.nearThing && this.ctl.interact()) this.nearThing.use();
  }
  // A side room behind an optional door: this episode sleeps (its clock and lights freeze) and
  // wakes where she left it.
  enterRoom(id) {
    if (this.leaving || this.dead) return;
    this.leaving = true;
    Sound.tone(300, 0.08, 'triangle', 0.02); this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => {
      this.leaving = false; this.kid.vx = 0;
      Object.values(this.beds || {}).forEach(b => b.set(0.0001, 0.3));
      this.events.once('wake', () => { this.ctl.endFrame(); this.cameras.main.fadeIn(300); window.__game = { scene: this, state }; if (this.onWake) this.onWake(); });
      this.scene.launch('room', { id, from: this.scene.key, take: this.ep.take });
      this.scene.sleep();
    });
  }
  drawThings() {
    const t = this.nearThing;
    if (t && !t.noPrompt) { const px = t.px != null ? t.px : (t.x0 + t.x1) / 2; if (!this.bubbles.near(px, 44)) this.bubbles.showPrompt(px, t.py != null ? t.py : t.y0, t.label); }
    this.bubbles.update(this.game.loop.delta / 1000, this.clock);
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
    // move a pixel at a time, so props off the tile grid stop her exactly where they are
    let dx = k.vx * dt;
    while (dx !== 0) { const st = Math.abs(dx) >= 1 ? Math.sign(dx) : dx; if (this.boxHits(k.x + st, k.y, k.w, k.h)) { k.vx = 0; break; } k.x += st; dx -= st; }
    let dy = k.vy * dt; const wasAir = !k.onGround, fallV = k.vy; k.onGround = false;
    while (dy !== 0) {
      const st = Math.abs(dy) >= 1 ? Math.sign(dy) : dy;
      if (this.boxHits(k.x, k.y + st, k.w, k.h)) {
        // landing: down onto the surface itself, never resting a fraction of a pixel above it
        if (st > 0) { const snap = Math.ceil(k.y + k.h - 1e-6) - (k.y + k.h); if (snap > 0 && !this.boxHits(k.x, k.y + snap, k.w, k.h)) k.y += snap; k.onGround = true; k.vy = 0; break; }
        // a head bump at a corner slides her past it, as before
        let nudged = false; for (const s of [1, -1, 2, -2, 3, -3, 4, -4]) if (!this.boxHits(k.x + s, k.y + st, k.w, k.h)) { k.x += s; nudged = true; break; }
        if (!nudged) { k.vy = 0; break; }
      }
      k.y += st; dy -= st;
    }
    if (!k.onGround && k.vy >= 0 && this.boxHits(k.x, k.y + 0.5, k.w, k.h)) k.onGround = true;
    // a little dust where she lands
    if (wasAir && k.onGround && fallV > 140 && this.puffs) this.puffs.explode(Math.min(9, 3 + Math.round(fallV / 60)), k.x + k.w / 2, k.y + k.h - 1);
    k.walkT = k.onGround && Math.abs(k.vx) > 8 ? k.walkT + dt : 0;
    if (this.atDoor() && (c.interact() || c.up())) this.enterDoor();
  }
  // With control taken away (a scene beginning, a light that has her), she still falls and slows
  // to a stop: nobody hangs in the air.
  settle(dt) {
    const real = this.ctl, none = () => false;
    this.ctl = { left: none, right: none, up: none, down: none, jumpPressed: none, jumpHeld: none, interact: none };
    this.kid.buffer = 0; // a jump pressed just before control went does not fire when she lands
    try { this.moveKid(dt); } finally { this.ctl = real; }
  }
  // where she will land from here: the first solid thing under her, props included
  landingY() { const k = this.kid, x = k.x + k.w / 2; for (let d = 0; d < 200; d++) if (this.solidPx(x, k.y + k.h + d)) return k.y + k.h + d; return 160; }
  atDoor() { const k = this.kid, d = this.level.door; return k.x + k.w > d.x + 2 && k.x < d.x + d.w - 2 && Math.abs(k.y + k.h - (d.y + d.h)) < 4; }
  probes() { const k = this.kid, cx = k.x + k.w / 2; return [{ x: cx, y: k.y + 2 }, { x: cx, y: k.y + k.h / 2 }, { x: cx, y: k.y + k.h - 2 }, { x: k.x + 1, y: k.y + k.h / 2 }, { x: k.x + k.w - 1, y: k.y + k.h / 2 }]; }

  // ------------------------------------------------------------------ lights that lock on
  cone(x, y, angle, half, range) {
    const pts = [{ x, y }];
    for (let a = angle - half; a <= angle + half + 0.001; a += 1) {
      const r = a * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r);
      let d = 0; while (d < range) { d += 2; if (this.solidPx(x + dx * d, y + dy * d)) { d -= 1; break; } }
      pts.push({ x: x + dx * Math.min(d, range), y: y + dy * Math.min(d, range) });
    }
    return pts;
  }
  watch(src, dt, lockTime) {
    const limit = lockTime || LOCK;
    if (this.dead || this.leaving) { src.lock = Math.max(0, src.lock - dt * 3); return; }
    const seen = !window.__noDeath && this.probes().some(p => inPoly(src.cone, p.x, p.y));
    if (seen) {
      if (src.lock === 0) Sound.charge();
      src.lock += dt;
      if (src.lock >= limit) this.die(src);
    } else src.lock = Math.max(0, src.lock - dt * 2);
  }

  // ------------------------------------------------------------------ death, takes, the door
  // A lock-on ends in the satellite strike (see art/strike.js): the beam leaves the satellite,
  // ricochets down the view and hits her; the body is left where she stood. A source marked
  // direct (the house's own laser) kills on contact with no strike from orbit.
  die(src) {
    if (this.dead) return;
    this.dead = true;
    // caught in the air, she drops (see settle) and the strike meets her where she lands
    const k = this.kid, x = k.x + k.w / 2, footY = src && src.footY != null ? src.footY : k.onGround ? k.y + k.h : this.landingY(), y = k.onGround ? k.y + k.h / 2 : footY - k.h / 2;
    const impact = () => {
      this.girl.setVisible(false);
      this.burst.explode(16, x, y);
      this.cameras.main.shake(200, 0.012); this.cameras.main.flash(110, 70, 18, 18);
      Sound.tone(1400, 0.12, 'sawtooth', 0.04, 300); Sound.noise(0.4, 0.16);
      state.addBody(this.epId, x, footY, src && src.id);
    };
    let after = 0.4;
    if (src && src.direct) impact();
    else { this.cameras.main.stopFollow(); after = this.strikeFx.fire({ view: this.cameras.main.worldView, tx: x, ty: y, P: this.P, onImpact: impact, from: this.satX }); }
    this.time.delayedCall((after + 0.12) * 1000, () => this.cameras.main.fadeOut(260, 0, 0, 0));
    this.time.delayedCall((after + 0.42) * 1000, () => this.scene.restart({}));
  }
  groundBelow(x) { for (let ty = 0; ty < this.map.H; ty++) if (this.solidTile(Math.floor(x / TILE), ty) && !this.solidTile(Math.floor(x / TILE), ty - 1)) { if (ty * TILE > this.kid.y) return ty * TILE; } return 160; }
  restartTake() { this.dead = true; state.episode(this.epId).take++; this.cameras.main.fadeOut(200, 0, 0, 0); this.time.delayedCall(210, () => this.scene.restart({})); }
  // Mute, switch look, restart. Returns true when the scene is restarting.
  commonKeys() {
    const c = this.ctl;
    reviewKeys(this);
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (c.look()) { const L = state.nextLook(); overlay.note('Look ' + L + ' · ' + LOOKS[L].name, 1800); this.scene.restart({}); return true; }
    if (c.restart() && !this.leaving && !this.done) { this.restartTake(); return true; }
    return false;
  }

  // ------------------------------------------------------------------ drawing helpers
  drawGirl() {
    const k = this.kid;
    const tex = k.crouch ? 'girl_crouch' : !k.onGround ? 'girl_jump' : (k.walkT > 0 && Math.floor(k.walkT * 9) % 2) ? 'girl_pass' : 'girl_stand';
    // standing still a while, she looks back over her shoulder now and then
    const still = k.onGround && !k.crouch && Math.abs(k.vx) < 1 && !this.dead;
    this.idleT = still ? (this.idleT || 0) + this.game.loop.delta / 1000 : 0;
    const glance = this.idleT > 4 && (this.idleT % 3.4) > 2.8;
    this.girl.setTexture(tex).setPosition(Math.round(k.x + k.w / 2), Math.round(k.y + k.h)).setFlipX(glance ? k.face > 0 : k.face < 0);
    // her shadow on whatever is under her, smaller the higher she is
    const sg = this.shadowG; if (!sg) return; sg.clear();
    if (!this.girl.visible || this.dead) return;
    const cx = k.x + k.w / 2; let gy = null;
    for (let d = 0; d < 48; d++) if (this.solidPx(cx, k.y + k.h + d)) { gy = k.y + k.h + d; break; }
    if (gy == null) return;
    const h = gy - (k.y + k.h), w = Math.max(2, 7 - h / 6);
    sg.fillStyle(0x000000, Math.max(0.08, 0.32 - h / 120) * this.girl.alpha); sg.fillEllipse(Math.round(cx), Math.round(gy), w * 2, 2);
  }
  // Soft layered cone, red as it locks on.
  drawCone(g, src, base, color, limit) {
    const lockMix = Math.min(1, src.lock / (limit || LOCK)), col = lockMix > 0 ? hexNum(this.P.hazard) : hexNum(color);
    g.fillStyle(col, base + lockMix * 0.12); g.fillPoints(src.cone, true);
    const inner = [src.cone[0]].concat(src.cone.slice(1).filter((_, j, arr) => j > arr.length * 0.25 && j < arr.length * 0.75));
    if (inner.length > 2) { g.fillStyle(col, base * 0.8); g.fillPoints(inner, true); }
  }
  drawLocks(sources, limit) {
    const fx = this.fxG, P = this.P, t = this.clock; fx.clear();
    this.strikeFx.update(this.game.loop.delta / 1000);
    let locking = 0;
    sources.forEach(s => { if (s.lock > 0 && !this.dead) { locking = Math.max(locking, s.lock / (limit || LOCK)); const b = this.probes()[1], r = 9 - (s.lock / (limit || LOCK)) * 7; fx.lineStyle(1, hexNum(P.hazard), 1); fx.strokeRect(Math.round(b.x - 4 - r), Math.round(b.y - 4 - r), Math.round(8 + 2 * r), Math.round(8 + 2 * r)); } });
    // while a light locks on, the satellite slides into place at the top of the view
    const v = this.cameras.main.worldView;
    if (locking > 0 && !this.dead) {
      const kx = this.kid.x + this.kid.w / 2, want = kx < v.x + v.width / 2 ? v.x + v.width * 0.72 : v.x + v.width * 0.28;
      this.satX = this.satX == null ? (kx < v.x + v.width / 2 ? v.x + v.width + 8 : v.x - 8) : this.satX + (want - this.satX) * 0.25;
      SatelliteStrike.drawSat(fx, P, this.satX, v.y + 3, this.strikeFx.glow, Math.floor(t * 14) % 2 ? locking : 0.2);
    } else if (!this.dead) this.satX = null;
  }
  takeNote(data, num, title) {
    if (data && data.fromCut) { this.time.delayedCall(700, () => { overlay.card('EPISODE ' + num, title, 3600, 'lower'); overlay.bug('CH 07', 3600); }); }
    else if (this.ep.take > 1) overlay.take(this.ep.take);
  }
}
