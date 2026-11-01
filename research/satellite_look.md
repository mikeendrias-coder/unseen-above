# satellite_look: visual language for the satellite half, and its contrast with the Earth half

Scope: references and techniques only. Any direction is an option for Michael to approve or reject. No story decisions. Researched 2026-11-01 with WebSearch and WebFetch (no browser tools). Nothing was blocked. The shared WebSearch budget ran out near the end, so a few planned searches were not run (listed under Gaps).

Repo read for patterns only (nothing run, built, or installed): [phaserjs/phaser](https://github.com/phaserjs/phaser), license MIT (LICENSE.md: "The MIT License (MIT), Copyright (c) 2026 Richard Davey, Phaser Studio Inc."), package version 4.2.1, shallow sparse clone at /home/claude/repos/satellite_look/phaser, commit 02d8931b. Directories read: skills/, changelog/, src/filters, src/renderer/webgl/renderNodes, src/renderer/webgl/shaders, src/actions, src/core, src/math/easing, src/gameobjects/bitmaptext. One registry query (`npm view`) was used to read package licenses; it executes no repo code.

## 1. Which reference games and works are most useful for a cold, clean, pixel-art puzzle interface?

### Takeaway
Eight works cover the satellite look well: DEFCON, Mini Metro (with Mini Motorways), Duskers, Severance's macrodata refinement terminals, TIS-100, Papers, Please, Return of the Obra Dinn, and Inscryption. Between them they give the vector-and-numbers detachment, the flat geometric UI with reactive sound, the drab office terminal, the "people as dots" reduction, and a precedent for switching style between game halves.

### Cited Findings
DEFCON (Introversion, 2006)
- The screen is "reminiscent of the 'big boards' that visually represented thermonuclear war in films such as Dr. Strangelove, Fail-Safe, and especially WarGames"; the map is a "1980s vector graphics computer-themed world map"; casualties are shown as "civilian casualties numbering in the millions (megadeaths)" and scoring is tied to megadeaths caused and suffered. Windows release Sept 29, 2006. | [Wikipedia: DEFCON](https://en.wikipedia.org/wiki/DEFCON_(video_game))
- Chris Delay: inspiration is WarGames' NORAD bunker scenes, "with the US Generals watching the world end in wireframe"; "The abstract simplicity of DEFCON adds to this mood"; he aims for "a feeling of deep detachment, of being hidden underground in a bunker, slowly bringing the world to an end"; calls it "a cruel, wholly detached take on nuclear war"; says the game is "almost entirely 'content free'"; the music "is incredibly eerie and atmospheric and really adds a macabre element." | [VideoGamer interview](https://www.videogamer.com/?p=143865)

Uplink (Introversion, 2001), kept as a footnote to DEFCON
- Owen Hill describes it as "an austere, menu-driven hacking simulator, where players navigated electric blue interfaces to manipulate mainframes"; the "simple, 2D menus" keep it timeless; Delay: "I think 2D's brilliant. I love 2D to death," and "Even I can't be arsed with command prompts." | [PC Gamer: the making of Uplink](https://www.pcgamer.com/uk/the-making-of-uplink)

Mini Metro (Dinosaur Polo Club) and Mini Motorways
- "The game's visual style makes use of bold colours and simple geometry to replicate the appearance of modern transit maps"; passengers are small shapes matching their destination station shape. | [Wikipedia: Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Same page: Disasterpeace built "a procedural audio system that would generate sounds based on events in the game"; "the harmonic structure of these elements changes based on the size and shape of the player's subways system"; "inspired by minimalism and the works of Philip Glass and Steve Reich."
- Press kit: "Several colour modes to choose from, including colourblind and night modes"; "Responsive, relaxing soundtrack that grows with your city." The kit says the studio allows videos of Mini Metro, including monetized ones. It states no separate terms for press images. | [Dinosaur Polo Club press kit](https://dinopoloclub.com/press/index.php)
- The team chose "something procedural with an abstract art style that wouldn't require significant production art" (useful for our "built by Claude" constraint). | [MCV: Going underground](https://www.mcvuk.com/business-news/going-underground-the-story-of-dinosaur-polo-clubs-mini-metro/)
- Robert Curry: "the minimalism was one of the things that made the game hard to make!" On a city-select screen change that was reversed after player reaction: "We thought it was a really stylish change but didn't realise how much people loved the maps!" | [Indieorama interview](https://www.indieorama.com/mini-metro-and-robert-curry-the-minimalism-was-one-of-the-things-that-made-the-game-hard-to-make)
- Mini Motorways: links houses to buildings "of identical colours"; Eurogamer on its sound: "a chilled tumbler of pips and muttering hums and clicks and whistles and honks"; Rock Paper Shotgun on the audio: "Cues like this help alert you to potential problems in your network"; colourblind mode noted. | [Wikipedia: Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways)

Duskers (Misfits Attic, 2016)
- Tim Keenan: the player is "typing commands into a console and you're speaking in the drone's language"; the interface "reminds you that there's no one in that space craft with you"; "I can make you feel like you're some remote drone operator and you're behind a monitor and you're seeing a filtered view"; the "Wilson Effect": "feel like your best friend is this piece of metal." | [Game Developer: Road to the IGF, Duskers](https://gamedeveloper.com/design/road-to-the-igf-misfits-attic-s-i-duskers-i-)
- Players control up to 4 drones directly or "issue orders via a command line interface"; released May 18, 2016. | [Wikipedia: Duskers](https://en.wikipedia.org/wiki/Duskers)

Severance, macrodata refinement (MDR) terminals (Apple TV+)
- Terminals "were modeled from the Data General Dasher terminals from the 1970s"; they "lacked an escape key, as a metaphor for the lack of control the innies have"; prop makers rebuilt old computers with working trackballs; cinematographer Jessica Lee Gagné used cool fluorescent overhead light, "a color choice that typically connotes sensations of coldness and depression"; framing often goes through doorways or behind desk dividers to suggest confinement; Hindle: "a Dieter Rams look to it"; green carpet against whites in the MDR room. | [Wikipedia: Severance](https://en.wikipedia.org/wiki/Severance_(TV_series))
- Hindle tested about 50 whites and settled on two; kept a "fluorescent lime green that you would never think would work"; the team built "The computers, the trackballs, the keypad, the touch screen" and "built our own programming for the computers." | [MPA: Hindle interview](https://www.motionpictures.org/2022/06/severance-production-designer-jeremy-hindle/)
- The CRT monitors are "somehow touchscreen," paired with "a massive trackball attached to the chunky, bright blue keyboard"; the machines "look like something out of an elementary school typing class from 1998"; Hindle wanted "to design a device that doesn't make a lot of sense." Screen content is real, not CGI. | [SlashFilm](https://slashfilm.com/838690/severances-computers-were-actually-functional-including-the-numbers-on-screen)
- Set: "bare white walls and deep green carpeting," a windowless low-ceilinged room, "drenched in fluorescent light" (photo caption). | [VFX Voice](https://vfxvoice.com/its-not-just-another-day-at-the-office-for-severance/)

Zachtronics: TIS-100 (2015) and Exapunks (2018)
- TIS-100 is played on "a fictional, virtualized 1970s computer that has been corrupted"; the manual is "inspired by similar computer manuals of the time"; the machine is "twelve separate processing nodes laid out in a four-by-three grid"; later puzzles output to "a simple 5-color graphics display"; disabled nodes hold cryptic messages. | [Wikipedia: TIS-100](https://en.wikipedia.org/wiki/TIS-100)
- Exapunks is set in an alternate 1997; instructions come from a fictional zine, "Trash World News," that can be printed. The article does not describe its on-screen visual style. | [Wikipedia: Exapunks](https://en.wikipedia.org/wiki/Exapunks)

Papers, Please (Lucas Pope, 2013)
- The "clunky" user interface "was a deliberate design choice," inspired by visual programming tools such as HyperCard; Wired tied the drab look to the feeling of being a low-level state employee. | [Wikipedia: Papers, Please](https://en.wikipedia.org/wiki/Papers,_Please)
- Pope on the family status screen: "It's just a few dots with some text. Such a simple screen is pretty boring," so that "the player could more easily project their own family onto them." On restraint: he "worked hard to reduce the amount of dialog, keep things ambiguous... and to rely on the player's imagination." On structure: "The bureaucratic structure is something that fits naturally." | [Game Developer: Designing the bleak genius of Papers, Please](https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i-)
- A design write-up notes information is "laid out well and labelled clearly without any crowding" in a limited work space, and that sustained vigilance gets tiring. | [Mechanics of Magic](https://mechanicsofmagic.com/2021/06/05/design-details-in-papers-please/)

Return of the Obra Dinn (Pope, 2018)
- "1-bit" monochrome style "inspired by games on early Macintosh computers," with rendering modified to give dithering "the equivalent of motion blur." | [Wikipedia: Return of the Obra Dinn](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn)
- Pope: "I wanted to make a 1-bit, 3D game, because I grew up playing Mac Plus games"; at full screen "your eyes can't fuse the dither pattern into shades anymore"; the fix distorts the dither as the camera moves; "That took me a long time to solve." | [PC Gamer](https://www.pcgamer.com/uk/lucas-pope-on-the-challenge-of-creating-obra-dinns-1-bit-aesthetic/)

Inscryption (Daniel Mullins Games, 2021)
- Act 1 is first person in a cabin; Act 2 is "a pixel art-stylized top-down role-playing game, similar to Pokémon"; Act 3 is "similar in style to the first act," with rooms "in a grid-like layout"; overall "a combination of computer animation, pixel art, drawn art, and live action." | [Wikipedia: Inscryption](https://en.wikipedia.org/wiki/Inscryption)
- Mullins "pivoted to a three-act story with gameplay and visual styles changing between acts" to keep the experience surprising (Unity's narration). | [Unity blog](https://blog.unity.com/en/games/3-lessons-in-storytelling-from-inscryption)
- Mullins: "Due to the low resolution of the game, small details on the cards were hard to see," so most card text was dropped and portraits sometimes covered by icons. | [Game Developer interview](https://www.gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption)

Observation (No Code, 2019), not selected
- A review praises "sleek science-fiction interfaces," "artful glitches and static," and "tense silences," but says the tasks feel more like an admin job than a puzzle. No design-side source was found. | [Wireframe review](https://wireframe.raspberrypi.com/articles/observation-review-emoting-in-a-tin-can)

### Inferences
- Eight picks for the section table: DEFCON, Mini Metro, Duskers, Severance, TIS-100, Papers, Please, Obra Dinn, Inscryption. Uplink folds into DEFCON. Observation, Hacknet, Opus Magnum and Exapunks (visuals) were not selected because sourcing was thin or not gathered.
- Strongest fits for "mundane work feels sterile": Severance (cold light, chunky bezel, no escape key), TIS-100 (grid of nodes, terse manual), Papers, Please (clunky desk UI). Strongest for "detached violence as numbers": DEFCON.
- Mini Metro's "abstract art style that wouldn't require significant production art" matches our constraint that Claude builds most of it.
- Obra Dinn's dither is a good one-off transition, but Pope's own account says stable dithering is hard in motion. A fixed-camera, grid-snapped satellite screen avoids most of that problem (inference).

### Gaps
- Hacknet was not researched. Opus Magnum and Exapunks visual design were not sourced (Exapunks Wikipedia has no visual-style text).
- Designer Notes #69 (Chris Delay, part 2) page has no transcript; the linked Idle Thumbs page was not fetched. No GDC talk by Introversion or Dinosaur Polo Club was fetched.
- Severance: no source found on who built the MDR on-screen graphics or their palette (VFX Voice said it does not cover them).
- No Steam pages were opened; links are Wikipedia or interviews.

## 2. What do real satellite ground-station, drone control, and surveillance-dashboard screens look like, and how do they sanitize what they show?

### Takeaway
Public ground-station tools are plain panels of telemetry, maps, and video, which is a good model for dry furniture. For sanitizing, public reporting points to four moves: a narrow framed feed, targets reduced to list entries and generic nouns, a decision compressed to a few clicks, and the human role reduced to approval.

### Cited Findings
- Open MCT (NASA Ames) is a mission control framework for "visualization of data on desktop and mobile devices" built around telemetry; NASA uses it for spacecraft data analysis and for planning and operating experimental rover systems; Apache 2.0 badge on the repo. | [GitHub: nasa/openmct](https://github.com/nasa/openmct)
- OpenC3 COSMOS lists tools such as Command and Telemetry Server, Limits Monitor, Command Sender, Script Runner, Packet Viewer (latest value of each telemetry item as a key-value list), Telemetry Viewer, Telemetry Grapher. License is the "OpenC3 Builder's License" (not a standard OSS name; read LICENSE.md before reusing anything). | [GitHub: OpenC3/cosmos](https://github.com/OpenC3/cosmos)
- QGroundControl (drone ground control station): the "Live Fly View combines a map, instruments, and vehicle telemetry in a 'real-time flight display'," with video, a MAVLink Inspector, and a console; repo shows "Apache-2.0, GPL-3.0 licenses found." | [GitHub: mavlink/qgroundcontrol](https://github.com/mavlink/qgroundcontrol)
- Derek Gregory (geographer): the Predator feed is "remarkably narrow," "like looking through a soda straw"; crews use FalconView, a map where a small square marks the camera's field of view, plus Google Earth and mIRC chat windows; in one strike the crew missed key chat entries; "KILL CHAIN" was typed into the room to cut chatter; he cites Haraway's "God-trick": "see everything from nowhere in particular." | [Geographical Imaginations: Predator View](https://geographicalimaginations.com/2014/10/19/predator-view/)
- Air & Space: Gorgon Stare aims to improve on "the narrow, 'soda straw' views of the battlefield normally returned by UAV cameras" (attributed to Aviation Week). | [Air & Space](https://www.airspacemag.com/daily-planet/air-force-drones-cut-to-wide-angle-146711062/)
- Pentagon chief digital and AI officer Cameron Stanley, in a demonstration Palantir posted from its AIPCon 9, described the Maven Smart System process after detecting a target as "Left click, right click, left click"; the reporter describes the target list narrowing to a specific car in a parking lot; the AI picks "what the best asset" is for a strike; the flow runs "all within one system." Business Insider says it could not independently confirm operational details. Article date not visible in the fetch. | [Business Insider via AOL](https://www.aol.com/articles/pentagon-provided-rare-inside-look-090701908.html)
- Palantir's AIP military demo (reported by Matthew Gault): the operator "uses a ChatGPT-style chatbot"; the narrator says the operator uses AIP "to generate three possible courses of action to target this enemy equipment"; Gault writes that the human operators "seem to do little more than ask the chatbot what to do and then approve its actions." | [Vice](https://vice.com/en/article/palantir-demos-ai-to-fight-wars-but-says-it-will-be-totally-ethical-dont-worry-about-it)

### Inferences
- "Sanitizing" moves observable in these public sources: (1) narrow framing hides context (soda straw); (2) targets become entries, cars, or "enemy equipment"; (3) a kill chain collapses to three clicks; (4) the person acting is titled "operator" and mostly approves. Sources 1 and 4 are critical analysis, sources 2 and 3 are the vendors' or officials' own demos, so tone differs.
- For our satellite UI, the borrowable parts are formal: a small framed feed, a list view with generic nouns, and a few-click commit button. Using them keeps the screen "innocent" until a reveal.
- Open MCT, COSMOS, and QGroundControl show that real operator screens favor dense tables, key-value lists, plots, and status chips over decoration. Use that density for realism, but keep pixel-art simplicity.

### Gaps
- No civilian surveillance-dashboard marketing (for example license plate reader vendors) was fetched; the search budget ran out before this was attempted. Palantir Gotham product pages were not fetched.
- Fetch tools return text, not screenshots, so no layout was verified visually. Image-level descriptions need Michael or a browser step.
- The Air & Space page names Reaper, not Predator, and gives no direct official quotes.

## 3. Techniques: crisp pixel UI, grids, palettes, bitmap fonts, CRT effects in Phaser 3 vs 4, motion and sound

### Takeaway
Use `pixelArt: true`, a small base resolution with integer scaling, bitmap text, and a palette locked either by art discipline or (Phaser 4 only) the Quantize or GradientMap filters. Neither Phaser line ships a scanline filter, so use a simple overlay or the MIT-licensed rex Horrifi plugin on Phaser 4. Keep motion linear or stepped and sound short and dry.

### Cited Findings
Crisp pixels and scaling (Phaser 4.2.1 source)
- `pixelArt: true` "tells the WebGL renderer to automatically create textures using a nearest-neighbor filter mode" and sets `antialias` and `antialiasGL` to false and `roundPixels` to true. `smoothPixelArt` is an alternative that keeps blocky pixels but smooths edges when scaled. | [Phaser repo](https://github.com/phaserjs/phaser), src/core/Config.js, commit 02d8931b
- The v3 to v4 migration guide says `roundPixels` now defaults to false (it was true in v3), only operates on axis-aligned, unscaled objects, and has per-object `vertexRoundMode`. | [Phaser repo](https://github.com/phaserjs/phaser), skills/v3-to-v4-migration/SKILL.md
- Camera gotcha: `roundPixels` works correctly only at integer zoom; non-integer zoom causes jitter. | [Phaser repo](https://github.com/phaserjs/phaser), skills/cameras/references/REFERENCE.md
- Pixel-art scale recipe from the repo: `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 320, height: 240, zoom: Phaser.Scale.MAX_ZOOM }` with `pixelArt: true`; "MAX_ZOOM calculates the largest integer multiplier that fits in the parent." | [Phaser repo](https://github.com/phaserjs/phaser), skills/scale-and-responsive/SKILL.md (the tech-foundation track should confirm the FIT plus zoom combination)

Text
- Repo guidance: use `Text` "for UI elements that need flexible styling, web fonts, or infrequent updates" and `BitmapText` "for scores, timers, and anything that updates frequently." Load with `this.load.bitmapFont('pixels', 'assets/font.png', 'assets/font.xml')`, create with `this.add.bitmapText(x, y, key, text, size)`. `RetroFont` can build a bitmap font from a sprite sheet of fixed-size glyphs. | [Phaser repo](https://github.com/phaserjs/phaser), skills/text-and-bitmaptext/SKILL.md, skills/loading-assets/SKILL.md
- BMFont (AngelCode) generates bitmap fonts from TrueType fonts, outputs PNG/TGA/DDS plus a text, XML, or binary descriptor, is a Windows app, and its source is under the zlib license. | [AngelCode BMFont](https://www.angelcode.com/products/bmfont/)

Palette
- Phaser 4 Quantize "reduces the unique number of colors in an image, based on some limited number of steps per color channel," in RGBA or HSVA space, with optional dithering ("good for creating a retro or stylized effect"). GradientMap "recolors an image using a ColorRamp" driven by brightness. Both are `@since 4.0.0`. Threshold makes binary (0 or 1) output. | [Phaser repo](https://github.com/phaserjs/phaser), src/filters/Quantize.js, GradientMap.js, Threshold.js
- Lospec is a pixel palette database; palettes download "for free in 6 different formats." The page links Terms and Conditions that were not read, so per-palette terms are unverified. Example cool or blue palettes listed: Sunlight-11, Hot Spring 6. | [Lospec Palette List](https://lospec.com/palette-list)

Fonts with licenses (as stated on each page; confirm the LICENSE file before shipping)

| Font | Type | License as stated | Source |
| --- | --- | --- | --- |
| Monogram | Monospace bitmap; TTF, PNG and JSON bitmap, PICO-8 font | "Creative Commons Zero v1.0"; author: "CC0, public domain. I appreciate attribution or donations, but nothing is required." Pixel grid not stated. | [itch.io](https://datagoblin.itch.io/monogram) |
| Departure Mono | Fixed-width pixel typeface by Helena Zhang | "licensed under the SIL OFL." Grid and formats not stated on the page. | [departuremono.com](https://departuremono.com/) |
| Unscii | Bitmap; unscii-8 (8x8), unscii-16 (8x16); TTF, OTF, WOFF, PCF, HEX | "the other variants are in the Public Domain"; unscii-16-full "falls under GPL." | [viznut.fi](http://viznut.fi/unscii/) |
| Spleen | Monospaced bitmap; 5x8, 6x12, 8x16, 12x24, 16x32, 32x64; BDF base; OTF, OTB, WOFF in release | "Spleen is released under the BSD 2-Clause license." | [GitHub](https://github.com/fcambus/spleen) |
| Kenney Fonts | Pack of 11 files tagged "pixel"; individual font names not shown on the page | "Creative Commons CC0" | [kenney.nl](https://kenney.nl/assets/kenney-fonts) |
| Ultimate Oldschool PC Font Pack v2.2 | Pixel-perfect remakes of DOS-era IBM PC, BIOS, and system fonts; TTF, FON, WOFF | "Free to use under the CC BY-SA 4.0 license"; attribution and share-alike terms are in the Readme, not on the page. | [int10h.org](https://int10h.org/oldschool-pc-fonts/) |

- Press Start 2P and similar Google Fonts pixel faces are avoided by instruction (brief and Michael's stated dislike of default-looking type). Not independently sourced.

CRT, scanline, and bloom in Phaser 3 vs Phaser 4
- Phaser 3.60 added FX: "a powerful and flexible way to apply both pre and post-processing effects," WebGL only. Built-ins: Barrel, Bloom, Blur, Bokeh, Tilt Shift, Circle, ColorMatrix, Displacement, Glow, Gradient, Pixelate, Shadow, Shine, Vignette, Wipe, Reveal. Pattern: `camera.postFX.addVignette(x, y, radius, strength)`, `addBarrel(amount)`, `addPixelate(amount)`, `addBloom(color, offsetX, offsetY, blurStrength, strength, steps)`. Higher Bloom or Blur `steps` cost "exponentially more gl operations." Camera FX affect everything the camera renders. | [Phaser docs: FX](https://docs.phaser.io/phaser/concepts/fx)
- Phaser 3.50 introduced a `PostFXPipeline` class for custom post-processing (with helper render targets and `copyFrame`/`drawFrame` methods) and `setPostPipeline` on Game Objects and Cameras. The registration call was not verified. | [Phaser repo](https://github.com/phaserjs/phaser), changelog/v3/3.50/CHANGELOG-v3.50.md
- Phaser 4 replaced FX and masks with Filters: `gameObject.filters.internal` and `.external`; cameras have filters by default, game objects need `enableFilters()`; "Filters are WebGL only"; "Use internal filters wherever possible for better performance"; each object with active filters adds draw calls. | [Phaser 4.2.1 filters guide](https://unpkg.com/phaser@4.2.1/skills/filters-and-postfx/SKILL.md)
- Same guide: v3 `postFX.addBloom()` is gone ("v4 does not have a dedicated Bloom filter"); build it with `addParallelFilters()` plus Threshold plus Blur plus ADD blend, or call `Phaser.Actions.AddEffectBloom(camera)`. v3 `addCircle` is removed (use Vignette or a circular Mask); `camera.setMask` becomes `addMask`. New in v4: Blocky, Quantize, Key, Blend, CombineColorMatrix, ImageLight, NormalTools, PanoramaBlur, ParallelFilters, Sampler.
- `AddEffectBloom` doc: "Bloom is best as a full-screen effect"; "too much is obvious and a subtle effect is best." | [Phaser repo](https://github.com/phaserjs/phaser), src/actions/AddEffectBloom.js
- No scanline or CRT filter exists in either line. In the v4 source the only mentions are the Barrel render node doc ("commonly used to simulate fisheye lenses, VR screen curvature, or retro CRT") and the Blocky changelog entry ("a good option for pixelating a retro game at high resolution, setting up for additional filters such as CRT emulation"). | [Phaser repo](https://github.com/phaserjs/phaser), src/renderer/webgl/renderNodes/filters/FilterBarrel.js, changelog/v4/4.0/CHANGELOG-v4.0.0.md
- Phaser 4 custom filters: every filter is a `Phaser.Filters.Controller` subclass naming a render node; shader filters extend `BaseFilterShader` with fragment shader source and a `setupUniforms` method; render nodes can be registered through the `render.renderNodes` config or `renderer.renderNodes.addNodeConstructor`. v3 custom pipelines "will need to be rewritten as render nodes." The filters guide has no custom-shader tutorial. `BaseFilterShader` warns that `gl_FragCoord` is vertically flipped inside framebuffers versus the main canvas. | [Phaser repo](https://github.com/phaserjs/phaser), src/renderer/webgl/renderNodes/filters/BaseFilterShader.js, FilterVignette.js, skills/v3-to-v4-migration/SKILL.md
- Phaser 4 camera-level filters affect everything that camera renders, so a separate UI camera can be left unfiltered (paraphrase of the article). | [Phaser news: Phaser 4 filter system](https://phaser.io/news/2026/05/phaser-4-filter-system)
- Phaser 4 Wipe: animate `progress` with a tween; direction and axis settable; `wipeTexture` shows another texture where the input is wiped, so it can serve scene-to-scene transitions. | [Phaser repo](https://github.com/phaserjs/phaser), src/filters/Wipe.js and skills/filters-and-postfx/SKILL.md
- rex Horrifi (Phaser 4 plugin notes) bundles Bloom, Chromatic Aberration, Scanlines, VHS Distortion, CRT TV Curve, Noise, Vignette; properties include `scanlinesEnable`, `scanStrength`, `crtEnable`, `bloomEnable`; attach with `camera.filters.internal.addRexHorrifi(config)`; one Horrifi per camera; WebGL only. The page states no license. | [rex notes: Horrifi](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-horrifi)
- `npm view` on 2026-11-01: `phaser4-rex-plugins` license MIT, version 4.2.0; `phaser3-rex-plugins` license MIT, version 1.80.20. | [npm registry: phaser4-rex-plugins](https://registry.npmjs.org/phaser4-rex-plugins)

Motion and sound
- Tween ease options include `Linear` ("no easing") and `Stepped` ("discrete steps," `easeParams: [numSteps]`), plus Sine, Cubic, Back, Bounce, Elastic; `this.tweens.stagger(500, { grid: [10, 6], from: 'center' })` offsets delays across a grid. | [Phaser repo](https://github.com/phaserjs/phaser), skills/tweens/SKILL.md
- Audio: `this.sound.play('powerup', { volume: 0.5, rate: 1.2 })`; per-sound `rate` and `detune` (cents); audio sprites via `this.load.audioSprite` and `this.sound.playAudioSprite`; browser autoplay unlock handled; `pauseOnBlur` default true. | [Phaser repo](https://github.com/phaserjs/phaser), skills/audio-and-sound/SKILL.md
- Kenney Interface Sounds: 100 files tagged interface, click, button; license "Creative Commons CC0." | [kenney.nl](https://kenney.nl/assets/interface-sounds)
- ZzFX: "Less than 1 kilobyte when compressed," generates effects from a parameter array via the Web Audio API, "MIT licensed, use it anywhere!" (license text not shown on the page). | [GitHub: ZzFX](https://github.com/KilledByAPixel/ZzFX)
- Reactive sound precedent: Mini Metro's procedural audio (see section 1). Papers, Please's stamps and shutters have a "pleasantly-tactile feel" per the Game Developer writer (not Pope).

### Inferences
- A scanline filter at the game's low internal resolution would be one game pixel tall, which looks chunky. With `Scale.MAX_ZOOM` the canvas is magnified, not re-rendered, so finer lines need a CSS or DOM overlay at screen resolution, or a higher internal resolution plus v4 Blocky. A plain overlay also works in Phaser 3 and 4 and in a Canvas fallback, which has no filters at all.
- Palette lock via Quantize or GradientMap is v4 only. In Phaser 3, the equivalent is disciplined source art plus ColorMatrix (for example `grayscale`, `night`) for global tint.
- Bitmap text avoids canvas anti-aliasing and font-load timing issues (inference from the repo's rule of thumb, not a direct statement).
- Suggested motion for the satellite: `Linear` or `Stepped`, roughly 80 to 150 ms, no `Back`, `Bounce`, or `Elastic`. This is a taste suggestion, not sourced.
- Suggested sound: very short clicks or ticks, one chime per solved step, raised with `detune` for streaks, no reverb or ambience; silence between actions.
- Possible dither transition: Quantize has built-in dithering and Wipe takes a tweened `progress`. Whether a tweened Quantize can animate smoothly was not tested.
- Cross-track alignment: the Earth track proposes one 320x180 canvas with 16px tiles, a small blue-violet palette, and red, amber, and cyan signal colors (sibling file `earth_look__section.md`, read 2026-11-01). The satellite side should avoid those hues so the two halves never share a palette. Final resolution belongs to the tech-foundation track.
- Text-grid arithmetic (my calculation, not sourced): at 320x180 an 8x8 font gives 40 columns by 22 rows, and Spleen's 5x8 gives 64 columns by 22 rows. Dense puzzle labels may want a larger base such as 480x270 (60 columns at 8 px). Flag for tech-foundation.
- Kenney Fonts was left out of the section: the page lists 11 files tagged "pixel" but no font names, so nothing about the actual faces could be verified.

### Gaps
- No Phaser 3 code example for a scanline PostFXPipeline was found (last search was blocked by the shared budget). The 3.50 changelog confirms the class and `setPostPipeline`, not the registration call.
- No Phaser 4 custom-filter recipe exists in the guide; the pattern above is read from source files only.
- Kenney Fonts individual names, Monogram's native pixel grid, and Departure Mono's grid were not stated on their pages. Lospec per-palette terms unread. rex Horrifi's license is MIT per npm but not on its docs page.
- No GDC talk on UI sound or motion was fetched.

## 4. How do we make the two halves feel different, and what are the precedents for two deliberately different visual modes?

### Takeaway
Change several axes at once so the switch is felt without a label: color temperature, motion quantization, sound, framing, and camera behavior. Inscryption is the clearest precedent for switching perspective and render style between game sections, and Mini Metro shows palette and night modes are cheap to ship.

### Cited Findings
- Inscryption changes perspective and look between acts (first-person cabin, Pokémon-like pixel top-down, grid-room factory), and Mullins says visual styles change between acts to keep things surprising. | [Wikipedia: Inscryption](https://en.wikipedia.org/wiki/Inscryption); [Unity blog](https://blog.unity.com/en/games/3-lessons-in-storytelling-from-inscryption)
- Mini Metro offers "colourblind and night modes," so palette variants are an established, low-cost feature. | [Press kit](https://dinopoloclub.com/press/index.php)
- Severance's cold look comes from cool fluorescent light ("coldness and depression"), white walls with green carpet, and framing through doorways and behind desk dividers. | [Wikipedia: Severance](https://en.wikipedia.org/wiki/Severance_(TV_series)); [VFX Voice](https://vfxvoice.com/its-not-just-another-day-at-the-office-for-severance/)
- Duskers presents everything as "a filtered view" behind a monitor. | [Game Developer](https://gamedeveloper.com/design/road-to-the-igf-misfits-attic-s-i-duskers-i-)
- Spec Ops: The Line shows a white phosphorus strike only through a drone and targeting-computer screen (with Walker's face reflected in it), then has the player walk through the aftermath in the same space. | [Game Informer](https://gameinformer.com/b/features/archive/2014/04/16/moments-white-phosphorus-in-spec-ops-the-line)
- Phaser camera tools: `startFollow(target, roundPixels?, lerpX?, lerpY?, offsetX?, offsetY?)` (lerp 1 snaps, 0.1 is smooth), plus fade, flash, shake, pan, zoomTo, rotateTo. Phaser 4 camera filters can leave a separate UI camera untouched. | [Phaser repo](https://github.com/phaserjs/phaser), skills/cameras/SKILL.md; [Phaser news](https://phaser.io/news/2026/05/phaser-4-filter-system)
- DEFCON's music is "incredibly eerie and atmospheric" against a silent abstract board; Observation's reviewer singles out "tense silences" borrowed from horror cinema. | [VideoGamer](https://www.videogamer.com/?p=143865); [Wireframe](https://wireframe.raspberrypi.com/articles/observation-review-emoting-in-a-tin-can)

### Inferences
- Contrast table to propose (all inference, light touch):
  - Value and saturation: satellite high-key (light), desaturated, evenly lit, few values; Earth low-key (dark), saturated blue-violet with amber lamp pools (per the Earth track). Color temperature alone will not separate the halves because Earth is already cool.
  - Motion: satellite snaps to a grid (`Linear` or `Stepped`); Earth moves continuously with eased curves.
  - Camera: satellite fixed, integer zoom, no shake; Earth follows the kid with lerp (`startFollow`), shake on the blow-up.
  - Framing: satellite inside a bezel or letterbox frame; Earth full bleed.
  - Sound: satellite dry, close, tonal ticks; Earth ambient, reverberant, footsteps.
  - Post effects: scanlines and slight barrel on the satellite only; Earth gets vignette and darkness.
- The cut between halves could use `addWipe` (v4) or the Wipe FX (v3.60), or a dither dissolve, so the game's one big visual rule is "this edge means you changed selves."
- Mixed pixel scales between halves are acceptable because they are separate scenes (Inscryption does a similar thing). Not sourced.

### Gaps
- No source on the two-world precedents in Zelda or Metroid Prime was fetched; Inscryption and Spec Ops were enough.
- No GDC talk or developer interview about deliberately designing two visual modes was found.

## 5. How can a UI carry meaning that changes after a reveal? (options only, never a story decision)

### Takeaway
Keep the satellite UI plain and generic, then re-read the same elements later. Papers, Please and Spec Ops: The Line both rely on a stripped, mediated screen that the player later sees differently. Three technique-level options: change the wording, change a counter's unit, or zoom in until an icon resolves.

### Cited Findings
- Papers, Please: a family status screen of "a few dots with some text" lets players project their own family onto it; Pope kept dialog and detail minimal so the player's imagination fills the blanks. | [Game Developer](https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i-)
- Spec Ops: The Line: the strike is seen on a targeting screen with Walker "emotionless, even stoic"; the aftermath walk shows "their bodies still smoking from the white-phosphorus bath you gave them," which recasts the earlier screen as a barrier. (The barrier reading is the Game Informer writer's.) | [Game Informer](https://gameinformer.com/b/features/archive/2014/04/16/moments-white-phosphorus-in-spec-ops-the-line)
- Inscryption: because of low resolution, cards drop most text and use icons that sometimes cover portraits, so icons carry the meaning. | [Game Developer interview](https://www.gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption)
- Severance's terminals "lacked an escape key, as a metaphor for the lack of control the innies have." | [Wikipedia: Severance](https://en.wikipedia.org/wiki/Severance_(TV_series))
- Duskers: a command-line interface makes drones feel like a foreign "piece of metal" you still bond with ("Wilson Effect"). | [Game Developer](https://gamedeveloper.com/design/road-to-the-igf-misfits-attic-s-i-duskers-i-)
- Maven demo: the decision is described as "Left click, right click, left click." | [Business Insider via AOL](https://www.aol.com/articles/pentagon-provided-rare-inside-look-090701908.html)

### Inferences
Technique-level options, all neutral about story. If the draft twist stays, any of these can be used; if it changes, they still work:
1. Relabel. Layout, icons, and sprites stay identical; the strings come from a lookup table, so a log or tooltip can show different words later. Cheap in Phaser: `BitmapText.setText`.
2. Counter re-unit. A running tally (packets cleared, score) keeps its number; its unit label changes later or appears in a recap screen.
3. Zoom resolve. An abstract dot or square is magnified at integer steps (2x, 3x, 4x) until a detailed sprite appears. Needs the detailed art to exist at the same pixel density. Integer zoom avoids blur.
4. Missing control. The satellite UI never has an exit or back button (Severance's missing Escape key); a later screen shows the control or a locked version of it.
5. Palette bleed. The cool palette gains one warm Earth color on the satellite UI after a certain point.
6. Sound swap. The same click is pitch-shifted or dropped an octave (`detune`) in later batches.
- Michael's decision points: the section offers A (office terminal, light), B (war-room vectors, dark), C (flat map, light), each paired with one reveal tool (relabel, counter re-unit, zoom resolve). B is closest to Earth in value, so it leans on motion and sound for contrast. Any of options 1 to 6 can be mixed with any look.

### Gaps
- No academic or GDC source on "reveal UI design" as a technique was found; the list above is built from the precedents, not from a how-to.
- The Game Informer page is a short feature; a deeper analysis (for example The Artifice, PC Gamer) was in search results but not fetched.

### Needs Michael or Chrome
- Nothing was blocked, paywalled, or failed to render.
- Optional follow-ups that need a browser or Michael's eyes: view actual screenshots of Open MCT, OpenC3 COSMOS, QGroundControl, Palantir and Anduril marketing pages, and the Severance MDR screen; check Lospec per-palette terms; confirm the Kenney Fonts pack contents (names and pixel grids) and each font's LICENSE file; open Designer Notes #69 on Idle Thumbs for Chris Delay's transcript.
- Michael decisions: satellite look A, B, or C; which reveal tool(s) he wants available (relabel, counter re-unit, zoom resolve); whether CRT scanlines are wanted at all; type choice from the font list.
