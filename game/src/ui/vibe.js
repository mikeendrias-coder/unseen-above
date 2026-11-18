// The start screen: the opening's first frame (art/title.js), with real buttons over it in the
// caption face. Arrows move between the buttons, Enter begins (or continues). Begin hands the
// same picture to the opening, which starts from it.
import { paintTitleStill } from '../art/title.js';
import { measure, display } from '../core/display.js';

export function initPicker(onBegin) {
  const tv = document.getElementById('tv'), canvas = document.getElementById('tv-canvas');
  if (!tv || !canvas) return () => {};
  paintTitleStill(canvas.getContext('2d'));
  // the picture at the game's own whole-number pixel size
  const fit = () => { measure(); tv.style.setProperty('--u', (display.cssH / 180) + 'px'); };
  fit(); window.addEventListener('resize', fit);
  const buttons = () => [...tv.querySelectorAll('.tv-menu button')].filter(b => !b.hidden);
  const first = buttons()[0]; if (first) try { first.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  const onKey = e => {
    if (tv.hidden) return;
    const list = buttons(), i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); const n = list.length, next = i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; list[next].focus();
    } else if (e.key === 'Enter' && i < 0) { e.preventDefault(); onBegin(); }
  };
  window.addEventListener('keydown', onKey);
  return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); };
}
