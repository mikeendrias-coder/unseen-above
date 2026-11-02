// Screenshots of the comforts: a death caption with "Space skips", the stuck offer, the pause menu
// over a satellite screen and over the fight, the console prompt in round two, the laser's tell
// with the glasses off. Writes tests/out/comfort-*.png.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 30000, polling: 50 });
  const shot = name => p.screenshot({ path: 'tests/out/comfort-' + name + '.png', clip: { x: 0, y: 42, width: 1280, height: 720 } });
  await p.addInitScript(() => { window.__noPanels = true; });
  await p.goto(BASE + '/local.html'); await p.evaluate(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#grounds'); await p.reload(); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.clock > 0.5);
  // two deaths: the second shows "Space skips" beside its caption
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 38 * 16; s.die({ id: 'garden lamp' }); });
  await until(() => window.__game.scene.ep.take === 2 && !window.__game.scene.dead && window.__game.scene.clock > 0.3, null, 15000);
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 47 * 16; s.die({ id: 'fountain drone' }); });
  await p.waitForTimeout(700); await shot('death');
  await p.keyboard.press('Space');
  await until(() => window.__game.scene.ep.take === 3 && !window.__game.scene.dead && window.__game.scene.clock > 0.2, null, 8000);
  await p.evaluate(() => window.__game.scene.die({ id: 'west wall lamp' })); await p.waitForTimeout(300); await p.keyboard.press('Space');
  await until(() => window.__game.scene.ep.take === 4 && !window.__game.scene.dead && window.__game.scene.clock > 0.6, null, 8000);
  await shot('stuck');
  // the pause menu over a satellite screen
  await p.goto(BASE + '/local.html#batch3'); await p.reload(); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.clock > 1);
  await p.keyboard.press('KeyP'); await p.waitForTimeout(600); await shot('pause-sat');
  await p.keyboard.press('KeyP');
  // the fight, round two: the console prompt, and the laser's tell with the glasses off
  await p.goto(BASE + '/local.html#hallway'); await p.reload(); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.5);
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene; s.sword.have = true; s.swordThing.off = true; s.cr.hp = 6; s.startRound(1); s.cr.x = 36 * 16; s.kid.x = 29 * 16 + 20; s.kid.y = 160 - 14; s.kid.vy = 0; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.consoleThing, null, 5000);
  await shot('console');
  await p.keyboard.press('KeyE');
  await until(() => window.__game.scene.laser.shots.length && window.__game.scene.laser.t > 0.12, null, 3000);
  await shot('tell');
  await until(() => window.__game.scene.cr.hp < 6 || !window.__game.scene.laser.shots.length, null, 4000);
  console.log('her shot from the console: the creator went from 6 to ' + await p.evaluate(() => window.__game.scene.cr.hp) + ' hits left');
  await p.keyboard.press('KeyP'); await p.waitForTimeout(500); await shot('pause-fight');
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' | ') : 'no page errors');
  await b.close();
})();
