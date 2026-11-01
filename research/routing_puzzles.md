# Routing puzzles (Flow Free, Numberlink, LinkedIn Zip) and space variants for satellite batch 1

Slug: routing_puzzles. Researched 2026-11-01. No browser tools used. Repos were cloned shallow into /home/claude/repos/routing_puzzles/ and only read. "Own test" means a script I wrote myself (not cloned code), saved at /home/claude/repos/routing_puzzles/_own_tests/zip_experiment.py (Python 3, seed 11). Own-test results are labeled as such and are not cited sources. Dashes are avoided on purpose (Michael's style rule).

## 1. What rules make these puzzles good?

### Takeaway
Three properties recur across Numberlink, Flow Free and LinkedIn Zip: every cell gets covered, the answer is unique, and the rules are learnable in seconds. Zip swaps colored pairs for one path through ordered numbers, which is the simplest form to author, play and verify. Difficulty is raised mainly by board size, fewer clues and walls.

### Cited Findings
- Numberlink rules: each pair of equal numbers is joined by one continuous line, lines cannot branch or cross, numbers sit at line ends. A well-designed puzzle should have every cell filled, though some designers do not require it. Source: [Wikipedia, Numberlink](https://en.wikipedia.org/wiki/Numberlink)
- The same page says a puzzle is well designed "only if it has a unique solution" and cites Thomas Snyder's 2010 Wired article for that. I did not open the Wired piece. Source: [Wikipedia, Numberlink](https://en.wikipedia.org/wiki/Numberlink)
- History: a form appeared in 1897 (Sam Loyd), Dudeney published an early version in 1917 ("A Puzzle for Motorists"), and Nikoli popularized it in Japan as Arukone (letters) and Nanbarinku (numbers). Source: [Wikipedia, Numberlink](https://en.wikipedia.org/wiki/Numberlink)
- Rule variants named on the page: a no-U-turn version, and the "zig-zag" version where all squares must be covered and U-turns are allowed. Source: [Wikipedia, Numberlink](https://en.wikipedia.org/wiki/Numberlink)
- Puzzle Madness (a puzzle site) states every puzzle is meant to have a unique solution and every cell is covered. Its generator caps links at 6 turns, rejects 2-cell links, absorbs isolated gaps of 3 cells or fewer, and aims for a mix of short and long links. Source: [Puzzle Madness, How we make Numberlink](https://puzzlemadness.co.uk/howwemakenumberlink/)
- Flow Free (Big Duck Games, released June 2012): pairs of colored dots, pipes fill the whole grid, pipes may not intersect. Difficulty depends mainly on grid size, from 5x5 with 3 colors up to 15x15 with up to 16 colors. Some grids are open, some have walls. Source: [Wikipedia, Flow Free](https://en.wikipedia.org/wiki/Flow_Free)
- Flow Free official notes: "There is a solution to every puzzle"; the hint is to "start from the outside"; a star means the level was completed "perfectly without any mistakes" and a check means you "broke a path or two before finishing it"; after completing a puzzle you can dismiss the dialog to view your solution; an 8x8 Mania pack was added to challenge experienced players and a Pink pack holds 10x10 to 14x14 levels. Source: [Big Duck Games blog](https://www.bigduckgames.com/blog)
- Conflict on star meaning: Wikipedia says a star marks a "perfect" solve "using the fewest moves" ([Wikipedia, Flow Free](https://en.wikipedia.org/wiki/Flow_Free)); the developer's own FAQ says no mistakes or broken paths ([Big Duck Games blog](https://www.bigduckgames.com/blog)). Prefer the developer.
- Flow Free: Warps lists accessibility options "Dark Interface" and "Differentiate Without Color Alone". Source: [App Store, Flow Free: Warps](https://apps.apple.com/app/id1252460942)
- LinkedIn Zip is described as "a simplified connective puzzle": draw one line connecting the numbers in sequence while filling every cell. A new puzzle comes daily, difficulty increases over time, an "intelligent hint tool" helps on harder boards, and there are streaks and leaderboards. LinkedIn positions it as learnable "within seconds" for people who found Queens or Tango too complex. Article dated March 18, 2025. Source: [Social Media Today](https://www.socialmediatoday.com/news/linkedin-adds-zip-puzzle-game/742847/)
- LinkedIn's engagement figures (84% return next day, 80% still playing a week later) are LinkedIn claims with no totals given. Source: [Social Media Today](https://www.socialmediatoday.com/news/linkedin-adds-zip-puzzle-game/742847/)
- A syndicated article says Zip difficulty rises over the week (Monday easiest, Sunday hardest) and that "every cell is used". Source: [AOL](https://www.aol.com/linkedin-game-zip-challenge-brain-140009846.html)
- Zip as a data model: a Hamiltonian path over every free cell, hitting checkpoints 1 to N in order, avoiding walls. I read the code: the path must end on the highest number, walls are stored as unordered pairs of adjacent cells, and the grid is an integer array (0 empty, N checkpoint). Source: [hillhack/LinkedinZipSolver](https://github.com/hillhack/LinkedinZipSolver)
- A third-party Zip help page gives the same rule (start at 1, run through all cells, pass numbered cells in order) and describes walls as solid borders between neighbors. It says nothing about uniqueness or generation. Source: [davdata.nl ZIP help](https://www.davdata.nl/math/zip_help.html)
- Hardness: connecting all pairs is NP-complete (Lynch 1975; Kramer and van Leeuwen 1982), zig-zag Numberlink is NP-complete (Adcock et al. 2014), and with a fixed number of pairs it is polynomial. Hamiltonicity in grid graphs is NP-complete (Itai, Papadimitriou, Szwarcfiter 1982). Sources: [Wikipedia, Numberlink](https://en.wikipedia.org/wiki/Numberlink); [Demaine et al., FUN 2024 paper intro](https://erikdemaine.org/papers/GridGraphs_FUN2024/paper.pdf)
- Fairness principle from a Fez review: puzzles "present the player with all the rules up front", riddles hide information, and "a designer can and should tell the player the rules". Source: [Game Developer, The dimensions of Fez (R. Terrell, 2012 blog post)](https://gamedeveloper.com/design/the-dimensions-of-fez)
- Infinity Loop's developers describe the ramp trade-off: increasing difficulty "while at the same time relaxing and allowing infinity levels"; they "opted to make it relaxing". Source: [App Store, Infinity Loop](https://apps.apple.com/us/app/-/id977028266)

### Inferences
- Zip style (one path, ordered checkpoints) is the cheapest rule set to author and verify, because any random Hamiltonian path is already a fully covering solution and checkpoints are sampled from it (see section 2). Flow style (several colored pairs) needs a multi-path solver.
- Difficulty knobs available to us: board size, number of clues (fewer is harder, see own test), walls, and the space twist. Raise one knob per ticket.
- The audience includes non-gamers, so the Zip rule set (learnable in seconds by LinkedIn's own positioning) plus telling twist rules up front fits better than Flow's multi-color rules.
- Show "cells covered / total" live: the every-cell rule makes it a natural progress meter, and amoralesc/flow computes progress the same way (covered cells over total cells).

### Gaps
- Needs Michael or Chrome: LinkedIn's official Zip help page (https://www.linkedin.com/help/linkedin/answer/a6863543) returned "robots_disallowed". The rules above come from news coverage and a third-party solver README, not LinkedIn's own page.
- LinkedIn does not appear to publish how Zip boards are generated or whether they are unique. I found no source.
- Thomas Snyder's 2010 Wired article was not located or opened.
- No level-by-level difficulty curve for Flow Free is documented beyond size ranges and pack names.

## 2. How are levels generated and checked, and what is practical for a small project?

### Takeaway
For a small project, generate or hand-make levels at build time, check them with a short depth-first solver that counts solutions and stops at two, and ship only boards with exactly one solution plus the stored answer. The open-source Numberlink generators rely on shape rules ("pseudo-unique") or a separate solver, not proofs. SAT or SMT is possible but unnecessary at 7x7 or 54 cube cells.

### Cited Findings
- thomasahle/numberlink: Go solver plus a Python generator (gen/gen.py). Routinely solves 40x40 and solved all 270 Janko.at puzzles in 0.14 s. The README says it does NOT check uniqueness: it assumes one solution that uses all squares and no link touching itself. Solver is heavily pruned backtracking with partial links and a "dual representation based on link corners" described as the most important speedup. SAT is not mentioned. Source: [thomasahle/numberlink README](https://github.com/thomasahle/numberlink)
- Reading gen.py (my words): it builds candidates on a doubled grid, draws two long random side paths using a precomputed table of short paths (meet-in-the-middle), adds random loops, then shrinks to the real grid and turns tubes into numbered pairs. A candidate is accepted only if the pair count is within a range (default two thirds to one and a half times the square root of the cell count) and it has no loops detached from an endpoint, no two endpoints of one path touching, and no cell with three same-path neighbors. A code comment ties that last check to "pseudo-unique" puzzles. I did not fully work out the diagonal-lattice drawing trick. Source: gen/gen.py and gen/mitm.py in [thomasahle/numberlink](https://github.com/thomasahle/numberlink)
- Puzzle Madness uses a classic backtracking solver that "keeps searching after finding a solution" so it can detect a second one, and a generator that adds links, fills small gaps, merges links, and runs final checks. Source: [Puzzle Madness](https://puzzlemadness.co.uk/howwemakenumberlink/)
- leymbda/numberlink (F#, Z3 SMT): encodes each edge as an integer (a line id, or 0 for unused); ordinary cells need exactly two used edges of the same line; terminals need exactly one; extra constraints stop lines touching themselves. Its own TODO comments name a "rank constraint to prevent shadow cycles" and a "retry constraint to prevent nonunique", and result extraction is unfinished, so it is a sketch, not a working validator. Source: Numberlink.Solver/SmtSolver.fs in [leymbda/numberlink](https://github.com/leymbda/numberlink)
- Same repo's graph model has typed vertices (Cell, Terminal, Bridge) and typed edges (Segment, Warp, BridgeLane), so warps and bridges are data, not special cases. Source: Numberlink.Generator/Template.fs in [leymbda/numberlink](https://github.com/leymbda/numberlink)
- amoralesc/flow: its docs (Spanish) say the 25 shipped levels are guaranteed winnable with a unique solution, but custom and random boards are not guaranteed. Its own A* style solver "does not guarantee finding a solution" and fails 5 of the 25 shipped levels (8x8 and 9x9 boards). Lesson: a heuristic solver cannot serve as a validator. Source: docs/main.tex in [amoralesc/flow](https://github.com/amoralesc/flow)
- hillhack/LinkedinZipSolver: plain depth-first search with a breadth-first reachability check and an immediate reject when a numbered cell is entered out of order. It returns the first solution only, so it cannot prove uniqueness. Source: solver.py in [hillhack/LinkedinZipSolver](https://github.com/hillhack/LinkedinZipSolver)
- Random Hamiltonian paths on an n by n grid: a physics course page offers a generator that uses a "backbiting move" with a "quality factor"; it cites Oberdorf et al., Phys. Rev. E 74, 051801 (2006), and does not explain the move itself. Source: [SFU Hamiltonian path generator](https://www.sfu.ca/~eemberly/phys847/assignments/hamiltonian_paths.html)
- Fixed-pair Numberlink is polynomial and the general problem is NP-complete, so small boards are safe for brute force but large ones need care. Source: [Wikipedia, Numberlink](https://en.wikipedia.org/wiki/Numberlink)

#### Repos studied (license and what I learned)
| Repo | License (checked) | Last commit | Pattern |
| --- | --- | --- | --- |
| [thomasahle/numberlink](https://github.com/thomasahle/numberlink) | AGPL-3.0 (LICENSE file) | 2026-01-26 | Generate paths, reject ugly shapes. Solver does not prove uniqueness. Do not copy code (AGPL). |
| [amoralesc/flow](https://github.com/amoralesc/flow) | MIT (LICENSE file) | 2022-11-23 | Stroke state machine (see section 3); heuristic solver is not a validator. |
| [hillhack/LinkedinZipSolver](https://github.com/hillhack/LinkedinZipSolver) | None found (no LICENSE, README silent) | 2025-12-03 | Zip as int grid plus wall pairs; DFS with number-order rejection. |
| [leymbda/numberlink](https://github.com/leymbda/numberlink) | None found | 2026-04-07 | Typed Warp and Bridge edges; SMT encoding sketch. |
| [donadigo/FlowFreeJS](https://github.com/donadigo/FlowFreeJS) | None found | 2020-06-27 | p5.js pointer to cell logic (section 3). |

None of the five is Phaser. No license means all rights reserved by default, so these were read for patterns only.

### Inferences
- Own test (Python, my script; method: random Hamiltonian path made by backbite moves on the graph; start with the two end checkpoints plus one; add random checkpoints, or in "walls" mode checkpoint or wall at 50% each, until a DFS that counts solutions (stops at 2, node cap 30,000) finds exactly one; then try removing each interior checkpoint while it stays unique). Results, averaged over 8 to 25 puzzles each:

| Board | Cells | Numbers when first unique | After removing extras | Walls added (walls mode) | Avg time per puzzle |
| --- | --- | --- | --- | --- | --- |
| Flat 5x5 | 25 | 15.2 | 6.3 (4.1 in walls mode) | 4.8 | 0.01 s |
| Flat 6x6 | 36 | 23.2 | 7.8 (5.2 in walls mode) | 8.4 | 0.03 to 0.06 s |
| Flat 7x7 | 49 | 30.6 | 10.9 (5.3 in walls mode) | 15.9 | 0.2 to 0.4 s (max 0.93 s) |
| Wrap (torus) 5x5 | 25 | 16.2 | 9.3 | n/a | 0.07 s |
| Wrap (torus) 6x6 | 36 | 26.4 | 11.0 | n/a | 1.3 s (max 3.2 s) |
| Cube, 3x3 per face | 54 | 40.9 | 16.8 (8.4 in walls mode) | 19.8 | 6 to 9 s (max 14 s) |
| Cube, 4x4 per face | 96 | 80.0 | 36 (10.5 in walls mode) | 39.5 | 43 to 58 s (only 2 puzzles each; naive Python) |

  Reading: generate-then-add-clues-until-unique works and is fast to 7x7 and acceptable for a 54-cell cube; 96 cells needs a smarter solver or offline patience. Wrap boards need more numbers than flat boards for the same size (9 to 11 versus 6 to 8). Fewer numbers means a looser, likely harder puzzle, but real difficulty depends on solving techniques, which I did not measure.
- Practical pipeline for Claude to build: (1) a Node script makes a random Hamiltonian path (start from a snake path, apply backbite moves: pick an end, pick a neighbor already on the path, reverse the part of the path after it); (2) pick checkpoints along the path; (3) count solutions with DFS (prune with flood-fill connectivity of unvisited cells and a minimum-degree check; stop at 2); (4) add a number or wall until the count is 1, optionally remove extras; (5) save {size, numbers, walls, solution} as JSON. The game never runs the solver; it only checks a player path against the rules.
- Hybrid is fine: hand-author the first two tutorial boards, generate the rest.
- If boards ever need to be larger, switch the solver to SAT or SMT: solve, forbid the found solution, solve again, and call the board unique if the second call fails. leymbda's TODO list points the same way. This is a standard technique, not something I verified in a source.
- Flow-style colored pairs are harder to generate than Zip style; thomasahle's approach shows the cost (doubled-grid tricks plus many rejection rules). Skip unless Michael wants pairs.

### Gaps
- No JS or TypeScript Zip or Flow generator was found, and no Phaser-based clone: the first Phaser-targeted search returned only p5.js, pygame and other clones, and my follow-up searches were refused because the shared web search budget ran out. Re-running a GitHub search for "phaser flow free" or "phaser numberlink" would need a follow-up session.
- GitHub topic page for numberlink solvers (https://github.com/topics/numberlink-solver) was listed in search results but not opened. No SAT-based Numberlink solver was read.
- How LinkedIn generates or verifies Zip boards is not public as far as I found.

## 3. Input and feel: drag to draw, undo, cutting, snapping, completion feedback

### Takeaway
Use press on the start, drag to extend one neighbor at a time, drag back over the previous cell to undo, and press mid-path to truncate. Official Flow Free breaks a pipe that another pipe crosses, but for a single-path Zip board the only collision is the player's own path, which should simply be refused. Phaser gives interpolation and inverse-transform tools that cover fast drags and rotated boards.

### Cited Findings
- Official Flow Free behavior: "pipes will break if they cross or overlap". Source: [Big Duck Games blog](https://www.bigduckgames.com/blog); also [App Store, Flow Free: Warps](https://apps.apple.com/app/id1252460942)
- Developer claims for feel: "Optimized touch controls" with accuracy "even when drawing quickly" (Warps post) and "smooth, satisfying play" (App Store). Sources: [Big Duck Games blog](https://www.bigduckgames.com/blog); [App Store](https://apps.apple.com/app/id1252460942)
- donadigo/FlowFreeJS (p5.js, 471 lines, no license): a press only starts on an endpoint; the pointer maps to a cell by integer division by the cell size; when the pointer jumps more than one cell along a row or column the code fills the skipped cells; diagonal steps are refused; moving onto the second-to-last cell pops the last (drag back to undo); on release the pipe is kept only if both ends are same-color endpoints; win check = every non-endpoint cell covered and every color connected. This clone blocks entering any occupied cell instead of cutting. Source: main.js, pipe.js, grid.js in [donadigo/FlowFreeJS](https://github.com/donadigo/FlowFreeJS)
- amoralesc/flow (MIT, pygame): a small state machine with start, continue and end. Pressing a cell on an existing path truncates that path back to the pressed cell so you resume from there; pressing an endpoint restarts that color; continue only moves to an adjacent cell that is empty, is the matching endpoint, or is the second-to-last cell (undo). A move counter increments when the player starts drawing a different color. Progress = covered cells over total cells. Mouse events are converted to a tile by integer division. Source: components/grid.py and components/controller.py in [amoralesc/flow](https://github.com/amoralesc/flow)
- Flow Cube (a Windows Phone game, reviewed by All About Windows Phone) lets you trace a new color over an existing line and offers a master reset; lines cannot be erased piecemeal. Source: [Flow Cube review](https://allaboutwindowsphone.com/reviews/item/16972_Flow_Cube.php)
- Monument Valley's art lead on touch: "touch controls can be very ambiguous, especially when rotating 3D objects using 2D gestures" and "everybody touches the screen slightly differently". The team used programming effort and visual feedback to make inputs feel responsive, and gave building movements musical tones. Source: [Creative Bloq, The making of Monument Valley](https://www.creativebloq.com/computer-arts/making-monument-valley-71412213)
- Monument Valley also highlights reachable nodes that shift with the geometry, so an imprecise touch does not send the character somewhere unintended. Source: [Game Developer, Making the impossible possible in Monument Valley](https://gamedeveloper.com/design/making-the-impossible-possible-in-i-monument-valley-i-)
- Completion feedback examples: Infinity Loop lights the final circuit when a level is done "so you can step back and examine" it (web version) ([Poki, Infinity Loop](https://poki.com/en/g/infinity-loop)); Flow Free shows a star or check and lets you view your solution ([Big Duck Games blog](https://www.bigduckgames.com/blog)); Papers, Please opens each day with a "coarse, clacking shutter" sound ([Game Developer, Papers, Please](https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i-)).
- Phaser pointer API (documented on the v4.1.0 page and on a docs page at the 3.80.0 URL path; the 3.80.0 page text itself states no version): Pointer.worldX and worldY ("translated into the coordinate space of the most recent Camera"), isDown, positionToCamera(camera), prevPosition (screen space), and getInterpolatedPosition(steps, out), which "generates an array of interpolated values" between the previous and current pointer positions, default 10 steps. updateWorldPoint(camera) is on the v4.1.0 page. Sources: [Phaser 3.80.0 Pointer docs](https://newdocs.phaser.io/docs/3.80.0/Phaser.Input.Pointer); [Phaser v4.1.0 Pointer docs](https://phaser.io/oss/docs/api-documentation/class/input-pointer.md)
- Phaser converts world points to a game object's local space with Transform#getLocalPoint(x, y, [point], [camera]) and getWorldTransformMatrix(); TransformMatrix#applyInverse(x, y, [output]) "can be used to translate points from world to local space". Documented for v4.1.0; getLocalPoint is also on the page at the 3.80.0 URL path (page text states no version); applyInverse is also on the 3.88.2 page. Sources: [v4.1.0 Transform](https://phaser.io/oss/docs/api-documentation/namespace/gameobjects-components-transform.md); [3.80.0 Transform](https://newdocs.phaser.io/docs/3.80.0/Phaser.GameObjects.Components.Transform); [v4.1.0 TransformMatrix](https://phaser.io/oss/docs/api-documentation/class/gameobjects-components-transformmatrix.md); [3.88.2 TransformMatrix](https://phaser.io/oss/docs/api-documentation/3.88.2/class/gameobjects-components-transformmatrix.md)
- Phaser 4 migration items that touch a pixel-art puzzle: roundPixels now defaults to false, Geom.Point was removed (use Vector2), DynamicTexture drawing needs render(). Source: [Phaser, Migrating from Phaser 3 to 4](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know)

### Inferences
- Stroke controller in plain words: keep path = list of cells; on pointer move, convert the pointer to a cell; if it is a neighbor of the head and free, push it; if it equals the previous cell, pop; if it is farther away, walk the interpolated pointer samples one at a time and apply the same rule to each. Refuse anything else without breaking the stroke.
- For wrap and cube boards the pointer cannot be over the destination cell (it is across the board or on another face). So drive the stroke by direction instead: take the pointer offset from the head cell center, and when it passes about half a cell along one axis, step to the neighbor in that direction using the adjacency table, then re-center. This also works on rotated boards if the offset is first converted to board space. I did not find a source for how Flow Free: Warps handles the finger crossing a warp edge.
- getInterpolatedPosition uses prevPosition, which the docs describe as screen space. If the camera ever scrolls or zooms, convert each sample to world space before mapping to cells. Untested.
- Cutting rule for our single-path boards: only the player's own path exists, so entering an already visited cell should be refused (or, as an option, truncate back to that cell like amoralesc/flow). Refusing is clearer for non-gamers.
- Cheap satisfying feedback in Phaser terms: tint or fill each visited cell as it joins, tick sound per step, a small scale pulse on checkpoints when hit in order, and a final glow sweep along the finished path (Infinity Loop pattern). I did not verify Phaser 4 effect APIs; keep to tweens and Graphics.

### Gaps
- I did not verify that Graphics, tweens and Container behave identically in Phaser 4; the migration article does not mention them.
- No source describes Flow Free's exact snapping or hit-test tolerance.

## 4. Rotating boards: timer versus player action, and keeping input readable

### Takeaway
Puzzle precedents (Fez, Monument Valley, Infinity Loop) rotate on player action and snap to fixed angles; continuous timer-driven rotation appears in reflex games like Super Hexagon, where it is described as a distraction. For a thinking puzzle aimed at non-gamers, rotate in 90 degree snaps, either on a button or on a telegraphed tick, and keep all logic in board space.

### Cited Findings
- Fez: the player "can rotate between four 2D views of the 3D world", moving within the current view; rotating "reveals new paths through the levels by connecting otherwise inaccessible platforms". Source: [Wikipedia, Fez](https://en.wikipedia.org/wiki/Fez_(video_game))
- A 2012 Fez review describes ROTATE as a player action of 90 degrees in two directions, notes most solutions are "just one or two rotations away", and criticizes hidden riddles in favor of readable puzzles. Source: [Game Developer, The dimensions of Fez](https://gamedeveloper.com/design/the-dimensions-of-fez)
- Monument Valley: early interactive architecture included "draggers" and "rotators", and "the player's view remains fixed". Source: [Creative Bloq](https://www.creativebloq.com/computer-arts/making-monument-valley-71412213)
- Monument Valley navigation (tech director Pashley): nodes sit on walkable surfaces and connections are recalculated only at snap positions, "decision points" exist only when geometry is in a snap position, and designers can mark nodes accessible or inaccessible. Source: [Game Developer, Making the impossible possible in Monument Valley](https://gamedeveloper.com/design/making-the-impossible-possible-in-i-monument-valley-i-)
- Infinity Loop (web version): "Rotate the scattered pieces on the grid"; click rotates a piece; no timer mentioned. The App Store description calls it "Simple, relaxing, endless", with no pressure to solve levels. Sources: [Poki](https://poki.com/en/g/infinity-loop); [App Store](https://apps.apple.com/us/app/-/id977028266)
- Super Hexagon (timer-style rotation): the playfield "will constantly spin in different directions", walls change direction, and the player pivots a triangle left or right; rotation, wall changes and color changes are described as distractions, and one mistake restarts the level. Source: [Wikipedia, Super Hexagon](https://en.wikipedia.org/wiki/Super_Hexagon)
- Cube Loop (itch.io, free, Flow Free inspired): "Swipe to turn the cube". Source: [Cube Loop](https://cubicks.itch.io/cube-loop)
- Phaser: setRotation, setAngle, rotation and angle exist on game objects (v4.1.0 page). The migration article says camera scroll, zoom and rotation are unchanged for standard use ("nothing changes"), that only direct camera matrix access was restructured, and that Math.TAU is now the full circle, so quarter turns should use Math.PI_OVER_2. Sources: [v4.1.0 Transform](https://phaser.io/oss/docs/api-documentation/namespace/gameobjects-components-transform.md); [Phaser migration article](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know)

### Inferences
- Precedents that puzzle on rotation all let the player trigger it. Timer rotation exists, but in a twitch game. So a timer here is a design choice with no puzzle precedent; if used, telegraph it (ring or countdown) and keep the stroke safe.
- Build recipe: store the path and walls in board coordinates (row, col). Put the board graphics in a Container. Rotate the container with a tween on angle in 90 degree steps (about 0.4 to 0.6 s, eased). Convert each pointer sample to board space with getLocalPoint or applyInverse, then to a cell. Because the path lives in board space, it rotates with the board for free.
- Screen-space versus board-space: for pointer input the player points at what they see, so converting through the inverse transform is enough. For arrow keys (if offered), use screen directions and convert to board directions by the current rotation. For direction-step drag (section 3), convert the pointer offset to board space first.
- Keep numbers readable by counter-rotating labels (or drawing them in a separate layer positioned from the board transform).
- Do not rotate while a stroke is mid-drag: queue the tick until pointer up or until a short grace period, and ignore pointer moves during the tween. This protects fairness. Not sourced.
- Rotate the board Container rather than the main camera, so HUD, counters and buttons stay upright. Not sourced.
- Because rotation changes only the view, solvability and uniqueness do not change, so the solver check from section 2 still applies unchanged. A twist that rotates the walls or checkpoints relative to the grid (not just the view) would change the puzzle and need re-verification per rotation state.

### Gaps
- Whether Fez keeps left/right controls screen-relative after a rotation was not found in the sources I opened.
- Monument Valley talk details (drag mechanics, snap thresholds) are not in the accessible articles; the Pocket Gamer GDC 2014 piece has no mechanics. GDC slides or video would be needed.
- A web version of Infinity Loop was used for the rotate-by-click claim because the App Store text does not describe rotation and TouchArcade returned a client error.

## 5. Moving dots: keeping sudden movement fair

### Takeaway
"Sudden and random" must be authored and telegraphed. Pre-script every jump, check each resulting board with the solver, show the destination before the jump, and handle the player's partial path with a clear rule. Random relocation to any empty cell breaks solvability about half the time in my test.

### Cited Findings
- Into the Breach (Subset Games): telegraphed enemy attacks were "a core mechanic"; the developers wanted "every death felt like your own fault" and it to be "very clear how or why you failed"; they wanted less randomness than FTL and say limited randomness helps the player "feel in control". Source: [Game Developer, Road to the IGF: Into the Breach](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-)
- Mini Metro: station shapes "randomly appear" over time; a station holds about six passengers; the game ends only when a station is overcrowded "for an extended period of time" (a grace period); new assets arrive every in-game week. The page does not describe any advance warning of new stations. Source: [Wikipedia, Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Fairness from a Fez review: tell the player the rules; hidden riddles frustrate. Source: [Game Developer, The dimensions of Fez](https://gamedeveloper.com/design/the-dimensions-of-fez)

### Inferences
- Own test on jump fairness (same Python script; each trial moves one interior numbered checkpoint on a puzzle that has exactly one solution, then counts solutions):
  - Jump to a random empty cell (number keeps its value): 81 of 176 trials were unsolvable (46%), 38 unique, 51 multiple, 6 undecided at the node cap.
  - Jump to another cell on the known solution path, strictly between the neighbors in number order: 0 of 174 trials unsolvable (by construction the old path still works), but 94 (54%) now had multiple solutions, 76 unique, 4 undecided.
  - Meaning: random relocation is unsafe; relocation along the solution is always solvable but can lose uniqueness, so run the solver on every state at build time and keep only states that stay unique (or accept multiple solutions if the win check accepts any valid path).
- Fair-jump recipe: (1) each level carries a scripted timeline of states, each verified; (2) a jump is shown about 2 s early as a ghost ring on the destination plus a matching pulse on the moving number; (3) destination must be empty and not walled in; (4) after the jump, if the player's path breaks the order rule, rewind it to the last valid cell with a short animation instead of failing; (5) cap jumps per level and seed the schedule so replays match.
- Trigger options for Michael: real-time schedule with telegraph, or every N cells drawn (turn-based). Turn-based removes time pressure for non-gamers; real-time is more "sudden". Start with the second and offer the first as the harder ticket.
- A number moving onto a cell the stroke already covers is the one unfair case; forbid it by choosing only destinations ahead of the stroke on the verified path.

### Gaps
- No documented puzzle that moves goal points during play was found; Into the Breach (telegraph) and Mini Metro (random spawns) are analogies only.
- My test used minimal-clue boards, which are fragile; boards with extra clues would break less often. Sample sizes per board type were 2 to 25.

## 6. Wraparound edges (Flow Free: Warps) as an "orbit" variant

### Takeaway
Wrap edges are a data change, not a rendering rewrite: compute neighbors modulo the board size. Flow Free: Warps proves players accept it, and it works with the same solver. Wrap boards need more clues to be unique, so add numbers or walls.

### Cited Findings
- Flow Free: Warps (released August 8, 2017) lets pipes "warp from one map edge to another". Source: [Wikipedia, Flow Free](https://en.wikipedia.org/wiki/Flow_Free)
- The developer called it "a new and unique mechanic" in a post dated August 9, 2017, with packs named Starter, Mania, Boundless and Deep Space. The App Store text says "Warp paths across the board" and "Over 2,500 free, warping puzzles" and that pipes break if they cross or overlap. Sources: [Big Duck Games blog](https://www.bigduckgames.com/blog); [App Store](https://apps.apple.com/app/id1252460942)
- The App Store text does not say how warp edges are drawn; a user review mentions walls were added. Source: [App Store](https://apps.apple.com/app/id1252460942)
- Math definition of the torus version: opposite edges are glued, so "a path can go off one edge of the board and reenter at the corresponding square on the opposite edge", in both directions. The paper calls it a variation of Flow Free and does not mention the Warps app or give results. Source: [Wong et al., Flow Free on a Torus (Kutztown)](https://faculty.kutztown.edu/wong/mh-02-wong-r1.pdf)
- A graph-based generator in the wild models warps as an edge type, alongside bridges. Source: Template.fs in [leymbda/numberlink](https://github.com/leymbda/numberlink)

### Inferences
- Implementation: neighbor(row, col, dir) uses modulo on one or both axes (full torus, or only left-right for a ring or "orbit" feel). Everything else (solver, win check, stroke) is unchanged. My generator and solver ran on a torus with no changes besides neighbor lists.
- Own test: torus boards needed more numbers to reach uniqueness than flat boards: 9.3 (5x5) and 11.0 (6x6) versus 6.3 and 7.8; the 6x6 torus took about 1.3 s per puzzle in naive Python. Use 5x5 or 6x6 for wrap tickets.
- Show the wrap: draw a faint copy of the opposite row or column outside the border, put matching tick marks or arrows on both edges, and when the head crosses, draw a stub on both sides. Use direction-step input (section 3) because the finger cannot follow the path across.
- Partial wrap (only horizontal) is the gentlest version for non-gamers and is a one-line change to the neighbor function. Not tested separately.

### Gaps
- How Flow Free: Warps draws edges and how the finger crosses a warp is not documented in the pages I opened.
- Needs Michael or Chrome (optional): the Flow Free fan wiki pages on Warps and Boundless packs were listed in search but not opened.

## 7. The 3D cube: Three.js in Phaser, 2D fake, or unfolded net

### Takeaway
The cheapest robust option is a flat net of six faces (or a net re-centered on the active face) driven by a cube-surface graph with linked edges. Three.js is possible but adds a second renderer, and Phaser 4 removed Mesh and Plane while the main Phaser 3D extension lists Phaser 3 only. Precedent apps show at most three faces at once or use swipe-to-turn.

### Cited Findings
- Phaser 4 removed Mesh and Plane ("gone with no direct replacement") and Layer3D. Source: [Phaser, Migrating from Phaser 3 to 4](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know)
- enable3d is a TypeScript "3D extension for Phaser 3" (LGPL-3.0, 553 commits, Three.js 0.171.0, Phaser ^3.55.2 with notes that 3.60 and 3.70 work). The README makes no statement about Phaser 4, and neither it nor the Phaser news post says whether Three.js shares Phaser's canvas. Sources: [yandeu/enable3d](https://github.com/yandeu/enable3d); [Phaser news, enable3d](https://phaser.io/news/2021/03/enable-3d-phaser-extension)
- Three.js picking: Raycaster.setFromCamera(coords, camera) plus intersectObject(s); each hit carries face, faceIndex, uv, point and normal; back faces are culled by default; "a ray hitting a triangle mesh exactly along an edge shared by two faces may be reported by both faces". Source: [three.js Raycaster docs](https://threejs.org/docs/pages/Raycaster.html)
- Flow Cube (Windows Phone): the board is "wrapped around the three visible sides of a cube"; the reviewer wishes all six sides were used but says that "would be a little too hard to visualise and manipulate on a mobile phone screen"; you drag from a colored point to draw. Source: [Flow Cube review](https://allaboutwindowsphone.com/reviews/item/16972_Flow_Cube.php)
- Cube Loop (itch.io, free): 100 games over 5 levels, Flow Free inspired, "Swipe to turn the cube". Source: [Cube Loop](https://cubicks.itch.io/cube-loop)
- Cube Link: Connect the Dots 3D (LR Studios, 2016): "3D puzzles", thousands of puzzles, hints, time trial; the description does not say how the cube turns or whether pipes cross edges. Source: [App Store, Cube Link](https://apps.apple.com/app/id979542745)
- Fez presents a 3D "cube-like space" as four 2D views and rotates on player command. Source: [Wikipedia, Fez](https://en.wikipedia.org/wiki/Fez_(video_game))

### Inferences
- Data model (same graph as flat and wrap): each cell is (face normal, 3D center). To step in an in-plane direction d: if the next center is still on the face, use it; if it leaves the face, fold over the edge: new center = center + d - normal (in half-cell units), new normal = d. Own test: for n = 1 to 5 cells per side this gave 6n^2 cells, 12n^2 edges, every cell degree 4, symmetric adjacency, connected, and exactly 12n cross-face edges. The solver and generator ran on it unchanged. The 3D coordinates also give each cell its place in a drawn net.
- Option A, flat net (cheapest robust): draw six squares in a cross layout with Phaser Graphics or Containers; put matching colored edge markers where two faces meet on the cube but not on screen; use direction-step input. No new libraries, no 3D picking.
- Option B, rolling net: same as A, but "turning the cube over" re-lays the net around a newly chosen center face and tweens each face container's position and angle into place. This gives the turn-over feeling with only 2D tweens. Neighbor tables stay the same.
- Option C, three visible faces in 2D: draw an isometric three-face view and a button that swaps which three are visible (mirrors the Flow Cube precedent). Needs skewed faces, which I did not verify as easy in Phaser Graphics.
- Option D, Three.js: build a BoxGeometry cube, paint each face with a CanvasTexture drawn from the same logic, and map clicks with Raycaster uv to cells. Costs: a second canvas or renderer to size and sync, back-face and edge-hit handling, and a bundle dependency; Phaser's own 3D objects are gone in v4 and enable3d targets Phaser 3. Treat as an upgrade, not the base.
- Solver time: 54 cells is fine at build time; 96 cells (4x4 faces) needs a better solver. Start with 3x3 faces.
- No commercial 6-face routing puzzle was found; the nearest are Flow Cube (three faces), Cube Loop (swipe to turn), and Fez (four views). Drawing across all six faces on a phone was judged too hard in the Flow Cube review.

### Gaps
- Whether Three.js can share Phaser 4's WebGL context, and any Phaser 4 plus Three.js example, was not found (no source; search budget exhausted).
- Skewed face rendering in Phaser 3 or 4 was not checked.
- Cube Link and Cube Loop gameplay beyond store text was not found.

## 8. How puzzle games make routing feel like routine work (mechanics only)

### Takeaway
Borrow structure, not story: a shift with a limited clock, a quota counter, pay or score per correct case, a penalty for mistakes, an end-of-shift summary, and one new rule introduced per shift. Papers, Please is the clearest precedent; Opus Magnum and Flow Free show efficiency scoring.

### Cited Findings
- Papers, Please: a "limited amount of real time, representing a full day shift"; income per entrant "properly processed"; citations lower the day's earnings; the player budgets rent, food and heat at day end and debt ends the game; rules become "progressively more difficult over time"; the UI is deliberately "clunky" (HyperCard inspired). Source: [Wikipedia, Papers, Please](https://en.wikipedia.org/wiki/Papers,_Please)
- Design notes on Papers, Please: bureaucratic structure "fits naturally" for layering rules; the family status screen is "just a few dots with some text"; the article calls out "numbing repetition"; Pope staggered new rules so the daily bulletin was noticed. Source: [Game Developer, Designing the bleak genius of Papers, Please](https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i-)
- Opus Magnum ranks solutions on three numbers, cycles, cost and area, and players combine them as an unofficial "sum"; puzzles are grouped in chapters that must be finished before advancing. Source: [Wikipedia, Opus Magnum](https://en.wikipedia.org/wiki/Opus_Magnum)
- Flow Free: star or check for clean versus broken solves, Time Trial mode, daily puzzles. Sources: [Big Duck Games blog](https://www.bigduckgames.com/blog); [App Store](https://apps.apple.com/app/id1252460942)
- LinkedIn Zip: a daily puzzle, streaks, leaderboards, and difficulty that rises over time or the week. Sources: [Social Media Today](https://www.socialmediatoday.com/news/linkedin-adds-zip-puzzle-game/742847/); [AOL](https://www.aol.com/linkedin-game-zip-challenge-brain-140009846.html)
- Mini Metro: new assets arrive each in-game week and a game ends after sustained overcrowding. Source: [Wikipedia, Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Contrast case: Infinity Loop deliberately removes pressure ("without any pressure or tension"), so quotas and clocks are what make a routing puzzle feel like work. Source: [App Store, Infinity Loop](https://apps.apple.com/us/app/-/id977028266)

### Inferences
- Mechanic kit for batch 1 (no story attached): a shift screen with a ticket counter ("ticket 3 of 6"); a quota bar; a per-ticket score from time, resets and path breaks; a shift-end summary sheet (tickets cleared, average time, resets); a numbered ticket header; one new rule introduced at the start of each ticket (like the daily bulletin); a hint that costs score rather than blocking.
- Keep the first rotating and moving-dot tickets non-failing (the clock only lowers the star), so non-gamers are not punished while learning the twist.
- Keep UI plain and form-like (labels, counters, stamped results) because the clunky bureaucratic look is part of the Papers, Please feel. Any art direction is Michael's call.

### Gaps
- No source measured whether quotas make players feel "work-like"; the link is design analysis, not research.
- Opus Magnum histograms of other players' results were not confirmed on the Wikipedia page (it lists the three metrics and ranking only).
- Human Resource Machine, Shenzhen I/O and similar office-framed puzzlers were not opened; the search budget ended first.
