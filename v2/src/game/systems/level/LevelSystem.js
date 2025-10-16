import { EnvironmentSystem } from '../environment/EnvironmentSystem.js';
import { configLoader } from '../../../utils/ConfigLoader.js';

/**
 * LevelSystem - Manages game levels and progression
 *
 * Orchestrates level loading, environment setup, spawn configuration,
 * win conditions, difficulty scaling, and level progression.
 */
export class LevelSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.environmentSystem = new EnvironmentSystem(renderer);

    // Level state
    this.currentLevel = null;
    this.levelConfig = null;
    this.environmentConfig = null;
    this.spawnConfig = null;

    // Level status
    this.isActive = false;
    this.isCompleted = false;
    this.isFailed = false;

    // Progress tracking
    this.currentWave = 0;
    this.enemiesKilled = 0;
    this.survivalTime = 0;
    this.score = 0;
  }

  /**
   * Load a level by ID
   * @param {string} levelId - Level identifier
   * @returns {Promise} Resolves when level is loaded
   */
  async loadLevel(levelId) {
    try {
      // Load level config using configLoader
      this.levelConfig = await configLoader.load(`levels/${levelId}.json`);

      // Load environment config
      const environmentId = this.levelConfig.environment;
      this.environmentConfig = await configLoader.load(`environments/${environmentId}.json`);

      // Load spawn config
      const spawnId = this.levelConfig.spawnConfig;
      this.spawnConfig = await configLoader.load(`spawns/${spawnId}.json`);

      // Load environment
      await this.environmentSystem.load(this.environmentConfig);

      // Reset progress
      this.currentWave = 0;
      this.enemiesKilled = 0;
      this.survivalTime = 0;
      this.score = 0;
      this.isActive = false;
      this.isCompleted = false;
      this.isFailed = false;

      this.currentLevel = levelId;

      console.log(`Level loaded: ${this.levelConfig.name}`);
      return this.levelConfig;
    } catch (error) {
      console.error(`Failed to load level ${levelId}:`, error);
      throw error;
    }
  }

  /**
   * Start the current level
   */
  startLevel() {
    if (!this.levelConfig) {
      console.error('No level loaded');
      return;
    }

    this.isActive = true;
    this.currentWave = 1;

    console.log(`Level started: ${this.levelConfig.name}`);
  }

  /**
   * Get player start position and rotation
   * @returns {Object} Position and rotation vectors
   */
  getPlayerStart() {
    if (!this.levelConfig || !this.levelConfig.playerStart) {
      return {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      };
    }

    return this.levelConfig.playerStart;
  }

  /**
   * Get spawn configuration for current level
   * @returns {Object} Spawn configuration
   */
  getSpawnConfig() {
    return this.spawnConfig;
  }

  /**
   * Get environment system
   * @returns {EnvironmentSystem} The environment system instance
   */
  getEnvironmentSystem() {
    return this.environmentSystem;
  }

  /**
   * Get current difficulty multiplier based on wave
   * @returns {number} Difficulty multiplier
   */
  getDifficultyMultiplier() {
    if (!this.levelConfig || !this.levelConfig.difficulty) {
      return 1.0;
    }

    const { base, scaling } = this.levelConfig.difficulty;

    if (!scaling || !scaling.enabled) {
      return base;
    }

    // Calculate difficulty based on current wave
    const waveMultiplier = 1 + (this.currentWave - 1) * scaling.perWave;
    return base * waveMultiplier;
  }

  /**
   * Advance to next wave
   */
  nextWave() {
    this.currentWave++;
    console.log(`Wave ${this.currentWave} starting`);
  }

  /**
   * Register enemy kill
   * @param {string} enemyType - Type of enemy killed
   * @param {number} points - Points awarded
   */
  registerKill(enemyType, points = 10) {
    this.enemiesKilled++;
    this.score += points;

    // Check win conditions
    this.checkWinConditions();
  }

  /**
   * Update survival time
   * @param {number} deltaTime - Time since last update
   */
  updateTime(deltaTime) {
    if (this.isActive) {
      this.survivalTime += deltaTime;
    }
  }

  /**
   * Check if win conditions are met
   */
  checkWinConditions() {
    if (!this.levelConfig || !this.levelConfig.winningCriteria) {
      return;
    }

    const criteria = this.levelConfig.winningCriteria;

    switch (criteria.type) {
      case 'endless':
        // Endless mode - never wins, just tracks progress
        break;

      case 'survive_time':
        if (this.survivalTime >= criteria.time) {
          this.completeLevel();
        }
        break;

      case 'kill_count':
        if (this.enemiesKilled >= criteria.count) {
          this.completeLevel();
        }
        break;

      case 'waves':
        if (this.currentWave > criteria.waves) {
          this.completeLevel();
        }
        break;

      case 'boss_defeated':
        // Will be checked when boss is defeated
        break;

      default:
        console.warn(`Unknown win condition type: ${criteria.type}`);
    }
  }

  /**
   * Mark level as completed
   */
  completeLevel() {
    if (this.isCompleted) return;

    this.isCompleted = true;
    this.isActive = false;

    console.log(`Level completed: ${this.levelConfig.name}`);
    console.log(`Final Score: ${this.score}`);
    console.log(`Enemies Killed: ${this.enemiesKilled}`);
    console.log(`Survival Time: ${this.survivalTime.toFixed(2)}s`);
  }

  /**
   * Mark level as failed
   */
  failLevel() {
    if (this.isFailed) return;

    this.isFailed = true;
    this.isActive = false;

    console.log(`Level failed: ${this.levelConfig.name}`);
  }

  /**
   * Get level music configuration
   * @returns {Object} Music configuration
   */
  getMusicConfig() {
    if (!this.levelConfig || !this.levelConfig.music) {
      return null;
    }

    return this.levelConfig.music;
  }

  /**
   * Get current level information
   * @returns {Object} Level info
   */
  getLevelInfo() {
    if (!this.levelConfig) return null;

    return {
      id: this.currentLevel,
      name: this.levelConfig.name,
      description: this.levelConfig.description,
      type: this.levelConfig.type,
      wave: this.currentWave,
      kills: this.enemiesKilled,
      time: this.survivalTime,
      score: this.score,
      isActive: this.isActive,
      isCompleted: this.isCompleted,
      isFailed: this.isFailed,
      difficulty: this.getDifficultyMultiplier()
    };
  }

  /**
   * Get lives configuration
   * @returns {Object} Lives configuration
   */
  getLivesConfig() {
    if (!this.levelConfig || !this.levelConfig.lives) {
      return { enabled: false, count: 0 };
    }

    return this.levelConfig.lives;
  }

  /**
   * Get time limit configuration
   * @returns {Object} Time limit configuration
   */
  getTimeLimitConfig() {
    if (!this.levelConfig || !this.levelConfig.timeLimit) {
      return { enabled: false, seconds: 0 };
    }

    return this.levelConfig.timeLimit;
  }

  /**
   * Get powerups configuration
   * @returns {Object} Powerups configuration
   */
  getPowerupsConfig() {
    if (!this.levelConfig || !this.levelConfig.powerups) {
      return { enabled: true, spawnChance: 0.1 };
    }

    return this.levelConfig.powerups;
  }

  /**
   * Clean up current level
   */
  cleanup() {
    this.environmentSystem.cleanup();

    this.currentLevel = null;
    this.levelConfig = null;
    this.environmentConfig = null;
    this.spawnConfig = null;

    this.isActive = false;
    this.isCompleted = false;
    this.isFailed = false;

    this.currentWave = 0;
    this.enemiesKilled = 0;
    this.survivalTime = 0;
    this.score = 0;
  }
}
