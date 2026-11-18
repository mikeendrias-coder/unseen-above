// Screenshots of episode 1 at points along the climb (tile x:tile row of the floor she stands
// on), at device scale 1, plus any console errors.
// node tests/shoot-grounds.js [x:row,x:row,...] [take]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  const take = Number(process.argv[3] || 1);
  await p.addInitScript(take => { window.__noPanels = true; const bodies = []; for (let i = 1; i < take; i++) bodies.push({ x: 300 + i * 90, y: 400, take: i, cause: 'garden lamp' }); try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: { ep1: { take, bodies, done: false } }, seenIntro: true })); } catch (e) {} }, take);
  await p.goto(BASE + '/local.html?scene=grounds');
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  const spots = (process.argv[2] || '4:25,22:25,36:25,46:17,58:17,68:12,80:5,94:5').split(',').map(s => s.split(':').map(Number));
  for (const [x, row] of spots) {
    await p.evaluate(([x, row]) => { const s = window.__game.scene; window.__noDeath = true; s.kid.x = x * 16; s.kid.y = row * 16 - 14; s.kid.vy = 0; s.kid.peakY = s.kid.y; s.dead = false; s.lights.forEach(l => l.lock = 0); s.drones.forEach(d => d.lock = 0); }, [x, row]);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `tests/out/g-${x}-${row}.png`, clip: { x: 200, y: 42, width: 960, height: 540 } });
  }
  console.log(errs.slice(0, 20).join('\n') || 'no console errors');
  await b.close();
})();
