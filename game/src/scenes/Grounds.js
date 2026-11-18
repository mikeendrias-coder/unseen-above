// Episode 1: the grounds. From the ash outside the gate, up through the garden, the terraces and
// the face of the house to the front door on the balcony. Rebuilt Nov 17 (final pass): a tall
// level in seven short sections (art/estate.js lists them), physics props (core/props.js), the
// house hurts her (falls, a crate), what watches her kills her (lamps, drones, the scan).
// A death starts the next take at the last tape mark she reached (core/props.js Marks); out of
// lives, the episode starts from the top. The body stays where it fell, older on every take.
import { Music } from '../core/music.js';
import { hexNum, Painter } from '../art/painter.js';
import { makeSprites, girlFrame } from '../art/sprites.js';
import { TILE, VIEW_W, GROUND, TERRACE, BALCONY, LEVEL, CITY_GROUND, buildMap, paintSky, paintMoon, paintCity, paintLevel } from '../art/estate.js';
import { ASH } from '../art/palettes.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { display } from '../core/display.js';
import { SideEpisode, inPoly } from '../core/side.js';
import { Props, Marks, Gold, hardCone } from '../core/props.js';
import { goNext, prevChapter } from '../core/flow.js';
import { NOTICE } from '../data/dialogue.js';
import { addBook } from '../core/books.js';
import { addTv } from '../core/tv.js';
import { SatelliteStrike } from '../art/strike.js';
import { fx } from '../core/fx.js';

const T = TILE, C = k => hexNum(ASH[k]), SKIP_SAFE = 2;
// Drone show figures, as point lists in a 64 x 30 box.
function outline(pts, n) {
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l]); total += l; }
  const out = []; for (let k = 0; k < n; k++) { let d = (k / n) * total; for (const [a, b, l] of segs) { if (d <= l) { out.push([a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]); break; } d -= l; } }
  return out;
}
const N_DRONES = 72;
const FIGURES = {
  diamond: () => outline([[14, 8], [22, 0], [42, 0], [50, 8], [32, 30], [14, 8], [50, 8]], N_DRONES),
  crown: () => outline([[10, 28], [10, 6], [20, 18], [32, 0], [44, 18], [54, 6], [54, 28], [10, 28]], N_DRONES),
  seven: () => outline([[16, 2], [48, 2], [30, 30], [26, 30], [42, 6], [16, 6], [16, 2]], N_DRONES),
  tv: () => outline([[22, -6], [30, 4], [38, -6], [30, 4], [14, 4], [50, 4], [50, 30], [14, 30], [14, 4]], N_DRONES)
};
const SHOW = [['diamond', 7], ['crown', 7], ['seven', 5], ['tv', 4], ['crown', 6]];

export class Grounds extends SideEpisode {
  constructor() { super('grounds'); }

  create(data) {
    this.map0 = buildMap();
    this.initSide('ep1', LEVEL, this.map0);
    const P = this.P, LW = LEVEL.w * T, LH = LEVEL.h * T;
    makeSprites(this, P);
    paintSky(P, VIEW_W).toTexture(this, 'g_sky');
    paintMoon(P).toTexture(this, 'g_moon');
    const city = paintCity(P, Math.ceil(LW * 0.15) + VIEW_W); city.toTexture(this, 'g_city');
    const lvl = paintLevel(P, this.map0); lvl.toTexture(this, 'g_level');
    this.marks = lvl.marks; this.cityMarks = city.marks;
    this.pixelCamera(LW, P.skyTop);
    this.cameras.main.setBounds(0, 0, LW, LH);
    // far layers: the sky stays put; the city drifts with her (its ground line sits low on
    // screen when she is on the lawn); the drone show and searchlights stay in the sky
    const low = LH - 180;
    this.addParallax(this.add.image(0, 0, 'g_sky').setOrigin(0).setDepth(-10), 0);
    this.addParallax(this.add.image(250, 26, 'g_moon').setDepth(-9), 0, 250, 26);
    this.skyFx = this.addParallax(this.add.graphics().setDepth(-8), 0.3); this.skyFx.fy = 0;
    this.showG = this.addParallax(this.add.graphics().setDepth(-7), 0.25); this.showG.fy = 0;
    this.fireworksG = this.addParallax(this.add.graphics().setDepth(-7), 0.2); this.fireworksG.fy = 0;
    const cityY = 152 - CITY_GROUND + low * 0.15;
    this.addParallax(this.add.image(0, 0, 'g_city').setOrigin(0).setDepth(-6), 0.15, 0, cityY);
    this.cityFx = this.addParallax(this.add.graphics().setDepth(-6), 0.15, 0, cityY);
    this.place();
    this.add.image(0, 0, 'g_level').setOrigin(0).setDepth(0);
    this.floorG = this.add.graphics().setDepth(1);   // footprints, koi
    this.twinkleG = this.add.graphics().setDepth(1.2);
    this.floorKoi = this.add.graphics().setDepth(1.1);
    this.droneSprites = LEVEL.drones.map(() => this.add.sprite(0, 0, 'drone_a').setDepth(3));
    // his crowbar, just inside the gate
    const cb = new Painter(16, 6); cb.rect(0, 2, 16, 4, '#0e0f12'); cb.rect(1, 3, 12, 1, P.device); cb.rect(2, 2, 10, 1, P.colLo); cb.rect(12, 0, 3, 4, '#0e0f12'); cb.rect(12, 1, 2, 2, P.colLo); cb.rect(1, 4, 3, 1, P.device); cb.toTexture(this, 'crowbar');
    this.add.image(LEVEL.crowbar.x, LEVEL.crowbar.y, 'crowbar').setOrigin(0.5, 1).setDepth(1.5);
    this.coneG = this.add.graphics().setDepth(3.8);
    this.scanG = this.add.graphics().setDepth(6);
    this.commonLayers();
    this.props = LEVEL.props.map(r => Object.assign({}, r));
    this.dyn = new Props(this, { depth: 3.6 });
    this.crate = this.dyn.crate(Object.assign({ id: 'crate' }, LEVEL.crate));
    const CR = LEVEL.cradle;
    this.cradle = this.dyn.mover({ id: 'cradle', x: CR.x, y: CR.bottom, w: CR.w, h: 6, path: [{ x: CR.x, y: CR.bottom }, { x: CR.x, y: CR.top }], speed: CR.speed, pause: CR.pause, wait: CR.pause, roof: CR.roof, cable: 4 });
    this.slabs = LEVEL.slabs.map(s => this.dyn.crumble({ id: 'foam slab', x: s.x, y: s.y, w: s.w, h: 8, delay: 0.32, back: 2.5 }));
    // the garden furniture: pushed, knocked over, climbed, and it blocks light (core/props.js)
    this.furniture = LEVEL.furniture.map(f => {
      const p = this.dyn.piece(Object.assign({}, f));
      (f.loose || []).forEach(l => this.dyn.item(Object.assign({}, l, { x: p.x + l.dx, y: p.y })));
      return p;
    });
    this.addThings();
    this.scan = null;

    // the fountain sprays square drops; ash drifts down outside the wall
    const fountain = this.marks.find(m => m.kind === 'fountain');
    this.add.particles(fountain.x, fountain.y, 'dot', { speedY: { min: -40, max: -24 }, speedX: { min: -12, max: 12 }, gravityY: 90, lifespan: 800, frequency: 70, tint: [C('goldHi'), C('bone')] }).setDepth(1);
    this.add.particles(0, 0, 'dot', { x: { min: 0, max: LEVEL.gateX + 20 }, y: { min: GROUND - 200, max: GROUND - 120 }, speedY: { min: 7, max: 14 }, speedX: { min: 2, max: 8 }, lifespan: 12000, frequency: 110, tint: [C('ash4'), C('ash5')], deathZone: { type: 'onLeave', source: new Phaser.Geom.Rectangle(-20, GROUND - 220, LEVEL.gateX + 60, 222) } }).setDepth(6);
    this.glints = [];

    // drone show and fireworks state
    this.show = { idx: 0, t: 0, drones: Array.from({ length: N_DRONES }, (_, i) => ({ x: 335 + (i % 12) * 3, y: 60, tx: 0, ty: 0, hue: i % 3 })) };
    this.setFigure(SHOW[0][0]);
    this.fireworks = []; this.nextFirework = 3;
    this.wasInside = undefined; this.sparkT = 0;
    this.lights = LEVEL.lights.map(l => Object.assign({}, l, { lock: 0, cone: null, u: 0, hold: 0, cd: 0 }));
    this.drones = LEVEL.drones.map(d => Object.assign({}, d, { x: d.x0 + (d.x1 - d.x0) * 0.3, dir: 1, lock: 0, cone: null }));
    this.skipPoints = LEVEL.skip.map(([x]) => x * T);
    // the show's tape marks: a death goes back to the last one she stood on (core/props.js)
    this.markG = this.add.graphics().setDepth(1.3);
    this.tape = new Marks(this, LEVEL.marks.map(([x, y]) => ({ x, y })));
    this.gold = new Gold(this, LEVEL.gold.map(([x, y]) => ({ x, y })));
    this.drawBodies();
    this.drawFloor();
    this.spawn(data && data.fromIntro ? 1 * T : null);
    // back at a mark: a beat to get her bearings before a light can lock on
    if (this.tape.from) this.safeT = 1;
    this.followGirl();
    this.cameras.main.fadeIn(data && data.fromIntro ? 900 : 350);
    this.beds = { wind: Sound.wind(0.14), lounge: Sound.lounge(0.0001) };
    Music.play('grounds');
    this.events.once('shutdown', () => { this.beds.wind.stop(0.4); this.beds.lounge.stop(0.4); });
    this.takeNote({ fromCut: data && data.fromIntro }, 1, 'The Grounds');
    window.__game = { scene: this, state };
  }

  // A layer can keep still vertically (fy 0) while it drifts sideways: the sky's things.
  place() {
    super.place();
    const S = display.S;
    this.par.forEach(e => { if (e.o.fy === 0) e.o.setScrollFactor(e.f, 0).setPosition(e.x + 160 * (S - 1) * (1 - e.f), e.y + 90 * (S - 1)); });
  }

  // ------------------------------------------------------------------ things to use and look at
  addThings() {
    const N = NOTICE.grounds, G = GROUND, TR = TERRACE, CB = LEVEL.crowbar, SD = LEVEL.shedDoor, MB = LEVEL.mailbox, IC = LEVEL.intercom;
    // a look says all of itself the first time; on a later take, only its last line
    const once = (key, lines) => { if (state.heard('look:ep1:' + key)) return lines.slice(-1); return lines; };
    const look = (key, x0, x1, y0, y1, py, lines, more) => this.addLook(Object.assign({ x0, x1, y0, y1, py, lines: once(key, lines), hearKey: 'look:ep1:' + key }, more));
    look('crowbar', CB.x - 9, CB.x + 9, G - 8, G, G - 8, N.crowbar, { px: CB.x });
    look('gate', LEVEL.gateX - 4, LEVEL.gateX + 16, G - 40, G, G - 46, N.gate);
    this.things.push({ x0: SD.x, x1: SD.x + SD.w, y0: SD.y, y1: G, label: 'J', door: true, use: () => this.enterRoom('keeper') });
    // the intercom on the gate pier answers in the house's machine voice
    this.intercomSrc = { lines: N.intercom, loop: true, from: 1 };
    this.things.push({ x0: IC.x - 10, x1: IC.x + 8, y0: G - 40, y1: G, px: IC.x + 1, py: IC.y, label: 'J', use: () => this.bubbles.press('intercom', this.intercomSrc, () => ({ x: IC.x + 1, y: IC.y - 2 }), { ink: 0xebe6d8, pitch: 1180, leave: 64 }) });
    look('tree', 18, 46, G - 40, G, G - 40, N.tree);
    look('car', 90, 128, G - 20, G, G - 18, N.car);
    look('mailbox', MB.x - 8, MB.x + 8, G - 30, G, G - 28, N.mailbox, { clue: 'request1' });
    // footprints in the ash: his; later, hers too
    const mine = this.ep.bodies.length > 0;
    this.addLook({ x0: 2 * T, x1: 9 * T, y0: G - 14, y1: G, py: G - 4, lines: mine ? N.footprints2 : N.footprints, clue: mine ? 'footprints' : undefined });
    look('hedge', 20 * T, 22 * T, 22 * T - 10, G, 22 * T, N.hedge);
    look('orangery', 23 * T, 25 * T - 2, G - 40, G, G - 44, N.orangery);
    look('fountain', 42 * T, 48 * T, TR - 40, TR, TR - 10, N.fountain);
    look('statue', 52 * T - 6, 53 * T + 6, 15 * T - 24, 15 * T, 15 * T - 26, N.statue, { clue: 'statue07' });
    look('crate', LEVEL.crate.x - 4, LEVEL.crate.x + 20, TR - 30, TR, TR - 28, N.crate);
    look('cradle', 70 * T, 72 * T, 12 * T - 30, 12 * T, 12 * T - 24, N.cradle);
    // the house tidies its own looks away once said: mark them heard as they are used
    // (heard once a line of it is out, ui/typer.js, not when it is asked for)
    this.things.forEach(t => { if (t.hearKey) t.src.key = t.hearKey; });
    // the book (Part I): by the tree, behind where she starts, out of reach until she turns back
    addBook(this, 1, { x: 6, y: G }, { reach: 5 });
    // the secret TV beside it, at the foot of the dead tree: J turns it on and the trailer plays in it (core/tv.js)
    addTv(this, { x: 24, y: G });
  }

  // footprints in the ash outside the wall, and the koi (drawn live)
  drawFloor() {
    const g = this.floorG, G = GROUND, gate = LEVEL.gateX + 8; g.clear();
    // his: long strides, straight to the gate
    g.fillStyle(C('ash1'), 1);
    for (let x = 6; x < gate; x += 11) { g.fillRect(x, G + 4 + ((x / 11) & 1) * 2, 3, 1); }
    // hers, one track a take (the last four), each a little off the last, stopping where she fell
    const takes = this.ep.bodies.slice(-4);
    takes.forEach((b, i) => {
      const end = b.y >= G - 2 ? Math.min(b.x, gate) : gate, row = G + 9 + i * 2;
      g.fillStyle(C(i % 2 ? 'ash1' : 'ash0'), 1);
      for (let x = LEVEL.start.x + (i * 3) % 7; x < end; x += 8) g.fillRect(Math.round(x), row + ((x / 8) & 1), 2, 1);
    });
  }

  setFigure(name) {
    const pts = FIGURES[name]();
    const order = pts.map((p, i) => i).sort(() => Math.random() - 0.5);
    this.show.drones.forEach((d, i) => { const p = pts[order[i]]; d.tx = 300 + p[0]; d.ty = 8 + p[1]; });
    this.show.name = name;
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt; this.safeT = Math.max(0, (this.safeT || 0) - dt);
    if (this.commonKeys()) { c.endFrame(); return; }
    if (this.done) { c.endFrame(); return; }
    if (!this.dead && !this.leaving) { this.dyn.step(dt, () => this.moveKid(dt)); this.updateThings(); this.tape.update(dt); }
    else { this.dyn.update(dt); if (this.dead && this.girl.visible) this.settle(dt); }
    this.gold.update(dt);
    this.updateScan(dt);
    this.updateLights(dt);
    this.updateDrones(dt);
    this.updateAmbience(dt);
    this.draw(dt);
    this.hint();
    c.endFrame();
  }

  // ------------------------------------------------------------------ lights and drones
  // A lamp sweeping across one of her old bodies stops on it for a beat, as if framing it.
  updateLights(dt) {
    const bodies = this.ep.bodies, v = this.cameras.main.worldView;
    this.lights.forEach(l => {
      l.cd = Math.max(0, l.cd - dt);
      if (l.hold > 0) l.hold -= dt; else l.u += dt;
      const s = (Math.sin((l.u / l.period + l.phase) * Math.PI * 2) + 1) / 2;
      l.angle = l.a0 + (l.a1 - l.a0) * s;
      // far off screen, a lamp still moves, but only lamps near her are worked out in full
      if (Math.abs(l.x - v.centerX) > 520 || Math.abs(l.y - v.centerY) > 420) { l.cone = null; l.lock = 0; return; }
      l.cone = this.cone(l.x, l.y, l.angle, l.half, l.range);
      if (l.hold <= 0 && l.cd <= 0) { const b = bodies.find(b => b !== l.last && inPoly(l.cone, b.x, b.y - 3)); if (b) { l.hold = 0.7; l.cd = 2.6; l.last = b; } }
      if (this.safeT > 0) l.lock = 0; else this.watch(l, dt);
    });
  }
  updateDrones(dt) {
    this.drones.forEach((d, i) => {
      if (d.lock === 0) { d.x += d.dir * d.speed * dt; if (d.x > d.x1) { d.x = d.x1; d.dir = -1; } if (d.x < d.x0) { d.x = d.x0; d.dir = 1; } }
      d.cy = d.y + (Math.floor(this.clock * 2 + i) % 2);
      d.cone = this.cone(d.x, d.cy + 5, 90, d.half, d.range);
      if (this.safeT > 0) d.lock = 0; else this.watch(d, dt);
      this.droneSprites[i].setPosition(Math.round(d.x), Math.round(d.cy)).setTexture(Math.floor(this.clock * 20) % 2 ? 'drone_a' : 'drone_b');
    });
  }

  // ------------------------------------------------------------------ the door
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
  // The balcony ends in a wall just past the door, and anywhere from the door to that wall
  // counts as at the door: a run with Shift that slides past it still gets her in.
  atDoor() { const k = this.kid, d = LEVEL.door; return k.x + k.w > d.x + 2 && k.x < d.x + d.w + 12 && Math.abs(k.y + k.h - (d.y + d.h)) < 4; }
  // story mode N: the start of the next section
  skipAhead() {
    const k = this.kid; if (!k || this.dead || this.leaving) return;
    const at = LEVEL.skip.find(([x]) => x * T > k.x + 12);
    // nothing left to skip to: she is at the door (the last point), so N takes her through it
    if (!at) { if (k.x > 93 * T && k.y + k.h <= BALCONY + 2) this.enterDoor(); return; }
    this.skipTo(at);
  }
  // B: the skip point behind her (the same spots and the same safe beat as N); at the first one,
  // back to the opening
  skipBack() {
    const k = this.kid; if (!k || this.dead || this.leaving) return;
    const at = LEVEL.skip.slice().reverse().find(([x]) => x * T < k.x - 12);
    if (!at) { prevChapter(this); return; }
    this.skipTo(at);
  }
  skipTo(at) {
    const k = this.kid;
    k.x = Math.round(at[0] * T); k.h = 14; k.crouch = false; k.y = at[1] * T - 14; k.vx = 0; k.vy = 0; k.peakY = k.y; this.dyn.riding = null;
    const cr = this.crate.r, cd = this.cradle.r;
    if (at[2] === 'crate' && Math.abs(cr.y + cr.h - TERRACE) < 1 && cr.x > k.x) k.x = Math.round(cr.x) - k.w;
    if (at[2] === 'cradle') { k.x = Math.round(cd.x + (cd.w - k.w) / 2); k.y = Math.round(cd.y) - k.h; k.peakY = k.y; }
    // a beat to get her bearings: nothing locks on, nothing hurts her (she blinks), the scan holds
    this.safeT = SKIP_SAFE; k.inv = Math.max(k.inv, SKIP_SAFE);
    if (this.scan) this.scan.x = Math.min(this.scan.x, k.x - LEVEL.scan.behind * 1.6);
  }
  rescue() { this.skipAhead(); }
  drawGirl() {
    super.drawGirl();
    const k = this.kid; if (!k || !this.girl.visible) return;
    const f = this.dyn && this.dyn.riding ? { tex: 'girl_jump' } : girlFrame(k, this.clock);
    this.girl.setTexture(f.tex); if (f.flip != null) this.girl.setFlipX(f.flip);
  }

  // ------------------------------------------------------------------ the scan: a run to the door
  // On the balcony the satellite scans the house: a wall of light sweeps in from behind her. It
  // is slower than she runs, but not by much. If it reaches her, the strike comes.
  updateScan(dt) {
    const S = LEVEL.scan, k = this.kid;
    if (!this.scan) {
      if (!this.dead && !this.leaving && k.x > S.trigger && k.y < S.below) {
        this.scan = { x: k.x - S.behind * (this.safeT > 0 ? 1.6 : 1), t: 0 }; // farther back if N just put her here
        overlay.sfx('[ALARM]', 1600); Sound.tone(520, 0.5, 'sawtooth', 0.03, 1040);
        fx.flash(this.cameras.main, 120, 90, 20, 20);
      }
      return;
    }
    const sc = this.scan; sc.t += dt;
    if (!this.dead && !this.leaving && !(this.safeT > 0)) sc.x += S.speed * dt;
    if (Math.floor(sc.t * 2) !== Math.floor((sc.t - dt) * 2) && !this.leaving) Sound.tone(sc.t % 1 < 0.5 ? 880 : 660, 0.12, 'square', 0.012);
    if (!this.dead && !this.leaving && !window.__noDeath && k.x + k.w / 2 < sc.x + 3) { this.satX = sc.x; this.die({ id: 'scan', x: sc.x, y: 20 }); }
  }
  drawScan() {
    const g = this.scanG; g.clear();
    if (!this.scan) return;
    const v = this.cameras.main.worldView, x = Math.round(this.scan.x), t = this.clock, y0 = Math.floor(v.y), h = Math.ceil(v.height) + 1;
    // a hard band, the game's one light rule: a 50% checker of red behind a solid red edge and a
    // pale core line (no hatched rows, no moving ticks)
    hardCone(g, [{ x: x - 10, y: y0 }, { x: x - 2, y: y0 }, { x: x - 2, y: y0 + h }, { x: x - 10, y: y0 + h }], C('red'), null);
    g.fillStyle(C('red'), 1); g.fillRect(x - 2, y0, 2, h);
    g.fillStyle(C('redHi'), 1); g.fillRect(x, y0, 1, h);
    if (!this.dead) SatelliteStrike.drawSat(this.fxG, this.P, x, v.y + 3, null, 0);
  }

  // ------------------------------------------------------------------ ambience: the spectacle
  updateAmbience(dt) {
    const inside = this.kid.x > LEVEL.gateX + 10;
    if (inside !== this.wasInside) { this.wasInside = inside; this.beds.wind.set(inside ? 0.03 : 0.14, 1.5); this.beds.lounge.set(inside && !this.leaving ? 0.05 : 0.0001, 2); }
    const S = this.show; S.t += dt;
    if (S.t > SHOW[S.idx][1]) { S.t = 0; S.idx = (S.idx + 1) % SHOW.length; this.setFigure(SHOW[S.idx][0]); }
    S.drones.forEach(d => { d.x += (d.tx - d.x) * Math.min(1, dt * 2.2); d.y += (d.ty - d.y) * Math.min(1, dt * 2.2); });
    this.nextFirework -= dt;
    if (this.nextFirework <= 0) {
      this.nextFirework = 5 + Math.random() * 6;
      this.fireworks.push({ x: 120 + Math.random() * 360, y: 120, ty: 14 + Math.random() * 30, t: 0, phase: 'rise', parts: [] });
    }
    this.fireworks.forEach(f => {
      f.t += dt;
      if (f.phase === 'rise') { f.y -= 140 * dt; if (f.y <= f.ty) { f.phase = 'burst'; f.t = 0; const n = 20, col = ['goldHi', 'gold', 'bone'][Math.floor(Math.random() * 3)]; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, v = 24 + (i % 3) * 6; f.parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, col }); } if (this.kid.x > LEVEL.gateX) Sound.noise(0.25, 0.03, 900); } }
      else f.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.vx *= 0.985; });
    });
    this.fireworks = this.fireworks.filter(f => f.phase === 'rise' || f.t < 1.2);
    // a glint on gold now and then, within view: a hard plus for a moment
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = 0.16;
      const v = this.cameras.main.worldView, vis = this.marks.filter(m => m.kind === 'glint' && v.contains(m.x, m.y));
      if (vis.length) this.glints.push({ m: vis[Math.floor(Math.random() * vis.length)], t: 0 });
    }
    this.glints.forEach(gl => { gl.t += dt; }); this.glints = this.glints.filter(gl => gl.t < 0.24);
  }

  draw() {
    const P = this.P, t = this.clock, v = this.cameras.main.worldView;
    this.drawGirl();
    // searchlights over the dead city, behind everything: thin flat beams, one tone on the sky
    const sf = this.skyFx; sf.clear();
    [[80, 0.21, 0], [210, 0.17, 1.7], [350, 0.23, 3.1], [480, 0.19, 4.4]].forEach(([x, sp, ph]) => {
      const a = (-90 + Math.sin(t * sp * 2 + ph) * 26) * Math.PI / 180, len = 190, w = 4;
      const ex = x + Math.cos(a) * len, ey = 170 + Math.sin(a) * len, nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
      hardCone(sf, [{ x, y: 170 }, { x: ex + nx, y: ey + ny }, { x: ex - nx, y: ey - ny }], C('ash2'), null, 'solid');
    });
    // the drone show: one gold pixel a drone
    const sg = this.showG; sg.clear();
    const pal = [C('goldHi'), C('gold'), C('lit')];
    this.show.drones.forEach((d, i) => { if (Math.sin(t * 5 + i * 1.7) > -0.6) { sg.fillStyle(pal[d.hue], 1); sg.fillRect(Math.round(d.x), Math.round(d.y), 1, 1); } });
    const fg = this.fireworksG; fg.clear();
    this.fireworks.forEach(f => {
      if (f.phase === 'rise') { fg.fillStyle(C('bone'), 1); fg.fillRect(Math.round(f.x), Math.round(f.y), 1, 2); }
      else if (f.t < 1.0 || Math.floor(f.t * 20) % 2) f.parts.forEach(p => { fg.fillStyle(C(p.col), 1); fg.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); });
    });
    // fires in the dead city flicker between two warm tones
    const cf = this.cityFx; cf.clear();
    this.cityMarks.forEach((m, i) => { cf.fillStyle(Math.sin(t * 9 + i * 3.1) > 0 ? C('lit') : C('goldLo'), 1); cf.fillRect(m.x, m.y, 2, 2); if (Math.sin(t * 5 + i) > 0.5) cf.fillRect(m.x, m.y - 1, 1, 1); });
    // fairy lights blink; gold glints
    const tg = this.twinkleG; tg.clear();
    this.marks.forEach((m, i) => { if (m.kind === 'fairy' && v.contains(m.x, m.y) && Math.sin(t * 3 + i * 2.3) < -0.4) { tg.fillStyle(C('bronze'), 1); tg.fillRect(m.x, m.y, 1, 1); } });
    this.glints.forEach(({ m, t: gt }) => { tg.fillStyle(C('bone'), 1); tg.fillRect(m.x, m.y, 1, 1); if (gt > 0.06 && gt < 0.18) { tg.fillStyle(C('goldHi'), 1); tg.fillRect(m.x - 2, m.y, 5, 1); tg.fillRect(m.x, m.y - 2, 1, 5); tg.fillStyle(C('bone'), 1); tg.fillRect(m.x, m.y, 1, 1); } });
    // the koi: four gold fish on one loop, every one turning at the same moment
    const F = LEVEL.fountain, cx = (F.x0 + F.x1) / 2, fy = TERRACE - 3;
    const kg = this.floorKoi; kg.clear();
    for (let i = 0; i < 4; i++) { const a = t * 0.9 + i * Math.PI / 2, x = Math.round(cx + Math.cos(a) * 34), dir = -Math.sin(a) > 0 ? 1 : -1; kg.fillStyle(C('gold'), 1); kg.fillRect(x - 2, fy + (i & 1), 4, 1); kg.fillStyle(C('goldHi'), 1); kg.fillRect(dir > 0 ? x + 2 : x - 3, fy + (i & 1), 1, 1); }

    // what watches her: hard light, red as it locks on
    const g = this.coneG; g.clear();
    const lit = s => s.cone && hardCone(g, s.cone, s.lock > 0 ? C('red') : C('ash5'), v);
    this.lights.forEach(lit); this.drones.forEach(lit);
    this.drawLocks([...this.lights, ...this.drones]);
    const mg = this.markG; mg.clear(); this.tape.draw(mg); this.gold.draw(mg);
    this.dyn.draw();
    this.drawScan();
    this.drawThings();
  }

  // the hint line: what a friend standing next to you would say
  hint() {
    if (this.leaving || this.done) return;
    const k = this.kid, x = k.x / T;
    if (this.atDoor()) return overlay.hint('Press W to go in.');
    if (this.scan) return overlay.hint(x > 90 ? 'The door is right there. Keep going!' : 'Run! If the scan catches you, the strike comes.');
    if (x < 15) return overlay.hint('A and D to walk, Space to jump. J to look at things.');
    if (x < 34) return overlay.hint('Stay in the hedges’ shadow. Tap Space twice to jump higher.');
    if (x < 38) return overlay.hint('Jump back and forth between the walls to climb up.');
    if (x < 56) return overlay.hint('The drone only looks straight down. Get under the bowl, or crouch under the table.');
    if (x < 64 && k.y > 200) return overlay.hint('Push the crate and stay in its shadow. Then climb it.');
    if (x < 74) return overlay.hint('Ride the cradle up. Its roof hides you from the drone.');
    return overlay.hint('The foam slabs drop a second after you land. Keep moving.');
  }
}
