// Episode 3 opens here, in side view: past the laser hall, a dark stair hall with its floor gone.
// The only way on is a jump to a broken balcony. It always gives way when she lands, but it is
// built to feel like her jump did it: a crack on landing, a beat, then the drop. The fall cracks
// her glasses, and the east wing below is played from above.
import { Painter, rng, hexNum } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode, TILE } from '../core/side.js';
import { goNext } from '../core/flow.js';

const W = 30, H = 23, G = 160;
const LEVEL = { w: W, h: H, start: { x: 2 * TILE, y: G - 14 }, door: { x: -999, y: -999, w: 0, h: 0 }, beam: { x0: 15, x1: 19, row: 8 } };

function buildMap() {
  const m = []; for (let y = 0; y < H; y++) m.push(new Array(W).fill(0));
  const solid = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y][x] = 1; };
  solid(0, 10, 11, 11);                 // the landing she arrives on
  solid(0, 0, 0, 9);                     // the door she came through
  solid(LEVEL.beam.x0, 8, LEVEL.beam.x1, 8); // the broken balcony
  solid(21, 0, W - 1, H - 1);            // the far side is a collapsed wall
  solid(0, 12, 11, H - 1);               // solid ground under the landing
  solid(12, H - 1, 20, H - 1);           // the bottom of the shaft, far below
  return { W, H, m };
}

function paint(P) {
  const p = new Painter(W * TILE, H * TILE), r = rng(13), w = W * TILE;
  p.rect(0, 0, w, H * TILE, P.void);
  p.rect(0, 0, 12 * TILE, G, P.wallLo); for (let x = 0; x < 12 * TILE; x += 32) p.rect(x + 14, 24, 3, 120, P.wallLine);
  p.rect(0, 16, 12 * TILE, 3, P.goldLo);
  // the door she came through, shut behind her
  p.rect(2, G - 34, 14, 34, P.wood); p.rect(3, G - 33, 12, 33, P.woodHi); p.px(12, G - 17, P.gold);
  // the landing, its broken edge, the shaft below
  p.rect(0, G, 12 * TILE, 4, P.floor); p.rect(0, G + 4, 12 * TILE, H * TILE - G, P.wallLo);
  for (let i = 0; i < 7; i++) p.rect(12 * TILE - 2 - r() * 10, G + r() * 10, 4 + r() * 6, 3, P.rubble);
  p.rect(12 * TILE, G - 40, 9 * TILE, H * TILE, P.void);
  for (let y = G; y < H * TILE; y += 18) p.rect(12 * TILE + r() * 100, y, 1, 10, P.wallLine);
  // the broken balcony, a railing piece still on it
  const bx = LEVEL.beam.x0 * TILE, bw = (LEVEL.beam.x1 - LEVEL.beam.x0 + 1) * TILE;
  p.rect(bx, 128, bw, 6, P.wood); p.rect(bx, 128, bw, 1, P.woodHi); p.rect(bx + 4, 134, bw - 8, 3, P.wood);
  for (let x = bx + 4; x < bx + bw - 8; x += 6) p.rect(x, 116, 2, 12, P.goldLo); p.rect(bx + 2, 114, bw - 10, 2, P.gold);
  p.rect(bx - 4, 134, 6, 2, P.crack); p.rect(bx + bw - 2, 130, 5, 2, P.crack);
  // the collapsed wall beyond
  p.rect(21 * TILE, 0, w - 21 * TILE, H * TILE, P.wallLo); for (let i = 0; i < 70; i++) p.rect(21 * TILE + r() * 140, r() * H * TILE, 3 + r() * 9, 2 + r() * 5, r() < 0.35 ? P.rubble : P.crack);
  p.rect(21 * TILE, 0, 2, H * TILE, P.rubble);
  // a stair rail hanging in the dark, and dust in the air
  p.line(13 * TILE, 40, 17 * TILE, 70, P.goldLo); p.line(17 * TILE, 70, 19 * TILE, 64, P.goldLo);
  for (let i = 0; i < 40; i++) p.px(r() * w, r() * H * TILE, P.dust);
  p.rect(12 * TILE, H * TILE - 16, 9 * TILE, 16, P.rubble);
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
    this.hudG = this.addParallax(this.add.graphics().setDepth(20), 0);
    this.dust = this.add.particles(0, 0, 'dot', { lifespan: 900, speedY: { min: 20, max: 60 }, speedX: { min: -10, max: 10 }, alpha: { start: 0.8, end: 0 }, tint: [hexNum(P.dust), 0xffffff], emitting: false }).setDepth(5);
    this.phase = 'walk'; this.t = 0; this.broke = null; this.cracked = false;
    this.spawn();
    this.followGirl();
    this.cameras.main.fadeIn(data.fromCut ? 900 : 300);
    this.beds = { wind: Sound.wind(0.05), hum: Sound.hum(0.01) };
    this.events.once('shutdown', () => Object.values(this.beds).forEach(b => b.stop(0.4)));
    this.takeNote({ fromCut: data.fromCut }, 3, 'The East Wing');
    window.__game = { scene: this, state };
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt; this.t += dt;
    if (this.commonKeys()) { c.endFrame(); return; }
    if (this.phase !== 'gone') this.moveKid(dt);
    const k = this.kid, B = LEVEL.beam;
    // she lands on the balcony: a crack, a beat, then it goes
    if (this.phase === 'walk' && k.onGround && k.y + k.h <= B.row * TILE + 1 && k.x + k.w > B.x0 * TILE && k.x < (B.x1 + 1) * TILE) {
      this.phase = 'crack'; this.t = 0;
      Sound.noise(0.25, 0.12, 1800); Sound.tone(140, 0.3, 'sawtooth', 0.03, 90); this.cameras.main.shake(140, 0.004);
      this.dust.explode(10, k.x + 4, B.row * TILE + 6);
    }
    if (this.phase === 'crack' && this.t > 0.38) {
      this.phase = 'falling'; this.t = 0;
      for (let x = B.x0; x <= B.x1; x++) this.map.m[B.row][x] = 0;
      this.broke = { t: 0, y: B.row * TILE }; Sound.noise(0.6, 0.18, 1400); Sound.tone(300, 0.6, 'sawtooth', 0.03, 80);
      this.cameras.main.stopFollow(); this.cameras.main.startFollow(this.girl, true, 0.08, 0.2, 0, -20);
    }
    // she missed the jump: the shaft takes her the same way
    if (this.phase === 'walk' && k.y > G + 30) { this.phase = 'falling'; this.t = 0; this.cameras.main.startFollow(this.girl, true, 0.08, 0.2, 0, -20); }
    if (this.phase === 'falling' && k.onGround && k.y > G + 40) this.impact();
    if (this.broke) { this.broke.t += dt; this.broke.y += 260 * this.broke.t * dt * 6; }
    this.drawGirl();
    this.draw();
    this.hintLine();
    c.endFrame();
  }

  impact() {
    if (this.phase === 'gone') return;
    this.phase = 'gone'; this.cracked = true; this.crackT = 0;
    this.cameras.main.shake(300, 0.02); this.cameras.main.flash(260, 255, 255, 255);
    Sound.noise(0.5, 0.2, 2200); Sound.tone(2400, 0.08, 'square', 0.03); this.time.delayedCall(90, () => Sound.tone(1700, 0.12, 'square', 0.025, 400));
    this.dust.explode(20, this.kid.x + 4, this.kid.y + 14);
    this.time.delayedCall(1300, () => this.cameras.main.fadeOut(900, 0, 0, 0));
    this.time.delayedCall(2300, () => { if (!goNext(this, 'ep3')) overlay.hint('The east wing is not built yet.'); });
  }

  draw() {
    const P = this.P, t = this.clock;
    // falling pieces of the balcony
    const bg = this.pieceG; bg.clear();
    if (this.broke && this.broke.t < 2) { const B = LEVEL.beam, y = this.broke.y; for (let i = 0; i < 5; i++) { bg.fillStyle(hexNum(i % 2 ? P.wood : P.woodHi), 1); bg.fillRect(B.x0 * TILE + i * 16 + Math.sin(i + this.broke.t * 3) * 4, y + i * 5 + this.broke.t * i * 10, 14, 5); } }
    // a few red lights in the dark
    const lg = this.ledG; lg.clear();
    [[40, 30], [150, 26], [300, 52], [420, 90]].forEach(([x, y], i) => { if (Math.sin(t * 2 + i * 1.7) > 0) { lg.fillStyle(hexNum(P.led), 1); lg.fillRect(x, y, 1, 1); lg.fillStyle(hexNum(P.led), 0.2); lg.fillCircle(x, y, 3); } });
    this.drawLocks([]);
    this.drawHud();
  }

  // the glasses: whole until the fall, then cracked and glitching
  drawHud() {
    const g = this.hudG, col = hexNum(this.P.overlay); g.clear();
    const m = 5, s = 8;
    if (this.cracked) this.crackT += 1 / 60;
    const a = this.cracked ? (Math.random() < 0.5 ? 0.9 : 0.15) : 0.5;
    g.fillStyle(col, a);
    [[m, m, 1, 1], [320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy], i) => { if (this.cracked && i === 0) return; g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, a);
    if (this.cracked) {
      const u = Math.min(1, this.crackT / 0.25);
      const pts = [[4, 4], [9, 7], [13, 6], [19, 11], [24, 12], [31, 18], [35, 17], [42, 23], [60, 30], [70, 44]];
      g.lineStyle(1, 0xffffff, 0.7);
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
