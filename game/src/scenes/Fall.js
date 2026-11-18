// Episode 3 opens here, in side view: past the laser hall, a dark stair hall with its floor gone.
// The only way on is a jump to a broken balcony. It always gives way when she lands, but it is
// built to feel like her jump did it: a crack on landing, a beat, then the drop. She tumbles a
// long way down the shaft past the floors of the house, crashes through a rotten floor, and
// falls out of sight. In the dark, the landing, and her glasses crack. The east wing below is
// played from above.
import { Music } from '../core/music.js';
import { Painter, rng, hexNum, flat } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode, TILE } from '../core/side.js';
import { goNext } from '../core/flow.js';
import { fx } from '../core/fx.js';

const W = 30, H = 64, G = 160, ROT = 58; // ROT: the rotten floor near the bottom of the shaft
const LEVEL = { w: W, h: H, start: { x: 2 * TILE, y: G - 14 }, door: { x: -999, y: -999, w: 0, h: 0 }, beam: { x0: 15, x1: 19, row: 8 } };
const X0 = 12 * TILE, X1 = 21 * TILE; // the shaft's walls

function buildMap() {
  const m = []; for (let y = 0; y < H; y++) m.push(new Array(W).fill(0));
  const solid = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y][x] = 1; };
  solid(0, 10, 11, 11);                      // the landing she arrives on
  solid(0, 0, 0, 9);                         // the door she came through
  solid(LEVEL.beam.x0, 8, LEVEL.beam.x1, 8); // the broken balcony
  solid(21, 0, W - 1, H - 1);                // the far side is a collapsed wall
  solid(0, 12, 11, H - 1);                   // solid ground under the landing
  solid(12, ROT, 20, ROT);                   // a rotten floor, far below
  return { W, H, m };
}

function paint(P) {
  const p = new Painter(W * TILE, H * TILE), r = rng(13), w = W * TILE, HH = H * TILE;
  p.rect(0, 0, w, HH, P.void);
  p.rect(0, 0, 12 * TILE, G, P.wallLo); for (let x = 0; x < 12 * TILE; x += 32) p.rect(x + 14, 24, 3, 120, P.wallLine);
  p.rect(0, 16, 12 * TILE, 3, P.goldLo);
  // the door she came through, shut behind her
  p.rect(2, G - 34, 14, 34, P.wood); p.rect(3, G - 33, 12, 33, P.woodHi); p.px(12, G - 17, P.gold);
  // the landing and its broken edge
  p.rect(0, G, 12 * TILE, 4, P.floor); p.rect(0, G + 4, 12 * TILE, HH - G, P.wallLo);
  for (let i = 0; i < 7; i++) p.rect(12 * TILE - 2 - r() * 10, G + r() * 10, 4 + r() * 6, 3, P.rubble);
  // the shaft: the back wall of every floor she passes, darker the deeper it goes
  p.rect(X0, G - 40, X1 - X0, HH, P.void);
  for (let y = G; y < HH; y += 2) { const k = Math.min(1, (y - G) / (HH - G)); if (r() < 0.5 - k * 0.3) p.px(X0 + r() * (X1 - X0), y, P.wallLine); }
  // floors of the house, broken off at the shaft: a ledge on each side, wallpaper above it
  for (let fy = G + 150; fy < ROT * TILE - 40; fy += 170) {
    const k = (fy - G) / (HH - G);
    p.rect(X0, fy - 120, X1 - X0, 112, k < 0.5 ? P.wallLo : P.void); p.glowRect(X0, fy - 120, X1 - X0, 112, P.void, 0.3 + k * 0.6);
    for (let x = X0 + 6; x < X1; x += 22) p.rect(x, fy - 110, 2, 96, P.wallLine);
    p.rect(X0, fy, 26 + r() * 20, 6, P.wood); p.rect(X0, fy, 26, 1, P.woodHi); for (let i = 0; i < 5; i++) p.rect(X0 + 24 + r() * 26, fy + 1 + r() * 4, 3, 2, P.wood);
    p.rect(X1 - 30 - r() * 16, fy + 8, 46, 6, P.wood); p.rect(X1 - 30, fy + 8, 30, 1, P.woodHi);
    if (r() < 0.6) { p.rect(X0 + 40 + r() * 40, fy - 70, 22, 28, P.goldLo); p.rect(X0 + 42 + r() * 2, fy - 68, 18, 24, P.wallLo); } // a frame
  }
  // things caught in the shaft: a chandelier on its chain, a bathtub wedged across, pipes, a dumbwaiter
  const cx = X0 + 60; p.rect(cx, G + 210, 1, 120, P.goldLo); p.ellipse(cx, G + 332, 12, 3, P.gold); for (let i = -10; i <= 10; i += 3) p.px(cx + i, G + 336, P.glassLit);
  p.ellipse(X1 - 40, G + 520, 22, 7, P.colHi); p.ellipse(X1 - 40, G + 518, 18, 4, P.colLo); p.rect(X1 - 58, G + 524, 3, 6, P.gold); p.rect(X1 - 24, G + 524, 3, 6, P.gold);
  for (let y = G + 60; y < HH - 80; y += 4) { p.px(X1 - 6, y, P.device); p.px(X1 - 9, y, P.colLo); }
  p.rect(X0 + 4, G + 640, 30, 40, P.wood); p.rect(X0 + 6, G + 642, 26, 36, P.void); p.rect(X0 + 18, G + 560, 1, 80, P.device);
  // the rotten floor at the bottom, and the dark under it
  p.rect(X0, ROT * TILE, X1 - X0, 6, P.wood); for (let x = X0; x < X1; x += 9) { p.rect(x, ROT * TILE, 7, 1, P.woodHi); p.px(x + 4, ROT * TILE + 3, P.crack); }
  p.rect(X0, ROT * TILE + 6, X1 - X0, HH - ROT * TILE, P.void);
  // the broken balcony, a railing piece still on it
  const bx = LEVEL.beam.x0 * TILE, bw = (LEVEL.beam.x1 - LEVEL.beam.x0 + 1) * TILE;
  p.rect(bx, 128, bw, 6, P.wood); p.rect(bx, 128, bw, 1, P.woodHi); p.rect(bx + 4, 134, bw - 8, 3, P.wood);
  for (let x = bx + 4; x < bx + bw - 8; x += 6) p.rect(x, 116, 2, 12, P.goldLo); p.rect(bx + 2, 114, bw - 10, 2, P.gold);
  p.rect(bx - 4, 134, 6, 2, P.crack); p.rect(bx + bw - 2, 130, 5, 2, P.crack);
  // the collapsed wall beyond
  p.rect(21 * TILE, 0, w - 21 * TILE, HH, P.wallLo); for (let i = 0; i < 260; i++) p.rect(21 * TILE + r() * 140, r() * HH, 3 + r() * 9, 2 + r() * 5, r() < 0.35 ? P.rubble : P.crack);
  p.rect(21 * TILE, 0, 2, HH, P.rubble);
  p.glowRect(0, G + 200, w, HH - G - 200, P.void, 0.45);
  // a stair rail hanging in the dark, and dust in the air
  p.line(13 * TILE, 40, 17 * TILE, 70, P.goldLo); p.line(17 * TILE, 70, 19 * TILE, 64, P.goldLo);
  for (let i = 0; i < 120; i++) p.px(r() * w, r() * HH, P.dust);
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
    this.dust = this.add.particles(0, 0, 'dot', { lifespan: 900, speedY: { min: 20, max: 60 }, speedX: { min: -10, max: 10 }, alpha: { start: 0.8, end: 0 }, tint: [hexNum(flat(P.dust)), 0xebe6d8], emitting: false }).setDepth(5);
    this.splinters = this.add.particles(0, 0, 'dot2', { lifespan: { min: 500, max: 1200 }, speed: { min: 40, max: 160 }, angle: { min: 200, max: 340 }, gravityY: 500, tint: [hexNum(P.wood), hexNum(P.woodHi), hexNum(flat(P.dust))], emitting: false }).setDepth(5);
    this.phase = 'walk'; this.t = 0; this.broke = null; this.cracked = false; this.spin = 0; this.chunks = []; this.black = 0;
    this.spawn();
    this.followGirl();
    this.cameras.main.fadeIn(data.fromCut ? 900 : 300);
    this.beds = { wind: Sound.wind(0.05), hum: Sound.hum(0.01) };
    Music.stop(2);
    this.events.once('shutdown', () => Object.values(this.beds).forEach(b => b.stop(0.4)));
    this.takeNote({ fromCut: data.fromCut }, 3, 'The East Wing');
    window.__game = { scene: this, state };
  }

  // review: N puts her on the balcony
  canRestart() { return (this.phase === 'walk' || this.phase === 'crack') && super.canRestart(); }
  skipAhead() { if (this.phase === 'walk') { this.kid.x = LEVEL.beam.x0 * TILE + 20; this.kid.y = LEVEL.beam.row * TILE - 14; this.kid.vy = 0; this.kid.onGround = true; } }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt; this.t += dt;
    if (this.phase === 'walk' || this.phase === 'crack') { if (this.commonKeys()) { c.endFrame(); return; } } else { c.restart(); c.look(); }
    const k = this.kid, B = LEVEL.beam;
    if (this.phase === 'walk' || this.phase === 'crack') this.moveKid(dt);
    // she lands on the balcony: a crack, a beat, then it goes
    if (this.phase === 'walk' && k.onGround && k.y + k.h <= B.row * TILE + 1 && k.x + k.w > B.x0 * TILE && k.x < (B.x1 + 1) * TILE) {
      this.phase = 'crack'; this.t = 0;
      Sound.noise(0.25, 0.12, 1800); Sound.tone(140, 0.3, 'sawtooth', 0.03, 90); fx.shake(this.cameras.main, 140, 0.004);
      this.dust.explode(10, k.x + 4, B.row * TILE + 6);
    }
    if (this.phase === 'crack' && this.t > 0.38) {
      for (let x = B.x0; x <= B.x1; x++) this.map.m[B.row][x] = 0;
      this.broke = { t: 0, y: B.row * TILE }; Sound.noise(0.6, 0.18, 1400); Sound.tone(300, 0.6, 'sawtooth', 0.03, 80);
      this.startFall();
    }
    // she missed the jump: the shaft takes her the same way
    if (this.phase === 'walk' && k.y > G + 20) this.startFall();
    if (this.phase === 'falling' || this.phase === 'through') this.fall(dt);
    if (this.phase === 'dark') this.inDark(dt);
    if (this.broke) { this.broke.t += dt; this.broke.y += 260 * this.broke.t * dt * 6; }
    this.drawGirl();
    if (this.phase === 'falling' || this.phase === 'through') {
      // tumbling: she turns over and over as she drops
      this.girl.setOrigin(0.5, 0.5).setPosition(Math.round(k.x + k.w / 2), Math.round(k.y + 7)).setAngle(this.spin).setTexture(Math.floor(this.t * 6) % 2 ? 'girl_jump' : 'girl_crouch');
    }
    this.draw(dt);
    this.hintLine();
    c.endFrame();
  }

  startFall() {
    if (this.phase === 'falling') return;
    this.phase = 'falling'; this.t = 0; this.fallT = 0;
    this.cameras.main.stopFollow();
    Sound.tone(520, 0.9, 'sine', 0.02, 180); // her breath going out
    this.whoosh = this.beds.whoosh = Sound.wind(0.0001); this.whoosh.set(0.16, 1.2);
  }
  fall(dt) {
    const k = this.kid, cam = this.cameras.main;
    this.fallT += dt;
    k.vy = Math.min(300, k.vy + 690 * dt); k.vx *= 0.96;
    k.x = Math.max(X0 + 2, Math.min(X1 - k.w - 2, k.x + k.vx * dt + Math.sin(this.fallT * 2.2) * 0.25));
    k.y += k.vy * dt; this.spin += dt * 420 * (k.vx >= 0 ? 1 : -1);
    // debris keeps her company on the way down
    if (Math.random() < dt * 9) this.chunks.push({ x: X0 + 8 + Math.random() * (X1 - X0 - 16), y: cam.worldView.y - 6, vy: k.vy * (0.8 + Math.random() * 0.5), w: 2 + Math.floor(Math.random() * 4), h: 1 + Math.floor(Math.random() * 3), c: Math.random() < 0.5 ? this.P.wood : this.P.rubble });
    if (this.phase === 'falling') {
      // the camera keeps her a little above center, so the dark below keeps coming
      const cy = cam.midPoint.y, want = k.y + 40;
      cam.centerOn(Math.round((X0 + X1) / 2), Math.round(cy + (want - cy) * Math.min(1, dt * 8)));
      if (k.y + 14 >= ROT * TILE) {
        // through the rotten floor: splinters, a crack, and the camera stays while she goes on
        this.phase = 'through'; this.t = 0;
        for (let x = 12; x <= 20; x++) this.map.m[ROT][x] = 0;
        this.splinters.explode(40, k.x + 4, ROT * TILE + 2); this.dust.explode(20, k.x + 4, ROT * TILE);
        Sound.noise(0.5, 0.2, 2600); Sound.tone(180, 0.4, 'sawtooth', 0.04, 70); fx.shake(cam, 260, 0.012);
        this.holeX = k.x;
      }
    } else if (this.t > 0.15 && k.y > cam.worldView.bottom + 12) this.goDark();
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
    const P = this.P, t = this.clock, cam = this.cameras.main;
    // falling pieces of the balcony and debris
    const bg = this.pieceG; bg.clear();
    if (this.broke && this.broke.t < 3) { const B = LEVEL.beam, y = this.broke.y; for (let i = 0; i < 5; i++) { bg.fillStyle(hexNum(i % 2 ? P.wood : P.woodHi), 1); bg.fillRect(B.x0 * TILE + i * 16 + Math.sin(i + this.broke.t * 3) * 4, y + i * 5 + this.broke.t * i * 10, 14, 5); } }
    this.chunks.forEach(ch => { ch.y += ch.vy * dt; bg.fillStyle(hexNum(ch.c), 1); bg.fillRect(Math.round(ch.x), Math.round(ch.y), ch.w, ch.h); });
    this.chunks = this.chunks.filter(ch => ch.y < cam.worldView.bottom + 20);
    if (this.phase === 'through' || this.phase === 'dark') { const hx = this.holeX || X0; bg.fillStyle(hexNum(P.void), 1); bg.fillRect(X0, ROT * TILE, X1 - X0, 6); bg.fillStyle(hexNum(P.wood), 1); bg.fillRect(X0, ROT * TILE, Math.max(0, hx - X0 - 10), 3); bg.fillRect(hx + 16, ROT * TILE, Math.max(0, X1 - hx - 16), 3); }
    // speed: thin streaks rushing up past her
    const sg = this.streakG; sg.clear();
    if (this.phase === 'falling') { const v = Math.min(1, this.kid.vy / 300); for (let i = 0; i < 14; i++) { const x = (i * 53 + 17) % 320, y = 180 - ((t * 520 + i * 67) % 220); sg.fillStyle(0xebe6d8, 0.1 * v); sg.fillRect(x, Math.round(y), 1, 10 + 14 * v); } }
    // a few red lights in the dark
    const lg = this.ledG; lg.clear();
    [[40, 30], [150, 26], [300, 52], [420, 90], [X0 + 20, G + 300], [X1 - 14, G + 460], [X0 + 90, G + 700]].forEach(([x, y], i) => { if (Math.sin(t * 2 + i * 1.7) > 0) { lg.fillStyle(hexNum(P.led), 1); lg.fillRect(x, y, 1, 1); lg.fillStyle(hexNum(P.led), 0.2); lg.fillCircle(x, y, 3); } });
    // the black she falls into, under the glasses
    const kg = this.blackG; kg.clear();
    if (this.black > 0) { kg.fillStyle(0x000000, this.black); kg.fillRect(-2, -2, 324, 184); }
    this.drawLocks([]);
    this.drawHud();
  }

  // the glasses: whole until the landing, then cracked and glitching, even in the black
  drawHud() {
    const g = this.hudG, col = hexNum(this.P.overlay); g.clear();
    const m = 5, s = 8;
    if (this.cracked) this.crackT += 1 / 60;
    const a = this.cracked ? fx.flicker(0.9, 0.15, 0.5) : 0.5;
    g.fillStyle(col, a);
    [[m, m, 1, 1], [320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy], i) => { if (this.cracked && i === 0) return; g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    if (overlay.free(320 - m - 23, 180 - m - 9, 25, 8)) pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, a);
    if (this.cracked) {
      const u = Math.min(1, this.crackT / 0.25);
      const pts = [[4, 4], [9, 7], [13, 6], [19, 11], [24, 12], [31, 18], [35, 17], [42, 23], [60, 30], [70, 44]];
      g.lineStyle(1, 0xebe6d8, 0.7);
      for (let i = 1; i < Math.ceil(pts.length * u); i++) g.lineBetween(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      g.lineBetween(13, 6, 15, 1); g.lineBetween(24, 12, 22, 19); g.lineBetween(31, 18, 37, 13);
      if (Math.random() < 0.3) { g.fillStyle(col, 0.25); g.fillRect(0, Math.random() * 180, 320, 2); }
    }
  }

  hintLine() {
    if (this.phase === 'walk') overlay.hint('The floor is gone. Jump to the balcony.');
    else overlay.hint('');
  }
}
