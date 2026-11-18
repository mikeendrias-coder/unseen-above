// All spoken lines live here, so rewriting dialogue never touches scene code.
// Nov 18 rewrite: plain talk, the way people actually speak. Captions stay short (about 50
// characters; looks 40 so they fit one strip row). Cues: bro/sis set where each faces or points.
// The opening on the ridge: they see the lit house, he decides to go, she wants to come, he
// tells her to stay and watch the lights.
export const RIDGE = [
  { who: 'SISTER', text: 'Hey. Look. Those lights are on.', sis: { look: 1 } },
  { who: 'BROTHER', text: "Nobody's had power in years." },
  { who: 'SISTER', text: 'Well, somebody does.' },
  { who: 'BROTHER', text: 'Not one broken window. Not one.', bro: { point: 1 } },
  { who: 'SISTER', text: "That's weird, right? Who keeps it that nice?", sis: { face: -1 } },
  { who: 'BROTHER', text: 'Somebody with food. Maybe medicine.', bro: { face: -1 } },
  { who: 'SISTER', text: "Then I'm coming with you." },
  { who: 'BROTHER', text: 'No. Stay up here and watch the lights.', bro: { face: -1 } },
  { who: 'BROTHER', text: 'If anything weird happens, you run. Okay?' },
  { who: 'SISTER', text: "And what if you don't come back?", sis: { face: -1 } },
  { who: 'BROTHER', text: 'I always come back.', bro: { face: 1 } }
];
export const RIDGE_ALONE = { who: 'SISTER', text: 'You always come back.' };
export const SOUNDS = { wind: '[WIND]', later: '[HOURS LATER]', hum: '[A LOW HUM FROM THE HOUSE]' };
export const lineSeconds = text => 1.5 + text.length * 0.052;

// The bedroom at the center of the house (ep4). He is dying (a lost leg, a trail of blood) and
// scared. He has been through this before (the tally on his crowbar, the photos, his note), so he
// says it plainly. "You always come back" calls back to the ridge; the last line points at the
// void door. Eleven lines: docs/RUN_SHEET.md tells the presenter to press Enter 11 times.
export const BEDROOM = [
  { who: null, text: '[SLOW BREATHING]' },
  { who: 'SISTER', text: "Hey. Hey, it's me. I found you." },
  { who: 'BROTHER', text: 'You were supposed to stay on the ridge.' },
  { who: 'SISTER', text: "I did. Then you didn't come back." },
  { who: null, text: '[COUGHING]' },
  { who: 'BROTHER', text: "Don't look at my leg. Look at me." },
  { who: 'BROTHER', text: "I'm scared. I don't want to die." },
  { who: 'SISTER', text: "You won't. You always come back." },
  { who: 'BROTHER', text: "We've done this before. They restart us." },
  { who: 'SISTER', text: 'What? Who does?' },
  { who: 'BROTHER', text: "Just don't open that door. Promise me." }
];

// The Moon. Rich adults overheard through the lounge glass, two per room. Bored, not cruel.
export const MOON_OVERHEARD = [
  ['Wait, she went through the door?', 'They never go through the door.'],
  ["Turn it up, it's starting.", "I liked last season's house better."],
  ['Have we seen this one?', "Probably. They're all the same."]
];
// The cleaning robot up here, the same model as the one in the gallery. Cheerful, no idea.
export const MOON_ROBOT = ['Welcome home! Please wipe your feet.', "You're early. Round two hasn't started.", "Playroom's at the end. The kids want a winner."];
// The playroom. The opening is the same every time; at "Are you here for round two?" she picks a
// reply (data/endings.js REPLIES), and the reply's lines lead into its ending. The last line here
// must stay "Are you here for round two?" (scenes/Moon.js shows it again under the reply slip).
export const PLAYROOM = [
  { who: null, text: '[THE MUSIC STOPS]' },
  { who: 'KID', text: "Whoa. You're the girl from channel seven!" },
  { who: 'LITTLE KID', text: 'You look smaller in real life.' },
  { who: 'KID', text: 'Are you here for round two?' }
];
// after each reply: what she says (if anything), and what they say back
export const PLAYROOM_REPLY = {
  // THE VEST (Michael's ending)
  lights: [
    { who: 'SISTER', text: 'Who picks the lights?' },
    { who: 'LITTLE KID', text: 'We do! We pick everything.' },
    { who: 'SISTER', text: 'My brother died because of your lights.' },
    { who: 'KID', text: "So? He'll come back. They always do." },
    { who: 'SISTER', text: 'Yeah. I know.' },
    { who: null, text: '[CLICK. CLICK.]' }
  ],
  // ROUND TWO: she takes the controller
  yes: [
    { who: 'SISTER', text: 'Yes.' },
    { who: 'KID', text: 'Cool! You can be player two.' },
    { who: 'LITTLE KID', text: 'Pick a light. Any one you want.' },
    { who: null, text: '[GAME SHOW JINGLE]' }
  ],
  // LOOK BACK: she turns their camera around (she has to walk to it; J)
  turn: [
    { who: 'SISTER', text: 'Turn it around.' },
    { who: 'KID', text: 'Huh? Turn what around?' }
  ],
  turned: [
    { who: null, text: '[A CAMERA LIGHT CLICKS ON]' },
    { who: 'LITTLE KID', text: 'Turn it off! Turn it off!' },
    { who: 'KID', text: "Wait. Who's watching us?" }
  ],
  // THE COUCH (secret): nothing is said by her at all
  sit: [
    { who: null, text: '[SHE SITS DOWN BETWEEN THEM]' },
    { who: 'LITTLE KID', text: 'You can watch with us if you want.' },
    { who: 'KID', text: 'Shh. This is the good part.' },
    { who: null, text: '[THE SHOW GOES ON]' }
  ]
};
// END IT ALL: the creator gave up and she beat them anyway. Nobody is in the playroom.
export const PLAYROOM_EMPTY = [
  { who: null, text: "[NOBODY'S HERE. THE TV IS STILL ON]" },
  { who: null, text: '[A RERUN, PLAYING TO NOBODY]' }
];
// the reply slip's heading
export const PLAYROOM_ASK = 'REPLY';
// looks in the city that count as clues
export const MOON_LOOKS = {
  lost: ['LOST AND FOUND. A whole box of glasses.', 'Every pair is just like hers.'],
  camera: ["The kids' camera, pointed at Earth.", 'Its red light never goes off.']
};

// The hallway behind the Moon city, where the creator of the show waits. The creator built every
// set, trap and camera, resets the props between takes, and is just an employee, tired and owned
// like everyone else. They toss her a sword because the kids picked a fight. Lines are short on
// purpose: they run as captions during the fight. Choices for Michael:
//   * "The satellite isn't mine. The kids aim it." says outright who aims the satellite.
//   * The creator's last line ("Their camera's in there.") hints at LOOK BACK. Cut it if that
//     gives the secret away.
// At the edge of the stage the creator speaks HALL_IN, then HALL_TOSS: one fixed train of
// lines, the same on every arrival. Retries skip it.
export const HALL_IN = [
  { who: 'CREATOR', text: 'Every room you came through? I built it.' },
  { who: 'CREATOR', text: "I'm the one who puts the glasses back." }
];
// At the edge of the stage: the toss. Keep five: [3] is the clatter, and scenes/Hallway.js plays
// [4] after she picks the sword up.
export const HALL_TOSS = [
  { who: 'SISTER', text: 'Why are you doing this to us?' },
  { who: 'CREATOR', text: "Honestly? It's my job. I don't get a say." },
  { who: 'CREATOR', text: 'The kids picked a fight tonight. Sorry. Here.' },
  { who: null, text: '[A SWORD CLATTERS]' },
  { who: 'CREATOR', text: 'Hold it up so they can see it.' }
];
// Each round opens with the set it comes from (one list per round, three rounds).
export const HALL_ROUND = [
  ['Round one. The grounds. Stay out of the light.'],
  ['Round two. The gallery. Watch for the laser.'],
  ['Lights off. The cameras click twice, then flash.']
];
// Each time she lands a hit, in order (nine; indexed by hit number).
// Only hits 2, 4, 6 and 8 speak; the HP bar carries the rest.
export const HALL_HIT = [
  null,
  'Know what they call this up here? Content.',
  null,
  "Nobody ever films them. That's what money buys.",
  null,
  "The satellite isn't mine. The kids aim it.",
  null,
  "They're watching me lose. That's a first.",
  null
];
// Her next take: the first thing the creator says (only the first two play).
export const HALL_AGAIN = [
  "Again? Okay. They like it when it's close.",
  'Take {take}. You keep getting better.',
  "Don't stop. If you stop, they change the channel.",
  "Again. I'll be here. I'm always here."
];
// The creator yields. The red light on their headset goes out.
export const HALL_YIELD = [
  { who: 'CREATOR', text: "Okay. I'm done. They'll cut me for this." },
  { who: 'CREATOR', text: 'Somebody else can put the glasses back.' },
  { who: 'SISTER', text: 'Then come with me.' },
  { who: 'CREATOR', text: "Come where? We're on the Moon." },
  { who: null, text: '[A CAMERA LIGHT CLICKS OFF]' },
  { who: 'CREATOR', text: 'The kids are through there. Go on.' },
  { who: 'CREATOR', text: "Their camera's in there too. Just so you know." }
];
// Give-up mode (Michael's idea): after six deaths in the fight the creator drops the sword and
// says only this, every few seconds. The repeat is the point; it is the one line that repeats.
export const HALL_GIVEUP = {
  drop: '[THE CREATOR DROPS THE SWORD]',
  scream: 'End it all.',
  down: '[THE HEADSET LIGHT GOES OUT]'
};
// Things in the hallway, with J.
export const HALL_THINGS = {
  coats: ['Crew jackets. SEASON 41 on the back.', 'Forty-one seasons of this.'],
  shelf: ['Shelves of glasses. Dozens of pairs.', 'Every pair is the same as hers.'],
  board: ['CONTINUITY board. A photo of every take.', "She's in almost all of them."],
  monitors: ['Six screens. Five of them show Earth.', 'The sixth one shows this hallway.'],
  console: ["The satellite controls. A kid's sticker.", 'Logged in as PLAYER 2.']
};

// What she notices when she looks at things with J, in every part. Shown as narration at the
// foot of the screen (italic), one line per press, 40 characters at most so each fits one row.
// Most of them are small clues that the house is a set.
export const NOTICE = {
  grounds: {
    tree: ['A dead tree, grey to the roots.', 'Beyond the gate, the hedges are green.'],
    car: ['A burnt-out car. Even the seats are ash.'],
    mailbox: ['A mailbox: OCCUPANT, ESTATE 07.', 'A form inside: REQUEST: VOLUNTARY.', 'Nobody signed it.'],
    footprints: ['His footprints. She knows his boots.', 'They go straight for the gate.'],
    footprints2: ['His prints, and lots of smaller ones.', 'The small ones are hers. Too many.'],
    intercom: ['Please hold.', 'This call may be recorded.'],
    gate: ['The gate is open. Not a speck of ash.', 'Ash everywhere out here. None in there.'],
    crowbar: ['His crowbar. He came this way.', 'Eleven tally marks cut into the grip.'],
    hedge: ['Hedges cut perfectly square.', 'Someone trims these. She never sees who.'],
    orangery: ['A greenhouse full of orange trees.', 'The oranges are wax. All of them.'],
    fountain: ['Gold fish, all turning at the same time.', "They're not real. They run on a track."],
    statue: ['A gold statue holding up a star.', 'The plaque says 07. Everything does.'],
    crate: ['A heavy crate. ESTATE 07.', 'She could hide behind this.'],
    cradle: ["A window washer's cradle.", 'The windows up there are spotless.']
  },
  gallery: {
    man: ['A portrait of a man in gold.', 'His eyes are red. They follow her.'],
    desk: ['A writing desk. Blank paper.', 'The pen has never been used.'],
    sheets: ['A pile of dust sheets.', 'Soft enough to land on.'],
    chandelier: ['Chandeliers on long chains.', "They're swinging. Nobody touched them."],
    missing: ['A clean square where a painting was.', 'The nail is still there.'],
    polisher: ["A floor polisher. It won't stop for her."],
    camera: ['A broken camera, still pointing up.', "It's aimed at the Moon. A window is lit."],
    lightswitch: ['She flips it. The chandeliers go dark.', 'The little red lights stay on.'],
    drawer2: ['The glasses are back in the drawer.', 'She took them. Someone put them back.'],
    emitter: ['The laser is still warm.', 'It chimed. Like someone won something.']
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
    piano: ['A grand piano. Never been played.'],
    table: ['Dinner for twelve. The food is wax.'],
    clock: ['While it chimes, nobody can hear her.'],
    silver: ['Silverware, polished this morning.'],
    billiards: ['A pool table. The balls are glued down.'],
    photos: ['Three photos, three different families.', "Her brother's in the back of every one."],
    window: ['The Moon. One little window is lit.'],
    request: ['Another form. REQUEST: VOLUNTARY.', 'Find the subject. Nobody signed it.'],
    bagNote: ['His note: "Don\'t let her follow."'],
    hold: ['She holds on to him.']
  },
  // the first gold piece she ever picks up (core/props.js Gold); never again after that
  gold: {
    first: ["Gold, left right where she'd find it."]
  },
  // the first tape mark she ever reaches, in any episode (core/props.js Marks); never again
  tape: {
    first: ['A tape mark. Her next take starts here.']
  },
  moon: {
    fountain: ['A gold fountain.', 'Same as the one back at the house.', 'On the Moon, water costs a fortune.'],
    bench: ["A bench. Nobody's ever sat on it."],
    planter: ['Real plants. Real dirt.', 'Someone paid to fly dirt to the Moon.'],
    blocks: ['Toy blocks in a pile.', 'A kid built a house and knocked it down.'],
    porthole: ['The Earth, through a round window.', 'From up here it looks like a toy.']
  },
  hallway: {
    gallery: ['The back of the gallery set.', "It's plywood and sandbags."],
    gate: ['GROUNDS GATE, painted on plywood.', 'The gold is just yellow paint.'],
    door: ['The back of the bedroom door.', 'Tape on the floor: where his bed goes.'],
    crate: ['A crate marked PROPS.', 'A dozen crowbars inside. All like his.']
  }
};

// Her own bodies from earlier takes, with J. {take} is the take that body was. The first line
// goes by how old it looks now (four steps), the second by what killed her.
export const BODY_SEEN = {
  age: ["Take {take}. She looks like she's asleep.", 'Take {take}. A little older than her.', 'Take {take}. Older. Ash in her hair.', 'Take {take}. Grey all the way through.'],
  cause: [
    [/drone/, 'A drone spotted her.'],
    [/lamp|light|scan/, 'A light found her.'],
    [/laser/, 'The laser got her.'],
    [/camera/, 'A camera spotted her.'],
    [/chandelier/, 'The chandelier fell on her.'],
    [/polisher/, 'The polisher knocked her down.'],
    [/crate/, 'The crate fell on her.'],
    [/cradle/, 'The cradle crushed her.'],
    [/crush/, 'Something heavy crushed her.'],
    [/fall/, 'She fell too far.'],
    [/ceiling|debris/, 'The ceiling fell on her.'],
    [/creator/, "The creator's sword."],
    [/sensor/, 'A sensor caught her moving.'],
    [/robot/, 'The robot heard her.']
  ],
  fallback: 'Something up there saw her.',
  last: "Same jacket. Same face. It's her."
};
export function bodyLines(b, age) {
  const c = BODY_SEEN.cause.find(([re]) => re.test(b.cause || ''));
  return [BODY_SEEN.age[age].replace('{take}', b.take), c ? c[1] : BODY_SEEN.fallback, BODY_SEEN.last];
}

// A caption at each death that says what got her, in the style of a sound caption. Matched on
// the id of what killed her (first match wins); {WHAT} is that id. direct is for things that hit
// her themselves rather than calling the satellite.
export const DEATH_SAID = [
  [/scan/, '[THE SCAN FOUND HER]'],
  [/drone/, '[THE {WHAT} SPOTTED HER]'],
  [/lamp|searchlight/, '[THE {WHAT} FOUND HER]'],
  [/laser/, '[THE LASER CUT HER DOWN]'],
  [/camera/, '[THE {WHAT} SPOTTED HER]'],
  [/chandelier/, '[THE CHANDELIER SPOTTED HER]', '[THE CHANDELIER FELL ON HER]'],
  [/polisher/, '[THE POLISHER KNOCKED HER DOWN]'],
  [/crate/, '[THE CRATE FELL ON HER]'],
  [/cradle/, '[THE CRADLE CRUSHED HER]'],
  [/crush/, '[SOMETHING HEAVY CRUSHED HER]'],
  [/fall/, '[SHE FELL TOO FAR]'],
  [/ceiling/, '[THE CEILING FELL ON HER]'],
  [/creator/, '[THE CREATOR CUT HER DOWN]'],
  [/sensor/, '[A MOTION SENSOR CAUGHT HER MOVING]'],
  [/robot/, '[THE {WHAT} HEARD HER]', '[THE {WHAT} KNOCKED HER DOWN]'],
  [/slab|debris|rubble|glass|shard|stair|floor|beam|statue|crate/, '[THE HOUSE FELL IN ON HER]', '[THE HOUSE FELL IN ON HER]'],
  // anything else: a watcher saw her, or the house wore her down
  [/./, '[SOMETHING UP THERE SAW HER]', "[SHE DIDN'T GET UP]"]
];
export const DEATH_FALLBACK = '[SOMETHING UP THERE SAW HER]';
export function deathLine(id, direct) {
  const m = DEATH_SAID.find(([re]) => re.test(id || ''));
  if (!m) return DEATH_FALLBACK;
  return ((direct && m[2]) || m[1]).replace('{WHAT}', String(id).toUpperCase());
}

// People out in the city: rich, bored, a little proud of themselves. J talks to them (speech over
// their heads); bump is what they say when she walks into them, head when she lands on one.
export const MOON_PEOPLE = [
  { lines: ['Smile, sweetie! No, toward the light.', 'Is this the one where she cries?'], bump: 'Careful! This is silk.' },
  { lines: ["Don't touch her. It might be part of it.", "Relax, honey. It's just TV."], bump: 'She touched me!' },
  { lines: ['Our place is blurred on every map.', 'Cost a fortune. Worth every penny.'], bump: 'Excuse me!' },
  { lines: ['Look at her. Just like on TV.', 'My son does the aiming on Tuesdays.'], bump: 'Watch the phone!' },
  { lines: ['Are you lost? Staff use the back.', "Staff door's that way. Mind the cables."], bump: 'Watch it.' }
];
export const MOON_HEAD = ['Get off me!', 'Off! Off!', 'Somebody get her down!'];
