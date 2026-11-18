// Immunity, called story mode in the code (saved; on the title screen, the I key, the key under
// the game and the pause menu): nothing kills her, and N skips
// ahead to the next part of a stage (or solves a satellite screen). Without it, the show still
// offers N to someone stuck: after three deaths in one episode this visit, or a long time on one
// satellite screen (scene.offerSkip). I toggles story mode too, for review. A tag over the game
// says when it is on.
import { state } from './state.js';
import { overlay } from './overlay.js';
import { Sound } from './sound.js';
import { refreshStatus } from './death.js';

export const STUCK_DEATHS = 3;
export function syncImmunity() { if (state.immune) window.__noDeath = true; overlay.immune(state.immune); }
export function setStory(on) {
  state.immune = !!on; window.__noDeath = state.immune; overlay.immune(state.immune);
  Sound.tone(state.immune ? 880 : 440, 0.08, 'triangle', 0.02);
  const sc = window.__game && window.__game.scene; if (sc && sc.sys && sc.sys.isActive()) refreshStatus(sc); // HP and takes hide while immune
}
// may N skip ahead here right now
export function canSkip(scene) {
  if (!scene || !scene.skipAhead) return false;
  return state.immune || !!scene.offerSkip || (!!scene.epId && state.diedHere(scene.epId) >= STUCK_DEATHS);
}
// is this an offer (stuck), rather than story mode
export function offering(scene) { return !state.immune && canSkip(scene); }
// Call once per frame, before a scene's own input. Returns true if the scene was skipped ahead.
export function reviewKeys(scene) {
  const c = scene.ctl; if (!c) return false;
  if (c.immune()) { setStory(!state.immune); overlay.note(state.immune ? 'Immunity on' : 'Immunity off', 1800); }
  if (c.skipAhead() && canSkip(scene)) { scene.skipAhead(); Sound.tone(1200, 0.05, 'square', 0.015); return true; }
  return false;
}
// after a restart: say the offer is there, once per take
export function offerNote(scene) { if (offering(scene)) overlay.note('Stuck? N skips ahead', 5200); }
