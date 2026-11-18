// Text over the picture. What the viewer sees is drawn by the show's character generator
// (ui/cg.js) in the caption face, on the pixel grid. The same words go into hidden HTML
// elements too, so a screen reader hears them and tests can read them.
import { cg, TV } from '../ui/cg.js';
import { state } from './state.js';

const el = id => document.getElementById(id);
const timers = new Map();
const later = (key, ms, fn) => { clearTimeout(timers.get(key)); timers.set(key, setTimeout(fn, ms)); };
const say = (id, text, on) => { const e = el(id); if (!e) return; if (text != null) e.textContent = text; e.classList.toggle('on', !!on); };
let capText = ''; // the scene's own caption, for when narration hands the strip back
let descText = ''; // the narration up now

export const overlay = {
  // A caption. speaker: 'SISTER' | 'BROTHER' | ... | null (sounds use [BRACKETS] in the text).
  // opts.italic for a voice from off screen; opts.ms clears it after that long.
  // opts.once: a key (any stable string); the line plays only the first time, ever (saved), so a
  // retry never replays it. Returns false when it was skipped.
  caption(speaker, text, opts) {
    if (opts && opts.once != null && !state.hear(opts.once)) return false;
    cg.caption(speaker, text, opts);
    capText = (speaker ? speaker + ': ' : '') + text;
    if (!cg.describing) say('cc', capText, true);
    if (opts && opts.ms) later('cc', opts.ms, () => { capText = ''; if (!cg.describing) say('cc', '', false); });
    return true;
  },
  clearCaption() { cg.clearCaption(); capText = ''; if (!cg.describing) say('cc', '', false); },
  // Narration from a look with E: { lines, shown, alpha, more, ink } every frame, or null. It
  // takes the caption strip while it is up; scenes hold their own lines (describing).
  describe(d) {
    const was = cg.describing; cg.describe(d);
    if (d) { const text = d.lines.join(' '); if (!was || text !== descText) { descText = text; say('cc', text, true); } }
    else if (was) { descText = ''; say('cc', capText, !!capText); }
  },
  describing() { return cg.describing; },
  // is this part of the screen (pixel grid) clear of captions right now
  free(x, y, w, h) { const r = cg.captionRect; return !r || x >= r.x1 || x + w <= r.x0 || y >= r.y1 || y + h <= r.y0; },
  // a sound, captioned for a moment: overlay.sfx('[GLASS CRACKS]'). It cuts any narration short
  // (bubbles.js watches cuts), so the sound is never hidden behind a look.
  sfx(text, ms) { overlay.cuts++; overlay.caption(null, text, { ms: ms || 2200 }); },
  cuts: 0,

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

  // A how-to-play notice (a slip from the show). Any key or a click closes it, after a moment.
  // spec: { num, title, lines, stamp } (lines may mark keys as {L})
  panel(spec, onClose) {
    const p = el('panel');
    cg.page(spec);
    if (p) {
      p.querySelector('.panel-kicker').textContent = 'Notice ' + spec.num;
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
