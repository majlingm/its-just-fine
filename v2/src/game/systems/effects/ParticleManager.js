/**
 * ParticleManager - Manages particle creation with configurable backend
 *
 * Supports two rendering modes:
 * 1. Entity-based (flexible, ECS-integrated, slower)
 * 2. InstancedMesh (GPU-accelerated, less flexible, faster)
 *
 * Mode selection is controlled by OptimizationConfig.particlePooling.useInstancedMesh
 */

import { ParticleSystem } from './ParticleSystem.js';
import { InstancedParticlePool } from '../../../core/pooling/InstancedParticlePool.js';
import { ResourceCache } from '../../../core/pooling/ResourceCache.js';
import { OptimizationConfig } from '../../../core/config/optimization.js';

export class ParticleManager {
  constructor(engine, renderer) {
    this.engine = engine;
    this.renderer = renderer;

    // Instanced particle pools (keyed by particle type/appearance)
    this.instancedPools = new Map();

    // Statistics
    this.stats = {
      entityParticles: 0,
      instancedParticles: 0,
      totalSpawned: 0
    };
  }

  /**
   * Create a single particle
   * @param {Object} config - Particle configuration
   * @returns {Entity|number} Entity or instance index
   */
  createParticle(config) {
    this.stats.totalSpawned++;

    if (OptimizationConfig.particlePooling.enabled &&
        OptimizationConfig.particlePooling.useInstancedMesh) {
      return this.createInstancedParticle(config);
    } else {
      return this.createEntityParticle(config);
    }
  }

  /**
   * Create a burst of particles
   * @param {Object} config - Burst configuration
   * @returns {Array<Entity|number>} Array of particles
   */
  createBurst(config) {
    if (OptimizationConfig.particlePooling.enabled &&
        OptimizationConfig.particlePooling.useInstancedMesh) {
      return this.createInstancedBurst(config);
    } else {
      return this.createEntityBurst(config);
    }
  }

  /**
   * Create an entity-based particle (original system)
   * @param {Object} config
   * @returns {Entity}
   */
  createEntityParticle(config) {
    this.stats.entityParticles++;
    return ParticleSystem.createParticle(this.engine, config);
  }

  /**
   * Create an entity-based burst (original system)
   * @param {Object} config
   * @returns {Array<Entity>}
   */
  createEntityBurst(config) {
    const particles = ParticleSystem.createBurst(this.engine, config);
    this.stats.entityParticles += particles.length;
    return particles;
  }

  /**
   * Create an instanced particle
   * @param {Object} config
   * @returns {number} Instance index
   */
  createInstancedParticle(config) {
    const pool = this.getOrCreatePool(config);
    const index = pool.spawn(config);

    if (index !== null) {
      this.stats.instancedParticles++;
    }

    return index;
  }

  /**
   * Create an instanced burst
   * @param {Object} config
   * @returns {Array<number>} Array of instance indices
   */
  createInstancedBurst(config) {
    const pool = this.getOrCreatePool(config);
    const indices = pool.spawnBurst(config);
    this.stats.instancedParticles += indices.length;
    return indices;
  }

  /**
   * Get or create an InstancedParticlePool for this particle type
   * @param {Object} config - Particle configuration
   * @returns {InstancedParticlePool}
   */
  getOrCreatePool(config) {
    // Generate pool key based on visual properties
    const poolKey = this.getPoolKey(config);

    if (this.instancedPools.has(poolKey)) {
      return this.instancedPools.get(poolKey);
    }

    // Create new pool
    const geometry = ResourceCache.getGeometry(
      config.modelType || 'sphere',
      this.getGeometryParams(config.modelType, config.scale || 0.2)
    );

    const material = ResourceCache.getParticleMaterial(config.startColor || 0xffffff);

    const pool = new InstancedParticlePool(this.renderer, {
      maxParticles: OptimizationConfig.particlePooling.instancesPerType,
      geometry: geometry,
      material: material,
      castShadow: false,
      receiveShadow: false
    });

    this.instancedPools.set(poolKey, pool);

    if (OptimizationConfig.particlePooling.debug) {
      console.log(`Created instanced particle pool: ${poolKey}`);
    }

    return pool;
  }

  /**
   * Generate a pool key based on particle appearance
   * @param {Object} config
   * @returns {string}
   */
  getPoolKey(config) {
    const modelType = config.modelType || 'sphere';
    const scale = config.scale || 0.2;
    const tag = config.tag || 'default';
    return `${modelType}_${scale.toFixed(2)}_${tag}`;
  }

  /**
   * Get geometry parameters based on model type and scale
   * @param {string} modelType
   * @param {number} scale
   * @returns {Object}
   */
  getGeometryParams(modelType, scale) {
    switch (modelType) {
      case 'sphere':
        return { radius: scale, widthSegments: 8, heightSegments: 6 };
      case 'box':
        return { width: scale, height: scale, depth: scale };
      default:
        return { radius: scale, widthSegments: 8, heightSegments: 6 };
    }
  }

  /**
   * Update all instanced particle pools
   * @param {number} dt - Delta time
   */
  update(dt) {
    if (OptimizationConfig.particlePooling.enabled &&
        OptimizationConfig.particlePooling.useInstancedMesh) {
      for (const pool of this.instancedPools.values()) {
        pool.update(dt);
      }
    }
  }

  /**
   * Get statistics for all pools
   * @returns {Object}
   */
  getStats() {
    const poolStats = {};
    let totalActive = 0;
    let totalCapacity = 0;

    for (const [key, pool] of this.instancedPools.entries()) {
      const stats = pool.getStats();
      poolStats[key] = stats;
      totalActive += stats.activeCount;
      totalCapacity += stats.maxParticles;
    }

    return {
      mode: OptimizationConfig.particlePooling.useInstancedMesh ? 'InstancedMesh' : 'Entity-based',
      entityParticles: this.stats.entityParticles,
      instancedParticles: this.stats.instancedParticles,
      totalSpawned: this.stats.totalSpawned,
      poolCount: this.instancedPools.size,
      totalActive: totalActive,
      totalCapacity: totalCapacity,
      utilizationRate: totalCapacity > 0 ? (totalActive / totalCapacity * 100).toFixed(1) + '%' : '0%',
      pools: poolStats
    };
  }

  /**
   * Clear all particles
   */
  clear() {
    for (const pool of this.instancedPools.values()) {
      pool.clear();
    }
  }

  /**
   * Dispose of all pools
   */
  dispose() {
    for (const pool of this.instancedPools.values()) {
      pool.dispose();
    }
    this.instancedPools.clear();
  }
}
