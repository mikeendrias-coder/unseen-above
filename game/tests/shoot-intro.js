// Screenshots of the opening at chosen times (seconds), plus console errors.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const look = process.argv[2] || 'A';
  const times = (process.argv[3] || '3,12,18,24,40').split(',').map(Number);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.addInitScript(l => { try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: false })); } catch (e) {} }, look);
  await p.goto(BASE + '/local.html');
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.T, null, { timeout: 30000 });
  const T = await p.evaluate(() => window.__game.scene.T);
  console.log('timeline', JSON.stringify({ goDown: T.goDown, drone: T.drone, later: T.later, follow: T.follow, end: T.end }));
  for (const t of times) {
    await p.evaluate(t => { const s = window.__game.scene; s.t = t; }, t);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `tests/out/i-${look}-${t}.png` });
  }
  console.log(errs.slice(0, 10).join('\n') || 'no console errors');
  await b.close();
})();
