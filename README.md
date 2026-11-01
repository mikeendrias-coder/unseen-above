# Unseen Above (working title)

Companion browser game for Michael Endrias's Intro to Space Law paper,
*Unseen Above: Space Law and the Power to See and Not Be Seen*.

A girl and her older brother scavenge a dead world and find a mansion that is perfectly untouched.
The player sneaks through it on Earth and, between episodes, solves satellite puzzles that slowly
stop looking like work and start looking like a kids' TV game. The story, characters and ending are
Michael's; this repo holds the code and art tools.

## Layout

| Folder | What it holds |
| --- | --- |
| `game/` | The real game: Phaser 4.2.1, bundled with esbuild into one HTML page |
| `prototypes/` | The first two prototypes (routing puzzles, Earth stealth) and their tests |
| `art/lookboard/` | The pixel scene generator behind the Game Look Board |
| `research/` | Research notes behind the mechanics and aesthetics reference doc |

## Build the game

```
cd game
npm install
npm run build        # writes dist/unseen-above.html (Phaser from jsDelivr) and dist/local.html (local Phaser, for tests)
```

Open `dist/local.html` through any static server (for example `python3 -m http.server` inside `dist/`).

## Rules for the art

- Pixel scenes are 320 x 180 and scaled by whole numbers, so pixels stay square.
- The five looks (A to E) share role names in `game/src/art/palettes.js`; switching looks swaps palettes, not drawings.
- No copied code or art from other games. Everything here is written or drawn for this project.
