// A look at the new details in play: episode 1 with her shadow and the crowbar bubble, the dark
// panel in episode 4, the meter and static in the dark, the east wing with pebbles on the floor.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const open = async (part, panels) => {
    const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(part + ': ' + e.message));
    await p.addInitScript(np => { if (np) window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} }, !panels);
    await p.goto(BASE + '/local.html#' + part); await p.click('#start');
    await p.waitForFunction(([k, panels]) => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === k && window.__game.scene.clock > (panels ? 0.2 : 1), [{ grounds: 'grounds', bedroom: 'bedroom', eastwing: 'eastwing' }[part], !!panels], { timeout: 60000 });
    return p;
  };
  const shot = (p, n) => p.screenshot({ path: `tests/out/audit-${n}.png`, clip: { x: 40, y: 34, width: 1280, height: 720 } });
  const g = await open('grounds');
  await g.evaluate(() => { window.__noDeath = true; const s = window.__game.scene; s.kid.x = 17 * 16 + 6; s.kid.y = 120; s.kid.vy = 200; });
  await g.waitForTimeout(250); await shot(g, 'landing-dust');
  await g.waitForFunction(() => window.__game.scene.nearThing, null, { timeout: 5000 }).catch(() => {});
  await g.keyboard.press('KeyE'); await g.waitForTimeout(900); await shot(g, 'crowbar');
  await g.close();
  const d = await open('bedroom', true);
  await d.waitForFunction(() => document.getElementById('panel').classList.contains('on'), null, { timeout: 10000 }).catch(() => {});
  await d.waitForTimeout(300); await shot(d, 'dark-panel');
  await d.keyboard.press('Space'); await d.waitForTimeout(1200); await shot(d, 'dark-meter');
  await d.close();
  const e = await open('eastwing');
  await e.evaluate(() => { const s = window.__game.scene, k = s.kid; k.tx = k.fx = 9; k.ty = k.fy = 22; k.p = 1; k.moving = false; s.camX = 152; s.camY = 360; s.takePile(); });
  await e.waitForTimeout(500); await e.evaluate(() => { const s = window.__game.scene; s.kid.face = 'right'; s.throwAhead(); });
  await e.waitForTimeout(900); await shot(e, 'pebbles');
  await e.close();
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
