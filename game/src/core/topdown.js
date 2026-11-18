// Top-down episode machinery: tile-locked movement with smooth steps, walking (quiet) and
// running (noisy), noise rings, thrown pebbles, tile cones with line of sight, a lock-on that
// ends in the satellite strike, bodies that stay, takes, darkness with a sight radius and a few
// lights, E to use things. Episodes extend TopDownEpisode and add their own rooms.
import { makeControls } from './controls.js';
import { Sound } from './sound.js';
import { state } from './state.js';
import { overlay, noteClue } from './overlay.js';
import { display, pixelZoom } from './display.js';
import { LOOKS } from '../art/palettes.js';
import { Painter, hexNum, flat } from '../art/painter.js';
import { SatelliteStrike } from '../art/strike.js';
import { Bubbles } from './bubbles.js';
import { reviewKeys, syncImmunity, offerNote } from './review.js';
import { beginDeath, skipDeath, startTakes, showStatus, retryData, checkpointOf, setCheckpoint, tapeTake } from './death.js';
import { itemPanel } from './panels.js';
import { bodyLines } from '../data/dialogue.js';
import { fx } from './fx.js';
import { cg } from '../ui/cg.js';

export const T = 16;
export const LOCK_TD = 0.5;
// she carries five pebbles at most (Michael, Nov 18 playtest)
export const MAX_PEBBLES = 5;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// the girl from above: hair, face or back, a scarf band, coat, feet (8 x 11)
const TD_GIRL = {
  down: ['..hhhh..', '.hhhhhh.', '.hkkkkh.', '..kkkk..', '.ssssss.', 'kkkkkkkk', '.kkkkkk.', '.kkkkkk.', '..kkkk..'],
  up: ['..hhhh..', '.hhhhhh.', '.hhhhhh.', '..hhhh..', '.ssssss.', 'kkkkkkkk', '.kkkkkk.', '.kkkkkk.', '..kkkk..'],
  side: ['..hhhh..', '.hhhhh..', '.kkhhh..', '.kkkh...', '..sss...', '.kkkkk..', '.kkkkkk.', '..kkkk..', '..kkk...']
};
const FEET = { a: ['..k..k..', '..s..s..'], b: ['.k....k.', '.s....s.'], c: ['...kk...', '...ss...'] };

export function makeTopSprites(scene, P) {
  const map = { h: P.hair, k: P.kid, s: P.kidLo };
  const rows = (p, list, oy) => list.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') p.px(i, oy + j, map[r[i]]); });
  const add = (key, w, h, draw) => { const p = new Painter(w, h); draw(p); p.toTexture(scene, key); };
  ['down', 'up', 'side'].forEach(d => ['a', 'b'].forEach(f => add('td_' + d + '_' + f, 8, 11, p => { rows(p, TD_GIRL[d], 0); rows(p, d === 'side' ? (f === 'a' ? FEET.c : ['..k.k...', '..s.s...']) : FEET[f], 9); })));
  add('td_pebble', 3, 3, p => { p.rect(0, 1, 3, 1, P.rubbleHi); p.rect(1, 0, 1, 3, P.rubbleHi); p.px(1, 1, P.colHi); });
  add('td_shadow', 5, 2, p => p.rect(0, 0, 5, 2, P.void));
}

// ------------------------------------------------------------------ hard pixel light (shared with ep4)
// A dotted circle of single pixels (every `step` along the edge), drawn with plain rects so it
// stays on the pixel grid at any zoom.
export function pxCircle(g, cx, cy, r, color, step) {
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r); g.fillStyle(color, 1);
  let x = r, y = 0, e = 1 - r, i = 0;
  const put = (a, b) => g.fillRect(cx + a, cy + b, 1, 1);
  while (x >= y) {
    if (!step || i % step === 0) { put(x, y); put(-x, y); put(x, -y); put(-x, -y); put(y, x); put(-y, x); put(y, -x); put(-y, -x); }
    i++; y++; if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1; }
  }
}
// The dark layer: a canvas filled with solid black, then holes cut where light falls. No alpha
// anywhere (ART_DIRECTION section 2): a pixel is dark, half lit (checker), or lit.
export function darkFill(ctx) {
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
const checkers = new WeakMap();
// a 2 x 2 checker pattern for this canvas, lined up with the world (parity = (view x + view y) % 2)
export function checker(ctx, parity) {
  let pat = checkers.get(ctx);
  if (!pat) { const t = document.createElement('canvas'); t.width = 2; t.height = 2; const x = t.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1); pat = ctx.createPattern(t, 'repeat'); checkers.set(ctx, pat); }
  if (pat.setTransform) pat.setTransform(new DOMMatrix([1, 0, 0, 1, ((parity % 2) + 2) % 2, 0]));
  return pat;
}
// Cut lights out of the dark: each light { x, y, r, a } (canvas px). A strong light (a >= 0.75,
// the default) clears a solid disc of 60% of its radius and a checker ring out to its full
// radius; a weak one is only the checker, out to 80% of its radius. Rows of rects, edges hard.
export function hardHoles(ctx, lights, parity) {
  const W = ctx.canvas.width, H = ctx.canvas.height, pat = checker(ctx, parity);
  ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 1;
  lights.forEach(l => {
    const strong = l.a == null || l.a >= 0.75, r = Math.round(strong ? l.r : l.r * 0.8), ri = strong ? Math.round(l.r * 0.6) : -1, x = Math.round(l.x), y = Math.round(l.y);
    if (r <= 0 || x < -r || y < -r || x > W + r || y > H + r) return;
    for (let dy = -r; dy <= r; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      const ho = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35), hi = ri >= 0 && Math.abs(dy) <= ri ? Math.floor(Math.sqrt(ri * ri - dy * dy) + 0.35) : -1;
      if (hi >= 0) { ctx.fillStyle = '#000'; ctx.fillRect(x - hi, yy, 2 * hi + 1, 1); ctx.fillStyle = pat; ctx.fillRect(x - ho, yy, ho - hi, 1); ctx.fillRect(x + hi + 1, yy, ho - hi, 1); }
      else { ctx.fillStyle = pat; ctx.fillRect(x - ho, yy, 2 * ho + 1, 1); }
    }
  });
  ctx.globalCompositeOperation = 'source-over';
}

export class TopDownEpisode extends Phaser.Scene {
  // level: { W, H, solid(x, y), start: [tx, ty] }
  initTop(id, level) {
    syncImmunity();
    this.P = LOOKS[state.look];
    this.epId = id; this.ep = state.episode(id);
    this.level = level;
    this.ctl = makeControls(this);
    this.clock = 0; this.dead = false; this.leaving = false; this.done = false;
    this.noises = []; this.flight = null; this.pebbles = 0; this.things = []; this.nearThing = null; this.sources = []; this.satX = null; this.floorPebbles = [];
    this.lights = []; this.par = [];
    this.scale.on('rescale', this.onRescale, this);
    this.events.once('shutdown', () => { this.scale.off('rescale', this.onRescale, this); cg.lives(null); });
    startTakes(this); showStatus(this, null);
  }
  onRescale() { this.cameras.main.setZoom(pixelZoom()); this.place(); }
  place() { const S = display.S; this.par.forEach(e => e.o.setScrollFactor(0).setPosition(e.x + 160 * (S - 1), e.y + 90 * (S - 1))); }
  hudLayer(depth) { const g = this.add.graphics().setDepth(depth); this.par.push({ o: g, x: 0, y: 0 }); this.place(); return g; }

  setupView(bg) {
    const cam = this.cameras.main;
    cam.setZoom(pixelZoom()); cam.setRoundPixels(true); cam.setBackgroundColor(hexNum(bg));
    this.view = { x: 0, y: 0 };
    // darkness: a small canvas redrawn each frame, with holes cut where there is light
    this.darkCanvas = document.createElement('canvas'); this.darkCanvas.width = 322; this.darkCanvas.height = 182;
    if (this.textures.exists('td_dark')) this.textures.remove('td_dark');
    this.darkTex = this.textures.addCanvas('td_dark', this.darkCanvas);
    this.darkImg = this.add.image(0, 0, 'td_dark').setOrigin(0).setDepth(5.5);
    this.bodyLayer = this.add.layer().setDepth(2);
    this.girl = this.add.image(0, 0, 'td_down_a').setOrigin(0.5, 1).setDepth(4);
    this.pebbleImg = this.add.image(0, 0, 'td_pebble').setDepth(7).setVisible(false);
    this.overG = this.add.graphics().setDepth(6.5);           // cones, noise rings, lights over the dark
    this.ledG = this.add.graphics().setDepth(7);
    this.fxG = this.add.graphics().setDepth(7.5);
    this.strikeFx = new SatelliteStrike(this, { depth: 8 });
    this.bubbles = new Bubbles(this, 9);
    this.bubbles.player = () => this.kid ? this.kidPx() : null;
    this.bubbles.bodies = () => { if (!this.kid) return []; const c = this.kidPx(); return [{ x0: c.x - 5, x1: c.x + 5, y0: c.y - 11, y1: c.y + 4 }]; };
  }

  // ------------------------------------------------------------------ the girl
  // A retry after the episode set a checkpoint (death.js setCheckpoint) starts there: { tx, ty }.
  spawn() {
    const cp = checkpointOf(this), [sx, sy] = cp && cp.tx != null ? [cp.tx, cp.ty] : this.level.start;
    this.kid = { tx: sx, ty: sy, fx: sx, fy: sy, p: 1, moving: false, face: 'down', step: 0 };
    this.dead = false;
    this.girl.setVisible(true);
    const c = this.kidPx(); this.camX = c.x; this.camY = c.y;
  }
  kidPx() { const k = this.kid; return { x: (k.fx + (k.tx - k.fx) * k.p) * T + 8, y: (k.fy + (k.ty - k.fy) * k.p) * T + 8 }; }
  tileOf() { const k = this.kid; return k.moving && k.p < 0.5 ? { x: k.fx, y: k.fy } : { x: k.tx, y: k.ty }; }
  blocked(x, y) { return x < 0 || y < 0 || x >= this.level.W || y >= this.level.H || this.level.solid(x, y); }
  seeThrough(x, y) { return !(x < 0 || y < 0 || x >= this.level.W || y >= this.level.H) && !this.level.opaque(x, y); }
  // line of sight between tile centers, sampled finely, so pillars cast real shadows
  los(x0, y0, x1, y1) {
    const ax = x0 + 0.5, ay = y0 + 0.5, bx = x1 + 0.5, by = y1 + 0.5, n = Math.ceil(Math.hypot(bx - ax, by - ay) * 4);
    for (let i = 1; i < n; i++) { const u = i / n, tx = Math.floor(ax + (bx - ax) * u), ty = Math.floor(ay + (by - ay) * u); if ((tx !== x0 || ty !== y0) && (tx !== x1 || ty !== y1) && !this.seeThrough(tx, ty)) return false; }
    return true;
  }
  moveKid(dt) {
    const k = this.kid, c = this.ctl, running = c.run();
    if (k.moving) {
      k.p += dt * (running ? 8.5 : 5.2);
      if (k.p >= 1) { k.p = 1; k.moving = false; this.arrive(running); }
    }
    if (!k.moving) {
      let d = null;
      if (c.left()) d = 'left'; else if (c.right()) d = 'right'; else if (c.up()) d = 'up'; else if (c.down()) d = 'down';
      if (d) {
        k.face = d;
        const [dx, dy] = DIRS[d];
        if (!this.blocked(k.tx + dx, k.ty + dy)) { k.fx = k.tx; k.fy = k.ty; k.tx += dx; k.ty += dy; k.p = 0; k.moving = true; k.step++; }
        else if (this.onBump) this.onBump(k.tx + dx, k.ty + dy); // a scene can make walking into something hurt
      }
    }
  }
  // each tile she reaches: running is loud, debris is loud
  arrive(running) {
    const k = this.kid, loud = this.level.noisy(k.tx, k.ty);
    if (running || loud) this.noise(k.tx, k.ty, running && loud ? 5 : running ? 4 : 3, running ? 'run' : 'debris');
    if (loud) Sound.noise(0.06, running ? 0.06 : 0.035, 2600); else if (running) Sound.tone(90, 0.04, 'triangle', 0.02);
    if (this.onArrive) this.onArrive(k.tx, k.ty);
  }
  noise(x, y, r, kind) { this.noises.push({ x, y, r, kind, t: 0 }); if (this.onNoise) this.onNoise(x, y, r, kind); }

  // ------------------------------------------------------------------ pebbles
  throwAhead() {
    const k = this.kid, [dx, dy] = DIRS[k.face]; let x = k.tx, y = k.ty;
    for (let i = 0; i < 4; i++) { if (this.blocked(x + dx, y + dy)) break; x += dx; y += dy; }
    this.throwTo(x, y);
  }
  throwTo(x, y) {
    const k = this.kid;
    if (this.flight || this.dead) return;
    if (this.pebbles <= 0 || (x === k.tx && y === k.ty) || this.blocked(x, y) || Math.hypot(x - k.tx, y - k.ty) > 5.5 || !this.los(k.tx, k.ty, x, y)) { Sound.tone(150, 0.06, 'square', 0.02); return; }
    this.pebbles--;
    const dist = Math.hypot(x - k.tx, y - k.ty);
    this.flight = { sx: k.tx, sy: k.ty, ex: x, ey: y, t: 0, dur: 0.25 + dist * 0.05 };
    Sound.tone(700, 0.04, 'square', 0.015);
  }
  updateFlight(dt) {
    const f = this.flight; if (!f) { this.pebbleImg.setVisible(false); return; }
    f.t += dt; const u = Math.min(1, f.t / f.dur);
    const gx = (f.sx + (f.ex - f.sx) * u) * T + 8, gy = (f.sy + (f.ey - f.sy) * u) * T + 8, z = 4 * 12 * u * (1 - u);
    this.pebbleImg.setVisible(true).setPosition(Math.round(gx), Math.round(gy - z));
    if (u >= 1) {
      this.flight = null; Sound.tone(1600, 0.03, 'square', 0.02); Sound.noise(0.08, 0.05, 4000);
      // it stays where it lands; E picks it up again
      const fp = { x: f.ex, y: f.ey, dx: Math.round((Math.random() - 0.5) * 6), dy: Math.round((Math.random() - 0.5) * 6) };
      fp.thing = { tx: f.ex, ty: f.ey, reach: 1, label: 'J', use: () => this.pickPebble(fp) };
      this.floorPebbles.push(fp); this.things.push(fp.thing);
      this.noise(f.ex, f.ey, 4, 'pebble');
    }
  }

  pickPebble(fp) {
    if (this.pebbles >= MAX_PEBBLES) { Sound.tone(220, 0.06, 'triangle', 0.015); if (this.pocketsFull) this.pocketsFull(fp.x, fp.y); return; } // pockets full: it stays
    this.floorPebbles = this.floorPebbles.filter(q => q !== fp); fp.thing.off = true;
    this.pebbles++; Sound.tone(500, 0.06, 'triangle', 0.02);
  }
  // the satellite answers a noise it can see by shooting at it: a pebble on the floor
  strikeAt(fp) {
    if (this.strikeFx.busy || this.dead) return false;
    const x = fp.x * T + 8 + fp.dx, y = fp.y * T + 8 + fp.dy;
    this.strikeFx.fire({ view: { x: this.view.x, y: this.view.y, width: 320, height: 180 }, tx: x, ty: y, P: this.P, small: true, onImpact: () => {
      this.floorPebbles = this.floorPebbles.filter(q => q !== fp); if (fp.thing) fp.thing.off = true;
      this.scorches = (this.scorches || []).concat([{ x, y, t: 0 }]);
      Sound.tone(1400, 0.1, 'sawtooth', 0.03, 300); Sound.noise(0.25, 0.1); fx.shake(this.cameras.main, 90, 0.004);
    } });
    return true;
  }
  drawFloorPebbles(g, dt) {
    this.floorPebbles.forEach(fp => { const x = fp.x * T + 8 + fp.dx, y = fp.y * T + 8 + fp.dy; g.fillStyle(hexNum(this.P.rubbleHi), 1); g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); g.fillStyle(hexNum(this.P.colHi), 1); g.fillRect(x, y, 1, 1); });
    this.scorches = (this.scorches || []).filter(s => (s.t += dt) < 6);
    this.scorches.forEach(s => { g.fillStyle(0x0e0f12, 1); g.fillRect(s.x - 2, s.y - 1, 5, 3); g.fillRect(s.x - 1, s.y - 2, 3, 5); if (s.t < 1.5) { g.fillStyle(hexNum(this.P.hazard), 1); g.fillRect(s.x, s.y, 1, 1); } });
  }

  // Tests set window.__noDeath to walk past everything. Immunity never hides her from a hazard:
  // the hazard plays and core/death.js decides what the death costs (in immune mode, nothing).
  // (Builds where immunity also set __noDeath left the east wing's lasers doing nothing.)
  shielded() { return !!window.__noDeath && !state.immune; }

  // ------------------------------------------------------------------ cones and the lock
  // tiles a viewer at (cx, cy) in tile units sees, facing `angle` degrees
  coneTiles(cx, cy, angle, half, range) {
    const out = new Set(), x0 = Math.floor(cx), y0 = Math.floor(cy);
    for (let ty = Math.max(0, Math.floor(cy - range)); ty <= Math.min(this.level.H - 1, Math.ceil(cy + range)); ty++) for (let tx = Math.max(0, Math.floor(cx - range)); tx <= Math.min(this.level.W - 1, Math.ceil(cx + range)); tx++) {
      if (!this.seeThrough(tx, ty)) continue;
      const dx = tx + 0.5 - cx, dy = ty + 0.5 - cy, d = Math.hypot(dx, dy);
      if (d > range || d < 0.3) continue;
      const diff = ((Math.atan2(dy, dx) * 180 / Math.PI - angle) % 360 + 540) % 360 - 180;
      if (Math.abs(diff) > half) continue;
      if (!this.losFrom(cx, cy, tx, ty)) continue;
      out.add(ty * this.level.W + tx);
    }
    return out;
  }
  losFrom(cx, cy, x1, y1) {
    const bx = x1 + 0.5, by = y1 + 0.5, n = Math.ceil(Math.hypot(bx - cx, by - cy) * 4), sx = Math.floor(cx), sy = Math.floor(cy);
    for (let i = 1; i < n; i++) { const u = i / n, tx = Math.floor(cx + (bx - cx) * u), ty = Math.floor(cy + (by - cy) * u); if ((tx !== sx || ty !== sy) && (tx !== x1 || ty !== y1) && !this.seeThrough(tx, ty)) return false; }
    return true;
  }
  // a source: { tiles: Set, lock, id, x, y (px) }. Inside its tiles, lock builds; outside it fades.
  watchTiles(src, dt, limit) {
    if (this.dead || this.leaving) { src.lock = Math.max(0, src.lock - dt * 3); return; }
    const o = this.tileOf(), seen = !this.shielded() && src.tiles && src.tiles.has(o.y * this.level.W + o.x);
    if (seen) { if (src.lock === 0) Sound.charge(); src.lock += dt; if (src.lock >= (limit || LOCK_TD)) this.die(src); }
    else src.lock = Math.max(0, src.lock - dt * 2);
  }

  // ------------------------------------------------------------------ death: the strike from orbit
  die(src) {
    if (this.dead) return;
    this.dead = true;
    const p = this.kidPx(), P = this.P, tile = this.tileOf();
    const impact = quiet => {
      this.girl.setVisible(false);
      if (!quiet) {
        this.fxBurst = { x: p.x, y: p.y, t: 0 };
        fx.flash(this.cameras.main, 110, 70, 18, 18); // the kick and the hit-stop: death.js
        Sound.tone(1400, 0.12, 'sawtooth', 0.04, 300); Sound.noise(0.4, 0.16);
      }
      state.addBody(this.epId, tile.x * T + 8, tile.y * T + 13, src && src.id);
    };
    beginDeath(this, src, impact, (onImpact, o) => this.strikeFx.fire({ view: { x: this.view.x, y: this.view.y, width: 320, height: 180 }, tx: p.x, ty: p.y - 3, P, onImpact, from: this.satX, short: o && o.short }));
  }
  // a restart by choice (R, or the pause menu): the next take, no body
  // a checkpoint for this visit: deaths and retries start here until she runs out of lives.
  // at: { tx, ty } (a tile), or null to clear it
  markCheckpoint(at) { setCheckpoint(this, at); }
  canRestart() { return !this.dead && !this.leaving && !this.done; }
  restartTake() { if (!this.canRestart()) return false; this.dead = true; this.ep.take++; this.cameras.main.fadeOut(140, 0, 0, 0); this.time.delayedCall(150, () => this.scene.restart(retryData(this))); return true; }
  skipDeath() { return skipDeath(this); }
  // her bodies from earlier takes; each one can be looked at with E
  drawBodies() {
    this.bodyLayer.removeAll(true);
    this.things = this.things.filter(t => !t.body);
    this.ep.bodies.forEach(b => {
      const age = Math.max(0, Math.min(3, this.ep.take - 1 - b.take));
      this.bodyLayer.add(this.add.image(b.x, b.y, 'body' + age).setOrigin(0.5, 1));
      this.addLook({ tx: Math.floor(b.x / T), ty: Math.floor((b.y - 13) / T), lines: bodyLines(b, age), body: true, clue: 'ownBody' });
    });
  }
  // Things she looks at with E: narration at the foot of the screen. spec: { tx, ty, lines, reach }
  addLook(spec) {
    const src = { lines: spec.lines }, th = { tx: spec.tx, ty: spec.ty, reach: spec.reach || 1, label: 'J', look: true, body: !!spec.body, src, clue: spec.clue };
    th.use = () => { if (th.clue) noteClue(th.clue); this.bubbles.look('item', src, () => ({ x: th.tx * T + 8, y: th.ty * T })); };
    this.things.push(th); return th;
  }
  takeNote(data, num, title) {
    if (data && data.fromCut) this.time.delayedCall(700, () => { overlay.card('EPISODE ' + num, title, 3600, 'lower'); overlay.bug('CH 07', 3600); });
    tapeTake(this); // TAKE n on the floor where she starts (no card)
    offerNote(this);
  }

  // ------------------------------------------------------------------ things, the camera, the dark
  updateThings() {
    this.nearThing = null;
    if (this.dead || this.leaving || this.done || this.kid.moving) return;
    const k = this.kid, near = this.things.filter(t => !t.off && (t.reach === 2 ? Math.max(Math.abs(t.tx - k.tx), Math.abs(t.ty - k.ty)) <= 1 || Math.abs(t.tx - k.tx) + Math.abs(t.ty - k.ty) <= 2 : Math.abs(t.tx - k.tx) + Math.abs(t.ty - k.ty) <= (t.reach || 1)));
    // things to use come before things to look at
    this.nearThing = near.sort((a, b) => (a.look ? 1 : 0) - (b.look ? 1 : 0))[0] || null;
    if (this.nearThing && !this.nearThing.hold && this.ctl.interact()) this.nearThing.use();
  }
  // A side room behind an optional door, as in the side-view episodes: this scene sleeps and
  // wakes where she left it.
  itemPanel(kind) { return itemPanel(this, kind); }
  reviewKeys() { return reviewKeys(this); }
  // review: put her on a tile
  placeTile(x, y) { const k = this.kid; k.tx = k.fx = x; k.ty = k.fy = y; k.p = 1; k.moving = false; this.camX = x * T + 8; this.camY = y * T + 8; }
  enterRoom(id) {
    if (this.leaving || this.dead) return;
    this.leaving = true;
    Sound.tone(300, 0.08, 'triangle', 0.02); this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => {
      this.leaving = false;
      Object.values(this.beds || {}).forEach(b => b.set(0.0001, 0.3));
      this.events.once('wake', () => { this.ctl.endFrame(); this.cameras.main.fadeIn(300); window.__game = { scene: this, state }; if (this.onWake) this.onWake(); });
      this.scene.launch('room', { id, from: this.scene.key, take: this.ep.take });
      this.scene.sleep();
    });
  }
  follow() {
    const c = this.kidPx(), W = this.level.W * T, H = this.level.H * T;
    this.camX += (c.x - this.camX) * 0.2; this.camY += (c.y - this.camY) * 0.2;
    const cx = Math.round(Math.max(160, Math.min(W - 160, this.camX))), cy = Math.round(Math.max(90, Math.min(H - 90, this.camY)));
    this.cameras.main.centerOn(cx, cy);
    this.view = { x: cx - 160, y: cy - 90 };
  }
  // lights: { x, y, r, a } in world px; the girl always carries a small one. Hard light (Nov 17
  // art pass): a solid hole, then a ring of checker dither, nothing soft, no alpha.
  drawDark() {
    const ctx = this.darkCanvas.getContext('2d'), v = this.view;
    darkFill(ctx);
    const c = this.kidPx(), all = this.dead ? this.lights : [{ x: c.x, y: c.y - 4, r: 52 }].concat(this.lights);
    hardHoles(ctx, all.map(l => ({ x: l.x - v.x + 1, y: l.y - v.y + 1, r: l.r, a: l.a })), v.x + v.y);
    this.darkTex.refresh();
    this.darkImg.setPosition(v.x - 1, v.y - 1);
  }
  drawGirl() {
    const k = this.kid, c = this.kidPx(), f = k.moving ? (k.step % 2 ? 'b' : 'a') : 'a';
    const d = k.face === 'left' || k.face === 'right' ? 'side' : k.face;
    this.girl.setTexture('td_' + d + '_' + f).setPosition(Math.round(c.x), Math.round(c.y + 4)).setFlipX(k.face === 'left');
  }
  drawNoise(g, dt) {
    this.noises.forEach(n => n.t += dt); this.noises = this.noises.filter(n => n.t < 0.7);
    // a noise is a dotted ring that steps outward and pops off: pixels, no fade
    this.noises.forEach(n => { const u = n.t / 0.7; pxCircle(g, n.x * T + 8, n.y * T + 8, Math.round((4 + u * n.r * T) / 4) * 4, u < 0.5 ? 0xebe6d8 : 0xb8b2a3, 3); });
  }
  // the satellite slides in at the top of the view while anything locks on
  drawSatellite(g, glowG) {
    const v = this.view, locking = Math.max(0, ...this.sources.map(s => s.lock / (s.limit || LOCK_TD)));
    if (locking > 0 && !this.dead) {
      const kx = this.kidPx().x, want = kx < v.x + 160 ? v.x + 230 : v.x + 90;
      this.satX = this.satX == null ? (kx < v.x + 160 ? v.x + 328 : v.x - 8) : this.satX + (want - this.satX) * 0.25;
      SatelliteStrike.drawSat(g, this.P, this.satX, v.y + 3, glowG, Math.floor(this.clock * 14) % 2 ? locking : 0.2);
      const c = this.kidPx(), r = 9 - locking * 7; g.lineStyle(1, hexNum(this.P.hazard), 1); g.strokeRect(Math.round(c.x - 4 - r), Math.round(c.y - 6 - r), Math.round(8 + 2 * r), Math.round(10 + 2 * r));
    } else if (!this.dead) this.satX = null;
  }
}
