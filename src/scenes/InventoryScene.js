class InventoryScene extends Phaser.Scene {
  constructor() { super({ key: 'InventoryScene' }); }

  create() {
    showInvScreen((sfx) => {
      this.sound.play(sfx, { volume: 0.4 });
    });

    this.input.keyboard.on('keydown-I',   () => this._close());
    this.input.keyboard.on('keydown-ESC', () => this._close());
  }

  _close() {
    hideInvScreen();
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
