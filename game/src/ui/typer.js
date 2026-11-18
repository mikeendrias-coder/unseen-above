// Text that types itself out, letter by letter, the way a handheld RPG's text box does (Nov 18;
// spec: research/dialogue_and_presenting_nov17.md, part A). This module owns the clock and the
// state of each line; it draws nothing. ui/cg.js draws the strip caption and narration from it,
// core/bubbles.js draws speech over heads from it.
//
//   speed    18 ms a letter (the Game Boy "Fast" setting); 6 ms while a text key is held
//   pauses   after , ; :  80 ms   after . ! ?  160 ms   an ellipsis 100 ms a dot (at most 300),
//            only when a space follows, never at the end, never while held
//   names    "BROTHER:" shows at once; only the words type
//   sounds   [GLASS CRACKS] shows whole, with no blips, as real captions show sounds
//   arrow    120 ms after the last letter, then 300 ms on, 300 ms off
//   guard    a press that finishes a line locks presses for 150 ms; a new line ignores presses for
//            its first 100 ms; key repeat never counts. One tap never skips a line unread.
//   blips    one every second letter (every fourth while held), at least 35 ms apart, quiet,
//            pitched per speaker; none when a press finishes the line
//
// Keys (Space is jump, J is use, so text input depends on whether she can move):
//   blocking lines (she cannot move: the bedroom, the playroom, the train into the fight, the
//   opening): J, Enter, Space or a click anywhere on the game finish the line, then advance.
//   free lines (she can move): Space stays jump. J on a talker steps its lines (bubbles.press).
//   Enter, or a click on the caption strip, finishes or advances the strip caption, else the
//   narration up, else the newest speech bubble.
//   Enter acts on a bubble only when the strip is empty, and only on one near her.
// A press on a line that is out moves it on only when its owner said how (onAdvance); a line a
// scene times by itself (the fight) can refuse presses altogether (noSkip).
//
// Blocking talks (the bedroom, the playroom, the train into the fight) wait for a press: their
// spoken lines never move on by a timer (spec A4.6, and the end arrow promises it); a [SOUND]
// beat in a talk keeps its short timer (a press still moves it on). The hint line under the
// game says which keys while one is up. Scripted test runs (navigator.webdriver) keep the old
// read timer so the older flow tests still walk through; window.__textPatient overrides that
// either way, and presenter mode (state.settings.presenter) always waits.
// The fight's lines and cinematic cues (the opening, the kids' room) stay timed. In the opening a
// press on a line that is out still jumps to the next line, as it did before typing (its hint
// says so); a line that would spend over 40% of its time typing shows whole.
//
// The no-repeat rule: a line with a key is marked heard (state.hear) only once it is fully shown,
// so a line cut short by a death, a walk away or another line plays again on the retry. Scenes
// pass the key (overlay.caption once/key, overlay.sfx once, bubbles.say once/key, a talker's or
// a look's src.key, a Hallway queue entry's key) instead of calling state.hear themselves.
// The rehearsal trap: a run started from the title (Begin, From the start, a chapter) forgets the
// lines heard and the notices seen (state.newRun), so a rehearsal never leaves the class run
// silent. Continue keeps them.
import { state } from '../core/state.js';
import { Sound } from '../core/sound.js';

export const TYPE = {
  rate: 18, fast: 6, comma: 80, stop: 160, dot: 100, dots: 300,
  arrowIn: 120, blink: 300, guardFinish: 150, guardNew: 100, minRead: 0.9, blipGap: 35
};

const now = () => performance.now();
const SOUND_RE = /^\s*\[[^\]]*\]\s*$/; // a whole line in [BRACKETS] is a sound
const isSound = s => SOUND_RE.test(String(s));
const instantMode = () => !!(typeof window !== 'undefined' && window.__textInstant) || state.settings.text === 'instant';

// how long to wait after letter i (0-based) of s before the next one, beyond the letter itself
function pauseAfter(s, i) {
  const next = s[i + 1];
  if (next !== ' ') return 0; // only when a space follows (never at the end of the line)
  let j = i, ch = s[j];
  if (/["')\]]/.test(ch) && j > 0) ch = s[--j]; // a mark before a closing quote or bracket
  if (ch === '.' && s[j - 1] === '.') { let n = 0; while (s[j - n] === '.') n++; return Math.min(TYPE.dots, n * TYPE.dot); }
  if (ch === '.' || ch === '!' || ch === '?') return TYPE.stop;
  if (ch === ',' || ch === ';' || ch === ':') return TYPE.comma;
  return 0;
}
// the time a line takes to type at the normal speed, in seconds (0 when text is instant)
export function typeSeconds(text, start) {
  const s = String(text); if (instantMode() || isSound(s)) return 0;
  let ms = 0; for (let i = start || 0; i < s.length; i++) ms += TYPE.rate + (i < s.length - 1 ? pauseAfter(s, i) : 0);
  return ms / 1000;
}
// blip pitch per speaker on the strip (bubbles bring their own)
const VOICE = { SISTER: 760, BROTHER: 520, CREATOR: 430, KID: 980, 'LITTLE KID': 1180, ROBOT: 1180 };
export const voice = who => VOICE[who] || (who ? 640 : 520);

let lastBlip = 0;
// One line of text: what is shown, and when it is done.
// o: { start (letters shown at once, a speaker's name), pitch, block, noSkip (bool or () => bool),
//      onAdvance (a press on a line that is out), onShown, key, scene (the owner; a press on a line
//      whose scene has stopped does nothing), instant, locked (cannot be finished early) }
export class Line {
  constructor(text, o) {
    o = o || {};
    this.text = String(text);
    this.len = this.text.length;
    this.start = Math.min(this.len, o.start || 0);
    this.pitch = o.pitch || 640;
    this.block = !!o.block; this.noSkip = o.noSkip || false; this.locked = !!o.locked;
    this.onAdvance = o.onAdvance || null; this.onShown = o.onShown || null;
    this.key = o.key != null ? o.key : null; this.scene = o.scene || null;
    this.sound = isSound(this.text);
    this.n = this.start; this.acc = 0; this.age = 0; this.outAge = 0; this.letters = 0;
    this.lockUntil = now() + TYPE.guardNew;
    this.isShown = false;
    if (o.instant || this.sound || instantMode() || this.n >= this.len) this.show();
  }
  get shown() { return this.isShown; }
  // ms of real time; fast: a text key is held
  step(ms, fast) {
    if (ms <= 0) return;
    this.age += ms;
    if (this.isShown) { this.outAge += ms; return; }
    this.acc += ms;
    const s = this.text;
    while (this.n < this.len) {
      const i = this.n, cost = fast ? TYPE.fast : TYPE.rate + (i > this.start && !fast ? pauseAfter(s, i - 1) : 0);
      if (this.acc < cost) break;
      this.acc -= cost; this.n++;
      const ch = s[i];
      if (/[A-Za-z0-9]/.test(ch)) {
        this.letters++;
        const every = fast ? 4 : 2, t = now();
        if (this.letters % every === 1 && t - lastBlip >= TYPE.blipGap) {
          lastBlip = t;
          try { Sound.tone(this.pitch * (1 + ((ch.charCodeAt(0) % 5) - 2) * 0.03), 0.03, 'square', 0.006); } catch (e) { /* no sound yet */ }
        }
      }
    }
    if (this.n >= this.len) this.show();
  }
  show() {
    if (this.isShown) return;
    this.n = this.len; this.isShown = true; this.outAge = 0;
    if (this.key != null) state.hear(this.key);
    if (this.unhook) { this.unhook(); this.unhook = null; }
    if (this.onShown) { const f = this.onShown; this.onShown = null; f(this); }
  }
  // A line still typing when its scene stops (a death, a retry, a jump) was cut short: it is
  // dropped and stays unheard, so it plays again.
  own(scene) {
    if (this.isShown || !scene || !scene.events) return this;
    const cut = () => { if (!this.isShown) this.dead = true; };
    scene.events.once('shutdown', cut);
    this.unhook = () => scene.events.off('shutdown', cut);
    return this;
  }
  // finish at once (a press): no blips for the letters skipped
  finish() { this.show(); }
  get skippable() { return !(typeof this.noSkip === 'function' ? this.noSkip() : this.noSkip); }
  get live() { const sc = this.scene; return !this.dead && (!sc || !sc.sys || sc.sys.isActive()); }
  // the arrow at the end: the line is out and a press moves it on
  arrow() { return this.isShown && !!this.onAdvance && this.skippable && this.outAge >= TYPE.arrowIn && Math.floor((this.outAge - TYPE.arrowIn) / TYPE.blink) % 2 === 0; }
  // a press: 'finished' | 'advanced' | 'ignored'
  press() {
    const t = now();
    if (t < this.lockUntil || !this.skippable || !this.live) return 'ignored';
    if (!this.isShown) { if (this.locked) return 'ignored'; this.finish(); this.lockUntil = t + TYPE.guardFinish; return 'finished'; }
    if (!this.onAdvance) return 'ignored';
    this.onAdvance(this);
    this.lockUntil = now() + TYPE.guardNew; // in case the owner keeps this line up
    return 'advanced';
  }
}
// letters shown on wrapped rows, from a count along the rows joined by single spaces
export function rowsShown(rows, n) {
  let left = n, shown = 0;
  for (const r of rows) { const take = Math.max(0, Math.min(r.length, left)); shown += take; left -= r.length + 1; if (left <= 0) break; }
  return shown;
}

// ------------------------------------------------------------------ input
const TEXT_KEYS = new Set(['KeyJ', 'KeyE', 'Enter', 'NumpadEnter', 'Space']);
const held = new Set();
let pointerHeld = false;
const hooks = { strip: () => null, narration: () => null, blocked: () => false, grid: () => null, tick: () => {} };
const bubbleLines = new Set();

export const typer = {
  TYPE, Line, typeSeconds, rowsShown, voice,
  // do blocking lines wait for a press (see the top)
  patient() {
    if (state.settings.presenter) return true;
    if (typeof window === 'undefined') return true;
    if (window.__textPatient != null) return !!window.__textPatient;
    return !(typeof navigator !== 'undefined' && navigator.webdriver);
  },
  // scenes that count down their own lines ask this before counting: a blocking line is up and
  // waits for a press. A [SOUND] in a talk is a beat, not something to read: it keeps its timer.
  waiting() { const s = hooks.strip(); return !!(s && s.block && !s.sound && s.onAdvance && s.live && typer.patient()); },
  // the line clock stops: the pause menu, a notice, the presenter's freeze (H)
  frozen() { return !!(typeof window !== 'undefined' && (window.__paused || window.__frozen)) || hooks.blocked(); },
  // the hint line under the game while a blocking line waits for a press (overlay.hint shows it
  // when the scene has no hint of its own)
  cue() { const s = hooks.strip(); return s && s.block && s.live && s.onAdvance && s.skippable ? 'Space, J or Enter: next line.' : ''; },
  tick() { hooks.tick(); },
  // the time a scene line should stay up: its old total, or the typing plus a read, whichever is longer
  total(text, oldSeconds, start) { return Math.max(oldSeconds, typeSeconds(text, start) + TYPE.minRead); },
  // cg.js and bubbles.js tell the router where lines are
  hook(h) { Object.assign(hooks, h); },
  addBubble(line) { bubbleLines.add(line); },
  dropBubble(line) { bubbleLines.delete(line); },
  // is a text key held right now (for this line)
  fast(line) {
    if (!line || instantMode()) return false;
    const any = k => held.has(k);
    if (line.block) return pointerHeld || any('KeyJ') || any('KeyE') || any('Enter') || any('NumpadEnter') || any('Space');
    if (line === hooks.strip() || line === hooks.narration()) return pointerHeld || any('Enter') || any('NumpadEnter');
    return any('KeyJ') || any('KeyE') || any('Enter') || any('NumpadEnter');
  },
  // the line a press acts on: { code: KeyboardEvent.code } or { click: 'strip' | 'picture' }
  target(ev) {
    if (hooks.blocked()) return null;
    const s = hooks.strip(), d = hooks.narration();
    if (s && s.block && s.live) return s;
    const enter = ev.code === 'Enter' || ev.code === 'NumpadEnter' || ev.click === 'strip';
    if (!enter) return null;
    if (d && d.live) return d;
    // a caption on the strip takes the press, even one that is out and waits for nothing: the
    // press never falls through to a bubble across the room
    if (s && s.live) return s.skippable ? s : null;
    // the strip is empty: the newest bubble near her
    let best = null; bubbleLines.forEach(l => { if (l.live && (!l.near || l.near()) && (!best || l.order > best.order)) best = l; });
    return best;
  },
  press(ev) { const l = typer.target(ev || { code: 'Enter' }); return l ? l.press() : 'ignored'; },
  // a run from the title: forget the lines heard and the notices seen (see the top)
  freshRun() { state.newRun(); }
};

if (typeof window !== 'undefined') {
  window.__typer = typer;
  window.addEventListener('keydown', ev => {
    if (!TEXT_KEYS.has(ev.code)) return;
    const first = !held.has(ev.code); held.add(ev.code);
    if (ev.repeat || !first || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    typer.press({ code: ev.code });
  });
  window.addEventListener('keyup', ev => held.delete(ev.code));
  window.addEventListener('blur', () => { held.clear(); pointerHeld = false; });
  window.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const g = hooks.grid(ev); if (!g || g.x < 0 || g.x > 320 || g.y < 0 || g.y > 210) return;
    const click = g.y >= 180 ? 'strip' : 'picture';
    const l = typer.target({ click });
    if (!l || (click === 'picture' && !l.block)) return;
    pointerHeld = true; l.press();
  });
  window.addEventListener('pointerup', () => { pointerHeld = false; });
  // the title screen: Begin / From the start, a chapter, a jump link start a fresh run; Continue
  // does not. Enter on the guide with nothing picked begins only when there is no Continue.
  window.addEventListener('click', ev => {
    const el = ev.target && ev.target.closest ? ev.target.closest('#start, #chapters button, .jump a') : null;
    if (el && !el.classList.contains('back')) typer.freshRun();
  }, true);
  window.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' || ev.repeat) return;
    const tv = document.getElementById('tv'); if (!tv || tv.hidden) return;
    const a = document.activeElement, cont = document.getElementById('continue');
    if (a && a.tagName === 'BUTTON' && tv.contains(a)) return; // its click decides
    if (!cont || cont.hidden) typer.freshRun();
  }, true);
}
