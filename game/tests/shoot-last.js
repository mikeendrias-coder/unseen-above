// The last shot of every ending (Nov 18): frames from each final beat on the old TV, the ending
// screen, and the TV again on each of its channels. Writes tests/out/last-<ending>-<t>.png,
// last-card.png and last-ch<n>.png at deviceScaleFactor 1.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const SHOTS = { vest: ['moon', [3, 9.5, 17]], endall: ['rerun', [6, 14, 15.8]], round2: ['ridge', [5, 11, 13]], lookback: ['playroom', [3.5, 8, 11, 17.6, 19]], couch: ['couch', [8, 12, 16.8]] };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__noPanels = true; });
  await p.goto(BASE + '/local.html#playroom'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.mode === 'room', null, { timeout: 60000 });
  const clip = await p.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return { x: c.left, y: c.top, width: c.width, height: c.height }; });
  for (const [id, [kind, times]] of Object.entries(SHOTS)) {
    await p.evaluate(([k, i]) => window.__game.scene.showLast(k, i), [kind, id]);
    for (const t of times) { await p.waitForFunction(t => window.__finale.t > t, t, { timeout: 60000, polling: 30 }); await p.screenshot({ path: `tests/out/last-${id}-${t}.png`, clip }); }
  }
  await p.evaluate(() => window.__finale.skip()); await p.waitForTimeout(700);
  await p.screenshot({ path: 'tests/out/last-card.png', clip });
  await p.evaluate(() => { window.__finale.pick = 0; window.__finale.press(); });
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(3000); await p.screenshot({ path: `tests/out/last-ch${await p.evaluate(() => window.__finale.channel.n)}.png`, clip }); await p.evaluate(() => window.__finale.flip(1)); }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
