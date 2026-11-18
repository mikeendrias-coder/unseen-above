// Small sprites: the girl, the bodies she leaves, drones, glints.
// Nov 17 final pass (docs/ART_DIRECTION.md sections 2 to 4): chunky Jump King style frames, flat
// colors from ASH only, max three tones a material, and a 1 px ash0 outline worked out from the
// shape (never drawn by hand). She is 8 x 14 inside the outline; textures are 10 x 15 with no
// outline under her feet, so origin (0.5, 1) still stands her exactly on the floor.
import { Painter } from './painter.js';
import { ASH } from './palettes.js';

const INK = {
  H: ASH.ash2, h: ASH.ash3,           // hair
  f: ASH.bone, e: ASH.ash0,           // face, eye
  s: ASH.ash4,                        // scarf
  J: ASH.boneLo, j: ASH.bone, d: ASH.ash5, // jacket: base, lit, shade
  t: ASH.ash3, b: ASH.ash1            // trousers, boots
};

// Facing right. Rows 0 to 9 are the top half, 10 to 13 the legs.
const HEAD = ['..HHHh..', '.HHHHHh.', '.HHHfff.', '.HHffef.', '..Hfff..', '..ssss..'];
const TORSO = {
  rest: ['.JJjjJ..', '.JJjjJJ.', '.dJjjJf.', '.dJJJJ..'],
  fwd: ['.JJjjJ..', '.JJjjJJ.', '.dJjjJJ.', '.dJJJJf.'],   // hand forward
  back: ['.JJjjJ..', 'fJJjjJJ.', '.dJjjJ..', '.dJJJJ..'],  // hand back
  up: ['.JJjjJf.', '.JJjjJJ.', '.dJjjJ..', '.dJJJJ..']     // arm up (jumping)
};
const LEGS = {
  stand: ['..tttt..', '..tt.tt.', '..tt.tt.', '..bb.bbb'],
  runA: ['..tttt..', '.tt..tt.', 'tt....tt', 'b......b'],
  runB: ['..ttt...', '..ttt...', '..t.tt..', '.bb..bb.'],
  runC: ['..tttt..', '.ttt.tt.', '.t....tt', 'bb.....b'],
  runD: ['...ttt..', '...tt...', '...ttt..', '..bb.b..'],
  rise: ['..tttt..', '..tt.tt.', '..bb.tt.', '.....bb.'],
  fall: ['..tttt..', '.tt..tt.', '.tt..tt.', '.b....b.']
};
// a tuck for the double jump: knees up, arms out
const TUCK = ['........', '........', '..HHHh..', '.HHHHHh.', '.HHHfff.', '.HHffef.', '..sfff..', 'fJJjjJJf', '.JJjjJJ.', '.dJJJJ..', '.tttttt.', '.tt..tt.', '.bb..bb.', '........'];
// wall slide, the wall on her right: she looks back into the room, a hand and a foot on the wall
const WALL = ['..hHHH..', '.hHHHHH.', '.fffHHH.', '.fefHHH.', '..fffH..', '..ssss.f', '..JjjJJf', '.JJjjJJ.', '.JJjjJd.', '..JJJJd.', '..tttt..', '..tt.tt.', '..tt..tt', '..bb...b'];
const CROUCH = ['..HHHh..', '.HHHHHh.', '.HHffef.', '..sfff..', '.JJjjJJ.', 'JJJjjJJ.', '.dJJJJf.', '.tttttt.', '.bb..bbb'];

const frame = (top, torso, legs, bob) => { const rows = HEAD.concat(TORSO[torso], LEGS[legs]); return bob ? ['........'].concat(rows.slice(0, 13)) : rows; };
export const GIRL_FRAMES = {
  girl_stand: frame(HEAD, 'rest', 'stand'),
  girl_pass: frame(HEAD, 'back', 'runB', 1),
  girl_run0: frame(HEAD, 'back', 'runA'), girl_run1: frame(HEAD, 'rest', 'runB', 1),
  girl_run2: frame(HEAD, 'fwd', 'runC'), girl_run3: frame(HEAD, 'rest', 'runD', 1),
  girl_jump: frame(HEAD, 'up', 'rise'), girl_fall: frame(HEAD, 'up', 'fall'),
  girl_tuck: TUCK, girl_wall: WALL
};

// A grid of inks, then an ash0 outline on every empty cell that touches the shape (4 ways),
// except under the bottom row (her feet stand on the floor).
function outlined(rows, ink, pad) {
  const w = rows[0].length + 2, h = rows.length + (pad ? 2 : 1), g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(null));
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') g[y + 1][x + 1] = ink[r[x]] || r[x]; });
  const out = g.map(r => r.slice());
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx])) out[y][x] = ASH.ash0;
  return out;
}
function paintGrid(p, grid, ox, oy) { grid.forEach((r, y) => r.forEach((c, x) => { if (c) p.px(ox + x, oy + y, c); })); }

// Her body from an earlier take, lying on her side, head to the left. Later stages read as older
// remains (greyer, flatter, then ash and a few bones); nothing gory. Draws into p with its feet
// line at y (the floor) starting at x. Same signature as before (art/bedroom.js uses it).
const AGE = [
  null,
  { H: ASH.ash3, h: ASH.ash3, f: ASH.boneLo, j: ASH.boneLo, J: ASH.ash5, d: ASH.ash4, s: ASH.ash4, t: ASH.ash3, b: ASH.ash2 },
  { H: ASH.ash4, h: ASH.ash4, f: ASH.boneLo, j: ASH.ash5, J: ASH.ash4, d: ASH.ash4, s: ASH.ash4, t: ASH.ash4, b: ASH.ash3, e: ASH.ash3 }
];
export function lyingFigure(p, P, x, y, stage) {
  y -= 1; // y is the floor line; she lies on the row above it
  const src = GIRL_FRAMES.girl_stand, n = src.length; // 14 rows become 14 columns
  if (stage <= 2) {
    // turn the standing frame onto its side: row r becomes column r, column c becomes row c
    const ink = Object.assign({}, INK, AGE[stage] || {}), rows = [];
    for (let c = 0; c < 8; c++) { let s = ''; for (let r = 0; r < n; r++) s += src[r][7 - c] || '.'; if (/[^.]/.test(s)) rows.push(s); }
    const flat = stage === 2 ? rows.slice(2) : rows; // older bodies sink: the top rows go flat
    const grid = outlined(flat, ink, false), top = y - grid.length + 1;
    paintGrid(p, grid, x - 1, top);
    if (stage >= 1) for (let i = 0; i < 5 + stage * 3; i++) p.px(x + 1 + ((i * 7) % 14), top + 1 + (i % 2), ASH.ash5);
    if (stage === 2) { p.px(x + 2, y - 3, ASH.bone); for (let i = 0; i < 3; i++) p.px(x + 7 + i * 2, y - 2, ASH.bone); }
    return;
  }
  // a low heap of ash, a skull and a few bones
  p.rect(x - 1, y - 2, 18, 2, ASH.ash4); p.rect(x, y - 3, 15, 1, ASH.ash5); p.rect(x - 2, y, 21, 1, ASH.ash3);
  p.rect(x + 1, y - 5, 3, 3, ASH.bone); p.px(x + 2, y - 4, ASH.ash0); p.px(x + 1, y - 2, ASH.boneLo);
  [6, 9, 12].forEach(i => p.rect(x + i, y - 3, 2, 1, ASH.boneLo)); p.rect(x + 14, y - 1, 4, 1, ASH.bone);
}

// What a side scene shows for her this frame. k is the controller state (core/side.js); t a clock.
// Every side scene can use it (core/side.js drawGirl picks the four old keys on its own).
export function girlFrame(k, t) {
  if (k.crouch) return { tex: 'girl_crouch' };
  if (!k.onGround) {
    if (k.wall && k.vy > 0) return { tex: 'girl_wall', flip: k.wall < 0 };
    if (k.airJumps === 0 && k.vy < 40) return { tex: 'girl_tuck' };
    return { tex: k.vy < 0 ? 'girl_jump' : 'girl_fall' };
  }
  if (k.walkT > 0) return { tex: 'girl_run' + (Math.floor(k.walkT * 10) % 4) };
  return { tex: 'girl_stand' };
}

// Made once: rebuilding a texture that a sleeping scene still shows would break it.
let madeFor = null;
export function makeSprites(scene, P) {
  if (madeFor === 'v2' && scene.textures.exists('girl_run3')) return;
  madeFor = 'v2';
  const add = (key, w, h, draw) => { const p = new Painter(w, h); draw(p); p.toTexture(scene, key); };
  Object.entries(GIRL_FRAMES).forEach(([key, rows]) => add(key, 10, 15, p => paintGrid(p, outlined(rows, INK), 0, 0)));
  add('girl_crouch', 10, 10, p => paintGrid(p, outlined(CROUCH, INK), 0, 0));
  for (let s = 0; s < 4; s++) add('body' + s, 28, 9, p => lyingFigure(p, P, 6, 9, s));
  // drones: grey body, white rotors, one red eye (they watch her)
  const drone = (key, blade) => add(key, 13, 8, p => {
    const rows = blade ? ['bbb.....bbb', '.d.......d.', '.ddddddddd.', '..dDDDDDd..', '....drd....'] : ['.b.......b.', '.d.......d.', '.ddddddddd.', '..dDDDDDd..', '....drd....'];
    paintGrid(p, outlined(rows, { b: ASH.boneLo, d: ASH.ash3, D: ASH.ash4, r: ASH.red }, true), 0, 0);
  });
  drone('drone_a', true); drone('drone_b', false);
  // a gold glint: a hard plus, no scaling, no blending
  add('sparkle', 5, 5, p => { p.px(2, 0, ASH.goldHi); p.px(2, 4, ASH.goldHi); p.px(0, 2, ASH.goldHi); p.px(4, 2, ASH.goldHi); p.rect(1, 2, 3, 1, ASH.bone); p.rect(2, 1, 1, 3, ASH.bone); });
  add('dot', 1, 1, p => p.px(0, 0, ASH.bone));
  add('dot2', 2, 2, p => p.rect(0, 0, 2, 2, ASH.bone));
}
