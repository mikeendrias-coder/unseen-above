// Episode 3 opens here, in side view: the floor of the stair hall is gone, and the only way on
// is down the shaft it fell into. Broken floors stick out of the walls; the house is still
// coming down (dust trickles first, then a chunk, and a chunk costs a heart); the last stretch
// is a narrow shaft too deep to drop, so she slides down its walls and jumps between them to
// dodge what falls. At the bottom a rotten floor gives way: she tumbles into the black, lands,
// and her glasses crack. The east wing below is played from above.
import { Music } from '../core/music.js';
import { Painter, rng, hexNum } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode, TILE } from '../core/side.js';
import { Marks, Gold } from '../core/props.js';
import { goNext } from '../core/flow.js';
import { fx } from '../core/fx.js';

// '#' rubble wall  '=' a broken floor  'x' a floor that crumbles under her  'R' the rotten floor
const ROWS = [ // (43 rows; below them the void)
  '####################',
  '#..................#',
  '#..................#',
  '#..................#',
  '#..................#',
  '#..................#',
  '#..................#',
  '#..................#',
  '#..................#',
  '#..................#',
  '######.............#', // the landing she arrives on
  '######.............#',
  '######=======......#', // a broken floor, a step down
  '######.............#',
  '######.............#',
  '######.............#',
  '######.......=====.#',
  '######.............#',
  '######.............#',
  '######.............#',
  '######=======......#',
  '######.............#',
  '######.............#',
  '######.............#',
  '######.......xxxxx.#', // this one crumbles
  '######.............#',
  '######.............#',
  '##########...======#', // the shaft opens at cols 10 to 12
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '###########..#######', // a stub to rest on (nothing falls on it)
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '##########...#######',
  '##########RRR#######' // the rotten floor
];
const W = 20, ROT = 42, CR = 24, H = 64, G = 160;
const LEVEL = { w: W, h: H, start: { x: 2 * TILE, y: G - 14 }, door: { x: -999, y: -999, w: 0, h: 0 } };
const SX0 = 10 * TILE, SX1 = 13 * TILE; // the narrow shaft's walls
// debris lanes: a column it falls down, how often, and when
const LANES = [
  { col: 9, from: 1, period: 2.1, phase: 0.2 },
  { col: 15, from: 1, period: 2.4, phase: 1.3 },
  { col: 8, from: 13, period: 2.2, phase: 0.6 },
  // the shaft: the right wall all the way down, the left wall only under the stub (so the stub
  // is a real rest), on alternate beats so one wall is always the safe one
  { col: 12, from: 28, period: 2.0, phase: 0.95 },
  { col: 10, from: 34, period: 2.0, phase: 0.0 }
];
const WARN = 0.9; // dust trickles down the whole lane this long before a chunk comes down
// N in story mode: the next ledge down
// the show's tape marks (checkpoints), where she stands and the floor's y: the second floor down
// (right of its falling bits), the third (clear of them), the ledge over the shaft, the stub
// halfway down it. None at the start (one step back) or on the rotten floor (it is the way out).
const MARKS = [{ x: 264, y: 256 }, { x: 176, y: 320 }, { x: 250, y: 432 }, { x: 162, y: 528 }];
// gold left out on the way down: under the first falling bits, under the second, on the one that
// crumbles, and against the shaft's right wall where the bits come down
const GOLD = [{ x: 150, y: 192 }, { x: 248, y: 256 }, { x: 240, y: 384 }, { x: 203, y: 610 }];
const SKIP = [{ x: 120, y: 192 }, { x: 240, y: 256 }, { x: 140, y: 320 }, { x: 250, y: 432 }, { x: 162, y: 528 }, { x: 180, y: 672 }];

function buildMap() {
  const m = [];
  for (let y = 0; y < H; y++) {
    const row = ROWS[y] || (y === H - 1 ? '####################' : '##########...#######'); // the void column under the rotten floor
    m.push(row.split('').map(c => c === '.' ? 0 : 1));
  }
  return { W, H, m };
}
const kindAt = (tx, ty) => (ROWS[ty] || '')[tx] || (ty >= ROWS.length && (tx < 10 || tx > 12) ? '#' : '.');

function paint(P) {
  const p = new Painter(W * TILE, H * TILE), r = rng(13), w = W * TILE, HH = H * TILE;
  const ash0 = P.crack, ash1 = P.skyTop, ash2 = P.ground, ash3 = P.rubble, ash4 = P.rubbleHi;
  // the back wall of the stair hall and the shaft: wallpaper strips that give out the deeper it goes
  p.rect(0, 0, w, HH, P.void);
  for (let y = 0; y < 28 * TILE; y += 2) p.rect(0, y, w, 2, y < 12 * TILE ? P.wallLo : 'd:' + P.wallLo + ':' + ash1 + ':checker');
  for (let x = 6; x < w; x += 26) p.rect(x, 20, 3, 27 * TILE - 30, P.wallLine);
  p.rect(0, 16, w, 2, P.goldLo); p.rect(0, 18, w, 1, ash0);
  // where the floors of the house met the back wall: a dotted scar, not a ledge
  [11, 18, 23].forEach(row => { const y = row * TILE + 6; for (let x = 0; x < w; x += 4) p.px(x, y, ash0); });
  // frames still hanging, hung low, and a clean square where one fell
  [[60, 52], [228, 60]].forEach(([x, y]) => { p.rect(x - 1, y - 1, 18, 22, ash0); p.rect(x, y, 16, 20, P.goldLo); p.rect(x + 2, y + 2, 12, 16, P.wall); p.rect(x + 4, y + 6, 8, 8, P.wallHi); });
  p.rect(150, 58, 14, 18, P.wall);
  // a stair rail hanging in the dark of the hall
  p.line(14 * TILE, 30, 17 * TILE, 70, P.goldLo); p.line(17 * TILE, 70, 18 * TILE, 64, P.goldLo);
  for (let i = 0; i < 6; i++) p.rect(14 * TILE + 8 + i * 8, 38 + i * 6, 1, 10, P.goldLo);
  // the door she came through, shut behind her
  p.rect(1, G - 36, 18, 36, ash0); p.rect(2, G - 35, 16, 35, P.wood); p.rect(4, G - 32, 12, 12, P.woodHi); p.rect(4, G - 17, 12, 14, P.woodHi); p.px(14, G - 18, P.gold);
  // the deep shaft: plaster and brick, ash grey, no gold this far down
  for (let y = 28 * TILE; y < HH; y += 16) for (let x = SX0; x < SX1; x += 16) { p.rect(x, y, 16, 16, y < ROT * TILE ? ash1 : P.void); if (y < ROT * TILE && r() < 0.5) p.rect(x + r() * 12, y + r() * 12, 4, 1, ash2); }
  // pipes down the back of the shaft, and a dumbwaiter cable
  for (let y = 28 * TILE; y < ROT * TILE; y += 4) { p.px(SX0 + 20, y, ash2); p.px(SX0 + 22, y, ash2); }
  p.rect(SX1 - 12, 28 * TILE, 1, 14 * TILE, ash3);
  // the tiles: rubble walls with a lit top edge, broken floors, the rotten floor
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const c = kindAt(tx, ty), x = tx * TILE, y = ty * TILE, air = (a, b) => { const k = kindAt(a, b); return k === '.' || b < 0; };
    if (c === '#') {
      // masonry: two courses of bricks per tile, offset, dark mortar, a lit top on each brick
      const deep = ty >= 28, base = deep ? ash1 : P.wallLo, hi = deep ? ash2 : P.wall, mort = ash0;
      p.rect(x, y, 16, 16, mort);
      for (let j = 0; j < 2; j++) {
        const off = (ty * 2 + j) % 2 ? 8 : 0;
        for (let i = -1; i < 2; i++) { const bx = x + off + i * 16 + 1, bw = 14, x0 = Math.max(x, bx), x1 = Math.min(x + 16, bx + bw); if (x1 > x0) { p.rect(x0, y + j * 8 + 1, x1 - x0, 6, base); p.rect(x0, y + j * 8 + 1, x1 - x0, 1, hi); } }
      }
      if (r() < 0.12) p.rect(x + 2 + r() * 10, y + 2 + r() * 10, 3, 2, mort); // a chipped brick
      if (air(tx, ty - 1)) { p.rect(x, y, 16, 1, ash4); p.rect(x, y + 1, 16, 2, ash3); }
      if (air(tx + 1, ty)) p.rect(x + 15, y, 1, 16, ash3);
      if (air(tx - 1, ty)) p.rect(x, y, 1, 16, ash2);
    } else if (c === '=' || c === 'x') {
      const rot = c === 'x';
      // a broken floor: boards on top, a joist face, plaster underneath, ragged ends
      p.rect(x, y, 16, 16, ash0);
      p.rect(x, y, 16, 3, rot ? P.wallHi : P.woodHi); p.rect(x, y + 3, 16, 7, P.wood); p.rect(x, y + 10, 16, 4, rot ? ash3 : P.boneLo); p.rect(x, y + 14, 16, 2, ash2);
      p.rect(x, y, 16, 1, rot ? ash4 : P.goldHi);
      for (let i = 2; i < 16; i += 5) p.rect(x + i, y + 3, 1, 7, rot ? ash0 : P.wallLine);
      if (rot) { p.px(x + 3, y + 1, ash0); p.px(x + 9, y + 2, ash0); p.px(x + 12, y + 1, ash0); }
      if (air(tx + 1, ty)) { p.rect(x + 13, y + 10, 3, 6, P.void); p.rect(x + 14, y + 3, 2, 3, P.void); }
      if (air(tx - 1, ty)) { p.rect(x, y + 11, 3, 5, P.void); p.rect(x, y + 4, 1, 3, P.void); }
    } else if (c === 'R') {
      // the rotten floor: grey boards, gaps, one already split
      p.rect(x, y, 16, 6, ash3); p.rect(x, y, 16, 1, ash4); for (let i = 0; i < 16; i += 5) p.rect(x + i, y + 1, 1, 5, ash0);
      p.px(x + 7, y + 3, ash0); p.px(x + 8, y + 4, ash0); p.rect(x, y + 6, 16, 10, P.void);
    }
  }
  // the landing's lip, broken off where the floor went
  for (let i = 0; i < 5; i++) p.rect(6 * TILE - 2 + i * 3, G + 2 + (i % 2) * 3, 3, 3, ash3);
  // dust in the air
  for (let i = 0; i < 90; i++) p.px(r() * w, r() * ROT * TILE, ash4);
  return p;
}

export class Fall extends SideEpisode {
  constructor() { super('fall'); }

  create(data) {
    data = data || {};
    this.initSide('ep3fall', LEVEL, buildMap());
    const P = this.P;
    makeSprites(this, P);
    paint(P).toTexture(this, 'fall_art');
    this.pixelCamera(W * TILE, P.void);
    this.cameras.main.setBounds(0, 0, W * TILE, H * TILE);
    this.add.image(0, 0, 'fall_art').setOrigin(0).setDepth(0);
    this.pieceG = this.add.graphics().setDepth(1);
    this.commonLayers();
    this.ledG = this.add.graphics().setDepth(6);
    this.streakG = this.addParallax(this.add.graphics().setDepth(5.5), 0);
    this.blackG = this.addParallax(this.add.graphics().setDepth(15), 0);
    this.hudG = this.addParallax(this.add.graphics().setDepth(20), 0);
    this.dust = this.add.particles(0, 0, 'dot', { lifespan: 900, speedY: { min: 20, max: 60 }, speedX: { min: -10, max: 10 }, tint: [hexNum(P.dust), hexNum(P.rubbleHi)], emitting: false }).setDepth(5);
    this.splinters = this.add.particles(0, 0, 'dot2', { lifespan: { min: 500, max: 1100 }, speed: { min: 40, max: 160 }, angle: { min: 200, max: 340 }, gravityY: 500, tint: [hexNum(P.wood), hexNum(P.woodHi), hexNum(P.rubble)], emitting: false }).setDepth(5);
    this.phase = 'walk'; this.t = 0; this.takeoffY = null; this.cracked = false; this.landed = false; this.whoosh = null; this.spin = 0; this.chunks = []; this.black = 0;
    // falling debris, one lane at a time; each lane knows where it lands
    this.lanes = LANES.map(L => { const x = L.col * TILE + 4; let y1 = (L.from + 1) * TILE; while (y1 < H * TILE && !this.solidTile(L.col, Math.floor(y1 / TILE))) y1 += TILE; return Object.assign({ x, y0: L.from * TILE, y1: Math.floor(y1 / TILE) * TILE, next: L.phase + L.period, warned: false, rock: null }, L); });
    this.crumble = { t: 0, on: false, gone: false, bits: [] };
    this.markG = this.add.graphics().setDepth(1.2);
    this.tape = new Marks(this, MARKS); this.gold = new Gold(this, GOLD);
    this.drawBodies();
    this.spawn(); this.kid.face = 1;
    this.followGirl();
    this.cameras.main.fadeIn(data.fromCut ? 900 : 300);
    this.beds = { wind: Sound.wind(0.05), hum: Sound.hum(0.01) };
    Music.stop(2);
    this.events.once('shutdown', () => Object.values(this.beds).forEach(b => b.stop(0.4)));
    this.takeNote({ fromCut: data.fromCut }, 3, 'The East Wing');
    window.__game = { scene: this, state };
  }
  followGirl() { this.cameras.main.startFollow(this.girl, true, 0.15, 0.15, 0, -34); } // she sits above the middle: what is below matters

  // review: N puts her on the next floor down
  canRestart() { return this.phase === 'walk' && super.canRestart(); }
  skipAhead() {
    if (this.phase !== 'walk' || this.dead) return;
    const k = this.kid, s = SKIP.find(q => q.y > k.y + k.h + 2); if (!s) return;
    k.x = s.x; k.y = s.y - k.h; k.vx = 0; k.vy = 0; k.onGround = true; k.peakY = k.y;
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt; this.t += dt;
    if (this.phase === 'walk') { if (this.commonKeys()) { c.endFrame(); return; } } else { c.restart(); c.look(); }
    const k = this.kid;
    if (this.phase === 'walk') {
      if (!this.dead && !this.leaving) {
        const lockWas = k.wallLock;
        this.moveKid(dt); this.updateThings(); this.tape.update(dt); this.gold.update(dt);
        // here a fall is measured from where she left the floor (or a wall she slid on or jumped
        // off), not from the top of her jump: jumping down to the next floor never hurts more than
        // stepping off it. Brushing past a wall in a free fall does not count.
        const dir = (c.right() ? 1 : 0) - (c.left() ? 1 : 0);
        const slid = k.wall && dir === k.wall && k.wallLock <= 0, wallJumped = k.wallLock > lockWas;
        if (k.onGround || slid || wallJumped) this.takeoffY = k.y;
        else if (this.takeoffY != null && k.peakY < this.takeoffY) k.peakY = this.takeoffY;
        this.updateCrumble(dt);
        // the rotten floor: she lands on it and it goes
        if (!this.dead && k.onGround && Math.abs(k.y + k.h - ROT * TILE) < 1 && k.x + k.w > SX0 && k.x < SX1) this.rotCrack();
      } else if (this.dead && this.girl.visible) this.settle(dt);
    }
    this.updateLanes(dt);
    if (this.phase === 'crack' && this.t > 0.45) this.through();
    if (this.phase === 'through' || this.phase === 'falling') this.tumble(dt);
    if (this.phase === 'dark') this.inDark();
    this.drawGirl();
    if (this.phase === 'through' || this.phase === 'falling') {
      // tumbling: she turns over in quarter turns as she drops (no smooth spin on pixel art)
      this.girl.setOrigin(0.5, 0.5).setPosition(Math.round(k.x + k.w / 2), Math.round(k.y + 7)).setAngle(Math.round(this.spin / 90) * 90).setTexture(Math.floor(this.t * 6) % 2 ? 'girl_jump' : 'girl_crouch');
    }
    this.draw(dt);
    this.drawThings();
    this.hintLine();
    c.endFrame();
  }

  // ------------------------------------------------------------------ the house coming down
  updateLanes(dt) {
    const k = this.kid, v = this.cameras.main.worldView, live = this.phase === 'walk';
    this.lanes.forEach(L => {
      const inView = L.y1 > v.y - 20 && L.y0 < v.bottom + 20;
      if (live && this.clock >= L.next - WARN && !L.warned) {
        L.warned = true;
        if (inView) { Sound.noise(0.25, 0.025, 1400); for (let i = 0; i < 4; i++) this.dust.emitParticleAt(L.x + 1 + Math.random() * 6, L.y0 + 1, 1); }
      }
      if (live && this.clock >= L.next) {
        L.next += L.period; L.warned = false;
        if (inView) L.rock = { y: L.y0, vy: 40 };
      }
      const rk = L.rock; if (!rk) return;
      rk.vy = Math.min(320, rk.vy + 700 * dt); rk.y += rk.vy * dt;
      // it hits her: a heart
      if (!this.dead && rk.y + 6 > k.y && rk.y < k.y + k.h && L.x + 8 > k.x && L.x < k.x + k.w) { this.hurt(1, 'the ceiling'); this.shatter(L, rk.y + 6); L.rock = null; return; }
      if (rk.y + 6 >= L.y1) { this.shatter(L, L.y1); L.rock = null; }
    });
  }
  shatter(L, y) {
    this.splinters.explode(8, L.x + 4, y - 1);
    const v = this.cameras.main.worldView; if (y > v.y && y < v.bottom + 40) { Sound.noise(0.18, 0.06, 1100); Sound.tone(120, 0.12, 'square', 0.015, 70); }
  }
  // the floor that crumbles: shakes under her, then goes
  updateCrumble(dt) {
    const C = this.crumble, k = this.kid; if (C.gone) return;
    const ty = Math.floor((k.y + k.h + 1) / TILE), on = k.onGround && ty === CR && (kindAt(Math.floor(k.x / TILE), ty) === 'x' || kindAt(Math.floor((k.x + k.w - 1) / TILE), ty) === 'x');
    if (on && !C.on) { C.on = true; C.t = 0; Sound.tone(160, 0.3, 'sawtooth', 0.02, 90); }
    if (!C.on) return;
    C.t += dt;
    if (C.t >= 0.5) {
      C.gone = true;
      for (let tx = 0; tx < W; tx++) if (kindAt(tx, CR) === 'x') { this.map.m[CR][tx] = 0; C.bits.push({ x: tx * TILE, y: CR * TILE, vy: 20 + Math.random() * 30 }); this.splinters.explode(5, tx * TILE + 8, CR * TILE + 4); }
      Sound.noise(0.4, 0.12, 1300);
    }
  }

  // ------------------------------------------------------------------ the rotten floor and the drop
  rotCrack() {
    if (this.phase !== 'walk') return;
    this.phase = 'crack'; this.t = 0; this.kid.vx = 0;
    Sound.noise(0.25, 0.12, 1800); Sound.tone(140, 0.3, 'sawtooth', 0.03, 90); fx.shake(this.cameras.main, 140, 0.004);
    this.dust.explode(10, this.kid.x + 4, ROT * TILE + 2);
  }
  through() {
    this.phase = 'through'; this.t = 0; this.fallT = 0;
    for (let x = 10; x <= 12; x++) this.map.m[ROT][x] = 0;
    this.splinters.explode(30, this.kid.x + 4, ROT * TILE + 2); this.dust.explode(14, this.kid.x + 4, ROT * TILE);
    Sound.noise(0.5, 0.2, 2600); Sound.tone(180, 0.4, 'sawtooth', 0.04, 70); fx.shake(this.cameras.main, 260, 0.012);
    Sound.tone(520, 0.9, 'sine', 0.02, 180); // her breath going out
    this.whoosh = this.beds.whoosh = Sound.wind(0.0001); this.whoosh.set(0.16, 1.0);
    this.kid.vy = 40; this.kid.onGround = false;
  }
  tumble(dt) {
    const k = this.kid, cam = this.cameras.main;
    this.fallT += dt;
    k.vy = Math.min(300, k.vy + 690 * dt);
    k.x = Math.max(SX0 + 2, Math.min(SX1 - k.w - 2, k.x + Math.sin(this.fallT * 2.2) * 0.3));
    k.y += k.vy * dt; this.spin += dt * 420;
    if (Math.random() < dt * 9) this.chunks.push({ x: SX0 + 4 + Math.random() * (SX1 - SX0 - 8), y: cam.worldView.y - 6, vy: k.vy * (0.8 + Math.random() * 0.5), w: 2 + Math.floor(Math.random() * 3), h: 1 + Math.floor(Math.random() * 2), c: Math.random() < 0.5 ? this.P.wood : this.P.rubble });
    // the camera goes with her a little way, then stays, and she drops out of sight
    if (this.phase === 'through' && this.fallT > 0.25) { this.phase = 'falling'; cam.stopFollow(); }
    if (this.phase === 'falling') {
      if (this.fallT < 1.0) cam.centerOn(160, Math.round(cam.midPoint.y + (k.y + 30 - cam.midPoint.y) * Math.min(1, dt * 8)));
      else if (k.y > cam.worldView.bottom + 12) this.goDark();
    }
  }
  goDark() {
    if (this.phase === 'dark') return;
    this.phase = 'dark'; this.t = 0; this.black = 1; this.girl.setVisible(false);
    if (this.whoosh) this.whoosh.set(0.0001, 0.3);
  }
  inDark() {
    // in the black: a long beat, the landing, then her glasses crack
    if (this.t > 0.7 && !this.landed) {
      this.landed = true; this.cracked = true; this.crackT = 0;
      Sound.noise(0.6, 0.28, 400); Sound.tone(55, 0.5, 'sine', 0.08, 35); fx.shake(this.cameras.main, 320, 0.02);
      this.time.delayedCall(120, () => { Sound.tone(2400, 0.08, 'square', 0.03); this.time.delayedCall(90, () => Sound.tone(1700, 0.12, 'square', 0.025, 400)); });
      this.time.delayedCall(1900, () => { if (!goNext(this, 'ep3')) overlay.hint('The east wing is not built yet.'); });
    }
  }

  draw(dt) {
    const P = this.P, t = this.clock, cam = this.cameras.main, ash0 = hexNum(P.crack);
    const bg = this.pieceG; bg.clear();
    // falling chunks: a rubble block with a dark rim, and the dust that warns of each one
    this.lanes.forEach(L => {
      if (L.warned && this.phase === 'walk') {
        // the warning runs the whole length of the lane, so it shows wherever she is in it:
        // a thin trickle of dust falling, and a dark crack where the chunk will break loose
        const v = cam.worldView, top = Math.max(L.y0, Math.floor(v.y)), bot = Math.min(L.y1, Math.ceil(v.bottom)), off = Math.floor(this.clock * 90) % 12;
        bg.fillStyle(hexNum(P.dust), 1);
        for (let y = L.y0 + off; y < bot; y += 12) if (y >= top) { bg.fillRect(L.x + 3, y, 1, 2); if (y + 6 < bot) bg.fillRect(L.x + 5, y + 6, 1, 1); }
        bg.fillStyle(ash0, 1); bg.fillRect(L.x, L.y0, 8, 1);
      }
      if (L.rock) { const y = Math.round(L.rock.y); bg.fillStyle(ash0, 1); bg.fillRect(L.x - 1, y - 1, 10, 8); bg.fillStyle(hexNum(P.rubble), 1); bg.fillRect(L.x, y, 8, 6); bg.fillStyle(hexNum(P.rubbleHi), 1); bg.fillRect(L.x, y, 8, 1); bg.fillRect(L.x, y, 1, 3); }
    });
    // the crumbling floor: it shakes, then its boards drop away
    const C = this.crumble;
    if (C.on && !C.gone) { const sh = Math.floor(t * 30) % 2; bg.fillStyle(ash0, 1); for (let tx = 13; tx <= 17; tx++) bg.fillRect(tx * TILE + 3 + sh * 5, CR * TILE + 1, 1, 3); }
    if (C.gone) {
      bg.fillStyle(hexNum(P.wallLo), 1); bg.fillRect(13 * TILE, CR * TILE, 5 * TILE, 16);
      C.bits.forEach(b => { b.vy += 600 * dt; b.y += b.vy * dt; if (b.y < (CR + 3) * TILE) { bg.fillStyle(ash0, 1); bg.fillRect(b.x - 1, Math.round(b.y) - 1, 18, 8); bg.fillStyle(hexNum(P.wood), 1); bg.fillRect(b.x, Math.round(b.y), 16, 6); } });
    }
    // the rotten floor, once she is through it: a hole with splintered ends
    if (this.phase !== 'walk' && this.phase !== 'crack') { bg.fillStyle(hexNum(P.void), 1); bg.fillRect(SX0, ROT * TILE, SX1 - SX0, 6); bg.fillStyle(hexNum(P.rubble), 1); bg.fillRect(SX0, ROT * TILE, 5, 2); bg.fillRect(SX1 - 4, ROT * TILE, 4, 3); }
    else if (this.phase === 'crack') { bg.fillStyle(ash0, 1); bg.fillRect(SX0 + 6, ROT * TILE + 1, SX1 - SX0 - 12, 1); }
    this.chunks.forEach(ch => { ch.y += ch.vy * dt; bg.fillStyle(hexNum(ch.c), 1); bg.fillRect(Math.round(ch.x), Math.round(ch.y), ch.w, ch.h); });
    this.chunks = this.chunks.filter(ch => ch.y < cam.worldView.bottom + 20);
    // speed: thin solid streaks rushing up past her as she drops
    const sg = this.streakG; sg.clear();
    if (this.phase === 'falling' || this.phase === 'through') { sg.fillStyle(hexNum(P.rubble), 1); for (let i = 0; i < 10; i++) { const x = SX0 + 2 + ((i * 53 + 17) % (SX1 - SX0 - 4)), y = 180 - ((t * 520 + i * 67) % 220); sg.fillRect(x, Math.round(y), 1, 14); } }
    // a few red lights in the walls, blinking
    const lg = this.ledG; lg.clear();
    [[40, 30], [300, 52], [9 * TILE + 4, 29 * TILE], [13 * TILE + 2, 36 * TILE], [11 * TILE, 48 * TILE]].forEach(([x, y], i) => { if (Math.sin(t * 2 + i * 1.7) > 0) { lg.fillStyle(hexNum(P.led), 1); lg.fillRect(x, y, 1, 1); } });
    // the black she falls into
    const mg = this.markG; mg.clear(); this.tape.draw(mg); this.gold.draw(mg);
    const kg = this.blackG; kg.clear();
    // in hard steps of whole rows, not a see-through veil: a quarter, half, three quarters, all
    if (this.black > 0) {
      const n = this.black >= 0.9 ? 4 : this.black >= 0.6 ? 3 : this.black >= 0.3 ? 2 : 1;
      kg.fillStyle(0x000000, 1);
      // rows kept out of every four: 1 (row 0), 2 (rows 0 and 2), 3 (rows 0, 1 and 2)
      const keep = [0, 0b0001, 0b0101, 0b0111][n];
      if (n === 4) kg.fillRect(-2, -2, 324, 184); else for (let y = -2; y < 182; y++) if ((keep >> (y & 3)) & 1) kg.fillRect(-2, y, 324, 1);
    }
    this.drawLocks([]);
    this.drawHud();
  }

  // the glasses: whole until the landing, then cracked and glitching, even in the black
  drawHud() {
    const g = this.hudG, col = hexNum(this.P.overlay); g.clear();
    const m = 5, s = 8;
    if (this.cracked) this.crackT += 1 / 60;
    const show = !this.cracked || Math.floor(this.crackT * 9) % 3 !== 0;
    g.fillStyle(col, 1);
    if (show) [[m, m, 1, 1], [320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy], i) => { if (this.cracked && i === 0) return; g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    if (show && overlay.free(320 - m - 23, 180 - m - 9, 25, 8)) pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, 1);
    if (this.cracked) {
      // the crack runs out from the corner, a pixel line at a time
      const u = Math.min(1, this.crackT / 0.25), pts = [[4, 4], [9, 7], [13, 6], [19, 11], [24, 12], [31, 18], [35, 17], [42, 23], [60, 30], [70, 44]];
      g.fillStyle(0xb8b2a3, 1);
      const seg = (a, b) => { const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); for (let i = 0; i <= n; i++) g.fillRect(Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n), 1, 1); };
      for (let i = 1; i < Math.ceil(pts.length * u); i++) seg(pts[i - 1], pts[i]);
      seg([13, 6], [15, 1]); seg([24, 12], [22, 19]); seg([31, 18], [37, 13]);
      if (Math.floor(this.crackT * 20) % 7 === 0) { g.fillStyle(col, 1); g.fillRect(0, (Math.floor(this.crackT * 97) % 90) * 2, 320, 1); }
    }
  }

  hintLine() {
    if (this.phase !== 'walk') return overlay.hint('');
    const y = this.kid.y;
    if (y < 11 * TILE) overlay.hint('The floor is gone. Down is the only way.');
    else if (y < 27 * TILE) overlay.hint('Dust falls first. Then the ceiling. Long drops hurt.');
    else overlay.hint('Hold toward a wall to slide. Space jumps off it.');
  }
}
