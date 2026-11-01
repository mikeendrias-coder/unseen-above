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
