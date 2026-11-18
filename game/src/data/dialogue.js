// All spoken lines live here, so rewriting dialogue never touches scene code.
// DRAFTS for Michael to rewrite. Cues: bro/sis set where each character faces or points.
export const RIDGE = [
  { who: 'SISTER', text: 'The lights are on.', sis: { look: 1 } },
  { who: 'BROTHER', text: 'Nobody has lights anymore.' },
  { who: 'SISTER', text: 'Somebody does.' },
  { who: 'BROTHER', text: 'Not one broken window. Not one.', bro: { point: 1 } },
  { who: 'SISTER', text: "Places like that don't stay clean by accident.", sis: { face: -1 } },
  { who: 'BROTHER', text: 'Places like that have food. Medicine.', bro: { face: -1 } },
  { who: 'SISTER', text: "Then I'm coming with you." },
  { who: 'BROTHER', text: "No. Watch the lights. You'll see them turn.", bro: { face: -1 } },
  { who: 'SISTER', text: "And if you don't come back?", sis: { face: -1 } },
  { who: 'BROTHER', text: 'I always come back.', bro: { face: 1 } }
];
export const RIDGE_ALONE = { who: 'SISTER', text: 'You always come back.' };
export const SOUNDS = { wind: '[WIND]', later: '[HOURS LATER]', hum: '[A LOW HUM FROM THE HOUSE]' };
export const lineSeconds = text => 1.5 + text.length * 0.052;

// DRAFT, not used yet: the brother's last scene, in the bedroom at the center of the house.
// He is dying (a lost leg, a trail of blood). He does not want to die, and the game never says
// why. "You always come back" calls back to the ridge. The last line points at the void door.
export const BEDROOM = [
  { who: null, text: '[SLOW BREATHING]' },
  { who: 'SISTER', text: 'I followed the blood.' },
  { who: 'BROTHER', text: 'You were supposed to watch the lights.' },
  { who: 'SISTER', text: 'I did. They watched me back.' },
  { who: null, text: '[COUGHING]' },
  { who: 'SISTER', text: 'Your leg.' },
  { who: 'BROTHER', text: "Don't look at it. Look at me." },
  { who: 'BROTHER', text: "I don't want to die." },
  { who: 'SISTER', text: "You won't. You always come back." },
  { who: 'BROTHER', text: "That's what I'm afraid of." },
  { who: 'BROTHER', text: "Don't open that door." }
];

// DRAFT, for Michael: the Moon. Lines overheard through the glass, two per room.
export const MOON_OVERHEARD = [
  ['She went through the door.', 'They never go through the door.'],
  ['Turn it up. The next one is starting.', 'I liked the old house better.'],
  ['Is this one new?', 'It is a repeat.']
];
// DRAFT: the cleaning robot up here, the same model as the one in the gallery.
export const MOON_ROBOT = ['Welcome home. Please wipe your feet.', 'You are early. Round two has not started.', 'The playroom is at the end. They want a winner.'];
// The playroom (Nov 17, Claude's draft from Michael's lines). The opening is the same every time;
// at "Are you here for round two?" she picks a reply (data/endings.js REPLIES), and the reply's
// lines lead into its ending. Lines are short on purpose; none over about 50 characters.
export const PLAYROOM = [
  { who: null, text: '[THE MUSIC STOPS]' },
  { who: 'KID', text: "You're the girl from channel seven." },
  { who: 'LITTLE KID', text: "She's smaller in real life." },
  { who: 'KID', text: 'Are you here for round two?' }
];
// after each reply: what she says (if anything), and what they say back
export const PLAYROOM_REPLY = {
  // THE VEST (Michael's ending)
  lights: [
    { who: 'SISTER', text: 'Who picks the lights?' },
    { who: 'LITTLE KID', text: 'We do. We pick everything.' },
    { who: 'SISTER', text: 'My brother died under your lights.' },
    { who: 'KID', text: 'He comes back. They always come back.' },
    { who: 'SISTER', text: 'I know.' },
    { who: null, text: '[CLICK. CLICK.]' }
  ],
  // ROUND TWO: she takes the controller
  yes: [
    { who: 'SISTER', text: 'Yes.' },
    { who: 'KID', text: 'Good. You can be player two.' },
    { who: 'LITTLE KID', text: 'Pick a light. Any light.' },
    { who: null, text: '[GAME SHOW JINGLE]' }
  ],
  // LOOK BACK: she turns their camera around (she has to walk to it; J)
  turn: [
    { who: 'SISTER', text: 'Turn it around.' },
    { who: 'KID', text: 'Turn what around?' }
  ],
  turned: [
    { who: null, text: '[A CAMERA LIGHT CLICKS ON]' },
    { who: 'LITTLE KID', text: 'Turn it off. Turn it off!' },
    { who: 'KID', text: 'Who is watching?' }
  ],
  // THE COUCH (secret): nothing is said by her at all
  sit: [
    { who: null, text: '[SHE SITS DOWN BETWEEN THEM]' },
    { who: 'LITTLE KID', text: 'You can watch with us.' },
    { who: 'KID', text: 'Shh. This part is good.' },
    { who: null, text: '[THE SHOW GOES ON]' }
  ]
};
// END IT ALL: the creator gave up and she beat them anyway. Nobody is in the playroom.
export const PLAYROOM_EMPTY = [
  { who: null, text: '[THE COUCH IS EMPTY. THE TV IS ON]' },
  { who: null, text: '[A RERUN PLAYS TO NOBODY]' }
];
// the reply slip's heading
export const PLAYROOM_ASK = 'REPLY';
// DRAFT: looks in the city that count as clues
export const MOON_LOOKS = {
  lost: ['LOST AND FOUND. Glasses, one kind only.', 'Every pair is hers.'],
  camera: ['Their camera, aimed out at Earth.', 'A red light. It is always on.']
};

// DRAFT, for Michael: the hallway behind the Moon city, where the creator of the show waits.
// The creator built every set, trap and camera, resets the props between takes, and is owned
// like everyone else. They toss her a sword because the kids picked a fight. Lines are short
// on purpose: they run as captions during the fight. Marked choices for Michael:
//   * "two clicks ... the only kind thing I was allowed to build" ties the cameras' warning to
//     the two clicks on her chest at the end. Cut it if that says too much about the vest.
//   * "The kids aim it" says outright who aims the satellite in the batches.
//   * The ending of the fight (the creator yields and lets her pass) is a placeholder.
// Walking in: the creator talks while she comes down the hallway.
// (Nov 17) The walk in is quiet now. At the edge of the stage the creator speaks these two, then
// HALL_TOSS: one fixed train of lines, the same on every arrival. Retries skip it.
export const HALL_IN = [
  { who: 'CREATOR', text: 'Every room you walked through, I built.' },
  { who: 'CREATOR', text: 'I put the glasses back in the drawer. Every take.' }
];
// At the edge of the stage: the toss.
export const HALL_TOSS = [
  { who: 'SISTER', text: 'Why are you doing this?' },
  { who: 'CREATOR', text: 'Because they are watching. Same as you.' },
  { who: 'CREATOR', text: 'The kids picked a fight tonight. Here.' },
  { who: null, text: '[A SWORD CLATTERS]' },
  { who: 'CREATOR', text: 'Hold it up. They need to see you hold it.' }
];
// Each round opens with the set it comes from.
export const HALL_ROUND = [
  ['The grounds. My first set. Lights in the dark.'],
  ['The gallery. I put the laser where the money is.'],
  ['Lights off. My cameras click twice, then flash.']
];
// Each time she lands a hit, in order.
// (Nov 17) Only hits 2, 4, 6 and 8 speak; the HP bar carries the rest.
export const HALL_HIT = [
  null,
  'Do you know what they call this up here? Content.',
  null,
  'Nobody films them. That is what the money is for.',
  null,
  'The satellite is not mine. The kids aim it.',
  null,
  'They watch me lose. First time anyone watched me.',
  null
];
// Her next take: the first thing the creator says.
export const HALL_AGAIN = [
  'Again. They like it when it is close.',
  'Take {take}. You get better. You always do.',
  'Do not stop. Stop, and they change the channel.',
  'Again. I will be here. I am always here.'
];
// The creator yields. The red light on their headset goes out.
export const HALL_YIELD = [
  { who: 'CREATOR', text: 'They will cut me after this.' },
  { who: 'CREATOR', text: 'Somebody else will put the glasses back.' },
  { who: 'SISTER', text: 'Come with me.' },
  { who: 'CREATOR', text: 'There is nowhere to go. It is the Moon.' },
  { who: null, text: '[A CAMERA LIGHT CLICKS OFF]' },
  { who: 'CREATOR', text: 'When they look at you, look back.' }
];
// Give-up mode (Michael's idea): after six deaths in the fight the creator drops the sword and
// says only this, every few seconds. The repeat is the point; it is the one line that repeats.
export const HALL_GIVEUP = {
  drop: '[THE CREATOR DROPS THE SWORD]',
  scream: 'End it all.',
  down: '[THE HEADSET LIGHT GOES OUT]'
};
// Things in the hallway, with E.
export const HALL_THINGS = {
  coats: ['Crew coats on a rail.', 'SEASON 41 on every back.'],
  shelf: ['A shelf of glasses. Dozens.', 'All the same as hers.'],
  board: ['CONTINUITY. Every room, every take.', 'She is in a lot of them.'],
  monitors: ['Six feeds. Five from Earth.', 'The sixth is this hallway.'],
  console: ['A console. A satellite on the screen.', 'Signed in: PLAYER 2. Sticker: ROUND TWO.']
};

// DRAFT, for Michael: what she notices when she looks at things with E, in every part. Shown
// as narration at the foot of the screen (italic), one line per press. Short and plain on
// purpose. Most of them are small clues that the house is a set; cut any that say too much.
export const NOTICE = {
  grounds: {
    tree: ['A dead tree, grey to the roots.', 'Past the gate, the hedges are green.'],
    car: ['A burnt car. The seats are ash.'],
    mailbox: ['A mailbox. OCCUPANT, ESTATE 07.', 'Inside, a form. REQUEST: VOLUNTARY.', 'The signature line is blank.'],
    footprints: ['Footprints in the ash. His.', 'They go straight to the gate.'],
    footprints2: ['His footprints, and smaller ones.', 'The small ones are hers. Every take.'],
    intercom: ['Please hold.', 'Your call is being recorded.'],
    gate: ['The gate stands open. No ash on it.', 'Out here, all grey. Not in there.'],
    crowbar: ['His crowbar. He came this way.', 'On the handle, a tally. Eleven marks.'],
    hedge: ['The hedges are cut square.', 'Somebody cuts them. She never sees who.'],
    orangery: ['A glass house full of orange trees.', 'The oranges are wax.'],
    fountain: ['Gold koi, all turning at once.', 'They run on a track.'],
    statue: ['A gold figure holding up a star.', 'The plaque says 07. They all do.'],
    crate: ['A crate stencilled ESTATE 07. Heavy.', 'Something to hide behind.'],
    cradle: ['A window cleaner\'s cradle.', 'The glass up there is spotless.']
  },
  gallery: {
    man: ['A man in gold. The eyes are painted red.', 'They move when she does.'],
    desk: ['A writing desk. The paper is blank.', 'The pen has never been used.'],
    sheets: ['Dust sheets, heaped up.', 'Someone left them here to catch a fall.'],
    chandelier: ['Chandeliers on long chains.', 'They swing. Nobody pushed them.'],
    missing: ['A clean square where a portrait hung.', 'The nail is still there.'],
    polisher: ['A floor polisher. It stops for nobody.'],
    camera: ['A broken camera. It keeps turning up.', 'Up there, the Moon. One window lit.'],
    lightswitch: ['The chandeliers go dark.', 'The red lights stay on.'],
    drawer2: ['The glasses are back in the drawer.', 'Someone puts them back. Every take.'],
    emitter: ['The laser port is still warm.', 'That sound again. Like a prize.']
  },
  eastwing: {
    body: ['An old body in her jacket. Never moved.'],
    books: ['The books are painted on a board.'],
    desk: ['A map of this wing. Her way, in red.'],
    calendar: ['A calendar. Every day on it is the 7th.'],
    radio: ['A radio, tuned to the sensors.', 'Near one, it plays the satellite tune.'],
    hatch: ['The dumbwaiter comes out here.'],
    dumbwaiter: ['A dumbwaiter. It goes to the library.', 'A pebble in it would rattle there.'],
    fire: ['A fire, still going. Nobody lives here.'],
    bust: ['The owner, in gold. The lasers guard him.'],
    piano: ['A grand piano under the ash. Locked.'],
    full: ['Her pockets hold five. They are full.'],
    cot: ['Two cots, the blankets folded.', 'Someone still makes them up.'],
    horse: ['A rocking horse. Still rocking.'],
    fountain: ['A dry fountain. Coins in the ash.', 'Every one of them gold.'],
    billiards: ['The score is still up.', 'Seven to nothing.']
  },
  bedroom: {
    piano: ['A grand piano. Nobody has played it.'],
    table: ['A table set for twelve. The food is wax.'],
    clock: ['While it strikes, nobody can hear her.'],
    silver: ['Silver on a long table, polished today.'],
    billiards: ['A billiard table. The balls are glued.'],
    photos: ['Three families in three photos.', 'Him at the back, older each time.'],
    window: ['The Moon, low and white. One window lit.'],
    request: ['REQUEST: VOLUNTARY. Locate the subject.', 'Unsigned.'],
    bagNote: ['In his hand: "Don\'t let her follow."'],
    hold: ['She holds on to him.']
  },
  // the first gold piece she ever picks up (core/props.js Gold); never again after that
  gold: {
    first: ['Gold, set right on her path.']
  },
  // the first tape mark she ever reaches, in any episode (core/props.js Marks); never again
  tape: {
    first: ['A tape mark. Her next take starts here.']
  },
  moon: {
    fountain: ['A gold fountain.', 'Its twin stands on the grounds.', 'Up here, water is the expensive part.'],
    bench: ['A bench. Nobody up here sits outside.'],
    planter: ['Real plants in real soil.', 'Somebody brought dirt to the Moon.'],
    blocks: ['Blocks in a heap.', 'A little house, built and knocked down.'],
    porthole: ['The Earth, through a round window.', 'From here it looks like a toy.']
  },
  hallway: {
    gallery: ['The gallery, from the back.', 'Plywood, braces, sandbags.'],
    gate: ['GROUNDS GATE, stencilled on the plywood.', 'From here, the gold is yellow paint.'],
    door: ['BEDROOM DOOR. The frame, from behind.', 'Tape marks where his bed goes.'],
    crate: ['A crate stencilled PROPS.', 'Inside, a dozen crowbars like his.']
  }
};

// DRAFT: her own bodies from earlier takes, with E. {take} is the take that body was. The
// first line goes by how old it looks now, the second by what killed her.
export const BODY_SEEN = {
  age: ['Take {take}. She looks asleep.', 'Take {take}. A little older than she is.', 'Take {take}. Older. Ash in her hair.', 'Take {take}. Grey all through.'],
  cause: [
    [/drone/, 'A drone saw her.'],
    [/lamp|light|scan/, 'A light found her.'],
    [/laser/, 'The laser.'],
    [/camera/, 'A camera saw her.'],
    [/chandelier/, 'The chandelier.'],
    [/polisher/, 'The polisher knocked her down.'],
    [/crate/, 'The crate came down on her.'],
    [/cradle/, 'The cradle caught her.'],
    [/crush/, 'Something heavy caught her.'],
    [/fall/, 'She fell.'],
    [/ceiling|debris/, 'The ceiling came down.'],
    [/creator/, 'One cut.'],
    [/sensor/, 'A sensor caught her moving.'],
    [/robot/, 'The robot heard her.']
  ],
  fallback: 'Something up there saw her.',
  last: 'Same jacket. Same hands.'
};
export function bodyLines(b, age) {
  const c = BODY_SEEN.cause.find(([re]) => re.test(b.cause || ''));
  return [BODY_SEEN.age[age].replace('{take}', b.take), c ? c[1] : BODY_SEEN.fallback, BODY_SEEN.last];
}

// DRAFT, for Michael: a caption at each death that says what got her, in the style of a sound
// caption. Matched on the id of what killed her (first match wins); {WHAT} is that id. direct
// is for things that hit her themselves rather than calling the satellite.
export const DEATH_SAID = [
  [/scan/, '[THE SCAN FOUND HER]'],
  [/drone/, '[THE {WHAT} SAW HER]'],
  [/lamp|searchlight/, '[THE {WHAT} FOUND HER]'],
  [/laser/, '[THE LASER CUT HER DOWN]'],
  [/camera/, '[THE {WHAT} SAW HER]'],
  [/chandelier/, '[THE CHANDELIER SAW HER]', '[THE CHANDELIER CAME DOWN ON HER]'],
  [/polisher/, '[THE POLISHER KNOCKED HER DOWN]'],
  [/crate/, '[THE CRATE CAME DOWN ON HER]'],
  [/cradle/, '[THE CRADLE CAUGHT HER]'],
  [/crush/, '[SOMETHING HEAVY CAUGHT HER]'],
  [/fall/, '[SHE FELL]'],
  [/ceiling/, '[THE CEILING CAME DOWN]'],
  [/creator/, '[THE LAST CUT]'],
  [/sensor/, '[A MOTION SENSOR CAUGHT HER MOVING]'],
  [/robot/, '[THE {WHAT} SAW HER]', '[THE {WHAT} KNOCKED HER DOWN]'],
  [/slab|debris|rubble|glass|shard|stair|floor|beam|statue|crate/, '[THE HOUSE CAME DOWN ON HER]', '[THE HOUSE CAME DOWN ON HER]'],
  // anything else: a watcher saw her, or the house wore her down
  [/./, '[SOMETHING UP THERE SAW HER]', '[SHE DID NOT GET UP]']
];
export const DEATH_FALLBACK = '[SOMETHING UP THERE SAW HER]';
export function deathLine(id, direct) {
  const m = DEATH_SAID.find(([re]) => re.test(id || ''));
  if (!m) return DEATH_FALLBACK;
  return ((direct && m[2]) || m[1]).replace('{WHAT}', String(id).toUpperCase());
}

// DRAFT, for Michael: people out in the city. E talks to them (speech over their heads); bump
// is what they say when she walks into them, head when she lands on one.
export const MOON_PEOPLE = [
  { lines: ['Smile, sweetheart. No, toward the light.', 'Is this the one where she cries?'], bump: 'Careful, dear. This is silk.' },
  { lines: ['Do not touch her. It might be part of it.', 'It is only television, dear.'], bump: 'She touched me!' },
  { lines: ['On their maps, our house is a blur. We paid.', 'Keep walking. They like it when you keep walking.'], bump: 'Excuse me.' },
  { lines: ['Look at her. Just like on the screen.', 'My son aims on Tuesdays.'], bump: 'Mind the phone!' },
  { lines: ['Are you lost? Staff use the back.', 'The staff door. Mind the cables.'], bump: 'Watch it.' }
];
export const MOON_HEAD = ['Get down!', 'Off! Off!', 'Someone get her down!'];
