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
// Presenter mode (Nov 18, for the class walkthrough): one switch (title, key cap, pause menu, or
// ?present in the link). It turns immunity on, turns flashing down and the shake off, sets the
// music to 2 and the effects to 4 of 5 (the research's levels: he talks over it, the effects carry
// the story), lets N skip ahead everywhere (even with immunity off, to die on purpose), drops the
// "Stuck?" offers, and swaps the IMMUNE tag over the picture for a quiet PRESENTER tag in the
// caption strip. Turning it off puts those settings back. The typer reads state.settings.presenter.
export const presenting = () => !!state.settings.presenter;
const PRESENT_MUSIC = 2, PRESENT_SFX = 4;
function tags() {
  overlay.immune(state.immune && !presenting());
  const t = document.getElementById('ptag');
  if (t) { t.hidden = !presenting(); t.textContent = state.immune ? 'PRESENTER' : 'CAN DIE'; } // short: it fits the strip's right end
}
export function setPresenter(on) {
  on = !!on;
  if (on !== presenting()) {
    if (on) {
      const s = state.settings;
      state.set('presenterPrev', { immune: state.immune, reduceFlash: !!s.reduceFlash, shake: s.shake !== false, music: s.music, sfx: s.sfx });
      state.set('presenter', true);
      state.set('reduceFlash', true); state.set('shake', false);
      if (s.music > PRESENT_MUSIC) { state.set('music', PRESENT_MUSIC); Sound.volume('music', PRESENT_MUSIC); }
      if (s.sfx > PRESENT_SFX) { state.set('sfx', PRESENT_SFX); Sound.volume('sfx', PRESENT_SFX); }
      setStory(true);
    } else {
      const p = state.settings.presenterPrev || {};
      state.set('presenter', false);
      if (p.reduceFlash != null) state.set('reduceFlash', p.reduceFlash);
      if (p.shake != null) state.set('shake', p.shake);
      if (p.music != null) { state.set('music', p.music); Sound.volume('music', p.music); }
      if (p.sfx != null) { state.set('sfx', p.sfx); Sound.volume('sfx', p.sfx); }
      setStory(!!p.immune);
    }
  }
  tags();
  return presenting();
}
export function syncImmunity() { if (state.immune) window.__noDeath = true; tags(); }
export function setStory(on) {
  state.immune = !!on; window.__noDeath = state.immune; tags();
  Sound.tone(state.immune ? 880 : 440, 0.08, 'triangle', 0.02);
  const sc = window.__game && window.__game.scene; if (sc && sc.sys && sc.sys.isActive()) refreshStatus(sc); // HP and takes hide while immune
}
// may N skip ahead here right now
export function canSkip(scene) {
  if (!scene || !scene.skipAhead) return false;
  return state.immune || presenting() || !!scene.offerSkip || (!!scene.epId && state.diedHere(scene.epId) >= STUCK_DEATHS);
}
// is this an offer (stuck), rather than story mode
export function offering(scene) { return !state.immune && !presenting() && canSkip(scene); }
// Call once per frame, before a scene's own input. Returns true if the scene was skipped ahead.
export function reviewKeys(scene) {
  const c = scene.ctl; if (!c) return false;
  if (c.immune()) { setStory(!state.immune); overlay.note(state.immune ? 'Immunity on' : 'Immunity off', 1800); }
  if (c.skipAhead() && canSkip(scene)) { scene.skipAhead(); Sound.tone(1200, 0.05, 'square', 0.015); return true; }
  return false;
}
// after a restart: say the offer is there, once per take
export function offerNote(scene) { if (offering(scene)) overlay.note('Stuck? N skips ahead', 5200); }
