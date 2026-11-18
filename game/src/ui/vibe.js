// The start screen: the opening's first frame (art/title.js), with real buttons over it in the
// caption face. Arrows move between the buttons, Enter begins (or continues). Begin hands the
// same picture to the opening, which starts from it. Chapters lists every part of the show
// (core/flow.js STEPS) and starts any of them, like the jump links under the game.
import { paintTitleStill } from '../art/title.js';
import { measure, display } from '../core/display.js';
import { STEPS } from '../core/flow.js';
import { state } from '../core/state.js';
import { ENDINGS } from '../data/endings.js';

// each step's link name (main.js route())
export const SHORT = { intro: 'Opening', ep1: 'Ep 1 Grounds', batch1: 'Satellite 1', ep2: 'Ep 2 Gallery', batch2: 'Satellite 2', ep3: 'Ep 3 Fall', ep3b: 'Ep 3 East wing', batch3: 'Satellite 3', ep4: 'Ep 4 Bedroom', batch4: 'Satellite 4', kids: "Kids' room", ep5: 'Ep 5 Moon', ep5b: 'Ep 5 Backstage', ep5c: 'Ep 5 Playroom' };
export const HASH = { intro: 'opening', ep1: 'grounds', batch1: 'batch1', ep2: 'gallery', batch2: 'batch2', ep3: 'fall', ep3b: 'eastwing', batch3: 'batch3', ep4: 'bedroom', batch4: 'batch4', kids: 'kids', ep5: 'moon', ep5b: 'hallway', ep5c: 'playroom' };
// the number keys: 0 to 9 jump straight to these parts, in the show's order (main.js)
export const DIGITS = ['intro', 'ep1', 'batch1', 'ep2', 'batch2', 'ep3', 'ep4', 'kids', 'ep5', 'ep5b'];
// the endings in the list, and give-up mode (the presenter links in data/endings.js). An ending
// she has not seen reads ---- (the secret stays secret), except in presenter mode.
const END_SHORT = { vest: 'The vest', round2: 'Round two', lookback: 'Look back', couch: 'The couch', endall: 'End it all' };

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
    const add = (text, label, pick, cls) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.setAttribute('aria-label', label);
      if (cls) b.className = cls;
      if (pick) b.addEventListener('click', () => { if (onChapter) onChapter(pick); }); else b.disabled = true;
      list.appendChild(b);
    };
    STEPS.forEach(st => { const d = DIGITS.indexOf(st.id); add((d >= 0 ? d + ' ' : '') + (SHORT[st.id] || st.label), st.label + (d >= 0 ? ', key ' + d : ''), { step: st.id }, d >= 0 ? '' : 'nonum'); });
    // the third column: a heading, the endings, give-up mode, Back
    const head = document.createElement('div'); head.className = 'head'; head.textContent = 'Endings'; head.setAttribute('aria-hidden', 'true'); list.appendChild(head);
    ['vest', 'round2', 'lookback', 'couch', 'endall'].forEach(id => {
      const open = state.presenter || state.story.endings[id], e = ENDINGS.find(x => x.id === id);
      add(open ? END_SHORT[id] : '----', open ? 'Ending, ' + e.title.toLowerCase() : 'An ending not seen yet', open ? { end: id } : null, 'end');
    });
    add('Give-up mode', 'Backstage, the creator already given up', { giveup: true }, 'end');
    const back = document.createElement('button'); back.type = 'button'; back.className = 'back end'; back.textContent = 'Back';
    back.addEventListener('click', () => showList(false)); list.appendChild(back);
  }
  const onOpen = () => showList(true);
  if (open) open.addEventListener('click', onOpen);
  showList(false);
  const buttons = () => [...tv.querySelectorAll(list && !list.hidden ? '.tv-chapters button' : '.tv-menu button')].filter(b => !b.hidden && !b.disabled);
  const first = buttons()[0]; if (first) try { first.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  // the pointer picks the row it moves onto (focus), so only one row is ever drawn as picked
  const onOver = e => { const b = e.target.closest && e.target.closest('.tv-menu button, .tv-chapters button'); if (b && !b.disabled && document.activeElement !== b) b.focus({ preventScroll: true }); };
  tv.addEventListener('pointerover', onOver);
  const onKey = e => {
    if (tv.hidden) return;
    const all = buttons(), i = all.indexOf(document.activeElement), inList = list && !list.hidden;
    const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: inList ? 1 : 0, ArrowLeft: inList ? -1 : 0 }[e.key];
    if (step) { e.preventDefault(); const n = all.length, next = i < 0 ? 0 : (i + step + n) % n; all[next].focus(); }
    else if (e.key === 'Escape' && inList) { e.preventDefault(); showList(false); }
    else if (e.key === 'Enter' && i < 0) { e.preventDefault(); onBegin(); }
  };
  window.addEventListener('keydown', onKey);
  return () => { tv.removeEventListener('pointerover', onOver); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); if (open) open.removeEventListener('click', onOpen); };
}
