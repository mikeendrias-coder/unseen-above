// Feel (Nov 18): instant takes, the take on the floor, juice, the broadcast bar, the report.
// node tests/feel.js   (UA_BASE=http://localhost:8794; SHOTS=dir saves screenshots at 1x)
// Everything here is checked in play: real landings, real deaths, a real door out of the grounds.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const SHOTS = process.env.SHOTS || '';
const LIVE_MS = 500; // the brief: the next take is up in under about 0.5 s after the body lands
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  let fails = 0; const ok = (l, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + l); };
  let p;
  const open = async hash => {
    if (p) await p.close();
    p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.__noPanels = true; localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); });
    await p.goto(BASE + '/local.html#' + hash); await p.click('#start');
  };
  const S = (fn, a) => p.evaluate(fn, a);
  const live = () => p.waitForFunction(() => { const s = window.__game && window.__game.scene; return s && s.kid && !s.dead && s.sys.settings.status === 5 && s.clock > 0.3; }, null, { timeout: 90000 });
  const until = (fn, ms) => p.waitForFunction(fn, null, { timeout: ms || 4000, polling: 'raf' }).catch(() => null);
  const shot = async name => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + name + '.png', clip: await S(() => { const r = document.getElementById('overlay').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) }); };
  // a death; resolves with ms of wall clock from the body landing to the first frame of the next
  // take (the scene running again, her up, its update run)
  const dieAndTime = id => S(id => new Promise(res => {
    const s = window.__game.scene; let tLand = 0, faded = false;
    s.die({ id });
    const f = () => {
      if (!tLand && s.death && s.death.impacted) tLand = performance.now();
      if (tLand && s.cameras.main.fadeEffect.isRunning) faded = true; // (a fade-in left from the take before does not count)
      if (tLand && !s.dead && s.kid && s.sys.settings.status === 5 && s.clock > 0) return res({ ms: Math.round(performance.now() - tLand), take: s.ep.take, faded });
      requestAnimationFrame(f);
    }; f();
  }), id);
  // the picture's pixels, as the renderer drew them (r, g, b at view x, y)
  const pixels = () => S(() => new Promise(res => window.__game.scene.game.renderer.snapshot(img => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    window.__px = { w: img.width, h: img.height, d: x.getImageData(0, 0, img.width, img.height).data }; res([img.width, img.height]);
  })));
  // how many pixels of a color sit in a rect of the view (view coords, 320 x 180)
  const countColor = (rect, hex) => S(([r, hex]) => {
    const P = window.__px, s = P.w / 320, want = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); let n = 0;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { const o = (Math.floor(y * s) * P.w + Math.floor(x * s)) * 4; if (Math.abs(P.d[o] - want[0]) < 6 && Math.abs(P.d[o + 1] - want[1]) < 6 && Math.abs(P.d[o + 2] - want[2]) < 6) n++; }
    return n;
  }, [rect, hex]);

  // ================================================================ the grounds
  await open('grounds'); await live();
  // ---- juice: a squash frame on landing, a stretch frame on a jump, a hit-stop and a small kick
  ok('squash and stretch frames exist (12 x 13, 10 x 17)', await S(() => { const t = window.__game.scene.textures; const a = t.get('girl_squash').getSourceImage(), b = t.get('girl_stretch').getSourceImage(); return a.width === 12 && a.height === 13 && b.width === 10 && b.height === 17; }));
  // the view's sideways offset, read from the camera matrix the renderer drew with (its scroll
  // is kept apart from it, so a still view reads 0 there)
  const watch = () => S(() => { const s = window.__game.scene, cam = s.cameras.main; window.__seen = {}; window.__froze = false; window.__off = []; window.__w = true;
    const f = () => { if (!window.__w) return; window.__seen[s.girl.texture.key] = true; if (s.__frozen) window.__froze = true; if (s.sys.isPaused()) window.__pausedScene = true; requestAnimationFrame(f); }; f();
    if (!window.__post) { window.__post = true; window.__game.scene.game.events.on('postrender', () => { if (!window.__w) return; const c = window.__game.scene.cameras.main; window.__off.push([c.matrix.tx / (c.matrix.a || 1), 0]); }); } });
  const unwatch = () => S(() => { window.__w = false; const o = window.__off, x0 = o.length ? o[0][0] : 0, y0 = o.length ? o[0][1] : 0;
    const kick = o.reduce((m, [x, y]) => Math.max(m, Math.abs(Math.round(x - x0)), Math.abs(Math.round(y - y0))), 0);
    return { seen: Object.keys(window.__seen), froze: window.__froze, paused: !!window.__pausedScene, kick }; });
  const drop = px => S(d => { const s = window.__game.scene, k = s.kid; s.placeAt(60); const y = k.y; k.hp = 3; k.inv = 0; k.y = y - d; k.vy = 0; k.onGround = false; k.coyote = 0; k.peakY = k.y; }, px);
  await drop(1); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(200);
  await watch(); await drop(40); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(250);
  let w = await unwatch();
  ok(`a landing shows the squash frame; no hit-stop or kick for a safe landing (kick ${w.kick})`, w.seen.includes('girl_squash') && !w.froze && w.kick === 0);
  await watch(); await p.keyboard.down('Space'); await until(() => window.__game.scene.kid.vy < -20); await p.keyboard.up('Space'); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(200);
  w = await unwatch();
  ok('a jump shows the stretch frame', w.seen.includes('girl_stretch'));
  await drop(1); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(200);
  await watch(); await drop(100); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(400);
  w = await unwatch();
  const hp = await S(() => window.__game.scene.kid.hp);
  ok(`a fall that hurts holds the scene a moment (not a scene pause) and moves the view ${w.kick} px (HP ${hp})`, hp === 2 && w.froze && !w.paused && w.kick >= 1 && w.kick <= 2);
  ok('the fall is on the record', await S(() => window.__feel.results.of('ep1').falls === 1));
  // the pause key inside a hit-stop is not lost
  await drop(1); await until(() => window.__game.scene.kid.onGround); await p.waitForTimeout(200);
  await drop(100); await until(() => window.__game.scene.__frozen, 2000); await p.keyboard.press('Escape');
  ok('Escape pressed during the hit-stop opens the pause menu', !!(await until(() => window.__paused, 1500)));
  await p.waitForTimeout(200); await p.keyboard.press('Escape');
  ok('closing the menu lets the scene run again', !!(await until(() => { const s = window.__game.scene; return !window.__paused && !s.__frozen && s.sys.isActive(); }, 2000)));
  const quiet = await S(() => { const c = window.__game.scene.cameras.main; c.shake(200, 0.05); return !c.shakeEffect.isRunning; });
  ok('nothing else shakes the view (a camera shake call does nothing)', quiet);

  // ---- instant takes: the very first death plays out; after that, a cut and the take on the floor
  // (x 200 is short of the grounds' first tape mark, x 256 with a 64 px reach: both takes start
  // from the level's start, not a checkpoint)
  await live(); await S(() => { window.__game.scene.placeAt(200); });
  const first = await dieAndTime('garden lamp');
  ok(`the first death plays out in full, with a fade (${first.ms} ms from the body landing to the next take)`, first.faded);
  await live(); await S(() => { window.__game.scene.placeAt(400); });
  const second = await dieAndTime('garden lamp');
  ok(`after that the next take cuts in, no fade, ${second.ms} ms after the body lands (under ${LIVE_MS})`, !second.faded && second.ms < LIVE_MS);
  await p.waitForTimeout(200);
  const tape = await S(() => { const s = window.__game.scene, t = s.__tape; return t ? { take: t.take, x: t.x + t.w / 2, kx: s.kid.x + s.kid.w / 2, y: t.y, ky: s.kid.y + s.kid.h } : null; });
  ok(`the take is taped to the floor where she starts (TAKE ${tape && tape.take})`, tape && tape.take === second.take && Math.abs(tape.x - tape.kx) <= 1 && tape.y > tape.ky);
  ok('no TAKE card over the picture', await S(() => !/TAKE/.test(document.querySelector('#card .card-top').textContent) || !document.getElementById('card').classList.contains('on')));
  await shot('feel-tape');

  // ---- the broadcast bar: red ticks where she died, her best, BEST when she passes it
  const r0 = await S(() => { const r = window.__feel.results.of('ep1'); return { ticks: r.ticks.length, best: r.best }; });
  ok(`the bar has a tick for each death this visit (${r0.ticks}) and keeps her best (${r0.best.toFixed(2)})`, r0.ticks === 2 && r0.best > 0.05);
  const strip = await S(() => { const c = document.getElementById('feel'), x = c.getContext('2d'), d = x.getImageData(0, 177, 320, 8).data; let red = 0, bar = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] === 0xe3 && d[i + 1] === 0x41 && d[i + 2] === 0x2b) red++; if (d[i] === 0x45 && d[i + 1] === 0x47 && d[i + 2] === 0x4d) bar++; } return { red, bar }; });
  ok(`red death ticks (${strip.red} px) and a 2 px bar (${strip.bar} px of it still to go) are drawn on the strip`, strip.red >= 6 && strip.bar > 300);
  await S(() => { const s = window.__game.scene, r = window.__feel.results.of('ep1'); s.placeAt(s.level.start.x + (s.level.door.x - s.level.start.x) * Math.min(0.95, r.best + 0.1)); });
  const best = await until(() => window.__feel.results.of('ep1').bestAt > 0, 3000);
  ok('passing her best stamps BEST', !!best);
  await p.waitForTimeout(100); await shot('feel-best');

  // ---- grades
  ok('a clean run is PRIME TIME; many deaths are a RERUN', await S(() => { const g = window.__feel.gradeOf; return g({ id: 'ep1', deaths: 0, time: 40 }) === 'PRIME TIME' && g({ id: 'ep1', deaths: 9, time: 40 }) === 'RERUN' && g({ id: 'ep1', deaths: 1, time: 400 }) === 'LATE NIGHT'; }));
  await p.keyboard.press('KeyI'); await p.waitForTimeout(150);
  ok('story mode stamps REHEARSAL', await S(() => window.__feel.results.collect(window.__game.scene).grade === 'REHEARSAL'));
  await p.keyboard.press('KeyI'); await p.waitForTimeout(150);

  // ---- the report, from a real exit: walk into the grounds' door
  for (let i = 0; i < 6 && !(await S(() => window.__game.scene.leaving)); i++) {
    await S(() => { const s = window.__game.scene, D = s.level.door; if (!s.dead) s.placeAt(D.x + D.w / 2 - 5); });
    await until(() => { const s = window.__game.scene; return s.kid && s.kid.onGround && !s.dead; }, 2000); await p.waitForTimeout(100);
    await p.keyboard.press('KeyW'); await p.waitForTimeout(250);
  }
  const up = await until(() => window.__feel.results.up, 6000);
  const card = await S(() => ({ top: document.querySelector('#card .card-top').textContent, cg: (document.getElementById('card').classList.contains('on')) }));
  ok(`the door ends the episode with the report (${card.top})`, !!up && card.top === 'END OF EPISODE 1');
  const d = await S(() => window.__results);
  ok(`it counts this visit: TAKE ${d.take}, takes this run ${d.takes}, time ${Math.round(d.time)} s, falls ${d.falls}, grade ${d.grade}`, d.take === second.take && d.takes === 3 && d.falls >= 2 && d.time > 1 && ['DAYTIME', 'LATE NIGHT'].includes(d.grade));
  await p.waitForTimeout(500); await shot('feel-report');
  const srText = await S(() => document.getElementById('results').textContent);
  ok('the report reads out: ' + srText, /End of episode 1/.test(srText) && /Takes this run 3/.test(srText) && /operator not required/.test(srText));
  const tKey = Date.now(); await p.keyboard.press('KeyX');
  const went = await until(() => window.__game.scene.sys.settings.key === 'satellite', 3000);
  ok(`any key moves on to the satellite (${Date.now() - tKey} ms)`, !!went && !(await S(() => window.__feel.results.up)));

  // ---- left alone it goes by itself; a presenter's waits for a key
  await S(() => { window.__done = 0; window.__feel.results.show(null, { id: 'ep1', num: 1, title: 'THE GROUNDS', take: 4, takes: 2, deaths: 1, time: 50, falls: 0, clues: 1, gold: null, grade: 'DAYTIME' }, () => { window.__done++; }); });
  const t2 = Date.now(); await until(() => window.__done === 1, 4000);
  ok(`left alone it goes by itself in about 2 s (${Date.now() - t2} ms)`, Date.now() - t2 < 3200 && Date.now() - t2 > 1500);
  await S(() => { window.__presenter = true; window.__done = 0; window.__feel.results.show(null, { id: 'ep1', num: 1, title: 'THE GROUNDS', take: 4, takes: 2, deaths: 1, time: 50, falls: 0, clues: 1, gold: null, grade: 'REHEARSAL' }, () => { window.__done++; }); });
  await p.waitForTimeout(3500);
  const held = await S(() => window.__feel.results.up && window.__done === 0);
  await p.keyboard.press('Digit3'); await p.waitForTimeout(100);
  const digitPassed = await S(() => window.__feel.results.up);
  await p.keyboard.press('Enter'); await until(() => window.__done === 1, 1000);
  ok('a presenter\'s report stays up until a key; chapter digits pass through it', held && digitPassed && await S(() => window.__done === 1));
  await S(() => { window.__presenter = false; });

  // ================================================================ the bedroom: dark, the glasses readout up
  await open('bedroom');
  await p.waitForFunction(() => { const s = window.__game.scene; return s && s.sys.settings.key === 'bedroom' && s.mode === 'house' && s.kid && !s.dead && s.clock > 0.3; }, null, { timeout: 60000 });
  await S(() => window.__game.scene.die({ id: 'camera' })); // her first death: in full
  await p.waitForTimeout(400); await live();
  const bed = await dieAndTime('camera');
  ok(`bedroom: the next take is up ${bed.ms} ms after the body lands (under ${LIVE_MS})`, !bed.faded && bed.ms < LIVE_MS);
  await until(() => { const t = window.__game.scene.__tape; return t && t.g; }, 2000); await p.waitForTimeout(150);
  const bt = await S(() => { const s = window.__game.scene, t = s.__tape, v = s.cameras.main.worldView; return { take: t.take, cx: t.x + t.w / 2 - v.x, kx: s.kid.x + s.kid.w / 2 - v.x, x: t.x - v.x, y: t.y - v.y, w: t.w, h: t.h, over: t.over, depth: t.g.depth, meter: !!(s.gl && s.gl.has) }; });
  await pixels();
  const ink = await countColor({ x: bt.x, y: bt.y, w: bt.w, h: bt.h }, '#b8b2a3');
  ok(`bedroom: TAKE ${bt.take} lies at her feet (${Math.round(bt.cx)} vs ${Math.round(bt.kx)}), in her light, and shows (${ink} px of tape on screen${bt.over ? ', over the readout' : ''})`, Math.abs(bt.cx - bt.kx) <= 16 && ink >= bt.w * bt.h * 0.4);
  await shot('feel-bedroom-tape');
  // once she walks off her mark it goes back under the readout
  if (bt.over) {
    await p.keyboard.down('KeyD'); await p.waitForTimeout(1200); await p.keyboard.up('KeyD');
    ok('walking off her mark puts the tape back on the floor', await S(() => { const t = window.__game.scene.__tape; return !t.over && t.g.depth < 2; }));
  }

  // ================================================================ the east wing (top-down)
  await open('eastwing');
  await p.waitForFunction(() => { const s = window.__game && window.__game.scene; return s && s.sys.settings.key === 'eastwing' && s.kid && !s.dead && s.clock > 0.3; }, null, { timeout: 30000 });
  await S(() => window.__game.scene.die({ id: 'motion sensor' })); // her first death: in full
  await p.waitForTimeout(300); await live();
  const ew = await dieAndTime('motion sensor');
  await until(() => { const t = window.__game.scene.__tape; return t && t.g; }, 2000);
  const ewTape = await S(() => window.__game.scene.__tape.take);
  ok(`east wing: the next take is up ${ew.ms} ms after the body lands (under ${LIVE_MS}); TAKE ${ewTape} on the floor`, !ew.faded && ew.ms < LIVE_MS && ewTape === ew.take);
  // the robot takes HP without hurt(): the same hit-stop
  const bump = await S(() => new Promise(res => { const s = window.__game.scene; let froze = false; s.inv = 0; s.bumpRobot(); const t0 = performance.now(); const f = () => { if (s.__frozen) froze = true; if (performance.now() - t0 > 200) return res({ froze, hp: s.hp }); requestAnimationFrame(f); }; f(); }));
  ok(`east wing: the robot's shock holds the scene too (HP ${bump.hp})`, bump.froze && bump.hp === 2);
  await p.waitForTimeout(300); await shot('feel-eastwing');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
