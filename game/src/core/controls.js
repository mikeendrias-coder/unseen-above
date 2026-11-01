// Named actions, not keys. One-shot actions come from keydown events, so a tap shorter than a
// frame is never lost. Rebuild one controls object in every scene's create().
import { Sound } from './sound.js';

export function makeControls(scene) {
  const kb = scene.input.keyboard;
  const K = kb.addKeys({
    left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S',
    space: 'SPACE', z: 'Z', enter: 'ENTER', shift: 'SHIFT', e: 'E', f: 'F'
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
    jumpHeld: () => K.space.isDown || K.z.isDown || K.up.isDown || K.w.isDown,
    jumpPressed: () => take(KC.SPACE, KC.Z, KC.UP, KC.W),
    leftP: () => take(KC.LEFT, KC.A),
    rightP: () => take(KC.RIGHT, KC.D),
    downP: () => take(KC.DOWN, KC.S),
    interact: () => take(KC.E),
    advance: () => take(KC.SPACE, KC.ENTER, KC.E),
    skip: () => take(KC.ESC),
    restart: () => take(KC.R),
    look: () => take(KC.L),
    nextScreen: () => take(KC.K),
    mute: () => take(KC.M),
    enterHeld: () => K.enter.isDown,
    useHeld: () => K.e.isDown,
    run: () => K.shift.isDown,
    throwP: () => take(KC.F),
    endFrame: () => pressed.clear()
  };
}
