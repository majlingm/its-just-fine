/**
 * WaveSystem - Manages enemy waves and boss spawning
 *
 * Features:
 * - Progressive difficulty with multiple waves
 * - Wave counter and status display
 * - Boss spawning after all waves complete
 * - Configurable enemy types and spawn rates
 */

import { Enemy } from '../entities/Enemy.js';
import { BossEnemy } from '../entities/BossEnemy.js';

export class WaveSystem {
  constructor(game) {
    this.game = game;
    this.engine = game.engine;

    // Wave state
    this.currentWave = 0;
    this.totalWaves = 0;
    this.waveConfig = null;
    this.waveActive = false;
    this.waveCompleted = false;
    this.allWavesCompleted = false;
    this.bossSpawned = false;

    // Spawn timers
    this.spawnTimer = 0;
    this.waveStartDelay = 3.0; // Seconds between waves
    this.waveStartTimer = 0;

    // Wave stats
    this.enemiesSpawnedThisWave = 0;
    this.enemiesRemainingInWave = 0;

    // Callbacks
    this.onWaveStart = null;
    this.onWaveComplete = null;
    this.onAllWavesComplete = null;
    this.onBossSpawn = null;
  }

  /**
   * Initialize wave system with configuration
   * @param {Array} waves - Array of wave configurations
   */
  init(waves) {
    this.waveConfig = waves;
    this.totalWaves = waves.length;
    this.currentWave = 0;
    this.allWavesCompleted = false;
    this.bossSpawned = false;

    // Start first wave after delay
    this.waveStartTimer = this.waveStartDelay;
  }

  /**
   * Start the next wave
   */
  startNextWave() {
    // Check if this is survival mode (infinite waves)
    const isSurvival = this.game.levelConfig?.isSurvival;

    if (!isSurvival && this.currentWave >= this.totalWaves) {
      this.completeAllWaves();
      return;
    }

    // For survival mode, loop back to the wave config but scale difficulty
    const waveIndex = isSurvival ? 0 : this.currentWave;
    const wave = this.waveConfig[waveIndex];

    // Scale difficulty for survival mode
    const difficultyScale = isSurvival ? 1 + (this.currentWave * 0.15) : 1;

    this.waveActive = true;
    this.waveCompleted = false;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesRemainingInWave = Math.floor((wave.enemyCount || 0) * difficultyScale);
    this.currentWaveEnemyCount = this.enemiesRemainingInWave;
    this.spawnTimer = 0;
    this.currentDifficultyScale = difficultyScale;

    // console.log(`Wave ${this.currentWave + 1}${isSurvival ? ' (Survival)' : '/' + this.totalWaves} started!`);

    if (this.onWaveStart) {
      this.onWaveStart(this.currentWave + 1, isSurvival ? 999 : this.totalWaves);
    }
  }

  /**
   * Complete current wave
   */
  completeWave() {
    this.waveActive = false;
    this.waveCompleted = true;
    this.currentWave++;

    const isSurvival = this.game.levelConfig?.isSurvival;

    // console.log(`Wave ${this.currentWave}${isSurvival ? ' (Survival)' : '/' + this.totalWaves} completed!`);

    if (this.onWaveComplete) {
      this.onWaveComplete(this.currentWave, isSurvival ? 999 : this.totalWaves);
    }

    // In survival mode, always continue to next wave
    // In story mode, check if there are more waves
    if (isSurvival || this.currentWave < this.totalWaves) {
      this.waveStartTimer = this.waveStartDelay;
    } else {
      this.completeAllWaves();
    }
  }

  /**
   * Complete all waves and trigger boss
   */
  completeAllWaves() {
    this.allWavesCompleted = true;
    // console.log('All waves completed! Boss incoming...');

    if (this.onAllWavesComplete) {
      this.onAllWavesComplete();
    }

    // Spawn boss after short delay
    setTimeout(() => this.spawnBoss(), 2000);
  }

  /**
   * Spawn the boss
   */
  spawnBoss() {
    if (this.bossSpawned) return;

    this.bossSpawned = true;
    // console.log('Boss spawned!');

    if (this.onBossSpawn) {
      this.onBossSpawn();
    }
  }

  /**
   * Update wave system
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Wait for wave start delay
    if (!this.waveActive && this.waveStartTimer > 0) {
      this.waveStartTimer -= dt;
      if (this.waveStartTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    // Don't update if waves are complete or boss is active
    const isSurvival = this.game.levelConfig?.isSurvival;
    if (!isSurvival && this.allWavesCompleted) {
      return;
    }

    if (!this.waveActive) {
      return;
    }

    const waveIndex = isSurvival ? 0 : this.currentWave;
    const wave = this.waveConfig[waveIndex];

    // Update spawn timer
    this.spawnTimer += dt;

    // Spawn enemies based on wave configuration
    if (this.enemiesSpawnedThisWave < this.currentWaveEnemyCount) {
      if (this.spawnTimer >= wave.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnEnemiesFromWave(wave);
      }
    }

    // Check if wave is complete (10 or fewer enemies remaining)
    if (this.enemiesSpawnedThisWave >= this.currentWaveEnemyCount) {
      const aliveEnemies = this.countAliveEnemies();
      if (aliveEnemies <= 10) {
        // Check if we should spawn a boss (every 7 waves in survival)
        if (isSurvival && (this.currentWave + 1) % 7 === 0) {
          // console.log(`Wave ${this.currentWave + 1}: Spawning boss!`);
          // Reset boss spawned flag for survival mode
          this.bossSpawned = false;
          this.spawnBoss();
        }
        this.completeWave();
      }
    }
  }

  /**
   * Spawn enemies based on wave configuration
   * @param {object} wave - Wave configuration
   */
  spawnEnemiesFromWave(wave) {
    const enemiesToSpawn = Math.min(
      wave.spawnBatchSize || 1,
      this.currentWaveEnemyCount - this.enemiesSpawnedThisWave
    );

    // Determine if this batch spawns as a group or solo
    const groupSpawnChance = wave.groupSpawnChance !== undefined ? wave.groupSpawnChance : 0.5;
    const spawnAsGroup = Math.random() < groupSpawnChance;

    if (spawnAsGroup && enemiesToSpawn > 1) {
      // Spawn as tight group - pick one location for all
      const groupAngle = Math.random() * Math.PI * 2;
      const groupDist = 40 + Math.random() * 15;

      for (let i = 0; i < enemiesToSpawn; i++) {
        const enemyType = this.chooseEnemyType(wave.enemyTypes);
        // Small offset within group (tight cluster)
        const offsetAngle = groupAngle + (Math.random() - 0.5) * 0.3;
        const offsetDist = groupDist + (Math.random() - 0.5) * 5;
        this.spawnEnemy(enemyType, offsetAngle, offsetDist);
        this.enemiesSpawnedThisWave++;
      }
    } else {
      // Spawn scattered - each enemy in different location
      for (let i = 0; i < enemiesToSpawn; i++) {
        const enemyType = this.chooseEnemyType(wave.enemyTypes);
        this.spawnEnemy(enemyType);
        this.enemiesSpawnedThisWave++;
      }
    }
  }

  /**
   * Choose random enemy type based on spawn weights
   * @param {Array} enemyTypes - Array of {type, weight} objects
   * @returns {string} Enemy type
   */
  chooseEnemyType(enemyTypes) {
    const totalWeight = enemyTypes.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;

    for (const enemy of enemyTypes) {
      random -= enemy.weight;
      if (random <= 0) {
        // console.log('Chosen enemy type:', enemy.type);
        return enemy.type;
      }
    }

    // console.log('Fallback enemy type:', enemyTypes[0].type);
    return enemyTypes[0].type; // Fallback
  }

  /**
   * Spawn a single enemy
   * @param {string} type - Enemy type (normal, fast, elite)
   * @param {number} angle - Optional spawn angle
   * @param {number} dist - Optional spawn distance
   */
  spawnEnemy(type, angle = null, dist = null) {
    // Delegate to game's enemy spawning logic
    if (this.game.spawnEnemyByType) {
      this.game.spawnEnemyByType(type, angle, dist);
    }
  }

  /**
   * Count alive enemies (including bosses for wave completion)
   * @returns {number} Number of alive enemies
   */
  countAliveEnemies() {
    // Count directly from engine.entities since game.enemies is only updated once per frame
    let count = 0;
    for (const entity of this.engine.entities) {
      // Use instanceof instead of constructor.name to survive minification
      if ((entity instanceof Enemy || entity instanceof BossEnemy) && entity.active) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get current wave info
   * @returns {object} Wave info
   */
  getWaveInfo() {
    const isSurvival = this.game.levelConfig?.isSurvival;
    return {
      currentWave: this.currentWave + 1,
      totalWaves: isSurvival ? Infinity : this.totalWaves,
      waveActive: this.waveActive,
      allWavesCompleted: this.allWavesCompleted,
      bossSpawned: this.bossSpawned,
      enemiesRemaining: this.countAliveEnemies()
    };
  }

  /**
   * Reset wave system
   */
  reset() {
    this.currentWave = 0;
    this.waveActive = false;
    this.waveCompleted = false;
    this.allWavesCompleted = false;
    this.bossSpawned = false;
    this.enemiesSpawnedThisWave = 0;
    this.spawnTimer = 0;
    this.waveStartTimer = 0;
  }
}
