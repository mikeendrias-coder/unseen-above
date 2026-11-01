// Review tools for Michael: immunity (I) means nothing kills her; with it on, N skips ahead to
// the next part of a stage (or solves a satellite puzzle). The choice is saved, and a tag over
// the game says when it is on.
import { state } from './state.js';
import { overlay } from './overlay.js';
import { Sound } from './sound.js';

export function syncImmunity() { if (state.immune) window.__noDeath = true; overlay.immune(state.immune); }
// Call once per frame, before a scene's own input. Returns true if the scene was skipped ahead.
export function reviewKeys(scene) {
  const c = scene.ctl; if (!c) return false;
  if (c.immune()) {
    state.immune = !state.immune; window.__noDeath = state.immune; overlay.immune(state.immune);
    overlay.note(state.immune ? 'Immunity on' : 'Immunity off', 1800);
    Sound.tone(state.immune ? 880 : 440, 0.08, 'triangle', 0.02);
  }
  if (c.skipAhead() && state.immune && scene.skipAhead) { scene.skipAhead(); Sound.tone(1200, 0.05, 'square', 0.015); return true; }
  return false;
}
