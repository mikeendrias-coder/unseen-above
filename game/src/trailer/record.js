// Recording the trailer to a video, inside the page (trailer.html?record). Every frame the game's
// picture, the show's caption canvas (its picture part) and the trailer's own canvas are drawn
// into one canvas at 1920 x 1080 (or 1280 x 720 with &size=720); that canvas and the game's sound
// go to a MediaRecorder. The sound: the game's master gain connects to the speakers
// (core/sound.js); routeAudio() sends every connection to the speakers through one bus that also feeds a stream, so the
// recording hears exactly what a viewer hears. At the end the video is handed over as a download
// (src/trailer/record-run.js saves it).
// The sound, louder: the game is mixed quietly to sit under a room (its music at a few percent
// of full scale); a trailer plays loud. Whatever connects to the speakers goes through a gain and
// a compressor first (one bus per audio context; Phaser makes a context of its own, silent here).
// With record on, the bus also feeds a stream for the recording.
const BOOST = 5.5, buses = new Map();
export function routeAudio(record) {
  const real = AudioNode.prototype.connect;
  const busFor = c => {
    if (buses.has(c)) return buses.get(c);
    const g = c.createGain(), k = c.createDynamicsCompressor();
    g.gain.value = BOOST;
    k.threshold.value = -12; k.knee.value = 6; k.ratio.value = 6; k.attack.value = 0.004; k.release.value = 0.2;
    real.call(g, k); real.call(k, c.destination);
    const bus = { in: g, tap: record ? c.createMediaStreamDestination() : null };
    if (bus.tap) real.call(k, bus.tap);
    buses.set(c, bus); return bus;
  };
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (typeof AudioDestinationNode !== 'undefined' && dest instanceof AudioDestinationNode) return real.call(this, busFor(this.context).in, ...rest);
    return real.call(this, dest, ...rest);
  };
}
const tapOf = c => (buses.get(c) || {}).tap;

export class Recorder {
  constructor() {
    const big = new URLSearchParams(location.search).get('size') !== '720';
    this.W = big ? 1920 : 1280; this.H = big ? 1080 : 720;
    this.cv = document.createElement('canvas'); this.cv.width = this.W; this.cv.height = this.H;
    this.cv.style.cssText = 'position:fixed;left:-99999px;top:0';
    document.body.appendChild(this.cv);
    this.ctx = this.cv.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.chunks = []; this.frames = 0;
  }
  async start(gameCanvas, cgCanvas, trCanvas, audioCtx) {
    const tap = tapOf(audioCtx);
    this.g = gameCanvas; this.cg = cgCanvas; this.tr = trCanvas;
    this.frame();
    const stream = this.cv.captureStream(30);
    if (tap) tap.stream.getAudioTracks().forEach(tk => stream.addTrack(tk));
    window.__recordAudio = !!(tap && tap.stream.getAudioTracks().length);
    const types = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm'];
    const mimeType = types.find(t => MediaRecorder.isTypeSupported(t));
    this.mr = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: this.W > 1280 ? 14000000 : 8000000, audioBitsPerSecond: 192000 });
    this.mr.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
    this.mr.start(1000);
    window.__recording = true;
  }
  // one composite frame (the director calls this after the game has drawn)
  frame() {
    const c = this.ctx, W = this.W, H = this.H;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const st = document.getElementById('stage');
    if (this.g && st && st.classList.contains('shown')) {
      c.drawImage(this.g, 0, 0, W, H);
      if (this.cg) c.drawImage(this.cg, 0, 0, 320, 180, 0, 0, W, H);
    }
    if (this.tr) c.drawImage(this.tr, 0, 0, W, H);
    this.frames++;
  }
  stop() {
    if (!this.mr) return;
    // a last second of black after the end card
    const c = this.ctx; c.fillStyle = '#000'; c.fillRect(0, 0, this.W, this.H);
    setTimeout(() => {
      this.mr.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        window.__recordSize = blob.size;
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'trailer.webm';
        document.body.appendChild(a); a.click();
        window.__recordDone = true;
      };
      this.mr.stop();
    }, 600);
  }
}
