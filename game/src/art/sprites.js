// Small sprites drawn per look: the girl, the bodies she leaves, drones, sparkles.
import { Painter } from './painter.js';

const GIRL_TOP = ['...hhh..', '..hhhhh.', '.hhkkkk.', 'hhhkkkk.', 'h..kkk..', '..ssss..', '.kkkkkk.', '.kkkkkk.', '.kkkkkk.', '..kkkk..'];
const LEGS = {
  stand: ['..kk.kk.', '..kk.kk.', '..ss.ss.', '..ss.ss.'],
  pass: ['...kkk..', '...kkk..', '...kkk..', '...sss..'],
  jump: ['..kkkk..', '.kk..kk.', '.ss..ss.', '........']
};
const CROUCH = ['..hhhh..', '.hhkkkk.', 'hhhkkkk.', '..ssss..', '.kkkkkk.', 'kkkkkkk.', '.kkkkkk.', '.kk..kk.', '.ss..ss.'];

function rows(p, list, ox, oy, map) { list.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') p.px(ox + i, oy + j, map[r[i]]); }); }

export function lyingFigure(p, P, x, y, stage) {
  // Later stages read as older remains; nothing gory.
  if (stage === 0) { p.rect(x, y - 4, 3, 3, P.hair); p.circle(x + 4, y - 3, 2, P.kid); p.rect(x + 6, y - 5, 8, 4, P.kid); p.rect(x + 14, y - 4, 6, 3, P.kidLo); }
  else if (stage === 1) { p.rect(x, y - 4, 3, 3, P.kidLo); p.circle(x + 4, y - 3, 2, P.kidLo); p.rect(x + 6, y - 5, 8, 4, P.kidLo); p.rect(x + 14, y - 4, 6, 3, P.kidLo); for (let i = 0; i < 6; i++) p.px(x + 5 + i * 2, y - 5 - (i % 2), P.dust); }
  else if (stage === 2) { p.rect(x - 1, y - 6, 23, 5, P.dust); p.circle(x + 4, y - 4, 2, P.bone); p.px(x + 4, y - 4, P.dust); for (let i = 0; i < 4; i++) p.rect(x + 8 + i * 2, y - 5, 1, 3, P.bone); p.rect(x + 16, y - 3, 5, 1, P.bone); }
  else { p.rect(x - 2, y - 2, 26, 2, P.dust); p.circle(x + 4, y - 3, 2, P.bone); for (let i = 0; i < 3; i++) p.px(x + 9 + i * 3, y - 3, P.bone); p.rect(x + 17, y - 2, 4, 1, P.bone); }
}

// Made once per look: rebuilding a texture that a sleeping scene still shows would break it.
let madeFor = null;
export function makeSprites(scene, P) {
  if (madeFor === P.name && scene.textures.exists('girl_stand')) return;
  madeFor = P.name;
  const add = (key, w, h, draw) => { const p = new Painter(w, h); draw(p); p.toTexture(scene, key); };
  const map = { h: P.hair, k: P.kid, s: P.kidLo };
  add('girl_stand', 8, 14, p => { rows(p, GIRL_TOP, 0, 0, map); rows(p, LEGS.stand, 0, 10, map); });
  add('girl_pass', 8, 14, p => { rows(p, GIRL_TOP, 0, 0, map); rows(p, LEGS.pass, 0, 10, map); });
  add('girl_jump', 8, 14, p => { rows(p, GIRL_TOP, 0, 0, map); rows(p, LEGS.jump, 0, 10, map); });
  add('girl_crouch', 8, 9, p => rows(p, CROUCH, 0, 0, map));
  for (let s = 0; s < 4; s++) add('body' + s, 28, 8, p => lyingFigure(p, P, 3, 8, s));
  const drone = (key, blade) => add(key, 11, 6, p => {
    const r = P.colLo; if (blade) { p.rect(0, 0, 3, 1, r); p.rect(8, 0, 3, 1, r); } else { p.px(1, 0, r); p.px(9, 0, r); }
    p.px(1, 1, P.device); p.px(9, 1, P.device); p.rect(1, 2, 9, 2, P.device); p.rect(3, 2, 5, 1, P.colLo); p.rect(4, 4, 3, 1, P.device); p.px(5, 4, P.glassLit);
  });
  drone('drone_a', true); drone('drone_b', false);
  add('sparkle', 5, 5, p => { p.px(2, 0, P.goldHi); p.px(2, 4, P.goldHi); p.px(0, 2, P.goldHi); p.px(4, 2, P.goldHi); p.rect(1, 2, 3, 1, P.glint); p.rect(2, 1, 1, 3, P.glint); });
  add('dot', 1, 1, p => p.px(0, 0, '#ffffff'));
  add('dot2', 2, 2, p => p.rect(0, 0, 2, 2, '#ffffff'));
}
