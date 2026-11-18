// The mode (Nov 18, Michael's playtest): one control on the title, the pause menu, the key under
// the game and the I key, which cycles NORMAL, ENDLESS, IMMUNE (state.mode).
//   NORMAL   5 lives an episode visit; out of lives, the episode from the top.
//   ENDLESS  she dies as usual (bodies, takes, HP) but lives never run out: the readout says
//            infinity.
//   IMMUNE   nothing is skipped or frozen: every hazard plays out (the strike, the chandelier,
//            the collapse, the creator's traps), then she regenerates at the last tape mark with
//            nothing lost (no life, no take, no body). core/death.js does it, one path for all.
// N skips ahead in ENDLESS and IMMUNE. In NORMAL the show still offers N to someone stuck: after
// three deaths in one episode this visit, or a long time on one satellite screen
// (scene.offerSkip). A tag over the game says the mode for a moment when it changes.
// window.__noDeath is only the tests' switch now (nothing sees her); no mode sets it.
import { state, MODES } from './state.js';
import { overlay } from './overlay.js';
import { Sound } from './sound.js';
import { refreshStatus } from './death.js';

export const STUCK_DEATHS = 3;
// Presenter mode (Nov 18, for the class walkthrough): one switch (title, key cap, pause menu, or
// ?present in the link). It turns the IMMUNE mode on, turns flashing down and the shake off, sets the
// music to 2 and the effects to 4 of 5 (the research's levels: he talks over it, the effects carry
// the story), lets N skip ahead everywhere (in any mode), drops the
// "Stuck?" offers, and swaps the mode tag over the picture for a quiet PRESENTER tag in the
// caption strip. Turning it off puts those settings back (the mode too). The typer reads state.settings.presenter.
export const presenting = () => !!state.settings.presenter;
const PRESENT_MUSIC = 2, PRESENT_SFX = 4;
export const MODE_WORD = { normal: 'NORMAL', endless: 'ENDLESS', immune: 'IMMUNE' };
// what each mode means, short enough for the pause menu's help line
export const MODE_HELP = { normal: 'Out of lives: the episode restarts.', endless: 'Lives never run out.', immune: 'Lose nothing. Back to the mark.' };
function tags() {
  overlay.immune(state.mode !== 'normal' && !presenting(), MODE_WORD[state.mode]);
  const t = document.getElementById('ptag');
  if (t) { t.hidden = !presenting(); t.textContent = 'PRESENTER'; } // the strip's LIVES readout says the mode
}
export function setPresenter(on) {
  on = !!on;
  if (on !== presenting()) {
    if (on) {
      const s = state.settings;
      state.set('presenterPrev', { mode: state.mode, reduceFlash: !!s.reduceFlash, shake: s.shake !== false, music: s.music, sfx: s.sfx });
      state.set('presenter', true);
      state.set('reduceFlash', true); state.set('shake', false);
      if (s.music > PRESENT_MUSIC) { state.set('music', PRESENT_MUSIC); Sound.volume('music', PRESENT_MUSIC); }
      if (s.sfx > PRESENT_SFX) { state.set('sfx', PRESENT_SFX); Sound.volume('sfx', PRESENT_SFX); }
      setMode('immune');
    } else {
      const p = state.settings.presenterPrev || {};
      state.set('presenter', false);
      if (p.reduceFlash != null) state.set('reduceFlash', p.reduceFlash);
      if (p.shake != null) state.set('shake', p.shake);
      if (p.music != null) { state.set('music', p.music); Sound.volume('music', p.music); }
      if (p.sfx != null) { state.set('sfx', p.sfx); Sound.volume('sfx', p.sfx); }
      setMode(MODES.includes(p.mode) ? p.mode : p.immune ? 'immune' : 'normal');
    }
  }
  tags();
  return presenting();
}
export function syncImmunity() { tags(); }
export function setMode(m) {
  state.setMode(m); tags();
  Sound.tone(m === 'immune' ? 880 : m === 'endless' ? 660 : 440, 0.08, 'triangle', 0.02);
  const sc = window.__game && window.__game.scene; if (sc && sc.sys && sc.sys.isActive()) refreshStatus(sc); // the lives readout follows the mode
  return state.mode;
}
// the next mode: NORMAL, ENDLESS, IMMUNE, then NORMAL again (d -1 goes back)
export function cycleMode(d) { const i = MODES.indexOf(state.mode); return setMode(MODES[(i + (d < 0 ? MODES.length - 1 : 1)) % MODES.length]); }
// the I key, the key under the game, the title: cycle, and say the mode on the set
export function stepMode(d) { const m = cycleMode(d); overlay.note('Mode: ' + MODE_WORD[m], 1600); return m; }
// immune or not (old callers: the title switch and tests)
export function setStory(on) { return setMode(on ? 'immune' : state.mode === 'immune' ? 'normal' : state.mode); }
// may N skip ahead here right now
export function canSkip(scene) {
  if (!scene || !scene.skipAhead) return false;
  return state.mode !== 'normal' || presenting() || !!scene.offerSkip || (!!scene.epId && state.diedHere(scene.epId) >= STUCK_DEATHS);
}
// is this an offer (stuck), rather than a mode that always has N
export function offering(scene) { return state.mode === 'normal' && !presenting() && canSkip(scene); }
// Call once per frame, before a scene's own input. Returns true if the scene was skipped ahead.
export function reviewKeys(scene) {
  const c = scene.ctl; if (!c) return false;
  if (c.immune()) stepMode(1);
  if (c.skipAhead() && canSkip(scene)) { scene.skipAhead(); Sound.tone(1200, 0.05, 'square', 0.015); return true; }
  return false;
}
// after a restart: say the offer is there, once per take
export function offerNote(scene) { if (offering(scene)) overlay.note('Stuck? N skips ahead', 5200); }
