// Checks that episode 1 can be crossed without ever being seen, by searching (position, time)
// with the same light and drone motion the game uses. Prints the danger map as an image too.
import { LEVEL, TILE, GROUND, buildMap } from '../src/art/estate.js';
import fs from 'fs';
const map = buildMap();
const solidTile = (tx, ty) => { if (tx < 0 || tx >= map.W || ty >= map.H) return true; if (ty < 0) return false; return map.m[ty][tx] === 1; };
const solidPx = (x, y) => solidTile(Math.floor(x / TILE), Math.floor(y / TILE));
const inPoly = (pts, x, y) => { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
const cone = (x, y, angle, half, range) => { const pts = [{ x, y }]; for (let a = angle - half; a <= angle + half + 0.001; a += 1) { const r = a * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r); let d = 0; while (d < range) { d += 2; if (solidPx(x + dx * d, y + dy * d)) { d -= 1; break; } } pts.push({ x: x + dx * Math.min(d, range), y: y + dy * Math.min(d, range) }); } return pts; };
// walking surface under each x: top of the solid stack standing on the ground
const surface = x => { const tx = Math.floor(x / TILE); let ty = 9; if (!solidTile(tx, 9)) return GROUND; while (ty > 0 && solidTile(tx, ty - 1)) ty--; return ty * TILE; };
const DT = 0.05, STEPS = Math.round(120 / DT), DX = 4, NX = Math.floor(LEVEL.w * TILE / DX);
// drone positions over time, same integration as the game (no locks)
const drones = LEVEL.drones.map(d => ({ ...d, x: d.x0 + (d.x1 - d.x0) * 0.3, dir: 1 }));
const danger = new Uint8Array(NX * STEPS);
for (let k = 0; k < STEPS; k++) {
  const t = k * DT;
  const cones = LEVEL.lights.map(l => { const s = (Math.sin((t / l.period + l.phase) * Math.PI * 2) + 1) / 2; return cone(l.x, l.y, l.a0 + (l.a1 - l.a0) * s, l.half, l.range); });
  drones.forEach((d, i) => { d.x += d.dir * d.speed * DT; if (d.x > d.x1) { d.x = d.x1; d.dir = -1; } if (d.x < d.x0) { d.x = d.x0; d.dir = 1; } const cy = d.y + Math.sin(t * 3 + i) * 1.5; cones.push(cone(d.x, cy + 4, 90, d.half, d.range)); });
  for (let i = 0; i < NX; i++) {
    const x = i * DX, feet = surface(x + 4), top = feet - 14, cx = x + 4;
    const probes = [[cx, top + 2], [cx, top + 7], [cx, feet - 2], [x + 1, top + 7], [x + 7, top + 7]];
    danger[i * STEPS + k] = cones.some(c => probes.some(([px, py]) => inPoly(c, px, py))) ? 1 : 0;
  }
}
// search over (cell, tick, lock): being lit adds a tick of lock, darkness removes two; the game
// strikes at 0.42 s, so a path may stay lit for at most 7 ticks (0.35 s) in a row.
const MAXL = 7, NL = MAXL + 1, idx = (i, k, l) => (i * STEPS + k) * NL + l;
const seen = new Uint8Array(NX * STEPS * NL), prev = new Int32Array(NX * STEPS * NL).fill(-1);
const startI = Math.floor(LEVEL.start.x / DX), goal = Math.floor((LEVEL.door.x + 4) / DX);
const q = new Int32Array(NX * STEPS * NL); let qh = 0, qt = 0;
for (let k0 = 0; k0 < Math.round(10 / DT); k0 += 10) { const s0 = idx(startI, k0, 0); seen[s0] = 1; q[qt++] = s0; }
let found = -1, far = 0;
while (qh < qt) {
  const s = q[qh++], l = s % NL, ik = Math.floor(s / NL), i = Math.floor(ik / STEPS), k = ik % STEPS;
  if (i > far) far = i;
  if (i >= goal) { found = s; break; }
  if (k + 1 >= STEPS) continue;
  for (const di of [1, 0, -1]) {
    const ni = i + di; if (ni < 0 || ni >= NX) continue;
    if (surface(ni * DX + 4) < surface(i * DX + 4) - 44) continue;
    const lit = danger[ni * STEPS + k + 1], nl = lit ? l + 1 : Math.max(0, l - 2);
    if (nl > MAXL) continue;
    const ns = idx(ni, k + 1, nl);
    if (seen[ns]) continue;
    seen[ns] = 1; prev[ns] = s; q[qt++] = ns;
  }
}
if (found < 0) console.log('NO SAFE PATH. Furthest x:', far * DX, '(tile', Math.floor(far * DX / TILE) + ')');
else {
  const k = Math.floor(found / NL) % STEPS; console.log('path found, reaching the door', (k * DT).toFixed(1), 's after the earliest start');
  let s = found, litTicks = 0, waits = {}; while (prev[s] >= 0) { const p = prev[s]; const i1 = Math.floor(Math.floor(s / NL) / STEPS), i0 = Math.floor(Math.floor(p / NL) / STEPS); if (s % NL > p % NL) litTicks++; if (i1 === i0) { const b = Math.floor(i1 * DX / 16); waits[b] = (waits[b] || 0) + DT; } s = p; }
  console.log('lit ticks along the path:', litTicks, ' waits (tile:s):', Object.entries(waits).filter(([, v]) => v > 0.3).map(([a, v]) => a + ':' + v.toFixed(1)).join('  '));
}
// danger map image (x across, time down, first 20 s), as a PGM for a quick look
const rows = Math.round(20 / DT), img = Buffer.alloc(NX * rows);
for (let k = 0; k < rows; k++) for (let i = 0; i < NX; i++) img[k * NX + i] = danger[i * STEPS + k] ? 40 : (surface(i * DX + 4) < GROUND ? 170 : 255);
fs.writeFileSync('tests/out/danger.pgm', Buffer.concat([Buffer.from(`P5 ${NX} ${rows} 255\n`), img]));
// How often does a player who just holds Right survive, over many start times?
let ok = 0, tries = 0; const fails = {};
for (let k0 = 0; k0 < Math.round(60 / DT); k0 += 3) {
  tries++; let l = 0, i = startI, k = k0, dead = false;
  while (i < goal && k < STEPS - 1) { k++; i++; const lit = danger[i * STEPS + k]; l = lit ? l + 1 : Math.max(0, l - 2); if (l > MAXL) { dead = true; const b = Math.floor(i * DX / TILE); fails[b] = (fails[b] || 0) + 1; break; } }
  if (!dead) ok++;
}
console.log('holding Right survives', ok, 'of', tries, 'starts; caught at tiles:', Object.entries(fails).map(([a, v]) => a + ':' + v).join(' '));
