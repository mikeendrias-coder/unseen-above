// The optional side rooms in episodes 3 and 4: in, look at something, back out where she was.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const active = k => p.evaluate(k => window.__unseen.game.scene.isActive(k), k);
  const visit = async (label, shot) => {
    await until(() => window.__unseen.game.scene.isActive('room') && window.__game.scene.sys.settings.key === 'room' && window.__game.scene.clock > 0.4, null, 10000);
    // walk to the first thing and look at it
    await p.evaluate(() => { const s = window.__game.scene, t = s.things[0]; s.kid.x = (t.x0 + t.x1) / 2 - 4; });
    await p.waitForTimeout(200); await p.keyboard.press('KeyE');
    await until(() => window.__game.scene.bubbles.list.size > 0, null, 4000);
    await p.screenshot({ path: 'tests/out/' + shot + '.png' });
    ok(label + ': a thing to look at says something', true);
    await p.evaluate(() => { const s = window.__game.scene, d = s.things.find(t => t.door); s.kid.x = d.x0 + 4; }); await p.waitForTimeout(200); await p.keyboard.down('KeyW'); await p.waitForTimeout(150); await p.keyboard.up('KeyW'); // the door back is on either side; doors open with W only
  };
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#eastwing'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'eastwing' && window.__game.scene.clock > 0.5);
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene, k = s.kid; k.tx = k.fx = 4; k.ty = k.fy = 19; k.p = 1; k.moving = false; s.camX = 72; s.camY = 312; });
  await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.ty === 18, null, 4000);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(150); await p.keyboard.up('KeyW');
  await visit('episode 3 workshop', 'room-workshop');
  await until(() => window.__game.scene.sys.settings.key === 'eastwing' && !window.__unseen.game.scene.isActive('room'), null, 8000);
  ok('back in the east wing, on the same spot', await p.evaluate(() => window.__game.scene.kid.tx === 4 && window.__game.scene.kid.ty === 19));
  await p.goto(BASE + '/local.html#bedroom');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 0.5);
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene, k = s.kid; k.x = 12 * 16 + 6; k.y = 146; });
  await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.x0 === 12 * 16 + 4, null, 4000);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(150); await p.keyboard.up('KeyW');
  await visit('episode 4 wardrobe', 'room-wardrobe');
  await until(() => window.__game.scene.sys.settings.key === 'bedroom' && !window.__unseen.game.scene.isActive('room'), null, 8000);
  ok('back in the dark hall, the cameras still running', await p.evaluate(() => { const s = window.__game.scene; const t = s.clock; return new Promise(r => setTimeout(() => r(s.clock > t), 400)); }));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
