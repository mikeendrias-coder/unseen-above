// Screenshots of episode 2 at points along the walk (glasses on), plus any console errors.
// node tests/shoot-gallery.js [look] [x,x,...] [laserTime]
const { chromium } = require('playwright');
(async () => {
  const look = process.argv[2] || 'A';
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.addInitScript(l => { try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: false })); } catch (e) {} }, look);
  await p.goto('http://localhost:8766/local.html?scene=gallery');
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid, null, { timeout: 30000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `tests/out/gl-${look}-start.png` });
  const xs = (process.argv[3] || '200,420,600,780,900,1100,1300').split(',').map(Number);
  const laserT = Number(process.argv[4] || 0);
  for (const x of xs) {
    await p.evaluate(([x, lt]) => { const s = window.__game.scene; window.__noDeath = true; s.glasses = true; s.glassesSprite.setVisible(false); s.kid.x = x; s.kid.y = 146; s.dead = false; s.cams.forEach(c => c.lock = 0); if (lt && x > 1000) { s.laser.awake = true; window.__laserT = lt; } s.cameras.main.centerOn(x + 18, 90); }, [x, laserT]);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `tests/out/gl-${look}-${x}.png` });
  }
  const info = await p.evaluate(() => ({ S: window.__unseen.display.S, canvas: [window.__unseen.game.canvas.width, window.__unseen.game.canvas.height] }));
  console.log(JSON.stringify(info));
  console.log(errs.slice(0, 20).join('\n') || 'no console errors');
  await b.close();
})();
