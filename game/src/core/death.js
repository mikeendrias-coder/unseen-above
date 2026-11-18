// A death, the same in every episode: the satellite strikes (or the thing hits her itself), her
// body stays, and the take restarts. Nov 17 final pass:
//   - Fast restarts (Geometry Dash feel). Her first death anywhere is watched in full. After that
//     the strike is short and the next take starts 0.6 s after the body lands; Space, Enter or J
//     cuts even that short.
//   - Takes (lives): 5 per episode visit, shown at the right end of the caption strip. At 0 the
//     episode starts again from its own start with 5 fresh takes. Bodies stay. Never further
//     back than the episode's start. Story mode (immunity) hides them; satellite screens, side
//     rooms and the Moon city have none.
//   - What got her is captioned once per cause, never again on a retry.
// A scene learns why it started from its data: { retry: true } after a death or a restart by
// choice, { outOfTakes: true } (with the visit's own start data) after the last take.
import { state } from './state.js';
import { overlay } from './overlay.js';
import { deathLine } from '../data/dialogue.js';
import { cg } from '../ui/cg.js';

export const TAKES = 5;
const FAST_AFTER = 0.6; // seconds from the body landing to the next take, after the first death
// scenes with no takes: nothing up there hunts her (the city, the playroom) or it is a side room
const NO_TAKES = ['moon', 'room'];
const visits = {}; // per episode id, this page visit only: { left, data }

const keyOf = scene => scene.sys && scene.sys.settings && scene.sys.settings.key;
export const hasTakes = scene => !!scene.epId && !NO_TAKES.includes(keyOf(scene)) && !scene.noTakes;

// Call from initSide / initTop. A start that is not a retry is a new visit: 5 takes again.
export function startTakes(scene) {
  const id = scene.epId; if (!id) return;
  const data = (scene.sys.settings && scene.sys.settings.data) || {};
  if (!data.retry || !visits[id]) {
    const keep = Object.assign({}, data); delete keep.retry; delete keep.outOfTakes;
    visits[id] = { left: TAKES, data: keep };
  }
  scene.takesLeft = visits[id].left;
}
export const takesLeft = scene => (scene.epId && visits[scene.epId] ? visits[scene.epId].left : TAKES);

// HP at the left end of the strip and takes at the right: hidden in story mode
export function showStatus(scene, hp, maxHp) {
  const hide = state.immune;
  if (hp !== undefined) cg.hp(hide || hp == null ? null : hp, maxHp);
  cg.lives(hide || !hasTakes(scene) ? null : takesLeft(scene), TAKES);
}

// after immunity changes: show or hide HP and takes for whatever scene is up
export function refreshStatus(scene) {
  const k = scene.kid, hp = k && typeof k.hp === 'number' ? k.hp : null;
  if (scene.epId) showStatus(scene, hp, scene.hpMax || 3);
}

// The next take: the same visit, or (out of takes) the episode from its start.
function nextTake(scene, fadeMs) {
  const v = visits[scene.epId], out = hasTakes(scene) && v && v.left <= 0;
  const go = () => scene.scene.restart(out ? Object.assign({}, v.data, { outOfTakes: true }) : { retry: true });
  if (!out) { scene.cameras.main.fadeOut(fadeMs, 0, 0, 0); scene.time.delayedCall(fadeMs + 10, go); return; }
  // out of takes: a stamp on black, then the episode from the top with 5 again
  scene.cameras.main.fadeOut(fadeMs, 0, 0, 0);
  scene.time.delayedCall(fadeMs + 10, () => overlay.card('NO TAKES LEFT', 'From the top', 1500, 'center'));
  scene.time.delayedCall(fadeMs + 1300, go);
}

// impact(quiet): hide her and leave the body (quiet: no burst, flash or sound).
// fire(onImpact, { short }): start the strike; returns its length in seconds.
export function beginDeath(scene, src, impact, fire) {
  const fast = state.bodyCount() > 0;
  const d = scene.death = { impacted: false, skipping: false, skippable: fast, fast };
  // a take used up (not in story mode, where nothing kills her anyway)
  if (hasTakes(scene) && visits[scene.epId]) { visits[scene.epId].left = Math.max(0, visits[scene.epId].left - 1); scene.takesLeft = visits[scene.epId].left; showStatus(scene); }
  d.hit = quiet => {
    if (d.impacted) return; d.impacted = true; impact(!!quiet);
    if (d.fast && !d.skipping) d.restart = scene.time.delayedCall(FAST_AFTER * 1000, () => { d.skipping = true; nextTake(scene, 140); });
  };
  const line = deathLine(src && src.id, src && src.direct);
  if (state.hear('death:' + line)) overlay.sfx(line, 2400);
  if (scene.epId) state.died(scene.epId);
  let after = 0.4;
  if (src && src.direct) d.hit(false); else after = fire(() => d.hit(false), { short: fast });
  if (!fast) {
    d.fade = scene.time.delayedCall((after + 0.12) * 1000, () => { d.skipping = true; nextTake(scene, 260); });
  }
}
// a key during the strike: the body lands now and the next take starts
export function skipDeath(scene) {
  const d = scene.death;
  if (!scene.dead || !d || !d.skippable || d.skipping) return false;
  d.skipping = true;
  d.hit(true);
  if (d.fade) d.fade.remove(false);
  if (d.restart) d.restart.remove(false);
  nextTake(scene, 110);
  return true;
}
