// Builds dist/trailer.html: the game's own page (template.html) and the whole game bundle, with
// the trailer's director as the entry (src/trailer/main.js). It runs the real scenes, so it is
// real footage. Like dist/local.html it loads phaser.min.js from beside it, so it plays offline
// from the same folder. Called at the end of build.js (npm run build), or on its own:
// node src/trailer/build.js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

module.exports = function buildTrailer(opts) {
  const root = path.join(__dirname, '..', '..');
  const out = (opts && opts.out) || path.join(root, 'dist');
  fs.mkdirSync(out, { recursive: true });
  const PARTS = require(path.join(root, 'paper/parts.js'))();
  const result = esbuild.buildSync({
    entryPoints: [path.join(__dirname, 'main.js')],
    bundle: true, format: 'iife', target: ['es2020'], write: false, legalComments: 'none',
    define: { __PAPER_PARTS__: JSON.stringify(PARTS) },
    banner: { js: '/* Unseen Above, the trailer. Source: github.com/mikeendrias-coder/unseen-above (game/src/trailer) */' }
  });
  const bundle = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const font = 'data:font/ttf;base64,' + fs.readFileSync(path.join(root, 'fonts/ch07-caption.ttf')).toString('base64');
  const own = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  let page = fs.readFileSync(path.join(root, 'template.html'), 'utf8')
    .replace('<title>Unseen Above</title>', '<title>Unseen Above Trailer</title>')
    .replace('__CCFONT__', font).replace('__PHASER_SRC__', 'phaser.min.js').replace('__BUNDLE__', () => bundle);
  // the trailer's style and screens go after the game's markup, before its scripts
  const at = page.indexOf('<script src="phaser.min.js">');
  page = page.slice(0, at) + own + '\n' + page.slice(at);
  // the start screen offers the recording too, when there is one small enough to publish beside it
  const mp4 = path.join(out, 'trailer.mp4'), video = fs.existsSync(mp4) && fs.statSync(mp4).size < 90 * 1024 * 1024;
  page = page.replace('<canvas id="tr"', () => `<script>document.body.dataset.video = '${video ? 1 : 0}';</script>\n<canvas id="tr"`);
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + page + '</body></html>';
  fs.writeFileSync(path.join(out, 'trailer.html'), html);
  if (!fs.existsSync(path.join(out, 'phaser.min.js'))) fs.copyFileSync(path.join(root, 'node_modules/phaser/dist/phaser.min.js'), path.join(out, 'phaser.min.js'));
  console.log('trailer: dist/trailer.html, ' + (bundle.length / 1024).toFixed(1) + ' KB bundle');
};
if (require.main === module) module.exports();
