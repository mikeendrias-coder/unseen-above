# Sorting and catching packets: precedents, controls, identity, pacing, failure, and Phaser build (satellite puzzle batch 2)

Scope note: mechanics only. No story, lore, or art direction is decided here. Phaser APIs below were confirmed against the official Phaser 4.2.1 package docs unless marked otherwise. Four repos were cloned shallow into /home/claude/repos/sorting_puzzles/ and only read (never run or built): mdr, Apple-Catcher, beltline-panic, FallingSand.

## 1. Which precedents are strongest for "catch or sort the right packets into the right buckets"?

### Takeaway
Kaboom!, Flight Control, Papers, Please, and Severance's MDR (as depicted) fit best: each reduces play to one repeated decision, a visible meter, and rising pressure. Sugar, Sugar, Where's My Water?, and Peggle are charming but depend on physics.

### Cited Findings

**Kaboom! (Activision, Atari 2600, July 1981)**
- Paddle controller: turning the dial moves the water buckets left or right. Difficulty switches can halve bucket width. Source: [Wikipedia](https://en.wikipedia.org/wiki/Kaboom%21_%28video_game%29)
- The player starts with three buckets. A missed bomb makes every other bomb on screen explode and costs one bucket. A lost bucket is regained at 1,000 points. Bombs drop faster as the player catches them (the source gives no numbers). Source: [Wikipedia](https://en.wikipedia.org/wiki/Kaboom%21_%28video_game%29)
- Larry Kaplan designed and programmed it, David Crane did graphics, and it is based on the 1978 arcade game Avalanche. The Mad Bomber's expression changes with player performance. One reviewer called it a test of "reflexes, not thought." Source: [Wikipedia](https://en.wikipedia.org/wiki/Kaboom%21_%28video_game%29)

**Flight Control (Firemint, iOS, March 5, 2009)**
- The player draws paths to guide aircraft. Large red jets go to the large runway, small yellow planes to the small runway, blue helicopters to the helipad. Each landing scores 1 point. Any collision ends the round. More aircraft appear as the score rises. Source: [Wikipedia](https://en.wikipedia.org/wiki/Flight_Control)
- IGN and Pocket Gamer each gave 8/10, and Pocket Gamer stressed simplicity and addictiveness. It sold over 3.8 million copies. Source: [Wikipedia](https://en.wikipedia.org/wiki/Flight_Control)
- Firemint's community manager said the simple rules let almost anyone pick it up ("her mum loves it"), that it "starts off quite calmly but it can quickly get chaotic," and that founder Rob Murray liked the line-drawing mechanic. The interview does not explain how plane counts were chosen and describes no formal playtesting. Source: [Nintendo Life interview](https://www.nintendolife.com/news/2010/02/interviews_firemint_flight_control)

**Sugar, Sugar (Bart Bonte)**
- The player draws lines to steer falling sugar into mugs. Color filters force separate channels for differently colored mugs. Later puzzles invert gravity. The mobile port (October 2012) has 35 new levels plus a sandbox mode. Source: [Pocket Gamer](https://www.pocketgamer.com/sugar-sugar/bart-bonte-brings-a-taste-of-flash-to-ios-and-android-with-sugar-sugar/)
- The browser version says "Mouse click or tap to draw a line." Each line acts as a barrier. Source: [Poki](https://poki.com/en/g/sugar-sugar)
- A fan remake in MakeCode Arcade drew sugar as pixels from arrays (no sprites). It ran about 24 fps with roughly 300 grains on a PyGamer, and about 5,000 grains was the author's ceiling on a PC. Cups, color changers, and walls were separate background colors. Player lines did not yet displace sugar, which the author called difficult and costly. Source: [MakeCode forum](https://forum.makecode.com/t/sugar-sugar-arcade-remake/19192)

**Severance macrodata refinement (MDR), as depicted and as recreated**
- Fan wiki description of the show: each file is a field of digits 0 to 9. A trackball selects a group, which is dropped into one of five numbered buckets (01 to 05). Each bucket holds some of each of the four Tempers (WO, FR, DR, MA). A number may jiggle as a clue. Completion milestones at 10, 25, 75, and 100 percent bring small rewards. A line attributed to the episode "Half Loop" says only about one in five files is completed before it expires. This is one fan-wiki source and is not independently verified. Source: [severance.wiki](https://severance.wiki/mdr)
- Wikipedia: Helly reaching 100 percent on her file meets MDR's quarterly quota. Rewards include a "waffle party" and a "Music Dance Experience." Prop designers rebuilt old computers with working trackballs, terminals are modeled on 1970s Data General Dasher units, and the computers have no escape key. The article does not say how the numbers screen was made. Source: [Wikipedia](https://en.wikipedia.org/wiki/Severance_%28TV_series%29)
- Nerdist: refiners sort number clusters into "digital buckets"; clusters tie to the Four Tempers. It does not describe the on-screen task in detail. Source: [Nerdist](https://nerdist.com/article/severance-finally-explained-macrodata-refinement-what-the-numbers-mean/)
- Official browser game (reported by a news site, not verified at Apple): runs in browsers on PC and mobile. The player picks numbers that rise over time and drops them into boxes. A performance panel shows progress, and at 75 percent a character invites the player to a dance party. The article cites GameSpot saying it takes no more than 5 minutes. No points system is described, and controls are not described. Source: [ITC.ua](https://itc.ua/en/news/the-severance-series-launched-a-game-with-macro-data-processing-in-the-browser-welcome-to-lumon-industries/)
- Fan game by devwithlex (Godot, HTML5, free, in development): a magnifier enlarges numbers under the cursor, arrow keys pan, plus and minus zoom. The player click-drags around a cluster's perimeter (too small or too large does not register), then picks one of five bins with the cursor or keys 1 to 5. The set flies into the bin. Invalid tries show "nope." There is a high-contrast option and no clear progress bar. Source code is not public and no license is stated. Source: [itch.io](https://devwithlex.itch.io/macrodata-refinement)
- Fan game henryhale/mdr (MIT, vanilla TypeScript) is explicitly pattern-based (math patterns), not emotion-based. Incorrect selections carry no penalty, and play continues until progress reaches 100 percent. Desktop only. Source: [GitHub](https://github.com/henryhale/mdr)

**Papers, Please (Lucas Pope, 2013)**
- Each in-game day runs against a real-time limit. The player earns money per correctly processed entrant, receives citations for mistakes, sets an end-of-day budget (rent, food, heat), and the game ends on debt. New rules arrive as the days progress. Source: [Wikipedia](https://en.wikipedia.org/wiki/Papers%2C_Please)
- Pope was drawn to inspectors doing "a specific thing" over and over. A critic found it "tedious." He added an endless mode limited only by the player's error count, and the "clunky" interface was a deliberate choice influenced by HyperCard. Source: [Wikipedia](https://en.wikipedia.org/wiki/Papers%2C_Please)
- Citations: the first two each day are free warnings. The third and fourth cost 5 credits each, and each later one adds 5 more. A citation also forfeits the usual 5 credits for that entrant. It arrives about 3 seconds after the entrant leaves. Citations alone never end the game; only unpayable debt does. Source: [Papers, Please wiki (Fandom)](https://papersplease.fandom.com/wiki/Citation)

**Shapez filters**
- Shapez 2's Belt Filter has one belt input, two belt outputs, and a wire input. A shape signal sends matching shapes straight through and non-matching shapes to the side. A color signal diverts all shapes. A null or conflicting signal blocks the belt. Source: [shapez 2 wiki](https://shapez2.wiki.gg/wiki/Belt_Filter)

**Where's My Water? (Disney, 2011)**
- The player digs dirt by touch. Water is simulated as many drops. A level needs a minimum amount of water in the tub. The level is lost if the water drains away or poison reaches the inlet, and lost levels restart automatically. Three optional ducks per level add score. Later chapters add fans and vacuums that move water, and valves that redirect fluids. It launched with four 20-level chapters. Source: [Wikipedia](https://en.wikipedia.org/wiki/Where%27s_My_Water%3F)

**Peggle (PopCap)**
- A "ball catcher" moves back and forth along the bottom in a fixed pattern. Landing a ball in it earns an extra ball. Each level has 10 balls and 25 orange pegs to clear. Reviewers described "a constant series of rewards," and the endgame turns the floor into point bins ("Extreme Fever"). Source: [Wikipedia](https://en.wikipedia.org/wiki/Peggle)
- Design note: early prototypes with rapid fire and moving targets felt too fast or too demanding, so the team switched to a static peg field with a random subset of orange pegs to make ball paths more predictable. Source: [Wikipedia](https://en.wikipedia.org/wiki/Peggle)
- Phaser's own v4.1.0 Matter example is a pachinko board with a sensor bucket that slides back and forth along the bottom (moved with `this.tweens.add`) and scores 100 per ball caught. Source: [Phaser example](https://phaser.io/oss/examples/v4.1.0/physics/matterjs/view/pachinko.md)

**Other strong precedents found**
- Donut County: the player moves a hole that grows as it swallows objects; a level ends when everything is swallowed; described as a "reverse Katamari." Source: [Wikipedia](https://en.wikipedia.org/wiki/Donut_County)
- Slime Rancher's Vacpack: holds a limited number of items and item types, and the player must unload before collecting more. Source: [Wikipedia](https://en.wikipedia.org/wiki/Slime_Rancher)
- Human Resource Machine: boxes move from an inbox conveyor to an outbox. The program runs at adjustable speed and can be paused or stepped. An unexpected box in the outbox stops it. Size and speed challenges are optional. Source: [Wikipedia](https://en.wikipedia.org/wiki/Human_Resource_Machine)
- Orwell: the player files "datachunks" from a subject's records into a profile, can tag items, and in one episode may upload only 20 chunks. Consequences are narrative (not studied here). Source: [Wikipedia](https://en.wikipedia.org/wiki/Orwell_%28video_game%29)

### Inferences
- The four best fits share a loop: perceive one item, make one decision, see a meter move. None needs a physics engine for the decision itself.
- There are two pressure sources. Kaboom! and Flight Control use external pace (speed, plane count). MDR uses internal pace (a quota and an expiring file). Papers, Please uses both (shift timer plus fines).
- Physics games gain charm from emergent behavior and lose predictability. Peggle's team moved toward predictability on purpose, which supports keeping the sorting decision deterministic.
- "Vacuum" has precedent as a bin skin (Slime Rancher capacity, Where's My Water? vacuums, Donut County hole). A vacuum can be the same mechanic as a bucket with a pull animation, with an optional capacity limit.

### Gaps
- No developer postmortem or talk was found for Sugar, Sugar, Kaboom!'s exact tuning, or Flight Control's spawn tuning. The Firemint interview does not give numbers.
- Shapez 1's Filter (the browser game) was not fetched. Only the Shapez 2 page was used.
- Peggle was covered through Wikipedia only. The brief's "Free Ball bucket" wording is a fan name; Wikipedia calls it the "ball catcher."
- No source found on how the MDR numbers screen was made on set (Apple newsroom and Wikipedia pages do not address it).
- The Frolic abbreviation is given as FR on the fan wiki summary and FC on the itch page. Not resolved.
- Other fan MDR games appeared in search results but were not opened: [Break Time](https://rebeccamwrites.itch.io/break-time), [Work Simulator 2089](https://ephemerald.itch.io/work-simulator-2089), [number-sense listing](https://awesome.ecosyste.ms/projects/github.com%2Fjeffasante%2Fnumber-sense).

## 2. Control schemes: which suits non-gamers best?

### Takeaway
One tap, click, or key per decision on a large fixed target is the lowest-risk scheme. Pointer-follow on one axis (Kaboom!) is next. Aimed or held suction is the riskiest.

### Cited Findings
- Kaboom! uses one dial for left-right movement only. Source: [Wikipedia](https://en.wikipedia.org/wiki/Kaboom%21_%28video_game%29)
- Flight Control uses one finger or stylus to draw a path. Firemint credits the simple rules for broad appeal. Source: [Nintendo Life interview](https://www.nintendolife.com/news/2010/02/interviews_firemint_flight_control)
- Sugar, Sugar uses click or tap to draw. Source: [Poki](https://poki.com/en/g/sugar-sugar)
- Apple-Catcher is keyboard arrows only. A Phaser tutorial teaser describes the same arrow-key basket. Source: [Apple-Catcher](https://github.com/Dragon2000v/Apple-Catcher); [Phaser news](https://phaser.io/news/2025/06/catch-the-falling-fruits-game)
- Beltline Panic uses arrow keys or touch for move and Space or touch for interact, and its design doc limits the whole game to five inputs. Source: [beltline-panic](https://github.com/S3-D1/beltline-panic)
- The devwithlex MDR clone needs click-drag around a cluster perimeter, and players report too-small or too-large selections fail. The henryhale clone instead selects a whole cluster with one click. Source: [itch.io](https://devwithlex.itch.io/macrodata-refinement); [henryhale/mdr](https://github.com/henryhale/mdr)
- Slime Rancher's vacuum has a capacity limit and needs unloading. Where's My Water? uses valves that redirect fluids; Shapez uses signal-driven filters. Source: [Slime Rancher](https://en.wikipedia.org/wiki/Slime_Rancher); [Where's My Water?](https://en.wikipedia.org/wiki/Where%27s_My_Water%3F); [shapez 2 wiki](https://shapez2.wiki.gg/wiki/Belt_Filter)
- Game Accessibility Guidelines (full list; level in parentheses). Motor: "Ensure controls are as simple as possible, or provide a simpler alternative" (Basic). "Ensure interactive elements / virtual controls are large and well spaced, particularly on small or touch screens" (Basic). "Include an option to adjust the game speed" (Basic). "Avoid repeated inputs" (Intermediate). "Avoid / provide alternatives to requiring buttons to be held down" (Intermediate). "Make interactive elements that require accuracy ... stationary" (Intermediate). Multiple simultaneous actions such as click and drag should not be required (Intermediate, shortened in my extraction). "Support more than one input device" (Intermediate). "Do not make precise timing essential to gameplay" (Advanced). General: "Include assist modes" (Intermediate). Source: [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)
- Phaser input: one `Pointer` covers mouse and touch. Scene-level `pointermove` and `pointerdown` fire anywhere on the canvas. `setInteractive()` accepts a custom hit area, so a small sprite can have a large target. Drag thresholds can delay drag starts on touch. `input.keyboard.addCapture()` stops arrow keys from scrolling the page. Source: [Phaser input docs](https://unpkg.com/phaser@4.2.1/skills/input-keyboard-mouse-touch/SKILL.md)

### Inferences
- Ranking from the evidence, easiest first: (1) one tap or arrow key per packet at a junction, (2) pointer-follow bucket on one axis, (3) drag and drop, (4) aim and hold a vacuum. Drag is natural on touch (Flight Control) but the accessibility list flags simultaneous actions, so offer a click-to-send alternative.
- A vacuum should be a toggle with a generous snap radius, not hold-to-suck, because the guidelines flag held inputs. Capacity limits add decisions but also state to remember.
- Toggled gates or filters add hidden state the player must track. I found no non-gamer evidence for or against them, so they suit later rounds, not the first one.
- Offering both pointer and keyboard is cheap in Phaser and matches the "more than one input device" guideline.

### Gaps
- No playtest data on non-gamers exists in the sources. The closest evidence is Firemint's remark (one anecdote) and the accessibility guidelines.
- The accessibility guideline wording and levels come from a summarized extraction of the full-list page. Verify exact titles on the page before quoting them in a final deliverable.
- Touch-device support for the final game is not specified in the brief. The control ranking assumes mouse and keyboard first.

## 3. Packet identity and accessibility (never color alone)

### Takeaway
Encode every packet with at least three channels (silhouette, color, short glyph or label) and repeat the same encoding on the bin and on a rule card. The accessibility guidelines make "no essential information by fixed color alone" a Basic-level requirement.

### Cited Findings
- "Ensure no essential information is conveyed by a fixed colour alone" is a Vision, Basic item. "Provide high contrast between text/UI and background" is Vision, Basic. "Ensure no essential information is conveyed by sounds alone" is Hearing, Basic. "Provide separate volume controls or mutes for effects, speech and background / music" is Hearing, Basic. "Avoid flickering images and repetitive patterns" is Cognitive, Basic. "Ensure no essential information (especially instructions) is conveyed by text alone, reinforce with visuals and/or speech" is Cognitive, Intermediate. "Provide an option to turn off / hide background movement" is Cognitive, Intermediate. Sounds for key objects and events should be distinct from each other (Intermediate). Source: [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)
- Flight Control's destinations differ by both color and size or type (red large jets, yellow small planes, blue helicopters). Source: [Wikipedia](https://en.wikipedia.org/wiki/Flight_Control)
- Shapez 2's filter keys on a shape signal, and a color signal alone diverts everything, so shape carries identity there. Source: [shapez 2 wiki](https://shapez2.wiki.gg/wiki/Belt_Filter)
- Papers, Please pairs item checks with a rulebook that changes daily, so the rule is visible and the player checks items against it. Source: [Wikipedia](https://en.wikipedia.org/wiki/Papers%2C_Please)
- MDR's categories are recognized by feel, not by an explicit rule, and the fan game lists high contrast as its accessibility option. Source: [severance.wiki](https://severance.wiki/mdr); [itch.io](https://devwithlex.itch.io/macrodata-refinement)
- henryhale/mdr's own roadmap lists "Accessibility improvements" as not yet done. Source: [henryhale/mdr](https://github.com/henryhale/mdr)

### Inferences
- Use a small fixed vocabulary per round (about 3 to 4 kinds). Each kind gets a distinct silhouette, a distinct color, and a one-letter or symbol glyph. Bins and the rule card show the same three channels.
- Keep the kind table in editable data (`shape`, `color`, `glyph`, `bin`) so Michael can change labels without touching code.
- Add redundant feedback for right and wrong sorts (sound plus a visual flash), with separate volume controls.
- Avoid flashing for error feedback (photosensitivity guideline). A short tint change is enough.

### Gaps
- I did not research palette choices for color-vision deficiency. Silhouette and glyph redundancy sidesteps this, but a simulated check of the final palette is still advisable.
- Pixel-scale legibility of glyphs (minimum sprite size) was not researched. It belongs to the aesthetics tracks.

## 4. Pacing: making sorting feel like monotonous work while staying fun

### Takeaway
The recurring recipe is a repeated single decision, an always-visible progress meter with milestone beats, and an imposed schedule (shift timer, expiring file, quota). Keep each round short and change one rule per round, because Papers, Please shows monotony tips into tedium for some players.

### Cited Findings
- Papers, Please: a real-time day limit, money per correct entrant, end-of-day budget, and rules that grow harder over time. A critic found it "tedious," and Pope added an endless mode for players less interested in narrative. Source: [Wikipedia](https://en.wikipedia.org/wiki/Papers%2C_Please)
- MDR as depicted: progress is tracked per file with rewards at 10, 25, 75, and 100 percent, and completing a file meets a quota. Files expire, with only about one in five completed (fan wiki, single source). Source: [severance.wiki](https://severance.wiki/mdr); [Wikipedia](https://en.wikipedia.org/wiki/Severance_%28TV_series%29)
- MDR set design is deliberately clerical: working trackballs, 1970s-style terminals, and no escape key. Source: [Wikipedia](https://en.wikipedia.org/wiki/Severance_%28TV_series%29)
- The official browser MDR game shows a performance panel, triggers a reward at 75 percent, and reportedly takes no more than 5 minutes. Source: [ITC.ua](https://itc.ua/en/news/the-severance-series-launched-a-game-with-macro-data-processing-in-the-browser-welcome-to-lumon-industries/)
- Apple-Catcher pairs a timer with a target score (defaults in code: 30 seconds and 10 points). Source: [Apple-Catcher](https://github.com/Dragon2000v/Apple-Catcher)
- Beltline Panic's balance file names a "target panic time" of 75 seconds and uses a warm-up where spawn gaps are tripled for the first 15 seconds and ease back to normal by 45 seconds. Source: [beltline-panic](https://github.com/S3-D1/beltline-panic)
- Kaboom! restores a lost bucket at 1,000 points, giving a mid-run reward. Peggle reviewers described "a constant series of rewards." Source: [Kaboom!](https://en.wikipedia.org/wiki/Kaboom%21_%28video_game%29); [Peggle](https://en.wikipedia.org/wiki/Peggle)
- Human Resource Machine frames abstract sorting as office work and offers optional size and speed challenges for replay. Source: [Wikipedia](https://en.wikipedia.org/wiki/Human_Resource_Machine)
- Orwell caps uploads (20 datachunks in one episode), a quota-like limit on how much filing the player can do. Source: [Wikipedia](https://en.wikipedia.org/wiki/Orwell_%28video_game%29)

### Inferences
- Work-feel comes from mechanics and UI, with no story required: a shift timer, a quota meter with milestone beats (for example at 25, 50, 75, 100 percent), a rule card, and plain clerical HUD elements.
- Rounds of roughly 45 to 90 seconds, three per batch, fit the evidence (30 seconds in Apple-Catcher, under 5 minutes total for the official MDR game). These are starting values to tune by play, not sourced targets.
- Vary one thing per round (add a bin, swap a rule, add a bonus bin) so repetition stays readable without feeling identical.
- Record each decision (kind, bin, correct or not, time) in a plain array. Any later screen or system Michael chooses can read it. This is a neutral technique, not a story decision.

### Gaps
- Papers, Please shift length in minutes was not found.
- No source states quota values for any game here (Severance gives milestones, not counts).
- Whether the pacing "feels" right cannot be judged by reading. Someone should play the official MDR game and the devwithlex build (see Needs Michael or Chrome).

## 5. Failure and difficulty: wrong catches, ramps, and speed curves

### Takeaway
Graded, cheap failure beats instant game over for this audience: free warnings then rising fines (Papers, Please), or no penalty at all (henryhale/mdr). Ramp by speed, spawn rate, number of kinds, and rule swaps, with a warm-up at the start (Beltline Panic).

### Cited Findings
- Kaboom!: a miss costs a bucket and clears all bombs on screen; bombs speed up with each catch; the lost bucket returns at 1,000 points. Source: [Wikipedia](https://en.wikipedia.org/wiki/Kaboom%21_%28video_game%29)
- Flight Control: any collision ends the round; difficulty rises as more aircraft appear with score. Source: [Wikipedia](https://en.wikipedia.org/wiki/Flight_Control)
- Papers, Please: two free citations a day, then fines of 5, 5, 10, 15, 20, 25, and so on; citations alone never end the game; debt does. The endless mode is limited only by error count. Source: [Fandom wiki](https://papersplease.fandom.com/wiki/Citation); [Wikipedia](https://en.wikipedia.org/wiki/Papers%2C_Please)
- Where's My Water?: failure triggers an automatic restart; ducks and speed are optional score extras; new mechanics arrive per chapter (fans, vacuums, valves, steam). Source: [Wikipedia](https://en.wikipedia.org/wiki/Where%27s_My_Water%3F)
- Peggle: a fixed ball budget (10) with a restart on failure; prototypes with moving targets were too demanding and were replaced by a static field. Source: [Wikipedia](https://en.wikipedia.org/wiki/Peggle)
- henryhale/mdr: wrong clicks only play an error sound ("losing is no option, play until it's a win," in a code comment). The devwithlex build shows "nope" for invalid selections. Source: [henryhale/mdr](https://github.com/henryhale/mdr); [itch.io](https://devwithlex.itch.io/macrodata-refinement)
- Apple-Catcher: fall speed rises by a fixed step on every catch (starting at 300 pixels per second, step of 50). A miss subtracts 1 point, never below zero. Source: [Apple-Catcher](https://github.com/Dragon2000v/Apple-Catcher)
- Beltline Panic (config values): belt speed factor grows from 1.0 toward 2.8 over 75 seconds along a power curve (exponent 1.6). Spawn gap shrinks from 1,450 ms toward 420 ms (hard floor 280 ms) with random jitter between 0.75 and 1.35 times. Past the 75-second mark, speed keeps growing. The fail state is a backed-up queue: unprocessed items keep looping and the entry lane fills. Source: [beltline-panic](https://github.com/S3-D1/beltline-panic)
- Human Resource Machine: speed is adjustable, and extra challenges are optional. Source: [Wikipedia](https://en.wikipedia.org/wiki/Human_Resource_Machine)
- Accessibility list: "Offer a wide choice of difficulty levels" (Basic), "Allow difficulty level to be altered during gameplay" (Intermediate), "Include a means of practicing without failure, such as a practice level or sandbox mode" (Cognitive, Intermediate), "Include an option to adjust the game speed" (Basic). Source: [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)
- Phaser has a global tween time scale (`this.tweens.setGlobalTimeScale`) that can serve as a game-speed slider for tween-driven motion. Source: [Phaser tweens docs](https://unpkg.com/phaser@4.2.1/skills/tweens/SKILL.md)

### Inferences
- A soft model fits non-gamers: errors reduce a quota or efficiency meter, a few errors are free, and a failed round retries only that round (not the whole batch).
- Queue overflow is the clearest fail state for a junction design, and it needs no extra rule: leave wrong or late packets unprocessed and the queue fills.
- Ramp one lever per round. Suggested starting ramp: sparse spawns for the first 15 seconds, then speed from 1x toward about 2x over a round. Beltline Panic's 2.8x over 75 seconds is a ceiling reference, not a target. All numbers need play-tuning.
- Put all ramp values in one config object (Beltline Panic does this) so Michael or Claude can retune without code edits.
- A speed slider plus a practice round with no failure cover three accessibility items at once.

### Gaps
- Kaboom! and Flight Control speed curves are not in any source found.
- Beltline Panic's tuning is for a different genre (endless survival). It is a pattern for structuring a ramp, not proof the values suit a 60-second sorting round.

## 6. Build approach in Phaser: real-time physics vs lane/conveyor vs turn-based; Arcade vs Matter vs none; pooling; particles

### Takeaway
Recommended: a lane/conveyor design driven by plain position updates (or tweens) with no physics engine for the core, a speed scalar for ramps and a slow assist, Group pooling, and one shared particle emitter. Keep Matter for an optional Sugar, Sugar style round only.

### Cited Findings
**Physics choice**
- Phaser's docs call Arcade "lightweight" (rectangles and circles, fast and easy) and suited to arcade, retro, and puzzle games. Matter is a bundled third-party engine for complex shapes, constraints, and joints. The two cannot collide with each other. Source: [Phaser physics concept](https://docs.phaser.io/phaser/concepts/physics)
- Arcade: use `physics.add.overlap` for catch detection (no separation) and `collider` for bounce or landing. Hitboxes use `body.setSize`, `body.setOffset`, or `body.setCircle`. Static groups need `refreshBody()` after moves. Events need the body flags `onOverlap`, `onCollide`, or `onWorldBounds`. The RTree index may get costly above roughly 5,000 dynamic bodies. The doc does not cover tunneling. Source: [Phaser Arcade docs](https://unpkg.com/phaser@4.2.1/skills/physics-arcade/SKILL.md)
- Matter: sensors via `isSensor` or `setSensor(true)` but they "still need matching collision filters to fire events." Events: `collisionstart` on the world, `setOnCollideWith` per body. Collision categories via `this.matter.world.nextCategory()`, maximum 32. Force values are tiny, velocity is per step, and positions are centers. `set60Hz()` gives a stable timestep. The doc does not address tunneling, and it advises verifying in testing. Source: [Phaser Matter docs](https://unpkg.com/phaser@4.2.1/skills/physics-matter/SKILL.md)
- Official v4.1.0 Matter example: a pachinko board with a sensor bucket moved by a tween, using collision categories and `setOnCollideWith`. Source: [Phaser example](https://phaser.io/oss/examples/v4.1.0/physics/matterjs/view/pachinko.md)
- Beltline Panic's contributor guide says not to use physics-based conveyor logic and to prefer simple, explicit, state-driven systems. Its items follow progress along a waypoint path, and collisions are plain distance checks. Source: [beltline-panic](https://github.com/S3-D1/beltline-panic)
- Pixel-art sand alternative: store grains in a grid or array, give each grain an ordered list of preferred moves, and step them each frame (see section 7). The MakeCode remake reports about 300 grains at 24 fps on hardware and about 5,000 on a PC. Source: [MakeCode forum](https://forum.makecode.com/t/sugar-sugar-arcade-remake/19192)

**Pooling**
- Groups: `this.add.group({ classType, maxSize })`, `createMultiple`, `get(x, y, key)` (returns an inactive member or creates one), `killAndHide(obj)` (sets `active` and `visible` false), `isFull()`, `getTotalFree()`, `countActive()`. `kill` alone leaves the object visible. Source: [Phaser Groups docs](https://unpkg.com/phaser@4.2.1/skills/groups-and-containers/SKILL.md); [Phaser group concept page](https://phaser.io/oss/docs/phaser/concepts/gameobjects/group.md)
- The official v4.1.0 sprite pool example uses `maxSize: 100`, calls `get(x, y)` on a timer, returns early when `get` yields nothing (pool full), and recycles sprites that pass y = 600 with `killAndHide`. Source: [Phaser example](https://phaser.io/oss/examples/v4.1.0/game%20objects/group/view/sprite-pool)
- Whether `killAndHide` also disables an Arcade body is not stated in the Groups doc. The Arcade doc says `disableBody(true, true)` disables the body and hides the object, and `enableBody(true, x, y, true, true)` reuses it. Source: [Groups docs](https://unpkg.com/phaser@4.2.1/skills/groups-and-containers/SKILL.md); [Arcade docs](https://unpkg.com/phaser@4.2.1/skills/physics-arcade/SKILL.md)

**Particles**
- `this.add.particles(x, y, texture, config)` returns a `ParticleEmitter` directly (the older manager was removed in v3.60). One-shot bursts use `emitting: false` then `explode(count, x, y)` or `emitParticleAt`. Particles are pooled internally. `maxAliveParticles` caps live particles and `reserve(count)` preallocates. `startFollow(target)` follows an object. Source: [Phaser particles docs](https://unpkg.com/phaser@4.2.1/skills/particles/SKILL.md)
- Apple-Catcher uses the same shape: an emitter created with `emitting: false`, following the basket, started on each catch. Source: [Apple-Catcher](https://github.com/Dragon2000v/Apple-Catcher)

**Tweens and time**
- `this.tweens.add` with `targets`, `duration`, `ease`, `yoyo`, `repeat: -1`; `this.tweens.chain` for sequences; `tween.setTimeScale`; `this.tweens.setGlobalTimeScale` and `pauseAll`; `this.tweens.killTweensOf(target)`. `onComplete` never fires for infinite loops. Source: [Phaser tweens docs](https://unpkg.com/phaser@4.2.1/skills/tweens/SKILL.md)

**Config and Phaser 3 vs 4 differences actually confirmed**
- `pixelArt: true` sets `antialias: false`, `antialiasGL: false`, and `roundPixels: true`. `roundPixels` alone defaults to false. Scale modes include `Phaser.Scale.FIT` with `autoCenter`. In v4 the default size changed from 800x600 to 1024x768, and `smoothPixelArt` is new. Source: [Phaser config docs](https://unpkg.com/phaser@4.2.1/skills/game-setup-and-config/SKILL.md)
- Official migration guide: `roundPixels` now defaults to false (it was true in v3). `setTintFill()` is removed; use `setTint()` with `setTintMode()`. DynamicTexture and RenderTexture draw commands need `render()`. The Canvas renderer is deprecated. The pipeline system became RenderNodes. `Geom.Point` is removed. Source: [Migration guide](https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md)
- The migration guide does not mention Arcade Physics, Matter, Groups, ParticleEmitter, Tweens, or Input pointers. "Not mentioned" is not proof they are unchanged, but the v4.1.0 official examples for Matter and sprite pools suggest those APIs work in v4. Source: [Migration guide](https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md); [Phaser example](https://phaser.io/oss/examples/v4.1.0/physics/matterjs/view/pachinko.md)
- Open-source examples read here use Phaser 3 (Apple-Catcher `^3.80.1`, Beltline Panic `^3.90.0`). The Phaser 4.2.1 npm package ships a `skills/` folder of 28 topic docs (physics-arcade, physics-matter, particles, tweens, groups-and-containers, input, scenes, and others) that are useful reference for building. Source: [package listing](https://app.unpkg.com/phaser@4.2.1/files/skills)

### Inferences
| Approach | Precedents | For | Against | Verdict |
| --- | --- | --- | --- | --- |
| Real-time physics | Sugar, Sugar; Where's My Water?; Peggle; Donut County | Charm, emergent motion | Outcomes vary, solvability and difficulty hard to guarantee, Matter gotchas (tiny forces, tunneling untested in docs) | One optional special round at most |
| Lane or conveyor | Kaboom!; Flight Control; Beltline Panic; Papers, Please queue; Shapez | Deterministic, testable, one speed knob, easy to read | Less emergent | Primary |
| Turn-based or self-paced | MDR; Human Resource Machine | No reflex demand, pressure from quota alone | Can feel like a worksheet, less "catching" | Use as a slow or pause assist |

- A hybrid fits the evidence: real-time lanes, with a speed slider and pause so the game can be played nearly self-paced, as MDR is.
- For lane motion, manual position updates (`y += speed * delta`) make a single `gameSpeed` multiplier trivial. Tweens also work (`setGlobalTimeScale`), but tweens on pooled objects need `killTweensOf` before recycling. That caution is my inference from the doc's silence on recycled targets.
- With under about 50 live packets, pooling is a convenience, not a necessity. It is still cheap with Groups and avoids garbage-collection hiccups.
- If Arcade bodies are used for any optional catch round, pair `killAndHide` with `disableBody(true, true)` to avoid phantom overlaps. That pairing is my inference from the two docs.
- Use Arcade only where overlap detection earns its keep (a Kaboom!-style round). A junction design needs no collision at all: sending a packet is a short tween to the bin.
- A pixel-native falling-sand grid is a plausible way to get Sugar, Sugar behavior without Matter, but it is custom code with its own performance ceiling. Treat it as a stretch idea, not a baseline.
- Version: patterns above are expected to carry over from Phaser 3 to 4, but the tech-foundation track should confirm with a short spike (the guide is silent on these systems).

### Gaps
- Tunneling behavior for fast Arcade or Matter bodies is not documented in the Phaser docs fetched. It would need a test.
- Whether Phaser 4 changed Arcade, Matter, Group, particle, or tween behavior is not stated anywhere I could read. Only the migration guide and skill docs were available.
- The Phaser concept page on physics does not name specific API calls. The API names above come from the skill docs shipped in the npm package, which are official but written in a condensed Q and A style with some hedged statements.
- I did not benchmark anything. All performance numbers are from sources or are marked as inference.

## 7. What the open-source code teaches (read only, never run)

### Takeaway
Four repos were read. The most useful patterns: cluster-id selection (mdr), one trimmed hitbox plus emitter burst (Apple-Catcher), path-progress items with a centralized balance config (beltline-panic), and a cautionary naive particle scan (FallingSand).

### Cited Findings
**henryhale/mdr**: [repo](https://github.com/henryhale/mdr). License: MIT (LICENSE.txt, copyright 2025 Henry Hale). Vanilla TypeScript, Tailwind, Vite; no runtime dependencies; not Phaser. Files read: README, model/index.ts, view/index.ts, model/levels.ts.
- Pattern: a model and view split with callbacks. The view builds a grid of table cells and puts each cell's cluster id in a data attribute. A click sends that id to the model, which clears the whole cluster from whichever layer owns it. One click selects a whole cluster. Source: [henryhale/mdr code](https://github.com/henryhale/mdr)
- Pattern: layers stack like transparent cards, with top layers visible first. Clearing a cluster reveals the layer beneath or refills with random digits. Source: [henryhale/mdr code](https://github.com/henryhale/mdr)
- Pattern: progress is the average of per-layer scores, shown as one percentage plus four bin bars. Win at 100 percent. Wrong clicks play an error sound and nothing else. Source: [henryhale/mdr code](https://github.com/henryhale/mdr)
- Pattern: hovering enlarges cells near the cursor in distance rings (double size within one step, 1.5x two steps out) and dims the rest. Each cell also drifts along a random CSS animation axis and duration, which gives the field its restless look. Source: [henryhale/mdr code](https://github.com/henryhale/mdr)
- Levels are plain data: rows, columns, pattern types per layer, number of locations. Source: [henryhale/mdr code](https://github.com/henryhale/mdr)

**Dragon2000v/Apple-Catcher**: [repo](https://github.com/Dragon2000v/Apple-Catcher). License: README says MIT and refers to a LICENSE file, but no LICENSE file exists and package.json has no license field. Treat the license as unverified. Phaser `^3.80.1`, Vite, Arcade physics. Files read: main.js, package.json, README.
- Pattern: one falling target is recycled to the top on both catch and miss, rather than pooling many. Source: [Dragon2000v/Apple-Catcher code](https://github.com/Dragon2000v/Apple-Catcher)
- Pattern: the basket is an immovable Arcade body with gravity off, hitbox trimmed to the basket's rim with `setSize` and `setOffset`, and a single `physics.add.overlap` callback does the catch. Source: [Dragon2000v/Apple-Catcher code](https://github.com/Dragon2000v/Apple-Catcher)
- Pattern: speed ramps by a fixed step per catch; a miss subtracts a point (floor zero); a `time.delayedCall` timer ends the round; score and time are shown as text. Source: [Dragon2000v/Apple-Catcher code](https://github.com/Dragon2000v/Apple-Catcher)
- Pattern: a particle emitter made with `emitting: false`, following the basket, and started on each catch. Source: [Dragon2000v/Apple-Catcher code](https://github.com/Dragon2000v/Apple-Catcher)
- Caution: game over calls `this.sys.game.destroy(true)`, which destroys the whole game. That is wrong for a multi-scene game; use a scene switch instead (my judgment). Controls are keyboard only. Source: [Dragon2000v/Apple-Catcher code](https://github.com/Dragon2000v/Apple-Catcher)

**S3-D1/beltline-panic**: [repo](https://github.com/S3-D1/beltline-panic). License: MIT (LICENSE file, 2026). Phaser `^3.90.0`, TypeScript, Vite, many unit and property tests. Made for a 2026 game jam. Files read: README, GDD and CONTROLS docs, ConveyorSystem.ts, ItemSystem.ts, GameManager.ts, GameBalanceConfig.ts, progression.ts.
- Pattern: items are plain data records with a state and a progress value along a path. A system advances progress by speed times elapsed time and converts it to x and y along waypoints. No physics engine is involved. Source: [S3-D1/beltline-panic code](https://github.com/S3-D1/beltline-panic)
- Pattern: all balance lives in one config object (belt speed curve, spawn interval curve and jitter, warm-up, economy). A manager recomputes a "difficulty snapshot" each frame from elapsed time using power curves, and a spawn timer asks it for the next randomized delay. Source: [S3-D1/beltline-panic code](https://github.com/S3-D1/beltline-panic)
- Pattern: a seeded random generator makes runs reproducible for tests. Source: [S3-D1/beltline-panic code](https://github.com/S3-D1/beltline-panic)
- Pattern: a generic piecewise-linear curve evaluator for time-based multipliers. Source: [S3-D1/beltline-panic code](https://github.com/S3-D1/beltline-panic)
- Pattern: the queue entry has gating and spacing rules, and the fail state is a full queue or an item collision. Source: [S3-D1/beltline-panic code](https://github.com/S3-D1/beltline-panic)
- Caution: the contributor guide file in the repo says to avoid physics-based conveyor logic and to keep systems state-driven, which matches the recommendation here. The repo is tuned for an endless survival loop. Source: [S3-D1/beltline-panic code](https://github.com/S3-D1/beltline-panic)

**JuulH/FallingSand**: [repo](https://github.com/JuulH/FallingSand). License: none found (no LICENSE file; no license text in README or code), so treat it as all rights reserved and study only. Plain JavaScript and canvas. Files read: simulation.js, elements.js, README.
- Pattern: each grain type carries an ordered list of preferred moves (down, then diagonals for sand; down then sideways for water). The step tries moves in order and skips a diagonal when both orthogonal neighbors are blocked. Source: [JuulH/FallingSand code](https://github.com/JuulH/FallingSand)
- Caution: every "can it move here" check scans the whole particle array, so cost grows with the square of the grain count. A grid lookup would fix that. Source: [JuulH/FallingSand code](https://github.com/JuulH/FallingSand)
- Fire and water react by removing particles. Not relevant to sorting. Source: [JuulH/FallingSand code](https://github.com/JuulH/FallingSand)

### Inferences
- The mdr cluster-id idea gives non-gamers a one-click selection with no lasso geometry, if we ever want an MDR-style round.
- Beltline Panic's central balance config plus curve helper is the pattern most worth borrowing for ramps and retuning.
- Apple-Catcher is a clean minimal reference for a Kaboom!-style round, but its single-target, destroy-the-game structure should not be copied.
- No repo implements "draw lines to guide grains into cups" in JavaScript. The two Sugar Sugar clones on GitHub found by search are C# and ShaderLab (Unity or GameMaker style), so no Phaser or JS reference exists to study for that mechanic.

### Gaps
- No Phaser sorting-bins repo with a real conveyor and bin logic was found. The search results were itch.io games and tutorials, not open code. [Phaser's "candy catching" and "falling fruits" pages](https://phaser.io/news/2025/06/catch-the-falling-fruits-game) are tutorial teasers with no implementation details.
- Shapez 1 (GPL) was not cloned. Its filter and any color-blind helper were not inspected.
- The phaserjs/examples repository license was not checked, so the Phaser examples are cited as official examples, not as studied repos.

## Needs Michael or Chrome

Blocked or failed items (recorded, not circumvented):
- A WebSearch restricted to rockpapershotgun.com was rejected by the proxy (HTTP 400). An unrestricted search surfaced only an aggregator mirror of that article, which I did not use. The original Rock Paper Shotgun article on the Severance-inspired game was not read.
- The awesome.ecosyste.ms page for henryhale/mdr failed to load (client error). I cloned the GitHub repo instead, which the brief permits.
- `gh api` for the Phaser repo tree returned nothing, and `gh auth status` reported the GH_TOKEN in this environment as invalid (although `gh search` still returned results). I stopped that approach after one try and used the Phaser 4.2.1 npm package docs instead.

Needs Chrome (coordinator-run browser, not available to me):
- Play the official Apple TV+ MDR browser game, the devwithlex Godot build, and the Poki Sugar, Sugar page to judge pacing and feel. Controls for the official game are not described in the article I could read.

Decisions for Michael:
- Primary control: junction tap or arrow (recommended), pointer-follow bucket, or MDR-style pick and drop.
- Whether the "vacuum" must be literal (aimed suction) or can be a bin skin with a pull animation.
- Whether one optional physics-style round (Sugar, Sugar) is worth the extra build and tuning cost.
- Failure scope: retry the round only (recommended) or the whole batch.
