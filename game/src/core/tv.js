// The secret TV (Nov 18, Michael: "put the TV next to the book, the inside secret at the start when
// you go to the side, and it opens the trailer ... in the TV itself, not the raw mp4").
// Episode 1: an old CRT set on the ash beside the hidden book, behind where she starts, its screen
// lit, an extension cord running off into the ash. J on it (or a click) turns it on: the set fills
// the picture (the same family as the ending's old TV, art/moon.js paintLastRoom: grey case,
// rabbit ears, a grille and knobs at the right), and the trailer (trailer.mp4, beside the page)
// plays inside its screen as an HTML <video> laid exactly over the screen rectangle (in units of
// --u, one game pixel in CSS px, so it follows every window size, full screen and the fractional
// display scale). The scene waits and the game's sound is held while it plays.
// Keys: Space pauses and goes on, A and D (or the two small knobs) go back or on 10 s, J, Esc or
// the power knob turn it off. When the trailer ends the set clicks off.
// No mp4 (a missing file, or an error, or nothing at all in 5 s): the in-engine trailer
// (trailer.html) plays in an <iframe> in the same place; if that does not load either, a paper slip
// on the screen says where the trailer is, with a button that opens it.
// The first time, she says one line and the story keeps it (state.story.tv).
import { overlay } from './overlay.js';
import { state } from './state.js';
import { Sound } from './sound.js';
import { cg } from '../ui/cg.js';
import { ASH } from '../art/palettes.js';
import { ccText, ccWidth, ADV } from '../art/ccfont.js';

export const TV_SRC = 'trailer.mp4', TV_PAGE = 'trailer.html';
export const TV_SAYS = 'Somebody left the TV on out here.';
// the screen inside the big set, in game pixels (16:9, so the trailer fills it exactly)
export const PIC = { x: 28, y: 24, w: 224, h: 126 };
// the set's knobs, in game pixels: back 10 s, on 10 s, power
export const KNOBS = { back: { x: 272, y: 100, r: 6 }, fwd: { x: 292, y: 100, r: 6 }, power: { x: 282, y: 132, r: 8 } };
const SEEK = 10, LOAD_WAIT = 5000, PAGE_WAIT = 8000;
const W = 320, H = 180, A = ASH, BLACK = '#000000';

// ------------------------------------------------------------------ the set in the grounds
// side view, 22 x 26, standing on the ash. '.' nothing; ash0..5 by digit; b bone; l boneLo.
// The screen (x 3..13, y 13..20) is painted live in two frames (a faint roll), so it is left out here.
const SET = [
  '....b.................',
  '.....4............b...',
  '.....4...........4....',
  '......4.........4.....',
  '.......4.......4......',
  '.......4......4.......',
  '........4....4........',
  '........4...4.........',
  '........033330........',
  '........044440........',
  '0000000000000000000000',
  '0444444444444444444440',
  '0300000000000003333330',
  '030...........03222230',
  '030...........03111130',
  '030...........03222230',
  '030...........03111130',
  '030...........03333330',
  '030...........03553550',
  '030...........03503500',
  '030...........03333330',
  '0300000000000003333330',
  '0222222222222222222220',
  '0000000000000000000000',
  '...33............33...',
  '...22............22...'
];
const SET_COL = { 0: A.ash0, 1: A.ash1, 2: A.ash2, 3: A.ash3, 4: A.ash4, 5: A.ash5, b: A.bone, l: A.boneLo };
// the lit screen, 11 x 8, two frames: faint lines and a bar that rolls down a step
const GLOW = [
  ['l5555555555', '44444444444', '55555555555', '44444444444', 'lllllllllll', '44444444444', '55555555555', '44444444444'],
  ['l5555555555', '44444444444', '55555555555', '44444444444', '55555555555', '44444444444', 'lllllllllll', '44444444444']
];
function paintSet(scene) {
  GLOW.forEach((g, f) => {
    const key = 'tv_set' + f; if (scene.textures.exists(key)) return;
    const cv = document.createElement('canvas'); cv.width = 22; cv.height = 26;
    const x = cv.getContext('2d');
    const put = (rows, ox, oy) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = SET_COL[r[i]]; if (c) { x.fillStyle = c; x.fillRect(ox + i, oy + j, 1, 1); } } });
    put(SET, 0, 0); put(g, 3, 13);
    // the screen's corners stay dark (a CRT's rounded glass)
    x.fillStyle = A.ash0; [[3, 13], [13, 13], [3, 20], [13, 20]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
    scene.textures.addCanvas(key, cv);
  });
}

// at { x (the set's middle), y (the ground under it) }; opts.depth
export function addTv(scene, at, opts) {
  opts = opts || {};
  paintSet(scene);
  const x = Math.round(at.x), y = Math.round(at.y), d = opts.depth != null ? opts.depth : 1.8;
  const cord = scene.add.graphics().setDepth(d - 0.1);
  // a grey cord, so it shows against the dark: out of the back, down to the ash, along it to the
  // left, under the ash in two places, off the edge of the world
  cord.fillStyle(0x45474d, 1);
  const x0 = x - 11;
  cord.fillRect(x0 - 1, y - 5, 1, 1); cord.fillRect(x0 - 2, y - 4, 1, 1); cord.fillRect(x0 - 3, y - 3, 1, 1); cord.fillRect(x0 - 4, y - 2, 1, 1);
  for (let cx = x0 - 5; cx > -2; cx--) { if ((cx > x0 - 12 && cx < x0 - 9) || (cx > 1 && cx < 4)) continue; cord.fillRect(cx, y - 1, 1, 1); }
  // its light on the ash in front of the screen: flat, every other pixel
  const lit = scene.add.graphics().setDepth(d - 0.1);
  lit.fillStyle(0x6b6c70, 1); for (let i = 0; i < 14; i++) if (i % 2 === 0) lit.fillRect(x - 9 + i, y, 1, 1); for (let i = 1; i < 12; i += 2) lit.fillRect(x - 8 + i, y + 1, 1, 1);
  const img = scene.add.image(x, y, 'tv_set0').setOrigin(0.5, 1).setDepth(d);
  // the roll: a frame change now and then (the scene's own clock, so it waits while the scene waits)
  scene.time.addEvent({ delay: 120, loop: true, callback: () => { img.setTexture(Math.floor(scene.time.now / 1000 * 2.5) % 5 === 0 ? 'tv_set1' : 'tv_set0'); } });
  const open = () => openTv(scene);
  const thing = { x0: x - 8, x1: x + 8, y0: y - 26, y1: y + 2, px: x, py: y - 27, label: 'J', tv: true, use: open };
  scene.things.push(thing);
  img.setInteractive(new Phaser.Geom.Rectangle(-2, -2, img.width + 4, img.height + 4), Phaser.Geom.Rectangle.Contains);
  img.on('pointerdown', (p, lx, ly, ev) => {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (scene.dead || scene.leaving || scene.done) return;
    open();
  });
  const tv = { img, cord, lit, thing, at: { x, y } };
  scene.tv = tv;
  return tv;
}

// ------------------------------------------------------------------ the big set (drawn over the picture)
const box = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
function disc(x, cx, cy, r, c) { x.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); x.fillRect(cx - hw, cy + dy, 2 * hw + 1, 1); } }
function line(x, x0, y0, x1, y1, c) { x.fillStyle = c; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) x.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); }
// (a row of face above the letter, so its top never runs into the rim)
const CAP_H = 12, capW = s => ccWidth(s) + 6;
function keyCap(x, s, a, b) { const w = capW(s); box(x, A.ash0, a, b, w, CAP_H); box(x, A.boneLo, a + 1, b + 1, w - 2, CAP_H - 3); box(x, A.ash3, a + 1, b + CAP_H - 2, w - 2, 1); ccText(x, s, a + 3, b + 2, A.ash0); return w; }
// "{SPACE} PAUSE" style: key caps and words in one line
const richW = s => s.split(/(\{[^}]*\})/).reduce((n, p) => n + (!p ? 0 : p[0] === '{' ? capW(p.slice(1, -1)) + 1 : p.length * ADV), 0);
function rich(x, s, a, b, c) { let cx = a; s.split(/(\{[^}]*\})/).forEach(p => { if (!p) return; if (p[0] === '{') { cx += keyCap(x, p.slice(1, -1), cx, b - 2) + 1; return; } ccText(x, p, cx, b, c); cx += p.length * ADV; }); }
function knob(x, k, turn, hot) {
  disc(x, k.x, k.y, k.r + 1, A.ash0); disc(x, k.x, k.y, k.r, hot ? A.ash4 : A.ash3); disc(x, k.x - 1, k.y - 1, k.r - 3, hot ? A.ash5 : A.ash4); disc(x, k.x, k.y, Math.max(1, k.r - 4), A.ash1);
  const a = turn * Math.PI / 4 - Math.PI / 2; box(x, A.bone, Math.round(k.x + Math.cos(a) * (k.r - 1)), Math.round(k.y + Math.sin(a) * (k.r - 1)), 1, 1);
}
const KEYS_LINE = { video: '{SPACE} PAUSE  {A} {D} 10 S  {J} OFF', frame: '{SPACE} PAUSE  {J} OFF', slip: '{R} OPEN IT  {J} OFF' };
function drawSet(x, st) {
  x.clearRect(0, 0, W, H);
  // the dark room, its floor
  box(x, BLACK, 0, 0, W, H); box(x, A.ash0, 0, 172, W, 8);
  // the screen's light on the floor: a flat checker, nothing soft
  x.fillStyle = A.ash1; for (let yy = 174; yy < 180; yy++) { const sp = (yy - 174) * 3; for (let xx = 44 - sp + ((yy & 1)); xx < 236 + sp; xx += 2) x.fillRect(xx, yy, 1, 1); }
  // rabbit ears on a little dome
  line(x, 154, 10, 124, 0, A.ash3); line(x, 155, 10, 125, 0, A.ash2); line(x, 166, 10, 200, 1, A.ash3); line(x, 165, 10, 199, 1, A.ash2);
  box(x, A.bone, 124, 0, 1, 1); box(x, A.bone, 200, 1, 1, 1);
  box(x, A.ash0, 147, 8, 26, 7); box(x, A.ash2, 148, 9, 24, 6); box(x, A.ash3, 150, 9, 20, 1);
  // the case: grey, a lit top edge, a dark foot
  box(x, A.ash0, 11, 13, 298, 159); box(x, A.ash2, 12, 14, 296, 157); box(x, A.ash3, 13, 15, 294, 2); box(x, A.ash1, 12, 168, 296, 3);
  // feet
  box(x, A.ash1, 36, 171, 30, 3); box(x, A.ash1, 254, 171, 30, 3);
  // the screen's bezel: a deep frame, a lip, the glass
  box(x, A.ash1, PIC.x - 6, PIC.y - 6, PIC.w + 12, PIC.h + 12); box(x, A.ash0, PIC.x - 4, PIC.y - 4, PIC.w + 8, PIC.h + 8);
  box(x, A.ash3, PIC.x - 6, PIC.y + PIC.h + 5, PIC.w + 12, 1); // the bezel's lower edge catches the light
  box(x, A.ash0, PIC.x, PIC.y, PIC.w, PIC.h);
  // the panel at the right: a grille, the channel window, two knobs, the power knob and its light
  const gx = 266, gy = 24;
  box(x, A.ash0, gx - 1, gy - 1, 34, 44); box(x, A.ash1, gx, gy, 32, 42); for (let yy = gy + 2; yy < gy + 41; yy += 3) box(x, A.ash0, gx + 2, yy, 28, 1);
  box(x, A.ash0, 266, 72, 32, 13); box(x, A.ash1, 267, 73, 30, 11);
  ccText(x, 'CH', 270, 75, A.ash4); ccText(x, '07', 283, 75, st.on ? A.gold : A.goldLo);
  knob(x, KNOBS.back, st.turn[0], st.hot === 'back'); knob(x, KNOBS.fwd, st.turn[1], st.hot === 'fwd');
  ccText(x, '-10', KNOBS.back.x - 8, 110, A.ash5); ccText(x, '+10', KNOBS.fwd.x - 8, 110, A.ash5);
  knob(x, KNOBS.power, st.on ? 0 : 2, st.hot === 'power');
  box(x, A.ash0, 296, 122, 4, 4); box(x, st.on ? A.red : A.ash1, 297, 123, 2, 2);
  const pw = 'POWER'; ccText(x, pw, KNOBS.power.x - Math.floor(ccWidth(pw) / 2), 144, A.ash5);
  // the chin: the keys, as key caps
  const keys = KEYS_LINE[st.mode] || KEYS_LINE.video;
  rich(x, keys, Math.round(PIC.x + PIC.w / 2 - richW(keys) / 2), 159, A.ash5);
}

// over the screen: the corners of the glass, the CH 07 bug, the set's own messages, the power
// going on and off, the paper slip
const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function tag(x, s, a, b, c) { const w = ccWidth(s) + 4; box(x, A.ash0, a, b, w, 11); ccText(x, s, a + 2, b + 2, c || A.gold); return w; }
function drawOver(x, st, t) {
  x.clearRect(0, 0, W, H);
  const P = PIC, cx = P.x + P.w / 2, cy = P.y + P.h / 2;
  if (st.phase === 'warm' || st.phase === 'off') {
    // the picture opens from a dot to a line to the full screen; it closes the other way (the ending's off)
    box(x, A.ash0, P.x, P.y, P.w, P.h);
    let u = (t - st.t0) / (st.phase === 'warm' ? 0.42 : 0.6); u = Math.max(0, Math.min(1, u));
    if (st.phase === 'off') u = 1 - u;
    if (u < 0.3) { const w = Math.max(2, Math.round(P.w * u / 0.3)); box(x, A.bone, Math.round(cx - w / 2), cy - 1, w, 2); }
    else { const h = Math.max(2, Math.round(P.h * (u - 0.3) / 0.7)); box(x, A.ash4, P.x, Math.round(cy - h / 2), P.w, h); box(x, A.bone, P.x, cy - 1, P.w, 2); }
  }
  if (st.phase === 'slip') drawSlip(x, st);
  if (st.phase === 'load' || (st.phase === 'video' && st.loading)) { box(x, A.ash0, P.x, P.y, P.w, P.h); if (Math.floor(t * 2) % 2 === 0) tag(x, 'NO SIGNAL YET', P.x + 6, P.y + 6, A.boneLo); }
  // the glass's rounded corners
  const xr = P.x + P.w, yb = P.y + P.h;
  [[P.x, P.y, P.x, P.y + 1], [xr - 2, P.y, xr - 1, P.y + 1], [P.x, yb - 1, P.x, yb - 2], [xr - 2, yb - 1, xr - 1, yb - 2]].forEach(([a, b, c, d]) => { box(x, A.ash0, a, b, 2, 1); box(x, A.ash0, c, d, 1, 1); });
  if (st.phase === 'warm' || st.phase === 'off') return;
  // CH 07, top right of the screen, gold with a hard shadow
  const bug = 'CH 07', bx = P.x + P.w - 4 - ccWidth(bug), by = P.y + 4;
  ccText(x, bug, bx + 1, by + 1, A.ash0); ccText(x, bug, bx, by, A.gold);
  if (st.phase !== 'video' || st.mode !== 'video') return;
  // the set's own messages: top left; paused, two bars in the middle; the tape's place along the foot
  const osdUp = st.osd && t < st.osd.until;
  if (st.paused) {
    box(x, A.ash0, cx - 9, cy - 10, 7, 20); box(x, A.ash0, cx + 2, cy - 10, 7, 20);
    box(x, A.bone, cx - 8, cy - 9, 5, 18); box(x, A.bone, cx + 3, cy - 9, 5, 18);
  }
  if (osdUp || st.paused) {
    const s = st.paused ? 'PAUSE  ' + fmt(st.time) : (osdUp ? st.osd.text : '');
    if (s) tag(x, s, P.x + 6, P.y + 6);
    const bw = P.w - 16, by2 = P.y + P.h - 8, f = st.dur ? Math.max(0, Math.min(1, st.time / st.dur)) : 0;
    box(x, A.ash0, P.x + 7, by2 - 1, bw + 2, 4); box(x, A.ash3, P.x + 8, by2, bw, 2); box(x, A.gold, P.x + 8, by2, Math.round(bw * f), 2);
    const tl = fmt(st.time) + ' / ' + fmt(st.dur); tag(x, tl, P.x + P.w - 10 - ccWidth(tl), by2 - 14, A.boneLo);
  }
}
// the paper slip, when neither the tape nor the trailer page will play
export const SLIP_BUTTON = { x: 0, y: 0, w: 0, h: 0 };
function drawSlip(x, st) {
  const P = PIC; box(x, A.ash1, P.x, P.y, P.w, P.h);
  const w = 168, h = 74, sx = Math.round(P.x + P.w / 2 - w / 2), sy = Math.round(P.y + P.h / 2 - h / 2);
  box(x, A.ash0, sx - 1, sy - 1, w + 2, h + 2); box(x, A.bone, sx, sy, w, h);
  ccText(x, 'NOTICE', sx + 6, sy + 4, A.ash3); ccText(x, 'CH 07', sx + w - 6 - ccWidth('CH 07'), sy + 4, A.ash3);
  box(x, A.ash0, sx + 4, sy + 14, w - 8, 1);
  ccText(x, 'The trailer is at', sx + 6, sy + 19, A.ash0);
  ccText(x, TV_PAGE, sx + 6, sy + 30, A.ash0, { sx: 2, sy: 2 });
  box(x, A.boneLo, sx + 4, sy + 48, w - 8, 1);
  // the button: R opens it in a new tab
  const label = 'OPEN IT', bw = capW('R') + 4 + ccWidth(label) + 10, bh = 16, bx = sx + 6, by = sy + 53;
  box(x, A.ash0, bx, by, bw, bh); if (!st.slipHot) box(x, A.bone, bx + 1, by + 1, bw - 2, bh - 2);
  const kx = bx + 5; keyCap(x, 'R', kx, by + 2); ccText(x, label, kx + capW('R') + 4, by + 4, st.slipHot ? A.bone : A.ash0);
  Object.assign(SLIP_BUTTON, { x: bx, y: by, w: bw, h: bh });
  ccText(x, 'J CLOSES', sx + w - 6 - ccWidth('J CLOSES'), by + 4, A.ash3);
}

// ------------------------------------------------------------------ the page side
let el = null, setCv = null, overCv = null, video = null, frame = null, slipBtn = null;
function build() {
  if (el) return el;
  const host = document.getElementById('overlay'); if (!host) return null;
  el = document.createElement('div'); el.id = 'tvset'; el.hidden = true; el.tabIndex = -1;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'An old TV playing the trailer. Space pauses, A and D go back or on 10 seconds, J or Esc turns it off.');
  setCv = document.createElement('canvas'); setCv.width = W; setCv.height = H; setCv.className = 'tv-set'; setCv.setAttribute('aria-hidden', 'true');
  video = document.createElement('video'); video.className = 'tv-pic';
  video.setAttribute('playsinline', ''); video.playsInline = true; video.preload = 'auto'; video.tabIndex = -1;
  video.disablePictureInPicture = true; video.setAttribute('disablepictureinpicture', ''); video.setAttribute('disableremoteplayback', '');
  video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate');
  video.controls = false; video.setAttribute('aria-label', 'The trailer');
  overCv = document.createElement('canvas'); overCv.width = W; overCv.height = H; overCv.className = 'tv-over'; overCv.setAttribute('aria-hidden', 'true');
  slipBtn = document.createElement('button'); slipBtn.type = 'button'; slipBtn.className = 'tv-slip'; slipBtn.hidden = true; slipBtn.textContent = 'Open the trailer, ' + TV_PAGE + ', in a new tab. R does it too.';
  el.append(setCv, video, overCv, slipBtn);
  host.appendChild(el);
  el.addEventListener('contextmenu', ev => ev.preventDefault());
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  slipBtn.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); openPage(); });
  video.addEventListener('loadeddata', () => { if (up && up.mode === 'video') up.loading = false; });
  video.addEventListener('error', onVideoError);
  video.addEventListener('ended', () => { if (up && up.mode === 'video') powerOff(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && up && up.phase === 'video' && !video.paused) setPaused(true); });
  return el;
}
const place = (node, r) => { node.style.left = 'calc(var(--u, 4px) * ' + r.x + ')'; node.style.top = 'calc(var(--u, 4px) * ' + r.y + ')'; node.style.width = 'calc(var(--u, 4px) * ' + r.w + ')'; node.style.height = 'calc(var(--u, 4px) * ' + r.h + ')'; };

// ------------------------------------------------------------------ on and off
let up = null;
export const tvUp = () => !!up;
const clock = () => performance.now() / 1000;
const osd = (text, ms) => { if (up) up.osd = { text, until: clock() + (ms || 1500) / 1000 }; };
export function openTv(scene) {
  if (up || cg.pageUp || window.__paused || window.__frozen || window.__book || window.__about) return false;
  if (!build()) return false;
  const k = scene.kid;
  // in the air she lands first, as for the books
  if (k && k.onGround === false) {
    const ev = scene.time.addEvent({ delay: 16, loop: true, callback: () => { if (scene.dead || scene.leaving) ev.remove(); else if (k.onGround) { ev.remove(); openTv(scene); } } });
    return true;
  }
  const first = !state.story.tv;
  if (first) state.storySet('tv', true);
  scene.scene.pause();
  const words = scene.bubbles && scene.bubbles.g; if (words) words.setVisible(false);
  Sound.clack();
  setTimeout(() => { if (up) Sound.hold(true); }, 160); // the game's sound waits under the trailer
  up = { scene, words, phase: 'warm', t0: clock(), turn: [0, 0], on: true, hot: null, paused: false, time: 0, dur: 0, osd: null, loading: true, mode: 'video', opened: clock(), first, wasEnded: false };
  window.__tvUp = true;
  window.__tv = { get phase() { return up ? up.phase : 'gone'; }, get mode() { return up ? up.mode : null; }, video, get frame() { return frame; }, close: () => powerOff(), pic: PIC, knobs: KNOBS, get first() { return up ? up.first : null; } };
  if (first) overlay.caption('SISTER', TV_SAYS, { ms: 3400 });
  el.hidden = false; slipBtn.hidden = true;
  place(video, PIC);
  video.style.visibility = 'hidden';
  // the tape: from where it was left, or from the top after it ran out
  startVideo();
  window.addEventListener('keydown', onKey, true);
  scene.events.once('shutdown', hardClose); // a jump (number keys) takes the part away under it
  requestAnimationFrame(loop);
  return true;
}
function startVideo() {
  const u = up; if (!u) return;
  u.mode = 'video'; u.loading = true; u.retries = 0;
  video.muted = Sound.muted;
  if (!video.getAttribute('src') || video.error) { video.src = TV_SRC; video.load(); }
  else if (video.ended || (video.duration && video.currentTime >= video.duration - 0.25)) video.currentTime = 0;
  if (video.readyState >= 2) u.loading = false;
  // nothing at all after a while (no file, no answer): the trailer page instead; a slow answer that
  // has its length already keeps waiting
  u.timer = setTimeout(() => { if (up === u && u.mode === 'video' && video.readyState === 0) toPage(); }, LOAD_WAIT);
  const p = video.play();
  if (p && p.catch) p.catch(e => { if (up !== u || u.mode !== 'video') return; if (e && e.name === 'NotAllowedError') { u.paused = true; osd('SPACE PLAYS', 4000); } });
}
// The tape's own troubles. No file (or one it cannot read at all): the trailer page. A picture that
// will not decode (a graphics card's decoder can give up on a computer like the class one): load it
// again where it was, a few times (the browser then decodes it itself), then the trailer page.
function onVideoError() {
  const u = up; if (!u || u.mode !== 'video') return;
  const code = video.error ? video.error.code : 0;
  if ((code === 2 || code === 3) && u.retries < 4) {
    u.retries++;
    const t = u.lastTime || 0;
    video.src = TV_SRC; video.load();
    try { if (t > 0) video.currentTime = t; } catch (e) { /* not yet */ }
    if (!u.paused) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
    return;
  }
  toPage();
}
// the in-engine trailer (trailer.html), in the same place
function toPage() {
  const u = up; if (!u) return;
  u.mode = 'frame'; u.loading = true;
  try { video.pause(); } catch (e) { /* ignore */ }
  video.style.visibility = 'hidden';
  if (!frame) {
    frame = document.createElement('iframe'); frame.className = 'tv-pic';
    frame.setAttribute('allow', 'autoplay; fullscreen'); frame.setAttribute('aria-label', 'The trailer, played by the game'); frame.tabIndex = -1;
    el.insertBefore(frame, overCv);
  }
  place(frame, PIC); frame.style.visibility = 'hidden';
  let settled = false;
  const timer = setTimeout(() => { if (!settled && up === u) { settled = true; toSlip(); } }, PAGE_WAIT);
  frame.onload = () => {
    if (settled || up !== u) return;
    let doc = null, shut = false;
    try { doc = frame.contentDocument; } catch (e) { shut = true; }
    if (!shut && doc === null) shut = true;
    // same origin: the page must be the trailer's (a missing file answers with an error page)
    if (!shut && !doc.getElementById('tr-play')) { settled = true; clearTimeout(timer); toSlip(); return; }
    settled = true; clearTimeout(timer);
    u.loading = false; frame.style.visibility = u.phase === 'warm' ? 'hidden' : 'visible';
    if (!shut) {
      try {
        doc.getElementById('tr-play').click();
        // a click inside the set gives the keys back to the game's page (J and Esc still turn it off)
        frame.contentWindow.addEventListener('pointerup', () => { try { window.focus(); } catch (e) { /* ignore */ } });
      } catch (e) { /* it plays from its own Play button */ }
    }
  };
  frame.src = TV_PAGE;
}
function toSlip() {
  const u = up; if (!u) return;
  u.mode = 'slip'; u.loading = false;
  if (frame) { frame.style.visibility = 'hidden'; frame.onload = null; frame.src = 'about:blank'; }
  if (u.phase !== 'warm') u.phase = 'slip';
  slipBtn.hidden = false;
}
function openPage() {
  window.__tvPageOpened = TV_PAGE; // for tests
  try { window.open(TV_PAGE, '_blank', 'noopener'); } catch (e) { /* not allowed */ }
}
function setPaused(on) {
  const u = up; if (!u) return;
  if (u.mode === 'video') {
    if (on) video.pause(); else { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
    u.paused = on;
  } else if (u.mode === 'frame') {
    // the trailer page's own Space
    try { const w = frame.contentWindow; w.dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true })); u.paused = on; } catch (e) { /* not ours to reach */ }
  }
}
function seek(d) {
  const u = up; if (!u || u.mode !== 'video' || u.phase !== 'video') return;
  u.turn[d > 0 ? 1 : 0] += 1;
  const dur = video.duration || 0;
  let t = (video.currentTime || 0) + d * SEEK; t = Math.max(0, dur ? Math.min(dur - 0.5, t) : t);
  try { video.currentTime = t; } catch (e) { /* not seekable yet */ }
  osd((d > 0 ? '+' : '-') + SEEK + ' S', 1400);
}
function powerOff() {
  const u = up; if (!u || u.phase === 'off') return;
  u.phase = 'off'; u.t0 = clock(); u.on = false;
  try { video.pause(); } catch (e) { /* ignore */ }
  video.style.visibility = 'hidden';
  if (frame) { frame.style.visibility = 'hidden'; frame.onload = null; frame.src = 'about:blank'; }
  slipBtn.hidden = true;
  Sound.hold(false); Sound.clack();
  setTimeout(() => finish(true), 620);
}
// put it all away; resume: whether the scene goes on (not when the part itself went away)
function finish(resume) {
  const u = up; if (!u) return;
  up = null; window.__tvUp = false;
  window.removeEventListener('keydown', onKey, true);
  u.scene.events.off('shutdown', hardClose);
  try { video.pause(); } catch (e) { /* ignore */ }
  clearTimeout(u.timer);
  if (frame) { frame.onload = null; if (frame.getAttribute('src') !== 'about:blank') frame.src = 'about:blank'; }
  el.hidden = true; slipBtn.hidden = true; el.style.cursor = '';
  if (Sound.held) Sound.hold(false);
  if (!resume) return;
  const sc = u.scene;
  setTimeout(() => {
    if (u.words) u.words.setVisible(true);
    if (sc.scene.isPaused() && !window.__paused && !window.__frozen) sc.scene.resume();
    if (sc.ctl) sc.ctl.endFrame();
    if (sc.input && sc.input.keyboard && sc.input.keyboard.resetKeys) sc.input.keyboard.resetKeys();
  }, 0);
}
function hardClose() { finish(false); }

function loop() {
  const u = up; if (!u) return;
  const t = clock();
  if (u.phase === 'warm' && t - u.t0 >= 0.42) {
    u.phase = u.mode === 'slip' ? 'slip' : 'video';
    if (u.mode === 'video') video.style.visibility = 'visible';
    if (u.mode === 'frame' && !u.loading) frame.style.visibility = 'visible';
    if (u.mode === 'video' && !u.paused) osd('▶ PLAY', 1400);
  }
  if (u.mode !== 'video' && u.phase === 'video') u.phase = u.mode === 'slip' ? 'slip' : 'video';
  if (u.mode === 'video') { u.time = video.currentTime || 0; if (u.time > 0.05 && !u.loading) u.lastTime = u.time; u.dur = isFinite(video.duration) ? video.duration : 0; if (!video.paused && u.paused) u.paused = false; }
  drawSet(setCv.getContext('2d'), u);
  const ox = overCv.getContext('2d'); ox.imageSmoothingEnabled = false;
  drawOver(ox, u, t);
  if (u.mode === 'slip') { const r = SLIP_BUTTON; place(slipBtn, r); }
  // the trailer page takes the keys when it starts (its game grabs focus): give them back, so J,
  // Esc and Space keep working the set
  if (u.mode === 'frame' && document.activeElement === frame) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } const fn = document.getElementById('focus-note'); if (fn) fn.hidden = true; }
  requestAnimationFrame(loop);
}

// ------------------------------------------------------------------ keys and the mouse
const ready = () => up && clock() - up.opened > 0.35; // the press that turned it on never turns it off
function onKey(ev) {
  if (!up) return;
  if (ev.ctrlKey || ev.metaKey || ev.altKey || /^F\d+$/.test(ev.key)) return;
  if (/^[0-9uU]$/.test(ev.key)) return; // main.js: a jump, or full screen (it heard them first)
  ev.preventDefault(); ev.stopImmediatePropagation();
  if (ev.repeat || !ready() || up.phase === 'off') return;
  const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (key === 'j' || key === 'Escape' || key === 'x' || key === 'Backspace') powerOff();
  else if (up.mode === 'slip') { if (key === 'r' || key === 'Enter' || key === ' ' || key === 'e') openPage(); }
  else if (key === ' ' || key === 'k' || key === 'Enter' || key === 'e') setPaused(!up.paused);
  else if (key === 'a' || key === 'ArrowLeft') seek(-1);
  else if (key === 'd' || key === 'ArrowRight') seek(1);
}
const gridOf = ev => { const r = el.getBoundingClientRect(); return r.width ? { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H } : null; };
const onKnob = g => Object.keys(KNOBS).find(id => { const k = KNOBS[id]; return Math.hypot(g.x - k.x, g.y - k.y) <= k.r + 3; }) || null;
const onPic = g => g.x >= PIC.x && g.x < PIC.x + PIC.w && g.y >= PIC.y && g.y < PIC.y + PIC.h;
function onDown(ev) {
  if (!up) return;
  ev.preventDefault(); ev.stopPropagation();
  if (!ready() || up.phase === 'off') return;
  const g = gridOf(ev); if (!g) return;
  const k = onKnob(g);
  if (k === 'power') powerOff();
  else if (k === 'back') seek(-1);
  else if (k === 'fwd') seek(1);
  else if (up.mode === 'slip') { const b = SLIP_BUTTON; if (g.x >= b.x && g.x < b.x + b.w && g.y >= b.y && g.y < b.y + b.h) openPage(); }
  else if (onPic(g)) setPaused(!up.paused);
}
function onMove(ev) {
  if (!up) return;
  const g = gridOf(ev); if (!g) return;
  up.hot = onKnob(g);
  const b = SLIP_BUTTON; up.slipHot = up.mode === 'slip' && g.x >= b.x && g.x < b.x + b.w && g.y >= b.y && g.y < b.y + b.h;
  el.style.cursor = up.hot || up.slipHot ? 'pointer' : '';
}
