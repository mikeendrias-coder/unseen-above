// Records the trailer to a video: dist/trailer.mp4 (H.264 and AAC, 1920 x 1080, 30 fps).
// The page records itself (src/trailer/record.js: the picture and the game's own sound) and hands
// the recording over as a download; ffmpeg then makes the MP4. It plays in real time, so it takes
// as long as the trailer (about three minutes).
//   1. npm run build, and serve dist: (cd dist && python3 -m http.server 8881)
//   2. UA_BASE=http://localhost:8881 NODE_PATH=/home/michael/work/node_modules node src/trailer/record-run.js
// The window is 1920 x 1300 so the game draws at 6 device pixels a game pixel: its canvas is then
// exactly 1920 x 1080 and nothing is scaled twice. Chromium runs on the real GPU (ANGLE on GL).
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = process.env.UA_BASE || 'http://localhost:8766';
const DIST = path.join(__dirname, '..', '..', 'dist');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1300 }, deviceScaleFactor: 1, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(BASE + '/trailer.html?record');
  await p.waitForTimeout(800);
  const length = await p.evaluate(() => window.__trailerInfo.length);
  console.log('recording', length.toFixed(1), 's');
  const dl = p.waitForEvent('download', { timeout: (length + 90) * 1000 });
  await p.click('#tr-play');
  await p.waitForFunction(() => window.__recording, null, { timeout: 20000 });
  const audio = await p.evaluate(() => window.__recordAudio);
  console.log('audio track in the recording:', audio);
  const d = await dl;
  const webm = path.join(DIST, 'trailer-raw.webm');
  await d.saveAs(webm);
  console.log('saved', webm, (fs.statSync(webm).size / 1e6).toFixed(1) + ' MB');
  await b.close();
  if (errs.length) console.log('page errors:\n' + errs.slice(0, 20).join('\n'));
  const mp4 = path.join(DIST, 'trailer.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', webm, '-vf', 'fps=30,scale=1920:1080:flags=neighbor', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-tune', 'animation', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  fs.unlinkSync(webm);
  console.log('wrote', mp4, (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})();
