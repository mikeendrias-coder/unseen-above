// Boot: size the canvas to a whole-number pixel scale, then start with the opening.
import { measure, applyCss, display } from './core/display.js';
import { Sound } from './core/sound.js';
import { overlay } from './core/overlay.js';
import { initPicker, HASH, DIGITS, SHORT } from './ui/vibe.js';
import { initPause } from './ui/pause.js';
import { initKeys, onKeysChange } from './ui/keys.js';
import { cg } from './ui/cg.js';
import { STEPS } from './core/flow.js';
import { state } from './core/state.js';
import { Music } from './core/music.js';
import { stepMode, syncImmunity, setPresenter, presenting, MODE_WORD } from './core/review.js';
import { newGame } from './data/endings.js';
import { itemPanel } from './core/panels.js';
import { Grounds } from './scenes/Grounds.js';
import { Gallery } from './scenes/Gallery.js';
import { Intro } from './scenes/Intro.js';
import { Satellite } from './scenes/Satellite.js';
import { Kids } from './scenes/Kids.js';
import { Room } from './scenes/Room.js';
import { Fall } from './scenes/Fall.js';
import { EastWing } from './scenes/EastWing.js';
import { Bedroom } from './scenes/Bedroom.js';
import { Moon } from './scenes/Moon.js';
import { Hallway } from './scenes/Hallway.js';

// Which part to open: ?scene=grounds|gallery|satellite|kids (&batch=2 &skin=N), or a plain #name
// (a shared link keeps only that): #opening, #grounds, #gallery, #fall, #eastwing, #bedroom,
// #moon, #hallway, #playroom, #batch1 to #batch4, #kids
function route() {
  const params = new URLSearchParams(location.search), hash = location.hash.replace('#', '');
  if (/^batch[1-4]$/.test(hash)) { params.set('scene', 'satellite'); params.set('batch', hash.slice(5)); }
  else if (['grounds', 'gallery', 'fall', 'eastwing', 'bedroom', 'moon', 'hallway', 'kids'].includes(hash)) params.set('scene', hash);
  else if (hash === 'playroom') return { first: 'moon', firstData: { at: 'playroom' } };
  else if (hash === 'opening') params.set('scene', 'intro');
  const first = ['grounds', 'gallery', 'fall', 'eastwing', 'bedroom', 'moon', 'hallway', 'satellite', 'kids'].includes(params.get('scene')) ? params.get('scene') : 'intro';
  const batch = [1, 2, 3, 4].includes(Number(params.get('batch'))) ? Number(params.get('batch')) : 1;
  // the kids' room by a #link plays as it does in the show and flows on to the Moon (?scene=kids
  // is the preview: it ends, Enter replays it)
  return { first, firstData: first === 'satellite' ? { batch, skin: Number(params.get('skin')) || batch } : first === 'kids' && hash === 'kids' ? { inFlow: true } : {} };
}

let game = null, pause = null, playing = false;
// the game's picture and its overlay, hidden while the channel guide is up
function showGame(on) {
  const st = document.getElementById('stage'); if (st) st.classList.toggle('playing', on);
  if (game && game.canvas) game.canvas.style.display = on ? '' : 'none';
  const o = document.getElementById('overlay'); if (o) o.style.display = on ? '' : 'none';
}
function start(entry) {
  measure();
  const { first, firstData } = entry || route();
  game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'stage',
    width: display.w, height: display.h,
    backgroundColor: '#000000',
    pixelArt: true,
    antialiasGL: true,
    scale: { mode: Phaser.Scale.NONE },
    input: { keyboard: { target: window } },
    banner: false,
    scene: []
  });
  game.scene.add('intro', Intro, false);
  game.scene.add('grounds', Grounds, false);
  game.scene.add('gallery', Gallery, false);
  game.scene.add('satellite', Satellite, false);
  game.scene.add('fall', Fall, false);
  game.scene.add('eastwing', EastWing, false);
  game.scene.add('bedroom', Bedroom, false);
  game.scene.add('moon', Moon, false);
  game.scene.add('hallway', Hallway, false);
  game.scene.add('room', Room, false);
  game.scene.add('kids', Kids, false); // after satellite, so it draws over the screen it embeds
  game.events.once('ready', () => {
    applyCss(game); syncImmunity();
    game.scene.start(first, firstData);
    fsFit();
  });
  pause = initPause(game, { playing: () => playing, guide: toGuide });
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const before = display.S; measure();
      if (display.S !== before) { game.scale.resize(display.w, display.h); }
      applyCss(game);
      game.scale.emit('rescale');
      fsFit();
    }, 150);
  });
  window.__unseen = { game, display, Sound, overlay, itemPanel, pause, state, cg, goStep, toggleFull };
}
function stopAll() {
  game.scene.getScenes(false).forEach(sc => { const s = sc.sys; if (s.isActive() || s.isPaused() || s.isSleeping()) game.scene.stop(s.settings.key); });
}
// a jump link: that part, now
function jumpTo() {
  if (!game) return;
  if (pause) pause.drop();
  const r = route();
  stopAll(); overlay.clearCaption(); overlay.hint('');
  game.scene.start(r.first, r.firstData);
}
// the pause menu's CHANNEL GUIDE: the show stops, the guide comes back (her place is kept: a part
// opened by a jump that lies past the one she reached becomes Continue's). The address and the
// presenter's resume record are cleared, so Begin starts from the opening and a refresh on the
// title stays on the title.
const stepAt = id => STEPS.findIndex(s => s.id === id);
function toGuide() {
  const here = currentStep(); if (here && stepAt(here) > stepAt(state.reached)) state.reach(here);
  playing = false;
  clearHash(); state.clearResume();
  stopAll(); Music.stop(0.5);
  cg.clearAll(); overlay.clearCaption(); overlay.hint(''); overlay.fade(false, 0);
  showGame(false);
  if (tv) tv.hidden = false;
  guide();
  fsFit();
}

// ---- Chapters, straight to a part (Nov 18). The number keys 0 to 9, the title's Chapters list
// and the jump links under the game all come here: the part starts as it does in the show's own
// order (the data Continue uses), so each opens with its title card. Backstage and the playroom
// have no card of their own, so one is shown here. Picks: { step } a part, { end } an ending's
// playroom (the ?end= link), { giveup } backstage with the creator given up (the ?giveup= link).
const OWN_CARD = { ep5b: ['EPISODE 5', 'Backstage'], ep5c: ['EPISODE 5', 'The playroom'] };
function entryFor(pick) {
  if (pick.end) return { first: 'moon', firstData: { at: 'playroom', force: pick.end }, card: OWN_CARD.ep5c, step: 'ep5c' };
  if (pick.giveup) return { first: 'hallway', firstData: { giveUp: true }, card: OWN_CARD.ep5b, step: 'ep5b' };
  const st = STEPS.find(s => s.id === pick.step); if (!st) return null;
  return { first: st.scene, firstData: Object.assign({}, st.data), card: OWN_CARD[st.id], step: st.id };
}
function goStep(pick) {
  const e = entryFor(pick); if (!e) return false;
  // presenting: lines heard in a rehearsal (or earlier tonight) play again after a jump
  if (presenting()) state.storySet('heard', {});
  if (e.step) setHash(e.step);
  // and kept at once, so a refresh straight after a jump comes back here too
  if (e.step && presenting()) { const k = { step: e.step }; if (pick.end) k.end = pick.end; if (pick.giveup) k.giveup = true; state.setResume(k); kept = JSON.stringify(k); keptAt = Date.now(); }
  if (!playing) begin(e);
  else {
    if (pause) pause.drop();
    stopAll(); cg.clearAll(); overlay.clearCaption(); overlay.hint(''); overlay.fade(false, 0);
    game.scene.start(e.first, e.firstData);
  }
  if (e.card) { const [top, title] = e.card; setTimeout(() => { overlay.card(top, title, 3600, 'lower'); overlay.bug('CH 07', 3600); }, 700); }
  return true;
}
const setHash = id => { try { if (HASH[id] && location.hash !== '#' + HASH[id]) history.replaceState(history.state, '', location.pathname + location.search + '#' + HASH[id]); } catch (e) { /* no address */ } };
const clearHash = () => { try { if (location.hash) history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* no address */ } };
const stepOfHash = h => Object.keys(HASH).find(id => HASH[id] === String(h || '').replace('#', '')) || null;

// ---- Presenter mode: where she is now, kept in the address and the save, so a refresh goes
// straight back to the start of this part (not the title screen).
const KEY_STEP = { intro: 'intro', grounds: 'ep1', gallery: 'ep2', fall: 'ep3', eastwing: 'ep3b', bedroom: 'ep4', kids: 'kids', hallway: 'ep5b' };
function currentStep() {
  const sc = window.__game && window.__game.scene; if (!sc || !sc.sys || !sc.sys.settings) return null;
  const key = sc.sys.settings.key, d = sc.sys.settings.data || {};
  if (key === 'satellite') return 'batch' + (sc.batch || d.batch || 1);
  if (key === 'moon') return d.at === 'playroom' ? 'ep5c' : 'ep5';
  return KEY_STEP[key] || null; // a side room keeps the episode it opens from
}
// and what was asked for there: an ending picked for the playroom, or give-up mode backstage
function currentPick() {
  const id = currentStep(); if (!id) return null;
  const sc = window.__game.scene, d = sc.sys.settings.data || {};
  if (id === 'ep5c' && d.force) return { step: id, end: d.force };
  if (id === 'ep5b' && d.giveUp) return { step: id, giveup: true };
  return { step: id };
}
let keptAt = 0, kept = '';
setInterval(() => {
  if (!playing || !presenting()) return;
  keepAwake();
  const pick = currentPick(); if (!pick) return;
  setHash(pick.step);
  const sig = JSON.stringify(pick);
  if (sig !== kept || Date.now() - keptAt > 30000) { keptAt = Date.now(); kept = sig; state.setResume(pick); }
}, 1000);
const RESUME_MS = 15 * 60 * 1000; // a saved part this fresh is where a reopened page goes back to

// A screen wake lock while presenting, so a long pause to talk never dims the projector.
// Asked for when the show starts, and again every second while presenting (so turning presenter
// on mid-show takes it at once); a refusal is tried again 20 s later.
let wake = null, wakeTried = 0;
function keepAwake() {
  if (!presenting() || !playing || wake || document.hidden || !navigator.wakeLock || Date.now() - wakeTried < 20000) return;
  wakeTried = Date.now();
  navigator.wakeLock.request('screen').then(w => { wake = w; wakeTried = 0; w.addEventListener('release', () => { wake = null; }); }).catch(() => { /* refused: tried again later */ });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) keepAwake(); });

// ---- Full screen: the stage alone (the page around it hides), from U, the key under the game
// or the title. Browsers allow it only right after a key or a click; a refusal says so.
const stageEl = () => document.getElementById('stage');
const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function toggleFull() {
  const st = stageEl(); if (!st) return;
  try {
    if (fsOn()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const req = st.requestFullscreen || st.webkitRequestFullscreen;
    const r = req ? req.call(st) : Promise.reject(new Error('none'));
    if (r && r.catch) r.catch(() => fsRefused());
  } catch (e) { fsRefused(); }
}
function fsRefused() {
  if (playing) overlay.note('Full screen blocked. F11 works too', 2600);
  else if (optFull) optFull.querySelector('i').textContent = 'blocked';
}
// in full screen the picture (and the strip under it) sits in the middle of the screen
function fsFit() {
  const st = stageEl(); if (!st) return;
  const on = fsOn();
  document.body.classList.toggle('fs', on);
  if (!on) { st.style.removeProperty('--fs-pad'); return; }
  setTimeout(() => {
    const box = playing ? document.getElementById('overlay') : tv;
    const h = box ? box.offsetHeight : 0;
    st.style.setProperty('--fs-pad', Math.max(0, Math.floor((window.innerHeight - h) / 2)) + 'px');
  }, 220);
}
const onFs = () => { fsFit(); window.dispatchEvent(new Event('resize')); if (!playing) syncGuide(); if (window.__keys) window.__keys.sync(); };
document.addEventListener('fullscreenchange', onFs);
document.addEventListener('webkitfullscreenchange', onFs);

// In an embed (itch.io) the keys go to the outer page until the game has focus: take it on load
// and on any click, and show a line asking for a click while it is elsewhere.
const grab = () => { try { window.focus(); } catch (e) { /* not allowed */ } };
// The line shows until the first click or key inside, and again whenever the window loses focus.
const focusNote = document.getElementById('focus-note');
const noteOn = on => { if (focusNote) focusNote.hidden = !on; };
// the first click or key also lets the sound start (a refresh in presenter mode starts the show
// before anyone has pressed anything)
const inside = () => { grab(); noteOn(false); if (playing) Sound.ensure(); };
window.addEventListener('pointerdown', inside, true);
window.addEventListener('keydown', () => { noteOn(false); if (playing) Sound.ensure(); }, true);
window.addEventListener('blur', () => noteOn(true));
grab(); noteOn(window.self !== window.top || !document.hasFocus());

// The number keys and U, everywhere (the title screen and the show). This listens before the
// pause menu does, so a number also works with the menu or the freeze up.
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (e.key === 'u' || e.key === 'U') { e.preventDefault(); toggleFull(); return; }
  if (!/^[0-9]$/.test(e.key)) return;
  e.preventDefault(); e.stopPropagation();
  // a how-to slip that is up closes, and the jump goes in the same press
  if (cg.pageUp && overlay.closePanel) overlay.closePanel();
  goStep({ step: DIGITS[Number(e.key)] });
}, true);

const go = document.getElementById('start'), tv = document.getElementById('tv'), cont = document.getElementById('continue');
const optStory = document.getElementById('opt-story'), optFlash = document.getElementById('opt-flash');
const optNew = document.getElementById('opt-new'), optPresent = document.getElementById('opt-present');
const optFull = document.getElementById('opt-full'), optCaps = document.getElementById('opt-caps');
let stopPicker = () => {};
initKeys();
// saved volumes, before any sound is made
Sound.volume('music', state.settings.music); Sound.volume('sfx', state.settings.sfx);
// ?present in the link turns presenter mode on (?present=0 off); the address is then cleaned up
(() => {
  try {
    const u = new URL(location.href), v = u.searchParams.get('present');
    if (v == null) return;
    setPresenter(v !== '0' && v !== 'off');
    u.searchParams.delete('present'); history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  } catch (e) { /* no address */ }
})();

// Continue: the part she reached last, in the show's order
const saved = () => { const st = STEPS.find(s => s.id === state.reached); return st && st.id !== 'intro' ? st : null; };
// anything a new game would clear
const remembered = () => { const s = state.story; return !!saved() || state.bodyCount() > 0 || [s.heard, s.clues, s.endings].some(o => o && Object.keys(o).length); };
const sw = (b, on, word) => { if (!b) return; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.querySelector('i').textContent = word; };
let armed = 0; // New game asks twice
function syncGuide() {
  // a #link with a saved place: Continue offers the linked part (with none, Begin goes there)
  const h = hashStep(), st = h && saved() ? STEPS.find(s => s.id === h) : saved();
  if (cont) { cont.hidden = !st; const at = cont.querySelector('i'); if (at && st) at.textContent = SHORT[st.id] || st.label; cont.setAttribute('aria-label', st ? 'Continue: ' + st.label : 'Continue'); }
  if (go) { go.classList.toggle('second', !!st); go.firstChild.textContent = st ? 'From the start' : 'Begin'; }
  if (optNew) { optNew.hidden = !(remembered() || presenting()); if (!armed) optNew.querySelector('i').textContent = ''; }
  sw(optStory, state.mode !== 'normal', MODE_WORD[state.mode].toLowerCase());
  sw(optFlash, !!state.settings.reduceFlash, state.settings.reduceFlash ? 'reduced' : 'full');
  sw(optPresent, presenting(), presenting() ? 'on' : 'off');
  // full screen and big captions are presenter tools: on the title only while presenting (U and
  // the key under the game work for everyone)
  if (optFull) optFull.hidden = !presenting();
  // big captions need the caption strip (ui/cg.js) to draw them; the row waits until it can
  if (optCaps) optCaps.hidden = !presenting() || !cg.canBigCaptions;
  if (optFull && optFull.querySelector('i').textContent !== 'blocked') sw(optFull, fsOn(), fsOn() ? 'on' : 'off');
  sw(optCaps, !!state.settings.bigCaptions, state.settings.bigCaptions ? 'on' : 'off');
}
const begin = entry => {
  if (playing) return;
  playing = true; stopPicker();
  // presenting: a run from the title plays every line again (a rehearsal must not silence it)
  if (presenting()) state.storySet('heard', {});
  if (tv) tv.hidden = true; const note = document.getElementById('tv-note'); if (note) note.hidden = true;
  Sound.ensure();
  { const st = document.getElementById('stage'); if (st) st.classList.add('playing'); }
  keepAwake();
  if (!game) { start(entry); return; }
  showGame(true);
  const { first, firstData } = entry || route();
  game.scene.start(first, firstData);
  fsFit();
};
// Continue (and Enter on the guide): a part named in the address (a #link opened on the title)
// wins over the saved place, so local.html#bedroom then Enter opens the bedroom
const hashStep = () => stepOfHash(location.hash);
const resume = () => {
  const h = hashStep(); if (h) { goStep({ step: h }); return; }
  const st = saved(); begin(st ? { first: st.scene, firstData: Object.assign({}, st.data) } : null);
};
const primary = () => (hashStep() || saved() ? resume() : begin(null));
function guide() { stopPicker(); syncGuide(); stopPicker = initPicker(primary, goStep); } // once: a second picker would move two rows per arrow

if (go) {
  guide();
  go.addEventListener('click', () => begin(null));
  if (cont) cont.addEventListener('click', resume);
  if (optStory) optStory.addEventListener('click', () => { stepMode(1); syncGuide(); if (window.__keys) window.__keys.sync(); });
  if (optFlash) optFlash.addEventListener('click', () => { const r = !state.settings.reduceFlash; state.set('reduceFlash', r); state.set('shake', !r); syncGuide(); });
  if (optPresent) optPresent.addEventListener('click', () => { setPresenter(!presenting()); guide(); if (optPresent) optPresent.focus({ preventScroll: true }); });
  if (optFull) optFull.addEventListener('click', () => { optFull.querySelector('i').textContent = ''; toggleFull(); syncGuide(); });
  if (optCaps) optCaps.addEventListener('click', () => { state.set('bigCaptions', !state.settings.bigCaptions); syncGuide(); window.dispatchEvent(new Event('resize')); });
  // New game: the first click asks, a second within four seconds clears her run (story, takes,
  // bodies, lines heard, how-to slips seen; the look, settings and switches stay)
  if (optNew) optNew.addEventListener('click', () => {
    if (!armed) { armed = setTimeout(() => { armed = 0; syncGuide(); }, 4000); optNew.querySelector('i').textContent = 'sure?'; return; }
    clearTimeout(armed); armed = 0;
    newGame(); clearHash(); guide();
    const first = go; if (first) first.focus({ preventScroll: true });
  });
  // the key buttons under the picture change the same settings: the title menu follows them
  onKeysChange(() => { if (!playing) syncGuide(); });
  // I on the title screen cycles the mode, as it does in the show
  window.addEventListener('keydown', e => {
    if (playing || e.repeat || e.ctrlKey || e.metaKey || e.altKey || (e.key !== 'i' && e.key !== 'I')) return;
    e.preventDefault(); stepMode(1); syncGuide();
    if (window.__keys) window.__keys.sync();
  });
  // a jump link starts that part with its title card (clicked again, it starts that part again)
  document.querySelectorAll('.jump a').forEach(a => a.addEventListener('click', ev => {
    const id = stepOfHash(a.getAttribute('href'));
    if (!id) return;
    ev.preventDefault();
    try { history.replaceState(history.state, '', location.pathname + location.search + a.getAttribute('href')); } catch (e) { /* no address */ }
    goStep({ step: id });
  }));
  // a new # while the show is on goes there; on the guide, BEGIN will use it
  window.addEventListener('hashchange', () => { if (playing) jumpTo(); else syncGuide(); });
  // presenter mode: a refresh (or reopening within 15 minutes) goes straight back into the part
  // (with the ending or give-up mode that was picked there)
  if (presenting()) {
    const fromHash = stepOfHash(location.hash), r = state.resume;
    const fresh = r && r.id && Date.now() - r.at < RESUME_MS;
    const id = fromHash || (fresh ? r.id : null);
    if (id) goStep(r && r.id === id ? { step: id, end: r.end, giveup: r.giveup } : { step: id });
  }
} else begin(null);
