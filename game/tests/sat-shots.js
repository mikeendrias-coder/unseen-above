// Screenshots of the satellite puzzles: the orbit ring and each batch's globe, on its own screen.
// node tests/sat-shots.js  (serve dist first; UA_BASE picks the port). Writes tests/out/sat-*.png
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const shots = [['form', 1, 0], ['ring', 1, 0, true], ['globe-b1', 1, 1], ['globe-b2', 2, 0], ['globe-b3', 3, 0], ['globe-b4', 4, 0]];
  for (const [name, batch, at, plain] of shots) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
    await p.goto(BASE + '/local.html#batch' + batch); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.level, null, { timeout: 30000 });
    // the request form comes first; batch 1 also gets shots of it with the key bar under the game
    await p.waitForFunction(() => !window.__game.scene.form || window.__game.scene.form.ready(), null, { timeout: 10000 });
    if (batch === 1 && !at && !plain) {
      await p.waitForTimeout(400);
      const keys = () => p.evaluate(() => [...document.querySelectorAll('#keybar .key')].slice(0, 9).map(k => k.querySelector('.cap').textContent + ':' + k.querySelector('.lbl').textContent + (k.classList.contains('off') ? '(grey)' : '')).join(' '));
      await p.screenshot({ path: 'tests/out/sat-form-keys.png' }); console.log('wrote tests/out/sat-form-keys.png  keys ' + await keys());
      await p.keyboard.press('KeyS'); await p.keyboard.press('KeyK');
      await p.waitForFunction(() => window.__game.scene.form && window.__game.scene.form.stamp && window.__game.scene.form.stamp.noted, null, { timeout: 5000 });
      await p.waitForTimeout(500);
      const hint = await p.evaluate(() => (document.getElementById('h-hint') || {}).textContent);
      await p.screenshot({ path: 'tests/out/sat-form-stamped.png' }); console.log('wrote tests/out/sat-form-stamped.png  keys ' + await keys() + '  hint "' + hint + '"');
      await p.keyboard.press('KeyJ');
      await p.waitForFunction(() => !window.__game.scene.form, null, { timeout: 5000 });
      await p.waitForTimeout(600); // the batch card is up
      await (await p.$('canvas')).screenshot({ path: 'tests/out/sat-ring-card.png' }); console.log('wrote tests/out/sat-ring-card.png  keys ' + await keys());
      // the dot on the ring's far side: turn until it is on the back band, then hold still
      await p.evaluate(() => { const s = window.__game.scene; s.scene.pause(); let best = null; for (let k = 0; k < 64; k++) { s.yaw = k * Math.PI / 32; s.drawBoard(); const q = s.view.project(s.view.cellPos(s.ph.beads[0])); if (s.view.onBack(q) && (!best || q.z < best.z)) best = { z: q.z, k }; } if (best) { s.yaw = best.k * Math.PI / 32; s.drawBoard(); } window.__backShot = !!best; });
      await p.waitForTimeout(300);
      await (await p.$('canvas')).screenshot({ path: 'tests/out/sat-ring-back.png' }); console.log('wrote tests/out/sat-ring-back.png  dot on the far band: ' + await p.evaluate(() => window.__backShot));
      await ctx.close(); continue;
    }
    await p.evaluate(() => { if (window.__game.scene.form) window.__game.scene.form.dismiss(); });
    if (at) { await p.evaluate(() => window.__game.scene.win()); await p.waitForFunction(at => window.__game.scene.levelIdx === at, at, { timeout: 30000 }); }
    // turn it a little so the shot shows the surface mid-turn
    await p.keyboard.down('KeyD'); await p.waitForTimeout(350); await p.keyboard.up('KeyD');
    if (batch > 1 || at) { await p.keyboard.down('KeyW'); await p.waitForTimeout(250); await p.keyboard.up('KeyW'); }
    await p.waitForTimeout(4200);
    if (batch === 3) {
      // a second shot of batch 3 turned to face the blur
      await p.evaluate(() => { const s = window.__game.scene, B = s.B, c = s.level.blur[1]; let best = 0, bz = -9; for (let o = 0; o < B.nO; o++) { const m = B.matrix(o), q = [B.pos[c * 3], B.pos[c * 3 + 1], B.pos[c * 3 + 2]], z = m[6] * q[0] + m[7] * q[1] + m[8] * q[2], sc = z - Math.abs(B.angles(o).pitch) * 0.3; if (sc > bz) { bz = sc; best = o; } } const a = B.angles(best); s.yaw = a.yaw; s.pitch = a.pitch; });
      await p.waitForTimeout(1500);
      await (await p.$('canvas')).screenshot({ path: 'tests/out/sat-globe-b3-blur.png' }); console.log('wrote tests/out/sat-globe-b3-blur.png');
    }
    const canvas = await p.$('canvas');
    await canvas.screenshot({ path: 'tests/out/sat-' + name + '.png' });
    console.log('wrote tests/out/sat-' + name + '.png');
    await ctx.close();
  }
  // the kids' room: the same game show screen, playing itself on the big screen
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.__noPanels = true; });
    await p.goto(BASE + '/local.html#kids'); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'kids' && window.__game.scene.t > 5.2, null, { timeout: 30000 });
    await (await p.$('canvas')).screenshot({ path: 'tests/out/sat-kids.png' }); console.log('wrote tests/out/sat-kids.png');
    await ctx.close();
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
