const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('http://localhost:8765/earth-p4.html');
  await page.waitForFunction(() => window.__earthGame && window.__earthGame.scene.isActive('side'));
  await page.click('#start'); await sleep(300);
  await page.evaluate(() => { const st = window.__earthState; st.glassesOwned = true; st.glassesOn = true; const s = window.__earthGame.scene.getScene('side'); if (s.glassesItem) { s.glassesItem.destroy(); s.glassesItem = null; } s.kid.x = 40 * 16; s.kid.y = 146; });
  await sleep(1500); await page.screenshot({ path: '/home/claude/game/tests/earth-p4-side-camera.png' });
  await page.evaluate(() => { const s = window.__earthGame.scene.getScene('side'); s.kid.x = 50 * 16 + 2; s.kid.y = 146; });
  await page.waitForFunction(() => window.__earthGame.scene.getScene('side').beam.phase === 'charge');
  await sleep(300); await page.screenshot({ path: '/home/claude/game/tests/earth-p4-side-beam-charge.png' });
  await browser.close();
})();
