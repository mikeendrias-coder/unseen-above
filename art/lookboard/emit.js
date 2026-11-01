// Turns pix.js scenes into static SVG markup and writes the look board's canvas files.
// node emit.js board <root>      -> writes <root>/project/canvas.json and every artboard
// node emit.js preview <out.html> -> one local page with every scene at 2x (for a look before publishing)
'use strict';
const fs = require('fs'), path = require('path');
const pix = require('./pix.js')();

const RATIO = { checker: 0.5, q25: 0.25, q12: 0.125, rows: 0.5 };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const blend = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v * t + B[i] * (1 - t))); };

function svgFor(out, id, label, s) {
  const d = rs => rs.filter(r => r.w > 0 && r.h > 0).map(r => `M${r.x * s} ${r.y * s}h${r.w * s}v${r.h * s}h-${r.w * s}z`).join('');
  const byInk = new Map();
  for (const r of out.rects) { if (!byInk.has(r.ink)) byInk.set(r.ink, []); byInk.get(r.ink).push(r); }
  const defs = [], solids = [], dithers = [];
  let n = 0;
  for (const [ink, rs] of byInk) {
    const dd = d(rs);
    if (!ink.startsWith('d:')) { solids.push(`<path fill="${ink}" d="${dd}"></path>`); continue; }
    const [, a, b, type] = ink.split(':'), pid = `${id}-d${n++}`;
    let size = 2, cells = [[0, 0], [1, 1]];
    if (type === 'q25') cells = [[0, 0]];
    else if (type === 'q12') { size = 4; cells = [[0, 0], [2, 2]]; }
    else if (type === 'rows') cells = [[0, 0], [1, 0]];
    defs.push(`<pattern id="${pid}" x="0" y="0" width="${size * s}" height="${size * s}" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="${size * s}" height="${size * s}" fill="${b}"></rect>` +
      cells.map(([cx, cy]) => `<rect x="${cx * s}" y="${cy * s}" width="${s}" height="${s}" fill="${a}"></rect>`).join('') + `</pattern>`);
    // a flat tone underneath, so the area still reads if the pattern ever fails to paint
    solids.push(`<path fill="${blend(a, b, RATIO[type] || 0.5)}" d="${dd}"></path>`);
    dithers.push(`<path fill="url(#${pid})" d="${dd}"></path>`);
  }
  const byGlow = new Map();
  for (const g of out.glows) { const k = g.f + '|' + g.o; if (!byGlow.has(k)) byGlow.set(k, []); byGlow.get(k).push(g); }
  const glows = [...byGlow].map(([k, gs]) => { const [f, o] = k.split('|'); return `<path fill="${f}" opacity="${o}" d="${d(gs)}"></path>`; });
  const W = pix.W * s, H = pix.H * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="${label}" style="display: block">` +
    (defs.length ? `<defs>${defs.join('')}</defs>` : '') + solids.join('') + dithers.join('') + glows.join('') + `</svg>`;
}

// ------------------------------------------------------------------ what goes on the board
const LOOKROWS = [
  ['A', 'Gilded Night', 'navy night, gold, warm windows'],
  ['B', 'Marble and Chrome', 'cold, pale, expensive'],
  ['C', 'Signal on Silhouette', 'near black; only danger and gold glow'],
  ['D', 'Rot and Gold', 'purple night, green walls, loud gold'],
  ['E', 'Moonlit Ink', 'two colors and dither, red for danger']
];
const DEPTHS = [
  ['exterior', 'outside', 'Outside', 'The estate at night: gold temple front, dome wing, glass wing, diamond fountain, the girl and a cleaning robot'],
  ['middle', 'middle', 'Middle (worn)', 'A worn gallery: cracks, a fallen portrait, a snapped column, a hole in the ceiling, a camera cone and a laser'],
  ['center', 'center', 'Center bedroom', 'The ruined bedroom: collapsed canopy bed, open roof, the mismatched door to the void, the brother lying near it'],
  ['top', 'top', 'Top-down room', 'Top-down room: torn rug, columns, a moonlit hole, a camera cone and a tripwire'],
  ['bodies', 'bodies', 'Bodies over time', 'Four bodies in the same spot, older from left to right']
];
const SATS = [['A', 'Office terminal'], ['B', 'War room'], ['C', 'Flat map'], ['D', "Kids' game show"], ['E', 'Ground station']];
const MOONS = [['adults', "Adults' TV room", 'Through a glass wall: rich adults on a sofa watching a wall of Earth channels; the girl walks past'],
  ['kids', "Kids' game room", 'Rich kids on beanbags playing the game on a giant screen; the girl in the doorway'],
  ['end', 'Last shot', 'An old TV in a dark room showing the Moon at the first moment of the blast']];

function boards() {
  const list = [];
  LOOKROWS.forEach(([L, name], r) => DEPTHS.forEach(([depth, slug, title, label], c) => list.push({
    file: r === 0 && c === 0 ? 'Main.dc.html' : `${L}-${slug}.dc.html`, title: `${L}${c + 1} ${title}`, row: r, col: c,
    alt: `Look ${L}, ${name}. ${label}`, make: () => pix.scene(L, depth), id: `${L}${slug}`
  })));
  SATS.forEach(([L, title], c) => list.push({ file: `Sat-${L}.dc.html`, title: `S${c + 1} ${title}`, row: 5, col: c,
    alt: `Satellite screen, ${title.toLowerCase()} look: the same routing board half solved`, make: () => pix.sat(L), id: `sat${L}` }));
  MOONS.forEach(([which, title, label], c) => list.push({ file: `Moon-${which}.dc.html`, title: `M${c + 1} ${title}`, row: 6, col: c,
    alt: `The Moon. ${label}`, make: () => pix.moon(which), id: `moon${which}` }));
  return list;
}
const ROWTITLES = LOOKROWS.map(([L, name, what]) => `Look ${L} · ${name} (${what})`).concat(['Satellite screens (one board, five looks)', 'The Moon (ending)']);

const FW = 960, FH = 540, GAPX = 80, PITCH = FH + 420;
function artboard(b, svg) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${b.title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
body{margin:0}
svg{shape-rendering:crispEdges}
</style>
</helmet>
<div style="width: ${FW}px; height: ${FH}px; overflow: hidden; background: #000000">
${svg}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${FW},"height":${FH}}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`;
}

const mode = process.argv[2], target = process.argv[3];
const list = boards();
if (mode === 'board') {
  const proj = path.join(target, 'project'); fs.mkdirSync(proj, { recursive: true });
  const canvas = { v: 3, createdOnFiles: { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') }, title: 'Game Look Board', launch: { view: 'canvas' }, pages: [], boards: {}, order: [], notes: {}, designSystems: [] };
  const rowW = 4 * (FW + GAPX) + FW;
  list.forEach(b => { canvas.boards[b.file] = { x: b.col * (FW + GAPX), y: b.row * PITCH, w: FW, h: FH, title: b.title }; canvas.order.push(b.file); });
  ROWTITLES.forEach((t, r) => { canvas.notes['row' + r] = { x: 0, y: r * PITCH - 300, text: t, kind: 'title1', maxW: rowW }; });
  fs.writeFileSync(path.join(proj, 'canvas.json'), JSON.stringify(canvas, null, 1));
  let total = 0;
  list.forEach(b => { const out = b.make(); const html = artboard(b, svgFor(out, b.id, b.alt, 3)); fs.writeFileSync(path.join(proj, b.file), html); total += html.length; console.log(b.file.padEnd(22), String(html.length).padStart(8), 'gaps', out.gaps); });
  console.log('total', total, 'boards', list.length);
} else if (mode === 'preview') {
  const rows = [];
  list.forEach(b => { (rows[b.row] = rows[b.row] || []).push(`<figure><figcaption>${b.title}</figcaption>${svgFor(b.make(), b.id, b.alt, 2)}</figure>`); });
  fs.writeFileSync(target, `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;color:#ddd;font:14px sans-serif}svg{shape-rendering:crispEdges}.row{display:grid;grid-template-columns:repeat(2,640px);gap:8px;padding:8px;width:1296px}figure{margin:0}figcaption{padding:2px 0}</style>` +
    rows.map((r, i) => `<div class="row" id="r${i}">${r.join('')}</div>`).join(''));
  console.log('rows', rows.length);
}
