/**
 * UISystem - Manages HUD and UI updates
 *
 * Responsibilities:
 * - Update health bar
 * - Update wave number
 * - Update enemy count
 * - Show wave messages
 * - Display game over screen
 *
 * This is NOT an ECS ComponentSystem - it's a UI management system
 * that reads game state and updates DOM elements.
 */

export class UISystem {
  constructor() {
    // DOM elements
    this.hudElement = null;
    this.healthFill = null;
    this.healthText = null;
    this.waveNumber = null;
    this.enemyCount = null;
    this.waveMessage = null;

    // Boss health bar elements
    this.bossHealthContainer = null;
    this.bossName = null;
    this.bossPhase = null;
    this.bossHealthFill = null;
    this.bossHealthText = null;

    // State tracking
    this.currentWave = 1;
    this.messageTimer = 0;
    this.messageDisplayTime = 3; // How long to show messages (seconds)
    this.currentBoss = null;
  }

  /**
   * Initialize UI system
   */
  init() {
    // Get DOM elements
    this.hudElement = document.getElementById('hud');
    this.healthFill = document.getElementById('health-fill');
    this.healthText = document.getElementById('health-text');
    this.waveNumber = document.getElementById('wave-number');
    this.enemyCount = document.getElementById('enemy-count');
    this.waveMessage = document.getElementById('wave-message');

    // Get boss health bar elements
    this.bossHealthContainer = document.getElementById('boss-health-container');
    this.bossName = document.getElementById('boss-name');
    this.bossPhase = document.getElementById('boss-phase');
    this.bossHealthFill = document.getElementById('boss-health-fill');
    this.bossHealthText = document.getElementById('boss-health-text');

    if (!this.hudElement) {
      console.error('HUD element not found!');
      return;
    }

    // Show HUD
    this.hudElement.classList.remove('hidden');

    console.log('✅ UI System initialized');
  }

  /**
   * Update UI based on game state
   * @param {number} dt - Delta time
   * @param {Object} gameState - Game state object
   */
  update(dt, gameState) {
    // Update message timer
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) {
        this.hideMessage();
      }
    }

    // Update health bar
    if (gameState.player) {
      this.updateHealth(gameState.player);
    }

    // Update wave number
    if (gameState.currentWave !== undefined && gameState.currentWave !== this.currentWave) {
      this.currentWave = gameState.currentWave;
      this.updateWave(gameState.currentWave);
      this.showMessage(`WAVE ${gameState.currentWave}`);
    }

    // Update enemy count
    if (gameState.enemyCount !== undefined) {
      this.updateEnemyCount(gameState.enemyCount);
    }

    // Update boss health bar
    if (gameState.boss) {
      this.updateBossHealth(gameState.boss);
    } else if (this.currentBoss) {
      // Boss was defeated or is no longer active
      this.hideBossHealth();
    }
  }

  /**
   * Update health bar display
   * @param {Entity} player - Player entity
   */
  updateHealth(player) {
    const health = player.getComponent('Health');
    if (!health) return;

    const percentage = (health.current / health.max) * 100;
    const healthPercent = Math.max(0, Math.min(100, percentage));

    if (this.healthFill) {
      this.healthFill.style.width = `${healthPercent}%`;
    }

    if (this.healthText) {
      this.healthText.textContent = `${Math.ceil(health.current)} / ${health.max}`;
    }

    // Change color based on health
    if (this.healthFill) {
      if (healthPercent > 60) {
        this.healthFill.style.background = 'linear-gradient(90deg, #00ff00, #66ff66)';
      } else if (healthPercent > 30) {
        this.healthFill.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc66)';
      } else {
        this.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff6666)';
      }
    }
  }

  /**
   * Update wave number display
   * @param {number} wave - Current wave number
   */
  updateWave(wave) {
    if (this.waveNumber) {
      this.waveNumber.textContent = wave;
    }
  }

  /**
   * Update enemy count display
   * @param {number} count - Number of enemies alive
   */
  updateEnemyCount(count) {
    if (this.enemyCount) {
      this.enemyCount.textContent = count;
    }
  }

  /**
   * Show a message to the player
   * @param {string} message - Message to display
   * @param {number} duration - How long to show (seconds)
   */
  showMessage(message, duration = 3) {
    if (this.waveMessage) {
      this.waveMessage.textContent = message;
      this.waveMessage.style.opacity = '1';
      this.messageTimer = duration;
    }
  }

  /**
   * Hide the current message
   */
  hideMessage() {
    if (this.waveMessage) {
      this.waveMessage.style.opacity = '0';
      this.waveMessage.textContent = '';
    }
    this.messageTimer = 0;
  }

  /**
   * Show game over screen
   * @param {Object} stats - Final game stats
   */
  showGameOver(stats) {
    const wave = stats.wave || 0;
    const enemiesKilled = stats.enemiesKilled || 0;

    this.showMessage(`GAME OVER\nWave: ${wave}\nKills: ${enemiesKilled}`, 999999);
  }

  /**
   * Hide HUD
   */
  hide() {
    if (this.hudElement) {
      this.hudElement.classList.add('hidden');
    }
  }

  /**
   * Show HUD
   */
  show() {
    if (this.hudElement) {
      this.hudElement.classList.remove('hidden');
    }
  }

  /**
   * Update boss health bar
   * @param {Entity} boss - Boss entity
   */
  updateBossHealth(boss) {
    const health = boss.getComponent('Health');
    const bossComponent = boss.getComponent('Boss');

    if (!health || !bossComponent) return;

    // Show boss health bar if not visible
    if (!this.currentBoss || this.currentBoss.id !== boss.id) {
      this.currentBoss = boss;
      this.showBossHealth(boss);
    }

    // Update health bar
    const percentage = (health.current / health.max) * 100;
    const healthPercent = Math.max(0, Math.min(100, percentage));

    if (this.bossHealthFill) {
      this.bossHealthFill.style.width = `${healthPercent}%`;
    }

    if (this.bossHealthText) {
      this.bossHealthText.textContent = `${Math.ceil(health.current)} / ${health.max}`;
    }

    // Update phase display
    if (this.bossPhase && bossComponent) {
      const phase = bossComponent.getCurrentPhase();
      const phaseNum = bossComponent.currentPhase + 1;
      const phaseName = phase ? phase.name : `Phase ${phaseNum}`;
      this.bossPhase.textContent = phaseName;

      // Change color based on phase
      if (bossComponent.enraged) {
        this.bossPhase.style.color = '#ff0000';
      } else {
        this.bossPhase.style.color = '#ffaa00';
      }
    }

    // Change health bar color based on health
    if (this.bossHealthFill) {
      if (healthPercent > 60) {
        this.bossHealthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff6666, #ffaa00)';
      } else if (healthPercent > 30) {
        this.bossHealthFill.style.background = 'linear-gradient(90deg, #ff6600, #ff9900)';
      } else {
        this.bossHealthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff3333)';
      }
    }
  }

  /**
   * Show boss health bar
   * @param {Entity} boss - Boss entity
   */
  showBossHealth(boss) {
    const bossComponent = boss.getComponent('Boss');

    if (this.bossHealthContainer) {
      this.bossHealthContainer.classList.add('visible');
    }

    if (this.bossName && bossComponent) {
      this.bossName.textContent = bossComponent.bossName.toUpperCase();
    }

    // Show warning message
    if (bossComponent) {
      this.showMessage(`⚠️ ${bossComponent.bossName.toUpperCase()} APPEARS! ⚠️`, 5);
    }
  }

  /**
   * Hide boss health bar
   */
  hideBossHealth() {
    if (this.bossHealthContainer) {
      this.bossHealthContainer.classList.remove('visible');
    }
    this.currentBoss = null;
  }

  /**
   * Clean up
   */
  cleanup() {
    this.hide();
    this.hideBossHealth();
  }
}
