import * as THREE from 'three';
import { InstancedParticlePool as V1InstancedParticlePool } from '../../effects/V1InstancedParticlePool.js';

/**
 * Engine - Core game loop and entity management (Platform-agnostic)
 *
 * Responsibilities:
 * - Game loop (start, stop, pause, resume)
 * - Time management (delta time, total time)
 * - Entity lifecycle (add, remove, update)
 * - Event coordination
 *
 * NOT responsible for:
 * - Rendering (handled by Renderer)
 * - Input (handled by InputManager)
 * - Game logic (handled by Game layer)
 */
export class Engine {
  constructor() {
    // Entity management
    this.entities = [];

    // Engine state
    this.running = false;
    this.paused = false;
    this.time = 0;
    this.lastFrameTime = 0;

    // Callbacks
    this.onUpdate = null;  // Called every frame with dt
    this.onRender = null;  // Called every frame for rendering

    // Entity pool reference (set during init)
    this.entityPool = null;

    // V1 particle pools (for v1 compatibility)
    this.v1ParticlePools = new Map();
  }

  /**
   * Add an entity to the engine
   * @param {Object} entity - Entity to add
   */
  addEntity(entity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
  }

  /**
   * Remove an entity from the engine
   * @param {Object} entity - Entity to remove
   */
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }

  /**
   * Start the game loop
   */
  start() {
    this.running = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
  }

  /**
   * Pause the game
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume the game
   */
  resume() {
    this.paused = false;
    this.lastFrameTime = performance.now();
  }

  /**
   * Main game loop
   */
  gameLoop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.gameLoop);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Cap delta time to prevent huge jumps
    if (!this.paused && deltaTime < 0.1) {
      this.time += deltaTime;
      this.update(deltaTime);
    }

    this.render();
  }

  /**
   * Update all entities
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Call custom update callback if provided
    if (this.onUpdate) {
      this.onUpdate(dt);
    }

    // Update all active entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];

      // Remove inactive entities marked for removal
      if (!entity.active && entity.shouldRemove) {
        this.removeEntity(entity);
        continue;
      }

      // Update active entities
      if (entity.active && entity.update) {
        entity.update(dt);
      }
    }

    // Update V1 particle pools
    for (const pool of this.v1ParticlePools.values()) {
      pool.update(dt);
    }
  }

  /**
   * Render the scene
   */
  render() {
    // Call custom render callback if provided
    if (this.onRender) {
      this.onRender();
    }
  }

  /**
   * Get instanced particle pool (v1 compatibility)
   * @param {string} poolName - Name of the pool
   * @returns {V1InstancedParticlePool} V1 Instanced Particle pool
   */
  getInstancedParticlePool(poolName) {
    // Check if we already have this pool
    if (this.v1ParticlePools.has(poolName)) {
      return this.v1ParticlePools.get(poolName);
    }

    // Create a new V1 particle pool
    // Note: scene reference is set by the game layer
    if (!this.scene) {
      console.warn(`[Engine] Scene not set, cannot create particle pool: ${poolName}`);
      return {
        spawn: () => null,
        update: () => {},
        clear: () => {}
      };
    }

    // Use v1's configuration for particle pools (from GameEngine.js)
    const configs = {
      flames: { maxParticles: 2000, size: 0.8, blending: THREE.AdditiveBlending },
      ice: { maxParticles: 1000, size: 0.3, blending: THREE.AdditiveBlending },
      shadow: { maxParticles: 1000, size: 0.6, blending: THREE.AdditiveBlending },
      fire_explosion: { maxParticles: 1500, size: 0.5, blending: THREE.AdditiveBlending },
      lightning_explosion: { maxParticles: 1000, size: 0.4, blending: THREE.AdditiveBlending },
      generic: { maxParticles: 2000, size: 1.0, blending: THREE.AdditiveBlending }
    };

    const config = configs[poolName] || configs.generic;
    const pool = new V1InstancedParticlePool(this.scene, config);
    this.v1ParticlePools.set(poolName, pool);
    console.log(`[Engine] Created V1 instanced particle pool: ${poolName} with ${config.maxParticles} particles`);
    return pool;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.running = false;
    this.entities = [];
  }
}
