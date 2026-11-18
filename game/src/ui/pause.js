// The pause menu, form 100 (ui/cg.js drawMenu). P or Esc opens it (in the opening and the kids' room
// Esc still skips, so P), and so does the window losing focus or the tab being hidden. Every
// scene that was running waits, the sound goes quieter (silent while the window is away), and the
// keys and the mouse belong to the menu until it closes.
// H is the presenter's freeze (Nov 18): the picture holds with nothing over it but a small mark
// top left, the sound ducks, and H again goes on. P or Esc from a freeze opens the menu.
// window.__frozen says so (the typer stops its line clock on it, as on window.__paused).
import { cg, TV } from './cg.js';
import { state } from '../core/state.js';
import { Sound } from '../core/sound.js';
import { canSkip, cycleMode, setPresenter, presenting, MODE_WORD, MODE_HELP } from '../core/review.js';
import { bright, setBright } from './bright.js';

// where she is, for the band
const PLACE = {
  intro: () => 'THE OPENING', kids: () => "THE KIDS' ROOM", room: () => 'A SIDE ROOM',
  satellite: sc => 'SATELLITE · BATCH ' + (sc.batch || 1),
  grounds: () => 'EPISODE 1', gallery: () => 'EPISODE 2', fall: () => 'EPISODE 3', eastwing: () => 'EPISODE 3',
  bedroom: () => 'EPISODE 4', moon: () => 'EPISODE 5', hallway: () => 'EPISODE 5'
};
const ESC_SKIPS = ['intro', 'kids'];
const CONTROLS = {
  num: 101, title: 'Controls', stamp: 'FILED',
  lines: [
    '{A} {D} move. {Space} jumps, twice.',
    '{S} crouches. {W} opens doors. {Shift} runs.',
    '{J} uses, looks, talks. {K} throws, swings.',
    '{L} glasses. {Enter} skips a line.',
    '{Bksp} retries. {P} pauses. {M} sound.',
    '{I} mode. {N} skips ahead. {B} back.',
    'Globe: {W} {A} {S} {D} or a drag turns it.'
  ]
};
const bars = n => '█'.repeat(n) + '·'.repeat(5 - n);
const keyOf = sc => sc.sys.settings.key;

export function initPause(game, hooks) {
  let open = false, sub = null, main = null, at = 0, rows = [], paused = [], hidden = [];
  let frozen = false, held = [];
  const el = document.getElementById('panel'), mark = document.getElementById('freeze');
  // start the scenes that were waiting again, with no key left over from the wait
  function wake(keys) {
    keys.forEach(key => {
      if (game.scene.isPaused(key)) game.scene.resume(key);
      const sc = game.scene.getScene(key);
      if (sc && sc.input && sc.input.keyboard && sc.input.keyboard.resetKeys) sc.input.keyboard.resetKeys();
      if (sc && sc.ctl) sc.ctl.endFrame();
    });
  }
  function freeze() {
    if (frozen || open || cg.pageUp || !hooks.playing()) return;
    const running = game.scene.getScenes(true); if (!running.length) return;
    frozen = true; held = running.map(keyOf);
    held.forEach(key => game.scene.pause(key));
    window.__frozen = true; if (mark) mark.hidden = false;
    Sound.duck(true);
  }
  function thaw(resume) {
    if (!frozen) return;
    frozen = false; window.__frozen = false; if (mark) mark.hidden = true;
    if (resume !== false) wake(held);
    held = [];
    Sound.hold(false); Sound.duck(false);
  }

  function where(sc) {
    const f = PLACE[keyOf(sc)], s = f ? f(sc) : '';
    return sc.ep && sc.ep.take && !['moon', 'room'].includes(keyOf(sc)) ? s + ' · TAKE ' + sc.ep.take : s;
  }
  function build() {
    const sc = main, key = keyOf(sc), R = [];
    R.push({ id: 'resume', label: 'RESUME', help: 'Back to the show. P or Esc too.' });
    if (sc.restartTake && (!sc.canRestart || sc.canRestart())) R.push({ id: 'restart', label: key === 'satellite' ? 'RESTART THIS BATCH' : 'RETRY', help: key === 'satellite' ? 'This batch from the top.' : 'Start this take again. Costs no life.' });
    if (canSkip(sc)) R.push({ id: 'skip', label: 'SKIP AHEAD', help: key === 'satellite' ? 'Solves this screen.' : 'To the next part of this stage.' });
    R.push({ id: 'story', label: 'MODE', value: MODE_WORD[state.mode], adjust: true, help: MODE_HELP[state.mode] });
    R.push({ id: 'music', label: 'MUSIC', value: bars(state.settings.music), adjust: true, help: 'Left and right set the level.' });
    R.push({ id: 'sfx', label: 'EFFECTS', value: bars(state.settings.sfx), adjust: true, help: 'Left and right set the level.' });
    R.push({ id: 'flash', label: 'FLASHING', value: state.settings.reduceFlash ? 'REDUCED' : 'FULL', adjust: true, help: 'Reduced: dim, slow, fewer flashes.' });
    R.push({ id: 'shake', label: 'SCREEN SHAKE', value: state.settings.shake ? 'ON' : 'OFF', adjust: true, help: 'Off: the picture holds still.' });
    R.push({ id: 'controls', label: 'CONTROLS', help: 'Every key on one notice.' });
    R.push({ id: 'presenter', label: 'PRESENTER', value: presenting() ? 'ON' : 'OFF', adjust: true, help: 'For a class: immune, N skips, calm.' });
    R.push({ id: 'bright', label: 'BRIGHT', value: bright() ? 'ON' : 'OFF', adjust: true, help: 'Lifts dark scenes for a projector.' });
    if (cg.canBigCaptions) R.push({ id: 'caps', label: 'BIG CAPTIONS', value: state.settings.bigCaptions ? 'ON' : 'OFF', adjust: true, help: 'Captions at double height.' });
    R.push({ id: 'guide', label: 'TITLE SCREEN', help: 'Back to the start. Your place is kept.' });
    return R;
  }
  // draw it, and say it for screen readers (and tests)
  function show() {
    const keep = rows[at] && rows[at].id;
    rows = build();
    at = Math.max(0, rows.findIndex(r => r.id === keep));
    cg.menu({ rows, at, where: where(main) });
    if (el) {
      el.querySelector('.panel-kicker').textContent = 'Form 100';
      el.querySelector('.panel-title').textContent = 'Paused';
      el.querySelector('.panel-body').replaceChildren(...rows.map((r, i) => { const p = document.createElement('p'); p.textContent = (i === at ? '> ' : '') + r.label.toLowerCase() + (r.value != null ? ': ' + r.value.replace(/█/g, '#').replace(/·/g, '-').toLowerCase() : ''); return p; }));
      el.classList.add('on');
    }
    window.__paused = true;
  }

  function openMenu(away) {
    if (open || !hooks.playing()) return;
    const running = game.scene.getScenes(true);
    if (!running.length) return;
    open = true; sub = null; at = 0; rows = [];
    main = running[running.length - 1];
    paused = running.map(keyOf);
    running.forEach(sc => {
      game.scene.pause(keyOf(sc));
      const b = sc.bubbles && sc.bubbles.g; if (b && b.visible) { b.setVisible(false); hidden.push(b); }
    });
    show();
    Sound.duck(true);
    if (away) Sound.hold(true); else Sound.tone(660, 0.06, 'triangle', 0.02);
  }
  // resume: false when the show is not coming back (the channel guide)
  function closeMenu(resume) {
    if (!open) return;
    open = false; sub = null; window.__paused = false;
    cg.closeMenu(); cg.closePage();
    if (el) el.classList.remove('on');
    hidden.forEach(b => b.setVisible(true)); hidden = [];
    if (resume !== false) {
      wake(paused);
      Sound.tone(520, 0.06, 'triangle', 0.02);
    }
    paused = [];
    Sound.hold(false); Sound.duck(false);
  }
  function setVol(which, d, wrap) {
    let n = state.settings[which] + d;
    n = wrap ? (n + 6) % 6 : Math.max(0, Math.min(5, n));
    state.set(which, n); Sound.volume(which, n);
    if (which === 'sfx') Sound.tone(880, 0.07, 'triangle', 0.03);
  }
  // change a row's value (d: -1 or 1); wrap when it comes from a single click or Enter
  function adjust(d, wrap) {
    const r = rows[at]; if (!r || !r.adjust) return false;
    if (r.id === 'story') cycleMode(d);
    else if (r.id === 'music' || r.id === 'sfx') setVol(r.id, d, wrap);
    else if (r.id === 'flash') state.set('reduceFlash', !state.settings.reduceFlash);
    else if (r.id === 'shake') state.set('shake', !state.settings.shake);
    else if (r.id === 'presenter') setPresenter(!presenting());
    else if (r.id === 'bright') setBright(!bright());
    else if (r.id === 'caps') { state.set('bigCaptions', !state.settings.bigCaptions); window.dispatchEvent(new Event('resize')); } // the strip's height (core/display.js) may change
    if (r.id !== 'sfx') Sound.tone(r.id === 'music' ? 600 : 740, 0.05, 'triangle', 0.02);
    show(); return true;
  }
  function use() {
    const r = rows[at]; if (!r) return;
    if (r.adjust) { adjust(1, true); return; }
    const sc = main;
    if (r.id === 'resume') closeMenu();
    else if (r.id === 'restart') { closeMenu(); sc.restartTake(); }
    else if (r.id === 'skip') { closeMenu(); sc.skipAhead(); }
    else if (r.id === 'controls') {
      sub = 'controls'; cg.page(Object.assign({}, CONTROLS)); Sound.tone(700, 0.05, 'triangle', 0.02);
      if (el) { el.querySelector('.panel-kicker').textContent = 'Notice 101'; el.querySelector('.panel-title').textContent = 'Controls'; el.querySelector('.panel-body').replaceChildren(...CONTROLS.lines.map(l => { const p = document.createElement('p'); p.textContent = l.replace(/[{}]/g, ''); return p; })); }
    }
    else if (r.id === 'guide') { closeMenu(false); hooks.guide(); }
  }
  function move(d) { if (!rows.length) return; at = (at + d + rows.length) % rows.length; Sound.tone(500, 0.03, 'square', 0.008); show(); }

  window.addEventListener('keydown', ev => {
    if (!hooks.playing()) return;
    const k = ev.key;
    if (frozen) {
      // held: H goes on, P or Esc opens the menu, M mutes (the scenes that read it are held), the
      // number keys and U (main.js) still work; every other key waits, so nothing happens behind
      // the held picture
      if (ev.ctrlKey || ev.metaKey || ev.altKey || /^F\d+$/.test(k) || /^[0-9uU]$/.test(k)) return;
      ev.preventDefault(); ev.stopPropagation();
      if (ev.repeat) return;
      if (k === 'h' || k === 'H') thaw();
      else if (k === 'p' || k === 'P' || k === 'Escape') { thaw(); openMenu(false); }
      else if (k === 'm' || k === 'M') { Sound.ensure(); Sound.toggle(); }
      return;
    }
    if (!open) {
      if (ev.repeat || cg.pageUp) return; // a how-to page takes its own keys
      if ((k === 'h' || k === 'H') && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); ev.stopPropagation(); freeze(); return; }
      const top = game.scene.getScenes(true).pop();
      const esc = k === 'Escape' && !(top && ESC_SKIPS.includes(keyOf(top)));
      if (k === 'p' || k === 'P' || esc) { ev.preventDefault(); ev.stopPropagation(); openMenu(false); }
      return;
    }
    // the menu is up: every key is the menu's (the browser keeps its own shortcuts)
    if (ev.ctrlKey || ev.metaKey || ev.altKey || /^F\d+$/.test(k)) return;
    ev.preventDefault(); ev.stopPropagation();
    if (sub === 'controls') { if (!ev.repeat) { sub = null; cg.closePage(); show(); } return; }
    if (k === 'p' || k === 'P' || k === 'Escape') { if (!ev.repeat) closeMenu(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') move(-1);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') move(1);
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') adjust(-1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') adjust(1);
    else if ((k === 'Enter' || k === ' ' || k === 'e' || k === 'E') && !ev.repeat) use();
  }, true);

  // the mouse: a row under the pointer is picked; a click uses it
  const grid = ev => { const c = document.getElementById('cg'), r = c && c.getBoundingClientRect(); return r && r.width ? { x: (ev.clientX - r.left) / r.width * 320, y: (ev.clientY - r.top) / r.height * 210 } : null; };
  window.addEventListener('pointerdown', ev => {
    if (!open) return;
    const foot = document.getElementById('chrome-bottom'); if (foot && foot.contains(ev.target)) return; // the keys under the game still work
    ev.preventDefault(); ev.stopPropagation();
    if (sub === 'controls') { sub = null; cg.closePage(); show(); return; }
    const g = grid(ev), i = g ? cg.menuHit(g.x, g.y) : -1;
    if (i >= 0) { at = i; use(); }
  }, true);
  window.addEventListener('pointermove', ev => {
    if (!open || sub) return;
    const g = grid(ev), i = g ? cg.menuHit(g.x, g.y) : -1;
    if (i >= 0 && i !== at) { at = i; show(); }
  });

  // away: the window lost focus or the tab is hidden. Not under test automation, unless asked.
  const auto = () => !window.__noPanels && !window.__noAutoPause && (!navigator.webdriver || window.__autoPause);
  const away = () => {
    if (!hooks.playing() || !auto()) return;
    if (open || frozen || cg.pageUp) Sound.hold(true); else openMenu(true);
  };
  const back = () => { if (Sound.held) Sound.hold(false); };
  window.addEventListener('blur', away);
  window.addEventListener('focus', back);
  document.addEventListener('visibilitychange', () => { if (document.hidden) away(); else back(); });

  return {
    get isOpen() { return open; },
    get frozen() { return frozen; },
    show: () => openMenu(false),
    close: () => closeMenu(),
    freeze: () => (frozen ? thaw() : freeze()),
    drop: () => { thaw(false); closeMenu(false); }, // the show is not coming back here (a jump link, the guide)
    away
  };
}
