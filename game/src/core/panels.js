// How-to-play notices for things she gains: short slips from the show (ui/cg.js drawPage), at
// most three lines, keys drawn as key caps ({L}), a red stamp. Each shows once (saved), pauses the
// scene, and any key or a click closes it.
import { overlay } from './overlay.js';
import { state } from './state.js';

export const ITEMS = {
  glasses: { num: 701, title: 'Glasses', stamp: 'ISSUED', lines: ['{L} puts them on and takes them off.', 'They show what watches her.', 'They run hot, then cut out. Look quick.'] },
  cracked: { num: 702, title: 'Cracked glasses', stamp: 'DAMAGED', lines: ['{L} still works, mostly.', 'They blink more now.', 'They run hot sooner.'] },
  pebbles: { num: 703, title: 'Five pebbles', stamp: 'ISSUED', lines: ['{K} throws one. {J} picks it up.', 'Noise draws sensors and the robot.', 'If they see it land, they shoot it.'] },
  dark: { num: 704, title: 'Lights off', stamp: 'NOTED', lines: ['Cameras see only when they flash.', 'Two clicks come before each flash.', 'Hide under tables. Running is loud.'] },
  sword: { num: 705, title: 'Sword', stamp: 'APPROVED', lines: ['{K} or a {click} swings it.', 'Hit them right after they attack.', 'Their own traps work on them too.'] }
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
