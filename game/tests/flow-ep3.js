// Episode 3 flow: the fall (a free drop down the shaft kills, a wall slide is safe, the rotten
// floor hands off to the east wing); the heap (J tops her up to five, never more; a thrown pebble
// stays and J picks it up); a sensor sees a pebble and the strike takes the pebble; a sensor
// catches her moving; running in a sensor's range trips it (it used to put the sensor to sleep);
// every laser in the gallery tells first and takes a life when it touches her; the robot's shell
// costs a heart; the dumbwaiter sends the robot to the library's far end; three chains bring the
// chandelier down; W (not J) opens the workshop door; the door opens; on to batch 3.
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
  // the stub halfway down is a real rest: with the debris on, nothing lands on it
  await p.evaluate(() => { const s = window.__game.scene, k = s.kid; s.lanes.forEach(L => { L.next = s.clock + L.phase + 0.2; L.rock = null; L.warned = false; }); k.x = 164; k.y = 33 * 16 - k.h; k.vx = 0; k.vy = 0; k.peakY = k.y; });
  await p.waitForTimeout(6000);
  const rest = await p.evaluate(() => ({ dead: window.__game.scene.dead, hp: window.__game.scene.kid.hp }));
  ok('the stub is a safe rest with the debris falling (hp ' + rest.hp + ')', !rest.dead && rest.hp === 3);
  // a free drop that brushes past the stub does not reset the fall: still too far
  await quiet(); await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.x = 177; k.y = 448; k.vx = 0; k.vy = 0; k.peakY = k.y; s.takeoffY = null; });
  await until(() => window.__game.scene.dead || window.__game.scene.phase !== 'walk', null, 8000);
  ok('a drop brushing the stub still kills her (no skip for 1 HP)', await p.evaluate(() => window.__game.scene.dead));
  await until(() => { const s = window.__game.scene; return s.sys.settings.key === 'fall' && s.ep.take === 3 && !s.dead && s.clock > 0.4; }, null, 20000);
  // sliding down the wall (holding toward it) is safe, and the rotten floor gives way
  await quiet(); await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.x = 199; k.y = 448; k.vx = 0; k.vy = 0; k.peakY = k.y; });
  await p.keyboard.down('KeyD');
  await until(() => window.__game.scene.phase !== 'walk' || window.__game.scene.dead, null, 15000); await p.keyboard.up('KeyD');
  ok('a wall slide reaches the bottom unhurt (hp ' + await p.evaluate(() => window.__game.scene.kid.hp) + ')', await p.evaluate(() => !window.__game.scene.dead && window.__game.scene.kid.hp === 3));
  await until(() => window.__game.scene.sys.settings.key === 'eastwing' && window.__game.scene.clock > 0.5);
  ok('the rotten floor gives way and she lands in the east wing', true);
  // ---- the heap: J tops her pockets up to five
  await put(10, 27); await until(() => window.__game.scene.nearThing === window.__game.scene.pileThing, null, 4000);
  await press('KeyJ'); await until(() => window.__game.scene.pebbles === 5); ok('J at the heap: five pebbles', true);
  await p.waitForTimeout(200); await p.evaluate(() => window.__game.scene.bubbles.clear('item'));
  await press('KeyJ'); await p.waitForTimeout(200);
  ok('J again with full pockets: still five (' + await p.evaluate(() => window.__game.scene.pebbles) + ')', await p.evaluate(() => window.__game.scene.pebbles === 5));
  ok('the heap stays (it is a heap, not five stones)', await p.evaluate(() => !window.__game.scene.pileThing.off));
  await p.evaluate(() => { window.__game.scene.bubbles.clear('item'); window.__game.scene.kid.face = 'left'; });
  await press('KeyK'); await until(() => window.__game.scene.pebbles === 4 && !window.__game.scene.flight);
  await until(() => window.__game.scene.floorPebbles.length === 1, null, 4000);
  ok('K throws one; it stays where it landed', true);
  await p.evaluate(() => { const s = window.__game.scene, fp = s.floorPebbles[0]; s.placeTile(fp.x, fp.y); });
  await p.waitForTimeout(150);
  await press('KeyJ'); await until(() => window.__game.scene.pebbles === 5 && window.__game.scene.floorPebbles.length === 0, null, 4000);
  ok('J picks a thrown pebble up again', true);
  // full pockets: a pebble on the floor stays there
  await p.evaluate(() => { const s = window.__game.scene, k = s.kid; const fp = { x: k.tx, y: k.ty, dx: 0, dy: 0 }; fp.thing = { tx: k.tx, ty: k.ty, reach: 1, label: 'J', use: () => s.pickPebble(fp) }; s.floorPebbles.push(fp); s.things.push(fp.thing); });
  await press('KeyJ'); await p.waitForTimeout(150);
  ok('with five, a floor pebble stays on the floor (' + await p.evaluate(() => window.__game.scene.pebbles) + ')', await p.evaluate(() => window.__game.scene.pebbles === 5 && window.__game.scene.floorPebbles.length === 1));
  await p.evaluate(() => { const s = window.__game.scene; s.floorPebbles.forEach(fp => { fp.thing.off = true; }); s.floorPebbles = []; s.pebbles = 3; });
  await put(10, 27); await until(() => window.__game.scene.nearThing === window.__game.scene.pileThing, null, 4000);
  await press('KeyJ'); await until(() => window.__game.scene.pebbles === 5, null, 3000); ok('J at the heap tops 3 up to 5', true);
  // a pebble thrown into a sensor's reach: the satellite shoots the pebble, not her
  await p.evaluate(() => { window.__noDeath = true; });
  await put(14, 31); await p.evaluate(() => { window.__game.scene.kid.face = 'right'; window.__game.scene.sensors.forEach(s => { s.cool = 0; }); });
  await press('KeyK');
  await until(() => window.__game.scene.strikeFx.busy, null, 5000);
  const tgt = await p.evaluate(() => { const s = window.__game.scene, sh = s.strikeFx.shot, e = sh.paths[0].pts[sh.paths[0].pts.length - 1]; return { x: Math.round(e.x), y: Math.round(e.y), kx: Math.round(s.kidPx().x), style: sh.style }; });
  ok('a sensor sees the pebble and the satellite fires at it (' + tgt.style + ', at x ' + tgt.x + ', she is at x ' + tgt.kx + ')', Math.abs(tgt.x - tgt.kx) > 20);
  await until(() => !window.__game.scene.strikeFx.busy, null, 5000);
  ok('the pebble it hit is gone', await p.evaluate(() => window.__game.scene.floorPebbles.length === 0));
  await p.evaluate(() => { window.__noDeath = false; });
  await until(() => window.__game.scene.sensors.every(s => s.cool <= 0), null, 6000); // the tripped sensor recharges
  // walking through the first sensor without stopping: a pulse catches her
  await put(14, 31); await p.keyboard.down('KeyD');
  await until(() => window.__game.scene.dead, null, 20000); await p.keyboard.up('KeyD');
  const lives0 = await p.evaluate(() => window.__game.scene.takesLeft);
  await until(() => window.__game.scene.ep.take === 2 && !window.__game.scene.dead && window.__game.scene.clock > 0.3);
  ok('a sensor sees her moving; a body stays (' + await p.evaluate(() => window.__game.scene.ep.bodies.map(b => b.cause).join()) + ')', await p.evaluate(() => window.__game.scene.ep.bodies.length === 1));
  // running in a sensor's range trips it, pulse or not (it used to go to sleep and let her by)
  await p.evaluate(() => window.__game.scene.sensors.forEach(s => { s.window = 0; s.cool = 0; }));
  await put(14, 31); await p.keyboard.down('ShiftLeft'); await p.keyboard.down('KeyD');
  await until(() => window.__game.scene.dead, null, 8000); await p.keyboard.up('KeyD'); await p.keyboard.up('ShiftLeft');
  const runAt = await p.evaluate(() => window.__game.scene.tileOf().x);
  ok('running into a sensor\'s range trips it and the strike comes (at tile x ' + runAt + ')', runAt <= 22);
  await until(() => window.__game.scene.ep.take === 3 && !window.__game.scene.dead && window.__game.scene.clock > 0.3);
  // the gallery's lasers: each tells (blink and two ticks) before it fires
  const order = await p.evaluate(() => { const s = window.__game.scene, out = []; let prev = null; for (let t = 0; t < 2.4; t += 0.02) { window.__ewLaserT = t; s.updateLasers(0); const st = s.lasers[0].st; if (st !== prev) out.push(st); prev = st; } window.__ewLaserT = null; return out.join(' '); });
  ok('a laser goes dark, tells, then fires (' + order + ')', /tell on/.test(order) && !/off on/.test(order));
  // every beam that touches her takes a life
  for (let i = 0; i < 3; i++) {
    const r = await p.evaluate(i => {
      const s = window.__game.scene, b = s.lasers[i], L = { period: 2.4, tell: 0.55, on: 0.85 };
      window.__ewLaserT = b.phase + (L.period - L.on - L.tell) + L.tell + 0.3; // inside its shot
      s.placeTile(33, b.y + 1); return { y: b.y, lives: s.takesLeft };
    }, i);
    await p.keyboard.down('KeyW'); await until(() => window.__game.scene.dead, null, 6000); await p.keyboard.up('KeyW');
    const after = await p.evaluate(() => ({ lives: window.__game.scene.takesLeft, cause: window.__game.scene.ep.bodies[window.__game.scene.ep.bodies.length - 1].cause }));
    ok('the laser on row ' + r.y + ' kills her: ' + after.cause + ', lives ' + r.lives + ' to ' + after.lives, after.cause === 'laser' && (after.lives === r.lives - 1 || (r.lives === 1 && after.lives === 0)));
    await p.evaluate(() => { window.__ewLaserT = null; });
    await until(() => !window.__game.scene.dead && window.__game.scene.clock > 0.3, null, 20000);
  }
  // walking into the robot: a shock and a heart, not a death (it cannot see its own feet)
  const bump = await p.evaluate(() => { const s = window.__game.scene, R = s.robot; R.route = []; R.mode = 'off'; R.x = Math.round(R.x); R.y = Math.round(R.y); R.face = 0; const k = s.kid; k.tx = k.fx = R.x - 1; k.ty = k.fy = R.y; k.p = 1; k.moving = false; s.camX = k.tx * 16 + 8; s.camY = k.ty * 16 + 8; return s.blocked(R.x - 1, R.y) ? null : s.hp; });
  await p.keyboard.down('KeyD'); await p.waitForTimeout(150); await p.keyboard.up('KeyD'); await p.waitForTimeout(300);
  ok('walking into the robot costs a heart (hp ' + bump + ' to ' + await p.evaluate(() => window.__game.scene.hp) + ')', await p.evaluate(b => window.__game.scene.hp === b - 1 && !window.__game.scene.dead, bump));
  await p.evaluate(() => { window.__game.scene.robot.mode = 'patrol'; });
  // the workshop: J at its door does nothing; W goes in
  await p.evaluate(() => { window.__noDeath = true; });
  await put(4, 26); await p.waitForTimeout(150);
  await press('KeyJ'); await p.waitForTimeout(400);
  ok('J at the workshop door does not open it', await p.evaluate(() => !window.__unseen.game.scene.isActive('room')));
  await press('KeyW', 200);
  await until(() => window.__unseen.game.scene.isActive('room'), null, 4000); ok('W at the workshop door goes in', true);
  await p.evaluate(() => window.__unseen.game.scene.getScene('room').leave());
  await until(() => window.__game.scene.sys.settings.key === 'eastwing' && !window.__unseen.game.scene.isActive('room') && window.__game.scene.sys.isActive(), null, 8000);
  // the dumbwaiter: a pebble in at the hatch draws the robot to the far end of the library
  await p.evaluate(() => { window.__noDeath = true; window.__game.scene.pebbles = 2; });
  await put(34, 13); await until(() => window.__game.scene.nearThing === window.__game.scene.dumbThing, null, 4000);
  await press('KeyJ');
  await until(() => window.__game.scene.robot.mode === 'investigate' && window.__game.scene.robot.target[0] === 15, null, 6000);
  ok('a pebble down the dumbwaiter sends the robot to the library\'s far wall', true);
  // the chandelier: three chains from the shadowed side of each pillar
  for (const [x, y] of [[41, 3], [50, 3], [50, 14]]) {
    await put(x, y); await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.hold);
    await p.keyboard.down('KeyJ'); await until(n => window.__game.scene.ch.cut > n, await p.evaluate(() => window.__game.scene.ch.cut), 20000); await p.keyboard.up('KeyJ');
  }
  await until(() => window.__game.scene.doorOpen, null, 20000); ok('three chains: the chandelier falls and the door opens', true);
  await p.screenshot({ path: 'tests/out/e3-door.png' });
  await put(46, 2); await p.waitForTimeout(150);
  ok('under the open door, the hint says W (' + await p.evaluate(() => document.getElementById('h-hint').textContent) + ')', await p.evaluate(() => /W goes up/.test(document.getElementById('h-hint').textContent)));
  // N there takes her through (review skip ahead), the same as W
  await p.evaluate(() => window.__game.scene.skipAhead());
  ok('N under the open door takes her through', await p.evaluate(() => window.__game.scene.leaving));
  await until(() => window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.batch === 3, null, 60000);
  ok('the door leads to satellite batch 3', true);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
