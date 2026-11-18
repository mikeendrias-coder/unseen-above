// Checks every satellite puzzle in src/data/globe-levels.json with the solver (no browser):
// each can be solved, and no state a player can reach is a dead end (with drift: whichever
// place the target has drifted to). node tests/sat-solve.js
const G = require('./sat-lib.js')();
const LEVELS = require('../src/data/globe-levels.json');
const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
const need = ['ring', 'g1', 'g2', 'g3', 'g4', 'show'];
ok('all puzzles are there (' + LEVELS.map(l => l.id).join(' ') + ')', need.every(id => LEVELS.some(l => l.id === id)));
LEVELS.forEach(L => {
  const B = G.buildBoard(L), t0 = Date.now(), r = G.solve(B, L);
  ok(L.id + ': solvable in ' + r.steps + ' turns, ' + r.states + ' states, ' + r.stuck + ' dead ends (' + (Date.now() - t0) + ' ms)', r.ok && r.stuck === 0);
});
const g1 = LEVELS.find(l => l.id === 'g1');
const free = Object.assign({}, g1, { gates: [] }), r0 = G.solve(G.buildBoard(free), free), r1 = G.solve(G.buildBoard(g1), g1);
ok('the one-way gates matter in batch 1 (' + r0.steps + ' turns without them, ' + r1.steps + ' with)', r1.steps > r0.steps);
