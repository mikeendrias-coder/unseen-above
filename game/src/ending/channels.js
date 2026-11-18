// The other channels on the old TV (Nov 18, after Michael: "you should be able to interact and see
// like five different channels, the rest on Earth of other torturing situations"). Other places
// on Earth where the show hunts or watches someone, each a short looping pixel scene, nothing
// graphic: a kid in another lit house, a man crossing a field under a drone's light, a family
// hiding in a basement with a camera blinking, a crowd in a street under a searchlight, and the
// test card. Drawn into the TV's own canvas (146 x 100) in the Ash and Gold palette.
import { ccText, ccWidth } from '../art/ccfont.js';
import { tvText } from '../art/moon.js';
import { ASHC as A, TVW, TVH } from './beats.js';

const box = (x, a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); };
const sky = (x, c) => { box(x, 0, 0, TVW, TVH, c || A.ash1); [[12, 8], [40, 20], [70, 6], [100, 16], [128, 9], [22, 30], [90, 4], [136, 26]].forEach(([a, b]) => box(x, a, b, 1, 1, A.ash3)); };
const lowerThird = (x, s) => { const w = ccWidth(s) + 4; box(x, 6, TVH - 14, w, 10, A.red); ccText(x, s, 8, TVH - 13, A.bone); };
const tri = (x, cx, top, w, h, c) => { for (let i = 0; i < h; i++) { const hw = Math.round(w / 2 * (i + 1) / h); box(x, cx - hw, top + i, hw * 2, 1, c); } };
// a small person: 3 wide, standing (9) or crouched (5); a head in hair
const person = (x, px, fy, body, crouch, step) => {
  const h = crouch ? 5 : 9;
  box(x, px - 1, fy - h - 3, 5, h + 3, A.ash0); box(x, px, fy - h, 3, h - 1, body); box(x, px, fy - h - 2, 3, 2, A.ash1);
  if (!crouch) box(x, px + (step ? 0 : 2), fy - 1, 1, 1, body);
};

// CH 12, THE CABIN: another kid in another house, the only window lit. A red dot from the show
// slides along the wall; the kid ducks when it comes near, and comes back up when it has gone.
function cabin(x, t) {
  sky(x);
  box(x, 0, 78, TVW, TVH - 78, A.ash2); box(x, 0, 78, TVW, 1, A.ash3);
  // bare trees
  [[16, 40], [128, 46]].forEach(([a, b]) => { box(x, a, b, 2, 78 - b, A.ash0); box(x, a - 5, b + 8, 6, 1, A.ash0); box(x, a + 2, b + 4, 6, 1, A.ash0); box(x, a - 3, b + 16, 4, 1, A.ash0); });
  // the cabin: plank walls, a dark roof, a door, one window lit
  tri(x, 72, 30, 64, 16, A.ash0); box(x, 44, 46, 56, 32, A.ash3); for (let y = 49; y < 78; y += 4) box(x, 44, y, 56, 1, A.ash2);
  box(x, 50, 58, 10, 20, A.ash1); box(x, 58, 68, 1, 1, A.ash4);
  const wx = 74, wy = 52; box(x, wx - 1, wy - 1, 18, 14, A.ash0); box(x, wx, wy, 16, 12, A.bone); box(x, wx + 7, wy, 2, 12, A.ash0); box(x, wx, wy + 5, 16, 1, A.ash0);
  // the red dot: along the wall, over the window and back
  const u = (t % 7) / 7, dx = Math.round(30 + Math.sin(u * Math.PI * 2) * 52), dy = 62 + Math.round(Math.cos(u * Math.PI * 4) * 6);
  const near = Math.abs(dx - (wx + 8)) < 16;
  // the kid at the window: a head and shoulders against the light, or nothing (down below the sill)
  if (!near) { box(x, wx + 2, wy + 4, 6, 6, A.ash1); box(x, wx + 1, wy + 9, 8, 3, A.ash1); box(x, wx + 3, wy + 3, 4, 1, A.ash1); }
  else if (Math.floor(t * 3) % 4 === 0) box(x, wx + 3, wy + 10, 4, 2, A.ash1); // the top of a head, peeking
  box(x, dx - 1, dy - 1, 3, 3, A.red); box(x, dx, dy, 1, 1, A.redHi);
  // the drone that makes the dot, high up, its light on
  const drx = Math.round(30 + Math.sin(u * Math.PI * 2) * 30); box(x, drx - 4, 10, 9, 2, A.ash4); box(x, drx - 6, 9, 3, 1, A.ash4); box(x, drx + 4, 9, 3, 1, A.ash4); if (Math.floor(t * 4) % 2) box(x, drx, 12, 1, 1, A.red);
  lowerThird(x, 'TAKE 3');
}

// CH 19, THE FIELD: a man crossing a field at night under a drone's light. He stops; the light
// stops. He goes on; the light goes on with him.
function field(x, t) {
  sky(x, A.ash1);
  box(x, 0, 62, TVW, TVH - 62, A.ash2); for (let y = 66; y < TVH; y += 5) box(x, 0, y, TVW, 1, A.ash1);
  for (let i = 0; i < 40; i++) box(x, (i * 37) % TVW, 63 + ((i * 13) % 34), 1, 2, A.ash3);
  const cyc = 16, u = (t % cyc) / cyc, stop = u > 0.42 && u < 0.58;
  const mx = Math.round(-6 + (u < 0.42 ? u / 0.42 * 66 : u < 0.58 ? 66 : 66 + (u - 0.58) / 0.42 * 90)), fy = 86;
  const dx = mx + 1, dy = 14 + Math.round(Math.sin(t * 2) * 1);
  // the light: a hard checker wedge from the drone to the ground around him
  for (let y = dy + 3; y < fy + 2; y++) { const hw = Math.round((y - dy) * 0.28); for (let xx = dx - hw; xx <= dx + hw; xx++) if ((xx + y) % 2 === 0 && xx >= 0 && xx < TVW) box(x, xx, y, 1, 1, A.boneLo); }
  box(x, dx - 14, fy, 29, 2, A.ash4);
  // the man: a coat, his head down; when he stops he looks up at it
  box(x, mx - 2, fy - 15, 7, 15, A.ash0); box(x, mx - 1, fy - 11, 5, 10, A.ash5); box(x, mx, fy - 14, 3, 3, A.boneLo); box(x, mx + (stop ? 1 : 2), stop ? fy - 14 : fy - 12, 1, 1, A.ash0);
  if (!stop) box(x, mx + (Math.floor(t * 5) % 2 ? -1 : 3), fy - 1, 1, 1, A.ash5);
  // the drone, a red light under it
  box(x, dx - 5, dy, 11, 2, A.ash4); box(x, dx - 7, dy - 1, 3, 1, A.ash5); box(x, dx + 5, dy - 1, 3, 1, A.ash5); box(x, dx, dy + 2, 1, 1, A.red);
  lowerThird(x, 'TAKE 9');
}

// CH 23, BASEMENT: a family hiding behind boxes in a cellar. Steps cross the floor above; dust
// comes down. A camera in the corner, its red light blinking. The kid looks up; a hand pulls
// them back down.
function basement(x, t) {
  box(x, 0, 0, TVW, TVH, A.ash1);
  for (let y = 4; y < 84; y += 6) for (let xx = (y / 6) % 2 ? 0 : 6; xx < TVW; xx += 12) box(x, xx, y, 11, 5, A.ash2);
  box(x, 0, 0, TVW, 4, A.ash0); box(x, 0, 84, TVW, TVH - 84, A.ash0); box(x, 0, 84, TVW, 1, A.ash3);
  // the stairs down from a door at the top left, light under the door
  for (let i = 0; i < 8; i++) box(x, 6 + i * 6, 14 + i * 9, 8, 3, A.ash3);
  box(x, 4, 4, 14, 1, A.boneLo);
  // footsteps over the ceiling, and dust coming down
  const cyc = 6, u = t % cyc, step = Math.floor(u / 0.55);
  if (u < 3.3) for (let i = 0; i < 4; i++) { const sx = 30 + step * 16 + i * 5, a = (u % 0.55) / 0.55; box(x, sx, 5 + Math.round(a * a * 70), 1, 1, A.ash4); }
  // the boxes, and the family behind them: two grown ups and a kid
  const peek = (t % 5) > 2.6 && (t % 5) < 3.8, pulled = (t % 5) > 3.4;
  // heads over the boxes: hair, a face, eyes wide open, looking up at the ceiling
  const head = (hx, hy, w, hair, look) => {
    box(x, hx - 1, hy - 1, w + 2, w + 1, A.ash0); box(x, hx, hy, w, w, A.boneLo); box(x, hx, hy, w, 2, hair); box(x, hx, hy, 1, 4, hair);
    const ex = hx + Math.floor(w / 2) - 2; box(x, ex, hy + 3, 2, 2, A.bone); box(x, ex + 3, hy + 3, 2, 2, A.bone);
    box(x, ex + (look ? 0 : 1), hy + 3, 1, 1, A.ash0); box(x, ex + 3 + (look ? 0 : 1), hy + 3, 1, 1, A.ash0);
  };
  const steps = (t % 6) < 3.3;
  head(60, 56, 8, A.ash1, steps); head(89, 61, 8, A.ash3, steps);
  const ky = peek && !pulled ? 57 : 65; head(74, ky, 6, A.ash1, true);
  if (pulled && (t % 5) < 4) { box(x, 67, ky + 3, 7, 3, A.ash0); box(x, 68, ky + 4, 6, 1, A.boneLo); } // the hand that pulls the kid down
  // the boxes they hide behind, in front of them
  [[54, 64, 30, 20], [84, 70, 24, 14], [40, 72, 16, 12]].forEach(([a, b, w, h]) => { box(x, a, b, w, h, A.ash4); box(x, a, b, w, 1, A.ash5); box(x, a + Math.round(w / 2), b + 2, 1, h - 3, A.ash3); });
  // the camera in the corner
  box(x, 124, 6, 14, 8, A.ash0); box(x, 125, 7, 12, 6, A.ash3); box(x, 120, 9, 5, 4, A.ash0); box(x, 121, 10, 2, 2, A.ash4); box(x, 134, 4, 2, 3, A.ash3);
  if (Math.floor(t * 2) % 2) { box(x, 135, 8, 2, 2, A.red); tvText(x, 'REC', 108, 18, A.red); }
}

// CH 31, MAIN STREET: a crowd in a dead street, a searchlight sweeping over them from a tower.
// Where it passes, people drop flat and hold still; a ticker asks the viewers to pick.
function street(x, t) {
  sky(x, A.ash1);
  [[0, 24, 26], [24, 36, 20], [44, 18, 22], [98, 30, 22], [120, 14, 26]].forEach(([a, top, w], i) => { box(x, a, top, w, 80 - top, i % 2 ? A.ash2 : A.ash0); for (let y = top + 4; y < 76; y += 7) for (let xx = a + 3; xx < a + w - 3; xx += 6) box(x, xx, y, 2, 3, (xx + y) % 5 ? A.ash1 : A.ash3); });
  box(x, 66, 6, 4, 74, A.ash0); box(x, 63, 4, 10, 4, A.ash3); // the tower and its lamp
  box(x, 0, 80, TVW, TVH - 80, A.ash2); box(x, 0, 80, TVW, 1, A.ash3);
  const sweep = 68 + Math.sin(t * 0.9) * 60;
  // the beam: a checker band down from the tower to the street
  for (let y = 8; y < 88; y++) { const f = (y - 8) / 80, cx = 68 + (sweep - 68) * f, hw = 2 + Math.round(f * 9); for (let xx = Math.round(cx - hw); xx <= Math.round(cx + hw); xx++) if ((xx + y) % 2 === 0 && xx >= 0 && xx < TVW) box(x, xx, y, 1, 1, A.bone); }
  // the crowd: people standing about; in the light they drop flat and freeze
  for (let i = 0; i < 15; i++) {
    const px = 6 + i * 9 + ((i * 7) % 4), fy = 88 + (i % 3) * 2, lit = Math.abs(px + 1 - sweep) < 14;
    person(x, px, fy, i % 4 ? A.ash4 : A.ash5, lit, Math.floor(t * 3 + i) % 2 && !lit);
  }
  // the ticker
  box(x, 0, TVH - 9, TVW, 9, A.ash0); const msg = 'PICK ONE. CALL NOW. PICK ONE. CALL NOW. ', mw = ccWidth(msg), off = Math.floor(t * 18) % mw;
  ccText(x, msg, 2 - off, TVH - 8, A.gold); ccText(x, msg, 2 - off + mw + 6, TVH - 8, A.gold);
  box(x, 4, 4, 30, 10, A.red); ccText(x, 'LIVE', 7, 5, A.bone);
}

// CH 44: the test card. Bars, a circle, NO SIGNAL; a beep now and then (finale.js)
function testCard(x, t) {
  const bars = [A.bone, A.boneLo, A.goldHi, A.gold, A.ash5, A.ash4, A.ash3];
  bars.forEach((c, i) => box(x, Math.round(i * TVW / 7), 0, Math.ceil(TVW / 7), 70, c));
  for (let i = 0; i < 7; i++) box(x, Math.round(i * TVW / 7), 70, Math.ceil(TVW / 7), 8, [A.ash0, A.ash2, A.ash1, A.ash3, A.ash0, A.ash2, A.ash1][i]);
  box(x, 0, 78, TVW, TVH - 78, A.ash1); for (let i = 0; i < 12; i++) box(x, i * 12 + 2, 84, 6, 10, i % 2 ? A.ash4 : A.ash0);
  const r = 26, cx = 73, cy = 39; for (let a = 0; a < 160; a++) { const q = a / 160 * Math.PI * 2; box(x, cx + Math.cos(q) * r, cy + Math.sin(q) * r, 1, 1, A.ash0); }
  box(x, cx - 30, cy - 1, 61, 1, A.ash0); box(x, cx, cy - 27, 1, 54, A.ash0);
  const s = 'NO SIGNAL', w = ccWidth(s) + 8; box(x, cx - w / 2, cy - 6, w, 12, A.ash0); if (Math.floor(t * 1.2) % 3) ccText(x, s, cx - w / 2 + 4, cy - 4, A.bone);
}

// The dial: the ending's own feed is channel 7 (finale.js draws it); the rest are here.
export const CHANNELS = [
  { n: 7, own: true },
  { n: 12, name: 'THE CABIN', draw: cabin, sound: 'drone' },
  { n: 19, name: 'THE FIELD', draw: field, sound: 'drone' },
  { n: 23, name: 'BASEMENT', draw: basement, sound: 'steps' },
  { n: 31, name: 'MAIN STREET', draw: street, sound: 'crowd' },
  { n: 44, name: 'NO SIGNAL', draw: testCard, sound: 'beep', noBug: true }
];
export function drawChannel(x, ch, t) {
  x.imageSmoothingEnabled = false;
  ch.draw(x, t);
  if (!ch.noBug) { const s = 'CH ' + ch.n; ccText(x, s, TVW - 4 - ccWidth(s), 4, A.gold); }
}
// the set's own number, in the top left for a moment after a flip: a big number, the name under it
export function drawOsd(x, n, name) {
  const s = 'CH ' + (n < 10 ? '0' : '') + n, w = Math.max(ccWidth(s, 2), ccWidth(name || '')) + 6;
  box(x, 4, 4, w, name ? 27 : 18, A.ash0);
  ccText(x, s, 7, 6, A.bone, { sx: 2, sy: 2 });
  if (name) ccText(x, name, 7, 22, A.boneLo);
}
// a flip: a few frames of square static in four greys
export function drawStatic(x) {
  const cols = [A.ash0, A.ash3, A.ash5, A.bone];
  for (let y = 0; y < TVH; y += 2) for (let xx = 0; xx < TVW; xx += 3) box(x, xx, y, 3, 2, cols[Math.floor(Math.random() * 4)]);
}
