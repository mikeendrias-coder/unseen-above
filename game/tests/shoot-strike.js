// Screenshots of the satellite strike at moments of its animation: node tests/shoot-strike.js [scene] [look]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const scene = process.argv[2] || 'grounds', look = process.argv[3] || 'A';
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(l => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: true })); } catch (e) {} }, look);
  await p.goto(BASE + '/local.html#' + scene); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid && window.__game.scene.clock > 1, null, { timeout: 60000 });
  await p.evaluate(sc => {
    const s = window.__game.scene;
    if (sc === 'grounds') { s.lights[0].a0 = s.lights[0].a1 = 139; s.kid.x = 560; s.kid.y = 146; }
    else { s.glasses = true; s.cams[0].a0 = s.cams[0].a1 = 70; s.kid.x = 556; s.kid.y = 146; }
  }, scene);
  await p.waitForFunction(() => { const s = window.__game.scene; return [...(Array.isArray(s.lights) ? s.lights : []), ...(s.cams || [])].some(l => l.lock > 0.2); }, null, { timeout: 30000, polling: 20 });
  await p.screenshot({ path: `tests/out/strike-${scene}-lock.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  await p.waitForFunction(() => window.__game.scene.dead, null, { timeout: 30000 });
  await p.evaluate(() => { window.__game.scene.time.paused = true; });
  for (const t of [0.05, 0.2, 0.3, 0.42, 0.55, 0.75]) {
    await p.evaluate(t => { window.__strikeHold = t; }, t);
    await p.waitForTimeout(350);
    await p.screenshot({ path: `tests/out/strike-${scene}-${t}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  }
  await p.evaluate(() => { window.__strikeHold = null; window.__game.scene.time.paused = false; });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
