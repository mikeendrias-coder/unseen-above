// A death, the same in every episode: the satellite strikes (or the thing hits her itself), her
// body stays, and the take restarts.
//   - Instant takes (Nov 18, research/features_nov17.md item 1; Geometry Dash feel). Her first
//     death in the whole game is watched in full and fades out. After that there is no fade and
//     no card: the next take cuts in TAKE_AFTER s after the body lands, and the take number is
//     taped to the floor where she starts (juice.tape). The first death of each episode visit
//     still plays the whole strike, so a new danger reads; later ones play it short. Space,
//     Enter or J cuts any strike but the very first one short; the body still lands.
//   - Lives: 5 per episode visit, shown at the right end of the caption strip as LIVES pips
//     (the TAKE n tape is the show's own count of every take, a different thing). A death goes
//     back to the visit's last checkpoint, if the episode set one (setCheckpoint); losing the
//     last life clears it, so she starts again from the episode's start with 5. Bodies stay.
//     Never further back than the episode's start. Story mode (immunity) hides HP and lives;
//     satellite screens, side rooms and the Moon city have neither.
//   - What got her is captioned once per cause, never again on a retry.
//   - Every take reports to the show's record (results.js): the broadcast bar, the report.
// A scene learns why it started from its data: { retry: true } after a death or a restart by
// choice, plus { checkpoint } when one is set, and { outOfTakes: true } after the last life.
// A start without retry is a new visit. Out of lives is still a retry, so entry cards, cut
// scene captions and first lines do not replay.
import { state } from './state.js';
import { overlay } from './overlay.js';
import { deathLine } from '../data/dialogue.js';
import { cg } from '../ui/cg.js';
import { results } from './results.js';
import { juice } from './juice.js';

export const TAKES = 5;
const TAKE_AFTER = 0.22; // seconds from the body landing to the next take, after the first death
// scenes with no takes: nothing up there hunts her (the city, the playroom) or it is a side room
const NO_TAKES = ['moon', 'room'];
const visits = {}; // per episode id, this page visit only: { left, data }
const cuts = {};   // per episode id: the next start is a cut from a death (no fade in)

const keyOf = scene => scene.sys && scene.sys.settings && scene.sys.settings.key;
export const hasTakes = scene => !!scene.epId && !NO_TAKES.includes(keyOf(scene)) && !scene.noTakes;

// Call from initSide / initTop. A start that is not a retry is a new visit: 5 takes again.
export function startTakes(scene) {
  const id = scene.epId; if (!id) return;
  const data = (scene.sys.settings && scene.sys.settings.data) || {};
  const fresh = !data.retry || !visits[id];
  if (fresh) visits[id] = { left: TAKES, checkpoint: null };
  else if (data.outOfTakes) { visits[id].left = TAKES; visits[id].checkpoint = null; }
  scene.takesLeft = visits[id].left;
  // the broadcast bar runs in side episodes with takes (not the fight's arena, which has the
  // creator's HP; not the top-down east wing)
  results.begin(scene, fresh, hasTakes(scene) && !!scene.map && keyOf(scene) !== 'hallway');
  // once the scene is built: a take that follows a death cuts straight in (the scene's own fade
  // in is dropped), and the take goes on the floor (every scene, the fight included)
  const cut = !fresh && cuts[id]; delete cuts[id];
  scene.events.once('create', () => {
    const f = scene.cameras && scene.cameras.main && scene.cameras.main.fadeEffect;
    if (cut && f && f.isRunning) f.reset();
    tapeTake(scene);
  });
}
// The take, taped to the floor where it starts (from the second take on). Side: her feet;
// top-down: under her start tile. Scenes call this through takeNote.
export function tapeTake(scene) {
  juice.prime(scene); // her squash and stretch frames, ready before the first landing
  const n = scene.ep && scene.ep.take, k = scene.kid; if (!k || !(n > 1) || !hasTakes(scene)) return;
  if (scene.__tape && scene.__tape.g && scene.__tape.g.scene && scene.__tape.take === n) return; // already down
  if (k.x != null) juice.tape(scene, n, { x: k.x + k.w / 2, y: k.y + k.h });
  else if (scene.kidPx) { const c = scene.kidPx(); juice.tape(scene, n, { x: c.x, y: c.y + 4, topDown: true }); }
}
// An episode marks a checkpoint (any data it wants back, for example { x: 412 }). Deaths in this
// visit restart with data.checkpoint set to it; losing the last life clears it.
export function setCheckpoint(scene, at) { const v = scene.epId && visits[scene.epId]; if (v) v.checkpoint = at || null; }
// the data a retry restarts with (a death, Backspace, or the pause menu's RETRY)
export function retryData(scene) { const v = scene.epId && visits[scene.epId]; return Object.assign({ retry: true }, v && v.checkpoint ? { checkpoint: v.checkpoint } : {}); }
export const checkpointOf = scene => { const d = scene.sys && scene.sys.settings && scene.sys.settings.data; return (d && d.retry && d.checkpoint) || null; };
export const takesLeft = scene => (scene.epId && visits[scene.epId] ? visits[scene.epId].left : TAKES);

// HP at the left end of the strip and lives at the right: hidden in story mode, and both hidden
// where nothing can kill her (the Moon city, side rooms)
export function showStatus(scene, hp, maxHp) {
  const hide = state.immune || !hasTakes(scene);
  if (hp !== undefined) cg.hp(hide || hp == null ? null : hp, maxHp);
  cg.lives(hide ? null : takesLeft(scene), TAKES);
}

// after immunity changes: show or hide HP and takes for whatever scene is up
export function refreshStatus(scene) {
  const k = scene.kid, hp = k && typeof k.hp === 'number' ? k.hp : null;
  if (scene.epId) showStatus(scene, hp, scene.hpMax || 3);
}

// The next take: back to the visit's checkpoint (or its start), or, out of lives, the episode
// from its start with 5 again.
// fadeMs 0: a cut, no fade (every take after the very first death).
function nextTake(scene, fadeMs) {
  const v = visits[scene.epId], out = hasTakes(scene) && v && v.left <= 0;
  const go = () => scene.scene.restart(out ? { retry: true, outOfTakes: true } : retryData(scene));
  if (!out && !fadeMs) { cuts[scene.epId] = true; go(); return; }
  scene.cameras.main.fadeOut(fadeMs || 140, 0, 0, 0);
  if (!out) { scene.time.delayedCall(fadeMs + 10, go); return; }
  // out of lives: a stamp on black, gone before the next take's own stamp
  scene.time.delayedCall(fadeMs + 10, () => overlay.card('OUT OF LIVES', 'Episode from the top', 1150, 'center'));
  scene.time.delayedCall(fadeMs + 1200, go);
}

// impact(quiet): hide her and leave the body (quiet: no burst, flash or sound).
// fire(onImpact, { short }): start the strike; returns its length in seconds.
export function beginDeath(scene, src, impact, fire) {
  const fast = state.bodyCount() > 0, firstHere = results.deathsHere(scene.epId) === 0;
  const d = scene.death = { impacted: false, skipping: false, skippable: fast, fast };
  results.died(scene);
  // a life used up (not in story mode, where nothing kills her anyway)
  if (hasTakes(scene) && visits[scene.epId]) { visits[scene.epId].left = Math.max(0, visits[scene.epId].left - 1); scene.takesLeft = visits[scene.epId].left; showStatus(scene); }
  d.hit = quiet => {
    if (d.impacted) return; d.impacted = true; impact(!!quiet);
    // the strike lands: a hit-stop and a 2 px kick (not when a key cut it short)
    if (!quiet) juice.hit(scene, 2, 70);
    if (d.fast && !d.skipping) d.restart = scene.time.delayedCall(TAKE_AFTER * 1000, () => { d.skipping = true; nextTake(scene, 0); });
  };
  const line = deathLine(src && src.id, src && src.direct);
  if (state.hear('death:' + line)) overlay.sfx(line, 2400);
  if (scene.epId) state.died(scene.epId);
  let after = 0.4;
  if (src && src.direct) d.hit(false); else after = fire(() => d.hit(false), { short: fast && !firstHere });
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
  nextTake(scene, 0);
  return true;
}
