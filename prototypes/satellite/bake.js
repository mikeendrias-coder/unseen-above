const Z = require('./zip-logic.js');
const fs = require('fs');
function best(label, makeBoard, baseOpts, seeds, pick) {
  const results = [];
  for (const seed of seeds) {
    try {
      const p = Z.generate(makeBoard, Object.assign({}, baseOpts, { seed }));
      const v = Z.solve(p.board, p.checkpoints, { limit: 2, budget: 2e7 });
      if (v.count !== 1 || v.exhausted) continue;
      results.push({ seed, p });
    } catch (e) {}
  }
  results.sort(pick);
  const r = results[0];
  console.log(label, 'seed', r.seed, 'cps', r.p.checkpoints.length, 'walls', r.p.walls.length, 'of', results.length);
  return r.p;
}
const byFewest = (a, b) => a.p.checkpoints.length - b.p.checkpoints.length;
const near = t => (a, b) => Math.abs(a.p.checkpoints.length - t) - Math.abs(b.p.checkpoints.length - t);
const seeds = n => Array.from({ length: n }, (_, i) => i + 1);
const levels = [];
const g = (w, h, o) => walls => Z.gridBoard(w, h, Object.assign({}, o, { walls }));
let p;
p = best('basic5', g(5, 5), {}, seeds(30), near(8));
levels.push({ id: 'basic', title: 'Basic route', kind: 'grid', w: 5, h: 5, wrapX: false, walls: p.walls, checkpoints: p.checkpoints, solution: p.solution, variant: null });
p = best('walls6', g(6, 6), { allowWalls: true, wallBias: 0.6 }, seeds(40), (a, b) => (b.p.walls.length > 0) - (a.p.walls.length > 0) || byFewest(a, b));
levels.push({ id: 'walls', title: 'Blocked links', kind: 'grid', w: 6, h: 6, wrapX: false, walls: p.walls, checkpoints: p.checkpoints, solution: p.solution, variant: null });
p = best('orbit6', g(6, 6, { wrapX: true }), { allowWalls: true }, seeds(40), byFewest);
levels.push({ id: 'orbit', title: 'Orbit edges', kind: 'grid', w: 6, h: 6, wrapX: true, walls: p.walls, checkpoints: p.checkpoints, solution: p.solution, variant: null });
p = best('rotate6', g(6, 6), { allowWalls: true }, seeds(40).map(s => s + 100), near(9));
levels.push({ id: 'rotate', title: 'Rotating board', kind: 'grid', w: 6, h: 6, wrapX: false, walls: p.walls, checkpoints: p.checkpoints, solution: p.solution, variant: 'rotate' });
p = best('moving6', g(6, 6), { allowWalls: true, initialCheckpoints: 2 }, seeds(40).map(s => s + 200), byFewest);
levels.push({ id: 'moving', title: 'Drifting dots', kind: 'grid', w: 6, h: 6, wrapX: false, walls: p.walls, checkpoints: p.checkpoints, solution: p.solution, variant: 'moving' });
p = best('cube2', () => Z.cubeBoard(2), { budget: 1e6 }, seeds(25), byFewest);
levels.push({ id: 'cube2', title: 'Small cube', kind: 'cube', m: 2, walls: [], checkpoints: p.checkpoints, solution: p.solution, variant: 'cube' });
p = best('cube3', () => Z.cubeBoard(3), { budget: 1e6 }, seeds(8).map(s => s * 31), byFewest);
levels.push({ id: 'cube3', title: 'Full cube', kind: 'cube', m: 3, walls: [], checkpoints: p.checkpoints, solution: p.solution, variant: 'cube' });
fs.writeFileSync('levels.json', JSON.stringify(levels));
console.log('wrote', levels.length, 'levels', fs.statSync('levels.json').size, 'bytes');
