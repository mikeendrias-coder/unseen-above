// The turning puzzles on the satellite screen, as pure logic (no Phaser): the orbit ring (one
// axis, the tutorial) and the globe maze (two axes). Both are a grid of cells on a surface in 3D.
// The player turns the surface; gravity pulls each bead down the screen, one groove at a time.
//
// The rule is discrete so the game and the solver agree exactly:
//   * The surface's turn is read in steps (15 degrees on the globe, 11.25 on the ring).
//   * At each step a resting bead looks at the open grooves out of its cell and takes the one that
//     runs most steeply downhill, if it is steep enough. It repeats until nothing moves.
//   * A bead that rolls into its target is caught there. A blurred cell bounces it back.
//   * A target can walk (bead.path). It takes one step along its path on its own clock (L.tick
//     seconds), only while every bead is at rest. It never walks into a bead: it turns round and
//     waits a step instead. A caught target stops.
// The game plays this rule step by step with animation; the solver runs it in a search.
//
// The solver's model of time: a turn is one move, a target step is another ("wait"). A player can
// turn any number of times between two target steps, so every state a real player can reach is in
// the search with no limit on turns (the fast model). To finish, the solver only lets itself make
// L.speed turns between two steps (the slow model), and it proves the puzzle can be finished that
// way from every state the fast model reaches, even one where the turns are used up. So a player
// who turns too fast can never land somewhere a slow player could not get out of, and nothing
// asks for more than L.speed turns per target step.

const D = Math.PI / 180;
// the globe's grid: rows of latitude between 72 N and 72 S, columns of longitude all the way round.
// A level can ask for a finer grid (L.grid = { rows, cols }).
export function globeSpec(grid) {
  const rows = (grid && grid.rows) || 6, cols = (grid && grid.cols) || 12, latN = 72 * D;
  return { rows, cols, latN, rowH: 2 * latN / rows, colW: 2 * Math.PI / cols, step: 15 * D, yawN: 24, pMin: -6, pMax: 6 };
}
export const GLOBE = globeSpec();
export const RING = { rows: 3, cols: 16, R: 66, hw: 28, tilt: -35 * D, step: 11.25 * D, phiN: 32 };
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
// A level: { id, kind: 'globe'|'ring', grid: { rows, cols }, links: [[a,b]...] open grooves (or
// ring: { walls, holes }), gates: [[from,to]] one way, blur: [cells], o0, tick, speed,
// beads: [{ start, target } or { start, path, loop, i0, d0 }] }
export function buildBoard(L) {
  const ring = L.kind === 'ring', S = ring ? RING : globeSpec(L.grid), rows = S.rows, cols = S.cols, n = rows * cols;
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
// A caught bead is locked on its target and is out of the way of the others.
export function stepOnce(B, o, beads, targets, caught) {
  const ev = []; let moved = false;
  for (let k = 0; k < beads.length; k++) {
    if (caught[k]) continue;
    const i = beads[k], j = B.best[o * B.n + i];
    if (j < 0) continue;
    if (B.blur[j]) { ev.push({ k, bounce: j }); continue; }
    let taken = false; for (let m = 0; m < beads.length; m++) if (m !== k && !caught[m] && beads[m] === j) taken = true;
    if (taken) continue;
    beads[k] = j; moved = true; ev.push({ k, from: i, to: j });
    if (j === targets[k]) caught[k] = 1;
  }
  return { moved, ev };
}
export function settle(B, o, beads, targets, caught) { for (let guard = 0; guard < 1000; guard++) if (!stepOnce(B, o, beads, targets, caught).moved) return; }

// ------------------------------------------------------------------ walking targets
// A walking target's state is { i, d }: its place on the path and the way it faces (+1 or -1).
// A loop path's last cell links back to its first; any other path is walked back and forth.
// L.convoy: every walking target keeps the same (i, d) on paths of the same length, so they step
// together, and when one is blocked they all turn round (two contacts moving as one).
export const walks = L => L.beads.some(b => b.path);
export const tInit = L => L.beads.map(b => b.path ? { i: b.i0 || 0, d: b.d0 || 1 } : null);
export const tCells = (L, ts) => L.beads.map((b, k) => b.path ? b.path[ts[k].i] : b.target);
function tAhead(b, i, d) { const n = b.path.length; let j = i + d; if (b.loop) j = (j + n) % n; else if (j < 0 || j >= n) { d = -d; j = i + d; } return { j, d }; }
// where target k goes at its next step: { i, d, cell, blocked }. blockers: the cells of the beads
// that are not caught. Blocked: one of them is in the way (of any target in a convoy), so it
// turns round and waits instead.
export function tPeek(L, ts, k, blockers, caught) {
  const b = L.beads[k]; if (!b.path) return null;
  const a = tAhead(b, ts[k].i, ts[k].d), cell = b.path[a.j];
  let blocked = blockers.includes(cell);
  if (L.convoy) L.beads.forEach((c, q) => { if (c.path && !(caught && caught[q]) && blockers.includes(c.path[a.j])) blocked = true; });
  return { i: a.j, d: a.d, cell, blocked };
}
// one step of every walking target that is not caught; returns the new states
export function tTick(L, ts, blockers, caught) {
  return ts.map((t, k) => {
    if (!t || (caught[k] && !L.convoy)) return t;
    const a = tPeek(L, ts, k, blockers, caught);
    return a.blocked ? { i: t.i, d: -a.d } : { i: a.i, d: a.d };
  });
}

// ------------------------------------------------------------------ the solver
// A state is a number: orientation, every bead's cell (n once it is caught: a caught bead takes
// no further part), the targets' (i, d) (one shared pair in a convoy), and the turns used since
// the targets last stepped (u, only in the slow model). M is the turns allowed between steps
// (Infinity: no limit, and u is always 0). Moves 0 to 3 are turns, 4 is a target step.
function space(B, L, M) {
  const k = L.beads.length, n = B.n, nb = n + 1, nBc = k === 1 ? nb : nb * nb;
  const wk = L.beads.map((b, q) => b.path && (!L.convoy || L.beads.findIndex(c => c.path) === q));
  const tSz = L.beads.map((b, q) => wk[q] ? 2 * b.path.length : 1), nT = tSz.reduce((a, b) => a * b, 1);
  const U = isFinite(M) ? M + 1 : 1, nO = B.nO, size = nO * nBc * nT * U;
  const enc = (o, bs, ts, u) => {
    let tc = 0, mul = 1;
    for (let q = 0; q < k; q++) { if (wk[q]) tc += mul * (ts[q].i * 2 + (ts[q].d > 0 ? 1 : 0)); mul *= tSz[q]; }
    return o + nO * ((k === 1 ? bs[0] : bs[0] * nb + bs[1]) + nBc * (tc + nT * (u || 0)));
  };
  const dec = s => {
    const o = s % nO; s = (s - o) / nO;
    const bc = s % nBc; s = (s - bc) / nBc;
    let tc = s % nT; const u = (s - tc) / nT;
    const ts = []; let shared = null;
    for (let q = 0; q < k; q++) {
      if (wk[q]) { const v = tc % tSz[q]; ts.push({ i: v >> 1, d: v & 1 ? 1 : -1 }); shared = shared || ts[q]; }
      else ts.push(L.beads[q].path ? 'shared' : null);
      tc = Math.floor(tc / tSz[q]);
    }
    for (let q = 0; q < k; q++) if (ts[q] === 'shared') ts[q] = { i: shared.i, d: shared.d };
    return { o, beads: k === 1 ? [bc] : [Math.floor(bc / nb), bc % nb], ts, u };
  };
  return { M, k, n, size, enc, dec, walk: walks(L) };
}
const isGoal = (L, st, n) => st.beads.every(b => b === n);
// the successors of a state: [move, state] pairs
function moves(B, L, sp, st) {
  const out = [], n = sp.n, targets = tCells(L, st.ts), caught = st.beads.map(b => b === n ? 1 : 0);
  if (caught.every(v => v)) return out;
  if (!isFinite(sp.M) || st.u < sp.M) for (let m = 0; m < 4; m++) {
    const o2 = B.turn(st.o, m); if (o2 < 0) continue;
    const bs = st.beads.slice(), c2 = caught.slice();
    settle(B, o2, bs, targets, c2);
    c2.forEach((c, q) => { if (c) bs[q] = n; });
    out.push([m, sp.enc(o2, bs, st.ts, isFinite(sp.M) ? st.u + 1 : 0)]);
  }
  if (sp.walk) {
    const ts2 = tTick(L, st.ts, st.beads, caught), s2 = sp.enc(st.o, st.beads, ts2, 0);
    if (s2 !== sp.enc(st.o, st.beads, st.ts, st.u)) out.push([4, s2]);
  }
  return out;
}
// a set of state numbers (they can pass 2^32) with an index each: open addressing, grows by itself
function StateIndex(dense) {
  if (dense) { const a = new Int32Array(dense).fill(-1); return { get: s => a[s], put: (s, h) => { a[s] = h; } }; }
  let cap = 1 << 16, keys = new Float64Array(cap).fill(-1), vals = new Int32Array(cap), used = 0;
  const slot = (ks, c, s) => { let h = Math.imul((s >>> 0) ^ Math.imul(Math.floor(s / 4294967296), 0x9e3779b1), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; let i = h & (c - 1); while (ks[i] !== -1 && ks[i] !== s) i = (i + 1) & (c - 1); return i; };
  const grow = () => { const c2 = cap * 2, k2 = new Float64Array(c2).fill(-1), v2 = new Int32Array(c2); for (let i = 0; i < cap; i++) if (keys[i] !== -1) { const j = slot(k2, c2, keys[i]); k2[j] = keys[i]; v2[j] = vals[i]; } cap = c2; keys = k2; vals = v2; };
  return {
    get: s => { const i = slot(keys, cap, s); return keys[i] === -1 ? -1 : vals[i]; },
    put: (s, h) => { if (used * 2 > cap) grow(); const i = slot(keys, cap, s); if (keys[i] === -1) used++; keys[i] = s; vals[i] = h; }
  };
}
// growable typed arrays
function Grow(T) { let a = new T(1 << 16), n = 0; return { push: v => { if (n === a.length) { const b = new T(a.length * 2); b.set(a); a = b; } a[n++] = v; return n - 1; }, at: i => a[i], set: (i, v) => { a[i] = v; }, get length() { return n; }, view: () => a.subarray(0, n) }; }
// a breadth-first search from a list of start states; keeps each state's successors
function explore(B, L, sp, starts, stopAtGoal) {
  const idx = StateIndex(sp.size <= 6e7 ? sp.size : 0);
  const list = Grow(Float64Array), parent = Grow(Int32Array), via = Grow(Int8Array), goal = Grow(Uint8Array), succ = Grow(Int32Array), sOff = Grow(Int32Array);
  starts.forEach(s => { if (idx.get(s) < 0) { idx.put(s, list.length); list.push(s); parent.push(-1); via.push(-1); } });
  let firstGoal = -1; sOff.push(0);
  for (let h = 0; h < list.length; h++) {
    const st = sp.dec(list.at(h)), g = isGoal(L, st, sp.n); goal.push(g ? 1 : 0);
    if (g && firstGoal < 0) { firstGoal = h; if (stopAtGoal) break; }
    if (!g) moves(B, L, sp, st).forEach(([m, s2]) => {
      let t = idx.get(s2);
      if (t < 0) { t = list.length; idx.put(s2, t); list.push(s2); parent.push(h); via.push(m); }
      succ.push(t);
    });
    sOff.push(succ.length);
  }
  return { n: list.length, list: list.view(), parent: parent.view(), via: via.view(), succ: succ.view(), sOff: sOff.view(), goal: goal.view(), firstGoal };
}
// which explored states can still finish (a backward search from the goals)
function canFinish(ex) {
  const N = ex.n, cnt = new Int32Array(N + 1);
  for (let h = 0; h < N; h++) for (let a = ex.sOff[h]; a < ex.sOff[h + 1]; a++) cnt[ex.succ[a] + 1]++;
  for (let i = 0; i < N; i++) cnt[i + 1] += cnt[i];
  const rev = new Int32Array(cnt[N]), fill = cnt.slice(0, N);
  for (let h = 0; h < N; h++) for (let a = ex.sOff[h]; a < ex.sOff[h + 1]; a++) rev[fill[ex.succ[a]]++] = h;
  const ok = new Uint8Array(N), q = [];
  ex.goal.forEach((g, h) => { if (g) { ok[h] = 1; q.push(h); } });
  for (let i = 0; i < q.length; i++) { const t = q[i]; for (let a = cnt[t]; a < cnt[t + 1]; a++) { const h = rev[a]; if (!ok[h]) { ok[h] = 1; q.push(h); } } }
  return ok;
}
// the start of a level: beads at their starts, settled at the first orientation
export function startState(B, L) {
  const ts = tInit(L), targets = tCells(L, ts), bs = L.beads.map(b => b.start), caught = bs.map((b, k) => b === targets[k] ? 1 : 0);
  settle(B, L.o0, bs, targets, caught);
  return { o: L.o0, beads: bs, caught, ts };
}
// the turns the solver allows itself between two target steps
export const speedOf = L => walks(L) ? (L.speed || 3) : Infinity;

// A plan from a state: the shortest list of moves (0 right, 1 left, 2 up, 3 down, 4 wait for the
// target's step) that catches every target, never more than speedOf(L) turns between two steps.
// st: { o, beads, caught, ts } and u, the turns already made since the last step.
export function planFrom(B, L, st) {
  const sp = space(B, L, speedOf(L)), bs = st.beads.map((b, q) => st.caught && st.caught[q] ? B.n : b);
  const ex = explore(B, L, sp, [sp.enc(st.o, bs, st.ts, isFinite(sp.M) ? Math.min(sp.M, st.u || 0) : 0)], true);
  if (ex.firstGoal < 0) return null;
  const plan = []; for (let h = ex.firstGoal; ex.parent[h] >= 0; h = ex.parent[h]) plan.unshift(ex.via[h]);
  return plan;
}

// Solve a level. Returns { ok, steps, turns, waits, plan, states, stuck }: plan is the shortest
// list of moves; stuck counts states a player can reach from which the slow model cannot finish
// (0 means no dead ends, however fast or slow the player turns).
export function solve(B, L) {
  const report = { ok: true, steps: 0, turns: 0, waits: 0, plan: [], states: 0, stuck: 0, reach: 0 };
  const s0 = startState(B, L), M = speedOf(L), slow = space(B, L, M);
  const a = explore(B, L, slow, [slow.enc(s0.o, s0.beads, s0.ts, 0)]);
  if (a.firstGoal < 0) { report.ok = false; return report; }
  const plan = []; for (let h = a.firstGoal; a.parent[h] >= 0; h = a.parent[h]) plan.unshift(a.via[h]);
  Object.assign(report, { plan, steps: plan.length, turns: plan.filter(m => m < 4).length, waits: plan.filter(m => m === 4).length });
  let ex = a;
  if (isFinite(M)) {
    // every state a fast player can reach, then from each with no turns left: can it finish?
    const fast = space(B, L, Infinity), F = explore(B, L, fast, [fast.enc(s0.o, s0.beads, s0.ts, 0)]);
    report.reach = F.n;
    const starts = [slow.enc(s0.o, s0.beads, s0.ts, 0)];
    F.list.forEach(s => { const st = fast.dec(s); starts.push(slow.enc(st.o, st.beads, st.ts, M)); });
    ex = explore(B, L, slow, starts);
  } else report.reach = a.n;
  const ok = canFinish(ex);
  let stuck = 0; ok.forEach(v => { if (!v) stuck++; });
  report.stuck = stuck; report.states = ex.n;
  if (stuck) report.ok = false;
  return report;
}

// ------------------------------------------------------------------ making mazes (for tools)
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
// a random spanning tree over the globe's grid (it wraps east and west), plus a few loops
export function mazeLinks(seed, loops, grid) {
  const S = globeSpec(grid), rows = S.rows, cols = S.cols, n = rows * cols, R = rng(seed), seen = new Uint8Array(n), links = [];
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
// the orientation that puts a cell nearest the low point (where a bead rests), with the
// equator toward us rather than a pole where it can
export function lowOrientation(B, cell) {
  let bo = 0, bs = -9; const g = B.g, p = [B.pos[cell * 3], B.pos[cell * 3 + 1], B.pos[cell * 3 + 2]];
  for (let o = 0; o < B.nO; o++) { const v = apply(B.matrix(o), p[0], p[1], p[2]), l = Math.hypot(v[0], v[1], v[2]), s = (v[0] * g[0] + v[1] * g[1] + v[2] * g[2]) / l - (B.ring ? 0 : 0.35 * Math.abs(B.angles(o).pitch) / (Math.PI / 2)); if (s > bs) { bs = s; bo = o; } }
  return bo;
}
