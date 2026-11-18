// The game's books (Nov 18): one per episode, each a Part of the paper. At build time this reads
// paper/paper.md (the file Michael edits; never written here) and gives, for Part I to Part V, the
// Part's title and its first paragraph as plain text the caption face can draw. The game's
// build.js puts the result in the bundle (src/data/books.js reads it as __PAPER_PARTS__).
// A paragraph still in [square brackets] that says "goes here", "Michael writes" or "Sample" is a
// placeholder: it shows without the brackets, marked so the slip draws it grey.
const fs = require('fs');
const path = require('path');

const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
const TODO = /\[([^\[\]<>]*?(?:goes here|Michael writes|Sample)[^\[\]<>]*?)\]/g;
// the letters the caption face has (src/art/ccglyphs.json); anything else is swapped or dropped
const GLYPHS = (() => {
  try { const g = require('../src/art/ccglyphs.json'); return new Set(Object.keys(g.glyphs || g)); } catch (e) { return null; }
})();

// Markdown to one plain line, in the caption face's letters (no em or en dashes: the house rule)
function plain(s) {
  let t = String(s)
    .replace(/\[\^[^\]]+\]/g, '')                    // note marks
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')        // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // links
    .replace(/<[^>]+>/g, '')                         // tags
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/(\*\*|__)(.+?)\1/g, '$2').replace(/(\*|_)(.+?)\1/g, '$2').replace(/`([^`]*)`/g, '$1')
    .replace(/\s*\u2014\s*/g, ', ').replace(/\u2013/g, '-')
    .replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...')
    .replace(/§§?\s*/g, 'Sec. ').replace(/¶\s*/g, 'Para. ')
    .replace(/\s+/g, ' ').trim();
  if (GLYPHS) t = [...t].filter(c => c === ' ' || GLYPHS.has(c)).join('');
  return t.replace(/ ,/g, ',').replace(/,,/g, ',').replace(/\s+/g, ' ').trim();
}

// { 1: { n, roman, title, text, placeholder }, ... 5 }
function parts(src) {
  if (src == null) src = fs.readFileSync(path.join(__dirname, 'paper.md'), 'utf8');
  src = src.replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n');
  const out = {};
  let cur = null, para = [];
  const close = () => { if (cur && cur.raw == null && para.length) cur.raw = para.join(' '); para = []; };
  for (const line of src.split('\n')) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      close();
      const text = h[1].replace(/\s*\{#[A-Za-z][\w-]*\}\s*$/, '').trim();
      const m = text.match(/^part\s+([ivx]+|\d+)\s*[.:]?\s*(.*)$/i);
      const n = m ? ROMAN[m[1].toLowerCase()] || parseInt(m[1], 10) : 0;
      cur = n >= 1 && n <= 5 && !out[n] ? (out[n] = { n, roman: m[1].toUpperCase(), titleRaw: m[2] || text, raw: null }) : null;
      continue;
    }
    if (!cur || cur.raw != null) continue;
    if (/^\s*\[\^[^\]]+\]:/.test(line) || /^#{1,6}\s/.test(line) || /^\s*(```|---+\s*$|\*\*\*+\s*$)/.test(line)) { close(); continue; }
    if (!line.trim()) { close(); continue; }
    para.push(line.replace(/^\s*>\s?/, '').replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''));
  }
  close();
  for (let n = 1; n <= 5; n++) {
    const p = out[n] || { n, roman: ['I', 'II', 'III', 'IV', 'V'][n - 1], titleRaw: 'Part ' + ['I', 'II', 'III', 'IV', 'V'][n - 1], raw: null };
    const raw = p.raw || '[Part ' + p.roman + ' text goes here.]';
    TODO.lastIndex = 0;
    const placeholder = TODO.test(raw);
    out[n] = { n, roman: p.roman, title: plain(p.titleRaw.replace(TODO, '$1')), text: plain(raw.replace(TODO, '$1')), placeholder };
  }
  return out;
}

module.exports = parts;
if (require.main === module) console.log(JSON.stringify(parts(), null, 2));
