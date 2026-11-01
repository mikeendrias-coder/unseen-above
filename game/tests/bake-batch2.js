// Bakes three new routing levels for satellite batch 2 (6 x 6 with walls, one wrapping) and
// appends them to src/data/routing-levels.json. Unique solutions only.
const Z = require('../src/core/zip-logic.js');
const fs = require('fs');
const file = __dirname + '/../src/data/routing-levels.json';
const levels = JSON.parse(fs.readFileSync(file, 'utf8')).filter(l => !l.id.startsWith('b2'));
const g = (w, h, o) => walls => Z.gridBoard(w, h, Object.assign({}, o, { walls }));
function best(makeBoard, opts, seeds, score) {
  const out = [];
  for (const seed of seeds) { try { const p = Z.generate(makeBoard, Object.assign({}, opts, { seed })); const v = Z.solve(p.board, p.checkpoints, { limit: 2, budget: 2e7 }); if (v.count === 1 && !v.exhausted) out.push(p); } catch (e) {} }
  out.sort(score); return out[0];
}
const fewer = (a, b) => a.checkpoints.length - b.checkpoints.length;
const wallsFirst = (a, b) => (b.walls.length > 1) - (a.walls.length > 1) || fewer(a, b);
const add = (id, title, w, h, wrapX, p) => levels.push({ id, title, kind: 'grid', w, h, wrapX, walls: p.walls, checkpoints: p.checkpoints, solution: p.solution, variant: null });
let p = best(g(6, 6), { allowWalls: true, wallBias: 0.7 }, Array.from({ length: 40 }, (_, i) => 300 + i), wallsFirst); add('b2a', 'Relay', 6, 6, false, p); console.log('b2a', p.checkpoints.length, 'cps', p.walls.length, 'walls');
p = best(g(6, 6), { allowWalls: true, wallBias: 0.5 }, Array.from({ length: 40 }, (_, i) => 400 + i), fewer); add('b2b', 'Uplink', 6, 6, false, p); console.log('b2b', p.checkpoints.length, 'cps', p.walls.length, 'walls');
p = best(g(6, 6, { wrapX: true }), { allowWalls: true }, Array.from({ length: 40 }, (_, i) => 500 + i), fewer); add('b2c', 'Pass', 6, 6, true, p); console.log('b2c', p.checkpoints.length, 'cps', p.walls.length, 'walls');
fs.writeFileSync(file, JSON.stringify(levels));
console.log('levels now', levels.map(l => l.id).join(' '));
