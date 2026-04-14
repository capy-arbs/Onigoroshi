const NPC_BASE = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/Actor/Character/';
const NPC_FRAME_DURATION = 1000 / 5; // NPCs walk a little slower than the player
const NPC_SPEED = 25;
const INTERACT_DIST = 20;

const NPC_DEFS = [
  {
    key: 'villager',
    spritePath: NPC_BASE + 'Villager/SeparateAnim/Walk.png',
    x: 70, y: 65,
    name: 'Villager',
    dialog: [
      "Traveler! Have you heard the news?",
      "Strange shadows spotted near the old shrine at night...",
      "Whatever you do, don't go there alone.",
    ],
    wander: true,
  },
  {
    key: 'oldman',
    spritePath: NPC_BASE + 'OldMan/SeparateAnim/Walk.png',
    x: 230, y: 85,
    name: 'Elder Hiroshi',
    dialog: [
      "Ahh... a young samurai.",
      "The demon Onigoroshi grows restless once more.",
      "The blade alone is not enough.",
      "You must sharpen your spirit as well.",
    ],
    wander: false,
  },
  {
    key: 'princess',
    spritePath: NPC_BASE + 'Princess/SeparateAnim/Walk.png',
    x: 150, y: 185,
    name: 'Princess Yuki',
    dialog: [
      "Please, brave one — you must help us!",
      "The demon has taken villagers to its lair in the mountains.",
      "You are our only hope.",
    ],
    wander: true,
  },
  {
    key: 'slayermaster',
    spritePath: NPC_BASE + 'NinjaDark/SeparateAnim/Walk.png',
    x: 160, y: 120,
    name: 'Demon Hunter Kenji',
    dialog: [],  // handled specially in GameScene
    wander: false,
    isSlayerMaster: true,
  },
  {
    key: 'merchant',
    spritePath: NPC_BASE + 'Monk/SeparateAnim/Walk.png',
    x: 200, y: 100,
    name: 'Merchant Tanaka',
    dialog: [],
    wander: false,
    isShop: true,
  },
];

// ── NPC class ─────────────────────────────────────────────────────────────────
class NPC {
  constructor(scene, def) {
    this.scene = scene;
    this.def   = def;

    this.sprite = scene.physics.add.sprite(def.x, def.y, def.key + '-walk', 0);
    this.sprite.setCollideWorldBounds(true);

    this.dir       = 'down';
    this.animFrame = 0;
    this.animTimer = 0;

    // Wander state — start with a random idle delay so NPCs don't all move together
    this.isWalking   = false;
    this.wanderTimer = Phaser.Math.Between(500, 2500);

    // Interaction prompt (DOM-based)
    this.promptText = def.isSlayerMaster ? '[E] Talk' : def.isShop ? '[E] Shop' : '[E] Talk  [T] Pickpocket';
    this.promptId = 'npc-' + def.key + '-' + def.x;
    this.promptVisible = false;
  }

  update(delta, playerX, playerY) {
    // Show/hide interaction prompt (DOM) based on player proximity
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.sprite.x, this.sprite.y);
    if (dist < INTERACT_DIST) {
      showWorldPrompt(this.promptId, this.sprite.x, this.sprite.y, this.promptText);
      this.promptVisible = true;
    } else if (this.promptVisible) {
      hideWorldPrompt(this.promptId);
      this.promptVisible = false;
    }

    if (!this.def.wander) {
      this.sprite.setTexture(this.def.key + '-walk', IDLE_FRAME[this.dir]);
      return;
    }

    // ── Wander AI ─────────────────────────────────────────────────────
    this.wanderTimer -= delta;

    if (this.wanderTimer <= 0) {
      this.isWalking = !this.isWalking;

      if (this.isWalking) {
        const dirs    = ['up', 'down', 'left', 'right'];
        this.dir      = dirs[Phaser.Math.Between(0, 3)];
        this.wanderTimer = Phaser.Math.Between(600, 1400);
      } else {
        this.sprite.setVelocity(0);
        this.wanderTimer = Phaser.Math.Between(1200, 3000);
      }
    }

    if (this.isWalking) {
      const vx = this.dir === 'left' ? -NPC_SPEED : this.dir === 'right' ? NPC_SPEED : 0;
      const vy = this.dir === 'up'   ? -NPC_SPEED : this.dir === 'down'  ? NPC_SPEED : 0;
      this.sprite.setVelocity(vx, vy);

      this.animTimer += delta;
      if (this.animTimer >= NPC_FRAME_DURATION) {
        this.animTimer -= NPC_FRAME_DURATION;
        this.animFrame  = (this.animFrame + 1) % 4;
      }
      this.sprite.setTexture(this.def.key + '-walk', WALK_FRAMES[this.dir][this.animFrame]);
    } else {
      this.sprite.setVelocity(0);
      this.animFrame = 0;
      this.animTimer = 0;
      this.sprite.setTexture(this.def.key + '-walk', IDLE_FRAME[this.dir]);
    }
  }

  destroy() {
    this.sprite.destroy();
    hideWorldPrompt(this.promptId);
  }
}
