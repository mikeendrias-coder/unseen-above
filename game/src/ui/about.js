// How the game argues (Nov 18, for Michael's class): one paper notice over the picture that ties
// each mechanic to the paper's argument. Its foot has the paper itself: "Read the paper:
// paper.html", a button (R too) that opens the published paper in a new tab. Opened from the title (the About row) and from every
// ending screen (ABOUT, ending/finale.js). Any key or a click puts it away. It is HTML in the
// caption face at the picture's own pixel size (--u), so it reads like the show's other paperwork
// and stays big enough for a projector. While it is up it takes every key first (this module is
// imported before main.js adds its own listeners), so nothing behind it moves.
import { display, measure } from '../core/display.js';
import { openPaper, paperUrl } from '../core/paper.js';

export const ABOUT_ROWS = [
  ['THE GLASSES', 'Who gets to see whom.'],
  ['REQUEST FORMS', '"Voluntary" requests, and nobody signs as operator.'],
  ['OPERATOR:\n(NOT REQUIRED)', 'The record only runs one way.'],
  ['TAKES, BODIES,\nTHE DEATH MAP', 'She is recorded completely.'],
  ['THE MOON', 'The powerful watch and are never seen. The blur over their city.'],
  ['LOOK BACK', 'The remedy: supervision that turns the camera on the watchers (Article VI).']
];

let el = null, back = null, upKey = null, onClose = null;
const fit = () => { if (!el) return; measure(); el.style.setProperty('--u', (display.cssH / 180) + 'px'); };
function build() {
  if (el) return el;
  const stage = document.getElementById('stage'); if (!stage) return null;
  el = document.createElement('div'); el.id = 'about'; el.hidden = true; el.tabIndex = -1;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'about-h');
  const paper = document.createElement('div'); paper.className = 'paper';
  const top = document.createElement('div'); top.className = 'top';
  const h = document.createElement('h2'); h.id = 'about-h'; h.textContent = 'HOW THE GAME ARGUES';
  const st = document.createElement('span'); st.className = 'stamp'; st.textContent = 'EXHIBIT A';
  top.append(h, st);
  const dl = document.createElement('dl');
  ABOUT_ROWS.forEach(([m, a]) => { const r = document.createElement('div'); r.className = 'row'; const dt = document.createElement('dt'); dt.textContent = m; const dd = document.createElement('dd'); dd.textContent = a; r.append(dt, dd); dl.appendChild(r); });
  // the foot: how to put it away, and the paper itself (R, or a click on it, opens it in a new tab)
  const foot = document.createElement('div'); foot.className = 'foot';
  const away = document.createElement('span'); away.textContent = 'ANY KEY GOES BACK';
  const read = document.createElement('button'); read.type = 'button'; read.id = 'about-paper'; read.className = 'read';
  read.innerHTML = '<span class="k">R</span> Read the paper: ' + paperUrl();
  read.setAttribute('aria-label', 'Read the paper, ' + paperUrl() + ', in a new tab. R does it too.');
  read.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); openPaper(); closeAbout(); });
  foot.append(away, read);
  paper.append(top, dl, foot); el.appendChild(paper);
  el.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); closeAbout(); });
  stage.appendChild(el);
  window.addEventListener('resize', fit);
  return el;
}
export const aboutOpen = () => !!(el && !el.hidden);
// done: called once it is put away (the ending screen picks up again)
export function openAbout(done) {
  if (!build() || aboutOpen()) return;
  back = document.activeElement; onClose = done || null; upKey = null;
  fit(); el.hidden = false; window.__about = true;
  try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
}
export function closeAbout() {
  if (!aboutOpen()) return;
  el.hidden = true; window.__about = false;
  if (back && back !== document.body && document.contains(back)) try { back.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  back = null;
  const f = onClose; onClose = null; if (f) f();
}
// every key is the notice's while it is up; a key that only modifies waits for the next one
const MODS = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'];
window.addEventListener('keydown', ev => {
  if (!aboutOpen()) return;
  ev.stopImmediatePropagation();
  if (MODS.includes(ev.key)) return;
  if (!(ev.ctrlKey || ev.metaKey || ev.altKey || /^F\d+$/.test(ev.key))) ev.preventDefault();
  if (ev.repeat) return;
  upKey = ev.code;
  if (ev.key === 'r' || ev.key === 'R') openPaper(); // the paper, in a new tab
  closeAbout();
}, true);
// the key that put it away does nothing more as it comes up (Space would press a title row)
window.addEventListener('keyup', ev => { if (upKey && ev.code === upKey) { upKey = null; ev.preventDefault(); } }, true);
