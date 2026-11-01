// Side rooms behind optional doors: one screen, no hazards, things to look at with E. The
// episode sleeps while she is inside and wakes where she left it. Clues live here, never
// anything she needs to finish.
import { Music } from '../core/music.js';
import { Painter, rng, hexNum } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode } from '../core/side.js';
import { reviewKeys } from '../core/review.js';
import { paintWardrobe } from '../art/bedroom.js';

const G = 160;

function frame(p, P, x, y, w, h) { p.rect(x - 1, y - 1, w + 2, h + 2, P.void); p.rect(x, y, w, h, P.device); }
function screenGrounds(p, P, x, y, w, h) { p.rect(x, y, w, h, P.skyTop); p.rect(x, y + h - 6, w, 6, P.ground); p.rect(x + 6, y + h - 14, w - 12, 8, P.wall); p.rect(x + w / 2 - 3, y + h - 18, 6, 4, P.gold); p.glowPoly([[x + 8, y + h - 14], [x + 2, y], [x + 7, y]], P.shaft, 0.5); p.px(x + w - 6, y + 3, P.moon); }
function screenHall(p, P, x, y, w, h) { p.rect(x, y, w, h, P.wall); p.rect(x, y + h - 5, w, 5, P.floor); [4, 13, 22].forEach(i => { p.rect(x + i, y + 4, 5, 7, P.gold); p.rect(x + i + 1, y + 5, 3, 5, P.wallLo); }); p.px(x + 15, y + h - 7, P.kid); }
function screenStatic(p, P, x, y, w, h, seed) { const r = rng(seed); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(x + i, y + j, r() < 0.5 ? P.dust : P.void); }
function screenCorridor(p, P, x, y, w, h) { p.rect(x, y, w, h, P.wallLo); p.poly([[x, y + h], [x + w * 0.4, y + h * 0.45], [x + w * 0.6, y + h * 0.45], [x + w, y + h]], P.floor); p.px(x + w / 2, y + h * 0.45 - 2, P.led); }
function screenThisRoom(p, P, x, y, w, h) { p.rect(x, y, w, h, P.wallLo); p.rect(x + 3, y + 3, w - 16, 7, P.device); p.rect(x + 3, y + 12, w - 16, 3, P.wood); p.px(x + w - 9, y + h - 6, P.kid); p.rect(x + w - 9, y + h - 5, 1, 3, P.kidLo); }
function screenNoSignal(p, P, x, y, w, h) { p.rect(x, y, w, h, P.void); p.rect(x + 4, y + h / 2 - 1, w - 8, 2, P.device); }

function paintStaff(P) {
  const p = new Painter(320, 180), r = rng(5);
  p.rect(0, 0, 320, 180, P.wallLo);
  p.rect(0, 0, 320, 18, P.void); p.rect(0, 18, 320, 2, P.device);
  for (let x = 0; x < 320; x += 40) p.rect(x, 20, 1, 140, P.wallLine);
  p.rect(0, G, 320, 20, P.floorLo); for (let x = 0; x < 320; x += 10) p.rect(x, G + 3 + (x % 20 ? 0 : 6), 9, 1, P.floor);
  p.rect(0, G, 320, 1, P.colLo);
  // the door back
  p.rect(18, G - 30, 16, 30, P.wall); p.rect(19, G - 29, 14, 29, P.wallHi); p.px(30, G - 15, P.gold); p.glowRect(14, G - 2, 24, 2, P.lamp, 0.15);
  // a wall of monitors over a console desk
  const shots = [screenGrounds, screenHall, (q, PP, x, y, w, h) => screenStatic(q, PP, x, y, w, h, 3), screenCorridor, screenThisRoom, screenNoSignal];
  shots.forEach((f, i) => { const x = 48 + (i % 3) * 34, y = 38 + Math.floor(i / 3) * 27; frame(p, P, x - 2, y - 2, 32, 24); f(p, P, x, y, 28, 20); p.mark('rec', x + 25, y + 2); });
  p.rect(40, 128, 116, 4, P.wood); p.rect(40, 128, 116, 1, P.woodHi); p.rect(44, 132, 108, 28, P.wood); p.rect(48, 136, 100, 2, P.wallLine);
  for (let i = 0; i < 14; i++) p.px(52 + i * 7, 124 + (i % 2) * 2, i % 3 ? P.led : P.robotLed);
  p.rect(60, 120, 30, 8, P.device); p.rect(62, 121, 26, 5, P.glass);
  // a chair pushed back
  p.rect(160, 138, 14, 3, P.fabricLo); p.rect(171, 120, 3, 21, P.fabricLo); p.rect(165, 141, 2, 19, P.device); p.rect(161, G - 1, 12, 1, P.device);
  // a corkboard with a schedule
  p.rect(186, 46, 52, 40, P.woodHi); p.rect(188, 48, 48, 36, P.wood);
  p.rect(192, 52, 20, 26, P.colHi); for (let i = 0; i < 6; i++) p.rect(194, 55 + i * 4, 14 - (i % 3) * 3, 1, P.device); p.px(201, 52, P.led);
  p.rect(216, 56, 16, 12, P.col); p.rect(218, 59, 10, 1, P.device); p.rect(218, 62, 8, 1, P.device); p.px(223, 56, P.overlay);
  // a locker, open a crack: boxes of spare glasses
  p.rect(250, 70, 26, 90, P.device); p.rect(251, 71, 24, 88, P.wallLine); p.rect(251, 71, 12, 88, P.device);
  for (let i = 0; i < 4; i++) { p.rect(264, 80 + i * 18, 10, 8, P.void); p.rect(265, 82 + i * 18, 3, 1, P.overlay); p.rect(269, 82 + i * 18, 3, 1, P.overlay); }
  for (let i = 0; i < 4; i++) p.rect(253, 76 + i * 4, 8, 1, P.wallLine);
  // his bedroll, dropped by the far wall
  p.ellipse(296, G - 5, 14, 5, P.sibLo); p.ellipse(296, G - 6, 13, 3, P.sib); p.rect(287, G - 10, 2, 10, P.wood); p.rect(303, G - 10, 2, 10, P.wood); p.ellipse(284, G - 5, 3, 5, P.sibHi);
  // a single lamp
  p.rect(212, 18, 2, 10, P.device); p.rect(206, 28, 14, 3, P.lamp); p.glowPoly([[206, 31], [220, 31], [250, G], [176, G]], P.lamp, 0.06);
  r();
  return p;
}

function paintKeeper(P) {
  const p = new Painter(320, 180), r = rng(9);
  p.rect(0, 0, 320, 180, P.wallLo);
  p.rect(0, 0, 320, 20, P.void); for (let x = 6; x < 320; x += 22) p.rect(x, 12, 14, 8, P.wood);
  for (let y = 24; y < G; y += 12) p.rect(0, y, 320, 1, P.wallLine);
  p.rect(0, G, 320, 20, P.rubble); p.rect(0, G, 320, 1, P.rubbleHi); for (let i = 0; i < 60; i++) p.px(r() * 320, G + 2 + r() * 16, P.dust);
  // the door back
  p.rect(18, G - 30, 16, 30, P.wall); p.rect(19, G - 29, 14, 29, P.wallHi); p.px(30, G - 15, P.gold); p.glowRect(14, G - 2, 24, 2, P.lamp, 0.15);
  // tools on a pegboard
  p.rect(44, 40, 70, 46, P.wood); for (let x = 48; x < 112; x += 5) for (let y = 44; y < 84; y += 5) p.px(x, y, P.woodHi);
  p.rect(52, 46, 2, 30, P.device); p.rect(48, 44, 10, 3, P.colLo); p.rect(64, 48, 2, 26, P.device); p.poly([[62, 74], [68, 74], [65, 82]], P.colLo);
  p.rect(78, 46, 12, 2, P.colLo); p.rect(83, 48, 2, 24, P.device); p.rect(96, 50, 10, 10, P.colLo); p.rect(99, 60, 3, 18, P.device);
  // a rack of drones on chargers, green lights
  p.rect(128, 52, 64, 50, P.device); p.rect(130, 54, 60, 46, P.wallLine);
  for (let i = 0; i < 6; i++) { const x = 134 + (i % 3) * 19, y = 60 + Math.floor(i / 3) * 20; p.rect(x, y, 13, 4, P.colLo); p.rect(x - 1, y - 1, 4, 1, P.colLo); p.rect(x + 10, y - 1, 4, 1, P.colLo); p.mark('led', x + 6, y + 5); }
  // a work bench with searchlight bulbs, a small TV on a crate
  p.rect(200, 120, 70, 4, P.wood); p.rect(200, 120, 70, 1, P.woodHi); p.rect(204, 124, 3, 36, P.wood); p.rect(263, 124, 3, 36, P.wood);
  for (let i = 0; i < 7; i++) { p.circle(208 + i * 8, 116, 3, P.glassLit); p.rect(207 + i * 8, 118, 3, 2, P.colLo); }
  p.rect(230, 140, 26, 20, P.wood); p.rect(232, 124, 22, 16, P.device);
  ['#c8c8c8', '#d6c84a', '#4ac6d6', '#4ad65e', '#d64ad0', '#d64a4a', '#4a5ed6'].forEach((c, i) => p.rect(234 + i * 3, 126, 3, 9, c));
  p.rect(234, 135, 18, 3, P.void); p.mark('tv', 243, 136);
  // a crew coat on a hook, a pass on a lanyard
  p.rect(290, 44, 3, 3, P.device); p.poly([[284, 48], [298, 48], [302, 96], [280, 96]], P.fabricLo); p.rect(288, 50, 1, 40, P.fabric);
  p.rect(294, 60, 1, 14, P.hazard); p.rect(292, 74, 6, 8, P.colHi); p.rect(293, 76, 4, 1, P.device); p.rect(293, 78, 3, 1, P.device);
  // a list pinned by the door
  p.rect(40, 100, 18, 22, P.colHi); for (let i = 0; i < 5; i++) p.rect(42, 103 + i * 4, 12 - (i % 2) * 4, 1, P.device);
  // one bare bulb
  p.rect(160, 20, 1, 12, P.device); p.circle(160, 34, 3, P.lamp); p.glowPoly([[156, 36], [164, 36], [230, G], [90, G]], P.lamp, 0.07);
  return p;
}

// The workshop off the east wing's landing: where the house is fixed between takes.
function paintWorkshop(P) {
  const p = new Painter(320, 180), r = rng(14);
  p.rect(0, 0, 320, 180, P.wallLo);
  p.rect(0, 0, 320, 18, P.void); for (let x = 10; x < 320; x += 30) p.rect(x, 12, 20, 6, P.wood);
  for (let y = 26; y < G; y += 14) p.rect(0, y, 320, 1, P.wallLine);
  p.rect(0, G, 320, 20, P.wood); p.rect(0, G, 320, 1, P.woodHi); for (let i = 0; i < 70; i++) p.px(r() * 320, G + 2 + r() * 16, P.dust);
  // the door back
  p.rect(18, G - 30, 16, 30, P.wall); p.rect(19, G - 29, 14, 29, P.wallHi); p.px(30, G - 15, P.gold); p.glowRect(14, G - 2, 24, 2, P.lamp, 0.15);
  // a bench with a tray of cracked glasses and a lamp on an arm
  p.rect(48, 118, 92, 4, P.wood); p.rect(48, 118, 92, 1, P.woodHi); p.rect(52, 122, 3, 38, P.wood); p.rect(133, 122, 3, 38, P.wood);
  p.rect(58, 112, 40, 6, P.device); p.rect(59, 113, 38, 4, P.wallLine);
  for (let i = 0; i < 8; i++) { const x = 61 + (i % 4) * 9, y = 113 + Math.floor(i / 4) * 2; p.rect(x, y, 3, 1, P.overlay); p.rect(x + 4, y, 3, 1, P.overlay); if (i % 3 === 0) p.px(x + 1, y, '#ffffff'); }
  p.rect(108, 96, 2, 22, P.device); p.rect(108, 96, 14, 2, P.device); p.rect(118, 98, 8, 4, P.colLo); p.glowPoly([[116, 102], [128, 102], [136, 118], [104, 118]], P.lamp, 0.12);
  // a beam on two sawhorses, sawn halfway through
  p.rect(160, 128, 92, 8, P.wood); p.rect(160, 128, 92, 1, P.woodHi); p.rect(204, 128, 2, 4, P.void); p.px(205, 132, P.dust); p.px(203, 133, P.dust);
  [[166, 136], [238, 136]].forEach(([x, y]) => { p.line(x, y, x - 6, G, P.wood); p.line(x + 2, y, x + 8, G, P.wood); p.rect(x - 4, y, 10, 2, P.wood); });
  p.rect(212, 120, 18, 2, P.colLo); for (let i = 0; i < 6; i++) p.px(213 + i * 3, 122, P.colLo); // the saw, left on top
  for (let i = 0; i < 14; i++) p.px(196 + r() * 18, G - 1 - r() * 2, P.woodHi); // sawdust
  // a small monitor on a shelf, a clipboard on a nail
  p.rect(262, 70, 44, 3, P.wood); p.rect(266, 52, 30, 18, P.device); p.rect(268, 54, 26, 14, P.glass); p.mark('rec', 291, 55);
  p.rect(275, 60, 6, 1, P.wood); p.px(277, 58, P.kid); p.px(278, 59, P.kid); // her, falling, small
  p.rect(268, 92, 18, 24, P.colHi); p.rect(274, 90, 6, 3, P.device); for (let i = 0; i < 5; i++) p.rect(270, 96 + i * 4, 12 - (i % 2) * 4, 1, P.device);
  // one bare bulb
  p.rect(150, 20, 1, 12, P.device); p.circle(150, 34, 3, P.lamp); p.glowPoly([[146, 36], [154, 36], [220, G], [80, G]], P.lamp, 0.07);
  return p;
}

// Room data. Texts are short and literal; a function gets the episode's take number.
const ROOMS = {
  keeper: {
    paint: paintKeeper, bg: 'wallLo',
    items: [
      { x0: 40, x1: 60, y: 98, text: ['A list: lights on at dusk. Lights on at dawn.', 'There is no line for lights off.'] },
      { x0: 128, x1: 192, y: 50, text: ['Six drones on chargers. Each one has a camera.'] },
      { x0: 200, x1: 270, y: 110, text: ['Spare searchlight bulbs. Hundreds.', 'A small TV. CH 07. Stand by.'] },
      { x0: 278, x1: 304, y: 42, text: ['A crew coat. The pass says SEASON 41.'] }
    ]
  },
  workshop: {
    paint: paintWorkshop, bg: 'wallLo',
    items: [
      { x0: 52, x1: 104, y: 106, text: ['A tray of cracked glasses. Dozens of pairs.', 'A label on the tray: FIX BEFORE NEXT TAKE.'] },
      { x0: 160, x1: 252, y: 118, text: ['A beam on two sawhorses, sawn halfway through.', 'The same size as the one that broke under her.'] },
      { x0: 262, x1: 306, y: 48, text: ['A small screen. CH 07. Her fall, over and over.', 'Tape under the screen: KEEP THE FALL.'] },
      { x0: 266, x1: 288, y: 88, text: [take => 'A clipboard. Episode 3, take ' + take + '. The fall: done.'] }
    ]
  },
  wardrobe: {
    paint: paintWardrobe, bg: 'wallLo',
    items: [
      { x0: 56, x1: 174, y: 54, text: ['Jackets on a rail. Her jacket, in her size.', 'Every one has the same tear in the left sleeve.'] },
      { x0: 186, x1: 242, y: 38, text: ['Photos pinned in a row, all of her, in that jacket.', 'Each one is stamped CONTINUITY.'] },
      { x0: 250, x1: 300, y: 42, text: ['A mirror ringed with bulbs.', 'Behind the glass, a small red light.'] },
      { x0: 60, x1: 168, y: 146, text: ['Small shoes in a row, worn down at the same heel.'] }
    ]
  },
  staff: {
    paint: paintStaff, bg: 'wallLo',
    items: [
      { x0: 46, x1: 150, y: 34, text: ['Six feeds from the house.', 'One of them is this room.'] },
      { x0: 186, x1: 238, y: 44, text: [take => 'A schedule. Tonight: episode 2, take ' + take + '.', 'Every take has a line. Most are crossed out.'] },
      { x0: 250, x1: 276, y: 68, text: ['Spare glasses. Boxes of them.'] },
      { x0: 282, x1: 310, y: 146, text: ['His bedroll. He came this way.'] }
    ]
  }
};

export class Room extends SideEpisode {
  constructor() { super('room'); }

  create(data) {
    data = data || {}; this.from = data.from || 'gallery'; this.take = data.take || 1;
    const R = ROOMS[data.id] || ROOMS.staff;
    const W = 20, H = 12, m = [];
    for (let y = 0; y < H; y++) m.push(new Array(W).fill(0));
    for (let x = 0; x < W; x++) { m[10][x] = 1; m[11][x] = 1; m[0][x] = 1; }
    for (let y = 0; y < 10; y++) { m[y][0] = 1; m[y][W - 1] = 1; }
    this.initSide('room-' + (data.id || 'staff'), { w: W, h: H, start: { x: 40, y: G - 14 }, door: { x: -999, y: -999, w: 0, h: 0 } }, { W, H, m });
    const P = this.P;
    makeSprites(this, P);
    const art = R.paint(P); art.toTexture(this, 'room_art'); this.marks = art.marks;
    this.pixelCamera(320, P[R.bg]); this.cameras.main.centerOn(160, 90);
    this.add.image(0, 0, 'room_art').setOrigin(0).setDepth(0);
    this.roomFx = this.add.graphics().setDepth(1);
    this.commonLayers();
    this.spawn(40); this.kid.face = 1;
    R.items.forEach(it => { it.n = 0; this.things.push({ x0: it.x0, x1: it.x1, y0: Math.min(it.y + 4, 130), y1: G, label: 'E', noPrompt: false, use: () => this.describe(it) }); });
    this.things.push({ x0: 18, x1: 34, y0: G - 30, y1: G, label: 'E', use: () => this.leave() });
    this.hum = Sound.hum(0.02); Music.level(0.45, 0.5);
    this.events.once('shutdown', () => { this.hum.stop(0.2); overlay.hint(''); });
    this.cameras.main.fadeIn(300);
    overlay.hint('E looks at things. E at the door goes back.');
    window.__game = { scene: this, state };
  }

  describe(it) {
    if (!it.src) it.src = { lines: () => it.text.map(raw => typeof raw === 'function' ? raw(this.take) : raw) };
    this.bubbles.look('item', it.src, () => ({ x: (it.x0 + it.x1) / 2, y: it.y }), { leave: 70 });
  }

  skipAhead() { this.leave(); }
  leave() {
    if (this.leaving) return;
    Music.level(1, 0.8);
    this.leaving = true; Sound.tone(300, 0.08, 'triangle', 0.02);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => { this.scene.wake(this.from); this.scene.stop(); });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    reviewKeys(this);
    if (!this.leaving) { this.moveKid(dt); this.updateThings(); }
    this.drawGirl();
    const g = this.roomFx; g.clear();
    if (Math.floor(this.clock * 2) % 2 === 0) (this.marks || []).forEach(mk => { if (mk.kind === 'rec') { g.fillStyle(hexNum(this.P.led), 1); g.fillRect(mk.x, mk.y, 1, 1); } });
    (this.marks || []).forEach((mk, i) => { if (mk.kind === 'led') { g.fillStyle(hexNum(this.P.robotLed), Math.sin(this.clock * 2 + i) > 0 ? 1 : 0.35); g.fillRect(mk.x, mk.y, 1, 1); } });
    this.drawThings();
    c.endFrame();
  }
}
