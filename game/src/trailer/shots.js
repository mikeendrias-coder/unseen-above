// The trailer's shot list, in order. Each shot has a length in seconds (the musical sections are
// counted in bars of their piece), and either a card (cards.js) or a scene: [key, data] started a
// moment early and hidden, then cut to. A shot can stage its scene as it is created (stage), when
// it is cut to (onShow), every frame (frame), at times (at), and carry subtitles (subs: [t, who,
// text, seconds]) in the game's own words (data/dialogue.js). keep: true stages the scene already
// on screen instead of starting it again. music: a piece (core/music.js) started on the cut, null
// stops it. Every line of dialogue and every form shown is the game's own.
import { RIDGE, HALL_IN, HALL_TOSS, BEDROOM, PLAYROOM } from '../data/dialogue.js';
import { state } from '../core/state.js';
import { CREST, ridgeY } from '../art/title.js';

const T = 16;
const bar = bpm => 240 / bpm;               // one bar of 4/4, in seconds
const GB = bar(96), RB = bar(150), BB = bar(132), MB = bar(112), SB = bar(128), OB = bar(60), DB = bar(120);
const safe = on => { window.__noDeath = !!on; };
// put her standing at x on the floor whose top is at y (or keep her height), still, and the
// camera on her at once
function place(sc, x, floorY) {
  const k = sc.kid; k.x = x; if (floorY != null) { k.h = 14; k.crouch = false; k.y = floorY - k.h; }
  k.vx = 0; k.vy = 0; k.peakY = k.y; k.onGround = floorY != null; k.face = 1;
  snap(sc); bare(sc);
}
// no key prompts over things to use or look at: the trailer presses nothing a viewer would
function bare(sc) { sc.things = []; sc.lookable = () => false; }
// a closer camera: the game's own pixel zoom times z (whole numbers keep every pixel square)
function zoom(sc, z) { const S = sc.sys.game.config && window.__unseen ? window.__unseen.display.S : 4; sc.cameras.main.setZoom(S * z); }
// the camera on a point the shot chooses, every frame, after the scene has moved its own camera
function aim(sc, at) {
  const sys = sc.sys, own = sys.sceneUpdate;
  sys.sceneUpdate = function (...a) { own.apply(this, a); const [x, y] = at(sc); sc.cameras.main.centerOn(Math.round(x), Math.round(y)); };
}
const between = sc => [(sc.kid.x + sc.kid.w / 2 + sc.cr.x) / 2, sc.kid.y + sc.kid.h - 34];
function snap(sc) {
  const cam = sc.cameras.main; if (!cam._follow) return;
  cam.setLerp(1, 1); sc.time.delayedCall(120, () => cam.setLerp(0.15, 0.15));
}

// ---------------------------------------------------------------- music written for the trailer
// The siblings' theme (core/music.js THEME) over the game's own drums and bass, in the game's
// instruments: the opening's tune, driven. Used under the end cards.
const S = 16;
const THEME = [[0, 0, 76, 6], [0, 6, 74, 2], [0, 8, 72, 8], [1, 0, 71, 6], [1, 6, 72, 2], [1, 8, 69, 8], [2, 0, 72, 4], [2, 4, 71, 4], [2, 8, 69, 4], [2, 12, 67, 4], [3, 0, 69, 14]];
const AM = [[57, 60, 64], [53, 57, 60, 64], [48, 55, 60, 64], [52, 56, 59, 64]];
const rep = (a, n) => Array.from({ length: n }, () => a).flat();
const beat = (inst, pats, vel) => pats.flatMap((p, b) => [...p].flatMap((ch, i) => ch === '.' ? [] : [[b * S + i, inst, 60, 1, ch === 'X' ? vel * 1.5 : vel]]));
export const PIECES_EXTRA = {
  trailer: { bpm: 120, bars: 4, vol: 0.05, ev: [
    ...AM.flatMap((ch, b) => ch.map(m => [b * S, 'pad', m, 16, 0.7])),
    ...[45, 41, 48, 40].flatMap((m, b) => [0, 3, 6, 8, 11, 14].map(h => [b * S + h, 'bass', m, 1, 0.6])),
    ...THEME.map(([b, s, m, l]) => [b * S + s, 'keys', m, l, 0.7]),
    ...THEME.map(([b, s, m, l]) => [b * S + s, 'bell', m + 12, l, 0.25]),
    ...beat('kick', rep(['x.....x...x.....'], 4), 0.7),
    ...beat('snare', rep(['....x.......x...'], 4), 0.4),
    ...beat('hat', rep(['x.x.x.x.x.x.x.x.'], 4), 0.3)] }
};

// ---------------------------------------------------------------- the opening (the ridge)
const lineAt = i => { let t = 2.4; for (let j = 0; j < i; j++) t += 1.5 + RIDGE[j].text.length * 0.052; return t; };
const DRONE = (() => { let t = lineAt(RIDGE.length) + 0.4; t += 4.2 + 4 + 0.3; return t; })();

const shots = [
  // ---- cold open: the ridge, the lit house, a line of dialogue; the show's camera finds her
  { id: 'ridge', len: 7.2, scene: ['intro', {}], music: ['opening', { fadeIn: 2.5 }],
    onShow: sc => { sc.t = 1.7; },
    dim: t => Math.max(0, 1 - t / 1.4),
    subs: [[0.7, 'SISTER', RIDGE[0].text, 3.1], [3.8, 'BROTHER', RIDGE[1].text, 3.0]] },
  { id: 'ridge2', len: 6.0, keep: true,
    onShow: sc => { sc.t = lineAt(9) - 0.1; sc.curLine = undefined; zoom(sc, 2); aim(sc, () => [(CREST.bro + CREST.sis) / 2 + 2, ridgeY(CREST.sis) - 22]); },
    subs: [[0.1, 'SISTER', RIDGE[9].text, 3.1], [3.3, 'BROTHER', RIDGE[10].text, 2.7]] },
  { id: 'lockon', len: 4.4, keep: true,
    onShow: sc => { sc.t = DRONE - 0.7; zoom(sc, 3); aim(sc, () => [CREST.sis + 14, ridgeY(CREST.sis) - 14]); } },

  // ---- ONE GIRL. ONE HOUSE. EVERYONE WATCHING.
  { id: 'girl', len: 1.5, card: { kind: 'words', lines: ['ONE GIRL.'] }, music: null, stopGame: true, sound: S => { S.stamp(1.6); S.tone(55, 0.9, 'sine', 0.1, 40); } },
  { id: 'gate', len: 2.4, scene: ['grounds', {}], stage: sc => { safe(true); place(sc, 6 * T, 400); },
    frame: (sc, t, D) => D.keys.only('right') },
  { id: 'house', len: 1.5, card: { kind: 'words', lines: ['ONE HOUSE.'] }, stopGame: true, sound: S => { S.stamp(1.6); S.tone(55, 0.9, 'sine', 0.1, 40); } },
  { id: 'hall', len: 2.4, scene: ['gallery', {}], stage: sc => { safe(true); place(sc, 21 * T, 18 * T); },
    frame: (sc, t, D) => D.keys.only('right') },
  { id: 'watching', len: 1.8, card: { kind: 'words', lines: ['EVERYONE', 'WATCHING.'], red: [false, true], at: [0, 0.55] }, stopGame: true,
    sound: S => { S.stamp(1.6); S.tone(55, 0.9, 'sine', 0.1, 40); setTimeout(() => { S.stamp(1.8); S.tone(48, 1.2, 'sine', 0.12, 36); }, 550); } },
  // a searchlight finds her and the satellite fires from orbit; the body stays
  { id: 'strike', len: 2.8, scene: ['grounds', {}], stage: sc => { safe(true); place(sc, 36 * T, 400); sc.safeT = 0; },
    onShow: sc => { safe(false); sc.lights[0].u = 3.15 - 1.3; },
    frame: (sc, t, D) => { if (sc.kid.x > 500) walk(sc, t, D, -1); else D.keys.clear(); } },

  // ---- the title
  { id: 'title', len: 5.2, card: { kind: 'title' }, stopGame: true,
    sound: S => { S.swell(5, 0.09); S.tone(41, 2.8, 'sine', 0.16, 30); S.noise(1.4, 0.1, 380); } },

  // ---- episode 1: the grounds (the game's own grounds music, cut on its bars)
  { id: 'lawn', len: GB, scene: ['grounds', {}], music: 'grounds',
    stage: sc => { safe(true); place(sc, 27 * T, 400); sc.safeT = 0; sc.lights[0].u = 1.6; },
    at: [[0.1, D => D.chyron('EPISODE 1', 'The Grounds')]],
    frame: (sc, t, D) => { if (sc.kid.x < 36 * T - 4) walk(sc, t, D, 1); else D.keys.clear(); } },
  { id: 'climb', len: 2 * GB, scene: ['grounds', {}], at: [[0, D => D.chyron('EPISODE 1', 'The Grounds')], [1.3, D => D.chyron(null)]],
    stage: sc => { safe(true); place(sc, 36 * T + 10, 400); },
    frame: (sc, t, D) => climb(sc, t, D) },
  { id: 'filmed', len: GB, card: { kind: 'words', lines: ['EVERY TAKE', 'IS FILMED.'] } },
  { id: 'scan', len: 2 * GB, scene: ['grounds', {}],
    stage: sc => { safe(true); place(sc, 75 * T, 80); },
    frame: (sc, t, D) => { const k = sc.kid; if (sc.scan) sc.scan.x = Math.max(sc.scan.x, k.x - 64); if (t > 0.3) walk(sc, t, D, 1); } },

  // ---- episodes 2 to 4: the glasses, the east wing, the bedroom (the run's music)
  { id: 'glasses', len: 2 * RB, scene: ['gallery', {}], music: 'run',
    stage: sc => { safe(true); place(sc, 13 * T, 320); },
    at: [[0.1, D => D.chyron('EPISODE 2', 'The Gallery')], [0.4, (D, sc) => sc.giveGlasses && sc.giveGlasses()], [2.9, D => D.chyron(null)]] },
  { id: 'lasers', len: 3 * RB, scene: ['gallery', {}],
    stage: sc => {
      safe(true); sc.giveGlasses(); place(sc, 80 * T, 20 * T); zoom(sc, 2);
      Object.assign(sc.laserDef, { order: ['low', 'high', 'low', 'high'], first: 0.1, idle: 0.45 });
    },
    onShow: sc => { Object.assign(sc.laser, { awake: true, t: 0 }); },
    frame: (sc, t, D) => {
      const z = sc.laser, st = z.st, L = sc.laserDef, cyc = L.tell + L.charge + L.fire + L.idle, k = sc.kid;
      // where the next shot fires, and whether it is low (jump it) or high (duck under it)
      const n = Math.max(0, Math.floor((z.t - L.first) / cyc)), next = L.first + n * cyc + L.tell + L.charge, shot = L.order[n % L.order.length];
      const until = next - z.t;
      if (shot === 'low') { D.keys.only(); if (until < 0.16 && until > 0.08 && k.onGround) D.keys.tap('space', 340); }
      else if (until < 0.35 && until > -L.fire - 0.05) D.keys.only('down'); else D.keys.only();
    } },
  { id: 'eastwing', len: 2 * RB, scene: ['eastwing', {}],
    stage: sc => { safe(true); sc.pebbles = 5; sc.placeTile(21, 9); sc.kid.face = 'right'; zoom(sc, 2); bare(sc); },
    at: [[0.1, D => D.chyron('EPISODE 3', 'The East Wing')], [0.5, (D, sc) => sc.throwTo(24, 9)], [1.3, D => D.chyron(null)], [1.6, (D, sc) => sc.throwTo(22, 13)]] },
  { id: 'bodies', len: RB, card: { kind: 'words', lines: ['EVERY BODY', 'STAYS.'] } },
  { id: 'pile', len: 2 * RB, scene: ['grounds', {}],
    prep: () => { const e = state.episode('ep1'); e.take = 7; e.bodies = [[500, 1], [546, 2], [559, 3], [572, 4], [586, 5], [597, 6]].map(([x, take]) => ({ x, y: 400, take, cause: 'garden lamp' })); },
    stage: sc => { safe(true); place(sc, 30 * T + 2, 400); zoom(sc, 2); aim(sc, () => [552, 360]); },
    at: [[0.1, D => D.chyron('TAKE 7', '', true)]],
    frame: (sc, t, D) => { if (sc.kid.x < 36 * T) walk(sc, t, D, 1); else D.keys.only(); } },
  { id: 'flash', len: 2 * RB, scene: ['bedroom', {}],
    stage: sc => { safe(true); place(sc, 40 * T, 160); },
    at: [[0.1, D => D.chyron('EPISODE 4', 'The Bedroom')], [2.9, D => D.chyron(null)]],
    frame: (sc, t, D) => D.keys.only('right') },
  { id: 'collapse', len: 3 * RB, scene: ['bedroom', {}],
    stage: sc => { safe(true); place(sc, 59 * T - 6, 160); sc.pullBag(); },
    frame: (sc, t, D) => run(sc, t, D) },

  // ---- a breath: the bedroom, him
  { id: 'brother', len: 6.4, scene: ['bedroom', {}], music: ['bedroom', { fadeIn: 0.6 }],
    stage: sc => { safe(true); sc.goInside(true); sc.startTalk(8); zoom(sc, 2); aim(sc, () => [sc.kid.x + 4, sc.kid.y - 22]); },
    subs: [[0.3, 'BROTHER', BEDROOM[8].text, 3.6], [3.9, 'SISTER', BEDROOM[9].text, 2.4]] },

  // ---- the satellite: the request form, the globe
  { id: 'form1', len: 2 * bar(118) + 0.4, scene: ['satellite', { batch: 1 }], music: 'sat1',
    at: [[0.6, D => D.keys.tap('s')], [0.9, D => D.keys.tap('s')], [1.2, D => D.keys.tap('s')], [1.6, D => D.keys.tap('l')], [2.9, D => D.keys.tap('j')]] },
  { id: 'globe', len: 2 * bar(118), scene: ['satellite', { batch: 3, at: 0, formDone: true }],
    frame: (sc, t, D) => { if (t > 0.3 && t < 2.4) D.keys.only(Math.floor(t / 0.6) % 2 ? 'd' : 'w'); else D.keys.clear(); },
    at: [[2.6, (D, sc) => sc.skipAhead && sc.skipAhead()]] },
  { id: 'ticket', len: 2 * SB, scene: ['satellite', { batch: 4 }], music: null,
    at: [[0.5, D => D.keys.tap('s')], [0.8, D => D.keys.tap('s')], [1.1, D => D.keys.tap('s')], [1.4, D => D.keys.tap('l')], [2.6, D => D.keys.tap('j')]] },
  { id: 'who', len: 2.2, card: { kind: 'words', lines: ['WHO IS', 'WATCHING?'], at: [0, 0.6] }, stopGame: true, music: null },

  // ---- the reveal: a kids' game show on the Moon
  { id: 'kids', len: 11.5, scene: ['kids', {}], onShow: sc => { if (sc.t != null) sc.t = 1.2; } },

  // ---- episode 5: the Moon
  { id: 'moon', len: 4 * MB, scene: ['moon', {}], music: 'moon',
    stage: sc => { safe(true); place(sc, 44 * T, null); },
    at: [[0.1, D => D.chyron('EPISODE 5', 'The Moon')], [3.0, D => D.chyron(null)]],
    frame: (sc, t, D) => walk(sc, t, D, 1) },

  // ---- backstage: the creator, the fight (the game's fight music)
  { id: 'creator', len: 2 * BB, scene: ['hallway', {}], music: 'boss',
    stage: sc => { safe(true); place(sc, 20 * T + 14, null); },
    subs: [[0.15, 'CREATOR', HALL_IN[0].text, 3.4]] },
  { id: 'toss', len: 2 * BB, keep: true,
    onShow: sc => { sc.queue = []; sc.lineT = 0; sc.throwSword(); },
    subs: [[0.05, 'CREATOR', HALL_TOSS[2].text, 2.6]],
    at: [[1.0, (D, sc) => { if (sc.sword.floor) { sc.kid.x = sc.sword.floor.x - 4; sc.pickUp(); } }]] },
  { id: 'fight', len: 4 * BB, keep: true,
    onShow: sc => { sc.queue = []; sc.lineT = 0; sc.train = false; if (!sc.sword.have) { sc.sword.have = true; sc.sword.floor = null; sc.sword.fly = null; } sc.startRound(0); sc.cr.t = 0.4; zoom(sc, 2); aim(sc, between); },
    frame: (sc, t, D) => { if (sc.cr.hp <= 7) sc.cr.open = false; duel(sc, t, D); } },
  { id: 'dark', len: 2 * BB, keep: true,
    onShow: sc => { sc.queue = []; sc.lineT = 0; sc.cr.hp = 3; sc.cr.st = 'idle'; sc.startRound(2); sc.cams.forEach((cm, i) => { cm.next = 0.6 + i * 1.2; }); zoom(sc, 2); },
    at: [[2.4, (D, sc) => { sc.cr.open = true; }]],
    frame: (sc, t, D) => duel(sc, t, D) },

  // ---- a glimpse of the endings
  { id: 'endings', len: 2.0, card: { kind: 'words', lines: ['FIVE', 'ENDINGS.'], at: [0, 0.5] }, stopGame: true, music: null },
  { id: 'playroom', len: 4.2, scene: ['moon', { at: 'playroom', force: 'lookback' }],
    stage: sc => { safe(true); sc.startTalk(); },
    subs: [[0.5, 'KID', PLAYROOM[1].text, 3.4]] },
  { id: 'reply', len: 2.6, keep: true,
    onShow: sc => { sc.talking = false; sc.after = null; sc.startChoose(); },
    subs: [[0.0, 'KID', PLAYROOM[3].text, 2.6]],
    at: [[0.8, D => D.keys.tap('s', 80)], [1.6, D => D.keys.tap('s', 80)]] },
  { id: 'tv', len: 4.0, keep: true,
    onShow: sc => { sc.showLast('moon', 'vest'); if (sc.finale) sc.finale.t = 1.4; } },
  { id: 'channels', len: 4.4, keep: true,
    at: [[0.1, (D, sc) => sc.finale && sc.finale.flip(1)], [1.5, (D, sc) => sc.finale && sc.finale.flip(1)], [2.9, (D, sc) => sc.finale && sc.finale.flip(1)]] },

  // ---- the end cards
  { id: 'tagline', len: 4 * DB, card: { kind: 'tagline', lines: ['EVERYONE SEES HER.', 'NOBODY SEES THEM.'], stampAt: 2.0 }, stopGame: true, music: ['trailer', { fadeIn: 0.02 }],
    sound: S => { S.stamp(1.4); setTimeout(() => S.stamp(1.8), 2000); } },
  { id: 'form', len: 5 * DB, card: { kind: 'form', step: 0.5, stampAt: 3.6 },
    at: [[3.6, D => { D.Sound.stamp(2); D.Sound.tone(55, 0.9, 'sine', 0.1, 40); }]] },
  { id: 'black', len: 1.6, card: { kind: 'words', lines: [''] }, music: null, musicFade: 1.4 }
];

// ---------------------------------------------------------------- bots
// walk (or run) one way; hop whatever is in the way (a double jump when one is not enough).
// D.b is this shot's own scratch (the scene object outlives a shot).
function walk(sc, t, D, dir, run) {
  const k = sc.kid, b = D.b, key = dir > 0 ? 'right' : 'left';
  if (run) D.keys.only(key, 'shift'); else D.keys.only(key);
  const near = sc.boxHits(k.x + dir * 40, k.y, k.w, k.h), ahead = sc.boxHits(k.x + dir * 16, k.y - 2, k.w, k.h);
  b.still = k.onGround && Math.abs(k.vx) < 4 ? (b.still || 0) + 1 : 0;
  const edge = k.onGround && !sc.solidPx(k.x + k.w / 2 + dir * 9, k.y + k.h + 2) && !sc.solidPx(k.x + k.w / 2 + dir * 9, k.y + k.h + 20);
  if (k.onGround && (near || edge || b.still > 12) && (b.hop == null || t - b.hop > 0.35)) { D.keys.tap('space', 320); b.hop = t; }
  else if (!k.onGround && !k.wall && ahead && k.vy > -30 && k.airJumps > 0 && (b.dj == null || t - b.dj > 0.3)) { D.keys.tap('space', 240); b.dj = t; }
}
// up the gap between the hedge and the terrace wall: jump, then kick from wall to wall
function climb(sc, t, D) {
  const k = sc.kid, b = D.b;
  if (k.y + k.h <= 272 && k.onGround) return walk(sc, t, D, 1);
  if (k.onGround) { D.keys.only('right'); if (b.hop == null || t - b.hop > 0.3) { D.keys.tap('space', 320); b.hop = t; } return; }
  if (k.wall) {
    if (b.kick == null || t - b.kick > 0.14) { D.keys.tap('space', 170); b.kick = t; b.go = -k.wall; }
    return D.keys.only(b.go > 0 ? 'right' : 'left');
  }
  if (k.y < 266) return D.keys.only('right');
  D.keys.only((b.go || 1) > 0 ? 'right' : 'left');
}
// the fight: keep a sword's length from the creator, face them, swing
function duel(sc, t, D) {
  const k = sc.kid, c = sc.cr, b = D.b, d = c.x - (k.x + k.w / 2), want = 17;
  if (Math.abs(d) > want + 5) D.keys.only(d > 0 ? 'right' : 'left');
  else if (Math.abs(d) < want - 7) D.keys.only(d > 0 ? 'left' : 'right');
  else D.keys.only();
  if (Math.abs(d) <= want + 5) k.face = d > 0 ? 1 : -1;
  if (c.open || b.sw == null || t - b.sw > 0.55) { if (sc.sword.cool <= 0) { sc.swing(); b.sw = t; } }
  // a lunge low: jump it; high: duck
  if (c.st === 'lunge' && k.onGround) { if (c.hi) D.keys.only('down'); else if (b.j == null || t - b.j > 0.5) { D.keys.tap('space', 300); b.j = t; } }
}
// the floor going behind her: run, jump the rubble and the gaps, crouch under the slab
function run(sc, t, D) {
  const k = sc.kid, R = sc.run, L = { x: 1128, w: 34 };
  if (!sc.collapse) return D.keys.clear();
  const S = R && R.slab, under = k.x + k.w > L.x - 6 && k.x < L.x + L.w + 2;
  if (under && k.onGround && S && S.state !== 'fall') return D.keys.only('right', 'down');
  walk(sc, t, D, 1);
}

export const SHOTS = shots;
