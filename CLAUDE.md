# Notes for Claude sessions in this repo

## Roles (Michael set these)
- Story, characters, lore and the ending are Michael's calls. Draft only when asked, and mark drafts as drafts.
- Art: Claude designs, Michael approves or rejects. Keep the loop light.
- Mechanics and code: Claude's, autonomously. Stop and ask when something keeps failing, especially anything involving the internet.
- Never copy code or art from other games or repos. Study and rewrite only.

## Michael's preferences
- Replies: short, bulleted, plain sentences. No em dashes anywhere (prose, dialogue, UI text).
- Design must not look AI-generated or templated (no default display fonts, no stock gradients).

## Decisions so far
- Engine: Phaser 4.2.1 (open source). Not Phaser AE, not Phaser Editor.
- Setting: a dead, ash-covered world; a perfectly untouched, over-the-top luxury mansion that decays the deeper you go; a bedroom at the center with a mismatched closet/bathroom door that opens onto a void.
- Characters: an older brother and his younger sister (the player). The brother goes in for supplies; she follows. She finds him dying in the bedroom.
- Restarts are canon: each death leaves a body that stays and looks older with every attempt. The player is one of many clones.
- No checkpoints inside a stage. Each stage is an episode; a retry restarts that stage.
- The watchers are rich people on the Moon. The game is an interactive TV show for their kids; whether the player is the kids or the characters stays blurred.
- Satellite puzzle screens get less technical each batch: raw back end, ground station, flat map, kids' game show.
- Ending (Michael's, kept): she passes adults watching Earth channels, reaches the kids' game room, and blows up the Moon with a hidden vest. It ends with us watching the Moon. No end card.

## Where things are
- Working build (Artifact, republished from the scratchpad copy of game/dist/unseen-above.html): https://claude.ai/artifact/UrA74gTXSbyzUrJ1iJMEvZ
- Research and plan doc (Claude Doc): https://claude.ai/artifact/CNSz6vg5W587eqPS5Fhi3E
- Game Look Board (Design canvas): https://claude.ai/artifact/2BhhizAt6c43ijdc3FVh18
- `game/`: the real game. `npm run build` writes `dist/unseen-above.html` (CDN Phaser) and `dist/local.html` (local Phaser).
- `prototypes/`: first prototypes and their Playwright tests. `art/lookboard/`: the look board generator.

## Status (Nov 1, 2026, evening)
- The whole game plays start to end. Order lives in src/core/flow.js (STEPS): start screen, opening (Intro.js), ep1 grounds (Grounds.js), batch 1, ep2 gallery (Gallery.js), batch 2, ep3 fall (Fall.js) then east wing top-down (EastWing.js), batch 3, ep4 bedroom (Bedroom.js), batch 4, kids' room cinematic (Kids.js, inFlow), ep5 the Moon city (Moon.js), ep5b backstage and the fight (Hallway.js), ep5c the playroom and the end (Moon.js with at: 'playroom'). A scene that finishes calls goNext(this, its step id).
- Start screen (src/ui/vibe.js + template #tv): a CH 07 channel guide; the player picks her world's look while a vote from home ticks. The Moon has its own fixed palette (art/moon.js M); the five looks are her world's.
- Side episodes extend src/core/side.js (controller, collision, props, things with E, bubbles, side rooms, lock-on, the satellite strike, bodies, takes). Top-down episodes extend src/core/topdown.js. The strike is art/strike.js (beam from the satellite, ricochets, dies out).
- Ep2: glasses in a sideboard drawer (only E finds them), a chatty cleaning robot ("Please do not touch the drawer"), a staff side room, a chandelier that drops, sweeping and broken cameras, the house laser.
- Ep3: the fall that cracks the glasses (side view), then the east wing from above: motion sensors, a patrol robot that hears noise, pebbles to throw, a study camera, the chandelier mini boss (cut three chains).
- Ep4 (dark, red light only): flash cameras that see only at the flash and click twice first; noise (running on boards or glass) turns them; a grandfather clock whose strokes mask noise; his bag under the fallen stairs (hold E); pulling it starts a floor collapse run (gaps open, a slab drops); the bedroom with the brother and the BEDROOM draft lines as captions; the mismatched door opens onto the void. Wardrobe side room.
- Ep5, the city (Michael asked Nov 1 for a mini city and a boss in the hallway): she exits the twin of the bedroom door (on a plinth behind ropes, plaque 07) into a small city under a dome: Earth overhead, far towers and a CH 07 mast (parallax 0.2), mid buildings and a tram (0.5), a gold fountain, lounges behind glass where adults watch walls of Earth channels (overheard DRAFT lines, italic), the rich lift screens to film her as she passes, a screen on the boulevard shows her live, a robot, a vote board with the player's look, the service end and a STAFF door. No deaths in the city.
- Ep5b, backstage (Hallway.js, art/hallway.js): the walk in past the crew's coats (SEASON 41), a shelf of spare glasses, the CONTINUITY board, six feeds; then a stage in front of the backs of the set flats. The creator of the show (crew coat, headset with a red on-air light) tosses her a sword (P705 page; F or click swings). Three rounds, three hits each, a trap per round: the grounds' searchlight (warm-up glow, one steady pass; crouch in a crate's shadow or under the desk), the gallery's laser (from the desk; high or low; G shows which), lights off with two flash cameras that click twice and aim at her (under the desk is safe; the flash blinds the creator, an opening). Hits land only when the creator is open (after a lunge or chop, or blinded); otherwise they glance off. High lunge: crouch; low lunge: jump; chop: back away (the desk takes a chop; no chops against a wall). One hit ends her take; a retry restarts the fight (her bodies stay on the stage; HALL_AGAIN line). The creator yields, the light goes off, the shutter opens, the pink door leads to the playroom. Enter skips captions outside the fight. DRAFT dialogue: HALL_IN, HALL_TOSS, HALL_ROUND, HALL_HIT, HALL_AGAIN, HALL_YIELD, HALL_THINGS (marked choices for Michael at the top of the block).
- Ep5c, the playroom: two kids; the PLAYROOM DRAFT dialogue (the little kid names the player's look); a red light on her chest and two clicks (the cameras' warning); white; the last shot: an old TV in a dark room on Earth showing the Moon as the blast blooms and cracks run. No end card. Staging is a first pass for Michael.
- Side rooms (Room.js): keeper's shed (ep1), staff room (ep2), wardrobe (ep4). Brother's belongings: crowbar (ep1), bedroll (ep2 staff room), bag (ep4).
- Satellite: per-screen win effects (sat/wins.js), batch 2 is a sorting shift (sat/sorting.js), batch 3 ends on a map of her death spots.
- Jump links: #opening, #grounds, #batch1, #gallery, #batch2, #fall, #eastwing, #batch3, #bedroom, #batch4, #kids, #moon, #hallway.
- Text (Nov 1, after Michael said the boxes looked generated): one pixel face for every line the viewer reads, src/art/ccglyphs.json (5x7, lowercase, 6 px advance), drawn by src/art/ccfont.js and built into a web font by tools/make-font.py (fonts/ch07-caption.ttf, embedded by build.js) for the start screen and page chrome. src/ui/cg.js is the show's character generator on its own 320x180 canvas over the game: captions (one black box per line; italic for a voice off screen; sounds in [BRACKETS]; overlay.sfx), lower thirds (red tag over a black title in double height: episode starts lower right, satellite lower left, ends centered; overlay.take(n) after a restart), teletext how-to pages (P701 glasses, P702 cracked, P703 pebbles, P704 lights off, P705 sword; header with the real clock, colored band, keys in yellow), the TV's green OSD (sound, look, immunity). Speech over heads (core/bubbles.js) uses the same caption boxes, paints on and rolls up; machines speak in caption cyan, alerts in yellow. The 3x5 font (art/pixfont.js) is only for device readouts (the glasses HUD) and screens inside the world. HTML #cc, #card, #panel etc. are screen-reader only now (and what tests read).
- Glasses rule: anything that shows what watches her (cones, sensor rings, lock tiles, tells) is drawn only while the glasses show; real lights (LEDs, flashes, beams, searchlights) and the lock box stay.
- Systems added Nov 1 (later): core/bubbles.js (E steps through a talker's lines then closes; walking away closes; bubbles stay on screen), core/glasses.js (G toggles; static, blinking, heat, overheat cutout; cracked from ep3), core/panels.js (instruction panels, once each, pause the scene; window.__noPanels skips them in tests), core/review.js (I = immunity, saved; N = skip ahead per scene via skipAhead() or skipPoints; satellite N solves), core/music.js (original synth pieces per part; Music.play/stop/level), art/strike.js (six path styles, never the same twice in a row; small: true for decoys).
- Ep3 pebbles: the pile is drawn live and vanishes when taken; thrown pebbles stay (E picks up); a pebble a sensor, the camera or the eyes can see draws the strike (strikeAt). The fall is a long tumble down a shaft, through a rotten floor, landing heard in the black.
- Ending: the blast cuts a ragged bite out of the Moon on the old TV (moonWork canvas, destination-out), rim cooling, pieces drifting.
- Dialogue: src/data/dialogue.js. RIDGE (drafts, in use), BEDROOM (DRAFT, in use in ep4), MOON_OVERHEARD, MOON_ROBOT, PLAYROOM (DRAFTS, in use in ep5).
- Clues planted: the laser charge sound is the satellite success sound; the broken camera looks at the Moon (lit window); CH 07 everywhere; glasses back in the drawer every take; SEASON 41 crew coat; six feeds, one is this room; spare glasses; CONTINUITY photos; the cameras' two clicks come back at the end.
- Tests also: review.js (immunity, skip ahead), shoot-strikes.js, shoot-fall.js, shoot-last.js, shoot-glasses.js, shoot-audit.js, boss.js (every way to die or not in the fight, a retry, the way out), bot-boss.js (a scripted player fights with real keys and reports how each take ended), shoot-city.js, shoot-text.js (every kind of text), shoot-seen.js (glasses on and off), sweep.js [look] (a frame from every part, with a contact sheet). tests/run-all.sh runs the flow tests in order.
- Tests (serve game/dist on port 8766 first: python3 -m http.server 8766): flow.js (opening to ep3), flow-ep3.js, flow-ep4.js (flash death, noise, clock, bag, collapse death, a played run, bedroom, batch 4), handoff-34.js, flow-ep5.js (batch 4 to kids to Moon to the end), cover-ep4.js (what each flash camera sees), smoke.js (every # link), kids-flow.js, ep2-extras.js, shoot-*.js (screenshots), fps.js, plan-ep1/ep2.mjs.

## Working rules
- Pixel scenes are 320 x 180, scaled by whole numbers. Cinematic scenes use a 1280 x 720 design space.
- Test in headless Chromium with Playwright (pre-installed; never reinstall it).
- Commit to `dev`; Michael decides when to merge to `main`.
