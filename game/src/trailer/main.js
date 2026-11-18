// The trailer for Unseen Above: the real game, played by a director. Each shot starts a real
// scene (or stages one already running), moves the camera or plays her through it with key
// events (trailer/input.js), and cuts on the music. The music and sounds are the game's own
// (core/music.js, core/sound.js), played on the same audio clock the director keeps time by, so
// the cuts land on the beat. Title cards, subtitles and the end cards are drawn by trailer/cards.js.
// Viewer keys: Space (or a click) pauses, F full screen, Esc stops.
// ?record: auto-plays and records the picture and the sound to a video (trailer/record.js).
// ?from=<shot id>: starts there (for working on one shot); ?only: stops after it.
import './sandbox.js';                 // first: the game's save goes to memory (see sandbox.js)
import { keys, guardKeys } from './input.js';
import { Music } from '../core/music.js';
import { Sound } from '../core/sound.js';
import { overlay } from '../core/overlay.js';
import { cg } from '../ui/cg.js';
import { display } from '../core/display.js';
import { drawLayer } from './cards.js';
import { SHOTS, PIECES_EXTRA } from './shots.js';
import { Recorder, routeAudio } from './record.js';
import { PIECES } from '../core/music.js';

const params = new URLSearchParams(location.search);
const RECORD = params.has('record');
const FROM = params.get('from'), ONLY = params.has('only');
routeAudio(RECORD);
if (RECORD) document.body.classList.add('rec');
Object.assign(PIECES, PIECES_EXTRA);

// ---------------------------------------------------------------- the game's music and cards
// Scenes start their own music and title cards as they open; in the trailer only the director
// does, so those calls are let through only while the director makes them.
let let_ = false;
const gate = (obj, name) => { const real = obj[name]; obj[name] = function (...a) { if (!let_) return; return real.apply(this, a); }; return (...a) => { let_ = true; try { return real.apply(obj, a); } finally { let_ = false; } }; };
const music = { play: gate(Music, 'play'), stop: gate(Music, 'stop'), level: gate(Music, 'level') };
const card = gate(overlay, 'card');
overlay.note = () => {}; // the TV's own messages (W opens doors, NOTED, Stuck?) stay off

// ---------------------------------------------------------------- the picture
const stage = () => document.getElementById('stage');
const trCv = document.getElementById('tr'), tr = trCv.getContext('2d');
tr.imageSmoothingEnabled = false;
// the picture's box on the page: the game canvas scaled to fill the window (without the caption strip)
let box = { x: 0, y: 0, w: 0, h: 0, k: 1 };
function fit() {
  const st = stage(); if (!st || !display.cssW) return;
  const vw = window.innerWidth, vh = window.innerHeight, k = Math.min(vw / display.cssW, vh / display.cssH);
  const w = display.cssW * k, h = display.cssH * k, x = (vw - w) / 2, y = (vh - h) / 2, x0 = (st.clientWidth - display.cssW) / 2;
  if (box.x === x && box.y === y && box.w === w && box.k === k && box.x0 === x0) return;
  box = { x, y, w, h, k, x0 };
  st.style.transform = `translate(${x - x0 * k}px, ${y}px) scale(${k})`;
  st.style.clipPath = `inset(0px ${x0}px calc(100% - ${display.cssH}px) ${x0}px)`;
  Object.assign(trCv.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
}

// ---------------------------------------------------------------- the director
const layer = { card: null, sub: null, chyron: null, dim: 0 };
let game = null, t0 = 0, pausedAt = null, cur = -1, prerolled = new Map(), shown = null, done = false, rec = null;
const clock = () => (Sound.ctx ? Sound.ctx.currentTime : performance.now() / 1000);
const now = () => (pausedAt != null ? pausedAt : clock()) - t0;
// shot start times, from their lengths
let at = 0; SHOTS.forEach(s => { s.start = at; at += s.len; });
export const LENGTH = at;
// a shot that stages the scene before it starts from that scene's shot
const startIndex = (() => { let i = FROM ? Math.max(0, SHOTS.findIndex(s => s.id === FROM)) : 0; while (i > 0 && SHOTS[i].keep) i--; return i; })();

function stopScenes(except) {
  game.scene.getScenes(false).forEach(sc => { const s = sc.sys; if (sc !== except && (s.isActive() || s.isPaused() || s.isSleeping())) game.scene.stop(s.settings.key); });
}
const camsVisible = (sc, on) => sc.cameras.cameras.forEach(c => c.setVisible(on));
// start a scene, hidden; resolves with it once its create() has run
function launch(shot) {
  const [key, data] = shot.scene, sc = game.scene.getScene(key);
  const p = new Promise(res => sc.sys.events.once('create', () => {
    camsVisible(sc, false);
    if (shot.stage) shot.stage(sc, D);
    sc.cameras.main.resetFX();
    res(sc);
  }));
  if (shot.prep) shot.prep(D);
  game.scene.start(key, Object.assign({}, data || {}));
  prerolled.set(shot, p);
  return p;
}
// the cut: what was on screen stops, this shot's scene shows
async function show(shot) {
  let p = prerolled.get(shot);
  if (!p) p = launch(shot);
  const sc = await p;
  if (SHOTS[cur] !== shot) return; // already past it (paused or seeking)
  stopScenes(sc); camsVisible(sc, true); sc.cameras.main.resetFX(); sc.__shot = shot;
  cg.clearAll(); overlay.clearCaption();
  shown = sc; D.sc = sc;
  if (shot.onShow) shot.onShow(sc, D);
}

function enter(i) {
  const shot = SHOTS[i]; cur = i;
  keys.clear(); D.b = {};
  layer.sub = null; layer.chyron = null;
  layer.card = shot.card ? Object.assign({ t0: now() }, shot.card) : null;
  layer.dim = 0;
  if (shot.music !== undefined) {
    if (shot.music === null) music.stop(shot.musicFade || 0.05);
    else { const [name, o] = Array.isArray(shot.music) ? shot.music : [shot.music, {}]; music.play(name, Object.assign({ fade: 0.05, fadeIn: 0.02 }, o)); }
  }
  if (shot.sound) shot.sound(Sound);
  shot.fired = new Set();
  if (shot.keep && shown) { shown.__shot = shot; if (shot.onShow) shot.onShow(shown, D); }
  else if (shot.scene) show(shot);
  else if (shot.stopGame) { stopScenes(null); shown = null; }
  if (shot.enter) shot.enter(D);
}

// ---------------------------------------------------------------- each frame
function frame() {
  try { step(); } catch (e) { console.warn('trailer: ' + (e && e.message)); }
}
function step() {
  fit();
  if (!game || done) return;
  const t = now();
  // the shot on now
  let i = cur;
  while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].start) i++;
  if (ONLY && i > startIndex) return finish();
  if (t >= LENGTH) return finish();
  if (i !== cur) enter(i);
  const shot = SHOTS[cur], tl = t - shot.start;
  // the next shot's scene starts a moment early, hidden, so the cut is clean
  const next = SHOTS[cur + 1];
  if (next && next.scene && !prerolled.has(next) && !next.noPre && t >= next.start - (next.pre || 0.8)) {
    const key = next.scene[0];
    if (!shown || shown.sys.settings.key !== key) launch(next);
  }
  // timed things inside the shot: subtitles, lower thirds, sounds, actions
  (shot.subs || []).forEach(([a, who, text, len, italic]) => { if (tl >= a && tl < a + (len || 2.6)) layer.sub = { who, text, italic }; else if (layer.sub && layer.sub.text === text) layer.sub = null; });
  (shot.at || []).forEach(([a, fn], j) => { if (tl >= a && !shot.fired.has(j) && (!shot.scene && !shot.keep || (shown && shown.__shot === shot))) { shot.fired.add(j); fn(D, shown); } });
  if (shot.dim) layer.dim = shot.dim(tl);
  if (shot.frame && shown && shown.__shot === shot) shot.frame(shown, tl, D);
  drawLayer(tr, layer, t);
  if (rec) rec.frame();
}

// ---------------------------------------------------------------- what the shots can use
export const D = {
  sc: null, b: {}, keys, Sound, card, music, layer,
  get t() { return now(); },
  sub(who, text) { layer.sub = text ? { who, text } : null; },
  chyron(tag, title, left) { layer.chyron = tag ? { tag, title, left } : null; }
};
window.__trailer = D;

// ---------------------------------------------------------------- start, pause, stop
const startScreen = document.getElementById('tr-start'), endScreen = document.getElementById('tr-end');
const pausedNote = document.getElementById('tr-paused');
const gameLink = document.getElementById('tr-game');
if (gameLink && !/github\.io$/.test(location.hostname)) gameLink.href = 'local.html';
// the recorded trailer, when the build found one beside the page (a fallback for a slow computer)
if (document.body.dataset.video === '1' && !RECORD) document.getElementById('tr-video').hidden = false;

async function begin() {
  startScreen.hidden = true; endScreen.hidden = true;
  Sound.ensure();
  if (RECORD) rec = new Recorder();
  // the game boots as it does on its own page, and its Begin is pressed (the opening starts;
  // the first shot takes over at once)
  if (!game) {
    await import('../main.js');
    document.getElementById('start').click();
    await new Promise(res => { const w = () => (window.__unseen && window.__unseen.game && window.__unseen.game.isBooted ? res() : setTimeout(w, 30)); w(); });
    game = window.__unseen.game;
    game.events.on('postrender', frame);
  }
  stage().classList.add('shown');
  fit();
  if (rec) await rec.start(game.canvas, document.getElementById('cg'), trCv, Sound.ctx);
  t0 = clock() - SHOTS[startIndex].start; cur = startIndex - 1; done = false; window.__trailerDone = false;
}
function setPaused(on) {
  if (!game || done || on === (pausedAt != null)) return;
  if (on) { pausedAt = clock(); game.loop.sleep(); Sound.hold(true); }
  else { Sound.hold(false); t0 += clock() - pausedAt; pausedAt = null; game.loop.wake(); }
  pausedNote.hidden = !on;
}
function finish() {
  if (done) return;
  done = true; window.__trailerDone = true;
  keys.clear(); music.stop(0.6);
  if (game) stopScenes(null);
  cg.clearAll(); overlay.clearCaption();
  tr.clearRect(0, 0, 320, 180);
  stage().classList.remove('shown');
  if (rec) rec.stop();
  else endScreen.hidden = false;
  const again = document.getElementById('tr-again'); if (again && !RECORD) again.focus({ preventScroll: true });
}
function stopNow() { if (!game || done) return; if (pausedAt != null) setPaused(false); finish(); }
function toggleFull() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  } catch (e) { /* not allowed here */ }
}
// the viewer's keys (trailer/input.js keeps every real key away from the game)
guardKeys(e => {
  const k = e.key;
  if (k === 'f' || k === 'F') { toggleFull(); return true; }
  if (!startScreen.hidden || !endScreen.hidden) {
    if (k === 'Enter' || k === ' ') { if (document.activeElement && document.activeElement.click && document.activeElement.tagName !== 'BODY') document.activeElement.click(); else begin(); return true; }
    return false;
  }
  if (k === ' ' || k === 'Spacebar' || k === 'k' || k === 'K') { setPaused(pausedAt == null); return true; }
  if (k === 'Escape') { stopNow(); return true; }
  return true;
});
document.getElementById('tr-shield').addEventListener('click', () => setPaused(pausedAt == null));
document.getElementById('tr-play').addEventListener('click', begin);
document.getElementById('tr-again').addEventListener('click', () => { location.href = location.pathname + location.search.replace(/[?&]from=[^&]*/, ''); });
window.addEventListener('resize', fit);
document.getElementById('tr-play').focus({ preventScroll: true });
// tests and the recorder read these
window.__trailerInfo = { length: LENGTH, shots: SHOTS.map(s => ({ id: s.id, start: s.start, len: s.len })), get shot() { return cur >= 0 && SHOTS[cur] ? SHOTS[cur].id : null; }, get t() { return now(); } };
