const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  for (const dsf of [2, 3]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: dsf });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/final-routing-puzzles.html');
    await page.waitForFunction(() => window.__routingGame && window.__routingGame.scene.getScene('routing') && window.__routingGame.scene.getScene('routing').view, null, { timeout: 20000 });
    await sleep(300);
    const toPage = (x, y) => page.evaluate(([x, y]) => { const r = window.__routingGame.canvas.getBoundingClientRect(); return { x: r.left + x * r.width / 960, y: r.top + y * r.height / 540 }; }, [x, y]);
    // click level row 3 (y = 74 + 2*34 + 15) in logical coords
    let p = await toPage(120, 74 + 2 * 34 + 15); await page.mouse.click(p.x, p.y); await sleep(300);
    const lvl = await page.evaluate(() => window.__routingGame.scene.getScene('routing').levelIndex);
    // click "Show me" (x 128..228, y 438..468)
    p = await toPage(178, 453); await page.mouse.click(p.x, p.y); await sleep(4000);
    const st = await page.evaluate(() => { const s = window.__routingGame.scene.getScene('routing'), c = s.cameras.main; return { solved: s.solved, len: s.path.length, wv: [c.worldView.x, c.worldView.y, c.worldView.width, c.worldView.height].map(v => Math.round(v)), zoom: c.zoom }; });
    await page.screenshot({ path: `/home/claude/game/tests/dpr${dsf}-buttons.png` });
    console.log('DPR', dsf, 'level after row click:', lvl, '(expect 2)', 'after Show me:', JSON.stringify(st), 'errors:', errors.length ? errors.join(' | ') : 'none');
    await page.close();
  }
  await browser.close();
})();
