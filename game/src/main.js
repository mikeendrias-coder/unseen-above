// Boot: size the canvas to a whole-number pixel scale, then start with the opening.
import { measure, applyCss, display } from './core/display.js';
import { Sound } from './core/sound.js';
import { Grounds } from './scenes/Grounds.js';
import { Intro } from './scenes/Intro.js';
import { Satellite } from './scenes/Satellite.js';

function start() {
  measure();
  const params = new URLSearchParams(location.search);
  const first = ['grounds', 'satellite'].includes(params.get('scene')) ? params.get('scene') : 'intro';
  const firstData = first === 'satellite' ? { batch: 1, skin: Number(params.get('skin')) || 1 } : {};
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
  game.scene.add('satellite', Satellite, false);
  game.events.once('ready', () => {
    applyCss(game);
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
  window.__unseen = { game, display, Sound };
}

const go = document.getElementById('start');
if (go) {
  go.addEventListener('click', () => { go.hidden = true; Sound.ensure(); start(); });
} else start();
