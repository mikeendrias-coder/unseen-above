// Review tools: I turns immunity on (the tag shows, nothing kills her), N skips ahead through a
// stage, and on a satellite screen N solves the puzzle.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#bedroom'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 0.6);
  await p.keyboard.press('KeyI');
  await until(() => window.__game.state.immune, null, 3000);
  ok('I turns immunity on, and the tag shows', await p.evaluate(() => document.getElementById('immune').classList.contains('on') && window.__noDeath === true));
  // standing in the open under the landing camera: the flash comes, nothing happens
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 152; s.kid.y = 146; });
  const t0 = await p.evaluate(() => window.__game.scene.cams[0].next);
  await until(t => window.__game.scene.clock > t + 0.8, t0, 8000);
  ok('immune: a flash in the open does not catch her', await p.evaluate(() => !window.__game.scene.dead && !window.__game.scene.cams[0].caught));
  const xs = [];
  for (let i = 0; i < 5; i++) { await p.keyboard.press('KeyN'); await p.waitForTimeout(250); xs.push(await p.evaluate(() => Math.round(window.__game.scene.kid.x))); }
  ok('N skips ahead section by section: ' + xs.join(', '), xs.every((x, i) => i === 0 || x >= xs[i - 1]) && xs[xs.length - 1] > 800);
  await until(() => window.__game.scene.bag.have, null, 5000);
  ok('at the stairs, N pulls the bag', true);
  await p.waitForTimeout(1500); await p.keyboard.press('KeyN'); await p.waitForTimeout(300);
  ok('after the bag, N goes to the doors', await p.evaluate(() => window.__game.scene.kid.x > 84 * 16));
  // satellite: N solves the screen
  await p.goto(BASE + '/local.html#batch1'); await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite');
  await p.waitForTimeout(600);
  const lv = await p.evaluate(() => window.__game.scene.levelIdx);
  await p.keyboard.press('KeyN');
  await until(i => window.__game.scene.levelIdx > i || window.__game.scene.solved, lv, 8000);
  ok('on a satellite screen, N solves the puzzle', true);
  await p.keyboard.press('KeyI');
  await until(() => !document.getElementById('immune').classList.contains('on'), null, 3000);
  ok('I again turns it off', await p.evaluate(() => !document.getElementById('immune').classList.contains('on') && window.__noDeath === false));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
