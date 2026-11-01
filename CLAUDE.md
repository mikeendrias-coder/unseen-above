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

## Status (Nov 1, 2026)
- Built: the opening cinematic (src/scenes/Intro.js), episode 1 on the grounds (src/scenes/Grounds.js), satellite batch 1 (back end screen), episode 2 in the gallery (src/scenes/Gallery.js), satellite batch 2 (ground station screen). Satellite.js has all four screen looks; K previews them.
- Side episodes extend src/core/side.js (controller, collision, lock-on, deaths, bodies, takes). Level data and painting live in src/art/estate.js and src/art/gallery.js.
- Episode 2 mechanics: glasses on the bench show camera views; a sweeping ceiling camera; a broken camera that snaps between aims and turns up to look at the Moon; a laser that tells, charges, fires (jump the low beam, crouch under the pair).
- Kids' room preview (src/scenes/Kids.js, a cinematic for near the end, not in the main flow): the kids finish a game show round on a giant screen (the real satellite scene, embedded and playing itself), cheer, then the screen cuts to the Earth feed where a girl is struck as the same charge sound plays; the next take hides behind the hedge; ROUND 2 READY? Staging is a first pass for Michael.
- Jump links under the game (and on shared links): #opening, #grounds, #batch1, #gallery, #batch2, #kids.
- Dialogue: src/data/dialogue.js has the ridge lines (drafts, in use) and a DRAFT of the brother's last scene (BEDROOM, not used yet).
- Clues planted so far: the laser charge sound is the satellite success sound; the broken camera looks at the Moon (which has a lit window); the glasses show CH 07; the glasses are back on the bench every take while the bodies stay.
- Dialogue lives in src/data/dialogue.js (drafts). Look palettes in src/art/palettes.js.
- Tests: tests/flow.js (every hand-off, deaths, doors, both batches; waits on game state), tests/plan-ep1.mjs and tests/plan-ep2.mjs (safe-path search; bundle with esbuild into tests/out first), tests/shoot-*.js (screenshots), tests/fps.js. Serve game/dist on port 8766 first (python3 -m http.server 8766).
- URL params for testing: ?scene=grounds | gallery | satellite | kids (&batch=2 &skin=N), or the # links above. tests/kids-flow.js covers the preview and the links.

## Working rules
- Pixel scenes are 320 x 180, scaled by whole numbers. Cinematic scenes use a 1280 x 720 design space.
- Test in headless Chromium with Playwright (pre-installed; never reinstall it).
- Commit to `dev`; Michael decides when to merge to `main`.
