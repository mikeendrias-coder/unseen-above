// The optional side rooms in episodes 3 and 4: in, look at something, back out where she was.
// Then the furniture in all four side rooms (Nov 18): push a table and its things slide off,
// climb from it to a high shelf, push a tin off the shelf so it opens, run into a lamp and a
// chair to knock them over, K to stand one up, K a box off a ledge, push a trunk with a box
// riding on it, and a stretch of random keys in every room with her never inside anything.
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
  // the workshop door is in the landing's north wall (rebuilt east wing, Nov 18); W walks her into it
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene, k = s.kid; k.tx = k.fx = 4; k.ty = k.fy = 26; k.p = 1; k.moving = false; s.camX = 72; s.camY = 424; });
  await until(() => { const d = window.__game.scene.doorAhead(); return d && d[0] === 4 && d[1] === 25; }, null, 4000);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(150); await p.keyboard.up('KeyW');
  await visit('episode 3 workshop', 'room-workshop');
  await until(() => window.__game.scene.sys.settings.key === 'eastwing' && !window.__unseen.game.scene.isActive('room'), null, 8000);
  ok('back in the east wing, on the same spot', await p.evaluate(() => window.__game.scene.kid.tx === 4 && window.__game.scene.kid.ty === 26));
  await p.goto(BASE + '/local.html#bedroom');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 0.5);
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene, k = s.kid; k.x = 12 * 16 + 6; k.y = 146; });
  await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.x0 === 12 * 16 + 4, null, 4000);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(150); await p.keyboard.up('KeyW');
  await visit('episode 4 wardrobe', 'room-wardrobe');
  await until(() => window.__game.scene.sys.settings.key === 'bedroom' && !window.__unseen.game.scene.isActive('room'), null, 8000);
  ok('back in the dark hall, the cameras still running', await p.evaluate(() => { const s = window.__game.scene; const t = s.clock; return new Promise(r => setTimeout(() => r(s.clock > t), 400)); }));
  // ---- the furniture (Nov 18): real keys, game-time waits
  const wait = async sec => { const t0 = await p.evaluate(() => window.__game.scene.clock); await until(t => window.__game.scene.clock >= t, t0 + sec, 20000); };
  const shot = name => p.screenshot({ path: 'tests/out/' + name + '.png', clip: { x: 0, y: 0, width: 1280, height: 860 } });
  const room = async id => {
    if (await p.evaluate(() => window.__game.scene.sys.settings.key === 'room')) { await p.evaluate(() => window.__game.scene.leave()); await until(() => window.__game.scene.sys.settings.key !== 'room', null, 8000); }
    await p.evaluate(id => { window.__noDeath = true; window.__game.scene.enterRoom(id); }, id);
    await until(() => window.__game.scene.sys.settings.key === 'room' && window.__game.scene.clock > 0.4, null, 10000);
  };
  const piece = id => p.evaluate(id => { const q = window.__game.scene.dyn.pieces.find(q => q.id === id); return { x: q.x, y: q.y, pose: q.pose, open: !!q.open, lit: !!q.lit }; }, id);
  const put = (x, y, face) => p.evaluate(([x, y, face]) => { const k = window.__game.scene.kid; k.x = x; k.y = y - 14; k.h = 14; k.crouch = false; k.vx = 0; k.vy = 0; if (face) k.face = face; }, [x, y, face]);
  const inside = () => p.evaluate(() => { const s = window.__game.scene, k = s.kid; return s.boxHits(k.x, k.y, k.w, k.h); });
  const hold = async (key, sec) => { await p.keyboard.down(key); await wait(sec); await p.keyboard.up(key); };
  await p.goto(BASE + '/local.html#grounds');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.clock > 0.5);
  // the keeper's shed
  await room('keeper');
  const t0 = await piece('work table');
  await put(40, 160); await hold('KeyD', 2.4);
  const t1 = await piece('work table'), fell = await p.evaluate(() => window.__game.scene.dyn.items.filter(i => i.y + i.h === 160).map(i => i.kind));
  ok('shed: walking into the work table pushes it (' + t0.x + ' to ' + t1.x + '); what was on it slid off (' + fell.join(', ') + ')', t1.x > t0.x + 30 && fell.length >= 1 && !await inside());
  await shot('room-keeper-push');
  // from the table's end, a double jump to the high shelf
  await p.evaluate(() => { const s = window.__game.scene, q = s.dyn.pieces.find(q => q.id === 'work table'); q.x = 150; s.dyn.syncRects(q); s.dyn.items.forEach(i => { if (i.y + i.h === 148) i.y = 160 - i.h; }); });
  // she stands on the table just past the shelf's end: up first, then a second jump and left
  await put(152, 148, -1); await wait(0.2);
  // Space held; at the top of the jump, Space again and A, as a player would. The presses are
  // made frame by frame inside the game (headless frames are too uneven to time from outside).
  await p.evaluate(() => {
    const s = window.__game.scene, real = s.ctl, k = s.kid; let stage = 0;
    s.ctl = Object.assign({}, real, {
      jumpPressed: () => { if (stage === 0 && k.onGround) { stage = 1; return true; } if (stage === 1 && k.vy > -40) { stage = 2; return true; } return false; },
      jumpHeld: () => k.vy < 0, left: () => stage >= 2 && k.x > 136, right: () => false
    });
    window.__climb = []; s.events.on('postupdate', () => { if (window.__climb.length < 200) window.__climb.push([Math.round(k.x), Math.round(k.y), k.onGround ? 'G' : k.wall ? 'W' + k.wall : '', Math.round(k.vy), stage, k.airJumps].join(',')); }); window.__bot = () => stage >= 2 && k.onGround; window.__botOff = () => { s.ctl = real; };
  });
  await until(() => window.__bot(), null, 6000).catch(() => {}); await p.evaluate(() => window.__botOff()); await wait(0.4);
  const up = await p.evaluate(() => { const s = window.__game.scene, k = s.kid, t = s.dyn.pieces.find(q => q.id === 'tin'); return { feet: Math.round(k.y + k.h), x: Math.round(k.x), ground: k.onGround, tin: t.x + ',' + t.y }; });
  const onShelf = up.ground && (up.feet === 90 || up.feet === 82) && up.x < 146 && up.x > 96;
  ok('from the table she climbs to the high shelf, out of reach from the floor (' + JSON.stringify(up) + ')', onShelf);
  if (!onShelf) console.log('   the climb: ' + (await p.evaluate(() => window.__climb)).join(' | '));
  if (!onShelf) await put(106, 90, 1);
  // she walks into the tin from whichever side she is on and pushes it off the end
  const side = await p.evaluate(() => { const s = window.__game.scene, k = s.kid, t = s.dyn.pieces.find(q => q.id === 'tin'); if (k.x > t.x) { k.x = t.x + t.w + 1; return 'KeyA'; } k.x = t.x - k.w - 1; return 'KeyD'; });
  await p.evaluate(() => { const k = window.__game.scene.kid; k.y = 90 - 14; k.vx = 0; k.vy = 0; });
  await hold(side, 1.2); await wait(1.0);
  const tin = await piece('tin');
  ok('she pushes the tin off the shelf; it lands (on the floor or the table) and opens (' + JSON.stringify(tin) + ')', (tin.y + 8 === 160 || tin.y + 8 === 148) && tin.open);
  ok('the open tin says what was in it', await until(() => /tapes/.test(document.getElementById('cc').textContent), null, 4000).then(() => true, () => false));
  await shot('room-keeper-tin');
  // a run into the lamp knocks it over and it goes dark; K stands it up, lit again
  await put(292, 160, -1); await hold('KeyA', 0.6); await wait(0.3);
  const l1 = await piece('work lamp');
  ok('a run into the lamp knocks it over and it goes out (' + l1.pose + ', lit ' + l1.lit + ')', l1.pose === 'down' && !l1.lit && !await inside());
  await shot('room-keeper-lamp');
  await p.evaluate(() => { const s = window.__game.scene, q = s.dyn.pieces.find(q => q.id === 'work lamp'), k = s.kid; k.x = q.x + q.w + 1; k.face = -1; });
  await wait(0.1); await p.keyboard.press('KeyK'); await wait(0.4);
  const l2 = await piece('work lamp');
  ok('K stands the lamp back up, lit (' + l2.pose + ', lit ' + l2.lit + ')', l2.pose === 'up' && l2.lit && !await inside());
  // the staff room
  await room('staff');
  await put(130, 160, 1); await hold('KeyD', 0.8);
  const ch = await piece('chair');
  ok('staff room: a run into the chair knocks it over (' + ch.pose + ')', ch.pose === 'down' && !await inside());
  await shot('room-staff-chair');
  await put(254, 90, 1); await wait(0.2); await p.keyboard.press('KeyK'); await wait(1.2);
  const bx = await piece('box');
  ok('on the locker, K knocks the box off; it lands open (' + JSON.stringify(bx) + ')', bx.y + 8 === 160 && bx.open);
  await put(226, 160, 1); await wait(0.1); await p.keyboard.press('KeyK'); await wait(0.6);
  ok('K knocks the bin over and paper spills out', await p.evaluate(() => { const s = window.__game.scene; return s.dyn.pieces.find(q => q.id === 'bin').pose === 'down' && s.dyn.items.filter(i => i.kind === 'paper').length === 4; }));
  await shot('room-staff-bin');
  // the workshop: K the toolbox off the end of the beam
  await room('workshop');
  await put(222, 128, 1); await wait(0.2); await p.keyboard.press('KeyK'); await wait(1.2);
  const tb = await piece('toolbox');
  ok('workshop: K knocks the toolbox off the beam; it lands open (' + JSON.stringify(tb) + ')', tb.y + 7 === 160 && tb.open);
  await shot('room-workshop-toolbox');
  // the wardrobe: push the trunk, the hat box rides on it; then K the hat box off
  await room('wardrobe');
  const tr0 = await piece('trunk'), hb0 = await piece('hat box');
  await put(18, 160, 1); await hold('KeyD', 1.2);
  const tr1 = await piece('trunk'), hb1 = await piece('hat box');
  ok('wardrobe: pushing the trunk carries the hat box (' + (tr1.x - tr0.x) + ' px, box ' + (hb1.x - hb0.x) + ' px)', tr1.x - tr0.x > 6 && hb1.x - hb0.x >= tr1.x - tr0.x && hb1.y === hb0.y);
  await p.evaluate(() => { const s = window.__game.scene, q = s.dyn.pieces.find(q => q.id === 'trunk'), k = s.kid; k.x = q.x - 9; k.y = 160 - 14; k.face = 1; });
  await wait(0.1); await p.keyboard.press('KeyK'); await wait(1.0);
  const hb2 = await piece('hat box');
  ok('K knocks the hat box off the trunk; it lands open (' + JSON.stringify(hb2) + ')', hb2.y + 8 === 160 && hb2.open);
  await shot('room-wardrobe-hatbox');
  // a stretch of random keys in every room: she is never inside anything, nothing leaves the room
  for (const id of ['keeper', 'staff', 'workshop', 'wardrobe']) {
    await room(id);
    let bad = 0, frames = 0;
    await p.evaluate(() => { const s = window.__game.scene; s.__bad = 0; s.__n = 0; s.events.off('postupdate'); s.events.on('postupdate', () => { const k = s.kid; if (!k || s.leaving) return; s.__n++; if (s.boxHits(k.x, k.y, k.w, k.h)) s.__bad++; s.dyn.pieces.forEach(q => { if (q.x < 16 || q.x + q.w > 304 || q.y + q.h > 160 || !s.dyn.fitsAt(q, q.x, q.y, q.w, q.h, false)) s.__bad++; }); }); });
    const keys = ['KeyA', 'KeyD', 'Space', 'KeyK', 'KeyS'];
    let seed = id.length * 7;
    for (let i = 0; i < 40; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const key = keys[seed % keys.length], len = 0.05 + (seed % 7) * 0.06;
      if (key === 'KeyW') continue;
      await p.keyboard.down(key); await wait(len); await p.keyboard.up(key);
    }
    ({ bad, frames } = await p.evaluate(() => ({ bad: window.__game.scene.__bad, frames: window.__game.scene.__n })));
    ok(id + ': random keys for ' + frames + ' frames: never inside anything, every piece in the room and clear of walls (' + bad + ' bad)', bad === 0 && frames > 30);
    await shot('room-' + id + '-fuzz');
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
