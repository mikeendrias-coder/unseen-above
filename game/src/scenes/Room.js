// Side rooms behind optional doors: one screen, no hazards, things to look at with E. The
// episode sleeps while she is inside and wakes where she left it. Clues live here, never
// anything she needs to finish.
import { Painter, rng, hexNum } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { SideEpisode } from '../core/side.js';

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

// Room data. Texts are short and literal; a function gets the episode's take number.
const ROOMS = {
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
    this.hum = Sound.hum(0.02);
    this.events.once('shutdown', () => { this.hum.stop(0.2); overlay.hint(''); });
    this.cameras.main.fadeIn(300);
    overlay.hint('E looks at things. E at the door goes back.');
    window.__game = { scene: this, state };
  }

  describe(it) {
    const raw = it.text[it.n % it.text.length], text = typeof raw === 'function' ? raw(this.take) : raw;
    it.n++;
    this.bubbles.say('item', text, () => ({ x: Math.max(60, Math.min(260, (it.x0 + it.x1) / 2)), y: it.y }), { edge: 0xffffff, ink: 0xffffff, pitch: 520 });
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true; Sound.tone(300, 0.08, 'triangle', 0.02);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => { this.scene.wake(this.from); this.scene.stop(); });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (!this.leaving) { this.moveKid(dt); this.updateThings(); }
    this.drawGirl();
    const g = this.roomFx; g.clear();
    if (Math.floor(this.clock * 2) % 2 === 0) (this.marks || []).forEach(mk => { if (mk.kind === 'rec') { g.fillStyle(hexNum(this.P.led), 1); g.fillRect(mk.x, mk.y, 1, 1); } });
    this.drawThings();
    c.endFrame();
  }
}
