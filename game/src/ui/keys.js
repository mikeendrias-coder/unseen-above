// The keys under the game (Michael, Nov 17): every control drawn as a key cap with what it does
// in small type under it, in two rows (Nov 18: they wrap inside the window and sit right under the
// caption strip): what she does, then the show's own controls. Clicking one does what the key does: it sends the game the same key
// the keyboard would (held while the pointer is down, for moving, jumping, crouching and
// running). I is the mode: it cycles NORMAL, ENDLESS, IMMUNE and says which under it in capitals
// (ENDLESS with an infinity sign; latched down unless NORMAL). Switches (sound, flashing, glasses) latch down while on and stay in step
// when changed from the keyboard or the menus. CH opens the chapter row (the jump links).
// Presenter tools (Nov 18): Pres is presenter mode, H holds the picture (ui/pause.js), U is full
// screen (main.js). On a satellite screen W A S D say "turn": they turn the globe. On its request
// form W and S say "check", and the keys that do nothing there are blank and grey. In the
// top-down east wing W A S D walk up, down, left and right (W says door at a door) and Space greys out. In the fight K
// says "swing".
import { state } from '../core/state.js';
import { Sound } from '../core/sound.js';
import { stepMode, canSkip, setPresenter, presenting, MODE_WORD } from '../core/review.js';
import { overlay } from '../core/overlay.js';

const KEYS = [
  { cap: 'A', key: 'a', code: 'KeyA', kc: 65, label: 'left', hold: true, dyn: 'a' },
  { cap: 'D', key: 'd', code: 'KeyD', kc: 68, label: 'right', hold: true, dyn: 'd' },
  { cap: 'Space', key: ' ', code: 'Space', kc: 32, label: 'jump', hold: true, dyn: 'space' },
  { cap: 'S', key: 's', code: 'KeyS', kc: 83, label: 'crouch', hold: true, dyn: 's' },
  { cap: 'W', key: 'w', code: 'KeyW', kc: 87, label: 'door', dyn: 'w' },
  { cap: 'Shift', key: 'Shift', code: 'ShiftLeft', kc: 16, label: 'run', hold: true, dyn: 'shift' },
  { cap: 'J', key: 'j', code: 'KeyJ', kc: 74, label: 'use', dyn: 'j' },
  { cap: 'K', key: 'k', code: 'KeyK', kc: 75, label: 'throw', dyn: 'k' },
  { cap: 'L', key: 'l', code: 'KeyL', kc: 76, label: 'glasses', sw: 'glasses', dyn: 'l' },
  { cap: 'Enter', key: 'Enter', code: 'Enter', kc: 13, label: 'skip line' },
  { cap: 'Bksp', key: 'Backspace', code: 'Backspace', kc: 8, label: 'retry', row: 0 },
  { cap: 'Esc', key: 'Escape', code: 'Escape', kc: 27, label: 'menu', dyn: 'esc' },
  { cap: 'P', key: 'p', code: 'KeyP', kc: 80, label: 'pause' },
  { cap: 'M', label: 'sound', sw: 'sound' },
  { cap: 'I', label: 'mode', sw: 'immune' },
  { cap: 'N', key: 'n', code: 'KeyN', kc: 78, label: 'skip ahead', dyn: 'skip' },
  { cap: 'Flash', label: 'flashing', sw: 'flash' },
  { cap: 'CH', label: 'chapters', sw: 'chapters' },
  { cap: 'Pres', label: 'presenter', sw: 'presenter' },
  { cap: 'H', key: 'h', code: 'KeyH', kc: 72, label: 'hold', sw: 'hold', send: true },
  { cap: 'U', key: 'u', code: 'KeyU', kc: 85, label: 'full screen', sw: 'full', send: true }
];

// a key event the game cannot tell from a real one (Phaser reads keyCode)
function send(type, k) {
  const ev = new KeyboardEvent(type, { key: k.key, code: k.code, bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { get: () => k.kc }); Object.defineProperty(ev, 'which', { get: () => k.kc });
  window.dispatchEvent(ev);
}
const scene = () => window.__game && window.__game.scene;
// Keys whose job depends on where she is: [label, usable now]. Esc skips the opening and the
// kids' room and opens the menu everywhere else. N only skips in ENDLESS or IMMUNE, or when the
// scene offers it (stuck, or a screen that allows it); otherwise its cap greys out.
const playing = () => { const st = document.getElementById('stage'); return !!(st && st.classList.contains('playing')); };
const sat = () => { const sc = scene(); return playing() && sc && sc.sys && sc.sys.settings.key === 'satellite' ? sc : null; };
const ring = () => { const sc = sat(); return !!(sc && sc.level && sc.level.id === 'ring'); };
// while a satellite request form is up, J K L stamp and ask
const form = () => { const sc = sat(); return !!(sc && sc.form); };
// the form is stamped: J goes on (W S and L do nothing now)
const stamped = () => { const sc = sat(); return !!(sc && sc.form && sc.form.stamp); };
// the top-down east wing: W A S D walk her up, down, left and right; nothing to jump
const top = () => { const sc = scene(); return !!(playing() && sc && sc.sys && !sat() && typeof sc.kidPx === 'function'); };
// the fight backstage, once she holds the sword: K swings it
const sword = () => { const sc = scene(); return !!(playing() && sc && sc.sys && sc.sys.settings.key === 'hallway' && sc.sword && sc.sword.have); };
// on the form W and S check a field; A D and Space do nothing, and J K do nothing on a puzzle
const DYN = {
  j: () => form() ? [stamped() ? 'go on' : 'approve', true] : sat() ? ['', false] : ['use', true],
  k: () => form() ? ['deny', !stamped()] : sat() ? ['', false] : [sword() ? 'swing' : 'throw', true],
  l: () => (form() ? ['ask who', !stamped()] : null), // otherwise the glasses switch speaks for L
  a: () => form() ? ['', false] : [sat() ? 'turn' : 'left', true],
  d: () => form() ? ['', false] : [sat() ? 'turn' : 'right', true],
  w: () => form() ? ['check', !stamped()] : [sat() ? 'turn' : top() ? (scene().atDoor ? 'door' : 'up') : 'door', !ring()],
  s: () => form() ? ['check', !stamped()] : [sat() ? 'turn' : top() ? 'down' : 'crouch', !ring()],
  space: () => sat() || top() ? ['', false] : ['jump', true],
  shift: () => sat() ? ['', false] : ['run', true],
  esc: () => { const sc = scene(), k = sc && sc.sys && sc.sys.settings.key; return [playing() && (k === 'intro' || k === 'kids') ? 'skip scene' : 'menu', true]; },
  skip: () => { const sc = scene(); let on = false; try { on = playing() && !!sc && canSkip(sc); } catch (e) { /* not a scene yet */ } return ['skip ahead', on]; }
};
// others (the title screen) listen for changes made here
const listeners = [];
export function onKeysChange(fn) { listeners.push(fn); }
const glasses = () => { const sc = scene(), g = sc && sc.gl; return g && g.has ? g : null; };

// what each switch shows: [pressed, word under it]
const SWITCH = {
  immune: () => [state.mode !== 'normal', MODE_WORD[state.mode]], // ENDLESS gets an infinity sign after it (.inf)
  sound: () => [!Sound.muted, Sound.muted ? 'sound off' : 'sound on'],
  flash: () => [!!state.settings.reduceFlash, state.settings.reduceFlash ? 'flash reduced' : 'flash full'],
  glasses: () => { const g = glasses(); return [!!(g && g.on), g ? (g.on ? 'glasses on' : 'glasses') : 'glasses'] },
  chapters: () => { const n = document.getElementById('jump'); return [!!(n && !n.hidden), 'chapters']; },
  presenter: () => [presenting(), presenting() ? 'presenter on' : 'presenter'],
  hold: () => [!!window.__frozen, window.__frozen ? 'held' : 'hold'],
  full: () => { const on = !!(document.fullscreenElement || document.webkitFullscreenElement); return [on, on ? 'full on' : 'full screen']; }
};

export function initKeys() {
  const bar = document.getElementById('keybar'); if (!bar) return;
  const els = [];
  // two rows: up to Bksp is what she does, the rest is the show's controls
  const rows = [0, 1].map(() => { const r = document.createElement('div'); r.className = 'keyrow'; bar.appendChild(r); return r; });
  let rowI = 0;
  KEYS.forEach(k => {
    const row = rows[rowI]; if (k.row === 0) rowI = 1;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'key' + (k.cap.length > 1 ? ' wide' : '') + (k.sw ? ' switch' : '');
    const cap = document.createElement('span'); cap.className = 'cap'; cap.textContent = k.cap;
    const lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.textContent = k.label;
    b.append(cap, lbl);
    b.setAttribute('aria-label', (k.sw ? k.label : k.label + ', key ' + k.cap));
    if (k.sw) b.setAttribute('aria-pressed', 'false');
    if (k.sw === 'chapters') b.setAttribute('aria-controls', 'jump');
    // the pointer never takes focus from the game, so Space and Enter stay the game's
    b.addEventListener('mousedown', ev => ev.preventDefault());
    let down = false;
    const release = () => { if (!down) return; down = false; b.classList.remove('down'); if (k.hold) send('keyup', k); };
    b.addEventListener('pointerdown', ev => {
      if (ev.button !== 0) return;
      ev.preventDefault(); down = true; b.classList.add('down');
      try { b.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      act(k, true);
    });
    b.addEventListener('pointerup', release); b.addEventListener('pointercancel', release); b.addEventListener('lostpointercapture', release);
    // from the keyboard (Tab to it, then Enter or Space): a tap
    b.addEventListener('click', ev => { if (ev.detail === 0) { act(k, true); if (k.hold) setTimeout(() => send('keyup', k), 120); } });
    row.appendChild(b); els.push({ k, b, lbl });
  });
  function act(k) {
    if (k.sw === 'immune') stepMode(1);
    else if (k.sw === 'sound') { Sound.ensure(); overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000); }
    else if (k.sw === 'flash') { const r = !state.settings.reduceFlash; state.set('reduceFlash', r); state.set('shake', !r); overlay.note(r ? 'Flashing reduced' : 'Flashing full', 1400); }
    else if (k.sw === 'chapters') { const n = document.getElementById('jump'); if (n) { n.hidden = !n.hidden; window.dispatchEvent(new Event('resize')); } }
    else if (k.sw === 'presenter') { setPresenter(!presenting()); overlay.note(presenting() ? 'Presenter on' : 'Presenter off', 1600); }
    else if (k.send) { send('keydown', k); setTimeout(() => send('keyup', k), 90); }
    else { send('keydown', k); if (!k.hold) setTimeout(() => send('keyup', k), 90); }
    sync();
    if (k.sw) listeners.forEach(fn => fn(k.sw));
  }
  function sync() {
    els.forEach(({ k, b, lbl }) => {
      if (!k.sw) return;
      const [on, word] = SWITCH[k.sw]();
      if (b.getAttribute('aria-pressed') !== String(on)) b.setAttribute('aria-pressed', String(on));
      if (lbl.textContent !== word) {
        lbl.textContent = word;
        if (k.sw === 'immune') { lbl.classList.toggle('inf', state.mode === 'endless'); b.setAttribute('aria-label', 'mode ' + word + (state.mode === 'endless' ? ', lives never run out' : state.mode === 'immune' ? ', she regenerates' : '') + ', key I cycles it'); }
      }
      if (k.sw === 'glasses') b.classList.toggle('off', !glasses());
    });
    els.forEach(({ k, b, lbl }) => {
      if (!k.dyn) return;
      const r = DYN[k.dyn](); if (!r) return;
      const [word, on] = r;
      if (lbl.textContent !== word) { lbl.textContent = word; b.setAttribute('aria-label', word ? word + ', key ' + k.cap : 'key ' + k.cap + ', not used here'); }
      b.classList.toggle('off', !on);
    });
  }
  sync();
  setInterval(sync, 250); // the keyboard and the menus change these too
  window.__keys = { sync };
}
