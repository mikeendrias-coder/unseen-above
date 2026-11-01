// A sweep through the whole game for small errors: one or two frames from every part, with the
// text that shows there, in two looks. Writes tests/out/sweep-*.png and a contact sheet per look.
// node tests/sweep.js [look]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const look = process.argv[2] || 'A';
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], shots = [];
  const open = async (part, opts) => {
    opts = opts || {};
    const p = await b.newPage({ viewport: { width: 1360, height: 880 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(part + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(part + ': ' + m.text()); });
    await p.addInitScript(([l, panels]) => { if (!panels) window.__noPanels = true; window.__noDeath = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: l, episodes: {}, seenIntro: true })); } catch (e) {} }, [look, !!opts.panels]);
    await p.goto(BASE + '/local.html' + (part.startsWith('?') ? part : '#' + part)); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.isActive() && (window.__game.scene.clock || 0) > 0.3, null, { timeout: 60000 }).catch(() => {});
    return p;
  };
  const shot = async (p, n) => { const f = `tests/out/sweep-${look}-${n}.png`; await p.screenshot({ path: f, clip: { x: 40, y: 34, width: 1280, height: 720 } }); shots.push(f); };
  const ev = (p, fn, arg) => p.evaluate(fn, arg);
  // episode 1: the start as it comes from the opening, the crowbar, the scan
  let p = await open('grounds');
  await ev(p, () => { const o = window.__unseen.overlay; o.card('EPISODE 1', 'The Grounds', 3600, 'lower'); o.bug('CH 07', 3600); });
  await p.waitForTimeout(900); await shot(p, '01-grounds-start');
  await ev(p, () => { const s = window.__game.scene; s.kid.x = 17 * 16 + 6; s.kid.y = 120; });
  await p.waitForTimeout(400); await p.keyboard.press('KeyE'); await p.waitForTimeout(1300); await shot(p, '02-grounds-crowbar');
  await p.close();
  // episode 2: the glasses page, the robot
  p = await open('gallery', { panels: true });
  await ev(p, () => { const s = window.__game.scene; s.kid.x = 14 * 16 + 4; s.kid.y = 146; });
  await p.waitForFunction(() => window.__game.scene.nearThing === window.__game.scene.cabinetThing, null, { timeout: 5000 }).catch(() => {});
  await p.keyboard.press('KeyE');
  await p.waitForFunction(() => document.getElementById('panel').classList.contains('on'), null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(1300); await shot(p, '03-gallery-page');
  await p.keyboard.press('Space'); await p.waitForTimeout(600);
  await ev(p, () => { const s = window.__game.scene; s.robot.x = 31 * 16; s.kid.x = 29 * 16; s.kid.face = 1; });
  await p.waitForTimeout(500); await p.keyboard.press('KeyE'); await p.waitForTimeout(1500); await shot(p, '04-gallery-robot');
  await p.close();
  // the satellite, all four screens, with the lower third
  for (const n of [1, 2, 3, 4]) {
    p = await open('batch' + n);
    await p.waitForTimeout(1600); await shot(p, '05-batch' + n);
    await p.close();
  }
  // episode 3: the east wing as it comes from the fall: the sound caption, then the page
  p = await open('eastwing', { panels: true });
  await ev(p, () => { window.__unseen.overlay.sfx('[GLASS CRACKS]', 3000); });
  await p.waitForTimeout(500); await shot(p, '06-eastwing-crack');
  await ev(p, () => window.__unseen.itemPanel(window.__game.scene, 'cracked', true));
  await p.waitForTimeout(1300); await shot(p, '07-eastwing-page'); await p.keyboard.press('Space'); await p.waitForTimeout(400);
  await ev(p, () => { const s = window.__game.scene; s.placeTile(22, 6); s.noise(22, 7, 6, 'run'); });
  await p.waitForTimeout(500); await shot(p, '08-eastwing-robot');
  await p.close();
  // episode 4: the dark page, the brother
  p = await open('bedroom', { panels: true });
  await p.waitForFunction(() => document.getElementById('panel').classList.contains('on'), null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(1300); await shot(p, '09-bedroom-page'); await p.keyboard.press('Space'); await p.waitForTimeout(500);
  await ev(p, () => { const s = window.__game.scene; if (s.startBedroom) s.startBedroom(); else if (s.skipAhead) for (let i = 0; i < 8; i++) s.skipAhead(); });
  await p.waitForTimeout(6000); await shot(p, '10-bedroom-talk');
  await p.close();
  // the kids' room
  p = await open('kids');
  await p.waitForTimeout(2500); await shot(p, '11-kids');
  await p.close();
  // the Moon city, backstage, the playroom
  p = await open('moon');
  await ev(p, () => { const o = window.__unseen.overlay; o.card('EPISODE 5', 'The Moon', 3600, 'lower'); o.bug('CH 07', 3600); });
  await p.waitForTimeout(1000); await shot(p, '12-moon-start');
  await ev(p, () => { const s = window.__game.scene; s.kid.x = 40 * 16; });
  await p.waitForTimeout(2600); await shot(p, '13-moon-lounge');
  await ev(p, () => { const s = window.__game.scene; s.kid.x = 84 * 16; });
  await p.waitForTimeout(1200); await shot(p, '14-moon-boulevard');
  await p.close();
  p = await open('hallway', { panels: true });
  await ev(p, () => { const s = window.__game.scene; s.kid.x = 20 * 16 + 14; });
  await p.waitForFunction(() => !!window.__game.scene.sword.floor, null, { timeout: 40000 }).catch(() => {});
  await ev(p, () => { const s = window.__game.scene; s.kid.x = s.sword.floor.x - 4; s.pickUp(); });
  await p.waitForTimeout(1300); await shot(p, '15-hallway-page'); await p.keyboard.press('Space');
  await p.waitForFunction(() => window.__game.scene.mode === 'fight', null, { timeout: 20000 }).catch(() => {});
  await p.waitForFunction(() => ['windHi', 'windLo'].includes(window.__game.scene.cr.st), null, { timeout: 20000 }).catch(() => {});
  await shot(p, '16-hallway-fight');
  await p.close();
  p = await open('moon');
  await ev(p, () => window.__game.scene.scene.start('moon', { at: 'playroom' }));
  await p.waitForFunction(() => window.__game.scene.mode === 'room', null, { timeout: 15000 }).catch(() => {});
  await ev(p, () => { const s = window.__game.scene; s.kid.x = s.level.stand; });
  await p.waitForFunction(() => window.__game.scene.mode === 'talk' && window.__game.scene.talkI >= 2, null, { timeout: 20000 }).catch(() => {});
  await shot(p, '17-playroom');
  await p.close();
  // a contact sheet
  await (async () => {
    const q = await b.newPage({ viewport: { width: 1600, height: 1200 } });
    const fs = require('fs');
    const imgs = shots.map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
    await q.setContent('<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(3,533px);gap:2px">' + imgs.map(s => `<img src="${s}" style="width:533px;height:300px;image-rendering:pixelated">`).join('') + '</body>');
    await q.waitForTimeout(300);
    const rows = Math.ceil(imgs.length / 3);
    await q.setViewportSize({ width: 1603, height: rows * 302 });
    await q.screenshot({ path: `tests/out/sweep-${look}-sheet.png` });
  })();
  console.log(shots.length + ' frames');
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
