// The trailer (dist/trailer.html, src/trailer): loads it, clicks Play, and checks it plays every
// shot in order to the end screen with no console errors; then Space pauses and resumes it, and
// Esc stops it. The trailer keeps time by the audio clock, so a full run takes its length (about
// three minutes). QUICK=1 plays four short stretches instead (?from=<shot>&only).
// Serve dist first: (cd dist && python3 -m http.server 8766)
// node tests/trailer.js   (UA_BASE=http://localhost:8881 for another port)
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const QUICK = !!process.env.QUICK;
const fail = [];
const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fail.push(what); };

async function open(b, query) {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(BASE + '/trailer.html' + (query || ''));
  await p.waitForSelector('#tr-play');
  return { p, errs };
}
// play until the end screen (or the time runs out); the shots seen, in order
async function watch(p, secs) {
  const seen = [];
  const t0 = Date.now();
  while (Date.now() - t0 < secs * 1000) {
    const s = await p.evaluate(() => ({ shot: window.__trailerInfo.shot, done: !!window.__trailerDone }));
    if (s.shot && seen[seen.length - 1] !== s.shot) seen.push(s.shot);
    if (s.done) break;
    await p.waitForTimeout(150);
  }
  return seen;
}

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const { p, errs } = await open(b);
  const info = await p.evaluate(() => window.__trailerInfo);
  const ids = info.shots.map(s => s.id);
  check(info.length >= 120 && info.length <= 240, `length ${info.length.toFixed(1)} s is 2 to 4 minutes`);
  check(await p.isVisible('#tr-start'), 'the start screen is up before a click');

  if (!QUICK) {
    await p.click('#tr-play');
    const seen = await watch(p, info.length + 30);
    const missing = ids.filter(id => !seen.includes(id));
    check(!missing.length, `every shot played (${seen.length}/${ids.length})` + (missing.length ? ', missing: ' + missing.join(' ') : ''));
    check(seen.join() === ids.filter(id => seen.includes(id)).join(), 'in order');
    check(await p.evaluate(() => window.__trailerDone), 'it ends');
    check(await p.isVisible('#tr-end'), 'the end screen comes up');
  } else {
    for (const [from, secs] of [['ridge', 8], ['climb', 6], ['form1', 6], ['fight', 9]]) {
      const r = await open(b, `?from=${from}&only`);
      await r.p.click('#tr-play');
      const seen = await watch(r.p, secs);
      check(seen[0] === from || seen.includes(from), `?from=${from} plays ${from} (${seen.join(' ')})`);
      errs.push(...r.errs); await r.p.close();
    }
  }

  // Space pauses (the clock stops), Space goes on, Esc stops
  const r = await open(b, '?from=lawn');
  await r.p.click('#tr-play');
  await r.p.waitForTimeout(1500);
  await r.p.keyboard.press('Space');
  const a = await r.p.evaluate(() => window.__trailerInfo.t);
  await r.p.waitForTimeout(1200);
  const a2 = await r.p.evaluate(() => window.__trailerInfo.t);
  check(Math.abs(a2 - a) < 0.05 && await r.p.isVisible('#tr-paused'), 'Space pauses');
  await r.p.keyboard.press('Space');
  await r.p.waitForTimeout(800);
  check((await r.p.evaluate(() => window.__trailerInfo.t)) > a2 + 0.4, 'Space goes on');
  await r.p.keyboard.press('Escape');
  await r.p.waitForTimeout(300);
  check(await r.p.evaluate(() => window.__trailerDone) && await r.p.isVisible('#tr-end'), 'Esc stops at the end screen');
  errs.push(...r.errs);
  // the trailer never writes the game's save
  check(await r.p.evaluate(() => { try { return window.localStorage.length === 0 || !Object.keys(window.localStorage).some(k => /^unseen-above/.test(k)); } catch (e) { return true; } }), "the game's save is left alone");

  check(!errs.length, 'no console errors' + (errs.length ? ':\n  ' + errs.slice(0, 10).join('\n  ') : ''));
  await b.close();
  console.log(fail.length ? `${fail.length} failed` : 'all passed');
  process.exit(fail.length ? 1 : 0);
})();
