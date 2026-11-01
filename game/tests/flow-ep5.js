// The end of the game: batch 4 hands on to the kids' room, the kids' room to the Moon. On the
// Moon she walks the corridor, enters the playroom, the lines play, two clicks, the last shot,
// and no end card.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const key = () => p.evaluate(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key);
  const solveBatch = async () => { for (let i = 0; i < 3; i++) { await until(() => !window.__game.scene.solved); await p.evaluate(() => window.__game.scene.win()); await until(i => window.__game.scene.levelIdx > i || window.__game.scene.ended, i); } };
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#batch4'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.batch === 4);
  await solveBatch();
  await until(() => /END OF BATCH 4/.test(document.querySelector('#card').textContent), null, 30000);
  await until(() => { const g = window.__unseen && window.__unseen.game; return g && g.scene.isActive('kids'); }, null, 30000);
  ok('batch 4 hands on to the kids’ room', true);
  ok('in the game’s order the kids’ room has no preview note', await p.evaluate(() => document.getElementById('h-hint').textContent === ''));
  await until(() => { const g = window.__unseen.game; return g.scene.isActive('moon'); }, null, 60000);
  await until(() => /EPISODE 5/.test(document.querySelector('#card').textContent), null, 10000);
  ok('then the Moon: ' + await p.evaluate(() => document.querySelector('#card').textContent.replace(/\s+/g, ' ').trim()), true);
  // walk the corridor, hopping the robot if it is in the way
  await until(() => window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.clock > 1);
  await p.keyboard.down('ArrowRight');
  for (let i = 0; i < 80 && await p.evaluate(() => window.__game.scene.kid.x < 80 * 16); i++) { await p.waitForTimeout(400); if (await p.evaluate(() => Math.abs(window.__game.scene.kid.vx) < 5)) await p.keyboard.press('Space'); }
  await p.keyboard.up('ArrowRight');
  ok('she walks the length of the corridor (overheard ' + await p.evaluate(() => window.__game.scene.heard.size) + ' rooms)', await p.evaluate(() => window.__game.scene.heard.size === 3));
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 80 * 16 + 10; s.kid.vx = 0; });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(150); await p.keyboard.up('ArrowUp');
  await until(() => window.__game.scene.mode === 'room', null, 8000);
  ok('Up at the pink door: the playroom', true);
  await p.keyboard.down('ArrowRight'); await until(() => window.__game.scene.mode === 'talk', null, 10000); await p.keyboard.up('ArrowRight');
  const look = await p.evaluate(() => window.__game.scene.lines.find(l => /We do/.test(l.text)).text);
  ok('the kids talk to her; the little one names her look: "' + look + '"', /the gold one/.test(look));
  for (let i = 0; i < 20 && await p.evaluate(() => window.__game.scene.mode === 'talk'); i++) { await p.keyboard.press('Space'); await p.waitForTimeout(150); }
  await until(() => window.__game.scene.mode === 'last', null, 15000);
  ok('two clicks, the flash, then the last shot', true);
  await until(() => window.__game.scene.lastT > 7, null, 20000);
  ok('it ends on the Moon, with no end card', await p.evaluate(() => !document.querySelector('#card').classList.contains('on') && window.__game.scene.tvImg.visible));
  ok('the Moon episode is marked finished', await p.evaluate(() => window.__game.state.episode('ep5').done));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
