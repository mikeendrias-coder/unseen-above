/* Pixel scene generator for the look board. Draws 320x180 scenes into a palette buffer,
   then merges runs into rects for SVG. Written from scratch for this project. */
function makePix() {
  'use strict';
  const W = 320, H = 180;
  const rng = seed => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

  // ---------------------------------------------------------------- looks
  // Each look maps the same named roles to its own colors. "d:a:b:type" = a two-color dither.
  const LOOKS = {
    A: { name: 'Gilded Night',
      skyTop: '#070b1f', skyMid: '#0f1735', skyLow: '#1c2650', star: '#9aa6d6', moon: '#ece8d6', moonShade: '#bdb79d',
      hill: '#0b1124', ground: '#0d1226', groundTop: '#1b2348', hedge: '#122238', hedgeHi: '#1f3755', path: '#262c49', pathHi: '#323a5e',
      wall: '#2b3463', wallHi: '#3d4985', wallLo: '#1c2347', wallLine: '#242c58',
      col: '#cfc8b6', colHi: '#f1ead6', colLo: '#8e887a',
      gold: '#e2b146', goldHi: '#fff0a8', goldLo: '#93661d', glint: '#ffffff',
      win: '#ffb85c', winHi: '#ffe2a6', winLo: '#232a4e',
      glass: '#1b3558', glassLit: '#86c9ff',
      floor: '#2f3768', floorHi: '#46508c', floorLo: '#1a2045',
      crack: '#0c1027', rubble: '#3a3e5c', rubbleHi: '#5b6082', dust: '#7a80a6',
      shaft: '#b8c4f5', wood: '#5a3d2a', woodHi: '#7a5638', fabric: '#6e2a3c', fabricLo: '#43182a',
      void: '#000000', voidEdge: '#8a5cff',
      kid: '#f1e9d8', kidLo: '#a69c87', hair: '#2a1d16', bone: '#d9d2bf',
      robot: '#d6f5e3', robotLed: '#7dffb0', device: '#4b5276', led: '#ff4646',
      hazard: '#ff3b3b', hazardCore: '#ffe0e0', overlay: '#6fe3ff', lamp: '#ffb85c',
      sib: '#3f6f8f', sibHi: '#5a8fb0', sibLo: '#26384f' },
    B: { name: 'Marble and Chrome',
      skyTop: '#0b1418', skyMid: '#132329', skyLow: '#1e353c', star: '#a9c3c6', moon: '#eef3f2', moonShade: '#c2cdcc',
      hill: '#0c171b', ground: '#141f22', groundTop: '#24363a', hedge: '#1a2e2c', hedgeHi: '#2a4743', path: '#55615f', pathHi: '#6f7c79',
      wall: '#a9b5b3', wallHi: '#cdd7d5', wallLo: '#7f8c8b', wallLine: '#96a3a1',
      col: '#e3e7e3', colHi: '#ffffff', colLo: '#a7b0ad',
      gold: '#c9d4d7', goldHi: '#f6fbfc', goldLo: '#76858a', glint: '#ffffff',
      win: '#ffd08a', winHi: '#fff0d0', winLo: '#5b6868',
      glass: '#3e5d63', glassLit: '#bfe9ee',
      floor: '#9aa5a3', floorHi: '#c3ccca', floorLo: '#6b7675',
      crack: '#3b4443', rubble: '#7d776c', rubbleHi: '#a19a8c', dust: '#b8b2a4',
      shaft: '#e9f6f7', wood: '#6b5d4c', woodHi: '#8a7a64', fabric: '#d9d6cc', fabricLo: '#a9a499',
      void: '#030405', voidEdge: '#7fefff',
      kid: '#f3e7d3', kidLo: '#a59a87', hair: '#2b211a', bone: '#ece6d6',
      robot: '#d7f7ea', robotLed: '#61e6a6', device: '#56625f', led: '#ff4d4d',
      hazard: '#ff4747', hazardCore: '#ffe3e3', overlay: '#4ff0d2', lamp: '#ffcf8a',
      sib: '#4d6b74', sibHi: '#6f8d96', sibLo: '#33474d' },
    C: { name: 'Signal on Silhouette',
      skyTop: '#06070c', skyMid: '#0a0c13', skyLow: '#10131d', star: '#454b63', moon: '#c9ccd8', moonShade: '#7d8193',
      hill: '#080a10', ground: '#0b0d14', groundTop: '#141724', hedge: '#0e1119', hedgeHi: '#161a26', path: '#151826', pathHi: '#1c2031',
      wall: '#131622', wallHi: '#1c2031', wallLo: '#0e1019', wallLine: '#171a28',
      col: '#1d2132', colHi: '#2a3047', colLo: '#141724',
      gold: '#c9a54a', goldHi: '#efd27e', goldLo: '#5e4c22', glint: '#efd27e',
      win: '#2a2e40', winHi: '#ffb85c', winLo: '#151826',
      glass: '#161a28', glassLit: '#3a4466',
      floor: '#151826', floorHi: '#1d2132', floorLo: '#0e1019',
      crack: '#07080c', rubble: '#1d2132', rubbleHi: '#2a3047', dust: '#3a4058',
      shaft: '#9aa3c7', wood: '#1b1d29', woodHi: '#262a3b', fabric: '#1d1f2d', fabricLo: '#14151f',
      void: '#000000', voidEdge: '#59e1ff',
      kid: '#f6f1e6', kidLo: '#8f8a80', hair: '#3a3530', bone: '#c8c2b3',
      robot: '#9ef0c2', robotLed: '#9ef0c2', device: '#2a3047', led: '#ff3030',
      hazard: '#ff3030', hazardCore: '#ffe0e0', overlay: '#59e1ff', lamp: '#ffb85c',
      sib: '#3a4466', sibHi: '#59e1ff', sibLo: '#262c42' },
    D: { name: 'Rot and Gold',
      skyTop: '#12081f', skyMid: '#1f0f33', skyLow: '#33194d', star: '#c9a7ff', moon: '#fbeacc', moonShade: '#d7bf98',
      hill: '#140a22', ground: '#120c18', groundTop: '#2a1d2a', hedge: '#173a2c', hedgeHi: '#25594a', path: '#3a2a35', pathHi: '#4d3846',
      wall: '#1f4a3c', wallHi: '#2f6b56', wallLo: '#143428', wallLine: '#1a4033',
      col: '#efe0c4', colHi: '#fff6e2', colLo: '#b39e7a',
      gold: '#f1c13c', goldHi: '#fff3a3', goldLo: '#9b6a0e', glint: '#ffffff',
      win: '#ff9f3a', winHi: '#ffd890', winLo: '#1c2e27',
      glass: '#2a1f4a', glassLit: '#c9a7ff',
      floor: '#6b2a3a', floorHi: '#8e3b4f', floorLo: '#3a1722',
      crack: '#0d0a0c', rubble: '#4a4030', rubbleHi: '#6e5f42', dust: '#8b8a5c',
      shaft: '#d9c8ff', wood: '#4a2c1c', woodHi: '#6e4529', fabric: '#8e1f3a', fabricLo: '#4f1222',
      void: '#000000', voidEdge: '#ff4fd8',
      kid: '#f4e6d0', kidLo: '#a3937c', hair: '#2a1712', bone: '#e6dcc0',
      robot: '#d7f8e4', robotLed: '#78ffb3', device: '#3a4a40', led: '#ff2a3c',
      hazard: '#ff2a3c', hazardCore: '#ffe1e5', overlay: '#6fe3ff', lamp: '#ffb347',
      sib: '#b8742a', sibHi: '#d99a4a', sibLo: '#7a4a1a' },
    E: { name: 'Moonlit Ink',
      skyTop: '#0a0a0a', skyMid: 'd:#0a0a0a:#2a2722:q12', skyLow: 'd:#0a0a0a:#2a2722:q25', star: '#e9e2cc', moon: '#e9e2cc', moonShade: 'd:#e9e2cc:#0a0a0a:checker',
      hill: '#0a0a0a', ground: '#0a0a0a', groundTop: 'd:#e9e2cc:#0a0a0a:q25', hedge: '#0a0a0a', hedgeHi: 'd:#e9e2cc:#0a0a0a:q25', path: 'd:#e9e2cc:#0a0a0a:q12', pathHi: 'd:#e9e2cc:#0a0a0a:q25',
      wall: 'd:#e9e2cc:#0a0a0a:q12', wallHi: 'd:#e9e2cc:#0a0a0a:q25', wallLo: '#0a0a0a', wallLine: '#0a0a0a',
      col: 'd:#e9e2cc:#0a0a0a:checker', colHi: '#e9e2cc', colLo: 'd:#e9e2cc:#0a0a0a:q25',
      gold: '#e9e2cc', goldHi: '#e9e2cc', goldLo: 'd:#e9e2cc:#0a0a0a:checker', glint: '#e9e2cc',
      win: 'd:#e9e2cc:#0a0a0a:checker', winHi: '#e9e2cc', winLo: '#0a0a0a',
      glass: 'd:#e9e2cc:#0a0a0a:q12', glassLit: 'd:#e9e2cc:#0a0a0a:checker',
      floor: 'd:#e9e2cc:#0a0a0a:q12', floorHi: 'd:#e9e2cc:#0a0a0a:q25', floorLo: '#0a0a0a',
      crack: '#0a0a0a', rubble: 'd:#e9e2cc:#0a0a0a:q25', rubbleHi: 'd:#e9e2cc:#0a0a0a:checker', dust: 'd:#e9e2cc:#0a0a0a:q25',
      shaft: '#e9e2cc', wood: 'd:#e9e2cc:#0a0a0a:q12', woodHi: 'd:#e9e2cc:#0a0a0a:q25', fabric: 'd:#e9e2cc:#0a0a0a:q25', fabricLo: 'd:#e9e2cc:#0a0a0a:q12',
      void: '#000000', voidEdge: '#e9e2cc',
      kid: '#e9e2cc', kidLo: 'd:#e9e2cc:#0a0a0a:checker', hair: '#0a0a0a', bone: '#e9e2cc',
      robot: '#e9e2cc', robotLed: '#0a0a0a', device: 'd:#e9e2cc:#0a0a0a:q25', led: '#ff3b30',
      hazard: '#ff3b30', hazardCore: '#ffd9d6', overlay: '#7fe9ff', lamp: '#e9e2cc',
      sib: 'd:#e9e2cc:#0a0a0a:checker', sibHi: '#e9e2cc', sibLo: 'd:#e9e2cc:#0a0a0a:q25' }
  };

  // ---------------------------------------------------------------- canvas
  function Canvas() {
    const buf = new Int16Array(W * H).fill(-1), inks = [], idx = new Map(), over = [];
    const ink = c => { if (!idx.has(c)) { idx.set(c, inks.length); inks.push(c); } return idx.get(c); };
    const cv = {
      px(x, y, c) { x = Math.round(x); y = Math.round(y); if (c == null || x < 0 || y < 0 || x >= W || y >= H) return; buf[y * W + x] = ink(c); },
      rect(x, y, w, h, c) {
        if (c == null) return; const k = ink(c);
        const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(W, Math.round(x + w)), y1 = Math.min(H, Math.round(y + h));
        for (let yy = y0; yy < y1; yy++) if (x1 > x0) buf.fill(k, yy * W + x0, yy * W + x1);
      },
      circle(cx, cy, r, c) { for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); cv.rect(cx - hw, cy + dy, 2 * hw + 1, 1, c); } },
      ellipse(cx, cy, rx, ry, c) { for (let dy = -ry; dy <= ry; dy++) { const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) + 0.35); cv.rect(cx - hw, cy + dy, 2 * hw + 1, 1, c); } },
      poly(pts, c) {
        let y0 = Infinity, y1 = -Infinity; pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
          const yc = y + 0.5, xs = [];
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i], [xj, yj] = pts[j];
            if ((yi > yc) !== (yj > yc)) xs.push(xi + (yc - yi) * (xj - xi) / (yj - yi));
          }
          xs.sort((a, b) => a - b);
          for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); cv.rect(a, y, b - a, 1, c); }
        }
      },
      line(x0, y0, x1, y1, c) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
        for (;;) { cv.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
      },
      // translucent layer drawn on top (light shafts, glows, overlays)
      glowRect(x, y, w, h, c, a) { over.push({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), f: c, o: a }); },
      glowCircle(cx, cy, r, c, a) { for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); cv.glowRect(cx - hw, cy + dy, 2 * hw + 1, 1, c, a); } },
      glowPoly(pts, c, a) {
        let y0 = Infinity, y1 = -Infinity; pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
          const yc = y + 0.5, xs = [];
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > yc) !== (yj > yc)) xs.push(xi + (yc - yi) * (xj - xi) / (yj - yi)); }
          xs.sort((a, b) => a - b);
          for (let k = 0; k + 1 < xs.length; k += 2) cv.glowRect(Math.round(xs[k]), y, Math.round(xs[k + 1]) - Math.round(xs[k]), 1, c, a);
        }
      },
      // copy another canvas in, every pixel k times bigger (a close-up keeps one pixel size inside its frame)
      dump() { return { buf, inks, over }; },
      blit(src, k) {
        const s = src.dump();
        for (let y = 0; y < Math.ceil(H / k); y++) for (let x = 0; x < Math.ceil(W / k); x++) { const i = s.buf[y * W + x]; if (i >= 0) cv.rect(x * k, y * k, k, k, s.inks[i]); }
        s.over.forEach(g => cv.glowRect(g.x * k, g.y * k, g.w * k, g.h * k, g.f, g.o));
      },
      // merge same-ink runs into rectangles; the emitter turns inks (solid or dither) into SVG paints
      out() {
        const rects = []; let open = new Map(); let gaps = 0;
        for (let y = 0; y < H; y++) {
          const next = new Map(); let x = 0;
          while (x < W) {
            const k = buf[y * W + x]; let x2 = x + 1;
            while (x2 < W && buf[y * W + x2] === k) x2++;
            if (k >= 0) {
              const key = x + ',' + x2 + ',' + k, r = open.get(key);
              if (r) { r.h++; next.set(key, r); open.delete(key); } else { const nr = { x, y, w: x2 - x, h: 1, k }; rects.push(nr); next.set(key, nr); }
            } else gaps += x2 - x;
            x = x2;
          }
          open = next;
        }
        return { rects: rects.map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h, ink: inks[r.k] })), glows: over, gaps };
      }
    };
    return cv;
  }

  // ---------------------------------------------------------------- sprites
  const KID = ['...hhh..', '..hhhhh.', '.hhkkkk.', 'hhhkkkk.', 'h..kkk..', '..ssss..', '.kkkkkk.', '.kkkkkk.', '.kkkkkk.', '..kkkk..', '..kk.kk.', '..kk.kk.', '..ss.ss.', '..ss.ss.'];
  function sprite(cv, rows, x, y, map) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch !== '.') cv.px(x + i, y + j, map[ch]); } }); }
  const kid = (cv, P, x, feetY) => sprite(cv, KID, x, feetY - 14, { h: P.hair, k: P.kid, s: P.kidLo });
  function robot(cv, P, x, feetY) { cv.rect(x + 1, feetY - 6, 12, 5, P.robot); cv.rect(x, feetY - 5, 14, 3, P.robot); cv.rect(x + 2, feetY - 1, 3, 1, P.kidLo); cv.rect(x + 9, feetY - 1, 3, 1, P.kidLo); cv.rect(x + 6, feetY - 7, 2, 1, P.robotLed); }
  function glint(cv, P, x, y) { cv.px(x, y, P.glint); cv.px(x - 1, y, P.goldHi); cv.px(x + 1, y, P.goldHi); cv.px(x, y - 1, P.goldHi); cv.px(x, y + 1, P.goldHi); }
  function lying(cv, P, x, y, stage) {
    // a figure lying on its side; later stages read as older remains, never gory
    if (stage === 0) { cv.rect(x, y - 4, 3, 3, P.hair); cv.circle(x + 4, y - 3, 2, P.kid); cv.rect(x + 6, y - 5, 8, 4, P.kid); cv.rect(x + 14, y - 4, 6, 3, P.kidLo); }
    else if (stage === 1) { cv.rect(x, y - 4, 3, 3, P.kidLo); cv.circle(x + 4, y - 3, 2, P.kidLo); cv.rect(x + 6, y - 5, 8, 4, P.kidLo); cv.rect(x + 14, y - 4, 6, 3, P.kidLo); for (let i = 0; i < 6; i++) cv.px(x + 5 + i * 2, y - 5 - (i % 2), P.dust); }
    else if (stage === 2) { cv.rect(x - 1, y - 6, 23, 5, P.dust); cv.circle(x + 4, y - 4, 2, P.bone); cv.px(x + 4, y - 4, P.dust); for (let i = 0; i < 4; i++) cv.rect(x + 8 + i * 2, y - 5, 1, 3, P.bone); cv.rect(x + 16, y - 3, 5, 1, P.bone); }
    else { cv.rect(x - 2, y - 2, 26, 2, P.dust); cv.circle(x + 4, y - 3, 2, P.bone); for (let i = 0; i < 3; i++) cv.px(x + 9 + i * 3, y - 3, P.bone); cv.rect(x + 17, y - 2, 4, 1, P.bone); }
  }
  function brother(cv, P, x, y) {
    // the older brother, on his side near the door: still and dim, nothing shown beyond that
    cv.rect(x, y - 5, 3, 3, P.hair); cv.circle(x + 4, y - 3, 2, P.kid); cv.rect(x + 2, y - 6, 4, 2, P.hair);
    cv.rect(x + 7, y - 6, 11, 5, P.sib); cv.rect(x + 7, y - 6, 11, 1, P.sibHi); cv.rect(x + 8, y - 1, 7, 1, P.kidLo);
    cv.rect(x + 18, y - 4, 9, 3, P.sibLo); cv.rect(x + 27, y - 4, 2, 3, P.hair);
  }
  function softGlow(cv, x, y, r, c, a) { cv.glowCircle(x, y, r, c, +(a * 0.45).toFixed(3)); cv.glowCircle(x, y, Math.round(r * 0.66), c, +(a * 0.6).toFixed(3)); cv.glowCircle(x, y, Math.round(r * 0.36), c, a); }
  function stars(cv, P, n, seed, box) { const r = rng(seed); for (let i = 0; i < n; i++) { const x = box[0] + r() * box[2], y = box[1] + r() * box[3]; cv.px(x, y, r() < 0.15 ? P.glint : P.star); } }
  function sky(cv, P, h) {
    cv.rect(0, 0, W, h, P.skyTop);
    cv.rect(0, Math.round(h * 0.28), W, Math.round(h * 0.36), P.skyMid);
    cv.rect(0, Math.round(h * 0.64), W, h - Math.round(h * 0.64), P.skyLow);
    const ch = (a, b) => (a.startsWith('d:') || b.startsWith('d:')) ? a : 'd:' + b + ':' + a + ':checker';
    cv.rect(0, Math.round(h * 0.28) - 2, W, 2, ch(P.skyTop, P.skyMid));
    cv.rect(0, Math.round(h * 0.64) - 2, W, 2, ch(P.skyMid, P.skyLow));
  }
  function moon(cv, P, x, y, r) { cv.circle(x, y, r, P.moon); cv.circle(x + 3, y - 2, 2, P.moonShade); cv.circle(x - 4, y + 3, 1, P.moonShade); cv.px(x - 2, y + 5, P.lamp); cv.px(x - 1, y + 5, P.goldHi); }
  function camera(cv, P, x, y, on) { cv.rect(x, y, 7, 3, P.device); cv.rect(x + 2, y + 3, 3, 2, P.device); cv.px(x + 3, y + 4, on ? P.led : P.wallLo); }
  function crackLine(cv, c, x, y, len, seed, dir) { const r = rng(seed); let cx = x, cy = y; for (let i = 0; i < len; i++) { cv.px(cx, cy, c); cy += 1; cx += (r() < 0.5 ? -1 : 1) * (r() < 0.6 ? 1 : 0) + (dir || 0) * (r() < 0.3 ? 1 : 0); if (r() < 0.12) cv.px(cx + 1, cy, c); } }
  function rubblePile(cv, P, x, y, w, seed) { const r = rng(seed); for (let i = 0; i < w * 1.4; i++) { const px = x + r() * w, h = 1 + Math.floor(r() * (w / 6)), ww = 2 + Math.floor(r() * 5); cv.rect(px, y - h, ww, h, r() < 0.35 ? P.rubbleHi : P.rubble); } cv.rect(x - 2, y - 1, w + 4, 1, P.rubble); }
  function chandelier(cv, P, x, y, broken) {
    if (!broken) { cv.line(x, 0, x, y - 6, P.goldLo); cv.ellipse(x, y, 10, 3, P.gold); cv.rect(x - 12, y - 1, 25, 1, P.goldHi); for (let i = -8; i <= 8; i += 4) { cv.px(x + i, y + 4, P.glint); cv.px(x + i, y + 5, P.glassLit); } softGlow(cv, x, y + 2, 18, P.lamp, 0.12); }
    else { cv.ellipse(x, y, 11, 2, P.goldLo); cv.rect(x - 6, y - 3, 3, 2, P.gold); const r = rng(x + y); for (let i = 0; i < 14; i++) cv.px(x - 18 + r() * 36, y + 1 - r() * 2, r() < 0.5 ? P.glassLit : P.glint); }
  }
  function column(cv, P, x, top, bottom, w, broken) {
    const t = broken ? bottom - broken : top;
    cv.rect(x, t, w, bottom - t, P.col); cv.rect(x + 1, t, 1, bottom - t, P.colHi);
    for (let i = 3; i < w - 1; i += 3) cv.rect(x + i, t, 1, bottom - t, P.colLo);
    cv.rect(x - 1, bottom - 3, w + 2, 3, P.colHi);
    if (!broken) { cv.rect(x - 2, top - 3, w + 4, 3, P.gold); cv.rect(x - 1, top - 1, w + 2, 1, P.goldLo); }
    else { const r = rng(x); for (let i = 0; i < w; i++) cv.rect(x + i, t - Math.floor(r() * 4), 1, Math.floor(r() * 4) + 1, P.col); }
  }

  // ---------------------------------------------------------------- side scenes
  function exterior(cv, P) {
    sky(cv, P, 132); stars(cv, P, 55, 7, [0, 0, 320, 95]); moon(cv, P, 266, 26, 11);
    // distant hills
    for (let x = 0; x < W; x += 2) { const h = 6 + Math.round(4 * Math.sin(x / 23) + 3 * Math.sin(x / 9)); cv.rect(x, 132 - h, 2, h, P.hill); }
    cv.rect(0, 132, W, 48, P.ground); cv.rect(0, 148, W, 2, P.groundTop); cv.rect(0, 150, W, 5, P.path); cv.rect(0, 150, W, 1, P.pathHi);
    // left wing: a baroque dome nobody needed
    cv.rect(36, 74, 80, 74, P.wall); cv.rect(36, 74, 80, 2, P.wallHi); cv.rect(36, 146, 80, 2, P.wallLo);
    cv.circle(76, 64, 18, P.gold);
    [64, 70, 76, 82, 88].forEach(rx => { const top = Math.round(64 - Math.sqrt(Math.max(0, 18 * 18 - (rx - 76) * (rx - 76)))); cv.rect(rx, top + 2, 1, 64 - top - 2, P.goldLo); });
    cv.rect(68, 51, 3, 2, P.goldHi); cv.rect(67, 53, 2, 4, P.goldHi);
    cv.rect(56, 64, 41, 11, P.wallHi); cv.rect(54, 63, 45, 2, P.gold); cv.rect(54, 74, 45, 1, P.goldLo);
    for (let i = 0; i < 5; i++) cv.rect(59 + i * 8, 66, 3, 6, P.win);
    cv.rect(73, 40, 7, 7, P.gold); cv.rect(75, 42, 3, 4, P.win); cv.rect(72, 46, 9, 1, P.goldLo); cv.circle(76, 37, 2, P.goldHi); cv.rect(76, 30, 1, 5, P.gold);
    for (let i = 0; i < 3; i++) { const wx = 44 + i * 24; cv.rect(wx, 92, 14, 32, P.goldLo); cv.circle(wx + 7, 92, 7, P.goldLo); cv.rect(wx + 2, 94, 10, 28, P.win); cv.circle(wx + 7, 93, 5, P.win); cv.rect(wx + 6, 88, 2, 34, P.goldLo); cv.rect(wx + 2, 106, 10, 1, P.goldLo); cv.glowRect(wx - 2, 148, 18, 6, P.lamp, 0.13); }
    // right wing: a glass box bolted on
    const rg = rng(91); cv.rect(254, 56, 60, 92, P.glass); for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 5; gx++) { const v = rg(); cv.rect(256 + gx * 12, 58 + gy * 15, 10, 13, v < 0.3 ? P.glassLit : v < 0.42 ? P.win : P.glass); }
    for (let gx = 0; gx <= 5; gx++) cv.rect(254 + gx * 12, 56, 2, 92, P.goldLo); cv.rect(254, 56, 60, 2, P.gold);
    // central temple: stairs, columns, pediment
    cv.rect(118, 78, 134, 64, P.wall); cv.rect(118, 78, 134, 2, P.wallHi);
    cv.rect(176, 104, 18, 38, P.win); cv.rect(178, 106, 14, 36, P.winHi); cv.circle(185, 104, 9, P.win); cv.circle(185, 104, 7, P.winHi); cv.glowRect(160, 142, 50, 14, P.lamp, 0.16);
    [[132, 96], [222, 96]].forEach(([wx, wy]) => { cv.rect(wx, wy, 14, 22, P.goldLo); cv.rect(wx + 2, wy + 2, 10, 18, P.win); });
    for (let i = 0; i < 6; i++) column(cv, P, 126 + i * 22, 78, 142, 10, 0);
    for (let i = 0; i < 5; i++) { cv.rect(108 + i * 3, 142 + i * 2, 154 - i * 6, 2, i % 2 ? P.col : P.colLo); }
    cv.rect(114, 66, 142, 9, P.colHi); cv.rect(114, 66, 142, 1, P.gold); cv.rect(114, 74, 142, 1, P.gold); for (let x = 116; x < 254; x += 5) cv.rect(x, 70, 2, 2, P.gold);
    cv.poly([[112, 66], [185, 38], [258, 66]], P.gold); cv.poly([[116, 65], [185, 41], [254, 65]], P.colHi);
    cv.circle(185, 56, 5, P.gold); cv.circle(185, 56, 3, P.goldHi); glint(cv, P, 185, 56);
    [[112, 60], [185, 33], [258, 60]].forEach(([sx, sy]) => { cv.rect(sx - 1, sy - 6, 3, 6, P.gold); cv.circle(sx, sy - 8, 1, P.gold); });
    // fountain and statues
    // fountain crowned with a giant cut diamond
    cv.rect(14, 136, 34, 12, P.colLo); cv.rect(14, 136, 34, 2, P.colHi); cv.rect(17, 138, 28, 3, P.glassLit);
    cv.rect(29, 124, 5, 12, P.gold); cv.rect(27, 122, 9, 2, P.goldHi);
    cv.poly([[22, 112], [26, 106], [37, 106], [41, 112], [31.5, 122]], P.glassLit);
    cv.poly([[22, 112], [41, 112], [31.5, 122]], P.glass);
    cv.line(26, 106, 29, 112, P.glint); cv.line(37, 106, 34, 112, P.glint); cv.line(31, 106, 31, 112, P.glint); cv.rect(22, 112, 20, 1, P.glint);
    glint(cv, P, 26, 105); glint(cv, P, 40, 111);
    [[18, 128], [45, 126], [16, 120], [47, 118]].forEach(([wx, wy]) => cv.px(wx, wy, P.glassLit));
    [[100, 148], [270, 148]].forEach(([sx, sy]) => { cv.rect(sx - 4, sy - 8, 9, 8, P.colLo); cv.rect(sx - 1, sy - 20, 3, 12, P.gold); cv.circle(sx, sy - 22, 2, P.gold); });
    // hedges
    [[56, 148], [300, 148]].forEach(([hx, hy]) => { cv.ellipse(hx, hy - 4, 10, 5, P.hedge); cv.ellipse(hx - 2, hy - 6, 6, 2, P.hedgeHi); });
    // a reflecting pool doubling the gold, and a clipped hedge line in front
    cv.rect(100, 158, 170, 14, P.colLo); cv.rect(102, 160, 166, 10, P.glass); cv.rect(100, 158, 170, 1, P.colHi);
    for (let i = 0; i < 6; i++) { const x = 126 + i * 22; cv.rect(x + 2, 161, 6, 1, P.colLo); cv.rect(x + 3, 163, 4, 1, P.colLo); cv.rect(x + 2, 165, 6, 1, P.colLo); }
    cv.rect(178, 161, 14, 1, P.winHi); cv.rect(180, 163, 10, 1, P.win); cv.rect(179, 165, 12, 1, P.win);
    cv.rect(134, 162, 8, 1, P.win); cv.rect(224, 162, 8, 1, P.win); cv.rect(150, 168, 70, 1, P.gold); cv.rect(166, 169, 38, 1, P.goldLo); cv.px(264, 164, P.moon);
    cv.glowRect(102, 160, 166, 10, P.lamp, 0.05);
    cv.rect(0, 175, W, 5, P.hedge); for (let x = 0; x < W; x += 16) cv.rect(x + 2, 175, 12, 1, P.hedgeHi);
    // glints on everything gold
    [[76, 52], [62, 72], [128, 76], [210, 76], [240, 66], [258, 56], [31, 120], [100, 129], [270, 129], [150, 66], [220, 70]].forEach(([gx, gy]) => glint(cv, P, gx, gy));
    camera(cv, P, 108, 82, true);
    robot(cv, P, 214, 150);
    kid(cv, P, 70, 150);
  }

  function middle(cv, P) {
    cv.rect(0, 0, W, 140, P.wall); cv.rect(0, 0, W, 12, P.wallLo); cv.rect(0, 12, W, 2, P.goldLo);
    for (let x = 18; x < W; x += 44) cv.rect(x, 18, 1, 92, P.wallLine);
    cv.rect(0, 110, W, 30, P.wallLo); cv.rect(0, 110, W, 1, P.goldLo);
    cv.rect(0, 140, W, 40, P.floor); for (let y = 144; y < 180; y += 6) cv.rect(0, y, W, 1, P.floorLo); cv.rect(0, 140, W, 1, P.floorHi);
    cv.rect(0, 150, W, 2, 'd:' + P.floorHi.replace('d:', '') + ':' + P.floor.replace('d:', '') + ':checker');
    // portraits: one still hanging, one fallen, and the pale patch where it hung
    cv.rect(70, 34, 30, 40, P.goldLo); cv.rect(72, 36, 26, 36, P.wallLo); cv.circle(85, 50, 6, P.kidLo); cv.rect(79, 56, 12, 14, P.fabricLo);
    cv.rect(124, 34, 30, 40, P.wallHi); cv.rect(125, 35, 28, 38, P.wall);
    cv.poly([[176, 140], [186, 108], [214, 112], [206, 140]], P.goldLo); cv.poly([[179, 138], [188, 111], [211, 114], [203, 138]], P.wallLo);
    // columns, one snapped
    column(cv, P, 30, 22, 140, 12, 0); column(cv, P, 236, 22, 140, 12, 0); column(cv, P, 156, 22, 140, 12, 34);
    rubblePile(cv, P, 150, 140, 26, 3);
    // empty pedestal
    cv.rect(110, 118, 14, 22, P.colLo); cv.rect(108, 116, 18, 3, P.colHi);
    chandelier(cv, P, 210, 30, false);
    // cracks
    crackLine(cv, P.crack, 60, 14, 40, 11, 0); crackLine(cv, P.crack, 270, 18, 60, 5, -1); crackLine(cv, P.crack, 186, 80, 30, 9, 1);
    // ceiling hole with moonlight
    cv.rect(268, 0, 34, 12, P.skyMid); cv.px(276, 4, P.star); cv.px(292, 7, P.star); cv.rect(266, 10, 4, 4, P.rubble); cv.rect(298, 11, 5, 3, P.rubble);
    cv.glowPoly([[268, 12], [302, 12], [290, 140], [244, 140]], P.shaft, 0.16);
    rubblePile(cv, P, 252, 140, 34, 8);
    const r = rng(42); for (let i = 0; i < 14; i++) cv.px(258 + r() * 30, 30 + r() * 100, P.dust);
    // a lamp still on
    cv.rect(14, 60, 4, 8, P.goldLo); cv.circle(16, 58, 3, P.lamp); softGlow(cv, 16, 59, 20, P.lamp, 0.16);
    // a long runner, worn through where the rubble fell
    cv.rect(20, 147, 128, 5, P.fabric); cv.rect(176, 147, 124, 5, P.fabric); cv.rect(20, 147, 128, 1, P.goldLo); cv.rect(176, 147, 124, 1, P.goldLo);
    cv.rect(148, 148, 3, 3, P.fabricLo); cv.rect(172, 149, 4, 2, P.fabricLo);
    // hazards: a ceiling camera with its cone (through the glasses) and a beam at body height
    camera(cv, P, 120, 14, true);
    cv.glowPoly([[123, 19], [64, 140], [112, 140]], P.overlay, 0.13); cv.line(123, 19, 64, 139, P.overlay); cv.line(123, 19, 112, 139, P.overlay);
    cv.rect(316, 126, 4, 6, P.device); cv.px(317, 128, P.led);
    cv.glowRect(190, 127, 126, 5, P.hazard, 0.28); cv.rect(190, 129, 126, 1, P.hazardCore);
    kid(cv, P, 46, 140);
  }

  function center(cv, P) {
    cv.rect(0, 0, W, 136, P.wallLo);
    for (let x = 0; x < W; x += 22) cv.rect(x, 20, 10, 96, P.wall);
    const r = rng(9); for (let i = 0; i < 16; i++) { const x = r() * 300, y = 20 + r() * 80; cv.rect(x, y, 6 + r() * 14, 4 + r() * 16, P.wallLo); }
    // the roof is gone over the right half
    cv.poly([[150, 0], [320, 0], [320, 70], [300, 58], [282, 66], [262, 44], [236, 52], [214, 30], [190, 36], [172, 14]], P.skyMid);
    stars(cv, P, 18, 3, [180, 0, 140, 40]);
    const edge = [[320, 70], [300, 58], [282, 66], [262, 44], [236, 52], [214, 30], [190, 36], [172, 14], [150, 0]];
    for (let i = 1; i < edge.length; i++) { cv.line(edge[i - 1][0], edge[i - 1][1], edge[i][0], edge[i][1], P.wallHi); cv.line(edge[i - 1][0], edge[i - 1][1] + 1, edge[i][0], edge[i][1] + 1, P.wallLo); }
    [[262, 44], [214, 30], [282, 66]].forEach(([ex, ey], i) => { cv.rect(ex - 1, ey + 2, 2, 5 + i * 2, P.wallHi); cv.px(ex, ey + 9 + i * 2, P.dust); });
    cv.poly([[214, 30], [250, 8], [254, 12], [218, 34]], P.wood); cv.poly([[262, 44], [300, 20], [303, 24], [266, 48]], P.wood);
    cv.glowPoly([[180, 20], [300, 40], [300, 136], [150, 136]], P.shaft, 0.13);
    cv.rect(0, 136, W, 44, P.floorLo); for (let x = 0; x < W; x += 12) cv.rect(x, 136, 1, 44, P.floor); cv.rect(0, 136, W, 1, P.floor);
    crackLine(cv, P.crack, 40, 20, 70, 2, 1); crackLine(cv, P.crack, 120, 30, 60, 4, -1);
    // the canopy bed, half collapsed
    cv.rect(26, 72, 3, 64, P.wood); cv.rect(118, 90, 3, 46, P.wood); cv.poly([[26, 72], [92, 64], [120, 92], [118, 96], [92, 70], [28, 76]], P.wood);
    cv.poly([[30, 76], [92, 68], [116, 94], [104, 112], [80, 92], [34, 100]], P.fabric); cv.poly([[60, 92], [80, 92], [86, 120], [64, 116]], P.fabricLo);
    cv.rect(30, 116, 88, 12, P.fabric); cv.rect(30, 116, 88, 2, P.fabricLo); cv.rect(30, 128, 88, 8, P.wood);
    chandelier(cv, P, 150, 134, true);
    rubblePile(cv, P, 166, 136, 24, 6); rubblePile(cv, P, 284, 136, 30, 12);
    // the door that does not belong: closet slats on top, a bathroom pane below, mismatched frame
    const dx = 238, dy = 86;
    cv.rect(dx - 3, dy - 3, 3, 53, P.gold); cv.rect(dx + 22, dy - 3, 3, 53, P.wood); cv.rect(dx - 3, dy - 4, 28, 3, P.woodHi);
    cv.rect(dx + 4, dy, 18, 50, P.woodHi);
    for (let y = dy + 3; y < dy + 22; y += 3) cv.rect(dx + 6, y, 14, 1, P.wood);
    cv.rect(dx + 8, dy + 28, 10, 8, P.glassLit); cv.rect(dx + 8, dy + 28, 10, 1, P.wood); cv.px(dx + 19, dy + 26, P.gold);
    cv.rect(dx, dy, 4, 50, P.void); cv.rect(dx + 3, dy, 1, 50, P.voidEdge); cv.glowRect(dx - 2, dy, 8, 50, P.voidEdge, 0.25); cv.glowRect(dx - 8, dy + 10, 20, 34, P.voidEdge, 0.08);
    cv.glowPoly([[dx - 1, 136], [dx + 4, 136], [dx - 14, 150], [dx - 64, 150]], P.voidEdge, 0.14);
    const rv = rng(77); for (let i = 0; i < 10; i++) cv.px(dx - 2 - rv() * 14, dy + 8 + rv() * 40, P.voidEdge);
    // the older brother, lying near the door (kept dim and still)
    brother(cv, P, 200, 136);
    camera(cv, P, 14, 22, false);
    kid(cv, P, 128, 136);
  }

  // ---------------------------------------------------------------- top-down room
  function top(cv, P) {
    const T = 16;
    for (let ty = 0; ty < 12; ty++) for (let tx = 0; tx < 20; tx++) cv.rect(tx * T, ty * T, T, T, (tx + ty) % 2 ? P.floor : P.floorHi);
    cv.rect(0, 0, W, 22, P.wall); cv.rect(0, 18, W, 4, P.wallHi); cv.rect(0, 0, 8, H, P.wallLo); cv.rect(W - 8, 0, 8, H, P.wallLo); cv.rect(0, H - 6, W, 6, P.wallLo);
    for (let x = 30; x < 300; x += 64) { cv.rect(x, 4, 24, 12, P.goldLo); cv.rect(x + 2, 6, 20, 8, P.wallLo); }
    // rug, torn at one corner
    cv.rect(60, 74, 196, 40, P.gold); cv.rect(63, 77, 190, 34, P.fabric); for (let x = 70; x < 250; x += 12) cv.rect(x, 92, 6, 2, P.goldLo);
    cv.poly([[226, 111], [256, 111], [256, 96]], P.floor);
    // columns from above with shadows
    [[44, 46], [276, 46], [44, 146], [276, 146]].forEach(([cx, cy], i) => { cv.glowCircle(cx + 3, cy + 3, 9, '#000000', 0.35); cv.circle(cx, cy, 8, i === 3 ? P.rubble : P.col); cv.circle(cx - 2, cy - 2, 3, i === 3 ? P.rubbleHi : P.colHi); });
    // hole in the ceiling: a pool of moonlight and rubble
    cv.glowCircle(214, 150, 22, P.shaft, 0.2); rubblePile(cv, P, 196, 160, 30, 4); for (let i = 0; i < 6; i++) cv.line(186 + i * 8, 126 + (i % 2) * 6, 196 + i * 7, 134, P.crack);
    // fallen chandelier
    cv.circle(150, 46, 8, P.goldLo); cv.circle(150, 46, 5, P.gold); const r = rng(5); for (let i = 0; i < 12; i++) cv.px(134 + r() * 32, 34 + r() * 24, P.glassLit);
    // hazards: camera cone as tiles, a tripwire
    camera(cv, P, 10, 24, true);
    [[1, 2], [2, 2], [1, 3], [2, 3], [3, 3], [2, 4], [3, 4], [4, 4], [3, 5], [4, 5], [5, 5]].forEach(([tx, ty]) => { cv.glowRect(tx * T, ty * T, T, T, P.overlay, 0.16); cv.glowRect(tx * T, ty * T, T, 1, P.overlay, 0.5); cv.glowRect(tx * T, ty * T, 1, T, P.overlay, 0.5); });
    cv.rect(196, 22, 6, 4, P.device); cv.px(198, 23, P.led); cv.rect(196, 170, 6, 4, P.device); cv.glowRect(197, 26, 4, 144, P.hazard, 0.25); cv.rect(198, 26, 1, 144, P.hazardCore);
    // kid and the cleaning robot, from above
    cv.circle(112, 140, 5, P.kid); cv.rect(108, 135, 8, 3, P.hair); cv.px(112, 145, P.kidLo);
    cv.circle(260, 120, 5, P.robot); cv.rect(259, 119, 2, 2, P.robotLed);
    cv.rect(286, 30, 14, 14, P.colLo); cv.rect(288, 32, 10, 10, P.colHi);
  }

  // ---------------------------------------------------------------- bodies over time
  function bodies(cv, P) {
    // four panels of the same spot, later each time: drawn at half size, then doubled (a close-up)
    const t = Canvas();
    for (let i = 0; i < 4; i++) {
      const x0 = i * 40;
      t.rect(x0, 0, 40, 58, P.wall);
      for (let x = x0 + 3; x < x0 + 40; x += 9) t.rect(x, 4, 4, 50, P.wallLo);
      t.rect(x0, 0, 40, 3, P.wallLo); t.rect(x0, 20, 40, 1, P.goldLo); t.rect(x0, 54, 40, 4, P.wallLo); t.rect(x0, 54, 40, 1, P.goldLo);
      t.rect(x0, 58, 40, 32, P.floor); t.rect(x0, 58, 40, 1, P.floorHi); for (let y = 64; y < 90; y += 7) t.rect(x0, y, 40, 1, P.floorLo);
      if (i === 0) { t.rect(x0 + 13, 27, 14, 17, P.goldLo); t.rect(x0 + 14, 28, 12, 15, P.wallLo); t.circle(x0 + 20, 33, 3, P.kidLo); t.rect(x0 + 16, 37, 8, 6, P.fabricLo); }
      if (i === 1) { t.poly([[x0 + 12, 30], [x0 + 26, 26], [x0 + 29, 42], [x0 + 15, 46]], P.goldLo); t.poly([[x0 + 14, 31], [x0 + 25, 28], [x0 + 27, 41], [x0 + 16, 44]], P.wallLo); crackLine(t, P.crack, x0 + 33, 3, 18, 4, 0); }
      if (i === 2) { t.rect(x0 + 13, 27, 14, 17, P.wallHi); crackLine(t, P.crack, x0 + 6, 3, 30, 7, 1); crackLine(t, P.crack, x0 + 31, 22, 26, 9, -1); rubblePile(t, P, x0 + 3, 59, 10, 2); }
      if (i === 3) { t.poly([[x0 + 4, 0], [x0 + 36, 0], [x0 + 33, 14], [x0 + 24, 22], [x0 + 12, 18], [x0 + 6, 10]], P.skyMid); t.px(x0 + 14, 4, P.star); t.px(x0 + 27, 8, P.star); crackLine(t, P.crack, x0 + 9, 18, 34, 2, 0); rubblePile(t, P, x0 + 24, 59, 13, 5); t.glowPoly([[x0 + 8, 6], [x0 + 32, 6], [x0 + 38, 90], [x0 + 4, 90]], P.shaft, 0.1); }
      if (i >= 1) { const r = rng(i * 31); for (let k = 0; k < 8 * i; k++) t.px(x0 + 2 + r() * 36, 60 + r() * 29, P.dust); }
      lying(t, P, x0 + 9, 77, i);
      t.glowPoly([[x0 + 12, 0], [x0 + 26, 0], [x0 + 37, 90], [x0 + 3, 90]], P.shaft, 0.05);
      if (i < 3) t.rect(x0 + 39, 0, 1, 90, '#000000');
    }
    cv.blit(t, 2);
  }

  // ---------------------------------------------------------------- satellite screens
  const FONT = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'], G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
    I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
    Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'], 3: ['##.', '..#', '.#.', '..#', '##.'],
    4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'], 6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
    8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '##.'],
    '/': ['..#', '..#', '.#.', '#..', '#..'], ':': ['...', '.#.', '...', '.#.', '...'], '.': ['...', '...', '...', '...', '.#.'], '%': ['#.#', '..#', '.#.', '#..', '#.#'],
    '-': ['...', '...', '###', '...', '...'], '+': ['...', '.#.', '###', '.#.', '...'], ' ': ['...', '...', '...', '...', '...']
  };
  function text(cv, s, x, y, c, sc) { sc = sc || 1; let cx = x; for (const ch of String(s).toUpperCase()) { const g = FONT[ch] || FONT[' ']; g.forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '#') cv.rect(cx + i * sc, y + j * sc, sc, sc, c); }); cx += 4 * sc; } return cx; }
  // one fixed puzzle so every look shows the same board
  const PZ = { n: 6, path: [30, 24, 18, 12, 6, 0, 1, 2, 3, 4, 5, 11, 10, 9, 8, 7, 13, 14, 15, 16, 17, 23, 22, 21, 20, 19, 25, 26, 27, 28, 29, 35, 34, 33, 32, 31], cps: [30, 0, 5, 7, 17, 19, 29, 31], drawn: 21 };
  function board(cv, x0, y0, cell, st) {
    const n = PZ.n, at = i => ({ x: x0 + (i % n) * cell + cell / 2, y: y0 + Math.floor(i / n) * cell + cell / 2 });
    for (let i = 0; i < n * n; i++) { const p = at(i); st.cell(p.x - cell / 2, p.y - cell / 2, cell); }
    for (let k = 1; k < PZ.drawn; k++) { const a = at(PZ.path[k - 1]), b = at(PZ.path[k]); st.seg(a, b); }
    PZ.cps.forEach((c, i) => { const p = at(c); st.dot(p, i + 1, PZ.path.indexOf(c) < PZ.drawn); });
    const h = at(PZ.path[PZ.drawn - 1]); st.head(h);
  }
  function satA(cv) { // office terminal, light
    const ink = '#2c332b', bg = '#cfd6c4', dim = '#9aa392', path = '#3d5c3a';
    cv.rect(0, 0, W, H, '#7c8178'); cv.rect(6, 6, W - 12, H - 12, '#5e635b'); cv.rect(12, 12, W - 24, H - 24, bg);
    text(cv, 'ROUTE 03/12', 22, 22, ink); text(cv, 'QUOTA', 22, 40, ink); cv.rect(22, 48, 100, 6, dim); cv.rect(22, 48, 64, 6, ink);
    text(cv, 'FEED', 22, 64, ink); cv.rect(22, 72, 100, 60, '#b8c1ad'); for (let i = 0; i < 9; i++) cv.rect(26 + i * 10, 104 - (i * 7) % 18, 8, 26 + (i * 7) % 18, '#a5ad98'); cv.rect(66, 96, 9, 1, ink); cv.rect(70, 92, 1, 9, ink);
    text(cv, 'RES LIMIT 0.4 M', 22, 142, ink); text(cv, 'PRIVACY: OUT OF SCOPE', 22, 150, dim);
    board(cv, 172, 26, 20, {
      cell: (x, y, s) => { cv.rect(x + 1, y + 1, s - 2, s - 2, '#c4ccb8'); },
      seg: (a, b) => cv.rect(Math.min(a.x, b.x) - 2, Math.min(a.y, b.y) - 2, Math.abs(a.x - b.x) + 5, Math.abs(a.y - b.y) + 5, path),
      dot: (p, n, done) => { cv.circle(p.x, p.y, 6, done ? path : ink); text(cv, n, p.x - 1, p.y - 2, bg); },
      head: p => { cv.circle(p.x, p.y, 3, bg); }
    });
    for (let y = 12; y < H - 12; y += 2) cv.glowRect(12, y, W - 24, 1, '#000000', 0.05);
  }
  function satB(cv) { // war-room vectors, dark
    const ln = '#5f7f8a', tx = '#cfe3e8', amber = '#ffb000';
    cv.rect(0, 0, W, H, '#04070a');
    for (let x = 0; x < 160; x += 3) { cv.px(10 + x, 60 + Math.round(10 * Math.sin(x / 13) + 4 * Math.sin(x / 5)), ln); cv.px(10 + x, 100 + Math.round(8 * Math.sin(x / 17 + 1)), ln); }
    for (let x = 0; x < 160; x += 1) cv.px(10 + x, 130 + Math.round(18 * Math.sin(x / 26)), '#2c444c');
    text(cv, 'TRACK 14', 12, 10, tx); text(cv, 'ITEMS 2041', 12, 20, tx); text(cv, 'ALERT', 12, 30, amber);
    [[60, 70], [104, 92], [134, 120]].forEach(([x, y]) => { cv.rect(x - 2, y - 2, 5, 5, amber); });
    cv.rect(166, 20, 1, 140, ln);
    board(cv, 176, 26, 20, {
      cell: (x, y, s) => { cv.rect(x, y, s, 1, '#16252b'); cv.rect(x, y, 1, s, '#16252b'); },
      seg: (a, b) => cv.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(a.x - b.x) + 1, Math.abs(a.y - b.y) + 1, tx),
      dot: (p, n, done) => { cv.rect(p.x - 5, p.y - 5, 11, 11, done ? tx : ln); cv.rect(p.x - 4, p.y - 4, 9, 9, '#04070a'); text(cv, n, p.x - 1, p.y - 2, done ? tx : ln); },
      head: p => { cv.rect(p.x - 7, p.y - 7, 15, 1, amber); cv.rect(p.x - 7, p.y + 7, 15, 1, amber); }
    });
    text(cv, 'REQUEST: VOLUNTARY', 12, 168, ln);
  }
  function satC(cv) { // flat map, light
    const ink = '#2f3a4a', tile = '#cfd5de', blue = '#3b6fd8';
    cv.rect(0, 0, W, H, '#e7e9ec');
    text(cv, 'ROUTE', 14, 14, ink, 2); text(cv, '03', 14, 30, blue, 3);
    cv.rect(14, 60, 120, 90, '#dde1e7'); for (let i = 0; i < 8; i++) cv.rect(18 + i * 15, 64 + (i % 3) * 20, 12, 30, '#c9cfd8');
    cv.circle(74, 104, 2, ink); cv.rect(84, 72, 46, 44, '#ffffff'); cv.rect(84, 72, 46, 1, ink); cv.rect(84, 115, 46, 1, ink);
    cv.circle(107, 84, 4, '#f1e9d8'); cv.rect(103, 89, 9, 12, '#f1e9d8'); cv.rect(104, 101, 3, 8, '#a69c87'); cv.rect(108, 101, 3, 8, '#a69c87'); cv.rect(103, 80, 9, 3, '#2a1d16');
    cv.line(76, 102, 84, 94, ink);
    text(cv, 'PUBLIC FEED: OFF', 14, 160, ink);
    board(cv, 166, 22, 22, {
      cell: (x, y, s) => cv.rect(x + 1, y + 1, s - 2, s - 2, tile),
      seg: (a, b) => cv.rect(Math.min(a.x, b.x) - 3, Math.min(a.y, b.y) - 3, Math.abs(a.x - b.x) + 7, Math.abs(a.y - b.y) + 7, blue),
      dot: (p, n, done) => { cv.circle(p.x, p.y, 7, done ? blue : ink); text(cv, n, p.x - 1, p.y - 2, '#ffffff'); },
      head: p => cv.circle(p.x, p.y, 3, '#ffffff')
    });
  }
  function satD(cv) { // kids' game show
    const pink = '#ff5fa2', yel = '#ffd23f', mint = '#3ee6c1', blue = '#5b8cff', bg = '#1b0f3a';
    cv.rect(0, 0, W, H, bg); cv.rect(4, 4, W - 8, H - 8, '#2b1a5c');
    for (let x = 8; x < W - 4; x += 8) { cv.circle(x, 4, 2, (x / 8) % 2 ? yel : pink); cv.circle(x, H - 5, 2, (x / 8) % 2 ? pink : yel); }
    for (let y = 12; y < H - 8; y += 8) { cv.circle(4, y, 2, (y / 8) % 2 ? mint : yel); cv.circle(W - 5, y, 2, (y / 8) % 2 ? yel : mint); }
    cv.rect(14, 14, 44, 12, '#ff3b5c'); text(cv, 'LIVE', 20, 18, '#ffffff'); cv.rect(270, 14, 36, 12, '#0d0820'); text(cv, 'CH 07', 273, 18, yel);
    text(cv, 'SCORE', 16, 36, mint, 2); text(cv, '1200', 16, 50, yel, 3);
    const star = (x, y, on) => { const c = on ? yel : '#4b3a86'; cv.rect(x + 2, y, 3, 7, c); cv.rect(x, y + 2, 7, 3, c); cv.px(x + 3, y - 1, c); };
    star(16, 74, true); star(26, 74, true); star(36, 74, false);
    text(cv, 'ROUND 3', 16, 90, pink, 2); cv.rect(16, 108, 112, 8, '#0d0820'); cv.rect(16, 108, 70, 8, mint);
    text(cv, 'PLAY AGAIN', 16, 126, '#ffffff');
    board(cv, 164, 24, 22, {
      cell: (x, y, s) => { cv.rect(x + 1, y + 1, s - 2, s - 2, '#3a2878'); cv.rect(x + 1, y + 1, s - 2, 2, '#4b3a96'); },
      seg: (a, b) => cv.rect(Math.min(a.x, b.x) - 4, Math.min(a.y, b.y) - 4, Math.abs(a.x - b.x) + 9, Math.abs(a.y - b.y) + 9, pink),
      dot: (p, n, done) => { cv.circle(p.x, p.y, 7, done ? yel : blue); text(cv, n, p.x - 1, p.y - 2, done ? bg : '#ffffff'); },
      head: p => { cv.circle(p.x, p.y, 4, '#ffffff'); cv.circle(p.x, p.y, 2, pink); }
    });
  }
  function satE(cv) { // ground station
    const panel = '#121a24', ln = '#2a3a4c', tx = '#c8d6e5', ok = '#59d38a', amb = '#ffb347';
    cv.rect(0, 0, W, H, '#0a1018');
    [[6, 6, 150, 60], [6, 72, 150, 52], [6, 130, 150, 44], [162, 6, 152, 168]].forEach(([x, y, w, h]) => { cv.rect(x, y, w, h, panel); cv.rect(x, y, w, 1, ln); });
    text(cv, 'GROUND TRACK', 12, 10, tx); for (let x = 0; x < 138; x++) cv.px(12 + x, 40 + Math.round(16 * Math.sin(x / 22)), ok); cv.rect(12, 56, 138, 1, ln); cv.circle(70, 40 + Math.round(16 * Math.sin(58 / 22)), 2, amb);
    text(cv, 'LINK', 12, 76, tx); for (let i = 0; i < 24; i++) cv.rect(12 + i * 6, 110 - ((i * 37) % 26), 4, (i * 37) % 26 + 2, ln); text(cv, 'OK', 130, 76, ok);
    text(cv, 'QUEUE 3', 12, 134, tx); text(cv, 'PASS 06:41', 12, 144, tx); text(cv, 'WINDOW OPEN', 12, 154, amb); text(cv, 'RF SENSING: NOT LICENSED', 12, 164, ln);
    text(cv, 'ROUTE', 168, 10, tx);
    board(cv, 172, 24, 22, {
      cell: (x, y, s) => { cv.rect(x + 1, y + 1, s - 2, s - 2, '#18232f'); },
      seg: (a, b) => cv.rect(Math.min(a.x, b.x) - 1, Math.min(a.y, b.y) - 1, Math.abs(a.x - b.x) + 3, Math.abs(a.y - b.y) + 3, ok),
      dot: (p, n, done) => { cv.circle(p.x, p.y, 6, done ? ok : tx); text(cv, n, p.x - 1, p.y - 2, panel); },
      head: p => { cv.rect(p.x - 6, p.y - 6, 13, 13, amb); cv.rect(p.x - 5, p.y - 5, 11, 11, '#18232f'); cv.circle(p.x, p.y, 2, ok); }
    });
  }

  // ---------------------------------------------------------------- the Moon (ending)
  const M = {
    space: '#04050b', star: '#c9cce0', earth: '#3b78d6', earthLand: '#58a86a', earthCloud: '#eef3ff', earthShade: '#1b386d',
    lunar: '#8b8d98', lunarHi: '#b4b6c1', lunarLo: '#5b5d68',
    wall: '#e8e5f1', wallHi: '#fbfaff', wallLo: '#c8c3d9', trim: '#d6b25a', trimHi: '#ffe6a1', trimLo: '#987832',
    floor: '#cbc6dc', floorHi: '#dfdbee', floorLo: '#a7a1bd',
    screen: '#0a0e1c', bezel: '#2a2f45', screenGlow: '#9fd0ff',
    sofa: '#7a5da6', sofaHi: '#9a7ec6', sofaLo: '#513c72',
    adult: '#272233', adultHi: '#5a5274',
    kid: '#f1e9d8', kidLo: '#a69c87', hair: '#2a1d16',
    rich: '#ffd3e6', richLo: '#c497b0', richHair: '#e6c068',
    pink: '#ff5fa2', yellow: '#ffd23f', mint: '#3ee6c1', blue: '#5b8cff', purple: '#2b1a5c',
    rug: '#f2c6d8', rugLo: '#d8a1b9', white: '#ffffff', warm: '#fff4d6'
  };
  function earthDisc(cv, x, y, r) {
    cv.circle(x, y, r, M.earth);
    cv.ellipse(x - Math.round(r * 0.3), y - Math.round(r * 0.2), Math.max(1, Math.round(r * 0.35)), Math.max(1, Math.round(r * 0.25)), M.earthLand);
    cv.ellipse(x + Math.round(r * 0.2), y + Math.round(r * 0.35), Math.max(1, Math.round(r * 0.25)), Math.max(1, Math.round(r * 0.18)), M.earthLand);
    cv.rect(x - Math.round(r * 0.6), y + Math.round(r * 0.05), Math.round(r * 0.8), 1, M.earthCloud); cv.rect(x - Math.round(r * 0.1), y - Math.round(r * 0.55), Math.round(r * 0.6), 1, M.earthCloud);
    for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35), sw = Math.round(hw * 0.45); cv.rect(x + hw - sw, y + dy, sw + 1, 1, M.earthShade); }
  }
  function porthole(cv, x, y, r, earth) {
    cv.circle(x, y, r + 3, M.trim); cv.circle(x, y, r + 1, M.trimLo); cv.circle(x, y, r, M.space);
    const rs = rng(x * 7 + y); for (let i = 0; i < r; i++) { const a = rs() * Math.PI * 2, d = rs() * (r - 2); cv.px(x + Math.cos(a) * d, y + Math.sin(a) * d - 2, M.star); }
    if (earth) earthDisc(cv, x + Math.round(r * 0.25), y - Math.round(r * 0.3), Math.max(3, Math.round(r * 0.36)));
    for (let dy = Math.round(r * 0.45); dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); cv.rect(x - hw, y + dy, 2 * hw + 1, 1, dy < r * 0.6 ? M.lunarHi : M.lunar); }
    cv.px(x - 4, y + r - 3, M.lunarLo); cv.px(x + 3, y + r - 5, M.lunarLo); cv.px(x + 4, y + r - 5, M.lunarLo);
    cv.rect(x - r, y - 1, 2, 3, M.trimHi); cv.rect(x + r - 1, y - 1, 2, 3, M.trimHi);
  }
  function tile(cv, x, y, w, h, kind, seed) {
    cv.rect(x - 2, y - 2, w + 4, h + 4, M.bezel); cv.rect(x, y, w, h, M.screen);
    const r = rng(seed), mid = y + Math.round(h * 0.62);
    if (kind === 'estate') { cv.rect(x, y, w, h, '#0f1735'); cv.poly([[x + 8, y + 14], [x + w / 2, y + 5], [x + w - 8, y + 14]], '#e2b146'); for (let i = 0; i < 5; i++) cv.rect(x + 10 + i * ((w - 20) / 4.4), y + 14, 2, h - 18, '#cfc8b6'); cv.rect(x + 6, y + h - 4, w - 12, 2, '#cfc8b6'); cv.px(x + w / 2, y + h - 8, '#ffb85c'); }
    else if (kind === 'street') { cv.rect(x, y, w, h, '#1c1f27'); for (let i = 0; i < 6; i++) { const bh = 8 + Math.floor(r() * (h - 10)); cv.rect(x + 2 + i * (w / 6), y + h - bh, w / 6 - 2, bh, r() < 0.5 ? '#3a3f4c' : '#2c303b'); if (r() < 0.7) cv.px(x + 4 + i * (w / 6), y + h - bh + 3, '#ffd28a'); } cv.rect(x, y + h - 3, w, 3, '#121419'); cv.px(x + w * 0.6, y + h - 5, '#ff4d4d'); }
    else if (kind === 'field') { cv.rect(x, y, w, mid - y, '#7fb4e6'); cv.rect(x, mid, w, y + h - mid, '#5f9e4f'); for (let i = 0; i < 9; i++) cv.px(x + r() * w, mid + 2 + r() * (y + h - mid - 3), '#86c46d'); cv.rect(x + w * 0.4, mid - 5, 2, 5, '#f1e9d8'); cv.px(x + w * 0.4, mid - 6, '#2a1d16'); }
    else if (kind === 'hall') { cv.rect(x, y, w, h, '#0d1226'); cv.rect(x, y + h - 6, w, 6, '#1a2045'); cv.rect(x + w * 0.3, y + h - 13, 3, 7, '#f1e9d8'); cv.rect(x + w * 0.3, y + h - 14, 3, 1, '#2a1d16'); cv.rect(x + w * 0.5, y + h - 10, w * 0.5, 1, '#ff3b3b'); cv.rect(x + w - 3, y + h - 12, 2, 4, '#4b5276'); }
    else if (kind === 'sat') { cv.rect(x, y, w, h, '#2c3328'); for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 6; gx++) if (r() < 0.75) cv.rect(x + 2 + gx * (w / 6), y + 2 + gy * (h / 4), w / 6 - 3, h / 4 - 3, r() < 0.5 ? '#6b7562' : '#8a937e'); const cx = x + w * 0.62, cy = y + h * 0.45; cv.rect(cx - 6, cy, 13, 1, '#ffb000'); cv.rect(cx, cy - 6, 1, 13, '#ffb000'); }
    else if (kind === 'beach') { cv.rect(x, y, w, h * 0.45, '#9fd3f0'); cv.rect(x, y + h * 0.45, w, h * 0.25, '#2f7fc0'); cv.rect(x, y + h * 0.7, w, h * 0.3, '#e8d39c'); cv.rect(x, y + h * 0.7, w, 1, '#ffffff'); cv.px(x + w * 0.7, y + h * 0.78, '#ff5fa2'); }
    else if (kind === 'crowd') { cv.rect(x, y, w, h, '#2a2533'); for (let j = 0; j < 4; j++) for (let i = 0; i < 10; i++) cv.rect(x + 1 + i * (w / 10) + (j % 2) * 2, y + 6 + j * 5, 2, 2, ['#f1d2b0', '#c48a5c', '#8a5a3b', '#5a3a26'][(i + j) % 4]); }
    else { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (r() < 0.4) cv.px(x + xx, y + yy, r() < 0.5 ? '#5d6274' : '#a3a8bb'); }
    cv.glowRect(x, y, w, h, M.screenGlow, 0.08);
  }
  function adult(cv, x, y, style) {
    cv.ellipse(x, y + 10, 9, 6, M.adult); cv.circle(x, y, 4, M.adult);
    if (style === 1) cv.circle(x, y - 5, 2, M.adult);
    if (style === 2) { cv.rect(x - 5, y - 2, 2, 8, M.adult); cv.rect(x + 4, y - 2, 2, 8, M.adult); }
    if (style === 3) cv.rect(x - 4, y - 5, 9, 2, M.adult);
    cv.rect(x - 2, y - 4, 5, 1, M.adultHi); cv.rect(x - 8, y + 5, 4, 1, M.adultHi); cv.rect(x + 5, y + 5, 4, 1, M.adultHi);
  }
  function moonAdults(cv) {
    cv.rect(0, 0, W, H, M.wallLo);
    cv.rect(16, 18, 288, 120, M.wall); cv.rect(16, 124, 288, 14, M.floorLo);
    porthole(cv, 54, 58, 22, true);
    const kinds = ['estate', 'street', 'field', 'hall', 'sat', 'beach', 'crowd', 'static'];
    kinds.forEach((k, i) => tile(cv, 98 + (i % 4) * 50, 26 + Math.floor(i / 4) * 34, 44, 28, k, 11 + i * 17));
    cv.glowRect(90, 22, 210, 72, M.screenGlow, 0.05);
    cv.rect(88, 96, 6, 22, M.trimLo); cv.circle(91, 94, 4, M.warm); softGlow(cv, 91, 94, 18, M.warm, 0.2);
    // sofa seen from behind, five heads lit by the screens
    [[118, 0], [150, 1], [184, 2], [222, 3], [260, 0]].forEach(([ax, s]) => adult(cv, ax, 99, s));
    cv.rect(100, 110, 184, 16, M.sofa); cv.rect(100, 110, 184, 2, M.sofaHi); cv.rect(96, 108, 8, 22, M.sofaLo); cv.rect(280, 108, 8, 22, M.sofaLo); cv.rect(100, 126, 184, 8, M.sofaLo);
    for (let x = 108; x < 280; x += 18) cv.px(x, 117, M.trimHi);
    // glass wall with gold mullions; reflections
    cv.rect(14, 16, 292, 3, M.trim); cv.rect(14, 137, 292, 4, M.trim); cv.rect(14, 141, 292, 1, M.trimLo);
    [14, 112, 208, 303].forEach(x => { cv.rect(x, 16, 3, 125, M.trim); cv.rect(x + 1, 16, 1, 125, M.trimHi); });
    cv.glowPoly([[44, 19], [66, 19], [30, 137], [8, 137]], M.white, 0.12); cv.glowPoly([[176, 19], [186, 19], [150, 137], [140, 137]], M.white, 0.08);
    cv.rect(0, 142, W, 10, M.wallHi); cv.rect(0, 151, W, 1, M.trimLo);
    cv.rect(0, 152, W, 28, M.floor); cv.rect(0, 152, W, 1, M.floorHi); for (let x = 0; x < W; x += 40) cv.rect(x, 152, 1, 28, M.floorLo);
    cv.glowRect(90, 152, 214, 10, M.screenGlow, 0.1);
    cv.rect(0, 0, W, 14, M.wallHi); for (let x = 30; x < 300; x += 64) { cv.rect(x, 12, 22, 2, M.warm); cv.glowPoly([[x, 14], [x + 22, 14], [x + 32, 30], [x - 10, 30]], M.warm, 0.1); }
    sprite(cv, KID, 34, 164 - 14, { h: M.hair, k: M.kid, s: M.kidLo });
    cv.glowRect(30, 150, 16, 14, M.screenGlow, 0.06);
  }
  function richKid(cv, x, y, bag) {
    cv.ellipse(x, y + 12, 13, 8, bag); cv.ellipse(x - 3, y + 8, 6, 3, M.white === bag ? M.wallLo : M.wallHi);
    cv.ellipse(x, y + 4, 6, 5, M.rich); cv.circle(x, y - 3, 4, M.richHair); cv.rect(x - 4, y - 1, 9, 2, M.richHair);
    cv.rect(x + 5, y + 3, 5, 3, M.bezel); cv.px(x + 9, y + 3, M.mint); cv.glowCircle(x + 7, y + 4, 4, M.mint, 0.2);
  }
  function moonKids(cv) {
    cv.rect(0, 0, W, H, M.wall); cv.rect(0, 0, W, 10, M.wallHi); cv.rect(0, 10, W, 2, M.trim);
    const sr = rng(23); for (let i = 0; i < 16; i++) { const sx = 60 + sr() * 250, sy = 14 + sr() * 100, c = [M.yellow, M.pink, M.mint, M.blue][i % 4]; if (sx > 104 && sx < 296 && sy < 116) continue; cv.rect(sx, sy + 1, 3, 1, c); cv.rect(sx + 1, sy, 1, 3, c); }
    cv.rect(0, 140, W, 40, M.floor); cv.rect(0, 140, W, 1, M.floorLo);
    cv.ellipse(196, 160, 100, 14, M.rug); for (let x = 110; x < 286; x += 12) cv.rect(x, 158, 6, 2, M.rugLo);
    // the big screen: the game the kids are playing
    cv.rect(102, 16, 196, 100, M.bezel); cv.rect(106, 20, 188, 92, M.purple);
    cv.rect(112, 26, 22, 8, '#ff3b5c'); text(cv, 'LIVE', 114, 28, M.white); text(cv, 'CH 07', 266, 28, M.yellow);
    cv.rect(112, 42, 70, 52, '#0d1226'); cv.rect(112, 86, 70, 8, '#1a2045'); cv.rect(130, 74, 3, 7, M.kid); cv.rect(130, 73, 3, 1, M.hair); cv.rect(140, 79, 42, 1, '#ff3b3b'); cv.rect(178, 76, 3, 4, '#4b5276');
    text(cv, 'SCORE 1200', 112, 100, M.mint);
    board(cv, 214, 40, 11, {
      cell: (x, y, s) => cv.rect(x + 1, y + 1, s - 2, s - 2, '#3a2878'),
      seg: (a, b) => cv.rect(Math.min(a.x, b.x) - 2, Math.min(a.y, b.y) - 2, Math.abs(a.x - b.x) + 5, Math.abs(a.y - b.y) + 5, M.pink),
      dot: (p, n, done) => cv.circle(p.x, p.y, 3, done ? M.yellow : M.blue),
      head: p => cv.circle(p.x, p.y, 2, M.white)
    });
    cv.glowRect(106, 20, 188, 92, M.screenGlow, 0.06); cv.glowPoly([[106, 116], [294, 116], [320, 150], [80, 150]], M.screenGlow, 0.08);
    // a porthole, the doorway, toys
    porthole(cv, 72, 44, 14, true);
    cv.rect(8, 50, 40, 90, '#3d3a52'); cv.rect(6, 48, 44, 2, M.trim); cv.rect(6, 48, 2, 92, M.trim); cv.rect(48, 48, 2, 92, M.trim);
    cv.glowPoly([[8, 140], [48, 140], [86, 170], [0, 170]], M.warm, 0.12);
    sprite(cv, KID, 22, 140 - 14, { h: M.hair, k: M.kid, s: M.kidLo });
    [[150, 120, M.pink], [196, 122, M.mint], [242, 120, M.blue]].forEach(([kx, ky, bag]) => richKid(cv, kx, ky, bag));
    cv.rect(66, 150, 8, 8, M.yellow); cv.rect(74, 154, 6, 6, M.blue); cv.rect(70, 146, 6, 4, M.pink);
    cv.poly([[292, 160], [298, 142], [304, 160]], M.white); cv.rect(296, 160, 4, 4, M.pink); cv.px(298, 150, M.blue);
  }
  function moonEnd(cv) {
    cv.rect(0, 0, W, H, '#07060c'); cv.rect(0, 150, W, 30, '#0d0b14');
    cv.line(160, 20, 138, 2, '#3a3442'); cv.line(160, 20, 184, 4, '#3a3442');
    cv.rect(58, 20, 204, 126, '#2d2836'); cv.rect(60, 22, 200, 2, '#463f52');
    cv.rect(70, 32, 150, 104, '#141119');
    cv.rect(72, 34, 146, 100, M.space);
    const rs = rng(5); for (let i = 0; i < 40; i++) cv.px(72 + rs() * 146, 34 + rs() * 100, M.star);
    // the Moon, a lit dome on its limb, and the first moment of the blast
    cv.circle(140, 88, 36, M.lunar); cv.circle(134, 82, 27, M.lunarHi);
    [[124, 76, 6], [150, 100, 8], [128, 104, 4], [156, 74, 3], [114, 92, 3]].forEach(([cx, cy, r]) => { cv.circle(cx, cy, r, M.lunarLo); cv.circle(cx - 1, cy - 1, Math.max(1, r - 2), M.lunar); });
    cv.rect(160, 58, 8, 4, M.trim); cv.rect(162, 56, 4, 2, M.trimHi);
    cv.glowCircle(164, 58, 34, M.warm, 0.18); cv.glowCircle(164, 58, 18, M.warm, 0.35); cv.circle(164, 58, 6, M.white);
    [[0, -1], [1, -1], [1, 0], [1, 1], [-1, -1], [-1, 0]].forEach(([dx, dy], i) => cv.line(164 + dx * 8, 58 + dy * 8, 164 + dx * (22 + i * 3), 58 + dy * (22 + i * 3), M.white));
    crackLine(cv, M.warm, 160, 64, 22, 3, -1); crackLine(cv, M.warm, 150, 62, 30, 8, -1);
    for (let y = 34; y < 134; y += 2) cv.glowRect(72, y, 146, 1, '#000000', 0.18);
    cv.glowRect(72, 34, 146, 100, M.warm, 0.05);
    text(cv, 'CH 07', 192, 38, M.yellow);
    cv.rect(228, 40, 22, 40, '#221e29'); for (let y = 42; y < 78; y += 3) cv.rect(230, y, 18, 1, '#141119');
    cv.circle(239, 94, 5, '#463f52'); cv.circle(239, 94, 2, '#141119'); cv.circle(239, 112, 5, '#463f52'); cv.circle(239, 112, 2, '#141119');
    cv.rect(96, 146, 128, 4, '#1b1722'); cv.rect(84, 150, 152, 3, '#120f18');
    cv.glowPoly([[70, 150], [250, 150], [300, 180], [20, 180]], M.warm, 0.08);
    cv.rect(0, 164, W, 16, '#030205'); cv.ellipse(160, 166, 140, 5, '#030205');
  }

  const SIDE = { exterior, middle, center, top, bodies };
  const SAT = { A: satA, B: satB, C: satC, D: satD, E: satE };
  const MOON = { adults: moonAdults, kids: moonKids, end: moonEnd };
  function scene(look, depth) { const cv = Canvas(); (SIDE[depth] || exterior)(cv, LOOKS[look] || LOOKS.A); return cv.out(); }
  function sat(look) { const cv = Canvas(); (SAT[look] || satA)(cv); return cv.out(); }
  function moonScene(which) { const cv = Canvas(); (MOON[which] || moonEnd)(cv); return cv.out(); }
  return { W, H, LOOKS, scene, sat, moon: moonScene };
}
if (typeof module !== 'undefined') module.exports = makePix;
