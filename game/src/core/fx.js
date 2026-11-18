// Flashes and shakes, kept safe. However many things flash at once, the screen flashes at most
// three times in any second (the WCAG and Xbox limit for seizure risk). With "reduced flashing"
// on (the pause menu, or a computer that asks for reduced motion) a flash is dim and slow, and
// with screen shake off nothing shakes. Scenes call these instead of the camera's own.
import { state } from './state.js';
import { cg } from '../ui/cg.js';
import { ASH } from '../art/palettes.js';

const recent = [];
// may a full-screen flash happen now? (counts it if so)
function allow() {
  const now = performance.now();
  while (recent.length && now - recent[0] > 1000) recent.shift();
  if (recent.length >= 3) return false;
  recent.push(now); return true;
}

// The kick rides on the camera's shake step (it runs as the camera draws, after the zoom, so
// its numbers are game pixels), once per camera.
function rig(cam) {
  const e = cam.shakeEffect; if (!e || e.__kickRig) return;
  const own = e.preRender.bind(e);
  e.preRender = () => {
    own();
    const k = cam.__kick, now = performance.now(); if (!k || now < k.from) return;
    if (now > k.until) { cam.__kick = null; return; }
    k.i++;
    const x = (k.i % 2 ? 1 : -1) * k.n, y = k.n > 1 ? (k.i % 4 < 2 ? 1 : -1) : 0;
    cam.matrix.translate(x, y);
    cam.__kickMax = Math.max(cam.__kickMax || 0, Math.abs(x), Math.abs(y));
  };
  e.__kickRig = true;
}

export const fx = {
  get reduced() { return !!state.settings.reduceFlash; },
  get shakeOn() { return state.settings.shake !== false; },
  // a flash of color r, g, b. Flat (Nov 17 final pass): the nearest palette color as a dither
  // over the picture, held at most 90 ms, then gone. No fade, no glow. Reduced: a sparse dither.
  flash(cam, ms, r, g, b) {
    if (!allow()) return;
    const red = r > 50 && r > g * 1.6, lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const color = red ? ASH.red : lum > 150 ? ASH.bone : lum > 70 ? ASH.ash5 : ASH.ash4;
    cg.flash(color, fx.reduced ? 60 : Math.min(90, ms || 90), fx.reduced ? 'q25' : 'checker');
  },
  // A shake of the house (a collapse, a chandelier), in whole game pixels: 1, 2 or at most 3 by
  // the old Phaser intensity k (which used to mean up to 60 px). Her own hurts and the strike
  // use kick (1 or 2 px), so the strike, with its flash and burst, stays the biggest thing.
  shake(cam, ms, k) { if (!cam || !fx.shakeOn) return; fx.kick(cam, k >= 0.008 ? 3 : k >= 0.005 ? 2 : 1, Math.min(ms || 120, 300), true); },
  // A kick of at most px game pixels (Nov 18 juice: 1 or 2 px, when she is hurt or struck).
  // Not Phaser's random shake (at 1 px it often rounds to nothing): whole pixels that alternate
  // side to side each frame, after a delay (a hit-stop holds still first). Reduced: 1 px.
  kick(cam, px, ms, house, delay) {
    if (!cam || !fx.shakeOn) return;
    const n = fx.reduced ? 1 : Math.max(1, Math.min(house ? 3 : 2, Math.round(px || 1))), t = performance.now() + (delay || 0);
    rig(cam);
    const k = cam.__kick;
    if (k && performance.now() < k.until && k.n > n) return; // a bigger kick is already going
    cam.__kick = { from: t, until: t + (ms || 120), n, i: 0 };
  },
  // a flash a scene draws itself (a camera's flash lighting the room): false if it would be one
  // flash too many this second; scale its brightness by fx.level
  allowFlash: allow,
  get level() { return fx.reduced ? 0.3 : 1; },
  // a flicker that would strobe: steady instead when reduced
  flicker(hi, lo, mid) { return fx.reduced ? mid : (Math.random() < 0.5 ? hi : lo); }
};
