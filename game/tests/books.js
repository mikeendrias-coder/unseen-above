// The hidden books (Nov 18): one per episode, behind where she starts. Each is out of reach at the
// start, J (or a click on it) opens its EXHIBIT slip with the Part's title and first paragraph from
// paper/paper.md, the scene waits, R reads (paper.html#part-n in a new tab), J closes; found books
// count once each in state.story (books, shelf); the how-to line shows on the first book only. Also
// the paper links: the title's Paper row, the About notice's foot, the ending screen's PAPER and
// BOOKS n/5. Screenshots at 1x in tests/out/books-*.png.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const PARTS = require('../paper/parts.js')();
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  // no real tabs: every window.open is written down instead
  await p.addInitScript(() => { window.__noPanels = true; window.open = u => { window.__opened = (window.__opened || []).concat(String(u)); return null; }; });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 30000, polling: 50 });
  let fails = 0;
  const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  const S = (fn, a) => p.evaluate(fn, a);
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  const shot = n => p.screenshot({ path: path.join(__dirname, 'out', 'books-' + n + '.png') });
  const save = () => S(() => JSON.parse(localStorage.getItem('unseen-above-v1') || '{}'));
  await p.goto(BASE + '/local.html');
  await S(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });

  // ---- the build put the paper's Parts in the game
  ok('the build read five Parts from paper.md (' + Object.values(PARTS).map(q => q.roman).join(' ') + ')', Object.keys(PARTS).length === 5 && PARTS[3].title.length > 0);

  const EPS = [
    { hash: 'grounds', key: 'grounds', n: 1 }, { hash: 'gallery', key: 'gallery', n: 2 }, { hash: 'eastwing', key: 'eastwing', n: 3 },
    { hash: 'bedroom', key: 'bedroom', n: 4 }, { hash: 'moon', key: 'moon', n: 5 }
  ];
  for (const ep of EPS) {
    await p.goto('about:blank'); await p.goto(BASE + '/local.html#' + ep.hash); await p.click('#start');
    await until(k => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === k && window.__game.scene.kid && window.__game.scene.clock > 1.2, ep.key);
    await p.waitForTimeout(300);
    const info = await S(n => { const s = window.__game.scene, bk = (s.books || []).find(q => q.n === n), k = s.kid; return bk ? { at: bk.at, start: s.level.start, kid: k.tx != null ? [k.tx, k.ty] : [k.x, k.y], near: s.nearThing && s.nearThing.book } : null; }, ep.n);
    ok(ep.key + ': a book for Part ' + PARTS[ep.n].roman + ' at ' + JSON.stringify(info && info.at) + ', she starts at ' + JSON.stringify(info && info.kid), !!info);
    if (!info) continue;
    const top = info.at.tx != null;
    ok(ep.key + ': it lies the other way from the route (behind where she starts) and is not in reach at the start', (top ? info.at.tx < info.kid[0] : info.at.x < info.kid[0]) && !info.near);
    // walk her to it (put her beside it) and press J
    await S(n => { const s = window.__game.scene, bk = s.books.find(q => q.n === n); if (bk.at.tx != null) s.placeTile(bk.at.tx, bk.at.ty + 1); else { s.kid.x = bk.at.x - 2; s.kid.vx = 0; } }, ep.n);
    await until(() => window.__game.scene.nearThing && window.__game.scene.nearThing.book, null, 5000);
    ok(ep.key + ': beside it, J finds the book', true);
    await p.keyboard.press('KeyJ');
    await until(() => window.__unseen.cg.pageSpec && window.__unseen.cg.pageSpec.kind === 'exhibit', null, 5000);
    await p.waitForTimeout(450); // the stamp lands
    const slip = await S(() => ({ spec: window.__unseen.cg.pageSpec, paused: window.__game.scene.scene.isPaused(), panel: document.getElementById('panel').innerText }));
    ok(ep.key + ': the EXHIBIT slip shows Part ' + slip.spec.roman + ': "' + slip.spec.title + '" / "' + slip.spec.text.slice(0, 60) + '"', slip.spec.n === ep.n && slip.spec.title === PARTS[ep.n].title && slip.spec.text === PARTS[ep.n].text);
    ok(ep.key + ': the scene waits behind it', slip.paused);
    ok(ep.key + ': the how-to line ' + (ep.n === 1 ? 'shows (first book)' : 'does not repeat'), slip.spec.howto === (ep.n === 1));
    ok(ep.key + ': no em or en dashes on it', !/[\u2013\u2014]/.test(slip.spec.title + slip.spec.text + slip.panel));
    const box = await S(() => { const c = document.getElementById('cg').getBoundingClientRect(), sp = window.__unseen.cg.pageSpec; return { box: sp.box, hit: sp.hit, u: c.width / 320, l: c.left, t: c.top }; });
    ok(ep.key + ': the slip fits inside the picture (' + JSON.stringify(box.box) + ')', box.box.x >= 0 && box.box.y >= 0 && box.box.x + box.box.w <= 320 && box.box.y + box.box.h <= 180);
    await shot(ep.n + '-' + ep.key);
    if (ep.n === 1) {
      // keys: J or anything else in the game does nothing behind it; R reads
      await p.keyboard.press('KeyD'); await p.waitForTimeout(100);
      ok('D moves the pick to CLOSE and she does not walk', await S(() => window.__unseen.cg.pageSpec.pick === 1 && window.__game.scene.scene.isPaused()));
      await p.keyboard.press('KeyA');
      await p.keyboard.press('KeyR');
      await until(() => !window.__unseen.cg.pageUp, null, 3000);
      ok('R reads: paper.html#part-1 in a new tab (' + await S(() => (window.__opened || []).join(', ')) + ')', await S(() => (window.__opened || []).slice(-1)[0] === 'paper.html#part-1'));
      await p.waitForTimeout(200);
      ok('the slip goes, the scene goes on', await S(() => !window.__game.scene.scene.isPaused()));
      ok('the book is counted: books 1, shelf {1}', await S(() => window.__game.state.story.books === 1 && !!window.__game.state.story.shelf[1]));
      // again: counted once
      await p.keyboard.press('KeyJ'); await until(() => window.__unseen.cg.pageUp, null, 3000); await p.waitForTimeout(400);
      ok('a second look at the same book has no how-to line', await S(() => window.__unseen.cg.pageSpec.howto === false));
      await p.keyboard.press('KeyJ'); await until(() => !window.__unseen.cg.pageUp, null, 3000);
      await p.waitForTimeout(250);
      ok('J closes it; the same book is still counted once', await S(() => window.__game.state.story.books === 1 && !window.__game.scene.scene.isPaused()));
      ok('the J that closed it did not open it again', await S(() => !window.__unseen.cg.pageUp));
    } else if (ep.n === 3) {
      // the mouse: CLOSE with a click, then a click on the book opens it (and throws no pebble)
      const c = box.hit[1];
      await p.mouse.click(box.l + (c.x + c.w / 2) * box.u, box.t + (c.y + c.h / 2) * box.u);
      await until(() => !window.__unseen.cg.pageUp, null, 3000); await p.waitForTimeout(200);
      ok('east wing: a click on CLOSE puts it away', await S(() => !window.__game.scene.scene.isPaused()));
      const at = await S(() => { const s = window.__game.scene, bk = s.books[0], cam = s.cameras.main, c = s.game.canvas.getBoundingClientRect(), k = c.width / s.game.canvas.width; const x = (bk.img.x - cam.worldView.x) * cam.zoom * k + c.left, y = (bk.img.y - 4 - cam.worldView.y) * cam.zoom * k + c.top; return { x, y, flight: !!s.flight, pebbles: s.pebbles }; });
      await p.mouse.click(at.x, at.y);
      await until(() => window.__unseen.cg.pageUp, null, 3000).catch(() => {});
      ok('east wing: a click on the book opens it', await S(() => !!window.__unseen.cg.pageSpec && window.__unseen.cg.pageSpec.n === 3));
      ok('and throws nothing at it', await S(() => !window.__game.scene.flight));
      // READ with the mouse
      const r = box.hit[0];
      await p.waitForTimeout(400);
      await p.mouse.click(box.l + (r.x + r.w / 2) * box.u, box.t + (r.y + r.h / 2) * box.u);
      await until(() => !window.__unseen.cg.pageUp, null, 3000);
      ok('a click on READ PART III opens paper.html#part-3', await S(() => (window.__opened || []).slice(-1)[0] === 'paper.html#part-3'));
    } else {
      await p.keyboard.press('Escape');
      await until(() => !window.__unseen.cg.pageUp, null, 3000); await p.waitForTimeout(200);
      ok(ep.key + ': Esc closes it, no pause menu, the scene goes on', await S(() => !window.__paused && !window.__game.scene.scene.isPaused()));
    }
  }
  ok('five books found: books 5 (' + JSON.stringify((await save()).story.shelf) + ')', (await save()).story.books === 5);

  // ---- the title: the Paper row
  await p.goto('about:blank'); await p.goto(BASE + '/local.html'); await p.waitForTimeout(400);
  ok('the title has a Paper row', await S(() => !document.getElementById('opt-paper').hidden && /Paper/.test(document.getElementById('opt-paper').textContent)));
  await p.click('#opt-paper');
  ok('it opens paper.html in a new tab', await S(() => (window.__opened || []).slice(-1)[0] === 'paper.html'));
  const tvr = await S(() => { const t = document.getElementById('tv').getBoundingClientRect(), m = document.querySelector('.tv-menu').getBoundingClientRect(); return { t: [t.top, t.bottom], m: [m.top, m.bottom] }; });
  ok('the menu with the Paper row stays inside the picture ' + JSON.stringify(tvr), tvr.m[0] >= tvr.t[0] && tvr.m[1] <= tvr.t[1]);
  await shot('title');
  // About: the foot has the paper
  await p.click('#opt-about'); await until(() => !document.getElementById('about').hidden);
  ok('About ends with "Read the paper: paper.html" (' + await S(() => document.getElementById('about-paper').textContent) + ')', await S(() => /Read the paper: paper\.html/.test(document.getElementById('about-paper').textContent)));
  ok('the button sits on the paper, inside the picture', await S(() => { const q = document.getElementById('about-paper').getBoundingClientRect(), pr = document.querySelector('#about .paper').getBoundingClientRect(); return q.bottom <= pr.bottom + 0.5 && q.right <= pr.right + 0.5 && q.left >= pr.left; }));
  await shot('about');
  await p.click('#about-paper'); await p.waitForTimeout(150);
  ok('a click on it opens the paper and puts the notice away', await S(() => (window.__opened || []).length === 2 && document.getElementById('about').hidden));
  await p.click('#opt-about'); await until(() => !document.getElementById('about').hidden);
  await p.keyboard.press('KeyR'); await p.waitForTimeout(150);
  ok('R on the notice does it too', await S(() => (window.__opened || []).length === 3 && document.getElementById('about').hidden));

  // ---- the ending screen: BOOKS 5/5 and PAPER
  await p.goto('about:blank'); await p.goto(BASE + '/local.html#playroom'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'moon' && window.__game.scene.mode === 'room', null, 30000);
  await S(() => window.__game.scene.showLast('moon', 'vest'));
  await until(() => window.__finale && window.__finale.t > 1, null, 20000);
  await p.keyboard.press('Enter');
  await until(() => window.__finale.phase === 'card' && window.__finale.cardT > 0.6, null, 8000);
  const btns = await S(() => window.__finale.rows.map(q => [q.x, q.w]));
  ok('five buttons that do not touch, each with room round its word, PAPER after ABOUT ' + JSON.stringify(btns), btns.length === 5 && btns.every((q, i) => i === 0 || q[0] >= btns[i - 1][0] + btns[i - 1][1] + 2) && btns[4][0] + btns[4][1] <= 34 + 252 - 6 && await S(() => window.__finale.rows.every((r, i) => r.w >= ['TV AGAIN', 'CHAPTERS', 'ABOUT', 'PAPER', 'TITLE'][i].length * 6 + 5)));
  await shot('ending');
  await p.keyboard.press('KeyD'); await p.keyboard.press('KeyD'); await p.keyboard.press('KeyD'); await p.keyboard.press('Enter');
  await p.waitForTimeout(200);
  ok('PAPER opens paper.html; the ending screen stays', await S(() => (window.__opened || []).slice(-1)[0] === 'paper.html' && window.__finale.phase === 'card' && !window.__finale.leaving));
  // the mouse on the PAPER button, at this window's scale
  await S(() => { window.__opened = []; });
  const pb = await S(() => { const r = window.__finale.rows[3], c = document.querySelector('#stage > canvas').getBoundingClientRect(), u = c.width / 320; return { x: c.left + (r.x + r.w / 2) * u, y: c.top + (r.y + r.h / 2) * u }; });
  await p.mouse.click(pb.x, pb.y); await p.waitForTimeout(150);
  ok('a click on PAPER does it too', await S(() => (window.__opened || []).slice(-1)[0] === 'paper.html'));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  console.log(fails ? fails + ' failed' : 'all passed');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
