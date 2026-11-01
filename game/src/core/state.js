// Shared state that outlives scenes, saved to localStorage when the browser allows it.
import { LOOK_KEYS } from '../art/palettes.js';

const KEY = 'unseen-above-v1';
const fresh = () => ({ look: 'A', episodes: {}, seenIntro: false });
let mem = fresh();
try { const raw = window.localStorage.getItem(KEY); if (raw) mem = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* private window or blocked storage: keep it in memory */ }
if (!LOOK_KEYS.includes(mem.look)) mem.look = 'A';

const save = () => { try { window.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ } };

export const state = {
  get look() { return mem.look; },
  nextLook() { const i = LOOK_KEYS.indexOf(mem.look); mem.look = LOOK_KEYS[(i + 1) % LOOK_KEYS.length]; save(); return mem.look; },
  episode(id) {
    if (!mem.episodes[id]) mem.episodes[id] = { take: 1, bodies: [], done: false };
    return mem.episodes[id];
  },
  // A death leaves a body; the next attempt is the next take.
  addBody(id, x, y, cause) { const e = state.episode(id); e.bodies.push({ x: Math.round(x), y: Math.round(y), take: e.take, cause }); if (e.bodies.length > 40) e.bodies.shift(); e.take++; save(); },
  finish(id) { state.episode(id).done = true; save(); },
  get seenIntro() { return mem.seenIntro; },
  set seenIntro(v) { mem.seenIntro = !!v; save(); },
  resetAll() { mem = fresh(); save(); }
};
