// Each screen's win, the sorting shift, and the batch 3 reveal: node tests/shoot-wins.js
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const open = async (q, bodies) => {
    const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(bd => { try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', seenIntro: true, episodes: bd || {} })); } catch (e) {} }, bodies);
    await p.goto(BASE + '/local.html' + q); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.clock > 1.2, null, { timeout: 60000 });
    return p;
  };
  const shot = (p, n) => p.screenshot({ path: `tests/out/w-${n}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  for (const [skin, at] of [[1, 1.1], [2, 1.2], [3, 0.7], [4, 0.9]]) {
    const p = await open('?scene=satellite&batch=1&skin=' + skin);
    await p.evaluate(() => window.__game.scene.win());
    await p.waitForFunction(at => window.__game.scene.winFx.on && window.__game.scene.winFx.on.t > at, at, { timeout: 30000 });
    await shot(p, 'skin' + skin); await p.close();
  }
  // the sorting shift: let pings arrive, sort a few correctly, then a wrong one
  const p = await open('#batch2');
  await p.waitForFunction(() => window.__game.scene.sorter.queue.length >= 3, null, { timeout: 30000 });
  for (let i = 0; i < 3; i++) {
    await p.waitForFunction(() => { const s = window.__game.scene.sorter; return s.queue[0] && s.queue[0].y >= 115.5; }, null, { timeout: 20000 });
    const dir = await p.evaluate(() => { const s = window.__game.scene.sorter; return s.binFor(s.queue[0].shape); });
    await p.keyboard.press(dir === 'left' ? 'ArrowLeft' : dir === 'right' ? 'ArrowRight' : 'ArrowDown'); await p.waitForTimeout(80);
  }
  await p.waitForTimeout(250); await shot(p, 'sort');
  console.log('sorted', await p.evaluate(() => window.__game.scene.sorter.sorted), 'errors', await p.evaluate(() => window.__game.scene.sorter.errors));
  await p.evaluate(() => window.__game.scene.win()); await p.waitForTimeout(900); await shot(p, 'sort-win'); await p.close();
  // batch 3 reveal with some deaths on record
  const bodies = { ep1: { take: 4, bodies: [{ x: 560, y: 160, take: 1 }, { x: 980, y: 160, take: 2 }, { x: 1500, y: 112, take: 3 }], done: true }, ep2: { take: 3, bodies: [{ x: 556, y: 160, take: 1 }, { x: 1150, y: 160, take: 2 }], done: true } };
  const r = await open('#batch3', bodies);
  for (let i = 0; i < 3; i++) { await r.waitForFunction(() => !window.__game.scene.solved, null, { timeout: 30000 }); await r.evaluate(() => window.__game.scene.win()); await r.waitForFunction(i => window.__game.scene.levelIdx > i || window.__game.scene.ended, i, { timeout: 30000 }); }
  await r.waitForFunction(() => window.__game.scene.reveal && window.__game.scene.reveal.t > 2.2, null, { timeout: 30000 });
  await shot(r, 'reveal'); await r.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 6).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
