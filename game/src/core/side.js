// Shared side-view episode machinery: the girl's controller, tile collision, lights that lock
// on, the strike, bodies that stay, takes. Episodes extend SideEpisode and add their own world.
import { makeControls } from './controls.js';
import { Sound } from './sound.js';
import { state } from './state.js';
import { overlay } from './overlay.js';
import { display, pixelZoom } from './display.js';
import { LOOKS } from '../art/palettes.js';
import { hexNum } from '../art/painter.js';

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
    this.clock = 0; this.strike = null; this.culprit = null; this.dead = false; this.leaving = false; this.done = false;
    this.par = [];
    this.scale.on('rescale', this.onRescale, this);
    this.events.once('shutdown', () => this.scale.off('rescale', this.onRescale, this));
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
    this.girl = this.add.image(0, 0, 'girl_stand').setOrigin(0.5, 1).setDepth(4);
    this.beamG = this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
    this.fxG = this.add.graphics().setDepth(7);
    this.strikeG = this.add.graphics().setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
    this.burst = this.add.particles(0, 0, 'dot2', { speed: { min: 25, max: 95 }, lifespan: { min: 260, max: 560 }, scale: { start: 1, end: 0 }, tint: [0xffffff, hexNum(P.lamp), hexNum(P.hazard)], emitting: false }).setDepth(8);
  }
  drawBodies() {
    this.bodyLayer.removeAll(true);
    this.ep.bodies.forEach(b => { const age = Math.max(0, Math.min(3, this.ep.take - 1 - b.take)); this.bodyLayer.add(this.add.image(b.x, b.y, 'body' + age).setOrigin(0.5, 1)); });
  }
  spawn(x) {
    const s = this.level.start;
    this.kid = { x: x != null ? x : s.x, y: s.y, w: K.w, h: K.hStand, vx: 0, vy: 0, onGround: true, crouch: false, coyote: 0, buffer: 0, holdT: 0, face: 1, walkT: 0 };
    this.dead = false; this.leaving = false; this.done = false;
    this.girl.setVisible(true);
  }
  followGirl() { this.cameras.main.startFollow(this.girl, true, 0.15, 0.15, -18, 0); }

  // ------------------------------------------------------------------ collision
  solidTile(tx, ty) { if (tx < 0 || tx >= this.map.W || ty >= this.map.H) return true; if (ty < 0) return false; return this.map.m[ty][tx] === 1; }
  solidPx(px, py) { return this.solidTile(Math.floor(px / TILE), Math.floor(py / TILE)); }
  boxHits(x, y, w, h) {
    const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.001) / TILE), y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solidTile(tx, ty)) return true;
    return false;
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
  die(src) {
    if (this.dead) return;
    this.dead = true;
    const k = this.kid, x = k.x + k.w / 2, y = k.y + k.h / 2;
    if (src && src.x != null) this.culprit = { x: src.x, y: src.cy || src.y, tx: x, ty: y, until: this.clock + 0.5 };
    this.strike = { x, y, until: this.clock + 0.18 };
    this.girl.setVisible(false);
    this.burst.explode(16, x, y);
    this.cameras.main.shake(200, 0.012); this.cameras.main.flash(110, 70, 18, 18);
    Sound.tone(1400, 0.12, 'sawtooth', 0.04, 300); Sound.noise(0.4, 0.16);
    state.addBody(this.epId, x, k.onGround ? k.y + k.h : this.groundBelow(x), src && src.id);
    this.time.delayedCall(650, () => this.cameras.main.fadeOut(260, 0, 0, 0));
    this.time.delayedCall(940, () => this.scene.restart({}));
  }
  groundBelow(x) { for (let ty = 0; ty < this.map.H; ty++) if (this.solidTile(Math.floor(x / TILE), ty) && !this.solidTile(Math.floor(x / TILE), ty - 1)) { if (ty * TILE > this.kid.y) return ty * TILE; } return 160; }
  restartTake() { this.dead = true; state.episode(this.epId).take++; this.cameras.main.fadeOut(200, 0, 0, 0); this.time.delayedCall(210, () => this.scene.restart({})); }
  // Mute, switch look, restart. Returns true when the scene is restarting.
  commonKeys() {
    const c = this.ctl;
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (c.look()) { const L = state.nextLook(); overlay.note('Look ' + L + ' · ' + LOOKS[L].name, 1800); this.scene.restart({}); return true; }
    if (c.restart() && !this.leaving && !this.done) { this.restartTake(); return true; }
    return false;
  }

  // ------------------------------------------------------------------ drawing helpers
  drawGirl() {
    const k = this.kid;
    const tex = k.crouch ? 'girl_crouch' : !k.onGround ? 'girl_jump' : (k.walkT > 0 && Math.floor(k.walkT * 9) % 2) ? 'girl_pass' : 'girl_stand';
    this.girl.setTexture(tex).setPosition(Math.round(k.x + k.w / 2), Math.round(k.y + k.h)).setFlipX(k.face < 0);
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
    sources.forEach(s => { if (s.lock > 0 && !this.dead) { const b = this.probes()[1], r = 9 - (s.lock / (limit || LOCK)) * 7; fx.lineStyle(1, hexNum(P.hazard), 1); fx.strokeRect(Math.round(b.x - 4 - r), Math.round(b.y - 4 - r), Math.round(8 + 2 * r), Math.round(8 + 2 * r)); } });
    if (this.culprit && this.clock < this.culprit.until) { const c = this.culprit; fx.lineStyle(1, hexNum(P.hazard), Math.floor(t * 12) % 2 ? 1 : 0.4); fx.lineBetween(c.x, c.y, c.tx, c.ty); fx.strokeRect(c.x - 5, c.y - 5, 10, 10); }
    const sg = this.strikeG; sg.clear();
    if (this.strike && this.clock < this.strike.until) {
      const v = this.cameras.main.worldView, s = this.strike, fromLeft = (s.x - v.x) > v.width / 2, x0 = fromLeft ? v.x - 2 : v.x + v.width + 2;
      sg.lineStyle(6, hexNum(P.hazard), 0.35); sg.lineBetween(x0, s.y, s.x, s.y); sg.lineStyle(2, hexNum(P.hazardCore), 1); sg.lineBetween(x0, s.y, s.x, s.y);
    }
  }
  takeNote(data, num, title) {
    if (data && data.fromCut) { this.time.delayedCall(700, () => { overlay.card('EPISODE ' + num, title, 3600); overlay.bug('CH 07', 900); }); }
    else if (this.ep.take > 1) overlay.note('TAKE ' + this.ep.take, 1600);
  }
}
