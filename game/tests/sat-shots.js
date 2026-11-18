// Screenshots of the satellite puzzles: the orbit ring and each batch's globe, on its own screen.
// node tests/sat-shots.js  (serve dist first; UA_BASE picks the port). Writes tests/out/sat-*.png
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const shots = [['ring', 1, 0], ['globe-b1', 1, 1], ['globe-b2', 2, 0], ['globe-b3', 3, 0], ['globe-b4', 4, 0]];
  for (const [name, batch, at] of shots) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
    await p.goto(BASE + '/local.html#batch' + batch); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.level, null, { timeout: 30000 });
    if (at) { await p.evaluate(() => window.__game.scene.win()); await p.waitForFunction(at => window.__game.scene.levelIdx === at, at, { timeout: 30000 }); }
    // turn it a little so the shot shows the surface mid-turn
    await p.keyboard.down('KeyD'); await p.waitForTimeout(350); await p.keyboard.up('KeyD');
    if (batch > 1 || at) { await p.keyboard.down('KeyW'); await p.waitForTimeout(250); await p.keyboard.up('KeyW'); }
    await p.waitForTimeout(4200);
    const canvas = await p.$('canvas');
    await canvas.screenshot({ path: 'tests/out/sat-' + name + '.png' });
    console.log('wrote tests/out/sat-' + name + '.png');
    await ctx.close();
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
