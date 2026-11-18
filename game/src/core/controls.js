// Named actions, not keys. Layout (Michael, Nov 17): the left hand moves (A D, W up and doors,
// S crouch, Space jump, Shift run); the right hand acts (J use, look and talk, K throw and swing,
// L glasses, Backspace restart, Enter skip a line, P pause, M sound, I the mode, N skip ahead,
// B skip back). One key, one job
// (Nov 18): doors open with W or Up only, never J (side.js, topdown.js). Arrows still move, and
// the old E F G R keys still work, so nobody gets stuck.
// One-shot actions come from keydown events, so a tap shorter than a
// frame is never lost. Rebuild one controls object in every scene's create().
import { Sound } from './sound.js';

export function makeControls(scene) {
  const kb = scene.input.keyboard;
  const K = kb.addKeys({
    left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S',
    space: 'SPACE', z: 'Z', enter: 'ENTER', shift: 'SHIFT', e: 'E', f: 'F', j: 'J'
  }, true, true);
  const KC = Phaser.Input.Keyboard.KeyCodes, pressed = new Set();
  const onDown = ev => { Sound.ensure(); if (!ev.repeat) pressed.add(ev.keyCode); };
  kb.on('keydown', onDown);
  scene.events.once('shutdown', () => kb.off('keydown', onDown));
  const take = (...codes) => { let hit = false; codes.forEach(c => { if (pressed.has(c)) { pressed.delete(c); hit = true; } }); return hit; };
  return {
    left: () => K.left.isDown || K.a.isDown,
    right: () => K.right.isDown || K.d.isDown,
    up: () => K.up.isDown || K.w.isDown,
    down: () => K.down.isDown || K.s.isDown,
    jumpHeld: () => K.space.isDown || K.z.isDown,
    jumpPressed: () => take(KC.SPACE, KC.Z),
    leftP: () => take(KC.LEFT, KC.A),
    rightP: () => take(KC.RIGHT, KC.D),
    downP: () => take(KC.DOWN, KC.S),
    interact: () => take(KC.J, KC.E),
    advance: () => take(KC.SPACE, KC.ENTER, KC.J, KC.E),
    skip: () => take(KC.ESC),
    restart: () => take(KC.BACKSPACE, KC.R),
    look: () => false, // look switching is retired: L is the glasses (glasses() below)
    nextScreen: () => take(KC.O),
    mute: () => take(KC.M),
    enterHeld: () => K.enter.isDown,
    useHeld: () => K.j.isDown || K.e.isDown,
    run: () => K.shift.isDown,
    throwP: () => take(KC.K, KC.F),
    glasses: () => take(KC.L, KC.G),
    immune: () => take(KC.I),
    skipAhead: () => take(KC.N),
    skipBack: () => take(KC.B),
    skipLine: () => take(KC.ENTER),
    endFrame: () => pressed.clear()
  };
}
