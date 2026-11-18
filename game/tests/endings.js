// The five endings (Nov 17). From the playroom link with a story set up in the save: which replies
// the slip offers, and that each reply (or the empty room) plays its ending through to the old
// TV, recorded as seen; then (Nov 18) each final beat, the ending screen, the channels and its buttons.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const WHAT5 = { footprints: true, drawer: true, oldBody: true, bagNote: true, lostGlasses: true };
const WHO5 = { statue07: true, request1: true, cameraMoon: true, laserTone: true, routeMap: true };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: Math.max(ms || 0, 90000), polling: 50 }); // generous: the box is often busy
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const open = async (story, immune) => {
    await p.goto('about:blank');
    await p.addInitScript(([st, im]) => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true, immune: im, story: st })); } catch (e) {} }, [story, !!immune]);
    await p.goto(BASE + '/local.html#playroom'); await p.click('#start');
    await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.mode === 'room');
    await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.level.stand; });
  };
  const offered = async (story, immune) => { await open(story, immune); await until(() => window.__game.scene.mode === 'choose'); return p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(',')); };
  const play = async (story, reply, extra) => {
    await open(story);
    if (reply) { await until(() => window.__game.scene.mode === 'choose'); await p.evaluate(r => { const s = window.__game.scene; s.pick = s.choices.findIndex(c => c.id === r); s.choose(); }, reply); }
    if (extra) await extra();
    await until(() => !!window.__game.scene.ended, null, 60000);
    return p.evaluate(() => ({ id: window.__game.scene.endingId, card: window.__game.scene.ended, kind: window.__game.scene.lastKind, seen: !!window.__game.state.story.endings[window.__game.scene.endingId] }));
  };

  ok('no clues: two replies (' + await offered({}) + ')', (await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))) === 'lights,yes');
  ok('spared the creator who gave up: Turn it around (' + await offered({ spared: true, gaveUp: true }) + ')', /turn/.test(await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))));
  ok('five who-aims clues: Turn it around (' + await offered({ clues: WHO5 }) + ')', /turn/.test(await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))));
  ok('spared and five what-she-is clues: the secret Sit down (' + await offered({ spared: true, clues: WHAT5 }) + ')', /sit/.test(await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))));
  ok('five what clues, not spared: no Sit down (' + await offered({ clues: WHAT5 }) + ')', !/sit/.test(await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))));
  ok('story mode opens Turn it around but keeps the secret (' + await offered({}, true) + ')', (await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))) === 'lights,yes,turn');
  // a presenter's link asks for an ending: its reply is offered and picked, the save is untouched
  await p.goto('about:blank');
  await p.goto(BASE + '/local.html?end=couch#playroom'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.mode === 'room');
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.level.stand; });
  await until(() => window.__game.scene.mode === 'choose');
  ok('?end=couch#playroom offers Sit down, picked, link used up', await p.evaluate(() => { const s = window.__game.scene; return s.choices[s.pick].id === 'sit' && !/end=/.test(location.search) && !window.__game.state.story.spared; }));

  let r = await play({}, 'lights'); ok('Who picks the lights?: ' + JSON.stringify(r), r.id === 'vest' && r.kind === 'moon' && r.card.title === 'THE VEST');
  r = await play({}, 'yes', async () => { await until(() => window.__game.scene.mode === 'r2'); });
  ok('Yes.: she takes the controller, then ' + JSON.stringify(r), r.id === 'round2' && r.kind === 'ridge' && r.card.title === 'ROUND TWO');
  r = await play({ spared: true, gaveUp: true }, 'turn', async () => {
    await until(() => window.__game.scene.mode === 'look');
    await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.cam.x - 4; });
    await until(() => window.__game.scene.nearThing === window.__game.scene.camThing, null, 5000);
    await p.keyboard.press('KeyJ');
    await until(() => window.__game.scene.cam.turned, null, 5000);
  });
  ok('Turn it around: J turns their camera, then ' + JSON.stringify(r), r.id === 'lookback' && r.kind === 'playroom');
  r = await play({ spared: true, clues: WHAT5 }, 'sit', async () => { await until(() => window.__game.scene.sitting); });
  ok('Sit down.: she sits between them, then ' + JSON.stringify(r), r.id === 'couch' && r.kind === 'couch');
  await until(() => window.__game.scene.lastT > 5.5).catch(() => {});
  ok('on the old TV the CH 07 mark goes dark', await p.evaluate(() => window.__game.scene.bugOff === true));
  // played again in the same sitting (the Jump to link reuses the scene): nothing left over
  await p.evaluate(() => { location.hash = 'moon'; }); await until(() => window.__game.scene.mode === 'walk', null, 15000);
  await p.evaluate(() => { location.hash = 'playroom'; }); await until(() => window.__game.scene.mode === 'room', null, 15000);
  ok('replayed: the girl shows, no card, no ending yet', await p.evaluate(() => { const s = window.__game.scene; return s.girl.visible && !s.sitting && !s.ended && s.endingId == null && !s.bugOff; }));
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.level.stand; });
  await until(() => window.__game.scene.mode === 'choose' && window.__game.scene.chooseT > 0.5);
  const at = await p.evaluate(() => { const s = window.__game.scene, R = s.slipRows, c = s.game.canvas.getBoundingClientRect(); const i = s.choices.findIndex(q => q.id === 'lights'); return { x: c.left + (R.x + 20) * c.width / s.game.canvas.width * window.__unseen.display.S, y: c.top + (R.y + R.h * i + 4) * c.height / s.game.canvas.height * window.__unseen.display.S }; });
  await p.mouse.click(at.x, at.y);
  await until(() => window.__game.scene.mode !== 'choose', null, 3000).catch(() => {});
  ok('the mouse still answers the slip', await p.evaluate(() => window.__game.scene.mode !== 'choose' && window.__game.state.story.choice === 'lights'));
  await until(() => !!window.__game.scene.ended, null, 60000);
  ok('the second ending is recorded on its own: ' + JSON.stringify(await p.evaluate(() => window.__game.scene.ended)), await p.evaluate(() => window.__game.scene.ended.title === 'THE VEST'));
  r = await play({ killedBroken: true, gaveUp: true }, null);
  ok('beaten after giving up: the empty playroom, then ' + JSON.stringify(r), r.id === 'endall' && r.kind === 'rerun' && r.card.title === 'END IT ALL');
  ok('nobody in the room', await p.evaluate(() => window.__game.scene.kidImgs.every(i => !i.visible)));
  // the count carries across endings in one save
  await p.evaluate(() => { const st = window.__game.state; ['vest', 'round2'].forEach(e => st.sawEnding(e)); });
  ok('the save counts every ending this browser has seen: ' + await p.evaluate(() => Object.keys(window.__game.state.story.endings).join(',')), (await p.evaluate(() => Object.keys(window.__game.state.story.endings).length)) === 3);
  // a new game from the link: the story is gone, story mode and settings stay
  await p.evaluate(() => { window.__game.state.immune = true; location.hash = 'newgame'; });
  await p.waitForTimeout(800);
  ok('#newgame clears the story, keeps story mode', await p.evaluate(() => { const st = window.__unseen.state; return Object.keys(st.story.endings).length === 0 && !st.story.killedBroken && st.immune === true && location.hash === ''; }));
  // Nov 18 (Michael: "nothing to skip or is happening, no ending screen"): every ending plays a
  // final beat that moves, Enter or a click skips it, then the ending screen; the TV flips channels
  const spot = (px, py) => p.evaluate(([x, y]) => { const c = window.__game.scene.game.canvas.getBoundingClientRect(), S = window.__unseen.display.S, k = c.width / window.__game.scene.game.canvas.width; return { x: c.left + x * k * S, y: c.top + y * k * S }; }, [px, py]);
  const KINDS = [['moon', 'vest'], ['rerun', 'endall'], ['ridge', 'round2'], ['playroom', 'lookback'], ['couch', 'couch']];
  await open({});
  for (const [kind, id] of KINDS) {
    await p.evaluate(([k, i]) => window.__game.scene.showLast(k, i), [kind, id]);
    const len = await p.evaluate(() => window.__finale.beat.end);
    await until(() => window.__finale.t > 4);
    const a = await p.evaluate(() => window.__game.scene.tvCanvas.toDataURL());
    await until(() => window.__finale.t > 6.5);
    const moved = a !== await p.evaluate(() => window.__game.scene.tvCanvas.toDataURL());
    const skipBy = kind === 'moon' ? 'Enter' : 'click';
    if (skipBy === 'Enter') await p.keyboard.press('Enter'); else { const q = await spot(150, 60); await p.mouse.click(q.x, q.y); }
    await until(() => window.__finale.phase === 'card', null, 5000);
    ok(id + ': a ' + len + ' s final beat that moves, skipped with ' + skipBy, len >= 15 && len <= 40 && moved);
  }
  ok('the ending screen counts every ending found: ' + await p.evaluate(() => Object.keys(window.__game.state.story.endings).join(',')), await p.evaluate(() => Object.keys(window.__game.state.story.endings).length === 5));
  // TV AGAIN: A and D or the knobs flip about five channels; Enter goes back to the form
  await until(() => window.__finale.cardT > 0.5, null, 5000);
  await p.keyboard.press('Enter');
  await until(() => window.__finale.phase === 'tv', null, 3000);
  const names = [];
  for (let i = 0; i < 6; i++) { names.push(await p.evaluate(() => { const c = window.__finale.channel; return 'CH ' + c.n + (c.name ? ' ' + c.name : ''); })); await p.keyboard.press('KeyD'); await p.waitForTimeout(120); }
  ok('TV AGAIN: D flips through ' + names.join(', '), new Set(names).size === 6 && await p.evaluate(() => window.__finale.ch === 0));
  const knob = await spot(239, 112); await p.mouse.click(knob.x, knob.y); await p.waitForTimeout(120);
  ok('a click on the bottom knob turns the channel down: ' + await p.evaluate(() => window.__finale.channel.n), await p.evaluate(() => window.__finale.channel.n === 44));
  await p.keyboard.press('Enter'); await until(() => window.__finale.phase === 'card', null, 3000);
  ok('Enter goes back to the ending screen', true);
  // the climax takes the set back: flip away during LOOK BACK, the show brings channel 7 back
  await open({});
  await p.evaluate(() => window.__game.scene.showLast('playroom', 'lookback'));
  await until(() => window.__finale.t > 5); await p.keyboard.press('KeyA');
  ok('during the beat A flips away: ' + await p.evaluate(() => window.__finale.channel.n), await p.evaluate(() => window.__finale.ch !== 0));
  await until(() => window.__finale.t > window.__finale.beat.climax + 0.2, null, 40000);
  ok('at the climax the show takes the set back to channel 7', await p.evaluate(() => window.__finale.ch === 0));
  // after the climax a flip stays where it lands (the first press used to snap back to CH 07)
  await p.keyboard.press('KeyD'); await p.waitForTimeout(500);
  ok('after the climax D stays on ' + await p.evaluate(() => window.__finale.channel.n), await p.evaluate(() => window.__finale.channel.n === 12 && window.__finale.phase === 'beat'));
  // a miss on the set's side panel (round the knobs) does not skip the beat; N does, in any mode
  const side = await spot(262, 150); await p.mouse.click(side.x, side.y); await p.waitForTimeout(150);
  ok('a click on the set beside the knobs leaves the beat running', await p.evaluate(() => window.__finale.phase === 'beat'));
  ok('the key strip offers N while the beat plays', await p.evaluate(() => window.__game.scene.offerSkip === true));
  await until(() => window.__finale.phase === 'card', null, 30000);
  ok('left alone, the beat runs out into the ending screen', true);
  // CHAPTERS: the title screen, its chapter list open
  await until(() => window.__finale.cardT > 0.5, null, 5000);
  await p.keyboard.press('KeyD'); await p.keyboard.press('Enter');
  await until(() => { const tv = document.getElementById('tv'), l = document.getElementById('chapters'); return tv && !tv.hidden && l && !l.hidden; }, null, 8000);
  ok('CHAPTERS opens the title screen with the chapter list', true);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
