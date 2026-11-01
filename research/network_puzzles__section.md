## Node network puzzles (batch 3)

Build batch 3 as plan-then-run: the player switches on a few capacity-labeled links, then a max-flow check grades the result. This keeps one verb, no timer, and one deterministic answer.

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game)) | Draw lines only. Stations hold about six passengers. Pausing is allowed. | One verb. Capacity at the node. Overload as a ring. |
| [Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways) | Buildings hold 7 or 10 pins. Past that, a warning timer runs and arriving cars slow it. | Visible limits. A backlog that drains. Colorblind modes. |
| [Hashiwokakero](https://en.wikipedia.org/wiki/Hashiwokakero) | Island numbers state the exact bridge count. At most two bridges per pair. | Numbers on nodes. One to three lanes per link. |
| [Factorio](https://wiki.factorio.com/Transport_belt) | States belt throughput: 15 items per second on the basic belt. | Print capacity as a number and as fill. |
| [Opus Magnum](https://en.wikipedia.org/wiki/Opus_Magnum) | Any working solution advances. Cost, cycles, area ranked on the side. | Pass/fail gate. Optional par: fewest links. |
| [Kerbal Space Program](https://en.wikipedia.org/wiki/Kerbal_Space_Program) | Version 1.2 added communication satellites and relays. The RemoteTech mod needs a base link and adds signal delay. | "No link, no control" as flavor. Do not grade delay. |

**How we build it**
- Write the solver as plain JS with no Phaser, so Node can test it. Input: nodes, candidate links with capacity, a link budget.
- Add a super source and super sink. Run Edmonds-Karp, O(VE²). Dinic, O(V²E), only if graphs grow. Whole-number capacities give whole-packet flows.
- On failure, glow the min cut: links leaving the set still reachable from the source in the residual graph. That is the bottleneck.
- At authoring time, brute-force every k-link subset (12 choose 5 is 792 runs) to prove solvability and set the par.
- Draw capacity as stroke width or one to three lanes, plus a number. Show load as moving dots. Never use color alone (WCAG 1.4.1). Graphics has no dash method, so draw blocked-link dashes by hand.
- Phaser: one `Graphics` for links, redrawn only on change. Phaser warns it is rebuilt every frame. Dots use `tweens.addCounter` plus `Geom.Line.GetPoint`.
- Pick links with `Geom.Intersects.PointToLine(pointer, line, thickness)`. `Line.GetNearestPoint` does not clamp to the segment. Drag to connect with `pointerdown`, a `lineBetween` rubber band on `pointermove`, and a distance test on `pointerup`. Also allow click, click.
- Phaser 4.2.1 notes: `Geom.Point` is gone (Vector2 now) and `roundPixels` defaults to false.

**Ideas for our levels**
- Puzzle 1 teaches: one source, links of capacity 3 and 2, sink needs 5.
- Puzzle 2: a shared relay fails and the cut glows. A bypass link fixes it.
- Puzzle 3: six candidate links, four allowed, two sinks.
- Puzzle 4: a planet disc blocks candidate links (`Geom.Intersects.LineToCircle`). Route around it with a relay.
- Last puzzle only: orbit phases A and B open different links. One link set must satisfy both.

**Repos studied (for patterns only)**

| Repo | License | Pattern we learned |
| --- | --- | --- |
| [guanghechen/algorithm.ts](https://github.com/guanghechen/algorithm.ts) | MIT | Dinic with paired edges (index, index xor 1), a per-edge flow field we can show as load, min cut from the last BFS. |
| [phaserjs/phaser](https://github.com/phaserjs/phaser) | MIT | 4.2.1 source confirms every API above. Ships `skills/` guides written for coding agents. |
| [mkroehnert/JSPlanarity](https://codeberg.org/mkroehnert/JSPlanarity) | GPL-3.0 | Dragging a node redraws its edges; a check recolors crossing edges. Read only. |
| [RyanEdo/mini-metro-web](https://github.com/RyanEdo/mini-metro-web) | None found | Three parallel rails per station direction; lines built by click, click. Read only. |

Sources: [Max flow](https://en.wikipedia.org/wiki/Maximum_flow_problem) · [Min cut](https://en.wikipedia.org/wiki/Max-flow_min-cut_theorem) · [Dinic](https://cp-algorithms.com/graph/dinic.html) · [Sankey](https://en.wikipedia.org/wiki/Sankey_diagram) · [WCAG 1.4.1](https://w3.org/WAI/WCAG22/Understanding/use-of-color.html) · [Human Transit](https://humantransit.org/2014/03/the-lessons-of-mini-metro.html) · [Phaser 4 migration](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know) · [RemoteTech docs](https://ksp-kos.readthedocs.io/en/latest/addons/RemoteTech.html)
