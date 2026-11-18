// The title picture and the opening share one pixel world (Ash and Gold): an ash ridge with the
// two siblings on it, a dead city behind, and across the valley the only lit thing left, the
// mansion. The start screen paints its first frame; the opening (scenes/Intro.js) animates it.
// World coordinates are game pixels; the title framing is x 0 to 320.
import { Painter, rng } from './painter.js';
import { ASH as A } from './palettes.js';
import { ccText } from './ccfont.js';

export const WORLD_W = 420;
export const VALLEY_Y = 132;                 // the valley floor
export const DOOR = { x: 222, y: 132 };      // the mansion door, in the valley layer
// the ridge's top edge, left to right (foreground layer)
export const RIDGE = [[-20, 96], [20, 98], [50, 106], [78, 115], [96, 119], [112, 121], [130, 128], [150, 140], [170, 155], [188, 170], [198, 180]];
export const CREST = { bro: 90, sis: 102 };
export function ridgeY(x) {
  for (let i = 0; i < RIDGE.length - 1; i++) { const [x0, y0] = RIDGE[i], [x1, y1] = RIDGE[i + 1]; if (x >= x0 && x <= x1) return Math.round(y0 + (y1 - y0) * (x - x0) / (x1 - x0)); }
  return 180;
}
// the road across the valley, from the foot of the ridge to the door (valley layer)
export const ROAD = [[176, 164], [190, 152], [204, 143], [214, 137], [DOOR.x, DOOR.y]];

// The sky, the moon's place, the dead city on the horizon
export function paintBack() {
  const p = new Painter(WORLD_W, 180), r = rng(31);
  p.rect(0, 0, WORLD_W, 180, A.ash1);
  for (let x = -4; x < WORLD_W;) {
    const w = 6 + Math.floor(r() * 14), h = 8 + Math.floor(r() * 26);
    p.rect(x, VALLEY_Y - h, w, h, A.ash2);
    if (r() < 0.5) p.rect(x + w - 2, VALLEY_Y - h - 3, 1, 3, A.ash2);      // rebar
    if (r() < 0.25) p.rect(x + 2, VALLEY_Y - h + 3, 2, 2, A.ash1);         // a dead window
    x += w + Math.floor(r() * 3);
  }
  return p;
}
export function paintMoon() {
  const p = new Painter(25, 25); p.circle(12, 12, 11, A.bone);
  p.rect(7, 9, 3, 2, A.boneLo); p.rect(13, 14, 4, 3, A.boneLo); p.px(15, 6, A.boneLo); p.px(9, 16, A.boneLo);
  return p;
}
// The valley floor and the mansion: bronze, gold trim, warm windows
export function paintValley() {
  const p = new Painter(WORLD_W, 180), r = rng(7);
  p.rect(0, VALLEY_Y, WORLD_W, 180 - VALLEY_Y, A.ash2);
  for (let i = 0; i < 70; i++) p.rect(Math.floor(r() * WORLD_W), VALLEY_Y + 2 + Math.floor(r() * 46), 2, 1, A.ash3);
  // the road to the door
  for (let i = 0; i < ROAD.length - 1; i++) { const [x0, y0] = ROAD[i], [x1, y1] = ROAD[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) p.rect(Math.round(x0 + (x1 - x0) * k / n) - 1, Math.round(y0 + (y1 - y0) * k / n), 3, 1, A.ash3); }
  const ex = 196;
  // east annex
  p.rect(ex - 22, 120, 18, 12, A.bronze); p.rect(ex - 23, 119, 20, 1, A.gold);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) p.rect(ex - 20 + i * 6, 122 + j * 5, 3, 3, j === 1 && i === 1 ? A.ash0 : A.lit);
  // the main house
  p.rect(ex, 114, 52, 18, A.bronze); p.rect(ex - 1, 112, 54, 2, A.gold); p.rect(ex, 117, 52, 1, A.goldLo);
  p.circle(ex + 26, 110, 6, A.gold); p.rect(ex + 20, 111, 13, 1, A.goldLo); p.rect(ex + 26, 101, 1, 4, A.gold);
  for (let i = 0; i < 6; i++) { p.rect(ex + 4 + i * 8, 119, 3, 5, i === 2 ? A.ash0 : A.lit); }
  p.rect(ex + 23, 125, 7, 7, A.goldLo); p.rect(ex + 24, 126, 5, 6, A.lit);   // the door
  // west tower
  p.rect(ex + 60, 104, 10, 28, A.gold); p.rect(ex + 63, 100, 4, 4, A.gold); p.rect(ex + 64, 97, 2, 3, A.goldHi);
  for (let j = 0; j < 4; j++) { p.rect(ex + 62, 107 + j * 6, 2, 3, A.lit); p.rect(ex + 66, 107 + j * 6, 2, 3, j === 2 ? A.goldLo : A.lit); }
  // the wall around it, untouched
  p.rect(ex - 30, 131, 112, 1, A.goldLo);
  return p;
}
// The ridge in front: black, a dead tree, a wrecked car, a road sign
export function paintRidge() {
  const p = new Painter(WORLD_W, 180);
  const pts = RIDGE.concat([[198, 190], [-20, 190]]);
  p.spans(pts, (x, y, w) => p.rect(x, y, w, 1, A.ash0));
  // the crest catches a little of the house's light
  for (let x = 60; x < 186; x++) p.px(x, ridgeY(x), x > 96 ? A.goldLo : A.ash3);
  // dead tree
  p.rect(30, 74, 2, 26, A.ash0); [[31, 86, 23, 77], [31, 82, 39, 72], [37, 75, 42, 73], [25, 79, 22, 74]].forEach(([x0, y0, x1, y1]) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) p.px(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), A.ash0); });
  // wrecked car on the far left, half buried
  p.rect(-2, 88, 16, 7, A.ash0); p.rect(2, 84, 9, 4, A.ash0); p.rect(4, 85, 5, 2, A.ash2);
  // road sign, bent
  p.rect(62, 92, 1, 17, A.ash0); p.rect(58, 89, 9, 4, A.ash0); p.rect(59, 90, 7, 2, A.ash3);
  return p;
}

// The siblings, as rows of pixels facing right ('x' body). Rim light comes from the house (right).
const BRO = ['....xxx..', '...xxxxx.', '...xxxxx.', '....xxx..', '.xxxxxxx.', 'xxxxxxxxx', 'xxxxxxxxx', 'xxx.xxxxx', 'xxx.xxxxx', '.x..xxxxx', '....xxxx.'];
const BRO_LEGS = [['....xx.xx', '....xx.xx', '....xx.xx', '....xx.xx'], ['.....xxx.', '.....xxx.', '....xx.x.', '...xx...x']];
const SIS = ['.xxx..', 'xxxxx.', 'xxxxx.', '.xxx..', '.xxxx.', 'xxxxxx', '.xxxx.', '.xxxx.'];
const SIS_LEGS = [['.x..x.', '.x..x.', '.x..x.'], ['..xx..', '.x.x..', 'x...x.']];
const SIS_CROUCH = ['.xxx..', 'xxxxx.', 'xxxxx.', '.xxx..', 'xxxxxx', 'xxxxxx', 'xx..xx'];
// rects [x, y, w, h, color] for a figure whose feet are at (x, y). pose: { face, step, point, crouch }
export function figureRects(kind, x, y, pose) {
  pose = pose || {};
  const face = pose.face || 1;
  let rows;
  if (kind === 'brother') rows = BRO.concat(BRO_LEGS[pose.step ? 1 : 0]);
  else rows = pose.crouch ? SIS_CROUCH : SIS.concat(SIS_LEGS[pose.step ? 1 : 0]);
  const w = rows[0].length, h = rows.length, out = [];
  rows.forEach((row, j) => {
    const cells = [...row]; if (face < 0) cells.reverse();
    let right = -1; cells.forEach((c, i) => { if (c === 'x') right = i; });
    cells.forEach((c, i) => { if (c === 'x') out.push([x - (w >> 1) + i, y - h + j, 1, 1, i === right && j > 0 ? A.goldLo : A.ash0]); });
  });
  if (kind === 'brother' && pose.point) {
    const sx = x - (w >> 1) + (face > 0 ? w : -1), sy = y - h + 5;
    for (let k = 0; k < 4; k++) out.push([sx + face * k, sy - k, 1, 1, A.ash0]);
  }
  return out;
}

// The words on the title picture
export function paintTitleText(target, alpha) {
  const opts = { alpha: alpha == null ? 1 : alpha };
  ccText(target, 'UNSEEN', 16, 16, A.bone, Object.assign({ sx: 3, sy: 3 }, opts));
  ccText(target, 'ABOVE', 16, 40, A.bone, Object.assign({ sx: 3, sy: 3 }, opts));
  ccText(target, 'ch 07, tonight', 24, 66, A.ash5, opts);
}

// The start screen's still: the opening's first frame, with the title
export function paintTitleStill(ctx) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(paintBack().canvas, 0, 0);
  ctx.drawImage(paintMoon().canvas, 250, 22);
  ctx.fillStyle = A.red; ctx.fillRect(160, 24, 1, 1); ctx.fillRect(158, 24, 1, 1); ctx.fillRect(162, 24, 1, 1);
  const r = rng(5); ctx.fillStyle = A.ash3; for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(r() * 320), Math.floor(r() * 150), 1, 1);
  ctx.drawImage(paintValley().canvas, 0, 0);
  ctx.drawImage(paintRidge().canvas, 0, 0);
  [['brother', CREST.bro], ['sister', CREST.sis]].forEach(([k, x]) => figureRects(k, x, ridgeY(x), { face: 1 }).forEach(([fx, fy, w, h, c]) => { ctx.fillStyle = c; ctx.fillRect(fx, fy, w, h); }));
  paintTitleText(ctx, 1);
}
