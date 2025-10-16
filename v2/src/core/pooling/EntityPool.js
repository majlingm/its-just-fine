/**
 * EntityPool - Object pooling for entities
 *
 * Reduces garbage collection pressure by reusing entity objects
 * instead of constantly creating and destroying them.
 *
 * Benefits:
 * - Reduced GC pauses
 * - More predictable performance
 * - Lower memory allocation overhead
 *
 * Usage:
 * - acquireEntity() to get an entity from the pool
 * - releaseEntity() to return an entity to the pool
 */

import { Entity } from '../ecs/Entity.js';
import { OptimizationConfig } from '../../core/config/optimization.js';

export class EntityPool {
  constructor() {
    // Main pool (mixed entity types)
    this.pool = [];

    // Type-specific pools (e.g., 'enemy', 'projectile', 'particle')
    this.typedPools = new Map();

    // Statistics
    this.stats = {
      totalCreated: 0,
      totalAcquired: 0,
      totalReleased: 0,
      currentPoolSize: 0,
      currentActive: 0,
      poolHits: 0,
      poolMisses: 0
    };

    // Configuration
    this.config = OptimizationConfig.entityPooling;
  }

  /**
   * Initialize the pool
   */
  init() {
    if (!this.config.enabled) {
      console.log('⚠️  Entity pooling is disabled');
      return;
    }

    if (this.config.preWarmOnStart) {
      this.preWarm(this.config.initialPoolSize);
    }

    console.log(`✅ Entity pool initialized (size: ${this.config.initialPoolSize})`);
  }

  /**
   * Pre-warm the pool by creating initial entities
   * @param {number} count - Number of entities to create
   */
  preWarm(count) {
    for (let i = 0; i < count; i++) {
      const entity = new Entity();
      entity._pooled = true;
      this.pool.push(entity);
    }

    this.stats.totalCreated += count;
    this.stats.currentPoolSize = this.pool.length;

    if (this.config.debug) {
      console.log(`🔄 Pre-warmed entity pool with ${count} entities`);
    }
  }

  /**
   * Pre-warm a typed pool
   * @param {string} type - Entity type
   * @param {number} count - Number of entities to create
   */
  preWarmTyped(type, count) {
    if (!this.config.poolByType) return;

    if (!this.typedPools.has(type)) {
      this.typedPools.set(type, []);
    }

    const pool = this.typedPools.get(type);

    for (let i = 0; i < count; i++) {
      const entity = new Entity();
      entity._pooled = true;
      entity._poolType = type;
      pool.push(entity);
    }

    this.stats.totalCreated += count;

    if (this.config.debug) {
      console.log(`🔄 Pre-warmed typed pool '${type}' with ${count} entities`);
    }
  }

  /**
   * Acquire an entity from the pool
   * @param {string} type - Optional entity type for typed pools
   * @returns {Entity}
   */
  acquire(type = null) {
    // If pooling is disabled, create new entity
    if (!this.config.enabled) {
      return new Entity();
    }

    let entity = null;

    // Try typed pool first if type is specified
    if (type && this.config.poolByType) {
      const typedPool = this.typedPools.get(type);
      if (typedPool && typedPool.length > 0) {
        entity = typedPool.pop();
        this.stats.poolHits++;
      }
    }

    // Fall back to main pool
    if (!entity && this.pool.length > 0) {
      entity = this.pool.pop();
      this.stats.poolHits++;
    }

    // Create new entity if pool is empty
    if (!entity) {
      entity = new Entity();
      entity._pooled = true;
      entity._poolType = type;
      this.stats.totalCreated++;
      this.stats.poolMisses++;

      if (this.config.debug) {
        console.warn(`⚠️  Pool miss - created new entity (total: ${this.stats.totalCreated})`);
      }
    }

    // Reset entity state
    this.resetEntity(entity);

    // Update stats
    this.stats.totalAcquired++;
    this.stats.currentActive++;
    this.stats.currentPoolSize = this.pool.length;

    return entity;
  }

  /**
   * Release an entity back to the pool
   * @param {Entity} entity
   */
  release(entity) {
    if (!this.config.enabled) {
      return;
    }

    if (!entity._pooled) {
      // Entity wasn't from pool, mark it for pooling
      entity._pooled = true;
    }

    // Clean up entity
    this.cleanEntity(entity);

    // Return to appropriate pool
    const type = entity._poolType;
    if (type && this.config.poolByType) {
      if (!this.typedPools.has(type)) {
        this.typedPools.set(type, []);
      }

      const pool = this.typedPools.get(type);

      // Check max pool size
      if (pool.length < this.config.maxPoolSize) {
        pool.push(entity);
      } else if (this.config.debug) {
        console.warn(`⚠️  Typed pool '${type}' is full, discarding entity`);
      }
    } else {
      // Return to main pool
      if (this.pool.length < this.config.maxPoolSize) {
        this.pool.push(entity);
      } else if (this.config.debug) {
        console.warn(`⚠️  Main pool is full, discarding entity`);
      }
    }

    // Update stats
    this.stats.totalReleased++;
    this.stats.currentActive--;
    this.stats.currentPoolSize = this.pool.length;
  }

  /**
   * Reset entity to default state
   * @param {Entity} entity
   */
  resetEntity(entity) {
    // Clear components
    entity.components.clear();

    // Clear tags
    entity.tags.clear();

    // Reset state
    entity.active = true;
    entity.displayName = '';
    entity.entityType = '';

    // Don't reset _pooled and _poolType flags
  }

  /**
   * Clean entity before returning to pool
   * @param {Entity} entity
   */
  cleanEntity(entity) {
    // Remove all components
    for (const component of entity.components.values()) {
      // Clean up component resources if needed
      if (component.cleanup) {
        component.cleanup();
      }
    }

    entity.components.clear();
    entity.tags.clear();
    entity.active = false;
  }

  /**
   * Get pool statistics
   * @returns {Object}
   */
  getStats() {
    const typedPoolStats = {};
    for (const [type, pool] of this.typedPools) {
      typedPoolStats[type] = pool.length;
    }

    return {
      ...this.stats,
      mainPoolSize: this.pool.length,
      typedPools: typedPoolStats,
      hitRate: this.stats.totalAcquired > 0
        ? (this.stats.poolHits / this.stats.totalAcquired * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  /**
   * Clear all pools
   */
  clear() {
    this.pool = [];
    this.typedPools.clear();
    this.stats.currentPoolSize = 0;
    this.stats.currentActive = 0;

    if (this.config.debug) {
      console.log('🧹 Entity pools cleared');
    }
  }

  /**
   * Log pool statistics
   */
  logStats() {
    const stats = this.getStats();
    console.log('📊 Entity Pool Statistics:');
    console.log(`  Total Created: ${stats.totalCreated}`);
    console.log(`  Total Acquired: ${stats.totalAcquired}`);
    console.log(`  Total Released: ${stats.totalReleased}`);
    console.log(`  Currently Active: ${stats.currentActive}`);
    console.log(`  Main Pool Size: ${stats.mainPoolSize}`);
    console.log(`  Pool Hit Rate: ${stats.hitRate}`);
    console.log(`  Typed Pools:`, stats.typedPools);
  }
}

// Singleton instance
export const entityPool = new EntityPool();
