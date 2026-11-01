// The Moon city and the hallway behind it: screenshots along the street, then the fight with
// the creator at its main moments. node tests/shoot-city.js
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const shot = n => p.screenshot({ path: `tests/out/city-${n}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  await p.addInitScript(() => { window.__noPanels = true; window.__noDeath = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  await p.goto(BASE + '/local.html#moon'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.clock > 2.5);
  await shot('arrive');
  const put = async (x, wait) => { await p.evaluate(x => { const s = window.__game.scene, k = s.kid; k.x = x; k.y = 146; k.vx = 0; }, x); await p.waitForTimeout(wait || 1200); };
  await put(18 * 16); await shot('plaza');
  await put(40 * 16, 2600); await shot('lounge');
  await put(58 * 16, 1500); await shot('lounge2');
  await put(84 * 16); await shot('boulevard');
  await put(98 * 16); await shot('service');
  // through the staff door
  await p.evaluate(() => window.__game.scene.enterDoor());
  await until(() => window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.8, null, 20000);
  await shot('hall-in');
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 12 * 16; });
  await p.waitForTimeout(1500); await shot('hall-board');
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 20 * 16 + 14; });
  await until(() => window.__game.scene.mode === 'toss', null, 8000);
  await p.waitForTimeout(1500); await shot('toss');
  await until(() => !!window.__game.scene.sword.floor, null, 30000);
  await p.waitForTimeout(300); await shot('sword-floor');
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.sword.floor.x - 4; s.pickUp(); });
  await until(() => window.__game.scene.mode === 'fight', null, 20000);
  // round one: a wind up, the lunge, the searchlight
  await until(() => ['windHi', 'windLo'].includes(window.__game.scene.cr.st), null, 20000);
  await shot('wind');
  await until(() => window.__game.scene.cr.st === 'recover', null, 20000);
  await shot('recover');
  await until(() => window.__game.scene.lamp.on, null, 20000); await p.waitForTimeout(600); await shot('lamp');
  // swing at them while they are open
  await until(() => window.__game.scene.cr.open, null, 20000);
  await p.evaluate(() => { const s = window.__game.scene, c = s.cr; s.kid.x = c.x - 16; s.kid.face = 1; s.swing(); });
  await p.waitForTimeout(80); await shot('swing');
  // round two
  await p.evaluate(() => window.__game.scene.skipAhead());
  await until(() => window.__game.scene.cr.round === 1 && window.__game.scene.mode === 'fight', null, 30000);
  await until(() => window.__game.scene.laser.shots.length && window.__game.scene.laser.t > 1.25, null, 40000);
  await shot('laser');
  // round three, in the dark
  await p.evaluate(() => window.__game.scene.skipAhead());
  await until(() => window.__game.scene.cr.round === 2 && window.__game.scene.mode === 'fight', null, 30000);
  await until(() => window.__game.scene.cams.some(c => c.warn), null, 20000); await p.waitForTimeout(200); await shot('dark-click');
  await until(() => window.__game.scene.cams.some(c => c.flash > 0.6), null, 20000); await shot('dark-flash');
  // the end of it
  await p.evaluate(() => window.__game.scene.skipAhead());
  await until(() => window.__game.scene.mode === 'yield', null, 30000);
  await p.waitForTimeout(2500); await shot('yield');
  await until(() => window.__game.scene.mode === 'after', null, 60000);
  await p.waitForTimeout(1600); await shot('after');
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
