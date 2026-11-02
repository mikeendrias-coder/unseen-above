// Flashes and shakes, kept safe. However many things flash at once, the screen flashes at most
// three times in any second (the WCAG and Xbox limit for seizure risk). With "reduced flashing"
// on (the pause menu, or a computer that asks for reduced motion) a flash is dim and slow, and
// with screen shake off nothing shakes. Scenes call these instead of the camera's own.
import { state } from './state.js';

const recent = [];
// may a full-screen flash happen now? (counts it if so)
function allow() {
  const now = performance.now();
  while (recent.length && now - recent[0] > 1000) recent.shift();
  if (recent.length >= 3) return false;
  recent.push(now); return true;
}

export const fx = {
  get reduced() { return !!state.settings.reduceFlash; },
  get shakeOn() { return state.settings.shake !== false; },
  // a camera flash of color r, g, b over ms
  flash(cam, ms, r, g, b) {
    if (!cam || !allow()) return;
    if (fx.reduced) cam.flash(ms * 2, Math.round(r * 0.25), Math.round(g * 0.25), Math.round(b * 0.25));
    else cam.flash(ms, r, g, b);
  },
  shake(cam, ms, k) { if (cam && fx.shakeOn) cam.shake(ms, fx.reduced ? k * 0.5 : k); },
  // a flash a scene draws itself (a camera's flash lighting the room): false if it would be one
  // flash too many this second; scale its brightness by fx.level
  allowFlash: allow,
  get level() { return fx.reduced ? 0.3 : 1; },
  // a flicker that would strobe: steady instead when reduced
  flicker(hi, lo, mid) { return fx.reduced ? mid : (Math.random() < 0.5 ? hi : lo); }
};
