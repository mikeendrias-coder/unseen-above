// Shared state that outlives scenes, saved to localStorage when the browser allows it.
import { LOOK_KEYS } from '../art/palettes.js';

const KEY = 'unseen-above-v1';
// settings: music and effects volume (0 to 5), reduced flashing, screen shake. A computer that
// asks for reduced motion starts with flashing reduced and shake off.
const calm = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
const defaults = () => ({ music: 5, sfx: 5, reduceFlash: calm, shake: !calm });
const fresh = () => ({ look: 'A', episodes: {}, seenIntro: false, panels: {}, immune: false, settings: defaults(), reached: null });
let mem = fresh();
try { const raw = window.localStorage.getItem(KEY); if (raw) mem = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* private window or blocked storage: keep it in memory */ }
if (!LOOK_KEYS.includes(mem.look)) mem.look = 'A';
mem.settings = Object.assign(defaults(), mem.settings || {});

const session = {};
const save = () => { try { window.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ } };

export const state = {
  get look() { return mem.look; },
  setLook(k) { if (LOOK_KEYS.includes(k)) { mem.look = k; save(); } return mem.look; },
  nextLook() { const i = LOOK_KEYS.indexOf(mem.look); mem.look = LOOK_KEYS[(i + 1) % LOOK_KEYS.length]; save(); return mem.look; },
  episode(id) {
    if (!mem.episodes[id]) mem.episodes[id] = { take: 1, bodies: [], done: false };
    return mem.episodes[id];
  },
  // A death leaves a body; the next attempt is the next take.
  addBody(id, x, y, cause) { const e = state.episode(id); e.bodies.push({ x: Math.round(x), y: Math.round(y), take: e.take, cause }); if (e.bodies.length > 40) e.bodies.shift(); e.take++; save(); },
  bodyCount() { return Object.values(mem.episodes).reduce((n, e) => n + (e.bodies ? e.bodies.length : 0), 0); },
  finish(id) { state.episode(id).done = true; save(); },
  // instruction panels show once
  seenPanel(k) { return !!(mem.panels && mem.panels[k]); },
  markPanel(k) { if (!mem.panels) mem.panels = {}; mem.panels[k] = true; save(); },
  // immunity, for reviewing the game: nothing kills her, N skips ahead
  get immune() { return !!mem.immune; },
  set immune(v) { mem.immune = !!v; save(); },
  get seenIntro() { return mem.seenIntro; },
  set seenIntro(v) { mem.seenIntro = !!v; save(); },
  // settings, saved as they change
  get settings() { return mem.settings; },
  set(key, v) { mem.settings[key] = v; save(); return v; },
  // the furthest part of the show she has reached in order (a step id in core/flow.js), for Continue
  get reached() { return mem.reached; },
  reach(step) { mem.reached = step; save(); },
  // deaths this visit, per episode (not saved): after three, the show offers to skip ahead
  died(id) { session[id] = (session[id] || 0) + 1; return session[id]; },
  diedHere(id) { return session[id] || 0; },
  resetAll() { mem = fresh(); save(); }
};
