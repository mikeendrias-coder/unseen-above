// Art for the opening cinematic, in a smoother style than the pixel game: vector silhouettes,
// soft light textures, film grain. Colors come from the chosen look, so the cinematic matches it.
import { flat, rng } from './painter.js';

export const mix = (a, b, t) => {
  const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
export const num = h => parseInt(h.slice(1), 16);

export function cinemaPalette(P) {
  const f = k => flat(P[k]);
  const sky0 = f('skyTop'), sky1 = f('skyMid'), sky2 = f('skyLow');
  return {
    sky0, sky1, sky2,
    smoke: mix(sky2, '#3b1d14', 0.55), ember: mix(f('hazard'), '#ff7a2a', 0.5),
    cityFar: mix(sky2, '#000000', 0.42), cityMid: mix(sky2, '#000000', 0.68), ink: mix(sky0, '#000000', 0.82),
    fire: f('lamp'), hazard: f('hazard'),
    wall: f('wall'), wallHi: f('wallHi'), wallLo: f('wallLo'), gold: f('gold'), goldHi: f('goldHi'), goldLo: f('goldLo'),
    col: f('col'), colHi: f('colHi'), win: f('win'), winHi: f('winHi'), glass: f('glass'), glassLit: f('glassLit'),
    shaft: f('shaft'), lamp: f('lamp'), moon: f('moon'), moonShade: f('moonShade'), star: f('star'),
    rim: mix(f('lamp'), '#ffffff', 0.15)
  };
}

// ------------------------------------------------------------------ soft textures (canvas)
function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = scene.textures.addCanvas(key, c);
  t.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return t;
}
export function makeCinemaTextures(scene, C) {
  canvasTex(scene, 'c_sky', 4, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, C.sky0); g.addColorStop(0.38, C.sky1); g.addColorStop(0.62, mix(C.sky2, '#ffffff', 0.04)); g.addColorStop(0.8, mix(C.sky2, C.smoke, 0.6)); g.addColorStop(0.92, mix(C.smoke, C.ember, 0.18)); g.addColorStop(1, mix(C.smoke, '#000000', 0.3));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  canvasTex(scene, 'c_glow', 128, 128, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(0.6, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  });
  canvasTex(scene, 'c_dot', 16, 16, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  });
  canvasTex(scene, 'c_beam', 64, 512, (x, w, h) => {
    for (let y = 0; y < h; y++) {
      const along = 1 - y / h, spread = 0.12 + 0.88 * (1 - along); // narrow at the base, wide at the far end
      for (let i = 0; i < w; i++) {
        const d = Math.abs(i - w / 2) / (w / 2) / spread;
        if (d > 1) continue;
        const a = Math.pow(1 - d, 1.6) * Math.pow(along, 0.9) * 0.9;
        x.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; x.fillRect(i, y, 1, 1);
      }
    }
  });
  canvasTex(scene, 'c_moon', 192, 192, (x, w) => {
    const c = w / 2, r = 46;
    const halo = x.createRadialGradient(c, c, r * 0.8, c, c, c); halo.addColorStop(0, 'rgba(255,250,235,0.35)'); halo.addColorStop(1, 'rgba(255,250,235,0)');
    x.fillStyle = halo; x.fillRect(0, 0, w, w);
    const body = x.createRadialGradient(c - 14, c - 16, 4, c, c, r); body.addColorStop(0, mix(C.moon, '#ffffff', 0.3)); body.addColorStop(1, C.moonShade);
    x.fillStyle = body; x.beginPath(); x.arc(c, c, r, 0, Math.PI * 2); x.fill();
    const rr = rng(5); x.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 9; i++) { const a = rr() * Math.PI * 2, d = rr() * r * 0.8, s = 3 + rr() * 9; x.beginPath(); x.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, s, 0, Math.PI * 2); x.fill(); }
    // one lit window, if you look
    x.fillStyle = C.lamp; x.fillRect(c - 12, c + 18, 2, 2); x.fillStyle = 'rgba(255,200,120,0.5)'; x.fillRect(c - 13, c + 17, 4, 4);
  });
  canvasTex(scene, 'c_smoke', 512, 160, (x, w, h) => {
    const rr = rng(17);
    for (let i = 0; i < 60; i++) {
      const cx = rr() * w, cy = h * 0.3 + rr() * h * 0.5, r = 20 + rr() * 60;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      const tone = mix(mix(C.smoke, '#8a7a70', 0.35), '#000000', rr() * 0.4);
      g.addColorStop(0, tone + '66'); g.addColorStop(1, tone + '00');
      x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  });
  canvasTex(scene, 'c_grain', 256, 256, (x, w) => {
    const img = x.createImageData(w, w), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 20; }
    x.putImageData(img, 0, 0);
  });
  canvasTex(scene, 'c_vignette', 256, 144, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
}

// ------------------------------------------------------------------ vector layers
// A skyline of broken towers along a baseline. Returns polygons and window points.
export function skyline(seed, x0, x1, base, minH, maxH) {
  const r = rng(seed), polys = [], lights = [];
  let x = x0;
  while (x < x1) {
    const w = 26 + r() * 70, h = minH + r() * (maxH - minH), top = base - h;
    const pts = [[x, base], [x, top + r() * 10]];
    // a broken crown: jagged steps across the top
    const steps = 3 + Math.floor(r() * 5);
    for (let i = 1; i < steps; i++) pts.push([x + (w * i) / steps, top + (r() < 0.5 ? r() * 30 : -r() * 8)]);
    pts.push([x + w, top + r() * 26], [x + w, base]);
    polys.push(pts);
    if (r() < 0.3) polys.push([[x + w * 0.6, top + 4], [x + w * 0.6 + 3, top + 4], [x + w * 0.9 + 14, top - 34], [x + w * 0.9 + 11, top - 36]]); // a bent girder
    if (r() < 0.45) lights.push({ x: x + 6 + r() * (w - 12), y: top + 14 + r() * Math.max(8, h * 0.6), p: r() * 6 });
    x += w + r() * 18;
  }
  return { polys, lights };
}

export function ridgeShape() {
  // Low ground on the left (the dead city shows above it), a rise to the crest where they stop,
  // then a broken slope down toward the valley.
  return [[-1400, 1000], [-1400, 650], [-900, 646], [-500, 652], [-120, 644], [200, 648], [430, 636], [600, 618], [760, 604], [905, 600], [965, 603], [1010, 618], [1060, 650], [1115, 688], [1170, 722], [1235, 748], [1320, 772], [1420, 805], [1600, 1000]];
}

// The mansion seen across the valley. Drawn once into a Graphics object at its own origin.
export function drawMansion(g, C) {
  const fill = (c, a) => g.fillStyle(num(c), a == null ? 1 : a);
  // valley ground and the perimeter wall
  fill(C.ink); g.fillRect(-900, 111, 1800, 409);
  fill(mix(C.ink, C.gold, 0.08)); g.fillRect(-900, 111, 1800, 3);
  for (let x = -880; x < 880; x += 22) { fill(C.lamp, 0.9); g.fillRect(x, 109, 2, 2); }
  // glass wing (left), clashing with everything else
  fill(mix(C.glass, '#000000', 0.35)); g.fillRect(-250, -10, 150, 122);
  const r = rng(9);
  // floors lit in runs, the way a tower looks at night
  for (let y = -6; y < 106; y += 10) {
    let x = -246;
    while (x < -104) { const run = 1 + Math.floor(r() * 5), lit = r(), col = lit < 0.42 ? C.win : lit < 0.62 ? C.glassLit : null; for (let i = 0; i < run && x < -104; i++, x += 9) { fill(col || mix(C.glass, '#000000', 0.15), col ? 0.95 : 1); g.fillRect(x, y, 7, 7); } }
    fill(C.goldLo, 0.8); g.fillRect(-250, y + 8, 150, 1);
  }
  fill(C.gold); g.fillRect(-252, -14, 154, 4);
  // dome wing
  fill(C.wall); g.fillRect(-100, 20, 110, 92); fill(C.wallHi); g.fillRect(-100, 20, 110, 3);
  for (let x = -94; x < 8; x += 18) { fill(C.goldLo); g.fillRect(x, 44, 11, 30); g.fillCircle(x + 5.5, 44, 5.5); fill(C.win); g.fillRect(x + 2, 46, 7, 27); g.fillCircle(x + 5.5, 45, 3.5); }
  fill(C.wallHi); g.fillRect(-82, 2, 74, 18);
  fill(C.gold); g.slice(-45, 2, 34, Math.PI, 0, false); g.fillPath();
  fill(C.goldHi, 0.8); g.slice(-52, -4, 16, Math.PI * 1.15, Math.PI * 1.5, false); g.fillPath();
  fill(C.gold); g.fillRect(-49, -48, 8, 16); fill(C.winHi); g.fillRect(-47, -45, 4, 9); fill(C.goldHi); g.fillCircle(-45, -52, 3);
  // temple front (centre), the door lit from inside
  fill(C.wall); g.fillRect(10, 8, 170, 104);
  fill(C.colHi); g.fillRect(4, -2, 182, 10); fill(C.gold); g.fillRect(4, -3, 182, 2); g.fillRect(4, 8, 182, 1);
  fill(C.gold); g.fillTriangle(0, -2, 95, -46, 190, -2); fill(C.colHi); g.fillTriangle(10, -4, 95, -40, 180, -4);
  fill(C.goldHi); g.fillCircle(95, -18, 5);
  for (let i = 0; i < 6; i++) { const x = 18 + i * 29; fill(C.col); g.fillRect(x, 10, 9, 96); fill(C.colHi); g.fillRect(x + 1, 10, 2, 96); fill(C.gold); g.fillRect(x - 2, 8, 13, 3); }
  fill(C.goldLo); g.fillRect(83, 58, 24, 54); g.fillCircle(95, 58, 12); fill(C.winHi); g.fillRect(86, 61, 18, 51); g.fillCircle(95, 61, 9);
  fill(C.col); for (let i = 0; i < 4; i++) g.fillRect(40 - i * 6, 106 + i * 2, 110 + i * 12, 2);
  // a tower wing on the right, too tall for the rest
  fill(C.wallLo); g.fillRect(186, -40, 70, 152); fill(C.gold); g.fillRect(184, -44, 74, 4); g.fillTriangle(184, -44, 221, -80, 258, -44);
  for (let y = -32; y < 100; y += 14) for (let x = 192; x < 250; x += 14) { fill(r() < 0.6 ? C.win : C.wallHi, 0.95); g.fillRect(x, y, 8, 9); }
  fill(C.goldHi); g.fillRect(220, -96, 2, 16);
  // fountains and the reflecting pool in front
  fill(mix(C.glass, C.ink, 0.4)); g.fillRect(-60, 124, 300, 8);
  fill(C.glassLit, 0.5); for (let x = -50; x < 230; x += 40) g.fillRect(x, 126, 14, 1);
}

// ------------------------------------------------------------------ the siblings, as silhouettes
const SEG = (g, x0, y0, x1, y1, w) => { g.lineStyle(w, g._c, 1); g.lineBetween(x0, y0, x1, y1); g.fillCircle(x1, y1, w / 2); };
function limb(g, ox, oy, a1, l1, a2, l2, w) {
  const x1 = ox + Math.sin(a1) * l1, y1 = oy + Math.cos(a1) * l1, x2 = x1 + Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
  SEG(g, ox, oy, x1, y1, w); SEG(g, x1, y1, x2, y2, w * 0.86);
  return [x2, y2];
}
// pose: {x, y, s, face, walk (phase or null), crouch 0..1, point 0..1, look -1..1, breathe}
export function drawFigure(g, kind, pose, color) {
  const big = kind === 'brother', s = pose.s * (big ? 1.25 : 1.02), f = pose.face;
  const thigh = 37 * s, shin = 35 * s, uArm = 27 * s, fArm = 25 * s;
  const c = pose.crouch || 0, w = pose.walk;
  const bob = w != null ? Math.abs(Math.sin(w)) * 2.4 * s : Math.sin(pose.breathe || 0) * 0.7 * s;
  const hipY = pose.y - (thigh + shin) * (1 - c * 0.42) - bob, hipX = pose.x;
  const lean = (w != null ? 3 : 0) + c * 9;
  const shoulderY = hipY - 47 * s * (1 - c * 0.1), shoulderX = hipX + f * lean * s;
  g._c = color; g.fillStyle(color, 1);
  // legs and boots
  const legA = w != null ? Math.sin(w) * 0.48 : c * 0.95, legB = w != null ? Math.sin(w + Math.PI) * 0.48 : -c * 0.15;
  const kneeA = w != null ? Math.max(0, -Math.cos(w)) * -0.75 : -c * 2.1, kneeB = w != null ? Math.max(0, Math.cos(w)) * -0.75 : -c * 0.5;
  const footA = limb(g, hipX - f * 2 * s, hipY, legA * f, thigh, kneeA * f, shin, 10 * s);
  const footB = limb(g, hipX + f * 2 * s, hipY, legB * f, thigh, kneeB * f, shin, 10 * s);
  [footA, footB].forEach(([fx, fy]) => g.fillRoundedRect(f > 0 ? fx - 4 * s : fx - 10 * s, fy - 4 * s, 14 * s, 6 * s, 2 * s));
  // coat: rounded shoulders, a hem that flares a little
  const sw = (big ? 15 : 12) * s, hw = (big ? 14 : 12) * s, hem = hipY + (big ? 12 : 16) * s;
  g.fillPoints([
    { x: hipX - hw - f * 2 * s, y: hem }, { x: hipX + hw - f * 2 * s, y: hem },
    { x: shoulderX + sw, y: shoulderY + 7 * s }, { x: shoulderX + sw - 3 * s, y: shoulderY + 1 * s }, { x: shoulderX + sw - 8 * s, y: shoulderY - 1.5 * s },
    { x: shoulderX - sw + 8 * s, y: shoulderY - 1.5 * s }, { x: shoulderX - sw + 3 * s, y: shoulderY + 1 * s }, { x: shoulderX - sw, y: shoulderY + 7 * s }
  ], true);
  if (big) {
    // a pack with a bedroll, and a crowbar sticking out
    const bx = f > 0 ? shoulderX - sw - 12 * s : shoulderX + sw - 4 * s;
    g.fillRoundedRect(bx, shoulderY + 2 * s, 16 * s, 34 * s, 4 * s);
    g.fillEllipse(bx + 8 * s, shoulderY, 20 * s, 9 * s);
    g.lineStyle(2.4 * s, color, 1); g.lineBetween(bx + 8 * s, shoulderY + 10 * s, bx + 8 * s - f * 16 * s, shoulderY - 22 * s);
  } else {
    // a scarf end that moves in the wind
    const sx = shoulderX - f * 6 * s, sy = shoulderY + 1 * s, fl = Math.sin((pose.breathe || 0) * 3) * 3 * s;
    g.fillTriangle(sx, sy, sx - f * 16 * s, sy + 5 * s + fl, sx - f * 4 * s, sy + 7 * s);
  }
  // head: the sister wears her hood up; the brother has rough hair
  const headX = shoulderX + f * (3 + (pose.look || 0) * 2) * s, headY = shoulderY - 13 * s;
  g.fillRect(shoulderX - 3.5 * s, shoulderY - 7 * s, 7 * s, 8 * s);
  g.fillCircle(headX, headY, (big ? 8.6 : 8.2) * s);
  if (big) { g.fillTriangle(headX - f * 7 * s, headY - 6 * s, headX - f * 2 * s, headY - 11 * s, headX + f * 3 * s, headY - 8 * s); }
  else { g.fillCircle(headX - f * 2 * s, headY - 1 * s, 9.6 * s); g.fillTriangle(headX - f * 6 * s, headY - 8 * s, headX - f * 15 * s, headY + 4 * s, headX - f * 3 * s, headY + 9 * s); }
  // arms: one may point toward the house
  const p = pose.point || 0, swing = w != null ? Math.sin(w + Math.PI) * 0.42 : 0.06;
  const hand = limb(g, shoulderX + f * 4 * s, shoulderY + 4 * s, (swing * (1 - p) + p * 2.05) * f, uArm, (-0.22 * (1 - p)) * f, fArm, 8 * s);
  g.fillCircle(hand[0], hand[1], 4 * s);
  const hand2 = limb(g, shoulderX - f * 5 * s, shoulderY + 4 * s, (-swing + c * 0.7) * f, uArm, (-0.3 - c * 1.2) * f, fArm, 8 * s);
  g.fillCircle(hand2[0], hand2[1], 4 * s);
}
