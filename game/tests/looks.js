// Things to look at with E, in every part: she stands by each one, presses E, and its first
// line shows as narration in the caption strip. Then her own bodies: a body from an earlier
// take reads its take and what killed her. Then the city: people talk with E, say something when
// she walks into them, put her down when she lands on a head; benches, planters and the fountain
// are solid and she can stand on them. The grounds' furniture (Nov 18): she pushes the garden
// bench, gets under the terrace table with real keys, and crouched there the drone overhead
// cannot see her. A frame of each
// kind goes to tests/out.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const OUT = __dirname + '/out/';
let fails = 0;
const ok = (label, v) => { if (!v) fails++; console.log((v ? 'ok   ' : 'FAIL ') + label); };
const norm = s => String(s).replace(/\s+/g, ' ').trim();

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  async function open(hash, init) {
    const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
    p.on('pageerror', e => errs.push(hash + ': ' + e.message));
    await p.addInitScript(init || (() => { window.__noPanels = true; window.__noDeath = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} }));
    await p.goto(BASE + '/local.html#' + hash); await p.click('#start');
    await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.clock > 0.6, null, { timeout: 30000, polling: 50 });
    return p;
  }
  const ccText = p => p.evaluate(() => document.getElementById('cc').textContent.replace(/\s+/g, ' ').trim());
  const describing = p => p.evaluate(() => !!(window.__game.scene.bubbles.list.get('item') && !window.__game.scene.bubbles.list.get('item').out));

  // ---- side views: every look
  for (const hash of ['grounds', 'gallery', 'bedroom', 'moon']) {
    const p = await open(hash);
    if (hash === 'moon') await p.evaluate(() => { const s = window.__game.scene; s.npcs.forEach(N => { N.d = Object.assign({}, N.d, { speed: 0 }); N.x = -200; }); s.robotThing.off = true; });
    const n = await p.evaluate(() => window.__game.scene.things.filter(t => t.look && !t.body).length);
    let good = 0; const bad = [];
    for (let i = 0; i < n; i++) {
      let reached = false;
      for (const dx of [0, -8, 8, -16, 16, -4, 4]) {
        await p.evaluate(([i, dx]) => {
          const s = window.__game.scene, t = s.things.filter(t => t.look && !t.body)[i], k = s.kid;
          s.bubbles.clear('item');
          // let go of any swing and park the chandeliers hanging straight down, so a drop is
          // never caught by a swing passing through (riding pins her to it every frame)
          if (s.dyn) { s.dyn.riding = null; s.dyn.list.forEach(q => { if (q.kind === 'swing') q.amp = 0; }); }
          k.x = (t.x0 + t.x1) / 2 + dx - k.w / 2; k.y = Math.max(2, t.y0 - 30); k.h = 14; k.crouch = false; k.vx = 0; k.vy = 0; k.onGround = false;
        }, [i, dx]);
        // she drops onto it; a slow first frame or two can make that take a while, so wait for
        // the thing itself (up to 1.5 s) rather than a fixed time
        reached = await p.waitForFunction(i => { const s = window.__game.scene; return s.nearThing === s.things.filter(t => t.look && !t.body)[i] && s.kid.onGround; }, i, { timeout: 1500, polling: 50 }).then(() => true, () => false);
        if (reached) break;
      }
      if (!reached) { bad.push(i + ' (out of reach)'); continue; }
      await p.keyboard.press('KeyE');
      await p.waitForTimeout(200);
      const want = await p.evaluate(i => { const t = window.__game.scene.things.filter(t => t.look && !t.body)[i], L = t.src.lines; return (typeof L === 'function' ? L() : L)[0]; }, i);
      const got = await ccText(p);
      if (norm(got) === norm(want) && await describing(p)) good++; else bad.push(i + ' want "' + want + '" got "' + got + '"');
      if (i === 1) await p.screenshot({ path: OUT + 'looks-' + hash + '.png' });
    }
    ok(hash + ': ' + good + ' of ' + n + ' things to look at show their line' + (bad.length ? ' | ' + bad.join(' | ') : ''), good === n && n > 0);
    await p.close();
  }

  // ---- the east wing, from above
  {
    const p = await open('eastwing');
    const n = await p.evaluate(() => window.__game.scene.things.filter(t => t.look && !t.body).length);
    let good = 0; const bad = [];
    for (let i = 0; i < n; i++) {
      const placed = await p.evaluate(i => {
        const s = window.__game.scene, t = s.things.filter(t => t.look && !t.body)[i];
        for (const [dx, dy] of [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) if (!s.blocked(t.tx + dx, t.ty + dy)) { s.bubbles.clear('item'); s.placeTile(t.tx + dx, t.ty + dy); return true; }
        return false;
      }, i);
      if (!placed) { bad.push(i + ' (no floor next to it)'); continue; }
      await p.waitForTimeout(250);
      const reached = await p.evaluate(i => { const s = window.__game.scene; return s.nearThing === s.things.filter(t => t.look && !t.body)[i]; }, i);
      if (!reached) { const near = await p.evaluate(() => { const t = window.__game.scene.nearThing; return t ? (t.look ? 'a look' : 'something to use') : 'nothing'; }); bad.push(i + ' (nearest is ' + near + ')'); continue; }
      await p.keyboard.press('KeyJ'); // J looks (E still works quietly) await p.waitForTimeout(200);
      const want = await p.evaluate(i => window.__game.scene.things.filter(t => t.look && !t.body)[i].src.lines[0], i);
      const got = await ccText(p);
      if (norm(got) === norm(want)) good++; else bad.push(i + ' want "' + want + '" got "' + got + '"');
    }
    ok('east wing: ' + good + ' of ' + n + ' things to look at show their line' + (bad.length ? ' | ' + bad.join(' | ') : ''), good === n && n > 0);
    await p.screenshot({ path: OUT + 'looks-eastwing.png' });
    await p.close();
  }

  // ---- her bodies: one from take 1 on the grounds, killed by a lamp (laid by the start, on the floor)
  {
    const p = await open('grounds');
    await p.evaluate(() => { const s = window.__game.scene; const st = s.level.start; window.__game.state.addBody(s.epId, st.x + 20, st.y + 14, 'garden lamp'); s.scene.restart({}); });
    await p.waitForFunction(() => window.__game.scene.clock > 0.6 && window.__game.scene.things.some(t => t.body), null, { timeout: 20000, polling: 50 });
    await p.evaluate(() => { const s = window.__game.scene, k = s.kid, st = s.level.start; k.x = st.x + 18 - k.w / 2; k.y = st.y; k.vx = 0; k.vy = 0; });
    await p.waitForTimeout(500);
    const near = await p.evaluate(() => !!(window.__game.scene.nearThing && window.__game.scene.nearThing.body));
    ok('standing by her old body, E is on offer', near);
    const lines = [];
    for (let i = 0; i < 3; i++) { await p.keyboard.press('KeyE'); await p.waitForTimeout(150); lines.push(await ccText(p)); await p.keyboard.press('KeyE'); await p.waitForTimeout(150); }
    ok('E steps through the body: ' + lines.map(l => '"' + l + '"').join(' '), /^Take 1\./.test(lines[0]) && /light found her/.test(lines[1]) && /Same jacket/.test(lines[2]));
    await p.screenshot({ path: OUT + 'looks-body.png' });
    await p.close();
  }

  // ---- the grounds' furniture: push the bench; hide under the terrace table from the drone
  {
    const p = await open('grounds');
    const wait = async sec => { const t0 = await p.evaluate(() => window.__game.scene.clock); await p.waitForFunction(t => window.__game.scene.clock >= t, t0 + sec, { timeout: 30000, polling: 30 }); };
    const b0 = await p.evaluate(() => window.__game.scene.dyn.pieces.find(q => q.id === 'garden bench').x);
    await p.evaluate(() => { const s = window.__game.scene, q = s.dyn.pieces.find(q => q.id === 'garden bench'), k = s.kid; k.x = q.x + q.w + 1; k.y = 400 - 14; k.vx = 0; k.vy = 0; k.face = -1; });
    await p.keyboard.down('ArrowLeft'); await wait(0.8); await p.keyboard.up('ArrowLeft');
    const b1 = await p.evaluate(() => window.__game.scene.dyn.pieces.find(q => q.id === 'garden bench').x);
    ok('she pushes the garden bench (' + b0 + ' to ' + b1 + ')', b1 < b0);
    // real keys: from the fountain's rim she walks over the table, drops into the gap past it,
    // crouches and crawls back under its top
    await p.evaluate(() => { const k = window.__game.scene.kid; k.x = 770; k.y = 256 - 14; k.vx = 0; k.vy = 0; k.face = 1; });
    await p.keyboard.down('KeyD'); await wait(1.0); await p.keyboard.up('KeyD'); await wait(0.2);
    await p.keyboard.down('KeyS'); await p.keyboard.down('KeyA'); await wait(0.5); await p.keyboard.up('KeyA');
    const crawl = await p.evaluate(() => { const s = window.__game.scene, q = s.dyn.pieces.find(q => q.id === 'terrace table'), k = s.kid; return { x: Math.round(k.x), feet: Math.round(k.y + k.h), crouch: k.crouch, table: q.x + '-' + (q.x + q.w) }; });
    await p.keyboard.up('KeyS');
    const tq = await p.evaluate(() => { const q = window.__game.scene.dyn.pieces.find(q => q.id === 'terrace table'); return { x: q.x, w: q.w }; });
    ok('with real keys she gets down beside the terrace table and crawls under it ' + JSON.stringify(crawl), crawl.crouch && crawl.feet === 272 && crawl.x >= tq.x && crawl.x + 8 <= tq.x + tq.w);
    // crouched under the table, with the drone parked right over it: no lock, no strike
    await p.evaluate(() => { window.__noDeath = false; const s = window.__game.scene, q = s.dyn.pieces.find(q => q.id === 'terrace table'), k = s.kid, D = s.drones[0]; k.x = q.x + 6; k.y = 272 - 9; k.h = 9; k.crouch = true; k.vx = 0; k.vy = 0; D.x0 = D.x1 = D.x = q.x + 10; D.speed = 0; });
    await p.keyboard.down('ArrowDown'); await wait(1.5);
    const hid = await p.evaluate(() => { const s = window.__game.scene; return { dead: s.dead, lock: s.drones[0].lock, crouch: s.kid.crouch }; });
    await p.screenshot({ path: OUT + 'looks-grounds-table.png' });
    await p.keyboard.up('ArrowDown');
    ok('crouched under the terrace table, the drone over it cannot see her ' + JSON.stringify(hid), !hid.dead && hid.lock === 0 && hid.crouch);
    await p.close();
  }

  // ---- the city: people and furniture (waits are in game time: the test machine runs slow)
  {
    const p = await open('moon');
    const G = 160;
    const wait = async sec => { const t0 = await p.evaluate(() => window.__game.scene.clock); await p.waitForFunction(t => window.__game.scene.clock >= t, t0 + sec, { timeout: 30000, polling: 30 }); };
    // E on someone: their line over their head, and they stop
    await p.evaluate(() => { const s = window.__game.scene, N = s.npcs[2]; N.x = 55 * 16; N.dir = 1; N.d = Object.assign({}, N.d, { x0: 50 * 16, x1: 60 * 16 }); const k = s.kid; k.x = N.x - 13; k.y = 146; k.vx = 0; k.vy = 0; });
    await wait(0.1);
    const talkTo = await p.evaluate(() => { const s = window.__game.scene; return s.nearThing === s.npcs[2].thing; });
    ok('a worker in the street is someone to talk to', talkTo);
    await p.keyboard.press('KeyE'); await wait(0.2);
    const x0 = await p.evaluate(() => window.__game.scene.npcs[2].x);
    await wait(0.4);
    const said = await p.evaluate(() => { const s = window.__game.scene, b = s.bubbles.list.get('npc2'); return b ? b.lines.join(' ') : null; });
    const x1 = await p.evaluate(() => window.__game.scene.npcs[2].x);
    ok('E: they say "' + said + '" and stop to say it', !!said && /blur/.test(said) && Math.abs(x1 - x0) < 0.5);
    await p.screenshot({ path: OUT + 'looks-city-talk.png' });
    // walking into someone: they push back with a word, and she does not pass through
    await p.evaluate(() => { const s = window.__game.scene; s.bubbles.clear('npc2'); const N = s.npcs[1]; N.x = 32 * 16 + 4; N.bumpT = -99; const k = s.kid; k.x = 30 * 16 + 14; k.y = 146; k.vx = 0; k.vy = 0; });
    await p.keyboard.down('ArrowRight'); await wait(0.9);
    const bump = await p.evaluate(() => { const s = window.__game.scene, N = s.npcs[1], k = s.kid, b = s.bubbles.list.get('npc1'); return { said: b ? b.lines.join(' ') : null, gap: N.prop.x - (k.x + k.w) }; });
    await p.keyboard.up('ArrowRight');
    ok('she walks into someone: blocked (gap ' + bump.gap.toFixed(1) + ') and they say "' + bump.said + '"', bump.gap > -0.5 && bump.gap < 1.5 && bump.said === 'She touched me!');
    await p.screenshot({ path: OUT + 'looks-city-bump.png' });
    // landing on a head: put down to the side
    await p.evaluate(() => { const s = window.__game.scene, N = s.npcs[1], k = s.kid; s.bubbles.clear('npc1'); k.x = N.x - k.w / 2; k.y = 100; k.vx = 0; k.vy = 0; k.onGround = false; });
    await p.waitForFunction(() => !!window.__game.scene.slide, null, { timeout: 20000, polling: 20 });
    const saidHead = await p.evaluate(() => { const b = window.__game.scene.bubbles.list.get('npc1'); return b ? b.lines.join(' ') : null; });
    await wait(1.0);
    const head = await p.evaluate(() => { const s = window.__game.scene, N = s.npcs[1], k = s.kid; return { foot: Math.round(k.y + k.h), ground: k.onGround, clear: k.x + k.w <= N.prop.x + 0.5 || k.x >= N.prop.x + N.prop.w - 0.5 }; });
    ok('landing on a head: "' + saidHead + '" and she is put down beside them (' + JSON.stringify(head) + ')', head.ground && Math.abs(head.foot - G) <= 1 && head.clear && !!saidHead);
    // a bench holds her
    await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.x = 27 * 16 + 11; k.y = 100; k.vx = 0; k.vy = 0; k.onGround = false; });
    await wait(0.8);
    const bench = await p.evaluate(() => { const k = window.__game.scene.kid; return { foot: k.y + k.h, ground: k.onGround }; });
    ok('she can stand on a bench (feet at ' + bench.foot.toFixed(1) + ')', bench.ground && Math.abs(bench.foot - (G - 13)) < 1);
    // the fountain: into the basin, up on the top bowl
    await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.x = 19 * 16 - 24; k.y = 100; k.vx = 0; k.vy = 0; k.onGround = false; });
    await wait(0.8);
    const basin = await p.evaluate(() => { const k = window.__game.scene.kid; return k.y + k.h; });
    ok('she lands in the fountain basin (feet at ' + basin.toFixed(1) + ')', Math.abs(basin - (G - 4)) < 1);
    await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.x = 19 * 16 - 4; k.y = 90; k.vx = 0; k.vy = 0; k.onGround = false; });
    await wait(0.8);
    const tier = await p.evaluate(() => { const k = window.__game.scene.kid; return k.y + k.h; });
    ok('and stands on its top bowl (feet at ' + tier.toFixed(1) + ')', Math.abs(tier - (G - 44)) < 1);
    await p.screenshot({ path: OUT + 'looks-city-fountain.png' });
    // and nothing traps her: from the plaza she walks to the staff door holding right, jumping
    // (held, as a player would) whenever she is stuck
    await p.evaluate(() => { const s = window.__game.scene, k = s.kid; k.x = 60; k.y = 146; k.vx = 0; k.vy = 0; });
    await p.keyboard.down('ArrowRight');
    let stuck = 0;
    for (let i = 0; i < 200 && await p.evaluate(() => window.__game.scene.kid.x < 99 * 16 && window.__game.scene.mode === 'walk'); i++) {
      await wait(0.12);
      if (await p.evaluate(() => Math.abs(window.__game.scene.kid.vx) < 5 && window.__game.scene.kid.onGround)) { stuck++; await p.keyboard.down('Space'); await wait(0.25); await p.keyboard.up('Space'); }
    }
    await p.keyboard.up('ArrowRight');
    const end = await p.evaluate(() => window.__game.scene.kid.x);
    ok('walking the city holding right, with a jump when blocked (' + stuck + ' jumps), she reaches the staff door (x ' + Math.round(end) + ')', end >= 99 * 16);
    await p.close();
  }

  ok('no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''), !errs.length);
  await b.close();
  process.exit(fails ? 1 : 0);
})();
