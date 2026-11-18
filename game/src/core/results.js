// The show's record of her (Nov 18, research/features_nov17.md items 5 and 6). Two things, both
// paperwork, drawn on their own canvas over the character generator's (ui/cg.js), on the same
// 320 x 210 grid, in the caption face, flat palette colors, popping on and off:
//   - the broadcast bar: a 1 px line along the top of the caption strip in side episodes, as
//     wide as the level. Her place on it, red ticks where she died this visit, her best, and a
//     red BEST stamp the moment she passes it.
//   - the continuity report: a form at the end of each episode. TAKES, TIME, FALLS, CLUES, GOLD
//     (only once something counts gold), OPERATOR: (NONE), and a red stamp grade, PRIME TIME
//     down to RERUN, or REHEARSAL in story mode or for a presenter. About 2 s; any key moves on.
// The record runs one way: every number about her is exact, and the operator line is blank.
// It counts per visit (a visit is from entering an episode to leaving it; retries stay inside).
// death.js opens and feeds the record; scenes end an episode with results.next(this, step).
import { state } from './state.js';
import { Sound } from './sound.js';
import { goNext } from './flow.js';
import { ASH } from '../art/palettes.js';
import { ccText, ccWidth, ccBox } from '../art/ccfont.js';
import { cg } from '../ui/cg.js';
import { STRIP } from './display.js';

const W = 320, H = 180;
const PAPER = ASH.bone, PAPER_LO = ASH.boneLo, INK = ASH.ash0, INK_LO = ASH.ash3, RULE = ASH.ash5;
// the form's names for each episode; Fall (ep3fall) is the first half of episode 3
const EPS = { ep1: [1, 'THE GROUNDS'], ep2: [2, 'THE GALLERY'], ep3: [3, 'THE EAST WING'], ep3fall: [3, 'THE EAST WING'], ep4: [4, 'THE BEDROOM'], ep5: [5, 'THE MOON'], ep5b: [5, 'BACKSTAGE'] };
const MERGE = { ep3: ['ep3fall'] };
// time a player who knows the episode needs, generously (seconds on the clock, not counting
// strikes, pauses or side rooms)
const PAR = { ep1: 100, ep2: 130, ep3fall: 45, ep3: 140, ep4: 150, ep5b: 140 };
export const GRADES = ['PRIME TIME', 'DAYTIME', 'LATE NIGHT', 'RERUN'];
const SLIP_MS = 2300;

const rec = {}; // per episode id, this page visit
const fresh = () => ({ deaths: 0, falls: 0, time: 0, ticks: [], best: 0, takeBest: 0, bestAt: -9, at: null, clues0: Object.keys(state.story.clues || {}), gold0: goldNow() });
function goldNow(id) {
  const g = state.story && state.story.gold;
  if (g == null) return null;
  if (typeof g === 'number') return g;
  if (typeof g === 'object') return id ? (g[id] || 0) : Object.values(g).reduce((n, v) => n + (+v || 0), 0);
  return null;
}

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
  if (bar && (st === 5 || st === 6) && !slip && !cg.menuUp && !cg.pageUp) drawBar(bar.scene, bar.r);
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
const BX0 = 6, BX1 = 314, BY = H + 2;
function drawBar(scene, r) {
  const p = progressOf(scene); if (p == null) return;
  const span = BX1 - BX0, at = v => BX0 + Math.round(v * (span - 1));
  const cap = cg.captionRect, hid = x => cap && cap.y0 <= BY + 2 && x >= cap.x0 - 1 && x <= cap.x1;
  const px = (x, y, w, h, c) => { if (hid(x)) return; ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const here = at(p), best = at(r.best);
  for (let x = BX0; x < BX1; x++) px(x, BY, 1, 1, x <= here ? ASH.ash5 : ASH.ash2);
  if (r.best > p + 0.004) px(best, BY - 1, 1, 3, PAPER_LO);
  r.ticks.forEach(t => px(at(t), BY - 2, 1, 3, ASH.red));
  px(here, BY - 1, 1, 3, PAPER);
  // BEST: a red stamp under the bar for a moment, where she passed it, clear of the captions
  const age = performance.now() / 1000 - r.bestAt;
  if (age >= 0 && age < 1.3) {
    const s = 'BEST', w = ccWidth(s) + 8;
    let x = Math.max(36, Math.min(284 - w, r.bestX - Math.round(w / 2)));
    if (cap && x + w > cap.x0 && x < cap.x1) x = cap.x0 - w - 4 >= 36 ? cap.x0 - w - 4 : cap.x1 + 4;
    stamp(s, x, BY + 3, 1, INK);
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
  const out = [['TAKES', String(d.takes)], ['TIME', fmtTime(d.time)], ['FALLS', String(d.falls)], ['CLUES', d.clues ? d.clues + ' NEW' : 'NONE']];
  if (d.gold != null) out.push(['GOLD', String(d.gold)]);
  out.push(['OPERATOR', '(NONE)']);
  return out;
}
function drawSlip(s, t) {
  const d = s.data, R = rows(d), age = t - s.t0;
  const w = 188, ROW = 11, h = 12 + 4 + 18 + 4 + R.length * ROW + 6 + 24, x = Math.round(160 - w / 2), y = Math.max(3, Math.round((H - h) / 2));
  ctx.fillStyle = INK; dither(0, 0, W, H);
  ccBox(ctx, x - 1, y - 1, w + 2, h + 2, INK); ccBox(ctx, x, y, w, h, PAPER);
  let yy = y + 3;
  ccText(ctx, 'CONTINUITY REPORT', x + 6, yy, INK_LO);
  const no = 'EP ' + d.num; ccText(ctx, no, x + w - 6 - ccWidth(no), yy, INK_LO);
  yy += 10; ccBox(ctx, x + 4, yy, w - 8, 1, INK); yy += 4;
  ccText(ctx, d.title, x + 6, yy, INK, { sy: 2 });
  yy += 18; ccBox(ctx, x + 4, yy, w - 8, 1, RULE); yy += 4;
  R.forEach(([k, v]) => {
    ccText(ctx, k, x + 6, yy + 1, INK_LO);
    // a dotted leader to the value, like a form filled in by hand
    const vx = x + w - 6 - ccWidth(v);
    for (let lx = x + 6 + ccWidth(k) + 4; lx < vx - 3; lx += 3) ccBox(ctx, lx, yy + 7, 1, 1, RULE);
    ccText(ctx, v, vx, yy + 1, INK);
    yy += ROW;
  });
  yy += 2; ccBox(ctx, x + 4, yy, w - 8, 1, PAPER_LO);
  ccText(ctx, 'ANY KEY', x + 6, yy + 4, INK_LO);
  // the grade lands a beat after the form, with a thunk
  if (age > 0.35) {
    if (!s.thunk) { s.thunk = true; Sound.stamp(); }
    const g = d.grade, sw = ccWidth(g) + 8;
    stamp(g, x + w - 6 - sw, yy + 4, 2, PAPER);
  }
}

// ---------------------------------------------------------------- the API
export const results = {
  // death.js: a take starts. fresh: a new visit (not a retry). bar: draw the broadcast bar.
  begin(scene, fresh0, bar0) {
    const id = scene.epId; if (!id) return null;
    if (fresh0 || !rec[id]) rec[id] = fresh();
    const r = rec[id]; r.takeBest = r.best; r.bestAt = -9;
    // the clock runs while the scene runs and she is in play (not during a strike, a pause,
    // a hit-stop or a side room: a paused or sleeping scene sends no postupdate)
    const tick = (time, delta) => {
      if (scene.dead || scene.leaving || scene.done || window.__paused) return;
      r.time += Math.min(0.1, delta / 1000);
      const p = progressOf(scene); if (p == null) return;
      if (p > r.best) {
        // passing her best from an earlier take: stamp it once a take
        if (r.deaths > 0 && r.takeBest > 0.04 && p > r.takeBest + 0.004 && r.bestAt < 0) { r.bestAt = performance.now() / 1000; r.bestX = BX0 + Math.round(r.takeBest * (BX1 - BX0 - 1)); Sound.stamp(0.5); }
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
    const id = scene.epId, all = [id].concat(MERGE[id] || []).map(i => rec[i]).filter(Boolean);
    const sum = k => all.reduce((n, r) => n + r[k], 0);
    const first = all.length ? all.reduce((a, b) => (a.clues0.length <= b.clues0.length ? a : b)) : { clues0: Object.keys(state.story.clues || {}), gold0: goldNow() };
    const clues = Object.keys(state.story.clues || {}).filter(c => !first.clues0.includes(c)).length;
    const g = goldNow(), byEp = state.story && state.story.gold && typeof state.story.gold === 'object';
    const gold = g == null ? null : byEp ? [id].concat(MERGE[id] || []).reduce((n, i) => n + (goldNow(i) || 0), 0) : Math.max(0, g - (first.gold0 || 0));
    const [num, title] = EPS[id] || ['', String(id || '').toUpperCase()];
    const d = { id, num, title, deaths: sum('deaths'), takes: sum('deaths') + 1, time: sum('time'), falls: sum('falls'), clues, gold,
      rehearsal: !!(state.immune || window.__presenter || (state.settings && state.settings.presenter) || state.presenter) };
    d.grade = gradeOf(d);
    return d;
  },
  // The report. data from collect(scene) (or made up by a test); done runs once, when it goes.
  show(scene, data, done) {
    const d = data || results.collect(scene);
    let over = false;
    const finish = () => {
      if (over) return; over = true; slip = null;
      window.removeEventListener('keydown', key, true); window.removeEventListener('pointerdown', key, true);
      clearTimeout(timer); if (sr) sr.textContent = '';
      window.__results = null;
      if (done) done();
    };
    // any key or a click moves on, after a moment (a key still held from play does not count)
    const key = ev => { if (ev.repeat || performance.now() / 1000 - (slip ? slip.t0 : 0) < 0.25) return; ev.preventDefault(); ev.stopPropagation(); finish(); };
    if (window.__noResults || !ensure()) { setTimeout(finish, 0); return finish; }
    slip = { data: d, t0: performance.now() / 1000, thunk: false };
    window.__results = d;
    sr.textContent = 'Continuity report, episode ' + d.num + ', ' + d.title.toLowerCase() + '. Takes ' + d.takes + ', time ' + fmtTime(d.time) + ', falls ' + d.falls + ', clues ' + d.clues + (d.gold != null ? ', gold ' + d.gold : '') + ', operator none. Stamped ' + d.grade + '.';
    window.addEventListener('keydown', key, true); window.addEventListener('pointerdown', key, true);
    const timer = setTimeout(finish, SLIP_MS);
    kick();
    return finish;
  },
  get up() { return !!slip; },
  // End an episode: the report, then the next step (goNext). fallback runs if there is none.
  // Drop-in for goNext(this, step) at each episode's end.
  next(scene, step, fallback) {
    results.show(scene, null, () => { if (!goNext(scene, step) && fallback) fallback(); });
    return true;
  }
};
if (typeof window !== 'undefined') window.__feel = Object.assign(window.__feel || {}, { results, gradeOf });
