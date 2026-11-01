## Sorting and catching packets (batch 2)

Build batch 2 as a lane-based sorting shift where the player sends each belt packet to a bin with one tap or key. It needs no physics engine and is easy to test.

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [Kaboom!](https://en.wikipedia.org/wiki/Kaboom%21_%28video_game%29) | One-axis catcher. Bombs speed up per catch. A miss costs a bucket. | Visible lives, speed ramp, optional pointer-follow round. |
| [Flight Control](https://en.wikipedia.org/wiki/Flight_Control) | One-finger input. Color and size set each aircraft's destination. More planes as score rises. | Type decides the bin. Start calm. |
| [Sugar, Sugar](https://www.pocketgamer.com/sugar-sugar/bart-bonte-brings-a-taste-of-flash-to-ios-and-android-with-sugar-sugar/) | Drawn lines steer sugar. Color filters force separate channels. | Physics-heavy. One optional special round at most. |
| [Severance MDR (fan wiki)](https://severance.wiki/mdr) | Pick a cluster, file it in numbered buckets. Rewards at 10, 25, 75, 100 percent. | Progress meter with milestone beats. Self-paced slow mode. |
| [Papers, Please](https://en.wikipedia.org/wiki/Papers%2C_Please) | Shift timer, changing rulebook, two free citations then rising fines. | Rule card per round. Soft penalties. |
| [Peggle](https://en.wikipedia.org/wiki/Peggle) | Bonus bucket on a fixed back-and-forth path. | One moving bonus bin on a looping tween. |
| [Shapez 2 Belt Filter](https://shapez2.wiki.gg/wiki/Belt_Filter) | Matching items pass straight, others divert. | Gate logic for later rounds. |

**How we build it**
- Loop: the front packet waits at a junction. An arrow key or a tap on a bin sends it. A full queue fails the round.
- Data: a `kinds` table (shape, color, glyph, bin) and a `rounds` table (length, speed, spawn gap), both editable JSON.
- Motion: add `speed * delta` each frame. One `gameSpeed` scalar drives the ramp and a slow-mode assist.
- Pool packets with `this.add.group({ classType, maxSize })`, `get()`, `killAndHide()`. Call `this.tweens.killTweensOf(obj)` first. Arcade bodies also need `disableBody(true, true)`.
- Optional Kaboom! round: Arcade `physics.add.overlap` against an immovable bin, gravity off, hitbox trimmed with `setSize` and `setOffset`.
- Input: one `pointermove` handler covers mouse and touch. Add `addCapture()` for arrow keys. Enlarge bin hit areas with `setInteractive`.
- Feedback: one shared `this.add.particles(...)` emitter with `emitting: false`, then `explode(n, x, y)`. Flash errors with `setTint` plus `setTintMode` (v4 removed `setTintFill`).
- Set `pixelArt: true`. The v4 guide says `roundPixels` now defaults to false and Canvas is deprecated. Use Matter only for a Sugar, Sugar round.

**Ideas for our levels**
- Round 1: two bins, sort by shape. Round 2: three bins. Round 3: the rule card swaps mid-round.
- Identity is silhouette, color, and a letter. Bins repeat all three. Never color alone.
- Ramp: sparse spawns for 15 seconds, then speed 1x to 2x. Beltline Panic reaches 2.8x in 75 seconds. Tune by play.
- Two free errors, then quota penalties. A failed round retries only that round. Add a no-fail practice round.
- Reuse one HUD (quota meter, timer, rule card) across batches 1 to 3.

**Repos studied (for patterns only)**

| Repo | License | Pattern we learned |
| --- | --- | --- |
| [henryhale/mdr](https://github.com/henryhale/mdr) | MIT | Each cell stores its cluster id, so one click selects a cluster. Wrong clicks only play a sound. |
| [Dragon2000v/Apple-Catcher](https://github.com/Dragon2000v/Apple-Catcher) | MIT per README, no LICENSE file | Arcade overlap, trimmed hitbox, speed step per catch, timer plus target. |
| [S3-D1/beltline-panic](https://github.com/S3-D1/beltline-panic) | MIT | Items follow path progress, no physics. Warm-up, speed curve, and queue-full fail live in one config. |
| [JuulH/FallingSand](https://github.com/JuulH/FallingSand) | None found | Grains try ordered moves. Scanning every particle per check is slow; use a grid. |

Sources: [Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/) · [Phaser 4 migration guide](https://unpkg.com/phaser@4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md) · [Phaser Arcade docs](https://unpkg.com/phaser@4.2.1/skills/physics-arcade/SKILL.md) · [Phaser particles docs](https://unpkg.com/phaser@4.2.1/skills/particles/SKILL.md) · [Firemint interview](https://www.nintendolife.com/news/2010/02/interviews_firemint_flight_control) · [Papers, Please citations](https://papersplease.fandom.com/wiki/Citation)
