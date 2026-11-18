// Flow checks: the opening hands off to episode 1, a death leaves a body and a new take, looks
// that hold clues (the mailbox, her footprints, the statue), the door ends the episode, satellite batch 1 leads to episode 2 (glasses, a laser death, a camera
// death, the door), then batch 2 (the sorting shift), then episode 3 begins. Also loads every look.
// Every step waits on game state, not on wall-clock time, so slow headless frames do not matter.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 100 });
  const scene = key => until(k => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === k && window.__game.scene.sys.isActive() && (k === 'satellite' || window.__game.scene.kid), key);
  const card = () => p.evaluate(() => document.querySelector('.card-top').textContent + ' / ' + document.querySelector('.card-title').textContent);
  const cardOn = top => until(t => document.querySelector('#card').classList.contains('on') && document.querySelector('.card-top').textContent === t, top);
  const fresh = () => until(() => { const s = window.__game.scene; return s.kid && !s.dead && s.clock > 0.3; });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html');
  await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.T);
  // skip ahead to the end of the opening
  await p.evaluate(() => { const s = window.__game.scene; s.t = s.T.end - 0.05; });
  await scene('grounds');
  await cardOn('EPISODE 1'); ok('the opening hands off to ' + await card(), true);
  // death: stand on a hedge top with the garden lamp held on her
  await fresh();
  await p.evaluate(() => { const s = window.__game.scene, L = s.lights[0]; s.kid.x = 25 * 16 + 4; s.kid.y = 22 * 16 - 14; s.kid.vy = 0; const a = Math.atan2(s.kid.y + 7 - L.y, s.kid.x + 4 - L.x) * 180 / Math.PI; L.a0 = L.a1 = a; });
  await until(() => window.__game.scene.ep.take === 2);
  await until(() => window.__game.scene.bodyLayer && window.__game.scene.bodyLayer.list.length === 1 && !window.__game.scene.dead);
  ok('a lamp death leaves a body, take 2 (' + await p.evaluate(() => window.__game.scene.ep.bodies[0].cause) + ')', true);
  // things to look at: the mailbox (a clue, NOTED), the footprints (hers now too), the statue
  await fresh();
  const lookAt = async (x, feet) => { await p.evaluate(([x, feet]) => { const s = window.__game.scene; window.__noDeath = true; s.kid.x = x; s.kid.y = feet - 14; s.kid.vy = 0; }, [x, feet]); await until(() => !!window.__game.scene.nearThing); await p.keyboard.press('KeyJ'); await p.waitForTimeout(300); };
  await lookAt(10 * 16 + 2, 400);
  ok('the mailbox holds the unsigned request (clue request1: ' + await p.evaluate(() => window.__game.state.hasClue('request1')) + ')', await p.evaluate(() => window.__game.state.hasClue('request1')));
  await lookAt(5 * 16, 400);
  ok('on take 2 the footprints are hers too (clue footprints)', await p.evaluate(() => window.__game.state.hasClue('footprints')));
  await lookAt(52 * 16 + 2, 15 * 16);
  ok('the statue says 07 (clue statue07)', await p.evaluate(() => window.__game.state.hasClue('statue07')));
  // the door, at the top of the house
  await p.evaluate(() => { const s = window.__game.scene; window.__noDeath = true; s.scan = null; s.kid.x = 96 * 16 + 4; s.kid.y = 80 - 14; s.kid.vy = 0; });
  await p.keyboard.down('ArrowUp'); await until(() => window.__game.scene.leaving); await p.keyboard.up('ArrowUp');
  await cardOn('END OF EPISODE 1'); ok('episode 1 door: ' + await card(), true);
  await scene('satellite');
  ok('then satellite batch ' + await p.evaluate(() => window.__game.scene.batch + ', screen ' + window.__game.scene.skinN), await p.evaluate(() => window.__game.scene.batch === 1));
  const solveBatch = async () => { for (let i = 0; i < 3; i++) { await until(() => !window.__game.scene.solved); await p.evaluate(() => window.__game.scene.win()); await until(i => window.__game.scene.levelIdx > i || window.__game.scene.ended, i); } };
  await solveBatch();
  await cardOn('END OF BATCH 1'); ok('end of batch 1: ' + await card(), true);
  // episode 2
  await scene('gallery');
  await cardOn('EPISODE 2'); ok('episode 2 opens with ' + await card(), true);
  await fresh();
  await p.evaluate(() => { window.__noDeath = false; const s = window.__game.scene; s.kid.x = 14 * 16 + 4; s.kid.y = 336 - 14; s.kid.vy = 0; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.cabinetThing);
  await p.keyboard.down('KeyE'); await p.waitForTimeout(150); await p.keyboard.up('KeyE');
  await until(() => window.__game.scene.glasses); ok('the drawer gives up the glasses', true);
  // a laser death: stand in the hall during a low shot
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 80 * 16; s.kid.y = 336 - 14; s.kid.vy = 0; s.laser.awake = true; const L = s.laserDef || { first: 1.2, tell: 0.7, charge: 0.5 }; window.__laserT = L.first + L.tell + L.charge + 0.1; });
  await until(() => window.__game.scene.ep.take === 2);
  await p.evaluate(() => { window.__laserT = null; });
  await until(() => window.__game.scene.bodyLayer && window.__game.scene.bodyLayer.list.length === 1 && !window.__game.scene.dead);
  const laser = await p.evaluate(() => { const s = window.__game.scene; return { cause: s.ep.bodies[0].cause, glasses: s.glasses, awake: s.laser.awake }; });
  ok('a laser death leaves a body (' + laser.cause + '); the new take starts without glasses and with the laser asleep', laser.cause === 'laser' && !laser.glasses && !laser.awake);
  // a camera death: hold the stair camera still, looking down on the landing, and stand there
  await fresh();
  await p.evaluate(() => { const s = window.__game.scene; s.cams[0].a0 = s.cams[0].a1 = 90; s.kid.x = 26 * 16 + 4; s.kid.y = 18 * 16 - 14; s.kid.vy = 0; });
  await until(() => window.__game.scene.ep.take === 3);
  await until(() => window.__game.scene.bodyLayer && window.__game.scene.bodyLayer.list.length === 2 && !window.__game.scene.dead);
  ok('a camera death leaves a body (' + await p.evaluate(() => window.__game.scene.ep.bodies[1].cause) + '), take 3', true);
  // the door
  await fresh();
  await p.evaluate(() => { const s = window.__game.scene; window.__noDeath = true; s.kid.x = 87 * 16 + 6; s.kid.y = 336 - 14; s.kid.vy = 0; });
  await p.keyboard.down('ArrowUp'); await until(() => window.__game.scene.leaving); await p.keyboard.up('ArrowUp');
  await cardOn('END OF EPISODE 2'); ok('episode 2 door: ' + await card(), true);
  await scene('satellite');
  const sat2 = await p.evaluate(() => { const s = window.__game.scene; return { batch: s.batch, skin: s.skinN, ids: s.ids.join(' ') }; });
  ok('then satellite batch ' + sat2.batch + ' on screen ' + sat2.skin + ' (' + sat2.ids + ')', sat2.batch === 2 && sat2.skin === 2);
  await p.screenshot({ path: 'tests/out/flow-batch2.png' });
  await solveBatch();
  await cardOn('END OF BATCH 2'); ok('end of batch 2: ' + await card(), true);
  await scene('fall'); await cardOn('EPISODE 3'); ok('then episode 3 opens with ' + await card() + ' (tests/flow-ep3.js covers the rest)', true);
  // one locked look: L changes nothing
  await p.goto(BASE + '/local.html?scene=grounds'); await p.click('#start');
  await scene('grounds'); await fresh();
  const before = await p.evaluate(() => window.__game.scene.P.name); await p.keyboard.press('KeyL'); await p.waitForTimeout(600);
  const after = await p.evaluate(() => window.__game.scene.P.name);
  ok('one look (' + before + '); L leaves it as is', before === 'Ash and Gold' && after === before);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
