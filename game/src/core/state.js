// Shared state that outlives scenes, saved to localStorage when the browser allows it.
import { LOOK_KEYS } from '../art/palettes.js';
import { CLUES } from '../data/clues.js';

const KEY = 'unseen-above-v1';
// settings: music and effects volume (0 to 5), reduced flashing, screen shake. A computer that
// asks for reduced motion starts with flashing reduced and shake off.
const calm = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
// presenter: Michael's switch for the class walkthrough (ui and review.js read it; the typer reads
// state.settings.presenter too). bigCaptions: the caption strip at double height (ui/cg.js).
// bright: the picture lifted for a washed-out projector (ui/bright.js).
// keysFolded / keysFoldedFs: the key bar under the game folded away, in the window and in full
// screen (ui/keys.js; folded by default in full screen).
const defaults = () => ({ music: 5, sfx: 5, reduceFlash: calm, shake: !calm, presenter: false, bigCaptions: false, bright: false, keysFolded: false, keysFoldedFs: true });
// story: what she found and did, for the endings (Nov 17). heard: lines already spoken, never replayed.
const freshStory = () => ({ clues: {}, heard: {}, choice: null, creatorDeaths: 0, gaveUp: false, spared: false, killedBroken: false, endings: {} });
// mode (Nov 18): how deaths cost her. 'normal': 5 lives, out of lives restarts the episode.
// 'endless': she dies as usual (bodies, takes) but lives never run out. 'immune': hazards play out
// in full, then she is back at the last mark with nothing lost (no life, no take, no body).
export const MODES = ['normal', 'endless', 'immune'];
const fresh = () => ({ look: 'A', episodes: {}, seenIntro: false, panels: {}, mode: 'normal', settings: defaults(), reached: null, resume: null, story: freshStory() });
let mem = fresh();
try { const raw = window.localStorage.getItem(KEY); if (raw) { const got = JSON.parse(raw); mem = Object.assign(fresh(), got); if (got && got.mode == null) mem.mode = got.immune ? 'immune' : 'normal'; } } catch (e) { /* private window or blocked storage: keep it in memory */ }
if (!LOOK_KEYS.includes(mem.look)) mem.look = 'A';
// saves from before the modes kept one switch, immune (read above)
if (!MODES.includes(mem.mode)) mem.mode = 'normal';
delete mem.immune;
const hadBright = !!(mem.settings && 'bright' in mem.settings);
mem.settings = Object.assign(defaults(), mem.settings || {});
if (!hadBright && mem.settings.presenter) mem.settings.bright = true; // a presenter save from before the Bright switch
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
  // (immune: she regenerates, so no body and no take)
  addBody(id, x, y, cause) { if (mem.mode === 'immune') return; const e = state.episode(id); e.bodies.push({ x: Math.round(x), y: Math.round(y), take: e.take, cause }); if (e.bodies.length > 40) e.bodies.shift(); e.take++; save(); },
  bodyCount() { return Object.values(mem.episodes).reduce((n, e) => n + (e.bodies ? e.bodies.length : 0), 0); },
  finish(id) { state.episode(id).done = true; save(); },
  // instruction panels show once
  seenPanel(k) { return !!(mem.panels && mem.panels[k]); },
  markPanel(k) { if (!mem.panels) mem.panels = {}; mem.panels[k] = true; save(); },
  // the mode (MODES above); core/review.js setMode changes it with the tags and the sound
  get mode() { return mem.mode; },
  setMode(m) { if (MODES.includes(m)) { mem.mode = m; save(); } return mem.mode; },
  // immune mode (the satellite screens and the endings read it as story mode). Setting it false
  // only leaves immune mode, so endless stays endless.
  get immune() { return mem.mode === 'immune'; },
  set immune(v) { if (v) mem.mode = 'immune'; else if (mem.mode === 'immune') mem.mode = 'normal'; save(); },
  get endless() { return mem.mode === 'endless'; },
  get seenIntro() { return mem.seenIntro; },
  set seenIntro(v) { mem.seenIntro = !!v; save(); },
  // settings, saved as they change
  get settings() { return mem.settings; },
  set(key, v) { mem.settings[key] = v; save(); return v; },
  // the furthest part of the show she has reached in order (a step id in core/flow.js), for Continue
  get reached() { return mem.reached; },
  reach(step) { mem.reached = step; save(); },
  // presenter mode: the part on screen now (a step id), what was picked there (an ending for the
  // playroom, give-up mode backstage) and when, so a refresh goes straight back into it
  get presenter() { return !!mem.settings.presenter; },
  get resume() { return mem.resume; },
  setResume(pick) {
    const p = typeof pick === 'string' ? { step: pick } : pick || {};
    mem.resume = { id: p.step, at: Date.now() };
    if (p.end) mem.resume.end = p.end;
    if (p.giveup) mem.resume.giveup = true;
    save();
  },
  clearResume() { if (mem.resume) { mem.resume = null; save(); } },
  // deaths this visit, per episode (not saved): after three, the show offers to skip ahead
  died(id) { session[id] = (session[id] || 0) + 1; return session[id]; },
  diedHere(id) { return session[id] || 0; },
  // ---- the story (Nov 17): clues, lines heard, the boss, the endings
  get story() { return mem.story; },
  // mark a clue found; true the first time
  clue(id) { if (!CLUES[id] || mem.story.clues[id]) return false; mem.story.clues[id] = true; this.lastClue = id; save(); return true; },
  lastClue: null, // the clue found last (overlay.note names its group)
  hasClue(id) { return !!mem.story.clues[id]; },
  clueCount(group) { return Object.keys(mem.story.clues).filter(id => !group || CLUES[id] === group).length; },
  // a line (any stable key) already heard; hear() marks it and returns true the first time
  heard(key) { return !!mem.story.heard[key]; },
  hear(key) { if (mem.story.heard[key]) return false; mem.story.heard[key] = true; save(); return true; },
  // set a story flag or counter: state.storySet('spared', true)
  storySet(key, v) { mem.story[key] = v; save(); return v; },
  sawEnding(id) { mem.story.endings[id] = true; save(); },
  // a run started from the title (Begin, From the start, a chapter; ui/typer.js): the lines heard
  // and the how-to notices seen are forgotten, so a rehearsal on this computer never leaves the
  // class run silent. Continue keeps them; clues, bodies, endings and settings stay.
  newRun() { mem.story.heard = {}; mem.panels = {}; save(); },
  resetAll() { const m = mem.mode; mem = fresh(); mem.mode = m; save(); }
};
