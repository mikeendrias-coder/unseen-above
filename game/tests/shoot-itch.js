// Pictures for the itch.io page, taken from the game itself: screenshots at 4x (1280 x 720,
// tests/out/itch-shot-*.png) and cover crops at 3x (630 x 500, tests/out/itch-cover-*.png).
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  // a page whose canvas is S times 320 x 180
  const open = async (part, S, setup) => {
    const vh = S === 4 ? 1060 : 760;
    const p = await b.newPage({ viewport: { width: 1400, height: vh }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(part + ': ' + e.message));
    await p.addInitScript(() => { window.__noPanels = true; window.__noDeath = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true, settings: { music: 0, sfx: 0, reduceFlash: false, shake: false } })); } catch (e) {} });
    await p.goto(BASE + '/local.html#' + part); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.isActive() && (window.__game.scene.clock || 0) > 0.3, null, { timeout: 60000 });
    if (setup) await setup(p);
    return p;
  };
  const canvasBox = p => p.evaluate(() => { const r = document.querySelector('#stage canvas').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const clean = p => p.evaluate(() => { const o = window.__unseen.overlay; o.clearCaption(); o.hint(''); });
  const shot = async (p, name) => { await clean(p); const c = await canvasBox(p); await p.screenshot({ path: 'tests/out/itch-shot-' + name + '.png', clip: { x: c.x, y: c.y, width: c.w, height: c.h } }); console.log(name, c.w + 'x' + c.h); };
  const cover = async (p, name, gx, gy) => { await clean(p); const c = await canvasBox(p); await p.screenshot({ path: 'tests/out/itch-cover-' + name + '.png', clip: { x: c.x + gx * 3, y: c.y + gy * 3, width: 630, height: 500 } }); console.log('cover', name, c.w + 'x' + c.h); };

  if (!process.env.COVERS_ONLY) {
  // 1. the grounds at night: the fountain, a drone, the lamps
  let p = await open('grounds', 4, async p => { await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 40 * 16; s.kid.y = 146; s.kid.vy = 0; s.kid.face = 1; }); await p.waitForTimeout(2200); });
  await shot(p, '1-grounds'); await p.close();
  // 2. the gallery with the glasses on: what the cameras see
  p = await open('gallery', 4, async p => { await p.evaluate(() => { const s = window.__game.scene; s.glasses = true; s.gl.has = true; s.gl.on = true; s.kid.x = 33 * 16; s.kid.y = 146; s.kid.vy = 0; }); await p.waitForTimeout(1800); });
  await shot(p, '2-gallery'); await p.close();
  // 3. the east wing from above, glasses on
  p = await open('eastwing', 4, async p => { await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.tx = k.fx = 15; k.ty = k.fy = 21; k.p = 1; k.moving = false; s.camX = 15 * 16 + 8; s.camY = 19 * 16 + 8; s.gl.has = true; s.gl.on = true; }); await p.waitForTimeout(1600); });
  await shot(p, '3-eastwing'); await p.close();
  // 4. the kids' game show screen
  p = await open('batch4', 4, async p => { await p.waitForTimeout(2500); });
  await shot(p, '4-gameshow'); await p.close();
  // 5. the Moon city, Earth overhead
  p = await open('moon', 4, async p => { await p.waitForTimeout(1500); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(2600); await p.keyboard.up('ArrowRight'); await p.waitForTimeout(800); });
  await shot(p, '5-moon'); await p.close();
  // 6. backstage: the creator, the searchlight
  p = await open('hallway', 4, async p => { await p.evaluate(() => { const s = window.__game.scene; s.sword.have = true; s.swordThing.off = true; s.startRound(0); s.cr.x = 33 * 16; s.kid.x = 26 * 16; s.kid.y = 146; s.kid.vy = 0; s.kid.face = 1; s.lamp.t = 6.4; }); await p.waitForTimeout(700); });
  await shot(p, '6-fight'); await p.close();
  // 7. the bedroom wing in red
  p = await open('bedroom', 4, async p => { await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 15 * 16 + 20; s.kid.y = 146; s.kid.vy = 0; }); await p.waitForTimeout(2600); });
  await shot(p, '7-bedroom'); await p.close();
  }

  // covers at 3x: crops of the grounds and the city
  p = await open('grounds', 3, async p => { await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 40 * 16; s.kid.y = 146; s.kid.vy = 0; s.kid.face = 1; }); await p.waitForTimeout(2200); });
  await cover(p, 'grounds', 100, 10); await p.close();
  p = await open('moon', 3, async p => { await p.waitForTimeout(1500); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(2600); await p.keyboard.up('ArrowRight'); await p.waitForTimeout(800); });
  await cover(p, 'moon', 20, 4); await p.close();
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' | ') : 'no page errors');
  await b.close();
})();
