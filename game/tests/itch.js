// The itch.io zip (python3 tools/pack-itch.py) runs on its own: unpacked into an empty folder and
// served, it starts with no requests to any other host and no errors.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ua-itch-'));
  execFileSync('python3', ['-I', '-c', 'import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', path.join(__dirname, '../dist/unseen-above-itch.zip'), dir]);
  const files = fs.readdirSync(dir).sort();
  const types = { '.html': 'text/html', '.js': 'text/javascript' };
  const srv = http.createServer((q, r) => { const f = path.join(dir, path.basename(q.url.split('?')[0]) || 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(8767);
  const ok = (label, v) => console.log((v ? 'ok   ' : 'FAIL ') + label);
  ok('the zip holds ' + files.join(', '), files.join(',') === 'index.html,phaser.min.js');
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const away = []; p.on('request', r => { if (!r.url().startsWith('http://localhost:8767') && !r.url().startsWith('data:')) away.push(r.url()); });
  await p.goto('http://localhost:8767/index.html'); await p.click('#start');
  await p.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.sys.isActive(), null, { timeout: 30000 });
  await p.waitForTimeout(2000);
  ok('it starts the opening (' + await p.evaluate(() => window.__game.scene.sys.settings.key) + ') with nothing fetched from elsewhere' + (away.length ? ': ' + away.join(' ') : ''), !away.length);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' | ') : 'no page errors');
  await b.close(); srv.close();
})();
