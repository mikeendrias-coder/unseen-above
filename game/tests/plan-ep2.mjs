// Checks episode 2: (1) the two cameras can be passed without a lock, searching over position,
// time and pose (standing or crouched) with the same camera motion as the game; (2) every laser
// shot can be survived by the move it asks for (jump the low beam, crouch under the high pair).
// Bundle first: npx esbuild tests/plan-ep2.mjs --bundle --platform=node --format=esm --outfile=tests/out/plan2.mjs
import { LEVEL, TILE, GROUND, buildMap, camAngle, laserAt, beamHits } from '../src/art/gallery.js';
import fs from 'fs';
const map = buildMap();
const solidTile = (tx, ty) => { if (tx < 0 || tx >= map.W || ty >= map.H) return true; if (ty < 0) return false; return map.m[ty][tx] === 1; };
const solidPx = (x, y) => solidTile(Math.floor(x / TILE), Math.floor(y / TILE));
const inPoly = (pts, x, y) => { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
const cone = (x, y, angle, half, range) => { const pts = [{ x, y }]; for (let a = angle - half; a <= angle + half + 0.001; a += 1) { const r = a * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r); let d = 0; while (d < range) { d += 2; if (solidPx(x + dx * d, y + dy * d)) { d -= 1; break; } } pts.push({ x: x + dx * Math.min(d, range), y: y + dy * Math.min(d, range) }); } return pts; };
// lowest walking surface under x (the desk has room beneath it, so the floor counts there)
const surface = x => { const tx = Math.floor(x / TILE); if (!solidTile(tx, 9)) return GROUND; let ty = 9; while (ty > 0 && solidTile(tx, ty - 1)) ty--; return ty * TILE; };
const DX = 4, DT = DX / 72, T = 90, STEPS = Math.round(T / DT), END = LEVEL.laser.x0, NX = Math.floor(END / DX) + 2;
const H = [14, 9];
const danger = [new Uint8Array(NX * STEPS), new Uint8Array(NX * STEPS)];
for (let k = 0; k < STEPS; k++) {
  const t = k * DT, cones = LEVEL.cameras.map(c => cone(c.x, c.y, camAngle(c, t), c.half, c.range));
  for (let i = 0; i < NX; i++) for (let p = 0; p < 2; p++) {
    const x = i * DX, feet = surface(x + 4), top = feet - H[p], cx = x + 4, mid = top + H[p] / 2;
    const probes = [[cx, top + 2], [cx, mid], [cx, feet - 2], [x + 1, mid], [x + 7, mid]];
    danger[p][i * STEPS + k] = cones.some(c => probes.some(([px, py]) => inPoly(c, px, py))) ? 1 : 0;
  }
}
// state: (cell, tick, pose, lock ticks). Lit adds one tick of lock, dark removes two. The game
// locks at 0.55 s (about 9.9 ticks); the search allows 7 so that a found path has slack.
const MAXL = 7, NL = MAXL + 1, idx = (i, k, p, l) => ((i * STEPS + k) * 2 + p) * NL + l;
const N = NX * STEPS * 2 * NL, seen = new Uint8Array(N), prev = new Int32Array(N).fill(-1), q = new Int32Array(N);
const dec = s => { const l = s % NL, r1 = (s - l) / NL, p = r1 % 2, r2 = (r1 - p) / 2, k = r2 % STEPS, i = (r2 - k) / STEPS; return { i, k, p, l }; };
const startI = Math.floor(LEVEL.start.x / DX), goal = Math.floor((END - 8) / DX);
let qh = 0, qt = 0;
for (let k0 = 0; k0 < Math.round(8 / DT); k0 += 6) { const s0 = idx(startI, k0, 0, 0); seen[s0] = 1; q[qt++] = s0; }
let found = -1, far = 0;
while (qh < qt) {
  const s = q[qh++], { i, k, p, l } = dec(s);
  if (i > far) far = i;
  if (i >= goal) { found = s; break; }
  if (k + 1 >= STEPS) continue;
  for (const np of [0, 1]) for (const di of [1, 0, -1]) {
    if (np === 1 && di !== 0 && k % 2) continue; // crouched, she moves every other tick
    const ni = i + di; if (ni < 0 || ni >= NX) continue;
    if (surface(ni * DX + 4) < surface(i * DX + 4) - 40) continue;
    const lit = danger[np][ni * STEPS + k + 1], nl = lit ? l + 1 : Math.max(0, l - 2);
    if (nl > MAXL) continue;
    const ns = idx(ni, k + 1, np, nl);
    if (seen[ns]) continue;
    seen[ns] = 1; prev[ns] = s; q[qt++] = ns;
  }
}
if (found < 0) console.log('CAMERAS: NO SAFE PATH. Furthest x:', far * DX, '(tile', Math.floor(far * DX / TILE) + ')');
else {
  console.log('cameras: path found, reaching the laser hall', (dec(found).k * DT).toFixed(1), 's in');
  let s = found, lit = 0, crouch = 0; const waits = {};
  while (prev[s] >= 0) { const a = dec(s), b = dec(prev[s]); if (a.l > b.l) lit++; if (a.p) crouch++; if (a.i === b.i) { const tl = Math.floor(a.i * DX / TILE); waits[tl] = (waits[tl] || 0) + DT; } s = prev[s]; }
  console.log('  lit ticks', lit, ' crouched ticks', crouch, ' waits (tile:s):', Object.entries(waits).filter(([, v]) => v > 0.3).map(([a, v]) => a + ':' + v.toFixed(1)).join('  '));
}
// holding Right while standing, from many start times
let ok = 0, tries = 0; const fails = {};
for (let k0 = 0; k0 < Math.round(40 / DT); k0 += 3) {
  tries++; let l = 0, i = startI, k = k0, dead = false;
  while (i < goal && k < STEPS - 1) { k++; i++; const lit = danger[0][i * STEPS + k]; l = lit ? l + 1 : Math.max(0, l - 2); if (l > 9) { dead = true; const b = Math.floor(i * DX / TILE); fails[b] = (fails[b] || 0) + 1; break; } }
  if (!dead) ok++;
}
console.log('holding Right survives the cameras', ok, 'of', tries, 'starts; caught at tiles:', Object.entries(fails).map(([a, v]) => a + ':' + v).join(' '));
// danger maps (standing | crouched), x across, time down, first 20 s
const rows = Math.round(20 / DT), img = Buffer.alloc(NX * 2 * rows);
for (let k = 0; k < rows; k++) for (let p = 0; p < 2; p++) for (let i = 0; i < NX; i++) img[k * NX * 2 + p * NX + i] = danger[p][i * STEPS + k] ? 40 : (surface(i * DX + 4) < GROUND ? 170 : 255);
fs.mkdirSync('tests/out', { recursive: true });
fs.writeFileSync('tests/out/danger2.pgm', Buffer.concat([Buffer.from(`P5 ${NX * 2} ${rows} 255\n`), img]));

// (2) the laser: simulate the real jump arc and the crouch against every shot in the order
const g = 690, jumpV = 236, L = LEVEL.laser, fireAt = L.first + L.tell + L.charge, cyc = L.tell + L.charge + L.fire + L.idle;
// height of the feet t seconds after a held jump, integrated the way moveKid does it (60 fps)
const ARC = (() => { const out = []; let y = 0, vy = -jumpV; for (let f = 0; f < 120; f++) { out.push(Math.max(0, -y)); const apex = Math.abs(vy) < 40; vy = Math.min(260, vy + g * (apex ? 0.5 : 1) / 60); y += vy / 60; if (y >= 0 && f > 2) { out.push(0); break; } } return out; })();
const arc = t => t < 0 ? 0 : (ARC[Math.floor(t * 60)] || 0);
L.order.forEach((shot, n) => {
  const t0 = fireAt + n * cyc, ys = L.shots[shot];
  const bad = (u, top, bottom) => laserAt(L, u).phase === 'fire' && ys.some(y => beamHits(top, bottom, y));
  if (shot === 'low') {
    // jump windows: for which jump start times does she clear the whole fire phase?
    const good = []; for (let j = t0 - 0.8; j < t0 + 0.05; j += 0.01) { let hit = false; for (let u = t0; u < t0 + L.fire; u += 0.005) { const h = u >= j ? arc(u - j) : 0; if (bad(u, GROUND - 14 - h, GROUND - h)) { hit = true; break; } } if (!hit) good.push(j); }
    console.log(`laser shot ${n} low: jump window ${good.length ? ((good[good.length - 1] - good[0]) * 1000).toFixed(0) + ' ms' : 'NONE'}`);
  } else {
    let standHit = false, crouchHit = false, jumpOk = false;
    for (let u = t0; u < t0 + L.fire; u += 0.005) { if (bad(u, GROUND - 14, GROUND)) standHit = true; if (bad(u, GROUND - 9, GROUND)) crouchHit = true; }
    for (let j = t0 - 0.8; j < t0; j += 0.01) { let hit = false; for (let u = t0; u < t0 + L.fire; u += 0.005) { const h = arc(u - j); if (u - j > ARC.length / 60) { if (bad(u, GROUND - 14, GROUND)) hit = true; } else if (bad(u, GROUND - 14 - h, GROUND - h)) hit = true; } if (!hit) jumpOk = true; }
    console.log(`laser shot ${n} high: standing ${standHit ? 'dies' : 'LIVES'}, crouched ${crouchHit ? 'DIES' : 'lives'}, a jump ${jumpOk ? 'CAN DODGE' : 'cannot dodge'}`);
  }
});
