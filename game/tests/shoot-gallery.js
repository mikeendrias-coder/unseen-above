// Screenshots of episode 2 at points along the climb (tile x:row of the floor), glasses on, at
// device scale 1, plus any console errors.
// node tests/shoot-gallery.js [x:row,x:row,...] [laserTime] [take]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  const take = Number(process.argv[4] || 1);
  await p.addInitScript(take => { window.__noPanels = true; const bodies = []; for (let i = 1; i < take; i++) bodies.push({ x: 600 + i * 70, y: 336, take: i, cause: 'stair camera' }); try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: { ep2: { take, bodies, done: false } }, seenIntro: true })); } catch (e) {} }, take);
  await p.goto(BASE + '/local.html?scene=gallery');
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid, null, { timeout: 30000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `tests/out/gl-start.png`, clip: { x: 200, y: 42, width: 960, height: 540 } });
  const spots = (process.argv[2] || '10:21,24:18,33:13,45:13,57:13,66:13,80:21').split(',').map(s => s.split(':').map(Number));
  const laserT = Number(process.argv[3] || 0);
  for (const [x, row] of spots) {
    await p.evaluate(([x, row, lt]) => { const s = window.__game.scene; window.__noDeath = true; s.glasses = true; s.gl.has = true; s.gl.on = true; s.glassesSprite.setVisible(false); s.kid.x = x * 16; s.kid.y = row * 16 - 14; s.kid.vy = 0; s.kid.peakY = s.kid.y; s.dead = false; s.cams.forEach(c => c.lock = 0); if (lt && x > 74) { s.laser.awake = true; window.__laserT = lt; } }, [x, row, laserT]);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `tests/out/gl-${x}-${row}.png`, clip: { x: 200, y: 42, width: 960, height: 540 } });
  }
  console.log(errs.slice(0, 20).join('\n') || 'no console errors');
  await b.close();
})();
