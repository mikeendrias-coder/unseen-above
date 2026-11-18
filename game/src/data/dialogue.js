// All spoken lines live here, so rewriting dialogue never touches scene code.
// DRAFTS for Michael to rewrite. Cues: bro/sis set where each character faces or points.
export const RIDGE = [
  { who: 'SISTER', text: 'The lights are on.', sis: { look: 1 } },
  { who: 'BROTHER', text: 'Nobody has lights anymore.' },
  { who: 'SISTER', text: 'Somebody does.' },
  { who: 'BROTHER', text: 'Not one broken window. Not one.', bro: { point: 1 } },
  { who: 'SISTER', text: "Places like that don't stay clean by accident.", sis: { face: -1 } },
  { who: 'BROTHER', text: 'Places like that have food. Medicine. Maybe a filter that still works.', bro: { face: -1 } },
  { who: 'SISTER', text: "Then I'm coming with you." },
  { who: 'BROTHER', text: "No. Watch the lights. If they turn toward me, you'll see it first.", bro: { face: -1 } },
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
export const MOON_ROBOT = ['Welcome home. Please wipe your feet.', 'You are early. Round two has not started.', 'The playroom is at the end. They are expecting a winner.'];
// DRAFT, for Michael: the third dialogue scene, in the kids' playroom. (Nov 17: the look vote is
// cut, so the two lines that named her look are redrafted; check them.)
export const PLAYROOM = [
  { who: null, text: '[THE MUSIC STOPS]' },
  { who: 'KID', text: "You're the girl from channel seven." },
  { who: 'LITTLE KID', text: "She's smaller in real life." },
  { who: 'KID', text: 'Are you here for round two?' },
  { who: 'SISTER', text: 'Who picks the lights?' },
  { who: 'LITTLE KID', text: 'We do. We pick everything.' },
  { who: 'SISTER', text: 'My brother died under your lights.' },
  { who: 'KID', text: 'He comes back. They always come back.' },
  { who: 'SISTER', text: 'I know.' },
  { who: null, text: '[CLICK. CLICK.]' }
];

// DRAFT, for Michael: the hallway behind the Moon city, where the creator of the show waits.
// The creator built every set, trap and camera, resets the props between takes, and is owned
// like everyone else. They toss her a sword because the kids voted for a fight. Lines are short
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
  { who: 'CREATOR', text: 'I put the glasses back in the drawer after every take.' }
];
// At the edge of the stage: the toss.
export const HALL_TOSS = [
  { who: 'SISTER', text: 'Why are you doing this?' },
  { who: 'CREATOR', text: 'Because they are watching. Same as you.' },
  { who: 'CREATOR', text: 'The kids voted for a fight tonight. Here.' },
  { who: null, text: '[A SWORD CLATTERS]' },
  { who: 'CREATOR', text: 'Hold it up. They need to see you hold it.' }
];
// Each round opens with the set it comes from.
export const HALL_ROUND = [
  ['The grounds were my first set. Lights in the dark. Simple.'],
  ['The gallery. I put the laser where the money is.'],
  ['Lights off. My cameras click twice before they flash.']
];
// Each time she lands a hit, in order.
// (Nov 17) Only hits 2, 4, 6 and 8 speak; the HP bar carries the rest.
export const HALL_HIT = [
  null,
  'Do you know what they call this up here? Content.',
  null,
  'Being seen is the one thing they cannot buy.',
  null,
  'The satellite is not mine. The kids aim it.',
  null,
  'They are watching me lose. First time anyone watched me.',
  null
];
// Her next take: the first thing the creator says.
export const HALL_AGAIN = [
  'Again. They like it when it is close.',
  'Take {take}. You are getting better. You always do.',
  'Do not stop. If you stop, they change the channel.',
  'Again. I will be here. I am always here.'
];
// The creator yields. The red light on their headset goes out.
export const HALL_YIELD = [
  { who: 'CREATOR', text: 'They will cut me after this. Somebody else will put the glasses back.' },
  { who: 'SISTER', text: 'Come with me.' },
  { who: 'CREATOR', text: 'There is nowhere to go. It is the Moon.' },
  { who: null, text: '[A CAMERA LIGHT CLICKS OFF]' },
  { who: 'CREATOR', text: 'The playroom is through there. When they look at you, look back.' }
];
// Things in the hallway, with E.
export const HALL_THINGS = {
  coats: ['Crew coats on a rail.', 'SEASON 41 on every back.'],
  shelf: ['A shelf of glasses. Dozens.', 'All the same as hers.'],
  board: ['CONTINUITY. Photos of every room, every take.', 'She is in a lot of them.'],
  monitors: ['Six feeds from Earth.', 'One is this hallway.'],
  console: ['A console with a satellite on the screen.', 'A sticker on it: ROUND TWO.']
};

// DRAFT, for Michael: what she notices when she looks at things with E, in every part. Shown
// as narration at the foot of the screen (italic), one line per press. Short and plain on
// purpose. Most of them are small clues that the house is a set; cut any that say too much.
export const NOTICE = {
  grounds: {
    tree: ['A dead tree, grey to the roots.', 'Past the gate, the hedges are green.'],
    car: ['A burnt car. The seats are ash.', 'Nobody drives anywhere now.'],
    gate: ['The gate stands open. Not a speck of ash on it.', 'Out here, everything is grey. In there, nothing is.'],
    hedge: ['The hedges are cut square.', 'Somebody still cuts them. She has never seen who.'],
    fountain: ['The fountain runs. Clean water.', 'She has not seen clean water in a long time.'],
    statue: ['A gold figure holding up a star.', 'The plaque under it says 07. They all do.'],
    pergola: ['Fairy lights all along the pergola.', 'Every bulb works.'],
    pool: ['A long pool. The house is upside down in it.', 'In the water, none of the windows are lit.']
  },
  gallery: {
    man: ['A man in gold, twice life size.', 'His eyes are painted to follow her.'],
    family: ['A family portrait.', 'Through the window behind them, the Earth.'],
    boy: ['A boy in a paper crown, holding a remote control.'],
    cake: ['A girl with a cake shaped like the Moon.', 'Seven candles.'],
    desk: ['A writing desk. The paper on it is blank.', 'The pen has never been used.'],
    bust: ['A white bust. No name under it.'],
    missing: ['A clean square on the wall where a portrait hung.', 'The nail is still there.'],
    column: ['A column snapped in half.', 'Inside, it is foam.'],
    fallen: ['A portrait face down on the floor.', 'She leaves it that way.'],
    chandelier: ['A chandelier that came down long ago.', 'The crystals are plastic.'],
    robot: ['A cleaning robot like the one in the hall.', 'Its screen still says PLEASE DO NOT.'],
    camera: ['The broken camera keeps turning up to the hole in the roof.', 'Up there, the Moon.']
  },
  eastwing: {
    body: ['An old body in a jacket like hers.', 'Nobody ever took it away.'],
    books: ['The books are painted on a board.'],
    desk: ['A desk. On it, a map of this wing.', 'Her way through is drawn on it in red.']
  },
  bedroom: {
    piano: ['A grand piano with the lid down.', 'Nobody here has ever played it.'],
    table: ['A table laid for twelve.', 'The food is wax.'],
    clock: ['A grandfather clock. It strikes every six seconds.', 'While it strikes, nobody can hear her.'],
    silver: ['Silver on a long table, polished today.'],
    billiards: ['A billiard table. The balls are glued down.']
  },
  moon: {
    fountain: ['A gold fountain, the twin of the one on the grounds.', 'Up here, the water is the expensive part.'],
    bench: ['A bench. Nobody up here sits outside.'],
    planter: ['Real plants in real soil.', 'Somebody brought dirt to the Moon.'],
    blocks: ['Blocks in a heap.', 'Someone built a little house and knocked it down.'],
    porthole: ['The Earth, through a round window.', 'From here it looks like a toy.']
  },
  hallway: {
    gallery: ['The back of the gallery. Plywood, braces, sandbags.'],
    gate: ['GROUNDS GATE, stencilled on the back of a wall.', 'From this side, the gold is yellow paint.'],
    door: ['BEDROOM DOOR. The frame, from behind.', 'Tape on the floor marks where his bed goes.'],
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
    [/fall/, 'She fell.'],
    [/ceiling/, 'The ceiling came down.'],
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
  { lines: ['Not now. I am working.', 'Keep walking. They like it when you keep walking.'], bump: 'Excuse me.' },
  { lines: ['Look at her. Just like on the screen.', 'My son aims on Tuesdays.'], bump: 'Mind the phone!' },
  { lines: ['You are early. Round two is not set.', 'The staff door. Mind the cables.'], bump: 'Watch it.' }
];
export const MOON_HEAD = ['Get down!', 'Off! Off!', 'Someone get her down!'];
