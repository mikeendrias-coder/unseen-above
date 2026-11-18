// Frame times per scene: node tests/perf.js [part,part,...] [seconds]
// Parts: any # link (grounds, gallery, fall, eastwing, bedroom, moon, hallway), and:
//   lasers   the east wing's laser gallery (she starts in it at tile 30,23 and walks about)
//   bedrun   episode 4 from the bag: the floor going, the run
//   caught   episode 4 the way it goes on stage: she walks into a flash, the strike, the scene
//            starts again, over and over (ENDLESS, nothing switched off)
//   fight1, fight2, fight3   backstage, the fight in that round (three: the dark one, the cameras)
//   batch1 .. batch4         the satellite screens
// Each part opens the link, waits for the scene and plays it (walks, jumps, moves her on when she
// is stuck). It samples every animation frame and the game's own step (update and render,
// Phaser's loop callback) with nothing else running, then, apart from that, runs the Chrome
// profiler for a few seconds (UA_PROF seconds, default 4, 0 for none) to name the hot spots.
// Chromium draws on this machine's real GPU (ANGLE on OpenGL) when there is one; UA_SW=1 forces
// SwiftShader (the software GPU). The browser and the renderer are printed first.
// A part FAILS when its frames have a p95 over UA_P95 ms (default 25) or a frame over UA_MAX ms
// (default 50), or its step has a p95 over UA_STEP95 ms (default 8) or a step over UA_MAX ms.
// On SwiftShader the frame times only measure the software GPU, so they are printed but only the
// step counts. A part that fails is run once more and fails only if it fails again (another job
// on the machine can stall a frame); the load average is printed with the result.
// UA_CALLERS=1 lists who called the native hot spots, UA_DEPTH frames deep. UA_CPU=4 slows the
// CPU four times (a slower laptop). UA_SECS sets the seconds per part.
const { chromium } = require('playwright');
const os = require('os');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
const PARTS = (process.argv[2] || 'grounds,gallery,fall,eastwing,lasers,bedroom,bedrun,caught,moon,hallway,fight3,batch1').split(',');
const SECS = +(process.argv[3] || process.env.UA_SECS || 10), PROF = +(process.env.UA_PROF != null ? process.env.UA_PROF : 4);
const P95 = +(process.env.UA_P95 || 25), MAX = +(process.env.UA_MAX || 50), STEP95 = +(process.env.UA_STEP95 || 8);
const KEY = { grounds: 'grounds', gallery: 'gallery', fall: 'fall', eastwing: 'eastwing', lasers: 'eastwing', bedroom: 'bedroom', bedrun: 'bedroom', caught: 'bedroom', moon: 'moon', hallway: 'hallway', batch1: 'satellite', batch2: 'satellite', batch3: 'satellite', batch4: 'satellite' };
const LINK = { lasers: 'eastwing', bedrun: 'bedroom', caught: 'bedroom' };
const q = (a, f) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const r1 = x => Math.round(x * 10) / 10;
const ARGS = process.env.UA_SW ? ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist'];

// open a part and get it to the point where the sampling starts; returns the scene key or null
async function open(p, part) {
  const fight = /^fight(\d)$/.exec(part);
  await p.addInitScript(nd => { window.__noPanels = true; if (nd) window.__noDeath = true; try { localStorage.removeItem('unseen-above-v1'); } catch (e) {} }, part !== 'caught');
  await p.goto(BASE + '/local.html#' + (fight ? 'hallway' : LINK[part] || part)); await p.click('#start');
  const key = fight ? 'hallway' : KEY[part] || part;
  await p.waitForFunction(k => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === k && window.__game.scene.sys.isActive(), key, { timeout: 60000, polling: 100 });
  const until = (fn, a, ms) => p.waitForFunction(fn, a, { timeout: ms || 40000, polling: 50 });
  if (fight) {
    await until(() => window.__game.scene.clock > 0.5);
    await p.evaluate(() => { window.__game.scene.kid.x = 20 * 16 + 14; });
    await until(() => !!window.__game.scene.sword.floor);
    await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.sword.floor.x - 4; });
    await until(() => window.__game.scene.nearThing === window.__game.scene.swordThing, null, 5000);
    await p.evaluate(() => window.__game.scene.swordThing.use());
    await until(() => window.__game.scene.mode === 'fight');
    await p.evaluate(r => window.__game.scene.startRound(r), +fight[1] - 1);
  }
  // the bag: N's own move (placeAt the stairs, pull); the floor starts to go behind her
  if (part === 'bedrun') await p.evaluate(() => { const s = window.__game.scene; for (let i = 0; i < 6 && !s.bag.have; i++) s.skipAhead(); });
  if (part === 'lasers') { await until(() => window.__game.scene.clock > 0.6); await p.evaluate(() => window.__game.scene.placeTile(30, 23)); }
  if (part === 'caught') { await p.keyboard.press('KeyI'); await until(() => window.__game.state.mode === 'endless', null, 3000); }
  await p.waitForTimeout(1500);
  return key;
}

// play for ms: walk (mostly right), a jump now and then; a side scene moves her on when she has
// not moved. caught: she is put back under the landing's camera whenever she is alive.
async function play(p, part, key, ms) {
  const t0 = Date.now(); let i = 0, lastX = null;
  const top = key === 'eastwing' || key === 'satellite';
  while (Date.now() - t0 < ms) {
    if (part === 'caught') {
      await p.evaluate(() => { const s = window.__game.scene; if (s.sys.settings.key === 'bedroom' && s.kid && !s.dead && s.mode === 'house' && s.clock > 0.8 && !(s.kid.x > 140 && s.kid.x < 170)) { s.kid.x = 152; s.kid.y = 146; } });
      await p.waitForTimeout(300); i++; continue;
    }
    const dir = part === 'lasers' ? ['KeyD', 'KeyA', 'KeyS', 'KeyW'][i % 4] : i % 5 === 4 ? 'KeyA' : 'KeyD';
    await p.keyboard.down(dir);
    if (key === 'eastwing' && part !== 'lasers') await p.keyboard.down(i % 2 ? 'KeyS' : 'KeyW');
    await p.waitForTimeout(450);
    if (i % 3 === 1 && !top) await p.keyboard.press('Space');
    await p.waitForTimeout(450);
    await p.keyboard.up(dir); if (key === 'eastwing' && part !== 'lasers') { await p.keyboard.up('KeyS'); await p.keyboard.up('KeyW'); }
    const x = await p.evaluate(() => { const s = window.__game && window.__game.scene; return s && s.kid && s.kid.x != null ? s.kid.x : null; });
    if (x != null && lastX != null && Math.abs(x - lastX) < 4 && !top) await p.evaluate(() => { const s = window.__game.scene; if (s.placeAt && s.kid) { const W = s.level && s.level.w ? s.level.w * 16 : 2000; s.placeAt(Math.min(W - 40, s.kid.x + 48)); } });
    lastX = x; i++;
  }
}

async function runPart(b, part, soft) {
  const p = await b.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  let key;
  try { key = await open(p, part); } catch (e) { await p.close(); return { fail: true, line: 'FAIL #' + part + ': the part did not start (' + e.message.split('\n')[0] + ')' }; }
  // every animation frame, and how long the game's own step took (Phaser's loop)
  await p.evaluate(() => {
    const ft = window.__ft = [], at = window.__ftAt = [];
    let last = performance.now();
    const tick = now => { ft.push(now - last); at.push(now); last = now; if (!window.__ftStop) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const loop = window.__unseen.game.loop, own = loop.callback, wk = window.__work = [];
    if (own && !loop.__perf) { loop.__perf = true; loop.callback = (t, d) => { const a = performance.now(); own(t, d); wk.push(performance.now() - a); }; }
    // flashes and deaths, counted, so a run that saw none says so
    window.__flashes = 0; window.__deaths = 0;
    const S = window.__unseen.Sound, sh = S.shutter; S.shutter = (...a) => { window.__flashes++; return sh.apply(S, a); };
    let dead = false; const watch = () => { const s = window.__game.scene, d = !!(s && s.dead); if (d && !dead) window.__deaths++; dead = d; if (!window.__ftStop) requestAnimationFrame(watch); }; requestAnimationFrame(watch);
  });
  const cdp = await p.context().newCDPSession(p);
  if (+process.env.UA_CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.UA_CPU });
  await play(p, part, key, SECS * 1000);
  const data = await p.evaluate(() => { window.__ftStop = true; const s = window.__game.scene; return { ft: window.__ft, at: window.__ftAt, key: s.sys.settings.key, flashes: window.__flashes, deaths: window.__deaths, work: window.__work }; });
  // the hot spots, profiled apart from the sampling (the profiler slows every frame down)
  let top = [], topCallers = [], gc = 0, busy = 0;
  if (PROF > 0) {
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
    await play(p, part, key, PROF * 1000);
    const { profile } = await cdp.send('Profiler.stop');
    const self = new Map(), byId = new Map(); profile.nodes.forEach(n => byId.set(n.id, n));
    const dts = profile.timeDeltas; let tot = 0;
    profile.samples.forEach((id, j) => {
      const n = byId.get(id), cf = n.callFrame, dt = (dts[j] || 0) / 1000; tot += dt;
      const name = (cf.functionName || '(anon)') + (cf.url ? ' ' + cf.url.split('/').pop() + ':' + (cf.lineNumber + 1) : '');
      self.set(name, (self.get(name) || 0) + dt);
    });
    const parent = new Map(); profile.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
    const callers = new Map();
    profile.samples.forEach((id, j) => {
      const n = byId.get(id); if (n.callFrame.url) return;
      const chain = []; let pid = parent.get(id);
      while (pid != null && chain.length < (+process.env.UA_DEPTH || 3)) { const pn = byId.get(pid); if (pn.callFrame.url) chain.push((pn.callFrame.functionName || '(anon)') + ':' + (pn.callFrame.lineNumber + 1)); pid = parent.get(pid); }
      const k = n.callFrame.functionName + ' < ' + chain.join(' < ');
      callers.set(k, (callers.get(k) || 0) + (dts[j] || 0) / 1000);
    });
    topCallers = [...callers.entries()].filter(([k]) => !/^\((idle|program|garbage)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 4);
    top = [...self.entries()].filter(([n]) => !/^\((idle|garbage collector)\)/.test(n)).sort((a, b) => b[1] - a[1]).slice(0, 6);
    gc = self.get('(garbage collector)') || 0; busy = Math.round(100 * (1 - (self.get('(idle)') || 0) / tot));
  }
  await p.close();
  // drop the first half second of samples (the sampler starting)
  const t1 = data.at[0] + 500, ft = data.ft.filter((_, j) => data.at[j] > t1);
  const med = q(ft, 0.5), p95 = q(ft, 0.95), max = Math.max(0, ...ft), over = ft.filter(x => x > MAX).length;
  const wk = data.work.slice(30), wmed = q(wk, 0.5), wp95 = q(wk, 0.95), wmax = Math.max(0, ...wk);
  const why = [];
  if (wp95 > STEP95) why.push('step p95'); if (wmax > MAX) why.push('step max');
  if (!soft && p95 > P95) why.push('frame p95'); if (!soft && max > MAX) why.push('frame max');
  if (errs.length) why.push('page errors');
  const line = `#${part} (${data.key}): ${ft.length} frames, median ${r1(med)} ms, p95 ${r1(p95)} ms, max ${r1(max)} ms, over ${MAX} ms: ${over}; game step median ${r1(wmed)}, p95 ${r1(wp95)}, max ${r1(wmax)} ms; flashes ${data.flashes}, deaths ${data.deaths}; load ${os.loadavg()[0].toFixed(1)}`;
  const extra = [];
  if (PROF > 0) { extra.push(`       profile (${PROF} s apart): busy ${busy}%, gc ${r1(gc)} ms`); top.forEach(([n, ms]) => extra.push('       ' + r1(ms).toString().padStart(7) + ' ms  ' + n)); }
  if (process.env.UA_CALLERS) topCallers.forEach(([n, ms]) => extra.push('     < ' + r1(ms).toString().padStart(7) + ' ms  ' + n));
  if (errs.length) extra.push('     errors: ' + errs.slice(0, 3).join(' | '));
  return { fail: why.length > 0, why, line, extra };
}

(async () => {
  const b = await chromium.launch({ args: ARGS });
  const gp = await b.newPage();
  const gpu = await gp.evaluate(() => { const g = document.createElement('canvas').getContext('webgl'); if (!g) return 'no WebGL'; const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); });
  await gp.close();
  const soft = /SwiftShader|llvmpipe|no WebGL/i.test(gpu);
  console.log(`Chromium ${b.version()}, ${gpu}${soft ? ' (software: frame times are printed, only the game step counts)' : ''}`);
  let bad = 0;
  for (const part of PARTS) {
    let r = await runPart(b, part, soft);
    if (r.fail && r.line.startsWith('#')) {
      console.log('again #' + part + ' (' + r.why.join(', ') + ' on the first run: ' + r.line + ')');
      r = await runPart(b, part, soft);
    }
    if (r.fail) bad++;
    console.log((r.fail ? (r.line.startsWith('FAIL') ? '' : 'SLOW ') : 'ok   ') + r.line + (r.fail && r.why ? '  [' + r.why.join(', ') + ']' : ''));
    (r.extra || []).forEach(l => console.log(l));
  }
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
