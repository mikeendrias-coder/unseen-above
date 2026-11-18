// Episode 5, backstage: the hallway behind the Moon city, and the creator of the show. They
// built every set and trap she has been through, they reset the props between takes, and they
// are owned like everyone else up here. The kids voted for a fight, so the creator tosses her a
// sword. Three rounds, each with a trap from an episode (the grounds' searchlight, the gallery's
// laser, the bedroom's flash cameras). A hit only lands when the creator is open. Her HP is 3: a
// cut costs one, the round's trap kills outright (what watches her kills her). The creator has
// 9, on a paper slip at the top of the picture. Her deaths here are counted
// (story.creatorDeaths): after six, the next take is give-up mode. The creator drops the sword,
// stands in the middle of the stage and screams "End it all." and nothing else; each hit drains
// one segment, slowly. Nine hits: story.killedBroken. Out the open shutter instead: spared. A
// normal win (they yield) also spares them. Those flags pick the ending (data/endings.js).
// The count and the flags belong to one visit: a fresh arrival (not a retry) clears them.
import { Music } from '../core/music.js';
import { hexNum } from '../art/painter.js';
import { makeSprites } from '../art/sprites.js';
import { pixText } from '../art/pixfont.js';
import { ccText, ccWidth } from '../art/ccfont.js';
import { TILE, GROUND, H, ARENA, LEVEL, buildMap, paintLevel, paintCreator, POSES, PixLayer } from '../art/hallway.js';
import { Sound } from '../core/sound.js';
import { state } from '../core/state.js';
import { overlay } from '../core/overlay.js';
import { typer } from '../ui/typer.js';
import { display } from '../core/display.js';
import { SideEpisode, K, inPoly } from '../core/side.js';
import { goNext } from '../core/flow.js';
import { linkGiveUp } from '../data/endings.js';
import { Glasses } from '../core/glasses.js';
import { HALL_IN, HALL_TOSS, HALL_ROUND, HALL_HIT, HALL_AGAIN, HALL_YIELD, HALL_THINGS, HALL_GIVEUP, NOTICE, lineSeconds } from '../data/dialogue.js';
import { fx } from '../core/fx.js';

const T = TILE, G = GROUND, n = c => hexNum(c);
const HP = 9, ROUND_AT = [9, 6, 3];                     // hits left when each round starts
const TELL = [0.68, 0.6, 0.52];                         // how long the creator winds up, per round
const BLADE = 15, ARM = 6;
export const GIVE_UP_AT = 6;
// a line for the queue with a no-repeat key (a plain string is the creator's)
const keyed = (l, key) => Object.assign(typeof l === 'string' ? { who: 'CREATOR', text: l } : Object.assign({}, l), { key });
const RETRY_KEY = 'hallRetryAt';                          // her deaths in the fight before the creator gives up
const SCREAM_EVERY = 4, DRAIN = 0.6;
const THING_CLUE = { shelf: 'shelf', board: 'continuity' };

export class Hallway extends SideEpisode {
  constructor() { super('hallway'); }

  create(data) {
    data = data || {};
    this.initSide('ep5b', LEVEL, buildMap());
    const P = this.P;
    makeSprites(this, P);
    paintLevel().toTexture(this, 'hw_level');
    Object.keys(POSES).forEach(k => paintCreator(k).toTexture(this, 'cr_' + k));
    this.pixelCamera(LEVEL.w * T, H.wall);
    this.add.image(0, 0, 'hw_level').setOrigin(0).setDepth(0);
    this.setG = this.add.graphics().setDepth(1.5);        // gate, shutter, the sword on the floor, the console's glow
    this.crImg = this.add.image(0, G, 'cr_stand').setOrigin(0.5, 1).setDepth(3.6);
    this.commonLayers();
    this.armG = this.add.graphics().setDepth(4.6);        // both swords and the creator's arm
    // light is hard pixels: the rigs' light as a checker on a layer of its own, solid beams on
    // trapG, the tells the glasses show on tellG, and the dark of the last round as its own layer
    this.lightL = new PixLayer(this, 'hw_light', 5.1);
    this.trapG = this.add.graphics().setDepth(5.2);
    this.tellG = this.add.graphics().setDepth(5.3);
    this.darkL = new PixLayer(this, 'hw_dark', 5.6);
    this.hudG = this.addParallax(this.add.graphics().setDepth(20), 0);
    this.sparks = this.add.particles(0, 0, 'dot', { speed: { min: 30, max: 90 }, angle: { min: 200, max: 340 }, gravityY: 300, lifespan: { min: 160, max: 320 }, tint: [0xebe6d8, n(H.work)], emitting: false }).setDepth(7);

    this.gl = new Glasses({ has: true, on: false, cracked: true });
    this.view = { x: 0 };
    this.props = LEVEL.crates.map(c => Object.assign({ id: 'crate' }, c)).concat([Object.assign({ id: 'desk' }, LEVEL.desk)]);
    this.shutterProp = { id: 'shutter', x: LEVEL.shutter.x, y: 0, w: LEVEL.shutter.w, h: G }; this.props.push(this.shutterProp);
    this.gateProp = { id: 'gate', x: LEVEL.gate.x, y: 0, w: LEVEL.gate.w, h: G, solid: false }; this.props.push(this.gateProp);
    this.cr = { x: 25 * T, face: -1, st: 'wait', t: 0, hp: HP, round: 0, open: false, pose: 'stand', flash: 0, tally: true, lastLunge: [], attacks: 0, kx: 0 };
    this.sword = { have: false, swing: -1, cool: 0, hitThis: false, floor: null, fly: null };
    this.lamp = { on: false, t: 0, lock: 0, cone: null, id: 'searchlight' };
    this.laser = { shots: [], t: 0, phase: '', shot: null };
    this.cams = LEVEL.flashCams.map((c, i) => Object.assign({}, c, { id: 'flash camera', next: 2.2 + i * 1.7, clicks: 0, aim: null, cone: null, flash: 0, warn: false }));
    this.dark = false; this.darkT = 0;
    this.queue = []; this.lineT = 0; this.lineCb = null;
    this.skipPoints = [8 * T, 15 * T, 21 * T];

    // things to look at on the way in
    LEVEL.things.forEach(th => { const it = {}; this.things.push({ x0: th.x0, x1: th.x1, y0: 60, y1: G, label: 'J', use: () => { this.noteClue(THING_CLUE[th.id]); this.describe(HALL_THINGS[th.id], it, (th.x0 + th.x1) / 2, 60); } }); });
    // the stage, to look at once the fight is over
    const N = NOTICE.hallway, D = LEVEL.desk, it = {};
    this.addLook({ x0: 20 * T + 6, x1: 23 * T + 2, y0: 100, py: 70, lines: N.gallery });
    this.addLook({ x0: 27 * T + 8, x1: 29 * T, y0: 100, py: 70, lines: N.gate });
    this.addLook({ x0: 37 * T + 8, x1: 39 * T + 12, y0: 100, py: 70, lines: N.door });
    LEVEL.crates.forEach(c => this.addLook({ x0: c.x - 2, x1: c.x + c.w + 2, y0: c.y - 6, py: c.y, lines: N.crate }));
    this.things.push({ x0: D.x, x1: D.x + D.w, y0: 100, y1: G, py: D.y - 17, label: 'J', look: true, use: () => { this.noteClue('console'); this.describe(HALL_THINGS.console, it, D.x + D.w / 2, D.y - 17); } });
    this.swordThing = { x0: 0, x1: 0, y0: G - 6, y1: G, label: 'J', off: true, use: () => this.pickUp() };
    this.things.push(this.swordThing);
    // in round two the desk is the laser's console: E fires one high shot across the stage
    this.consoleThing = { x0: D.x, x1: D.x + D.w, y0: 100, y1: G, py: D.y - 17, label: 'J', off: true, use: () => this.pressConsole() };
    this.things.push(this.consoleThing); this.consoleAt = 0;

    this.drawBodies();
    // A retry is this scene starting again right after a take ended here (a death, Backspace, a
    // look change). Anything else is a fresh arrival: from the Moon, a link, Continue. A fresh
    // arrival starts the fight over: no deaths counted, no outcome, every line can be said again.
    const at = this.registry.get(RETRY_KEY) || 0; this.registry.set(RETRY_KEY, 0);
    const again = !data.fresh && at > 0 && performance.now() - at < 1500;
    const askGiveUp = !!data.giveUp || linkGiveUp();
    if (!again) {
      ['creatorDeaths', 'gaveUp', 'spared', 'killedBroken'].forEach(k => state.storySet(k, k === 'creatorDeaths' ? 0 : false));
      const heard = Object.assign({}, state.story.heard); Object.keys(heard).forEach(k => { if (/^HALL_/.test(k)) delete heard[k]; }); state.storySet('heard', heard);
    }
    // give-up mode: six deaths in the fight already, or asked for (?giveup=1#hallway)
    if (askGiveUp) state.storySet('creatorDeaths', Math.max(GIVE_UP_AT, state.story.creatorDeaths || 0));
    const retry = this.retry = again || askGiveUp;
    this.giveUp = retry && state.story.creatorDeaths >= GIVE_UP_AT;
    this.shutterOpen = 0; this.shutterProp.solid = true; this.train = false;
    this.spawn(retry ? 21 * T + 6 : null); this.kid.face = 1;
    this.mode = 'walk'; this.heardIn = 0;
    this.input.on('pointerdown', () => { if (this.mode === 'fight' || this.mode === 'giveup') this.swing(); });
    this.cameras.main.fadeIn(retry ? 300 : 900);
    this.beds = { hum: Sound.hum(0.02), wind: Sound.wind(0.0001) };
    Music.play('backstage', { fadeIn: 2 });
    this.events.once('shutdown', () => { if (this.dead) this.markRetry(); Object.values(this.beds).forEach(b => b.stop(0.4)); overlay.clearCaption(); });
    if (this.giveUp) this.startGiveUp(); else if (retry) this.startToss(true);
    this.updateView(1);
    window.__game = { scene: this, state };
  }

  // things to look at: on the way in, and on the stage once the fight is over
  lookable() { return this.mode === 'walk' || this.mode === 'after'; }
  doorReady() { return (this.mode === 'after' || this.mode === 'giveup') && !this.dead && !this.leaving; }
  // a clue found in a look: noted once, with the count
  noteClue(id) { if (id && state.clue(id)) overlay.note('CLUE NOTED (' + state.clueCount() + ')', 1600); }
  // a death in the fight counts toward the creator giving up
  die(src) {
    if (!this.dead && (this.mode === 'fight' || this.mode === 'between')) state.storySet('creatorDeaths', (state.story.creatorDeaths || 0) + 1);
    super.die(src);
  }
  // a take thrown away in the middle of the fight (Backspace) counts as a death too; this is also
  // how story mode, where nothing kills her, can still reach give-up mode
  restartTake() {
    const mid = this.mode === 'fight' || this.mode === 'between';
    const ok = super.restartTake();
    if (ok && mid) state.storySet('creatorDeaths', (state.story.creatorDeaths || 0) + 1);
    return ok;
  }
  // every way this scene restarts itself (a death, Backspace, a look change) comes through here
  // or through die(); the time is left for the next create() to see it is a retry
  commonKeys() { const r = super.commonKeys(); if (r) this.markRetry(); return r; }
  markRetry() { this.registry.set(RETRY_KEY, performance.now()); }

  // ------------------------------------------------------------------ the loop
  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30), c = this.ctl;
    this.clock += dt;
    if (this.commonKeys()) { c.endFrame(); return; }
    if (this.done) { c.endFrame(); return; }
    if (!this.dead && !this.leaving) {
      this.consoleThing.off = !this.consoleReady();
      // the fixed train of lines before the fight holds her where she stands until the sword lands
      if (this.train && !this.sword.floor && !this.sword.have) this.settle(dt); else { this.moveKid(dt); this.updateThings(); }
      if (c.glasses()) this.gl.toggle();
      if (c.throwP() && (this.mode === 'fight' || this.mode === 'giveup')) this.swing();
    } else if (this.dead && this.girl.visible) this.settle(dt);
    this.gl.update(dt);
    // Enter moves the captions on when nothing is at stake (ui/typer.js takes the keys)
    this.updateLines(dt);
    if (this.mode === 'walk') this.walkIn();
    if (this.mode === 'giveup') this.updateGiveUp(dt);
    this.updateSword(dt);
    this.updateCreator(dt);
    this.updateTraps(dt);
    this.updateView(dt);
    this.draw(dt);
    this.hint();
    c.endFrame();
  }
  updateView(dt) {
    const S = display.S, cam = this.cameras.main, k = this.kid, W = LEVEL.w * T;
    let want;
    if (this.mode === 'walk') want = Math.min(ARENA.x0, Math.max(0, k.x + k.w / 2 + 18 - 160));
    else if (this.mode === 'after' || (this.mode === 'giveup' && k.x > ARENA.x1 - 40)) want = Math.min(W - 320, Math.max(ARENA.x0, k.x + k.w / 2 + 18 - 160));
    else want = ARENA.x0;
    this.view.x += (want - this.view.x) * Math.min(1, dt * 8);
    cam.scrollX = Math.round(this.view.x) - 160 * (S - 1); cam.scrollY = -90 * (S - 1);
  }
  onRescale() { super.onRescale(); this.updateView(1); }

  // ------------------------------------------------------------------ lines
  // Captions in a queue: each line types out (ui/typer.js) and holds for as long as it takes to
  // read, then the next. The train into the fight blocks (J, Enter, Space or a click finish a line,
  // then move on); outside the fight Enter moves a line on; the fight's lines run themselves.
  // An entry may carry a key: dropped if heard, marked heard once it is fully shown (so a line cut
  // short by a death plays again). always: said even when heard, whole at once, on for 0.6 s.
  say(lines, cb, keep, now) {
    if (!keep) this.queue = [];
    if (now) this.lineT = 0; // cut in over whatever is up
    lines.forEach(l => this.queue.push(typeof l === 'string' ? { who: 'CREATOR', text: l } : l));
    if (cb) this.queue.push({ cb });
    if (this.lineT <= 0) this.nextLine();
  }
  nextLine() {
    let l = this.queue.shift();
    while (!l && this.queue.length) l = this.queue.shift(); // an empty entry never stalls the queue
    if (!l) { this.lineT = 0; overlay.clearCaption(); return; }
    // a callback may start lines of its own; then those play, and this queue is done
    if (l.cb) { l.cb(); if (this.lineT <= 0) this.nextLine(); return; }
    if (l.pause) { overlay.clearCaption(); this.lineT = l.pause; return; }
    if (l.key != null && !l.always && state.heard(l.key)) { this.lineT = 0; return this.nextLine(); }
    const text = l.text.replace('{take}', this.ep.take);
    // a voice from off screen is captioned in italics
    const off = l.who === 'CREATOR' && (this.cr.x < this.view.x - 4 || this.cr.x > this.view.x + 324);
    const fight = () => this.mode === 'fight' || this.mode === 'giveup';
    const line = overlay.caption(l.who, text, { italic: off, key: l.key, scene: this, block: !!(this.train && l.who), noSkip: fight, instant: !!l.always,
      onAdvance: () => { if (overlay.line === line) { this.lineT = 0; this.nextLine(); } } });
    this.lineT = l.always ? 0.6 : typer.total(text, lineSeconds(text) + (l.who ? 0.3 : 0.6));
    if (l.on) l.on();
  }
  // while she looks at something, the creator waits for her (and in presenter mode, a blocking
  // line waits for a press)
  updateLines(dt) { if (this.lineT > 0 && !overlay.describing() && !typer.waiting()) { this.lineT -= dt; if (this.lineT <= 0) this.nextLine(); } }
  describe(lines, it, x, y) { if (!it.lines) it.lines = lines; this.bubbles.look('item', it, () => ({ x, y })); }

  // ------------------------------------------------------------------ the walk in and the toss
  walkIn() {
    if (this.kid.x > ARENA.x0 + 10 && !this.dead) this.startToss(false);
  }
  startToss(retry) {
    this.mode = 'toss'; this.gateProp.solid = true;
    Sound.tone(90, 0.35, 'sawtooth', 0.04, 60); Sound.noise(0.3, 0.06, 900);
    Music.play('boss', { fadeIn: 1.5 });
    const toss = { who: null, text: '[A SWORD CLATTERS]', on: () => this.throwSword() };
    // the first two retries get one line each, never twice; after that, silence (Nov 17)
    if (retry) { const i = [0, 1].find(j => !state.heard('HALL_AGAIN' + j)); this.say(i != null ? [keyed(HALL_AGAIN[i], 'HALL_AGAIN' + i), toss] : [toss]); }
    else { this.train = true; this.say(HALL_IN.concat(HALL_TOSS.slice(0, 3), [toss]), () => { this.train = false; }); }
    this.cr.st = 'talk'; this.cr.walkTo = 30 * T; if (retry) this.cr.x = 30 * T;
  }
  throwSword() {
    if (this.sword.have || this.sword.floor || this.sword.fly) return; // one sword, thrown once
    this.queue.forEach(q => { if (q.text === '[A SWORD CLATTERS]') q.on = null; }); // thrown already: the caption alone
    const c = this.cr, k = this.kid, to = Math.max(ARENA.x0 + 20, Math.min(ARENA.x1 - 20, k.x + k.w / 2 + 26));
    this.sword.fly = { sx: c.x - 6, sy: G - 18, ex: to, t: 0 };
    this.cr.pose = 'lean'; this.time.delayedCall(500, () => { if (this.cr.st === 'talk') this.cr.pose = 'stand'; });
    Sound.noise(0.2, 0.03, 4000);
  }
  pickUp() {
    if (this.sword.have || !this.sword.floor) return;
    this.sword.have = true; this.sword.floor = null; this.swordThing.off = true;
    Sound.tone(660, 0.08, 'triangle', 0.03); this.time.delayedCall(70, () => Sound.tone(990, 0.12, 'triangle', 0.025));
    const shown = this.itemPanel('sword');
    // on a retry she has heard it: straight to the round
    // the first time, the train ends on "Hold it up." and round one's set line (HALL_ROUND[0])
    const go = () => (this.mode === 'giveup' ? null : this.retry ? this.startRound(0)
      : this.say([HALL_TOSS[4], keyed(HALL_ROUND[0][0], 'HALL_ROUND0')], () => { this.train = false; this.startRound(0); }));
    if (shown) this.time.delayedCall(50, go); else go();
  }
  startRound(i) {
    const c = this.cr;
    // a beat first: the round's line is still on screen, and the first round is the longest wait
    c.round = i; c.st = 'idle'; c.t = i === 0 ? 1.8 : 1.0; c.open = false; c.attacks = 0;
    this.mode = 'fight';
    if (i === 2) this.lightsOff();
  }

  // ------------------------------------------------------------------ give-up mode
  // After six deaths in the fight: no toss of words, no rounds, no traps. The sword drops where
  // she can reach it, the shutter rolls up, and the creator stands in the middle of the stage
  // and screams the same three words every few seconds. They attack nobody.
  startGiveUp() {
    const c = this.cr;
    this.mode = 'giveup'; this.gateProp.solid = true; this.shutterOpen = 0.01;
    state.storySet('gaveUp', true);
    Music.stop(1.5); Sound.noise(1.2, 0.05, 500); Sound.tone(110, 1.0, 'triangle', 0.03, 140);
    Object.assign(c, { x: 30 * T, st: 'broken', pose: 'stand', face: -1, open: true, unarmed: true, drain: 0, screamT: 2.2, walkTo: null });
    // the sword falls out of their hand and lands between them
    this.sword.fly = { sx: c.x - 6, sy: G - 18, ex: Math.max(ARENA.x0 + 20, Math.min(c.x - 30, this.kid.x + this.kid.w / 2 + 30)), t: 0.2 };
    this.say([{ who: null, text: HALL_GIVEUP.drop, key: 'HALL_GIVEUP_drop' }]);
  }
  updateGiveUp(dt) {
    const c = this.cr; if (c.st !== 'broken') return;
    c.drain = Math.max(0, c.drain - dt);
    c.screamT -= dt;
    if (c.screamT <= 0) {
      c.screamT = SCREAM_EVERY; c.scream = 0.9;
      this.say([{ who: 'CREATOR', text: HALL_GIVEUP.scream }], null, false, true);
      Sound.noise(0.5, 0.05, 1400); Sound.tone(180, 0.6, 'sawtooth', 0.03, 120);
    }
    c.scream = Math.max(0, (c.scream || 0) - dt);
  }
  // a hit on the creator who gave up: one segment drains, slowly; the next waits for it
  hitBroken() {
    const c = this.cr;
    if (c.hp <= 0 || c.drain > 0) return this.parry(true);
    c.hp--; c.drain = DRAIN; c.flash = 0.12; c.hurtT = 0.5;
    Sound.tone(200, 0.2, 'sawtooth', 0.035, 100); Sound.noise(0.12, 0.06, 2200); fx.shake(this.cameras.main, 100, 0.005);
    this.sparks.explode(6, c.x, G - 14);
    if (c.hp <= 0) {
      // nine: they go down, the light on the headset goes out, the show cuts away
      c.st = 'down'; c.pose = 'kneel'; c.open = false;
      state.storySet('killedBroken', true); state.storySet('spared', false);
      this.time.delayedCall(900, () => { c.tally = false; Sound.click(0.03); });
      this.say([{ who: null, text: HALL_GIVEUP.down }]);
      state.finish(this.epId);
    }
  }

  // ------------------------------------------------------------------ her sword
  swing() {
    const s = this.sword;
    if (!s.have || s.cool > 0 || this.dead || (this.mode !== 'fight' && this.mode !== 'giveup')) return;
    s.swing = 0; s.cool = 0.36; s.hitThis = false;
    Sound.noise(0.09, 0.035, 2600); Sound.tone(520, 0.05, 'triangle', 0.012, 300);
  }
  updateSword(dt) {
    const s = this.sword;
    s.cool = Math.max(0, s.cool - dt);
    if (s.swing >= 0) { s.swing += dt; if (s.swing > 0.24) s.swing = -1; }
    // the toss: a spinning arc that lands near her
    if (s.fly) {
      s.fly.t += dt; const u = Math.min(1, s.fly.t / 0.7);
      if (u >= 1) { s.floor = { x: s.fly.ex }; s.fly = null; this.swordThing.x0 = s.floor.x - 12; this.swordThing.x1 = s.floor.x + 12; this.swordThing.y0 = G - 22; this.swordThing.py = G - 4; this.swordThing.off = false; Sound.tone(1500, 0.06, 'square', 0.03); Sound.noise(0.12, 0.06, 5000); this.sparks.explode(5, s.floor.x, G - 1); }
    }
    // a hit lands in the middle of the swing, once
    if (s.swing > 0.04 && s.swing < 0.16 && !s.hitThis) {
      const k = this.kid, cx = k.x + k.w / 2, x0 = k.face > 0 ? cx : cx - 21, x1 = k.face > 0 ? cx + 21 : cx, y0 = k.y - 6, y1 = k.y + k.h;
      const c = this.cr, b = this.crBox();
      if (x1 > b.x0 && x0 < b.x1 && y1 > b.y0 && y0 < b.y1 && c.st !== 'talk' && c.st !== 'yield' && c.st !== 'down') {
        s.hitThis = true;
        if (c.st === 'broken') this.hitBroken();
        else if (c.open && c.st !== 'hurt') this.hitCreator(); else this.parry();
      }
    }
  }
  crBox() { const c = this.cr, h = c.pose === 'kneel' ? 16 : c.pose === 'crouch' ? 20 : 24; return { x0: c.x - 5, x1: c.x + 5, y0: G - h, y1: G }; }
  parry(soft) {
    const k = this.kid, c = this.cr;
    if (soft) { Sound.tone(900, 0.05, 'triangle', 0.015); return; }
    Sound.tone(1900, 0.07, 'square', 0.03, 1500); Sound.noise(0.06, 0.06, 7000);
    this.sparks.explode(6, c.x - c.face * -4, G - 14);
    k.vx = (k.x + k.w / 2 < c.x ? -1 : 1) * 120; this.sword.cool = 0.5;
  }
  hitCreator() {
    const c = this.cr, k = this.kid;
    if (c.hp <= 0) return; // it is over: no hits after the last
    c.hp--; c.st = 'hurt'; c.t = 0.55; c.open = false; c.flash = 0.12;
    c.kx = (c.x < k.x + k.w / 2 ? -1 : 1) * 90;
    Sound.tone(220, 0.16, 'sawtooth', 0.04, 110); Sound.noise(0.12, 0.07, 2200); fx.shake(this.cameras.main, 120, 0.006);
    this.sparks.explode(10, c.x, G - 14);
    const hi = HP - c.hp - 1, line = HALL_HIT[hi] && !state.heard('HALL_HIT' + hi) ? keyed(HALL_HIT[hi], 'HALL_HIT' + hi) : null;
    // the last hit stops everything at once: no more attacks, no traps, then the yield
    if (c.hp <= 0) { this.mode = 'between'; c.st = 'between'; c.t = 99; this.endTraps(); this.say(line ? [line] : [], () => this.yieldFight(), false, true); return; }
    const next = ROUND_AT.indexOf(c.hp);
    // each round's line is said once ever; a retry goes straight on after a short beat
    // (heard once its last line is out: a death in the middle says it all again)
    const roundLines = next > 0 && !state.heard('HALL_ROUND' + next) ? HALL_ROUND[next].map((l, j, a) => j === a.length - 1 ? keyed(l, 'HALL_ROUND' + next) : l) : [];
    if (next > 0) { c.st = 'between'; c.t = 99; this.mode = 'between'; this.say([line].concat(roundLines, roundLines.length || line ? [] : [{ who: null, text: '', pause: 1.2 }]), () => this.startRound(next), false, true); this.endTraps(); }
    else if (line) this.say([line], null, false, true);
  }

  // ------------------------------------------------------------------ the creator
  updateCreator(dt) {
    const c = this.cr, k = this.kid, kc = k.x + k.w / 2, R = c.round;
    c.flash = Math.max(0, c.flash - dt);
    if (c.st === 'broken' || c.st === 'down') {
      c.hurtT = Math.max(0, (c.hurtT || 0) - dt);
      if (c.st === 'broken') { c.pose = c.hurtT > 0 ? 'back' : c.scream > 0 ? (Math.floor(this.clock * 10) % 2 ? 'back' : 'stand') : 'stand'; c.face = kc < c.x ? -1 : 1; }
      this.pushOut(); return this.placeCreator();
    }
    if (c.st === 'wait' || c.st === 'talk' || c.st === 'yield') {
      if (c.st === 'talk' && c.walkTo != null && Math.abs(c.walkTo - c.x) > 1) { c.x += Math.sign(c.walkTo - c.x) * 40 * dt; c.face = Math.sign(c.walkTo - c.x) || -1; c.pose = Math.floor(this.clock * 6) % 2 ? 'a' : 'b'; c.walking = true; }
      else { if (c.walking) { c.walking = false; c.pose = 'stand'; } if (c.st !== 'yield') c.face = kc < c.x ? -1 : 1; }
      this.pushOut(); return this.placeCreator();
    }
    c.t -= dt;
    const dx = kc - c.x, dist = Math.abs(dx), clampX = x => Math.max(ARENA.x0 + 12, Math.min(ARENA.x1 - 12, x));
    switch (c.st) {
      case 'idle': {
        c.open = false; c.face = dx < 0 ? -1 : 1; c.pose = 'stand';
        // keep a fighting distance: close in when far, step back when she is right on top
        const want = dist > 70 ? 1 : dist < 26 ? -1 : 0;
        if (want) { c.x = clampX(c.x + Math.sign(dx) * want * 38 * dt); c.pose = Math.floor(this.clock * 6) % 2 ? 'a' : 'b'; }
        if (c.t <= 0 && !this.dead) {
          c.attacks++;
          if (R === 1 && c.attacks % 3 === 0) { c.st = 'console'; c.t = 4; break; }
          // never a chop when she has her back to a wall: they step back and lunge instead
          const room = dx < 0 ? kc - (ARENA.x0 + 2) : (ARENA.x1 - 2) - kc;
          if (dist < 34 && room > 34) { c.st = 'raise'; c.t = TELL[R] * 0.85; Sound.tone(300, 0.4, 'sine', 0.02, 1200); }
          else if (dist < 34) { c.st = 'hop'; c.hopTo = clampX(c.x - Math.sign(dx) * 32); c.t = 0.4; c.attacks--; Sound.noise(0.1, 0.02, 1500); }
          else {
            const hist = c.lastLunge, hi = hist.length >= 2 && hist[0] === hist[1] ? !hist[0] : Math.random() < 0.5;
            hist.unshift(hi); hist.length = Math.min(hist.length, 3);
            c.st = hi ? 'windHi' : 'windLo'; c.t = TELL[R]; Sound.noise(0.25, 0.025, 6000); Sound.tone(hi ? 2200 : 1300, 0.06, 'sine', 0.015);
          }
        }
        break;
      }
      case 'windHi': case 'windLo':
        c.pose = c.st === 'windHi' ? 'back' : 'crouch'; c.face = dx < 0 ? -1 : 1;
        if (c.t <= 0) { c.hi = c.st === 'windHi'; c.st = 'lunge'; c.target = clampX(kc - c.face * 12); c.t = 0.6; Sound.tone(900, 0.18, 'sawtooth', 0.025, 300); }
        break;
      case 'lunge': {
        c.pose = 'lean';
        const step = 270 * dt * c.face; c.x = clampX(c.x + step);
        if ((c.face > 0 && c.x >= c.target) || (c.face < 0 && c.x <= c.target) || c.t <= 0) { c.st = 'recover'; c.t = 1.05; c.open = true; }
        this.bladeHits();
        break;
      }
      case 'raise':
        c.pose = 'stand'; c.face = dx < 0 ? -1 : 1;
        if (c.t <= 0) { c.st = 'chop'; c.t = 0.08; this.chopHits(); Sound.tone(140, 0.2, 'sawtooth', 0.04, 70); Sound.noise(0.15, 0.08, 2600); fx.shake(this.cameras.main, 90, 0.005); this.sparks.explode(8, c.x + c.face * 16, G - 1); }
        break;
      case 'chop':
        c.pose = 'lean'; if (c.t <= 0) { c.st = 'stuck'; c.t = 1.15; c.open = true; }
        break;
      case 'recover': case 'stuck':
        c.pose = c.st === 'stuck' ? 'lean' : 'stand';
        if (c.t <= 0) { c.st = 'idle'; c.open = false; c.t = 0.45 + Math.random() * 0.5; }
        break;
      case 'hop':
        // a quick step back to give her room
        c.pose = 'b'; c.x += Math.sign(c.hopTo - c.x) * Math.min(Math.abs(c.hopTo - c.x), 130 * dt);
        if (c.t <= 0 || Math.abs(c.hopTo - c.x) < 1) { c.st = 'idle'; c.t = 0.15; }
        break;
      case 'flinch':
        c.pose = 'back'; c.open = true;
        if (c.t <= 0) { c.st = 'idle'; c.open = false; c.t = 0.4; }
        break;
      case 'hurt':
        c.pose = 'back'; c.x = clampX(c.x + c.kx * dt); c.kx *= 0.9;
        if (c.t <= 0) { c.st = 'idle'; c.t = 0.6; }
        break;
      case 'console': {
        // back to the desk, a button, three shots of the laser while they duck behind it
        const D = LEVEL.desk, home = D.x + D.w / 2;
        c.open = false;
        if (Math.abs(c.x - home) > 2 && !this.laser.shots.length) { c.face = home > c.x ? 1 : -1; c.x += c.face * 60 * dt; c.pose = Math.floor(this.clock * 6) % 2 ? 'a' : 'b'; }
        else if (!this.laser.shots.length && !this.laser.done) { c.pose = 'crouch'; this.fireLaser(); }
        else c.pose = 'crouch';
        if (this.laser.done) { this.laser.done = false; c.st = 'idle'; c.t = 0.6; }
        break;
      }
      case 'between':
        c.open = false; c.pose = 'stand';
        break;
    }
    this.pushOut();
    this.placeCreator();
  }
  // she cannot stand inside the creator: a soft push out to the side she is on
  pushOut() {
    const c = this.cr, k = this.kid; if (this.dead || c.st === 'lunge') return;
    const dx = k.x + k.w / 2 - c.x, need = 9 - Math.abs(dx);
    if (need > 0 && k.y + k.h > G - (c.pose === 'kneel' ? 14 : 22)) { const st = (dx >= 0 ? 1 : -1) * need; if (!this.boxHits(k.x + st, k.y, k.w, k.h)) k.x += st; }
  }
  placeCreator() {
    const c = this.cr;
    this.crImg.setTexture('cr_' + c.pose).setPosition(Math.round(c.x), G).setFlipX(c.face < 0);
    // a white flash on the frame a hit lands
    if (c.flash > 0) this.crImg.setTint(0xebe6d8).setTintMode(Phaser.TintModes.FILL); else this.crImg.setTintMode(Phaser.TintModes.MULTIPLY).clearTint();
  }
  // where the creator's blade is this frame: [x0, y0, x1, y1]
  blade() {
    const c = this.cr, sh = POSES[c.pose].sh, ox = c.x - 7, top = G - 26;
    const sx = c.face > 0 ? ox + sh[0] : ox + 14 - sh[0], sy = top + sh[1];
    let a;
    switch (c.st) {
      case 'windHi': a = -150; break;
      case 'windLo': a = 160; break;
      case 'lunge': case 'recover': a = c.hi ? -4 : 30; if (c.st === 'recover') a = c.hi ? 10 : 50; break;
      case 'raise': a = -95; break;
      case 'chop': case 'stuck': a = 62; break;
      case 'hurt': a = -140; break;
      case 'flinch': a = -120; break;
      case 'console': a = 70; break;
      default: a = 55;
    }
    if (c.face < 0) a = 180 - a;
    const r = a * Math.PI / 180, hx = sx + Math.cos(r) * ARM, hy = sy + Math.sin(r) * ARM;
    let br = r;
    if (c.st === 'lunge') { br = c.face > 0 ? 0 : Math.PI; }
    const bladeY = c.st === 'lunge' ? (c.hi ? G - 12 : G - 3) : null;
    const tx = hx + Math.cos(br) * BLADE, ty = bladeY != null ? bladeY : hy + Math.sin(br) * BLADE;
    return { sx, sy, hx, hy: bladeY != null ? bladeY : hy, tx, ty };
  }
  bladeHits() {
    if (this.dead || window.__noDeath) return;
    const k = this.kid, b = this.blade(), y = b.ty, x0 = Math.min(b.hx, b.tx), x1 = Math.max(b.hx, b.tx);
    if (k.x + k.w > x0 && k.x < x1 && y >= k.y && y <= k.y + k.h) this.hurt(1, 'creator'); // the sword is the house: HP
  }
  chopHits() {
    if (this.dead || window.__noDeath) return;
    const k = this.kid, c = this.cr, x0 = c.face > 0 ? c.x + 2 : c.x - 22, x1 = c.face > 0 ? c.x + 22 : c.x - 2, D = LEVEL.desk;
    if (!(k.x + k.w > x0 && k.x < x1 && k.y + k.h > G - 30)) return;
    // under the desk, the blade bites the tabletop instead
    if (k.x + k.w > D.x + 2 && k.x < D.x + D.w - 2 && k.y > D.y) { this.sparks.explode(8, Math.max(D.x, Math.min(D.x + D.w, k.x + 4)), D.y); Sound.tone(1700, 0.1, 'square', 0.03, 900); return; }
    this.hurt(1, 'creator');
  }
  yieldFight() {
    const c = this.cr;
    this.mode = 'yield'; c.st = 'yield'; c.pose = 'kneel'; c.open = false; this.endTraps(); this.lightsOn();
    Music.stop(2.5); Sound.tone(70, 1.2, 'sine', 0.05, 50);
    const lines = HALL_YIELD.map(l => /CLICKS OFF/.test(l.text) ? Object.assign({}, l, { on: () => { c.tally = false; Sound.click(0.03); } }) : l);
    this.say(lines, () => this.openWay());
  }
  openWay() {
    this.mode = 'after'; this.shutterOpen = 0.01; this.gateProp.solid = false;
    Sound.noise(1.2, 0.05, 500); Sound.tone(110, 1.0, 'triangle', 0.03, 140);
    state.finish(this.epId);
  }

  // ------------------------------------------------------------------ the traps
  updateTraps(dt) {
    const R = this.cr.round, live = this.mode === 'fight';
    // round one: the searchlight from the grounds, sweeping the stage now and then
    const L = this.lamp, LV = LEVEL.lamp;
    if (live && R === 0) {
      // off for a while, a moment warming up (a glow, a rising tone), then one slow, steady pass
      // across the stage; the next pass goes the other way. Standing still, the beam crosses her
      // just too fast to lock; walking with it is what gets her caught.
      L.t += dt; const cyc = L.t % 9, pass = Math.floor(L.t / 9) % 2; L.warm = cyc > 4.4 && cyc <= 5; L.on = cyc > 5;
      const u = Math.max(0, Math.min(1, (cyc - 5) / 4));
      L.angle = pass ? LV.to - (LV.to - LV.from) * u : LV.from + (LV.to - LV.from) * u;
      if (L.warm && !L.wasWarm) Sound.tone(260, 0.6, 'sawtooth', 0.015, 520);
      L.wasWarm = L.warm;
      L.cone = L.on ? this.cone(LV.x, LV.y + 4, L.angle, LV.half, LV.range) : null;
      if (!L.on) L.blinded = false;
      else if (!L.blinded && this.pointSeen(LV.x, LV.y + 4, L.angle, LV.half, LV.range, this.cr.x, G - 16) && this.blindCreator()) L.blinded = true;
      if (L.on && !L.was) Sound.tone(520, 0.3, 'sawtooth', 0.02, 1040);
      L.was = L.on;
      if (L.cone && !this.dead) {
        const seen = !window.__noDeath && this.seenFrom(LV.x, LV.y + 4, L.angle, LV.half, LV.range);
        if (seen) { if (L.lock === 0) Sound.charge(); L.lock += dt; if (L.lock >= LV.lock) { this.satX = LV.x; this.die(L); } } else L.lock = Math.max(0, L.lock - dt * 2);
      } else L.lock = Math.max(0, L.lock - dt * 2);
    } else { L.on = false; L.cone = null; L.lock = 0; }
    // round two: the gallery's laser, three shots whenever the creator reaches the desk
    const Z = this.laser;
    if (Z.shots.length) {
      Z.t += dt; const s = Z.shots[0], f = Z.t;
      const ph = f < 0.75 ? 'tell' : f < 1.2 ? 'charge' : f < 1.5 ? 'fire' : 'gap';
      if (ph !== Z.phase) { Z.phase = ph; if (ph === 'tell') { Sound.tone(1320, 0.05, 'square', 0.014); this.time.delayedCall(130, () => Sound.tone(s === 'low' ? 990 : 1760, 0.06, 'square', 0.014)); } if (ph === 'charge') Sound.charge(); if (ph === 'fire') { Sound.tone(1500, 0.35, 'sawtooth', 0.03, 1200); Sound.noise(0.3, 0.05, 7000); } }
      Z.shot = s;
      if (ph === 'fire' && !this.dead && !window.__noDeath) { const k = this.kid, y = s === 'low' ? LEVEL.lasers.lo : LEVEL.lasers.hi; if (y >= k.y && y <= k.y + k.h) this.die({ id: 'laser', direct: true }); }
      if (ph === 'fire' && Z.hers && !Z.hitThem) {
        const c = this.cr, b = this.crBox(), y = s === 'low' ? LEVEL.lasers.lo : LEVEL.lasers.hi;
        if (y >= b.y0 && y <= b.y1 && !['hurt', 'between', 'yield', 'talk', 'wait'].includes(c.st)) { Z.hitThem = true; this.hitCreator(); }
      }
      if (f > 1.9) { Z.shots.shift(); Z.t = 0; Z.phase = ''; if (!Z.shots.length) { if (Z.hers) Z.hers = false; else Z.done = true; } }
    }
    // round three: lights off, two flash cameras that click twice, turn to her, and flash
    if (live && R === 2) this.cams.forEach(cm => {
      cm.next -= dt; cm.flash = Math.max(0, cm.flash - dt * 2.5);
      const k = this.kid, aimAt = () => ({ x: k.x + k.w / 2, y: k.y + k.h });
      // these turn to find her, so they give her longer than the bedroom's: two clicks over a second
      if (cm.next <= 1.1 && cm.clicks === 0) { cm.clicks = 1; cm.aim = aimAt(); cm.warn = true; Sound.click(0.03); }
      if (cm.next <= 0.55 && cm.clicks === 1) { cm.clicks = 2; Sound.click(0.03); }
      if (cm.aim) { cm.ang = Math.atan2(cm.aim.y - cm.y, cm.aim.x - cm.x) * 180 / Math.PI; cm.cone = this.cone(cm.x, cm.y + 2, cm.ang, 12, 190); }
      if (cm.next <= 0) {
        cm.flash = 1; cm.lit = fx.allowFlash() ? 1 : 0.15; cm.warn = false; cm.clicks = 0; cm.next = 3 + Math.random() * 1.2; Sound.shutter(0.1);
        // the flash catches her if she is in it, and blinds the creator wherever they are
        const seen = !window.__noDeath && !this.dead && cm.cone && this.seenFrom(cm.x, cm.y + 2, cm.ang, 12, 190);
        if (seen) { this.satX = cm.x; this.die(cm); }
        const c = this.cr; if (['idle', 'windHi', 'windLo', 'raise', 'recover'].includes(c.st)) { c.st = 'flinch'; c.t = 1.3; }
        cm.aim = null;
      }
    });
    if (this.shutterOpen > 0 && this.shutterOpen < 1) { this.shutterOpen = Math.min(1, this.shutterOpen + dt / 1.4); if (this.shutterOpen >= 1) this.shutterProp.solid = false; }
  }
  // Exact sight for the rigs: inside the angle and the range, nothing solid on the line to her.
  seenFrom(ox, oy, angle, half, range) {
    return this.probes().some(q => {
      const dx = q.x - ox, dy = q.y - oy, d = Math.hypot(dx, dy); if (d > range) return false;
      const diff = ((Math.atan2(dy, dx) * 180 / Math.PI - angle) % 360 + 540) % 360 - 180; if (Math.abs(diff) > half) return false;
      for (let s = 3; s < d - 1; s += 0.5) if (this.solidPx(ox + dx / d * s, oy + dy / d * s)) return false;
      return true;
    });
  }
  // Their own traps work on them too. The console: in round two, while the creator is out on the
  // stage, E at the desk fires one high shot of the laser (then it needs time to charge again).
  consoleReady() { const c = this.cr; return this.mode === 'fight' && c.round === 1 && !this.laser.shots.length && c.st !== 'console' && this.clock >= this.consoleAt; }
  pressConsole() {
    if (!this.consoleReady()) return;
    this.consoleAt = this.clock + 7;
    Object.assign(this.laser, { shots: ['high'], t: 0, phase: '', done: false, hers: true, hitThem: false });
    Sound.tone(300, 0.1, 'square', 0.02); Sound.tone(600, 0.08, 'square', 0.015);
  }
  // is a point (the creator) inside a rig's view, nothing solid between
  pointSeen(ox, oy, angle, half, range, qx, qy) {
    const dx = qx - ox, dy = qy - oy, d = Math.hypot(dx, dy); if (d > range) return false;
    const diff = ((Math.atan2(dy, dx) * 180 / Math.PI - angle) % 360 + 540) % 360 - 180; if (Math.abs(diff) > half) return false;
    for (let s = 3; s < d - 1; s += 0.5) if (this.solidPx(ox + dx / d * s, oy + dy / d * s)) return false;
    return true;
  }
  // a light in their eyes: an opening, like the flash
  blindCreator() {
    const c = this.cr;
    if (!['idle', 'windHi', 'windLo', 'raise', 'recover', 'hop'].includes(c.st)) return false;
    c.st = 'flinch'; c.t = 1.3; Sound.tone(700, 0.2, 'triangle', 0.02, 350);
    return true;
  }
  fireLaser() {
    const order = []; for (let i = 0; i < 3; i++) { let s = Math.random() < 0.5 ? 'low' : 'high'; if (i >= 2 && order[i - 1] === s && order[i - 2] === s) s = s === 'low' ? 'high' : 'low'; order.push(s); }
    this.laser.shots = order; this.laser.t = 0; this.laser.phase = ''; this.laser.done = false;
    Sound.tone(300, 0.1, 'square', 0.02);
  }
  endTraps() { this.laser.shots = []; this.laser.done = false; this.cams.forEach(cm => { cm.aim = null; cm.clicks = 0; cm.warn = false; cm.cone = null; }); }
  lightsOff() { this.dark = true; Sound.tone(80, 0.5, 'sawtooth', 0.04, 40); Sound.noise(0.2, 0.05, 1200); this.cams.forEach((cm, i) => { cm.next = 2.4 + i * 1.6; }); }
  lightsOn() { this.dark = false; }

  // ------------------------------------------------------------------ review and the door
  skipAhead() {
    if (this.dead || this.leaving) return;
    const k = this.kid;
    if (this.mode === 'walk') { const x = this.skipPoints.find(p => p > k.x + 12); if (x != null) this.placeAt(x); return; }
    if (this.mode === 'toss') {
      // the train is fixed: N says its next line, and only throws the sword once the train has
      // reached [A SWORD CLATTERS]; with the sword in hand, N moves on through her last lines
      const lineUp = this.lineT > 0 || this.queue.some(q => !q.cb);
      if (this.sword.have || (this.train && this.queue.some(q => q.on))) { if (lineUp) { this.lineT = 0; this.nextLine(); } return; }
      if (this.sword.fly) { this.sword.fly.t = 1; return; }
      if (this.sword.floor) { k.x = this.sword.floor.x - 4; this.pickUp(); } else this.throwSword();
      return;
    }
    if (this.mode === 'fight') { const c = this.cr; const to = ROUND_AT.find(v => v < c.hp); const n2 = c.hp - (to != null ? to : 0); for (let i = 0; i < n2 - 1; i++) c.hp--; c.open = true; c.st = 'recover'; this.hitCreator(); return; }
    if (this.mode === 'yield') { this.queue = this.queue.filter(q => q.cb); this.lineT = 0.01; return; }
    if (this.mode === 'giveup') { this.shutterOpen = 1; this.shutterProp.solid = false; }
    if (this.mode === 'after' || this.mode === 'giveup') this.placeAt(LEVEL.door.x + 4);
  }
  enterDoor() {
    if (this.leaving || (this.mode !== 'after' && this.mode !== 'giveup')) return;
    if (this.mode === 'giveup' && this.shutterProp.solid) return;
    this.leaving = true;
    // she leaves the creator alive (a yield, or walking past the one who gave up): spared
    if (this.mode === 'after' || this.cr.hp > 0) { state.storySet('spared', true); state.storySet('killedBroken', false); state.finish(this.epId); }
    Sound.tone(660, 0.12, 'triangle', 0.03); Sound.tone(880, 0.16, 'triangle', 0.025);
    this.cameras.main.fadeOut(450, 255, 255, 255);
    this.time.delayedCall(480, () => { if (!goNext(this, 'ep5b')) this.scene.start('moon', { at: 'playroom' }); });
  }

  // ------------------------------------------------------------------ drawing
  draw(dt) {
    const t = this.clock, c = this.cr, k = this.kid;
    this.drawGirl();
    const g = this.setG; g.clear();
    // the stage door behind her, the shutter ahead
    if (this.gateProp.solid) { g.fillStyle(n(H.steelLo), 1); g.fillRect(LEVEL.gate.x, 34, LEVEL.gate.w, G - 34); g.fillStyle(n(H.tape), 1); for (let y = 40; y < G; y += 12) g.fillRect(LEVEL.gate.x, y, LEVEL.gate.w, 4); }
    const SH = LEVEL.shutter, up = this.shutterOpen || 0, sh = Math.round((G - 34) * (1 - up));
    g.fillStyle(n(H.steel), 1); g.fillRect(SH.x, 34, SH.w, sh); for (let y = 36; y < 34 + sh; y += 4) { g.fillStyle(n(H.steelLo), 1); g.fillRect(SH.x, y, SH.w, 1); }
    // the console's screen: a dot that walks across it, on and off
    const D = LEVEL.desk; if (Math.floor(t * 3) % 3) { g.fillStyle(n(H.glow), 1); g.fillRect(D.x + 9 + Math.round((t * 8) % 14), D.y - 6, 2, 1); }
    // ON AIR, lit while the cameras roll
    const onAir = this.mode === 'toss' || this.mode === 'fight' || this.mode === 'between' || ((this.mode === 'yield' || this.mode === 'giveup') && this.cr.tally);
    if (onAir) { g.fillStyle(n(H.red), 1); g.fillRect(30 * T - 13, 37, 34, 9); pixText(g, 'ON AIR', 30 * T - 10, 39, 0xebe6d8); }
    else pixText(g, 'ON AIR', 30 * T - 10, 39, n('#3a2f1f'));
    // the sword on the floor, or in the air
    const s = this.sword;
    if (s.floor) { g.fillStyle(n(H.blade), 1); g.fillRect(s.floor.x - 7, G - 2, 13, 1); g.fillStyle(n(H.bladeLo), 1); g.fillRect(s.floor.x - 7, G - 1, 13, 1); g.fillStyle(n(H.gold), 1); g.fillRect(s.floor.x + 6, G - 3, 1, 3); g.fillRect(s.floor.x + 7, G - 2, 3, 1); if (Math.floor(t * 3) % 3 === 0) { g.fillStyle(0xebe6d8, 1); g.fillRect(s.floor.x - 3, G - 3, 1, 1); } }
    const a = this.armG; a.clear();
    if (s.fly) {
      const f = s.fly, u = Math.min(1, f.t / 0.7), x = f.sx + (f.ex - f.sx) * u, y = f.sy + (G - 2 - f.sy) * u - Math.sin(u * Math.PI) * 34, r = Math.round(u * 10) * Math.PI / 4;
      a.lineStyle(1, n(H.blade), 1); a.lineBetween(Math.round(x - Math.cos(r) * 7), Math.round(y - Math.sin(r) * 7), Math.round(x + Math.cos(r) * 7), Math.round(y + Math.sin(r) * 7));
    }
    // the creator's sword arm and blade (none once they have dropped it)
    if (c.unarmed) { /* empty hands */ }
    else if (c.st !== 'yield' || c.pose !== 'kneel') {
      const b = this.blade();
      a.lineStyle(2, n(H.coat), 1); a.lineBetween(b.sx, b.sy, b.hx, b.hy);
      a.fillStyle(n(H.skin), 1); a.fillRect(Math.round(b.hx) - 1, Math.round(b.hy) - 1, 2, 2);
      a.lineStyle(1, n(H.blade), 1); a.lineBetween(b.hx, b.hy, b.tx, b.ty);
      a.fillStyle(n(H.gold), 1); a.fillRect(Math.round(b.hx) - 1, Math.round(b.hy), 3, 1);
      // a glint at the tip while they wind up: high or low
      if ((c.st === 'windHi' || c.st === 'windLo' || c.st === 'raise') && Math.floor(t * 12) % 2 === 0) { a.fillStyle(0xebe6d8, 1); a.fillRect(Math.round(b.tx) - 1, Math.round(b.ty) - 1, 2, 2); }
    } else { a.fillStyle(n(H.blade), 1); a.fillRect(c.x + 4, G - 1, 14, 1); }
    // the red light on the creator's headset: on air
    { const hd = POSES[c.pose].head, lx = Math.round(c.face > 0 ? c.x - 7 + hd[0] : c.x - 7 + 13 - hd[0]), ly = G - 26 + hd[1] + 4;
      if (c.tally) { a.fillStyle(n(H.red), 1); a.fillRect(lx, ly, 1, 1); if (Math.floor(t * 2) % 2) a.fillRect(lx, ly - 1, 1, 1); } else { a.fillStyle(n(H.band), 1); a.fillRect(lx, ly, 1, 1); } }
    // her sword: held up and forward, or mid swing with one trailing line
    if (s.have && this.girl.visible && !this.dead) {
      const cx = k.x + k.w / 2 + k.face * 2, cy = k.y + (k.crouch ? 4 : 7);
      const ang = s.swing >= 0 ? -120 + Math.min(1, s.swing / 0.14) * 150 : -50;
      const r = (k.face > 0 ? ang : 180 - ang) * Math.PI / 180, tx = cx + Math.cos(r) * 10, ty = cy + Math.sin(r) * 10;
      if (s.swing >= 0 && s.swing < 0.18) { const aa = -120 + Math.min(1, Math.max(0, s.swing - 0.04) / 0.14) * 150, rr = (k.face > 0 ? aa : 180 - aa) * Math.PI / 180; a.lineStyle(1, n(H.bladeLo), 1); a.lineBetween(Math.round(cx + Math.cos(rr) * 6), Math.round(cy + Math.sin(rr) * 6), Math.round(cx + Math.cos(rr) * 11), Math.round(cy + Math.sin(rr) * 11)); }
      a.lineStyle(1, n(H.blade), 1); a.lineBetween(cx, cy, tx, ty);
      a.fillStyle(n(H.gold), 1); a.fillRect(Math.round(cx) - 1, Math.round(cy), 2, 1);
    }
    this.lightL.begin(this.view.x);
    this.drawTraps(t);
    this.lightL.end();
    this.drawDarkness();
    this.drawLock();
    this.drawHud();
    this.drawThings();
  }

  drawTraps(t) {
    const g = this.trapG, tg = this.tellG, L = this.lightL, c = this.cr; g.clear(); tg.clear();
    const red = n(this.P.hazard), RED = this.P.hazard, seeing = this.gl.showing;
    // the searchlight: a real light, a checker of warm light, red as it locks
    if (this.lamp.cone) L.poly(this.lamp.cone, this.lamp.lock > 0 ? RED : H.work, 'checker');
    if (this.lamp.warm && Math.floor(t * 12) % 2 === 0) { const LV = LEVEL.lamp; g.fillStyle(n(H.work), 1); g.fillRect(LV.x - 2, LV.y + 1, 5, 3); }
    // the laser: emitters blink, the glasses show which height, then the beam
    const Z = this.laser, LZ = LEVEL.lasers;
    if (Z.shots.length) {
      const y = Z.shot === 'low' ? LZ.lo : LZ.hi, w = LZ.x1 - LZ.x0, f = Z.t;
      if (f < 0.75 && Math.floor(f * 10) % 2 === 0) { g.fillStyle(red, 1); g.fillRect(LZ.x0 - 2, y - 1, 3, 3); g.fillRect(LZ.x1 - 1, y - 1, 3, 3); g.fillRect(LZ.x0 + 1, y, 6, 1); g.fillRect(LZ.x1 - 7, y, 6, 1); }
      if (f < 0.75 && seeing) { tg.fillStyle(n(this.P.overlay), 1); for (let x = LZ.x0 + Math.floor(t * 40) % 6; x < LZ.x1; x += 6) tg.fillRect(x, y, 2, 1); }
      else if (f >= 0.75 && f < 1.2) { L.rect(LZ.x0, y, w, 1, RED, f < 0.97 ? 'q25' : 'checker'); g.fillStyle(red, 1); g.fillRect(LZ.x0 - 2, y - 2, 3, 4); g.fillRect(LZ.x1 - 1, y - 2, 3, 4); }
      else if (f >= 1.2 && f < 1.5) { g.fillStyle(red, 1); g.fillRect(LZ.x0, y - 1, w, 3); g.fillStyle(n(this.P.hazardCore), 1); g.fillRect(LZ.x0, y, w, 1); }
    }
    // the creator's lunge, through the glasses: where the blade will pass
    if (seeing && (c.st === 'windHi' || c.st === 'windLo')) {
      const y = c.st === 'windHi' ? G - 12 : G - 3, x0 = c.face > 0 ? c.x + 6 : ARENA.x0 + 12, x1 = c.face > 0 ? ARENA.x1 - 12 : c.x - 6;
      tg.fillStyle(n(this.P.overlay), 1); for (let x = x0 + Math.floor(t * 30) % 5; x < x1; x += 5) tg.fillRect(x, y, 2, 1);
    }
    // the flash cameras: an LED, the cone the glasses see while they click, the flash itself
    if (this.cr.round === 2 && (this.mode === 'fight' || this.mode === 'between')) this.cams.forEach(cm => {
      if (cm.cone && cm.warn && seeing && Math.floor(t * 16) % 2 === 0) L.poly(cm.cone, RED, 'q25');
      const ledOn = cm.warn ? Math.floor(t * 16) % 2 === 0 : Math.floor(t * 1.5) % 2 === 0;
      if (ledOn) { tg.fillStyle(red, 1); tg.fillRect(cm.x - 3, cm.y - 2, 1, 1); }
      if (cm.flash > 0.45 && cm.cone) { L.poly(cm.cone, '#ebe6d8', (cm.lit == null ? 1 : cm.lit) * fx.level > 0.5 ? 'checker' : 'q25'); g.fillStyle(0xebe6d8, 1); g.fillRect(cm.x - 2, cm.y, 5, 4); }
    });
  }
  drawLock() {
    const fx = this.fxG; fx.clear();
    this.strikeFx.update(this.game.loop.delta / 1000);
    const L = this.lamp; if (L.lock > 0 && !this.dead) { const k = this.kid, r = 9 - Math.min(1, L.lock / LEVEL.lamp.lock) * 7, cx = k.x + k.w / 2, cy = k.y + k.h / 2; fx.lineStyle(1, n(this.P.hazard), 1); fx.strokeRect(Math.round(cx - 4 - r), Math.round(cy - 4 - r), Math.round(8 + 2 * r), Math.round(8 + 2 * r)); }
  }
  // Lights off: solid dark with hard holes where there is light (her, the console, the creator).
  // A flash lights the whole stage for its moment.
  drawDarkness() {
    const D = this.darkL, flash = Math.max(0, ...this.cams.map(cm => cm.flash * (cm.lit == null ? 1 : cm.lit) * fx.level));
    D.begin(this.view.x);
    if (this.dark && flash < 0.45) {
      const k = this.kid, c = this.cr, holes = [{ x: LEVEL.desk.x + 17, y: LEVEL.desk.y - 9, r: 16 }, { x: c.x, y: G - 16, r: 9 }];
      if (this.girl.visible) holes.push({ x: k.x + k.w / 2, y: k.y + 6, r: 24 });
      D.dark('#0e0f12', holes);
    }
    D.end();
  }
  // the creator's HP, as part of the show's paperwork: a slip at the top of the picture, a box
  // for each of the nine. A box empties from the top when a hit drains it.
  drawHud() {
    const g = this.hudG, P = this.P, col = n(P.overlay); g.clear();
    this.gl.drawMeter(g, 18, 166, col);
    if (this.mode === 'walk' || this.done) return;
    if (this.gl.on) this.gl.drawStatic(g, col);
    if (['fight', 'between', 'toss', 'giveup', 'yield'].includes(this.mode)) {
      const c = this.cr, label = 'CREATOR', lw = ccWidth(label), w = 4 + lw + 6 + HP * 7 + 3, x = 6, y = 5, ink = 0x0e0f12; // top left: the TV's own tags sit top right
      g.fillStyle(ink, 1); g.fillRect(x - 1, y - 1, w + 2, 13);
      g.fillStyle(0xebe6d8, 1); g.fillRect(x, y, w, 11);
      g.fillStyle(0xb8b2a3, 1); g.fillRect(x + 1, y + 10, w - 2, 1);
      ccText(g, label, x + 4, y + 2, ink);
      const drainU = c.drain > 0 ? c.drain / DRAIN : 0;
      for (let i = 0; i < HP; i++) {
        const bx = x + 4 + lw + 6 + i * 7, by = y + 2;
        g.fillStyle(ink, 1); g.fillRect(bx, by, 5, 1); g.fillRect(bx, by + 6, 5, 1); g.fillRect(bx, by, 1, 7); g.fillRect(bx + 4, by, 1, 7);
        // full, empty, or the one draining: its ink sinks a pixel row at a time
        const fill = i < c.hp ? 5 : i === c.hp && drainU > 0 ? Math.ceil(5 * drainU) : 0;
        if (fill > 0) g.fillRect(bx + 1, by + 6 - fill, 3, fill);
        if (c.flash > 0 && i === c.hp) { g.fillStyle(0xe3412b, 1); g.fillRect(bx + 1, by + 1, 3, 5); g.fillStyle(ink, 1); }
      }
    }
  }

  hint() {
    if (this.leaving || this.done) return;
    if (this.mode === 'walk') return overlay.hint(this.kid.x < 4 * T ? 'J looks at things.' : '');
    if (this.mode === 'toss') return overlay.hint(this.sword.floor ? 'The sword. J picks it up.' : '');
    if (this.mode === 'fight') return overlay.hint(['K swings. Hit them right after they attack. High lunge: crouch. Low: jump. Hide from the light.', 'Laser: high beep, crouch. Low beep, jump. J at the desk fires it at them.', 'Two clicks, then a flash. Get under the desk or behind a crate.'][this.cr.round]);
    // the way out: the pink door is off screen past the stage until she nears it
    const near = Math.abs(this.kid.x + this.kid.w / 2 - (LEVEL.door.x + LEVEL.door.w / 2)) < 60, out = near ? 'The playroom. W or J.' : 'The pink door, past the stage.';
    if (this.mode === 'giveup') return overlay.hint(this.cr.hp > 0 ? 'They will not fight. K hits. The shutter is open.' : out);
    if (this.mode === 'after') return overlay.hint(out);
    overlay.hint('');
  }
}
