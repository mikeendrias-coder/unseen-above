## Earth look: the night mansion

Build both views on one 320x180 canvas with 16px tiles and a small blue-violet palette. Add three signal colors: red hazards, amber lamps, cyan glasses overlay. Fake most lighting.

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [Hyper Light Drifter](https://en.wikipedia.org/wiki/Hyper_Light_Drifter) | Top-down. Broad gradients, not dithering. A few red glow points on dark machinery, same red repeated in the architecture. | One danger red on every laser and sensor. |
| [Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero) | Side-view. Neon lighting unified several artists' styles. | Lighting as glue for mixed-source art. No strobing; critics reported headaches. |
| [Celeste](https://en.wikipedia.org/wiki/Celeste_(video_game)) | Pixel art chosen to "more clearly convey information." Its [Resort](https://celestegame.fandom.com/wiki/Chapter_3) is a hotel with dust, clutter, and cleaning. | Suite, library, elevator shaft rooms. Its dust is our "do not" list. |
| [Monaco](https://en.wikipedia.org/wiki/Monaco:_What%27s_Yours_Is_Mine) | Top-down, minimalist. Line-of-sight reveal with fog of war. | Unseen rooms stay dark. |
| [Gunpoint](https://en.wikipedia.org/wiki/Gunpoint_(video_game)) | Side-view cross-section. Its Crosslink tool shows every security device and how they connect. | Model for the glasses overlay. |
| [Lone Survivor](https://en.wikipedia.org/wiki/Lone_Survivor_(video_game)) | Flashlight. Light draws enemies; shadow hides you. | Limited-sight look for level 3. |

**Techniques**
- Vacant, not abandoned: polished floors, clean glass, a few warm lamps lit, blinking status LEDs. No dust, cobwebs, or cracks.
- Film cues: The Shining sets a huge hotel closed for winter. Ex Machina lit a luxurious, isolated house with 15,000 tungsten bulbs, not fluorescent.
- Value tiers: background darkest, props mid, hazards and the kid lightest. Cleaning robots get green-white, so they read as harmless.
- Palette: the three Lospec night palettes checked lack amber, saturated red, and cyan together. Start from [Moonlight 15](https://lospec.com/palette-list/moonlight-15) or [Punolite](https://lospec.com/palette-list/punolite), then add signal ramps. Moonlight 15 shows no license; its page carries a noai tag.
- Hue shift each ramp one way, about 20 degrees per swatch.
- Dither only static skies and glows. Keep sprites clean.
- Cheap lighting: multiply-dark overlay plus additive glow sprites. Works in Phaser 3 and 4.
- Phaser 3 Light2D: `lights.enable()`, `setPipeline('Light2D')`, one normal map per texture. Phaser 4 uses `setLighting(true)` and `light.z`, and lit objects break batching.
- Moon: a far sky layer that barely scrolls. Particles: `this.add.particles(x, y, texture, config)`, motes only inside beams.
- Resolution: 320x180 divides evenly into 720p, 1080p, 1440p, and 4K. 480x270 only into 1080p and 4K. Celeste uses 320x180, Hyper Light Drifter 480x270 (one devlog).
- Scaling: `pixelArt: true` turns antialias off and roundPixels on (Phaser 4 defaults roundPixels off). Set `zoom` to `Phaser.Scale.MAX_ZOOM`.
- Never rotate or fractionally scale pixel sprites. Keep the kid the same pixel height in both views.
- Lift blacks above pure black and add a brightness setting; projectors crush dark scenes.

**Options for Michael**
- A. Blue-hour noir: navy shadows, amber lamp pools, red lasers, cyan overlay. Closest to Hyper Light Drifter. Most atmosphere.
- B. Cold luxury: grey-teal marble and chrome, tungsten lamps only. Ex Machina mood. Looks expensive, least cozy.
- C. Signal on silhouette: near-flat dark world, color only on hazards, doors, and overlay. Cheapest to build, clearest for non-gamers.

**Tools and asset sources**
- [PixelLab](https://www.pixellab.ai/): characters in 4 or 8 directions, side or top-down view. Walk, run, idle, attack, jump. Skeleton animation, 16 to 256 px. Top-down and side tilesets. Target Palette. MCP server. Commercial use allowed; ownership unstated. Lock our palette and clean up, or it looks generated.
- [Kenney Roguelike Indoors](https://kenney.nl/assets/roguelike-indoors): CC0, credit optional. [Pixel Platformer](https://kenney.nl/assets/pixel-platformer): CC0, 18px tiles, off our 16px grid.
- [LimeZu Modern Interiors](https://limezu.itch.io/moderninteriors): 16px top-down, free version exists. Paid version needs credit and bans redistribution.

Sources: [Resolving Resolutions](https://shweep.itch.io/the-machine-that-breathes/devlog/114161/resolving-resolutions) · [HLD at AV Club](https://avclub.com/hyper-light-drifter-blended-past-and-present-to-become-1798255620) · [Phaser lights](https://phaser.io/oss/docs/phaser/concepts/gameobjects/light.md) · [Phaser 4 lighting](https://phaser.io/news/2026/05/phaser-4-dynamic-lighting) · [Phaser 3 to 4](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know.md) · [Phaser scale](https://docs.phaser.io/api-documentation/class/scale-scalemanager) · [Phaser config](https://docs.phaser.io/api-documentation/typedef/types-core) · [Phaser particles](https://docs.phaser.io/phaser/concepts/gameobjects/particles) · [Slynyrd palettes](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes) · [Dithering tips](https://megacatstudios.com/ja/blogs/retro-development/dithering-tips) · [PixelLab docs](https://www.pixellab.ai/llms-full.txt) · [Ex Machina](https://en.wikipedia.org/wiki/Ex_Machina_(film)) · [The Shining](https://en.wikipedia.org/wiki/The_Shining_(film))
