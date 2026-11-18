// The first group of comforts: the pause menu (P, Esc, clicking away), its settings, the controls
// page, the title screen and Continue, story mode on the guide, the caption that names what
// killed her, skipping the strike after the first death, and the offer to skip ahead when stuck.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 30000, polling: 50 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const panel = () => p.evaluate(() => document.getElementById('panel').innerText.replace(/\s+/g, ' '));
  const S = fn => p.evaluate(fn);
  await p.addInitScript(() => { window.__noPanels = true; });
  await p.goto(BASE + '/local.html');
  await p.evaluate(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html#grounds'); await p.reload();

  // the guide: no Continue yet; the two switches
  ok('a first visit has no Continue', await S(() => document.getElementById('continue').hidden));
  await p.click('#opt-flash');
  ok('the guide switch reduces flashing and stops the shake', await S(() => { const s = JSON.parse(localStorage.getItem('unseen-above-v1')).settings; return s.reduceFlash === true && s.shake === false && document.querySelector('#opt-flash i').textContent === 'reduced'; }));
  await p.click('#opt-flash');
  await p.click('#opt-story');
  ok('the guide switch turns story mode on', await S(() => JSON.parse(localStorage.getItem('unseen-above-v1')).immune === true && document.querySelector('#opt-story i').textContent === 'on'));
  await p.click('#opt-story');
  await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.clock > 0.5);

  // P pauses everything
  await p.keyboard.press('KeyP');
  await until(() => window.__paused === true, null, 3000);
  const c0 = await S(() => window.__game.scene.clock); await p.waitForTimeout(600); const c1 = await S(() => window.__game.scene.clock);
  ok('P opens page 100 and the episode waits (clock ' + c0.toFixed(2) + ' then ' + c1.toFixed(2) + ')', c0 === c1 && (await panel()).includes('Paused') && await S(() => window.__game.scene.sys.isPaused()));
  ok('the menu lists: ' + (await panel()).slice(0, 160), /resume/.test(await panel()) && /restart this episode/.test(await panel()) && /story mode: off/.test(await panel()) && /title screen/.test(await panel()));
  await p.keyboard.press('ArrowDown');
  ok('Down moves to the next row', (await panel()).includes('> restart this episode'));
  // to MUSIC, then Left lowers it
  for (let i = 0; i < 2; i++) await p.keyboard.press('ArrowDown');
  ok('three rows down is music', (await panel()).includes('> music'));
  await p.keyboard.press('ArrowLeft');
  ok('Left lowers the music to 4 (saved)', await S(() => window.__game.state.settings.music === 4));
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
  ok('then flashing', (await panel()).includes('> flashing: full'));
  await p.keyboard.press('Enter');
  ok('Enter switches flashing to reduced', await S(() => window.__game.state.settings.reduceFlash === true) && (await panel()).includes('> flashing: reduced'));
  await p.keyboard.press('Enter');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter');
  ok('CONTROLS opens page 101', (await panel()).includes('Controls'));
  await p.screenshot({ path: 'tests/out/pause-controls.png', clip: { x: 0, y: 42, width: 1280, height: 720 } });
  await p.keyboard.press('KeyX'); await p.waitForTimeout(200);
  ok('any key goes back to the menu', (await panel()).includes('Paused') && (await panel()).includes('> controls'));
  await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp');
  await p.waitForTimeout(150);
  await p.screenshot({ path: 'tests/out/pause-menu.png', clip: { x: 0, y: 42, width: 1280, height: 720 } });
  await p.keyboard.press('KeyP');
  await until(() => window.__paused === false, null, 3000);
  const c2 = await S(() => window.__game.scene.clock); await p.waitForTimeout(500); const c3 = await S(() => window.__game.scene.clock);
  ok('P again resumes', c3 > c2 && !(await S(() => window.__game.scene.sys.isPaused())));
  // the mouse: a click on RESUME
  await p.keyboard.press('Escape');
  await until(() => window.__paused === true, null, 3000);
  const box = await p.evaluate(() => { const r = document.getElementById('cg').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  // RESUME is the first row: y0 + 10 + 22 + 5 on the 320 x 180 grid
  const rowsN = await S(() => document.querySelectorAll('#panel .panel-body p').length), h = (3 + rowsN + 2) * 10 + 4, y0 = Math.round((180 - h) / 2);
  await p.mouse.click(box.x + box.w * (90 / 320), box.y + box.h * ((y0 + 37) / 180));
  await until(() => window.__paused === false, null, 3000);
  ok('Esc pauses too, and a click on RESUME resumes', true);
  // clicking away pauses (asked for here, as automation normally turns it off)
  await p.evaluate(() => { window.__noPanels = false; window.__autoPause = true; window.dispatchEvent(new Event('blur')); });
  await until(() => window.__paused === true, null, 3000);
  ok('losing focus pauses, and the sound waits', await S(() => window.__unseen.Sound.held === true));
  await p.evaluate(() => window.dispatchEvent(new Event('focus')));
  ok('coming back lets the sound go, the menu stays up', await S(() => window.__unseen.Sound.held === false && window.__paused === true));
  await p.keyboard.press('KeyP');
  await p.evaluate(() => { window.__noPanels = true; window.__autoPause = false; });

  // a death says what got her; the first is watched in full
  await p.evaluate(() => window.__game.scene.die({ id: 'garden lamp' }));
  await until(() => /GARDEN LAMP FOUND HER/.test(document.getElementById('cc').textContent), null, 3000);
  ok('the caption names it: ' + await S(() => document.getElementById('cc').textContent), true);
  ok('her first death cannot be skipped', await S(() => window.__game.scene.death && window.__game.scene.death.skippable === false));
  await until(() => window.__game.scene.ep.take === 2 && !window.__game.scene.dead && window.__game.scene.clock > 0.3, null, 15000);
  // the second: Space cuts the strike short, and the body still lands
  await p.evaluate(() => window.__game.scene.die({ id: 'fountain drone' }));
  await p.waitForTimeout(250);
  const tA = Date.now(); await p.keyboard.press('Space');
  await until(() => window.__game.scene.ep.take === 3 && !window.__game.scene.dead, null, 6000);
  const skipMs = Date.now() - tA;
  ok('after that, Space skips the strike (' + skipMs + ' ms) and the body stays (' + await S(() => window.__game.scene.ep.bodies.length) + ' bodies)', skipMs < 1500 && await S(() => window.__game.scene.ep.bodies.length === 2));
  // a third death: now the show offers N
  await p.evaluate(() => window.__game.scene.die({ id: 'pergola drone' }));
  await p.waitForTimeout(200); await p.keyboard.press('Space');
  await until(() => window.__game.scene.ep.take === 4 && !window.__game.scene.dead && window.__game.scene.clock > 0.2, null, 6000);
  ok('three deaths: the show offers to skip ahead (' + await S(() => document.getElementById('note').textContent) + ')', /Stuck/.test(await S(() => document.getElementById('note').textContent)));
  const x0 = await S(() => window.__game.scene.kid.x);
  await p.keyboard.press('KeyN'); await p.waitForTimeout(250);
  const x1 = await S(() => window.__game.scene.kid.x);
  ok('and N skips ahead without story mode (' + Math.round(x0) + ' to ' + Math.round(x1) + ')', x1 > x0 + 50 && !(await S(() => window.__game.state.immune)));
  await p.keyboard.press('KeyP');
  ok('the menu offers SKIP AHEAD now', (await panel()).includes('skip ahead'));
  await p.keyboard.press('KeyP');

  // Continue: the place she reached is kept; the guide comes back from the menu
  await p.evaluate(() => window.__game.state.reach('ep2'));
  await p.keyboard.press('KeyP');
  await until(() => window.__paused === true, null, 3000);
  for (let i = 0; i < 12; i++) await p.keyboard.press('ArrowDown');
  // the last row is TITLE SCREEN; down wraps, so go up one from RESUME
  await p.keyboard.press('Home');
  let at = await panel(); let guard = 0;
  while (!at.includes('> title screen') && guard++ < 14) { await p.keyboard.press('ArrowDown'); at = await panel(); }
  await p.keyboard.press('Enter');
  await until(() => !document.getElementById('tv').hidden, null, 3000);
  const cont = await S(() => ({ hidden: document.getElementById('continue').hidden, label: document.getElementById('continue').innerText.replace(/\s+/g, ' '), start: document.getElementById('start').innerText.split('\n')[0] }));
  ok('TITLE SCREEN brings the title back, with Continue (' + cont.label + ') and ' + cont.start, !cont.hidden && /Episode 2/.test(cont.label) && /From the start/.test(cont.start));
  await p.screenshot({ path: 'tests/out/pause-guide.png' });
  await p.click('#continue');
  await until(() => window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.clock > 0.3, null, 20000);
  ok('Continue opens episode 2', true);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 4).join(' | ') : 'no page errors');
  await b.close();
})();
