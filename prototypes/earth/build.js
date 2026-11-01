const fs = require('fs');
const [,, phaserSrc, out, wrap] = process.argv;
let html = fs.readFileSync('template.html', 'utf8')
  .replace('__PHASER_SRC__', phaserSrc)
  .replace('__EARTH__', () => fs.readFileSync('earth.js', 'utf8'));
if (wrap === 'wrap') html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + html + '</body></html>';
fs.writeFileSync(out, html);
console.log('built', out, html.length, 'bytes');
