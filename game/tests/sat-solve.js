// Checks every satellite puzzle in src/data/globe-levels.json with the solver (no browser).
// Every globe has a walking target. The solver's state is the orientation, the beads, every
// target's place and heading, and (slow model) the turns made since the targets last stepped.
// It proves for each puzzle: it can be solved; and from every state a player can reach, turning
// as fast as they like, it can still be finished with at most L.speed turns between two target
// steps, even right after using them all up (no dead ends, nothing that needs fast hands).
// node tests/sat-solve.js
const G = require('./sat-lib.js')();
const LEVELS = require('../src/data/globe-levels.json');
const ok = (label, v) => { console.log((v ? 'ok   ' : 'FAIL ') + label); if (!v) process.exitCode = 1; };
const need = ['ring', 'g1', 'g2', 'g3', 'g4', 'show'];
ok('all puzzles are there (' + LEVELS.map(l => l.id).join(' ') + ')', need.every(id => LEVELS.some(l => l.id === id)));
const R = {};
LEVELS.forEach(L => {
  const B = G.buildBoard(L), t0 = Date.now(), r = R[L.id] = G.solve(B, L);
  const how = L.kind === 'ring' ? '' : ' (' + B.rows + 'x' + B.cols + ', a step every ' + L.tick + ' s, ' + G.speedOf(L) + ' turns a step)';
  ok(L.id + how + ': ' + r.turns + ' turns and ' + r.waits + ' waits; ' + r.reach + ' states reachable, ' + r.states + ' checked, ' + r.stuck + ' dead ends (' + (Date.now() - t0) + ' ms)', r.ok && r.stuck === 0);
});
LEVELS.filter(L => L.kind === 'globe').forEach(L => ok(L.id + ': every target walks (' + L.beads.map(b => (b.loop ? 'loop of ' : 'line of ') + b.path.length).join(', ') + ')', L.beads.every(b => b.path && b.path.length > 2 && L.tick > 0)));
// the gimmicks are there, and combined
const g = id => LEVELS.find(l => l.id === id);
ok('batch 1 has one-way gates (' + (g('g1').gates || []).length + ')', (g('g1').gates || []).length > 0);
ok('batch 2 has two beads and two walking targets', g('g2').beads.length === 2 && g('g2').beads.every(b => b.path));
ok('batch 3 has blur and a quicker target than batches 1 and 2', (g('g3').blur || []).length > 0 && g('g3').tick < g('g1').tick && g('g3').tick < g('g2').tick);
const g4 = g('g4'), hide = g4.beads[0].path.filter(c => (g4.blur || []).includes(c)).length;
ok('batch 4: the girl runs a loop of ' + g4.beads[0].path.length + ', ' + hide + ' cells of it under the blur, the fastest clock, gates', g4.beads[0].loop && hide > 0 && LEVELS.every(L => L === g4 || !L.tick || L.tick > g4.tick) && (g4.gates || []).length > 0);
ok('batch 4 is the hardest (' + ['g1', 'g2', 'g3', 'g4'].map(id => id + ' ' + R[id].turns).join(', ') + ' turns)', ['g1', 'g2', 'g3'].every(id => R.g4.turns > R[id].turns));
const free = Object.assign({}, g('g1'), { gates: [] }), r0 = G.solve(G.buildBoard(free), free);
ok('the one-way gates matter in batch 1 (' + r0.turns + ' turns without them, ' + R.g1.turns + ' with)', R.g1.turns !== r0.turns || R.g1.waits !== r0.waits);
