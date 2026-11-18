// Hidden books (Nov 18, Michael's idea: "you have to go the opposite direction, and there is a
// book lying on the ground; you click it and you can read"). One per episode, each a Part of the
// paper: ep1 the grounds Part I, ep2 the gallery Part II, ep3 the east wing Part III, ep4 the
// bedroom Part IV, ep5 the Moon city Part V. Each lies behind where she starts (walk the other way
// from the route), a small pixel book on the floor with a faint two-frame glint so it can be found.
// J on it, or a click on it, opens an EXHIBIT slip (ui/cg.js drawExhibit): the Part's title and its
// first paragraph (taken from paper/paper.md at build time: paper/parts.js), READ PART n (opens
// paper.html#part-n, the published paper beside the game, in a new tab) and CLOSE. The slip pauses
// the scene as the how-to notices do; its one how-to line shows on the first book only.
// Found books are kept in state.story: shelf (which) and books (how many); the ending screen shows
// BOOKS n/5 (ending/finale.js).
import { overlay } from './overlay.js';
import { state } from './state.js';
import { Sound } from './sound.js';
import { cg } from '../ui/cg.js';
import { ASH } from '../art/palettes.js';
import { paperUrl, openPaper } from './paper.js';

/* global __PAPER_PARTS__ */
// the Parts, put in the bundle by build.js (paper/parts.js); a build without them still runs
let FROM_PAPER = null;
try { FROM_PAPER = __PAPER_PARTS__; } catch (e) { FROM_PAPER = null; }
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
export const PARTS = {};
for (let n = 1; n <= 5; n++) PARTS[n] = (FROM_PAPER && FROM_PAPER[n]) || { n, roman: ROMAN[n - 1], title: 'Part ' + ROMAN[n - 1], text: 'Part ' + ROMAN[n - 1] + ' text goes here.', placeholder: true };
export const BOOK_COUNT = 5;
// what she says after reading each book for the first time (one per Part of the paper)
const SAYS = {
  1: 'Somebody wrote this all down. About satellites.',
  2: 'One country gets a blur. We get nothing.',
  3: 'Nobody signs. They just ask nicely, and it happens.',
  4: 'So nobody is looking out for people like us.',
  5: 'They were supposed to watch the watchers.'
};
export { paperUrl, openPaper };

// ------------------------------------------------------------------ the book, in pixels
// '.' nothing, '0' ash0 (the 1 px outline), '4' ash4, '5' ash5, 'b' bone, 'l' boneLo
const COL = { 0: ASH.ash0, 4: ASH.ash4, 5: ASH.ash5, b: ASH.bone, l: ASH.boneLo };
// side view: lying flat on the floor, 11 x 5, the glint up and to the right of it
const SIDE = [
  '............',
  '............',
  '............',
  '00000000000.',
  '05555555550.',
  '0blblblbl40.',
  '0bbbbbbbb40.',
  '00000000000.'
];
const SIDE_GLINT = [
  '..........b.',
  '.........bbb',
  '..........b.'
];
// from above (the east wing): 8 x 10, spine on the left, page edges right and bottom
const TOP = [
  '..........',
  '..........',
  '00000000..',
  '045555b0..',
  '045555b0..',
  '04llllb0..',
  '045555b0..',
  '045555b0..',
  '045555b0..',
  '045555b0..',
  '04bbbbl0..',
  '00000000..'
];
const TOP_GLINT = [
  '........b.',
  '.......bbb',
  '........b.'
];
function paint(scene, key, rows, w) {
  if (scene.textures.exists(key)) return;
  const h = rows.length, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = COL[r[i]]; if (c) { x.fillStyle = c; x.fillRect(i, j, 1, 1); } } });
  scene.textures.addCanvas(key, cv);
}
function makeTextures(scene) {
  paint(scene, 'book_side', SIDE, 12);
  paint(scene, 'book_side_glint', SIDE_GLINT.concat(Array(SIDE.length - SIDE_GLINT.length).fill('')), 12);
  paint(scene, 'book_top', TOP, 10);
  paint(scene, 'book_top_glint', TOP_GLINT.concat(Array(TOP.length - TOP_GLINT.length).fill('')), 10);
}

// ------------------------------------------------------------------ in a scene
// Side view: at { x (the book's middle), y (the floor under it) }. Top-down: at { tx, ty }.
// opts: reach (side view: how far either side of its middle J finds it), depth (the book), glintDepth (the glint: over a dark layer, so it shows in the dark)
export function addBook(scene, n, at, opts) {
  opts = opts || {};
  makeTextures(scene);
  const top = at.tx != null, T = 16;
  const key = top ? 'book_top' : 'book_side';
  const x = top ? at.tx * T + 8 : Math.round(at.x), y = top ? at.ty * T + 14 : Math.round(at.y);
  const img = scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(opts.depth != null ? opts.depth : 1.8);
  const glint = scene.add.image(x, y, key + '_glint').setOrigin(0.5, 1).setDepth(opts.glintDepth != null ? opts.glintDepth : img.depth + 0.01).setVisible(false);
  const book = { n, img, glint, at };
  // the glint: two frames, off most of the time, a short wink every 1.8 s (the scene's own time,
  // so it waits while the scene waits)
  // (in a dark scene the glint sits over the dark, glintDepth; her own light shows the book)
  scene.time.addEvent({ delay: 60, loop: true, callback: () => { const u = (scene.time.now / 1000) % 1.8; glint.setVisible(u < 0.24); } });
  const open = () => openBook(scene, n);
  // J on it: a thing to use, so it wins over a look beside it
  book.thing = top ? { tx: at.tx, ty: at.ty, label: 'J', book: n, use: open }
    : { x0: x - (opts.reach || 7), x1: x + (opts.reach || 7), y0: y - 18, y1: y + 2, px: x, py: y - 8, label: 'J', book: n, use: open };
  scene.things.push(book.thing);
  // a click on it opens it too (and nothing else hears that click: no pebble thrown at it)
  img.setInteractive(new Phaser.Geom.Rectangle(-4, -6, img.width + 8, img.height + 10), Phaser.Geom.Rectangle.Contains);
  img.on('pointerdown', (p, lx, ly, ev) => {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (scene.dead || scene.leaving || scene.done) return;
    open();
  });
  scene.books = (scene.books || []).concat(book);
  return book;
}
export const found = n => !!(state.story.shelf && state.story.shelf[n]);
export const booksFound = () => Number(state.story.books) || 0;
function markFound(n) {
  const shelf = Object.assign({}, state.story.shelf || {});
  const fresh = !shelf[n]; shelf[n] = true;
  state.storySet('shelf', shelf);
  state.storySet('books', Object.keys(shelf).length);
  return fresh;
}

// ------------------------------------------------------------------ the slip
let up = null;
export const bookUp = () => !!up;
export function openBook(scene, n) {
  if (up || cg.pageUp || window.__paused || window.__frozen || window.__tvUp) return false;
  const part = PARTS[n]; if (!part) return false;
  const k = scene.kid;
  // in the air she lands first, as for the how-to notices
  if (k && k.onGround === false) {
    const ev = scene.time.addEvent({ delay: 16, loop: true, callback: () => { if (scene.dead) ev.remove(); else if (k.onGround) { ev.remove(); openBook(scene, n); } } });
    return true;
  }
  const fresh = markFound(n);
  // the how-to line, on the first book ever (kept in the story, so a new run or a jump never repeats it)
  const howto = !state.story.bookHowto; if (howto) state.storySet('bookHowto', true);
  scene.scene.pause();
  const words = scene.bubbles && scene.bubbles.g; if (words) words.setVisible(false);
  Sound.stamp(0.6);
  const spec = { kind: 'exhibit', n, roman: part.roman, title: part.title, text: part.text, placeholder: !!part.placeholder, howto, stamp: 'ENTERED', of: BOOK_COUNT, pick: 0 };
  cg.page(spec);
  const sp = () => cg.pageSpec || spec; // cg keeps its own copy: the pick is set on that
  // the same words for screen readers (and tests)
  const p = document.getElementById('panel');
  if (p) {
    p.querySelector('.panel-kicker').textContent = 'Exhibit, Part ' + part.roman;
    p.querySelector('.panel-title').textContent = part.title;
    const body = [part.text]; if (howto) body.push('One book hides in every episode.');
    p.querySelector('.panel-body').replaceChildren(...body.map(t => { const d = document.createElement('p'); d.textContent = t; return d; }));
    p.querySelector('.panel-key').textContent = 'R reads Part ' + part.roman + ' in a new tab. J or Esc closes.';
    p.classList.add('on');
  }
  const t0 = performance.now();
  let done = false;
  const close = read => {
    if (done) return;
    done = true; up = null; window.__book = null;
    if (read) openPaper(n);
    cg.closePage(); if (p) { p.classList.remove('on'); p.querySelector('.panel-key').textContent = 'Any key or a click to go on'; }
    window.removeEventListener('keydown', onKey, true); window.removeEventListener('pointerdown', onDown, true); window.removeEventListener('pointermove', onMove, true);
    if (overlay.closePanel === closeIt) overlay.closePanel = null;
    Sound.tone(read ? 880 : 520, 0.06, 'square', 0.015);
    setTimeout(() => {
      if (words) words.setVisible(true);
      // the pause menu (the window lost focus to the paper's tab) keeps the scene waiting
      if (scene.scene.isPaused() && !window.__paused && !window.__frozen) scene.scene.resume();
      if (scene.ctl) scene.ctl.endFrame();
      if (scene.input && scene.input.keyboard && scene.input.keyboard.resetKeys) scene.input.keyboard.resetKeys();
      if (fresh) overlay.note('BOOKS ' + booksFound() + '/' + BOOK_COUNT, 1800);
      // the first time she reads each one, she says something about it (Michael, Nov 18)
      if (fresh && SAYS[n]) overlay.caption('SISTER', SAYS[n], { ms: 3600 });
    }, 0);
  };
  const closeIt = () => close(false);
  const ready = () => performance.now() - t0 > 350; // the press that opened it never closes it
  const press = i => close(i === 0);
  const onKey = ev => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || /^F\d+$/.test(ev.key)) return;
    if (/^[0-9uU]$/.test(ev.key)) return; // main.js: a jump, or full screen
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (ev.repeat || !ready()) return;
    const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (key === 'r') press(0);
    else if (key === 'j' || key === 'Escape' || key === 'x' || key === 'Backspace') press(1);
    else if (key === 'ArrowLeft' || key === 'a' || key === 'ArrowUp' || key === 'w') { sp().pick = 0; }
    else if (key === 'ArrowRight' || key === 'd' || key === 'ArrowDown' || key === 's' || key === 'Tab') { sp().pick = key === 'Tab' ? 1 - (sp().pick || 0) : 1; }
    else if (key === 'Enter' || key === ' ' || key === 'e') press(sp().pick || 0);
  };
  const grid = ev => { const c = document.getElementById('cg'), r = c && c.getBoundingClientRect(); return r && r.width ? { x: (ev.clientX - r.left) / r.width * 320, y: (ev.clientY - r.top) / r.height * c.height } : null; };
  const onDown = ev => {
    const foot = document.getElementById('chrome-bottom'); if (foot && foot.contains(ev.target)) return; // the keys under the game still work
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (!ready()) return;
    const g = grid(ev), hit = g ? cg.pageHit(g.x, g.y) : null;
    if (hit === 'read') press(0);
    else if (hit === 'close' || hit === null) press(1); // a click off the slip puts it away
  };
  const onMove = ev => { const g = grid(ev), hit = g ? cg.pageHit(g.x, g.y) : null; if (hit === 'read') sp().pick = 0; else if (hit === 'close') sp().pick = 1; };
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointermove', onMove, true);
  overlay.closePanel = closeIt;
  up = { n, close: closeIt, read: () => close(true), spec };
  window.__book = up;
  return true;
}
