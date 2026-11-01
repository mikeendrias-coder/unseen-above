// A small synth so the game ships with no audio files. Beds (wind, lounge music, hum) loop until
// stopped; one-shots are tones and noise bursts. Everything goes through one master gain.
export const Sound = (() => {
  let ctx = null, master = null, muted = false, verb = null;
  const ensure = () => {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
        // a short feedback delay stands in for a room
        const d = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
        d.delayTime.value = 0.23; fb.gain.value = 0.32; lp.type = 'lowpass'; lp.frequency.value = 2400;
        d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(master);
        verb = d;
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };
  const out = (node, wet) => { node.connect(master); if (wet && verb) { const g = ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(verb); } };

  const tone = (freq, dur, type, vol, slideTo, wet) => {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.04, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); out(g, wet); o.start(t0); o.stop(t0 + dur + 0.05);
  };
  const noise = (dur, vol, cutoff) => {
    const c = ensure(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = cutoff || 4000;
    s.buffer = buf; g.gain.value = vol || 0.12; s.connect(f); f.connect(g); out(g, 0.2); s.start();
  };
  const noiseBuffer = secs => {
    const n = Math.floor(ctx.sampleRate * secs), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let b = 0; for (let i = 0; i < n; i++) { b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); d[i] = b * 6; }
    return buf;
  };
  const fadeStop = (g, nodes, secs) => {
    if (!ctx) return;
    const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0.0001, t + (secs || 1));
    setTimeout(() => nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { /* already stopped */ } }), (secs || 1) * 1000 + 100);
  };

  // Wind: brown noise through a moving band-pass.
  const wind = (vol) => {
    const c = ensure(); if (!c) return { stop() {}, set() {} };
    const s = c.createBufferSource(); s.buffer = noiseBuffer(4); s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.7;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 260; lfo.connect(lg); lg.connect(f.frequency);
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(vol || 0.16, c.currentTime + 2);
    s.connect(f); f.connect(g); out(g, 0.1); s.start(); lfo.start();
    return { stop: secs => fadeStop(g, [s, lfo], secs), set: (v, secs) => { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(Math.max(0.0001, v), t + (secs || 1)); } };
  };

  // Lounge: a slow, too-pleasant arpeggio, the sound of the untouched house.
  const lounge = (vol) => {
    const c = ensure(); if (!c) return { stop() {}, set() {} };
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(vol || 0.05, c.currentTime + 3);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.connect(g); out(g, 0.6);
    const chords = [[57, 61, 64, 68], [54, 57, 61, 64], [50, 54, 57, 61], [52, 56, 59, 63]];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    let step = 0, alive = true; const voices = [];
    const tick = () => {
      if (!alive || !ctx) return;
      const ch = chords[Math.floor(step / 8) % chords.length], note = ch[[0, 2, 1, 3, 2, 1, 3, 2][step % 8]] + 12;
      const t = c.currentTime, o = c.createOscillator(), e = c.createGain();
      o.type = 'sine'; o.frequency.value = hz(note); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.5, t + 0.02); e.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(e); e.connect(lp); o.start(t); o.stop(t + 1.7);
      if (step % 8 === 0) { const b = c.createOscillator(), be = c.createGain(); b.type = 'triangle'; b.frequency.value = hz(ch[0] - 12); be.gain.setValueAtTime(0.0001, t); be.gain.exponentialRampToValueAtTime(0.35, t + 0.4); be.gain.exponentialRampToValueAtTime(0.0001, t + 3.6); b.connect(be); be.connect(lp); b.start(t); b.stop(t + 3.7); }
      step++; voices.push(setTimeout(tick, 430));
    };
    tick();
    return { stop: secs => { alive = false; voices.forEach(clearTimeout); fadeStop(g, [lp], secs); }, set: (v, secs) => { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(Math.max(0.0001, v), t + (secs || 1)); } };
  };

  // Swell: a low chord that rises under a reveal.
  const swell = (secs, vol) => {
    const c = ensure(); if (!c) return;
    const t = c.currentTime, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(2400, t + secs * 0.7);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + secs * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + secs);
    lp.connect(g); out(g, 0.7);
    [45, 52, 57, 61, 64].forEach((m, i) => [-6, 6].forEach(cents => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12) * Math.pow(2, cents / 1200);
      const og = c.createGain(); og.gain.value = 0.12 / (1 + i * 0.3); o.connect(og); og.connect(lp); o.start(t); o.stop(t + secs + 0.1);
    }));
  };

  // Hum: mains hum and a ballast buzz, for rooms where the machines are awake.
  const hum = (vol) => {
    const c = ensure(); if (!c) return { stop() {}, set() {} };
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(vol || 0.03, c.currentTime + 1.5);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(g); out(g, 0.15);
    const oscs = [[55, 'sawtooth', 0.5], [55.4, 'sawtooth', 0.4], [110, 'square', 0.08], [165, 'sine', 0.12]].map(([f, type, v]) => {
      const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f; og.gain.value = v; o.connect(og); og.connect(lp); o.start(); return o;
    });
    return { stop: secs => fadeStop(g, oscs, secs), set: (v, secs) => { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(Math.max(0.0001, v), t + (secs || 1)); } };
  };

  // Show: a bright game show loop, major and fast, for the kids' screen.
  const show = (vol) => {
    const c = ensure(); if (!c) return { stop() {}, set() {} };
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(vol || 0.05, c.currentTime + 0.4);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.connect(g); out(g, 0.25);
    const hz = m => 440 * Math.pow(2, (m - 69) / 12), chords = [[60, 64, 67, 72], [65, 69, 72, 77], [67, 71, 74, 79], [60, 64, 67, 72]];
    let step = 0, alive = true; const timers = [];
    const tick = () => {
      if (!alive || !ctx) return;
      const ch = chords[Math.floor(step / 8) % chords.length], note = ch[[0, 1, 2, 3, 2, 1, 2, 3][step % 8]];
      const t = c.currentTime, o = c.createOscillator(), e = c.createGain();
      o.type = step % 2 ? 'triangle' : 'square'; o.frequency.value = hz(note); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(step % 2 ? 0.5 : 0.22, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(e); e.connect(lp); o.start(t); o.stop(t + 0.2);
      if (step % 4 === 0) { const b = c.createOscillator(), be = c.createGain(); b.type = 'triangle'; b.frequency.value = hz(ch[0] - 24); be.gain.setValueAtTime(0.0001, t); be.gain.exponentialRampToValueAtTime(0.6, t + 0.02); be.gain.exponentialRampToValueAtTime(0.0001, t + 0.45); b.connect(be); be.connect(lp); b.start(t); b.stop(t + 0.5); }
      step++; timers.push(setTimeout(tick, 165));
    };
    tick();
    return { stop: secs => { alive = false; timers.forEach(clearTimeout); fadeStop(g, [lp], secs); }, set: (v, secs) => { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(Math.max(0.0001, v), t + (secs || 1)); } };
  };

  return {
    ensure, tone, noise, wind, lounge, swell, hum, show,
    // The laser's charge. The satellite plays the same sound when a route is accepted (a clue).
    charge: () => tone(300, 0.55, 'sawtooth', 0.02, 900, 0.2),
    chime: () => { tone(1568, 0.5, 'sine', 0.03, null, 0.5); setTimeout(() => tone(2093, 0.6, 'sine', 0.025, null, 0.5), 90); },
    toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.9; return muted; },
    get muted() { return muted; }
  };
})();
