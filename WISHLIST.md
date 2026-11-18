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
- `todo` **Build out levels: more interactive stages, more competitive** (harder, more to do).
- `todo` **New sprites.**
- `todo` **Double jump and wall jumps.** Make movement "much better and cooler".
- `todo` **Physics that make it more entertaining** (things that move, fall, swing, push).
- `todo` **Fall damage.**
- `todo` **HP bars** (her, and the boss). Decide with Michael how HP fits with lives and instant restarts.
- `todo` **Scale:** ceilings can stay high with lots of wall decoration, but most things themselves should be normal size next to her, so the space makes sense.
### Satellite puzzles
- `todo` **One complex 3D puzzle instead of many small ones.** First time: a tutorial version, then the real one. After that, each batch is one complex 3D puzzle with similar dynamics and gimmicks. Example: a 3D maze on a circle (a ring or sphere) that you must turn to complete.
### Dialogue
- `todo` **Briefer dialogue.**
- `todo` **No repeated dialogue on reruns** (lines already heard do not play again on a retry).
- `todo` **A forced dialogue train going into the boss fight** that is the same every time (no variation).
### Endings
- `todo` **Boss mercy ending:** if you die to the creator enough times, the creator gives up: stands there screaming "end it all" and does nothing while you slowly deplete their HP. (Michael also floated the creator killing themself; building the give-up version first, his call.) Part of the multiple endings.
### Creative pass
- `done, check` **A dedicated agent thinks through the plot and new elements** that fit the aesthetic, do not extend runtime, and add story, feeling, and more things to do and interact with, based on games in this genre (deep research). Output for Michael to pick from; story calls stay his. Written Nov 17: research/design_pass_nov17.md.

## Hosting
- `done, check` **Self-host through GitHub** instead of itch.io (Michael, Nov 17): repo made public (his call), GitHub Pages at https://mikeendrias-coder.github.io/unseen-above/ . `npm run publish` (in game/) rebuilds and updates it; Claude runs it after each change. Progress is saved in the browser (localStorage).

## Bugs found
- `todo` boss.js test fails: "I turns immunity on" (Nov 17 test run; the other 13 test files pass).
- `todo` To check: kids' room frame black at 2.5 s; east wing how-to page header drawn with an empty body; city caption wraps over the lounge; satellite batch 1 lower third covers the hex dump. (Nov 17 sweep, unconfirmed)
