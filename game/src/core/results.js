// The show's record of her (Nov 18, research/features_nov17.md items 5 and 6). Two things, both
// paperwork, drawn on their own canvas over the character generator's (ui/cg.js), on the same
// 320 x 210 grid, in the caption face, flat palette colors, popping on and off:
//   - the broadcast bar: a 2 px line along the top of the caption strip in side episodes, as
//     wide as the level. Her place on it, red ticks where she died this visit, her best, and a
//     red BEST stamp the moment she passes it.
//   - the continuity report: the end of each episode. It takes the place of the old END OF
//     EPISODE card (one piece of end paperwork, not two): END OF EPISODE n and TAKE n (the
//     show's running count, the same number as the tape on the floor) at the top, then TAKES
//     THIS RUN, TIME, FALLS, CLUES, GOLD (once something counts gold), OPERATOR: (NOT REQUIRED), and a
//     red stamp grade on a numbered ladder, 1 PRIME TIME down to 4 RERUN, or REHEARSAL in
//     story mode or for a presenter. About 2.4 s, any key moves on; a presenter's report waits
//     for a key (a beat to talk over).
// How it hooks in, with no scene file changed: an episode's end card (overlay.card('END OF
// EPISODE n')) becomes the report, and core/flow.js goNext waits for the report before the
// next step (and shows it, for an episode with no end card: backstage). Episode 3's fall is
// the first half of episode 3: it has no report of its own; the east wing's report counts both.
// The record runs one way: every number about her is exact, and the operator line is blank.
// It counts per visit (a visit is from entering an episode to leaving it; retries stay inside).
import { state } from './state.js';
import { Sound } from './sound.js';
import { overlay } from './overlay.js';
import { goNext } from './flow.js';
import { ASH } from '../art/palettes.js';
import { ccText, ccWidth, ccBox } from '../art/ccfont.js';
import { cg } from '../ui/cg.js';
import { STRIP } from './display.js';

const W = 320, H = 180;
const PAPER = ASH.bone, PAPER_LO = ASH.boneLo, INK = ASH.ash0, INK_LO = ASH.ash3, RULE = ASH.ash5;
// the form's names for each episode; Fall (ep3fall) is the first half of episode 3
const EPS = { ep1: [1, 'THE GROUNDS'], ep2: [2, 'THE GALLERY'], ep3: [3, 'THE EAST WING'], ep3fall: [3, 'THE EAST WING'], ep4: [4, 'THE BEDROOM'], ep5: [5, 'THE MOON'], ep5b: [5, 'BACKSTAGE'] };
// the flow step (core/flow.js) that ends each episode with a report
const END_STEP = { ep1: 'ep1', ep2: 'ep2', ep3: 'ep3b', ep4: 'ep4', ep5b: 'ep5b' };
const ENDS = Object.values(END_STEP);
// time a player who knows the episode needs, generously (seconds on the clock, not counting
// strikes, pauses or side rooms)
const PAR = { ep1: 100, ep2: 130, ep3fall: 45, ep3: 140, ep4: 150, ep5b: 140 };
export const GRADES = ['PRIME TIME', 'DAYTIME', 'LATE NIGHT', 'RERUN'];
const SLIP_MS = 2400;
const presenting = () => !!(window.__presenter || (state.settings && state.settings.presenter));

const rec = {};   // per episode id, this page visit
let cur = null;   // the episode scene that began last
let lastId = null; // and its episode id (the east wing counts the fall only straight after it)
const goldStored = id => { const g = state.story && state.story.gold; if (g == null) return null; if (typeof g === 'number') return id ? null : g; return typeof g === 'object' ? (+g[id] || 0) : null; };
const freshRec = id => ({ id, deaths: 0, falls: 0, time: 0, ticks: [], best: 0, takeBest: 0, bestAt: -9, with: null,
  clues0: Object.keys(state.story.clues || {}), gold0: goldStored(id), g0: null, gNow: null });

// ---------------------------------------------------------------- where she is, 0 to 1
// Toward the level's door from its start; a level with no door (the fall) goes down.
export function progressOf(scene) {
  const k = scene.kid, L = scene.level; if (!k || !L || k.x == null || !scene.map) return null;
  const s = L.start || { x: 0, y: 0 }, d = L.door;
  if (d && d.x > -900 && Math.abs(d.x - s.x) > 32) return Math.max(0, Math.min(1, (k.x - s.x) / (d.x - s.x)));
  const bottom = scene.map.H * 16 - 32;
  return bottom - s.y > 32 ? Math.max(0, Math.min(1, (k.y - s.y) / (bottom - s.y))) : null;
}

// ---------------------------------------------------------------- the canvas
let cv = null, ctx = null, running = false, sr = null;
let bar = null;   // { scene, r }: the episode whose bar shows
let slip = null;  // the report up now
function ensure() {
  if (ctx) return true;
  const ov = document.getElementById('overlay'), under = document.getElementById('cg'); if (!ov) return false;
  cv = document.createElement('canvas'); cv.id = 'feel'; cv.width = W; cv.height = H + STRIP;
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;pointer-events:none';
  if (under && under.nextSibling) ov.insertBefore(cv, under.nextSibling); else ov.appendChild(cv);
  ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  sr = document.createElement('div'); sr.id = 'results'; sr.className = 'sr'; sr.setAttribute('role', 'status'); ov.appendChild(sr);
  return true;
}
function kick() { if (!ensure() || running) return; running = true; requestAnimationFrame(frame); }
function frame() {
  ctx.clearRect(0, 0, W, H + STRIP);
  // the bar's scene: gone once it shuts down; hidden while it sleeps (a side room is up)
  const st = bar && bar.scene.sys ? bar.scene.sys.settings.status : 9;
  if (st >= 8) bar = null;
  if (!bar && !slip) { running = false; return; }
  if (bar && (st === 5 || st === 6) && !slip && !cg.menuUp && !cg.pageUp && !bar.scene.leaving && !bar.scene.done) drawBar(bar.scene, bar.r);
  if (slip) drawSlip(slip, performance.now() / 1000);
  requestAnimationFrame(frame);
}
const dither = (x, y, w, h) => {
  for (let j = 0; j < h; j++) for (let i = (j % 2); i < w; i += 2) ctx.fillRect(x + i, y + j, 1, 1);
};
function stamp(text, x, y, sy, fill) {
  const w = ccWidth(text) + 8, h = 7 * sy + 6;
  if (fill) ccBox(ctx, x, y, w, h, fill);
  ctx.fillStyle = ASH.red;
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
  ccText(ctx, text, x + 4, y + 3, ASH.red, { sy });
  // where the ink missed
  ctx.fillStyle = fill || PAPER; for (let i = 3; i < w - 2; i += 7) ctx.fillRect(x + i, y + ((i * 5) % 3 === 0 ? 0 : h - 1), 2, 1);
  return { w, h };
}

// ---------------------------------------------------------------- the broadcast bar
// 2 px tall so it reads on a projector: the part she has covered in light ash, the rest in mid
// ash, her place a bone post, her best a dull post, red ticks where she died.
const BX0 = 6, BX1 = 314, BY = H + 2;
function drawBar(scene, r) {
  const p = progressOf(scene); if (p == null) return;
  const span = BX1 - BX0, at = v => BX0 + Math.round(v * (span - 2));
  const cap = cg.captionRect, hid = x => cap && cap.y0 <= BY + 4 && x >= cap.x0 - 1 && x <= cap.x1;
  const px = (x, y, w, h, c) => { if (hid(x)) return; ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const here = at(p), best = at(r.best);
  for (let x = BX0; x < BX1; x++) px(x, BY, 1, 2, x <= here ? ASH.ash5 : ASH.ash3);
  if (r.best > p + 0.004) px(best, BY - 1, 2, 4, PAPER_LO);
  px(here, BY - 2, 2, 6, PAPER);
  // the deaths go on top: one right by her post (a checkpoint) still shows
  r.ticks.forEach(t => px(at(t), BY - 1, 1, 4, ASH.red));
  // BEST: a red stamp under the bar for a moment, where she passed it, clear of the captions
  const age = performance.now() / 1000 - r.bestAt;
  if (age >= 0 && age < 1.3) {
    const s = 'BEST', w = ccWidth(s) + 8;
    let x = Math.max(36, Math.min(284 - w, r.bestX - Math.round(w / 2)));
    if (cap && x + w > cap.x0 && x < cap.x1) x = cap.x0 - w - 4 >= 36 ? cap.x0 - w - 4 : cap.x1 + 4;
    stamp(s, x, BY + 5, 1, INK);
  }
}

// ---------------------------------------------------------------- the continuity report
const fmtTime = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
export function gradeOf(d) {
  if (d.rehearsal) return 'REHEARSAL';
  const par = PAR[d.id] || 120;
  const score = d.deaths + (d.time > par ? 1 : 0) + (d.time > par * 2 ? 1 : 0);
  return score === 0 ? GRADES[0] : score <= 2 ? GRADES[1] : score <= 5 ? GRADES[2] : GRADES[3];
}
function rows(d) {
  const out = [['TAKES THIS RUN', String(d.takes)], ['TIME', fmtTime(d.time)], ['FALLS', String(d.falls)], ['CLUES', d.clues ? d.clues + ' NEW' : 'NONE']];
  if (d.gold != null) out.push(['GOLD', String(d.gold)]);
  out.push(['OPERATOR', '(NOT REQUIRED)']); // as the request forms say
  return out;
}
function drawSlip(s, t) {
  const d = s.data, R = rows(d), age = t - s.t0;
  const w = 200, ROW = 11, LAD = 10, h = 3 + 10 + 4 + 18 + 4 + R.length * ROW + 3 + 4 * LAD + 5;
  const x = Math.round(160 - w / 2), y = Math.max(3, Math.round((H - h) / 2));
  ctx.fillStyle = INK; dither(0, 0, W, H);
  ccBox(ctx, x - 1, y - 1, w + 2, h + 2, INK); ccBox(ctx, x, y, w, h, PAPER);
  let yy = y + 3;
  ccText(ctx, d.num ? 'END OF EPISODE ' + d.num : 'CONTINUITY REPORT', x + 6, yy, INK_LO);
  if (d.take) { const no = 'TAKE ' + d.take; ccText(ctx, no, x + w - 6 - ccWidth(no), yy, INK); }
  yy += 10; ccBox(ctx, x + 4, yy, w - 8, 1, INK); yy += 4;
  ccText(ctx, d.title, x + 6, yy, INK, { sx: 2, sy: 2 });
  yy += 18; ccBox(ctx, x + 4, yy, w - 8, 1, RULE); yy += 4;
  R.forEach(([k, v]) => {
    ccText(ctx, k, x + 6, yy + 1, INK_LO);
    // a dotted leader to the value, like a form filled in by hand
    const vx = x + w - 6 - ccWidth(v);
    for (let lx = x + 6 + ccWidth(k) + 4; lx < vx - 3; lx += 3) ccBox(ctx, lx, yy + 7, 1, 1, RULE);
    ccText(ctx, v, vx, yy + 1, INK);
    yy += ROW;
  });
  ccBox(ctx, x + 4, yy, w - 8, 1, PAPER_LO); yy += 3;
  // the ladder: the four grades in order, best first, the one she got ticked in red
  GRADES.forEach((g, i) => {
    const mine = age > 0.35 && g === d.grade, ly = yy + i * LAD;
    ccText(ctx, (i + 1) + ' ' + g, x + 12, ly, mine ? INK : INK_LO);
    if (mine) ccBox(ctx, x + 6, ly + 2, 3, 3, ASH.red);
  });
  ccText(ctx, 'ANY KEY', x + w - 6 - ccWidth('ANY KEY'), y + h - 10, INK_LO);
  // the grade lands a beat after the form, with a thunk
  if (age > 0.35) {
    if (!s.thunk) { s.thunk = true; Sound.stamp(); }
    const g = d.grade, sw = ccWidth(g) + 8;
    stamp(g, x + w - 6 - sw, yy + 2, 1, PAPER);
  }
}

// ---------------------------------------------------------------- the API
export const results = {
  // death.js: a take starts. fresh: a new visit (not a retry). bar: draw the broadcast bar.
  // data: what the scene started with (the east wing counts the fall when it comes from it).
  begin(scene, fresh0, bar0, data) {
    const id = scene.epId; if (!id) return null;
    scene.__report = null; // a scene object is reused: this start has not reported yet
    if (fresh0 || !rec[id]) {
      rec[id] = freshRec(id);
      if (id === 'ep3' && lastId === 'ep3fall' && rec.ep3fall && !(data && data.retry)) rec[id].with = rec.ep3fall;
    }
    // (a side room opened from an episode does not count: the episode sleeps and wakes under it)
    if (END_STEP[id] || id === 'ep3fall') { cur = scene; lastId = id; }
    const r = rec[id]; r.takeBest = r.best; r.bestAt = -9;
    // the clock runs while the scene runs and she is in play (not during a strike, a pause,
    // a hit-stop or a side room: a paused or sleeping scene sends no postupdate)
    const tick = (time, delta) => {
      // gold picked up this visit (core/props.js Gold, once a scene has it)
      const g = scene.gold && typeof scene.gold.count === 'number' ? scene.gold.count : null;
      if (g != null) { if (r.g0 == null) r.g0 = g; r.gNow = g; }
      if (scene.dead || scene.leaving || scene.done || scene.__frozen || window.__paused) return;
      r.time += Math.min(0.1, delta / 1000);
      const p = progressOf(scene); if (p == null) return;
      if (p > r.best) {
        // passing her best from an earlier take: stamp it once a take
        if (r.deaths > 0 && r.takeBest > 0.04 && p > r.takeBest + 0.004 && r.bestAt < 0) { r.bestAt = performance.now() / 1000; r.bestX = BX0 + Math.round(r.takeBest * (BX1 - BX0 - 2)); Sound.stamp(0.5); }
        r.best = p;
      }
    };
    scene.events.on('postupdate', tick);
    scene.events.once('shutdown', () => scene.events.off('postupdate', tick));
    if (bar0) { bar = { scene, r }; kick(); }
    return r;
  },
  // death.js: she died here (before the body lands)
  died(scene) {
    const r = scene.epId && rec[scene.epId]; if (!r) return;
    r.deaths++;
    const p = progressOf(scene); if (p != null) { r.ticks.push(p); if (r.ticks.length > 60) r.ticks.shift(); }
  },
  // side.js: a fall that hurt
  fell(scene) { const r = scene.epId && rec[scene.epId]; if (r) r.falls++; },
  // the record of this visit, or null
  of(id) { return rec[id] || null; },
  deathsHere(id) { return rec[id] ? rec[id].deaths : 0; },
  // what the form says for this episode visit (episode 3 adds its fall)
  collect(scene) {
    const id = scene.epId, r0 = rec[id], all = r0 ? [r0].concat(r0.with ? [r0.with] : []) : [];
    const sum = k => all.reduce((n, r) => n + r[k], 0);
    const first = all.length ? all[all.length - 1] : freshRec(id);
    const clues = Object.keys(state.story.clues || {}).filter(c => !first.clues0.includes(c)).length;
    // gold: pieces she picked up in this visit, from the scene's own count when it has one,
    // else the change in what the story stores; no row at all when nothing counts gold
    let gold = null;
    all.forEach(r => {
      if (r.g0 != null) gold = (gold || 0) + Math.max(0, r.gNow - r.g0);
      else { const now = goldStored(r.id); if (now != null) gold = (gold || 0) + Math.max(0, now - (r.gold0 || 0)); }
    });
    const [num, title] = EPS[id] || ['', String(id || '').toUpperCase()];
    const d = { id, num, title, take: scene.ep && scene.ep.take, deaths: sum('deaths'), takes: sum('deaths') + 1, time: sum('time'), falls: sum('falls'), clues, gold,
      rehearsal: !!(state.immune || presenting()) };
    d.grade = gradeOf(d);
    return d;
  },
  // The report. data from collect(scene) (or made up by a test); done runs once, when it goes
  // by a key, a click or its time. If the scene shuts down under it (a chapter jump), it goes
  // without done.
  show(scene, data, done) {
    const d = data || results.collect(scene);
    let over = false, timer = null;
    const finish = go => {
      if (over) return; over = true; slip = null;
      window.removeEventListener('keydown', key, true); window.removeEventListener('pointerdown', key, true);
      if (scene && scene.events) scene.events.off('shutdown', drop);
      clearTimeout(timer); if (sr) sr.textContent = '';
      window.__results = null;
      if (go !== false && done) done();
    };
    const drop = () => finish(false);
    // any key or a click moves on, after a moment (a key still held from play does not count).
    // Keys with their own job pass through: the presenter's chapter digits and U (full screen),
    // M (sound), and anything with a modifier.
    const key = ev => {
      if (ev.type === 'keydown') {
        if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey || /^[0-9]$/.test(ev.key) || /^[uUmM]$/.test(ev.key) || ev.key === 'Tab') return;
      }
      if (performance.now() / 1000 - (slip ? slip.t0 : 0) < 0.25) return;
      ev.preventDefault(); ev.stopPropagation(); finish();
    };
    if (window.__noResults || !ensure()) { setTimeout(finish, 0); return finish; }
    slip = { data: d, t0: performance.now() / 1000, thunk: false };
    window.__results = d;
    sr.textContent = (d.num ? 'End of episode ' + d.num + ', ' : 'Continuity report, ') + d.title.toLowerCase() + (d.take ? ', take ' + d.take : '') + '. Takes this run ' + d.takes + ', time ' + fmtTime(d.time) + ', falls ' + d.falls + ', clues ' + d.clues + (d.gold != null ? ', gold ' + d.gold : '') + ', operator not required. Stamped ' + d.grade + '.';
    window.addEventListener('keydown', key, true); window.addEventListener('pointerdown', key, true);
    if (scene && scene.events) scene.events.once('shutdown', drop);
    // a presenter's report waits for a key: a beat to talk over
    if (!presenting()) timer = setTimeout(finish, SLIP_MS);
    kick();
    return finish;
  },
  get up() { return !!slip; },
  // core/flow.js: does finishing this step end an episode (with a report)?
  endsEpisode(step) { return ENDS.includes(step); },
  // core/flow.js goNext: the report for this scene, then go(). If the report is already up (its
  // end card turned into it), go() waits for it; if it has been, go() runs now.
  report(scene, go) {
    const rp = scene.__report;
    if (rp) { if (rp.open) rp.after = go; else go(); return; }
    if (!scene.epId || !rec[scene.epId]) { go(); return; }
    const me = scene.__report = { open: true, after: go };
    results.show(scene, null, () => {
      me.open = false; const f = me.after; me.after = null;
      if (f) f(); else if (END_STEP[scene.epId]) goNext(scene, END_STEP[scene.epId]);
    });
  },
  // the episode's END OF EPISODE card: the report instead (true), if it is this episode's end
  takeover(num) {
    const s = cur;
    if (!s || !s.sys || !s.sys.settings || s.sys.settings.status > 6 || !END_STEP[s.epId] || !EPS[s.epId] || EPS[s.epId][0] !== num) return false;
    if (window.__noResults || s.__report) return !!s.__report;
    results.report(s, null);
    return true;
  },
  // End an episode: the report, then the next step. Same as goNext(this, step) now.
  next(scene, step, fallback) { if (!goNext(scene, step) && fallback) fallback(); return true; }
};

// The END OF EPISODE card becomes the report (one piece of end paperwork). The card's words
// still go to the screen reader line and the page's #card (tests and assistive tech read it).
const card0 = overlay.card;
overlay.card = function (top, title, ms, place) {
  const m = /^END OF EPISODE (\d+)$/.exec(String(top || ''));
  if (m && results.takeover(+m[1])) {
    const c = document.getElementById('card');
    if (c) {
      c.querySelector('.card-top').textContent = top; c.querySelector('.card-title').textContent = title || ''; c.classList.add('on');
      setTimeout(() => c.classList.remove('on'), ms || 3200);
    }
    return;
  }
  return card0.apply(this, arguments);
};

if (typeof window !== 'undefined') window.__feel = Object.assign(window.__feel || {}, { results, gradeOf });
