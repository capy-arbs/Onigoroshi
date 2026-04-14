// Auto-load save data before game starts
GameState.load();

const config = {
  type: Phaser.AUTO,
  width: 320,
  height: 240,
  zoom: 3,
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [GameScene, InventoryScene, CharacterScene, DialogScene, GameOverScene],
};

const game = new Phaser.Game(config);
