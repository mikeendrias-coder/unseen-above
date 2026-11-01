## Views, checkpoints, deaths, and hardcore mode

Build each view as its own Phaser scene and switch at the door with a short fade. Respawn the kid within half a second at room-sized checkpoints.

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [Zelda II](https://en.wikipedia.org/wiki/Zelda_II:_The_Adventure_of_Link), [Link's Awakening](https://en.wikipedia.org/wiki/The_Legend_of_Zelda:_Link%27s_Awakening) | View changes when Link steps onto a cave or town spot. Awakening restarts at the last doorway entered. | The door is the view boundary and first checkpoint. |
| [Celeste](https://en.wikipedia.org/wiki/Celeste_(video_game)) | One-screen rooms with checkpoints between. Assist Mode: speed 50 to 100 percent, invincibility, skip chapter. | Instant respawn, plainly worded assists. |
| [Super Meat Boy](https://en.wikipedia.org/wiki/Super_Meat_Boy) | Infinite lives, immediate restart, short levels. | Dying costs seconds, not progress. |
| [Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero) | One-hit death, restart at last checkpoint, retries framed as foresight. | Fast restarts. Any framing is Michael's call. |
| [Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game)) | Plentiful checkpoints, optional gore filter, five-death achievement. | Tone setting and death budget. |
| [Shovel Knight](https://yachtclubgames.com/blog/check-point-design) | Invisible checkpoints every other screen felt "obsessive." Final ones are visible. | Visible, sparse checkpoints. |
| [Hollow Knight](https://hollowknight.wiki/w/Steel_Soul_Mode_(Hollow_Knight)) | Steel Soul: one life per save, unlocked after finishing. | Opt-in hardcore with a clear label. |

**How we build it**
- One Scene class per view. Declare `physics.arcade.gravity` in each scene's config: above 0 for side view, 0 for top-down. Scene config overrides game config.
- Switch with `cameras.main.fadeOut(300)`, wait for `camerafadeoutcomplete`, then `scene.start('EarthTop1', data)` and `fadeIn`. `scene.transition()` defaults to 1000 ms, blocks input, and fails if the target is active.
- Keep shared state in `this.registry`: checkpoint, deaths, hardcore, assists. Listen with `changedata-<key>`. Scene fields reset on restart.
- Keys die with their scene. Rebuild one `Controls` object in every `create()`, and name actions, not keys.
- Death: set a dead flag, disable the body, `emitter.explode(10)`, shake 200 ms at about 0.015, add a dim flash, then `scene.restart()` at 0.5 s. Celeste Classic waits 15 frames at 30 per second. A restart key skips the wait.
- Phaser 4 changes confirmed: `roundPixels` now defaults to false, fractional camera zoom disables rounding, and masks became filters.
- Save small JSON to `localStorage` inside try/catch, with a memory fallback. Private windows can give zero quota. Safari can clear script data after seven days of use without interaction. Embedded iframes can get separate storage.

**Ideas for our levels**
- Door to Earth level 1: lock input for 1 second, zoom toward the door, fade, then place the kid on the doorway tile. Show one control hint.
- One checkpoint per sensor group, so a death never costs more than about 30 seconds. Never place one inside a sensor's range. Reset robots and cameras to their start phase on respawn.
- Near-blind level 6: add one extra checkpoint and an audio cue before lethal sensors.
- Hardcore options: A) no mid-level checkpoints, death restarts the level (recommended); B) one life for the whole run; C) a death budget. Show a death counter.
- Assists, off by default: speed 50 to 100 percent, longer detection delay, invincibility, skip level, reduce flash and shake. Keep flashes under three per second (WCAG 2.3.1).

**Repos studied (for patterns only)**

| Repo | License | Pattern we learned |
| --- | --- | --- |
| [phaserjs/phaser](https://github.com/phaserjs/phaser) | MIT | `transition()` rules, effect defaults, event names, per-scene physics merge. |
| [NoelFB/Celeste](https://github.com/NoelFB/Celeste) | MIT (code only) | One death routine: timed shake, 8-particle ring, 15 frame restart delay, shake setting. |
| [devshareacademy/phaser-zelda-like-tutorial](https://github.com/devshareacademy/phaser-zelda-like-tutorial) | MIT | Door zones carry target ids. Input class hides raw keys. Death emits an event, then fades. |
| [mikewesthad/phaser-3-tilemap-blog-posts](https://github.com/mikewesthad/phaser-3-tilemap-blog-posts) | MIT (examples) | Lethal tile flag, freeze player, 250 ms fade, `scene.restart()`. |

Sources: [Phaser Scenes](https://docs.phaser.io/phaser/concepts/scenes) · [ScenePlugin API](https://docs.phaser.io/api-documentation/class/scenes-sceneplugin) · [Celeste assists](https://celeste.ink/wiki/Assist_Mode) · [Sirlin on saves](https://www.sirlin.net/articles/save-game-systems) · [MDN storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) · [WCAG 2.3.1](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html)
