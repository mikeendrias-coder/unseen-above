// Presenter tools (Nov 18): the switch on the title and what it turns on, the chapters list with
// the endings, the number keys, the freeze (H), the tag in the strip, N with immunity off, a
// refresh going straight back into the part, full screen (U), New game, and the satellite's key
// labels. Screenshots in tests/out/presenter-*.png at 1x.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 30000, polling: 50 });
  let fails = 0;
  const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  const S = (fn, a) => p.evaluate(fn, a);
  const key = () => S(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key);
  const save = () => S(() => JSON.parse(localStorage.getItem('unseen-above-v1') || '{}'));
  await p.addInitScript(() => { window.__noPanels = true; });
  await p.goto(BASE + '/local.html');
  await S(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html');

  // the title: presenter off by default; endings unseen read ----
  ok('presenter starts off; Full screen and Big captions wait for it', await S(() => document.querySelector('#opt-present i').textContent === 'off' && document.getElementById('opt-full').hidden && document.getElementById('opt-caps').hidden));
  await p.click('#opt-chapters');
  const list0 = await S(() => [...document.querySelectorAll('#chapters button')].map(x => x.textContent + (x.disabled ? '(x)' : '')));
  ok('chapters: parts with their number keys, endings closed (' + list0.slice(-7).join(', ') + ')', list0[0] === '0 Opening' && list0[1] === '1 Ep 1 Grounds' && list0.filter(t => t === '----(x)').length === 5 && list0.includes('Give-up mode'));
  await p.keyboard.press('Escape');

  // presenter on, from the title
  await p.click('#opt-present');
  const sv = await save();
  ok('presenter on: immunity, flashing reduced, no shake, music 2 (' + JSON.stringify({ i: sv.immune, f: sv.settings.reduceFlash, s: sv.settings.shake, m: sv.settings.music }) + ')', sv.settings.presenter === true && sv.immune === true && sv.settings.reduceFlash === true && sv.settings.shake === false && sv.settings.music === 2 && sv.settings.sfx === 4);
  ok('the title shows Full screen now; Big captions waits until the strip can draw them', await S(() => !document.getElementById('opt-full').hidden && document.getElementById('opt-caps').hidden)); // until ui/cg.js sets cg.canBigCaptions
  await p.screenshot({ path: 'tests/out/presenter-title.png' });
  await p.click('#opt-chapters');
  const list1 = await S(() => [...document.querySelectorAll('#chapters button.end:not(.back)')].map(x => x.textContent + (x.disabled ? '(x)' : '')));
  ok('presenting, every ending is open (' + list1.join(', ') + ')', list1.length === 6 && !list1.some(t => /\(x\)/.test(t)));
  await p.screenshot({ path: 'tests/out/presenter-chapters.png' });
  await p.keyboard.press('Escape');

  // 1 from the title: episode 1, with its card, and the address follows
  await p.keyboard.press('Digit1');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.clock > 0.3);
  await until(() => /EPISODE 1/.test(document.getElementById('card').textContent) && document.getElementById('card').classList.contains('on'), null, 5000);
  ok('1 on the title opens episode 1 with its card', true);
  await until(() => location.hash === '#grounds', null, 4000);
  ok('the address follows the part (#grounds)', true);
  ok('the PRESENTER tag shows in the strip, the IMMUNE tag does not', await S(() => !document.getElementById('ptag').hidden && document.getElementById('ptag').textContent === 'PRESENTER' && !document.getElementById('immune').classList.contains('on')));
  await p.waitForTimeout(3600);
  await p.screenshot({ path: 'tests/out/presenter-tag.png' });

  // immunity off: N still skips ahead, the tag says she can die
  await p.keyboard.press('KeyI');
  await until(() => !window.__game.state.immune, null, 3000);
  ok('I turns immunity off; the tag says so (' + await S(() => document.getElementById('ptag').textContent) + ')', /CAN DIE/.test(await S(() => document.getElementById('ptag').textContent)));
  const x0 = await S(() => window.__game.scene.kid.x);
  await p.keyboard.press('KeyN'); await p.waitForTimeout(300);
  const x1 = await S(() => window.__game.scene.kid.x);
  ok('N skips ahead with immunity off (' + Math.round(x0) + ' to ' + Math.round(x1) + ')', x1 !== x0);
  await p.keyboard.press('KeyI');
  await until(() => window.__game.state.immune, null, 3000);

  // H holds the picture: no menu, the clock stops, the mark shows; H again goes on
  await p.keyboard.press('KeyH');
  await until(() => window.__frozen === true, null, 3000);
  const c0 = await S(() => window.__game.scene.clock); await p.waitForTimeout(500); const c1 = await S(() => window.__game.scene.clock);
  ok('H freezes: clock ' + c0.toFixed(2) + ' then ' + c1.toFixed(2) + ', no menu, the mark shows', c0 === c1 && await S(() => !window.__paused && !document.getElementById('panel').classList.contains('on') && !document.getElementById('freeze').hidden));
  const xa = await S(() => window.__game.scene.kid.x);
  await p.keyboard.down('KeyD'); await p.waitForTimeout(300); await p.keyboard.up('KeyD');
  ok('keys wait while held', (await S(() => window.__game.scene.kid.x)) === xa);
  const m0 = await S(() => window.__unseen.Sound.muted);
  await p.keyboard.press('KeyM');
  ok('M mutes while held', (await S(() => window.__unseen.Sound.muted)) === !m0 && await S(() => window.__frozen === true));
  await p.keyboard.press('KeyM');
  await p.screenshot({ path: 'tests/out/presenter-freeze.png' });
  await p.keyboard.press('KeyH');
  await until(() => window.__frozen === false, null, 3000);
  const c2 = await S(() => window.__game.scene.clock); await p.waitForTimeout(400); const c3 = await S(() => window.__game.scene.clock);
  ok('H again goes on', c3 > c2 && await S(() => document.getElementById('freeze').hidden));
  // P from a freeze opens the menu; it has the presenter row
  await p.keyboard.press('KeyH'); await until(() => window.__frozen === true, null, 3000);
  await p.keyboard.press('KeyP'); await until(() => window.__paused === true, null, 3000);
  ok('P from a freeze opens the menu, with PRESENTER on', !(await S(() => window.__frozen)) && /presenter: on/.test(await S(() => document.getElementById('panel').innerText)));
  await p.keyboard.press('KeyP'); await until(() => window.__paused === false, null, 3000);

  // number keys jump while playing: 9 backstage (its own card), 3 the gallery
  await p.keyboard.press('Digit9');
  await until(() => window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.2, null, 20000);
  await until(() => /Backstage/.test(document.getElementById('card').textContent), null, 5000);
  ok('9 opens backstage, with a card', true);
  await p.keyboard.press('Digit3');
  await until(() => window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 0.5, null, 20000);
  await until(() => location.hash === '#gallery', null, 4000);
  ok('3 opens episode 2', true);

  // a refresh goes straight back into the part, no title
  await p.reload();
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 0.3, null, 30000);
  ok('a refresh goes straight back to episode 2 (title hidden: ' + await S(() => document.getElementById('tv').hidden) + ')', await S(() => document.getElementById('tv').hidden));
  // and with no address, the saved part
  await p.goto(BASE + '/local.html');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 0.3, null, 30000);
  ok('reopened with no #, the saved part comes back', true);

  // full screen (U): the stage alone, the page around it hidden
  await p.keyboard.press('KeyU');
  let fs = false; try { await until(() => !!document.fullscreenElement, null, 3000); fs = true; } catch (e) { /* refused here */ }
  if (fs) {
    ok('U puts the stage in full screen and hides the page around it', await S(() => document.fullscreenElement.id === 'stage' && document.body.classList.contains('fs')));
    await p.keyboard.press('KeyU');
    await until(() => !document.fullscreenElement, null, 3000);
    ok('U again leaves full screen', await S(() => !document.body.classList.contains('fs')));
  } else ok('full screen refused in this browser; the note says so (' + await S(() => document.getElementById('note').textContent) + ')', /Full screen/.test(await S(() => document.getElementById('note').textContent)));

  // satellite: W A S D say turn
  await p.keyboard.press('Digit2');
  await until(() => window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.clock > 0.3, null, 20000);
  await p.waitForTimeout(400);
  // the keys in KEYS order: A D Space S W
  const labs5 = () => S(() => [...document.querySelectorAll('#keybar .key')].slice(0, 5).map(k => k.querySelector('.lbl').textContent));
  if (await S(() => !!window.__game.scene.form)) {
    const fl = await labs5();
    ok('on the request form W and S say check, A D and Space are blank (' + fl.join(', ') + ')', fl[3] === 'check' && fl[4] === 'check' && !fl[0] && !fl[1] && !fl[2]);
    await S(() => window.__game.scene.form.dismiss()); await p.waitForTimeout(400);
  }
  const labs = await labs5();
  ok('on a satellite screen the keys say turn (' + labs.join(', ') + ')', labs[0] === 'turn' && labs[1] === 'turn');

  // an ending from the title's chapters: the playroom with that reply
  await p.keyboard.press('KeyP'); await until(() => window.__paused === true, null, 3000);
  let guard = 0; while (!/> title screen/.test(await S(() => document.getElementById('panel').innerText)) && guard++ < 14) await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  await until(() => !document.getElementById('tv').hidden, null, 3000);
  await p.click('#opt-chapters');
  await p.click('#chapters button:text("The couch")');
  await until(() => window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.force === 'couch', null, 20000);
  ok('End: the couch opens the playroom with that ending asked for', true);
  await p.waitForTimeout(1300);
  await p.reload();
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.clock > 0.2, null, 30000);
  ok('a refresh keeps the ending picked (' + await S(() => window.__game.scene.force) + ')', (await S(() => window.__game.scene.force)) === 'couch');
  // give-up mode from the chapters, then a refresh: still give-up mode
  await p.keyboard.press('KeyP'); await until(() => window.__paused === true, null, 3000);
  guard = 0; while (!/> title screen/.test(await S(() => document.getElementById('panel').innerText)) && guard++ < 14) await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  await until(() => !document.getElementById('tv').hidden, null, 3000);
  await p.click('#opt-chapters');
  await p.click('#chapters button:text("Give-up mode")');
  await until(() => window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.2, null, 20000);
  await p.waitForTimeout(1300);
  await p.reload();
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.2, null, 30000);
  ok('a refresh keeps give-up mode', await S(() => window.__game.scene.giveUp === true));

  // New game from the title: asks once, then clears; Continue and chapters follow
  await S(() => window.__game.state.reach('ep4'));
  await p.keyboard.press('KeyP'); await until(() => window.__paused === true, null, 3000);
  guard = 0; while (!/> title screen/.test(await S(() => document.getElementById('panel').innerText)) && guard++ < 14) await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  await until(() => !document.getElementById('tv').hidden, null, 3000);
  ok('Continue shows before a new game', await S(() => !document.getElementById('continue').hidden));
  ok('back on the title the address is clean (' + await S(() => location.hash) + ')', await S(() => location.hash === ''));
  await p.reload();
  await p.waitForTimeout(1500);
  ok('a refresh on the title stays on the title', await S(() => !document.getElementById('tv').hidden && !document.getElementById('stage').classList.contains('playing')));
  await p.click('#opt-new');
  ok('New game asks first', await S(() => document.querySelector('#opt-new i').textContent === 'sure?' && !document.getElementById('continue').hidden));
  await p.click('#opt-new');
  const ng = await save();
  ok('the second click clears her run; presenter mode stays', ng.reached === null && Object.keys(ng.story.heard).length === 0 && ng.settings.presenter === true && await S(() => document.getElementById('continue').hidden && /Begin/.test(document.getElementById('start').innerText)));

  // Begin now starts the opening, not the last part shown
  await p.click('#start');
  await until(() => window.__game.scene.sys.settings.key === 'intro', null, 20000);
  ok('after the title and New game, Begin opens the opening', true);
  // a number key with a how-to slip up: the slip closes and the jump goes, one press
  await S(() => { window.__noPanels = false; window.__unseen.itemPanel(window.__game.scene, 'dark', true); });
  await until(() => window.__unseen.cg.pageUp, null, 3000);
  await p.waitForTimeout(700);
  await p.keyboard.press('Digit1');
  await until(() => window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.clock > 0.2, null, 20000);
  ok('one number key closes a slip and jumps', await S(() => !window.__unseen.cg.pageUp));
  await S(() => { window.__noPanels = true; });
  await p.keyboard.press('KeyP'); await until(() => window.__paused === true, null, 3000);
  guard = 0; while (!/> title screen/.test(await S(() => document.getElementById('panel').innerText)) && guard++ < 14) await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  await until(() => !document.getElementById('tv').hidden, null, 3000);

  // presenter off puts the settings back
  await p.click('#opt-present');
  const off = await save();
  ok('presenter off: the old settings come back (' + JSON.stringify({ i: off.immune, f: off.settings.reduceFlash, m: off.settings.music }) + ')', off.settings.presenter === false && off.immune === false && off.settings.music === 5 && off.settings.sfx === 5);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 4).join(' | ') : 'no page errors');
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
