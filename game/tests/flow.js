// Flow checks: the opening hands off to episode 1, a death leaves a body and a new take,
// and the door ends the episode. Also loads every look once.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto('http://localhost:8766/local.html');
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.T);
  // skip ahead to the end of the opening
  await p.evaluate(() => { const s = window.__game.scene; s.t = s.T.end - 0.05; });
  await p.waitForFunction(() => window.__game.scene && window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.kid, null, { timeout: 90000 });
  await p.waitForTimeout(1500);
  const card = await p.evaluate(() => document.querySelector('#card').classList.contains('on') ? document.querySelector('.card-top').textContent + ' / ' + document.querySelector('.card-title').textContent : 'card off');
  console.log('after the opening:', card);
  // death: stand in the garden lamp until it strikes
  await p.evaluate(() => { const s = window.__game.scene; s.lights[0].a0 = s.lights[0].a1 = 139; });
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 560; s.kid.y = 146; });
  await p.waitForTimeout(2600);
  const afterDeath = await p.evaluate(() => { const s = window.__game.scene; return { take: s.ep.take, bodies: s.ep.bodies.length, layer: s.bodyLayer.list.length }; });
  console.log('after a death:', JSON.stringify(afterDeath));
  // the door
  await p.evaluate(() => { const s = window.__game.scene; window.__noDeath = true; s.kid.x = 1698; s.kid.y = 112 - 14; s.kid.vy = 0; });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(300); await p.keyboard.up('ArrowUp');
  await p.waitForTimeout(3200);
  const end = await p.evaluate(() => ({ done: window.__game.scene.done, card: document.querySelector('.card-top').textContent }));
  console.log('at the door:', JSON.stringify(end));
  await p.screenshot({ path: 'tests/out/flow-end.png' });
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite', null, { timeout: 60000 });
  console.log('after the door: satellite batch', await p.evaluate(() => window.__game.scene.batch + ', screen ' + window.__game.scene.skinN));
  await p.goto('http://localhost:8766/local.html?scene=grounds'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid, null, { timeout: 30000 });
  // every look loads
  for (let i = 0; i < 5; i++) { await p.keyboard.press('KeyR'); await p.waitForTimeout(300); }
  const looks = [];
  for (let i = 0; i < 5; i++) { await p.keyboard.press('KeyL'); await p.waitForTimeout(1200); looks.push(await p.evaluate(() => window.__game.scene.P.name)); }
  console.log('looks:', looks.join(', '));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})();
