# Michael's wishlist (running)

Every request Michael makes about the game goes here, in his words where possible, with a status.
Claude: read this at the start of every session, before any work. Update the status when something changes.
Nothing comes off this list until Michael has seen it done.

Status: `todo` · `deciding` (waiting on Michael) · `doing` · `done, check` (built, Michael has not seen it) · `done` (Michael approved)

## 1. One aesthetic (first, blocks the rest of the art)
- `doing` **One look for the whole game.** DECIDED Nov 17: A, Ash and Gold (grey ash world, only wealth in gold and warm light, only watchers in red), plus B's amber tracking box shown only when the satellite locks on to her. Captions stay in the pixel font for now. The start screen (TV guide web page), the opening (smooth high-res art) and the episodes (320 x 180 pixels) are three different styles today. Michael wants something new, not one of the three. (Nov 17)
  - Three directions drawn for him to pick from: A Ash and Gold, B Camera Feed, C Paper Stage. Mockup page: https://claude.ai/artifact/MHr3oU9nmzQNWKtHHWpVog (source: ~/Developer/unseen-above-archive/looks-mockup-template.html), Nov 17.
- `done, check` **Lock one palette.** The five player-chosen looks go away. (Nov 17)
  - Nov 17: art/palettes.js is one look (Ash and Gold, 17 colors + the amber). L does nothing now. Every Earth episode, the Moon city, backstage, the playroom, captions, how-to pages and glasses HUD snapped to the palette.
- `done, check` **Title screen and opening in the one look.** (Nov 17) The start screen is the opening's first frame in pixels (art/title.js) with the menu over it; Begin starts the film from that picture. The opening is rewritten as a pixel scene: same lines, sounds and timing, the drone show, searchlights, the amber lock-on box on her when the show's camera finds her.
- `todo` **Kids' room cinematic** is still the old smooth high-res style (scenes/Kids.js, art/cinema.js). Rewrite in pixels next.
- `done, check` **Cut the look vote on the Moon** (Michael, Nov 17). Vote board gone; the third planter is a planter. DRAFT lines redone, for Michael to check: playroom LITTLE KID "We do. We pick everything." / SISTER "My brother died under your lights."; a city person now says "It is only television, dear." The creator's "The kids voted for a fight tonight." stays (a different vote).
- `todo` **Satellite screens keep their four-step change** (terminal, ground station, flat map, game show), redrawn in the chosen look's grid and type. (Nov 17)
- `done, check` **Captions get their own space.** A reserved strip outside the play area; captions never sit on top of the game. (Nov 17; Michael flagged it again on the backstage fight.) Done Nov 17: a 30-pixel strip under the picture (core/display.js STRIP) holds captions and narration, up to three lines. Speech over heads, title cards and how-to pages stay on the picture.

## 2. Harder, more interesting levels (after the look is set)
- `todo` **Real platforming.** Levels are flat and too easy. Wants jumping around, wall jumps, different heights, platforms. Everything should make sense in the space. (Nov 17)
- `todo` **Challenge like Geometry Dash.** Die and you go back to the start of the level, right away. (Nov 17)
- `todo` **Lives.** Lose enough lives and you start over (from the episode, or further back; decide the rule with Michael). (Nov 17)
  - Fit with what exists: bodies from earlier takes stay; story mode still lets non-gamers through.
- `todo` **Clearer and a bit more complicated.** Goals and rules readable at a glance, then layered. (Nov 17)

## 3. Story
- `todo` **Multiple endings** (good, bad, others). Which one you get depends on which clues you found and interacted with, and on dialogue choices, maybe in the final cutscene. Current ending stays as one of them. Story calls stay Michael's. (Nov 17)

- `done, check` **Get to any part, including after episode 5** (Michael, Nov 17: "I cannot skip to it"). Title menu has Chapters (every part, incl. the playroom, which never had a link); jump links under the game gained #playroom.

## 4. Requests from Nov 17 (evening), in Michael's words where possible
### Controls
- `done, check` **WASD to move, Space to jump, everything else on the right side of the keyboard**, so she can do several things at once besides jumping. Nov 17: A D move, W doors, S crouch, Space jump (only), Shift run; J use/talk, K throw/swing, L glasses, Backspace restart, Enter skip, P pause, M sound. Arrows and the old E F G R still work quietly. Every on-screen key name updated.
### Levels and movement
- `done, check` (Nov 18 round 1: episodes 1 to 4 rebuilt vertical and harder) **Build out levels: more interactive stages, more competitive** (harder, more to do).
- `done, check` (Nov 18: outlined girl with new frames; Moon people and kids remade) **New sprites.**
- `done, check` **Double jump and wall jumps.** Make movement "much better and cooler".
- `done, check` (core/props.js: crates, moving platforms, crumbling slabs, chandelier/rope) **Physics that make it more entertaining** (things that move, fall, swing, push).
- `done, check` **Fall damage.**
- `done, check` (her 3 HP pips; creator 9-segment bar) **HP bars** (her, and the boss). Decide with Michael how HP fits with lives and instant restarts.
- `done, check` **Scale:** ceilings can stay high with lots of wall decoration, but most things themselves should be normal size next to her, so the space makes sense.
### Satellite puzzles
- `done, check` (Nov 18: ring tutorial + one globe maze per batch: gates, two beads, blur zone and drifting target, game-show Earth; solver-checked) **One complex 3D puzzle instead of many small ones.** First time: a tutorial version, then the real one. After that, each batch is one complex 3D puzzle with similar dynamics and gimmicks. Example: a 3D maze on a circle (a ring or sphere) that you must turn to complete.
### Dialogue
- `done, check` **Briefer dialogue.**
- `done, check` **No repeated dialogue on reruns** (lines already heard do not play again on a retry).
- `done, check` **A forced dialogue train going into the boss fight** that is the same every time (no variation).
### Endings
- `done, check` (give-up mode at 6 deaths) **Boss mercy ending:** if you die to the creator enough times, the creator gives up: stands there screaming "end it all" and does nothing while you slowly deplete their HP. (Michael also floated the creator killing themself; building the give-up version first, his call.) Part of the multiple endings.
### Creative pass
- `done, check` **A dedicated agent thinks through the plot and new elements** that fit the aesthetic, do not extend runtime, and add story, feeling, and more things to do and interact with, based on games in this genre (deep research). Output for Michael to pick from; story calls stay his. Written Nov 17: research/design_pass_nov17.md.

## 5. Nov 17 (late): "do everything", polish for Nov 18 night (Michael walks the class through it)
- Claude makes all decisions from Michael's preferences. No deploying or publishing (no `npm run publish`, no push) until Michael says. Quick tests only, or tests in a side agent.
- `done, check` (docs/ART_DIRECTION.md applied everywhere: no glows or gradients, paperwork UI, outlines, scale) **Look less generated, more like a real pixel game** in Ash and Gold. References Michael named: **Jump King** (character size, scale, jump dynamics), **Geometry Dash / Jetpack Joyride** (pace, restarts), **Papers, Please** (black and white, monotonous, bureaucratic tone). See docs/ART_DIRECTION.md.
- `done, check` **Go to a final design: build out every level** and everything on this list.
- `done, check` (THE VEST, END IT ALL, ROUND TWO, LOOK BACK, secret THE COUCH, false ending WE'LL BE RIGHT BACK; data/endings.js) **Endings crafted by Claude**, including a **secret ending** where she does not blow herself up (for example she sits on the couch with the kids).
- `done, check` **Remake the Moon city people and the kids** (they looked weird): big, clear pixel characters, not the smooth animated style of the old opening.
- `done, check` **Immunity mode** stays easy to reach for the class walkthrough.
- `done, check` (ui/keys.js) **Instructions under the game become key buttons:** keys drawn like keyboard keys, what they do written under each, clickable, and toggles show on or off.
- `doing` Movement done Nov 17 (double jump, wall slide and wall jump, fall damage by distance, 3 HP, sword costs HP). Fixed train of lines before the fight; dialogue cuts.

- `done, check` (ui/typer.js; one press finishes, next advances; rehearsal reset) **Dialogue types out letter by letter, Pokemon style, and is snappy:** a press (J, Enter, Space or a click) finishes the line at once, the next press goes to the next line. Every dialogue and narration line. Michael suggested an existing asset for this (for example a Phaser text-typing plugin); our captions are drawn in our own pixel font, so we build it into ui/cg.js unless a library fits.
- `done, check` (Nov 18 final checks: playthrough, presenter run, story and dialogue edit; checkpoints; presenter mode; docs/RUN_SHEET.md) **Easy and snappy to play through; everything makes sense** for the class walkthrough tomorrow night.
- `done, check` (instant takes with floor tape, landing/hit feel, progress bar, results slip, gold bait, heavy bag, satellite request forms and bulletins, presenter tools) **More features** from the referenced games (Jump King, Geometry Dash, Jetpack Joyride, Papers, Please) and for the presentation day itself (research agents, Nov 17).
- `done, check` (pixel audit against the palette, art direction review, fixes merged) **Final checks include an aesthetics cohesion pass** (everything in the one look).

## 6. Nov 18 playtest feedback (Michael, after publishing)
- `todo` **J and K must be distinct; J must not open doors.** Doors are W only. J is use, look, talk. K is throw and swing.
- `todo` **Immunity got stuck when the chandelier fell.** New meaning of immunity: hazards and their animations still happen, then she regenerates and spawns just before the event (the last checkpoint), on purpose, never stuck, no life lost.
- `todo` **A new mode: she loses HP but never runs out of lives** (lives shown as an infinity sign). A setting beside immunity.
- `todo` **No collision on a prop** (docs/feedback/nov18-collision.png: a gold bench or planter by a white railing; she stands inside it).
- `todo` **Lives vs HP is confusing.** Make the two readable at a glance and explained once.
- `todo` **Some lasers in the top-down level do not trigger.** A laser hit should cost a life.
- `todo` **East wing (top-down) looks unsatisfying:** a real pile of pebbles, carry at most five, dead ends, make it cooler like the side levels.
- `todo` **Episode 4 lags when the lasers or flashes fire** (Michael, Nov 18). Profile and fix.
- `done, check` **Satellite puzzles are too easy: make the target move** (Michael, Nov 18: "make them where the target is moving, at least; the last one was way too easy"). Every globe target now walks on its own clock with its next step marked and turns round rather than walk into a bead. Batch 1 gates (40 turns), batch 2 two beads and a two-target convoy (39), batch 3 blur and a quicker target on a 7x14 globe (45), batch 4 the girl runs an 18-cell loop round an 8x16 Earth, hides under the blur, gates, fastest clock (55, the hardest). The solver proves no dead ends for any speed of play. Branch pt-sat.
- `todo` **Key buttons under the game run off the left edge of the window, with a big empty gap above them** (docs/feedback/nov18-shed-keys.png).

## Hosting
- `done, check` **Self-host through GitHub** instead of itch.io (Michael, Nov 17): repo made public (his call), GitHub Pages at https://mikeendrias-coder.github.io/unseen-above/ . `npm run publish` (in game/) rebuilds and updates it; Claude runs it after each change. Progress is saved in the browser (localStorage).

## Bugs found
- `todo` boss.js test fails: "I turns immunity on" (Nov 17 test run; the other 13 test files pass).
- `todo` To check: kids' room frame black at 2.5 s; east wing how-to page header drawn with an empty body; city caption wraps over the lounge; satellite batch 1 lower third covers the hex dump. (Nov 17 sweep, unconfirmed)
