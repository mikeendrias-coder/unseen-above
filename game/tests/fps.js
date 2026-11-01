// Measures the frame rate in headless Chromium for a scene: node tests/fps.js [scene]
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  await p.goto('http://localhost:8766/local.html?scene=' + (process.argv[2] || 'grounds'));
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene, null, { timeout: 30000 });
  await p.waitForTimeout(4000);
  console.log(await p.evaluate(() => ({ fps: Math.round(window.__unseen.game.loop.actualFps * 10) / 10, S: window.__unseen.display.S })));
  await b.close();
})();
