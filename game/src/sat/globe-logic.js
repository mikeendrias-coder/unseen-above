// The turning puzzles on the satellite screen, as pure logic (no Phaser): the orbit ring (one
// axis, the tutorial) and the globe maze (two axes). Both are a grid of cells on a surface in 3D.
// The player turns the surface; gravity pulls each bead down the screen, one groove at a time.
//
// The rule is discrete so the game and the solver agree exactly:
//   * The surface's turn is read in steps (15 degrees on the globe, 11.25 on the ring).
//   * At each step a resting bead looks at the open grooves out of its cell and takes the one that
//     runs most steeply downhill, if it is steep enough. It repeats until nothing moves.
//   * A bead that rolls into its target is caught there. A blurred cell bounces it back.
// The game plays this rule step by step with animation; the solver runs it in a search.

const D = Math.PI / 180;
export const GLOBE = { rows: 6, cols: 12, latN: 72 * D, rowH: 24 * D, colW: 30 * D, step: 15 * D, yawN: 24, pMin: -6, pMax: 6 };
export const RING = { rows: 3, cols: 16, R: 66, hw: 24, tilt: -35 * D, step: 11.25 * D, phiN: 32 };
// how steep a groove must be before a bead rolls (friction)
export const SLOPE = 0.15;
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
// gravity in view space (x right, y down, z toward the viewer): on the globe it pulls down and a
// little forward, so the low point sits on the front of the ball where it can be seen
export const GRAV = { globe: norm([0, 0.7, 0.71]), ring: [0, 1, 0] };

// rotation: turn about the body's own axis (yaw), then tip about the screen's x axis (pitch)
export function rotM(yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  // Rx(p) * Ry(y)
  return [cy, 0, sy, sp * sy, cp, -sp * cy, -cp * sy, sp, cp * cy];
}
export const apply = (m, x, y, z) => [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
// the transpose takes a view vector back onto the body
export const applyT = (m, x, y, z) => [m[0] * x + m[3] * y + m[6] * z, m[1] * x + m[4] * y + m[7] * z, m[2] * x + m[5] * y + m[8] * z];

// ------------------------------------------------------------------ boards
// A level: { id, kind: 'globe'|'ring', links: [[a,b]...] open grooves (or ring: { walls, holes }),
// gates: [[from,to]] one way, blur: [cells], beads: [{ start, target }], drift: [cells], o0 }
export function buildBoard(L) {
  const ring = L.kind === 'ring', S = ring ? RING : GLOBE, rows = S.rows, cols = S.cols, n = rows * cols;
  const pos = new Float64Array(n * 3);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (ring) { const th = (c + 0.5) * (2 * Math.PI / cols), h = -S.hw + (r + 0.5) * (2 * S.hw / rows); pos[i * 3] = S.R * Math.sin(th); pos[i * 3 + 1] = h; pos[i * 3 + 2] = S.R * Math.cos(th); }
    else { const lat = S.latN - (r + 0.5) * S.rowH, lon = (c + 0.5) * S.colW; pos[i * 3] = Math.cos(lat) * Math.sin(lon); pos[i * 3 + 1] = -Math.sin(lat); pos[i * 3 + 2] = Math.cos(lat) * Math.cos(lon); }
  }
  // the open grooves
  const key = (a, b) => a < b ? a * 4096 + b : b * 4096 + a, open = new Set();
  let links = L.links;
  if (ring && L.ring) {
    links = [];
    const walls = new Set((L.ring.walls || []).map(([r, c]) => r * cols + c));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!walls.has(r * cols + c)) links.push([r * cols + c, r * cols + (c + 1) % cols]);
    (L.ring.holes || []).forEach(([r, c]) => links.push([r * cols + c, (r + 1) * cols + c]));
  }
  links.forEach(([a, b]) => open.add(key(a, b)));
  const oneWay = new Set((L.gates || []).map(([a, b]) => a * 4096 + b)); // a -> b only
  const adj = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols, out = [];
    [[r, (c + 1) % cols], [r, (c + cols - 1) % cols], [r + 1, c], [r - 1, c]].forEach(([rr, cc]) => {
      if (rr < 0 || rr >= rows) return;
      const j = rr * cols + cc;
      if (!open.has(key(i, j))) return;
      if (oneWay.has(j * 4096 + i)) return; // the gate only lets beads through the other way
      if (!out.includes(j)) out.push(j);
    });
    adj.push(out);
  }
  const blur = new Uint8Array(n); (L.blur || []).forEach(c => { blur[c] = 1; });
  const nP = ring ? 1 : S.pMax - S.pMin + 1, nO = ring ? S.phiN : S.yawN * nP;
  const B = { kind: L.kind, ring, S, rows, cols, n, pos, adj, open, isOpen: (a, b) => open.has(key(a, b)), blur, nO, nP, g: ring ? GRAV.ring : GRAV.globe };
  // orientation index -> angles
  B.angles = o => ring ? { yaw: (o % S.phiN) * S.step, pitch: S.tilt } : { yaw: Math.floor(o / nP) * S.step, pitch: (o % nP + S.pMin) * S.step };
  B.matrix = o => { const a = B.angles(o); return rotM(a.yaw, a.pitch); };
  // a turn by one step: 0 right, 1 left, 2 up, 3 down; -1 when it cannot turn that way
  B.turn = (o, m) => {
    if (ring) return m === 0 ? (o + 1) % S.phiN : m === 1 ? (o + S.phiN - 1) % S.phiN : -1;
    const y = Math.floor(o / nP), p = o % nP;
    if (m === 0) return ((y + 1) % S.yawN) * nP + p;
    if (m === 1) return ((y + S.yawN - 1) % S.yawN) * nP + p;
    if (m === 2) return p + 1 < nP ? y * nP + p + 1 : -1;
    return p > 0 ? y * nP + p - 1 : -1;
  };
  // the nearest orientation index to a pair of angles
  B.nearest = (yaw, pitch) => {
    const st = S.step, y = ((Math.round(yaw / st) % (ring ? S.phiN : S.yawN)) + (ring ? S.phiN : S.yawN)) % (ring ? S.phiN : S.yawN);
    if (ring) return y;
    const p = Math.max(S.pMin, Math.min(S.pMax, Math.round(pitch / st)));
    return y * nP + (p - S.pMin);
  };
  // for every orientation and cell: the groove a resting bead takes (or -1)
  const best = new Int16Array(nO * n).fill(-1), g = B.g;
  for (let o = 0; o < nO; o++) {
    const m = B.matrix(o), v = [];
    for (let i = 0; i < n; i++) v.push(apply(m, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
    for (let i = 0; i < n; i++) {
      let bj = -1, bs = SLOPE;
      adj[i].forEach(j => {
        const d = [v[j][0] - v[i][0], v[j][1] - v[i][1], v[j][2] - v[i][2]], l = Math.hypot(d[0], d[1], d[2]);
        const s = (d[0] * g[0] + d[1] * g[1] + d[2] * g[2]) / l;
        if (s > bs + 1e-9) { bs = s; bj = j; }
      });
      best[o * n + i] = bj;
    }
  }
  B.best = best;
  // grid distance along open grooves (ignoring gravity), for the progress bars
  B.dist = from => { const d = new Int16Array(n).fill(-1), q = [from]; d[from] = 0; while (q.length) { const i = q.shift(); adj[i].forEach(j => { if (d[j] < 0 && !blur[j]) { d[j] = d[i] + 1; q.push(j); } }); } return d; };
  return B;
}

// One pass of the rule: each free bead, in order, takes its downhill groove. Returns the events
// ({ k, from, to } for a roll, { k, bounce } for a blurred cell) and whether anything moved.
export function stepOnce(B, o, beads, targets, caught) {
  const ev = []; let moved = false;
  for (let k = 0; k < beads.length; k++) {
    if (caught[k]) continue;
    const i = beads[k], j = B.best[o * B.n + i];
    if (j < 0) continue;
    if (B.blur[j]) { ev.push({ k, bounce: j }); continue; }
    let taken = false; for (let m = 0; m < beads.length; m++) if (m !== k && beads[m] === j) taken = true;
    if (taken) continue;
    beads[k] = j; moved = true; ev.push({ k, from: i, to: j });
    if (j === targets[k]) caught[k] = 1;
  }
  return { moved, ev };
}
export function settle(B, o, beads, targets, caught) { for (let guard = 0; guard < 1000; guard++) if (!stepOnce(B, o, beads, targets, caught).moved) return; }

// ------------------------------------------------------------------ the solver
// States: orientation and every bead's cell. A bead sitting on its own target is caught.
// explore() searches from a list of start states and keeps each state's four turns.
export function explore(B, starts, targets) {
  const n = B.n, k = targets.length, per = k === 1 ? n : n * n, size = B.nO * per;
  const enc = (o, bs) => o * per + (k === 1 ? bs[0] : bs[0] * n + bs[1]);
  const dec = s => { const o = Math.floor(s / per), r = s % per; return { o, beads: k === 1 ? [r] : [Math.floor(r / n), r % n] }; };
  const idx = new Int32Array(size).fill(-1), list = [], parent = [], via = [];
  const isGoal = bs => bs.every((b, m) => b === targets[m]);
  starts.forEach(s => { if (idx[s] < 0) { idx[s] = list.length; list.push(s); parent.push(-1); via.push(-1); } });
  const succ = [];
  for (let h = 0; h < list.length; h++) {
    const st = dec(list[h]);
    const row = [-1, -1, -1, -1];
    if (!isGoal(st.beads)) for (let m = 0; m < 4; m++) {
      const o2 = B.turn(st.o, m); if (o2 < 0) continue;
      const bs = st.beads.slice(), caught = bs.map((b, q) => b === targets[q] ? 1 : 0);
      settle(B, o2, bs, targets, caught);
      const s2 = enc(o2, bs);
      if (idx[s2] < 0) { idx[s2] = list.length; list.push(s2); parent.push(h); via.push(m); }
      row[m] = idx[s2];
    }
    succ.push(row);
  }
  const goal = list.map(s => isGoal(dec(s).beads));
  return { list, parent, via, succ, goal, enc, dec };
}
// which explored states can still finish (a backward search from the goals)
export function canFinish(ex) {
  const N = ex.list.length, rev = Array.from({ length: N }, () => []), ok = new Uint8Array(N), q = [];
  ex.succ.forEach((row, h) => row.forEach(t => { if (t >= 0) rev[t].push(h); }));
  ex.goal.forEach((g, h) => { if (g) { ok[h] = 1; q.push(h); } });
  for (let i = 0; i < q.length; i++) rev[q[i]].forEach(h => { if (!ok[h]) { ok[h] = 1; q.push(h); } });
  return ok;
}
// the start of a level: beads at their starts, settled at the first orientation
export function startState(B, L, targets) {
  const bs = L.beads.map(b => b.start), caught = bs.map((b, k) => b === targets[k] ? 1 : 0);
  settle(B, L.o0, bs, targets, caught);
  return { o: L.o0, beads: bs, caught };
}
export const targetsOf = (L, driftIdx) => L.beads.map((b, k) => k === 0 && L.drift ? L.drift[driftIdx || 0] : b.target);

// Solve a level. Returns { ok, steps, plan, states, stuck }: plan is the list of turns (0 right,
// 1 left, 2 up, 3 down); stuck counts reachable states from which the goal cannot be reached.
// With drift, every place the target can drift to must be reachable from everywhere.
export function solve(B, L) {
  const report = { ok: true, steps: 0, plan: [], states: 0, stuck: 0 };
  const drift = L.drift || [null];
  let free = null;
  if (L.drift) { // every state the bead can be in while the target is somewhere else
    const t = [-1], s0 = startState(B, L, t), ex = explore(B, [s0.o * B.n + s0.beads[0]], t);
    free = ex.list;
  }
  drift.forEach((_, di) => {
    const targets = targetsOf(L, di), s0 = startState(B, L, targets);
    const enc0 = (targets.length === 1 ? s0.o * B.n + s0.beads[0] : s0.o * B.n * B.n + s0.beads[0] * B.n + s0.beads[1]);
    const ex = explore(B, di === 0 || !free ? [enc0] : free.concat([enc0]), targets), ok = canFinish(ex);
    let stuck = 0; ok.forEach(v => { if (!v) stuck++; });
    report.stuck += stuck; report.states += ex.list.length;
    if (di === 0) {
      const g = ex.goal.findIndex(v => v); // breadth first: the first goal is a shortest one
      if (g < 0) { report.ok = false; return; }
      const plan = []; for (let h = g; ex.parent[h] >= 0; h = ex.parent[h]) plan.unshift(ex.via[h]);
      report.plan = plan; report.steps = plan.length;
    } else if (!ok[0]) report.ok = false;
  });
  return report;
}

// ------------------------------------------------------------------ making mazes (for tools)
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
// a random spanning tree over the globe's grid (it wraps east and west), plus a few loops
export function mazeLinks(seed, loops) {
  const S = GLOBE, rows = S.rows, cols = S.cols, n = rows * cols, R = rng(seed), seen = new Uint8Array(n), links = [];
  const nb = i => { const r = Math.floor(i / cols), c = i % cols, o = [r * cols + (c + 1) % cols, r * cols + (c + cols - 1) % cols]; if (r + 1 < rows) o.push(i + cols); if (r > 0) o.push(i - cols); return o; };
  const stack = [Math.floor(R() * n)]; seen[stack[0]] = 1;
  while (stack.length) {
    const i = stack[stack.length - 1], free = nb(i).filter(j => !seen[j]);
    if (!free.length) { stack.pop(); continue; }
    const j = free[Math.floor(R() * free.length)]; seen[j] = 1; links.push([i, j]); stack.push(j);
  }
  const has = (a, b) => links.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  for (let t = 0, added = 0; added < loops && t < 500; t++) {
    const a = Math.floor(R() * n), ns = nb(a), b = ns[Math.floor(R() * ns.length)];
    if (!has(a, b)) { links.push([a, b]); added++; }
  }
  return links;
}
// the orientation that puts a cell nearest the low point (where a bead rests)
export function lowOrientation(B, cell) {
  let bo = 0, bs = -9; const g = B.g, p = [B.pos[cell * 3], B.pos[cell * 3 + 1], B.pos[cell * 3 + 2]];
  for (let o = 0; o < B.nO; o++) { const v = apply(B.matrix(o), p[0], p[1], p[2]), l = Math.hypot(v[0], v[1], v[2]), s = (v[0] * g[0] + v[1] * g[1] + v[2] * g[2]) / l; if (s > bs) { bs = s; bo = o; } }
  return bo;
}
