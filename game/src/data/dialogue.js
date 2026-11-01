// All spoken lines live here, so rewriting dialogue never touches scene code.
// DRAFTS for Michael to rewrite. Cues: bro/sis set where each character faces or points.
export const RIDGE = [
  { who: 'SISTER', text: 'The lights are on.', sis: { look: 1 } },
  { who: 'BROTHER', text: 'Nobody has lights anymore.' },
  { who: 'SISTER', text: 'Somebody does.' },
  { who: 'BROTHER', text: 'Not one broken window. Not one.', bro: { point: 1 } },
  { who: 'SISTER', text: "That's what scares me. Places like that don't stay clean by accident.", sis: { face: -1 } },
  { who: 'BROTHER', text: 'Places like that have food. Medicine. Maybe a filter that still works.', bro: { face: -1 } },
  { who: 'SISTER', text: 'You said we stay away from the untouched ones.', sis: { face: -1 } },
  { who: 'BROTHER', text: 'Until we had no choice. We have no choice.', bro: { face: 1 } },
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
  { who: 'SISTER', text: 'We have the bag. We can stop the bleeding.' },
  { who: 'BROTHER', text: "I don't want to die." },
  { who: 'SISTER', text: "You won't. You always come back." },
  { who: 'BROTHER', text: "That's what I'm afraid of." },
  { who: 'SISTER', text: 'What does that mean?' },
  { who: null, text: '[COUGHING]' },
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
// DRAFT, for Michael: the third dialogue scene, in the kids' playroom. {look} is the look the
// player picked on the start screen, the way a kid would say it.
export const PLAYROOM = [
  { who: null, text: '[THE MUSIC STOPS]' },
  { who: 'KID', text: "You're the girl from channel seven." },
  { who: 'LITTLE KID', text: "She's smaller in real life." },
  { who: 'KID', text: 'Are you here for round two?' },
  { who: 'SISTER', text: 'Who picks the lights?' },
  { who: 'LITTLE KID', text: 'We do. I like {look}.' },
  { who: 'SISTER', text: 'My brother died in {look}.' },
  { who: 'KID', text: 'He comes back. They always come back.' },
  { who: 'SISTER', text: 'I know.' },
  { who: null, text: '[CLICK. CLICK.]' }
];
export const LOOK_SAID = { A: 'the gold one', B: 'the white one', C: 'the dark one', D: 'the green one', E: 'the black and white one' };

// DRAFT, for Michael: the hallway behind the Moon city, where the creator of the show waits.
// The creator built every set, trap and camera, resets the props between takes, and is owned
// like everyone else. They toss her a sword because the kids voted for a fight. Lines are short
// on purpose: they run as captions during the fight. Marked choices for Michael:
//   * "two clicks ... the only kind thing I was allowed to build" ties the cameras' warning to
//     the two clicks on her chest at the end. Cut it if that says too much about the vest.
//   * "The kids aim it" says outright who aims the satellite in the batches.
//   * The ending of the fight (the creator yields and lets her pass) is a placeholder.
// Walking in: the creator talks while she comes down the hallway.
export const HALL_IN = [
  { who: 'CREATOR', text: 'There you are. Mind the cables. Those are mine too.' },
  { who: 'CREATOR', text: 'Every room you walked through, I built. The lights. The lasers. The cameras that click.' },
  { who: 'CREATOR', text: 'I keep the front of the house perfect. Nobody up here pays to watch the back.' },
  { who: 'CREATOR', text: 'I put the glasses back in the drawer after every take. Forty-one seasons.' }
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
  ['The gallery. I put the laser where the money is.', 'They loved that.'],
  ['Lights off. My cameras click twice before they flash.', 'A warning. The only kind thing I was allowed to build.']
];
// Each time she lands a hit, in order.
export const HALL_HIT = [
  'Good. They can see that from the cheap seats.',
  'Do you know what they call this up here? Content.',
  'Being seen is the one thing they cannot buy. So they buy it from us.',
  'I have never been on screen. Not once. I am the reason you are.',
  'They did not build any of this. They bought the Moon, then they bought us.',
  'The satellite is not mine. The kids aim it. They think it is a puzzle.',
  'You want the point of it all? So they never have to look at anything real.',
  'They are watching me lose. It is the first time anyone has watched me at all.',
  'Enough. That is enough.'
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
