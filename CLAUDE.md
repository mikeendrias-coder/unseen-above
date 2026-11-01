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
- Built: the opening cinematic (src/scenes/Intro.js), episode 1 on the grounds (src/scenes/Grounds.js), satellite batch 1 with four screen looks (src/scenes/Satellite.js).
- Dialogue lives in src/data/dialogue.js (drafts). Look palettes in src/art/palettes.js.
- Tests: tests/flow.js (hand-offs, a death, the door), tests/plan-ep1.mjs (safe-path search), tests/shoot-*.js (screenshots). Serve game/dist on port 8766 first.

## Working rules
- Pixel scenes are 320 x 180, scaled by whole numbers. Cinematic scenes use a 1280 x 720 design space.
- Test in headless Chromium with Playwright (pre-installed; never reinstall it).
- Commit to `dev`; Michael decides when to merge to `main`.
