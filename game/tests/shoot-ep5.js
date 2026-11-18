// Episode 5 screenshots: the corridor, the playroom, the talk, her reply slip, the last shot. node tests/shoot-ep5.js [look]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const look = process.argv[2] || 'A';
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(l => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: true })); } catch (e) {} }, look);
  await p.goto(BASE + '/local.html#moon'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.clock > 2.4, null, { timeout: 60000 });
  const shot = n => p.screenshot({ path: `tests/out/e5-${look}-${n}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  const put = x => p.evaluate(x => { const s = window.__game.scene, k = s.kid; k.x = x; k.y = 146; k.vx = 0; s.view.x = Math.max(0, Math.min(1024, x + 22 - 160)); }, x);
  await shot('arrive');
  await put(12 * 16); await p.waitForTimeout(2200); await shot('room1');
  await put(33 * 16); await p.waitForTimeout(1500); await shot('room2');
  await put(44 * 16); await p.evaluate(() => window.__game.scene.robotTalk()); await p.waitForTimeout(1600); await shot('robot');
  await put(62 * 16); await p.waitForTimeout(600); await shot('vote');
  await put(79 * 16); await p.waitForTimeout(600); await shot('door');
  // (the staff door leads backstage now; shoot-city.js covers that) the playroom, directly
  await p.evaluate(() => window.__game.scene.scene.restart({ at: 'playroom' }));
  await p.waitForFunction(() => window.__game.scene.mode === 'room' && window.__game.scene.clock > 0.9, null, { timeout: 15000 }); await shot('playroom');
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.level.stand; });
  await p.waitForFunction(() => window.__game.scene.mode === 'talk' && window.__game.scene.talkI >= 2, null, { timeout: 30000 }); await shot('talk');
  await p.waitForFunction(() => window.__game.scene.mode === 'choose', null, { timeout: 30000 }); await p.waitForTimeout(400); await shot('reply');
  await p.evaluate(() => { const s = window.__game.scene; s.pick = 0; s.choose(); });
  await p.waitForFunction(() => window.__game.scene.talking, null, { timeout: 5000 });
  await p.evaluate(() => { const s = window.__game.scene; s.talkI = s.lines.length - 2; s.nextLine(); });
  await p.waitForTimeout(500); await shot('clicks');
  await p.waitForFunction(() => window.__game.scene.mode === 'last', null, { timeout: 15000 });
  await p.waitForTimeout(1500); await shot('last-1');
  await p.waitForFunction(() => window.__game.scene.lastT > 3.4, null, { timeout: 15000 }); await shot('last-2');
  await p.waitForFunction(() => window.__game.scene.lastT > 9, null, { timeout: 20000 }); await shot('last-3');
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 6).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
