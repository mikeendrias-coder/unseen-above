// Text that sits over the canvas as HTML: captions styled like TV closed captions, episode cards,
// a channel bug, and small notices. HTML keeps text sharp at any scale and readable by screen readers.
const el = id => document.getElementById(id);
const timers = new Map();
const later = (key, ms, fn) => { clearTimeout(timers.get(key)); timers.set(key, setTimeout(fn, ms)); };

export const overlay = {
  // speaker: 'SISTER' | 'BROTHER' | null (sound or action lines use [BRACKETS] in text)
  caption(speaker, text) {
    const box = el('cc'); if (!box) return;
    box.replaceChildren();
    const line = document.createElement('span'); line.className = 'cc-line';
    if (speaker) { const who = document.createElement('span'); who.className = 'cc-who'; who.textContent = speaker + ': '; line.append(who); }
    line.append(document.createTextNode(text));
    box.append(line); box.classList.add('on');
  },
  clearCaption() { const box = el('cc'); if (box) { box.classList.remove('on'); box.replaceChildren(); } },

  card(top, title, ms) {
    const c = el('card'); if (!c) return;
    c.querySelector('.card-top').textContent = top;
    c.querySelector('.card-title').textContent = title;
    c.classList.add('on');
    later('card', ms || 3200, () => c.classList.remove('on'));
  },
  bug(text, ms) {
    const b = el('bug'); if (!b) return;
    b.textContent = text; b.classList.add('on');
    later('bug', ms || 900, () => b.classList.remove('on'));
  },
  note(text, ms) {
    const n = el('note'); if (!n) return;
    n.textContent = text; n.classList.add('on');
    later('note', ms || 1800, () => n.classList.remove('on'));
  },
  hint(text) { const h = el('h-hint'); if (h && h.textContent !== text) h.textContent = text || ''; },
  fade(on, ms) { const f = el('blackout'); if (!f) return; f.style.transitionDuration = (ms || 600) + 'ms'; f.classList.toggle('on', !!on); }
};
