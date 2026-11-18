// Plays every satellite puzzle in the browser along the solver's turns (the real physics, not
// win()), checks the keys and a mouse drag turn the surface, and that each batch ends.
// Each batch starts with the request form: batch 1 checks OPERATOR with the mouse (the clue) and
// stamps DENIED with K (then NOTED), batch 2 stamps APPROVED with J, batch 3 skips with Enter,
// batch 4 clicks the APPROVED stamp. Then a long time on one puzzle puts a clickable N on screen.
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
    // ---- the request form
    const box = await (await p.$('canvas')).boundingBox(), sx = box.width / 320;
    const at = (x, y) => [box.x + x * sx, box.y + y * sx];
    ok('batch ' + batch + ': a request form comes first', await p.evaluate(() => !!window.__game.scene.form));
    const yawF = await p.evaluate(() => window.__game.scene.yaw);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(300); await p.keyboard.up('KeyD');
    ok('  nothing turns under the form', await p.evaluate(y => window.__game.scene.yaw === y, yawF));
    await p.waitForTimeout(600); // the stamp waits a moment, so a held key from the last scene does nothing
    const story = () => p.evaluate(() => JSON.parse(localStorage.getItem('unseen-above-v1') || '{}').story || {});
    if (batch === 1) {
      await p.mouse.click(...at(140, 34 + 25 + 2 * 16 + 3)); // the OPERATOR row
      ok('  clicking OPERATOR records the clue', (await story()).clues.operator === true);
      await p.keyboard.press('KeyK');
      await until(() => window.__game.scene.form && window.__game.scene.form.stamp && window.__game.scene.form.stamp.noted, null, 5000);
      ok('  K stamps DENIED, then NOTED goes on top', true);
    } else if (batch === 2) { await p.keyboard.press('KeyJ'); }
    else if (batch === 3) { await p.keyboard.press('Enter'); }
    else { await p.mouse.click(...at(36 + 10 + 40, 34 + 122 + 7)); }
    await until(() => !window.__game.scene.form, null, 8000);
    const st = await story(), want = { 1: 'denied', 2: 'approved', 3: 'skipped', 4: 'approved' }[batch];
    ok('  the form closes and the puzzle starts; recorded ' + JSON.stringify(st.requests) + ', denied ' + st.denied, st.requests && st.requests[batch] === want && st.denied === (batch === 1 ? 1 : 0));
    if (batch === 1) {
      // the keys turn the ring, and a drag does too
      const y0 = await p.evaluate(() => window.__game.scene.yaw);
      await p.keyboard.down('KeyD'); await p.waitForTimeout(400); await p.keyboard.up('KeyD');
      const y1 = await p.evaluate(() => window.__game.scene.yaw);
      ok('D turns the ring (' + (y1 - y0).toFixed(2) + ' rad)', y1 - y0 > 0.3);
        await p.mouse.move(box.x + 238 * sx, box.y + 120 * sx); await p.mouse.down();
      await p.mouse.move(box.x + 200 * sx, box.y + 120 * sx, { steps: 8 }); await p.mouse.up();
      const y2 = await p.evaluate(() => window.__game.scene.yaw);
      ok('a drag to the left turns it back (' + (y2 - y1).toFixed(2) + ' rad)', y2 - y1 < -0.3);
      await until(() => window.__game.scene.idle);
      // O shows the same puzzle on the other three screens
      for (let k = 0; k < 4; k++) { await p.keyboard.press('KeyO'); await until(k => window.__game.scene.skinN === (k + 1) % 4 + 1 && window.__game.scene.clock > 0.2, k); }
      ok('O cycles the ring through the four screens and back', await p.evaluate(() => window.__game.scene.skinN === 1 && window.__game.scene.level.id === 'ring'));
      await p.evaluate(() => window.__game.scene.restartTake());
      await until(() => window.__game.scene.level && window.__game.scene.clock > 0.3);
      ok('a retry does not bring the form back', await p.evaluate(() => !window.__game.scene.form));
    }
    const n = await p.evaluate(() => window.__game.scene.ids.length);
    for (let i = 0; i < n; i++) {
      await until(i => window.__game.scene.levelIdx === i && !window.__game.scene.solved && window.__game.scene.idle, i);
      if (batch === 3) {
        // dawdle: the target walks off along its path, and the puzzle can still be finished
        const t0 = await p.evaluate(() => { const s = window.__game.scene; s.levelT = 29.8; return s.targets[0]; });
        await until(t0 => window.__game.scene.targets[0] !== t0, t0, 10000);
        ok('batch 3: the target drifts when you are slow (' + t0 + ' to ' + await p.evaluate(() => window.__game.scene.targets[0]) + ')', true);
        await until(() => window.__game.scene.idle && !window.__game.scene.driftAnim);
      }
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
  // a long time on one puzzle: the screen offers N, and a click on it solves the puzzle
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
    await p.goto(BASE + '/local.html#batch2'); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.form, null, { timeout: 60000 });
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => !window.__game.scene.form && window.__game.scene.stuckKey, null, { timeout: 8000 });
    ok('no offer before 90 s', await p.evaluate(() => !window.__game.scene.offerRect()));
    await p.evaluate(() => { window.__game.scene.stuckT = 89.5; });
    const r = await (await p.waitForFunction(() => window.__game.scene.offerRect(), null, { timeout: 5000 })).jsonValue();
    ok('after 90 s the screen offers N at ' + r.join(','), true);
    const box = await (await p.$('canvas')).boundingBox(), sx = box.width / 320;
    await p.mouse.click(box.x + (r[0] + 30) * sx, box.y + (r[1] + 6) * sx);
    await p.waitForFunction(() => window.__game.scene.solved, null, { timeout: 5000 });
    ok('a click on the offer solves the puzzle', true);
    await p.close();
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
