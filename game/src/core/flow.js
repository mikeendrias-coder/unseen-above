// The order of the whole game, in one place. A scene that finishes calls goNext(this, its step
// id); the next step starts if its scene is built. Parts not built yet end the build politely.
import { state } from './state.js';
import { results } from './results.js';

export const STEPS = [
  { id: 'intro', scene: 'intro', data: {}, label: 'The opening' },
  { id: 'ep1', scene: 'grounds', data: { fromIntro: true }, label: 'Episode 1 · The Grounds' },
  { id: 'batch1', scene: 'satellite', data: { batch: 1 }, label: 'Satellite · Batch 1' },
  { id: 'ep2', scene: 'gallery', data: { fromCut: true }, label: 'Episode 2 · The Gallery' },
  { id: 'batch2', scene: 'satellite', data: { batch: 2 }, label: 'Satellite · Batch 2' },
  { id: 'ep3', scene: 'fall', data: { fromCut: true }, label: 'Episode 3 · The East Wing' },      // the side-view fall that breaks the glasses
  { id: 'ep3b', scene: 'eastwing', data: { fromFall: true }, label: 'Episode 3 · After the fall' }, // then the east wing, top-down
  { id: 'batch3', scene: 'satellite', data: { batch: 3 }, label: 'Satellite · Batch 3' },
  { id: 'ep4', scene: 'bedroom', data: { fromCut: true }, label: 'Episode 4 · The Bedroom' },
  { id: 'batch4', scene: 'satellite', data: { batch: 4 }, label: 'Satellite · Batch 4' },
  { id: 'kids', scene: 'kids', data: { inFlow: true }, label: "The kids' room" },     // the kids finish the same round, on the Moon
  { id: 'ep5', scene: 'moon', data: { fromCut: true }, label: 'Episode 5 · The Moon' },        // the Moon city, to a staff door
  { id: 'ep5b', scene: 'hallway', data: {}, label: 'Episode 5 · Backstage' },                  // backstage: the creator, the fight
  { id: 'ep5c', scene: 'moon', data: { at: 'playroom' }, label: 'Episode 5 · The playroom' }      // the playroom and the end
];

const built = (scene, key) => !!(scene.scene.manager.keys && scene.scene.manager.keys[key]);

// The step after this one, if its scene exists in this build; otherwise null.
export function nextStep(scene, id) {
  const i = STEPS.findIndex(s => s.id === id), next = STEPS[i + 1];
  return next && built(scene, next.scene) ? next : null;
}

// Start the step after this one. Returns false when the next part is not built yet.
// The end of an episode shows its report first (core/results.js), then starts the next step.
export function goNext(scene, id) {
  const next = nextStep(scene, id);
  if (!next) return false;
  state.reach(next.id); // for Continue on the channel guide
  const go = () => scene.scene.start(next.scene, Object.assign({}, next.data));
  if (results.endsEpisode(id)) results.report(scene, go); else go();
  return true;
}

// ---- Which step a scene is (presenter resume, B's previous chapter). A side room has none.
const KEY_STEP = { intro: 'intro', grounds: 'ep1', gallery: 'ep2', fall: 'ep3', eastwing: 'ep3b', bedroom: 'ep4', kids: 'kids', hallway: 'ep5b' };
export function stepOf(sc) {
  if (!sc || !sc.sys || !sc.sys.settings) return null;
  const key = sc.sys.settings.key, d = sc.sys.settings.data || {};
  if (key === 'satellite') return 'batch' + (sc.batch || d.batch || 1);
  if (key === 'moon') return d.at === 'playroom' ? 'ep5c' : 'ep5';
  return KEY_STEP[key] || null;
}
// B at the start of a part: the part before it in STEPS, from its beginning, the way the number
// keys and Chapters start one (main.js goStep, handed in with setJumper). The opening has none.
let jumper = null;
export function setJumper(fn) { jumper = fn; }
export function prevStepOf(sc) { const i = STEPS.findIndex(s => s.id === stepOf(sc)); return i > 0 ? STEPS[i - 1] : null; }
export function prevChapter(sc) {
  const prev = prevStepOf(sc); if (!prev || !jumper) return false;
  // after this frame: the jump stops every scene, this one included
  setTimeout(() => jumper({ step: prev.id }), 0);
  return true;
}
