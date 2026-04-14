class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create() {
    const W = 320, H = 240;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0);

    this.add.text(W / 2, H / 2 - 20, 'YOU DIED', {
      fontSize: '18px', fontFamily: 'monospace', color: '#cc2222',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 10, 'Press R to restart', {
      fontSize: '7px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-R', () => {
      // Clear save and reset player state
      GameState.clearSave();
      GameState.player.totalExp = 0;
      GameState.player.level = 1;
      GameState.currentArea = 'village';
      GameState.equipment = { weapon: null, armor: null, accessory: null };
      GameState.inventory = new Array(20).fill(null);
      for (const sk of Object.keys(GameState.skills)) {
        GameState.skills[sk] = { level: 1, totalExp: 0 };
      }
      GameState.recalcStats();
      GameState.player.hp = GameState.player.maxHp;

      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
  }
}
