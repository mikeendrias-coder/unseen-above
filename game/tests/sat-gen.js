// Makes the satellite's puzzle levels (src/data/globe-levels.json): node tests/sat-gen.js [ids...]
// (with ids, only those levels are made again; the rest are kept from the file).
// The orbit ring is drawn by hand. Each globe is a random maze with a target that walks a path on
// its own clock; the solver (sat/globe-logic.js solve) keeps a candidate only if it can always be
// finished (no state a player can reach, turning fast or slow, is a dead end) and then the batch
// keeps the hardest one in its range (the most turns in the shortest plan).
//   batch 1 (g1): one-way gates, a walking target                    6 x 12
//   batch 2 (g2): two beads, two targets walking as a convoy          6 x 12
//   batch 3 (g3): blurred patches, a faster target                    7 x 14
//   batch 4 (g4): the girl runs a long loop round the Earth, partly under the blur, with gates,
//                 fastest; the hardest                                8 x 16
//   show: the kids' room screen plays a short one by itself
const fs = require('fs');
const path = require('path');
const G = require('./sat-lib.js')();
const FILE = path.join(__dirname, '../src/data/globe-levels.json');
const only = process.argv.slice(2);
const old = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const R = G.rng(20261118);
const pick = a => a[Math.floor(R() * a.length)];

const ring = { id: 'ring', kind: 'ring', ring: { walls: [[0, 3], [0, 12], [1, 9], [1, 14], [2, 2]], holes: [[0, 11], [1, 13]] }, beads: [{ start: 8, target: 37 }], o0: 15 };

// undirected open neighbors (a target walks a groove either way, gates or not)
const nbs = (B, i) => { const r = Math.floor(i / B.cols), c = i % B.cols, o = [r * B.cols + (c + 1) % B.cols, r * B.cols + (c + B.cols - 1) % B.cols]; if (r + 1 < B.rows) o.push(i + B.cols); if (r > 0) o.push(i - B.cols); return o.filter(j => B.isOpen(i, j)); };
// a back-and-forth path: a random walk that never crosses itself
function linePath(B, len, avoid) {
  for (let t = 0; t < 300; t++) {
    const w = [Math.floor(R() * B.n)]; if (avoid(w[0])) continue;
    while (w.length < len) { const nx = nbs(B, w[w.length - 1]).filter(j => !w.includes(j) && !avoid(j)); if (!nx.length) break; w.push(pick(nx)); }
    if (w.length === len) return w;
  }
  return null;
}
// loops: for each open groove, the shortest way round without it
function loops(B, lo, hi) {
  const out = [], seen = new Set();
  for (let a = 0; a < B.n; a++) nbs(B, a).forEach(b => {
    if (b < a) return;
    const prev = new Int32Array(B.n).fill(-2), q = [a]; prev[a] = -1;
    for (let h = 0; h < q.length && prev[b] === -2; h++) nbs(B, q[h]).forEach(j => { if (prev[j] === -2 && !(q[h] === a && j === b)) { prev[j] = q[h]; q.push(j); } });
    if (prev[b] === -2) return;
    const p = []; for (let x = b; x !== -1; x = prev[x]) p.unshift(x);
    const key = p.slice().sort((x, y) => x - y).join(',');
    if (p.length >= lo && p.length <= hi && !seen.has(key)) { seen.add(key); out.push(p); }
  });
  return out;
}
// a patch of linked cells
function patch(B, size, ok, seed) {
  for (let t = 0; t < 200; t++) {
    const p = [seed != null ? seed : Math.floor(R() * B.n)]; if (!ok(p[0])) continue;
    while (p.length < size) { const nx = p.flatMap(c => nbs(B, c)).filter(j => !p.includes(j) && ok(j)); if (!nx.length) break; p.push(pick(nx)); }
    if (p.length === size) return p;
    if (seed != null) return null;
  }
  return null;
}

// spec: { id, grid, loops (extra maze loops), tick, speed, beads 1|2, path: 'line'|'loop', len [lo, hi],
//   blur: [patches, size], hideIn (cells of her loop under the blur), gates (rounds), turns [lo, hi],
//   tries }. First many cheap candidates (the shortest plan only), then the longest ones get their
//   gates and the full check, and the first that passes is kept.
function candidate(spec, t) {
  const links = G.mazeLinks(spec.seed + t * 7919, spec.loops, spec.grid);
  const L = { id: spec.id, kind: 'globe', grid: spec.grid, links, tick: spec.tick, speed: spec.speed, beads: [] };
  let B = G.buildBoard(L);
  const s0 = Math.floor(R() * B.n), d0 = B.dist(s0);
  if (spec.path === 'loop') {
    const ls = loops(B, spec.len[0], spec.len[1]).filter(p => !p.includes(s0) && p.every(c => d0[c] >= 3));
    if (!ls.length) return null;
    const p = pick(ls); L.beads.push({ start: s0, path: p, loop: true, i0: Math.floor(R() * p.length), d0: R() < 0.5 ? 1 : -1 });
  } else {
    const len = spec.len[0] + Math.floor(R() * (spec.len[1] - spec.len[0] + 1));
    const p = linePath(B, len, c => c === s0 || d0[c] < 4); if (!p) return null;
    L.beads.push({ start: s0, path: p, loop: false, i0: Math.floor(R() * len), d0: 1 });
  }
  if (spec.beads === 2) {
    const p0 = L.beads[0].path, used = new Set(p0.concat([s0]));
    const s1 = Math.floor(R() * B.n); if (used.has(s1)) return null;
    const p1 = linePath(B, p0.length, c => used.has(c) || c === s1 || B.dist(s1)[c] < 4); if (!p1) return null;
    L.beads.push({ start: s1, path: p1, loop: false, i0: L.beads[0].i0, d0: L.beads[0].d0 });
    L.convoy = true;
  }
  const onPath = new Set(L.beads.flatMap(b => b.path)), starts = new Set(L.beads.map(b => b.start));
  // the blur: some of her loop (she hides there), and patches elsewhere
  const blur = [];
  if (spec.hideIn) {
    const p = L.beads[0].path, at = Math.floor(R() * p.length);
    for (let q = 0; q < spec.hideIn; q++) blur.push(p[(at + q) % p.length]);
    if (blur.includes(p[L.beads[0].i0])) L.beads[0].i0 = (at + spec.hideIn) % p.length;
  }
  for (let q = 0; q < (spec.blur || [0])[0]; q++) {
    const pt = patch(B, spec.blur[1], c => !starts.has(c) && !onPath.has(c) && !blur.includes(c) && !nbs(B, c).some(j => starts.has(j)));
    if (!pt) return null; blur.push(...pt);
  }
  if (blur.length) L.blur = blur;
  B = G.buildBoard(L);
  L.o0 = G.lowOrientation(B, s0);
  const plan = G.planFrom(B, L, G.startState(B, L));
  return plan ? { L, turns: plan.filter(m => m < 4).length } : null;
}
function addGates(spec, L, turns) {
  L.gates = []; let cur = turns;
  for (let round = 0; round < spec.gates; round++) {
    let pickG = null;
    for (let g = 0; g < 10; g++) {
      const [a, b] = pick(L.links); if (L.gates.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue;
      const gate = R() < 0.5 ? [a, b] : [b, a]; L.gates.push(gate);
      const B2 = G.buildBoard(L), p2 = G.planFrom(B2, L, G.startState(B2, L)); L.gates.pop();
      if (p2) { const tn = p2.filter(m => m < 4).length; if (tn >= cur && tn <= spec.turns[1] && (!pickG || tn > pickG.tn)) pickG = { gate, tn }; }
    }
    if (pickG) { L.gates.push(pickG.gate); cur = pickG.tn; }
  }
  if (!L.gates.length) delete L.gates;
  return cur;
}
function make(spec) {
  const t0 = Date.now(), cands = [];
  for (let t = 0; t < spec.tries; t++) { const c = candidate(spec, t); if (c && c.turns <= spec.turns[1] - (spec.gates ? 3 : 0)) cands.push(c); }
  cands.sort((a, b) => b.turns - a.turns);
  console.log('  ' + spec.id + ': ' + cands.length + ' candidates, longest ' + cands.slice(0, 8).map(c => c.turns).join(' ') + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  for (const c of cands.slice(0, 12)) {
    if (spec.gates) { const tn = addGates(spec, c.L, c.turns); if (!c.L.gates || tn <= c.turns) continue; }
    const r = G.solve(G.buildBoard(c.L), c.L);
    console.log('    ' + (c.L.gates ? c.L.gates.length + ' gates, ' : '') + r.turns + ' turns ' + r.waits + ' waits, ' + r.states + ' states, ' + r.stuck + ' stuck (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
    if (r.ok && !r.stuck && r.turns >= spec.turns[0] && r.turns <= spec.turns[1]) return { L: c.L, r };
  }
  return null;
}
function report(name, x) { console.log(name, x ? 'turns ' + x.r.turns + ' waits ' + x.r.waits + ' states ' + x.r.states + ' reach ' + x.r.reach + ' stuck ' + x.r.stuck + ' plan ' + x.r.plan.join('') : 'NONE'); }

const SPECS = {
  g1: { id: 'g1', seed: 101, grid: { rows: 6, cols: 12 }, loops: 4, tick: 1.4, speed: 3, beads: 1, path: 'loop', len: [6, 10], gates: 4, turns: [26, 40], tries: 260 },
  g2: { id: 'g2', seed: 202, grid: { rows: 6, cols: 12 }, loops: 4, tick: 1.4, speed: 3, beads: 2, path: 'line', len: [4, 5], turns: [26, 40], tries: 120 },
  g3: { id: 'g3', seed: 303, grid: { rows: 7, cols: 14 }, loops: 5, tick: 1.0, speed: 3, beads: 1, path: 'line', len: [6, 8], blur: [3, 3], turns: [30, 46], tries: 260 },
  g4: { id: 'g4', seed: 404, grid: { rows: 8, cols: 16 }, loops: 7, tick: 0.8, speed: 2, beads: 1, path: 'loop', len: [12, 20], hideIn: 3, blur: [2, 3], gates: 3, turns: [36, 60], tries: 260 },
  show: { id: 'show', seed: 505, grid: { rows: 6, cols: 12 }, loops: 6, tick: 1.6, speed: 3, beads: 1, path: 'line', len: [4, 5], turns: [4, 9], tries: 200 }
};
const out = [ring];
['g1', 'g2', 'g3', 'g4', 'show'].forEach(id => {
  if (only.length && !only.includes(id)) { out.push(old.find(l => l.id === id)); console.log(id, 'kept'); return; }
  const x = make(SPECS[id]); report(id, x);
  out.push(x ? x.L : old.find(l => l.id === id));
});
fs.writeFileSync(FILE, '[\n' + out.map(L => '  ' + JSON.stringify(L)).join(',\n') + '\n]\n');
console.log('wrote', out.length, 'levels');
