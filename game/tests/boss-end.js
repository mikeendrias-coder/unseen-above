// The fight ends after the ninth hit, even if she swings again while the creator's last line
// plays (a tenth hit used to wipe the queued yield, and the fight ran on).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 30000, polling: 30 });
  const wait = async sec => { const t0 = await p.evaluate(() => window.__game.scene.clock); await until(t => window.__game.scene.clock >= t, t0 + sec); };
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto((process.env.UA_BASE || 'http://localhost:8766') + '/local.html#hallway'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.5);
  await p.keyboard.press('KeyI');
  await p.evaluate(() => { window.__game.scene.kid.x = 20 * 16 + 14; });
  await until(() => !!window.__game.scene.sword.floor, null, 40000);
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.sword.floor.x - 4; s.pickUp(); });
  await until(() => window.__game.scene.mode === 'fight', null, 20000);
  // the ninth hit, then a tenth while "Enough" is up
  await p.evaluate(() => { const s = window.__game.scene; s.cr.hp = 1; s.cr.round = 2; s.hitCreator(); });
  await wait(0.3);
  await p.evaluate(() => { const s = window.__game.scene; s.cr.open = true; s.cr.st = 'recover'; if (s.mode === 'fight') s.hitCreator(); else { s.sword.cool = 0; s.swing(); } });
  await wait(6);
  const r = await p.evaluate(() => { const s = window.__game.scene; return { mode: s.mode, hp: s.cr.hp, st: s.cr.st, queue: s.queue.length, lineT: s.lineT }; });
  console.log((r.mode === 'yield' || r.mode === 'after' ? 'ok   ' : 'FAIL ') + 'after the ninth hit and one more swing, the creator yields ' + JSON.stringify(r));
  console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors');
  await b.close();
})();
