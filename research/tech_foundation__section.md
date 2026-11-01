## Technical foundation

**Recommendation**

Build on Phaser 4.2.1, pinned exactly, with Vite and TypeScript and almost no plugins. Phaser 3 stopped at 3.90.0 (May 2025), and only Phaser 4 has cone lights. Ship a hosted build for the class link plus a single-file HTML backup.

**Engine version**

| Option | Pros | Cons |
| --- | --- | --- |
| Phaser 4.2.1 (9 Jul 2026) | Current line. Cone lights for flashlights and sensor cones. Filters (Mask, Vignette). Ships AI skills and types. MIT (not the separate Phaser AE). | 108 open issues. Skip TilemapGPULayer and HiDPI camera zoom (#7317, #7351). |
| Phaser 3.90.0 (23 May 2025) | Frozen, so stable. Biggest example base. | No release in 17 months, no v3 branch, no cone lights. |

**Setup and tools**

| Tool | Use | License | Link |
| --- | --- | --- | --- |
| template-vite-ts | Vite and TypeScript starter. Bump to 4.2.1. Use `build-nolog`; defaults ping gryzor.co. | MIT | [repo](https://github.com/phaserjs/template-vite-ts) |
| Tiled 1.12.2 | Level maps. Export JSON, embedded tilesets, CSV layers. | GPL editor, BSD libtiled | [site](https://www.mapeditor.org/) |
| Aseprite, Pixelorama, LibreSprite | Sprites. Phaser has `load.aseprite`. | Aseprite: EULA, personal compile only. Pixelorama: MIT. LibreSprite: GPL-2.0. | [Aseprite](https://github.com/aseprite/aseprite) [Pixelorama](https://github.com/Orama-Interactive/Pixelorama) |
| fontbm | Command line bitmap fonts. BMFont is Windows only. | MIT | [repo](https://github.com/vladimirgamalyan/fontbm) |
| jsfxr, sfxr | Placeholder sounds as data URIs. | Unlicense, MIT | [repo](https://github.com/chr15m/jsfxr) |
| PixelLab MCP | Characters (4 or 8 directions), tilesets, map objects. Billed per call. Map objects expire after 8 hours. | Proprietary | [docs](https://www.pixellab.ai/mcp) |

**Plugins**

| Plugin | Use | Phaser 3/4 support | License |
| --- | --- | --- | --- |
| [grid-engine](https://github.com/Annoraaq/grid-engine) | Tile-locked movement, pathfinding. Optional. | 2.52+ needs Phaser 4. Peer `~4.0.0` excludes 4.2.1. | Apache-2.0 |
| [phaser-raycaster](https://github.com/wiserim/phaser-raycaster) | Wall-blocked sensor cones. Optional. | 0.11.0+ supports 3 and 4. | ISC (package.json), MIT (LICENSE) |
| [rex plugins](https://github.com/rexrainbow/phaser3-rex-notes) | UI widgets. Not needed. | Separate `phaser4-rex-plugins`, `phaser3-rex-plugins`. | MIT |
| Built in | Cone lights, Mask and Vignette filters. | Filters 4.0+, cone lights 4.2.0+. | MIT |

**Project structure**
- `steps.ts` lists the 9 steps. Each win calls `scene.start(nextKind, { stepIndex })`.
- Scenes: `EarthSide`, `EarthTopDown`, `Satellite` (one plug-in per puzzle type), and a parallel `Hud` via `scene.launch`. Levels are data, not classes.
- `this.registry` holds shared state: step, glasses (none, on, broken), checkpoint, hardcore.
- `controls.ts` returns one intent object per frame. Keyboard now, touch later.
- Save versioned JSON to `localStorage` at checkpoints, in try/catch, with an in-memory fallback.
- Arcade physics in both views (zero gravity top-down). Config: `pixelArt: true`, `Scale.FIT`.
- Assets: Tiled JSON, Aseprite sheets, or `Graphics.generateTexture`. Puzzle rules live in pure, tested modules.

**Shipping**
- Main link: hosted Vite build on Vercel Hobby (non-commercial) or Cloudflare Pages Free. Share the production domain; test in a private window.
- Backup: `vite-plugin-singlefile` inlines imported assets into one HTML file. Phaser loads data URIs, and `sound.decodeAudio` takes base64. No dynamic imports. Base64 adds a third to asset size. Not built yet.
- itch.io works (zip, 1,000 files max) but needs an account.
- Prototype CDN: `cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js` is verified; cdnjs is not. Add a "press any key" screen, since browsers lock audio.

**Projects to learn from**

| Project | License | What to learn |
| --- | --- | --- |
| [wild-adventure](https://github.com/xnt/wild-adventure) | MIT | Top-down Phaser 4. Keyboard and touch share one intent object. |
| [the-11th-forest](https://github.com/FireTable/the-11th-forest) | MIT | One generic scene loads any level from data. One versioned save key. |
| [AI-First Starter](https://github.com/boringstack-xyz/Phaser-TypeScript-AI-First-Starter) | MIT | Pure rules apart from Phaser, so tests catch logic bugs. |
| [phaserjs/examples](https://github.com/phaserjs/examples) | MIT code, restricted assets | 15 small complete games. |

Sources: [npm](https://registry.npmjs.org/phaser/latest), [Migration guide](https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/MIGRATION-GUIDE.md), [jsDelivr](https://data.jsdelivr.com/v1/packages/npm/phaser), [PixelLab](https://www.pixellab.ai/mcp), [Vercel](https://vercel.com/docs/plans/hobby)
