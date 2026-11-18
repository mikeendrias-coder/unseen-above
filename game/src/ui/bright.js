// Bright (Nov 18, for a washed-out projector): a CSS filter on the game's picture and the title's
// still (template.html body.bright) that lifts the dark scenes. One switch: the title row, the key
// under the game, the pause menu row. Saved in the settings; presenter mode turns it on (and puts
// it back when it goes off, core/review.js).
import { state } from '../core/state.js';

export const bright = () => !!state.settings.bright;
export function syncBright() { if (document.body) document.body.classList.toggle('bright', bright()); }
export function setBright(on) { state.set('bright', !!on); syncBright(); return bright(); }
