// How-to-play pages for things she gains: teletext pages on CH 07 TEXT. Each shows once
// (saved), pauses the scene, and any key or a click closes it. {X} marks a key.
import { overlay, TV } from './overlay.js';
import { state } from './state.js';

export const ITEMS = {
  glasses: { num: 701, title: 'Glasses', band: TV.cyan, lines: ['They show what the cameras see, and where a laser will fire.', '{G} puts them on and takes them off.', 'They are faulty. They blink, fill with static and run hot. Too hot, they cut out until they cool. Wear them in short looks.'] },
  cracked: { num: 702, title: 'Cracked glasses', band: TV.magenta, lines: ['They cracked in the fall. They still work, mostly.', '{G} still puts them on. They blink more and run hot sooner now.'] },
  pebbles: { num: 703, title: 'Five pebbles', band: TV.yellow, lines: ['{F} throws one ahead of her. A {click} throws one where you click.', 'Noise draws the sensors, the robot and the eyes. If something up there sees a pebble land, the satellite shoots the pebble, not her.', 'A pebble stays where it lands. {E} picks it up.'] },
  dark: { num: 704, title: 'Lights off', band: TV.red, lines: ['The cameras here only see when they flash. Each one clicks twice first.', 'Under a table, a ceiling camera cannot see her. Behind a chest, a wall camera cannot.', 'Running on old boards or glass is loud. Noise turns the cameras.'] }
};

export function itemPanel(scene, kind, force) {
  const it = ITEMS[kind];
  if (!it || window.__noPanels || (!force && state.seenPanel(kind))) return false;
  state.markPanel(kind);
  scene.scene.pause();
  overlay.panel(it, () => {
    if (scene.scene.isPaused()) scene.scene.resume();
    if (scene.ctl) scene.ctl.endFrame();
  });
  return true;
}
