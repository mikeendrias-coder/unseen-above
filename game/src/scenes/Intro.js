// Placeholder until the cinematic lands: go straight to episode 1.
export class Intro extends Phaser.Scene {
  constructor() { super('intro'); }
  create() { this.scene.start('grounds', { fromIntro: true }); }
}
