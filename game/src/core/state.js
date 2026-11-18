// Shared state that outlives scenes, saved to localStorage when the browser allows it.
import { LOOK_KEYS } from '../art/palettes.js';
import { CLUES } from '../data/clues.js';

const KEY = 'unseen-above-v1';
// settings: music and effects volume (0 to 5), reduced flashing, screen shake. A computer that
// asks for reduced motion starts with flashing reduced and shake off.
const calm = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
// presenter: Michael's switch for the class walkthrough (ui and review.js read it; the typer reads
// state.settings.presenter too). bigCaptions: the caption strip at double height (ui/cg.js).
const defaults = () => ({ music: 5, sfx: 5, reduceFlash: calm, shake: !calm, presenter: false, bigCaptions: false });
// story: what she found and did, for the endings (Nov 17). heard: lines already spoken, never replayed.
const freshStory = () => ({ clues: {}, heard: {}, choice: null, creatorDeaths: 0, gaveUp: false, spared: false, killedBroken: false, endings: {} });
const fresh = () => ({ look: 'A', episodes: {}, seenIntro: false, panels: {}, immune: false, settings: defaults(), reached: null, resume: null, story: freshStory() });
let mem = fresh();
try { const raw = window.localStorage.getItem(KEY); if (raw) mem = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* private window or blocked storage: keep it in memory */ }
if (!LOOK_KEYS.includes(mem.look)) mem.look = 'A';
mem.settings = Object.assign(defaults(), mem.settings || {});
mem.story = Object.assign(freshStory(), mem.story || {});

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
  // presenter mode: the part on screen now (a step id) and when, so a refresh goes straight back
  get presenter() { return !!mem.settings.presenter; },
  get resume() { return mem.resume; },
  setResume(step) { if (mem.resume && mem.resume.id === step) { mem.resume.at = Date.now(); } else mem.resume = { id: step, at: Date.now() }; save(); },
  // deaths this visit, per episode (not saved): after three, the show offers to skip ahead
  died(id) { session[id] = (session[id] || 0) + 1; return session[id]; },
  diedHere(id) { return session[id] || 0; },
  // ---- the story (Nov 17): clues, lines heard, the boss, the endings
  get story() { return mem.story; },
  // mark a clue found; true the first time
  clue(id) { if (!CLUES[id] || mem.story.clues[id]) return false; mem.story.clues[id] = true; save(); return true; },
  hasClue(id) { return !!mem.story.clues[id]; },
  clueCount(group) { return Object.keys(mem.story.clues).filter(id => !group || CLUES[id] === group).length; },
  // a line (any stable key) already heard; hear() marks it and returns true the first time
  heard(key) { return !!mem.story.heard[key]; },
  hear(key) { if (mem.story.heard[key]) return false; mem.story.heard[key] = true; save(); return true; },
  // set a story flag or counter: state.storySet('spared', true)
  storySet(key, v) { mem.story[key] = v; save(); return v; },
  sawEnding(id) { mem.story.endings[id] = true; save(); },
  resetAll() { mem = fresh(); save(); }
};
