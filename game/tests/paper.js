// The paper page (dist/paper.html, built from paper/paper.md by paper/build.js). Builds nothing:
// serve game/dist first (python3 -m http.server 8851) and run npm run build (or node paper/build.js).
// Checks: the TL;DR comes first, every section id the game links to exists, note marks and notes
// link both ways, the page makes no network requests and logs no errors, the index works on a
// phone. Screenshots at deviceScaleFactor 1 go to tests/out/paper/.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.UA_BASE || 'http://localhost:8851';
const OUT = path.join(__dirname, 'out', 'paper');
const IDS = ['tldr', 'summary', 'intro', 'part-1', 'part-2', 'part-3', 'part-4', 'part-5', 'conclusion', 'notes'];
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch();
  let fails = 0;
  const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  const watch = p => {
    const errs = [], outside = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
    p.on('request', r => { if (!r.url().startsWith(BASE + '/paper.html') && !r.url().startsWith('data:')) outside.push(r.url()); });
    return { errs, outside };
  };
  const shot = async (p, name, full) => { const f = path.join(OUT, name + '.png'); await p.screenshot({ path: f, fullPage: !!full }); console.log('     ' + f); };

  // ---- desktop
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const w = watch(p);
  await p.goto(BASE + '/paper.html', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);

  const order = await p.$$eval('main section', s => s.map(x => x.querySelector('h2') && x.querySelector('h2').id));
  ok(`the TL;DR is the first section (${order.join(', ')})`, order[0] === 'tldr');
  ok('the TL;DR comes right after the title block', await p.evaluate(() => { const c = document.querySelector('.cover'); return c.nextElementSibling && c.nextElementSibling.querySelector('h2#tldr') !== null; }));
  for (const id of IDS) ok(`#${id} is a heading on the page`, await p.evaluate(id => { const e = document.getElementById(id); return !!e && /^H[1-6]$/.test(e.tagName); }, id));
  ok('parts I to V are in order', order.filter(x => /^part-/.test(x)).join(',') === 'part-1,part-2,part-3,part-4,part-5');
  ok('every index link points at a heading', await p.$$eval('.index a[data-for]', as => as.length >= 10 && as.every(a => document.getElementById(a.getAttribute('href').slice(1)))));

  // notes, both ways
  const notes = await p.evaluate(() => {
    const refs = [...document.querySelectorAll('.fnref a')], items = [...document.querySelectorAll('.fnlist li')];
    const there = refs.every(a => { const li = document.querySelector(a.getAttribute('href')); return li && li.querySelector(`.fnback[href="#${a.id}"]`); });
    const back = items.every(li => { const bs = [...li.querySelectorAll('.fnback')]; return bs.length && bs.every(x => { const r = document.querySelector(x.getAttribute('href')); return r && r.getAttribute('href') === '#' + li.id; }); });
    const numbered = refs.every((a, i) => a.textContent.trim() === a.getAttribute('href').replace('#fn-', ''));
    return { refs: refs.length, items: items.length, there, back, numbered, firstInOrder: refs.map(a => +a.textContent).filter((n, i, all) => all.indexOf(n) === i).every((n, i) => n === i + 1) };
  });
  ok(`note marks link to their notes and back (${notes.refs} marks, ${notes.items} notes)`, notes.refs > 0 && notes.items > 0 && notes.there && notes.back);
  ok('notes are numbered in the order they first appear', notes.numbered && notes.firstInOrder);
  await p.click('.fnref a >> nth=0');
  await p.waitForTimeout(700);
  ok('clicking a note mark goes to the note', await p.evaluate(() => location.hash === '#fn-1' && Math.abs(document.getElementById('fn-1').getBoundingClientRect().top) < innerHeight));
  await p.click('#fn-1 .fnback');
  await p.waitForTimeout(700);
  ok('its BACK link returns to the mark', await p.evaluate(() => location.hash === '#fnref-1' && (() => { const r = document.getElementById('fnref-1').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()));

  ok('back to the game: every link goes to the page beside it', await p.$$eval('a[data-back]', as => as.length >= 1 && as.every(a => /^(local\.html|index\.html|\.\/|\.\.\/)$/.test(a.getAttribute('href')))));
  ok('no em or en dashes on the page', await p.evaluate(() => !/[\u2013\u2014]/.test(document.body.innerText)));
  ok('headings and labels use the caption face', await p.evaluate(() => getComputedStyle(document.querySelector('#part-1')).fontFamily.includes('CH07') && document.fonts.check('20px "CH07 Caption"')));

  // screenshots: the top, a part (deep link, as the game opens it), the notes
  await p.goto(BASE + '/paper.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await shot(p, '1-top');
  ok('the index marks the TL;DR at the top', await p.evaluate(() => { const a = document.querySelector('.index a[aria-current="true"]'); return a && a.dataset.for === 'tldr'; }));
  await p.goto(BASE + '/paper.html#part-3', { waitUntil: 'load' }); await p.waitForTimeout(500);
  ok('a deep link (#part-3) lands on Part III', await p.evaluate(() => { const r = document.getElementById('part-3').getBoundingClientRect(); return r.top >= 0 && r.top < 120; }));
  ok('and the index marks Part III', await p.evaluate(() => { const a = document.querySelector('.index a[aria-current="true"]'); return a && a.dataset.for === 'part-3'; }));
  await shot(p, '2-part-3');
  await p.goto(BASE + '/paper.html#notes', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await shot(p, '3-notes');

  // a projector: 1920 x 1080
  await p.setViewportSize({ width: 1920, height: 1080 });
  await p.goto(BASE + '/paper.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await shot(p, '5-projector');
  ok('projector: nothing runs off the side', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  ok(`desktop: no console errors (${w.errs.join(' | ')})`, w.errs.length === 0);
  ok(`desktop: no requests outside the page (${w.outside.join(', ')})`, w.outside.length === 0);

  // ---- phone
  const ph = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const pw = watch(ph);
  await ph.goto(BASE + '/paper.html', { waitUntil: 'load' }); await ph.evaluate(() => document.fonts.ready);
  ok('phone: nothing runs off the side', await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  ok('phone: the index starts closed', await ph.evaluate(() => !document.getElementById('toc').open));
  await shot(ph, '4-phone');
  await ph.tap('#toc summary'); await ph.waitForTimeout(200);
  ok('phone: tapping the bar opens the index', await ph.evaluate(() => document.getElementById('toc').open));
  await shot(ph, '4-phone-index');
  await ph.tap('.index a[data-for="part-2"]'); await ph.waitForTimeout(900);
  ok('phone: picking a part closes the index and goes there, clear of the bar', await ph.evaluate(() => {
    const bar = document.querySelector('.index').getBoundingClientRect(), h = document.getElementById('part-2').getBoundingClientRect();
    return !document.getElementById('toc').open && location.hash === '#part-2' && h.top >= bar.bottom - 1 && h.top < 200;
  }));
  ok('phone: the bar stays at the top and names the part', await ph.evaluate(() => document.querySelector('.index').getBoundingClientRect().top === 0 && /PART II/.test(document.querySelector('#toc .now').textContent)));
  await shot(ph, '4-phone-part-2');
  ok(`phone: no console errors (${pw.errs.join(' | ')})`, pw.errs.length === 0);

  // ---- print
  await p.setViewportSize({ width: 1280, height: 800 });
  await p.emulateMedia({ media: 'print' });
  ok('print: the index and the strip are hidden', await p.evaluate(() => getComputedStyle(document.querySelector('.index')).display === 'none' && getComputedStyle(document.querySelector('.strip')).display === 'none'));
  await p.emulateMedia({ media: 'screen' });

  await b.close();
  console.log(fails ? `${fails} failed` : 'all passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
