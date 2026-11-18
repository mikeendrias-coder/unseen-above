// Pokemon-style typing (ui/typer.js, Nov 18): captions type out letter by letter; one press
// finishes a line, the next press moves on; a held key types fast; Space still jumps while a
// caption types; a line is heard only once fully shown, so a retry does not replay it but a line
// cut short plays again; speech bubbles type the same way; the playroom talk types and moves on
// with Space; a run from the title forgets the lines heard and the notices seen, Continue keeps them.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 30000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const S = (fn, arg) => p.evaluate(fn, arg);
  const LONG = 'A line long enough to watch it type out, one letter at a time, slowly.';
  await p.addInitScript(() => { window.__noPanels = true; });
  await p.goto(BASE + '/local.html');
  await S(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#grounds'); await p.reload();
  await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.clock > 0.6);
  await p.waitForTimeout(300);

  // a blocking line (she cannot move): it types, a press finishes it, the next press moves on
  await S(t => { window.__adv = 0; window.__unseen.overlay.caption('SISTER', t, { block: true, onAdvance: () => { window.__adv++; } }); }, LONG);
  await p.waitForTimeout(250);
  const mid = await S(() => { const l = window.__unseen.overlay.line; return { n: l.n, len: l.len, start: l.start, shown: l.shown }; });
  ok('types out: ' + mid.n + ' of ' + mid.len + ' letters after 0.25 s, the name whole from the start', !mid.shown && mid.n > mid.start + 3 && mid.n < mid.len - 10 && mid.start === 'SISTER:'.length);
  const cc = await S(() => document.getElementById('cc').textContent);
  ok('the screen reader gets the whole line at once', cc === 'SISTER: ' + LONG);
  await p.keyboard.press('Enter'); // (J would also look at whatever she stands at: blocking scenes never let her)
  const fin = await S(() => { const l = window.__unseen.overlay.line; return { shown: l.shown, adv: window.__adv }; });
  ok('one press finishes the line at once (and does not move on)', fin.shown && fin.adv === 0);
  await p.keyboard.press('Enter');
  ok('a second press at once is held back by the guard', await S(() => window.__adv === 0));
  await p.waitForTimeout(200);
  await p.keyboard.press('Enter');
  ok('the next press moves on', await S(() => window.__adv === 1));

  // the arrow and the read: a line types and is out in about a second
  await S(t => { window.__unseen.overlay.caption(null, t, { block: true, onAdvance: () => {} }); }, 'Short line. With a stop, and a comma.');
  await until(() => window.__unseen.overlay.line.shown, null, 3000);
  const took = await S(() => window.__unseen.overlay.line.age);
  ok('a 36 letter line types in ' + Math.round(took) + ' ms (18 ms a letter plus pauses)', took > 500 && took < 1400);
  await p.waitForTimeout(200);
  ok('the end arrow blinks on once it is out', await S(() => window.__unseen.overlay.line.arrow()));

  // a sound shows whole, no typing
  await S(() => window.__unseen.overlay.sfx('[GLASS CRACKS]', 1500));
  ok('a [SOUND] caption shows whole at once', await S(() => window.__unseen.overlay.line.shown));

  // holding a text key types fast
  await p.keyboard.down('Enter');
  await S(t => { window.__unseen.overlay.caption('SISTER', t, { block: true, onAdvance: () => {} }); }, LONG);
  await p.waitForTimeout(250);
  const fast = await S(() => { const l = window.__unseen.overlay.line; return { n: l.n, shown: l.shown }; });
  await p.keyboard.up('Enter');
  ok('a held key fast-forwards (' + fast.n + ' letters in 0.25 s, against about ' + mid.n + ')', fast.shown || fast.n > mid.n * 2);

  // a free line (she can move): Space is still her jump, the line keeps typing
  await S(() => { const k = window.__game.scene.kid; return k.onGround; }).then(g => ok('she stands on the ground', g));
  await S(t => { window.__adv = 0; window.__unseen.overlay.caption('BROTHER', t, { onAdvance: () => { window.__adv++; } }); }, LONG);
  await p.waitForTimeout(150);
  await p.keyboard.down('Space'); await p.waitForTimeout(120); await p.keyboard.up('Space');
  const jump = await S(() => { const k = window.__game.scene.kid, l = window.__unseen.overlay.line; return { up: !k.onGround || k.vy < 0, shown: l.shown, adv: window.__adv }; });
  ok('Space jumps during a caption and leaves the caption alone', jump.up && !jump.shown && jump.adv === 0);
  await p.waitForTimeout(400);
  await p.keyboard.press('Enter');
  ok('Enter finishes a free caption', await S(() => window.__unseen.overlay.line.shown && window.__adv === 0));
  await p.waitForTimeout(200);
  // a click on the caption strip moves it on
  const strip = await S(() => { const r = document.getElementById('cg').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 195 / 210 }; });
  await p.mouse.click(strip.x, strip.y);
  ok('a click on the caption strip moves it on', await S(() => window.__adv === 1));
  // a line that runs itself (the fight) takes no presses
  await S(t => { window.__unseen.overlay.caption('CREATOR', t, { noSkip: true, onAdvance: () => { window.__adv++; } }); }, LONG);
  await p.waitForTimeout(150); await p.keyboard.press('Enter');
  ok('a fight line runs itself: Enter does nothing', await S(() => !window.__unseen.overlay.line.shown && window.__adv === 1));

  // the no-repeat rule: heard only once fully shown
  const cut = await S(() => { const o = window.__unseen.overlay, st = window.__unseen.state; const l = o.caption('SISTER', 'Said once and never again, on any retry.', { once: 'typer:test' }); return { typed: !!l && !l.shown, heard: st.heard('typer:test') }; });
  ok('a keyed line is not heard while it types', cut.typed && !cut.heard);
  const retry = async () => { await S(() => { window.__old = window.__game.scene.kid; }); await p.keyboard.press('Backspace'); await until(() => window.__game.scene.kid !== window.__old && window.__game.scene.clock > 0.5); await p.waitForTimeout(200); };
  await retry(); // a retry cuts it short
  ok('cut short by a retry, it is still unheard', await S(() => !window.__unseen.state.heard('typer:test')));
  await S(() => { window.__l = window.__unseen.overlay.caption('SISTER', 'Said once and never again, on any retry.', { once: 'typer:test' }); });
  ok('so the retry says it again', await S(() => !!window.__l));
  await until(() => window.__l.shown, null, 3000);
  ok('fully shown, it is heard', await S(() => window.__unseen.state.heard('typer:test')));
  await retry();
  ok('the next retry does not replay it', await S(() => window.__unseen.overlay.caption('SISTER', 'Said once and never again, on any retry.', { once: 'typer:test' }) === false));

  // speech bubbles type with the same core; J on a talker finishes, then the next line
  const bub = await S(() => {
    const sc = window.__game.scene, k = sc.kid, src = { lines: ['First line from the talker here.', 'Second line.'] };
    window.__src = src;
    sc.bubbles.press('tt', src, () => ({ x: k.x + 30, y: k.y - 4 }), { leave: 0 });
    return sc.bubbles.list.get('tt').line.shown;
  });
  await p.waitForTimeout(250);
  const bubMid = await S(() => { const b = window.__game.scene.bubbles.list.get('tt'); return { n: b.line.n, len: b.line.len }; });
  ok('a speech bubble types (' + bubMid.n + ' of ' + bubMid.len + ' after 0.25 s)', !bub && bubMid.n > 2 && bubMid.n < bubMid.len);
  const r1 = await S(() => { const sc = window.__game.scene, k = sc.kid; return sc.bubbles.press('tt', window.__src, () => ({ x: k.x + 30, y: k.y - 4 }), { leave: 0 }); });
  await p.waitForTimeout(200);
  const r2 = await S(() => { const sc = window.__game.scene, k = sc.kid; return sc.bubbles.press('tt', window.__src, () => ({ x: k.x + 30, y: k.y - 4 }), { leave: 0 }) + ':' + window.__src.i; });
  ok('J on a talker: ' + r1 + ', then ' + r2, r1 === 'finished' && r2 === 'line:2');

  // the playroom: a real blocking talk, typed, moved on with Space
  await p.goto(BASE + '/local.html#playroom'); await p.click('#start').catch(() => {});
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.mode === 'room', null, 20000);
  await p.keyboard.down('ArrowRight'); await until(() => window.__game.scene.mode === 'talk', null, 10000); await p.keyboard.up('ArrowRight');
  await until(() => { const l = window.__unseen.overlay.line; return l && !l.sound && l.n > l.start; }, null, 6000);
  const talk = await S(() => { const l = window.__unseen.overlay.line; return { i: window.__game.scene.talkI, block: l.block, shown: l.shown }; });
  ok('the playroom talk types a blocking line (line ' + talk.i + ')', talk.block && !talk.shown);
  await p.keyboard.press('Space');
  ok('Space finishes it', await S(() => window.__unseen.overlay.line.shown));
  await p.waitForTimeout(200);
  await p.keyboard.press('Space');
  ok('Space again moves to the next line', await S(i => window.__game.scene.talkI === i + 1 || window.__game.scene.mode !== 'talk', talk.i));

  // the rehearsal trap: a run from the title forgets lines heard and notices seen
  const SAVE = JSON.stringify({ reached: 'ep2', panels: { glasses: true }, story: { heard: { 'typer:old': true } } });
  const title = async () => { await p.goto('about:blank'); await p.goto(BASE + '/local.html'); await S(s => localStorage.setItem('unseen-above-v1', s), SAVE); await p.reload(); };
  await title();
  ok('a saved place shows Continue', await S(() => !document.getElementById('continue').hidden));
  await p.click('#continue');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery', null, 20000);
  ok('Continue keeps the lines heard and the notices seen', await S(() => window.__unseen.state.heard('typer:old') && window.__unseen.state.seenPanel('glasses')));
  await title();
  await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'intro', null, 20000);
  ok('From the start forgets them (the class run is not silent)', await S(() => !window.__unseen.state.heard('typer:old') && !window.__unseen.state.seenPanel('glasses') && Object.keys(JSON.parse(localStorage.getItem('unseen-above-v1')).story.heard).length === 0));
  await title();
  await p.click('#opt-chapters'); await p.click('#chapters button:not(.back)');
  await until(() => window.__game && window.__game.scene, null, 20000);
  ok('a chapter pick forgets them too', await S(() => !window.__unseen.state.heard('typer:old') && !window.__unseen.state.seenPanel('glasses')));

  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})();
