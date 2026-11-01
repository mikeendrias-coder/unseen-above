const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('http://localhost:8765/routing-p4.html');
  await page.waitForFunction(() => window.__routingGame && window.__routingGame.scene.getScene('routing') && window.__routingGame.scene.getScene('routing').view, null, { timeout: 15000 });
  await page.evaluate(() => window.__routingGame.scene.getScene('routing').loadLevel(2));
  const L = await page.evaluate(() => window.ROUTING_LEVELS[2]);
  const withT = (p, label) => Promise.race([p, new Promise(res => setTimeout(() => res('TIMEOUT ' + label), 4000))]);
  const cellPt = c => withT(page.evaluate(c => {
    const g = window.__routingGame, s = g.scene.getScene('routing'), v = s.view, rect = g.canvas.getBoundingClientRect();
    const p = v.center(c); return { x: rect.left + (v.root.x + p.x) * rect.width / 960, y: rect.top + (v.root.y + p.y) * rect.height / 540 };
  }, c), 'cellPt');
  const sol = L.solution, w = L.w;
  let p = await cellPt(sol[0]);
  await page.mouse.move(p.x, p.y); await page.mouse.down();
  for (let i = 1; i < sol.length; i++) {
    const a = sol[i - 1], b = sol[i];
    const isWrap = Math.floor(a / w) === Math.floor(b / w) && Math.abs((a % w) - (b % w)) === w - 1;
    if (isWrap) {
      const pa = await cellPt(a), pb = await cellPt(b);
      const dir = (a % w) === 0 ? -1 : 1;
      console.log('wrap step', i, a, '->', b, 'dir', dir);
      const r = await withT(page.mouse.move(pa.x + dir * 70, pa.y, { steps: 6 }).then(() => 'moved'), 'move-out');
      console.log('  ', r);
      const s1 = await withT(page.evaluate(() => { const s = window.__routingGame.scene.getScene('routing'); return s.path.slice(-3).join(','); }), 'state');
      console.log('   path tail', s1);
      await page.mouse.up();
      await page.mouse.move(pb.x, pb.y); await page.mouse.down();
      continue;
    }
    p = await cellPt(b);
    if (typeof p === 'string') { console.log(p, 'at step', i); break; }
    await page.mouse.move(p.x, p.y, { steps: 4 });
  }
  await page.mouse.up();
  console.log(await withT(page.evaluate(() => { const s = window.__routingGame.scene.getScene('routing'); return JSON.stringify({ len: s.path.length, solved: s.solved }); }), 'final'));
  await browser.close();
})();
