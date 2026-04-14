const ENEMY_BASE = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/Actor/Monster/';
const ITEM_BASE  = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/Items/';
const ENEMY_FRAME_DURATION = 1000 / 5;
const DROP_PICKUP_DIST = 12;
const DROP_DESPAWN_MS  = 30000;

// ── Item definitions ─────────────────────────────────────────────────────────
// Items with a `slot` property are equippable; `stats` defines their bonuses.
const ITEM_DEFS = {
  'slime-gel':      { name: 'Slime Gel',      key: 'slime-gel',      path: ITEM_BASE + 'Resource/GemGreen.png' },
  'bone':           { name: 'Bone',           key: 'bone',           path: ITEM_BASE + 'Weapons/Bone/Sprite.png' },
  'spirit-essence': { name: 'Spirit Essence', key: 'spirit-essence', path: ITEM_BASE + 'Resource/GemPurple.png' },
  'gold-coin':      { name: 'Gold Coin',      key: 'gold-coin',      path: ITEM_BASE + 'Treasure/GoldCoin.png' },
  'red-gem':        { name: 'Red Gem',        key: 'red-gem',        path: ITEM_BASE + 'Resource/GemRed.png' },
  'life-potion':    { name: 'Life Potion',    key: 'life-potion',    path: ITEM_BASE + 'Potion/LifePot.png' },
  // Equipment
  'rusty-sword':    { name: 'Rusty Sword',    key: 'rusty-sword',    path: ITEM_BASE + 'Weapons/Sword/Sprite.png',
                      slot: 'weapon',  stats: { attack: 5 } },
  'katana':         { name: 'Katana',         key: 'katana',         path: ITEM_BASE + 'Weapons/Katana/Sprite.png',
                      slot: 'weapon',  stats: { attack: 10 } },
  'iron-shield':    { name: 'Iron Shield',    key: 'iron-shield',    path: ITEM_BASE + 'Resource/BarIron.png',
                      slot: 'armor',   stats: { defense: 5 } },
  'spirit-ward':    { name: 'Spirit Ward',    key: 'spirit-ward',    path: ITEM_BASE + 'Scroll/ScrollRock.png',
                      slot: 'armor',   stats: { defense: 3, maxHp: 20 } },
  'gold-ring':      { name: 'Gold Ring',      key: 'gold-ring',      path: ITEM_BASE + 'Resource/GemYellow.png',
                      slot: 'accessory', stats: { attack: 2, defense: 2 } },
  // Dropped weapons
  'stick':          { name: 'Stick',          key: 'stick',          path: ITEM_BASE + 'Weapons/Stick/Sprite.png',
                      slot: 'weapon', stats: { attack: 1 } },
  'club':           { name: 'Club',           key: 'club',           path: ITEM_BASE + 'Weapons/Club/Sprite.png',
                      slot: 'weapon', stats: { attack: 2 } },
  'sai':            { name: 'Sai',            key: 'sai',            path: ITEM_BASE + 'Weapons/Sai/Sprite.png',
                      slot: 'weapon', stats: { attack: 6 } },
  'rapier':         { name: 'Rapier',         key: 'rapier',         path: ITEM_BASE + 'Weapons/Rapier/Sprite.png',
                      slot: 'weapon', stats: { attack: 7 } },
  'nunchaku':       { name: 'Nunchaku',       key: 'nunchaku',       path: ITEM_BASE + 'Weapons/Ninjaku/Sprite.png',
                      slot: 'weapon', stats: { attack: 12 } },
  'lance':          { name: 'Lance',          key: 'lance',          path: ITEM_BASE + 'Weapons/Lance/Sprite.png',
                      slot: 'weapon', stats: { attack: 14 } },
  // Fish (raw)
  'raw-shrimp':     { name: 'Raw Shrimp',     key: 'raw-shrimp',     path: ITEM_BASE + 'Food/Shrimp.png' },
  'raw-fish':       { name: 'Raw Fish',        key: 'raw-fish',       path: ITEM_BASE + 'Food/Fish.png' },
  'raw-octopus':    { name: 'Raw Octopus',     key: 'raw-octopus',    path: ITEM_BASE + 'Food/Octopus.png' },
  'raw-calamari':   { name: 'Raw Calamari',    key: 'raw-calamari',   path: ITEM_BASE + 'Food/Calamari.png' },
  // Fish (cooked) — consumable
  'cooked-shrimp':  { name: 'Cooked Shrimp',   key: 'cooked-shrimp',  path: ITEM_BASE + 'Food/Sushi.png',
                      consumable: true, healAmount: 15 },
  'cooked-fish':    { name: 'Cooked Fish',      key: 'cooked-fish',    path: ITEM_BASE + 'Food/Sushi2.png',
                      consumable: true, healAmount: 30 },
  'cooked-octopus': { name: 'Cooked Octopus',   key: 'cooked-octopus', path: ITEM_BASE + 'Food/Yakitori.png',
                      consumable: true, healAmount: 50 },
  'cooked-calamari':{ name: 'Cooked Calamari',  key: 'cooked-calamari',path: ITEM_BASE + 'Food/Onigiri.png',
                      consumable: true, healAmount: 80 },
  // Ores
  'ore-copper':     { name: 'Copper Ore',      key: 'ore-copper',     path: ITEM_BASE + 'Resource/BarCopper.png' },
  'ore-iron':       { name: 'Iron Ore',        key: 'ore-iron',       path: ITEM_BASE + 'Resource/BarIron.png' },
  'ore-silver':     { name: 'Silver Ore',      key: 'ore-silver',     path: ITEM_BASE + 'Resource/BarSilver.png' },
  'ore-gold':       { name: 'Gold Ore',        key: 'ore-gold',       path: ITEM_BASE + 'Resource/BarGold.png' },
  // Smithed equipment
  'copper-sword':   { name: 'Copper Sword',    key: 'copper-sword',   path: ITEM_BASE + 'Weapons/Sword2/Sprite.png',
                      slot: 'weapon', stats: { attack: 3 } },
  'iron-sword':     { name: 'Iron Sword',      key: 'iron-sword',     path: ITEM_BASE + 'Weapons/BigSword/Sprite.png',
                      slot: 'weapon', stats: { attack: 8 } },
  'copper-armor':   { name: 'Copper Armor',    key: 'copper-armor',   path: ITEM_BASE + 'Resource/BarCopper.png',
                      slot: 'armor', stats: { defense: 4 } },
  'iron-armor':     { name: 'Iron Armor',      key: 'iron-armor',     path: ITEM_BASE + 'Resource/BarMithril.png',
                      slot: 'armor', stats: { defense: 8 } },
  'silver-ring':    { name: 'Silver Ring',     key: 'silver-ring',    path: ITEM_BASE + 'Treasure/SilverCoin.png',
                      slot: 'accessory', stats: { attack: 3, defense: 3 } },
  'silver-sword':   { name: 'Silver Sword',    key: 'silver-sword',   path: ITEM_BASE + 'Weapons/Rapier/Sprite.png',
                      slot: 'weapon', stats: { attack: 16 } },
  'magic-wand':     { name: 'Magic Wand',     key: 'magic-wand',     path: ITEM_BASE + 'Weapons/MagicWand/Sprite.png',
                      slot: 'weapon', stats: { attack: 20 } },
  'silver-armor':   { name: 'Silver Armor',   key: 'silver-armor',   path: ITEM_BASE + 'Resource/BarSilver.png',
                      slot: 'armor', stats: { defense: 12, maxHp: 15 } },
  'gold-armor':     { name: 'Gold Armor',     key: 'gold-armor',     path: ITEM_BASE + 'Resource/BarGold.png',
                      slot: 'armor', stats: { defense: 16, maxHp: 30 } },
  'gold-necklace':  { name: 'Gold Necklace',   key: 'gold-necklace',  path: ITEM_BASE + 'Treasure/GoldCup.png',
                      slot: 'accessory', stats: { attack: 5, defense: 5, maxHp: 30 } },
  // Herbalism potions (consumable)
  'focus-tonic':    { name: 'Focus Tonic',     key: 'focus-tonic',    path: ITEM_BASE + 'Potion/WaterPot.png',
                      consumable: true, buff: 'attack', buffAmount: 8, buffDuration: 30000 },
  'resolve-salve':  { name: 'Resolve Salve',   key: 'resolve-salve',  path: ITEM_BASE + 'Potion/MilkPot.png',
                      consumable: true, buff: 'defense', buffAmount: 8, buffDuration: 30000 },
  'harmony-tea':    { name: 'Harmony Tea',     key: 'harmony-tea',    path: ITEM_BASE + 'Potion/EmptyPot.png',
                      consumable: true, healAmount: 60 },
  'oni-elixir':     { name: 'Oni Elixir',      key: 'oni-elixir',     path: ITEM_BASE + 'Potion/LifePot.png',
                      consumable: true, buff: 'attack', buffAmount: 15, buffDuration: 45000 },
  // Crafting materials
  'feather':        { name: 'Feather',         key: 'feather',        path: ITEM_BASE + 'Resource/feather.png' },
  // Crafted accessories
  'bone-charm':     { name: 'Bone Charm',      key: 'bone-charm',     path: ITEM_BASE + 'Treasure/SilverKey.png',
                      slot: 'accessory', stats: { attack: 1, defense: 1, maxHp: 10 } },
  'demon-amulet':   { name: 'Demon Amulet',    key: 'demon-amulet',   path: ITEM_BASE + 'Treasure/GoldKey.png',
                      slot: 'accessory', stats: { attack: 4, defense: 4, maxHp: 20 } },
  'spirit-talisman':{ name: 'Spirit Talisman', key: 'spirit-talisman',path: ITEM_BASE + 'Scroll/ScrollThunder.png',
                      slot: 'accessory', stats: { attack: 7, defense: 7, maxHp: 40 } },
  // Thieving
  'silver-coin':    { name: 'Silver Coin',     key: 'silver-coin',    path: ITEM_BASE + 'Treasure/SilverCoin.png' },
};

// ── Drop tables (item key + % chance) ────────────────────────────────────────
const DROP_TABLES = {
  slime:  [
    { item: 'slime-gel',    chance: 0.75 },
    { item: 'gold-coin',    chance: 0.30 },
    { item: 'stick',        chance: 0.20 },
    { item: 'gold-ring',    chance: 0.05 },
  ],
  skull:  [
    { item: 'bone',         chance: 0.70 },
    { item: 'gold-coin',    chance: 0.35 },
    { item: 'red-gem',      chance: 0.10 },
    { item: 'club',         chance: 0.18 },
    { item: 'rusty-sword',  chance: 0.15 },
    { item: 'rapier',       chance: 0.06 },
    { item: 'nunchaku',     chance: 0.03 },
    { item: 'iron-shield',  chance: 0.12 },
  ],
  spirit: [
    { item: 'spirit-essence', chance: 0.70 },
    { item: 'gold-coin',      chance: 0.30 },
    { item: 'life-potion',    chance: 0.12 },
    { item: 'sai',             chance: 0.10 },
    { item: 'katana',         chance: 0.06 },
    { item: 'lance',          chance: 0.03 },
    { item: 'feather',        chance: 0.25 },
    { item: 'spirit-ward',    chance: 0.08 },
    { item: 'gold-ring',      chance: 0.05 },
  ],
};

// ── Definitions ───────────────────────────────────────────────────────────────
const ENEMY_TYPES = {
  slime: {
    key:        'slime',
    spritePath: ENEMY_BASE + 'Slime/Slime.png',
    hp: 30,  speed: 30,  damage: 10, exp: 20,
    aggroRange: 65, leashRange: 100,
  },
  skull: {
    key:        'skull',
    spritePath: ENEMY_BASE + 'Skull/SpriteSheet.png',
    hp: 50,  speed: 45,  damage: 20, exp: 35,
    aggroRange: 75, leashRange: 110,
  },
  spirit: {
    key:        'spirit',
    spritePath: ENEMY_BASE + 'Spirit/SpriteSheet.png',
    hp: 40,  speed: 55,  damage: 15, exp: 30,
    aggroRange: 85, leashRange: 120,
  },
};

// Where each enemy spawns (keep away from player start at 160,120 and NPCs)
const ENEMY_SPAWNS = [
  { type: 'slime',  x: 45,  y: 175 },
  { type: 'slime',  x: 275, y: 165 },
  { type: 'skull',  x: 95,  y: 210 },
  { type: 'skull',  x: 285, y: 50  },
  { type: 'spirit', x: 250, y: 45  },
];

// ── Enemy class ───────────────────────────────────────────────────────────────
class Enemy {
  constructor(scene, type, x, y) {
    this.scene  = scene;
    this.def    = ENEMY_TYPES[type];
    this.hp     = this.def.hp;
    this.state  = 'idle'; // idle | chase | hurt | dead

    // Remember spawn point for respawning
    this.spawnX = x;
    this.spawnY = y;

    this.sprite = scene.physics.add.sprite(x, y, this.def.key, IDLE_FRAME.down);
    this.sprite.setCollideWorldBounds(true);

    this.dir        = 'down';
    this.animFrame  = 0;
    this.animTimer  = 0;

    // Wander state (when idle)
    this.isWalking   = false;
    this.wanderTimer = Phaser.Math.Between(600, 2500);

    // Hurt state
    this.hurtTimer   = 0;

    // HP bar (drawn each frame via graphics, only visible after first hit)
    this.hpBarBg = scene.add.graphics();
    this.hpBarFg = scene.add.graphics();
    this.showHPBar = false;
  }

  // ── Public ──────────────────────────────────────────────────────────────────
  takeDamage(amount) {
    if (this.state === 'dead') return;
    this.hp -= amount;
    this.showHPBar = true;
    this.sprite.setTint(0xff6666);

    if (this.hp <= 0) {
      this._die();
      return;
    }

    this.state     = 'hurt';
    this.hurtTimer = 280;
    // Brief knockback in opposite direction of player will be set by GameScene
  }

  update(delta, playerX, playerY) {
    if (this.state === 'dead') return;

    this._drawHPBar();

    // ── Hurt cooldown ────────────────────────────────────────────────
    if (this.state === 'hurt') {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.state = 'chase';
        this.sprite.clearTint();
      }
      return;
    }

    // ── Aggro check ──────────────────────────────────────────────────
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);
    if (dist < this.def.aggroRange) {
      this.state = 'chase';
    } else if (dist > this.def.leashRange && this.state === 'chase') {
      this.state = 'idle';
    }

    if (this.state === 'chase') {
      this._updateChase(delta, playerX, playerY);
    } else {
      this._updateIdle(delta);
    }
  }

  isAlive() { return this.state !== 'dead'; }

  destroy() {
    this.sprite.destroy();
    this.hpBarBg.destroy();
    this.hpBarFg.destroy();
  }

  // ── Private ─────────────────────────────────────────────────────────────────
  _updateChase(delta, playerX, playerY) {
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerX, playerY);
    const spd   = this.def.speed;
    const vx    = Math.cos(angle) * spd;
    const vy    = Math.sin(angle) * spd;
    this.sprite.setVelocity(vx, vy);

    // Facing direction
    if (Math.abs(vx) > Math.abs(vy)) {
      this.dir = vx > 0 ? 'right' : 'left';
    } else {
      this.dir = vy > 0 ? 'down' : 'up';
    }

    this.animTimer += delta;
    if (this.animTimer >= ENEMY_FRAME_DURATION) {
      this.animTimer -= ENEMY_FRAME_DURATION;
      this.animFrame  = (this.animFrame + 1) % 4;
    }
    this.sprite.setFrame(WALK_FRAMES[this.dir][this.animFrame]);
  }

  _updateIdle(delta) {
    this.wanderTimer -= delta;

    if (this.wanderTimer <= 0) {
      this.isWalking = !this.isWalking;
      if (this.isWalking) {
        const dirs    = ['up', 'down', 'left', 'right'];
        this.dir      = dirs[Phaser.Math.Between(0, 3)];
        this.wanderTimer = Phaser.Math.Between(500, 1200);
      } else {
        this.sprite.setVelocity(0);
        this.wanderTimer = Phaser.Math.Between(800, 2200);
      }
    }

    if (this.isWalking) {
      const s  = this.def.speed * 0.5;
      const vx = this.dir === 'left' ? -s : this.dir === 'right' ? s : 0;
      const vy = this.dir === 'up'   ? -s : this.dir === 'down'  ? s : 0;
      this.sprite.setVelocity(vx, vy);

      this.animTimer += delta;
      if (this.animTimer >= ENEMY_FRAME_DURATION) {
        this.animTimer -= ENEMY_FRAME_DURATION;
        this.animFrame  = (this.animFrame + 1) % 4;
      }
      this.sprite.setFrame(WALK_FRAMES[this.dir][this.animFrame]);
    } else {
      this.sprite.setVelocity(0);
      this.sprite.setFrame(IDLE_FRAME[this.dir]);
    }
  }

  _die() {
    this.state = 'dead';
    this.sprite.setVelocity(0);
    this.hpBarBg.clear();
    this.hpBarFg.clear();

    // Award exp
    GameState.player.totalExp += this.def.exp;
    this.scene.sound.play('sfx-kill', { volume: 0.45 });

    // Slayer task tracking
    onEnemyKilled(this.scene, this.def.key);

    // Roll drops
    this._rollDrops();

    // Fade out, then respawn after 15 seconds
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0, duration: 350,
      onComplete: () => {
        this.sprite.setVisible(false);
        this.sprite.body.enable = false;

        this.scene.time.delayedCall(15000, () => {
          this._respawn();
        });
      },
    });
  }

  _respawn() {
    this.hp         = this.def.hp;
    this.state      = 'idle';
    this.showHPBar  = false;
    this.isWalking  = false;
    this.wanderTimer = Phaser.Math.Between(600, 2500);

    this.sprite.setPosition(this.spawnX, this.spawnY);
    this.sprite.setAlpha(0);
    this.sprite.setVisible(true);
    this.sprite.body.enable = true;
    this.sprite.clearTint();
    this.sprite.setFrame(IDLE_FRAME.down);

    // Fade back in
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1, duration: 500,
    });
  }

  _rollDrops() {
    const table = DROP_TABLES[this.def.key];
    if (!table) return;

    let offsetIdx = 0;
    table.forEach(entry => {
      if (Math.random() < entry.chance) {
        const def = ITEM_DEFS[entry.item];
        // Scatter drops slightly so they don't stack exactly
        const ox = (offsetIdx % 3 - 1) * 8;
        const oy = Math.floor(offsetIdx / 3) * 8;
        if (this.scene.groundItems) {
          this.scene.groundItems.push(
            new GroundItem(this.scene, def, this.sprite.x + ox, this.sprite.y + oy)
          );
        }
        offsetIdx++;
      }
    });
  }

  _drawHPBar() {
    if (!this.showHPBar) return;
    const bw = 16, bh = 2;
    const bx = this.sprite.x - 8, by = this.sprite.y - 12;

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x440000);
    this.hpBarBg.fillRect(bx, by, bw, bh);

    this.hpBarFg.clear();
    this.hpBarFg.fillStyle(0xcc2222);
    this.hpBarFg.fillRect(bx, by, Math.max(0, (this.hp / this.def.hp) * bw), bh);
  }
}

// ── Ground Item (dropped loot) ───────────────────────────────────────────────
class GroundItem {
  constructor(scene, itemDef, x, y) {
    this.scene   = scene;
    this.itemDef = itemDef;
    this.picked  = false;

    this.sprite = scene.add.image(x, y, itemDef.key).setDepth(0.5);

    // Small bounce-in effect
    this.sprite.setAlpha(0);
    this.sprite.setScale(0.5);
    scene.tweens.add({
      targets: this.sprite,
      alpha: 1, scale: 1,
      duration: 300, ease: 'Back.easeOut',
    });

    // Despawn timer
    this.despawnTimer = scene.time.delayedCall(DROP_DESPAWN_MS, () => {
      this._fadeAndRemove();
    });
  }

  update(playerX, playerY) {
    if (this.picked) return false;

    const d = Phaser.Math.Distance.Between(playerX, playerY, this.sprite.x, this.sprite.y);
    if (d < DROP_PICKUP_DIST) {
      this._pickup();
      return true;
    }
    return false;
  }

  _pickup() {
    this.picked = true;
    this.despawnTimer.remove(false);
    this.scene.sound.play('sfx-pickup', { volume: 0.4 });

    // Add to inventory
    const inv = GameState.inventory;
    const isEquipment = !!this.itemDef.slot;

    // Equipment items don't stack
    if (!isEquipment) {
      const existing = inv.find(s => s && s.name === this.itemDef.name);
      if (existing) { existing.qty += 1; }
      else {
        const slot = inv.findIndex(s => s === null);
        if (slot !== -1) inv[slot] = { name: this.itemDef.name, key: this.itemDef.key, qty: 1 };
      }
    } else {
      const slot = inv.findIndex(s => s === null);
      if (slot !== -1) {
        inv[slot] = {
          name: this.itemDef.name, key: this.itemDef.key, qty: 1,
          slot: this.itemDef.slot, stats: { ...this.itemDef.stats },
        };
      }
    }

    // Float pickup text (DOM)
    domFloat(this.sprite.x, this.sprite.y - 6, this.itemDef.name, '#ffffff');

    this.sprite.destroy();
  }

  _fadeAndRemove() {
    if (this.picked) return;
    this.picked = true;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0, duration: 500,
      onComplete: () => this.sprite.destroy(),
    });
  }
}
