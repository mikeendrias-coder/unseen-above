# Sight and sound: reveal vision, its loss, and playing nearly blind (slug: sight_and_sound)

Scope: the glasses overlay in Earth levels 1 and 2, their loss in Earth level 3, limited sight, near-blind play, pebble throwing, and Phaser implementation. Mechanics only. No story, lore, or art direction is decided here.

Method notes for the report writer:
- WebFetch returns a model-written summary of each page. Facts below are limited to what those summaries stated, and quotes are kept short. Code facts come from reading the cloned files directly (nothing was run, built, or installed).
- The WebSearch budget ran out partway through the run. Several games therefore have no retrieved source and are listed under Gaps and under "Needs Michael or Chrome". Nothing from those games is asserted.
- Phaser 4 facts (v4.2.1) were read from the engine source and its bundled docs. Phaser 3 behavior is cited from two Phaser 3.90 repos and forum threads. Differences are flagged inline as "v3" and "v4".
- Style: no em dashes or en dashes anywhere. Ranges are written "2 to 3".

One-paragraph recommendation: make the glasses a thin, distance-limited overlay that shows only lasers and sensor ranges, with no battery. Keep permanent tells in the world (emitter nodes, hum, faint shimmer, dust) so the glasses are a layer on top of readable hazards. Stage the break as a visible event, degrade the overlay over about 1 to 2 seconds, and hand over pebbles at once. In Earth 3, use a small soft sight radius, slower movement, dim map memory, and pebble landings that briefly reveal a ring, with each pebble costing something. Build the darkness with a plain dark RenderTexture that works in Phaser 3 and 4, and treat Phaser 4 filters and cone lights as WebGL-only polish.

## 1. Reveal modes: always on or toggle, energy limits, visual language

### Takeaway
Precedents split into two failures. A strong, always-available reveal (Arkham) was called a mistake by its own art director. A metered reveal (Hitman: Absolution) "runs out fairly quickly" per a reviewer. A narrow, distance-limited, hazard-only overlay with no meter avoids both and needs no extra UI explanation for non-gamers.

### Cited Findings
- Metal Gear Solid 1: a fan guide says the thermal goggles "allow you to see infrared traps or laser wires" and that these are otherwise hidden unless you smoke a cigarette or scan the area with the goggles. The page does not say which areas use lasers or what smoking costs. (Source: [Samurai Gamers, MGS1 thermal goggles](https://samurai-gamers.com/?p=285175))
- Thermal goggles as a model: A.V. Club's author says MGS goggles show enemies but keep the camera under the player's control and bring their own drawbacks. (Source: [A.V. Club, Out of Focus: Dismantling Detective Mode](https://www.avclub.com/out-of-focus-dismantling-detective-mode))
- Batman: Arkham Asylum: Rocksteady art director Dave Hego said at the Develop conference that the "detective vision" X-ray effects were overdone. Many players used the X-ray view for the whole game and missed the detailed level work. He said: "It was a gameplay decision to make detective vision so strong...we're going to try not to do that mistake again." The sequel should be "more like augmented reality". (Source: [Game Informer, 14 Jul 2010](https://www.gameinformer.com/b/news/archive/2010/07/14/rocksteady-to-tone-down-x-ray-vision-in-arkham-asylum-2.aspx); also [The Sixth Axis](https://www.thesixthaxis.com/?p=49991))
- Arkham visual language: the mode tints the world blue and highlights destructible walls, grates, enemy count and awareness, civilians, and corpses. It also follows footprints and odors. Wikipedia names it "Detective Vision" and says nothing about an energy limit. (Source: [Wikipedia, Batman: Arkham Asylum](https://en.wikipedia.org/wiki/Batman:_Arkham_Asylum))
- Critique of always-on vision (Stephen Beirne, 25 Feb 2014): it flattens the world into color-coded signposts and replaces observation with seeing ("Observation is replaced by seeing"). He proposes a limited resource, enemies shown only within a few feet and only in the player's visual range, vague location through sound, vibration, or radar, and an optional mode. (Source: [A.V. Club](https://www.avclub.com/out-of-focus-dismantling-detective-mode))
- A 2010 column asks whether Detective Mode made Arkham Asylum too easy and whether designers should restrict such tools for balance. The excerpt gives no conclusion. (Source: [The Slowdown via N4G, Nabeel Burney](https://n4g.com/news/515630/the-slowdown-the-goggles-they-do-everything))
- Hitman: Absolution Instinct (review): shows enemy locations, patrol patterns, and useful items. It is "not nearly as detailed" as Arkham's tool. The meter "runs out fairly quickly" and refills at specific points, with frequency set by difficulty. On harder settings Instinct is more limited. Point-to-point shooting drains it. It also lets 47 "brush" past suspicious enemies in a disguise. (Source: [Entertainium review](https://entertainium.co/2012/12/17/hitman-absolution-review/)). Wikipedia says only that Instinct "lets the player monitor enemies more easily". (Source: [Wikipedia, Hitman: Absolution](https://en.wikipedia.org/wiki/Hitman:_Absolution))
- Dishonored Dark Vision: it "allows the player to see enemies through walls, their field of view and highlights interactive objects". Mana partially regenerates after use, so Dark Vision and Blink can be used without potions. (Source: [Wikipedia, Dishonored](https://en.wikipedia.org/wiki/Dishonored))
- Deus Ex: Human Revolution: some augmentations depend on Adam's energy and deactivate once it drains. The fetched text does not name Smart Vision. (Source: [Wikipedia, Deus Ex: Human Revolution](https://en.wikipedia.org/wiki/Deus_Ex:_Human_Revolution))
- The Last of Us Part II Listen Mode: enemies appear as outlines visible through walls and objects. An arrow impalement disables Listen Mode until the arrow is removed. (Source: [Wikipedia, The Last of Us Part II](https://en.wikipedia.org/wiki/The_Last_of_Us_Part_II)). Naughty Dog's Grounded update post says Grounded disables Listen Mode and deactivates some HUD elements while making ammo and crafting materials very scarce. (Source: [Naughty Dog blog](https://www.naughtydog.com/blog/the_last_of_us_part_ii_grounded_update))
- Mark of the Ninja shows sound as rapidly expanding circles and shows a question mark over an enemy that heard or glimpsed the player. (Source: [Wikipedia, Mark of the Ninja](https://en.wikipedia.org/wiki/Mark_of_the_Ninja))
- Laser drawing in code: cyber-heist draws a beam as a 2 px line at alpha 0.8 plus a 6 px line at alpha 0.15 as glow. Small emitter dots at both ends stay at alpha 0.8 when on and 0.3 when off, so the housing remains visible when the beam is off. Camera cones are filled fans at alpha 0.08, raised to 0.15 when alerted. (Source: [Ryuki-XD/cyber-heist](https://github.com/Ryuki-XD/cyber-heist/blob/main/js/objects/GameObjects.js), js/objects/GameObjects.js and js/entities/Camera.js, commit 2b76511)

### Inferences
- Our threats are automated, so the overlay has a narrow job: laser paths and sensor ranges only. Narrow scope avoids the "flattened world" critique and the "players stay in vision mode" problem.
- Fade the overlay by distance from the player instead of adding a meter. This follows the A.V. Club suggestion (short range, in view) without a gauge to explain. Starting values to tune: full strength within about 6 tiles, fading to nothing by about 9.
- Alternatives for Michael: (B) hold-to-scan with a short recharge, like Dishonored mana, which regenerates; (C) always-on in Earth 1 and hold-to-scan in Earth 2, as a ramp toward the loss. Option B and C add a button and a gauge, which the Hitman review suggests is friction.
- Keep permanent physical tells (emitter housings, camera heads, trap door seams) visible with or without glasses. The glasses then add only the invisible part (the beam and the cone). cyber-heist's emitter dots persisting when a laser is off is the code precedent.
- Reserve one color family for "danger" in the overlay. Reuse a faint version of that color for the Earth 3 shimmer so the player already knows what it means. Exact colors are an art decision for Michael.

### Gaps
- Splinter Cell goggles (night vision, thermal, sonar) and the HUD noise and light meters: the fetched Wikipedia page did not cover them, and no other source was retrieved.
- Deus Ex "Smart Vision": not found in the fetched text.
- Arkham energy limit or cooldown for Detective Mode: Wikipedia is silent; not verified.
- MGS1 laser locations and the cost of smoking: the fan guide is silent; Fandom pages were blocked.
- TLOU Listen Mode range and movement rules: not retrieved.

## 2. Losing an ability mid-game

### Takeaway
A loss lands when it has a visible cause, the player already relied on the ability, a new rule shows up immediately, and a partial replacement arrives fast. Metroid Dread and Castlevania: Symphony of the Night both do this. The glasses break should follow the same four beats.

### Cited Findings
- Metroid Fusion: X parasites infect Samus and she loses her abilities. She regains them by defeating larger X-infected creatures. The SA-X mimics Samus at full power, and the station computer warns she "can't face it", so she avoids it (a stealth encounter). The development section says the canonical explanation for the redesigned suit is that an X attack made her lose all abilities. (Source: [Wikipedia, Metroid Fusion](https://en.wikipedia.org/wiki/Metroid_Fusion))
- Metroid Dread: a Chozo warrior destroys the exit, defeats Samus, and "strips her suit of most of its abilities". She then absorbs energy that temporarily enables the Omega Blaster, uses it on an E.M.M.I., and "regains some of her abilities". Recovery is partial and tied to a temporary power. E.M.M.I. zones use stealth rules: hide, reduce noise, or use the Phantom Cloak (invisible but slower). If caught, the player has "two narrow windows" to counter. Destroying an E.M.M.I. grants a permanent upgrade. (Source: [Wikipedia, Metroid Dread](https://en.wikipedia.org/wiki/Metroid_Dread))
- Metroid Prime 2: Echoes: the Ing strip Samus's weapons and send her back through the portal. In Dark Aether the air is corrosive and damages the suit, so she moves between safe zones where health regenerates. Some safe zones are permanent and some are activated by firing a beam at a generator. Upgrades reduce or negate the damage. (Source: [Wikipedia, Metroid Prime 2: Echoes](https://en.wikipedia.org/wiki/Metroid_Prime_2:_Echoes))
- Castlevania: Symphony of the Night: Alucard starts "slick, fast, and super powerful", and wargs "burst into flames". Death then strips his weapons and leaves fists, so "Enemies that died with a single hit now take multiple punches". Alucard later regains and surpasses his original strength. The article calls the opening a hook; it does not discuss design intent. (Source: [Kotaku, The Castlevania game that changed everything](https://kotaku.com/the-castlevania-game-that-changed-everything-1821969215)). Wikipedia adds that most of the castle is inaccessible until items and abilities are collected. (Source: [Wikipedia, Symphony of the Night](https://en.wikipedia.org/wiki/Castlevania:_Symphony_of_the_Night))
- Temporary sense loss tied to a visible cause: in TLOU Part II an arrow impalement disables Listen Mode until the arrow is removed in cover. (Source: [Wikipedia, The Last of Us Part II](https://en.wikipedia.org/wiki/The_Last_of_Us_Part_II))
- Teaching order: Dark Echo introduces one new element at a time (movement, then branching paths, then red-line traps, then pursuers) and uses minimal text. (Source: [Game Developer, What Dark Echo does](https://gamedeveloper.com/design/what-dark-echo-do-that-you-should-do-in-your-game-either))

### Inferences
- Staging checklist for the glasses break:
  1. Show the cause on screen (the trip).
  2. Degrade the overlay over about 1 to 2 seconds (stutter, flicker, off) instead of cutting it.
  3. Make the first hazard after the break demonstrate the new rule at once, as SotN does with fists.
  4. Hand over pebbles within seconds, as Dread hands over the Omega Blaster.
  5. Put a safe first test hazard right after the break.
  6. Make sure the player relied on the glasses beforehand: at least one beat in each of Earth 1 and Earth 2 where the glasses are the only way to see the threat.
- Reading SotN's Death scene as a deliberate rule reset is an inference; Kotaku does not state intent.
- Dread's cloak trades invisibility for slower movement. Pair our "slower" rule with a benefit (more reaction time, quieter) so it reads as a trade and not a punishment.
- Prime 2's safe zones suggest a pacing tool for Earth 3: a few lit pools (lamps, status lights) where sight returns.

### Gaps
- Ori: no source retrieved on ability loss. Wikipedia's Will of the Wisps text describes no stripping event. Nothing is claimed.
- Fusion: the Wikipedia text does not name the Varia suit or describe timed recovery.
- Giant Bomb's "Abilitease" concept page (a general term for this trope) was blocked.
- Developer interviews on intent for Metroid or SotN: not found.

## 3. Limited sight: darkness, view cones, fog

### Takeaway
Use a small, soft-edged sight radius with dim memory of seen tiles, and keep the player sprite readable above the darkness. A directional cone (Darkwood) is optional; for a near-blind kid a radius reads better. Darkness works best when it carries a rule (Don't Starve) or has safe pools (Dark Aether).

### Cited Findings
- Darkwood: the player sees only a cone in front. Outside it the world has no fine detail, and turning reveals the detail. Sprinting locks the cone to the movement direction, so it is "impossible to tell how much of a lead has been established". Enemies are heard in blind spots. At night "the woods become pitch black", some creatures "appear only as ripples in the shadows", and generator light draws in standard foes. The map shows location only near landmarks. Night scenes rely on whispers, footsteps, and scratching with no visual cues, which the review flags as a barrier for deaf and hard-of-hearing players. (Source: [Game Critics, Darkwood review](https://gamecritics.com/daniel-weissenberger/darkwood-review/)). Wikipedia confirms the top-down view and day/night structure. (Source: [Wikipedia, Darkwood](https://en.wikipedia.org/wiki/Darkwood))
- Teleglitch: players "can only see what is in their character's line of sight", and level details are revealed "from the shadows" as the player moves. Wikipedia compares it to Monaco. (Source: [Wikipedia, Teleglitch: Die More Edition](https://en.wikipedia.org/wiki/Teleglitch:_Die_More_Edition))
- Monaco: top-down, only direct line of sight is visible and the rest is fog of war. A Lookout character can see enemies outside the player's line of sight. Edge staff disliked the inability to preplan missions under fog of war. The page does not say whether explored areas stay visible. (Source: [Wikipedia, Monaco: What's Yours Is Mine](https://en.wikipedia.org/wiki/Monaco:_What%27s_Yours_Is_Mine))
- Mark of the Ninja: enemies out of line of sight are hidden from the player, so the player relies on sound circles and status icons. New Game Plus limits the view to a cone in the facing direction, hides enemy lines of sight, and hides the radius within which the player's actions will be heard. (Source: [Wikipedia, Mark of the Ninja](https://en.wikipedia.org/wiki/Mark_of_the_Ninja))
- Among Us: Impostors can sabotage the lights, "limiting the Crewmates' vision". No numbers were retrieved. (Source: [Wikipedia, Among Us](https://en.wikipedia.org/wiki/Among_Us))
- Don't Starve: Charlie attacks whenever the screen goes dark, and a light source or night vision keeps Charlie away. Sanity also drops at night. (Source: [Wikipedia, Don't Starve](https://en.wikipedia.org/wiki/Don%27t_Starve))
- Metroid Prime 2 Dark Aether safe zones (see section 2). (Source: [Wikipedia, Metroid Prime 2: Echoes](https://en.wikipedia.org/wiki/Metroid_Prime_2:_Echoes))
- Radius constants in code (Article-Zero, turn-based tile game): player sight radius 7 when lit, 3 when dark, plus 4 with a flashlight, and a BLIND_RADIUS of 2 described as "functionally blind beyond a tile or two". Sight uses a 360-ray shadowcast. Tiles not currently visible are drawn at alpha 0.32 with glyphs hidden, and entities on unseen tiles are hidden. (Source: [luckythemonster/Article-Zero](https://github.com/luckythemonster/Article-Zero/blob/main/src/engine/VisionCone.ts), src/engine/VisionCone.ts and src/phaser/RoomScene.ts, commit 44c9091)
- Fair-visibility principle in code (operation-good-boi): the player sprite and guards stay off the Light2D pipeline so ambient darkness never hides the player. Guards dim in unlit areas but are floored (sprite alpha floor 0.5, cone alpha floor 0.13 versus 0.34 lit). A code comment says this keeps them "harder to spot at a glance", never "invisible until it's too late". (Source: [williamchen-pm/operation-good-boi](https://github.com/williamchen-pm/operation-good-boi/blob/master/src/game/scenes/GameScene.js), src/game/scenes/GameScene.js and src/game/npc.js, commit 5d98986)
- Detection should avoid both false positives and misses, or immersion breaks. (Source: [GDC Vault, Can You See Me Now? Building Robust AI Sensory Systems, Eric Martel, Ubisoft, GDC 2017](https://gdcvault.com/play/1026497/Can-You-See-Me-Now); abstract only, full talk is members-only)

### Inferences
- Starting values to tune in playtest: sight radius 2 to 3 tiles (BLIND_RADIUS is 2), soft edge, remembered tiles at about 30 percent brightness (Article-Zero uses 0.32).
- The Edge complaint about Monaco warns against hiding the layout completely. Keep dim memory, and have Earth 3 reuse the hazard grammar the player learned in Earth 1 and 2 so planning stays possible.
- Darkwood's sprint lock shows a useful trade: more speed, less looking. Our kid has no sprint, so slower movement already pairs with better control.
- Hardcore mode can copy the Mark of the Ninja New Game Plus recipe: no noise rings, no map memory, smaller radius.
- A radius is simpler to build and read than a cone. If Michael wants a facing cue, add a small forward bias to the radius (a slightly longer reach in the facing direction).

### Gaps
- Among Us vision radii and Don't Starve darkness timing and damage: not retrieved (Fandom blocked).
- Teleglitch flashlight and cone details: Wikipedia lacks them and no developer post was found.
- Monaco guard cone display and noise indicators: not covered by the fetched text.

## 4. Playing nearly blind: fair cues without sight

### Takeaway
Give every hazard at least two non-glasses cues (one sound, one faint visual) that grow with proximity, and never make sound the only channel. Let pebble landings act as limited sight probes so the new tool replaces the lost one.

### Cited Findings
- Dark Echo: the player is a pair of white footprints and the world appears only as lines. Footsteps send out white lines that bounce off walls, water, doors, and enemies. Blue is water (slows the player), yellow is locked doors, red is enemies. Tiptoeing by tapping quickly makes less noise, which gives less information. The game has 80 levels and expects many deaths. It is not playable by a blind person. (Source: [Macworld, You should play Dark Echo](https://www.macworld.com/article/225019/you-should-play-dark-echo.html))
- Dark Echo design lessons: each step makes a noise whose wave reveals the room outline. Moving slowly gives a shorter wave and less information. Sound reveals surface types (stone versus wood) and danger (a collapsing roof, a chasing creature). Headphones and 3D positional audio clarify direction. (Source: [Game Developer, What Dark Echo does](https://gamedeveloper.com/design/what-dark-echo-do-that-you-should-do-in-your-game-either))
- Perception: Cassie navigates by echolocation. Footsteps, dripping water, and wind briefly reveal her surroundings, and tapping the cane shows a full view of a room. Tapping too often is risky because the Presence may kill the player. The Presence cannot be killed. (Source: [Wikipedia, Perception](https://en.wikipedia.org/wiki/Perception_(video_game)))
- Beyond Eyes: the world starts all white. Objects are revealed and highlighted only when Rae touches them. Sound tells the player where things are, and judging whether car sounds are far enough to cross is a main challenge. Guidance is mostly audio. (Source: [Wikipedia, Beyond Eyes](https://en.wikipedia.org/wiki/Beyond_Eyes))
- Darkwood: enemies are audible in blind spots, and audio-only threats exclude deaf and hard-of-hearing players. (Source: [Game Critics, Darkwood review](https://gamecritics.com/daniel-weissenberger/darkwood-review/))
- Thief: footsteps are quiet on carpet and grass and loud on metal and ceramic tile. Moss arrows muffle footsteps. A HUD light gem shows how visible the player is. NPCs whistle or walk so the player can judge distance by sound. (Source: [Wikipedia, Thief: The Dark Project](https://en.wikipedia.org/wiki/Thief:_The_Dark_Project))
- Sound that alerts monsters in an echolocation demo: rays travel outward, bounce off walls, and wake sleeping monsters when a ray head touches them. (Source: [samblyon/mattressFactory](https://github.com/samblyon/mattressFactory/blob/master/js/ray.js), js/ray.js, commit cdae34e)
- MGS1 smoke and goggles precedent for revealing invisible beams: see section 1. (Source: [Samurai Gamers](https://samurai-gamers.com/?p=285175))

### Inferences
- Cue set per hazard (all proposals except the MGS smoke precedent):
  1. A permanent emitter or housing that is visible inside the sight radius.
  2. A hum per hazard type whose volume or pitch rises with proximity.
  3. A faint shimmer along the beam, visible only within about 2 tiles.
  4. Drifting dust (30 to 60 pooled sprites) that flashes when a particle crosses an active beam. A point-to-segment distance test per dust sprite is enough.
- Pebble ping: a landing draws one ring and reveals tiles within a small radius for about 1.5 seconds. A finite pebble count makes probing a real cost, which matches Perception's rule that tapping too often is risky.
- Dual coding: every audio cue gets a visual twin and every critical visual gets an audio twin. Reasons: classroom play may be muted, some players are deaf or hard of hearing (Darkwood caveat), and headphones are not guaranteed (Dark Echo note).
- Fairness rules: hit areas equal drawn shapes plus a small forgiveness margin; no kill zone appears without a cue; teach one hazard type at a time (Dark Echo order).
- Slower movement also gives more reaction time, which makes near-blind play fairer.

### Gaps
- Stifled (Gattai Games, microphone-based echolocation): no source retrieved. The guessed Wikipedia URL returned "not found" and the search budget was gone.
- Perception: the fetched text does not confirm blue outlines or detail the Presence's noise rules, and no developer talk on fairness was retrieved.
- Beyond Eyes: the fetched text gave no detail on smell or explicit guidance systems.
- Any precedent for dust or shimmer revealing beams other than MGS smoke: none found.

## 5. Throwing to distract or trigger

### Takeaway
Treat each landing as two events: an impact (for sensors and trap doors) and a noise (for anything that listens). Show a landing marker and a noise ring in normal mode and hide the ring in hardcore mode. Limit the count and show it.

### Cited Findings
- Thief: throwing an object makes noise that lures NPCs from their posts. NPCs react to out-of-place sounds: a brief suspicion is ignored, a longer one makes them alert and search. The arrow types listed on that page are water, rope, moss, and fire, so a noise arrow is not confirmed there. Loot and unused items do not carry between missions, which encourages immediate use. (Source: [Wikipedia, Thief: The Dark Project](https://en.wikipedia.org/wiki/Thief:_The_Dark_Project))
- Hitman: Absolution (review): thrown items make noise that targets within earshot hear, and enemies investigate. The review calls distraction "a major part" of the game. Detection depends on noise level and difficulty, so sometimes only one nearby enemy comes. (Source: [Entertainium review](https://entertainium.co/2012/12/17/hitman-absolution-review/))
- Mark of the Ninja: sound shows as expanding circles, a question mark marks an enemy that heard something, and smoke bombs and firecrackers are Distraction Items bought before a mission. The page does not describe lure mechanics. (Source: [Wikipedia, Mark of the Ninja](https://en.wikipedia.org/wiki/Mark_of_the_Ninja))
- Dishonored: enemy AI responds to sound and "can be distracted using sound to lure guards away". Bottles are not confirmed on that page. (Source: [Wikipedia, Dishonored](https://en.wikipedia.org/wiki/Dishonored))
- The Last of Us Part II: players can throw bricks and bottles to distract or attack enemies. (Source: [Wikipedia, The Last of Us Part II](https://en.wikipedia.org/wiki/The_Last_of_Us_Part_II))
- Awareness pattern: a Thief-modeled Unity sensory system uses four awareness levels (None, Low, Medium, High) that cool down over a configurable time, evenly split across levels. This repo's hearing is not implemented, and its license is Apache-2.0. (Source: [ntk4/UnitySensorySystem README](https://github.com/ntk4/UnitySensorySystem))
- Sound-to-alert thresholds in code: Article-Zero sets sound intensity 1 to move a guard from NORMAL to CAUTION and intensity 4 to jump to ALERT ("very loud", for example a knock). CAUTION decays after 4 turns without input. A guard's last known stimulus stays frozen at the last confirmed sighting, with no omniscient refresh of the player's live position. (Source: [luckythemonster/Article-Zero](https://github.com/luckythemonster/Article-Zero/blob/main/src/engine/AlertFSM.ts), src/engine/AlertFSM.ts, commit 44c9091)
- Alert hook in code: in cyber-heist a camera alert calls `alertToPosition(player.x, player.y)` on every guard within 300 px. Guards run PATROL, ALERT (flash, then a delay), CHASE, and SEARCH (walk to last known position, rotate, return to patrol after a timer). (Source: [Ryuki-XD/cyber-heist](https://github.com/Ryuki-XD/cyber-heist/blob/main/js/entities/Guard.js), js/entities/Guard.js and js/entities/Camera.js, commit 2b76511)
- Fake height in a top-down game: keep the logical ground position on a parent object and move only a child sprite up for the jump. The shadow stays at ground position. Putting the collider on the moving child can break ground and height logic, and tilemaps with different heights add complexity. (Source: [Defold forum, Top-down game with "3D" jump](https://forum.defold.com/t/top-down-game-with-3d-jump/76245))
- Same idea in Phaser 2: a container holds the shadow and the character, arrow keys move the container, and a jump only moves the character up and down inside it, which avoids landing checks. (Source: [HTML5GameDevs, 2.5D beat em up jump](https://www.html5gamedevs.com/topic/22268-25d-beat-em-up-jump/))

### Inferences
- Top-down arc (derived from standard projectile math, not from a source): move the ground position in a straight line from start to target over a flight time T. With u = elapsed / T, height z = 4 * peak * u * (1 minus u). Draw the sprite at y minus z, keep the shadow at the ground position, and shrink or fade the shadow as z grows. Side-scroll uses a real 2D parabola.
- No point-and-click, so aiming is by keys: hold to show an aim arc and landing marker, direction keys to change angle and distance, release to throw. A fixed maximum range (start near 6 tiles) keeps tuning simple.
- Trigger rule for robustness: sensors and trap doors react only to the landing point (tile plus a small radius), not to a pebble passing over them. Show the landing marker while aiming so hits are predictable.
- Emit one `noise` event per landing with x, y, and loudness. Listeners subtract distance (and door loss, as in Article-Zero: 0.25 per tile, 2 for an open doorway, 6 for a closed one) and compare to a threshold.
- Optional toy for the noise system: the harmless cleaning robots could turn toward a noise. This is a mechanics idea only; whether it fits is Michael's call.
- Pebble count (suggested 5, refilled at checkpoints) and visible pebble pickups are tuning choices; Thief and Hitman both treat distraction items as limited.
- Hardcore mode hides noise rings, as Mark of the Ninja New Game Plus does.

### Gaps
- Metal Gear knocking: no retrieved source (Wikipedia's MGS article text did not cover it; Fandom blocked).
- Hitman coins specifically: only the Absolution review on thrown items was retrieved.
- Dishonored bottles: not confirmed on the fetched page.
- Thief noise arrow: not listed on the Dark Project page; Thief II was not fetched.
- Mark of the Ninja noisemaker lure rules: not described on Wikipedia.
- Tom Leonard's classic Thief sensory-system article (sound propagation through rooms): a guessed Game Developer URL returned only an index page and was not found.

## 6. Implementation in Phaser (fog, masks, lights, vignette and blur, arcs, noise events)

### Takeaway
Build the sight limit with a plain dark RenderTexture. It works in Phaser 3 and 4 and in both renderers. Use Phaser 4 Mask filters, cone lights, vignette, and blur only as WebGL polish. Do not rely on BitmapMask or `setMask` in Phaser 4.

### Cited Findings
- v4 filters: FX and masks are unified into one filter system. Every FilterList has `filters.internal` (applied before the camera transform, object-sized, cheaper) and `filters.external` (applied after, screen-sized, costlier). Cameras have filters by default; game objects need `enableFilters()`. Filters are WebGL only. Each active filter adds draw calls. (Source: [phaserjs/phaser, skills/filters-and-postfx/SKILL.md](https://github.com/phaserjs/phaser/blob/master/skills/filters-and-postfx/SKILL.md), v4.2.1; also [Phaser news, Phaser 4 filter system](https://phaser.io/news/2026/05/phaser-4-filter-system))
- v3 to v4 mapping from the same file: `preFX`/`postFX` become `filters.internal`/`filters.external`; `camera.postFX` becomes `camera.filters.internal`/`external`; `camera.setMask()` and `gameObject.setMask()` become `filters.internal.addMask()`; the old Circle FX becomes Vignette, a circular Mask, or `Phaser.Actions.AddMaskShape`. (Source: [SKILL.md](https://github.com/phaserjs/phaser/blob/master/skills/filters-and-postfx/SKILL.md))
- v4 removes BitmapMask, and GeometryMask remains only in the Canvas renderer. (Source: [Phaser 4 migration guide](https://github.com/phaserjs/phaser/blob/v4.0.0/changelog/v4/4.0/MIGRATION-GUIDE.md); [Phaser news, migrating](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know)). In the engine source, `setMask` under WebGL logs "This method is not supported in WebGL. Create a Mask filter instead." and returns without applying the mask. (Source: [phaserjs/phaser, src/gameobjects/components/Mask.js](https://github.com/phaserjs/phaser/blob/master/src/gameobjects/components/Mask.js))
- Mask filter signature: `addMask(mask, invert, viewCamera, viewTransform, scaleFactor)`. The mask is a texture key or a game object. A game object is rendered to a DynamicTexture each frame while `autoUpdate` is true; set `autoUpdate = false` and `needsUpdate = true` for one-shot updates. The mask multiplies the input's color and alpha by the mask's alpha, and `invert` swaps hidden and shown. Internal masks match the object, external masks match the camera. (Source: [phaserjs/phaser, src/filters/Mask.js](https://github.com/phaserjs/phaser/blob/master/src/filters/Mask.js))
- `Phaser.Actions.AddMaskShape(items, config)` adds a circle mask (square, rectangle, ellipse also possible) with optional blur for soft edges (`blurRadius`, `padding`) and returns an array of Mask filters. By default it fits the canvas region. The shape is reachable as `mask.maskGameObject`, so moving it each frame could make a follow-the-player circle (not tested). (Source: [phaserjs/phaser, src/actions/AddMaskShape.js](https://github.com/phaserjs/phaser/blob/master/src/actions/AddMaskShape.js))
- Vignette: `addVignette(x, y, radius, strength, color, blendMode)`, with x, y, and radius normalized 0 to 1 (defaults 0.5), and only NORMAL, ADD, MULTIPLY, and SCREEN blend modes supported. Blur: `addBlur(quality, x, y, strength, color, steps)` with quality 0 low, 1 medium, 2 high. Filter controllers keep mutable properties (for example `strength`) and have `setActive`, so they can be tweened or toggled. (Source: [src/filters/Vignette.js](https://github.com/phaserjs/phaser/blob/master/src/filters/Vignette.js) and [SKILL.md](https://github.com/phaserjs/phaser/blob/master/skills/filters-and-postfx/SKILL.md))
- Pixel-art friendly filters exist in v4: Blocky (preserves pixel-art palettes at high resolution), Pixelate, and Quantize. (Source: [Phaser news, Phaser 4 filter system](https://phaser.io/news/2026/05/phaser-4-filter-system); [SKILL.md](https://github.com/phaserjs/phaser/blob/master/skills/filters-and-postfx/SKILL.md))
- v4 lights: `this.lights.enable()`, `setAmbientColor(rgb)`, `addLight(x, y, radius, rgb, intensity, z)`, `addConeLight(x, y, radius, rgb, intensity, rotation, innerAngle, outerAngle, z)`, `removeLight`. Objects that should be lit call `setLighting(true)`. Lighting is WebGL only and has no effect in Canvas. Cone lights angles are full widths, not half angles. `maxLights` is read from the game config and cannot change at runtime; only the closest visible lights are kept, off-camera lights are culled, and lighting breaks draw batches. The doc says cone lights are cheaper than a mask approach that renders the map through extra cameras, and advises one player cone plus a few local lights. Light z defaults to radius * 0.1. (Source: [phaserjs/phaser, docs/Phaser 4 Cone Lights](https://github.com/phaserjs/phaser/blob/master/docs/Phaser%204%20Cone%20Lights/Phaser%204%20Cone%20Lights.md); [src/gameobjects/lights/LightsManager.js](https://github.com/phaserjs/phaser/blob/master/src/gameobjects/lights/LightsManager.js))
- v3 lights (Phaser 3.90 repo): environment objects use `setPipeline('Light2D')`, with `lights.enable()`, `lights.setAmbientColor(0x121118)`, and `lights.addLight(x, y, radius, color, intensity)` pools. Gotcha recorded in a code comment: lighting must be enabled before any object gets the Light2D pipeline, or the scene can render solid black. (Source: [williamchen-pm/operation-good-boi](https://github.com/williamchen-pm/operation-good-boi/blob/master/src/game/scenes/GameScene.js), src/game/scenes/GameScene.js lines 138 to 160)
- v4 RenderTexture: draw commands are buffered and `render()` must be called to see anything. `renderMode` can be 'render', 'redraw' (re-renders every frame without drawing itself), or 'all' (renders, then draws). Methods include `fill`, `clear`, `erase` (draws with an ERASE blend), `draw`, `stamp`, `capture`, `preserve`, and `callback`. In v3 draw calls ran immediately. (Source: [phaserjs/phaser, src/gameobjects/rendertexture/RenderTexture.js](https://github.com/phaserjs/phaser/blob/master/src/gameobjects/rendertexture/RenderTexture.js); [Phaser 4 migration guide](https://github.com/phaserjs/phaser/blob/v4.0.0/changelog/v4/4.0/MIGRATION-GUIDE.md))
- v4 migration items that touch overlays: `roundPixels` now defaults to false (set it explicitly for pixel art); `setTintFill` is removed; `DynamicTexture#capture` renders game objects more accurately than `draw`. (Source: [Phaser news, migrating](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know); [migration guide](https://github.com/phaserjs/phaser/blob/v4.0.0/changelog/v4/4.0/MIGRATION-GUIDE.md))
- v3 forum fog pattern: a RenderTexture sized to the map filled with black at 0.8 alpha, with a BitmapMask made from a vision image and `invertAlpha = true`. It first revealed a square because a BitmapMask uses the source image's pixel alpha; a GeometryMask circle fixed that. The poster still saw lag between character movement and mask position. (Source: [Phaser forum, Fog of war multilayer map](https://phaser.discourse.group/t/fog-of-war-multilayer-map-using-setdepth/12329)). Another thread lists camera masks, layer masks, RenderTexture plus mask, and CanvasTexture as building blocks. (Source: [Phaser forum, Fog of war with map chunks](https://phaser.discourse.group/t/fog-of-war-with-map-chunks/3668))
- v3 RenderTexture darkness in code: cyber-heist builds a full-screen RenderTexture (2x the game size, scroll factor 0, depth 900, MULTIPLY blend) and each frame fills a hidden Graphics with dark color, stamps stacked concentric circles for each light, clears the texture, and draws the Graphics into it. Lights may follow a sprite and flicker. It also exposes `isInShadow(x, y)` so AI can read the lighting. (Source: [Ryuki-XD/cyber-heist](https://github.com/Ryuki-XD/cyber-heist/blob/main/js/systems/LightingSystem.js), js/systems/LightingSystem.js, Phaser 3.90.0 from CDN)
- Event-bus gotcha: operation-good-boi uses its own small emitter for scene to UI signals because a Scene's `events` emitter is not installed until the boot pipeline runs, so listeners attached right after `new GameScene()` would attach to `undefined`. (Source: [williamchen-pm/operation-good-boi](https://github.com/williamchen-pm/operation-good-boi/blob/master/src/game/events.js), src/game/events.js)

### Inferences
- Pre-bake one soft (or dithered, to suit pixel art) radial "light" image and `erase` it into a dark RenderTexture at the player's position each frame. This is cheaper than stacking circles per frame and works on both versions. In v4 call `render()` after the draw commands, or set `renderMode` to 'all'. Not tested.
- Render the darkness texture at game resolution, not display resolution, so it matches pixel art and stays cheap.
- Overlay layer: draw lasers and cones as Graphics in a Container with `setVisible(glassesOn)` and distance-based alpha. This needs no shaders, so the core feature works without WebGL filters.
- Glasses break: tween the camera vignette `strength` and a short blur (or Pixelate) in and out over about 1 second, then remove it. Constant blur smears pixel art, so keep it a transition only.
- Version-neutral plan: write the darkness, overlay, throw arc, and noise bus without filters or `setLighting`, then add v4 filters and cone lights behind a feature check. This keeps a Phaser 3 fallback possible; the tech-foundation track owns the version choice.
- Noise bus: use `this.events` created in `create()`, or a tiny module-level emitter, to avoid the boot-order trap.

### Gaps
- Nothing was run (rule 6). All Phaser behavior comes from reading source and docs, and no frame times were measured.
- Phaser 3 `postFX.addVignette` and `addBlur` signatures were not read from v3 source; only the mapping table was used.
- Whether v3 offers cone lights was not checked. The cone-light doc is titled "Phaser 4 Cone Lights".
- Whether v3-style Light2D behaves identically under v4 `setLighting(true)` was not tested.

## 7. Open-source code studied (patterns only; nothing copied)

| Repo | License | Commit read | Phaser | Patterns learned |
| --- | --- | --- | --- | --- |
| [jarv/hex-map-demo](https://github.com/jarv/hex-map-demo) | MIT (LICENSE file, package.json) | 56683a2, 2026-09-30 | 4.2.1 | Fog as per-tile alpha states (hidden 0, seen 0.65, visited 0.8, occupied 1.0). Reveal neighbors on arrival. |
| [Ryuki-XD/cyber-heist](https://github.com/Ryuki-XD/cyber-heist) | MIT (LICENSE file) | 2b76511, 2026-09-21 | 3.90.0 (CDN) | Dark RenderTexture with MULTIPLY. Pulsing laser with toggled static body. Camera cone plus line of sight. Guard FSM. |
| [williamchen-pm/operation-good-boi](https://github.com/williamchen-pm/operation-good-boi) | MIT for code; art assets excluded | 5d98986, 2026-09-11 | ^3.90.0 | Light2D setup order. Cone polygon from wall-clipped rays. Light level sampled in JS to dim guards with a floor. |
| [luckythemonster/Article-Zero](https://github.com/luckythemonster/Article-Zero) | None found (no LICENSE file, no license field in package.json) | 44c9091, 2026-06-26 | ^4.1.0 | Room-graph sound propagation with door loss. Alert thresholds. Blind sight radius. Dim memory tiles. |
| [samblyon/mattressFactory](https://github.com/samblyon/mattressFactory) | ISC per package.json (no LICENSE file) | cdae34e, 2016-07-16 | none (canvas) | Bouncing, fading sound rays that wake monsters. |
| [phaserjs/phaser](https://github.com/phaserjs/phaser) | MIT (LICENSE.md) | 02d8931, 2026-08-21 | 4.2.1 | Source of truth for v4 filters, cone lights, Mask, RenderTexture. Sparse checkout of docs, filters, lights, render texture only. |

### Takeaway
No single repo covers everything. Together they show a simple, robust stack: tile or alpha states for memory, a dark RenderTexture for sight, small FSMs for sensors, a numeric budget for sound, and a few Phaser 4 APIs for polish. None of the Phaser repos implements true noise radius; the closest is Article-Zero's engine-level SoundField (turn-based, not tied to Phaser).

### Cited Findings
- hex-map-demo: each hex has one of three visibility states (hidden, seen, visited), drawn with fixed alphas (0, 0.65, 0.8, and 1.0 for the occupied hex). `_revealAround` marks the current hex occupied, the previous hex visited, and flips hidden neighbors to seen. The map viewport uses `createGeometryMask` through `container.setMask`, and Phaser 4's engine source says `setMask` is a no-op with a warning under WebGL, so that clip is likely ineffective on WebGL (not run). The game config uses `Phaser.AUTO`. (Source: [jarv/hex-map-demo](https://github.com/jarv/hex-map-demo), src/scenes/Game.js, src/scenes/util/Sector.js, src/scenes/util/SectorMap.js, src/main.js)
- cyber-heist: `LaserTrap` toggles on and off by cycling a timer against ON and OFF durations. Its hitbox is an invisible 4 px static arcade rectangle whose `body.enable` follows the on state, with beam and glow drawn through Graphics. `SecurityCamera` sweeps between two angles at 0.4 rad/s, tests cone membership then wall line of sight, and on alert notifies guards within 300 px. Player footsteps are audio only and carry no noise radius. (Source: [Ryuki-XD/cyber-heist](https://github.com/Ryuki-XD/cyber-heist), js/objects/GameObjects.js, js/entities/Camera.js, js/entities/Guard.js, js/entities/Player.js, js/utils/Constants.js)
- operation-good-boi: detection has two independent fail conditions: seen (inside range, inside cone via a dot product against the cosine of the half angle, and an unblocked segment) or touched. Vision cones are drawn by casting a fixed number of rays across the cone and cutting each ray at the first obstacle, then filling the polygon. Light level at a guard is estimated in plain JS as ambient plus each in-range light's falloff times intensity times brightness. That value drives sprite and cone alpha between a floor and a lit maximum. (Source: [williamchen-pm/operation-good-boi](https://github.com/williamchen-pm/operation-good-boi), src/game/detection.js and src/game/npc.js)
- Article-Zero: SoundField collects emissions with an intensity, then a breadth-first search over the room graph subtracts a penalty per doorway (open 2, closed 6, plus an airflow penalty) and 0.25 per tile of Manhattan distance, dropping anything at or below zero and giving each listener its loudest sound. AlertFSM then maps heard intensity to states. VisionCone does shadowcasting with 360 precomputed ray directions, a directional cone variant (about 70 degrees, range 6), and an always-detect proximity bubble of 2 tiles. LightField computes lit tiles from light sources using the same shadowcast and caches them until a switch toggles. The repo's own CLAUDE.md contains agent instructions (run npm scripts); these were ignored. (Source: [luckythemonster/Article-Zero](https://github.com/luckythemonster/Article-Zero), src/engine/SoundField.ts, AlertFSM.ts, VisionCone.ts, LightField.ts)
- mattressFactory: 20 fixed ray directions; a ray head advances 2 px per frame and records its path; on a wall hit the parent stops and a reflected ray spawns with the parent's age and length; after exceeding a maximum length the tail shrinks so the line fades; head color dims toward gray as age approaches a lifespan of 200; monster rays are red; a ray head touching a sleeping monster activates it. (Source: [samblyon/mattressFactory](https://github.com/samblyon/mattressFactory), js/ray.js)

### Inferences
- The `RenderTexture + erase(light image)` plan in section 6 is a simpler, cheaper version of cyber-heist's per-frame stacked circles.
- A numeric sound budget (loudness minus distance minus door loss, compared to thresholds) is simple enough for Claude to build and for Michael to tune with three numbers.
- operation-good-boi's "dim but never invisible" floors are a ready fairness rule for any overlay that depends on lighting.
- hex-map-demo's discrete visibility states suit a top-down tile level where remembered rooms should stay dimly visible.

### Gaps
- No Phaser-based repo with a true noise-radius event system was found. Article-Zero's SoundField is TypeScript engine code with no Phaser dependency and uses turns, so it needs adapting for real-time.
- Candidates seen in search but not read: theblacknight/phaser_fog_demo and andymikulski/phaser-fog-of-war (no license listed), jordy-trevor/Transplant (Phaser side-scrolling stealth horror, no license listed), CodeAndWeb/Phaser3-Lighting (license "other"). dmarron/Bat (2013, no license) was scanned and held nothing relevant.
- The Phaser 3 BitmapMask fog threads have no linked repo.

## Needs Michael or Chrome

Pages that failed or were blocked. None were worked around (no mirrors, caches, or alternate scrapers).
- hitman.fandom.com (Instinct), thelastofus.fandom.com (Listen Mode), metalgear.fandom.com (Cigarettes): WebFetch returned a client error. These would give Hitman Instinct rules, TLOU Listen Mode range and movement rules, and MGS1 smoke and goggle details.
- supercheats.com MGS1 "how to see lasers" page: client error on one try; not retried.
- store.epicgames.com Darkwood news article: client error.
- giantbomb.com "Abilitease" concept page: client error.
- gdcvault.com Eric Martel talk: only the abstract is public; the full talk is members-only.
- Wikipedia "Stifled (video game)": URL not found. No Stifled source exists in these notes.
- gamedeveloper.com Tom Leonard Thief sensory article: the URL I tried returned only the Design index page. A person with a browser could find the real article (sound propagation through rooms and awareness levels in Thief).
- Not searched because the WebSearch budget ended: Ori ability loss, Splinter Cell goggles and noise meter, Deus Ex Smart Vision, Metal Gear knocking, Hitman coins, Dishonored bottles, Thief noise arrows, Among Us and Don't Starve numbers, Teleglitch lighting, Darkwood developer commentary.
