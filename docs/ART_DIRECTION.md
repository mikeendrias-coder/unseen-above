# Art direction: final pass (Nov 17)

Every builder reads this before touching art, UI or text. It turns Michael's references into rules.
Michael's references: **Jump King** (scale, chunky readable sprites, jumps you can judge), **Geometry Dash / Jetpack Joyride** (pace, instant restarts, clear hazards), **Papers, Please** (black and white, flat, monotonous, bureaucratic). Goal in his words: "less Claude generated", "more like a generic pixel game" in the Ash and Gold look.

## 1. The palette (locked)
- Only colors from `game/src/art/palettes.js` `ASH` (plus pure black). No new hex values anywhere outside the satellite screens.
- The rule: grey ash world; **gold, bronze and warm light only for wealth**; **red only for what watches her**; **amber only for the lock-on box**.
- Papers, Please lean: most of every screen is 3 to 4 greys. Color is rare, so it means something.

## 2. Pixels, not effects (this is most of "looks generated")
- **No glows, no gradients, no additive blending, no soft alpha haze, no vignettes, no film grain.** Remove `softGlow`, `glowRect`, `BlendModes.ADD`, `createRadialGradient`/`createLinearGradient` in anything you own. Light is drawn as **hard-edged shapes**: a lamp is a lit pixel cluster plus a flat light cone in one lighter tone, or a 50% checker dither.
- Shading: max 3 tones per material (dark, base, light). Light comes from one side per scene.
- Alpha: only for whole-object fades in and out. Never to fake light.
- Particles: few, square, 1 to 2 px, solid palette colors, short-lived. Ash, dust, sparks.
- **Outlines:** characters and anything she can touch get a 1 px `ash0` outline where they meet a background of similar value, so they read like Jump King's sprites.
- Animations: 2 to 4 frames, snapped, no tweened scaling or rotation of pixel art. UI pops on and off, no eased slides.

## 3. Scale (Jump King)
- She is 8 x 14 px. Doors 32 to 36 px. Tables 12 px tall. Chairs 10 px seat. Steps 8 px. Picture frames hang with their bottom edge about 24 px up the wall.
- **High ceilings are good**: spend the height on wall decoration, galleries, balconies, and real vertical routes (ledges, walls to wall-jump, chandeliers). But **objects stay normal size** next to her.
- Platforms read as platforms: a 1 px light top edge, a darker face. Jumpable walls have a visible face. Anything that hurts has a clear silhouette in its own value.

## 4. Characters
- Big, clear, flat, few colors, 1 px outline, readable silhouette from across the screen. Faces are 1 to 3 pixels. No smooth vector people anywhere.
- Moon people: taller than her (about 20 to 24 px), fat simple shapes, gold and bone clothes, ash skin tones allowed (ash5/boneLo). The kids: about her size.
- The creator: crew coat, headset with the red on-air light.

## 5. Text and UI: paperwork (Papers, Please)
- Everything the show produces looks like **paperwork or a terminal**: forms with ruled lines, labels in caps, stamps (red stamp only when it is the watchers: APPROVED, REQUEST: VOLUNTARY, TAKE 12, OPERATOR: (none)).
- One pixel font family: the caption face (`art/ccfont.js`). No other fonts in the game picture.
- How-to pages are short **NOTICE** slips: a title, at most 3 short lines, a key shown as a key cap. No colored teletext bands.
- **Fewer words.** Hints are one line. Narration is one line per look. Dialogue lines are at most about 50 characters. Never repeat a line on a retry.
- Captions live in the strip under the picture (already built). Nothing covers characters.

## 6. Feel (Geometry Dash / Jetpack Joyride)
- Death is fast: short strike, body drops, new take in under a second after the first time.
- Each episode is a run of short readable challenges with one new idea each, under 90 s for a player who knows it, with rests between.
- Hazards announce themselves (a flash, a sound, a light) before they act.

## 7. Done means
- No item in section 2 left in your files. Screenshots at 1x look like a pixel game, not an illustration.
