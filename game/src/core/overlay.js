// Text over the picture. What the viewer sees is drawn by the show's character generator
// (ui/cg.js) in the caption face, on the pixel grid. The same words go into hidden HTML
// elements too, so a screen reader hears them and tests can read them.
import { cg, TV } from '../ui/cg.js';
import { state } from './state.js';
import { typer } from '../ui/typer.js';
import { clueGroup } from '../data/clues.js';

const el = id => document.getElementById(id);
const timers = new Map();
const later = (key, ms, fn) => { clearTimeout(timers.get(key)); timers.set(key, setTimeout(fn, ms)); };
const say = (id, text, on) => { const e = el(id); if (!e) return; if (text != null) e.textContent = text; e.classList.toggle('on', !!on); };
let capText = ''; // the scene's own caption, for when narration hands the strip back
let descText = ''; // the narration up now
let sceneHint = ''; // the scene's own hint
const showHint = () => { const h = el('h-hint'), t = sceneHint || typer.cue(); if (h && h.textContent !== t) h.textContent = t; };

export const overlay = {
  // A caption. speaker: 'SISTER' | 'BROTHER' | ... | null (sounds use [BRACKETS] in the text).
  // It types out letter by letter (ui/typer.js); sounds show whole.
  // opts.italic for a voice from off screen; opts.ms clears it after that long.
  // opts.once: a key (any stable string); the line plays until it has been shown in full once
  // (saved), so a retry never replays it, but a line cut short plays again. Returns false when
  // it was skipped, else the line (ui/typer.js). Typer options: block (she cannot move: J, Enter, Space or a click move it on),
  // onAdvance (what a press on the line once it is out does), noSkip (presses never touch it),
  // scene (its owner), instant, onShown.
  caption(speaker, text, opts) {
    if (opts && opts.once != null) { if (state.heard(opts.once)) return false; opts = Object.assign({}, opts, { key: opts.once }); }
    // opts.key alone: marked heard once shown, but said whatever (the scene filtered it already)
    const line = cg.caption(speaker, text, opts);
    // the whole line at once for a screen reader (letter by letter would stutter)
    capText = (speaker ? speaker + ': ' : '') + text;
    if (!cg.describing) say('cc', capText, true);
    if (opts && opts.ms) later('cc', opts.ms, () => { capText = ''; if (!cg.describing) say('cc', '', false); });
    return line;
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
  // the strip caption's line (ui/typer.js: shown, press()), or null
  get line() { return cg.line; },
  // is this part of the screen (pixel grid) clear of captions right now
  free(x, y, w, h) { const r = cg.captionRect; return !r || x >= r.x1 || x + w <= r.x0 || y >= r.y1 || y + h <= r.y0; },
  // a sound, captioned for a moment: overlay.sfx('[GLASS CRACKS]'). It cuts any narration short
  // (bubbles.js watches cuts), so the sound is never hidden behind a look.
  // once: a key, as for caption (said until it has been shown once)
  sfx(text, ms, once) { if (once != null && state.heard(once)) return false; overlay.cuts++; return overlay.caption(null, text, { ms: ms || 2200, once }); },
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
  // (a clue's NOTED (n) names its group and the count toward that group's ending: clueNote)
  note(text, ms) { if (/^NOTED \(\d+\)$/.test(text) && state.lastClue) text = clueNote(state.lastClue); cg.osd(text, ms); say('note', text, true); later('note', ms || 1800, () => say('note', null, false)); },
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
  // the hint line under the game. While a blocking line waits for a press and the scene has no
  // hint of its own, it says which keys move the line on (ui/typer.js cue).
  hint(text) { sceneHint = text || ''; showHint(); },
  fade(on, ms) { const f = el('blackout'); if (!f) return; f.style.transitionDuration = (ms || 600) + 'ms'; f.classList.toggle('on', !!on); }
};
typer.hook({ tick: showHint });
// What a clue's note says: which kind it is and how many of that kind she has, toward the five an
// ending needs (data/clues.js): NOTED: WHO AIMS 3/5, NOTED: WHAT SHE IS 2/5.
export function clueNote(id) {
  const g = clueGroup(id), n = state.clueCount(g);
  return 'NOTED: ' + (g === 'who' ? 'WHO AIMS ' : 'WHAT SHE IS ') + Math.min(n, 5) + '/5';
}
// Mark a clue found and say so once. True the first time.
export function noteClue(id) { if (!state.clue(id)) return false; overlay.note(clueNote(id), 1600); return true; }
export { TV };
