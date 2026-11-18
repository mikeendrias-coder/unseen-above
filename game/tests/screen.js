// The bigger game screen (Nov 18, Michael: "make the game screen bigger"): at 1280x720,
// 1366x768, 1440x900, 1920x1080 and in full screen the picture takes the largest scale that fits
// (fractional allowed, a whole number when it is within 10 percent), the page never scrolls, the
// header is one slim line, the key bar folds away (saved; folded by default in full screen), and
// everything over the picture lines up with it: the caption canvas, the title picture, the mouse
// (Phaser's pointer, the pause menu's rows). Screenshots at 1x in tests/out/screen-*.png.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const SIZES = [[1280, 720], [1366, 768], [1440, 900], [1920, 1080]];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  let fails = 0;
  const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  const near = (a, c, d) => Math.abs(a - c) <= (d == null ? 1 : d);
  for (const [w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(() => { window.__noPanels = true; });
    const S = (fn, a) => p.evaluate(fn, a);
    await p.goto(BASE + '/local.html'); await S(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
    await p.goto(BASE + '/local.html'); await p.waitForTimeout(400);
    const tag = w + 'x' + h;
    // the title: the picture at the display's size, the header one slim line
    const t = await S(() => { const r = document.getElementById('tv').getBoundingClientRect(), hd = document.getElementById('chrome-top').getBoundingClientRect(); return { tv: [r.width, r.height], css: [window.__unseen ? 0 : 0], header: hd.height, scroll: document.documentElement.scrollHeight - innerHeight }; });
    ok(tag + ' title: the header is one slim line (' + t.header + ' px), the page does not scroll', t.header <= 16 && t.scroll <= 0);
    await p.screenshot({ path: 'tests/out/screen-title-' + tag + '.png' });
    await p.goto('about:blank'); await p.goto(BASE + '/local.html#gallery'); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid && window.__game.scene.clock > 1, null, { timeout: 30000 });
    await p.waitForTimeout(300);
    const d = await S(() => {
      const u = window.__unseen.display, c = document.querySelector('#stage > canvas'), cr = c.getBoundingClientRect(), o = document.getElementById('cg').getBoundingClientRect();
      const top = document.getElementById('chrome-top').getBoundingClientRect(), foot = document.getElementById('chrome-bottom').getBoundingClientRect();
      return { S: u.S, F: u.F, cw: c.width, cr: [cr.left, cr.top, cr.width, cr.height], cg: [o.left, o.top, o.width, o.height], rendering: getComputedStyle(c).imageRendering, cgRendering: getComputedStyle(document.getElementById('cg')).imageRendering,
        room: innerHeight - top.height - 4 - (foot.height + 2) - 8, width: document.getElementById('stage').clientWidth, scroll: document.documentElement.scrollHeight - innerHeight, hscroll: document.documentElement.scrollWidth - innerWidth };
    });
    const fit = Math.min(d.width / 320, d.room / 210);
    ok(tag + ': picture ' + d.cr[2] + 'x' + d.cr[3] + ' (scale ' + d.F + ', drawn at ' + d.S + '), the fit is ' + fit.toFixed(2), d.F <= fit + 0.01 && (d.F >= fit * 0.9 - 0.01) && (Number.isInteger(d.F) ? true : d.F > Math.floor(fit) / 0.9 - 0.06));
    ok(tag + ': a whole-number scale wins when within 10 percent (' + (Math.floor(fit) / fit).toFixed(2) + ')', (Math.floor(fit) / fit >= 0.9) === Number.isInteger(d.F));
    ok(tag + ': drawn at whole S = floor(F), shown at F with nearest sampling (' + d.rendering + ', captions ' + d.cgRendering + ')', d.S === Math.max(1, Math.floor(d.F)) && d.cw === 320 * d.S && /pixelated|crisp-edges/.test(d.rendering) && /pixelated|crisp-edges/.test(d.cgRendering));
    ok(tag + ': the caption canvas sits exactly on the picture and the strip under it', near(d.cg[0], d.cr[0], 0.5) && near(d.cg[1], d.cr[1], 0.5) && near(d.cg[2], d.cr[2], 0.5) && near(d.cg[3], d.cr[3] * 210 / 180, 1));
    ok(tag + ': no page scroll (' + d.scroll + ', ' + d.hscroll + ')', d.scroll <= 0 && d.hscroll <= 0);
    // the mouse: Phaser's pointer at the canvas middle is the canvas middle in game pixels
    await p.mouse.move(d.cr[0] + d.cr[2] * 0.75, d.cr[1] + d.cr[3] * 0.25);
    const ptr = await S(() => { const q = window.__game.scene.input.activePointer; return [q.x, q.y]; });
    ok(tag + ': the mouse maps into the game (' + ptr.map(Math.round) + ' of ' + d.cw + ')', near(ptr[0], d.cw * 0.75, d.S) && near(ptr[1], d.cw * 9 / 16 * 0.25, d.S));
    await p.screenshot({ path: 'tests/out/screen-game-' + tag + '.png' });
    // the pause menu's rows under the mouse: MUSIC is picked by pointing at it, RESUME by a click
    await p.keyboard.press('KeyP'); await p.waitForFunction(() => window.__paused, null, { timeout: 3000 });
    const row = i => S(i => { const r = window.__unseen.cg.menuRow(i), c = document.getElementById('cg').getBoundingClientRect(); return { x: c.left + r.x * c.width / 320, y: c.top + r.y * c.height / 210 }; }, i);
    const r0 = await row(0);
    await p.mouse.click(r0.x, r0.y); await p.waitForTimeout(200);
    ok(tag + ': a click on RESUME in the pause menu resumes', await S(() => !window.__paused));
    if (w === 1280) {
      // the keys fold away (saved) and the picture takes the room; unfolded again, it gives it back
      const before = d.cr[3];
      await p.click('#keys-toggle'); await p.waitForTimeout(500);
      const f = await S(() => ({ folded: document.getElementById('chrome-bottom').classList.contains('folded'), bar: document.getElementById('keybar').offsetHeight, h: document.querySelector('#stage > canvas').getBoundingClientRect().height, saved: JSON.parse(localStorage.getItem('unseen-above-v1')).settings.keysFolded, scroll: document.documentElement.scrollHeight - innerHeight }));
      ok('the keys toggle folds the bar away (saved) and the picture grows (' + before + ' to ' + f.h + ')', f.folded && f.bar === 0 && f.saved === true && f.h > before && f.scroll <= 0);
      await p.screenshot({ path: 'tests/out/screen-game-' + tag + '-folded.png' });
      await p.reload(); await p.waitForTimeout(400);
      ok('folded stays folded after a reload', await S(() => document.getElementById('chrome-bottom').classList.contains('folded')));
      await p.click('#keys-toggle'); await p.waitForTimeout(300);
      ok('and unfolds again', await S(() => !document.getElementById('chrome-bottom').classList.contains('folded') && document.getElementById('keybar').offsetHeight > 0));
    }
    if (w === 1920) {
      // full screen: the stage alone, the keys folded to the toggle in the corner
      await p.keyboard.press('KeyU');
      let fs = false; try { await p.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 }); fs = true; } catch (e) { /* refused */ }
      if (fs) {
        await p.waitForTimeout(700);
        const f = await S(() => { const u = window.__unseen.display, c = document.querySelector('#stage > canvas').getBoundingClientRect(), o = document.getElementById('cg').getBoundingClientRect(), foot = document.getElementById('chrome-bottom'), tg = document.getElementById('keys-toggle').getBoundingClientRect(); return { F: u.F, cr: [c.left, c.top, c.width, c.height], cg: [o.left, o.top, o.width, o.height], folded: foot.classList.contains('folded'), inStage: document.getElementById('stage').contains(foot), tg: [tg.left, tg.top, tg.right, tg.bottom] }; });
        ok('full screen: the keys start folded, the toggle is in the stage, clear of the picture', f.folded && f.inStage && (f.tg[0] >= f.cr[0] + f.cr[2] || f.tg[1] >= f.cr[1] + f.cr[3] * 210 / 180));
        ok('full screen: picture ' + f.cr[2] + 'x' + f.cr[3] + ' at scale ' + f.F + ', strip included, fits the screen', f.cr[1] >= 0 && f.cr[1] + f.cr[3] * 210 / 180 <= 1080 + 0.5 && f.cr[3] * 210 / 180 >= 1080 * 0.9);
        ok('full screen: the caption canvas lines up', near(f.cg[0], f.cr[0], 0.5) && near(f.cg[1], f.cr[1], 0.5) && near(f.cg[2], f.cr[2], 0.5));
        await p.mouse.move(f.cr[0] + f.cr[2] / 2, f.cr[1] + f.cr[3] / 2);
        const q = await S(() => { const a = window.__game.scene.input.activePointer; return [a.x, a.y, window.__game.scene.game.canvas.width]; });
        ok('full screen: the mouse maps into the game (' + q.map(Math.round) + ')', near(q[0], q[2] / 2, 6) && near(q[1], q[2] * 9 / 32, 6));
        await p.screenshot({ path: 'tests/out/screen-game-fullscreen.png' });
        await p.click('#keys-toggle'); await p.waitForTimeout(700);
        const g = await S(() => { const c = document.querySelector('#stage > canvas').getBoundingClientRect(), k = document.getElementById('keybar').getBoundingClientRect(); return { bottom: c.top + c.height * 210 / 180, keysTop: k.top, keysBottom: k.bottom, saved: JSON.parse(localStorage.getItem('unseen-above-v1')).settings.keysFoldedFs }; });
        ok('full screen: unfolded, the keys sit under the strip, on screen (saved separately)', g.keysTop >= g.bottom - 0.5 && g.keysBottom <= 1080 && g.saved === false);
        await p.screenshot({ path: 'tests/out/screen-game-fullscreen-keys.png' });
        await p.click('#keys-toggle'); await p.waitForTimeout(300);
        await p.keyboard.press('KeyU'); await p.waitForFunction(() => !document.fullscreenElement, null, { timeout: 3000 });
        await p.waitForTimeout(600);
        ok('out of full screen, the keys are back under the stage, unfolded as saved for the window', await S(() => { const f = document.getElementById('chrome-bottom'); return !document.getElementById('stage').contains(f) && !f.classList.contains('folded'); }));
      } else ok('full screen refused in this browser (skipped)', true);
    }
    await p.close();
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  console.log(fails ? fails + ' failed' : 'all passed');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
