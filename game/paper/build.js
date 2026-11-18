// Builds the paper page: paper/paper.md (the one file Michael edits) into dist/paper.html, a
// single self-contained page (CSS, script and the caption font inline; no network). The game's
// build.js calls this; it also runs alone: node paper/build.js [--watch].
//
// Sections are the "## " headings. Each gets a fixed id the game can link to (paper.html#part-3):
// tldr, summary, intro, part-1 .. part-5, conclusion, and notes for the generated notes. A heading
// can also set its own id with {#id} at the end. Footnotes use [^label] in the text and
// "[^label]: text" lines; they are numbered in order of first use and get links both ways.
const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');

const HERE = __dirname;
const SRC = path.join(HERE, 'paper.md');
const TEMPLATE = path.join(HERE, 'template.html');
const FONT = path.join(HERE, '..', 'fonts', 'ch07-caption.ttf');
const REQUIRED = ['tldr', 'summary', 'intro', 'part-1', 'part-2', 'part-3', 'part-4', 'part-5', 'conclusion'];
// placeholder text: anything in square brackets that says one of these
const TODO = /\[([^\[\]<>]*?(?:goes here|Michael writes|Sample)[^\[\]<>]*?)\]/g;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = html => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const slug = s => s.toLowerCase().replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

// what a "## " heading becomes: its id, the short label on its tab, and its title
function classify(raw) {
  let text = raw.trim(), id = null;
  const own = text.match(/\s*\{#([A-Za-z][\w-]*)\}\s*$/);
  if (own) { id = own[1]; text = text.slice(0, own.index).trim(); }
  const part = text.match(/^part\s+([ivx]+|\d+)\s*[.:]?\s*(.*)$/i);
  if (part) {
    const n = ROMAN[part[1].toLowerCase()] || parseInt(part[1], 10);
    return { id: id || 'part-' + n, tab: 'PART ' + part[1].toUpperCase(), title: part[2] || text, toc: part[2] || text };
  }
  const t = text.toLowerCase();
  const known = [
    [/^tl;?\s*dr\b/, 'tldr', 'TL;DR'], [/^(executive\s+)?summary\b/, 'summary', 'SUMMARY'],
    [/^intro(duction)?\b/, 'intro', 'INTRO'], [/^conclusion\b/, 'conclusion', 'END'],
    [/^(foot|end)?notes\b/, 'notes', 'NOTES']
  ];
  for (const [re, kid, tab] of known) if (re.test(t)) return { id: id || kid, tab, title: text, toc: text };
  return { id: id || slug(text), tab: '', title: text, toc: text };
}

// Footnote definitions come out of the source; a definition runs on over lines indented by two
// spaces or more (and blank lines between them).
function takeNotes(src) {
  const lines = src.split('\n'), keep = [], defs = new Map();
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\[\^([^\]\s]+)\]:\s?(.*)$/);
    if (m) { cur = { label: m[1], lines: [m[2]] }; defs.set(m[1], cur); continue; }
    if (cur && (/^\s{2,}\S/.test(lines[i]) || (lines[i].trim() === '' && /^\s{2,}\S/.test(lines[i + 1] || '')))) { cur.lines.push(lines[i].replace(/^\s{2,4}/, '')); continue; }
    cur = null; keep.push(lines[i]);
  }
  return { body: keep.join('\n'), defs };
}

function build(opts = {}) {
  const out = opts.out || path.join(HERE, '..', 'dist');
  const warn = [];
  const md = new Marked({ gfm: true });
  md.use({
    renderer: {
      // smaller headings inside a section get ids too, for deep links
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        return `<h${depth} id="${esc(slug(strip(inner)))}">${inner}</h${depth}>\n`;
      },
      // Michael's HTML comments never reach the page
      html({ text }) { return /^\s*<!--[\s\S]*-->\s*$/.test(text) ? '' : text; }
    }
  });

  let src = fs.readFileSync(opts.src || SRC, 'utf8').replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const { body, defs } = takeNotes(src);

  // Footnote marks, numbered in order of first use. Each use gets its own id so every
  // back-link returns to the right spot.
  const order = [], uses = new Map();
  const marked = body.replace(/\[\^([^\]\s]+)\]/g, (all, label) => {
    if (!defs.has(label)) { warn.push(`note [^${label}] is used but never written out`); return all; }
    if (!uses.has(label)) { order.push(label); uses.set(label, 0); }
    const n = order.indexOf(label) + 1, k = uses.get(label) + 1;
    uses.set(label, k);
    const ref = k === 1 ? `fnref-${n}` : `fnref-${n}-${k}`;
    return `<sup class="fnref"><a href="#fn-${n}" id="${ref}" aria-label="Note ${n}">${n}</a></sup>`;
  });
  for (const label of defs.keys()) if (!uses.has(label)) { warn.push(`note [^${label}] is written out but never used; it is listed last`); order.push(label); uses.set(label, 0); }

  // split into the title block and the "## " sections (fenced code is left alone)
  const lines = marked.split('\n');
  let title = 'Unseen Above', byline = [], sections = [], cur = null, fence = false, pre = [];
  for (const line of lines) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    if (!fence && /^#\s+/.test(line) && !cur) { title = line.replace(/^#\s+/, '').trim(); continue; }
    if (!fence && /^##\s+/.test(line)) { cur = { head: line.replace(/^##\s+/, ''), lines: [] }; sections.push(cur); continue; }
    (cur ? cur.lines : pre).push(line);
  }
  byline = pre.join('\n').trim();

  sections = sections.map(s => {
    const c = classify(s.head);
    return { ...c, titleHtml: md.parseInline(c.title), tocText: strip(md.parseInline(c.toc)), html: md.parse(s.lines.join('\n')) };
  });
  // the TL;DR always comes first
  const tl = sections.findIndex(s => s.id === 'tldr');
  if (tl > 0) sections.unshift(sections.splice(tl, 1)[0]);
  if (tl < 0) warn.push('no TL;DR section (a "## TL;DR" heading)');
  const ids = new Set();
  for (const s of sections) { if (ids.has(s.id)) warn.push(`two sections have the id ${s.id}`); ids.add(s.id); }
  for (const id of REQUIRED) if (!ids.has(id)) warn.push(`no section with the id ${id} (the game links to it)`);
  // a "## Notes" section of his own is kept, and the numbered notes go under it
  const ownNotes = sections.find(s => s.id === 'notes');

  // the notes, numbered, each with a way back to every place it is used
  const notesHtml = order.map((label, i) => {
    const n = i + 1, d = defs.get(label), count = uses.get(label);
    let html = md.parse(d.lines.join('\n').trim()).trim();
    const backs = [];
    for (let k = 1; k <= count; k++) {
      const ref = k === 1 ? `fnref-${n}` : `fnref-${n}-${k}`;
      backs.push(`<a class="fnback" href="#${ref}" aria-label="Back to the text, note ${n}${count > 1 ? ' use ' + k : ''}">BACK${count > 1 ? ' ' + String.fromCharCode(96 + k).toUpperCase() : ''}</a>`);
    }
    const tail = backs.length ? ' ' + backs.join(' ') : '';
    html = /<\/p>$/.test(html) ? html.replace(/<\/p>$/, tail + '</p>') : html + tail;
    return `<li id="fn-${n}"><span class="fnnum" aria-hidden="true">${String(n).padStart(2, '0')}</span><div class="fntext">${html}</div></li>`;
  }).join('\n');

  // placeholders: grey boxes, and the stamp stays DRAFT while any are left
  let todos = 0;
  const mark = html => html.replace(TODO, (all, inner) => { todos++; return `<mark class="todo">[${inner}]</mark>`; });

  const sectionHtml = sections.filter(s => s !== ownNotes).map(s => {
    const tab = s.tab ? `<span class="tab" aria-hidden="true">${esc(s.tab)}</span>` : '';
    const cls = s.id === 'tldr' ? 'part tldr' : 'part';
    return `<section class="${cls}" aria-labelledby="${esc(s.id)}">\n<header class="sechead">${tab}<h2 id="${esc(s.id)}">${s.titleHtml}</h2></header>\n<div class="prose">${mark(s.html)}</div>\n</section>`;
  }).join('\n\n');
  const notesSection = order.length || ownNotes ? `<section class="part notes" aria-labelledby="notes">\n<header class="sechead"><span class="tab" aria-hidden="true">NOTES</span><h2 id="notes">${ownNotes ? ownNotes.titleHtml : 'Notes'}</h2></header>\n${ownNotes ? `<div class="prose">${mark(ownNotes.html)}</div>` : ''}<ol class="fnlist">\n${mark(notesHtml)}\n</ol>\n</section>` : '';
  if (!order.length && !ownNotes) warn.push('no notes yet, so there is no #notes section');

  const tocItems = sections.filter(s => s !== ownNotes).map(s => ({ id: s.id, tab: s.tab, text: s.tocText }));
  if (notesSection) tocItems.push({ id: 'notes', tab: 'NOTES', text: ownNotes ? ownNotes.tocText : 'Notes' });
  const toc = tocItems.map(t => `<li><a href="#${esc(t.id)}" data-for="${esc(t.id)}"><span class="ttab">${esc(t.tab || ' ')}</span><span class="ttext">${esc(t.text)}</span></a></li>`).join('\n');

  // the cover: title (the part before a colon in the caption face, the rest as a subtitle)
  const colon = title.indexOf(': ');
  const head = colon > 0 ? title.slice(0, colon) : title, sub = colon > 0 ? title.slice(colon + 2) : '';
  const titleHtml = `<span class="t1">${md.parseInline(head)}</span>${sub ? `<span class="t2">${md.parseInline(sub)}</span>` : ''}`;
  const bylineHtml = byline ? md.parseInline(byline.replace(/\n+/g, ' ')) : '';

  const words = strip(sectionHtml).replace(/\[[^\]]*\]/g, ' ').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 230));
  const stamp = todos ? 'DRAFT' : 'FILED';
  const font = 'data:font/ttf;base64,' + fs.readFileSync(FONT).toString('base64');

  const page = fs.readFileSync(TEMPLATE, 'utf8')
    .replace('__TITLE_TEXT__', () => esc(strip(md.parseInline(title))))
    .replace('__CCFONT__', () => font)
    .replace('__TITLE__', () => titleHtml)
    .replace('__BYLINE__', () => bylineHtml)
    .replace(/__STAMP__/g, () => stamp)
    .replace('__STAMP_CLASS__', () => todos ? 'stamp draft' : 'stamp filed')
    .replace('__SECTIONS_N__', () => String(sections.length - (ownNotes ? 1 : 0)))
    .replace('__NOTES_N__', () => String(order.length))
    .replace('__MINUTES__', () => String(minutes))
    .replace('__TOC__', () => toc)
    .replace('__BODY__', () => sectionHtml + '\n\n' + notesSection);

  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'paper.html'), page);
  for (const w of warn) console.log('paper: ' + w);
  console.log(`paper: ${path.relative(process.cwd(), path.join(out, 'paper.html'))}, ${sections.length} sections, ${order.length} notes, ${todos} placeholder${todos === 1 ? '' : 's'} left (${stamp})`);
  return { todos, warn };
}

module.exports = build;

if (require.main === module) {
  build();
  if (process.argv.includes('--watch')) {
    console.log('paper: watching paper/paper.md (Ctrl+C to stop)');
    let t = null;
    fs.watch(HERE, (ev, file) => {
      if (file !== 'paper.md' && file !== 'template.html') return;
      clearTimeout(t);
      t = setTimeout(() => { try { build(); } catch (e) { console.log('paper: ' + e.message); } }, 120);
    });
  }
}
