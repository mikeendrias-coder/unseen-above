// Episode 1, the climb: every move the level asks for, played with the game's own physics.
// A bot drives the controls in game time (so slow headless frames change nothing) with the
// watchers switched off, section by section, and checks she gets where the level means her to.
// Then two checks with the house's damage on: a fall off the terrace costs HP; the cradle carries.
// NODE_PATH=/home/michael/work/node_modules UA_BASE=http://localhost:8783 node tests/plan-ep1.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const T = 16;

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
  await p.goto(BASE + '/local.html?scene=grounds'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.kid && window.__game.scene.clock > 0.5, null, { timeout: 30000 });
  // watchers off, deaths off: this part is only about where she can get to
  await p.evaluate(() => { const s = window.__game.scene; window.__noDeath = true; s.lights.forEach(l => { l.range = 0; }); s.drones.forEach(d => { d.range = 0; }); });
  await botPage(p);
  const run = (src, secs) => p.evaluate(([src, secs]) => window.__bot(src, secs), [src, secs]);

  // A: from the start over the burnt car to the gate (hold right, jump at the car)
  await place(p, 3 * T, 400);
  let r = await run(`return { r: 1, jump: k.x > 76 && k.x < 84 && k.onGround, hold: 1 };`, 4);
  ok(`A: over the car to the gate (x ${r.x})`, r.x > 14 * T);
  // B: the hedges need the double jump: jump at the hedge, jump again at the top of the arc
  await place(p, 17 * T, 400);
  r = await run(`if (k.x > 33 * 16 && k.onGround) mem.stop = 1; const wall = s.boxHits(k.x + 6, k.y, k.w, k.h); if (k.onGround && wall) mem.j = t; return { r: 1, jump: (k.onGround && wall) || (mem.j != null && t - mem.j > 0.3 && t - mem.j < 0.34), hold: 1 };`, 7);
  ok(`B: three hedges cleared with double jumps (x ${r.x})`, r.x > 33 * T && r.y === 400);
  // B: a single jump does not clear a hedge
  await place(p, 18 * T, 400);
  r = await run(`const wall = s.boxHits(k.x + 6, k.y, k.w, k.h); return { r: 1, jump: k.onGround && wall, hold: 1 };`, 3);
  ok(`B: a single jump stops at the first hedge (x ${r.x})`, r.x < 20 * T);
  // C: the hedge wall: walk under it into the gap, jump, double jump, then kick from wall to wall
  await place(p, 34 * T, 400);
  r = await run(`
    if (k.x < 36 * 16 + 2 && !mem.in) return { r: 1 };
    mem.in = true;
    if (k.onGround && !mem.j) { mem.j = t; return { jump: 1, r: 1, hold: 1 }; }
    if (mem.j != null && !mem.d && t - mem.j > 0.3) { mem.d = 1; return { jump: 1, r: 1, hold: 1 }; }
    if (k.y + k.h <= 272 && k.x >= 38 * 16) return { r: 1 };
    if (k.wall && mem.d) { const kick = !mem.last || t - mem.last > 0.12; if (kick) mem.last = t; return { jump: kick, hold: 1, l: k.wall > 0, r: k.wall < 0 }; }
    return { r: k.vx >= 0, l: k.vx < 0, hold: 1 };`, 6);
  ok(`C: wall jumps up the gap onto the terrace (feet ${r.y}, x ${r.x})`, r.y === 272 && r.x >= 38 * T);
  // D: up onto the fountain bowl with a double jump, and down again
  await place(p, 42 * T, 272);
  r = await run(`if (!mem.a) { mem.a = t; return { jump: 1, hold: 1 }; } if (t - mem.a > 0.3 && !mem.b) { mem.b = 1; return { jump: 1, hold: 1 }; } return { r: k.y + k.h < 14 * 16 && k.x < 44 * 16, hold: 1 };`, 2.5);
  ok(`D: the bowl top can be reached (feet ${r.y})`, r.y === 14 * T);
  // E: push the crate to the loggia, climb it, double jump onto the loggia
  await place(p, 55 * T, 272);
  r = await run(`
    const c = s.crate.r;
    if (!mem.pushed) { if (c.x + c.w >= 64 * 16 - 1) mem.pushed = t; return { r: 1 }; }
    if (!mem.up) { mem.up = 1; mem.t1 = t; return { jump: 1, hold: 1 }; }
    if (t - mem.t1 < 0.5) return { hold: 1, r: k.y + k.h < c.y - 2 };
    if (!mem.dj && k.onGround && k.y + k.h === c.y) { mem.dj = t; return { jump: 1, hold: 1 }; }
    if (mem.dj && !mem.dj2 && t - mem.dj > 0.3) { mem.dj2 = 1; return { jump: 1, hold: 1, r: 1 }; }
    if (k.onGround && k.y + k.h === 192) mem.stop = 1;
    return { r: mem.dj != null, hold: 1 };`, 9);
  ok(`E: crate pushed to the loggia (crate x ${await p.evaluate(() => window.__game.scene.crate.r.x)}), climbed, loggia reached (feet ${r.y}, x ${r.x}, ${JSON.stringify(r.mem)})`, r.y === 192);
  // E: without the crate, the loggia is too high
  await p.evaluate(() => { const s = window.__game.scene; s.crate.r.x = 900; s.crate.fx = 900; });
  await place(p, 62 * T, 272);
  r = await run(`if (!mem.a) { mem.a = t; return { jump: 1, hold: 1 }; } if (t - mem.a > 0.32 && !mem.b) { mem.b = 1; return { jump: 1, hold: 1, r: 1 }; } return { r: 1, hold: 1 };`, 2);
  ok(`E: the loggia is out of reach without the crate (feet ${r.y})`, r.y === 272);
  // F: the cradle: wait for it at the loggia, ride it up, walk off onto the balcony
  await place(p, 70 * T, 192);
  r = await run(`
    const cr = s.cradle.r;
    if (!mem.on) { if (cr.y === 192 && s.cradle.wait > 0.2) mem.on = 1; return {}; }
    if (!mem.ride) { if (k.x >= cr.x + 8) mem.ride = 1; return { r: 1 }; }
    if (cr.y > 82) return {};
    return { r: 1 };`, 12);
  ok(`F: the cradle carries her up to the balcony (feet ${r.y}, x ${r.x})`, r.y === 80 && r.x > 74 * T);
  // G: a run along the balcony, jumping the foam slabs, to the door
  await place(p, 75 * T, 80);
  r = await run(`const gap = (k.x > 77 * 16 + 6 && k.x < 78 * 16 + 4) || (k.x > 83 * 16 + 6 && k.x < 84 * 16 + 4); return { r: k.x < 96 * 16 + 4, jump: gap && k.onGround, hold: 1 };`, 6);
  ok(`G: along the balcony to the door (x ${r.x}, feet ${r.y})`, r.x >= 96 * T && r.y === 80);
  // G: standing on a foam slab, it drops
  await place(p, 79 * T + 8, 80);
  r = await run(`return {};`, 1.2);
  ok(`G: a foam slab drops under her (feet ${r.y})`, r.y > 80);

  // damage on (the watchers stay off)
  await p.evaluate(() => { const s = window.__game.scene; s.scan = null; window.__noDeath = false; s.slabs.forEach(sl => { sl.state = 'solid'; sl.r.solid = true; sl.dy = 0; }); });
  await p.evaluate(() => { const s = window.__game.scene; s.crate.r.x = 900; s.crate.fx = 900; });
  await place(p, 64 * T + 4, 192);
  r = await run(`return { l: k.x > 62 * 16 };`, 2);
  ok(`a fall off the loggia (5 tiles) costs 1 HP: hp ${r.hp}, feet ${r.y}, x ${r.x}`, r.hp === 2 && r.y === 272);
  await place(p, 38 * T + 2, 272);
  r = await run(`return { l: 1 };`, 3);
  ok(`down the gap holding into the wall, a slide, no harm: hp ${r.hp}, feet ${r.y}`, r.hp === 3 && r.y === 400);
  await place(p, 38 * T + 2, 272);
  r = await run(`if (k.x > 36 * 16 + 6 && !mem.w) return { l: 1 }; mem.w = 1; return {};`, 3);
  ok(`down the gap without holding a wall (8 tiles) costs 2 HP: hp ${r.hp}`, r.hp === 1);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
