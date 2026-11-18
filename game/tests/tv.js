// The secret TV (Nov 18): an old set beside the ep1 book, behind where she starts. J on it turns it
// on: the set fills the picture, the trailer (trailer.mp4) plays inside its screen as a <video> laid
// over the drawn screen (checked at two window sizes and in full screen), the scene waits and the
// game's sound is held. Space pauses and goes on, A and D (and the knobs) go back or on 10 s, Esc
// (or J, or the power knob) turns it off and the scene goes on; at the end of the tape the set
// clicks off. No mp4: the in-engine trailer (trailer.html) plays in the same place; no trailer page
// either: a paper slip says where it is, R opens it. Screenshots at 1x in tests/out/tv-*.png.
// Run with game/dist served (UA_BASE, default http://localhost:8766) and trailer.mp4 in dist.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const MP4 = fs.readFileSync(path.join(__dirname, '..', 'dist', 'trailer.mp4'));
const ARGS = ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
(async () => {
  let b = await chromium.launch({ args: ARGS });
  let g = null;
  // each part in a browser of its own (a page that went full screen can leave the next one waiting)
  const fresh = async () => { await b.close(); b = await chromium.launch({ args: ARGS }); };
  let fails = 0;
  const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  const near = (a, c, d) => Math.abs(a - c) <= (d == null ? 1 : d);
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  const errs = [];
  async function page(w, h, opts) {
    opts = opts || {};
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await p.addInitScript(() => { window.__noPanels = true; window.open = u => { window.__opened = (window.__opened || []).concat(String(u)); return null; }; });
    if (opts.noMp4) await p.route('**/trailer.mp4', r => r.fulfill({ status: 404, body: 'gone' }));
    // python's http.server answers no byte ranges, so a video served by it cannot seek; GitHub Pages
    // and a file on disk can. Serve the tape here with ranges, as the site does.
    else await p.route('**/trailer.mp4', r => {
      const range = r.request().headers().range, size = MP4.length;
      const m = range && /bytes=(\d*)-(\d*)/.exec(range);
      if (!m) return r.fulfill({ status: 200, headers: { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': String(size) }, body: MP4 });
      const a = m[1] ? Number(m[1]) : 0, z = Math.min(size - 1, m[2] ? Number(m[2]) : Math.min(size - 1, a + 4 * 1024 * 1024 - 1));
      return r.fulfill({ status: 206, headers: { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Range': 'bytes ' + a + '-' + z + '/' + size, 'Content-Length': String(z - a + 1) }, body: MP4.subarray(a, z + 1) });
    });
    if (opts.noPage) await p.route('**/trailer.html', r => r.fulfill({ status: 404, contentType: 'text/html', body: '<!doctype html><title>404</title><p>Not found</p>' }));
    await p.goto(BASE + '/local.html'); await p.evaluate(() => { try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
    await p.goto('about:blank'); await p.goto(BASE + '/local.html#grounds'); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'grounds' && window.__game.scene.kid && window.__game.scene.clock > 1.2, null, { timeout: 30000, polling: 50 }).catch(async e => { console.log('stuck at', await p.evaluate(() => [location.href, window.__game && window.__game.scene && window.__game.scene.sys.settings.key, document.getElementById('tv') && !document.getElementById('tv').hidden])); throw e; });
    await p.waitForTimeout(300);
    return p;
  }
  const S = (p, fn, a) => p.evaluate(fn, a);
  const until = (p, fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 15000, polling: 50 });
  const shot = (p, n) => p.screenshot({ path: path.join(__dirname, 'out', 'tv-' + n + '.png') });
  // walk her to the set and press J
  async function turnOn(p) {
    await S(p, () => { const s = window.__game.scene; s.kid.x = s.tv.at.x + 13; s.kid.vx = 0; window.__noDeath = true; });
    await until(p, () => window.__game.scene.nearThing && window.__game.scene.nearThing.tv);
    await p.keyboard.press('KeyJ');
    await until(p, () => window.__tvUp && window.__tv.phase !== 'warm');
  }
  // the video (or the trailer page) against the drawn screen, in CSS px
  const geom = p => S(p, () => {
    const set = document.querySelector('#tvset canvas').getBoundingClientRect(), cg = document.getElementById('cg').getBoundingClientRect();
    const P = window.__tv.pic, k = set.width / 320;
    const pic = window.__tv.mode === 'video' ? window.__tv.video : window.__tv.frame;
    const v = pic.getBoundingClientRect();
    const scr = { x: set.left + P.x * k, y: set.top + P.y * k, w: P.w * k, h: P.h * k };
    // the drawn frame around the screen: the bezel's dark ring just outside it, the case further out
    const c = document.querySelector('#tvset canvas').getContext('2d');
    const px = (x, y) => Array.from(c.getImageData(x, y, 1, 1).data.slice(0, 3)).map(n => n.toString(16).padStart(2, '0')).join('');
    return { set: [set.left, set.top, set.width, set.height], cg: [cg.left, cg.top, cg.width, cg.height * 180 / 210], v: [v.left, v.top, v.width, v.height], scr: [scr.x, scr.y, scr.w, scr.h], bezel: px(P.x - 2, P.y + 20), lip: px(P.x - 5, P.y + 20), caseC: px(P.x - 10, P.y + 20), fs: !!document.fullscreenElement };
  });
  const fits = g => near(g.v[0], g.scr[0]) && near(g.v[1], g.scr[1]) && near(g.v[2], g.scr[2]) && near(g.v[3], g.scr[3]) && near(g.set[0], g.cg[0]) && near(g.set[1], g.cg[1]) && near(g.set[2], g.cg[2]) && near(g.set[3], g.cg[3]);

  // ---------------------------------------------------------------- the set in the level, the tape
  let p = null;
  if (!process.env.TV_ONLY_FALLBACK) {
  p = await page(1280, 860);
  const lv = await S(p, () => { const s = window.__game.scene, bk = s.books.find(q => q.n === 1); return { tv: s.tv && s.tv.at, book: bk.at, start: s.level.start.x, kid: s.kid.x, near: s.nearThing && s.nearThing.tv }; });
  ok('ep1: the TV stands beside the book (' + JSON.stringify(lv.tv) + ', book at ' + JSON.stringify(lv.book) + '), behind where she starts (' + lv.kid + '), out of reach at the start', lv.tv && lv.tv.x > lv.book.x && lv.tv.x - lv.book.x < 30 && lv.tv.x < lv.kid && !lv.near);
  await S(p, () => { const s = window.__game.scene; s.kid.x = s.tv.at.x + 13; s.kid.vx = 0; });
  await until(p, () => window.__game.scene.nearThing && window.__game.scene.nearThing.tv);
  await p.waitForTimeout(250);
  await shot(p, 'level');
  ok('beside it, J finds the TV (the book beside it is still its own thing)', await S(p, () => { const s = window.__game.scene; s.kid.x = s.books[0].at.x - 2; return true; }) && await until(p, () => window.__game.scene.nearThing && window.__game.scene.nearThing.book).then(() => true, () => false));
  await turnOn(p);
  const on = await S(p, () => ({ paused: window.__game.scene.scene.isPaused(), held: window.__unseen.Sound.held, story: window.__game.state.story.tv, cc: document.getElementById('cc').textContent, controls: window.__tv.video.controls || window.__tv.video.hasAttribute('controls'), mode: window.__tv.mode, src: window.__tv.video.getAttribute('src'), menu: !!window.__paused }));
  ok('J turns it on: the trailer (' + on.src + ') in the set, the scene waits, the game sound is held', on.mode === 'video' && on.src === 'trailer.mp4' && on.paused && on.held);
  ok('the first time she says: "' + on.cc + '"; the story keeps it (tv: ' + on.story + ')', /Somebody left the TV on out here\./.test(on.cc) && on.story === true);
  ok('no browser controls on the video', !on.controls);
  await until(p, () => window.__tv.video.currentTime > 0.5 && !window.__tv.video.paused, null, 20000).catch(() => {});
  const t1 = await S(p, () => window.__tv.video.currentTime); await p.waitForTimeout(1500);
  const t2 = await S(p, () => window.__tv.video.currentTime);
  ok('the video plays, its time goes on (' + t1.toFixed(2) + ' s to ' + t2.toFixed(2) + ' s)', t2 > t1 + 0.8);
  g = await geom(p);
  ok('1280x860: the video sits exactly in the drawn screen (' + g.v.map(n => n.toFixed(1)) + ' vs ' + g.scr.map(n => n.toFixed(1)) + '), the set over the picture', fits(g));
  ok('the drawn frame: dark bezel, lip and grey case around the screen (' + g.bezel + ', ' + g.lip + ', ' + g.caseC + ')', g.bezel === '0e0f12' && g.lip === '1b1c21' && g.caseC === '2e3036');
  // Space pauses, Space goes on
  await p.keyboard.press('Space'); await p.waitForTimeout(400);
  const pa = await S(p, () => ({ paused: window.__tv.video.paused, t: window.__tv.video.currentTime, menu: !!window.__paused }));
  await p.waitForTimeout(600);
  const pb = await S(p, () => window.__tv.video.currentTime);
  ok('Space pauses (time stays at ' + pa.t.toFixed(2) + ')', pa.paused && near(pb, pa.t, 0.05) && !pa.menu);
  await p.keyboard.press('Space'); await p.waitForTimeout(700);
  ok('Space again goes on', await S(p, t => !window.__tv.video.paused && window.__tv.video.currentTime > t + 0.2, pa.t));
  // D and A: on and back 10 s; a click on the +10 knob
  const s0 = await S(p, () => window.__tv.video.currentTime);
  await p.keyboard.press('KeyD'); await p.waitForTimeout(300);
  const s1 = await S(p, () => window.__tv.video.currentTime);
  ok('D goes on 10 s (' + s0.toFixed(1) + ' to ' + s1.toFixed(1) + ')', near(s1 - s0, 10, 1.2));
  await p.keyboard.press('KeyA'); await p.waitForTimeout(300);
  const s2 = await S(p, () => window.__tv.video.currentTime);
  ok('A goes back 10 s (' + s1.toFixed(1) + ' to ' + s2.toFixed(1) + ')', near(s1 - s2, 10, 1.2));
  const kn = await S(p, () => { const r = document.querySelector('#tvset canvas').getBoundingClientRect(), k = window.__tv.knobs.fwd, u = r.width / 320; return [r.left + k.x * u, r.top + k.y * u]; });
  await p.mouse.click(kn[0], kn[1]); await p.waitForTimeout(300);
  const s3 = await S(p, () => window.__tv.video.currentTime);
  ok('a click on the +10 knob goes on 10 s (' + s2.toFixed(1) + ' to ' + s3.toFixed(1) + ')', near(s3 - s2, 10, 1.2));
  // mid-trailer, for the picture
  await S(p, () => { window.__tv.video.currentTime = 84; }); await p.waitForTimeout(1600);
  await shot(p, 'playing');
  // a second window size
  await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(600);
  g = await geom(p);
  ok('1440x900: the video still sits exactly in the drawn screen (' + g.v.map(n => n.toFixed(1)) + ' vs ' + g.scr.map(n => n.toFixed(1)) + ')', fits(g));
  await p.setViewportSize({ width: 1000, height: 700 }); await p.waitForTimeout(600);
  g = await geom(p);
  ok('1000x700 (a fractional scale): the video still sits exactly in the drawn screen (' + g.v.map(n => n.toFixed(1)) + ' vs ' + g.scr.map(n => n.toFixed(1)) + ')', fits(g));
  // full screen (U)
  await p.setViewportSize({ width: 1280, height: 860 }); await p.waitForTimeout(300);
  await p.keyboard.press('KeyU');
  let fsOn = false; try { await until(p, () => !!document.fullscreenElement, null, 3000); fsOn = true; } catch (e) { /* refused */ }
  if (fsOn) {
    await p.waitForTimeout(600);
    g = await geom(p);
    ok('full screen: the set is still up, the video sits exactly in the drawn screen (' + g.v.map(n => n.toFixed(1)) + ' vs ' + g.scr.map(n => n.toFixed(1)) + ')', g.fs && fits(g) && await S(p, () => window.__tvUp));
    await shot(p, 'fullscreen');
    await p.keyboard.press('KeyU'); await until(p, () => !document.fullscreenElement, null, 3000).catch(() => {});
    await p.waitForTimeout(300);
  } else ok('full screen refused in this browser (skipped)', true);
  // Esc turns it off; the scene goes on, the sound comes back, no pause menu
  await p.keyboard.press('Escape');
  await until(p, () => !window.__tvUp, null, 3000);
  await p.waitForTimeout(250);
  const off = await S(p, () => ({ paused: window.__game.scene.scene.isPaused(), held: window.__unseen.Sound.held, menu: !!window.__paused, hidden: document.getElementById('tvset').hidden, vid: window.__tv.video.paused }));
  ok('Esc turns it off: the set goes, the tape stops, the scene goes on, the sound comes back, no pause menu', !off.paused && !off.held && !off.menu && off.hidden && off.vid);
  const x0 = await S(p, () => window.__game.scene.kid.x);
  await p.keyboard.down('KeyD'); await p.waitForTimeout(400); await p.keyboard.up('KeyD');
  ok('she walks again after it', await S(p, x => window.__game.scene.kid.x > x + 4, x0));
  // again: no line the second time; it picks up where it was; at the end of the tape the set clicks off
  await turnOn(p);
  const again = await S(p, () => ({ first: window.__tv.first, t: window.__tv.video.currentTime }));
  ok('on again: no first-time line, the tape is where it was (' + again.t.toFixed(1) + ' s)', again.first === false && again.t > 60);
  await S(p, () => { const v = window.__tv.video; v.currentTime = v.duration - 1.2; });
  await until(p, () => !window.__tvUp, null, 8000).then(() => ok('at the end of the tape the set clicks off and the scene goes on', true), () => ok('at the end of the tape the set clicks off', false));
  await p.waitForTimeout(200);
  ok('after the end, the scene runs', await S(p, () => !window.__game.scene.scene.isPaused()));
  // the power knob, and J
  await turnOn(p);
  ok('after the end, on again starts the tape from the top', await S(p, () => window.__tv.video.currentTime < 5));
  await p.waitForTimeout(400);
  const pw = await S(p, () => { const r = document.querySelector('#tvset canvas').getBoundingClientRect(), k = window.__tv.knobs.power, u = r.width / 320; return [r.left + k.x * u, r.top + k.y * u]; });
  await p.mouse.click(pw[0], pw[1]);
  await until(p, () => !window.__tvUp, null, 3000).then(() => ok('a click on the power knob turns it off', true), () => ok('a click on the power knob turns it off', false));
  await p.waitForTimeout(300);
  await turnOn(p); await p.waitForTimeout(400);
  await p.keyboard.press('KeyJ');
  await until(p, () => !window.__tvUp, null, 3000).then(() => ok('J turns it off too', true), () => ok('J turns it off too', false));
  await p.waitForTimeout(300);
  // a click on the set in the level turns it on too
  await S(p, () => { const s = window.__game.scene; s.kid.x = s.tv.at.x + 40; });
  await p.waitForTimeout(300);
  const at = await S(p, () => { const s = window.__game.scene, cam = s.cameras.main, c = s.game.canvas.getBoundingClientRect(), k = c.width / 320; const wx = s.tv.at.x, wy = s.tv.at.y - 10; return [c.left + (wx - cam.worldView.x) * k, c.top + (wy - cam.worldView.y) * k]; });
  await p.mouse.click(at[0], at[1]);
  await until(p, () => window.__tvUp, null, 3000).then(() => ok('a click on the set turns it on', true), () => ok('a click on the set turns it on', false));
  await p.waitForTimeout(500); await p.keyboard.press('Escape'); await until(p, () => !window.__tvUp, null, 3000).catch(() => {});
  // the book beside it still opens its slip
  await S(p, () => { const s = window.__game.scene; s.kid.x = s.books[0].at.x - 2; s.kid.vx = 0; });
  await until(p, () => window.__game.scene.nearThing && window.__game.scene.nearThing.book);
  await p.keyboard.press('KeyJ');
  await until(p, () => window.__unseen.cg.pageSpec && window.__unseen.cg.pageSpec.kind === 'exhibit' && window.__unseen.cg.pageUp, null, 5000).then(() => ok('the book beside it still opens its EXHIBIT slip', true), () => ok('the book beside it still opens its EXHIBIT slip', false));
  await p.waitForTimeout(450); await p.keyboard.press('KeyJ'); await until(p, () => !window.__unseen.cg.pageUp, null, 3000).catch(() => {});
  await p.close();
  }

  // ---------------------------------------------------------------- no mp4: the trailer page in the set
  await fresh();
  p = await page(1280, 860, { noMp4: true });
  await turnOn(p);
  await until(p, () => window.__tv.mode === 'frame', null, 8000).then(() => ok('no trailer.mp4: the set falls back to the in-engine trailer', true), () => ok('no trailer.mp4: the set falls back to the in-engine trailer', false));
  const fr = await until(p, () => { const f = window.__tv.frame; try { const d = f.contentDocument; return f.style.visibility === 'visible' && d && d.getElementById('tr-start') && d.getElementById('tr-start').hidden; } catch (e) { return false; } }, null, 20000).then(() => true, () => false);
  ok('trailer.html plays inside the set (its start screen pressed for her)', fr);
  await p.waitForTimeout(4000);
  g = await geom(p);
  ok('the trailer page sits exactly in the drawn screen (' + g.v.map(n => n.toFixed(1)) + ' vs ' + g.scr.map(n => n.toFixed(1)) + ')', fits(g));
  const tt = await S(p, () => { try { return window.__tv.frame.contentWindow.__trailerInfo.t; } catch (e) { return -1; } });
  ok('its clock runs (' + tt.toFixed(1) + ' s in)', tt > 1);
  ok('the keys stay with the set (focus is back on the game page, no click-the-game note)', await S(p, () => document.activeElement !== window.__tv.frame && document.getElementById('focus-note').hidden));
  await shot(p, 'fallback');
  await p.keyboard.press('Space'); await p.waitForTimeout(400);
  ok('Space pauses the trailer page too', await S(p, () => !window.__tv.frame.contentDocument.getElementById('tr-paused').hidden));
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  ok('Space again goes on', await S(p, () => window.__tv.frame.contentDocument.getElementById('tr-paused').hidden));
  await p.keyboard.press('Escape');
  await until(p, () => !window.__tvUp, null, 3000);
  await p.waitForTimeout(250);
  ok('Esc turns it off; the trailer page is let go; the scene goes on', await S(p, () => !window.__game.scene.scene.isPaused() && window.__tv.frame.getAttribute('src') === 'about:blank'));
  await p.close();

  // ---------------------------------------------------------------- no mp4, no trailer page: the slip
  await fresh();
  p = await page(1280, 860, { noMp4: true, noPage: true });
  await turnOn(p);
  await until(p, () => window.__tv.mode === 'slip', null, 15000).then(() => ok('no trailer page either: a paper slip says where the trailer is', true), () => ok('no trailer page either: the slip', false));
  await p.waitForTimeout(400);
  await shot(p, 'slip');
  await p.keyboard.press('KeyR'); await p.waitForTimeout(200);
  ok('R opens trailer.html in a new tab (' + await S(p, () => (window.__opened || []).join(', ')) + ')', await S(p, () => (window.__opened || []).slice(-1)[0] === 'trailer.html'));
  await p.keyboard.press('KeyJ');
  await until(p, () => !window.__tvUp, null, 3000).then(() => ok('J puts it away', true), () => ok('J puts it away', false));
  await p.close();

  ok('no page errors (' + errs.slice(0, 3).join(' | ') + ')', errs.length === 0);
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all ok');
  process.exit(fails ? 1 : 0);
})();
