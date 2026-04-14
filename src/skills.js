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

    this.promptText = '[E] Fish'; this.promptId = 'station-' + x + '-' + y; this.promptVisible = false;

    this.isFishing = false;
    this.fishTimer = 0;
  }

  update(delta, playerX, playerY, ePressed) {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < FISH_CATCH_RADIUS;

    if (nearby && !this.isFishing) {
      showWorldPrompt(this.promptId, this.x, this.y, this.promptText);
      this.promptVisible = true;
    } else if (this.promptVisible) {
      hideWorldPrompt(this.promptId);
      this.promptVisible = false;
    }

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
    domFloat(this.x, this.y - 8, msg, color);
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
    domFloat(this.x, this.y - 8, msg, color);
  }
}

// ── Firemaking ───────────────────────────────────────────────────────────────
const FIRE_BASE_DURATION = 30000; // 30s base burn time
const FIRE_XP = 15;

function attemptFiremaking(scene, playerX, playerY) {
  const inv = GameState.inventory;

  // Find wood in inventory
  const woodIdx = inv.findIndex(s => s && s.name === 'Wood');
  if (woodIdx === -1) {
    _firemakingFloat(scene, playerX, playerY, 'No wood!', '#ff6666');
    return null;
  }

  // Consume 1 wood
  inv[woodIdx].qty -= 1;
  if (inv[woodIdx].qty <= 0) inv[woodIdx] = null;

  // Award XP
  GameState.skills.firemaking.totalExp += FIRE_XP;
  const gained = GameState.checkSkillLevelUp('firemaking');

  _firemakingFloat(scene, playerX, playerY, 'Lit a fire!', '#ffaa44');
  scene.sound.play('sfx-accept', { volume: 0.35 });

  if (gained > 0) {
    _firemakingFloat(scene, playerX, playerY - 12, `Firemaking LV${GameState.skills.firemaking.level}!`, '#ffee44');
  }

  // Duration scales with level: 30s base + 1s per level
  const duration = FIRE_BASE_DURATION + GameState.skills.firemaking.level * 1000;

  // Create a temporary cooking fire
  const fire = new CookingFire(scene, playerX, playerY + 12);
  fire.isTemporary = true;

  // Burn out after duration
  scene.time.delayedCall(duration, () => {
    if (fire.sprite) {
      scene.tweens.add({
        targets: fire.sprite, alpha: 0, duration: 500,
        onComplete: () => {
          fire.sprite.destroy();
          hideWorldPrompt(fire.promptId);
          fire.sprite = null;
        },
      });
    }
  });

  return fire;
}

function _firemakingFloat(scene, x, y, msg, color) {
  domFloat(x, y - 10, msg, color);
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

    this.promptText = '[E] Cook'; this.promptId = 'station-' + x + '-' + y; this.promptVisible = false;
  }

  update(delta, playerX, playerY, ePressed) {
    if (!this.sprite) return; // burned out
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < COOK_RADIUS;
    if (nearby) {
      showWorldPrompt(this.promptId, this.x, this.y, this.promptText);
      this.promptVisible = true;
    } else if (this.promptVisible) {
      hideWorldPrompt(this.promptId);
      this.promptVisible = false;
    }

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
    domFloat(this.x, this.y - 8, msg, color);
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
  { oreKey: 'ore-silver', oreCount: 2, result: 'silver-sword',  resultName: 'Silver Sword',  levelReq: 20, xp: 55,
    slot: 'weapon', stats: { attack: 16 } },
  { oreKey: 'ore-silver', oreCount: 3, result: 'silver-armor',  resultName: 'Silver Armor',  levelReq: 25, xp: 65,
    slot: 'armor', stats: { defense: 12, maxHp: 15 } },
  { oreKey: 'ore-silver', oreCount: 2, result: 'silver-ring',   resultName: 'Silver Ring',   levelReq: 20, xp: 50,
    slot: 'accessory', stats: { attack: 3, defense: 3 } },
  { oreKey: 'ore-gold',   oreCount: 2, result: 'magic-wand',    resultName: 'Magic Wand',    levelReq: 30, xp: 85,
    slot: 'weapon', stats: { attack: 20 } },
  { oreKey: 'ore-gold',   oreCount: 3, result: 'gold-armor',    resultName: 'Gold Armor',    levelReq: 35, xp: 100,
    slot: 'armor', stats: { defense: 16, maxHp: 30 } },
  { oreKey: 'ore-gold',   oreCount: 2, result: 'gold-necklace', resultName: 'Gold Necklace', levelReq: 30, xp: 80,
    slot: 'accessory', stats: { attack: 5, defense: 5, maxHp: 30 } },
];

class SmithingAnvil {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.sprite = scene.add.image(x, y, 'anvil').setOrigin(0.5).setDepth(y);

    this.promptText = '[E] Smith'; this.promptId = 'station-' + x + '-' + y; this.promptVisible = false;
  }

  update(delta, playerX, playerY, ePressed) {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < SMITH_RADIUS;
    if (nearby) {
      showWorldPrompt(this.promptId, this.x, this.y, this.promptText);
      this.promptVisible = true;
    } else if (this.promptVisible) {
      hideWorldPrompt(this.promptId);
      this.promptVisible = false;
    }

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
    domFloat(this.x, this.y - 8, msg, color);
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
  domFloat(x, y - 8, msg, color);
}

// ── Meditation (Prayer) ──────────────────────────────────────────────────────
const MEDITATE_RADIUS  = 22;
const MEDITATE_COOLDOWN = 8000;

const MEDITATE_BUFFS = [
  { name: 'Focus',   stat: 'attack',  amount: 5,  duration: 30000, color: '#ff8844', levelReq: 1,  xp: 15 },
  { name: 'Resolve', stat: 'defense', amount: 5,  duration: 30000, color: '#4488ff', levelReq: 1,  xp: 15 },
  { name: 'Harmony', stat: 'hpRegen', amount: 2,  duration: 20000, color: '#44ff88', levelReq: 5,  xp: 20 },
  { name: 'Inner Flame', stat: 'attack',  amount: 10, duration: 25000, color: '#ffaa22', levelReq: 15, xp: 30 },
  { name: 'Iron Will',   stat: 'defense', amount: 10, duration: 25000, color: '#6688ff', levelReq: 15, xp: 30 },
  { name: 'Zen',         stat: 'hpRegen', amount: 5,  duration: 30000, color: '#88ffaa', levelReq: 25, xp: 45 },
];

class MeditationShrine {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.cooldown = 0;

    this.sprite = scene.add.image(x, y, 'shrine-stone').setOrigin(0.5).setDepth(y);

    this.promptText = '[E] Meditate'; this.promptId = 'station-' + x + '-' + y; this.promptVisible = false;
  }

  update(delta, playerX, playerY, ePressed) {
    if (this.cooldown > 0) this.cooldown -= delta;

    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < MEDITATE_RADIUS;
    if (nearby && this.cooldown <= 0) {
      showWorldPrompt(this.promptId, this.x, this.y, this.promptText);
      this.promptVisible = true;
    } else if (this.promptVisible) {
      hideWorldPrompt(this.promptId);
      this.promptVisible = false;
    }

    if (nearby && ePressed && this.cooldown <= 0) {
      this._meditate();
    }
  }

  _meditate() {
    this.cooldown = MEDITATE_COOLDOWN;
    const medLevel = GameState.skills.meditation.level;

    // Pick the best available buff (cycles through them)
    const available = MEDITATE_BUFFS.filter(b => medLevel >= b.levelReq);
    const buff = available[Math.floor(Math.random() * available.length)];

    // Apply buff
    if (buff.stat === 'hpRegen') {
      // HP regen: heal over time
      GameState.buffs.hpRegen = buff.amount;
      GameState.buffs.buffTimer = buff.duration;
    } else {
      GameState.buffs[buff.stat] = buff.amount;
      GameState.buffs.buffTimer = buff.duration;
      GameState.recalcStats();
    }

    // Award XP
    GameState.skills.meditation.totalExp += buff.xp;
    const gained = GameState.checkSkillLevelUp('meditation');

    this._floatText(buff.name + '!', buff.color);
    this.scene.sound.play('sfx-levelup', { volume: 0.3 });

    if (gained > 0) {
      this._floatText(`Meditation LV${GameState.skills.meditation.level}!`, '#ffee44');
    }
  }

  _floatText(msg, color) {
    domFloat(this.x, this.y - 8, msg, color);
  }
}

// ── Slayer ────────────────────────────────────────────────────────────────────
const SLAYER_TASKS = [
  { enemy: 'skull',  count: 3, xpReward: 40,  levelReq: 1  },
  { enemy: 'spirit', count: 3, xpReward: 45,  levelReq: 1  },
  { enemy: 'skull',  count: 5, xpReward: 70,  levelReq: 5  },
  { enemy: 'spirit', count: 5, xpReward: 80,  levelReq: 5  },
  { enemy: 'skull',  count: 8, xpReward: 120, levelReq: 10 },
  { enemy: 'spirit', count: 8, xpReward: 130, levelReq: 15 },
  { enemy: 'skull',  count: 12,xpReward: 200, levelReq: 20 },
  { enemy: 'spirit', count: 12,xpReward: 220, levelReq: 25 },
];

function getSlayerTask() {
  const level = GameState.skills.slayer.level;
  const available = SLAYER_TASKS.filter(t => level >= t.levelReq);
  const task = available[Math.floor(Math.random() * available.length)];
  GameState.slayerTask = { enemy: task.enemy, remaining: task.count, xpReward: task.xpReward };
  return GameState.slayerTask;
}

// Called from Enemy._die when an enemy is killed
function onEnemyKilled(scene, enemyKey) {
  const task = GameState.slayerTask;
  if (!task || task.enemy !== enemyKey) return;

  task.remaining--;
  if (task.remaining <= 0) {
    // Task complete!
    GameState.skills.slayer.totalExp += task.xpReward;
    const gained = GameState.checkSkillLevelUp('slayer');

    _slayerFloat(scene, 'Slayer task complete!', '#ff4488');
    scene.sound.play('sfx-levelup', { volume: 0.4 });

    if (gained > 0) {
      _slayerFloat(scene, `Slayer LV${GameState.skills.slayer.level}!`, '#ffee44');
    }

    GameState.slayerTask = null;
  } else {
    _slayerFloat(scene, `${task.remaining} ${task.enemy}s left`, '#ff88aa');
  }
}

function _slayerFloat(scene, msg, color) {
  const px = scene.player ? scene.player.x : 160;
  const py = scene.player ? scene.player.y - 24 : 100;
  domFloat(px, py, msg, color);
}

// ── Herbalism ────────────────────────────────────────────────────────────────
const HERB_RADIUS = 22;

const HERB_RECIPES = [
  { ingredients: [{ key: 'slime-gel', qty: 2 }],
    result: 'focus-tonic',  resultName: 'Focus Tonic',  levelReq: 1,  xp: 20 },
  { ingredients: [{ key: 'bone', qty: 2 }],
    result: 'resolve-salve', resultName: 'Resolve Salve', levelReq: 1,  xp: 20 },
  { ingredients: [{ key: 'spirit-essence', qty: 2 }],
    result: 'harmony-tea',  resultName: 'Harmony Tea',  levelReq: 5,  xp: 30 },
  { ingredients: [{ key: 'slime-gel', qty: 2 }, { key: 'spirit-essence', qty: 2 }],
    result: 'oni-elixir',   resultName: 'Oni Elixir',   levelReq: 15, xp: 55 },
];

class HerbalismMortar {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.sprite = scene.add.image(x, y, 'mortar').setOrigin(0.5).setDepth(y);

    this.promptText = '[E] Brew'; this.promptId = 'station-' + x + '-' + y; this.promptVisible = false;
  }

  update(delta, playerX, playerY, ePressed) {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < HERB_RADIUS;
    if (nearby) {
      showWorldPrompt(this.promptId, this.x, this.y, this.promptText);
      this.promptVisible = true;
    } else if (this.promptVisible) {
      hideWorldPrompt(this.promptId);
      this.promptVisible = false;
    }

    if (nearby && ePressed) {
      this._brew();
    }
  }

  _brew() {
    const herbLevel = GameState.skills.herbalism.level;
    const inv = GameState.inventory;

    for (const recipe of HERB_RECIPES) {
      if (herbLevel < recipe.levelReq) continue;

      // Check if we have all ingredients
      let canCraft = true;
      for (const ing of recipe.ingredients) {
        let count = 0;
        for (const item of inv) {
          if (item && item.key === ing.key) count += item.qty;
        }
        if (count < ing.qty) { canCraft = false; break; }
      }
      if (!canCraft) continue;

      // Consume ingredients
      for (const ing of recipe.ingredients) {
        let toConsume = ing.qty;
        for (let i = 0; i < inv.length && toConsume > 0; i++) {
          if (inv[i] && inv[i].key === ing.key) {
            const take = Math.min(inv[i].qty, toConsume);
            inv[i].qty -= take;
            toConsume -= take;
            if (inv[i].qty <= 0) inv[i] = null;
          }
        }
      }

      // Add result — look up from ITEM_DEFS for full properties
      const def = ITEM_DEFS[recipe.result];
      const existing = inv.find(s => s && s.key === recipe.result);
      if (existing) {
        existing.qty += 1;
      } else {
        const slot = inv.findIndex(s => s === null);
        if (slot !== -1) {
          const item = { name: recipe.resultName, key: recipe.result, qty: 1 };
          if (def && def.consumable) { item.consumable = true; item.healAmount = def.healAmount || 0; }
          if (def && def.buff) { item.buff = def.buff; item.buffAmount = def.buffAmount; item.buffDuration = def.buffDuration; item.consumable = true; }
          inv[slot] = item;
        }
      }

      GameState.skills.herbalism.totalExp += recipe.xp;
      const gained = GameState.checkSkillLevelUp('herbalism');

      this._floatText(`Brewed ${recipe.resultName}`, '#88dd88');
      this.scene.sound.play('sfx-accept', { volume: 0.3 });

      if (gained > 0) {
        this._floatText(`Herbalism LV${GameState.skills.herbalism.level}!`, '#ffee44');
      }
      return;
    }

    this._floatText('Need ingredients', '#ff6666');
  }

  _floatText(msg, color) {
    domFloat(this.x, this.y - 8, msg, color);
  }
}

// ── Crafting ─────────────────────────────────────────────────────────────────
const CRAFT_RADIUS = 22;

const CRAFT_RECIPES = [
  { ingredients: [{ key: 'bone', qty: 3 }, { key: 'feather', qty: 1 }],
    result: 'bone-charm', resultName: 'Bone Charm', levelReq: 1, xp: 25,
    slot: 'accessory', stats: { attack: 1, defense: 1, maxHp: 10 } },
  { ingredients: [{ key: 'red-gem', qty: 2 }, { key: 'bone', qty: 2 }],
    result: 'demon-amulet', resultName: 'Demon Amulet', levelReq: 10, xp: 50,
    slot: 'accessory', stats: { attack: 4, defense: 4, maxHp: 20 } },
  { ingredients: [{ key: 'spirit-essence', qty: 3 }, { key: 'red-gem', qty: 2 }, { key: 'feather', qty: 2 }],
    result: 'spirit-talisman', resultName: 'Spirit Talisman', levelReq: 25, xp: 90,
    slot: 'accessory', stats: { attack: 7, defense: 7, maxHp: 40 } },
];

class CraftingBench {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.sprite = scene.add.image(x, y, 'craft-bench').setOrigin(0.5).setDepth(y);

    this.promptText = '[E] Craft'; this.promptId = 'station-' + x + '-' + y; this.promptVisible = false;
  }

  update(delta, playerX, playerY, ePressed) {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const nearby = dist < CRAFT_RADIUS;
    if (nearby) {
      showWorldPrompt(this.promptId, this.x, this.y, this.promptText);
      this.promptVisible = true;
    } else if (this.promptVisible) {
      hideWorldPrompt(this.promptId);
      this.promptVisible = false;
    }

    if (nearby && ePressed) {
      this._craft();
    }
  }

  _craft() {
    const craftLevel = GameState.skills.crafting.level;
    const inv = GameState.inventory;

    for (const recipe of CRAFT_RECIPES) {
      if (craftLevel < recipe.levelReq) continue;

      let canCraft = true;
      for (const ing of recipe.ingredients) {
        let count = 0;
        for (const item of inv) {
          if (item && item.key === ing.key) count += item.qty;
        }
        if (count < ing.qty) { canCraft = false; break; }
      }
      if (!canCraft) continue;

      // Consume ingredients
      for (const ing of recipe.ingredients) {
        let toConsume = ing.qty;
        for (let i = 0; i < inv.length && toConsume > 0; i++) {
          if (inv[i] && inv[i].key === ing.key) {
            const take = Math.min(inv[i].qty, toConsume);
            inv[i].qty -= take;
            toConsume -= take;
            if (inv[i].qty <= 0) inv[i] = null;
          }
        }
      }

      // Add crafted equipment (doesn't stack)
      const freeSlot = inv.findIndex(s => s === null);
      if (freeSlot !== -1) {
        inv[freeSlot] = {
          name: recipe.resultName, key: recipe.result, qty: 1,
          slot: recipe.slot, stats: { ...recipe.stats },
        };
      }

      GameState.skills.crafting.totalExp += recipe.xp;
      const gained = GameState.checkSkillLevelUp('crafting');

      this._floatText(`Crafted ${recipe.resultName}`, '#ddaa66');
      this.scene.sound.play('sfx-equip', { volume: 0.4 });

      if (gained > 0) {
        this._floatText(`Crafting LV${GameState.skills.crafting.level}!`, '#ffee44');
      }
      return;
    }

    this._floatText('Need materials', '#ff6666');
  }

  _floatText(msg, color) {
    domFloat(this.x, this.y - 8, msg, color);
  }
}

// ── Agility ──────────────────────────────────────────────────────────────────
const AGILITY_MARKER_RADIUS = 16;
const AGILITY_XP_PER_POST   = 8;
const AGILITY_LAP_BONUS     = 30;
const AGILITY_SPEED_PER_LEVEL = 0.5;

function getAgilitySpeedBonus() {
  return (GameState.skills.agility.level - 1) * AGILITY_SPEED_PER_LEVEL;
}

class AgilityCourse {
  constructor(scene, waypoints) {
    this.scene = scene;
    this.waypoints = waypoints;
    this.currentIdx = 0;
    this.markers = [];

    waypoints.forEach((wp, i) => {
      const marker = scene.add.image(wp.x, wp.y, 'agility-post').setOrigin(0.5).setDepth(wp.y);
      // DOM label for post number
      const labelId = 'agility-label-' + i;
      showWorldPrompt(labelId, wp.x, wp.y, `${i + 1}`);
      this.markers.push({ sprite: marker, labelId, x: wp.x, y: wp.y });
    });

    // Guide text (DOM)
    this.guideId = 'agility-guide';
    showWorldPrompt(this.guideId, 160, 232, 'Run to the highlighted post!');

    // Highlight the first target
    this._highlightCurrent();
  }

  update(delta, playerX, playerY) {
    const target = this.markers[this.currentIdx];
    const dist = Phaser.Math.Distance.Between(playerX, playerY, target.x, target.y);

    if (dist < AGILITY_MARKER_RADIUS) {
      this._reachPost();
    }
  }

  _reachPost() {
    // Award XP for reaching this post
    GameState.skills.agility.totalExp += AGILITY_XP_PER_POST;

    const marker = this.markers[this.currentIdx];
    // Flash the reached post
    this.scene.tweens.add({
      targets: marker.sprite, alpha: 0.3, duration: 100, yoyo: true,
    });

    this._floatText(marker.x, marker.y, `+${AGILITY_XP_PER_POST} Agility XP`, '#44dddd');
    this.scene.sound.play('sfx-accept', { volume: 0.25 });

    this.currentIdx++;

    // Completed a full lap
    if (this.currentIdx >= this.waypoints.length) {
      this.currentIdx = 0;
      GameState.skills.agility.totalExp += AGILITY_LAP_BONUS;
      this._floatText(160, 100, `Lap complete! +${AGILITY_LAP_BONUS} bonus XP`, '#ffee44');
      this.scene.sound.play('sfx-levelup', { volume: 0.35 });
    }

    const gained = GameState.checkSkillLevelUp('agility');
    if (gained > 0) {
      this._floatText(160, 80, `Agility LV${GameState.skills.agility.level}!`, '#ffee44');
    }

    this._highlightCurrent();
  }

  _highlightCurrent() {
    this.markers.forEach((m, i) => {
      if (i === this.currentIdx) {
        m.sprite.setTint(0x44ffff);
      } else {
        m.sprite.clearTint();
      }
    });

    // Update guide
    showWorldPrompt(this.guideId, 160, 232, `Run to post ${this.currentIdx + 1}!`);
  }

  _floatText(x, y, msg, color) {
    domFloat(x, y - 8, msg, color);
  }
}
