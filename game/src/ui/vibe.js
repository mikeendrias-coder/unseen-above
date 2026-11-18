// The start screen: the opening's first frame (art/title.js), with real buttons over it in the
// caption face. Arrows move between the buttons, Enter begins (or continues). Begin hands the
// same picture to the opening, which starts from it. Chapters lists every part of the show
// (core/flow.js STEPS) and starts any of them, like the jump links under the game.
import { paintTitleStill } from '../art/title.js';
import { measure, display } from '../core/display.js';
import { STEPS } from '../core/flow.js';

// each step's link name (main.js route())
const SHORT = { intro: 'Opening', ep1: 'Ep 1 Grounds', batch1: 'Satellite 1', ep2: 'Ep 2 Gallery', batch2: 'Satellite 2', ep3: 'Ep 3 Fall', ep3b: 'Ep 3 East wing', batch3: 'Satellite 3', ep4: 'Ep 4 Bedroom', batch4: 'Satellite 4', kids: "Kids' room", ep5: 'Ep 5 Moon', ep5b: 'Ep 5 Backstage', ep5c: 'Ep 5 Playroom' };
const HASH = { intro: 'opening', ep1: 'grounds', batch1: 'batch1', ep2: 'gallery', batch2: 'batch2', ep3: 'fall', ep3b: 'eastwing', batch3: 'batch3', ep4: 'bedroom', batch4: 'batch4', kids: 'kids', ep5: 'moon', ep5b: 'hallway', ep5c: 'playroom' };

export function initPicker(onBegin, onChapter) {
  const tv = document.getElementById('tv'), canvas = document.getElementById('tv-canvas');
  if (!tv || !canvas) return () => {};
  paintTitleStill(canvas.getContext('2d'));
  const fit = () => { measure(); tv.style.setProperty('--u', (display.cssH / 180) + 'px'); };
  fit(); window.addEventListener('resize', fit);
  const menu = tv.querySelector('.tv-menu'), list = document.getElementById('chapters'), open = document.getElementById('opt-chapters');
  // the chapter list
  const showList = on => {
    if (!list || !menu) return;
    list.hidden = !on; menu.hidden = on; if (open) open.setAttribute('aria-expanded', on ? 'true' : 'false');
    const target = on ? list.querySelector('button:not(.back)') : open; if (target) target.focus({ preventScroll: true });
  };
  if (list) {
    list.replaceChildren();
    STEPS.forEach(st => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = SHORT[st.id] || st.label; b.setAttribute('aria-label', st.label);
      b.addEventListener('click', () => { if (onChapter) onChapter('#' + HASH[st.id]); });
      list.appendChild(b);
    });
    const back = document.createElement('button'); back.type = 'button'; back.className = 'back'; back.textContent = 'Back';
    back.addEventListener('click', () => showList(false)); list.appendChild(back);
  }
  const onOpen = () => showList(true);
  if (open) open.addEventListener('click', onOpen);
  showList(false);
  const buttons = () => [...tv.querySelectorAll(list && !list.hidden ? '.tv-chapters button' : '.tv-menu button')].filter(b => !b.hidden);
  const first = buttons()[0]; if (first) try { first.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  const onKey = e => {
    if (tv.hidden) return;
    const all = buttons(), i = all.indexOf(document.activeElement), inList = list && !list.hidden;
    const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: inList ? 1 : 0, ArrowLeft: inList ? -1 : 0 }[e.key];
    if (step) { e.preventDefault(); const n = all.length, next = i < 0 ? 0 : (i + step + n) % n; all[next].focus(); }
    else if (e.key === 'Escape' && inList) { e.preventDefault(); showList(false); }
    else if (e.key === 'Enter' && i < 0) { e.preventDefault(); onBegin(); }
  };
  window.addEventListener('keydown', onKey);
  return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); if (open) open.removeEventListener('click', onOpen); };
}
