// The satellite strike. Every death comes from orbit: a tiny satellite at the top of the view
// flares, and a thin, precise beam leaves it, ricochets off the sides of the view on its way
// down, and hits her. Then the beam dies out from the satellite end toward the impact, thinning,
// flickering and shedding embers, and the scorch fades. Nothing comes from the viewer's side.
//
// Use: const s = new SatelliteStrike(scene, { depth: 8 }); in update: s.update(dt);
//      s.fire({ view: camera.worldView, tx, ty, P, onImpact }). Pass { parent: container } to
//      draw inside a container (the kids' room feed), in that container's local units.
import { hexNum } from './painter.js';
import { Sound } from '../core/sound.js';

export const STRIKE = { flare: 0.14, travel: 0.24, hold: 0.1, die: 0.52, scorch: 0.9 };
const ease = u => u * u * (3 - 2 * u);

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

  // Path: from the satellite at the top, the first leg crosses to the far side of the view, the
  // beam ricochets side to side on the way down, and the last leg crosses back into her.
  path(view, tx, ty, from) {
    const x0 = view.x + 1, x1 = view.x + view.width - 1, y0 = view.y, mid = view.x + view.width / 2;
    const sx = from != null ? from : (Math.random() < 0.5 ? x0 + view.width * (0.15 + Math.random() * 0.2) : x1 - view.width * (0.15 + Math.random() * 0.2));
    const first = sx < mid ? 1 : -1, last = tx < mid ? 1 : -1;
    let n = first === last ? 3 : 2; if (Math.random() < 0.35) n += 2;
    const top = y0 + 14, bottom = Math.max(top + 24, ty - 16);
    const pts = [{ x: sx, y: y0 + 6 }];
    for (let i = 0; i < n; i++) { const side = i % 2 ? -first : first, u = (i + 0.55 + Math.random() * 0.35) / (n + 0.2); pts.push({ x: side > 0 ? x1 : x0, y: top + (bottom - top) * u }); }
    pts.push({ x: tx, y: ty });
    return pts;
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
    const pts = this.path(o.view, o.tx, o.ty, o.from), cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    this.shot = { pts, cum, L: cum[cum.length - 1], t: 0, P: o.P, onImpact: o.onImpact, hit: false, passed: 0, sat: { x: pts[0].x, y: pts[0].y - 3 } };
    if (this.sound) Sound.tone(2600, 0.22, 'sawtooth', 0.016, 900);
    return STRIKE.flare + STRIKE.travel + STRIKE.hold + STRIKE.die;
  }

  at(d) {
    const s = this.shot, { pts, cum } = s;
    for (let i = 1; i < pts.length; i++) if (d <= cum[i] || i === pts.length - 1) { const u = Math.max(0, Math.min(1, (d - cum[i - 1]) / Math.max(0.001, cum[i] - cum[i - 1]))); return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u }; }
    return pts[pts.length - 1];
  }
  // draw the beam between distances a and b along the path
  span(g, a, b, width, color, alpha, dashed) {
    const s = this.shot, { pts, cum } = s;
    g.lineStyle(width, color, alpha);
    for (let i = 1; i < pts.length; i++) {
      const lo = Math.max(a, cum[i - 1]), hi = Math.min(b, cum[i]); if (hi <= lo) continue;
      if (!dashed) { const p = this.at(lo), q = this.at(hi); g.lineBetween(p.x, p.y, q.x, q.y); continue; }
      for (let d = lo; d < hi; d += 7) { if (Math.random() < 0.35) continue; const p = this.at(d), q = this.at(Math.min(hi, d + 4)); g.lineBetween(p.x, p.y, q.x, q.y); }
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
      const tTravel = STRIKE.flare, tHit = tTravel + STRIKE.travel, tDie = tHit + STRIKE.hold, tEnd = tDie + STRIKE.die;
      // the satellite: a body, two panels, an emitter that flares
      const sat = s.sat, flare = t < tDie ? Math.min(1, t / STRIKE.flare) : Math.max(0, 1 - (t - tDie) / STRIKE.die);
      SatelliteStrike.drawSat(c, P, sat.x, sat.y, g, flare);
      if (t >= tTravel && t < tHit) {
        // the head races along the path; each bounce throws a spark and a small tick
        const head = s.L * ease((t - tTravel) / STRIKE.travel);
        this.span(g, 0, head, 3, red, 0.4); this.span(c, 0, head, 1, white, 1);
        const h = this.at(head); c.fillStyle(0xffffff, 1); c.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 1, 2, 2);
        while (s.passed < s.pts.length - 2 && head >= s.cum[s.passed + 1]) { s.passed++; const v = s.pts[s.passed]; this.spark(v.x, v.y, 6, 70, [white, red]); if (this.sound) Sound.tone(3200 - s.passed * 300, 0.035, 'square', 0.012); }
        // a lock box closes on her while the beam is on its way
        const tg = s.pts[s.pts.length - 1], r = 8 * (1 - (t - tTravel) / STRIKE.travel) + 3;
        c.lineStyle(1, red, 1); c.strokeRect(Math.round(tg.x - r), Math.round(tg.y - r), Math.round(2 * r), Math.round(2 * r));
      } else if (t >= tHit && t < tEnd) {
        if (!s.hit) { s.hit = true; const tg = s.pts[s.pts.length - 1]; this.spark(tg.x, tg.y, 18, 110, [white, red, hexNum(P.lamp)]); if (s.onImpact) s.onImpact(); }
        const tg = s.pts[s.pts.length - 1];
        if (t < tDie) {
          // full beam, a little wider for a beat
          const pulse = 1 + 0.6 * Math.sin((t - tHit) * 60);
          this.span(g, 0, s.L, 3 + pulse, red, 0.45); this.span(c, 0, s.L, 1, white, 1);
        } else {
          // dying out: the tail retracts toward her, the beam thins, flickers, breaks up, sheds embers
          const v = (t - tDie) / STRIKE.die, tail = s.L * ease(v), on = Math.random() > v * 0.5;
          if (on) { this.span(g, tail, s.L, 3 * (1 - v) + 0.5, red, 0.4 * (1 - v)); this.span(c, tail, s.L, 1, white, 1 - v * 0.7, v > 0.45); }
          if (Math.random() < 0.8) { const d = tail + Math.random() * (s.L - tail), p = this.at(d); this.bits.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 15, life: 0.3 + Math.random() * 0.3, t: 0, c: Math.random() < 0.5 ? red : white }); }
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
