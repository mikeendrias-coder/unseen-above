// The trailer's hands on the game. Real keys and clicks never reach the game while the trailer
// runs (the viewer only has Space, Esc and F); the director plays the game with key events of its
// own, marked so the guard lets them through. Phaser reads keyCode, which a constructed
// KeyboardEvent leaves at 0, so it is set on each event.
const CODES = {
  left: [37, 'ArrowLeft', 'ArrowLeft'], right: [39, 'ArrowRight', 'ArrowRight'], up: [38, 'ArrowUp', 'ArrowUp'], down: [40, 'ArrowDown', 'ArrowDown'],
  space: [32, ' ', 'Space'], enter: [13, 'Enter', 'Enter'], shift: [16, 'Shift', 'ShiftLeft'],
  a: [65, 'a', 'KeyA'], d: [68, 'd', 'KeyD'], w: [87, 'w', 'KeyW'], s: [83, 's', 'KeyS'],
  j: [74, 'j', 'KeyJ'], k: [75, 'k', 'KeyK'], l: [76, 'l', 'KeyL'], n: [78, 'n', 'KeyN']
};
const held = new Set(), tapping = new Map();
function send(type, name) {
  const c = CODES[name]; if (!c) return;
  const ev = new KeyboardEvent(type, { key: c[1], code: c[2], bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { get: () => c[0] });
  Object.defineProperty(ev, 'which', { get: () => c[0] });
  ev.__trailer = true;
  window.dispatchEvent(ev);
}
export const keys = {
  down(name) { if (held.has(name)) return; held.add(name); send('keydown', name); },
  up(name) { if (!held.has(name)) return; held.delete(name); send('keyup', name); },
  // a tap: down now, up after ms (a jump is as high as it is held, so ms matters)
  tap(name, ms) {
    keys.up(name); keys.down(name);
    clearTimeout(tapping.get(name));
    tapping.set(name, setTimeout(() => { tapping.delete(name); keys.up(name); }, ms || 60));
  },
  // hold exactly this set (a key mid-tap stays down until its tap ends), let go of the rest
  only(...names) { [...held].forEach(n => { if (!names.includes(n) && !tapping.has(n)) keys.up(n); }); names.forEach(n => keys.down(n)); },
  clear() { tapping.forEach(h => clearTimeout(h)); tapping.clear(); [...held].forEach(n => keys.up(n)); }
};

// The guard: registered before the game's own listeners (trailer/main.js imports this before it
// loads the game), so it sees every key first. The trailer's own keys go to onKey; nothing real
// goes on to the game.
let onKey = null;
export function guardKeys(fn) { onKey = fn; }
const stop = e => { if (e.__trailer) return; e.stopImmediatePropagation(); };
window.addEventListener('keydown', e => {
  if (e.__trailer) return;
  e.stopImmediatePropagation();
  if (!e.ctrlKey && !e.metaKey && !e.altKey && onKey && onKey(e)) e.preventDefault();
}, true);
window.addEventListener('keyup', stop, true);
window.addEventListener('keypress', stop, true);
