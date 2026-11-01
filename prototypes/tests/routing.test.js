const { chromium } = require('playwright');
const ver = process.argv[2] || 'p4';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(`http://localhost:8765/routing-${ver}.html`);
  await page.waitForFunction(() => window.__routingGame && window.__routingGame.scene.getScene('routing') && window.__routingGame.scene.getScene('routing').view, null, { timeout: 15000 });
  await page.waitForTimeout(500);
  const shot = n => page.screenshot({ path: `/home/claude/game/tests/${ver}-${n}.png` });
  await shot('01-start');
  // helper: page coords for a cell centre
  const cellPt = async c => page.evaluate(c => {
    const g = window.__routingGame, s = g.scene.getScene('routing'), v = s.view, rect = g.canvas.getBoundingClientRect();
    let wx, wy;
    if (v.center) { const p = v.center(c), r = v.root.rotation, cs = Math.cos(r), sn = Math.sin(r); wx = v.root.x + p.x * cs - p.y * sn; wy = v.root.y + p.x * sn + p.y * cs; }
    else { const p = v.proj(v.R, s.board.cells[c].p); wx = p.x; wy = p.y; }
    return { x: rect.left + wx * rect.width / 960, y: rect.top + wy * rect.height / 540 };
  }, c);
  const st = () => page.evaluate(() => { const s = window.__routingGame.scene.getScene('routing'); return { level: s.levelIndex, len: s.path.length, n: s.board.n, solved: s.solved, cps: s.checkpoints.slice() }; });
  async function drawSolution(sol, wrapW) {
    let p = await cellPt(sol[0]);
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    for (let i = 1; i < sol.length; i++) {
      const a = sol[i - 1], b = sol[i];
      const isWrap = wrapW && Math.floor(a / wrapW) === Math.floor(b / wrapW) && Math.abs((a % wrapW) - (b % wrapW)) === wrapW - 1;
      if (isWrap) {
        const pa = await cellPt(a), pb = await cellPt(b);
        const dir = (a % wrapW) === 0 ? -1 : 1; // leaving left or right
        await page.mouse.move(pa.x + dir * 70, pa.y, { steps: 6 });
        await page.mouse.up();
        await page.mouse.move(pb.x, pb.y); await page.mouse.down();
        continue;
      }
      p = await cellPt(b);
      await page.mouse.move(p.x, p.y, { steps: 4 });
    }
    await page.mouse.up();
  }
  const sel = i => page.evaluate(i => window.__routingGame.scene.getScene('routing').loadLevel(i), i);
  const levels = await page.evaluate(() => window.ROUTING_LEVELS.map(l => ({ id: l.id, w: l.w, wrapX: l.wrapX, solution: l.solution, kind: l.kind })));
  // 1 basic: draw by hand
  await drawSolution(levels[0].solution);
  console.log('basic', JSON.stringify(await st()));
  await shot('02-basic-solved');
  // 2 walls
  console.log('-> walls'); await sel(1); await drawSolution(levels[1].solution); console.log('walls', JSON.stringify(await st()));
  // 3 orbit with wrap moves
  console.log('-> orbit'); await sel(2); console.log('   loaded'); await drawSolution(levels[2].solution, levels[2].w); console.log('orbit', JSON.stringify(await st()));
  await shot('03-orbit-solved');
  // undo test on basic: draw 4 cells then drag back 2
  await sel(0);
  { const s0 = levels[0].solution; let p = await cellPt(s0[0]); await page.mouse.move(p.x, p.y); await page.mouse.down();
    for (let i = 1; i < 5; i++) { p = await cellPt(s0[i]); await page.mouse.move(p.x, p.y, { steps: 4 }); }
    p = await cellPt(s0[2]); await page.mouse.move(p.x, p.y, { steps: 8 }); await page.mouse.up();
    console.log('undo to 3 cells ->', (await st()).len); }
  // 4 rotate: wait for the warning and the turn
  await sel(3); await page.waitForTimeout(11000); await shot('04-rotate-warning'); await page.waitForTimeout(2200);
  console.log('rotate rotation', await page.evaluate(() => window.__routingGame.scene.getScene('routing').view.root.rotation.toFixed(3)));
  await shot('05-rotated');
  // draw the solution on the rotated board
  await drawSolution(levels[3].solution); console.log('rotate solved?', JSON.stringify(await st()));
  // 5 drifting dots: watch one cycle
  await sel(4); const before = (await st()).cps; await page.waitForTimeout(8000); await shot('06-drift-warning'); await page.waitForTimeout(1800);
  const after = (await st()).cps; console.log('drift moved:', JSON.stringify(before) !== JSON.stringify(after), JSON.stringify(before), JSON.stringify(after));
  // 6 small cube: show me
  await sel(5); await shot('07-cube2');
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500); await shot('08-cube2-turned');
  await page.evaluate(() => window.__routingGame.scene.getScene('routing').autoSolve()); await page.waitForTimeout(3000);
  console.log('cube2', JSON.stringify(await st())); await shot('09-cube2-solved');
  // 7 full cube: draw what is visible by hand, using show-me for the rest
  await sel(6); await shot('10-cube3');
  await page.evaluate(() => window.__routingGame.scene.getScene('routing').autoSolve()); await page.waitForTimeout(5500);
  console.log('cube3', JSON.stringify(await st())); await shot('11-cube3-solved');
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('TEST FAILED', e); process.exit(1); });
