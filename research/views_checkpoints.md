# Two views, instant-restart checkpoints, explosion feedback, hardcore mode, assists, and saving (slug: views_checkpoints)

Scope notes for the report writer:
- Story and lore choices are Michael's. Anything story-adjacent below (for example, how a restart is framed) is listed as an option, not a decision.
- Phaser facts come from the Phaser docs and from the Phaser source I cloned (v4.2.1, commit 02d8931b62). Confirmed Phaser 3 vs 4 differences are marked "(v4 confirmed)". The tech-foundation track makes the version call.
- Code findings are patterns described in my own words. Nothing was run, built, or installed. Repo file links are built from the cloned commit and file path (not fetched).
- Numbers labelled "proposal" are my design suggestions to playtest. They are not sourced facts.

## 1. View-switch precedents: how do games switch between top-down and side views, and keep players oriented?

### Takeaway
Zelda II and Link's Awakening switch views at a physical threshold the player walks into (a cave, a town, a doorway), and the character stays the same. Heavier tricks (Super Paper Mario's flip, Fez's rotation) need one world that exists in both views, which we do not need for two separate levels.

### Cited Findings
- Zelda II is top-down on the overworld. It "switches to side-scrolling mode when Link steps onto particular spots in the overworld map to enter towns, buildings, or caves, or when he encounters wandering monsters." The side-scrolling mode "has most of the action and danger." Source: [Wikipedia: Zelda II](https://en.wikipedia.org/wiki/Zelda_II:_The_Adventure_of_Link)
- Link's Awakening is mostly overhead, and was "the first overhead-perspective Zelda game to allow Link to jump," which "enables sidescrolling sequences similar to those in the earlier Zelda II." Its side-scrolling sections are underground and include Super Mario Bros. enemies such as Goombas and Piranha Plants. Source: [Wikipedia: Link's Awakening](https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Link%27s_Awakening)
- In Link's Awakening, when all hearts are gone, "the game restarts at the last doorway entered by the character." So a doorway doubles as the respawn point. Source: [Wikipedia: Link's Awakening](https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Link%27s_Awakening)
- Super Paper Mario: Mario can temporarily "flip" and the camera rotates 90 degrees to show a 3D view that reveals elements hidden in 2D. Most play stays 2D; 3D is for puzzles and unreachable areas. Source: [Wikipedia: Super Paper Mario](https://en.wikipedia.org/wiki/Super_Paper_Mario)
- Super Paper Mario's director Ryota Kawade found it hard to "create a harmonic relationship between the worlds of 2D and 3D" (largely trial and error). He said one level "required the efforts of creating two levels." Source: [Wikipedia: Super Paper Mario](https://en.wikipedia.org/wiki/Super_Paper_Mario)
- Fez lets the player switch between four 2D views that act as four sides of a cube-like 3D space. Each turn connects platforms that were out of reach. Source: [Wikipedia: Fez](https://en.wikipedia.org/wiki/Fez_(video_game))
- Fez needed orientation aids: the page mentions an in-game map and a navigation helper named Dot, and says reviewers still criticized the in-game navigation. Falling to death means a quick respawn, with no enemies or punishments. Source: [Wikipedia: Fez](https://en.wikipedia.org/wiki/Fez_(video_game))
- Undertale starts battles through "scripted events" or "random encounters," then switches to a screen where the player controls a small heart and dodges attacks like a bullet hell. The fetched page does not describe the transition animation. Source: [Wikipedia: Undertale](https://en.wikipedia.org/wiki/Undertale)

### Inferences
- The best trigger for our switch is the player's own action at a physical threshold: opening the door. Zelda II (stepping onto a spot) and Link's Awakening (doorways) both work this way.
- Two separate Phaser scenes only need a short cut through black while input is locked. Add a camera zoom toward the door so the player sees "going through." Proposal: total lock of about 0.8 to 1.2 seconds.
- Keep constant across the switch: character look, light radius, HUD position, music bed, the "action" key. Change only what the view forces (gravity, jump).
- Put the kid on the doorway tile, facing inward, and show one short control hint on the first top-down frame. Make that doorway the first top-down checkpoint (Link's Awakening precedent).
- Do not try in-place rotation or flipping (Fez, Paper Mario). The director's "two levels' effort" remark suggests it roughly doubles level work. Two scenes with a cut is cheaper and sturdier.
- Treat "mode swaps change the control meaning" (Undertale's heart box) as a warning: keep movement keys identical in both views.

### Gaps
- Pokemon battle transitions: the Bulbapedia fetch failed (client_error) and the WebSearch budget ran out, so I have no source for the swirl/flash effect. See "Needs Michael or Chrome."
- No fetched source gives transition timing or animation detail for Zelda II, Link's Awakening, Fez, or Paper Mario. The durations above are proposals.
- I found no study of how non-gamers cope with view switches.

## 2. Architecture in Phaser: scenes per view, shared state, gravity, input, transitions

### Takeaway
Use one Scene class per view (gravity on for the side view, off for top-down), keep shared state in `this.registry`, rebuild a single `Controls` object in each scene's `create()`, and switch with a short camera fade plus `scene.start()`. `scene.transition()` exists but has stricter rules and is only needed for crossfades.

### Cited Findings
Scene control
- `start('target')` stops the calling scene and starts the target ("equivalent to stop().launch('target')"). `launch('target')` starts a scene without stopping the caller, so two scenes can run at once. `switch`, `run`, `sleep`/`wake`, and `pause`/`resume` also exist; pause renders without updating, sleep neither updates nor renders. Source: [Phaser docs: Scenes](https://docs.phaser.io/phaser/concepts/scenes)
- `init(data)` and `create(data)` receive data passed when a scene starts. On restart, reset your own state variables (for example in `init()`) and remove destroyed objects on `shutdown`. Source: [Phaser docs: Scenes](https://docs.phaser.io/phaser/concepts/scenes)
- The global Cache is shared across scenes, so assets loaded once are available everywhere. Source: [Phaser docs: Scenes](https://docs.phaser.io/phaser/concepts/scenes)
- `restart(data)` is implemented as queued stop then queued start of the same scene. Source: [Phaser source: ScenePlugin.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/scene/ScenePlugin.js#L234)
- Cameras are recreated each time a scene starts, so do not hold camera references across restarts. Source: [Phaser docs: Cameras](https://docs.phaser.io/phaser/concepts/cameras)

`scene.transition()` (exists since 3.5.0 per the source tag; read in v4.2.1)
- It starts a transition from the current scene to a target scene for a set duration in milliseconds. The target can be placed above or below in the display list. An update callback runs every frame. The outgoing scene is stopped by default, or sent to sleep if requested. Source: [Phaser API: ScenePlugin](https://docs.phaser.io/api-documentation/class/scenes-sceneplugin)
- Events: `transitionout` (outgoing scene), `transitioninit` and `transitionstart` (target's init and create), `transitionwake` (if the target was sleeping), `transitioncomplete`. The timer starts when you call it, so loading delays in the target eat into the duration. Source: [Phaser API: ScenePlugin](https://docs.phaser.io/api-documentation/class/scenes-sceneplugin)
- In the source: default duration is 1000 ms; `allowInput` defaults to false (input is blocked during the transition); config also takes `sleep`, `remove`, `moveAbove`, `moveBelow`, `data`, `onUpdate`, `onStart`. The call returns false and does nothing if the target does not exist, is already active, is already transitioning, or is the same scene. Source: [Phaser source: ScenePlugin.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/scene/ScenePlugin.js#L284)

Shared state
- `this.registry` is the game-level Data Manager. Values set in one scene are available in all others for the life of the game. Methods include `set`, `get`, `inc`, `toggle`, `has`, `getAll`, plus a live `values` object. Source: [Phaser docs: Data Manager](https://docs.phaser.io/phaser/concepts/data-manager)
- The source defines the event names as `setdata`, `changedata`, `changedata-` plus the key (for example `changedata-deaths`), and `removedata`. Listen via `this.registry.events.on(...)`. (The docs page only names `setdata`, so I confirmed the rest in source.) Source: [Phaser source: data events](https://github.com/phaserjs/phaser/tree/02d8931b62/src/data/events)
- Registry data lives only while the page is open. A scene's own Data Manager persists across shutdown but is destroyed with the scene. Source: [Phaser docs: Data Manager](https://docs.phaser.io/phaser/concepts/data-manager)

Gravity per view
- Arcade `World.gravity` is a vector set from config; each `Body` has `allowGravity` (default true) and `setAllowGravity(false)`. Source: [Phaser source: Arcade World](https://github.com/phaserjs/phaser/blob/02d8931b62/src/physics/arcade/World.js#L121)
- A scene can carry its own `physics.arcade` config. `ArcadePhysics.getConfig()` merges the scene's arcade config with the game's, and `Merge` keeps the first argument's keys, so the scene's values win (shallow, per top-level key such as `gravity`). So side and top-down scenes can each declare gravity in their own scene config. Source: [Phaser source: ArcadePhysics.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/physics/arcade/ArcadePhysics.js#L189), [Merge.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/utils/object/Merge.js)
- `World.pause()` and `World.resume()` exist (useful for a short hit-stop). `World.timeScale` is inverse: 2.0 means half speed. `Clock` and `TweenManager` also have `timeScale`. Source: [Phaser source: Arcade World](https://github.com/phaserjs/phaser/blob/02d8931b62/src/physics/arcade/World.js#L214)

Shared input
- Keyboard keys belong to a scene's Keyboard plugin; its `shutdown()` calls `removeAllKeys(true)`, so keys made in one scene are destroyed when it shuts down. `createCursorKeys()` and `addKeys()` build them. Source: [Phaser source: KeyboardPlugin.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/input/keyboard/KeyboardPlugin.js#L880)
- Repo pattern: a Zelda-like Phaser 3 project defines an abstract input class with plain getters (up, down, action, attack, enter) and a keyboard subclass that builds the keys. Gameplay code reads only the getters. Source: [devshareacademy/phaser-zelda-like-tutorial](https://github.com/devshareacademy/phaser-zelda-like-tutorial/blob/63b62db25f/src/components/input/keyboard-component.ts)

Camera effects (signatures from the v4.1.0 API page; defaults confirmed in v4.2.1 source)
- `fade([duration=1000], [r=0], [g=0], [b=0], [force=false], [callback], [context])`, `fadeIn(...)`, `fadeOut(...)` (alias that forces the fade), `flash([duration=250], [r=255], [g=255], [b=255], ...)`, `shake([duration=100], [intensity=0.05], ...)`, `zoomTo(zoom, [duration=1000], [ease='Linear'], ...)`, `pan(x, y, [duration], [ease], ...)`. Source: [Phaser API: Camera](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera)
- Completion event strings in source: `camerafadeoutcomplete`, `camerafadeincomplete`, `camerashakecomplete`, `cameraflashcomplete`, `camerazoomcomplete`. Source: [Phaser source: camera events](https://github.com/phaserjs/phaser/tree/02d8931b62/src/cameras/2d/events)
- New effects do not interrupt a running one unless `force` is true; `resetFX()` clears active effects. Source: [Phaser docs: Cameras](https://docs.phaser.io/phaser/concepts/cameras)
- Shake offsets each frame by a random amount up to intensity times camera width (or height) times zoom. So 0.05 on a 640 pixel wide camera allows about 32 pixels either way. Source: [Phaser source: Shake.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/cameras/2d/effects/Shake.js#L240)

Particles
- `this.add.particles(x, y, texture, config)` is registered in the v4.2.1 source, and `ParticleEmitter` has `explode(count, x, y)` for a one-shot burst. Source: [Phaser source: ParticleEmitterFactory.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/gameobjects/particles/ParticleEmitterFactory.js#L31), [ParticleEmitter.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/gameobjects/particles/ParticleEmitter.js#L2653)

Phaser 3 vs 4 differences I confirmed
- `roundPixels` now defaults to false in v4 (it was true in v3) and only applies to axis-aligned, unscaled objects. (v4 confirmed) Source: [Phaser v4 migration guide](https://github.com/phaserjs/phaser/blob/02d8931b62/changelog/v4/4.0/MIGRATION-GUIDE.md)
- Camera matrices were rewritten, but code that only uses `scrollX`, `scrollY`, `zoom`, and `rotation` works unchanged. (v4 confirmed) Source: [Phaser v4 migration guide](https://github.com/phaserjs/phaser/blob/02d8931b62/changelog/v4/4.0/MIGRATION-GUIDE.md)
- In v4.2.1 the camera only applies pixel rounding when both zoom values are whole numbers. So a fractional `zoomTo` (for example 1.5) turns rounding off for that moment. (v4 confirmed) Source: [Phaser source: Camera.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/cameras/2d/Camera.js#L535)
- FX and Masks became Filters, and `BitmapMask` was removed. So an iris wipe built from a mask is version-sensitive; a plain black quad or a pre-drawn hole texture works in both. (v4 confirmed) Source: [Phaser README](https://github.com/phaserjs/phaser/blob/02d8931b62/README.md), [migration guide](https://github.com/phaserjs/phaser/blob/02d8931b62/changelog/v4/4.0/MIGRATION-GUIDE.md)
- The fade, then wait for the complete event, then start or restart pattern shows up in both a Phaser 3.87.0 repo and a Phaser 3.55.2 tutorial repo (its example HTML loads 3.55.2 from a CDN), and the same calls and event names exist in v4.2.1 source. Source: [zelda-like game-scene.ts](https://github.com/devshareacademy/phaser-zelda-like-tutorial/blob/63b62db25f/src/scenes/game-scene.ts#L757), [tilemap-blog main-scene.js](https://github.com/mikewesthad/phaser-3-tilemap-blog-posts/blob/06a12a0917/examples/post-5/04-platformer-step-2/js/main-scene.js#L106)

Repo patterns for scenes and doors
- In the Zelda-like repo, door trigger zones sit in a physics group. An overlap handler locks player input, reads the door's target level, room, and door ids, and either starts the scene again with that data (new level) or moves the active room (same level). A separate UI scene is launched in parallel with `scene.launch`. Source: [game-scene.ts](https://github.com/devshareacademy/phaser-zelda-like-tutorial/blob/63b62db25f/src/scenes/game-scene.ts#L545)
- That repo keeps door and chest state in an in-memory singleton so it survives scene restarts. A grep for `localStorage` across its source finds nothing, so it is not a saving example. Source: [devshareacademy/phaser-zelda-like-tutorial](https://github.com/devshareacademy/phaser-zelda-like-tutorial)

Repo log (licenses checked; all cloned with `--depth 1` to `/home/claude/repos/views_checkpoints/<name>`)
| Repo | License (where I checked) | Commit and version | Files read |
| --- | --- | --- | --- |
| [phaserjs/phaser](https://github.com/phaserjs/phaser) | MIT (LICENSE.md; package.json) | 02d8931b62, v4.2.1 | `src/scene/ScenePlugin.js`, camera effects and events, `Camera.js`, data events, `KeyboardPlugin.js`, Arcade `World.js` and `ArcadePhysics.js`, `Merge.js`, particle emitter files, v4 migration guide |
| [NoelFB/Celeste](https://github.com/NoelFB/Celeste) | MIT (LICENSE). README says the license covers only the code in the repo, not the commercial game or assets | 1b0ce45c75 | `Source/PICO-8/Classic.cs`, `Source/PICO-8/Emulator.cs`, `Source/Player/Player.cs` (the only class files published) |
| [devshareacademy/phaser-zelda-like-tutorial](https://github.com/devshareacademy/phaser-zelda-like-tutorial) | MIT (LICENSE; package.json). Phaser 3.87.0, TypeScript | 63b62db25f | `scenes/game-scene.ts`, `scenes/game-over-scene.ts`, `components/input/*`, `components/state-machine/states/character/death-state.ts` |
| [mikewesthad/phaser-3-tilemap-blog-posts](https://github.com/mikewesthad/phaser-3-tilemap-blog-posts) | MIT for example code per `licenses.md` (Copyright 2018 Michael Hadley). package.json says ISC; assets and posts have other licenses | 06a12a0917 | `examples/post-5/04-platformer-step-2/js/main-scene.js`, `player.js` |

### Inferences
- Suggested scene graph: Boot (load everything once), Menu, then `EarthSideScene` and `EarthTopScene` (each driven by a tilemap key and level data), the Satellite puzzle scenes, and a small HUD scene launched in parallel above gameplay for the death counter and assist badge.
- A shared base class for both Earth scenes would hold: build level from Tiled, spawn at the current checkpoint, `die()`, and `respawn()`. The two subclasses differ only in physics config and movement code.
- Registry keys to define up front (names are proposals): `checkpoint` (level plus id), `deaths`, `hardcore`, `glasses` (off, on, broken), `assists` (object), `settings` (shake, flash). One small save module listens for `changedata` and writes to storage.
- Build `Controls` per scene with named actions (move axes, action, restart, pause) and read only those. It makes later remapping, WASD plus arrows, and touch or gamepad cheap. Jump exists only in the side view.
- Set physics gravity in each scene's own config (side above 0, top-down 0) rather than toggling at runtime. Add drag or zero velocity each frame in top-down so the kid does not slide, and normalize diagonal speed.
- Door staging recipe: freeze input, play the door-open animation, run `zoomTo` toward the door while `fadeOut` (about 250 to 400 ms), call `scene.start('EarthTop1', {from: 'door1'})`, then `fadeIn` in the new scene's `create()`.
- If the game ends up on Phaser 4, set `roundPixels` explicitly for pixel art and avoid fractional camera zoom except during the brief door zoom.
- Because restarts rebuild a scene, keep anything that must survive an attempt (checkpoint, deaths, settings) in the registry, never in scene fields.

### Gaps
- I did not run any code (rules forbid it), so none of the above is tested in a browser.
- I confirmed v4.2.1 behavior from source. For Phaser 3 I only have two repos that use the same calls, not v3 docs or source. The version recommendation is the tech-foundation track's job.
- I did not test how Camera shake looks at a low internal resolution; the intensity advice is a proposal.

## 3. Death and restart, and explosion feedback that stays quick

### Takeaway
The strongest precedents (Celeste, Super Meat Boy, Hotline Miami, Katana Zero) all keep the death-to-control loop short, around half a second in Celeste Classic's code, and treat dying as normal. For us: one routine that bursts, shakes, and restarts the scene, with a key to skip the wait.

### Cited Findings
- Celeste chapters are "divided into multiple single-screen challenges, with checkpoints in between screens." Source: [Wikipedia: Celeste](https://en.wikipedia.org/wiki/Celeste_(video_game))
- Celeste Classic code (the PICO-8 version inside the Celeste repo): on death it plays a sound, adds to the death count, sets a screen-shake timer of 10 frames, deletes the player, spawns 8 particles in an even ring with a 10 frame life, then schedules a room reload after 15 frames. The update loop counts the delay down and reloads. Source: [Classic.cs](https://github.com/NoelFB/Celeste/blob/1b0ce45c75/Source/PICO-8/Classic.cs#L1349)
- The port's own comment says Celeste runs at 60 fps while PICO-8 logic runs at 30, so it skips every second frame. So the 15 frame delay is half a second and the 10 frame shake and particle life are about a third of a second. (My arithmetic from that comment.) Source: [Emulator.cs](https://github.com/NoelFB/Celeste/blob/1b0ce45c75/Source/PICO-8/Emulator.cs#L268)
- The same port's update loop shakes the camera by a random offset of roughly 2 pixels either way on a 128 pixel wide screen (about 1.5 percent of screen width) while the shake timer runs, and skips the shake entirely when a "disable screen shake" setting is on. So the shipped game already gates shake behind an option. Source: [Classic.cs](https://github.com/NoelFB/Celeste/blob/1b0ce45c75/Source/PICO-8/Classic.cs#L1497)
- Celeste's full `Player.Die`: first checks whether Assist Mode invincibility is on and, if so, does nothing. Otherwise it records the death in session and save stats, sets a dead flag, locks the state machine, turns off collision, zeroes speed, shakes the level, rumbles the controller, then swaps the live player for a separate "dead body" entity and removes the player. The respawn location is held in session state (`RespawnPoint`). Source: [Player.cs](https://github.com/NoelFB/Celeste/blob/1b0ce45c75/Source/Player/Player.cs#L2030)
- Player.cs calls a global freeze of 0.05 seconds (50 ms) in several movement and hit routines, and 0.1 seconds in one. Source: [Player.cs](https://github.com/NoelFB/Celeste/blob/1b0ce45c75/Source/Player/Player.cs#L3839)
- Super Meat Boy gives unlimited attempts, and "he immediately restarts the level." The designers used "infinite lives, quick restarts of levels, obvious goals, and short levels." After a level, a replay "simultaneously shows all the player's attempts," which they felt "transformed death into a form of reward." The meat juice he leaves stays on surfaces. Source: [Wikipedia: Super Meat Boy](https://en.wikipedia.org/wiki/Super_Meat_Boy)
- Katana Zero: "Any damage results in instant death for Zero, requiring the player to restart from the most recent checkpoint." Attempts are "presented as possible scenarios Zero has foreseen." Designer Stander wanted deaths easy and frequent but "difficult but fair," with short levels. Source: [Wikipedia: Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero)
- Hotline Miami: player and enemies die in one hit, offset by letting the player "quickly restart the current stage after death." Polygon's Chris Plante said quick restarts made up for repetitiveness. Source: [Wikipedia: Hotline Miami](https://en.wikipedia.org/wiki/Hotline_Miami)
- PCGamingWiki's keyboard row for Hotline Miami reads "Only movement and restart keys," confirming a dedicated restart key exists but not naming it. Source: [PCGamingWiki: Hotline Miami](https://www.pcgamingwiki.com/wiki/Hotline_Miami)
- Limbo calls its approach "trial and death" and uses gruesome death imagery to steer players away from unworkable solutions. An optional Xbox 360 gore filter blacks out the screen (audio still plays). Checkpoints are plentiful and restarts unlimited. Carlsen: the goal was that "death wasn't a penalty." Source: [Wikipedia: Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game))
- The Game Developer write-up of Carlsen's GDC Europe 2010 talk calls Limbo a "learning-by-dying game" and notes "You don't ever really get penalized for dying." Its design advice: make the correct solution fairly easy to execute and make wrong approaches clearly wrong (paraphrase). Source: [Game Developer: Limbo's Carlsen](https://www.gamedeveloper.com/game-platforms/gdc-europe-i-limbo-i-s-carlsen-on-making-players-your-worst-enemy-and-your-best-friend)
- Inside shows deaths realistically and often graphically ("to a larger degree" than Limbo, with a Mature rating), and continues from the most recent checkpoint. Source: [Wikipedia: Inside](https://en.wikipedia.org/wiki/Inside_(video_game))
- Effect stack from a recreation of Vlambeer's "The Art of Screenshake": animation, muzzle flash, impact effect, hit reaction, knockback, camera lerp, screenshake, hit pause (brief freeze on impact), weapon recoil, random enemy explosion. The page gives no numbers. Source: [dkliao devlog](https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog/451576/quick-breakdown-of-all-the-effects)
- The GDC 2012 talk "Juice It or Lose It" (Martin Jonasson and Petri Purho) promises "neat little tricks you can apply to any game to make it more satisfying" and hints at particles and audio feedback. The page lists no specific techniques. Source: [GDC Vault](https://www.gdcvault.com/play/1016487/Juice-It-or-Lose)
- Phaser effect defaults: shake 100 ms at intensity 0.05; flash 250 ms in full white; fade 1000 ms. Source: [Phaser API: Camera](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera), [Shake.js](https://github.com/phaserjs/phaser/blob/02d8931b62/src/cameras/2d/effects/Shake.js#L162)
- Repo patterns for death in Phaser: the tilemap tutorial marks lethal tiles with a Tiled property, unsubscribes the collision handler so it runs once, freezes the player, fades to black over 250 ms, and calls `scene.restart()` when the fade completes. Source: [main-scene.js](https://github.com/mikewesthad/phaser-3-tilemap-blog-posts/blob/06a12a0917/examples/post-5/04-platformer-step-2/js/main-scene.js#L106)
- The Zelda-like repo routes death through a state: reset velocity, drop held items, become invulnerable, disable the physics body, play the death animation, and on animation end emit a "player defeated" event on a global bus. The scene listens, removes the listener on shutdown, fades out for 1000 ms, then starts a game-over scene whose action key restarts the game scene. That 1000 ms flow suits a final loss, not a quick retry. Source: [death-state.ts](https://github.com/devshareacademy/phaser-zelda-like-tutorial/blob/63b62db25f/src/components/state-machine/states/character/death-state.ts), [game-scene.ts](https://github.com/devshareacademy/phaser-zelda-like-tutorial/blob/63b62db25f/src/scenes/game-scene.ts#L757)

### Inferences
- Proposed death timeline (modeled on Celeste Classic's numbers): at t=0 set a dead flag (guard against double triggers), disable the body, hide the kid, and `explode` about 8 to 12 pixel particles; start a 150 to 250 ms camera shake at a small intensity (about 0.015, which matches Celeste Classic's roughly 2 pixels on a 128 pixel screen; Phaser's default 0.05 is more than three times larger) and a very short dim flash; optionally `World.pause()` for about 50 ms (Celeste's freeze length); at about 0.5 s call `scene.restart()`; control returns by about 0.8 s. Pressing the restart key during the wait restarts at once.
- Use `scene.restart()` for respawn. For short tilemap levels it is fast, and it resets every sensor, robot, and timer for free. This favors "simple, robust, readable" over an in-place respawn.
- Make deaths readable. Add a short, clear "lock-on" telegraph before a lethal sensor fires (Limbo's advice to make wrong approaches clearly wrong; Katana Zero's aim of "difficult but fair"). This is an inference from those statements, not a sourced rule.
- Tone for a law-class audience: an abstract pixel burst with no bodies. Limbo's gore filter is a precedent for an optional "reduced effects" setting.
- Cheap alternative to Super Meat Boy's all-attempts replay: remember each death position in the registry for the current level and draw a faint mark at each on the next attempt (the "meat juice stays" idea). Optional.
- Options for Michael (story-adjacent, so his call): (a) neutral "Try again" plus a counter; (b) in-world framing like Katana Zero's foresight; (c) no framing. I am not choosing.

### Gaps
- No fetched source gives Super Meat Boy's exact respawn time, and the WebSearch budget ran out before I could look for its postmortem.
- Celeste's full-game `PlayerDeadBody` (the actual death animation timings) is not in the public repo. Only the Classic constants and `Die()` are readable.
- Vlambeer's talk is video-only, so I have no numbers from it. All timing numbers above are Celeste Classic's or proposals.
- Nothing I found tests whether instant restarts help non-gamers specifically.

## 4. Checkpoint placement rules and spacing for short levels

### Takeaway
No source gives a numeric spacing for short levels. The consistent principles are: automatic, visible, restrained in number, and placed so a retry costs seconds. I propose one checkpoint per sensor group, with a cap on lost time of about 30 seconds.

### Cited Findings
- Yacht Club Games (Shovel Knight): "there is no hard and fast rule" for checkpoints; they started with invisible automatic ones "almost on every other screen," which felt "obsessive," and concluded checkpoints need visual indicators. Source: [Yacht Club Games: Check Point Design](https://yachtclubgames.com/blog/check-point-design)
- Same post: pay-to-activate checkpoints "punished novice players who needed help the most." The final breakable checkpoints are optional risk for reward, activate automatically when passed, and are explained on the death screen without text. Source: [Yacht Club Games: Check Point Design](https://yachtclubgames.com/blog/check-point-design)
- Sirlin: use many checkpoints that save automatically (his example is Gears of War), and on death return to the last checkpoint, not the last save. Players "should be able to stop playing your game anytime without losing their meaningful progress." His numeric benchmark (save points over an hour apart is "lacking") is for long games. Source: [Sirlin: Save Game Systems](https://www.sirlin.net/articles/save-game-systems)
- Game Developer carries matching text under "Saving the Day: Save Systems in Games." It adds that resuming should mean "as close to zero replaying as possible." Source: [Game Developer: Saving the Day](https://www.gamedeveloper.com/design/saving-the-day-save-systems-in-games)
- Celeste puts checkpoints between single-screen challenges. Katana Zero restarts from the most recent checkpoint. Link's Awakening restarts at the last doorway entered. Limbo's checkpoints are plentiful; Inside resumes at the most recent checkpoint. Source: [Celeste](https://en.wikipedia.org/wiki/Celeste_(video_game)), [Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero), [Link's Awakening](https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Link%27s_Awakening), [Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game)), [Inside](https://en.wikipedia.org/wiki/Inside_(video_game))
- Super Meat Boy's fetched description covers only restarting the level and keeping levels short. The page does not say whether it has mid-level checkpoints, so treat that as "not described." Source: [Wikipedia: Super Meat Boy](https://en.wikipedia.org/wiki/Super_Meat_Boy)
- Spelunky deliberately has "a lack of save points," and its designer defended harsh early difficulty to show that "death and failure is an expected part of gameplay." That is the opposite end of the spectrum, useful for hardcore. Source: [Wikipedia: Spelunky](https://en.wikipedia.org/wiki/Spelunky)

### Inferences (all proposals to playtest)
1. Put a checkpoint at each level start and at each door.
2. For a 2 to 4 minute Earth level, add 2 to 4 more checkpoints, aiming for no more than about 30 seconds of lost progress after any death.
3. Place a checkpoint right after a solved challenge (a cleared sensor group), not inside one, and before the first real test of a new sensor type.
4. Never put one inside a sensor's range or where a hazard can fire in the first second. Reset every sensor, camera, and robot to its starting phase on respawn, with the first second safe.
5. Make each checkpoint visible (a small lamp or ping with a sound), triggered by walking past, and one-way (an earlier one cannot overwrite a later one).
6. Autosave at each checkpoint. No manual save, no cost, no gating (Shovel Knight and Sirlin lessons).
7. In the near-blind level (no glasses), consider one more checkpoint and an audio cue ahead of hazards, since the player sees less.
8. Hardcore mode removes mid-level checkpoints (see section 5).

### Gaps
- I found no source with numbers for short, level-based games. The 30 second cap and 2 to 4 count are my proposals.
- I did not find per-game data on how many checkpoints Celeste or Katana Zero place per level.

## 5. Hardcore modes: scope options and death counters

### Takeaway
Precedents split into per-save-file permadeath (Hollow Knight Steel Soul), per-world permadeath (Minecraft), per-run permadeath (Spelunky), and a softer death budget (Limbo's five-death achievement). For a forgiving class audience, per-level hardcore is the gentlest fit, with a visible death counter.

### Cited Findings
- Hollow Knight Steel Soul is unlocked after finishing the game once. The Knight does not come back after dying; the run ends and the save profile is reset. A failed slot shows "DEFEATED," and entering it prompts you to clear the profile. Source: [Hollow Knight Wiki: Steel Soul Mode](https://hollowknight.wiki/w/Steel_Soul_Mode_(Hollow_Knight))
- Steel Soul details: deaths to Dream Bosses or in Godhome do not count; dying in the White Palace or to the Radiance does. The mode has its own menu style, a unique death animation, a game-over screen only it uses, and two achievements. Source: [Hollow Knight Wiki: Steel Soul Mode](https://hollowknight.wiki/w/Steel_Soul_Mode_(Hollow_Knight))
- Wikipedia agrees: finishing the game unlocks Steel Soul, "dying is permanent," and losing all masks resets the save slot. Source: [Wikipedia: Hollow Knight](https://en.wikipedia.org/wiki/Hollow_Knight)
- Minecraft Hardcore "locks the difficulty setting to 'Hard'" and adds permadeath, "forcing players to delete the world or continue as a spectator after dying." Source: [Wikipedia: Minecraft](https://en.wikipedia.org/wiki/Minecraft)
- Spelunky: losing all hearts or hitting an instant-kill trap sends the player to the beginning; levels are procedurally generated, so runs differ. Derek Yu found "the consequences of permadeath" exciting. Source: [Wikipedia: Spelunky](https://en.wikipedia.org/wiki/Spelunky)
- Limbo has an optional achievement for completing the game with five or fewer deaths: a death budget with no hard failure. Source: [Wikipedia: Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game))
- Super Meat Boy's hidden warp zones include some in an older 8-bit style with a three-life limit: a life limit used inside short stages. Source: [Wikipedia: Super Meat Boy](https://en.wikipedia.org/wiki/Super_Meat_Boy)
- Celeste counts deaths in session and save data. Its wiki notes that even with invincibility on, resetting through the menu still raises the death counter. Source: [Celeste Wiki: Assist Mode](https://celeste.ink/wiki/Assist_Mode), [Player.cs](https://github.com/NoelFB/Celeste/blob/1b0ce45c75/Source/Player/Player.cs#L2030)

### Inferences
- Scope options for Michael (mechanics only):
  - A. Per level: no mid-level checkpoints, death restarts the current Earth level from its start. Closest to Super Meat Boy's rhythm. Recommended default.
  - B. Whole run: one life across all Earth levels; death returns to the first. Steel Soul and Minecraft style. Harsh for a short game; better only as an after-credits unlock.
  - C. Death budget: finish a level or the game with N deaths or fewer, shown as a badge. Zero risk of lockout (Limbo precedent).
- Show hardcore clearly: its own label on the save slot (Steel Soul's "DEFEATED"), a skull or counter on the HUD, a plain-language warning before starting.
- Gate it: unlock after one completion (Steel Soul) or make it a clearly marked choice on a new game. Do not combine hardcore with assists.
- Satellite puzzles: whether a failure there counts toward hardcore is a design call for Michael; I have no precedent for it.

### Gaps
- Minecraft's official wiki (heart icons, exact rules) was unreachable; I used Wikipedia, which does not say "one life" outright or describe the heart display.
- The Spelunky page I fetched did not mention shortcuts or the daily challenge.
- No data on how many non-gamers choose or complete permadeath modes.

## 6. Accessibility: assist options for non-gamers

### Takeaway
Copy Celeste's pattern: off by default, plainly worded, changeable any time, visibly marked on the save, with a few simple dials (speed, invincibility, skip). Keep our death flash and shake gentle and give a "reduce effects" toggle.

### Cited Findings
- Celeste Assist Mode options: Game Speed lowered from 100% down to 50% in steps of 10; Infinite Stamina (on or off); Air Dashes (default, 2, or infinite); Invincibility (on or off); Skip Chapter (needs Assist Mode). The first toggle shows a warning that begins "Assist Mode allows you to modify the game's rules to fit your specific needs." A save using it shows a blue badge on its card. Source: [Celeste Wiki: Assist Mode](https://celeste.ink/wiki/Assist_Mode)
- Variant Mode (unlocked later) allows game speed from 50% to 160% in 10% steps. Source: [Celeste Fandom: Variant Mode](https://celestegame.fandom.com/wiki/Variant_Mode)
- The mode was first called "Cheat Mode," but Maddy Thorson judged that name too judgmental and renamed it "Assist Mode." Noel Berry said it took only "a couple of days' work" to build, though balancing needed playtesting. Source: [Wikipedia: Celeste](https://en.wikipedia.org/wiki/Celeste_(video_game))
- Tone: the intro screen says "we understand that every player is different" and "we hope that Assist Mode will allow you to still enjoy it"; Game Accessibility Guidelines calls it an "unpatronisingly worded introductory screen." Source: [Game Accessibility Guidelines: Celeste assist mode](https://gameaccessibilityguidelines.com/celeste-assist-mode)
- A UX writeup says the prompt defaults to "No" (so it is opt in), is split into short chunks, and that players can change settings mid-game and return to play without losing progress. Source: [UX Collective: Trust and transparency in Celeste's Assist Mode](https://uxdesign.cc/the-hidden-lessons-of-trust-and-transparency-from-celestes-assist-mode-5b49928ea69a)
- Game Developer reports the game recommends skipping assist mode on a first playthrough while keeping an inclusive tone. Source: [Game Developer: Celeste's assist options](https://www.gamedeveloper.com/design/check-out-i-celeste-s-i-remarkably-granular-assist-options)
- Game Accessibility Guidelines items that fit us (level in brackets): "Avoid flickering images and repetitive patterns" (Basic); "Offer a wide choice of difficulty levels" (Basic); "Include an option to adjust the game speed" (Basic); "Allow controls to be remapped / reconfigured" (Basic); "Ensure controls are as simple as possible, or provide a simpler alternative" (Basic); "Include interactive tutorials" (Basic); "Allow difficulty level to be altered during gameplay" (Intermediate); "Provide an autosave feature" (Intermediate); "Include a means of practicing without failure" (Intermediate); "Offer a means to bypass gameplay elements that aren't part of the core mechanic" (Intermediate); "Do not make precise timing essential to gameplay" (Advanced). Source: [Game Accessibility Guidelines: full list](https://gameaccessibilityguidelines.com/full-list/)
- WCAG 2.3.1: content should not "flash more than three times in any one second period," unless below the flash thresholds. A general flash is a pair of opposing changes in relative luminance of 10% or more where the darker state is below 0.80; the small-area allowance is about 25% of a 10 degree field (roughly 341 by 256 pixels at 1024 by 768). Source: [W3C: Understanding 2.3.1](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html)
- Phaser's default camera flash is full white for 250 ms and default shake intensity is 0.05, so the defaults are heavy for a death that can repeat every second or two. Source: [Phaser API: Camera](https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera)
- Celeste's invincibility is checked inside its death routine, so the assist is a single early return in `Die()`. Its PICO-8 port also checks a "disable screen shake" setting before shaking, a precedent for a reduce-effects toggle. Source: [Player.cs](https://github.com/NoelFB/Celeste/blob/1b0ce45c75/Source/Player/Player.cs#L2030)

### Inferences
- Assist dials for our game (mechanics only; all off by default, changeable from the pause menu):
  - Game speed 50 to 100% in 10% steps (Phaser: `World.timeScale` is inverse, plus `Clock` and `TweenManager` `timeScale`; I did not verify the animation manager's time scale).
  - Detection delay: a longer lock-on time before a sensor fires.
  - Invincible: sensors still react, but no explosion. Keep counting deaths or "near misses" quietly.
  - Skip level, offered gently after repeated deaths on one level.
  - Reduce flashes and shake (also covers GAG and WCAG).
- Copy tone: neutral, short chunks, default No, a badge on the save slot (Celeste), no "easy mode" shaming words.
- A death every 0.5 to 1 s with a full white flash could approach the 3 per second limit, especially with shake. Use a dim or colored flash on a small area and keep at least 0.5 s between flashes.
- Provide remapping or at least WASD plus arrows, a visible controls reminder, and a practice moment before the first lethal sensor (GAG items).

### Gaps
- I did not get Celeste's full assist screen text beyond the first sentences.
- The GAG flicker page was not fetched separately; the numeric limit comes from WCAG.
- No evidence on how non-gamers react to assist prompts in a class setting.

## 7. Saving progress in a browser game: localStorage caveats

### Takeaway
Save a tiny JSON object to `localStorage` inside try/catch, with an in-memory fallback, and make the game fully playable when saving fails. Private windows, Safari's seven day rule, and embedding in another site can all make saves vanish or split.

### Cited Findings
- `localStorage` persists after the browser closes; `sessionStorage` lasts for the page session. `localStorage` is shared across tabs of the same origin. Source: [MDN: Using the Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)
- In private browsing "some browsers might give us an empty `localStorage` object with a quota of zero, effectively making it unusable." Checking that the property exists is not enough; MDN's detection pattern writes and removes a test key inside try/catch. Source: [MDN: Using the Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)
- In private mode, browsers "may apply different quotas, and stored data is usually deleted when the private browsing mode ends." Exceeding quota throws `QuotaExceededError`; handle it with try/catch. Source: [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- Default ("best-effort") storage can be evicted under storage pressure, least recently used origin first. `navigator.storage.persist()` asks for persistence; Firefox prompts, while Safari and Chromium decide from the user's history with the site. Source: [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- Safari: if an origin gets no user interaction (click or tap) in seven days of browser use, its script-created data can be deleted. MDN says this applies when cross-site tracking prevention is on and does not apply to server-set cookies. Source: [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- The WebKit announcement (24 March 2020) describes "deleting all of a website's script-writable storage after seven days of Safari use without user interaction on the site," including IndexedDB and LocalStorage; home screen web apps have their own counter. Source: [WebKit blog](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- Quota numbers conflict inside MDN's quota page: it says Web Storage "is limited to 10 MiB of data maximum on all browsers" and also that browsers store "up to 5 MiB of local storage ... per origin." A save under 1 KB is far below either figure. Source: [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- Firefox partitions `localStorage`, `sessionStorage`, and IndexedDB by top-level site (on by default since Firefox 103). A game embedded in another site gets a separate bucket from the same game opened directly. This MDN page covers Firefox only. Source: [MDN: State partitioning](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_partitioning)
- Design guidance: players should be able to stop anytime without losing meaningful progress; saving should be automatic so "the player will not forget to do it." Source: [Sirlin: Save Game Systems](https://www.sirlin.net/articles/save-game-systems)
- Phaser's registry only lives while the page is open, so persistent progress must be mirrored to storage. The registry emits `changedata` events that a save module can use. Source: [Phaser docs: Data Manager](https://docs.phaser.io/phaser/concepts/data-manager)

### Inferences
- Store one small versioned object under a single key (fields such as version, furthest level, checkpoint id, deaths, hardcore flag, settings). Write it on each checkpoint and on settings changes; read it once at boot.
- Wrap every read and write in try/catch and keep a copy in memory. If the test write fails, show a short, calm note ("Progress will not be saved in this window") and keep playing.
- A grader may open a link once on a locked-down laptop or in a private window. Offer a level select or "continue from level N" so progress loss is cheap, or an exportable resume code. Whether to allow skipping is Michael's call.
- Host the game as its own top-level page (its own URL) rather than inside an iframe, since embedded frames can use a separate or blocked storage bucket.
- `persist()` is optional and unlikely to matter for a one-off class demo; skip it.

### Gaps
- MDN's partitioning page covers Firefox only. I did not confirm Chrome or Safari behavior for embedded frames.
- I did not test private-window behavior in current browsers; the rules forbid browser tools.

## Needs Michael or Chrome
Fetches that failed or were blocked, and what I did. I did not use mirrors, caches, or alternate scrapers.
- Bulbapedia `Battle_transition` page: client_error on the one attempt. Pokemon battle-transition effects therefore have no source here. Needs a human look or a video, then decide if we care.
- Minecraft Wiki `minecraft.wiki/w/Hardcore`: client_error on the one attempt, not retried. I used Wikipedia (Minecraft) for the permadeath fact. The exact heart icon and UI behavior for Hardcore are unverified.
- Celeste Fandom `Assist_Mode` page: client_error. I used celeste.ink (works) and the Fandom Variant Mode page (works) instead.
- Hollow Knight Wiki: the first fetch with percent-encoded parentheses failed (client_error). The second attempt with plain parentheses worked, so it was not a block. Noted for honesty.
- Wikipedia `Inside_(2016_video_game)`: not found (wrong title). The correct `Inside_(video_game)` worked.
- WebSearch budget for the whole run was used up partway through (a limit shared by all agents), so I could not search for: a Super Meat Boy postmortem, Undertale or Pokemon transition effects, and text versions of the Art of Screenshake talk.
- Video-only sources a human or Chrome could transcribe: Vlambeer's "The Art of Screenshake," Jonasson and Purho's "Juice It or Lose It" (GDC Vault page gave only an abstract), and any Celeste or Super Meat Boy design talks.
- Hotline Miami's restart key: PCGamingWiki confirms a restart key exists but does not name it. Check in-game or on its Steam page.
- Real-user questions only playtesting can answer: whether a 0.8 s death-to-control loop feels right to non-gamers, and whether the 30 second checkpoint cap is generous enough.
