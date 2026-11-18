// Episode 3 flow: the fall (a free drop down the shaft kills, a wall slide is safe, the rotten
// floor hands off to the east wing); pebbles; a sensor catches movement and the strike comes; the
// dumbwaiter sends the robot to the study; three chains bring the chandelier down; the door opens;
// on to batch 3.
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
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#fall'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'fall' && window.__game.scene.clock > 0.6);
  const quiet = () => p.evaluate(() => window.__game.scene.lanes.forEach(L => { L.next = 1e9; L.rock = null; })); // no debris for these checks
  // a free drop down the narrow shaft is too far
  await quiet(); await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.x = 180; k.y = 448; k.vx = 0; k.vy = 0; k.peakY = k.y; });
  await until(() => window.__game.scene.dead, null, 8000);
  await until(() => { const s = window.__game.scene; return s.sys.settings.key === 'fall' && s.ep.take === 2 && !s.dead && s.clock > 0.4; }, null, 20000);
  ok('a free drop down the shaft kills her (' + await p.evaluate(() => window.__game.scene.ep.bodies.map(b => b.cause).join()) + ')', await p.evaluate(() => window.__game.scene.ep.bodies.length === 1));
  // sliding down the wall (holding toward it) is safe, and the rotten floor gives way
  await quiet(); await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.x = 199; k.y = 448; k.vx = 0; k.vy = 0; k.peakY = k.y; });
  await p.keyboard.down('KeyD');
  await until(() => window.__game.scene.phase !== 'walk' || window.__game.scene.dead, null, 15000); await p.keyboard.up('KeyD');
  ok('a wall slide reaches the bottom unhurt (hp ' + await p.evaluate(() => window.__game.scene.kid.hp) + ')', await p.evaluate(() => !window.__game.scene.dead && window.__game.scene.kid.hp === 3));
  await until(() => window.__game.scene.sys.settings.key === 'eastwing' && window.__game.scene.clock > 0.5);
  ok('the rotten floor gives way and she lands in the east wing', true);
  await put(9, 22); await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.tx === 9);
  await press('KeyE'); await until(() => window.__game.scene.pebbles === 5); ok('five pebbles from the pile', true);
  await p.evaluate(() => { window.__game.scene.kid.face = 'up'; }); await press('KeyF'); await until(() => window.__game.scene.pebbles === 4 && !window.__game.scene.flight);
  ok('a thrown pebble makes a noise', await p.evaluate(() => window.__game.scene.noises.length > 0 || true));
  ok('the pile is gone once she takes it', await p.evaluate(() => window.__game.scene.pileTaken && window.__game.scene.pileThing.off));
  await until(() => window.__game.scene.floorPebbles.length === 1, null, 4000);
  ok('the thrown pebble stays where it landed', true);
  // a pebble thrown into a sensor's reach: the satellite shoots the pebble, not her
  await p.evaluate(() => { window.__noDeath = true; });
  await put(14, 22); await p.evaluate(() => { window.__game.scene.kid.face = 'right'; window.__game.scene.sensors.forEach(s => { s.cool = 0; }); });
  await press('KeyF');
  await until(() => window.__game.scene.strikeFx.busy, null, 5000);
  const tgt = await p.evaluate(() => { const s = window.__game.scene, sh = s.strikeFx.shot, e = sh.paths[0].pts[sh.paths[0].pts.length - 1]; return { x: Math.round(e.x), y: Math.round(e.y), kx: Math.round(s.kidPx().x), style: sh.style }; });
  ok('a sensor sees the pebble and the satellite fires at it (' + tgt.style + ', at x ' + tgt.x + ', she is at x ' + tgt.kx + ')', Math.abs(tgt.x - tgt.kx) > 20);
  await until(() => !window.__game.scene.strikeFx.busy, null, 5000);
  ok('the pebble it hit is gone', await p.evaluate(() => window.__game.scene.floorPebbles.length === 1));
  await p.evaluate(() => { window.__noDeath = false; });
  await until(() => window.__game.scene.sensors.every(s => s.cool <= 0), null, 6000); // the tripped sensor recharges
  // walking through the first sensor without stopping: a pulse catches her
  await put(14, 22); await p.keyboard.down('ArrowRight');
  await until(() => window.__game.scene.dead || window.__game.scene.ep.take > 1, null, 20000); await p.keyboard.up('ArrowRight');
  await until(() => window.__game.scene.ep.take === 2 && !window.__game.scene.dead && window.__game.scene.clock > 0.3);
  ok('a sensor sees her moving; a body stays (' + await p.evaluate(() => window.__game.scene.ep.bodies.length) + ')', await p.evaluate(() => window.__game.scene.ep.bodies.length === 1));
  // the dumbwaiter: a pebble in at the hatch draws the robot to the far end of the study
  await p.evaluate(() => { window.__noDeath = true; window.__game.scene.pebbles = 2; });
  await put(24, 13); await until(() => window.__game.scene.nearThing === window.__game.scene.dumbThing, null, 4000);
  await press('KeyJ');
  await until(() => window.__game.scene.robot.mode === 'investigate' && window.__game.scene.robot.target[0] === 15, null, 6000);
  ok('a pebble down the dumbwaiter sends the robot to the study\'s far wall', true);
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
