// Shared sprite frame constants — column = direction, row = step (all Walk.png sheets)
const WALK_FRAMES = {
  down:  [0,  4,  8,  12],
  up:    [1,  5,  9,  13],
  left:  [2,  6,  10, 14],
  right: [3,  7,  11, 15],
};
const IDLE_FRAME = { down: 0, up: 1, left: 2, right: 3 };

// ── RuneScape-style XP table (levels 1–99) ──────────────────────────────────
// Formula: XP(L) = floor(1/4 * sum(l=1..L-1) floor(l + 300 * 2^(l/7)))
const MAX_LEVEL = 99;
const XP_TABLE = [0]; // XP_TABLE[level] = total XP needed to reach that level

(function buildXPTable() {
  let cumulative = 0;
  for (let l = 1; l < MAX_LEVEL; l++) {
    cumulative += Math.floor(l + 300 * Math.pow(2, l / 7));
    XP_TABLE.push(Math.floor(cumulative / 4));
  }
})();

// Given total XP, return the current level (1–99)
function xpToLevel(totalXP) {
  for (let l = MAX_LEVEL - 1; l >= 1; l--) {
    if (totalXP >= XP_TABLE[l]) return l + 1;
  }
  return 1;
}

const GameState = {
  player: {
    name: 'Samurai',
    level: 1,
    hp: 100,
    maxHp: 100,
    baseHp: 100,
    attack: 15,
    baseAttack: 15,
    defense: 8,
    baseDefense: 8,
    speed: 10,
    baseSpeed: 10,
    totalExp: 0,
  },
  currentArea: 'village',

  // 20 inventory slots — null = empty, object = item
  inventory: new Array(20).fill(null),

  // Equipment: weapon, armor, accessory — null = empty, object = item
  equipment: { weapon: null, armor: null, accessory: null },

  // Active buffs from meditation (temporary, not saved)
  buffs: { attack: 0, defense: 0, hpRegen: 0, buffTimer: 0 },

  // Slayer task: { enemy: 'skull', remaining: 5, xpReward: 50 } or null
  slayerTask: null,

  skills: {
    woodcutting: { level: 1, totalExp: 0 },
    fishing:     { level: 1, totalExp: 0 },
    mining:      { level: 1, totalExp: 0 },
    cooking:     { level: 1, totalExp: 0 },
    smithing:    { level: 1, totalExp: 0 },
    firemaking:  { level: 1, totalExp: 0 },
    meditation:  { level: 1, totalExp: 0 },
    slayer:      { level: 1, totalExp: 0 },
    herbalism:   { level: 1, totalExp: 0 },
    crafting:    { level: 1, totalExp: 0 },
    agility:     { level: 1, totalExp: 0 },
    thieving:    { level: 1, totalExp: 0 },
  },

  // Check and apply combat level-ups. Returns number of levels gained.
  checkLevelUp() {
    const p = this.player;
    const newLevel = Math.min(MAX_LEVEL, xpToLevel(p.totalExp));
    const gained = newLevel - p.level;

    if (gained <= 0) return 0;

    p.level = newLevel;
    this.recalcStats();
    p.hp = p.maxHp; // full heal on level up

    return gained;
  },

  // Check and apply skill level-ups. Returns number of levels gained.
  checkSkillLevelUp(skillName) {
    const skill = this.skills[skillName];
    const newLevel = Math.min(MAX_LEVEL, xpToLevel(skill.totalExp));
    const gained = newLevel - skill.level;

    if (gained > 0) skill.level = newLevel;
    return gained;
  },

  // Helper: XP needed for next level in a given skill/combat
  xpForNextLevel(currentLevel) {
    if (currentLevel >= MAX_LEVEL) return 0;
    return XP_TABLE[currentLevel]; // total XP needed to reach currentLevel + 1
  },

  // Sum equipment stat bonuses for a given stat key
  equipBonus(stat) {
    let bonus = 0;
    for (const slot of Object.values(this.equipment)) {
      if (slot && slot.stats && slot.stats[stat]) bonus += slot.stats[stat];
    }
    return bonus;
  },

  // Recalculate effective stats (call after equip/unequip or level-up)
  recalcStats() {
    const p = this.player;
    p.attack  = p.baseAttack  + (p.level - 1) * 3  + this.equipBonus('attack') + this.buffs.attack;
    p.defense = p.baseDefense + (p.level - 1) * 2  + this.equipBonus('defense') + this.buffs.defense;
    p.speed   = p.baseSpeed   + (p.level - 1) * 1  + this.equipBonus('speed');
    p.maxHp   = p.baseHp      + (p.level - 1) * 12 + this.equipBonus('maxHp');
    if (p.hp > p.maxHp) p.hp = p.maxHp;
  },

  // Equip an item from inventory slot index. Returns true if successful.
  equipItem(invIndex) {
    const item = this.inventory[invIndex];
    if (!item || !item.slot) return false;

    const slotName = item.slot;
    const current  = this.equipment[slotName];

    // Swap: put currently equipped item back into the inventory slot
    this.equipment[slotName] = item;
    this.inventory[invIndex] = current; // null if nothing was equipped

    this.recalcStats();
    return true;
  },

  // Unequip from equipment slot back to inventory. Returns true if successful.
  unequipItem(slotName) {
    const item = this.equipment[slotName];
    if (!item) return false;

    const freeSlot = this.inventory.findIndex(s => s === null);
    if (freeSlot === -1) return false; // inventory full

    this.inventory[freeSlot] = item;
    this.equipment[slotName] = null;

    this.recalcStats();
    return true;
  },

  // ── Save / Load ────────────────────────────────────────────────────────────
  save() {
    const data = {
      player: {
        level: this.player.level,
        hp: this.player.hp,
        totalExp: this.player.totalExp,
      },
      currentArea: this.currentArea,
      inventory: this.inventory,
      equipment: this.equipment,
      skills: JSON.parse(JSON.stringify(this.skills)),
      slayerTask: this.slayerTask,
    };
    try {
      localStorage.setItem('onigoroshi-save', JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem('onigoroshi-save');
      if (!raw) return false;
      const data = JSON.parse(raw);

      this.player.level    = data.player.level;
      this.player.totalExp = data.player.totalExp;
      this.currentArea     = data.currentArea;
      this.inventory       = data.inventory;
      this.equipment       = data.equipment;
      // Merge saved skills over defaults (so new skills aren't lost from old saves)
      for (const key of Object.keys(data.skills)) {
        this.skills[key] = data.skills[key];
      }
      this.slayerTask = data.slayerTask || null;

      // Recalc derived stats from level + equipment
      this.recalcStats();
      this.player.hp = data.player.hp;

      return true;
    } catch (e) {
      return false;
    }
  },

  clearSave() {
    localStorage.removeItem('onigoroshi-save');
  },

  hasSave() {
    return !!localStorage.getItem('onigoroshi-save');
  },
};
