// Modes and review tools (Nov 18): I cycles NORMAL, ENDLESS, IMMUNE. IMMUNE skips nothing: the
// hazard plays out, then she regenerates at the mark with no life, take or body lost (the
// bedroom's flash, the gallery's chandelier, which used to leave her stuck). ENDLESS: she dies as
// usual but lives never run out. N skips ahead in both; on a satellite screen N solves the puzzle.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 50 });
  const S = (fn, a) => p.evaluate(fn, a);
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const rec = () => S(() => { const s = window.__game.scene; return { mode: window.__game.state.mode, lives: window.__unseen.cg.status.lives, left: s.takesLeft, bodies: s.ep.bodies.length, take: s.ep.take, key: s.sys.settings.key }; });
  // a fresh take is up (after a death)
  const back = (ms) => until(() => { const s = window.__game.scene; return s.kid && !s.dead && s.clock > 0.1 && s.sys.settings.data && s.sys.settings.data.retry; }, null, ms || 12000);
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#bedroom'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 0.6);
  ok('a new game is NORMAL, lives read 5', (await rec()).mode === 'normal' && (await rec()).lives.n === 5 && (await rec()).lives.kind === 'normal');
  await p.keyboard.press('KeyI');
  await until(() => window.__game.state.mode === 'endless', null, 3000);
  ok('I: ENDLESS, the lives read infinity, the tag shows', (await rec()).lives.kind === 'endless' && await S(() => document.getElementById('immune').classList.contains('on')));
  await p.keyboard.press('KeyI');
  await until(() => window.__game.state.mode === 'immune', null, 3000);
  ok('I again: IMMUNE, the lives read IMMUNE, nothing turns off deaths', (await rec()).lives.kind === 'immune' && await S(() => !window.__noDeath));
  // IMMUNE: standing in the open under the landing camera, the flash catches her and the strike
  // plays; she comes back at the mark with nothing lost
  const r0 = await rec();
  await S(() => { const s = window.__game.scene; s.kid.x = 152; s.kid.y = 146; });
  await until(() => window.__game.scene.dead, null, 12000);
  const struck = await S(() => !!(window.__game.scene.death && window.__game.scene.death.regen));
  await until(() => { const s = window.__game.scene; return s.kid && !s.dead && s.sys.settings.data && s.sys.settings.data.regen; }, null, 12000);
  const r1 = await rec();
  ok(`immune: the flash catches her, the strike plays, she regenerates (bodies ${r0.bodies} to ${r1.bodies}, take ${r0.take} to ${r1.take}, lives ${r0.left} to ${r1.left})`, struck && r1.bodies === r0.bodies && r1.take === r0.take && r1.left === r0.left);
  const xs = [];
  for (let i = 0; i < 5; i++) { await p.keyboard.press('KeyN'); await p.waitForTimeout(250); xs.push(await S(() => Math.round(window.__game.scene.kid.x))); }
  ok('N skips ahead section by section in IMMUNE: ' + xs.join(', '), xs.every((x, i) => i === 0 || x >= xs[i - 1]) && xs[xs.length - 1] > 800);
  await until(() => window.__game.scene.bag.have, null, 5000);
  ok('at the stairs, N pulls the bag', true);
  await p.waitForTimeout(1500); await p.keyboard.press('KeyN'); await p.waitForTimeout(300);
  ok('after the bag, N goes to the doors', await S(() => window.__game.scene.kid.x > 84 * 16));

  // the gallery's chandelier, IMMUNE (Michael got stuck under it): with 3 HP it hurts her and
  // throws her clear, and she can walk; with 2 it kills her and she regenerates, nothing lost
  await p.goto(BASE + '/local.html#gallery');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.kid && window.__game.scene.clock > 0.6);
  ok('the mode is kept: IMMUNE', (await rec()).mode === 'immune');
  const under = hp => S(h => { const s = window.__game.scene, k = s.kid, X = s.level.dropper; k.x = X.x - 4; k.y = 208 - k.h; k.vx = 0; k.vy = 0; k.onGround = true; k.hp = h; k.inv = 0; s.markCheckpoint({ x: X.x - 60, y: 208 - 14 }); }, hp);
  // every line the strip shows from here on, so a short one is not missed between polls
  await S(() => { const seen = window.__ccSeen = new Set(); clearInterval(window.__ccPoll); window.__ccPoll = setInterval(() => seen.add(document.getElementById('cc').textContent), 40); });
  await under(3);
  await until(() => window.__game.scene.drop.phase === 'down', null, 8000);
  await p.waitForTimeout(700);
  const hurt = await S(() => { const s = window.__game.scene, k = s.kid; return { hp: k.hp, dead: s.dead, inside: s.boxHits(k.x, k.y, k.w, k.h), x: k.x }; });
  await p.keyboard.down('KeyA'); await p.waitForTimeout(500); await p.keyboard.up('KeyA');
  const moved = await S(x => window.__game.scene.kid.x < x - 8, hurt.x);
  ok(`chandelier at 3 HP: HP ${hurt.hp}, thrown clear (inside the wreck: ${hurt.inside}), she walks away (${moved})`, hurt.hp === 1 && !hurt.dead && !hurt.inside && moved);
  // the line depends on the mode (core/death.js EXPLAIN): IMMUNE says lights and lasers reset her
  const hpLine = { normal: 'HP: hits. Lights and lasers take a life.', endless: 'HP: hits. Lights and lasers take a life.', immune: 'HP: hits. Lights and lasers reset you.' }[(await rec()).mode];
  ok('the first HP lost explains HP in the strip (' + hpLine + ')', await until(t => [...window.__ccSeen].some(c => c.startsWith('HP: hits.')), hpLine, 6000).then(() => true, async () => { console.log('     strip showed: ' + JSON.stringify(await S(() => [...window.__ccSeen]))); return false; }));
  await S(() => clearInterval(window.__ccPoll));
  await p.keyboard.press('Backspace'); await back();
  const g0 = await rec();
  await under(2);
  await until(() => window.__game.scene.dead, null, 8000);
  await until(() => { const s = window.__game.scene; return s.kid && !s.dead && s.sys.settings.data && s.sys.settings.data.regen; }, null, 12000);
  const g1 = await rec();
  const fresh = await S(() => { const s = window.__game.scene, k = s.kid; return { phase: s.drop.phase, inside: s.boxHits(k.x, k.y, k.w, k.h), x: Math.round(k.x), hp: k.hp }; });
  ok(`chandelier at 2 HP: it falls and kills her, she regenerates at the mark (x ${fresh.x}, HP ${fresh.hp}), the chandelier hangs again (${fresh.phase}), nothing lost (bodies ${g0.bodies} to ${g1.bodies}, lives ${g0.left} to ${g1.left})`, fresh.phase === 'hang' && !fresh.inside && fresh.hp === 3 && g1.bodies === g0.bodies && g1.left === g0.left && g1.take === g0.take);

  // ENDLESS: she dies as usual (a body, a take) and the lives never go down
  await p.keyboard.press('KeyI'); await until(() => window.__game.state.mode === 'normal', null, 3000);
  await p.keyboard.press('KeyI'); await until(() => window.__game.state.mode === 'endless', null, 3000);
  const e0 = await rec();
  for (let i = 0; i < 6; i++) { await S(() => window.__game.scene.die({ id: 'laser', direct: true })); await p.waitForTimeout(120); await p.keyboard.press('Space'); await back(); }
  const e1 = await rec();
  ok(`endless: six deaths, six bodies (${e0.bodies} to ${e1.bodies}), lives stay ${e1.left}, the readout is infinity, the episode never restarts`, e1.bodies === e0.bodies + 6 && e1.left === e0.left && e1.lives.kind === 'endless' && e1.key === 'gallery' && !(await S(() => window.__game.scene.sys.settings.data.outOfTakes)));
  await p.keyboard.press('KeyI'); await until(() => window.__game.state.mode === 'immune', null, 3000);

  // satellite: N solves the screen
  await p.goto(BASE + '/local.html#batch1'); await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite');
  await p.waitForTimeout(600);
  const lv = await S(() => window.__game.scene.levelIdx);
  await p.keyboard.press('KeyN');
  await until(i => window.__game.scene.levelIdx > i || window.__game.scene.solved, lv, 8000);
  ok('on a satellite screen, N solves the puzzle', true);
  await p.keyboard.press('KeyI');
  await until(() => window.__unseen.state.mode === 'normal', null, 3000);
  ok('I again: back to NORMAL, the tag goes', await S(() => !document.getElementById('immune').classList.contains('on')));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
