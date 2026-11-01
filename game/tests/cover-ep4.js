// Episode 4 cover map: for each flash camera, the floor spans it sees standing and crouched, at its
// resting aim, and the spans where she is hidden (under a table, behind a chest). node tests/cover-ep4.js
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  await p.goto(BASE + '/local.html#bedroom'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'bedroom' && window.__game.scene.clock > 0.3, null, { timeout: 60000 });
  const out = await p.evaluate(() => {
    const s = window.__game.scene, k = s.kid, res = [];
    const inPoly = (pts, x, y) => { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
    s.cams.forEach(cm => {
      const cone = s.cone(cm.x, cm.y, cm.aim, cm.half, cm.range), spans = { stand: [], crouch: [] };
      ['stand', 'crouch'].forEach(pose => {
        let run = null;
        for (let x = 0; x < 1000; x += 1) {
          k.x = x; k.h = pose === 'stand' ? 14 : 9; k.y = 160 - k.h;
          if (s.boxHits(k.x, k.y, k.w, k.h)) { if (run) { spans[pose].push(run); run = null; } continue; }
          const seen = s.probes().some(q => inPoly(cone, q.x, q.y));
          if (seen && !run) run = [x, x]; else if (seen) run[1] = x; else if (run) { spans[pose].push(run); run = null; }
        }
        if (run) spans[pose].push(run);
      });
      res.push(cm.id + ' (period ' + cm.period + ' s): standing seen at ' + spans.stand.map(r => r.join('-')).join(', ') + ' | crouched seen at ' + spans.crouch.map(r => r.join('-')).join(', '));
    });
    k.x = 32; k.h = 14; k.y = 146;
    return res;
  });
  out.forEach(l => console.log(l));
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
