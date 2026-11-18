// Clues for the endings (Nov 17, research/design_pass_nov17.md section 2). A clue is found when she
// uses (J) a look tagged with { clue: 'id' }. Two groups: who aims the satellite, and what she is.
// Found clues stay found across takes and episodes; a new game clears them.
export const CLUES = {
  // who aims
  statue07: 'who', request1: 'who', cameraMoon: 'who', laserTone: 'who', routeMap: 'who',
  request4: 'who', operator: 'who', tuesday: 'who', console: 'who',
  // what she is
  footprints: 'what', drawer: 'what', oldBody: 'what', bagNote: 'what', lostGlasses: 'what',
  continuity: 'what', shelf: 'what', ownBody: 'what'
};
export const clueGroup = id => CLUES[id] || null;
