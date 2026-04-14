class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create() {
    showGameOver();

    this.input.keyboard.once('keydown-R', () => {
      hideGameOver();

      // Penalty: lose inventory, lose slayer task, clear buffs
      // Keep: levels, XP, skills, equipment
      GameState.currentArea = 'village';
      GameState.inventory = new Array(20).fill(null);
      GameState.slayerTask = null;
      GameState.buffs = { attack: 0, defense: 0, hpRegen: 0, buffTimer: 0 };
      GameState.recalcStats();
      GameState.player.hp = GameState.player.maxHp;
      GameState.save();

      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
  }
}
