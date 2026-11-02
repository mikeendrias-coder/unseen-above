// The order of the whole game, in one place. A scene that finishes calls goNext(this, its step
// id); the next step starts if its scene is built. Parts not built yet end the build politely.
import { state } from './state.js';

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
export function goNext(scene, id) {
  const next = nextStep(scene, id);
  if (!next) return false;
  state.reach(next.id); // for Continue on the channel guide
  scene.scene.start(next.scene, Object.assign({}, next.data));
  return true;
}
