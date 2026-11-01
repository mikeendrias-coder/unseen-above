// Every way the satellite strike can come, held at the moment the beam reaches her.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__noPanels = true; window.__noDeath = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  await p.goto(BASE + '/local.html#gallery'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 1, null, { timeout: 60000 });
  for (const style of ['zigzag', 'ceiling', 'bend', 'orbit', 'floor', 'split']) {
    await p.evaluate(style => { const s = window.__game.scene, k = s.kid, v = s.cameras.main.worldView; window.__strikeHold = null; const tot = s.strikeFx.fire({ view: v, tx: k.x + 4, ty: k.y + 7, P: s.P, style }); window.__strikeHold = 0.14 + s.strikeFx.shot.travel - 0.02; }, style);
    await p.waitForTimeout(250);
    await p.screenshot({ path: `tests/out/strike-${style}.png`, clip: { x: 40, y: 34, width: 1280, height: 720 } });
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
