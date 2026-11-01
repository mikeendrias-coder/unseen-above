# Node network puzzles with bandwidth limits (satellite puzzle batch 3)

> Research date: 2026-11-01. Phaser checked: 4.2.1 (cloned source, MIT). Repos were cloned with `git clone --depth 1` into `/home/claude/repos/network_puzzles/<repo>` and only read, never run or built. The turn's web search budget ran out late, so Uplink/Hacknet and a few other precedents are unverified (see the last section).

## 1. Precedents: routing flow through a network with capacity limits

### Takeaway
Verified precedents fall into two families: node-capacity games with an overload timer (Mini Metro, Mini Motorways) and link-capacity displays with printed numbers or lanes (Hashiwokakero, Factorio belts). I found no game that is a pure max-flow puzzle, so batch 3 would be a hybrid of both families.

### Cited Findings
- Mini Metro: stations of different shapes appear at random, passengers appear as smaller shapes beside stations, and the player connects stations with lines and trains. Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Metro capacity: a station holds "typically six" passengers before it overcrowds; the game ends if a station stays overcrowded for an extended period (no exact timer given); "time may be paused to reroute lines or move trainsets across lines". Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Metro budget: each in-game week the player gets rolling stock and assets (tunnels, bridges, new lines, interchanges); interchanges and other upgrades raise a station's capacity and loading speed. Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Metro modes: Normal ends when a station overcrowds; Extreme locks lines and assets once placed; Endless means "stations never overcrowd"; Creative is a sandbox. Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Metro (2014 early build, as described by a transit planner): the player draws lines but cannot site stations; "Under any fixed budget, frequency and extent are inversely related"; crowding appears "as a clockface loop on the station"; upgrades are an extra line or a boost to a line's speed and capacity; the game ends when a station fails from overcrowding. Source: [Human Transit](https://humantransit.org/2014/03/the-lessons-of-mini-metro.html)
- Mini Metro obstacles: rivers and water must be crossed with a limited supply of tunnels or bridges. Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Motorways: the player links each house to a building of the same color; buildings have capacity limits (square hold seven pins, circular hold ten); exceeding the limit starts a warning timer; vehicles reaching a destination slow the timer; the game ends when a building's warning timer fills. Source: [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)
- Mini Motorways tools: each week the player picks one of two upgrades (road tiles plus sometimes a special tool); reviewers said traffic lights "often made traffic worse"; Rock Paper Shotgun said car horns act as helpful audio cues for network problems. Source: [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)
- Mini Motorways design intent: the team wanted to bring "this minimalist approach" from Mini Metro to other transport problems; Endless Mode is "Stress-free"; there are "colourblind and night modes"; Expert Mode uses "limited upgrades". Source: [Dinosaur Polo Club press kit](https://dinopoloclub.com/?p=31)
- Mini Motorways pace: Pocket Gamer called the colorblind mode a "nice touch" but criticised the frantic pace. Source: [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)
- Hashiwokakero rules: numbered islands (1 to 8), "At most two bridges connect a pair of islands," bridges must not cross anything, all islands must form one connected group, each island's bridge count must equal its number; published by Nikoli, first in issue #31 (September 1990); deciding solvability is NP-complete. Source: [Wikipedia: Hashiwokakero](https://en.wikipedia.org/wiki/Hashiwokakero)
- Simon Tatham's Portable Puzzle Collection includes Bridges ("Connect all the islands with a network of bridges"), Net ("Rotate each tile to reassemble the network") and Netslide; the whole collection is MIT-licensed with source available. Source: [Tatham's collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/)
- Factorio: the basic transport belt has a max throughput of 15 items/s (two lanes) and "Consistently holds 8 items per tile"; version 0.17.0 raised throughput from 13.33 to 15. Source: [Factorio wiki: Transport belt](https://wiki.factorio.com/Transport_belt)
- shapez (low confidence, partial community wiki page): says the real belt rate is "2 items / second" and that an item on a dead-end belt halts and causes a backlog; page does not describe upgrades or any on-screen throughput indicator. Source: [shapez wiki: Belt](https://shapezio.fandom.com/wiki/Belt)
- Opus Magnum: solutions are "ranked against other players based on three factors: speed in cycles, cost in G, and area in tiles"; "The player can advance with any working solution to each problem". Source: [Wikipedia: Opus Magnum](https://en.wikipedia.org/wiki/Opus_Magnum)
- Kerbal Space Program: version 1.2 "Loud And Clear" (released 11 October 2016) "main new features include communication satellites, relay systems, and KerbNet" (the article does not use the word CommNet). Source: [Wikipedia: Kerbal Space Program](https://en.wikipedia.org/wiki/Kerbal_Space_Program)
- RemoteTech (KSP mod): requires "unmanned vessels have a connection to Kerbal Space Center (KSC) to be able to be controlled"; imposes a signal delay; running scripts keep executing after a link is lost; messaging between vessels needs a valid connection and arrives with a delay. Source: [kOS docs: RemoteTech addon](https://ksp-kos.readthedocs.io/en/latest/addons/RemoteTech.html)
- Uplink: the Wikipedia article does not describe any connection, bounce or trace mechanic. Source: [Wikipedia: Uplink](https://en.wikipedia.org/wiki/Uplink_(video_game))

### Inferences
- Capacity lives on nodes in Mini Metro and Mini Motorways (6 passengers, 7 or 10 pins) and on links in Hashi (2 bridges) and Factorio (15 items/s). A bandwidth puzzle needs both a link limit and a sink demand, so it borrows from both.
- The overload cue that works in both Dinosaur Polo Club games is a timer or ring on the overloaded node that drains when service improves. This maps to a source or relay backlog in our puzzle.
- Hashi is the best non-gamer-friendly template for printed capacity: the number on the node is the rule, and no text is needed.
- Opus Magnum's "any working solution advances, optimizing is optional" is a good template for a calm, mundane puzzle: pass/fail gate plus an optional par.
- No pure max-flow puzzle game turned up, so there is no direct precedent for flow splitting across parallel paths. That is a teaching burden: puzzle 1 must show a split.

### Gaps
- Uplink and Hacknet bounce routing: not verified. Wikipedia's Uplink article has no mechanic description and the search budget ended before I could find another source.
- Laser Maze, Linelight, Infinifactory, Pipe Mania, Flow Free: not researched (budget; laser content likely belongs to another track).
- No small non-gamer-friendly puzzle with explicit per-link bandwidth turned up beyond Hashi and Factorio. The one broad search for "network flow puzzle game" returned academic papers, not games.
- No Dinosaur Polo Club developer talk was found. The Gfinity "making of Mini Motorways" page failed to fetch.
- shapez throughput figures rest on one partial community page.
- KSP CommNet specifics (range rules, line of sight) are blocked; see the last section.

## 2. Core loop options: which variants are clearest for non-gamers

### Takeaway
The clearest loop is plan-then-run with one verb: switch candidate links on or off under a link budget, with capacity printed on every link and demand printed on every sink, and the game routes the flow itself. This matches the one-verb, pausable, forgiving style that critics praised in Mini Metro and that Opus Magnum uses for gating.

### Cited Findings
- Critics praised Mini Metro for its "intuitive interface, simple gameplay, and minimalist approach". Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Metro offers modes without failure (Endless) and allows pausing to reroute. Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Motorways Endless Mode is described as "Stress-free"; Pocket Gamer criticised the frantic pace of the standard mode. Source: [Dinosaur Polo Club press kit](https://dinopoloclub.com/?p=31); [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)
- Mini Motorways: extra control tools can backfire (traffic lights "often made traffic worse" per reviewers). Source: [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)
- Hashiwokakero is a one-verb game (place one or two bridges) whose entire rule set fits in four sentences. Source: [Wikipedia: Hashiwokakero](https://en.wikipedia.org/wiki/Hashiwokakero)
- Opus Magnum lets the player advance with any working solution and treats optimizing as optional. Source: [Wikipedia: Opus Magnum](https://en.wikipedia.org/wiki/Opus_Magnum)
- Mini Metro's designers deliberately avoided hand-built levels and heavy art, favoring "procedurally generated levels and abstract visual styles". Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))

### Inferences
Variants, ranked for non-gamers (my judgment, not tested):

| Variant | Player verb | Checkable by | Clarity for non-gamers | Verdict |
| --- | --- | --- | --- | --- |
| A. Switch candidate links on or off under a budget; game auto-routes flow | Toggle a link | Max-flow, plus brute force over subsets | Highest: one verb, numbers everywhere | Recommended |
| B. Player assigns each stream to a route | Draw routes | Multi-commodity flow (harder to verify) | Medium: more steps, easy to misroute | Not recommended |
| C. Real-time dispatch with overload timers (Mini Metro style) | Draw and redraw under pressure | Simulation only | Lower: pace stress | Only as an optional finale |
| D. Spend points to raise link capacity | Upgrade a link | Min-cost or knapsack-like search | Medium: second verb | Add only after puzzle 3 |

- Show candidate links as dotted "possible links" the player clicks. This avoids free-form drawing errors, keeps authoring small, and makes brute-force verification possible.
- Failure should be "short by N" with the bottleneck glowing, not a game-over. Add undo and reset, no timer.
- Provide an optional par (fewest links) rather than a score, following Opus Magnum's optional optimization.
- Budget as a link count (for example "Links left: 4") is easier to read than a currency amount.
- Overload cue for plan-then-run: unsent packets pile up as dots beside the source (like crowding at a Mini Metro station) and the saturated links pulse.
- Packet and node labels should stay neutral. What the packets represent is a story call for Michael.

### Gaps
- No playtest data or usability research on non-gamer comprehension of flow puzzles was found. The ranking above is design inference. Michael should try the first prototype on one non-gamer.

## 3. Space flavor: which twists add fun and which add confusion

### Takeaway
Static line-of-sight blocking by a planet is cheap and clear and gives a geometric reason for missing links. Orbit windows work only as one late, pre-announced twist. Latency should be visual only. Congestion is the core mechanic, not a twist.

### Cited Findings
- KSP 1.2 added "communication satellites, relay systems, and KerbNet". Source: [Wikipedia: Kerbal Space Program](https://en.wikipedia.org/wiki/Kerbal_Space_Program)
- RemoteTech makes uncrewed craft controllable only with a link to the base, imposes signal delay, and `DELAY(vessel)` "returns shortest possible delay"; scripts already running keep executing after a link is lost. Source: [kOS docs: RemoteTech addon](https://ksp-kos.readthedocs.io/en/latest/addons/RemoteTech.html)
- Mini Metro uses an obstacle plus a limited remedy: water must be crossed with a limited supply of tunnels or bridges. Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Motorways treats bridges and tunnels as single tools covering a stretch of road regardless of length. Source: [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)
- Phaser 4.2.1 ships `Phaser.Geom.Intersects.LineToCircle` (`src/geom/intersects/LineToCircle.js`) for segment versus circle tests, which covers a planet disc blocking a link. Source: [phaserjs/phaser](https://github.com/phaserjs/phaser)
- Mini Motorways reviewers criticised traffic lights for making traffic worse, an example of a control that adds noise to a flow lesson. Source: [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)

### Inferences
Ranking by fun versus confusion:
- Planet blocks line of sight (static): fun, low confusion. Draw the planet disc and grey out links whose segment crosses it. The remedy is a relay node, like a tunnel in Mini Metro. Cost: one geometry test per candidate link at load time.
- Orbit phases: moderate. Show "Phase A" and "Phase B" as two snapshots of the same board with different open links. One chosen link set must satisfy both. Verify by running max-flow twice. Avoid real-time moving nodes during planning.
- Links that open and close in real time: high confusion for non-gamers. Skip unless every window is shown on a visible timeline.
- Latency as a graded rule: adds a second metric and hides the capacity lesson. Keep it as flavor: packets take longer on long links.
- Congestion: this is the core. Show it as a saturated link plus backlog at the source.
- "No link, no control" from RemoteTech can be reused as framing for why a sink gets nothing without a path.
- The "dots that suddenly move" variant in batch 1 could echo here as a satellite hopping slots between phases. That is a mechanics suggestion only.

### Gaps
- CommNet range formula, antenna types and occlusion rules: blocked source (Anubis on the KSP wiki).
- Real-world relay satellite capacities and contact windows (ESA or NASA): not researched.
- No evidence found on how players rate RemoteTech's delay versus CommNet's simpler model. The KSP forum was not searched or fetched.

## 4. Verifying puzzles: max-flow, min-cost flow, simple JS implementations

### Takeaway
Run Edmonds-Karp (or Dinic) on a graph with a super source and super sink. Whole-number capacities give whole-packet flows. Use the residual graph to find the min cut and highlight the bottleneck. Brute-force link subsets at authoring time. Use min-cost flow only if links carry costs.

### Cited Findings
- Max flow definition: "The maximum flow problem is to route as much flow as possible from the source to the sink"; "The capacity of an edge is the maximum amount of flow that can pass through an edge". Source: [Wikipedia: Maximum flow problem](https://en.wikipedia.org/wiki/Maximum_flow_problem)
- Integral flow theorem: "If each edge in a flow network has integral capacity, then there exists an integral maximal flow". Source: [Wikipedia: Maximum flow problem](https://en.wikipedia.org/wiki/Maximum_flow_problem)
- Complexity table: Edmonds-Karp (1969) O(VE^2); Dinic (1970) O(V^2 E) for arbitrary capacities, and a smaller bound for unit capacities. Source: [Wikipedia: Maximum flow problem](https://en.wikipedia.org/wiki/Maximum_flow_problem)
- Multiple sources and sinks: add a consolidated supersource and supersink with infinite-capacity edges. Source: [Wikipedia: Maximum flow problem](https://en.wikipedia.org/wiki/Maximum_flow_problem)
- Vertex capacity: split each vertex into an in-node and an out-node and put the capacity on the edge between them. Source: [Wikipedia: Maximum flow problem](https://en.wikipedia.org/wiki/Maximum_flow_problem)
- Max-flow min-cut: "The maximum value of an s-t flow is equal to the minimum capacity over all s-t cuts"; to find a min cut, take A as the vertices reachable from s in the residual graph; every edge leaving A is saturated and every edge entering A carries zero flow. Source: [Wikipedia: Max-flow min-cut theorem](https://en.wikipedia.org/wiki/Max-flow_min-cut_theorem)
- Dinic: BFS builds a level graph each phase, DFS with a per-vertex pointer finds a blocking flow, fewer than V phases, "O(V^2 E)" overall, and "O(E sqrt V)" on unit networks. Site text is CC BY-SA 4.0 (do not copy text or code). Source: [cp-algorithms: Dinic](https://cp-algorithms.com/graph/dinic.html)
- Min-cost flow: successive shortest paths with reverse edges carrying negated cost; SPFA/Bellman-Ford handles negative edges; potentials plus Dijkstra improve it; running time "O(F m n)" with Bellman-Ford and "O(mn + F m log n)" with potentials; also "generally exponential in the size of the input" in the worst case. Source: [cp-algorithms: min-cost flow](https://cp-algorithms.com/graph/min_cost_flow.html)
- Repo read, `packages/dinic/src/dinic.ts` in guanghechen/algorithm.ts (MIT, TypeScript): edges stored in one array as {from, to, cap, flow}; each node keeps a list of edge indexes; every `addEdge` appends a forward edge and a zero-capacity reverse edge at the next index, and the code reaches the partner with index xor 1; BFS fills `dist` levels, a `cur` array is the per-node current-arc pointer, `maxflow()` loops BFS then DFS and caches by a modified-timestamp; `mincut()` returns edges whose tail was reached in the last BFS and whose head was not, with capacity above zero. Source: [guanghechen/algorithm.ts](https://github.com/guanghechen/algorithm.ts)
- License check: root `LICENSE` says "MIT License" and `packages/dinic/package.json` says `"license": "MIT"`. Source: [guanghechen/algorithm.ts](https://github.com/guanghechen/algorithm.ts)
- Hashiwokakero solvability is NP-complete, and a solution can be found with integer linear programming. Source: [Wikipedia: Hashiwokakero](https://en.wikipedia.org/wiki/Hashiwokakero)

### Inferences
- Edmonds-Karp is the easiest to write and debug (BFS on the residual graph, augment along the shortest path). Dinic is a drop-in upgrade. For about 20 nodes and 40 links either finishes in microseconds; the worst-case bounds are loose.
- Own-words pseudo-code for the runtime check:
  - Build arcs in pairs: forward with capacity c, reverse with 0; partner of arc i is i xor 1.
  - Repeat: BFS from the source over arcs with remaining capacity, remembering the arc used to reach each node. Stop if the sink is not reached. Push the smallest remaining capacity along the path, subtract it from forward arcs and add it to reverse arcs.
  - Load on a link = original capacity minus remaining capacity. Use this for dot density and "3/4" labels.
  - Min cut: after the last BFS, the visited set is A. Links with tail in A and head outside A are the bottleneck.
- Undirected links: give each direction capacity c (one arc pair with c on both sides). Directed links need only one direction.
- Success test with a super source and super sink: supply edges carry each source's output, demand edges carry each sink's requirement, and the level passes when max flow equals total demand.
- Authoring check: with n candidate links and a budget of k links, brute force all subsets. 12 choose 5 is 792 runs and 14 choose 6 is 3,003, which is instant. This proves solvability, counts solutions (to avoid levels with many trivial answers), and gives the par.
- Hashi's NP-completeness is a reminder that tiny rule sets can be hard. Our level generator should stay hand-authored and brute-force verified rather than random.
- Write the solver from scratch in plain JS (about 40 lines). Do not copy the cp-algorithms code (CC BY-SA) or any repo.
- Keep the solver independent of Phaser so it can be tested in Node.

### Gaps
- I read one TypeScript Dinic only (algorithm.ts). I did not find or read a small plain-JS max-flow library. The GitHub topic page "flownetwork-algorithms" appeared in search results but was not opened.
- The cp-algorithms Edmonds-Karp article was not fetched; complexity comes from Wikipedia.
- No timings measured, because running cloned code is not allowed.

## 5. Readability: load, thickness, color, moving packets, numbers

### Takeaway
Encode the static limit as width or lane count, the live load as moving dot density with a count on demand, and state as color plus a second cue (dash, pulse, icon). Show overload at the node, as Mini Metro does with a ring and Mini Motorways with a timer.

### Cited Findings
- Sankey diagrams use arrow width "proportional to the flow rate of the depicted extensive property," and "using colors for different types of flows lets the diagram express additional variables". Source: [Wikipedia: Sankey diagram](https://en.wikipedia.org/wiki/Sankey_diagram)
- WCAG 1.4.1: "Color is not used as the only visual means of conveying information"; colors that differ in lightness can serve as an extra distinction if they reach a 3:1 contrast ratio; where content depends on telling apart a specific color, "an additional visual indicator will be required regardless of the contrast ratio". Source: [W3C: Understanding SC 1.4.1](https://w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- Mini Metro shows crowding as a clockface loop on the station. Source: [Human Transit](https://humantransit.org/2014/03/the-lessons-of-mini-metro.html)
- Mini Metro art uses "straight lines and bold colours" resembling modern transit maps. Source: [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Mini Motorways shows overload with a warning timer that drains as cars arrive; offers colorblind and night modes; car horns serve as audio cues. Source: [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways); [Dinosaur Polo Club press kit](https://dinopoloclub.com/?p=31)
- Factorio's basic belt "Consistently holds 8 items per tile" and has a stated limit of 15 items/s (two lanes). Source: [Factorio wiki: Transport belt](https://wiki.factorio.com/Transport_belt)
- Hashiwokakero encodes link capacity as one or two parallel bridges and demand as a number on the island. Source: [Wikipedia: Hashiwokakero](https://en.wikipedia.org/wiki/Hashiwokakero)
- Lane pattern in a repo: each station in mini-metro-web has 8 directional tracks, each track has 3 rails, and when the preferred rail is occupied it creates an "extra rail" so parallel lines never overlap (`DataStructure/Track.ts`, `Rail.ts`). Source: [RyanEdo/mini-metro-web](https://github.com/RyanEdo/mini-metro-web)
- In Phaser 4.2.1, `Graphics.js` has `lineStyle`, `lineBetween`, `strokeLineShape`, `fillCircle`, `strokePoints`, `lineGradientStyle` and `generateTexture`, but no dash method in its method list. Source: [phaserjs/phaser](https://github.com/phaserjs/phaser)

### Inferences
Suggested mapping (a starting point for Michael to approve or reject):

| Quantity | Encoding | Why |
| --- | --- | --- |
| Link capacity (static) | Stroke width or 1 to 3 parallel lanes, plus a small number | Width encodes quantity (Sankey); lanes echo Hashi and need no legend |
| Link load (live) | Dot count and spacing on the link; "load/capacity" on hover and always on saturated links | Dots show direction and rate; numbers remove guessing |
| Saturated link | Fill change plus pulse or a "full" tick | Not color alone (WCAG 1.4.1) |
| Blocked link (planet) | Dashed or dotted line with a small icon | Dashes must be drawn by hand in Graphics |
| Sink demand | Bar with "have / need" text | Same number format as links |
| Bottleneck after failure | Glow on min-cut links plus the line "short by N" | Min cut is exactly the bottleneck |
| Overload | Packets queue beside the source as dots | Echoes the Mini Metro station crowd |

- Show labels on saturated or hovered links only, to avoid clutter at low resolution.
- One dot equals one packet per tick. Use dot spacing of (link length / flow) so rates are readable at a glance.
- Use a bitmap font for numbers if the game renders at a low pixel resolution (the aesthetics track handles fonts).

### Gaps
- No study of encodings for non-gamers was found. Choices are design inference.
- No Dinosaur Polo Club talk on readability was found; the Gfinity article failed to load.

## 6. Build approach in Phaser (Graphics, packets, hit-testing, drag-to-connect)

### Takeaway
Keep the flow solver pure JS. Draw links with one `Graphics` redrawn only when something changes, animate packet dots from a counter tween or an update loop, hit-test links manually with `PointToLine`, and build connections with pointer events plus a click-click fallback. All the APIs below exist in Phaser 4.2.1 source with v3-era `@since` tags.

### Cited Findings
- Version and license: `package.json` version 4.2.1, `"license": "MIT"`; `LICENSE.md` is "The MIT License (MIT)". Source: [phaserjs/phaser](https://github.com/phaserjs/phaser)
- Graphics API present in 4.2.1: `lineStyle(lineWidth, color, alpha)`, `lineBetween(x1, y1, x2, y2)`, `strokeLineShape(line)`, `fillCircle(x, y, radius)`, `strokeCircle`, `strokePoints`, `beginPath/moveTo/lineTo/strokePath`, `clear()`, `generateTexture(key, width, height)`. Source: [phaserjs/phaser](https://github.com/phaserjs/phaser) (`src/gameobjects/graphics/Graphics.js`)
- Performance note from Phaser's own skills file: "Graphics is expensive. Each frame the command buffer is replayed and geometry is rebuilt"; for static shapes call `generateTexture` and use a Sprite; `generateTexture` uses the Canvas API so gradient fills will not appear. Source: [phaserjs/phaser `skills/graphics-and-shapes/SKILL.md`](https://github.com/phaserjs/phaser)
- New in v4: Graphics has a `pathDetailThreshold` property. Source: [phaserjs/phaser migration guide](https://github.com/phaserjs/phaser) (`changelog/v4/4.0/MIGRATION-GUIDE.md`, section 12)
- `Phaser.Geom.Intersects.PointToLine(point, line, lineThickness = 1)` returns a boolean: "Checks if a Point falls between the two end-points of a Line, based on the given line thickness. Assumes that the line end points are circular"; accepts a Vector2 or point-like object; `@since 3.0.0`. Source: [phaserjs/phaser](https://github.com/phaserjs/phaser) (`src/geom/intersects/PointToLine.js`)
- `Phaser.Geom.Line.GetNearestPoint(line, vec, out)`: returns a Vector2 and "the returned point is projected onto the full line, not clamped to the segment endpoints"; `@since 3.16.0`. Source: [phaserjs/phaser](https://github.com/phaserjs/phaser) (`src/geom/line/GetNearestPoint.js`)
- Also present: `src/geom/line/GetPoint.js`, `src/geom/intersects/LineToCircle.js`, `Curves.Path` with `getPoint(t, out)`, `getLength()`, `getPoints()`, `getTangent()`, `lineTo()`. Source: [phaserjs/phaser](https://github.com/phaserjs/phaser)
- `PathFollower` is a Sprite subclass; its component "uses an internal Tween" created with `this.scene.sys.tweens.addCounter(config)`; `startFollow(config or duration, startAt)` accepts `duration`, `from`, `to`, `startAt`, `rotateToPath`, `rotationOffset`, `positionOnPath`; created with `this.add.follower(path, x, y, texture)`. Source: [phaserjs/phaser](https://github.com/phaserjs/phaser) (`src/gameobjects/components/PathFollower.js`, `skills/curves-and-paths/SKILL.md`)
- `TweenManager.addCounter(config)` exists ("Number tween (no target)"). Source: [phaserjs/phaser](https://github.com/phaserjs/phaser) (`src/tweens/TweenManager.js`, `skills/tweens/SKILL.md`)
- Input (Phaser skills file): `this.input.on('pointerdown' | 'pointermove' | 'pointerup', ...)`; `sprite.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains)`; `this.input.topOnly` defaults to true; `dragDistanceThreshold` defaults to 0; drag events `dragstart`, `drag`, `dragend`, plus `dragenter`, `dragleave`, `dragover` for drop zones. Source: [phaserjs/phaser `skills/input-keyboard-mouse-touch/SKILL.md`](https://github.com/phaserjs/phaser)
- The Phaser repo ships a `skills/` directory of agent-oriented guides (cameras, animations, curves-and-paths, graphics-and-shapes, input, tweens, scenes, tilemaps, v3-to-v4-migration, v4-new-features and more). Source: [phaserjs/phaser](https://github.com/phaserjs/phaser)
- Phaser 3 to 4 changes: "The entire WebGL rendering pipeline from v3 has been replaced"; `Geom.Point` removed in favor of `Vector2` (all Geom classes now return Vector2); `Math.TAU` changed from PI/2 to PI*2; `roundPixels` now defaults to false (it was true in v3); FX and masks merged into filters; the news article dated 16 April 2026 does not mention Graphics, Tweens, Paths, Line or Intersects changes. Source: [Phaser: migrating from 3 to 4](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know); [phaserjs/phaser migration guide](https://github.com/phaserjs/phaser)
- Phaser's comparison article says tweens, input, cameras and scenes are likely unchanged and that "For a new project, there's no reason to start on Phaser 3". Source: [Phaser: Phaser 3 vs Phaser 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4)
- Repo read, mini-metro-web (React + SVG, a metro map building tool, not a game): the README describes creating a line by clicking a station, choosing "Create new line from this point," then clicking stations in sequence; code uses a function-mode enum with a mouse-down flag for station dragging; `Line.link(B, C)` picks rails per station direction. Source: [RyanEdo/mini-metro-web](https://github.com/RyanEdo/mini-metro-web)
- License check for mini-metro-web: no LICENSE file, no `license` field in `package.json`, no license text in either README. Source: [RyanEdo/mini-metro-web](https://github.com/RyanEdo/mini-metro-web)
- Repo read, JSPlanarity (Raphael SVG, planarity puzzle): vertices register their edges; a drag has start, move and end callbacks; moving a vertex calls `updateVisualisation` on each attached edge; GraphGenerator's check deactivates all edges, tests every edge pair, marks each crossing edge with an "intersecting" color, and returns the crossing count, which JSPlanarity.js reports in an alert (I did not trace whether anything calls it during a drag). License: `LICENSE.txt` is GNU GPL v3 and source headers say GPLv3+. Source: [mkroehnert/JSPlanarity](https://codeberg.org/mkroehnert/JSPlanarity)
- Triaged but not used: Lmendev/metro-b00da (MIT) is a Node console app that finds the shortest route between metro stations with Dijkstra, not a clone game. Source: [Lmendev/metro-b00da](https://github.com/Lmendev/metro-b00da); Daniel-Chin/Garaph is a Godot C# project with no LICENSE file found. Source: [Daniel-Chin/Garaph](https://github.com/Daniel-Chin/Garaph); aureliendrouet/puzzlegraph is a Unity project under MPL-2.0. Source: [aureliendrouet/puzzlegraph](https://github.com/aureliendrouet/puzzlegraph)

### Inferences
- Recommended structure:
  - `solver.js`: pure functions `maxFlow(...)` and `minCut(...)`, plus the subset check. No Phaser imports.
  - Scene state: `nodes[]`, `links[]` with `on` flags, `budgetLeft`.
  - `linkLayer` (Graphics): redraw only on toggle, run, or hover change. `packetLayer`: dynamic dots.
- Packets: do not use one `PathFollower` Sprite per dot. Drive dots from one update loop or a few `addCounter` tweens, and place each with `Geom.Line.GetPoint`. Bake a dot texture once with `generateTexture`.
- Link picking: loop over the few links and call `PointToLine` with thickness near half the stroke width plus 6 to 10 px of slack. `GetNearestPoint` would give wrong hits beyond the segment ends.
- Node picking: `setInteractive` with a Circle hit area. `topOnly` already prevents click-through.
- Drag-to-connect: `pointerdown` on a node stores the source. `pointermove` redraws a rubber band with `lineBetween`. `pointerup` finds the node under the pointer by distance and accepts the link only if it is a candidate and budget remains. Add click source then click target for touch and for accessibility.
- Planet occlusion: test each candidate link segment against the planet circle with `LineToCircle` once when the puzzle loads.
- Pixel look: Graphics lines are smooth strokes. A low internal resolution with pixel-art scaling, or drawing links as stretched pixel sprites, is the aesthetics and tech-foundation tracks' call. The v4 `roundPixels` default change matters here.
- Version: every API above is in 4.2.1 and carries a v3 `@since` tag, and the v4 migration guide does not list them as changed. The only differences found that touch this work are `Geom.Point` removal (Vector2 now), `Math.TAU`, and `roundPixels`. Code written to these names should run on either version, but I did not run it.

### Gaps
- The sparse clone of `phaserjs/phaser3-examples` failed (exit code 128) on the first attempt and was not retried, so no Phaser 3 example code was read. The Phaser 4.2.1 source and skills files were used instead.
- I did not compare against the Phaser 3.90 source. The v3 claims rest on `@since` tags and the migration guide.
- No code was run, so none of the Phaser snippets or performance claims are tested here.
- `Geom.Line.GetPoint` signature was not opened (file existence confirmed only).

## Needs Michael or Chrome (blocked or unverified sources)
- `https://wiki.kerbalspaceprogram.com/wiki/CommNet`: WebFetch returned an Anubis bot-protection page ("Access Denied", error code 9e4edb5b6b850c41). Not circumvented. Please open it in Chrome and capture: antenna range rule, direct versus relay antennas, line-of-sight blocked by planets and moons, what happens with no signal, and the effect of signal strength.
- `https://wiki.kerbalspaceprogram.com/wiki/Tutorial:RemoteTech2`: same Anubis page on the second try. Approach stopped. Useful for RemoteTech's delay and line-of-sight rules.
- `https://www.Gfinityesports.Com/features/the-making-of-mini-motorways-steam/`: WebFetch failed with a client error. Optional; may hold Dinosaur Polo Club design comments on readability.
- Uplink and Hacknet bounce routing: the turn's web search budget ended before I could find a source. Wikipedia's Uplink article has no mechanic description. A follow-up search is needed if Michael wants these two covered.
- `phaserjs/phaser3-examples` sparse clone failed once (exit code 128); not retried.
