// Episode 2 extras: the robot talks, the drawer gives up the glasses, the staff room, the light
// switch, the portrait's eyes, the chandelier that drops (it hurts: the house), the clues (the
// broken camera, the laser port, the drawer on a later take), the robot's row of bodies.
// Screenshots of each; checks game state at every step.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const shot = name => p.screenshot({ path: `tests/out/e2-${name}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  const press = async key => { await p.keyboard.down(key); await p.waitForTimeout(120); await p.keyboard.up(key); };
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  await p.goto(BASE + '/local.html#gallery'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 0.8);
  // the robot
  await p.evaluate(() => { const s = window.__game.scene; s.robot.x = 120; s.kid.x = 106; s.kid.y = 322; s.kid.face = 1; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.robotThing);
  // E shows a line; E while it types finishes it; E again moves to the next line
  for (let i = 0; i < 4; i++) { await press('KeyE'); await p.waitForTimeout(i === 3 ? 900 : 450); }
  await shot('robot'); ok('the robot talks, and E steps through its lines (' + await p.evaluate(() => window.__game.scene.robotSrc.i) + ' shown)', await p.evaluate(() => window.__game.scene.robotSrc.i >= 2 && window.__game.scene.bubbles.busy('robot')));
  // walking away closes the bubble
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 230; });
  await p.waitForTimeout(450);
  ok('walking away closes the robot\u2019s bubble', await p.evaluate(() => !window.__game.scene.bubbles.list.has('robot')));
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 106; });
  // the drawer
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 14 * 16 + 4; s.kid.y = 322; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.cabinetThing);
  await press('KeyE');
  await until(() => window.__game.scene.drawer.fly > 0.3); await shot('drawer');
  await until(() => window.__game.scene.glasses); ok('the drawer gives up the glasses', true);
  await p.waitForTimeout(900); await shot('glasses-on');
  // the staff room and back
  await p.evaluate(() => { const s = window.__game.scene; s.robot.x = 205; s.robot.dir = 1; s.kid.x = 8 * 16 + 4; s.kid.y = 322; });
  await until(() => { const s = window.__game.scene; return s.nearThing && s.nearThing.label === 'J' && s.nearThing !== s.cabinetThing; });
  await press('KeyE');
  await until(() => window.__game.scene.sys.settings.key === 'room' && window.__game.scene.clock > 0.5);
  ok('the staff door opens the staff room', true);
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 200; s.kid.y = 146; });
  await until(() => !!window.__game.scene.nearThing); await press('KeyE'); await p.waitForTimeout(1800); await shot('room');
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 290; s.kid.y = 146; });
  await until(() => !!window.__game.scene.nearThing); await press('KeyE'); await p.waitForTimeout(1500); await shot('room2');
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 22; s.kid.y = 146; });
  await until(() => !!window.__game.scene.nearThing); await press('KeyE');
  await until(() => window.__game.scene.sys.settings.key === 'gallery' && window.__unseen.game.scene.isActive('gallery'));
  ok('back in the gallery, glasses still on: ' + await p.evaluate(() => window.__game.scene.glasses), await p.evaluate(() => window.__game.scene.glasses));
  // the light switch: the gold goes dark, the red stays
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 11 * 16 + 4; s.kid.y = 322; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.switchThing); await press('KeyJ');
  await p.waitForTimeout(500); await shot('lights-off');
  ok('the light switch turns the hall dark', await p.evaluate(() => window.__game.scene.lightsOff && window.__game.scene.levelImg.texture.key === 'gl_dark'));
  await press('KeyJ'); await p.waitForTimeout(200);
  // the portrait's eyes follow her: red pixels on either side of the face
  const eyes = await p.evaluate(async () => { const s = window.__game.scene, at = () => { s.draw(); return s.eyeG.commandBuffer ? s.eyeG.commandBuffer.join(',') : ''; }; s.kid.x = 10; const a = at(); s.kid.x = 300; const b = at(); return a !== b; });
  ok('the man in gold\u2019s eyes move with her', eyes);
  // the broken camera looks at the Moon: a clue
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 66 * 16; s.kid.y = 208 - 14; s.cams.forEach(c => { c.range = 0; }); });
  await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.clue === 'cameraMoon'); await press('KeyJ'); await p.waitForTimeout(600); await shot('camera-moon');
  ok('the broken camera is a clue (cameraMoon)', await p.evaluate(() => window.__game.state.hasClue('cameraMoon')));
  // the chandelier: stand under it and stay put; it hurts her for 2 (the house), it does not kill
  await p.evaluate(() => { window.__noDeath = false; const s = window.__game.scene; s.kid.hp = 3; s.kid.inv = 0; s.kid.x = 69 * 16 + 8 - 14; s.kid.y = 208 - 14; });
  await until(() => window.__game.scene.drop.phase === 'warn'); await shot('drop-warn');
  await until(() => window.__game.scene.drop.phase === 'fall'); await p.waitForTimeout(60); await shot('drop-fall');
  await until(() => window.__game.scene.drop.phase === 'down');
  await p.waitForTimeout(200); await shot('drop-down');
  ok('standing under it: hp ' + await p.evaluate(() => window.__game.scene.kid.hp) + ', alive', await p.evaluate(() => window.__game.scene.kid.hp === 1 && !window.__game.scene.dead));
  // the laser port, after it fires: a clue (laserTone)
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene; s.kid.x = 77 * 16 - 4; s.kid.y = 336 - 14; s.laser.awake = true; const L = s.laserDef; window.__laserT = L.first + L.tell + L.charge + 0.1; });
  await until(() => window.__game.scene.laser.fired); await p.evaluate(() => { window.__laserT = null; });
  await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.clue === 'laserTone'); await press('KeyJ'); await p.waitForTimeout(400);
  ok('the laser port is a clue once it has fired (laserTone)', await p.evaluate(() => window.__game.state.hasClue('laserTone')));
  // a later take: the robot has laid her old bodies in a row on the atrium floor; the drawer is a clue
  await p.evaluate(() => { const st = window.__game.state, e = st.episode('ep2'); e.bodies = [{ x: 700, y: 336, take: 1, cause: 'stair camera' }, { x: 990, y: 208, take: 2, cause: 'laser' }, { x: 1300, y: 336, take: 3, cause: 'laser' }]; e.take = 4; window.__noDeath = false; window.__game.scene.scene.restart({}); });
  await until(() => window.__game.scene.clock > 0.5 && window.__game.scene.ep.take === 4);
  const row = await p.evaluate(() => window.__game.scene.bodyLayer.list.map(i => Math.round(i.x) + ':' + Math.round(i.y)).join(' '));
  ok('the old bodies lie in a row on the atrium floor, the newest where she fell: ' + row, /^852:336 834:336 1300:336$/.test(row));
  await shot('tidy');
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 14 * 16 + 4; s.kid.y = 322; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.cabinetThing); await press('KeyJ');
  await until(() => window.__game.state.hasClue('drawer'));
  ok('on a later take the glasses are back in the drawer (clue drawer)', true);
  // the tape marks: with the glasses on, she stands on the second mark; a death starts her there,
  // glasses still on, and the mark she reached shows lit (Nov 18 checkpoints)
  await until(() => window.__game.scene.glasses);
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene, m = s.tape.list[1], k = s.kid; k.x = m.x; k.y = m.y - 14; k.vx = 0; k.vy = 0; });
  await until(() => window.__game.scene.tape.active === 1);
  const take = await p.evaluate(() => window.__game.scene.ep.take);
  await p.evaluate(() => { window.__noDeath = false; window.__game.scene.die({ id: 'test', direct: true }); });
  await until(t => { const s = window.__game.scene; return s.ep.take > t && !s.dead && s.clock > 0.3; }, take);
  const back = await p.evaluate(() => { const s = window.__game.scene, m = s.tape.list[1]; return { at: Math.round(s.kid.x) === m.x && Math.round(s.kid.y + s.kid.h) === m.y, glasses: s.glasses && s.gl.on, active: s.tape.active }; });
  ok('a death goes back to the last tape mark, glasses on ' + JSON.stringify(back), back.at && back.glasses && back.active === 1);
  await shot('tape');
  // gold: touching a piece picks it up and counts it in the story
  await p.evaluate(() => { window.__noDeath = true; const s = window.__game.scene, m = s.gold.list[5], k = s.kid; k.x = m.x - 4; k.y = m.y - 14; k.vx = 0; k.vy = 0; });
  await until(() => window.__game.scene.gold.count > 0);
  ok('a gold piece is picked up and counted (' + JSON.stringify(await p.evaluate(() => window.__game.state.story.gold)) + ' of ' + JSON.stringify(await p.evaluate(() => window.__game.state.story.goldPlaced)) + ')', await p.evaluate(() => window.__game.state.story.gold.ep2 >= 1 && window.__game.state.story.goldPlaced.ep2 === window.__game.scene.gold.list.length));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
