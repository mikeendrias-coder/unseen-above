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
import { Sound } from './sound.js';
import { K } from './side.js';
import { hexNum } from '../art/painter.js';
import { ASH } from '../art/palettes.js';

const GRAV = 690, MAXF = 260;
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const C = k => hexNum(ASH[k]);

export class Props {
  constructor(scene, opts) {
    this.scene = scene; this.list = []; this.riding = null; this.letGo = 0; this.lastSwing = null; this.t = 0;
    this.g = scene.add.graphics().setDepth((opts && opts.depth) || 3.6);
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
  step(dt, move) { this.update(dt); if (!this.riding) move(); this.after(dt); }
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
  }
  after() {
    const s = this.scene, k = s.kid; if (!k || s.dead) { this.riding = null; return; }
    this.list.forEach(p => {
      if (p.kind === 'crumble' && p.state === 'solid' && this.standsOn(k, p.r)) { p.state = 'shake'; p.t = 0; Sound.noise(0.18, 0.04, 700); Sound.tone(140, 0.12, 'triangle', 0.02, 110); }
      if (p.kind === 'swing' && !this.riding && !(this.letGo && p === this.lastSwing) && !k.onGround && !s.leaving) {
        const g = { x: p.ex - 7, y: p.ey - 4, w: 14, h: 14 };
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
    if (landed) { if (!p.grounded && p.vy > 160) { Sound.noise(0.2, 0.06, 600); s.cameras.main.shake(80, 0.004); } p.vy = 0; p.grounded = true; p.fy = Math.round(p.fy); }
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

// Draw a light's cone as hard light: every other pixel row of it, in one flat tone, with its two
// edges drawn solid. No alpha, no blending (docs/ART_DIRECTION.md section 2).
export function hardCone(g, pts, col, view) {
  if (!pts || pts.length < 3) return;
  let y0 = Infinity, y1 = -Infinity; pts.forEach(p => { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
  if (view) { y0 = Math.max(y0, view.y - 1); y1 = Math.min(y1, view.y + view.height + 1); }
  g.fillStyle(col, 1);
  for (let y = Math.ceil(y0); y <= y1; y++) {
    if (y & 1) continue;
    const yc = y + 0.5, xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.y > yc) !== (b.y > yc)) xs.push(a.x + (yc - a.y) * (b.x - a.x) / (b.y - a.y)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) g.fillRect(a, y, b - a, 1); }
  }
  const o = pts[0], line = (a, b) => { const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)); for (let i = 0; i <= n; i += 1) g.fillRect(Math.round(a.x + (b.x - a.x) * i / n), Math.round(a.y + (b.y - a.y) * i / n), 1, 1); };
  line(o, pts[1]); line(o, pts[pts.length - 1]);
}
