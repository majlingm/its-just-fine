/**
 * ConfigLoader - Load and manage configuration files
 *
 * Handles loading JSON configuration files for entities, levels, waves, etc.
 * Provides caching and error handling.
 */
export class ConfigLoader {
  constructor() {
    // Cache loaded configs
    this.cache = new Map();

    // Base path for configs (game-specific configs)
    this.basePath = '/src/game/config';
  }

  /**
   * Load a configuration file
   * @param {string} path - Path to config file relative to config folder
   * @returns {Promise<Object>} Loaded configuration
   */
  async load(path) {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    try {
      // Construct full path
      const fullPath = path.startsWith('/') ? path : `${this.basePath}/${path}`;

      // Load JSON file
      const response = await fetch(fullPath);

      if (!response.ok) {
        throw new Error(`Failed to load config: ${path} (${response.status})`);
      }

      const config = await response.json();

      // Cache the config
      this.cache.set(path, config);

      return config;
    } catch (error) {
      console.error(`ConfigLoader: Error loading ${path}:`, error);
      throw error;
    }
  }

  /**
   * Load enemy configurations
   * @returns {Promise<Object>} Enemy configs
   */
  async loadEnemies() {
    return this.load('entities/enemies.json');
  }

  /**
   * Load boss configurations
   * @returns {Promise<Object>} Boss configs
   */
  async loadBosses() {
    return this.load('entities/bosses.json');
  }

  /**
   * Load level configuration
   * @param {string} levelId - Level ID
   * @returns {Promise<Object>} Level config
   */
  async loadLevel(levelId) {
    return this.load(`levels/${levelId}.json`);
  }

  /**
   * Load wave configuration
   * @param {string} waveId - Wave config ID
   * @returns {Promise<Object>} Wave config
   */
  async loadWaves(waveId) {
    return this.load(`waves/${waveId}.json`);
  }

  /**
   * Load spell configurations
   * @returns {Promise<Object>} Spell configs
   */
  async loadSpells() {
    return this.load('spells/spells.json');
  }

  /**
   * Load particle effect configurations
   * @returns {Promise<Object>} Particle effect configs
   */
  async loadParticleEffects() {
    return this.load('effects/particle_effects.json');
  }

  /**
   * Get a specific particle effect config by ID
   * @param {string} effectId - Effect ID
   * @returns {Promise<Object>} Particle effect config
   */
  async getParticleEffect(effectId) {
    const effects = await this.loadParticleEffects();
    const config = effects[effectId];

    if (!config) {
      throw new Error(`Particle effect config not found: ${effectId}`);
    }

    return config;
  }

  /**
   * Get a specific enemy config by ID
   * @param {string} enemyId - Enemy ID
   * @returns {Promise<Object>} Enemy config
   */
  async getEnemy(enemyId) {
    const enemies = await this.loadEnemies();
    const config = enemies[enemyId];

    if (!config) {
      throw new Error(`Enemy config not found: ${enemyId}`);
    }

    return config;
  }

  /**
   * Get a specific boss config by ID
   * @param {string} bossId - Boss ID
   * @returns {Promise<Object>} Boss config
   */
  async getBoss(bossId) {
    const bosses = await this.loadBosses();
    const config = bosses[bossId];

    if (!config) {
      throw new Error(`Boss config not found: ${bossId}`);
    }

    return config;
  }

  /**
   * Preload multiple configs
   * @param {Array<string>} paths - Array of config paths
   * @returns {Promise<Array>} Array of loaded configs
   */
  async preload(paths) {
    const promises = paths.map(path => this.load(path));
    return Promise.all(promises);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear specific cached config
   * @param {string} path - Config path to clear
   */
  clearCached(path) {
    this.cache.delete(path);
  }

  /**
   * Get cache size
   * @returns {number} Number of cached configs
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Singleton instance
export const configLoader = new ConfigLoader();
