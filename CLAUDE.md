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

## Status (Nov 1, 2026, overnight)
- The whole game plays start to end. Order lives in src/core/flow.js (STEPS): start screen, opening (Intro.js), ep1 grounds (Grounds.js), batch 1, ep2 gallery (Gallery.js), batch 2, ep3 fall (Fall.js) then east wing top-down (EastWing.js), batch 3, ep4 bedroom (Bedroom.js), batch 4, kids' room cinematic (Kids.js, inFlow), ep5 the Moon (Moon.js). A scene that finishes calls goNext(this, its step id).
- Start screen (src/ui/vibe.js + template #tv): a CH 07 channel guide; the player picks her world's look while a vote from home ticks. The Moon has its own fixed palette (art/moon.js M); the five looks are her world's.
- Side episodes extend src/core/side.js (controller, collision, props, things with E, bubbles, side rooms, lock-on, the satellite strike, bodies, takes). Top-down episodes extend src/core/topdown.js. The strike is art/strike.js (beam from the satellite, ricochets, dies out).
- Ep2: glasses in a sideboard drawer (only E finds them), a chatty cleaning robot ("Please do not touch the drawer"), a staff side room, a chandelier that drops, sweeping and broken cameras, the house laser.
- Ep3: the fall that cracks the glasses (side view), then the east wing from above: motion sensors, a patrol robot that hears noise, pebbles to throw, a study camera, the chandelier mini boss (cut three chains).
- Ep4 (dark, red light only): flash cameras that see only at the flash and click twice first; noise (running on boards or glass) turns them; a grandfather clock whose strokes mask noise; his bag under the fallen stairs (hold E); pulling it starts a floor collapse run (gaps open, a slab drops); the bedroom with the brother and the BEDROOM draft lines as captions; the mismatched door opens onto the void. Wardrobe side room.
- Ep5 (no deaths): she exits the twin of the bedroom door (plaque 07) into a bright corridor; adults behind glass watch walls of Earth channels (overheard DRAFT lines); a robot; a vote screen with the player's look; the playroom with two kids; the PLAYROOM DRAFT dialogue (the little kid names the player's look); a red light on her chest and two clicks (the cameras' warning); white; the last shot: an old TV in a dark room on Earth showing the Moon as the blast blooms and cracks run. No end card. Staging is a first pass for Michael.
- Side rooms (Room.js): keeper's shed (ep1), staff room (ep2), wardrobe (ep4). Brother's belongings: crowbar (ep1), bedroll (ep2 staff room), bag (ep4).
- Satellite: per-screen win effects (sat/wins.js), batch 2 is a sorting shift (sat/sorting.js), batch 3 ends on a map of her death spots.
- Jump links: #opening, #grounds, #batch1, #gallery, #batch2, #fall, #eastwing, #batch3, #bedroom, #batch4, #kids, #moon.
- Systems added Nov 1 (later): core/bubbles.js (E steps through a talker's lines then closes; walking away closes; bubbles stay on screen), core/glasses.js (G toggles; static, blinking, heat, overheat cutout; cracked from ep3), core/panels.js (instruction panels, once each, pause the scene; window.__noPanels skips them in tests), core/review.js (I = immunity, saved; N = skip ahead per scene via skipAhead() or skipPoints; satellite N solves), core/music.js (original synth pieces per part; Music.play/stop/level), art/strike.js (six path styles, never the same twice in a row; small: true for decoys).
- Ep3 pebbles: the pile is drawn live and vanishes when taken; thrown pebbles stay (E picks up); a pebble a sensor, the camera or the eyes can see draws the strike (strikeAt). The fall is a long tumble down a shaft, through a rotten floor, landing heard in the black.
- Ending: the blast cuts a ragged bite out of the Moon on the old TV (moonWork canvas, destination-out), rim cooling, pieces drifting.
- Dialogue: src/data/dialogue.js. RIDGE (drafts, in use), BEDROOM (DRAFT, in use in ep4), MOON_OVERHEARD, MOON_ROBOT, PLAYROOM (DRAFTS, in use in ep5).
- Clues planted: the laser charge sound is the satellite success sound; the broken camera looks at the Moon (lit window); CH 07 everywhere; glasses back in the drawer every take; SEASON 41 crew coat; six feeds, one is this room; spare glasses; CONTINUITY photos; the cameras' two clicks come back at the end.
- Tests also: review.js (immunity, skip ahead), shoot-strikes.js, shoot-fall.js, shoot-last.js, shoot-glasses.js, shoot-audit.js.
- Tests (serve game/dist on port 8766 first: python3 -m http.server 8766): flow.js (opening to ep3), flow-ep3.js, flow-ep4.js (flash death, noise, clock, bag, collapse death, a played run, bedroom, batch 4), handoff-34.js, flow-ep5.js (batch 4 to kids to Moon to the end), cover-ep4.js (what each flash camera sees), smoke.js (every # link), kids-flow.js, ep2-extras.js, shoot-*.js (screenshots), fps.js, plan-ep1/ep2.mjs.

## Working rules
- Pixel scenes are 320 x 180, scaled by whole numbers. Cinematic scenes use a 1280 x 720 design space.
- Test in headless Chromium with Playwright (pre-installed; never reinstall it).
- Commit to `dev`; Michael decides when to merge to `main`.
