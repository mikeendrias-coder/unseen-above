// How-to-play pages for things she gains: teletext pages on CH 07 TEXT. Each shows once
// (saved), pauses the scene, and any key or a click closes it. {X} marks a key.
import { overlay, TV } from './overlay.js';
import { state } from './state.js';

export const ITEMS = {
  glasses: { num: 701, title: 'Glasses', band: TV.cyan, lines: ['They show what the cameras see, and where a laser will fire.', '{L} puts them on and takes them off.', 'They are faulty. They blink, fill with static and run hot. Too hot, they cut out until they cool. Wear them in short looks.'] },
  cracked: { num: 702, title: 'Cracked glasses', band: TV.magenta, lines: ['They cracked in the fall. They still work, mostly.', '{L} still puts them on. They blink more and run hot sooner now.'] },
  pebbles: { num: 703, title: 'Five pebbles', band: TV.yellow, lines: ['{K} throws one ahead of her. A {click} throws one where you click.', 'Noise draws the sensors, the robot and the eyes. If something up there sees a pebble land, the satellite shoots the pebble, not her.', 'A pebble stays where it lands. {J} picks it up.'] },
  sword: { num: 705, title: 'Sword', band: TV.green, lines: ['{K} or a {click} swings it.', 'A hit only lands when the creator is open: right after they attack, or blinded by a flash. Any other time it glances off.', 'One hit from their sword ends the take.', 'Their own traps work on them too.'] },
  dark: { num: 704, title: 'Lights off', band: TV.red, lines: ['The cameras here only see when they flash. Each one clicks twice first.', 'Under a table, a ceiling camera cannot see her. Behind a chest, a wall camera cannot.', 'Running on old boards or glass is loud. Noise turns the cameras.'] }
};

export function itemPanel(scene, kind, force) {
  const it = ITEMS[kind];
  if (!it || window.__noPanels || (!force && state.seenPanel(kind))) return false;
  const show = () => {
    state.markPanel(kind);
    scene.scene.pause();
    // words in the world wait behind the page: nothing peeks out around its edges
    const words = scene.bubbles && scene.bubbles.g; if (words) words.setVisible(false);
    overlay.panel(it, () => {
      if (words) words.setVisible(true);
      if (scene.scene.isPaused()) scene.scene.resume();
      if (scene.ctl) scene.ctl.endFrame();
    });
  };
  // in the air she lands first: the page waits for her feet, so she never hangs behind it
  const k = scene.kid;
  if (k && k.onGround === false) {
    const ev = scene.time.addEvent({ delay: 16, loop: true, callback: () => {
      if (scene.dead) ev.remove(); else if (k.onGround) { ev.remove(); show(); }
    } });
  } else show();
  return true;
}
