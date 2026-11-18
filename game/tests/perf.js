// Frame times per scene, with a CPU profile: node tests/perf.js [part,part,...] [seconds]
// Parts: any # link; bedrun (episode 4 from the bag: the floor going, the run); fight1, fight2,
// fight3 (backstage, the fight in that round; three is the dark one with the flash cameras).
// For each part it opens the link, waits for the scene, then plays it for a while (walks right,
// jumps now and then, moves her on when she is stuck) and samples every animation frame. It
// prints the median, p95 and max frame time, how many frames took over 50 ms, the same for the
// game's own step (update and render, Phaser's loop callback), and the functions
// that took the most time (self time, from the Chrome profiler). A part is SLOW (exit code 1)
// when the game's step has a p95 over UA_STEP95 ms (default 8) or any step over UA_MAX ms
// (default 50); GPU when the step is quick but frames have a p95 over UA_P95 ms (default 25) or
// one over UA_MAX ms (SwiftShader, the software GPU, drawing the picture). UA_CALLERS=1 also
// lists who called the native hot spots (texImage2D, fillRect), UA_DEPTH frames deep.
// Headless Chromium draws with SwiftShader (software GL), so the numbers are slower than a real
// GPU; compare runs with each other, not with a laptop. UA_CPU=4 slows the CPU four times (a
// slower laptop), UA_SECS sets the seconds per part.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const PARTS = (process.argv[2] || 'grounds,gallery,fall,eastwing,bedroom,bedrun,moon,hallway,fight3,batch1').split(',');
const SECS = +(process.argv[3] || process.env.UA_SECS || 10);
const P95 = +(process.env.UA_P95 || 25), MAX = +(process.env.UA_MAX || 50), STEP95 = +(process.env.UA_STEP95 || 8);
const KEY = { grounds: 'grounds', gallery: 'gallery', fall: 'fall', eastwing: 'eastwing', bedroom: 'bedroom', moon: 'moon', hallway: 'hallway', batch1: 'satellite', batch2: 'satellite', batch3: 'satellite', batch4: 'satellite' };
const q = (a, f) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const r1 = x => Math.round(x * 10) / 10;

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'].concat(process.env.UA_GPU ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas'] : []) });
  let bad = 0;
  for (const part of PARTS) {
    const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.__noPanels = true; window.__noDeath = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} });
    // fight1, fight2, fight3: backstage, the fight in that round (searchlight, laser, flash cameras)
    const fight = /^fight(\d)$/.exec(part);
    const run = part === 'bedrun';
    await p.goto(BASE + '/local.html#' + (fight ? 'hallway' : run ? 'bedroom' : part)); await p.click('#start');
    const key = fight ? 'hallway' : run ? 'bedroom' : KEY[part] || part;
    try {
      await p.waitForFunction(k => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === k && window.__game.scene.sys.isActive(), key, { timeout: 60000, polling: 100 });
    } catch (e) { console.log('FAIL #' + part + ': the scene did not start'); bad++; await p.close(); continue; }
    if (fight) {
      try {
        const until = (fn, a, ms) => p.waitForFunction(fn, a, { timeout: ms || 40000, polling: 50 });
        await until(() => window.__game.scene.clock > 0.5);
        await p.evaluate(() => { window.__game.scene.kid.x = 20 * 16 + 14; });
        await until(() => !!window.__game.scene.sword.floor);
        await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.sword.floor.x - 4; });
        await until(() => window.__game.scene.nearThing === window.__game.scene.swordThing, null, 5000);
        await p.evaluate(() => window.__game.scene.swordThing.use());
        await until(() => window.__game.scene.mode === 'fight');
        await p.evaluate(r => window.__game.scene.startRound(r), +fight[1] - 1);
      } catch (e) { console.log('FAIL #' + part + ': could not start the fight (' + e.message.split('\n')[0] + ')'); bad++; await p.close(); continue; }
    }
    // the bag: N's own move (placeAt the stairs, pull); the floor starts to go behind her
    if (run) await p.evaluate(() => { const s = window.__game.scene; for (let i = 0; i < 6 && !s.bag.have; i++) s.skipAhead(); });
    await p.waitForTimeout(1500);
    // every animation frame, and how long the game's own step took (Phaser's loop)
    await p.evaluate(() => {
      const ft = window.__ft = [], at = window.__ftAt = [];
      let last = performance.now();
      const tick = now => { ft.push(now - last); at.push(now); last = now; if (!window.__ftStop) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      // the game's own work per frame: Phaser's step (every scene's update, then the render)
      const loop = window.__unseen.game.loop, own = loop.callback, wk = window.__work = [];
      if (own && !loop.__perf) { loop.__perf = true; loop.callback = (t, d) => { const a = performance.now(); own(t, d); wk.push(performance.now() - a); }; }
    });
    const cdp = await p.context().newCDPSession(p);
    if (+process.env.UA_CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.UA_CPU });
    // flashes fired (episode 4's cameras, the stage's): counted, so a run that saw none says so
    await p.evaluate(() => { const s = window.__game.scene; window.__flashes = 0; if (typeof s.fire === 'function') { const own = s.fire.bind(s); s.fire = (...a) => { window.__flashes++; return own(...a); }; } else if (s.cams) { const S = window.__unseen.Sound, own = S.shutter; S.shutter = (...a) => { window.__flashes++; return own(...a); }; } });
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
    // play: walk right, a jump now and then; a side scene moves her on when she has not moved
    const t0 = Date.now(); let i = 0, lastX = null;
    while (Date.now() - t0 < SECS * 1000) {
      const dir = i % 5 === 4 ? 'KeyA' : 'KeyD';
      await p.keyboard.down(dir);
      if (key === 'eastwing') await p.keyboard.down(i % 2 ? 'KeyS' : 'KeyW');
      await p.waitForTimeout(450);
      if (i % 3 === 1 && key !== 'eastwing' && key !== 'satellite') await p.keyboard.press('Space');
      await p.waitForTimeout(450);
      await p.keyboard.up(dir); if (key === 'eastwing') { await p.keyboard.up('KeyS'); await p.keyboard.up('KeyW'); }
      const x = await p.evaluate(() => { const s = window.__game && window.__game.scene; return s && s.kid && s.kid.x != null ? s.kid.x : null; });
      if (x != null && lastX != null && Math.abs(x - lastX) < 4 && key !== 'eastwing') await p.evaluate(() => { const s = window.__game.scene; if (s.placeAt && s.kid) { const W = s.level && s.level.w ? s.level.w * 16 : 2000; s.placeAt(Math.min(W - 40, s.kid.x + 48)); } });
      lastX = x; i++;
    }
    const { profile } = await cdp.send('Profiler.stop');
    const data = await p.evaluate(() => { window.__ftStop = true; const s = window.__game.scene; return { ft: window.__ft, at: window.__ftAt, key: s.sys.settings.key, fps: window.__unseen.game.loop.actualFps, flashes: window.__flashes, work: window.__work }; });
    // drop the first second (the profiler starting)
    const t1 = data.at[0] + 1000, ft = data.ft.filter((_, j) => data.at[j] > t1);
    const med = q(ft, 0.5), p95 = q(ft, 0.95), max = Math.max(0, ...ft), over = ft.filter(x => x > 50).length;
    const wk = data.work.slice(60), wmed = q(wk, 0.5), wp95 = q(wk, 0.95), wmax = Math.max(0, ...wk);
    // self time per function
    const self = new Map(), byId = new Map(); profile.nodes.forEach(n => byId.set(n.id, n));
    const dts = profile.timeDeltas; let tot = 0;
    profile.samples.forEach((id, j) => {
      const n = byId.get(id), cf = n.callFrame, dt = (dts[j] || 0) / 1000; tot += dt;
      const name = (cf.functionName || '(anon)') + (cf.url ? ' ' + cf.url.split('/').pop() + ':' + (cf.lineNumber + 1) : '');
      self.set(name, (self.get(name) || 0) + dt);
    });
    // who calls the top native calls (texImage2D, fillRect...): the nearest named JS frames
    const parent = new Map(); profile.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
    const callers = new Map();
    profile.samples.forEach((id, j) => {
      const n = byId.get(id); if (n.callFrame.url) return;
      const chain = []; let pid = parent.get(id);
      while (pid != null && chain.length < (+process.env.UA_DEPTH || 3)) { const pn = byId.get(pid); if (pn.callFrame.url) chain.push((pn.callFrame.functionName || '(anon)') + ':' + (pn.callFrame.lineNumber + 1)); pid = parent.get(pid); }
      const k = n.callFrame.functionName + ' < ' + chain.join(' < ');
      callers.set(k, (callers.get(k) || 0) + (dts[j] || 0) / 1000);
    });
    const topCallers = [...callers.entries()].filter(([k]) => !/^\((idle|program|garbage)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const top = [...self.entries()].filter(([n]) => !/^\((idle|garbage collector)\)/.test(n)).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const gc = self.get('(garbage collector)') || 0, idle = self.get('(idle)') || 0;
    // The game's own step decides (update and render calls: the code). Frame times also count
    // SwiftShader drawing the picture in software, which a real GPU does in a fraction of the
    // time, so a scene whose step is quick but whose frames are slow is marked GPU, not SLOW.
    const fail = wp95 > STEP95 || wmax > MAX, gpu = !fail && (p95 > P95 || max > MAX);
    if (fail) bad++;
    console.log(`${fail ? 'SLOW' : gpu ? 'GPU ' : 'ok  '} #${part} (${data.key}): ${ft.length} frames, median ${r1(med)} ms, p95 ${r1(p95)} ms, max ${r1(max)} ms, over 50 ms: ${over}; game step median ${r1(wmed)}, p95 ${r1(wp95)}, max ${r1(wmax)} ms; flashes ${data.flashes}; busy ${Math.round(100 * (1 - idle / tot))}%, gc ${r1(gc)} ms`);
    top.forEach(([n, ms]) => console.log('       ' + r1(ms).toString().padStart(7) + ' ms  ' + n));
    if (process.env.UA_CALLERS) topCallers.forEach(([n, ms]) => console.log('     < ' + r1(ms).toString().padStart(7) + ' ms  ' + n));
    if (errs.length) console.log('     errors: ' + errs.slice(0, 3).join(' | '));
    await p.close();
  }
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
