// Episode 5: the Moon. She comes out of a door that matches the one in the bedroom, into the
// watchers' home: a small city under a dome, bright, clean, Earth hanging over it. Nothing here
// hunts her; the people up here look at their screens, and when she passes, they lift their
// phones to film her. Behind glass, adults watch walls of Earth channels. A screen on the
// boulevard shows her live. At the far end, a staff door: backstage (Hallway.js), where the
// creator of the show waits. Past the fight, this scene again, in the playroom: two kids, a giant
// screen, "Are you here for round two?", her reply, and one of five endings (data/endings.js).
// Every ending ends on the old TV in a dark room on Earth, then a small card: its title and how
// many of the five this browser has seen.
import { Music } from '../core/music.js';
import { hexNum } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText, textWidth } from '../art/pixfont.js';
import { LOOKS } from '../art/palettes.js';
import { TILE, GROUND, KX, CW, M, LEVEL, buildMap, paintLevel, paintSky, paintFar, paintMid, paintNpc, NPC_FRAMES, paintKid, KID_POSES, paintSister, paintRobot, paintLastRoom, drawTv, TVSCREEN } from '../art/moon.js';
import { goNext } from '../core/flow.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { display } from '../core/display.js';
import { SideEpisode, K } from '../core/side.js';
import { MOON_OVERHEARD, MOON_ROBOT, PLAYROOM, PLAYROOM_REPLY, PLAYROOM_EMPTY, PLAYROOM_ASK, MOON_LOOKS, MOON_PEOPLE, MOON_HEAD, NOTICE, lineSeconds } from '../data/dialogue.js';
import { replies, emptyRoom, endingTitle, endingsSeen, ENDINGS } from '../data/endings.js';
import { ccText, ccWidth } from '../art/ccfont.js';
import { reviewKeys } from '../core/review.js';
import { fx } from '../core/fx.js';
import { cg } from '../ui/cg.js';

const n = c => hexNum(c);
const ROOM_TEXT = [
  ['Eight channels from Earth: a house, a street, a field.', 'One of them is the hall you came through.'],
  ['Channel seven: the bedroom. The door is open. He is still there.', 'Another channel: a ridge, two small figures, watching lights.'],
  ['Channel seven again: the grounds. A girl is walking up to the house.', 'Two of them are asleep.']
];

export class Moon extends SideEpisode {
  constructor() { super('moon'); }

  create(data) {
    this.initSide('ep5', LEVEL, buildMap());
    const P = this.P, look = LOOKS[state.look];
    makeSprites(this, P);
    const lvl = paintLevel(P, look.name); lvl.toTexture(this, 'mn_level'); this.marks = lvl.marks;
    [true, false].forEach(bun => KID_POSES.forEach(pose => paintKid(bun, pose).toTexture(this, 'mk_' + (bun ? 'a' : 'b') + '_' + pose)));
    paintSister(P).toTexture(this, 'mk_sis_back');
    paintRobot(M.robotLed, 0).toTexture(this, 'mr_a'); paintRobot(M.robotLed, 1).toTexture(this, 'mr_b'); paintRobot(M.pink, 0).toTexture(this, 'mr_c');
    paintLastRoom().toTexture(this, 'mn_last');
    this.tvCanvas = document.createElement('canvas'); this.tvCanvas.width = TVSCREEN.w; this.tvCanvas.height = TVSCREEN.h; this.tvCtx = this.tvCanvas.getContext('2d');
    // the edge of the bite: a ragged circle, the same every time
    this.bite = Array.from({ length: 28 }, (_, i) => 0.82 + 0.18 * Math.abs(Math.sin(i * 2.7) * Math.cos(i * 1.3)));
    this.pieces = Array.from({ length: 26 }, (_, i) => ({ a: -2.4 + (i / 26) * 3.6 + Math.sin(i * 7) * 0.3, v: 2 + (i % 5) * 1.6, s: i % 4 === 0 ? 2 : 1, hot: i % 3 === 0, spin: i }));
    if (this.textures.exists('mn_tvlive')) this.textures.remove('mn_tvlive');
    this.tvTex = this.textures.addCanvas('mn_tvlive', this.tvCanvas);
    this.pixelCamera(LEVEL.w * TILE, M.space);
    // the sky over the dome, the far towers, the middle distance, each slower than the street
    const FW = Math.ceil(320 + (CW * TILE - 320) * 0.2) + 8, MW = Math.ceil(320 + (CW * TILE - 320) * 0.5) + 8;
    paintSky().toTexture(this, 'mn_sky'); const far = paintFar(FW); far.toTexture(this, 'mn_far'); this.farMarks = far.marks; paintMid(MW).toTexture(this, 'mn_mid');
    this.addParallax(this.add.image(0, 0, 'mn_sky').setOrigin(0).setDepth(-3), 0);
    this.addParallax(this.add.image(0, 0, 'mn_far').setOrigin(0).setDepth(-2), 0.2);
    this.farG = this.addParallax(this.add.graphics().setDepth(-1.9), 0.2);
    this.addParallax(this.add.image(0, 0, 'mn_mid').setOrigin(0).setDepth(-1), 0.5);
    this.tramG = this.addParallax(this.add.graphics().setDepth(-0.9), 0.5);
    this.add.image(0, 0, 'mn_level').setOrigin(0).setDepth(0);
    ['a', 'b', 'w', 'c'].forEach(k => NPC_FRAMES.forEach(f => paintNpc(k, f).toTexture(this, 'npc_' + k + '_' + f)));
    this.npcs = LEVEL.npcs.map((d, i) => ({ d, x: d.speed ? d.x0 + (d.x1 - d.x0) * (0.3 + 0.4 * (i % 2)) : d.x0, dir: i % 2 ? -1 : 1, face: i % 2 ? -1 : 1, film: 0, img: this.add.image(0, GROUND, 'npc_' + d.kind + '_idle0').setOrigin(0.5, 26 / 27).setDepth(3.4) }));
    this.liveG = this.add.graphics().setDepth(1);
    this.robotImg = this.add.image(0, GROUND, 'mr_a').setOrigin(0.5, 1).setDepth(3);
    this.kidImgs = LEVEL.kids.map((k, i) => this.add.image(k.x, LEVEL.couch.y + 4, 'mk_' + (i ? 'b' : 'a') + '_back').setOrigin(0.5, 1).setDepth(2.5));
    this.sisImg = this.add.image(0, LEVEL.couch.y + 4, 'mk_sis_back').setOrigin(0.5, 1).setDepth(2.5).setVisible(false);
    this.commonLayers();
    this.eyeG = this.add.graphics().setDepth(4.5);
    // the end, drawn over everything in screen space
    this.flashRect = this.addParallax(this.add.rectangle(160, 90, 330, 190, 0xebe6d8).setDepth(40).setAlpha(0), 0, 160, 90);
    this.lastImg = this.addParallax(this.add.image(0, 0, 'mn_last').setOrigin(0).setDepth(30).setVisible(false), 0);
    this.tvImg = this.addParallax(this.add.image(TVSCREEN.x, TVSCREEN.y, 'mn_tvlive').setOrigin(0).setDepth(31).setVisible(false), 0, TVSCREEN.x, TVSCREEN.y);
    this.hudG = this.addParallax(this.add.graphics().setDepth(20), 0);
    this.cardG = this.addParallax(this.add.graphics().setDepth(45), 0);

    this.mode = 'walk'; this.view = { x: 0 }; this.heard = new Set(); this.vest = 0;
    this.robot = { x: LEVEL.robot.x0 + 30, dir: 1, line: 0 };
    this.robotProp = { id: 'robot', x: 0, y: GROUND - 6, w: 10, h: 6 }; this.props.push(this.robotProp);
    this.robotThing = { x0: 0, x1: 0, y0: GROUND - 8, y1: GROUND, label: 'J', use: () => this.robotTalk() };
    this.things.push(this.robotThing);
    LEVEL.rooms.forEach((R, i) => { const it = { n: 0 }; this.things.push({ x0: R.x0 + 10, x1: R.x1 - 10, y0: 120, y1: GROUND, label: 'J', use: () => this.describe(ROOM_TEXT[i], it, (R.x0 + R.x1) / 2, 118) }); });
    const V = LEVEL.vote, A = LEVEL.arrive;
    const lookLine = { n: 0 }, doorLine = { n: 0 }, holeLine = { n: 0 };
    this.things.push({ x0: A.x - 4, x1: A.x + A.w + 4, y0: A.y, y1: GROUND, label: 'J', use: () => this.describe(['The door she came out of.', 'On this side it has a number: 07.'], doorLine, A.x + A.w / 2, A.y - 12) });
    const VW = LEVEL.viewer, LV = LEVEL.live, liveLine = { n: 0 };
    this.things.push({ x0: VW.x - 8, x1: VW.x + 10, y0: 120, y1: GROUND, label: 'J', use: () => this.describe(['Earth, on its dark side.', 'Small fires everywhere.'], holeLine, VW.x, GROUND - 40) });
    this.things.push({ x0: LV.x, x1: LV.x + LV.w, y0: 120, y1: GROUND, label: 'J', use: () => this.describe(['Channel seven, live.', 'A girl on a street on the Moon.'], liveLine, LV.x + LV.w / 2, LV.y + LV.h + 4) });
    const LF = LEVEL.lost; this.addLook({ x0: LF.x - 4, x1: LF.x + LF.w + 4, y0: GROUND - 40, py: LF.y - 14, lines: MOON_LOOKS.lost, clue: 'lostGlasses' });

    // the street furniture is solid: benches, planters, the fountain's rim, basin and tiers
    // (the stem is behind her), the crates at the service end. She can stand on all of it.
    const G = GROUND, F = LEVEL.fountain.x, N = NOTICE.moon;
    LEVEL.benches.forEach(x => { this.props.push({ id: 'bench', x, y: G - 13, w: 30, h: 6 }); this.addLook({ x0: x - 2, x1: x + 32, y0: G - 30, py: G - 14, lines: N.bench }); });
    LEVEL.planters.forEach((x, i) => { this.props.push({ id: 'planter', x, y: G - 12, w: 12, h: 12 }); this.addLook({ x0: x - 4, x1: x + 16, y0: G - 30, py: G - 26, lines: N.planter }); });
    LEVEL.crates.forEach(x => this.props.push({ id: 'crate', x, y: G - 12, w: 12, h: 12 }));
    this.props.push({ id: 'rim', x: F - 34, y: G - 12, w: 4, h: 12 }, { id: 'rim', x: F + 30, y: G - 12, w: 4, h: 12 }, { id: 'basin', x: F - 30, y: G - 4, w: 60, h: 4 },
      { id: 'tier', x: F - 16, y: G - 30, w: 32, h: 4 }, { id: 'bowl', x: F - 9, y: G - 44, w: 18, h: 3 });
    this.addLook({ x0: F - 30, x1: F + 30, y0: G - 60, py: G - 52, lines: N.fountain });
    // people out tonight: solid, they stop for her, they talk when she presses E
    this.npcs.forEach((Nn, i) => {
      Nn.i = i; Nn.prop = { id: 'person', x: Nn.x - 5, y: G - 24, w: 10, h: 24 }; this.props.push(Nn.prop);
      Nn.src = { lines: () => MOON_PEOPLE[i].lines.slice(), i: 0, loop: true };
      Nn.thing = { x0: 0, x1: 0, y0: G - 26, y1: G, py: G - 28, label: 'J', use: () => this.npcTalk(Nn) };
      this.things.push(Nn.thing);
    });
    this.slide = null;
    // speech keeps clear of her, of the people and of the robot
    this.bubbles.bodies = () => { const k = this.kid, out = [{ x0: k.x - 1, x1: k.x + k.w + 1, y0: k.y, y1: k.y + k.h }];
      if (this.mode === 'walk') { this.npcs.forEach(Nn => out.push({ x0: Nn.x - 7, x1: Nn.x + 7, y0: GROUND - 27, y1: GROUND })); out.push({ x0: this.robot.x - 7, x1: this.robot.x + 7, y0: GROUND - 14, y1: GROUND }); }
      return out; };
    this.spawn(); this.kid.face = 1;
    this.beds = { hum: Sound.hum(0.008) };
    this.events.once('shutdown', () => { Object.values(this.beds).forEach(b => b.stop(0.4)); overlay.clearCaption(); });
    window.__game = { scene: this, state };
    // after backstage: straight into the playroom, in through the pink door
    if (data && data.at === 'playroom') { this.force = data.force || null; this.startRoom(); this.cameras.main.fadeIn(700, 255, 255, 255); return; }
    this.updateView(1);
    const fromCut = !!(data && data.fromCut);
    // she steps out of the door into the light
    this.cameras.main.fadeIn(fromCut ? 2200 : 600, 255, 255, 255);
    Music.play('moon', { fadeIn: 3 });
    this.takeNote({ fromCut }, 5, 'The Moon');
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    c.restart(); // no takes up here: nothing hunts her
    reviewKeys(this);
    if (this.mode !== 'walk') c.look(); else if (c.look()) { const L = state.nextLook(); overlay.note('Look ' + L + ' · ' + LOOKS[L].name, 1800); this.scene.restart({}); return; }
    if (c.mute()) overlay.note(Sound.toggle() ? 'Sound off' : 'Sound on', 1000);
    if (this.mode === 'walk' || this.mode === 'room' || this.mode === 'look') {
      if (!this.leaving) {
        if (this.slide) { this.slide.t -= dt; this.kid.vx = this.slide.dir * 85; if (this.slide.t <= 0) this.slide = null; }
        this.moveKid(dt); this.updateThings();
        if (this.mode === 'walk') this.pushBack();
      }
    }
    if (this.mode === 'walk') { this.overhear(); this.updateRobot(dt); }
    // at the kids, control is hers no more; she lands if she was jumping, then they talk
    if (this.mode === 'room' && this.kid.x + this.kid.w / 2 >= LEVEL.stand) this.mode = 'arrive';
    if (this.mode === 'arrive') { this.settle(dt); if (this.kid.onGround) this.startTalk(); }
    if (['talk', 'choose', 'vest', 'lit', 'r2', 'cut'].includes(this.mode)) this.settle(dt);
    if (this.mode === 'walkto') this.updateWalkTo(dt);
    if (this.talking) { this.talkT -= dt; if (c.advance() || this.talkT <= 0) this.nextLine(); }
    if (this.mode === 'choose') this.updateChoose(c);
    if (this.mode === 'vest') this.updateVest(dt);
    if (this.mode === 'r2') this.updateR2(dt);
    if (this.mode === 'cut') this.updateCut(dt);
    if (this.mode === 'last') this.updateLast(dt);
    this.updateView(dt);
    this.draw(dt);
    this.hint();
    c.endFrame();
  }

  lookable() { return this.mode === 'walk' || this.mode === 'room' || this.mode === 'look'; }
  doorReady() { return this.mode === 'walk' && !this.leaving; }
  // E on someone in the street: their next line, over their head
  npcTalk(Nn) {
    // the one who says "My son aims on Tuesdays" (their second line) gives a clue
    Nn.presses = (Nn.presses || 0) + 1;
    if (Nn.i === 3 && Nn.presses === 2 && state.clue('tuesday')) overlay.note('NOTED (' + state.clueCount() + ')', 1600);
    this.bubbles.press('npc' + Nn.i, Nn.src, () => ({ x: Nn.x, y: GROUND - 28 }), { ink: 0xebe6d8, pitch: 560 + Nn.i * 90, leave: 64 });
  }
  npcSay(Nn, text) { this.bubbles.say('npc' + Nn.i, text, () => ({ x: Nn.x, y: GROUND - 28 }), { ink: 0xebe6d8, pitch: 700 + Nn.i * 90, leave: 64, hold: 900 }); }
  // People push back: walking into someone gets a word from them; landing on a head gets her
  // put down, with a little hop to the side she came from.
  pushBack() {
    const k = this.kid, c = this.ctl, dir = (c.right() ? 1 : 0) - (c.left() ? 1 : 0);
    const against = Nn => { const r = Nn.prop; return k.y + k.h > r.y + 1 && k.y < r.y + r.h && (dir > 0 ? Math.abs(k.x + k.w - r.x) < 1.01 : Math.abs(r.x + r.w - k.x) < 1.01); };
    if (dir) { const Nn = this.npcs.find(against); if (Nn && this.clock - (Nn.bumpT || -9) > 4 && !this.bubbles.busy('npc' + Nn.i)) { Nn.bumpT = this.clock; this.npcSay(Nn, MOON_PEOPLE[Nn.i].bump); Sound.tone(260, 0.06, 'triangle', 0.015); } }
    if (k.onGround && !this.slide) {
      const Nn = this.npcs.find(q => { const r = q.prop; return k.x < r.x + r.w && k.x + k.w > r.x && Math.abs(k.y + k.h - r.y) < 1.5; });
      if (Nn) {
        this.slide = { t: 0.3, dir: k.x + k.w / 2 < Nn.x ? -1 : 1 }; k.vy = -150; k.onGround = false;
        this.npcSay(Nn, MOON_HEAD[(this.headN = (this.headN || 0) + 1) % MOON_HEAD.length]); Sound.tone(330, 0.08, 'square', 0.015, 220);
      }
    }
  }
  // review: N walks her down the corridor, into the playroom, through the talk
  canRestart() { return false; } // no takes up here: nothing hunts her
  skipAhead() {
    if (this.mode === 'walk' && !this.leaving) { const x = [10, 29, 50, 66, 82, 99].map(v => v * TILE).find(p => p > this.kid.x + 12); if (x != null) { const k = this.kid; k.y = GROUND - k.h; k.vy = 0; k.x = this.clearX(x); return; } return this.enterDoor(); }
    if (this.mode === 'room') { this.kid.x = LEVEL.stand; return; }
    if (this.talking && this.talkI < this.lines.length - 1) { this.talkI = this.lines.length - 2; this.nextLine(); return; }
    if (this.mode === 'look') return this.turnCamera();
    if (this.mode === 'last') this.lastT = Math.max(this.lastT, this.cardAt());
  }
  updateView(dt) {
    const S = display.S, cam = this.cameras.main;
    if (this.mode === 'walk') { const k = this.kid, want = Math.max(0, Math.min(CW * TILE - 320, k.x + k.w / 2 + 18 - 160)); this.view.x += (want - this.view.x) * Math.min(1, dt * 9); }
    else this.view.x = KX;
    cam.scrollX = Math.round(this.view.x) - 160 * (S - 1); cam.scrollY = -90 * (S - 1);
  }
  onRescale() { super.onRescale(); this.updateView(0); }

  // ------------------------------------------------------------------ the corridor
  overhear() {
    const cx = this.kid.x + this.kid.w / 2;
    LEVEL.rooms.forEach((R, i) => {
      if (this.heard.has(i) || cx < (R.x0 + R.x1) / 2 - 30) return;
      this.heard.add(i);
      const lines = MOON_OVERHEARD[i], seat = (j) => ({ x: R.x0 + 34 + j * 40, y: 88 });
      lines.forEach((text, j) => this.time.delayedCall(j * 2300, () => this.bubbles.say('room' + i, text, () => seat(j), { ink: 0xebe6d8, italic: true, pitch: 300 + j * 80, leave: 170, hold: 1300 })));
    });
  }
  describe(lines, it, x, y) { if (!it.lines) it.lines = lines; this.bubbles.look('item', it, () => ({ x, y })); }
  updateRobot(dt) {
    const R = this.robot, B = LEVEL.robot, k = this.kid, talking = this.bubbles.busy('robot'), near = Math.abs(R.x - (k.x + k.w / 2)) < 22;
    if (!near && !talking) { R.x += R.dir * B.speed * dt; if (R.x > B.x1) { R.x = B.x1; R.dir = -1; } if (R.x < B.x0) { R.x = B.x0; R.dir = 1; } }
    this.robotProp.x = Math.round(R.x) - 5; this.robotThing.x0 = R.x - 8; this.robotThing.x1 = R.x + 8;
    this.robotImg.setTexture(near || talking ? 'mr_c' : Math.floor(this.clock * 4) % 2 ? 'mr_a' : 'mr_b').setPosition(Math.round(R.x), GROUND).setFlipX(R.dir < 0);
  }
  robotTalk() { const R = this.robot; if (!this.robotSrc) this.robotSrc = { lines: MOON_ROBOT, i: 0, loop: true }; this.bubbles.press('robot', this.robotSrc, () => ({ x: R.x, y: GROUND - 8 }), { ink: 0xebe6d8, pitch: 1180, leave: 64 }); }

  // ------------------------------------------------------------------ the staff door, the playroom
  enterDoor() {
    if (this.leaving || this.mode !== 'walk') return;
    this.leaving = true; Sound.tone(300, 0.1, 'triangle', 0.03); Sound.noise(0.2, 0.04, 900);
    this.cameras.main.fadeOut(450, 0, 0, 0);
    // backstage, if it is built; otherwise straight to the playroom
    this.time.delayedCall(470, () => { if (goNext(this, 'ep5')) return; this.leaving = false; this.startRoom(); this.cameras.main.fadeIn(700, 255, 255, 255); });
  }
  startRoom() {
    this.mode = 'room'; this.leaving = false; this.things = [];
    this.props = this.props.filter(r => r.id !== 'person');
    // a chapter link can ask for an ending: set the flags it needs
    if (this.force === 'endall') { state.storySet('killedBroken', true); state.storySet('spared', false); }
    else if (this.force) { state.storySet('killedBroken', false); state.storySet('spared', true); state.storySet('gaveUp', true); }
    this.empty = emptyRoom();
    const X = KX, N = NOTICE.moon, CM = LEVEL.camera;
    this.addLook({ x0: X + 56, x1: X + 76, y0: GROUND - 30, py: GROUND - 14, lines: N.blocks });
    this.addLook({ x0: X + 38, x1: X + 60, y0: GROUND - 40, py: 86, lines: N.porthole });
    this.cam = { x: CM.x, y: CM.y, turned: false };
    const th = this.camThing = this.addLook({ x0: CM.x - 6, x1: CM.x + 8, y0: CM.y - 4, py: CM.y - 6, lines: MOON_LOOKS.camera }), see = th.use;
    th.use = () => (this.mode === 'look' ? this.turnCamera() : see());
    this.kidImgs.forEach(img => img.setVisible(!this.empty));
    const k = this.kid; k.x = KX + 40; k.y = GROUND - K.hStand; k.vx = 0; k.face = 1;
    Music.stop(0.6); this.beds.show = Sound.show(this.empty ? 0.015 : 0.04);
    this.roomT = 0; this.updateView(0);
    overlay.hint('');
  }

  // ------------------------------------------------------------------ talk: lines in order, then a step
  talk(lines, then) {
    this.lines = lines.map(l => Object.assign({}, l)); this.talkI = -1; this.after = then; this.talking = true;
    this.nextLine();
  }
  nextLine() {
    this.talkI++;
    if (this.talkI >= this.lines.length) { this.talking = false; overlay.clearCaption(); const f = this.after; this.after = null; if (f) f(); return; }
    const l = this.lines[this.talkI];
    this.talkT = lineSeconds(l.text) + (l.who ? 0.5 : 0.9);
    overlay.caption(l.who, l.text);
    if (/CLICK\. CLICK/.test(l.text)) { this.vest = 0.01; Sound.click(0.03); this.time.delayedCall(260, () => Sound.click(0.03)); this.talkT = 1.1; }
    if (/JINGLE/.test(l.text)) [523, 659, 784, 1047].forEach((f, i) => this.time.delayedCall(i * 140, () => Sound.tone(f, 0.16, 'square', 0.025, null, 0.3)));
    if (/CLICKS ON/.test(l.text)) { Sound.click(0.04); this.camLight = true; }
  }
  startTalk() {
    this.mode = 'talk'; this.kid.vx = 0; this.kid.face = 1; this.nearThing = null; this.bubbles.prompt = null;
    this.beds.show.stop(0.3); Sound.tone(392, 0.5, 'sine', 0.02, 196);
    // nobody here: she sits on their couch alone, and the show repeats itself
    if (this.empty) return this.talk(PLAYROOM_EMPTY, () => this.walkTo(KX + 187, () => this.sitDown(() => this.toLast('rerun', 'endall', 4))));
    this.talk(PLAYROOM, () => this.startChoose());
  }

  // ------------------------------------------------------------------ her reply: a slip to fill in
  startChoose() {
    this.mode = 'choose'; this.choices = replies(this.force); this.pick = Math.max(0, this.choices.findIndex(r => r.ending === this.force)); this.chooseT = 0;
    overlay.caption('KID', 'Are you here for round two?');
    if (!this.pointerOn) {
      this.pointerOn = true;
      const row = p => { const r = this.slipRows; if (!r) return -1; const x = p.x / display.S, y = p.y / display.S; return x >= r.x && x < r.x + r.w ? Math.floor((y - r.y) / r.h) : -1; };
      this.input.on('pointermove', p => { if (this.mode !== 'choose') return; const i = row(p); if (i >= 0 && i < this.choices.length) this.pick = i; });
      this.input.on('pointerdown', p => { if (this.mode !== 'choose' || this.chooseT < 0.3) return; const i = row(p); if (i >= 0 && i < this.choices.length) { this.pick = i; this.choose(); } });
    }
  }
  updateChoose(c) {
    this.chooseT += this.game.loop.delta / 1000;
    const n = this.choices.length;
    if (c.downP()) { this.pick = (this.pick + 1) % n; Sound.tone(660, 0.04, 'square', 0.012); }
    if (this.upTapped(c)) { this.pick = (this.pick + n - 1) % n; Sound.tone(660, 0.04, 'square', 0.012); }
    if (this.chooseT > 0.3 && c.advance()) this.choose();
  }
  upTapped(c) { const up = c.up(), tap = up && !this.upWas; this.upWas = up; return tap; }
  choose() {
    const r = this.choices[this.pick]; if (!r) return;
    this.mode = 'talk'; this.choiceMade = true; state.storySet('choice', r.id);
    Sound.tone(880, 0.06, 'square', 0.015); this.time.delayedCall(60, () => Sound.tone(1320, 0.08, 'square', 0.012));
    if (r.id === 'lights') this.talk(PLAYROOM_REPLY.lights, () => this.startVest());
    else if (r.id === 'yes') this.talk(PLAYROOM_REPLY.yes, () => this.walkTo(LEVEL.couch.x - 12, () => { this.mode = 'r2'; this.r2T = 0; }));
    else if (r.id === 'turn') this.talk(PLAYROOM_REPLY.turn, () => { this.mode = 'look'; this.lookT = 0; });
    else this.walkTo(KX + 187, () => this.sitDown(() => this.talk(PLAYROOM_REPLY.sit, () => { this.mode = 'sat'; this.time.delayedCall(4200, () => this.toLast('couch', 'couch', 7)); })));
  }

  // ------------------------------------------------------------------ the endings
  // she walks somewhere on her own, then a step
  walkTo(x, then) { this.mode = 'walkto'; this.walk = { x, then }; }
  updateWalkTo(dt) {
    const k = this.kid, w = this.walk, cx = k.x + k.w / 2, d = w.x - cx;
    if (Math.abs(d) < 1.5) { k.vx = 0; this.walk = null; this.mode = 'held'; w.then(); return; }
    k.vx = Math.sign(d) * 40; k.face = Math.sign(d); k.x += k.vx * dt; k.walkT += dt;
  }
  // she sits: from behind, her head and shoulders over the back of the couch
  sitDown(then) {
    const k = this.kid; this.girl.setVisible(false); this.sitting = true;
    this.sisImg.setPosition(Math.round(k.x + k.w / 2), LEVEL.couch.y + 4).setVisible(true);
    Sound.noise(0.25, 0.03, 600);
    this.time.delayedCall(900, then);
  }
  // LOOK BACK: their camera, on its stand, aimed out of the porthole. J turns it on the room.
  turnCamera() {
    if (this.mode !== 'look' || this.cam.turned) return;
    this.cam.turned = true; this.mode = 'lit'; this.camThing.off = true;
    Sound.noise(0.3, 0.04, 1200); Sound.tone(220, 0.2, 'triangle', 0.03, 330);
    this.talk(PLAYROOM_REPLY.turned, () => this.time.delayedCall(1200, () => this.toLast('playroom', 'lookback', 7)));
  }
  // ROUND TWO: she takes the controller from the little one; the screen asks for a target
  updateR2(dt) {
    this.r2T += dt;
    if (this.r2T > 0.8 && !this.r2Took) { this.r2Took = true; Sound.tone(520, 0.08, 'triangle', 0.02); }
    if (this.r2T > 3.4 && !this.r2Aim) { this.r2Aim = true; Sound.charge(); }
    if (this.r2T > 4.6) this.toLast('ridge', 'round2', 7);
  }
  startVest() {
    this.mode = 'vest'; this.vestT = 0; overlay.clearCaption();
    // the flash: white, a sound too low to hear properly, then nothing
    this.flashRect.setFillStyle(0xebe6d8).setAlpha(fx.reduced ? 0.55 : 1); fx.shake(this.cameras.main, 300, 0.01);
    Sound.tone(42, 2.6, 'sine', 0.12, 30); Sound.noise(2.2, 0.16, 300);
    Object.values(this.beds).forEach(b => b.stop(0.05)); Music.stop(0.05);
  }
  updateVest(dt) {
    this.vestT += dt;
    if (this.vestT > 1.6) this.flashRect.setFillStyle(0x000000).setAlpha(1);
    if (this.vestT > 3.2) this.showLast('moon', 'vest', 10);
  }
  // a hard cut to black, then the old TV
  toLast(kind, id, cardAt) {
    if (this.mode === 'cut' || this.mode === 'last') return;
    this.mode = 'cut'; this.cutT = 0; this.cutTo = [kind, id, cardAt];
    this.flashRect.setFillStyle(0x000000).setAlpha(1); overlay.clearCaption();
    Object.values(this.beds).forEach(b => b.stop(0.05)); Music.stop(0.05); Sound.noise(0.12, 0.05, 6000);
  }
  updateCut(dt) { this.cutT += dt; if (this.cutT > 0.7) this.showLast(...this.cutTo); }
  showLast(kind, id, cardAt) {
    this.mode = 'last'; this.lastT = 0; this.lastKind = kind; this.endingId = id; this.cardTime = cardAt;
    this.lastImg.setVisible(true); this.tvImg.setVisible(true); this.flashRect.setFillStyle(0x000000).setAlpha(1); cg.hp(null);
    this.hiss = Sound.wind(0.02); state.finish(this.epId); state.sawEnding(id);
    window.__ending = id;
  }
  cardAt() { return this.cardTime || 8; }
  updateLast(dt) {
    this.lastT += dt;
    this.flashRect.setAlpha(this.lastT < 0.9 ? 1 : this.lastT < 1.8 ? 0.5 : 0); // black, then the TV, in two steps
    if (this.lastKind === 'moon' && this.lastT > 2.4 && !this.boomed) { this.boomed = true; Sound.noise(0.9, 0.05, 2500); }
    if (this.lastKind === 'couch' && this.lastT > 5 && !this.bugOff) { this.bugOff = true; Sound.click(0.02); }
    if (this.lastT > 30 && this.hiss && !this.quiet) { this.quiet = true; this.hiss.set(0.0001, 8); }
    if (this.lastT >= this.cardAt() && !this.endCard) this.endCard = { title: endingTitle(this.endingId), seen: endingsSeen(), of: ENDINGS.length };
  }

  // ------------------------------------------------------------------ drawing
  draw(dt) {
    const t = this.clock;
    this.drawGirl();
    if (this.sitting) this.girl.setVisible(false);
    const g = this.liveG; g.clear();
    // the channels: now and then one rolls a line down its picture
    this.marks.forEach((mk, i) => { if (mk.kind !== 'tile') return; if (Math.floor(t * 2 + i) % 9 === 0) { g.fillStyle(n('#45474d'), 1); g.fillRect(mk.x, mk.y + Math.floor((t * 30 + i * 5) % mk.h), mk.w, 1); } });
    // the screens' light on the backs of their heads; now and then someone lifts a glass
    LEVEL.rooms.forEach((R, ri) => {
      const sx = R.x0 + 22, sw = R.x1 - R.x0 - 44;
      for (let si = 0; si < R.seats; si++) {
        const hx = Math.round(sx + 10 + si * (sw - 20) / Math.max(1, R.seats - 1)), c = [M.screenGlow, M.trim, '#ebe6d8', M.trimLo][(Math.floor(t * 0.7) + si + ri) % 4];
        g.fillStyle(n(c), 1); g.fillRect(hx - 2, 96, 5, 1);
        const lift = Math.sin(t * 0.9 + si * 2.1 + ri) > 0.93;
        if (si === (ri + 1) % R.seats && lift) { g.fillStyle(n(M.adult), 1); g.fillRect(hx + 6, 99, 2, 6); g.fillStyle(0xebe6d8, 1); g.fillRect(hx + 6, 96, 2, 3); g.fillStyle(n(M.trim), 1); g.fillRect(hx + 6, 98, 2, 1); }
      }
    });
    if (this.mode === 'walk') this.drawCity(g, t, dt);
    this.drawPlayroomScreen(g, t);
    this.drawCamera(g, t);
    // the door she came out of stands open on the void for a moment, then swings shut
    const A = LEVEL.arrive, shut = Math.min(1, Math.max(0, (t - 1.6) / 0.5));
    if (shut < 1) {
      const hw = Math.round(A.w / 2 * shut);
      g.fillStyle(0x000000, 1); g.fillRect(A.x, A.y, A.w, A.h);
      for (let i = 0; i < 6; i++) { g.fillStyle(n(this.P.voidEdge), 1); g.fillRect(A.x + 2 + ((i * 7 + Math.floor(t * 20)) % (A.w - 4)), A.y + 4 + ((i * 11) % (A.h - 8)), 1, 1); }
      if (hw > 0) { g.fillStyle(n('#54432a'), 1); g.fillRect(A.x, A.y, hw, A.h); g.fillStyle(n(M.wallHi), 1); g.fillRect(A.x + A.w - hw, A.y, hw, A.h); }
      if (t > 1.6 && !this.shutSound) { this.shutSound = true; this.time.delayedCall(450, () => Sound.tone(110, 0.25, 'triangle', 0.04, 70)); }
    }
    this.drawKids(t, dt);
    // a red light on her chest, at the end: a 2 x 2 LED, on and off
    const e = this.eyeG; e.clear();
    if (this.vest > 0 && this.mode !== 'last' && this.mode !== 'cut') { const k = this.kid, cx = Math.round(k.x + k.w / 2), top = Math.round(k.y); if (Math.floor(t * 4) % 2 === 0) { e.fillStyle(0xe3412b, 1); e.fillRect(cx - 1, top + 7, 2, 2); e.fillStyle(0xffd9d0, 1); e.fillRect(cx - 1, top + 7, 1, 1); } else { e.fillStyle(0x45474d, 1); e.fillRect(cx - 1, top + 7, 2, 2); } }
    // ROUND TWO: the little one's controller, in her hands now
    if (this.mode === 'r2' && this.r2Took) { const k = this.kid, cx = Math.round(k.x + k.w / 2) + k.face * 3; e.fillStyle(0x0e0f12, 1); e.fillRect(cx - 3, Math.round(k.y) + 7, 6, 4); e.fillStyle(0xd6a03c, 1); e.fillRect(cx - 2, Math.round(k.y) + 8, 4, 2); if (Math.floor(t * 6) % 2) { e.fillStyle(0xe3412b, 1); e.fillRect(cx, Math.round(k.y) + 8, 1, 1); } }
    if (!this.lookable()) this.nearThing = null;
    this.drawThings();
    this.drawLocks([], 1);
    this.drawHud();
    if (this.mode === 'last') this.drawLast(this.lastT); else this.cardG.clear();
  }

  // the kids on their couch: a breath now and then, a cheer after a win, turning round to her
  drawKids(t, dt) {
    if (this.mode === 'room') this.roomT += dt;
    const talkingTo = ['talk', 'choose', 'held', 'walkto', 'r2', 'look', 'vest'].includes(this.mode) && !(this.mode === 'talk' && this.talkI < 1 && !this.choiceMade);
    this.kidImgs.forEach((img, i) => {
      let pose;
      if (this.mode === 'walk') pose = Math.floor(t * 0.8 + i * 0.5) % 4 === 0 ? 'back1' : 'back';
      else if (this.mode === 'room') pose = this.roomT < 2.2 ? (Math.floor(t * 6 + i) % 2 ? 'cheer' : 'cheer1') : 'back';
      else if (this.mode === 'lit') pose = 'squint';
      else if (this.mode === 'sat' || (this.sitting && this.endingId == null)) pose = Math.floor(t * 0.6 + i) % 5 === 0 ? 'back1' : 'back';
      else if (talkingTo) pose = 'turned';
      else pose = 'back';
      img.setTexture('mk_' + (i ? 'b' : 'a') + '_' + pose);
    });
  }
  // the kids' camera on its stand by the porthole: aimed out at Earth, or turned on the room
  drawCamera(g, t) {
    if (this.mode === 'walk' || !this.cam) return;
    const c = this.cam, x = c.x, y = c.y, ink = 0x0e0f12;
    g.fillStyle(n('#45474d'), 1); g.fillRect(x, y + 4, 1, GROUND - y - 4); g.fillRect(x - 5, GROUND - 1, 11, 1); g.fillRect(x - 4, GROUND - 3, 2, 2); g.fillRect(x + 3, GROUND - 3, 2, 2);
    if (!c.turned) {
      // a box with a lens pointed up and left, at the window
      g.fillStyle(ink, 1); g.fillRect(x - 5, y - 1, 11, 7); g.fillStyle(n('#2e3036'), 1); g.fillRect(x - 4, y, 9, 5); g.fillStyle(ink, 1); g.fillRect(x - 8, y - 3, 4, 4); g.fillStyle(n('#6b6c70'), 1); g.fillRect(x - 7, y - 2, 2, 2);
      if (Math.floor(t * 1.5) % 2 === 0) { g.fillStyle(0xe3412b, 1); g.fillRect(x + 3, y + 1, 1, 1); }
    } else {
      g.fillStyle(ink, 1); g.fillRect(x - 5, y - 1, 11, 7); g.fillStyle(n('#2e3036'), 1); g.fillRect(x - 4, y, 9, 5); g.fillStyle(ink, 1); g.fillRect(x + 5, y, 4, 5); g.fillStyle(n('#ebe6d8'), 1); g.fillRect(x + 6, y + 1, 2, 3);
      g.fillStyle(0xe3412b, 1); g.fillRect(x - 3, y + 1, 1, 1);
      // its light on the room: a hard checker wedge toward the couch
      if (this.camLight && this.mode !== 'last' && this.mode !== 'cut') for (let px = x + 9; px < KX + 252; px++) { const u = (px - x - 9) / (KX + 252 - x - 9), y0 = Math.round(y + 2 - 14 * u), y1 = Math.round(y + 3 + 6 * u); for (let py = y0; py <= y1; py++) if ((px + py) % 2 === 0) { g.fillStyle(0xebe6d8, 1); g.fillRect(px, py, 1, 1); } }
    }
  }

  // the city at night: people who film her, a tram, a screen with her on it, water, beacons
  drawCity(g, t, dt) {
    const k = this.kid, kc = k.x + k.w / 2;
    this.npcs.forEach(N => {
      const near = Math.abs(N.x - kc) < 58, rich = N.d.kind === 'a' || N.d.kind === 'b', talking = this.bubbles.busy('npc' + N.i);
      let walking = false;
      if (talking || (near && (rich || !N.d.speed))) { N.film = rich ? Math.min(1, N.film + dt * 3) : 0; N.face = kc > N.x ? 1 : -1; }
      else {
        N.film = Math.max(0, N.film - dt * 3);
        if (N.d.speed) {
          // never into her: a worker turns around with a word, anyone else waits
          const nx = N.x + N.dir * N.d.speed * dt;
          if (nx - 5 < k.x + k.w && nx + 5 > k.x && k.y + k.h > GROUND - 24) { if (N.d.kind === 'w') { N.dir = -N.dir; if (this.clock - (N.bumpT || -9) > 4) { N.bumpT = this.clock; this.npcSay(N, MOON_PEOPLE[N.i].bump); } } }
          else { N.x = nx; walking = true; }
          if (N.x > N.d.x1) { N.x = N.d.x1; N.dir = -1; } if (N.x < N.d.x0) { N.x = N.d.x0; N.dir = 1; } N.face = N.dir;
        }
      }
      if (N.prop) { N.prop.x = Math.round(N.x) - 5; N.thing.x0 = N.x - 9; N.thing.x1 = N.x + 9; N.thing.off = this.mode !== 'walk'; }
      const frame = N.film > 0.5 ? 'film' : walking ? (Math.floor(t * 4 + N.d.x0) % 2 ? 'walk1' : 'walk0') : (Math.floor(t * 1.4 + N.i * 0.7) % 3 === 0 ? 'idle1' : 'idle0');
      N.img.setTexture('npc_' + N.d.kind + '_' + frame).setPosition(Math.round(N.x), GROUND).setFlipX(N.face < 0);
      // filming: a red dot over the phone while it records
      if (N.film > 0.5) { this.filmed = true; if (Math.floor(t * 3) % 2) { g.fillStyle(n(M.red), 1); g.fillRect(Math.round(N.x) + N.face * 5 - (N.face < 0 ? 1 : 0), GROUND - 23, 1, 1); } }
    });
    // the screen on the boulevard: her, live, walking where she walks
    const LV = LEVEL.live, sx = LV.x + 6 + Math.round((kc / (CW * TILE)) * (LV.w - 12));
    g.fillStyle(n('#1b1c21'), 1); g.fillRect(LV.x, LV.y, LV.w, LV.h); g.fillStyle(n('#45474d'), 1); g.fillRect(LV.x, LV.y + LV.h - 9, LV.w, 9); g.fillStyle(n(M.trim), 1); g.fillRect(LV.x + 8, LV.y + LV.h - 22, 12, 13); g.fillRect(LV.x + 44, LV.y + LV.h - 18, 8, 9);
    g.fillStyle(n(M.white), 1); g.fillRect(sx, LV.y + LV.h - 15, 2, 6); g.fillStyle(n(this.P.hair), 1); g.fillRect(sx, LV.y + LV.h - 16, 2, 1);
    if (Math.floor(t * 2) % 2 === 0) { g.fillStyle(n(M.red), 1); g.fillRect(LV.x + 3, LV.y + 3, 3, 3); }
    pixText(g, 'LIVE', LV.x + 8, LV.y + 2, 0xebe6d8); pixText(g, 'CH 07', LV.x + LV.w - 22, LV.y + 2, n(M.yellow));
    // water from the fountain, arcing down into the basin, a pixel at a time
    const F = LEVEL.fountain.x;
    for (let i = 0; i < 10; i++) { const u = ((t * 0.9 + i / 10) % 1), side = i % 2 ? 1 : -1, x = F + side * (2 + u * 22), y = GROUND - 48 + u * u * 34 - u * 6; g.fillStyle(n(u < 0.6 ? '#ebe6d8' : '#b8b2a3'), 1); g.fillRect(Math.round(x), Math.round(y), 1, 2); }
    // steam at the service end: square puffs that rise and go
    for (let i = 0; i < 5; i++) { const u = ((t * 0.25 + i / 5) % 1); if (u > 0.7) continue; const x = CW * TILE - 21 + Math.round(Math.sin(t + i) * 3 + u * 6), y = Math.round(46 - u * 30), s = 2 + Math.round(u * 3); g.fillStyle(n(u < 0.35 ? '#b8b2a3' : '#8f8d87'), 1); g.fillRect(x - s / 2, y - s / 2, s, s); }
    // beacons on the far towers, and a tram that crosses now and then on its rail
    const fg = this.farG; fg.clear(); this.farMarks.forEach((m, i) => { if (m.kind === 'beacon' && Math.floor(t * 1.2 + i * 0.37) % 2 === 0) { fg.fillStyle(n(M.red), 1); fg.fillRect(m.x, m.y, 1, 1); } });
    const tg = this.tramG; tg.clear(); const cyc = t % 18;
    if (cyc < 9) { const x = this.view.x * 0.5 + 360 - cyc * 52; for (let c = 0; c < 3; c++) { const cx = Math.round(x + c * 24); tg.fillStyle(0x0e0f12, 1); tg.fillRect(cx - 1, 57, 24, 13); tg.fillStyle(n('#8f8d87'), 1); tg.fillRect(cx, 58, 22, 11); tg.fillStyle(n(M.trim), 1); tg.fillRect(cx, 66, 22, 1); for (let w = 0; w < 4; w++) { tg.fillStyle(n(M.warm), 1); tg.fillRect(cx + 2 + w * 5, 60, 3, 4); } } }
  }

  // the kids' giant screen: their game, a feed from Earth, a rerun, or Earth itself
  drawPlayroomScreen(g, t) {
    const S = LEVEL.screen, x = S.x, y = S.y, ink = 0x0e0f12;
    g.fillStyle(ink, 1); g.fillRect(x, y, S.w, S.h);
    if (this.mode === 'vest' || this.mode === 'last' || this.mode === 'cut') return;
    if (this.empty) {
      // a rerun of the grounds: the same girl, walking up to the same gate
      g.fillStyle(n('#1b1c21'), 1); g.fillRect(x, y, S.w, S.h); g.fillStyle(n('#2e3036'), 1); g.fillRect(x, y + 66, S.w, 30);
      g.fillStyle(n('#3a2f1f'), 1); g.fillRect(x + 50, y + 22, 76, 44); g.fillStyle(n(M.trim), 1); for (let i = 0; i < 5; i++) g.fillRect(x + 56 + i * 14, y + 34, 5, 9);
      const gx = x + 14 + Math.floor((t * 9) % 60); g.fillStyle(n('#8f8d87'), 1); g.fillRect(gx, y + 56, 3, 9); g.fillStyle(n('#1b1c21'), 1); g.fillRect(gx, y + 55, 3, 2);
      if (Math.floor(t * 1.5) % 2 === 0) { g.fillStyle(0xe3412b, 1); g.fillRect(x + 6, y + 6, 32, 11); ccText(g, 'RERUN', x + 8, y + 8, 0xebe6d8); }
      return;
    }
    const sat = this.mode === 'sat' || (this.sitting && this.endingId == null);
    if (sat) {
      // THE COUCH: Earth, turning, small fires on its night side. The board ticks on below.
      g.fillStyle(n('#45474d'), 1); for (let dy = -30; dy <= 30; dy++) { const hw = Math.floor(Math.sqrt(900 - dy * dy)); g.fillRect(x + 88 - hw, y + 44 + dy, hw * 2 + 1, 1); }
      g.fillStyle(n('#6b6c70'), 1); g.fillRect(x + 70 + Math.floor(t * 2) % 30, y + 30, 12, 6); g.fillRect(x + 84 + Math.floor(t * 2) % 20, y + 50, 9, 5);
      g.fillStyle(n('#1b1c21'), 1); for (let dy = -30; dy <= 30; dy++) { const hw = Math.floor(Math.sqrt(900 - dy * dy)); g.fillRect(x + 88 + Math.floor(hw * 0.2), y + 44 + dy, Math.ceil(hw * 0.8) + 1, 1); }
      g.fillStyle(n(M.trim), 1); [[96, 36], [104, 50], [99, 58], [110, 42]].forEach(([a, b], i) => { if (Math.floor(t * 2 + i) % 3) g.fillRect(x + a, y + b, 1, 1); });
      ccText(g, 'TAKE 32', x + 6, y + S.h - 12, 0xebe6d8);
      ccText(g, 'CH 07', x + S.w - 34, y + 5, n(M.trim));
      return;
    }
    const round2 = ['talk', 'choose', 'arrive', 'held', 'walkto', 'r2', 'look', 'lit'].includes(this.mode) || (this.mode === 'room' && this.roomT > 2.2);
    g.fillStyle(0xe3412b, 1); g.fillRect(x + 6, y + 6, 28, 11); ccText(g, 'LIVE', x + 8, y + 8, 0xebe6d8);
    ccText(g, 'CH 07', x + S.w - 34, y + 8, n(M.trim));
    // the board the kids play: a path that draws itself to each target
    const bx = x + 100, by = y + 22, cs = 9, cols = 7, rows = 7;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { g.fillStyle(n('#2e3036'), 1); g.fillRect(bx + i * cs + 1, by + j * cs + 1, cs - 2, cs - 2); }
    const path = [[0, 6], [1, 6], [2, 6], [2, 5], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [5, 2], [6, 2], [6, 1], [6, 0]], u = this.mode === 'walk' ? (t * 1.6) % path.length : path.length;
    for (let i = 0; i < Math.floor(u); i++) { const [px, py] = path[i]; g.fillStyle(n(M.trim), 1); g.fillRect(bx + px * cs + 2, by + py * cs + 2, cs - 4, cs - 4); }
    [[0, 6], [4, 4], [6, 0]].forEach(([px, py], i) => { g.fillStyle(n(i < 2 || u >= path.length ? M.yellow : '#8f8d87'), 1); g.fillRect(bx + px * cs + 2, by + py * cs + 2, cs - 4, cs - 4); });
    // the feed from Earth in the corner: the grounds at night, a small girl in an amber box
    const fx2 = x + 8, fy = y + 22, fw = 80, fh = 48;
    g.fillStyle(n('#1b1c21'), 1); g.fillRect(fx2, fy, fw, fh); g.fillStyle(n('#2e3036'), 1); g.fillRect(fx2, fy + fh - 8, fw, 8); g.fillStyle(n('#d6a03c'), 1); g.fillRect(fx2 + 30, fy + 12, 40, 3);
    for (let i = 0; i < 5; i++) { g.fillStyle(n('#b8b2a3'), 1); g.fillRect(fx2 + 32 + i * 8, fy + 15, 2, fh - 23); }
    const gx = fx2 + 6 + ((t * 6) % 24); g.fillStyle(n('#ebe6d8'), 1); g.fillRect(Math.round(gx), fy + fh - 13, 2, 5); g.fillStyle(n('#261f15'), 1); g.fillRect(Math.round(gx), fy + fh - 14, 2, 1);
    if (this.mode === 'r2' && this.r2Aim && Math.floor(t * 8) % 2) { g.lineStyle(1, n('#ffb01f'), 1); g.strokeRect(Math.round(gx) - 3, fy + fh - 17, 8, 10); }
    ccText(g, 'SCORE ' + (round2 ? 2800 : 2400), x + 8, y + S.h - 22, n(M.mint));
    if (round2 && Math.floor(t * 2.5) % 2 === 0) { const s = 'ROUND 2 READY?', w = ccWidth(s); g.fillStyle(ink, 1); g.fillRect(x + S.w / 2 - w / 2 - 3, y + S.h - 12, w + 6, 10); ccText(g, s, x + S.w / 2 - w / 2, y + S.h - 11, n(M.yellow)); }
    if (this.mode === 'room' && this.roomT < 2.2 && Math.floor(t * 8) % 2 === 0) ccText(g, '+400', bx + 64, by + 2, n(M.yellow));
  }

  // the cracked glasses, quiet up here; and her reply slip in the playroom
  drawHud() {
    const g = this.hudG; g.clear();
    if (this.mode === 'vest' || this.mode === 'last' || this.mode === 'cut') return;
    g.lineStyle(1, 0xebe6d8, 1);
    [[4, 4], [9, 7], [13, 6], [19, 11], [24, 12], [31, 18], [35, 17], [42, 23]].forEach(([x, y], i, arr) => { if (i) { const [px, py] = arr[i - 1]; g.lineBetween(px, py, x, y); } });
    if (this.clock < 3 && Math.floor(this.clock * 3) % 2 === 0) pixText(g, 'NO SIGNAL', 44, 8, n(this.P.overlay), 1, 1);
    if (this.mode === 'choose') this.drawSlip(g);
  }
  // A paper slip over the kids' screen: REPLY, ruled rows, the one picked inverted.
  drawSlip(g) {
    const ch = this.choices, ink = 0x0e0f12, paper = 0xebe6d8, rowH = 11;
    const w = Math.max(ccWidth(PLAYROOM_ASK) + 40, ...ch.map(r => ccWidth(r.text) + 20)), h = 14 + ch.length * rowH + 3, x = 160 - Math.round(w / 2), y = 26;
    g.fillStyle(ink, 1); g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(paper, 1); g.fillRect(x, y, w, h);
    ccText(g, PLAYROOM_ASK, x + 5, y + 3, ink); ccText(g, 'CH 07', x + w - 34, y + 3, n('#8f8d87'));
    g.fillStyle(ink, 1); g.fillRect(x + 3, y + 12, w - 6, 1);
    this.slipRows = { x, y: y + 14, w, h: rowH };
    ch.forEach((r, i) => {
      const ry = y + 14 + i * rowH, on = i === this.pick;
      if (on) { g.fillStyle(ink, 1); g.fillRect(x + 2, ry, w - 4, rowH - 1); }
      else { g.fillStyle(n('#b8b2a3'), 1); g.fillRect(x + 3, ry + rowH - 1, w - 6, 1); }
      ccText(g, on ? '>' : ' ', x + 5, ry + 2, on ? paper : ink);
      ccText(g, r.text, x + 14, ry + 2, on ? paper : ink);
    });
  }

  // The last shot: the old TV on Earth. What it shows depends on the ending; it is drawn into the
  // TV's own small canvas a pixel at a time, so nothing spills past the glass.
  drawLast(t) {
    const kind = this.lastKind;
    drawTv(this.tvCtx, kind, { t, blast: kind === 'moon' ? t - 2.4 : 0, bug: !(kind === 'couch' && this.bugOff), bite: this.bite, pieces: this.pieces });
    this.tvTex.refresh();
    // the card: the ending's title, and how many of the five this browser has seen
    const g = this.cardG; g.clear();
    if (!this.endCard) return;
    const a = this.endCard.title, b = 'ENDINGS SEEN ' + this.endCard.seen + '/' + this.endCard.of, w = Math.max(ccWidth(a), ccWidth(b)) + 12, x = 160 - Math.round(w / 2), y = 156;
    g.fillStyle(0xebe6d8, 1); g.fillRect(x, y, w, 21); g.fillStyle(0xb8b2a3, 1); g.fillRect(x + 2, y + 10, w - 4, 1);
    ccText(g, a, 160 - Math.round(ccWidth(a) / 2), y + 2, 0x0e0f12);
    ccText(g, b, 160 - Math.round(ccWidth(b) / 2), y + 12, 0x45474d);
  }

  hint() {
    if (this.mode === 'choose') return overlay.hint('W and S pick a reply. J says it.');
    if (this.mode === 'look') return overlay.hint('Their camera, by the window. J turns it around.');
    if (this.mode === 'last' && this.endCard) return overlay.hint('P opens the menu.');
    if (this.mode !== 'walk' || this.leaving) return overlay.hint('');
    const x = (this.kid.x + this.kid.w / 2) / TILE;
    if (x < 6) return overlay.hint('J looks at things and talks to things.');
    if (x > 96 && x < 101) return overlay.hint('A staff door. W or J.');
    return overlay.hint('');
  }
}
