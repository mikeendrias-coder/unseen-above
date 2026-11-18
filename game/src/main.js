// Boot: size the canvas to a whole-number pixel scale, then start with the opening.
import { measure, applyCss, display } from './core/display.js';
import { Sound } from './core/sound.js';
import { overlay } from './core/overlay.js';
import { initPicker } from './ui/vibe.js';
import { initPause } from './ui/pause.js';
import { initKeys } from './ui/keys.js';
import { cg } from './ui/cg.js';
import { STEPS } from './core/flow.js';
import { state } from './core/state.js';
import { Music } from './core/music.js';
import { setStory } from './core/review.js';
import { syncImmunity } from './core/review.js';
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
  return { first, firstData: first === 'satellite' ? { batch, skin: Number(params.get('skin')) || batch } : {} };
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
    }, 150);
  });
  window.__unseen = { game, display, Sound, overlay, itemPanel, pause, state, cg };
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
// the pause menu's CHANNEL GUIDE: the show stops, the guide comes back (her place is kept)
function toGuide() {
  playing = false;
  stopAll(); Music.stop(0.5);
  cg.clearAll(); overlay.clearCaption(); overlay.hint(''); overlay.fade(false, 0);
  showGame(false);
  if (tv) tv.hidden = false;
  guide();
}

// In an embed (itch.io) the keys go to the outer page until the game has focus: take it on load
// and on any click, and show a line asking for a click while it is elsewhere.
const grab = () => { try { window.focus(); } catch (e) { /* not allowed */ } };
// The line shows until the first click or key inside, and again whenever the window loses focus.
const focusNote = document.getElementById('focus-note');
const noteOn = on => { if (focusNote) focusNote.hidden = !on; };
const inside = () => { grab(); noteOn(false); };
window.addEventListener('pointerdown', inside, true);
window.addEventListener('keydown', () => noteOn(false), true);
window.addEventListener('blur', () => noteOn(true));
grab(); noteOn(window.self !== window.top || !document.hasFocus());

const go = document.getElementById('start'), tv = document.getElementById('tv'), cont = document.getElementById('continue');
const optStory = document.getElementById('opt-story'), optFlash = document.getElementById('opt-flash');
let stopPicker = () => {};
initKeys();
// saved volumes, before any sound is made
Sound.volume('music', state.settings.music); Sound.volume('sfx', state.settings.sfx);

// Continue: the part she reached last, in the show's order
const saved = () => { const st = STEPS.find(s => s.id === state.reached); return st && st.id !== 'intro' ? st : null; };
function syncGuide() {
  const st = saved();
  if (cont) { cont.hidden = !st; const at = cont.querySelector('i'); if (at && st) at.textContent = st.label; }
  if (go) { go.classList.toggle('second', !!st); go.firstChild.textContent = st ? 'From the start' : 'Begin'; }
  if (optStory) { optStory.setAttribute('aria-pressed', state.immune ? 'true' : 'false'); optStory.querySelector('i').textContent = state.immune ? 'on' : 'off'; }
  if (optFlash) { const r = !!state.settings.reduceFlash; optFlash.setAttribute('aria-pressed', r ? 'true' : 'false'); optFlash.querySelector('i').textContent = r ? 'reduced' : 'full'; }
}
const begin = entry => {
  if (playing) return;
  playing = true; stopPicker();
  if (tv) tv.hidden = true; const note = document.getElementById('tv-note'); if (note) note.hidden = true;
  Sound.ensure();
  { const st = document.getElementById('stage'); if (st) st.classList.add('playing'); }
  if (!game) { start(entry); return; }
  showGame(true);
  const { first, firstData } = entry || route();
  game.scene.start(first, firstData);
};
const resume = () => { const st = saved(); begin(st ? { first: st.scene, firstData: Object.assign({}, st.data) } : null); };
// Enter on the guide: Continue when there is a place to go back to
const primary = () => (saved() ? resume() : begin(null));
// a chapter from the title screen's list: that part, now (the same as a jump link)
const chapter = h => { location.hash = h; setTimeout(() => { if (!playing) begin(null); }, 0); };
function guide() { syncGuide(); stopPicker = initPicker(primary, chapter); }

if (go) {
  guide();
  go.addEventListener('click', () => begin(null));
  if (cont) cont.addEventListener('click', resume);
  if (optStory) optStory.addEventListener('click', () => { setStory(!state.immune); syncGuide(); });
  if (optFlash) optFlash.addEventListener('click', () => { const r = !state.settings.reduceFlash; state.set('reduceFlash', r); state.set('shake', !r); syncGuide(); });
  // a jump link starts the game at that part (clicked again, it starts that part again)
  document.querySelectorAll('.jump a').forEach(a => a.addEventListener('click', () => {
    const same = a.getAttribute('href') === location.hash;
    setTimeout(() => { if (!playing) begin(null); else if (same) jumpTo(); }, 0);
  }));
  // a new # while the show is on goes there; on the guide, BEGIN will use it
  window.addEventListener('hashchange', () => { if (playing) jumpTo(); });
} else begin(null);
