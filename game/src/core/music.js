// Background music: original pieces played live by the game's own synth, so the game still ships
// as one file. A small sequencer schedules each step a moment ahead on the audio clock. A piece
// is a loop of a few parts (chords, bass, an arpeggio, a melody, drums). When the music pack is
// bought, these can be swapped for recordings piece by piece.
import { Sound } from './sound.js';

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let cur = null, noiseBuf = null;

// ------------------------------------------------------------------ instruments
const I = {
  // a soft electric piano: a sine with a little of the octave and a fifth above
  keys(c, o, t, m, len, v) {
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42 * v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); g.connect(o);
    [[1, 'sine', 1], [2, 'sine', 0.16], [3, 'triangle', 0.05]].forEach(([k, type, a]) => { const s = c.createOscillator(), q = c.createGain(); s.type = type; s.frequency.value = hz(m) * k; q.gain.value = a; s.connect(q); q.connect(g); s.start(t); s.stop(t + 1.6); });
  },
  // slow detuned saws under a soft filter, held for the note's length
  pad(c, o, t, m, len, v) {
    const g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 820; f.Q.value = 0.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12 * v, t + Math.min(0.9, len * 0.4)); g.gain.setValueAtTime(0.12 * v, t + len * 0.85); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.8);
    f.connect(g); g.connect(o);
    [-8, 7].forEach(d => { const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = hz(m); s.detune.value = d; s.connect(f); s.start(t); s.stop(t + len + 0.9); });
  },
  // a short plucked square, its brightness closing fast
  pluck(c, o, t, m, len, v) {
    const s = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    s.type = 'square'; s.frequency.value = hz(m); f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(400, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    s.connect(f); f.connect(g); g.connect(o); s.start(t); s.stop(t + 0.32);
  },
  bass(c, o, t, m, len, v) {
    const g = c.createGain(), d = Math.max(0.18, Math.min(0.9, len * 0.9)); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d); g.connect(o);
    [['triangle', 1, 1], ['sine', 2, 0.35]].forEach(([type, k, a]) => { const s = c.createOscillator(), q = c.createGain(); s.type = type; s.frequency.value = hz(m) * k; q.gain.value = a; s.connect(q); q.connect(g); s.start(t); s.stop(t + d + 0.05); });
  },
  // a small bell: a sine and an out-of-tune partial, ringing on
  bell(c, o, t, m, len, v) {
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); g.connect(o);
    [[1, 1], [2.76, 0.32], [5.4, 0.1]].forEach(([k, a]) => { const s = c.createOscillator(), q = c.createGain(); s.type = 'sine'; s.frequency.value = hz(m) * k; q.gain.setValueAtTime(a, t); q.gain.exponentialRampToValueAtTime(0.0001, t + 2.4 / k); s.connect(q); q.connect(g); s.start(t); s.stop(t + 2.5); });
  },
  // a vibraphone: a sine with a slow tremolo
  vib(c, o, t, m, len, v) {
    const s = c.createOscillator(), g = c.createGain(), tr = c.createGain(), l = c.createOscillator(), la = c.createGain();
    s.type = 'sine'; s.frequency.value = hz(m); l.frequency.value = 5.2; la.gain.value = 0.35; l.connect(la); la.connect(tr.gain); tr.gain.value = 0.65;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    s.connect(tr); tr.connect(g); g.connect(o); s.start(t); l.start(t); s.stop(t + 1.7); l.stop(t + 1.7);
  },
  // a square lead, held for its length
  lead(c, o, t, m, len, v) {
    const s = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    s.type = 'square'; s.frequency.value = hz(m); f.type = 'lowpass'; f.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07 * v, t + 0.01); g.gain.setValueAtTime(0.07 * v, t + Math.max(0.02, len - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
    s.connect(f); f.connect(g); g.connect(o); s.start(t); s.stop(t + len + 0.1);
  },
  // a drone: two sines a hair apart, swelling in and out over its length
  drone(c, o, t, m, len, v) {
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16 * v, t + len * 0.3); g.gain.linearRampToValueAtTime(0.16 * v, t + len * 0.75); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.4); g.connect(o);
    [0, 4].forEach(d => { const s = c.createOscillator(); s.type = 'sine'; s.frequency.value = hz(m); s.detune.value = d; s.connect(g); s.start(t); s.stop(t + len + 0.5); });
  },
  kick(c, o, t, m, len, v) {
    const s = c.createOscillator(), g = c.createGain(); s.type = 'sine'; s.frequency.setValueAtTime(120, t); s.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); s.connect(g); g.connect(o); s.start(t); s.stop(t + 0.3);
  },
  tom(c, o, t, m, len, v) {
    const s = c.createOscillator(), g = c.createGain(); s.type = 'sine'; s.frequency.setValueAtTime(hz(m), t); s.frequency.exponentialRampToValueAtTime(hz(m) * 0.45, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.45 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32); s.connect(g); g.connect(o); s.start(t); s.stop(t + 0.34);
  },
  hat(c, o, t, m, len, v) { noiseHit(c, o, t, 'highpass', 7200, 0.035, 0.09 * v); },
  brush(c, o, t, m, len, v) { noiseHit(c, o, t, 'bandpass', 2400, 0.12, 0.08 * v); },
  snare(c, o, t, m, len, v) { noiseHit(c, o, t, 'bandpass', 1800, 0.16, 0.16 * v); }
};
function noiseHit(c, o, t, type, freq, dur, vol) {
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(o); s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.02);
}

// ------------------------------------------------------------------ writing pieces
// events: [step in the loop, instrument, midi note, length in steps, velocity]
const S = 16;
const chords = (inst, list, hits, len, vel, oct) => list.flatMap((ch, b) => hits.flatMap(h => ch.map(m => [b * S + h, inst, m + (oct || 0), len, vel])));
const notes = (inst, rows, vel, oct) => rows.flatMap(([bar, step, m, len]) => m == null ? [] : [[bar * S + step, inst, m + (oct || 0), len, vel]]);
const beat = (inst, pats, m, vel) => pats.flatMap((p, b) => [...p].flatMap((ch, i) => ch === '.' || ch === ' ' ? [] : [[b * S + i, inst, m || 60, 1, ch === 'X' ? vel * 1.5 : vel]]));
const arp = (inst, list, order, vel, len) => list.flatMap((ch, b) => order.flatMap((k, i) => k == null ? [] : [[b * S + i, inst, ch[k % ch.length] + 12 * Math.floor(k / ch.length), len || 1, vel]]));
const roots = (inst, list, hits, vel, len) => list.flatMap((m, b) => hits.map(([h, add]) => [b * S + h, inst, m + (add || 0), len || 2, vel]));
const rep = (arr, n) => Array.from({ length: n }, () => arr).flat();

// the siblings' theme, A minor: it opens the game and comes back, smaller, in the bedroom
const THEME = [[0, 0, 76, 6], [0, 6, 74, 2], [0, 8, 72, 8], [1, 0, 71, 6], [1, 6, 72, 2], [1, 8, 69, 8], [2, 0, 72, 4], [2, 4, 71, 4], [2, 8, 69, 4], [2, 12, 67, 4], [3, 0, 69, 14]];
const AM = [[57, 60, 64], [53, 57, 60, 64], [48, 55, 60, 64], [52, 56, 59, 64]];

export const PIECES = {
  // the start screen: a channel guide's music, late at night
  menu: { bpm: 84, bars: 4, vol: 0.05, ev: [
    ...chords('keys', [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], [0, 6, 10], 2, 0.55),
    ...roots('bass', [41, 40, 38, 36], [[0], [8, 12]], 0.7, 4),
    ...notes('vib', [[0, 0, 72, 4], [0, 4, 69, 2], [0, 6, 72, 2], [0, 8, 76, 6], [1, 0, 74, 4], [1, 4, 72, 4], [1, 8, 71, 8], [2, 0, 69, 4], [2, 4, 72, 2], [2, 6, 74, 2], [2, 8, 77, 6], [3, 0, 76, 4], [3, 4, 74, 2], [3, 6, 72, 2], [3, 8, 71, 4], [3, 12, 67, 4]], 0.7),
    ...beat('brush', rep(['x.x.x.x.x.x.x.x.'], 4), 60, 0.35)] },
  // the opening on the ridge: the theme over slow chords
  opening: { bpm: 60, bars: 4, vol: 0.045, ev: [
    ...AM.flatMap((ch, b) => ch.map(m => [b * S, 'pad', m, 16, 0.8])),
    ...roots('bass', [45, 41, 48, 40], [[0]], 0.5, 12),
    ...notes('keys', THEME, 0.65)] },
  // the bedroom: the theme on a music box, slower, the chords barely there
  bedroom: { bpm: 56, bars: 4, vol: 0.04, ev: [
    ...AM.flatMap((ch, b) => ch.map(m => [b * S, 'pad', m - 12, 16, 0.45])),
    ...notes('bell', THEME, 0.55, 12)] },
  // episode 1, the grounds: F sharp minor (it sits under the house's lounge music), uneasy
  grounds: { bpm: 96, bars: 4, vol: 0.042, ev: [
    ...[[54, 57, 61], [50, 54, 57], [47, 50, 54], [49, 53, 56]].flatMap((ch, b) => ch.map(m => [b * S, 'pad', m, 16, 0.55])),
    ...roots('bass', [42, 38, 35, 37], [[0], [2], [4], [6, 12], [8], [10], [12], [14, 12]], 0.55, 1),
    ...arp('pluck', [[66, 69, 73], [62, 66, 69], [59, 62, 66], [61, 65, 68]], [0, 1, 2, 1, 0, 1, 2, 3, 0, 1, 2, 1, 0, 2, 1, 3], 0.5),
    ...beat('hat', rep(['..x...x...x...x.'], 4), 60, 0.6),
    ...notes('bell', [[3, 0, 81, 4], [3, 4, 80, 4], [3, 8, 78, 4], [3, 12, 76, 4]], 0.4)] },
  // episode 2, deeper in the house: low, a heartbeat, a few cold bells
  housedeep: { bpm: 72, bars: 4, vol: 0.05, ev: [
    [0, 'drone', 42, 32, 0.8], [2 * S, 'drone', 38, 32, 0.8],
    ...[[54, 57, 61, 64], [50, 54, 57, 61]].flatMap((ch, b) => ch.map(m => [b * 2 * S, 'pad', m - 12, 32, 0.4])),
    ...beat('kick', rep(['x..x............'], 4), 60, 0.5),
    ...notes('bell', [[0, 6, 85, 4], [1, 10, 81, 4], [2, 2, 78, 4], [3, 8, 73, 4], [3, 14, 76, 4]], 0.35)] },
  // episode 3, the east wing: a drone, a slow pulse, bells far apart
  eastwing: { bpm: 66, bars: 4, vol: 0.05, ev: [
    [0, 'drone', 45, 64, 0.9], [0, 'drone', 52, 64, 0.5],
    ...beat('kick', rep(['x.......x.......'], 4), 60, 0.35),
    ...notes('bell', [[0, 4, 69, 4], [0, 12, 72, 4], [1, 6, 74, 4], [2, 0, 76, 4], [2, 10, 67, 4], [3, 4, 72, 4], [3, 13, 69, 3]], 0.4)] },
  // episode 4 in the dark: almost nothing, the clock keeps the time
  dark: { bpm: 60, bars: 8, vol: 0.05, ev: [
    [0, 'drone', 38, 128, 0.9], [0, 'drone', 45, 128, 0.45],
    [4 * S, 'pad', 50, 24, 0.7], [4 * S, 'pad', 51, 24, 0.6], [4 * S, 'pad', 57, 24, 0.5],
    ...notes('bell', [[1, 8, 86, 4], [6, 4, 85, 4]], 0.25)] },
  // the run, when the floor goes: drums, a driving bass, a climbing arpeggio
  run: { bpm: 150, bars: 4, vol: 0.05, ev: [
    ...beat('kick', rep(['x.......x.......'], 4), 60, 0.8),
    ...[...rep(['x..x..x...x..x..'], 4)].flatMap((p, b) => [...p].flatMap((ch, i) => ch === 'x' ? [[b * S + i, 'tom', [45, 43, 40, 38][(i + b) % 4], 1, 0.7]] : [])),
    ...roots('bass', [38, 34, 36, 38], [[0], [2], [4], [6], [8], [10], [12], [14]], 0.6, 1),
    ...arp('pluck', [[62, 65, 69], [58, 62, 65], [60, 64, 67], [62, 65, 69]], [0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6], 0.45),
    ...beat('hat', rep(['xxxxxxxxxxxxxxxx'], 4), 60, 0.35)] },
  // the Moon: easy listening in A major, for people who are never in danger
  moon: { bpm: 112, bars: 4, vol: 0.042, ev: [
    ...chords('keys', [[57, 61, 64, 68], [54, 57, 61, 64], [47, 50, 54, 57], [52, 56, 59, 62]], [0, 3, 6, 10, 12], 2, 0.45),
    ...roots('bass', [45, 42, 35, 40], [[0], [6, 7], [8], [14, 7]], 0.6, 2),
    ...notes('vib', [[0, 0, 76, 6], [0, 6, 73, 2], [0, 8, 71, 8], [1, 0, 69, 4], [1, 4, 73, 4], [1, 8, 76, 4], [1, 12, 78, 4], [2, 0, 74, 6], [2, 6, 73, 2], [2, 8, 71, 4], [2, 12, 69, 4], [3, 0, 68, 8], [3, 8, 71, 8]], 0.6),
    ...beat('brush', rep(['x.xX.xx.x.xX.xx.'], 4), 60, 0.3)] },
  // backstage behind the Moon city: the hum of the building, a slow pulse, a few cold notes
  backstage: { bpm: 80, bars: 4, vol: 0.045, ev: [
    [0, 'drone', 40, 64, 0.8], [0, 'drone', 47, 64, 0.4],
    ...beat('kick', rep(['x.......x.......'], 4), 60, 0.3),
    ...beat('hat', rep(['....x.......x...'], 4), 60, 0.35),
    ...notes('pluck', [[0, 6, 76, 1], [1, 2, 71, 1], [1, 10, 74, 1], [2, 6, 76, 1], [3, 2, 79, 1], [3, 10, 78, 1]], 0.35)] },
  // the fight with the creator: E minor, drums from the run, a cold pluck, a lead that climbs
  boss: { bpm: 132, bars: 4, vol: 0.05, ev: [
    ...beat('kick', rep(['x.....x...x.....'], 4), 60, 0.75),
    ...beat('snare', rep(['....x.......x...'], 4), 60, 0.45),
    ...beat('hat', rep(['x.xxx.xxx.xxx.xx'], 4), 60, 0.3),
    ...roots('bass', [40, 40, 36, 38], [[0], [3], [6], [8], [11], [14]], 0.6, 1),
    ...arp('pluck', [[64, 67, 71], [64, 67, 71], [60, 64, 67], [62, 66, 69]], [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 3], 0.4),
    ...notes('lead', [[0, 0, 76, 3], [0, 4, 74, 2], [0, 6, 71, 6], [1, 0, 76, 3], [1, 4, 79, 2], [1, 6, 78, 6], [2, 0, 72, 3], [2, 4, 71, 2], [2, 6, 67, 6], [3, 0, 74, 4], [3, 4, 78, 4], [3, 8, 81, 8]], 0.45)] },
  // satellite screen 1, the back end: cold, minimal
  sat1: { bpm: 118, bars: 4, vol: 0.036, ev: [
    ...arp('pluck', [[60, 63, 67, 70], [56, 60, 63, 67], [58, 62, 65, 68], [60, 63, 67, 70]], [0, null, 2, null, 1, null, 3, null, 0, 2, null, 1, null, 3, null, 2], 0.5),
    ...roots('bass', [36, 32, 34, 36], [[0], [10]], 0.45, 6),
    ...beat('kick', rep(['x.......x.......'], 4), 60, 0.4),
    ...beat('hat', rep(['....x.......x...'], 4), 60, 0.5)] },
  // satellite screen 2, the ground station: pads, a pulse, small bleeps
  sat2: { bpm: 104, bars: 4, vol: 0.04, ev: [
    ...[[57, 60, 64], [52, 55, 59], [53, 57, 60], [55, 59, 62]].flatMap((ch, b) => ch.map(m => [b * S, 'pad', m, 16, 0.6])),
    ...roots('bass', [45, 40, 41, 43], [[0], [2], [4], [6], [8], [10], [12], [14]], 0.45, 1),
    ...notes('pluck', [[0, 3, 81, 1], [0, 11, 84, 1], [1, 6, 79, 1], [2, 2, 81, 1], [2, 9, 88, 1], [3, 5, 84, 1], [3, 13, 79, 1]], 0.4),
    ...beat('hat', rep(['..x...x...x...xx'], 4), 60, 0.45)] },
  // satellite screen 3, the flat map: a little chip tune
  sat3: { bpm: 128, bars: 4, vol: 0.036, ev: [
    ...notes('lead', [[0, 0, 76, 2], [0, 2, 79, 2], [0, 4, 83, 4], [0, 8, 81, 2], [0, 10, 79, 2], [0, 12, 78, 4], [1, 0, 76, 4], [1, 4, 71, 4], [1, 8, 74, 4], [1, 12, 76, 4], [2, 0, 79, 2], [2, 2, 81, 2], [2, 4, 84, 4], [2, 8, 83, 2], [2, 10, 81, 2], [2, 12, 79, 4], [3, 0, 78, 4], [3, 4, 74, 4], [3, 8, 78, 4], [3, 12, 81, 4]], 0.7),
    ...roots('bass', [40, 40, 36, 38], [[0], [2, 12], [4], [6, 12], [8], [10, 12], [12], [14, 12]], 0.5, 1),
    ...beat('kick', rep(['x.......x.......'], 4), 60, 0.5),
    ...beat('snare', rep(['....x.......x...'], 4), 60, 0.5),
    ...beat('hat', rep(['x.x.x.x.x.x.x.x.'], 4), 60, 0.35)] }
};

// ------------------------------------------------------------------ the player
function compile(def) {
  const steps = def.bars * S, buckets = Array.from({ length: steps }, () => []);
  def.ev.forEach(e => { const i = ((e[0] % steps) + steps) % steps; buckets[i].push(e); });
  return buckets;
}
export const Music = {
  // start a piece (crossfading from whatever plays); the same piece again keeps playing
  play(name, opts) {
    opts = opts || {};
    if (cur && cur.name === name) { if (opts.level != null) Music.level(opts.level, 0.8); return; }
    const c = Sound.ensure(), def = PIECES[name]; if (!c || !def) return;
    Music.stop(opts.fade != null ? opts.fade : 1.2);
    const out = Sound.bus(); if (!out) return;
    const g = c.createGain(), base = def.vol, lv = opts.level != null ? opts.level : 1;
    g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.linearRampToValueAtTime(Math.max(0.0001, base * lv), c.currentTime + (opts.fadeIn || 1.5));
    g.connect(out);
    const me = { name, def, g, base, out, buckets: compile(def), step: 0, next: c.currentTime + 0.08, dur: 60 / def.bpm / 4 };
    me.timer = setInterval(() => tick(me), 40);
    cur = me;
  },
  stop(secs) {
    if (!cur) return;
    const me = cur, c = Sound.ctx; cur = null;
    clearInterval(me.timer);
    if (c) { const t = c.currentTime; me.g.gain.cancelScheduledValues(t); me.g.gain.setValueAtTime(me.g.gain.value, t); me.g.gain.linearRampToValueAtTime(0.0001, t + (secs || 1)); }
    setTimeout(() => { try { me.g.disconnect(); me.out.disconnect(); } catch (e) { /* already gone */ } }, ((secs || 1) + 2.6) * 1000);
  },
  // 0 to 1 of the piece's own volume, eased over secs
  level(v, secs) {
    if (!cur || !Sound.ctx) return;
    const c = Sound.ctx, t = c.currentTime; cur.g.gain.cancelScheduledValues(t); cur.g.gain.setValueAtTime(cur.g.gain.value, t); cur.g.gain.linearRampToValueAtTime(Math.max(0.0001, cur.base * v), t + (secs || 0.5));
  },
  get playing() { return cur ? cur.name : null; }
};
function tick(me) {
  const c = Sound.ctx; if (!c || cur !== me) return;
  // schedule what falls in the next 150 ms; after a stall (a hidden tab), skip ahead rather than pile up
  if (me.next < c.currentTime - 0.25) me.next = c.currentTime + 0.05;
  while (me.next < c.currentTime + 0.15) {
    const list = me.buckets[me.step % me.buckets.length];
    for (const [, inst, m, len, v] of list) { const fn = I[inst]; if (fn) fn(c, me.g, me.next, m, len * me.dur, v); }
    me.next += me.dur; me.step++;
  }
}
