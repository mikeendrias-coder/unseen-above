// Opens each part by its link and reports page errors: node tests/smoke.js [part,part,...]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const parts = (process.argv[2] || 'grounds,gallery,batch1,batch2,kids').split(',');
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const part of parts) {
    const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(BASE + '/local.html#' + part); await p.click('#start');
    let ok = true; try { await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.isActive(), null, { timeout: 30000 }); await p.waitForTimeout(2500); } catch (e) { ok = false; }
    const key = await p.evaluate(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key);
    console.log((ok && !errs.length ? 'ok   ' : 'FAIL ') + '#' + part + ' -> ' + key + (errs.length ? '\n     ' + errs.slice(0, 3).join('\n     ') : ''));
    await p.close();
  }
  await b.close();
})();
