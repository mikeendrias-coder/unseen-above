// Episode 2, the gallery: every move the level asks for, played with the game's own physics.
// A bot drives the controls in game time with the cameras and the laser asleep, section by
// section; then the house's damage: the polisher's bump, the boards, the chandelier, the sheets.
// NODE_PATH=/home/michael/work/node_modules UA_BASE=http://localhost:8783 node tests/plan-ep2.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const T = 16, G = 336, M = 208;

async function botPage(p) {
  // window.__bot(policy source, seconds): the policy runs once a frame as (s, k, t, mem) and
  // returns { l, r, jump, hold, down }. Resolves with where she ended up.
  await p.evaluate(() => {
    window.__bot = (src, secs) => new Promise(done => {
      const s = window.__game.scene, real = s.ctl, pol = new Function('s', 'k', 't', 'mem', src), mem = {};
      let cache = { t: -1 }, t0 = s.clock;
      const cur = () => { if (cache.t !== s.clock) { const t = s.clock - t0; cache = Object.assign({ t: s.clock, used: false }, pol(s, s.kid, t, mem) || {}); } return cache; };
      s.ctl = Object.assign({}, real, {
        left: () => !!cur().l, right: () => !!cur().r, down: () => !!cur().down, up: () => !!cur().up,
        jumpHeld: () => !!(cur().hold || cur().jump), jumpPressed: () => { const c = cur(); if (c.jump && !c.used) { c.used = true; return true; } return false; },
        downP: () => false, interact: () => !!cur().use
      });
      const tick = () => {
        if (s.clock - t0 >= secs || mem.stop) { s.ctl = real; const k = s.kid; done({ x: Math.round(k.x), y: Math.round(k.y + k.h), hp: k.hp, ground: k.onGround, dead: s.dead, mem }); return; }
        requestAnimationFrame(tick);
      };
      tick();
    });
  });
}
const place = (p, x, feet) => p.evaluate(([x, feet]) => { const s = window.__game.scene, k = s.kid; if (s.dyn) s.dyn.riding = null; k.x = x; k.h = 14; k.crouch = false; k.y = feet - 14; k.vx = 0; k.vy = 0; k.peakY = k.y; k.onGround = false; k.hp = 3; k.inv = 0; }, [x, feet]);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let fails = 0; const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  await p.goto(BASE + '/local.html?scene=gallery'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid && window.__game.scene.clock > 0.5, null, { timeout: 30000 });
  const quiet = () => p.evaluate(() => { const s = window.__game.scene; s.cams.forEach(c => { c.range = 0; }); s.laser.awake = false; s.laserDef.x0 = 99999; });
  await quiet(); await p.evaluate(() => { window.__noDeath = true; });
  await botPage(p);
  const run = (src, secs) => p.evaluate(([src, secs]) => window.__bot(src, secs), [src, secs]);

  // B: up the broken stair: the steps, the landing (under the desk), the hanging steps, the gap
  await place(p, 18 * T, G);
  // the steps up to the landing have faces she bumps into; the hanging steps are jumped at set spots
  let r = await run(`
    if (k.onGround && k.y + k.h === 208 && k.x >= 33 * 16) mem.stop = 1;
    const feet = k.y + k.h, wall = s.boxHits(k.x + 3, k.y, k.w, k.h);
    const spots = [[27 * 16 + 2, 288, 28 * 16 + 4], [29 * 16 + 2, 256, 30 * 16 + 4], [31 * 16 + 4, 224, 99999]];
    if (k.onGround) { mem.aim = null; for (const [x, f, aim] of spots) if (feet === f && k.x >= x) { mem.aim = aim; (mem.trail = mem.trail || []).push([Math.round(k.x), feet]); return { r: 1, jump: 1, hold: 1 }; } }
    if (!k.onGround && mem.aim) return { r: k.x < mem.aim, hold: 1 };
    return { r: 1, jump: k.onGround && wall, hold: 1 };`, 8);
  ok(`B: up the stair to the upper floor (feet ${r.y}, x ${r.x}) ${JSON.stringify(r.mem.trail)}`, r.y === M && r.x >= 33 * T);
  // C: ride the two chandeliers over the atrium to the far floor
  await place(p, 35 * T + 4, M);
  r = await run(`
    const [a, c] = s.swings, ride = s.dyn.riding;
    if (k.onGround && k.x >= 54 * 16) { mem.stop = 1; return {}; }
    if (!ride && !k.onGround && k.x < 37 * 16 && !mem.go) return { hold: 1 };
    if (!ride && k.onGround && k.x < 40 * 16) { if (a.ex < 38 * 16 + 2 && a.vx < 0 && Math.abs(k.x - 572) < 3) return { jump: 1, hold: 1 }; return { r: k.x < 570, l: k.x > 574 }; }
    if (ride) mem.go = 1;
    if (ride === a) { if (c.ex - a.ex < 26 && a.vx > 0) { mem.a = 1; return { jump: 1, hold: 1 }; } return {}; }
    if (ride === c) { mem.c = 1; if (c.ex > 53 * 16 && c.vx > 0) return { jump: 1, hold: 1, r: 1 }; return {}; }
    return { r: 1, hold: 1 };`, 14);
  ok(`C: two chandeliers to the far floor (feet ${r.y}, x ${r.x}, ${JSON.stringify(r.mem)})`, r.y === M && r.x >= 54 * T);
  // D: double jump over the boards before they go
  await place(p, 58 * T, M);
  r = await run(`if (k.onGround && k.x > 64 * 16 + 2) { mem.stop = 1; return {}; } if (!mem.a && k.x > 59 * 16 + 6) { mem.a = t; return { r: 1, jump: 1, hold: 1 }; } if (mem.a && !mem.b && t - mem.a > 0.32) { mem.b = 1; return { r: 1, jump: 1, hold: 1 }; } return { r: 1, hold: 1 };`, 4);
  ok(`D: over the boards in one long jump (feet ${r.y}, x ${r.x})`, r.y === M && r.x > 64 * T);
  // D: standing on the boards, they drop her into the pocket; a double jump gets her out
  await place(p, 61 * T, M);
  r = await run(`return {};`, 1.6);
  ok(`D: the boards give way (feet ${r.y})`, r.y === 16 * T);
  r = await run(`if (!mem.a) { mem.a = t; return { jump: 1, hold: 1 }; } if (!mem.b && t - mem.a > 0.1 && k.vy > -40) { mem.b = 1; return { jump: 1, hold: 1, r: 1 }; } if (k.onGround && k.y + k.h === 208) mem.stop = 1; return { r: mem.b, hold: 1 };`, 3);
  ok(`D: out of the pocket with a double jump (feet ${r.y})`, r.y === M);
  // E: down the broken stair into the laser hall without a hurt
  await p.evaluate(() => { window.__noDeath = false; window.__game.scene.drop.phase = 'down'; });
  await place(p, 71 * T, M);
  r = await run(`if (k.onGround && k.y + k.h === 336) mem.stop = 1; return { r: 1 };`, 4);
  ok(`E: down into the laser hall, no harm (feet ${r.y}, hp ${r.hp})`, r.y === G && r.hp === 3);

  // the house's damage (watchers still off)
  await place(p, 56 * T, M); await p.evaluate(() => { const s = window.__game.scene; s.polisher.x = 58 * 16; s.polisher.dir = -1; });
  r = await run(`if (k.hp < 3) mem.stop = 1; return {};`, 2.5);
  ok(`D: the polisher bumps her: hp ${r.hp}`, r.hp === 2);
  await place(p, 54 * T, M); await p.evaluate(() => { const s = window.__game.scene; s.polisher.x = 58 * 16; s.polisher.dir = -1; });
  r = await run(`const Q = s.polisher; if (k.onGround && Math.abs(Q.x - (k.x + 4)) < 30 && !mem.j) { mem.j = t; return { jump: 1, hold: 1, r: 1 }; } return { r: mem.j != null && t - mem.j < 0.6, hold: 1 };`, 2.5);
  ok(`D: jumping over the polisher: hp ${r.hp}`, r.hp === 3);
  await p.evaluate(() => { const s = window.__game.scene; s.drop.phase = 'hang'; s.drop.y = 150; s.props = s.props.filter(r => r.id !== 'fallen chandelier'); });
  await place(p, 68 * T + 4, M);
  r = await run(`return {};`, 2);
  ok(`D: standing under the chandelier when it drops: hp ${r.hp}`, r.hp === 1);
  // the chandeliers swing out of reach first, or she may catch one on the way down
  await p.evaluate(() => window.__game.scene.swings.forEach(w => { w.ax = -999; }));
  await place(p, 36 * T + 4, M);
  r = await run(`if (!mem.a) { mem.a = 1; return { jump: 1, hold: 1, r: 1 }; } return { r: k.x < 42 * 16 };`, 3);
  ok(`C: a fall into the atrium lands on the dust sheets: hp ${r.hp} (no more than 2 lost), feet ${r.y}`, r.hp >= 1 && r.y === G && !r.dead);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
