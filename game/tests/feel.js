// Feel (Nov 18): instant takes, the take on the floor, juice, the broadcast bar, the report.
// node tests/feel.js   (UA_BASE=http://localhost:8794; SHOTS=dir saves screenshots at 1x)
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const SHOTS = process.env.SHOTS || '';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let fails = 0; const ok = (l, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + l); };
  await p.addInitScript(() => { window.__noPanels = true; localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); });
  await p.goto(BASE + '/local.html#grounds'); await p.click('#start');
  const S = (fn, a) => p.evaluate(fn, a);
  const live = () => p.waitForFunction(() => { const s = window.__game && window.__game.scene; return s && s.kid && !s.dead && s.sys.settings.status === 5 && s.clock > 0.3; }, null, { timeout: 90000 });
  const until = (fn, ms) => p.waitForFunction(fn, null, { timeout: ms || 4000, polling: 'raf' }).catch(() => null);
  const shot = async name => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + name + '.png', clip: await S(() => { const r = document.getElementById('overlay').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) }); };
  await live();

  // ---- juice: a squash frame on landing, a stretch frame on a jump, a hit-stop and a small kick
  ok('squash and stretch frames exist (12 x 13, 10 x 17)', await S(() => { const t = window.__game.scene.textures; const a = t.get('girl_squash').getSourceImage(), b = t.get('girl_stretch').getSourceImage(); return a.width === 12 && a.height === 13 && b.width === 10 && b.height === 17; }));
  const watch = () => S(() => { const s = window.__game.scene, cam = s.cameras.main; cam.__kickMax = 0; window.__seen = {}; window.__paused0 = false; window.__kick = 0; window.__w = true;
    const f = () => { if (!window.__w) return; window.__seen[s.girl.texture.key] = true; if (s.sys.isPaused()) window.__paused0 = true; window.__kick = cam.__kickMax || 0; requestAnimationFrame(f); }; f(); });
  const unwatch = () => S(() => { window.__w = false; return { seen: Object.keys(window.__seen), paused: window.__paused0, kick: window.__kick, zoom: window.__game.scene.cameras.main.zoom }; });
  const drop = px => S(d => { const s = window.__game.scene, k = s.kid; s.placeAt(60); const y = k.y; k.hp = 3; k.inv = 0; k.y = y - d; k.vy = 0; k.onGround = false; k.coyote = 0; k.peakY = k.y; }, px);
  await watch(); await drop(40); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(250);
  let w = await unwatch();
  ok('a landing shows the squash frame; no hit-stop or kick for a safe landing', w.seen.includes('girl_squash') && !w.paused && w.kick === 0);
  await watch(); await p.keyboard.down('Space'); await until(() => window.__game.scene.kid.vy < -20); await p.keyboard.up('Space'); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(200);
  w = await unwatch();
  ok('a jump shows the stretch frame', w.seen.includes('girl_stretch'));
  await watch(); await drop(100); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(400);
  w = await unwatch();
  const hp = await S(() => window.__game.scene.kid.hp);
  ok(`a fall that hurts freezes the scene a moment and kicks the view ${w.kick.toFixed(1)} px (HP ${hp})`, hp === 2 && w.paused && w.kick > 0 && w.kick <= 2.01);
  ok('the fall is on the record', await S(() => window.__feel.results.of('ep1').falls === 1));

  // ---- instant takes: the very first death plays out; after that, a cut and the take on the floor
  const dieAndTime = () => S(() => new Promise(res => {
    const s = window.__game.scene; let tLand = 0, faded = false, delay = null;
    s.die({ id: 'garden lamp' });
    const f = () => {
      if (!tLand && s.death && s.death.impacted) { tLand = performance.now(); delay = s.death.restart ? s.death.restart.delay : null; }
      if (s.cameras.main.fadeEffect.isRunning) faded = true;
      if (tLand && !s.dead && s.kid && s.sys.settings.status === 5 && s.clock > 0) return res({ ms: Math.round(performance.now() - tLand), take: s.ep.take, delay, faded });
      requestAnimationFrame(f);
    }; f();
  }));
  await live(); await S(() => { window.__game.scene.placeAt(260); });
  const first = await dieAndTime();
  ok(`the first death plays out in full, with a fade (${first.ms} ms from the body landing to the next take)`, first.faded && first.delay == null);
  await live(); await S(() => { window.__game.scene.placeAt(400); });
  const second = await dieAndTime();
  // timed in game terms (a busy machine stretches wall-clock time): a cut, not a fade, set for
  // under 0.3 s after the body lands; the wall-clock time is printed
  ok(`after that the next take cuts in (no fade), ${second.delay} ms after the body lands (${second.ms} ms here)`, second.delay != null && second.delay <= 300 && !second.faded && second.ms < 2500);
  await p.waitForTimeout(200);
  const tape = await S(() => { const s = window.__game.scene, t = s.__tape; return t ? { take: t.take, x: t.x + t.w / 2, kx: s.kid.x + s.kid.w / 2, y: t.y, ky: s.kid.y + s.kid.h } : null; });
  ok(`the take is taped to the floor where she starts (TAKE ${tape && tape.take})`, tape && tape.take === second.take && Math.abs(tape.x - tape.kx) <= 1 && tape.y > tape.ky);
  ok('no TAKE card over the picture', await S(() => !/TAKE/.test(document.querySelector('#card .card-top').textContent) || !document.getElementById('card').classList.contains('on')));
  await shot('feel-tape');

  // ---- the broadcast bar: red ticks where she died, her best, BEST when she passes it
  const r0 = await S(() => { const r = window.__feel.results.of('ep1'); return { ticks: r.ticks.length, best: r.best }; });
  ok(`the bar has a tick for each death this visit (${r0.ticks}) and keeps her best (${r0.best.toFixed(2)})`, r0.ticks === 2 && r0.best > 0.05);
  const red = await S(() => { const c = document.getElementById('feel'), x = c.getContext('2d'), d = x.getImageData(0, 178, 320, 6).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 0xe3 && d[i + 1] === 0x41 && d[i + 2] === 0x2b) n++; return n; });
  ok(`red death ticks are drawn on the strip (${red} px)`, red >= 4);
  await S(() => { const s = window.__game.scene, r = window.__feel.results.of('ep1'); s.placeAt(s.level.start.x + (s.level.door.x - s.level.start.x) * Math.min(0.95, r.best + 0.1)); });
  const best = await until(() => window.__feel.results.of('ep1').bestAt > 0, 3000);
  ok('passing her best stamps BEST', !!best);
  await p.waitForTimeout(100); await shot('feel-best');

  // ---- the report: the form, the grade, any key, REHEARSAL in story mode
  const d = await S(() => window.__feel.results.collect(window.__game.scene));
  ok(`the report counts this visit: takes ${d.takes}, time ${d.time.toFixed(0)} s, falls ${d.falls}, grade ${d.grade}`, d.takes === 3 && d.falls >= 1 && d.time > 1 && ['DAYTIME', 'LATE NIGHT'].includes(d.grade));
  const tShow = Date.now();
  await S(() => { window.__done = 0; window.__feel.results.show(window.__game.scene, null, () => { window.__done++; }); });
  await p.waitForTimeout(500); await shot('feel-report');
  const srText = await S(() => document.getElementById('results').textContent);
  ok('the report reads out: ' + srText, /Takes 3/.test(srText) && /operator none/.test(srText));
  await p.keyboard.press('KeyX');
  await until(() => window.__done === 1, 2000);
  ok(`any key moves on (${Date.now() - tShow} ms), once`, await S(() => window.__done === 1 && !window.__feel.results.up));
  await S(() => { window.__done = 0; window.__feel.results.show(window.__game.scene, null, () => { window.__done++; }); });
  const t2 = Date.now(); await until(() => window.__done === 1, 4000);
  ok(`left alone it goes by itself in about 2 s (${Date.now() - t2} ms)`, Date.now() - t2 < 3000);
  await p.keyboard.press('KeyI'); await p.waitForTimeout(150);
  ok('story mode stamps REHEARSAL', await S(() => window.__feel.results.collect(window.__game.scene).grade === 'REHEARSAL'));
  await p.keyboard.press('KeyI'); await p.waitForTimeout(150);
  ok('a clean run is PRIME TIME; many deaths are a RERUN', await S(() => { const g = window.__feel.gradeOf; return g({ id: 'ep1', deaths: 0, time: 40 }) === 'PRIME TIME' && g({ id: 'ep1', deaths: 9, time: 40 }) === 'RERUN' && g({ id: 'ep1', deaths: 1, time: 400 }) === 'LATE NIGHT'; }));

  // ---- results.next: the report, then the next part of the show
  await S(() => window.__feel.results.next(window.__game.scene, 'ep1'));
  await until(() => window.__feel.results.up, 2000);
  await p.waitForTimeout(400); await p.keyboard.press('Enter');
  const went = await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'satellite', null, { timeout: 15000 }).catch(() => null);
  ok('results.next shows the report, then goes on to the satellite', !!went);

  // ---- top-down (the east wing): the same instant takes, the tape on the floor tile
  await p.close(); p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__noPanels = true; localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); });
  await p.goto(BASE + '/local.html#eastwing'); await p.click('#start');
  await p.waitForFunction(() => { const s = window.__game && window.__game.scene; return s && s.sys.settings.key === 'eastwing' && s.kid && !s.dead && s.clock > 0.3; }, null, { timeout: 30000 });
  const ewLive = () => p.waitForFunction(() => { const s = window.__game.scene; return s.kid && !s.dead && s.sys.settings.status === 5 && s.clock > 0.2; }, null, { timeout: 90000 });
  await S(() => window.__game.scene.die({ id: 'motion sensor' })); // her first death: in full
  await p.waitForTimeout(300); await ewLive();
  const ew = await S(() => new Promise(res => {
    const s = window.__game.scene; let tLand = 0, delay = null;
    s.die({ id: 'motion sensor' });
    const f = () => {
      if (!tLand && s.death && s.death.impacted) tLand = performance.now();
      if (!delay && s.death && s.death.restart) delay = s.death.restart.delay;
      if (tLand && !s.dead && s.kid && s.sys.settings.status === 5 && s.clock > 0.1 && s.__tape && s.__tape.g) return res({ ms: Math.round(performance.now() - tLand), tape: s.__tape.take, take: s.ep.take, delay });
      requestAnimationFrame(f);
    }; f();
  }));
  ok(`east wing: the next take cuts in ${ew.delay} ms after the body lands (${ew.ms} ms here); TAKE ${ew.tape} on the floor`, ew.delay <= 300 && ew.tape === ew.take);
  await p.waitForTimeout(300); await shot('feel-eastwing');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
