/**
 * SpellTestMenu - Temporary UI for testing spells
 *
 * Creates an overlay menu for quickly switching between different spells
 * to test their effects in the game.
 */

export class SpellTestMenu {
  constructor(spellRegistry, player, game = null) {
    this.spellRegistry = spellRegistry;
    this.player = player;
    this.game = game; // Reference to game instance for spawning enemies
    this.container = null;
    this.isVisible = true;

    this.spells = [
      'FIREBALL',
      'SHADOW_BOLT',
      'THUNDER_STRIKE',
      'PYRO_EXPLOSION',
      'DASH_SHOCKWAVE',
      'CHAIN_LIGHTNING',
      'RING_OF_FIRE',
      'ICE_LANCE',
      'MAGIC_BULLET',
      'RING_OF_ICE',
      'SKULL_SHIELD'
    ];

    this.init();
  }

  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'spell-test-menu';
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    `;

    // Create title
    const title = document.createElement('div');
    title.textContent = 'SPELL TEST MENU';
    title.style.cssText = `
      font-weight: bold;
      margin-bottom: 15px;
      font-size: 16px;
      color: #ff9944;
      border-bottom: 2px solid #ff9944;
      padding-bottom: 5px;
    `;
    this.container.appendChild(title);

    // Create spell buttons
    this.spells.forEach((spellId) => {
      const button = document.createElement('button');
      button.textContent = this.formatSpellName(spellId);
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px;
        margin: 5px 0;
        background: #333;
        color: white;
        border: 1px solid #666;
        border-radius: 4px;
        cursor: pointer;
        font-family: monospace;
        font-size: 13px;
        transition: all 0.2s;
      `;

      button.addEventListener('mouseenter', () => {
        button.style.background = '#ff9944';
        button.style.borderColor = '#ff9944';
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = '#333';
        button.style.borderColor = '#666';
      });

      button.addEventListener('click', () => {
        this.equipSpell(spellId);
        this.highlightButton(button);
      });

      this.container.appendChild(button);
    });

    // Add ground type selector
    const groundLabel = document.createElement('div');
    groundLabel.textContent = 'GROUND TYPE';
    groundLabel.style.cssText = `
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 14px;
      color: #88ccff;
      border-bottom: 1px solid #88ccff;
      padding-bottom: 5px;
    `;
    this.container.appendChild(groundLabel);

    const groundSelect = document.createElement('select');
    groundSelect.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px;
      margin: 5px 0;
      background: #333;
      color: white;
      border: 1px solid #666;
      border-radius: 4px;
      cursor: pointer;
      font-family: monospace;
      font-size: 13px;
    `;

    const groundTypes = [
      'black', 'dark', 'bright', 'checkerboard',
      'void', 'neon', 'matrix', 'psychedelic',
      'glass', 'ice', 'water', 'mirror',
      'lava', 'rainbow', 'chrome',
      'aurora', 'nebula', 'plasma', 'ocean',
      'snow', 'crystal'
    ];

    groundTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = this.formatSpellName(type);
      if (type === 'black') option.selected = true;
      groundSelect.appendChild(option);
    });

    groundSelect.addEventListener('change', (e) => {
      this.changeGroundType(e.target.value);
    });

    this.container.appendChild(groundSelect);

    // Add spawn enemies button
    const spawnBtn = document.createElement('button');
    spawnBtn.textContent = 'Spawn Test Enemies';
    spawnBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px;
      margin-top: 15px;
      background: #882244;
      color: white;
      border: 1px solid #aa4466;
      border-radius: 4px;
      cursor: pointer;
      font-family: monospace;
      font-size: 12px;
    `;

    spawnBtn.addEventListener('click', () => {
      this.spawnTestEnemies();
    });

    this.container.appendChild(spawnBtn);

    // Add toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Hide Menu (F1)';
    toggleBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px;
      margin-top: 10px;
      background: #555;
      color: white;
      border: 1px solid #888;
      border-radius: 4px;
      cursor: pointer;
      font-family: monospace;
      font-size: 12px;
    `;

    toggleBtn.addEventListener('click', () => {
      this.toggle();
    });

    this.container.appendChild(toggleBtn);

    // Add to DOM
    document.body.appendChild(this.container);

    // Setup F1 hotkey
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  formatSpellName(spellId) {
    return spellId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  equipSpell(spellId) {
    try {
      // Initialize activeSpells array if needed
      if (!this.player.userData) {
        this.player.userData = {};
      }
      if (!this.player.userData.activeSpells) {
        this.player.userData.activeSpells = [];
      }

      // Check if spell already active
      const existingSpell = this.player.userData.activeSpells.find(s => s.spellKey === spellId);
      if (existingSpell) {
        // Remove spell instead (toggle behavior)
        const index = this.player.userData.activeSpells.indexOf(existingSpell);
        this.player.userData.activeSpells.splice(index, 1);
        console.log(`✅ Removed spell: ${this.formatSpellName(spellId)}`);
        this.showFeedback(`Removed: ${this.formatSpellName(spellId)}`);
        return;
      }

      // Create and add new spell instance
      const spellInstance = this.spellRegistry.createSpell(spellId, 1);
      if (!spellInstance) {
        console.error(`Failed to create spell: ${spellId}`);
        return;
      }

      this.player.userData.activeSpells.push(spellInstance);

      console.log(`✅ Added spell: ${this.formatSpellName(spellId)} (${this.player.userData.activeSpells.length} active)`);

      // Show feedback
      this.showFeedback(`Added: ${this.formatSpellName(spellId)}`);
    } catch (error) {
      console.error(`Failed to equip spell ${spellId}:`, error);
    }
  }

  highlightButton(button) {
    // Remove highlight from all buttons
    const buttons = this.container.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn !== button && !btn.textContent.includes('Hide')) {
        btn.style.background = '#333';
        btn.style.borderColor = '#666';
      }
    });

    // Highlight selected button
    button.style.background = '#44aa44';
    button.style.borderColor = '#44aa44';
  }

  showFeedback(message) {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(68, 170, 68, 0.9);
      color: white;
      padding: 20px 40px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 18px;
      font-weight: bold;
      z-index: 10001;
      pointer-events: none;
    `;

    document.body.appendChild(feedback);

    // Fade out and remove
    setTimeout(() => {
      feedback.style.transition = 'opacity 0.5s';
      feedback.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 500);
    }, 1000);
  }

  spawnTestEnemies() {
    if (!this.game) {
      console.error('No game instance available');
      return;
    }

    // Spawn 5 enemies in a circle around the player
    const playerTransform = this.player.getComponent('Transform');
    if (!playerTransform) return;

    const radius = 8;
    const count = 5;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = playerTransform.x + Math.cos(angle) * radius;
      const z = playerTransform.z + Math.sin(angle) * radius;

      // Spawn enemy using entityFactory
      this.game.entityFactory.createEnemy('basic_melee', {
        x: x,
        y: 0,
        z: z
      }).then(enemy => {
        this.game.engine.addEntity(enemy);
      });
    }

    this.showFeedback('Spawned 5 Test Enemies!');
  }

  changeGroundType(groundType) {
    if (!this.game || !this.game.levelSystem) {
      console.error('No game/levelSystem instance available');
      return;
    }

    // Access GroundSystem through LevelSystem -> EnvironmentSystem
    if (this.game.levelSystem.environmentSystem && this.game.levelSystem.environmentSystem.groundSystem) {
      this.game.levelSystem.environmentSystem.groundSystem.create(groundType);
      this.showFeedback(`Ground: ${this.formatSpellName(groundType)}`);
      console.log(`✅ Changed ground to: ${groundType}`);
    } else {
      console.error('GroundSystem not available');
    }
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';

    const toggleBtn = this.container.querySelector('button:last-child');
    if (toggleBtn) {
      toggleBtn.textContent = this.isVisible ? 'Hide Menu (F1)' : 'Show Menu (F1)';
    }
  }

  cleanup() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
