// Every kind of text over the picture, for a look at them together: captions, speech over
// heads, a key prompt, the how-to-play pages, the episode lower third, the take, an end card,
// the TV's own messages, review mode. node tests/shoot-text.js
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const shot = n => p.screenshot({ path: `tests/out/text-${n}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  const press = async key => { await p.keyboard.down(key); await p.waitForTimeout(110); await p.keyboard.up(key); };
  await p.addInitScript(() => { try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  await p.goto(BASE + '/local.html'); await p.waitForTimeout(700);
  await p.screenshot({ path: 'tests/out/text-start.png' });
  await p.goto(BASE + '/local.html#gallery'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 0.8);
  // the episode lower third and the bug
  await p.evaluate(() => { const o = window.__unseen.overlay; o.card('EPISODE 2', 'The Gallery', 3600, 'lower'); o.bug('CH 07', 3600); });
  await p.waitForTimeout(900); await shot('lower');
  // the robot talking, then a prompt
  await p.evaluate(() => { const s = window.__game.scene; s.robot.x = 120; s.kid.x = 106; s.kid.y = 146; s.kid.face = 1; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.robotThing);
  await shot('prompt');
  for (let i = 0; i < 3; i++) { await press('KeyE'); await p.waitForTimeout(i === 2 ? 1400 : 400); }
  await shot('robot');
  // the TV's own message and a sound caption
  await p.evaluate(() => { const o = window.__unseen.overlay; o.note('Sound off', 3000); o.sfx('[A DOOR UNLOCKS]', 3000); });
  await p.waitForTimeout(300); await shot('osd');
  // the how-to-play pages
  for (const kind of ['glasses', 'cracked', 'pebbles', 'dark']) {
    await p.evaluate(k => window.__unseen.itemPanel(window.__game.scene, k, true), kind);
    await p.waitForTimeout(150); await shot('page-search-' + kind);
    await p.waitForTimeout(900); await shot('page-' + kind);
    await p.keyboard.press('Space'); await p.waitForTimeout(400);
    await p.evaluate(() => { const g = window.__unseen.game; if (g.scene.isPaused('gallery')) g.scene.resume('gallery'); });
  }
  // a caption with a speaker, two lines
  await p.evaluate(() => window.__unseen.overlay.caption('BROTHER', 'Places like that have food. Medicine. Maybe a filter that still works.'));
  await p.waitForTimeout(200); await shot('caption');
  await p.evaluate(() => window.__unseen.overlay.clearCaption());
  // the take after a restart, and review mode
  await p.keyboard.press('KeyR'); await p.waitForTimeout(1200); await shot('take');
  await p.keyboard.press('KeyI'); await p.waitForTimeout(300); await shot('immune'); await p.keyboard.press('KeyI');
  // an end card over black
  await p.evaluate(() => { document.getElementById('blackout').classList.add('on'); window.__unseen.overlay.card('END OF EPISODE 2', 'Take 3', 3400); });
  await p.waitForTimeout(800); await shot('end');
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
