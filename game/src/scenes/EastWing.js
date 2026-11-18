// Episode 3: the east wing, seen from above. She lands in the dark with cracked glasses that
// show what watches her only now and then. Motion sensors in a corridor (a radio by them plays
// the satellite's notes as she nears one), a patrol robot that goes to look at noises (a pebble
// down the dumbwaiter sends it to the far end of the study), a camera in the study, and a
// ballroom where a chandelier full of eyes has to be brought down before the door will open.
import { Music } from '../core/music.js';
import { hexNum, flat, Painter } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { LOOKS } from '../art/palettes.js';
import { T, W, H, LEVEL, buildMap, paintMap, isSolid, isOpaque } from '../art/eastwing.js';
import { Glasses } from '../core/glasses.js';
import { TopDownEpisode, makeTopSprites, LOCK_TD, pxCircle } from '../core/topdown.js';
import { Marks, Gold } from '../core/props.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { goNext } from '../core/flow.js';
import { NOTICE } from '../data/dialogue.js';
import { fx } from '../core/fx.js';
import { cg as CG } from '../ui/cg.js';

// one line each, by room
const ROOMS = [
  { x0: 0, y0: 18, x1: 12, y1: 29, hint: 'J takes pebbles. K throws one. Shift runs, loudly.' },
  { x0: 12, y0: 20, x1: 23, y1: 24, hint: 'Sensors see movement. Stand still when they pulse.' },
  { x0: 23, y0: 12, x1: 27, y1: 24, hint: 'A pebble down the dumbwaiter lands in the study.' },
  { x0: 14, y0: 1, x1: 29, y1: 11, hint: 'The robot goes to any noise. Shelves block its view.' },
  { x0: 30, y0: 0, x1: 44, y1: 13, hint: 'Hold J at a chained pillar. Stay behind the pillar.' }
];
// the satellite screen's note ladder (pentatonic, two octaves), so the radio sounds like it
const LADDER = [0, 2, 4, 7, 9];
const ladderHz = i => 440 * Math.pow(2, (LADDER[i % 5] + 12 * Math.min(2, Math.floor(i / 5))) / 12);
// a pixel line (no smooth vector lines in the picture)
function pxLine(g, x0, y0, x1, y1, color) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); g.fillStyle(color, 1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (let n = 0; n < 400; n++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}

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
      noisy: (x, y) => m[y][x] === ','
    });
    const P = this.P;
    makeSprites(this, P); makeTopSprites(this, P); this.makeProps(P);
    const art = paintMap(P, m); art.toTexture(this, 'ew_map'); this.marks = art.marks;
    this.add.image(0, 0, 'ew_map').setOrigin(0).setDepth(0);
    this.setupView(P.void);
    this.floorG = this.add.graphics().setDepth(1);
    this.robotImg = this.add.image(0, 0, 'td_robot').setDepth(3);
    this.chG = this.add.graphics().setDepth(6);
    this.hud = this.hudLayer(20);
    // the things in the wing
    this.sensors = LEVEL.sensors.map(s => Object.assign({}, s, { cool: 0, flash: 0 }));
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
    this.skipTiles = [[13, 22], [24, 14], [20, 10], [29, 6], [35, 8]];
    this.pile = this.marks.find(mk => mk.kind === 'pile'); this.pileTaken = false;
    this.pileThing = { tx: 9, ty: 21, use: () => this.takePile() };
    this.things.push(this.pileThing);
    C.chains.forEach(([px, py], i) => this.things.push({ tx: px, ty: py, reach: 2, hold: true, chain: i, label: 'J' }));
    this.things.push({ tx: 4, ty: 18, label: 'J', use: () => this.enterRoom('workshop') }); // optional
    // the dumbwaiter: J drops a pebble in
    const DW = LEVEL.dumbwaiter;
    this.dumbThing = { tx: DW.hatch[0], ty: DW.hatch[1], label: 'J', use: () => this.dropPebble() };
    this.things.push(this.dumbThing); this.rattle = null; this.pocket = null; this.dust = null; this.fxBurst = null;
    // things to look at: old bodies that were here before her, the study's shelves and desk, the
    // calendar, the radio, where the dumbwaiter comes out
    const N = NOTICE.eastwing;
    m.forEach((row, ty) => row.forEach((ch, tx) => { if (ch === 'b') this.addLook({ tx, ty, lines: N.body, clue: 'oldBody' }); }));
    [[19, 4], [19, 8], [23, 6]].forEach(([tx, ty]) => this.addLook({ tx, ty, lines: N.books }));
    this.addLook({ tx: 25, ty: 3, lines: N.desk, clue: 'routeMap' });
    this.addLook({ tx: 9, ty: 18, lines: N.calendar });
    this.addLook({ tx: 13, ty: 23, lines: N.radio });
    this.addLook({ tx: DW.out[0] - 1, ty: DW.out[1], lines: N.hatch });
    this.radio = { step: 0, near: false };
    this.cutChains = new Set();
    this.lights = [];
    this.input.on('pointerdown', ptr => { if (this.dead || this.done) return; const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y); this.throwTo(Math.floor(wp.x / T), Math.floor(wp.y / T)); });
    // the show's tape marks (checkpoints): a retry from one keeps her pebbles and the pile taken
    this.tape = new Marks(this, LEVEL.marks.map(([tx, ty]) => ({ tx, ty })), { top: true, carry: () => ({ pebbles: this.pebbles, pile: this.pileTaken }) });
    this.gold = new Gold(this, LEVEL.gold.map(([tx, ty]) => ({ tx, ty })).filter(q => !isSolid(m[q.ty][q.tx])), { top: true });
    this.drawBodies();
    this.spawn();
    const from = this.tape.from;
    if (from) { this.pebbles = from.pebbles || 0; if (from.pile) { this.pileTaken = true; this.pileThing.off = true; } }
    this.cameras.main.fadeIn(data.fromFall ? 1400 : 400);
    this.glitchT = data.fromFall ? 0 : 3;
    this.beds = { hum: Sound.hum(0.012), wind: Sound.wind(0.03) };
    Music.play('eastwing', { fadeIn: 3 });
    this.events.once('shutdown', () => { Object.values(this.beds).forEach(b => b.stop(0.4)); CG.hp(null); });
    // hearts: the robot's shell is the one thing in the wing that only hurts (design pass: the
    // house hurts her, what watches her kills her)
    this.hp = 3; this.inv = 0; this.sparks = null; this.showHp();
    this.onWake = () => this.showHp();
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
    if (this.dead) { if (c.advance() || c.restart() || c.throwP()) this.skipDeath(); c.look(); }
    else if (c.look()) { const L = state.nextLook(); overlay.note('Look ' + L + ' · ' + LOOKS[L].name, 1800); this.scene.restart({}); return; }
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
    this.updateRattle(dt);
    this.updateCamera(dt);
    this.updateRobot(dt);
    this.updateChandelier(dt);
    this.follow();
    this.draw(dt);
    this.hint();
    c.endFrame();
  }

  // review: N moves her through the wing room by room; in the ballroom it brings the chandelier down
  skipAhead() {
    const o = this.tileOf(), next = this.skipTiles.find(([x, y]) => x + y * 0.01 > o.x + o.y * 0.01 + 0.5 && !(x === o.x && y === o.y));
    if (o.x >= 31 && o.y <= 12) {
      if (!this.doorOpen && this.ch.phase === 'up') LEVEL.chandelier.chains.forEach((c, i) => { if (!this.cutChains.has(i)) { this.cutChain(i); const th = this.things.find(q => q.chain === i); if (th) th.off = true; } });
      else if (this.doorOpen) this.placeTile(LEVEL.exit[0], LEVEL.exit[1] + 1);
      return;
    }
    if (next) this.placeTile(next[0], next[1]);
  }
  onArrive(x, y) {
    if (this.doorOpen && x === LEVEL.exit[0] && y === LEVEL.exit[1]) this.leave();
  }
  onNoise(x, y, r, kind) {
    // the robot comes to look; a clatter out of the dumbwaiter it always goes to, and stays longer
    const R = this.robot, L = LEVEL.robot;
    if ((kind === 'dumbwaiter' || Math.hypot(R.x - x, R.y - y) <= Math.max(L.hear, r + 3)) && R.mode !== 'off') {
      R.mode = 'investigate'; R.target = [x, y]; R.route = this.path([Math.round(R.x), Math.round(R.y)], [x, y]); R.wait = 0; R.stay = kind === 'dumbwaiter' ? 5 : 2.4;
      this.bubbles.say('robot', '?', () => ({ x: R.x * T + 8, y: R.y * T + 2 }), { ink: 0xf5ce77, pitch: 900, ms: 900 });
    }
    // a sensor in range of a noise fires once and needs time to recharge; if a pebble set it
    // off, the satellite shoots the pebble
    let seen = false;
    this.sensors.forEach(s => { if (s.cool <= 0 && Math.hypot(s.x - x, s.y - y) <= s.r + 0.5) { s.cool = 3.2; s.flash = 0.5; Sound.tone(1900, 0.08, 'square', 0.02); seen = true; } });
    if (kind === 'pebble') {
      const i = y * W + x;
      if ((this.camSrc.tiles && this.camSrc.tiles.has(i)) || (this.chSrc.tiles && this.chSrc.tiles.has(i))) seen = true;
      const fp = this.floorPebbles.find(q => q.x === x && q.y === y);
      if (seen && fp) this.time.delayedCall(260, () => { if (Sound.charge) Sound.charge(); this.strikeAt(fp); });
    }
    // the chandelier's eyes turn toward a noise in the ballroom
    if (x >= 30 && y <= 13 && this.ch.phase === 'up') { this.ch.focus = Math.atan2(y + 0.5 - LEVEL.chandelier.y, x + 0.5 - LEVEL.chandelier.x) * 180 / Math.PI; this.ch.focusT = 1.4; }
  }

  takePile() {
    if (this.pileTaken) return;
    this.pileTaken = true; this.pileThing.off = true; this.pebbles += 5;
    Sound.tone(500, 0.06, 'triangle', 0.02); this.time.delayedCall(70, () => Sound.tone(620, 0.06, 'triangle', 0.02));
    // the stones jump into her pocket
    const k = this.kidPx(); this.pocket = (this.pile ? this.pile.stones : []).map(([x, y]) => ({ x, y, tx: k.x, ty: k.y - 4, t: 0 }));
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
      // the pebble lands on the study floor, where she can pick it up later
      const fp = { x, y, dx: 2, dy: -2 }; fp.thing = { tx: x, ty: y, reach: 1, label: 'J', use: () => this.pickPebble(fp) };
      this.floorPebbles.push(fp); this.things.push(fp.thing);
    }
  }

  // ------------------------------------------------------------------ sensors, the radio, camera, robot
  sensorOn(s) { return s.cool <= 0 && ((this.clock + s.phase * s.period) % s.period) < s.window; }
  updateSensors(dt) {
    const o = this.tileOf();
    let nearAny = false;
    this.sensors.forEach(s => {
      s.cool = Math.max(0, s.cool - dt); s.flash = Math.max(0, s.flash - dt);
      const on = this.sensorOn(s), d = Math.hypot(o.x - s.x, o.y - s.y);
      if (d <= s.r + 2.5) nearAny = true;
      if (on && !s.was) {
        // the pulse is heard louder as she nears its range, and lower once she is inside it
        const near = Math.max(0, Math.min(1, 1 - (d - s.r) / 4));
        Sound.tone(d <= s.r ? 820 : 1300, 0.05, 'sine', 0.008 + 0.03 * near);
        // the radio picks the sensors up: near one, every pulse is the next note of the ladder
        if (d <= s.r + 2.5 && !this.dead) { const rd = Math.hypot(o.x - 13, o.y - 23); Sound.tone(ladderHz(this.radio.step), 0.09, 'square', 0.006 + 0.012 * Math.max(0, 1 - rd / 16)); this.radio.step++; this.radio.lit = 0.25; }
      }
      s.was = on;
      if (on && !this.dead && !window.__noDeath && this.kid.moving && d <= s.r) { this.sensorSrc.x = s.x * T + 8; this.die(this.sensorSrc); }
    });
    if (!nearAny) this.radio.step = 0;
    this.radio.lit = Math.max(0, (this.radio.lit || 0) - dt);
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
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(key(nx, ny))) return; const c = this.m[ny][nx]; if (isSolid(c) && !(nx === to[0] && ny === to[1] && !isSolid(c))) return; seen.add(key(nx, ny)); prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); });
    }
    const out = []; let cur = to; if (!prev.has(key(...to))) return out;
    while (cur && !(cur[0] === from[0] && cur[1] === from[1])) { out.unshift(cur); cur = prev.get(key(...cur)); }
    return out;
  }
  showHp() { CG.hp(state.immune ? null : this.hp, 3); }
  // she walks into the robot, or it rolls into her: a shock off its shell, a heart, and she is
  // thrown back a tile. It does not see her for it (its lens looks past her feet).
  onBump(x, y) { const R = this.robot; if (Math.round(R.x) === x && Math.round(R.y) === y) this.bumpRobot(); }
  bumpRobot() {
    if (this.dead || this.leaving || this.inv > 0 || state.immune || window.__noDeath) return;
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
        const k = this.kidPx(); if (!window.__noDeath && Math.hypot(k.x - C.x * T, k.y - C.y * T) < 26) this.die({ id: 'chandelier', direct: true });
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
    // lights in the wing: moonlight where the roof is gone, the chandelier's candles, the robot's lamp
    this.lights = LEVEL.moon.map(m => ({ x: m.x, y: m.y, r: m.r, a: 0.9 }));
    if (ch.phase !== 'down') this.lights.push({ x: C.x * T, y: C.y * T, r: 88 - ch.cut * 6, a: 0.8 });
    this.lights.push({ x: this.robot.x * T + 8, y: this.robot.y * T + 8, r: 20, a: 0.8 });
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
    // sensors: through the glasses, the ground each one covers, dotted; solid while it pulses
    if (glassesOn) this.sensors.forEach(s => {
      const x = s.x * T + 8, y = s.y * T + 8, on = this.sensorOn(s);
      pxCircle(g, x, y, s.r * T, on ? red : s.cool > 0 ? hexNum(P.wallLine) : hexNum(P.rubble), on ? 0 : 3);
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
    // the pile of loose pebbles until she takes it, then the stones flying to her pocket
    if (this.pile && !this.pileTaken) this.pile.stones.forEach(([x, y], i) => { fg.fillStyle(hexNum(i % 2 ? P.rubbleHi : P.col), 1); fg.fillRect(x, y, 2, 2); });
    if (this.pocket) { const k = this.kidPx(); this.pocket.forEach((s, i) => { s.t += dt; const u = Math.min(1, s.t / (0.25 + i * 0.04)); if (u < 1) { fg.fillStyle(hexNum(P.colHi), 1); fg.fillRect(Math.round(s.x + (k.x - s.x) * u), Math.round(s.y + (k.y - 4 - s.y) * u - Math.sin(u * Math.PI) * 8), 2, 2); } }); if (this.pocket.every((s, i) => s.t > 0.25 + i * 0.04)) this.pocket = null; }
    this.drawFloorPebbles(fg, dt);
    this.tape.draw(fg); this.gold.draw(fg);
    // the open door: dark, with a line of lamplight on the sill that blinks
    if (this.doorOpen) { const [ex, ey] = LEVEL.exit; fg.fillStyle(hexNum(P.void), 1); fg.fillRect(ex * T + 2, ey * T + 4, 12, 12); if (Math.floor(t * 3) % 2) { fg.fillStyle(lamp, 1); fg.fillRect(ex * T + 4, ey * T + 14, 8, 1); } }
    // LEDs that survive the dark: sensors, the camera, the robot, the radio
    const lg = this.ledG; lg.clear();
    const blink = Math.floor(t * 2) % 2 === 0;
    this.sensors.forEach(s => {
      const on = this.sensorOn(s);
      lg.fillStyle(ash0, 1); lg.fillRect(s.x * T + 4, s.y * T + 9, 8, 7); lg.fillStyle(hexNum(P.device), 1); lg.fillRect(s.x * T + 5, s.y * T + 10, 6, 5);
      lg.fillStyle(on || (blink && s.cool <= 0) ? red : hexNum(P.wallLine), 1); lg.fillRect(s.x * T + 7, s.y * T + 12, 2, 2);
      if (on) { lg.fillStyle(red, 1); lg.fillRect(s.x * T + 6, s.y * T + 11, 4, 1); lg.fillRect(s.x * T + 6, s.y * T + 14, 4, 1); }
      if (s.flash > 0.25) { lg.fillStyle(bone, 1); lg.fillRect(s.x * T + 6, s.y * T + 11, 4, 4); }
    });
    if (this.radio.lit > 0) { lg.fillStyle(red, 1); lg.fillRect(13 * T + 12, 23 * T + 11, 1, 1); lg.fillStyle(bone, 1); lg.fillRect(13 * T + 15, 23 * T, 1, 1); }
    const Cm = LEVEL.camera, ca = this.camAngle * Math.PI / 180; lg.fillStyle(ash0, 1); lg.fillRect(Cm.x * T - 4, Cm.y * T - 4, 9, 7); lg.fillStyle(hexNum(P.device), 1); lg.fillRect(Cm.x * T - 3, Cm.y * T - 3, 7, 5); lg.fillStyle(hexNum(P.glassLit), 1); lg.fillRect(Math.round(Cm.x * T + Math.cos(ca) * 3), Math.round(Cm.y * T + Math.sin(ca) * 3), 2, 2); if (blink || this.camSrc.lock > 0) { lg.fillStyle(led, 1); lg.fillRect(Cm.x * T - 2, Cm.y * T - 2, 1, 1); }
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
    this.bubbles.update(dt, t);
    this.drawHud(dt);
  }

  // the cracked glasses, fixed to the screen
  drawHud(dt) {
    const g = this.hud, P = this.P, col = hexNum(P.overlay); g.clear();
    if (this.done) return;
    this.glitchT += dt;
    this.gl.drawMeter(g, 18, 166, col);
    if (overlay.free(74, 165, 44, 9)) pixText(g, 'PEBBLES ' + this.pebbles, 76, 167, 0xebe6d8, 1, 1);
    if (!this.gl.on) return;
    this.gl.drawStatic(g, col);
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

  hint() {
    if (this.leaving || this.done) return;
    if (this.doorOpen) return overlay.hint('The door is open. North wall of the ballroom.');
    const o = this.tileOf(), r = ROOMS.find(q => o.x >= q.x0 && o.x <= q.x1 && o.y >= q.y0 && o.y <= q.y1);
    overlay.hint(r ? r.hint : '');
  }
}
