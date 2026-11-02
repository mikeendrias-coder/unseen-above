// A death, the same in every episode: a caption says what got her, the satellite strikes (or the
// thing hits her itself), her body stays, and the take restarts. After her first death anywhere,
// a key (Space, Enter, E or R) cuts the strike short; the body still lands.
import { state } from './state.js';
import { overlay } from './overlay.js';
import { deathLine } from '../data/dialogue.js';

// impact(quiet): hide her and leave the body (quiet: no burst, flash or sound).
// fire(onImpact): start the strike; returns its length in seconds.
export function beginDeath(scene, src, impact, fire) {
  const d = scene.death = { impacted: false, skipping: false, skippable: state.bodyCount() > 0 };
  d.hit = quiet => { if (d.impacted) return; d.impacted = true; impact(!!quiet); };
  overlay.sfx(deathLine(src && src.id, src && src.direct), 2800);
  if (scene.epId) state.died(scene.epId);
  let after = 0.4;
  if (src && src.direct) d.hit(false); else after = fire(() => d.hit(false));
  d.fade = scene.time.delayedCall((after + 0.12) * 1000, () => scene.cameras.main.fadeOut(260, 0, 0, 0));
  d.restart = scene.time.delayedCall((after + 0.42) * 1000, () => scene.scene.restart({}));
  if (d.skippable && after > 0.8) overlay.note('Space skips', Math.min(2400, after * 1000));
}
// a key during the strike: the body lands now and the next take starts
export function skipDeath(scene) {
  const d = scene.death;
  if (!scene.dead || !d || !d.skippable || d.skipping) return false;
  d.skipping = true;
  d.hit(true);
  if (d.fade) d.fade.remove(false);
  if (d.restart) d.restart.remove(false);
  scene.cameras.main.fadeOut(120, 0, 0, 0);
  scene.time.delayedCall(130, () => scene.scene.restart({}));
  return true;
}
