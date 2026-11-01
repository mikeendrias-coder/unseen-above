// The fight with the creator, backstage on the Moon. Checks each way to die and each way not to,
// a hit landing only when the creator is open, a retry that keeps her body on the stage, and
// the way out to the playroom once the creator yields.
const { chromium } = require('playwright');
const BASE = process.env.UA_BASE || 'http://localhost:8766';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const until = (fn, arg, ms) => p.waitForFunction(fn, arg, { timeout: ms || 60000, polling: 30 });
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  const S = () => 'window.__game.scene';
  await p.addInitScript(() => { window.__noPanels = true; try { localStorage.setItem('unseen-above-v1', JSON.stringify({ look: 'A', episodes: {}, seenIntro: true })); } catch (e) {} });
  await p.goto(BASE + '/local.html#hallway'); await p.click('#start');
  await until(() => window.__game && window.__game.scene && window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.clock > 0.5);
  ok('the hallway opens with the walk in', await p.evaluate(() => window.__game.scene.mode === 'walk'));
  // walking onto the stage starts the toss; the gate drops behind her
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = 20 * 16 + 14; });
  await until(() => window.__game.scene.mode === 'toss', null, 8000);
  ok('stepping onto the stage: the toss, and the stage door shuts', await p.evaluate(() => window.__game.scene.gateProp.solid));
  await until(() => !!window.__game.scene.sword.floor, null, 40000);
  ok('the sword lands near her', await p.evaluate(() => Math.abs(window.__game.scene.sword.floor.x - window.__game.scene.kid.x) < 60));
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.sword.floor.x - 4; });
  await until(() => window.__game.scene.nearThing === window.__game.scene.swordThing, null, 5000);
  await p.keyboard.press('KeyE');
  await until(() => window.__game.scene.mode === 'fight', null, 20000);
  ok('E picks it up, and the fight starts', await p.evaluate(() => window.__game.scene.sword.have));

  // freeze the creator's brain for the checks: we set the moments by hand
  const freeze = () => p.evaluate(() => { const s = window.__game.scene; s.__uc = s.updateCreator; s.updateCreator = function () { this.placeCreator(); }; s.lamp.t = 0; s.updateTraps = function () {}; });
  await freeze();
  // a swing that lands while they are closed glances off
  const swingAt = (open) => p.evaluate(open => { const s = window.__game.scene, c = s.cr; c.st = open ? 'recover' : 'idle'; c.open = open; c.x = 30 * 16; s.kid.x = c.x - 16; s.kid.y = 146; s.kid.face = 1; s.sword.cool = 0; const hp = c.hp; s.swing(); return hp; }, open);
  let hp = await swingAt(false); await p.waitForTimeout(250);
  ok('a swing while they are guarded glances off', await p.evaluate(hp => window.__game.scene.cr.hp === hp, hp));
  hp = await swingAt(true); await p.waitForTimeout(250);
  ok('a swing while they are open lands (' + hp + ' to ' + await p.evaluate(() => window.__game.scene.cr.hp) + ')', await p.evaluate(hp => window.__game.scene.cr.hp === hp - 1, hp));
  // the lunge: high kills her standing, misses her crouched; low kills standing, misses her in the air
  const lunge = (hi, pose) => p.evaluate(([hi, pose]) => {
    const s = window.__game.scene, c = s.cr, k = s.kid; s.dead = false;
    c.st = 'lunge'; c.hi = hi; c.face = 1; c.pose = 'lean'; c.x = 30 * 16; k.x = c.x + 12; k.vx = 0;
    if (pose === 'crouch') { k.crouch = true; k.h = 9; k.y = 160 - 9; } else if (pose === 'air') { k.crouch = false; k.h = 14; k.y = 160 - 14 - 12; } else { k.crouch = false; k.h = 14; k.y = 160 - 14; }
    let died = false; const d = s.die; s.die = function () { died = true; }; s.bladeHits(); s.die = d; return died;
  }, [hi, pose]);
  ok('a high lunge kills her standing', await lunge(true, 'stand'));
  ok('crouching, the high lunge passes over', !(await lunge(true, 'crouch')));
  ok('a low lunge kills her standing', await lunge(false, 'stand'));
  ok('jumping, the low lunge passes under', !(await lunge(false, 'air')));
  const chop = (dx) => p.evaluate(dx => { const s = window.__game.scene, c = s.cr, k = s.kid; c.face = 1; c.x = 30 * 16; k.crouch = false; k.h = 14; k.y = 146; k.x = c.x + dx; let died = false; const d = s.die; s.die = function () { died = true; }; s.chopHits(); s.die = d; return died; }, dx);
  ok('the chop kills her in front of them', await chop(8));
  ok('backed off, the chop misses', !(await chop(34)));
  // the searchlight sees her in the open, not crouched in the shadow of a crate; a flash camera
  // overhead cannot see her under the desk
  const sees = (x, crouch, ox, oy, aimX) => p.evaluate(([x, crouch, ox, oy, aimX]) => {
    const s = window.__game.scene, k = s.kid; k.x = x; k.crouch = crouch; k.h = crouch ? 9 : 14; k.y = 160 - k.h;
    const ang = Math.atan2(k.y + k.h / 2 - oy, (aimX != null ? aimX : k.x + 4) - ox) * 180 / Math.PI;
    return s.seenFrom(ox, oy, ang, 9, 230);
  }, [x, crouch, ox, oy, aimX]);
  const crate = await p.evaluate(() => window.__game.scene.props.find(r => r.id === 'crate'));
  ok('the searchlight sees her in the open', await sees(crate.x - 30, false, 484, 24));
  ok('crouched in a crate\u2019s shadow, it does not', !(await sees(crate.x - 9, true, 484, 24)));
  const desk = await p.evaluate(() => window.__game.scene.props.find(r => r.id === 'desk'));
  ok('a flash camera sees her in the open', await sees(35 * 16 - 30, true, 578, 23));
  ok('under the desk, it does not', !(await sees(desk.x + 18, true, 578, 23)));

  // a real death: the take goes up, her body stays on the stage, the creator says something new
  await p.evaluate(() => { const s = window.__game.scene; s.updateCreator = s.__uc; const c = s.cr; c.st = 'lunge'; c.hi = true; c.face = 1; c.x = 30 * 16; s.kid.x = c.x + 12; s.kid.crouch = false; s.kid.h = 14; s.kid.y = 146; c.target = c.x + 20; s.bladeHits(); });
  await until(() => window.__game.scene.sys.settings.key === 'hallway' && window.__game.scene.mode === 'toss' && window.__game.scene.clock > 0.3 && window.__game.state.episode('ep5b').take === 2, null, 15000);
  ok('her take ends, the next take starts on the stage', await p.evaluate(() => window.__game.scene.mode === 'toss' && window.__game.scene.kid.x > 20 * 16));
  ok('her body stays where she fell', await p.evaluate(() => window.__game.state.episode('ep5b').bodies.length === 1 && window.__game.scene.bodyLayer.list.length === 1));
  await until(() => /CREATOR/.test(document.getElementById('cc').textContent), null, 8000);
  ok('the creator starts the take with: "' + await p.evaluate(() => document.getElementById('cc').textContent) + '"', await p.evaluate(() => /Again|Take/.test(document.getElementById('cc').textContent)));

  // review mode through the rest: immunity, N to the end of each round, then out
  await p.keyboard.press('KeyI');
  ok('I turns immunity on', await p.evaluate(() => window.__noDeath === true));
  await until(() => !!window.__game.scene.sword.floor, null, 30000);
  await p.evaluate(() => { const s = window.__game.scene; s.kid.x = s.sword.floor.x - 4; s.pickUp(); });
  await until(() => window.__game.scene.mode === 'fight', null, 20000);
  for (let r = 0; r < 3; r++) { await p.keyboard.press('KeyN'); await until(r => window.__game.scene.mode !== 'fight' || window.__game.scene.cr.round > r, r, 20000); if (r < 2) await until(r => window.__game.scene.mode === 'fight' && window.__game.scene.cr.round === r + 1, r, 40000); }
  await until(() => window.__game.scene.mode === 'yield', null, 20000);
  ok('nine hits: the creator yields', await p.evaluate(() => window.__game.scene.cr.hp === 0));
  for (let i = 0; i < 8; i++) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
  await until(() => window.__game.scene.mode === 'after', null, 40000);
  ok('the red light on their headset is off', await p.evaluate(() => !window.__game.scene.cr.tally));
  await until(() => !window.__game.scene.shutterProp.solid, null, 8000);
  await p.evaluate(() => { const s = window.__game.scene; s.placeAt(46 * 16 + 4); });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(150); await p.keyboard.up('ArrowUp');
  await until(() => { const g = window.__unseen.game; return g.scene.isActive('moon') && window.__game.scene.mode === 'room'; }, null, 15000);
  ok('through the pink door: the playroom', true);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch(e => { console.log('FAIL ' + e.message.split('\n')[0]); process.exit(1); });
