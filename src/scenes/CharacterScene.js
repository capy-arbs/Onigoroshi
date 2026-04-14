class CharacterScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterScene' }); }

  create() {
    showCharScreen();

    this.input.keyboard.on('keydown-C',   () => this._close());
    this.input.keyboard.on('keydown-ESC', () => this._close());
  }

  _close() {
    hideCharScreen();
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
