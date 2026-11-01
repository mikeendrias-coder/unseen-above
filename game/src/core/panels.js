// Instruction panels for things she gains. Each shows once (saved), pauses the scene, and any
// key or a click closes it.
import { overlay } from './overlay.js';
import { state } from './state.js';
import { flat } from '../art/painter.js';

export const ITEMS = {
  glasses: { kicker: 'NEW · GLASSES', title: 'Glasses', lines: ['They show what the cameras see, and where a laser will fire.', 'G puts them on and takes them off.', 'They are faulty. On, they blink and fill with static, and they heat up. Too hot and they cut out until they cool. Wear them in short looks.'] },
  cracked: { kicker: 'THE FALL', title: 'Cracked glasses', lines: ['They cracked when she landed. They still work, mostly.', 'G still puts them on and takes them off. They blink more and overheat sooner now.'] },
  pebbles: { kicker: 'NEW · PEBBLES', title: 'Five pebbles', lines: ['F throws one ahead of her. A click throws one where you click.', 'Noise draws the sensors, the robot and the eyes. If something up there sees a pebble, the satellite shoots the pebble instead of her.', 'A thrown pebble stays where it lands. E picks it up again.'] },
  dark: { kicker: 'EPISODE 4', title: 'Lights off', lines: ['The cameras here only see when they flash. Each one clicks twice first.', 'Under a table, a ceiling camera cannot see her. Behind a chest, a wall camera cannot.', 'Running on old boards or glass is loud, and noise turns the cameras.'] }
};

export function itemPanel(scene, kind, force) {
  const it = ITEMS[kind];
  if (!it || window.__noPanels || (!force && state.seenPanel(kind))) return false;
  state.markPanel(kind);
  scene.scene.pause();
  overlay.panel(it.kicker, it.title, it.lines, flat(scene.P ? scene.P.overlay : '#6fe3ff'), () => {
    if (scene.scene.isPaused()) scene.scene.resume();
    if (scene.ctl) scene.ctl.endFrame();
  });
  return true;
}
