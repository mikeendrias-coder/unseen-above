// Episode 3: the east wing, seen from above. She lands in the dark with cracked glasses that
// show what watches her only now and then. Motion sensors in a corridor, a patrol robot that
// goes to look at noises, a camera in the study, and a ballroom where a chandelier full of eyes
// has to be brought down before the door will open.
import { Music } from '../core/music.js';
import { hexNum, flat, Painter } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText, textWidth } from '../art/pixfont.js';
import { LOOKS } from '../art/palettes.js';
import { T, W, H, LEVEL, buildMap, paintMap, isSolid, isOpaque } from '../art/eastwing.js';
import { Glasses } from '../core/glasses.js';
import { TopDownEpisode, makeTopSprites, LOCK_TD } from '../core/topdown.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { goNext } from '../core/flow.js';

const ROOMS = [
  { x0: 0, y0: 18, x1: 12, y1: 29, hint: 'The glasses are cracked: they show what watches you only now and then. E picks up pebbles, F or a click throws one. Shift runs, but running is loud.' },
  { x0: 12, y0: 12, x1: 27, y1: 24, hint: 'Motion sensors see movement, not you: stand still while they pulse. A pebble near one sets it off, and it needs a moment to recharge.' },
  { x0: 14, y0: 1, x1: 29, y1: 11, hint: 'A patrol robot goes to look at any noise. Debris is loud underfoot. Shelves block its view and the camera’s.' },
  { x0: 30, y0: 0, x1: 44, y1: 13, hint: 'The chandelier is watching. Hold E near a chained pillar to cut its chain; the far side of a pillar is out of its sight. A noise turns its eyes.' }
];

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
    this.skipTiles = [[13, 22], [25, 14], [20, 10], [29, 6], [35, 8]];
    this.pile = this.marks.find(mk => mk.kind === 'pile'); this.pileTaken = false;
    this.pileThing = { tx: 9, ty: 21, use: () => this.takePile() };
    this.things.push(this.pileThing);
    C.chains.forEach(([px, py], i) => this.things.push({ tx: px, ty: py, reach: 2, hold: true, chain: i, label: 'E' }));
    this.things.push({ tx: 4, ty: 18, label: 'E', use: () => this.enterRoom('workshop') }); // optional
    this.cutChains = new Set();
    this.lights = [];
    this.input.on('pointerdown', ptr => { if (this.dead || this.done) return; const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y); this.throwTo(Math.floor(wp.x / T), Math.floor(wp.y / T)); });
    this.drawBodies();
    this.spawn();
    this.cameras.main.fadeIn(data.fromFall ? 1400 : 400);
    this.glitchT = data.fromFall ? 0 : 3;
    this.beds = { hum: Sound.hum(0.012), wind: Sound.wind(0.03) };
    Music.play('eastwing', { fadeIn: 3 });
    this.events.once('shutdown', () => Object.values(this.beds).forEach(b => b.stop(0.4)));
    this.takeNote({ fromCut: data.fromCut && !data.fromFall }, 3, 'The East Wing');
    if (data.fromFall) this.time.delayedCall(900, () => overlay.note('The glasses cracked', 2200));
    this.time.delayedCall(data.fromFall ? 1900 : 600, () => this.itemPanel('cracked'));
    window.__game = { scene: this, state };
  }

  makeProps(P) {
    const add = (key, w, h, draw) => { const p = new Painter(w, h); draw(p); p.toTexture(this, key); };
    add('td_robot', 11, 11, p => { p.circle(5, 6, 5, P.device); p.circle(5, 5, 4, P.robot); p.circle(4, 4, 2, P.colHi); p.rect(4, 9, 3, 2, P.device); });
  }

  // ------------------------------------------------------------------ the loop
  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    this.reviewKeys();
    if (c.look()) { const L = state.nextLook(); overlay.note('Look ' + L + ' · ' + LOOKS[L].name, 1800); this.scene.restart({}); return; }
    if (c.restart() && !this.leaving && !this.done && !this.dead) { this.dead = true; this.ep.take++; this.cameras.main.fadeOut(200, 0, 0, 0); this.time.delayedCall(210, () => this.scene.restart({})); c.endFrame(); return; }
    if (this.done) { c.endFrame(); return; }
    if (!this.dead && !this.leaving) {
      this.moveKid(dt);
      if (c.throwP()) this.throwAhead();
      if (c.glasses()) this.gl.toggle();
      this.updateThings();
      this.holdChain(dt);
    }
    this.gl.update(dt);
    this.updateFlight(dt);
    this.updateSensors(dt);
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
    // the robot comes to look
    const R = this.robot, L = LEVEL.robot;
    if (Math.hypot(R.x - x, R.y - y) <= Math.max(L.hear, r + 3) && R.mode !== 'off') { R.mode = 'investigate'; R.target = [x, y]; R.route = this.path([Math.round(R.x), Math.round(R.y)], [x, y]); R.wait = 0; this.bubbles.say('robot', '?', () => ({ x: R.x * T + 8, y: R.y * T + 2 }), { edge: 0xff5a4a, ink: 0xffffff, pitch: 900, ms: 900 }); }
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

  // ------------------------------------------------------------------ sensors, camera, robot
  sensorOn(s) { return s.cool <= 0 && ((this.clock + s.phase * s.period) % s.period) < s.window; }
  updateSensors(dt) {
    const o = this.tileOf();
    this.sensors.forEach(s => {
      s.cool = Math.max(0, s.cool - dt); s.flash = Math.max(0, s.flash - dt);
      const on = this.sensorOn(s);
      if (on && !s.was) Sound.tone(1300, 0.04, 'sine', 0.008);
      s.was = on;
      if (on && !this.dead && !window.__noDeath && this.kid.moving && Math.hypot(o.x - s.x, o.y - s.y) <= s.r) { this.sensorSrc.x = s.x * T + 8; this.die(this.sensorSrc); }
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
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(key(nx, ny))) return; const c = this.m[ny][nx]; if (isSolid(c) && !(nx === to[0] && ny === to[1] && !isSolid(c))) return; seen.add(key(nx, ny)); prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); });
    }
    const out = []; let cur = to; if (!prev.has(key(...to))) return out;
    while (cur && !(cur[0] === from[0] && cur[1] === from[1])) { out.unshift(cur); cur = prev.get(key(...cur)); }
    return out;
  }
  updateRobot(dt) {
    const R = this.robot, L = LEVEL.robot;
    if (!R.route.length && R.mode === 'patrol') { const w = L.path[R.wp]; R.route = this.path([Math.round(R.x), Math.round(R.y)], w); R.wp = (R.wp + 1) % L.path.length; }
    if (R.route.length) {
      const [nx, ny] = R.route[0], k = this.kid;
      const kidOn = (k.tx === nx && k.ty === ny) || (k.moving && k.fx === nx && k.fy === ny);
      if (!kidOn) {
        const dx = nx - R.x, dy = ny - R.y, d = Math.hypot(dx, dy), step = L.speed * dt;
        if (d > 0.01) R.face = Math.atan2(dy, dx) * 180 / Math.PI;
        if (d <= step) { R.x = nx; R.y = ny; R.route.shift(); } else { R.x += dx / d * step; R.y += dy / d * step; }
      }
    } else if (R.mode === 'investigate') {
      // look around where the noise was, then go back to the loop
      R.wait += dt; R.face += 160 * dt;
      if (R.wait > 2.4) { R.mode = 'patrol'; R.wp = 0; }
    }
    this.robotSrc.tiles = this.coneTiles(R.x + 0.5, R.y + 0.5, R.face, L.half, L.range);
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
    Sound.tone(900, 0.2, 'sawtooth', 0.03, 200); Sound.noise(0.4, 0.1, 3000); this.cameras.main.shake(260, 0.008);
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
        this.cameras.main.shake(500, 0.02); Sound.noise(1.0, 0.25, 2000); Sound.tone(60, 0.8, 'sawtooth', 0.05, 30);
        this.noise(Math.floor(C.x), Math.floor(C.y), 9, 'crash');
        this.dust = { t: 0 };
        this.doorOpen = true; this.time.delayedCall(600, () => { Sound.chime(); overlay.note('The door is open', 2000); });
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
    this.time.delayedCall(4700, () => { if (!goNext(this, 'ep3b')) { overlay.card('TO BE CONTINUED', 'Episode 4 is next', 4000); overlay.hint('That is the end of this build. R plays episode 3 again.'); } });
  }

  // ------------------------------------------------------------------ drawing
  draw(dt) {
    const P = this.P, t = this.clock, C = LEVEL.chandelier, ch = this.ch, red = hexNum(P.hazard), led = hexNum(P.led);
    this.drawGirl();
    this.robotImg.setPosition(Math.round(this.robot.x * T + 8), Math.round(this.robot.y * T + 8));
    // lights in the wing: moonlight where the roof is gone, the chandelier's candles, the robot's lamp
    this.lights = LEVEL.moon.map(m => ({ x: m.x, y: m.y, r: m.r, soft: 0.6, a: 0.85 }));
    if (ch.phase !== 'down') this.lights.push({ x: C.x * T, y: C.y * T, r: 92 - ch.cut * 6 + Math.sin(t * 7) * 2, soft: 0.7, a: 0.75 });
    this.lights.push({ x: this.robot.x * T + 8, y: this.robot.y * T + 8, r: 20, soft: 0.6, a: 0.7 });
    this.drawDark(0.88);
    // what the cracked glasses still show: cones that flicker in and out, split in two colors
    const g = this.overG; g.clear();
    const glassesOn = this.gl.showing && ((Math.sin(t * 2.3) + Math.sin(t * 5.7 + 1) * 0.6 + Math.sin(t * 13.1) * 0.3) > -0.35 || this.glitchT < 2.5);
    const tileFill = (tiles, col, a, off) => tiles && tiles.forEach(i => { const x = (i % W) * T, y = Math.floor(i / W) * T; g.fillStyle(col, a); g.fillRect(x + 1 + (off || 0), y + 1, 14, 14); });
    [this.camSrc, this.robotSrc, this.chSrc].forEach(s => {
      if (!s.tiles) return;
      const locking = s.lock > 0;
      if (locking) tileFill(s.tiles, red, 0.22 + Math.min(1, s.lock / LOCK_TD) * 0.15);
      else if (glassesOn) { tileFill(s.tiles, hexNum(P.overlay), 0.13); if (Math.floor(t * 9) % 4 === 0) tileFill(s.tiles, red, 0.07, 1); }
    });
    // sensors: a red eye in the wall, a pulse you can always see
    this.sensors.forEach(s => {
      const x = s.x * T + 8, y = s.y * T + 8, on = this.sensorOn(s);
      g.lineStyle(1, red, on ? 0.7 : s.cool > 0 ? 0.12 : 0.25); g.strokeCircle(x, y, s.r * T);
      if (on) { g.fillStyle(red, 0.09); g.fillCircle(x, y, s.r * T); }
      if (s.flash > 0) { g.lineStyle(2, 0xffffff, s.flash); g.strokeCircle(x, y, (1 - s.flash * 2) * s.r * T + 4); }
    });
    this.drawNoise(g, dt);
    // the chandelier from above: a gold ring, crystal arms, candles, eyes, chains to the pillars
    const cg = this.chG; cg.clear();
    const cx = C.x * T + (ch.shake > 0 ? (Math.random() - 0.5) * 4 * ch.shake : 0), cy = C.y * T, fall = ch.phase === 'falling' ? Math.min(1, ch.t / 1.1) : 0;
    if (ch.phase !== 'down') {
      const sc = 1 + fall * fall * 0.5, rr = 22 * sc;
      C.chains.forEach(([px, py], i) => { if (this.cutChains.has(i)) { cg.lineStyle(1, hexNum(P.goldLo), 1); cg.lineBetween(px * T + 8, py * T + 8, px * T + 8 + (cx - px * T) * 0.2, py * T + 8 + (cy - py * T) * 0.2); } else { cg.lineStyle(1, hexNum(P.gold), 1); cg.lineBetween(px * T + 8, py * T + 8, cx, cy); } });
      cg.fillStyle(hexNum(P.void), 0.5); cg.fillEllipse(cx + 4, cy + 6, rr * 2.1, rr * 1.4);
      cg.lineStyle(3, hexNum(P.gold), 1); cg.strokeCircle(cx, cy, rr); cg.lineStyle(1, hexNum(P.goldHi), 1); cg.strokeCircle(cx, cy, rr - 2);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.2; cg.lineStyle(1, hexNum(P.glassLit), 0.9); cg.lineBetween(cx, cy, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); cg.fillStyle(hexNum(P.lamp), 1); cg.fillRect(cx + Math.cos(a) * rr - 1, cy + Math.sin(a) * rr - 1, 2, 2); }
      cg.fillStyle(hexNum(P.gold), 1); cg.fillCircle(cx, cy, 5 * sc);
      if (ch.phase === 'up') { const eyes = C.eyes[ch.cut]; for (let e = 0; e < eyes; e++) { const a = (ch.angle + e * 360 / eyes) * Math.PI / 180; cg.fillStyle(0xffffff, 1); cg.fillCircle(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 2.5); cg.fillStyle(led, 1); cg.fillCircle(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, 1.2); } }
    } else {
      // what is left after the crash
      cg.lineStyle(2, hexNum(P.goldLo), 1); cg.strokeEllipse(cx, cy + 6, 50, 26); for (let i = 0; i < 18; i++) { const a = i * 0.35; cg.fillStyle(hexNum(i % 2 ? P.glassLit : P.gold), 1); cg.fillRect(cx + Math.cos(a) * (18 + (i * 7) % 12), cy + 6 + Math.sin(a) * (10 + (i * 5) % 8), 2, 1); }
      if (this.dust && this.dust.t < 1.6) { this.dust.t += dt; const u = this.dust.t / 1.6; cg.fillStyle(hexNum(flat(P.dust)), 0.5 * (1 - u)); cg.fillCircle(cx, cy, 20 + u * 60); }
    }
    // the open door
    const fg = this.floorG; fg.clear();
    // the pile of loose pebbles until she takes it, then the stones flying to her pocket
    if (this.pile && !this.pileTaken) this.pile.stones.forEach(([x, y], i) => { fg.fillStyle(hexNum(i % 2 ? P.rubbleHi : P.col), 1); fg.fillRect(x, y, 2, 2); });
    if (this.pocket) { const k = this.kidPx(); this.pocket.forEach((s, i) => { s.t += dt; const u = Math.min(1, s.t / (0.25 + i * 0.04)); if (u < 1) { fg.fillStyle(hexNum(P.colHi), 1); fg.fillRect(Math.round(s.x + (k.x - s.x) * u), Math.round(s.y + (k.y - 4 - s.y) * u - Math.sin(u * Math.PI) * 8), 2, 2); } }); if (this.pocket.every((s, i) => s.t > 0.25 + i * 0.04)) this.pocket = null; }
    this.drawFloorPebbles(fg, dt);
    if (this.doorOpen) { const [ex, ey] = LEVEL.exit; fg.fillStyle(hexNum(P.void), 1); fg.fillRect(ex * T + 2, ey * T + 4, 12, 12); fg.fillStyle(hexNum(P.lamp), 0.5 + 0.3 * Math.sin(t * 4)); fg.fillRect(ex * T + 4, ey * T + 13, 8, 2); }
    // LEDs that survive the dark: sensors, the camera, the robot
    const lg = this.ledG; lg.clear();
    const blink = Math.floor(t * 2) % 2 === 0;
    this.sensors.forEach(s => { lg.fillStyle(hexNum(P.device), 1); lg.fillRect(s.x * T + 5, s.y * T + 10, 6, 5); lg.fillStyle(this.sensorOn(s) || blink ? red : hexNum(P.wallLine), 1); lg.fillRect(s.x * T + 7, s.y * T + 12, 2, 2); });
    const Cm = LEVEL.camera, ca = this.camAngle * Math.PI / 180; lg.fillStyle(hexNum(P.device), 1); lg.fillRect(Cm.x * T - 3, Cm.y * T - 3, 7, 5); lg.fillStyle(hexNum(P.glassLit), 1); lg.fillRect(Math.round(Cm.x * T + Math.cos(ca) * 3), Math.round(Cm.y * T + Math.sin(ca) * 3), 2, 2); if (blink || this.camSrc.lock > 0) { lg.fillStyle(led, 1); lg.fillRect(Cm.x * T - 2, Cm.y * T - 2, 1, 1); }
    const R = this.robot, ra = R.face * Math.PI / 180; lg.fillStyle(R.mode === 'investigate' ? red : hexNum(P.robotLed), 1); lg.fillRect(Math.round(R.x * T + 8 + Math.cos(ra) * 4), Math.round(R.y * T + 8 + Math.sin(ra) * 4), 2, 2);
    // the satellite, the strike, a burst where she was
    const fx = this.fxG; fx.clear();
    this.drawSatellite(fx, this.strikeFx.glow);
    this.strikeFx.update(dt);
    if (this.fxBurst && this.fxBurst.t < 0.6) { const b = this.fxBurst; b.t += dt; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; fx.fillStyle(i % 2 ? 0xffffff : red, 1 - b.t / 0.6); fx.fillRect(Math.round(b.x + Math.cos(a) * b.t * 50), Math.round(b.y + Math.sin(a) * b.t * 40), 2, 2); } }
    // a hold ring while she cuts a chain
    if (this.ch.hold > 0 && this.ch.holdAt != null) { const k = this.kidPx(); fx.lineStyle(2, 0xffffff, 0.9); fx.beginPath(); fx.arc(k.x, k.y - 14, 5, -Math.PI / 2, -Math.PI / 2 + this.ch.hold * Math.PI * 2); fx.strokePath(); }
    if (this.nearThing && !this.bubbles.list.size) this.bubbles.showPrompt(this.nearThing.tx * T + 8, this.nearThing.ty * T + 2, this.nearThing.hold ? 'E' : 'E');
    this.bubbles.update(dt, t);
    this.drawHud(dt);
  }

  // the cracked glasses, fixed to the screen
  drawHud(dt) {
    const g = this.hud, P = this.P, col = hexNum(P.overlay); g.clear();
    if (this.done) return;
    this.glitchT += dt;
    this.gl.drawMeter(g, 18, 166, col);
    pixText(g, 'PEBBLES ' + this.pebbles, 76, 167, 0xffffff, 1, 0.75);
    if (!this.gl.on) return;
    this.gl.drawStatic(g, col);
    const a = this.glitchT < 2 ? (Math.random() < 0.5 ? 0.9 : 0.1) : 0.5, m = 5, s = 8;
    g.fillStyle(col, a);
    [[320 - m, m, -1, 1], [m, 180 - m, 1, -1], [320 - m, 180 - m, -1, -1]].forEach(([x, y, sx, sy]) => { g.fillRect(sx > 0 ? x : x - s, sy > 0 ? y : y - 1, s, 1); g.fillRect(sx > 0 ? x : x - 1, sy > 0 ? y : y - s, 1, s); });
    // the crack: from the top left corner, jagged, with a shard missing from the corner mark
    g.fillStyle(0xffffff, 0.55);
    [[4, 4], [9, 7], [13, 6], [19, 11], [24, 12], [31, 18], [35, 17], [42, 23]].forEach(([x, y], i, arr) => { if (i) { const [px, py] = arr[i - 1]; g.lineStyle(1, 0xffffff, 0.45); g.lineBetween(px, py, x, y); } });
    g.lineStyle(1, 0xffffff, 0.35); g.lineBetween(13, 6, 15, 1); g.lineBetween(24, 12, 22, 19); g.lineBetween(31, 18, 37, 13);
    g.fillStyle(col, a); g.fillRect(m, m + 6, 1, 3);
    const label = this.glitchT < 3 && Math.random() < 0.3 ? 'V1EW' : 'VIEW'; if (Math.floor(this.clock * 3) % 5) pixText(g, label, 44, m + 3, col, 1, a);
    pixText(g, 'CH 07', 320 - m - 22, 180 - m - 8, col, 1, a);
  }

  hint() {
    if (this.leaving || this.done) return;
    if (this.doorOpen) return overlay.hint('The way out is open: the door on the north wall of the ballroom.');
    const o = this.tileOf(), r = ROOMS.find(q => o.x >= q.x0 && o.x <= q.x1 && o.y >= q.y0 && o.y <= q.y1);
    overlay.hint(r ? r.hint : '');
  }
}
