// The kids' room preview (a 320 x 180 pixel scene since Nov 17): the kids win their round, the
// feed from Earth plays, it runs to the end, Enter replays it, Esc leaves for the opening. Also
// checks the #links. The preview is ?scene=kids now; #kids plays it in the show's order (coreui.js).
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 100 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const active = () => p.evaluate(() => window.__unseen.game.scene.getScenes(true).map(s => s.sys.settings.key).join(','));
  await p.goto(BASE + '/local.html?scene=kids'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'kids');
  ok('kids starts on its own, nothing embedded: ' + await active(), (await active()) === 'kids');
  await until(() => window.__game.scene.t > 2, null, 30000);
  ok('their screen shows the game she plays: the globe show, the girl the target', await p.evaluate(() => window.__game.scene.show.visible));
  await until(() => window.__game.scene.solvedAt != null, null, 30000); ok('the kids finish the round', true);
  await until(() => window.__game.scene.feed.visible, null, 30000); ok('the screen cuts to the feed from Earth', true);
  await until(() => window.__game.scene.hitAt != null, null, 30000); ok('the satellite strikes the girl on the feed', true);
  await p.evaluate(() => { window.__game.scene.t = Math.max(window.__game.scene.t, 20); });
  await until(() => window.__game.scene.over, null, 30000);
  ok('plays to the end', true);
  await p.keyboard.press('Enter');
  await until(() => window.__game.scene.t < 2 && !window.__game.scene.over);
  ok('Enter replays: ' + await active(), true);
  await p.keyboard.press('Escape');
  await until(() => window.__game.scene.sys.settings.key === 'intro');
  await p.waitForTimeout(500);
  ok('Esc goes to the opening: ' + await active(), true);
  for (const [h, key] of [['gallery', 'gallery'], ['batch2', 'satellite'], ['grounds', 'grounds']]) {
    await p.goto('about:blank'); await p.goto(BASE + '/local.html#' + h); await p.click('#start');
    await until(k => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === k, key);
    ok('#' + h + ' opens ' + key + (key === 'satellite' ? ' batch ' + await p.evaluate(() => window.__game.scene.batch) : ''), true);
  }
  // jumping while playing: the links in the page change the hash
  for (const [h, key] of [['kids', 'kids'], ['gallery', 'gallery'], ['opening', 'intro'], ['batch2', 'satellite']]) {
    await p.evaluate(h => { location.hash = h; }, h);
    await until(k => window.__unseen.game.scene.getScenes(true).map(s => s.sys.settings.key).join(',') === k && window.__game.scene.sys.settings.key === k, key);
    ok('jump to #' + h + ' while playing: ' + await active(), true);
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
