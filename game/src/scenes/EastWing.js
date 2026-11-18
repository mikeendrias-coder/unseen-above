// Episode 3: the east wing, seen from above. She lands in the dark with cracked glasses that
// show what watches her only now and then. A heap of pebbles where a wall came down (she carries
// five at most), motion sensors in a corridor (a radio by them plays the satellite's notes as she
// nears one), the house's lasers across the portrait gallery (they blink before they fire), a
// patrol robot in the library that goes to look at noises (a pebble down the dumbwaiter sends it
// to the far end), a camera in the study, and a ballroom where a chandelier full of eyes has to
// be brought down before the door will open. Rebuilt Nov 18 after Michael's playtest.
import { Music } from '../core/music.js';
import { hexNum, flat, Painter } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { LOOKS, ASH } from '../art/palettes.js';
import { T, W, H, LEVEL, buildMap, paintMap, isSolid, isOpaque, isWall, isNoisy, roomAt, nightCanvas } from '../art/eastwing.js';
import { Glasses } from '../core/glasses.js';
import { TopDownEpisode, makeTopSprites, LOCK_TD, pxCircle, darkFill, hardHoles, lightsKey, cpuCanvas, MAX_PEBBLES } from '../core/topdown.js';
import { Marks, Gold } from '../core/props.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { goNext } from '../core/flow.js';
import { showStatus } from '../core/death.js';
import { NOTICE } from '../data/dialogue.js';
import { fx } from '../core/fx.js';
import { cg as CG } from '../ui/cg.js';

// one line each, by room
const HINTS = {
  landing: 'J at the heap fills her pockets, five at most. K throws.',
  stair: '',
  nursery: '',
  corridor: 'Sensors see movement and hear noise. Stop when they pulse.',
  alcove: '',
  conservatory: 'Glass is loud. The robot in the library hears it.',
  billiard: '',
  gallery: 'The lasers blink, then fire. Cross while they are dark.',
  hatch: 'A pebble down the dumbwaiter lands in the library.',
  library: 'The robot goes to any noise. Shelves block its view.',
  study: 'The camera sweeps the study. The armchairs hide her.',
  ballroom: 'Hold J at a chained pillar. Stay behind the pillar.'
};
// the satellite screen's note ladder (pentatonic, two octaves), so the radio sounds like it
const LADDER = [0, 2, 4, 7, 9];
const ladderHz = i => 440 * Math.pow(2, (LADDER[i % 5] + 12 * Math.min(2, Math.floor(i / 5))) / 12);
// a pixel line (no smooth vector lines in the picture)
function pxLine(g, x0, y0, x1, y1, color) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); g.fillStyle(color, 1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (let n = 0; n < 400; n++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
// The house's lasers: where each beam is in its cycle at time t (dark, tell, on)
export function laserPhase(L, row, t) {
  const off = L.period - L.tell - L.on, u = (((t - row.phase) % L.period) + L.period) % L.period;
  return u < off ? 'off' : u < off + L.tell ? 'tell' : 'on';
}
// a sensor that hears her tells this long, then pulses this long out of turn
const SENSOR_TELL = 0.35, SENSOR_BURST = 0.45;
let NIGHT_CV = null; // the night picture of the wing, made once (the map paints the same every time)
let NIGHT_CPU = null; // its copy on a CPU canvas, for the dark layer (drawDark)

export class EastWing extends TopDownEpisode {
  constructor() { super('eastwing'); }

  create(data) {
    data = data || {};
    const m = this.m = buildMap();
    this.doorOpen = false;
    this.initTop('ep3', {
      W, H, start: LEVEL.start,
      solid: (x, y) => { const c = m[y][x]; if (c === 'D') return !this.doorOpen; if (this.robot && Math.round(this.robot.x) === x && Math.round(this.robot.y) === y) return true; return isSolid(c); },
      opaque: (x, y) => { const c = m[y][x]; return c === 'D' ? !this.doorOpen : isOpaque(c); },
      noisy: (x, y) => isNoisy(m[y][x])
    });
    const P = this.P;
    makeSprites(this, P); makeTopSprites(this, P); this.makeProps(P);
    const art = paintMap(P, m); art.toTexture(this, 'ew_map');
    if (!NIGHT_CV) NIGHT_CV = nightCanvas(art.canvas);
    this.add.image(0, 0, 'ew_map').setOrigin(0).setDepth(0);
    this.setupView(P.void);
    this.floorG = this.add.graphics().setDepth(1);
    this.robotImg = this.add.image(0, 0, 'td_robot').setDepth(3);
    this.chG = this.add.graphics().setDepth(6);
    this.hud = this.hudLayer(20);
    // the things in the wing
    this.sensors = LEVEL.sensors.map(s => Object.assign({}, s, { cool: 0, flash: 0, alarm: 0, burst: 0, top: !isWall(m[s.y - 1][s.x]) }));
    this.lasers = LEVEL.lasers.rows.map(r => Object.assign({}, r, { st: 'off' }));
    this.laserSrc = { id: 'laser', direct: true };
    const R = LEVEL.robot;
    this.robot = { x: R.path[0][0], y: R.path[0][1], wp: 1, route: [], mode: 'patrol', face: 90, wait: 0, look: 0 };
    this.camSrc = { id: 'study camera', lock: 0, tiles: null, x: LEVEL.camera.x * T, y: LEVEL.camera.y * T };
    this.robotSrc = { id: 'patrol robot', lock: 0, tiles: null };
    this.chSrc = { id: 'chandelier', lock: 0, tiles: null };
    this.sensorSrc = { id: 'motion sensor', lock: 0, direct: false };
    this.sources = [this.camSrc, this.robotSrc, this.chSrc];
    const C = LEVEL.chandelier;
    this.ch = { cut: 0, angle: 0, focus: null, focusT: 0, phase: 'up', t: 0, shake: 0, hold: 0, holdAt: null };
    this.gl = new Glasses({ has: true, on: true, cracked: true });
    // the heap: J tops her pockets up to five, as often as she likes
    this.pileThing = { tx: LEVEL.pile.tx, ty: LEVEL.pile.ty, reach: 2, label: 'J', use: () => this.takePile() };
    this.things.push(this.pileThing);
    C.chains.forEach(([px, py], i) => this.things.push({ tx: px, ty: py, reach: 2, hold: true, chain: i, label: 'J' }));
    // the dumbwaiter: J drops a pebble in
    const DW = LEVEL.dumbwaiter;
    this.dumbThing = { tx: DW.hatch[0], ty: DW.hatch[1], label: 'J', use: () => this.dropPebble() };
    this.things.push(this.dumbThing); this.rattle = null; this.pocket = null; this.dust = null; this.fxBurst = null;
    // things to look at: old bodies that were here before her, the library's shelves, the study's
    // desk and fire, the calendar, the radio, a bust, the piano, where the dumbwaiter comes out
    const N = NOTICE.eastwing;
    m.forEach((row, ty) => row.forEach((ch, tx) => { if (ch === 'b') this.addLook({ tx, ty, lines: N.body, clue: 'oldBody' }); }));
    this.addLook({ tx: 17, ty: 7, lines: N.books });
    this.addLook({ tx: 35, ty: 5, lines: N.desk, clue: 'routeMap' });
    this.addLook({ tx: 32, ty: 3, lines: N.fire });
    this.addLook({ tx: 7, ty: 25, lines: N.calendar });
    this.addLook({ tx: 3, ty: 10, lines: N.cot });
    this.addLook({ tx: 10, ty: 13, lines: N.horse });
    this.addLook({ tx: 21, ty: 22, lines: N.fountain });
    this.addLook({ tx: 40, ty: 23, lines: N.billiards });
    this.addLook({ tx: LEVEL.radio[0], ty: LEVEL.radio[1], lines: N.radio });
    this.addLook({ tx: 31, ty: 23, lines: N.bust });
    this.addLook({ tx: 45, ty: 16, lines: N.piano });
    this.addLook({ tx: DW.out[0], ty: DW.out[1] - 1, lines: N.hatch });
    this.radio = { step: 0, near: false };
    this.cutChains = new Set();
    this.lights = [];
    this.input.on('pointerdown', ptr => { if (this.dead || this.done) return; const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y); this.throwTo(Math.floor(wp.x / T), Math.floor(wp.y / T)); });
    // the show's tape marks (checkpoints): a retry from one keeps her pebbles
    this.tape = new Marks(this, LEVEL.marks.map(([tx, ty]) => ({ tx, ty })), { top: true, carry: () => ({ pebbles: this.pebbles }) });
    this.gold = new Gold(this, LEVEL.gold.map(([tx, ty]) => ({ tx, ty })).filter(q => !isSolid(m[q.ty][q.tx])), { top: true });
    this.drawBodies();
    this.spawn();
    const from = this.tape.from;
    if (from) this.pebbles = Math.min(MAX_PEBBLES, from.pebbles || 0);
    this.cameras.main.fadeIn(data.fromFall ? 1400 : 400);
    this.glitchT = data.fromFall ? 0 : 3;
    this.beds = { hum: Sound.hum(0.012), wind: Sound.wind(0.03) };
    Music.play('eastwing', { fadeIn: 3 });
    this.events.once('shutdown', () => { Object.values(this.beds).forEach(b => b.stop(0.4)); CG.hp(null); });
    // HP: the robot's shell is the one thing in the wing that only hurts (the house hurts her,
    // what watches her and the house's lasers take a life)
    this.hp = 3; this.inv = 0; this.sparks = null; this.showHp();
    // back from the workshop: the room clears HP and lives as it shuts down, after this wakes
    this.onWake = () => { this.showHp(); this.time.delayedCall(60, () => this.showHp()); };
    this.takeNote({ fromCut: data.fromCut && !data.fromFall }, 3, 'The East Wing');
    if (data.fromFall && !state.heard('ew:crack')) this.time.delayedCall(900, () => overlay.sfx('[GLASS CRACKS]', 1700, 'ew:crack'));
    this.time.delayedCall(data.fromFall ? 1900 : 600, () => this.itemPanel('cracked'));
    window.__game = { scene: this, state };
  }

  makeProps(P) {
    const add = (key, w, h, draw) => { const p = new Painter(w, h); draw(p); p.toTexture(this, key); };
    // the robot from above: a dark rim (its outline), a bone shell, a lens
    add('td_robot', 12, 12, p => { p.circle(6, 6, 6, P.crack); p.circle(6, 6, 5, P.device); p.circle(6, 5, 4, P.robot); p.rect(4, 3, 3, 2, P.colHi); p.rect(5, 9, 3, 2, P.device); });
  }

  // ------------------------------------------------------------------ the loop
  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    this.reviewKeys();
    if (this.dead) { if (c.advance() || c.restart()) this.skipDeath(); } // K only throws
    if (c.restart() && this.restartTake()) { c.endFrame(); return; }
    if (this.done) { c.endFrame(); return; }
    if (!this.dead && !this.leaving) {
      this.moveKid(dt);
      if (c.throwP()) this.throwAhead();
      if (c.glasses()) this.gl.toggle();
      this.updateThings(); this.tape.update(dt);
      this.holdChain(dt);
    }
    this.gl.update(dt); this.gold.update(dt);
    this.updateFlight(dt);
    this.updateSensors(dt);
    this.updateLasers(dt);
    this.updateRattle(dt);
    this.updateCamera(dt);
    this.updateRobot(dt);
    this.updateChandelier(dt);
    this.follow();
    this.draw(dt);
    this.hint();
    c.endFrame();
  }

  // how far along the wing she is: 0 landing, 1 corridor, 2 the lasers, 3 the gallery's top,
  // 4 library, 5 study, 6 ballroom
  stage(o) {
    const r = roomAt(o.x, o.y), id = r ? r.id : '';
    if (id === 'ballroom' || (o.x >= 38 && o.y <= 17)) return 6;
    if (id === 'study') return 5;
    if (id === 'library' || (o.x === 30 && o.y >= 13 && o.y <= 14)) return 4;
    if (id === 'conservatory') return 3;
    if (id === 'gallery') return o.y <= 16 ? 3 : 2;
    if (id === 'billiard') return 2;
    if (id === 'corridor' || id === 'alcove') return o.x >= 31 ? 2 : 1;
    return 0;
  }
  // review: N moves her through the wing room by room; in the ballroom it brings the chandelier down
  skipAhead() {
    const o = this.tileOf(), st = this.stage(o);
    if (st === 6) {
      if (!this.doorOpen && this.ch.phase === 'up') LEVEL.chandelier.chains.forEach((c, i) => { if (!this.cutChains.has(i)) { this.cutChain(i); const th = this.things.find(q => q.chain === i); if (th) th.off = true; } });
      else if (this.doorOpen) {
        // the door is open: N brings her under it, and the next N takes her through
        if (o.x === LEVEL.exit[0] && o.y === LEVEL.exit[1] + 1) this.leave(); else this.placeTile(LEVEL.exit[0], LEVEL.exit[1] + 1);
      }
      return;
    }
    const next = [[13, 31], [33, 28], [33, 14], [31, 6], [31, 6], [39, 8]][st];
    if (next[0] === o.x && next[1] === o.y) { const after = [[33, 28], [33, 14], [31, 6], [39, 8], [39, 8], [41, 8]][st]; this.placeTile(after[0], after[1]); }
    else this.placeTile(next[0], next[1]);
  }
  onArrive(x, y) {
    if (this.doorOpen && x === LEVEL.exit[0] && y === LEVEL.exit[1]) this.leave();
  }
  // walking into something: the robot shocks her; W into the workshop door goes through it
  onBump(x, y) {
    const R = this.robot;
    if (Math.round(R.x) === x && Math.round(R.y) === y) { this.bumpRobot(); return; }
    if (x === LEVEL.workshop[0] && y === LEVEL.workshop[1] && this.kid.face === 'up') this.enterRoom('workshop');
  }
  // she makes a noise, or a pebble does
  onNoise(x, y, r, kind) {
    // the robot comes to look; a clatter out of the dumbwaiter it always goes to, and stays longer
    const R = this.robot, L = LEVEL.robot;
    if ((kind === 'dumbwaiter' || Math.hypot(R.x - x, R.y - y) <= Math.max(L.hear, r + 3)) && R.mode !== 'off') {
      R.mode = 'investigate'; R.target = [x, y]; R.route = this.path([Math.round(R.x), Math.round(R.y)], [x, y]); R.wait = 0; R.stay = kind === 'dumbwaiter' ? 5 : 2.4;
      this.bubbles.say('robot', '?', () => ({ x: R.x * T + 8, y: R.y * T + 2 }), { ink: 0xf5ce77, pitch: 900, ms: 900 });
    }
    // a sensor in range of a noise answers it. Her own noise (running, debris underfoot) makes it
    // tell (a fast blink, two high ticks, its reach lit red) and then pulse out of turn: if she is
    // still moving then, it has her. Stopping dead on the tell saves her. (It used to put the
    // sensor to sleep, so running past one made it safe; then, for a while, it killed her on the
    // spot with no warning.) A pebble trips it and it needs time to recharge; if it saw the
    // pebble, the satellite shoots the pebble.
    const mine = kind === 'run' || kind === 'debris';
    let seen = false;
    this.sensors.forEach(s => {
      if (s.cool > 0 || Math.hypot(s.x - x, s.y - y) > s.r + (mine ? 0 : 0.5)) return;
      if (mine) {
        if (this.dead || s.alarm > 0 || s.burst > 0) return;
        s.alarm = SENSOR_TELL; Sound.tone(2100, 0.04, 'square', 0.02); this.time.delayedCall(110, () => Sound.tone(2600, 0.04, 'square', 0.02));
      } else { s.flash = 0.5; Sound.tone(1900, 0.08, 'square', 0.02); s.cool = 3.2; s.alarm = 0; s.burst = 0; seen = true; }
    });
    if (kind === 'pebble') {
      const i = y * W + x;
      if ((this.camSrc.tiles && this.camSrc.tiles.has(i)) || (this.chSrc.tiles && this.chSrc.tiles.has(i))) seen = true;
      const fp = this.floorPebbles.find(q => q.x === x && q.y === y);
      if (seen && fp) this.time.delayedCall(260, () => { if (Sound.charge) Sound.charge(); this.strikeAt(fp); });
    }
    // the chandelier's eyes turn toward a noise in the ballroom
    const rm = roomAt(x, y);
    if (rm && rm.id === 'ballroom' && this.ch.phase === 'up') { this.ch.focus = Math.atan2(y + 0.5 - LEVEL.chandelier.y, x + 0.5 - LEVEL.chandelier.x) * 180 / Math.PI; this.ch.focusT = 1.4; }
  }

  // pockets full: the same line at the heap and at a pebble on the floor
  pocketsFull(tx, ty) { this.bubbles.look('item', this.fullSrc || (this.fullSrc = { lines: NOTICE.eastwing.full }), () => ({ x: tx * T + 8, y: ty * T - 4 })); }
  // the heap: J tops her up to five
  takePile() {
    const want = MAX_PEBBLES - this.pebbles;
    if (want <= 0) { this.pocketsFull(this.pileThing.tx, this.pileThing.ty); Sound.tone(220, 0.06, 'triangle', 0.015); return; }
    this.pebbles = MAX_PEBBLES;
    for (let i = 0; i < Math.min(3, want); i++) this.time.delayedCall(i * 70, () => Sound.tone(500 + i * 120, 0.06, 'triangle', 0.02));
    // the stones jump off the heap into her pocket
    const k = this.kidPx(), cx = LEVEL.pile.tx * T, cy = LEVEL.pile.ty * T;
    this.pocket = Array.from({ length: want }, (_, i) => ({ x: cx - 6 + (i * 7) % 14, y: cy - 4 + (i * 5) % 9, t: -i * 0.05 }));
    this.itemPanel('pebbles');
  }

  // ------------------------------------------------------------------ the dumbwaiter
  dropPebble() {
    if (this.rattle) return;
    if (this.pebbles <= 0) { this.bubbles.look('item', this.dumbEmpty || (this.dumbEmpty = { lines: NOTICE.eastwing.dumbwaiter }), () => ({ x: this.dumbThing.tx * T + 8, y: this.dumbThing.ty * T })); return; }
    this.pebbles--; this.rattle = { t: 0, n: 0 };
    Sound.tone(700, 0.04, 'square', 0.015);
    if (state.hear('ew:rattle')) overlay.sfx('[A PEBBLE RATTLES DOWN THE WALL]', 1800);
  }
  updateRattle(dt) {
    const r = this.rattle; if (!r) return;
    r.t += dt;
    // it knocks its way along inside the wall, fainter as it goes
    if (r.t > 0.12 * (r.n + 1) && r.n < 8) { r.n++; Sound.tone(1200 - r.n * 90, 0.03, 'square', 0.012 * (1 - r.n / 10)); }
    if (r.t >= 1.3) {
      const [x, y] = LEVEL.dumbwaiter.out;
      this.rattle = null;
      Sound.noise(0.12, 0.05, 3500);
      this.noise(x, y, 4, 'dumbwaiter');
      // the pebble lands on the library floor, where she can pick it up later
      const fp = { x, y, dx: 2, dy: -2 }; fp.thing = { tx: x, ty: y, reach: 1, label: 'J', use: () => this.pickPebble(fp) };
      this.floorPebbles.push(fp); this.things.push(fp.thing);
    }
  }

  // ------------------------------------------------------------------ sensors, the radio, lasers, camera, robot
  sensorOn(s) { return s.burst > 0 || (s.cool <= 0 && ((this.clock + s.phase * s.period) % s.period) < s.window); }
  updateSensors(dt) {
    const o = this.tileOf(), [rx, ry] = LEVEL.radio;
    let nearAny = false;
    this.sensors.forEach(s => {
      s.cool = Math.max(0, s.cool - dt); s.flash = Math.max(0, s.flash - dt);
      s.burst = Math.max(0, s.burst - dt);
      if (s.alarm > 0) { s.alarm -= dt; if (s.alarm <= 0) { s.alarm = 0; s.burst = SENSOR_BURST; s.flash = 0.5; Sound.tone(1900, 0.08, 'square', 0.02); } }
      const on = this.sensorOn(s), d = Math.hypot(o.x - s.x, o.y - s.y);
      if (d <= s.r + 2.5) nearAny = true;
      if (on && !s.was) {
        // the pulse is heard louder as she nears its range, and lower once she is inside it
        const near = Math.max(0, Math.min(1, 1 - (d - s.r) / 4));
        Sound.tone(d <= s.r ? 820 : 1300, 0.05, 'sine', 0.008 + 0.03 * near);
        // the radio picks the sensors up: near one, every pulse is the next note of the ladder
        if (d <= s.r + 2.5 && !this.dead) { const rd = Math.hypot(o.x - rx, o.y - ry); Sound.tone(ladderHz(this.radio.step), 0.09, 'square', 0.006 + 0.012 * Math.max(0, 1 - rd / 16)); this.radio.step++; this.radio.lit = 0.25; }
      }
      s.was = on;
      if (on && !this.dead && !this.shielded() && this.kid.moving && d <= s.r) { this.sensorSrc.x = s.x * T + 8; this.die(this.sensorSrc); }
    });
    if (!nearAny) this.radio.step = 0;
    this.radio.lit = Math.max(0, (this.radio.lit || 0) - dt);
  }
  // The gallery's lasers. Every beam that touches her takes a life, through the same death as
  // everything else (die, direct: the house's own laser, no strike from orbit). Each one tells
  // first: both ports blink and a dotted line marks the row, with two ticks, then it fires.
  updateLasers(dt) {
    const L = LEVEL.lasers, k = this.kidPx(), t = window.__ewLaserT != null ? window.__ewLaserT : this.clock;
    const x0 = L.x0 * T, x1 = (L.x1 + 1) * T;
    this.lasers.forEach(b => {
      const st = laserPhase(L, b, t), by = b.y * T + 8, near = Math.abs(k.y - by) < 10 * T && k.x > (L.x0 - 6) * T && k.x < (L.x1 + 6) * T;
      if (st !== b.st && near && !this.dead) {
        if (st === 'tell') { Sound.tone(1320, 0.05, 'square', 0.012); this.time.delayedCall(140, () => Sound.tone(1760, 0.05, 'square', 0.012)); }
        if (st === 'on') { Sound.tone(1500, 0.3, 'sawtooth', 0.022, 1200); Sound.noise(0.2, 0.035, 7000); }
      }
      b.st = st;
      if (st === 'on' && !this.dead && !this.leaving && !this.shielded() && k.x >= x0 && k.x <= x1 && Math.abs(k.y - by) <= 6) {
        this.laserSrc.x = x1 - 2; this.laserSrc.y = by; this.die(this.laserSrc);
      }
    });
  }
  updateCamera(dt) {
    const C = LEVEL.camera, a = C.base + C.sweep * Math.sin(this.clock * Math.PI * 2 / C.period);
    this.camAngle = a;
    this.camSrc.tiles = this.coneTiles(C.x, C.y, a, C.half, C.range);
    this.watchTiles(this.camSrc, dt);
  }
  // breadth-first path over the tile grid (4 directions), avoiding solids
  path(from, to) {
    const key = (x, y) => y * W + x, prev = new Map(), q = [from], seen = new Set([key(...from)]);
    while (q.length) {
      const [x, y] = q.shift(); if (x === to[0] && y === to[1]) break;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(key(nx, ny))) return; const c = this.m[ny][nx]; if (isSolid(c)) return; seen.add(key(nx, ny)); prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); });
    }
    const out = []; let cur = to; if (!prev.has(key(...to))) return out;
    while (cur && !(cur[0] === from[0] && cur[1] === from[1])) { out.unshift(cur); cur = prev.get(key(...cur)); }
    return out;
  }
  showHp() { if (this.kid) this.kid.hp = this.hp; showStatus(this, this.hp, 3); }
  // she walks into the robot, or it rolls into her: a shock off its shell, a heart, and she is
  // thrown back a tile. It does not see her for it (its lens looks past her feet).
  bumpRobot() {
    if (this.dead || this.leaving || this.inv > 0 || this.shielded()) return;
    const R = this.robot, k = this.kid;
    this.hp = Math.max(0, this.hp - 1); this.inv = 1; this.showHp();
    Sound.tone(220, 0.12, 'square', 0.04, 110); Sound.noise(0.12, 0.08, 1800); fx.shake(this.cameras.main, 120, 0.006);
    this.sparks = { x: Math.round((R.x * T + 8 + k.tx * T + 8) / 2), y: Math.round((R.y * T + 8 + k.ty * T + 8) / 2), t: 0 };
    const dx = Math.sign(k.tx - Math.round(R.x)), dy = dx ? 0 : Math.sign(k.ty - Math.round(R.y));
    if ((dx || dy) && !k.moving && !this.blocked(k.tx + dx, k.ty + dy)) { k.fx = k.tx; k.fy = k.ty; k.tx += dx; k.ty += dy; k.p = 0; k.moving = true; }
    if (this.hp <= 0) this.die(this.robotSrc);
    else if (state.hear('ew:bump')) overlay.sfx('[A SHOCK OFF THE ROBOT]', 1500);
  }
  updateRobot(dt) {
    const R = this.robot, L = LEVEL.robot;
    this.inv = Math.max(0, this.inv - dt);
    if (!R.route.length && R.mode === 'patrol') { const w = L.path[R.wp]; R.route = this.path([Math.round(R.x), Math.round(R.y)], w); R.wp = (R.wp + 1) % L.path.length; }
    if (R.route.length) {
      const [nx, ny] = R.route[0], k = this.kid;
      const kidOn = (k.tx === nx && k.ty === ny) || (k.moving && k.fx === nx && k.fy === ny);
      // it waits for her a moment, then rolls on into her
      R.blockT = kidOn ? (R.blockT || 0) + dt : 0;
      if (R.blockT > 0.6) { R.blockT = 0; this.bumpRobot(); }
      if (!kidOn) {
        const dx = nx - R.x, dy = ny - R.y, d = Math.hypot(dx, dy), step = L.speed * dt;
        if (d > 0.01) R.face = Math.atan2(dy, dx) * 180 / Math.PI;
        if (d <= step) { R.x = nx; R.y = ny; R.route.shift(); } else { R.x += dx / d * step; R.y += dy / d * step; }
      }
    } else if (R.mode === 'investigate') {
      // look around where the noise was, then go back to the loop
      R.wait += dt; R.face += 160 * dt;
      if (R.wait > (R.stay || 2.4)) { R.mode = 'patrol'; R.wp = 0; }
    }
    // its lens is up high: the tiles right around it are under its view (it bumps, not sees)
    const near = this.coneTiles(R.x + 0.5, R.y + 0.5, R.face, L.half, L.range);
    near.forEach(i => { const tx = i % W, ty = Math.floor(i / W); if (Math.hypot(tx - R.x, ty - R.y) < 1.2) near.delete(i); });
    this.robotSrc.tiles = near;
    this.watchTiles(this.robotSrc, dt, 0.42);
  }

  // ------------------------------------------------------------------ the chandelier
  holdChain(dt) {
    const t = this.nearThing;
    if (t && t.hold && !this.cutChains.has(t.chain) && this.ch.phase === 'up' && this.ctl.useHeld()) {
      if (this.ch.holdAt !== t.chain) { this.ch.holdAt = t.chain; this.ch.hold = 0; }
      this.ch.hold += dt;
      if (Math.floor(this.ch.hold * 10) !== Math.floor((this.ch.hold - dt) * 10)) Sound.tone(300 + this.ch.hold * 400, 0.03, 'square', 0.01);
      if (this.ch.hold >= 1) { this.cutChain(t.chain); t.off = true; this.ch.hold = 0; this.ch.holdAt = null; }
    } else { this.ch.hold = Math.max(0, this.ch.hold - dt * 2); if (this.ch.hold === 0) this.ch.holdAt = null; }
  }
  cutChain(i) {
    this.cutChains.add(i); this.ch.cut++; this.ch.shake = 0.8;
    Sound.tone(900, 0.2, 'sawtooth', 0.03, 200); Sound.noise(0.4, 0.1, 3000); fx.shake(this.cameras.main, 260, 0.008);
    this.noise(LEVEL.chandelier.chains[i][0], LEVEL.chandelier.chains[i][1], 5, 'chain');
    if (this.ch.cut >= 3) { this.ch.phase = 'falling'; this.ch.t = 0; Sound.tone(120, 1.2, 'sawtooth', 0.04, 60); }
  }
  updateChandelier(dt) {
    const C = LEVEL.chandelier, ch = this.ch;
    ch.shake = Math.max(0, ch.shake - dt);
    if (ch.phase === 'up') {
      const speed = C.speeds[ch.cut], eyes = C.eyes[ch.cut];
      if (ch.focusT > 0) { ch.focusT -= dt; const d = ((ch.focus - ch.angle) % 360 + 540) % 360 - 180; ch.angle += d * Math.min(1, dt * 6); }
      else ch.angle += speed * dt;
      const tiles = new Set();
      for (let e = 0; e < eyes; e++) this.coneTiles(C.x, C.y, ch.angle + e * 360 / eyes, C.half, C.range).forEach(v => tiles.add(v));
      this.chSrc.tiles = tiles; this.chSrc.x = C.x * T; this.chSrc.y = C.y * T;
      this.watchTiles(this.chSrc, dt, 0.45);
    } else if (ch.phase === 'falling') {
      ch.t += dt; this.chSrc.tiles = null; this.chSrc.lock = 0;
      if (ch.t >= 1.1 && !ch.crashed) {
        ch.crashed = true; ch.phase = 'down';
        fx.shake(this.cameras.main, 500, 0.02); Sound.noise(1.0, 0.25, 2000); Sound.tone(60, 0.8, 'sawtooth', 0.05, 30);
        this.noise(Math.floor(C.x), Math.floor(C.y), 9, 'crash');
        this.dust = { t: 0, bits: Array.from({ length: 22 }, (_, i) => ({ a: i / 22 * Math.PI * 2 + Math.random() * 0.3, v: 30 + Math.random() * 40 })) };
        this.doorOpen = true; this.time.delayedCall(600, () => { Sound.chime(); overlay.sfx('[A DOOR UNLOCKS]', 2200); });
        const k = this.kidPx(); if (!this.shielded() && Math.hypot(k.x - C.x * T, k.y - C.y * T) < 26) this.die({ id: 'chandelier', direct: true });
      }
    }
  }

  // ------------------------------------------------------------------ leaving
  leave() {
    if (this.leaving) return;
    this.leaving = true; state.finish(this.epId);
    Sound.chime(); this.cameras.main.fadeOut(900, 0, 0, 0);
    this.time.delayedCall(1000, () => { this.done = true; overlay.card('END OF EPISODE 3', 'Take ' + this.ep.take, 3400); overlay.bug('CH 07', 1400); overlay.hint(''); });
    this.time.delayedCall(4700, () => { if (!goNext(this, 'ep3b')) { overlay.card('TO BE CONTINUED', 'Episode 4 is next', 4000); overlay.hint('That is the end of this build. Backspace plays episode 3 again.'); } });
  }

  // ------------------------------------------------------------------ drawing
  draw(dt) {
    const P = this.P, t = this.clock, C = LEVEL.chandelier, ch = this.ch, red = hexNum(P.hazard), led = hexNum(P.led);
    const ash0 = hexNum(P.crack), bone = 0xebe6d8, gold = hexNum(P.gold), goldHi = hexNum(P.goldHi), goldLo = hexNum(P.goldLo), lamp = hexNum(P.lamp);
    this.drawGirl();
    this.robotImg.setPosition(Math.round(this.robot.x * T + 8), Math.round(this.robot.y * T + 8));
    // lights in the wing: the hole she fell through, windows, sconces, the fire, the chandelier's
    // candles, the robot's lamp, a laser while it burns, the open door
    this.lights = LEVEL.lights.slice();
    if (ch.phase !== 'down') this.lights.push({ x: C.x * T, y: C.y * T, r: 88 - ch.cut * 6, a: 0.8 });
    this.lights.push({ x: this.robot.x * T + 8, y: this.robot.y * T + 8, r: 20, a: 0.8 });
    const LZ = LEVEL.lasers;
    this.lasers.forEach(b => { if (b.st === 'on') this.lights.push({ x: (LZ.x0 + LZ.x1 + 1) * T / 2, y: b.y * T + 8, r: 26, a: 0.8 }); });
    if (this.doorOpen) this.lights.push({ x: LEVEL.exit[0] * T + 8, y: (LEVEL.exit[1] + 1) * T, r: 24, a: 0.8 });
    this.drawDark();
    // what the cracked glasses still show. Only the glasses show what watches her; off, or in a
    // dropout, none of this is drawn: she has the LEDs, the sounds, and the lock box.
    const g = this.overG; g.clear();
    const seeing = this.gl.showing;
    const glassesOn = seeing && ((Math.sin(t * 2.3) + Math.sin(t * 5.7 + 1) * 0.6 + Math.sin(t * 13.1) * 0.3) > -0.35 || this.glitchT < 2.5);
    // a watched tile is a grid of red dots; locking on, the dots close up
    const tileDots = (tiles, col, gap) => tiles && tiles.forEach(i => { const x = (i % W) * T, y = Math.floor(i / W) * T; g.fillStyle(col, 1); for (let yy = 2; yy < 16; yy += gap) for (let xx = 2 + ((yy / gap) % 2 ? gap / 2 : 0); xx < 16; xx += gap) g.fillRect(x + xx, y + yy, 1, 1); });
    if (seeing) [this.camSrc, this.robotSrc, this.chSrc].forEach(s => {
      if (!s.tiles) return;
      if (s.lock > 0) tileDots(s.tiles, red, 2);
      else if (glassesOn) tileDots(s.tiles, red, 4);
    });
    // sensors: a pulse is a real light, a hard red ring on the floor at the edge of its reach,
    // glasses or not; a tell (it heard her) blinks that ring. Between pulses only the glasses show
    // the reach, dotted.
    this.sensors.forEach(s => {
      const x = s.x * T + 8, y = s.y * T + 8, on = this.sensorOn(s), tell = s.alarm > 0 && Math.floor(t * 16) % 2 === 0;
      if (on || tell) pxCircle(g, x, y, s.r * T, red, on ? 0 : 2);
      else if (glassesOn) pxCircle(g, x, y, s.r * T, s.cool > 0 ? hexNum(P.wallLine) : hexNum(P.rubble), 3);
      if (s.flash > 0) pxCircle(g, x, y, Math.round(((1 - s.flash * 2) * s.r * T + 4) / 3) * 3, bone, 2);
    });
    this.drawNoise(g, dt);
    // the chandelier from above: a gold ring, crystal arms, candles, eyes, chains to the pillars
    const cg = this.chG; cg.clear();
    const cx = Math.round(C.x * T + (ch.shake > 0 ? Math.round((Math.random() - 0.5) * 4 * ch.shake) : 0)), cy = Math.round(C.y * T), fall = ch.phase === 'falling' ? Math.min(1, ch.t / 1.1) : 0;
    if (ch.phase !== 'down') {
      const rr = Math.round(22 * (1 + fall * fall * 0.5));
      C.chains.forEach(([px, py], i) => { const ax = px * T + 8, ay = py * T + 8; if (this.cutChains.has(i)) pxLine(cg, ax, ay, ax + (cx - ax) * 0.2, ay + (cy - ay) * 0.2, goldLo); else pxLine(cg, ax, ay, cx, cy, gold); });
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.floor(t * 2) * 0.1; pxLine(cg, cx, cy, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, hexNum(P.goldLo)); cg.fillStyle(lamp, 1); cg.fillRect(Math.round(cx + Math.cos(a) * rr) - 1, Math.round(cy + Math.sin(a) * rr) - 1, 2, 2); }
      pxCircle(cg, cx, cy, rr + 1, ash0, 0); pxCircle(cg, cx, cy, rr, gold, 0); pxCircle(cg, cx, cy, rr - 1, goldHi, 0);
      cg.fillStyle(ash0, 1); cg.fillRect(cx - 5, cy - 5, 11, 11); cg.fillStyle(gold, 1); cg.fillRect(cx - 4, cy - 4, 9, 9); cg.fillStyle(goldHi, 1); cg.fillRect(cx - 3, cy - 3, 3, 3);
      if (ch.phase === 'up') { const eyes = C.eyes[ch.cut]; for (let e = 0; e < eyes; e++) { const a = (ch.angle + e * 360 / eyes) * Math.PI / 180, ex = Math.round(cx + Math.cos(a) * 9), ey = Math.round(cy + Math.sin(a) * 9); cg.fillStyle(ash0, 1); cg.fillRect(ex - 2, ey - 2, 5, 5); cg.fillStyle(bone, 1); cg.fillRect(ex - 1, ey - 1, 3, 3); cg.fillStyle(led, 1); cg.fillRect(Math.round(cx + Math.cos(a) * 10), Math.round(cy + Math.sin(a) * 10), 1, 1); } }
    } else {
      // what is left after the crash: a bent ring and glass all over the marble
      pxCircle(cg, cx, cy + 6, 24, goldLo, 0); pxCircle(cg, cx + 2, cy + 7, 18, goldLo, 2);
      for (let i = 0; i < 18; i++) { const a = i * 0.35; cg.fillStyle(i % 2 ? lamp : gold, 1); cg.fillRect(Math.round(cx + Math.cos(a) * (18 + (i * 7) % 12)), Math.round(cy + 6 + Math.sin(a) * (10 + (i * 5) % 8)), 2, 1); }
      if (this.dust && this.dust.t < 1.2) { this.dust.t += dt; const u = this.dust.t; cg.fillStyle(hexNum(flat(P.dust)), 1); this.dust.bits.forEach((b, i) => { if (u < 0.5 + (i % 5) * 0.14) cg.fillRect(Math.round(cx + Math.cos(b.a) * b.v * u), Math.round(cy + Math.sin(b.a) * b.v * u * 0.7), 2, 2); }); }
    }
    const fg = this.floorG; fg.clear();
    // the stones flying off the heap to her pocket
    if (this.pocket) { const k = this.kidPx(); this.pocket.forEach(s => { s.t += dt; const u = Math.max(0, Math.min(1, s.t / 0.28)); if (s.t > 0 && u < 1) { fg.fillStyle(ash0, 1); fg.fillRect(Math.round(s.x + (k.x - s.x) * u), Math.round(s.y + (k.y - 4 - s.y) * u - Math.sin(u * Math.PI) * 10) + 1, 2, 1); fg.fillStyle(hexNum(P.colHi), 1); fg.fillRect(Math.round(s.x + (k.x - s.x) * u), Math.round(s.y + (k.y - 4 - s.y) * u - Math.sin(u * Math.PI) * 10), 2, 1); } }); if (this.pocket.every(s => s.t >= 0.28)) this.pocket = null; }
    this.drawFloorPebbles(fg, dt);
    this.tape.draw(fg); this.gold.draw(fg);
    // the open door: dark, with a line of lamplight on the sill that blinks
    if (this.doorOpen) { const [ex, ey] = LEVEL.exit; fg.fillStyle(hexNum(P.void), 1); fg.fillRect(ex * T + 2, ey * T + 1, 12, 15); if (Math.floor(t * 3) % 2) { fg.fillStyle(lamp, 1); fg.fillRect(ex * T + 4, ey * T + 15, 8, 1); } }
    // LEDs and real light that survive the dark: sensors, the lasers, the camera, the robot, the radio
    const lg = this.ledG; lg.clear();
    const blink = Math.floor(t * 2) % 2 === 0;
    this.sensors.forEach(s => {
      const on = this.sensorOn(s), sx = s.x * T, sy = s.y * T + (s.top ? 1 : 9);
      lg.fillStyle(ash0, 1); lg.fillRect(sx + 4, sy, 8, 7); lg.fillStyle(hexNum(P.device), 1); lg.fillRect(sx + 5, sy + 1, 6, 5);
      const fast = s.alarm > 0 && Math.floor(t * 16) % 2 === 0;
      lg.fillStyle(on || fast || (blink && s.cool <= 0 && !(s.alarm > 0)) ? red : hexNum(P.wallLine), 1); lg.fillRect(sx + 7, sy + 3, 2, 2);
      if (on) { lg.fillStyle(red, 1); lg.fillRect(sx + 6, sy + 2, 4, 1); lg.fillRect(sx + 6, sy + 5, 4, 1); }
      if (s.flash > 0.25) { lg.fillStyle(bone, 1); lg.fillRect(sx + 6, sy + 2, 4, 4); }
    });
    this.drawLasers(lg, t);
    if (this.radio.lit > 0) { const [rx, ry] = LEVEL.radio; lg.fillStyle(red, 1); lg.fillRect(rx * T + 12, ry * T + 11, 1, 1); lg.fillStyle(bone, 1); lg.fillRect(rx * T + 15, ry * T + 1, 1, 1); }
    const Cm = LEVEL.camera, ca = this.camAngle * Math.PI / 180, cmx = Math.round(Cm.x * T), cmy = Math.round(Cm.y * T); lg.fillStyle(ash0, 1); lg.fillRect(cmx - 4, cmy - 4, 9, 7); lg.fillStyle(hexNum(P.device), 1); lg.fillRect(cmx - 3, cmy - 3, 7, 5); lg.fillStyle(hexNum(P.glassLit), 1); lg.fillRect(Math.round(cmx + Math.cos(ca) * 3), Math.round(cmy + Math.sin(ca) * 3), 2, 2); if (blink || this.camSrc.lock > 0) { lg.fillStyle(led, 1); lg.fillRect(cmx - 2, cmy - 2, 1, 1); }
    const R = this.robot, ra = R.face * Math.PI / 180; lg.fillStyle(R.mode === 'investigate' ? red : hexNum(P.robotLed), 1); lg.fillRect(Math.round(R.x * T + 8 + Math.cos(ra) * 4), Math.round(R.y * T + 8 + Math.sin(ra) * 4), 2, 2);
    // the satellite, the strike, a burst where she was
    const fxg = this.fxG; fxg.clear();
    if (this.sparks && (this.sparks.t += dt) < 0.3) { const sp = this.sparks, n = Math.floor(sp.t * 20); [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([a, b], i) => { fxg.fillStyle(i % 2 ? bone : hexNum(P.goldHi), 1); fxg.fillRect(sp.x + a * (2 + n * 2), sp.y + b * (2 + n * 2), 1, 1); }); }
    if (!this.dead && this.inv > 0) this.girl.setVisible(Math.floor(this.inv * 12) % 2 === 0); else if (!this.dead && !this.girl.visible && this.inv === 0 && !this.done) this.girl.setVisible(true);
    this.drawSatellite(fxg, null);
    this.strikeFx.update(dt);
    if (this.fxBurst && this.fxBurst.t < 0.5) { const b = this.fxBurst; b.t += dt; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; fxg.fillStyle(i % 2 ? bone : red, 1); fxg.fillRect(Math.round(b.x + Math.cos(a) * b.t * 50), Math.round(b.y + Math.sin(a) * b.t * 40), 2, 2); } }
    // a hold bar over her while she cuts a chain
    if (this.ch.hold > 0 && this.ch.holdAt != null) { const k = this.kidPx(), x = Math.round(k.x - 6), y = Math.round(k.y - 18); fxg.fillStyle(ash0, 1); fxg.fillRect(x - 1, y - 1, 14, 4); fxg.fillStyle(hexNum(P.device), 1); fxg.fillRect(x, y, 12, 2); fxg.fillStyle(bone, 1); fxg.fillRect(x, y, Math.round(12 * Math.min(1, this.ch.hold)), 2); }
    if (this.nearThing && !this.bubbles.near(this.nearThing.tx * T + 8, 40)) this.bubbles.showPrompt(this.nearThing.tx * T + 8, this.nearThing.ty * T + 2, this.nearThing.label || 'J');
    // doors are W: the workshop's, and the way out once it is open
    const door = this.doorAhead();
    if (door) { const show = this.nearThing ? this.bubbles.showPrompt2.bind(this.bubbles) : this.bubbles.showPrompt.bind(this.bubbles); show(door[0] * T + 8, door[1] * T + 2, 'W'); }
    this.bubbles.update(dt, t);
    this.drawHud(dt);
  }
  // a door she stands under: { the door's tile } or null
  doorAhead() {
    if (this.dead || this.leaving || this.done || !this.kid || this.kid.moving) return null;
    const k = this.kid, at = (d) => k.tx === d[0] && k.ty === d[1] + 1;
    if (at(LEVEL.workshop)) return LEVEL.workshop;
    if (this.doorOpen && at(LEVEL.exit)) return LEVEL.exit;
    return null;
  }
  // the lasers: the ports always show a dim lens; a tell blinks both ports and dots the row; a
  // shot is a hard line, red with a pale core (ART_DIRECTION: no glow, a real light)
  drawLasers(g, t) {
    const L = LEVEL.lasers, red = hexNum(ASH.red), core = hexNum(ASH.redHi), dim = hexNum(ASH.ash3), x0 = L.x0 * T, x1 = (L.x1 + 1) * T, w = x1 - x0;
    this.lasers.forEach(b => {
      const y = b.y * T + 8, tick = Math.floor(t * 10) % 2 === 0;
      const port = b.st === 'on' || (b.st === 'tell' && tick) ? red : dim;
      g.fillStyle(port, 1); g.fillRect(x0 - 2, y - 1, 2, 3); g.fillRect(x1, y - 1, 2, 3);
      if (b.st === 'tell') { g.fillStyle(red, 1); for (let x = x0 + (tick ? 0 : 2); x < x1; x += 4) g.fillRect(x, y, 1, 1); }
      if (b.st === 'on') { g.fillStyle(red, 1); g.fillRect(x0, y - 1, w, 3); g.fillStyle(core, 1); g.fillRect(x0, y, w, 1); g.fillStyle(0xebe6d8, 1); g.fillRect(x1 - 2 - (Math.floor(t * 30) % 3), y - 2, 1, 1); g.fillRect(x0 + 1 + (Math.floor(t * 30) % 3), y + 2, 1, 1); }
    });
  }

  // The dark: the wing at night (every color stepped down the palette), with holes cut where
  // there is light. Outside the map it is black.
  // Drawn again (and sent to the GPU) only when the view or a light changed (Nov 18 perf pass).
  drawDark() {
    const ctx = this.darkCanvas.getContext('2d'), v = this.view;
    const c = this.kidPx(), all = this.dead ? this.lights : [{ x: c.x, y: c.y - 4, r: 52 }].concat(this.lights);
    const holes = all.map(l => ({ x: l.x - v.x + 1, y: l.y - v.y + 1, r: l.r, a: l.a }));
    this.darkImg.setPosition(v.x - 1, v.y - 1);
    const key = v.x + ',' + v.y + '|' + lightsKey(holes);
    if (key === this.darkKey) return;
    this.darkKey = key;
    // the night picture, copied once to a canvas the CPU draws from (no GPU read back per frame)
    if (!NIGHT_CPU || NIGHT_CPU.src !== NIGHT_CV) { NIGHT_CPU = cpuCanvas(NIGHT_CV.width, NIGHT_CV.height); NIGHT_CPU.getContext('2d').drawImage(NIGHT_CV, 0, 0); NIGHT_CPU.src = NIGHT_CV; }
    darkFill(ctx);
    ctx.drawImage(NIGHT_CPU, 1 - v.x, 1 - v.y);
    hardHoles(ctx, holes, v.x + v.y);
    this.darkTex.refresh();
  }

  // the cracked glasses, fixed to the screen
  drawHud(dt) {
    const g = this.hud, P = this.P, col = hexNum(P.overlay); g.clear();
    if (this.done) return;
    this.glitchT += dt;
    this.gl.drawMeter(g, 18, 166, col);
    // her pocket: PEBBLES n/5, and five stones, the ones she has filled in
    if (overlay.free(74, 165, 76, 9)) {
      pixText(g, 'PEBBLES ' + this.pebbles + '/' + MAX_PEBBLES, 76, 167, 0xebe6d8, 1, 1);
      for (let i = 0; i < MAX_PEBBLES; i++) { const x = 126 + i * 5; g.fillStyle(0x0e0f12, 1); g.fillRect(x - 1, 166, 5, 6); g.fillStyle(i < this.pebbles ? 0xebe6d8 : 0x45474d, 1); g.fillRect(x, 167, 3, 3); }
    }
    if (!this.gl.on) return;
    this.drawStatic(g);
    // the corner marks blink while the crack is new, then hold steady
    const show = this.glitchT >= 2 || Math.floor(this.glitchT * 8) % 3 !== 0, m = 5, s = 8;
    if (show) {
      g.fillStyle(col, 1);
      [[320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy]) => { g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
      g.fillRect(m, m + 6, 1, 3);
    }
    // the crack: from the top left corner, jagged, in pixels
    [[4, 4], [9, 7], [13, 6], [19, 11], [24, 12], [31, 18], [35, 17], [42, 23]].forEach(([x, y], i, arr) => { if (i) pxLine(g, arr[i - 1][0], arr[i - 1][1], x, y, 0xb8b2a3); });
    pxLine(g, 13, 6, 15, 1, 0x6b6c70); pxLine(g, 24, 12, 22, 19, 0x6b6c70); pxLine(g, 31, 18, 37, 13, 0x6b6c70);
    const label = this.glitchT < 3 && Math.floor(this.glitchT * 10) % 4 === 0 ? 'V1EW' : 'VIEW'; if (Math.floor(this.clock * 3) % 5) pixText(g, label, 44, m + 3, col, 1, 1);
    if (show && overlay.free(320 - m - 23, 180 - m - 9, 25, 8)) pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, 1);
  }

  // The cracked glasses' static, drawn here and not by Glasses.drawStatic: its torn rows are
  // dotted lines across the whole view, and here those read as the lasers' warning (a dotted line
  // across a row). These tears are short, broken scratches that never span a room.
  drawStatic(g) {
    const gl = this.gl, lv = gl.level; if (lv <= 0) return;
    const grey = hexNum(ASH.ash4), n = Math.round(20 + lv * 220);
    for (let i = 0; i < n; i++) { g.fillStyle(Math.random() < 0.5 ? 0xebe6d8 : grey, 1); g.fillRect(Math.floor(Math.random() * 320), Math.floor(Math.random() * 180), 1, 1); }
    const tears = Math.floor(lv * 6 + Math.random() * 2);
    g.fillStyle(grey, 1);
    for (let i = 0; i < tears; i++) {
      let x = Math.floor(Math.random() * 300), y = Math.floor(Math.random() * 178);
      const len = 4 + Math.floor(Math.random() * 14);
      for (let k = 0; k < len; k++) { g.fillRect(x + k, y, 1, 1); if (Math.random() < 0.25) y += Math.random() < 0.5 ? 1 : -1; }
    }
    // a dropout: a few rows go dark (short bands, not lines across the view)
    if (gl.out > 0) { g.fillStyle(0x0e0f12, 1); for (let i = 0; i < 6; i++) { const y = Math.floor(Math.random() * 180); g.fillRect(Math.floor(Math.random() * 200), y, 40 + Math.floor(Math.random() * 80), 2); } }
    // running hot: a red edge blinks around the view before they cut out
    if (gl.on && gl.heat > 0.72 && Math.floor(gl.t * (fx.reduced ? 2 : 5)) % 2 === 0) { g.fillStyle(0xe3412b, 1); g.fillRect(0, 0, 320, 2); g.fillRect(0, 178, 320, 2); g.fillRect(0, 2, 2, 176); g.fillRect(318, 2, 2, 176); }
  }

  hint() {
    if (this.leaving || this.done) return;
    const o = this.tileOf();
    if (this.doorOpen) return overlay.hint(o.x === LEVEL.exit[0] && o.y === LEVEL.exit[1] + 1 ? 'The door is open. W goes up through it.' : 'The door is open. North wall of the ballroom.');
    if (o.x === LEVEL.workshop[0] && o.y === LEVEL.workshop[1] + 1) return overlay.hint('A workshop. W goes in.');
    const r = roomAt(o.x, o.y);
    let id = r ? r.id : '';
    if (id === 'gallery' && o.y <= 15) id = 'hatch';
    overlay.hint(HINTS[id] || '');
  }
}
