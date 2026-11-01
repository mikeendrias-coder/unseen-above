// Screenshots of episode 1 at several points along the walk, plus any console errors.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const look = process.argv[2] || 'A';
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.addInitScript(l => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: false })); } catch (e) {} }, look);
  await p.goto(BASE + '/local.html?scene=grounds');
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  const xs = (process.argv[3] || '40,300,520,700,980,1250,1450,1650').split(',').map(Number);
  for (const x of xs) {
    await p.evaluate(x => { const s = window.__game.scene; s.kid.x = x; s.kid.y = 146; s.dead = false; window.__noDeath = true; s.lights.forEach(l => l.lock = 0); s.drones.forEach(d => d.lock = 0); s.cameras.main.centerOn(x + 18, 90); }, x);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `tests/out/g-${look}-${x}.png` });
  }
  const info = await p.evaluate(() => ({ S: window.__unseen.display.S, canvas: [window.__unseen.game.canvas.width, window.__unseen.game.canvas.height] }));
  console.log(JSON.stringify(info));
  console.log(errs.slice(0, 20).join('\n') || 'no console errors');
  await b.close();
})();
