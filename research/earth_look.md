# Earth half visual language (slug: earth_look)

Research pass on 2026-11-01. Scope: references and techniques only. Art direction stays as 3 short options for Michael (in Q3 Inferences and in `earth_look__section.md`). No story or lore decisions. Nothing downloaded, no browser tools used. Every "Cited Findings" line ends with its source; anything I derived myself is under "Inferences".

Source reliability note: most game facts come from Wikipedia or fan wikis, which are thin on art direction. Where a number comes from a single indie devlog, it is marked "secondary".

## Q1. Which reference games are most useful for night mood and readability?

### Takeaway
Six games earn a table row: Hyper Light Drifter and Katana Zero (night/neon mood, accent color, lighting as glue), Celeste (hotel interior, pixel art for clarity), Monaco and Gunpoint (security readability in top-down and side views), Lone Survivor (light as risk, limited sight). Sword & Sworcery EP has thin evidence (moon only) and was left out of the 650-word section for space. Limbo, Inside, Darkwood, Signalis, The Last Night and Intravenous were not studied (budget; most are not pixel art or are 3D-lit).

### Cited Findings
Hyper Light Drifter (top-down)
- 2D action RPG in a pixel art style, "fashioned after" A Link to the Past. Alx Preston aimed to recreate the feel of SNES games. Built in GameMaker Studio. Source: [Wikipedia: Hyper Light Drifter](https://en.wikipedia.org/wiki/Hyper_Light_Drifter)
- AV Club: pixel art as a deliberate limitation (like black-and-white film) that gives an "impressionistic look." The game uses broad soft gradients, which the article says would be impossible with dithering. Hard-edged pixels meet soft pastel color throughout. Source: [AV Club](https://avclub.com/hyper-light-drifter-blended-past-and-present-to-become-1798255620)
- Same article: a two-tone robot has shadowed sides and a top lit by soft sunbeams. A few "glowing red points" dot its shadowed surface, and the same red recurs in architectural details around the room, tying the space together. Source: [AV Club](https://avclub.com/hyper-light-drifter-blended-past-and-present-to-become-1798255620)
- Native resolution 480x270 (secondary: one indie dev's devlog). Source: [Resolving Resolutions devlog](https://shweep.itch.io/the-machine-that-breathes/devlog/114161/resolving-resolutions)

Katana Zero (side-view)
- Art draws on 1980s neon lighting. Justin Stander used neon lighting to unify the different styles of his pixel artists. He treated lighting as a system: adding one mechanic such as a gun turret could require lighting changes elsewhere. Source: [Wikipedia: Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero)
- IGN praised the lighting as supporting the "slick neon aesthetic." Some reviewers said the flashing intensity could cause headaches. Engine: GameMaker Studio 2. Source: [Wikipedia: Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero)
- The page gives no palette or resolution. It names lasers and gun turrets only as general hazards; it does not describe the mansion level's layout. Source: [Wikipedia: Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero)

Celeste (side-view)
- The team chose pixel art because it could "more clearly convey information to the player." Artists credited: Noel Berry, Amora Bettany, Gabby DaRienzo, Pedro Medeiros. Source: [Wikipedia: Celeste](https://en.wikipedia.org/wiki/Celeste_(video_game))
- Celestial Resort chapter: a "run-down hotel," decrepit and cluttered, entered past slime at its front door. Dust bunnies form clip-through walls, sludge is the recurring hazard, and the guestbook has "ominous glowing comments." The ghost concierge Mr. Oshiro runs it. Madeline offers "spring cleaning," and cleanup is central to the chapter. The 3D chapter-select model resembles the hotel in The Grand Budapest Hotel. Source: [Celeste Wiki: Chapter 3](https://celestegame.fandom.com/wiki/Chapter_3)
- Room names that read instantly as a grand hotel: Presidential Suite, Library, Elevator Shaft, Staff Quarters, Rooftop. Source: [Celeste Wiki: Chapter 3](https://celestegame.fandom.com/wiki/Chapter_3)
- 320x180 (secondary: one indie dev's devlog). Source: [Resolving Resolutions devlog](https://shweep.itch.io/the-machine-that-breathes/devlog/114161/resolving-resolutions)

Monaco (top-down)
- 2D top-down. Reviewers praised the art style and said the minimalist design suited the gameplay. The player sees only areas in direct line of sight, with fog of war over the rest. Missions include nightclubs and yachts. The page does not mention pixel art, color coding or lighting. Source: [Wikipedia: Monaco](https://en.wikipedia.org/wiki/Monaco:_What%27s_Yours_Is_Mine)

Gunpoint (side-view)
- Each building is a 2D cross-section showing guards, doors, switch panels, lights, security cameras and targets. The Crosslink tool shows all security features and how they connect, and the player can rewire them. Built in Game Maker 8. Artists John Roberts and Fabian van Dommelen. The page does not mention pixel art. Source: [Wikipedia: Gunpoint](https://en.wikipedia.org/wiki/Gunpoint_(video_game))

Lone Survivor (2D)
- "Retro-styled 2D graphics." The player has a flashlight that drains batteries. "Mutants are attracted to light and noises, but the player can sneak past by hiding in the shadows." Setting is an apartment complex. The page does not mention pixel art or perspective. Source: [Wikipedia: Lone Survivor](https://en.wikipedia.org/wiki/Lone_Survivor_(video_game))

Sword & Sworcery EP (moon only)
- Some events and sprites appear only in certain moon phases. The in-game moon phase is synced to the real moon via the device clock. Won Visuals at IndieCade 2011 and Art at IGF Mobile 2010. The page says nothing on palette, parallax or pixel art. Source: [Wikipedia: Sword & Sworcery EP](https://en.wikipedia.org/wiki/Superbrothers:_Sword_%26_Sworcery_EP)

### Inferences
- Hyper Light Drifter is the model for accent discipline: one red, reused on machinery and architecture, so red always means "look here."
- Katana Zero's lesson for a Claude-built game: a single lighting pass can unify art from mixed sources (PixelLab output plus free packs). Its headache note is a reason to avoid strobing or fast flicker, since the audience includes non-gamers.
- Gunpoint's Crosslink is the closest precedent for the glasses overlay in side-scroll levels (reveal the hidden wiring and ranges in a clear schematic style).
- Monaco's line-of-sight reveal suits top-down: unseen rooms stay dark or dim.
- Lone Survivor supports the near-blind level: light is a risk and shadow a refuge, so the limited-sight vignette can double as the stealth rule.

### Gaps
- No palette or resolution found for Katana Zero. No first-party source for the Hyper Light Drifter or Celeste resolutions (only the devlog).
- No GDC talk or art-director interview content found on night readability; searches returned reviews. Superbrothers' own site and Steam page were not opened.
- Not studied: Limbo, Inside, Darkwood, Signalis, The Last Night, Intravenous.

## Q2. What makes "vacant but not abandoned" read?

### Takeaway
I found no pixel-art game that is both pristine and empty-rich. Celeste's Resort is the inverse case (decrepit, dusty, but with an obsessive host), and two films give lighting and setting cues. The cue list below is therefore my inference, anchored by those sources.

### Cited Findings
- Celeste's hotel signals "abandoned" with decrepit and cluttered rooms, dust bunnies and sludge, yet signals "someone is here" with a ghost concierge and a cleaning motif. Source: [Celeste Wiki: Chapter 3](https://celestegame.fandom.com/wiki/Chapter_3)
- The Shining: Jack takes a caretaker job at a hotel "closed for the winter." The Overlook set was, at the time, the largest ever built at Elstree. Producer Jan Harlan said the sets were "very deliberately built to be offbeat," so "the huge ballroom would never actually fit inside." Source: [Wikipedia: The Shining](https://en.wikipedia.org/wiki/The_Shining_(film))
- Ex Machina: a "luxurious, isolated home" of a CEO. Fifteen thousand tungsten pea bulb lights were installed in the sets to avoid the fluorescent light often used in science fiction. The AV Club review called the first part "defined by color-coded production design." Source: [Wikipedia: Ex Machina](https://en.wikipedia.org/wiki/Ex_Machina_(film))
- Ex Machina's house has keycard doors, glass security doors and a camera, and a power cut triggers the building's security system (plot detail, used here only as prop vocabulary). Source: [Wikipedia: Ex Machina](https://en.wikipedia.org/wiki/Ex_Machina_(film))

### Inferences
Read as "maintained" (use):
- Polished floors with a specular streak, clean glass, made beds and set tables, tidy shelves. Everything in its place, nothing mid-use (no cups, coats or shoes).
- A few rooms lit warm on a schedule, most rooms dark. Warm tungsten-style lamps against cool night windows (Ex Machina's choice of tungsten over fluorescent).
- Small status lights, standby screens, slow camera sweeps, and cleaning robots with sweep trails on the outer rim. Automation is the only life.
- Security hardware that is newer and cleaner than the decor (glass doors, keycard readers).

Read as "abandoned" (avoid): dust, cobwebs, cracks, peeling paint, overgrown plants, broken glass, stopped clocks, sludge. Celeste uses exactly these to say "no one cares for this place."
- Optional uncanny trick from The Shining: layouts that do not add up physically. This touches level design, so it is Michael's call.
- Scale cue: keep the kid small against tall rooms (about 8+ tiles of ceiling at 16px tiles) so emptiness feels large.

### Gaps
- No art-director interview on pristine/empty interiors. Parasite was not checked. No pixel-art precedent found; the 3D game "Gone Home" and others were not studied.

## Q3. How do we make lasers, sensors, cameras and the player pop at night?

### Takeaway
Reserve one saturated hue for danger, keep gameplay objects the lightest or most saturated things on screen, and color-code harmless things differently. HLD's red-accent discipline and Gunpoint's schematic overlay are the best precedents.

### Cited Findings
- A few glowing red points on dark machinery, with the same red repeated in the architecture, tie the space together (Hyper Light Drifter). Source: [AV Club](https://avclub.com/hyper-light-drifter-blended-past-and-present-to-become-1798255620)
- Celeste chose pixel art explicitly to convey information more clearly. Source: [Wikipedia: Celeste](https://en.wikipedia.org/wiki/Celeste_(video_game))
- Gunpoint's cross-section shows every device, and Crosslink displays all security features and their connections. Source: [Wikipedia: Gunpoint](https://en.wikipedia.org/wiki/Gunpoint_(video_game))
- Monaco: minimalist design plus line-of-sight reveal and fog of war. Source: [Wikipedia: Monaco](https://en.wikipedia.org/wiki/Monaco:_What%27s_Yours_Is_Mine)
- Lone Survivor: light draws enemies and shadows hide the player. Source: [Wikipedia: Lone Survivor](https://en.wikipedia.org/wiki/Lone_Survivor_(video_game))
- Slynyrd: "use only a few colors per image. A little color goes a long way." Lower saturation as colors approach high brightness to avoid harsh tones. Source: [Slynyrd Pixelblog 1](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes)
- Phaser 4 lit objects can be combined with Filters including bloom, color grading, blur and vignette. Source: [Phaser 4 dynamic lighting](https://phaser.io/news/2026/05/phaser-4-dynamic-lighting)
- Phaser 3 Point Lights use a custom shader, need no normal maps, do not light other objects, and are "fast enough" for effects like flickering torches. Source: [Phaser lights docs](https://phaser.io/oss/docs/phaser/concepts/gameobjects/light.md)
- Katana Zero: some reviewers reported headaches from flashing intensity. Source: [Wikipedia: Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero)

### Inferences
- Value tiers (squint test): background darkest, props middle, hazards and the kid lightest or most saturated. Lift the darkest value above pure black.
- Same color grammar in both views: red = hazard (laser lines, camera cones, floor sensors), amber = safe light or interactable, cyan = glasses overlay, green-white = cleaning robots (harmless). Shape helps too: sharp and thin for hazards, rounded for cleaners. Cleaning robots are Michael's design, so confirm the color code with him.
- Draw lasers as a 1px bright core with a 2 to 3 px additive glow; at 320x180 a 1px line without glow can vanish.
- Keep a bright 2 to 3 px lens glint on the kid's glasses as a player marker; it disappears when the glasses break (idea only).
- Test on a dim projector or a glare-heavy laptop; add a brightness setting. No strobing or fast flicker.
- Limited-sight level: a radial darkness vignette around the kid whose radius shrinks, with only hazards inside the radius visible.

Options for Michael (draft; also in the section file):
- A. Blue-hour noir: navy and violet shadows, a few amber lamp pools, red lasers, cyan overlay. Closest to Hyper Light Drifter and Katana Zero. Most atmosphere; moderate asset effort.
- B. Cold luxury: grey-teal marble and chrome, warm tungsten lamps only, red or magenta lasers. Ex Machina mood. Looks expensive; least cozy; marble and glass need careful value work.
- C. Signal on silhouette: near-flat dark world (2 to 3 values), color only on hazards, doors and the overlay. Monaco and Gunpoint logic. Cheapest to build, clearest for non-gamers; least lush, and least dependent on AI-generated detail.

### Gaps
- No contrast-ratio or accessibility standard consulted. Nothing tested on a real display or projector.
- No source on how Katana Zero or Hyper Light Drifter distinguish hazards from scenery beyond the red-accent example.

## Q4. Which techniques apply: palettes, hue shifting, dithering, 2D lighting, parallax, particles?

### Takeaway
Use a small custom palette built from hue-shifted ramps, fake most light with a multiply overlay plus additive glows, and reserve real normal-mapped lights for a few hero props. Lighting code differs between Phaser 3 and 4, so wrap it in one helper.

### Cited Findings
Palettes
- Lospec's "night" tag listed 58 palettes at fetch time. Top entries included Neon Night Sky (4 colors), CyberGum6 (6), Moonlight 15 (15), 3 am (5), BLUE GLASS (8), Punolite (16), UnderNight 20 (20). Source: [Lospec night tag](https://lospec.com/palette-list/tag/night)
- Moonlight 15 by Tofu: 15 colors from near-black #030206 through navy and blue to cyan #3afffb, plus greens. Tags: night, glow, moonlight, saturated. No warm colors. No license shown; the page has a `noai, noimageai` robots meta tag (unclear whether the creator or Lospec set it). Source: [Moonlight 15](https://lospec.com/palette-list/moonlight-15)
- Punolite by Punoli: 16 colors, tags night, muted, blue, dark. Dark blue-violet ramp plus warm-looking entries (#b67a5b, #c8a26e, #e1d483) and a brick red (#a14b4b). The page does not describe the colors; calling them "muted warm tones" and "no saturated red" is my reading of the hex codes. Source: [Punolite](https://lospec.com/palette-list/punolite)
- UnderNight 20 by yedamameday: 20 colors, tags include night, cozy, saturated. Hex codes run from #211729 through blues and greens to cream and rose; my reading is pastel-leaning with no saturated amber or red. Source: [UnderNight 20](https://lospec.com/palette-list/undernight-20)

Hue shifting
- Shift hue in one direction across each ramp (about 20 degrees per swatch in the author's palette); hue-shifted ramps harmonize, while brightness-only ramps look flatter. Brightness rises steadily dark to light; lower saturation near the top; dark colors tend to carry more saturation. Build a big palette, then pull smaller palettes from it. The article has no night-specific guidance. Source: [Slynyrd Pixelblog 1](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes)

Dithering
- Dithering puts two colors side by side so a third appears, helps with small palettes, softens hard transitions but can look grainy; the author uses it mostly on static pieces like posters and backgrounds. Source: [Mega Cat Studios dithering tips](https://megacatstudios.com/ja/blogs/retro-development/dithering-tips)
- Hyper Light Drifter uses broad soft gradients instead (needs more colors). Source: [AV Club](https://avclub.com/hyper-light-drifter-blended-past-and-present-to-become-1798255620)

2D lighting, Phaser 3 (docs page is Phaser 3 style)
- `this.lights.enable()`, then `setPipeline('Light2D')` on each object to be lit. WebGL only. Lit objects need a normal map, loaded with `this.load.image(key, [url, normalMapUrl])`. Source: [Phaser lights docs](https://phaser.io/oss/docs/phaser/concepts/gameobjects/light.md)
- `addLight(x, y, radius, color, intensity)` (defaults radius 128, 0xffffff, intensity 1), `setAmbientColor(color)`, `addPointLight(...)`. Lights cannot be added to Containers; they must sit at the scene root. Source: [Phaser lights docs](https://phaser.io/oss/docs/phaser/concepts/gameobjects/light.md)

2D lighting, Phaser 4 (confirmed differences)
- Lighting is `setLighting(true)` on any game object; no pipeline assignment. Works on sprites, images, text, tilemaps, particles, video and shapes. Light height is `light.z`. Normal maps are separate images; a NormalTools filter can rotate or squish them. Self-shadows are simulated from texture features and can be on per object or game-wide. Source: [Phaser 4 dynamic lighting](https://phaser.io/news/2026/05/phaser-4-dynamic-lighting)
- Lighting changes the shader, which breaks sprite batching; enable it only on objects that need it. Source: [Phaser 4 dynamic lighting](https://phaser.io/news/2026/05/phaser-4-dynamic-lighting)
- Migration article: the whole v3 WebGL pipeline system is replaced by render nodes (custom pipelines need rewriting; standard sprites and tilemaps should work unchanged). FX and masks merge into one Filter system; BitmapMask is removed in favor of a Mask filter. `setTintFill()` is removed; use `setTint()` with `setTintMode()`. `roundPixels` now defaults to false. Source: [Migrating from Phaser 3 to 4](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know.md)
- Neither page confirms whether `lights.enable()`, `addLight` or the ambient color call still exist in Phaser 4, or how normal maps are loaded there.

Particles
- Since v3.60: `this.add.particles(x, y, texture, config)` returns a ParticleEmitter added to the display list. Config fields include speed, lifespan, alpha (`{start, end}`), scale, frequency, emitZone; `blendMode` is listed but no ADD example given. The page has no Phaser 4 particle notes. Source: [Phaser particles docs](https://docs.phaser.io/phaser/concepts/gameobjects/particles)

Moon and sky
- Sword & Sworcery makes the moon a recurring, gameplay-relevant sky object, synced to the real moon. Source: [Wikipedia: Sword & Sworcery EP](https://en.wikipedia.org/wiki/Superbrothers:_Sword_%26_Sworcery_EP)

### Inferences
- Default to cheap lighting that works in both versions: a full-screen multiply-dark overlay, additive glow sprites for lamps and laser ends, and a vignette for the near-blind level. It needs no normal maps, which matters because PixelLab and free packs do not ship them.
- Use real lights (Phaser 3 Light2D or Phaser 4 `setLighting`) only for a few hero surfaces such as a polished floor under a lamp, since each lit texture needs a normal map and lit objects break batching.
- Build a custom palette from 5 ramps: shadow blue-violet (5 steps), wall neutral (3), lamp amber (3), danger red (2 to 3), glasses cyan (2 to 3), plus a green-white for cleaners; about 20 to 24 colors. None of the three night palettes I opened has amber, saturated red and cyan together (I did not open the other 55). Moonlight 15 or Punolite can seed the shadow ramp.
- Because Moonlight 15 carries a noai tag and no license, building our own ramps avoids the question; colors themselves are not the issue, but Michael should decide if it matters.
- Dither only static skies and window glows. Keep sprites, lasers and robots dither-free so silhouettes stay clean and nothing shimmers in motion. This is my recommendation, not a sourced rule.
- Moon: place it on its own sky layer that scrolls barely or not at all (a camera scroll factor near 0), so it "hangs." Not verified in docs this pass.
- Ambient particles: slow motes only inside lamp cones and laser beams. This makes beams visible without implying dust on the floor (dust reads as abandoned).
- Light masks (flashlight/vignette cut-outs) are the riskiest piece across versions because BitmapMask is removed in Phaser 4. Build one small "darkness with a hole" helper and test it in whichever version the tech-foundation track picks.

### Gaps
- TileSprite doc page failed to fetch (client_error), so TileSprite, `tilePositionX` and `setScrollFactor` for parallax are not verified from docs here.
- The older Phaser config concept page also failed once; I used the official GameConfig typedef page instead.
- No source found on Bayer vs noise dither or on pattern size. Saint11's tutorial index had only GIF filenames, no text.
- Phaser 4 normal-map loading steps and the Phaser 4 particle API were not found.

## Q5. How do we keep top-down and side-scroll consistent (resolution, tile size, pixel density, scaling)?

### Takeaway
One 320x180 canvas, 16px tiles, one palette and one integer zoom for both views. 480x270 is the fallback if the view feels cramped.

### Cited Findings
- A devlog compares 320x180, 384x216 and 480x270. 320x180 divides evenly into 720p (4x), 1080p (6x), 1440p and 4K; 384x216 scales to 1080p at 5x but "doesn't fit the other resolutions"; 480x270 divides into 1080p at 4x but "often doesn't FEEL like a retro resolution" unless characters are large. Source: [Resolving Resolutions devlog](https://shweep.itch.io/the-machine-that-breathes/devlog/114161/resolving-resolutions)
- Same devlog (secondary): Celeste 320x180; Hyper Light Drifter and Nemoral 480x270. Shovel Knight's 16x16 tiles divide perfectly into its height, but most other resolutions "do not divide by 16 well, meaning tiles will sometimes be cut off." Source: [Resolving Resolutions devlog](https://shweep.itch.io/the-machine-that-breathes/devlog/114161/resolving-resolutions)
- Phaser GameConfig: `pixelArt` (default false) "Sets antialias to false and roundPixels to true. This is the best setting for pixel-art games." `roundPixels` default false; `antialias` default true. Source: [Phaser GameConfig](https://docs.phaser.io/api-documentation/typedef/types-core)
- Phaser 4: `roundPixels` now defaults to false, so set it explicitly. Source: [Migrating from Phaser 3 to 4](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know.md)
- ScaleManager: `zoom` multiplies the base size (default 1, applied even in NONE mode). `Phaser.Scale.MAX_ZOOM` makes Phaser derive the zoom from game size and parent space; `setMaxZoom()` applies the largest zoom that fits and `getMaxZoom()` returns it (never below 1). `setSnap(snapWidth, snapHeight)` rounds dimensions down to a grid multiple and is recommended with FIT. `autoRound` floors canvas sizes. Source: [Phaser ScaleManager API](https://docs.phaser.io/api-documentation/class/scale-scalemanager)
- Scale concept page: FIT keeps aspect ratio but does not guarantee an integer factor (the summary's inference). Source: [Phaser scale concept](https://docs.phaser.io/phaser/concepts/scale-manager)

### Inferences
Integer scale factors (my arithmetic):

| Base | 1280x720 | 1600x900 | 1920x1080 | 2560x1440 | 3840x2160 | Tiles on screen at 16px |
| --- | --- | --- | --- | --- | --- | --- |
| 320x180 | 4x | 5x | 6x | 8x | 12x | 20 x 11.25 |
| 384x216 | 3.33 | 4.17 | 5x | 6.67 | 10x | 24 x 13.5 |
| 480x270 | 2.67 | 3.33 | 4x | 5.33 | 8x | 30 x 16.9 |

- 320x180 is the only base of the three that is exact at every common size. That helps classroom projectors (720p or 1080p) and keeps pixels square without blur. It also means fewer pixels to generate and keep consistent in a Claude-built game.
- Trade-off: a browser window is rarely a monitor size. On a 1470x956 viewport (a typical 13-inch MacBook default; from general knowledge, unverified), 320x180 gets 4x (side gaps about 190px) while 480x270 gets 3x (gaps about 30px). Neither base wins every window; MAX_ZOOM with a dark letterbox is the simple answer.
- 16px tiles: no common 16:9 base divides evenly into 16 vertically, so treat the screen as a window onto a larger tilemap and let the camera scroll. Build rooms as whole-tile multiples, not screen-sized.
- Pixel density: one canvas, one tile size, one palette, one kid height in pixels (for example about 20 px tall in a 32x32 sprite canvas) across both views. Do not rotate pixel sprites or use fractional scale or fractional camera zoom; either breaks the pixel grid. Mixed pixel sizes are what make two views look like two games.
- 32px tiles would show only about 10 x 5.6 tiles at 320x180, too coarse for stealth reading.
- 480x270 is worth a second look if playtesting shows players cannot see threats far enough ahead (more view range, about 30 x 17 tiles), at the cost of roughly 2.25x the pixels per scene.

### Gaps
- No first-party resolution figures for Celeste or Hyper Light Drifter; Katana Zero unknown.
- Non-integer device pixel ratios (Windows 125% or 150% display scaling) can still break integer scaling in a browser; not researched. No browser testing was allowed or done.
- Phaser 4 Scale Manager defaults were not separately confirmed (docs pages fetched are not labeled by version).

## Q6. What can PixelLab and free packs supply? (notes only; nothing downloaded)

### Takeaway
PixelLab can cover both views (characters, animations, tilesets) and has an MCP server Claude can drive, but its style consistency is untested. Free packs help as references or fillers; check each license and tile size.

### Cited Findings
PixelLab
- Characters from text with 4 or 8 rotational directions. Animations such as walk, run, idle, attack and jump across directions. Skeleton-driven and text-driven animation. Side view and top-down (low and high angle) views. Top-down Wang tilesets and side-scroller tilesets, isometric tiles, inpainting, rotation, sprite sheet and frame export. Source: [PixelLab llms.txt](https://www.pixellab.ai/llms.txt)
- REST API at `https://api.pixellab.ai/v2` (Swagger at `/v2/docs`), Python and JavaScript SDKs, and an MCP server at `https://api.pixellab.ai/mcp` that works with Claude, Claude Code and others. Jobs are asynchronous. Source: [PixelLab llms.txt](https://www.pixellab.ai/llms.txt)
- Sizes: skeleton animation supports 16, 32, 64, 128 and 256 px squares; animation-to-animation 16 to 128; automatic animations must be 64x64 or smaller; Instant Character is exactly 32x32 or 32x40; the 8-direction Pro tool outputs a 3x3 grid, max 168x168 per frame. Create Tiles (Pro) supports square tiles 16 to 128 px. Tileset formats: Wang, dual-grid 15-tile, 3x3. Source: [PixelLab llms-full.txt](https://www.pixellab.ai/llms-full.txt)
- Animate with text (new): 4 to 16 frames in even counts. Pro tools cost 10, 15 or 25 generations; some features need Tier 1 or 2 or a paid plan; the free trial has limited generations. Source: [PixelLab llms-full.txt](https://www.pixellab.ai/llms-full.txt)
- Palette and style controls: a Target Palette option across tools; Outline, Shading and Details dropdowns; `create_image_pixflux` accepts a forced palette; a Reduce Colors tool exists. Sources: [PixelLab llms-full.txt](https://www.pixellab.ai/llms-full.txt); [PixelLab llms.txt](https://www.pixellab.ai/llms.txt)
- Licensing: all tiers include commercial use rights; the FAQ says generated images can be used commercially and asks only that you not use them to train new models. Ownership is not explicitly addressed. Source: [PixelLab llms.txt](https://www.pixellab.ai/llms.txt); [PixelLab llms-full.txt](https://www.pixellab.ai/llms-full.txt)

Free packs
- Kenney Roguelike Indoors: CC0 1.0, credit optional; includes furniture (tables, chairs, sofas). Tile size not stated on the page. Source: [Kenney Roguelike Indoors](https://kenney.nl/assets/roguelike-indoors)
- Kenney Pixel Platformer: CC0, tile size 18 x 18, about 200 files, category 2D pixel platformer. Source: [Kenney Pixel Platformer](https://kenney.nl/assets/pixel-platformer)
- LimeZu Modern Interiors (itch.io): top-down, tile sizes 16, 32 and 48 px. A free version zip exists (contents not listed); the complete version needs at least $1.50. Complete-version license: commercial and non-commercial use and editing allowed, no reselling or redistribution, credit required. No mention of mansions or hotels (it lists room types like condominium). Source: [LimeZu Modern Interiors](https://limezu.itch.io/moderninteriors)

### Inferences
- PixelLab plus MCP lets Claude generate and iterate directly, which fits a Claude-built game. Plan a small pilot (one kid, one tileset, one room in each view) with the palette locked before committing to full production.
- Raw generator output can look generated or inconsistent from asset to asset. Lock the palette (Target Palette), keep a clean-up pass, and favor Option C or a restrained A, where gameplay objects carry the look. That is my inference; no PixelLab sample outputs were reviewed.
- Kenney's 18px Pixel Platformer will not align to a 16px grid; use it as a style reference. LimeZu at 16px matches, but its content is modern-condo style, not mansion, so mansion furniture would likely come from PixelLab or custom tiles.
- Whether to credit AI-generated art in the game or paper is Michael's decision (no recommendation made).

### Gaps
- PixelLab Terms of Service page was not opened; license statements come from its llms files and FAQ text. No sample images viewed. No pricing figures found.
- Roguelike Indoors tile size and Pixel Platformer side-view content not confirmed on the pages. LimeZu free-version license not shown. No verified side-view mansion or interior pack.
- Pointers surfaced in search but not opened: a CodeAndWeb Phaser 3 lighting tutorial, the Phaser 4.1.0 lights example page, and a PixelLab MCP listing.

## Needs Michael or Chrome
- WebFetch returned client_error (nothing retrieved) for `docs.phaser.io/phaser/concepts/config` and `docs.phaser.io/phaser/concepts/gameobjects/tilesprite`. Not routed around. I used the official GameConfig typedef page for `pixelArt`; TileSprite and scroll factor stay unverified.
- Saint11's tutorial index (`saint11.art/blog/pixel-art-tutorials/`) returned only GIF filenames. Someone who can open it in a browser could read the darkness, stars, parallax and lighting tutorials.
- Michael should look at actual color swatches and any PixelLab sample renders; text research cannot judge which of Options A, B or C looks right.
- PixelLab Terms of Service (`pixellab.ai/termsofservice`) should be read by Michael before relying on commercial-use and ownership terms.
