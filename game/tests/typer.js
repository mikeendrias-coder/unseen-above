// Pokemon-style typing (ui/typer.js, Nov 18): captions type out letter by letter; one press
// finishes a line, the next press moves on; a held key types fast; Space still jumps while a
// caption types; a line is heard only once fully shown, so a retry does not replay it but a line
// cut short plays again; speech bubbles type the same way; the playroom talk types and moves on
// with Space; a run from the title forgets the lines heard and the notices seen, Continue keeps them.
// Fix pass: the real no-repeat lines (the Gallery robot cut short by walking away, a Hallway retry
// line), blocking talks that wait for a press (the playroom, the Hallway train) with the cue on
// the hint line, P freezing the line clock, Enter never reaching a bubble across the room, and
// the rehearsal reset surviving a reload.
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
  // blocking lines wait for a press, as for a person at the keys (scripted runs otherwise keep the
  // old read timer, ui/typer.js)
  await p.addInitScript(() => { window.__noPanels = true; window.__textPatient = true; });
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

  // P freezes the line clock with everything else
  await S(t => { window.__unseen.overlay.caption('SISTER', t, { block: true, onAdvance: () => {} }); }, LONG);
  await p.waitForTimeout(120); await p.keyboard.press('KeyP'); await p.waitForTimeout(100);
  const p0 = await S(() => window.__unseen.overlay.line.n); await p.waitForTimeout(400);
  const p1 = await S(() => window.__unseen.overlay.line.n);
  await p.keyboard.press('KeyP'); await p.waitForTimeout(300);
  const p2 = await S(() => window.__unseen.overlay.line.n);
  ok('P stops the typing (' + p0 + ' then ' + p1 + ' letters) and it goes on after (' + p2 + ')', p0 === p1 && p2 > p1);
  await S(() => window.__unseen.overlay.clearCaption());

  // Enter: a caption on the strip takes it (never a bubble behind it); with the strip empty, only
  // a bubble near her
  const far = await S(() => {
    const sc = window.__game.scene, k = sc.kid;
    sc.bubbles.say('far', 'A voice across the room, typing out slowly here.', () => ({ x: k.x + 200, y: k.y - 4 }), { leave: 0 });
    return sc.bubbles.list.get('far').line.shown;
  });
  await p.waitForTimeout(100); await p.keyboard.press('Enter');
  ok('Enter leaves a bubble across the room alone', !far && await S(() => { const b = window.__game.scene.bubbles.list.get('far'); return !!b && !b.line.shown; }));
  await S(() => { window.__game.scene.bubbles.clear('far'); window.__unseen.overlay.caption(null, '[A DOOR CLOSES]', { ms: 4000 }); const sc = window.__game.scene, k = sc.kid; sc.bubbles.say('near', 'Right beside her, a line that types.', () => ({ x: k.x + 20, y: k.y - 4 }), { leave: 0 }); });
  await p.waitForTimeout(150); await p.keyboard.press('Enter');
  ok('Enter on a caption that is out does not fall through to a bubble', await S(() => !window.__game.scene.bubbles.list.get('near').line.shown));
  await S(() => window.__unseen.overlay.clearCaption()); await p.waitForTimeout(50); await p.keyboard.press('Enter');
  ok('with the strip empty, Enter finishes the bubble near her', await S(() => window.__game.scene.bubbles.list.get('near').line.shown));
  await S(() => window.__game.scene.bubbles.clear('near'));

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
  await until(() => { const l = window.__unseen.overlay.line; return l && !l.sound && l.n > l.start && l.age > 150 && !l.shown; }, null, 6000); // past the new-line guard
  const talk = await S(() => { const l = window.__unseen.overlay.line; return { i: window.__game.scene.talkI, block: l.block, shown: l.shown }; });
  ok('the playroom talk types a blocking line (line ' + talk.i + ')', talk.block && !talk.shown);
  await p.keyboard.press('Space');
  ok('Space finishes it', await S(() => window.__unseen.overlay.line.shown));
  await p.waitForTimeout(200);
  await p.keyboard.press('Space');
  ok('Space again moves to the next line', await S(i => window.__game.scene.talkI === i + 1 || window.__game.scene.mode !== 'talk', talk.i));
  const held0 = await S(() => window.__game.scene.talkI);
  ok('the hint line says how: "' + await S(() => document.getElementById('h-hint').textContent) + '"', await S(() => /Space, J or Enter/.test(document.getElementById('h-hint').textContent)));
  await p.waitForTimeout(6000);
  ok('left alone for 6 s, the talk waits on its line', await S(i => window.__game.scene.mode === 'talk' && window.__game.scene.talkI === i && window.__unseen.overlay.line.shown, held0));

  // the Hallway train into the fight: speaker lines wait for a press, Space moves them on (she is
  // held, so she never hops); the cue goes when the sword clatters and she is free
  await p.goto(BASE + '/local.html#hallway'); await p.click('#start').catch(() => {});
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.5, null, 20000);
  await S(() => { const s = window.__game.scene; s.kid.x = 20 * 16 + 14; });
  await until(() => window.__game.scene.mode === 'toss' && window.__unseen.overlay.line && window.__unseen.overlay.line.shown, null, 8000);
  const tr0 = await S(() => window.__game.scene.queue.length); await p.waitForTimeout(4000);
  ok('the train holds its line with no press', await S(n => window.__game.scene.queue.length === n && window.__unseen.overlay.line.block, tr0));
  let hops = 0, steps = 0;
  for (let i = 0; i < 40 && await S(() => !window.__game.scene.sword.floor); i++) {
    await p.keyboard.press('Space'); await p.waitForTimeout(170); steps++;
    if (await S(() => { const s = window.__game.scene; return !s.sword.floor && !s.kid.onGround; })) hops++;
  }
  ok('Space walks the train to the sword (' + steps + ' presses) and she never hops while held', await S(() => !!window.__game.scene.sword.floor) && hops === 0);
  await p.waitForTimeout(200);
  ok('once she is free the cue is gone', await S(() => !/Space, J or Enter/.test(document.getElementById('h-hint').textContent)));
  // a retry line (HALL_AGAIN) is heard only once it is out: a death while it types says it again
  await S(() => { const st = window.__unseen.state; ['HALL_AGAIN0', 'HALL_AGAIN1'].forEach(k => delete st.story.heard[k]); st.storySet('heard', st.story.heard); });
  await S(() => { const s = window.__game.scene; s.lineT = 0; s.startToss(true); });
  ok('a retry line types and is not heard yet', await S(() => !window.__unseen.overlay.line.shown && !window.__unseen.state.heard('HALL_AGAIN0')));
  await until(() => window.__unseen.overlay.line.shown, null, 4000);
  ok('once out, it is heard', await S(() => window.__unseen.state.heard('HALL_AGAIN0')));

  // the Gallery robot: a line cut short by walking away is said again on the retry
  await p.goto(BASE + '/local.html#gallery'); await p.click('#start').catch(() => {});
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 0.5, null, 20000);
  await S(() => { const st = window.__unseen.state; Object.keys(st.story.heard).filter(k => /^ep2:robot/.test(k)).forEach(k => delete st.story.heard[k]); st.storySet('heard', st.story.heard); });
  const talk1 = async () => S(() => { const s = window.__game.scene; s.kid.x = s.robot.x - 12; s.robotTalk(); const b = s.bubbles.list.get('robot'); return b ? b.lines.join(' ') : ''; });
  const w1 = await talk1();
  ok('the robot talks: "' + w1 + '", not heard while it types', !!w1 && await S(() => !window.__unseen.state.heard('ep2:robot:b0')));
  await p.waitForTimeout(100); await S(() => { const s = window.__game.scene; s.kid.x = s.robot.x - 160; });
  await p.waitForTimeout(400);
  ok('walking away closes it unheard', await S(() => !window.__game.scene.bubbles.busy('robot') && !window.__unseen.state.heard('ep2:robot:b0')));
  await S(() => { window.__old = window.__game.scene.kid; }); await p.keyboard.press('Backspace');
  await until(() => window.__game.scene.kid !== window.__old && window.__game.scene.clock > 0.5, null, 10000);
  const w2 = await talk1();
  ok('after the retry it says the same line again', w2 === w1);
  await until(() => window.__game.scene.bubbles.list.get('robot').line.shown, null, 4000);
  ok('once out, it is heard', await S(() => window.__unseen.state.heard('ep2:robot:b0')));

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
  await p.reload();
  ok('and a reload keeps them forgotten (saved, not just in memory)', await S(() => { const m = JSON.parse(localStorage.getItem('unseen-above-v1')); return !m.panels.glasses && !m.story.heard['typer:old']; }));
  await title();
  await p.click('#opt-chapters'); await p.click('#chapters button:not(.back)');
  await until(() => window.__game && window.__game.scene, null, 20000);
  ok('a chapter pick forgets them too', await S(() => !window.__unseen.state.heard('typer:old') && !window.__unseen.state.seenPanel('glasses')));

  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})();
