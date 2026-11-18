// The kids' room on the Moon, after batch 4 (and a preview from its # link). A pixel scene at
// 320 x 180, the same playroom she reaches at the end. Two kids on a gold couch play the
// satellite game show on a giant screen: a board, a gold path drawn from target to target,
// and a feed from Earth where a box closes on a small girl (the game she walks in on at the end).
// They win and cheer. The screen cuts to static, then to the live feed from Earth, full frame:
// the grounds at night, a girl in the open, the searchlight finds her, the satellite strikes the
// moment the charge sound plays. Back in the room the next take walks in on the screen, the
// little one turns round, and the show asks: ROUND 2, READY? Then black, and the Moon.
import { Music } from '../core/music.js';
import { LOOKS } from '../art/palettes.js';
import { Painter, hexNum, rng } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { ccText, ccWidth } from '../art/ccfont.js';
import { LEVEL as MOON, KX, paintPlayroom, paintKid, KID_POSES, BOARD, drawBoard, drawFeedBox, feedHouse, feedGatePost, feedRect } from '../art/moon.js';
import { PixLayer } from '../art/hallway.js';
import { pixelZoom, display } from '../core/display.js';
import { SatelliteStrike } from '../art/strike.js';
import { makeControls } from '../core/controls.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { goNext } from '../core/flow.js';
import { reviewKeys } from '../core/review.js';
import { fx } from '../core/fx.js';

const T = { solve: 5.5, cut: 8.4, feed: 8.7, lockAt: 11.0, fire: 11.5, back: 14.6, turn: 16, round2: 17.5, black: 20.5, end: 21.5 };
const n = c => hexNum(c);
const SCR = { x: MOON.screen.x - KX, y: MOON.screen.y, w: MOON.screen.w, h: MOON.screen.h };
const KIDS = MOON.kids.map(k => ({ x: k.x - KX, bun: k.bun })), KY = MOON.couch.y + 4;
// the feed from Earth: where things stand on the grounds
const F = { ground: 152, lamp: { x: 34, y: 58 }, girl0: 92, girl1: 150, hedge: 168, gate: 112 }; // she walks in through the gate

// The grounds at night, full frame, as the show's camera sees them: ash sky, episode 1's house
// (art/moon.js feedHouse, twice size), the white gate posts with gold caps, a hedge, a searchlight.
function paintFeed() {
  const p = new Painter(320, 180), r = rng(13), G = F.ground;
  p.rect(0, 0, 320, 180, '#1b1c21');
  for (let i = 0; i < 60; i++) p.px(Math.floor(r() * 320), Math.floor(r() * 90), i % 7 ? '#45474d' : '#8f8d87');
  p.circle(276, 30, 9, '#b8b2a3'); p.circle(273, 28, 6, '#ebe6d8'); p.px(279, 26, '#f5ce77'); // the Moon, its one lit window
  // the house, far back: episode 1's, the same drawing every feed uses
  const fr = feedRect(p); feedHouse(fr, 184, G, 2);
  // the ground: grey ash out here
  p.rect(0, G, 320, 180 - G, '#2e3036'); p.rect(0, G, 320, 1, '#45474d'); for (let i = 0; i < 30; i++) p.rect(Math.floor(r() * 320), G + 3 + Math.floor(r() * 24), 2 + Math.floor(r() * 4), 1, '#1b1c21');
  // the gate: white posts with gold caps, a gold leaf hanging open
  for (let y = G - 28; y < G; y += 6) p.rect(F.gate + 5, y, 6, 1, '#d6a03c');
  [F.gate, F.gate + 30].forEach(x => feedGatePost(fr, x, G, 2));
  // a hedge, cut square, bronze-green, low enough to hide behind crouched
  p.rect(F.hedge, G - 12, 50, 12, '#261f15'); p.rect(F.hedge, G - 12, 50, 2, '#3a2f1f'); for (let x = F.hedge + 3; x < F.hedge + 48; x += 6) p.px(x, G - 8, '#3a2f1f');
  // the searchlight: a pole and a head
  p.rect(F.lamp.x - 1, F.lamp.y, 3, G - F.lamp.y, '#45474d'); p.rect(F.lamp.x - 6, G - 3, 13, 3, '#45474d'); p.rect(F.lamp.x - 5, F.lamp.y - 6, 10, 7, '#6b6c70'); p.rect(F.lamp.x - 3, F.lamp.y, 6, 2, '#f2d58c');
  return p;
}

export class Kids extends Phaser.Scene {
  constructor() { super('kids'); }

  create(data) {
    const P = this.P = LOOKS[state.look];
    makeSprites(this, P);
    const room = new Painter(320, 180); paintPlayroom(room, 0); room.toTexture(this, 'kr_room');
    paintFeed().toTexture(this, 'kr_feed');
    [true, false].forEach(bun => KID_POSES.forEach(pose => paintKid(bun, pose).toTexture(this, 'mk_' + (bun ? 'a' : 'b') + '_' + pose)));
    this.ctl = makeControls(this);
    this.cameras.main.setBackgroundColor('#000000').setRoundPixels(true);
    this.place();

    // the room
    this.roomImg = this.add.image(0, 0, 'kr_room').setOrigin(0).setDepth(0);
    this.screenG = this.add.graphics().setDepth(1);
    this.kidImgs = KIDS.map((k, i) => this.add.image(k.x, KY, 'mk_' + (i ? 'b' : 'a') + '_back').setOrigin(0.5, 1).setDepth(2));
    this.handG = this.add.graphics().setDepth(2.1);
    // the feed, full frame, over the room
    this.feed = this.add.container(0, 0).setDepth(10).setVisible(false);
    this.feed.add(this.add.image(0, 0, 'kr_feed').setOrigin(0));
    this.light = new PixLayer(this, 'kr_light', 0); this.feed.add(this.light.img);
    this.body1 = this.add.image(0, 0, 'body0').setOrigin(0.5, 1).setVisible(false); this.feed.add(this.body1);
    this.girl1 = this.add.image(0, 0, 'girl_stand').setOrigin(0.5, 1); this.feed.add(this.girl1);
    this.feedG = this.add.graphics(); this.feed.add(this.feedG);
    this.strike = new SatelliteStrike(this, { parent: this.feed }); this.hitAt = null; this.satX = null;
    this.staticG = this.add.graphics().setDepth(20);
    this.blackout = this.add.rectangle(160, 90, 400, 260, 0x000000).setDepth(60).setVisible(false);

    this.t = 0; this.fired = {}; this.solvedAt = null; this.over = false;
    // the feed's take: hers, counted the way the rest of the show counts (a body per take)
    this.take0 = state.bodyCount() + 1;
    this.beds = { show: Sound.show(0.045), hum: Sound.hum(0.0001) };
    Music.stop(0.8);
    this.scale.on('rescale', this.place, this);
    this.events.once('shutdown', () => { this.scale.off('rescale', this.place, this); Object.values(this.beds).forEach(b => b.stop(0.3)); overlay.clearCaption(); });
    // in the game's own order it plays after batch 4 and hands on to the Moon; on its own it is a preview
    this.inFlow = !!(data && data.inFlow);
    overlay.hint(this.inFlow ? '' : 'A preview of the kids’ room on the Moon. Esc goes back to the opening.');
    this.cameras.main.fadeIn(900);
    window.__game = { scene: this, T };
  }
  // the 320 x 180 picture, scaled by whole numbers, centered the way the other pixel scenes are
  place() { const S = display.S, cam = this.cameras.main; cam.setZoom(pixelZoom()); cam.scrollX = -160 * (S - 1); cam.scrollY = -90 * (S - 1); }

  skipAhead() { if (this.inFlow) { if (!goNext(this, 'kids')) this.scene.start('intro', {}); } else this.t = Math.max(this.t, T.black); }
  cue(key, at, fn) { if (this.t >= at && !this.fired[key]) { this.fired[key] = true; fn(); } }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 20), c = this.ctl;
    this.t += dt;
    const t = this.t;
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (reviewKeys(this)) { c.endFrame(); return; }
    if (c.skip()) { if (this.inFlow) { if (!goNext(this, 'kids')) this.scene.start('intro', {}); } else this.scene.start('intro', {}); return; }
    if (this.over && c.advance()) { this.scene.restart(); return; }
    this.script(t);
    const inFeed = t >= T.feed && t < T.back;
    this.feed.setVisible(inFeed);
    this.drawScreen(t);
    this.drawKids(t);
    if (inFeed) this.drawFeed(t, dt); else this.strike.update(dt);
    this.drawStatic(t);
    c.endFrame();
  }

  // ------------------------------------------------------------------ the script: sound, captions, cuts
  script(t) {
    this.cue('cc1', 0.6, () => overlay.caption(null, '[GAME SHOW MUSIC]'));
    this.cue('cc1x', 4.6, () => overlay.clearCaption());
    this.cue('lock0', T.solve - 1.1, () => Sound.charge());
    this.cue('solve', T.solve, () => {
      this.solvedAt = this.t; overlay.caption(null, '[CHEERING]'); this.beds.show.set(0.07, 0.2);
      [0, 0.25, 0.55, 0.9].forEach(d => this.time.delayedCall(d * 1000, () => Sound.noise(0.35, 0.05, 2400)));
      [784, 1047].forEach((f, i) => this.time.delayedCall(i * 120, () => Sound.tone(f, 0.12, 'square', 0.02)));
    });
    this.cue('cut', T.cut, () => { overlay.caption(null, '[STATIC]'); Sound.noise(0.4, 0.14, 9000); this.beds.show.stop(0.05); this.beds.hum.set(0.025, 0.5); });
    this.cue('ccx', T.feed + 0.9, () => overlay.clearCaption());
    this.cue('lock', T.lockAt, () => Sound.charge());
    // the satellite fires; the beam ricochets down the feed and hits her
    this.cue('fire', T.fire, () => this.strike.fire({ view: { x: 0, y: 0, width: 320, height: 180 }, tx: this.g1x, ty: F.ground - 7, P: this.P, from: this.satX, onImpact: () => {
      this.hitAt = this.t; Sound.tone(1400, 0.12, 'sawtooth', 0.04, 300); Sound.noise(0.4, 0.16); fx.shake(this.cameras.main, 140, 0.003);
    } }));
    this.cue('back', T.back, () => { this.beds.show = Sound.show(0.03); });
    this.cue('round2', T.round2, () => { overlay.caption(null, '[GAME SHOW JINGLE]'); [523, 659, 784, 1047].forEach((f, i) => this.time.delayedCall(i * 140, () => Sound.tone(f, 0.16, 'square', 0.025, null, 0.3))); });
    this.cue('round2x', T.round2 + 2.2, () => overlay.clearCaption());
    this.cue('black', T.black, () => { this.blackout.setVisible(true); Object.values(this.beds).forEach(b => b.stop(0.02)); overlay.clearCaption(); });
    this.cue('end', T.end, () => {
      if (this.inFlow && goNext(this, 'kids')) return;
      this.over = true; overlay.hint('End of the preview. Enter plays it again. Esc goes back to the opening.');
    });
  }

  // ------------------------------------------------------------------ the giant screen in the room
  drawScreen(t) {
    const g = this.screenG, { x, y, w, h } = SCR; g.clear();
    g.fillStyle(0x0e0f12, 1); g.fillRect(x, y, w, h);
    if (t < T.cut) return this.drawShow(g, t);
    if (t < T.back) return;
    // back in the room: the feed, small, on the giant screen; the next take walks in
    g.fillStyle(n('#1b1c21'), 1); g.fillRect(x, y, w, h); g.fillStyle(n('#2e3036'), 1); g.fillRect(x, y + 72, w, h - 72); g.fillStyle(n('#45474d'), 1); g.fillRect(x, y + 72, w, 1);
    const fr = feedRect(g); feedHouse(fr, x + 104, y + 72); feedGatePost(fr, x + 100, y + 72); feedGatePost(fr, x + 172, y + 72);
    g.fillStyle(n('#261f15'), 1); g.fillRect(x + 72, y + 64, 26, 8);
    // the body where she fell, and the next one walking in from the left, crouching at the hedge
    g.fillStyle(n('#b8b2a3'), 1); g.fillRect(x + 52, y + 70, 9, 2); g.fillStyle(n('#1b1c21'), 1); g.fillRect(x + 50, y + 70, 2, 2);
    const u = Math.min(1, Math.max(0, (t - T.back - 0.4) / 2.6)), gx = Math.round(x + 4 + u * 62), crouch = u >= 1;
    g.fillStyle(n('#ebe6d8'), 1); g.fillRect(gx, y + (crouch ? 66 : 63), 3, crouch ? 6 : 9); g.fillStyle(n('#1b1c21'), 1); g.fillRect(gx, y + (crouch ? 65 : 62), 3, 2);
    g.fillStyle(0xe3412b, 1); if (Math.floor(t * 2) % 2 === 0) g.fillRect(x + 6, y + 7, 3, 3); ccText(g, 'LIVE', x + 12, y + 5, 0xebe6d8); ccText(g, 'CH 07', x + w - 34, y + 5, n('#d6a03c'));
    ccText(g, 'TAKE ' + (this.take0 + 1), x + 6, y + h - 22, 0xebe6d8);
    if (t >= T.round2) {
      // the show comes back over the feed: ROUND 2, READY?
      const on = Math.floor(t * 4) % 2, a = 'ROUND 2', b = 'READY?', bw = 100;
      g.fillStyle(0x0e0f12, 1); g.fillRect(x + w / 2 - bw / 2 - 1, y + 13, bw + 2, 36); g.fillStyle(n('#d6a03c'), 1); g.fillRect(x + w / 2 - bw / 2, y + 14, bw, 34); g.fillStyle(0x0e0f12, 1); g.fillRect(x + w / 2 - bw / 2 + 2, y + 16, bw - 4, 30);
      ccText(g, a, Math.round(x + w / 2 - ccWidth(a, 2) / 2), y + 18, n('#f2d58c'), { sx: 2, sy: 2 }); ccText(g, b, Math.round(x + w / 2 - ccWidth(b) / 2), y + 36, on ? 0xebe6d8 : n('#d6a03c'));
    }
  }
  // The game show, the same one she walks in on at the end (art/moon.js): the board, a gold path
  // drawing itself from target to target, and the feed from Earth in the corner. When the path
  // reaches the last target the amber box locks on the girl in the feed: +400, round over.
  drawShow(g, t) {
    const { x, y, w, h } = SCR, solved = t >= T.solve;
    g.fillStyle(0x0e0f12, 1); g.fillRect(x, y, w, h);
    g.fillStyle(0xe3412b, 1); g.fillRect(x + 6, y + 6, 28, 11); ccText(g, 'LIVE', x + 8, y + 8, 0xebe6d8);
    ccText(g, 'CH 07', x + w - 34, y + 8, n('#d6a03c'));
    const bx = x + 100, by = y + 22, u = Math.min(BOARD.path.length, Math.max(0, (t - 0.8) / (T.solve - 0.8) * BOARD.path.length));
    drawBoard(g, bx, by, u);
    // the feed: she walks along the fence; the box closes in as the path gets near
    const fx = x + 8, fy = y + 22, fw = 80, fh = 48, gx = fx + 6 + Math.min(24, t * 4);
    drawFeedBox(g, fx, fy, fw, fh, gx);
    const close = Math.min(1, Math.max(0, (t - 1) / (T.solve - 1.2))), bs = Math.round(22 - close * 14);
    if (!solved || Math.floor(t * 8) % 2) { g.lineStyle(1, n('#ffb01f'), 1); g.strokeRect(Math.round(gx + 1 - bs / 2), Math.round(fy + fh - 10 - bs / 2), bs, bs); }
    ccText(g, 'ROUND 1', x + 8, y + h - 12, n('#d6a03c'));
    ccText(g, 'SCORE ' + (solved ? 2400 : 2000), x + 8, y + h - 22, n('#f5ce77'));
    if (solved && Math.floor(t * 8) % 2 === 0) ccText(g, '+400', bx + 64, by + 2, n('#f2d58c'));
    if (solved && t < T.solve + 0.15) { g.fillStyle(0xebe6d8, 1); g.fillRect(x, y, w, h); }
  }

  // ------------------------------------------------------------------ the kids
  drawKids(t) {
    const cheer = this.solvedAt != null && t < T.cut;
    this.kidImgs.forEach((img, i) => {
      let pose = Math.floor(t * 0.7 + i * 0.6) % 4 === 0 ? 'back1' : 'back';
      if (cheer) pose = Math.floor(t * 6 + i) % 2 ? 'cheer' : 'cheer1';
      if (i === 1 && t >= T.turn && t < T.black) pose = 'turned';
      img.setTexture('mk_' + (i ? 'b' : 'a') + '_' + pose);
    });
    // the big one's controller, held up by her shoulder (a small dark slab, a gold button)
    const h = this.handG, k = KIDS[0]; h.clear();
    if (!cheer) { h.fillStyle(0x0e0f12, 1); h.fillRect(k.x + 6, KY - 13, 7, 5); h.fillStyle(n('#d6a03c'), 1); h.fillRect(k.x + 8, KY - 12, 3, 1); if (t > T.round2 && Math.floor(t * 4) % 2) { h.fillStyle(0xe3412b, 1); h.fillRect(k.x + 11, KY - 11, 1, 1); } }
  }

  // ------------------------------------------------------------------ the feed from Earth, full frame
  drawFeed(t, dt) {
    const g = this.feedG, P = this.P, L = this.light, G = F.ground; g.clear();
    // she walks out past the lamp toward the hedge, then stops: the lamp turns to her
    const u = Math.min(1, Math.max(0, (t - T.feed - 0.3) / 1.8)), gx = Math.round(F.girl0 + (F.girl1 - F.girl0) * u), walking = u > 0 && u < 1;
    const hit = this.hitAt != null; this.g1x = gx;
    this.girl1.setVisible(!hit).setPosition(gx, G).setTexture(walking && Math.floor(t * 6) % 2 ? 'girl_pass' : 'girl_stand');
    this.body1.setVisible(hit).setPosition(gx, G);
    // the searchlight: one slow sweep, then it swings onto her and holds; a checker of light
    const aimAt = Math.atan2(G - 8 - F.lamp.y, gx - F.lamp.x) * 180 / Math.PI, sweep = 20 + 40 * (Math.sin((t - T.feed) * 1.3) + 1) / 2;
    const toward = Math.min(1, Math.max(0, (t - (T.lockAt - 0.5)) / 0.5)) * (1 - Math.min(1, Math.max(0, (t - T.fire - 0.8) / 0.6)));
    const ang = sweep + (aimAt - sweep) * toward, half = 8, range = 190;
    const pts = [{ x: F.lamp.x, y: F.lamp.y + 1 }]; for (let a = ang - half; a <= ang + half + 0.01; a += 2) { const r = a * Math.PI / 180; let d = range; const yy = F.lamp.y + Math.sin(r) * d; if (yy > G) d = (G - F.lamp.y) / Math.sin(r); pts.push({ x: F.lamp.x + Math.cos(r) * d, y: F.lamp.y + Math.sin(r) * d }); }
    const lock = t >= T.lockAt && !hit;
    L.begin(1); L.poly(pts, lock ? P.hazard : '#f2d58c', 'checker'); L.end(); L.img.setPosition(0, -1);
    // the lock box closing on her, the satellite sliding into place at the top of the feed
    if (lock && t < T.fire) {
      const k = Math.min(1, (t - T.lockAt) / (T.fire - T.lockAt)), r = 9 - k * 7;
      g.lineStyle(1, n(P.hazard), 1); g.strokeRect(Math.round(gx - 4 - r), Math.round(G - 11 - r), Math.round(8 + 2 * r), Math.round(8 + 2 * r));
      this.satX = this.satX == null ? 330 : this.satX + (230 - this.satX) * 0.2;
      SatelliteStrike.drawSat(g, P, Math.round(this.satX), 3, null, 0);
    }
    this.strike.update(dt);
    // the broadcast's marks: LIVE, the channel, the take
    if (Math.floor(t * 2) % 2 === 0) { g.fillStyle(n(P.hazard), 1); g.fillRect(6, 7, 3, 3); }
    ccText(g, 'LIVE', 12, 5, 0xebe6d8); ccText(g, 'CH 07', 320 - 6 - ccWidth('CH 07'), 5, n('#d6a03c'));
    ccText(g, 'TAKE ' + (this.hitAt == null || t < this.hitAt + 1.2 ? this.take0 : this.take0 + 1), 6, 168, 0xebe6d8);
  }
  // the cut: a few frames of static, hard square noise in four greys
  drawStatic(t) {
    const g = this.staticG; g.clear();
    if (!(t >= T.cut && t < T.feed)) return;
    const cols = [0x0e0f12, 0x45474d, 0x8f8d87, 0xebe6d8];
    for (let y = 0; y < 180; y += 2) for (let x = 0; x < 320; x += 4) { g.fillStyle(cols[Math.floor(Math.random() * 4)], 1); g.fillRect(x, y, 4, 2); }
  }
}
