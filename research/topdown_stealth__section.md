## Top-down stealth (Earth levels 1 and 3)

Use tile-locked movement with smooth steps, and drive every sensor from one tile danger map that is both drawn and tested. Fairness comes from a visible cause, fixed patterns, and near-instant restarts.

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [Pokemon Gen I](https://bulbapedia.bulbagarden.net/wiki/Mew_glitch) | Trainer sees you along a line, shows "!", walks up | Tile steps, straight sight lines, a tell |
| [Mark of the Ninja](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules) | Binary light, noise rings, checkpoint per encounter, instant loads | Draw exactly what kills. One screen per trap room |
| [Commandos](https://en.wikipedia.org/wiki/Commandos:_Behind_Enemy_Lines) | Two-zone cone: caught on entry up close, only if standing far away | Lethal near zone, conditional far zone |
| [Metal Gear Solid](https://secure.cdn.us.playstation.com/manuals/classic/games/metal-gear-solid-manual-en.pdf) | Radar draws red view cones. Goggles reveal laser wires | Glasses as a reveal layer |
| [Monaco](https://en.wikipedia.org/wiki/Monaco:_What%27s_Yours_Is_Mine) | Line-of-sight fog of war, laser grids | Limited sight in level 3. Avoid trial and error |
| [Hitman GO](https://www.pocketgamer.com/hitman-go/review/), [Lara Croft GO](https://en.wikipedia.org/wiki/Lara_Croft_Go) | Guard kills the tile in front. Floors crack turn by turn | Hazards on a fixed beat |
| [Intravenous](https://store.steampowered.com/app/1486630/Intravenous/) | Visibility depends on light | Light as a cue, not a rule |

**How we build it**
- Movement: our own step controller. Store tile plus progress from 0 to 1, speed in tiles per second, keep walking while a key is held. The kid counts as on the tile being left until halfway, then on the destination.
- grid-engine uses this pattern, but its package.json pins Phaser to ~4.0.0. Test an install on 4.2.1 first.
- Danger map: for each sensor and heading, walk a line to every tile in range and wedge, stopping at walls. Cache per heading. Lerp with N = max(|dx|, |dy|) then round. Red Blob prefers this to Bresenham. Pick one diagonal rule.
- Draw that same tile set as a red overlay with Graphics, redrawn only when a heading changes. Bake static shapes with generateTexture.
- Smooth cones, if wanted: Raven sweeps 0.8 degree rays into one polygon for fillPoints. The tile set stays the kill test.
- Phaser 4: BitmapMask is gone and GeometryMask is Canvas only, so use the Mask filter with invert for dark vision. DynamicTexture needs render(). Math.TAU is now 2 pi.
- Failure: freeze 0.5 s, highlight the culprit with a line to the kid, explode, restart at the room checkpoint.

**Ideas for our levels**
- Trap set: fixed camera, sweeping camera, motion sensor, pressure plate, static laser, timed laser, moving laser, trap door. Each gets a shape, light, and sound cue.
- Level 1 (glasses on): one new hazard per room. Show it safely, then test it with a consequence.
- Level 3 (no glasses): same hazards, telegraphed by lens lights, hum, and pebble probes. A pebble crossing a beam sparks, like MGS cigarette smoke.
- Motion sensor: visible pulse every 0.5 s. Moving at a pulse fails. Standing still is safe.
- Cleaning robots: no lens, no red light, no cone, even with glasses. Let the player touch them harmlessly before any camera appears.

**Repos studied (for patterns only)**

| Repo | License | Pattern we learned |
| --- | --- | --- |
| [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine) | Apache-2.0 | Per-step progress counter. moveRandomly for roaming robots |
| [wiserim/phaser-raycaster](https://github.com/wiserim/phaser-raycaster) | MIT file, ISC in package.json | castCone sorts vertex angles, adds near-miss rays |
| [byronknoll/visibility-polygon-js](https://github.com/byronknoll/visibility-polygon-js) | Public domain | Angle sweep with a heap of active walls |
| [js13kgames/raven](https://github.com/js13kgames/raven) | ISC (package.json) | Same polygon draws and tests the cone |

Sources: [Red Blob 2D visibility](https://www.redblobgames.com/articles/visibility/) · [Red Blob line drawing](https://redblobgames.com/grids/line-drawing) · [Phaser 4 migration guide](https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md) · [GMTK School of Stealth transcript](https://amara.org/subtitles/4SwBdOk0E4LH/en/1/download/How%20Stealth%20Game%20Guards%20See%20and%20Hear%20%20School%20of%20Stealth%20Part%201.en.txt) · [Super Meat Boy interview](https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-) · [Specter of Torment level design](https://yachtclubgames.com/blog/specter-of-torment-level-design-deep-dive-2-5) · [MGS thermal goggles guide](https://samurai-gamers.com/?p=285175)
