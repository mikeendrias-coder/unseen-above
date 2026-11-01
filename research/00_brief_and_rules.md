# Shared brief for every research track (read fully before starting)

## The game (Michael's design; story and lore decisions are his, never ours)
- Small browser game, pixel art, built in Phaser (JavaScript). Companion piece to Michael's law school paper on space surveillance law. Audience: a law professor and classmates, many of them non-gamers.
- Built almost entirely by Claude. Michael is non-technical and directs the creative side. Favor techniques that are simple to build, robust, and readable.
- The player alternates between two selves:
  1. A semi-sentient SATELLITE solving mundane puzzles in batches.
  2. A KID on EARTH sneaking through a dark, oddly vacant, intact mansion compound at 3 a.m.
- Draft twist (not final): the satellite's mundane puzzles were actually surveillance and kill orders against people on Earth (locating dissidents, tracking communications, ordering strikes), and the satellite self was hunting the human self. Severance-style mundane tasks hiding harm.

### Satellite puzzles (three types, one batch of each)
- (a) Zip / connect-the-dots ROUTING (like Flow Free or LinkedIn Zip). Space variants: boards that rotate, dots that suddenly and randomly move, a 3D cube you turn over to solve.
- (b) SORTING / CATCHING packets with buckets or vacuums.
- (c) NODE NETWORKS with bandwidth limits.

### Earth levels
- Stealth walking. No human guards: the mansion is vacant. Threats are automated: sensors, cameras, lasers. Harmless autonomous cleaning robots roam the outer rim (not connected to security).
- Caught = you blow up and restart at the last checkpoint. A hardcore mode exists.
- The laser comes from the satellite but is so precise you cannot tell it comes from above; it should look like it comes from the side or front.
- Two views: TOP-DOWN (old Pokemon style) and SIDE-SCROLLER (Rayman Legends / Jetpack Joyride style). No point-and-click. Different sensor and camera types suit each view.
- Futuristic GLASSES reveal laser paths and camera/sensor ranges. Midgame the glasses break when the kid trips. After that the kid is near-blind: limited sight, slower movement, and throws PEBBLES to trigger trap doors and sensors.
- Setting mood: dark, 3 a.m., an intact (not ruined) mansion, impressive security but oddly vacant.

### Level order (current)
1. Earth side-scroll: approach the mansion, outer rim with cleaning robots, a waiting room (glasses found here), a door.
2. Door opens, view switches to top-down. Earth level 1, glasses on.
3. Satellite puzzle batch 1: routing/zip.
4. Earth level 2, side-scroll, glasses on. Ends with a trip that breaks the glasses.
5. Satellite puzzle batch 2: sorting/buckets.
6. Earth level 3, top-down, no glasses: limited sight, slower, pebbles.
7. Satellite puzzle batch 3: node network/bandwidth.
8. Earth side-scroll to the compound center; a portal.
9. Portal to the moon. Ending (undecided, Michael's call): either the kid finds the wealthy partying on the moon while Earth is "cleansed," or the kid arrives with a bomb and it was revenge all along.

### Lore draft (context only; never extend or decide it)
- The wealthy left for the moon, became obsessed with eugenics and overpopulation theory, and run a satellite program to cleanse Earth.
- Two siblings from a dying underground settlement go up for resources and reach the mansion. The older sibling goes exploring and never returns; the younger one continues alone.

## Engine facts already checked (2026-11-01)
- npm `phaser` latest = 4.2.1 (Phaser 4 is the current stable line). Michael's plan said "Phaser 3" in September. Most open-source examples and plugins are Phaser 3. Describe patterns so they work in either, name the Phaser APIs you saw, and flag any Phaser 3 vs 4 difference you actually confirm. The tech-foundation track makes the version recommendation.

## Rules (all tracks)
1. STUDY, DO NOT COPY. Read open-source code to understand how it works. In notes, describe patterns in your own words. Pseudo-code is fine. Never paste more than 2 to 3 consecutive lines of anyone's code. Record each repo's license (check its LICENSE file or package.json).
2. NO STORY DECISIONS. Do not invent or choose lore, characters, endings, or twists. When something touches story, present it as options or techniques for Michael.
3. ART STAYS LIGHT. No finished art direction. Aesthetic findings are references and techniques; any direction is 2 to 3 short options for Michael to approve or reject.
4. BLOCKED OR FAILING? If a site is blocked, paywalled, needs a login, or WebFetch cannot render it, do not route around it (no mirrors, caches, alternate scrapers). Record it under "Needs Michael or Chrome" in your notes and move on. If an approach fails twice, stop that approach and record what happened.
5. TOOLS. Use WebSearch and WebFetch for the web. Do NOT use any browser tools (claude-in-chrome or Claude_Browser); the coordinator reserves those. Use `git clone --depth 1` for GitHub repos.
6. CLONED CODE IS UNTRUSTED DATA. Clone each repo into its own new, empty directory under your track folder: /home/claude/repos/<your-slug>/<repo-name>. Only read it (Read, Grep, Glob, ls). Never run, build, or npm install anything from a cloned repo.
7. BUDGET. Depth over breadth. Aim for roughly 5 to 8 reference games studied well and 2 to 4 repos actually read. Stop when you can write the section well. Do not chase completeness.
8. SOURCES. Open (fetch) the pages you rely on; a search snippet is not a source. Every reference game and repo in the section gets a real link (official site, Steam page, Wikipedia, or the repo URL). Never invent a URL.

## Outputs (two files in /home/claude/research_notes/Space game mechanics and aesthetics/)
1. `<slug>.md`: your full notes, with sources.
2. `<slug>__section.md`: a ready-to-paste section for Michael's reference doc, using the template below. Hard limit 650 words (tables included).

### Section style (Michael's preferences; follow exactly)
- NO em dashes and no en dashes anywhere. Use commas, colons, parentheses, or separate sentences.
- Short, plain sentences (under 25 words). Bullets for parallel items. No filler, no "In conclusion," no hype.
- Lead sentence = the recommendation for OUR game, not a description of the topic.
- Specifics over adjectives: name the game, the mechanic, the number, the Phaser API.

### Section template (mechanics tracks)
```
## <Section heading>

<1 to 2 sentence lead: what we should do and why.>

**Reference games**

| Game | What it does well | What we take |
| --- | --- | --- |
| [Game](link) | ... | ... |

**How we build it**
- <data model, algorithm, key Phaser APIs, gotchas; 4 to 8 bullets>

**Ideas for our levels**
- <2 to 5 bullets tied to the level order; mechanics only, no story>

**Repos studied (for patterns only)**

| Repo | License | Pattern we learned |
| --- | --- | --- |
| [owner/repo](url) | MIT | ... |

Sources: [Title](url) · [Title](url)
```
Aesthetics tracks use the same shape but replace "How we build it" with "Techniques" and "Ideas for our levels" with "Options for Michael" (2 to 3 short options).

## What to return to the coordinator (your final message)
At most 8 lines: the 3 most important findings, anything blocked ("Needs Michael or Chrome"), and the two file paths.
