# Dialogue typing and presentation day (research, Nov 17 to 18)

For: Unseen Above (Phaser 4.2.1, 320 x 180 pixel scenes, captions drawn by ui/cg.js in the ccfont face).
Two parts. Part A: snappy Pokemon-style text, with the library decision and a build spec. Part B: what the game needs for Michael's class walkthrough, ranked, with build size (S, M, L).
Sources are listed at the end of each part. Behavior is described, never copied.

---

# Part A. Snappy Pokemon-style dialogue

## A1. How the classic handheld text box behaves

From the Pokemon Red/Blue disassembly (pret/pokered) and fan documentation:

- **Speed is frames per letter.** The options byte holds a delay. Fast is 1 frame per letter, Medium 3, Slow 5. At about 60 frames a second that is about 17 ms, 50 ms and 83 ms a letter. [Glitch City], [Kraballa gist], [pokered print_text.asm]
- **Holding A or B speeds it up.** While A or B is held, the per-letter wait drops to one frame. The text still types; it just types at the fastest rate. [pokered print_text.asm], [Kraballa gist]
- **Players turn it to Fast.** Speedrunners set text speed to Fast first thing. Medium was renamed Normal in later games; the three speeds stay. [Bulbapedia Speedrunning], [Bulbapedia Option]
- **The box is two lines.** Text sits on two rows at the bottom of the screen. [pokered text.asm]
- **The end of a line waits for you.** A down arrow is drawn at the bottom right of the box. It blinks. The game waits for A or B. A press plays a small click sound. [pokered text.asm], [pokered joypad2.asm]
- **Paragraphs clear, continues scroll.** A new paragraph clears the box and waits 20 frames (about a third of a second) before typing again. A continue scrolls the text up one line, 5 frames per line step. [pokered text.asm]
- **Built-in pauses exist.** A pause command waits up to 30 frames (half a second). The "..." dots wait 10 frames each. Both end early if A or B is held. [pokered text.asm]
- **Later games added press-to-finish.** In Undertale and most modern RPGs one press shows the whole line at once, and the next press moves on. A few lines are made unskippable on purpose, for drama.
- **Sound per letter.** Undertale gives each character a short chirp per letter, which does much of the characterization. Celeste plays one sound event per character drawn, from recorded syllables sorted into quick, emphasized and sentence-ending sets. Animal Crossing style maps letters to clips. [TheGamer on Celeste], [Shacknews on Celeste], [Animal Crossing sounds devlog]
- **Punctuation pauses are a common add-on**, not a Game Boy feature. Engines pause after periods and let writers tag other pauses. Known trouble: ellipses make huge gaps, and a period before a closing bracket stalls. [Godot Dialogue Manager discussion]
- **Accessibility says player-paced.** "Instead of a timer, dismiss information on a player action, allowing it to be stepped through." It is a Basic-tier guideline. Auto-advancing text is listed as a common barrier. [Game Accessibility Guidelines], [Unity accessibility basics]
- **Speedrun guidance says offer instant text.** Show the whole box at once, at least as an option, and let dialogs be dismissed fast with a tap or a hold. [SDA Knowledge Base]

## A2. Libraries looked at

| Option | What it drives | License | Phaser 4 | Fit for us |
|---|---|---|---|---|
| rexrainbow TextTyping (rex plugins) | Phaser Text, BBCode Text, Tag Text, BitmapText objects | MIT | Yes, as a separate package, phaser4-rex-plugins | Poor |
| Typed.js | DOM elements | GPL-3.0, plus paid commercial licenses | n/a | No |
| TypeIt | DOM elements | GPL-3.0, plus paid commercial licenses | n/a | No |

- **rex TextTyping**: types into a Phaser text game object at a set ms per character (default 333). Has start, stop (stop(true) shows all, which is press-to-finish), pause, resume, a per-character event and a complete event. No punctuation pauses. Its wrap option exists because unwrapped typing jitters; a forum thread reports that bug. [rex TextTyping docs], [rex forum thread], [rex repo], [phaser4-rex-plugins]
- **Typed.js and TypeIt** type into web page elements, are GPL-3.0 for free use, and charge for commercial use. They cannot draw into our canvas. [Typed.js repo], [TypeIt]

## A3. Decision: build it ourselves (small, native)

- **Native implementation, no library.** Our captions are not Phaser text objects. cg.js paints its own 320 x 210 canvas with glyph runs from ccglyphs.json, and bubbles.js paints into a Phaser Graphics with the same glyphs. A typing plugin needs a Phaser text object to write into, so we would have to give up the character generator canvas and the caption strip. That is backwards.
- **Our renderer already types.** ccCaptionBlock takes a `shown` count, and bubbles.js already reveals letters at 40 per second with a blip, finish-on-press, and a blinking "more" arrow. What is missing is one shared timing core, punctuation pauses, hold to speed up, an input guard, and a queue that every line goes through.
- **Size: S to M.** One new module (about 150 lines) plus small changes in cg.js, overlay.js, bubbles.js and the four scenes that run their own line timers (Hallway, Bedroom, Moon playroom, Intro).
- **House rules agree.** CLAUDE.md says never copy code from other games or repos. No new dependency, no license question, nothing to load offline.

## A4. The spec

### A4.1 One timing core, two places it draws

- New module `ui/typer.js`. It owns the clock and the state of each line. It does not draw.
- cg.js asks it "how many letters are shown" for the strip caption and for narration. bubbles.js asks the same for each bubble.
- Each line: `{ who, text, italic, kind, mode, key, always, pitch }`.
  - `kind`: `say` (someone speaks), `narrate` (a look), `sfx` (a [SOUND] caption).
  - `mode`: `press` (waits for a press at the end), `timed` (moves on by itself after a read time), `locked` (cannot be finished early; use rarely, for drama).
  - `key`: a stable id for the no-repeat rule, for example `hall:IN:2`.

### A4.2 States (per line)

- `QUEUED`: waiting in the queue.
- `TYPING`: letters appear on the timing below.
- `SHOWN`: the whole line is out. A press, or the read timer in `timed` mode, moves on.
- `DONE`: removed; the next line in the queue starts, or the queue's `onDone` fires.
- `PAUSED`: a modifier on any state. The game's pause menu, a lost window focus, or the presenter freeze stops the line clock. Typing resumes where it was.

Transitions:

- `QUEUED` to `TYPING`: when it reaches the front and the strip is free (narration from a look holds the scene's caption queue, as today with `overlay.describing()`).
- `TYPING` to `SHOWN`: last letter reached, or a press (finish now), unless `locked`.
- `SHOWN` to `DONE`: a press (all modes except `timed` in a fight), or the read timer runs out (`timed`).
- Any to `DONE` at once: scene shutdown, a death (clears the queue, except retry lines), or `typer.clear()`.

### A4.3 Timings (ms)

- **Type rate: 18 ms a letter** (about 55 a second). This is the Game Boy Fast setting in milliseconds (1 frame at 60 Hz is 16.7 ms). Counted on real elapsed time, not frames, so a slow frame never slows text; several letters can appear in one frame.
  - A 50-letter line (the ART_DIRECTION maximum) types in about 0.9 s. That is snappy.
  - Spaces cost a normal letter. Simple, and it keeps rhythm.
- **Hold to speed up: 6 ms a letter** while J, Enter or Space is held during `TYPING` in a blocking line (three times faster, like holding A).
- **Punctuation pauses**, added after the mark, only when the next character is a space:
  - after `,` `;` `:` add 80 ms
  - after `.` `!` `?` add 160 ms
  - each dot of `...` adds 100 ms, at most 300 ms for the run
  - none at the end of the line (the line end has its own wait)
  - none while holding to speed up
- **Speaker name appears at once.** "BROTHER:" is drawn whole when the line starts; only the words type. The room knows who speaks before reading.
- **Sound captions appear at once.** `[GLASS CRACKS]` is never typed, and has no blips, as real closed captions show sounds whole.
- **End of line**: the arrow appears 120 ms after the last letter, then blinks 300 ms on, 300 ms off (the current code blinks at about this rate).
- **Input guard**: after a press that finishes a line, ignore presses for 150 ms. After a press that advances, the new line ignores presses for 100 ms. Key repeat (`ev.repeat`) is always ignored. One tap never skips a line unread.
- **Read time for `timed` lines** (after the line is fully shown): keep today's total `lineSeconds(text)` (1.5 s + 52 ms a letter) and subtract the typing time, with a floor of 900 ms. Scenes keep their pacing.
- **Blips**: one blip every second letter (not on spaces or punctuation), square wave, 30 ms, very quiet, pitched per speaker (the existing per-talker `pitch`), varied a little by letter. At least 35 ms between blips. While held to speed up, only every fourth letter. None when a press finishes a line. Blips follow the effects volume and M mute.
- **Text speed setting** (pause menu, saved in `state.settings.text`): FAST (18 ms, default) and INSTANT (0 ms, whole line at once). INSTANT still waits for a press at the end. This covers the accessibility and speedrun advice.

### A4.4 Keys and clicks

Space is jump and J is use, so text input depends on whether she can move.

- **Blocking lines** (she cannot move: the bedroom talk, the playroom talk, the train into the fight, the opening, title cards over black). J, Enter, Space and a click anywhere on the game all do the same thing: finish the line, then advance.
- **Free lines** (she can move: robot chatter, lounge voices, narration from a look, the creator during the fight):
  - Space stays jump. It never touches text.
  - J on a talker or thing steps through that talker's lines, as bubbles.press does now: first press finishes, next press advances, after the last line it closes.
  - Enter finishes or advances the strip caption. If the strip is empty, it acts on the newest bubble near her.
  - A click on the caption strip (y 180 and below) finishes or advances the strip caption. Clicks on the picture stay game input (the sword swings on click).
- During the fight, the creator's lines are `timed` and free, so nothing a player presses to fight eats a line.
- The pause key (P, Esc) freezes text with everything else.

### A4.5 The queue

- `typer.say(lines, { mode, onDone, cut })` appends lines; `cut: true` replaces what is up (today's Hallway `now` flag).
- `onDone` runs when the last line of that call reaches `DONE`. Scenes that chain beats (Hallway rounds, bedroom then dying, playroom then the vest) wait on this instead of their own `lineT` timers.
- A callback entry in the queue (Hallway pushes `{ cb }`) runs when it reaches the front, as now.
- Empty or filtered-out entries never stall the queue.
- `typer.busy` tells a scene that text is still up.

### A4.6 Scenes that time lines by themselves

- **Cinematic cues (Intro, Kids)**: lines are tied to music and sound. These use `timed` mode. If typing would take more than 40% of the time until the next cue, show the line at once. A press finishes a line but never moves the cue clock. Esc still skips the whole cinematic.
- **Hallway, Bedroom, Moon playroom**: replace `lineT` and `talkT` countdowns with `typer.say(...)` and `onDone`. Bedroom and playroom talks are blocking `press` lines. The fight's lines stay `timed`.
- **Overheard lounge lines (Moon)**: `timed` bubbles, never blocking.

### A4.7 Story mode, presenter mode

- Story mode (immunity) does not change text.
- Presenter mode (Part B) changes two things: blocking lines never move on by timer, so Michael can talk over a held line; free `timed` lines read 1.5 times longer.

### A4.8 The no-repeat rule

- state.js already has `heard(key)` and `hear(key)` in `mem.story.heard`.
- When a line with a `key` reaches `SHOWN`, call `hear(key)`. Not when queued: a line cut short by a death plays again.
- When queueing, drop a line whose key is heard, unless it has `always`.
- `always` lines (needed to follow the action, like the sword toss) show at once with no typing and no blips, and move on after 600 ms. The forced train into the fight plays whole the first time; on retries only its `always` lines show.
- **Rehearsal trap.** `heard` is saved in localStorage. If Michael rehearses on the presenting laptop, every line he heard would be silent in class. Fix: clear `heard` when a run starts from the title (Begin, From the start, or a chapter pick), and keep it only across retries within that run. Also, how-to pages show once ever (`state.panels`), so they would not appear in class either. Clear both on a fresh run, or add a "fresh run" row to the pause menu.

### A4.9 Speech bubbles

- bubbles.js keeps its layout code. Its own `CPS = 40` reveal is replaced by the typer core, so bubbles get the same rate, punctuation pauses, guard and blips.
- A talker's lines (`src`) are `press` lines stepped with J, as now. One-off lines (`bubbles.say`) are `timed`; their `hold` becomes the read time.
- The blinking "more" arrow stays.
- Walking away still closes a bubble. A [SOUND] caption still cuts narration.

### A4.10 Screen readers and tests

- The hidden `#cc` element gets the whole line when it starts, not letter by letter (otherwise a screen reader stutters).
- Tests can set `window.__textInstant = true` so every line shows whole; existing tests that read `#cc` keep working.

### A4 sources

- [pokered print_text.asm](https://github.com/pret/pokered/blob/master/home/print_text.asm)
- [pokered text.asm](https://github.com/pret/pokered/blob/master/home/text.asm)
- [pokered joypad2.asm](https://github.com/pret/pokered/blob/master/home/joypad2.asm)
- [Glitch City: options byte](https://archives.glitchcity.info/forums/board-107/thread-9092/page-0.html)
- [Kraballa gist: text delay constants](https://gist.github.com/Kraballa/b21f5f5eb8898facd358409d395bb846)
- [Bulbapedia: Option](https://bulbapedia.bulbagarden.net/wiki/Option)
- [Bulbapedia: Speedrunning](https://bulbapedia.bulbagarden.net/wiki/Speedrunning)
- [rex TextTyping docs](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/texttyping)
- [rex plugins repo (MIT)](https://github.com/rexrainbow/phaser3-rex-notes)
- [phaser4-rex-plugins package](https://app.unpkg.com/phaser4-rex-plugins@4.0.1/files/README.md)
- [Text jittering with rex typing plugin](https://phaser.discourse.group/t/text-jittering-with-rex-typing-plugin/10248)
- [Typed.js](https://github.com/mattboldt/typed.js)
- [TypeIt](https://macarthur.me/typeit/)
- [Game Accessibility Guidelines: progress through text at own pace](https://gameaccessibilityguidelines.com/allow-players-to-progress-through-text-prompts-at-their-own-pace)
- [Unity: accessibility basics](https://unity.com/blog/video-game-accessibility-basics)
- [Godot Dialogue Manager: punctuation pauses](https://www.github.com/nathanhoad/godot_dialogue_manager/discussions/401)
- [TheGamer: Celeste dialogue audio](https://www.thegamer.com/celeste-sound-designer-reveals-how-the-games-dialogue-audio-was-created/)
- [Shacknews: Celeste dialogue design](https://shacknews.com/article/125697/devs-share-insight-into-celestes-dialogue-design-process)
- [Animal Crossing dialogue sounds devlog](https://geolojosh.itch.io/goodlands/devlog/314373/how-to-animal-crossing-dialogue-sounds)
- [SDA Knowledge Base: speedrunner-friendly games](https://kb.speeddemosarchive.com/Making_your_game_speedrunner-friendly)

---

# Part B. Presentation day

Setting: Michael walks a law class through the game on a projector, 20 to 30 minutes, talking as he goes. The game is already deep (13 parts). The job is to make it easy to steer, impossible to break, and readable from the back row.

## B1. What the sources say, in short

- **Demo booths: shorter is better.** A 20-minute demo built queues at PAX South; a shorter demo serves more people. Teams trim demos again and again, and aim for a build that shows enough without tying a station up. Restarting the game by hand for each visitor wasted staff time. [Game Developer: PAX South], [AIE: prepping for PAX], [Skybox Labs]
- **Live demos fail; plan for it.** Record a video backup of every demo, keep a backup in the same state, do not debug on stage, make everything work offline (fonts, code and media hosted online are the usual weak spots), rehearse the full demo at least three times, test the room 30 minutes early. If you fall back to video, narrate over it so it still feels live. [Redgate], [WeAreDevelopers], [Microsoft: how we demo]
- **Speedrun tools: isolate, rewind, stay honest.** Level select, a reset that goes straight to the start of the level, quick save and load, and a clear on-screen label when practice tools are on. Cutscenes skippable with one key, with the same result as watching them. [SDA Knowledge Base], [Yoshi's Island practice hack], [NSMBW practice resources]
- **Assist modes are accepted.** Celeste's Assist Mode offers invincibility, game speed from 50% to 100%, and chapter skip, toggled at any time. [Celeste Assist Mode, GAG], [Vice on Celeste Assist Mode]
- **Teaching with games.** Games can be read as texts, discussed like any other work. Teachers should know the game well before class. One teacher streams the game through the classroom projector and pauses for discussion, then hands a student the controller. Recorded playthroughs are a valid substitute. [Lieberman, Currents], [KQED MindShift], [TeachThought]
- **Projectors wash out dark scenes.** Projector "brightness" sets the black level; ambient light crushes contrast (even dim room light can cut it from 50,000:1 to under 500:1). Darken the room; check dark-scene detail. [BenQ], [TheaterCalc]
- **Readable text on a projector.** The common rule is no font smaller than 30 points on a slide. [Entrepreneur: 10/20/30 rule]
- **Browser facts.** Audio can only start after a click or key press. Fullscreen needs a user gesture. A screen wake lock keeps a laptop from dimming. GitHub Pages sends `max-age=600`, so a new publish may not show for up to 10 minutes. A cache-first service worker never refreshes until the worker changes. [MDN Web Audio best practices], [Chrome autoplay], [MDN Fullscreen guide], [MDN Screen Wake Lock], [GitHub Pages caching answer], [MDN PWA caching]

## B2. What the game already has

- Story mode (I): immunity, N skips ahead or solves a satellite screen, tag top right.
- Chapters on the title screen; # links for every part, including #playroom.
- Continue saves the furthest step reached.
- Pause menu (P or Esc), which also opens when the window loses focus.
- Reduced flashing and screen shake settings, saved.
- dist/local.html plus phaser.min.js runs with no network (plain script tags, fonts embedded).

## B3. Recommendations, ranked

1. **Presenter mode: one switch for the whole night. Size S.**
   - Turn on with `?present` in the link or a row in the pause menu. Saved.
   - Immunity on, N always works, no "Stuck?" offers, reduced flashing on (a room that did not opt in), shake off.
   - Blocking dialogue waits for a press (Part A4.7).
   - Replace the STORY MODE tag with a small, quiet mark (or none). The room should see the show, not a debug label.
   - Clears `heard` and how-to pages for a fresh run (Part A4.8). Without this, a rehearsal on the same laptop silences the dialogue in class.

2. **Offline kit and a build freeze. Size S (mostly process).**
   - Copy dist/local.html and dist/phaser.min.js into one folder on the laptop's desktop and on a USB stick. Double-click opens the game with no network.
   - Publish the final build by mid-afternoon, then freeze. Pages caches for 10 minutes; a late publish can show the old build or a mix.
   - Do not add a service worker tonight. A cache-first worker would keep serving whatever it cached first.
   - Record one full run (screen recording) as the fallback. If the game fails, play the video and narrate.
   - Rehearse the route at least three times, once on the presenting laptop and browser.

3. **Chapter hotkeys in presenter mode. Size S.**
   - Number keys jump straight to a part (1 Grounds, 2 Gallery, 3 East Wing, 4 Bedroom, 5 Kids' room, 6 Moon, 7 Backstage, 8 Playroom; 0 the opening). No trip through the title screen.
   - Each jump shows the episode lower third, so the room sees where they are.
   - Backspace (restart) stays the "go back to the start of this part" key.

4. **Big captions for the projector, plus fullscreen. Size S to M.**
   - Today on a 1080p projector the game scales 5x. A caption letter is 35 px tall, about 3% of the screen height. A 30-point slide letter is about 5.6%. Captions are about half the slide rule.
   - In presenter mode, draw captions in double height (the cg chyrons already draw `sy: 2`), at most two rows, and grow the strip from 30 to 36 game pixels. At 5x a letter becomes 70 px, about 6.5% of the screen. 216 rows at 5x is exactly 1080, so the picture keeps 5x only if fullscreen also hides the page chrome above and below the game (display.js reserves its height plus 24 px). Check this; if the scale drops to 4x, keep the 30 px strip and use double height for one row only.
   - A fullscreen key (F) and a button under the game. It must be pressed, because browsers block fullscreen without a gesture. Fullscreen also hides the address bar and lets the game take the largest whole-number scale.

5. **A clean freeze for talking. Size S.**
   - A key (Tab or the period) that holds the picture with no menu over it, ducks the sound, and shows only a tiny pause mark in a corner. The P menu covers the picture; a talk freeze must not.
   - Typing and timers stop too (Part A4.2).
   - Keep the auto-pause on lost focus. If he clicks to notes or slides, the game waits.

6. **Run sheet: what to show, what to skip. Size S (paper, no code).**
   - A suggested 22-minute route (story and emphasis are Michael's calls):
     - Title and the opening: 1.5 min. Skip the rest of the opening with Esc once the lock-on box finds her.
     - Ep1 Grounds: 3 min. Die once on purpose in the searchlight: bodies stay and age. Restarts are canon; this is the core idea to name.
     - Satellite batch 1: 1 min. Show the screen, then N solves it.
     - Ep2 Gallery: 2 min. The glasses: what watches her only shows with them on.
     - Skip batch 2, the fall and most of the east wing (one 30 s look from above if time allows).
     - Ep4 Bedroom: 3 min. The brother scene. Let it play; this is the emotional center.
     - Kids' room: 1 min. The reveal that the satellite game is a kids' show on the Moon.
     - Moon city: 2 min. Walk past the lounges; let two overheard lines play.
     - Backstage: 2 min. The creator, one round with immunity, then N.
     - Playroom and the end: 2.5 min. No talking over the last shot.
     - Buffer for talk and questions: 4 to 8 min.
   - Next to each stop, one line linking the moment to the paper's argument. Michael writes these.

7. **Resume after a refresh. Size S.**
   - In presenter mode, save the current part (not only the furthest), and on load go straight back into it, skipping the title screen.
   - A refresh then costs 3 seconds, not a menu hunt.

8. **Audio plan for the room. Size S (setup, one setting).**
   - Sound starts on the first key press; press a key before talking so the first music cue is not lost.
   - Check the laptop's output device once it is plugged in (HDMI audio goes to the projector, which may be weak or off). Bring a small speaker as backup.
   - Presenter default: music 2 of 5, effects 4 of 5. He is talking over it; the effects carry the story (clicks, the strike, the cough).
   - M mutes at once if a cue lands at a bad moment.

9. **"Please stand by" instead of a crash. Size S to M.**
   - A global error handler (window error and unhandled rejection) shows a CH 07 card, "TECHNICAL DIFFICULTIES · PLEASE STAND BY", in the game's own style, with "R restarts this part". It fits the TV conceit; a black frozen canvas does not.
   - Log the error to the console for later.

10. **Keep the screen awake. Size S.**
    - Ask for a screen wake lock when presenter mode starts (works on HTTPS and on the local file in Chrome; ignore it if refused). Re-ask when the tab is shown again. Long talking pauses will not dim the projector.

11. **Projector levels. Size S.**
    - The game is mostly greys, and Ep4 is lit only in red. Projectors lift blacks and lose dark detail.
    - A presenter setting that brightens dark scenes a little (a fixed levels change on the canvas, no glow, palette untouched in the files).
    - In the room: dim the lights, check the bedroom scene 30 minutes early, set the projector to a game or cinema mode.

12. **Presenter notes on the laptop. Size M.**
    - A second window (notes page) that follows the game: current part, the talking point, and what comes next, synced by BroadcastChannel. Needs an extended display, not mirrored.
    - Only worth it if he presents with the laptop screen separate. Otherwise the paper run sheet (6) does the job.

13. **An attract loop before class starts. Size L. Skip for tomorrow.**
    - The title screen idling into a short silent replay, like a booth. Nice, not needed.

## B4. What not to do tomorrow

- No new mechanics or levels after the freeze. Every change before class gets one quick run of the parts on the run sheet.
- No service worker, no new libraries, no CDN dependencies (local.html already avoids the CDN).
- Do not rely on venue wifi. Open the local copy if the network is slow at all.

## B sources

- [Game Developer: 5 tips from our first exhibition at PAX South](https://www.gamedeveloper.com/business/5-tips-from-our-first-exhibition-at-pax-south)
- [AIE: prepping for PAX, how to demo your game](https://aie.edu.au/articles/prepping-for-pax-how-to-demo-your-game/)
- [Skybox Labs: first time PAX exhibitor](https://skyboxlabs.com/1st-time-pax-exhibitor-things-learned/)
- [Redgate: avoiding demo fails](https://www.red-gate.com/simple-talk/?p=111618)
- [WeAreDevelopers: presentations should work offline](https://www.wearedevelopers.com/magazine/602-why-presentations-should-always-work-offline-even-at-online-conferences)
- [Microsoft: how we demo](https://learn.microsoft.com/en-my/archive/blogs/cjohnson/how-we-demo)
- [SDA Knowledge Base: speedrunner-friendly games](https://kb.speeddemosarchive.com/Making_your_game_speedrunner-friendly)
- [Yoshi's Island practice hack](https://yoshi.science/index.php/Practice_Hack)
- [NSMBW practice resources](https://nsmbwcommunity.github.io/NSMBW-Speedrun-Guides/resources/practice-resources)
- [Game Accessibility Guidelines: Celeste Assist Mode](https://gameaccessibilityguidelines.com/celeste-assist-mode)
- [Vice: Celeste Assist Mode](https://www.vice.com/en/article/celeste-assist-mode-change-and-accessibility)
- [Lieberman: Four Ways to Teach with Video Games](https://currents.dwrl.utexas.edu/2010/lieberman_four-ways-to-teach-with-video-games.html)
- [KQED MindShift: first steps teaching with video games](https://ww2.kqed.org/mindshift/41396/taking-the-first-steps-towards-teaching-with-video-games)
- [TeachThought: teaching with video games](https://www.teachthought.com/technology/video-games-classroom/)
- [BenQ: projector settings for gaming](https://www.benq.com/en-me/knowledge-center/knowledge/projector-picture-settings-for-gaming)
- [TheaterCalc: optimize projector image](https://theatercalc.com/guides/how-to-optimize-projector-image)
- [Entrepreneur: the 10/20/30 rule](https://www.entrepreneur.com/article/192718)
- [MDN: Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Chrome: autoplay policy](https://developer.chrome.com/blog/autoplay)
- [MDN: Fullscreen API guide](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide)
- [MDN: Screen Wake Lock API](https://developer.mozilla.org/docs/Web/API/Screen_Wake_Lock_API)
- [GitHub Pages caching (Web Applications Stack Exchange)](https://webapps.stackexchange.com/questions/119286/caching-assets-in-website-served-from-github-pages)
- [MDN: PWA caching](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching)
