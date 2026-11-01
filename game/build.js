// Bundles src/ into one page. dist/unseen-above.html loads Phaser from jsDelivr (for publishing);
// dist/local.html loads dist/phaser.min.js (for offline tests). The bundle is not minified, so
// the published page carries readable source.
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const PHASER_CDN = 'https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js';
const out = path.join(__dirname, 'dist');
fs.mkdirSync(out, { recursive: true });

const result = esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'src/main.js')],
  bundle: true, format: 'iife', target: ['es2020'], write: false, legalComments: 'none',
  banner: { js: '/* Unseen Above (working title). Source: github.com/mikeendrias-coder/unseen-above */' }
});
const bundle = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
// the caption face as a web font, built by tools/make-font.py from src/art/ccglyphs.json
const font = 'data:font/ttf;base64,' + fs.readFileSync(path.join(__dirname, 'fonts/ch07-caption.ttf')).toString('base64');
const page = src => template.replace('__CCFONT__', font).replace('__PHASER_SRC__', src).replace('__BUNDLE__', () => bundle);
// The published page is wrapped in a document skeleton by the host, so it has none of its own;
// the local test page gets a matching skeleton here.
const skeleton = body => '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>';
fs.writeFileSync(path.join(out, 'unseen-above.html'), page(PHASER_CDN));
fs.writeFileSync(path.join(out, 'local.html'), skeleton(page('phaser.min.js')));
fs.copyFileSync(path.join(__dirname, 'node_modules/phaser/dist/phaser.min.js'), path.join(out, 'phaser.min.js'));
console.log('built', (bundle.length / 1024).toFixed(1) + ' KB bundle');
