const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  for (const [file, check] of [['final-routing-puzzles.html', 'routing'], ['final-earth-stealth.html', 'earth']]) {
    for (const vp of [{ width: 1280, height: 860 }, { width: 400, height: 860 }]) {
      const page = await browser.newPage({ viewport: vp });
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      await page.goto('http://localhost:8765/' + file);
      let ok = false;
      try {
        if (check === 'routing') { await page.waitForFunction(() => window.__routingGame && window.__routingGame.scene.getScene('routing') && window.__routingGame.scene.getScene('routing').view, null, { timeout: 20000 }); ok = true; }
        else { await page.waitForFunction(() => window.__earthGame && window.__earthGame.scene.isActive('side'), null, { timeout: 20000 }); await page.click('#start'); await page.keyboard.down('ArrowRight'); await sleep(500); await page.keyboard.up('ArrowRight'); ok = await page.evaluate(() => window.__earthGame.scene.getScene('side').kid.x > 40); }
      } catch (e) { errors.push('wait failed: ' + e.message.split('\n')[0]); }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      const ver = await page.evaluate(() => window.Phaser && Phaser.VERSION);
      await page.screenshot({ path: `/home/claude/game/tests/final-${check}-${vp.width}.png` });
      console.log(file, vp.width + 'px', 'engine', ver, 'boots/plays:', ok, 'horizontal overflow:', overflow, 'errors:', errors.length ? errors.join(' | ') : 'none');
      await page.close();
    }
  }
  await browser.close();
})();
