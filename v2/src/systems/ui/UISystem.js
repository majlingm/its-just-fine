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

    // State tracking
    this.currentWave = 1;
    this.messageTimer = 0;
    this.messageDisplayTime = 3; // How long to show messages (seconds)
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
   * Clean up
   */
  cleanup() {
    this.hide();
  }
}
