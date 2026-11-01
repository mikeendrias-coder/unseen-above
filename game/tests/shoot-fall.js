// The fall in episode 3, frame by frame. node tests/shoot-fall.js [look]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const look = process.argv[2] || 'A';
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(l => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: true })); } catch (e) {} }, look);
  await p.goto(BASE + '/local.html#fall'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'fall' && window.__game.scene.clock > 0.8, null, { timeout: 60000 });
  const shot = n => p.screenshot({ path: `tests/out/fall-${look}-${n}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  await p.evaluate(() => window.__game.scene.skipAhead());
  await p.waitForFunction(() => window.__game.scene.phase === 'crack', null, { timeout: 8000 }); await shot('1-crack');
  for (const [n, t] of [['2-drop', 0.35], ['3-tumble', 1.2], ['4-deep', 2.3]]) { await p.waitForFunction(t => window.__game.scene.phase === 'falling' && window.__game.scene.fallT > t, t, { timeout: 10000 }); await shot(n); }
  await p.waitForFunction(() => window.__game.scene.phase === 'through', null, { timeout: 10000 }); await p.waitForTimeout(80); await shot('5-through');
  await p.waitForFunction(() => window.__game.scene.phase === 'dark' && window.__game.scene.landed, null, { timeout: 10000 }); await p.waitForTimeout(400); await shot('6-dark');
  await p.waitForFunction(() => window.__game.scene.sys.settings.key === 'eastwing' && window.__game.scene.clock > 1.6, null, { timeout: 20000 }); await shot('7-landing');
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 6).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
