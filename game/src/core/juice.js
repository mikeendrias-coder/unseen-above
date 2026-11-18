// Feel (Nov 18, research/features_nov17.md items 1 and 2): weight in her body, inside the art
// rules (docs/ART_DIRECTION.md section 2). Nothing here scales, tweens, glows or fades:
//   - one squash frame on landing and one stretch frame on a jump (sprite swaps, 12 x 13 and
//     10 x 17, made from her own frames by moving whole pixel rows and columns)
//   - square dust, 2 px, solid ash colors, short-lived, no alpha
//   - three landing sounds by height (sound.js land): a step, a thud, a crack
//   - a hit-stop (the scene freezes 60 to 90 ms) and a 1 to 2 px kick, only when she loses HP
//     or the strike hits her. The strike stays the biggest thing in the game.
//   - the take number taped to the floor where the take starts (TAKE 14), with a slate clack
//   - nothing else moves the view (fx.shake is quiet now, and a camera's own shake is off)
import { Sound } from './sound.js';
import { fx } from './fx.js';
import { ASH } from '../art/palettes.js';
import { ccText, ccWidth } from '../art/ccfont.js';

const hex = c => parseInt(c.slice(1), 16);
const SQUASH_MS = 70, STRETCH_MS = 80;
// frames the swap may replace (never a crouch, a tuck, a wall slide or a scripted pose)
const SWAP = /^girl_(stand|pass|run\d|jump|fall)$/;

// ---------------------------------------------------------------- squash and stretch frames
// Rows of a texture as arrays of [r, g, b, a] pixels.
function rowsOf(scene, key) {
  const src = scene.textures.get(key).getSourceImage(), w = src.width, h = src.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0);
  const d = x.getImageData(0, 0, w, h).data, rows = [];
  for (let y = 0; y < h; y++) { const r = []; for (let i = 0; i < w; i++) { const o = (y * w + i) * 4; r.push([d[o], d[o + 1], d[o + 2], d[o + 3]]); } rows.push(r); }
  return { w, h, rows };
}
function toTexture(scene, key, w, rows) {
  const c = document.createElement('canvas'); c.width = w; c.height = rows.length;
  const x = c.getContext('2d'), img = x.createImageData(w, rows.length);
  rows.forEach((r, y) => r.forEach((p, i) => { if (!p) return; const o = (y * w + i) * 4; img.data[o] = p[0]; img.data[o + 1] = p[1]; img.data[o + 2] = p[2]; img.data[o + 3] = p[3]; }));
  x.putImageData(img, 0, 0);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, c);
}
// Her frames are 10 x 15: an outline row, then 14 rows of her (head 1 to 6, torso 7 to 10, legs
// 11 to 14), with no outline under her feet, so origin (0.5, 1) keeps her on the floor.
export function makeFrames(scene) {
  if (scene.textures.exists('girl_squash') && scene.textures.exists('girl_stretch')) return true;
  if (!scene.textures.exists('girl_stand') || !scene.textures.exists('girl_jump')) return false;
  // squash: a torso row and a leg row gone, the legs split a column apart each way (knees out)
  const s = rowsOf(scene, 'girl_stand'), W = s.w + 2;
  const keep = s.rows.filter((r, y) => y !== 8 && y !== 12);
  const sq = keep.map((r, y) => {
    const out = new Array(W).fill(null), legs = y >= 10; // her legs: source rows 11, 13, 14
    if (!legs) r.forEach((p, i) => { if (p[3]) out[i + 1] = p; });
    else {
      const mid = Math.floor(s.w / 2);
      r.forEach((p, i) => { if (p[3]) out[i < mid ? i : i + 2] = p; });
      [r[mid - 1], r[mid]].forEach((p, j) => { if (p[3] && !out[mid + j]) out[mid + j] = p; });
    }
    return out;
  });
  toTexture(scene, 'girl_squash', W, sq);
  // stretch: a torso row and a leg row doubled (up on her toes, arm up)
  const j = rowsOf(scene, 'girl_jump'), st = [];
  j.rows.forEach((r, y) => { const c = r.map(p => p[3] ? p : null); st.push(c); if (y === 9 || y === 12) st.push(c.slice()); });
  toTexture(scene, 'girl_stretch', j.w, st);
  return true;
}

// ---------------------------------------------------------------- per scene rig
// A scene object is reused by scene.restart, so the rig is made again after each shutdown.
function rig(scene) {
  if (scene.__juice) return scene.__juice;
  const r = scene.__juice = { pose: null, until: 0, dust: null, hp: null, hitAt: 0 };
  makeFrames(scene);
  // after the scene's own update (which picks her frame), swap in the pose for its moment
  const post = () => {
    // HP lost anywhere (a scene that takes it without hurt(), like the east wing's robot): the
    // same hit-stop and kick as hurt() gives, once
    const hp = scene.kid && typeof scene.kid.hp === 'number' ? scene.kid.hp : typeof scene.hp === 'number' ? scene.hp : null;
    if (hp != null && r.hp != null && hp < r.hp && hp > 0 && !scene.dead && performance.now() - r.hitAt > 250) juice.hit(scene, r.hp - hp > 1 ? 2 : 1, r.hp - hp > 1 ? 90 : 65);
    r.hp = hp;
    const g = scene.girl; if (!g || !r.pose) return;
    if (performance.now() > r.until || scene.dead || !g.visible) { r.pose = null; return; }
    if (g.originY !== 1 || !SWAP.test(g.texture.key)) return;
    if (scene.textures.exists(r.pose)) g.setTexture(r.pose);
  };
  scene.events.on('postupdate', post);
  scene.events.once('shutdown', () => { scene.events.off('postupdate', post); scene.__juice = null; });
  return r;
}
function dustOf(scene) {
  const r = rig(scene);
  if (!r.dust || !r.dust.scene) {
    // square, 2 px, solid: ash puffs that drop out of sight (no alpha fade, no scaling)
    r.dust = scene.add.particles(0, 0, 'dot2', { speedX: { min: -34, max: 34 }, speedY: { min: -26, max: -6 }, gravityY: 90, lifespan: { min: 140, max: 300 }, tint: [hex(ASH.ash5), hex(ASH.ash4), hex(ASH.boneLo)], emitting: false }).setDepth(4.2);
  }
  return r.dust;
}

// ---------------------------------------------------------------- the API
export const juice = {
  // ready the frames before her first landing (death.js startTakes)
  prime(scene) { fx.guard(scene.cameras && scene.cameras.main); try { rig(scene); } catch (e) { /* textures not made yet: made on first use */ } },
  // dust where her feet are (or a wall): n puffs, at most 6
  dust(scene, x, y, n) { if (!scene.textures.exists('dot2')) return; dustOf(scene).explode(Math.max(1, Math.min(6, n || 3)), Math.round(x), Math.round(y)); },
  // She landed. tier 0: a step (no harm), 1: a thud (1 HP), 2: a crack (2 HP or worse).
  // v: her speed down as she hit, so a 1 px step down makes no fuss.
  land(scene, tier, x, y, v) {
    if (v < 70) return;
    const r = rig(scene);
    r.pose = 'girl_squash'; r.until = performance.now() + SQUASH_MS;
    Sound.land(tier);
    if (tier > 0 || v > 160) juice.dust(scene, x, y - 1, tier === 2 ? 6 : tier === 1 ? 4 : 2);
  },
  // she jumped: one stretch frame
  jump(scene) { const r = rig(scene); r.pose = 'girl_stretch'; r.until = performance.now() + STRETCH_MS; },
  // She lost HP, or the strike hit her: freeze, then a small kick. px 1 or 2.
  hit(scene, px, ms) { const stop = ms || 70; rig(scene).hitAt = performance.now(); juice.stop(scene, stop); fx.kick(scene.cameras && scene.cameras.main, px || 1, 110, false, stop); },
  // Hit-stop: the scene holds still for ms. Not a scene pause (that would swallow a pause key
  // pressed in the freeze, and could wake a scene a panel had paused): the scene stays running,
  // only its update, its clock and its tweens hold. The pause menu or a panel can still pause it
  // on top; the freeze lets go of its own hold only.
  stop(scene, ms) {
    const sys = scene.sys; if (!sys || !sys.isActive() || scene.__frozen) return;
    const own = sys.sceneUpdate, hold = function () {}, clock = scene.time, tw = scene.tweens;
    const clockWas = clock ? clock.paused : true, tweensWas = tw ? tw.paused : true;
    scene.__frozen = true; sys.sceneUpdate = hold;
    if (clock) clock.paused = true; if (tw) tw.paused = true;
    const wake = () => {
      scene.events.off('shutdown', wake);
      if (!scene.__frozen) return; scene.__frozen = false;
      if (sys.sceneUpdate === hold) sys.sceneUpdate = own;
      if (clock && !clockWas) clock.paused = false; if (tw && !tweensWas) tw.paused = false;
    };
    setTimeout(wake, Math.max(40, Math.min(110, ms || 70)));
    scene.events.once('shutdown', wake);
  },
  // The take, taped to the floor where it starts: a strip of bone tape with the number inked
  // on, lying on the floor's front edge under her feet. side: { x, y } her feet; top-down: the
  // tile she starts on. Made once per take; it stays for the take, like set dressing.
  //   at.after: a crew mark (r2 checkpoints) ends here: the tape goes on end to end after it,
  //     so the mark and the take read as one strip.
  //   at.meter: the glasses' readout is up (the lower left of the view, x 15 to 70, y 163 to
  //     175). The tape stays at her feet, in her light: if the readout would hide it, it slides
  //     right off the readout when that is a short way, or else it is laid over the readout
  //     until she walks off her mark (or 4 s), then goes back down under it.
  // It is laid once the scene has placed its camera (two frames in), so the view is known.
  tape(scene, take, at) {
    if (!take || take < 2 || !at) return;
    const s = 'TAKE ' + take, w = ccWidth(s) + 6, h = 9, floorDepth = at.topDown ? 1.95 : 1.9;
    let frames = 0;
    const lay = () => {
      if (++frames < 2) return;
      scene.events.off('postupdate', lay);
      const v = scene.cameras.main.worldView;
      let x = Math.round(at.after != null ? at.after + 1 : at.x - w / 2); const y = Math.round(at.y + 2); // just below her feet
      const M = at.meter ? { x0: v.x + 15, x1: v.x + 71, y0: v.y + 163, y1: v.y + 176 } : null;
      const under = px => M && px < M.x1 && px + w > M.x0 && y < M.y1 && y + h > M.y0;
      let over = false;
      if (under(x)) { if (M.x1 - x <= 14) x = M.x1; else over = true; }
      const g = scene.add.graphics().setDepth(over ? 20.5 : floorDepth);
      g.fillStyle(hex(ASH.ash0), 1); g.fillRect(x - 1, y - 1, w + 2, h + 2);   // its shadow edge
      g.fillStyle(hex(ASH.boneLo), 1); g.fillRect(x, y, w, h);                 // the tape
      g.fillStyle(hex(ASH.bone), 1); g.fillRect(x, y, w, 1);                   // its lit top edge
      g.fillStyle(hex(ASH.ash5), 1); g.fillRect(x + w - 2, y + h - 1, 2, 1); g.fillRect(x, y + h - 1, 1, 1); // torn ends
      ccText(g, s, x + 3, y + 1, ASH.ash0);
      Sound.clack();
      const t = scene.__tape = { x, y, w, h, take, g, over };
      if (over) {
        // back down under the readout once she has left her mark
        const k = scene.kid, k0 = k && (k.x != null ? k.x : k.tx * 16), t0 = performance.now();
        const settle = () => {
          const kk = scene.kid, kx = kk && (kk.x != null ? kk.x : kk.tx * 16), age = performance.now() - t0;
          if (age > 4000 || (age > 900 && kx != null && Math.abs(kx - k0) > 14) || !g.scene) {
            scene.events.off('postupdate', settle); if (g.scene) g.setDepth(floorDepth); t.over = false;
          }
        };
        scene.events.on('postupdate', settle);
        scene.events.once('shutdown', () => scene.events.off('postupdate', settle));
      }
    };
    scene.__tape = { take, pending: true };
    scene.events.on('postupdate', lay);
    scene.events.once('shutdown', () => scene.events.off('postupdate', lay));
  }
};
// tests read these (tests/feel.js)
if (typeof window !== 'undefined') window.__feel = Object.assign(window.__feel || {}, { juice });
