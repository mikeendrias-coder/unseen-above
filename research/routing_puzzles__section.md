## Routing puzzles (Zip style) and space variants

Build batch 1 as Zip-style puzzles (one path, ordered numbers, every cell filled) on one graph model. Every twist then shares one solver and one win check.

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [LinkedIn Zip](https://www.socialmediatoday.com/news/linkedin-adds-zip-puzzle-game/742847/) | One line, numbers in order, every cell used. Daily, with rising difficulty. | Base rules and ramp. |
| [Flow Free and Warps](https://www.bigduckgames.com/blog) | Drag to draw. Crossing breaks a pipe. Warps wraps edges. | Wrap edges as the orbit variant. |
| [Monument Valley](https://gamedeveloper.com/design/making-the-impossible-possible-in-i-monument-valley-i-) | Rotating geometry with snap positions. Paths recomputed only at snaps. | Rotate in 90 degree snaps. |
| [Fez](https://en.wikipedia.org/wiki/Fez_(video_game)) | Player rotates between four 2D views. | State twist rules up front. |
| [Infinity Loop](https://poki.com/en/g/infinity-loop) | Click to rotate. No timer is mentioned. Finished circuit lights up. | Calm tutorial ticket, completion glow. |
| [Into the Breach](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-) | Telegraphed enemy moves: "every death felt like your own fault". | Show each dot jump first. |
| [Papers, Please](https://en.wikipedia.org/wiki/Papers,_Please) | Day shift, pay per correct case, citations cut pay. | Quota, score, one new rule per shift. |
| [Flow Cube](https://allaboutwindowsphone.com/reviews/item/16972_Flow_Cube.php) | Three visible cube sides; six judged too hard on a phone. | Flat net, not six faces in 3D. |

**How we build it**
- Graph model: cells are nodes, walls delete edges, a number map marks checkpoints. Flat, wrap and cube boards differ only in neighbor lists.
- Win check: every cell visited once, numbers in order, path ends on the last number.
- Levels: a Node build script makes a random Hamiltonian path (backbite moves). It adds numbers or walls until a depth-first solver finds exactly one solution. My Python test: 5x5 to 7x7 under 1 second, 54 cube cells 6 to 14 seconds. Never solve at runtime.
- Input: step the path by direction from its head cell, so wrap and cube edges work. Pointer.getInterpolatedPosition() keeps fast drags from skipping cells. Stepping back undoes.
- Rotation: keep logic in board space and tween a Container's angle in 90 degree steps. Map the pointer with getLocalPoint (in 3.80 and 4.1.0 docs). Keep numbers upright. Phaser 4 made Math.TAU a full circle, so use Math.PI_OVER_2.
- Moving dots: script jumps offline. Jump a number only to an empty cell on the verified solution path. Ring the target about 2 seconds early and rewind the stroke if needed. Random-cell jumps left 46 percent of my test boards unsolvable.
- Wrap: neighbors modulo board size, edge ticks on both sides. Wrap boards needed 9 to 11 numbers against 6 to 8 flat.
- Cube: Phaser 4 removed Mesh and Plane, and enable3d lists Phaser 3 only. Cheapest robust build: a flat six-face net with matching edge markers. Tween faces into a new layout to turn it over. Edge neighbors come from 3D fold math, tested for 1 to 5 cells per side.

**Ideas for our levels**
- Batch 1 is one shift of five or six tickets, one new twist each: flat, walls, rotating, moving dots, cube. Wrap is optional.
- Early twist tickets cannot fail. The clock only lowers the star rating.
- Add a quota bar, Undo, Reset, a hint and an end-of-shift summary.

**Repos studied (for patterns only)**

| Repo | License | Pattern we learned |
| --- | --- | --- |
| [thomasahle/numberlink](https://github.com/thomasahle/numberlink) | AGPL-3.0 | Generate paths, then reject ugly shapes. Solver does not prove uniqueness. |
| [amoralesc/flow](https://github.com/amoralesc/flow) | MIT | Stroke state machine: extend, step back to undo, press mid-path to truncate. |
| [hillhack/LinkedinZipSolver](https://github.com/hillhack/LinkedinZipSolver) | None found | Zip as integer grid plus wall pairs, depth-first search. |
| [leymbda/numberlink](https://github.com/leymbda/numberlink) | None found | Warp and Bridge as typed edges. |

Sources: [Numberlink](https://en.wikipedia.org/wiki/Numberlink) · [Phaser 4 migration](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know) · [Phaser Pointer docs](https://phaser.io/oss/docs/api-documentation/class/input-pointer.md)
