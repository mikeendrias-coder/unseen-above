## Side-scroll levels: movement, traps, and detection

Build the side-scroll levels as a forgiving platformer where every lethal beam follows a fixed tell, charge, fire timeline. Hide the satellite by never drawing a beam's upstream end.

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [Mark of the Ninja](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules) | Binary seen or hidden, cones and noise always drawn | Draw every sensor range |
| [Stealth Inc](https://gamespot.com/reviews/stealth-inc-a-clone-in-the-dark-review/1900-6411880/), [Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero) | Goggles go red in light, cameras, lasers, one-hit deaths, checkpoint respawn | Player tint shows exposure, checkpoint per screen |
| [N (laser drone)](https://n.fandom.com/wiki/Laser_drone) | Harmless ray, about 1 s charge, then a beam fixed where you were seen | Our beam timeline and aim lock |
| [Jetpack Joyride](https://jetpackjoyride.fandom.com/wiki/Missile) | One button. Side missile tracks you, then locks (community wiki) | Edge warning that locks |
| [Celeste](https://maddymakesgames.com/articles/celeste_and_forgiveness/) | Hidden forgiveness: grace jump, buffered jump, corner nudge | Feel numbers below |
| [Limbo](https://www.gamedeveloper.com/game-platforms/gdc-europe-i-limbo-i-s-carlsen-on-making-players-your-worst-enemy-and-your-best-friend) | Two actions beyond walking, sound cues, early scenes teach | Teach before test |
| [Rayman Legends](https://www.gamedeveloper.com/audio/the-musical-box-27-game-music-level-design) | Music levels at a fixed run speed | Optional beat-synced final run |

**How we build it**
- Controls: Left/Right (or A/D), Jump (Space), Crouch (Down), E to interact. No sprint, no required holds.
- Feel (Celeste, MIT): coyote 0.1 s, jump buffer about 0.1 s (our guess), 0.2 s held-jump window, 4 px ceiling nudge. Half gravity near the apex. Same rate to start and stop, 65 percent in air.
- Fair hits: the lethal box is smaller than the body box (Celeste: 8x9 inside 8x11). Only the beam's bright core kills.
- Beam timeline: tell 0.6 s (thin line on the real path), charge 0.6 s (brighter, rising tone, aim locks), fire 0.35 s. Visual reaction is about 190 ms, so keep tells at 0.4 s or more.
- Hide the origin: start beams at wall ports or off camera, or pass them through a reticle. No steep beams or sky glow. Warning, glow, and hit zone share one line.
- Detection: range test, angle test, and tile line of sight, swept by a yoyo tween. Add a 0.5 s visible lock-on.
- One-way ledges: a second tile layer using `tile.setCollision(false, false, true, false)`. Arcade ignores overlap deeper than `tileBias` (16 px), so cap fall speed. Drop through by switching that collider's `active` off for 0.2 s.
- Beams: three `Graphics.lineStyle` strokes with ADD blend, hit test with `Phaser.Geom.Intersects.LineToRectangle`. Phaser 4 adds `enableFilters()` plus `filters.internal.addGlow()` (WebGL only). Phaser 3.60 used `postFX.addGlow()`.
- Safety: at most 3 flashes per second (WCAG 2.3.1). Never rely on color or sound alone.

**Ideas for our levels**
- Opening approach: one optional beam hits a wall so players learn tell, charge, fire. Cleaning robots teach jump rhythm.
- Earth level 2 (glasses on): glasses draw the same numbers the hit logic uses. One-way ledges, sweeping cones, a checkpoint per screen. The glasses-breaking trip is a scripted fall.
- Final run (no glasses): short sight radius, a rising hum plus an edge flicker as the tell, and pebbles that trigger sensors.
- Pace options for Michael: slow free walk, forced camera scroll, or beams pulsing on a beat.

**Repos studied (for patterns only)**

| Repo | License | Pattern we learned |
| --- | --- | --- |
| [NoelFB/Celeste](https://github.com/NoelFB/Celeste) | MIT | Grace timer, held-jump window, corner nudge, small hurtbox |
| [phaserjs/phaser](https://github.com/phaserjs/phaser) | MIT | One-way tiles via `collideUp`, `TILE_BIAS`, fixed 60 fps step |
| [wiserim/phaser-raycaster](https://github.com/wiserim/phaser-raycaster) | MIT file, ISC in package.json | Cone visibility: cast to every corner, sort by angle |
| [kagemoguri](https://github.com/TasukuTSUKIOKA/kagemoguri), [Transplant](https://github.com/jordy-trevor/Transplant) | None found | Exposure meter, pillar cover, facing-range-height sight test (ideas only) |

Sources: [Kumar](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules) · [Thorson](https://maddymakesgames.com/articles/celeste_and_forgiveness/) · [N wiki](https://n.fandom.com/wiki/Laser_drone) · [Phaser 4 migration](https://github.com/phaserjs/phaser/blob/master/skills/v3-to-v4-migration/SKILL.md) · [WCAG 2.3.1](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html) · [Reaction time](https://en.wikipedia.org/wiki/Reaction_time) · [Accessibility guidelines](https://gameaccessibilityguidelines.com/full-list/)
