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
