// Auto-load save data before game starts
GameState.load();

const config = {
  type: Phaser.AUTO,
  width: 320,
  height: 240,
  zoom: 4,
  pixelArt: true,
  parent: 'game-wrapper',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [GameScene, InventoryScene, CharacterScene, DialogScene, GameOverScene],
};

const game = new Phaser.Game(config);

// Ensure DOM overlays sit above the Phaser canvas
requestAnimationFrame(() => {
  const wrapper = document.getElementById('game-wrapper');
  const canvas = wrapper.querySelector('canvas');
  if (canvas) { canvas.style.position = 'relative'; canvas.style.zIndex = '1'; }
});

// ── DOM helpers ──────────────────────────────────────────────────────────────
const ZOOM = 4;

function updateDOMHud() {
  const p = GameState.player;
  document.getElementById('hp-fill').style.width = Math.max(0, (p.hp / p.maxHp) * 100) + '%';
  document.getElementById('hp-text').textContent = `${Math.floor(p.hp)}/${p.maxHp}`;

  const currentLevelXP = p.level > 1 ? XP_TABLE[p.level - 1] : 0;
  const nextLevelXP = p.level < MAX_LEVEL ? XP_TABLE[p.level] : currentLevelXP;
  const expRange = nextLevelXP - currentLevelXP;
  const expPct = expRange > 0 ? ((p.totalExp - currentLevelXP) / expRange) * 100 : 100;
  document.getElementById('exp-fill').style.width = Math.max(0, expPct) + '%';
  document.getElementById('exp-text').textContent = `${p.totalExp - currentLevelXP}/${expRange}`;

  document.getElementById('hud-level').textContent = `LV ${p.level}`;
  const area = AREAS[GameState.currentArea];
  document.getElementById('hud-area').textContent = area ? area.name : '';
}

function domFloat(gameX, gameY, msg, color, duration) {
  duration = duration || 1200;
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = msg;
  el.style.color = color || '#ffffff';
  el.style.left = (gameX * ZOOM) + 'px';
  el.style.top = (gameY * ZOOM) + 'px';
  el.style.animationDuration = duration + 'ms';
  document.getElementById('float-container').appendChild(el);
  setTimeout(() => el.remove(), duration + 50);
}

// ── Character Screen (DOM) ───────────────────────────────────────────────────
function showCharScreen() {
  const el = document.getElementById('char-screen');
  const p = GameState.player;

  const currentLevelXP = p.level > 1 ? XP_TABLE[p.level - 1] : 0;
  const nextLevelXP = p.level < MAX_LEVEL ? XP_TABLE[p.level] : currentLevelXP;
  const expRange = nextLevelXP - currentLevelXP;
  const expPct = expRange > 0 ? ((p.totalExp - currentLevelXP) / expRange) * 100 : 100;

  const statRow = (label, val, bonus, cls, maxVal) => {
    const pct = Math.min(100, (val / (maxVal || 40)) * 100);
    const bonusHtml = bonus > 0 ? ` <span class="bonus">(+${bonus})</span>` : '';
    return `<div class="stat-row">
      <span class="stat-label">${label}</span>
      <div class="stat-bar-bg"><div class="stat-bar-fill ${cls}" style="width:${pct}%"></div></div>
      <span class="stat-val">${val}${bonusHtml}</span>
    </div>`;
  };

  const skillList = [
    { name: 'Woodcutting', key: 'woodcutting', color: '#d4a855' },
    { name: 'Fishing',     key: 'fishing',     color: '#88ccff' },
    { name: 'Mining',      key: 'mining',      color: '#ccaa66' },
    { name: 'Cooking',     key: 'cooking',     color: '#ffaa44' },
    { name: 'Smithing',    key: 'smithing',    color: '#aaaacc' },
    { name: 'Firemaking',  key: 'firemaking',  color: '#ff8833' },
    { name: 'Meditation',  key: 'meditation',  color: '#cc88ff' },
    { name: 'Slayer',      key: 'slayer',      color: '#ff4488' },
    { name: 'Herbalism',   key: 'herbalism',   color: '#88dd88' },
    { name: 'Crafting',    key: 'crafting',    color: '#ddaa66' },
    { name: 'Agility',     key: 'agility',     color: '#44dddd' },
    { name: 'Thieving',    key: 'thieving',    color: '#ffdd44' },
  ];

  const skillRows = skillList.map(sk => {
    const s = GameState.skills[sk.key];
    const skCur = s.level > 1 ? XP_TABLE[s.level - 1] : 0;
    const skNext = s.level < MAX_LEVEL ? XP_TABLE[s.level] : skCur;
    const skRange = skNext - skCur;
    const skPct = skRange > 0 ? ((s.totalExp - skCur) / skRange) * 100 : 100;
    return `<div>
      <div class="skill-row"><span class="skill-name" style="color:${sk.color}">${sk.name}</span><span class="skill-lv">${s.level}</span></div>
      <div class="skill-bar-bg"><div class="skill-bar-fill" style="width:${skPct}%"></div></div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="screen-bg"></div>
    <div class="screen-panel" style="min-width:600px;max-width:700px;">
      <h2>CHARACTER</h2>
      <div class="char-top">
        <div class="char-info">
          <div class="char-name">${p.name}</div>
          <div class="char-level">Level ${p.level}</div>
        </div>
      </div>
      ${statRow('HP', Math.floor(p.hp) + '/' + p.maxHp, 0, 'hp', p.maxHp)}
      ${statRow('EXP', Math.round(expPct) + '%', 0, 'exp', 100)}
      ${statRow('ATK', p.attack, GameState.equipBonus('attack'), 'atk', 60)}
      ${statRow('DEF', p.defense, GameState.equipBonus('defense'), 'def', 60)}
      ${statRow('SPD', p.speed, GameState.equipBonus('speed'), 'spd', 40)}
      <div class="skills-header">SKILLS</div>
      <div class="skills-grid">${skillRows}</div>
      <div class="hint">[C] or [ESC] to close</div>
    </div>`;
  el.classList.add('active');
}

function hideCharScreen() {
  const el = document.getElementById('char-screen');
  el.classList.remove('active');
  el.innerHTML = '';
}

// ── Dialog Screen (DOM) ──────────────────────────────────────────────────────
let _dialogLines = [];
let _dialogIdx = 0;
let _dialogCallback = null;

function showDialog(name, lines, onClose) {
  _dialogLines = lines;
  _dialogIdx = 0;
  _dialogCallback = onClose;
  _renderDialogLine(name);
  document.getElementById('dialog-screen').classList.add('active');
}

function _renderDialogLine(name) {
  const el = document.getElementById('dialog-screen');
  const isLast = _dialogIdx >= _dialogLines.length - 1;
  el.innerHTML = `
    <div class="screen-bg"></div>
    <div class="screen-panel">
      <div class="dialog-body">
        <div class="dialog-name">${name}</div>
        <div class="dialog-text">${_dialogLines[_dialogIdx]}</div>
        <div class="dialog-hint">${isLast ? '[E/SPACE] Close' : '[E/SPACE] Next ▼'}</div>
      </div>
    </div>`;
}

function advanceDialog(name) {
  _dialogIdx++;
  if (_dialogIdx >= _dialogLines.length) {
    hideDialog();
    if (_dialogCallback) _dialogCallback();
  } else {
    _renderDialogLine(name);
  }
}

function hideDialog() {
  const el = document.getElementById('dialog-screen');
  el.classList.remove('active');
  el.innerHTML = '';
  _dialogLines = [];
}

function isDialogOpen() {
  return document.getElementById('dialog-screen').classList.contains('active');
}

// ── Game Over Screen (DOM) ───────────────────────────────────────────────────
function showGameOver() {
  const el = document.getElementById('gameover-screen');
  el.innerHTML = `
    <div class="screen-bg"></div>
    <div class="screen-panel">
      <div class="death-title">YOU DIED</div>
      <div class="death-sub">Your inventory has been lost.</div>
      <div class="death-restart">Press R to respawn in Village</div>
    </div>`;
  el.classList.add('active');
}

function hideGameOver() {
  const el = document.getElementById('gameover-screen');
  el.classList.remove('active');
  el.innerHTML = '';
}

// ── Inventory Screen (DOM) ───────────────────────────────────────────────────
let _invRefreshCallback = null;

function showInvScreen(onRefresh) {
  _invRefreshCallback = onRefresh;
  _renderInvScreen();
  document.getElementById('inv-screen').classList.add('active');
}

function _renderInvScreen() {
  const el = document.getElementById('inv-screen');
  const inv = GameState.inventory;
  const eq = GameState.equipment;

  // Build inventory grid
  let gridHtml = '';
  for (let i = 0; i < 20; i++) {
    const item = inv[i];
    let inner = '';
    if (item) {
      const def = ITEM_DEFS[item.key];
      const imgPath = def ? def.path : '';
      inner = `<img src="${imgPath}" alt="${item.name}">`;
      if (item.qty > 1) inner += `<span class="qty">${item.qty}</span>`;
    }
    gridHtml += `<div class="inv-slot" data-inv-idx="${i}" title="">${inner}</div>`;
  }

  // Build equip slots
  const slotDefs = [
    { label: 'WPN', slotName: 'weapon' },
    { label: 'ARM', slotName: 'armor' },
    { label: 'ACC', slotName: 'accessory' },
  ];
  let eqHtml = '';
  slotDefs.forEach(sd => {
    const item = eq[sd.slotName];
    let inner = '';
    if (item) {
      const def = ITEM_DEFS[item.key];
      const imgPath = def ? def.path : '';
      inner = `<img src="${imgPath}" alt="${item.name}">`;
    } else {
      inner = `<span class="slot-label">${sd.label}</span>`;
    }
    eqHtml += `<div class="equip-slot" data-eq-slot="${sd.slotName}">${inner}</div>`;
  });

  // Stat summary
  const p = GameState.player;
  const atkB = GameState.equipBonus('attack');
  const defB = GameState.equipBonus('defense');
  const hpB  = GameState.equipBonus('maxHp');
  const statHtml = [
    `ATK ${p.attack}` + (atkB ? ` <span class="bonus">(+${atkB})</span>` : ''),
    `DEF ${p.defense}` + (defB ? ` <span class="bonus">(+${defB})</span>` : ''),
    `HP  ${p.maxHp}` + (hpB ? ` <span class="bonus">(+${hpB})</span>` : ''),
  ].join('<br>');

  el.innerHTML = `
    <div class="screen-bg"></div>
    <div class="screen-panel" style="min-width:340px;">
      <h2>INVENTORY</h2>
      <div class="inv-grid">${gridHtml}</div>
      <div class="equip-section">
        <div>
          <div style="font-size:12px;color:#8b7355;margin-bottom:4px;">EQUIPPED</div>
          <div class="equip-slots">${eqHtml}</div>
        </div>
        <div class="equip-stats">${statHtml}</div>
      </div>
      <div id="inv-tooltip"></div>
      <div class="hint">[I] or [ESC] to close</div>
    </div>`;

  // Attach click handlers
  el.querySelectorAll('.inv-slot').forEach(slot => {
    const idx = parseInt(slot.dataset.invIdx);
    slot.addEventListener('click', () => _onInvClick(idx));
    slot.addEventListener('mouseenter', () => _showInvTooltip(inv[idx]));
    slot.addEventListener('mouseleave', () => { document.getElementById('inv-tooltip').textContent = ''; });
  });
  el.querySelectorAll('.equip-slot').forEach(slot => {
    const slotName = slot.dataset.eqSlot;
    slot.addEventListener('click', () => _onEqClick(slotName));
    slot.addEventListener('mouseenter', () => _showInvTooltip(eq[slotName]));
    slot.addEventListener('mouseleave', () => { document.getElementById('inv-tooltip').textContent = ''; });
  });
}

function _onInvClick(idx) {
  const item = GameState.inventory[idx];
  if (!item) return;

  if (item.slot) {
    GameState.equipItem(idx);
    _renderInvScreen();
    if (_invRefreshCallback) _invRefreshCallback('sfx-equip');
  } else if (item.consumable) {
    if (item.buff) {
      GameState.buffs[item.buff] = item.buffAmount;
      GameState.buffs.buffTimer = item.buffDuration;
      GameState.recalcStats();
    }
    if (item.healAmount) {
      const p = GameState.player;
      if (!item.buff && p.hp >= p.maxHp) return;
      p.hp = Math.min(p.maxHp, p.hp + item.healAmount);
    }
    if (!item.buff && !item.healAmount) return;
    item.qty -= 1;
    if (item.qty <= 0) GameState.inventory[idx] = null;
    _renderInvScreen();
    if (_invRefreshCallback) _invRefreshCallback('sfx-pickup');
  }
}

function _onEqClick(slotName) {
  if (GameState.unequipItem(slotName)) {
    _renderInvScreen();
    if (_invRefreshCallback) _invRefreshCallback('sfx-equip');
  }
}

function _showInvTooltip(item) {
  const el = document.getElementById('inv-tooltip');
  if (!item) { el.textContent = ''; return; }
  let text = item.name;
  if (item.stats) {
    const parts = [];
    if (item.stats.attack)  parts.push(`+${item.stats.attack} ATK`);
    if (item.stats.defense) parts.push(`+${item.stats.defense} DEF`);
    if (item.stats.maxHp)   parts.push(`+${item.stats.maxHp} HP`);
    if (item.stats.speed)   parts.push(`+${item.stats.speed} SPD`);
    if (parts.length) text += '  ' + parts.join(' ');
  }
  if (item.consumable && item.healAmount) text += `  Heals ${item.healAmount} HP`;
  if (item.buff) text += `  +${item.buffAmount} ${item.buff.toUpperCase()} ${Math.round(item.buffDuration/1000)}s`;
  el.textContent = text;
}

function hideInvScreen() {
  const el = document.getElementById('inv-screen');
  el.classList.remove('active');
  el.innerHTML = '';
  _invRefreshCallback = null;
}

// ── World prompts (DOM) ──────────────────────────────────────────────────────
const _activePrompts = {};

function showWorldPrompt(id, gameX, gameY, text) {
  let el = _activePrompts[id];
  if (!el) {
    el = document.createElement('div');
    el.className = 'world-prompt';
    document.getElementById('prompt-container').appendChild(el);
    _activePrompts[id] = el;
  }
  el.textContent = text;
  el.style.left = (gameX * ZOOM) + 'px';
  el.style.top = ((gameY - 14) * ZOOM) + 'px';
  el.style.display = 'block';
}

function hideWorldPrompt(id) {
  const el = _activePrompts[id];
  if (el) el.style.display = 'none';
}
