// ── Area definitions ──────────────────────────────────────────────────────────
// Each area has: tile key, optional tint, spawn lists, and exits to other areas.
// Exits map edge direction → { area, dir } so we know where to place the player.

const AREAS = {
  village: {
    name: 'Village',
    tile: 'grass', tint: null,
    decorations: [
      // Buildings along top
      { key: 'house1', x: 42,  y: 50  },   // left cottage
      { key: 'house2', x: 278, y: 50  },   // right brick house
      { key: 'house3', x: 42,  y: 110 },   // left shop
      // Pond (bottom-right)
      { tile: 'water', x: 230, y: 180, w: 64, h: 48 },
    ],
    npcs: [
      { defIndex: 0, x: 100, y: 160 },  // Villager
      { defIndex: 1, x: 270, y: 115 },  // Elder Hiroshi
      { defIndex: 2, x: 180, y: 165 },  // Princess Yuki
      { defIndex: 3, x: 160, y: 80  },  // Demon Hunter Kenji (Slayer Master)
    ],
    enemies: [],
    trees: [
      { x: 130, y: 50  },
      { x: 190, y: 50  },
      { x: 25,  y: 195 },
    ],
    fishingSpots: [
      { x: 250, y: 176 },
    ],
    cookingFires: [
      { x: 160, y: 135 },
    ],
    miningRocks: [],
    anvils: [],
    shrines: [],
    mortars: [
      { x: 100, y: 130 },
    ],
    craftBenches: [
      { x: 220, y: 130 },
    ],
    exits: {
      north: 'forest',
      east:  'shrine',
      south: 'dojo',
    },
  },

  forest: {
    name: 'Dark Forest',
    tile: 'grass', tint: 0x77aa77,
    npcs: [],
    enemies: [
      { type: 'skull',   x: 80,  y: 80  },
      { type: 'skull',   x: 240, y: 180 },
      { type: 'spirit',  x: 260, y: 55  },
      { type: 'spirit',  x: 50,  y: 190 },
    ],
    trees: [
      { x: 35,  y: 50  },
      { x: 110, y: 35  },
      { x: 200, y: 45  },
      { x: 280, y: 70  },
      { x: 65,  y: 140 },
      { x: 170, y: 120 },
      { x: 250, y: 150 },
      { x: 130, y: 210 },
      { x: 290, y: 210 },
    ],
    fishingSpots: [
      { x: 160, y: 200 },
    ],
    cookingFires: [],
    miningRocks: [],
    anvils: [],
    shrines: [],
    mortars: [],
    craftBenches: [],
    exits: {
      south: 'village',
    },
  },

  shrine: {
    name: 'Haunted Shrine',
    tile: 'grass', tint: 0x9999bb,
    npcs: [],
    enemies: [
      { type: 'skull',   x: 60,  y: 60  },
      { type: 'skull',   x: 250, y: 190 },
      { type: 'spirit',  x: 160, y: 50  },
      { type: 'spirit',  x: 90,  y: 195 },
      { type: 'spirit',  x: 270, y: 70  },
    ],
    trees: [
      { x: 40, y: 220 },
    ],
    fishingSpots: [],
    cookingFires: [],
    miningRocks: [
      { x: 70,  y: 120 },
      { x: 200, y: 100 },
      { x: 280, y: 160 },
    ],
    anvils: [
      { x: 150, y: 140 },
    ],
    shrines: [
      { x: 40,  y: 50 },
      { x: 280, y: 50 },
    ],
    mortars: [],
    craftBenches: [],
    exits: {
      west: 'village',
    },
  },
  dojo: {
    name: 'Dojo Grounds',
    tile: 'grass', tint: 0xccbb88,
    npcs: [],
    enemies: [],
    trees: [],
    fishingSpots: [],
    cookingFires: [],
    miningRocks: [],
    anvils: [],
    shrines: [],
    mortars: [],
    craftBenches: [],
    agilityCourse: [
      { x: 40,  y: 40  },  // 1 - top left
      { x: 280, y: 40  },  // 2 - top right
      { x: 280, y: 200 },  // 3 - bottom right
      { x: 160, y: 130 },  // 4 - center
      { x: 40,  y: 200 },  // 5 - bottom left
      { x: 160, y: 40  },  // 6 - top center (finish → loops)
    ],
    exits: {
      north: 'village',
    },
  },
};

// enterDir = the side of the new area you're coming from
// If you come from the south side, you appear at the bottom of the screen
const EXIT_SPAWN = {
  south: { x: 160, y: 225 },  // coming from south side → bottom
  north: { x: 160, y: 15  },  // coming from north side → top
  east:  { x: 305, y: 120 },  // coming from east side → right
  west:  { x: 15,  y: 120 },  // coming from west side → left
};

const OPPOSITE_DIR = { north: 'south', south: 'north', east: 'west', west: 'east' };
