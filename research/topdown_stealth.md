# Top-down stealth against automated security (Earth levels 1 and 3)

Method note for the report writer: WebFetch returns a model-written summary of each page, not raw text. Quotes below are copied from those summaries, so check wording before reusing them as direct quotes. Repos were cloned shallow into /home/claude/repos/topdown_stealth/ (grid-engine, phaser-raycaster, visibility-polygon-js, raven, and a sparse clone of phaserjs/phaser for API checks). Nothing from any repo was run, built, or installed. No code is copied; patterns are described in my own words.

## 1. Movement: Pokemon-style tile-locked steps vs free movement, and the grid-engine plugin

### Takeaway
Tile-locked movement with smooth steps reads better for stealth, because "inside the danger area or not" becomes a yes/no question on a tile, and it is simpler to build and test. grid-engine implements exactly this pattern, but its package.json pins Phaser to ~4.0.0, so a small custom step controller (same pattern) is the lower-risk choice.

### Cited Findings
- grid-engine is Apache-2.0 (LICENSE file and package.json), version 2.53.0. Its package.json description still says "Phaser3 plugin for grid based movement on a 2D game board", but both peerDependencies and devDependencies pin phaser to "~4.0.0". [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine) (files: package.json, LICENSE)
- Step model (src/GridCharacter/GridCharacter.ts): each step is a progress counter from 0 to 1000. Speed is in tiles per second: progress added per update is floor(delta seconds x speed x 1000). When the counter reaches 1000 the character lands on the next tile. If the movement input from this frame is still held and the next tile is free, the next step starts at once and leftover time carries into it. Otherwise the character stops. [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine)
- move(direction) is called every frame while a key is held. If the neighbor tile is blocked it only turns the character to face that way. turnTowards() turns without moving. Reading move() shows no turn-first pause: if the tile is free, the character starts walking at once. [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine)
- Logic and display are separate. The Phaser layer (GridCharacterPhaser.ts) draws the sprite at the tile position plus tile distance in the facing direction times progress/1000, so the smooth step is interpolation of a counter, not a tween. A headless variant exists (GridEngineHeadless.ts). [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine)
- Events (RxJS observables): movementStarted, movementStopped, directionChanged, positionChangeStarted, positionChangeFinished. The position events carry the exit tile and enter tile. Helpers include hasWalkedHalfATile() (progress above 500) and revertCurrentMovement(). [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine)
- Public API names in src/GridEngine.ts: create(tilemap, config), move, moveTo, moveRandomly(charId, delay, radius), follow, stopMovement, setSpeed, getPosition, setPosition, isMoving, getFacingDirection, turnTowards, getCharactersAt, isBlocked, isTileBlocked, findShortestPath, addCharacter, removeCharacter, update(time, delta). [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine)
- RandomMovement (src/Movement/RandomMovement/RandomMovement.ts): pick a random free direction, walk a random number of steps, wait a configurable delay, optionally stay within a radius of the start tile. This is ready-made roaming for harmless robots. [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine)
- Tiled integration: a boolean tile property ge_collide blocks walking. Direction-specific versions exist (ge_collide_up, _down, _left, _right, plus diagonals). The property name is configurable via collisionTilePropertyName. Pathfinding included: A*, BFS, bidirectional search, JPS4 and JPS8 (src/Pathfinding). [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine) (docs/p/tile-properties, docs/p/collision, docs/p/migrate-to-2)
- Tile-based threat legibility in Hitman GO: enemies sit on fixed nodes or routes, each enemy type has its own color so players learn its pattern, and all enemies move after each player move. The player dies if an enemy moves onto the player's node. [Wikipedia: Hitman Go](https://en.wikipedia.org/wiki/Hitman_Go)
- Pocket Gamer's review: entering the space directly in front of a guard ends the game; everything moves when you do; levels start with static guards and soon add guards who patrol or spin. [Pocket Gamer](https://www.pocketgamer.com/hitman-go/review/)
- Lara Croft GO: the player moves one node, then enemies and obstacles each move one unit; puzzles are fully visible without scrolling; each enemy type follows a specific movement pattern; the game teaches without a tutorial. [Wikipedia: Lara Croft Go](https://en.wikipedia.org/wiki/Lara_Croft_Go)
- Free-movement stealth reaches legibility another way. In Mark of the Ninja light and dark are binary with no visibility meter, and the GMTK transcript summary calls visibility almost fully binary: you are in the cone or you are not, with slight fuzziness at the edges. [Game Developer](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules); [GMTK School of Stealth transcript](https://amara.org/subtitles/4SwBdOk0E4LH/en/1/download/How%20Stealth%20Game%20Guards%20See%20and%20Hear%20%20School%20of%20Stealth%20Part%201.en.txt)
- Free-movement top-down example: the js13k game Raven uses WASD movement plus mouse look. [js13kgames/raven README](https://github.com/js13kgames/raven)
- Super Meat Boy's McMillen frames difficulty as the chance of dying multiplied by the penalty for dying. [Game Developer](https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-)

### Inferences
- Tile-locked reads better for instant-fail stealth. A kid on a tile is either in a sensor's tile set or not. Free movement creates pixel-level edge-of-cone deaths that feel arbitrary, which Mark of the Ninja softens with slight fuzziness at the edges, but a tile game can avoid entirely.
- Tile-locked is easier to build: occupancy is an array lookup, walls are tile properties, patrols are waypoint lists, and the kill test is exact. Free movement needs physics bodies, wall sliding, and hitbox tuning. No source compares build effort directly, so this is reasoning.
- Recommendation: write a small own step controller (tile position, progress 0 to 1, speed in tiles per second, keep walking while a key is held, events at step start and step finish). Reasons: our needs are one player plus scripted robots, it avoids the Phaser 4.0.x peer pin, and Claude can test it headless. Use grid-engine only if we later want pathfinding or many walkers.
- If grid-engine is used: setSpeed() covers the slower near-blind level; moveRandomly() covers roaming robots; positionChangeFinished is the right hook for pressure plates and trap doors (trigger on landing, not on starting a step).
- Occupancy rule to adopt for fairness: the kid counts as standing on the tile being left until progress passes halfway, then on the destination tile (the idea behind grid-engine's hasWalkedHalfATile). Use the same rule for the kill test.
- An optional turn-first pause (a brief delay when the direction changes) is not in grid-engine. It would be a small addition and gives a readable moment before stepping into danger.
- Free movement only wins when dodge skill is the point. The audience includes non-gamers, so tile-locked is the safer fit.

### Gaps
- No source compares tile-locked and free movement for build effort; the ease claim is inference.
- Not verified that grid-engine runs on Phaser 4.2.1 (rule: never run cloned code). Semver "~4.0.0" means 4.0.x only, so installing against 4.2.1 may warn or fail; needs a test install by whoever builds.
- Pokemon's exact walking speed and step timing were not sourced.

## 2. Detection model: precedents, and what makes instant fail feel fair

### Takeaway
Every precedent that works makes the lethal area visible, binary, and identical to what the code tests, and pairs it with cheap retries. For instant fail, fairness comes from five things: draw exactly what kills, fixed patterns, a visible cause on failure, checkpoints between encounters, and restarts with no loading.

### Cited Findings
Pokemon
- Gen I: Trainers spot the player the moment the player is in the Trainer's line of sight, a "!" appears above the Trainer's head, and the Trainer "must walk up to the player". One example on the page requires at least 1 tile between them when spotted. The page describes this only in the context of the Mew glitch, where "Long-Range Trainers" see as far as "the maximum allowed by the game". [Bulbapedia: Mew glitch](https://bulbapedia.bulbagarden.net/wiki/Mew_glitch)
- Emerald decompilation docs: a trainer object has a "Sight Radius" field; trainer types include one that sees all directions and ones that see one direction; noticing runs a check over object events and then an approach script walks the trainer to the player. Units (tiles) and the "!" are not stated on that page. [pokeemerald wiki: Trainer Scripts (mirror)](https://code.heni.lol/decomp/emerald/wiki/Trainer-Scripts)

Metal Gear Solid
- Official manual: states are Infiltration, Alert, Evasion. Being discovered by a soldier or a surveillance camera starts Alert. The radar becomes unusable in Alert and Evasion. Enemy field of vision is shown on the radar as a red cone. Claymores explode when an enemy or Snake enters the active area and can be disarmed by crawling to them. Thermal goggles enhance heat signatures. [MGS manual (PDF)](https://secure.cdn.us.playstation.com/manuals/classic/games/metal-gear-solid-manual-en.pdf)
- Fan guide: thermal goggles "allow you to see infrared traps or laser wires", which are otherwise hidden unless you smoke a cigarette or scan with the goggles. This is the direct precedent for glasses that reveal lasers. Fan source, not official. [Samurai Gamers](https://samurai-gamers.com/?p=285175)
- Giant Bomb's concept page: the enemy sight indicator is usually a cone in front of the enemy. Some games scale the cone to the exact detection distance; others approximate, so you may be spotted just outside. It can show on a radar or on the enemy, and may be a default tool or require an item. [Giant Bomb: Line of Sight Stealth](https://giantbomb.com/wiki/Concepts/Line_of_Sight_Stealth)

Commandos and Shadow Tactics
- Commandos: each enemy's vision is a green cone with two zones. Light green is close range, where commandos are spotted on entry. Dark green is long range, where they are spotted only if standing when they enter. In some missions raising the alarm is instant failure, and a mission fails if any commando dies. [Wikipedia: Commandos](https://en.wikipedia.org/wiki/Commandos:_Behind_Enemy_Lines)
- Shadow Tactics uses three zones: a danger zone with near-instant detection, a zone where crouching keeps you hidden, and refuge zones where you are always hidden. [GMTK transcript](https://amara.org/subtitles/4SwBdOk0E4LH/en/1/download/How%20Stealth%20Game%20Guards%20See%20and%20Hear%20%20School%20of%20Stealth%20Part%201.en.txt)

Mark of the Ninja
- Nels Anderson's five principles as reported by Game Developer: (1) transparent stealth system: light and dark are binary, a hidden player is drawn in black with red highlights, a noise ring shows how far a sound travels; (2) transparent AI: guards have three clear awareness levels, a ghost marks the last seen position, and the aim is that "the player will immediately understand what set it off"; (3) narrow gulf of execution; (4) limited consequences for failure: a checkpoint "between every meaningful encounter" and instant load times; (5) less-open world: encounter spaces are about one screen plus 0.5 to 0.75 of a screen, because larger spaces make players feel lost. At the edge of a guard's vision the guard glimpses the player and moves toward them but is not on full alert. [Game Developer](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules)
- GMTK transcript: usually entering a cone fills an awareness meter, which fills more slowly when the player is farther away, in peripheral vision, in low light, crouching, or still; Mark of the Ninja is almost fully binary. Ways games telegraph awareness include interface (Thief's light gem), animation and audio barks, refuge spaces, and revealing systems (Mark of the Ninja cones and sound pulses, Metal Gear Solid's radar cones, Sly Cooper's yellow light pools). Martin Walsh (Splinter Cell Blacklist) is quoted: "It's what the player thinks the NPC should be able to see or hear". [GMTK transcript](https://amara.org/subtitles/4SwBdOk0E4LH/en/1/download/How%20Stealth%20Game%20Guards%20See%20and%20Hear%20%20School%20of%20Stealth%20Part%201.en.txt)
- Game Developer's "building blocks" piece: Mark of the Ninja uses "expanding visual cues representing different emissions by various entities"; "stealth gives the player a narrow failure margin"; overly intelligent AI can do "more harm than good". [Game Developer](https://gamedeveloper.com/design/examining-the-essential-building-blocks-of-stealth-play)

Monaco
- Top-down; players see only what is in direct line of sight and the rest is fog of war. A critic (Giant Bomb's Alex Navarro) called some later levels "tedious exercises in trial-and-error". The Hacker character shuts off security systems temporarily. [Wikipedia: Monaco](https://en.wikipedia.org/wiki/Monaco:_What%27s_Yours_Is_Mine)
- Bit-tech: unexplored rooms are fully black, rooms in the current view cone are full color, and previously visited rooms you are not looking at drop to a grey blueprint-style outline; praised for "great implementation of line-of-sight knowledge". Hazards are not marked in advance. [Bit-tech review](https://bit-tech.net/reviews/gaming/monaco/1/)
- Game Informer: floors start dark and are lit as you enter; a cone of light shows what your character sees; a museum "laser detection grid" can be manipulated by the Hacker; alarms do not end the run and can be used as a distraction. [Game Informer](https://gameinformer.com/games/monaco/b/pc/archive/2013/04/24/embrace-the-heist-fantasy)

Intravenous
- Steam page: "Your visibility depends on how well-lit the environment is"; every step makes noise; enemies investigate sounds and open fire on sight; players can shoot out lights and throw bottles to distract. [Steam: Intravenous](https://store.steampowered.com/app/1486630/Intravenous/)
- PCGamesN: being spotted does not end the run; it shifts into shootout combat, so it is not an instant-fail precedent. [PCGamesN](https://www.pcgamesn.com/intravenous/free-steam)

Fair failure and retry cost
- Super Meat Boy: McMillen says it was "imperative that the action never stop, even when the player was killed"; respawn is near-instant; short "micro-levels" cut the distance to re-traverse; "penalty equals frustration". [Game Developer](https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-)
- Hitman GO and Lara Croft GO: threats sit on fixed nodes or set routes and move only after the player moves; Lara Croft GO puzzles fit on one screen; collapsing floors in Lara Croft GO crack with each successive turn. [Wikipedia: Hitman Go](https://en.wikipedia.org/wiki/Hitman_Go); [Wikipedia: Lara Croft Go](https://en.wikipedia.org/wiki/Lara_Croft_Go)

### Inferences
- Pokemon: the Mew glitch page implies ordinary Trainers have shorter, per-trainer sight ranges, which matches the "Sight Radius" field in the Emerald docs. Treat sight range as per-sensor data.
- Single source of truth: the same data (a tile set, or one polygon) must both draw the danger area and decide the kill. Every cited game that feels fair shows the lethal region (cones, rings, radar); Giant Bomb notes that approximate cones can leave the player spotted just outside the drawn cone.
- Cause clarity on death: Mark of the Ninja's "immediately understand what set it off" suggests the death animation should name the culprit. Proposal: on detection freeze other motion for about 0.5 s, highlight the sensor and draw a line to the kid, then explode and restart. The 0.5 s is a starting value to playtest, not a sourced number.
- Retry cost: room-sized encounters (about one screen), a checkpoint at every room door, and restart within about a second. A hardcore mode can raise the penalty (fewer checkpoints) instead of changing sensor behavior, using McMillen's chance times penalty framing.
- Fixed, learnable patterns beat randomness. Hitman GO and Lara Croft GO show learnable patterns with color-coding; no studied game relies on random sensor timing.
- Graded edge: Commandos' two zones and Mark of the Ninja's edge glimpse suggest a "far zone" for cameras that is lethal only when the kid is moving, with an always-lethal near zone. Optional; adds learning cost.
- Level 3 (no glasses) must never put a lethal hazard that is undetectable before the first death. Monaco's trial-and-error criticism and hidden-hazard design are the warning. Every hazard needs at least one non-lethal cue (sound, LED, or a pebble reaction).
- Pokemon's "!" then walk-up is a tell before the consequence. In an instant-fail game the tell has to be part of the failure sequence itself (the 0.5 s freeze), not a chance to escape.
- Light and dark (Intravenous, Mark of the Ninja) is a possible later modifier; for readability keep detection geometry independent of light and use light only to telegraph (lit emitters and lenses).

### Gaps
- No source gave tested numeric grace windows for instant-fail sensors; the 0.5 s freeze and about 1 s restart are proposals.
- Pokemon's ordinary per-trainer sight ranges in tiles were not found. Authoritative Bulbapedia pages were not retrievable (see Needs Michael or Chrome).
- Monaco cameras and lasers: lasers confirmed only via Game Informer ("laser detection grid"); cameras not confirmed in any page read.
- Intravenous: the one in-depth review found was paywalled. Its light/dark mechanic is known only from the Steam page text.
- GDC Vault talks (Nels Anderson; Lara Croft GO postmortem) were not opened; the Game Developer article stands in for the first. The TouchArcade Lara Croft GO postmortem covered design process, not threat telegraphing.

## 3. Trap vocabulary for a vacant automated mansion, and how each is telegraphed

### Takeaway
Use eight trap types built from three families (sight cones, beams, floor tiles), each with a shape cue, a light cue, and a sound cue. Precedents confirm cameras, lasers revealed by goggles, contact mines, and cracking floors; motion-only sensors, pressure plates, and moving lasers have no studied precedent and are design proposals.

### Cited Findings
- Cameras: in Metal Gear Solid a surveillance camera that discovers Snake triggers Alert, and jamming disables cameras. [MGS manual (PDF)](https://secure.cdn.us.playstation.com/manuals/classic/games/metal-gear-solid-manual-en.pdf)
- Camera object in a small top-down game (Raven): a camera has a 60 degree field of view (fov = 60), an arm and a head drawn separately, and a small status light on the head that is green when enabled and red when disabled; cameras are toggled by terminals. In Raven the cameras are friendly (enemies freeze inside their cone), so the light shows on/off state. [js13kgames/raven](https://github.com/js13kgames/raven) (src/js/Camera.js, Game.js)
- Lasers: thermal goggles or cigarette smoke reveal infrared laser wires in Metal Gear Solid. [Samurai Gamers](https://samurai-gamers.com/?p=285175)  Monaco has a museum "laser detection grid" that a Hacker can manipulate. [Game Informer](https://gameinformer.com/games/monaco/b/pc/archive/2013/04/24/embrace-the-heist-fantasy)
- Contact mines: Metal Gear Solid claymores trigger when a character enters the active area and can be disarmed by crawling up to them. [MGS manual (PDF)](https://secure.cdn.us.playstation.com/manuals/classic/games/metal-gear-solid-manual-en.pdf)
- Floors: Lara Croft GO collapsing floors crack with each successive turn; boulders, saw blades and traps must be avoided; levers shift walls and platforms. [Wikipedia: Lara Croft Go](https://en.wikipedia.org/wiki/Lara_Croft_Go)  Hitman GO trapdoors (called manholes by Pocket Gamer) are travel links, and potted plants hide the player. [Wikipedia: Hitman Go](https://en.wikipedia.org/wiki/Hitman_Go); [Pocket Gamer](https://www.pocketgamer.com/hitman-go/review/)
- Pokemon Gen III: Sky Pillar has cracked tiles on 2F and 4F; in Omega Ruby and Alpha Sapphire the floor has holes and cracks but the player cannot fall. The page does not explain the fall mechanic. [Bulbapedia: Sky Pillar](https://bulbapedia.bulbagarden.net/wiki/Sky_Pillar)
- Posture and motion-dependent detection: Commandos' far zone catches only standing commandos; Shadow Tactics has a zone where crouching hides you; detection meters fill more slowly when the player is still or crouching. [Wikipedia: Commandos](https://en.wikipedia.org/wiki/Commandos:_Behind_Enemy_Lines); [GMTK transcript](https://amara.org/subtitles/4SwBdOk0E4LH/en/1/download/How%20Stealth%20Game%20Guards%20See%20and%20Hear%20%20School%20of%20Stealth%20Part%201.en.txt)  Guards' peripheral vision reacts to "sudden movements". [Game Developer](https://gamedeveloper.com/design/examining-the-essential-building-blocks-of-stealth-play)
- Telegraph channels seen in precedents: drawn cone or radar cone (Commandos, Metal Gear Solid), expanding noise rings (Mark of the Ninja), color per behavior (Hitman GO), visible cracks (Lara Croft GO), a status light on the device (Raven), pools of light (Sly Cooper, per the GMTK transcript), enemy flashlights in the dark (Intravenous Steam page). [Game Developer](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules); [Steam: Intravenous](https://store.steampowered.com/app/1486630/Intravenous/)

### Inferences
Design proposals grounded in the findings above. None are play-tested. Starting numbers are guesses to tune.

| Trap | Triggers when | Telegraph, glasses on | Telegraph, glasses off (level 3) | Build note |
| --- | --- | --- | --- | --- |
| Fixed camera | Kid's tile is in the camera's danger set | Tinted danger tiles | Lens light color, soft hum, housing on the wall | One cached tile set |
| Sweeping camera | Same, set changes on a beat | Current set plus faint outline of the next heading | Servo tick on each step, lens light | One cached set per heading, step on a beat, pause at each end |
| Motion sensor | Kid or pebble moves inside the zone at a pulse | Ring with a visible pulse | Blink and tick on each pulse | Check "is moving" only at pulse times (about every 0.5 s) |
| Pressure plate | A step finishes on the plate | Outlined tile | Seam and slight lip; a pebble lands on it safely | Tile property, trigger on step finish |
| Static laser | Kid's tile is on a beam row or column | Beam line | Emitter nubs, dust motes, spark when a pebble crosses | Beam = tile set between emitter and receiver |
| Timed laser | Same, only while on | Beam plus on/off rhythm | Hum pitch changes, flicker about 0.5 s before on | Beat-synced timer |
| Moving laser | Beam tiles advance each beat | Beam plus its rail | Rail slot in the floor, sweeping sound | Emitter walks a path array |
| Trap door | Step finishes on the hatch, or a pebble hits its switch | Outlined hatch | Seams, hinge marks, cracked look | Swap tile to hole, add collision |

- The MGS goggles/smoke pair maps neatly onto the game: glasses show beams; without glasses a pebble thrown through a beam gives a visible spark, which plays the role of cigarette smoke.
- Motion sensor design: because "stand still and you are safe" is a rule only if the sensor's sampling is visible, show a pulse. Moving at the pulse fails; stopping between pulses is safe. This extends the Commandos "only if standing" and Shadow Tactics "crouching hides you" ideas.
- Pebbles count as motion for motion sensors, land on plates, and flip trap door switches. That makes every hazard probe-able in level 3, which supports the "no blind first death" rule.
- Color language: one color family for lethal things, a different one for harmless things, and one shape cue per family (cone, line, tile outline).

### Gaps
- No precedent studied for pressure plates (the Lara Croft GO Wikipedia summary does not list them), motion-only sensors, or moving laser rails.
- How Pokemon's cracked floor actually behaves was not confirmed from a page.
- No precedent found for pebble-triggered sensors.

## 4. Implementation: tile line of sight, visibility polygons, drawing cones, performance

### Takeaway
Use a tile danger map as the source of truth (a line walk from each sensor to each tile in range and cone), cache it per heading, and draw it as tile overlays; add a smooth polygon only if the look demands it, using a simple ray fan like Raven or a public-domain sweep library. Phaser 4 changed masks, so cone-shaped darkness in WebGL must use the Mask filter.

### Cited Findings
Tile line of sight (Red Blob Games, line drawing)
- The simple method is lerp and round: set N to max(|dx|, |dy|), compute N+1 evenly spaced points, round each to a tile. The author says Bresenham was faster on old hardware but is not faster on modern CPUs in his tests and is "much longer than I'd like". [Red Blob: line drawing](https://redblobgames.com/grids/line-drawing)
- Variants: grid walking moves one orthogonal step at a time and works with walls on tile edges; supercover visits every square the line touches and takes a diagonal step only at an exact corner. [Red Blob: line drawing](https://redblobgames.com/grids/line-drawing)
- Diagonal steps can slip through wall corners. Two fixes: allow a diagonal step if either neighbor is clear, or only if both are clear. The article does not name a single best variant for line of sight. [Red Blob: line drawing](https://redblobgames.com/grids/line-drawing)
- Rounding at exactly 0.5 and floating-point error can make A see B but not B see A; the suggested fix is nudging start points by an epsilon. [Red Blob: line drawing](https://redblobgames.com/grids/line-drawing)

Visibility polygons (Red Blob Games, 2D visibility)
- Sweep algorithm: sort wall endpoints by angle, sweep a ray around 360 degrees, keep a list of walls currently crossed by the ray, light only the nearest, and emit a triangle whenever the nearest wall changes. The union of triangles is the visible area. [Red Blob: 2D visibility](https://www.redblobgames.com/articles/visibility/)
- Cones and limited radius: no dedicated algorithm; the author suggests computing the visibility polygon then intersecting it with a circle, gradient circle, or cone shape. [Red Blob: 2D visibility](https://www.redblobgames.com/articles/visibility/)
- Performance: the approach is CPU-bound; the author says performance has not been a problem in his projects. Alternatives are a GPU subtractive approach (draw each wall's shadow as a quad) and lower-resolution light maps. [Red Blob: 2D visibility](https://www.redblobgames.com/articles/visibility/)
- Caveats from the author: his implementation is "mediocre", has numerical robustness issues and some empty triangles, shadows are hard-edged, and he recommends porting by hand. The Haxe reference code is Apache-2.0. [Red Blob: 2D visibility](https://www.redblobgames.com/articles/visibility/)

Repos read (licenses recorded)
- Annoraaq/grid-engine: Apache-2.0. See question 1. [Annoraaq/grid-engine](https://github.com/Annoraaq/grid-engine)
- wiserim/phaser-raycaster v0.11.1: the LICENSE file is MIT (copyright 2026 Marcin Walczak) but package.json says ISC, a conflict to resolve before any reuse. package.json describes it as "Raycasting plugin for Phaser 3 and 4"; devDependencies list phaser ^4.1.0. Features per README: casting in one direction, a 360 degree circle, or a cone; mapping of geometric objects, sprites, tilemap layers (with a collisionTiles option), and physics bodies; static and dynamic mapping; overlap detection with Arcade or Matter bodies; debug drawing. [wiserim/phaser-raycaster](https://github.com/wiserim/phaser-raycaster)
- phaser-raycaster castCone (src/ray/castCone.js), described in my words: it builds a target list of the cone's two edge angles, bounding-box corners inside the cone, every mapped vertex inside the cone, and intersections between mapped objects inside the cone. It sorts targets by angle offset, skips duplicate angles, and casts one ray per target. If a ray lands exactly on its target vertex and may graze a corner, it casts two extra rays a hair either side (0.0001 radians) so the shape follows the corner. Each cast tests object bounding boxes first and then each segment with Phaser.Geom.Intersects.LineToLine, keeping the nearest hit within ray range. The ray records stats (rays, tested objects, segments, milliseconds) per cast. [wiserim/phaser-raycaster](https://github.com/wiserim/phaser-raycaster)
- phaser-raycaster overlap (src/ray/overlap.js): finds game objects whose Arcade or Matter body overlaps the ray's field of view within a collision range, so "is the player in the cone" is a library call. [wiserim/phaser-raycaster](https://github.com/wiserim/phaser-raycaster)
- byronknoll/visibility-polygon-js v1.9: public domain (stated in its readme; no LICENSE file). API: compute(position, segments), computeViewport(position, segments, minCorner, maxCorner), inPolygon(position, polygon), convertToSegments(polygons), breakIntersections(segments). Stated complexity O(N log N). Segments may not intersect, and no vertex may touch the middle of a segment (breakIntersections fixes this, O(N squared)). Output is a clockwise polygon. The dev file shows a heap of active segments ordered by distance along the current sweep ray. [byronknoll/visibility-polygon-js](https://github.com/byronknoll/visibility-polygon-js)
- js13kgames/raven (fork of Elliot Nelson's 2018 entry): package.json says ISC, no LICENSE file; the README credits Red Blob's visibility article. Pattern in src/js/Util.js and Game.js: wall edges are precomputed at level load, doors add dynamic edges on each cone calculation, and cones for enabled cameras plus the player are rebuilt every frame with no caching (fine at js13k scale). getVisCone sweeps rays across the cone in 0.8 degree steps (comment says larger gaps are faster but cause artifacts at corners), shortens each ray against every edge it hits, and builds one polygon that is filled in a single call. Detection uses an even-odd point-in-polygon test on the same polygons that are drawn. A camera's cone is 60 degrees; cones are drawn into a separate line-of-sight canvas with alpha. [js13kgames/raven](https://github.com/js13kgames/raven)

Phaser 4 facts confirmed from source and docs (sparse clone of phaserjs/phaser, MIT headers)
- Graphics still has fillPoints, strokePoints, fillTriangle, strokeTriangle, arc, slice (pie wedge), fillCircle, lineStyle, clear, generateTexture (src/gameobjects/graphics/Graphics.js). [phaserjs/phaser](https://github.com/phaserjs/phaser)
- Graphics class notes: under WebGL data is decomposed into polygons, which is expensive for complex shapes; bake rarely changing shapes with generateTexture; keep Graphics objects together so they batch; avoid mixing object types because each batch flushes. A new pathDetailThreshold property (also a game config option) skips close vertices and "can greatly improve performance on complex shapes". [phaserjs/phaser](https://github.com/phaserjs/phaser); [Phaser v3 to v4 migration guide](https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md)
- Masks: BitmapMask is removed; the Mask filter replaces it (for example sprite.filters.internal.addMask(maskObject)). GeometryMask remains only in Canvas. [Phaser v3 to v4 migration guide](https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md); [Phaser 4 filter system](https://phaser.io/news/2026/05/phaser-4-filter-system)
- Mask filter source (src/filters/Mask.js): the mask can be a texture key or a GameObject (rendered into a DynamicTexture, updating automatically unless autoUpdate is false); it has an invert flag that swaps what is hidden and shown; a scaleFactor trades mask precision for memory; internal filters follow the object while external filters cover the camera view. [phaserjs/phaser](https://github.com/phaserjs/phaser)
- Actions.AddMaskShape builds a circle, square, rectangle or ellipse mask (optionally blurred) and applies it to a game object or camera. [phaserjs/phaser](https://github.com/phaserjs/phaser) (src/actions/AddMaskShape.js)
- DynamicTexture (src/textures/DynamicTexture.js): drawing commands are buffered and "you must" call render() to see anything; erase() draws with the ERASE blend mode. I did not check whether the RenderTexture game object calls render() for you. [phaserjs/phaser](https://github.com/phaserjs/phaser)
- Geom.Intersects still contains LineToLine, GetLineToLine, GetLineToPolygon, GetLineToRectangle, TriangleToLine, GetRaysFromPointToPolygon and others. Geom.Point is removed; geometry helpers return Vector2. [phaserjs/phaser](https://github.com/phaserjs/phaser); [Phaser v3 to v4 migration guide](https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md)
- Math.TAU changed from PI/2 to PI x 2, Math.PI2 is removed, and Math.PI_OVER_2 is new. This matters for any angle math copied from Phaser 3 examples. [Phaser v3 to v4 migration guide](https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md)
- Phaser 4 filter article notes: the Mask filter supports scaled-down framebuffers to save memory; the Sampler filter reads pixels from GPU to CPU, a readback cost; the article does not mention an inverted cone mask, so that use is untested. [Phaser 4 filter system](https://phaser.io/news/2026/05/phaser-4-filter-system)

### Inferences
- Primary model: danger tile set. For each sensor and heading, include a tile if its center is inside the wedge and within range, and a line walk from the sensor to that tile hits no wall. Choose one diagonal rule from Red Blob and keep it fixed. Cache sets per heading at level load (and recompute only when a door changes). Draw the same set as tinted tiles. This gives one source of truth for drawing and killing, which fits tile-locked movement.
- Optional smooth look: fill a ray-fan polygon (Raven style, around 0.8 degree steps) clipped to the danger set, or run a visibility library. The tile set stays the authority for the kill test; the polygon is decoration, otherwise edge disagreements feel unfair.
- Simple unobstructed cones can use Graphics.slice for a wedge; walls need the tile or polygon approach.
- Level 3 limited sight, three options in order of simplicity: (a) a large dark layer with a soft round hole that follows the kid (simple, ignores walls); (b) the Phaser 4 Mask filter with invert true on a dark overlay, using a GameObject (a Graphics with the visible shape) as the mask; (c) a DynamicTexture filled dark with erase() of a visible-area shape then render(). Option (b) and (c) are untested here. Start with (a) and upgrade only if walls leaking light looks wrong.
- Performance arithmetic (mine, not measured): a 60 degree cone at 0.8 degree steps is 75 rays; against 300 wall edges that is about 22,500 segment tests per cone, so ten cones recomputed every frame is about 225,000 tests per frame. Caching per heading removes this. For the tile method: a range-8, 90 degree wedge covers about 50 tiles with traces of at most 8 steps, about 400 steps per sensor per heading, which is trivial even for 20 sensors at 16 headings (about 128,000 steps once at load).
- Drawing cost is the real limit, not geometry. Redraw a Graphics only when a heading changes, keep polygons under about 100 vertices (my guess), group them to batch, and bake static ones with generateTexture.
- Merge collinear wall tiles into longer segments before feeding any polygon library; this cuts N sharply.
- Do not copy Phaser 3 snippets for masks or TAU without checking the v4 changes listed above.
- Library choice: phaser-raycaster is convenient (tilemap mapping, overlap tests, debug) and states Phaser 3 and 4 support; visibility-polygon-js is tiny, public domain, and engine-independent. For a tile game either is more than needed. The raycaster's licensing mismatch (MIT file vs ISC package.json) should be resolved before shipping it.

### Gaps
- No measured performance numbers for Phaser 4 Graphics or Mask filters; none of the cloned code was run.
- Not tested: inverted Mask filter with a Graphics mask on Phaser 4, and whether the RenderTexture wrapper auto-calls render().
- Phaser 4 Tilemap and Arcade physics changes were not covered by the migration guide text retrieved.
- Red Blob's line drawing page states no code license (page copyright notice only); the visibility reference code is Apache-2.0.

## 5. Harmless cleaning robots: teaching that a moving thing is safe

### Takeaway
No studied game has a clean precedent for harmless cleaning robots, but the teaching pattern is well documented: show a new element in a safe context first, make its behavior legible by look and placement, give each behavior its own color, and only then test under pressure. The glasses overlay can finish the lesson by drawing cones on threats and none on robots.

### Cited Findings
- Yacht Club Games (Specter of Torment level design): the first encounter with a new enemy is "designed to show you the properties of the enemy in a safe context" (the first Tadvolt starts asleep, and the room limits what it can do). Placement then teaches the rules ("building trust with the player"; enemies should show what they do), a second room adds a consequence, and later rooms twist the enemy's use and combine it with other elements. [Yacht Club Games](https://yachtclubgames.com/blog/specter-of-torment-level-design-deep-dive-2-5)
- Hitman GO gives each enemy type its own color so players learn its movement pattern, and starts with static guards before patrolling ones. [Wikipedia: Hitman Go](https://en.wikipedia.org/wiki/Hitman_Go); [Pocket Gamer](https://www.pocketgamer.com/hitman-go/review/)
- Lara Croft GO introduces new mechanics and enemy types in successive levels without a tutorial. [Wikipedia: Lara Croft Go](https://en.wikipedia.org/wiki/Lara_Croft_Go)
- Mark of the Ninja's "transparent AI" principle: the player should immediately understand why a character's behavior changed. [Game Developer](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules)
- Threat indicators are the cone convention. Cones on threats are drawn by the game (Commandos, Metal Gear Solid radar) and light pools mark guards (Sly Cooper). [Giant Bomb: Line of Sight Stealth](https://giantbomb.com/wiki/Concepts/Line_of_Sight_Stealth); [GMTK transcript](https://amara.org/subtitles/4SwBdOk0E4LH/en/1/download/How%20Stealth%20Game%20Guards%20See%20and%20Hear%20%20School%20of%20Stealth%20Part%201.en.txt)

### Inferences
- Because the robots appear in the first side-scroll before any sensor exists, they are safe by context: nothing around them can hurt the kid. Let the player touch, stand near, and walk past them with no consequence.
- Risk: the first moving things the player ever sees are harmless, which could teach "moving means safe" and make sweeping cameras feel unfair later. Counter with a visual language split: robots have no lens, no red or amber light, and no drawn cone; every threat has a lens or emitter, a warm warning light, and a drawn shape when the glasses are on.
- The glasses become a truth teller. When the kid first wears them, threats gain cones and beams and robots gain nothing. The absence of any danger shape is the signal. In level 3 (no glasses) the same split must hold through light and sound alone, since the player has learned it.
- Keep robots predictable (loops or short random walks via a library like grid-engine's moveRandomly), and never let a robot be the cause of a death (no pushing the kid onto a plate or into a beam), so the trust built early is not broken.
- Do not put robots on security layers: a robot crossing a laser or camera cone with no effect would teach that those are harmless too.

### Gaps
- No stealth or puzzle game with explicitly harmless cleaning robots was found in sources I could open.
- Super Mario Bros World 1-1, the classic example of teaching the first enemy safely, could not be sourced: the MCV article read had no details and the Wikipedia World 1-1 page was not opened.
- No source tested whether a "moving means safe" misconception actually forms; that risk is my inference.

## Needs Michael or Chrome
- Intravenous review on Core Runner (corerunner.substack.com redirects to https://www.corerunner.net/p/intravenous-review): paywalled after the intro. Only needed for a deeper look at Intravenous light and dark.
- Bulbapedia "Long-range Trainer glitch" URL: fetch failed (client error). The Mew glitch page worked and gave the Gen I line-of-sight facts. A Chrome pass over Bulbapedia trainer pages could add ordinary Trainer sight ranges.
- TrueAchievements Monaco walkthrough (https://www.trueachievements.com/game/Monaco/walkthrough/2): fetch failed (client error). Needed to confirm Monaco security cameras.
- SuperCheats "how to see lasers" for Metal Gear Solid: fetch failed (client error); the Samurai Gamers fan guide was used instead.
- GDC Vault talks (Nels Anderson on Mark of the Ninja; "Distilling A Franchise: A Lara Croft GO Postmortem"): not opened because video is likely member-only. Not worked around.
- bugnet.io article on fair stealth systems: the URL returned the blog index instead of the article; ignored.
