// Plays the fight with the creator the way a careful player would, with real keys and no
// immunity: crouch under a high lunge, jump a low one, back away from a chop, strike while they
// are open, get under the desk for the searchlight and the flash cameras, crouch or jump the
// laser. Reports how many takes it needed and how each one ended. node tests/bot-boss.js [takes]
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const maxTakes = Number(process.argv[2] || 6);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  await p.goto(BASE + '/local.html#hallway'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.5, null, { timeout: 60000 });
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 20 * 16 + 14; });
  const held = new Set();
  const hold = async (key, on) => { if (on && !held.has(key)) { held.add(key); await p.keyboard.down(key); } else if (!on && held.has(key)) { held.delete(key); await p.keyboard.up(key); } };
  const tap = async key => { await p.keyboard.down(key); await p.waitForTimeout(40); await p.keyboard.up(key); };
  const log = []; let lastTake = 1, t0 = Date.now(), lastHp = 9;
  while (Date.now() - t0 < 600000) {
    const s = await p.evaluate(() => {
      const s = window.__game && window.__game.scene; if (!s || s.sys.settings.key !== 'hallway') return { gone: true };
      const k = s.kid, c = s.cr, D = s.props.find(r => r.id === 'desk');
      return { vx: k.vx, ct: c.t, mode: s.mode, dead: s.dead, take: s.ep.take, kx: k.x + k.w / 2, ky: k.y, onGround: k.onGround, crouch: k.crouch, cst: c.st, cx: c.x, hp: c.hp, round: c.round, hi: c.hi, face: c.face,
        lamp: s.lamp.on, lock: s.lamp.lock, beam: s.lamp.on ? 484 + (136 / Math.tan(s.lamp.angle * Math.PI / 180)) : null, laser: s.laser.shots.length ? { shot: s.laser.shot, t: s.laser.t } : null, warn: (s.cams.find(cm => cm.warn) || {}).aim || null, desk: { x0: D.x + 6, x1: D.x + D.w - 10 },
        floor: s.sword.floor && s.sword.floor.x, have: s.sword.have };
    });
    if (s.gone) break;
    if (s.take !== lastTake) { log.push('take ' + lastTake + ' ended at ' + lastHp + ' hits left: ' + await p.evaluate(() => JSON.stringify(window.__lastDeath || {}))); lastTake = s.take; for (const k of [...held]) await hold(k, false); }
    await p.evaluate(() => { const s = window.__game.scene; if (s && !s.__hooked && s.die) { s.__hooked = true; const d = s.die.bind(s); s.die = src => { const k = s.kid, c = s.cr; window.__lastDeath = { by: src && src.id, cst: c.st, hi: c.hi, cx: Math.round(c.x), kx: Math.round(k.x), ky: Math.round(k.y), crouch: k.crouch, ground: k.onGround, round: c.round, laser: s.laser.shot, lt: +s.laser.t.toFixed(2) }; d(src); }; } });
    lastHp = s.hp;
    if (s.mode === 'after' || s.mode === 'yield') { log.push('take ' + s.take + ': the creator yields'); break; }
    if (s.dead) { await p.waitForTimeout(100); continue; }
    if (s.mode === 'toss') {
      if (s.floor != null) { const dx = s.floor - 4 - s.kx; await hold('ArrowRight', dx > 3); await hold('ArrowLeft', dx < -3); if (Math.abs(dx) <= 4) await tap('KeyE'); }
      await p.waitForTimeout(60); continue;
    }
    if (s.mode !== 'fight') { await hold('ArrowLeft', false); await hold('ArrowRight', false); await hold('ArrowDown', false); await p.waitForTimeout(80); continue; }
    let left = false, right = false, down = false, jump = false, swing = false;
    const dx = s.cx - s.kx, dist = Math.abs(dx);
    const toward = x => { if (x > s.kx + 2) right = true; else if (x < s.kx - 2) left = true; };
    const underDesk = s.kx > s.desk.x0 && s.kx < s.desk.x1;
    if (s.laser) {
      if (s.laser.shot === 'high') down = s.laser.t > 0.7 && s.laser.t < 1.55;
      else jump = s.laser.t > 1.08 && s.laser.t < 1.2;
    } else if (s.cst === 'windHi' || (s.cst === 'lunge' && s.hi)) down = true;
    else if (s.cst === 'windLo' || (s.cst === 'lunge' && !s.hi)) { jump = s.cst === 'lunge' ? dist < 90 : s.ct < 0.3; }
    else if (s.cst === 'raise') { toward(s.kx - Math.sign(dx || 1) * 60); }
    else if (s.warn) {
      // out of where the camera is aiming: under the desk if it is close, otherwise to whichever
      // side is open, never through the creator
      const deskMid = (s.desk.x0 + s.desk.x1) / 2, blocked = x => (s.cx - s.kx) * (s.cx - x) < 0 || x < 330 || x > 630;
      if (underDesk) down = true;
      else if (Math.abs(deskMid - s.kx) < 50 && !blocked(deskMid)) toward(deskMid);
      else if (Math.abs(s.warn.x - s.kx) < 46) { const a = s.warn.x - 48, b2 = s.warn.x + 48; toward(!blocked(a) ? a : b2); }
    }
    else if (['recover', 'stuck', 'flinch'].includes(s.cst)) { if (dist > 15) toward(s.cx - Math.sign(dx) * 12); else { if ((dx > 0) !== (s.face > 0) || true) { if (dx > 0) right = dist > 13; else left = dist > 13; } swing = true; } }
    else if (s.round === 2) { const deskMid = (s.desk.x0 + s.desk.x1) / 2; if (Math.abs(deskMid - s.kx) > 18) toward(deskMid); }
    else { if (dist > 64) toward(s.cx - Math.sign(dx) * 48); else if (dist < 38) toward(s.kx - Math.sign(dx) * 30); }
    // walking into something (a crate): hop it
    if ((left || right) && Math.abs(s.vx) < 4 && s.onGround && !down && !s.crouch) jump = true;
    await hold('ArrowLeft', left); await hold('ArrowRight', right); await hold('ArrowDown', down);
    if (jump && s.onGround) await tap('Space');
    if (swing) { if ((dx > 0 && !right) || (dx < 0 && !left)) { await p.keyboard.down(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); await p.waitForTimeout(16); await p.keyboard.up(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); } await tap('KeyF'); }
    if (s.take > maxTakes) { log.push('gave up after ' + maxTakes + ' takes'); break; }
    await p.waitForTimeout(20);
  }
  console.log(log.join('\n'));
  console.log('bodies on the stage: ' + await p.evaluate(() => window.__game.state.episode('ep5b').bodies.map(b => b.cause).join(', ')));
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 5).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
