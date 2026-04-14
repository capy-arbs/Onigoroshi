# Onigoroshi

A pixel art top-down action RPG built with [Phaser 3](https://phaser.io/), featuring RuneScape-style skill leveling and a samurai demon hunter theme.

![Phaser 3](https://img.shields.io/badge/Phaser-3.60-blue) ![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow)

## Play

```bash
# Clone the repo
git clone https://github.com/capy-arbs/Onigoroshi.git
cd Onigoroshi

# Serve locally (any static server works)
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move |
| Space | Attack / Mine rocks |
| E | Interact (talk to NPCs, fish, cook, smith) |
| T | Pickpocket NPC |
| F | Light a fire (requires wood) |
| I | Inventory |
| C | Character / Skills |
| S | Save game |

## Features

- **Combat** — Slash enemies with knockback, invincibility frames, and contact damage
- **7 Skills** — Woodcutting, Fishing, Mining, Cooking, Smithing, Firemaking, Thieving — all with RS-style XP curves (levels 1-99)
- **3 Areas** — Village (safe zone), Dark Forest, Haunted Shrine — connected by Zelda-style screen transitions
- **Equipment** — Weapon, Armor, and Accessory slots with stat bonuses
- **12 Weapons** — From sticks to magic wands, obtained via drops and smithing
- **Item Drops** — Enemies have loot tables with varied drop rates
- **Cooking Pipeline** — Catch fish, light a fire, cook food, eat to heal
- **Smithing Pipeline** — Mine ore, smith weapons and armor at the anvil
- **Full Audio** — Background music + 12 sound effects
- **Save System** — Auto-saves on area transitions, manual save with S key, auto-loads on refresh

## Game Guide

See the [Wiki](WIKI.md) for detailed info on skills, items, equipment, enemies, and areas.

## Tech

- **Engine:** Phaser 3.60 (loaded via CDN)
- **Resolution:** 320x240 at 3x zoom (pixel-perfect)
- **Assets:** [Ninja Adventure Asset Pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack) by Pixel-Boy & AAA
- **No build step** — just vanilla JS and a static file server

## Credits

- Game art: **Ninja Adventure Asset Pack** by Pixel-Boy & AAA
- Built with [Claude Code](https://claude.ai/claude-code)
