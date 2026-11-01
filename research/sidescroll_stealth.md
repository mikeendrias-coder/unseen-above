# Side-scroll stealth and platforming against automated traps (opening approach, Earth level 2, final run)

Track slug: sidescroll_stealth. Checked 2026-11-01.
Phaser source read: phaserjs/phaser 4.2.1 (MIT), cloned to /home/claude/repos/sidescroll_stealth/phaser.
No code was copied. Patterns are described in my own words, and the short pseudo-code blocks are mine.
The shared WebSearch budget ran out partway through, so a few leads were not followed (see Gaps and "Needs Michael or Chrome" at the end).
Convention: "community wiki" means a fan-edited wiki, not a developer source. "Inference" means my reasoning, not a sourced fact.

## 1. Which games are the best precedents for side-view stealth, automated traps, and fair instant retry?

### Takeaway
The precedents split by job. Mark of the Ninja and Stealth Inc show how to keep detection readable. N's laser drone and Jetpack Joyride's missile show a side-origin attack with a warning and then a locked aim. Katana Zero, Limbo, and Stealth Inc show one-hit death with near-instant retry.

### Cited Findings

#### Mark of the Ninja (Klei)
- Lead designer Nels Anderson's five stealth design rules: transparent stealth system, transparent AI, narrow gulf of execution, limited consequences for failure, and less open world design ([Kumar, Game Developer, 3 Dec 2012](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules)).
- Visibility is binary, not metered, so the player can always predict whether they are seen. A hidden character is drawn black with red highlights, and a lit one is fully colored ([Kumar](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules)).
- All perception information is always on screen. Guard vision limits are drawn, noise is an expanding ring showing how far it carries, guards have three awareness levels with visible cues, and a ghost marker shows where a guard is running ([Kumar](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules)). Game Wisdom describes the noise ring as a blue circle ([Bycer, Game Wisdom, 29 Nov 2012](https://game-wisdom.com/analysis/mark-of-the-ninja-stealthy-does-it)).
- At the very edge of a guard's vision the guard gets only a glimpse and moves toward the player quickly, but not at full alert. This is a graded forgiveness at the margin ([Kumar](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules)).
- Checkpoints sit between every meaningful encounter. Anderson cites Super Meat Boy and Trials as games where a load screen after each death would have hurt ([Kumar](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules)).
- Klei reused the control foundation from its Shank games (tight, responsive controls, 60 fps animation) and chose to expose detection margins instead of removing risk. They playtested with stealth fans first, then with players who do not usually like the genre ([Alexander, Game Developer, 2 Aug 2012](https://www.gamedeveloper.com/design/reinventing-stealth-in-2d-with-i-mark-of-the-ninja-i-)).
- Hiding works through background objects. Without cover, the lighting decides. A lit player can be spotted one to two screens away. Walking and jumping are silent, and running is noisy ([Bycer](https://game-wisdom.com/analysis/mark-of-the-ninja-stealthy-does-it)).
- Laser traps appear in puzzles (one critic thought too many). The player can extinguish lights, hide behind objects, and use narrow grates. Line of sight works both ways: enemies you cannot see are hidden from you, though their sounds are drawn ([Wikipedia](https://en.wikipedia.org/wiki/Mark_of_the_Ninja)).

#### Gunpoint (Tom Francis)
- One gunshot kills, so being seen is effectively fatal. The Crosslink tool shows every security feature and its wiring and lets the player rewire it within limits. Francis said he wanted to avoid games that assume the player is stupid, and he cut a remote-activation feature that made solutions trivial ([Wikipedia](https://en.wikipedia.org/wiki/Gunpoint_(video_game))).
- That article does not mention lasers or guard vision geometry. A Tom Francis dev-log post I opened (dated 26 Feb 2013 by its URL slug) had no design content on vision ([Pentadact](https://www.pentadact.com/?p=5806)).

#### Stealth Inc / Stealth Bastard (Curve)
- The clone's goggles show green when safe and red when light hits the body. Boxes can be pushed between the player and a light to shield. Hazards include oscillating cameras, patrolling robots, sentries, turrets, laser blasts, crushing walls, and noisy keyboard floors. There is no combat ([GameSpot review](https://gamespot.com/reviews/stealth-inc-a-clone-in-the-dark-review/1900-6411880/)).
- One mistake usually kills, but respawn is immediate and checkpoints are plentiful. The reviewer says every death feels preventable, warns that the belief that dark corners hide you is a trap, and calls sprinting clumsy ([GameSpot review](https://gamespot.com/reviews/stealth-inc-a-clone-in-the-dark-review/1900-6411880/)).
- Wikipedia confirms being spotted is instant death and that critics compared it to Metal Gear Solid and Super Meat Boy. The article is short and has no mechanics detail ([Wikipedia](https://en.wikipedia.org/wiki/Stealth_Bastard)).

#### Jetpack Joyride (Halfbrick)
- Controls are one touch: hold to thrust, release to fall. Horizontal speed is constant. Hazards are zappers, missiles, and high-intensity lasers, and any contact is fatal ([Wikipedia](https://en.wikipedia.org/wiki/Jetpack_Joyride)).
- Luke Muscat (Halfbrick chief creative officer, GDC 2012) said it "had to be a one-button game" because the scheme appeals even to the most inexperienced players ([Game Developer, 31 Jul 2012](https://gamedeveloper.com/design/video-depth-in-simplicity-the-making-of-i-jetpack-joyride-i-)).
- Community wiki on the missile: it gives about 1 to 2 seconds to react to its position, and that window shrinks as you progress. It enters from the side of the screen, follows the player while preparing, then stops tracking and stays at its last position as it launches. Missiles cannot appear while you fly through lasers ([Jetpack Joyride wiki: Missile](https://jetpackjoyride.fandom.com/wiki/Missile)).
- The GDC Vault page for the talk is tagged "free content" but showed a login-limit notice, so I could not confirm it plays ([GDC Vault](https://gdcvault.com/play/1015316/Depth-in-Simplicity-The-Making)).

#### Rayman Legends (Ubisoft Montpellier)
- Music levels are built around the song. A fixed running speed is what makes the sync possible. The player runs continuously while jumping and destroying objects, and running below full speed ends the level ([Martins, Game Developer, 9 Mar 2015](https://www.gamedeveloper.com/audio/the-musical-box-27-game-music-level-design)).
- A 2012 hands-on describes a music level where Rayman auto-runs at top speed and the player taps barriers and enemies on the beat (Wii U touch version). It says nothing about readability ([Hilliard, Game Informer, 6 Jun 2012](https://gameinformer.com/games/rayman_legends/b/wii_u/archive/2012/06/06/hands-on-with-the-co-op-rhythm-platformer-for-wii-u)).
- Wikipedia has no developer commentary on readability or controls. It records IGN praise for levels hiding "dozens of deadly traps" ([Wikipedia](https://en.wikipedia.org/wiki/Rayman_Legends)).

#### Katana Zero (Askiisoft)
- Zero dies from any hit, and almost every enemy dies in one hit. The player restarts from the most recent checkpoint. Designer Justin Stander wanted "difficult but fair" and made dying easy on purpose so players own their mistakes. Lasers are among the environmental hazards, levels are split into rooms, and Chronos slows time. Two outlets noted the intense visuals could cause headaches ([Wikipedia](https://en.wikipedia.org/wiki/Katana_Zero)).

#### N / N++ (Metanet)
- N++ movement is momentum based. Jump height depends on speed and platform angle. Levels come in episodes of five ([Wikipedia](https://en.wikipedia.org/wiki/N%2B%2B)). That article has no drone or hazard detail.
- N's laser drone (community wiki quoting N's in-game help): it sees anything not blocked by a wall. On spotting the ninja it fires a small harmless ray as a warning, needs about a second to charge, and about a second later the ray becomes a deadly laser. The beam stays fixed where the ninja was first seen and does not track. The page says players use the window to reach cover ([N wiki: Laser drone](https://n.fandom.com/wiki/Laser_drone)).
- N drones follow one of six preset movement patterns: wandering, surface-following, or alternating, each clockwise or counter-clockwise. The page says five drone types but names only four (Zap and Chase, Laser, Chaingun, Pulse) ([N wiki: Drones](https://n.fandom.com/wiki/Drones)). These pages describe N, and N++ values are not confirmed.

#### Limbo and Inside (Playdead)
- Limbo: the boy runs left and right, jumps, climbs, and pushes or pulls. The stated aim was only two actions beyond movement: jump and grab ([Wikipedia: Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game))).
- Limbo: unlimited attempts from the last checkpoint ("trial and death"), many traps hidden until triggered, a spider trap placed off screen with an audio cue when it drops, and earlier scenes that teach a mechanic before a harder puzzle needs it ([Wikipedia: Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game))).
- Jeppe Carlsen at GDC Europe 2010: "learning-by-dying", deaths should not feel punishing, hazard events are signaled by sound, wrong answers should be obviously wrong, the correct solution should be easy to execute once understood, and a bear trap was moved to another screen so it would not distract from the spider ([Sheffield, Game Developer, 16 Aug 2010](https://www.gamedeveloper.com/game-platforms/gdc-europe-i-limbo-i-s-carlsen-on-making-players-your-worst-enemy-and-your-best-friend)). The GDC Vault page shows a login-limit notice ([GDC Vault](https://gdcvault.com/play/1013665/Limbo-Balancing-Fun-and-Frustration)).
- Inside: hazards include masked guards with flashlights, vehicles with mounted spotlights, guard dogs, and security machines. The game resumes from the most recent checkpoint, and sound design is tied to puzzles. The article does not describe controls or how dangers are signaled ([Wikipedia: Inside](https://en.wikipedia.org/wiki/Inside_(video_game))).

#### Oddworld: Abe's Oddysee (extra precedent; Michael's brief said "find others")
- Side-view play across separate screens. Sligs shoot on sight but cannot see through dark areas. Abe can tiptoe, crouch to roll under obstacles, and throw meat, rocks, or grenades. A flying chant suppressor orb zaps him ([Wikipedia](https://en.wikipedia.org/wiki/Oddworld:_Abe%27s_Oddysee)).
- Critics found it very hard. Checkpoint-only saving was cited as a flaw, though frequent checkpoints and unlimited lives kept frustration down. PC Zone said progress often relied on trial and error, which stung when death sent you back to the start of a level. Movement is committed once started, with no mid-air adjustment ([Wikipedia](https://en.wikipedia.org/wiki/Oddworld:_Abe%27s_Oddysee)).

(Celeste is covered in section 3.)

### Inferences
- The three families map onto our levels. Level 2 (glasses on) fits the Mark of the Ninja and Stealth Inc style of drawing every sensor's range. The final run fits Jetpack Joyride and Rayman Legends style fixed-pace pressure with side attacks. All levels fit one-hit death with fast retry.
- Every fair lethal thing in these games has the same triple: a visible warning at the place of the threat, fixed learnable timing, and a retry that costs seconds. We can make that a rule for every trap.
- Our glasses play the same role as Gunpoint's Crosslink and Mark of the Ninja's perception overlays. The design benefit is that what the glasses draw can be exactly the data that decides hits.
- Abe's Oddysee is the cautionary tale for our final run: committed movement plus sparse checkpoints produced frustration. Air control and a checkpoint per screen avoid that.
- Abe's thrown rocks are a precedent for the pebble mechanic, which is a useful reference when that is designed.

### Gaps
- No developer source found on Rayman Legends platforming readability. The table row relies on the music-level analysis only.
- No fetchable source for Jetpack Joyride zapper or laser telegraph timing, or for lasers that "charge across the screen". Only the community wiki on missiles.
- Mark of the Ninja cameras are not documented in any page I opened. Its GDC talks were not located.
- Gunpoint guard vision geometry, Inside sensor behavior, and Katana Zero retry timing are not documented in pages I opened.
- N++ specific hazard values are unconfirmed (the wiki describes N).

## 2. How should telegraphing and beam visuals work, and how do we make a laser look like it comes from the side or front while staying fair?

### Takeaway
Use a fixed tell, charge, fire, cooldown timeline, draw the tell on the exact future path, and lock the aim when the charge starts. To hide the orbital origin, never draw a beam's upstream end: start it at a visible wall port or just off camera, and guide the eye with a reticle or edge marker instead of a source.

### Cited Findings
- Mike Stout (Game Developer, 2 Sep 2015): players must know an attack is coming. Attacks need a short delay so the player can see them. A common projectile pattern is a charge-up: particles gather, a rising sound plays, a bright flash occurs, and only then does the projectile fire. For realistic games a sound, a cocking animation, or a voice line can be enough ([Stout, Game Developer](https://gamedeveloper.com/design/enemy-attacks-and-telegraphing)). The article gives no wind-up durations.
- N laser drone timeline: small harmless warning ray, about 1 s charge, lethal about 1 s later, aim fixed at where the ninja was first seen ([N wiki: Laser drone](https://n.fandom.com/wiki/Laser_drone)).
- Jetpack Joyride missile (community wiki): about 1 to 2 s to react, side entry, tracks while preparing, then stops tracking before launch ([Jetpack Joyride wiki: Missile](https://jetpackjoyride.fandom.com/wiki/Missile)).
- Human limits: simple reaction time for college-age adults is about 190 ms for visual and about 160 ms for auditory stimuli. Responses under roughly 100 to 200 ms are usually anticipation, not reaction. Reaction time rises with the number of possible responses (Hick's law) and with age. Warning intervals under about 300 ms can delay responses ([Wikipedia: Reaction time](https://en.wikipedia.org/wiki/Reaction_time)).
- Photosensitivity: WCAG 2.3.1 says content must not flash more than three times in any one second, unless below the general and red flash thresholds. A general flash is a pair of opposing luminance changes of 10 percent or more of maximum relative luminance, where the darker image is below 0.80. The area rule is about 341 x 256 px at 1024 x 768 (25 percent of a 10 degree field). Blinking faster than three per second counts ([W3C Understanding SC 2.3.1](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html)).
- Game Accessibility Guidelines: avoid flickering images and repetitive patterns (Basic); no essential information by a fixed color alone (Basic); no essential information by sound alone (Basic); captions or visuals for significant background sounds (Intermediate); a way to practice without failure (Intermediate); interactive tutorials (Basic) ([Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)).
- Limbo signals hazard events with sound, and one trap sits off screen with an audio cue when it drops ([Sheffield, Game Developer](https://www.gamedeveloper.com/game-platforms/gdc-europe-i-limbo-i-s-carlsen-on-making-players-your-worst-enemy-and-your-best-friend); [Wikipedia: Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game))).
- Mark of the Ninja keeps all perception data on screen so players see what will happen before they act ([Kumar](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules)).
- Stealth Inc's reviewer says every death feels preventable ([GameSpot review](https://gamespot.com/reviews/stealth-inc-a-clone-in-the-dark-review/1900-6411880/)). Two outlets said Katana Zero's intense visuals gave them headaches ([Wikipedia: Katana Zero](https://en.wikipedia.org/wiki/Katana_Zero)).

### Inferences
- Suggested beam timeline (starting values to playtest with non-gamers). Derived from N (about 1 s plus about 1 s), Jetpack Joyride (1 to 2 s), 190 ms visual reaction, and the 300 ms foreperiod effect.
  - TELL, 0.6 s: thin dim line along the real future path, plus a flicker at the port or edge marker.
  - CHARGE, 0.6 s: line thickens and brightens, rising tone. Aim locks here.
  - FIRE, 0.35 s: full-width bright core. Lethal only while the core is at full width.
  - COOLDOWN, 0.3 s fade, and no re-fire in the same lane for about 1 s.
  - First time a new beam type appears: multiply TELL by 1.5 and place it where the first shot cannot hit the player. Hardcore mode: halve TELL but not below about 0.4 s.
- Four ways to stage "comes from the side or front" (options for Michael, none sourced as a named technique):
  1. Port alibi. Every beam starts at a visible wall, pillar, or floor-grate port that flashes first and ends at the opposite wall. The eye accepts the port as the source.
  2. Edge lock. A marker at the screen edge tracks the player's height, then locks (the Jetpack Joyride missile and N drone pattern). The beam crosses the screen along the locked row and enters from off camera.
  3. Reticle pass-through. A ring appears at the target spot, and a horizontal beam passes through it from an off-camera side.
  4. End-on flare for "front". A circle of light expands at the target with a short streak toward the camera, as if looking down the barrel. Use sparingly.
- Anti-tells that would reveal orbit: vertical or steep beams in side view, glow or sparks pointing at the ceiling, a beam passing through a ceiling tile, and shadows that do not match the visible port.
- Fairness checks for all four: warning, glow, and hit zone share one line. The lethal box is no wider than the bright core. Damage starts only after the core reaches full width. Aim never moves after the lock. Precedent for a lethal area smaller than the visible body: Celeste's lethal hurtbox (8 x 9) is smaller than its body collision box (8 x 11) ([Celeste repo](https://github.com/NoelFB/Celeste)).
- Glasses on (level 2): draw the planned path as a faint dotted line all the time, and let the TELL become the same line brightening. Glasses off (final run): path lines vanish, so the TELL needs a longer time, a rising tone, and a small edge flicker so the cue is not sound alone.
- Keep the blow-up effect to one flash or a fade, and keep any pulsing beam at or under 3 pulses per second.
- Pseudo-code for the beam (mine):
  ```
  on trigger:      state = TELL;   show thin dim path
  after tell:      state = CHARGE; lock path; brighten; start rising tone
  after charge:    state = FIRE;   draw layered strokes; enable hit test
  each FIRE frame: if lineHitsRect(coreLine, playerHurtRect) then kill()
  after fire:      state = COOL;   fade; disable hit test
  ```

### Gaps
- I found no source describing a game that deliberately hides an attack's true origin. The four staging options are my inference from observed patterns.
- No Jetpack Joyride laser timing data in any fetchable source.
- The timeline numbers are starting values, not tested values. They need playtesting with non-gamers.

## 3. What movement feel and controls should the kid have (coyote time, jump buffering, acceleration, variable jump), and what is the minimum control set for non-gamers?

### Takeaway
Copy the structure of Celeste's forgiveness, not its speed: 0.1 s coyote time, buffered jumps, a held-jump window, half gravity near the apex, a few pixels of corner correction, and a lethal box smaller than the sprite. Three inputs (move, jump, crouch) plus one context key are enough, with no sprint and no required holds.

### Cited Findings
- Celeste's source is MIT licensed, and the license applies to the code only, not the commercial game or assets ([Celeste repo README and LICENSE](https://github.com/NoelFB/Celeste)). Constants below are from Source/Player/Player.cs, lines 23 to 54. Units are pixels and seconds in a 320 x 180 game ([Thorson, Celeste & Forgiveness](https://maddymakesgames.com/articles/celeste_and_forgiveness/) states the 320 x 180 size).
  - Max run speed 90 px/s. Run acceleration 1000 px/s squared (about 0.09 s to full speed). Reduction when above max speed 400. Air multiplier 0.65.
  - Gravity 900. Max fall 160 (240 when fast-falling). Jump speed 105 up. Jump grace (coyote) time 0.1 s. Variable-jump window 0.2 s. Upward corner correction 4 px. Half-gravity speed band 40.
  - Standing collision box 8 x 11 px, lethal hurtbox 8 x 9 (same top, 2 px shorter at the feet). Ducking box 8 x 6, ducking hurtbox 8 x 4 (lines 263 to 266).
- Behaviors in the code ([Celeste repo](https://github.com/NoelFB/Celeste)):
  - The grace timer is reset to its full value every frame the player is grounded and counts down only while airborne (lines 711 to 720). A jump press is accepted while the timer is above zero.
  - The same acceleration constant moves the speed toward the target whether starting or stopping, and the air multiplier cuts it to 65 percent in the air (lines 2879 to 2895).
  - Near the top of a jump, if the jump button is held and vertical speed is under the 40 band, gravity is halved (line 2952).
  - Variable jump: while the 0.2 s timer runs and the button is held, vertical speed is kept at least as fast upward as the jump speed. Releasing zeroes the timer so gravity takes over (lines 2960 to 2967).
  - Upward corner correction: when moving up and blocked, the game tries shifting the body 1 to 4 px sideways while moving up 1 px, preferring the direction of travel, and then continues (lines 2584 to 2616).
  - Jump presses are buffered through the input class (the code calls a buffer-consume function after each jump). The buffer length is not in the public repo because the input class is absent.
- Thorson's article lists Celeste's forgiveness mechanics: coyote time, jump buffering, half gravity at the jump peak, jump corner correction, dash corner correction, semi-solid popping, lift momentum storage for a few frames, a wall jump that works from 2 px away, a super wall jump from about 5 px, and a stamina refund grace window. The author says everything is "fudged a tiny bit in the player's favor" and that the game "wants you to succeed". The author says they did not invent these techniques ([Thorson, Celeste & Forgiveness](https://maddymakesgames.com/articles/celeste_and_forgiveness/)).
- GameSpot's summary of Thorson's Twitter thread covers four of ten examples (coyote time, jump buffering, jump corner correction, lift momentum) and gives no numbers ([GameSpot](https://www.gamespot.com/articles/celeste-dev-explains-how-they-made-their-game-feel/1100-6474775/)).
- Celeste and TowerFall physics: colliders are integer-position axis-aligned boxes, and actors move one pixel at a time with a remainder counter. The article has no feel numbers ([Thorson, Medium](https://maddythorson.medium.com/celeste-and-towerfall-physics-d24bd2ae0fc5)).
- Game Maker's Toolkit's Platformer Toolkit devlog (MIT, copyright 2024): separate ground and air acceleration, a turn speed distinct from deceleration, jump defined by height and time to apex, a downward gravity multiplier for a "snappier landing", a jump cutoff gravity multiplier for variable height, a coyote timer with a small hardcoded lower threshold, and a jump buffer. It calls coyote time and buffering "player grace features". It suggests a coyote value "usually something like 0.2" (summarized, not verified word for word) ([Brown, Platformer Toolkit devlog](https://gmtk.itch.io/platformer-toolkit/devlog/395523/behind-the-code)).
- Minimal controls in shipped games: Jetpack Joyride is one touch with constant horizontal speed ([Wikipedia](https://en.wikipedia.org/wiki/Jetpack_Joyride)) and "had to be a one-button game" ([Game Developer](https://gamedeveloper.com/design/video-depth-in-simplicity-the-making-of-i-jetpack-joyride-i-)). Limbo aimed for two actions beyond movement ([Wikipedia: Limbo](https://en.wikipedia.org/wiki/Limbo_(video_game))). Rayman Legends music levels run at a fixed speed ([Martins](https://www.gamedeveloper.com/audio/the-musical-box-27-game-music-level-design)).
- Game Accessibility Guidelines: controls as simple as possible or a simpler alternative (Basic); remappable controls (Basic); an option to adjust game speed (Basic); avoid or give alternatives to required button holds (Intermediate); avoid repeated inputs and button mashing (Intermediate); a wide choice of difficulty levels (Basic); settings saved (Basic) ([Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)).
- Phaser Arcade steps physics at a fixed 60 fps by default (`fps` 60, `fixedStep` true), so feel does not change with monitor refresh rate ([Phaser World.js](https://github.com/phaserjs/phaser/blob/master/src/physics/arcade/World.js)).

### Inferences
- Starting values for tuning (derived from the Celeste constants and my arithmetic):
  - Coyote 0.10 to 0.15 s. Jump buffer about 0.10 s (my guess, since Celeste's buffer length is not public). Hold window 0.2 s. Ceiling corner nudge 4 px at 8 px tiles, scaled to our tile size.
  - Celeste's tap jump rises about 6 px (0.8 tile at 8 px tiles) and a full held jump about 27 px (about 3.4 tiles). Those are my numbers from the constants, and they show how large the tap-versus-hold range is.
  - Use the same rate to start and stop (about 0.1 s) for crisp response. For a quieter, sneaky feel, 0.12 to 0.15 s and a lower top speed are reasonable, but that is a taste call.
  - Cap fall speed so a fall never moves more than the tile bias per step (see section 5).
- Recommended inputs: Left/Right or A/D to move, Space (also Up or W) to jump, Down or S to crouch and drop through one-way ledges, E to interact. No sprint and no sneak toggle, because no human guards listen for noise. No required button holds, except the optional variable jump, which also works as a plain tap jump.
- Pebbles in the final run should stay to one key with one or two fixed arcs, which keeps the control count low. This is a design call for later.
- Final-run pace options for Michael (mechanics only): slow free walk (matches "slower"), a forced camera scroll in the Jetpack Joyride style, or beams that pulse on a beat in the Rayman Legends style. A fixed player speed is what makes beat sync possible.
- Pseudo-code for feel (mine, generic pattern):
  ```
  each fixed step:
    coyote = onFloor ? COYOTE : coyote - dt
    buffer = jumpPressed ? BUFFER : buffer - dt
    if buffer > 0 and coyote > 0: vy = -JUMP; hold = HOLD; buffer = 0; coyote = 0
    if hold > 0: if jumpHeld then vy = min(vy, -JUMP) else hold = 0
    hold -= dt
    g = (jumpHeld and abs(vy) < APEX_BAND) ? GRAVITY * 0.5 : GRAVITY
    vx = approach(vx, input * MAX_RUN, ACCEL * (onFloor ? 1 : 0.65) * dt)
  ```

### Gaps
- Celeste's jump buffer length is not in the public repo and I did not find it elsewhere.
- The Platformer Toolkit coyote suggestion of about 0.2 is from a summary and conflicts in size with Celeste's 0.1 s. Treat 0.1 to 0.15 s as the safe range until tested.
- Rayman Legends' platforming-readability rules were not found.

## 4. How does detection work in a side view (camera cones, light and shadow hiding, crouching), and what does the glasses overlay add?

### Takeaway
Use binary detection with a short visible lock-on: a sensor sees the player only if range, cone angle, and tile line of sight all pass, and the player is not inside a dark zone. Draw the sensor's cone and the player's seen-or-hidden state so the outcome is predictable.

### Cited Findings
- Mark of the Ninja: visibility is binary and predictable, vision limits are drawn, hiding uses darkness and background objects, and the player sprite changes look when concealed ([Kumar](https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules); [Bycer](https://game-wisdom.com/analysis/mark-of-the-ninja-stealthy-does-it)).
- Stealth Inc: color-changing goggles show safe or lit, boxes shield from light, and oscillating cameras spot an exposed player ([GameSpot review](https://gamespot.com/reviews/stealth-inc-a-clone-in-the-dark-review/1900-6411880/)).
- Abe's Oddysee: Sligs cannot see through dark areas, and Abe crouches to roll under obstacles ([Wikipedia](https://en.wikipedia.org/wiki/Oddworld:_Abe%27s_Oddysee)).
- Inside: guards with flashlights and vehicles with spotlights are side-view sensors ([Wikipedia: Inside](https://en.wikipedia.org/wiki/Inside_(video_game))).
- Celeste's ducking box is 8 x 6 versus 8 x 11 standing, so crouching roughly halves the profile ([Celeste repo](https://github.com/NoelFB/Celeste)).
- Phaser Raycaster's cone method (read in src/ray/castCone.js): it gathers the angles of every vertex of mapped objects inside the cone, adds the cone's edge angles and the bounding box corners, sorts them by angle, and casts one ray to each. At corners it casts two extra rays nudged by a tiny angle either side so the polygon wraps the corner. The result is an array of hit points, which is a visibility polygon ([phaser-raycaster](https://github.com/wiserim/phaser-raycaster)).
- Phaser Raycaster maps tilemap layers through a list of tile indexes that block rays (`collisionTiles`), and builds segments from the tile edges (src/map/map-tilemap-methods.js). Rays can have an Arcade or Matter body to find objects in the field of view ([README](https://cdn.jsdelivr.net/npm/phaser-raycaster@0.11.1/README.md)).
- Transplant (Phaser 2 era student project, 2017, no license): an enemy sees the player if the player is within 450 px in the direction the enemy faces, the player is vertically within the enemy's body band, and the player is not hidden. "Hidden" means overlapping a hide object while on the back layer. Pressing H swaps the player between a foreground and a back layer, and the swap is blocked when standing directly over the cover. Being caught sends you back to the start ([jordy-trevor/Transplant](https://github.com/jordy-trevor/Transplant), files js/prefabs/Enemy.js and js/states/play.js).
- kagemoguri (vanilla JavaScript canvas game, 2026, no license): exposure is a 0 to 100 meter that rises about 30 per second in light (about 6 more per extra light) and falls when out of light or hidden (about 15 to 52 per second, faster when hidden or using smoke). At 100 the player is spotted. Cover is a geometric test: a pillar hides the player from a light if the pillar sits between them horizontally and the line from the light to the player passes through the pillar's top within its width ([TasukuTSUKIOKA/kagemoguri](https://github.com/TasukuTSUKIOKA/kagemoguri), app.js around lines 1360 to 1390 and 1552 to 1586).

### Inferences
- Camera cone test (pseudo-code, mine):
  ```
  toPlayer = playerCenter - cam.pos
  seen = length(toPlayer) <= RANGE
         and abs(angleDiff(angleOf(toPlayer), cam.facing)) <= HALF_CONE
         and not tileBlocked(cam.pos, playerCenter)      // line of sight
  lock = seen ? lock + dt : max(0, lock - 2 * dt)
  if lock >= LOCK_TIME: kill()
  ```
  Sweep `cam.facing` with a yoyo tween so the motion is deterministic and learnable. Draw the wedge as a translucent polygon.
- Binary versus graded: Mark of the Ninja chose binary for predictability, while kagemoguri uses a graded meter. For a one-hit explosion, a short lock-on (about 0.4 to 0.6 s) that is visible on the sensor and audible keeps the clarity of binary and gives a fairness buffer. Leaving the cone cancels the lock. This is my design suggestion, supported by N's warn-then-lethal pattern.
- Dark zones and cover in side view: author them as rectangles in a Tiled object layer. The player is hidden when their center and feet are inside a zone and no sensor light covers them. Show the state on the player sprite (a tint or outline) like Mark of the Ninja. Pillar cover can use the kagemoguri-style test if a spotlight is a point source.
- Because the mansion has no human guards, the "enemies" are sensors. Moving cover and timing windows replace listening and noise. The harmless cleaning robots could be moving cover or platforms (a design option).
- Glasses overlay: give every sensor a draw-overlay function and a hit function that read the same numbers (range, angle, path). Then the overlay can never disagree with the kill logic. The near-blind mode hides the overlay and shrinks the player's sight radius.
- Crouch: use a box about 55 percent of standing height. Limit each screen to two beam heights (stand-high and crouch-low) so non-gamers are not asked for precise timing and height together.
- Raycaster use: for static cones, a hand-written visibility function is simple enough. Use the plugin only if we need many dynamic cones, since it adds a dependency with an unclear license (see section 6).

### Gaps
- Crouching details for Mark of the Ninja and Gunpoint are not in any page I opened.
- No source on camera sweep speed or lock-on times.
- I did not run or test any code (rules forbid running cloned code).

## 5. How do we build it in Phaser (Arcade platformer, tilemap collisions, one-way platforms, raycast beams, Graphics beams with glow), and what differs between Phaser 3 and 4?

### Takeaway
Arcade Physics plus a Tiled tilemap is enough. One-way platforms are a second tile layer whose tiles collide only from above, beams are data plus a Graphics redraw plus a line-versus-rectangle test, and layered strokes give a glow that works in both Phaser versions. Phaser 4 adds a built-in Glow filter, so layered strokes stay the safe base.

### Cited Findings (all checked in Phaser 4.2.1 source unless a v3 source is named)
- Version and license: package version 4.2.1, license MIT ([phaserjs/phaser](https://github.com/phaserjs/phaser)).
- Tile collision flags: `Tile#setCollision(left, right, up, down, recalculateFaces)` (since 3.0.0). If `right`, `up`, or `down` are undefined they copy `left` ([src/tilemaps/Tile.js](https://github.com/phaserjs/phaser/blob/master/src/tilemaps/Tile.js)).
- One-way behavior is in TileCheckY ([src/physics/arcade/tilemap/TileCheckY.js](https://github.com/phaserjs/phaser/blob/master/src/physics/arcade/tilemap/TileCheckY.js)): a body moving down collides with a tile's top face only if the tile's `collideUp` flag is set and the body's `checkCollision.down` is true. A body moving up collides only with `collideDown` and `checkCollision.up`. Separation is applied only if the body's bottom has sunk no more than the tile bias into the tile; deeper overlap is ignored.
- `World.TILE_BIAS` defaults to 16 (config key `tileBias`) and `OVERLAP_BIAS` to 4 ([World.js](https://github.com/phaserjs/phaser/blob/master/src/physics/arcade/World.js)).
- Colliders have an `active` flag and an optional `processCallback` that can skip a pair by returning false ([Collider.js](https://github.com/phaserjs/phaser/blob/master/src/physics/arcade/Collider.js)).
- Arcade Body has `onFloor()`, `onCeiling()`, `onWall()`, `setMaxVelocity`, `setDrag`, `setDragX`, `setAccelerationX`, `setGravityY`. `useDamping` is false by default, so drag is an absolute loss in px/s squared ([Body.js](https://github.com/phaserjs/phaser/blob/master/src/physics/arcade/Body.js)).
- Tilemap helpers: `setCollisionByProperty({ collides: true })`, `setCollisionByExclusion`, `forEachTile`, `getObjectLayer(name)`, `setTileIndexCallback`, `setTileLocationCallback` ([Phaser tilemaps doc in repo](https://github.com/phaserjs/phaser/blob/master/skills/tilemaps/SKILL.md); component files exist in src/tilemaps/components).
- Geometry: `Phaser.Geom.Intersects` includes `LineToRectangle`, `GetLineToRectangle`, `LineToLine`, `GetLineToLine`, `LineToCircle`, and `RectangleToRectangle` (file list in src/geom/intersects; `RectangleToRectangle` and `LineToLine` are also used in the raycaster source).
- Graphics has `lineStyle(lineWidth, color, alpha)`, `lineBetween(x1, y1, x2, y2)`, `strokeLineShape(line)`, and a Lighting component ([Graphics.js](https://github.com/phaserjs/phaser/blob/master/src/gameobjects/graphics/Graphics.js)).
- Glow in Phaser 4: call `obj.enableFilters()`, then `obj.filters.internal.addGlow(color, outerStrength, innerStrength, scale, knockout, quality, distance)` (since 4.0.0). Quality and distance cannot change after creation. Filters are WebGL only. Graphics gets the Filters component through the GameObject base class ([FilterList.js](https://github.com/phaserjs/phaser/blob/master/src/gameobjects/components/FilterList.js); [GameObject.js](https://github.com/phaserjs/phaser/blob/master/src/gameobjects/GameObject.js)).
- Glow in Phaser 3.60 and later: `preFX.addGlow` and `postFX.addGlow` ([v3.60 FX changelog](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/FX.md)).
- Confirmed v3 to v4 differences relevant to us ([migration guide in repo](https://github.com/phaserjs/phaser/blob/master/skills/v3-to-v4-migration/SKILL.md)):
  - FX and masks became Filters (internal and external lists). `BitmapMask` was removed in favor of a `Mask` filter.
  - Lighting changed from `setPipeline('Light2D')` to `setLighting(true)`, and lights have a `z` value.
  - `roundPixels` now defaults to false (it was true in v3).
  - The Canvas renderer is deprecated. WebGL has four native blend modes (NORMAL, ADD, MULTIPLY, SCREEN), so ADD is safe.
  - `Geom.Point` was removed and geometry functions return `Vector2`.
  - Pipelines were replaced by render nodes (matters only for custom shaders).
- The migration guide has no Arcade Physics or Tilemap section, and the v4.0.0 changelog mentions only Arcade bug fixes (group collisions, closest and furthest, OverlapCirc and OverlapRect) ([CHANGELOG-v4.0.0.md](https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md)). I found no breaking Arcade change.
- Config: `pixelArt: true` sets `antialias` false, `antialiasGL` false, and `roundPixels` true ([game-setup doc in repo](https://github.com/phaserjs/phaser/blob/master/skills/game-setup-and-config/SKILL.md)).
- Phaser Raycaster 0.11.1: package description "Raycasting plugin for Phaser 3 and 4." Setup registers a scene plugin, then `createRaycaster()`, `createRay()`, `mapGameObjects()`, and `cast()`, `castCircle()`, `castCone()`, with `getStats()` and a debug mode ([README](https://cdn.jsdelivr.net/npm/phaser-raycaster@0.11.1/README.md); [repo](https://github.com/wiserim/phaser-raycaster)).

### Inferences
- Scene layout: one TilemapLayer for solids (tile property `collides`), one TilemapLayer for one-way ledges, and Tiled object layers for sensors (beams, cameras, dark zones, checkpoints). Each sensor is a small class with `update(dt)`, `drawOverlay(g)`, and `hits(playerRect)`.
- One-way platform recipe: after creating the one-way layer, loop its tiles and call `setCollision(false, false, true, false)` on each, then add a normal collider for the player. Do not turn off `body.checkCollision.down` for drop-through, because that also disables solid floors. Instead keep the one-way collider in a variable and set its `active` to false for about 0.2 s when Down and Jump are pressed.
- Tunneling guard: keep (max fall speed x step length) well under the tile size and under `TILE_BIAS` (16 px). Use `setMaxVelocity` for this.
- Movement code: set `vx` and `vy` by hand each step with an "approach" helper and the timers in section 3. This is simpler to tune than mixing Arcade acceleration, drag, and manual velocity. Arcade's fixed 60 fps step keeps results stable.
- Beams: store each beam as data (start point, end point or axis and length, timings, state). Draw with `Graphics`: clear and redraw every frame, three strokes (wide with low alpha, medium, and a narrow white core), ADD blend mode, integer coordinates and odd pixel widths (1, 3, 5) for a crisp pixel look. Hit test: `LineToRectangle(coreLine, playerHurtRect)`, or `RectangleToRectangle` for thick axis-aligned beams. Do not use Arcade overlap for beams, since a rectangle test is simpler and exact.
- Beam length: for authored beams, give a length per beam. For beams that must stop at walls, write a small grid walk (step tile to tile along the beam until a solid tile) of about 25 lines. This is a standard technique I did not fetch a source for. The plugin's `cast()` is an alternative.
- Glow: layered strokes work in Phaser 3, Phaser 4, and Canvas. The Phaser 4 Glow filter is an optional upgrade for WebGL. Do not create filters per frame. Add small pre-drawn radial glow sprites with ADD blend at the port and at the impact point.
- Pixel look: set `pixelArt: true` (this also sets `roundPixels` in Phaser 4).
- Version call: nothing in the confirmed list blocks Arcade, tilemap, or Graphics code from working in either version. The tech-foundation track should decide the version.

### Gaps
- I could not run any Phaser code (rules). All API statements come from reading source and docs.
- v3 Arcade tile code was not diffed against v4. The `@since 3.0.0` tag on `Tile#setCollision` is my evidence it exists in v3.
- Per-frame Graphics redraw cost for many beams was not measured.
- Phaser's `skills/` folder in the repo (29 topics, including v3-to-v4-migration) is useful reference material for the build. I treated it as data and checked key claims against source.

## 6. Which open-source repos teach platformer feel and side-view detection, and what are their licenses?

### Takeaway
Celeste's source is the best feel reference (MIT). Phaser's own source confirms one-way tiles, fixed step, and filters (MIT). Phaser Raycaster shows the visibility-polygon method (license conflict between files). The two small stealth games show simple side-view detection ideas but have no license, so only the ideas are usable.

### Cited Findings
| Repo | License evidence | What I read | Pattern learned |
| --- | --- | --- | --- |
| [NoelFB/Celeste](https://github.com/NoelFB/Celeste) | LICENSE file: MIT, copyright 2018 Noel Berry. README: MIT covers the repo code only, not the commercial game or assets. | Source/Player/Player.cs (constants, update loop, corner correction) | Grace timer, held-jump window, half gravity at apex, corner nudge, hurtbox smaller than hitbox |
| [phaserjs/phaser](https://github.com/phaserjs/phaser) (4.2.1) | LICENSE.md: MIT; package.json: MIT | Tile.js, TileCheckY.js, World.js, Collider.js, FilterList.js, migration docs | One-way tiles via collideUp, TILE_BIAS, fixed step, Glow filter, v3 to v4 differences |
| [wiserim/phaser-raycaster](https://github.com/wiserim/phaser-raycaster) (0.11.1) | LICENSE file says MIT (2026, Marcin Walczak); package.json says ISC. Conflict. | README, src/ray/castCone.js, src/map/map-tilemap-methods.js | Cast to every corner, sort by angle, nudge at corners; tilemap edges to segments |
| [jordy-trevor/Transplant](https://github.com/jordy-trevor/Transplant) | No license file found | Enemy.js, parts of play.js | Side-view sight as facing, range, and height band; foreground/back layer swap to hide |
| [TasukuTSUKIOKA/kagemoguri](https://github.com/TasukuTSUKIOKA/kagemoguri) | No license file found | README, app.js exposure and cover functions | Graded exposure meter; pillar cover test; smoke as reset |

- The GitHub topic page for stealth-game (JavaScript filter) surfaced Transplant ("side scrolling stealth horror game made with the Phaser framework", 8 stars) and kagemoguri, plus several tiny canvas prototypes I did not read ([GitHub topic page](https://github.com/topics/stealth-game?l=javascript)).
- Transplant's README lists keys: A and D move, W and S climb, Space jumps, E interacts, H hides. It was built with Phaser (the repo bundles an older framework build) ([Transplant README](https://github.com/jordy-trevor/Transplant)).
- kagemoguri credits OpenAI Codex for development assistance and uses Left/Right (or A/D) for movement and Shift for smoke ([kagemoguri README](https://github.com/TasukuTSUKIOKA/kagemoguri)).

### Inferences
- Since two repos have no license, treat them as idea sources only. Nothing from them should be copied or closely paraphrased line by line.
- Celeste is the only repo here that gives tested feel numbers. The two small stealth repos are low quality code (global variables, magic numbers) and are best used for the simple detection ideas.
- Phaser Raycaster's license conflict (MIT file versus ISC field) is minor, since both are permissive, but a clean-license check is needed before depending on it.

### Gaps
- I found no well-regarded Phaser Arcade platformer repo that implements coyote time and jump buffering. My searches for one returned noise before the search budget ran out. Celeste plus the pseudo-code in section 3 covers the pattern.
- I did not find an open-source Mark of the Ninja style side-view stealth game with cameras and lasers.
- js13k entries were not examined.

#### Needs Michael or Chrome
- GDC Vault pages for "Depth in Simplicity: The Making of Jetpack Joyride" (https://gdcvault.com/play/1015316/Depth-in-Simplicity-The-Making) and "Limbo: Balancing Fun and Frustration in Puzzle Design" (https://gdcvault.com/play/1013665/Limbo-Balancing-Fun-and-Frustration). Both are tagged free but showed a login-limit notice, so I could not confirm the video or slides play. I did not try to get around it.
- Maddy Thorson's original Twitter thread on Celeste forgiveness (10 examples). Social media, not fetched. I used her blog article and GameSpot's summary instead.
- Jetpack Joyride laser and zapper warning timings. No fetchable source. Someone would need to watch gameplay and time them.
- Mark of the Ninja GDC talks and Klei postmortems, a Rayman Legends level-design talk, and Celeste's input buffer length (Monocle Engine is on Bitbucket per the Celeste README, not fetched). Not located within the search budget.
- Further web searches this turn were refused because the shared WebSearch budget was used up. If more leads are wanted, a follow-up turn would be needed.
