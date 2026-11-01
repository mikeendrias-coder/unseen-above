/*
 * Routing puzzle logic (Zip style), written from scratch for this project.
 *
 * A board is a graph: cells plus adjacency. That one model covers a flat grid,
 * a grid with walls, a grid whose edges wrap ("orbit"), and the surface of a cube.
 *
 * Rules: one path starts on checkpoint 1, ends on the last checkpoint, visits
 * every cell exactly once, and passes the checkpoints in order.
 */
(function (root) {
  'use strict';

  // ---------- seeded random ----------
  function makeRng(seed) {
    let s = (seed >>> 0) || 0x9e3779b9;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------- boards ----------
  const edgeKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

  function gridBoard(w, h, opts) {
    opts = opts || {};
    const wrapX = !!opts.wrapX, wrapY = !!opts.wrapY;
    const walls = new Set((opts.walls || []).map(([a, b]) => edgeKey(a, b)));
    const n = w * h;
    const adj = [];
    for (let c = 0; c < n; c++) {
      const x = c % w, y = Math.floor(c / w);
      const out = [];
      const tryAdd = (nx, ny) => {
        if (wrapX) nx = (nx + w) % w;
        if (wrapY) ny = (ny + h) % h;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const d = ny * w + nx;
        if (d === c || walls.has(edgeKey(c, d)) || out.includes(d)) return;
        out.push(d);
      };
      tryAdd(x + 1, y); tryAdd(x - 1, y); tryAdd(x, y + 1); tryAdd(x, y - 1);
      adj.push(out);
    }
    return { kind: 'grid', w, h, n, wrapX, wrapY, walls: [...walls], adj };
  }

  // Cube surface with m x m cells per face. Each cell knows its face, its 3D
  // centre on a cube spanning -1..1, and the face's tangent axes (for drawing).
  const FACES = [
    { name: '+X', N: [1, 0, 0], U: [0, 0, -1], V: [0, 1, 0] },
    { name: '-X', N: [-1, 0, 0], U: [0, 0, 1], V: [0, 1, 0] },
    { name: '+Y', N: [0, 1, 0], U: [1, 0, 0], V: [0, 0, -1] },
    { name: '-Y', N: [0, -1, 0], U: [1, 0, 0], V: [0, 0, 1] },
    { name: '+Z', N: [0, 0, 1], U: [1, 0, 0], V: [0, 1, 0] },
    { name: '-Z', N: [0, 0, -1], U: [-1, 0, 0], V: [0, 1, 0] },
  ];
  function cubeBoard(m) {
    const cells = [];
    FACES.forEach((f, fi) => {
      for (let j = 0; j < m; j++) {
        for (let i = 0; i < m; i++) {
          const u = -1 + (2 * i + 1) / m, v = -1 + (2 * j + 1) / m;
          const p = [0, 1, 2].map(k => f.N[k] + f.U[k] * u + f.V[k] * v);
          cells.push({ face: fi, i, j, p });
        }
      }
    });
    const n = cells.length;
    const same = 2 / m, cross = Math.SQRT2 / m, eps = 1e-6;
    const adj = cells.map(() => []);
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const A = cells[a].p, B = cells[b].p;
        const d = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
        const ok = cells[a].face === cells[b].face ? Math.abs(d - same) < eps : Math.abs(d - cross) < eps;
        if (ok) { adj[a].push(b); adj[b].push(a); }
      }
    }
    return { kind: 'cube', m, n, cells, faces: FACES, adj };
  }

  // ---------- solver ----------
  // Counts solutions up to `limit`. `prefix` (optional) is a path already drawn
  // from checkpoint 1. Returns { count, solution, exhausted } where `solution`
  // is the first full path found and `exhausted` is true if the node budget ran out.
  function solve(board, checkpoints, opts) {
    opts = opts || {};
    const limit = opts.limit || 2;
    const budget = opts.budget || 2e6;
    const n = board.n, adj = board.adj;
    const order = new Int32Array(n).fill(-1);
    checkpoints.forEach((c, i) => { order[c] = i; });
    const last = checkpoints[checkpoints.length - 1];
    const visited = new Uint8Array(n);
    const path = [];
    let nextCp = 0, nodes = 0, count = 0, first = null, exhausted = false;

    const all = [];
    const prefix = opts.prefix && opts.prefix.length ? opts.prefix : [checkpoints[0]];
    for (const c of prefix) {
      if (visited[c]) return { count: 0, solution: null, solutions: all, exhausted: false };
      if (order[c] >= 0) {
        if (order[c] !== nextCp) return { count: 0, solution: null, solutions: all, exhausted: false };
        nextCp++;
      }
      visited[c] = 1; path.push(c);
    }

    const queue = new Int32Array(n);
    const seen = new Uint8Array(n);
    function prune(head) {
      const remaining = n - path.length;
      if (remaining === 0) return false;
      // dead ends: an unvisited cell with one way in must be the final cell
      let deadEnds = 0;
      for (let u = 0; u < n; u++) {
        if (visited[u]) continue;
        let deg = 0;
        for (const v of adj[u]) if (!visited[v] || v === head) deg++;
        if (deg === 0) return true;
        if (deg === 1) {
          if (u !== last) return true;
          if (++deadEnds > 1) return true;
        }
      }
      // connectivity: every unvisited cell reachable from the head
      seen.fill(0);
      let qh = 0, qt = 0, reached = 0;
      for (const v of adj[head]) if (!visited[v] && !seen[v]) { seen[v] = 1; queue[qt++] = v; }
      while (qh < qt) {
        const u = queue[qh++]; reached++;
        for (const v of adj[u]) if (!visited[v] && !seen[v]) { seen[v] = 1; queue[qt++] = v; }
      }
      return reached !== remaining;
    }

    function dfs(head) {
      if (count >= limit || exhausted) return;
      if (++nodes > budget) { exhausted = true; return; }
      if (path.length === n) {
        if (head === last && nextCp === checkpoints.length) {
          count++;
          const s = path.slice();
          if (!first) first = s;
          all.push(s);
        }
        return;
      }
      if (prune(head)) return;
      for (const v of adj[head]) {
        if (visited[v]) continue;
        const o = order[v];
        if (o >= 0 && o !== nextCp) continue;
        if (v === last && path.length !== n - 1) continue;
        visited[v] = 1; path.push(v); if (o >= 0) nextCp++;
        dfs(v);
        visited[v] = 0; path.pop(); if (o >= 0) nextCp--;
        if (count >= limit || exhausted) return;
      }
    }
    dfs(path[path.length - 1]);
    return { count, solution: first, solutions: all, exhausted };
  }

  // ---------- generator ----------
  // A random Hamiltonian path: start from any Hamiltonian path, then apply many
  // "backbite" moves (join an end to one of its graph neighbours, reverse the
  // segment in between). Every move keeps the path Hamiltonian.
  function initialPath(board, rng) {
    if (board.kind === 'grid' && !board.walls.length) {
      const p = [];
      for (let y = 0; y < board.h; y++) {
        for (let i = 0; i < board.w; i++) p.push(y * board.w + (y % 2 ? board.w - 1 - i : i));
      }
      return p;
    }
    // Warnsdorff-guided depth-first search with restarts (cube, walled grids)
    for (let attempt = 0; attempt < 200; attempt++) {
      const start = Math.floor(rng() * board.n);
      const visited = new Uint8Array(board.n);
      const path = [start]; visited[start] = 1;
      let steps = 0, ok = false;
      const go = head => {
        if (path.length === board.n) { ok = true; return; }
        if (++steps > 20000) return;
        const opts = board.adj[head].filter(v => !visited[v]);
        shuffle(opts, rng);
        opts.sort((a, b) => board.adj[a].filter(v => !visited[v]).length - board.adj[b].filter(v => !visited[v]).length);
        for (const v of opts) {
          visited[v] = 1; path.push(v);
          go(v);
          if (ok) return;
          visited[v] = 0; path.pop();
        }
      };
      go(start);
      if (ok) return path;
    }
    throw new Error('no Hamiltonian path found');
  }

  function backbite(board, path, rng, moves) {
    const n = path.length;
    const index = new Int32Array(board.n);
    let p = path.slice();
    const reindex = () => p.forEach((c, i) => { index[c] = i; });
    reindex();
    for (let k = 0; k < moves; k++) {
      const atStart = rng() < 0.5;
      const end = atStart ? p[0] : p[n - 1];
      const nbrs = board.adj[end];
      const q = nbrs[Math.floor(rng() * nbrs.length)];
      const i = index[q];
      if (atStart) {
        if (i === 1) continue;
        // p0..p(i-1) reversed, then p(i)..end
        const head = p.slice(0, i).reverse();
        p = head.concat(p.slice(i));
      } else {
        if (i === n - 2) continue;
        // p0..p(i), then p(n-1)..p(i+1)
        const tail = p.slice(i + 1).reverse();
        p = p.slice(0, i + 1).concat(tail);
      }
      reindex();
    }
    return p;
  }

  // Builds a puzzle with a unique solution. Returns { board, checkpoints, solution, walls }.
  // Strategy: start with a few numbered checkpoints, then repeatedly sample
  // competing solutions and add the single clue (a checkpoint, or a wall on a
  // grid) that rules out the most of them. Every clue added is consistent with
  // the intended path, so the intended path always stays a solution.
  // opts: { seed, initialCheckpoints, maxCheckpoints, allowWalls, maxWalls, sample, budget }
  function generate(makeBoard, opts) {
    opts = opts || {};
    const rng = makeRng(opts.seed || 1);
    let walls = [];
    let board = makeBoard(walls);
    const n = board.n;
    const intended = backbite(board, initialPath(board, rng), rng, n * 60);
    const key = intended.join(',');
    const ours = new Set();
    for (let k = 1; k < n; k++) ours.add(edgeKey(intended[k - 1], intended[k]));

    const cpSet = new Set([0, n - 1]);
    const initial = opts.initialCheckpoints != null ? opts.initialCheckpoints : Math.max(1, Math.round(n / 10));
    for (let k = 1; k <= initial; k++) {
      const mid = Math.round(k * (n - 1) / (initial + 1)) + Math.floor((rng() - 0.5) * 3);
      cpSet.add(Math.min(n - 2, Math.max(1, mid)));
    }
    const maxCp = opts.maxCheckpoints || Math.ceil(n / 3);
    const maxWalls = opts.maxWalls != null ? opts.maxWalls : Math.ceil(n / 8);
    const sample = opts.sample || 24;
    const budget = opts.budget || 3e5;

    for (let round = 0; round < 400; round++) {
      const cpIdx = [...cpSet].sort((a, b) => a - b);
      const checkpoints = cpIdx.map(k => intended[k]);
      const r = solve(board, checkpoints, { limit: sample, budget });
      if (!r.exhausted && r.count === 1) return { board, checkpoints, solution: intended, walls: walls.slice() };
      if (!r.exhausted && r.count === 0) throw new Error('intended path lost');
      const alts = r.solutions.filter(s => s.join(',') !== key);

      // score every possible checkpoint by how many sampled rivals it rules out
      const isCp = new Uint8Array(n);
      checkpoints.forEach(c => { isCp[c] = 1; });
      const segOf = p => { const seg = new Int32Array(n); let s = 0; for (const c of p) { if (isCp[c]) s++; seg[c] = s; } return seg; };
      const sP = segOf(intended);
      const sAs = alts.map(segOf);
      let bestK = -1, bestScore = 0;
      for (let k = 1; k < n - 1; k++) {
        const c = intended[k];
        if (isCp[c]) continue;
        let score = 0;
        for (const sA of sAs) if (sA[c] !== sP[c]) score++;
        // tie-break toward splitting long stretches without clues
        let prev = 0, next = n - 1;
        for (const ci of cpIdx) { if (ci < k) prev = ci; else if (ci > k) { next = ci; break; } }
        const gap = Math.min(k - prev, next - k);
        const total = score * 1000 + gap * 10 + rng();
        if (score > 0 && total > bestScore) { bestScore = total; bestK = k; }
      }
      // score walls (grids only): edges rivals use and we do not
      let bestWall = null, bestWallScore = 0;
      if (opts.allowWalls && board.kind === 'grid' && walls.length < maxWalls && alts.length) {
        const counts = new Map();
        for (const a of alts) {
          const seen = new Set();
          for (let k = 1; k < a.length; k++) {
            const e = edgeKey(a[k - 1], a[k]);
            if (!ours.has(e) && !seen.has(e)) { seen.add(e); counts.set(e, (counts.get(e) || 0) + 1); }
          }
        }
        for (const [e, c] of counts) {
          const s = c * 1000 + rng();
          if (s > bestWallScore) { bestWallScore = s; bestWall = e; }
        }
      }
      const cpScore = Math.floor(bestScore / 1000), wallScore = Math.floor(bestWallScore / 1000);
      const preferWall = bestWall && (cpSet.size >= maxCp || wallScore > cpScore * 1.5 || (wallScore >= cpScore && rng() < (opts.wallBias || 0.3)));
      if (preferWall) {
        const [a, b] = bestWall.split('|').map(Number);
        walls.push([a, b]);
        board = makeBoard(walls);
        continue;
      }
      if (bestK > 0) { cpSet.add(bestK); continue; }
      // Search ran out of budget or found nothing to score: split the longest gap.
      let gapStart = 0, gapLen = 0;
      for (let k = 1; k < cpIdx.length; k++) {
        if (cpIdx[k] - cpIdx[k - 1] > gapLen) { gapLen = cpIdx[k] - cpIdx[k - 1]; gapStart = cpIdx[k - 1]; }
      }
      if (gapLen < 2) throw new Error('could not make the solution unique');
      cpSet.add(gapStart + Math.floor(gapLen / 2));
    }
    throw new Error('could not make the solution unique');
  }

  // Is the puzzle still solvable from the player's current path?
  function solvableFrom(board, checkpoints, prefix, budget) {
    const r = solve(board, checkpoints, { limit: 1, prefix, budget: budget || 1.5e5 });
    return { ok: r.count > 0, unknown: r.exhausted && r.count === 0, solution: r.solution };
  }

  const api = { makeRng, shuffle, edgeKey, gridBoard, cubeBoard, FACES, solve, generate, solvableFrom, backbite, initialPath };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ZipLogic = api;
})(typeof self !== 'undefined' ? self : this);
