const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('http://localhost:8765/earth-p4.html');
  await page.waitForFunction(() => window.__earthGame && window.__earthGame.scene.isActive('side'));
  await page.click('#start'); await sleep(300);
  await page.evaluate(() => { const s = window.__earthGame.scene.getScene('side'); s.kid.x = 516; s.kid.y = 146; });
  await sleep(300);
  console.log(await page.evaluate(() => { const s = window.__earthGame.scene.getScene('side'); const k = s.kid; return JSON.stringify({ kx: k.x, ky: k.y, h: k.h, item: s.glassesItem && s.glassesItem.x, dead: s.dead, leaving: s.leaving, atDoor: s.atDoor() }); }));
  await page.keyboard.down('e'); await sleep(120);
  console.log('isDown E:', await page.evaluate(() => { const s = window.__earthGame.scene.getScene('side'); const kb = s.input.keyboard; return Object.keys(kb.keys ? {} : {}).length + ' keysLen=' + (kb.keys ? kb.keys.filter(Boolean).length : 'n/a') + ' Eobj=' + JSON.stringify((kb.keys||[])[69] ? { isDown: kb.keys[69].isDown, jd: kb.keys[69]._justDown } : null); }));
  await page.keyboard.up('e'); await sleep(200);
  console.log('owned:', await page.evaluate(() => window.__earthState.glassesOwned));
  await browser.close();
})();
