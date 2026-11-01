// Episode 3 screenshots: the fall, then the east wing room by room. node tests/shoot-ep3.js [look]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const look = process.argv[2] || 'A';
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const page = async part => {
    const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(l => { try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: true })); } catch (e) {} }, look);
    await p.goto(BASE + '/local.html#' + part); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.clock > 1, null, { timeout: 60000 });
    return p;
  };
  const shot = (p, n) => p.screenshot({ path: `tests/out/e3-${look}-${n}.png`, clip: { x: 40, y: 34, width: 1280, height: 720 } });
  if (!process.argv[3] || process.argv[3] === 'fall') {
    const f = await page('fall');
    await shot(f, 'fall-start');
    await f.evaluate(() => { const s = window.__game.scene; s.kid.x = 16 * 16; s.kid.y = 128 - 14; s.kid.vy = 0; });
    await f.waitForFunction(() => window.__game.scene.phase === 'crack', null, { timeout: 20000 }); await shot(f, 'fall-crack');
    await f.waitForFunction(() => window.__game.scene.phase === 'falling' && window.__game.scene.kid.y > 170, null, { timeout: 20000 }); await shot(f, 'fall-falling');
    await f.waitForFunction(() => window.__game.scene.phase === 'gone' && window.__game.scene.crackT > 0.4, null, { timeout: 20000 }); await shot(f, 'fall-impact');
    await f.waitForFunction(() => window.__game.scene.sys.settings.key === 'eastwing' && window.__game.scene.clock > 1.5, null, { timeout: 30000 }); await shot(f, 'landing');
    await f.close();
  }
  const e = await page('eastwing');
  await e.evaluate(() => { window.__noDeath = true; });
  for (const [n, x, y] of [['corridor', 17, 22], ['corridor2', 25, 16], ['study', 20, 10], ['ballroom', 35, 9], ['ballroom2', 40, 5]]) {
    await e.evaluate(([x, y]) => { const s = window.__game.scene, k = s.kid; k.tx = k.fx = x; k.ty = k.fy = y; k.p = 1; k.moving = false; s.camX = x * 16 + 8; s.camY = y * 16 + 8; }, [x, y]);
    await e.waitForTimeout(900); await shot(e, n);
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 6).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
