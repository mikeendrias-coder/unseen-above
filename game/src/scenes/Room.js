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
import { pixText } from '../art/pixfont.js';
import { reviewKeys } from '../core/review.js';
import { paintWardrobe } from '../art/bedroom.js';
import { Props } from '../core/props.js';

const G = 160;
// the door back to the house: a plain door with a 1 px outline
function doorBack(p, P) { p.rect(17, G - 31, 18, 31, P.crack); p.rect(18, G - 30, 16, 30, P.wall); p.rect(19, G - 29, 14, 29, P.wallHi); p.px(30, G - 15, P.gold); p.rect(19, G - 1, 14, 1, P.wallLine); }

function frame(p, P, x, y, w, h) { p.rect(x - 1, y - 1, w + 2, h + 2, P.void); p.rect(x, y, w, h, P.device); }
function screenGrounds(p, P, x, y, w, h) { p.rect(x, y, w, h, P.skyTop); p.rect(x, y + h - 6, w, 6, P.ground); p.rect(x + 6, y + h - 14, w - 12, 8, P.wall); p.rect(x + w / 2 - 3, y + h - 18, 6, 4, P.gold); p.poly([[x + 8, y + h - 14], [x + 2, y], [x + 7, y]], 'd:' + P.shaft + ':' + P.skyTop + ':checker'); p.px(x + w - 6, y + 3, P.moon); }
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
  // no lamp here: the six monitors are the light. A flat lit patch of wall round them, and their
  // light on the floor in front of the desk, hard edged
  p.rect(38, 30, 120, 98, P.wall); p.rect(38, 30, 120, 1, P.wallHi);
  p.rect(34, G, 128, 20, P.device); p.rect(34, G, 128, 1, P.col);
  // the door back
  doorBack(p, P);
  // a wall of monitors over a console desk
  const shots = [screenGrounds, screenHall, (q, PP, x, y, w, h) => screenStatic(q, PP, x, y, w, h, 3), screenCorridor, screenThisRoom, screenNoSignal];
  shots.forEach((f, i) => { const x = 48 + (i % 3) * 34, y = 38 + Math.floor(i / 3) * 27; frame(p, P, x - 2, y - 2, 32, 24); f(p, P, x, y, 28, 20); p.mark('rec', x + 25, y + 2); });
  // the console desk stands against the back wall under the monitors: she walks in front of it,
  // so its body is the wall's dark tone (background), not a crate to climb
  p.rect(40, 128, 116, 4, P.wood); p.rect(40, 128, 116, 1, P.woodHi); p.rect(44, 132, 108, 28, P.wallLo); p.rect(44, 132, 108, 1, P.crack); p.rect(48, 136, 100, 2, P.wood);
  for (let i = 0; i < 14; i++) p.px(52 + i * 7, 124 + (i % 2) * 2, i % 3 ? P.led : P.robotLed);
  p.rect(60, 120, 30, 8, P.device); p.rect(62, 121, 26, 5, P.glass);
  // a corkboard with a schedule
  p.rect(186, 46, 52, 40, P.woodHi); p.rect(188, 48, 48, 36, P.wood);
  p.rect(192, 52, 20, 26, P.colHi); for (let i = 0; i < 6; i++) p.rect(194, 55 + i * 4, 14 - (i % 3) * 3, 1, P.device); p.px(201, 52, P.led);
  p.rect(216, 56, 16, 12, P.col); p.rect(218, 59, 10, 1, P.device); p.rect(218, 62, 8, 1, P.device); p.px(223, 56, P.overlay);
  // a locker, open a crack: boxes of spare glasses. Its top is a ledge (ROOMS.staff.solids)
  p.rect(249, 89, 28, 71, P.crack); p.rect(250, 90, 26, 70, P.device); p.rect(250, 90, 26, 1, P.colLo); p.rect(251, 92, 24, 67, P.wallLine); p.rect(251, 92, 12, 67, P.device);
  for (let i = 0; i < 4; i++) { p.rect(264, 98 + i * 15, 10, 8, P.void); p.rect(265, 100 + i * 15, 3, 1, P.overlay); p.rect(269, 100 + i * 15, 3, 1, P.overlay); }
  for (let i = 0; i < 4; i++) p.rect(253, 96 + i * 4, 8, 1, P.wallLine);
  // his bedroll, dropped by the far wall
  p.ellipse(296, G - 5, 14, 5, P.sibLo); p.ellipse(296, G - 6, 13, 3, P.sib); p.rect(287, G - 10, 2, 10, P.wood); p.rect(303, G - 10, 2, 10, P.wood); p.ellipse(284, G - 5, 3, 5, P.sibHi);
  r();
  return p;
}

function paintKeeper(P) {
  const p = new Painter(320, 180), r = rng(9);
  p.rect(0, 0, 320, 180, P.wallLo);
  for (let y = 24; y < G; y += 12) p.rect(0, y, 320, 1, P.wallLine);
  // a shed roof, low and slanted: high over the door, down to the far wall, rafters along it
  const roof = x => Math.round(14 + x * 30 / 320);
  p.poly([[0, 0], [320, 0], [320, roof(320)], [0, roof(0)]], P.void);
  for (let x = 0; x < 320; x++) p.px(x, roof(x), P.wood);
  for (let x = 10; x < 320; x += 26) p.rect(x, roof(x) - 6, 3, 6, P.wood);
  // a window over the bench: across the dark, the house, every window lit
  const wx = 202, wy = 50, ww = 60, wh = 46;
  p.rect(wx - 2, wy - 2, ww + 4, wh + 4, P.crack); p.rect(wx - 1, wy - 1, ww + 2, wh + 2, P.wood);
  p.rect(wx, wy, ww, wh, P.skyTop); p.rect(wx, wy + wh - 8, ww, 8, P.ground); p.px(wx + 50, wy + 5, P.moon); p.px(wx + 8, wy + 9, P.star);
  p.rect(wx + 10, wy + 18, 40, 20, P.wall); p.rect(wx + 22, wy + 12, 16, 6, P.wall); p.rect(wx + 10, wy + 18, 40, 1, P.wallHi);
  for (let i = 0; i < 6; i++) p.rect(wx + 13 + i * 6, wy + 22, 3, 4, P.win); for (let i = 0; i < 6; i++) p.rect(wx + 13 + i * 6, wy + 30, 3, 4, i === 2 ? P.winLo : P.win);
  p.rect(wx + 27, wy + 14, 6, 3, P.win);
  p.rect(wx + ww / 2, wy, 1, wh, P.wood); p.rect(wx, wy + wh / 2, ww, 1, P.wood);
  // its light: a flat, slanted patch down the wall and across the floor
  p.poly([[wx, wy + wh + 1], [wx + ww, wy + wh + 1], [wx + ww - 10, G], [wx - 34, G]], P.wall);
  p.rect(0, G, 320, 20, P.rubble); p.rect(0, G, 320, 1, P.rubbleHi); for (let i = 0; i < 60; i++) p.px(r() * 320, G + 2 + r() * 16, P.dust);
  p.poly([[168, G + 1], [252, G + 1], [246, 180], [150, 180]], P.rubbleHi); // the window's light on the floor
  // the door back
  doorBack(p, P);
  // tools on a pegboard
  p.rect(40, 34, 60, 40, P.wood); for (let x = 44; x < 98; x += 5) for (let y = 38; y < 72; y += 5) p.px(x, y, P.woodHi);
  p.rect(48, 40, 2, 26, P.device); p.rect(44, 38, 10, 3, P.colLo); p.rect(60, 42, 2, 22, P.device); p.poly([[58, 62], [64, 62], [61, 69]], P.colLo);
  p.rect(72, 40, 12, 2, P.colLo); p.rect(77, 42, 2, 22, P.device); p.rect(88, 44, 9, 9, P.colLo); p.rect(91, 53, 3, 14, P.device);
  // a high plank shelf on two brackets, out of reach from the floor (ROOMS.keeper.solids)
  p.rect(103, 89, 44, 5, P.crack); p.rect(104, 90, 42, 3, P.wood); p.rect(104, 90, 42, 1, P.woodHi);
  [110, 138].forEach(x => { p.rect(x, 93, 2, 8, P.device); for (let i = 0; i < 6; i++) p.px(x + 2 + Math.floor(i / 2), 93 + i, P.device); });
  // a rack of drones on chargers, green lights
  p.rect(150, 36, 48, 42, P.device); p.rect(152, 38, 44, 38, P.wallLine);
  for (let i = 0; i < 6; i++) { const x = 155 + (i % 3) * 14, y = 44 + Math.floor(i / 3) * 18; p.rect(x, y, 11, 4, P.colLo); p.rect(x - 1, y - 1, 3, 1, P.colLo); p.rect(x + 9, y - 1, 3, 1, P.colLo); p.mark('led', x + 5, y + 5); }
  // a work bench with searchlight bulbs, a small TV on a crate
  p.rect(200, 120, 70, 4, P.wood); p.rect(200, 120, 70, 1, P.woodHi); p.rect(204, 124, 3, 36, P.wood); p.rect(263, 124, 3, 36, P.wood);
  for (let i = 0; i < 7; i++) { p.circle(208 + i * 8, 116, 3, P.glassLit); p.rect(207 + i * 8, 118, 3, 2, P.colLo); }
  // the crate under the TV: solid (ROOMS.keeper.solids), so it reads as a crate: outline, light top, slats
  p.rect(229, 139, 28, 21, P.crack); p.rect(230, 140, 26, 20, P.wood); p.rect(230, 140, 26, 1, P.woodHi); [146, 153].forEach(y => p.rect(231, y, 24, 1, P.crack));
  p.rect(231, 123, 24, 17, P.crack); p.rect(232, 124, 22, 16, P.device);
  ['#b8b2a3', '#f5ce77', '#b8b2a3', '#f2d58c', '#6b6c70', '#e3412b', '#6b6c70'].forEach((c, i) => p.rect(234 + i * 3, 126, 3, 9, c));
  p.rect(234, 135, 18, 3, P.void); p.mark('tv', 243, 136);
  // a crew coat on a hook, a pass on a lanyard
  p.rect(290, 46, 3, 3, P.device); p.poly([[284, 49], [298, 49], [302, 96], [280, 96]], P.fabricLo); p.rect(288, 50, 1, 40, P.fabric);
  p.rect(294, 60, 1, 14, P.hazard); p.rect(292, 74, 6, 8, P.colHi); p.rect(293, 76, 4, 1, P.device); p.rect(293, 78, 3, 1, P.device);
  // a list pinned by the door
  p.rect(40, 96, 18, 22, P.colHi); for (let i = 0; i < 5; i++) p.rect(42, 99 + i * 4, 12 - (i % 2) * 4, 1, P.device);
  return p;
}

// The workshop off the east wing's landing: where the house is fixed between takes.
function paintWorkshop(P) {
  const p = new Painter(320, 180), r = rng(14);
  p.rect(0, 0, 320, 180, P.wallLo);
  for (let y = 26; y < G; y += 14) p.rect(0, y, 320, 1, P.wallLine);
  // no ceiling to speak of: two pipes along the top, on brackets
  p.rect(0, 0, 320, 10, P.void); p.rect(0, 12, 320, 3, P.device); p.rect(0, 12, 320, 1, P.colLo); p.rect(0, 19, 320, 2, P.device);
  for (let x = 24; x < 320; x += 48) { p.rect(x, 10, 2, 11, P.crack); p.px(x + 8, 15, P.crack); }
  p.rect(0, G, 320, 20, P.wood); p.rect(0, G, 320, 1, P.woodHi); for (let i = 0; i < 70; i++) p.px(r() * 320, G + 2 + r() * 16, P.dust);
  // the door back
  doorBack(p, P);
  // a bench with a tray of cracked glasses and a lamp on an arm
  p.rect(48, 118, 92, 4, P.wood); p.rect(48, 118, 92, 1, P.woodHi); p.rect(52, 122, 3, 38, P.wood); p.rect(133, 122, 3, 38, P.wood);
  p.rect(58, 112, 40, 6, P.device); p.rect(59, 113, 38, 4, P.wallLine);
  for (let i = 0; i < 8; i++) { const x = 61 + (i % 4) * 9, y = 113 + Math.floor(i / 4) * 2; p.rect(x, y, 3, 1, P.overlay); p.rect(x + 4, y, 3, 1, P.overlay); if (i % 3 === 0) p.px(x + 1, y, '#ebe6d8'); }
  // its light, thrown sideways off the bench: a flat wedge across the wall and the floor
  p.poly([[126, 98], [126, 104], [250, G], [250, 54]], P.wall); p.poly([[132, G + 1], [250, G + 1], [262, 180], [134, 180]], P.woodHi);
  p.rect(108, 96, 2, 22, P.device); p.rect(108, 96, 14, 2, P.device); p.rect(118, 97, 9, 6, P.crack); p.rect(119, 98, 7, 4, P.colLo); p.rect(126, 99, 1, 3, P.lamp);
  // a beam on two sawhorses, sawn halfway through
  p.rect(160, 128, 92, 8, P.wood); p.rect(160, 128, 92, 1, P.woodHi); p.rect(204, 128, 2, 4, P.void); p.px(205, 132, P.dust); p.px(203, 133, P.dust);
  [[166, 136], [238, 136]].forEach(([x, y]) => { p.line(x, y, x - 6, G, P.wood); p.line(x + 2, y, x + 8, G, P.wood); p.rect(x - 4, y, 10, 2, P.wood); });
  p.rect(212, 120, 18, 2, P.colLo); for (let i = 0; i < 6; i++) p.px(213 + i * 3, 122, P.colLo); // the saw, left on top
  for (let i = 0; i < 14; i++) p.px(196 + r() * 18, G - 1 - r() * 2, P.woodHi); // sawdust
  // a small monitor on a shelf, a clipboard on a nail
  p.rect(262, 70, 44, 3, P.wood); p.rect(266, 52, 30, 18, P.device); p.rect(268, 54, 26, 14, P.glass); p.mark('rec', 291, 55);
  p.rect(275, 60, 6, 1, P.wood); p.px(277, 58, P.kid); p.px(278, 59, P.kid); // her, falling, small
  p.rect(268, 92, 18, 24, P.colHi); p.rect(274, 90, 6, 3, P.device); for (let i = 0; i < 5; i++) p.rect(270, 96 + i * 4, 12 - (i % 2) * 4, 1, P.device);
  return p;
}

// Room data. Looks are things she notices, said plainly; a function gets the episode's take.
// furniture: real pieces (core/props.js piece): she pushes them, knocks them over (a run or K),
// climbs them. reveal: a box that opens when it lands hard (knocked off a shelf, say) and becomes
// a look. look: a look that follows the piece. loose: small things on top (core/props.js item).
// solids: fixed ledges and tops (she stands on them; pieces and loose things land on them).
const ROOMS = {
  keeper: {
    paint: paintKeeper, bg: 'wallLo',
    items: [
      { x0: 38, x1: 60, y: 94, text: ['A note by the door: lights on at dusk.', 'Lights on again at dawn. Never off.'] },
      { x0: 150, x1: 198, y: 36, text: ['Six drones charging on a rack.', 'Every one of them has a camera.'] },
      { x0: 200, x1: 270, y: 110, text: ['Spare searchlight bulbs. Hundreds of them.', 'And a little TV, stuck on channel 07.'] },
      { x0: 278, x1: 304, y: 42, text: ['A crew coat on a hook.', 'The pass on it says SEASON 41.'] }
    ],
    // the small TV on the crate: J turns the dial. Every channel is 07.
    use: { x0: 228, x1: 258, y: 122, key: 'tv', text: ['She turns the dial. Every channel is 07.'] },
    // solid: the bench top (she walks under it), the crate and the TV on it, the high shelf
    solids: [{ id: 'bench', x: 200, y: 120, w: 70, h: 4 }, { id: 'crate', x: 230, y: 140, w: 26, h: 20 }, { id: 'tv', x: 232, y: 124, w: 22, h: 16 },
      { id: 'shelf', x: 104, y: 90, w: 42, h: 3 }],
    // the work table and the stool both reach the high shelf; the tin up there opens when it falls
    furniture: [
      { kind: 'table', id: 'work table', x: 62, w: 30, tone: 'wood', loose: [{ kind: 'mug', dx: 4 }, { kind: 'jar', dx: 20, tone: 'ash4' }] },
      { kind: 'stool', id: 'stool', x: 182, tone: 'wood' },
      { kind: 'lamp', id: 'work lamp', x: 272, tone: 'grey' },
      { kind: 'box', id: 'tin', x: 118, y: 90, w: 12, h: 8, tone: 'grey', reveal: ['A tin full of old tapes.', 'Seasons 38, 39 and 40. All ESTATE 07.'] }
    ],
    loose: [{ kind: 'can', x: 107, y: 90 }]
  },
  workshop: {
    paint: paintWorkshop, bg: 'wallLo',
    items: [
      { x0: 52, x1: 104, y: 106, text: ['A tray of cracked glasses. Dozens of them.', 'The label says FIX BEFORE NEXT TAKE.'] },
      { x0: 160, x1: 252, y: 118, text: ['A beam, sawn halfway through.', 'Same size as the one that broke under her.'] },
      { x0: 266, x1: 288, y: 88, text: [take => 'A clipboard. Episode 3, take ' + take + '.', 'Next to THE FALL, someone wrote DONE.'] }
    ],
    // the small screen: J plays the tape. Her fall, over and over.
    use: { x0: 262, x1: 306, y: 48, key: 'tape', text: ['Her fall, on tape, over and over.', 'A note under the screen: KEEP THE FALL.'] },
    // solid: the bench top and its tray (she walks under the bench), the beam on the sawhorses
    solids: [{ id: 'bench', x: 48, y: 118, w: 92, h: 4 }, { id: 'tray', x: 58, y: 112, w: 40, h: 6 }, { id: 'beam', x: 160, y: 128, w: 92, h: 8 }],
    furniture: [
      { kind: 'chair', id: 'chair', x: 112, back: 1, tone: 'wood' },
      { kind: 'stool', id: 'stool', x: 144, tone: 'grey' },
      { kind: 'box', id: 'toolbox', x: 238, y: 128, w: 12, h: 7, tone: 'grey', reveal: ['A toolbox full of spare lenses.', 'Each one has a take number on it.'] },
      { kind: 'bin', id: 'bucket', x: 270, tone: 'grey', spill: 'bronzeHi', look: ['A bucket of sawdust.', 'From the beam, probably.'] }
    ],
    loose: [{ kind: 'mug', x: 122, y: 118 }]
  },
  wardrobe: {
    paint: paintWardrobe, bg: 'wallLo', doorX: 286,
    items: [
      { x0: 18, x1: 70, y: 40, text: ['A rail of jackets, all her size.', 'Same tear in the left sleeve on every one.'] },
      { x0: 118, x1: 166, y: 80, text: ['Photos of her, all in that jacket.', 'Every one is stamped CONTINUITY.'] },
      { x0: 186, x1: 232, y: 82, text: ['A mirror with bulbs all round it.', 'A note on the glass: SAME AS TAKE 1.'] },
      { x0: 74, x1: 116, y: 146, text: ['A row of little shoes.', 'All worn down at the same heel.'] }
    ],
    // the cord of the one bulb: J pulls it. In the dark, the light behind the mirror stays on.
    use: { x0: 240, x1: 262, y: 40, key: 'cord', text: ['She pulls the cord and the bulb goes out.', 'A red light is still on behind the mirror.'] },
    solids: [{ id: 'table', x: 182, y: 134, w: 54, h: 4 }], // the mirror's table: she walks under it
    furniture: [
      { kind: 'trunk', id: 'trunk', x: 30, tone: 'wood' },
      { kind: 'box', id: 'hat box', x: 36, y: 146, w: 10, h: 8, tone: 'card', reveal: ['A hat box with a wig in it.', 'Same color as her hair. Same cut.'] },
      { kind: 'stool', id: 'stool', x: 160, tone: 'wood' },
      { kind: 'bin', id: 'bin', x: 244, tone: 'wood', spill: 'boneLo', look: ['A bin full of torn-off sleeves.', 'Every one of them is a left sleeve.'] }
    ]
  },
  staff: {
    paint: paintStaff, bg: 'wallLo',
    items: [
      { x0: 46, x1: 150, y: 34, text: ['Six live feeds from the house.', 'One of them is this room.'] },
      { x0: 186, x1: 238, y: 44, text: [take => 'The schedule. Tonight: episode 2, take ' + take + '.', 'Every take gets a line. Most are crossed out.'] },
      { x0: 250, x1: 276, y: 100, text: ['Spare glasses. Boxes and boxes of them.'] }
    ],
    // his bedroll (Option C): J unrolls it; inside, his route through the house, in his hand
    use: { x0: 280, x1: 312, y: 146, key: 'bedroll', text: ['His bedroll. His map of the house is inside.', 'His route ends at the bedroom.'] },
    // the console desk is against the back wall (drawn dark, she walks in front of it); the
    // locker's top is a ledge, too high to jump to from the floor
    solids: [{ id: 'locker top', x: 250, y: 90, w: 26, h: 2 }],
    furniture: [
      { kind: 'chair', id: 'chair', x: 164, back: 1, tone: 'grey' },
      { kind: 'table', id: 'side table', x: 210, w: 20, tone: 'wood', loose: [{ kind: 'cup', dx: 3 }, { kind: 'tin', dx: 12, tone: 'ash3' }] },
      { kind: 'bin', id: 'bin', x: 238, tone: 'grey', look: ['The bin is full of old scripts.', 'Her lines, mostly. All crossed out.'] },
      { kind: 'box', id: 'box', x: 262, y: 90, w: 12, h: 8, tone: 'card', reveal: ['A box of old clapperboards.', 'Every one says EPISODE 2. Hundreds.'] }
    ]
  }
};

// The hint line, by what is next to her: plain words, the way a friend would tell you.
const PIECE_HINT = {
  table: 'Walk into the table to push it. You can climb on it, too.',
  trunk: "Walk into the trunk to push it. It's heavy.",
  crate: 'Walk into it to push it.',
  box: 'Press K to knock the box along, or walk into it.',
  chair: 'Run into the chair, or press K, to knock it over.',
  stool: 'Push the stool where you need it, then climb up. K knocks it over.',
  bin: 'Run into the bin, or press K, to knock it over.',
  lamp: 'Run into the lamp, or press K, to knock it over.',
  down: 'Press K to stand it back up.'
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
    const dx = R.doorX || 18; this.doorX = dx;
    this.props = (R.solids || []).map(r => Object.assign({}, r)); // fixed tops and ledges she can stand on
    this.spawn(R.spawnX != null ? R.spawnX : dx < 160 ? 40 : dx - 22); this.kid.face = dx < 160 ? 1 : -1;
    // the furniture: real pieces under the dark of the wardrobe's bulb (depth 1.2 < 1.5)
    this.dyn = new Props(this, { depth: 1.2 });
    this.pieces = (R.furniture || []).map(f => {
      const p = this.dyn.piece(Object.assign({}, f, { y: f.y != null ? f.y : G }));
      (f.loose || []).forEach(l => this.dyn.item(Object.assign({}, l, { x: p.x + l.dx, y: p.y })));
      return p;
    });
    (R.loose || []).forEach(l => this.dyn.item(Object.assign({}, l)));
    // the items are looks, so the room's one thing to do wins when both are in reach (the shed's TV
    // sits on its crate inside the bench's span)
    R.items.forEach(it => { it.n = 0; this.things.push({ x0: it.x0, x1: it.x1, y0: Math.min(it.y + 4, 130), y1: G, label: 'J', look: true, noPrompt: false, use: () => this.describe(it) }); });
    // one thing to do in each room, not only to look at
    this.act = { on: false, t: 0, n: 0 }; this.roomId = data.id || 'staff'; this.useSrc = null; // the scene object is reused from room to room
    if (R.use) this.things.push({ x0: R.use.x0, x1: R.use.x1, y0: Math.min(R.use.y + 4, 130), y1: G, py: R.use.y, label: 'J', use: () => this.doUse(R.use) });
    // looks that ride on the furniture: a box that opens when it lands hard says what was in it
    (R.furniture || []).forEach((f, i) => {
      const p = this.pieces[i], text = f.reveal || f.look; if (!text) return;
      const it = { x0: p.x, x1: p.x + p.w, y: p.y, text, n: 0, piece: p };
      const th = { x0: p.x - 2, x1: p.x + p.w + 2, y0: p.y, y1: p.y + p.h, label: 'J', look: true, off: !!f.reveal, use: () => this.describe(it) };
      this.things.push(th); p.thing = th;
      if (f.reveal) p.onLand = q => {
        if (q.open) return;
        q.open = true; th.off = false;
        Sound.tone(520, 0.05, 'square', 0.012); Sound.noise(0.08, 0.03, 2400);
        this.time.delayedCall(250, () => { if (!this.leaving) this.describe(it); });
      };
    });
    this.darkG = this.add.graphics().setDepth(1.5); // over the room, under her
    this.things.push({ x0: dx, x1: dx + 16, y0: G - 30, y1: G, label: 'W', door: true, use: () => this.leave() }); // a door: W, never J
    this.hum = Sound.hum(0.02); Music.level(0.45, 0.5);
    this.events.once('shutdown', () => { this.hum.stop(0.2); overlay.hint(''); });
    this.cameras.main.fadeIn(300);
    this.hintNow = null; this.hint();
    window.__game = { scene: this, state };
  }

  describe(it) {
    if (!it.src) it.src = { lines: () => it.text.map(raw => typeof raw === 'function' ? raw(this.take) : raw) };
    const at = it.piece ? () => ({ x: it.piece.x + it.piece.w / 2, y: it.piece.y }) : () => ({ x: (it.x0 + it.x1) / 2, y: it.y });
    this.bubbles.look('item', it.src, at, { leave: 70 });
  }

  doUse(u) {
    const A = this.act; A.on = !A.on || u.key === 'tv' || u.key === 'tape'; A.t = 0; A.n++;
    Sound.tone(u.key === 'cord' ? 1200 : 600, 0.04, 'square', 0.015);
    if (u.key === 'tv') Sound.noise(0.25, 0.04, 5000);
    // say it the first time only; after that, the thing itself shows it
    if (!this.useSrc) this.useSrc = { lines: () => u.text };
    if (A.n === 1 || u.key === 'bedroll' && A.on) { this.useSrc.i = 0; this.bubbles.look('item', this.useSrc, () => ({ x: (u.x0 + u.x1) / 2, y: u.y }), { leave: 70 }); }
  }
  // what the one thing does, drawn live
  drawUse(g, dt) {
    const A = this.act, P = this.P, id = this.roomId, dg = this.darkG; dg.clear(); A.t += dt;
    if (id === 'staff' && A.on) {
      // the bedroll lies open on the floor, and his map is propped against the wall over it:
      // rooms in pencil, his route dotted through them, ending in the gold box of the bedroom
      g.fillStyle(hexNum(P.crack), 1); g.fillRect(259, G - 4, 52, 4); g.fillStyle(hexNum(P.sibLo), 1); g.fillRect(260, G - 3, 50, 3); g.fillStyle(hexNum(P.colLo), 1); g.fillRect(262, G - 3, 46, 1);
      const mx = 262, my = 119, mw = 46, mh = 32, ink = hexNum(P.device), fill = (x, y, w, h, c) => { g.fillStyle(c, 1); g.fillRect(x, y, w, h); };
      fill(mx - 1, my - 1, mw + 2, mh + 2, hexNum(P.crack)); fill(mx, my, mw, mh, hexNum(P.colHi)); fill(mx, my + mh - 2, mw, 2, hexNum(P.col));
      // the rooms of the house, outlined
      [[3, 20, 12, 9], [16, 20, 10, 9], [27, 16, 9, 13], [3, 10, 18, 9], [22, 6, 10, 9], [33, 3, 10, 10]].forEach(([x, y, w, h]) => {
        fill(mx + x, my + y, w, 1, ink); fill(mx + x, my + y + h - 1, w, 1, ink); fill(mx + x, my + y, 1, h, ink); fill(mx + x + w - 1, my + y, 1, h, ink);
      });
      // the bedroom at the end: a gold box
      fill(mx + 34, my + 4, 8, 8, hexNum(P.gold)); fill(mx + 36, my + 6, 4, 2, hexNum(P.goldHi));
      // his route, dotted, from the front door in the corner to the bedroom
      const route = [[2, 30], [8, 30], [8, 25], [20, 25], [20, 14], [27, 14], [27, 10], [35, 10], [35, 8]];
      g.fillStyle(hexNum(P.sibLo), 1);
      for (let i = 1; i < route.length; i++) { const [ax, ay] = route[i - 1], [bx, by] = route[i], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)); for (let j = 0; j <= n; j++) if (j % 3 !== 2) g.fillRect(mx + Math.round(ax + (bx - ax) * j / n), my + Math.round(ay + (by - ay) * j / n), 1, 1); }
      // the corner pinned to the wall
      fill(mx + mw / 2 - 1, my - 2, 2, 2, hexNum(P.gold));
    }
    if (id === 'keeper' && A.t < 1.2) {
      // static, then the same channel
      const r = Math.random; for (let i = 0; i < 40; i++) { g.fillStyle(r() < 0.5 ? hexNum(P.dust) : hexNum(P.crack), 1); g.fillRect(234 + Math.floor(r() * 18), 126 + Math.floor(r() * 9), 1, 1); }
      if (A.t > 0.3) { g.fillStyle(hexNum(P.crack), 1); g.fillRect(234, 126, 18, 9); pixText(g, '07', 239, 128, 0xebe6d8, 1, 1); }
    }
    if (id === 'workshop' && A.on && A.t < 6) {
      // the tape: a dot drops down the screen, again and again
      g.fillStyle(hexNum(P.glass), 1); g.fillRect(268, 54, 26, 14); g.fillStyle(hexNum(P.wood), 1); g.fillRect(268, 64, 26, 1);
      g.fillStyle(hexNum(P.kid), 1); g.fillRect(280, 55 + Math.floor((A.t * 14) % 11), 2, 2);
    }
    if (id === 'wardrobe') {
      const bulb = (this.marks || []).find(m => m.kind === 'bulb');
      if (!A.on && bulb) { g.fillStyle(hexNum(P.lamp), 1); g.fillRect(bulb.x - 2, bulb.y - 2, 5, 5); g.fillStyle(hexNum(P.goldHi), 1); g.fillRect(bulb.x - 1, bulb.y - 1, 2, 2); }
      if (A.on) {
        // the bulb is off: the room goes black (she stays visible over it); the doorway she came
        // in by, still lit, its light on the floor, and the red light behind the mirror
        const dx = this.doorX;
        dg.fillStyle(0x000000, 1); dg.fillRect(0, 0, 320, 180);
        dg.fillStyle(hexNum(P.wallHi), 1); dg.fillRect(dx, G - 30, 16, 30);
        dg.fillStyle(hexNum(P.woodHi), 1); dg.fillRect(dx - 30, G, 46, 1); dg.fillRect(dx - 22, G + 1, 38, 1);
        const rec = (this.marks || []).find(m => m.kind === 'rec'); if (rec) { dg.fillStyle(hexNum(P.led), 1); dg.fillRect(rec.x, rec.y, 1, 1); dg.fillRect(rec.x - 1, rec.y, 3, 1); }
      }
      // the cord
      const cord = (this.marks || []).find(m => m.kind === 'cord');
      if (cord) { g.fillStyle(hexNum(P.device), 1); g.fillRect(cord.x, cord.y, 1, A.on ? 14 : 12); g.fillRect(cord.x - 1, cord.y + (A.on ? 14 : 12), 3, 2); }
    }
  }

  // what the hint line says: the furniture next to her, or how the room works
  hint() {
    const k = this.kid, p = k && this.dyn.nearPiece(k);
    const text = p ? (p.pose === 'down' ? PIECE_HINT.down : PIECE_HINT[p.kind]) : 'Press J to look at things. W at the door takes you back.';
    if (text !== this.hintNow) { this.hintNow = text; overlay.hint(text); }
  }

  skipAhead() { this.leave(); }
  canRestart() { return false; } // a side room: the episode restarts from the episode
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
    if (!this.leaving) { this.dyn.step(dt, () => this.moveKid(dt)); this.updateThings(); this.hint(); }
    this.drawGirl();
    this.dyn.draw();
    const g = this.roomFx; g.clear();
    if (Math.floor(this.clock * 2) % 2 === 0) (this.marks || []).forEach(mk => { if (mk.kind === 'rec') { g.fillStyle(hexNum(this.P.led), 1); g.fillRect(mk.x, mk.y, 1, 1); } });
    (this.marks || []).forEach((mk, i) => { if (mk.kind === 'led' && Math.sin(this.clock * 2 + i) > 0) { g.fillStyle(hexNum(this.P.robotLed), 1); g.fillRect(mk.x, mk.y, 1, 1); } });
    this.drawUse(g, dt);
    this.drawThings();
    c.endFrame();
  }
}
