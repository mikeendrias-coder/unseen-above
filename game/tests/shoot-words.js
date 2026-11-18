// Narration lines after the text pass (Nov 18): stands her at a look, presses J, shoots the
// picture at 1x and checks the look took one strip row. node tests/shoot-words.js
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const OUT = process.env.UA_OUT || __dirname + '/out/';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  for (const [hash, match] of [['moon', /gold fountain/], ['moon', /LOST AND FOUND/], ['bedroom', /Three families/], ['grounds', /gate stands open/], ['bedroom', /grand piano/]]) {
    const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(hash + ': ' + e.message));
    await p.addInitScript(() => { window.__noPanels = true; window.__noDeath = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
    await p.goto(BASE + '/local.html#' + hash); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.clock > 0.6, null, { timeout: 30000, polling: 50 });
    if (hash === 'moon') await p.evaluate(() => { const s = window.__game.scene; s.npcs.forEach(N => { N.d = Object.assign({}, N.d, { speed: 0 }); N.x = -200; }); s.robotThing.off = true; });
    const i = await p.evaluate(src => { const re = new RegExp(src); return window.__game.scene.things.findIndex(t => t.look && t.src && re.test([].concat(typeof t.src.lines === 'function' ? t.src.lines() : t.src.lines).join(' '))); }, match.source);
    if (i < 0) { ok(hash + ' ' + match + ' found', false); await p.close(); continue; }
    let reached = false;
    for (const dx of [0, -8, 8, -16, 16, -4, 4]) {
      await p.evaluate(([i, dx]) => { const s = window.__game.scene, t = s.things[i], k = s.kid; s.bubbles.clear('item'); k.x = (t.x0 + t.x1) / 2 + dx - k.w / 2; k.y = Math.max(2, t.y0 - 30); k.vx = 0; k.vy = 0; k.onGround = false; }, [i, dx]);
      reached = await p.waitForFunction(i => { const s = window.__game.scene; return s.nearThing === s.things[i] && s.kid.onGround; }, i, { timeout: 1500, polling: 50 }).then(() => true, () => false);
      if (reached) break;
    }
    if (!reached) { ok(hash + ' ' + match + ' reached', false); await p.close(); continue; }
    const lines = await p.evaluate(i => { const L = window.__game.scene.things[i].src.lines; return typeof L === 'function' ? L() : L; }, i);
    for (let j = 0; j < lines.length; j++) {
      await p.keyboard.press('KeyJ'); await p.waitForTimeout(+(process.env.UA_WAIT || 1500));
      const rows = await p.evaluate(() => { const b = window.__game.scene.bubbles.list.get('item'); return b ? b.lines.length : 0; });
      ok(hash + ': "' + lines[j] + '" on ' + rows + ' row(s)', rows === 1);
      const c = await p.$('#stage'); await c.screenshot({ path: OUT + 'words-' + hash + '-' + i + '-' + j + '.png' });
    }
    await p.close();
  }
  ok('no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''), !errs.length);
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all ok');
  process.exit(fails ? 1 : 0);
})();
