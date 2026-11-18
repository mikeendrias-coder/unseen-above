// The endings (Nov 17, Claude's call, from research/design_pass_nov17.md section 2). Every one
// ends on the old TV in a dark room on Earth. The playroom picks one, in this order:
//   END IT ALL   the creator was beaten after giving up (story.killedBroken). No kids, no choice.
//   THE COUCH    she answers "Sit down." (secret: she spared the creator and found 5 "what" clues)
//   LOOK BACK    she answers "Turn it around." (5 "who" clues, or she spared the creator who gave up)
//   ROUND TWO    she answers "Yes."
//   THE VEST     everything else: "Who picks the lights?" Michael's own ending.
import { state } from '../core/state.js';

export const WHO_NEEDED = 5, WHAT_NEEDED = 5;

export const ENDINGS = [
  { id: 'vest', title: 'THE VEST', when: 'Default: she asks who picks the lights.' },
  { id: 'endall', title: 'END IT ALL', when: 'The creator gave up after six deaths, and she hit them nine times anyway.' },
  { id: 'round2', title: 'ROUND TWO', when: 'She answers "Yes." to round two.' },
  { id: 'lookback', title: 'LOOK BACK', when: 'She answers "Turn it around." (5 who-aims clues, or she spared the creator who gave up).' },
  { id: 'couch', title: 'THE COUCH', when: 'Secret. She answers "Sit down." (she spared the creator and found 5 what-she-is clues).' }
];
export const endingTitle = id => (ENDINGS.find(e => e.id === id) || ENDINGS[0]).title;
export const endingsSeen = () => ENDINGS.filter(e => state.story.endings[e.id]).length;

// The replies she can give at "Are you here for round two?". Story mode offers every one, so a
// walkthrough can reach every ending; so does a chapter link that asks for one (force: an ending id).
export const REPLIES = [
  { id: 'lights', text: 'Who picks the lights?', ending: 'vest' },
  { id: 'yes', text: 'Yes.', ending: 'round2' },
  { id: 'turn', text: 'Turn it around.', ending: 'lookback', open: s => state.clueCount('who') >= WHO_NEEDED || (s.spared && s.gaveUp) },
  { id: 'sit', text: 'Sit down.', ending: 'couch', open: s => s.spared && state.clueCount('what') >= WHAT_NEEDED }
];
export function replies(force) {
  const s = state.story;
  return REPLIES.filter(r => !r.open || state.immune || r.ending === force || r.open(s));
}
// no choice at all: the creator was beaten after giving up, and the playroom is empty
export const emptyRoom = () => !!state.story.killedBroken;
