// The satellite screen in all four looks, with a partly drawn line.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  for (const skin of [1, 2, 3, 4]) {
    await p.goto(`${BASE}/local.html?scene=satellite&skin=${skin}`);
    await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.level, null, { timeout: 30000 });
    await p.evaluate(() => { const s = window.__game.scene; s.loadLevel(1); s.path = s.level.solution.slice(0, 20); });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `tests/out/sat-${skin}.png` });
  }
  // solve one level by dragging the solution path with the mouse
  await p.goto(BASE + '/local.html?scene=satellite&skin=4'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.level, null, { timeout: 30000 });
  const pts = await p.evaluate(() => { const s = window.__game.scene, cam = s.cameras.main, canvas = s.game.canvas.getBoundingClientRect(), k = canvas.width / s.game.canvas.width; return s.level.solution.map(c => { const w = s.center(c); const sx = (w.x - cam.worldView.x) * cam.zoom * k + canvas.left, sy = (w.y - cam.worldView.y) * cam.zoom * k + canvas.top; return [sx, sy]; }); });
  await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down();
  for (const [x, y] of pts.slice(1)) await p.mouse.move(x, y, { steps: 3 });
  await p.mouse.up(); await p.waitForTimeout(800);
  console.log('solved by mouse:', await p.evaluate(() => window.__game.scene.solved), 'path', await p.evaluate(() => window.__game.scene.path.length));
  await p.screenshot({ path: 'tests/out/sat-win.png' });
  console.log(errs.slice(0, 8).join('\n') || 'no errors');
  await b.close();
})();
