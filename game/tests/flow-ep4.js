// Episode 4 flow: a flash catches her in the open and the strike comes; running on the creaky
// boards turns a camera; the clock covers noise, and so does the music box; the bag brings the
// floor down and the floor takes her; held longer, the bag gives up his note; the run (two gaps,
// the slab) and the climb between two walls; the bedroom: him, the lines; holding on to him is
// the false ending (CH 07, we'll be right back) and the scene runs again; the door; batch 4.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const put = x => p.evaluate(x => { const s = window.__game.scene, k = s.kid; k.x = x; k.y = 160 - 14; k.h = 14; k.crouch = false; k.vx = 0; k.vy = 0; }, x);
  const fresh = take => until(t => { const s = window.__game.scene; return s && s.sys.settings.key === 'bedroom' && s.ep.take === t && !s.dead && s.clock > 0.4; }, take);
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#bedroom'); await p.click('#start');
  await fresh(1);
  ok('episode 4 opens in the dark (a dark layer over the house)', await p.evaluate(() => !!window.__game.scene.darkImg && window.__game.scene.mode === 'house'));

  // standing in the open under the landing camera: the flash catches her, the satellite fires
  await put(152);
  await until(() => window.__game.scene.cams[0].caught, null, 8000);
  ok('a flash catches her in the open: caught, then the strike', true);
  await fresh(2);
  ok('a body stays where she stood, take 2 (' + await p.evaluate(() => window.__game.scene.ep.bodies.map(b => b.cause).join()) + ')', await p.evaluate(() => window.__game.scene.ep.bodies.length === 1 && window.__game.scene.ep.bodies[0].cause === 'landing camera'));

  // under the piano the same flash sees nothing
  await put(112);
  const t0 = await p.evaluate(() => window.__game.scene.cams[0].next);
  await until(t => window.__game.scene.clock > t + 0.1, t0, 8000);
  ok('under the piano the flash misses her', await p.evaluate(() => !window.__game.scene.cams[0].caught && !window.__game.scene.dead));

  // running on the creaky boards: the nearest cameras turn to the noise (unless the clock strikes)
  await p.evaluate(() => { window.__noDeath = true; });
  await until(() => !window.__game.scene.masked(), null, 8000);
  await put(296); await p.keyboard.down('ArrowRight');
  await until(() => window.__game.scene.cams.some(c => c.snap), null, 4000); await p.keyboard.up('ArrowRight');
  ok('running on old boards turns a camera toward the noise', true);
  await until(() => window.__game.scene.masked() && window.__game.scene.cams.every(c => !c.snap), null, 15000);
  await p.evaluate(() => window.__game.scene.noiseAt(310, 160));
  ok('while the clock strikes, the same noise turns nothing', await p.evaluate(() => window.__game.scene.cams.every(c => !c.snap)));

  // the music box: J winds it, and for a few seconds no noise turns a camera
  await until(() => !window.__game.scene.masked(), null, 8000);
  await put(282); await until(() => window.__game.scene.nearThing === window.__game.scene.boxThing, null, 4000);
  await p.keyboard.press('KeyJ'); await p.waitForTimeout(100);
  await p.evaluate(() => window.__game.scene.noiseAt(320, 160));
  ok('the music box plays and covers a noise', await p.evaluate(() => window.__game.scene.box.t > 0 && window.__game.scene.cams.every(c => !c.snap)));

  // the bag: hold E under the stairs; the floor starts to go
  await put(59 * 16 - 4); await until(() => window.__game.scene.nearThing === window.__game.scene.bagThing, null, 4000);
  await p.keyboard.down('KeyE'); await until(() => window.__game.scene.bag.have, null, 6000); await p.keyboard.up('KeyE');
  await until(() => !!window.__game.scene.collapse, null, 4000);
  ok('pulling the bag free brings the floor down behind her', true);
  await p.evaluate(() => { window.__noDeath = false; });
  await until(() => window.__game.scene.dead, null, 15000);
  await fresh(3);
  ok('standing still, the floor takes her (' + await p.evaluate(() => window.__game.scene.ep.bodies.map(b => b.cause).join()) + ')', await p.evaluate(() => window.__game.scene.ep.bodies.some(b => b.cause === 'the fall')));
  ok('the new take starts whole: no bag, the stairs back, the floor back', await p.evaluate(() => { const s = window.__game.scene; return !s.bag.have && !s.collapse && s.props.includes(s.wallProp) && s.map.m[10][60] === 1; }));

  // the run, played: from the bag to the doors, with the keyboard. This time she keeps holding
  // J after the bag comes free: his note
  await p.evaluate(() => { window.__noDeath = true; });
  await put(59 * 16 - 4); await until(() => window.__game.scene.nearThing === window.__game.scene.bagThing, null, 4000);
  await p.keyboard.down('KeyJ'); await until(() => window.__game.scene.bag.read, null, 8000); await p.keyboard.up('KeyJ');
  ok('the full pull finds his note (clue ' + await p.evaluate(() => window.__game.state.hasClue('bagNote')) + ')', await p.evaluate(() => window.__game.state.hasClue('bagNote') && !window.__game.scene.collapse));
  ok('his line is on screen before the floor goes', await p.evaluate(() => { const b = window.__game.scene.bubbles.list.get('item'); return !!b && b.lines.join(' ').includes("Don't let her follow."); }));
  await p.waitForTimeout(1600);
  ok('the floor has not cut the line off yet', await p.evaluate(() => !window.__game.scene.collapse && window.__game.scene.bubbles.busy('item')));
  await until(() => !!window.__game.scene.collapse, null, 9000);
  await p.evaluate(() => { window.__noDeath = false; });
  // a small autopilot: run right, jump the rubble and the gaps, crouch under the slab
  await p.evaluate(() => {
    const s = window.__game.scene, c = s.ctl, held = new Set();
    const set = (k, v) => { if (v) held.add(k); else held.delete(k); };
    s.__orig = { right: c.right, down: c.down, jumpHeld: c.jumpHeld, jumpPressed: c.jumpPressed };
    c.right = () => held.has('r'); c.down = () => held.has('d'); c.jumpHeld = () => held.has('j');
    const jp = c.jumpPressed; let jumpNow = false; c.jumpPressed = () => { const j = jumpNow; jumpNow = false; return j || jp(); };
    s.events.on('update', s.__auto = () => {
      const k = s.kid, x = k.x + k.w;
      set('r', true);
      const near = (a, b) => x > a && x < b;
      const jumpAt = [[958, 970], [1046, 1057], [1190, 1201]];
      if (k.onGround && jumpAt.some(([a, b]) => near(a, b))) { jumpNow = true; set('j', true); s.__dj = near(1190, 1201); }
      else if (s.__dj && !k.onGround && k.vy > -40) { jumpNow = true; s.__dj = false; }
      else if (k.vy > 0 && !s.__dj) set('j', false);
      set('d', x > 1120 && x < 1172);
    });
  });
  await until(() => { const s = window.__game.scene; return s.dead || (s.kid.x > 79 * 16 + 2 && s.kid.onGround); }, null, 20000);
  const ran = await p.evaluate(() => { const s = window.__game.scene; return { dead: s.dead, x: Math.round(s.kid.x), front: Math.round(s.collapse.x), slab: s.run.slab.state, cause: s.ep.bodies.length ? s.ep.bodies[s.ep.bodies.length - 1].cause : '' }; });
  ok('the run can be made: she reaches the climb ahead of the floor (x ' + ran.x + ', floor ' + ran.front + (ran.dead ? ', died: ' + ran.cause : '') + ')', !ran.dead);
  // the climb: jump from wall to wall between the hanging ceiling and the heap
  await p.evaluate(() => {
    window.__noDeath = true;
    const s = window.__game.scene, c = s.ctl, k = s.kid; k.x = 1302; k.y = 146; k.vx = 0; k.vy = 0; s.__orig.left = c.left;
    s.events.off('update', s.__auto);
    let dir = 1, jumpNow = false; const jp = s.__orig.jumpPressed;
    c.right = () => dir > 0; c.left = () => dir < 0; c.down = () => false; c.jumpHeld = () => true; c.jumpPressed = () => { const j = jumpNow; jumpNow = false; return j || jp(); };
    s.events.on('update', s.__auto = () => {
      if (k.onGround && k.y + k.h <= 81) { dir = 0; return; }
      if (k.onGround) { jumpNow = true; dir = 1; } else if (k.wall === 1) { jumpNow = true; dir = -1; } else if (k.wall === -1) { jumpNow = true; dir = 1; }
    });
  });
  await until(() => { const k = window.__game.scene.kid; return k.onGround && k.y + k.h <= 81; }, null, 8000).catch(() => {});
  ok('wall to wall, she climbs onto the heap (feet at y ' + await p.evaluate(() => Math.round(window.__game.scene.kid.y + window.__game.scene.kid.h)) + ')', await p.evaluate(() => { const k = window.__game.scene.kid; return k.onGround && k.y + k.h <= 81; }));
  await p.evaluate(() => { const s = window.__game.scene; s.events.off('update', s.__auto); Object.assign(s.ctl, s.__orig); });

  // the bedroom
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene; s.kid.x = 85 * 16 + 8; s.kid.y = 146; s.kid.vx = 0; });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(150); await p.keyboard.up('ArrowUp');
  await until(() => window.__game.scene.mode === 'bedroom', null, 8000);
  ok('Up at the doors: the bedroom', true);
  await p.reload(); // a fresh page keeps the autopilot out of the bedroom
  await p.goto(BASE + '/local.html#bedroom'); await p.click('#start').catch(() => {});
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 0.4);
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene; s.bag.have = true; s.kid.x = 85 * 16 + 8; s.kid.y = 146; s.enterDoor(); });
  await until(() => window.__game.scene.mode === 'bedroom', null, 8000);
  await p.waitForTimeout(800);
  await p.keyboard.down('ArrowRight'); await until(() => window.__game.scene.mode === 'talk', null, 10000); await p.keyboard.up('ArrowRight');
  ok('she reaches him and they talk', await p.evaluate(() => document.getElementById('cc').textContent.length > 0));
  for (let i = 0; i < 20 && await p.evaluate(() => window.__game.scene.mode === 'talk'); i++) { await p.keyboard.press('Space'); await p.waitForTimeout(120); }
  await until(() => window.__game.scene.mode === 'after', null, 15000);
  ok('after the last line he is gone (' + await p.evaluate(() => window.__game.scene.bro.texture.key) + ')', await p.evaluate(() => window.__game.scene.bro.texture.key === 'bro_dead'));
  // the false ending: she holds on to him (J) instead of going to the door
  await until(() => window.__game.scene.nearThing === window.__game.scene.broThing, null, 4000);
  await p.keyboard.down('KeyJ'); await p.waitForTimeout(600); await p.evaluate(() => { window.__game.scene.stay = 14; });
  await until(() => window.__game.scene.mode === 'break', null, 8000); await p.keyboard.up('KeyJ');
  await until(() => /RIGHT BACK/.test(document.querySelector('#card').textContent), null, 4000);
  ok('holding on to him: CH 07. WE\'LL BE RIGHT BACK. (ending seen: ' + await p.evaluate(() => !!window.__game.state.story.endings.rightBack) + ')', await p.evaluate(() => !!window.__game.state.story.endings.rightBack));
  await until(() => window.__game.scene.rerun && window.__game.scene.mode === 'after', null, 20000);
  ok('back from the break: the bedroom again from the kneel, no lines, and he is gone', await p.evaluate(() => window.__game.scene.bro.texture.key === 'bro_dead'));
  await p.keyboard.down('ArrowRight'); await until(() => window.__game.scene.nearThing === window.__game.scene.voidThing, null, 10000); await p.keyboard.up('ArrowRight');
  await p.keyboard.press('KeyE');
  await until(() => window.__game.scene.mode === 'void', null, 4000);
  ok('E opens the door at the end', true);
  await until(() => document.querySelector('#card').classList.contains('on') && /EPISODE 4/.test(document.querySelector('#card').textContent), null, 15000);
  ok('END OF EPISODE 4', true);
  await until(() => window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.batch === 4, null, 20000);
  ok('then satellite batch 4', true);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
