const DIALOG_UI_BASE = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/Ui/Dialog/';

class DialogScene extends Phaser.Scene {
  constructor() { super({ key: 'DialogScene' }); }

  init(data) {
    this.npcName   = data.name;
    this.spriteKey = data.spriteKey;
    this.lines     = data.dialog;
    this.lineIdx   = 0;
  }

  preload() {
    this.load.image('dialog-box', DIALOG_UI_BASE + 'DialogBoxFaceset.png');
  }

  create() {
    const W = 320, H = 240;

    // Semi-dim the game behind dialog (just a soft bottom strip)
    this.add.rectangle(0, H - 70, W, 70, 0x000000, 0.3).setOrigin(0);

    // Dialog box (300×58) centred horizontally, near bottom
    const bx = (W - 300) / 2, by = H - 63;
    this.add.image(bx, by, 'dialog-box').setOrigin(0);

    // NPC portrait in the faceset slot (approx 46×46 at x+3, y+6)
    const portrait = this.add.image(bx + 26, by + 30, this.spriteKey, 0);
    portrait.setScale(2.5);

    // Speaker name
    this.add.text(bx + 55, by + 5, this.npcName, {
      fontSize: '6px', fontFamily: 'monospace', color: '#4a2808', fontStyle: 'bold',
    });

    // Dialog text
    this.dialogText = this.add.text(bx + 55, by + 17, '', {
      fontSize: '7px', fontFamily: 'monospace', color: '#1a0a04',
      wordWrap: { width: 236 }, lineSpacing: 2,
    });

    // Advance indicator (blinking ▼)
    this.indicator = this.add.text(bx + 289, by + 51, '▼', {
      fontSize: '6px', fontFamily: 'monospace', color: '#8b4513',
    }).setOrigin(1, 1);

    this.tweens.add({
      targets: this.indicator, alpha: 0,
      duration: 450, yoyo: true, repeat: -1,
    });

    this._showLine();

    // Input — slight delay so the key press that opened dialog doesn't instantly close it
    this.time.delayedCall(150, () => {
      this.input.keyboard.on('keydown-E',     () => this._advance());
      this.input.keyboard.on('keydown-SPACE', () => this._advance());
      this.input.keyboard.on('keydown-ENTER', () => this._advance());
    });
  }

  _showLine() {
    this.dialogText.setText(this.lines[this.lineIdx]);
    // Show "last line" indicator differently
    if (this.lineIdx === this.lines.length - 1) {
      this.indicator.setText('■');
    }
  }

  _advance() {
    this.sound.play('sfx-accept', { volume: 0.3 });
    this.lineIdx++;
    if (this.lineIdx < this.lines.length) {
      this._showLine();
    } else {
      this.scene.stop();
      this.scene.resume('GameScene');
    }
  }
}
