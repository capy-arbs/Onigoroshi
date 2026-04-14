const SKILL_BASE = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/';

// ── Fishing ──────────────────────────────────────────────────────────────────
const FISH_CATCH_RADIUS = 22;
const FISH_CAST_TIME    = 2000; // ms to wait for a bite
const FISH_XP           = 12;

const FISH_TABLE = [
  { name: 'Raw Shrimp',   key: 'raw-shrimp',   levelReq: 1,  xp: 10,  weight: 40 },
  { name: 'Raw Fish',     key: 'raw-fish',      levelReq: 5,  xp: 18,  weight: 35 },
  { name: 'Raw Octopus',  key: 'raw-octopus',   levelReq: 10, xp: 30,  weight: 20 },
  { name: 'Raw Calamari', key: 'raw-calamari',   levelReq: 20, xp: 50,  weight: 5  },
];

class FishingSpot {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // Animated water ripple
    this.sprite = scene.add.sprite(x, y, 'water-ripple', 0).setDepth(0.2);
    if (!scene.anims.exists('water-ripple-anim')) {
      scene.anims.create({
        key: 'water-ripple-anim',
        frames: scene.anims.generateFrameNumbers('water-ripple', { start: 0, end: 3 }),
        frameRate: 4, repeat: -1,
      });
    }
    this.sprite.play('water-ripple-anim');

    this.prompt = scene.add.text(x, y - 12, '[E] Fish', {
      fontSize: '5px', fontFamily: 'monospace', color: '#88ccff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false).setDepth(50);

    this.isFishing = false;
    this.fishTimer = 0;
  }

  update(delta, playerX, playerY, ePressed) {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < FISH_CATCH_RADIUS;

    this.prompt.setVisible(nearby && !this.isFishing);

    if (this.isFishing) {
      this.fishTimer -= delta;
      if (this.fishTimer <= 0) {
        this._catchFish();
      }
      return;
    }

    if (nearby && ePressed) {
      this._startFishing();
    }
  }

  _startFishing() {
    this.isFishing = true;
    this.fishTimer = FISH_CAST_TIME + Phaser.Math.Between(-500, 500);

    this._floatText('Fishing...', '#88ccff');
  }

  _catchFish() {
    this.isFishing = false;
    const fishLevel = GameState.skills.fishing.level;

    // Pick a random fish the player can catch
    const available = FISH_TABLE.filter(f => fishLevel >= f.levelReq);
    const totalWeight = available.reduce((s, f) => s + f.weight, 0);
    let roll = Math.random() * totalWeight;
    let caught = available[0];
    for (const f of available) {
      roll -= f.weight;
      if (roll <= 0) { caught = f; break; }
    }

    // Award XP
    GameState.skills.fishing.totalExp += caught.xp;
    const gained = GameState.checkSkillLevelUp('fishing');
    if (gained > 0) {
      this._floatText(`Fishing LV${GameState.skills.fishing.level}!`, '#ffee44');
    }

    // Add to inventory
    const inv = GameState.inventory;
    const existing = inv.find(s => s && s.name === caught.name);
    if (existing) {
      existing.qty += 1;
    } else {
      const slot = inv.findIndex(s => s === null);
      if (slot !== -1) inv[slot] = { name: caught.name, key: caught.key, qty: 1 };
    }

    this._floatText(`+1 ${caught.name}`, '#88ffcc');
    this.scene.sound.play('sfx-pickup', { volume: 0.35 });
  }

  _floatText(msg, color) {
    const txt = this.scene.add.text(this.x, this.y - 8, msg, {
      fontSize: '5px', fontFamily: 'monospace', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(50);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 16, alpha: 0,
      duration: 900, ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }
}

// ── Mining ───────────────────────────────────────────────────────────────────
const MINE_HIT_RADIUS = 22;
const MINE_HP         = 4;
const MINE_RESPAWN_MS = 15000;

const ORE_TABLE = [
  { name: 'Copper Ore', key: 'ore-copper', levelReq: 1,  xp: 10, weight: 50 },
  { name: 'Iron Ore',   key: 'ore-iron',   levelReq: 10, xp: 20, weight: 30 },
  { name: 'Silver Ore', key: 'ore-silver', levelReq: 20, xp: 35, weight: 15 },
  { name: 'Gold Ore',   key: 'ore-gold',   levelReq: 30, xp: 55, weight: 5  },
];

class MiningRock {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.hp = MINE_HP;
    this.state = 'full'; // full | empty

    this.sprite = scene.add.image(x, y, 'mine-rock').setOrigin(0.5).setDepth(y);
    this.emptySprite = scene.add.image(x, y, 'mine-rock-empty').setOrigin(0.5).setDepth(y).setVisible(false);
  }

  isMineable(hitX, hitY) {
    return this.state === 'full' &&
      Phaser.Math.Distance.Between(hitX, hitY, this.x, this.y) < MINE_HIT_RADIUS;
  }

  mine(scene) {
    if (this.state !== 'full') return false;
    this.hp--;

    scene.tweens.add({ targets: this.sprite, alpha: 0.4, duration: 70, yoyo: true });

    // Mining XP per hit
    GameState.skills.mining.totalExp += 5;
    this._floatText('+Mining XP', '#ccaa66');

    const gained = GameState.checkSkillLevelUp('mining');
    if (gained > 0) {
      this._floatText(`Mining LV${GameState.skills.mining.level}!`, '#ffee44');
    }

    if (this.hp <= 0) this._deplete();
    return true;
  }

  _deplete() {
    this.state = 'empty';
    this.sprite.setVisible(false);
    this.emptySprite.setVisible(true);

    // Pick an ore based on level
    const mineLevel = GameState.skills.mining.level;
    const available = ORE_TABLE.filter(o => mineLevel >= o.levelReq);
    const totalWeight = available.reduce((s, o) => s + o.weight, 0);
    let roll = Math.random() * totalWeight;
    let ore = available[0];
    for (const o of available) {
      roll -= o.weight;
      if (roll <= 0) { ore = o; break; }
    }

    // Award XP for the ore
    GameState.skills.mining.totalExp += ore.xp;
    GameState.checkSkillLevelUp('mining');

    // Add ore to inventory
    const inv = GameState.inventory;
    const existing = inv.find(s => s && s.name === ore.name);
    if (existing) {
      existing.qty += 1;
    } else {
      const slot = inv.findIndex(s => s === null);
      if (slot !== -1) inv[slot] = { name: ore.name, key: ore.key, qty: 1 };
    }

    this._floatText(`+1 ${ore.name}`, '#ddaa44');
    this.scene.sound.play('sfx-pickup', { volume: 0.35 });

    // Respawn
    this.scene.time.delayedCall(MINE_RESPAWN_MS, () => this._respawn());
  }

  _respawn() {
    this.state = 'full';
    this.hp = MINE_HP;
    this.sprite.setVisible(true);
    this.emptySprite.setVisible(false);
  }

  _floatText(msg, color) {
    const txt = this.scene.add.text(this.x, this.y - 10, msg, {
      fontSize: '5px', fontFamily: 'monospace', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(50);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 16, alpha: 0,
      duration: 900, ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }
}

// ── Cooking ──────────────────────────────────────────────────────────────────
const COOK_RADIUS = 22;

const COOK_RECIPES = {
  'raw-shrimp':   { result: 'cooked-shrimp',  resultName: 'Cooked Shrimp',  levelReq: 1,  xp: 12, healAmount: 15 },
  'raw-fish':     { result: 'cooked-fish',     resultName: 'Cooked Fish',    levelReq: 5,  xp: 22, healAmount: 30 },
  'raw-octopus':  { result: 'cooked-octopus',  resultName: 'Cooked Octopus', levelReq: 12, xp: 40, healAmount: 50 },
  'raw-calamari': { result: 'cooked-calamari',  resultName: 'Cooked Calamari', levelReq: 25, xp: 65, healAmount: 80 },
};

class CookingFire {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // Animated fire
    this.sprite = scene.add.sprite(x, y, 'fire-anim', 0).setDepth(y);
    if (!scene.anims.exists('fire-burn')) {
      scene.anims.create({
        key: 'fire-burn',
        frames: scene.anims.generateFrameNumbers('fire-anim', { start: 0, end: 7 }),
        frameRate: 8, repeat: -1,
      });
    }
    this.sprite.play('fire-burn');

    this.prompt = scene.add.text(x, y - 14, '[E] Cook', {
      fontSize: '5px', fontFamily: 'monospace', color: '#ffaa44',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false).setDepth(50);
  }

  update(delta, playerX, playerY, ePressed) {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < COOK_RADIUS;
    this.prompt.setVisible(nearby);

    if (nearby && ePressed) {
      this._cook();
    }
  }

  _cook() {
    const cookLevel = GameState.skills.cooking.level;
    const inv = GameState.inventory;

    // Find first cookable raw item in inventory
    for (let i = 0; i < inv.length; i++) {
      const item = inv[i];
      if (!item) continue;
      const recipe = COOK_RECIPES[item.key];
      if (!recipe) continue;
      if (cookLevel < recipe.levelReq) continue;

      // Cook one
      item.qty -= 1;
      if (item.qty <= 0) inv[i] = null;

      // Add cooked item
      const existing = inv.find(s => s && s.key === recipe.result);
      if (existing) {
        existing.qty += 1;
      } else {
        const slot = inv.findIndex(s => s === null);
        if (slot !== -1) {
          inv[slot] = {
            name: recipe.resultName, key: recipe.result, qty: 1,
            consumable: true, healAmount: recipe.healAmount,
          };
        }
      }

      // Award XP
      GameState.skills.cooking.totalExp += recipe.xp;
      const gained = GameState.checkSkillLevelUp('cooking');

      this._floatText(`Cooked ${recipe.resultName}`, '#ffcc44');
      this.scene.sound.play('sfx-accept', { volume: 0.3 });

      if (gained > 0) {
        this._floatText(`Cooking LV${GameState.skills.cooking.level}!`, '#ffee44');
      }
      return;
    }

    this._floatText('Nothing to cook', '#ff6666');
  }

  _floatText(msg, color) {
    const txt = this.scene.add.text(this.x, this.y - 8, msg, {
      fontSize: '5px', fontFamily: 'monospace', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(50);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 16, alpha: 0,
      duration: 900, ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }
}

// ── Smithing ─────────────────────────────────────────────────────────────────
const SMITH_RADIUS = 22;

const SMITH_RECIPES = [
  { oreKey: 'ore-copper', oreCount: 2, result: 'copper-sword',  resultName: 'Copper Sword',  levelReq: 1,  xp: 20,
    slot: 'weapon', stats: { attack: 3 } },
  { oreKey: 'ore-iron',   oreCount: 2, result: 'iron-sword',    resultName: 'Iron Sword',    levelReq: 10, xp: 40,
    slot: 'weapon', stats: { attack: 8 } },
  { oreKey: 'ore-copper', oreCount: 3, result: 'copper-armor',  resultName: 'Copper Armor',  levelReq: 5,  xp: 30,
    slot: 'armor', stats: { defense: 4 } },
  { oreKey: 'ore-iron',   oreCount: 3, result: 'iron-armor',    resultName: 'Iron Armor',    levelReq: 15, xp: 55,
    slot: 'armor', stats: { defense: 8 } },
  { oreKey: 'ore-silver', oreCount: 2, result: 'silver-ring',   resultName: 'Silver Ring',   levelReq: 20, xp: 50,
    slot: 'accessory', stats: { attack: 3, defense: 3 } },
  { oreKey: 'ore-gold',   oreCount: 2, result: 'gold-necklace', resultName: 'Gold Necklace', levelReq: 30, xp: 80,
    slot: 'accessory', stats: { attack: 5, defense: 5, maxHp: 30 } },
];

class SmithingAnvil {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.sprite = scene.add.image(x, y, 'anvil').setOrigin(0.5).setDepth(y);

    this.prompt = scene.add.text(x, y - 14, '[E] Smith', {
      fontSize: '5px', fontFamily: 'monospace', color: '#aaaacc',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false).setDepth(50);
  }

  update(delta, playerX, playerY, ePressed) {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < SMITH_RADIUS;
    this.prompt.setVisible(nearby);

    if (nearby && ePressed) {
      this._smith();
    }
  }

  _smith() {
    const smithLevel = GameState.skills.smithing.level;
    const inv = GameState.inventory;

    // Find first recipe the player can craft
    for (const recipe of SMITH_RECIPES) {
      if (smithLevel < recipe.levelReq) continue;

      // Count ore in inventory
      let oreCount = 0;
      for (const item of inv) {
        if (item && item.key === recipe.oreKey) oreCount += item.qty;
      }
      if (oreCount < recipe.oreCount) continue;

      // Consume ore
      let toConsume = recipe.oreCount;
      for (let i = 0; i < inv.length && toConsume > 0; i++) {
        if (inv[i] && inv[i].key === recipe.oreKey) {
          const take = Math.min(inv[i].qty, toConsume);
          inv[i].qty -= take;
          toConsume -= take;
          if (inv[i].qty <= 0) inv[i] = null;
        }
      }

      // Add crafted item (equipment doesn't stack)
      const freeSlot = inv.findIndex(s => s === null);
      if (freeSlot !== -1) {
        inv[freeSlot] = {
          name: recipe.resultName, key: recipe.result, qty: 1,
          slot: recipe.slot, stats: { ...recipe.stats },
        };
      }

      // Award XP
      GameState.skills.smithing.totalExp += recipe.xp;
      const gained = GameState.checkSkillLevelUp('smithing');

      this._floatText(`Smithed ${recipe.resultName}`, '#ccccff');
      this.scene.sound.play('sfx-equip', { volume: 0.4 });

      if (gained > 0) {
        this._floatText(`Smithing LV${GameState.skills.smithing.level}!`, '#ffee44');
      }
      return;
    }

    this._floatText('Need more ore', '#ff6666');
  }

  _floatText(msg, color) {
    const txt = this.scene.add.text(this.x, this.y - 8, msg, {
      fontSize: '5px', fontFamily: 'monospace', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(50);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 16, alpha: 0,
      duration: 900, ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }
}

// ── Thieving (pickpocket NPCs) ───────────────────────────────────────────────
const PICKPOCKET_RADIUS  = 20;
const PICKPOCKET_COOLDOWN = 3000;

const PICKPOCKET_LOOT = [
  { name: 'Gold Coin',    key: 'gold-coin',    weight: 50 },
  { name: 'Silver Coin',  key: 'silver-coin',  weight: 30 },
  { name: 'Red Gem',      key: 'red-gem',      weight: 10 },
  { name: 'Life Potion',  key: 'life-potion',  weight: 10 },
];

const PICKPOCKET_XP = 15;
const PICKPOCKET_FAIL_DAMAGE = 5;

// Not a separate class — this is a helper called from GameScene update
// when player presses T near an NPC
function attemptPickpocket(scene, npc) {
  const thieveLevel = GameState.skills.thieving.level;

  // Success: 50% at lv1, up to 95% at lv50+
  const successRate = Math.min(0.95, 0.50 + thieveLevel * 0.009);
  const success = Math.random() < successRate;

  const sx = npc.sprite.x, sy = npc.sprite.y;

  if (!success) {
    GameState.player.hp = Math.max(1, GameState.player.hp - PICKPOCKET_FAIL_DAMAGE);
    _thieveFloat(scene, sx, sy, `${npc.def.name} caught you!`, '#ff4444');
    scene.sound.play('sfx-hurt', { volume: 0.3 });
    GameState.skills.thieving.totalExp += 3;
    GameState.checkSkillLevelUp('thieving');
    return;
  }

  // Pick loot
  const totalWeight = PICKPOCKET_LOOT.reduce((s, l) => s + l.weight, 0);
  let roll = Math.random() * totalWeight;
  let loot = PICKPOCKET_LOOT[0];
  for (const l of PICKPOCKET_LOOT) {
    roll -= l.weight;
    if (roll <= 0) { loot = l; break; }
  }

  GameState.skills.thieving.totalExp += PICKPOCKET_XP;
  const gained = GameState.checkSkillLevelUp('thieving');

  const inv = GameState.inventory;
  const existing = inv.find(s => s && s.name === loot.name);
  if (existing) {
    existing.qty += 1;
  } else {
    const slot = inv.findIndex(s => s === null);
    if (slot !== -1) inv[slot] = { name: loot.name, key: loot.key, qty: 1 };
  }

  _thieveFloat(scene, sx, sy, `Stole ${loot.name}!`, '#ffdd44');
  scene.sound.play('sfx-pickup', { volume: 0.35 });

  if (gained > 0) {
    _thieveFloat(scene, sx, sy - 12, `Thieving LV${GameState.skills.thieving.level}!`, '#ffee44');
  }
}

function _thieveFloat(scene, x, y, msg, color) {
  const txt = scene.add.text(x, y - 8, msg, {
    fontSize: '5px', fontFamily: 'monospace', color,
    stroke: '#000000', strokeThickness: 2,
  }).setOrigin(0.5, 1).setDepth(50);
  scene.tweens.add({
    targets: txt, y: txt.y - 16, alpha: 0,
    duration: 900, ease: 'Power1',
    onComplete: () => txt.destroy(),
  });
}
