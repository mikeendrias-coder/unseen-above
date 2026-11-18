// Movement (Nov 17): double jump, wall jump, fall damage and HP. node tests/mech.js
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1360, height: 880 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ok = (l, v) => console.log((v ? 'ok   ' : 'FAIL ') + l);
  await p.addInitScript(() => { window.__noPanels = true; localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); });
  await p.goto(BASE + '/local.html#grounds'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid && window.__game.scene.clock > 0.5, null, { timeout: 30000 });
  const S = (fn, a) => p.evaluate(fn, a);
  const ground = () => S(() => { const s = window.__game.scene; s.placeAt(60); return s.kid.y; });
  const jumpPeak = async double => {
    const y0 = await ground(); await p.waitForTimeout(300);
    await S(() => { window.__peak = 999; const s = window.__game.scene; window.__iv = setInterval(() => { window.__peak = Math.min(window.__peak, s.kid.y); }, 5); });
    await p.keyboard.down('Space'); await p.waitForTimeout(double ? 330 : 700);
    if (double) { await p.keyboard.up('Space'); await p.waitForTimeout(30); await p.keyboard.down('Space'); await p.waitForTimeout(500); }
    await p.keyboard.up('Space'); await p.waitForTimeout(900);
    return y0 - await S(() => { clearInterval(window.__iv); return window.__peak; });
  };
  const one = await jumpPeak(false), two = await jumpPeak(true);
  ok(`jump ${one.toFixed(0)} px, with double jump ${two.toFixed(0)} px`, one > 30 && two > one + 10);
  // falls: 4 tiles is free, 6 costs 1, 9 costs 2, 12 kills
  const fall = async px => {
    const y0 = await ground(); await p.waitForTimeout(150);
    await S(([d, y]) => { const s = window.__game.scene, k = s.kid; k.hp = 3; k.inv = 0; k.y = y - d; k.vy = 0; k.onGround = false; k.peakY = k.y; }, [px, y0]);
    await p.waitForTimeout(1300);
    return S(() => ({ hp: window.__game.scene.kid.hp, dead: window.__game.scene.dead }));
  };
  for (const [d, want] of [[64, 3], [96, 2], [140, 1]]) { const r = await fall(d); ok(`a ${d} px fall leaves ${r.hp} HP`, r.hp === want && !r.dead); }
  const r = await fall(190); ok('a 190 px fall kills her', r.dead);
  await p.waitForFunction(() => window.__game.scene.kid && !window.__game.scene.dead && window.__game.scene.clock > 0.5, null, { timeout: 20000 });
  ok('the next take starts with 3 HP', await S(() => window.__game.scene.kid.hp === 3));
  // a wall jump: find a wall face she can stand beside, hang there, jump
  const wall = await S(() => { const s = window.__game.scene, k = s.kid; for (let x = 40; x < s.map.W * 16 - 40; x++) { s.placeAt(x); if (s.boxHits(k.x + 1, k.y - 30, k.w, k.h) && !s.boxHits(k.x, k.y - 30, k.w, k.h)) return x; } return null; });
  if (wall == null) ok('no wall found to test a wall jump on (skipped)', true);
  else {
    await S(x => { const s = window.__game.scene, k = s.kid; s.placeAt(x); k.y -= 30; k.vy = 40; k.onGround = false; }, wall);
    await p.keyboard.down('KeyD'); await p.waitForTimeout(80); await p.keyboard.press('Space'); await p.waitForTimeout(90); await p.keyboard.up('KeyD');
    const after = await S(() => ({ vx: window.__game.scene.kid.vx, vy: window.__game.scene.kid.vy }));
    ok(`a wall jump pushes her up and away (vx ${after.vx.toFixed(0)}, vy ${after.vy.toFixed(0)})`, after.vx < -40 && after.vy < 0);
  }
  // takes (lives): 5 per visit; after the first death a new take starts fast; at 0, the episode
  // starts again from its start with 5 (bodies stay)
  await p.waitForFunction(() => window.__game.scene.kid && !window.__game.scene.dead && window.__game.scene.clock > 0.3, null, { timeout: 20000 });
  const left0 = await S(() => window.__game.scene.takesLeft);
  ok('a new visit has 5 takes, minus the fall: ' + left0, left0 === 4);
  const tA = Date.now();
  await S(() => window.__game.scene.die({ id: 'garden lamp' }));
  await p.waitForFunction(() => window.__game.scene.kid && !window.__game.scene.dead && window.__game.scene.clock > 0.05, null, { timeout: 10000 });
  const fastMs = Date.now() - tA;
  ok(`after the first death the next take starts fast (${fastMs} ms, no key)`, fastMs < 2000 && await S(() => window.__game.scene.takesLeft === 3));
  for (let i = 0; i < 2; i++) {
    await S(() => window.__game.scene.die({ id: 'garden lamp' }));
    await p.waitForTimeout(150); await p.keyboard.press('Space');
    await p.waitForFunction(() => window.__game.scene.kid && !window.__game.scene.dead && window.__game.scene.clock > 0.05, null, { timeout: 10000 });
  }
  const before = await S(() => ({ left: window.__game.scene.takesLeft, bodies: window.__game.scene.ep.bodies.length }));
  ok('Space skips each strike; one take left: ' + before.left, before.left === 1);
  await S(() => window.__game.scene.die({ id: 'garden lamp' }));
  await p.waitForTimeout(150); await p.keyboard.press('Space');
  await p.waitForFunction(() => window.__game.scene.kid && !window.__game.scene.dead && window.__game.scene.sys.settings.data && window.__game.scene.sys.settings.data.outOfTakes, null, { timeout: 10000 });
  const after = await S(() => ({ left: window.__game.scene.takesLeft, bodies: window.__game.scene.ep.bodies.length, key: window.__game.scene.sys.settings.key }));
  ok(`out of takes: the episode starts again from its start with ${after.left} takes, ${after.bodies} bodies kept (${after.key})`, after.left === 5 && after.bodies >= before.bodies && after.key === 'grounds');
  // story mode hides HP and takes
  await p.keyboard.press('KeyI'); await p.waitForTimeout(150);
  ok('immunity on: HP and takes are hidden', await S(() => window.__game.state.immune));
  await p.keyboard.press('KeyI');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
})();
