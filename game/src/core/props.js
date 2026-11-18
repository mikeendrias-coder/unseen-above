// Physics props for side-view episodes (Nov 17 final pass). Small, pixel-snapped, no physics
// engine: every prop owns one or two rectangles in scene.props, so the girl's own collision
// (core/side.js boxHits), the lights' cones (cone() stops at solid props) and landings all see
// them with no other changes.
//
//   import { Props } from '../core/props.js';
//   // in create(), after this.props is set and after commonLayers():
//   this.dyn = new Props(this, { depth: 3.6 });
//   this.dyn.crate({ x, y, w: 16, h: 24 });              // top-left; falls, is pushed, blocks light
//   this.dyn.mover({ x, y, w: 32, h: 6, path: [{ x, y }, { x, y: y - 96 }], speed: 28, pause: 0.8, roof: 26 });
//   this.dyn.crumble({ x, y, w: 32, h: 8, delay: 0.4, back: 3 }); // drops a moment after she lands
//   this.dyn.swing({ x, y, len: 90, amp: 38, period: 3.2, phase: 0 }); // anchor; she grabs the end
//   // in update(), instead of this.moveKid(dt):
//   this.dyn.step(dt, () => this.moveKid(dt));
//   // in draw():
//   this.dyn.draw();
//
// Every spec also takes id (for death captions and tests) and draw(g, prop, P) to paint it
// yourself. Crate: push by walking into it on the ground (slower than walking); it falls when
// pushed off an edge and hurts her for 1 if it lands on her. Mover: a platform that follows its
// path back and forth (loop: true goes round), carries her, and with roof: n has a canopy n px
// above it (the canopy is solid, so it shades her from lights overhead). Crumble: shakes for
// delay s after she stands on it, then drops; back: s later it is there again (0: never).
// Swing: a chandelier or rope on a fixed swing; touching its end in the air, she holds on;
// Space lets go with the swing's speed plus a jump, S drops straight off.
// Furniture (Nov 18, Michael: "there should be physics and interactivity with them"):
//   const t = this.dyn.piece({ kind: 'table', x, y: floorY, w: 28, tone: 'wood', id: 'work table' });
//   this.dyn.item({ kind: 'mug', x, y: t.y });                 // a loose thing on its top
// Kinds (FURN below): table, chair, stool, bin, lamp, crate, box, trunk, bench. She pushes one by
// walking into it, upright or lying down (heavier is slower; a table carries what is on it, and
// loose things and boxes on top lag and slide off the edge). A piece pushed into another pushes
// that one too. Walking into a lamp knocks it over (three frame swaps, no rotation); K (or F)
// next to a chair, stool, bin or lamp knocks it over or stands it back up, shoves a box (off a
// shelf, say), bumps a heavy thing (what is on top wobbles and slides) or flicks a loose thing
// off. A jump that bumps her head on a shelf or a piece from below makes what is on it jump
// toward the nearer end (a few bumps and it falls off). She can stand and climb on all of them
// (they are rects in scene.props, so lights stop at them too). Pieces fall, land on tiles or each
// other, and never move into a wall, another piece (its whole box, so nothing slides under a
// table) or her. Loose things (item) fall, bounce, break if fragile (a fall of about 7 px or
// more: off any table), and get kicked when she walks into them; they are never solid to her. spec.onLand(piece, speed) runs when a piece lands hard;
// spec.thing (a look) follows the piece. tone: wood, grey, gold, bone (the three tones it uses).
// hardCone(g, cone points, color, view) draws a light the final-pass way: a 50% checker of one
// flat color, its two edges solid (no alpha, no blending, no hatched rows).
import { Sound } from './sound.js';
import { K } from './side.js';
import { hexNum } from '../art/painter.js';
import { ASH } from '../art/palettes.js';
import { state } from './state.js';
import { checkpointOf } from './death.js';
import { NOTICE } from '../data/dialogue.js';

const GRAV = 690, MAXF = 260;
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const C = k => hexNum(ASH[k]);

export class Props {
  constructor(scene, opts) {
    this.scene = scene; this.list = []; this.riding = null; this.letGo = 0; this.lastSwing = null; this.t = 0;
    this.opts = opts || {}; this.pieces = []; this.items = []; this.swingT = 0; this.preVx = 0; this.preVy = 0; this.preAir = false;
    const d = this.opts.depth || 3.6;
    this.lightG = scene.add.graphics().setDepth(d - 0.05); // lamps' light, under the furniture
    this.g = scene.add.graphics().setDepth(d);
  }
  own(r) { this.scene.props.push(r); return r; }
  // is this box clear of tiles, other props (not skip) and, if asked, her
  free(x, y, w, h, skip, kidToo) {
    const s = this.scene, T = 16;
    const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (s.solidTile(tx, ty)) return false;
    const box = { x, y, w, h };
    if (s.props.some(r => r !== skip && r !== (skip && skip.roofOf) && r.solid !== false && overlap(box, r))) return false;
    if (kidToo && s.kid && !s.dead && overlap(box, s.kid)) return false;
    return true;
  }

  // ------------------------------------------------------------------ makers
  crate(spec) {
    const r = this.own({ id: spec.id || 'crate', x: spec.x, y: spec.y, w: spec.w || 16, h: spec.h || 16, kind: 'crate' });
    const p = Object.assign({ kind: 'crate', fx: spec.x, fy: spec.y, vy: 0, grounded: false, push: spec.push || 30, r }, spec);
    this.list.push(p); return p;
  }
  mover(spec) {
    const w = spec.w || 32, h = spec.h || 6, path = spec.path || [{ x: spec.x, y: spec.y }];
    const r = this.own({ id: spec.id || 'platform', x: path[0].x, y: path[0].y, w, h, kind: 'mover' });
    const p = Object.assign({ kind: 'mover', path, speed: 30, pause: 0.6, seg: 0, u: 0, dir: 1, wait: spec.wait || 0, r }, spec);
    if (spec.roof) { p.roofR = this.own({ id: (spec.id || 'platform') + ' roof', x: r.x - 2, y: r.y - spec.roof - 3, w: w + 4, h: 3, kind: 'roof' }); r.roofOf = p.roofR; p.roofR.roofOf = r; }
    this.list.push(p); return p;
  }
  crumble(spec) {
    const r = this.own({ id: spec.id || 'slab', x: spec.x, y: spec.y, w: spec.w || 16, h: spec.h || 8, kind: 'crumble' });
    const p = Object.assign({ kind: 'crumble', delay: 0.4, back: 3, state: 'solid', t: 0, dy: 0, vy: 0, r }, spec);
    this.list.push(p); return p;
  }
  swing(spec) {
    const p = Object.assign({ kind: 'swing', len: 80, amp: 35, period: 3, phase: 0, id: 'swing' }, spec);
    p.ax = spec.x; p.ay = spec.y; this.place(p, 0);
    this.list.push(p); return p;
  }

  // ------------------------------------------------------------------ per frame
  // The whole frame for her: props move, then she moves (unless she hangs on a swing), then
  // what she stands on reacts.
  step(dt, move) {
    const k = this.scene.kid; if (k) { this.preVx = k.vx; this.preVy = k.vy; this.preAir = !k.onGround; }
    this.update(dt); if (!this.riding) move(); this.after(dt);
  }
  update(dt) {
    this.t += dt; this.letGo = Math.max(0, this.letGo - dt);
    const s = this.scene, k = s.kid;
    this.list.forEach(p => {
      if (p.kind === 'mover') this.moveMover(p, dt, k);
      else if (p.kind === 'crate') this.moveCrate(p, dt, k);
      else if (p.kind === 'swing') this.place(p, dt);
      else if (p.kind === 'crumble') this.tickCrumble(p, dt, k);
    });
    if (this.riding) this.ride(dt, k);
    if (this.pieces.length || this.items.length) this.updateFurniture(dt, k);
  }
  after(dt) {
    const s = this.scene, k = s.kid; if (!k || s.dead) { this.riding = null; return; }
    if (this.pieces.length || this.items.length) this.afterFurniture(dt || 0, k);
    this.list.forEach(p => {
      if (p.kind === 'crumble' && p.state === 'solid' && this.standsOn(k, p.r)) { p.state = 'shake'; p.t = 0; Sound.noise(0.18, 0.04, 700); Sound.tone(140, 0.12, 'triangle', 0.02, 110); }
      if (p.kind === 'swing' && !this.riding && !(this.letGo && p === this.lastSwing) && !k.onGround && !s.leaving) {
        const g = { x: p.ex - 7, y: p.ey - 6, w: 14, h: 18 };
        if (overlap(g, k)) { this.riding = p; Sound.tone(520, 0.05, 'square', 0.015, 700); }
      }
    });
  }
  standsOn(k, r) { return k.onGround && r.solid !== false && Math.abs(k.y + k.h - r.y) < 1.5 && k.x + k.w > r.x && k.x < r.x + r.w; }

  moveMover(p, dt, k) {
    const r = p.r, s = this.scene;
    const onRoof = !!(k && !s.dead && p.roofR && this.standsOn(k, p.roofR)), on = onRoof || !!(k && !s.dead && this.standsOn(k, r));
    // where it goes this frame
    let nx = r.x, ny = r.y;
    if (p.wait > 0) p.wait -= dt;
    else if (p.path.length > 1) {
      const a = p.path[p.seg], b = p.path[p.seg + p.dir] || p.path[(p.seg + p.dir + p.path.length) % p.path.length];
      const len = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      p.u += p.speed * dt / len;
      if (p.u >= 1) {
        p.u = 0; p.seg += p.dir; p.wait = p.pause;
        if (p.loop) p.seg = (p.seg + p.path.length) % p.path.length;
        else if (p.seg <= 0 || p.seg >= p.path.length - 1) { p.seg = Math.max(0, Math.min(p.path.length - 1, p.seg)); p.dir = p.seg === 0 ? 1 : -1; }
        nx = b.x; ny = b.y;
      } else { nx = a.x + (b.x - a.x) * p.u; ny = a.y + (b.y - a.y) * p.u; }
    }
    nx = Math.round(nx); ny = Math.round(ny);
    const dx = nx - r.x, dy = ny - r.y;
    if (!dx && !dy) return;
    r.x = nx; r.y = ny;
    if (p.roofR) { p.roofR.x = nx - 2; p.roofR.y = ny - p.roof - 3; }
    if (!k || s.dead) return;
    if (on) {
      // carry her: across if there is room, and up or down with the floor under her
      const step = Math.sign(dx); for (let i = 0; i < Math.abs(dx); i++) if (!s.boxHits(k.x + step, k.y, k.w, k.h)) k.x += step;
      const want = (onRoof ? p.roofR.y : r.y) - k.h;
      if (!s.boxHits(k.x, want, k.w, k.h) || want > k.y) k.y = want; else if (dy < 0) s.hurt(1, p.id + ' crush');
    } else if (overlap(r, k) || (p.roofR && overlap(p.roofR, k))) {
      // it moved into her: rising, it lifts her; otherwise it shoves her aside
      if (dy < 0 && k.y + k.h - r.y < 6) k.y = r.y - k.h;
      else { const step = dx > 0 ? 1 : -1; for (let i = 0; i < 6 && (overlap(r, k) || (p.roofR && overlap(p.roofR, k))); i++) if (!s.boxHits(k.x + step, k.y, k.w, k.h)) k.x += step; }
    }
  }

  moveCrate(p, dt, k) {
    const r = p.r, s = this.scene;
    // pushed: she walks into its side on the ground
    const c = s.ctl, dir = c && !s.dead && !s.leaving && !s.done ? (c.right() ? 1 : 0) - (c.left() ? 1 : 0) : 0;
    if (dir && p.grounded && k && k.onGround && k.y + k.h > r.y + 3 && k.y < r.y + r.h) {
      const touching = dir > 0 ? Math.abs(k.x + k.w - r.x) <= 1.01 : Math.abs(r.x + r.w - k.x) <= 1.01;
      if (touching) {
        p.acc = (p.acc || 0) + p.push * dt;
        while (p.acc >= 1) {
          p.acc -= 1;
          if (!this.free(r.x + dir, r.y, r.w, r.h, r, false)) { p.acc = 0; break; }
          r.x += dir; p.fx = r.x;
          if (!s.boxHits(k.x + dir, k.y, k.w, k.h)) k.x += dir;
          if ((r.x & 7) === 0) Sound.noise(0.05, 0.02, 500);
        }
        k.vx = dir * Math.min(Math.abs(k.vx), p.push);
      } else p.acc = 0;
    }
    // falls
    p.vy = Math.min(MAXF, p.vy + GRAV * dt); let dy = p.vy * dt, landed = false;
    while (dy > 0) {
      const st = Math.min(1, dy);
      if (!this.free(r.x, p.fy + st, r.w, r.h, r, false)) { landed = true; break; }
      if (k && !s.dead && overlap({ x: r.x, y: p.fy + st, w: r.w, h: r.h }, k)) {
        if (p.vy > 120) s.hurt(1, p.id);
        landed = true; break;
      }
      p.fy += st; dy -= st;
    }
    if (landed) { if (!p.grounded && p.vy > 160) { Sound.noise(0.2, 0.06, 600); } p.vy = 0; p.grounded = true; p.fy = Math.round(p.fy); }
    else p.grounded = false;
    r.y = Math.round(p.fy);
  }

  tickCrumble(p, dt, k) {
    const r = p.r; p.t += dt;
    if (p.state === 'shake' && p.t >= p.delay) { p.state = 'fall'; p.t = 0; r.solid = false; p.vy = 0; p.dy = 0; Sound.noise(0.3, 0.05, 1400); }
    else if (p.state === 'fall') { p.vy = Math.min(MAXF, p.vy + GRAV * dt); p.dy += p.vy * dt; if (p.t > 1.4) { p.state = 'gone'; p.t = 0; } }
    else if (p.state === 'gone' && p.back > 0 && p.t >= p.back && !(k && overlap(r, k))) { p.state = 'solid'; r.solid = true; p.dy = 0; }
  }

  // where a swing's end is now, and how fast it moves
  place(p, dt) {
    const w = Math.PI * 2 / p.period, ph = (this.t / p.period + p.phase) * Math.PI * 2;
    const th = p.amp * Math.PI / 180 * Math.sin(ph), om = p.amp * Math.PI / 180 * w * Math.cos(ph);
    p.th = th; p.ex = p.ax + p.len * Math.sin(th); p.ey = p.ay + p.len * Math.cos(th);
    p.vx = p.len * Math.cos(th) * om; p.vy = -p.len * Math.sin(th) * om;
    void dt;
  }
  ride(dt, k) {
    const s = this.scene, p = this.riding, c = s.ctl;
    if (!k || s.dead || s.leaving) { this.riding = null; return; }
    k.x = Math.round(p.ex - k.w / 2); k.y = Math.round(p.ey + 1); k.vx = 0; k.vy = 0; k.onGround = false;
    k.peakY = k.y; k.airJumps = 1; k.coyote = 0; k.buffer = 0; k.wall = 0;
    const dir = (c.right() ? 1 : 0) - (c.left() ? 1 : 0); if (dir) k.face = dir;
    const jump = c.jumpPressed(), drop = c.downP && c.downP();
    if (jump || drop) {
      this.riding = null; this.letGo = 0.3; this.lastSwing = p;
      k.vx = Math.max(-150, Math.min(150, p.vx)) + dir * 30; k.vy = Math.min(0, p.vy) - (jump ? K.jumpV * 0.8 : 0);
      if (jump) { k.holdT = K.hold * 0.6; Sound.tone(480, 0.07, 'square', 0.02, 720); }
    }
  }

  // ------------------------------------------------------------------ drawing
  draw() {
    const g = this.g, P = this.scene.P; g.clear();
    this.list.forEach(p => { if (p.draw) p.draw(g, p, P); else this['draw_' + p.kind](g, p); });
    if (this.pieces.length || this.items.length || this.swingT > 0) this.drawFurniture(g);
  }
  px(g, x, y, w, h, c) { g.fillStyle(c, 1); g.fillRect(Math.round(x), Math.round(y), w, h); }
  draw_crate(g, p) {
    const r = p.r;
    this.px(g, r.x - 1, r.y - 1, r.w + 2, r.h + 1, C('ash0'));
    this.px(g, r.x, r.y, r.w, r.h, C('bronzeHi'));
    this.px(g, r.x, r.y, r.w, 1, C('goldLo'));
    // a frame and an X brace
    this.px(g, r.x, r.y + 1, r.w, 2, C('bronze')); this.px(g, r.x, r.y + r.h - 3, r.w, 2, C('bronze'));
    this.px(g, r.x, r.y, 2, r.h, C('bronze')); this.px(g, r.x + r.w - 2, r.y, 2, r.h, C('bronze'));
    const n = Math.min(r.w, r.h) - 6; for (let i = 0; i < n; i++) { this.px(g, r.x + 3 + i * (r.w - 6) / n, r.y + 3 + i * (r.h - 6) / n, 1, 1, C('bronze')); this.px(g, r.x + r.w - 4 - i * (r.w - 6) / n, r.y + 3 + i * (r.h - 6) / n, 1, 1, C('bronze')); }
    this.px(g, r.x, r.y, r.w, 1, C('goldLo'));
  }
  draw_mover(g, p) {
    const r = p.r, top = p.cable != null ? p.cable : r.y - 60;
    [r.x + 2, r.x + r.w - 3].forEach(x => this.px(g, x, top, 1, Math.max(0, (p.roofR ? p.roofR.y : r.y) - top), C('ash4')));
    this.px(g, r.x - 1, r.y - 1, r.w + 2, r.h + 2, C('ash0'));
    this.px(g, r.x, r.y, r.w, r.h, C('ash3')); this.px(g, r.x, r.y, r.w, 1, C('boneLo'));
    if (p.roofR) {
      const q = p.roofR; this.px(g, q.x - 1, q.y - 1, q.w + 2, q.h + 2, C('ash0')); this.px(g, q.x, q.y, q.w, q.h, C('bronze')); this.px(g, q.x, q.y, q.w, 1, C('bronzeHi'));
      [r.x, r.x + r.w - 1].forEach(x => this.px(g, x, q.y + q.h, 1, r.y - q.y - q.h, C('ash3')));
    }
  }
  draw_crumble(g, p) {
    if (p.state === 'gone') return;
    const r = p.r, sx = p.state === 'shake' ? (Math.floor(p.t * 30) % 2 ? 1 : -1) : 0, y = r.y + (p.dy || 0);
    this.px(g, r.x + sx - 1, y - 1, r.w + 2, r.h + 2, C('ash0'));
    this.px(g, r.x + sx, y, r.w, r.h, C('ash5')); this.px(g, r.x + sx, y, r.w, 1, C('bone'));
    for (let x = r.x + 3; x < r.x + r.w - 2; x += 7) this.px(g, x + sx, y + 2, 1, r.h - 3, C('ash4'));
    if (p.state !== 'solid') for (let i = 0; i < 3; i++) this.px(g, r.x + 4 + i * 9 + sx, y + r.h + 1 + ((this.t * 40 + i * 5) % 6), 1, 1, C('ash5'));
  }
  draw_swing(g, p) {
    const n = Math.max(2, Math.round(p.len / 3));
    for (let i = 0; i <= n; i++) { const u = i / n; this.px(g, p.ax + (p.ex - p.ax) * u, p.ay + (p.ey - p.ay) * u, 1, 1, C(i % 2 ? 'goldLo' : 'gold')); }
    const x = Math.round(p.ex), y = Math.round(p.ey);
    this.px(g, x - 9, y - 1, 19, 4, C('ash0')); this.px(g, x - 8, y, 17, 2, C('gold')); this.px(g, x - 8, y, 17, 1, C('goldHi'));
    for (let i = -7; i <= 7; i += 3) { this.px(g, x + i, y - 4, 1, 3, C('bone')); this.px(g, x + i, y + 3, 1, 1, C('goldHi')); }
  }
}

// Draw a light's cone as hard light, the one rule for light in the whole game: a 50% checker of
// one flat tone, lined up with the world's pixels, with its two edges drawn solid (fill 'solid'
// lays every pixel instead, for thin beams in the sky). No alpha, no blending, no hatching
// (docs/ART_DIRECTION.md section 2). view (optional) clips it to what is on screen.
// Something solid just landed where she stands (a chandelier, a slab): move her out of rect r,
// toward side s (-1 left, 1 right) first, then the other way, then up on top of it, and give her
// a small knock that way. She is never left inside a solid thing, whatever HP or story mode did.
export function pushClear(scene, r, s, knock) {
  const k = scene.kid; if (!k) return;
  const inside = () => k.x < r.x + r.w && k.x + k.w > r.x && k.y < r.y + r.h && k.y + k.h > r.y;
  if (!inside() && !scene.boxHits(k.x, k.y, k.w, k.h)) return;
  const x0 = k.x, y0 = k.y, reach = r.w + k.w + 24;
  let side = 0;
  for (const dir of [s || 1, -(s || 1)]) {
    for (let d = 1; d <= reach; d++) if (!scene.boxHits(x0 + dir * d, y0, k.w, k.h)) { k.x = x0 + dir * d; side = dir; break; }
    if (side) break;
  }
  if (!side) { k.x = x0; k.y = r.y - k.h; for (let i = 0; i < 40 && scene.boxHits(k.x, k.y, k.w, k.h); i++) k.y -= 1; }
  if (knock !== false) { k.vx = (side || s || 1) * 120; k.vy = -150; k.onGround = false; }
  else { k.vx = 0; k.vy = 0; }
  k.peakY = k.y;
}

export function hardCone(g, pts, col, view, fill) {
  if (!pts || pts.length < 3) return;
  const solid = fill === 'solid';
  let y0 = Infinity, y1 = -Infinity; pts.forEach(p => { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
  let vx0 = -Infinity, vx1 = Infinity;
  if (view) { y0 = Math.max(y0, view.y - 1); y1 = Math.min(y1, view.y + view.height + 1); vx0 = Math.floor(view.x) - 1; vx1 = Math.ceil(view.x + view.width) + 1; }
  g.fillStyle(col, 1);
  for (let y = Math.ceil(y0); y <= y1; y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.y > yc) !== (b.y > yc)) xs.push(a.x + (yc - a.y) * (b.x - a.x) / (b.y - a.y)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(vx0, Math.round(xs[k])), b = Math.min(vx1, Math.round(xs[k + 1]));
      if (b <= a) continue;
      if (solid) { g.fillRect(a, y, b - a, 1); continue; }
      for (let x = a + ((a + y) & 1); x < b; x += 2) g.fillRect(x, y, 1, 1);
    }
  }
  const o = pts[0], line = (a, b) => { const n = Math.max(1, Math.abs(b.x - a.x), Math.abs(b.y - a.y)); for (let i = 0; i <= n; i += 1) g.fillRect(Math.round(a.x + (b.x - a.x) * i / n), Math.round(a.y + (b.y - a.y) * i / n), 1, 1); };
  line(o, pts[1]); line(o, pts[pts.length - 1]);
}

// ------------------------------------------------------------------ the show's marks on the floor
// Checkpoints (Nov 18). Each section of an episode starts at a T of gaffer tape on the floor, the
// way a crew marks where an actor starts (no number: the TAKE n stamp is the only count on screen).
// Standing on it sets the visit's checkpoint (death.js): a death or Backspace starts her there;
// running out of lives clears it and the episode starts from the top. A mark she has reached is
// bone white, the next ones are dull; the one just reached blinks twice. Both have a 1 px ash0
// outline, so the tape reads on the pale stone and balcony edges too. The first mark she ever
// reaches, in any episode, says what it is (NOTICE.tape.first), once.
//   this.marks = new Marks(this, [{ x, y }, ...]);          // side view: x her left edge, y the floor
//   this.marks = new Marks(this, [{ tx, ty }, ...], { top: true });   // top-down tiles
//   opts.carry(): extra data a retry from a mark needs (glasses on, pebbles in her pocket)
//   this.marks.from: the mark this take started at ({ i, ...carry }), or null
//   update(dt) every frame she can move; draw(g, seen?) on a layer under her (seen(x, y): is it lit)
export class Marks {
  constructor(scene, list, opts) {
    this.scene = scene; this.list = list; this.opts = opts || {}; this.top = !!this.opts.top;
    const cp = checkpointOf(scene);
    this.from = cp && cp.i != null ? cp : null;
    this.active = this.from ? this.from.i : -1; this.blink = 0;
  }
  reached(m, k) {
    if (this.top) return !k.moving && Math.max(Math.abs(k.tx - m.tx), Math.abs(k.ty - m.ty)) <= 1;
    return k.onGround && Math.abs(k.y + k.h - m.y) < 2 && k.x + k.w > m.x - 2 && k.x < m.x + (m.reach || 64);
  }
  update(dt) {
    this.blink = Math.max(0, this.blink - dt);
    const s = this.scene, k = s.kid; if (!k || s.dead || s.leaving || s.done) return;
    for (let i = this.list.length - 1; i > this.active; i--) if (this.reached(this.list[i], k)) { this.set(i); break; }
  }
  set(i) {
    const m = this.list[i]; this.active = i; this.blink = 0.5;
    const at = this.top ? { tx: m.tx, ty: m.ty, i } : { x: m.x, y: m.y - K.hStand, i };
    if (this.opts.carry) Object.assign(at, this.opts.carry());
    this.scene.markCheckpoint(at);
    Sound.noise(0.03, 0.04, 3200); Sound.tone(1250, 0.03, 'square', 0.01); // a slate clack, quiet
    if (this.opts.onMark) this.opts.onMark(i);
    // what the tape means, once in the whole game: checked before hear(), so a busy bubble
    // never uses the line up unseen
    const b = this.scene.bubbles;
    if (b && !b.busy('item') && !b.busy('tape') && state.hear('tape:first')) {
      const p = this.top ? { x: m.tx * 16 + 8, y: m.ty * 16 } : { x: m.x + 4, y: m.y - K.hStand - 4 };
      b.look('tape', { lines: NOTICE.tape.first }, () => p);
    }
  }
  draw(g, seen) {
    this.list.forEach((m, i) => {
      const x = this.top ? m.tx * 16 + 3 : Math.round(m.x) - 2, y = this.top ? m.ty * 16 + 11 : Math.round(m.y);
      if (seen && !seen(x + 6, y)) return;
      const on = i <= this.active, lit = on && !(this.blink > 0 && i === this.active && Math.floor(this.blink * 8) % 2);
      const tape = C(lit ? 'bone' : 'boneLo'), dark = C('ash0');
      // a T of tape: a strip across the floor's top and a short leg down its face, outlined in
      // ash0 so it shows on pale floors as well as dark ones
      g.fillStyle(dark, 1); g.fillRect(x - 1, y - 1, 14, 4); g.fillRect(x + 4, y + 3, 4, 3);
      g.fillStyle(tape, 1); g.fillRect(x, y, 12, 2); g.fillRect(x + 5, y + 2, 2, 3);
      g.fillStyle(dark, 1); g.fillRect(x + 11, y + 1, 1, 1); g.fillRect(x, y, 1, 1); // torn ends
    });
  }
}

// ------------------------------------------------------------------ gold left out on the path
// Gold bait (research/features_nov17.md item 8): small gold pieces the show set out along the
// best line and the risky one (near a light's edge, over a gap, on a board that gives way). She
// picks one up by touching it. Picked pieces stay picked take after take (a death, Backspace);
// a new visit to the episode, or running out of lives, sets them all out again. The count is
// kept in the story for the results paperwork:
//   state.story.gold       = { ep1: 3, ep2: 5, ... }  pieces picked up on the latest visit, per episode id
//   state.story.goldPlaced = { ep1: 8, ep2: 8, ... }  pieces the show set out, per episode id
// (episode ids: ep1 grounds, ep2 gallery, ep3fall the fall, ep3 east wing, ep4 bedroom.) The
// first piece she ever finds says one line; after that, only a two-note chime.
//   this.gold = new Gold(this, [{ x, y }, ...]);              // side view: y is the floor under it
//   this.gold = new Gold(this, [{ tx, ty }, ...], { top: true });
//   update(dt) every frame she can move; draw(g, seen?)
const TAKEN = {};
export class Gold {
  constructor(scene, list, opts) {
    this.scene = scene; this.list = list; this.opts = opts || {}; this.top = !!this.opts.top;
    this.key = scene.epId; this.pops = []; this.t = 0;
    const d = (scene.sys.settings && scene.sys.settings.data) || {};
    if (!TAKEN[this.key] || !d.retry || d.outOfTakes) {
      TAKEN[this.key] = new Set();
      const all = state.story.gold || {}; if (all[this.key]) state.storySet('gold', Object.assign({}, all, { [this.key]: 0 }));
    }
    this.taken = TAKEN[this.key];
    const placed = Object.assign({}, state.story.goldPlaced || {}); if (placed[this.key] !== list.length) { placed[this.key] = list.length; state.storySet('goldPlaced', placed); }
  }
  get count() { return this.taken.size; }
  at(m) { return this.top ? { x: m.tx * 16 + 8, y: m.ty * 16 + 11 } : { x: Math.round(m.x), y: Math.round(m.y) }; }
  update(dt) {
    this.t += dt; this.pops.forEach(p => { p.t += dt; }); this.pops = this.pops.filter(p => p.t < 0.24);
    const s = this.scene, k = s.kid; if (!k || s.dead || s.leaving || s.done) return;
    this.list.forEach((m, i) => {
      if (this.taken.has(i)) return;
      const hit = this.top ? (!k.moving && k.tx === m.tx && k.ty === m.ty) : (k.x < m.x + 4 && k.x + k.w > m.x - 3 && k.y < m.y && k.y + k.h > m.y - 6);
      if (hit) this.take(i);
    });
  }
  take(i) {
    this.taken.add(i);
    const p = this.at(this.list[i]); this.pops.push({ x: p.x, y: p.y - 2, t: 0 });
    Sound.tone(1568, 0.05, 'square', 0.01); setTimeout(() => Sound.tone(2093, 0.08, 'square', 0.009), 60);
    const all = Object.assign({}, state.story.gold || {}); all[this.key] = this.taken.size; state.storySet('gold', all);
    const s = this.scene;
    if (s.bubbles && !s.bubbles.busy('item') && !s.bubbles.busy('tape') && state.hear('gold:first')) s.bubbles.look('item', { lines: NOTICE.gold.first }, () => ({ x: p.x, y: p.y - 6 }));
  }
  draw(g, seen) {
    this.list.forEach((m, i) => {
      if (this.taken.has(i)) return;
      const { x, y } = this.at(m); if (seen && !seen(x, y)) return;
      // a gold ring lying on the floor: dark rim, gold body, one bright pixel; now and then a hard glint
      g.fillStyle(C('ash0'), 1); g.fillRect(x - 2, y - 4, 5, 4);
      g.fillStyle(C('gold'), 1); g.fillRect(x - 1, y - 3, 3, 2);
      g.fillStyle(C('goldLo'), 1); g.fillRect(x, y - 2, 1, 1);
      const glint = (this.t * 0.45 + i * 0.37) % 1 < 0.06;
      g.fillStyle(C(glint ? 'bone' : 'goldHi'), 1); g.fillRect(x - 1, y - 3, 1, 1);
      if (glint) { g.fillStyle(C('goldHi'), 1); g.fillRect(x - 1, y - 6, 1, 2); g.fillRect(x - 4, y - 3, 2, 1); }
    });
    this.pops.forEach(p => { const r = p.t < 0.12 ? 2 : 4; g.fillStyle(C(p.t < 0.12 ? 'bone' : 'goldHi'), 1); g.fillRect(p.x - r, p.y, 1, 1); g.fillRect(p.x + r, p.y, 1, 1); g.fillRect(p.x, p.y - r, 1, 1); g.fillRect(p.x, p.y + r, 1, 1); });
  }
}

// ------------------------------------------------------------------ furniture (Nov 18)
// Michael: "there should be physics and interactivity with them, like the tables in the closed
// room". Pieces are pixel boxes that move a whole pixel at a time (never into a wall, another
// piece or her), fall, carry what stands on them, and change pose by frame swaps (a chair goes
// over in three frames: lean, lean further, down). No tweening, no rotation.
//   w, h: upright size. push: px/s when she leans on it. tip: K knocks it over (down: its size
//   lying down; soft: lying, it is not solid; wobbly: walking into it knocks it over too). light:
//   K shoves it along, and riding on another piece it lags behind.
const FURN = {
  table: { w: 24, h: 12, push: 22 },
  chair: { w: 10, h: 18, push: 32, tip: true, down: [18, 7] },
  stool: { w: 10, h: 10, push: 36, tip: true, down: [12, 7] },
  bin: { w: 8, h: 10, push: 40, tip: true, down: [12, 6] },
  lamp: { w: 7, h: 26, push: 30, tip: true, down: [24, 4], soft: true, wobbly: true },
  crate: { w: 16, h: 16, push: 22 },
  box: { w: 10, h: 8, push: 44, light: true },
  trunk: { w: 22, h: 14, push: 18 },
  bench: { w: 28, h: 10, push: 14 }
};
// loose things: size, and whether they break when they land hard
const ITEM = {
  cup: [3, 3, true], mug: [4, 4, true], jar: [4, 5, true], vase: [4, 7, true], bottle: [2, 6, true], bulb: [3, 4, true],
  book: [6, 2, false], can: [4, 5, false], candle: [3, 7, false], paper: [3, 1, false], tin: [5, 3, false], brush: [6, 2, false]
};
// three tones per material (dark, base, light), from ASH only
const TONES = {
  wood: ['bronzeLo', 'bronze', 'bronzeHi'], grey: ['ash2', 'ash3', 'ash4'], gold: ['goldLo', 'gold', 'goldHi'],
  bone: ['ash5', 'boneLo', 'bone'], card: ['ash4', 'ash5', 'boneLo']
};
const RUN_HIT = 60;     // she has to be going about full walking speed to knock a lamp over or make a table's things jump
const TIP_FRAME = 0.07; // seconds a frame of a fall lasts
const ovl = (ax, ay, aw, ah, b) => ax < b.x + b.w && ax + aw > b.x && ay < b.y + b.h && ay + ah > b.y;

const Furniture = {
  piece(spec) {
    const F = FURN[spec.kind] || FURN.crate;
    const p = Object.assign({ pose: 'up', frame: 0, vy: 0, ay: 0, grounded: false, push: F.push, acc: 0, wob: 0, rects: [], slide: 0, contact: false, back: -1, tone: 'wood', dir: 1 }, spec);
    p.kind = FURN[spec.kind] ? spec.kind : 'crate'; p.id = spec.id || p.kind;
    p.w = spec.w || F.w; p.h = spec.h || F.h; p.uw = p.w; p.uh = p.h;
    p.x = Math.round(spec.x); p.y = Math.round(spec.y) - p.h;
    p.lit = p.kind === 'lamp' && spec.lit !== false;
    this.setRects(p); this.pieces.push(p);
    return p;
  },
  item(spec) {
    const I = ITEM[spec.kind] || ITEM.cup;
    const it = Object.assign({ vx: 0, vy: 0, ax: 0, ay: 0, wob: 0, carry: 0, kick: 0, broken: false }, spec);
    it.w = I[0]; it.h = I[1]; it.fragile = spec.fragile != null ? spec.fragile : I[2];
    it.x = Math.round(spec.x); it.y = Math.round(spec.y) - it.h;
    this.items.push(it); return it;
  },
  // the solid parts of a piece, relative to its top-left, in its current pose
  partsOf(p) {
    const w = p.w, h = p.h;
    if (p.pose === 'down') return FURN[p.kind].soft ? [] : [[0, 0, w, h]];
    if (p.kind === 'table') return [[0, 0, w, 3]];                                    // she crouches under it
    if (p.kind === 'chair') return [[0, h - 10, w, 10], [p.back < 0 ? 0 : w - 2, 0, 2, h - 10]];
    if (p.kind === 'lamp') return [[1, 0, w - 2, h]];
    return [[0, 0, w, h]];
  },
  setRects(p) {
    const s = this.scene;
    s.props = s.props.filter(r => !p.rects.includes(r));
    p.rects = this.partsOf(p).map(([dx, dy, w, h]) => ({ id: p.id, kind: 'piece', piece: p, dx, dy, x: p.x + dx, y: p.y + dy, w, h }));
    s.props.push(...p.rects);
  },
  syncRects(p) { p.rects.forEach(r => { r.x = p.x + r.dx; r.y = p.y + r.dy; }); },
  // is the box (x, y, w, h) clear of tiles and of every solid thing but p's own parts; with
  // kidToo, p's parts at that offset must miss her as well (parts: lying parts to test instead)
  // Another piece counts as its whole box (a table's legs and the room under it too), so a chair
  // lying down never slides in under a table and jams it. noPieces: walls and fixed ledges only.
  fitsAt(p, x, y, w, h, kidToo, parts, noPieces) {
    const s = this.scene, T = 16;
    const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (s.solidTile(tx, ty)) return false;
    if (s.props.some(r => r.solid !== false && !p.rects.includes(r) && (r.piece ? !noPieces && ovl(x, y, w, h, r.piece) : ovl(x, y, w, h, r)))) return false;
    if (kidToo && s.kid && !s.dead) {
      const k = s.kid, ps = parts || this.partsOf(p);
      if (ps.some(([dx, dy, pw, ph]) => ovl(x + dx, y + dy, pw, ph, k))) return false;
    }
    return true;
  },
  fits(p, dx, dy, kidToo) { return this.fitsAt(p, p.x + dx, p.y + dy, p.w, p.h, kidToo); },
  kidUnder(p, dy) { const k = this.scene.kid; return !!(k && !this.scene.dead && this.partsOf(p).some(([dx, ddy, w, h]) => ovl(p.x + dx, p.y + ddy + dy, w, h, k))); },
  // she stands on one of p's parts
  onPiece(k, p) { return k.onGround && p.rects.some(r => Math.abs(k.y + k.h - r.y) < 1.5 && k.x + k.w > r.x && k.x < r.x + r.w); },
  // she is right beside a part of p, on side dir (1: p is to her right), level with it
  touching(p, k, dir) {
    return p.rects.some(r => k.y < r.y + r.h - 0.5 && k.y + k.h > r.y + 0.5 && (dir > 0 ? Math.abs(k.x + k.w - r.x) <= 1.01 : Math.abs(r.x + r.w - k.x) <= 1.01));
  },
  ridersOf(p) { return this.pieces.filter(q => q !== p && !q.tip && p.rects.some(r => Math.abs(q.y + q.h - r.y) < 0.5 && q.x < r.x + r.w && q.x + q.w > r.x)); },
  itemsOn(p) { return this.items.filter(it => !it.broken && p.rects.some(r => Math.abs(it.y + it.h - r.y) < 0.5 && it.x < r.x + r.w && it.x + it.w > r.x)); },
  // move a piece one pixel sideways, with what stands on it; false if it is blocked. Pushed into
  // another piece on the floor, that one moves first (a row of them goes along, slow as ever);
  // a wall, a fixed ledge or her stops the lot.
  moveBy(p, dx, depth) {
    depth = depth || 0;
    if (!this.fits(p, dx, 0, true)) {
      if (depth >= 4 || !this.fitsAt(p, p.x + dx, p.y, p.w, p.h, true, null, true)) return false;
      const riders = this.ridersOf(p), nx = p.x + dx;
      const block = this.pieces.filter(q => q !== p && q.rects.length && !riders.includes(q) && ovl(nx, p.y, p.w, p.h, q));
      if (!block.length || block.some(q => q.tip || !q.grounded)) return false;
      for (const q of block) if (!this.moveBy(q, dx, depth + 1)) return false;
      if (!this.fits(p, dx, 0, true)) return false;
    }
    const s = this.scene, k = s.kid, riders = this.ridersOf(p), its = this.itemsOn(p), onIt = k && !s.dead && this.onPiece(k, p);
    p.x += dx; this.syncRects(p);
    // what stands on it goes along; a light thing (a box) lags a pixel in three, wobbling, so it
    // creeps to the back edge and drops off
    if (depth < 4) riders.forEach(q => {
      if (FURN[q.kind].light) { q.carry = (q.carry || 0) + 1; q.wob = Math.max(q.wob, 0.12); if (q.carry % 3 === 0) return; }
      this.moveBy(q, dx, depth + 1);
    });
    // loose things lag a little behind and wobble, so they creep toward the edge and drop off
    its.forEach(it => { it.carry++; if (it.carry % 3 && this.itemFits(it, it.x + dx, it.y)) it.x += dx; it.wob = Math.max(it.wob, 0.12); });
    if (onIt && !s.boxHits(k.x + dx, k.y, k.w, k.h)) k.x += dx;
    return true;
  },
  itemFits(it, x, y) {
    const s = this.scene, T = 16;
    const x0 = Math.floor(x / T), x1 = Math.floor((x + it.w - 0.001) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + it.h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (s.solidTile(tx, ty)) return false;
    return !s.props.some(r => r.solid !== false && ovl(x, y, it.w, it.h, r));
  },
  // what is on p jumps a pixel and slides n px toward dir (0: a little either way)
  shake(p, dir, n) {
    p.wob = Math.max(p.wob, 0.16);
    this.itemsOn(p).forEach((it, i) => {
      it.wob = 0.3; const d = dir || (i % 2 ? 1 : -1);
      for (let j = 0; j < (n || 0); j++) if (this.itemFits(it, it.x + d, it.y)) it.x += d;
    });
    this.ridersOf(p).forEach(q => { q.wob = Math.max(q.wob, 0.16); if (dir && (FURN[q.kind].light || FURN[q.kind].tip)) for (let j = 0; j < (n || 0); j++) this.moveBy(q, dir); });
  },

  // ---------------------------------------------------------------- what she does to them
  // walking into it at full speed: a lamp goes over; anything else thuds and what is on it jumps
  // (then she pushes it)
  impact(p, d) {
    if (FURN[p.kind].wobbly && p.pose === 'up') { if (this.tip(p, d)) return; }
    this.shake(p, d, 2); this.knock(p);
    if (FURN[p.kind].light) p.slide += d * 6;
  },
  knock(p) { const heavy = !FURN[p.kind].light && !FURN[p.kind].tip; Sound.noise(0.06, heavy ? 0.05 : 0.035, heavy ? 420 : 900); Sound.tone(heavy ? 90 : 160, 0.07, 'triangle', 0.025, heavy ? 60 : 120); },
  // knock it over toward d, or stand it back up; false if there is no room
  tip(p, d) {
    const F = FURN[p.kind]; if (!F.tip || p.tip) return false;
    const floor = p.y + p.h;
    if (p.pose === 'up') {
      const [dw, dh] = F.down, ps = F.soft ? [] : [[0, 0, dw, dh]];
      // room to lie down: clear of everything (a soft one, lying flat, only of walls), and not
      // on her; if something is in the way it lies a little short of it. No room away from her
      // (pushed up against a table, say): it goes over the other way, and she steps back
      const lie = (dd, kid) => {
        const x0 = dd > 0 ? p.x : p.x + p.w - dw;
        const room = xx => F.soft ? this.tilesClear(xx, floor - dh, dw, dh) : this.fitsAt(p, xx, floor - dh, dw, dh, kid, ps) && !(kid && this.kidIn(xx, floor - dh, dw, dh));
        for (let s = 0; s <= dw; s++) if (room(x0 - dd * s)) return x0 - dd * s;
        return null;
      };
      let dir = d, at = lie(d, true);
      if (at == null) { dir = -d; at = lie(-d, false); }
      if (at == null) return false;
      p.tip = { to: 'down', t: 0, dir, x: at };
      Sound.tone(260, 0.05, 'square', 0.012, 200);
      // what was on it goes flying
      this.itemsOn(p).forEach(it => { it.vx = dir * 55; it.vy = -70; it.wob = 0.3; });
      return true;
    }
    const w = p.uw, h = p.uh, x0 = p.x + Math.round((p.w - w) / 2);
    let at = null;
    for (const s of [0, 1, -1, 2, -2, 3, -3, 4, -4, 6, -6]) if (at == null && this.fitsAt(p, x0 + s, floor - h, w, h, true, [[0, 0, w, h]])) at = x0 + s;
    if (at == null) return false;
    p.tip = { to: 'up', t: 0, dir: p.dir, x: at };
    Sound.tone(200, 0.05, 'square', 0.012, 260);
    return true;
  },
  tilesClear(x, y, w, h) {
    const s = this.scene, T = 16, x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (s.solidTile(tx, ty)) return false;
    return true;
  },
  kidIn(x, y, w, h) { const k = this.scene.kid; return !!(k && ovl(x, y, w, h, k)); },
  // K: the thing in front of her (not the one she stands on)
  strikeTarget(k) {
    const f = k.face || 1, bx = f > 0 ? k.x + k.w - 2 : k.x - 14, by = k.y - 10, bw = 16, bh = k.h + 10, cx = k.x + k.w / 2;
    let best = null, bd = 1e9;
    this.pieces.forEach(p => {
      if (p.tip || this.onPiece(k, p)) return;
      if (!ovl(bx, by, bw, bh, p)) return;
      // the nearest, and the one on top before the one under it (a box on a trunk)
      // and a chair, stool, bin, lamp or box right against her before a cup on a table behind it
      const top = this.pieces.some(q => q !== p && this.ridersOf(q).includes(p)) ? -12 : 0;
      const gap = Math.max(p.x - (k.x + k.w), k.x - (p.x + p.w), 0), F = FURN[p.kind];
      const close = (F.tip || F.light) && gap <= 2 && p.y + p.h > k.y ? -20 : 0;
      const d = Math.abs(p.x + p.w / 2 - cx) + (p.y + p.h - (k.y + k.h)) * 0.6 + top + close; if (d < bd) { bd = d; best = { p }; }
    });
    this.items.forEach(it => {
      if (it.broken || !ovl(bx, by, bw, bh, it)) return;
      const d = Math.abs(it.x + it.w / 2 - cx) - 4 + (it.y + it.h - (k.y + k.h)) * 0.6; if (d < bd) { bd = d; best = { it }; }
    });
    return best;
  },
  strike(t, d) {
    this.swingT = 0.16; this.swingDir = d;
    if (t.it) { const it = t.it; it.vx = d * 85; it.vy = -95; it.wob = 0.3; Sound.tone(900, 0.03, 'square', 0.01); return; }
    const p = t.p, F = FURN[p.kind];
    if (F.tip) { if (!this.tip(p, d)) { this.shake(p, d, 1); this.knock(p); } return; }
    if (F.light) { p.slide += d * 18; this.knock(p); this.shake(p, d, 1); return; }
    // too heavy to move far: it shifts a pixel and everything on it jumps
    this.moveBy(p, d); this.shake(p, d, 2); this.knock(p);
  },
  // a bump from below: things on rect r jump away from her (or, right over her head, toward the
  // nearer end); a box slides most of the way, so two or three bumps knock it off
  bonk(r, k) {
    const cx = k.x + k.w / 2, on = (x, w, bottom) => Math.abs(bottom - r.y) < 0.5 && x < r.x + r.w && x + w > r.x;
    const away = x => Math.abs(x - cx) >= 3 ? Math.sign(x - cx) : (x - r.x < r.x + r.w - x ? -1 : 1);
    let hit = false;
    this.pieces.forEach(p => {
      if (p.tip || p === r.piece || !on(p.x, p.w, p.y + p.h)) return;
      const d = away(p.x + p.w / 2); hit = true; p.wob = 0.3;
      if (FURN[p.kind].light) p.slide += d * 14; else this.moveBy(p, d);
      this.shake(p, d, 1);
    });
    this.items.forEach(it => { if (it.broken || !on(it.x, it.w, it.y + it.h)) return; hit = true; it.vx = away(it.x + it.w / 2) * 45; it.vy = -60; it.wob = 0.3; });
    if (r.piece) { this.shake(r.piece, 0, 1); hit = true; }
    if (hit) { Sound.noise(0.06, 0.04, 600); Sound.tone(120, 0.06, 'triangle', 0.02, 90); }
  },
  nearPiece(k) {
    let best = null, bd = 12;
    this.pieces.forEach(p => { const d = Math.max(p.x - (k.x + k.w), k.x - (p.x + p.w), 0); if (d < bd && k.y < p.y + p.h && k.y + k.h > p.y - 4) { bd = d; best = p; } });
    return best;
  },

  // ---------------------------------------------------------------- per frame
  updateFurniture(dt, k) {
    const s = this.scene, c = s.ctl, live = k && !s.dead && !s.leaving && !s.done;
    this.swingT = Math.max(0, this.swingT - dt);
    // she leans on one: it moves (one at a time), and so does she, at its speed
    const dir = live && c && c.right ? (c.right() ? 1 : 0) - (c.left() ? 1 : 0) : 0;
    let pushing = null;
    if (dir && k.onGround) for (const p of this.pieces) {
      if (p.tip || !p.grounded || !p.push || !this.touching(p, k, dir)) { p.acc = 0; continue; }
      if (!p.acc) this.shake(p, dir, 0);
      p.acc += p.push * dt; pushing = p;
      while (p.acc >= 1) {
        p.acc -= 1;
        if (!this.moveBy(p, dir)) { p.acc = 0; break; }
        if (!s.boxHits(k.x + dir, k.y, k.w, k.h)) k.x += dir;
        p.moved = (p.moved || 0) + 1; if (p.moved % 6 === 0) Sound.noise(0.05, 0.018, 380 + p.push * 6);
      }
      k.vx = dir * Math.min(Math.abs(k.vx), p.push);
      break;
    }
    this.pushing = pushing;
    this.pieces.forEach(p => {
      p.wob = Math.max(0, p.wob - dt);
      if (p.tip) return this.tipStep(p, dt);
      // a shove (K on a box): a few px a frame until it is used up or blocked
      if (p.slide) {
        const st = Math.sign(p.slide), n = Math.min(Math.abs(p.slide), Math.max(1, Math.round(110 * dt)));
        for (let i = 0; i < n; i++) { if (!this.moveBy(p, st)) { p.slide = 0; break; } p.slide -= st; }
      }
      this.fallPiece(p, dt);
      if (p.thing) { const t = p.thing; t.x0 = p.x - 2; t.x1 = p.x + p.w + 2; t.y0 = p.y; t.y1 = p.y + p.h; if (t.followPy !== false) t.py = p.y; }
    });
    this.items.forEach(it => this.moveItem(it, dt));
  },
  fallPiece(p, dt) {
    const supported = !this.fits(p, 0, 1, false) || this.kidUnder(p, 1);
    if (supported && p.vy <= 0) { p.grounded = true; p.vy = 0; p.ay = 0; return; }
    p.grounded = false; p.vy = Math.min(MAXF, p.vy + GRAV * dt); p.ay += p.vy * dt;
    while (p.ay >= 1) {
      p.ay -= 1;
      if (!this.fits(p, 0, 1, false)) { this.landPiece(p); return; }
      if (this.kidUnder(p, 1)) {
        // her head is in the way: it slides off her to the side it is mostly on, or sits on her
        const k = this.scene.kid, side = p.x + p.w / 2 < k.x + k.w / 2 ? -1 : 1;
        if (this.fits(p, side, 0, true)) { p.x += side; this.syncRects(p); continue; }
        this.landPiece(p); return;
      }
      p.y += 1; this.syncRects(p);
    }
  },
  landPiece(p) {
    const v = p.vy; p.vy = 0; p.ay = 0; p.grounded = true;
    if (v > 110) { this.knock(p); this.shake(p, 0, 1); }
    if (p.onLand && v > 110) p.onLand(p, v);
  },
  tipStep(p, dt) {
    const T = p.tip; T.t += dt;
    if (T.to === 'down') {
      p.frame = T.t < TIP_FRAME ? 1 : 2;
      if (T.t < TIP_FRAME * 2) return;
      const [dw, dh] = FURN[p.kind].down, floor = p.y + p.h;
      p.tip = null; p.pose = 'down'; p.frame = 3; p.dir = T.dir; p.w = dw; p.h = dh; p.x = T.x; p.y = floor - dh;
      if (p.kind === 'lamp') { p.lit = false; Sound.noise(0.05, 0.03, 5000); }
      this.setRects(p); this.knock(p);
      Sound.noise(0.09, 0.05, 1100);
      if (p.kind === 'bin' && !p.spilt) { p.spilt = true; for (let i = 0; i < 4; i++) this.item({ kind: 'paper', tone: p.spill, x: p.x + (T.dir > 0 ? p.w - 2 : 0), y: floor - 1, vx: T.dir * (30 + i * 18), vy: -40 - i * 10 }); }
      this.unstick(p, T.dir);
      if (p.onTip) p.onTip(p, 'down');
    } else {
      p.frame = T.t < TIP_FRAME ? 2 : 1;
      if (T.t < TIP_FRAME * 2) return;
      const floor = p.y + p.h;
      p.tip = null; p.pose = 'up'; p.frame = 0; p.w = p.uw; p.h = p.uh; p.x = T.x; p.y = floor - p.h;
      if (p.kind === 'lamp') p.lit = true;
      this.setRects(p); Sound.noise(0.05, 0.03, 700);
      this.unstick(p, -T.dir);
      if (p.onTip) p.onTip(p, 'up');
    }
  },
  // she is never left inside a piece
  unstick(p, side) {
    const s = this.scene, k = s.kid; if (!k) return;
    const r = p.rects.find(r => ovl(k.x, k.y, k.w, k.h, r));
    if (r) pushClear(s, r, side || 1, false);
  },
  moveItem(it, dt) {
    if (it.broken) return;
    it.wob = Math.max(0, it.wob - dt); it.kick = Math.max(0, it.kick - dt);
    const grounded = !this.itemFits(it, it.x, it.y + 1);
    // resting on something: a fall that ended exactly on a pixel lands here (and breaks, or bounces)
    if (grounded && it.vy > 0) { this.landItem(it); it.ay = 0; }
    if (it.broken) return;
    if (grounded && it.vy >= 0) { it.vy = 0; it.ay = 0; const f = 420 * dt; it.vx = Math.abs(it.vx) <= f ? 0 : it.vx - Math.sign(it.vx) * f; }
    else it.vy = Math.min(MAXF, it.vy + GRAV * dt);
    it.ax += it.vx * dt;
    while (Math.abs(it.ax) >= 1) { const st = Math.sign(it.ax); it.ax -= st; if (this.itemFits(it, it.x + st, it.y)) it.x += st; else { it.vx = -it.vx * 0.3; it.ax = 0; break; } }
    it.ay += it.vy * dt;
    while (Math.abs(it.ay) >= 1) {
      const st = Math.sign(it.ay); it.ay -= st;
      if (this.itemFits(it, it.x, it.y + st)) { it.y += st; continue; }
      if (st > 0) this.landItem(it); else it.vy = 0;
      it.ay = 0; break;
    }
    // stuck inside something (a piece slid over it): up and out
    if (!this.itemFits(it, it.x, it.y)) for (let i = 0; i < 24 && !this.itemFits(it, it.x, it.y); i++) it.y -= 1;
  },
  landItem(it) {
    const v = it.vy; it.vy = 0;
    if (it.fragile && v > 100) { // a fall of about 7 px or more: off any table
      it.broken = true; it.shards = [];
      for (let i = 0; i < 5; i++) it.shards.push([Math.round((i - 2) * (2 + (i % 2))), i % 3 === 0 ? 'b' : 'a']);
      Sound.noise(0.1, 0.05, 5200); Sound.tone(2400, 0.05, 'square', 0.01, 1800);
      if (it.onBreak) it.onBreak(it);
    } else if (v > 80) { it.vy = -v * 0.25; it.vx *= 0.6; Sound.tone(700 + it.w * 60, 0.03, 'square', 0.012); }
  },
  afterFurniture(dt, k) {
    const s = this.scene, c = s.ctl, live = !s.dead && !s.leaving && !s.done;
    // a run into one: over it goes (or a thud)
    const d = Math.sign(this.preVx);
    this.pieces.forEach(p => {
      const now = !p.tip && (this.touching(p, k, 1) || this.touching(p, k, -1));
      if (live && now && !p.contact && d && Math.abs(this.preVx) >= RUN_HIT && this.touching(p, k, d) && this.pushing !== p) this.impact(p, d);
      p.contact = now;
    });
    // a hard landing on top: what is on it jumps
    if (this.preAir && k.onGround && this.preVy > 150) this.pieces.forEach(p => { if (this.onPiece(k, p)) this.shake(p, 0, 1); });
    // her head bumps a shelf or a piece from below: what stands on it jumps
    if (live && this.preVy < -30 && !k.onGround && k.vy === 0) { const r = s.props.find(r => r.solid !== false && ovl(k.x, k.y - 1, k.w, 1, r)); if (r) this.bonk(r, k); }
    // loose things on the floor get kicked when she walks through them
    if (live && Math.abs(k.vx) > 25) this.items.forEach(it => {
      if (it.broken || it.kick > 0 || !ovl(it.x, it.y, it.w, it.h, k) || Math.abs(k.y + k.h - (it.y + it.h)) > 2) return;
      it.vx = k.vx * 1.2; it.vy = -45; it.kick = 0.4; Sound.tone(800, 0.025, 'square', 0.008);
    });
    // K: knock it, shove it, stand it up (only when there is something to hit: K is free otherwise)
    if (live && this.opts.strike !== false && c && c.throwP) { const t = this.strikeTarget(k); if (t && c.throwP()) this.strike(t, k.face || 1); }
    // never inside a piece, whatever moved
    if (s.boxHits(k.x, k.y, k.w, k.h)) { const r = this.pieces.length && s.props.find(r => r.kind === 'piece' && r.solid !== false && ovl(k.x, k.y, k.w, k.h, r)); if (r) pushClear(s, r, k.x + k.w / 2 < r.x + r.w / 2 ? -1 : 1, false); }
  },

  // ---------------------------------------------------------------- drawing: frames, no rotation
  drawFurniture(g) {
    const s = this.scene, P = s.P, lg = this.lightG; lg.clear();
    this.pieces.forEach(p => { if (p.kind === 'lamp' && p.lit && !p.tip) { const x = p.x + (p.wob > 0 && Math.floor(p.wob * 30) % 2 ? 1 : 0), f = p.y + p.h; hardCone(lg, [{ x: x + 1, y: p.y + 6 }, { x: x + p.w - 1, y: p.y + 6 }, { x: x + p.w + 9, y: f }, { x: x - 10, y: f }], C(p.light || 'bronzeHi'), null); } });
    this.pieces.forEach(p => this.drawPiece(g, p));
    this.items.forEach(it => this.drawItem(g, it));
    // her K: a quick swipe of the arm, two frames
    const k = s.kid;
    if (this.swingT > 0 && k && !s.dead) {
      const d = this.swingDir || 1, x = d > 0 ? k.x + k.w : k.x - 1, y = Math.round(k.y + 5), f = this.swingT > 0.08;
      g.fillStyle(C('ash0'), 1); g.fillRect(Math.round(x + (d > 0 ? 0 : -4)), y - 1, 5, 3);
      g.fillStyle(C('bone'), 1); g.fillRect(Math.round(x + (d > 0 ? 0 : -3)), y, f ? 4 : 2, 1);
      if (!f) { g.fillStyle(C('boneLo'), 1); g.fillRect(Math.round(x + d * 5), y - 2, 1, 1); g.fillRect(Math.round(x + d * 6), y + 1, 1, 1); }
    }
  },
  // a piece's upright picture as rects [x, y, w, h, tone], relative to its top-left; tone is
  // 0 dark, 1 base, 2 light, 'o' outline, or an ASH key
  uprightArt(p) {
    const w = p.uw, h = p.uh, out = [];
    const R = (x, y, ww, hh, c) => out.push([x, y, ww, hh, c]);
    const box = (x, y, ww, hh) => { R(x - 1, y - 1, ww + 2, hh + 2, 'o'); };
    switch (p.kind) {
      case 'table':
        box(0, 0, w, 3); box(1, 3, 2, h - 3); box(w - 3, 3, 2, h - 3);
        R(0, 0, w, 3, 1); R(0, 0, w, 1, 2); R(1, 3, 2, h - 3, 0); R(w - 3, 3, 2, h - 3, 0); R(3, 3, w - 6, 1, 0);
        if (p.cloth) { R(-1, 1, w + 2, 5, 'o'); R(0, 1, w, 4, p.cloth); R(0, 1, w, 1, 'bone'); }
        break;
      case 'chair': {
        const bx = p.back < 0 ? 0 : w - 2, fx = p.back < 0 ? w - 2 : 0, sy = h - 10;
        box(bx, 0, 2, sy); box(0, sy, w, 3); box(0, sy + 3, 2, 7); box(w - 2, sy + 3, 2, 7);
        R(bx, 0, 2, sy, 1); R(bx, 0, 2, 1, 2); R(bx === 0 ? 1 : w - 2, 2, 1, sy - 3, 0);
        R(0, sy, w, 3, 1); R(0, sy, w, 1, 2); R(0, sy + 3, 2, 7, 0); R(w - 2, sy + 3, 2, 7, 0); R(fx, sy + 1, 2, 1, 2);
        if (p.cloth) { R(-1, 1, w + 2, h - 3, 'o'); R(0, 2, w, h - 5, p.cloth); R(0, 2, w, 1, 'bone'); R(p.back < 0 ? 0 : w - 3, 3, 3, sy - 2, 'boneLo'); }
        break;
      }
      case 'stool':
        box(0, 0, w, 3); box(1, 3, 2, h - 3); box(w - 3, 3, 2, h - 3);
        R(0, 0, w, 3, 1); R(0, 0, w, 1, 2); R(1, 3, 2, h - 3, 0); R(w - 3, 3, 2, h - 3, 0); R(3, h - 4, w - 6, 1, 0);
        break;
      case 'bin':
        box(0, 0, w, h); R(0, 0, w, h, 1); R(0, 0, w, 1, 2); R(0, 1, w, 1, 0);
        for (let x = 2; x < w - 1; x += 2) R(x, 3, 1, h - 4, 0);
        R(2, -2, 3, 2, 'boneLo'); // a screwed-up page on top
        break;
      case 'lamp':
        box(0, 0, w, 5); box(3, 5, 1, h - 7); box(1, h - 2, w - 2, 2);
        R(0, 0, w, 5, 1); R(1, 0, w - 2, 1, 2); R(3, 5, 1, h - 7, 0); R(1, h - 2, w - 2, 2, 0); R(1, h - 2, w - 2, 1, 1);
        R(2, 5, 3, 1, p.lit ? 'lit' : 'ash2');
        break;
      case 'box':
        box(0, 0, w, h); R(0, 0, w, h, 1); R(0, 0, w, 1, 2); R(Math.floor(w / 2) - 1, 0, 2, h, 0); R(1, h - 3, 3, 1, 0);
        // landed hard and burst open: the flaps up, what was inside showing
        if (p.open) { R(-3, -3, 4, 3, 'o'); R(w - 1, -3, 4, 3, 'o'); R(-2, -2, 3, 2, 2); R(w - 1, -2, 3, 2, 2); R(1, 0, w - 2, 1, 'ash0'); R(2, -1, w - 4, 1, p.inside || 'boneLo'); }
        break;
      case 'trunk':
        box(0, 0, w, h); R(0, 0, w, h, 1); R(0, 0, w, 1, 2); R(0, 4, w, 1, 0);
        R(0, 0, 2, h, 'goldLo'); R(w - 2, 0, 2, h, 'goldLo'); R(Math.floor(w / 2) - 1, 3, 2, 3, 'gold');
        break;
      case 'bench':
        box(0, 0, w, 3); box(2, 3, 2, h - 3); box(w - 4, 3, 2, h - 3);
        R(0, 0, w, 3, 1); R(0, 0, w, 1, 2); for (let x = 4; x < w; x += 5) R(x, 1, 1, 2, 0);
        R(2, 3, 2, h - 3, 0); R(w - 4, 3, 2, h - 3, 0); R(4, h - 3, w - 8, 1, 0);
        break;
      default: // crate
        box(0, 0, w, h); R(0, 0, w, h, 1); R(0, 0, w, 1, 2);
        R(0, 1, w, 2, 0); R(0, h - 3, w, 2, 0); R(0, 0, 2, h, 0); R(w - 2, 0, 2, h, 0);
        for (let i = 0; i < Math.min(w, h) - 6; i++) { const n = Math.min(w, h) - 6; R(Math.round(3 + i * (w - 6) / n), Math.round(3 + i * (h - 6) / n), 1, 1, 0); }
    }
    return out;
  },
  // lying down: a picture of its own, drawn for lying toward the right (mirrored for the left)
  downArt(p) {
    const w = p.w, h = p.h, out = [], R = (x, y, ww, hh, c) => out.push([x, y, ww, hh, c]), box = (x, y, ww, hh) => R(x - 1, y - 1, ww + 2, hh + 2, 'o');
    if (p.kind === 'chair') {
      // on its back: the back flat on the floor, the seat standing up, the legs sticking out
      box(8, h - 2, 10, 2); box(5, 0, 3, h); box(0, 1, 5, 2); box(0, h - 4, 5, 2);
      R(8, h - 2, 10, 2, 1); R(8, h - 2, 10, 1, 2); R(5, 0, 3, h, 1); R(7, 0, 1, h, 2); R(0, 1, 5, 2, 0); R(0, h - 4, 5, 2, 0);
    } else if (p.kind === 'stool') {
      box(w - 3, 0, 3, h); box(0, 1, w - 3, 2); box(0, h - 3, w - 3, 2);
      R(w - 3, 0, 3, h, 1); R(w - 1, 0, 1, h, 2); R(0, 1, w - 3, 2, 0); R(0, h - 3, w - 3, 2, 0); R(3, 3, 1, h - 5, 0);
    } else if (p.kind === 'bin') {
      box(0, 0, w, h); R(0, 0, w, h, 1); R(0, 0, w, 1, 2); for (let x = 2; x < w - 2; x += 2) R(x, 2, 1, h - 3, 0); R(w - 2, 1, 2, h - 2, 'ash0');
    } else if (p.kind === 'lamp') {
      // the pole along the floor, the shade at the far end, its bulb dark
      box(0, h - 2, 3, 2); box(2, h - 2, w - 7, 1); box(w - 5, 0, 5, h);
      R(0, h - 2, 3, 2, 0); R(2, h - 2, w - 7, 1, 0); R(w - 5, 0, 5, h, 1); R(w - 5, 0, 1, h, 2); R(w - 6, 1, 1, 2, 'ash2');
    }
    return out;
  },
  drawPiece(g, p) {
    const P = this.scene.P, tones = TONES[p.tone] || TONES.wood;
    const col = c => c === 'o' ? C('ash0') : typeof c === 'number' ? C(tones[c]) : C(c);
    const jig = p.wob > 0 && Math.floor(p.wob * 30) % 2 ? 1 : 0, X = p.x + jig, Y = p.y;
    void P;
    if (p.pose === 'down' && !p.tip) {
      const art = this.downArt(p), m = p.dir < 0;
      art.forEach(([x, y, w, h, c]) => { g.fillStyle(col(c), 1); g.fillRect(m ? X + p.w - x - w : X + x, Y + y, w, h); });
      return;
    }
    const art = this.uprightArt(p);
    if (!p.frame) { art.forEach(([x, y, w, h, c]) => { g.fillStyle(col(c), 1); g.fillRect(X + x, Y + y, w, h); }); return; }
    // a lean: each row slides toward the fall and the whole thing sinks (frame 1 a little, frame
    // 2 most of the way), pivoting on the foot it falls over
    const d = p.tip ? p.tip.dir : p.dir, H = p.uh, floor = p.y + p.h;
    const sh = p.frame === 1 ? 0.45 : 1.0, sq = p.frame === 1 ? 0.9 : 0.55;
    const ox = p.x + jig + (d > 0 ? 0 : 0), w0 = p.uw;
    art.forEach(([x, y, w, h, c]) => {
      g.fillStyle(col(c), 1);
      for (let r = y; r < y + h; r++) {
        const up = H - r, ny = Math.round(floor - up * sq), nx = Math.round(up * sh * d);
        g.fillRect(ox + Math.round((p.w - w0) / 2) + x + nx, ny, w, Math.max(1, Math.ceil(sq)));
      }
    });
  },
  drawItem(g, it) {
    const x = Math.round(it.x), y = Math.round(it.y) - (it.wob > 0 && Math.floor(it.wob * 25) % 2 ? 1 : 0), w = it.w, h = it.h;
    const f = (xx, yy, ww, hh, c) => { g.fillStyle(C(c), 1); g.fillRect(xx, yy, ww, hh); };
    if (it.broken) { it.shards.forEach(([dx, t]) => f(x + Math.floor(w / 2) + dx, y + h - 1, 1, 1, t === 'b' ? it.shardTone || 'bone' : 'ash4')); return; }
    if (it.kind !== 'paper') f(x - 1, y - 1, w + 2, h + 1, 'ash0');
    switch (it.kind) {
      case 'cup': f(x, y, w, h, 'bone'); f(x, y + h - 1, w, 1, 'boneLo'); break;
      case 'mug': f(x, y, w - 1, h, it.tone || 'ash5'); f(x + w - 1, y + 1, 1, 2, it.tone || 'ash5'); f(x, y, w - 1, 1, 'boneLo'); break;
      case 'jar': f(x, y + 1, w, h - 1, 'ash2'); f(x, y, w, 1, it.tone || 'goldLo'); f(x + 1, y + 2, 1, 2, 'ash4'); f(x + 1, y + h - 2, 2, 1, it.fill || 'ash4'); break;
      case 'vase': f(x, y + 2, w, h - 2, it.tone || 'gold'); f(x + 1, y, w - 2, 2, it.tone || 'gold'); f(x, y + 2, 1, h - 3, 'goldHi'); f(x + 1, y + h - 1, w - 2, 1, 'goldLo'); break;
      case 'bottle': f(x, y + 2, w, h - 2, it.tone || 'ash4'); f(x, y, 1, 2, it.tone || 'ash4'); f(x, y + 3, 1, 1, 'boneLo'); break;
      case 'bulb': f(x, y, w, h - 1, it.lit ? 'lit' : 'boneLo'); f(x + 1, y + h - 1, 1, 1, 'ash4'); break;
      case 'book': f(x, y, w, h, it.tone || 'bronzeHi'); f(x, y, 1, h, 'ash5'); break;
      case 'can': f(x, y, w, h, 'ash4'); f(x, y, w, 1, 'ash5'); f(x, y + 2, w, 1, it.tone || 'red'); break;
      case 'candle': f(x, y + 4, w, 3, 'gold'); f(x + 1, y + 1, 1, 3, 'bone'); f(x + 1, y, 1, 1, it.lit ? 'lit' : 'ash4'); break;
      case 'tin': f(x, y, w, h, it.tone || 'ash4'); f(x, y, w, 1, 'ash5'); break;
      case 'brush': f(x, y, 3, h, 'bronzeHi'); f(x + 3, y, w - 3, h, 'ash0'); f(x + 3, y, w - 3, 1, 'ash4'); break;
      case 'paper': f(x, y, w, h, it.tone || 'boneLo'); break;
      default: f(x, y, w, h, 'ash4');
    }
  }
};
Object.assign(Props.prototype, Furniture);
