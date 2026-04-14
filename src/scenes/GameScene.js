const ASSET_BASE = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/Actor/Character/Samurai/SeparateAnim/';
const FX_BASE    = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/FX/Attack/';
const AUDIO_BASE = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/Audio/';

// WALK_FRAMES and IDLE_FRAME live in gamestate.js (shared with NPCs + enemies)
const ATTACK_FRAME = { down: 0, up: 1, left: 2, right: 3 };

const SPEED               = 80;
const FRAME_DURATION      = 1000 / 6;
const ATTACK_FRAME_DURATION = 1000 / 10;
const ATTACK_TOTAL_FRAMES = 4;
const SLASH_HIT_RADIUS    = 20;
const PLAYER_CONTACT_DIST = 10;
const INVINCIBLE_DURATION = 900;

const SLASH_CFG = {
  down:  { ox: 0,   oy: 12,  angle: 90  },
  up:    { ox: 0,   oy: -12, angle: -90 },
  right: { ox: 12,  oy: 0,   angle: 0   },
  left:  { ox: -12, oy: 0,   angle: 180 },
};

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  preload() {
    this.load.image('grass', 'assets/tiles/grass.png');
    this.load.spritesheet('samurai-walk',   ASSET_BASE + 'Walk.png',   { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('samurai-attack', ASSET_BASE + 'Attack.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('fx-slash', FX_BASE + 'SlashCurved/SpriteSheet.png', { frameWidth: 32, frameHeight: 32 });

    NPC_DEFS.forEach(def => {
      this.load.spritesheet(def.key + '-walk', def.spritePath, { frameWidth: 16, frameHeight: 16 });
    });
    Object.values(ENEMY_TYPES).forEach(def => {
      this.load.spritesheet(def.key, def.spritePath, { frameWidth: 16, frameHeight: 16 });
    });

    // Boss sprites
    Object.values(BOSS_TYPES).forEach(def => {
      this.load.spritesheet(def.key, def.idlePath, { frameWidth: def.frameWidth, frameHeight: def.frameHeight });
    });

    this.load.image('tree',      'assets/tiles/tree.png');
    this.load.image('stump',     'assets/tiles/stump.png');
    this.load.image('wood-item', 'assets/tiles/wood-item.png');

    // Item drop sprites
    Object.values(ITEM_DEFS).forEach(def => {
      this.load.image(def.key, def.path);
    });

    // ── Skill station sprites ────────────────────────────────────────
    const SKB = 'assets/sprites/ninja-adventure/Ninja Adventure - Asset Pack/';
    this.load.spritesheet('water-ripple', SKB + 'Backgrounds/Animated/Water Ripples/SpriteSheet16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('fire-anim',    SKB + 'FX/Particle/Fire.png', { frameWidth: 12, frameHeight: 12 });
    this.load.image('mine-rock',       'assets/tiles/mine-rock.png');
    this.load.image('mine-rock-empty', 'assets/tiles/mine-rock-empty.png');
    this.load.image('anvil',           SKB + 'Items/Tool/Anvil.png');
    this.load.image('shrine-stone',    SKB + 'Items/Scroll/ScrollRock.png');
    this.load.image('mortar',          SKB + 'Items/Object/Gourd.png');
    this.load.image('craft-bench',     SKB + 'Items/Object/CrateEmpty.png');
    this.load.image('agility-post',    'assets/tiles/agility-post.png');
    this.load.image('house1',          'assets/tiles/house1.png');
    this.load.image('house2',          'assets/tiles/house2.png');
    this.load.image('house3',          'assets/tiles/house3.png');
    this.load.image('torii',           'assets/tiles/torii.png');
    this.load.image('water',           'assets/tiles/water.png');

    // ── Audio ────────────────────────────────────────────────────────
    this.load.audio('bgm',          AUDIO_BASE + 'Musics/1 - Adventure Begin.ogg');
    this.load.audio('sfx-slash',    AUDIO_BASE + 'Sounds/Whoosh & Slash/Slash.wav');
    this.load.audio('sfx-hit',      AUDIO_BASE + 'Sounds/Hit & Impact/Hit1.wav');
    this.load.audio('sfx-kill',     AUDIO_BASE + 'Sounds/Hit & Impact/Hit6.wav');
    this.load.audio('sfx-hurt',     AUDIO_BASE + 'Sounds/Hit & Impact/Impact.wav');
    this.load.audio('sfx-pickup',   AUDIO_BASE + 'Sounds/Bonus/Coin.wav');
    this.load.audio('sfx-chop',     AUDIO_BASE + 'Sounds/Hit & Impact/Hit2.wav');
    this.load.audio('sfx-levelup',  AUDIO_BASE + 'Jingles/LevelUp1.wav');
    this.load.audio('sfx-gameover', AUDIO_BASE + 'Jingles/GameOver.wav');
    this.load.audio('sfx-menu',     AUDIO_BASE + 'Sounds/Menu/Menu5.wav');
    this.load.audio('sfx-accept',   AUDIO_BASE + 'Sounds/Menu/Accept.wav');
    this.load.audio('sfx-equip',    AUDIO_BASE + 'Sounds/Menu/Accept5.wav');
  }

  init(data) {
    // data.spawnPos is set when transitioning between areas
    this._spawnPos = data && data.spawnPos ? data.spawnPos : null;
  }

  create() {
    const area = AREAS[GameState.currentArea];

    // ── Ground tile ──────────────────────────────────────────────────
    const ground = this.add.tileSprite(0, 0, 320, 240, area.tile).setOrigin(0, 0);
    if (area.tint) ground.setTint(area.tint);

    // ── Decorations (buildings, pond, etc.) ─────────────────────────
    this.solidGroup = this.physics.add.staticGroup();

    (area.decorations || []).forEach(d => {
      if (d.tile) {
        // Tiled rectangle (e.g. pond)
        for (let tx = 0; tx < d.w; tx += 16) {
          for (let ty = 0; ty < d.h; ty += 16) {
            this.add.image(d.x + tx + 8, d.y + ty + 8, d.tile).setDepth(0.1);
          }
        }
        // Pond collision — block the whole area
        if (d.solid !== false) {
          const blocker = this.add.zone(d.x + d.w / 2, d.y + d.h / 2, d.w, d.h);
          this.physics.add.existing(blocker, true);
          this.solidGroup.add(blocker);
        }
      } else {
        const img = this.add.image(d.x, d.y, d.key).setOrigin(0.5, 1).setDepth(d.y);
        // Building collision
        if (d.solid !== false) {
          const bw = img.width;
          const bh = img.height;
          const blocker = this.add.zone(d.x, d.y - bh / 2, bw, bh);
          this.physics.add.existing(blocker, true);
          this.solidGroup.add(blocker);
        }
      }
    });

    // ── Camera fade in ──────────────────────────────────────────────
    this.cameras.main.fadeIn(250, 0, 0, 0);

    // ── Player ───────────────────────────────────────────────────────
    const spawnX = this._spawnPos ? this._spawnPos.x : 160;
    const spawnY = this._spawnPos ? this._spawnPos.y : 120;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'samurai-walk', 0);
    this.player.setDepth(1);
    this.player.setCollideWorldBounds(false);

    // Collide with solid decorations (buildings, pond)
    this.physics.add.collider(this.player, this.solidGroup);

    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.iKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.cKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.eKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.sKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.tKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.fKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.pickpocketCooldown = 0;

    // ── Spawn area entities from area data ───────────────────────────
    this.npcs = area.npcs.map(npcSpawn => {
      const def = { ...NPC_DEFS[npcSpawn.defIndex], x: npcSpawn.x, y: npcSpawn.y };
      return new NPC(this, def);
    });
    this.enemies      = area.enemies.map(s => new Enemy(this, s.type, s.x, s.y));

    // ── Boss ─────────────────────────────────────────────────────────
    this.boss = null;
    if (area.boss) {
      const bDef = BOSS_TYPES[area.boss.type];
      if (bDef) {
        this.boss = this.physics.add.sprite(area.boss.x, area.boss.y, bDef.key, 0);
        this.boss.setDepth(5).setCollideWorldBounds(true);
        if (!this.anims.exists(bDef.key + '-idle')) {
          const frameCount = Math.floor(this.textures.get(bDef.key).getSourceImage().width / bDef.frameWidth);
          this.anims.create({
            key: bDef.key + '-idle',
            frames: this.anims.generateFrameNumbers(bDef.key, { start: 0, end: frameCount - 1 }),
            frameRate: 4, repeat: -1,
          });
        }
        this.boss.play(bDef.key + '-idle');
        this.boss.setData('def', bDef);
        this.boss.setData('hp', bDef.hp);
        this.boss.setData('maxHp', bDef.hp);

        // Boss HP bar graphics
        this.bossHpBg = this.add.graphics();
        this.bossHpFg = this.add.graphics();
      }
    }
    this.trees        = area.trees.map(s => new Tree(this, s.x, s.y));
    this.groundItems  = [];
    this.fishingSpots = (area.fishingSpots || []).map(s => new FishingSpot(this, s.x, s.y));
    this.miningRocks  = (area.miningRocks || []).map(s => new MiningRock(this, s.x, s.y));
    this.cookingFires = (area.cookingFires || []).map(s => new CookingFire(this, s.x, s.y));
    this.anvils       = (area.anvils || []).map(s => new SmithingAnvil(this, s.x, s.y));
    this.shrines      = (area.shrines || []).map(s => new MeditationShrine(this, s.x, s.y));
    this.mortars      = (area.mortars || []).map(s => new HerbalismMortar(this, s.x, s.y));
    this.craftBenches = (area.craftBenches || []).map(s => new CraftingBench(this, s.x, s.y));
    this.agilityCourse = area.agilityCourse ? new AgilityCourse(this, area.agilityCourse) : null;

    if (!this.anims.exists('slash')) {
      this.anims.create({
        key: 'slash',
        frames: this.anims.generateFrameNumbers('fx-slash', { start: 0, end: 3 }),
        frameRate: 12, repeat: 0,
      });
    }

    // Player state
    this.lastDir      = 'down';
    this.animFrame    = 0;
    this.animTimer    = 0;
    this.isAttacking  = false;
    this.attackFrame  = 0;
    this.attackTimer  = 0;
    this.slashSprite  = null;
    this.isInvincible = false;
    this.transitioning = false;

    // ── Music ─────────────────────────────────────────────────────────
    if (!this.sound.get('bgm')) {
      this.sound.add('bgm', { loop: true, volume: 0.3 }).play();
    }

    // ── HUD is now DOM-based (see main.js + index.html) ────────────
    updateDOMHud();

    // ── Area name flash (DOM) ────────────────────────────────────────
    domFloat(160, 40, area.name, '#ffffff', 2000);
  }

  update(time, delta) {
    // ── HUD ──────────────────────────────────────────────────────────
    this._updateHUD();

    // ── Buff ticking (meditation) ───────────────────────────────────
    if (!GameState.buffs) GameState.buffs = { attack: 0, defense: 0, hpRegen: 0, buffTimer: 0 };
    const buffs = GameState.buffs;
    if (buffs.buffTimer > 0) {
      buffs.buffTimer -= delta;
      // HP regen tick
      if (buffs.hpRegen > 0) {
        GameState.player.hp = Math.min(GameState.player.maxHp,
          GameState.player.hp + buffs.hpRegen * (delta / 1000));
      }
      if (buffs.buffTimer <= 0) {
        buffs.attack = 0; buffs.defense = 0; buffs.hpRegen = 0; buffs.buffTimer = 0;
        GameState.recalcStats();
      }
    }

    // ── E key (single check, NPC dialog takes priority) ────────────
    let eJustDown = Phaser.Input.Keyboard.JustDown(this.eKey);

    // ── NPCs ─────────────────────────────────────────────────────────
    let nearbyNPC = null;
    this.npcs.forEach(npc => {
      npc.update(delta, this.player.x, this.player.y);
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.sprite.x, npc.sprite.y);
      if (d < INTERACT_DIST && (!nearbyNPC ||
          d < Phaser.Math.Distance.Between(this.player.x, this.player.y, nearbyNPC.sprite.x, nearbyNPC.sprite.y))) {
        nearbyNPC = npc;
      }
    });

    if (nearbyNPC && eJustDown) {
      eJustDown = false; // consumed by NPC

      // Slayer Master — assign or report task
      if (nearbyNPC.def.isSlayerMaster) {
        this._handleSlayerMaster(nearbyNPC);
        return;
      }

      // Shop — open shop screen
      if (nearbyNPC.def.isShop) {
        showShopScreen();
        return;
      }

      this.scene.pause();
      this.scene.launch('DialogScene', {
        name: nearbyNPC.def.name, spriteKey: nearbyNPC.def.key + '-walk', dialog: nearbyNPC.def.dialog,
      });
      return;
    }

    // ── Pickpocket NPC (T key) ───────────────────────────────────────
    if (this.pickpocketCooldown > 0) this.pickpocketCooldown -= delta;
    if (nearbyNPC && Phaser.Input.Keyboard.JustDown(this.tKey) && this.pickpocketCooldown <= 0) {
      this.pickpocketCooldown = PICKPOCKET_COOLDOWN;
      attemptPickpocket(this, nearbyNPC);
    }

    // ── Enemies ──────────────────────────────────────────────────────
    const prevLevel = GameState.player.level;
    this.enemies.forEach(enemy => {
      enemy.update(delta, this.player.x, this.player.y);

      // Contact damage
      if (enemy.isAlive() && !this.isInvincible) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
        if (d < PLAYER_CONTACT_DIST) {
          this._playerTakeDamage(enemy);
        }
      }
    });

    // ── Boss contact damage + HP bar ──────────────────────────────
    if (this.boss && this.boss.active) {
      const bDef = this.boss.getData('def');
      // Chase player
      const bDist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      if (bDist < bDef.aggroRange) {
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        this.boss.setVelocity(Math.cos(angle) * bDef.speed, Math.sin(angle) * bDef.speed);
      } else {
        this.boss.setVelocity(0, 0);
      }
      // Contact damage
      if (bDist < 20 && !this.isInvincible) {
        this._playerTakeDamage({ def: bDef, sprite: this.boss });
      }
      // HP bar
      const bhp = this.boss.getData('hp'), bmhp = this.boss.getData('maxHp');
      const bbw = 40, bbh = 3;
      const bbx = this.boss.x - 20, bby = this.boss.y - 30;
      this.bossHpBg.clear(); this.bossHpFg.clear();
      this.bossHpBg.fillStyle(0x440000); this.bossHpBg.fillRect(bbx, bby, bbw, bbh);
      this.bossHpFg.fillStyle(0xff2222); this.bossHpFg.fillRect(bbx, bby, Math.max(0, (bhp / bmhp) * bbw), bbh);
    }

    // Check for level-up after enemy updates (kills award XP)
    const gained = GameState.checkLevelUp();
    if (gained > 0) {
      this._floatTextOnPlayer(`LEVEL UP! LV${GameState.player.level}`, '#ffee44');
      this.sound.play('sfx-levelup', { volume: 0.5 });
    }

    // ── Ground item pickups ──────────────────────────────────────────
    this.groundItems = this.groundItems.filter(gi => {
      gi.update(this.player.x, this.player.y);
      return !gi.picked;
    });

    // ── Skill stations ───────────────────────────────────────────────
    this.fishingSpots.forEach(s => s.update(delta, this.player.x, this.player.y, eJustDown));
    this.cookingFires = this.cookingFires.filter(s => !!s.sprite);
    this.cookingFires.forEach(s => s.update(delta, this.player.x, this.player.y, eJustDown));
    this.anvils.forEach(s => s.update(delta, this.player.x, this.player.y, eJustDown));
    this.shrines.forEach(s => s.update(delta, this.player.x, this.player.y, eJustDown));
    this.mortars.forEach(s => s.update(delta, this.player.x, this.player.y, eJustDown));
    this.craftBenches.forEach(s => s.update(delta, this.player.x, this.player.y, eJustDown));
    if (this.agilityCourse) this.agilityCourse.update(delta, this.player.x, this.player.y);

    // ── Overlay screens ───────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.sound.play('sfx-menu', { volume: 0.4 });
      this.scene.pause(); this.scene.launch('InventoryScene'); return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
      this.sound.play('sfx-menu', { volume: 0.4 });
      this.scene.pause(); this.scene.launch('CharacterScene'); return;
    }

    // ── Manual save ──────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.sKey)) {
      GameState.save();
      this._floatTextOnPlayer('Game Saved', '#88ff88');
      this.sound.play('sfx-accept', { volume: 0.3 });
    }

    // ── Firemaking (F key) ───────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
      const fire = attemptFiremaking(this, this.player.x, this.player.y);
      if (fire) this.cookingFires.push(fire);
    }

    // ── Attack ────────────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isAttacking) {
      this.isAttacking = true;
      this.attackFrame = 0;
      this.attackTimer = 0;
      this.sound.play('sfx-slash', { volume: 0.4 });

      const cfg = SLASH_CFG[this.lastDir];
      const hitX = this.player.x + cfg.ox;
      const hitY = this.player.y + cfg.oy;

      // Hit enemies within slash radius
      let hitAny = false;
      this.enemies.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const d = Phaser.Math.Distance.Between(hitX, hitY, enemy.sprite.x, enemy.sprite.y);
        if (d < SLASH_HIT_RADIUS) {
          hitAny = true;
          enemy.takeDamage(GameState.player.attack);
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
          enemy.sprite.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
        }
      });

      if (hitAny) this.sound.play('sfx-hit', { volume: 0.5 });

      // Chop trees within slash radius
      this.trees.forEach(tree => {
        if (tree.isChopping(hitX, hitY)) {
          tree.chop(this);
          this.sound.play('sfx-chop', { volume: 0.35 });
        }
      });

      // Mine rocks within slash radius
      this.miningRocks.forEach(rock => {
        if (rock.isMineable(hitX, hitY)) {
          rock.mine(this);
          this.sound.play('sfx-chop', { volume: 0.35 });
        }
      });

      // Hit boss within slash radius
      if (this.boss && this.boss.active) {
        const bd = Phaser.Math.Distance.Between(hitX, hitY, this.boss.x, this.boss.y);
        if (bd < SLASH_HIT_RADIUS + 10) {
          let bhp = this.boss.getData('hp') - GameState.player.attack;
          this.boss.setData('hp', bhp);
          this.boss.setTint(0xff6666);
          this.time.delayedCall(150, () => { if (this.boss && this.boss.active) this.boss.clearTint(); });
          hitAny = true;

          if (bhp <= 0) {
            const bDef = this.boss.getData('def');
            GameState.player.totalExp += bDef.exp;
            GameState.gold += 100;
            domFloat(this.boss.x, this.boss.y, 'Oni Lord slain! +100 gold', '#ffcc44');
            domFloat(this.boss.x, this.boss.y - 20, `+${bDef.exp} XP`, '#ffee44');

            // Quest tracking
            if (GameState.activeQuest && GameState.activeQuest.goal === 'kill' && GameState.activeQuest.enemy === 'oni-boss') {
              GameState.activeQuest.progress++;
            }

            this.tweens.add({
              targets: this.boss, alpha: 0, duration: 500,
              onComplete: () => {
                this.boss.destroy();
                this.bossHpBg.destroy();
                this.bossHpFg.destroy();
                this.boss = null;
                // Respawn boss after 60 seconds
                this.time.delayedCall(60000, () => {
                  if (AREAS[GameState.currentArea].boss) {
                    // Will respawn on next area enter
                  }
                });
              },
            });
          }
        }
      }

      this.slashSprite = this.add.sprite(hitX, hitY, 'fx-slash');
      this.slashSprite.setAngle(cfg.angle);
      this.slashSprite.play('slash');
      this.slashSprite.once('animationcomplete', () => {
        this.slashSprite.destroy();
        this.slashSprite = null;
        this.isAttacking = false;
      });
    }

    if (this.slashSprite) {
      const cfg = SLASH_CFG[this.lastDir];
      this.slashSprite.setPosition(this.player.x + cfg.ox, this.player.y + cfg.oy);
    }

    // ── Movement ──────────────────────────────────────────────────────
    this.player.setVelocity(0);

    if (this.isAttacking) {
      this.attackTimer += delta;
      if (this.attackTimer >= ATTACK_FRAME_DURATION) {
        this.attackTimer -= ATTACK_FRAME_DURATION;
        this.attackFrame  = Math.min(this.attackFrame + 1, ATTACK_TOTAL_FRAMES - 1);
      }
      this.player.setTexture('samurai-attack', ATTACK_FRAME[this.lastDir]);
      return;
    }

    let moving = false, newDir = this.lastDir;
    const spd = SPEED + getAgilitySpeedBonus();

    if (this.cursors.left.isDown)       { this.player.setVelocityX(-spd); newDir = 'left';  moving = true; }
    else if (this.cursors.right.isDown) { this.player.setVelocityX(spd);  newDir = 'right'; moving = true; }
    else if (this.cursors.up.isDown)    { this.player.setVelocityY(-spd); newDir = 'up';    moving = true; }
    else if (this.cursors.down.isDown)  { this.player.setVelocityY(spd);  newDir = 'down';  moving = true; }

    if (moving) {
      if (newDir !== this.lastDir) { this.lastDir = newDir; this.animFrame = 0; this.animTimer = 0; }
      this.animTimer += delta;
      if (this.animTimer >= FRAME_DURATION) { this.animTimer -= FRAME_DURATION; this.animFrame = (this.animFrame + 1) % 4; }
      this.player.setTexture('samurai-walk', WALK_FRAMES[this.lastDir][this.animFrame]);
    } else {
      this.animFrame = 0; this.animTimer = 0;
      this.player.setTexture('samurai-walk', IDLE_FRAME[this.lastDir]);
    }

    // ── Clamp player to edges without exits ─────────────────────────
    const exits = AREAS[GameState.currentArea].exits;
    if (!exits.west  && this.player.x < 4)   this.player.x = 4;
    if (!exits.east  && this.player.x > 316) this.player.x = 316;
    if (!exits.north && this.player.y < 4)   this.player.y = 4;
    if (!exits.south && this.player.y > 236) this.player.y = 236;

    // ── Area transitions ─────────────────────────────────────────────
    if (!this.transitioning) {
      this._checkAreaTransition();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _playerTakeDamage(enemy) {
    GameState.player.hp = Math.max(0, GameState.player.hp - enemy.def.damage);
    this.isInvincible   = true;
    this.sound.play('sfx-hurt', { volume: 0.5 });

    // Knockback
    const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
    this.player.setVelocity(Math.cos(angle) * 110, Math.sin(angle) * 110);

    // Blink effect
    this.tweens.add({
      targets: this.player, alpha: 0.3,
      duration: 90, yoyo: true, repeat: 4,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvincible = false;
      },
    });

    if (GameState.player.hp <= 0) this._gameOver();
  }

  _gameOver() {
    this.sound.stopByKey('bgm');
    this.sound.play('sfx-gameover', { volume: 0.5 });
    this.scene.pause();
    this.scene.launch('GameOverScene');
  }

  _floatTextOnPlayer(msg, color = '#ffffff') {
    domFloat(this.player.x, this.player.y - 16, msg, color);
  }

  _handleSlayerMaster(npc) {
    const task = GameState.slayerTask;
    let dialog;

    if (!task) {
      // Assign new task
      const newTask = getSlayerTask();
      dialog = [
        "Greetings, demon hunter.",
        `Your task: slay ${newTask.remaining} ${newTask.enemy}s.`,
        "Return to me when the deed is done.",
      ];
    } else {
      // Has active task
      dialog = [
        `You still have ${task.remaining} ${task.enemy}s to slay.`,
        "Do not return until your duty is fulfilled.",
      ];
    }

    this.scene.pause();
    this.scene.launch('DialogScene', {
      name: npc.def.name, spriteKey: npc.def.key + '-walk', dialog,
    });
  }

  _checkAreaTransition() {
    const area = AREAS[GameState.currentArea];
    let exitDir = null;

    if (this.player.y <= 2  && area.exits.north) exitDir = 'north';
    if (this.player.y >= 238 && area.exits.south) exitDir = 'south';
    if (this.player.x <= 2  && area.exits.west)  exitDir = 'west';
    if (this.player.x >= 318 && area.exits.east)  exitDir = 'east';

    if (!exitDir) return;

    this.transitioning = true;
    this.player.setVelocity(0);

    const targetArea = area.exits[exitDir];
    const enterDir   = OPPOSITE_DIR[exitDir];
    const spawnPos   = EXIT_SPAWN[enterDir];

    // Fade out → switch area → auto-save → fade in
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      GameState.currentArea = targetArea;
      GameState.save();
      this.scene.restart({ spawnPos });
    });
  }

  _updateHUD() {
    updateDOMHud();
  }
}
