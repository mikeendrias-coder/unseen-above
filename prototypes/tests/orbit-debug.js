const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('http://localhost:8765/routing-p4.html');
  await page.waitForFunction(() => window.__routingGame && window.__routingGame.scene.getScene('routing') && window.__routingGame.scene.getScene('routing').view, null, { timeout: 15000 });
  console.log('loaded');
  const t0 = Date.now();
  const r = await Promise.race([
    page.evaluate(() => { window.__routingGame.scene.getScene('routing').loadLevel(2); return 'ok'; }),
    new Promise(res => setTimeout(() => res('TIMEOUT loadLevel'), 5000))
  ]);
  console.log('loadLevel(2):', r, Date.now() - t0, 'ms');
  const r2 = await Promise.race([
    page.evaluate(() => { const s = window.__routingGame.scene.getScene('routing'); return JSON.stringify({ n: s.board.n, adj0: s.board.adj[0], walls: s.level.walls }); }),
    new Promise(res => setTimeout(() => res('TIMEOUT state'), 5000))
  ]);
  console.log(r2);
  await browser.close();
})();
