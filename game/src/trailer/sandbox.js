// The trailer's first module (it must stay the first import of trailer/main.js, so it runs
// before core/state.js reads the save). The trailer plays the real game, and the real game saves
// to localStorage on the same site as the game itself: without this, every play of the trailer
// would leave bodies, takes, lines heard and endings seen in the viewer's own save. So the game's
// keys live in memory here, fresh on every load, and the real save is never read or written.
const mem = new Map();
const ours = k => /^unseen-above/.test(String(k));
try {
  const P = Storage.prototype, get = P.getItem, set = P.setItem, del = P.removeItem;
  P.getItem = function (k) { return ours(k) ? (mem.has(k) ? mem.get(k) : null) : get.call(this, k); };
  P.setItem = function (k, v) { if (ours(k)) mem.set(k, String(v)); else set.call(this, k, v); };
  P.removeItem = function (k) { if (ours(k)) mem.delete(k); else del.call(this, k); };
} catch (e) { /* no storage at all: the game keeps its state in memory anyway */ }

// A computer that asks for reduced motion gets the game's reduced flashing and no shake.
const calm = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
mem.set('unseen-above-v1', JSON.stringify({
  look: 'A', mode: 'normal', seenIntro: true, panels: {}, reached: null, resume: null,
  settings: { music: 5, sfx: 5, reduceFlash: calm, shake: !calm, presenter: false, bigCaptions: false, bright: false, keysFolded: true, keysFoldedFs: true }
}));

// How-to notices never stop the trailer, and a lost focus never opens the pause menu.
window.__noPanels = true;
window.__noAutoPause = true;
window.__trailer = true;
