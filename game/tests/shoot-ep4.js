// Episode 4 screenshots: the dark house section by section, a flash, the run, the bedroom.
// node tests/shoot-ep4.js [look] [only]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const look = process.argv[2] || 'A', only = process.argv[3];
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(l => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: true })); } catch (e) {} }, look);
  await p.goto(BASE + '/local.html#bedroom'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 1, null, { timeout: 60000 });
  await p.evaluate(() => { window.__noDeath = true; });
  const shot = n => p.screenshot({ path: `tests/out/e4-${look}-${n}.png`, clip: { x: 40, y: 34, width: 1280, height: 720 } });
  const put = x => p.evaluate(x => { const s = window.__game.scene, k = s.kid; k.x = x; k.y = 160 - 14; k.vx = 0; k.vy = 0; s.view.x = Math.max(0, Math.min(1088, x + 22 - 160)); }, x);
  // wait for a given camera to flash, then shoot while the flash is bright
  const flash = async (i, n) => { await p.waitForFunction(i => window.__game.scene.cams[i].flash > 0.8, i, { timeout: 15000 }); await shot(n); };
  if (!only || only === 'house') {
    await shot('start');
    await flash(0, 'landing-flash');
    await put(14 * 16); await flash(1, 'hall-flash');
    await put(23 * 16); await flash(2, 'arch-flash');
    await put(42 * 16); await flash(3, 'clock-flash');
    await put(50 * 16); await flash(4, 'billiard-flash');
  }
  if (!only || only === 'run') {
    await put(58 * 16);
    await p.evaluate(() => window.__game.scene.pullBag());
    await p.waitForFunction(() => window.__game.scene.collapse && window.__game.scene.collapse.t > 1.2, null, { timeout: 15000 });
    await shot('run-collapse');
    await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 66 * 16 - 30; });
    await p.waitForTimeout(700); await shot('run-gap');
    await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 1120; s.kid.y = 160 - 14; });
    await p.waitForFunction(() => window.__game.scene.run.slab.state === 'down', null, { timeout: 15000 }); await shot('run-slab');
  }
  if (!only || only === 'bed') {
    await p.evaluate(() => { const s = window.__game.scene; s.bag.have = true; s.collapse = s.collapse || { x: 1328, t: 9, done: true }; s.kid.x = 85 * 16 + 8; s.kid.y = 146; s.enterDoor(); });
    await p.waitForFunction(() => window.__game.scene.mode === 'bedroom', null, { timeout: 15000 });
    await p.waitForTimeout(1300); await shot('bed-enter');
    await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 88 * 16 + 110; });
    await p.waitForFunction(() => window.__game.scene.mode === 'talk' && window.__game.scene.talkI >= 2, null, { timeout: 30000 }); await shot('bed-talk');
    await p.evaluate(() => { const s = window.__game.scene; s.talkI = 99; s.nextLine(); });
    await p.waitForFunction(() => window.__game.scene.mode === 'after', null, { timeout: 30000 }); await shot('bed-after');
    await p.evaluate(() => window.__game.scene.openVoid());
    await p.waitForTimeout(1500); await shot('bed-void');
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 6).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
