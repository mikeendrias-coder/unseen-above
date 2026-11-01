// Screenshots of the kids' room preview at moments in its script: node tests/shoot-kids.js [look] [t,t,...]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const look = process.argv[2] || 'A';
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.addInitScript(l => { try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: true })); } catch (e) {} }, look);
  await p.goto(BASE + '/local.html#kids');
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'kids', null, { timeout: 30000 });
  const ts = (process.argv[3] || '4,9.6,13,14.7,16.5,21,25.5,27.5,30.5').split(',').map(Number);
  for (const t of ts) {
    await p.waitForFunction(t => window.__game.scene.t >= t, t, { timeout: 120000, polling: 50 });
    await p.screenshot({ path: `tests/out/k-${look}-${t}.png` });
    console.log('t', t, 'solvedAt', await p.evaluate(() => window.__game.scene.solvedAt));
  }
  console.log(errs.slice(0, 10).join('\n') || 'no console errors');
  await b.close();
})();
