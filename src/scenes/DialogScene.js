class DialogScene extends Phaser.Scene {
  constructor() { super({ key: 'DialogScene' }); }

  init(data) {
    this.npcName   = data.name;
    this.lines     = data.dialog;
  }

  create() {
    showDialog(this.npcName, this.lines, () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });

    // Input — slight delay so the key press that opened dialog doesn't instantly close it
    this.time.delayedCall(150, () => {
      this.input.keyboard.on('keydown-E',     () => this._advance());
      this.input.keyboard.on('keydown-SPACE', () => this._advance());
      this.input.keyboard.on('keydown-ENTER', () => this._advance());
    });
  }

  _advance() {
    advanceDialog(this.npcName);
    if (!isDialogOpen()) {
      // Dialog closed itself via callback
    }
  }
}
