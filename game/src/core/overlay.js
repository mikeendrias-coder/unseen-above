// Text over the picture. What the viewer sees is drawn by the show's character generator
// (ui/cg.js) in the caption face, on the pixel grid. The same words go into hidden HTML
// elements too, so a screen reader hears them and tests can read them.
import { cg, TV } from '../ui/cg.js';

const el = id => document.getElementById(id);
const timers = new Map();
const later = (key, ms, fn) => { clearTimeout(timers.get(key)); timers.set(key, setTimeout(fn, ms)); };
const say = (id, text, on) => { const e = el(id); if (!e) return; if (text != null) e.textContent = text; e.classList.toggle('on', !!on); };

export const overlay = {
  // A caption. speaker: 'SISTER' | 'BROTHER' | ... | null (sounds use [BRACKETS] in the text).
  // opts.italic for a voice from off screen; opts.ms clears it after that long.
  caption(speaker, text, opts) {
    cg.caption(speaker, text, opts);
    say('cc', (speaker ? speaker + ': ' : '') + text, true);
    if (opts && opts.ms) later('cc', opts.ms, () => say('cc', '', false));
  },
  clearCaption() { cg.clearCaption(); say('cc', '', false); },
  // a sound, captioned for a moment: overlay.sfx('[GLASS CRACKS]')
  sfx(text, ms) { overlay.caption(null, text, { ms: ms || 2200 }); },

  // The show's title: a red tag over a black title. place 'lower' for the start of something
  // (over the picture), 'center' for an end (over black).
  card(top, title, ms, place) {
    cg.card(top, title, ms || 3200, place);
    const c = el('card');
    if (c) { c.querySelector('.card-top').textContent = top; c.querySelector('.card-title').textContent = title || ''; c.classList.add('on'); }
    later('card', ms || 3200, () => { const c2 = el('card'); if (c2) c2.classList.remove('on'); });
  },
  // the take, after a restart: just the tag, lower left
  take(n) { overlay.card('TAKE ' + n, '', 1500, 'lower'); },
  bug(text, ms) { cg.bug(text, ms); say('bug', text, true); later('bug', ms || 900, () => say('bug', null, false)); },
  // the TV set's own message: sound, picture, review mode
  note(text, ms) { cg.osd(text, ms); say('note', text, true); later('note', ms || 1800, () => say('note', null, false)); },
  rec(ms) { cg.rec(ms); say('note', 'REC', true); later('note', ms || 2400, () => say('note', null, false)); },

  // A how-to-play page (teletext). Any key or a click closes it, after a moment to read.
  // spec: { num, title, band, lines } (lines may mark keys as {G})
  panel(spec, onClose) {
    const p = el('panel');
    cg.page(spec);
    if (p) {
      p.querySelector('.panel-kicker').textContent = 'Page ' + spec.num;
      p.querySelector('.panel-title').textContent = spec.title;
      p.querySelector('.panel-body').replaceChildren(...spec.lines.map(l => { const d = document.createElement('p'); d.textContent = l.replace(/[{}]/g, ''); return d; }));
      p.classList.add('on');
    }
    let done = false;
    const close = ev => {
      if (done || (ev && ev.repeat)) return;
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      done = true; cg.closePage(); if (p) p.classList.remove('on');
      window.removeEventListener('keydown', close, true); window.removeEventListener('pointerdown', close, true);
      if (onClose) setTimeout(onClose, 0);
    };
    setTimeout(() => { if (!done) { window.addEventListener('keydown', close, true); window.addEventListener('pointerdown', close, true); } }, 600);
    overlay.closePanel = () => close();
  },
  immune(on) { cg.immune(on); say('immune', null, on); },
  hint(text) { const h = el('h-hint'); if (h && h.textContent !== text) h.textContent = text || ''; },
  fade(on, ms) { const f = el('blackout'); if (!f) return; f.style.transitionDuration = (ms || 600) + 'ms'; f.classList.toggle('on', !!on); }
};
export { TV };
