// What the glasses show, on and off: episode 3 sensors and cones, episode 4 camera cones in the
// warning. With the glasses off nothing that watches her may be drawn, only real lights.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__noPanels = true; window.__noDeath = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  const shot = n => p.screenshot({ path: `tests/out/seen-${n}.png`, clip: { x: 40, y: 42, width: 1280, height: 720 } });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 30 });
  // episode 3: by the sensor corridor
  await p.goto(BASE + '/local.html#eastwing'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'eastwing' && window.__game.scene.clock > 1);
  await p.evaluate(() => { const s = window.__game.scene; s.placeTile(17, 20); s.glitchT = 9; });
  // glasses on, in a frame where they show
  await p.evaluate(() => { const s = window.__game.scene; s.gl.on = true; s.gl.heat = 0; s.gl.out = 0; s.gl.update = function (dt) { this.t += dt; }; });
  await p.waitForTimeout(500);
  await until(() => { const s = window.__game.scene, t = s.clock; return (Math.sin(t * 2.3) + Math.sin(t * 5.7 + 1) * 0.6 + Math.sin(t * 13.1) * 0.3) > -0.2 && s.sensors.some(q => s.sensorOn(q)); }, null, 20000);
  await shot('ep3-on');
  await p.evaluate(() => { window.__game.scene.gl.on = false; });
  await until(() => { const s = window.__game.scene; return s.sensors.some(q => s.sensorOn(q)); }, null, 20000);
  await p.waitForTimeout(60); await shot('ep3-off');
  // the study camera and the robot, glasses off
  await p.evaluate(() => { const s = window.__game.scene; s.placeTile(22, 6); });
  await p.waitForTimeout(500); await shot('ep3-off-study');
  // episode 4: a flash camera in its warning, glasses on and off
  await p.goto('about:blank'); await p.goto(BASE + '/local.html#bedroom'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 1);
  await p.evaluate(() => { const s = window.__game.scene; s.gl.on = true; s.gl.heat = 0; s.gl.out = 0; s.gl.update = function (dt) { this.t += dt; }; });
  await until(() => window.__game.scene.cams.some(c => c.warn && c.cone && c.x > window.__game.scene.view.x && c.x < window.__game.scene.view.x + 320), null, 20000);
  await p.evaluate(() => { const s = window.__game.scene, c = s.cams.find(c => c.warn); s.kid.x = Math.max(20, c.x - 60); });
  await until(() => window.__game.scene.cams.some(c => c.warn && c.x > window.__game.scene.view.x && c.x < window.__game.scene.view.x + 320), null, 20000);
  await shot('ep4-warn-on');
  await p.evaluate(() => { window.__game.scene.gl.on = false; });
  await until(() => window.__game.scene.cams.some(c => !c.warn), null, 20000);
  await until(() => window.__game.scene.cams.some(c => c.warn && c.x > window.__game.scene.view.x && c.x < window.__game.scene.view.x + 320), null, 20000);
  await shot('ep4-warn-off');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
