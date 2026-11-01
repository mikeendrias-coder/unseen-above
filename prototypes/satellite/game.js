/* Routing puzzle prototype scene. Placeholder art. Written from scratch. */
(function () {
  'use strict';
  const Z = window.ZipLogic;
  const LEVELS = window.ROUTING_LEVELS;
  const W = 960, H = 540;
  const DPR = Math.min(2, Math.max(1, Math.round((window.devicePixelRatio || 1) * 2) / 2));
  const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
  const C = {
    bg: 0x0a0f14, panel: 0x0e161f, rule: 0x1e2b38, board: 0x0f1821, cell: 0x15212c,
    line: 0x7fd8ff, done: 0x9ef0c2, dot: 0xe6eef5, bad: 0xff6b5a, wall: 0xd7e2ec,
    warn: 0xffb84d, wrap: 0x3d7f9c, btn: 0x16222e, btnHi: 0x203242
  };
  const T = { text: '#c8d4df', dim: '#6f8496', dark: '#0a0f14', warn: '#ffb84d', ok: '#9ef0c2' };
  const RULES = {
    basic: 'Draw one line from 1 through every square. Pass the numbers in order. Drag back to undo.',
    walls: 'Bars block the link between two squares.',
    orbit: 'The left and right edges connect. Drag off one side and the line comes back on the other.',
    rotate: 'The board turns a quarter. Your line turns with it. The button under the board switches when it turns: every 12 seconds, or each time you reach a number.',
    moving: 'Numbers you have not reached yet can drift to a nearby square. An orange ring warns you first.',
    cube2: 'The line runs over the cube\'s edges. Turn the cube with the arrow keys or the buttons.',
    cube3: 'Same rules on a bigger cube. Press the end of your line to keep drawing after a turn.'
  };

  const txt = (scene, x, y, s, size, color, extra) =>
    scene.add.text(x, y, s, Object.assign({ fontFamily: FONT, fontSize: size + 'px', color: color || T.text, resolution: DPR * 2 }, extra || {}));

  function button(scene, x, y, w, h, label, onClick) {
    const bg = scene.add.graphics();
    const draw = hi => { bg.clear(); bg.fillStyle(hi ? C.btnHi : C.btn, 1); bg.fillRoundedRect(x, y, w, h, 6); bg.lineStyle(1, C.rule, 1); bg.strokeRoundedRect(x, y, w, h, 6); };
    draw(false);
    const t = txt(scene, x + w / 2, y + h / 2, label, 13, T.text).setOrigin(0.5);
    const zone = scene.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout', () => draw(false));
    zone.on('pointerdown', (p, lx, ly, ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); onClick(); });
    return { bg, t, zone, setLabel: s => t.setText(s), setVisible: v => { bg.setVisible(v); t.setVisible(v); zone.setVisible(v); if (v) zone.setInteractive(); else zone.disableInteractive(); } };
  }

  // ---------------- flat grid view ----------------
  class GridView {
    constructor(scene, level, board, cx, cy, maxSize) {
      this.scene = scene; this.level = level; this.board = board;
      this.w = level.w; this.h = level.h;
      this.cs = Math.floor(Math.min(maxSize / Math.max(this.w, this.h), 72));
      this.root = scene.add.container(cx, cy);
      this.g = scene.add.graphics();
      this.pathG = scene.add.graphics();
      this.dotsG = scene.add.graphics();
      this.fx = scene.add.graphics();
      this.root.add([this.g, this.pathG, this.dotsG]);
      this.labels = [];
      this.root.add(this.fx);
      this.drawStatic();
    }
    center(c) { const x = c % this.w, y = Math.floor(c / this.w); return { x: (x - (this.w - 1) / 2) * this.cs, y: (y - (this.h - 1) / 2) * this.cs }; }
    toLocal(px, py) {
      const dx = px - this.root.x, dy = py - this.root.y, r = this.root.rotation, c = Math.cos(r), s = Math.sin(r);
      return { x: dx * c + dy * s, y: -dx * s + dy * c };
    }
    inside(px, py) {
      const l = this.toLocal(px, py), hx = this.w * this.cs / 2, hy = this.h * this.cs / 2;
      return Math.abs(l.x) <= hx && Math.abs(l.y) <= hy;
    }
    cellAt(px, py, allowWrap) {
      const l = this.toLocal(px, py);
      let gx = Math.floor(l.x / this.cs + this.w / 2);
      const gy = Math.floor(l.y / this.cs + this.h / 2);
      if (gy < 0 || gy >= this.h) return -1;
      if (gx < 0 || gx >= this.w) {
        if (allowWrap && this.level.wrapX && (gx === -1 || gx === this.w)) gx = (gx + this.w) % this.w;
        else return -1;
      }
      return gy * this.w + gx;
    }
    isWrapEdge(a, b) {
      const ax = a % this.w, bx = b % this.w;
      return Math.floor(a / this.w) === Math.floor(b / this.w) && Math.abs(ax - bx) === this.w - 1 && this.w > 2;
    }
    drawStatic() {
      const g = this.g, cs = this.cs, hx = this.w * cs / 2, hy = this.h * cs / 2;
      g.clear();
      g.fillStyle(C.board, 1); g.fillRoundedRect(-hx - 10, -hy - 10, hx * 2 + 20, hy * 2 + 20, 10);
      for (let c = 0; c < this.board.n; c++) {
        const p = this.center(c);
        g.fillStyle(C.cell, 1); g.fillRoundedRect(p.x - cs / 2 + 2, p.y - cs / 2 + 2, cs - 4, cs - 4, 5);
      }
      if (this.level.wrapX) {
        g.fillStyle(C.wrap, 1);
        for (let y = 0; y < this.h; y++) {
          const yy = (y - (this.h - 1) / 2) * cs, s = Math.max(5, cs * 0.12);
          g.fillTriangle(-hx - 4, yy - s, -hx - 4, yy + s, -hx - 4 - s, yy);
          g.fillTriangle(hx + 4, yy - s, hx + 4, yy + s, hx + 4 + s, yy);
        }
      }
      g.lineStyle(Math.max(4, Math.round(cs * 0.09)), C.wall, 1);
      for (const [a, b] of this.level.walls) {
        const ax = a % this.w, ay = Math.floor(a / this.w), bx = b % this.w, by = Math.floor(b / this.w);
        if (this.isWrapEdge(a, b)) {
          const y0 = (ay - this.h / 2) * cs, y1 = y0 + cs;
          g.lineBetween(-hx, y0 + 3, -hx, y1 - 3); g.lineBetween(hx, y0 + 3, hx, y1 - 3);
        } else if (ax !== bx) {
          const x = (Math.max(ax, bx) - this.w / 2) * cs, y0 = (ay - this.h / 2) * cs;
          g.lineBetween(x, y0 + 3, x, y0 + cs - 3);
        } else {
          const y = (Math.max(ay, by) - this.h / 2) * cs, x0 = (ax - this.w / 2) * cs;
          g.lineBetween(x0 + 3, y, x0 + cs - 3, y);
        }
      }
    }
    render(st) {
      const cs = this.cs, pg = this.pathG, lw = Math.max(6, Math.round(cs * 0.3));
      const col = st.solved ? C.done : C.line;
      pg.clear();
      const path = st.path;
      if (path.length) {
        pg.lineStyle(lw, col, 1);
        for (let i = 1; i < path.length; i++) {
          const a = this.center(path[i - 1]), b = this.center(path[i]);
          if (this.isWrapEdge(path[i - 1], path[i])) {
            const hx = this.w * cs / 2, sa = a.x < 0 ? -1 : 1;
            pg.lineBetween(a.x, a.y, sa * (hx + 6), a.y);
            pg.lineBetween(-sa * (hx + 6), b.y, b.x, b.y);
          } else pg.lineBetween(a.x, a.y, b.x, b.y);
        }
        pg.fillStyle(col, 1);
        for (const c of path) { const p = this.center(c); pg.fillCircle(p.x, p.y, lw / 2); }
      }
      // checkpoints
      const dg = this.dotsG; dg.clear();
      while (this.labels.length < st.checkpoints.length) {
        const t = txt(this.scene, 0, 0, '', Math.max(12, Math.round(cs * 0.3)), T.dark, { fontStyle: 'bold' }).setOrigin(0.5);
        this.root.add(t); this.labels.push(t);
      }
      st.checkpoints.forEach((c, i) => {
        const p = this.center(c), reached = i < st.nextIdx;
        dg.fillStyle(st.badIdx === i ? C.bad : reached ? col : C.dot, 1);
        dg.fillCircle(p.x, p.y, cs * 0.31);
        const t = this.labels[i];
        t.setText(String(i + 1)).setPosition(p.x, p.y).setRotation(-this.root.rotation).setVisible(true);
      });
      for (let i = st.checkpoints.length; i < this.labels.length; i++) this.labels[i].setVisible(false);
      this.drawFx(st, this.scene.time.now);
    }
    drawFx(st, now) {
      const fx = this.fx; fx.clear();
      const cs = this.cs;
      if (st.path.length && !st.solved) {
        const p = this.center(st.path[st.path.length - 1]);
        fx.lineStyle(2, 0xffffff, 0.35 + 0.35 * Math.sin(now / 180));
        fx.strokeCircle(p.x, p.y, cs * 0.42);
      }
      if (st.warnCell >= 0) {
        const p = this.center(st.warnCell), a = 0.5 + 0.5 * Math.sin(now / 90);
        fx.lineStyle(3, C.warn, a); fx.strokeCircle(p.x, p.y, cs * 0.4);
      }
      if (st.rotateWarn) {
        const hx = this.w * cs / 2 + 10, hy = this.h * cs / 2 + 10, a = 0.4 + 0.6 * Math.abs(Math.sin(now / 120));
        fx.lineStyle(3, C.warn, a); fx.strokeRoundedRect(-hx, -hy, hx * 2, hy * 2, 10);
      }
    }
    tick(st) { this.drawFx(st, this.scene.time.now); }
    destroy() { this.root.destroy(); }
  }

  // ---------------- cube view (isometric, turnable) ----------------
  const COS30 = Math.cos(Math.PI / 6);
  const mul = (A, B) => A.map((r, i) => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const apply = (R, p) => [0, 1, 2].map(i => R[i][0] * p[0] + R[i][1] * p[1] + R[i][2] * p[2]);
  const rotM = (axis, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return axis === 'x' ? [[1, 0, 0], [0, c, -s], [0, s, c]] : [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  };
  const roundM = M => M.map(r => r.map(v => Math.round(v)));
  const inPoly = (pts, x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  class CubeView {
    constructor(scene, level, board, cx, cy, size) {
      this.scene = scene; this.level = level; this.board = board; this.m = level.m;
      this.cx = cx; this.cy = cy; this.S = size / 4;
      this.R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      this.anim = null;
      this.g = scene.add.graphics(); this.pathG = scene.add.graphics(); this.dotsG = scene.add.graphics(); this.fx = scene.add.graphics();
      this.labels = [];
      this.polys = [];
      this.last = null;
      // start turned so that number 1 (and as many early numbers as possible) face the player
      const cps = level.checkpoints, cells = board.cells;
      let best = null, bestScore = -1;
      for (let yaw = 0; yaw < 4; yaw++) for (let pitch = 0; pitch < 4; pitch++) {
        const Rc = roundM(mul(rotM('x', pitch * Math.PI / 2), rotM('y', yaw * Math.PI / 2)));
        if (!this.faceVisible(Rc, cells[cps[0]].face)) continue;
        let score = 0;
        for (let i = 0; i < Math.min(4, cps.length); i++) if (this.faceVisible(Rc, cells[cps[i]].face)) score += 4 - i;
        if (score > bestScore) { bestScore = score; best = Rc; }
      }
      if (best) this.R = best;
    }
    curR(now) {
      if (!this.anim) return this.R;
      const t = Math.min(1, (now - this.anim.t0) / this.anim.dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      return mul(rotM(this.anim.axis, this.anim.ang * e), this.anim.R0);
    }
    proj(R, p) { const q = apply(R, p); return { x: this.cx + (q[0] - q[2]) * COS30 * this.S, y: this.cy + (q[0] + q[2]) * 0.5 * this.S - q[1] * this.S }; }
    faceVisible(R, fi) { const n = apply(R, this.board.faces[fi].N); return n[0] + n[1] + n[2] > 0.05; }
    turn(axis, dir) {
      if (this.anim) return;
      this.anim = { axis, ang: dir * Math.PI / 2, t0: this.scene.time.now, dur: 380, R0: this.R };
    }
    busy() { return !!this.anim; }
    cellAt(px, py) {
      if (this.anim) return -1;
      for (const poly of this.polys) if (inPoly(poly.pts, px, py)) return poly.c;
      return -1;
    }
    inside(px, py) { return this.cellAt(px, py) >= 0; }
    render(st) { this.last = st; this.draw(st, this.scene.time.now); }
    tick(st) {
      const now = this.scene.time.now;
      if (this.anim && now - this.anim.t0 >= this.anim.dur) {
        this.R = roundM(mul(rotM(this.anim.axis, this.anim.ang), this.anim.R0));
        this.anim = null;
      }
      this.draw(st, now);
    }
    draw(st, now) {
      const R = this.curR(now), m = this.m, cells = this.board.cells, faces = this.board.faces;
      const vis = faces.map((f, fi) => this.faceVisible(R, fi));
      const g = this.g; g.clear(); this.polys = [];
      const cellPx = this.S * 2 / m;
      cells.forEach((cell, c) => {
        if (!vis[cell.face]) return;
        const f = faces[cell.face], k = 0.92 / m;
        const corner = (su, sv) => this.proj(R, [0, 1, 2].map(i => cell.p[i] + f.U[i] * su * k + f.V[i] * sv * k));
        const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
        const n = apply(R, f.N), shade = 0.75 + 0.25 * Math.max(0, (n[0] + n[1] + n[2]) / Math.sqrt(3));
        const k2 = shade * 1.15, ch = sh => Math.min(255, Math.round(((C.cell >> sh) & 255) * k2));
        const col = (ch(16) << 16) | (ch(8) << 8) | ch(0);
        g.fillStyle(col, 1); g.fillPoints(pts, true);
        const hitK = 1 / m;
        const hc = (su, sv) => this.proj(R, [0, 1, 2].map(i => cell.p[i] + f.U[i] * su * hitK + f.V[i] * sv * hitK));
        this.polys.push({ c, pts: [hc(-1, -1), hc(1, -1), hc(1, 1), hc(-1, 1)] });
      });
      // face outlines
      g.lineStyle(2, C.rule, 1);
      faces.forEach((f, fi) => {
        if (!vis[fi]) return;
        const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([su, sv]) => this.proj(R, [0, 1, 2].map(i => f.N[i] + f.U[i] * su + f.V[i] * sv)));
        g.strokePoints(pts, true, true);
      });
      // path
      const pg = this.pathG; pg.clear();
      const col = st.solved ? C.done : C.line, lw = Math.max(5, cellPx * 0.28);
      const path = st.path;
      pg.lineStyle(lw, col, 1);
      for (let i = 1; i < path.length; i++) {
        const A = cells[path[i - 1]], B = cells[path[i]];
        if (A.face === B.face) {
          if (vis[A.face]) { const a = this.proj(R, A.p), b = this.proj(R, B.p); pg.lineBetween(a.x, a.y, b.x, b.y); }
        } else {
          const NB = faces[B.face].N, Mp = [0, 1, 2].map(k => A.p[k] + NB[k] / m), mid = this.proj(R, Mp);
          if (vis[A.face]) { const a = this.proj(R, A.p); pg.lineBetween(a.x, a.y, mid.x, mid.y); }
          if (vis[B.face]) { const b = this.proj(R, B.p); pg.lineBetween(mid.x, mid.y, b.x, b.y); }
          if (vis[A.face] || vis[B.face]) { pg.fillStyle(col, 1); pg.fillCircle(mid.x, mid.y, lw / 2); }
        }
      }
      pg.fillStyle(col, 1);
      for (const c of path) if (vis[cells[c].face]) { const p = this.proj(R, cells[c].p); pg.fillCircle(p.x, p.y, lw / 2); }
      // checkpoints
      const dg = this.dotsG; dg.clear();
      while (this.labels.length < st.checkpoints.length) {
        this.labels.push(txt(this.scene, 0, 0, '', Math.max(11, Math.round(cellPx * 0.3)), T.dark, { fontStyle: 'bold' }).setOrigin(0.5));
      }
      st.checkpoints.forEach((c, i) => {
        const cell = cells[c], t = this.labels[i];
        if (!vis[cell.face]) { t.setVisible(false); return; }
        const p = this.proj(R, cell.p), reached = i < st.nextIdx;
        dg.fillStyle(st.badIdx === i ? C.bad : reached ? col : C.dot, 1);
        dg.fillCircle(p.x, p.y, cellPx * 0.26);
        t.setText(String(i + 1)).setPosition(p.x, p.y).setVisible(true);
      });
      // head ring
      const fx = this.fx; fx.clear();
      if (path.length && !st.solved) {
        const h = cells[path[path.length - 1]];
        if (vis[h.face]) { const p = this.proj(R, h.p); fx.lineStyle(2, 0xffffff, 0.35 + 0.35 * Math.sin(now / 180)); fx.strokeCircle(p.x, p.y, cellPx * 0.36); }
      }
    }
    destroy() { [this.g, this.pathG, this.dotsG, this.fx].forEach(o => o.destroy()); this.labels.forEach(l => l.destroy()); }
  }

  // ---------------- scene ----------------
  class RoutingScene extends Phaser.Scene {
    constructor() { super('routing'); }
    init(data) { this.bootData = data || {}; }
    create() {
      const cam = this.cameras.main;
      cam.setOrigin(0, 0); cam.setZoom(DPR); cam.setBackgroundColor(C.bg);
      this.solvedSet = new Set(this.bootData.solved || []);
      this.timers = [];
      this.buildPanel();
      this.status = txt(this, 605, 22, '', 15, T.text).setOrigin(0.5, 0);
      this.sub = txt(this, 605, 44, '', 12, T.dim).setOrigin(0.5, 0);
      this.cubeBtns = [
        button(this, 455, 492, 70, 30, '◀ turn', () => this.turn('y', -1)),
        button(this, 531, 492, 70, 30, 'turn ▶', () => this.turn('y', 1)),
        button(this, 609, 492, 70, 30, '▲ tip', () => this.turn('x', -1)),
        button(this, 685, 492, 70, 30, 'tip ▼', () => this.turn('x', 1))
      ];
      this.nextBtn = button(this, 545, 492, 120, 30, 'Next puzzle', () => this.loadLevel(Math.min(LEVELS.length - 1, this.levelIndex + 1)));
      this.rotateMode = 'timer';
      this.modeBtn = button(this, 495, 492, 220, 30, '', () => { this.rotateMode = this.rotateMode === 'timer' ? 'number' : 'timer'; this.loadLevel(this.levelIndex); });
      this.input.on('pointerdown', p => this.onDown(p));
      this.input.on('pointermove', p => this.onMove(p));
      this.input.on('pointerup', () => { this.drawing = false; this.lastPt = null; });
      const kb = this.input.keyboard;
      if (kb) {
        kb.on('keydown-LEFT', () => this.turn('y', -1));
        kb.on('keydown-RIGHT', () => this.turn('y', 1));
        kb.on('keydown-UP', () => this.turn('x', -1));
        kb.on('keydown-DOWN', () => this.turn('x', 1));
        kb.on('keydown-R', () => this.resetPath());
      }
      this.loadLevel(this.bootData.levelIndex || 0, this.bootData.path);
      if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
        try { window.claude.hot.snapshot(() => ({ levelIndex: this.levelIndex, path: this.path.slice(), solved: [...this.solvedSet] })); } catch (e) { /* optional */ }
      }
    }

    buildPanel() {
      const g = this.add.graphics();
      g.fillStyle(C.panel, 1); g.fillRect(0, 0, 250, H);
      g.lineStyle(1, C.rule, 1); g.lineBetween(250, 0, 250, H);
      txt(this, 22, 18, 'SATELLITE / BATCH 1', 11, T.dim);
      txt(this, 22, 36, 'Routing puzzles', 17, T.text);
      this.levelRows = LEVELS.map((L, i) => {
        const y = 74 + i * 34;
        const bg = this.add.graphics();
        const label = txt(this, 34, y + 8, (i + 1) + '  ' + L.title, 13, T.text);
        const mark = txt(this, 226, y + 8, '', 12, T.ok).setOrigin(1, 0);
        const zone = this.add.zone(14, y, 222, 30).setOrigin(0).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', (p, lx, ly, ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); this.loadLevel(i); });
        return { bg, label, mark, y };
      });
      this.ruleText = txt(this, 22, 324, '', 12, T.text, { wordWrap: { width: 208, useAdvancedWrap: true }, lineSpacing: 4 });
      this.resetBtn = button(this, 22, 438, 98, 30, 'Reset (R)', () => this.resetPath());
      this.solveBtn = button(this, 128, 438, 100, 30, 'Show me', () => this.autoSolve());
      txt(this, 22, 506, 'Placeholder art. Mechanics only.', 11, T.dim);
    }
    refreshPanel() {
      this.levelRows.forEach((r, i) => {
        r.bg.clear();
        if (i === this.levelIndex) { r.bg.fillStyle(C.btnHi, 1); r.bg.fillRoundedRect(14, r.y, 222, 30, 6); }
        r.mark.setText(this.solvedSet.has(LEVELS[i].id) ? 'done' : '');
      });
      this.ruleText.setText(RULES[this.level.id] || '');
    }

    loadLevel(i, restorePath) {
      this.clearTimers();
      if (this.auto) { this.auto.remove(false); this.auto = null; }
      if (this.view) this.view.destroy();
      this.levelIndex = i;
      const L = this.level = LEVELS[i];
      this.board = L.kind === 'cube' ? Z.cubeBoard(L.m) : Z.gridBoard(L.w, L.h, { wrapX: L.wrapX, walls: L.walls });
      this.checkpoints = L.checkpoints.slice();
      this.path = Array.isArray(restorePath) ? restorePath.slice() : [];
      this.solved = false; this.drawing = false; this.lastPt = null; this.auto = null;
      this.warnCell = -1; this.rotateWarn = false; this.badIdx = -1;
      this.view = L.kind === 'cube' ? new CubeView(this, L, this.board, 605, 270, 400) : new GridView(this, L, this.board, 605, 272, 380);
      this.cubeBtns.forEach(b => b.setVisible(L.kind === 'cube'));
      this.nextBtn.setVisible(false);
      this.modeBtn.setVisible(L.variant === 'rotate');
      this.modeBtn.setLabel(this.rotateMode === 'timer' ? 'Turns: every 12 s (switch)' : 'Turns: at each number (switch)');
      this.noteUntil = 0; this.rotating = false;
      if (L.variant === 'rotate' && this.rotateMode === 'timer') this.startRotation();
      if (L.variant === 'moving') this.startDrift();
      this.refreshPanel();
      this.redraw();
    }
    clearTimers() { (this.timers || []).forEach(e => e.remove(false)); this.timers = []; }
    order() { const o = new Map(); this.checkpoints.forEach((c, i) => o.set(c, i)); return o; }
    nextIdx() { const o = this.order(); let k = 0; for (const c of this.path) if (o.has(c)) k++; return k; }
    state() { return { path: this.path, checkpoints: this.checkpoints, nextIdx: this.nextIdx(), solved: this.solved, warnCell: this.warnCell, rotateWarn: this.rotateWarn, badIdx: this.badIdx }; }
    redraw() {
      this.view.render(this.state());
      const L = this.level;
      this.status.setText((this.levelIndex + 1) + '. ' + L.title + (this.solved ? '  /  route complete' : ''));
      this.status.setColor(this.solved ? T.ok : T.text);
      const n = this.board.n;
      const note = this.noteUntil && this.time.now < this.noteUntil && !this.solved;
      this.sub.setText(this.solved ? 'All ' + n + ' squares covered.' : note ? 'Board turned. Press the end of your line to keep going.' : this.path.length + ' of ' + n + ' squares');
      this.sub.setColor(note ? T.warn : T.dim);
    }
    update() {
      if (this.noteUntil && this.time.now > this.noteUntil) { this.noteUntil = 0; this.redraw(); }
      if (this.view) this.view.tick(this.state());
    }

    // ----- input -----
    pt(p) { return { x: p.x / DPR, y: p.y / DPR }; }
    onDown(p) {
      if (this.solved || this.auto || (this.view.busy && this.view.busy()) || this.rotating) return;
      const q = this.pt(p), c = this.view.cellAt(q.x, q.y, false);
      if (c < 0) return;
      const idx = this.path.indexOf(c);
      if (idx >= 0) { this.path.length = idx + 1; this.drawing = true; }
      else if (c === this.checkpoints[0]) { this.path = [c]; this.drawing = true; }
      else { this.flashBad(0); return; }
      this.lastPt = q;
      this.redraw();
    }
    onMove(p) {
      if (!this.drawing || !p.isDown || this.solved || this.auto || this.rotating || (this.view.busy && this.view.busy())) return;
      const q = this.pt(p);
      const wrapZone = this.level.wrapX;
      if (!this.view.inside(q.x, q.y) && !wrapZone) { this.lastPt = null; return; }
      const from = this.lastPt || q;
      const dist = Math.hypot(q.x - from.x, q.y - from.y);
      const step = (this.view.cs || 30) / 4;
      const nSteps = Math.max(1, Math.ceil(dist / step));
      for (let k = 1; k <= nSteps; k++) {
        const x = from.x + (q.x - from.x) * k / nSteps, y = from.y + (q.y - from.y) * k / nSteps;
        const c = this.view.cellAt(x, y, true);
        if (c >= 0) this.tryStep(c);
        if (this.solved) break;
      }
      // after a wrap the pointer sits outside the board; resume sampling only inside it
      this.lastPt = this.view.inside(q.x, q.y) ? q : null;
    }
    tryStep(c) {
      const path = this.path, head = path[path.length - 1];
      if (c === head || head === undefined) return;
      if (path.length >= 2 && c === path[path.length - 2]) { path.pop(); this.redraw(); return; }
      const at = path.indexOf(c);
      if (at >= 0) { path.length = at + 1; this.redraw(); return; }
      if (!this.board.adj[head].includes(c)) return;
      const o = this.order(), last = this.checkpoints[this.checkpoints.length - 1];
      if (o.has(c) && o.get(c) !== this.nextIdx()) { this.flashBad(o.get(c)); return; }
      if (c === last && path.length !== this.board.n - 1) { this.flashBad(this.checkpoints.length - 1); return; }
      path.push(c);
      if (c === this.warnCell) this.cancelDrift();
      if (this.level.variant === 'rotate' && this.rotateMode === 'number' && o.has(c) && o.get(c) > 0 && path.length < this.board.n) this.turnBoard();
      if (path.length === this.board.n) this.win();
      this.redraw();
    }
    flashBad(i) {
      this.badIdx = i; this.redraw();
      this.time.delayedCall(260, () => { this.badIdx = -1; if (this.view) this.redraw(); });
    }
    resetPath() { if (this.auto) return; if (this.solved) { this.loadLevel(this.levelIndex); return; } this.path = []; this.solved = false; this.nextBtn.setVisible(false); if (this.level.kind === 'cube') this.cubeBtns.forEach(b => b.setVisible(true)); this.redraw(); }
    turn(axis, dir) { if (this.level.kind !== 'cube' || this.auto) return; this.view.turn(axis, dir); }
    win() {
      this.solved = true; this.drawing = false;
      this.solvedSet.add(this.level.id);
      this.clearTimers(); this.warnCell = -1; this.rotateWarn = false;
      this.cubeBtns.forEach(b => b.setVisible(false));
      this.modeBtn.setVisible(false);
      this.nextBtn.setVisible(this.levelIndex < LEVELS.length - 1);
      this.cameras.main.flash(180, 158, 240, 194);
      this.refreshPanel();
    }

    // ----- "show me": draw the solution step by step -----
    autoSolve() {
      if (this.solved || this.auto) return;
      let sol = null;
      const base = this.path.length ? this.path : [this.checkpoints[0]];
      const r = Z.solvableFrom(this.board, this.checkpoints, base, 4e5);
      if (r.ok) sol = r.solution;
      else { const r2 = Z.solvableFrom(this.board, this.checkpoints, [this.checkpoints[0]], 4e5); sol = r2.ok ? r2.solution : null; if (sol) this.path = [this.checkpoints[0]]; }
      if (!sol) return;
      this.cancelDrift();
      let k = this.path.length || 0;
      if (!this.path.length) { this.path = [sol[0]]; k = 1; }
      this.auto = this.time.addEvent({
        delay: 70, loop: true, callback: () => {
          if (k >= sol.length) { this.auto.remove(false); this.auto = null; return; }
          this.tryStep(sol[k++]);
        }
      });
    }

    // ----- rotating board -----
    startRotation() {
      const every = 12000, warn = 1600;
      const cycle = () => {
        this.timers.push(this.time.delayedCall(every - warn, () => {
          this.rotateWarn = true;
          this.timers.push(this.time.delayedCall(warn, () => {
            this.rotateWarn = false;
            this.turnBoard(() => { if (!this.solved) cycle(); });
          }));
        }));
      };
      cycle();
    }

    turnBoard(after) {
      this.rotating = true; this.drawing = false; this.lastPt = null;
      const v = this.view;
      this.tweens.add({
        targets: v.root, rotation: v.root.rotation + Math.PI / 2, duration: 520, ease: 'Cubic.easeInOut',
        onUpdate: () => v.labels.forEach(l => l.setRotation(-v.root.rotation)),
        onComplete: () => {
          this.rotating = false;
          if (this.path.length && !this.solved) { this.noteUntil = this.time.now + 2600; this.redraw(); }
          if (after) after();
        }
      });
    }

    // ----- drifting dots -----
    startDrift() {
      const every = 9000, warn = 2000;
      const cycle = () => {
        this.timers.push(this.time.delayedCall(every - warn, () => {
          const plan = this.pickDrift();
          if (!plan) { cycle(); return; }
          this.warnCell = plan.to; this.driftPlan = plan;
          this.timers.push(this.time.delayedCall(warn, () => {
            const pl = this.driftPlan;
            this.warnCell = -1; this.driftPlan = null;
            if (pl && !this.solved && !this.path.includes(pl.to) && !this.path.includes(this.checkpoints[pl.i])) {
              this.checkpoints[pl.i] = pl.to;
              this.redraw();
            }
            if (!this.solved) cycle();
          }));
        }));
      };
      cycle();
    }
    cancelDrift() { this.warnCell = -1; this.driftPlan = null; }
    pickDrift() {
      const n = this.board.n, inPath = new Set(this.path), isCp = new Set(this.checkpoints);
      const ni = this.nextIdx();
      const movable = [];
      for (let i = Math.max(1, ni); i < this.checkpoints.length - 1; i++) movable.push(i);
      Z.shuffle(movable, Math.random);
      for (const i of movable) {
        const from = this.checkpoints[i];
        // squares within two steps, not drawn on, not already numbered
        const near = new Set();
        for (const a of this.board.adj[from]) { near.add(a); for (const b of this.board.adj[a]) near.add(b); }
        const targets = [...near].filter(t => t !== from && !inPath.has(t) && !isCp.has(t) && t < n);
        Z.shuffle(targets, Math.random);
        for (const to of targets) {
          const cps = this.checkpoints.slice(); cps[i] = to;
          const base = this.path.length ? this.path : [cps[0]];
          const r = Z.solvableFrom(this.board, cps, base, 6e4);
          if (r.ok) return { i, to };
        }
      }
      return null;
    }
  }

  function start(data) {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: W * DPR,
      height: H * DPR,
      backgroundColor: '#0a0f14',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: []
    });
    game.scene.add('routing', RoutingScene, true, data || {});
    window.__routingGame = game;
  }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
