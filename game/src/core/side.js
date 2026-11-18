// Shared side-view episode machinery: the girl's controller, tile collision, lights that lock
// on, the strike, bodies that stay, takes. Episodes extend SideEpisode and add their own world.
import { makeControls } from './controls.js';
import { Sound } from './sound.js';
import { state } from './state.js';
import { overlay, noteClue } from './overlay.js';
import { display, pixelZoom } from './display.js';
import { LOOKS } from '../art/palettes.js';
import { hexNum } from '../art/painter.js';
import { SatelliteStrike } from '../art/strike.js';
import { Bubbles } from './bubbles.js';
import { reviewKeys, syncImmunity, offerNote } from './review.js';
import { beginDeath, skipDeath, startTakes, showStatus, retryData, checkpointOf, setCheckpoint, tapeTake, hasTakes } from './death.js';
import { juice } from './juice.js';
import { results } from './results.js';
import { itemPanel } from './panels.js';
import { bodyLines } from '../data/dialogue.js';
import { fx } from './fx.js';
import { cg } from '../ui/cg.js';

export const TILE = 16;
export const K = { w: 8, hStand: 14, hCrouch: 9, run: 72, crouchRun: 34, accG: 900, accA: 585, jumpV: 236, g: 690, maxFall: 260, coyote: 0.1, buffer: 0.1, hold: 0.2,
  // Nov 17 movement (research/design_pass_nov17.md section 4): one double jump, wall slides and
  // wall jumps (from up to 2 px off a wall; touching a wall gives the double jump back).
  dj: 0.8, wallReach: 2, slide: 60, wallVy: 210, wallVx: 110, wallLock: 0.15,
  // HP: the house hurts her, what watches her kills her. Falls are measured by distance (from the
  // highest point since she last stood or touched a wall): 1 HP from 5 tiles, 2 from 8, death from 11.
  hp: 3, fall1: 80, fall2: 128, fallDie: 176, inv: 1.0 };
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
    this.events.once('shutdown', () => { this.scale.off('rescale', this.onRescale, this); if (hasTakes(this)) { cg.hp(null); cg.lives(null); } }); // a side room stops after the episode wakes: it leaves the strip alone
    syncImmunity();
    startTakes(this); showStatus(this);
  }
  itemPanel(kind) { return itemPanel(this, kind); }
  // Review: in ENDLESS or IMMUNE (or when offered), N moves her to the next of this.skipPoints (x positions).
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
  // put her back on the nearest floor (falling out of the world now dies, in every mode; this
  // stays for scenes that move her by hand)
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
    // dust where she lands or kicks off a wall: solid square pixels that just stop (no fade)
    this.puffs = this.add.particles(0, 0, 'dot', { speedX: { min: -22, max: 22 }, speedY: { min: -14, max: -3 }, gravityY: 30, lifespan: { min: 160, max: 340 }, tint: [hexNum(P.dust), hexNum(P.colLo)], emitting: false }).setDepth(4.2);
    this.beamG = this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.NORMAL); // flat light only (ART_DIRECTION 2)
    this.fxG = this.add.graphics().setDepth(7);
    this.strikeFx = new SatelliteStrike(this, { depth: 8 });
    this.bubbles = new Bubbles(this, 9);
    this.bubbles.player = () => this.kid ? { x: this.kid.x + this.kid.w / 2, y: this.kid.y } : null;
    // the strike's burst: 2 px squares, solid, no scaling down (ART_DIRECTION 2)
    this.burst = this.add.particles(0, 0, 'dot2', { speed: { min: 25, max: 95 }, lifespan: { min: 200, max: 420 }, tint: [0xebe6d8, hexNum(P.lamp), hexNum(P.hazard)], emitting: false }).setDepth(8);
  }
  // her bodies from earlier takes; each one can be looked at with E
  drawBodies() {
    this.bodyLayer.removeAll(true);
    this.things = this.things.filter(t => !t.body);
    this.ep.bodies.forEach(b => {
      const age = Math.max(0, Math.min(3, this.ep.take - 1 - b.take));
      this.bodyLayer.add(this.add.image(b.x, b.y, 'body' + age).setOrigin(0.5, 1));
      const src = { lines: bodyLines(b, age) };
      this.things.push({ x0: b.x - 7, x1: b.x + 7, y0: b.y - 8, y1: b.y + 2, label: 'J', look: true, body: true, src, use: () => { noteClue('ownBody'); this.bubbles.look('item', src, () => ({ x: b.x, y: b.y - 6 })); } });
    });
  }
  // Things she looks at with E: what she notices, as narration at the foot of the screen.
  // spec: { x0, x1, y0, y1 (the reach, in world px), lines, px, py (where the E key shows) }
  addLook(spec) {
    const src = { lines: spec.lines }, th = Object.assign({ y1: 180, label: 'J', look: true }, spec);
    th.use = () => { if (th.clue) noteClue(th.clue); this.bubbles.look('item', src, () => ({ x: th.px != null ? th.px : (th.x0 + th.x1) / 2, y: th.py != null ? th.py : th.y0 })); };
    delete th.lines; th.src = src; this.things.push(th); return th;
  }
  // whether looks are on offer right now (a scene turns them off while it needs her attention)
  lookable() { return true; }
  // A retry after the episode set a checkpoint (death.js setCheckpoint) starts there: { x, y }.
  spawn(x) {
    const cp = checkpointOf(this), s = cp && cp.x != null ? { x: cp.x, y: cp.y != null ? cp.y : this.level.start.y } : this.level.start;
    this.kid = { x: x != null ? x : s.x, y: s.y, w: K.w, h: K.hStand, vx: 0, vy: 0, onGround: true, crouch: false, coyote: 0, buffer: 0, holdT: 0, face: 1, walkT: 0,
      hp: K.hp, inv: 0, airJumps: 1, wall: 0, wallLock: 0, peakY: s.y };
    showStatus(this, this.kid.hp, K.hp);
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
    const k = this.kid; this.nearThing = null; this.nearDoor = null;
    if (this.dead || this.leaving || this.done) return;
    const cx = k.x + k.w / 2, looks = this.lookable();
    const near = this.things.filter(t => !t.off && (looks || !t.look) && k.x + k.w > t.x0 - 6 && k.x < t.x1 + 6 && k.y < t.y1 && k.y + k.h > t.y0 - 10);
    // things to use come before things to look at, side-room doors last; then the nearest
    const rank = t => (t.door ? 2 : t.look ? 1 : 0);
    this.nearThing = near.sort((a, b) => rank(a) - rank(b) || Math.abs(cx - (a.x0 + a.x1) / 2) - Math.abs(cx - (b.x0 + b.x1) / 2))[0] || null;
    // One key, one job (Michael, Nov 18): J uses things, looks and talks, and never opens a door.
    // W (or Up) goes through doors, every kind: side-room doors here, the way out in moveKid. W
    // counts once per press, and not at all if it was already held when the scene began (no
    // bouncing back out). J at a door with nothing else in reach says W.
    const up = this.ctl.up(), upTap = up && this.upHeld === false; this.upHeld = up;
    this.nearDoor = near.find(t => t.door) || null;
    const door = upTap ? this.nearDoor : null;
    if (door) door.use();
    else if (this.ctl.interact()) {
      if (this.nearThing && !this.nearThing.door) this.nearThing.use();
      else if (this.nearDoor || (this.level && this.level.door && this.atDoor() && this.doorReady())) this.wForDoors();
    }
  }
  // J pressed at a door: the set says which key opens it (a beat apart, so it never stutters)
  wForDoors() { const t = this.clock; if (this.wSaidAt != null && t - this.wSaidAt < 1.5) return; this.wSaidAt = t; overlay.note('W opens doors', 1400); Sound.tone(330, 0.05, 'square', 0.012); }
  // A side room behind an optional door: this episode sleeps (its clock and lights freeze) and
  // wakes where she left it.
  enterRoom(id) {
    if (this.leaving || this.dead) return;
    this.leaving = true;
    Sound.tone(300, 0.08, 'triangle', 0.02); this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => {
      this.leaving = false; this.kid.vx = 0;
      Object.values(this.beds || {}).forEach(b => b.set(0.0001, 0.3));
      this.events.once('wake', () => { this.ctl.endFrame(); if (this.kid) showStatus(this, this.kid.hp, K.hp); this.cameras.main.fadeIn(300); window.__game = { scene: this, state }; if (this.onWake) this.onWake(); });
      this.scene.launch('room', { id, from: this.scene.key, take: this.ep.take });
      this.scene.sleep();
    });
  }
  // whether the level's door would take her now (a scene says no while it is not open yet)
  doorReady() { return !this.dead && !this.leaving; }
  drawThings() {
    const t = this.nearThing, d = this.level.door;
    if (this.dead) this.bubbles.prompt = null; // no key over a death
    else if (t && !t.noPrompt) {
      const px = t.px != null ? t.px : (t.x0 + t.x1) / 2; if (!this.bubbles.near(px, 44)) this.bubbles.showPrompt(px, t.py != null ? t.py : t.y0, t.door ? 'W' : t.label);
      // a side-room door in reach behind a look: its W shows too, over the door
      const dr = !t.door && this.nearDoor; if (dr) { const dx = (dr.x0 + dr.x1) / 2; this.bubbles.showPrompt2(Math.abs(dx - px) < 12 ? px + (dx < px ? -12 : 12) : dx, dr.y0, 'W'); }
    }
    else if (!t && d && this.kid && this.atDoor() && this.doorReady()) this.bubbles.showPrompt(this.kid.x + this.kid.w / 2, this.kid.y, 'W'); // the way out: W (the key bar's door), over her head on the door's face, clear of any sign above it
    // the scene's own step (capped as the scene's clock is), so holds and typing keep its time
    this.bubbles.update(Math.min(this.game.loop.delta / 1000, 1 / 30), this.clock);
  }

  moveKid(dt) {
    const k = this.kid, c = this.ctl;
    let dir = (c.right() ? 1 : 0) - (c.left() ? 1 : 0);
    if (k.inv > 0) k.inv = Math.max(0, k.inv - dt);
    if (k.wallLock > 0) { k.wallLock -= dt; if (dir === k.lockSide) dir = 0; }
    // a wall beside her (within reach) while she is in the air
    const wallAt = s => { for (let d = 1; d <= K.wallReach + 1; d++) if (this.boxHits(k.x + s * d, k.y, k.w, k.h)) return true; return false; };
    k.wall = k.onGround ? 0 : wallAt(1) ? 1 : wallAt(-1) ? -1 : 0;
    if (c.down() && k.onGround && !k.crouch) { k.y += K.hStand - K.hCrouch; k.h = K.hCrouch; k.crouch = true; }
    else if (!c.down() && k.crouch && !this.boxHits(k.x, k.y - (K.hStand - K.hCrouch), k.w, K.hStand)) { k.y -= K.hStand - K.hCrouch; k.h = K.hStand; k.crouch = false; }
    const top = k.crouch ? K.crouchRun : K.run, target = dir * top, acc = k.onGround ? K.accG : K.accA;
    if (k.vx < target) k.vx = Math.min(target, k.vx + acc * dt); else if (k.vx > target) k.vx = Math.max(target, k.vx - acc * dt);
    if (dir) k.face = dir;
    if (c.jumpPressed() && !this.atDoor()) k.buffer = K.buffer; else k.buffer = Math.max(0, k.buffer - dt);
    k.coyote = k.onGround ? K.coyote : Math.max(0, k.coyote - dt);
    if (k.onGround || k.wall) k.airJumps = 1;
    if (k.buffer > 0 && k.coyote > 0 && !k.crouch) { k.vy = -K.jumpV; k.buffer = 0; k.coyote = 0; k.holdT = K.hold; k.onGround = false; Sound.tone(480, 0.07, 'square', 0.02, 720); juice.jump(this); }
    else if (k.buffer > 0 && k.wall && !this.noWallJump) {
      // off the wall: up and away, and pushing back into the wall is ignored for a moment
      k.vy = -K.wallVy; k.vx = -k.wall * K.wallVx; k.face = -k.wall; k.lockSide = k.wall; k.wallLock = K.wallLock;
      k.buffer = 0; k.holdT = K.hold * 0.6; k.peakY = k.y; Sound.tone(420, 0.06, 'square', 0.02, 760);
      juice.jump(this); juice.dust(this, k.wall > 0 ? k.x + k.w : k.x, k.y + k.h - 3, 3);
    } else if (k.buffer > 0 && k.airJumps > 0 && !k.crouch && !this.noDoubleJump) {
      k.vy = -K.jumpV * K.dj; k.airJumps--; k.buffer = 0; k.holdT = K.hold * 0.6; Sound.tone(620, 0.06, 'square', 0.018, 940);
      juice.jump(this); juice.dust(this, k.x + k.w / 2, k.y + k.h, 3);
    }
    if (k.holdT > 0) { k.holdT -= dt; if (!c.jumpHeld()) { if (k.vy < 0) k.vy *= 0.5; k.holdT = 0; } }
    const apex = Math.abs(k.vy) < 40 && c.jumpHeld();
    k.vy = Math.min(K.maxFall, k.vy + K.g * (apex ? 0.5 : 1) * dt);
    // sliding down a wall she is pushing into: slow, and the fall starts over from here
    if (k.wall && dir === k.wall && k.vy > K.slide) k.vy = K.slide;
    if (k.wall && dir === k.wall) k.peakY = k.y;
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
    // a long fall hurts when she lands (Fall.js and other scripted drops turn this off)
    if (!k.onGround) k.peakY = Math.min(k.peakY, k.y);
    else {
      if (wasAir) {
        const d = k.y - k.peakY, tier = d >= K.fall2 ? 2 : d >= K.fall1 ? 1 : 0;
        if (!this.noFallDamage) { if (d >= K.fallDie) this.hurt(K.hp, 'fall'); else if (d >= K.fall2) this.hurt(2, 'fall'); else if (d >= K.fall1) this.hurt(1, 'fall'); }
        // the landing itself (juice.js): a squash frame, square dust, a step, thud or crack
        juice.land(this, this.noFallDamage ? Math.min(tier, 1) : tier, k.x + k.w / 2, k.y + k.h, fallV);
      }
      k.peakY = k.y;
    }
    k.walkT = k.onGround && Math.abs(k.vx) > 8 ? k.walkT + dt : 0;
    if (this.atDoor() && c.up()) this.enterDoor(); // W or Up, never J
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
  // A light's shape: a ray every degree, stopped by walls and props. Cached (Nov 18 perf pass):
  // the same light in the same place over the same world gives back the same points (callers
  // must not change them), and it is only worked out again when the light or the world moves.
  // The world is the tile map and the solid props, summed on each call (worldSig).
  cone(x, y, angle, half, range) {
    const sig = this.worldSig(), key = x + ',' + y + ',' + angle + ',' + half + ',' + range;
    const cache = this.coneCache || (this.coneCache = new Map()), hit = cache.get(key);
    if (hit && hit.sig === sig) return hit.pts;
    // only the props that could be in reach, and the tile test inline
    const M = this.map, m = M.m, W = M.W, H = M.H, near = [];
    for (const r of this.props) if (r.solid !== false && r.x < x + range && r.x + r.w > x - range && r.y < y + range && r.y + r.h > y - range) near.push(r);
    const solid = (px, py) => {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (tx < 0 || tx >= W || ty >= H) return true;
      if (ty >= 0 && m[ty][tx] === 1) return true;
      for (let i = 0; i < near.length; i++) { const r = near[i]; if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return true; }
      return false;
    };
    const pts = [{ x, y }];
    for (let a = angle - half; a <= angle + half + 0.001; a += 1) {
      const r = a * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r);
      let d = 0; while (d < range) { d += 2; if (solid(x + dx * d, y + dy * d)) { d -= 1; break; } }
      pts.push({ x: x + dx * Math.min(d, range), y: y + dy * Math.min(d, range) });
    }
    if (cache.size > 256) cache.clear();
    cache.set(key, { sig, pts });
    return pts;
  }
  // a number that changes when anything a light could hit changes (tiles, solid props); cheap
  // next to a cone (a few thousand adds), so it is worked out on every call and never goes stale
  worldSig() {
    let h = 7;
    const m = this.map.m;
    for (let ty = 0; ty < m.length; ty++) { const row = m[ty]; for (let tx = 0; tx < row.length; tx++) h = (h * 31 + (row[tx] | 0)) | 0; }
    h = (h * 31 + this.props.length) | 0;
    for (const r of this.props) h = (((((h * 31 + (r.x * 4 | 0)) * 31 + (r.y * 4 | 0)) * 31 + (r.w * 4 | 0)) * 31 + (r.h * 4 | 0)) * 31 + (r.solid === false ? 1 : 2)) | 0;
    return h;
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

  // ------------------------------------------------------------------ HP
  // The house hurts her (falls, debris, a robot, the creator's sword): HP, a blink, a moment safe.
  // What watches her (lights, lasers, cameras, the strike) still kills outright, through die().
  hurt(n, id) {
    const k = this.kid; if (!k || this.dead) return;
    if (id === 'fall') results.fell(this); // for the report: falls count in story mode too
    // every mode takes HP (IMMUNE too: at 0 she regenerates at the mark, death.js)
    if (k.inv > 0 || window.__noDeath) return;
    k.hp = Math.max(0, k.hp - n); k.inv = K.inv; showStatus(this, k.hp, K.hp);
    Sound.tone(220, 0.12, 'square', 0.04, 110); Sound.noise(0.12, 0.08, 1800);
    // a hit-stop and a kick (juice.js); the strike, if this kills her, adds its own
    if (k.hp > 0) juice.hit(this, n > 1 ? 2 : 1, n > 1 ? 90 : 65);
    if (k.hp <= 0) this.die({ id, direct: true });
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
    const impact = quiet => {
      this.girl.setVisible(false);
      if (!quiet) {
        this.burst.explode(16, x, y);
        fx.flash(this.cameras.main, 110, 70, 18, 18); // the kick and the hit-stop: death.js
        Sound.tone(1400, 0.12, 'sawtooth', 0.04, 300); Sound.noise(0.4, 0.16);
      }
      state.addBody(this.epId, x, footY, src && src.id);
    };
    beginDeath(this, src, impact, (onImpact, o) => { this.cameras.main.stopFollow(); return this.strikeFx.fire({ view: this.cameras.main.worldView, tx: x, ty: y, P: this.P, onImpact, from: this.satX, short: o && o.short }); });
  }
  groundBelow(x) { for (let ty = 0; ty < this.map.H; ty++) if (this.solidTile(Math.floor(x / TILE), ty) && !this.solidTile(Math.floor(x / TILE), ty - 1)) { if (ty * TILE > this.kid.y) return ty * TILE; } return 160; }
  // a retry by choice (Backspace, or the pause menu): the next take, no body, no life used up (IMMUNE: the same take again)
  // a checkpoint for this visit: deaths and retries start here until she runs out of lives.
  // at: { x, y } (her top-left, as kid.x and kid.y), or null to clear it
  markCheckpoint(at) { setCheckpoint(this, at); }
  canRestart() { return !this.dead && !this.leaving && !this.done; }
  restartTake() { if (!this.canRestart()) return false; this.dead = true; const im = state.mode === 'immune'; if (!im) state.episode(this.epId).take++; this.cameras.main.fadeOut(140, 0, 0, 0); this.time.delayedCall(150, () => this.scene.restart(Object.assign(retryData(this), im ? { regen: true } : {}))); return true; }
  // Mute, restart; while she is dying, a key skips the strike. Returns true when the
  // scene is restarting.
  commonKeys() {
    const c = this.ctl;
    reviewKeys(this);
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (this.dead) { const go = c.advance() || c.restart() || c.jumpPressed(); return go && skipDeath(this); }
    if (c.restart() && this.restartTake()) return true;
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
    this.girl.setAlpha(k.inv > 0 && Math.floor(k.inv * 14) % 2 ? 0 : 1); // hurt: she blinks (gone on alternate beats, never see-through)
    // her shadow on whatever is under her, smaller the higher she is
    const sg = this.shadowG; if (!sg) return; sg.clear();
    if (!this.girl.visible || this.dead) return;
    const cx = k.x + k.w / 2; let gy = null;
    for (let d = 0; d < 48; d++) if (this.solidPx(cx, k.y + k.h + d)) { gy = k.y + k.h + d; break; }
    if (gy == null) return;
    if (!this.girl.alpha) return;
    // a hard row of ash0 pixels, narrower the higher she is; from 16 px up, every other pixel
    const h = gy - (k.y + k.h), w = Math.round(Math.max(2, 7 - h / 6)), x0 = Math.round(cx) - w, y = Math.round(gy);
    sg.fillStyle(hexNum(this.P.crack), 1);
    if (h < 16) sg.fillRect(x0, y, w * 2, 1); else for (let x = x0 + (y & 1); x < x0 + w * 2; x += 2) sg.fillRect(x, y, 1, 1);
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
    tapeTake(this); // TAKE n on the floor where she starts (no card)
    offerNote(this);
  }
}
