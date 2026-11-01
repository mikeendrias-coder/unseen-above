// The last shot: the old TV, the Moon, the blast taking a bite out of it.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__noPanels = true; });
  await p.goto(BASE + '/local.html#moon'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.clock > 1, null, { timeout: 60000 });
  await p.evaluate(() => { const s = window.__game.scene; s.lines = []; s.startVest(); });
  for (const [n, t] of [['a', 1.5], ['b', 3.2], ['c', 4.4], ['d', 7], ['e', 14]]) { await p.waitForFunction(t => window.__game.scene.mode === 'last' && window.__game.scene.lastT > t, t, { timeout: 30000 }); await p.screenshot({ path: `tests/out/last-${n}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } }); }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
