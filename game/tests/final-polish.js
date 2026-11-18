// Final polish for class (Nov 18): the paper's credit on the title and every ending screen, the
// "How the game argues" notice (from the title and from an ending screen, any key puts it away),
// ROUND 2 READY? clear of LIVE and CH 07 on the playroom TV, the gallery drawer winning J near the
// sideboard (and the robot kept off its floor), and the Bright switch (title, key, pause menu,
// presenter default, saved). Screenshots at 1x in tests/out/final-*.png.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const fresh = async () => { const q = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 }); q.on('pageerror', e => errs.push(e.message)); q.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); await q.addInitScript(() => { window.__noPanels = true; }); return q; };
  let p = await fresh();
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 30000, polling: 50 });
  let fails = 0;
  const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  const S = (fn, a) => p.evaluate(fn, a);
  const shot = n => p.screenshot({ path: 'tests/out/final-' + n + '.png' });
  const save = () => S(() => JSON.parse(localStorage.getItem('unseen-above-v1') || '{}'));
  // two boxes overlap
  const hit = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
  const rect = sel => S(s => { const r = document.querySelector(s).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height }; }, sel);
  await p.goto(BASE + '/local.html');
  await S(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
  await p.goto(BASE + '/local.html'); await p.waitForTimeout(400);

  // ---- the title: the credit under "ch 07, tonight", clear of the menu and inside the picture
  const tv = await rect('#tv'), cr = await rect('.tv-credit'), menu = await rect('.tv-menu');
  const u = tv.h / 180;
  ok('the title credit names the paper (' + await S(() => document.querySelector('.tv-credit').innerText.replace(/\n/g, ' | ')) + ')', await S(() => /Space Law and the Power to See and Not Be Seen\./.test(document.querySelector('.tv-credit').textContent) && /Michael Endrias\. Intro to Space Law, Prof\. Link\./.test(document.querySelector('.tv-credit').textContent)));
  ok('it sits under "ch 07, tonight" (top ' + Math.round((cr.top - tv.top) / u) + ' of 180), inside the picture, clear of the menu', cr.top - tv.top >= 74 * u && cr.right <= tv.right && cr.bottom <= tv.bottom && !hit(cr, menu));
  ok('the title has a Bright row and an About row', await S(() => !document.getElementById('opt-bright').hidden && !document.getElementById('opt-about').hidden && document.querySelector('#opt-bright i').textContent === 'off'));
  await shot('title');
  // presenter on: Bright comes on with it; the taller menu still clears the credit
  await p.click('#opt-present');
  ok('presenter on turns Bright on (saved), the picture gets the filter', (await save()).settings.bright === true && await S(() => document.body.classList.contains('bright') && getComputedStyle(document.getElementById('tv-canvas')).filter.includes('brightness')));
  const menu2 = await rect('.tv-menu');
  ok('presenting, the menu (' + Math.round((menu2.top - tv.top) / u) + ' to ' + Math.round((menu2.bottom - tv.top) / u) + ') stays inside the picture and clear of the credit', menu2.top >= tv.top && menu2.bottom <= tv.bottom && !hit(cr, menu2));
  await shot('title-presenter');
  await p.click('#opt-bright');
  ok('the Bright row turns it off', (await save()).settings.bright === false && await S(() => !document.body.classList.contains('bright') && document.querySelector('#opt-bright i').textContent === 'off'));
  await p.click('#opt-bright');

  // ---- the explainer from the title
  await p.click('#opt-about');
  await until(() => !document.getElementById('about').hidden);
  const ab = await rect('#about'), paper = await rect('#about .paper'), rows = await S(() => [...document.querySelectorAll('#about .row')].map(r => r.innerText.replace(/\n/g, ': ')));
  ok('About opens "How the game argues" over the picture (' + rows.length + ' rows)', rows.length === 6 && Math.abs(ab.top - tv.top) < 2 && Math.abs(ab.w - tv.w) < 2);
  ok('every row fits on the paper, inside the picture', paper.bottom <= tv.bottom && await S(() => { const pr = document.querySelector('#about .paper').getBoundingClientRect(); return [...document.querySelectorAll('#about .row, #about .foot')].every(r => { const q = r.getBoundingClientRect(); return q.bottom <= pr.bottom + 0.5 && q.right <= pr.right + 0.5; }); }));
  ok('the type is the caption face at the picture\'s pixel size (' + await S(() => getComputedStyle(document.querySelector('#about dd')).fontSize) + ')', await S(() => parseFloat(getComputedStyle(document.querySelector('#about dd')).fontSize) >= 10 * (document.getElementById('tv').getBoundingClientRect().height / 180) - 0.5));
  ok('no em or en dashes in it', await S(() => !/[\u2013\u2014]/.test(document.getElementById('about').textContent)));
  rows.forEach(r => console.log('       ' + r));
  await shot('about-title');
  await p.keyboard.press('Space');
  await p.waitForTimeout(200);
  ok('any key puts it away, and the key does nothing else (title still up, nothing started)', await S(() => document.getElementById('about').hidden && !document.getElementById('tv').hidden && !(window.__game && window.__game.scene)));
  ok('focus goes back to the About row', await S(() => document.activeElement && document.activeElement.id === 'opt-about'));
  await p.click('#opt-about'); await until(() => !document.getElementById('about').hidden);
  await p.mouse.click(tv.left + tv.w / 2, tv.top + tv.h / 2); await p.waitForTimeout(150);
  ok('a click puts it away too', await S(() => document.getElementById('about').hidden));

  // ---- an ending screen: the credit under the form, ABOUT opens the notice
  await p.goto('about:blank');
  await p.addInitScript(() => { try { if (!sessionStorage.getItem('fp')) { sessionStorage.setItem('fp', '1'); localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true, story: {}, settings: { presenter: true, bright: true } })); } } catch (e) {} });
  await p.goto(BASE + '/local.html#playroom');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.mode === 'room', null, 30000);
  // the playroom TV during the talk: ROUND 2 READY? clear of LIVE and the channel box
  await S(() => { const s = window.__game.scene; s.kid.x = s.level.stand; });
  await until(() => window.__game.scene.mode === 'talk', null, 15000);
  // the band's top row (y 6, above the letters): dark box pixels (ink0 #1b0f3a) between LIVE (ends
  // x 34) and the channel's box (from w - 38); wait for the blink that shows it
  const readBand = () => S(() => {
    const s = window.__game.scene, w = s.show.w, d = s.show.ctx.getImageData(0, 6, w, 1).data, dark = [];
    for (let x = 0; x < w; x++) { const i = x * 4; if (d[i] === 0x1b && d[i + 1] === 0x0f && d[i + 2] === 0x3a) dark.push(x); }
    const runs = []; dark.forEach(x => { const r = runs[runs.length - 1]; if (r && x === r[1] + 1) r[1] = x; else runs.push([x, x]); });
    return { w, runs };
  });
  await p.waitForTimeout(1500); // the room comes up out of white
  const inGap = q => q.runs.some(r => r[0] > 34 && r[1] < q.w - 38);
  let band = await readBand();
  for (let i = 0; i < 40 && !inGap(band); i++) { await p.waitForTimeout(50); band = await readBand(); }
  const mid = band.runs.find(r => r[0] > 34 && r[1] < band.w - 38);
  ok('the playroom TV: ROUND 2 READY? on its own band (' + JSON.stringify(band.runs) + '), clear of LIVE and of CH 07 by 4 px or more', !!mid && mid[0] >= 38 && mid[1] <= band.w - 38 - 4);
  await shot('playroom-tv');
  // the reply, then straight to an ending's screen
  await S(() => window.__game.scene.showLast('moon', 'vest'));
  await until(() => window.__finale && window.__finale.t > 2, null, 20000);
  ok('no credit while the final beat plays', await S(() => document.getElementById('endcredit').hidden));
  await p.keyboard.press('Enter');
  await until(() => window.__finale.phase === 'card' && window.__finale.cardT > 0.6, null, 8000);
  const cv = await rect('#stage > canvas'), ec = await rect('#endcredit');
  const uu = cv.h / 180;
  const card = await S(() => { const r = window.__finale.rows; return { bottom: 5 + 156, btn: r.map(q => [q.x, q.w]) }; });
  ok('the ending screen shows the credit under the form (' + Math.round((ec.top - cv.top) / uu) + ' to ' + Math.round((ec.bottom - cv.top) / uu) + ' of 180), inside the picture', await S(() => !document.getElementById('endcredit').hidden) && ec.top - cv.top >= card.bottom * uu && ec.bottom <= cv.bottom + 1 && ec.left >= cv.left && ec.right <= cv.right);
  ok('it is one block wide enough for the paper\'s full title (' + Math.round(await S(() => { const c = document.getElementById('endcredit'), r = document.createRange(); r.selectNodeContents(c); return r.getBoundingClientRect().width; })) + ' px of ' + Math.round(cv.w) + ')', await S(() => { const c = document.getElementById('endcredit'), r = document.createRange(); r.selectNodeContents(c); const q = r.getBoundingClientRect(), k = document.querySelector('#stage > canvas').getBoundingClientRect(); return q.left >= k.left && q.right <= k.right; }));
  ok('five buttons that do not touch: TV AGAIN, CHAPTERS, ABOUT, PAPER, TITLE ' + JSON.stringify(card.btn), card.btn.length === 5 && card.btn.every((q, i) => i === 0 || q[0] >= card.btn[i - 1][0] + card.btn[i - 1][1] + 2));
  await shot('ending');
  await p.keyboard.press('KeyD'); await p.keyboard.press('KeyD'); await p.keyboard.press('Enter');
  await until(() => !document.getElementById('about').hidden, null, 3000);
  ok('ABOUT on the ending screen opens the notice', true);
  await shot('about-ending');
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok('Enter puts it away and the ending screen is still up (no button pressed)', await S(() => document.getElementById('about').hidden && window.__finale && window.__finale.phase === 'card' && window.__finale.pick === 2 && !window.__finale.leaving));

  // ---- Bright: the key under the game and the pause menu row
  ok('presenting from a save made with Bright on: Bright is on, and leaves the paper form unfiltered', await S(() => document.body.classList.contains('bright') && document.body.classList.contains('paper-up') && getComputedStyle(document.querySelector('#stage > canvas')).filter === 'none'));
  await S(() => { const k = [...document.querySelectorAll('#keybar .key')].find(x => x.querySelector('.cap').textContent === 'Bright'); k.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 })); k.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 })); });
  ok('the Bright key turns it off', (await save()).settings.bright === false && await S(() => !document.body.classList.contains('bright')));
  await p.keyboard.press('KeyP'); await until(() => window.__paused);
  let guard = 0; while (!/> bright/.test(await S(() => document.getElementById('panel').innerText)) && guard++ < 16) await p.keyboard.press('ArrowDown');
  ok('the pause menu has a BRIGHT row (' + await S(() => document.getElementById('panel').innerText.split('\n').find(l => /bright/.test(l))) + ')', /> bright: off/.test(await S(() => document.getElementById('panel').innerText)));
  await p.keyboard.press('Enter');
  ok('Enter on it turns Bright on again', (await save()).settings.bright === true && /> bright: on/.test(await S(() => document.getElementById('panel').innerText)));
  await shot('pause-bright');
  await p.keyboard.press('KeyP');

  // ---- the gallery: J at the sideboard opens the drawer, whatever else is near (a new browser
  // context: the presenter save above would go straight back into the playroom)
  await p.context().close().catch(() => {});
  { const c = await b.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 }); p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); await p.addInitScript(() => { window.__noPanels = true; }); }
  await p.goto(BASE + '/local.html#gallery'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'gallery' && window.__game.scene.kid && window.__game.scene.clock > 0.6, null, 30000);
  // the robot put right in front of the drawer rolls back off its floor
  await S(() => { const s = window.__game.scene; s.robot.x = 216; s.robot.dir = 1; });
  await p.waitForTimeout(2500);
  const rx = await S(() => window.__game.scene.robot.x);
  ok('the robot never parks in front of the sideboard (at x ' + Math.round(rx) + '; the sideboard starts at 224)', rx <= 186);
  // her at each spot by the sideboard (the floor in front of it, its top), with the robot pushed
  // up close and the light switch near: J still means the drawer
  const spots = [];
  for (const [x, top] of [[210, 0], [213, 0], [216, 0], [226, 1], [244, 1], [262, 1]]) { // the left floor and its top (the hall table fills its right side)
    const r = await S(([x, top]) => { const s = window.__game.scene, k = s.kid; s.robot.x = 200; k.x = x; k.y = (top ? 320 : 336) - k.h; k.vx = 0; k.vy = 0; return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => res(s.nearThing === s.cabinetThing ? 'drawer' : s.nearThing === s.robotThing ? 'robot' : s.nearThing ? 'other' : 'none'))))); }, [x, top]);
    spots.push(x + (top ? 'top' : '') + ':' + r);
  }
  ok('near the sideboard J always means the drawer (' + spots.join(' ') + ')', spots.every(t => /drawer/.test(t)));
  await S(() => { const s = window.__game.scene, k = s.kid; k.x = 214; k.y = 336 - k.h; });
  await p.waitForTimeout(400); await shot('gallery-drawer');
  await S(() => { const k = [...document.querySelectorAll('#keybar .key')].find(x => x.querySelector('.cap').textContent === 'Bright'); k.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 })); k.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 })); });
  ok('the Bright key lifts the game picture (' + await S(() => getComputedStyle(document.querySelector('#stage > canvas')).filter) + '), captions and notices stay over it', await S(() => getComputedStyle(document.querySelector('#stage > canvas')).filter.includes('brightness') && getComputedStyle(document.getElementById('overlay')).zIndex === '2'));
  await p.waitForTimeout(300); await shot('gallery-bright');
  await p.keyboard.press('KeyJ');
  await until(() => window.__game.scene.glasses, null, 6000).catch(() => null);
  ok('J there opens the drawer: she has the glasses', await S(() => window.__game.scene.glasses));
  await p.waitForTimeout(300);
  ok('with the glasses, the drawer lets go of J (the robot can be talked to again)', await S(() => { const s = window.__game.scene; return !s.pinThing(); }));

  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 4).join(' | ') : 'no page errors');
  await b.close();
  process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
