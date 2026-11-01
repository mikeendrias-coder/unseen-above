// Episode 2 extras: the robot talks, the drawer gives up the glasses, the staff room, the
// chandelier that drops. Screenshots of each; checks game state at every step.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const shot = name => p.screenshot({ path: `tests/out/e2-${name}.png`, clip: { x: 40, y: 34, width: 1280, height: 720 } });
  const press = async key => { await p.keyboard.down(key); await p.waitForTimeout(120); await p.keyboard.up(key); };
  await p.addInitScript(() => { try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  await p.goto(BASE + '/local.html#gallery'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 0.8);
  // the robot
  await p.evaluate(() => { const s = window.__game.scene; s.robot.x = 120; s.kid.x = 106; s.kid.y = 146; s.kid.face = 1; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.robotThing);
  for (let i = 0; i < 4; i++) { await press('KeyE'); await p.waitForTimeout(i === 3 ? 1600 : 500); }
  await shot('robot'); ok('the robot talks: line ' + await p.evaluate(() => window.__game.scene.robot.line), await p.evaluate(() => window.__game.scene.robot.line === 4));
  // the drawer
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 14 * 16 + 4; s.kid.y = 146; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.cabinetThing);
  await press('KeyE');
  await until(() => window.__game.scene.drawer.fly > 0.3); await shot('drawer');
  await until(() => window.__game.scene.glasses); ok('the drawer gives up the glasses', true);
  await p.waitForTimeout(900); await shot('glasses-on');
  // the staff room and back
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 8 * 16 + 4; s.kid.y = 146; });
  await until(() => { const s = window.__game.scene; return s.nearThing && s.nearThing.label === 'E' && s.nearThing !== s.cabinetThing; });
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
  // the chandelier: stand under it and stay put
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 43 * 16 - 20; s.kid.y = 146; });
  await until(() => window.__game.scene.drop.phase === 'warn'); await shot('drop-warn');
  await until(() => window.__game.scene.drop.phase === 'fall'); await p.waitForTimeout(60); await shot('drop-fall');
  await until(() => window.__game.scene.drop.phase === 'down' || window.__game.scene.dead);
  await p.waitForTimeout(200); await shot('drop-down');
  ok('standing under it: dead = ' + await p.evaluate(() => window.__game.scene.dead), await p.evaluate(() => window.__game.scene.dead));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
