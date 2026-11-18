// The opening, in pixels (Ash and Gold). It starts on the title picture: the siblings on an ash
// ridge, the dead city behind, and across the valley the only lit thing left, the mansion. The
// title fades, they talk, he goes down for supplies, the show's camera locks on to her, hours
// pass, and she follows him down. Then the gate (episode 1).
import { Music } from '../core/music.js';
import { goNext } from '../core/flow.js';
import { reviewKeys } from '../core/review.js';
import { makeControls } from '../core/controls.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { typer } from '../ui/typer.js';
import { pixelZoom } from '../core/display.js';
import { hexNum, rng } from '../art/painter.js';
import { ASH as A } from '../art/palettes.js';
import { WORLD_W, DOOR, ROAD, CREST, ridgeY, paintBack, paintMoon, paintValley, paintRidge, figureRects, paintTitleText } from '../art/title.js';
import { RIDGE as LINES, RIDGE_ALONE, SOUNDS, lineSeconds } from '../data/dialogue.js';

const VALLEY_F = 0.6, BACK_F = 0.25;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

// the drone show over the house: gold points that keep re-forming (unit box 64 x 30)
function outline(pts, n) {
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l]); total += l; }
  const out = []; for (let k = 0; k < n; k++) { let d = (k / n) * total; for (const [a, b, l] of segs) { if (d <= l) { out.push([a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]); break; } d -= l; } }
  return out;
}
const DOTS = 44;
const FIG = {
  diamond: () => outline([[14, 8], [22, 0], [42, 0], [50, 8], [32, 30], [14, 8], [50, 8]], DOTS),
  crown: () => outline([[10, 28], [10, 6], [20, 18], [32, 0], [44, 18], [54, 6], [54, 28], [10, 28]], DOTS),
  ring: () => Array.from({ length: DOTS }, (_, i) => { const a = i / DOTS * Math.PI * 2; return [32 + Math.cos(a) * 14, 15 + Math.sin(a) * 14]; }),
  tv: () => outline([[22, -6], [30, 4], [38, -6], [30, 4], [14, 4], [50, 4], [50, 30], [14, 30], [14, 4]], DOTS)
};
const SHOW = [['diamond', 6], ['crown', 6], ['ring', 4], ['tv', 1.2], ['diamond', 6], ['crown', 5]];

export class Intro extends Phaser.Scene {
  constructor() { super('intro'); }

  create() {
    const cam = this.cameras.main;
    cam.setZoom(pixelZoom()); cam.setRoundPixels(true); cam.setBackgroundColor(hexNum(A.ash1));
    cam.centerOn(160, 90);
    this.scale.on('rescale', this.onRescale, this);
    this.ctl = makeControls(this);

    const tex = (key, p) => { if (!this.textures.exists(key)) p.toTexture(this, key); return key; };
    // parallax by hand: each layer is shifted by the camera's pan times (1 - its factor)
    this.layers = [];
    const lay = (o, f) => { this.layers.push([o, f, o.x]); return o; };
    lay(this.add.image(0, 0, tex('ti_back', paintBack())).setOrigin(0).setDepth(-50), BACK_F);
    this.moon = lay(this.add.image(250, 22, tex('ti_moon', paintMoon())).setOrigin(0).setDepth(-49), 0.1);
    this.sky = lay(this.add.graphics().setDepth(-48), 0.1);      // the satellite
    this.valleyFx = lay(this.add.graphics().setDepth(-41), VALLEY_F); // searchlights, the drone show
    lay(this.add.image(0, 0, tex('ti_valley', paintValley())).setOrigin(0).setDepth(-40), VALLEY_F);
    this.walkerG = lay(this.add.graphics().setDepth(-39), VALLEY_F); // tiny figures on the valley road
    this.ashG = lay(this.add.graphics().setDepth(-30), 0.5);
    this.add.image(0, 0, tex('ti_ridge', paintRidge())).setOrigin(0).setDepth(-20);
    this.figG = this.add.graphics().setDepth(-10);
    this.titleG = lay(this.add.graphics().setDepth(20), 0);
    this.boxG = this.add.graphics().setDepth(30);                             // the show's lock-on box

    const r = rng(19);
    this.ash = Array.from({ length: 70 }, () => ({ x: r() * WORLD_W, y: r() * 180, v: 6 + r() * 10, d: 2 + r() * 5, c: r() < 0.7 ? A.ash3 : A.ash4 }));
    this.show = Array.from({ length: DOTS }, () => ({ x: DOOR.x + (r() - 0.5) * 60, y: 70 + r() * 20, tx: 0, ty: 0 }));
    this.figureAt = -1;

    this.buildTimeline();
    this.t = 0; this.w = 0; this.done = false;
    this.wind = Sound.wind(0.18); this.music = null;
    Music.play('opening', { fadeIn: 3 });
    this.events.once('shutdown', () => { this.wind.stop(0.6); if (this.music) this.music.stop(0.6); overlay.clearCaption(); this.scale.off('rescale', this.onRescale, this); });
    overlay.hint('Space or Enter moves to the next line. Esc skips the opening.');
    window.__game = { scene: this, state };
  }
  onRescale() { const c = this.cameras.main; c.setZoom(pixelZoom()); c.centerOn(160 + (this.sx || 0), 90); }

  // ------------------------------------------------------------------ the script
  buildTimeline() {
    const T = {}; let t = 2.4;
    T.lines = LINES.map(l => { const s = t; t += lineSeconds(l.text); return { ...l, start: s, end: t }; });
    T.goDown = t + 0.4; T.ridgeEnd = T.goDown + 4.2; T.downEnd = T.ridgeEnd + 4;
    T.drone = T.downEnd + 0.3; T.droneEnd = T.drone + 2.8;
    T.later = T.droneEnd + 0.3; T.alone = T.later + 3.4; T.aloneEnd = T.alone + lineSeconds(RIDGE_ALONE.text);
    T.follow = T.aloneEnd + 0.3; T.followRidge = T.follow + 4.6; T.followEnd = T.followRidge + 3.6;
    T.end = T.followEnd + 1.4;
    this.T = T;
  }
  skipAhead() { this.finish(true); }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 20), c = this.ctl, T = this.T;
    if (reviewKeys(this)) { c.endFrame(); return; }
    if (c.skip()) { this.finish(true); c.endFrame(); return; }
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    this.t += dt;
    const warp = this.t > T.later && this.t < T.alone ? 6 : 1;
    this.w += dt * warp;
    this.direct(this.t);
    this.draw(this.t, dt * warp);
    c.endFrame();
    if (this.t >= T.end && !this.done) this.finish(false);
  }

  // where each sibling is, from the clock alone (so skipping never strands anyone)
  pose(t) {
    const T = this.T;
    const bro = { kind: 'brother', x: CREST.bro, face: 1, step: 0, point: 0, valley: null, hide: false };
    const sis = { kind: 'sister', x: CREST.sis, face: 1, step: 0, crouch: false, valley: null, hide: false };
    if (t < T.goDown) {
      let bc = {}, sc = {}; T.lines.forEach(l => { if (l.start <= t) { if (l.bro) bc = Object.assign({}, bc, l.bro); if (l.sis) sc = Object.assign({}, sc, l.sis); } });
      bro.face = bc.face || 1; sis.face = sc.face || 1;
      const line = T.lines.find(l => t >= l.start && t < l.end);
      bro.point = line && line.bro && line.bro.point ? 1 : 0;
    } else {
      const down = (who, t0, t1, t2) => {
        if (t < t0) return;
        if (t < t1) { const u = (t - t0) / (t1 - t0); who.x = Math.round(lerp(CREST[who.kind === 'brother' ? 'bro' : 'sis'], 186, u)); who.step = Math.floor(t * 6) % 2; who.face = 1; return; }
        who.hide = true;
        if (t < t2) { const u = Math.min(1, (t - t1) / (t2 - t1)), f = u * (ROAD.length - 1), i = Math.min(ROAD.length - 2, Math.floor(f)), k = f - i; who.valley = [lerp(ROAD[i][0], ROAD[i + 1][0], k), lerp(ROAD[i][1], ROAD[i + 1][1], k), Math.floor(t * 5) % 2]; }
      };
      down(bro, T.goDown, T.ridgeEnd, T.downEnd);
      if (t < T.follow) { sis.crouch = t > T.goDown + 1; sis.face = 1; }
      down(sis, T.follow + 0.6, T.followRidge, T.followEnd);
    }
    return [bro, sis];
  }

  direct(t) {
    const T = this.T;
    if (t > 0.4 && !this.windCap) { this.windCap = true; overlay.caption(null, SOUNDS.wind); this.time.delayedCall(1800, () => { if (this.t < T.lines[0].start) overlay.clearCaption(); }); }
    const line = T.lines.find(l => t >= l.start && t < l.end);
    if (line !== this.curLine) {
      this.curLine = line;
      // a press finishes the line; the next press goes to the next line (ui/typer.js takes the keys)
      if (line) overlay.caption(line.who, line.text, { block: true, scene: this, onAdvance: () => this.nextLine(line) });
      else if (t >= T.goDown - 0.1 && t < T.later) overlay.clearCaption();
    }
    if (t >= T.lines[0].start && !this.hum) { this.hum = true; this.time.delayedCall(800, () => { this.music = Sound.lounge(0.02); }); }
    // the show's camera finds her: the amber lock-on box (the only amber in the game)
    if (t >= T.drone && !this.droneOn) { this.droneOn = true; overlay.clearCaption(); overlay.bug('CH 07', 2600); overlay.rec(2600); Sound.tone(220, 0.5, 'sawtooth', 0.012, 330); Sound.tone(1800, 0.05, 'square', 0.01); }
    if (t >= T.later && !this.laterShown) { this.laterShown = true; overlay.caption(null, SOUNDS.later); }
    if (t >= T.alone && !this.aloneShown) { this.aloneShown = true; overlay.caption(RIDGE_ALONE.who, RIDGE_ALONE.text); }
    if (t >= T.aloneEnd && !this.aloneCleared) { this.aloneCleared = true; overlay.clearCaption(); }
    if (t >= T.followEnd && !this.fading) { this.fading = true; this.cameras.main.fadeOut(1300, 0, 0, 0); }
  }

  // the opening's clock jumps to the next line (or past the talk) when a line that is out is pressed
  nextLine(line) {
    const T = this.T;
    if (this.curLine !== line || this.t >= T.goDown) return;
    const next = T.lines.find(l => l.start > this.t); this.t = next ? next.start : T.goDown;
  }

  draw(t, dtW) {
    const T = this.T, cam = this.cameras.main, w = this.w;
    // camera: the title framing, then a slow drift toward the house as each of them goes down
    let sx = 0;
    if (t >= T.goDown) sx = lerp(0, 34, ease(Math.min(1, (t - T.goDown) / (T.downEnd - T.goDown))));
    if (t >= T.follow) sx = lerp(34, 70, ease(Math.min(1, (t - T.follow) / (T.followEnd - T.follow))));
    this.sx = Math.round(sx); cam.centerOn(160 + this.sx, 90);
    this.layers.forEach(([o, f, x0]) => { o.x = x0 + Math.round(this.sx * (1 - f)); });
    // hours pass: the moon slides down the sky
    this.moon.y = 22 + Math.max(0, Math.min(w, T.alone + 14) - T.later) * 0.9;

    // the satellite crossing, always
    const s = this.sky; s.clear(); s.fillStyle(hexNum(A.red), 1);
    const satX = Math.round(160 + (w * 2.2)) % 360, satY = 24 + Math.round(Math.sin(w * 0.05) * 2);
    s.fillRect(satX, satY, 1, 1); s.fillRect(satX - 2, satY, 1, 1); s.fillRect(satX + 2, satY, 1, 1);

    // ash
    const g = this.ashG; g.clear();
    this.ash.forEach(a => { a.y += a.v * dtW; a.x += a.d * dtW; if (a.y > 180) { a.y = -2; a.x = Math.random() * WORLD_W; } if (a.x > WORLD_W) a.x -= WORLD_W; g.fillStyle(hexNum(a.c), 1); g.fillRect(Math.round(a.x), Math.round(a.y), 1, 1); });

    // the house: two searchlights sweeping, the drone show re-forming
    const v = this.valleyFx; v.clear();
    [[200, 113, 0.33], [266, 98, 0.41]].forEach(([x, y, f], i) => {
      const ang = -Math.PI / 2 + Math.sin(w * f + i * 2) * 0.55; v.fillStyle(hexNum(A.goldLo), 1);
      for (let k = 4; k < 90; k += 3) v.fillRect(Math.round(x + Math.cos(ang) * k), Math.round(y + Math.sin(ang) * k), 1, 1);
    });
    const total = SHOW.reduce((n, x) => n + x[1], 0); let m = w % total, idx = 0; while (m > SHOW[idx][1]) { m -= SHOW[idx][1]; idx++; }
    if (idx !== this.figureAt) {
      this.figureAt = idx; const pts = FIG[SHOW[idx][0]](), order = pts.map((_, i) => i).sort(() => Math.random() - 0.5);
      this.show.forEach((d, i) => { const p = pts[order[i]]; d.tx = DOOR.x - 24 + p[0] * 0.75; d.ty = 62 + p[1] * 0.75; });
    }
    this.show.forEach((d, i) => { d.x += (d.tx - d.x) * Math.min(1, dtW * 1.8); d.y += (d.ty - d.y) * Math.min(1, dtW * 1.8); v.fillStyle(hexNum(i % 3 ? A.gold : A.goldHi), 1); v.fillRect(Math.round(d.x), Math.round(d.y), 1, 1); });

    // the siblings
    const fg = this.figG; fg.clear(); const wk = this.walkerG; wk.clear();
    const [bro, sis] = this.pose(t);
    [bro, sis].forEach(p => {
      if (!p.hide) figureRects(p.kind, p.x, ridgeY(p.x), p).forEach(([x, y, ww, hh, c]) => { fg.fillStyle(hexNum(c), 1); fg.fillRect(x, y, ww, hh); });
      if (p.valley) { const [x, y, st] = p.valley, h = p.kind === 'brother' ? 4 : 3; wk.fillStyle(hexNum(A.ash0), 1); wk.fillRect(Math.round(x), Math.round(y) - h, 1, h); wk.fillRect(Math.round(x) + (st ? 1 : -1), Math.round(y) - 1, 1, 1); }
    });

    // the title fades as the show starts
    const tg = this.titleG; tg.clear();
    const ta = 1 - Math.min(1, t / 1.6);
    if (ta > 0) paintTitleText(tg, ta);

    // the lock-on box: amber corners closing on her
    const bg = this.boxG; bg.clear();
    if (t >= T.drone && t < T.droneEnd) {
      const u = Math.min(1, (t - T.drone) / 0.9), half = Math.round(lerp(18, 9, ease(u)));
      const cx = sis.x, cy = ridgeY(sis.x) - 5, x0 = cx - half, y0 = cy - half, x1 = cx + half, y1 = cy + half, n = 4;
      bg.fillStyle(hexNum(A.amber), 1);
      [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, dx, dy]) => { for (let i = 0; i < n; i++) { bg.fillRect(x + i * dx, y, 1, 1); bg.fillRect(x, y + i * dy, 1, 1); } });
      if (u >= 1 && Math.floor(t * 4) % 2 === 0) bg.fillRect(cx, cy, 1, 1);
    }
  }

  finish(skipped) {
    if (this.done) return;
    this.done = true; state.seenIntro = true;
    overlay.clearCaption();
    const go = () => { if (!goNext(this, 'intro')) this.scene.start('grounds', { fromIntro: true }); }; // goNext saves her place for Continue
    if (skipped) { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(420, go); } else go();
  }
}
