// Core and UI fixes from the final checks (Nov 18): L toggles the glasses, side-room doors take
// W (J only when nothing else is in reach), exit doors show a W key over her head, the key bar
// follows the part (east wing, the fight, a satellite screen), a # link wins over Continue on the
// title, #kids flows on, Chapters opened with the mouse picks Opening, the clue note names its
// group, and no key cap over a death. Screenshots at 1x in tests/out/coreui-*.png.
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
  const shot = n => p.screenshot({ path: 'tests/out/coreui-' + n + '.png' });
  const key = () => S(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key);
  const labels = () => S(() => Object.fromEntries([...document.querySelectorAll('#keybar .key')].map(k => [k.querySelector('.cap').textContent, k.querySelector('.lbl').textContent + (k.classList.contains('off') ? '(off)' : '')])));
  const live = () => until(() => { const s = window.__game && window.__game.scene; return s && s.kid && !s.dead && s.clock > 0.4; });
  await p.addInitScript(() => { window.__noPanels = true; });
  await p.goto(BASE + '/local.html');
  await S(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });

  // ---- the title: a # link wins over Continue, Chapters by mouse picks Opening, the arrow
  await S(() => localStorage.setItem('unseen-above-v1', JSON.stringify({ reached: 'ep3b' })));
  await p.goto(BASE + '/local.html#bedroom'); await p.reload();
  ok('a #bedroom link labels Continue with the bedroom (' + await S(() => document.querySelector('#continue i').textContent) + ')', await S(() => /Bedroom/.test(document.querySelector('#continue i').textContent)));
  await shot('title');
  await p.keyboard.press('Enter');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom', null, 30000).catch(() => null);
  ok('Enter on the title opens the bedroom, not the saved east wing (' + await key() + ')', await key() === 'bedroom');

  await p.goto(BASE + '/local.html');
  await S(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html');
  const ch = await p.$('#opt-chapters'), bb = await ch.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(300);
  const picked = await S(() => document.activeElement && document.activeElement.textContent);
  ok('Chapters opened with the mouse picks "' + picked + '" (not Back)', picked === '0 Opening');
  await shot('chapters');
  await p.keyboard.press('Escape');

  // ---- #kids by a link flows on (no preview)
  await p.goto(BASE + '/local.html#kids'); await p.reload();
  await p.keyboard.press('Enter');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'kids', null, 30000);
  ok('#kids plays in the flow (inFlow)', await S(() => !!window.__game.scene.inFlow || !!(window.__game.scene.sys.settings.data || {}).inFlow));

  // ---- the clue note names its group
  await S(() => { const st = window.__unseen.state; st.clue('statue07'); window.__unseen.overlay.note('NOTED (1)', 1600); });
  ok('a clue note says its group: ' + await S(() => document.getElementById('note').textContent), await S(() => document.getElementById('note').textContent === 'NOTED: WHO AIMS 1/5'));

  // ---- the gallery: L puts the glasses on and takes them off
  await S(() => window.__unseen.goStep({ step: 'ep2' }));
  await until(() => window.__game.scene.sys.settings.key === 'gallery');
  await live();
  await S(() => { const s = window.__game.scene; s.gl.has = true; s.gl.on = false; s.gl.heat = 0; s.gl.over = 0; });
  await p.keyboard.press('KeyL'); await p.waitForTimeout(200);
  const on1 = await S(() => window.__game.scene.gl.on);
  await p.keyboard.press('KeyL'); await p.waitForTimeout(200);
  const on2 = await S(() => window.__game.scene.gl.on);
  ok(`L puts the glasses on (${on1}) and takes them off (${on2}) in the gallery`, on1 === true && on2 === false);

  // ---- the grounds: W at the keeper's shed door goes in; the exit door shows W; no key over a death
  await S(() => window.__unseen.goStep({ step: 'ep1' }));
  await until(() => window.__game.scene.sys.settings.key === 'grounds');
  await live();
  await S(() => { const s = window.__game.scene; window.__prompts = []; const sp = s.bubbles.showPrompt.bind(s.bubbles), sp2 = s.bubbles.showPrompt2.bind(s.bubbles); s.bubbles.showPrompt = (x, y, l, i) => { window.__prompts.push(l); sp(x, y, l, i); }; s.bubbles.showPrompt2 = (x, y, l) => { window.__prompts.push(l); sp2(x, y, l); }; });
  const door = await S(() => { const s = window.__game.scene, d = s.things.find(t => t.door); s.placeAt(Math.round((d.x0 + d.x1) / 2 - 4)); return { x0: d.x0, x1: d.x1 }; });
  await p.waitForTimeout(400);
  ok('the shed door shows a W key (' + [...new Set(await S(() => window.__prompts))].join(',') + ')', await S(() => window.__prompts.includes('W')));
  await shot('shed-door');
  await p.keyboard.press('KeyW');
  await until(() => window.__unseen.game.scene.isActive('room'), null, 5000).catch(() => null);
  ok('W at the shed door goes in', await S(() => window.__unseen.game.scene.isActive('room')));
  await p.waitForTimeout(500);
  await S(() => { const s = window.__unseen.game.scene.getScene('room'); s.placeAt(20); });
  await p.waitForTimeout(300);
  await p.keyboard.press('KeyW');
  await until(() => window.__game.scene.sys.settings.key === 'grounds' && !window.__unseen.game.scene.isActive('room'), null, 5000).catch(() => null);
  ok('W at the room door goes back out', await S(() => !window.__unseen.game.scene.isActive('room')));
  await live();
  await S(() => { const s = window.__game.scene; s.bubbles.showPrompt = s.bubbles.constructor.prototype.showPrompt.bind(s.bubbles); s.bubbles.showPrompt2 = s.bubbles.constructor.prototype.showPrompt2.bind(s.bubbles); s.placeAt(s.level.door.x + 4); });
  await p.waitForTimeout(400);
  await shot('exit-door');
  await S(() => { const s = window.__game.scene, d = s.things.find(t => t.door); s.placeAt(Math.round((d.x0 + d.x1) / 2 - 4)); });
  await p.waitForTimeout(300);
  const promptDead = await S(() => new Promise(res => { const s = window.__game.scene; s.die({ id: 'test', direct: true }); setTimeout(() => res(s.bubbles.prompt), 60); }));
  ok('no key cap over a death', !promptDead);

  // ---- the key bar: the east wing (top-down), the fight, a satellite form
  await S(() => window.__unseen.goStep({ step: 'ep3b' }));
  await until(() => window.__game.scene.sys.settings.key === 'eastwing'); await p.waitForTimeout(600);
  const ew = await labels();
  ok(`east wing keys: W ${ew.W}, S ${ew.S}, A ${ew.A}, D ${ew.D}, Space ${ew.Space}`, ew.W === 'up' && ew.S === 'down' && ew.A === 'left' && ew.D === 'right' && ew.Space === 'jump(off)');
  await shot('keys-eastwing');
  await S(() => window.__unseen.goStep({ step: 'ep5b' }));
  await until(() => window.__game.scene.sys.settings.key === 'hallway'); await p.waitForTimeout(400);
  await S(() => { window.__game.scene.sword.have = true; }); await p.waitForTimeout(400);
  ok('in the fight K says ' + (await labels()).K, (await labels()).K === 'swing');
  await S(() => window.__unseen.goStep({ step: 'batch1' }));
  await until(() => window.__game.scene.sys.settings.key === 'satellite'); await p.waitForTimeout(800);
  const sat = await labels();
  ok(`satellite keys: W ${sat.W}, A ${sat.A}, Space ${sat.Space}, Shift ${sat.Shift}`, (sat.W === 'field' || /turn/.test(sat.W)) && /\(off\)/.test(sat.Space) && /\(off\)/.test(sat.Shift));
  await shot('keys-sat');

  // ---- paperwork: a notice slip and the report, at 1x
  await S(() => window.__unseen.goStep({ step: 'ep2' }));
  await until(() => window.__game.scene.sys.settings.key === 'gallery'); await live(); await p.waitForTimeout(3500);
  await S(() => window.__unseen.overlay.panel({ num: 701, title: 'Glasses', stamp: 'ISSUED', lines: ['{L} puts them on and takes them off.', 'They show what watches her.', 'They run hot, then cut out. Look quick.'] }));
  await p.waitForTimeout(900); await shot('notice');
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  await S(() => window.__feel.results.show(window.__game.scene, { id: 'ep1', num: 1, title: 'THE GROUNDS', take: 4, takes: 3, deaths: 2, time: 95, falls: 1, clues: 2, gold: null, grade: 'DAYTIME' }, () => {}));
  await p.waitForTimeout(900); await shot('report');
  ok('the report reads OPERATOR not required', await S(() => /operator not required/.test(document.getElementById('results').textContent)));

  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' | ') : 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all ok');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
