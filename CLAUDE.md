# Onigoroshi

## What This Is
A pixel art top-down action RPG built with Phaser 3. Samurai demon hunter theme with RuneScape-style skill leveling (1-99). Vanilla JS, no build step. A CapyForge Games title.

## Architecture
- **Engine:** Phaser 3.60 (CDN)
- **Resolution:** 320x240 at 3x zoom (pixel-perfect)
- **No build step** — vanilla JS, static file server

## File Layout
| File | Purpose |
|------|---------|
| `index.html` | Entry point |
| `src/main.js` | Phaser config, boot/preload |
| `src/gamestate.js` | Save/load, all persistent state |
| `src/areas.js` | Area definitions (Village, Dark Forest, Haunted Shrine) |
| `src/enemies.js` | Enemy types, loot tables, stats |
| `src/npcs.js` | NPC definitions, dialog, shop inventories |
| `src/skills.js` | 7 skills with RS-style XP curves |
| `src/trees.js` | Skill trees / progression |
| `src/scenes/GameScene.js` | Main gameplay — combat, gathering, interactions |
| `src/scenes/InventoryScene.js` | Inventory management |
| `src/scenes/CharacterScene.js` | Character stats / skills display |
| `src/scenes/DialogScene.js` | NPC dialog system |
| `src/scenes/GameOverScene.js` | Death screen |
| `assets/` | Sprites, audio (Ninja Adventure Asset Pack) |

## Game Systems
- **Combat:** Slash with knockback, invincibility frames, contact damage
- **7 Skills:** Woodcutting, Fishing, Mining, Cooking, Smithing, Firemaking, Thieving
- **3 Areas:** Village (safe), Dark Forest, Haunted Shrine — Zelda-style transitions
- **Equipment:** Weapon, Armor, Accessory slots
- **12 Weapons** via drops and smithing
- **Crafting pipelines:** Fish→Cook��Eat, Mine→Smith���Equip, Chop→Fire→Cook
- **Boss fight, shop, quests, gold economy**

## Important Commands
- Serve locally: `python3 -m http.server 8080` then open `localhost:8080`

## When Working on This Codebase
- No build step — edit JS directly, refresh browser
- Game state in `gamestate.js` — auto-saves on area transitions
- Assets from Ninja Adventure Asset Pack (Pixel-Boy & AAA) — respect license
- 2,263 files total (mostly assets) — code is compact

## License
CapyForge Games — capy-arbs
