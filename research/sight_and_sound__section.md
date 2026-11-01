## Reveal vision and its loss

Make the glasses a thin overlay that shows only lasers and sensor ranges, fades with distance, and has no battery. Break them with a visible event, then hand over pebbles.

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [Metal Gear Solid](https://samurai-gamers.com/?p=285175) | Lasers stay hidden until goggles or cigarette smoke show them. | Beams are invisible by default. Glasses add a layer. |
| [Batman: Arkham Asylum](https://www.gameinformer.com/b/news/archive/2010/07/14/rocksteady-to-tone-down-x-ray-vision-in-arkham-asylum-2.aspx) | Art director said players used X-ray vision all game and missed the level art. | Reveal hazards only. Never tint the whole world. |
| [Hitman: Absolution](https://entertainium.co/2012/12/17/hitman-absolution-review/) | Instinct meter "runs out fairly quickly." | No meter, no extra button. |
| [Metroid Dread](https://en.wikipedia.org/wiki/Metroid_Dread) | An enemy strips most abilities. A temporary power eases the return. | Show the break on screen. Give pebbles at once. |
| [Castlevania: Symphony of the Night](https://kotaku.com/the-castlevania-game-that-changed-everything-1821969215) | Death takes the weapons, so one-hit enemies need many punches. | The next hazard must show the new rule. |
| [Mark of the Ninja](https://en.wikipedia.org/wiki/Mark_of_the_Ninja) | Sound is expanding circles. New Game Plus hides the noise radius. | Hardcore mode hides rings and map memory. |
| [Dark Echo](https://gamedeveloper.com/design/what-dark-echo-do-that-you-should-do-in-your-game-either) and [Perception](https://en.wikipedia.org/wiki/Perception_(video_game)) | Sound draws the world. Tapping too often is risky. | A pebble landing reveals a ring. Pebbles are limited. |
| [Darkwood](https://gamecritics.com/daniel-weissenberger/darkwood-review/) | Sound covers blind spots. Audio-only threats exclude deaf players. | Give every sound cue a visual twin. |

**How we build it**
- Keep one hazard list (type, geometry, timing, tells). Glasses only toggle an overlay Container with `setVisible`. Hazards always exist.
- Draw beams as a 2 px line plus a 6 px glow at 0.15 alpha, cones at 0.08 (cyber-heist values). Fade alpha with distance, full inside 6 tiles.
- Sight limit: a dark RenderTexture over the world. Erase a soft light image at the player each frame. Phaser 4 buffers draws, so call `render()`.
- Phaser 4 polish, WebGL only: `camera.filters.external.addVignette`, `filters.internal.addBlur`, `lights.addConeLight`, `filters.internal.addMask`. BitmapMask and `setMask` fail in v4 WebGL.
- Keep the kid sprite unaffected by darkness, as operation-good-boi does. Dim other things, never to invisible.
- Top-down throw arc (derived): ground position moves in a line, height z = 4 * peak * u * (1 minus u). Sprite at y minus z, shadow on the ground.
- One `noise` event per landing: x, y, loudness. Listeners subtract distance and door loss (Article-Zero: 0.25 per tile, 6 closed door).
- Create emitters in `create()`, or use a plain emitter. `scene.events` is not ready before boot.

**Ideas for our levels**
- Earth 1: introduce one laser, one camera cone, one trap door, each alone. Give every beam visible emitter nodes.
- Earth 2: add one pulsing laser (on/off timer). The trip stutters the overlay about 1.5 seconds, then it dies.
- Earth 3 (starting values): sight radius 2 to 3 tiles, 70 percent speed, 5 pebbles refilled at checkpoints. Open with a safe test hazard.
- Tells without glasses: emitter nodes, a hum that rises near beams, faint shimmer within 2 tiles, dust that flashes crossing a beam.

**Repos studied (for patterns only)**

| Repo | License | Pattern we learned |
| --- | --- | --- |
| [jarv/hex-map-demo](https://github.com/jarv/hex-map-demo) | MIT | Phaser 4 fog as per-tile alpha states. |
| [Ryuki-XD/cyber-heist](https://github.com/Ryuki-XD/cyber-heist) | MIT | Phaser 3 dark RenderTexture, MULTIPLY. Pulsing laser with toggled body. |
| [williamchen-pm/operation-good-boi](https://github.com/williamchen-pm/operation-good-boi) | MIT (code) | Phaser 3 Light2D needs enabling first. Guards dim but never vanish. |
| [luckythemonster/Article-Zero](https://github.com/luckythemonster/Article-Zero) | None found | Sound spreads by room graph. Caution at 1, alert at 4. |
| [phaserjs/phaser](https://github.com/phaserjs/phaser) | MIT | Confirmed v4 `addMask`, `addVignette`, `addBlur`, cone lights. |

Sources: [Filters skill](https://github.com/phaserjs/phaser/blob/master/skills/filters-and-postfx/SKILL.md) · [Cone lights doc](https://github.com/phaserjs/phaser/blob/master/docs/Phaser%204%20Cone%20Lights/Phaser%204%20Cone%20Lights.md) · [A.V. Club](https://www.avclub.com/out-of-focus-dismantling-detective-mode) · [Migration guide](https://github.com/phaserjs/phaser/blob/v4.0.0/changelog/v4/4.0/MIGRATION-GUIDE.md)
