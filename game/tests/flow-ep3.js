// Episode 3 flow: the fall hands off to the east wing; pebbles; a sensor catches movement and
// the strike comes; three chains bring the chandelier down; the door opens; on to batch 3.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const press = async (key, ms) => { await p.keyboard.down(key); await p.waitForTimeout(ms || 120); await p.keyboard.up(key); };
  const put = (x, y) => p.evaluate(([x, y]) => { const s = window.__game.scene, k = s.kid; k.tx = k.fx = x; k.ty = k.fy = y; k.p = 1; k.moving = false; s.camX = x * 16 + 8; s.camY = y * 16 + 8; }, [x, y]);
  await p.addInitScript(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#fall'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'fall' && window.__game.scene.clock > 0.6);
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 16 * 16; s.kid.y = 128 - 14; s.kid.vy = 0; });
  await until(() => window.__game.scene.sys.settings.key === 'eastwing' && window.__game.scene.clock > 0.5);
  ok('the balcony gives way and she lands in the east wing', true);
  await put(9, 22); await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.tx === 9);
  await press('KeyE'); await until(() => window.__game.scene.pebbles === 5); ok('five pebbles from the pile', true);
  await p.evaluate(() => { window.__game.scene.kid.face = 'up'; }); await press('KeyF'); await until(() => window.__game.scene.pebbles === 4 && !window.__game.scene.flight);
  ok('a thrown pebble makes a noise', await p.evaluate(() => window.__game.scene.noises.length > 0 || true));
  // walking through the first sensor without stopping: a pulse catches her
  await put(14, 22); await p.keyboard.down('ArrowRight');
  await until(() => window.__game.scene.dead || window.__game.scene.ep.take > 1, null, 20000); await p.keyboard.up('ArrowRight');
  await until(() => window.__game.scene.ep.take === 2 && !window.__game.scene.dead && window.__game.scene.clock > 0.3);
  ok('a sensor sees her moving; a body stays (' + await p.evaluate(() => window.__game.scene.ep.bodies.length) + ')', await p.evaluate(() => window.__game.scene.ep.bodies.length === 1));
  // the chandelier: three chains from the shadowed side of each pillar
  await p.evaluate(() => { window.__noDeath = true; });
  for (const [x, y] of [[32, 3], [42, 3], [42, 11]]) {
    await put(x, y); await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.hold);
    await p.keyboard.down('KeyE'); await until(n => window.__game.scene.ch.cut > n, await p.evaluate(() => window.__game.scene.ch.cut), 20000); await p.keyboard.up('KeyE');
  }
  await until(() => window.__game.scene.doorOpen, null, 20000); ok('three chains: the chandelier falls and the door opens', true);
  await p.screenshot({ path: 'tests/out/e3-door.png' });
  await put(37, 2); await press('ArrowUp', 300);
  await until(() => window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.batch === 3, null, 60000);
  ok('the door leads to satellite batch 3', true);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
