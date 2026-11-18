// The paper page (dist/paper.html, built from paper/paper.md by paper/build.js). Builds the page
// only for the dense-notes fixture; serve game/dist first (python3 -m http.server 8871, or set
// UA_BASE) after npm run build (or node paper/build.js).
// Checks: the TL;DR comes first, every section id the game links to exists, note marks and notes
// link both ways, notes sit in the margin beside their marks on wide screens (never on top of
// each other, even when crowded), open in a pop-up slip on narrower ones and dock to the bottom on
// phones, Esc and the keyboard work, links inside citations work, Id. and supra point at the
// right notes, the Cite block copies (and falls back), the reading meter fills, print shows the
// notes as endnotes, the page makes no network requests and logs no errors.
// Screenshots at deviceScaleFactor 1 (and a print PDF) go to tests/out/paper/.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.UA_BASE || 'http://localhost:8871';
const OUT = path.join(__dirname, 'out', 'paper');
const IDS = ['tldr', 'summary', 'intro', 'part-1', 'part-2', 'part-3', 'part-4', 'part-5', 'conclusion', 'notes', 'cite'];
fs.mkdirSync(OUT, { recursive: true });

// a crowded paper: long Bluebook notes, many marks in one paragraph, Id. and supra
function fixture() {
  const dir = path.join(OUT, 'fixture');
  fs.mkdirSync(dir, { recursive: true });
  const long = k => `*See* Author ${k}, *A Long Article Title About Remote Sensing and Who Gets to See What, Part ${k}*, 99 Space L.J. ${100 + k}, ${110 + k} (2024) (discussing licensing tiers, shutter control and the requests that keep imagery off the market), https://example.org/a/very/long/path/that/does/not/break/on/its/own/${k}/with-more-words-in-the-slug-${k} [https://perma.cc/ABCD-${1000 + k}].`;
  const notes = [];
  let text = '';
  for (let k = 1; k <= 12; k++) {
    text += `Sentence ${k} of a paragraph that cites a lot of things.[^n${k}] `;
    notes.push(`[^n${k}]: ${k === 4 ? 'Id. at 7.' : k === 7 ? `*See* Author 2, supra note [^n2], at 112.` : long(k)}`);
  }
  const md = `# Fixture: Crowded Notes\n\nTest · Course · November 2026\n\n## TL;DR\n\nShort.\n\n## Executive summary\n\nS.\n\n## Introduction\n\n${text}\n\n## Part I. One\n\nA.\n\n## Part II. Two\n\nB.\n\n## Part III. Three\n\nC.\n\n## Part IV. Four\n\nD.\n\n## Part V. Five\n\nE.\n\n## Conclusion\n\nF.\n\n${notes.join('\n\n')}\n`;
  fs.writeFileSync(path.join(dir, 'paper.md'), md);
  const log = console.log; console.log = () => {};
  try { require('../paper/build.js')({ src: path.join(dir, 'paper.md'), out: dir }); } finally { console.log = log; }
  return 'file://' + path.join(dir, 'paper.html');
}

(async () => {
  const b = await chromium.launch();
  let fails = 0;
  const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  const watch = p => {
    const errs = [], outside = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
    p.on('request', r => { const u = r.url(); if (!u.startsWith(BASE + '/paper.html') && !u.startsWith('data:') && !u.startsWith('file:')) outside.push(u); });
    return { errs, outside };
  };
  const shot = async (p, name, full) => { const f = path.join(OUT, name + '.png'); await p.screenshot({ path: f, fullPage: !!full }); console.log('     ' + f); };
  const load = async (p, hash) => { await p.goto(BASE + '/paper.html' + (hash || ''), { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250); };
  // margin notes never overlap, never sit above their mark, and keep the marks' order
  const marginOk = p => p.evaluate(() => {
    const sides = [...document.querySelectorAll('.side')].map(s => ({ n: +s.id.slice(3), r: s.getBoundingClientRect(), m: document.getElementById('fnref-' + s.id.slice(3)).getBoundingClientRect() }));
    const bad = [];
    sides.forEach((s, i) => {
      if (s.r.top < s.m.top - 8) bad.push(`note ${s.n} sits above its mark`);
      if (i && s.r.top < sides[i - 1].r.bottom + 4) bad.push(`note ${s.n} touches note ${sides[i - 1].n}`);
      if (s.r.width < 100 || s.r.left < s.m.right) bad.push(`note ${s.n} is not in the margin`);
    });
    const crowded = sides.filter(s => s.r.top - s.m.top > 8).length;
    return { n: sides.length, bad, crowded, level: sides.filter(s => Math.abs(s.r.top - s.m.top) <= 8).length };
  });

  // ---- desktop, wide: notes in the margin
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const w = watch(p);
  await load(p);

  const order = await p.$$eval('main section', s => s.map(x => x.querySelector('h2') && x.querySelector('h2').id));
  ok(`the TL;DR is the first section (${order.join(', ')})`, order[0] === 'tldr');
  ok('the TL;DR comes right after the title block', await p.evaluate(() => { const c = document.querySelector('.cover'); const n = c.nextElementSibling; return !!n && !!n.querySelector('section h2#tldr') && n.querySelector('section').querySelector('h2').id === 'tldr'; }));
  for (const id of IDS) ok(`#${id} is a heading on the page`, await p.evaluate(id => { const e = document.getElementById(id); return !!e && /^H[1-6]$/.test(e.tagName); }, id));
  ok('parts I to V are in order', order.filter(x => /^part-/.test(x)).join(',') === 'part-1,part-2,part-3,part-4,part-5');
  ok('the notes and the Cite block come after the conclusion', order.slice(-3).join(',') === 'conclusion,notes,cite');
  ok('every index link points at a heading', await p.$$eval('.index a[data-for]', as => as.length >= 11 && as.every(a => document.getElementById(a.getAttribute('href').slice(1)))));

  // notes, both ways
  const notes = await p.evaluate(() => {
    const refs = [...document.querySelectorAll('.fnref a')], items = [...document.querySelectorAll('.fnlist li')];
    const there = refs.every(a => { const li = document.querySelector(a.getAttribute('href')); return li && li.querySelector(`.fnback[href="#${a.id}"]`); });
    const back = items.every(li => { const bs = [...li.querySelectorAll('.fnback')]; return bs.length && bs.every(x => { const r = document.querySelector(x.getAttribute('href')); return r && r.getAttribute('href') === '#' + li.id; }); });
    const numbered = refs.every(a => a.textContent.trim() === a.getAttribute('href').replace('#fn-', ''));
    const focusable = refs.every(a => a.tabIndex >= 0 && a.hasAttribute('href'));
    return { refs: refs.length, items: items.length, there, back, numbered, focusable, firstInOrder: refs.map(a => +a.textContent).filter((n, i, all) => all.indexOf(n) === i).every((n, i) => n === i + 1) };
  });
  ok(`note marks link to their notes and back (${notes.refs} marks, ${notes.items} notes)`, notes.refs > 0 && notes.items > 0 && notes.there && notes.back);
  ok('notes are numbered in the order they first appear', notes.numbered && notes.firstInOrder);
  ok('every note mark is a link the keyboard can reach', notes.focusable);

  ok('wide: notes go in the margin (html.sn)', await p.evaluate(() => document.documentElement.classList.contains('sn')));
  const m1 = await marginOk(p);
  ok(`wide: every note has a margin note, level with its mark or below it, none touching (${m1.n} notes, ${m1.level} level) ${m1.bad.join('; ')}`, m1.n === notes.items && m1.bad.length === 0 && m1.level >= 1);
  ok('wide: the margin notes are not in the way of the text', await p.evaluate(() => { const pr = document.querySelector('#part-1').closest('section').querySelector('.prose').getBoundingClientRect(); return [...document.querySelectorAll('.side')].every(s => s.getBoundingClientRect().left >= pr.right); }));
  ok('wide: long addresses in notes wrap inside the margin', await p.evaluate(() => [...document.querySelectorAll('.side .sntext')].every(t => t.scrollWidth <= t.clientWidth + 1)));
  ok('wide: links inside citations are real links that open beside the paper', await p.evaluate(() => { const a = [...document.querySelectorAll('.side .sntext a[href^="http"]')]; return a.length > 0 && a.every(x => x.target === '_blank' && /noopener/.test(x.rel)); }));

  // pick a note: click the mark, the margin note lights up and takes focus; Esc puts it back
  await p.goto(BASE + '/paper.html#part-1', { waitUntil: 'load' }); await p.waitForTimeout(300);
  await p.click('#fnref-1');
  ok('wide: clicking a mark lights its margin note and moves focus there', await p.evaluate(() => document.getElementById('sn-1').classList.contains('on') && document.activeElement.id === 'sn-1' && document.getElementById('fnref-1').classList.contains('on') && location.hash === '#part-1'));
  await shot(p, '1-desk-margin-note');
  await p.keyboard.press('Escape');
  ok('wide: Esc lets go of the note and returns focus to the mark', await p.evaluate(() => !document.querySelector('.side.on') && document.activeElement.id === 'fnref-1'));
  await p.keyboard.press('Enter');
  ok('wide: Enter on a focused mark picks its note', await p.evaluate(() => document.getElementById('sn-1').classList.contains('on')));
  await p.keyboard.press('Escape');
  await p.hover('#fnref-2');
  ok('wide: hovering a mark marks its note', await p.evaluate(() => document.getElementById('sn-2').classList.contains('hot')));
  await p.mouse.move(5, 5);

  // Id. and supra
  const short = await p.evaluate(() => {
    const id = [...document.querySelectorAll('.fnlist li[data-id-of]')].map(li => [+li.dataset.n, +li.dataset.idOf]);
    const it = [...document.querySelectorAll('.fntext em')].map(e => e.textContent.trim());
    const xr = [...document.querySelectorAll('.fntext a.xref')].map(a => [a.textContent, a.getAttribute('href')]);
    return { id, idItalic: it.includes('Id.') || it.includes('id.'), supraItalic: it.includes('supra'), xr, label: [...document.querySelectorAll('.side .idof')].map(a => a.textContent + ' ' + a.getAttribute('href')) };
  });
  ok(`Id. is set in italics and its note names the note before it (${JSON.stringify(short.id)}, ${short.label.join(', ')})`, short.idItalic && short.id.length > 0 && short.id.every(([n, of]) => of === n - 1) && short.label.length === short.id.length);
  ok(`supra note [^label] prints the right number as a link (${JSON.stringify(short.xr)})`, short.supraItalic && short.xr.length > 0 && short.xr.every(([t, h]) => h === '#fn-' + t));
  if (short.id.length) {
    const [n, of] = short.id[0];
    await p.click(`#sn-${n} .idof`);
    ok(`wide: the ID. label lights note ${of}`, await p.evaluate(of => document.getElementById('sn-' + of).classList.contains('on'), of));
    await p.keyboard.press('Escape');
  }

  // a long note: MORE opens it, and the notes below make room
  const longN = await p.evaluate(() => { const s = document.querySelector('.side.long'); return s ? s.id : null; });
  if (longN) {
    await p.click(`#${longN} .snmore`); await p.waitForTimeout(100);
    const m2 = await marginOk(p);
    ok(`wide: MORE opens a long note and nothing overlaps after (${m2.bad.join('; ')})`, await p.evaluate(id => document.getElementById(id).classList.contains('open'), longN) && m2.bad.length === 0);
    await p.click(`#${longN} .snmore`);
  }

  // the BACK link from the notes returns to the mark and lights the margin note
  await p.click('#fn-1 .fnback'); await p.waitForTimeout(500);
  ok('BACK from the notes returns to the mark and lights its margin note', await p.evaluate(() => location.hash === '#fnref-1' && (() => { const r = document.getElementById('fnref-1').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })() && document.getElementById('sn-1').classList.contains('on')));

  // Cite this paper
  const cite = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.citerow')];
    return { n: rows.length, labels: rows.map(r => r.querySelector('.citelabel').textContent.trim()), italic: !!document.querySelector('#cite-bluebook i'), bb: document.getElementById('cite-bluebook').textContent.replace(/\s+/g, ' ').trim(), url: document.querySelector('#cite-bluebook a').href };
  });
  ok(`the Cite block has a Bluebook and a plain citation (${cite.labels.join(', ')})`, cite.n === 2 && cite.labels.join() === 'BLUEBOOK,PLAIN' && cite.italic && /^https:\/\//.test(cite.url));
  await p.goto(BASE + '/paper.html#cite', { waitUntil: 'load' }); await p.waitForTimeout(300);
  await p.click('button.copy[data-copy="cite-bluebook"]'); await p.waitForTimeout(300);
  const clip = await p.evaluate(() => navigator.clipboard.readText().catch(e => 'ERR ' + e.message));
  ok(`COPY puts the Bluebook citation on the clipboard ("${clip.slice(0, 60)}...")`, clip.replace(/\s+/g, ' ').trim() === cite.bb);
  ok('COPY says so', await p.evaluate(() => /clipboard/.test(document.querySelector('.cite .copied').textContent) && document.querySelector('button.copy[data-copy="cite-bluebook"]').textContent === 'COPIED'));
  await shot(p, '4-cite');

  // the reading meter fills to the end
  await p.goto(BASE + '/paper.html', { waitUntil: 'load' }); await p.waitForTimeout(200);
  const m0 = await p.evaluate(() => +document.querySelector('.meter').getAttribute('aria-valuenow'));
  await p.evaluate(() => document.getElementById('conclusion').scrollIntoView()); await p.waitForTimeout(200);
  const mMid = await p.evaluate(() => +document.querySelector('.meter').getAttribute('aria-valuenow'));
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(200);
  const mEnd = await p.evaluate(() => [+document.querySelector('.meter').getAttribute('aria-valuenow'), document.querySelectorAll('.meter .cells i.f').length]);
  ok(`the reading meter fills as the page is read (${m0}% then ${mMid}% then ${mEnd[0]}%, ${mEnd[1]} cells)`, m0 < mMid && mEnd[0] === 100 && mEnd[1] === 20);

  ok('back to the game: every link goes to the page beside it', await p.$$eval('a[data-back]', as => as.length >= 1 && as.every(a => /^(local\.html|index\.html|\.\/|\.\.\/)$/.test(a.getAttribute('href')))));
  ok('no em or en dashes on the page', await p.evaluate(() => !/[\u2013\u2014]/.test(document.body.innerText)));
  ok('headings and labels use the caption face', await p.evaluate(() => getComputedStyle(document.querySelector('#part-1')).fontFamily.includes('CH07') && document.fonts.check('20px "CH07 Caption"')));

  // screenshots: the top, a part (deep link, as the game opens it), the notes
  await load(p);
  await shot(p, '0-top');
  ok('the index marks the TL;DR at the top', await p.evaluate(() => { const a = document.querySelector('.index a[aria-current="true"]'); return a && a.dataset.for === 'tldr'; }));
  await p.goto(BASE + '/paper.html#part-3', { waitUntil: 'load' }); await p.waitForTimeout(500);
  ok('a deep link (#part-3) lands on Part III', await p.evaluate(() => { const r = document.getElementById('part-3').getBoundingClientRect(); return r.top >= 0 && r.top < 120; }));
  ok('and the index marks Part III', await p.evaluate(() => { const a = document.querySelector('.index a[aria-current="true"]'); return a && a.dataset.for === 'part-3'; }));
  await shot(p, '2-part-3');
  await p.goto(BASE + '/paper.html#notes', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await shot(p, '3-notes');

  // ---- a crowded page (fixture): twelve long notes in one paragraph
  const fx = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const fw = watch(fx);
  await fx.goto(fixture(), { waitUntil: 'load' }); await fx.evaluate(() => document.fonts.ready); await fx.waitForTimeout(200);
  const mf = await marginOk(fx);
  ok(`crowded: twelve long notes stack in the margin without touching (${mf.n} notes, ${mf.crowded} moved down) ${mf.bad.join('; ')}`, mf.n === 12 && mf.bad.length === 0 && mf.crowded > 0);
  ok('crowded: the sheet grows to hold the last margin note', await fx.evaluate(() => { const last = [...document.querySelectorAll('.side')].pop().getBoundingClientRect(); return last.bottom <= document.querySelector('.body').getBoundingClientRect().bottom + 1; }));
  ok('crowded: long addresses wrap', await fx.evaluate(() => [...document.querySelectorAll('.side .sntext')].every(t => t.scrollWidth <= t.clientWidth + 1)));
  ok('crowded: Id. (note 4) points at note 3, supra note [^n2] prints 2', await fx.evaluate(() => document.getElementById('fn-4').dataset.idOf === '3' && document.querySelector('#fn-7 a.xref').textContent === '2'));
  await fx.evaluate(() => document.getElementById('fnref-1').scrollIntoView({ block: 'start' })); await fx.evaluate(() => scrollBy(0, -80));
  await shot(fx, '5-crowded-margin');
  ok(`crowded: no console errors (${fw.errs.join(' | ')})`, fw.errs.length === 0);
  await fx.close();

  // ---- a projector: 1920 x 1080
  await p.setViewportSize({ width: 1920, height: 1080 });
  await load(p, '#part-1');
  await shot(p, '6-projector');
  ok('projector: nothing runs off the side', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const mp = await marginOk(p);
  ok(`projector: notes in the margin, none touching ${mp.bad.join('; ')}`, mp.n > 0 && mp.bad.length === 0);

  ok(`desktop: no console errors (${w.errs.join(' | ')})`, w.errs.length === 0);
  ok(`desktop: no requests outside the page (${w.outside.join(', ')})`, w.outside.length === 0);

  // ---- a narrower window (1100): the pop-up slip
  const mid = await b.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
  const mw = watch(mid);
  await mid.goto(BASE + '/paper.html#part-3', { waitUntil: 'load' }); await mid.waitForTimeout(300);
  ok('1100: no margin notes, the text keeps its width', await mid.evaluate(() => !document.documentElement.classList.contains('sn') && [...document.querySelectorAll('.side')].every(s => getComputedStyle(s).display === 'none')));
  const n3 = await mid.evaluate(() => document.querySelector('#part-3').closest('section').querySelector('.fnref a').textContent);
  await mid.click(`#fnref-${n3}`);
  const pop = await mid.evaluate(n => {
    const p = document.querySelector('.pop'), m = document.getElementById('fnref-' + n), r = p.getBoundingClientRect(), mr = m.getBoundingClientRect();
    return { open: !p.hidden, role: p.getAttribute('role'), label: p.querySelector('.poplabel').textContent, focus: p.contains(document.activeElement), expanded: m.getAttribute('aria-expanded'), near: r.top >= mr.bottom && r.top - mr.bottom < 30, inView: r.left >= 0 && r.right <= innerWidth, links: [...p.querySelectorAll('.popbody a[href^="http"]')].length, wraps: p.querySelector('.popbody').scrollWidth <= p.querySelector('.popbody').clientWidth + 1 };
  }, n3);
  ok(`1100: clicking a mark opens its note in a slip right under it (${pop.label})`, pop.open && pop.role === 'dialog' && pop.label === 'NOTE ' + String(n3).padStart(2, '0') && pop.near && pop.inView && pop.expanded === 'true');
  ok('1100: the slip takes focus, its links work and long addresses wrap', pop.focus && pop.links > 0 && pop.wraps);
  await shot(mid, '7-mid-popup');
  await mid.keyboard.press('Tab');
  ok('1100: Tab goes into the note', await mid.evaluate(() => document.querySelector('.pop').contains(document.activeElement) && /^(A|BUTTON)$/.test(document.activeElement.tagName)));
  await mid.keyboard.press('Escape');
  ok('1100: Esc closes the slip and returns focus to the mark', await mid.evaluate(n => document.querySelector('.pop').hidden && document.activeElement.id === 'fnref-' + n && document.getElementById('fnref-' + n).getAttribute('aria-expanded') === 'false', n3));
  await mid.keyboard.press('Enter');
  ok('1100: Enter on the mark opens it again', await mid.evaluate(() => !document.querySelector('.pop').hidden));
  await mid.mouse.click(1080, 780);
  ok('1100: a click elsewhere closes it', await mid.evaluate(() => document.querySelector('.pop').hidden));
  // hover preview with a mouse
  const n2 = await mid.evaluate(() => document.querySelector('#part-2').closest('section').querySelector('.fnref a').textContent);
  await mid.evaluate(n => document.getElementById('fnref-' + n).scrollIntoView({ block: 'center' }), n2);
  await mid.hover(`#fnref-${n2}`); await mid.waitForTimeout(300);
  ok('1100: hovering a mark shows its note', await mid.evaluate(n => !document.querySelector('.pop').hidden && document.querySelector('.pop').getAttribute('data-n') === n, n2));
  await mid.mouse.move(1080, 20); await mid.waitForTimeout(400);
  ok('1100: and moving away hides it', await mid.evaluate(() => document.querySelector('.pop').hidden));
  // Id. inside the slip: the label opens the note it means, with a way back
  if (short.id.length) {
    const [n, of] = short.id[0];
    await mid.evaluate(n => document.getElementById('fnref-' + n).scrollIntoView({ block: 'center' }), n);
    await mid.click(`#fnref-${n}`);
    await mid.click('.pop .idof');
    ok(`1100: ID. in the slip opens note ${of}`, await mid.evaluate(of => document.querySelector('.pop .poplabel').textContent === 'NOTE ' + String(of).padStart(2, '0') && !document.querySelector('.pop .popback').hidden, of));
    await mid.click('.pop .popback');
    ok(`1100: and the back key returns to note ${n}`, await mid.evaluate(n => document.querySelector('.pop .poplabel').textContent === 'NOTE ' + String(n).padStart(2, '0'), n));
    await mid.keyboard.press('Escape');
  }
  ok(`1100: no console errors (${mw.errs.join(' | ')})`, mw.errs.length === 0);
  await mid.close();

  // ---- phone
  const ph = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const pw = watch(ph);
  await ph.goto(BASE + '/paper.html', { waitUntil: 'load' }); await ph.evaluate(() => document.fonts.ready);
  ok('phone: nothing runs off the side', await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  ok('phone: the index starts closed', await ph.evaluate(() => !document.getElementById('toc').open));
  await shot(ph, '8-phone');
  await ph.tap('#toc summary'); await ph.waitForTimeout(200);
  ok('phone: tapping the bar opens the index', await ph.evaluate(() => document.getElementById('toc').open));
  await shot(ph, '8-phone-index');
  await ph.tap('.index a[data-for="part-2"]'); await ph.waitForTimeout(900);
  ok('phone: picking a part closes the index and goes there, clear of the bar', await ph.evaluate(() => {
    const bar = document.querySelector('.index').getBoundingClientRect(), h = document.getElementById('part-2').getBoundingClientRect();
    return !document.getElementById('toc').open && location.hash === '#part-2' && h.top >= bar.bottom - 1 && h.top < 200;
  }));
  ok('phone: the bar stays at the top and names the part', await ph.evaluate(() => document.querySelector('.index').getBoundingClientRect().top === 0 && /PART II/.test(document.querySelector('#toc .now').textContent)));
  ok('phone: the reading meter is a line along the bar', await ph.evaluate(() => { const m = document.querySelector('.meter').getBoundingClientRect(); return m.height > 0 && m.height <= 4 && m.width >= innerWidth - 2; }));
  const pn = await ph.evaluate(() => document.querySelector('#part-2').closest('section').querySelector('.fnref a').textContent);
  ok('phone: note marks are big enough to tap (44px with their pad)', await ph.evaluate(n => { const a = document.getElementById('fnref-' + n), s = getComputedStyle(a, '::after'); return a.getBoundingClientRect().height + parseFloat(s.top) * -2 >= 34; }, pn));
  await ph.tap(`#fnref-${pn}`); await ph.waitForTimeout(300);
  const dock = await ph.evaluate(n => {
    const p = document.querySelector('.pop'), r = p.getBoundingClientRect(), m = document.getElementById('fnref-' + n).getBoundingClientRect();
    return { open: !p.hidden, dock: p.classList.contains('dock'), bottom: Math.round(innerHeight - r.bottom), full: r.width >= innerWidth - 1, markSeen: m.bottom <= r.top && m.top >= 0 };
  }, pn);
  ok(`phone: tapping a mark docks its note to the bottom of the screen, the mark still in sight (${JSON.stringify(dock)})`, dock.open && dock.dock && Math.abs(dock.bottom) <= 1 && dock.full && dock.markSeen);
  await shot(ph, '9-phone-note');
  await ph.tap('.pop .popclose'); await ph.waitForTimeout(150);
  ok('phone: CLOSE puts the note away', await ph.evaluate(() => document.querySelector('.pop').hidden));
  await ph.goto(BASE + '/paper.html#cite', { waitUntil: 'load' }); await ph.waitForTimeout(300);
  ok('phone: the Cite block fits', await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.citetext')].every(t => t.scrollWidth <= t.clientWidth + 1)));
  await shot(ph, '9-phone-cite');
  ok(`phone: no console errors (${pw.errs.join(' | ')})`, pw.errs.length === 0);

  // ---- the copy fallback: no clipboard API (a plain http page on a LAN)
  const fb = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await fb.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'clipboard', { get: () => undefined }); });
  await fb.goto(BASE + '/paper.html#cite', { waitUntil: 'load' });
  await fb.click('button.copy[data-copy="cite-plain"]'); await fb.waitForTimeout(200);
  ok('COPY still works without the clipboard API (copies the old way, or selects the text)', await fb.evaluate(() => { const t = document.querySelector('.cite .copied').textContent; return /clipboard/.test(t) || (/Selected/.test(t) && String(getSelection()).length > 20); }));
  await fb.close();

  // ---- without the script, every mark still goes to its note
  const nojs = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const nj = await nojs.newPage();
  await nj.goto(BASE + '/paper.html', { waitUntil: 'load' });
  await nj.click('#fnref-1'); await nj.waitForTimeout(300);
  ok('no script: a mark is a plain link to its note', await nj.evaluate(() => location.hash === '#fn-1'));
  await nojs.close();

  // ---- print: endnotes, no margin, no slips
  await p.setViewportSize({ width: 1280, height: 800 });
  await load(p, '#part-1');
  await p.emulateMedia({ media: 'print' });
  ok('print: the index, the strip, margin notes and slips are hidden; the notes list prints', await p.evaluate(() => {
    const d = s => getComputedStyle(document.querySelector(s)).display;
    return d('.index') === 'none' && d('.strip') === 'none' && d('.side') === 'none' && d('.pop') === 'none' && d('.fnlist') !== 'none' && d('.fnref') !== 'none';
  }));
  ok('print: the text runs the full width again', await p.evaluate(() => getComputedStyle(document.querySelector('.body > .part')).marginRight === '0px'));
  await p.pdf({ path: path.join(OUT, 'print.pdf'), format: 'Letter', printBackground: true });
  console.log('     ' + path.join(OUT, 'print.pdf'));
  await p.emulateMedia({ media: 'screen' });

  await b.close();
  console.log(fails ? `${fails} failed` : 'all passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
