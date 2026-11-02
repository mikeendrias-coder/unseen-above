// Episode 1: the grounds. Side view, from the ash outside the gate to the front door.
// Searchlights and drones are both the spectacle and the surveillance. A death restarts the
// episode, and the body stays where it fell, older on every take.
import { Music } from '../core/music.js';
import { LOOKS } from '../art/palettes.js';
import { hexNum, flat, rng } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { TILE, VIEW_W, VIEW_H, GROUND, LEVEL, buildMap, paintSky, paintMoon, paintCity, paintLevel } from '../art/estate.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode } from '../core/side.js';
import { goNext } from '../core/flow.js';
import { NOTICE } from '../data/dialogue.js';
import { Painter } from '../art/painter.js';
import { SatelliteStrike } from '../art/strike.js';
import { fx } from '../core/fx.js';

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

export class Grounds extends SideEpisode {
  constructor() { super('grounds'); }

  create(data) {
    this.initSide('ep1', LEVEL, buildMap());
    const P = this.P;
    makeSprites(this, P);
    // painted layers
    const LW = LEVEL.w * TILE;
    paintSky(P, VIEW_W).toTexture(this, 'g_sky');
    paintMoon(P).toTexture(this, 'g_moon');
    const city = paintCity(P, Math.ceil(LW * 0.15) + VIEW_W); city.toTexture(this, 'g_city');
    const lvl = paintLevel(P); lvl.toTexture(this, 'g_level');
    this.marks = lvl.marks; this.cityMarks = city.marks;
    this.pixelCamera(LW, P.skyTop);
    // parallax layers
    this.addParallax(this.add.image(0, 0, 'g_sky').setOrigin(0).setDepth(-10), 0);
    this.addParallax(this.add.image(250, 22, 'g_moon').setDepth(-9), 0.02, 250, 22);
    this.skyFx = this.addParallax(this.add.graphics().setDepth(-8).setBlendMode(Phaser.BlendModes.ADD), 0.3);
    this.showG = this.addParallax(this.add.graphics().setDepth(-7), 0.25);
    this.fireworksG = this.addParallax(this.add.graphics().setDepth(-7), 0.2);
    this.addParallax(this.add.image(0, 0, 'g_city').setOrigin(0).setDepth(-6), 0.15);
    this.cityFx = this.addParallax(this.add.graphics().setDepth(-6).setBlendMode(Phaser.BlendModes.ADD), 0.15);
    this.add.image(0, 0, 'g_level').setOrigin(0).setDepth(0);
    this.twinkleG = this.add.graphics().setDepth(1);
    this.droneSprites = LEVEL.drones.map(() => this.add.sprite(0, 0, 'drone_a').setDepth(3));
    // his crowbar, just inside the gate
    const cb = new Painter(14, 5); cb.rect(1, 3, 11, 1, P.device); cb.rect(2, 2, 9, 1, P.colLo); cb.rect(11, 0, 1, 3, P.colLo); cb.rect(12, 0, 2, 1, P.colLo); cb.rect(0, 3, 3, 2, P.hazard); cb.toTexture(this, 'crowbar');
    this.add.image(LEVEL.crowbar.x, LEVEL.crowbar.y, 'crowbar').setOrigin(0.5, 1).setDepth(1.5);
    this.scanG = this.add.graphics().setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    this.commonLayers();
    this.props = LEVEL.props.map(r => Object.assign({}, r));
    const CB = LEVEL.crowbar, SD = LEVEL.shedDoor;
    this.crowbarSrc = { lines: ['His crowbar. He came this way.'] };
    this.things.push({ x0: CB.x - 8, x1: CB.x + 8, y0: GROUND - 6, y1: GROUND, use: () => this.bubbles.look('item', this.crowbarSrc, () => ({ x: CB.x, y: GROUND - 6 })) });
    this.things.push({ x0: SD.x, x1: SD.x + SD.w, y0: SD.y, y1: GROUND, door: true, use: () => this.enterRoom('keeper') });
    // things to look at on the way up to the house
    const N = NOTICE.grounds, G = GROUND, T = TILE, look = (x0, x1, py, lines, more) => this.addLook(Object.assign({ x0, x1, y0: G - 40, py, lines }, more));
    look(28, 58, G - 50, N.tree);
    look(116, 158, G - 16, N.car);
    look(222, 262, G - 54, N.gate);
    look(21 * T - 4, 23 * T, 8 * T, N.hedge);
    look(43 * T + 2, 52 * T - 2, 110, N.fountain, { y0: 100 });
    [60, 66, 72].forEach(t => look(t * T - 4, t * T + 20, 104, N.statue, { y0: 100 }));
    look(81 * T - 2, 84 * T + 2, 96, N.pergola, { y0: 90 }); look(88 * T - 2, 91 * T + 2, 96, N.pergola, { y0: 90 });
    look(84 * T + 6, 88 * T - 6, 176, N.pool, { y0: 150 });
    this.scan = null;

    // particles: fountain spray, ash outside the wall, sparkles on gold
    const fountain = this.marks.find(m => m.kind === 'fountain');
    this.add.particles(fountain.x, fountain.y, 'dot', { speedY: { min: -46, max: -26 }, speedX: { min: -14, max: 14 }, gravityY: 90, lifespan: 900, frequency: 45, alpha: { start: 0.9, end: 0 }, tint: [hexNum(P.glassLit), 0xffffff] }).setDepth(1);
    this.add.particles(0, -6, 'dot', { x: { min: 0, max: LEVEL.gateX + 20 }, speedY: { min: 7, max: 16 }, speedX: { min: 2, max: 9 }, lifespan: 15000, frequency: 70, alpha: { start: 0.8, end: 0.2 }, tint: [hexNum(flat(P.dust)), hexNum(flat(P.rubbleHi))], deathZone: { type: 'onLeave', source: new Phaser.Geom.Rectangle(-20, -20, LEVEL.gateX + 60, VIEW_H + 40) } }).setDepth(6);
    this.sparkle = this.add.particles(0, 0, 'sparkle', { lifespan: 520, scale: { start: 0.2, end: 1, ease: 'Sine.easeOut' }, alpha: { start: 1, end: 0 }, emitting: false, blendMode: 'ADD' }).setDepth(6);

    // drone show and fireworks state
    this.show = { idx: 0, t: 0, drones: Array.from({ length: N_DRONES }, (_, i) => ({ x: 335 + (i % 12) * 3, y: 60, tx: 0, ty: 0, hue: i % 5 })) };
    this.setFigure(SHOW[0][0]);
    this.fireworks = []; this.nextFirework = 3;
    this.wasInside = undefined; this.sparkT = 0;
    this.lights = LEVEL.lights.map(l => Object.assign({}, l, { lock: 0, cone: null }));
    this.drones = LEVEL.drones.map(d => Object.assign({}, d, { x: d.x0 + (d.x1 - d.x0) * 0.3, dir: 1, lock: 0, cone: null }));
    this.skipPoints = [12, 30, 50, 70, 88, 103].map(v => v * TILE);
    this.drawBodies();
    this.spawn(data && data.fromIntro ? 1 * TILE : null);
    this.followGirl();
    this.cameras.main.fadeIn(data && data.fromIntro ? 900 : 350);
    this.beds = { wind: Sound.wind(0.14), lounge: Sound.lounge(0.0001) };
    Music.play('grounds');
    this.events.once('shutdown', () => { this.beds.wind.stop(0.4); this.beds.lounge.stop(0.4); });
    this.takeNote({ fromCut: data && data.fromIntro }, 1, 'The Grounds');
    window.__game = { scene: this, state };
  }

  setFigure(name) {
    const pts = FIGURES[name]();
    const order = pts.map((p, i) => i).sort(() => Math.random() - 0.5);
    this.show.drones.forEach((d, i) => { const p = pts[order[i]]; d.tx = 303 + p[0]; d.ty = 4 + p[1]; });
    this.show.name = name;
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (this.commonKeys()) { c.endFrame(); return; }
    if (this.done) { c.endFrame(); return; }
    if (!this.dead && !this.leaving) { this.moveKid(dt); this.updateThings(); }
    else if (this.dead && this.girl.visible) this.settle(dt);
    this.updateScan(dt);
    this.updateLights(dt);
    this.updateDrones(dt);
    this.updateAmbience(dt);
    this.draw(dt);
    this.hint();
    c.endFrame();
  }

  // ------------------------------------------------------------------ lights and drones
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
  enterDoor() {
    if (this.leaving) return;
    this.leaving = true; state.finish(this.epId);
    const cam = this.cameras.main, D = LEVEL.door;
    cam.stopFollow(); cam.pan(D.x + D.w / 2, D.y + D.h / 2, 900, 'Sine.easeInOut');
    Sound.chime(); this.beds.lounge.set(0.0001, 1.2);
    this.time.delayedCall(900, () => cam.fadeOut(900, 0, 0, 0));
    this.time.delayedCall(1900, () => {
      this.done = true;
      overlay.card('END OF EPISODE 1', 'Take ' + this.ep.take, 3400); overlay.bug('CH 07', 1400);
      overlay.hint('');
    });
    this.time.delayedCall(5600, () => goNext(this, 'ep1'));
  }

  // ------------------------------------------------------------------ the scan: a fast run to the door
  // At the foot of the stairs the satellite scans the grounds: a wall of light sweeps in from
  // behind her. It is slower than she runs, but not by much. If it reaches her, the strike comes.
  updateScan(dt) {
    const S = LEVEL.scan, k = this.kid;
    if (!this.scan) {
      if (!this.dead && !this.leaving && k.x > S.trigger) {
        this.scan = { x: k.x - S.behind, t: 0 };
        overlay.sfx('[ALARM]', 1600); Sound.tone(520, 0.5, 'sawtooth', 0.03, 1040);
        fx.flash(this.cameras.main, 120, 90, 20, 20);
      }
      return;
    }
    const sc = this.scan; sc.t += dt;
    if (!this.dead && !this.leaving) sc.x += S.speed * dt;
    if (Math.floor(sc.t * 2) !== Math.floor((sc.t - dt) * 2) && !this.leaving) Sound.tone(sc.t % 1 < 0.5 ? 880 : 660, 0.12, 'square', 0.012);
    if (!this.dead && !this.leaving && !window.__noDeath && k.x + k.w / 2 < sc.x + 3) { this.satX = sc.x; this.die({ id: 'scan', x: sc.x, y: 20 }); }
  }
  drawScan() {
    const g = this.scanG; g.clear();
    if (!this.scan) return;
    const P = this.P, v = this.cameras.main.worldView, x = this.scan.x, t = this.clock, col = hexNum(P.hazard), soft = hexNum(P.shaft);
    // the band of light: soft edges, a hard core, scanlines running down it
    g.fillStyle(soft, 0.06); g.fillRect(x - 40, v.y, 40, v.height);
    g.fillStyle(col, 0.12); g.fillRect(x - 10, v.y, 12, v.height);
    g.fillStyle(col, 0.35); g.fillRect(x - 2, v.y, 3, v.height);
    g.fillStyle(0xffffff, 0.8); g.fillRect(x, v.y, 1, v.height);
    for (let y = (t * 120) % 12; y < v.height; y += 12) { g.fillStyle(col, 0.4); g.fillRect(x - 8, v.y + y, 9, 1); }
    // the satellite doing the scanning, at the top of the band
    if (!this.dead) SatelliteStrike.drawSat(this.fxG, P, x, v.y + 3, g, 0.6 + 0.4 * Math.sin(t * 20));
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
    const P = this.P, t = this.clock;
    this.drawGirl();
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
    this.lights.forEach(l => this.drawCone(bg, l, 0.11, P.shaft));
    this.drones.forEach(d => this.drawCone(bg, d, 0.13, P.shaft));
    this.drawLocks([...this.lights, ...this.drones]);
    this.drawScan();
    this.drawThings();
  }

  hint() {
    const x = this.kid.x / TILE;
    if (this.leaving || this.done) return;
    if (x < 14) return overlay.hint('Arrows or A/D move. Space jumps. Down crouches. E uses things. L switches the look. R restarts the episode.');
    if (x < 39) return overlay.hint('A lamp sweeps the garden. Hedges block its light: wait in their shadow, move when it swings away.');
    if (x < 56) return overlay.hint('A drone patrols the fountain. Its light cannot reach under the upper bowl.');
    if (x < 77) return overlay.hint('Two lamps on the wall. The statue plinths cast shadows.');
    if (x < 95) return overlay.hint('A faster drone. The pergolas are cover.');
    if (this.scan) return overlay.hint('The grounds are being scanned. Keep moving: if the light reaches you, the strike comes. Up or E at the door.');
    return overlay.hint('Two lamps cross over the stairs. Find the gap, then press Up or E at the door.');
  }
}
