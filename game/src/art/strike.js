// The satellite strike. Every death comes from orbit: a tiny satellite at the top of the view
// flares, and a thin, precise beam leaves it and finds her. It never takes the same way twice
// in a row: it ricochets side to side, bounces off the top of the view, bends in a long curve,
// circles her before it closes in, skims the floor and comes back up, or splits in two and
// meets itself at her. Then the beam dies out from the satellite end toward the impact,
// thinning, flickering and shedding embers, and the scorch fades. Nothing comes from the
// viewer's side.
//
// Use: const s = new SatelliteStrike(scene, { depth: 8 }); in update: s.update(dt);
//      s.fire({ view: camera.worldView, tx, ty, P, onImpact, style? }). Pass { parent: container }
//      to draw inside a container (the kids' room feed), in that container's local units.
import { hexNum } from './painter.js';
import { Sound } from '../core/sound.js';

export const STRIKE = { flare: 0.14, travel: 0.24, hold: 0.1, die: 0.52, scorch: 0.9 };
const ease = u => u * u * (3 - 2 * u);
const STYLES = [['zigzag', 3], ['ceiling', 2], ['bend', 3], ['orbit', 2], ['floor', 1.5], ['split', 2]];
let lastStyle = null;
function pickStyle() {
  const pool = STYLES.filter(([s]) => s !== lastStyle), sum = pool.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * sum; for (const [s, w] of pool) { r -= w; if (r <= 0) return (lastStyle = s); }
  return (lastStyle = pool[0][0]);
}
const bez = (a, b, c, d, u) => { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; };

export class SatelliteStrike {
  constructor(scene, opts) {
    opts = opts || {};
    this.scene = scene; this.sound = opts.sound !== false;
    this.glow = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.core = scene.add.graphics();
    if (opts.parent) { opts.parent.add(this.glow); opts.parent.add(this.core); }
    else { this.glow.setDepth(opts.depth || 8); this.core.setDepth((opts.depth || 8) + 0.1); }
    this.shot = null; this.bits = [];
  }
  get busy() { return !!this.shot; }

  // Every way the beam can take, as point lists from the satellite to her. k marks a ricochet.
  paths(view, tx, ty, from, style) {
    const x0 = view.x + 1, x1 = view.x + view.width - 1, y0 = view.y, mid = view.x + view.width / 2, W = view.width;
    const yb = view.y + (view.height || 180) - 2;
    const sx = from != null ? from : (Math.random() < 0.5 ? x0 + W * (0.15 + Math.random() * 0.2) : x1 - W * (0.15 + Math.random() * 0.2));
    const start = { x: sx, y: y0 + 6 }, end = { x: tx, y: ty }, top = y0 + 14, bottom = Math.max(top + 24, ty - 16);
    const clampX = x => Math.max(x0, Math.min(x1, x)), clampY = y => Math.max(y0 + 1, Math.min(yb, y));
    const zig = (first) => {
      const last = tx < mid ? 1 : -1;
      let n = first === last ? 3 : 2; if (Math.random() < 0.35) n += 2;
      const pts = [start];
      for (let i = 0; i < n; i++) { const side = i % 2 ? -first : first, u = (i + 0.55 + Math.random() * 0.35) / (n + 0.2); pts.push({ x: side > 0 ? x1 : x0, y: top + (bottom - top) * u, k: true }); }
      pts.push(end); return pts;
    };
    const firstSide = sx < mid ? 1 : -1;
    if (style === 'zigzag') return [zig(firstSide)];
    if (style === 'split') return [zig(1), zig(-1)];
    if (style === 'ceiling') {
      // down to the far wall, back up to the top of the view, down the other wall, into her
      const s = firstSide, h = bottom - top;
      return [[start, { x: s > 0 ? x1 : x0, y: top + h * (0.45 + Math.random() * 0.2), k: true }, { x: clampX(mid + (Math.random() - 0.5) * W * 0.3), y: y0 + 1, k: true },
        { x: s > 0 ? x0 : x1, y: top + h * (0.6 + Math.random() * 0.25), k: true }, end]];
    }
    if (style === 'floor') {
      // past her, off the bottom of the view, and back up into her
      const s = tx < mid ? 1 : -1;
      return [[start, { x: s > 0 ? x0 : x1, y: top + (yb - top) * 0.4, k: true }, { x: clampX(tx + s * (34 + Math.random() * 30)), y: yb, k: true }, end]];
    }
    if (style === 'bend') {
      // one long bending curve that swings out wide and hooks back into her
      const s = Math.random() < 0.5 ? 1 : -1, c1 = { x: clampX(mid + s * W * 0.62), y: y0 + (ty - y0) * 0.25 }, c2 = { x: clampX(tx - s * W * 0.55), y: ty - (ty - y0) * 0.1 }, pts = [];
      for (let i = 0; i <= 34; i++) { const u = i / 34; pts.push({ x: clampX(bez(start.x, c1.x, c2.x, end.x, u)), y: clampY(bez(start.y, c1.y, c2.y, end.y, u)) }); }
      pts[pts.length - 1] = end; return [pts];
    }
    // orbit: down to her, once around her, tightening, then in
    const s = Math.random() < 0.5 ? 1 : -1, R = Math.min(34, Math.max(18, (ty - y0) * 0.35)), a0 = -Math.PI / 2 + s * 0.9, pts = [start];
    const entry = { x: clampX(tx + Math.cos(a0) * R), y: clampY(ty + Math.sin(a0) * R) }; pts.push(entry);
    const turns = 1.15, n = 40;
    for (let i = 1; i <= n; i++) { const u = i / n, a = a0 + s * u * turns * Math.PI * 2, r = R * (1 - u) + 2 * u; pts.push({ x: clampX(tx + Math.cos(a) * r), y: clampY(ty + Math.sin(a) * r) }); }
    pts.push(end); return [pts];
  }

  // The satellite itself, drawn at the top of the view: a body, two panels, an emitter.
  static drawSat(g, P, x, y, glowG, flare) {
    x = Math.round(x); y = Math.round(y);
    g.fillStyle(hexNum(P.void), 1); g.fillRect(x - 6, y - 2, 13, 4);
    g.fillStyle(hexNum(P.glassLit), 1); g.fillRect(x - 6, y - 1, 4, 2); g.fillRect(x + 3, y - 1, 4, 2);
    g.fillStyle(hexNum(P.glass), 1); g.fillRect(x - 4, y - 1, 1, 2); g.fillRect(x + 5, y - 1, 1, 2);
    g.fillStyle(hexNum(P.colHi), 1); g.fillRect(x - 1, y - 2, 3, 3);
    g.fillStyle(hexNum(P.hazard), 1); g.fillRect(x, y + 1, 1, 1);
    if (glowG && flare > 0) { glowG.fillStyle(hexNum(P.hazard), 0.35 * flare); glowG.fillCircle(x + 0.5, y + 1.5, 2 + 4 * flare); glowG.fillStyle(hexNum(P.hazardCore), 0.5 * flare); glowG.fillCircle(x + 0.5, y + 1.5, 1 + 1.5 * flare); }
  }

  fire(o) {
    const style = o.style || pickStyle(), list = this.paths(o.view, o.tx, o.ty, o.from, style);
    const paths = list.map(pts => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return { pts, cum, L: cum[cum.length - 1], passed: 0 }; });
    const travel = style === 'orbit' ? 0.4 : style === 'bend' ? 0.3 : STRIKE.travel;
    this.shot = { paths, style, travel, t: 0, P: o.P, onImpact: o.onImpact, hit: false, sat: { x: list[0][0].x, y: list[0][0].y - 3 }, small: !!o.small };
    if (this.sound) Sound.tone(2600, 0.22, 'sawtooth', 0.016, 900);
    return STRIKE.flare + travel + STRIKE.hold + STRIKE.die;
  }

  at(p, d) {
    const { pts, cum } = p;
    for (let i = 1; i < pts.length; i++) if (d <= cum[i] || i === pts.length - 1) { const u = Math.max(0, Math.min(1, (d - cum[i - 1]) / Math.max(0.001, cum[i] - cum[i - 1]))); return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u }; }
    return pts[pts.length - 1];
  }
  // draw one path between distances a and b
  span(g, p, a, b, width, color, alpha, dashed) {
    const { pts, cum } = p;
    g.lineStyle(width, color, alpha);
    for (let i = 1; i < pts.length; i++) {
      const lo = Math.max(a, cum[i - 1]), hi = Math.min(b, cum[i]); if (hi <= lo) continue;
      if (!dashed) { const q0 = this.at(p, lo), q1 = this.at(p, hi); g.lineBetween(q0.x, q0.y, q1.x, q1.y); continue; }
      for (let d = lo; d < hi; d += 7) { if (Math.random() < 0.35) continue; const q0 = this.at(p, d), q1 = this.at(p, Math.min(hi, d + 4)); g.lineBetween(q0.x, q0.y, q1.x, q1.y); }
    }
  }
  spark(x, y, n, speed, cols) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random()); this.bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: 0.25 + Math.random() * 0.35, t: 0, c: cols[i % cols.length] }); } }

  update(dt) {
    const g = this.glow, c = this.core; g.clear(); c.clear();
    dt = Math.min(dt || 1 / 60, 1 / 20);
    this.bits.forEach(b => { b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 120 * dt; });
    this.bits = this.bits.filter(b => b.t < b.life);
    const s = this.shot;
    if (s) {
      s.t = window.__strikeHold != null ? window.__strikeHold : s.t + dt; // tests can hold a moment
      const P = s.P, red = hexNum(P.hazard), white = hexNum(P.hazardCore), t = s.t;
      const tTravel = STRIKE.flare, tHit = tTravel + s.travel, tDie = tHit + STRIKE.hold, tEnd = tDie + STRIKE.die;
      // the satellite: a body, two panels, an emitter that flares
      const sat = s.sat, flare = t < tDie ? Math.min(1, t / STRIKE.flare) : Math.max(0, 1 - (t - tDie) / STRIKE.die);
      SatelliteStrike.drawSat(c, P, sat.x, sat.y, g, flare);
      const tg = s.paths[0].pts[s.paths[0].pts.length - 1];
      if (t >= tTravel && t < tHit) {
        // the head races along the path; each ricochet throws a spark and a small tick
        const u = ease((t - tTravel) / s.travel);
        s.paths.forEach(p => {
          const head = p.L * u;
          this.span(g, p, 0, head, 3, red, 0.4); this.span(c, p, 0, head, 1, white, 1);
          const h = this.at(p, head); c.fillStyle(0xffffff, 1); c.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 1, 2, 2);
          while (p.passed < p.pts.length - 2 && head >= p.cum[p.passed + 1]) { p.passed++; const v = p.pts[p.passed]; if (v.k) { this.spark(v.x, v.y, 6, 70, [white, red]); if (this.sound) Sound.tone(3200 - p.passed * 300, 0.035, 'square', 0.012); } else if (p.passed % 6 === 0) this.spark(v.x, v.y, 1, 20, [red]); }
        });
        // a lock box closes on her while the beam is on its way
        const r = 8 * (1 - (t - tTravel) / s.travel) + 3;
        c.lineStyle(1, red, 1); c.strokeRect(Math.round(tg.x - r), Math.round(tg.y - r), Math.round(2 * r), Math.round(2 * r));
      } else if (t >= tHit && t < tEnd) {
        if (!s.hit) { s.hit = true; this.spark(tg.x, tg.y, s.small ? 8 : 18, s.small ? 70 : 110, [white, red, hexNum(P.lamp)]); if (s.onImpact) s.onImpact(); }
        if (t < tDie) {
          // full beam, a little wider for a beat
          const pulse = 1 + 0.6 * Math.sin((t - tHit) * 60);
          s.paths.forEach(p => { this.span(g, p, 0, p.L, 3 + pulse, red, 0.45); this.span(c, p, 0, p.L, 1, white, 1); });
        } else {
          // dying out: the tail retracts toward her, the beam thins, flickers, breaks up, sheds embers
          const v = (t - tDie) / STRIKE.die, on = Math.random() > v * 0.5;
          s.paths.forEach(p => {
            const tail = p.L * ease(v);
            if (on) { this.span(g, p, tail, p.L, 3 * (1 - v) + 0.5, red, 0.4 * (1 - v)); this.span(c, p, tail, p.L, 1, white, 1 - v * 0.7, v > 0.45); }
            if (Math.random() < 0.8) { const d = tail + Math.random() * (p.L - tail), q = this.at(p, d); this.bits.push({ x: q.x, y: q.y, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 15, life: 0.3 + Math.random() * 0.3, t: 0, c: Math.random() < 0.5 ? red : white }); }
          });
        }
        // a scorch at the impact that cools
        const k = Math.max(0, 1 - (t - tHit) / STRIKE.scorch);
        g.fillStyle(red, 0.3 * k); g.fillCircle(tg.x, tg.y, 3 + 5 * (1 - k)); g.fillStyle(white, 0.6 * k * k); g.fillCircle(tg.x, tg.y, 1.5);
        g.lineStyle(1, red, 0.6 * k); g.strokeCircle(tg.x, tg.y, 4 + 14 * (1 - k));
      } else if (t >= tEnd) this.shot = null;
    }
    this.bits.forEach(b => { const a = 1 - b.t / b.life; g.fillStyle(b.c, a); g.fillRect(Math.round(b.x), Math.round(b.y), 1, 1); });
  }
}
