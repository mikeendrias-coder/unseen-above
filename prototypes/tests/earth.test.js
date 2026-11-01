const { chromium } = require('playwright');
const ver = process.argv[2] || 'p4';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(`http://localhost:8765/earth-${ver}.html`);
  await page.waitForFunction(() => window.__earthGame && window.__earthGame.scene.isActive('side'), null, { timeout: 15000 });
  await sleep(400);
  const shot = n => page.screenshot({ path: `/home/claude/game/tests/earth-${ver}-${n}.png` });
  const S = () => page.evaluate(() => { const g = window.__earthGame, st = window.__earthState; const sc = g.scene.isActive('top') ? g.scene.getScene('top') : g.scene.getScene('side'); const k = sc.kid; return { view: st.view, deaths: st.deaths, glassesOwned: st.glassesOwned, glassesOn: st.glassesOn, pebbles: st.pebbles, kid: k ? { x: +(k.x ?? k.tx).toFixed(1), y: +(k.y ?? k.ty).toFixed(1), tx: k.tx, ty: k.ty, onGround: k.onGround, crouch: k.crouch } : null, dead: sc.dead, complete: sc.complete, zoom: g.scale.zoom }; });
  await shot('01-start-overlay');
  await page.click('#start');
  await sleep(200);
  console.log('start', JSON.stringify(await S()));
  // --- real input: walk to the crate, climb in through the window ---
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 80; i++) { const s = await S(); if (s.kid.x >= 136) break; await sleep(30); }
  await page.keyboard.down('Space'); await sleep(260); await page.keyboard.up('Space');
  for (let i = 0; i < 40; i++) { const s = await S(); if (s.kid.onGround && s.kid.y < 140) break; await sleep(30); }
  console.log('on crate?', JSON.stringify((await S()).kid));
  await page.keyboard.down('Space'); await sleep(260); await page.keyboard.up('Space');
  await sleep(1400);
  await page.keyboard.up('ArrowRight');
  const inside = await S(); console.log('after window', JSON.stringify(inside.kid));
  await shot('02-inside-rim');
  // --- teleport to the waiting room, take the glasses ---
  const tp = (x) => page.evaluate(x => { const s = window.__earthGame.scene.getScene('side'); s.kid.x = x; s.kid.y = 160 - s.kid.h; s.kid.vx = 0; s.kid.vy = 0; }, x);
  await tp(33 * 16 - 12); await sleep(200);
  await page.keyboard.press('e'); await sleep(200);
  console.log('glasses', JSON.stringify(await S()));
  await shot('03-glasses');
  // --- camera room: stand in the open and let the camera find us ---
  const d0 = (await S()).deaths;
  await tp(46 * 16 + 4); 
  let caught = false;
  for (let i = 0; i < 60; i++) { await sleep(100); const s = await S(); if (s.deaths > d0) { caught = true; break; } if (i === 20) await shot('04-camera-cone'); }
  console.log('camera caught kid:', caught);
  // --- under the desk: should be safe for a full sweep ---
  await tp(43 * 16); await page.keyboard.down('ArrowDown'); await sleep(100);
  const d1 = (await S()).deaths; await sleep(4600); const d2 = (await S()).deaths;
  await page.keyboard.up('ArrowDown');
  console.log('hidden under desk for a full sweep (no death):', d2 === d1);
  // --- beam room: standing gets hit by the high beam ---
  const d3 = (await S()).deaths; await tp(54 * 16);
  let beamHit = false; for (let i = 0; i < 70; i++) { await sleep(100); const s = await S(); if (s.deaths > d3) { beamHit = true; break; } if (i === 14) await shot('05-beam'); }
  console.log('beam hit standing kid:', beamHit);
  // --- door (wait for the beam to rest first) ---
  await sleep(800); await page.waitForFunction(() => window.__earthGame.scene.getScene('side').beam.phase === 'idle'); await tp(57 * 16 + 4); await sleep(150); await page.keyboard.press('e');
  await page.waitForFunction(() => window.__earthGame.scene.isActive('top'), null, { timeout: 8000 }).catch(() => {});
  await sleep(1200);
  console.log('after door', JSON.stringify(await S()));
  await shot('06-topdown-start');
  // --- top-down: walk right four tiles ---
  const t0 = (await S()).kid; await page.keyboard.down('ArrowRight'); await sleep(450); await page.keyboard.up('ArrowRight'); await sleep(200);
  console.log('walked from', t0.tx, 'to', (await S()).kid.tx);
  // --- teleport helper for top ---
  const tt = (x, y, face) => page.evaluate(([x, y, face]) => { const s = window.__earthGame.scene.getScene('top'); Object.assign(s.kid, { tx: x, ty: y, fx: x, fy: y, p: 1, moving: false, face: face || 'right' }); }, [x, y, face]);
  // motion sensor: walk through while it pulses (no pebble) should die eventually
  await tt(11, 16, 'right'); await sleep(100);
  const d4 = (await S()).deaths; await page.keyboard.down('ArrowRight'); await sleep(1300); await page.keyboard.up('ArrowRight');
  await sleep(900); console.log('walking through sensor without stopping died:', (await S()).deaths > d4);
  await shot('07-sensor-death');
  // pebble into sensor range then cross
  await sleep(700); await tt(11, 16, 'right'); await sleep(150);
  await page.keyboard.press('f'); await sleep(600);
  const cool = await page.evaluate(() => window.__earthGame.scene.getScene('top').sensors[0].cool);
  console.log('pebble triggered sensor, cooldown s =', cool.toFixed(2), 'pebbles left', (await S()).pebbles);
  await shot('08-pebble-sensor');
  const d5 = (await S()).deaths; await page.keyboard.down('ArrowRight'); await sleep(950); await page.keyboard.up('ArrowRight'); await sleep(300);
  console.log('crossed during cooldown without dying:', (await S()).deaths === d5, 'kid at', (await S()).kid.tx);
  // trap door revealed by a pebble
  await tt(21, 15, 'right'); await sleep(100); await page.keyboard.press('f'); await sleep(700);
  const trapOpen = await page.evaluate(() => window.__earthGame.scene.getScene('top').traps[0].open);
  console.log('pebble opened trap door at 25,15:', trapOpen);
  // click-to-throw: aim at a tile two up from the kid
  { const before = (await S()).pebbles; const pt = await page.evaluate(() => { const g = window.__earthGame, s = g.scene.getScene('top'), cam = s.cameras.main, r = g.canvas.getBoundingClientRect(); const wx = (s.kid.tx) * 16 + 8, wy = (s.kid.ty - 2) * 16 + 8; return { x: r.left + (wx - cam.worldView.x) * r.width / 320, y: r.top + (wy - cam.worldView.y) * r.height / 180 }; });
    await page.mouse.click(pt.x, pt.y); await sleep(600); console.log('click throw used a pebble:', (await S()).pebbles === before - 1); }
  // camera in R4: stand in the sweep
  const d6 = (await S()).deaths; await tt(22, 7, 'up'); let camHit = false;
  for (let i = 0; i < 60; i++) { await sleep(100); if ((await S()).deaths > d6) { camHit = true; break; } }
  console.log('sweeping camera caught kid:', camHit);
  // glasses break demo
  await sleep(900); await tt(18, 9, 'left'); await sleep(200); await shot('09-glasses-on-r5');
  await page.keyboard.press('g'); await sleep(700); await shot('10-glasses-breaking'); await sleep(1100);
  console.log('glasses after G:', JSON.stringify(await S()));
  await shot('11-glasses-off-dark');
  // exit
  await tt(12, 3, 'up'); await sleep(100); await page.keyboard.down('ArrowUp'); await sleep(250); await page.keyboard.up('ArrowUp'); await sleep(400);
  console.log('complete:', (await S()).complete);
  await shot('12-complete');
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('TEST FAILED', e); process.exit(1); });
