// The final beat of each ending, on the old TV in a dark room on Earth (Nov 18, after Michael:
// "build it out, nothing to skip or is happening"). Each is drawn every frame with whole-pixel
// rects into the TV's own canvas (art/moon.js TVSCREEN, 146 x 100), in the Ash and Gold palette.
//   moon      THE VEST     the blast takes a bite out of the Moon; pieces fall toward Earth; the
//                          people in the room on Earth get up and cheer; the show goes off the air
//   rerun     END IT ALL   the rerun of the grounds loops faster and faster, a body for every
//                          loop, the tape rolls, the set switches itself off
//   ridge     ROUND TWO    a new girl on the ridge; PLAYER 2 picks a light; the light finds her
//   playroom  LOOK BACK    the kids, seen, dance and cry at once; then the show's camera swings
//                          onto them, the screen goes red, two clicks, black
//   couch     THE COUCH    the three of them on the couch; the kids fall asleep on her; she
//                          looks back at us and says shh
// loop: true draws the feed as it runs after the beat (the TV again, from the ending screen).
import { drawTv, TVSCREEN, feedHouse, feedGatePost, feedRect, tvText } from '../art/moon.js';
import { ccText, ccWidth } from '../art/ccfont.js';

export const TVW = TVSCREEN.w, TVH = TVSCREEN.h;
const A = {
  ash0: '#0e0f12', ash1: '#1b1c21', ash2: '#2e3036', ash3: '#45474d', ash4: '#6b6c70', ash5: '#8f8d87',
  bone: '#ebe6d8', boneLo: '#b8b2a3', bronzeLo: '#261f15', bronze: '#3a2f1f', bronzeHi: '#54432a',
  goldLo: '#8a5f1c', gold: '#d6a03c', goldHi: '#f2d58c', lit: '#f5ce77', red: '#e3412b', redHi: '#ffd9d0', amber: '#ffb01f'
};
export const ASHC = A;
const box = (x, a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// How long each beat runs, and its climax: if the viewer has flipped away by then, the show takes
// the set back to channel 7 (finale.js). end: the beat is over, the ending screen comes.
export const BEATS = {
  moon: { end: 22, climax: 2.2 },
  rerun: { end: 19, climax: 13.3 },
  ridge: { end: 17.5, climax: 12.6 },
  playroom: { end: 22.5, climax: 16.3 },
  couch: { end: 23, climax: 15.2 }
};

// Captions for the sounds, in the strip under the picture (the show's own captions): [time, text]
export const BEAT_CC = {
  moon: [[2.5, '[A BOOM, VERY FAR AWAY]'], [8.6, '[CHEERING IN THE ROOM]'], [15.6, '[THE SIGNAL DROPS]']],
  rerun: [[1.2, '[A RERUN, PLAYING TO NOBODY]'], [8, '[THE TAPE SPEEDS UP]'], [13.6, '[THE TAPE CHEWS]'], [15.6, '[THE SET CLICKS OFF]']],
  ridge: [[3.6, '[PLAYER 2 PICKS A LIGHT]'], [9.6, '[GAME SHOW JINGLE]'], [12.8, '[A CHARGE BUILDS]']],
  playroom: [[3.4, "[THEY'RE CRYING]"], [4.6, '[DANCE MUSIC]'], [16.4, '[THE MUSIC STOPS]'], [19.2, '[CLICK. CLICK.]']],
  couch: [[1.4, '[THE SHOW GOES ON]'], [11, '[SNORING]'], [16.4, '[SHH]']]
};

// ------------------------------------------------------------------ THE VEST
// The Moon in the old TV (art/moon.js drawTv), and three pieces streaking down toward Earth.
function moon(x, t, o, loop) {
  const bt = loop ? 13 + (t % 9) : t;
  const bugOn = loop ? false : bt < 15.2 || (bt < 16 && Math.floor(bt * 8) % 2 === 0);
  drawTv(x, 'moon', { t: bt, blast: bt - 2.4, bug: bugOn, bite: o.bite, pieces: o.pieces });
  const d = { x: TVSCREEN.dome.x - TVSCREEN.x, y: TVSCREEN.dome.y - TVSCREEN.y };
  // pieces falling toward Earth: a hot head and a short grey tail, one pixel at a time
  [[6.4, -0.9], [9.1, -1.2], [11.6, -0.7], [13.9, -1.0]].forEach(([at, slope], i) => {
    const u = (loop ? (t + i * 2.2) % 9 : bt - at) / 1.6; if (u < 0 || u > 1) return;
    const hx = d.x - 6 - u * 120, hy = d.y + 8 + u * 120 * -slope * 0.6;
    for (let k = 1; k < 18; k++) box(x, hx + k, hy - k * -slope * 0.6, 1, 1, k < 5 ? A.gold : k < 11 ? A.ash5 : A.ash3);
    box(x, hx - 1, hy - 1, 3, 3, A.goldHi); box(x, hx, hy, 1, 1, A.bone);
  });
  if (!loop && bt > 16) { // off the air: the station's bars, thin, over the bottom of the picture
    const u = Math.floor((bt - 16) * 6) % 2; box(x, 0, TVH - 4, TVW, 1, u ? A.ash2 : A.ash3);
  }
}
// The two people on Earth in front of the TV, from behind: sitting, lit at the blast, up on their
// feet, cheering, hugging. g is the room's Phaser Graphics (screen space).
export function vestRoom(g, t, loop) {
  const ink = 0x1b1c21, rim = loop ? 0x6b6c70 : (t > 2.4 && t < 2.75 ? 0xebe6d8 : 0x8f8d87);
  const up = loop ? 0 : clamp((t - 7.2) / 0.3, 0, 1), cheer = !loop && t > 8.4 && t < 12.6, hug = !loop && t >= 12.6;
  const people = [{ x: hug ? 122 : 112, big: true }, { x: hug ? 140 : 150, big: false }];
  const R = (x, y, w, h, c) => { g.fillStyle(c, 1); g.fillRect(Math.round(x), Math.round(y), w, h); };
  people.forEach((P, i) => {
    const hop = cheer && Math.floor(t * 5 + i) % 2 ? 3 : 0;
    const hr = P.big ? 6 : 5, sw = P.big ? 12 : 10, top = Math.round(141 - up * (P.big ? 12 : 9) - hop + (P.big ? 0 : 3)), px = Math.round(P.x);
    // a round head (corners cut), a neck, sloped shoulders, a back down out of the picture
    const head = [[2, 1], [1, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [1, 0], [2, 1]].slice(0, hr * 2 - 1);
    head.forEach(([cut], j) => R(px - hr + cut, top + j, hr * 2 - cut * 2, 1, ink));
    const nk = top + head.length; R(px - 2, nk, 4, 2, ink);
    for (let j = 0; j < 4; j++) R(px - sw + 4 - j, nk + 2 + j, (sw - 4 + j) * 2, 1, ink);
    R(px - sw, nk + 6, sw * 2, 180 - nk - 6, ink);
    if (!P.big) R(px - 2, top - 3, 5, 3, ink); // her hair, tied up
    // the TV's light along their top edges
    R(px - hr + 2, top - 1, hr * 2 - 4, 1, rim); R(px - hr + 1, top, 1, 1, rim); R(px + hr - 2, top, 1, 1, rim); R(px - hr, top + 1, 1, 3, rim); R(px + hr - 1, top + 1, 1, 3, rim);
    if (!P.big) R(px - 2, top - 4, 5, 1, rim);
    for (let j = 0; j < 4; j++) { R(px - sw + 3 - j, nk + 1 + j, 1, 1, rim); R(px + sw - 4 + j, nk + 1 + j, 1, 1, rim); }
    R(px - sw + 4, nk + 1, sw - 4 - 2, 1, rim); R(px + 3, nk + 1, sw - 4 - 2, 1, rim);
    if (cheer) {
      // fists in the air, waving: up and out, then straight up
      const wide = Math.floor(t * 5 + i) % 2;
      [-1, 1].forEach(s => {
        const sx = px + s * (sw - 2), sy = nk + 4, ex = sx + s * (wide ? 6 : 2), ey = sy - 16;
        for (let k = 0; k <= 16; k++) { const u = k / 16; R(sx + (ex - sx) * u - 1, sy + (ey - sy) * u, 3, 1, ink); }
        R(ex - 2, ey - 3, 5, 4, ink); R(ex - 1, ey - 4, 3, 1, rim);
      });
    } else if (hug) {
      // an arm round the other one's back
      R(px + (i ? -sw - 4 : sw - 3), nk + 8, 7, 3, ink); R(px + (i ? -sw - 4 : sw - 3), nk + 7, 7, 1, rim);
    }
  });
}
// ------------------------------------------------------------------ END IT ALL
// the grounds at night, the house and its gate, the girl walking up to it again and again
const RR = { ground: 70, from: 10, len: 58 };
function rerunPicture(x, t, pos, loops, bodies, take) {
  box(x, 0, 0, TVW, TVH, A.ash1);
  [[12, 8], [40, 20], [70, 6], [100, 16], [128, 9], [22, 30], [90, 34], [136, 28]].forEach(([a, b]) => box(x, a, b, 1, 1, A.ash3));
  box(x, 0, RR.ground, TVW, TVH - RR.ground, A.ash2); box(x, 0, RR.ground, TVW, 1, A.ash3);
  const fr = feedRect(x); feedHouse(fr, 42, RR.ground);
  box(x, 0, 62, 30, 8, A.bronzeLo); box(x, 120, 62, 26, 8, A.bronzeLo);
  feedGatePost(fr, 34, RR.ground); feedGatePost(fr, 114, RR.ground);
  // a body at the gate for every time round: small grey heaps, piling up
  for (let k = 0; k < bodies; k++) { const bx = 62 - (k % 8) * 6 + (k >= 8 ? 3 : 0), by = RR.ground - 2 - (k >= 8 ? 2 : 0); box(x, bx, by, 5, 2, k % 2 ? A.ash4 : A.ash5); box(x, bx - 1, by + 1, 1, 1, A.ash1); }
  // her, walking up to the gate
  const gx = Math.round(RR.from + pos), step = Math.floor(t * 8) % 2;
  box(x, gx - 1, 59, 5, 11, A.ash0); box(x, gx, 62, 3, 6, A.ash5); box(x, gx, 60, 3, 2, A.ash1); box(x, gx + (step ? 0 : 2), 68, 1, 2, A.ash5);
  if (Math.floor(t * 1.5) % 2 === 0) { box(x, 6, 6, 40, 11, A.red); tvText(x, 'RERUN', 11, 8, A.bone); }
  box(x, 6, TVH - 14, 44, 10, A.red); ccText(x, 'TAKE ' + take, 8, TVH - 13, A.bone);
  ccText(x, 'CH 07', TVW - 4 - ccWidth('CH 07'), 4, A.gold);
}
function rerun(x, t, o, loop) {
  let pt = t;
  // the tape, faster and faster: where she is on her walk, and how many times round
  const dist = tt => 9 * (tt + (loop ? 0 : 0.55 * Math.pow(Math.max(0, tt - 3), 2)));
  const ROLL = 13.4, OFF = 15.5;
  if (!loop && t >= ROLL) pt = ROLL; // the tape chews: the picture holds on one frame
  const d = dist(pt), loops = Math.floor(d / RR.len), pos = d % RR.len, bodies = loop ? loops % 13 : Math.min(15, loops);
  const take = 41 + loops;
  if (loop || t < ROLL) return rerunPicture(x, t, pos, loops, bodies, take);
  if (t < OFF) {
    // the picture rolls: it slides up and wraps, a black bar between the two copies
    const off = Math.floor(((t - ROLL) * 70) % TVH);
    x.save(); x.beginPath(); x.rect(0, 0, TVW, TVH); x.clip();
    x.translate(0, -off); rerunPicture(x, t, pos, loops, bodies, take); x.translate(0, TVH); rerunPicture(x, t, pos, loops, bodies, take);
    x.restore(); box(x, 0, TVH - off - 3, TVW, 4, A.ash0);
    return;
  }
  // the set switches off: the picture squashes to a line, the line to a dot, the dot goes out
  box(x, 0, 0, TVW, TVH, A.ash0);
  const u = t - OFF;
  if (u < 0.22) { const h = Math.max(2, Math.round(TVH * (1 - u / 0.22))); box(x, 0, Math.round(TVH / 2 - h / 2), TVW, h, A.ash4); box(x, 0, Math.round(TVH / 2) - 1, TVW, 2, A.bone); }
  else if (u < 0.5) { const w = Math.max(2, Math.round(TVW * (1 - (u - 0.22) / 0.28))); box(x, Math.round(TVW / 2 - w / 2), TVH / 2 - 1, w, 2, A.bone); }
  else if (u < 1.4) { const s = u < 0.9 ? 2 : 1; box(x, TVW / 2 - 1, TVH / 2 - 1, s, s, A.bone); }
}

// ------------------------------------------------------------------ ROUND TWO
// the ridge high on the left, the house lit in the valley on the right
const RG = { valley: 92, house: 78 };
const ridgeY = px => Math.round(44 + (px > 38 ? Math.min(46, (px - 38) * 0.62) : 0) + Math.sin(px / 7) * 1.5);
// candidate lights PLAYER 2 hops between, last the searchlight on the roof
const LIGHTS = [[82, 69], [91, 84], [126, 69], [110, 84], [135, 84], [82, 84], [110, 55]];
function ridge(x, t, o, loop) {
  const tt = loop ? 2 + (t % 7.5) : t;
  box(x, 0, 0, TVW, TVH, A.ash1);
  [[10, 6], [30, 14], [56, 4], [80, 18], [130, 12], [100, 8], [20, 28]].forEach(([a, b]) => box(x, a, b, 1, 1, A.ash3));
  box(x, 118, 14, 4, 4, A.bone); box(x, 119, 15, 1, 1, A.lit); // the Moon, small, one window lit
  box(x, 0, RG.valley, TVW, TVH - RG.valley, A.ash2);
  feedHouse(feedRect(x), RG.house, RG.valley);
  for (let px = 0; px < 76; px++) { const h = ridgeY(px); if (h < RG.valley) { box(x, px, h, 1, RG.valley - h, A.ash2); box(x, px, h, 1, 1, A.ash3); } }
  // the girl: from the top of the ridge, down the slope toward the lights
  const walk = clamp((tt - 1.5) / 11, 0, 1), gx = Math.round(14 + walk * 50), gy = ridgeY(gx), moving = !loop ? tt > 1.5 && tt < 12.5 : true, st = moving && Math.floor(tt * 6) % 2;
  const found = !loop && tt >= 12.2;
  const cut = !loop && tt >= 14.2;
  box(x, gx - 1, gy - 12, 5, 12, A.ash0); box(x, gx, gy - 9, 3, 8, A.ash5); box(x, gx, gy - 11, 3, 2, A.ash1); box(x, gx + (st ? 0 : 2), gy - 1, 1, 1, A.ash5);
  // the searchlight on the roof: once picked, it comes on and swings up the slope to her
  if (!loop && tt >= 10) {
    const ang0 = 200, ang1 = Math.atan2(gy - 6 - 55, gx - 110) * 180 / Math.PI + 360, a = ang0 + (ang1 - ang0) * clamp((tt - 10) / 2.2, 0, 1);
    const col = found ? A.red : A.goldHi;
    for (let r = 4; r < 90; r++) for (let w = -Math.floor(r * 0.12); w <= Math.floor(r * 0.12); w++) {
      const q = a * Math.PI / 180, px = Math.round(110 + Math.cos(q) * r - Math.sin(q) * w), py = Math.round(55 + Math.sin(q) * r + Math.cos(q) * w);
      if ((px + py) % 2 === 0 && px >= 0 && py >= 0 && px < TVW && py < TVH) box(x, px, py, 1, 1, col);
    }
  }
  // PLAYER 2's cursor: the amber box, hopping light to light, then onto her
  if (tt >= 3.5) {
    let tx, ty, s = 4;
    if (!loop && tt >= 12.2) { tx = gx + 1; ty = gy - 6; s = Math.max(4, Math.round(10 - (tt - 12.2) * 6)); }
    else { const i = loop ? Math.floor((tt - 3.5) / 0.7) % 6 : Math.min(LIGHTS.length - 1, Math.floor((tt - 3.5) / 0.85)); [tx, ty] = LIGHTS[i]; }
    if (!(found && Math.floor(tt * 8) % 2)) { x.strokeStyle = A.amber; x.lineWidth = 1; x.strokeRect(tx - s + 0.5, ty - s + 0.5, 2 * s, 2 * s); }
  }
  if (tt >= 3.5) { box(x, 5, 5, ccWidth('PLAYER 2') + 4, 10, A.ash0); ccText(x, 'PLAYER 2', 7, 6, A.bone); }
  if (!loop && tt >= 9.5 && tt < 12.2 && Math.floor(tt * 3) % 2 === 0) { const s = 'ROUND 2', w = ccWidth(s) + 6; box(x, TVW / 2 - w / 2, 24, w, 10, A.ash0); ccText(x, s, TVW / 2 - w / 2 + 3, 25, A.gold); }
  if (tt > 1.2) { box(x, 6, TVH - 14, ccWidth('TAKE 1') + 4, 10, A.red); ccText(x, 'TAKE 1', 8, TVH - 13, A.bone); }
  ccText(x, 'CH 07', TVW - 4 - ccWidth('CH 07'), 4, A.gold);
  if (cut) { // a hard cut before anything lands: black, the channel mark, the take
    box(x, 0, 0, TVW, TVH, A.ash0);
    ccText(x, 'CH 07', TVW - 4 - ccWidth('CH 07'), 4, A.gold);
    if (Math.floor(tt * 2) % 2) { box(x, 6, TVH - 14, ccWidth('TAKE 2') + 4, 10, A.red); ccText(x, 'TAKE 2', 8, TVH - 13, A.bone); }
  }
}

// ------------------------------------------------------------------ LOOK BACK
// The two kids, big, facing their camera: bone pajamas, gold hair (a top knot; a paper crown),
// black shades from the start of the dance, and tears. Eight frames each, a frame a half beat.
const DANCE = {
  big: [
    { aL: [90, 90], aR: [90, -90], sway: -1 }, { aL: [90, -90], aR: [90, 90], sway: 1, bob: 1 },
    { aL: [30, 0], aR: [150, 10], sway: 2, lR: 20 }, { aL: [150, 10], aR: [30, 0], sway: -2, lL: 20 },
    { aL: [170, 0], aR: [170, 0], hop: 3, lL: 15, lR: 15 }, { aL: [70, 110], aR: [70, 110], bob: 2 },
    { aL: [130, 70], aR: [20, 0], sway: -1 }, { aL: [100, 0], aR: [100, 0], hop: 2, lL: 25, lR: 25 }
  ],
  little: [
    { aL: [50, -80], aR: [50, -80], lR: 25 }, { aL: [85, -100], aR: [85, -100], bob: 2, lL: 25 },
    { aL: [50, -80], aR: [50, -80], sway: 2, tilt: 1 }, { aL: [100, 0], aR: [100, 0], back: true },
    { aL: [170, 10], aR: [170, 10], hop: 3 }, { aL: [85, -100], aR: [85, -100], bob: 2, lL: 30 },
    { aL: [150, 0], aR: [20, 0], sway: -2, tilt: -1 }, { aL: [20, 0], aR: [150, 0], sway: 2, tilt: 1 }
  ],
  squint: { aL: [150, 120], aR: [20, 0] },
  stand: { aL: [10, 0], aR: [10, 0] }
};
const K = { HW: 18, HH: 15, BW: 18, BH: 15, LEG: 14, UA: 9, FA: 8 };
function limb(x, sx, sy, a1, a2, l1, l2, side, c, th) {
  const q1 = a1 * Math.PI / 180, ex = sx + side * Math.sin(q1) * l1, ey = sy + Math.cos(q1) * l1;
  const q2 = (a1 + a2) * Math.PI / 180, hx = ex + side * Math.sin(q2) * l2, hy = ey + Math.cos(q2) * l2;
  const seg = (ax, ay, bx, by) => { const n = Math.ceil(Math.hypot(bx - ax, by - ay)); for (let i = 0; i <= n; i++) { const u = i / Math.max(1, n); box(x, Math.round(ax + (bx - ax) * u - (th - 1) / 2), Math.round(ay + (by - ay) * u - (th - 1) / 2), th, th, c); } };
  seg(sx, sy, ex, ey); seg(ex, ey, hx, hy);
  return [Math.round(hx), Math.round(hy)];
}
// one kid: cx the middle, fy the floor; o: { pose, big, shades, cry, ink (draw it all in one color,
// for the outline), t, look (eyes up) }
function kid(x, cx, fy, o) {
  const P = o.pose, big = o.big, ink = o.ink, c = k => ink || k;
  const hair = big ? A.goldHi : A.gold, hairLo = big ? A.gold : A.goldLo, skin = A.boneLo, skinLo = A.ash5, cloth = A.bone, clothLo = A.boneLo;
  const s = big ? 0 : 3, hip = fy - K.LEG - (P.hop || 0) - (P.bob ? 0 : 0) + s * 0, top = hip - K.BH + (P.bob || 0) + s, sway = P.sway || 0;
  const bx = cx + sway, th = 4;
  // legs
  [[-5, P.lL || 0, -1], [3, P.lR || 0, 1]].forEach(([dx, a, side]) => { const [fx2, fy2] = limb(x, bx + dx + 1, hip, a, 0, K.LEG - (P.bob || 0), 0, side, c(clothLo), 4); box(x, fx2 - 2 + (side > 0 ? 1 : 0), fy2, 5, 2, c(A.ash0)); });
  // body
  box(x, bx - K.BW / 2, top, K.BW, hip - top + 1, c(cloth)); if (!ink) { box(x, bx + K.BW / 2 - 3, top + 1, 2, hip - top, clothLo); box(x, bx - 2, top + 4, 1, 1, A.ash5); box(x, bx - 2, top + 9, 1, 1, A.ash5); }
  // arms, then hands
  const sh = top + 2;
  [[-1, P.aL], [1, P.aR]].forEach(([side, a]) => { const [hx, hy] = limb(x, bx + side * (K.BW / 2 - 1), sh, a[0], a[1], K.UA, K.FA, side, c(cloth), th); box(x, hx - 2, hy - 2, 4, 4, c(skin)); });
  // head: skin, hair over the top and down the sides
  const hx0 = bx - K.HW / 2 + (P.tilt || 0), hy0 = top - K.HH, W = K.HW;
  box(x, hx0, hy0, W, K.HH, c(skin)); box(x, hx0 + 6, top, 6, 1, c(skinLo));
  if (P.back) { box(x, hx0, hy0, W, K.HH, c(hair)); if (!ink) box(x, hx0, hy0 + K.HH - 2, W, 2, hairLo); }
  else { box(x, hx0, hy0, W, 4, c(hair)); box(x, hx0, hy0, 2, 9, c(hair)); box(x, hx0 + W - 2, hy0, 2, 9, c(hair)); if (!ink) box(x, hx0 + 2, hy0 + 4, W - 4, 1, hairLo); }
  if (big) { box(x, hx0 + 6, hy0 - 6, 6, 6, c(hair)); if (!ink) { box(x, hx0 + 6, hy0 - 1, 6, 1, A.goldLo); box(x, hx0 + 7, hy0 - 5, 1, 3, hairLo); } }
  else {
    const jig = o.t != null && Math.floor(o.t * 4) % 2 ? -1 : 0; // the crown bounces on the beat
    box(x, hx0 + 1, hy0 - 4 + jig, W - 2, 4, c(cloth)); [1, 8, 15].forEach(dx => box(x, hx0 + dx, hy0 - 6 + jig, 2, 2, c(cloth)));
    if (!ink) { box(x, hx0 + 8, hy0 - 3 + jig, 2, 2, A.gold); box(x, hx0 + 1, hy0 - 1 + jig, W - 2, 1, clothLo); }
  }
  if (ink || P.back) return;
  // the face: shades (or eyes screwed shut), sad brows, a mouth wide open, tears
  const ey = hy0 + 6, mx = hx0 + W / 2;
  if (o.shades) { box(x, hx0 + 2, ey, W - 4, 3, A.ash0); box(x, mx - 1, ey + 2, 2, 1, skinLo); box(x, hx0 + 4, ey, 2, 1, A.ash4); box(x, hx0 + 11, ey, 2, 1, A.ash4); }
  else if (o.squint) { box(x, hx0 + 4, ey + 1, 3, 1, A.ash0); box(x, hx0 + 11, ey + 1, 3, 1, A.ash0); }
  else { box(x, hx0 + 5, ey, 2, 2, A.ash0); box(x, hx0 + 11, ey, 2, 2, A.ash0); if (o.look) { box(x, hx0 + 5, ey, 2, 1, A.bone); box(x, hx0 + 11, ey, 2, 1, A.bone); } }
  if (o.cry || o.squint) { box(x, hx0 + 3, ey - 2, 2, 1, A.ash0); box(x, hx0 + 5, ey - 3, 2, 1, A.ash0); box(x, hx0 + 13, ey - 2, 2, 1, A.ash0); box(x, hx0 + 11, ey - 3, 2, 1, A.ash0); }
  const wail = o.cry && o.t != null && Math.floor(o.t * 6) % 2;
  box(x, mx - 3, ey + 5, 6, wail ? 4 : 2, A.ash0); if (o.cry) box(x, mx - 2, ey + 5 + (wail ? 3 : 1), 4, 1, A.red);
  if (o.cry) {
    // two streams down the cheeks, and drops flung off on every move
    [hx0 + 3, hx0 + W - 4].forEach((tx, i) => {
      const side = i ? 1 : -1, len = 3 + (Math.floor(o.t * 7 + i) % 3);
      box(x, tx, ey + 3, 1, len, A.bone);
      for (let j = 0; j < 8; j++) {
        const a = ((o.t + j * 0.14 + i * 0.07) % 1.1);
        const dx = tx + side * (2 + a * 20), dy = ey + 4 + a * a * 70 - a * 14;
        if (dy < fy - 1) box(x, dx, dy, 1, 2, A.bone);
      }
    });
  }
}
// the puddle under each kid, growing while they cry
function puddle(x, cx, fy, n) { const w = Math.min(26, Math.round(n)); if (w > 1) { box(x, cx - w / 2, fy + 1, w, 1, A.bone); box(x, cx - w / 2 + 2, fy + 2, Math.max(0, w - 4), 1, A.boneLo); } }
// the playroom, seen from its own camera
function playroomRoom(x, t, beat) {
  box(x, 0, 0, TVW, TVH, A.bronze);
  for (let yy = 8; yy < 60; yy += 12) for (let xx = 6 + (yy % 24 ? 6 : 0); xx < TVW; xx += 12) {
    const on = beat != null && (Math.floor(xx / 12) + Math.floor(yy / 12) + beat) % 4 === 0;
    box(x, xx, yy, 2, 2, on ? A.gold : A.bronzeHi);
  }
  box(x, 0, 84, TVW, TVH - 84, A.bronzeLo); box(x, 0, 84, TVW, 1, A.gold);
  box(x, 18, 55, 110, 24, A.ash0); box(x, 19, 56, 108, 22, A.gold); box(x, 19, 56, 108, 1, A.goldHi); box(x, 19, 72, 108, 6, A.goldLo);
}
const KIDS = [{ cx: 46, big: true }, { cx: 101, big: false }];
function dancers(x, t, opts) {
  const fy = 92;
  KIDS.forEach((k0, i) => {
    // when the music stops they step in close to each other
    const k = Object.assign({}, k0, { cx: Math.round(k0.cx + (i ? -12 : 12) * (opts.huddle || 0)) });
    let pose = DANCE.stand;
    if (opts.squint) pose = DANCE.squint;
    else if (opts.frame != null) { const f = opts.frame; pose = opts.sync ? DANCE.big[2 + (f % 2)] : (k.big ? DANCE.big : DANCE.little)[(f + i * 3) % 8]; }
    const mirror = i === 1 && opts.squint ? { aL: pose.aR, aR: pose.aL } : {};
    const P = Object.assign({}, pose, mirror);
    puddle(x, k.cx, fy, opts.puddle || 0);
    const o = { pose: P, big: k.big, t, cry: opts.cry, squint: opts.squint, shades: opts.shades && !(k.big && opts.slip), look: opts.look };
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => kid(x, k.cx + dx, fy + dy, Object.assign({}, o, { ink: A.ash0 })));
    kid(x, k.cx, fy, o);
    if (k.big && opts.slip) { // the shades slide down his nose: wet eyes over the top of them
      const hx0 = k.cx + (P.sway || 0) - K.HW / 2, ey = 92 - K.LEG - K.BH + (P.bob || 0) - K.HH + 6 - (P.hop || 0);
      box(x, hx0 + 2, ey + 4, K.HW - 4, 2, A.ash0);
    }
  });
}
let OFFC = null;
const offscreen = () => OFFC || (OFFC = Object.assign(document.createElement('canvas'), { width: TVW, height: TVH }));
function lookback(x, t, o, loop) {
  const DANCE_AT = 4.6, STOP = 16.3, SWING = 16.9, CLOSE = 17.3, RED = 18.7, BLACK = 19.9;
  if (loop) { const f = Math.floor(t * 4) % 8; playroomRoom(x, t, f); dancers(x, t, { frame: f, cry: true, shades: true, sync: Math.floor(t / 4) % 3 === 2, puddle: 18 }); tvText(x, 'LIVE', 8, 6, A.red); ccText(x, 'CH 07', TVW - 4 - ccWidth('CH 07'), 4, A.gold); return; }
  if (t >= BLACK) { box(x, 0, 0, TVW, TVH, A.ash0); return; }
  const f = t >= DANCE_AT ? Math.floor((Math.min(t, STOP) - DANCE_AT) * 4) % 8 : null;
  const scene = () => {
    playroomRoom(x, t, f != null && t < STOP ? f : null);
    dancers(x, t, { frame: t < DANCE_AT ? null : f, squint: t < 3.2, cry: t >= 3.2, shades: t >= DANCE_AT, sync: t >= 10.5 && t < 13, puddle: clamp((t - 3.2) * 1.6, 0, 22), slip: t >= STOP, look: t >= STOP, huddle: clamp((t - STOP) / 0.4, 0, 1) });
    tvText(x, 'LIVE', 8, 6, A.red); ccText(x, 'CH 07', TVW - 4 - ccWidth('CH 07'), 4, A.gold);
  };
  if (t < SWING) return scene();
  if (t < CLOSE) {
    // the camera swings: the picture whips sideways, smeared into lines
    const u = (t - SWING) / (CLOSE - SWING), off = Math.round(u * u * 160);
    x.save(); x.translate(-off, 0); scene(); x.restore();
    box(x, TVW - off, 0, off, TVH, A.ash1);
    for (let yy = 0; yy < TVH; yy += 3) box(x, 0, yy, TVW, 1, (yy / 3) % 2 ? A.ash2 : A.bronzeHi);
    return;
  }
  // close on them: a hard cut to twice the size, the show's lock box closing on both faces
  const sc = offscreen(), s2 = sc.getContext('2d');
  scene(); s2.clearRect(0, 0, TVW, TVH); s2.drawImage(x.canvas, 0, 0);
  x.imageSmoothingEnabled = false; box(x, 0, 0, TVW, TVH, A.ash0);
  x.drawImage(sc, 37, 30, 73, 50, 0, 0, TVW, TVH);
  const close = clamp((t - CLOSE) / 1.1, 0, 1), bw = Math.round(140 - close * 24), bh = Math.round(90 - close * 34), bx = Math.round(TVW / 2 - bw / 2), by = Math.round(26 - close * 10);
  x.strokeStyle = A.amber; x.lineWidth = 1; if (close < 1 || Math.floor(t * 8) % 2) x.strokeRect(bx + 0.5, by + 0.5, bw, bh);
  if (t >= RED) {
    // their screen goes red: everything light turns red, everything dark goes black
    const img = x.getImageData(0, 0, TVW, TVH), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15; if (l > 70) { d[i] = 0xe3; d[i + 1] = 0x41; d[i + 2] = 0x2b; } else { d[i] = 0x0e; d[i + 1] = 0x0f; d[i + 2] = 0x12; } }
    x.putImageData(img, 0, 0);
    tvText(x, 'REC', 6, 6, A.bone);
  }
}

// ------------------------------------------------------------------ THE COUCH
// the three of them from behind, big: the kids (a top knot; a paper crown) and her between them
function couchFig(x, cx, by, o) {
  const lx = o.lean ? o.lean[0] : 0, ly = o.lean ? o.lean[1] : 0, hw = o.small ? 7 : 8, hh = o.small ? 13 : 15, top = by - 14 - hh + ly;
  box(x, cx - 12, by - 15, 24, 15, A.ash0); box(x, cx - 11, by - 14, 22, 14, o.body); box(x, cx + 7, by - 13, 3, 13, o.bodyLo);
  box(x, cx - hw - 1 + lx, top - 1, hw * 2 + 2, hh + 2, A.ash0); box(x, cx - hw + lx, top, hw * 2, hh, o.hair); box(x, cx - hw + lx, top + hh - 3, hw * 2, 3, o.hairLo);
  box(x, cx - 3, by - 15, 6, 1, A.ash5); // a neck
  if (o.knot) { box(x, cx - 3 + lx, top - 5, 6, 5, A.ash0); box(x, cx - 2 + lx, top - 4, 4, 4, o.hair); }
  if (o.crown) { box(x, cx - hw + lx, top - 3, hw * 2, 3, A.bone); [0, hw - 1, hw * 2 - 2].forEach(d => box(x, cx - hw + d + lx, top - 5, 2, 2, A.bone)); box(x, cx - 1 + lx, top - 2, 2, 1, A.gold); }
  if (o.face) { // she turns round: a cheek, an eye, and then a finger to her lips
    box(x, cx - hw + lx, top + 4, 7, 8, A.boneLo); box(x, cx - hw + 2 + lx, top + 6, 2, 2, A.ash0); box(x, cx - hw + 2 + lx, top + 10, 3, 1, A.ash5);
    if (o.shh) { box(x, cx - hw - 3 + lx, top + 7, 2, 9, A.boneLo); box(x, cx - hw - 4 + lx, top + 14, 4, 4, A.boneLo); }
  }
}
function couch(x, t, o, loop) {
  const tt = loop ? 12 + (t % 6) : t;
  box(x, 0, 0, TVW, TVH, A.ash1);
  // their giant screen, Earth turning on it, small fires on its night side
  box(x, 36, 4, 74, 40, A.ash0); box(x, 38, 6, 70, 36, A.ash2);
  const ex = 73, ey = 24, r = 14, spin = Math.floor(tt * 2) % 28;
  for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); box(x, ex - hw, ey + dy, 2 * hw + 1, 1, A.ash3); box(x, ex + Math.round(hw * 0.4), ey + dy, Math.max(0, hw - Math.round(hw * 0.4)) + 1, 1, A.ash1); }
  [[-9, -6, 7, 5], [1, 2, 6, 4], [-5, 6, 4, 3]].forEach(([a, b, w, h]) => { const xx = ((a + spin + 14) % 28) - 14; if (Math.abs(xx) + w < 13 && Math.abs(b) + h < 12) box(x, ex + xx, ey + b, w, h, A.ash4); });
  [[ex + 5, ey - 5], [ex + 8, ey + 3], [ex + 3, ey + 8], [ex + 10, ey - 1]].forEach(([a, b], i) => { if (Math.floor(tt * 2 + i) % 3) box(x, a, b, 1, 1, A.gold); });
  // the couch
  box(x, 14, 60, 118, 26, A.ash0); box(x, 15, 61, 116, 24, A.gold); box(x, 15, 61, 116, 1, A.goldHi); box(x, 15, 78, 116, 7, A.goldLo);
  box(x, 7, 54, 10, 32, A.ash0); box(x, 8, 55, 8, 30, A.goldLo); box(x, 129, 54, 10, 32, A.ash0); box(x, 130, 55, 8, 30, A.goldLo);
  box(x, 0, 86, TVW, TVH - 86, A.ash0);
  const leanL = tt > 6.5 ? [3, 2] : null, leanR = tt > 9 ? [-3, 2] : null;
  const turned = !loop && tt > 15 && tt < 19.5, shh = !loop && tt > 16.2 && tt < 19;
  couchFig(x, 44, 72, { hair: A.goldHi, hairLo: A.gold, body: A.bone, bodyLo: A.boneLo, small: true, knot: true, lean: leanL });
  couchFig(x, 73, 72, { hair: A.ash3, hairLo: A.ash2, body: A.ash5, bodyLo: A.ash4, face: turned, shh });
  couchFig(x, 102, 72, { hair: A.gold, hairLo: A.goldLo, body: A.bone, bodyLo: A.boneLo, small: true, crown: true, lean: leanR });
  // asleep: z's rise off the kids and pop
  if (tt > 10.5) [[44, 0], [102, 0.8]].forEach(([cx, ph], i) => { const u = ((tt + ph) % 1.6) / 1.6; ccText(x, 'z', cx + 4 + Math.round(u * 8) + i, Math.round(46 - u * 18), u < 0.7 ? A.bone : A.ash4, { sx: u < 0.4 ? 1 : 2, sy: u < 0.4 ? 1 : 2 }); });
  if (!loop && tt < 5 && !(tt > 4.6 && Math.floor(tt * 10) % 2)) ccText(x, 'CH 07', TVW - 4 - ccWidth('CH 07'), 4, A.gold);
}

// ------------------------------------------------------------------ one call
// kind: the ending's feed; t: seconds into the beat (or into the TV again, with loop); o: the
// scene's bite and pieces for the Moon
export function drawBeat(x, kind, t, o, loop) {
  x.imageSmoothingEnabled = false;
  if (kind === 'moon') return moon(x, t, o, loop);
  if (kind === 'rerun') return rerun(x, t, o, loop);
  if (kind === 'ridge') return ridge(x, t, o, loop);
  if (kind === 'playroom') return lookback(x, t, o, loop);
  if (kind === 'couch') return couch(x, t, o, loop);
}
// what each feed is called when the channel number shows
export const OWN_NAME = { moon: 'THE MOON', rerun: 'RERUN', ridge: 'THE RIDGE', playroom: 'THE PLAYROOM', couch: 'THE COUCH' };
