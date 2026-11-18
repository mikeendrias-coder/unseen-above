// Batch 3 hands off to episode 4; batch 4 ends the build politely (or hands off when ep5 exists).
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const card = () => p.evaluate(() => document.querySelector('#card').textContent.replace(/\s+/g, ' ').trim());
  // one turning puzzle per batch (batch 1 starts with the ring): win() each until the batch ends
  const solveBatch = async () => { for (let i = 0; i < 4; i++) { await until(() => window.__game.scene.ended || (window.__game.scene.level && !window.__game.scene.solved)); const lv = await p.evaluate(() => window.__game.scene.ended ? -1 : window.__game.scene.levelIdx); if (lv < 0) break; await p.evaluate(() => window.__game.scene.win()); await until(lv => window.__game.scene.levelIdx > lv || window.__game.scene.ended, lv); } };
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#batch3'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.batch === 3);
  await solveBatch();
  await until(() => /END OF BATCH 3/.test(document.querySelector('#card').textContent), null, 30000); ok('end of batch 3: ' + await card(), true);
  await until(() => window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 0.5, null, 60000);
  await until(() => /EPISODE 4/.test(document.querySelector('#card').textContent), null, 10000);
  ok('then episode 4 opens: ' + await card(), true);
  await p.goto(BASE + '/local.html#batch4'); await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.batch === 4);
  await solveBatch();
  await until(() => /END OF BATCH 4/.test(document.querySelector('#card').textContent), null, 30000); ok('end of batch 4: ' + await card(), true);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
