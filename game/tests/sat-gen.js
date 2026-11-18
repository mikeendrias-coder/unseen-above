// Makes the satellite's puzzle levels (src/data/globe-levels.json): node tests/sat-gen.js
// The orbit ring is drawn by hand; each globe is a random maze picked by the solver so that it
// can always be finished (no state it can reach is a dead end) and takes a fair number of turns.
const fs = require('fs');
const path = require('path');
const G = require('./sat-lib.js')();
const { GLOBE } = G;
const n = GLOBE.rows * GLOBE.cols, cols = GLOBE.cols;
const R = G.rng(20261117);
const pick = a => a[Math.floor(R() * a.length)];

const ring = { id: 'ring', kind: 'ring', ring: { walls: [[0, 3], [0, 12], [1, 9], [1, 14], [2, 2]], holes: [[0, 11], [1, 13]] }, beads: [{ start: 8, target: 37 }], o0: 15 };

function finish(L) { const B = G.buildBoard(L); L.o0 = G.lowOrientation(B, L.beads[0].start); const r = G.solve(G.buildBoard(L), L); return r; }
function base(id, seed, loops, beads, lo, hi, extra, minDist) {
  let best = null;
  for (let t = 0; t < 400 && !best; t++) {
    const links = G.mazeLinks(seed + t * 7919, loops), B0 = G.buildBoard({ kind: 'globe', links });
    const s = Math.floor(R() * n), d = B0.dist(s);
    const far = [...Array(n).keys()].filter(i => d[i] >= (minDist || 7) && Math.floor(i / cols) !== Math.floor(s / cols));
    if (!far.length) continue;
    const L = Object.assign({ id, kind: 'globe', links, beads: [{ start: s, target: pick(far) }] }, extra ? extra(B0, s) : {});
    if (beads === 2) {
      const s2 = Math.floor(R() * n), d2 = B0.dist(s2), far2 = [...Array(n).keys()].filter(i => d2[i] >= 6 && i !== s && i !== L.beads[0].target);
      if (s2 === s || !far2.length) continue;
      L.beads.push({ start: s2, target: pick(far2) });
    }
    if (!L) continue;
    const r = finish(L);
    if (r.ok && r.stuck === 0 && r.steps >= lo && r.steps <= hi) { best = { L, r }; }
  }
  return best;
}
function report(name, x) { console.log(name, x ? 'steps ' + x.r.steps + ' states ' + x.r.states + ' stuck ' + x.r.stuck + ' plan ' + x.r.plan.join('') : 'NONE'); }

const out = [ring];
report('ring', { r: G.solve(G.buildBoard(ring), ring) });
// batch 1: one-way gates. Start from a maze, then add gates the solution must respect.
const g1 = base('g1', 101, 4, 1, 14, 22);
report('g1 base', g1);
{
  const L = g1.L; L.gates = [];
  // greedy: each round, of 40 random gates keep the one that lengthens the solution most
  for (let round = 0; round < 4; round++) {
    let best = null;
    for (let t = 0; t < 40; t++) {
      const [a, b] = pick(L.links); if (L.gates.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue;
      const gate = R() < 0.5 ? [a, b] : [b, a];
      L.gates.push(gate); const r = finish(L); L.gates.pop();
      if (r.ok && r.stuck === 0 && r.steps <= 34 && (!best || r.steps > best.r.steps)) best = { gate, r };
    }
    if (best) { L.gates.push(best.gate); g1.r = best.r; }
  }
  report('g1 gates ' + JSON.stringify(L.gates), g1);
  out.push(L);
}
// batch 2: two beads, two targets
const g2 = base('g2', 202, 5, 2, 18, 34); report('g2', g2); out.push(g2.L);
// batch 3: a blurred patch, and a target that drifts along a short walk
const g3 = base('g3', 303, 4, 1, 14, 26, (B0, s) => {
  const free = c => c !== s;
  // the drift: a walk of four linked cells
  let walk = null;
  for (let t = 0; t < 50 && !walk; t++) { const w = [Math.floor(R() * n)]; while (w.length < 4) { const nx = B0.adj[w[w.length - 1]].filter(j => !w.includes(j)); if (!nx.length) break; w.push(pick(nx)); } if (w.length === 4 && w.every(free) && B0.dist(s)[w[0]] >= 6) walk = w; }
  if (!walk) return { drift: [0] };
  // the blur: three linked cells away from the walk and the start
  let blob = null;
  for (let t = 0; t < 50 && !blob; t++) { const b = [Math.floor(R() * n)]; while (b.length < 3) { const nx = B0.adj[b[b.length - 1]].filter(j => !b.includes(j)); if (!nx.length) break; b.push(pick(nx)); } if (b.length === 3 && b.every(c => free(c) && !walk.includes(c) && B0.adj[c].every(j => j !== s))) blob = b; }
  return { drift: walk.concat(walk.slice(1, -1).reverse()), blur: blob || [] };
});
if (g3) { g3.L.beads[0].target = g3.L.drift[0]; }
report('g3', g3); out.push(g3.L);
// batch 4: the Earth, the girl in pink
const g4 = base('g4', 404, 4, 1, 16, 26); report('g4', g4); out.push(g4.L);
// the kids' room screen plays a short one by itself
const show = base('show', 505, 6, 1, 4, 8, null, 3); report('show', show); out.push(show.L);
out.forEach(L => { if (L.kind === 'globe') L.links = L.links.map(([a, b]) => [a, b]); });
fs.writeFileSync(path.join(__dirname, '../src/data/globe-levels.json'), '[\n' + out.map(L => '  ' + JSON.stringify(L)).join(',\n') + '\n]\n');
console.log('wrote', out.length, 'levels');
