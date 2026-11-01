const { chromium } = require('playwright');
const ver = process.argv[2] || 'p4';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(`http://localhost:8765/routing-${ver}.html`);
  await page.waitForFunction(() => window.__routingGame && window.__routingGame.scene.getScene('routing') && window.__routingGame.scene.getScene('routing').view);
  const sc = f => page.evaluate(f);
  // cube openings: is number 1 on a visible face?
  for (const i of [5, 6]) {
    await page.evaluate(i => window.__routingGame.scene.getScene('routing').loadLevel(i), i);
    const r = await sc(() => { const s = window.__routingGame.scene.getScene('routing'), v = s.view; const f = s.board.cells[s.checkpoints[0]].face; return v.faceVisible(v.R, f); });
    console.log('cube level', i + 1, 'number 1 visible at start:', r);
  }
  await page.screenshot({ path: `/home/claude/game/tests/${ver}-cube3-start.png` });
  // rotate level, "at each number" mode
  await page.evaluate(() => window.__routingGame.scene.getScene('routing').loadLevel(3));
  await sc(() => { const s = window.__routingGame.scene.getScene('routing'); s.rotateMode = 'number'; s.loadLevel(3); });
  const L = await sc(() => window.ROUTING_LEVELS[3]);
  const cellPt = c => page.evaluate(c => { const g = window.__routingGame, s = g.scene.getScene('routing'), v = s.view, rect = g.canvas.getBoundingClientRect(); const p = v.center(c), r = v.root.rotation, cs = Math.cos(r), sn = Math.sin(r); const wx = v.root.x + p.x * cs - p.y * sn, wy = v.root.y + p.x * sn + p.y * cs; return { x: rect.left + wx * rect.width / 960, y: rect.top + wy * rect.height / 540 }; }, c);
  const second = L.checkpoints[1], idx2 = L.solution.indexOf(second);
  let p = await cellPt(L.solution[0]); await page.mouse.move(p.x, p.y); await page.mouse.down();
  for (let i = 1; i <= idx2; i++) { p = await cellPt(L.solution[i]); await page.mouse.move(p.x, p.y, { steps: 3 }); }
  await page.mouse.up(); await sleep(700);
  const rot = await sc(() => { const s = window.__routingGame.scene.getScene('routing'); return { rotation: +s.view.root.rotation.toFixed(3), path: s.path.length, sub: s.sub.text }; });
  console.log('number-mode turn after reaching 2:', JSON.stringify(rot));
  await page.screenshot({ path: `/home/claude/game/tests/${ver}-rotate-number-mode.png` });
  // continue drawing after the turn: press the end of the line and go on
  p = await cellPt(L.solution[idx2]); await page.mouse.move(p.x, p.y); await page.mouse.down();
  for (let i = idx2 + 1; i < Math.min(L.solution.length, idx2 + 4); i++) { p = await cellPt(L.solution[i]); await page.mouse.move(p.x, p.y, { steps: 3 }); }
  await page.mouse.up();
  console.log('continued after turn, path length:', await sc(() => window.__routingGame.scene.getScene('routing').path.length), 'expected', Math.min(L.solution.length, idx2 + 4));
  console.log('errors:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
})();
