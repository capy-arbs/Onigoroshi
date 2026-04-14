const TREE_SPAWNS = [
  { x: 48,  y: 48  },
  { x: 262, y: 52  },
  { x: 105, y: 210 },
];

const TREE_HP          = 5;  // hits to fell
const TREE_RESPAWN_MS  = 12000;
const TREE_CHOP_EXP    = 8;
const TREE_HIT_RADIUS  = 22;

class Tree {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x     = x;
    this.y     = y;
    this.hp    = TREE_HP;
    this.state = 'alive'; // alive | stump

    // Tree sprite — centred on position
    this.treeSprite  = scene.add.image(x, y, 'tree').setOrigin(0.5).setDepth(y);
    this.stumpSprite = scene.add.image(x, y, 'stump').setOrigin(0.5).setDepth(y).setVisible(false);
  }

  // Called by GameScene when the slash FX overlaps this tree
  chop(scene) {
    if (this.state !== 'alive') return false;

    this.hp--;

    // Flash
    scene.tweens.add({ targets: this.treeSprite, alpha: 0.4, duration: 70, yoyo: true });

    // Floating chop text
    this._floatText(scene, '+WC exp');

    // Woodcutting exp
    const wc = GameState.skills.woodcutting;
    wc.totalExp += TREE_CHOP_EXP;
    const wcGained = GameState.checkSkillLevelUp('woodcutting');
    if (wcGained > 0) {
      this._floatText(scene, `WC LV${wc.level}!`, '#ffee44');
    }

    if (this.hp <= 0) this._fell(scene);
    return true;
  }

  // Distance from attack hit point to tree trunk centre
  distanceTo(hitX, hitY) {
    return Phaser.Math.Distance.Between(hitX, hitY, this.x, this.y);
  }

  isChopping(hitX, hitY) {
    return this.state === 'alive' && this.distanceTo(hitX, hitY) < TREE_HIT_RADIUS;
  }

  // ── Private ──────────────────────────────────────────────────────────────────
  _fell(scene) {
    this.state = 'stump';
    this.treeSprite.setVisible(false);
    this.stumpSprite.setVisible(true);

    // Give wood
    const woodAmt = 1 + Math.floor(GameState.skills.woodcutting.level / 3);
    this._giveWood(woodAmt);
    this._floatText(scene, `+${woodAmt} Wood`, '#d4a855');

    // Respawn
    scene.time.delayedCall(TREE_RESPAWN_MS, () => this._respawn());
  }

  _respawn() {
    this.state = 'alive';
    this.hp    = TREE_HP;
    this.treeSprite.setVisible(true);
    this.stumpSprite.setVisible(false);
  }

  _giveWood(amount) {
    const existing = GameState.inventory.find(s => s && s.name === 'Wood');
    if (existing) {
      existing.qty += amount;
    } else {
      const slot = GameState.inventory.findIndex(s => s === null);
      if (slot !== -1) GameState.inventory[slot] = { name: 'Wood', key: 'wood-item', qty: amount };
    }
  }

  _floatText(scene, msg, color = '#88dd88') {
    const txt = scene.add.text(this.x, this.y - 20, msg, {
      fontSize: '6px', fontFamily: 'monospace', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(50);

    scene.tweens.add({
      targets: txt, y: txt.y - 18, alpha: 0,
      duration: 900, ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }
}
