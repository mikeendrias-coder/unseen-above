// B, N's opposite (Nov 18, Michael: "add a back button opposite of N to skip backwards"): in the
// grounds B goes to the skip point behind her, and from the first point to the opening; on a
// satellite screen to the puzzle before (the ring, then the request form), then to the episode
// before; in the bedroom talk this line again, the line before, then the bedroom door; from his
// death his last line. Nothing counts: no take, no body, no death. The B key cap is grey in NORMAL
// (where N is grey) and lit in IMMUNE, and grey at the very start of the opening.
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
  const capOff = c => S(c => { const k = [...document.querySelectorAll('#keybar .key')].find(x => x.querySelector('.cap').textContent === c); return k ? k.classList.contains('off') : null; }, c);
  const sync = () => S(() => window.__keys && window.__keys.sync());
  const tally = () => S(() => { const s = window.__game.scene, st = window.__unseen.state; return { take: s.ep && s.ep.take, bodies: st.bodyCount(), died: s.epId ? st.diedHere(s.epId) : 0, left: s.takesLeft }; });
  const same = (a, c) => a.take === c.take && a.bodies === c.bodies && a.died === c.died && a.left === c.left;
  const kx = () => S(() => Math.round(window.__game.scene.kid.x));
  const press = async (k, ms) => { await p.keyboard.press(k); await p.waitForTimeout(ms || 300); };
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });

  // ---- the grounds, NORMAL: B is grey like N, and does nothing
  await p.goto(BASE + '/local.html#grounds'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.kid && window.__game.scene.clock > 0.6);
  await sync();
  ok('NORMAL: the B key cap is grey, like N', (await capOff('B')) === true && (await capOff('N')) === true);
  ok('the B cap says "back"', await S(() => [...document.querySelectorAll('#keybar .key')].some(x => x.querySelector('.cap').textContent === 'B' && x.querySelector('.lbl').textContent === 'back')));
  const x0 = await kx(); await press('KeyB');
  ok('NORMAL: B does nothing', (await key()) === 'grounds' && (await kx()) === x0);

  // ---- IMMUNE: B is lit; N forward three points, B back one
  await press('KeyI', 150); await press('KeyI', 150);
  await until(() => window.__game.state.mode === 'immune', null, 3000);
  await sync();
  ok('IMMUNE: the B key cap is lit', (await capOff('B')) === false);
  const t0 = await tally();
  const pts = await S(() => window.__game.scene.level.skip.map(([x]) => Math.round(x * 16)));
  const xs = []; for (let i = 0; i < 3; i++) { await press('KeyN'); xs.push(await kx()); }
  await press('KeyB'); const xb = await kx();
  ok(`B in the grounds goes to the previous skip point (N to ${xs.join(', ')}, B to ${xb})`, xb === xs[1] && pts.includes(xb));
  ok('B gives N\'s safe beat (she blinks, nothing locks on)', await S(() => { const s = window.__game.scene; return s.safeT > 0 && s.kid.inv > 0; }));
  await press('KeyB'); ok('B again: the point before that', (await kx()) === xs[0]);
  ok('nothing counted: no take, body, death or life', same(t0, await tally()));
  // at the first point: the opening, from its start
  await press('KeyB', 600);
  await until(() => window.__game.scene.sys.settings.key === 'intro', null, 6000).catch(() => {});
  ok('B at the first point goes to the opening chapter', (await key()) === 'intro' && await S(() => window.__game.scene.t < 3));
  ok('the address follows: #opening', await S(() => location.hash === '#opening'));
  // the opening: a line again, the line before; at its very start nothing (the cap greys)
  await S(() => { const s = window.__game.scene; s.t = s.T.lines[2].start + 2; });
  await p.waitForTimeout(100); await press('KeyB', 100);
  const tl = await S(() => { const s = window.__game.scene; return { t: s.t, l2: s.T.lines[2].start, l1: s.T.lines[1].start }; });
  ok(`opening: B two seconds into a line plays it again (t ${tl.t.toFixed(2)}, line at ${tl.l2.toFixed(2)})`, tl.t >= tl.l2 && tl.t < tl.l2 + 0.6);
  await press('KeyB', 100);
  const tl2 = await S(() => window.__game.scene.t);
  ok(`opening: B again at its start: the line before (t ${tl2.toFixed(2)}, line at ${tl.l1.toFixed(2)})`, tl2 >= tl.l1 && tl2 < tl.l1 + 0.6);
  await S(() => { window.__game.scene.t = 0.3; }); await p.waitForTimeout(80); await sync();
  ok('opening start: the B cap greys (nothing before the first part)', (await capOff('B')) === true && (await capOff('N')) === false);
  await press('KeyB', 200);
  ok('opening start: B does nothing', (await key()) === 'intro' && await S(() => window.__game.scene.t < 1.5));

  // ---- a satellite screen: the globe, B: the ring; B: the request form; B: episode 1
  await press('Digit2', 1500);
  await until(() => window.__game.scene && window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.form, null, 8000);
  await S(() => window.__game.scene.scene.restart({ batch: 1, at: 1, formDone: true, quiet: true }));
  await until(() => { const s = window.__game.scene; return s.sys.settings.key === 'satellite' && s.levelIdx === 1 && !s.form && s.clock > 0.3; }, null, 8000);
  const s0 = await tally();
  await press('KeyB', 500);
  await until(() => { const s = window.__game.scene; return s.levelIdx === 0 && s.clock > 0.2; }, null, 5000).catch(() => {});
  ok('B on the globe goes back to the ring', await S(() => { const s = window.__game.scene; return s.sys.settings.key === 'satellite' && s.levelIdx === 0 && s.level.id === 'ring' && !s.form && !s.solved; }));
  await press('KeyB', 500);
  await until(() => window.__game.scene.form, null, 5000).catch(() => {});
  ok('B on the ring goes back to the request form', await S(() => { const s = window.__game.scene; return s.levelIdx === 0 && !!s.form; }));
  ok('nothing stamped by going back', await S(() => !(window.__unseen.state.story.requests || {})[1]));
  await press('KeyB', 600);
  await until(() => window.__game.scene.sys.settings.key === 'grounds', null, 6000).catch(() => {});
  ok('B on the form goes to the episode before (the grounds, from its start)', (await key()) === 'grounds' && await S(() => window.__game.scene.kid.x < 200));
  ok('still nothing counted', (await tally()).bodies === s0.bodies);
  // a solved puzzle: B goes back to its own start
  await press('Digit2', 1500);
  await until(() => window.__game.scene.sys.settings.key === 'satellite' && window.__game.scene.form, null, 8000);
  await S(() => window.__game.scene.scene.restart({ batch: 1, at: 1, formDone: true, quiet: true }));
  await until(() => { const s = window.__game.scene; return s.levelIdx === 1 && !s.form && s.clock > 0.3; }, null, 8000);
  await S(() => window.__game.scene.win());
  await p.waitForTimeout(300); await press('KeyB', 600);
  await until(() => { const s = window.__game.scene; return s.levelIdx === 1 && !s.solved && s.clock > 0.2; }, null, 5000).catch(() => {});
  ok('B on a solved globe: the same globe again, unsolved', await S(() => { const s = window.__game.scene; return s.levelIdx === 1 && !s.solved && !s.ended; }));
  await p.waitForTimeout(4500);
  ok('and its old win timer is gone (still on the globe)', await S(() => { const s = window.__game.scene; return s.sys.settings.key === 'satellite' && s.levelIdx === 1 && !s.solved; }));

  // ---- the bedroom talk: this line again, the line before, then the door; his death: his last line
  await press('Digit6', 1500);
  await until(() => window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.kid && window.__game.scene.clock > 0.6, null, 10000);
  const b0 = await tally();
  await S(() => { const s = window.__game.scene; s.bag.have = true; s.goInside(false); });
  await until(() => window.__game.scene.mode === 'bedroom', null, 3000);
  await S(() => { const s = window.__game.scene; s.kid.x = s.level.brother.kneel; });
  await until(() => window.__game.scene.mode === 'talk', null, 5000);
  await S(() => { const s = window.__game.scene; s.nextLine(); s.nextLine(); });
  await p.waitForTimeout(1500);
  const i0 = await S(() => window.__game.scene.talkI);
  await press('KeyB', 100);
  const i1 = await S(() => ({ i: window.__game.scene.talkI, cc: document.getElementById('cc').textContent }));
  ok(`bedroom talk: B well into line ${i0} says it again (${i1.i})`, i0 >= 2 && i1.i === i0);
  await press('KeyB', 100);
  const i2 = await S(() => window.__game.scene.talkI);
  ok(`bedroom talk: B again at its start, the line before (${i2})`, i2 === i0 - 1);
  for (let i = i2; i >= 0; i--) await press('KeyB', 100);
  ok('bedroom talk: B at the first line goes back to the bedroom door, standing', await S(() => { const s = window.__game.scene; return s.mode === 'bedroom' && !s.kid.crouch && s.kid.x < s.level.brother.kneel - 40; }));
  // walk back in, let the talk run out, then B from his death
  await S(() => { const s = window.__game.scene; s.kid.x = s.level.brother.kneel; });
  await until(() => window.__game.scene.mode === 'talk', null, 5000);
  await S(() => { const s = window.__game.scene; s.talkI = 99; s.endTalk(); });
  await p.waitForTimeout(4000);
  ok('his death plays (he has gone)', await S(() => window.__game.scene.broDead));
  await press('KeyB', 200);
  ok('B in his death: his last line again, and he is alive', await S(() => { const s = window.__game.scene; return s.mode === 'talk' && s.talkI === 10 && !s.broDead; }));
  ok('the bedroom: nothing counted, the episode not finished by going back', same(b0, await tally()));
  // in the house again from the bedroom door: back at the bag's tape mark, a regeneration
  for (let i = 0; i < 12 && await S(() => window.__game.scene.mode === 'talk'); i++) await press('KeyB', 100);
  await press('KeyB', 800);
  await until(() => { const s = window.__game.scene; return s.mode === 'house' && s.sys.settings.data.regen && s.clock > 0.2; }, null, 6000).catch(() => {});
  ok('B at the bedroom door: the house again at the bag\'s mark, the floor whole, nothing counted', await S(() => { const s = window.__game.scene; return s.mode === 'house' && !s.bag.have && Math.abs(s.kid.x - s.tape.list[s.tape.list.length - 1].x) < 20; }) && same(b0, await tally()));

  // ---- the controls notice lists B
  const panel = () => S(() => document.getElementById('panel').textContent);
  await press('KeyP', 300);
  for (let i = 0; i < 16 && !(await panel()).includes('> controls'); i++) await press('ArrowDown', 60);
  await press('Enter', 300);
  ok('the controls notice in the pause menu lists B (' + ((await panel()).match(/I mode[^.]*\.[^.]*\.[^.]*\./) || [''])[0] + ')', (await panel()).includes('Controls') && (await panel()).includes('N skips ahead. B back.'));
  await press('KeyX', 200); await p.keyboard.press('Escape');

  ok('no errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''), errs.length === 0);
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
