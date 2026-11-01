// The start screen: a channel guide for CH 07. The five looks are tonight's channels; flipping
// through them shows the grounds live in each one, with static between channels. Whoever picks
// the look is doing what the kids at home do, which is the point. Painted with the game's own
// painter, before the game starts.
import { LOOKS, LOOK_KEYS } from '../art/palettes.js';
import { flat } from '../art/painter.js';
import { paintSky, paintMoon, paintLevel } from '../art/estate.js';
import { pixText, textWidth } from '../art/pixfont.js';
import { state } from '../core/state.js';
import { Sound } from '../core/sound.js';

const X0 = 600; // the fountain, the dome wing and the drone show over it
const cache = {};
function base(key) {
  if (cache[key]) return cache[key];
  const P = LOOKS[key], c = document.createElement('canvas'); c.width = 320; c.height = 180;
  const x = c.getContext('2d');
  x.drawImage(paintSky(P, 320).canvas, 0, 0);
  x.drawImage(paintMoon(P).canvas, 238, 10);
  x.drawImage(paintLevel(P).canvas, -X0, 0);
  return (cache[key] = c);
}
// a tiny pixel text on a 2d context, through the same 3x5 font the game uses
function ctxText(x, s, px, py, color) {
  const g = { fillStyle: (c, a) => { x.fillStyle = typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c; x.globalAlpha = a == null ? 1 : a; }, fillRect: (a, b, w, h) => x.fillRect(a, b, w, h) };
  pixText(g, s, px, py, color, 1, 1); x.globalAlpha = 1;
}

export function initPicker(onBegin) {
  const list = document.getElementById('tv-list'), canvas = document.getElementById('tv-canvas'), tv = document.getElementById('tv');
  if (!list || !canvas || !tv) return () => {};
  const ctx = canvas.getContext('2d');
  let current = LOOK_KEYS.indexOf(state.look); if (current < 0) current = 0;
  let flip = 0, alive = true, last = performance.now(), t = 0, gestured = false;
  const accent = k => flat(LOOKS[k].gold), glow = k => flat(LOOKS[k].lamp);
  const buttons = LOOK_KEYS.map((k, i) => {
    const P = LOOKS[k], li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'option');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = String(i + 1);
    const name = document.createElement('span'); name.textContent = P.name;
    const v = document.createElement('span'); v.className = 'v';
    const sw = document.createElement('span'); sw.className = 'sw';
    ['skyMid', 'wall', 'gold', 'glassLit'].forEach(r => { const d = document.createElement('i'); d.style.background = flat(P[r]); sw.append(d); });
    b.append(n, name, v, sw);
    b.addEventListener('click', () => { gestured = true; pick(i); });
    b.addEventListener('mouseenter', () => { if (i !== current) pick(i, true); });
    li.append(b); list.append(li);
    return b;
  });
  // the vote from home: other viewers keep voting while you choose, and your pick is one vote
  const votes = LOOK_KEYS.map(() => 700 + Math.floor(Math.random() * 2400)), count = document.getElementById('tv-count');
  let mine = -1, tally = 0;
  const showVotes = () => {
    const tot = votes.reduce((a, b) => a + b, 0);
    buttons.forEach((b, j) => { b.querySelector('.v').textContent = Math.round(votes[j] / tot * 100) + '%'; });
    if (count) count.textContent = tot.toLocaleString('en-US');
  };
  function pick(i, quiet) {
    current = (i + LOOK_KEYS.length) % LOOK_KEYS.length; flip = 0.22;
    if (mine >= 0) votes[mine]--; mine = current; votes[mine]++; showVotes();
    const k = LOOK_KEYS[current]; state.setLook(k);
    buttons.forEach((b, j) => b.setAttribute('aria-selected', j === current ? 'true' : 'false'));
    tv.style.setProperty('--sel', accent(k)); tv.style.setProperty('--glow', glow(k) + '40');
    if (gestured && !quiet) { Sound.ensure(); Sound.noise(0.12, 0.03, 6000); Sound.tone(392 * Math.pow(2, current / 5), 0.12, 'triangle', 0.02); }
  }
  pick(current, true);
  const onKey = ev => {
    if (!alive) return;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') { gestured = true; pick(current + 1); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') { gestured = true; pick(current - 1); ev.preventDefault(); }
    else if (/^[1-5]$/.test(ev.key)) { gestured = true; pick(Number(ev.key) - 1); }
    else if (ev.key === 'Enter' && document.activeElement && document.activeElement.closest && !document.activeElement.closest('.jump')) { ev.preventDefault(); onBegin(); }
  };
  window.addEventListener('keydown', onKey);
  // the preview: the grounds at night in this look, beams and drones moving, a channel switch
  const frame = now => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; flip = Math.max(0, flip - dt);
    tally += dt; if (tally > 0.4) { tally = 0; for (let n = 1 + Math.floor(Math.random() * 7); n > 0; n--) votes[Math.floor(Math.random() * votes.length)]++; showVotes(); }
    const k = LOOK_KEYS[current], P = LOOKS[k];
    ctx.drawImage(base(k), 0, 0);
    // searchlight beams from the grounds into the sky
    ctx.globalCompositeOperation = 'lighter';
    [[60, 0.21, 0], [150, 0.17, 1.7], [250, 0.23, 3.1]].forEach(([bx, sp, ph], i) => {
      const a = -Math.PI / 2 + Math.sin(t * sp * 2 + ph) * 0.5, len = 200, w = 10;
      ctx.fillStyle = flat(i % 2 ? P.shaft : P.lamp); ctx.globalAlpha = 0.08;
      ctx.beginPath(); ctx.moveTo(bx, 120); ctx.lineTo(bx + Math.cos(a) * len - Math.sin(a) * w * 3, 120 + Math.sin(a) * len + Math.cos(a) * w * 3); ctx.lineTo(bx + Math.cos(a) * len + Math.sin(a) * w * 3, 120 + Math.sin(a) * len - Math.cos(a) * w * 3); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // the drone show overhead
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 16 + 3 * Math.sin(t * 2 + i), x = 160 + Math.cos(a + t * 0.4) * r * 1.6, y = 40 + Math.sin(a + t * 0.4) * r * 0.7; ctx.fillStyle = flat([P.glint, P.goldHi, P.glassLit][i % 3]); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6 + i); ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    ctx.globalAlpha = 1;
    // the broadcast marks
    if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#ff4d5e'; ctx.fillRect(8, 8, 3, 3); }
    ctxText(ctx, 'LIVE', 14, 7, '#ffffff'); ctxText(ctx, 'CH 07', 320 - 8 - textWidth('CH 07'), 7, '#ffffff');
    const label = (current + 1) + ' ' + P.name.toUpperCase(); ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(4, 162, textWidth(label) + 8, 11); ctxText(ctx, label, 8, 165, flat(P.goldHi));
    // static between channels
    if (flip > 0) { const img = ctx.getImageData(0, 0, 320, 180), d = img.data, s = flip / 0.22; for (let i = 0; i < d.length; i += 4) { if (Math.random() < s) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; } } ctx.putImageData(img, 0, 0); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return () => { alive = false; window.removeEventListener('keydown', onKey); };
}
