const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + '\n' + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8766/local.html');
  await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.T);
  await p.evaluate(() => { const s = window.__game.scene; s.t = s.T.end - 0.05; });
  for (let i = 0; i < 8; i++) { await p.waitForTimeout(1000); console.log(await p.evaluate(() => { const s = window.__game.scene; return s.sys.settings.key + ' t=' + (s.t ? s.t.toFixed(2) : '-') + ' done=' + s.done + ' active=' + window.__unseen.game.scene.getScenes(true).map(x => x.sys.settings.key).join(','); })); }
  console.log(errs.slice(0, 5).join('\n---\n') || 'no errors');
  await b.close();
})();
