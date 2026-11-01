// The opening: a dead city under ash, two siblings on a ridge, and across the valley a mansion
// that is perfectly lit. They talk, he goes down for supplies, she waits, then follows; the
// picture breaks into pixels and the game begins at the gate.
import { LOOKS } from '../art/palettes.js';
import { cinemaPalette, makeCinemaTextures, skyline, ridgeShape, drawMansion, drawFigure, mix, num } from '../art/cinema.js';
import { makeControls } from '../core/controls.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { designZoom } from '../core/display.js';
import { RIDGE, RIDGE_ALONE, SOUNDS, lineSeconds } from '../data/dialogue.js';

const C0 = { x: 1350, y: 470 };           // the reveal framing; parallax layers sit at their base positions here
const GATE = { x: 1650, y: 640 };         // the mansion door, in the valley layer
const VALLEY_F = 0.55;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

// drone show figures (unit box 0..64 x 0..30), scaled up over the house
function outline(pts, n) {
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l]); total += l; }
  const out = []; for (let k = 0; k < n; k++) { let d = (k / n) * total; for (const [a, b, l] of segs) { if (d <= l) { out.push([a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]); break; } d -= l; } }
  return out;
}
const N = 130;
const FIG = {
  diamond: () => outline([[14, 8], [22, 0], [42, 0], [50, 8], [32, 30], [14, 8], [50, 8], [42, 0], [36, 8], [32, 0], [28, 8], [22, 0]], N),
  crown: () => outline([[10, 28], [10, 6], [20, 18], [32, 0], [44, 18], [54, 6], [54, 28], [10, 28]], N),
  ring: () => Array.from({ length: N }, (_, i) => { const a = i / N * Math.PI * 2; return [32 + Math.cos(a) * 15, 15 + Math.sin(a) * 15]; }),
  tv: () => outline([[22, -6], [30, 4], [38, -6], [30, 4], [14, 4], [50, 4], [50, 30], [14, 30], [14, 4], [20, 10], [27, 10], [27, 24], [20, 24], [20, 10], [33, 10], [42, 10], [36, 24]], N)
};

export class Intro extends Phaser.Scene {
  constructor() { super('intro'); }

  create() {
    const P = LOOKS[state.look], C = this.C = cinemaPalette(P);
    makeCinemaTextures(this, C);
    const cam = this.cameras.main;
    cam.setBackgroundColor(num(C.sky0));
    this.ctl = makeControls(this);
    this.par = [];
    const par = (obj, f, x, y) => { this.par.push({ o: obj, f, x, y }); return obj; };

    // fixed to the camera
    this.sky = this.add.image(0, 0, 'c_sky').setDepth(-100);
    // far to near
    const stars = this.add.graphics().setDepth(-90); par(stars, 0.02, 0, 0);
    const sr = Phaser.Math.RND; sr.sow(['stars']);
    this.starList = Array.from({ length: 170 }, () => ({ x: sr.between(-400, 2400), y: sr.between(-200, 560), r: sr.realInRange(0.6, 1.5), p: sr.realInRange(0, 6) }));
    this.starsG = stars;
    this.moon = par(this.add.image(0, 0, 'c_moon').setDepth(-85).setScale(1.1), 0.04, 900, 250);
    this.smoke = [0, 1, 2].map(i => par(this.add.image(0, 0, 'c_smoke').setDepth(-80).setScale(3.2, 2.2).setAlpha(0.8), 0.1, -300 + i * 1500, 420));
    const far = skyline(11, -900, 3400, 640, 50, 170), mid = skyline(23, -900, 1500, 712, 90, 260);
    const farG = par(this.add.graphics().setDepth(-70), 0.2, 0, 0);
    farG.fillStyle(num(C.cityFar), 1); far.polys.forEach(p => farG.fillPoints(p.map(([x, y]) => ({ x, y })), true)); farG.fillRect(-900, 638, 4300, 300);
    this.farLights = far.lights; this.farLightsG = par(this.add.graphics().setDepth(-69).setBlendMode(Phaser.BlendModes.ADD), 0.2, 0, 0);
    const haze = par(this.add.image(0, 0, 'c_glow').setDepth(-68).setTint(num(C.smoke)).setAlpha(0.55).setScale(40, 2.2), 0.2, 900, 650);
    const midG = par(this.add.graphics().setDepth(-60), 0.35, 0, 0);
    midG.fillStyle(num(C.cityMid), 1); mid.polys.forEach(p => midG.fillPoints(p.map(([x, y]) => ({ x, y })), true)); midG.fillRect(-900, 710, 2400, 300);
    this.midLights = mid.lights; this.midLightsG = par(this.add.graphics().setDepth(-59).setBlendMode(Phaser.BlendModes.ADD), 0.35, 0, 0);

    // the valley: glow, beams, the house, the drone show
    par(this.add.image(0, 0, 'c_glow').setDepth(-66).setTint(num(C.ember)).setAlpha(0.3).setScale(16, 2.4).setBlendMode(Phaser.BlendModes.ADD), 0.2, -300, 660);
    this.houseGlow = par(this.add.image(0, 0, 'c_glow').setDepth(-50).setTint(num(C.gold)).setAlpha(0.42).setScale(14, 5.5).setBlendMode(Phaser.BlendModes.ADD), VALLEY_F, GATE.x - 40, GATE.y - 110);
    const HS = this.HS = 1.5;
    this.anchors = [[-180, -14], [-120, -14], [-45, -50], [95, -46], [150, -2], [221, -96]];
    this.beams = this.anchors.map((a, i) => par(this.add.image(0, 0, 'c_beam').setOrigin(0.5, 1).setDepth(-49).setTint(num(i % 2 ? C.shaft : C.lamp)).setAlpha(0.36).setScale(1.6, 1.5).setBlendMode(Phaser.BlendModes.ADD), VALLEY_F, GATE.x + (a[0] - 95) * HS, GATE.y + (a[1] - 112) * HS));
    const house = par(this.add.graphics().setDepth(-45).setScale(HS), VALLEY_F, GATE.x - 95 * HS, GATE.y - 112 * HS);
    drawMansion(house, C);
    // soft light: window rows, the dome, the door and its reflection
    const glow = (lx, ly, sx, sy, col, a) => par(this.add.image(0, 0, 'c_glow').setDepth(-44).setScale(sx, sy).setTint(num(col)).setAlpha(a).setBlendMode(Phaser.BlendModes.ADD), VALLEY_F, GATE.x + (lx - 95) * HS, GATE.y + (ly - 112) * HS);
    glow(-45, 58, 1.6, 0.7, C.lamp, 0.35); glow(-45, -6, 1.2, 0.8, C.gold, 0.3); glow(221, 30, 0.9, 2.2, C.win, 0.22); glow(-175, 50, 1.6, 1.6, C.glassLit, 0.14);
    glow(95, 128, 2.6, 0.35, C.winHi, 0.4); glow(95, 70, 0.9, 1.1, C.winHi, 0.35);
    this.doorGlow = par(this.add.image(0, 0, 'c_glow').setDepth(-44).setTint(num(C.winHi)).setAlpha(0.5).setScale(1.2).setBlendMode(Phaser.BlendModes.ADD), VALLEY_F, GATE.x, GATE.y - 20);
    this.show = Array.from({ length: N }, (_, i) => {
      const o = this.add.image(0, 0, 'c_dot').setDepth(-48).setScale(0.5).setBlendMode(Phaser.BlendModes.ADD).setTint([num(C.goldHi), num('#ffffff'), num(C.glassLit), num(C.lamp)][i % 4]);
      return { o, x: GATE.x + (Math.random() - 0.5) * 300, y: GATE.y - 250 - Math.random() * 80, tx: 0, ty: 0 };
    });
    this.figureAt = -1;

    // the ridge and the siblings
    const ridge = par(this.add.graphics().setDepth(-20), 1, 0, 0);
    this.ridgePts = ridgeShape();
    ridge.fillStyle(num(C.ink), 1); ridge.fillPoints(this.ridgePts.map(([x, y]) => ({ x, y })), true);
    // the house lights the crest and the slope facing it
    const rs = this.ridgePts; for (let i = 6; i < 14; i++) { ridge.lineStyle(2.5, num(C.rim), 0.25 + (i > 8 ? 0.35 : 0.1)); ridge.lineBetween(rs[i][0], rs[i][1] + 1, rs[i + 1][0], rs[i + 1][1] + 1); }
    // a dead tree, a road sign, rebar and a car on the ridge
    ridge.lineStyle(6, num(C.ink), 1); ridge.lineBetween(250, 648, 246, 500); ridge.lineStyle(3.5, num(C.ink), 1);
    [[248, 560, 192, 504], [247, 540, 300, 470], [248, 515, 224, 450], [276, 495, 318, 456], [212, 520, 196, 480]].forEach(([a, b, c, d]) => ridge.lineBetween(a, b, c, d));
    ridge.fillStyle(num(C.ink), 1); ridge.fillRect(560, 560, 5, 64); ridge.fillPoints([{ x: 540, y: 540 }, { x: 600, y: 548 }, { x: 596, y: 572 }, { x: 536, y: 566 }], true);
    ridge.fillRoundedRect(-160, 612, 130, 34, 10); ridge.fillRoundedRect(-130, 590, 74, 30, 10);
    ridge.lineStyle(2, num(C.ink), 1); [[700, 610, 690, 570], [712, 608, 728, 574], [720, 608, 720, 582]].forEach(([a, b, c, d]) => ridge.lineBetween(a, b, c, d));
    this.figG = this.add.graphics().setDepth(-10);
    this.reticle = this.add.graphics().setDepth(40);

    // ash, near and far
    const ashZone = new Phaser.Geom.Rectangle(-300, -100, 2800, 40);
    this.add.particles(0, 0, 'c_dot', { emitZone: { type: 'random', source: ashZone }, speedY: { min: 10, max: 26 }, speedX: { min: 4, max: 18 }, lifespan: 40000, frequency: 22, advance: 30000, scale: { min: 0.08, max: 0.18 }, alpha: { min: 0.25, max: 0.6 }, tint: [num(mix(C.col, '#888888', 0.6)), num('#9a9490')] }).setDepth(-15);
    this.add.particles(0, 0, 'c_dot', { emitZone: { type: 'random', source: ashZone }, speedY: { min: 22, max: 46 }, speedX: { min: 10, max: 30 }, lifespan: 30000, frequency: 90, advance: 25000, scale: { min: 0.25, max: 0.45 }, alpha: { min: 0.15, max: 0.35 }, tint: num('#b7b0a8') }).setDepth(30);

    // film: grain, vignette, letterbox
    this.grain = this.add.tileSprite(0, 0, 1280, 720, 'c_grain').setDepth(50).setAlpha(0.55);
    this.vig = this.add.image(0, 0, 'c_vignette').setDepth(51);
    this.bars = [this.add.rectangle(0, 0, 10, 10, 0x000000).setDepth(52), this.add.rectangle(0, 0, 10, 10, 0x000000).setDepth(52)];

    this.buildTimeline();
    this.t = 0; this.done = false; this.nightFx = null; this.pixFx = null;
    this.bro = { x: 520, y: 600, s: 1, face: 1, walk: null, crouch: 0, point: 0, look: 0, breathe: 0, alpha: 1 };
    this.sis = { x: 470, y: 600, s: 1, face: 1, walk: null, crouch: 0, point: 0, look: 0, breathe: 1, alpha: 1 };
    this.wind = Sound.wind(0.18); this.music = null;
    this.events.once('shutdown', () => { this.wind.stop(0.6); if (this.music) this.music.stop(0.6); overlay.clearCaption(); this.cameras.main.filters.internal.clear(); });
    overlay.hint('Space or Enter moves to the next line. Esc skips the opening.');
    cam.fadeIn(1400);
    window.__game = { scene: this, state };
  }

  // ------------------------------------------------------------------ the script
  buildTimeline() {
    const T = {}; let t = 0;
    T.city = 0; T.walkIn = 5.5; T.reveal = 15; t = 20.5;
    T.lines = RIDGE.map(l => { const s = t; t += lineSeconds(l.text); return { ...l, start: s, end: t }; });
    T.goDown = t + 0.4; T.downEnd = T.goDown + 6.5;
    T.drone = T.downEnd + 0.2; T.droneEnd = T.drone + 2.6;
    T.later = T.droneEnd + 0.2; T.alone = T.later + 4.6; T.aloneEnd = T.alone + lineSeconds(RIDGE_ALONE.text);
    T.follow = T.aloneEnd + 0.3; T.followEnd = T.follow + 7;
    T.end = T.followEnd + 2.2;
    this.T = T;
    // camera keyframes: time, center x, center y, zoom
    this.keys = [
      [0, -470, 470, 1.08], [T.walkIn, -380, 470, 1.08], [T.reveal, 760, 462, 1.04],
      [T.reveal + 4.5, C0.x, C0.y, 1], [T.lines[T.lines.length - 1].end, 1300, 486, 1.12],
      [T.goDown, 1300, 486, 1.12], [T.downEnd, 1360, 480, 1.04],
      [T.later, 1360, 480, 1.04], [T.aloneEnd, 1240, 500, 1.22],
      [T.follow, 1240, 500, 1.22], [T.followEnd, 1900, 740, 2.6], [T.end, 1930, 752, 2.9]
    ];
  }
  camAt(t) {
    const k = this.keys;
    if (t <= k[0][0]) return k[0];
    for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) { const a = k[i], b = k[i + 1], u = ease((t - a[0]) / Math.max(0.001, b[0] - a[0])); return [t, lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; }
    return k[k.length - 1];
  }
  // the path down: ridge points (foreground) then the valley road (seen from far away)
  pathAt(u, camX, camY) {
    const ridge = [[905, 602], [1010, 616], [1080, 668], [1160, 718], [1225, 742]];
    const road = [[1300, 700], [1450, 680], [1580, 652], [GATE.x, GATE.y]];
    const valley = ([x, y]) => [x + (camX - C0.x) * (1 - VALLEY_F), y + (camY - C0.y) * (1 - VALLEY_F)];
    const pts = ridge.concat(road.map(valley));
    const scales = [1, 1, 0.95, 0.85, 0.72, 0.5, 0.36, 0.26, 0.19];
    const f = Math.min(0.999, Math.max(0, u)) * (pts.length - 1), i = Math.floor(f), r = f - i;
    return { x: lerp(pts[i][0], pts[i + 1][0], r), y: lerp(pts[i][1], pts[i + 1][1], r), s: lerp(scales[i], scales[i + 1], r) };
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 20), c = this.ctl, T = this.T;
    if (c.skip()) { this.finish(true); c.endFrame(); return; }
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    // Space or Enter jumps to the next line while they talk
    if (c.advance() && this.t > T.lines[0].start && this.t < T.goDown) { const next = T.lines.find(l => l.start > this.t); this.t = next ? next.start : T.goDown; }
    this.t += dt;
    const t = this.t;
    this.direct(t, dt);
    this.place(t);
    c.endFrame();
    if (t >= T.end && !this.done) this.finish(false);
  }

  direct(t, dt) {
    const T = this.T, b = this.bro, s = this.sis;
    b.breathe += dt * 1.6; s.breathe += dt * 1.9;
    const groundY = x => { const r = this.ridgePts; for (let i = 0; i < r.length - 1; i++) if (x >= r[i][0] && x <= r[i + 1][0]) return lerp(r[i][1], r[i + 1][1], (x - r[i][0]) / (r[i + 1][0] - r[i][0])); return 640; };
    const CREST_B = 868, CREST_S = 922;
    // Every position comes from the clock alone, so skipping ahead never strands anyone.
    b.s = s.s = 1; b.alpha = s.alpha = 1; b.walk = s.walk = null; b.crouch = s.crouch = 0;
    if (t < T.walkIn) { b.alpha = s.alpha = 0; }
    else if (t < T.walkIn + 8.5) {
      const u = (t - T.walkIn) / 8.5;
      b.x = lerp(-1040, CREST_B, Math.min(1, u * 1.04)); s.x = lerp(-1100, CREST_S, Math.min(1, u));
      b.walk = u < 0.96 ? t * 7.2 : null; s.walk = u < 1 ? t * 8.4 + 1 : null; b.face = s.face = 1;
    } else { b.x = CREST_B; s.x = CREST_S; }
    b.y = groundY(b.x); s.y = groundY(s.x);
    // reveal sounds
    if (t >= T.reveal && !this.revealed) { this.revealed = true; Sound.swell(7, 0.07); this.time.delayedCall(2500, () => { this.music = Sound.lounge(0.022); }); if (t < T.lines[0].start) { overlay.caption(null, SOUNDS.hum); this.time.delayedCall(2600, () => { if (this.t < T.lines[0].start) overlay.clearCaption(); }); } }
    if (t > 1 && t < 4.5 && !this.windCap) { this.windCap = true; overlay.caption(null, SOUNDS.wind); this.time.delayedCall(2200, () => { if (this.t < T.reveal) overlay.clearCaption(); }); }
    // dialogue and gestures
    const line = T.lines.find(l => t >= l.start && t < l.end);
    if (line !== this.curLine) {
      this.curLine = line;
      if (line) overlay.caption(line.who, line.text);
      else if (t >= T.goDown - 0.1 && t < T.later) overlay.clearCaption();
    }
    if (t >= T.lines[0].start && t < T.goDown) {
      // the latest cue at or before now decides where each one faces
      let bc = {}, sc = {}; T.lines.forEach(l => { if (l.start <= t) { if (l.bro) bc = Object.assign({}, bc, l.bro); if (l.sis) sc = Object.assign({}, sc, l.sis); } });
      b.face = bc.face || 1; s.face = sc.face || 1; s.look = sc.look || 0;
      this.pointNow = lerp(this.pointNow || 0, line && line.bro && line.bro.point ? 1 : 0, Math.min(1, dt * 4));
      b.point = this.pointNow;
    } else b.point = 0;
    // he goes down; she crouches to watch
    if (t >= T.goDown) {
      const u = Math.min(1, (t - T.goDown) / (T.downEnd - T.goDown));
      const p = this.pathAt(u, this.camX, this.camY);
      b.x = p.x; b.y = p.y; b.s = p.s; b.face = 1; b.walk = u < 1 ? t * 7 : null; b.alpha = u >= 0.995 ? 0 : u > 0.9 ? Math.max(0, 1 - (u - 0.9) / 0.1) : 1;
      s.face = 1; s.crouch = Math.min(1, (t - T.goDown) / 1.2) * 0.85;
    }
    // drone's-eye view: night vision, a reticle on her, on air
    if (t >= T.drone && t < T.droneEnd) {
      if (!this.nightFx) {
        try {
          this.nightFx = this.cameras.main.filters.internal.addColorMatrix();
          this.nightFx.colorMatrix.set([0.12, 0.3, 0.1, 0, 0, 0.55, 1.45, 0.5, 0, 0, 0.08, 0.22, 0.08, 0, 0, 0, 0, 0, 1, 0]);
        } catch (e) { this.nightFx = null; }
        overlay.clearCaption(); overlay.bug('CH 07', 2400); overlay.note('● REC', 2400);
        Sound.tone(220, 0.5, 'sawtooth', 0.012, 330); Sound.tone(1800, 0.05, 'square', 0.01);
      }
    } else if (this.nightFx) { this.cameras.main.filters.internal.remove(this.nightFx); this.nightFx = null; }
    // hours later, alone
    if (t >= T.later && !this.laterShown) { this.laterShown = true; overlay.caption(null, SOUNDS.later); }
    if (t >= T.alone && !this.aloneShown) { this.aloneShown = true; overlay.caption(RIDGE_ALONE.who, RIDGE_ALONE.text); }
    if (t >= T.aloneEnd && !this.aloneCleared) { this.aloneCleared = true; overlay.clearCaption(); }
    // she follows
    if (t >= T.follow) {
      const u = Math.min(1, (t - T.follow) / (T.followEnd - T.follow));
      s.crouch = Math.max(0, 0.85 - (t - T.follow) * 1.2);
      if (t - T.follow > 0.7) { const p = this.pathAt(Math.min(1, (u - 0.1) / 0.9), this.camX, this.camY); s.x = p.x; s.y = p.y; s.s = p.s; s.walk = u < 1 ? t * 8 : null; }
    }
  }

  place(t) {
    const cam = this.cameras.main; let [, cx, cy, k] = this.camAt(t);
    if (t >= this.T.follow + 0.7) {
      // keep her and the door in frame while pushing in
      const u = ease(Math.min(1, (t - this.T.follow - 0.7) / (this.T.followEnd - this.T.follow - 0.7)));
      const px = this.camX == null ? cx : this.camX, py = this.camY == null ? cy : this.camY;
      const door = { x: GATE.x + (px - C0.x) * (1 - VALLEY_F), y: GATE.y - 30 + (py - C0.y) * (1 - VALLEY_F) };
      const mid = { x: lerp(this.sis.x, door.x, 0.55), y: lerp(this.sis.y - 50 * this.sis.s, door.y, 0.5) };
      cx = lerp(1240, mid.x, Math.min(1, u * 1.6)); cy = lerp(500, mid.y, Math.min(1, u * 1.6)); k = lerp(1.22, 2.7, u);
    }
    this.camX = cx; this.camY = cy;
    const T = this.T, timeWarp = t > T.later && t < T.alone ? 6 : 1;
    cam.setZoom(designZoom() * k); cam.centerOn(cx, cy);
    // drone's-eye framing overrides the camera
    if (t >= T.drone && t < T.droneEnd) { cam.setZoom(designZoom() * 2.3); cam.centerOn(this.sis.x + 40, this.sis.y - 50); }
    const vw = 1280 / k, vh = 720 / k;
    this.sky.setPosition(cx, cy).setDisplaySize(vw + 4, vh + 4);
    this.par.forEach(e => e.o.setPosition(e.x + (cx - C0.x) * (1 - e.f), e.y + (cy - C0.y) * (1 - e.f)));
    // time passes faster while she waits
    this.clockW = (this.clockW || 0) + (this.game.loop.delta / 1000) * timeWarp;
    const w = this.clockW;
    // stars
    const sg = this.starsG; sg.clear();
    this.starList.forEach(s => { const a = 0.35 + 0.35 * Math.sin(w * 1.3 + s.p); sg.fillStyle(num(this.C.star), a); sg.fillCircle(s.x + (t > T.later ? (w - this.T.later) * 0.6 : 0), s.y, s.r); });
    // city fires flicker
    const fl = (g, list, sc) => { g.clear(); list.forEach(L => { const v = 0.5 + 0.5 * Math.sin(w * 7 + L.p) * Math.sin(w * 3.1 + L.p * 2); g.fillStyle(num(this.C.fire), 0.35 + v * 0.5); g.fillRect(L.x, L.y, 3 * sc, 3 * sc); g.fillStyle(num(this.C.hazard), 0.12 + v * 0.1); g.fillCircle(L.x + 1.5 * sc, L.y + 1.5 * sc, 7 * sc); }); };
    fl(this.farLightsG, this.farLights, 0.8); fl(this.midLightsG, this.midLights, 1.1);
    // searchlights sweep
    this.beams.forEach((b, i) => b.setRotation(Math.sin(w * (0.32 + i * 0.05) + i * 1.9) * 0.55));
    this.houseGlow.setAlpha(0.38 + 0.04 * Math.sin(w * 1.7));
    this.moon.y += t > T.later ? -(w - T.later) * 0.4 : 0;
    // the drone show: diamond, crown, ring, and for one second a television
    const seq = [['diamond', 6], ['crown', 6], ['ring', 4], ['tv', 1], ['diamond', 6], ['crown', 5]];
    const total = seq.reduce((a, s) => a + s[1], 0);
    let m = (w % total), idx = 0; while (m > seq[idx][1]) { m -= seq[idx][1]; idx++; }
    if (idx !== this.figureAt) {
      this.figureAt = idx; const pts = FIG[seq[idx][0]](), order = pts.map((_, i) => i).sort(() => Math.random() - 0.5);
      this.show.forEach((d, i) => { const p = pts[order[i]]; d.tx = GATE.x - 160 + p[0] * 5; d.ty = GATE.y - 470 + p[1] * 5; });
    }
    const dtW = (this.game.loop.delta / 1000) * timeWarp;
    this.show.forEach((d, i) => {
      d.x += (d.tx - d.x) * Math.min(1, dtW * 1.8); d.y += (d.ty - d.y) * Math.min(1, dtW * 1.8);
      d.o.setPosition(d.x + (cx - C0.x) * (1 - VALLEY_F), d.y + (cy - C0.y) * (1 - VALLEY_F)).setAlpha(0.6 + 0.4 * Math.sin(w * 5 + i));
    });
    // the siblings
    const g = this.figG; g.clear();
    const rimC = num(this.C.rim), ink = num('#030306');
    [[this.bro, 'brother'], [this.sis, 'sister']].forEach(([p, kind]) => {
      if (p.alpha <= 0.02) return;
      g.setAlpha(1);
      drawFigure(g, kind, Object.assign({}, p, { x: p.x + 2.2 * p.s, y: p.y - 1 }), rimC);
      drawFigure(g, kind, p, ink);
    });
    // reticle in the drone shot
    const r = this.reticle; r.clear();
    if (t >= T.drone && t < T.droneEnd) {
      const s = this.sis, hx = s.x, hy = s.y - 45 * s.s, sz = 40 - Math.min(1, (t - T.drone) / 1.2) * 14;
      r.lineStyle(1.5, 0xffffff, 0.9); r.strokeRect(hx - sz, hy - sz, sz * 2, sz * 2);
      r.lineBetween(hx - sz - 10, hy, hx - sz + 6, hy); r.lineBetween(hx + sz - 6, hy, hx + sz + 10, hy); r.lineBetween(hx, hy - sz - 10, hx, hy - sz + 6); r.lineBetween(hx, hy + sz - 6, hx, hy + sz + 10);
    }
    // film layers follow the camera
    const inDrone = t >= T.drone && t < T.droneEnd, mx = inDrone ? this.sis.x + 40 : cx, my = inDrone ? this.sis.y - 50 : cy;
    const zk = cam.zoom / designZoom(), vw2 = 1280 / zk, vh2 = 720 / zk;
    this.grain.setPosition(mx, my).setScale(1 / zk).setAlpha(inDrone ? 1 : 0.55).setTilePosition(Math.random() * 256, Math.random() * 256);
    this.vig.setPosition(mx, my).setDisplaySize(vw2 + 2, vh2 + 2);
    const barH = vh2 * 0.075;
    this.bars[0].setPosition(mx, my - vh2 / 2 + barH / 2).setSize(vw2 + 4, barH);
    this.bars[1].setPosition(mx, my + vh2 / 2 - barH / 2).setSize(vw2 + 4, barH);
    // the picture breaks into pixels at the end
    if (t > T.followEnd + 0.3) {
      const u = Math.min(1, (t - T.followEnd - 0.3) / 1.6);
      if (!this.pixFx) { try { this.pixFx = this.cameras.main.filters.internal.addPixelate(0); } catch (e) { this.pixFx = { amount: 0 }; } this.cameras.main.fadeOut(1900, 0, 0, 0); }
      this.pixFx.amount = Math.round(u * u * 14);
    }
  }

  finish(skipped) {
    if (this.done) return;
    this.done = true; state.seenIntro = true;
    overlay.clearCaption();
    const go = () => this.scene.start('grounds', { fromIntro: true });
    if (skipped) { this.cameras.main.fadeOut(400, 0, 0, 0); this.time.delayedCall(420, go); } else go();
  }
}
