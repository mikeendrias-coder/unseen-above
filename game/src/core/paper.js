// The paper (Nov 18): the published page beside the game, built from paper/paper.md by
// paper/build.js (dist/paper.html locally, paper.html on the site). Each Part has its own anchor
// (paper.html#part-3). Links from the game open it in a new tab: the title's Paper row, About's
// foot, the ending screen's PAPER button and the books in the episodes (core/books.js).
// No imports, so ui/about.js can take it without changing which listeners come first.
export const paperUrl = n => 'paper.html' + (n ? '#part-' + n : '');
export function openPaper(n) {
  const url = paperUrl(n);
  window.__paperOpened = url; // for tests
  try { return window.open(url, '_blank', 'noopener'); } catch (e) { return null; }
}
