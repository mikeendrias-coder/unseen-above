// Hazard and collision audit for the side-view episodes (Nov 18 playtest): every watcher (lamp,
// drone, scan, camera, laser) costs a life through the shared death path; every house hazard
// (chandelier, polisher, slab, falling rock) costs HP and never leaves her stuck inside it; and
// the furniture that looks solid holds her up.
// node tests/hazards.js
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 20000, polling: 50 });
  let fails = 0;
  const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  const fresh = () => until(() => { const s = window.__game && window.__game.scene; return s && s.kid && !s.dead && s.clock > 0.5 && s.sys.isActive(); }, null, 30000);
  const open = async part => {
    await p.goto('about:blank');
    await p.goto(BASE + '/local.html#' + part); await p.click('#start');
    await until(k => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === k, part, 60000);
    await fresh();
    await p.evaluate(() => { window.__noDeath = false; });
  };
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  // a watcher: put her in its light and hold it there; the take ends through die() with that cause
  const watcher = async (label, want, setup, arg) => {
    await fresh();
    const before = await p.evaluate(() => window.__game.state.episode(window.__game.scene.epId).bodies.length);
    await p.evaluate(setup, arg);
    const id = await p.evaluate(() => window.__game.scene.epId);
    const died = await until(([id, n]) => window.__game.state.episode(id).bodies.length > n, [id, before], 10000).then(() => true, () => false);
    const cause = died ? await p.evaluate(id => { const b = window.__game.state.episode(id).bodies; return b[b.length - 1].cause; }, id) : '';
    ok(label + (died ? ' takes a life (' + cause + ')' : ' did nothing'), died && (!want || cause === want));
    await until(() => !window.__game.scene.dead && window.__game.scene.clock > 0.3, null, 15000).catch(() => {});
  };
  const stands = (label, x, y) => p.evaluate(([x, y]) => { const s = window.__game.scene, k = s.kid; window.__noDeath = true; k.x = x; k.y = y - 40; k.vx = 0; k.vy = 0; k.peakY = k.y; k.onGround = false; }, [x, y])
    .then(() => p.waitForTimeout(700))
    .then(() => p.evaluate(y => { const k = window.__game.scene.kid; return { ok: k.onGround && Math.abs(k.y + k.h - y) < 1, feet: Math.round(k.y + k.h) }; }, y))
    .then(r => ok(label + ' holds her up (feet at ' + r.feet + ', top ' + y + ')', r.ok));

  // ---------------------------------------------------------------- episode 1, the grounds
  await open('grounds');
  for (let i = 0; i < 4; i++) {
    await watcher('grounds: lamp ' + i, ['garden lamp', 'terrace lamp', 'west balcony lamp', 'east balcony lamp'][i], i => { const s = window.__game.scene, L = s.lights[i], k = s.kid, spots = [[25 * 16 + 4, 22 * 16], [60 * 16, 17 * 16], [80 * 16, 5 * 16], [92 * 16, 5 * 16]]; s.safeT = 0; k.x = spots[i][0]; k.y = spots[i][1] - 14; k.vx = k.vy = 0; k.peakY = k.y; s.cameras.main.centerOn(k.x, k.y); const a = Math.atan2(k.y + 7 - L.y, k.x + 4 - L.x) * 180 / Math.PI; L.a0 = L.a1 = a; }, i);
  }
  for (let i = 0; i < 2; i++) {
    await watcher('grounds: drone ' + i, ['fountain drone', 'loggia drone'][i], i => { const s = window.__game.scene, d = s.drones[i], k = s.kid, spots = [[50 * 16, 17 * 16], [70 * 16, 12 * 16]]; s.safeT = 0; k.x = spots[i][0]; k.y = spots[i][1] - 14; k.vx = k.vy = 0; k.peakY = k.y; d.x = d.x0 = d.x1 = k.x + 4; }, i);
  }
  await watcher('grounds: the scan', 'scan', () => { const s = window.__game.scene, k = s.kid; s.safeT = 0; k.x = 80 * 16; k.y = 5 * 16 - 14; k.vx = k.vy = 0; k.peakY = k.y; s.scan = { x: k.x + 20, t: 0 }; });
  await fresh();
  await stands('grounds: the urn at tile 40', 40 * 16 + 4, 17 * 16 - 12);
  await stands('grounds: the urn at tile 54', 54 * 16 + 4, 17 * 16 - 12);

  // ---------------------------------------------------------------- episode 2, the gallery
  await open('gallery');
  await p.evaluate(() => { const s = window.__game.scene; s.giveGlasses(); });
  await watcher('gallery: stair camera', 'stair camera', () => { const s = window.__game.scene, c = s.cams[0], k = s.kid; s.safeT = 0; k.x = 26 * 16 + 4; k.y = 18 * 16 - 14; k.vx = k.vy = 0; s.cameras.main.centerOn(k.x, k.y); const a = Math.atan2(k.y + 7 - c.y, k.x + 4 - c.x) * 180 / Math.PI; c.a0 = c.a1 = a; });
  await watcher('gallery: broken camera', 'broken camera', () => { const s = window.__game.scene, c = s.cams[1], k = s.kid; s.safeT = 0; k.x = 64 * 16; k.y = 13 * 16 - 14; k.vx = k.vy = 0; s.cameras.main.centerOn(k.x, k.y); const a = Math.atan2(k.y + 7 - c.y, k.x + 4 - c.x) * 180 / Math.PI; c.steps = [[a, 1]]; });
  await watcher('gallery: the laser', 'laser', () => { const s = window.__game.scene, k = s.kid, L = s.laserDef; s.safeT = 0; k.x = 82 * 16; k.y = 21 * 16 - 14; k.vx = k.vy = 0; s.laser.awake = true; s.laser.t = 0; L.order = L.order.map(() => 'low'); s.laser.t = L.first + L.tell + L.charge + 0.05; });
  // the polisher: 1 HP, she lives
  await fresh();
  const pol = await p.evaluate(async () => { const s = window.__game.scene, k = s.kid; window.__noDeath = false; k.hp = 3; k.inv = 0; s.safeT = 0; s.cams.forEach(c => { c.range = 0; }); k.x = s.polisher.x - 3; k.y = 13 * 16 - 14; k.vx = k.vy = 0; await new Promise(r => setTimeout(r, 400)); return { hp: k.hp, dead: s.dead }; });
  ok('gallery: the polisher costs HP (hp ' + pol.hp + '), not a life', pol.hp < 3 && !pol.dead);
  // the chandelier, in story mode (no HP lost): she is thrown clear, never stuck inside the wreck
  await open('gallery');
  await p.evaluate(() => { const s = window.__game.scene, k = s.kid; window.__noDeath = true; s.cams.forEach(c => { c.range = 0; }); k.x = 69 * 16 + 8 - 4; k.y = 13 * 16 - 14; k.vx = k.vy = 0; });
  await until(() => window.__game.scene.drop.phase === 'down', null, 8000);
  await p.waitForTimeout(500);
  const wreck = await p.evaluate(() => { const s = window.__game.scene, k = s.kid; const r = s.props.find(q => q.id === 'fallen chandelier'); const inside = k.x < r.x + r.w && k.x + k.w > r.x && k.y < r.y + r.h && k.y + k.h > r.y; return { inside, x: Math.round(k.x), r: [r.x, r.w] }; });
  ok('gallery: in story mode the chandelier throws her clear (x ' + wreck.x + ', wreck ' + wreck.r + ')', !wreck.inside);
  // she can walk off and back: not stuck
  const moved = await p.evaluate(async () => { const s = window.__game.scene, k = s.kid, x0 = k.x, c = s.ctl, r0 = c.right, l0 = c.left; const dir = k.x < 69 * 16 + 8 ? -1 : 1; if (dir > 0) c.right = () => true; else c.left = () => true; await new Promise(r => setTimeout(r, 500)); c.right = r0; c.left = l0; return Math.abs(k.x - x0); });
  ok('gallery: after the wreck she walks away (' + Math.round(moved) + ' px)', moved > 8);
  await stands('gallery: the fallen chandelier', 69 * 16 + 4, 13 * 16 - 7);
  await stands('gallery: the dust sheets', 40 * 16, 21 * 16 - 6);

  // ---------------------------------------------------------------- episode 3, the fall
  await open('fall');
  const rock = await p.evaluate(async () => {
    const s = window.__game.scene, k = s.kid, L = s.lanes[0]; window.__noDeath = false; k.hp = 3; k.inv = 0;
    k.x = L.x; k.y = L.y1 - 14; k.vx = k.vy = 0; k.peakY = k.y; s.noFallDamage = true;
    L.rock = { y: k.y - 30, vy: 80 };
    for (let i = 0; i < 40 && k.hp === 3 && L.rock; i++) { k.x = L.x; await new Promise(r => setTimeout(r, 30)); }
    return { hp: k.hp, dead: s.dead };
  });
  ok('fall: a falling rock costs HP (hp ' + rock.hp + '), not a life', rock.hp < 3 && !rock.dead);

  // ---------------------------------------------------------------- episode 4, the slab in the run
  await open('bedroom');
  const slab = await p.evaluate(async () => {
    const s = window.__game.scene, k = s.kid; window.__noDeath = false;
    s.cams.forEach(c => { c.range = 0; c.caught = false; });
    const S = s.run && s.run.slab, L = { x: 1128, w: 34 };
    if (!S) return { skip: true };
    s.collapse = { x: 54 * 16, t: 0, done: true }; k.hp = 3; k.inv = 0; k.x = L.x + 12; k.y = 160 - 14; k.vx = k.vy = 0; k.peakY = k.y; S.state = 'fall'; S.t = 0;
    await new Promise(r => setTimeout(r, 400));
    const r = s.slabProp, inside = k.x < r.x + r.w && k.x + k.w > r.x && k.y < r.y + r.h && k.y + k.h > r.y;
    return { hp: k.hp, dead: s.dead, inside, x: Math.round(k.x) };
  });
  if (slab.skip) ok('bedroom: slab not reachable in this build', false);
  else ok('bedroom: the slab costs HP (hp ' + slab.hp + '), not a life, and throws her clear (x ' + slab.x + ')', slab.hp < 3 && !slab.dead && !slab.inside);

  // ---------------------------------------------------------------- side rooms: the furniture holds her up
  for (const [room, spots] of [['staff', [[90, 128]]], ['keeper', [[210, 120], [240, 120]]], ['workshop', [[120, 118], [200, 128]]], ['wardrobe', [[200, 134]]]]) {
    await p.evaluate(id => { const b = window.__unseen.game.scene.getScene('bedroom'); b.scene.launch('room', { id, from: 'bedroom', take: 1 }); b.scene.sleep(); }, room);
    await until(id => window.__unseen.game.scene.isActive('room') && window.__game.scene.sys.settings.key === 'room' && window.__game.scene.roomId === id && window.__game.scene.clock > 0.3, room);
    const start = await p.evaluate(() => { const s = window.__game.scene, k = s.kid; return !s.boxHits(k.x, k.y, k.w, k.h); });
    ok(room + ': she starts clear of the furniture', start);
    for (const [x, y] of spots) await stands(room + ': furniture at ' + x, x, y);
    await p.evaluate(() => window.__game.scene.leave());
    await until(() => !window.__unseen.game.scene.isActive('room'), null, 8000);
    await p.waitForTimeout(300);
  }

  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  console.log(fails ? fails + ' FAILED' : 'all ok');
  await b.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
