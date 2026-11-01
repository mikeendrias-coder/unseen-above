// Boot: size the canvas to a whole-number pixel scale, then start with the opening.
import { measure, applyCss, display } from './core/display.js';
import { Sound } from './core/sound.js';
import { overlay } from './core/overlay.js';
import { initPicker } from './ui/vibe.js';
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
// #moon, #hallway, #batch1 to #batch4, #kids
function route() {
  const params = new URLSearchParams(location.search), hash = location.hash.replace('#', '');
  if (/^batch[1-4]$/.test(hash)) { params.set('scene', 'satellite'); params.set('batch', hash.slice(5)); }
  else if (['grounds', 'gallery', 'fall', 'eastwing', 'bedroom', 'moon', 'hallway', 'kids'].includes(hash)) params.set('scene', hash);
  else if (hash === 'opening') params.set('scene', 'intro');
  const first = ['grounds', 'gallery', 'fall', 'eastwing', 'bedroom', 'moon', 'hallway', 'satellite', 'kids'].includes(params.get('scene')) ? params.get('scene') : 'intro';
  const batch = [1, 2, 3, 4].includes(Number(params.get('batch'))) ? Number(params.get('batch')) : 1;
  return { first, firstData: first === 'satellite' ? { batch, skin: Number(params.get('skin')) || batch } : {} };
}

function start() {
  measure();
  const { first, firstData } = route();
  const game = new Phaser.Game({
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
  window.addEventListener('hashchange', () => {
    const r = route();
    game.scene.getScenes(true).forEach(sc => game.scene.stop(sc.sys.settings.key));
    overlay.clearCaption(); overlay.hint('');
    game.scene.start(r.first, r.firstData);
  });
  window.__unseen = { game, display, Sound, overlay, itemPanel };
}

const go = document.getElementById('start'), tv = document.getElementById('tv');
let started = false, stopPicker = () => {};
const begin = () => { if (started) return; started = true; stopPicker(); if (tv) tv.hidden = true; if (go) go.hidden = true; Sound.ensure(); start(); };
if (go) {
  stopPicker = initPicker(begin);
  go.addEventListener('click', begin);
  // a jump link clicked before the game starts also starts it, at that part
  document.querySelectorAll('.jump a').forEach(a => a.addEventListener('click', () => setTimeout(begin, 0)));
} else begin();
