// Plays every satellite puzzle in the browser along the solver's turns (the real physics, not
// win()), checks the keys and a mouse drag turn the surface, and that each batch ends.
// node tests/sat-play.js  (serve dist first; UA_BASE picks the port)
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  for (const batch of [1, 2, 3, 4]) {
    const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
    await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
    await p.goto(BASE + '/local.html#batch' + batch); await p.click('#start');
    await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.level);
    if (batch === 1) {
      // the keys turn the ring, and a drag does too
      const y0 = await p.evaluate(() => window.__game.scene.yaw);
      await p.keyboard.down('KeyD'); await p.waitForTimeout(400); await p.keyboard.up('KeyD');
      const y1 = await p.evaluate(() => window.__game.scene.yaw);
      ok('D turns the ring (' + (y1 - y0).toFixed(2) + ' rad)', y1 - y0 > 0.3);
      const box = await (await p.$('canvas')).boundingBox(), sx = box.width / 320;
      await p.mouse.move(box.x + 238 * sx, box.y + 120 * sx); await p.mouse.down();
      await p.mouse.move(box.x + 200 * sx, box.y + 120 * sx, { steps: 8 }); await p.mouse.up();
      const y2 = await p.evaluate(() => window.__game.scene.yaw);
      ok('a drag to the left turns it back (' + (y2 - y1).toFixed(2) + ' rad)', y2 - y1 < -0.3);
      await until(() => window.__game.scene.idle);
      await p.evaluate(() => window.__game.scene.restartTake());
      await until(() => window.__game.scene.level && window.__game.scene.clock > 0.3);
    }
    const n = await p.evaluate(() => window.__game.scene.ids.length);
    for (let i = 0; i < n; i++) {
      await until(i => window.__game.scene.levelIdx === i && !window.__game.scene.solved && window.__game.scene.idle, i);
      const t0 = Date.now();
      const steps = await p.evaluate(() => window.__game.scene.autoSolve(0, 0.12));
      const id = await p.evaluate(() => window.__game.scene.level.id);
      await until(() => window.__game.scene.solved, null, 90000);
      const how = await p.evaluate(() => ({ caught: window.__game.scene.ph.caught.join(''), beads: window.__game.scene.ph.beads.join(','), targets: window.__game.scene.targets.join(',') }));
      ok('batch ' + batch + ' ' + id + ': the solver\'s ' + steps + ' turns solve it with the real physics in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s (beads ' + how.beads + ' on ' + how.targets + ')', how.beads === how.targets);
      if (i === 0 && batch === 2) { await p.waitForTimeout(300); await p.screenshot({ path: 'tests/out/sat-play-b2-win.png' }); }
    }
    await until(b => /END OF BATCH/.test(document.querySelector('#card').textContent), batch, 30000);
    ok('batch ' + batch + ' ends: ' + await p.evaluate(() => document.querySelector('#card').textContent.replace(/\s+/g, ' ').trim()), true);
    await p.close();
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
