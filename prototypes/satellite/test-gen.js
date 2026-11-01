const Z = require('./zip-logic.js');
function run(label, makeBoard, opts) {
  const t0 = Date.now();
  try {
    const p = Z.generate(makeBoard, opts);
    const ms = Date.now() - t0;
    const r = Z.solve(p.board, p.checkpoints, { limit: 3, budget: 2e7 });
    console.log(label.padEnd(10), 'n=', p.board.n, 'cps=', p.checkpoints.length, 'walls=', p.walls.length, 'ms=', ms, 'verify=', r.count, r.exhausted ? 'EXHAUSTED' : '');
    return p;
  } catch (e) { console.log(label, 'FAILED', e.message, Date.now() - t0, 'ms'); }
}
for (let s = 1; s <= 4; s++) run('grid5 s' + s, w => Z.gridBoard(5, 5, { walls: w }), { seed: s });
for (let s = 1; s <= 4; s++) run('grid6 s' + s, w => Z.gridBoard(6, 6, { walls: w }), { seed: s * 7, allowWalls: true });
for (let s = 1; s <= 3; s++) run('grid7 s' + s, w => Z.gridBoard(7, 7, { walls: w }), { seed: s * 3, allowWalls: true });
for (let s = 1; s <= 3; s++) run('orbit6 s' + s, w => Z.gridBoard(6, 6, { wrapX: true, walls: w }), { seed: s * 13, allowWalls: true });
for (let s = 1; s <= 3; s++) run('cube3 s' + s, () => Z.cubeBoard(3), { seed: s * 31, budget: 1e6 });
