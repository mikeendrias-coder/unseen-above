const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [w, h, name] of [[1360, 860, 'desk'], [400, 800, 'phone']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8766/local.html'); await p.waitForTimeout(800);
    await p.screenshot({ path: `tests/out/start-${name}.png` });
    const sw = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log(name, 'scrollWidth', sw.join(' vs '), errs.join(';') || 'ok');
    await p.close();
  }
  await b.close();
})();
