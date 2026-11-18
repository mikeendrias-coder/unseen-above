// The five endings (Nov 17). From the playroom link with a story set up in the save: which replies
// the slip offers, and that each reply (or the empty room) plays its ending through to the old
// TV and the ENDINGS SEEN card.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const WHAT5 = { footprints: true, drawer: true, oldBody: true, bagNote: true, lostGlasses: true };
const WHO5 = { statue07: true, request1: true, cameraMoon: true, laserTone: true, routeMap: true };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 40000, polling: 50 });
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
    await until(() => !!window.__game.scene.endCard, null, 60000);
    return p.evaluate(() => ({ id: window.__game.scene.endingId, card: window.__game.scene.endCard, kind: window.__game.scene.lastKind }));
  };

  ok('no clues: two replies (' + await offered({}) + ')', (await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))) === 'lights,yes');
  ok('spared the creator who gave up: Turn it around (' + await offered({ spared: true, gaveUp: true }) + ')', /turn/.test(await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))));
  ok('five who-aims clues: Turn it around (' + await offered({ clues: WHO5 }) + ')', /turn/.test(await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))));
  ok('spared and five what-she-is clues: the secret Sit down (' + await offered({ spared: true, clues: WHAT5 }) + ')', /sit/.test(await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))));
  ok('five what clues, not spared: no Sit down (' + await offered({ clues: WHAT5 }) + ')', !/sit/.test(await p.evaluate(() => window.__game.scene.choices.map(c => c.id).join(','))));
  ok('story mode offers every reply (' + await offered({}, true) + ')', (await p.evaluate(() => window.__game.scene.choices.length)) === 4);

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
  ok('on the old TV the CH 07 mark goes dark', await p.evaluate(() => window.__game.scene.bugOff === true));
  r = await play({ killedBroken: true, gaveUp: true }, null);
  ok('beaten after giving up: the empty playroom, then ' + JSON.stringify(r), r.id === 'endall' && r.kind === 'rerun' && r.card.title === 'END IT ALL');
  ok('nobody in the room', await p.evaluate(() => window.__game.scene.kidImgs.every(i => !i.visible)));
  // the count carries across endings in one save
  await p.evaluate(() => { const st = window.__game.state; ['vest', 'round2'].forEach(e => st.sawEnding(e)); });
  ok('ENDINGS SEEN counts every ending this browser has seen: ' + await p.evaluate(() => Object.keys(window.__game.state.story.endings).join(',')), (await p.evaluate(() => Object.keys(window.__game.state.story.endings).length)) === 3);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
