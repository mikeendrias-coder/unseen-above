const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1320, height: 1200 } });
  await p.goto('file:///home/claude/game/looks/preview.html');
  const rows = await p.$$('.row');
  for (let i = 0; i < rows.length; i++) { await rows[i].screenshot({ path: `/home/claude/game/looks/row${i}.png` }); }
  await b.close(); console.log('shots', rows.length);
})();
