/**
 * SpawnSystem - Manages enemy spawning based on spawn configurations
 *
 * This system reads spawn configurations and spawns enemies according to:
 * - Wave definitions
 * - Spawn patterns and formations
 * - Triggers (wave complete, time-based, enemy count, etc.)
 * - Spawn animations
 * - Infinite mode scaling
 *
 * Config-First Design:
 * All spawn behavior is defined in JSON configs (src/config/spawns/*.json)
 * This system reads and executes those configs without hardcoding game data.
 *
 * Implementation Status:
 * ✅ Wave-based spawning
 * ✅ Spawn intervals/batching
 * ✅ Enemy type selection (weighted random)
 * ✅ Random scatter pattern
 * ✅ Wave complete trigger
 * ✅ Basic infinite mode scaling
 * ⏳ Spawn animations (TODO)
 * ⏳ Advanced spawn patterns (TODO)
 * ⏳ Group formations with linked movement (TODO)
 * ⏳ Other trigger types (TODO)
 * ⏳ Boss waves (TODO)
 * ⏳ Elite enemies (TODO)
 */

import { ComponentSystem } from '../../core/ecs/ComponentSystem.js';
import { configLoader } from '../../utils/ConfigLoader.js';
import { entityFactory } from '../entity/EntityFactory.js';

export class SpawnSystem extends ComponentSystem {
  constructor() {
    super([]); // Doesn't require specific components, manages spawning

    // Spawn state
    this.spawnConfig = null;
    this.currentWave = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesInWave = 0;

    // Infinite mode state
    this.infiniteLoopCount = 0;
    this.isInfiniteMode = false;

    // Cached entities
    this.playerEntity = null;
    this.activeEnemies = [];

    // Spawn queue
    this.spawnQueue = [];

    // System state
    this.initialized = false;
    this.startDelayTimer = 0;
    this.startDelayComplete = false;
    this.wavePauseTimer = 0;
    this.inWavePause = false;
  }

  /**
   * Initialize spawn system with a spawn configuration
   * @param {string} spawnConfigId - ID of spawn config to load (e.g., 'survival_basic')
   */
  async init(spawnConfigId) {
    console.log(`SpawnSystem: Loading spawn config '${spawnConfigId}'`);

    try {
      // Load spawn configuration
      this.spawnConfig = await configLoader.load(`spawns/${spawnConfigId}.json`);
      console.log(`SpawnSystem: Loaded spawn config:`, this.spawnConfig);

      // Validate config
      if (!this.spawnConfig.waves || this.spawnConfig.waves.length === 0) {
        throw new Error('Spawn config must have at least one wave');
      }

      // Reset state
      this.currentWave = 0;
      this.waveActive = false;
      this.infiniteLoopCount = 0;
      this.isInfiniteMode = false;
      this.startDelayComplete = false;
      this.startDelayTimer = 0;

      // Get start delay from config
      const startDelay = this.spawnConfig.globalSettings?.startDelay || 0;
      this.startDelayTimer = startDelay;

      this.initialized = true;
      console.log(`SpawnSystem: Initialized with ${this.spawnConfig.waves.length} waves`);
      console.log(`SpawnSystem: Start delay: ${startDelay}s`);
    } catch (error) {
      console.error(`SpawnSystem: Failed to load spawn config '${spawnConfigId}':`, error);
      throw error;
    }
  }

  /**
   * Override update to get ALL entities
   * @param {number} dt - Delta time
   * @param {Array<Entity>} allEntities - All entities in the game
   */
  update(dt, allEntities) {
    if (!this.initialized || !this.spawnConfig) {
      return;
    }

    // Find player entity
    if (!this.playerEntity) {
      this.playerEntity = allEntities.find(e => e.hasTag('player'));
      if (!this.playerEntity) {
        console.warn('SpawnSystem: No player entity found');
        return;
      }
    }

    // Update active enemies list
    this.activeEnemies = allEntities.filter(e => e.hasTag('enemy'));

    // Handle start delay
    if (!this.startDelayComplete) {
      this.startDelayTimer -= dt;
      if (this.startDelayTimer <= 0) {
        this.startDelayComplete = true;
        console.log('SpawnSystem: Start delay complete, ready to spawn');
      } else {
        return; // Still waiting
      }
    }

    // Handle wave pause
    if (this.inWavePause) {
      this.wavePauseTimer -= dt;
      if (this.wavePauseTimer <= 0) {
        this.inWavePause = false;
        console.log('SpawnSystem: Wave pause complete');
      } else {
        return; // Still in pause
      }
    }

    // Start first wave if not active
    if (!this.waveActive && this.currentWave === 0) {
      this.startWave(0);
    }

    // Process active wave
    if (this.waveActive) {
      this.processWave(dt, allEntities);
    }
  }

  /**
   * Start a wave
   * @param {number} waveIndex - Index of wave to start
   */
  startWave(waveIndex) {
    // Check if we should enter infinite mode
    if (this.spawnConfig.infiniteMode?.enabled &&
        waveIndex >= this.spawnConfig.waves.length) {

      if (!this.isInfiniteMode) {
        console.log('SpawnSystem: Entering infinite mode');
        this.isInfiniteMode = true;
        this.infiniteLoopCount = 0;
      }

      // Loop waves
      const loopWaves = this.spawnConfig.infiniteMode.loopWaves ||
                        Array.from({length: this.spawnConfig.waves.length}, (_, i) => i + 1);
      const loopIndex = this.infiniteLoopCount % loopWaves.length;
      const actualWaveNumber = loopWaves[loopIndex];
      waveIndex = actualWaveNumber - 1; // Convert to 0-based index

      this.infiniteLoopCount++;
      console.log(`SpawnSystem: Infinite mode loop ${this.infiniteLoopCount}, wave ${actualWaveNumber}`);
    }

    // Get wave config
    const wave = this.spawnConfig.waves[waveIndex];
    if (!wave) {
      console.warn(`SpawnSystem: No wave config for index ${waveIndex}`);
      return;
    }

    // Start wave
    this.currentWave = waveIndex;
    this.waveActive = true;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesInWave = wave.spawnRules.totalEnemies;

    console.log(`SpawnSystem: Starting wave ${wave.waveNumber}: ${wave.name}`);
    console.log(`  Total enemies: ${this.totalEnemiesInWave}`);
    console.log(`  Spawn interval: ${wave.spawnRules.spawnInterval}s`);
    console.log(`  Batch size: ${wave.spawnRules.spawnBatchSize}`);
  }

  /**
   * Process active wave
   * @param {number} dt - Delta time
   * @param {Array<Entity>} allEntities - All entities
   */
  processWave(dt, allEntities) {
    const wave = this.spawnConfig.waves[this.currentWave];
    if (!wave) {
      return;
    }

    this.waveTimer += dt;
    this.spawnTimer += dt;

    // Check if wave is complete
    if (this.enemiesSpawnedThisWave >= this.totalEnemiesInWave) {
      // All enemies spawned, check if all are defeated
      const enemiesRemaining = this.activeEnemies.length;
      const threshold = wave.spawnRules.waveCompleteThreshold || 0;

      if (enemiesRemaining <= threshold) {
        // Wave complete!
        console.log(`SpawnSystem: Wave ${wave.waveNumber} complete!`);
        this.waveActive = false;

        // Start wave pause
        const pauseDelay = this.spawnConfig.globalSettings?.wavePauseDelay || 5.0;
        this.wavePauseTimer = pauseDelay;
        this.inWavePause = true;
        console.log(`SpawnSystem: Starting wave pause for ${pauseDelay}s`);

        // Queue next wave
        const nextWaveIndex = this.currentWave + 1;
        setTimeout(() => {
          this.startWave(nextWaveIndex);
        }, pauseDelay * 1000);
      }
      return;
    }

    // Check if we should spawn next batch
    if (this.spawnTimer >= wave.spawnRules.spawnInterval) {
      this.spawnTimer = 0;

      // Calculate how many to spawn
      const batchSize = wave.spawnRules.spawnBatchSize;
      const remainingToSpawn = this.totalEnemiesInWave - this.enemiesSpawnedThisWave;
      const spawnCount = Math.min(batchSize, remainingToSpawn);

      // Check simultaneous limit
      const simultaneousMax = wave.spawnRules.simultaneousMax;
      const currentEnemies = this.activeEnemies.length;

      if (currentEnemies < simultaneousMax) {
        const canSpawn = Math.min(spawnCount, simultaneousMax - currentEnemies);

        if (canSpawn > 0) {
          this.spawnEnemies(wave, canSpawn, allEntities);
        }
      }
    }
  }

  /**
   * Spawn enemies for current wave
   * @param {object} wave - Wave configuration
   * @param {number} count - Number of enemies to spawn
   * @param {Array<Entity>} allEntities - All entities
   */
  spawnEnemies(wave, count, allEntities) {
    // Select enemy types based on weighted composition
    const enemies = this.selectEnemies(wave, count);

    // Spawn each enemy
    for (const enemyType of enemies) {
      this.spawnEnemy(wave, enemyType, allEntities);
    }
  }

  /**
   * Select which enemy types to spawn based on weighted random
   * @param {object} wave - Wave configuration
   * @param {number} count - Number to select
   * @returns {Array<string>} - Array of enemy type IDs
   */
  selectEnemies(wave, count) {
    const enemies = [];

    // Get total weight
    const totalWeight = wave.enemyComposition.reduce((sum, comp) => sum + comp.weight, 0);

    for (let i = 0; i < count; i++) {
      // Random value between 0 and totalWeight
      let random = Math.random() * totalWeight;

      // Select enemy based on weight
      for (const comp of wave.enemyComposition) {
        random -= comp.weight;
        if (random <= 0) {
          enemies.push(comp.enemyType);
          break;
        }
      }
    }

    return enemies;
  }

  /**
   * Spawn a single enemy
   * @param {object} wave - Wave configuration
   * @param {string} enemyType - Enemy type ID
   * @param {Array<Entity>} allEntities - All entities
   */
  async spawnEnemy(wave, enemyType, allEntities) {
    try {
      // Get spawn position
      const position = this.calculateSpawnPosition(wave);

      // Apply infinite mode scaling if active
      let enemyConfig = { ...position };
      if (this.isInfiniteMode) {
        enemyConfig = this.applyInfiniteScaling(enemyConfig);
      }

      // Create enemy entity
      const enemy = await entityFactory.createEnemy(enemyType, enemyConfig);

      // Add to game (this will be handled by the Engine)
      // For now, we'll emit an event that the game can listen to
      this.emitSpawnEvent(enemy);

      this.enemiesSpawnedThisWave++;
      console.log(`SpawnSystem: Spawned ${enemyType} at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}) [${this.enemiesSpawnedThisWave}/${this.totalEnemiesInWave}]`);
    } catch (error) {
      console.error(`SpawnSystem: Failed to spawn enemy '${enemyType}':`, error);
    }
  }

  /**
   * Calculate spawn position based on spawn pattern
   * @param {object} wave - Wave configuration
   * @returns {object} - Position {x, y, z}
   */
  calculateSpawnPosition(wave) {
    // For now, implement random scatter pattern (✅ IMPLEMENTED)
    // TODO: Implement other patterns (circle, arc, grid, offscreen)

    const playerTransform = this.playerEntity.getComponent('Transform');
    if (!playerTransform) {
      console.warn('SpawnSystem: Player has no Transform component');
      return { x: 0, y: 0.6, z: 0 };
    }

    // Get spawn distance settings
    const safeDistance = this.spawnConfig.globalSettings?.spawnSafeDistance || 40;
    const maxDistance = this.spawnConfig.globalSettings?.spawnMaxDistance || 55;

    // Random angle around player
    const angle = Math.random() * Math.PI * 2;

    // Random distance between safe and max
    const distance = safeDistance + Math.random() * (maxDistance - safeDistance);

    // Calculate position
    const x = playerTransform.x + Math.cos(angle) * distance;
    const z = playerTransform.z + Math.sin(angle) * distance;
    const y = 0.6; // Ground level (half enemy height)

    return { x, y, z };
  }

  /**
   * Apply infinite mode scaling to enemy config
   * @param {object} enemyConfig - Enemy configuration
   * @returns {object} - Scaled configuration
   */
  applyInfiniteScaling(enemyConfig) {
    const scaling = this.spawnConfig.infiniteMode.scaling;
    const loopCount = this.infiniteLoopCount;

    // Calculate multipliers
    const healthMult = 1 + (scaling.healthMultiplier * loopCount);
    const damageMult = 1 + (scaling.damageMultiplier * loopCount);
    const speedMult = 1 + (scaling.speedMultiplier * loopCount);
    const xpMult = 1 + (scaling.xpMultiplier * loopCount);

    // Apply scaling (EntityFactory will read these)
    return {
      ...enemyConfig,
      healthMultiplier: healthMult,
      damageMultiplier: damageMult,
      speedMultiplier: speedMult,
      xpMultiplier: xpMult
    };
  }

  /**
   * Emit spawn event for game to handle
   * @param {Entity} entity - Spawned entity
   */
  emitSpawnEvent(entity) {
    // Create custom event
    const event = new CustomEvent('enemy-spawned', {
      detail: { entity }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current wave info
   * @returns {object} - Wave info
   */
  getCurrentWaveInfo() {
    if (!this.waveActive || !this.spawnConfig) {
      return null;
    }

    const wave = this.spawnConfig.waves[this.currentWave];
    return {
      waveNumber: wave.waveNumber,
      name: wave.name,
      enemiesSpawned: this.enemiesSpawnedThisWave,
      totalEnemies: this.totalEnemiesInWave,
      enemiesRemaining: this.activeEnemies.length,
      isInfiniteMode: this.isInfiniteMode,
      infiniteLoopCount: this.infiniteLoopCount
    };
  }

  /**
   * Reset spawn system
   */
  reset() {
    this.currentWave = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesInWave = 0;
    this.infiniteLoopCount = 0;
    this.isInfiniteMode = false;
    this.startDelayComplete = false;
    this.startDelayTimer = 0;
    this.inWavePause = false;
    this.wavePauseTimer = 0;
    console.log('SpawnSystem: Reset');
  }
}
