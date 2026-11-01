## Satellite look and the two-halves contrast

Make the satellite half cold, flat, and low-resolution: few cool colors, snapped motion, dry sound. Make Earth the opposite. Keep labels and counters data-driven so a reveal can re-read them.

**Reference works**

| Work | What it does well | What we take |
| --- | --- | --- |
| [DEFCON](https://en.wikipedia.org/wiki/DEFCON_(video_game)) | Vector "big board." Deaths shown as megadeath numbers. Delay wanted "deep detachment." | Thin lines, tiny icons, numbers instead of faces. |
| [Mini Metro](https://en.wikipedia.org/wiki/Mini_Metro_(video_game)), [Motorways](https://en.wikipedia.org/wiki/Mini_Motorways) | Bold colors, simple geometry. Procedural audio follows the network; Motorways sound cues flag problems. | One color per meaning. Sound tied to game state. |
| [Duskers](https://en.wikipedia.org/wiki/Duskers) | Typed commands and a "filtered view" make the player feel remote. | Sensor-feed framing. Cold distance. |
| [Severance](https://en.wikipedia.org/wiki/Severance_(TV_series)) | MDR terminals modeled on 1970s units, no escape key, fluorescent light. | Chunky bezel, pale text, no exit button. |
| [TIS-100](https://en.wikipedia.org/wiki/TIS-100) | Fake 1970s computer. Twelve nodes in a four by three grid. | Node grid, terse labels. |
| [Papers, Please](https://en.wikipedia.org/wiki/Papers,_Please) | Deliberately clunky UI. Family screen: "just a few dots with some text." | People as dots and rows. |
| [Return of the Obra Dinn](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn) | 1-bit Mac look. Stable dither took Pope long to solve. | Dither for one transition only. |
| [Inscryption](https://en.wikipedia.org/wiki/Inscryption) | Acts switch perspective and style. | New camera and render style per half. |
| [Open MCT](https://github.com/nasa/openmct), [QGroundControl](https://github.com/mavlink/qgroundcontrol) | Real telemetry, map, and video panels. | Dense tables and plots. |
| [Predator feed](https://geographicalimaginations.com/2014/10/19/predator-view/), [Maven demo](https://www.aol.com/articles/pentagon-provided-rare-inside-look-090701908.html) | "Soda straw" view. A strike process described as "Left click, right click, left click." | Small framed feed. Few clicks for big acts. |

**Techniques**
- Pixels: set `pixelArt: true` (antialiasing off, `roundPixels` on). Low base size (Earth track proposes 320x180), integer scale only (`Scale.MAX_ZOOM`, whole-number camera zoom). Draw text with `add.bitmapText`, not canvas `Text`.
- Palette: 4 to 6 cool, desaturated values plus one alert color. Avoid Earth's blue-violet, red, amber, cyan. Phaser 4 `addQuantize` or `addGradientMap` can lock it.
- CRT: Phaser 3.60 has `postFX.addBarrel`, `addVignette`, `addBloom`. Phaser 4 has `filters.external.addBarrel`, `addVignette`, `Actions.AddEffectBloom`. Neither has scanlines: use a low-alpha line overlay or rex Horrifi (Phaser 4).
- Motion: `Linear` or `Stepped` tweens (`easeParams: [steps]`), about 100 ms, no overshoot. Earth uses eased curves.
- Sound: dry ticks, one rising chime per solved step (`rate` or `detune`).
- Contrast: light and desaturated vs dark and saturated, snapped vs continuous motion, fixed vs following camera, dry vs reverberant sound, bezel vs full bleed. Cut between halves with `addWipe`.
- Sanitizing moves in public sources: narrow feed, targets as list entries, plain nouns ("enemy equipment"), three-click decisions.

**Options for Michael**

Reveal tools fit any look and decide nothing about the twist. Precedent: [Spec Ops: The Line](https://gameinformer.com/b/features/archive/2014/04/16/moments-white-phosphorus-in-spec-ops-the-line).
- A, Office terminal (light): off-white and grey-green screen, chunky bezel, scanlines. Reveal tool: the log panel's wording changes, icons stay.
- B, War-room vectors (dark): thin pale lines on near-black, number readouts. Dark like Earth, so motion and sound carry the contrast. Reveal tool: a running counter keeps its number but gets a new unit label.
- C, Flat map (light): bold flat shapes on pale grey, no bezel. Reveal tool: zoom a dot at integer scale until it resolves into a detailed sprite.

**Fonts and tools**
- Fonts: [Monogram](https://datagoblin.itch.io/monogram) (CC0), [Departure Mono](https://departuremono.com/) (SIL OFL), [Unscii](http://viznut.fi/unscii/) (public domain, except the GPL 16-full), [Spleen](https://github.com/fcambus/spleen) (BSD 2-Clause), [Oldschool PC Fonts](https://int10h.org/oldschool-pc-fonts/) (CC BY-SA 4.0, real BIOS look, share-alike). Skip Press Start 2P.
- [BMFont](https://www.angelcode.com/products/bmfont/) (zlib) turns a TTF into the PNG plus XML that `load.bitmapFont` reads.
- Effects: [rex Horrifi](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-horrifi) (MIT per npm). Sound: [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) (CC0), [ZzFX](https://github.com/KilledByAPixel/ZzFX) (MIT). Palettes: [Lospec](https://lospec.com/palette-list) (check each page).

Sources: [Delay interview](https://www.videogamer.com/?p=143865) · [Duskers interview](https://gamedeveloper.com/design/road-to-the-igf-misfits-attic-s-i-duskers-i-) · [Pope on Papers, Please](https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i-) · [Pope on 1-bit](https://www.pcgamer.com/uk/lucas-pope-on-the-challenge-of-creating-obra-dinns-1-bit-aesthetic/) · [Palantir AIP demo](https://vice.com/en/article/palantir-demos-ai-to-fight-wars-but-says-it-will-be-totally-ethical-dont-worry-about-it) · [Phaser 4 filters](https://unpkg.com/phaser@4.2.1/skills/filters-and-postfx/SKILL.md) · [Phaser 3 FX](https://docs.phaser.io/phaser/concepts/fx) · [Phaser repo](https://github.com/phaserjs/phaser)
