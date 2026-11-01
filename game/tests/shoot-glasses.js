// The faulty glasses and the item panel: episode 2 drawer, the panel, static, overheating.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  const shot = n => p.screenshot({ path: `tests/out/gl-${n}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  await p.goto(BASE + '/local.html#gallery'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 1, null, { timeout: 60000 });
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene; s.kid.x = 14 * 16 + 4; s.kid.y = 146; });
  await p.waitForFunction(() => window.__game.scene.nearThing === window.__game.scene.cabinetThing, null, { timeout: 5000 });
  await p.keyboard.press('KeyE');
  await p.waitForFunction(() => document.getElementById('panel').classList.contains('on'), null, { timeout: 8000 });
  await p.waitForTimeout(300); await shot('panel');
  await p.waitForTimeout(500); await p.keyboard.press('Space');
  await p.waitForFunction(() => !document.getElementById('panel').classList.contains('on') && !window.__unseen.game.scene.isPaused('gallery'), null, { timeout: 5000 });
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 30 * 16; });
  await p.waitForTimeout(700); await shot('on');
  await p.evaluate(() => { window.__game.scene.gl.heat = 0.9; }); await p.waitForTimeout(400); await shot('hot');
  await p.waitForFunction(() => window.__game.scene.gl.over > 0, null, { timeout: 8000 }); await p.waitForTimeout(200); await shot('over');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
