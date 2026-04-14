class CharacterScene extends Phaser.Scene {
  constructor() { super({ key: 'CharacterScene' }); }

  preload() {
    // Samurai sprites already loaded by GameScene — no need to reload
  }

  create() {
    const W = 320, H = 240;
    const p = GameState.player;

    // ── Dim overlay ──────────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0);

    // ── Panel ────────────────────────────────────────────────────────
    const PW = 200, PH = 220;
    const PX = (W - PW) / 2, PY = (H - PH) / 2;

    const gfx = this.add.graphics();

    gfx.fillStyle(0x2d1f10);
    gfx.fillRoundedRect(PX, PY, PW, PH, 5);
    gfx.lineStyle(2, 0x8b4513);
    gfx.strokeRoundedRect(PX, PY, PW, PH, 5);

    gfx.fillStyle(0x5c3317);
    gfx.fillRoundedRect(PX, PY, PW, 18, { tl: 5, tr: 5, bl: 0, br: 0 });

    this.add.text(W / 2, PY + 9, 'CHARACTER', {
      fontSize: '8px', fontFamily: 'monospace', color: '#f5deb3',
    }).setOrigin(0.5);

    // ── Portrait area (left column) ───────────────────────────────────
    const portX = PX + 14, portY = PY + 26;
    gfx.fillStyle(0x0d0805);
    gfx.fillRoundedRect(portX, portY, 40, 40, 3);
    gfx.lineStyle(1, 0x8b4513);
    gfx.strokeRoundedRect(portX, portY, 40, 40, 3);

    // Samurai sprite in portrait (using idle down frame, scaled up)
    const portrait = this.add.image(portX + 20, portY + 20, 'samurai-walk', 0);
    portrait.setScale(2);

    // Name + level under portrait
    this.add.text(portX + 20, portY + 46, p.name, {
      fontSize: '7px', fontFamily: 'monospace', color: '#f5deb3',
    }).setOrigin(0.5);

    this.add.text(portX + 20, portY + 55, `LVL  ${p.level}`, {
      fontSize: '6px', fontFamily: 'monospace', color: '#c8a870',
    }).setOrigin(0.5);

    // ── Stats (right column) ──────────────────────────────────────────
    const SX = PX + 66, SY = PY + 26;
    const textStyle = { fontSize: '7px', fontFamily: 'monospace', color: '#f5deb3' };
    const dimStyle  = { fontSize: '7px', fontFamily: 'monospace', color: '#8b7355' };

    // HP bar
    this.add.text(SX, SY, 'HP', dimStyle);
    const hpBarX = SX + 18, hpBarY = SY + 1;
    const hpBarW = PW - (SX - PX) - 18, hpBarH = 7;
    gfx.fillStyle(0x440000);
    gfx.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 2);
    const hpFill = Math.max(0, (p.hp / p.maxHp) * hpBarW);
    gfx.fillStyle(0xcc2222);
    gfx.fillRoundedRect(hpBarX, hpBarY, hpFill, hpBarH, 2);
    this.add.text(hpBarX + hpBarW / 2, hpBarY + 3, `${p.hp}/${p.maxHp}`, {
      fontSize: '5px', fontFamily: 'monospace', color: '#ffaaaa',
    }).setOrigin(0.5);

    // EXP bar
    this.add.text(SX, SY + 13, 'EXP', dimStyle);
    const expBarX = SX + 18, expBarY = SY + 14;
    const currentLevelXP = p.level > 1 ? XP_TABLE[p.level - 1] : 0;
    const nextLevelXP = p.level < MAX_LEVEL ? XP_TABLE[p.level] : currentLevelXP;
    const expRange = nextLevelXP - currentLevelXP;
    const expProgress = expRange > 0 ? (p.totalExp - currentLevelXP) / expRange : 1;
    gfx.fillStyle(0x1a1a00);
    gfx.fillRoundedRect(expBarX, expBarY, hpBarW, hpBarH, 2);
    gfx.fillStyle(0xaaaa00);
    gfx.fillRoundedRect(expBarX, expBarY, Math.max(0, expProgress * hpBarW), hpBarH, 2);
    const expInLevel = p.totalExp - currentLevelXP;
    this.add.text(expBarX + hpBarW / 2, expBarY + 3, `${expInLevel}/${expRange}`, {
      fontSize: '5px', fontFamily: 'monospace', color: '#dddd88',
    }).setOrigin(0.5);

    // Stat rows (show equipment bonus in green)
    const statInfo = [
      ['ATK', p.attack, GameState.equipBonus('attack')],
      ['DEF', p.defense, GameState.equipBonus('defense')],
      ['SPD', p.speed, GameState.equipBonus('speed')],
    ];
    const statY = SY + 30;
    statInfo.forEach(([label, val, bonus], i) => {
      const y = statY + i * 16;
      this.add.text(SX, y, label, dimStyle);

      // Stat bar
      const barX = SX + 22, barW = hpBarW;
      gfx.fillStyle(0x1a1008);
      gfx.fillRoundedRect(barX, y + 1, barW, 6, 1);
      gfx.fillStyle(0x5c8a3c);
      gfx.fillRoundedRect(barX, y + 1, Math.min(barW, (val / 30) * barW), 6, 1);

      let valText = `${val}`;
      if (bonus > 0) valText += ` (+${bonus})`;
      this.add.text(barX + barW + 3, y + 3, valText, {
        fontSize: '6px', fontFamily: 'monospace', color: bonus > 0 ? '#88cc66' : '#c8a870',
      }).setOrigin(0, 0.5);
    });

    // ── Divider ───────────────────────────────────────────────────────
    const divY = PY + 26 + 82;
    gfx.lineStyle(1, 0x5c3317);
    gfx.lineBetween(PX + 8, divY, PX + PW - 8, divY);

    // ── Skills ────────────────────────────────────────────────────────
    this.add.text(PX + 8, divY + 5, 'SKILLS', dimStyle);

    const skillList = [
      { name: 'Woodcutting', key: 'woodcutting', color: '#d4a855' },
      { name: 'Fishing',     key: 'fishing',     color: '#88ccff' },
      { name: 'Mining',      key: 'mining',      color: '#ccaa66' },
      { name: 'Cooking',     key: 'cooking',     color: '#ffaa44' },
      { name: 'Smithing',    key: 'smithing',    color: '#aaaacc' },
      { name: 'Thieving',    key: 'thieving',    color: '#ffdd44' },
    ];

    const barW2 = PW - 22;
    skillList.forEach((sk, i) => {
      const skill = GameState.skills[sk.key];
      const skY = divY + 15 + i * 14;

      const skCurrentXP = skill.level > 1 ? XP_TABLE[skill.level - 1] : 0;
      const skNextXP = skill.level < MAX_LEVEL ? XP_TABLE[skill.level] : skCurrentXP;
      const skRange = skNextXP - skCurrentXP;
      const skProgress = skRange > 0 ? (skill.totalExp - skCurrentXP) / skRange : 1;

      this.add.text(PX + 10, skY, `${sk.name}`, {
        fontSize: '5px', fontFamily: 'monospace', color: sk.color,
      });
      this.add.text(PX + PW - 10, skY, `LV${skill.level}`, {
        fontSize: '5px', fontFamily: 'monospace', color: '#c8a870',
      }).setOrigin(1, 0);

      gfx.fillStyle(0x1a1008);
      gfx.fillRoundedRect(PX + 10, skY + 7, barW2, 4, 1);
      gfx.fillStyle(0x8b6523);
      gfx.fillRoundedRect(PX + 10, skY + 7, Math.min(barW2, skProgress * barW2), 4, 1);
    });

    // ── Close hint ────────────────────────────────────────────────────
    this.add.text(W / 2, PY + PH - 7, '[C] or [ESC] to close', {
      fontSize: '5px', fontFamily: 'monospace', color: '#6b5030',
    }).setOrigin(0.5);

    // ── Close listeners ───────────────────────────────────────────────
    this.input.keyboard.once('keydown-C',   () => this._close());
    this.input.keyboard.once('keydown-ESC', () => this._close());
  }

  _close() {
    this.sound.play('sfx-menu', { volume: 0.3 });
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
