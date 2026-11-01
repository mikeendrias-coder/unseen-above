// The kids' room on the Moon (a preview of a scene near the end). Two kids on a couch play the
// satellite game show on a giant screen. They finish the round and cheer; the screen cuts to the
// live feed from Earth, where a girl is struck the moment the same charge sound plays. The next
// take walks in. The game asks if they are ready for round two. Michael described this beat;
// the staging here is a first pass for him to approve or change.
import { LOOKS } from '../art/palettes.js';
import { hexNum } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText, textWidth } from '../art/pixfont.js';
import { makeCinemaTextures, cinemaPalette, mix, num } from '../art/cinema.js';
import { LEVEL as EST, buildMap as estateMap, paintSky, paintMoon, paintLevel as paintEstate } from '../art/estate.js';
import { designZoom, display } from '../core/display.js';
import { makeControls } from '../core/controls.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';

const TV = { x: 500, y: 110, w: 640, h: 360 };
const X0 = 440; // the feed shows the garden from this x
const T = { solve: 8.7, cut: 11.6, feed: 11.9, lockAt: 14.4, strike: 14.82, back: 18.5, turn: 22, next: 22.5, round2: 26, reach: 27, black: 31.5, end: 33.5 };
const smooth = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;

function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  scene.textures.addCanvas(key, c).setFilter(Phaser.Textures.FilterMode.LINEAR);
}

// The room, painted once: plush walls, a porthole onto Earth over the lunar ground, toys, trophies.
function paintRoom(scene) {
  canvasTex(scene, 'k_room', 1280, 720, (x, W, H) => {
    let g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d1236'); g.addColorStop(0.7, '#120a24'); g.addColorStop(1, '#0a0614');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let px = 30; px < W; px += 124) { x.fillStyle = 'rgba(255,255,255,0.025)'; x.fillRect(px, 40, 96, 470); x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(px + 94, 40, 3, 470); }
    x.fillStyle = '#2a1a44'; x.fillRect(0, 520, W, 8); x.fillStyle = '#b8913a'; x.fillRect(0, 520, W, 1);
    g = x.createLinearGradient(0, 560, 0, H); g.addColorStop(0, '#0e0819'); g.addColorStop(1, '#05030a'); x.fillStyle = g; x.fillRect(0, 556, W, H - 556);
    x.fillStyle = '#1a0f2c'; x.beginPath(); x.ellipse(830, 690, 520, 70, 0, 0, Math.PI * 2); x.fill();
    // the porthole: space, Earth burning on its night side, the lunar ground
    const cx = 250, cy = 300, r = 170;
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
    x.fillStyle = '#020207'; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(230,230,255,${0.3 + rnd() * 0.6})`; const q = rnd() < 0.1 ? 2 : 1; x.fillRect(cx - r + rnd() * 2 * r, cy - r + rnd() * 2 * r, q, q); }
    const ex = 220, ey = 230, er = 74;
    x.fillStyle = '#0a1322'; x.beginPath(); x.arc(ex, ey, er, 0, Math.PI * 2); x.fill();
    x.save(); x.beginPath(); x.arc(ex, ey, er, 0, Math.PI * 2); x.clip();
    g = x.createRadialGradient(ex + 95, ey - 20, er * 0.9, ex + 60, ey - 10, er * 1.6); g.addColorStop(0, 'rgba(120,180,255,0)'); g.addColorStop(0.35, 'rgba(110,170,250,0.75)'); g.addColorStop(1, 'rgba(190,225,255,0.95)');
    x.fillStyle = '#0a1322'; x.fill(); x.beginPath(); x.arc(ex + 34, ey - 6, er * 1.02, 0, Math.PI * 2); x.arc(ex + 100, ey - 6, er * 1.9, 0, Math.PI * 2, true);
    x.fillStyle = 'rgba(80,140,230,0.85)'; x.beginPath(); x.arc(ex, ey, er, -1.25, 1.25); x.arc(ex - 26, ey, er * 0.92, 1.1, -1.1, true); x.closePath(); x.fill();
    x.fillStyle = 'rgba(190,225,255,0.9)'; x.beginPath(); x.arc(ex, ey, er, -1.0, 1.0); x.arc(ex - 10, ey, er * 0.95, 0.95, -0.95, true); x.closePath(); x.fill();
    for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, d = rnd() * er * 0.85, fx = ex - 18 + Math.cos(a) * d * 0.8, fy = ey + Math.sin(a) * d; x.fillStyle = 'rgba(255,120,40,0.18)'; x.beginPath(); x.arc(fx, fy, 5, 0, Math.PI * 2); x.fill(); x.fillStyle = '#ff9a4a'; x.fillRect(fx, fy, 1.6, 1.6); }
    x.restore();
    x.strokeStyle = 'rgba(140,190,255,0.35)'; x.lineWidth = 2; x.beginPath(); x.arc(ex, ey, er + 2, -1.3, 1.3); x.stroke();
    g = x.createRadialGradient(cx, cy + 620, 400, cx, cy + 620, 560); g.addColorStop(0, '#8a8682'); g.addColorStop(0.92, '#6b6864'); g.addColorStop(1, '#3a3836');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy + 620, 540, 0, Math.PI * 2); x.fill();
    [[150, 410, 22], [300, 440, 14], [210, 455, 9], [360, 400, 11]].forEach(([qx, qy, qr]) => { x.fillStyle = 'rgba(0,0,0,0.22)'; x.beginPath(); x.ellipse(qx, qy, qr, qr * 0.35, 0, 0, Math.PI * 2); x.fill(); });
    x.restore();
    x.lineWidth = 16; x.strokeStyle = '#2a1b45'; x.beginPath(); x.arc(cx, cy, r + 8, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 2; x.strokeStyle = '#b8913a'; x.beginPath(); x.arc(cx, cy, r + 1, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(cx, cy, r + 16, 0, Math.PI * 2); x.stroke();
    // toys: a rocket, a ball; trophies and a pennant by the screen
    x.fillStyle = '#e8e2d6'; x.beginPath(); x.moveTo(430, 560); x.quadraticCurveTo(452, 590, 448, 650); x.lineTo(412, 650); x.quadraticCurveTo(408, 590, 430, 560); x.fill();
    x.fillStyle = '#c8423a'; x.beginPath(); x.moveTo(412, 630); x.lineTo(396, 660); x.lineTo(414, 652); x.fill(); x.beginPath(); x.moveTo(448, 630); x.lineTo(464, 660); x.lineTo(446, 652); x.fill();
    x.fillStyle = '#7fb0ff'; x.beginPath(); x.arc(430, 600, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(480, 676, 18, 0, Math.PI * 2); x.fill(); x.fillStyle = '#ff5fa2'; x.fillRect(463, 672, 34, 7);
    x.fillStyle = '#2a1a44'; x.fillRect(1160, 300, 110, 8);
    [1178, 1212, 1246].forEach((tx, i) => { x.fillStyle = '#e2b146'; x.beginPath(); x.moveTo(tx - 11, 262 - i * 4); x.lineTo(tx + 11, 262 - i * 4); x.lineTo(tx + 5, 284); x.lineTo(tx - 5, 284); x.fill(); x.fillRect(tx - 2, 284, 4, 8); x.fillRect(tx - 8, 292, 16, 8); x.fillStyle = '#fff0a8'; x.fillRect(tx - 7, 264 - i * 4, 3, 10); });
    x.fillStyle = '#ff5fa2'; x.beginPath(); x.moveTo(1170, 150); x.lineTo(1262, 168); x.lineTo(1170, 186); x.fill();
    x.fillStyle = '#ffffff'; x.font = '600 18px "Martian Mono", monospace'; x.fillText('07', 1182, 175);
    // the screen: a bezel with a gold line, and a hole where the picture shows through
    x.fillStyle = '#06040b'; x.fillRect(TV.x - 16, TV.y - 16, TV.w + 32, TV.h + 32);
    x.strokeStyle = '#b8913a'; x.lineWidth = 2; x.strokeRect(TV.x - 12, TV.y - 12, TV.w + 24, TV.h + 24);
    x.clearRect(TV.x, TV.y, TV.w, TV.h);
  });
}

export class Kids extends Phaser.Scene {
  constructor() { super('kids'); }

  create() {
    const P = this.P = LOOKS[state.look];
    this.C = cinemaPalette(P);
    makeCinemaTextures(this, this.C);
    makeSprites(this, P);
    paintRoom(this);
    paintSky(P, 320).toTexture(this, 'k_sky'); paintMoon(P).toTexture(this, 'k_moon'); paintEstate(P).toTexture(this, 'k_level');
    this.map = estateMap();
    this.ctl = makeControls(this);
    const cam = this.cameras.main; cam.setRoundPixels(false);

    this.add.image(0, 0, 'k_room').setOrigin(0).setDepth(0);
    // the Earth feed, in screen pixels (320 x 180) scaled into the screen
    this.feed = this.add.container(TV.x, TV.y).setScale(TV.w / 320).setDepth(2).setVisible(false);
    this.feed.add(this.add.image(0, 0, 'k_sky').setOrigin(0));
    this.feed.add(this.add.image(250, 22, 'k_moon'));
    this.feed.add(this.add.image(-X0, 0, 'k_level').setOrigin(0).setCrop(X0, 0, 320, 180));
    this.body1 = this.add.image(0, 0, 'body0').setOrigin(0.5, 1).setVisible(false); this.feed.add(this.body1);
    this.girl1 = this.add.image(0, 0, 'girl_stand').setOrigin(0.5, 1); this.feed.add(this.girl1);
    this.girl2 = this.add.image(0, 0, 'girl_stand').setOrigin(0.5, 1).setVisible(false); this.feed.add(this.girl2);
    this.feedG = this.add.graphics(); this.feed.add(this.feedG);
    this.staticG = this.add.graphics().setDepth(3);
    // light from the screen
    this.glows = [[TV.x + TV.w / 2, TV.y - 30, 9, 1.6], [TV.x + TV.w / 2, TV.y + TV.h + 40, 10, 2.2], [TV.x - 40, TV.y + TV.h / 2, 2, 6], [TV.x + TV.w + 40, TV.y + TV.h / 2, 2, 6]]
      .map(([gx, gy, sx, sy]) => this.add.image(gx, gy, 'c_glow').setScale(sx, sy).setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3));
    this.floorGlow = this.add.image(820, 640, 'c_glow').setScale(9, 1.6).setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25);
    this.kidsG = this.add.graphics().setDepth(6);
    this.couchG = this.add.graphics().setDepth(7);
    this.grain = this.add.tileSprite(0, 0, 1280, 720, 'c_grain').setDepth(50).setAlpha(0.45);
    this.vig = this.add.image(0, 0, 'c_vignette').setDepth(51);
    this.bars = [this.add.rectangle(0, 0, 10, 10, 0x000000).setDepth(52), this.add.rectangle(0, 0, 10, 10, 0x000000).setDepth(52)];
    this.blackout = this.add.rectangle(640, 360, 4000, 3000, 0x000000).setDepth(60).setVisible(false);

    this.t = 0; this.fired = {}; this.solvedAt = null; this.over = false;
    this.beds = { show: Sound.show(0.045), hum: Sound.hum(0.0001) };
    this.scene.launch('satellite', { embed: true, batch: 4, skin: 4, ids: ['walls'], autoDelay: 1.5, autoEvery: 0.2, round: 3, score: 2400 });
    this.sat = this.scene.get('satellite');
    this.onSolved = () => { if (this.solvedAt == null) this.solvedAt = this.t; };
    this.sat.events.on('solved', this.onSolved);
    this.events.once('shutdown', () => {
      Object.values(this.beds).forEach(b => b.stop(0.3)); overlay.clearCaption();
      this.sat.events.off('solved', this.onSolved);
      if (this.scene.isActive('satellite')) this.scene.stop('satellite');
    });
    overlay.hint('A preview of the kids’ room on the Moon, a scene near the end. Esc goes back to the opening.');
    cam.fadeIn(1200);
    window.__game = { scene: this, T };
  }

  cue(key, at, fn) { if (this.t >= at && !this.fired[key]) { this.fired[key] = true; fn(); } }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 20), c = this.ctl;
    this.t += dt;
    const t = this.t;
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (c.skip()) { this.scene.start('intro', {}); return; }
    if (this.over && c.advance()) { this.scene.restart(); return; }
    this.script(t);
    this.direct(t);
    this.drawFeed(t);
    this.drawKids(t);
    c.endFrame();
  }

  // ------------------------------------------------------------------ the script: sound, captions, the cut
  script(t) {
    this.cue('cc1', 0.6, () => overlay.caption(null, '[GAME SHOW MUSIC]'));
    this.cue('cc1x', 5, () => overlay.clearCaption());
    if (this.solvedAt != null) {
      this.cue('cheer', this.solvedAt + 0.15, () => { overlay.caption(null, '[CHEERING]'); this.beds.show.set(0.07, 0.2); [0, 0.25, 0.55, 0.9].forEach(d => this.time.delayedCall(d * 1000, () => Sound.noise(0.35, 0.05, 2400))); });
    }
    this.cue('cut', T.cut, () => {
      overlay.caption(null, '[STATIC]'); Sound.noise(0.4, 0.14, 9000); this.beds.show.stop(0.05); this.beds.hum.set(0.025, 0.5);
      if (this.scene.isActive('satellite')) this.scene.stop('satellite');
    });
    this.cue('feed', T.feed, () => { this.feed.setVisible(true); });
    this.cue('ccx', T.feed + 0.9, () => overlay.clearCaption());
    this.cue('lock', T.lockAt, () => Sound.charge());
    this.cue('strike', T.strike, () => { Sound.tone(1400, 0.12, 'sawtooth', 0.04, 300); Sound.noise(0.4, 0.16); this.cameras.main.shake(140, 0.003); });
    this.cue('round2', T.round2, () => { overlay.caption(null, '[GAME SHOW JINGLE]'); [523, 659, 784, 1047].forEach((f, i) => this.time.delayedCall(i * 140, () => Sound.tone(f, 0.16, 'square', 0.025, null, 0.3))); });
    this.cue('round2x', T.round2 + 2.4, () => overlay.clearCaption());
    this.cue('black', T.black, () => { this.blackout.setVisible(true); Object.values(this.beds).forEach(b => b.stop(0.02)); overlay.clearCaption(); });
    this.cue('end', T.end, () => { this.over = true; overlay.hint('End of the preview. Enter plays it again. Esc goes back to the opening.'); });
  }

  // ------------------------------------------------------------------ camera, film layers, the screen
  direct(t) {
    let k, cx, cy;
    if (t < 7) { k = lerp(1, 1.06, t / 7); cx = 640; cy = 360; }
    else if (t < T.feed + 0.6) { const u = smooth((t - 7) / 2.5); k = lerp(1.06, 1.55, u); cx = lerp(640, 835, u); cy = lerp(360, 318, u); }
    else if (t < T.back) { const u = smooth((t - T.feed - 0.6) / 3.2); k = lerp(1.55, 2.15, u); cx = lerp(835, 770, u); cy = lerp(318, 400, u); }
    else if (t < T.back + 3) { const u = smooth((t - T.back) / 3); k = lerp(2.15, 1.05, u); cx = lerp(770, 660, u); cy = lerp(400, 360, u); }
    else { const u = smooth((t - T.back - 3) / 10); k = lerp(1.05, 1.12, u); cx = lerp(660, 700, u); cy = lerp(360, 380, u); }
    const cam = this.cameras.main, z = designZoom() * k;
    cam.setZoom(z); cam.centerOn(cx, cy);
    const vw = 1280 / k, vh = 720 / k;
    this.grain.setPosition(cx, cy).setScale(1 / k).setTilePosition(Math.random() * 256, Math.random() * 256);
    this.vig.setPosition(cx, cy).setDisplaySize(vw + 2, vh + 2);
    const barH = vh * 0.075;
    this.bars[0].setPosition(cx, cy - vh / 2 + barH / 2).setSize(vw + 4, barH);
    this.bars[1].setPosition(cx, cy + vh / 2 - barH / 2).setSize(vw + 4, barH);
    // the satellite scene draws into the screen's rectangle, wherever the camera puts it
    if (this.scene.isActive('satellite') && this.sat.cameras && this.sat.cameras.main) {
      const left = cx - display.w / (2 * z), top = cy - display.h / (2 * z);
      const sx = Math.round((TV.x - left) * z), sy = Math.round((TV.y - top) * z), sw = Math.round(TV.w * z), sh = Math.round(TV.h * z);
      const sc = this.sat.cameras.main; sc.setViewport(sx, sy, sw, sh); sc.setZoom(sw / 320); sc.centerOn(160, 90);
    }
    // the screen's light: game show colors, then the cold feed, then nothing
    let col;
    if (t < T.cut) { const i = Math.floor(t * 3) % 3; col = ['#ff5fa2', '#7d6bff', '#ffd23f'][i]; if (this.solvedAt != null && t - this.solvedAt < 2.5) col = Math.floor(t * 10) % 2 ? '#ffd23f' : '#ff5fa2'; }
    else if (t < T.feed) col = '#ffffff';
    else col = t > T.round2 && Math.floor(t * 4) % 2 ? '#ff5fa2' : '#8fb6ff';
    if (t > T.strike && t < T.strike + 0.12) col = '#ff6060';
    this.tvCol = col;
    const flick = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.7);
    this.glows.forEach(g => g.setTint(num(col)).setAlpha((t < T.cut ? 0.32 : 0.22) * flick));
    this.floorGlow.setTint(num(col)).setAlpha((t < T.cut ? 0.26 : 0.18) * flick);
    // static at the cut
    const sg = this.staticG; sg.clear();
    if (t >= T.cut && t < T.feed + 0.05) { for (let i = 0; i < 260; i++) { const v = Math.random(); sg.fillStyle(v > 0.5 ? 0xffffff : 0x000000, 0.9); sg.fillRect(TV.x + Math.random() * TV.w, TV.y + Math.random() * TV.h, 3 + Math.random() * 40, 2 + Math.random() * 3); } sg.fillStyle(0x777777, 0.4); sg.fillRect(TV.x, TV.y, TV.w, TV.h); }
  }

  // ------------------------------------------------------------------ the feed from Earth
  cone(lx, ly, angle, half, range) {
    const pts = [{ x: lx - X0, y: ly }], solid = (px, py) => { const tx = Math.floor(px / 16), ty = Math.floor(py / 16); return ty >= 0 && ty < this.map.H && tx >= 0 && tx < this.map.W && this.map.m[ty][tx] === 1; };
    for (let a = angle - half; a <= angle + half + 0.001; a += 1) {
      const r = a * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r); let d = 0;
      while (d < range) { d += 2; const px = lx + dx * d, py = ly + dy * d; if (solid(px, py) || px < X0 || px > X0 + 320 || py < 0 || py > 180) { d -= 1; break; } }
      pts.push({ x: lx + dx * d - X0, y: ly + dy * d });
    }
    return pts;
  }
  drawFeed(t) {
    if (!this.feed.visible) return;
    const g = this.feedG, P = this.P, L = EST.lights[0]; g.clear();
    // girl one: past the hedge, creeping toward the fountain; the lamp turns to her
    const g1 = t < T.feed + 2 ? lerp(550, 570, Math.max(0, (t - T.feed) / 2)) : 570, walking1 = t < T.feed + 2 && t > T.feed;
    this.girl1.setVisible(t < T.strike).setPosition(Math.round(g1 - X0), 160).setTexture(walking1 && Math.floor(t * 6) % 2 ? 'girl_pass' : 'girl_stand');
    this.body1.setVisible(t >= T.strike).setPosition(Math.round(g1 - X0), 160);
    const sweep = L.a0 + (L.a1 - L.a0) * (Math.sin((t / L.period + L.phase) * Math.PI * 2) + 1) / 2, aim = Math.atan2(150 - L.y, g1 - L.x) * 180 / Math.PI;
    const toward = smooth((t - (T.lockAt - 0.35)) / 0.35) * (1 - smooth((t - T.strike - 0.6) / 0.8));
    const angle = lerp(sweep, aim, toward), pts = this.cone(L.x, L.y, angle, L.half, L.range);
    const lock = t >= T.lockAt && t < T.strike ? (t - T.lockAt) / (T.strike - T.lockAt) : 0;
    const coneCol = hexNum(lock > 0 ? P.hazard : P.shaft), inner = [pts[0]].concat(pts.slice(1).filter((_, j, a) => j > a.length * 0.25 && j < a.length * 0.75));
    g.fillStyle(coneCol, 0.2 + lock * 0.12); g.fillPoints(pts, true); if (inner.length > 2) { g.fillStyle(coneCol, 0.16); g.fillPoints(inner, true); }
    const hx = g1 - X0, hy = 153;
    if (lock > 0) { const r = 9 - lock * 7; g.lineStyle(1, hexNum(P.hazard), 1); g.strokeRect(Math.round(hx - 4 - r), Math.round(hy - 4 - r), Math.round(8 + 2 * r), Math.round(8 + 2 * r)); }
    if (t >= T.strike && t < T.strike + 0.18) { g.fillStyle(hexNum(P.hazard), 0.4); g.fillRect(0, hy - 3, hx, 6); g.fillStyle(hexNum(P.hazardCore), 1); g.fillRect(0, hy - 1, hx, 2); }
    if (t >= T.strike && t < T.strike + 0.6) { const u = (t - T.strike) / 0.6; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.fillStyle(i % 2 ? 0xffffff : hexNum(P.lamp), 1 - u); g.fillRect(Math.round(hx + Math.cos(a) * u * 22), Math.round(hy + Math.sin(a) * u * 16), 2, 2); } }
    // the next take walks in and hides behind the hedge, the body on its other side
    if (t >= T.next) {
      const u = Math.min(1, (t - T.next) / 3), x2 = lerp(X0 - 6, 500, u), crouch = t > T.next + 3.4;
      this.girl2.setVisible(true).setPosition(Math.round(x2 - X0), 160).setTexture(crouch ? 'girl_crouch' : u < 1 && Math.floor(t * 6) % 2 ? 'girl_pass' : 'girl_stand');
    }
    // broadcast marks: LIVE, the channel, the take
    const red = hexNum(P.hazard);
    if (Math.floor(t * 2) % 2 === 0) { g.fillStyle(red, 1); g.fillCircle(9, 9, 2); }
    pixText(g, 'LIVE', 14, 7, 0xffffff, 1, 0.9); pixText(g, 'CH 07', 320 - 6 - textWidth('CH 07'), 7, 0xffffff, 1, 0.8);
    pixText(g, 'TAKE ' + (t < T.strike + 1.2 ? 31 : 32), 6, 168, 0xffffff, 1, 0.7);
    // round two: the game show comes back over the feed
    if (t >= T.round2) {
      const on = Math.floor(t * 6) % 2;
      // over the sky, so the ground (and what lies on it) stays in view
      g.fillStyle(0x1b0f3a, 0.92); g.fillRect(70, 22, 180, 30);
      for (let bx = 74; bx < 250; bx += 8) { g.fillStyle((bx / 8 + (on ? 1 : 0)) % 2 ? 0xffd23f : 0xff5fa2, 1); g.fillCircle(bx, 24, 1.5); g.fillCircle(bx, 50, 1.5); }
      pixText(g, 'ROUND 2', 160 - textWidth('ROUND 2', 2) / 2, 29, 0xffd23f, 2, 1);
      pixText(g, 'READY?', 160 - textWidth('READY?') / 2, 42, on ? 0xffffff : 0xff5fa2, 1, 1);
    }
  }

  // ------------------------------------------------------------------ the kids and the couch
  drawKids(t) {
    const g = this.kidsG, rim = num(this.tvCol), ink = 0x050309; g.clear();
    const cheer = this.solvedAt == null ? 0 : smooth((t - this.solvedAt) / 0.25) * (1 - smooth((t - T.cut + 0.4) / 1.2));
    const still = t > T.strike;
    const bob = still ? 0 : Math.sin(t * 9) * cheer * 6 + Math.sin(t * 1.7) * 1.2;
    const turn = smooth((t - T.turn) / 0.8);
    const reach = smooth((t - T.reach) / 3.5);
    const kids = [
      { hx: 730, hy: 488 + bob, r: 30, bun: true, turn: 0, tablet: true, reach },
      { hx: 950, hy: 494 + (still ? 0 : Math.sin(t * 9 + 1) * cheer * 7 + Math.sin(t * 1.5 + 2) * 1.2), r: 28, bun: false, turn, tablet: false, reach: 0 }
    ];
    // the tablet's light spills around its edges
    const tab = kids[0], tx = tab.hx + 46, ty = tab.hy - 4, tabOn = t < T.cut ? 0.7 : t > T.round2 ? (Math.floor(t * 4) % 2 ? 1 : 0.6) : 0.15;
    g.fillStyle(num(t > T.round2 || t < T.cut ? '#ff7fb8' : '#8fb6ff'), 0.12 * tabOn); g.fillEllipse(tx + 25, ty + 16, 110, 70);
    g.fillStyle(num(t > T.round2 || t < T.cut ? '#ff9fca' : '#8fb6ff'), 0.25 * tabOn); g.fillEllipse(tx + 25, ty + 16, 70, 46);
    [[rim, 3], [ink, 0]].forEach(([col, grow]) => {
      g.fillStyle(col, grow ? 0.9 : 1); g.lineStyle(18 + grow * 2, col, grow ? 0.9 : 1);
      kids.forEach(k => {
        const hx = k.hx - k.turn * 7, sy = k.hy + k.r + 4;
        g.fillRoundedRect(k.hx - 54 - grow, sy - grow, 108 + grow * 2, 90, 28);
        g.fillRect(k.hx - 10 - grow, k.hy + k.r - 10, 20 + grow * 2, 18);
        g.fillCircle(hx, k.hy, k.r + grow);
        if (k.bun) g.fillCircle(hx + 5, k.hy - k.r - 6, 12 + grow);
        else { g.fillCircle(hx - 13, k.hy - k.r + 7, 9 + grow); g.fillCircle(hx + 2, k.hy - k.r + 2, 9 + grow); g.fillCircle(hx + 15, k.hy - k.r + 8, 8 + grow); }
        if (k.turn > 0.05) g.fillCircle(hx - k.r + 1, k.hy + 5, 5 + grow); // her cheek, as she turns
        // arms: down behind the couch, up when they cheer
        const up = k === kids[1] ? cheer : cheer * (k.tablet ? 0.6 : 1);
        [[-1, up], [1, k.tablet ? 0 : up]].forEach(([s, u]) => {
          if (u < 0.02) return;
          const ax = k.hx + s * 42, ay = sy + 14, hxx = k.hx + s * (60 + 14 * u), hyy = sy + 70 - 170 * u;
          g.lineBetween(ax, ay, hxx, hyy); g.fillCircle(hxx, hyy, 10 + grow);
        });
        if (k.tablet) {
          // the right hand holds the tablet up by the shoulder; its back faces us
          g.lineBetween(k.hx + 40, sy + 16, tx + 6, ty + 30); g.fillRoundedRect(tx - grow, ty - grow, 50 + grow * 2, 34 + grow * 2, 4);
          if (k.reach > 0.01) { const rx = lerp(k.hx - 20, tx - 4, k.reach), ry = lerp(sy + 80, ty + 22, k.reach); g.lineBetween(k.hx - 30, sy + 16, rx, ry); g.fillCircle(rx, ry, 9 + grow); }
        }
      });
    });
    // the couch back, in front of them, lit along its top
    const cg = this.couchG; cg.clear();
    cg.fillStyle(0x120a20, 1); cg.fillRoundedRect(560, 556, 560, 220, 56);
    cg.fillStyle(rim, 0.35); cg.fillRoundedRect(572, 556, 536, 5, 3);
    cg.fillStyle(0x0b0614, 1); cg.fillRect(838, 572, 4, 160);
    cg.fillStyle(0x1a0f2c, 1); cg.fillRoundedRect(540, 600, 60, 160, 26); cg.fillRoundedRect(1080, 600, 60, 160, 26);
    cg.fillStyle(rim, 0.25); cg.fillRoundedRect(548, 600, 44, 4, 2); cg.fillRoundedRect(1088, 600, 44, 4, 2);
  }
}
