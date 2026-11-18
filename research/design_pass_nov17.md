# Design pass, Nov 17: plot, endings, things to do, movement, puzzles, dialogue

Everything here is a proposal for Michael. Story items are marked OPTION. Nothing in this file is decided.

One rule ties the whole pass together, and I recommend it first: **what watches her kills her; what is only a house hurts her.** Lasers, strikes, lights and cameras are instant death. Falls, debris and robots cost HP. The player learns the thesis through the damage rules: the danger that matters comes from above and leaves no trace of who sent it.

## 1. Plot: five options to deepen what exists

Recommendation: take Option A and Option B. They cost little, they reuse planted clues, and they feed the endings in section 2. The others are good but optional.

**OPTION A. The unsigned request.** Each episode hides one paper with the same form: "REQUEST: VOLUNTARY. Please locate the subject. Thank you for your cooperation." The signature line is blank every time. The last one sits on the console backstage, filled in by a child's game account: "PLAYER 2". Ties to Part III: informal requests hide their source and leave no formal record. Cost: one look per episode and one prop.

**OPTION B. The record runs one way.** The show keeps a perfect record of her: CONTINUITY photos, take numbers, her death map in batch 3. It keeps no record of who aimed. Make that visible: the backstage clapperboard shows her real take count from the save; the console log lists every strike with "OPERATOR: (none)". Ties to the thesis directly: she is fully seen, the watchers are not.

**OPTION C. The brother got further before.** His three belongings (crowbar, bedroll, bag) each carry a mark he left on an earlier take: a tally scratched on the crowbar, a route drawn inside the bedroll, a note in the bag: "Don't let her follow." This deepens "I always come back" without a new scene. Ties to the clones and to the Carpenter row (a long record reveals a life).

**OPTION D. The blur.** One zone on every satellite map that the cursor or marker cannot enter. In batch 4 the player learns it is the Moon city. Ties to Part II (Kyl-Bingaman: one place gets a blur; she never does). Already in the plan doc; this pass makes it a puzzle rule (section 5).

**OPTION E. Turn the camera around.** The kids' camera can be turned on the playroom, so Earth's TVs show the watchers. This is the plan doc's exposure option, now as one ending among several rather than a replacement for the vest. Ties to Part V (supervision, the watchers made visible).

## 2. Multiple endings: a concrete system

Recommendation: four endings plus one short false ending, decided by tracked clues, one boss behavior, and one choice in the playroom. All state sits in the existing save.

### What is tracked

Add one object to `state.js` (saved with the rest):

```
story: { clues: {}, choice: null, creatorDeaths: 0, gaveUp: false, spared: false, killedBroken: false, endings: {} }
```

- `state.clue(id)` marks a clue when she presses E on a tagged look. `addLook` gets an optional `clue` field.
- Clues stay found across retries and across episodes. A new game clears them.
- `endings` records which endings this browser has seen. The Chapters menu shows them as CH 07 listings; unseen ones read `----`.

### The clues (existing looks tagged, plus a few new ones)

Two groups. "Who aims" clues point at the satellite and the kids. "What she is" clues point at the clones and the show.

| Episode | Who aims | What she is |
| --- | --- | --- |
| Ep1 grounds | `statue07` (plaque 07, exists); `request1` (new, Option A) | `footprints` (new, section 3) |
| Ep2 gallery | `cameraMoon` (broken camera faces the Moon, exists); `laserTone` (new look at the emitter after it fires) | `drawer` (glasses back in the drawer, take 2 or later) |
| Ep3 east wing | `routeMap` (her route in red on the desk, exists) | `oldBody` (exists) |
| Ep4 bedroom | `request4` (new) | `bagNote` (new, Option C) |
| Satellite | `blur` (try to enter the blurred zone); `operator` (click the empty OPERATOR field) | none |
| Ep5 city | `tuesday` ("My son aims on Tuesdays", exists) | `lostGlasses` (new) |
| Ep5 backstage | `console` (ROUND TWO sticker, exists) | `continuity`, `shelf` (exist); `ownBody` (look at any of her own bodies, anywhere) |

That is 9 "who aims" clues and 8 "what she is" clues. All optional. A first-time player who never presses E still finishes.

### The boss branch

- `creatorDeaths` counts her deaths in ep5b, saved.
- At 6 deaths, the next take starts in give-up mode (`gaveUp = true`). The trigger needs to be generous: classmates who die six times are exactly the ones who need the game to change.
- Give-up mode: the creator drops the sword, stands center stage, and screams "End it all." on a loop every 4 s. No attacks. The HP bar shows 9 segments. Each hit removes one, slowly (the bar drains over 0.6 s). The shutter to the playroom is already open.
- Two ways out. Hit all 9 times: `killedBroken = true`. Walk out the open shutter without landing another hit: `spared = true`.
- A normal win (the creator yields) also sets `spared = true`, since she let them live.

### The endings, with exact conditions (checked in this order)

1. **END IT ALL** (bad). Condition: `killedBroken`. The headset light goes out. The shutter leads to an empty playroom: toys, the screen showing a rerun of the grounds. She sits. Last shot: the old TV on Earth showing RERUN. Mirrors the "content" line: nothing changes, the show just airs something else. OPTION for Michael, including whether the creator dies or only stops.
2. **ROUND TWO** (bad, the loop). Condition: in the playroom she answers "Are you here for round two?" with "Yes." She takes a controller. Cut to the ridge: a new girl, lower third TAKE 1. Complicity: she becomes the one who aims. Always available.
3. **LOOK BACK** (good). Condition: the third playroom choice "Turn it around" is offered only if `whoAims >= 5` or `spared` is true from give-up mode. She turns the kids' camera on the room. Last shot: the old TV on Earth shows the playroom; the kids squint into the light. The watchers are seen. This is the ending that matches Part V.
4. **THE VEST** (Michael's existing ending). Condition: everything else. Two clicks, white, the Moon on the old TV. Unchanged.
5. **WE'LL BE RIGHT BACK** (false ending, optional). Condition: in the bedroom, she holds E on her brother for 15 s instead of going to the door. The red lights close in; card: "CH 07. WE'LL BE RIGHT BACK." Then the bedroom reloads at the kneel. Costs 15 s only for players who look for it. Precedent: The Stanley Parable resets to the start after each ending and keeps the game short so all endings can be seen; NieR: Automata counts 21 of its 26 endings as game-over events.

Why this shape:

- Undertale lets bosses be spared and changes its route by what the player did, not by a menu ([Wikipedia](https://en.wikipedia.org/wiki/Undertale)). The give-up mode is the same idea: behavior picks the ending.
- Katana Zero keeps one plot and branches at a choice in the final confrontation ([Wikipedia](https://en.wikipedia.org/wiki/Katana_Zero)). That is our playroom choice.
- INSIDE hides an alternate ending behind optional orbs in hidden rooms ([Wikipedia](https://en.wikipedia.org/wiki/Inside_(video_game))). Our clue threshold works the same way but needs only 5 of 9, so nobody has to find everything.
- Return of the Obra Dinn confirms fates in threes to stop guessing ([Wikipedia](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn)). Borrow the honesty: when a clue is found, the OSD can say "NOTED (3)" so the player knows looking counts.

## 3. New elements: small things to do, per episode

Recommendation: 3 to 6 looks or one-press actions per part, each under 5 s, none required. Gold only on wealth, red only on watchers. Several double as clues above.

**Ep1, the grounds**
- Footprints in the ash. Her brother's lead to the gate. On later takes, her own earlier tracks show too, stopping where she died.
- Mailbox (E): "OCCUPANT, ESTATE 07." Inside, the unsigned request (Option A).
- Gate intercom (E): a cyan voice, "Please hold." Press again: "Your call is being recorded."
- Koi in the fountain: gold, perfectly in step. They are on a track.
- Searchlights stop on her old bodies for a beat, as if framing them. Reactive, no text.

**Ep2, the gallery**
- Portrait eyes really track her (two red pixels). Red is right: they are watchers.
- Light switch (E): the gold chandeliers go dark; the cameras' red LEDs stay on. One press says the thesis.
- The cleaning robot sweeps her bodies into a neat row by the wall on the next take. "Tidy for the next take."
- Laser emitter (E, after it fires): "That sound again. Like a prize." (`laserTone`)

**Ep3, the east wing**
- Dumbwaiter: drop a pebble in; it lands two rooms over and draws the patrol robot. A new use for pebbles, no new rule.
- A wall calendar where every day is marked 07.
- A transistor radio that plays the satellite puzzle's note ladder when she nears a sensor. Sound clue, also a hint.

**Ep4, the bedroom**
- A music box (E) that masks noise for 3 s, a second tool beside the clock.
- A framed family photo: her brother stands in the background of every one, at different ages.
- A window with the Moon and its one lit window.
- The bag note (Option C), read only if she holds E on the bag for its full pull.

**Satellite**
- An OPERATOR field that stays blank. Clicking it shows "(not required)". (`operator`)
- A stamp in the corner each batch: REQUEST: VOLUNTARY, then PUBLIC FEED: OFF, then PRIVACY: OUT OF SCOPE, then ROUND TWO.

**Ep5, the Moon and backstage**
- Noticeboard: an aiming rota. "Tue: Theo. Wed: Ada." (`tuesday` partner)
- Lost and found: a tray of her glasses. (`lostGlasses`)
- Clapperboard: the real take count from the save (Option B). Live data is the best reactive detail we have.
- A script on the creator's desk with her lines highlighted. The ones she already said are crossed out.


## 4. Movement and challenge

Recommendation: HP for the house, instant death for the watchers, short instant restarts, lives as a soft budget per episode. Numbers fit the current controller in `core/side.js` (TILE 16, she is 14 px tall, jumpV 236, g 690, maxFall 260).

### How the pieces fit

- **Two hazard tiers.** Instant death: satellite strike, laser, lock-on, searchlight, flash camera, the creator's traps. Damage: falls, falling slabs and glass, the patrol robot's bump, the creator's sword. The tier is the lesson.
- **HP: 3 pips**, drawn as three small white squares in the caption strip, not on the picture. Full at the start of every take. No healing pickups; levels are short.
- **Instant restart.** After the first death, the strike plays short and the take restarts 0.6 s after the body lands. Super Meat Boy keeps restarts instant and levels short so death never feels like a penalty ([Wikipedia](https://en.wikipedia.org/wiki/Super_Meat_Boy)). Limbo's team said the same about "trial and death" ([Wikipedia](https://en.wikipedia.org/wiki/Limbo_(video_game))). Geometry Dash restarts the level on any collision ([Wikipedia](https://en.wikipedia.org/wiki/Geometry_Dash)).
- **Keep each episode under 90 s for a player who knows it.** No checkpoints only works when a full run is short.
- **Lives: 5 per episode visit.** Shown as "TAKES LEFT 5" in the lower third. At 0, she restarts the episode with its intro card and 5 fresh lives; bodies stay. Do not send players back past the satellite batch: the audience is non-gamers and runtime must not grow. Story mode hides lives and HP. The existing "N skips ahead" after 3 deaths stays.

### Recommended numbers

| Thing | Number | Why |
| --- | --- | --- |
| Jump | keep jumpV 236 | about 40 px, 2.5 tiles |
| Double jump | 0.8 x jumpV (189) | adds about 26 px; total about 66 px, 4 tiles |
| Wall slide speed | 60 px/s max | readable, gives time to choose |
| Wall jump | vy -210, vx 110 away; input toward the wall ignored for 0.15 s | stops climbing one wall forever |
| Wall jump reach | from 2 px off the wall | Celeste allows 2 px, a quarter tile at 320x180 ([Thorson](https://maddymakesgames.com/articles/celeste_and_forgiveness/index.html)) |
| Wall contact | refills the double jump | lets wall chains feel good |
| Fall damage | 1 HP from 80 px (5 tiles), 2 HP from 128 px (8 tiles), death from 176 px (11 tiles) | above a full double jump, so her own jumps never hurt her |
| Hard landing | 0.3 s stagger at 1 HP falls | the cost you can see |
| Invulnerable after damage | 1.0 s, sprite blinks | no double hits |

- **Measure falls by distance, not speed.** maxFall 260 is reached after about 49 px, so speed cannot tell a 5 tile drop from a 10 tile one. Track the highest y since she last stood or touched a wall.
- **Wall slide resets the fall.** Sliding down a wall is the safe way down. That teaches the wall jump without a page.
- Dead Cells has no fall damage but stuns longer the further you fall ([wiki](https://deadcells.wiki.gg/wiki/Mechanics)). If damage feels harsh in playtests, switch to stun only. (The Spelunky wiki's fall page was blocked, HTTP 402.)
- Keep the Celeste forgiveness already in side.js (coyote 0.1, buffer 0.1). Add corner correction: a head bump within 3 px of a ledge edge nudges her past it.
- **Boss.** Creator HP bar: 9 segments, top of the strip. Her HP in the fight: 3. A sword cut costs 1; the round's trap (searchlight, laser, flash) kills outright. Same tier rule as everywhere.
- **Scale.** Doors 32 px tall, chairs 10 px seat height, tables 12 px, frames hung so their bottom edge sits about 24 px up. High ceilings stay; furniture shrinks to her world. Decoration climbs the walls, not the props.
- **Physics, cheap ones.** A chandelier that swings and can be ridden; a crate she pushes into a searchlight's path to hide behind; slabs that tip when she lands. Each uses the existing prop collision.

## 5. The satellite puzzle rework

Recommendation: Design A as the tutorial, Design B for batches 1 to 4. One puzzle per batch, about 2 to 3 min each, replacing three boards. The board shape stays the same across batches so the four-step skin change still reads.

All three designs draw in 2D: a list of 3D points rotated by two angles, projected, sorted back to front, drawn with Graphics. Only the front half is drawn. No 3D engine needed.

### Design A: the orbit ring (tutorial)

- A ring, drawn as a tilted band, with a groove maze on its outer face. A marker (the "request") sits in the groove.
- Left and right turn the ring. Gravity pulls the marker down the screen, so turning the ring rolls it along the grooves.
- Goal: bring the marker to the lock point at the top. When it arrives, the amber lock box appears.
- One axis, so it teaches turning in under a minute. Reads as surveillance: the ring is the orbit, turning it is moving the satellite.

### Design B: the globe maze (main)

- A sphere with a maze on its surface, Michael's example. Arrows turn it on two axes. A bead rolls toward the bottom of the screen. Bring the bead to the red target.
- Precedent: the Perplexus toy is a ball maze inside a clear sphere, turned in the hands ([Wikipedia](https://en.wikipedia.org/wiki/Perplexus)). Monument Valley gives each of its ten short levels one new central idea and aims for most players to finish ([Wikipedia](https://en.wikipedia.org/wiki/Monument_Valley_(video_game))). Copy the pacing, not the look.
- Gimmick per batch:

| Batch | Skin | Gimmick | Surveillance reading |
| --- | --- | --- | --- |
| 1 | Terminal | One-way gates on the surface | Tasking only flows one way |
| 2 | Ground station | Two beads, two targets; route both (replaces sorting) | Two requests in one pass |
| 3 | Flat map | The blurred zone (Option D): the bead bounces off it. The target drifts when you are slow | Some places cannot be seen; people move |
| 4 | Game show | The globe is the cartoon Earth from `wins.js`. The target is a girl in pink | The reveal, already built |

- Batch 3 can end on the existing death map, now drawn on the globe.
- Falling off a ledge into a pit returns the bead to start. No timer except batch 3's drift.

### Design C: the coverage cube (alternate)

- The estate as a cube that turns in 90 degree steps. Each face shows a side of the house. A beam enters one face; windows on the faces only line up from certain turns. Line them up so the beam reaches a lit room.
- Precedent: Fez shows four 2D views of a 3D space, and turning connects platforms that cannot meet otherwise ([Wikipedia](https://en.wikipedia.org/wiki/Fez_(video_game))). Antichamber's map room lets players return to any solved space ([Wikipedia](https://en.wikipedia.org/wiki/Antichamber)).
- Stronger reveal (the lit room is where she is), but harder for non-gamers. A fallback.

## 6. Dialogue

Recommendation: three rules, one memory, and cuts to about 60 percent of current length.

### Rules

- One idea per line, at most 50 characters. `lineSeconds` gives 1.5 s plus 0.052 s per character, so 50 characters is about 4 s.
- No scene over 8 spoken lines. Sound captions do not count.
- Heard lines never repeat. Add `story.heard` (line ids). Scenes skip heard lines on retries. NOTICE looks show only their last line after the first press.
- HALL_AGAIN plays on the first two retries only, then silence. Silence after many deaths says more.

### The fixed train into the fight (DRAFT, always the same, plays once per arrival)

Retries start at round 1, not here.

1. CREATOR: Every room you walked through, I built.
2. CREATOR: I put the glasses back in the drawer after every take.
3. SISTER: Why are you doing this?
4. CREATOR: Because they are watching. Same as you.
5. CREATOR: The kids voted for a fight tonight. Here.
6. [A SWORD CLATTERS]
7. CREATOR: Hold it up. They need to see you hold it.

Give-up mode line (DRAFT, Michael's words): "End it all." Nothing else. Repetition is the scene.

### Suggested cuts (quoting the current lines)

- RIDGE: cut "You said we stay away from the untouched ones." and "Until we had no choice. We have no choice." Shorten "That's what scares me. Places like that don't stay clean by accident." to "Places like that don't stay clean by accident." Result: 10 lines.
- BEDROOM: cut "We have the bag. We can stop the bleeding.", "What does that mean?" and the second "[COUGHING]". "That's what I'm afraid of." then goes straight to "Don't open that door." Stronger without the question.
- HALL_IN: cut "There you are. Mind the cables. Those are mine too." and "I keep the front of the house perfect. Nobody up here pays to watch the back." Keep the other two (see train).
- HALL_ROUND: cut the second lines "They loved that." and "A warning. The only kind thing I was allowed to build." (the second is already a flagged choice).
- HALL_HIT: keep 4 of 9: "Do you know what they call this up here? Content.", "Being seen is the one thing they cannot buy. So they buy it from us.", "The satellite is not mine. The kids aim it. They think it is a puzzle.", "They are watching me lose. It is the first time anyone has watched me at all." Cut "Good. They can see that from the cheap seats.", "I have never been on screen. Not once. I am the reason you are.", "They did not build any of this. They bought the Moon, then they bought us.", "You want the point of it all? So they never have to look at anything real." and "Enough. That is enough." Hits 2, 4, 6 and 8 speak; the HP bar carries the rest.
- HALL_YIELD: cut "There is nowhere to go. It is the Moon." if LOOK BACK ships; the open question then lands in the playroom.
- PLAYROOM: keep; add the choice at "Are you here for round two?" (Who picks the lights? / Yes. / Turn it around).

## 7. Build order (smallest high-impact first)

1. `story.heard` and the dialogue cuts. Half a day. Fixes the retry complaint at once.
2. Two hazard tiers, 3 HP pips, fall damage by distance. Touches `side.js` and `death.js`.
3. Fixed pre-fight train, creator HP bar, give-up mode at 6 deaths, `spared` and `killedBroken`.
4. Story flags and clue tags on existing looks (`addLook` gets `clue`). Most clues already exist.
5. Playroom choice and the four endings (reuse the old TV last shot for each).
6. Double jump, wall slide, wall jump, corner correction. Then rebuild the grounds with height and walls as the test level.
7. Lives (5 per visit) and the 0.6 s restart.
8. New interactables, one episode at a time, starting with the gallery (light switch, robot tidying bodies).
9. Satellite ring tutorial, then globe batches 1 to 4.
10. Scale pass and new sprites, together, after layouts settle.

Sources: [Celeste and Forgiveness](https://maddymakesgames.com/articles/celeste_and_forgiveness/index.html) · [Celeste](https://en.wikipedia.org/wiki/Celeste_(video_game)) · [Super Meat Boy](https://en.wikipedia.org/wiki/Super_Meat_Boy) · [Geometry Dash](https://en.wikipedia.org/wiki/Geometry_Dash) · [Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game)) · [INSIDE](https://en.wikipedia.org/wiki/Inside_(video_game)) · [Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero) · [Undertale](https://en.wikipedia.org/wiki/Undertale) · [NieR: Automata](https://en.wikipedia.org/wiki/Nier:_Automata) · [The Stanley Parable](https://en.wikipedia.org/wiki/The_Stanley_Parable) · [Return of the Obra Dinn](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn) · [Fez](https://en.wikipedia.org/wiki/Fez_(video_game)) · [Monument Valley](https://en.wikipedia.org/wiki/Monument_Valley_(video_game)) · [Antichamber](https://en.wikipedia.org/wiki/Antichamber) · [Perplexus](https://en.wikipedia.org/wiki/Perplexus) · [Dead Cells mechanics](https://deadcells.wiki.gg/wiki/Mechanics). Blocked: Spelunky wiki (HTTP 402).
