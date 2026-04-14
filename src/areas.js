// ── Area definitions ──────────────────────────────────────────────────────────
// Each area has: tile key, optional tint, spawn lists, and exits to other areas.
// Exits map edge direction → { area, dir } so we know where to place the player.

const AREAS = {
  village: {
    name: 'Village',
    tile: 'grass', tint: null,
    npcs: [
      { defIndex: 0, x: 70,  y: 65  },  // Villager
      { defIndex: 1, x: 230, y: 85  },  // Elder Hiroshi
      { defIndex: 2, x: 150, y: 185 },  // Princess Yuki
    ],
    enemies: [],
    trees: [
      { x: 48,  y: 48  },
      { x: 262, y: 52  },
      { x: 105, y: 210 },
    ],
    fishingSpots: [
      { x: 290, y: 210 },
    ],
    cookingFires: [
      { x: 200, y: 170 },
    ],
    miningRocks: [],
    anvils: [],
    exits: {
      north: 'forest',
      east:  'shrine',
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
    exits: {
      west: 'village',
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
