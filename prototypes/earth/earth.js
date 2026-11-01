/* Earth stealth prototype. Placeholder art, mechanics only. Written from scratch for this project. */
(function () {
  'use strict';
  const TILE = 16, VW = 320, VH = 180;
  // Functional placeholder colors (not an art direction): red = danger, cyan = glasses overlay,
  // green-white = harmless or safe, amber = lamps.
  const COL = {
    sky: 0x0b0e1c, skyBand: 0x121831, moon: 0xd8dcef, star: 0x8890b0,
    backWall: 0x161a2b, solid: 0x2a2f47, solidEdge: 0x454d72,
    floor: 0x171b2c, floorAlt: 0x1a1f32, wall: 0x2b3050, wallEdge: 0x3d4466,
    kid: 0xf1e9d8, kidDark: 0x8d8574,
    robot: 0xd6f5e3, robotLed: 0x7dffb0,
    device: 0x4a5070, led: 0xff4646,
    overlay: 0x6fe3ff, beam: 0xff3a3a, beamCore: 0xffe0e0,
    lamp: 0xffb35c, safe: 0x9ef0c2, door: 0x5e5142, pit: 0x05060a, pebble: 0xd0d0d0
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inPoly = (pts, x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  // ---------------- tiny synth (no audio files) ----------------
  const Sound = (() => {
    let ctx = null, muted = false;
    const ensure = () => {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    };
    const tone = (freq, dur, type, vol, slideTo) => {
      if (muted) return; const c = ensure(); if (!c) return;
      const t0 = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(vol || 0.04, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    };
    const noise = (dur, vol) => {
      if (muted) return; const c = ensure(); if (!c) return;
      const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; g.gain.value = vol || 0.12;
      s.connect(g); g.connect(c.destination); s.start();
    };
    return { ensure, tone, noise, toggle() { muted = !muted; return muted; } };
  })();

  // ---------------- shared state + HUD (HTML, outside the canvas) ----------------
  const state = { deaths: 0, hardcore: false, glassesOwned: false, glassesOn: false, pebbles: 0, view: 'side' };
  const byId = id => document.getElementById(id);
  const setText = (id, v) => { const e = byId(id); if (e) e.textContent = v; };
  function hud() {
    setText('h-view', state.view === 'side' ? 'Side view' : 'Top-down');
    setText('h-glasses', !state.glassesOwned ? 'not found' : state.glassesOn ? 'on' : 'broken');
    setText('h-pebbles', state.view === 'top' ? String(state.pebbles) : 'none');
    setText('h-deaths', String(state.deaths));
    setText('h-hard', state.hardcore ? 'on' : 'off');
  }
  let lastHint = '';
  function hint(text) { if (text !== lastHint) { lastHint = text; setText('h-hint', text || ''); } }

  function makeControls(scene) {
    const kb = scene.input.keyboard;
    const K = kb.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S',
      space: 'SPACE', z: 'Z', e: 'E', f: 'F', g: 'G', h: 'H', r: 'R', m: 'M', one: 'ONE', two: 'TWO'
    });
    // One-shot actions come from keydown events, so a tap shorter than a frame is never lost.
    const KC = Phaser.Input.Keyboard.KeyCodes, pressed = new Set();
    kb.on('keydown', ev => { Sound.ensure(); if (!ev.repeat) pressed.add(ev.keyCode); });
    const take = (...codes) => { let hit = false; codes.forEach(c => { if (pressed.has(c)) { pressed.delete(c); hit = true; } }); return hit; };
    return {
      left: () => K.left.isDown || K.a.isDown,
      right: () => K.right.isDown || K.d.isDown,
      up: () => K.up.isDown || K.w.isDown,
      down: () => K.down.isDown || K.s.isDown,
      jumpHeld: () => K.space.isDown || K.z.isDown || K.up.isDown || K.w.isDown,
      jumpPressed: () => take(KC.SPACE, KC.Z, KC.UP, KC.W),
      interact: () => take(KC.E),
      throwPressed: () => take(KC.F, KC.SPACE),
      glasses: () => take(KC.G), hardcore: () => take(KC.H), restart: () => take(KC.R), mute: () => take(KC.M),
      one: () => take(KC.ONE), two: () => take(KC.TWO),
      endFrame: () => pressed.clear()
    };
  }
  function commonKeys(scene, ctl) {
    if (ctl.mute()) { const m = Sound.toggle(); setText('h-sound', m ? 'off' : 'on'); }
    if (ctl.hardcore()) { state.hardcore = !state.hardcore; hud(); }
    if (ctl.one()) { scene.scene.start('side', { fresh: true }); return true; }
    if (ctl.two()) { state.glassesOwned = true; state.glassesOn = true; scene.scene.start('top', { fresh: true }); return true; }
    return false;
  }

  // ---------------- placeholder textures, generated at runtime ----------------
  function makeTextures(scene) {
    if (scene.textures.exists('px')) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const tex = (key, w, h, draw) => { g.clear(); draw(g); g.generateTexture(key, w, h); };
    tex('px', 2, 2, g => { g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 2, 2); });
    tex('kid_side', 8, 14, g => {
      g.fillStyle(COL.kid, 1); g.fillRect(1, 0, 6, 5); g.fillRect(0, 5, 8, 7); g.fillRect(1, 12, 2, 2); g.fillRect(5, 12, 2, 2);
      g.fillStyle(COL.kidDark, 1); g.fillRect(5, 2, 1, 1);
    });
    tex('kid_crouch', 8, 9, g => {
      g.fillStyle(COL.kid, 1); g.fillRect(1, 0, 6, 4); g.fillRect(0, 4, 8, 4); g.fillRect(0, 8, 3, 1); g.fillRect(5, 8, 3, 1);
      g.fillStyle(COL.kidDark, 1); g.fillRect(5, 1, 1, 1);
    });
    const top = (key, nx, ny) => tex(key, 12, 12, g => { g.fillStyle(COL.kid, 1); g.fillCircle(6, 6, 4.5); g.fillStyle(COL.kidDark, 1); g.fillRect(nx, ny, 2, 2); });
    top('kid_down', 5, 8); top('kid_up', 5, 2); top('kid_left', 2, 5); top('kid_right', 8, 5);
    tex('robot_side', 14, 7, g => {
      g.fillStyle(COL.robot, 1); g.fillRect(1, 1, 12, 5); g.fillRect(0, 2, 14, 3);
      g.fillStyle(0x6b7a72, 1); g.fillRect(2, 6, 3, 1); g.fillRect(9, 6, 3, 1);
      g.fillStyle(COL.robotLed, 1); g.fillRect(6, 0, 2, 1);
    });
    tex('robot_top', 12, 12, g => { g.fillStyle(COL.robot, 1); g.fillCircle(6, 6, 5); g.fillStyle(COL.robotLed, 1); g.fillRect(5, 5, 2, 2); });
    tex('cam_side', 10, 6, g => { g.fillStyle(COL.device, 1); g.fillRect(0, 0, 10, 4); g.fillRect(3, 4, 4, 2); });
    tex('cam_top', 10, 10, g => { g.fillStyle(COL.device, 1); g.fillRect(1, 1, 8, 8); g.fillStyle(0x2a2f45, 1); g.fillRect(3, 3, 4, 4); });
    tex('sensor', 12, 12, g => { g.fillStyle(COL.device, 1); g.fillCircle(6, 6, 5); g.fillStyle(0x2a2f45, 1); g.fillCircle(6, 6, 2); });
    tex('emitter', 8, 8, g => { g.fillStyle(COL.device, 1); g.fillRect(1, 1, 6, 6); });
    tex('glasses', 10, 4, g => { g.fillStyle(COL.overlay, 1); g.fillRect(0, 0, 4, 3); g.fillRect(6, 0, 4, 3); g.fillRect(4, 1, 2, 1); });
    tex('pebble', 3, 3, g => { g.fillStyle(COL.pebble, 1); g.fillRect(0, 0, 3, 3); });
    tex('shadow', 4, 2, g => { g.fillStyle(0x000000, 0.6); g.fillRect(0, 0, 4, 2); });
    tex('flag', 6, 12, g => { g.fillStyle(0x8a8f99, 1); g.fillRect(0, 0, 1, 12); g.fillStyle(COL.safe, 1); g.fillRect(1, 0, 5, 4); });
    tex('flag_dim', 6, 12, g => { g.fillStyle(0x5a5f69, 1); g.fillRect(0, 0, 1, 12); g.fillStyle(0x4b6b5c, 1); g.fillRect(1, 0, 5, 4); });
    tex('door_side', 14, 30, g => { g.fillStyle(COL.door, 1); g.fillRect(0, 0, 14, 30); g.fillStyle(0x7a6a56, 1); g.fillRect(2, 2, 10, 12); g.fillRect(2, 16, 10, 12); g.fillStyle(0xd0aa6c, 1); g.fillRect(10, 15, 2, 2); });
    tex('lamp', 40, 40, g => { for (let r = 20; r > 0; r -= 2) { g.fillStyle(COL.lamp, 0.045); g.fillCircle(20, 20, r); } });
    g.destroy();
  }

  // Shared death effects: a beam from the side of the screen, a burst, a shake, a dim flash.
  function makeBoom(scene) {
    const em = scene.add.particles(0, 0, 'px', {
      speed: { min: 25, max: 95 }, lifespan: { min: 250, max: 520 }, scale: { start: 1, end: 0 },
      tint: [0xffffff, 0xffd8a8, 0xff6a3a], emitting: false
    });
    em.setDepth(20);
    return (x, y) => {
      em.explode(14, x, y);
      scene.cameras.main.shake(200, 0.015);
      scene.cameras.main.flash(110, 70, 18, 18);
      Sound.noise(0.35, 0.16);
    };
  }
  function drawStrike(g, cam, x, y) {
    // The laser is from orbit, but it must read as coming from the side: draw it level, from the far screen edge.
    const v = cam.worldView, fromLeft = (x - v.x) > v.width / 2;
    const x0 = fromLeft ? v.x - 2 : v.x + v.width + 2;
    g.lineStyle(6, COL.beam, 0.35); g.lineBetween(x0, y, x, y);
    g.lineStyle(2, COL.beamCore, 1); g.lineBetween(x0, y, x, y);
    Sound.tone(1400, 0.12, 'sawtooth', 0.04, 300);
  }

  // =====================================================================
  // SIDE VIEW: approach, outer rim, waiting room (glasses), camera room, beam room, door
  // =====================================================================
  function buildSideMap() {
    const W = 60, H = 12, m = [];
    for (let y = 0; y < H; y++) m.push(new Array(W).fill(0));
    const solid = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y][x] = 1; };
    solid(0, 10, W - 1, 11);   // ground
    solid(10, 9, 10, 9);       // crate under the side window
    solid(12, 0, W - 1, 0);    // roof line
    solid(12, 1, 13, 5); solid(12, 8, 13, 9); // outer wall, window opening at rows 6 to 7
    solid(30, 1, 30, 6); solid(31, 1, 37, 4); solid(38, 1, 38, 6); // waiting room
    solid(33, 9, 35, 9);       // bench
    solid(39, 1, 58, 3);       // corridor ceiling
    solid(42, 8, 44, 8);       // desk top (hide underneath)
    solid(49, 8, 49, 9);       // waist-high barrier
    solid(59, 0, 59, 11);      // end wall
    return { W, H, m };
  }
  const SK = { w: 8, hStand: 14, hCrouch: 9, run: 72, crouchRun: 34, accG: 900, accA: 585, jumpV: 236, g: 690, maxFall: 260, coyote: 0.1, buffer: 0.1, hold: 0.2 };

  class SideScene extends Phaser.Scene {
    constructor() { super('side'); }
    create(data) {
      makeTextures(this);
      state.view = 'side';
      if (data && data.fresh) { state.glassesOwned = false; state.glassesOn = false; }
      this.map = buildSideMap();
      const WPX = this.map.W * TILE, HPX = this.map.H * TILE;
      const cam = this.cameras.main;
      cam.setBounds(0, 0, WPX, HPX); cam.setBackgroundColor(COL.sky); cam.setRoundPixels(true);
      this.drawBackdrop(WPX); this.drawTiles();
      this.ctl = makeControls(this);
      this.boom = makeBoom(this);
      this.fx = this.add.graphics().setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
      this.ov = this.add.graphics().setDepth(11);
      this.leds = this.add.graphics().setDepth(13);
      // checkpoints: the start, the waiting room
      this.cps = [{ x: 2 * TILE, label: 'start' }, { x: 31 * TILE + 4, label: 'waiting room' }];
      this.cpSprites = this.cps.map(c => this.add.image(c.x + 3, 10 * TILE - 6, 'flag_dim').setDepth(3));
      this.cpIndex = (data && data.cp != null && !state.hardcore) ? data.cp : 0;
      // glasses on the bench
      this.glassesItem = state.glassesOwned ? null : this.add.image(34 * TILE + 8, 9 * TILE - 3, 'glasses').setDepth(4);
      // harmless cleaning robot on the outer rim
      this.robot = { x: 17 * TILE, min: 16 * TILE, max: 28 * TILE, dir: 1, speed: 22, boopT: 0 };
      this.robotSpr = this.add.image(0, 0, 'robot_side').setOrigin(0.5, 1).setDepth(5);
      // ceiling camera that sweeps the corridor
      this.camDev = { x: 46 * TILE + 8, y: 4 * TILE + 3, a0: 64, a1: 150, period: 4.4, half: 14, range: 122, lock: 0 };
      this.add.image(this.camDev.x, this.camDev.y - 2, 'cam_side').setDepth(6);
      // beam port on the end wall: tell, charge, fire
      this.beam = { x0: 50 * TILE, x1: 59 * TILE, heights: [146, 157], idx: 0, phase: 'idle', t: 0 };
      this.add.image(59 * TILE - 3, 146, 'emitter').setDepth(6); this.add.image(59 * TILE - 3, 157, 'emitter').setDepth(6);
      this.door = { x: 57 * TILE + 1, y: 10 * TILE - 30, w: 14, h: 30 };
      this.add.image(this.door.x, this.door.y, 'door_side').setOrigin(0).setDepth(2);
      // kid
      this.kidSpr = this.add.image(0, 0, 'kid_side').setOrigin(0.5, 1).setDepth(8);
      this.reticle = this.add.graphics().setDepth(14);
      this.spawn();
      cam.startFollow(this.kidSpr, true, 0.18, 0.18, 0, 20);
      cam.fadeIn(250);
      hud();
    }
    drawBackdrop(WPX) {
      const g = this.add.graphics().setScrollFactor(0).setDepth(-10);
      g.fillStyle(COL.sky, 1); g.fillRect(0, 0, VW, VH);
      g.fillStyle(COL.skyBand, 1); g.fillRect(0, 110, VW, 70);
      const stars = this.add.graphics().setScrollFactor(0.05).setDepth(-9);
      for (let i = 0; i < 60; i++) { stars.fillStyle(COL.star, 0.4 + ((i * 37) % 5) / 10); stars.fillRect((i * 97) % 700, (i * 53) % 100, 1, 1); }
      const moon = this.add.graphics().setScrollFactor(0.1).setDepth(-8);
      moon.fillStyle(COL.moon, 1); moon.fillCircle(70, 34, 12); moon.fillStyle(COL.sky, 1); moon.fillCircle(76, 30, 11);
      const back = this.add.graphics().setDepth(-5);
      back.fillStyle(COL.backWall, 1); back.fillRect(12 * TILE, 0, WPX - 12 * TILE, 10 * TILE);
      [[20, 3], [26, 3], [34, 6], [53, 5]].forEach(([tx, ty]) => this.add.image(tx * TILE, ty * TILE, 'lamp').setDepth(-4).setBlendMode(Phaser.BlendModes.ADD));
    }
    drawTiles() {
      const g = this.add.graphics().setDepth(1), m = this.map.m;
      for (let y = 0; y < this.map.H; y++) for (let x = 0; x < this.map.W; x++) {
        if (!m[y][x]) continue;
        g.fillStyle(COL.solid, 1); g.fillRect(x * TILE, y * TILE, TILE, TILE);
        if (y > 0 && !m[y - 1][x]) { g.fillStyle(COL.solidEdge, 1); g.fillRect(x * TILE, y * TILE, TILE, 2); }
      }
    }
    solidTile(tx, ty) { if (tx < 0 || tx >= this.map.W || ty >= this.map.H) return true; if (ty < 0) return false; return this.map.m[ty][tx] === 1; }
    solidPx(px, py) { return this.solidTile(Math.floor(px / TILE), Math.floor(py / TILE)); }
    boxHits(x, y, w, h) {
      const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.001) / TILE), y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.001) / TILE);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solidTile(tx, ty)) return true;
      return false;
    }
    spawn() {
      const cp = this.cps[state.hardcore ? 0 : this.cpIndex];
      this.kid = { x: cp.x, y: 10 * TILE - SK.hStand, w: SK.w, h: SK.hStand, vx: 0, vy: 0, onGround: true, crouch: false, coyote: 0, buffer: 0, holdT: 0, face: 1 };
      this.dead = false; this.leaving = false; this.clock = 0;
      this.camDev.lock = 0; this.beam.phase = 'idle'; this.beam.t = 0; this.beam.idx = 0;
      this.cpSprites.forEach((s, i) => s.setTexture(i <= this.cpIndex ? 'flag' : 'flag_dim'));
      this.kidSpr.setTexture('kid_side').setVisible(true);
    }
    update(time, delta) {
      const dt = Math.min(delta / 1000, 1 / 30), ctl = this.ctl;
      if (commonKeys(this, ctl)) return;
      if (ctl.glasses() && state.glassesOwned) { state.glassesOn = !state.glassesOn; hud(); }
      if (ctl.restart() && !this.leaving) { if (state.hardcore) this.cpIndex = 0; this.spawn(); }
      this.clock += dt;
      if (!this.dead && !this.leaving) this.moveKid(dt);
      this.updateRobot(dt);
      this.updateBeam(dt);
      this.updateCamera(dt);
      this.checkpointsAndItems();
      this.draw();
      this.contextHint();
      ctl.endFrame();
    }
    moveKid(dt) {
      const k = this.kid, c = this.ctl;
      const dir = (c.right() ? 1 : 0) - (c.left() ? 1 : 0);
      if (c.down() && k.onGround && !k.crouch) { k.y += SK.hStand - SK.hCrouch; k.h = SK.hCrouch; k.crouch = true; }
      else if (!c.down() && k.crouch && !this.boxHits(k.x, k.y - (SK.hStand - SK.hCrouch), k.w, SK.hStand)) { k.y -= SK.hStand - SK.hCrouch; k.h = SK.hStand; k.crouch = false; }
      const top = k.crouch ? SK.crouchRun : SK.run, target = dir * top, acc = k.onGround ? SK.accG : SK.accA;
      if (k.vx < target) k.vx = Math.min(target, k.vx + acc * dt); else if (k.vx > target) k.vx = Math.max(target, k.vx - acc * dt);
      if (dir) k.face = dir;
      // jump with coyote time, a jump buffer, and a held-jump window
      if (c.jumpPressed() && !this.atDoor()) k.buffer = SK.buffer; else k.buffer = Math.max(0, k.buffer - dt);
      k.coyote = k.onGround ? SK.coyote : Math.max(0, k.coyote - dt);
      if (k.buffer > 0 && k.coyote > 0 && !k.crouch) {
        k.vy = -SK.jumpV; k.buffer = 0; k.coyote = 0; k.holdT = SK.hold; k.onGround = false;
        Sound.tone(480, 0.07, 'square', 0.025, 720);
      }
      if (k.holdT > 0) { k.holdT -= dt; if (!c.jumpHeld()) { if (k.vy < 0) k.vy *= 0.5; k.holdT = 0; } }
      const apex = Math.abs(k.vy) < 40 && c.jumpHeld();
      k.vy = Math.min(SK.maxFall, k.vy + SK.g * (apex ? 0.5 : 1) * dt);
      // horizontal move, then vertical move, each resolved against tiles
      let nx = k.x + k.vx * dt;
      if (this.boxHits(nx, k.y, k.w, k.h)) {
        nx = k.vx > 0 ? Math.floor((nx + k.w) / TILE) * TILE - k.w : (Math.floor(nx / TILE) + 1) * TILE;
        k.vx = 0;
      }
      k.x = nx;
      let ny = k.y + k.vy * dt;
      k.onGround = false;
      if (this.boxHits(k.x, ny, k.w, k.h)) {
        if (k.vy > 0) { ny = Math.floor((ny + k.h) / TILE) * TILE - k.h; k.onGround = true; k.vy = 0; }
        else {
          let nudged = false;
          for (const s of [1, -1, 2, -2, 3, -3, 4, -4]) if (!this.boxHits(k.x + s, ny, k.w, k.h)) { k.x += s; nudged = true; break; }
          if (!nudged) { ny = (Math.floor(ny / TILE) + 1) * TILE; k.vy = 0; }
        }
      }
      k.y = ny;
      if (k.y > this.map.H * TILE) this.die('fall');
      if (c.interact() || (c.up() && this.atDoor())) {
        if (this.atDoor()) this.enterDoor();
        else if (this.glassesItem && Math.abs(k.x + 4 - this.glassesItem.x) < 40 && Math.abs(k.y + k.h - (9 * TILE)) < 24) this.takeGlasses();
      }
    }
    lethalBox() { const k = this.kid; return { x: k.x + 1, y: k.y + 2, w: k.w - 2, h: k.h - 3 }; }
    atDoor() { const k = this.kid, d = this.door; return k.x + k.w > d.x && k.x < d.x + d.w && k.y + k.h > d.y; }
    takeGlasses() {
      state.glassesOwned = true; state.glassesOn = true;
      this.glassesItem.destroy(); this.glassesItem = null;
      Sound.tone(660, 0.08, 'triangle', 0.05, 990); this.time.delayedCall(90, () => Sound.tone(990, 0.1, 'triangle', 0.05));
      hud();
    }
    enterDoor() {
      if (this.leaving || this.dead) return;
      this.leaving = true;
      const cam = this.cameras.main;
      cam.stopFollow(); cam.pan(this.door.x + 7, this.door.y + 15, 650, 'Sine.easeInOut'); cam.zoomTo(2, 800, 'Sine.easeIn');
      cam.fadeOut(800, 0, 0, 0);
      Sound.tone(220, 0.4, 'triangle', 0.05, 110);
      cam.once('camerafadeoutcomplete', () => this.scene.start('top', { fresh: true }));
    }
    checkpointsAndItems() {
      const k = this.kid;
      if (state.hardcore) return;
      this.cps.forEach((c, i) => {
        if (i > this.cpIndex && k.x >= c.x - 4) { this.cpIndex = i; this.cpSprites[i].setTexture('flag'); Sound.tone(880, 0.06, 'triangle', 0.04, 1320); }
      });
    }
    updateRobot(dt) {
      const r = this.robot;
      r.x += r.dir * r.speed * dt;
      if (r.x > r.max) { r.x = r.max; r.dir = -1; } if (r.x < r.min) { r.x = r.min; r.dir = 1; }
      this.robotSpr.setPosition(Math.round(r.x), 10 * TILE).setFlipX(r.dir < 0);
      r.boopT = Math.max(0, r.boopT - dt);
      const k = this.kid;
      if (!this.dead && r.boopT === 0 && Math.abs(k.x + 4 - r.x) < 9 && k.y + k.h > 10 * TILE - 8) {
        r.boopT = 1.2; r.dir *= -1; Sound.tone(300, 0.08, 'sine', 0.05, 420); // it bumps you and turns around; harmless
      }
    }
    camAngle() { const d = this.camDev, s = (Math.sin(this.clock * Math.PI * 2 / d.period) + 1) / 2; return d.a0 + (d.a1 - d.a0) * s; }
    coneFor(dev, angle) {
      const pts = [{ x: dev.x, y: dev.y }];
      for (let a = angle - dev.half; a <= angle + dev.half + 0.001; a += 1) {
        const r = a * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r);
        let d = 0;
        while (d < dev.range) { d += 2; if (this.solidPx(dev.x + dx * d, dev.y + dy * d)) { d -= 1; break; } }
        d = Math.min(d, dev.range);
        pts.push({ x: dev.x + dx * d, y: dev.y + dy * d });
      }
      return pts;
    }
    updateCamera(dt) {
      const dev = this.camDev;
      this.cone = this.coneFor(dev, this.camAngle());
      if (this.dead || this.leaving) { dev.lock = 0; return; }
      const b = this.lethalBox(), cx = b.x + b.w / 2;
      const seen = [b.y + 1, b.y + b.h / 2, b.y + b.h - 1].some(y => inPoly(this.cone, cx, y));
      if (seen) {
        if (dev.lock === 0) Sound.tone(1200, 0.05, 'square', 0.03);
        dev.lock += dt;
        if (dev.lock >= 0.5) { dev.lock = 0; this.die('camera'); }
      } else dev.lock = Math.max(0, dev.lock - dt * 2);
    }
    updateBeam(dt) {
      const B = this.beam, durations = { idle: 1.0, tell: 0.6, charge: 0.6, fire: 0.35 }, next = { idle: 'tell', tell: 'charge', charge: 'fire', fire: 'idle' };
      B.t += dt;
      if (B.t >= durations[B.phase]) {
        B.t = 0; B.phase = next[B.phase];
        if (B.phase === 'idle') B.idx = (B.idx + 1) % B.heights.length;
        if (B.phase === 'charge') Sound.tone(300, 0.6, 'sawtooth', 0.018, 900);
        if (B.phase === 'fire') Sound.tone(900, 0.3, 'square', 0.02, 700);
      }
      if (B.phase === 'fire' && !this.dead && !this.leaving) {
        const y = B.heights[B.idx], b = this.lethalBox();
        if (b.x + b.w > B.x0 && b.x < B.x1 && y >= b.y - 1 && y <= b.y + b.h + 1) this.die('beam');
      }
    }
    die(cause) {
      if (this.dead) return;
      this.dead = true;
      const b = this.lethalBox(), x = b.x + b.w / 2, y = b.y + b.h / 2;
      this.strikeFx = cause === 'camera' ? { x, y, until: this.clock + 0.16 } : null;
      this.kidSpr.setVisible(false);
      this.boom(x, y);
      state.deaths++; hud();
      this.time.delayedCall(520, () => { if (state.hardcore) this.cpIndex = 0; this.spawn(); });
    }
    draw() {
      const k = this.kid, fx = this.fx, ov = this.ov, leds = this.leds, glasses = state.glassesOwned && state.glassesOn;
      this.kidSpr.setTexture(k.crouch ? 'kid_crouch' : 'kid_side').setPosition(Math.round(k.x + k.w / 2), Math.round(k.y + k.h)).setFlipX(k.face < 0);
      fx.clear(); ov.clear(); leds.clear(); this.reticle.clear();
      // camera cone: the glasses draw exactly the polygon the hit test uses
      if (glasses && this.cone) {
        ov.fillStyle(COL.overlay, this.camDev.lock > 0 ? 0.22 : 0.12); ov.fillPoints(this.cone, true);
        ov.lineStyle(1, COL.overlay, 0.55); ov.strokePoints(this.cone, true, true);
      }
      const blink = (this.camDev.lock > 0 ? Math.floor(this.clock * 16) : Math.floor(this.clock * 2)) % 2 === 0;
      if (blink) { leds.fillStyle(COL.led, 1); leds.fillRect(this.camDev.x - 1, this.camDev.y + 1, 2, 2); }
      if (this.camDev.lock > 0 && !this.dead) {
        const b = this.lethalBox(), cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = 8 - this.camDev.lock * 8;
        this.reticle.lineStyle(1, COL.led, 1); this.reticle.strokeRect(cx - 4 - r, cy - 4 - r, 8 + 2 * r, 8 + 2 * r);
        this.reticle.lineStyle(1, COL.led, 0.6); this.reticle.lineBetween(this.camDev.x, this.camDev.y, cx, cy);
      }
      // beam: tell, charge, fire share one line
      const B = this.beam, y = B.heights[B.idx];
      if (glasses) { ov.lineStyle(1, COL.beam, 0.22); ov.lineBetween(B.x0, y, B.x1, y); }
      if (B.phase === 'tell' || B.phase === 'charge') {
        const strength = B.phase === 'tell' ? 0.3 : 0.45 + 0.5 * (B.t / 0.6);
        if (glasses || B.phase === 'charge') { fx.lineStyle(1, COL.beam, strength); fx.lineBetween(B.x0, y, B.x1, y); }
        const flick = Math.floor(this.clock * (B.phase === 'tell' ? 8 : 16)) % 2 === 0;
        if (flick) { leds.fillStyle(COL.led, 1); leds.fillTriangle(B.x1 - 2, y, B.x1 - 7, y - 3, B.x1 - 7, y + 3); }
      } else if (B.phase === 'fire') {
        fx.lineStyle(6, COL.beam, 0.35); fx.lineBetween(B.x0, y, B.x1, y);
        fx.lineStyle(2, COL.beamCore, 1); fx.lineBetween(B.x0, y, B.x1, y);
      }
      if (this.strikeFx && this.clock < this.strikeFx.until) drawStrike(fx, this.cameras.main, this.strikeFx.x, this.strikeFx.y);
      if (this.glassesItem) this.glassesItem.setY(9 * TILE - 3 - (Math.floor(this.clock * 2) % 2));
    }
    contextHint() {
      const x = this.kid.x / TILE;
      if (this.leaving) return hint('Through the door. The view switches to top-down.');
      if (x < 12) return hint('Arrows or A/D move. Space jumps. Climb the crate and go in through the window.');
      if (x < 30) return hint('A cleaning robot. It only cleans; touching it is safe.');
      if (x < 38) return hint(state.glassesOwned ? 'Glasses on: they show camera range and laser paths. G turns them off (demo).' : 'Something on the bench. Press E to take it.');
      if (x < 49) return hint('Stay out of the cone for half a second and nothing happens. Hide under the desk, or move while it looks away.');
      return hint('Watch the beam. High beam: crouch with Down. Low beam: jump. Then press E at the door.');
    }
  }

  // =====================================================================
  // TOP-DOWN VIEW: five rooms, tile-locked movement, one danger map drawn and tested
  // =====================================================================
  function buildTopMap() {
    const W = 30, H = 20, m = [];
    for (let y = 0; y < H; y++) m.push(new Array(W).fill(1));
    const floor = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y][x] = 0; };
    floor(1, 13, 9, 18); floor(11, 13, 18, 18); floor(20, 13, 28, 18); floor(20, 1, 28, 11); floor(11, 1, 18, 11);
    [[10, 16], [19, 16], [26, 12], [19, 3]].forEach(([x, y]) => { m[y][x] = 0; });
    [[23, 4], [23, 5], [25, 8], [26, 8]].forEach(([x, y]) => { m[y][x] = 1; });
    return { W, H, m };
  }
  const ROOMS = [
    { name: 'R1', x0: 1, y0: 13, x1: 10, y1: 18, hint: 'Top-down. Arrows move one tile at a time. The robot is harmless. G breaks the glasses (demo of level 3).' },
    { name: 'R2', x0: 11, y0: 13, x1: 19, y1: 18, hint: 'Motion sensor: stand still while it pulses. Or throw a pebble with F to set it off, then cross while it recharges.' },
    { name: 'R3', x0: 20, y0: 12, x1: 28, y1: 18, hint: 'Laser tripwire: cross while it is off. Watch the floor too; a pebble shows what is hidden.' },
    { name: 'R4', x0: 20, y0: 1, x1: 28, y1: 11, hint: 'Sweeping camera: move while it looks away. Pillars block its view.' },
    { name: 'R5', x0: 11, y0: 1, x1: 19, y1: 11, hint: 'Fixed camera: it cannot see past its range. Find the way around to the exit.' }
  ];

  class TopScene extends Phaser.Scene {
    constructor() { super('top'); }
    create(data) {
      makeTextures(this);
      state.view = 'top';
      if (!state.glassesOwned) { state.glassesOwned = true; state.glassesOn = true; }
      this.map = buildTopMap();
      const W = this.map.W, H = this.map.H, cam = this.cameras.main;
      cam.setBounds(0, 0, W * TILE, H * TILE); cam.setBackgroundColor(0x05060a); cam.setRoundPixels(true);
      this.drawTiles();
      this.ctl = makeControls(this);
      this.boom = makeBoom(this);
      this.coneCache = new Map();
      this.cams = [
        { id: 'sweep', tx: 19, ty: 7, base: 0, sweep: 50, period: 5, half: 20, range: 8, reveal: 0 },
        { id: 'fixed', tx: 15, ty: 0, base: 90, sweep: 0, period: 1, half: 20, range: 9, reveal: 0 }
      ];
      this.sensors = [{ tx: 15, ty: 15, radius: 3.2, period: 1.2, window: 0.3, cool: 0, reveal: 0 }];
      this.lasers = [{ x: 23, y0: 13, y1: 18, on: 1.4, off: 1.0, reveal: 0 }];
      this.checkpoints = [{ tx: 3, ty: 16 }, { tx: 20, ty: 16 }, { tx: 26, ty: 11 }, { tx: 18, ty: 3 }];
      this.exit = { tx: 12, ty: 2 };
      this.cams.forEach(c => this.add.image(c.tx * TILE + 8, c.ty * TILE + 8, 'cam_top').setDepth(2));
      this.sensors.forEach(s => this.add.image(s.tx * TILE + 8, s.ty * TILE + 8, 'sensor').setDepth(2));
      this.lasers.forEach(l => { this.add.image(l.x * TILE + 8, (l.y0 - 1) * TILE + 12, 'emitter').setDepth(2); this.add.image(l.x * TILE + 8, (l.y1 + 1) * TILE + 4, 'emitter').setDepth(2); });
      this.cpMarks = this.checkpoints.map(c => this.add.image(c.tx * TILE + 8, c.ty * TILE + 8, 'flag_dim').setDepth(2));
      this.floorG = this.add.graphics().setDepth(1);   // trap doors that have opened
      this.ov = this.add.graphics().setDepth(6);       // glasses overlay and reveals (drawn above the dark)
      this.leds = this.add.graphics().setDepth(9);     // tells that survive the dark
      this.fx = this.add.graphics().setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
      this.robotSpr = this.add.image(0, 0, 'robot_top').setDepth(3);
      this.pebbleSpr = this.add.image(0, 0, 'pebble').setDepth(8).setVisible(false);
      this.pebbleShadow = this.add.image(0, 0, 'shadow').setDepth(3).setVisible(false);
      this.kidSpr = this.add.image(0, 0, 'kid_down').setDepth(8);
      this.makeDark();
      this.dark = this.add.image(0, 0, 'dark').setDepth(5);
      this.resetLevel();
      cam.startFollow(this.kidSpr, true, 0.2, 0.2);
      cam.fadeIn(300);
      this.inputLock = 0.6; // a beat to read the room after the door
      this.input.on('pointerdown', ptr => {
        if (this.dead || this.complete || this.inputLock > 0) return;
        const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
        this.throwAt(Math.floor(wp.x / TILE), Math.floor(wp.y / TILE));
      });
      hud();
    }
    makeDark() {
      if (this.textures.exists('dark')) return;
      const w = 680, h = 400, c = this.textures.createCanvas('dark', w, h), ctx = c.getContext();
      ctx.fillStyle = 'rgba(3,4,9,0.95)'; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      const grad = ctx.createRadialGradient(w / 2, h / 2, 22, w / 2, h / 2, 44);
      grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(w / 2, h / 2, 44, 0, Math.PI * 2); ctx.fill();
      c.refresh();
    }
    drawTiles() {
      const g = this.add.graphics().setDepth(0), m = this.map.m;
      for (let y = 0; y < this.map.H; y++) for (let x = 0; x < this.map.W; x++) {
        if (m[y][x]) {
          g.fillStyle(COL.wall, 1); g.fillRect(x * TILE, y * TILE, TILE, TILE);
          if (y + 1 < this.map.H && !m[y + 1][x]) { g.fillStyle(COL.wallEdge, 1); g.fillRect(x * TILE, y * TILE + TILE - 3, TILE, 3); }
        } else { g.fillStyle((x + y) % 2 ? COL.floor : COL.floorAlt, 1); g.fillRect(x * TILE, y * TILE, TILE, TILE); }
      }
      const e = this.add.graphics().setDepth(1);
      e.fillStyle(COL.safe, 0.85); e.fillRect(12 * TILE + 3, 2 * TILE + 3, 10, 10); e.fillStyle(0x05060a, 1); e.fillRect(12 * TILE + 6, 2 * TILE + 6, 4, 4);
    }
    resetLevel() {
      this.traps = [{ tx: 25, ty: 15, open: false, reveal: 0 }];
      this.cpIndex = 0; this.cpMarks.forEach((s, i) => s.setTexture(i === 0 ? 'flag' : 'flag_dim'));
      state.pebbles = 5;
      this.robot = { tx: 6, ty: 15, fx: 6, fy: 15, p: 1, t: 0 };
      this.complete = false;
      this.respawn();
    }
    respawn() {
      const cp = this.checkpoints[this.cpIndex];
      this.kid = { tx: cp.tx, ty: cp.ty, fx: cp.tx, fy: cp.ty, p: 1, moving: false, face: 'down' };
      this.dead = false; this.clock = 0; this.culprit = null; this.strikeFx = null; this.flight = null; this.noise = [];
      this.sensors.forEach(s => { s.cool = 0; });
      this.kidSpr.setVisible(true).setScale(1).setTexture('kid_down');
      hud();
    }
    wall(x, y) { return x < 0 || y < 0 || x >= this.map.W || y >= this.map.H || this.map.m[y][x] === 1; }
    blocked(x, y) {
      if (this.wall(x, y)) return true;
      if (this.sensors.some(s => s.tx === x && s.ty === y)) return true;
      if (this.traps.some(t => t.open && t.tx === x && t.ty === y)) return true;
      return false;
    }
    los(x0, y0, x1, y1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 1; i < n; i++) { const t = i / n; if (this.wall(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t))) return false; }
      return true;
    }
    heading(c) { return c.base + c.sweep * Math.sin(this.clock * Math.PI * 2 / c.period); }
    coneTiles(c) {
      const h = Math.round(this.heading(c)), key = c.id + ':' + h;
      if (this.coneCache.has(key)) return this.coneCache.get(key);
      const out = new Set(), R = c.range, ox = c.tx + 0.5, oy = c.ty + 0.5;
      for (let ty = Math.max(0, c.ty - R); ty <= Math.min(this.map.H - 1, c.ty + R); ty++) {
        for (let tx = Math.max(0, c.tx - R); tx <= Math.min(this.map.W - 1, c.tx + R); tx++) {
          if (this.wall(tx, ty)) continue;
          const dx = tx + 0.5 - ox, dy = ty + 0.5 - oy, d = Math.hypot(dx, dy);
          if (d > R || d < 0.5) continue;
          const diff = ((Math.atan2(dy, dx) * 180 / Math.PI - h) % 360 + 540) % 360 - 180;
          if (Math.abs(diff) > c.half) continue;
          if (!this.los(c.tx, c.ty, tx, ty)) continue;
          out.add(ty * this.map.W + tx);
        }
      }
      this.coneCache.set(key, out);
      return out;
    }
    sensorPulse(s) { return s.cool <= 0 && (this.clock % s.period) < s.window; }
    laserOn(l) { return (this.clock % (l.on + l.off)) < l.on; }
    occupied() { const k = this.kid; return k.moving && k.p < 0.5 ? { x: k.fx, y: k.fy } : { x: k.tx, y: k.ty }; }
    roomAt(x, y) { return ROOMS.find(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1); }

    update(time, delta) {
      const dt = Math.min(delta / 1000, 1 / 30), ctl = this.ctl;
      if (commonKeys(this, ctl)) return;
      if (ctl.glasses()) this.toggleGlasses();
      if (ctl.restart()) { if (state.hardcore) this.resetLevel(); else this.respawn(); }
      if (!this.complete) this.clock += dt;
      this.sensors.forEach(s => { s.cool = Math.max(0, s.cool - dt); });
      this.inputLock = Math.max(0, (this.inputLock || 0) - dt);
      if (!this.dead && !this.complete && this.inputLock === 0) {
        this.moveKid(dt);
        if (ctl.throwPressed()) this.throwPebble();
      }
      this.updateRobot(dt);
      this.updateFlight(dt);
      if (!this.dead && !this.complete) this.checkDanger();
      this.draw(dt);
      const o = this.occupied(), room = this.roomAt(o.x, o.y);
      if (this.complete) hint('Slice complete. Press 1 to replay the side view, or 2 to replay this floor.');
      else if (room) hint(room.hint);
      ctl.endFrame();
    }
    toggleGlasses() {
      if (this.breaking) return;
      if (state.glassesOn) {
        // the break: the overlay stutters for about 1.5 s, then dies
        this.breaking = true; Sound.noise(0.25, 0.08);
        this.time.addEvent({ delay: 90, repeat: 15, callback: () => { this.stutter = Math.random() < 0.5; if (Math.random() < 0.3) Sound.tone(2000 + Math.random() * 2000, 0.03, 'square', 0.015); } });
        this.time.delayedCall(1500, () => { this.breaking = false; this.stutter = false; state.glassesOn = false; hud(); Sound.tone(180, 0.3, 'sawtooth', 0.04, 60); });
      } else { state.glassesOn = true; hud(); Sound.tone(660, 0.08, 'triangle', 0.05, 990); }
    }
    speed() { return state.glassesOn || this.breaking ? 9 : 6.3; } // tiles per second; 70 percent without glasses
    moveKid(dt) {
      const k = this.kid, c = this.ctl;
      if (k.moving) {
        k.p += dt * this.speed();
        if (k.p >= 1) { k.p = 1; k.moving = false; this.arrive(); }
      }
      if (!k.moving && !this.dead) {
        let dx = 0, dy = 0, face = null;
        if (c.left()) { dx = -1; face = 'left'; } else if (c.right()) { dx = 1; face = 'right'; } else if (c.up()) { dy = -1; face = 'up'; } else if (c.down()) { dy = 1; face = 'down'; }
        if (face) {
          k.face = face;
          if (!this.blocked(k.tx + dx, k.ty + dy)) { k.fx = k.tx; k.fy = k.ty; k.tx += dx; k.ty += dy; k.p = 0; k.moving = true; }
        }
      }
    }
    arrive() {
      const k = this.kid;
      const trap = this.traps.find(t => !t.open && t.tx === k.tx && t.ty === k.ty);
      if (trap) { trap.open = true; trap.reveal = 2; this.die('trap', trap); return; }
      this.checkpoints.forEach((cp, i) => {
        if (!state.hardcore && i > this.cpIndex && cp.tx === k.tx && cp.ty === k.ty) {
          this.cpIndex = i; this.cpMarks[i].setTexture('flag'); state.pebbles = 5; hud();
          Sound.tone(880, 0.06, 'triangle', 0.04, 1320);
        }
      });
      if (k.tx === this.exit.tx && k.ty === this.exit.ty) { this.complete = true; Sound.tone(523, 0.12, 'triangle', 0.05); this.time.delayedCall(130, () => Sound.tone(784, 0.2, 'triangle', 0.05)); }
    }
    checkDanger() {
      const o = this.occupied(), idx = o.y * this.map.W + o.x;
      for (const c of this.cams) if (this.coneTiles(c).has(idx)) return this.die('camera', c);
      for (const s of this.sensors) if (this.kid.moving && this.sensorPulse(s) && Math.hypot(o.x - s.tx, o.y - s.ty) <= s.radius) return this.die('sensor', s);
      for (const l of this.lasers) if (this.laserOn(l) && o.x === l.x && o.y >= l.y0 && o.y <= l.y1) return this.die('laser', l);
    }
    kidPx() { const k = this.kid; return { x: (k.fx + (k.tx - k.fx) * k.p) * TILE + 8, y: (k.fy + (k.ty - k.fy) * k.p) * TILE + 8 }; }
    die(cause, src) {
      if (this.dead) return;
      this.dead = true;
      const p = this.kidPx();
      const finish = () => {
        state.deaths++; hud();
        this.time.delayedCall(500, () => { if (state.hardcore) this.resetLevel(); else this.respawn(); });
      };
      if (cause === 'trap') {
        Sound.tone(300, 0.4, 'triangle', 0.05, 60);
        this.tweens.add({ targets: this.kidSpr, scale: 0, duration: 350, onComplete: () => { this.kidSpr.setVisible(false); finish(); } });
        return;
      }
      if (cause === 'laser') { this.kidSpr.setVisible(false); this.boom(p.x, p.y); finish(); return; }
      // camera or sensor: freeze, show the culprit, then the strike from the side
      this.culprit = { x: src.tx * TILE + 8, y: src.ty * TILE + 8, tx: p.x, ty: p.y };
      if (src.reveal !== undefined) src.reveal = 1.5;
      Sound.tone(1200, 0.08, 'square', 0.035); this.time.delayedCall(120, () => Sound.tone(1200, 0.08, 'square', 0.035));
      this.time.delayedCall(500, () => {
        this.culprit = null; this.strikeFx = { x: p.x, y: p.y, until: this.clock + 0.16 };
        this.kidSpr.setVisible(false); this.boom(p.x, p.y); finish();
      });
    }
    throwPebble() {
      // F or Space: four tiles ahead, or up to the first wall
      const k = this.kid, d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[k.face];
      let x = k.tx, y = k.ty;
      for (let i = 0; i < 4; i++) { const nx = x + d[0], ny = y + d[1]; if (this.wall(nx, ny)) break; x = nx; y = ny; }
      this.startFlight(x, y);
    }
    throwAt(tx, ty) {
      // click: any floor tile within 5 tiles that the kid can see
      const k = this.kid;
      if (this.wall(tx, ty) || Math.hypot(tx - k.tx, ty - k.ty) > 5 || !this.los(k.tx, k.ty, tx, ty)) { Sound.tone(150, 0.06, 'square', 0.03); return; }
      const dx = tx - k.tx, dy = ty - k.ty;
      if (dx || dy) k.face = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      this.startFlight(tx, ty);
    }
    startFlight(x, y) {
      const k = this.kid;
      if (this.flight) return;
      if (state.pebbles <= 0 || (x === k.tx && y === k.ty)) { Sound.tone(150, 0.06, 'square', 0.03); return; }
      state.pebbles--; hud();
      const dist = Math.hypot(x - k.tx, y - k.ty);
      this.flight = { sx: k.tx, sy: k.ty, ex: x, ey: y, t: 0, dur: 0.22 + dist * 0.05, crossed: new Set() };
      Sound.tone(700, 0.04, 'square', 0.02);
    }
    updateFlight(dt) {
      const f = this.flight;
      if (!f) { this.pebbleSpr.setVisible(false); this.pebbleShadow.setVisible(false); return; }
      f.t += dt;
      const u = Math.min(1, f.t / f.dur), gx = (f.sx + (f.ex - f.sx) * u) * TILE + 8, gy = (f.sy + (f.ey - f.sy) * u) * TILE + 8;
      const z = 4 * 12 * u * (1 - u);
      this.pebbleSpr.setVisible(true).setPosition(Math.round(gx), Math.round(gy - z));
      this.pebbleShadow.setVisible(true).setPosition(Math.round(gx), Math.round(gy + 3));
      // a pebble crossing a live beam sparks and shows the beam for a moment
      const cx = Math.round((gx - 8) / TILE), cy = Math.round((gy - 8) / TILE);
      this.lasers.forEach((l, i) => {
        if (this.laserOn(l) && cx === l.x && cy >= l.y0 && cy <= l.y1 && !f.crossed.has(i)) {
          f.crossed.add(i); l.reveal = 1.2; this.sparkAt = { x: gx, y: gy - z, until: this.clock + 0.2 }; Sound.tone(2400, 0.05, 'square', 0.03);
        }
      });
      if (u >= 1) { this.flight = null; this.land(f.ex, f.ey); }
    }
    land(x, y) {
      Sound.tone(520, 0.03, 'square', 0.03);
      this.noise.push({ x: x * TILE + 8, y: y * TILE + 8, t: 0 });
      const trap = this.traps.find(t => !t.open && t.tx === x && t.ty === y);
      if (trap) { trap.open = true; trap.reveal = 2; Sound.tone(260, 0.25, 'triangle', 0.05, 90); }
      const idx = y * this.map.W + x;
      for (const s of this.sensors) {
        if (s.cool <= 0 && Math.hypot(x - s.tx, y - s.ty) <= s.radius) {
          s.cool = 3.5; s.reveal = 1.2; this.strikeFx = { x: x * TILE + 8, y: y * TILE + 8, until: this.clock + 0.16 };
        }
      }
      for (const c of this.cams) {
        if (this.coneTiles(c).has(idx)) { c.reveal = 1.4; this.strikeFx = { x: x * TILE + 8, y: y * TILE + 8, until: this.clock + 0.16 }; }
      }
    }
    updateRobot(dt) {
      const r = this.robot;
      r.p = Math.min(1, r.p + dt * 2.2);
      if (r.p >= 1) {
        r.t -= dt;
        if (r.t <= 0) {
          r.t = 0.3 + Math.random() * 0.6;
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => { const nx = r.tx + dx, ny = r.ty + dy; return nx >= 2 && nx <= 8 && ny >= 14 && ny <= 17 && !this.wall(nx, ny); });
          const d = dirs[Math.floor(Math.random() * dirs.length)];
          if (d) { r.fx = r.tx; r.fy = r.ty; r.tx += d[0]; r.ty += d[1]; r.p = 0; }
        }
      }
      this.robotSpr.setPosition(Math.round((r.fx + (r.tx - r.fx) * r.p) * TILE + 8), Math.round((r.fy + (r.ty - r.fy) * r.p) * TILE + 8));
    }
    draw(dt) {
      const k = this.kid, p = this.kidPx(), ov = this.ov, leds = this.leds, fx = this.fx, fl = this.floorG;
      const glasses = (state.glassesOn || this.breaking) && !this.stutter;
      this.kidSpr.setTexture('kid_' + k.face).setPosition(Math.round(p.x), Math.round(p.y));
      this.dark.setVisible(!state.glassesOn && !this.breaking).setPosition(Math.round(p.x), Math.round(p.y));
      ov.clear(); leds.clear(); fx.clear(); fl.clear();
      const fade = (tx, ty) => clamp(1 - (Math.hypot(tx + 0.5 - p.x / TILE, ty + 0.5 - p.y / TILE) - 6) / 3, 0, 1);
      // opened trap doors (pits)
      this.traps.forEach(t => { if (t.open) { fl.fillStyle(COL.pit, 1); fl.fillRect(t.tx * TILE + 1, t.ty * TILE + 1, 14, 14); } });
      // cameras: the overlay draws the same tile set the kill test reads
      this.cams.forEach(c => {
        c.reveal = Math.max(0, c.reveal - dt);
        const a = glasses ? 1 : Math.min(1, c.reveal);
        if (a > 0) {
          this.coneTiles(c).forEach(i => {
            const tx = i % this.map.W, ty = Math.floor(i / this.map.W), f = a * (glasses ? fade(tx, ty) : 1);
            if (f <= 0) return;
            ov.fillStyle(COL.overlay, 0.17 * f); ov.fillRect(tx * TILE, ty * TILE, TILE, TILE);
            ov.lineStyle(1, COL.overlay, 0.35 * f); ov.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
          });
        }
        if (Math.floor(this.clock * 2) % 2 === 0) { leds.fillStyle(COL.led, 1); leds.fillRect(c.tx * TILE + 7, c.ty * TILE + 7, 2, 2); }
      });
      // motion sensors: radius ring, pulse ring, an LED that blinks on each pulse
      this.sensors.forEach(s => {
        s.reveal = Math.max(0, s.reveal - dt);
        const a = glasses ? fade(s.tx, s.ty) : Math.min(1, s.reveal), cx = s.tx * TILE + 8, cy = s.ty * TILE + 8;
        const pulse = this.sensorPulse(s), ph = (this.clock % s.period) / s.window;
        if (a > 0) {
          ov.lineStyle(1, COL.overlay, 0.45 * a); ov.strokeCircle(cx, cy, s.radius * TILE);
          if (pulse) { ov.lineStyle(2, COL.overlay, 0.7 * a); ov.strokeCircle(cx, cy, Math.min(1, ph) * s.radius * TILE); ov.fillStyle(COL.overlay, 0.08 * a); ov.fillCircle(cx, cy, s.radius * TILE); }
        }
        if (s.cool > 0) { leds.fillStyle(0x333a55, 1); } else { leds.fillStyle(COL.led, pulse ? 1 : 0.35); }
        leds.fillRect(cx - 1, cy - 1, 2, 2);
        if (pulse && s.cool <= 0 && ph < 0.2 && !this.pulseTicked) { this.pulseTicked = true; Sound.tone(state.glassesOn ? 1600 : 1900, 0.02, 'square', state.glassesOn ? 0.008 : 0.02); }
        if (!pulse) this.pulseTicked = false;
      });
      // laser tripwires: red when on, a faint dashed path when off (glasses only)
      this.lasers.forEach(l => {
        l.reveal = Math.max(0, l.reveal - dt);
        const on = this.laserOn(l), x = l.x * TILE + 8, y0 = (l.y0 - 1) * TILE + 13, y1 = (l.y1 + 1) * TILE + 3;
        const a = glasses ? fade(l.x, (l.y0 + l.y1) / 2) : Math.min(1, l.reveal);
        if (a > 0) {
          if (on) { ov.lineStyle(4, COL.beam, 0.25 * a); ov.lineBetween(x, y0, x, y1); ov.lineStyle(1, COL.beamCore, 0.9 * a); ov.lineBetween(x, y0, x, y1); }
          else { ov.lineStyle(1, COL.beam, 0.35 * a); for (let yy = y0; yy < y1; yy += 6) ov.lineBetween(x, yy, x, Math.min(y1, yy + 3)); }
        }
        if (!glasses && on) {
          // without glasses: a faint shimmer of dust where the beam passes close to the kid
          for (let ty = l.y0; ty <= l.y1; ty++) {
            if (Math.hypot(l.x - p.x / TILE + 0.5, ty - p.y / TILE + 0.5) <= 2 && Math.random() < 0.5) { leds.fillStyle(COL.beamCore, 0.5); leds.fillRect(x, ty * TILE + Math.floor(Math.random() * 16), 1, 1); }
          }
        }
        leds.fillStyle(COL.led, on ? 1 : 0.25); leds.fillRect(x - 1, y0 - 2, 2, 2); leds.fillRect(x - 1, y1, 2, 2);
      });
      // trap doors: a faint outline through the glasses
      this.traps.forEach(t => {
        t.reveal = Math.max(0, t.reveal - dt);
        if (!t.open && glasses) { const a = fade(t.tx, t.ty); ov.lineStyle(1, COL.overlay, 0.5 * a); ov.strokeRect(t.tx * TILE + 2.5, t.ty * TILE + 2.5, 11, 11); }
      });
      // safe markers survive the dark
      leds.fillStyle(COL.safe, 0.9); leds.fillRect(this.exit.tx * TILE + 7, this.exit.ty * TILE + 7, 2, 2);
      this.checkpoints.forEach(cp => { leds.fillStyle(COL.safe, 0.55); leds.fillRect(cp.tx * TILE + 7, cp.ty * TILE + 2, 2, 2); });
      // noise rings from pebbles
      this.noise = this.noise.filter(n => (n.t += dt) < 0.5);
      this.noise.forEach(n => { leds.lineStyle(1, 0xffffff, 0.6 * (1 - n.t / 0.5)); leds.strokeCircle(n.x, n.y, 4 + n.t * 40); });
      // culprit line, strike, spark
      if (this.culprit) { const c = this.culprit; leds.lineStyle(1, COL.led, Math.floor(this.time.now / 80) % 2 ? 1 : 0.4); leds.lineBetween(c.x, c.y, c.tx, c.ty); leds.strokeRect(c.tx - 6, c.ty - 6, 12, 12); }
      if (this.strikeFx && this.clock < this.strikeFx.until) drawStrike(fx, this.cameras.main, this.strikeFx.x, this.strikeFx.y);
      if (this.sparkAt && this.clock < this.sparkAt.until) { fx.fillStyle(0xffffff, 1); fx.fillRect(this.sparkAt.x - 1, this.sparkAt.y - 1, 3, 3); }
    }
  }

  // ---------------- boot ----------------
  function pickZoom() {
    const host = byId('stage');
    const w = host ? host.clientWidth : window.innerWidth;
    const hAvail = Math.max(180, window.innerHeight - 190);
    return clamp(Math.floor(Math.min(w / VW, hAvail / VH)), 1, 6);
  }
  function start() {
    const game = new Phaser.Game({
      type: Phaser.AUTO, parent: 'stage', width: VW, height: VH, zoom: pickZoom(),
      pixelArt: true, roundPixels: true, backgroundColor: '#05060a',
      scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
      scene: [SideScene, TopScene]
    });
    window.__earthGame = game;
    window.__earthState = state;
    window.__earthAudio = () => Sound.ensure();
    let rt = null;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { try { game.scale.setZoom(pickZoom()); } catch (e) { /* ignore */ } }, 150); });
    hud();
  }
  start();
})();
