const UI_BASE = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/Ui/';

class InventoryScene extends Phaser.Scene {
  constructor() { super({ key: 'InventoryScene' }); }

  preload() {
    this.load.image('inv-cell', UI_BASE + 'Theme/Theme Wood/inventory_cell.png');
  }

  create() {
    const W = 320, H = 240;

    // ── Dim overlay ──────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0);

    // ── Panel ────────────────────────────────────────────────────────
    const PW = 210, PH = 175;
    const PX = (W - PW) / 2, PY = (H - PH) / 2;

    const gfx = this.add.graphics();

    // Panel body
    gfx.fillStyle(0x2d1f10);
    gfx.fillRoundedRect(PX, PY, PW, PH, 5);
    gfx.lineStyle(2, 0x8b4513);
    gfx.strokeRoundedRect(PX, PY, PW, PH, 5);

    // Title bar
    gfx.fillStyle(0x5c3317);
    gfx.fillRoundedRect(PX, PY, PW, 18, { tl: 5, tr: 5, bl: 0, br: 0 });

    // Title
    this.add.text(W / 2, PY + 9, 'INVENTORY', {
      fontSize: '8px', fontFamily: 'monospace', color: '#f5deb3',
    }).setOrigin(0.5);

    // ── Tooltip text (bottom of panel, above close hint) ─────────────
    this.tooltip = this.add.text(W / 2, PY + PH - 16, '', {
      fontSize: '5px', fontFamily: 'monospace', color: '#ccbb88',
    }).setOrigin(0.5).setDepth(20);

    // ── Inventory grid: 5 cols × 4 rows = 20 slots ───────────────────
    const COLS = 5, ROWS = 4, CELL = 18, GAP = 3;
    const gridW = COLS * CELL + (COLS - 1) * GAP;
    const gridH = ROWS * CELL + (ROWS - 1) * GAP;
    const GX = PX + (PW - gridW) / 2;
    const GY = PY + 26;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = GX + c * (CELL + GAP);
        const y = GY + r * (CELL + GAP);

        // Cell bg
        gfx.fillStyle(0x0d0805);
        gfx.fillRoundedRect(x, y, CELL, CELL, 2);
        gfx.lineStyle(1, 0x5a3c20);
        gfx.strokeRoundedRect(x, y, CELL, CELL, 2);

        // Item in slot
        const idx  = r * COLS + c;
        const item = GameState.inventory[idx];
        if (item) {
          this.add.image(x + CELL / 2, y + CELL / 2, item.key).setOrigin(0.5);
          if (item.qty > 1) {
            this.add.text(x + CELL - 1, y + CELL - 1, item.qty, {
              fontSize: '5px', fontFamily: 'monospace', color: '#ffffff',
              stroke: '#000000', strokeThickness: 2,
            }).setOrigin(1, 1);
          }
        }

        // Clickable zone for equipping
        const zone = this.add.zone(x + CELL / 2, y + CELL / 2, CELL, CELL).setInteractive();
        zone.on('pointerdown', () => this._onInvSlotClick(idx));
        zone.on('pointerover', () => this._showItemTooltip(GameState.inventory[idx]));
        zone.on('pointerout',  () => this.tooltip.setText(''));
      }
    }

    // ── Equipment slots ──────────────────────────────────────────────
    const eqY = GY + gridH + 8;
    this.add.text(PX + 8, eqY, 'EQUIPPED', {
      fontSize: '6px', fontFamily: 'monospace', color: '#8b7355',
    });

    const slotDefs = [
      { label: 'WPN', slotName: 'weapon' },
      { label: 'ARM', slotName: 'armor' },
      { label: 'ACC', slotName: 'accessory' },
    ];

    slotDefs.forEach((def, i) => {
      const sx = PX + 12 + i * 28;
      const sy = eqY + 8;

      gfx.fillStyle(0x0d0805);
      gfx.fillRoundedRect(sx, sy, 22, 22, 2);
      gfx.lineStyle(1, 0x8b4513);
      gfx.strokeRoundedRect(sx, sy, 22, 22, 2);

      const equipped = GameState.equipment[def.slotName];
      if (equipped) {
        this.add.image(sx + 11, sy + 11, equipped.key).setOrigin(0.5);
      } else {
        this.add.text(sx + 11, sy + 11, def.label, {
          fontSize: '4px', fontFamily: 'monospace', color: '#5a3c20',
        }).setOrigin(0.5);
      }

      // Clickable zone for unequipping
      const zone = this.add.zone(sx + 11, sy + 11, 22, 22).setInteractive();
      zone.on('pointerdown', () => this._onEquipSlotClick(def.slotName));
      zone.on('pointerover', () => this._showItemTooltip(GameState.equipment[def.slotName]));
      zone.on('pointerout',  () => this.tooltip.setText(''));
    });

    // ── Stat summary (right of equip slots) ──────────────────────────
    const statX = PX + 105, statY = eqY + 4;
    this.add.text(statX, statY, this._statSummary(), {
      fontSize: '5px', fontFamily: 'monospace', color: '#aaaaaa', lineSpacing: 2,
    });

    // ── Close hint ────────────────────────────────────────────────────
    this.add.text(W / 2, PY + PH - 7, '[I] or [ESC] to close', {
      fontSize: '5px', fontFamily: 'monospace', color: '#6b5030',
    }).setOrigin(0.5);

    // ── Close listeners ───────────────────────────────────────────────
    this.input.keyboard.once('keydown-I',   () => this._close());
    this.input.keyboard.once('keydown-ESC', () => this._close());
  }

  _onInvSlotClick(idx) {
    const item = GameState.inventory[idx];
    if (!item) return;

    if (item.slot) {
      // Equippable item — equip it (swaps with current)
      GameState.equipItem(idx);
      this.sound.play('sfx-equip', { volume: 0.4 });
      this._refresh();
    } else if (item.consumable && item.healAmount) {
      // Consumable — eat to heal
      const p = GameState.player;
      if (p.hp >= p.maxHp) return; // already full
      p.hp = Math.min(p.maxHp, p.hp + item.healAmount);
      item.qty -= 1;
      if (item.qty <= 0) GameState.inventory[idx] = null;
      this.sound.play('sfx-pickup', { volume: 0.4 });
      this._refresh();
    }
  }

  _onEquipSlotClick(slotName) {
    if (GameState.unequipItem(slotName)) {
      this.sound.play('sfx-equip', { volume: 0.4 });
      this._refresh();
    }
  }

  _showItemTooltip(item) {
    if (!item) { this.tooltip.setText(''); return; }
    let text = item.name;
    if (item.stats) {
      const parts = [];
      if (item.stats.attack)  parts.push(`+${item.stats.attack} ATK`);
      if (item.stats.defense) parts.push(`+${item.stats.defense} DEF`);
      if (item.stats.maxHp)   parts.push(`+${item.stats.maxHp} HP`);
      if (item.stats.speed)   parts.push(`+${item.stats.speed} SPD`);
      if (parts.length) text += '  ' + parts.join(' ');
    }
    if (item.consumable && item.healAmount) {
      text += `  Heals ${item.healAmount} HP`;
    }
    this.tooltip.setText(text);
  }

  _statSummary() {
    const p = GameState.player;
    const atkBonus = GameState.equipBonus('attack');
    const defBonus = GameState.equipBonus('defense');
    const hpBonus  = GameState.equipBonus('maxHp');
    return [
      `ATK ${p.attack}` + (atkBonus ? ` (+${atkBonus})` : ''),
      `DEF ${p.defense}` + (defBonus ? ` (+${defBonus})` : ''),
      `HP  ${p.maxHp}` + (hpBonus ? ` (+${hpBonus})` : ''),
    ].join('\n');
  }

  _refresh() {
    this.scene.restart();
  }

  _close() {
    this.sound.play('sfx-menu', { volume: 0.3 });
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
